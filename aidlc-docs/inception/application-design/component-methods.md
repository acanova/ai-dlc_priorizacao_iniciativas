# Metodos dos Componentes

## Convencoes

- As assinaturas abaixo descrevem contratos em JavaScript ESM; os tipos sao conceituais e poderao ser formalizados com JSDoc durante Code Generation.
- Operacoes de arquivo e casos de uso sao assincronos e retornam `Promise`.
- Falhas esperadas usam `ApplicationError` com `code`, `message` e, quando util, `details` seguros.
- As regras internas e os passos algoritmicos serao detalhados em Functional Design.

## Tipos conceituais

```text
InitiativeInput = { name, reach, impact, confidence, effort }
InitiativePatch = subconjunto nao vazio de InitiativeInput
InitiativeRecord = InitiativeInput + { id, createdAt, creationOrder }
InitiativeView = InitiativeRecord + { score }
StoredDocument = { schemaVersion, initiatives }
ApplicationError = { code, message, details? }
```

## Composicao da Aplicacao

### `createApplication(options = {})`

```js
createApplication({ host, port, dataFile, generateId, now } = {})
  -> { start, stop, address }
```

- **Proposito**: montar componentes concretos e expor um ciclo de vida controlavel.
- **Entrada**: configuracao opcional e colaboradores substituiveis para testes.
- **Saida**: controlador da aplicacao, ainda sem escuta ativa.

### `start()`

```js
start() -> Promise<{ host, port, url }>
```

- **Proposito**: inicializar o repositorio e iniciar o servidor HTTP.
- **Falhas**: propaga falha de inicializacao apenas ao processo chamador, sem formar resposta HTTP.

### `stop()`

```js
stop() -> Promise<void>
```

- **Proposito**: encerrar o servidor de modo adequado a execucao local e aos testes integrados.

## API HTTP

### `createRequestHandler(options)`

```js
createRequestHandler({ initiativeService, bodyLimitBytes })
  -> async function requestHandler(request, response)
```

- **Proposito**: reconhecer o metodo e o caminho, preparar entradas e despachar o caso de uso.
- **Entrada**: servico injetado e limite de corpo, definido como 64 KiB na composicao.
- **Saida**: tratador para `node:http`; toda resposta e encerrada pelo proprio tratador.

### `readJsonBody(request, options)`

```js
readJsonBody(request, { limitBytes }) -> Promise<unknown>
```

- **Proposito**: coletar o corpo com limite e interpretar JSON.
- **Falhas esperadas**: `BODY_TOO_LARGE` e `MALFORMED_JSON`.

### `sendJson(response, statusCode, payload)`

```js
sendJson(response, statusCode, payload) -> void
```

- **Proposito**: aplicar o tipo de conteudo JSON, o status e serializar a resposta.

### `mapApplicationError(error)`

```js
mapApplicationError(error) -> { statusCode, body }
```

- **Proposito**: traduzir codigos conhecidos para HTTP sem expor detalhes internos.
- **Saida**: `body` no formato `{ error: { code, message, details? } }`.

## InitiativeService

### Fabrica

```js
createInitiativeService({ repository, generateId, now })
  -> { createInitiative, updateInitiative, listInitiatives, getRanking }
```

- **Proposito**: criar uma instancia sem dependencias globais ou importacoes de singletons.

### `createInitiative(input)`

```js
createInitiative(input: unknown) -> Promise<InitiativeView>
```

- **Proposito**: normalizar e validar uma entrada, garantir nome unico, atribuir metadados, persistir e apresentar a iniciativa.
- **Falhas esperadas**: `VALIDATION_ERROR` e `DUPLICATE_NAME`.

### `updateInitiative(id, patch)`

```js
updateInitiative(id: string, patch: unknown) -> Promise<InitiativeView>
```

- **Proposito**: localizar a iniciativa, validar o patch e o estado final, garantir unicidade e persistir a substituicao.
- **Falhas esperadas**: `NOT_FOUND`, `VALIDATION_ERROR` e `DUPLICATE_NAME`.

### `listInitiatives()`

```js
listInitiatives() -> Promise<InitiativeView[]>
```

- **Proposito**: apresentar todas as iniciativas persistidas, incluindo pontuacao calculada.

### `getRanking()`

```js
getRanking() -> Promise<InitiativeView[]>
```

- **Proposito**: calcular, ordenar com precisao completa e apresentar o ranking deterministico.

## Dominio de Iniciativas

### `normalizeInitiativeInput(input)`

```js
normalizeInitiativeInput(input: InitiativeInput) -> InitiativeInput
```

- **Proposito**: produzir os valores canonicos, incluindo a remocao de espacos nas extremidades do nome.
- **Efeito**: funcao pura; nao altera o objeto recebido.

### `validateInitiativeInput(input, options = {})`

```js
validateInitiativeInput(input: unknown, { partial = false } = {})
  -> InitiativeInput | InitiativePatch
```

- **Proposito**: validar campos conhecidos e seus limites conforme o modo de cadastro ou patch.
- **Falha esperada**: `VALIDATION_ERROR`, com detalhes seguros por campo.

### `canonicalizeInitiativeName(name)`

```js
canonicalizeInitiativeName(name: string) -> string
```

- **Proposito**: gerar a chave de comparacao de nomes sem diferenciar maiusculas, minusculas e espacos nas extremidades.

### `calculateRiceScore(initiative)`

```js
calculateRiceScore(initiative: InitiativeInput) -> number
```

- **Proposito**: calcular a pontuacao RICE com a precisao numerica completa do JavaScript.
- **Pre-condicao**: entrada completa ja validada.

### `rankInitiatives(initiatives)`

```js
rankInitiatives(initiatives: InitiativeRecord[]) -> InitiativeRecord[]
```

- **Proposito**: criar uma colecao ordenada por pontuacao decrescente e, em empate completo, por `creationOrder` crescente.
- **Efeito**: nao altera a colecao recebida.

### `toInitiativeView(initiative)`

```js
toInitiativeView(initiative: InitiativeRecord) -> InitiativeView
```

- **Proposito**: acrescentar a pontuacao calculada e arredondada para duas casas na representacao publica.

## Repositorio JSON

### Fabrica

```js
createJsonInitiativeRepository({ filePath })
  -> { initialize, list, findById, replaceAll }
```

- **Proposito**: encapsular o caminho e as operacoes de persistencia sem estado global.

### `initialize()`

```js
initialize() -> Promise<void>
```

- **Proposito**: assegurar que diretorio e documento inicial com `schemaVersion: 1` existam e sejam legiveis.

### `list()`

```js
list() -> Promise<InitiativeRecord[]>
```

- **Proposito**: carregar e devolver uma copia das iniciativas do documento valido.

### `findById(id)`

```js
findById(id: string) -> Promise<InitiativeRecord | undefined>
```

- **Proposito**: localizar um registro sem transformar ausencia em erro HTTP.

### `replaceAll(initiatives)`

```js
replaceAll(initiatives: InitiativeRecord[]) -> Promise<void>
```

- **Proposito**: persistir um novo documento completo com versao de esquema conhecida.
- **Pre-condicao**: o servico fornece somente iniciativas completas e validadas.

## Codigos de erro estaveis

| Codigo | Origem principal | Status HTTP |
|---|---|---|
| `MALFORMED_JSON` | API HTTP | `400` |
| `VALIDATION_ERROR` | Dominio ou servico | `400` |
| `NOT_FOUND` | Servico ou roteamento | `404` |
| `METHOD_NOT_ALLOWED` | API HTTP | `405` |
| `DUPLICATE_NAME` | Servico | `409` |
| `BODY_TOO_LARGE` | API HTTP | `413` |
| `INTERNAL_ERROR` | Fronteira HTTP para falha inesperada | `500` |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
