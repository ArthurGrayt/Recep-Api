# Documentação da Rota de Menus

## Buscar Menus por ID
**Método:** `GET`
**Endpoint:** `/menu/:id`

**🎯 O que essa rota faz?**
Esta rota é responsável por retornar a estrutura de menus (itens e sub-menus) formatada para o frontend, combinando com as interfaces `ApiResponse` e `MenuItem`. O `:id` passado na URL pode ser usado futuramente para buscar menus específicos por usuário ou perfil.

**⚙️ Como funciona na API:**
1. A API recebe a requisição HTTP GET na rota base `/menu` acompanhada do parâmetro `:id`.
2. O `MenuController` intercepta a chamada, extrai o parâmetro `id` da URL e o repassa para o `MenuService`.
3. O `MenuService` processa o pedido e constrói um objeto JSON estático (por enquanto) que contém a resposta estruturada.
4. O JSON é devolvido ao cliente com a propriedade `success: true` e `status: 200`, encapsulando os itens do menu no array `object`.

**✅ Retorno Esperado (200 OK)**
```json
{
  "success": true,
  "status": 200,
  "message": "Menus carregados com sucesso",
  "object": [
    {
      "id": "1",
      "label": "Início",
      "icon": "House",
      "path": "/home",
      "order": 1
    },
    {
      "id": "2",
      "label": "Configurações",
      "icon": "Settings",
      "path": "/config",
      "order": 2,
      "children": [
        {
          "id": "2-1",
          "label": "Perfil",
          "icon": "User",
          "path": "/config/perfil"
        }
      ]
    }
  ]
}
```

**📝 Detalhes dos Campos Retornados (`MenuItem`)**
- `id` (string): Identificador único do menu ou sub-menu.
- `label` (string): O texto a ser exibido na interface para este botão (Ex: "Início").
- `icon` (string): O nome exato do ícone da biblioteca `lucide-react`, em PascalCase (Ex: "House", "Settings", "User").
- `path` (string): A rota de navegação para a qual o link apontará na aplicação Next.js.
- `order` (number) *[Opcional]*: Usado para ordenação dos menus.
- `children` (array) *[Opcional]*: Lista de sub-menus associados a este item.
