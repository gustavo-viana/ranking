const athleteNames = {
  'Grupo A': ['Abrahão','Alexis','Betinho','Felipe','Fernando Almeida','Fernando Corrêa','Fernando Dreyer','Gabriel Pereira','Igor Pinheiro','José Júnior','Julian','Marcelo Toledo','Michael','Richard','Rodrigo','Willian'],
  'Grupo B': ['Douglas','Elton','Eustáquio','Gabriel Gusmão','Gustavo','Hendrikson','João Carneiro','Luiz Gustavo','Max','Maxsuel','Taciano','Thiago Faria']
};
let athletes = Object.entries(athleteNames).flatMap(([group,names]) => names.map((name,i) => ({name,group,position:i+1,points:0,games:0,wins:0})));

const rawMatches = [
  ['A','Abrahão','Betinho'],['A','Fernando Corrêa','Michael'],['A','Fernando Dreyer','Julian'],['A','Richard','Willian'],
  ['A','Alexis','Felipe'],['A','Fernando Almeida','Rodrigo'],['A','Gabriel Pereira','Igor Pinheiro'],['A','Marcelo Toledo','José Júnior'],
  ['B','Elton','Gabriel Gusmão'],['B','Gustavo','Taciano'],['B','Eustáquio','João Carneiro'],['B','Luiz Gustavo','Max'],['B','Douglas','Hendrikson'],['B','Maxsuel','Thiago Faria'],
  ['A','Abrahão','Fernando Corrêa'],['A','Betinho','Michael'],['A','Fernando Dreyer','Richard'],['A','Julian','Willian'],
  ['A','Alexis','Fernando Almeida'],['A','Felipe','Rodrigo'],['A','Gabriel Pereira','Marcelo Toledo'],['A','Igor Pinheiro','José Júnior'],
  ['B','Elton','Gustavo'],['B','Gabriel Gusmão','Taciano'],['B','Eustáquio','Luiz Gustavo'],['B','João Carneiro','Max'],['B','Douglas','Maxsuel'],['B','Hendrikson','Thiago Faria'],
  ['A','Abrahão','Michael'],['A','Betinho','Fernando Corrêa'],['A','Fernando Dreyer','Willian'],['A','Julian','Richard'],
  ['A','Alexis','Rodrigo'],['A','Felipe','Fernando Almeida'],['A','Gabriel Pereira','José Júnior'],['A','Igor Pinheiro','Marcelo Toledo'],
  ['B','Elton','Taciano'],['B','Gabriel Gusmão','Gustavo'],['B','Eustáquio','Max'],['B','João Carneiro','Luiz Gustavo'],['B','Douglas','Maxsuel'],['B','Hendrikson','Thiago Faria']
];
let matches = rawMatches.map((m,i) => ({id:i+1,month:'Agosto',round:'1ª Rodada',group:`Grupo ${m[0]}`,player1:m[1],player2:m[2],date:'',time:'',court:'',status:'Agendado',score:'',winner:''}));

const colors=['#dce8d6','#e8e3d5','#d9e5e7','#eee0d9','#e2def0','#d8e9e2'];
const initials=name=>name.split(' ').slice(0,2).map(p=>p[0]).join('');
const safe=value=>String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const normalizedName=name=>String(name||'').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const field=(row,...names)=>names.map(name=>row[name]).find(value=>value!==undefined&&value!=='')||'';

function renderRanking(query=''){
  const ordered=[...athletes].sort((a,b)=>a.group.localeCompare(b.group)||(b.points||0)-(a.points||0)||a.position-b.position);
  const filtered=ordered.filter(a=>a.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  let currentGroup=''; const positions={};
  document.querySelector('#rankingList').innerHTML=filtered.map(a=>{
    const header=a.group!==currentGroup?`<div class="group-header"><span>${safe(a.group)}</span><small>${athletes.filter(x=>x.group===a.group).length} atletas</small></div>`:'';
    currentGroup=a.group; positions[a.group]=(positions[a.group]||0)+1; const pos=positions[a.group];
    return `${header}<div class="ranking-row"><span class="position ${pos<=3?'top':''}">${String(pos).padStart(2,'0')}</span><div class="athlete"><span class="avatar" style="background:${colors[(pos-1)%colors.length]}">${safe(initials(a.name))}</span><span><strong>${safe(a.name)}</strong><small>${safe(a.group)}</small></span></div><span class="stat">${a.games||0}</span><span class="stat wins">${a.wins||0}</span><span class="points">${(a.points||0).toLocaleString('pt-BR')} <small>PTS</small></span></div>`;
  }).join('');
  document.querySelector('#rankingEmpty').hidden=filtered.length>0;
}

function renderUnifiedRanking(query=''){
  const ordered=[...athletes].sort((a,b)=>(b.points||0)-(a.points||0)||a.name.localeCompare(b.name,'pt-BR'));
  const filtered=ordered.filter(a=>String(a.name||'').toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  document.querySelector('#unifiedList').innerHTML=filtered.map((a,i)=>{
    const pos=i+1;
    return `<div class="ranking-row unified-row"><span class="position ${pos<=3?'top':''}">${String(pos).padStart(2,'0')}</span><div class="athlete"><span class="avatar" style="background:${colors[(pos-1)%colors.length]}">${safe(initials(a.name))}</span><span><strong>${safe(a.name)}</strong><small>${safe(a.group)}</small></span></div><span class="stat">${a.games||0}</span><span class="stat wins">${a.wins||0}</span><span class="points">${(a.points||0).toLocaleString('pt-BR')} <small>PTS</small></span></div>`;
  }).join('');
  document.querySelector('#unifiedEmpty').hidden=filtered.length>0;
}

function renderMatches(groupFilter='all',roundFilter='all'){
  const filtered=matches.filter(m=>(groupFilter==='all'||m.group===groupFilter)&&(roundFilter==='all'||m.round===roundFilter));
  document.querySelector('#matchesList').innerHTML=filtered.map((m,i)=>{
    const finished=m.status.toLocaleLowerCase('pt-BR')==='finalizado';
    const player1Won=Boolean(m.winner)&&normalizedName(m.winner)===normalizedName(m.player1);
    const player2Won=Boolean(m.winner)&&normalizedName(m.winner)===normalizedName(m.player2);
    const info=finished?`${safe(m.score)} · Vencedor: ${safe(m.winner)}`:([m.date,m.time,m.court].filter(Boolean).map(safe).join(' · ')||'Data, horário e quadra a definir');
    return `<article class="match-card"><div class="match-top"><span class="date-badge">${safe(m.month).toUpperCase()} · ${safe(m.round).toUpperCase()}</span><span class="court">${safe(m.group)}</span></div><div class="players"><div class="player ${player1Won?'winner':''}"><span class="avatar" style="background:${colors[i%colors.length]}">${player1Won?'<span class="winner-crown" aria-label="Vencedor">👑</span>':''}${safe(initials(m.player1))}</span><strong>${safe(m.player1)}</strong></div><span class="versus">VS</span><div class="player ${player2Won?'winner':''}"><span class="avatar" style="background:${colors[(i+2)%colors.length]}">${player2Won?'<span class="winner-crown" aria-label="Vencedor">👑</span>':''}${safe(initials(m.player2))}</span><strong>${safe(m.player2)}</strong></div></div><div class="match-info ${finished?'finished':''}">${info}</div></article>`;
  }).join('');
  document.querySelector('#matchesEmpty').hidden=filtered.length>0;
}

function parseCsv(text){
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
  const delimiter=[',',';','\t'].sort((a,b)=>lines[0].split(b).length-lines[0].split(a).length)[0];
  const parse=line=>{const out=[];let value='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'){value+='"';i++}else if(c==='"')quoted=!quoted;else if(c===delimiter&&!quoted){out.push(value.trim());value=''}else value+=c}out.push(value.trim());return out};
  const headers=parse(lines.shift()).map(h=>normalizedName(h)); return lines.filter(Boolean).map(line=>{const row=parse(line);return Object.fromEntries(headers.map((h,i)=>[h,row[i]||'']))});
}

async function loadData(){
  try{
    const config=window.RANKING_CONFIG||{};
    const usingGoogle=Boolean(config.athletesCsvUrl&&config.matchesCsvUrl);
    const athleteSource=config.athletesCsvUrl||'dados/atletas.csv';
    const matchSource=config.matchesCsvUrl||'dados/confrontos.csv';
    const fresh=url=>`${url}${url.includes('?')?'&':'?'}atualizacao=${Date.now()}`;
    const [aRes,mRes]=await Promise.all([fetch(fresh(athleteSource),{cache:'no-store'}),fetch(fresh(matchSource),{cache:'no-store'})]);
    if(!aRes.ok||!mRes.ok)throw new Error('Planilhas indisponíveis');
    athletes=parseCsv(await aRes.text()).map((r,i)=>({name:field(r,'nome','atleta'),group:field(r,'grupo'),position:Number(field(r,'ordem'))||i+1,points:Number(field(r,'pontos'))||0,games:Number(field(r,'jogos'))||0,wins:Number(field(r,'vitorias'))||0})).filter(a=>a.name);
    matches=parseCsv(await mRes.text()).map(r=>({id:field(r,'id'),month:field(r,'mes'),round:field(r,'rodada'),group:field(r,'grupo'),player1:field(r,'atleta1','atleta 1'),player2:field(r,'atleta2','atleta 2'),date:field(r,'data'),time:field(r,'horario'),court:field(r,'quadra'),status:field(r,'status'),score:field(r,'placar'),winner:field(r,'vencedor')}));
    const status=document.querySelector('#dataStatus');
    status.title=usingGoogle?'Dados carregados do Google Planilhas':'Dados carregados dos arquivos locais';
    status.classList.toggle('google-connected',usingGoogle);
    renderAll();
  }catch(error){
    const status=document.querySelector('#dataStatus');
    status.title='Falha ao atualizar; usando a cópia de reserva';
    status.classList.add('data-error');
    console.warn('Usando os dados de reserva. Confira os links publicados do Google Planilhas.',error);
  }
}
function updateRoundFilter(){const select=document.querySelector('#roundFilter');const selected=select.value;const rounds=[...new Set(matches.map(m=>m.round).filter(Boolean))];select.innerHTML='<option value="all">Todas as rodadas</option>'+rounds.map(round=>`<option value="${safe(round)}">${safe(round)}</option>`).join('');select.value=rounds.includes(selected)?selected:'all'}
function renderAll(){document.querySelector('#matchCount').textContent=matches.length;updateRoundFilter();renderRanking(document.querySelector('#athleteSearch').value);renderUnifiedRanking(document.querySelector('#unifiedSearch').value);renderMatches(document.querySelector('.filter.active').dataset.filter,document.querySelector('#roundFilter').value)}
document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===tab));document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelector(`#${tab.dataset.view}View`).classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}));
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===btn));renderMatches(btn.dataset.filter,document.querySelector('#roundFilter').value)}));
document.querySelector('#roundFilter').addEventListener('change',e=>renderMatches(document.querySelector('.filter.active').dataset.filter,e.target.value));
document.querySelector('#athleteSearch').addEventListener('input',e=>renderRanking(e.target.value));
document.querySelector('#unifiedSearch').addEventListener('input',e=>renderUnifiedRanking(e.target.value));
renderAll(); loadData();
