# Como atualizar o Ranking Acto

## Atletas

Edite `dados/atletas.csv` no Excel ou LibreOffice. Atualize `pontos`, `jogos` e `vitorias`. O ranking é ordenado automaticamente pela pontuação dentro de cada grupo.

## Confrontos

Edite `dados/confrontos.csv`. Cada jogo possui uma coluna `rodada`, usada pelo filtro da página. Quando os atletas combinarem o jogo, preencha `data`, `horario` e `quadra`. Após a partida, use `Finalizado` na coluna `status` e preencha `placar` e `vencedor`.

Exemplo: `10/08/2026`, `19:30`, `Quadra 1`, `Finalizado`, `6/3 6/4`, `Abrahão`.

Não altere os nomes das colunas da primeira linha. Salve como CSV em UTF-8.

## Abrir localmente

Execute na pasta do projeto:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`. O servidor funciona somente enquanto o terminal permanecer aberto e não publica nada na internet.

## Google Planilhas

Para permitir que um administrador atualize os dados sem acessar os arquivos do site, siga o guia `CONFIGURAR-GOOGLE-PLANILHAS.md`. A integração fica configurada em `google-sheets-config.js`.

Para automatizar listas de atletas, vencedores, pontos, jogos e vitórias dentro do Google Planilhas, siga `AUTOMATIZAR-GOOGLE-PLANILHAS.md`.
