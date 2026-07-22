# 👔 Criar Cargo

> *Cria um novo cargo no sistema. A verificação de duplicata é feita **dentro do escopo da empresa informada**, navegando pelo relacionamento `cargo_setor_unidade → unidade_setor → unidade_cliente → empresa_cliente` de forma **case-insensitive**.*

---

## 🪧 Endpoint

`POST /criar/cargo`

---

## 📦 Body (JSON)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | `string` | ✅ Sim | Nome do cargo. Máx. 255 caracteres. |
| `empresa_cliente_id` | `number` | ✅ Sim | ID da empresa usada como escopo da verificação de duplicata. **Não é inserido na tabela `cargo`.** |
| `status` | `boolean` | ❌ Não | Ativo/inativo (padrão: `true` aplicado pelo banco). |
| `force_create` | `boolean` | ❌ Não | Se `true`, ignora o aviso de similaridade com nomes parecidos e força a criação do registro. |

### Exemplo de requisição (mínimo):

```json
{
  "nome": "Gerente de Vendas",
  "empresa_cliente_id": 3
}
```

### Exemplo de requisição (completo):

```json
{
  "nome": "Gerente de Vendas",
  "empresa_cliente_id": 3,
  "status": true
}
```

---

## ✅ Retorno Esperado (201 Created)

```json
{
  "message": "Cargo criado com sucesso.",
  "data": {
    "id": 12,
    "nome": "Gerente de Vendas",
    "status": true
  }
}
```

> ⚠️ O `empresa_cliente_id` **não aparece no retorno** pois não é uma coluna da tabela `cargo`. A vinculação é feita separadamente na tabela `cargo_setor_unidade`.

---

## ❌ Respostas de Erro

| Status | Quando ocorre |
|---|---|
| `400 Bad Request` | `nome` ou `empresa_cliente_id` ausentes, tipo incorreto ou campo desconhecido no body. |
| `404 Not Found` | A empresa informada (`empresa_cliente_id`) não existe no banco. |
| `409 Conflict` | Já existe um cargo com o mesmo nome exato vinculado a uma unidade desta empresa. |
| `409 Conflict` (Com Confirmação) | Não existe igual, mas existe um cargo com **nome muito similar** (>70%). A API retorna pedindo confirmação. |
| `500 Internal Server Error` | Erro inesperado no banco de dados. |

### Exemplo de erro 400:

```json
{
  "message": ["O nome do cargo é obrigatório.", "O empresa_cliente_id deve ser um número inteiro."],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Exemplo de erro 404:

```json
{
  "message": "Empresa com ID 99 não encontrada.",
  "error": "Not Found",
  "statusCode": 404
}
```

### Exemplo de erro 409 (Similaridade - Requer Confirmação):

```json
{
  "requiresConfirmation": true,
  "message": "Já existem tais itens com similaridade alta com \"Gerente de Vendas\", deseja realmente adicionar esse Cargo?",
  "similarItem": "Gerente Vendas",
  "rating": 0.85
}
```
*(Para ignorar esse aviso, reenvie a requisição com `"force_create": true`)*

---

## ⚙️ O que faz no banco de dados e na API

1. **Verifica a empresa:** Faz um `SELECT` em `empresa_cliente` pelo `empresa_cliente_id`. Se não existir, retorna `404`.
2. **Checagem de Duplicata:** Faz um `SELECT` em `cargo_setor_unidade` com JOIN em `cargo`, `unidade_setor` e `unidade_cliente`, filtrando por `empresa_cliente_id`. Compara o `nome` do cargo de forma case-insensitive. Se encontrar exato, retorna `409`.
3. **Checagem de Similaridade:** Se não achou exato e `force_create` é falso, compara usando *Sørensen-Dice* (string-similarity). Se for > 70% igual, recusa e pede confirmação (`409`).
4. **Inserção:** Executa um `INSERT` apenas na tabela `cargo` com `nome` (e `status` se informado).
5. **Retorno:** Retorna o registro recém-criado.

---

## 🔗 Por que o `empresa_cliente_id` não vai para o banco?

A tabela `cargo` não possui FK direta para `empresa_cliente`. O relacionamento é feito via tabelas intermediárias:

```
empresa_cliente
    └── unidade_cliente
            └── unidade_setor
                    └── cargo_setor_unidade
                            └── cargo
```

O `empresa_cliente_id` é recebido **somente para escopo da verificação de duplicata**.

---

## 🗄️ Tabela no banco

```sql
create table public.cargo (
  id     bigserial not null,
  nome   text      not null,
  status boolean   not null default true,
  constraint cargo_pkey primary key (id)
);
```