# Componentes da Aplicacao

## Visao geral

A unica unidade de trabalho sera organizada em componentes internos separados por responsabilidade. A separacao preserva a simplicidade do MVP e permite testar dominio, orquestracao, persistencia e contrato HTTP de forma independente.

| Componente | Proposito | Responsabilidades principais |
|---|---|---|
| Composicao da Aplicacao | Montar e iniciar a aplicacao | Ler configuracao, criar dependencias, conectar componentes e controlar o ciclo de vida do servidor |
| API HTTP | Expor o contrato local | Reconhecer rotas, ler JSON com limite, chamar o servico e traduzir resultados e erros para HTTP |
| `InitiativeService` | Orquestrar os casos de uso | Cadastrar, atualizar, listar e ranquear iniciativas usando dominio e repositorio |
| Dominio de Iniciativas | Manter regras puras do negocio | Normalizar e validar dados, calcular RICE, projetar respostas e ordenar o ranking |
| Repositorio JSON | Persistir o estado versionado | Inicializar, ler e gravar o arquivo, localizar registros e preservar a ordem de criacao |

## Composicao da Aplicacao

### Responsabilidades

- Resolver `HOST`, `PORT` e `DATA_FILE` com seus valores padrao.
- Criar o repositorio, o gerador de identificadores e o relogio.
- Injetar essas dependencias no `InitiativeService`.
- Criar e iniciar o servidor com o tratador HTTP.
- Encerrar o servidor de forma controlada quando solicitado pelos testes ou pelo processo.

### Interface

- `createApplication(options?)`: monta uma instancia testavel sem iniciar a escuta automaticamente.
- `start()`: inicializa a persistencia e passa a aceitar requisicoes.
- `stop()`: interrompe a aceitacao de requisicoes e libera o servidor.

## API HTTP

### Responsabilidades

- Expor exatamente `GET /health`, `POST /api/v1/initiatives`, `PATCH /api/v1/initiatives/{id}`, `GET /api/v1/initiatives` e `GET /api/v1/ranking`.
- Ler e interpretar corpos JSON sem ultrapassar 64 KiB.
- Rejeitar JSON malformado, rotas ou metodos nao suportados e corpos estruturalmente invalidos.
- Encaminhar dados de negocio ao `InitiativeService` sem implementar regras RICE.
- Converter erros de aplicacao em status HTTP e objetos JSON estaveis.
- Impedir que stack traces e caminhos locais sejam enviados ao cliente.

### Interface

- `createRequestHandler({ initiativeService, bodyLimitBytes })`: retorna o tratador compativel com `node:http`.
- `sendJson(response, statusCode, payload)`: encerra uma resposta JSON consistente.
- `mapApplicationError(error)`: converte um erro conhecido no contrato HTTP correspondente.

## InitiativeService

### Responsabilidades

- Oferecer uma fachada unica para as capacidades de iniciativas.
- Coordenar normalizacao e validacao de entrada com o dominio.
- Consultar o repositorio para assegurar unicidade de nome e existencia por identificador.
- Atribuir identificador, instante e sequencia de criacao por dependencias injetadas.
- Persistir apenas estados completos que tenham sido validados.
- Retornar modelos de resposta sem detalhes do arquivo de dados.

### Interface

- `createInitiative(input)`: cadastra e retorna uma iniciativa apresentada pela API.
- `updateInitiative(id, patch)`: atualiza parcialmente e retorna o estado final apresentado.
- `listInitiatives()`: retorna todas as iniciativas na ordem persistida.
- `getRanking()`: retorna as iniciativas na ordem RICE deterministica.

## Dominio de Iniciativas

### Responsabilidades

- Normalizar o nome e validar os campos permitidos.
- Validar uma iniciativa completa antes de qualquer gravacao.
- Calcular a pontuacao RICE sem acessar HTTP ou arquivos.
- Comparar nomes de forma canonica para detectar duplicidade.
- Ordenar pela pontuacao completa e desempatar pela ordem de criacao.
- Arredondar a pontuacao apenas na projecao de resposta.

### Interface

- `normalizeInitiativeInput(input)`: produz valores de entrada normalizados.
- `validateInitiativeInput(input, options?)`: valida cadastro ou atualizacao parcial.
- `calculateRiceScore(initiative)`: calcula a pontuacao com precisao completa.
- `rankInitiatives(initiatives)`: devolve uma nova colecao ordenada.
- `toInitiativeView(initiative)`: produz a representacao publica com pontuacao exibivel.

## Repositorio JSON

### Responsabilidades

- Trabalhar com um documento de nivel superior contendo `schemaVersion: 1` e `initiatives`.
- Criar o arquivo e seu diretorio quando ainda nao existirem.
- Carregar e validar a estrutura basica do estado persistido.
- Fornecer operacoes de consulta e substituicao do conjunto de iniciativas.
- Gravar um novo estado completo somente depois da validacao pelo servico e pelo dominio.
- Nao calcular pontuacoes nem conhecer status HTTP.

### Interface

- `initialize()`: garante que o armazenamento esteja pronto.
- `list()`: retorna uma copia das iniciativas persistidas.
- `findById(id)`: retorna uma iniciativa ou ausencia.
- `replaceAll(initiatives)`: persiste o conjunto completo em um documento de esquema valido.

## Colaboradores injetados

| Colaborador | Contrato | Motivo da injecao |
|---|---|---|
| Gerador de identificadores | `generateId(): string` | Permitir identificadores reais em execucao e deterministicos em testes |
| Relogio | `now(): string` | Controlar metadados temporais sem acoplar casos de uso ao tempo do sistema |
| Repositorio | Interface do Repositorio JSON | Substituir armazenamento real por memoria em testes do servico |

## Limites arquiteturais

- A API HTTP depende do servico, mas nao acessa dominio ou repositorio diretamente.
- O servico depende de contratos do dominio e do repositorio, sem conhecer objetos HTTP.
- O dominio permanece puro e nao depende dos demais componentes.
- O repositorio depende apenas de recursos nativos de arquivo e do caminho configurado.
- A composicao e o unico local autorizado a criar e conectar dependencias concretas.

## Rastreabilidade

| Area de design | Requisitos e historias |
|---|---|
| API HTTP | RF-01, RF-02, RF-04, RF-05, RF-07, RF-08; US-01, US-02, US-04, US-06, US-07, US-09 |
| Servico | RF-02 a RF-05, RF-07 e RF-09; US-02 a US-08 |
| Dominio | RF-02, RF-03, RF-04, RF-06, RF-07 e RF-08; US-03, US-05, US-06 e US-07 |
| Repositorio | RF-03, RF-04 e RF-09; US-03, US-07 e US-08 |
| Composicao | RNF-01, RNF-02 e RNF-04; US-01, US-08 e US-09 |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
