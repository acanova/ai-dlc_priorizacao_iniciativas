# Documento de Visão — API de Priorização de Iniciativas

## 1. Resumo

Queremos criar uma API local e simples para ajudar equipes de produto a priorizar iniciativas.

A aplicação receberá algumas informações sobre cada iniciativa, calculará uma pontuação pelo método RICE e apresentará uma lista ordenada. O resultado deverá ser fácil de entender, reproduzir e testar.

O projeto será usado em um workshop para demonstrar o fluxo completo do AI-DLC, desde a Inception até a geração e validação do código.

## 2. Problema

Equipes frequentemente priorizam iniciativas usando planilhas ou discussões informais. Isso pode gerar:

- cálculos inconsistentes;
- critérios diferentes entre pessoas;
- dificuldade para explicar a ordem final;
- retrabalho quando uma estimativa muda.

Precisamos de uma forma pequena e objetiva de aplicar sempre o mesmo cálculo.

## 3. Público-alvo

- Gerentes de produto que cadastram e atualizam iniciativas.
- Responsáveis por portfólio que consultam a ordem de prioridade.
- Pessoas interessadas que desejam entender o motivo da classificação.
- Participantes do workshop que acompanharão os gates e artefatos do AI-DLC.

## 4. Objetivo do MVP

O MVP deverá permitir:

1. cadastrar uma iniciativa;
2. atualizar uma iniciativa;
3. listar as iniciativas cadastradas;
4. calcular a pontuação RICE;
5. apresentar um ranking ordenado;
6. rejeitar dados inválidos com uma mensagem clara;
7. verificar se a aplicação está funcionando.

## 5. Como a priorização funciona

Cada iniciativa terá quatro valores:

- **Alcance (`reach`)**: quantas pessoas ou eventos serão afetados.
- **Impacto (`impact`)**: o tamanho esperado do impacto.
- **Confiança (`confidence`)**: o grau de confiança nas estimativas, em porcentagem.
- **Esforço (`effort`)**: o trabalho necessário para realizar a iniciativa.

A pontuação será calculada assim:

```text
RICE = (alcance × impacto × confiança decimal) ÷ esforço
```

Exemplo:

```text
alcance = 1.000
impacto = 2
confiança = 80% (0,80)
esforço = 10

RICE = (1.000 × 2 × 0,80) ÷ 10 = 160
```

Quanto maior a pontuação, maior será a prioridade.

## 6. Capacidades da API

| Método | Caminho | Finalidade |
|---|---|---|
| `GET` | `/health` | Verificar se a aplicação está disponível |
| `POST` | `/api/v1/initiatives` | Cadastrar uma iniciativa |
| `PATCH` | `/api/v1/initiatives/{id}` | Atualizar uma iniciativa |
| `GET` | `/api/v1/initiatives` | Listar as iniciativas |
| `GET` | `/api/v1/ranking` | Consultar o ranking |

## 7. Jornada principal

1. O usuário cadastra três iniciativas.
2. A API valida os dados e calcula as pontuações.
3. O usuário consulta o ranking.
4. A API retorna as iniciativas da maior para a menor pontuação.
5. O usuário altera o esforço de uma iniciativa.
6. O usuário consulta novamente e observa a mudança no ranking.
7. O usuário envia um valor inválido e recebe um erro claro.

## 8. Fora do escopo do MVP

O MVP não terá:

- interface gráfica;
- login ou controle de usuários;
- banco de dados;
- implantação em nuvem;
- integrações com sistemas externos;
- colaboração, comentários ou aprovações;
- outros métodos de priorização;
- exclusão de iniciativas.

## 9. Restrições conhecidas

- A aplicação funcionará apenas localmente.
- Não dependerá de serviços externos.
- Os dados serão pequenos e poderão ser armazenados em um arquivo JSON local.
- O projeto deverá ser simples o suficiente para demonstrar e testar durante um workshop de até duas horas.
- As decisões detalhadas de tecnologia serão definidas no documento de ambiente técnico.

## 10. Critérios de sucesso

Consideraremos o MVP pronto quando:

- os cinco endpoints funcionarem conforme os requisitos aprovados;
- os cálculos RICE conhecidos produzirem o resultado esperado;
- o ranking for previsível para os mesmos dados;
- cada item do ranking mostrar os valores usados no cálculo;
- entradas inválidas não forem armazenadas;
- os testes automatizados passarem com um único comando;
- um script local conseguir demonstrar a jornada principal.

## 11. Visão futura

No futuro, a solução poderá incluir uma interface web, autenticação, histórico de decisões, integração com ferramentas de gestão e outros métodos de priorização.

Essas possibilidades não fazem parte do MVP e não devem influenciar sua implementação agora.

## 12. Perguntas em aberto para a Inception

Estas perguntas são intencionais e deverão ser resolvidas durante a análise de requisitos:

1. Qual escala de impacto será aceita: `{0.25, 0.5, 1, 2, 3}` ou `{1, 2, 3, 4, 5}`?
2. Como ordenar duas iniciativas com a mesma pontuação RICE?
3. Nomes de iniciativas deverão ser únicos, ignorando maiúsculas e minúsculas?

