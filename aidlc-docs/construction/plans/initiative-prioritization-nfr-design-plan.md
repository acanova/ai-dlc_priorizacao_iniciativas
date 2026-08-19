# Plano de NFR Design — Initiative Prioritization

## Objetivo

Definir, em profundidade concisa, os padroes e componentes logicos que incorporam os requisitos nao funcionais aprovados sem ampliar o MVP para infraestrutura externa, alta disponibilidade ou concorrencia de escrita.

## Contexto analisado

- NFR Requirements aprovado para uma aplicacao local em Node.js 22+, JavaScript ESM e somente modulos nativos.
- Capacidade verificavel de ate 1.000 iniciativas em um unico arquivo JSON.
- Sem meta temporal, SLA, escalabilidade horizontal, autenticacao, RTO ou RPO.
- Uma escrita por vez no demonstrador; escritas concorrentes estao fora do escopo.
- Substituicao persistente deve deixar o documento anterior ou o novo completo.
- Estado corrompido, estruturalmente invalido ou incompativel deve impedir a inicializacao e permanecer preservado.
- Logs concisos devem cobrir inicializacao, encerramento e falhas inesperadas sem corpos nem caminhos locais.

## Avaliacao obrigatoria das categorias

| Categoria | Aplicabilidade | Decisao que precisa de confirmacao |
|---|---|---|
| Resilience Patterns | Aplicavel | Nivel de durabilidade exigido alem da troca atomica |
| Scalability Patterns | Aplicavel de forma limitada | Modelo integral em memoria ou processamento incremental no limite aprovado |
| Performance Patterns | Aplicavel de forma limitada | Calculo sob demanda ou cache de pontuacoes derivadas |
| Security Patterns | Aplicavel proporcionalmente | Fronteira centralizada para erros e logs seguros |
| Logical Components | Aplicavel | Separacao dos colaboradores de persistencia e validacao de estado |

Nenhuma categoria foi omitida. Filas, caches externos, circuit breakers, balanceadores e outros componentes de infraestrutura nao sao presumidos porque nao existem dependencias ou chamadas externas no escopo aprovado.

## Instrucoes para resposta

Preencha cada campo `[Answer]:` com a letra da opcao escolhida. Se nenhuma opcao representar a preferencia, escolha `X` e descreva a resposta depois da tag. Todas as perguntas precisam ser respondidas antes da geracao dos artefatos de NFR Design.

## Perguntas de NFR Design

### Question 1
Qual padrao de durabilidade deve complementar a substituicao atomica do arquivo?

A) Gravar um arquivo temporario no mesmo diretorio, fecha-lo e renomea-lo sobre o destino, com limpeza de temporarios em caso de falha, sem exigir sincronizacao explicita em disco

B) Alem do arquivo temporario e da renomeacao, exigir sincronizacao explicita do arquivo e do diretorio antes de confirmar sucesso

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
Como o repositorio deve tratar o documento de ate 1.000 iniciativas durante cada operacao?

A) Carregar e validar o documento completo em memoria e substituir o agregado completo nas escritas

B) Processar o arquivo incrementalmente e manter indices auxiliares, mesmo com o limite de 1.000 iniciativas

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3
Como pontuacoes e ranking derivados devem ser tratados para desempenho e consistencia?

A) Recalcular sob demanda a partir dos fatores persistidos, sem cache, usando a precisao completa para ordenar

B) Manter um cache em memoria de pontuacoes e ranking, invalidado depois de cada escrita confirmada

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
Qual padrao deve controlar a exposicao de falhas em respostas e logs?

A) Usar uma fronteira centralizada que traduza erros esperados em codigos HTTP estaveis e registre apenas evento, categoria e codigo permitidos

B) Permitir que cada camada forme sua resposta e seu log, desde que nenhuma delas inclua corpo de requisicao ou caminho local

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5
Como os componentes logicos de persistencia devem ser separados?

A) Manter `JsonInitiativeRepository` como fachada e injetar colaboradores distintos para validacao do documento e substituicao atomica do arquivo

B) Encapsular leitura, validacao e substituicao atomica inteiramente dentro de `JsonInitiativeRepository`, sem colaboradores logicos separados

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Checklist de execucao

### Parte 1 — Planejamento

- [x] Carregar NFR Requirements, stack, Functional Design e Application Design aprovados.
- [x] Avaliar Resilience, Scalability, Performance, Security e Logical Components.
- [x] Identificar somente decisoes de padrao ainda abertas.
- [x] Criar perguntas contextuais no formato AI-DLC.
- [x] Validar Markdown, opcoes, tags `[Answer]:` e compatibilidade de renderizacao.
- [x] Receber respostas para todas as perguntas.
- [x] Validar respostas quanto a completude, consistencia e ausencia de ambiguidades.

### Parte 2 — Geracao

- [x] Gerar `aidlc-docs/construction/initiative-prioritization/nfr-design/nfr-design-patterns.md`.
- [x] Gerar `aidlc-docs/construction/initiative-prioritization/nfr-design/logical-components.md`.
- [x] Validar completude, consistencia, sintaxe e rastreabilidade dos artefatos.
- [x] Atualizar cada checkbox e o estado no mesmo ciclo do passo concluido.
- [x] Registrar a conclusao e apresentar o gate padronizado de revisao.
- [x] Obter aprovacao explicita dos artefatos e concluir a etapa no estado e no plano de execucao.

## Limites da etapa

- Nao introduzir dependencia externa, banco de dados, fila, cache externo, worker, cluster ou recurso de nuvem.
- Nao transformar a restricao de uma escrita por vez em garantia de concorrencia.
- Nao adicionar autenticacao, meta temporal, alta disponibilidade ou recuperacao automatica de arquivo.
- Nao colocar codigo da aplicacao dentro de `aidlc-docs/`.

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
