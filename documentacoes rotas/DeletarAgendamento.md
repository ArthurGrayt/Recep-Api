# 🗑️ Deletar Agendamento

Este documento detalha o endpoint responsável por excluir definitivamente um agendamento e todos os exames associados a ele. A exclusão atinge todas as salas alocadas para o colaborador na data especificada.

------------------------------------------------------------------------------------------------------------------------

## 📋 Deletar Agendamento Completo

> *Exclui do banco de dados o agendamento completo de um colaborador em uma data específica. Remove automaticamente todas as linhas correspondentes na tabela `agendamentos` (todas as salas) e limpa os vínculos na tabela `exames_feitos`.*

**🪧 Endpoint**
`DELETE /agendamentos/colaborador/:colaborador_id/data/:data_atendimento`

**📦 Parâmetros de Rota (URL)**
* 🔹 **`colaborador_id`**: O UUID do colaborador associado ao agendamento.
* 🔹 **`data_atendimento`**: A data de atendimento do agendamento (formato: `YYYY-MM-DD`).

**✅ Retorno Esperado (200 OK)**
```json
{
  "message": "Agendamento e exames excluídos com sucesso"
}
```

**⚙️ O que faz no banco de dados e na API:**
1. **Busca os Agendamentos:** Faz uma consulta inicial buscando os IDs de todas as linhas da tabela `agendamentos` que correspondem ao `colaborador_id` e `data_atendimento` fornecidos.
2. **Limpeza de Vínculos:** Com os IDs em mãos, acessa a tabela `exames_feitos` e deleta todas as linhas cujo `agendamento_id` corresponda aos IDs encontrados. (Isso evita possíveis erros de chave estrangeira caso o banco não esteja configurado com 'Cascade').
3. **Exclusão Definitiva:** Por fim, vai até a tabela `agendamentos` e deleta todas as linhas correspondentes aos IDs coletados (ou seja, apaga as referências a todas as salas alocadas para o colaborador no dia).
