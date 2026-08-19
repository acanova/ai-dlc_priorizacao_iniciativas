# API de Priorizacao de Iniciativas

API local e sem dependencias externas para cadastrar iniciativas, calcular RICE e consultar um ranking deterministico.

## Requisitos

- Node.js 22 ou superior.
- npm, fornecido com o Node.js.

## Comandos

```bash
npm start
npm test
```

Inicie a API em um terminal e exercite os endpoints em outro. O processo escuta em `http://127.0.0.1:3000` por padrao.

## Configuracao

| Variavel | Padrao | Uso |
|---|---|---|
| `HOST` | `127.0.0.1` | Endereco de escuta |
| `PORT` | `3000` | Porta HTTP |
| `DATA_FILE` | `./data/initiatives.json` | Arquivo JSON persistido |

Exemplo:

```bash
PORT=3100 DATA_FILE=./data/local.json npm start
```

## Endpoints

| Metodo | Caminho | Finalidade |
|---|---|---|
| `GET` | `/health` | Verificar o processo |
| `POST` | `/api/v1/initiatives` | Cadastrar iniciativa |
| `PATCH` | `/api/v1/initiatives/{id}` | Atualizar campos editaveis |
| `GET` | `/api/v1/initiatives` | Listar na ordem persistida |
| `GET` | `/api/v1/ranking` | Listar por prioridade |

Cadastro:

```bash
curl -sS http://127.0.0.1:3000/api/v1/initiatives \
  -H 'content-type: application/json' \
  -d '{"name":"Nova API","reach":1000,"impact":2,"confidence":80,"effort":10}'
```

O corpo aceita `name`, `reach`, `impact`, `confidence` e `effort`. Impacto deve ser `0.25`, `0.5`, `1`, `2` ou `3`; confianca fica entre `0` e `100`; alcance nao pode ser negativo; esforco deve ser positivo. Nomes sao unicos depois de `trim()` e conversao para minusculas.

Resposta de erro:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": []
    }
  }
}
```

## Persistencia

O arquivo usa o formato:

```json
{
  "schemaVersion": 1,
  "initiatives": []
}
```

Cada iniciativa armazena `id`, `createdAt` e os cinco valores de entrada. `score` e recalculado e nunca persistido. Gravacoes substituem o documento por rename de um temporario no mesmo diretorio. Estado existente malformado, invalido ou com outra versao impede a inicializacao e e preservado.

## Limites conhecidos

- Ate 1.000 iniciativas.
- Corpos HTTP de ate 64 KiB.
- Uma escrita por vez no demonstrador; nao ha lock ou controle de conflito.
- Sem autenticacao, banco, frontend, nuvem, container, retry, cache ou recuperacao automatica.
- Sem `fsync`; a substituicao evita JSON parcial durante a operacao, mas nao promete durabilidade contra falha abrupta de energia.
