# 🟣 Fila de Atendimentos Unificada

Este documento detalha a rota utilizada para recuperar e ordenar todos os atendimentos aguardando ou em andamento, reunindo dados das tabelas `fila_agendamentos` e `fila_atendimentos`.

------------------------------------------------------------------------------------------------------------------------

## 📋 Buscar Todos os Atendimentos (Fila Unificada)
> *Utilizada para obter a lista completa de atendimentos, ordenados por prioridade e ordem de chegada, em listas separadas e em uma única lista unificada.*

**🪧 Endpoint**
`GET /chamadas/fila/todos`

**📦 Cabeçalhos (Headers)**
Nenhum cabeçalho obrigatório de autenticação foi adicionado à documentação desta rota até o momento.

*🔗 Exemplo de uso:*
`GET https://recep-api.vercel.app/chamadas/fila/todos`

**⚙️ O que faz no banco de dados e API:**
1. A API faz consultas independentes nas tabelas `fila_atendimentos` (sem agendamento) e `fila_agendamentos` (agendados).
2. Os dados são trazidos e padronizados para garantir que ambas as filas (que possuem colunas com nomes diferentes no banco) retornem o mesmo formato:
   - `ticket_id` e `ticket_text` viram **`ticket_id`**.
   - `disp` e `disponivel` viram **`status`**.
   - Injeta a propriedade **`tipo_fila`**.
3. **Agrupamento de Agendamentos:** Como um agendamento gera várias linhas (uma para cada sala), a API agrupa os dados pelo `id_ticket`. Assim, cada colaborador aparece apenas **uma vez** na lista. As salas que o colaborador deve passar são agrupadas no array **`salas_agendadas`**, contendo o número e o status em cada uma.
4. Uma função de ordenação é aplicada com dois critérios principais:
   - **1º Prioridade:** Tickets que contêm a letra **"P"** no nome (ex: `AGP0002` ou `SAP0001`) têm prioridade máxima e aparecem primeiro.
   - **2º Ordem de Chegada:** Desempate feito pela data/hora do campo `created_at` (do mais antigo para o mais recente).
5. A API retorna apenas essa única lista (`Array`) classificada.

**✅ Retorno Esperado (200 OK)**
```json
[
  {
    "id": 1,
    "ticket_id": "SAP0001",
    "created_at": "2026-06-26T14:00:00Z",
    "sala": "Recepção",
    "status": true,
    "tipo_fila": "fila_atendimentos",
    "id_ticket": 100,
    "salas_agendadas": []
  },
  {
    "id": 2,
    "ticket_id": "AG0005",
    "created_at": "2026-06-26T14:05:00Z",
    "sala": 2,
    "status": 1,
    "nome": "João da Silva",
    "tipo_fila": "fila_agendamentos",
    "id_ticket": 101,
    "salas_agendadas": [
      {
        "sala": 1,
        "status": 3
      },
      {
        "sala": 2,
        "status": 1
      }
    ]
  }
]
```

------------------------------------------------------------------------------------------------------------------------
