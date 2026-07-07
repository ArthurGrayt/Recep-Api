# 📅 Agendamentos: Criação e Roteamento de Salas

Este documento detalha o endpoint responsável por criar novos agendamentos e registrar os exames que o colaborador fará. O endpoint contém inteligência de **roteamento automático**, ou seja, ele divide os exames escolhidos pelas salas físicas do fluxo de atendimento e cria os registros corretos no banco.

------------------------------------------------------------------------------------------------------------------------

## 📋 Criar Agendamentos (Múltiplas Salas)
> *Recebe a lista de exames que o paciente vai realizar, cruza com as categorias das salas e cria um agendamento individual para cada sala necessária.*

**🪧 Endpoint**
`POST /agendamentos`

**📦 Payload (Body)**
```json
{
  "colaborador_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "nome_avulso": "João da Silva", 
  "cpf": "123.456.789-00", 
  "data_nascimento": "01/01/1990",
  "sexo": "M", 
  "funcao": "Operador de Empilhadeira", 
  "setor": "Logística", 
  "unidade": 42, 
  "exames": [1, 2, 15], 
  "aso_qtd_cobrar": 1, 
  "rac_qtd_cobrar": 0, 
  "obs_agendamento": "Chegar com 10 min de antecedência", 
  "observacoes": "Paciente com quadro prévio de labirintite", 
  "observacoes_laboratorial": "Jejum rigoroso de 12 horas", 
  "avulso": false
}
```
* 🔹 **`colaborador_id`** *(opcional)*: UUID do colaborador. Se `avulso=true`, pode ser nulo caso o backend vá registrar depois.
* 🔹 **`nome_avulso`** *(opcional)*: Nome digitado em caso de paciente avulso que não estava previamente cadastrado na listagem.
* 🔹 **`exames`** *(obrigatório)*: Array numérico com os IDs dos procedimentos mapeados a serem executados.
* 🔹 **`avulso`**: Flag booleana que define o contexto do agendamento (modelo do colaborador).
* 🔹 **Demais campos**: São injetados diretamente na tabela `agendamentos` de cada sala roteada.

**⚙️ O que faz no banco de dados e API:**
1. Acessa a tabela `procedimentos` para buscar o `idcategoria` de cada exame enviado no array `exames`.
2. Utiliza o `SalasService` para mapear cada `idcategoria` encontrada para uma `Sala` (ex: Categoria Laboratorial -> Sala 4, Categoria Raio-X -> Sala 6).
3. Agrupa os procedimentos pela sala identificada. Procedimentos que não possuem categoria vinculada a nenhuma sala (como Documentos e Laudos puros) são **ignorados** e não geram agendamentos nem registros.
4. Faz um `INSERT` na tabela `agendamentos` criando **um agendamento para cada sala única**. (ex: Se os exames acionaram as salas 4 e 6, duas linhas são criadas na tabela `agendamentos` para esse colaborador, ambas com `status` "pendente").
5. Faz um `INSERT` em lote na tabela `exames_feitos`, gravando linha a linha cada `proced_id` vinculado especificamente ao `agendamento_id` da sua respectiva sala.

**✅ Retorno Esperado (201 Created)**
```json
{
  "message": "Agendamentos e exames registrados com sucesso",
  "agendamentos": [
    {
      "id": 6,
      "sala": 4
    },
    {
      "id": 7,
      "sala": 6
    }
  ]
}
```

**⚠️ Retorno quando não há salas (201 Created)**
> *Ocorre quando o frontend envia apenas exames que não mapeiam para nenhuma sala.*
```json
{
  "message": "Nenhum agendamento criado pois os procedimentos não possuem sala mapeada."
}
```

------------------------------------------------------------------------------------------------------------------------
*Fim do fluxo.*
