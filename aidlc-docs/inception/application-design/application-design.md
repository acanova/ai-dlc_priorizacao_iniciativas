# Application Design — API de Priorizacao de Iniciativas

## Resumo executivo

A aplicacao sera uma unica unidade de trabalho com quatro camadas internas: API HTTP, um `InitiativeService`, dominio puro de iniciativas e repositorio de arquivo JSON. Uma composicao explicita conecta essas partes e injeta repositorio, gerador de identificadores e relogio. O desenho atende aos cinco endpoints aprovados sem frameworks, banco de dados ou infraestrutura externa.

## Decisoes aprovadas

| Tema | Decisao |
|---|---|
| Separacao | Componentes distintos para HTTP, servico de aplicacao, dominio e repositorio |
| Servico | Um unico `InitiativeService` para cadastro, atualizacao, listagem e ranking |
| Dependencias | Injecao explicita por fabricas ou construtores |
| Falhas esperadas | `ApplicationError` com codigos estaveis, traduzido pela API HTTP |

## Estrutura logica

| Camada | Entrada principal | Saida principal | Nao deve conhecer |
|---|---|---|---|
| API HTTP | Requisicao `node:http` | Status e JSON | Regras RICE e formato do arquivo |
| InitiativeService | Dados simples do caso de uso | `InitiativeView` ou erro de aplicacao | Objetos HTTP e detalhes de `node:fs` |
| Dominio | Entradas e registros simples | Dados normalizados, pontuacoes e ordenacao | HTTP, arquivos e configuracao |
| Repositorio JSON | Colecao de registros | Estado persistido ou carregado | Pontuacao RICE e status HTTP |

A Composicao da Aplicacao fica fora dessas camadas: ela resolve configuracao, cria implementacoes e controla `start` e `stop`.

## Contratos essenciais

### API HTTP

- Reconhece somente os cinco endpoints aprovados.
- Limita corpos a 64 KiB e interpreta JSON.
- Entrega entradas ao servico e serializa seus resultados.
- Traduz codigos conhecidos para HTTP e protege detalhes internos em falhas inesperadas.

### InitiativeService

```js
createInitiativeService({ repository, generateId, now })
```

Capacidades expostas:

- `createInitiative(input)`
- `updateInitiative(id, patch)`
- `listInitiatives()`
- `getRanking()`

### Dominio

O dominio fornece normalizacao, validacao, canonicalizacao de nome, calculo RICE, ranking e projecao de resposta. Suas funcoes nao acessam rede, arquivo, relogio ou identificadores.

### Repositorio

```js
createJsonInitiativeRepository({ filePath })
```

O contrato expoe `initialize`, `list`, `findById` e `replaceAll`. O documento persistido possui `schemaVersion: 1`, e a pontuacao e sempre recalculada pela aplicacao.

## Fluxos principais

### Escrita

1. A API interpreta a requisicao e chama o servico.
2. O dominio normaliza e valida a entrada.
3. O servico le o estado, verifica existencia ou duplicidade e forma o estado final.
4. O dominio valida a iniciativa completa.
5. O repositorio grava o conjunto completo.
6. O servico projeta a resposta e a API retorna JSON.

Nenhum erro esperado antes da gravacao pode alterar o arquivo.

### Leitura e ranking

1. O servico carrega os registros pelo repositorio.
2. O dominio calcula as pontuacoes.
3. Para ranking, o dominio ordena pela pontuacao completa e desempata por `creationOrder`.
4. A pontuacao e arredondada para duas casas somente na projecao publica.

## Modelo de falhas

| Codigo | HTTP | Situacao |
|---|---:|---|
| `MALFORMED_JSON` | 400 | Corpo nao representa JSON valido |
| `VALIDATION_ERROR` | 400 | Entrada, patch ou estado final viola o contrato |
| `NOT_FOUND` | 404 | Rota ou iniciativa nao existe |
| `METHOD_NOT_ALLOWED` | 405 | Caminho conhecido com metodo nao aceito |
| `DUPLICATE_NAME` | 409 | Nome canonico ja pertence a outra iniciativa |
| `BODY_TOO_LARGE` | 413 | Corpo ultrapassa 64 KiB |
| `INTERNAL_ERROR` | 500 | Falha inesperada protegida pela fronteira HTTP |

O corpo segue `{ "error": { "code": "...", "message": "..." } }`, com `details` opcionais e seguros. Stack traces e caminhos locais nao sao expostos.

## Testabilidade

- Dominio: testes unitarios de funcoes puras.
- Servico: repositorio em memoria, ID e relogio deterministicos.
- Repositorio: arquivo temporario e verificacao do documento versionado.
- API: servidor em porta efemera e `fetch()` nativo.
- Composicao: inicio e encerramento controlados, com `DATA_FILE` temporario.

## Limites para as proximas etapas

Functional Design detalhara modelo, invariantes, regras de patch, calculo, desempate e sequencia de persistencia. NFR Requirements e NFR Design detalharao limite de corpo, tratamento de falhas, integridade do arquivo, configuracao e testabilidade. Este documento nao autoriza novos endpoints, dependencias externas, autenticacao, exclusao ou infraestrutura.

## Artefatos detalhados

- [Componentes](components.md)
- [Metodos dos componentes](component-methods.md)
- [Servicos e orquestracao](services.md)
- [Dependencias e fluxos](component-dependency.md)

## Rastreabilidade resumida

| Decisao | Cobertura |
|---|---|
| Camadas separadas e dominio puro | RNF-04; US-03, US-05, US-06 e US-07 |
| Servico unico | RF-02, RF-04, RF-05 e RF-07 |
| Repositorio injetado e arquivo versionado | RF-09, RNF-02 e US-08 |
| Erros estaveis traduzidos na fronteira | RF-08, RNF-03 e US-09 |
| Composicao local com modulos nativos | RNF-01, RNF-02 e RNF-04 |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
