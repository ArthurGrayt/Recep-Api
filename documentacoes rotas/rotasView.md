# 🟣 Dados do Usuário Autenticado

Este documento detalha a rota utilizada para recuperar as informações completas do usuário autenticado, integrando dados do Supabase Auth e das tabelas do banco de dados (`app_users` e `user_roles_recep`).

------------------------------------------------------------------------------------------------------------------------

## 👤 Buscar Perfil do Usuário
> *Utilizada para obter os dados do perfil e as permissões do usuário logado no sistema.*

**🪧 Endpoint**
`GET /usuarios/me`

**📦 Cabeçalhos (Headers)**
* 🔹 **`Authorization`**: OBRIGATÓRIO. Token JWT fornecido pelo Supabase Auth (ex: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...`).

*🔗 Exemplo de uso:*
`GET https://recep-api.vercel.app/usuarios/me`
Header: `Authorization: Bearer <seu_token_jwt>`

**⚙️ O que faz no banco de dados e API:**
1. A API intercepta o token JWT do cabeçalho da requisição e valida a assinatura do mesmo via método do Supabase `supabase.auth.getUser()`.
2. Em caso de token inválido, expirado ou ausente, a requisição é bloqueada e retorna o status `401 Unauthorized`.
3. Sendo o token válido, a API extrai o ID de autenticação (UUID) do Supabase.
4. Consulta a tabela `app_users` buscando a linha onde a coluna `user_id` coincida com o UUID da autenticação.
5. Em paralelo, devido ao uso do formato otimizado `.select('*, user_roles_recep(*)')`, a API realiza um *join* transparente com a tabela de relações/permissões `user_roles_recep` (fazendo o link através da FK em `user_roles_recep.user_id = app_users.id`).

**✅ Retorno Esperado (200 OK)**
```json
{
  "id": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "João da Silva",
  "created_at": "2026-06-26T14:00:00Z",
  "photo_url": "https://url-da-foto.com/perfil.png",
  "tenant_id": 12,
  "status": true,
  "user_roles_recep": [
    {
      "id": 5,
      "created_at": "2026-06-26T14:05:00Z",
      "user_id": 1,
      "role_recep_id": 2
    }
  ]
}
```

------------------------------------------------------------------------------------------------------------------------
