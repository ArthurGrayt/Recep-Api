# 🏢 Criar Empresa

> *Cria uma nova empresa cliente no sistema. Apenas a razão social é obrigatória. Os demais campos são opcionais e refletem exatamente as colunas da tabela `empresa_cliente`. Adicionalmente, cria de forma automática e obrigatória uma `unidade_cliente` associada a ela com o nome "[Razão Social] - Matriz".*

---

## 🪧 Endpoint

`POST /criar/empresa`

---

## 📦 Body (JSON)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `razao_social` | `string` | ✅ Sim | Razão social da empresa. Máx. 255 caracteres. |
| `documento` | `string` | ❌ Não | CNPJ ou outro documento (texto livre). Máx. 255 caracteres. |
| `address` | `string` | ❌ Não | Endereço da empresa. Máx. 500 caracteres. |
| `complemento` | `string` | ❌ Não | Complemento do endereço. Máx. 255 caracteres. |
| `email` | `string` | ❌ Não | E-mail corporativo válido. |
| `tel` | `string` | ❌ Não | Telefone de contato. Aceita formatações com `+`, `-`, `()` e espaços. Letras são removidas automaticamente. Máx. 20 caracteres. |
| `status` | `boolean` | ❌ Não | Ativo/inativo (padrão: `true` aplicado pelo banco). |
| `force_create` | `boolean` | ❌ Não | Se `true`, ignora o aviso de similaridade com nomes parecidos e força a criação do registro. |

### Exemplo de requisição (mínimo):

```json
{
  "razao_social": "Empresa Exemplo Ltda"
}
```

### Exemplo de requisição (completo):

```json
{
  "razao_social": "Empresa Exemplo Ltda",
  "documento": "12.345.678/0001-95",
  "address": "Rua das Flores, 123 - São Paulo/SP",
  "complemento": "Sala 302, Bloco B",
  "email": "contato@empresa.com.br",
  "tel": "(11) 98765-4321",
  "status": true
}
```

---

## ✅ Retorno Esperado (201 Created)

```json
{
  "message": "Empresa e unidade Matriz criadas com sucesso.",
  "data": {
    "id": 42,
    "razao_social": "Empresa Exemplo Ltda",
    "documento": "12.345.678/0001-95",
    "address": "Rua das Flores, 123 - São Paulo/SP",
    "complemento": "Sala 302, Bloco B",
    "email": "contato@empresa.com.br",
    "tel": "(11) 98765-4321",
    "status": true
  }
}
```

---

## ❌ Respostas de Erro

| Status | Quando ocorre |
|---|---|
| `400 Bad Request` | `razao_social` ausente, formato inválido de CNPJ/e-mail, excesso de caracteres, etc. |
| `409 Conflict` | Já existe uma empresa com esse CNPJ **OU** com essa razão social exata. |
| `409 Conflict` (Com Confirmação) | Não existe igual, mas existe uma empresa com **nome muito similar** (>70%). A API retorna pedindo confirmação. |
| `500 Internal Server Error` | Erro inesperado no banco de dados. |

### Exemplo de erro 400:

```json
{
  "message": ["A razão social é obrigatória."],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Exemplo de erro 409 (Similaridade - Requer Confirmação):

```json
{
  "requiresConfirmation": true,
  "message": "Já existem tais itens com similaridade alta com \"Gama-Sol\", deseja realmente adicionar essa Empresa?",
  "similarItem": "Gama-Solutions",
  "rating": 0.85
}
```
*(Para ignorar esse aviso, reenvie a requisição com `"force_create": true`)*

---

## ⚙️ O que faz no banco de dados e na API

1. **Validação e Limpeza:** Remove letras do telefone (via `@Transform`), valida CNPJ (apenas números, length=14) e email.
2. **Checagem de Duplicata (CNPJ):** Verifica se já existe o documento. Se sim, retorna 409.
3. **Checagem de Duplicata (Razão Social):** Verifica de forma case-insensitive se já existe o exato nome. Se sim, retorna 409.
4. **Checagem de Similaridade:** Se `force_create` for falso, usa o algoritmo *Sørensen-Dice* (string-similarity) contra todas as empresas. Se for > 70% igual, recusa e pede confirmação.
5. **Inserção:** O `payload` só inclui chaves que foram efetivamente enviadas e validadas (evita sobrescrever NULL onde não deve).
6. **Criação da Unidade Matriz:** Logo após salvar a empresa, insere automaticamente um registro na tabela `unidade_cliente` vinculando-a a esta empresa, nomeada como `<Razão Social> - Matriz` e replicando os mesmos dados de contato.
7. **Retorno:** Retorna todos os dados da empresa cadastrada para atualizar a interface imediatamente.

---

## 🗄️ Tabela no banco

```sql
create table public.empresa_cliente (
  id         bigserial     not null,
  razao_social text        not null,
  documento  text          null,
  address    text          null,
  complemento text         null,
  email      text          null,
  status     boolean       not null default true,
  tel        text          null,
  constraint empresa_cliente_pkey primary key (id)
);
```
