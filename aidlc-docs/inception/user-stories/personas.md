# Personas — API de Priorização de Iniciativas

## Contexto

As personas representam as duas perspectivas escolhidas no plano aprovado: a pessoa responsável pela priorização de negócio e a pessoa consumidora técnica da API. Elas são arquétipos para orientar histórias e critérios de aceite, não usuários autenticados do MVP.

## P-01 — Marina, responsável pela priorização de negócio

### Perfil

Marina coordena a avaliação de iniciativas de produto e precisa comparar propostas usando critérios uniformes. Ela toma decisões com outras partes interessadas e precisa explicar por que uma iniciativa aparece antes de outra.

### Objetivos

- Cadastrar iniciativas com estimativas de alcance, impacto, confiança e esforço.
- Consultar um ranking reproduzível baseado na pontuação RICE.
- Entender os valores usados no cálculo de cada posição.
- Atualizar uma estimativa e observar o efeito no ranking.
- Confiar que entradas inválidas não alteram os dados existentes.

### Necessidades

- Regras de entrada claras e aplicadas de forma consistente.
- Cálculo RICE correto, determinístico e explicável.
- Desempate previsível entre iniciativas com a mesma pontuação.
- Persistência dos dados entre reinícios da aplicação.
- Mensagens de erro compreensíveis para corrigir entradas.

### Limites relevantes

- Não utiliza uma interface gráfica neste MVP.
- Depende de um consumidor técnico para operar a API diretamente.
- Não necessita de autenticação, exclusão, colaboração ou histórico de decisões.
- Trabalha somente com dados fictícios em uma aplicação local de workshop.

## P-02 — Rafael, consumidor técnico da API

### Perfil

Rafael integra e demonstra a API para Marina e para participantes do workshop. Ele envia requisições HTTP, interpreta respostas JSON e verifica se o comportamento permanece previsível durante a jornada demonstrada.

### Objetivos

- Verificar rapidamente se o processo local está disponível.
- Cadastrar, listar e atualizar iniciativas pelo contrato HTTP aprovado.
- Obter pontuações e ranking em um formato estável para consumo.
- Diagnosticar requisições inválidas por códigos e mensagens de erro claros.
- Reiniciar a aplicação sem perder dados válidos já persistidos.

### Necessidades

- Cinco endpoints locais com métodos e caminhos estáveis.
- Respostas JSON consistentes, sem stack traces nem caminhos da máquina.
- Validação de corpos, campos e limites antes da persistência.
- Configuração local por `HOST`, `PORT` e `DATA_FILE`.
- Execução e testes reproduzíveis com comandos npm.

### Limites relevantes

- Usa somente recursos nativos do Node.js 22 ou superior.
- Não pode depender de frameworks, banco de dados, contêineres, nuvem ou serviços externos.
- Não administra credenciais porque o MVP local não possui autenticação.
- Precisa manter a solução pequena o suficiente para uma demonstração de workshop.

## Relação entre as personas

Marina define e interpreta a priorização; Rafael opera o contrato técnico que materializa essa jornada. O MVP atende às duas perspectivas sem criar papéis, permissões ou fluxos de autenticação no produto.

## Mapeamento para histórias

| Persona | Histórias relevantes | Relação com a jornada |
|---|---|---|
| P-01 — Marina | US-02, US-03, US-04, US-05, US-06, US-07, US-08 | Define os dados, confia na integridade, interpreta pontuações e ranking e observa os efeitos das atualizações persistidas |
| P-02 — Rafael | US-01, US-02, US-03, US-04, US-05, US-06, US-07, US-08, US-09 | Opera e demonstra todos os endpoints, valida o contrato HTTP e diagnostica erros da integração local |

## Conformidade das extensões

- **Resiliency Baseline**: N/A; extensão desabilitada na Análise de Requisitos.
- **Security Baseline**: N/A; extensão desabilitada na Análise de Requisitos.
- **Property-Based Testing**: N/A; extensão desabilitada na Análise de Requisitos.
