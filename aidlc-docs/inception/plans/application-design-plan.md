# Plano de Application Design

## Objetivo

Definir os componentes de alto nivel, suas interfaces, os servicos de orquestracao e as dependencias da API de Priorizacao de Iniciativas, preservando a simplicidade exigida para o workshop. Regras detalhadas de negocio permanecem para Functional Design.

## Contexto analisado

- Projeto greenfield, local e com uma unica unidade de trabalho.
- Cinco endpoints HTTP aprovados.
- Dominio com validacao de iniciativas, calculo RICE, ranking deterministico e atualizacao parcial.
- Persistencia em um arquivo JSON com `schemaVersion` igual a `1`.
- Node.js 22 ou superior, ECMAScript Modules e somente modulos nativos.
- Testes unitarios e integrados com `node:test`.
- Sem interface grafica, autenticacao, banco de dados, conteineres, nuvem ou integracoes externas.

## Instrucoes para resposta

Preencha cada campo `[Answer]:` com a letra da opcao escolhida. Se nenhuma opcao representar a preferencia, escolha `X` e descreva a resposta depois da tag. Todas as perguntas precisam ser respondidas antes da geracao dos artefatos de design.

## Perguntas de design

### Question 1
Qual nivel de separacao deve orientar os componentes da unica unidade?

A) Componentes separados para HTTP, servico de aplicacao, dominio e repositorio, favorecendo clareza e testes

B) Componentes separados apenas para HTTP, regras RICE e repositorio, com orquestracao realizada pela camada HTTP

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
Como o servico de aplicacao deve expor as capacidades de iniciativas?

A) Um unico `InitiativeService` com operacoes de cadastro, atualizacao, listagem e ranking

B) Servicos separados por escrita e leitura, mesmo dentro da unica unidade de trabalho

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3
Como as dependencias, como repositorio e gerador de identificadores, devem ser fornecidas ao servico?

A) Injecao explicita por funcao de criacao ou construtor, facilitando substituicao em testes

B) Importacao direta de instancias compartilhadas pelos modulos consumidores, reduzindo configuracao inicial

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
Como falhas esperadas entre dominio, servico e camada HTTP devem ser representadas?

A) Erros de aplicacao com codigos estaveis, traduzidos pela camada HTTP para status e JSON

B) Resultados explicitos no formato sucesso ou falha, sem excecoes para erros esperados

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Checklist de execucao

### Parte 1 — Planejamento

- [x] Ler requisitos, historias, personas e plano de execucao aprovados.
- [x] Identificar capacidades, componentes candidatos e pontos de decisao arquitetural.
- [x] Avaliar as categorias obrigatorias: componentes, metodos, servicos, dependencias e padroes.
- [x] Criar perguntas contextuais no formato AI-DLC.
- [x] Validar estrutura Markdown, opcoes, tags `[Answer]:` e compatibilidade de renderizacao.
- [x] Receber respostas para todas as perguntas.
- [x] Validar respostas quanto a completude, consistencia e ausencia de ambiguidades.
- [x] Confirmar a abordagem de Application Design resultante.

### Parte 2 — Geracao

- [x] Gerar `aidlc-docs/inception/application-design/components.md` com componentes, propositos, responsabilidades e interfaces.
- [x] Gerar `aidlc-docs/inception/application-design/component-methods.md` com assinaturas, entradas, saidas e propositos de alto nivel.
- [x] Gerar `aidlc-docs/inception/application-design/services.md` com servicos, responsabilidades, interacoes e orquestracao.
- [x] Gerar `aidlc-docs/inception/application-design/component-dependency.md` com matriz de dependencias, comunicacao e fluxos de dados.
- [x] Gerar `aidlc-docs/inception/application-design/application-design.md` consolidando os documentos de design.
- [x] Validar completude, consistencia, sintaxe e rastreabilidade dos artefatos.
- [x] Atualizar o plano e o estado no mesmo ciclo de cada passo concluido.
- [x] Registrar a conclusao e apresentar o gate de revisao de Application Design.

## Limites do design

- Nao detalhar algoritmos e regras internas reservados para Functional Design.
- Nao introduzir dependencias externas, infraestrutura ou multiplas unidades.
- Nao ampliar o contrato HTTP, o modelo de dados ou o escopo aprovados.
- Nao colocar codigo da aplicacao dentro de `aidlc-docs/`.

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
