/* Workspace controls, financial fee and a persistent operation timeline. */
const paths={
 grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
 folder:'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
 layers:'m12 3 10 5-10 5L2 8Z M2 12l10 5 10-5 M2 16l10 5 10-5',
 file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M8 13h8 M8 17h5',
 users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 camera:'M14 4h-4L8 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4Z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 clock:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 6v6l4 2',
 trash:'M3 6h18 M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2 M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14 M10 10v7 M14 10v7',
 lock:'M6 10h12a2 2 0 0 1 2 2v8H4v-8a2 2 0 0 1 2-2 M8 10V6a4 4 0 0 1 8 0v4 M12 14v3',
 chevron:'m9 5 7 7-7 7',
 undo:'M3 7h11a7 7 0 0 1 0 14 M3 7l5-5 M3 7l5 5',
 redo:'M21 7H10a7 7 0 0 0 0 14 M21 7l-5-5 M21 7l-5 5',
 history:'M3 11a9 9 0 1 1 2.6 7.4 M3 3v8h8 M12 7v5l3 2',
 grip:'M8 5h.01 M16 5h.01 M8 12h.01 M16 12h.01 M8 19h.01 M16 19h.01',
 settings:'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
 chart:'M3 3v18h18 M7 16v-4 M12 16V8 M17 16V5',
 percent:'M5 19 19 5 M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 check:'m5 12 4 4L19 6',
 star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z',
 music:'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 plus:'M12 5v14 M5 12h14',
 info:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 11v6 M12 7h.01'
};
const legacyIcons={'▦':'folder','◇':'layers','♧':'users','☆':'star','◈':'file','◉':'info','◷':'clock','▤':'file','✎':'file','♫':'music','♬':'music','◫':'grid','↗':'chart','↳':'chart','±':'chart','⚙':'settings','▱':'file','×':'plus','Σ':'chart','#':'file','%':'percent'};
function icon(name){const key=legacyIcons[name]||name;if(!paths[key])return `<span class="custom-icon">${esc(name)}</span>`;return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key]}"/></svg>`}
function commissionAmount(p){return Math.round(p.rows.filter(r=>r.kind==='item'&&!r.system).reduce((sum,r)=>sum+num(r.unit)*num(r.qty),0)*num(p.marginRate)*100)/100}
const ensureBase=ensureStructure;
ensureStructure=function(p){
 p.rows??=[];const existing=p.rows.find(r=>r.system==='commission');p.rows=p.rows.filter(r=>!r.system);
 ensureBase(p);p.marginRate=Math.max(0,num(p.marginRate));
 p.rows.push({id:existing?.id||uid(),kind:'item',system:'commission',name:'Prowizja',unit:commissionAmount(p),qty:1,plannedUnit:0,actualType:'prowizja',actualNet:0,bbfItem:''});
};
const metricBase=rowMetrics;
rowMetrics=function(r,p=project()){return metricBase(r.system?{...r,unit:commissionAmount(p),qty:1,actualNet:0,actualType:'prowizja',plannedUnit:0}:r,p)};
const hierarchyBase=hierarchy;
hierarchy=function(p){const m=hierarchyBase(p);for(const r of p.rows)if(r.system)m.set(r.id,{lp:'—',cat:null,sub:null,crew:null,color:'#f1f3f1',protected:true});return m};
function revealRow(p,id){const h=hierarchy(p).get(id);if(h){delete state.ui.folded?.[h.cat];delete state.ui.folded?.[h.sub]}}
function isRowHidden(r,p,meta){if(r.system)return false;const h=meta.get(r.id);return r.kind==='category'?false:!!(state.ui.folded?.[h.cat]||(r.kind==='item'&&state.ui.folded?.[h.sub]))}
function trashCell(r,h){return `<td class="row-tools"><button class="trash-button" data-delete-row="${r.id}" aria-label="Usuń ${esc(r.name)}" title="${h.protected?'Stała sekcja':'Usuń wiersz · Del'}" ${h.protected?'disabled':''}>${h.protected?icon('lock'):icon('trash')}</button></td>`}
groupCells=function(r,h,colspan,editable){return `<td class="drag"><button class="row-menu" data-rowmenu="${r.id}" draggable="${editable}" aria-label="Menu ${esc(r.name)}">${icon('grip')}</button></td><td class="lp">${h.lp}</td><td colspan="${colspan}"><div class="group-label"><button class="fold-button ${state.ui.folded?.[r.id]?'folded':''}" data-fold="${r.id}" aria-label="${state.ui.folded?.[r.id]?'Rozwiń':'Zwiń'} ${esc(r.name)}" aria-expanded="${!state.ui.folded?.[r.id]}">${icon('chevron')}</button><button class="group-icon" data-icon="${r.id}" aria-label="Zmień ikonę ${esc(r.name)}">${icon(r.icon||'folder')}</button>${editable?`<input data-cell="name" data-rowid="${r.id}" value="${esc(r.name)}" ${r.fixed?'readonly':''}>`:`<span>${esc(r.name)}</span>`}</div></td>`};
estimateTable=function(p){
 const meta=hierarchy(p);const rows=p.rows.filter(r=>!r.system).map(r=>{const h=meta.get(r.id),m=rowMetrics(r,p);
 if(r.kind!=='item')return `<tr class="${r.kind}" data-row="${r.id}" style="--row-color:${h.color}" ${isRowHidden(r,p,meta)?'hidden':''}>${groupCells(r,h,6,true)}${trashCell(r,h)}</tr>`;
 return `<tr data-row="${r.id}" style="--row-color:${h.color}" ${isRowHidden(r,p,meta)?'hidden':''}><td class="drag"><button class="row-menu" draggable="true" data-rowmenu="${r.id}" aria-label="Menu ${esc(r.name)}">${icon('grip')}</button></td><td class="lp">${h.lp}</td><td class="name">${cell(r,'name')}</td><td class="num">${cell(r,'unit',true)}</td><td class="num">${cell(r,'qty',true)}</td><td class="num computed" data-metric="sales" title="Wartość obliczana">${cur(m.sales)}</td><td class="num plan-column">${cell(r,'plannedUnit',true)}</td><td class="num computed plan-total" data-metric="planned">${cur(m.planned)}</td>${trashCell(r,h)}</tr>`;
 }).join('');
 return `<table class="sheet" id="estimateSheet"><thead><tr><th></th><th>Lp.</th><th>${icon('file')} Opis kosztów</th><th>Kwota netto</th><th>Ilość</th><th>${icon('lock')} Suma</th><th class="plan-column">Przewidywany koszt / szt.</th><th class="plan-total">Przewidywany koszt — suma</th><th></th></tr></thead><tbody>${rows}</tbody><tfoot class="fee-footer"><tr><td colspan="6">${icon('percent')} Marża domu produkcyjnego</td><td colspan="2"><div class="percent-input"><input id="houseMargin" data-margin-rate inputmode="decimal" aria-label="Marża domu produkcyjnego w procentach" value="${+(num(p.marginRate)*100).toFixed(4)}"><span>%</span></div></td><td>${icon('lock')}</td></tr><tr><td colspan="6">Marża domu produkcyjnego — kwota</td><td colspan="2" class="computed" data-commission>${cur(commissionAmount(p))}</td><td>${icon('lock')}</td></tr><tr class="grand-total"><td colspan="6">Razem netto</td><td colspan="2" data-total-sales>${cur(metrics(p).sales)}</td><td></td></tr></tfoot></table>`;
};
const sheetBase=sheetPage;
sheetPage=function(mode){sheetBase(mode);decorateSheet();
 const footer=$('.sheet-page .fee-footer');if(footer){const panel=document.createElement('div');panel.className='fee-panel';
 for(const row of footer.rows){const line=document.createElement('div');line.className='fee-line '+row.className;const label=document.createElement('div');label.className='fee-label';label.innerHTML=row.cells[0].innerHTML;const value=document.createElement('div');value.className='fee-value';value.innerHTML=row.cells[1].innerHTML;for(const [key,val]of Object.entries(row.cells[1].dataset))value.dataset[key]=val;line.append(label,value);panel.append(line)}
 footer.remove();$('.sheet-page').append(panel)}
 polishIcons();updateHistoryButtons()};
function decorateSheet(){
 const p=project(),meta=hierarchy(p),table=$('.sheet-page table');if(!table)return;
 for(const tr of table.querySelectorAll('tbody tr[data-row]')){
 const r=p.rows.find(x=>x.id===tr.dataset.row);if(!r)continue;const h=meta.get(r.id);tr.hidden=isRowHidden(r,p,meta);
 if(state.ui.tab==='settlement'){
 tr.insertAdjacentHTML('beforeend',trashCell(r,h));
 const grip=tr.querySelector('.row-menu');if(grip)grip.innerHTML=icon(r.system?'percent':'grip');
 if(r.system){tr.classList.add('commission-row');const button=tr.querySelector('.type-picker');button.disabled=true;button.innerHTML=icon('percent')+' prowizja';tr.querySelector('[data-cell=actualNet]').readOnly=true;if(grip)grip.disabled=true}
 }
 tr.querySelectorAll('input[readonly]').forEach(el=>{el.closest('td').classList.add('readonly-cell');el.title='Pole zablokowane'});
 }
 if(state.ui.tab==='settlement')table.querySelector('thead tr').insertAdjacentHTML('beforeend','<th></th>');
}
function deleteRow(id){
 const p=project(),i=p.rows.findIndex(r=>r.id===id);if(i<0||hierarchy(p).get(id).protected)return false;
 const r=p.rows[i],next=p.rows[blockEnd(p.rows,i)]||p.rows[i-1];p.rows.splice(i,blockEnd(p.rows,i)-i);dirty(`Usunięto: ${r.name}`);render();if(next)focusCell(next.id,'name');return true;
}
function toggleFold(id){state.ui.folded??={};state.ui.folded[id]=!state.ui.folded[id];save();const shell=$('.table-shell'),top=shell?.scrollTop||0,left=shell?.scrollLeft||0;render();$('.table-shell')?.scrollTo(left,top)}
const numbersBase=refreshNumbers;
refreshNumbers=function(){numbersBase();document.querySelectorAll('[data-commission]').forEach(el=>el.textContent=cur(commissionAmount(project())));polishIcons()};
const contextBase=openContext;
openContext=function(id,rect){contextBase(id,rect);const menu=$('#contextMenu');if(!menu.classList.contains('open'))return;
 const keys={addBelow:'Shift + Enter',addSubcategory:(/Mac/.test(navigator.platform)?'⌘':'Ctrl')+' + Enter',delete:'Del'};
 for(const button of menu.querySelectorAll('[data-context]')){const key=keys[button.dataset.context];if(key)button.insertAdjacentHTML('beforeend',`<kbd>${key}</kbd>`)}
 const r=project().rows.find(r=>r.id===id);if(r&&r.kind!=='item')menu.insertAdjacentHTML('beforeend',`<button data-fold="${id}">${icon('chevron')} ${state.ui.folded?.[id]?'Rozwiń':'Zwiń'} sekcję</button>`);
 menu.insertAdjacentHTML('beforeend',`<hr><button data-history-action="undo" ${timeline.cursor?'':'disabled'}>${icon('undo')} Cofnij<kbd>${modifierLabel()} + Z</kbd></button><button data-history-action="redo" ${timeline.cursor<timeline.entries.length?'':'disabled'}>${icon('redo')} Ponów<kbd>${modifierLabel()} + Shift + Z</kbd></button>`);
 menu.style.top=Math.max(8,Math.min(rect.bottom,innerHeight-menu.offsetHeight-8))+'px';
};
function modifierLabel(){return /Mac/.test(navigator.platform)?'⌘':'Ctrl'}
// Coalesce typing within one focus session into one reversible operation.
let timeline={base:null,entries:[],cursor:0},historyReady=false,historyGroup=0;
function dataSnapshot(){return clone({projects:state.projects,clients:state.clients,crew:state.crew,priceList:state.priceList,projectTypes:state.projectTypes,targets:state.targets,schemaVersion:state.schemaVersion})}
function historyCurrent(){return timeline.cursor?timeline.entries[timeline.cursor-1].data:timeline.base}
function operationName(before,after){
 if(before.projects.length!==after.projects.length)return 'Utworzono projekt';
 if(before.priceList.length!==after.priceList.length)return 'Zmieniono cennik';
 if(JSON.stringify(before.priceList)!==JSON.stringify(after.priceList))return 'Edycja cennika BBF';
 if(JSON.stringify(before.crew)!==JSON.stringify(after.crew))return 'Zmieniono bazę ekipy';
 if(JSON.stringify(before.clients)!==JSON.stringify(after.clients))return 'Zmieniono bazę klientów';
 for(const p of after.projects){const old=before.projects.find(x=>x.id===p.id);if(!old)continue;
 if(p.marginRate!==old.marginRate)return 'Marża domu produkcyjnego: '+pct(p.marginRate);
 if(p.rows.length!==old.rows.length)return p.rows.length>old.rows.length?'Dodano pozycje':'Usunięto pozycje';
 if(p.rows.some((r,i)=>r.id!==old.rows[i]?.id))return 'Przeniesiono blok';
 for(const r of p.rows){const previous=old.rows.find(x=>x.id===r.id);if(!r.system&&JSON.stringify(r)!==JSON.stringify(previous))return (r.personId!==previous?.personId?'Przypisano osobę: ':'Zmieniono: ')+r.name}
 if(JSON.stringify(p)!==JSON.stringify(old))return 'Zmieniono informacje projektu';
 }return 'Edycja danych';
}
function persistHistory(){}
function recordOperation(label){
 if(!historyReady)return;const after=dataSnapshot(),before=historyCurrent();if(JSON.stringify(before)===JSON.stringify(after))return;
 const active=document.activeElement,typing=active?.matches('input[data-cell],input[data-pfield],input[data-price],input[data-margin-rate],input[data-datefield],input[data-person-field],input[data-role-id]');
 const coalesce=typing&&!label&&timeline.cursor===timeline.entries.length&&timeline.entries.at(-1)?.group===historyGroup;
 const entry={data:after,label:label||operationName(before,after),time:new Date().toISOString(),group:typing&&!label?historyGroup:null};
 if(coalesce)timeline.entries[timeline.cursor-1]=entry;else{timeline.entries=timeline.entries.slice(0,timeline.cursor);timeline.entries.push(entry);timeline.cursor++}
 if(timeline.entries.length>40){timeline.base=timeline.entries.shift().data;timeline.cursor--}
 persistHistory();updateHistoryButtons();
}
function restoreHistory(cursor){
 if(cursor<0||cursor>timeline.entries.length||cursor===timeline.cursor)return;
 const focused=document.activeElement,rowId=focused?.dataset.rowid,key=focused?.dataset.cell;
 timeline.cursor=cursor;Object.assign(state,clone(historyCurrent()));historyGroup++;state.projects.forEach(ensureStructure);
 if(!state.projects.some(p=>p.id===state.ui.selectedProject))state.ui.selectedProject=state.projects[0]?.id;
 save();persistHistory();closeModal();$('#typeMenu')?.remove();$('#contextMenu').classList.remove('open');render();if(rowId&&key)focusCell(rowId,key);
}
function undo(){restoreHistory(timeline.cursor-1)}
function redo(){restoreHistory(timeline.cursor+1)}
function updateHistoryButtons(){
 const u=$('#undoBtn'),r=$('#redoBtn');if(!u)return;
 u.disabled=!historyReady||timeline.cursor===0;r.disabled=!historyReady||timeline.cursor===timeline.entries.length;
 u.innerHTML=icon('undo');r.innerHTML=icon('redo');$('#historyBtn').innerHTML=icon('history');
 u.title='Cofnij · '+modifierLabel()+' + Z';r.title='Ponów · '+modifierLabel()+' + Shift + Z';
}
function historyModal(){
 showModal(`<div class="history-heading"><h3>${icon('history')} Historia operacji</h3><button class="icon-control" onclick="closeModal()" aria-label="Zamknij">×</button></div><div class="history-list"><button data-history-index="0" class="history-entry ${timeline.cursor===0?'current':''}"><span>Stan początkowy</span>${timeline.cursor===0?icon('check'):''}</button>${timeline.entries.map((e,i)=>`<button data-history-index="${i+1}" class="history-entry ${i+1===timeline.cursor?'current':''} ${i+1>timeline.cursor?'undone':''}"><span>${esc(e.label)}<small>${new Date(e.time).toLocaleString('pl-PL')}</small></span>${i+1===timeline.cursor?icon('check'):''}</button>`).reverse().join('')}</div><p class="history-caption">Ostatnie 40 operacji. Wybierz zapis, aby przywrócić ten stan.</p>`);
}
function polishIcons(){
 const duplicate=$('#duplicateProject');if(duplicate&&!duplicate.querySelector('svg')){duplicate.innerHTML=icon('file')+'<span>Duplikuj</span>';duplicate.title='Duplikuj projekt'}
 const fixed=[['[data-action="dashboard"] .nav-icon','grid'],['#settingsBtn .nav-icon','settings']];for(const [selector,name]of fixed){const el=$(selector);if(el)el.innerHTML=icon(name)}
 for(const el of document.querySelectorAll('#tabs button,.kpi .label,.sheet th,.section-title h2,.field label,.type-picker,.row-actions strong')){if(el.querySelector('svg'))continue;const text=el.textContent.trim(),name=legacyIcons[text[0]];if(name)el.innerHTML=icon(name)+' '+esc(text.slice(1).trim())}
}
const renderBase=render;
render=function(){renderBase();polishIcons();updateHistoryButtons()};
iconModal=function(id){
 const r=project().rows.find(x=>x.id===id);$('#contextMenu').classList.remove('open');
 const choices=['folder','layers','file','users','camera','clock','chart','star','music','grid','percent','info'];
 showModal(`<h3>Ikona sekcji</h3><div class="icon-options">${choices.map(name=>`<button class="ghost" data-seticon="${name}" aria-label="${name}">${icon(name)}</button>`).join('')}</div><div class="field"><label>Własny symbol</label><input id="customIcon" maxlength="20" value="${esc(r.icon||'folder')}"></div><div class="modal-actions"><button class="ghost" onclick="closeModal()">Anuluj</button><button class="primary" id="saveIcon">Zapisz</button></div>`);
 $('#modal').querySelectorAll('[data-seticon]').forEach(b=>b.onclick=()=>{$('#customIcon').value=b.dataset.seticon});$('#saveIcon').onclick=()=>{r.icon=$('#customIcon').value.trim()||'folder';dirty('Zmieniono ikonę: '+r.name);closeModal();render()};
};
document.addEventListener('focusin',()=>{historyGroup++},true);
document.addEventListener('pointerdown',e=>{if(e.target.closest('button'))historyGroup++;const row=e.target.closest('.sheet-page tbody tr[data-row]');if(row){state.ui.activeRow=row.dataset.row;if(!e.target.closest('input,button,select')){row.tabIndex=-1;row.focus()}}},true);
document.addEventListener('input',e=>{if(e.target.hasAttribute('data-margin-rate')){project().marginRate=Math.max(0,num(e.target.value))/100;dirty();refreshNumbers()}});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.deleteRow)deleteRow(b.dataset.deleteRow);
 if(b.dataset.fold)toggleFold(b.dataset.fold);
 if(b.id==='undoBtn'||b.dataset.historyAction==='undo')undo();
 if(b.id==='redoBtn'||b.dataset.historyAction==='redo')redo();
 if(b.id==='historyBtn')historyModal();
 if(b.dataset.historyIndex!==undefined)restoreHistory(Number(b.dataset.historyIndex));
});
document.addEventListener('keydown',e=>{
 const modalOpen=$('#modalBackdrop').classList.contains('open');
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'&&!modalOpen){e.preventDefault();e.stopImmediatePropagation();e.shiftKey?redo():undo();return}
 if(e.key==='Delete'&&!modalOpen&&!e.target.closest('#typeMenu')&&['estimate','settlement'].includes(state.ui.tab)){
 const row=e.target.closest('tr[data-row]');if(row){e.preventDefault();e.stopImmediatePropagation();deleteRow(row.dataset.row)}
 }
},true);
migrate();state.schemaVersion=3;state.projects.forEach(ensureStructure);
timeline.base=dataSnapshot();
historyReady=true;render();save();persistHistory();
