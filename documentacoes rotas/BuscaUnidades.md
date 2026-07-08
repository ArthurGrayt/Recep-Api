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

### Exemplos de uso:

```
# Listar as 15 primeiras unidades em ordem alfabética (sem filtro)
GET /unidades

# Buscar unidades que contenham "Centro"
GET /unidades?search=Centro

# DICA: Buscar APENAS as unidades da empresa 2 (Ideal para auto-complete encadeado)
GET /unidades?empresa_id=2

# Buscar unidades da empresa 2 que contenham "Norte"
GET /unidades?empresa_id=2&search=Norte
```

---

## ✅ Retorno Esperado (200 OK)

```json
[
  {
    "id": 5,
    "razao_social": "Filial Centro",
    "empresa_id": 2
  },
  {
    "id": 6,
    "razao_social": "Filial Norte",
    "empresa_id": 2
  }
]
```

---

## ⚙️ O que faz no banco de dados e na API

1. **Consulta:** Faz um SELECT na tabela `unidade_cliente` (`id, razao_social, empresa_id`).
2. **Ordenação:** Ordena sempre em ordem alfabética pela `razao_social`.
3. **Filtro Texto:** Se `search` for passado, adiciona uma cláusula `ILIKE` na `razao_social`.
4. **Filtro Relacional:** Se `empresa_id` for passado, adiciona uma cláusula `WHERE empresa_id = X`.
5. **Limite:** A resposta é limitada a 15 registros para otimização.
