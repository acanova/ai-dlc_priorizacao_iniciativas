# Regras de Negocio — Initiative Prioritization

## Convencoes

- As regras sao aplicadas pelo dominio ou pelo `InitiativeService`, nunca diretamente pelo repositorio.
- Uma entrada e considerada objeto somente quando representa um objeto JSON nao nulo e nao e uma colecao.
- Campos editaveis, na ordem deterministica de validacao, sao `name`, `reach`, `impact`, `confidence` e `effort`.
- Todos os numeros devem ter tipo numerico e ser finitos.
- Erros esperados usam `ApplicationError` com codigo estavel e detalhes seguros.

## Regras de entrada

### RN-01 — Campos aceitos

Cadastro exige exatamente os cinco campos editaveis. `PATCH` aceita qualquer subconjunto nao vazio desses campos. Campos como `id`, `createdAt`, `score`, `creationOrder` ou qualquer chave desconhecida sao rejeitados com `VALIDATION_ERROR`.

### RN-02 — Nome

1. `name` deve ser texto.
2. O valor persistido e o resultado de `trim()`.
3. O valor normalizado deve conter entre 1 e 120 caracteres JavaScript, inclusive.
4. A chave canonica e o valor normalizado convertido para minusculas.
5. A canonicalizacao nao remove acentos ou pontuacao e nao reduz espacos internos.

### RN-03 — Alcance

`reach` deve ser numero finito maior ou igual a zero. Valores decimais sao permitidos.

### RN-04 — Impacto

`impact` deve ser numero finito e exatamente um dos valores `0.25`, `0.5`, `1`, `2` ou `3`.

### RN-05 — Confianca

`confidence` deve ser numero finito entre `0` e `100`, inclusive. Valores decimais sao permitidos.

### RN-06 — Esforco

`effort` deve ser numero finito estritamente maior que zero. Valores decimais sao permitidos.

### RN-07 — Pontuacao derivada

`score` e calculado por:

```text
(reach * impact * (confidence / 100)) / effort
```

O resultado completo deve ser finito. A entrada do cliente nunca pode definir `score`, e o arquivo nao precisa persisti-lo.

## Unicidade e identidade

### RN-08 — Identificador

Cada cadastro recebe um `id` unico, nao vazio e estavel. Atualizacoes nao podem trocar o identificador.

### RN-09 — Instante de criacao

Cada cadastro recebe um `createdAt` em formato ISO 8601 UTC canonico produzido pelo relogio injetado. Atualizacoes preservam esse valor.

### RN-10 — Nome unico

Dois registros colidem quando suas chaves canonicas sao iguais. No cadastro, a comparacao inclui todos os registros. No `PATCH`, a comparacao exclui o registro que possui o mesmo `id`. Colisao produz `DUPLICATE_NAME` e nao grava dados.

Exemplos:

| Primeiro nome | Segundo nome | Resultado |
|---|---|---|
| `" Nova API "` | `"nova api"` | Duplicado |
| `"Acao"` | `"ACAO"` | Duplicado |
| `"Acao"` | `"Ação"` | Distinto |
| `"Portal-Cliente"` | `"Portal Cliente"` | Distinto |
| `"Portal  Cliente"` | `"Portal Cliente"` | Distinto |

## Validacao agregada

### RN-11 — Colecao de erros

Uma unica passagem de validacao coleta todos os erros independentes detectaveis. O erro usa o formato conceitual:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": [
        {
          "field": "reach",
          "code": "OUT_OF_RANGE",
          "message": "reach must be greater than or equal to zero"
        }
      ]
    }
  }
}
```

As mensagens finais podem ser redigidas durante Code Generation, mas `field`, `code` e `message` devem permanecer seguros e consistentes.

### RN-12 — Ordem dos erros

Os detalhes seguem esta ordem:

1. erro do corpo como um todo;
2. campos desconhecidos em ordem lexicografica;
3. campos obrigatorios ausentes na ordem `name`, `reach`, `impact`, `confidence`, `effort`;
4. valores invalidos dos campos presentes nessa mesma ordem.

Um campo recebe no maximo um erro de valor por passagem: o erro de tipo precede o erro de faixa ou conjunto permitido.

### RN-13 — Corpo invalido

- Corpo que nao seja objeto produz um erro no campo conceitual `body`.
- Cadastro sem campo obrigatorio agrega os campos ausentes.
- `PATCH` sem chaves produz erro de patch vazio.
- Campos desconhecidos sao reportados mesmo quando outros campos tambem sao invalidos.

## Regras do cadastro

### RN-14 — Sequencia de decisao

1. Validar e normalizar a entrada completa.
2. Retornar todos os erros de validacao, se houver.
3. Consultar o estado e verificar duplicidade de nome.
4. Atribuir `id` e `createdAt`.
5. Acrescentar o registro e persistir uma vez.
6. Projetar a resposta.

Nenhum erro esperado permite uma gravacao parcial.

## Regras do PATCH

### RN-15 — Validacao antes da existencia

Toda validacao que depende apenas do patch ocorre antes da consulta do identificador. Assim, um patch vazio, com campo desconhecido ou com valor invalido retorna `VALIDATION_ERROR` mesmo se o `id` nao existir.

### RN-16 — Estado final

Depois que o patch e valido e o registro existe:

1. normalizar somente os campos fornecidos;
2. combina-los com o registro atual;
3. preservar `id` e `createdAt`;
4. validar a iniciativa completa resultante;
5. verificar duplicidade do nome final;
6. substituir o registro na mesma posicao da colecao.

O patch e integral: se qualquer regra falhar, nenhum campo e persistido.

### RN-17 — Precedencia de erros

| Ordem | Condicao | Codigo |
|---:|---|---|
| 1 | Patch estruturalmente ou semanticamente invalido por si so | `VALIDATION_ERROR` |
| 2 | Patch valido e identificador ausente | `NOT_FOUND` |
| 3 | Estado final valido, mas nome colide com outro registro | `DUPLICATE_NAME` |
| 4 | Estado final valido e sem colisao | Persistir e responder sucesso |

## Listagem, calculo e ranking

### RN-18 — Listagem

`GET /api/v1/initiatives` preserva a ordem persistida e inclui a pontuacao publica recalculada. A lista vazia e um resultado valido.

### RN-19 — Precisao do ranking

A comparacao primaria usa o resultado numerico completo de RICE, sem arredondamento previo.

### RN-20 — Desempate deterministico

Se as pontuacoes completas forem iguais, vence o menor `createdAt`. Se os instantes forem identicos, vence o menor `id` em comparacao lexicografica. Como ambos os valores sao persistidos, a ordem permanece estavel depois de reinicios.

### RN-21 — Apresentacao da pontuacao

A resposta expoe `score` como numero JSON arredondado para no maximo duas casas. Por exemplo, `10.5` permanece numero `10.5`, e nao texto `"10.50"`.

### RN-22 — Imutabilidade da ordenacao

O ranking devolve uma nova colecao e nao altera a ordem dos registros mantidos pelo repositorio.

## Regras de persistencia funcional

### RN-23 — Documento versionado

O estado de nivel superior contem `schemaVersion` igual a `1` e uma colecao `initiatives`. Cada item persistido obedece ao modelo completo de `InitiativeRecord`.

### RN-24 — Fronteira unica de gravacao

Cadastro e atualizacao chamam `replaceAll` no maximo uma vez, somente com a colecao final valida. Calculo, listagem e ranking nao gravam o arquivo.

### RN-25 — Falhas esperadas nao alteram dados

`VALIDATION_ERROR`, `DUPLICATE_NAME` e `NOT_FOUND` encerram o caso de uso antes de `replaceAll`. Detalhes de atomicidade fisica e concorrencia pertencem ao NFR Design.

## Rastreabilidade

| Regras | Cobertura principal |
|---|---|
| RN-01 a RN-07 | RF-02, RF-04, RF-06, RF-08; US-02, US-03, US-05, US-07 |
| RN-08 a RN-10 | RF-02, RF-03, RF-07; US-02, US-03, US-06 |
| RN-11 a RN-13 | RF-08; US-03, US-07, US-09 |
| RN-14 a RN-17 | RF-02, RF-03, RF-04, RF-09; US-02, US-03, US-07 |
| RN-18 a RN-22 | RF-05, RF-06, RF-07; US-04, US-05, US-06 |
| RN-23 a RN-25 | RF-09; US-03, US-08 |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
