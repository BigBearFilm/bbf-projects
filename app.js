
const PLN = new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN',maximumFractionDigits:2});
const pct = v => `${(v*100).toFixed(1).replace('.',',')}%`;
const uid = () => Math.random().toString(36).slice(2,10);
const clone = x => JSON.parse(JSON.stringify(x));
const today = () => new Date().toISOString().slice(0,10);

const defaultPriceList=[];
const initialRows=[];
const defaults={projects:[],clients:[],crew:[],priceList:[],ui:{tab:'dashboard',collapsed:{}}};

const initialProjectTypes=['rolki w plenerze','rolki w studio','program kulinarny','reklama','event','inne'].map((name,i)=>({name,icon:['location','studio','food','video','users','folder'][i]}));
let state;
state=clone(defaults);
state.projectTypes??=initialProjectTypes;
state.targets??={margin:null,retention:null};
if(!state.priceList) state.priceList=defaultPriceList;
if(!state.ui) state.ui={selectedProject:state.projects[0]?.id,tab:'info',collapsed:{}};

const $ = s => document.querySelector(s);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const num = v => Number(String(v ?? '').replace(/zł|PLN/gi,'').replace(/\s/g,'').replace(',','.'))||0;
const cur = v => PLN.format(num(v));
function save(){
  window.bbfCloud?.queueSave();
  if(!window.bbfCloud)$('#saveState').textContent='Łączenie…';
}
function dirty(label){ state.projects.forEach(ensureStructure); recordOperation(label); save(); }
function project(){return state.projects.find(p=>p.id===state.ui.selectedProject)||state.projects[0]}

function calcActualCost(row,p=project()){
  const t=(row.actualType||'').toLowerCase();
  const v=num(row.actualNet);
  if(t==='umowa o dzieło') return v + Math.round(v/0.94*0.06);
  if(t==='umowa zlecenie') return v/0.7223436;
  if(['umowa zlecenie - student','faktura','paragon','różne'].includes(t)) return v;
  if(t==='prowizja') return v;
  if(t==='administracja'){
    const contracts=p.rows.filter(r=>['umowa o dzieło','umowa zlecenie','umowa zlecenie - student'].includes((r.actualType||'').toLowerCase())).length;
    return contracts*50;
  }
  if(t==='bbf'){
    const item=priceFor(row);
    return num(item?.cost)*num(row.qty);
  }
  return 0;
}
function calcBBFValue(row){
  const t=(row.actualType||'').toLowerCase();

  if(t==='bbf'){
    const item=priceFor(row);
    return num(item?.retention)*num(row.qty);
  }
  return 0;
}
function rowMetrics(r,p=project()){
  const sales=num(r.unit)*num(r.qty);
  const planned=num(r.plannedUnit)*num(r.qty);
  const actual=calcActualCost(r,p);
  const internal=calcBBFValue(r);
  const overhead=sales*num(p.overheadRate);
  const retention=sales-actual;
  const margin=sales-actual-internal-overhead;
  return {sales,planned,actual,internal,overhead,retention,margin,deviation:planned-actual};
}
function metrics(p=project()){
  const rows=p.rows.filter(r=>r.kind==='item');
  return rows.reduce((a,r)=>{
    const m=rowMetrics(r,p); Object.keys(m).forEach(k=>a[k]=(a[k]||0)+m[k]); return a;
  },{sales:0,planned:0,actual:0,internal:0,overhead:0,retention:0,margin:0,deviation:0});
}

const statuses=['wycenione','przyszłe','trwające','zakończone'];
function renderSidebar(){
  const box=$('#projectGroups'); box.innerHTML='';
  statuses.forEach(st=>{
    const ps=state.projects.filter(p=>p.status===st);
    const collapsed=state.ui.collapsed[st];
    const div=document.createElement('div'); div.className='group'+(collapsed?' collapsed':'');
    div.innerHTML=`<div class="group-head"><span>${st} · ${ps.length}</span><button data-collapse="${st}">${collapsed?'›':'⌄'}</button></div>
      <div class="project-list">${ps.map(p=>`<button class="project-row ${p.id===state.ui.selectedProject?'active':''}" data-project="${p.id}">${esc(p.title)}</button>`).join('')}</div>`;
    box.appendChild(div);
  });
}
function render(){
  state.projects.forEach(ensureStructure);
  renderSidebar();
  document.querySelector('.main').classList.toggle('sheet-mode',['estimate','settlement'].includes(state.ui.tab));
  document.querySelector('[data-action="dashboard"]').classList.toggle('active',state.ui.tab==='dashboard');
  const general=['dashboard','settings'].includes(state.ui.tab);
  $('#tabs').hidden=general;
  $('#duplicateProject').hidden=general||!project();
  $('#exportMenuBtn').hidden=general||!project();
  if(state.ui.tab==='dashboard'){renderDashboard();return}
  if(state.ui.tab==='settings'){renderSettings();return}
  const p=project();
  if(!p){state.ui.tab='dashboard';render();return}
  $('#projectTitleHeader').textContent=p.title;
  $('#projectStatusLabel').textContent=p.status.toUpperCase();
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.ui.tab));
  ({info:renderInfo,estimate:renderEstimate,settlement:renderSettlement,crew:renderCrew}[state.ui.tab]||renderInfo)();
}

function kpi(label,value,sub='',cls=''){return `<div class="kpi ${cls}"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`}
function renderInfo(){
  const p=project(),m=metrics(p);
  $('#view').innerHTML=`<div class="page">
    <div class="section-title"><div><h2>◉ Informacje o projekcie</h2><p>Dane organizacyjne i najważniejsze KPI.</p></div></div>
    <div class="grid-2">
      <div class="card">
        <div class="form-grid">
          <div class="field span-2"><label>▤ Tytuł projektu</label><input data-pfield="title" value="${esc(p.title)}"></div>
          <div class="field"><label>♧ Klient</label><div style="display:flex;gap:6px"><select data-pfield="client">${state.clients.map(c=>`<option ${c===p.client?'selected':''}>${esc(c)}</option>`).join('')}</select><button class="mini" id="addClient">+</button></div></div>
          <div class="field"><label>◉ Status</label><select data-pfield="status">${statuses.map(x=>`<option ${x===p.status?'selected':''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label>◇ Typ</label><select data-pfield="type">${['rolki w plenerze','rolki w studio','program kulinarny','reklama','event','inne'].map(x=>`<option ${x===p.type?'selected':''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label>◈ Overhead</label><input data-pfield="overheadRate" type="number" step=".01" value="${p.overheadRate}"></div>
        </div>
      </div>
      <div class="card">
        <div class="form-grid">
          ${dateField('✎ Umowa','contract',p)}
          ${dateField('◷ Plan zdjęciowy','shoot',p)}
          ${dateField('▦ Postprodukcja','post',p)}
          ${dateField('◈ Płatność dla ekipy','crewPayment',p)}
          ${dateField('◈ Płatność klienta','clientPayment',p)}
        </div>
      </div>
    </div>
    <div class="kpis">
      ${kpi('Budżet',cur(m.sales),'100% przychodu')}
      ${kpi('Przewidywany koszt',cur(m.planned),m.sales?pct(m.planned/m.sales):'—')}
      ${kpi('Koszty zewnętrzne',cur(m.actual),m.sales?pct(m.actual/m.sales):'—')}
      ${kpi('Wartość zasobów BBF',cur(m.internal),'wartość wewnętrzna')}
      ${kpi('Overhead',cur(m.overhead),m.sales?pct(m.overhead/m.sales):'—')}
      ${kpi('Retencja BBF',cur(m.retention),m.sales?pct(m.retention/m.sales):'—','positive')}
      ${kpi('Marża',cur(m.margin),m.sales?pct(m.margin/m.sales):'—',m.margin<0?'negative':'positive')}
      ${kpi('Odchylenie plan / actual',cur(m.deviation),m.planned?pct(m.deviation/m.planned):'—',m.deviation<0?'negative':'')}
    </div>
    <div class="summary-row">
      <span class="chip">Koszty: ${m.sales?pct(m.actual/m.sales):'—'}</span>
      <span class="chip">Zasoby BBF: ${m.sales?pct(m.internal/m.sales):'—'}</span>
      <span class="chip">Overhead: ${m.sales?pct(m.overhead/m.sales):'—'}</span>
      <span class="chip">Retencja: ${m.sales?pct(m.retention/m.sales):'—'}</span>
      <span class="chip">Marża: ${m.sales?pct(m.margin/m.sales):'—'}</span>
    </div>
  </div>`;
}
function dateField(label,key,p){return `<div class="field"><label>${label}</label><input type="date" data-datefield="${key}" value="${p.dates?.[key]||''}"></div>`}

function summaryKpis(p){
 const m=metrics(p);
 return `<div class="kpis sheet-kpis">
 ${kpi('◫ Budżet',cur(m.sales))}${kpi('◷ Przewidywany koszt',cur(m.planned))}
 ${kpi('↗ Koszty zewnętrzne',cur(m.actual))}${kpi('◇ Zasoby BBF',cur(m.internal))}
 ${kpi('◉ Overhead',cur(m.overhead))}${kpi('↳ Retencja',cur(m.retention),m.sales?pct(m.retention/m.sales):'—','positive')}
 ${kpi('↗ Marża',cur(m.margin),m.sales?pct(m.margin/m.sales):'—',m.margin<0?'negative':'positive')}
 ${kpi('± Odchylenie',cur(m.deviation),'plan − koszt zewnętrzny',m.deviation<0?'negative':'')}
 </div>`;
}
function sheetPage(mode){
 const p=project();
 $('#view').innerHTML=`<div class="page sheet-page"><div id="sheetSummary">${summaryKpis(p)}</div>
 <div class="row-actions no-print"><strong>${mode==='estimate'?'▦ Kosztorys':'◈ Rozliczenie'}</strong>
 ${mode==='estimate'?'<button data-addkind="item">+ Wiersz</button><button data-addkind="subcategory">+ Podkategoria</button><button data-addkind="category">+ Kategoria</button>':''}
 </div><div class="table-shell" tabindex="-1">${mode==='estimate'?estimateTable(p):settlementTable(p)}</div></div>`;
}
function renderEstimate(){sheetPage('estimate')}
function renderSettlement(){sheetPage('settlement')}
function groupCells(r,meta,colspan,editable){
 return `<td class="drag"><button class="row-menu" data-rowmenu="${r.id}" aria-label="Menu ${esc(r.name)}" draggable="${editable}">⋮⋮</button></td><td class="lp">${meta.lp}</td><td colspan="${colspan}"><div class="group-label"><button class="group-icon" data-icon="${r.id}" aria-label="Zmień ikonę ${esc(r.name)}">${esc(r.icon||'◇')}</button>${editable?`<input data-cell="name" data-rowid="${r.id}" value="${esc(r.name)}" ${r.fixed?'readonly':''}>`:`<span>${esc(r.name)}</span>`}${meta.protected?'<span class="lock" title="Stała sekcja">♧</span>':''}</div></td>`;
}
function estimateTable(p){
 const meta=hierarchy(p);
 const rows=p.rows.map(r=>{
  const h=meta.get(r.id),m=rowMetrics(r,p);
  if(r.kind!=='item')return `<tr class="${r.kind}" style="--row-color:${h.color}" data-row="${r.id}">${groupCells(r,h,5,true)}</tr>`;
  return `<tr data-row="${r.id}" style="--row-color:${h.color}"><td class="drag"><button draggable="true" class="row-menu" data-rowmenu="${r.id}" aria-label="Menu ${esc(r.name)}">⋮⋮</button></td><td class="lp">${h.lp}</td>
  <td class="name">${cell(r,'name')}</td><td class="num">${cell(r,'unit',true)}</td><td class="num">${cell(r,'qty',true)}</td>
  <td class="num computed" data-metric="sales">${cur(m.sales)}</td><td class="num">${cell(r,'plannedUnit',true)}</td></tr>`;
 }).join('');
 return `<table class="sheet" id="estimateSheet"><thead><tr><th></th><th># Lp.</th><th>▤ Opis kosztów</th><th>◈ Kwota netto</th><th>× Ilość</th><th>Σ Suma</th><th>◷ Przewidywany koszt / szt.</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="5">SUMA KOSZTORYSU</td><td data-total-sales>${cur(metrics(p).sales)}</td><td></td></tr></tfoot></table>`;
}
const types=['','umowa o dzieło','umowa zlecenie','umowa zlecenie - student','faktura','paragon','różne','BBF','prowizja','administracja'];
const typeIcons={'umowa o dzieło':'✎','umowa zlecenie':'✎','umowa zlecenie - student':'▱',faktura:'▤',paragon:'▥',różne:'◇',BBF:'◈',prowizja:'%',administracja:'▦'};
function cell(r,key,numeric=false,readonly=false){return `<input ${numeric?'class="currency" inputmode="decimal"':''} data-cell="${key}" data-rowid="${r.id}" aria-label="${esc(r.name)} — ${key}" value="${esc(numeric?num(r[key]):r[key])}" ${readonly?'readonly aria-readonly="true"':''}>`}
function settlementTable(p){
 const meta=hierarchy(p);
 const rows=p.rows.map(r=>{
 const h=meta.get(r.id),m=rowMetrics(r,p);
 if(r.kind!=='item')return `<tr class="${r.kind}" style="--row-color:${h.color}" data-row="${r.id}">${groupCells(r,h,13,false)}</tr>`;
 return `<tr data-row="${r.id}" style="--row-color:${h.color}"><td class="drag"><button class="row-menu" data-rowmenu="${r.id}" aria-label="Menu ${esc(r.name)}">⋮</button></td><td class="lp">${h.lp}</td><td class="name">${cell(r,'name',false,true)}</td>
 <td class="num computed">${num(r.qty)}</td><td class="num computed">${cur(r.unit)}</td><td class="num computed">${cur(m.sales)}</td><td class="num computed">${cur(r.plannedUnit)}</td><td class="num computed">${cur(m.planned)}</td>
 <td class="type"><button class="type-picker" data-cell="actualType" data-rowid="${r.id}" aria-haspopup="menu">${esc(typeIcons[r.actualType]||'◇')} ${esc(r.actualType==='BBF'?'BBF/'+(priceFor(r)?.name||'Wybierz'):r.actualType||'Wybierz typ')} ▾</button></td>
 <td class="num">${cell(r,'actualNet',true,r.actualType==='BBF'||r.actualType==='administracja')}</td><td class="num computed" data-metric="actual" aria-readonly="true">${cur(m.actual)}</td><td class="num computed" data-metric="internal" aria-readonly="true">${cur(m.internal)}</td>
 <td class="num computed" data-metric="overhead">${cur(m.overhead)}</td><td class="num computed" data-metric="margin">${cur(m.margin)}</td><td class="num computed" data-metric="retention">${cur(m.retention)}</td></tr>`;
 }).join('');
 return `<table class="sheet" id="settlementSheet"><thead><tr><th></th><th># Lp.</th><th>▤ Koszt</th><th>× Ilość</th><th>◈ Kosztorys / szt.</th><th>Σ Kosztorys</th><th>◷ Przewidywany koszt / szt.</th><th>Σ Przewidywany koszt</th><th>◇ Rozliczenie</th><th>◈ Stawka netto</th><th>↗ Koszt rzeczywisty</th><th>◈ Zasób BBF</th><th>◉ Overhead</th><th>↗ Marża</th><th>↳ Retencja</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function renderCrew(){
 const p=project(),meta=hierarchy(p),roles=p.rows.filter(r=>r.kind==='item'&&meta.get(r.id).crew);
 $('#view').innerHTML=`<div class="page"><div class="section-title"><h2>♧ Ekipa i obsada</h2><button class="primary" id="addCrew">+ Dodaj osobę</button></div><div class="crew-grid"><div class="card"><h3>Role w projekcie</h3>
 ${roles.map(r=>{const person=state.crew.find(c=>c.id===r.personId);return `<div class="role-assignment"><div><span class="eyebrow">${meta.get(r.id).crew==='cast'?'OBSADA':'EKIPA'} · ${meta.get(r.id).lp}</span><strong>${esc(r.name)}</strong></div><input list="crewOptions" data-assignment="${r.id}" value="${esc(person?.name||'')}" placeholder="Wybierz lub wyszukaj osobę" aria-label="Osoba: ${esc(r.name)}"><small>${person?esc([person.email,person.phone].filter(Boolean).join(' · ')):''}</small></div>`}).join('')||'<div class="empty">Dodaj role w stałych sekcjach kosztorysu.</div>'}
 <datalist id="crewOptions">${state.crew.map(c=>`<option value="${esc(c.name)}">${esc(c.role)}</option>`).join('')}</datalist></div><div class="card"><h3>Baza osób</h3>${state.crew.map(personCard).join('')}</div></div></div>`;
}

function personCard(p){return `<div class="person"><div class="person-main"><div class="avatar">${initials(p.name)}</div><div class="person-meta"><strong>${esc(p.name)}</strong><span>${esc(p.role||'')} · ${esc(p.defaultType||'')}</span></div></div><div class="person-actions"><button class="mini" data-editcrew="${p.id}">Edytuj</button></div></div>`}
function initials(n){return String(n||'').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}
function projectCrew(){
 const names=new Set();
 project().rows.forEach(r=>{
   if((r.actualType||'').toLowerCase()==='bbf'){
     const it=state.priceList.find(x=>x.name===r.bbfItem); if(it?.person) names.add(it.person)
   }
 });
 return [...names].map(n=>state.crew.find(c=>c.name===n)||{name:n,role:'BBF'});
}

function renderSettings(){
 $('#projectTitleHeader').textContent='Ustawienia';$('#projectStatusLabel').textContent='PROGRAM';
 $('#view').innerHTML=`<div class="page"><div class="section-title"><h2>⚙ Cennik BBF</h2><button class="primary" id="addPrice">+ Pozycja cennika</button></div>
 <div class="table-shell"><table class="sheet"><thead><tr><th>◇ Nazwa</th><th>↗ Koszt zewnętrzny / szt.</th><th>◈ Wartość zasobu / szt.</th><th>♧ Osoba</th><th>◷ Godziny</th><th></th></tr></thead><tbody>
 ${state.priceList.map(x=>`<tr><td class="name"><input data-price="${x.id}" data-pkey="name" value="${esc(x.name)}"></td>${['cost','retention'].map(k=>`<td class="num"><input inputmode="decimal" data-price="${x.id}" data-pkey="${k}" value="${num(x[k])}"></td>`).join('')}<td><input data-price="${x.id}" data-pkey="person" value="${esc(x.person)}"></td><td class="num"><input inputmode="decimal" data-price="${x.id}" data-pkey="hours" value="${num(x.hours)}"></td><td><button class="mini" data-delprice="${x.id}" ${priceUsed(x.id)?'disabled title="Pozycja używana w projektach"':''}>Usuń</button></td></tr>`).join('')}</tbody></table></div></div>`;
}
function addRow(kind,afterId=null,before=false){
 const p=project();ensureStructure(p);
 let i=p.rows.findIndex(r=>r.id===afterId);
 if(i<0||p.rows[i]?.system)i=p.rows.length-2;
 let h=hierarchy(p).get(p.rows[i]?.id);
 if(kind==='subcategory'&&h?.sub){i=blockEnd(p.rows,p.rows.findIndex(r=>r.id===h.sub))-1}
 if(kind==='category'&&h?.cat){i=blockEnd(p.rows,p.rows.findIndex(r=>r.id===h.cat))-1}
 if(kind==='item'&&p.rows[i]?.kind==='category'){
   const sub={id:uid(),kind:'subcategory',name:'Nowa podkategoria',icon:'◇'};p.rows.splice(i+1,0,sub);i++;
 }
 if(before&&kind==='item'&&p.rows[i]?.kind!=='item'){i--;if(i<0){p.rows.unshift({id:uid(),kind:'category',name:'Koszty projektu',icon:'▦'},{id:uid(),kind:'subcategory',name:'Pozostałe koszty',icon:'◇'});i=1}before=false}
 const r={id:uid(),kind,name:kind==='category'?'Nowa kategoria':kind==='subcategory'?'Nowa podkategoria':'Nowa pozycja',icon:kind==='category'?'▦':'◇',unit:0,qty:kind==='item'?1:0,plannedUnit:0,actualType:'',bbfItem:'',actualNet:0};
 p.rows.splice(before&&p.rows[i]?.kind==='item'?i:i+1,0,r);
 ensureStructure(p);revealRow(p,r.id);dirty(kind==='item'?'Dodano pozycję':kind==='category'?'Dodano kategorię':'Dodano podkategorię');render();focusCell(r.id,'name');
}

function showModal(html){$('#modal').innerHTML=html;$('#modalBackdrop').classList.add('open')}
function closeModal(){$('#modalBackdrop').classList.remove('open')}

document.addEventListener('click',e=>{
 const t=e.target.closest('button')||e.target;
 if(t.id==='exportMenuBtn'){$('#exportMenu').classList.toggle('open');return}
 if(!t.closest('#exportMenu'))$('#exportMenu').classList.remove('open');
 if(t.dataset.action==='dashboard'){state.ui.tab='dashboard';save();render();closeSidebar()}
 if(t.dataset.project){state.ui.selectedProject=t.dataset.project;if(!['info','estimate','settlement','crew'].includes(state.ui.tab))state.ui.tab=state.ui.projectTab||'info';save();render();closeSidebar()}
 if(t.dataset.collapse){state.ui.collapsed[t.dataset.collapse]=!state.ui.collapsed[t.dataset.collapse];save();renderSidebar()}
 if(t.dataset.tab){state.ui.tab=t.dataset.tab;save();render()}
 if(t.dataset.addkind)addRow(t.dataset.addkind,state.ui.activeRow);
 if(t.id==='newProject'){newProject();closeSidebar()}
 if(t.id==='duplicateProject'&&project()){const p=clone(project());p.id=uid();p.rows.forEach(r=>r.id=uid());p.title+=' — kopia';p.createdAt=new Date().toISOString();state.projects.push(p);state.ui.selectedProject=p.id;dirty();render()}
 if(t.id==='settingsBtn'){state.ui.tab='settings';save();render();closeSidebar()}
 if(t.id==='addClient')addClientModal();
 if(t.id==='addCrew')crewModal();
 if(t.dataset.editcrew)crewModal(t.dataset.editcrew);
 if(t.id==='addPrice'){state.priceList.push({id:uid(),name:'Nowa pozycja',cost:0,retention:0,person:'',hours:0});dirty();renderSettings()}
 if(t.dataset.delprice&&!priceUsed(t.dataset.delprice)){state.priceList=state.priceList.filter(x=>x.id!==t.dataset.delprice);dirty();renderSettings()}
 if(['exportPdf','exportXlsx','exportJson'].includes(t.id))$('#exportMenu').classList.remove('open');
 if(t.id==='exportPdf')printEstimate();
 if(t.id==='exportXlsx')exportXlsx();
 if(t.id==='exportJson')download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'BBF-projects-backup.json');
 if(t.id==='openSidebar'){$('#sidebar').classList.add('open');$('#overlay').classList.add('open')}
 if(t.id==='closeSidebar'||t.id==='overlay')closeSidebar();
 if(t.id==='modalBackdrop')closeModal();
 if(t.dataset.rowmenu){openContext(t.dataset.rowmenu,t.getBoundingClientRect());return}
 if(t.dataset.context){handleContext(t.dataset.context);$('#contextMenu').classList.remove('open')}
 if(!t.closest('#contextMenu'))$('#contextMenu').classList.remove('open');
 if(t.dataset.icon)iconModal(t.dataset.icon);
 if(t.classList.contains('type-picker')){openTypePicker(t);return}
 if(t.dataset.chooseType!==undefined){chooseType(t.dataset.chooseType);return}
 if(t.dataset.choosePrice){chooseType('BBF',t.dataset.choosePrice);return}
 if(!t.closest('#typeMenu'))$('#typeMenu')?.remove();
});
function closeSidebar(){$('#sidebar').classList.remove('open');$('#overlay').classList.remove('open')}
function editable(r,key){return r&&!r.system&&!(r.fixed&&key==='name')&&(['estimate'].includes(state.ui.tab)?['name','unit','qty','plannedUnit'].includes(key):state.ui.tab==='settlement'&&key==='actualNet'&&!['BBF','administracja'].includes(r.actualType))}
document.addEventListener('input',e=>{
 const t=e.target,p=project();
 if(t.dataset.pfield){p[t.dataset.pfield]=['overheadRate','marginRate'].includes(t.dataset.pfield)?num(t.value):t.value;dirty();if(t.dataset.pfield==='title')$('#projectTitleHeader').textContent=t.value}
 if(t.dataset.datefield){p.dates??={};p.dates[t.dataset.datefield]=t.value;dirty()}
 if(t.dataset.cell){const r=p.rows.find(x=>x.id===t.dataset.rowid);if(!editable(r,t.dataset.cell))return;r[t.dataset.cell]=['unit','qty','plannedUnit','actualNet'].includes(t.dataset.cell)?num(t.value):t.value;dirty();refreshNumbers()}
 if(t.dataset.price){const x=state.priceList.find(y=>y.id===t.dataset.price);x[t.dataset.pkey]=['cost','retention','hours'].includes(t.dataset.pkey)?Math.max(0,num(t.value)):t.value;state.projects.forEach(p=>p.rows.filter(r=>r.bbfPriceId===x.id).forEach(r=>r.bbfItem=x.name));dirty()}
});
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.dataset.pfield||t.dataset.datefield)render();
 if(t.dataset.assignment){
 const r=project().rows.find(x=>x.id===t.dataset.assignment),person=state.crew.find(c=>c.name===t.value);
 if(t.value&&!person){t.setCustomValidity('Dodaj tę osobę do bazy lub wybierz z listy.');t.reportValidity();return}t.setCustomValidity('');
 r.personId=person?.id||'';
 if(person){r.actualType=person.defaultType;r.actualNet=num(person.defaultRate);const price=state.priceList.find(x=>x.person===person.name);r.bbfPriceId=person.defaultType==='BBF'?price?.id||'':'';r.bbfItem=person.defaultType==='BBF'?price?.name||'':'';if(person.defaultType==='BBF')r.actualNet=0}
 dirty();renderCrew();
 }
});
document.addEventListener('focusin',e=>{
 const t=e.target;if(!t.dataset.cell)return;state.ui.activeRow=t.dataset.rowid;
 if(t.tagName==='INPUT'&&!t.readOnly)t.select();
});
function focusCell(id,key){const el=document.querySelector(`[data-rowid="${id}"][data-cell="${key}"]`);el?.focus();el?.select?.()}
function navigateCell(t,vertical,direction){
 const row=t.closest('tr'),sheet=t.closest('table');
 const allowed=el=>!el.readOnly&&!el.disabled;
 if(vertical){
 const rows=[...sheet.tBodies[0].rows];let i=rows.indexOf(row)+direction;
 while(i>=0&&i<rows.length){const next=rows[i].querySelector(`[data-cell="${t.dataset.cell}"]`);if(next&&!rows[i].hidden&&allowed(next)){next.focus();return}i+=direction}
 }else{const cells=[...row.querySelectorAll('[data-cell]')].filter(allowed),i=cells.indexOf(t);cells[i+direction]?.focus()}
}
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){$('#typeMenu')?.remove();$('#contextMenu').classList.remove('open');closeModal();return}
 const t=e.target;if(!t.dataset.cell||!t.closest('table')||t.readOnly)return;
 if(e.key==='Enter'){
 e.preventDefault();
 if(state.ui.tab==='estimate'&&(e.ctrlKey||e.metaKey))addRow('subcategory',t.dataset.rowid);
 else if(state.ui.tab==='estimate'&&e.shiftKey)addRow('item',t.dataset.rowid);
 else navigateCell(t,true,1);
 }else if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key)){
 e.preventDefault();navigateCell(t,['ArrowDown','ArrowUp'].includes(e.key),['ArrowDown','ArrowRight'].includes(e.key)?1:-1);
 }
});
document.addEventListener('contextmenu',e=>{const tr=e.target.closest('.sheet-mode tbody tr');if(!tr)return;e.preventDefault();openContext(tr.dataset.row,{left:e.clientX,bottom:e.clientY})});
let dragged=null;
function handleContext(a){
 const id=state.ui.contextRow,p=project(),i=p.rows.findIndex(r=>r.id===id),r=p.rows[i];if(!r||r.system)return;
 if(a==='moveTo'){moveModal(id);return}
 if(a==='moveUp'||a==='moveDown'){moveSibling(id,a==='moveUp'?-1:1);dirty();render();return}
 if(state.ui.tab!=='estimate')return;
 if(a==='addAbove')addRow('item',id,true);
 if(a==='addBelow')addRow('item',id);
 if(a==='addSubcategory')addRow('subcategory',id);
 if(a==='addCategory')addRow('category',id);
 if(a==='duplicate'&&!hierarchy(p).get(id).protected){const block=clone(p.rows.slice(i,blockEnd(p.rows,i)));block.forEach(x=>{x.id=uid();delete x.fixed});p.rows.splice(blockEnd(p.rows,i),0,...block);dirty();render()}
 if(a==='delete')deleteRow(id)
}

function newProject(){
 const p={id:uid(),title:'Nowy projekt',client:state.clients[0]||'',status:'wycenione',type:'reklama',dates:{},marginRate:.1,overheadRate:.1,rows:[],notes:'',createdAt:new Date().toISOString()};
 state.projects.push(p);state.ui.selectedProject=p.id;state.ui.tab='info';dirty();render();
}
function addClientModal(){
 showModal(`<h3>Nowy klient</h3><div class="field"><label>Nazwa klienta</label><input id="newClientName" autofocus></div><div class="modal-actions"><button class="ghost" onclick="closeModal()">Anuluj</button><button class="primary" id="saveClient">Dodaj</button></div>`);
 setTimeout(()=>$('#newClientName').focus(),20);
 $('#saveClient').onclick=()=>{const n=$('#newClientName').value.trim();if(n){state.clients.push(n);project().client=n;dirty();closeModal();render()}};
}
function crewModal(id=null){
 const existing=state.crew.find(x=>x.id===id)||{id:uid(),name:'',role:'',email:'',phone:'',defaultType:'faktura',defaultRate:0};
 showModal(`<h3>${id?'Edytuj osobę':'Dodaj osobę'}</h3><div class="form-grid">
  <div class="field span-2"><label>Imię i nazwisko</label><input id="cmName" value="${esc(existing.name)}"></div>
  <div class="field"><label>Rola</label><input id="cmRole" value="${esc(existing.role)}"></div>
  <div class="field"><label>Domyślna forma</label><select id="cmType">${types.map(x=>`<option value="${esc(x)}" ${x===existing.defaultType?'selected':''}>${esc(typeIcons[x]||'◇')} ${esc(x||'Bez typu')}</option>`).join('')}</select></div>
  <div class="field"><label>E-mail</label><input id="cmEmail" value="${esc(existing.email)}"></div>
  <div class="field"><label>Telefon</label><input id="cmPhone" value="${esc(existing.phone)}"></div>
  <div class="field"><label>Domyślna stawka netto</label><input id="cmRate" type="number" value="${num(existing.defaultRate)}"></div>
 </div><div class="modal-actions"><button class="ghost" onclick="closeModal()">Anuluj</button><button class="primary" id="saveCrew">Zapisz</button></div>`);
 $('#saveCrew').onclick=()=>{Object.assign(existing,{name:$('#cmName').value,role:$('#cmRole').value,email:$('#cmEmail').value,phone:$('#cmPhone').value,defaultType:$('#cmType').value,defaultRate:num($('#cmRate').value)});if(!id)state.crew.push(existing);dirty();closeModal();renderCrew()};
}

function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function xmlEsc(s){return String(s??'').replace(/[<>&'"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]))}
function colName(n){let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s}
function xlsxSheetXml(data){
 let rows=data.map((row,ri)=>`<row r="${ri+1}">${row.map((v,ci)=>{
   const ref=colName(ci+1)+(ri+1);
   if(typeof v==='number')return `<c r="${ref}"><v>${v}</v></c>`;
   return `<c r="${ref}" t="inlineStr"><is><t>${xmlEsc(v)}</t></is></c>`;
 }).join('')}</row>`).join('');
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
}
function crc32(bytes){
 let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0;
}
function u16(n){return [n&255,(n>>>8)&255]} function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
function zipStore(files){
 const enc=new TextEncoder(),parts=[],central=[];let offset=0;
 for(const f of files){
  const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
  const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);
  parts.push(local,data);
  const cent=new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]);
  central.push(cent);offset+=local.length+data.length;
 }
 const centralSize=central.reduce((a,b)=>a+b.length,0),centralOffset=offset;
 const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralSize),...u32(centralOffset),...u16(0)]);
 return new Blob([...parts,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function exportXlsx(){
 const p=project(),data=[['BIG BEAR FILM'],[p.client],[p.title],[],['Lp.','OPIS KOSZTÓW','KWOTA NETTO','ILOŚĆ','SUMA','PLANOWANY KOSZT / SZT.','PRZEWIDYWANY KOSZT — SUMA']];
 const meta=hierarchy(p);
 p.rows.forEach(r=>{
  if(r.kind==='category'||r.kind==='subcategory')data.push(['',r.name,'','','','','']);
  else{data.push([meta.get(r.id).lp,r.system?'Marża domu produkcyjnego ('+pct(p.marginRate)+')':r.name,num(r.unit),num(r.qty),num(r.unit)*num(r.qty),num(r.plannedUnit),num(r.plannedUnit)*num(r.qty)])}
 });
 const m=metrics(p);data.push([],['','','','SUMA',m.sales,'',m.planned]);
 const files=[
  {name:'[Content_Types].xml',data:`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`},
  {name:'_rels/.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
  {name:'xl/workbook.xml',data:`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="kosztorys" sheetId="1" r:id="rId1"/></sheets></workbook>`},
  {name:'xl/_rels/workbook.xml.rels',data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`},
  {name:'xl/worksheets/sheet1.xml',data:xlsxSheetXml(data)}
 ];
 download(zipStore(files),`${p.title.replace(/[^\wąćęłńóśźż -]/gi,'_')}-kosztorys.xlsx`);
}


// Stable price references keep existing projects linked when a price is renamed.
function priceFor(r){return state.priceList.find(x=>r.bbfPriceId?x.id===r.bbfPriceId:x.name===r.bbfItem)}
function priceUsed(id){return state.projects.some(p=>p.rows.some(r=>r.bbfPriceId===id))}
function blockEnd(rows,start){
 if(start<0||start>=rows.length)return start;
 const kind=rows[start].kind;if(kind==='item')return start+1;
 let end=start+1;while(end<rows.length&&!rows[end].system&&rows[end].kind!=='category'&&(kind==='category'||rows[end].kind!=='subcategory'))end++;
 return end;
}
function ensureStructure(p){
 p.rows??=[];p.dates??={};
 // Preserve the original crew/cast subsections and their parent categories.
 let cat=null;
 for(const r of p.rows){
 if(r.kind==='category')cat=r;
 if(r.kind==='subcategory'&&!r.fixed){if(/wynagrodzeni.*(aktor|statyst|obsad)/i.test(r.name))r.fixed='cast';else if(/wynagrodzeni.*ekip/i.test(r.name))r.fixed='crew'}
 if(r.fixed&&cat){cat.protected=true;cat.name=r.fixed==='crew'?'PRODUKCJA, PRZYGOTOWANIE, ZDJĘCIA':'PRACE WSTĘPNE';}
 }
 for(const [fixed,name] of [['cast','Wynagrodzenie obsady'],['crew','Wynagrodzenie ekipy filmowej']]){
 if(!p.rows.some(r=>r.fixed===fixed))p.rows.push({id:uid(),kind:'category',name:fixed==='cast'?'PRACE WSTĘPNE':'PRODUKCJA, PRZYGOTOWANIE, ZDJĘCIA',protected:true,icon:fixed==='cast'?'☆':'♧'},{id:uid(),kind:'subcategory',name,fixed,icon:fixed==='cast'?'☆':'♧'});
 }
 // Repair legacy orphan items, without moving or discarding any data.
 let hasCat=false,hasSub=false;
 for(let i=0;i<p.rows.length;i++){
 const r=p.rows[i];
 if(r.kind==='category'){hasCat=true;hasSub=false}
 else if(r.kind==='subcategory'){if(!hasCat){p.rows.splice(i,0,{id:uid(),kind:'category',name:'Koszty projektu',icon:'▦'});i++;hasCat=true}hasSub=true}
 else {if(!hasCat){p.rows.splice(i,0,{id:uid(),kind:'category',name:'Koszty projektu',icon:'▦'});i++;hasCat=true}if(!hasSub){p.rows.splice(i,0,{id:uid(),kind:'subcategory',name:'Pozostałe koszty',icon:'◇'});i++;hasSub=true}}
 }
}
function hierarchy(p){
 const map=new Map();let c=0,s=0,n=0,cat=null,sub=null,crew=null,si=-1;
 for(const r of p.rows){
 if(r.kind==='category'){c++;s=0;n=0;cat=r.id;sub=null;crew=null}
 if(r.kind==='subcategory'){s++;n=0;sub=r.id;crew=r.fixed||null;si++}
 if(r.kind==='item')n++;
 const hue=(si*47+150)%360;
 map.set(r.id,{lp:r.kind==='category'?`${c}`:r.kind==='subcategory'?`${c}.${s}`:`${c}.${s}.${n}`,cat,sub,crew,color:r.kind==='category'?'#eeefed':`hsl(${hue} 38% ${r.kind==='subcategory'?93:98}%)`,protected:!!(r.fixed||(r.kind==='category'&&p.rows.slice(p.rows.indexOf(r),blockEnd(p.rows,p.rows.indexOf(r))).some(x=>x.fixed)))});
 }
 return map;
}
function moveBlock(id,targetId,after=false){
 const p=project(),rows=p.rows,from=rows.findIndex(x=>x.id===id),to=rows.findIndex(x=>x.id===targetId);
 if(from<0||to<0||from===to)return false;
 const source=rows[from],target=rows[to],meta=hierarchy(p),end=blockEnd(rows,from);
 if(source.system||target.system||source.kind!==target.kind||to>=from&&to<end)return false;
 if(source.fixed&&meta.get(id).cat!==meta.get(targetId).cat)return false;
 const insertion=after?blockEnd(rows,to):to,block=rows.splice(from,end-from);
 rows.splice(insertion>from?insertion-block.length:insertion,0,...block);return true;
}
function moveSibling(id,direction){
 const p=project(),meta=hierarchy(p),r=p.rows.find(x=>x.id===id);if(!r)return;
 const h=meta.get(id),siblings=p.rows.filter(x=>x.kind===r.kind&&(r.kind==='category'||(r.kind==='subcategory'?meta.get(x.id).cat===h.cat:meta.get(x.id).sub===h.sub)));
 const target=siblings[siblings.indexOf(r)+direction];if(target)moveBlock(id,target.id,direction>0);
}
function refreshNumbers(){
 const p=project();for(const tr of document.querySelectorAll('.sheet tbody tr[data-row]')){const r=p.rows.find(x=>x.id===tr.dataset.row);if(!r)continue;const m=rowMetrics(r,p);tr.querySelectorAll('[data-metric]').forEach(td=>td.textContent=cur(m[td.dataset.metric]))}
 if($('#sheetSummary'))$('#sheetSummary').innerHTML=summaryKpis(p);
 document.querySelectorAll('[data-total-sales]').forEach(el=>el.textContent=cur(metrics(p).sales));
}
function openContext(id,rect){
 const r=project().rows.find(x=>x.id===id);if(!r||r.system)return;state.ui.contextRow=id;
 const locked=hierarchy(project()).get(id).protected,estimate=state.ui.tab==='estimate',m=$('#contextMenu');
 m.innerHTML=`${estimate?'<button data-context="addAbove">↑ Wiersz nad</button><button data-context="addBelow">↓ Wiersz pod</button><button data-context="addSubcategory">◇ Nowa podkategoria</button><button data-context="addCategory">▦ Nowa kategoria</button><hr>':''}
 ${estimate?'<button data-context="moveUp">↑ Przenieś blok wyżej</button><button data-context="moveDown">↓ Przenieś blok niżej</button><button data-context="moveTo">↗ Przenieś do…</button>':''}
 ${r.kind!=='item'?`<button data-icon="${id}">◇ Zmień ikonę</button>`:''}
 ${estimate?`<button data-context="duplicate" ${locked?'disabled':''}>Duplikuj blok</button><button data-context="delete" class="danger-text" ${locked?'disabled':''}>Usuń ${locked?'· stała sekcja':''}</button>`:''}`;
 if(!m.innerHTML.trim())return;
 m.classList.add('open');m.style.left=Math.max(8,Math.min(rect.left,innerWidth-m.offsetWidth-8))+'px';m.style.top=Math.max(8,Math.min(rect.bottom,innerHeight-m.offsetHeight-8))+'px';
}
function moveModal(id){
 const p=project(),source=p.rows.find(r=>r.id===id),meta=hierarchy(p);
 const kind=source.kind==='item'?'subcategory':'category';
 const options=p.rows.filter(r=>r.kind===kind&&r.id!==id&&(!source.fixed||r.id===meta.get(id).cat));
 showModal(`<h3>Przenieś: ${esc(source.name)}</h3><div class="field"><label>${source.kind==='category'?'Za kategorię':'Na koniec sekcji'}</label><select id="moveDestination">${options.map(r=>`<option value="${r.id}">${meta.get(r.id).lp} · ${esc(r.name)}</option>`).join('')}</select></div><div class="modal-actions"><button class="ghost" onclick="closeModal()">Anuluj</button><button class="primary" id="confirmMove" ${options.length?'':'disabled'}>Przenieś cały blok</button></div>`);
 $('#confirmMove').onclick=()=>{moveToSection(id,$('#moveDestination').value);dirty();closeModal();render()};
}
function moveToSection(id,targetId){
 const p=project(),rows=p.rows,from=rows.findIndex(r=>r.id===id),to=rows.findIndex(r=>r.id===targetId);if(from<0||to<0||from===to)return false;
 const r=rows[from],target=rows[to],end=blockEnd(rows,from);
 if(r.system||target.system||to>=from&&to<end)return false;
 if(r.fixed&&hierarchy(p).get(id).cat!==targetId)return false;
 if(target.kind!==(r.kind==='item'?'subcategory':'category'))return false;
 const at=blockEnd(rows,to),block=rows.splice(from,end-from);rows.splice(at>from?at-block.length:at,0,...block);return true;
}
function iconModal(id){
 const r=project().rows.find(x=>x.id===id);$('#contextMenu').classList.remove('open');
 showModal(`<h3>Ikona: ${esc(r.name)}</h3><div class="icon-options">${['◇','▦','♧','☆','◈','◉','◷','▤','✎','♫','⚑','☀','◎','✦','▱','♬'].map(icon=>`<button class="ghost" data-seticon="${icon}">${icon}</button>`).join('')}</div><div class="field"><label>Własna ikona</label><input id="customIcon" maxlength="12" value="${esc(r.icon||'◇')}"></div><div class="modal-actions"><button class="ghost" onclick="closeModal()">Anuluj</button><button class="primary" id="saveIcon">Zapisz</button></div>`);
 $('#modal').querySelectorAll('[data-seticon]').forEach(b=>b.onclick=()=>{$('#customIcon').value=b.dataset.seticon});
 $('#saveIcon').onclick=()=>{r.icon=$('#customIcon').value.trim()||'◇';dirty();closeModal();render()};
}
let typeRow=null;
function openTypePicker(button){
 $('#typeMenu')?.remove();typeRow=button.dataset.rowid;const menu=document.createElement('div');menu.id='typeMenu';menu.className='type-menu';menu.setAttribute('role','menu');
 menu.innerHTML=`<div class="type-options">${types.filter(t=>t!=='BBF').map(t=>`<button role="menuitem" data-choose-type="${esc(t)}">${esc(typeIcons[t]||'◇')} ${esc(t||'Bez typu')}</button>`).join('')}<button role="menuitem" id="bbfBranch" aria-haspopup="menu" aria-expanded="false">◈ BBF <span>›</span></button></div><div class="price-options" role="menu" hidden><strong>Cennik BBF</strong>${state.priceList.map(x=>`<button role="menuitem" data-choose-price="${x.id}">${esc(x.name)}<small>${cur(x.retention)} / szt.</small></button>`).join('')||'<span>Cennik jest pusty. Dodaj pozycję w ustawieniach.</span>'}</div>`;
 document.body.append(menu);const rect=button.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-Math.min(520,innerWidth-16)-8))+'px';menu.style.top=Math.max(8,Math.min(rect.bottom+4,innerHeight-menu.offsetHeight-8))+'px';
 const branch=$('#bbfBranch'),show=()=>{menu.querySelector('.price-options').hidden=false;branch.setAttribute('aria-expanded','true')};branch.onmouseenter=show;branch.onfocus=show;branch.onclick=show;
 menu.onkeydown=e=>{const buttons=[...menu.querySelectorAll('button')].filter(b=>!b.closest('[hidden]')),i=buttons.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus()}if(e.key==='ArrowRight'&&document.activeElement===branch){e.preventDefault();show();menu.querySelector('[data-choose-price]')?.focus()}};
 menu.querySelector('button')?.focus();
}
function chooseType(type,priceId=''){
 const r=project().rows.find(x=>x.id===typeRow);if(!r||r.system)return;
 r.actualType=type;r.bbfPriceId=priceId;r.bbfItem=state.priceList.find(x=>x.id===priceId)?.name||'';if(type==='BBF')r.actualNet=0;
 if(type==='BBF'){const price=priceFor(r);const person=state.crew.find(c=>c.name===price?.person);if(person)r.personId=person.id}
 $('#typeMenu')?.remove();dirty();
 const shell=$('.sheet-page .table-shell'),left=shell?.scrollLeft||0,top=shell?.scrollTop||0;
 renderSettlement();$('.sheet-page .table-shell').scrollTo(left,top);focusCell(r.id,'actualType');
}
function bars(title,series){
 const max=Math.max(1,...series.map(s=>Math.abs(s.value)));
 return `<div class="card chart"><h3>${title}</h3>${series.map((s,i)=>`<div class="bar-row"><div><span>${esc(s.label)}</span><strong>${cur(s.value)}</strong></div><div class="bar-track"><div style="width:${Math.abs(s.value)/max*100}%;background:${s.value<0?'#bd655f':['#557a70','#a8b5ad','#af956e','#879bb5','#b099b0'][i%5]}"></div></div></div>`).join('')}</div>`;
}
function financeCharts(p){
 const m=metrics(p);
 return `<div class="charts">${bars('Struktura budżetu',[{label:'Koszty zewnętrzne',value:m.actual},{label:'Zasoby BBF',value:m.internal},{label:'Overhead',value:m.overhead},{label:'Marża',value:m.margin}])}${bars('Plan i wykonanie',[{label:'Przewidywany koszt',value:m.planned},{label:'Koszty zewnętrzne',value:m.actual},{label:'Odchylenie',value:m.deviation}])}</div>`;
}
function renderDashboard(){
 $('#projectTitleHeader').textContent='Dashboard projektów';$('#projectStatusLabel').textContent='BIG BEAR FILM';
 const ms=state.projects.map(p=>metrics(p)),total=k=>ms.reduce((a,m)=>a+m[k],0);
 $('#view').innerHTML=`<div class="page dashboard"><div class="section-title"><div><h2>Wszystkie produkcje</h2><p>Budżety, realizacja i wyniki projektów.</p></div><button class="primary" id="newProject">+ Nowy projekt</button></div><div class="kpis dashboard-kpis">${kpi('◫ Projekty',state.projects.length)}${kpi('◈ Budżet łącznie',cur(total('sales')))}${kpi('↳ Retencja',cur(total('retention')),'','positive')}${kpi('↗ Marża',cur(total('margin')),'',total('margin')<0?'negative':'positive')}</div><div class="charts">${bars('Budżety projektów',state.projects.map(p=>({label:p.title,value:metrics(p).sales})))}<div class="card chart"><h3>Etapy realizacji</h3><div class="status-chart">${statuses.map((st,i)=>{const n=state.projects.filter(p=>p.status===st).length;return `<div><div class="status-column"><div style="height:${Math.max(4,100*n/Math.max(1,state.projects.length))}%;background:${n?['#b1b9c5','#b5c7b8','#cbb58d','#7c9e91'][i]:'transparent'}"><strong>${n}</strong></div></div><span>${st}</span></div>`}).join('')}</div></div></div><div class="project-cards">${state.projects.map(p=>{const m=metrics(p);return `<button class="project-card" data-project="${p.id}"><span class="chip">${p.status}</span><h3>${esc(p.title)}</h3><p>${esc(p.client)} · ${esc(p.type)}</p><div><strong>${cur(m.sales)}</strong><span>Marża ${m.sales?pct(m.margin/m.sales):'—'} →</span></div></button>`}).join('')||'<div class="empty">Utwórz pierwszy projekt.</div>'}</div></div>`;
}
const originalRenderInfo=renderInfo;
renderInfo=function(){originalRenderInfo();$('.page').insertAdjacentHTML('beforeend',financeCharts(project()))};
function printEstimate(){
 const p=project(),meta=hierarchy(p),area=document.createElement('section');area.id='printArea';
 area.innerHTML=`<h1>BIG BEAR FILM</h1><p>${esc(p.client)} · ${esc(p.title)}</p><table><thead><tr><th>Lp.</th><th>Opis kosztów</th><th>Kwota netto</th><th>Ilość</th><th>Suma</th></tr></thead><tbody>${p.rows.map(r=>r.kind==='item'?`<tr><td>${meta.get(r.id).lp}</td><td>${esc(r.system?'Marża domu produkcyjnego ('+pct(p.marginRate)+')':r.name)}</td><td>${cur(r.unit)}</td><td>${num(r.qty)}</td><td>${cur(rowMetrics(r,p).sales)}</td></tr>`:`<tr class="${r.kind}"><td>${meta.get(r.id).lp}</td><td colspan="4">${esc(r.name)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="4">SUMA NETTO</td><td>${cur(metrics(p).sales)}</td></tr></tfoot></table>`;
 document.body.append(area);window.print();area.remove();
}
function migrate(){
 state.ui.collapsed??={};state.crew??=[];state.clients??=[];
 if(!state.schemaVersion){
 
 for(const p of state.projects){for(const r of p.rows){
 if(r.kind!=='item')r.name=r.name.replace(/^\d+(?:\.\d+)*\.?\s*/, '');
 r.icon??=r.kind==='category'?'▦':'◇';
 if((r.actualType||'').toLowerCase()==='rental bbf'){
 const price={id:uid(),name:`Rental — ${r.name}`,cost:0,retention:num(r.bbfInternalValue)/Math.max(1,num(r.qty)),person:'',hours:0};state.priceList.push(price);r.actualType='BBF';r.bbfPriceId=price.id;r.bbfItem=price.name;
 }
 if(r.actualType==='BBF'&&!r.bbfPriceId)r.bbfPriceId=priceFor(r)?.id||'';
 delete r.bbfEconomicCost;delete r.bbfInternalValue;
 }ensureStructure(p)}
 state.schemaVersion=2;
 }
 state.projects.forEach(ensureStructure);
 for(const price of state.priceList){if(price.person&&!state.crew.some(c=>c.name===price.person))state.crew.push({id:uid(),name:price.person,role:'BBF',email:'',phone:'',defaultType:'BBF',defaultRate:0})}
 for(const p of state.projects)for(const r of p.rows){if(r.actualType==='BBF'&&!r.personId){const person=state.crew.find(c=>c.name===priceFor(r)?.person);if(person)r.personId=person.id}}
}
// Initialisation is performed by workspace.js after the UI extensions load.
