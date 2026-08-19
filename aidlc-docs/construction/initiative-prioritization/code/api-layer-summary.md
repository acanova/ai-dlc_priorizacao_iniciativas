# Resumo da Camada de API

## Rotas

| Metodo | Caminho | Sucesso |
|---|---|---:|
| `GET` | `/health` | `200` |
| `POST` | `/api/v1/initiatives` | `201` |
| `PATCH` | `/api/v1/initiatives/{id}` | `200` |
| `GET` | `/api/v1/initiatives` | `200` |
| `GET` | `/api/v1/ranking` | `200` |

Erros usam `{ "error": { "code": "...", "message": "...", "details": {} } }`. Os codigos publicos cobrem JSON malformado, validacao, recurso ausente, metodo nao permitido, nome duplicado, corpo acima de 64 KiB e falha interna protegida.

## Ciclo de vida e logs

O repositorio e inicializado e validado antes da escuta. `start()` aceita porta efemera para testes, e `stop()` encerra o servidor de forma idempotente. O logger aceita somente eventos e campos escalares previstos; corpos, registros, caminhos e objetos de erro nao sao serializados.

## Cobertura planejada

Testes da fronteira HTTP cobrem leitura de corpo, roteamento, status, envelopes e falhas inesperadas. Testes integrados exercitam os cinco endpoints, cadastro, patch, ranking, persistencia, reinicio, estados invalidos e 1.000 iniciativas.

## Itens N/A

- Frontend: N/A; o produto aprovado e somente API.
- Atributos de automacao de UI: N/A; nao existem elementos de interface.
- Extensoes Resiliency, Security e Property-Based Testing: N/A; desabilitadas.
