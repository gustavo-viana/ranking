# Contexto do Projeto para IA

Este arquivo foi feito para uma IA ler primeiro e entender rapidamente o projeto antes de alterar qualquer coisa.

## Resumo

Projeto: site estatico de ranking de tenis entre amigos.

Objetivo: exibir atletas, ranking geral, confrontos agendados/finalizados e ranking de desafios da temporada 2026.

Stack: HTML, CSS e JavaScript puro, sem build, sem framework e sem backend.

Entrada de dados: arquivos CSV locais em `dados/` ou CSVs publicados pelo Google Planilhas configurados em `google-sheets-config.js`.

## Como Rodar

Por ser um site estatico, pode ser servido com qualquer servidor local simples. Exemplo:

```bash
python -m http.server 8000
```

Depois abrir:

```text
http://localhost:8000
```

Evite abrir `index.html` direto pelo navegador se precisar testar carregamento dos CSVs, porque `fetch()` pode falhar via `file://`.

## Arquivos Principais

- `index.html`: estrutura da pagina e abas principais.
- `styles.css`: visual principal da aplicacao.
- `integration.css`: estilos extras da integracao, filtros e destaque de vencedor.
- `app.js`: toda a logica de dados, parse de CSV, renderizacao, filtros e fallback.
- `google-sheets-config.js`: URLs publicadas do Google Planilhas.
- `dados/atletas.csv`: ranking base dos atletas.
- `dados/confrontos.csv`: jogos, agenda, status, placares e vencedores.
- `dados/desafios.csv`: pontuacao dos desafios.
- `COMO-ATUALIZAR.md`: guia simples para atualizar CSVs e rodar localmente.
- `CONFIGURAR-GOOGLE-PLANILHAS.md`: guia para publicar abas do Google Planilhas como CSV.
- `AUTOMATIZAR-GOOGLE-PLANILHAS.md`: Apps Script para automatizar a planilha.

## Fluxo de Dados

Ao carregar a pagina, `app.js` primeiro renderiza dados de reserva definidos no proprio arquivo.

Em seguida, `loadData()` tenta carregar:

- `athletesCsvUrl`, se existir em `window.RANKING_CONFIG`; senao `dados/atletas.csv`.
- `matchesCsvUrl`, se existir em `window.RANKING_CONFIG`; senao `dados/confrontos.csv`.
- `challengesCsvUrl`, se existir em `window.RANKING_CONFIG`; senao `dados/desafios.csv`.

As URLs do Google Planilhas ja estao preenchidas em `google-sheets-config.js`. Se as tres URLs estiverem presentes, o site tenta usar Google Planilhas. Se algo falhar, mantem a copia de reserva e marca erro visual no status.

O carregamento adiciona um parametro `atualizacao=Date.now()` nas URLs para evitar cache.

## Estrutura dos CSVs

`dados/atletas.csv`:

```text
ordem,nome,grupo,pontos,jogos,vitorias
```

`dados/confrontos.csv`:

```text
id,mes,rodada,grupo,atleta1,atleta2,data,horario,quadra,status,placar,vencedor,wo
```

`dados/desafios.csv`:

```text
ordem,nome,grupo,rodada,tipo,vitorias,derrotas,games_pro,games_contra,jogos,pontos
```

Importante: nao renomear cabecalhos sem ajustar `app.js`, porque o parser depende desses nomes, embora aceite algumas variacoes com acento.

## Views da Interface

O `index.html` define quatro abas:

- `ranking`: atletas separados por grupo.
- `unified`: tabela geral unificada, aba ativa por padrao.
- `matches`: confrontos, com busca, filtro por rodada e filtro por grupo.
- `challenges`: tabela de desafios.

Os botoes de aba usam `data-view`, e o JS mostra/esconde secoes pelo id no formato `#${view}View`.

## Funcoes Importantes em `app.js`

- `parseCsv(text)`: parser CSV proprio, detecta separador entre virgula, ponto e virgula ou tab.
- `normalizedName(name)`: normaliza texto para comparacoes sem acento e em minusculo.
- `field(row, ...names)`: busca campos normalizados no CSV.
- `parseAthleteRow(r, i)`: converte linha da aba Atletas.
- `parseChallengeRow(r, i)`: converte linha da aba Desafios e calcula pontos se nao vierem informados.
- `renderRanking(query)`: ranking por grupos.
- `challengeTotalsByAthlete()`: soma pontos, jogos e vitorias de desafios por atleta.
- `withoutChallengeStats(a, challengeTotals)`: cria uma copia do atleta descontando os numeros de desafios.
- `renderUnifiedRanking(query)`: ranking geral, sem somar os numeros dos desafios.
- `renderMatches(groupFilter, roundFilter, query)`: cards de confrontos.
- `renderChallenges(query)`: ranking de desafios.
- `updateRoundFilter()`: popula o select de rodadas com base em `matches`.
- `renderAll()`: rerenderiza contadores, filtros e listas.
- `loadData()`: carrega CSVs externos/locais e atualiza estado.

## Regras de Ordenacao e Pontuacao

Ranking por grupo:

- Ordena por grupo.
- Dentro do grupo, ordena por pontos decrescente.
- Em empate, usa `position`/`ordem`.

Ranking geral:

- Ordena por pontos decrescente.
- Em empate, ordena por nome.
- Antes de ordenar, desconta de cada atleta os pontos, jogos e vitorias encontrados em `challenges`.
- Isso garante que jogos de desafio nao se somem na `Tabela geral`.

Ranking de desafios:

- Ordena por pontos decrescente.
- Em empate, ordena por nome.
- Mostra somente a pontuacao da aba/CSV `Desafios`.

Desafios em `app.js`:

- Vitoria: `20` pontos.
- Derrota: `10` pontos.
- Grupo A: subtrai `games_contra`.
- Grupo B: soma `games_pro`.
- Se `pontos` vier preenchido no CSV, o valor informado prevalece.

Pontuacao dos confrontos normais nao e calculada no site a partir do placar; o site apenas le `pontos`, `jogos` e `vitorias` da aba/CSV de atletas. A automacao de calculo fica descrita no Apps Script em `AUTOMATIZAR-GOOGLE-PLANILHAS.md`.

Regra de WO (coluna `wo` no CSV de confrontos):

- Quando a coluna `wo` contiver exatamente `WO` (maiusculo, case-insensitive), o jogo e tratado como walkover/desistencia.
- Se o grupo for Desafio: o vencedor recebe `10 pontos` independente do placar.
- Se o grupo nao for Desafio (Grupo A, Grupo B etc.): o vencedor recebe `20 pontos` independente do placar.
- O card do confronto exibe badge vermelho `WO`, borda lateral vermelha e a informacao dos pontos concedidos.
- Os pontos finais continuam sendo registrados manualmente na planilha; a regra no site e apenas visual/informativa.


Regra importante: a aba `Atletas` pode exibir os totais completos que vierem da planilha, inclusive desafios. A `Tabela geral` deve descontar os desafios para exibir somente os numeros dos confrontos normais. A aba `Tabela desafios` continua exibindo os desafios separadamente.

## Google Planilhas

O projeto foi preparado para o administrador atualizar uma planilha no Google Drive.

Fluxo esperado:

1. Criar abas `Atletas`, `Confrontos` e `Desafios`.
2. Publicar cada aba na web como CSV.
3. Colar as tres URLs em `google-sheets-config.js`.
4. O site passa a consumir os CSVs publicados ao recarregar.

Observacao: publicar uma aba como CSV deixa os dados visiveis publicamente. Nao colocar dados sigilosos.

## Cuidados Antes de Alterar

- Ha sinais de codificacao quebrada em textos com acento. Exemplos vistos no projeto: palavras como "Tenis", "Abrahao" e "1a Rodada" aparecem com mojibake em alguns arquivos. Isso parece ser texto UTF-8 lido/gravado de forma incorreta em algum momento. Se for corrigir, fazer com cuidado e testar todos os CSVs, HTML e JS.
- Nao trocar nomes de colunas dos CSVs sem atualizar `field()`/parsers.
- Nao remover `google-sheets-config.js` do `index.html`; ele precisa carregar antes de `app.js`.
- A aplicacao nao tem dependencias instaladas nem pipeline de build. Manter simples, salvo pedido contrario.
- Para testar `fetch()` de CSV local, use servidor local.
- O contador de confrontos no topo considera como pendentes os jogos cujo `status` normalizado nao e `finalizado`.
- `renderMatches()` cria uma variavel `challengeMatches`, mas atualmente nao inclui esses itens em `allItems`; os desafios aparecem quando existem linhas com `grupo` ou `tipo` igual a `Desafio` em `matches`.

## Possiveis Melhorias Futuras

- Corrigir definitivamente a codificacao dos arquivos para UTF-8 limpo.
- Adicionar tratamento visual de carregamento e erro de rede.
- Exibir data da ultima atualizacao dos dados.
- Validar CSVs e mostrar mensagem amigavel quando faltar coluna obrigatoria.
- Reduzir duplicacao entre ranking geral, ranking por grupo e desafios.
- Criar teste simples de parse CSV e regras de pontuacao.
- Decidir se desafios devem aparecer tambem como cards gerados de `dados/desafios.csv` ou somente via linhas da aba `Confrontos`.

## Estado Atual Conhecido

- O repositorio esta sem alteracoes pendentes antes da criacao deste arquivo.
- Existe um arquivo gerado em `outputs/desafios/desafios.xlsx`.
- A pagina principal inicia na aba `Tabela geral`.
- Os dados locais em `dados/` estao todos com pontuacao zerada no inicio das amostras lidas.
- O Google Planilhas esta configurado com tres links publicados no arquivo `google-sheets-config.js`.
