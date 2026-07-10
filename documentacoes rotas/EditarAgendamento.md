# ✏️ Editar Agendamento

Este documento detalha o endpoint responsável por editar as informações de um agendamento. Ele suporta atualizações parciais (PATCH), permitindo enviar apenas as propriedades que sofreram alteração, incluindo a lista unificada de exames.

------------------------------------------------------------------------------------------------------------------------

## 📋 Editar Informações do Agendamento

> *Atualiza os dados de todos os agendamentos associados a um colaborador em uma data específica. Os campos gerais são alterados em todas as salas, os campos financeiros/clínicos são salvos especificamente na Sala 1, e a lista de exames é reorganizada redistribuindo os procedimentos e criando/removendo salas conforme necessário.*

**🪧 Endpoint**
`PATCH /agendamentos/colaborador/:colaborador_id/data/:data_atendimento`

**📦 Parâmetros de Rota (URL)**
* 🔹 **`colaborador_id`**: O UUID do colaborador associado.
* 🔹 **`data_atendimento`**: A data de atendimento original do agendamento (formato: `YYYY-MM-DD`).

**📥 Exemplo de Payload (Corpo da Requisição)**
Pode-se enviar apenas uma propriedade ou a lista completa. Exemplo enviando alterações de status, observações e exames:
```json
{
  "status": "concluido",
  "obs_agendamento": "Chegou às 14h com guias impressas",
  "observacoes_laboratorial": "Jejum 12 horas confirmado.",
  "valor": 150.50,
  "metodo_pagamento": "PIX",
  "data_pagamento": "2026-07-09T14:30:00Z",
  "exames": [1, 2, 43]
}
```

**✅ Retorno Esperado (200 OK)**
```json
{
  "message": "Agendamento atualizado com sucesso"
}
```

**⚙️ O que faz no banco de dados e na API:**
1. **Busca e Validação:** Lê os agendamentos atuais daquele colaborador no dia especificado para garantir que existam e sirvam de fallback.
2. **Atualização Geral:** Atualiza campos de metadados gerais (`data_atendimento`, `tipo`, `unidade`, `status`, `compareceu`, `prioridade`) em todas as salas criadas para o colaborador na data original. O campo `compareceu` é opcional e usado para marcar presença no momento da atualização.
3. **Atualização Específica (Sala 1):** Salva campos relacionados a faturamento e anotações médicas (`aso_qtd_cobrar`, `rac_qtd_cobrar`, `obs_agendamento`, `observacoes`, `observacoes_laboratorial`, `preco/valor`, `metodo_pagamento`, `data_pagamento`) unicamente na linha correspondente à `sala 1`.
* 🔹 **`compareceu`**: Booleano indicando presença. Se enviado, será atualizado exclusivamente na `Sala 1`.
* 🔹 **`valor`**: Número decimal para o preço final. Se enviado, será atualizado exclusivamente na `Sala 1`.
* 🔹 **`metodo_pagamento`**: Método do pagamento (ex: "PIX", "Boleto"). Se enviado, será atualizado exclusivamente na `Sala 1`.
* 🔹 **`data_pagamento`**: Data e hora do pagamento em formato timestamptz. Se enviado, será atualizado exclusivamente na `Sala 1`.
* 🔹 **`prioridade`**: Booleano. Se enviado, será atualizado em todas as salas.
4. **Reorganização de Exames (Opcional):** Se o array `exames` for passado:
   * Mapeia os novos exames enviando-os para as salas correspondentes baseando-se nas categorias.
   * Cria registros de agendamento (`sala`) que não existiam mas agora contêm exames.
   * Deleta exames antigos e remove linhas de agendamentos de salas que ficaram sem procedimentos (exceto a Sala 1).
   * Vincula as novas relações na tabela `exames_feitos`.
