# Componentes Logicos de NFR — Initiative Prioritization

## Objetivo

Este documento distribui os padroes nao funcionais entre os componentes aprovados sem criar infraestrutura externa nem uma segunda unidade. A separacao HTTP, servico, dominio, repositorio e composicao permanece; a decisao aprovada mantem validacao do documento e substituicao atomica encapsuladas no proprio `JsonInitiativeRepository`.

## Mapa de componentes

| Componente | Responsabilidade de NFR | Dependencias permitidas |
|---|---|---|
| Composition Root | Validar configuracao, montar dependencias, inicializar repositorio antes da escuta e coordenar encerramento | Modulos nativos e componentes concretos da aplicacao |
| HTTP Request Handler | Limitar corpo a 64 KiB, interpretar JSON e encaminhar casos de uso | `InitiativeService`, error mapper e safe logger |
| Error Mapper | Traduzir erros conhecidos e desconhecidos para respostas publicas estaveis | Tabela local de codigos; nenhuma dependencia de arquivo |
| Safe Console Logger | Emitir somente eventos e campos permitidos | Console injetavel ou `console` do processo |
| InitiativeService | Preparar estado completo validado e confirmar sucesso somente depois de `replaceAll` | Dominio, repositorio, relogio e gerador de id |
| Initiative Domain | Validar entradas e registros, calcular RICE e ordenar sem efeitos colaterais | Nenhuma dependencia de HTTP, arquivo ou log |
| JsonInitiativeRepository | Inicializar, ler, validar e substituir o documento JSON completo | APIs nativas de sistema de arquivos e caminho configurado |

## LC-01 — Composition Root e ciclo de vida

### Responsabilidades

- Interpretar configuracao e rejeitar valores invalidos antes de criar o servidor.
- Construir logger, repositorio, dominio, servico e request handler por injecao explicita.
- Aguardar `repository.initialize()` antes de chamar a escuta HTTP.
- Emitir `startup.completed` somente quando a API estiver pronta.
- Em falha de configuracao ou persistencia, emitir `startup.failed` sem `DATA_FILE` e encerrar sem aceitar requisicoes.
- No encerramento solicitado, parar novas conexoes, fechar o servidor e emitir `shutdown.completed`.

### Contrato observavel

- `createApplication(options?)` retorna uma aplicacao testavel sem iniciar automaticamente.
- `start()` resolve inicializacao antes da escuta.
- `stop()` e idempotente do ponto de vista do ciclo de vida local.

## LC-02 — HTTP Request Handler

### Responsabilidades

- Aceitar somente os cinco contratos de rota aprovados.
- Contar bytes recebidos e interromper a leitura quando o corpo exceder 64 KiB.
- Rejeitar JSON malformado sem encaminhar entrada parcial ao servico.
- Delegar cadastro, patch, listagem e ranking ao `InitiativeService`.
- Encaminhar toda falha ao Error Mapper; nao construir respostas de erro por camada.

O handler nao acessa arquivo, nao calcula score, nao registra corpo e nao inclui stack trace em resposta.

## LC-03 — Error Mapper

O Error Mapper mantem uma tabela fechada entre codigos de aplicacao e contratos HTTP. Ele produz apenas `statusCode` e payload publico. Erros desconhecidos convergem para `INTERNAL_ERROR`; detalhes tecnicos permanecem fora do payload.

O componente tambem fornece ao Safe Console Logger somente `category` e `code` permitidos. Nenhum objeto de erro completo e repassado para serializacao automatica.

## LC-04 — Safe Console Logger

### Interface logica

- `info(event, fields?)`
- `error(event, fields?)`

### Regras

- Aceitar somente eventos conhecidos e um conjunto permitido de campos escalares.
- Descartar campos desconhecidos na fronteira do logger.
- Nunca receber o corpo da requisicao, o documento persistido ou o caminho configurado.
- Permitir console capturavel em testes para verificar presenca e ausencia de campos.

Nao existe framework de log, metrica, tracing, armazenamento remoto ou dashboard.

## LC-05 — InitiativeService

O servico conserva o limite transacional local do caso de uso:

1. valida entrada antes de ler ou gravar quando a precedencia funcional assim exige;
2. carrega a colecao atual;
3. aplica regras e forma uma nova colecao completa;
4. chama `replaceAll` uma unica vez;
5. retorna sucesso somente depois da confirmacao do repositorio.

Falha de persistencia impede resposta de sucesso. O servico nao implementa retry, fila ou bloqueio de escrita e nao conhece o arquivo temporario.

## LC-06 — Initiative Domain

O dominio permanece composto por funcoes puras para:

- normalizacao e chave canonica de nome;
- validacao agregada de cadastro, patch e estado completo;
- validacao de cada registro persistido;
- calculo RICE com precisao completa;
- ranking por score, `createdAt` e `id`;
- projecao publica com arredondamento de ate duas casas.

Pontuacao e ranking nao sao cacheados nem persistidos. Essa fronteira permite verificar correcao e capacidade sem servidor HTTP ou sistema de arquivos real.

## LC-07 — JsonInitiativeRepository

### Interface publica

- `initialize()`
- `list()`
- `findById(id)`
- `replaceAll(initiatives)`

### Encapsulamento interno aprovado

O repositorio nao injeta colaboradores logicos separados para validacao do documento ou substituicao atomica. Implementa como operacoes internas privadas:

- montagem do documento com `schemaVersion` igual a `1`;
- interpretacao e validacao estrutural do documento completo;
- validacao das invariantes de cada registro persistido;
- criacao exclusiva do arquivo temporario no mesmo diretorio;
- escrita completa, fechamento, renomeacao e limpeza do temporario.

Esse encapsulamento nao autoriza regras HTTP ou calculo RICE no repositorio. Validadores puros de registro podem ser reutilizados do dominio, mas a sequencia de leitura e substituicao permanece responsabilidade interna do repositorio.

### Estado e consistencia

- Cada operacao trabalha com o agregado completo de ate 1.000 iniciativas.
- O destino existente invalido nunca e corrigido ou substituido automaticamente.
- O temporario nunca representa confirmacao e pode ser removido em falha.
- O caminho do temporario deve ser derivado com nome exclusivo no diretorio do destino, sem colisao entre execucoes sequenciais.
- Nao ha sincronizacao explicita em disco, lock, controle de versao concorrente ou recuperacao automatica.

## Interacoes principais

### Inicializacao

1. Composition Root valida configuracao.
2. Composition Root chama `JsonInitiativeRepository.initialize()`.
3. O repositorio cria estado inicial ausente ou valida integralmente o estado existente.
4. Somente em sucesso, Composition Root inicia HTTP e registra `startup.completed`.

### Escrita confirmada

1. HTTP Request Handler valida protocolo e entrega entrada ao InitiativeService.
2. InitiativeService aplica dominio e produz a colecao final.
3. `JsonInitiativeRepository.replaceAll()` valida e substitui o documento.
4. InitiativeService produz a visao publica somente depois da confirmacao.
5. Error Mapper trata qualquer falha sem expor detalhes internos.

### Leitura e ranking

1. InitiativeService solicita a colecao ao repositorio.
2. O repositorio le e valida o documento completo.
3. O dominio calcula pontuacoes sob demanda e, para ranking, ordena uma copia.
4. HTTP Request Handler envia a projecao publica.

## Matriz de falhas

| Falha | Componente detector | Resultado |
|---|---|---|
| Configuracao invalida | Composition Root | Startup interrompido e log seguro |
| JSON malformado ou versao incompativel | JsonInitiativeRepository | Arquivo preservado; servidor nao escuta |
| Corpo acima de 64 KiB ou malformado | HTTP Request Handler | Erro de cliente estavel; servico nao chamado |
| Regra de negocio invalida | Initiative Domain ou InitiativeService | Erro de aplicacao mapeado; sem gravacao |
| Escrita ou renomeacao falha | JsonInitiativeRepository | Sem sucesso; temporario limpo quando possivel; destino anterior ou novo completo |
| Erro inesperado em requisicao | Fronteira HTTP | `INTERNAL_ERROR` e log por lista permitida |

## Limites deliberados

- Uma escrita por vez e precondicao do demonstrador, nao garantia tecnica de exclusao mutua.
- Nao existem banco, fila, cache, worker, cluster, balanceador ou servico externo.
- Nao existem retry, circuit breaker, replicacao, alta disponibilidade, RTO ou RPO.
- Nao existe autenticacao ou autorizacao no MVP local.
- Infrastructure Design permanece N/A porque nao ha recurso de implantacao a mapear.

## Rastreabilidade

| Componente | Fontes aprovadas |
|---|---|
| Composition Root | RNF-02, RNF-05, RNF-08, RNF-10; Application Design |
| HTTP Request Handler e Error Mapper | RNF-09, RNF-10; resposta 4 do plano |
| Safe Console Logger | RNF-10, DT-08 |
| InitiativeService e Domain | RNF-04, RNF-11; Functional Design; resposta 3 |
| JsonInitiativeRepository | RNF-03, RNF-07, RNF-08; respostas 1, 2 e 5 |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
