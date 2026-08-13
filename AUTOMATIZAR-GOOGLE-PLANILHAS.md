# Automatizar a planilha do ranking

Este guia mantem os mesmos cabecalhos que o site ja le:

- `Atletas`: `ordem, nome, grupo, pontos, jogos, vitorias`
- `Confrontos`: `id, mes, rodada, grupo, atleta1, atleta2, data, horario, quadra, status, placar, vencedor`

## Opcao recomendada: Apps Script

Use esta opcao para ter listas suspensas nos nomes dos atletas e para atualizar automaticamente `pontos`, `jogos` e `vitorias` na aba `Atletas`.

1. Abra a planilha no Google Planilhas.
2. Va em **Extensoes > Apps Script**.
3. Apague o conteudo padrao e cole o script abaixo.
4. Clique em **Salvar**.
5. Execute a funcao `configurarRanking` uma vez e autorize.
6. Depois disso, edite normalmente a aba `Confrontos`.

```javascript
const ABA_ATLETAS = 'Atletas';
const ABA_CONFRONTOS = 'Confrontos';

function configurarRanking() {
  const ss = SpreadsheetApp.getActive();
  const atletas = ss.getSheetByName(ABA_ATLETAS);
  const confrontos = ss.getSheetByName(ABA_CONFRONTOS);

  const nomesRange = atletas.getRange('B2:B');
  const regraAtletas = SpreadsheetApp.newDataValidation()
    .requireValueInRange(nomesRange, true)
    .setAllowInvalid(false)
    .build();

  confrontos.getRange('E2:F').setDataValidation(regraAtletas);
  atualizarValidacaoVencedores_();
  recalcularAtletas_();
}

function onEdit(e) {
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const startCol = e.range.getColumn();
  const endCol = startCol + e.range.getNumColumns() - 1;

  if (sheetName === ABA_ATLETAS && startCol <= 2 && endCol >= 2) {
    configurarRanking();
    return;
  }

  if (sheetName !== ABA_CONFRONTOS) return;

  if (startCol <= 12 && endCol >= 5) {
    atualizarValidacaoVencedores_();
    recalcularAtletas_();
  }
}

function atualizarValidacaoVencedores_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(ABA_CONFRONTOS);
  const lastRow = Math.max(sheet.getLastRow(), 2);
  const rows = sheet.getRange(2, 5, lastRow - 1, 2).getValues();

  rows.forEach((row, index) => {
    const [atleta1, atleta2] = row.map(String);
    const cell = sheet.getRange(index + 2, 12);

    if (!atleta1 || !atleta2) {
      cell.clearDataValidations();
      return;
    }

    const regra = SpreadsheetApp.newDataValidation()
      .requireValueInList([atleta1, atleta2], true)
      .setAllowInvalid(false)
      .build();

    cell.setDataValidation(regra);
  });
}

function recalcularAtletas_() {
  const ss = SpreadsheetApp.getActive();
  const atletasSheet = ss.getSheetByName(ABA_ATLETAS);
  const confrontosSheet = ss.getSheetByName(ABA_CONFRONTOS);

  const atletasLastRow = atletasSheet.getLastRow();
  if (atletasLastRow < 2) return;

  const atletas = atletasSheet.getRange(2, 2, atletasLastRow - 1, 1).getValues().flat();
  const confrontos = confrontosSheet.getRange(2, 1, Math.max(confrontosSheet.getLastRow() - 1, 1), 12).getValues();

  const stats = new Map(atletas.map(nome => [normalizar_(nome), { pontos: 0, jogos: 0, vitorias: 0 }]));

  confrontos.forEach(row => {
    const atleta1 = row[4];
    const atleta2 = row[5];
    const status = row[9];
    const placar = row[10];
    const vencedor = row[11];

    if (normalizar_(status) !== 'finalizado' || !atleta1 || !atleta2 || !placar || !vencedor) return;

    const key1 = normalizar_(atleta1);
    const key2 = normalizar_(atleta2);
    const keyVencedor = normalizar_(vencedor);
    if (!stats.has(key1) || !stats.has(key2) || ![key1, key2].includes(keyVencedor)) return;

    const sets = contarSets_(placar);
    if (!sets || sets.sets1 === sets.sets2) return;

    const keyPerdedor = keyVencedor === key1 ? key2 : key1;
    const setsVencedor = keyVencedor === key1 ? sets.sets1 : sets.sets2;
    const setsPerdedor = keyVencedor === key1 ? sets.sets2 : sets.sets1;

    stats.get(key1).jogos += 1;
    stats.get(key2).jogos += 1;
    stats.get(keyVencedor).vitorias += 1;
    stats.get(keyVencedor).pontos += setsVencedor === 2 && setsPerdedor === 0 ? 20 : 15;
    stats.get(keyPerdedor).pontos += setsPerdedor === 1 ? 10 : 5;
  });

  const resultado = atletas.map(nome => {
    const s = stats.get(normalizar_(nome)) || { pontos: 0, jogos: 0, vitorias: 0 };
    return [s.pontos, s.jogos, s.vitorias];
  });

  atletasSheet.getRange(2, 4, resultado.length, 3).setValues(resultado);
}

function contarSets_(placar) {
  const sets = String(placar).trim().split(/\s+/);
  let sets1 = 0;
  let sets2 = 0;

  sets.forEach(set => {
    const partes = set.split(/[/-]/).map(Number);
    if (partes.length !== 2 || partes.some(Number.isNaN) || partes[0] === partes[1]) return;
    if (partes[0] > partes[1]) sets1 += 1;
    if (partes[1] > partes[0]) sets2 += 1;
  });

  return { sets1, sets2 };
}

function normalizar_(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
```

## Como preencher os confrontos

- Em `atleta1` e `atleta2`, escolha nomes da lista suspensa.
- Em `status`, use `Finalizado` somente quando houver resultado completo.
- Em `placar`, escreva os sets na ordem `atleta1/atleta2`, por exemplo:
  - `6/3 6/3`
  - `6/4 2/6 7/10`
- Em `vencedor`, escolha um dos dois atletas da partida.

## Pontuacao aplicada

- Vencedor por 2 sets a 0: `20` pontos
- Vencedor por 2 sets a 1: `15` pontos
- Perdedor por 2 sets a 1: `10` pontos
- Perdedor por 2 sets a 0: `5` pontos

## Opcao sem script: formulas

Se preferir nao usar Apps Script, coloque formulas na aba `Atletas`.

Na coluna `jogos`, em `E2`:

```text
=CONT.SES(Confrontos!$J$2:$J;"Finalizado";Confrontos!$E$2:$E;$B2)+CONT.SES(Confrontos!$J$2:$J;"Finalizado";Confrontos!$F$2:$F;$B2)
```

Na coluna `vitorias`, em `F2`:

```text
=CONT.SES(Confrontos!$J$2:$J;"Finalizado";Confrontos!$L$2:$L;$B2)
```

Para `pontos`, o Apps Script acima e mais confiavel porque ele interpreta o placar set por set e evita formulas muito longas.
