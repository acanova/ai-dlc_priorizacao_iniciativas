# Padroes de NFR Design — Initiative Prioritization

## Escopo

Este documento incorpora os requisitos nao funcionais aprovados na unica unidade do MVP local. Os padroes preservam Node.js 22+, JavaScript ESM, somente modulos nativos, um processo, um arquivo JSON e uma escrita por vez no demonstrador.

## Decisoes aprovadas

| Tema | Padrao selecionado |
|---|---|
| Durabilidade | Arquivo temporario no mesmo diretorio, fechamento e renomeacao sobre o destino, sem sincronizacao explicita em disco |
| Capacidade | Documento completo carregado e validado em memoria para ate 1.000 iniciativas |
| Dados derivados | Pontuacao e ranking recalculados sob demanda, sem cache |
| Erros e logs | Fronteira centralizada com codigos HTTP estaveis e campos de log permitidos |
| Persistencia | Leitura, validacao e substituicao atomica encapsuladas em `JsonInitiativeRepository` |

## PD-01 — Inicializacao com validacao antes da escuta

1. A composicao resolve e valida `HOST`, `PORT` e `DATA_FILE` sem registrar o caminho efetivo.
2. `JsonInitiativeRepository.initialize()` cria um documento vazio somente quando o destino nao existe.
3. Quando o destino existe, o repositorio le, interpreta e valida o documento completo, incluindo `schemaVersion` igual a `1`, colecao de iniciativas e invariantes persistidas.
4. JSON malformado, documento estruturalmente invalido ou versao incompativel interrompe a inicializacao sem alterar, renomear ou substituir o arquivo existente.
5. O servidor HTTP passa a aceitar requisicoes somente depois da inicializacao bem-sucedida.

Esse padrao implementa falha fechada no startup e torna observavel a diferenca entre ausencia inicial de estado e estado existente invalido.

## PD-02 — Substituicao atomica do documento

Para cada `replaceAll(initiatives)`:

1. Validar em memoria o documento final completo antes de qualquer escrita.
2. Serializar um objeto com `schemaVersion` igual a `1` e a colecao final.
3. Criar um arquivo temporario exclusivo no mesmo diretorio do destino.
4. Gravar todo o conteudo, fechar o descritor e somente entao renomear o temporario sobre o destino.
5. Considerar a operacao confirmada apenas depois da renomeacao bem-sucedida.
6. Em qualquer falha anterior a confirmacao, tentar remover apenas o temporario criado pela operacao e propagar uma falha de persistencia segura.

O desenho nao exige `fsync` do arquivo nem do diretorio. Portanto, protege contra JSON parcial produzido pela tentativa, mas nao promete sobrevivencia a falha abrupta de energia depois de uma confirmacao aparente. A implementacao e os testes devem verificar que o caminho configurado contem o documento anterior ou o novo documento completo quando a substituicao falha.

## PD-03 — Agregado integral em memoria

- Cada operacao le e valida o documento completo.
- Operacoes de escrita produzem uma nova colecao completa e pedem uma unica substituicao ao repositorio.
- O repositorio devolve copias que nao permitem mutacao acidental de seu estado carregado.
- O limite de 1.000 iniciativas e verificado funcionalmente, sem streaming, indices auxiliares ou particionamento.
- Nao existe promessa de escalabilidade horizontal nem de crescimento alem do limite aprovado.

## PD-04 — Calculo derivado sem cache

- Pontuacoes RICE nao sao persistidas nem mantidas em cache.
- Listagem e ranking recalculam valores a partir dos quatro fatores persistidos.
- O ranking usa a precisao completa; arredondamento de ate duas casas ocorre somente na projecao publica.
- Cada chamada de ranking ordena uma copia, preservando a ordem persistida.

O padrao elimina invalidacao de cache e fontes duplicadas de verdade. Como nao existe meta temporal, a verificacao mede correcao com 1.000 iniciativas e nao usa prazo de maquina como criterio de aceite.

## PD-05 — Fronteira centralizada de falhas HTTP

`mapApplicationError(error)` e a captura externa do request handler formam a unica fronteira autorizada a traduzir falhas em respostas:

| Categoria | Tratamento externo |
|---|---|
| Erro esperado de dominio ou aplicacao | Status e codigo HTTP estaveis definidos pela tabela de mapeamento |
| Corpo malformado ou acima de 64 KiB | Erro de cliente estavel sem ecoar o corpo |
| Falha de persistencia | Resposta segura sem caminho, mensagem tecnica ou stack trace |
| Erro inesperado | HTTP `500` com codigo `INTERNAL_ERROR` e mensagem publica generica |

Camadas internas podem preservar a causa para controle de fluxo e teste, mas nao formam respostas independentes nem expõem valores locais.

## PD-06 — Logs por lista permitida

Os logs de console usam eventos estruturados e concisos. Campos permitidos:

- `event`: nome estavel do evento;
- `category`: classificacao operacional segura;
- `code`: codigo conhecido da aplicacao quando existir;
- `host` e `port`: somente no evento de inicializacao concluida.

Eventos minimos: `startup.completed`, `startup.failed`, `shutdown.completed` e `request.unexpected_failure`. Corpos de requisicao, conteudo de iniciativas, stack traces, mensagens tecnicas brutas e caminhos locais nao sao registrados. A fronteira centralizada seleciona explicitamente os campos; nao serializa objetos de erro ou entrada de forma generica.

## PD-07 — Limites explicitos de concorrencia e disponibilidade

- O processo atende uma escrita por vez no demonstrador e nos testes de aceite.
- Nao ha mutex, fila, deteccao de conflito, versao otimista ou garantia contra atualizacao perdida em escritas sobrepostas.
- Leituras simultaneas com uma escrita nao recebem garantia adicional alem da substituicao do documento completo.
- Nao ha retry automatico, circuit breaker, failover, replicacao, RTO, RPO ou recuperacao automatica de arquivo.

Essas ausencias sao limites aprovados, nao capacidades implícitas da implementacao.

## Estrategia de verificacao

| Padrao | Evidencia automatizada esperada |
|---|---|
| Startup validado | Estado valido inicia; JSON malformado, estrutura invalida e versao incompativel impedem a escuta e permanecem inalterados |
| Substituicao atomica | Falhas injetadas antes da renomeacao deixam o documento anterior completo e nao retornam sucesso |
| Capacidade integral | Jornada funcional correta com 1.000 iniciativas |
| Derivacao sem cache | Alteracao de fatores muda imediatamente pontuacao e ranking; valor persistido nao inclui score |
| Erros seguros | Respostas nao contem stack trace, caminho local ou mensagem tecnica bruta |
| Logs permitidos | Eventos obrigatorios aparecem e conteudo proibido permanece ausente |

Testes usam diretorios temporarios isolados, relogio e identificadores controlados. Nao usam limite temporal nem teste de escritas concorrentes como criterio funcional.

## Rastreabilidade

| Padrao | Requisitos e decisoes |
|---|---|
| PD-01 | RNF-02, RNF-08, DT-06, DT-09 |
| PD-02 | RNF-07, DT-04, resposta 1 do plano de NFR Design |
| PD-03 | RNF-03, RNF-06, resposta 2 |
| PD-04 | RNF-04, RNF-11, resposta 3; Functional Design aprovado |
| PD-05 | RNF-09, RNF-11, resposta 4; Application Design aprovado |
| PD-06 | RNF-10, DT-08, resposta 4 |
| PD-07 | RNF-05, RNF-06, DT-05 |

## Conformidade das extensoes

- **Resiliency Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Security Baseline**: N/A; extensao desabilitada na Analise de Requisitos.
- **Property-Based Testing**: N/A; extensao desabilitada na Analise de Requisitos.
