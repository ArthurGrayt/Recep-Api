# 📋 Buscar Cargos

> *Busca a lista de cargos/funções cadastrados no sistema. Pode ser usado para preencher selects e campos de auto-complete.*

---

## 🪧 Endpoint

`GET /cargos`

---

## 🔍 Query Params (Opcionais)

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `search` | `string` | Termo de busca (ilike) aplicado sobre o nome do cargo. |
| `page` | `number` | Número da página para paginação (padrão: 1). |
| `limit` | `number` | Quantidade de registros por página (padrão: 10). |

### Exemplos de uso:

```
# Listar os cargos da primeira página (limite de 10)
GET /cargos

# Buscar cargos que contenham "Ajudante"
GET /cargos?search=Ajudante
```

---

## ✅ Retorno Esperado (200 OK)

```json
{
  "data": [
    {
      "id": 1,
      "nome": "Ajudante de Pedreiro"
    },
    {
      "id": 2,
      "nome": "Pedreiro"
    }
  ],
  "meta": {
    "total": 30,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

## ⚙️ O que faz no banco de dados e na API

1. **Consulta:** Faz um SELECT na tabela `cargo` (`id, nome`).
2. **Filtro:** Se `search` for passado, adiciona uma cláusula `ILIKE` no campo `nome`.
3. **Limite:** A resposta é paginada. Retorna 10 registros por página por padrão, que podem ser controlados enviando os parâmetros `page` e `limit`.
