// Importa os decorators Injectable, Logger e as exceções padrão do NestJS
import { Injectable, Logger, ConflictException, InternalServerErrorException } from '@nestjs/common';
// Importa o serviço do Supabase para acesso ao banco de dados
import { SupabaseService } from '../../../supabase/supabase.service';
// Importa o DTO que define a estrutura e validações dos dados de entrada
import { CreateEmpresaDto } from './empresa.dto';
// Importa a biblioteca de similaridade de strings
import * as stringSimilarity from 'string-similarity';

// Marca a classe como um provedor injetável no contexto do NestJS
@Injectable()
export class EmpresaService {
  // Instancia o Logger para registrar eventos e erros deste serviço
  private readonly logger = new Logger(EmpresaService.name);

  // Injeta o SupabaseService via construtor para executar operações no banco
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método assíncrono responsável por criar uma nova empresa na tabela empresa_cliente
  async criar(dto: CreateEmpresaDto) {
    // Registra no log a tentativa de criação com a razão social fornecida
    this.logger.log(`Criando empresa com razão social: "${dto.razao_social}"`);

    // Obtém o cliente Supabase configurado para executar queries no banco
    const supabase = this.supabaseService.getClient();

    // Verifica se já existe uma empresa com o mesmo documento antes de inserir
    if (dto.documento) {
      // Busca na tabela empresa_cliente por um registro com o mesmo documento
      const { data: existing } = await supabase
        .from('empresa_cliente')
        .select('id, documento')
        .eq('documento', dto.documento.trim())
        // Usa maybeSingle para retornar null se não encontrar (sem lançar erro)
        .maybeSingle();

      // Se já existir um registro com esse documento, lança conflito (HTTP 409)
      if (existing) {
        throw new ConflictException(`Já existe uma empresa cadastrada com o documento "${dto.documento}".`);
      }
    }

    // ── Verificação de duplicata ou similaridade da Razão Social ──
    const { data: todasEmpresas } = await supabase.from('empresa_cliente').select('razao_social');
    
    if (todasEmpresas && todasEmpresas.length > 0) {
      const razaoSocialLower = dto.razao_social.trim().toLowerCase();
      
      // 1. Checagem Exata (Case Insensitive)
      const duplicataExata = todasEmpresas.find(
        (e: any) => e.razao_social?.toLowerCase() === razaoSocialLower
      );
      if (duplicataExata) {
        throw new ConflictException(`Já existe uma empresa cadastrada com a razão social "${duplicataExata.razao_social}".`);
      }

      // 2. Checagem de Similaridade e Substring
      if (!dto.force_create) {
        const nomesEmpresas = todasEmpresas
          .map((e: any) => e.razao_social)
          .filter((nome: any) => typeof nome === 'string'); // filtra nulos/undefined

        if (nomesEmpresas.length > 0) {
          const termoBuscado = dto.razao_social.trim();
          const termoBuscadoLower = termoBuscado.toLowerCase();
          
          // Usa o findBestMatch com todas as strings em lowercase para a biblioteca funcionar melhor
          const match = stringSimilarity.findBestMatch(
            termoBuscadoLower, 
            nomesEmpresas.map(n => n.toLowerCase())
          );

          // Fallback para substring (Ex: "gama" não tem score alto com "gama-solutions", mas é substring!)
          const indexSubstring = nomesEmpresas.findIndex(n => {
            const existenteLower = n.toLowerCase();
            return (termoBuscadoLower.length >= 3 && existenteLower.includes(termoBuscadoLower)) ||
                   (existenteLower.length >= 3 && termoBuscadoLower.includes(existenteLower));
          });

          // Aceita rating > 0.65 OU se for uma substring detectada
          if (match.bestMatch.rating > 0.65 || indexSubstring !== -1) {
            const similarIndex = indexSubstring !== -1 ? indexSubstring : match.bestMatchIndex;
            const nomeSimilar = nomesEmpresas[similarIndex];
            
            // Retorna o 409 com o objeto customizado pedido pelo front-end
            throw new ConflictException({
              requiresConfirmation: true,
              message: `Já existem tais itens com similaridade alta com "${termoBuscado}", deseja realmente adicionar essa Empresa?`,
              similarItem: nomeSimilar,
              rating: match.bestMatch.rating
            });
          }
        }
      }
    }

    // Monta o payload com o campo obrigatório
    const payload: Record<string, any> = {
      // Campo NOT NULL no banco — sempre presente e sem espaços extras
      razao_social: dto.razao_social.trim(),
    };

    // Adiciona documento ao payload somente se foi fornecido
    if (dto.documento) {
      payload.documento = dto.documento.trim();
    }

    // Adiciona address ao payload somente se foi fornecido
    if (dto.address) {
      payload.address = dto.address.trim();
    }

    // Adiciona complemento ao payload somente se foi fornecido
    if (dto.complemento) {
      payload.complemento = dto.complemento.trim();
    }

    // Adiciona email ao payload somente se foi fornecido
    if (dto.email) {
      payload.email = dto.email.trim().toLowerCase();
    }

    // Adiciona tel ao payload somente se foi fornecido
    if (dto.tel) {
      payload.tel = dto.tel.trim();
    }

    // Adiciona status ao payload — se não foi enviado, o banco aplica o default (true)
    if (dto.status !== undefined) {
      payload.status = dto.status;
    }

    // Executa o INSERT na tabela empresa_cliente com os dados do payload
    const { data, error } = await supabase
      .from('empresa_cliente')
      // Insere o objeto e solicita retorno do registro completo criado
      .insert(payload)
      // Seleciona todos os campos relevantes para retornar ao cliente
      .select('id, razao_social, documento, address, complemento, email, tel, status')
      // Garante que retorna um único objeto, não um array
      .single();

    // Se ocorrer algum erro durante o INSERT, trata e lança a exceção adequada
    if (error) {
      // Registra o erro completo no log do servidor para diagnóstico
      this.logger.error(`Erro ao criar empresa: ${error.message}`, error);

      // Erro de violação de constraint única no Postgres (ex: documento duplicado via index)
      if (error.code === '23505') {
        throw new ConflictException('Já existe um registro com esses dados únicos no banco.');
      }

      // Para erros inesperados, lança HTTP 500 com a mensagem do banco
      throw new InternalServerErrorException(`Erro ao criar empresa: ${error.message}`);
    }

    // Registra a confirmação da criação com o ID gerado automaticamente pelo banco
    this.logger.log(`Empresa criada com sucesso. ID: ${data.id}`);

    // Cria obrigatoriamente a Unidade Matriz para a empresa recém-criada
    const { error: errUnidade } = await supabase
      .from('unidade_cliente')
      .insert({
        empresa_cliente_id: data.id,
        razao_social: `${data.razao_social} - Matriz`,
        documento: data.documento || null,
        address: data.address || null,
        complemento: data.complemento || null,
        tel: data.tel || null,
        status: true,
      });

    if (errUnidade) {
      this.logger.error(`Aviso: A empresa foi criada, mas falhou ao criar a Unidade Matriz: ${errUnidade.message}`);
      // Lança um erro para não deixar a empresa orfã e avisar o frontend, ou apenas prossegue?
      // Pela especificação "obrigatoriamente", podemos retornar uma observação na mensagem.
    }

    // Retorna a resposta formatada ao controller (HTTP 201)
    return {
      // Mensagem de feedback ao cliente da API
      message: errUnidade 
        ? 'Empresa criada, mas ocorreu um erro ao gerar a unidade Matriz.' 
        : 'Empresa e unidade Matriz criadas com sucesso.',
      // Dados completos do registro recém-inserido
      data,
    };
  }
}

