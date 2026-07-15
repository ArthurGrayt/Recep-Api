# 🩺 Buscar Exames Feitos do Agendamento

Esta rota retorna exclusivamente a lista de exames que foram vinculados a um colaborador em uma data específica, percorrendo todas as salas (agendamentos parciais) automaticamente. Ela foi desenhada para resolver problemas de dessincronização no frontend e garantir que você consiga buscar a lista de exames limpa sem precisar carregar todo o agendamento de volta.

---

## 🔗 Endpoint

**`GET`** `/api/agendamentos/colaborador/:colaborador_id/agendamento/:agendamento_id/exames`

### 📋 Parâmetros de Rota (Path Params)

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `colaborador_id` | `UUID` | ID do colaborador associado ao agendamento. |
| `agendamento_id` | `Number` | ID de qualquer um dos agendamentos (salas) deste atendimento. |

---

## 📤 Resposta de Sucesso (200 OK)

A rota retorna um array contendo todos os exames realizados pelo colaborador naquela data. Caso não haja exames, retorna `[]`.

```json
[
  {
    "id": 866,
    "proced_id": 258,
    "procedimentos": {
      "nome": "AUDIOMETRIA TONAL E VOCAL"
    }
  },
  {
    "id": 867,
    "proced_id": 259,
    "procedimentos": {
      "nome": "AVALIAÇÃO VOCAL"
    }
  }
]
```

### 🗂️ Campos do Retorno

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `Number` | ID único da vinculação na tabela `exames_feitos`. |
| `proced_id` | `Number` | ID do procedimento/exame realizado. |
| `procedimentos.nome` | `String` | Nome legível do procedimento, extraído da tabela de procedimentos via foreign key. |

---

## ❌ Respostas de Erro

- **404 Not Found**
  - Caso o colaborador ou a data não tenham nenhum registro no banco.
- **500 Internal Server Error**
  - Falha na conexão com o Supabase ou erro de banco de dados.
