# Resumo da Camada de Repositorio

## Formato e operacoes

`JsonInitiativeRepository` mantem um documento `{ schemaVersion: 1, initiatives: [] }` e expoe `initialize`, `list`, `findById` e `replaceAll`. Toda leitura valida estrutura, registros, identificadores e nomes unicos. A colecao inteira, limitada a 1.000 itens, e tratada em memoria e devolvida por copia.

## Integridade e falhas

Um arquivo ausente e criado. Estado existente malformado, estruturalmente invalido ou incompativel interrompe a inicializacao sem ser alterado. Substituicoes usam arquivo temporario exclusivo no mesmo diretorio, escrita completa, fechamento e rename. Falhas limpam o temporario quando possivel e nunca retornam sucesso falso. Nao ha `fsync`, lock, retry, cache ou recuperacao automatica.

## Cobertura planejada

Os testes cobrem ausencia inicial, persistencia, recarga, copias, tres categorias de estado invalido, capacidade de 1.000 iniciativas e falha injetada de rename com preservacao do documento anterior.

## Conformidade das extensoes

- Resiliency Baseline: N/A; desabilitada.
- Security Baseline: N/A; desabilitada.
- Property-Based Testing: N/A; desabilitada.
