// Importa os decorators e exceções necessárias do NestJS
import { Injectable, Logger, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
// Importa o serviço do Supabase para acesso ao banco de dados
import { SupabaseService } from '../../../supabase/supabase.service';
// Importa o DTO que define e valida os dados de entrada
import { CreateSetorDto } from './setor.dto';
// Importa a biblioteca de similaridade de strings
import * as stringSimilarity from 'string-similarity';

// Marca a classe como um provedor injetável no contexto do NestJS
@Injectable()
export class SetorService {
  // Instancia o Logger para registrar eventos e erros deste serviço
  private readonly logger = new Logger(SetorService.name);

  // Injeta o SupabaseService via construtor para executar operações no banco
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método assíncrono responsável por criar um novo setor com escopo de verificação por empresa
  async criar(dto: CreateSetorDto) {
    // Registra no log a tentativa de criação com os dados principais
    this.logger.log(
      `Criando setor "${dto.nome}" com verificação na empresa_cliente_id: ${dto.empresa_cliente_id}`,
    );

    // Obtém o cliente Supabase configurado para executar queries no banco
    const supabase = this.supabaseService.getClient();

    // ── Passo 1: Verifica se a empresa pai existe no banco ────────────────────────
    const { data: empresa, error: empresaError } = await supabase
      .from('empresa_cliente')
      // Seleciona apenas o id para confirmar existência sem buscar dados desnecessários
      .select('id')
      .eq('id', dto.empresa_cliente_id)
      // maybeSingle retorna null sem lançar erro caso não encontre registro
      .maybeSingle();

    // Se houve erro na consulta da empresa, lança exceção interna
    if (empresaError) {
      this.logger.error(`Erro ao verificar empresa: ${empresaError.message}`);
      throw new InternalServerErrorException(`Erro ao verificar empresa: ${empresaError.message}`);
    }

    // Se a empresa não existe no banco, retorna 404 com mensagem clara
    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${dto.empresa_cliente_id} não encontrada.`);
    }

    // ── Passo 2: Verifica duplicata de nome (case-insensitive) no escopo da empresa ──
    // A tabela setor não tem FK para empresa_cliente diretamente.
    // O caminho é: setor ← unidade_setor → unidade_cliente → empresa_cliente
    // Então buscamos setores que já estão vinculados a alguma unidade desta empresa
    const { data: setoresDaEmpresa } = await supabase
      .from('unidade_setor')
      // Faz o JOIN navegando: unidade_setor → setor e unidade_setor → unidade_cliente
      .select('setor!inner(id, nome), unidade_cliente!inner(empresa_cliente_id)')
      // Filtra apenas os vínculos de unidades que pertencem à empresa informada
      .eq('unidade_cliente.empresa_cliente_id', dto.empresa_cliente_id);

    // Verifica manualmente se algum setor vinculado tem o mesmo nome (case-insensitive)
    const nomeLower = dto.nome.trim().toLowerCase();

    // 1. Checagem Exata (Case Insensitive)
    const duplicado = (setoresDaEmpresa || []).find((registro: any) => {
      // O Supabase pode tipar/retornar 'setor' como array dependendo de como as FKs foram lidas
      const setorObj = Array.isArray(registro.setor) ? registro.setor[0] : registro.setor;
      return setorObj?.nome?.toLowerCase() === nomeLower;
    });

    // Se encontrou um setor com mesmo nome na empresa, lança 409 Conflict
    if (duplicado) {
      const duplicadoQualquer = duplicado as any;
      const setorNome = Array.isArray(duplicadoQualquer.setor) 
        ? duplicadoQualquer.setor[0].nome 
        : duplicadoQualquer.setor.nome;
        
      throw new ConflictException(
        `Já existe o setor "${setorNome}" vinculado a uma unidade desta empresa.`,
      );
    }

    // 2. Checagem de Similaridade e Substring
    if (!dto.force_create) {
      const nomesSetores = (setoresDaEmpresa || [])
        .map((registro: any) => {
          const setorObj = Array.isArray(registro.setor) ? registro.setor[0] : registro.setor;
          return setorObj?.nome;
        })
        .filter((nome: any) => typeof nome === 'string'); // filtra nulos/undefined

      if (nomesSetores.length > 0) {
        const termoBuscado = dto.nome.trim();
        const termoBuscadoLower = termoBuscado.toLowerCase();
        
        // Usa o findBestMatch com todas as strings em lowercase para a biblioteca funcionar melhor
        const match = stringSimilarity.findBestMatch(
          termoBuscadoLower, 
          nomesSetores.map((n: string) => n.toLowerCase())
        );

        // Fallback para substring (Ex: "gama" não tem score alto com "gama-solutions", mas é substring!)
        const indexSubstring = nomesSetores.findIndex((n: string) => {
          const existenteLower = n.toLowerCase();
          return (termoBuscadoLower.length >= 3 && existenteLower.includes(termoBuscadoLower)) ||
                 (existenteLower.length >= 3 && termoBuscadoLower.includes(existenteLower));
        });

        // Aceita rating > 0.65 OU se for uma substring detectada
        if (match.bestMatch.rating > 0.65 || indexSubstring !== -1) {
          const similarIndex = indexSubstring !== -1 ? indexSubstring : match.bestMatchIndex;
          const nomeSimilar = nomesSetores[similarIndex];
          
          throw new ConflictException({
            requiresConfirmation: true,
            message: `Já existem tais itens com similaridade alta com "${termoBuscado}", deseja realmente adicionar esse Setor?`,
            similarItem: nomeSimilar,
            rating: match.bestMatch.rating
          });
        }
      }
    }

    // ── Passo 3: Monta o payload com os campos da tabela setor ───────────────────
    const payload: Record<string, any> = {
      // Campo NOT NULL no banco — sempre presente e sem espaços extras nas bordas
      nome: dto.nome.trim(),
    };

    // Adiciona status ao payload somente se foi informado explicitamente
    // Se omitido, o banco aplica o default (true) automaticamente
    if (dto.status !== undefined) {
      payload.status = dto.status;
    }

    // ── Passo 4: Executa o INSERT na tabela setor ─────────────────────────────────
    // Nota: empresa_cliente_id NÃO é inserido na tabela setor (campo não existe nela)
    const { data, error } = await supabase
      .from('setor')
      // Insere o payload e solicita retorno completo do registro criado
      .insert(payload)
      // Seleciona os campos da tabela setor para retorno ao cliente
      .select('id, nome, status')
      // Garante que retorna um único objeto e não um array
      .single();

    // Se ocorreu algum erro no INSERT, trata e lança a exceção adequada
    if (error) {
      // Registra o erro completo no log do servidor para diagnóstico
      this.logger.error(`Erro ao criar setor: ${error.message}`, error);

      // Erro de violação de constraint única no Postgres
      if (error.code === '23505') {
        throw new ConflictException('Já existe um setor com esses dados únicos no banco.');
      }

      // Para outros erros inesperados, lança HTTP 500
      throw new InternalServerErrorException(`Erro ao criar setor: ${error.message}`);
    }

    // Registra a confirmação da criação com o ID gerado automaticamente pelo banco
    this.logger.log(`Setor criado com sucesso. ID: ${data.id}`);

    // Retorna a resposta formatada ao controller (HTTP 201)
    return {
      // Mensagem de feedback ao cliente da API
      message: 'Setor criado com sucesso.',
      // Dados completos do registro recém-inserido
      data,
    };
  }
}
