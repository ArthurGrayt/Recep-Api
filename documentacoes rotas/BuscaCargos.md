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

### Exemplos de uso:

```
# Listar os 15 primeiros cargos cadastrados (sem filtro)
GET /cargos

# Buscar cargos que contenham "Ajudante"
GET /cargos?search=Ajudante
```

---

## ✅ Retorno Esperado (200 OK)

```json
[
  {
    "id": 1,
    "nome": "Ajudante de Pedreiro"
  },
  {
    "id": 2,
    "nome": "Pedreiro"
  }
]
```

---

## ⚙️ O que faz no banco de dados e na API

1. **Consulta:** Faz um SELECT na tabela `cargo` (`id, nome`).
2. **Filtro:** Se `search` for passado, adiciona uma cláusula `ILIKE` no campo `nome`.
3. **Limite:** A resposta é limitada a 15 registros para otimizar a resposta.
