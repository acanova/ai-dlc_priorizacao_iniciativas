# Perguntas de Verificacao de Requisitos

Preencha cada campo `[Answer]:` com a letra da opcao escolhida. Se nenhuma opcao representar a necessidade, escolha `X` e descreva a resposta apos a tag.

## Question 1
Qual escala de impacto a API deve aceitar no MVP?

A) Escala RICE discreta `{0.25, 0.5, 1, 2, 3}`

B) Escala inteira `{1, 2, 3, 4, 5}`

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
Como o ranking deve desempatar iniciativas com a mesma pontuacao RICE?

A) Nome em ordem alfabetica crescente, ignorando maiusculas e minusculas

B) Ordem de criacao, com a iniciativa mais antiga primeiro

C) Identificador em ordem crescente

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3
Como a API deve tratar nomes de iniciativas repetidos?

A) Exigir nomes unicos, ignorando maiusculas, minusculas e espacos nas extremidades

B) Permitir nomes repetidos porque cada iniciativa possui identificador proprio

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
Quais regras numericas devem ser aplicadas a alcance, confianca e esforco?

A) `reach` deve ser inteiro positivo, `confidence` deve estar entre 1 e 100, e `effort` deve ser numero positivo

B) `reach` deve ser inteiro maior ou igual a zero, `confidence` deve estar entre 0 e 100, e `effort` deve ser numero positivo

C) `reach` pode ser decimal maior ou igual a zero, `confidence` deve estar entre 0 e 100, e `effort` deve ser numero positivo

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 5
Qual regra deve ser aplicada ao nome da iniciativa?

A) Texto obrigatorio, removendo espacos nas extremidades, com 1 a 120 caracteres apos a normalizacao

B) Texto obrigatorio, removendo espacos nas extremidades, com 1 a 255 caracteres apos a normalizacao

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6
Como o endpoint `PATCH /api/v1/initiatives/{id}` deve funcionar?

A) Atualizacao parcial: aceitar um ou mais campos conhecidos, rejeitar corpo vazio e campos desconhecidos, validar o estado final antes de persistir

B) Substituicao completa: exigir todos os campos da iniciativa, apesar do uso de `PATCH`

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
Como a pontuacao RICE deve ser representada nas respostas da API?

A) Retornar o valor calculado com precisao completa do JavaScript e usar o valor completo na ordenacao

B) Arredondar para duas casas decimais tanto na resposta quanto na ordenacao

C) Ordenar pela precisao completa e retornar o valor arredondado para duas casas decimais

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 8
O baseline de resiliencia deve ser aplicado a este projeto?

A) Sim — aplicar praticas direcionais de resiliencia e orientacao de design, apropriadas como ponto de partida para cargas criticas

B) Nao — ignorar o baseline de resiliencia, apropriado para este prototipo local de workshop

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 9
As regras da extensao de seguranca devem ser aplicadas como restricoes bloqueantes?

A) Sim — aplicar todas as regras de seguranca como restricoes bloqueantes, recomendado para aplicacoes de producao

B) Nao — ignorar a extensao, apropriado para PoCs, prototipos e projetos experimentais

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 10
Qual nivel da extensao de testes baseados em propriedades deve ser aplicado?

A) Completo — aplicar todas as regras de PBT como restricoes bloqueantes

B) Parcial — aplicar PBT apenas a funcoes puras e ciclos de serializacao

C) Nenhum — ignorar PBT

X) Other (please describe after [Answer]: tag below)

[Answer]: C
