# Requisitos Nao Funcionais — Initiative Prioritization

## Escopo

Este documento consolida os requisitos nao funcionais verificaveis da unica unidade de trabalho da API de Priorizacao de Iniciativas. O produto e um MVP local para workshop, executado por um unico processo e sem compromisso de producao, alta disponibilidade ou escalabilidade horizontal.

## RNF-01 — Plataforma e portabilidade

- A aplicacao deve executar em Node.js 22 ou superior.
- O codigo deve usar JavaScript com ECMAScript Modules em arquivos `.mjs`.
- A aplicacao e os testes devem usar somente modulos nativos do Node.js.
- Nao deve existir etapa de compilacao.
- Dependencias externas de execucao ou desenvolvimento somente podem ser adicionadas mediante aprovacao explicita em um gate do AI-DLC.

## RNF-02 — Configuracao e isolamento local

- A aplicacao deve escutar em `127.0.0.1` e na porta `3000` por padrao.
- `HOST`, `PORT` e `DATA_FILE` devem poder ser configurados por variaveis de ambiente.
- A aplicacao nao deve exigir conteineres, banco de dados, recursos em nuvem ou servicos externos.
- A inicializacao e os testes devem ser reproduziveis em uma maquina de desenvolvimento compativel.

## RNF-03 — Capacidade

- O MVP deve suportar de forma verificavel ate 1.000 iniciativas em um unico arquivo JSON.
- Cadastro, atualizacao, listagem, ranking, persistencia e reinicializacao devem permanecer funcionalmente corretos nesse limite.
- Nao ha requisito de crescimento alem desse volume, particionamento ou escalabilidade horizontal.

## RNF-04 — Desempenho

- Nao existe meta temporal, percentil de latencia, throughput ou SLA de desempenho para o MVP.
- Os testes devem exigir conclusao correta e reproduzivel das operacoes, sem usar limites de tempo de maquina como criterio funcional de aceite.
- Inicializacao, listagem e ranking com ate 1.000 iniciativas nao devem depender de servicos externos.

## RNF-05 — Disponibilidade e continuidade

- A aplicacao opera em um unico processo local, sem alta disponibilidade, failover, replicacao, RTO ou RPO formais.
- Reiniciar o processo com o mesmo `DATA_FILE` deve preservar e recarregar os dados validos confirmados.
- Indisponibilidade durante encerramento, reinicio ou correcao manual do arquivo e aceitavel para o workshop.

## RNF-06 — Concorrencia de escrita

- Escritas concorrentes estao fora do escopo deste MVP.
- O demonstrador e os testes de aceite devem enviar no maximo uma requisicao de escrita por vez.
- A aplicacao nao precisa garantir serializacao, deteccao de conflito ou prevencao de atualizacao perdida entre escritas sobrepostas.
- Leituras e escritas simultaneas nao possuem garantia adicional alem da consistencia fornecida pela substituicao atomica definida em RNF-07.

## RNF-07 — Integridade da persistencia

- Uma escrita confirmada deve substituir o documento persistido como uma unidade.
- Se a substituicao falhar, o caminho configurado deve conter o documento completo anterior ou o novo documento completo, nunca JSON parcial produzido pela tentativa.
- O documento persistido deve manter `schemaVersion` igual a `1` e satisfazer as invariantes funcionais aprovadas.
- Arquivos temporarios ou outros recursos intermediarios nao podem ser tratados como escrita confirmada.
- Falhas de persistencia devem ser propagadas como falhas seguras, sem retornar sucesso ao cliente.

## RNF-08 — Estado corrompido ou incompativel

- Na inicializacao, JSON malformado, estrutura invalida ou `schemaVersion` diferente de `1` deve impedir o inicio do servidor HTTP.
- A falha deve ser explicita no canal operacional e usar mensagem segura e compreensivel.
- O arquivo existente deve ser preservado sem sobrescrita, renomeacao ou inicializacao automatica com estado vazio.
- A recuperacao requer correcao manual do arquivo ou selecao explicita de outro `DATA_FILE` valido.

## RNF-09 — Seguranca proporcional ao prototipo

- Cada corpo de requisicao deve ser limitado a 64 KiB.
- A aplicacao nao deve usar `eval()` nem outro mecanismo de execucao dinamica de codigo.
- Respostas HTTP nao podem conter stack traces, caminhos locais ou detalhes internos da maquina.
- O MVP usa dados ficticios, escuta localmente por padrao e nao implementa autenticacao ou autorizacao.

## RNF-10 — Observabilidade local

- A aplicacao deve emitir logs concisos no console para inicializacao concluida, encerramento e falhas inesperadas.
- Logs nao podem registrar corpos de requisicao, conteudo integral das iniciativas nem caminhos locais.
- Falhas de inicializacao devem indicar a categoria do problema sem expor o valor de `DATA_FILE`.
- Nao sao exigidos metricas, tracing distribuido, armazenamento de logs, dashboards ou alertas.

## RNF-11 — Manutenibilidade e testabilidade

- HTTP, servico de aplicacao, dominio e repositorio devem permanecer separados conforme o Application Design aprovado.
- Validacao, calculo RICE e ordenacao devem ser exercitaveis sem iniciar o servidor HTTP.
- Dependencias como repositorio, relogio e gerador de identificadores devem ser fornecidas explicitamente para permitir testes deterministas.
- Os testes devem usar `node:test` e `node:assert/strict` e executar por `npm test`.
- A API deve iniciar por `npm start` sem instalacao de dependencias externas.

## RNF-12 — Cobertura verificavel

Os testes automatizados devem cobrir, no minimo:

- calculo conhecido, precisao completa e arredondamento de apresentacao;
- limites e agregacao deterministica de validacao;
- cadastro, atualizacao parcial, listagem e ranking;
- unicidade de nome e desempate por `createdAt` seguido de `id`;
- corpos malformados ou acima de 64 KiB e respostas sem detalhes internos;
- persistencia e recarga de um documento valido;
- capacidade funcional com 1.000 iniciativas;
- falha de substituicao sem JSON parcial no caminho configurado;
- recusa de inicializacao diante de JSON corrompido, estrutura invalida ou versao incompativel;
- logs obrigatorios sem corpos de requisicao nem caminhos locais.

Nao e exigido teste de escritas concorrentes, pois esse comportamento foi explicitamente excluido do escopo.

## RNF-13 — Adequacao ao workshop

- O codigo, os testes e as instrucoes devem ser compreensiveis em revisao orientada a apresentacao.
- A jornada principal deve poder ser demonstrada localmente dentro de um workshop de ate duas horas.
- A solucao deve privilegiar comportamento deterministico e configuracao minima.

## Matriz de qualidade e verificacao

| Atributo | Decisao | Evidencia esperada |
|---|---|---|
| Capacidade | Ate 1.000 iniciativas em um arquivo | Teste automatizado da jornada funcional no limite |
| Desempenho | Sem objetivo temporal ou SLA | Testes verificam correcao, nao tempo de maquina |
| Disponibilidade | Processo unico, sem HA, RTO ou RPO | Documentacao de execucao local e teste de reinicio |
| Concorrencia | Uma escrita por vez no demonstrador | Restricao documentada; teste concorrente N/A |
| Integridade | Documento anterior ou novo completo | Teste de falha durante substituicao |
| Recuperacao | Falhar e preservar arquivo invalido | Testes de corrupcao e versao incompativel |
| Seguranca | Limite de corpo e erros seguros | Testes HTTP de limite e ausencia de vazamentos |
| Observabilidade | Logs concisos e sem dados sensiveis | Captura e verificacao dos eventos obrigatorios |
| Manutenibilidade | Camadas separadas e dependencias injetadas | Testes unitarios sem servidor ou arquivo real quando aplicavel |

## Rastreabilidade

| Requisito NFR | Fontes aprovadas |
|---|---|
| RNF-01, RNF-02 | Requisitos RNF-01 e RNF-02; Execution Plan |
| RNF-03, RNF-04 | Respostas 1 e 2 do plano de NFR Requirements |
| RNF-05, RNF-06 | Requisitos RNF-05; resposta 3 do plano |
| RNF-07, RNF-08 | RF-09, CA-05, US-08; respostas 4 e 5 do plano |
| RNF-09 | Requisitos RNF-03; US-09 e CA-06 |
| RNF-10 | Resposta 6 do plano |
| RNF-11, RNF-12 | Requisitos RNF-04; Application Design e Functional Design |
| RNF-13 | Requisito RNF-05 |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
