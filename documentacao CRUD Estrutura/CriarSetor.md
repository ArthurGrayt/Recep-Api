# 📂 Criar Setor

> *Cria um novo setor no sistema. A verificação de duplicata é feita **dentro do escopo da empresa informada**, navegando pelo relacionamento `unidade_setor → unidade_cliente → empresa_cliente` de forma **case-insensitive**.*

---

## 🪧 Endpoint

`POST /criar/setor`

---

## 📦 Body (JSON)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | `string` | ✅ Sim | Nome do setor. Máx. 255 caracteres. |
| `empresa_cliente_id` | `number` | ✅ Sim | ID da empresa usada como escopo da verificação de duplicata. **Não é inserido na tabela `setor`.** |
| `status` | `boolean` | ❌ Não | Ativo/inativo (padrão: `true` aplicado pelo banco). |
| `force_create` | `boolean` | ❌ Não | Se `true`, ignora o aviso de similaridade com nomes parecidos e força a criação do registro. |

### Exemplo de requisição (mínimo):

```json
{
  "nome": "Operacional",
  "empresa_cliente_id": 3
}
```

### Exemplo de requisição (completo):

```json
{
  "nome": "Operacional",
  "empresa_cliente_id": 3,
  "status": true
}
```

---

## ✅ Retorno Esperado (201 Created)

```json
{
  "message": "Setor criado com sucesso.",
  "data": {
    "id": 8,
    "nome": "Operacional",
    "status": true
  }
}
```

> ⚠️ O `empresa_cliente_id` **não aparece no retorno** pois não é uma coluna da tabela `setor`. A vinculação entre setor e unidade é feita separadamente na tabela `unidade_setor`.

---

## ❌ Respostas de Erro

| Status | Quando ocorre |
|---|---|
| `400 Bad Request` | `nome` ou `empresa_cliente_id` ausentes, tipo incorreto ou campo desconhecido no body. |
| `404 Not Found` | A empresa informada (`empresa_cliente_id`) não existe no banco. |
| `409 Conflict` | Já existe um setor com o mesmo nome exato vinculado a uma unidade desta empresa. |
| `409 Conflict` (Com Confirmação) | Não existe igual, mas existe um setor com **nome muito similar** (>70%). A API retorna pedindo confirmação. |
| `500 Internal Server Error` | Erro inesperado no banco de dados. |

### Exemplo de erro 400:

```json
{
  "message": ["O nome do setor é obrigatório.", "O empresa_cliente_id deve ser um número inteiro."],
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
  "message": "Já existem tais itens com similaridade alta com \"Gama-Sol\", deseja realmente adicionar esse Setor?",
  "similarItem": "Gama-Solutions",
  "rating": 0.85
}
```
*(Para ignorar esse aviso, reenvie a requisição com `"force_create": true`)*

---

## ⚙️ O que faz no banco de dados e na API

1. **Verifica a empresa:** Faz um `SELECT` em `empresa_cliente` pelo `empresa_cliente_id`. Se não existir, retorna `404`.
2. **Checagem de Duplicata:** Faz um `SELECT` em `unidade_setor` com JOIN em `setor` e `unidade_cliente`, filtrando por `empresa_cliente_id`. Compara o `nome` do setor de forma case-insensitive. Se encontrar exato, retorna `409`.
3. **Checagem de Similaridade:** Se não achou exato e `force_create` é falso, compara usando *Sørensen-Dice* (string-similarity). Se for > 70% igual, recusa e pede confirmação (`409`).
4. **Inserção:** Executa um `INSERT` apenas na tabela `setor` com `nome` (e `status` se informado).
5. **Retorno:** Retorna o registro recém-criado.

---

## 🔗 Por que o `empresa_cliente_id` não vai para o banco?

A tabela `setor` não possui FK direta para `empresa_cliente`. O relacionamento é feito via tabelas intermediárias:

```
empresa_cliente
    └── unidade_cliente  (empresa_cliente_id)
            └── unidade_setor  (unidade_id)
                    └── setor  (setor_id)
```

O `empresa_cliente_id` é recebido **somente para escopo da verificação de duplicata**. A vinculação real de um setor a uma unidade é feita na tabela `unidade_setor`.

---

## 🗄️ Tabela no banco

```sql
create table public.setor (
  id     bigserial not null,
  nome   text      not null,
  status boolean   not null default true,
  constraint setor_pkey primary key (id)
);
```
