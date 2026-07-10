# 📋 Buscar Detalhes de um Agendamento

> *Busca todos os dados de um agendamento de um colaborador numa data específica, unificando exames de todas as salas num único objeto. Retorna também os dados completos do colaborador planificados — eliminando a necessidade de uma segunda chamada ao GET /colaboradores/:id.*

---

## 🪧 Endpoint

`GET /agendamentos/colaborador/:colaborador_id/data/:data_atendimento`

---

## 📦 Parâmetros de Rota (URL)

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `colaborador_id` | `string (UUID)` | ✅ | UUID do colaborador |
| `data_atendimento` | `string (YYYY-MM-DD)` | ✅ | Data do agendamento |

---

## 🔍 Query Params (Opcionais)

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `fields` | `string` | Lista de campos separados por vírgula que devem ser retornados. Se omitido, retorna tudo. |

### Exemplos de uso com `?fields`:

```
# Somente dados do colaborador e exames (modo edição do card)
GET /agendamentos/colaborador/:id/data/:data?fields=id,tipo,status,obs_agendamento,observacoes,observacoes_laboratorial,aso_qtd_cobrar,rac_qtd_cobrar,prioridade,exames_feitos,colaboradores

# Somente para preencher o header do card
GET /agendamentos/colaborador/:id/data/:data?fields=id,data_atendimento,tipo,colaboradores

# Somente a lista de exames
GET /agendamentos/colaborador/:id/data/:data?fields=exames_feitos

# Tudo (sem filtro — comportamento padrão)
GET /agendamentos/colaborador/:id/data/:data
```

---

## ✅ Retorno Esperado (200 OK)

```json
{
  "id": 15,
  "colaborador_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "sala": 1,
  "status": "pendente",
  "data_atendimento": "2026-07-07",
  "tipo": "Admissional",
  "metodo_pagamento": "PIX",
  "data_pagamento": "2026-07-09T14:30:00Z",
  "aso_liberado": null,
  "foto_obs": "https://url-supabase.com/foto123.jpg",
  "unidade": 42,
  "aso_qtd_cobrar": 1,
  "rac_qtd_cobrar": 0,
  "obs_agendamento": "Chegar com 10 min de antecedência",
  "observacoes": "Paciente com quadro prévio de labirintite",
  "observacoes_laboratorial": "Jejum rigoroso de 12 horas",
  "prioridade": false,
  "compareceu": false,
  "created_at": "2026-07-07T19:50:00Z",
  "colaboradores": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "nome": "João da Silva",
    "cpf": "12345678900",
    "data_nascimento": "1990-03-15",
    "sexo": "M",
    "funcao": "Ajudante de Pedreiro",
    "setor": "Operacional",
    "unidade": "Unidade Centro",
    "unidade_id": 3,
    "empresa": "Construtora XYZ Ltda",
    "empresa_id": 2
  },
  "exames_feitos": [
    {
      "id": 105,
      "proced_id": 1,
      "procedimentos": { "nome": "Avaliação Clínica" }
    },
    {
      "id": 106,
      "proced_id": 2,
      "procedimentos": { "nome": "Acuidade Visual" }
    },
    {
      "id": 107,
      "proced_id": 9,
      "procedimentos": { "nome": "Hemograma Completo" }
    }
  ]
}
```

---

## ⚙️ O que faz no banco de dados e na API

1. **Busca dos agendamentos:** Acessa a tabela `agendamentos` filtrando por `colaborador_id` e `data_atendimento`, obtendo todos os registros de todas as salas daquele dia.
2. **JOIN do colaborador:** Faz um join completo com `colaboradores` → `colaborador_cargo_unidade_setor` → `cargo_setor_unidade` → `cargo`, `setor`, `unidade_cliente`, `empresa_cliente` para trazer todos os dados planificados.
3. **JOIN dos exames:** Faz um join com `exames_feitos` e `procedimentos` de **todas as salas** do dia.
4. **Agregação:** Agrupa os exames de todas as salas num único array `exames_feitos` e usa os dados da **Sala 1** como base do retorno (pois ela armazena observações financeiras/médicas).
5. **Planificação do colaborador:** O objeto `colaboradores` retornado já vem com os dados navegados e planificados — sem aninhamento de joins — no mesmo formato do `GET /colaboradores/:id`.
6. **Filtro de campos (opcional):** Se o query param `?fields=` for informado, o retorno é reduzido a apenas os campos solicitados antes de enviar ao cliente.

---

## ⚠️ Notas importantes

- O `?fields` filtra apenas **campos de primeiro nível** do objeto (ex: `colaboradores`, `exames_feitos`, `status`). Não é possível filtrar subcampos internos do `colaboradores`.
- 🔹 **`valor` / `preco`**: Valor total cobrado.
- 🔹 **`metodo_pagamento`**: O método utilizado (Dinheiro, PIX, etc).
- 🔹 **`data_pagamento`**: A data do pagamento.
- 🔹 **`aso_liberado`**: Data/hora em que o médico liberou o ASO.
- 🔹 **`foto_obs`**: URL da imagem associada à observação médica (se houver).
- O banco sempre executa o SELECT completo com todos os joins. O filtro é aplicado **em memória** no retorno — o ganho é na largura de banda do payload, não no processamento do banco.
- Retorna `null` (404 implícito) caso não exista agendamento para o colaborador na data informada.
