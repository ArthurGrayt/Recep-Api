# 🏥 Mapeamento de Procedimentos e Salas de Chamada no Recep

Este documento detalha o mapeamento de **TODOS os procedimentos, testes, avaliações e exames** cadastrados no sistema de agendamento em relação à sala que é ativada no Quadro de Chamadas.

Sempre que um exame ou procedimento é adicionado a um agendamento, o sistema habilita o status (`Aguardando`) do paciente na respectiva coluna (Fila de Atendimento) do painel, liberando-o para ser chamado naquela sala específica.

---

## 1. Recepção (Triagem e Abertura)
A porta de entrada. Categoria padrão pela qual todos os colaboradores passam para abertura da ficha e conferência de dados.

* **Sala Liberada para Chamada:** `Sala 1 - Recepção`
* **Lista completa de procedimentos vinculados:** 
  * Abertura do Atendimento (Gatilha ao criar o agendamento)
  * Triagem

---

## 2. Consultório Médico (Avaliações e ASO)
Categoria voltada para a avaliação clínica médica ocupacional e conclusão do atendimento através da emissão do Atestado de Saúde Ocupacional (ASO).

* **Sala Liberada para Chamada:** `Sala 2 - Consultório Médico`
* **Lista completa de procedimentos vinculados:** 
  * Avaliação Clínica
  * -Exame Clínico/ Anamnese Ocupacional
  * Exame Oftalmológico (Pode ocorrer externo ou em consultório)
  * Higidez
  * Ficha Clínica *(Categoria Prontuário)*
  * Prontuário Médico *(Categoria Prontuário)*

---

## 3. Exames Complementares (Gerais e Físicos/Mentais)
Exames de medição clínica, testes neurológicos/cardíacos e avaliações de capacidade que **não** envolvem imagem radiológica, fluidos biológicos ou audiometria.

* **Sala Liberada para Chamada:** `Sala 3 - Exames`
* **Lista completa de procedimentos vinculados:**
  * **Oftalmológicos:** Acuidade Visual, TESTE ACUIDADE VISUAL, Teste de Acuidade Visual/Consulta Oftalmológica, Teste de Ishihara
  * **Cardiológicos:** Eletrocardiograma, Eletrocardiograma (ECG), Eletrocardiograma-ECG
  * **Neurológicos e Posturais:** Eletroencefalograma, Eletrocefalograma, Teste Romberg, TESTE DE ROMBERG, Questionário Epilepsia, Questionário de Epilepsia
  * **Respiratórios e Vocais:** Espirometria, Avaliação Vocal, Oximetria, Escala Epworth, Exame de Epworth, Escala de Epworth
  * **Psicológicos / Raciocínio:** Avaliação Psicossocial, Avaliação Psicológica, Teste Palográfico, TESTE PSICOLOGICO PALOGRÁFICO, Racíocinio Lógico - Beta, ESAVI (teste de impulsividade)
  * **Diversos / Complementares:** RAC

---

## 4. Laboratório e Coleta (Análises Clínicas e Toxicológicas)
Categoria referente à coleta de fluidos biológicos (sangue, urina, fezes, cabelo) para diagnóstico e controle toxicológico ocupacional.

* **Sala Liberada para Chamada:** `Sala 4 - Coleta`
* **Lista completa de procedimentos vinculados:**
  * **Exames de Sangue (Gerais):** Hemograma Completo, Glicemia em Jejum, Ácido Úrico, Colesterol T e F, Creatinina, Ferro Sérico, Gama GT, Grupo Sanguíneo, Tipo sanguíneo + fator RH, Hemoglobina glicada, Reticulócitos, TGO, TGP, TGO / TGP, TGO e TGP, Triglicerídeos, TRIGLICERIDES, Carboxihemoglobina.
  * **Marcadores Biológicos no Sangue (Metais):** Chumbo no Sangue, Chumbo Sangue, Chumbo Sanguíneo, Chumbo Sérico, Dosagem de chumbo sérico, Manganês Sanguíneo.
  * **Imunologia e Sorologia:** Anti HAV, Anti HBS, Anti HBSAG, Anti HCV, Hepatite C – Anti—HCV, Hepatiti B – antígeno australia (HBS AG), IGE Específica - Abelha, VDRL.
  * **Exames de Urina (EAS e Metabólitos):** EAS (urina), Acetona Urinária, Ácido fenilglioxílico na urina, Ácido Hipúr. (Tolueno urina), Ácido mandélico, Ácido Mandélico, Ácido Metil Hipurico, Ácido Metil Hipúrico, Ácido Trans. Muconico, ALA-U, Cromo Urinário, Dosagem de manganês urinário, Manganês Urinário, Metil etil cetona, Metil etil cetona na urina, Metil Hipurico Urinário, Orto-cresol na urina, Soma dos Ácido Mandélico e Fenilglioxílico na urina, Tolueno na Urina.
  * **Exames de Fezes:** Coprocultura, EPF (parasitológico fezes).
  * **Toxicológicos:** Exame Toxicológico Pelo, Exame Toxicológico Urina, Toxicológico.

---

## 5. Audiometria (Avaliação Auditiva)
Exames dedicados à avaliação de surdez/acuidade auditiva realizados dentro da cabine audiométrica.

* **Sala Liberada para Chamada:** `Sala 5 - Audiometria`
* **Lista completa de procedimentos vinculados:**
  * Audiometria

---

## 6. Diagnóstico por Imagem (Radiologia)
Exames para obtenção de imagens radiológicas do corpo, geralmente requeridas em admissões ou padrões de poeira e ocupação.

* **Sala Liberada para Chamada:** `Sala 6 - Raio-X`
* **Lista completa de procedimentos vinculados:**
  * **Tórax e Padrão OIT:** Raio-X Tórax PA OIT, Raiox de tórax OIT, Telerradiografia de Tórax Padrão OIT, Telerradiografia do Tórax em PA Padrão (OIT), Telerradiografia do Tórax PA, Telerradiografia do Tórax PA Padrão OIT.
  * **Mãos e Braços:** Raio X – Mãos e Braços, Raio X de Mãos e Braços, Raio x mãos e braços, Raio-X Mãos e Braços.
  * **Coluna:** Raio X Lombro SacrA, Raio-X Coluna L-Sacra.

---

> **Dica de Fluxo:** Um paciente que possua agendado um _Exame Clínico_, um _Exame Toxicológico Pelo_ e um _Raio-X de Tórax_, ativará simultaneamente sua presença nas Salas 1, 2, 4 e 6 para ser chamado pelos respectivos profissionais!
