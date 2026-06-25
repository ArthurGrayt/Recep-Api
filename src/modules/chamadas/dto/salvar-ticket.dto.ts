export class SalvarTicketDto {
  // Identificador único do ticket — sempre obrigatório
  id_ticket: number;

  // Código visual do ticket exibido ao colaborador (ex: AG002) — sempre obrigatório
  ticket: string;

  // Tipo do ticket — sempre 'Agendado' ou 'Sem agendamento'
  tipo: string;

  // UUID do colaborador — opcional: só estará presente quando o tipo for 'Agendado'
  id_colaborador?: string;
}
