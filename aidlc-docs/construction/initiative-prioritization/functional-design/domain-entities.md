# Entidades de Dominio — Initiative Prioritization

## Visao geral

O dominio possui uma entidade persistida, `Initiative`, e tipos de entrada, patch, projecao e erro que delimitam suas transformacoes. Nao ha usuarios, aprovacoes, comentarios, historico, exclusao ou entidades de interface grafica no MVP.

## InitiativeInput

Representa os fatores de negocio completos, depois da normalizacao do nome.

| Campo | Tipo conceitual | Obrigatorio | Regra |
|---|---|---:|---|
| `name` | `string` | Sim | `trim()`, de 1 a 120 caracteres |
| `reach` | `number` | Sim | Finito e maior ou igual a zero |
| `impact` | `number` | Sim | Um de `0.25`, `0.5`, `1`, `2`, `3` |
| `confidence` | `number` | Sim | Finito, de `0` a `100` inclusive |
| `effort` | `number` | Sim | Finito e maior que zero |

```text
InitiativeInput = {
  name,
  reach,
  impact,
  confidence,
  effort
}
```

## InitiativePatch

Representa um subconjunto nao vazio de `InitiativeInput`. Somente os cinco campos editaveis podem aparecer. Campos ausentes sao preservados a partir do registro existente; campos presentes passam por validacao antes da consulta de existencia.

```text
InitiativePatch = non-empty partial InitiativeInput
```

`id`, `createdAt`, `score` e `creationOrder` nunca sao editaveis.

## InitiativeRecord

E a entidade completa persistida no arquivo JSON.

| Campo | Origem | Mutabilidade | Finalidade |
|---|---|---|---|
| `id` | Gerador injetado no cadastro | Imutavel | Identidade unica e desempate final |
| `createdAt` | Relogio injetado no cadastro | Imutavel | Criterio primario da ordem de criacao |
| `name` | Entrada normalizada | Editavel | Nome apresentado e base da chave canonica |
| `reach` | Entrada | Editavel | Fator RICE de alcance |
| `impact` | Entrada | Editavel | Fator RICE de impacto |
| `confidence` | Entrada | Editavel | Fator RICE de confianca percentual |
| `effort` | Entrada | Editavel | Divisor de esforco do RICE |

```text
InitiativeRecord = InitiativeInput + {
  id,
  createdAt
}
```

### Invariantes

- `id` e texto unico e nao vazio.
- `createdAt` e um instante ISO 8601 UTC canonico e valido.
- Os cinco campos de `InitiativeInput` sempre formam um estado completo valido.
- Nenhum outro registro possui a mesma chave canonica de nome.
- `score` nao integra o estado persistido; e sempre derivado.
- `creationOrder` nao integra o modelo final. `createdAt` e `id` substituem o detalhe provisorio do Application Design.

## InitiativeView

E a projecao publica de um registro, usada por cadastro, atualizacao, listagem e ranking.

```text
InitiativeView = InitiativeRecord + {
  score
}
```

| Campo derivado | Tipo | Regra |
|---|---|---|
| `score` | `number` JSON | RICE recalculado e arredondado para no maximo duas casas |

A visao nao inclui a chave canonica do nome, a pontuacao completa auxiliar, `schemaVersion` ou detalhes do repositorio.

## StoredDocument

Representa o agregado persistido da unica unidade.

```text
StoredDocument = {
  schemaVersion: 1,
  initiatives: InitiativeRecord[]
}
```

### Invariantes do agregado

- `schemaVersion` e exatamente `1`.
- `initiatives` e uma colecao, inclusive quando vazia.
- Todos os registros satisfazem as invariantes de `InitiativeRecord`.
- Identificadores e nomes canonicos sao unicos na colecao.
- A ordem da colecao e preservada em listagens e substituicoes; o ranking trabalha sobre uma copia.

## Valores derivados nao persistidos

| Valor | Derivacao | Uso |
|---|---|---|
| `canonicalName` | `name.trim().toLowerCase()` | Detectar nomes duplicados |
| `fullScore` | Formula RICE sem arredondamento | Comparacao primaria do ranking |
| `publicScore` | `fullScore` arredondado para no maximo duas casas | Campo `score` de `InitiativeView` |

Esses valores sao recalculados para evitar divergencia entre entradas persistidas e resultados apresentados.

## ApplicationError

Representa uma falha esperada que pode atravessar servico e dominio ate a traducao HTTP.

```text
ApplicationError = {
  code,
  message,
  details?
}
```

| Codigo | Significado funcional | Detalhes permitidos |
|---|---|---|
| `VALIDATION_ERROR` | Corpo, entrada, patch ou estado final invalido | Colecao segura de erros de campo |
| `DUPLICATE_NAME` | Chave canonica pertence a outro registro | Campo `name`, sem revelar dados internos |
| `NOT_FOUND` | Patch valido referencia iniciativa ausente | Identificador solicitado, se considerado seguro pela fronteira HTTP |

Codigos de protocolo como `MALFORMED_JSON`, `BODY_TOO_LARGE` e `METHOD_NOT_ALLOWED` pertencem a API HTTP, embora usem o mesmo envelope de erro. `INTERNAL_ERROR` protege falhas inesperadas.

## ValidationErrorDetail

Cada item da colecao agregada de validacao possui:

| Campo | Tipo | Proposito |
|---|---|---|
| `field` | `string` | Identificar `body` ou o campo relacionado |
| `code` | `string` | Classificar de forma estavel, por exemplo `REQUIRED`, `UNKNOWN_FIELD`, `INVALID_TYPE`, `OUT_OF_RANGE` ou `INVALID_VALUE` |
| `message` | `string` | Explicar a correcao sem expor detalhes internos |

```text
ValidationDetails = {
  fields: ValidationErrorDetail[]
}
```

A colecao nunca e vazia quando acompanha `VALIDATION_ERROR` e segue a ordem deterministica definida em `business-rules.md`.

## Relacoes e ciclo de vida

1. `InitiativeInput` valido origina um `InitiativeRecord` no cadastro.
2. `InitiativePatch` valido transforma um registro existente em outro registro com a mesma identidade e o mesmo instante de criacao.
3. `StoredDocument` agrega todos os registros e e substituido como uma unidade funcional.
4. `InitiativeRecord` origina `InitiativeView` por calculo, sem mutar o registro.
5. Nao existe transicao de exclusao no MVP.

## Estados de uma operacao de escrita

| Estado | Descricao | Pode persistir? |
|---|---|---:|
| Recebida | Entrada ainda nao validada | Nao |
| Validada | Entrada ou patch local sem erros | Nao |
| Resolvida | Existencia e unicidade verificadas; estado final completo | Nao |
| Persistida | `replaceAll` concluido para a colecao final | Sim, uma vez |
| Rejeitada | Qualquer erro esperado anterior a gravacao | Nao |

## Rastreabilidade

| Entidade ou tipo | Requisitos | Historias |
|---|---|---|
| `InitiativeInput` e `InitiativePatch` | RF-02, RF-04, RF-08 | US-02, US-03, US-07 |
| `InitiativeRecord` | RF-02, RF-03, RF-09 | US-02, US-03, US-08 |
| `InitiativeView` | RF-05, RF-06, RF-07 | US-04, US-05, US-06 |
| `StoredDocument` | RF-09 | US-08 |
| `ApplicationError` e detalhes | RF-08 | US-03, US-07, US-09 |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
