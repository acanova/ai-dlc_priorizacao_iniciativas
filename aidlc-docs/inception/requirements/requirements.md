# Requisitos — API de Priorizacao de Iniciativas

## 1. Resumo da analise de intencao

| Item | Classificacao |
|---|---|
| Solicitacao | Criar uma API local para cadastrar, atualizar, listar e priorizar iniciativas pelo metodo RICE |
| Tipo | Novo projeto greenfield |
| Escopo | Multiplos componentes internos em uma unica unidade de trabalho |
| Complexidade | Moderada |
| Profundidade | Padrao, orientada a apresentacao e revisao dos artefatos |

O produto sera um MVP local para demonstrar o fluxo AI-DLC durante um workshop. A solucao deve ser pequena, reproduzivel e testavel, sem interface grafica, servicos externos ou infraestrutura em nuvem.

## 2. Objetivos

- Padronizar o calculo RICE usado na priorizacao de iniciativas.
- Produzir um ranking deterministico e explicavel.
- Impedir a persistencia de entradas invalidas.
- Permitir a demonstracao da jornada principal com execucao e testes locais.

## 3. Requisitos funcionais

### RF-01 — Verificacao de saude

A API deve disponibilizar `GET /health` e responder com HTTP `200` e um objeto JSON que indique que o processo esta funcionando.

### RF-02 — Cadastro de iniciativa

A API deve disponibilizar `POST /api/v1/initiatives` para cadastrar uma iniciativa com os campos:

- `name`: texto obrigatorio;
- `reach`: numero decimal maior ou igual a zero;
- `impact`: um dos valores discretos `0.25`, `0.5`, `1`, `2` ou `3`;
- `confidence`: numero entre `0` e `100`, inclusive;
- `effort`: numero maior que zero.

O nome deve ter os espacos das extremidades removidos e possuir entre 1 e 120 caracteres depois dessa normalizacao. A API deve atribuir um identificador unico e registrar informacao suficiente para preservar a ordem de criacao.

### RF-03 — Unicidade de nome

A API deve rejeitar o cadastro ou a atualizacao que resulte em nomes duplicados. A comparacao deve ignorar diferencas entre maiusculas e minusculas e espacos nas extremidades.

### RF-04 — Atualizacao parcial

A API deve disponibilizar `PATCH /api/v1/initiatives/{id}` e:

- aceitar um ou mais campos editaveis conhecidos;
- rejeitar corpo vazio;
- rejeitar campos desconhecidos;
- validar o estado final completo antes de persistir;
- responder com erro de recurso nao encontrado quando o identificador nao existir.

### RF-05 — Listagem

A API deve disponibilizar `GET /api/v1/initiatives` e retornar todas as iniciativas cadastradas, incluindo identificador, valores de entrada e pontuacao RICE calculada.

### RF-06 — Calculo RICE

A pontuacao deve ser calculada pela formula:

```text
score = (reach * impact * (confidence / 100)) / effort
```

A pontuacao deve ser sempre calculada pela aplicacao e nunca aceita diretamente do cliente. O calculo conhecido com `reach = 1000`, `impact = 2`, `confidence = 80` e `effort = 10` deve produzir `160`.

### RF-07 — Ranking

A API deve disponibilizar `GET /api/v1/ranking` e ordenar as iniciativas pela pontuacao RICE em ordem decrescente.

- A ordenacao deve usar a precisao completa do numero em JavaScript.
- A resposta deve exibir a pontuacao arredondada para duas casas decimais.
- Empates na pontuacao completa devem ser resolvidos pela ordem de criacao, com a iniciativa mais antiga primeiro.
- Cada item deve mostrar os valores utilizados no calculo.

### RF-08 — Validacao e erros

A API deve rejeitar JSON malformado, dados fora das regras, corpos vazios quando exigidos e requisicoes acima do limite permitido. As respostas de erro devem usar JSON com um codigo estavel e uma mensagem compreensivel, sem stack traces nem caminhos locais.

### RF-09 — Persistencia

As iniciativas devem ser persistidas em um arquivo JSON local com `schemaVersion` igual a `1`. Dados invalidos nao podem ser gravados, e os dados validos devem permanecer disponiveis depois do reinicio do processo.

## 4. Requisitos nao funcionais

### RNF-01 — Plataforma e dependencias

- Executar em Node.js 22 ou superior.
- Usar JavaScript moderno com ECMAScript Modules em arquivos `.mjs`.
- Usar somente modulos nativos do Node.js.
- Nao adicionar dependencias externas de execucao ou desenvolvimento sem aprovacao explicita em um gate do AI-DLC.
- Nao exigir etapa de compilacao.

### RNF-02 — Execucao local

- Escutar em `127.0.0.1` por padrao.
- Usar a porta `3000` por padrao.
- Permitir configuracao por `HOST`, `PORT` e `DATA_FILE` via `process.env`.
- Nao utilizar contêineres, banco de dados, recursos em nuvem ou chamadas a servicos externos.

### RNF-03 — Seguranca proporcional ao prototipo

- Limitar o corpo de cada requisicao a 64 KiB.
- Nao usar `eval()` nem execucao dinamica de codigo.
- Nao expor detalhes internos da maquina em respostas.
- Nao implementar autenticacao para este MVP local com dados ficticios.

### RNF-04 — Qualidade e testabilidade

- Isolar validacao, calculo e ordenacao da camada HTTP sempre que isso melhorar a testabilidade.
- Usar `node:test` e `node:assert/strict`.
- Cobrir o calculo conhecido, limites de validacao, cadastro, atualizacao, listagem, ranking, desempate, erros e persistencia.
- Permitir executar todos os testes com `npm test` e iniciar a API com `npm start`.

### RNF-05 — Adequacao ao workshop

A implementacao e seus artefatos devem ser claros o suficiente para revisao em uma apresentacao e simples o suficiente para demonstracao durante um workshop de ate duas horas. Nao ha SLA formal de latencia, disponibilidade, RTO ou RPO para este prototipo.

## 5. Contrato de dados

### 5.1 Entrada de iniciativa

| Campo | Tipo | Regra |
|---|---|---|
| `name` | string | Obrigatorio, normalizado, 1 a 120 caracteres e unico sem diferenciar maiusculas de minusculas |
| `reach` | number | Decimal maior ou igual a zero |
| `impact` | number | Um de `0.25`, `0.5`, `1`, `2` ou `3` |
| `confidence` | number | Entre `0` e `100`, inclusive |
| `effort` | number | Maior que zero |

### 5.2 Persistencia

O arquivo deve manter a estrutura de nivel superior:

```json
{
  "schemaVersion": 1,
  "initiatives": []
}
```

Cada iniciativa persistida deve conter o identificador, os valores de entrada normalizados e os metadados minimos necessarios para o desempate por ordem de criacao. A pontuacao RICE nao deve ser tratada como entrada do cliente e deve ser recalculada pela aplicacao.

## 6. Cenarios de aceite

### CA-01 — Jornada principal

1. Cadastrar tres iniciativas validas.
2. Consultar o ranking e verificar ordem decrescente de pontuacao.
3. Alterar o esforco de uma iniciativa por `PATCH`.
4. Consultar novamente e verificar a mudanca de posicao.
5. Enviar uma entrada invalida e verificar que ela nao foi persistida.

### CA-02 — Calculo conhecido

Dado `reach = 1000`, `impact = 2`, `confidence = 80` e `effort = 10`, a pontuacao retornada deve ser `160`.

### CA-03 — Empate deterministico

Dadas duas iniciativas com a mesma pontuacao completa, a iniciativa criada primeiro deve aparecer primeiro no ranking.

### CA-04 — Arredondamento de exibicao

Dada uma pontuacao com mais de duas casas decimais, a ordenacao deve considerar o valor completo e a representacao da resposta deve ser arredondada para duas casas decimais.

### CA-05 — Persistencia e reinicio

Dada uma iniciativa persistida, quando o processo for reiniciado usando o mesmo `DATA_FILE`, a iniciativa deve continuar disponivel.

### CA-06 — Erros seguros

Dada uma requisicao invalida ou uma falha interna, a resposta deve apresentar codigo e mensagem claros sem expor stack trace ou caminho local.

## 7. Fora do escopo

- Interface grafica.
- Login, autenticacao ou controle de usuarios.
- Exclusao de iniciativas.
- Banco de dados, contêineres ou implantacao em nuvem.
- Integracoes externas.
- Colaboracao, comentarios ou aprovacoes.
- Historico de decisoes e outros metodos de priorizacao.

## 8. Decisoes das extensoes

| Extensao | Decisao | Justificativa |
|---|---|---|
| Resiliency Baseline | Desabilitada | O projeto e um prototipo local de workshop |
| Security Baseline | Desabilitada | As regras bloqueantes de producao foram dispensadas para o prototipo |
| Property-Based Testing | Desabilitada | O projeto usara os testes unitarios e de integracao definidos no ambiente tecnico |

As regras completas dessas extensoes nao se aplicam ao projeto porque todas foram explicitamente desabilitadas na Analise de Requisitos.

## 9. Rastreabilidade das decisoes

| Decisao aprovada | Requisitos relacionados |
|---|---|
| Escala de impacto RICE discreta | RF-02, RF-06 |
| Desempate pela iniciativa mais antiga | RF-02, RF-07 |
| Nomes unicos sem diferenciar maiusculas de minusculas | RF-03 |
| `reach` decimal nao negativo, `confidence` de 0 a 100 e `effort` positivo | RF-02 |
| Nome normalizado de 1 a 120 caracteres | RF-02, RF-03 |
| `PATCH` parcial com estado final validado | RF-04 |
| Ordenacao por precisao completa e exibicao com duas casas | RF-06, RF-07 |

## 10. Criterios de conclusao do MVP

O MVP estara concluido quando:

- os cinco endpoints estiverem implementados conforme os requisitos aprovados;
- o calculo e o ranking forem corretos e deterministicos;
- entradas invalidas nao forem persistidas;
- a jornada principal puder ser demonstrada localmente;
- `npm test` executar com sucesso todos os testes automatizados;
- `npm start` iniciar a API sem dependencias externas;
- o codigo respeitar as decisoes aprovadas nos artefatos AI-DLC.
