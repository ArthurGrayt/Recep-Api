# 📋 Buscar Empresas

> *Busca a lista de empresas (clientes) cadastradas no sistema. Pode ser usado para preencher selects e campos de auto-complete.*

---

## 🪧 Endpoint

`GET /empresas`

---

## 🔍 Query Params (Opcionais)

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `search` | `string` | Termo de busca (ilike) aplicado sobre a razão social da empresa. |

### Exemplos de uso:

```
# Listar as 15 primeiras empresas em ordem alfabética (sem filtro)
GET /empresas

# Buscar empresas que contenham "Construtora"
GET /empresas?search=Construtora
```

---

## ✅ Retorno Esperado (200 OK)

```json
[
  {
    "id": 1,
    "razao_social": "Construtora Alfa Ltda"
  },
  {
    "id": 2,
    "razao_social": "Construtora Beta S.A"
  }
]
```

---

## ⚙️ O que faz no banco de dados e na API

1. **Consulta:** Faz um SELECT na tabela `empresa_cliente` (`id, razao_social`).
2. **Ordenação:** Ordena sempre em ordem alfabética pela `razao_social`.
3. **Filtro:** Se `search` for passado, adiciona uma cláusula `ILIKE` na `razao_social`.
4. **Limite:** A resposta é limitada a 15 registros.
