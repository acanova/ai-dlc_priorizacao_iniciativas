# Ambiente Técnico — API de Priorização de Iniciativas

## 1. Resumo

A aplicação será uma API local desenvolvida em Node.js puro.

Ela utilizará somente recursos nativos do Node.js, sem frameworks, banco de dados, contêineres ou serviços externos. A solução deverá ser pequena, fácil de executar e simples de testar durante o workshop.

## 2. Tecnologias

| Item | Decisão |
|---|---|
| Linguagem | JavaScript moderno |
| Runtime | Node.js 22 ou superior |
| Gerenciador de pacotes | npm |
| Módulos | ECMAScript Modules (`.mjs`) |
| Servidor HTTP | `node:http` |
| Persistência | Arquivo JSON local |
| Testes | `node:test` e `node:assert/strict` |
| Execução | Processo local em `127.0.0.1` |
| Cloud | Não utilizada |

Não haverá etapa de compilação.

## 3. Dependências

O projeto não deverá possuir dependências externas de execução ou desenvolvimento.

| Não utilizar | Motivo | Utilizar no lugar |
|---|---|---|
| Express, Fastify ou Koa | São desnecessários para cinco endpoints | `node:http` |
| Axios ou node-fetch | O Node.js já possui `fetch()` | `fetch()` nativo |
| Jest, Vitest ou Mocha | O Node.js já possui test runner | `node:test` |
| Banco de dados ou ORM | Os dados do workshop são pequenos | Arquivo JSON |
| dotenv | Não é necessário carregar arquivo `.env` | `process.env` |
| Docker | A aplicação será executada diretamente | Processo Node.js local |
| AWS SDK ou serviços AWS | O workshop será totalmente local | Recursos nativos do Node.js |

Uma nova dependência somente poderá ser adicionada após aprovação explícita em um gate do AI-DLC.

## 4. Estrutura sugerida

```text
src/
  server.mjs
  rice.mjs
  repository.mjs
tests/
  rice.test.mjs
  api.test.mjs
data/
  initiatives.json
package.json
README.md
```

Responsabilidades:

- `server.mjs`: servidor, rotas e respostas HTTP;
- `rice.mjs`: validação, cálculo RICE e ordenação;
- `repository.mjs`: leitura e gravação do arquivo JSON;
- `tests/`: testes automatizados.

O AI-DLC poderá separar esses arquivos em módulos menores se isso melhorar a clareza, sem alterar a simplicidade da solução.

## 5. Configuração local

| Variável | Valor padrão | Finalidade |
|---|---|---|
| `HOST` | `127.0.0.1` | Endereço local do servidor |
| `PORT` | `3000` | Porta da API |
| `DATA_FILE` | `./data/initiatives.json` | Arquivo de persistência |

Exemplo de endereço:

```text
http://127.0.0.1:3000
```

A aplicação não utilizará credenciais ou segredos.

## 6. Convenções da API

- Requisições e respostas utilizarão JSON.
- Os endpoints de negócio utilizarão o prefixo `/api/v1`.
- Os campos JSON utilizarão `camelCase`.
- Erros deverão possuir código e mensagem compreensíveis.
- Dados inválidos não poderão ser armazenados.
- O servidor não deverá retornar stack traces ou caminhos locais.

Endpoints esperados:

| Método | Caminho |
|---|---|
| `GET` | `/health` |
| `POST` | `/api/v1/initiatives` |
| `PATCH` | `/api/v1/initiatives/{id}` |
| `GET` | `/api/v1/initiatives` |
| `GET` | `/api/v1/ranking` |

## 7. Persistência

Os dados serão armazenados em um único arquivo JSON:

```json
{
  "schemaVersion": 1,
  "initiatives": []
}
```

O arquivo armazenará os valores informados pelo usuário. A pontuação RICE será recalculada pela aplicação e não deverá ser aceita diretamente do cliente.

## 8. Segurança proporcional ao workshop

- O servidor deverá escutar em `127.0.0.1` por padrão.
- Não haverá autenticação porque a aplicação será local e utilizará dados fictícios.
- O corpo das requisições deverá ter limite de 64 KiB.
- A aplicação não realizará chamadas para serviços externos.
- Não utilizar `eval()` ou execução dinâmica de código.
- Erros internos não deverão expor detalhes da máquina.

Essas decisões são adequadas ao protótipo local e não representam uma arquitetura de produção.

## 9. Estratégia de testes

| Tipo | Ferramenta | Objetivo |
|---|---|---|
| Unitário | `node:test` | Validar fórmula, entradas e ordenação |
| Integração | `node:test` e `fetch()` | Exercitar os cinco endpoints |

Casos mínimos:

- calcular corretamente `(1000 × 2 × 0,80) ÷ 10 = 160`;
- rejeitar esforço igual a zero;
- cadastrar e atualizar uma iniciativa;
- retornar o ranking em ordem decrescente;
- manter uma ordenação previsível em caso de empate;
- retornar erro claro para uma entrada inválida;
- preservar os dados no arquivo JSON.

Comandos esperados:

```bash
npm test
npm start
```

## 10. Padrões de código

### Função de domínio

```js
export function calculateRiceScore({ reach, impact, confidence, effort }) {
  return (reach * impact * (confidence / 100)) / effort;
}
```

A validação deverá acontecer antes do cálculo. A função não deverá acessar arquivos ou objetos HTTP.

### Endpoint simples

```js
if (request.method === "GET" && request.url === "/health") {
  response.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify({ status: "ok" }));
}
```

### Teste unitário

```js
import test from "node:test";
import assert from "node:assert/strict";
import { calculateRiceScore } from "../src/rice.mjs";

test("calcula uma pontuação RICE conhecida", () => {
  const score = calculateRiceScore({
    reach: 1000,
    impact: 2,
    confidence: 80,
    effort: 10,
  });

  assert.equal(score, 160);
});
```

## 11. Critério técnico de conclusão

O ambiente estará atendido quando:

- a aplicação iniciar com `npm start`;
- todos os testes passarem com `npm test`;
- nenhuma dependência externa for necessária;
- os cinco endpoints funcionarem localmente;
- a implementação respeitar as decisões aprovadas nos artefatos do AI-DLC.
