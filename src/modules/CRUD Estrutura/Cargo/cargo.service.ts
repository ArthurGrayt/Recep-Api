// Importa os decorators e exceções necessárias do NestJS
import { Injectable, Logger, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
// Importa o serviço do Supabase para acesso ao banco de dados
import { SupabaseService } from '../../../supabase/supabase.service';
// Importa o DTO que define e valida os dados de entrada
import { CreateCargoDto } from './cargo.dto';
// Importa a biblioteca de similaridade de strings
import * as stringSimilarity from 'string-similarity';

// Marca a classe como um provedor injetável
@Injectable()
export class CargoService {
  // Instancia o Logger para registrar eventos
  private readonly logger = new Logger(CargoService.name);

  // Injeta o SupabaseService via construtor
  constructor(private readonly supabaseService: SupabaseService) {}

  // Método assíncrono para criar um novo cargo
  async criar(dto: CreateCargoDto) {
    this.logger.log(
      `Criando cargo "${dto.nome}" com verificação na empresa_cliente_id: ${dto.empresa_cliente_id}`,
    );

    const supabase = this.supabaseService.getClient();

    // ── Passo 1: Verifica se a empresa pai existe no banco ────────────────────────
    const { data: empresa, error: empresaError } = await supabase
      .from('empresa_cliente')
      .select('id')
      .eq('id', dto.empresa_cliente_id)
      .maybeSingle();

    if (empresaError) {
      this.logger.error(`Erro ao verificar empresa: ${empresaError.message}`);
      throw new InternalServerErrorException(`Erro ao verificar empresa: ${empresaError.message}`);
    }

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${dto.empresa_cliente_id} não encontrada.`);
    }

    // ── Passo 2: Verifica duplicata de nome (case-insensitive) no escopo da empresa ──
    // A tabela cargo não tem FK para empresa_cliente diretamente.
    // O caminho é: cargo ← cargo_setor_unidade → unidade_setor → unidade_cliente → empresa_cliente
    const { data: cargosDaEmpresa } = await supabase
      .from('cargo_setor_unidade')
      .select('cargo!inner(id, nome), unidade_setor!inner(unidade_cliente!inner(empresa_cliente_id))')
      .eq('unidade_setor.unidade_cliente.empresa_cliente_id', dto.empresa_cliente_id);

    const nomeLower = dto.nome.trim().toLowerCase();

    // 1. Checagem Exata (Case Insensitive)
    const duplicado = (cargosDaEmpresa || []).find((registro: any) => {
      // O Supabase pode tipar/retornar 'cargo' como array dependendo de como as FKs foram lidas
      const cargoObj = Array.isArray(registro.cargo) ? registro.cargo[0] : registro.cargo;
      return cargoObj?.nome?.toLowerCase() === nomeLower;
    });

    if (duplicado) {
      const duplicadoQualquer = duplicado as any;
      const cargoNome = Array.isArray(duplicadoQualquer.cargo) 
        ? duplicadoQualquer.cargo[0].nome 
        : duplicadoQualquer.cargo.nome;
        
      throw new ConflictException(
        `Já existe o cargo "${cargoNome}" vinculado a uma unidade desta empresa.`,
      );
    }

    // 2. Checagem de Similaridade e Substring
    if (!dto.force_create) {
      const nomesCargos = (cargosDaEmpresa || [])
        .map((registro: any) => {
          const cargoObj = Array.isArray(registro.cargo) ? registro.cargo[0] : registro.cargo;
          return cargoObj?.nome;
        })
        .filter((nome: any) => typeof nome === 'string'); // filtra nulos/undefined

      if (nomesCargos.length > 0) {
        const termoBuscado = dto.nome.trim();
        const termoBuscadoLower = termoBuscado.toLowerCase();
        
        // Usa o findBestMatch com todas as strings em lowercase para a biblioteca funcionar melhor
        const match = stringSimilarity.findBestMatch(
          termoBuscadoLower, 
          nomesCargos.map((n: string) => n.toLowerCase())
        );

        // Fallback para substring (Ex: "gama" não tem score alto com "gama-solutions", mas é substring!)
        const indexSubstring = nomesCargos.findIndex((n: string) => {
          const existenteLower = n.toLowerCase();
          return (termoBuscadoLower.length >= 3 && existenteLower.includes(termoBuscadoLower)) ||
                 (existenteLower.length >= 3 && termoBuscadoLower.includes(existenteLower));
        });

        // Aceita rating > 0.65 OU se for uma substring detectada
        if (match.bestMatch.rating > 0.65 || indexSubstring !== -1) {
          const similarIndex = indexSubstring !== -1 ? indexSubstring : match.bestMatchIndex;
          const nomeSimilar = nomesCargos[similarIndex];
          
          throw new ConflictException({
            requiresConfirmation: true,
            message: `Já existem tais itens com similaridade alta com "${termoBuscado}", deseja realmente adicionar esse Cargo?`,
            similarItem: nomeSimilar,
            rating: match.bestMatch.rating
          });
        }
      }
    }

    // ── Passo 3: Monta o payload com os campos da tabela cargo ───────────────────
    const payload: Record<string, any> = {
      nome: dto.nome.trim(),
    };

    if (dto.status !== undefined) {
      payload.status = dto.status;
    }

    // ── Passo 4: Executa o INSERT na tabela cargo ─────────────────────────────────
    const { data, error } = await supabase
      .from('cargo')
      .insert(payload)
      .select('id, nome, status')
      .single();

    if (error) {
      this.logger.error(`Erro ao criar cargo: ${error.message}`, error);

      if (error.code === '23505') {
        throw new ConflictException('Já existe um cargo com esses dados únicos no banco.');
      }

      throw new InternalServerErrorException(`Erro ao criar cargo: ${error.message}`);
    }

    this.logger.log(`Cargo criado com sucesso. ID: ${data.id}`);

    return {
      message: 'Cargo criado com sucesso.',
      data,
    };
  }
}
