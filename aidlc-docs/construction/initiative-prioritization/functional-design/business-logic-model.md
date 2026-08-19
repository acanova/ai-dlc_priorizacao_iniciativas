# Modelo de Logica de Negocio — Initiative Prioritization

## Proposito

Este documento detalha os fluxos funcionais da unica unidade da API de Priorizacao de Iniciativas. O dominio normaliza e valida entradas, calcula RICE, produz uma ordem deterministica e impede que uma operacao invalida alcance a fronteira de persistencia.

## Decisoes funcionais aprovadas

| Tema | Decisao |
|---|---|
| Nome canonico | Aplicar `trim()` e conversao para minusculas; preservar acentos, pontuacao e espacos internos |
| Ordem de criacao | Comparar `createdAt` crescente e usar `id` crescente quando os instantes forem iguais |
| Pontuacao publica | Numero JSON arredondado para no maximo duas casas decimais |
| Erros de validacao | Retornar todos os erros de campo encontrados em ordem deterministica |
| Precedencia no `PATCH` | Validar o patch antes de consultar a existencia do identificador |

### Refinamento do Application Design

O Application Design usou `creationOrder` como representacao provisoria da ordem de criacao. A resposta aprovada no plano de Functional Design substitui esse detalhe por `createdAt` e `id`. A implementacao, a persistencia, o ranking e os testes devem seguir este documento: nao existe campo `creationOrder` no modelo funcional final.

## Fronteiras funcionais

| Fronteira | Recebe | Produz | Regra principal |
|---|---|---|---|
| API HTTP | Metodo, caminho, identificador e JSON interpretado | Resultado ou erro de aplicacao traduzido para HTTP | Nao calcula RICE nem altera registros diretamente |
| `InitiativeService` | Entrada de cadastro, patch ou consulta | `InitiativeView` ou colecao de visoes | Orquestra validacao, leitura, verificacoes e gravacao |
| Dominio | Objetos simples | Dados normalizados, erros, pontuacoes e ordenacao | Funcoes puras, sem acesso a HTTP ou arquivo |
| Repositorio | Colecao completa de `InitiativeRecord` | Estado carregado ou confirmacao de substituicao | Persiste somente o estado final entregue pelo servico |

## Fluxo de cadastro

1. Receber o corpo interpretado pelo endpoint `POST /api/v1/initiatives`.
2. Confirmar que o corpo e um objeto e coletar, em ordem deterministica, erros de campos ausentes, desconhecidos ou invalidos.
3. Normalizar `name` com `trim()` e validar o estado completo.
4. Se houver erros, retornar `VALIDATION_ERROR` com a colecao completa e nao consultar nem gravar o repositorio.
5. Carregar as iniciativas atuais.
6. Gerar a chave canonica do nome normalizado e compara-la com a chave de cada registro existente.
7. Se houver colisao, retornar `DUPLICATE_NAME` e nao gravar.
8. Criar `id` unico e `createdAt` canonico usando os colaboradores injetados.
9. Acrescentar o novo registro ao fim da colecao atual.
10. Substituir o conjunto persistido uma unica vez.
11. Calcular e arredondar a pontuacao somente ao formar a resposta publica.

## Fluxo de atualizacao parcial

1. Receber `id` e o corpo interpretado pelo endpoint `PATCH /api/v1/initiatives/{id}`.
2. Validar o patch isoladamente antes de qualquer consulta:
   - o corpo deve ser um objeto;
   - deve conter pelo menos um campo;
   - todos os campos devem ser editaveis e conhecidos;
   - cada valor fornecido deve obedecer a sua regra de tipo e faixa.
3. Agregar todos os erros encontrados. Se a colecao nao estiver vazia, retornar `VALIDATION_ERROR`, mesmo quando o `id` nao existir.
4. Carregar as iniciativas e localizar o `id`.
5. Se o identificador nao existir, retornar `NOT_FOUND`.
6. Normalizar os valores fornecidos e combina-los com o registro atual, preservando `id` e `createdAt`.
7. Validar novamente o estado final completo.
8. Comparar o nome canonico final com os demais registros, excluindo o proprio `id`.
9. Se houver colisao, retornar `DUPLICATE_NAME`.
10. Substituir o registro na mesma posicao da colecao e persistir o conjunto completo uma unica vez.
11. Retornar a visao atualizada com pontuacao recalculada.

Essa ordem torna a precedencia observavel: patch invalido produz `VALIDATION_ERROR`; patch valido para identificador ausente produz `NOT_FOUND`; patch valido que colide com outro nome produz `DUPLICATE_NAME`.

## Fluxo de listagem

1. Carregar a colecao persistida.
2. Preservar a ordem do arquivo.
3. Converter cada registro em `InitiativeView`.
4. Calcular a pontuacao a partir dos quatro fatores e arredonda-la somente na projecao publica.
5. Retornar uma colecao vazia valida quando nao houver registros.

## Fluxo de ranking

1. Carregar a colecao persistida.
2. Criar uma copia para que a ordenacao nao altere o estado carregado.
3. Calcular a pontuacao completa de cada iniciativa.
4. Ordenar pelos criterios abaixo, na sequencia:
   1. pontuacao completa decrescente;
   2. `createdAt` crescente;
   3. `id` crescente em comparacao lexicografica.
5. Somente depois da ordenacao, projetar cada item com a pontuacao publica arredondada.

O arredondamento nunca participa da comparacao. Iniciativas cujas pontuacoes publicas parecem iguais podem manter uma ordem diferente quando seus valores completos diferem.

## Transformacoes puras

### Normalizacao do nome

```text
normalizedName = name.trim()
canonicalName = normalizedName.toLowerCase()
```

- A forma normalizada e persistida e exibida.
- A forma canonica e usada somente para comparacao de unicidade.
- Acentos, pontuacao e espacos internos permanecem significativos.
- Portanto, `" Acao "` e `"acao"` sao nomes distintos, enquanto `" Acao "` e `"ACAO"` colidem.

### Calculo e apresentacao da pontuacao

```text
fullScore = (reach * impact * (confidence / 100)) / effort
publicScore = Math.round((fullScore + Number.EPSILON) * 100) / 100
```

- `fullScore` orienta o ranking.
- `publicScore` e um numero JSON, nao texto.
- Valores inteiros ou com uma casa nao recebem zeros textuais adicionais.
- A pontuacao nunca e aceita nem persistida como entrada do cliente.

## Limite funcional da persistencia

O servico prepara uma nova colecao completa e chama `replaceAll` somente depois de todas as validacoes e verificacoes de duplicidade. Falhas esperadas anteriores a essa chamada nao alteram o estado. O mecanismo de gravacao atomica, a serializacao de escritas concorrentes e o tratamento de arquivo corrompido permanecem para NFR Design.

## Rastreabilidade

| Fluxo ou decisao | Requisitos | Historias e cenarios |
|---|---|---|
| Cadastro normalizado e unico | RF-02, RF-03, RF-08, RF-09 | US-02, US-03; CA-01 |
| Atualizacao parcial e precedencia | RF-03, RF-04, RF-08, RF-09 | US-03, US-07; CA-01, CA-06 |
| Calculo e projecao da pontuacao | RF-05, RF-06, RF-07 | US-04, US-05, US-06; CA-02, CA-04 |
| Ranking deterministico | RF-07 | US-06; CA-03, CA-04 |
| Persistencia sem estado invalido | RF-09 | US-03, US-08; CA-05 |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
