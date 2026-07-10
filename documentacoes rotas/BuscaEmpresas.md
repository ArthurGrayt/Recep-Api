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
| `page` | `number` | Número da página para paginação (padrão: 1). |
| `limit` | `number` | Quantidade de registros por página (padrão: 10). |

### Exemplos de uso:

```
# Listar as empresas da primeira página (limite de 10)
GET /empresas

# Listar as empresas da página 2, com 20 itens por página
GET /empresas?page=2&limit=20

# Buscar empresas que contenham "Construtora"
GET /empresas?search=Construtora
```

---

## ✅ Retorno Esperado (200 OK)

```json
{
  "data": [
    {
      "id": 1,
      "razao_social": "Construtora Alfa Ltda"
    },
    {
      "id": 2,
      "razao_social": "Construtora Beta S.A"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## ⚙️ O que faz no banco de dados e na API

4. **Limite:** A resposta é paginada. Retorna 10 registros por página por padrão, que podem ser controlados enviando os parâmetros `page` e `limit`.
