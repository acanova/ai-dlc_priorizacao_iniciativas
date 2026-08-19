# Resumo da Logica de Negocio

## Arquivos

- `src/errors/application-error.mjs`: erro esperado com codigo e detalhes seguros.
- `src/domain/initiative-domain.mjs`: validacao agregada, normalizacao, RICE, projecao e ranking puro.
- `src/application/initiative-service.mjs`: cadastro, patch, listagem, ranking, unicidade e fronteira unica de gravacao.
- `tests/domain/initiative-domain.test.mjs` e `tests/application/initiative-service.test.mjs`: cobertura unitaria planejada.

## Contratos implementados

O cadastro exige os cinco campos, normaliza `name`, atribui `id` e `createdAt` por colaboradores injetados e persiste uma vez. O patch e validado antes do lookup, preserva identidade, valida o estado final e persiste integralmente. Listagem preserva a ordem persistida; ranking usa score completo, `createdAt` e `id`, projetando score numerico com ate duas casas.

## Rastreabilidade

- Historias: US-02 a US-08.
- Requisitos: RF-02 a RF-07 e RF-09.
- Regras: RN-01 a RN-25.

## Conformidade das extensoes

- Resiliency Baseline: N/A; desabilitada.
- Security Baseline: N/A; desabilitada.
- Property-Based Testing: N/A; desabilitada.
