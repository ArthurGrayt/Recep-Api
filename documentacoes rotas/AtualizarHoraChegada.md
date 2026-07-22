# Documentação da Rota: Atualizar Hora de Chegada

Esta rota permite atualizar ou remover especificamente a `hora_chegada` de um colaborador em um dia de atendimento. Além de salvar a informação na tabela `agendamentos`, o sistema busca automaticamente o ticket ativo gerado no dia e reflete a atualização de forma síncrona na tabela `fila_agendamentos` (painel de atendimento).

## 1. Informações Básicas
- **Método HTTP:** `PATCH`
- **Endpoint:** `/api/agendamentos/colaborador/:colaborador_id/data/:data_atendimento/hora-chegada`
- **Controlador:** `AgendamentosController` (`agendamentos.controller.ts`)
- **Serviço:** `AgendamentosService` (`agendamentos.service.ts` -> `updateHoraChegada`)

## 2. Parâmetros de Rota (Path Parameters)
| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `colaborador_id` | `string (UUID)` | O identificador único do colaborador |
| `data_atendimento` | `string (YYYY-MM-DD)` | A data alvo do agendamento |

## 3. Corpo da Requisição (Request Body)
Envie o payload contendo o valor da hora. Para remover a hora (ex: quando o compareceu for desmarcado), envie `null`.

**Exemplo de Payload:**
```json
{
  "hora_chegada": "2026-07-22T08:30:00.000Z"
}
```

## 4. Retorno (Response)
**Status 200 OK**
```json
{
  "message": "Hora de chegada atualizada com sucesso"
}
```

**Status 404 Not Found**
- Retornado caso não exista nenhum agendamento na data especificada para o colaborador informado.

**Status 500 Internal Server Error**
- Retornado caso ocorra falha de comunicação com o Supabase ao atualizar o agendamento ou o ticket da fila.

## 5. Lógica de Sincronização (Fila de Atendimento)
Quando esta rota é acionada, ela executa os seguintes passos:
1. **Atualiza a Base:** Atualiza o campo `hora_chegada` da tabela `agendamentos` para o `colaborador_id` e a `data_atendimento` em todas as salas daquele agendamento.
2. **Busca do Ticket:** Pesquisa na tabela `ticket_chamadas` pelo ticket emitido para aquele colaborador no intervalo das `00:00:00` até `23:59:59` da data referenciada.
3. **Reflete na Fila:** Caso encontre um `id_ticket` válido, atualiza imediatamente a coluna `hora_chegada` na tabela `fila_agendamentos`. Se a hora foi nula na requisição, ele limpa a tela da recepção; se for um horário válido, atualiza para esse novo horário.
