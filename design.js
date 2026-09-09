/* Visual system inspired by the supplied reporting and spreadsheet references. */
const palette=['#7964ec','#2dabb3','#e49348','#d966a0','#648bdc','#8cae55'];
function donut(title,parts,totalLabel,totalValue){
 parts=parts.map((x,i)=>({...x,color:x.color||palette[i%palette.length]}));
 const positive=parts.filter(x=>x.value>0),total=positive.reduce((n,x)=>n+x.value,0);let cursor=0;
 const stops=positive.map((x,i)=>{const start=cursor;cursor+=x.value/(total||1)*100;return `${x.color||palette[i%palette.length]} ${start}% ${cursor}%`});
 return `<section class="card report-card"><div class="report-heading"><h3>${title}</h3><span class="report-unit">PLN</span></div><div class="donut-layout"><div class="donut" role="img" aria-label="${esc(title+': '+parts.map(x=>x.label+' '+cur(x.value)).join(', '))}" style="--segments:${stops.length?'conic-gradient('+stops.join(',')+')':'#edf0f6'}"><div><span>${totalLabel}</span><strong>${totalValue}</strong><small>${total?'Podział wartości dodatnich':'Brak danych'}</small></div></div><div class="report-legend">${parts.map((x,i)=>`<div><span class="legend-dot" style="background:${x.color||palette[i%palette.length]}"></span><span>${esc(x.label)}</span><strong>${cur(x.value)}</strong></div>`).join('')}</div></div></section>`;
}
financeCharts=function(p){const m=metrics(p);return `<div class="charts financial-reports">${donut('Struktura projektu',[{label:'Koszty zewnętrzne',value:m.actual},{label:'Zasoby BBF',value:m.internal},{label:'Overhead',value:m.overhead},{label:'Marża',value:m.margin}], 'Budżet projektu',cur(m.sales))}${bars('Plan i wykonanie',[{label:'Przewidywany koszt',value:m.planned},{label:'Koszty zewnętrzne',value:m.actual},{label:'Odchylenie od planu',value:m.deviation}])}</div>`};
renderDashboard=function(){
 $('#projectTitleHeader').textContent='Przegląd projektów';$('#projectStatusLabel').textContent='TWOJE STUDIO / PROJEKTY';
 const totals=state.projects.reduce((a,p)=>{const m=metrics(p);for(const k of ['sales','actual','internal','margin','retention','overhead'])a[k]=(a[k]||0)+m[k];return a},{sales:0,actual:0,internal:0,margin:0,retention:0,overhead:0});
 $('#view').innerHTML=`<div class="page dashboard"><div class="dashboard-intro"><div><span class="section-eyebrow">BIG BEAR FILM WORKSPACE</span><h2>Projekty studia.</h2><p>Od pierwszej wyceny do ostatniego rozliczenia.</p></div><button class="primary" id="newProject">${icon('plus')} Nowy projekt</button></div><div class="kpis dashboard-kpis">${kpi('◫ Aktywne projekty',state.projects.filter(p=>p.status!=='zakończone').length,'z '+state.projects.length+' projektów')}${kpi('◈ Łączny budżet',cur(totals.sales),'wartość netto')}${kpi('↳ Retencja BBF',cur(totals.retention),totals.sales?pct(totals.retention/totals.sales)+' budżetu':'—','positive')}${kpi('↗ Marża',cur(totals.margin),'po kosztach i overheadzie',totals.margin<0?'negative':'positive')}</div><div class="charts dashboard-reports">${donut('Gdzie pracuje Twój budżet',[{label:'Koszty zewnętrzne',value:totals.actual},{label:'Zasoby BBF',value:totals.internal},{label:'Overhead',value:totals.overhead},{label:'Marża',value:totals.margin}],'Budżet łącznie',cur(totals.sales))}<section class="card phase-report"><div class="report-heading"><h3>Produkcje według etapu</h3>${icon('layers')}</div>${statuses.map((st,i)=>{const ps=state.projects.filter(p=>p.status===st),amount=ps.reduce((n,p)=>n+metrics(p).sales,0);return `<div class="phase-row"><span class="status-dot status-${i}"></span><span>${st}</span><strong>${cur(amount)}</strong><b>${ps.length}</b></div>`}).join('')}<div class="phase-summary">${state.projects.length} projektów w Twoim studiu</div></section></div><div class="project-section-heading"><h3>Projekty</h3><span>${state.projects.length} w bazie</span></div><div class="project-cards">${state.projects.map(p=>{const m=metrics(p),i=statuses.indexOf(p.status);return `<button class="project-card" data-project="${p.id}"><div class="project-card-top"><span class="project-symbol">${icon('camera')}</span><span class="status-pill status-${i}">${p.status}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.client)} <span>·</span> ${esc(p.type)}</p><div class="project-card-numbers"><div><small>Budżet netto</small><strong>${cur(m.sales)}</strong></div><div><small>Marża</small><strong>${m.sales?pct(m.margin/m.sales):'—'}</strong></div></div><span class="project-open">Otwórz projekt ${icon('chevron')}</span></button>`}).join('')||'<div class="empty">Dodaj projekt, aby rozpocząć pierwszy kosztorys.</div>'}</div></div>`;
};
const decorateBase=decorateSheet;
decorateSheet=function(){decorateBase();const p=project(),meta=hierarchy(p);let subIndex=0;
 for(const tr of document.querySelectorAll('.sheet-page tbody tr[data-row]')){const r=p.rows.find(r=>r.id===tr.dataset.row);if(!r)continue;if(r.kind==='subcategory')subIndex++;const color=palette[(subIndex-1+palette.length)%palette.length];tr.style.setProperty('--section-accent',r.kind==='category'?'#787994':r.color||color);if(r.kind==='subcategory'){const label=tr.querySelector('.group-label');const i=p.rows.indexOf(r),items=p.rows.slice(i+1,blockEnd(p.rows,i)).filter(x=>x.kind==='item');label?.insertAdjacentHTML('beforeend',`<span class="section-count">${items.length} poz.</span><span class="section-amount">${cur(items.reduce((n,x)=>n+rowMetrics(x,p).sales,0))}</span>`)}
 if(state.ui.tab==='settlement')tr.querySelector('td.drag')?.remove();
 const type=tr.querySelector('.type-picker');if(type){type.classList.add('type-badge');type.dataset.typeTone=r.actualType==='BBF'?'bbf':r.actualType==='prowizja'?'fee':r.actualType?'external':'empty'}
 }
 if(state.ui.tab==='settlement')$('#settlementSheet thead th:first-child')?.remove();
};
const sidebarBase=renderSidebar;
renderSidebar=function(){sidebarBase();document.querySelectorAll('#projectGroups .group').forEach((group,i)=>{group.dataset.statusIndex=i;group.querySelector('.group-head span')?.insertAdjacentHTML('afterbegin',`<i class="status-dot status-${i}"></i>`)});document.querySelectorAll('.project-row').forEach(el=>{el.innerHTML=`<span class="side-project-icon">${icon('file')}</span><span>${esc(el.textContent)}</span>`})};
const polishBase=polishIcons;
polishIcons=function(){polishBase();const mark=$('.brand-mark');if(mark)mark.textContent='BBF';const sub=$('.brand span');if(sub)sub.textContent='Production workspace';document.querySelectorAll('.topbar-actions #exportMenuBtn').forEach(el=>{el.innerHTML=icon('file')+' <span>Eksport</span>'})};
const designRefreshBase=refreshNumbers;
refreshNumbers=function(){designRefreshBase();const p=project();for(const element of document.querySelectorAll('.section-amount')){const id=element.closest('tr').dataset.row,i=p.rows.findIndex(r=>r.id===id);element.textContent=cur(p.rows.slice(i+1,blockEnd(p.rows,i)).filter(r=>r.kind==='item').reduce((sum,r)=>sum+rowMetrics(r,p).sales,0))}};
// One block-aware drag controller owns both preview and insertion position.
let dragState=null;
function finishDrag(){document.querySelectorAll('.is-drag-source').forEach(el=>el.classList.remove('is-drag-source'));$('#dragGhost')?.remove();$('#dropIndicator')?.remove();dragState=null;dragged=null}
function dropCandidate(row,e){
 const p=project(),meta=hierarchy(p),source=p.rows.find(r=>r.id===dragged);let target=p.rows.find(r=>r.id===row.dataset.row);if(!source||!target||target.system)return null;
 if(source.kind==='category')target=p.rows.find(r=>r.id===meta.get(target.id).cat);
 if(source.kind==='subcategory'&&target.kind==='item')target=p.rows.find(r=>r.id===meta.get(target.id).sub);
 if(!target||source.kind!==target.kind)return null;
 const from=p.rows.indexOf(source),to=p.rows.indexOf(target);if(to>=from&&to<blockEnd(p.rows,from))return null;
 if(source.fixed&&meta.get(source.id).cat!==meta.get(target.id).cat)return null;
 const rect=row.getBoundingClientRect();return {id:target.id,after:e.clientY>rect.top+rect.height/2,name:target.name};
}
document.addEventListener('dragstart',e=>{
 const handle=e.target.closest('#estimateSheet [draggable="true"]');if(!handle)return;
 finishDrag();dragged=handle.closest('tr').dataset.row;const p=project(),i=p.rows.findIndex(r=>r.id===dragged),block=p.rows.slice(i,blockEnd(p.rows,i)),r=block[0];
 dragState={candidate:null};for(const item of block)document.querySelector(`tr[data-row="${item.id}"]`)?.classList.add('is-drag-source');
 const ghost=document.createElement('div');ghost.id='dragGhost';ghost.innerHTML=`<div class="drag-ghost-heading">${icon(r.kind==='item'?'file':'layers')}<div><strong>${esc(r.name)}</strong><small>${block.length===1?'1 pozycja':block.length+' elementów · cały blok'}</small></div></div><div class="drag-preview-rows">${block.slice(r.kind==='item'?0:1,5).map(x=>`<div>${icon(x.kind==='item'?'file':'folder')}<span>${esc(x.name)}</span></div>`).join('')}</div><div class="drag-destination">Wybierz miejsce wstawienia</div>`;
 document.body.append(ghost);ghost.style.left=Math.min(e.clientX+22,innerWidth-320)+'px';ghost.style.top=Math.min(e.clientY+16,innerHeight-200)+'px';
 const indicator=document.createElement('div');indicator.id='dropIndicator';indicator.hidden=true;document.body.append(indicator);
 e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragged);
 const native=document.createElement('div');native.className='native-drag-card';native.textContent=r.name+' · '+block.length+' el.';document.body.append(native);e.dataTransfer.setDragImage(native,15,15);setTimeout(()=>native.remove(),0);
 $('#contextMenu').classList.remove('open');
});
document.addEventListener('dragover',e=>{
 if(!dragState)return;e.preventDefault();const ghost=$('#dragGhost'),line=$('#dropIndicator');ghost.style.left=Math.max(8,Math.min(e.clientX+24,innerWidth-320))+'px';ghost.style.top=Math.max(8,Math.min(e.clientY+20,innerHeight-ghost.offsetHeight-8))+'px';
 const row=e.target.closest('#estimateSheet tbody tr');const candidate=row?dropCandidate(row,e):null;dragState.candidate=candidate;line.hidden=!candidate;e.dataTransfer.dropEffect=candidate?'move':'none';ghost.classList.toggle('invalid-drop',!candidate);
 ghost.querySelector('.drag-destination').textContent=candidate?(candidate.after?'Za: ':'Przed: ')+candidate.name:'Wybierz inną sekcję lub pozycję';
 if(!candidate)return;
 const shell=$('.sheet-page .table-shell'),rect=shell.getBoundingClientRect(),p=project(),index=p.rows.findIndex(r=>r.id===candidate.id);let target=document.querySelector(`#estimateSheet tr[data-row="${candidate.id}"]`);
 if(candidate.after){const ids=p.rows.slice(index,blockEnd(p.rows,index)).map(r=>r.id);target=[...document.querySelectorAll('#estimateSheet tbody tr')].filter(tr=>ids.includes(tr.dataset.row)&&!tr.hidden).at(-1)||target}
 const box=target.getBoundingClientRect(),y=candidate.after?box.bottom:box.top;line.style.left=(rect.left+2)+'px';line.style.width=(rect.width-4)+'px';line.style.top=Math.max(rect.top+32,Math.min(y,rect.bottom-3))+'px';
 if(e.clientY>rect.bottom-40)shell.scrollTop+=14;else if(e.clientY<rect.top+65)shell.scrollTop-=14;
});
document.addEventListener('drop',e=>{if(!dragState)return;e.preventDefault();const c=dragState.candidate,id=dragged;if(c&&moveBlock(id,c.id,c.after)){dirty('Przeniesiono blok');finishDrag();render()}else finishDrag()});
document.addEventListener('dragend',finishDrag);
document.addEventListener('keydown',e=>{if(e.key==='Escape')finishDrag()});
render();
