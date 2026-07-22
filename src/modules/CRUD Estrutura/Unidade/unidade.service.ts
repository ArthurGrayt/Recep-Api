// Importa os decorators e exceções necessárias do NestJS
import { Injectable, Logger, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
// Importa o serviço do Supabase para acesso ao banco de dados
import { SupabaseService } from '../../../supabase/supabase.service';
// Importa o DTO que define e valida os dados de entrada
import { CreateUnidadeDto } from './unidade.dto';
// Importa a biblioteca de similaridade de strings
import * as stringSimilarity from 'string-similarity';

// Marca a classe como um provedor injetável no contexto do NestJS
@Injectable()
export class UnidadeService {
  // Instancia o Logger para registrar eventos e erros deste serviço
  private readonly logger = new Logger(UnidadeService.name);

  // Injeta o SupabaseService via construtor para executar operações no banco
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método assíncrono responsável por criar uma nova unidade dentro de uma empresa
  async criar(dto: CreateUnidadeDto) {
    // Registra no log a tentativa de criação com os dados principais
    this.logger.log(
      `Criando unidade "${dto.razao_social}" para empresa_cliente_id: ${dto.empresa_cliente_id}`,
    );

    // Obtém o cliente Supabase configurado para executar queries no banco
    const supabase = this.supabaseService.getClient();

    // ── Passo 1: Verifica se a empresa pai existe no banco ────────────────────────
    const { data: empresa, error: empresaError } = await supabase
      .from('empresa_cliente')
      // Seleciona apenas o id para confirmar existência — economiza tráfego
      .select('id')
      .eq('id', dto.empresa_cliente_id)
      // maybeSingle retorna null sem lançar erro caso não encontre
      .maybeSingle();

    // Se houve erro na consulta da empresa, lança exceção interna
    if (empresaError) {
      this.logger.error(`Erro ao verificar empresa: ${empresaError.message}`);
      throw new InternalServerErrorException(`Erro ao verificar empresa: ${empresaError.message}`);
    }

    // Se a empresa não existe, lança 404 para feedback claro ao cliente da API
    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${dto.empresa_cliente_id} não encontrada.`);
    }

    // ── Passo 2: Verifica duplicata de razao_social na mesma empresa (case-insensitive) ou similaridade ─
    const { data: todasUnidades } = await supabase
      .from('unidade_cliente')
      .select('id, razao_social')
      // Filtra pelo mesmo empresa_cliente_id para escopo correto
      .eq('empresa_cliente_id', dto.empresa_cliente_id);

    if (todasUnidades && todasUnidades.length > 0) {
      const razaoSocialLower = dto.razao_social.trim().toLowerCase();

      // 1. Checagem Exata (Case Insensitive)
      const duplicataExata = todasUnidades.find(
        (u: any) => u.razao_social?.toLowerCase() === razaoSocialLower
      );

      // Se já existir uma unidade com esse nome na mesma empresa, lança 409 Conflict
      if (duplicataExata) {
        throw new ConflictException(
          `Já existe uma unidade chamada "${duplicataExata.razao_social}" vinculada a esta empresa.`,
        );
      }

      // 2. Checagem de Similaridade e Substring
      if (!dto.force_create) {
        const nomesUnidades = todasUnidades
          .map((u: any) => u.razao_social)
          .filter((nome: any) => typeof nome === 'string'); // filtra nulos/undefined

        if (nomesUnidades.length > 0) {
          const termoBuscado = dto.razao_social.trim();
          const termoBuscadoLower = termoBuscado.toLowerCase();
          
          // Usa o findBestMatch com todas as strings em lowercase para a biblioteca funcionar melhor
          const match = stringSimilarity.findBestMatch(
            termoBuscadoLower, 
            nomesUnidades.map(n => n.toLowerCase())
          );

          // Fallback para substring (Ex: "gama" não tem score alto com "gama-solutions", mas é substring!)
          const indexSubstring = nomesUnidades.findIndex(n => {
            const existenteLower = n.toLowerCase();
            return (termoBuscadoLower.length >= 3 && existenteLower.includes(termoBuscadoLower)) ||
                   (existenteLower.length >= 3 && termoBuscadoLower.includes(existenteLower));
          });

          // Aceita rating > 0.65 OU se for uma substring detectada
          if (match.bestMatch.rating > 0.65 || indexSubstring !== -1) {
            const similarIndex = indexSubstring !== -1 ? indexSubstring : match.bestMatchIndex;
            const nomeSimilar = nomesUnidades[similarIndex];
            
            // Retorna o 409 com o objeto customizado pedido pelo front-end
            throw new ConflictException({
              requiresConfirmation: true,
              message: `Já existem tais itens com similaridade alta com "${termoBuscado}", deseja realmente adicionar essa Unidade?`,
              similarItem: nomeSimilar,
              rating: match.bestMatch.rating
            });
          }
        }
      }
    }

    // ── Passo 3: Monta o payload com os campos presentes no DTO ──────────────────
    const payload: Record<string, any> = {
      // Campo NOT NULL no banco — sempre presente e sem espaços extras nas bordas
      razao_social: dto.razao_social.trim(),
      // FK obrigatória que vincula a unidade à empresa pai
      empresa_cliente_id: dto.empresa_cliente_id,
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

    // Adiciona tel ao payload somente se foi fornecido
    if (dto.tel) {
      payload.tel = dto.tel.trim();
    }

    // Adiciona status ao payload — se não enviado, o banco aplica o default (true)
    if (dto.status !== undefined) {
      payload.status = dto.status;
    }

    // ── Passo 4: Executa o INSERT na tabela unidade_cliente ───────────────────────
    const { data, error } = await supabase
      .from('unidade_cliente')
      // Insere o payload e solicita o retorno completo do registro criado
      .insert(payload)
      // Seleciona todos os campos relevantes da unidade recém-criada
      .select('id, razao_social, documento, address, complemento, tel, status, empresa_cliente_id')
      // Garante que retorna um único objeto, não um array
      .single();

    // Se ocorreu algum erro no INSERT, trata e lança a exceção adequada
    if (error) {
      // Registra o erro completo no log do servidor para diagnóstico
      this.logger.error(`Erro ao criar unidade: ${error.message}`, error);

      // Erro de violação de constraint única no Postgres (ex: duplicata via index único)
      if (error.code === '23505') {
        throw new ConflictException('Já existe uma unidade com esses dados únicos no banco.');
      }

      // Erro de violação de FK — empresa_cliente_id inválido no banco
      if (error.code === '23503') {
        throw new NotFoundException(`Empresa com ID ${dto.empresa_cliente_id} não encontrada no banco.`);
      }

      // Para outros erros inesperados, lança HTTP 500
      throw new InternalServerErrorException(`Erro ao criar unidade: ${error.message}`);
    }

    // Registra a confirmação da criação com o ID gerado automaticamente pelo banco
    this.logger.log(`Unidade criada com sucesso. ID: ${data.id}`);

    // Retorna a resposta formatada ao controller (HTTP 201)
    return {
      // Mensagem de feedback ao cliente da API
      message: 'Unidade criada com sucesso.',
      // Dados completos do registro recém-inserido
      data,
    };
  }
}
