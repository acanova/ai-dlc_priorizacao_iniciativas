# Plano de Code Generation — Initiative Prioritization

## Status

**Geracao concluida. Aguardando revisao e aprovacao dos artefatos.**

Este documento e a unica fonte de verdade para a geracao de codigo da unidade `initiative-prioritization`. A execucao deve seguir a ordem abaixo e marcar cada checkbox no mesmo ciclo em que o passo for concluido.

## Contexto da unidade

| Item | Decisao |
|---|---|
| Projeto | Greenfield, uma unica unidade |
| Workspace de codigo | Raiz do projeto; nunca `aidlc-docs/` |
| Runtime | Node.js 22 ou superior |
| Linguagem | JavaScript ESM em arquivos `.mjs` |
| Dependencias | Somente modulos nativos do Node.js |
| Protocolo | HTTP e JSON |
| Persistencia | Um arquivo JSON local com `schemaVersion` igual a `1` |
| Limite aprovado | Ate 1.000 iniciativas; uma escrita por vez no demonstrador |
| Interface grafica | N/A; API sem frontend |
| Infraestrutura | N/A; processo local sem nuvem, conteiner ou banco de dados |

## Prontidao e dependencias

- Requirements, User Stories, Application Design, Functional Design, NFR Requirements e NFR Design estao aprovados.
- Nao existem outras unidades, pacotes ou servicos dos quais esta unidade dependa.
- As interfaces internas aprovadas sao HTTP Request Handler, `InitiativeService`, funcoes puras de dominio, `JsonInitiativeRepository`, Safe Console Logger e Composition Root.
- Nao ha migracao de banco. O unico formato persistido e o documento JSON versionado.
- As extensoes Resiliency Baseline, Security Baseline e Property-Based Testing permanecem desabilitadas.

## Historias cobertas

| Historia | Cobertura de implementacao planejada |
|---|---|
| US-01 | `GET /health`, ciclo de vida local e teste integrado |
| US-02 | Cadastro, normalizacao, identidade, persistencia e resposta `201` |
| US-03 | Validacao agregada, unicidade e ausencia de gravacao em erro |
| US-04 | Listagem na ordem persistida com score derivado |
| US-05 | Formula RICE pura, precisao completa e projecao publica |
| US-06 | Ranking decrescente e desempate por `createdAt` e `id` |
| US-07 | `PATCH` parcial, precedencia de erros e estado final validado |
| US-08 | Documento versionado, substituicao atomica e recarga apos reinicio |
| US-09 | Limite de 64 KiB, erros HTTP estaveis e logs por lista permitida |

## Arquivos-alvo

### Codigo e configuracao na raiz do workspace

- `package.json`
- `config/defaults.mjs`
- `data/initiatives.json`
- `src/errors/application-error.mjs`
- `src/domain/initiative-domain.mjs`
- `src/application/initiative-service.mjs`
- `src/infrastructure/json-initiative-repository.mjs`
- `src/observability/safe-console-logger.mjs`
- `src/http/request-handler.mjs`
- `src/app.mjs`
- `src/server.mjs`
- `README.md`

### Testes na raiz do workspace

- `tests/helpers/test-dependencies.mjs`
- `tests/domain/initiative-domain.test.mjs`
- `tests/application/initiative-service.test.mjs`
- `tests/infrastructure/json-initiative-repository.test.mjs`
- `tests/http/request-handler.test.mjs`
- `tests/integration/api.test.mjs`

### Resumos Markdown em `aidlc-docs/`

- `aidlc-docs/construction/initiative-prioritization/code/business-logic-summary.md`
- `aidlc-docs/construction/initiative-prioritization/code/repository-layer-summary.md`
- `aidlc-docs/construction/initiative-prioritization/code/api-layer-summary.md`
- `aidlc-docs/construction/initiative-prioritization/code/code-generation-summary.md`

## Sequencia executavel

### Step 1 — Estrutura greenfield e configuracao local

- [x] Criar `src/`, `tests/`, `config/` e `data/` na raiz conforme os arquivos-alvo.
- [x] Criar `package.json` privado, ESM, sem dependencias, com `npm start` e `npm test`.
- [x] Criar defaults para `HOST`, `PORT` e `DATA_FILE` e o documento inicial com `schemaVersion: 1`.
- [x] Rastreabilidade: RNF-01, RNF-02, RNF-13; US-01 e US-08.

### Step 2 — Erros e dominio de iniciativas

- [x] Implementar `ApplicationError`, validacao agregada deterministica, normalizacao, canonicalizacao, formula RICE, projecao publica e ranking imutavel.
- [x] Aplicar `createdAt` e `id` como desempate sem persistir `score` ou `creationOrder`.
- [x] Rastreabilidade: RF-02, RF-03, RF-06, RF-07, RF-08; RN-01 a RN-13 e RN-18 a RN-22; US-02 a US-07 e US-09.

### Step 3 — Testes unitarios do dominio

- [x] Gerar testes para formula conhecida, numeros finitos, limites, impacto discreto, nome, campos desconhecidos, erros agregados e ordem dos detalhes.
- [x] Gerar testes para arredondamento publico, precisao completa, desempate e ausencia de mutacao da colecao.
- [x] Nao executar os testes nesta etapa; a execucao pertence a Build and Test.

### Step 4 — Servico de aplicacao e resumo de logica

- [x] Implementar `InitiativeService` com repositorio, relogio e gerador de id injetados.
- [x] Implementar cadastro, patch com validacao anterior ao lookup, unicidade, listagem e ranking com no maximo uma chamada a `replaceAll` por escrita valida.
- [x] Gerar testes unitarios do servico com repositorio em memoria e dependencias deterministicas.
- [x] Gerar `business-logic-summary.md` com arquivos, contratos, historias e regras cobertas.
- [x] Rastreabilidade: RF-02 a RF-07 e RF-09; RN-14 a RN-25; US-02 a US-08.

### Step 5 — Repositorio JSON

- [x] Implementar `JsonInitiativeRepository` com `initialize`, `list`, `findById` e `replaceAll`.
- [x] Encapsular leitura e validacao integral, criacao quando ausente, arquivo temporario exclusivo no mesmo diretorio, fechamento, renomeacao e limpeza segura.
- [x] Preservar arquivo existente corrompido, estruturalmente invalido ou com versao incompativel e impedir startup.
- [x] Nao adicionar `fsync`, lock, retry, cache, fila ou recuperacao automatica.
- [x] Rastreabilidade: RF-09; RNF-03, RNF-05 a RNF-08; US-08.

### Step 6 — Testes e resumo do repositorio

- [x] Gerar testes com diretorios temporarios para ausencia inicial, persistencia, recarga, documento invalido e capacidade de 1.000 iniciativas.
- [x] Gerar testes de falha de substituicao que demonstrem documento anterior ou novo completo e ausencia de sucesso falso.
- [x] Gerar `repository-layer-summary.md` com formato, limites, falhas e cobertura planejada.
- [x] Nao executar os testes nesta etapa.

### Step 7 — Logger seguro, configuracao e composicao

- [x] Implementar Safe Console Logger com eventos e campos permitidos, sem corpos, conteudo persistido, caminhos ou objetos de erro completos.
- [x] Implementar validacao da configuracao e Composition Root com injecao de dependencias.
- [x] Garantir inicializacao do repositorio antes da escuta e encerramento controlado.
- [x] Rastreabilidade: RNF-02, RNF-08, RNF-10 e RNF-11; US-01, US-08 e US-09.

### Step 8 — Camada HTTP e processo executavel

- [x] Implementar leitura JSON limitada a 64 KiB, resposta JSON e mapeamento centralizado de erros.
- [x] Implementar exatamente `GET /health`, `POST /api/v1/initiatives`, `PATCH /api/v1/initiatives/{id}`, `GET /api/v1/initiatives` e `GET /api/v1/ranking`.
- [x] Implementar rotas ausentes, metodos nao permitidos e falhas inesperadas com codigos estaveis e sem vazamento interno.
- [x] Implementar `src/server.mjs` como entrypoint local usando `process.env` e sinais de encerramento.
- [x] Rastreabilidade: RF-01, RF-02, RF-04, RF-05, RF-07 e RF-08; US-01, US-02, US-04, US-06, US-07 e US-09.

### Step 9 — Testes unitarios da camada HTTP

- [x] Gerar testes do leitor de corpo, limite, JSON malformado, roteamento, status, envelope de erro e ausencia de detalhes internos.
- [x] Gerar testes do logger por lista permitida e da fronteira de erros inesperados.
- [x] Nao executar os testes nesta etapa.

### Step 10 — Testes integrados da API e ciclo de vida

- [x] Gerar testes com porta efemera e arquivo temporario para os cinco endpoints.
- [x] Cobrir jornada de cadastro, ranking, patch, nova ordenacao, entrada invalida sem persistencia e reinicio com o mesmo arquivo.
- [x] Cobrir startup recusado para JSON malformado, estrutura invalida e `schemaVersion` incompativel.
- [x] Cobrir comportamento funcional com 1.000 iniciativas sem criterio temporal.
- [x] Nao gerar teste de escritas concorrentes, pois a capacidade esta fora do escopo.

### Step 11 — Resumo da API

- [x] Gerar `api-layer-summary.md` com rotas, status, envelopes, ciclo de vida, logs e cobertura planejada.
- [x] Confirmar que nenhum frontend foi gerado porque a unidade e somente API.
- [x] Confirmar que nenhum atributo de automacao de UI e aplicavel.

### Step 12 — Documentacao e artefatos locais

- [x] Criar `README.md` com requisitos, configuracao, comandos, endpoints, exemplos, formato persistido e limites conhecidos.
- [x] Tratar `package.json`, `config/defaults.mjs` e `data/initiatives.json` como artefatos de execucao local.
- [x] Nao criar Dockerfile, manifestos de nuvem, migracoes de banco ou dependencias externas porque sao N/A.

### Step 13 — Consolidacao e verificacao documental

- [x] Gerar `code-generation-summary.md` com todos os arquivos criados, historias cobertas, itens N/A e rastreabilidade.
- [x] Verificar que codigo, testes e configuracao estao na raiz e que `aidlc-docs/` contem somente Markdown.
- [x] Verificar estaticamente imports, nomes de arquivos, scripts npm e alinhamento com o plano, sem executar build ou testes.
- [x] Marcar cada historia US-01 a US-09 coberta quando seus arquivos de implementacao e testes forem gerados.
- [x] Atualizar todos os checkboxes e `aidlc-state.md` no mesmo ciclo de conclusao de cada passo.

## Itens explicitamente N/A

| Item do workflow | Motivo |
|---|---|
| Frontend e testes de UI | Produto aprovado e somente API |
| Migracao de banco | Persistencia aprovada em arquivo JSON, sem banco |
| Container e infraestrutura de nuvem | Execucao local aprovada; Infrastructure Design ignorada |
| Dependencias externas | Restricao explicita da stack |
| Testes de concorrencia | Escritas concorrentes fora do escopo |
| Execucao de build e testes | Reservada para Build and Test depois da revisao do codigo |

## Checklist da Parte 1 — Planejamento

- [x] Carregar todos os artefatos aprovados, historias, contratos e limites da unidade.
- [x] Confirmar workspace, tipo greenfield, localizacao do codigo e ausencia de dependencias entre unidades.
- [x] Definir caminhos exatos para codigo, testes, configuracao e resumos.
- [x] Numerar a sequencia completa e incluir checkboxes de execucao.
- [x] Mapear US-01 a US-09 e os requisitos relevantes aos passos.
- [x] Registrar itens de frontend, banco, infraestrutura e dependencias como N/A.
- [x] Validar Markdown, tabelas, opcoes e rastreabilidade do plano.
- [x] Obter aprovacao explicita do plano completo.

## Gate de aprovacao

### Question 1

Como deseja prosseguir com este plano completo de Code Generation?

A) Aprovar todos os 13 passos e autorizar a geracao de codigo, testes, documentacao e artefatos locais exatamente na sequencia definida

B) Solicitar alteracoes no plano antes da geracao

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
