# Servicos e Orquestracao

## Decisao de servico

A aplicacao tera um unico `InitiativeService`. Essa fachada concentra os quatro casos de uso de negocio sem dividir artificialmente leitura e escrita na unica unidade de trabalho. A camada HTTP permanece responsavel apenas pelo protocolo, enquanto regras deterministicas permanecem no dominio.

## InitiativeService

### Responsabilidade

Coordenar repositorio, funcoes de dominio, gerador de identificadores e relogio para produzir mudancas atomicas do ponto de vista do caso de uso. O servico nao conhece `request`, `response`, status HTTP, variaveis de ambiente ou detalhes de `node:fs`.

### Dependencias

| Dependencia | Uso pelo servico |
|---|---|
| Repositorio de iniciativas | Ler o estado atual e persistir o novo conjunto validado |
| Funcoes de dominio | Normalizar, validar, comparar nomes, calcular, ordenar e projetar respostas |
| `generateId` | Criar identificadores unicos sem acoplamento ao ambiente de teste |
| `now` | Registrar instante de criacao de modo controlavel |

## Orquestracao dos casos de uso

### Cadastrar iniciativa

1. A API HTTP entrega o corpo interpretado a `createInitiative`.
2. O servico solicita ao dominio normalizacao e validacao completa.
3. O servico carrega o conjunto atual e verifica nome canonico duplicado.
4. O servico cria identificador e metadados de ordem de criacao.
5. O conjunto final validado e enviado ao repositorio.
6. O servico devolve a projecao publica; a API responde com HTTP `201`.

Se qualquer verificacao esperada falhar, a gravacao nao ocorre e um `ApplicationError` estavel atravessa a fronteira ate a API HTTP.

### Atualizar iniciativa

1. A API extrai o identificador do caminho e entrega o patch interpretado.
2. O servico valida que o patch contem somente campos editaveis e nao esta vazio.
3. O servico carrega o conjunto e confirma que o identificador existe.
4. O patch normalizado e combinado com o registro atual sem alterar seus metadados de criacao.
5. O dominio valida o estado final completo.
6. O servico verifica se o nome final colide com outro identificador.
7. O repositorio recebe o conjunto final e o servico devolve a projecao atualizada.

A ordem garante que um patch invalido, recurso ausente ou nome duplicado nao altere o arquivo.

### Listar iniciativas

1. O servico carrega as iniciativas.
2. Cada registro e convertido pelo dominio em uma visao com pontuacao calculada.
3. A colecao e devolvida sem expor `schemaVersion` ou detalhes do repositorio.

A listagem preserva a ordem persistida; somente o endpoint de ranking aplica ordenacao RICE.

### Consultar ranking

1. O servico carrega as iniciativas.
2. O dominio cria uma nova colecao ordenada pela pontuacao completa.
3. Empates completos usam `creationOrder` crescente.
4. Depois da ordenacao, cada registro e projetado com pontuacao arredondada para duas casas.

Essa sequencia impede que o arredondamento visual altere a classificacao.

## Servico de saude

`GET /health` nao exige um servico de aplicacao separado. A verificacao confirma que o processo HTTP esta respondendo e retorna `{ "status": "ok" }` diretamente pela API HTTP. Ela nao promete diagnosticar armazenamento, infraestrutura ou dependencias externas, que nao fazem parte do MVP.

## Politica de falhas

### Falhas esperadas

- Dominio e servico lancam `ApplicationError` com codigo conhecido e mensagem segura.
- A API HTTP mantem uma tabela unica de traducao para status e corpo JSON.
- Detalhes por campo podem ser incluidos quando forem uteis e nao revelarem informacao interna.

### Falhas inesperadas

- A fronteira HTTP captura erros desconhecidos e retorna `INTERNAL_ERROR` com HTTP `500`.
- Stack trace, mensagem tecnica bruta e caminho local nao integram a resposta.
- O erro original pode ser registrado no processo para diagnostico local, fora do payload HTTP.

## Limites de transacao local

Cada operacao de escrita prepara e valida o conjunto completo antes de chamar `replaceAll`. O formato concreto de gravacao segura e o comportamento diante de concorrencia no arquivo serao definidos em NFR Design; nao existe transacao distribuida, banco de dados ou coordenacao entre unidades.

## Testabilidade do servico

- Um repositorio em memoria pode substituir o repositorio JSON nos testes unitarios.
- `generateId` e `now` podem retornar valores fixos.
- As funcoes puras do dominio podem ser verificadas sem iniciar servidor ou criar arquivos.
- Os testes integrados exercitam a mesma composicao com porta efemera e arquivo temporario.

## Rastreabilidade

| Caso de uso | Requisitos | Historias |
|---|---|---|
| Cadastro | RF-02, RF-03, RF-08 e RF-09 | US-02 e US-03 |
| Atualizacao | RF-03, RF-04, RF-08 e RF-09 | US-03 e US-07 |
| Listagem | RF-05 e RF-06 | US-04 e US-05 |
| Ranking | RF-06 e RF-07 | US-05 e US-06 |
| Saude e erros | RF-01 e RF-08 | US-01 e US-09 |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
