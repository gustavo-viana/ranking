# Automatizar a planilha do ranking

Este guia mantem os mesmos cabecalhos que o site ja le:

- `Atletas`: `ordem, nome, grupo, pontos, jogos, vitorias`
- `Confrontos`: `id, mes, rodada, grupo, atleta1, atleta2, data, horario, quadra, status, placar, vencedor`
- `Desafios`: `ordem, nome, grupo, rodada, tipo, vitorias, derrotas, games_pro, games_contra, jogos, pontos`

## Opcao recomendada: Apps Script

Use esta opcao para ter listas suspensas nos nomes dos atletas, puxar a aba `Desafios` automaticamente a partir da aba `Atletas`, adicionar os jogos de desafio na aba `Confrontos` e atualizar automaticamente `pontos`, `jogos` e `vitorias` na aba `Atletas`.

1. Abra a planilha no Google Planilhas.
2. Va em **Extensoes > Apps Script**.
3. Apague o conteudo padrao e cole o script abaixo.
4. Clique em **Salvar**.
5. Execute a funcao `configurarRanking` uma vez e autorize.
6. Depois disso, edite normalmente a aba `Confrontos`.

```javascript
const ABA_ATLETAS = 'Atletas';
const ABA_CONFRONTOS = 'Confrontos';
const ABA_DESAFIOS = 'Desafios';

const DESAFIOS_CONFRONTOS = [
  ['Abrahão', 'Gabriel P.'],
  ['Betinho', 'João C.'],
  ['Fernando C.', 'Maxwell'],
  ['Michael', 'L. Gustavo'],
  ['Fernando D.', 'Gustavo'],
  ['Julian', 'G. Gusmão'],
  ['Richard', 'Elton'],
  ['Tiléo', 'Taciano'],
  ['Alexis', 'Hendrikson'],
  ['Felipe', 'Tiago F.'],
  ['Fernando S.', 'Maxsuel'],
  ['Rodrigo', 'Douglas'],
  ['Igor', 'Cássio'],
  ['Marcelo T.', 'Cléber'],
  ['José Jr', 'Ely'],
  ['Willian', 'Doka']
];

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
  atualizarDesafios_();
  atualizarConfrontosDesafios_();
  atualizarValidacaoVencedores_();
  atualizarDesafiosPorConfrontos_();
  recalcularAtletas_();
}

function onEdit(e) {
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const startCol = e.range.getColumn();
  const endCol = startCol + e.range.getNumColumns() - 1;

  if (sheetName === ABA_ATLETAS && startCol <= 3 && endCol >= 1) {
    configurarRanking();
    return;
  }

  if (sheetName === ABA_DESAFIOS) {
    if (startCol <= 9 && endCol >= 4) {
      atualizarDesafios_();
      recalcularAtletas_();
    }
    return;
  }

  if (sheetName !== ABA_CONFRONTOS) return;

  if (startCol <= 12 && endCol >= 5) {
    atualizarValidacaoVencedores_();
    atualizarDesafios_();
    atualizarDesafiosPorConfrontos_();
    recalcularAtletas_();
  }
}

function atualizarDesafios_() {
  const ss = SpreadsheetApp.getActive();
  const atletasSheet = ss.getSheetByName(ABA_ATLETAS);
  const desafiosSheet = ss.getSheetByName(ABA_DESAFIOS);

  const atletasLastRow = atletasSheet.getLastRow();
  if (atletasLastRow < 2) {
    limparLinhasDesafios_(desafiosSheet, 2);
    return;
  }

  const atletas = atletasSheet.getRange(2, 1, atletasLastRow - 1, 3).getValues();
  const nomesAtletas = atletas.map(row => row[1]).filter(Boolean);
  const desafiosLastRow = desafiosSheet.getLastRow();
  const desafiosAtuais = desafiosLastRow < 2
    ? []
    : desafiosSheet.getRange(2, 1, desafiosLastRow - 1, 11).getValues();

  const desafiosPorNome = new Map();
  desafiosAtuais.forEach(row => {
    const nome = chaveAtleta_(row[1]);
    if (nome) desafiosPorNome.set(nome, row);
  });

  const participantes = [];

  DESAFIOS_CONFRONTOS.forEach(par => {
    const atleta1 = resolverNomeAtleta_(par[0], nomesAtletas);
    const atleta2 = resolverNomeAtleta_(par[1], nomesAtletas);

    adicionarParticipanteDesafio_(participantes, atleta1, 'Grupo A');
    adicionarParticipanteDesafio_(participantes, atleta2, 'Grupo B');
  });

  const resultado = participantes
    .filter(participante => participante.nome)
    .map((row, index) => {
      const { nome, grupo } = row;
      const atual = desafiosPorNome.get(chaveAtleta_(nome)) || [];
      const atletaOriginal = atletas.find(atleta => chaveAtleta_(atleta[1]) === chaveAtleta_(nome));
      const ordemOriginal = atletaOriginal ? atletaOriginal[0] : '';
      const ordem = ordemOriginal || index + 1;
      const rodada = atual[3] || '1ª Rodada';
      const tipo = atual[4] || 'Desafio';
      const vitorias = numero_(atual[5]);
      const derrotas = numero_(atual[6]);
      const gamesPro = numero_(atual[7]);
      const gamesContra = numero_(atual[8]);
      const jogos = vitorias + derrotas;
      const pontos = calcularPontosDesafio_(grupo, vitorias, derrotas, gamesPro, gamesContra);

      return [ordem, nome, grupo, rodada, tipo, vitorias, derrotas, gamesPro, gamesContra, jogos, pontos];
    });

  limparLinhasDesafios_(desafiosSheet, resultado.length + 2);
  if (resultado.length) {
    desafiosSheet.getRange(2, 1, resultado.length, 11).setValues(resultado);
  }
}

function adicionarParticipanteDesafio_(participantes, nome, grupo) {
  const key = chaveAtleta_(nome);
  if (!key) return;

  const existente = participantes.find(participante => chaveAtleta_(participante.nome) === key);
  if (existente) {
    existente.grupo = grupo;
    return;
  }

  participantes.push({ nome, grupo });
}

function limparLinhasDesafios_(sheet, startRow) {
  const lastRow = sheet.getLastRow();
  if (lastRow >= startRow) {
    sheet.getRange(startRow, 1, lastRow - startRow + 1, 11).clearContent();
  }
}

function atualizarConfrontosDesafios_() {
  const ss = SpreadsheetApp.getActive();
  const atletasSheet = ss.getSheetByName(ABA_ATLETAS);
  const confrontosSheet = ss.getSheetByName(ABA_CONFRONTOS);
  const atletasLastRow = atletasSheet.getLastRow();
  const atletas = atletasLastRow < 2
    ? []
    : atletasSheet.getRange(2, 2, atletasLastRow - 1, 1).getValues().flat().filter(Boolean);
  const confrontosLastRow = Math.max(confrontosSheet.getLastRow(), 2);
  const confrontos = confrontosSheet.getRange(2, 1, confrontosLastRow - 1, 12).getValues();
  const linhasPorId = new Map();

  confrontos.forEach((row, index) => {
    const id = String(row[0] || '').trim();
    if (id) linhasPorId.set(id, index + 2);
  });

  const linhaComMes = confrontos.find(row => row[1]);
  const linhaComRodada = confrontos.find(row => row[2]);
  const mes = linhaComMes ? linhaComMes[1] : 'Agosto';
  const rodada = linhaComRodada ? linhaComRodada[2] : '1ª Rodada';
  let proximaLinha = confrontosSheet.getLastRow() + 1;

  DESAFIOS_CONFRONTOS.forEach((par, index) => {
    const id = `DES-${String(index + 1).padStart(2, '0')}`;
    const linha = linhasPorId.get(id) || proximaLinha++;
    const atual = linhasPorId.get(id)
      ? confrontosSheet.getRange(linha, 1, 1, 12).getValues()[0]
      : [];
    const atleta1 = resolverNomeAtleta_(par[0], atletas);
    const atleta2 = resolverNomeAtleta_(par[1], atletas);
    const status = atual[9] || 'Agendado';

    confrontosSheet.getRange(linha, 5, 1, 2).clearDataValidations();
    confrontosSheet.getRange(linha, 1, 1, 12).setValues([[
      id,
      atual[1] || mes,
      atual[2] || rodada,
      'Desafio',
      atleta1,
      atleta2,
      atual[6] || '',
      atual[7] || '',
      atual[8] || '',
      status,
      atual[10] || '',
      atual[11] || ''
    ]]);
  });
}

function atualizarDesafiosPorConfrontos_() {
  const ss = SpreadsheetApp.getActive();
  const desafiosSheet = ss.getSheetByName(ABA_DESAFIOS);
  const confrontosSheet = ss.getSheetByName(ABA_CONFRONTOS);
  const desafiosLastRow = desafiosSheet.getLastRow();
  const confrontosLastRow = confrontosSheet.getLastRow();

  if (desafiosLastRow < 2 || confrontosLastRow < 2) return;

  const desafios = desafiosSheet.getRange(2, 1, desafiosLastRow - 1, 11).getValues();
  const confrontos = confrontosSheet.getRange(2, 1, confrontosLastRow - 1, 12).getValues();
  const nomesDesafios = desafios.map(row => row[1]).filter(Boolean);
  const stats = new Map();

  desafios.forEach((row, index) => {
    const nome = row[1];
    const key = chaveAtleta_(nome);
    if (!key) return;

    stats.set(key, {
      rowIndex: index + 2,
      vitorias: 0,
      derrotas: 0,
      gamesPro: 0,
      gamesContra: 0
    });
  });

  confrontos.forEach((row, index) => {
    const grupo = row[3];
    const atleta1 = row[4];
    const atleta2 = row[5];
    const placar = row[10];

    if (!['desafio', 'desafios'].includes(normalizar_(grupo)) || !atleta1 || !atleta2 || !placar) return;

    const resultado = analisarPlacar_(placar);
    if (!resultado || !resultado.vencedor) return;

    const stat1 = encontrarStatAtleta_(stats, atleta1, nomesDesafios);
    const stat2 = encontrarStatAtleta_(stats, atleta2, nomesDesafios);

    if (stat1) {
      stat1.gamesPro += resultado.games1;
      stat1.gamesContra += resultado.games2;
      stat1.vitorias += resultado.vencedor === 1 ? 1 : 0;
      stat1.derrotas += resultado.vencedor === 2 ? 1 : 0;
    }

    if (stat2) {
      stat2.gamesPro += resultado.games2;
      stat2.gamesContra += resultado.games1;
      stat2.vitorias += resultado.vencedor === 2 ? 1 : 0;
      stat2.derrotas += resultado.vencedor === 1 ? 1 : 0;
    }

    confrontosSheet.getRange(index + 2, 12).setValue(resultado.vencedor === 1 ? atleta1 : atleta2);
  });

  stats.forEach(stat => {
    const row = desafiosSheet.getRange(stat.rowIndex, 1, 1, 11).getValues()[0];
    const grupo = row[2];
    const jogos = stat.vitorias + stat.derrotas;
    const pontos = calcularPontosDesafio_(grupo, stat.vitorias, stat.derrotas, stat.gamesPro, stat.gamesContra);

    desafiosSheet.getRange(stat.rowIndex, 6, 1, 6).setValues([[
      stat.vitorias,
      stat.derrotas,
      stat.gamesPro,
      stat.gamesContra,
      jogos,
      pontos
    ]]);
  });
}

function encontrarStatAtleta_(stats, nome, nomesReferencia) {
  const direto = stats.get(chaveAtleta_(nome));
  if (direto) return direto;

  const resolvido = resolverNomeAtleta_(nome, nomesReferencia);
  return stats.get(chaveAtleta_(resolvido));
}

function resolverNomeAtleta_(nome, atletas) {
  const nomeNormalizado = normalizar_(nome);
  const apelidos = {
    'gabriel p.': 'Gabriel Pereira',
    'joao c.': 'João Carneiro',
    'fernando c.': 'Fernando Corrêa',
    'fernando d.': 'Fernando Dreyer',
    'g. gusmao': 'Gabriel Gusmão',
    'l. gustavo': 'Luiz Gustavo',
    'tiago f.': 'Thiago Faria',
    'marcelo t.': 'Marcelo Toledo',
    'jose jr': 'José Júnior',
    'igor': 'Igor Pinheiro',
    'maxwell': 'Max'
  };
  const preferido = apelidos[nomeNormalizado] || nome;
  const preferidoNormalizado = normalizar_(preferido);
  const exato = atletas.find(atleta => normalizar_(atleta) === preferidoNormalizado);
  if (exato) return exato;

  const abreviado = atletas.find(atleta => {
    const partes = String(atleta).trim().split(/\s+/);
    const primeiroNome = normalizar_(partes[0]);
    const inicialSobrenome = normalizar_(partes[1] || '').charAt(0);
    return nomeNormalizado === `${primeiroNome} ${inicialSobrenome}.`;
  });

  return abreviado || nome;
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
  const desafiosSheet = ss.getSheetByName(ABA_DESAFIOS);

  const atletasLastRow = atletasSheet.getLastRow();
  if (atletasLastRow < 2) return;

  const atletas = atletasSheet.getRange(2, 2, atletasLastRow - 1, 1).getValues().flat();
  const confrontos = confrontosSheet.getRange(2, 1, Math.max(confrontosSheet.getLastRow() - 1, 1), 12).getValues();
  const desafios = desafiosSheet.getRange(2, 1, Math.max(desafiosSheet.getLastRow() - 1, 1), 11).getValues();

  const stats = new Map(atletas.map(nome => [normalizar_(nome), { pontos: 0, jogos: 0, vitorias: 0 }]));

  confrontos.forEach(row => {
    const grupo = row[3];
    const atleta1 = row[4];
    const atleta2 = row[5];
    const status = row[9];
    const placar = row[10];
    const vencedor = row[11];

    if (['desafio', 'desafios'].includes(normalizar_(grupo))) return;
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

  desafios.forEach(row => {
    const nome = row[1];
    const grupo = row[2];
    const tipo = row[4];
    const vitorias = numero_(row[5]);
    const derrotas = numero_(row[6]);
    const gamesPro = numero_(row[7]);
    const gamesContra = numero_(row[8]);
    const key = normalizar_(nome);

    if (!stats.has(key) || normalizar_(tipo) !== 'desafio') return;

    const s = stats.get(key);
    s.jogos += vitorias + derrotas;
    s.vitorias += vitorias;
    s.pontos += calcularPontosDesafio_(grupo, vitorias, derrotas, gamesPro, gamesContra);
  });

  const resultado = atletas.map(nome => {
    const s = stats.get(normalizar_(nome)) || { pontos: 0, jogos: 0, vitorias: 0 };
    return [s.pontos, s.jogos, s.vitorias];
  });

  atletasSheet.getRange(2, 4, resultado.length, 3).setValues(resultado);
}

function calcularPontosDesafio_(grupo, vitorias, derrotas, gamesPro, gamesContra) {
  const bonusGrupo = normalizar_(grupo) === 'grupo a'
    ? -gamesContra
    : normalizar_(grupo) === 'grupo b'
      ? gamesPro
      : 0;

  return vitorias * 20 + derrotas * 10 + bonusGrupo;
}

function analisarPlacar_(placar) {
  const sets = String(placar).trim().split(/\s+/);
  let sets1 = 0;
  let sets2 = 0;
  let games1 = 0;
  let games2 = 0;

  sets.forEach(set => {
    const partes = set.split(/[/-]/).map(Number);
    if (partes.length !== 2 || partes.some(Number.isNaN)) return;

    if (partes[0] > partes[1]) {
      sets1 += 1;
      if (ehSuperTieBreak_(partes)) {
        games1 += 1;
      } else {
        games1 += partes[0];
        games2 += partes[1];
      }
    }

    if (partes[1] > partes[0]) {
      sets2 += 1;
      if (ehSuperTieBreak_(partes)) {
        games2 += 1;
      } else {
        games1 += partes[0];
        games2 += partes[1];
      }
    }
  });

  if (!sets1 && !sets2) return null;

  return {
    sets1,
    sets2,
    games1,
    games2,
    vencedor: sets1 === sets2 ? 0 : sets1 > sets2 ? 1 : 2
  };
}

function ehSuperTieBreak_(partes) {
  return Math.max(partes[0], partes[1]) >= 10;
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

function chaveAtleta_(valor) {
  return normalizar_(valor).replace(/[^a-z0-9]/g, '');
}

function numero_(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}
```

## Como preencher os confrontos

- Em `atleta1` e `atleta2`, escolha nomes da lista suspensa.
- Em `status`, use `Finalizado` somente quando houver resultado completo.
- Em `placar`, escreva os sets na ordem `atleta1/atleta2`, por exemplo:
  - `6/3 6/3`
  - `6/4 2/6 7/10`
- Em `vencedor`, escolha um dos dois atletas da partida.
- Os jogos com `grupo` igual a `Desafio` sao criados automaticamente pelo script para aparecerem no filtro do site.
- Nos jogos com `grupo` igual a `Desafio`, lance o placar em `placar` usando a ordem `atleta1/atleta2`, por exemplo `6/1 3/6 10/7`.
- O script soma os games antes da barra para `atleta1` e os games depois da barra para `atleta2`.
- No super tie-break, o placar conta como apenas `1` game para quem venceu o tie-break.
- O vencedor do desafio e preenchido automaticamente em `vencedor`.
- A aba `Desafios` recebe automaticamente `vitorias`, `derrotas`, `games_pro`, `games_contra`, `jogos` e `pontos` a partir desses placares.

## Desafios criados em Confrontos

Ao executar `configurarRanking`, o script cria ou atualiza estes jogos na aba `Confrontos`, com IDs fixos de `DES-01` a `DES-16`:

- Abrahão x Gabriel P.
- Betinho x João C.
- Fernando C. x Maxwell
- Michael x L. Gustavo
- Fernando D. x Gustavo
- Julian x G. Gusmão
- Richard x Elton
- Tiléo x Taciano
- Alexis x Hendrikson
- Felipe x Tiago F.
- Fernando S. x Maxsuel
- Rodrigo x Douglas
- Igor x Cássio
- Marcelo T. x Cléber
- José Jr x Ely
- Willian x Doka

## Pontuacao aplicada

- Vencedor por 2 sets a 0: `20` pontos
- Vencedor por 2 sets a 1: `15` pontos
- Perdedor por 2 sets a 1: `10` pontos
- Perdedor por 2 sets a 0: `5` pontos

## Como preencher os desafios

A aba `Desafios` e preenchida automaticamente com `ordem`, `nome` e `grupo` da aba `Atletas`.

Normalmente voce nao precisa editar as estatisticas desta aba. Elas sao calculadas a partir dos jogos de desafio lancados em `Confrontos`.

Se precisar ajustar a exibicao, edite somente:

- `rodada`
- `tipo`, mantendo `Desafio`

O script calcula automaticamente `vitorias`, `derrotas`, `games_pro`, `games_contra`, `jogos` e `pontos` na aba `Desafios`, e soma esses pontos, jogos e vitorias na aba `Atletas`.

## Pontuacao dos desafios

- Vitoria: `20` pontos
- Derrota: `10` pontos
- Grupo A: subtrai `games_contra`
- Grupo B: soma `games_pro`

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
