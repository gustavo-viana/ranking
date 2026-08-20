# Configurar o Google Planilhas

Esta configuração é feita apenas uma vez. Depois dela, o administrador atualiza somente a planilha no Google Drive.

## 1. Criar a planilha

Crie uma planilha no Google Planilhas com três abas chamadas `Atletas`, `Confrontos` e `Desafios`.

Você pode importar os arquivos que já estão prontos:

- na aba `Atletas`, importe `dados/atletas.csv`;
- na aba `Confrontos`, importe `dados/confrontos.csv`;
- na aba `Desafios`, importe `dados/desafios.csv`.

Ao importar, selecione **Substituir dados na célula selecionada** e mantenha o separador como vírgula.

## 2. Estrutura da aba Desafios

Use estes cabeçalhos:

`ordem, nome, grupo, rodada, tipo, vitorias, derrotas, games_pro, games_contra, jogos, pontos`

Para não repetir nomes manualmente, deixe `nome` e `grupo` puxando da aba `Atletas`.

Na linha 2 da aba `Desafios`, use:

- `A2`: `=Atletas!A2`
- `B2`: `=Atletas!B2`
- `C2`: `=Atletas!C2`
- `D2`: `1ª Rodada`
- `E2`: `Desafio`
- `J2`: `=F2+G2`
- `K2`: `=F2*20+G2*10+SE(C2="Grupo A";-I2;SE(C2="Grupo B";H2;0))`

Depois arraste essas fórmulas para baixo até o último atleta.

Você só precisa editar:

- `vitorias`
- `derrotas`
- `games_pro`
- `games_contra`

Você também pode editar `rodada` se esses desafios forem para outra rodada. Mantenha `tipo` como `Desafio` para o filtro da aba Confrontos funcionar.

A regra aplicada é:

- Vitória: 20 pontos
- Derrota: 10 pontos
- Grupo A, desafiado: games perdidos contam negativo, usando `games_contra`
- Grupo B, desafiante: games ganhos contam positivo, usando `games_pro`

## 3. Publicar as abas

1. Abra **Arquivo > Compartilhar > Publicar na Web**.
2. Selecione a aba desejada.
3. Escolha **Valores separados por vírgulas (.csv)**.
4. Clique em **Publicar** e copie o endereço gerado.

Repita o processo para as abas `Atletas`, `Confrontos` e `Desafios`.

Publicar para leitura não dá aos visitantes permissão para editar. Porém, todo conteúdo publicado fica visível na internet; não inclua dados pessoais ou sigilosos.

## 4. Ligar a planilha ao site

Abra `google-sheets-config.js` e cole os links entre as aspas:

```js
window.RANKING_CONFIG = {
  athletesCsvUrl: 'LINK CSV DA ABA ATLETAS',
  matchesCsvUrl: 'LINK CSV DA ABA CONFRONTOS',
  challengesCsvUrl: 'LINK CSV DA ABA DESAFIOS'
};
```

Envie novamente esse arquivo para a hospedagem. Essa é a única alteração necessária no código.

## 5. Atualizações posteriores

O administrador edita normalmente a planilha privada no Google Drive. Ao recarregar o site, o JavaScript consulta as versões publicadas das três abas.

O Google pode levar alguns minutos para republicar uma alteração. Se os dados ainda não aparecerem, aguarde um pouco e recarregue a página.

## Colunas obrigatórias

Não renomeie nem remova os cabeçalhos.

### Atletas

`ordem, nome, grupo, pontos, jogos, vitorias`

### Confrontos

`id, mes, rodada, grupo, atleta1, atleta2, data, horario, quadra, status, placar, vencedor`

Para um jogo concluído, escreva exatamente `Finalizado` em `status` e informe o placar e o vencedor. Para os demais, use `Agendado`.

### Desafios

`ordem, nome, grupo, rodada, tipo, vitorias, derrotas, games_pro, games_contra, jogos, pontos`
