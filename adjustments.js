// Currency stays numeric in storage; only the inactive editor displays PLN.
const moneySelector='input[data-cell="unit"],input[data-cell="plannedUnit"],input[data-cell="actualNet"],input[data-person-field="defaultRate"],input[data-price][data-pkey="cost"],input[data-price][data-pkey="retention"]';
function formatMoneyEditors(){document.querySelectorAll(moneySelector).forEach(el=>{if(el!==document.activeElement)el.value=cur(el.value)})}
document.addEventListener('focusin',e=>{if(e.target.matches(moneySelector)){e.target.value=String(num(e.target.value));e.target.select()}},true);
document.addEventListener('focusout',e=>{if(e.target.matches(moneySelector))e.target.value=cur(e.target.value)});
const currencySheet=sheetPage;sheetPage=function(mode){currencySheet(mode);formatMoneyEditors()};
const currencySettings=renderSettings;renderSettings=function(){currencySettings();formatMoneyEditors()};
const currencyRender=render;render=function(){currencyRender();formatMoneyEditors()};
let personPickerRole=null,personPickerIndex=0;
function closePersonPicker(){ $('#personPicker')?.remove();personPickerRole=null }
function showPersonPicker(input){
 $('#personPicker')?.remove();personPickerRole=input.dataset.personQuery;personPickerIndex=0;
 const q=input.value.trim(),matches=state.crew.filter(p=>p.name.toLocaleLowerCase('pl').includes(q.toLocaleLowerCase('pl')));
 const menu=document.createElement('div');menu.id='personPicker';menu.setAttribute('role','listbox');
 menu.innerHTML=matches.map(p=>`<button type="button" role="option" data-pick-person="${p.id}"><span>${esc(p.name)}</span><small>${esc([p.role,p.phone,p.email].filter(Boolean).join(' · '))}</small></button>`).join('')+(q&&!state.crew.some(p=>p.name.toLocaleLowerCase('pl')===q.toLocaleLowerCase('pl'))?`<button role="option" data-add-person-name="${esc(q)}" class="add-person-suggestion">${icon('plus')} Dodaj osobę: ${esc(q)}</button>`:'');
 if(!menu.innerHTML)menu.innerHTML='<div class="no-person-match">Wpisz imię i nazwisko, aby dodać osobę.</div>';
 document.body.append(menu);const rect=input.getBoundingClientRect();menu.style.width=Math.min(Math.max(rect.width,280),innerWidth-16)+'px';menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(rect.bottom+4,innerHeight-menu.offsetHeight-8))+'px';
 input.setAttribute('aria-expanded','true');highlightPersonOption();
}
function highlightPersonOption(){const options=[...document.querySelectorAll('#personPicker button')];options.forEach((b,i)=>b.classList.toggle('highlighted',i===personPickerIndex))}
function assignCrewPerson(id,newName=''){
 const row=project().rows.find(r=>r.id===personPickerRole);if(!row)return;
 let person=state.crew.find(p=>p.id===id);
 if(!person&&newName){person={id:uid(),name:newName,role:row.name,phone:'',email:'',defaultType:'faktura',defaultRate:0};state.crew.push(person)}
 if(!person)return;
 row.personId=person.id;row.actualType=person.defaultType;row.actualNet=num(person.defaultRate);
 const price=state.priceList.find(p=>p.person===person.name);
 row.bbfPriceId=person.defaultType==='BBF'?price?.id||'':'';row.bbfItem=person.defaultType==='BBF'?price?.name||'':'';
 if(person.defaultType==='BBF')row.actualNet=0;
 const roleId=row.id;closePersonPicker();dirty('Przypisano osobę: '+person.name+' — '+row.name);renderCrew();document.querySelector(`[data-person-query="${roleId}"]`)?.focus();closePersonPicker();document.querySelector(`[data-person-query="${roleId}"]`)?.setAttribute('aria-expanded','false');
}
renderCrew=function(){const p=project(),meta=hierarchy(p),roles=p.rows.filter(r=>r.kind==='item'&&meta.get(r.id).crew);
 $('#view').innerHTML=`<div class="page crew-page"><div class="section-title"><h2>${icon('users')} Ekipa i obsada</h2></div><div class="table-shell"><table class="sheet crew-sheet"><thead><tr><th>Rola</th><th>Imię i nazwisko</th><th>${icon('phone')} Telefon</th><th>${icon('mail')} E-mail</th><th>Domyślna forma osoby</th><th>Stawka domyślna</th></tr></thead><tbody>${roles.map(r=>{const person=state.crew.find(c=>c.id===r.personId);return `<tr><td><input data-crew-key="role" data-role-id="${r.id}" value="${esc(r.name)}" aria-label="Rola w projekcie"></td><td><input data-crew-key="assignment" data-person-query="${r.id}" value="${esc(person?.name||'')}" placeholder="Wpisz imię i nazwisko…" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-label="Osoba: ${esc(r.name)}" autocomplete="off"></td>${['phone','email','defaultType','defaultRate'].map(k=>`<td>${personCell(person,k,r.id)}</td>`).join('')}</tr>`}).join('')||'<tr><td colspan="6">Dodaj role w kosztorysie.</td></tr>'}</tbody></table></div></div>`;
 formatMoneyEditors();
};
document.addEventListener('focusout',e=>{const input=e.target;if(input.dataset.personQuery){const row=project()?.rows.find(r=>r.id===input.dataset.personQuery);input.value=state.crew.find(p=>p.id===row?.personId)?.name||'';input.setAttribute('aria-expanded','false');closePersonPicker()}});
document.addEventListener('input',e=>{if(e.target.dataset.personQuery)showPersonPicker(e.target)});
document.addEventListener('focusin',e=>{if(e.target.dataset.personQuery)showPersonPicker(e.target)});
document.addEventListener('pointerdown',e=>{if(e.target.closest('#personPicker'))e.preventDefault()});
document.addEventListener('click',e=>{
 const button=e.target.closest('#personPicker button');if(button){assignCrewPerson(button.dataset.pickPerson,button.dataset.addPersonName);return}
 if(!e.target.closest('[data-person-query]')){document.querySelectorAll('[data-person-query]').forEach(input=>{const row=project()?.rows.find(r=>r.id===input.dataset.personQuery);input.value=state.crew.find(p=>p.id===row?.personId)?.name||'';input.setAttribute('aria-expanded','false')});closePersonPicker()}
});
document.addEventListener('keydown',e=>{
 if(!e.target.dataset.personQuery)return;const options=[...document.querySelectorAll('#personPicker button')];
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closePersonPicker();return}
 if(options.length&&['ArrowDown','ArrowUp','Enter'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key==='Enter')options[personPickerIndex]?.click();else{personPickerIndex=(personPickerIndex+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;highlightPersonOption()}}
},true);
render();
document.addEventListener('input',e=>{if(e.target.dataset.personField==='defaultRate')formatMoneyEditors()});
