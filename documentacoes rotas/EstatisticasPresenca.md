# 📊 Estatísticas de Presença

Este documento detalha o endpoint responsável por buscar a contagem total de pacientes que compareceram ou não compareceram (ausentes) baseado nos agendamentos da Sala 1.

------------------------------------------------------------------------------------------------------------------------

## 📋 Buscar Estatísticas de Presença

> *Busca no banco de dados a quantidade total de agendamentos da `Sala 1` e a quantidade onde o campo `compareceu` é verdadeiro, calculando assim os presentes e os ausentes. Suporta filtro por período.*

**🪧 Endpoint**
`GET /agendamentos/estatisticas/presenca`

**📦 Query Params (Opcionais)**
* 🔹 **`data_inicial`**: Filtra agendamentos a partir desta data (formato `YYYY-MM-DD`). Se enviada sozinha, filtra exata e unicamente este dia.
* 🔹 **`data_final`**: Filtra agendamentos até esta data (formato `YYYY-MM-DD`). Deve ser usada preferencialmente em conjunto com `data_inicial` para formar um período.

**✅ Retorno Esperado (200 OK)**
```json
{
  "presentes": 15,
  "ausentes": 5,
  "total": 20
}
```

**⚙️ O que faz no banco de dados e API:**
1. Acessa a tabela `agendamentos`.
2. Faz uma primeira query de contagem para descobrir o **total** de agendamentos com `sala = 1`.
3. Faz uma segunda query de contagem para descobrir quantos agendamentos possuem `sala = 1` E `compareceu = true` (presentes).
4. Subtrai os presentes do total para calcular a quantidade exata de ausentes (independente do campo ser nulo ou falso).
5. Aplica filtros de datas caso `data_inicial` ou `data_final` sejam informados na URL.
6. Retorna as métricas de forma plana.

------------------------------------------------------------------------------------------------------------------------
*Fim do fluxo.*
