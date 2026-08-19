# Plano de Functional Design — Initiative Prioritization

## Objetivo

Detalhar a logica de negocio da unica unidade de trabalho da API de Priorizacao de Iniciativas: modelo de dominio, invariantes, validacao, atualizacao parcial, calculo RICE, ordenacao deterministica e sequencia funcional de persistencia.

## Contexto analisado

- Application Design aprovado com componentes separados para HTTP, `InitiativeService`, dominio, repositorio JSON e composicao.
- Uma unica unidade de trabalho; Units Generation foi ignorada conforme o plano aprovado.
- Cinco endpoints HTTP, sem interface grafica ou integracoes externas.
- Regras centrais ja fixadas: escala de impacto discreta, nome normalizado e unico sem diferenciar maiusculas de minusculas, `PATCH` parcial, ordenacao pela pontuacao completa e desempate pela ordem de criacao.
- Decisoes de integridade fisica do arquivo e concorrencia permanecem reservadas para NFR Design.

## Instrucoes para resposta

Preencha cada campo `[Answer]:` com a letra da opcao escolhida. Se nenhuma opcao representar a preferencia, escolha `X` e descreva a resposta depois da tag. Todas as perguntas precisam ser respondidas antes da geracao dos artefatos de Functional Design.

## Perguntas de Functional Design

### Question 1
Qual regra deve produzir a chave canonica usada para detectar nomes duplicados?

A) Aplicar `trim()` e conversao para minusculas, preservando acentos, pontuacao e espacos internos

B) Aplicar `trim()`, conversao para minusculas e remocao de acentos, preservando pontuacao e espacos internos

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
Como a ordem de criacao deve ser representada para garantir desempate estavel depois de reinicios?

A) Inteiro monotonicamente crescente, atribuido como o maior `creationOrder` persistido mais um

B) Instante `createdAt` como criterio primario, usando o identificador apenas se dois instantes forem iguais

X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
Como a pontuacao arredondada para duas casas deve aparecer no JSON de resposta?

A) Como numero JSON arredondado para no maximo duas casas, por exemplo `10.5`

B) Como texto com exatamente duas casas, por exemplo `"10.50"`

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
Quando varios campos de uma mesma entrada forem invalidos, qual detalhe deve acompanhar `VALIDATION_ERROR`?

A) Uma colecao com todos os erros de campo encontrados em uma unica validacao

B) Somente o primeiro erro de campo encontrado pela ordem deterministica de validacao

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5
Em um `PATCH` para um identificador inexistente cujo corpo tambem seja invalido, qual erro deve ter precedencia?

A) Validar primeiro a estrutura do patch e retornar `VALIDATION_ERROR`; consultar existencia somente para um patch estruturalmente valido

B) Consultar primeiro o identificador e retornar `NOT_FOUND`; validar o patch somente quando a iniciativa existir

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Checklist de execucao

### Parte 1 — Planejamento

- [x] Carregar requisitos, historias, personas, plano de execucao e Application Design aprovados.
- [x] Adaptar o contexto da unica unidade sem exigir artefatos de Units Generation, etapa aprovada como skip.
- [x] Avaliar logica de negocio, modelo de dominio, regras, fluxo de dados, erros, cenarios e integracoes.
- [x] Identificar decisoes funcionais ainda ambiguas ou ausentes.
- [x] Criar perguntas contextuais no formato AI-DLC.
- [x] Validar Markdown, opcoes, tags `[Answer]:` e compatibilidade de renderizacao.
- [x] Receber respostas para todas as perguntas.
- [x] Validar respostas quanto a completude, consistencia e ausencia de ambiguidades.

### Parte 2 — Geracao

- [x] Gerar `aidlc-docs/construction/initiative-prioritization/functional-design/business-logic-model.md`.
- [x] Gerar `aidlc-docs/construction/initiative-prioritization/functional-design/business-rules.md`.
- [x] Gerar `aidlc-docs/construction/initiative-prioritization/functional-design/domain-entities.md`.
- [x] Validar completude, consistencia, sintaxe e rastreabilidade dos artefatos.
- [x] Atualizar cada checkbox e o estado no mesmo ciclo do passo concluido.
- [x] Registrar a conclusao e apresentar o gate padronizado de revisao.
- [x] Obter aprovacao explicita dos artefatos e concluir a etapa no estado e no plano de execucao.

## Limites do design

- Nao definir interface grafica, autenticacao, exclusao, integracoes ou novos endpoints.
- Nao introduzir bibliotecas externas, banco de dados, conteineres ou infraestrutura.
- Nao antecipar decisoes de gravacao atomica, concorrencia ou recuperacao do arquivo reservadas para NFR Design.
- Nao colocar codigo da aplicacao dentro de `aidlc-docs/`.

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
