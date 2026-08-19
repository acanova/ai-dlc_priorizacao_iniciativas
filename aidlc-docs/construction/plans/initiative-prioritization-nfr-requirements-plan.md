# Plano de NFR Requirements — Initiative Prioritization

## Objetivo

Consolidar, em profundidade concisa, os requisitos nao funcionais da unica unidade de trabalho da API de Priorizacao de Iniciativas e confirmar as propriedades que orientarao o NFR Design e a implementacao.

## Contexto analisado

- Functional Design aprovado para cadastro, atualizacao parcial, listagem, ranking e persistencia local.
- Node.js 22 ou superior, ECMAScript Modules e somente modulos nativos.
- Processo local em `127.0.0.1`, sem conteineres, nuvem, banco de dados ou servicos externos.
- Arquivo JSON local versionado, limite de corpo de 64 KiB e respostas de erro sem detalhes internos.
- Testes com `node:test` e `node:assert/strict`, executados por `npm test`.
- Sem SLA formal de disponibilidade, RTO ou RPO; o produto e um MVP para workshop.

## Decisoes ja estabelecidas

- **Escalabilidade e disponibilidade**: execucao em um unico processo local, sem escalabilidade horizontal nem alta disponibilidade.
- **Seguranca**: dados ficticios, sem autenticacao; corpo limitado e erros seguros.
- **Stack**: JavaScript `.mjs` em Node.js 22+, sem dependencias externas e sem compilacao.
- **Manutenibilidade**: separacao entre HTTP, servico, dominio e repositorio, com dependencias injetadas.
- **Usabilidade**: contrato HTTP JSON, sem interface grafica.

## Instrucoes para resposta

Preencha cada campo `[Answer]:` com a letra da opcao escolhida. Se nenhuma opcao representar a preferencia, escolha `X` e descreva a resposta depois da tag. Todas as perguntas precisam ser respondidas antes da geracao dos artefatos de NFR Requirements.

## Perguntas de NFR Requirements

### Question 1
Qual volume maximo de iniciativas o MVP deve suportar de forma verificavel em um unico arquivo JSON?

A) Ate 1.000 iniciativas, adequado para a demonstracao local e para testes rapidos

B) Ate 10.000 iniciativas, exigindo validacao de desempenho com um arquivo maior

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
Qual objetivo de desempenho deve orientar as operacoes locais com o volume escolhido, sem constituir SLA de producao?

A) Cada requisicao deve concluir em ate 200 ms no percentil 95 em uma maquina de desenvolvimento, excluindo a inicializacao do processo

B) Nao definir limite temporal; exigir apenas conclusao correta e testes funcionais reproduziveis

X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
Que garantia deve existir quando duas requisicoes de escrita chegam quase simultaneamente ao mesmo processo?

A) Serializar escritas no processo para impedir atualizacoes perdidas e arquivos parcialmente sobrepostos

B) Considerar escritas concorrentes fora do escopo e documentar que o demonstrador deve enviar uma escrita por vez

X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 4
Qual garantia de integridade deve ser exigida durante a substituicao do arquivo persistido?

A) Uma escrita confirmada deve deixar o arquivo anterior ou o novo documento completo, nunca JSON parcial, mesmo se a substituicao falhar

B) A gravacao direta do arquivo e suficiente para o prototipo, desde que erros sejam reportados com seguranca

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5
Como a aplicacao deve reagir ao encontrar na inicializacao um arquivo corrompido ou com `schemaVersion` incompatível?

A) Falhar de forma explicita e segura, preservar o arquivo existente e exigir correcao manual

B) Renomear o arquivo invalido para uma copia de recuperacao e iniciar automaticamente com estado vazio

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6
Qual nivel de observabilidade local deve ser exigido para o workshop?

A) Logs concisos no console para inicializacao, encerramento e falhas inesperadas, sem registrar corpos de requisicao nem caminhos locais

B) Nenhum log operacional alem das respostas HTTP e dos erros de inicializacao

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Checklist de execucao

### Parte 1 — Planejamento

- [x] Carregar requisitos, historias, Application Design e Functional Design aprovados.
- [x] Avaliar escalabilidade, desempenho, disponibilidade, seguranca, confiabilidade, stack, manutenibilidade e usabilidade.
- [x] Separar restricoes ja aprovadas das decisoes nao funcionais ainda abertas.
- [x] Criar perguntas contextuais no formato AI-DLC.
- [x] Validar Markdown, opcoes, tags `[Answer]:` e compatibilidade de renderizacao.
- [x] Receber respostas para todas as perguntas.
- [x] Validar respostas quanto a completude, consistencia e ausencia de ambiguidades.

### Parte 2 — Geracao

- [x] Gerar `aidlc-docs/construction/initiative-prioritization/nfr-requirements/nfr-requirements.md`.
- [x] Gerar `aidlc-docs/construction/initiative-prioritization/nfr-requirements/tech-stack-decisions.md`.
- [x] Validar completude, consistencia, sintaxe e rastreabilidade dos artefatos.
- [x] Atualizar cada checkbox e o estado no mesmo ciclo do passo concluido.
- [x] Registrar a conclusao e apresentar o gate padronizado de revisao.
- [x] Obter aprovacao explicita dos artefatos e concluir a etapa no estado e no plano de execucao.

## Limites da etapa

- Nao selecionar dependencias externas sem aprovacao explicita.
- Nao definir interface grafica, autenticacao, recursos em nuvem ou escalabilidade horizontal.
- Nao detalhar ainda mecanismos de implementacao; os padroes logicos serao definidos no NFR Design.
- Nao colocar codigo da aplicacao dentro de `aidlc-docs/`.

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
