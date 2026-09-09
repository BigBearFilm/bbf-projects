/* Blue workspace, production icon library and editable crew records. */
Object.assign(paths,{
 film:'M4 3h16v18H4z M4 7h16 M4 17h16 M8 3v4 M16 3v4 M8 17v4 M16 17v4',
 video:'M3 5h12v14H3z m12 5 6-4v12l-6-4',
 mic:'M9 3h6v10a3 3 0 0 1-6 0z M5 10v3a7 7 0 0 0 14 0v-3 M12 20v3 M8 23h8',
 headphones:'M3 14v-2a9 9 0 0 1 18 0v2 M3 12h4v9H3z M17 12h4v9h-4z',
 light:'M12 2v3 M4 5l2 2 M20 5l-2 2 M2 13h3 M19 13h3 M9 19h6 M10 22h4 M8 16a6 6 0 1 1 8 0l-1 3H9z',
 truck:'M2 5h12v12H2z M14 9h5l3 4v4h-8 M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
 food:'M4 3v7 M8 3v7 M4 7h4 M6 10v12 M17 3v19 M17 3c-5 4-5 9 0 9',
 palette:'M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4 2 2 0 0 1 0-4h4a3 3 0 0 0 3-3c0-4-5-7-9-7 M7 8h.01 M11 6h.01 M16 8h.01 M6 13h.01',
 shirt:'m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0',
 location:'M12 22s8-8 8-13a8 8 0 1 0-16 0c0 5 8 13 8 13 M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 studio:'M3 21V9l9-7 9 7v12H3 M9 21v-8h6v8 M7 9h.01 M17 9h.01',
 edit:'m4 16-1 5 5-1L21 7l-4-4Z M14 6l4 4',
 scissors:'M8 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M8 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M8 8l13 13 M8 16 21 3',
 monitor:'M2 3h20v14H2z M8 22h8 M12 17v5',
 receipt:'M5 2l2 2 2-2 3 2 3-2 2 2 2-2v20l-2-2-2 2-3-2-3 2-2-2-2 2Z M8 8h8 M8 12h8 M8 16h5',
 contract:'M14 2H4v20h16V8z M14 2v6h6 M8 12h8 M8 16h3 M13 18l2-2 2 1',
 graduate:'m2 8 10-5 10 5-10 5Z M6 10v7c4 3 8 3 12 0v-7 M22 8v9',
 wallet:'M3 5h17v15H3z M3 5V3h14v2 M16 10h6v6h-6z',
 phone:'M6 3 3 5c0 8 8 16 16 16l2-3-5-4-2 2-6-6 2-2Z',
 mail:'M2 4h20v16H2z M2 5l10 8L22 5',
 briefcase:'M3 7h18v14H3z M8 7V3h8v4 M3 12c6 4 12 4 18 0 M10 12h4v4h-4z',
 calendar:'M3 5h18v17H3z M7 2v6 M17 2v6 M3 10h18 M7 14h3 M14 14h3',
 drone:'M9 9h6v6H9z M9 9 5 5 M15 9l4-4 M9 15l-4 4 M15 15l4 4 M7 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M23 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M7 20a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M23 20a3 3 0 1 1-6 0 3 3 0 0 1 6 0'
});
palette[0]='#4d87df';
const productionIcons={
 'Produkcja i ekipa':{film:'Film / klaps',camera:'Kamera',video:'Zdjęcia',users:'Ekipa / obsada',briefcase:'Produkcja',calendar:'Plan zdjęciowy',star:'Aktorzy'},
 'Sprzęt i plan':{light:'Oświetlenie',mic:'Dźwięk',headphones:'Odsłuch',drone:'Dron',studio:'Studio',location:'Lokacja',truck:'Transport',food:'Catering',shirt:'Kostiumy',palette:'Scenografia / charakteryzacja'},
 'Postprodukcja':{scissors:'Montaż',monitor:'Postprodukcja',music:'Muzyka',edit:'Kreacja',layers:'Animacja',file:'Materiały'},
 'Organizacja i rozliczenie':{folder:'Kategoria',grid:'Zestawienie',clock:'Czas',contract:'Umowa',receipt:'Faktura / paragon',wallet:'Płatność',percent:'Prowizja',chart:'Wynik',phone:'Telefon',mail:'E-mail',settings:'Administracja'}
};
iconModal=function(id){const r=project().rows.find(r=>r.id===id);$('#contextMenu').classList.remove('open');showModal(`<h3>Ikona: ${esc(r.name)}</h3><div class="production-icons">${Object.entries(productionIcons).map(([group,items])=>`<h4>${group}</h4><div class="production-icon-grid">${Object.entries(items).map(([name,label])=>`<button data-seticon="${name}" title="${label}" aria-label="${label}" class="${r.icon===name?'selected':''}">${icon(name)}<span>${label}</span></button>`).join('')}</div>`).join('')}</div><div class="field custom-production-icon"><label>Własny symbol</label><input id="ownProductionIcon" maxlength="12" placeholder="Wpisz własny symbol"></div><div class="modal-actions"><button class="ghost" onclick="closeModal()">Anuluj</button><button class="primary" id="saveOwnProductionIcon">Użyj symbolu</button></div>`);$('#saveOwnProductionIcon').onclick=()=>{const value=$('#ownProductionIcon').value.trim();if(value){r.icon=value;dirty('Zmieniono ikonę: '+r.name);closeModal();document.querySelectorAll(`[data-icon="${r.id}"]`).forEach(button=>button.innerHTML=icon(r.icon))}};$('#modal').querySelectorAll('[data-seticon]').forEach(b=>b.onclick=()=>{r.icon=b.dataset.seticon;dirty('Zmieniono ikonę: '+r.name);closeModal();document.querySelectorAll(`[data-icon="${r.id}"]`).forEach(button=>button.innerHTML=icon(r.icon))})};
const contractIcons={'umowa o dzieło':'contract','umowa zlecenie':'contract','umowa zlecenie - student':'graduate',faktura:'receipt',paragon:'receipt',różne:'wallet',BBF:'studio',prowizja:'percent',administracja:'briefcase'};
const typeMenuBase=openTypePicker;
openTypePicker=function(button){typeMenuBase(button);$('#typeMenu').querySelectorAll('[data-choose-type]').forEach(b=>{const type=b.dataset.chooseType;b.innerHTML=icon(contractIcons[type]||'file')+`<span>${esc(type||'Bez typu')}</span>`});$('#bbfBranch').innerHTML=icon('studio')+'<span>BBF</span>'+icon('chevron')};
const finalDecorate=decorateSheet;
decorateSheet=function(){finalDecorate();for(const b of document.querySelectorAll('.type-picker')){const r=project().rows.find(r=>r.id===b.dataset.rowid);if(r)b.innerHTML=icon(contractIcons[r.actualType]||'file')+' '+esc(r.actualType==='BBF'?'BBF/'+(priceFor(r)?.name||'Wybierz'):r.actualType||'Wybierz typ')+(r.system?'':' ⌄')}};
renderSidebar=function(){
 $('#projectGroups').innerHTML=statuses.map((status,i)=>{const projects=state.projects.filter(p=>p.status===status);return `<div class="group project-drop-zone ${state.ui.collapsed[status]?'collapsed':''}" data-project-status="${status}"><div class="group-head"><span><i class="status-dot status-${i}"></i>${status} · ${projects.length}</span><button data-collapse="${status}" aria-label="Zwiń lub rozwiń ${status}">${state.ui.collapsed[status]?'›':'⌄'}</button></div><div class="project-list">${projects.map(p=>`<div class="side-project"><button class="project-row ${p.id===state.ui.selectedProject&&!['dashboard','settings'].includes(state.ui.tab)?'active':''}" data-project="${p.id}" draggable="true"><span class="side-project-icon">${icon((state.projectTypes||initialProjectTypes).find(t=>t.name===p.type)?.icon||'folder')}</span><span class="side-project-label"><strong>${esc(p.title)}</strong><small>${esc(p.client||'Bez klienta')}</small></span></button><button class="project-more" data-project-menu="${p.id}" aria-label="Menu projektu ${esc(p.title)}">···</button></div>`).join('')}<span class="empty-status">Przenieś tutaj projekt</span></div></div>`}).join('');
 $('.brand-mark')?.remove();
};
function removeProject(id){const p=state.projects.find(x=>x.id===id);if(!p)return;state.projects=state.projects.filter(x=>x.id!==id);if(state.ui.selectedProject===id){state.ui.selectedProject=state.projects[0]?.id;state.ui.tab='dashboard'}dirty('Usunięto projekt: '+p.title);$('#projectContext')?.remove();render()}
function renameProject(id){const p=state.projects.find(x=>x.id===id);if(!p)return;$('#projectContext')?.remove();showModal(`<h3>Zmień nazwę projektu</h3><div class="field"><label>Nazwa projektu</label><input id="renamedProject" value="${esc(p.title)}"></div><div class="modal-actions"><button class="ghost" onclick="closeModal()">Anuluj</button><button class="primary" id="saveProjectName">Zapisz</button></div>`);$('#renamedProject').focus();$('#renamedProject').select();$('#saveProjectName').onclick=()=>{const name=$('#renamedProject').value.trim();if(!name)return;p.title=name;dirty('Zmieniono nazwę projektu: '+name);closeModal();render()};$('#renamedProject').onkeydown=e=>{if(e.key==='Enter')$('#saveProjectName').click()}}
function setProjectStatus(id,status){const p=state.projects.find(x=>x.id===id);if(!p||!statuses.includes(status)||p.status===status)return;p.status=status;state.ui.collapsed[status]=false;dirty('Zmieniono status projektu: '+p.title+' → '+status);render()}
function projectMenu(id,x,y){$('#projectContext')?.remove();const p=state.projects.find(p=>p.id===id);if(!p)return;const menu=document.createElement('div');menu.id='projectContext';menu.className='context-menu open';menu.innerHTML=`<button data-project-rename="${id}">${icon('edit')} Zmień nazwę</button><button data-project-delete="${id}" class="danger-text">${icon('trash')} Usuń projekt</button><hr><div class="context-label">Zmień status</div>${statuses.map((s,i)=>`<button data-status-project="${id}" data-new-status="${s}"><i class="status-dot status-${i}"></i>${s}${p.status===s?icon('check'):''}</button>`).join('')}`;document.body.append(menu);menu.style.left=Math.max(8,Math.min(x,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-menu.offsetHeight-8))+'px'}
const infoBase=renderInfo;
renderInfo=function(){infoBase();$('.page').insertAdjacentHTML('beforeend',`<div class="project-danger-zone"><button class="ghost danger-text" data-project-delete="${project().id}">${icon('trash')} Usuń projekt</button></div>`)};
// Crew cells edit shared person records; assignment remains attached to the cost row.
function personCell(person,key,roleId=''){
 if(!person)return '<span class="unassigned-cell">—</span>';
 const attrs=`data-crew-key="${key}" data-person-field="${key}" data-person-id="${person.id}" aria-label="${esc(person.name)} — ${key}"`;
 if(key==='defaultType')return `<select ${attrs}>${types.map(type=>`<option value="${esc(type)}" ${type===person[key]?'selected':''}>${esc(type||'Bez typu')}</option>`).join('')}</select>`;
 return `<input ${attrs} ${key==='defaultRate'?'inputmode="decimal"':''} value="${esc(person[key]??'')}">`;
}
renderCrew=function(){const p=project(),meta=hierarchy(p),roles=p.rows.filter(r=>r.kind==='item'&&meta.get(r.id).crew);
 $('#view').innerHTML=`<div class="page crew-page"><div class="section-title"><h2>${icon('users')} Ekipa i obsada</h2><button class="primary" id="addCrew">${icon('plus')} Dodaj osobę</button></div><h3 class="crew-table-title">Role w projekcie <span>${roles.length}</span></h3><div class="table-shell"><table class="sheet crew-sheet"><thead><tr><th>Rola</th><th>Osoba</th><th>${icon('phone')} Telefon</th><th>${icon('mail')} E-mail</th><th>Forma rozliczenia osoby</th><th>Stawka domyślna</th></tr></thead><tbody>${roles.map(r=>{const person=state.crew.find(c=>c.id===r.personId);return `<tr><td><input data-crew-key="role" data-role-id="${r.id}" aria-label="Rola w projekcie" value="${esc(r.name)}"></td><td><select data-crew-key="assignment" data-assignment="${r.id}" aria-label="Osoba do roli ${esc(r.name)}"><option value="">Nieprzypisana</option>${state.crew.map(c=>`<option data-person-option="${c.id}" value="${esc(c.name)}" ${c.id===person?.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></td>${['phone','email','defaultType','defaultRate'].map(k=>`<td>${personCell(person,k,r.id)}</td>`).join('')}</tr>`}).join('')||'<tr><td colspan="6">Dodaj role w kosztorysie.</td></tr>'}</tbody></table></div><h3 class="crew-table-title">Baza osób <span>${state.crew.length}</span></h3><div class="table-shell"><table class="sheet crew-sheet crew-database"><thead><tr><th>Imię i nazwisko</th><th>Specjalizacja</th><th>${icon('phone')} Telefon</th><th>${icon('mail')} E-mail</th><th>Domyślna forma</th><th>Stawka netto</th></tr></thead><tbody>${state.crew.map(c=>`<tr>${['name','role','phone','email','defaultType','defaultRate'].map(k=>`<td>${personCell(c,k)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
};
function updatePersonInput(t){const person=state.crew.find(p=>p.id===t.dataset.personId);if(!person)return;const key=t.dataset.personField,old=person[key];person[key]=key==='defaultRate'?num(t.value):t.value;
 if(key==='name'){state.priceList.filter(x=>x.person===old).forEach(x=>x.person=person.name);document.querySelectorAll(`[data-person-option="${person.id}"]`).forEach(option=>{option.value=person.name;option.textContent=person.name})}
 document.querySelectorAll(`[data-person-id="${person.id}"][data-person-field="${key}"]`).forEach(el=>{if(el!==t)el.value=t.value});dirty();
}
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.personField)updatePersonInput(t);if(t.dataset.roleId){const r=project().rows.find(r=>r.id===t.dataset.roleId);r.name=t.value;dirty()}});
document.addEventListener('change',e=>{if(e.target.dataset.personField&&e.target.tagName==='SELECT')updatePersonInput(e.target)});
document.addEventListener('focusin',e=>{if(e.target.matches('input[data-crew-key]'))e.target.select()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape')$('#projectContext')?.remove();
 const t=e.target;if(!t.dataset.crewKey)return;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(e.key)){
 e.preventDefault();const tr=t.closest('tr'),table=t.closest('table'),cells=[...tr.querySelectorAll('[data-crew-key]')],i=cells.indexOf(t);let target;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight')target=cells[i+(e.key==='ArrowRight'?1:-1)];else{const rows=[...table.tBodies[0].rows],next=rows[rows.indexOf(tr)+(e.key==='ArrowUp'?-1:1)];target=next?.querySelector(`[data-crew-key="${t.dataset.crewKey}"]`)}target?.focus();
 }
});
document.addEventListener('contextmenu',e=>{const p=e.target.closest('[data-project]');if(!p)return;e.preventDefault();projectMenu(p.dataset.project,e.clientX,e.clientY)});
document.addEventListener('click',e=>{const b=e.target.closest('button');
 if(b?.dataset.projectMenu){const rect=b.getBoundingClientRect();projectMenu(b.dataset.projectMenu,rect.right,rect.bottom);return}
 if(b?.dataset.projectRename)renameProject(b.dataset.projectRename);
 if(b?.dataset.projectDelete)removeProject(b.dataset.projectDelete);
 if(b?.dataset.statusProject){setProjectStatus(b.dataset.statusProject,b.dataset.newStatus);$('#projectContext')?.remove()}
 if(!e.target.closest('#projectContext'))$('#projectContext')?.remove();
});
let sidebarDragged=null;
document.addEventListener('dragstart',e=>{const p=e.target.closest('[data-project][draggable]');if(p){sidebarDragged=p.dataset.project;e.dataTransfer.setData('text/plain',sidebarDragged);e.dataTransfer.effectAllowed='move';p.classList.add('project-dragging')}});
document.addEventListener('dragover',e=>{if(!sidebarDragged)return;document.querySelectorAll('.project-drop-target').forEach(el=>el.classList.remove('project-drop-target'));const zone=e.target.closest('[data-project-status]');if(zone){e.preventDefault();e.dataTransfer.dropEffect='move';zone.classList.add('project-drop-target')}});
function endProjectDrag(){sidebarDragged=null;document.querySelectorAll('.project-drop-target,.project-dragging').forEach(el=>el.classList.remove('project-drop-target','project-dragging'))}
document.addEventListener('drop',e=>{if(!sidebarDragged)return;const zone=e.target.closest('[data-project-status]');if(zone){e.preventDefault();setProjectStatus(sidebarDragged,zone.dataset.projectStatus)}endProjectDrag()});
document.addEventListener('dragend',endProjectDrag);
render();
