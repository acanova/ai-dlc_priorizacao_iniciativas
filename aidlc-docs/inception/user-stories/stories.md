# Histórias de Usuário — API de Priorização de Iniciativas

## Organização

As histórias seguem a jornada aprovada e usam granularidade pequena, com uma capacidade observável da API por história.

## Jornada 1 — Verificar a API

### US-01 — Verificar disponibilidade local

**Como** Rafael, consumidor técnico da API,  
**quero** consultar o estado de saúde do processo local,  
**para** confirmar que a aplicação está pronta antes de iniciar a demonstração.

#### Critérios de aceite

**Cenário: processo disponível**

- **Given** que a aplicação foi iniciada localmente
- **When** Rafael envia `GET /health`
- **Then** a API responde com HTTP `200` e JSON indicando estado `ok`

## Jornada 2 — Cadastrar iniciativas

### US-02 — Cadastrar uma iniciativa válida

**Como** Rafael, consumidor técnico da API,  
**quero** cadastrar uma iniciativa com os fatores RICE aprovados,  
**para** disponibilizar a proposta de Marina para comparação no portfólio.

#### Critérios de aceite

**Cenário: cadastro válido**

- **Given** um corpo com `name`, `reach`, `impact`, `confidence` e `effort` válidos
- **When** Rafael envia `POST /api/v1/initiatives`
- **Then** a API cria uma iniciativa com identificador único e preserva sua ordem de criação

**Cenário: normalização do nome**

- **Given** um nome válido com espaços nas extremidades
- **When** a iniciativa é cadastrada
- **Then** a API remove esses espaços antes de persistir e responder

### US-03 — Impedir cadastro ou alteração inválida

**Como** Marina, responsável pela priorização de negócio,  
**quero** que dados inválidos ou nomes duplicados sejam rejeitados antes da gravação,  
**para** preservar a integridade e a comparabilidade das iniciativas.

#### Critérios de aceite

**Cenário: fator RICE fora das regras**

- **Given** uma iniciativa com nome vazio ou longo demais, `reach` negativo, `impact` fora da escala, `confidence` fora de `0` a `100` ou `effort` não positivo
- **When** Rafael tenta cadastrá-la ou produzir esse estado por atualização
- **Then** a API rejeita a requisição com erro JSON e não grava o estado inválido

**Cenário: nome duplicado**

- **Given** uma iniciativa já persistida
- **When** um cadastro ou atualização usa o mesmo nome com diferenças apenas de maiúsculas, minúsculas ou espaços nas extremidades
- **Then** a API rejeita a duplicidade e mantém os dados anteriores

## Jornada 3 — Revisar iniciativas e ranking

### US-04 — Listar iniciativas cadastradas

**Como** Marina, responsável pela priorização de negócio,  
**quero** consultar todas as iniciativas com seus valores e pontuações,  
**para** revisar as informações que sustentam a priorização.

#### Critérios de aceite

**Cenário: listar iniciativas**

- **Given** iniciativas válidas cadastradas
- **When** Rafael envia `GET /api/v1/initiatives`
- **Then** a API retorna todas elas com identificador, fatores RICE normalizados e pontuação calculada

**Cenário: lista vazia**

- **Given** que nenhuma iniciativa foi cadastrada
- **When** Rafael consulta a listagem
- **Then** a API retorna uma coleção vazia válida

### US-05 — Calcular a pontuação RICE

**Como** Marina, responsável pela priorização de negócio,  
**quero** que a aplicação calcule a pontuação RICE a partir dos fatores informados,  
**para** comparar propostas usando uma fórmula única e reproduzível.

#### Critérios de aceite

**Cenário: cálculo conhecido**

- **Given** uma iniciativa com `reach = 1000`, `impact = 2`, `confidence = 80` e `effort = 10`
- **When** sua pontuação é apresentada pela API
- **Then** o resultado é `160`

**Cenário: pontuação controlada pela aplicação**

- **Given** uma requisição de cliente que inclui um campo de pontuação
- **When** a aplicação processa os dados da iniciativa
- **Then** ela não aceita a pontuação como entrada e calcula o valor a partir dos quatro fatores válidos

### US-06 — Consultar ranking determinístico

**Como** Marina, responsável pela priorização de negócio,  
**quero** consultar as iniciativas ordenadas por pontuação RICE,  
**para** identificar prioridades e explicar a ordem apresentada.

#### Critérios de aceite

**Cenário: ordem decrescente**

- **Given** três iniciativas com pontuações completas diferentes
- **When** Rafael envia `GET /api/v1/ranking`
- **Then** a API retorna as iniciativas da maior para a menor pontuação e mostra os fatores usados no cálculo

**Cenário: precisão e apresentação**

- **Given** pontuações com mais de duas casas decimais
- **When** o ranking é calculado e retornado
- **Then** a ordenação usa a precisão completa do número em JavaScript e a resposta exibe a pontuação arredondada para duas casas decimais

**Cenário: empate determinístico**

- **Given** duas iniciativas com a mesma pontuação completa
- **When** o ranking é consultado
- **Then** a iniciativa criada primeiro aparece antes da mais recente

## Jornada 4 — Atualizar uma iniciativa

### US-07 — Atualizar parcialmente uma iniciativa

**Como** Rafael, consumidor técnico da API,  
**quero** alterar somente os campos conhecidos de uma iniciativa existente,  
**para** refletir novas estimativas sem reenviar ou corromper os demais dados.

#### Critérios de aceite

**Cenário: atualização válida**

- **Given** uma iniciativa existente e um corpo com pelo menos um campo editável conhecido
- **When** Rafael envia `PATCH /api/v1/initiatives/{id}`
- **Then** a API valida o estado final completo, persiste a alteração e preserva os campos não enviados

**Cenário: mudança de posição no ranking**

- **Given** uma iniciativa posicionada no ranking
- **When** Rafael altera seu esforço para um valor válido que muda a pontuação
- **Then** uma nova consulta ao ranking reflete a nova posição

**Cenário: atualização estruturalmente inválida**

- **Given** um corpo vazio ou contendo campo desconhecido
- **When** Rafael tenta atualizar a iniciativa
- **Then** a API rejeita toda a atualização e mantém o estado anterior

**Cenário: identificador inexistente**

- **Given** um identificador que não corresponde a uma iniciativa
- **When** Rafael tenta atualizá-lo
- **Then** a API retorna um erro JSON de recurso não encontrado

## Jornada 5 — Validar persistência e erros

### US-08 — Preservar iniciativas entre reinícios

**Como** Rafael, consumidor técnico da API,  
**quero** reencontrar os dados válidos depois de reiniciar o processo com o mesmo arquivo,  
**para** demonstrar continuidade local sem um banco de dados.

#### Critérios de aceite

**Cenário: persistência e reinício**

- **Given** uma iniciativa válida armazenada em um arquivo com `schemaVersion` igual a `1`
- **When** o processo é reiniciado usando o mesmo `DATA_FILE`
- **Then** a iniciativa continua disponível na listagem e no ranking

**Cenário: estrutura persistida**

- **Given** uma gravação válida
- **When** o arquivo JSON é atualizado
- **Then** ele mantém `schemaVersion` igual a `1`, a coleção de iniciativas e os metadados mínimos para desempate por ordem de criação

### US-09 — Receber erros seguros e compreensíveis

**Como** Rafael, consumidor técnico da API,  
**quero** receber erros JSON estáveis para requisições inválidas ou falhas internas,  
**para** corrigir a integração sem expor detalhes da máquina.

#### Critérios de aceite

**Cenário: JSON malformado**

- **Given** um corpo que não é JSON válido
- **When** Rafael o envia para um endpoint que exige JSON
- **Then** a API rejeita a requisição com código estável e mensagem compreensível

**Cenário: corpo acima do limite**

- **Given** uma requisição com corpo superior a 64 KiB
- **When** a API recebe o corpo
- **Then** ela interrompe o processamento, retorna um erro JSON apropriado e não persiste dados

**Cenário: resposta sem vazamento interno**

- **Given** uma requisição inválida ou falha interna
- **When** a API produz a resposta de erro
- **Then** o JSON não contém stack trace nem caminho local

## Rastreabilidade

| História | Requisitos funcionais | Requisitos não funcionais | Cenários de aceite |
|---|---|---|---|
| US-01 | RF-01 | RNF-02, RNF-04, RNF-05 | Suporte à jornada local |
| US-02 | RF-02, RF-03, RF-09 | RNF-03, RNF-04, RNF-05 | CA-01 |
| US-03 | RF-02, RF-03, RF-08, RF-09 | RNF-03, RNF-04 | CA-01, CA-06 |
| US-04 | RF-05, RF-06 | RNF-04, RNF-05 | CA-01, CA-02 |
| US-05 | RF-06 | RNF-04 | CA-02, CA-04 |
| US-06 | RF-06, RF-07 | RNF-04, RNF-05 | CA-01, CA-03, CA-04 |
| US-07 | RF-03, RF-04, RF-06, RF-07, RF-08, RF-09 | RNF-04 | CA-01, CA-06 |
| US-08 | RF-09 | RNF-02, RNF-04, RNF-05 | CA-05 |
| US-09 | RF-08 | RNF-03, RNF-04 | CA-06 |

RNF-01 restringe a implementação de todas as histórias à plataforma Node.js 22, ECMAScript Modules e módulos nativos. RNF-05 orienta a apresentação do conjunto, mesmo quando não aparece individualmente na tabela.

## Verificação INVEST

| História | I | N | V | E | S | T | Evidência resumida |
|---|---|---|---|---|---|---|---|
| US-01 | Sim | Sim | Sim | Sim | Sim | Sim | Verificação de saúde isolada e observável por uma requisição |
| US-02 | Sim | Sim | Sim | Sim | Sim | Sim | Cadastro válido com contrato e resultado delimitados |
| US-03 | Sim | Sim | Sim | Sim | Sim | Sim | Proteção de integridade verificável sem ampliar o cadastro |
| US-04 | Sim | Sim | Sim | Sim | Sim | Sim | Consulta de coleção independente do ranking ordenado |
| US-05 | Sim | Sim | Sim | Sim | Sim | Sim | Regra de cálculo pura com exemplo conhecido |
| US-06 | Sim | Sim | Sim | Sim | Sim | Sim | Ordenação, arredondamento e desempate com resultados observáveis |
| US-07 | Sim | Sim | Sim | Sim | Sim | Sim | Alteração parcial delimitada a uma iniciativa existente |
| US-08 | Sim | Sim | Sim | Sim | Sim | Sim | Continuidade verificável por gravação e reinício controlados |
| US-09 | Sim | Sim | Sim | Sim | Sim | Sim | Contrato de erro verificável para entradas e falhas delimitadas |

### Interpretação

- **Independentes**: cada história descreve uma capacidade observável e pode ser validada separadamente, ainda que a jornada completa as combine.
- **Negociáveis**: as histórias fixam resultados e regras aprovadas, sem prescrever estrutura interna de implementação.
- **Valiosas**: cada história entrega valor de decisão para Marina ou valor de integração para Rafael.
- **Estimáveis**: entradas, resultados e limites estão definidos nos critérios de aceite.
- **Pequenas**: cada história cobre uma única capacidade principal da API.
- **Testáveis**: todos os resultados possuem cenários Given/When/Then verificáveis.

## Conformidade das extensões

- **Resiliency Baseline**: N/A; extensão desabilitada na Análise de Requisitos.
- **Security Baseline**: N/A; extensão desabilitada na Análise de Requisitos.
- **Property-Based Testing**: N/A; extensão desabilitada na Análise de Requisitos.
