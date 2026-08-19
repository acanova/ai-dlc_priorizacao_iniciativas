# Decisoes de Stack Tecnologica — Initiative Prioritization

## Resumo

A stack permanece deliberadamente pequena: Node.js 22 ou superior, JavaScript ESM e somente APIs nativas. As respostas do plano nao introduzem dependencias externas nem alteram o ambiente tecnico aprovado.

## DT-01 — Runtime

| Item | Decisao |
|---|---|
| Plataforma | Node.js 22 ou superior |
| Linguagem | JavaScript moderno |
| Modulos | ECMAScript Modules em arquivos `.mjs` |
| Compilacao | Nenhuma |

**Racional**: o runtime aprovado oferece suporte nativo ao servidor HTTP, sistema de arquivos, testes, identificadores, variaveis de ambiente e encerramento do processo exigidos pelo MVP.

## DT-02 — Dependencias

- Nenhuma dependencia externa de execucao.
- Nenhuma dependencia externa de desenvolvimento.
- Qualquer adicao futura exige aprovacao explicita em um gate do AI-DLC.

**Racional**: reduzir preparacao do workshop, risco de instalacao e superficie de manutencao. Esta restricao tambem impede a escolha implicita de framework web, biblioteca de validacao ou runner de testes externo.

## DT-03 — Protocolo e serializacao

| Item | Decisao |
|---|---|
| Transporte | HTTP local |
| Formato publico | JSON |
| Interface | API sem GUI |
| Limite de corpo | 64 KiB |
| Vinculo padrao | `127.0.0.1:3000` |

**Racional**: corresponde ao contrato aprovado e mantem a demonstracao acessivel por ferramentas HTTP comuns, sem infraestrutura adicional.

## DT-04 — Persistencia

| Item | Decisao |
|---|---|
| Meio | Um arquivo JSON local |
| Versao | `schemaVersion` igual a `1` |
| Capacidade verificavel | Ate 1.000 iniciativas |
| Unidade de gravacao | Documento completo |
| Integridade exigida | Documento anterior ou novo completo no caminho configurado |

**Racional**: o volume e o uso local nao justificam banco de dados. A exigencia de substituicao integral protege o arquivo contra conteudo parcial sem ampliar a arquitetura para transacoes distribuidas.

O mecanismo exato de substituicao segura pertence ao NFR Design. A implementacao deve usar somente capacidades nativas do sistema de arquivos do Node.js.

## DT-05 — Modelo de execucao e concorrencia

- Um unico processo Node.js.
- Sem workers, cluster, filas externas ou escalabilidade horizontal.
- O demonstrador envia uma requisicao de escrita por vez.
- Nao ha garantia de serializacao ou resolucao de conflito para escritas sobrepostas.

**Racional**: a concorrencia de escrita foi explicitamente excluida para manter o escopo proporcional ao MVP. Essa decisao deve aparecer nas instrucoes de uso e nos limites conhecidos.

## DT-06 — Inicializacao e recuperacao

- O servidor HTTP somente fica disponivel depois que o documento persistido foi lido e validado.
- JSON corrompido, estrutura invalida ou `schemaVersion` incompativel impede a inicializacao.
- O arquivo existente e preservado; nao ha migracao, renomeacao ou recuperacao automatica para estado vazio.

**Racional**: falhar de forma explicita evita perda silenciosa de dados e torna a recuperacao manual previsivel durante o workshop.

## DT-07 — Testes

| Item | Decisao |
|---|---|
| Runner | `node:test` |
| Assercoes | `node:assert/strict` |
| Comando | `npm test` |
| Inicio da aplicacao | `npm start` |
| Dependencias de teste | Nenhuma externa |

**Racional**: a stack nativa atende testes unitarios e de integracao sem instalacao adicional. Medicoes temporais nao fazem parte dos criterios de aceite; os testes devem privilegiar resultados deterministas e controle explicito de arquivos temporarios, relogio e identificadores.

## DT-08 — Observabilidade

- Destino: console do processo.
- Eventos minimos: inicializacao concluida, encerramento e falhas inesperadas.
- Conteudo proibido: corpos de requisicao, conteudo integral de iniciativas e caminhos locais.
- Fora do escopo: framework de log, metricas, tracing, dashboards e alertas.

**Racional**: logs nativos e concisos tornam a demonstracao diagnosticavel sem incluir uma plataforma operacional ou expor dados e detalhes da maquina.

## DT-09 — Configuracao

| Variavel | Finalidade | Padrao |
|---|---|---|
| `HOST` | Endereco de escuta | `127.0.0.1` |
| `PORT` | Porta HTTP | `3000` |
| `DATA_FILE` | Arquivo persistido | Definido na composicao da aplicacao |

Valores invalidos devem impedir a inicializacao com erro operacional seguro. O valor efetivo de `DATA_FILE` nao deve aparecer em respostas HTTP nem logs.

## Alternativas nao selecionadas

| Alternativa | Motivo da exclusao |
|---|---|
| Express ou outro framework HTTP | Dependencia externa desnecessaria para cinco endpoints locais |
| Banco de dados embarcado ou remoto | O arquivo JSON atende ao volume aprovado e ao objetivo do workshop |
| TypeScript e transpilacao | Introduz etapa de compilacao fora das restricoes aprovadas |
| Runner ou biblioteca de assercao externa | `node:test` e `node:assert/strict` atendem ao escopo |
| Biblioteca de logs | Console conciso atende ao requisito local |
| Cluster, workers ou fila de escrita | Escritas concorrentes e escalabilidade horizontal estao fora do escopo |
| Recuperacao automatica do arquivo | Contraria a decisao de falhar e preservar o estado existente |

## Impactos para o NFR Design

O proximo estagio deve detalhar, sem mudar estas decisoes:

- a fronteira de inicializacao que valida o documento antes de aceitar requisicoes;
- o padrao logico de substituicao atomica do arquivo e limpeza segura de recursos intermediarios;
- a traducao de falhas de persistencia em erros HTTP seguros;
- os eventos e campos permitidos nos logs;
- a estrategia de testes para capacidade, falha de substituicao e estado invalido.

O NFR Design nao deve introduzir serializacao de escritas como requisito, dependencia externa ou recuperacao automatica do arquivo.

## Rastreabilidade

| Decisao | Requisitos relacionados |
|---|---|
| DT-01, DT-02 | RNF-01, RNF-11, RNF-13 |
| DT-03 | RNF-02, RNF-09 |
| DT-04 | RNF-03, RNF-07 |
| DT-05 | RNF-05, RNF-06 |
| DT-06 | RNF-08 |
| DT-07 | RNF-04, RNF-11, RNF-12 |
| DT-08 | RNF-10 |
| DT-09 | RNF-02, RNF-08, RNF-10 |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
