# 👥 Colaboradores: Busca Case-Insensitive

Este documento detalha o endpoint responsável por buscar colaboradores (pacientes/funcionários) na base de dados pelo nome.
Ele suporta pesquisa em formato _case-insensitive_ e limita o número de retornos para evitar payloads pesados.

------------------------------------------------------------------------------------------------------------------------

## 📋 Buscar Colaboradores
> *Retorna uma lista de até 10 colaboradores que correspondem ao termo de busca.*

**🪧 Endpoint**
`GET /colaboradores`

**📦 Query Params (Opcionais)**
* 🔹 **`search`**: Termo de busca para filtrar pelo nome do colaborador (ex: `João`).

*🔗 Exemplo de uso:*
`GET https://recep-api.vercel.app/colaboradores?search=João`

**⚙️ O que faz no banco de dados e API:**
Acessa a tabela `colaboradores` no banco de dados (Supabase).
- Limita o número máximo de registros retornados a 10 (`limit(10)`).
- Se o parâmetro `search` for fornecido e não estiver vazio, aplica o filtro `.ilike('nome', '%termo%')`. Isso equivale à instrução SQL `LOWER(nome) LIKE LOWER('%termo%')`, garantindo que "João", "joão" ou "JOÃO" tragam o mesmo resultado.
- Retorna um array com os registros puros encontrados.

**✅ Retorno Esperado (200 OK)**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "João da Silva",
    "cpf": "111.222.333-44"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655441111",
    "nome": "João Paulo Batista",
    "cpf": "555.666.777-88"
  }
]
```
* 🔹 **`id`**: Identificador único do colaborador.
* 🔹 **`nome`**: Nome completo registrado.
* 🔹 **`cpf`**: Documento CPF do colaborador.

------------------------------------------------------------------------------------------------------------------------

## 🆔 Detalhes do Colaborador por ID
> *Retorna os detalhes de um colaborador específico, incluindo sua empresa e unidade atual vinculadas.*

**🪧 Endpoint**
`GET /colaboradores/:id`

**📦 Parâmetros de Rota (Obrigatórios)**
* 🔹 **`id`**: UUID do colaborador na tabela `colaboradores`.

*🔗 Exemplo de uso:*
`GET https://recep-api.vercel.app/colaboradores/550e8400-e29b-41d4-a716-446655440000`

**⚙️ O que faz no banco de dados e API:**
Acessa a tabela `colaboradores` buscando um único registro (`single()`) através da filtragem `.eq('id', id)`.
Realiza _Joins_ de forma relacional nas tabelas de vínculos (`colaborador_cargo_unidade_setor`, `unidade_setor`, `unidade_cliente`, `empresa_cliente`) para extrair e planificar os dados de qual empresa e unidade o colaborador está alocado no momento (onde `ativo` = true).

**✅ Retorno Esperado (200 OK)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nome": "João da Silva",
  "cpf": "111.222.333-44",
  "data_nascimento": "1990-05-20",
  "sexo": "M",
  "empresa": "Gama Corp",
  "unidade": "Filial SP",
  "funcao": "Auxiliar de Limpeza",
  "setor": "RH"
}
```

------------------------------------------------------------------------------------------------------------------------
*Fim do fluxo.*
