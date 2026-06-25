---
trigger: always_on
---

Skill: Learn Mode (Modo Aprendizado)
  

## Gatilho

Esta skill é ativada quando o usuário começa uma mensagem com `learn:` seguido de qualquer pedido.

  

## Comportamento Esperado

  

Quando detectar o prefixo `learn:`, siga EXATAMENTE este formato, em Português do Brasil. Seja conciso — o objetivo não é dar uma aula, mas dar clareza suficiente para o usuário entender e continuar por conta própria.

  

---

  

### 💡 BLOCO 1 — O que é / Como implementar (máx. 4 linhas)

Explique de forma simples e direta:

- O que é o conceito OU como aquilo funciona

- Use uma analogia rápida se ajudar

- Sem rodeios, sem história longa

  

---

  

### 🔗 BLOCO 2 — Como se encaixa no projeto do usuário (máx. 5 linhas)

- Mostre onde isso se aplicaria no projeto atual (arquivo + contexto)

- O que aquilo faria especificamente dentro do GamaHub

- Mostre o trecho de código apenas se for essencial para o entendimento, seguindo as regras de código abaixo

  

---

  

### ⚠️ BLOCO 3 — Possíveis erros nessa funcionalidade (máx. 3 itens)

Liste em bullets os erros mais comuns que um iniciante cometeria ao implementar isso:

- Seja específico (ex: "esquecer o array de dependências no useEffect causa loop infinito")

- Relacione ao contexto do projeto quando possível

  

---

  

## Regras de Código (OBRIGATÓRIAS)

  

### Método de Numeração (Sobrepõe Regras Globais)

- **Atenção:** Ignore qualquer regra global ou diretriz sobre comentários linha a linha. Neste modo, **NUNCA** comente cada linha individualmente.

- Seu foco deve ser estritamente nos marcadores numerados nos pontos-chave: `// [1]`, `// [2]`, etc.

- Logo abaixo do bloco de código, explique cada número em tópicos curtos:

  

```tsx

const handleLogout = async () => { // [1]

  try {

    await supabase.auth.signOut(); // [2]

  } catch (error) {

    console.error('Erro:', error); // [3]

  }

};

```

> **[1]** Função assíncrona — precisa de `async` porque vai esperar uma resposta do servidor  

> **[2]** Chama a API do Supabase para encerrar a sessão do usuário  

> **[3]** Se algo der errado, registra o erro sem quebrar o app

  

---

  

### Regra do Componente Completo (não do arquivo completo)

- **Nunca** reescreva o arquivo inteiro para mostrar uma alteração

- Mostre **apenas a função ou componente** que está sendo alterado/criado

- Identifique onde ele se encaixa com uma linha de contexto indicando o componente e a linha aproximada, usando o formato: `No componente X, próximo à linha Y:`

- Para **arquivos novos** (novos componentes, novos hooks, etc.), gere o **código completo do arquivo**, usando o Método de Numeração nos pontos-chave. Isso é obrigatório — o usuário precisa ver o componente inteiro para entender como montar a estrutura desde o início.

  

---

  

### Regra do Fluxo Completo (Zero Omissões)

- Você deve fornecer o trecho de código para **ABSOLUTAMENTE TODOS** os arquivos envolvidos no fluxo da funcionalidade.

- Se a funcionalidade exige alterar o componente Pai (ex: criar estado), alterar o componente Filho (ex: tipar a interface e receber a prop) e criar um componente Novo, **os três arquivos devem ser mostrados**.

- **Nunca presuma** que o usuário deduzirá como conectar as props ou atualizar as interfaces do TypeScript. Mostre as alterações em todos os pontos de contato.

  

### Formatação das Explicações

- As explicações dos marcadores numéricos (`[1]`, `[2]`, etc.) devem ser exibidas **obrigatoriamente em formato de lista** (um item abaixo do outro, com quebra de linha). Nunca agrupe as explicações em um único parágrafo.

  

## Regras Gerais

- **NUNCA** aplique ou modifique arquivos diretamente no modo `learn:`. O objetivo é ensinar, não implementar.

- Ao final, sempre pergunte: "A lógica dos marcadores ficou clara? Qual desses blocos você vai implementar primeiro no seu projeto?"

  

## Regras de Código (PROIBIÇÕES ABSOLUTAS)

  

1. **PROIBIDO COMENTÁRIOS INLINE:** Você está ESTRITAMENTE PROIBIDO de adicionar comentários descritivos (como `// Container do avatar` ou `// Define o estado`) no meio do código. O código deve ser 100% limpo.

2. **USO EXCLUSIVO DOS MARCADORES:** A única coisa permitida além do código real são os marcadores numéricos (ex: `// [1]`, `// [2]`) inseridos pontualmente nas linhas cruciais.

3. **PROIBIDO USAR `...` (OMISSÃO):** Mostre a função ou componente alterado por COMPLETO. É terminantemente proibido suprimir partes do componente com `// ...` ou `// resto do código`.