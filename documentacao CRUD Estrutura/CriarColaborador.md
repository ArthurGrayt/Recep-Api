# 👤 Criar Colaborador e Alocação

> *Módulo dedicado a criação rápida de colaboradores e à sua respectiva alocação numa estrutura de `unidade -> setor -> cargo`. A criação do colaborador em si exige apenas o nome, permitindo associá-lo posteriormente aos outros níveis organizacionais.*

---

## 1. Criar Novo Colaborador (Apenas Cadastro Pessoal)

### 🪧 Endpoint
`POST /criar/colaborador`

### 📦 Body (JSON)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `nome` | `string` | ✅ Sim | Nome completo do colaborador. |
| `cpf` | `string` | ❌ Não | CPF do colaborador. Se fornecido, a API verifica duplicatas (retornando HTTP 409 se já existir). |
| `data_nascimento` | `string` | ❌ Não | Data de nascimento no formato `YYYY-MM-DD`. |
| `sexo` | `string` | ❌ Não | Sexo biológico (ex: "M", "F"). |
| `status` | `boolean` | ❌ Não | Status do registro no banco (padrão é true). |
| `unidade_id` | `number` | ❌ Não | ID da Unidade para alocação automática na criação. |
| `setor_id` | `number` | ❌ Não | ID do Setor para alocação automática na criação. |
| `cargo_id` | `number` | ❌ Não | ID do Cargo para alocação automática na criação. |

> **Atenção:** Se você enviar simultaneamente os campos `unidade_id`, `setor_id` e `cargo_id` dentro do POST, a API irá automaticamente criar o colaborador e em seguida já realizar a alocação estrutural (não precisando chamar a rota PATCH separadamente).

### Exemplo de requisição:
```json
{
  "nome": "João da Silva",
  "cpf": "123.456.789-00",
  "sexo": "M"
}
```

### ✅ Retorno Esperado (201 Created)
```json
{
  "message": "Colaborador criado com sucesso.",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "nome": "João da Silva",
    "cpf": "123.456.789-00",
    "sexo": "M"
  }
}
```

---

## 2. Alocar Colaborador (Vínculo Unidade, Setor, Cargo)

> *Para que o colaborador recém-criado pertença de fato a uma unidade no organograma, é necessário alocá-lo. Essa rota cria automaticamente todos os vínculos intermediários necessários no banco (`unidade_setor`, `cargo_setor_unidade` e por fim `colaborador_cargo_unidade_setor`).*

### 🪧 Endpoint
`PATCH /criar/colaborador/:id/alocar`

### 📦 Body (JSON)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `unidade_id` | `number` | ✅ Sim | ID da Unidade à qual será vinculado. |
| `setor_id` | `number` | ✅ Sim | ID do Setor. |
| `cargo_id` | `number` | ✅ Sim | ID do Cargo. |

### Exemplo de requisição:
```json
{
  "unidade_id": 1,
  "setor_id": 2,
  "cargo_id": 5
}
```

### ✅ Retorno Esperado (200 OK)
```json
{
  "message": "Colaborador alocado com sucesso.",
  "data": {
    "colaborador_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "unidade_id": 1,
    "setor_id": 2,
    "cargo_id": 5
  }
}
```

---

## ⚙️ O que faz no banco de dados

**Ao Criar (`POST`):**
1. Insere o registro puro na tabela `colaboradores` gerando um UUID.
2. Faz tratamento de espaços (`trim`) e verifica se o CPF já está em uso, bloqueando caso afirmativo.

**Ao Alocar (`PATCH`):**
1. Busca se a combinação de `unidade` e `setor` já existe na tabela de pivô `unidade_setor`. Se não existir, a API cria automaticamente.
2. Busca se a combinação de `unidade_setor` e `cargo` já existe na tabela de pivô `cargo_setor_unidade`. Se não existir, a API cria automaticamente.
3. Desativa eventuais alocações anteriores ativas deste colaborador (`ativo = false` na tabela `colaborador_cargo_unidade_setor`).
4. Insere o novo vínculo final na tabela `colaborador_cargo_unidade_setor` marcando-o como ativo (`ativo = true`).
