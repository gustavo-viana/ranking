# Configurar o Google Planilhas

Esta configuração é feita apenas uma vez. Depois dela, o administrador atualiza somente a planilha no Google Drive.

## 1. Criar a planilha

Crie uma planilha no Google Planilhas com duas abas chamadas `Atletas` e `Confrontos`.

Você pode importar os arquivos que já estão prontos:

- na aba `Atletas`, importe `dados/atletas.csv`;
- na aba `Confrontos`, importe `dados/confrontos.csv`.

Ao importar, selecione **Substituir dados na célula selecionada** e mantenha o separador como vírgula.

## 2. Publicar a aba Atletas

1. Abra **Arquivo > Compartilhar > Publicar na Web**.
2. Selecione apenas a aba `Atletas`.
3. Escolha **Valores separados por vírgulas (.csv)**.
4. Clique em **Publicar** e copie o endereço gerado.

Repita o processo para a aba `Confrontos`.

Publicar para leitura não dá aos visitantes permissão para editar. Porém, todo conteúdo publicado fica visível na internet; não inclua dados pessoais ou sigilosos.

## 3. Ligar a planilha ao site

Abra `google-sheets-config.js` e cole os links entre as aspas:

```js
window.RANKING_CONFIG = {
  athletesCsvUrl: 'LINK CSV DA ABA ATLETAS',
  matchesCsvUrl: 'LINK CSV DA ABA CONFRONTOS'
};
```

Envie novamente esse arquivo para a hospedagem. Essa é a única alteração necessária no código.

## 4. Atualizações posteriores

O administrador edita normalmente a planilha privada no Google Drive. Ao recarregar o site, o JavaScript consulta as versões publicadas das duas abas.

O Google pode levar alguns minutos para republicar uma alteração. Se os dados ainda não aparecerem, aguarde um pouco e recarregue a página.

## Colunas obrigatórias

Não renomeie nem remova os cabeçalhos.

### Atletas

`ordem, nome, grupo, pontos, jogos, vitorias`

### Confrontos

`id, mes, rodada, grupo, atleta1, atleta2, data, horario, quadra, status, placar, vencedor`

Para um jogo concluído, escreva exatamente `Finalizado` em `status` e informe o placar e o vencedor. Para os demais, use `Agendado`.
