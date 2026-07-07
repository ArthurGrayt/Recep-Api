# 📅 Agendamentos: Busca de Registros

Este documento detalha o endpoint responsável por buscar os registros de agendamentos no banco de dados.
Ele suporta paginação e filtros opcionais por intervalo de datas. O retorno inclui todos os dados das colunas da tabela `agendamentos`.

------------------------------------------------------------------------------------------------------------------------

## 📋 Listar Agendamentos
> *Retorna a lista de agendamentos registrados no sistema, com suporte a paginação e filtro por data.*

**🪧 Endpoint**
`GET /agendamentos`

**📦 Query Params (Opcionais)**
* 🔹 **`page`**: Número da página (padrão: `1`).
* 🔹 **`limit`**: Quantidade de registros por página (padrão: `10`).
* 🔹 **`data_inicial`**: Filtra agendamentos a partir desta data (formato: `YYYY-MM-DD`). Se fornecida sem a data final, **busca os agendamentos apenas deste dia específico**.
* 🔹 **`data_final`**: Filtra agendamentos até esta data (formato: `YYYY-MM-DD`).
* 🔹 **`sala`**: Filtra agendamentos por uma sala específica pelo ID (ex: `2`).

*🔗 Exemplo de uso (Página 1, 20 itens por página, filtrando dia 03/07/2026 e apenas Sala 2):*
`GET https://recep-api.vercel.app/agendamentos?page=1&limit=20&data_inicial=2026-07-03&sala=2`

**⚙️ O que faz no banco de dados e API:**
Acessa a tabela `agendamentos` no banco de dados (Supabase). Calcula os índices de paginação (`range` de `from` até `to`) para o banco e aplica as restrições:
- Se houver `sala`, adiciona o filtro direto para a coluna (`= sala`).
- Se houver `data_inicial` e `data_final`, faz a busca pelo intervalo (`>= data_inicial` e `<= data_final`).
- Se houver **apenas** `data_inicial`, busca unicamente o dia passado (`= data_inicial`).
- Ordena os dados nativamente de forma decrescente pela `data_atendimento` e solicita também a contagem total de registros do filtro (`count: 'exact'`).

**✅ Retorno Esperado (200 OK)**
```json
{
  "data": [
    {
      "id": 1,
      "colaborador_id": "550e8400-e29b-41d4-a716-446655440000",
      "data_atendimento": "2026-07-03",
      "status": "pendente",
      "compareceu": null,
      "tipo": "Exame Admissional",
      "created_at": "2026-07-03T10:00:00Z",
      "ficha_url": null,
      "aso_liberado": null,
      "chegou_em": "09:30:00",
      "obs_agendamento": "Chegou cedo",
      "prioridade": false,
      "valor": 150.00,
      "metodo_pagamento": "PIX",
      "observacoes": null,
      "aso_url": null,
      "aso_feito": false,
      "enviado_empresa": false,
      "foto_obs": null,
      "aso_qtd_cobrar": 1,
      "rac_qtd_cobrar": 0,
      "observacoes_laboratorial": null,
      "exame_id": 10,
      "sala": 2,
      "unidade": 1,
      "prontuario_id": 50,
      "colaborador_nome": "João da Silva",
      "colaborador_cargo": "Auxiliar de Limpeza",
      "colaborador_setor": "RH",
      "colaborador_unidade": "Filial SP",
      "colaborador_empresa": "Gama Corp"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```
* 🔹 **`data`**: Array contendo todos os objetos retornados na busca. Além dos campos originais da tabela, cada objeto recebe os seguintes dados planificados do colaborador associado (retirados por *Joins*):
  * **`colaborador_nome`**: Nome do colaborador extraído da tabela `colaboradores`.
  * **`colaborador_cargo`**: Nome do cargo correspondente extraído de `cargo`.
  * **`colaborador_setor`**: Nome do setor extraído de `setor`.
  * **`colaborador_unidade`**: Nome da unidade extraído de `unidade_cliente`.
  * **`colaborador_empresa`**: Nome da empresa extraído de `empresa_cliente`.
* 🔹 **`meta`**: Metadados da paginação com o `total` de registros que correspondem à busca, página atual, limite estipulado e o total de páginas disponíveis.

------------------------------------------------------------------------------------------------------------------------
*Fim do fluxo.*
