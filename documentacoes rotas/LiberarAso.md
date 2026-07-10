# 📝 Liberar ASO

Este documento detalha o endpoint focado exclusivamente em adicionar, atualizar ou remover a data de liberação do ASO (Atestado de Saúde Ocupacional).

------------------------------------------------------------------------------------------------------------------------

## 📋 Adicionar ou Atualizar Data de Liberação do ASO

> *Atualiza especificamente a coluna `aso_liberado` do agendamento correspondente na `Sala 1` para registrar a data em que o médico liberou o ASO do colaborador.*

**🪧 Endpoint**
`PATCH /agendamentos/colaborador/:colaborador_id/data/:data_atendimento/liberar-aso`

**📦 Parâmetros de Rota (URL)**
* 🔹 **`colaborador_id`**: O UUID do colaborador associado.
* 🔹 **`data_atendimento`**: A data original de atendimento do agendamento (formato: `YYYY-MM-DD`).

**📥 Payload (Body)**

**Cenário 1: Definindo ou Atualizando a Data**
```json
{
  "aso_liberado": "2026-07-09T14:30:00Z"
}
```

**Cenário 2: Removendo a Data (Desfazendo a liberação)**
```json
{
  "aso_liberado": null
}
```

* 🔹 **`aso_liberado`**: String contendo a data (pode ser data/hora completa ou apenas data, de acordo com o padrão do frontend) ou `null` caso deseje remover a liberação atual.

**✅ Retorno Esperado (200 OK)**
```json
{
  "message": "Data de liberação do ASO atualizada com sucesso",
  "aso_liberado": "2026-07-09T14:30:00Z"
}
```

**⚙️ O que faz no banco de dados e na API:**
1. Acessa a tabela `agendamentos`.
2. Executa um `UPDATE` aplicando a data recebida no payload diretamente no campo `aso_liberado`.
3. Garante que apenas a linha com `sala = 1` seja alterada, cruzando também a `data_atendimento` e o `colaborador_id`.

> 💡 **Dica Adicional**: O campo `aso_liberado` também foi disponibilizado para ser atualizado através do endpoint padrão de atualização genérica de agendamentos (`PATCH /agendamentos/colaborador/:colaborador_id/data/:data_atendimento`), funcionando perfeitamente em ambas as rotas.

------------------------------------------------------------------------------------------------------------------------
*Fim do fluxo.*
