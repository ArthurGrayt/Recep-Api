# 📋 Buscar Unidades

> *Busca a lista de unidades (filiais) de clientes cadastradas no sistema. Suporta um filtro extra para buscar apenas as unidades pertencentes a uma empresa específica.*

---

## 🪧 Endpoint

`GET /unidades`

---

## 🔍 Query Params (Opcionais)

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `search` | `string` | Termo de busca (ilike) aplicado sobre a razão social da unidade. |
| `empresa_id` | `number` | ID numérico da empresa. Se informado, retorna apenas unidades dessa empresa. |
| `page` | `number` | Número da página para paginação (padrão: 1). |
| `limit` | `number` | Quantidade de registros por página (padrão: 10). |

### Exemplos de uso:

```
# Listar as unidades da primeira página (limite de 10)
GET /unidades

# Buscar unidades que contenham "Centro"
GET /unidades?search=Centro

# DICA: Buscar APENAS as unidades da empresa 2 na página 2
GET /unidades?empresa_id=2&page=2
```

---

## ✅ Retorno Esperado (200 OK)

```json
{
  "data": [
    {
      "id": 5,
      "razao_social": "Filial Centro",
      "empresa_cliente_id": 2
    },
    {
      "id": 6,
      "razao_social": "Filial Norte",
      "empresa_cliente_id": 2
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

## ⚙️ O que faz no banco de dados e na API

1. **Consulta:** Faz um SELECT na tabela `unidade_cliente` (`id, razao_social, empresa_cliente_id`).
2. **Ordenação:** Ordena sempre em ordem alfabética pela `razao_social`.
3. **Filtro Texto:** Se `search` for passado, adiciona uma cláusula `ILIKE` na `razao_social`.
4. **Filtro Relacional:** Se `empresa_id` for passado, adiciona uma cláusula `WHERE empresa_cliente_id = X`.
5. **Limite:** A resposta é paginada. Retorna 10 registros por página por padrão, que podem ser controlados enviando os parâmetros `page` e `limit`.
