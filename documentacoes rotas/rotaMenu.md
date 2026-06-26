# Documentação da Rota de Menus

## Buscar Menus por System ID
**Método:** `GET`
**Endpoint:** `/menu/:id`

**🎯 O que essa rota faz?**
Esta rota é responsável por buscar dinamicamente os itens de menu e sub-menus de um sistema específico (`system_id`). A rota conecta-se diretamente com a tabela `menu` no banco de dados do Supabase através do serviço integrado da aplicação e retorna os dados encapsulados no padrão `ApiResponse`.

**⚙️ Como funciona na API (NestJS - Recep-Api):**
1. O cliente faz uma requisição HTTP `GET` para a rota `/menu/:id`, passando o `system_id` desejado na URL no lugar de `:id`.
2. O `MenuController` intercepta a requisição e repassa o `id` para o `MenuService`.
3. O `MenuService` utiliza o `SupabaseService` para conectar-se ao Supabase de forma segura com as credenciais de backend (`SERVICE_ROLE_KEY`).
4. É feita uma requisição para a tabela `menu`, filtrando por `system_id` igual ao `id` passado.
5. Em caso de sucesso, os dados recebidos do Supabase são encapsulados em um JSON padrão com `success: true`, `status: 200`, `message`, e os dados no campo `object`.

**✅ Retorno Esperado (200 OK)**
```json
{
  "success": true,
  "status": 200,
  "message": "Menus carregados com sucesso",
  "object": [
    {
      "id": 1,
      "system_id": "system-uuid",
      "label": "Início",
      "icon": "House",
      "path": "/home",
      "order": 1,
      "children": null,
      "created_at": "2026-06-26T00:00:00Z"
    }
  ]
}
```

**❌ Possíveis Erros**
- **500 Internal Server Error:** Ocorre em caso de falha de conexão com o Supabase ou erro interno no processamento.
- **Outros:** O status refletirá qualquer erro vindo diretamente da API do Supabase.

**📝 Padrão de Resposta (`ApiResponse`)**
- `success` (boolean): Flag indicando se a requisição foi bem sucedida.
- `status` (number): Código de status HTTP equivalente (ex: 200).
- `message` (string): Mensagem amigável descrevendo o resultado da operação.
- `object` (Array / Any): Array com os registros da tabela `menu` no Supabase.

