# 🏭 Criar Unidade

> *Cria uma nova unidade cliente vinculada a uma empresa existente. A razão social é verificada de forma **case-insensitive** dentro da mesma empresa antes de inserir — duplicatas são rejeitadas com `409`.*

---

## 🪧 Endpoint

`POST /criar/unidade`

---

## 📦 Body (JSON)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `razao_social` | `string` | ✅ Sim | Razão social da unidade. Máx. 255 caracteres. |
| `empresa_cliente_id` | `number` | ✅ Sim | ID da empresa à qual a unidade pertence (FK). |
| `documento` | `string` | ❌ Não | CNPJ ou outro documento (texto livre). Máx. 255 caracteres. |
| `address` | `string` | ❌ Não | Endereço da unidade. Máx. 500 caracteres. |
| `complemento` | `string` | ❌ Não | Complemento do endereço. Máx. 255 caracteres. |
| `tel` | `string` | ❌ Não | Telefone da unidade. Aceita formatações com `+`, `-`, `()` e espaços. Letras são removidas automaticamente. Máx. 20 caracteres. |
| `status` | `boolean` | ❌ Não | Ativo/inativo (padrão: `true` aplicado pelo banco). |
| `force_create` | `boolean` | ❌ Não | Se `true`, ignora o aviso de similaridade com nomes parecidos e força a criação do registro. |

### Exemplo de requisição (mínimo):

```json
{
  "razao_social": "Unidade São Paulo - Matriz",
  "empresa_cliente_id": 3
}
```

### Exemplo de requisição (completo):

```json
{
  "razao_social": "Unidade São Paulo - Matriz",
  "empresa_cliente_id": 3,
  "documento": "98.765.432/0002-10",
  "address": "Av. Paulista, 1000 - São Paulo/SP",
  "complemento": "Andar 5, Torre Norte",
  "tel": "(11) 3333-4444",
  "status": true
}
```

---

## ✅ Retorno Esperado (201 Created)

```json
{
  "message": "Unidade criada com sucesso.",
  "data": {
    "id": 15,
    "razao_social": "Unidade São Paulo - Matriz",
    "documento": "98.765.432/0002-10",
    "address": "Av. Paulista, 1000 - São Paulo/SP",
    "complemento": "Andar 5, Torre Norte",
    "tel": "(11) 3333-4444",
    "status": true,
    "empresa_cliente_id": 3
  }
}
```

---

## ❌ Respostas de Erro

| Status | Quando ocorre |
|---|---|
| `400 Bad Request` | `razao_social` ou `empresa_cliente_id` ausentes, tipo incorreto ou campo desconhecido no body. |
| `404 Not Found` | A empresa informada (`empresa_cliente_id`) não existe no banco. |
| `409 Conflict` | Já existe uma unidade com essa mesma razão social exata vinculada a esta empresa. |
| `409 Conflict` (Com Confirmação) | Não existe igual, mas existe uma unidade com **nome muito similar** (>70%). A API retorna pedindo confirmação. |
| `500 Internal Server Error` | Erro inesperado no banco de dados. |

### Exemplo de erro 400:

```json
{
  "message": ["A razão social é obrigatória.", "O empresa_cliente_id deve ser um número inteiro."],
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
  "message": "Já existem tais itens com similaridade alta com \"Gama-Sol\", deseja realmente adicionar essa Unidade?",
  "similarItem": "Gama-Solutions",
  "rating": 0.85
}
```
*(Para ignorar esse aviso, reenvie a requisição com `"force_create": true`)*

---

## ⚙️ O que faz no banco de dados e na API

1. **Verifica a empresa:** Faz um `SELECT` na tabela `empresa_cliente` buscando pelo `empresa_cliente_id`. Se não encontrar, retorna `404`.
2. **Checagem de Duplicata (Razão Social):** Faz um `SELECT` na tabela `unidade_cliente` buscando todas as unidades da empresa. Se achar exata, retorna `409`.
3. **Checagem de Similaridade:** Se `force_create` for falso, usa o algoritmo *Sørensen-Dice* (string-similarity). Se for > 70% igual a alguma unidade existente na empresa, recusa e pede confirmação.
4. **Inserção:** O `payload` só inclui chaves validadas e ignora campos opcionais não enviados.
5. **Retorno:** Retorna os dados recém-inseridos. com o `id` gerado automaticamente pelo banco (`bigserial`).
5. **Campos omitidos:** Campos opcionais não enviados ficam como `null` no banco, exceto `status` que tem `default true`.

---

## 🗄️ Tabela no banco

```sql
create table public.unidade_cliente (
  id                 bigserial not null,
  razao_social       text      not null,
  documento          text      null,
  address            text      null,
  complemento        text      null,
  status             boolean   not null default true,
  tel                text      null,
  empresa_cliente_id bigint    not null,
  constraint unidade_cliente_pkey primary key (id),
  constraint unidade_cliente_empresa_cliente_id_fkey
    foreign key (empresa_cliente_id)
    references empresa_cliente (id)
    on update cascade on delete restrict
);
```
