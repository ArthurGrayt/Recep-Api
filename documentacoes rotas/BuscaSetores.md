# 📋 Buscar Setores

> *Busca a lista de setores cadastrados no sistema. Pode ser usado para preencher selects e campos de auto-complete.*

---

## 🪧 Endpoint

`GET /setores`

---

## 🔍 Query Params (Opcionais)

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `search` | `string` | Termo de busca (ilike) aplicado sobre o nome do setor. |

### Exemplos de uso:

```
# Listar os 15 primeiros setores cadastrados (sem filtro)
GET /setores

# Buscar setores que contenham "Opera"
GET /setores?search=Opera
```

---

## ✅ Retorno Esperado (200 OK)

```json
[
  {
    "id": 1,
    "nome": "Operacional"
  },
  {
    "id": 2,
    "nome": "Administrativo"
  }
]
```

---

## ⚙️ O que faz no banco de dados e na API

1. **Consulta:** Faz um SELECT na tabela `setor` (`id, nome`).
2. **Filtro:** Se `search` for passado, adiciona uma cláusula `ILIKE` no campo `nome`.
3. **Limite:** A resposta é limitada a 15 registros para otimizar a resposta.
