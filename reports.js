/* Shared project KPIs, targets and comparative reports. */
function projectKpis(p,sheet=false){
 const m=metrics(p),specs=[['sales','Budżet','grid','Przychód netto'],['planned','Przewidywany koszt','clock','Koszty zewnętrzne'],['actual','Koszty zewnętrzne','chart','Wykonanie'],['internal','Zasoby BBF','layers','Według cennika'],['overhead','Overhead','info',pct(p.overheadRate)],['retention','Retencja','chart',''],['margin','Marża','chart',''],['deviation','Odchylenie','chart','Przewidywany − rzeczywisty']];
 return `<div class="kpis info-kpis unified-kpis ${sheet?'sheet-kpis':''}">${specs.map(([key,label,symbol,sub])=>{
 let tone='',note='';const measured=m[key],target=state.targets?.[key];
 if(['margin','retention'].includes(key)){
  sub=m.sales>0?pct(measured/m.sales)+' przychodu':'Brak przychodu do oceny';
  if(m.sales>0){if(target!==null&&target!==undefined&&target!==''){
   const missing=Math.max(0,m.sales*num(target)-measured),pp=missing/m.sales*100;tone=missing>.005?'negative':'positive';note=missing>.005?`Do celu ${pct(target)} brakuje ${pp.toLocaleString('pl-PL',{maximumFractionDigits:2})} p.p. (${cur(missing)})`:`Cel ${pct(target)} osiągnięty`;
  }else tone=measured<0?'negative':'positive'}
 }else if(key==='deviation')tone=measured<0?'negative':'positive';
 return `<div class="kpi ${tone}" data-kpi="${key}"><div class="label">${icon(symbol)}<span>${label}</span></div><div class="value">${cur(measured)}</div><div class="sub">${sub}</div>${note?`<div class="target-note">${note}</div>`:''}</div>`
 }).join('')}</div>`;
}
summaryKpis=function(p){return projectKpis(p,true)};
const reportInfo=renderInfo;
renderInfo=function(){reportInfo();$('#projectIconPicker')?.closest('.field').remove();$('.info-primary')?.classList.add('without-project-icon');$('.info-kpis').outerHTML=projectKpis(project())};
const reportSettings=renderSettings;
renderSettings=function(){reportSettings();$('.page').insertAdjacentHTML('afterbegin',`<section class="card target-settings"><h3>${icon('chart')} Cele finansowe</h3><p>Docelowy udział w przychodzie netto projektu. Puste pole wyłącza ocenę względem celu.</p><div class="target-fields">${[['margin','Docelowa marża'],['retention','Docelowa retencja']].map(([key,label])=>`<div class="field"><label>${label}</label><div class="overhead-percent"><input data-target="${key}" inputmode="decimal" aria-label="${label} w procentach" placeholder="Ustaw cel" value="${state.targets?.[key]==null?'':+(num(state.targets[key])*100).toFixed(4)}"><span>%</span></div></div>`).join('')}</div></section>`)};
document.addEventListener('input',e=>{if(!e.target.dataset.target)return;state.targets??={};const value=e.target.value.trim();state.targets[e.target.dataset.target]=value===''?null:Math.max(0,num(value.replace('%','')))/100;dirty('Zmieniono cel finansowy')});
const reportDecorate=decorateSheet;
decorateSheet=function(){reportDecorate();const table=$('#estimateSheet');if(table){const symbols=['','file','file','file','plus','chart','clock','chart',''];[...table.tHead.rows[0].cells].forEach((th,i)=>{if(symbols[i]&&!th.querySelector('.ui-icon'))th.insertAdjacentHTML('afterbegin',icon(symbols[i])+' ')})}};
const reportCrew=renderCrew;
renderCrew=function(){reportCrew();const shell=$('.crew-page .table-shell'),table=shell.querySelector('table'),meta=hierarchy(project()),rows=[...table.tBodies[0].rows];
 const sections=document.createElement('div');sections.className='crew-sections';
 for(const [key,title,symbol] of [['crew','Ekipa','users'],['cast','Obsada','star']]){
  const section=document.createElement('section');section.className='crew-section';section.dataset.crewSection=key;
  const list=rows.filter(tr=>meta.get(tr.querySelector('[data-role-id]')?.dataset.roleId)?.crew===key);
  section.innerHTML=`<h3>${icon(symbol)} ${title}<span>${list.length} ról</span></h3><div class="table-shell"></div>`;
  const cloneTable=table.cloneNode(false);cloneTable.append(table.tHead.cloneNode(true));const lp=document.createElement('th');lp.textContent='Lp.';cloneTable.tHead.rows[0].prepend(lp);const body=document.createElement('tbody');
  list.forEach((tr,i)=>{const cell=document.createElement('td');cell.className='crew-lp';cell.textContent=String(i+1);tr.prepend(cell);body.append(tr)});
  if(!list.length)body.innerHTML='<tr><td colspan="7" class="empty-crew">Brak ról w tej sekcji.</td></tr>';
  cloneTable.append(body);section.querySelector('.table-shell').append(cloneTable);sections.append(section);
 }
 shell.replaceWith(sections);
};
function clientBars(parts){
 const width=640,left=150,right=558,min=Math.min(0,...parts.map(p=>p.value)),max=Math.max(1,...parts.map(p=>p.value)),x=v=>left+(v-min)/(max-min)*(right-left),zero=x(0),height=65+parts.length*42,ticks=Array.from({length:5},(_,i)=>min+(max-min)*i/4);
 return `<section class="card client-bar-report"><div class="report-heading"><h3>Przychód według klientów</h3><span class="report-unit">PLN · ${reportingYear}</span></div><div class="scaled-chart"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Przychód według klientów, skala w złotych">${ticks.map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="27" y2="${height-12}" stroke="#e5edf6"/><text x="${x(v)}" y="15" text-anchor="middle" font-size="10" fill="#718ba6">${Math.round(v).toLocaleString('pl-PL')}</text>`).join('')}${parts.map((part,i)=>`<text x="138" y="${54+i*42}" text-anchor="end" font-size="11" fill="#405d7c">${esc(part.label.length>21?part.label.slice(0,20)+'…':part.label)}<title>${esc(part.label)}</title></text><rect x="${Math.min(zero,x(part.value))}" y="${38+i*42}" width="${Math.abs(x(part.value)-zero)}" height="24" rx="4" fill="#6398d5"><title>${esc(part.label)}: ${cur(part.value)}</title></rect><text x="630" y="${54+i*42}" text-anchor="end" font-size="10" fill="#405d7c">${Math.round(part.value).toLocaleString('pl-PL')}</text>`).join('')}</svg></div>${parts.length?'':'<p>Brak projektów w wybranym roku.</p>'}</section>`;
}
function yearComparison(){
 const years=[...new Set(state.projects.map(p=>reportDate(p).getFullYear()).filter(Number.isFinite))].sort((a,b)=>a-b),totals=new Map(years.map(year=>[year,Object.fromEntries(annualSeries.map(([k])=>[k,0]))]));
 state.projects.forEach(p=>{const bucket=totals.get(reportDate(p).getFullYear());if(!bucket)return;const m=metrics(p);for(const [k] of annualSeries)bucket[k]+=m[k]});
 return `<section class="card year-comparison"><h3>Podsumowanie rok do roku</h3><p>Wszystkie lata występujące w bazie · kwoty netto</p><div class="year-table-scroll"><table><thead><tr><th>Wynik</th>${years.map(year=>`<th>${year}</th>`).join('')}</tr></thead><tbody>${annualSeries.map(([key,label,color])=>`<tr><th><i style="background:${color}"></i>${label}</th>${years.map(year=>`<td>${cur(totals.get(year)[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${years.length?'':'<p>Dodaj projekt, aby zobaczyć porównanie lat.</p>'}</section>`;
}
const reportAnnual=annualReports;
annualReports=function(){
 const template=document.createElement('template');template.innerHTML=reportAnnual();const yearly=template.content.querySelector('.annual-report');const pair=document.createElement('div');pair.className='annual-comparison-layout';yearly.replaceWith(pair);pair.append(yearly);pair.insertAdjacentHTML('beforeend',yearComparison());
 const clients=new Map();state.projects.filter(p=>reportDate(p).getFullYear()===reportingYear).forEach(p=>clients.set(p.client||'Nieprzypisany',(clients.get(p.client||'Nieprzypisany')||0)+metrics(p).sales));
 const first=template.content.querySelector('.client-type-reports .report-card');first.outerHTML=clientBars([...clients].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value));return template.innerHTML;
};
const reportDashboard=renderDashboard;
renderDashboard=function(){reportDashboard();document.querySelectorAll('.project-card .project-symbol').forEach(el=>el.remove());const cards=$('.project-cards');if(cards){cards.setAttribute('tabindex','0');cards.setAttribute('aria-label','Projekty — przewijaj w lewo i w prawo');cards.insertAdjacentHTML('beforebegin','<div class="project-carousel-controls"><button class="ghost" data-scroll-projects="-1" aria-label="Poprzednie projekty">‹</button><button class="ghost" data-scroll-projects="1" aria-label="Następne projekty">›</button></div>')}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-scroll-projects]');if(b)$('.project-cards')?.scrollBy({left:Number(b.dataset.scrollProjects)*300,behavior:'smooth'})});
render();
