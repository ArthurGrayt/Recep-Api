import { Injectable, Logger, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import { CreateColaboradorDto, AlocarColaboradorDto } from './colaborador.dto';

@Injectable()
export class ColaboradorService {
  private readonly logger = new Logger(ColaboradorService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async criar(dto: CreateColaboradorDto) {
    this.logger.log(`Criando colaborador: "${dto.nome}"`);
    const supabase = this.supabaseService.getClient();

    if (dto.cpf) {
      const { data: existing } = await supabase
        .from('colaboradores')
        .select('id, cpf')
        .eq('cpf', dto.cpf.trim())
        .maybeSingle();

      if (existing) {
        throw new ConflictException(`Já existe um colaborador cadastrado com o CPF "${dto.cpf}".`);
      }
    }

    const payload: Record<string, any> = {
      nome: dto.nome.trim(),
      // Define a coluna ativo com o valor do dto.status, caso não enviado usa true
      ativo: dto.status !== undefined ? dto.status : true
    };

    // Mapeamento correto com fallbacks para evitar erros de NOT NULL no banco
    payload.cpf = dto.cpf ? dto.cpf.trim() : '';
    payload.data_nascimento = dto.data_nascimento || '1900-01-01';
    payload.sexo = dto.sexo ? dto.sexo.trim() : 'N/I';

    const { data, error } = await supabase
      .from('colaboradores')
      .insert(payload)
      .select('id, nome, cpf, data_nascimento, sexo')
      .single();

    if (error) {
      this.logger.error(`Erro ao criar colaborador: ${error.message}`, error);
      if (error.code === '23505') {
        throw new ConflictException('Já existe um colaborador com esses dados únicos no banco.');
      }
      throw new InternalServerErrorException(`Erro ao criar colaborador: ${error.message}`);
    }

    this.logger.log(`Colaborador criado com sucesso. ID: ${data.id}`);

    let mensagemAlocacao = '';
    let alocado = false;

    if (dto.unidade_id && dto.setor_id && dto.cargo_id) {
      try {
        await this.alocar(data.id, {
          unidade_id: dto.unidade_id,
          setor_id: dto.setor_id,
          cargo_id: dto.cargo_id
        });
        alocado = true;
        mensagemAlocacao = ' e alocado à unidade com sucesso';
      } catch (err) {
        this.logger.warn(`Colaborador ${data.id} criado, mas falhou ao alocar na criação: ${err.message}`);
        mensagemAlocacao = ', mas ocorreu um erro ao vinculá-lo à unidade/setor/cargo informados';
      }
    }

    return {
      message: `Colaborador criado com sucesso${mensagemAlocacao}.`,
      data: {
        ...data,
        alocado
      },
    };
  }

  async alocar(id: string, dto: AlocarColaboradorDto) {
    this.logger.log(`Alocando colaborador ID: ${id} para Unidade: ${dto.unidade_id}, Setor: ${dto.setor_id}, Cargo: ${dto.cargo_id}`);
    const supabase = this.supabaseService.getClient();

    // Verifica se o colaborador existe
    const { data: colab, error: errColab } = await supabase
      .from('colaboradores')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (errColab || !colab) {
      throw new NotFoundException(`Colaborador com ID ${id} não encontrado.`);
    }

    // 1. Procurar ou criar unidade_setor
    let unidadeSetorId: number;
    const { data: usData } = await supabase
      .from('unidade_setor')
      .select('id')
      .eq('unidade_id', dto.unidade_id)
      .eq('setor_id', dto.setor_id)
      .maybeSingle();

    if (usData) {
      unidadeSetorId = usData.id;
    } else {
      const { data: newUsData, error: errNewUs } = await supabase
        .from('unidade_setor')
        .insert({ unidade_id: dto.unidade_id, setor_id: dto.setor_id })
        .select('id').single();
      if (errNewUs) throw new InternalServerErrorException(`Erro ao criar unidade_setor: ${errNewUs.message}`);
      unidadeSetorId = newUsData.id;
    }

    // 2. Procurar ou criar cargo_setor_unidade
    let cargoSetorUnidadeId: number;
    const { data: csuData } = await supabase
      .from('cargo_setor_unidade')
      .select('id')
      .eq('unidade_setor_id', unidadeSetorId)
      .eq('cargo_id', dto.cargo_id)
      .maybeSingle();

    if (csuData) {
      cargoSetorUnidadeId = csuData.id;
    } else {
      const { data: newCsuData, error: errNewCsu } = await supabase
        .from('cargo_setor_unidade')
        .insert({ unidade_setor_id: unidadeSetorId, cargo_id: dto.cargo_id })
        .select('id').single();
      if (errNewCsu) throw new InternalServerErrorException(`Erro ao criar cargo_setor_unidade: ${errNewCsu.message}`);
      cargoSetorUnidadeId = newCsuData.id;
    }

    // 3. Verificar alocação atual
    const { data: alocacoesAtivas } = await supabase
      .from('colaborador_cargo_unidade_setor')
      .select('id, cargo_unidade_setor_id')
      .eq('colaborador_id', id)
      .eq('ativo', true);

    const alocacaoAtual = alocacoesAtivas && alocacoesAtivas.length > 0 ? alocacoesAtivas[0] : null;

    if (!alocacaoAtual || alocacaoAtual.cargo_unidade_setor_id !== cargoSetorUnidadeId) {
      if (alocacaoAtual) {
        await supabase
          .from('colaborador_cargo_unidade_setor')
          .update({ ativo: false, data_fim: new Date().toISOString() })
          .eq('id', alocacaoAtual.id);
      }
      
      const { error: errInsertAlocacao } = await supabase
        .from('colaborador_cargo_unidade_setor')
        .insert({
          colaborador_id: id,
          cargo_unidade_setor_id: cargoSetorUnidadeId,
          ativo: true,
          data_inicio: new Date().toISOString()
        });

      if (errInsertAlocacao) {
        throw new InternalServerErrorException(`Erro ao criar nova alocação: ${errInsertAlocacao.message}`);
      }
    }

    return {
      message: 'Colaborador alocado com sucesso.',
      data: {
        colaborador_id: id,
        unidade_id: dto.unidade_id,
        setor_id: dto.setor_id,
        cargo_id: dto.cargo_id
      }
    };
  }
}
