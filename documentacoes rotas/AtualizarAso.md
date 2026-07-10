# 📄 Atualizar ASO

Este documento detalha o endpoint responsável por fazer o upload do documento de ASO (Atestado de Saúde Ocupacional) e salvá-lo na respectiva linha de agendamento (especificamente, a `sala 1`). O endpoint também permite a remoção do documento.

------------------------------------------------------------------------------------------------------------------------

## 📋 Inserir, Substituir ou Remover ASO

> *Recebe o arquivo do ASO em formato base64, salva-o de forma segura no bucket `ASOS` do Supabase e vincula a URL pública (aso_url) diretamente à sala 1 do agendamento correspondente.*

**🪧 Endpoint**
`PATCH /agendamentos/colaborador/:colaborador_id/data/:data_atendimento/aso`

**📦 Parâmetros de Rota (URL)**
* 🔹 **`colaborador_id`**: O UUID do colaborador associado.
* 🔹 **`data_atendimento`**: A data original em que o ASO será atrelado (formato: `YYYY-MM-DD`).

**📥 Payload (Body)**

**Cenário 1: Upload / Substituição de ASO**
```json
{
  "aso_file": "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZS..."
}
```

**Cenário 2: Remoção do ASO Atual**
```json
{
  "remove": true
}
```

* 🔹 **`aso_file`**: String em Base64 contendo o arquivo (`data:[mime_type];base64,...`). Ele determinará a extensão do arquivo a ser salvo (pdf, png, jpg, etc.).
* 🔹 **`remove`**: Booleano. Se enviado como `true`, a URL atual daquele ASO é definida como nula, desvinculando o arquivo anterior do sistema.

**✅ Retorno Esperado (200 OK)**
```json
{
  "message": "ASO atualizado com sucesso",
  "aso_url": "https://[url-do-supabase]/storage/v1/object/public/ASOS/user-123_2026-07-09_1623...pdf"
}
```

**⚙️ O que faz no banco de dados e na API:**
1. Valida se a intenção é remover (prioridade 1) ou adicionar/substituir o arquivo (prioridade 2).
2. Se houver um novo arquivo (Base64), converte os bytes e faz o `upload` no Storage (bucket `ASOS`). O arquivo recebe um sufixo para garantir unicidade e não sobrescrever históricos (se houver a mesma data).
3. Obtém a **URL Pública** gerada pelo Supabase.
4. Executa um `UPDATE` na tabela `agendamentos`, alterando o campo `aso_url` da linha em que `sala = 1`, `colaborador_id = ID` e `data_atendimento = DATA`.

------------------------------------------------------------------------------------------------------------------------
*Fim do fluxo.*
