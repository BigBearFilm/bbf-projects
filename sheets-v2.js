/* Spreadsheet interaction and dated production tariffs. */
(() => {
 Object.assign(paths,{search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'});
 const findRow=(id,p=project())=>p?.rows.flatMap(r=>[r,...(r.settlements||[])]).find(r=>r.id===id);
 const parentOf=id=>project()?.rows.find(r=>r.settlements?.some(s=>s.id===id));
 const numeric=new Set(['unit','qty','plannedUnit','actualNet']);
 const books=()=>state.priceBooks?.length?state.priceBooks:[{id:'legacy',name:'Cennik podstawowy',validFrom:'0001-01-01',items:state.priceList||[]}];
 function activeBook(p=project(),r){const date=p?.dates?.shoot||p?.createdAt?.slice(0,10)||today();return [...books()].filter(b=>b.validFrom<=date).sort((a,b)=>b.validFrom.localeCompare(a.validFrom))[0]}
 priceFor=function(r,p=project()){return activeBook(p,r)?.items.find(x=>r.bbfPriceId?x.id===r.bbfPriceId:x.name===r.bbfItem)};
 const oldActual=calcActualCost;
 calcActualCost=function(r,p=project()){
  if(r.settlements?.length)return r.settlements.reduce((n,s)=>n+calcActualCost(s,p),0);
  if(r.actualType==='Rental BBF')return 0;
  if(r.actualType==='administracja'){
   const rows=p.rows.flatMap(x=>x.settlements?.length?x.settlements:[x]);
   return new Set(rows.filter(x=>['umowa o dzieło','umowa zlecenie','umowa zlecenie - student'].includes(x.actualType)).map(x=>x.contractId||x.id)).size*50;
  }
  if(r.actualType==='BBF')return num(priceFor(r,p)?.cost)*num(r.qty);
  return oldActual(r.isSettlementChild?{...r,actualNet:num(r.actualNet)*num(r.qty)}:r,p);
 };
 calcBBFValue=function(r,p=project()){
  if(r.settlements?.length)return r.settlements.reduce((n,s)=>n+calcBBFValue(s,p),0);
  return r.actualType==='Rental BBF'?num(r.actualNet)*num(r.qty):r.actualType==='BBF'?num(priceFor(r,p)?.retention)*num(r.qty):0;
 };
 rowMetrics=function(r,p=project()){
  const sales=r.system?commissionAmount(p):num(r.unit)*num(r.qty),planned=r.system?0:num(r.plannedUnit)*num(r.qty);
  const actual=r.system?0:calcActualCost(r,p),internal=r.system?0:calcBBFValue(r,p),overhead=sales*num(p.overheadRate);
  return {sales,planned,actual,internal,overhead,retention:sales-actual,margin:sales-actual-internal-overhead,deviation:planned-actual};
 };
 if(!types.includes('Rental BBF'))types.splice(types.indexOf('BBF')+1,0,'Rental BBF');
 contractIcons['Rental BBF']='camera';
 const snapshot=dataSnapshot;dataSnapshot=function(){return {...snapshot(),priceBooks:state.priceBooks||[],costDictionary:state.costDictionary||[]}};
 function learnDescriptions(){state.costDictionary=[...new Set([...(state.costDictionary||[]),...state.projects.flatMap(p=>p.rows.flatMap(r=>[r,...(r.settlements||[])]).filter(r=>(r.kind==='item'||r.isSettlementChild)&&!r.system).map(r=>r.name?.trim()).filter(Boolean))])];}
 function typeLabel(r){return r.settlements?.length?'Suma podpozycji':r.actualType==='BBF'?'BBF / '+(priceFor(r)?.name||'Brak stawki'):r.actualType||'Wybierz typ'}
 function field(r,k,ro=false){return '<input data-cell="'+k+'" data-rowid="'+r.id+'" aria-label="'+esc(r.name)+' — '+k+'" '+(numeric.has(k)?'inputmode="decimal" ':'')+(ro?'readonly ':'')+'value="'+esc(numeric.has(k)?(k==='qty'?num(r[k]):cur(r[k])):r[k]||'')+'">'}
 function typeButton(r,disabled=false){return '<button class="type-picker" data-cell="actualType" data-rowid="'+r.id+'" '+(disabled?'disabled ':'')+'aria-haspopup="menu">'+icon(contractIcons[r.actualType]||'file')+' '+esc(typeLabel(r))+'</button>'}
 settlementTable=function(p){
  const meta=hierarchy(p);
  const html=p.rows.map(r=>{
   const h=meta.get(r.id),m=rowMetrics(r,p);
   if(r.kind!=='item')return '<tr class="'+r.kind+'" data-row="'+r.id+'" '+(isRowHidden(r,p,meta)?'hidden':'')+' style="--row-color:'+h.color+'"><td class="lp">'+h.lp+'</td><td colspan="13"><div class="group-label"><button class="fold-button" data-fold="'+r.id+'">'+icon('chevron')+'</button><span>'+icon(r.icon||'folder')+' '+esc(r.name)+'</span></div></td></tr>';
   const hidden=isRowHidden(r,p,meta),split=r.settlements?.length;
   const main='<tr data-row="'+r.id+'" '+(hidden?'hidden':'')+' class="'+(split?'split-parent':'')+'"><td class="lp">'+h.lp+'</td><td class="name">'+field(r,'name',true)+(split?'<button class="sub-toggle '+(state.ui.splitFold?.[r.id]?'folded':'')+'" data-split-fold="'+r.id+'" aria-label="Zwiń lub rozwiń podpozycje" aria-expanded="'+!state.ui.splitFold?.[r.id]+'">'+icon('chevron')+'</button>':'')+'</td><td>'+num(r.qty)+'</td><td>'+cur(r.unit)+'</td><td>'+cur(m.sales)+'</td><td>'+cur(r.plannedUnit)+'</td><td>'+cur(m.planned)+'</td><td>'+typeButton(r,r.system||split)+'</td><td>'+field(split?{...r,actualNet:r.settlements.reduce((n,s)=>n+num(s.actualNet)*num(s.qty),0)}:r,'actualNet',r.system||split||['BBF','administracja'].includes(r.actualType))+'</td>'+['actual','internal','overhead','margin','retention'].map(k=>'<td class="num computed '+(k==='actual'?'calculation-start':'')+'" data-metric="'+k+'">'+cur(m[k])+'</td>').join('')+'</tr>';
   return main+(r.settlements||[]).map((s,i)=>'<tr class="settlement-child" data-row="'+s.id+'" '+(hidden||state.ui.splitFold?.[r.id]?'hidden':'')+'><td class="lp">'+h.lp+'.'+(i+1)+'</td><td class="name">'+field(s,'name')+'</td><td>'+field(s,'qty')+'</td>'+Array.from({length:4},()=>'<td class="child-empty"></td>').join('')+'<td>'+typeButton(s)+'</td><td>'+field(s,'actualNet',['BBF','administracja'].includes(s.actualType))+'</td><td class="num calculation-start" data-child-actual="'+s.id+'">'+cur(calcActualCost(s,p))+'</td><td class="num" data-child-internal="'+s.id+'">'+cur(calcBBFValue(s,p))+'</td><td></td><td></td><td></td></tr>').join('');
  }).join('');
  return '<table class="sheet v2-settlement" id="settlementSheet"><thead><tr>'+['Lp.','Opis kosztów','Ilość','Kosztorys / szt.','Kosztorys','Przewidywany / szt.','Przewidywany koszt','Typ rozliczenia','Stawka netto','Koszt rzeczywisty','Zasób BBF','Overhead','Marża','Retencja'].map((s,i)=>'<th class="'+(i>=9?'calculation-header ':'')+(i===9?'calculation-start':'')+'">'+icon(i===7?'contract':i>=9?'chart':'file')+' '+s+'</th>').join('')+'</tr></thead><tbody>'+html+'</tbody></table>';
 };
 const decorate=decorateSheet;
 decorateSheet=function(){if(state.ui.tab==='settlement'){
  const p=project(),meta=hierarchy(p);$('#settlementSheet')?.querySelectorAll('tr[data-row]').forEach(tr=>{const r=findRow(tr.dataset.row,p);if(r?.kind==='subcategory')tr.style.setProperty('--section-accent',r.color||palette[p.rows.filter(x=>x.kind==='subcategory').indexOf(r)%palette.length]);});
 }else decorate()};
 function redraw(){const shell=$('.sheet-page .table-shell'),xy=[shell?.scrollLeft||0,shell?.scrollTop||0];render();$('.sheet-page .table-shell')?.scrollTo(...xy)}
 function splitRow(id){const r=findRow(id);if(!r||r.system)return;const p=parentOf(id)||r;
  if(!p.settlements?.length){p.settlements=[{id:uid(),isSettlementChild:true,name:p.name,qty:p.actualType==='BBF'||p.actualType==='Rental BBF'?num(p.qty):1,actualType:p.actualType,actualNet:p.actualNet,bbfPriceId:p.bbfPriceId,bbfItem:p.bbfItem,personId:p.personId,contractId:p.contractId}];}
  p.settlements.push({id:uid(),isSettlementChild:true,name:'',qty:1,actualType:'',actualNet:0});dirty('Dodano podpozycję');redraw();
 }
 const context=openContext;
 openContext=function(id,rect){$('#typeMenu')?.remove();if(state.ui.tab!=='settlement')return context(id,rect);const r=findRow(id);if(!r||r.system)return;state.ui.contextRow=id;const menu=$('#contextMenu');menu.innerHTML=(r.kind==='item'||r.isSettlementChild)?'<button data-split-add="'+id+'">'+icon('plus')+' Dodaj podpozycję</button>'+(parentOf(id)?'<button data-split-remove="'+id+'">Usuń podpozycję</button>':'')+'<button data-grid-copy>Kopiuj zaznaczenie</button><button data-grid-paste>Wklej</button>':'<button data-fold="'+id+'">Zwiń / rozwiń</button>';menu.classList.add('open');menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-260))+'px';menu.style.top=Math.max(8,Math.min(rect.bottom,innerHeight-180))+'px'};
 let pickerOrigin=null;
 openTypePicker=function(button){
  const r=findRow(button.dataset.rowid);if(!r||r.system||r.settlements?.length)return;pickerOrigin=button.dataset.rowid;typeRow=pickerOrigin;$('#typeMenu')?.remove();
  const menu=document.createElement('div');menu.id='typeMenu';menu.className='type-menu stable-type-menu';
  const list=activeBook(project(),r);menu.innerHTML='<div class="type-options" role="menu">'+types.filter(t=>t!=='BBF').map(t=>'<button role="menuitem" data-v2-type="'+esc(t)+'">'+icon(contractIcons[t]||'file')+' '+esc(t||'Bez typu')+'</button>').join('')+'<button role="menuitem" id="bbfBranch" aria-haspopup="menu" aria-expanded="false">'+icon('studio')+' BBF ›</button></div><div class="price-options" role="menu" hidden><strong>'+esc(list?.name||'Brak cennika na tę datę')+'</strong>'+(list?.items||[]).map(x=>'<button role="menuitem" data-v2-price="'+x.id+'">'+esc(x.name)+'<small>'+cur(x.retention)+'</small></button>').join('')+'</div>';
  document.body.append(menu);const rect=button.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(rect.bottom,innerHeight-menu.offsetHeight-8))+'px';
  const show=()=>{menu.querySelector('.price-options').hidden=false;$('#bbfBranch').setAttribute('aria-expanded','true')};$('#bbfBranch').onmouseenter=show;$('#bbfBranch').onclick=()=>{show();menu.querySelector('[data-v2-price]')?.focus()};
  menu.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Escape','Enter',' '].includes(e.key))return;e.preventDefault();e.stopPropagation();const a=document.activeElement;if(e.key==='Escape'){menu.remove();selectId(pickerOrigin,'actualType');return}if(e.key==='Enter'||e.key===' '){a.click();return}if(e.key==='ArrowRight'&&a.id==='bbfBranch'){show();menu.querySelector('[data-v2-price]')?.focus();return}if(e.key==='ArrowLeft'){menu.querySelector('.price-options').hidden=true;$('#bbfBranch').focus();return}const pane=a.closest('.price-options')||menu.querySelector('.type-options'),buttons=[...pane.querySelectorAll('button')],i=buttons.indexOf(a);buttons[(i+(e.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length]?.focus()});
  menu.querySelector('button').focus();
 };
 function setType(r,type,id=''){r.actualType=type;r.bbfPriceId=id;r.bbfItem=activeBook(project(),r)?.items.find(x=>x.id===id)?.name||'';if(type==='BBF')r.actualNet=0}
 function confirmAction(title,text,action){showModal('<h3>'+esc(title)+'</h3><p>'+esc(text)+'</p><div class="modal-actions"><button id="cancelAction" class="ghost">Anuluj</button><button id="confirmAction" class="primary">Usuń</button></div>');$('#cancelAction').onclick=closeModal;$('#confirmAction').onclick=()=>{closeModal();action()}}
 const remove=removeProject;removeProject=function(id){const p=state.projects.find(p=>p.id===id);if(p)confirmAction('Usunąć projekt?',p.title+' — usunięte zostaną również kosztorys, rozliczenie i przypisania ekipy.',()=>remove(id))};
 const del=deleteRow;deleteRow=function(id){const r=findRow(id);if(state.ui.tab==='settlement')return false;if(r&&r.kind!=='item'){if(hierarchy(project()).get(id)?.protected)return false;confirmAction('Usunąć sekcję?',r.name+' wraz ze wszystkimi pozycjami.',()=>del(id));return false}return del(id)};
 function duplicateDialog(){const source=project();showModal('<h3>Duplikuj projekt</h3><div class="duplicate-options">'+[['info','Informacje',true],['estimate','Kosztorys',true],['settlement','Rozliczenie',false],['crew','Przypisania ekipy',false]].map(([k,label,on])=>'<label><input type="checkbox" data-duplicate-part="'+k+'" '+(on?'checked':'')+'> '+label+'</label>').join('')+'</div><p id="duplicateHint"></p><div class="modal-actions"><button class="ghost" onclick="closeModal()">Anuluj</button><button class="primary" id="confirmDuplicate">Utwórz kopię</button></div>');
  $('#confirmDuplicate').onclick=()=>{const has=k=>$('#modal [data-duplicate-part="'+k+'"]').checked,p=has('info')?clone(source):{title:source.title,client:'',type:'reklama',dates:{},status:'wycenione',marginRate:.1,overheadRate:.1,notes:''};p.id=uid();p.title+=' — kopia';p.createdAt=new Date().toISOString();delete p.migrationSource;p.rows=has('estimate')||has('settlement')||has('crew')?clone(source.rows):[];const contracts=new Map();for(const r of p.rows){r.id=uid();if(!has('settlement')){r.actualType='';r.actualNet=0;r.bbfPriceId='';r.bbfItem='';delete r.settlements;delete r.contractId}for(const s of [r,...(r.settlements||[])]){if(s!==r)s.id=uid();if(s.contractId){if(!contracts.has(s.contractId))contracts.set(s.contractId,uid());s.contractId=contracts.get(s.contractId)}if(!has('crew'))delete s.personId;}}ensureStructure(p);state.projects.push(p);state.ui.selectedProject=p.id;state.ui.tab='info';dirty('Zduplikowano projekt');closeModal();render()};
  $('#modal').onchange=()=>{if(!$('#duplicateHint'))return;$('#duplicateHint').textContent=[...$('#modal').querySelectorAll('[data-duplicate-part="settlement"],[data-duplicate-part="crew"]')].some(x=>x.checked)?'Rozliczenie i przypisania wymagają skopiowania struktury kosztorysu.':''};
 }
 let bookId='legacy';
 function tariffSettings(){const list=books(),selected=list.find(x=>x.id===bookId)||list[0];bookId=selected.id;const section=document.createElement('section');section.className='card tariff-settings';section.innerHTML='<div class="section-title"><h3>Cenniki BBF</h3><button id="newPriceBook" class="primary">Nowy cennik</button></div><div class="tariff-controls"><select id="priceBookSelect" aria-label="Cennik">'+list.map(b=>'<option value="'+b.id+'" '+(b.id===bookId?'selected':'')+'>'+esc(b.name)+' · '+b.validFrom+'</option>').join('')+'</select><input id="priceBookName" aria-label="Nazwa cennika" value="'+esc(selected.name)+'"><label>Ważny od <input type="date" id="priceBookDate" value="'+selected.validFrom+'"></label></div><p>Do rozliczenia używana jest data zdjęć projektu. Kolejny cennik kończy ważność poprzedniego.</p><div class="table-shell"><table class="sheet"><thead><tr><th>Pozycja</th><th>Koszt</th><th>Zasób BBF</th><th>Osoba</th><th>Godziny</th></tr></thead><tbody>'+selected.items.map(x=>'<tr>'+['name','cost','retention','person','hours'].map(k=>'<td><input data-tariff="'+x.id+'" data-tariff-key="'+k+'" value="'+esc(x[k])+'"></td>').join('')+'</tr>').join('')+'</tbody></table></div><button id="addTariff">Dodaj pozycję</button>';
  const old=$('#addPrice')?.closest('.page');if(old){$('#addPrice').closest('.section-title')?.remove();old.querySelector('table')?.closest('.table-shell')?.remove();}$('.page').prepend(section);
  const persist=()=>{if(!state.priceBooks?.length)state.priceBooks=clone(list);return state.priceBooks.find(x=>x.id===bookId)};
  $('#priceBookSelect').onchange=e=>{bookId=e.target.value;renderSettings()};
  $('#newPriceBook').onclick=()=>{showModal('<h3>Nowy cennik</h3><div class="field"><label>Nazwa</label><input id="bookName" value="Nowy cennik"></div><div class="field"><label>Ważny od</label><input id="bookDate" type="date" value="'+today()+'"></div><p>Pozycje i stawki zostaną skopiowane z wybranego cennika.</p><p id="bookError"></p><button class="primary" id="createBook">Utwórz</button>');$('#createBook').onclick=()=>{const date=$('#bookDate').value;if(!date||books().some(b=>b.validFrom===date)){$('#bookError').textContent='Wybierz niepowtarzającą się datę.';return}persist();const b={id:uid(),name:$('#bookName').value.trim()||'Cennik',validFrom:date,items:clone(selected.items)};state.priceBooks.push(b);bookId=b.id;dirty('Dodano cennik');closeModal();renderSettings()}};
  $('#priceBookDate').onchange=e=>{if(!e.target.value||books().some(b=>b.id!==bookId&&b.validFrom===e.target.value)){e.target.value=selected.validFrom;return}persist().validFrom=e.target.value;dirty('Zmieniono ważność cennika')};
  $('#priceBookName').onchange=e=>{persist().name=e.target.value.trim()||selected.name;dirty('Zmieniono nazwę cennika')};
  section.querySelectorAll('[data-tariff]').forEach(el=>el.onchange=()=>{const row=persist().items.find(x=>x.id===el.dataset.tariff),key=el.dataset.tariffKey;row[key]=['cost','retention','hours'].includes(key)?Math.max(0,num(el.value)):el.value;if(bookId==='legacy')state.priceList=clone(persist().items);dirty('Zmieniono cennik')});
  $('#addTariff').onclick=()=>{persist().items.push({id:uid(),name:'Nowa pozycja',cost:0,retention:0,person:'',hours:0});dirty();renderSettings()};
 }
 const settings=renderSettings;renderSettings=function(){settings();tariffSettings();const box=document.createElement('section');box.className='card dictionary-settings';box.innerHTML='<h3>Słownik opisów kosztów</h3><p>Jeden opis w wierszu. Podpowiedzi obejmują również opisy użyte w projektach.</p><textarea id="costDictionary" rows="6">'+esc((state.costDictionary||[]).join('\n'))+'</textarea>';$('.page').append(box);$('#costDictionary').onchange=e=>{state.costDictionary=[...new Set(e.target.value.split('\n').map(x=>x.trim()).filter(Boolean))];dirty('Zmieniono słownik')}};
 const sidebar=renderSidebar;renderSidebar=function(){learnDescriptions();sidebar();if(!$('#projectSearch')){const input=document.createElement('input');input.id='projectSearch';input.type='search';input.placeholder='Szukaj projektu lub klienta…';input.setAttribute('aria-label','Wyszukaj projekty');$('.side-actions').append(input);input.oninput=filterProjects;}filterProjects()};
 function filterProjects(){const q=($('#projectSearch')?.value||'').toLocaleLowerCase('pl');document.querySelectorAll('.side-project').forEach(el=>{el.hidden=!el.textContent.toLocaleLowerCase('pl').includes(q)})}
 // Grid selection stays separate from editor focus, including on touch devices.
 let rangeMode=false;let selection=null,editing=null,dragging=false,fillSource=null,clipboardCells=null,searchIndex=-1;
 function grid(){return $('.sheet-page table')}
 function cells(){return [...(grid()?.querySelectorAll('tbody td')||[])].filter(td=>!td.closest('tr').hidden&&!td.classList.contains('drag')&&!td.classList.contains('row-tools')&&td.colSpan===1)}
 function pos(td){return {r:[...td.parentElement.parentElement.rows].filter(r=>!r.hidden).indexOf(td.parentElement),c:[...td.parentElement.cells].slice(0,td.cellIndex).reduce((n,c)=>n+c.colSpan,0)}}
 function selectionCells(){if(!selection)return [];const a=pos(selection.a),b=pos(selection.b);return cells().filter(td=>{const p=pos(td);return p.r>=Math.min(a.r,b.r)&&p.r<=Math.max(a.r,b.r)&&p.c>=Math.min(a.c,b.c)&&p.c<=Math.max(a.c,b.c)})}
 function control(td){return td?.querySelector('[data-cell]')}
 function writable(el){const r=findRow(el?.dataset.rowid);if(!r||r.system||window.bbfCloud?.getRole()==='viewer')return false;const k=el.dataset.cell;if(state.ui.tab==='estimate')return !(r.fixed&&k==='name')&&['name','unit','qty','plannedUnit'].includes(k);if(r.settlements?.length)return false;if(r.isSettlementChild&&['name','qty','date'].includes(k))return true;return k==='actualType'||k==='actualNet'&&!['BBF','administracja'].includes(r.actualType)}
 function paint(){cells().forEach(td=>{td.classList.remove('grid-selected','grid-anchor');td.querySelector('.fill-handle')?.remove()});if(!selection)return;selectionCells().forEach(td=>td.classList.add('grid-selected'));selection.a.classList.add('grid-anchor');const el=control(selection.b);if(writable(el)){const h=document.createElement('button');h.className='fill-handle';h.setAttribute('aria-label','Wypełnij zaznaczone komórki');selection.b.append(h)}}
 function select(td,extend=false){if(!td||td.colSpan!==1)return;if(editing)finishEdit();selection=extend&&selection?{a:selection.a,b:td}:{a:td,b:td};td.tabIndex=0;td.focus({preventScroll:true});paint();state.ui.activeRow=td.closest('tr').dataset.row;}
 function selectId(id,key){const el=grid()?.querySelector('[data-rowid="'+id+'"][data-cell="'+key+'"]');if(el)select(el.closest('td'))}
 function activate(td){const el=control(td);if(!writable(el))return;if(el.tagName==='BUTTON'){openTypePicker(el);return}editing={el,old:el.value};el.readOnly=false;el.focus();el.value=numeric.has(el.dataset.cell)?String(num(findRow(el.dataset.rowid)[el.dataset.cell])):el.value;el.select();td.classList.add('grid-editing');if(el.dataset.cell==='name'){const dl=$('#costHints');el.setAttribute('list','costHints');}}
 function finishEdit(cancel=false){if(!editing)return;const {el,old}=editing;if(cancel){el.value=old;writeControl(el,old);commit('Anulowano edycję');}else writeControl(el,el.value);el.readOnly=true;el.closest('td')?.classList.remove('grid-editing');editing=null;if(el.dataset.cell==='name')learnDescriptions();formatMoneyEditors()}
 function writeControl(el,value,raw){const r=findRow(el?.dataset.rowid),k=el?.dataset.cell;if(!writable(el))return false;
  if(k==='actualType'){let type=value,id='';if(raw){type=raw.type;id=raw.id||''}else if(value.startsWith('BBF / ')||value.startsWith('BBF/')){const name=value.replace(/^BBF\s*\/\s*/,'');const price=activeBook(project(),r)?.items.find(x=>x.name===name);if(!price)return false;type='BBF';id=price.id;}if(!types.includes(type)||type==='BBF'&&!activeBook(project(),r)?.items.some(x=>x.id===id))return false;setType(r,type,id);}
  else {if(numeric.has(k)){const cleaned=String(value).replace(/zł|PLN|\s/gi,'').replace(',','.');if(cleaned&&!Number.isFinite(Number(cleaned)))return false;r[k]=Math.max(0,num(value));}else if(k==='date'){if(value&&!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;r[k]=value;}else r[k]=value;}
  return true;
 }
 function commit(label){dirty(label);refreshNumbers();document.querySelectorAll('[data-child-actual]').forEach(el=>el.textContent=cur(calcActualCost(findRow(el.dataset.childActual))));document.querySelectorAll('[data-child-internal]').forEach(el=>el.textContent=cur(calcBBFValue(findRow(el.dataset.childInternal))))}
 function valueOf(td){const el=control(td),r=findRow(el?.dataset.rowid);if(!el)return {text:td.textContent.trim()};if(el.dataset.cell==='actualType')return {text:typeLabel(r),type:r.actualType,id:r.bbfPriceId};return {text:String(r?.[el.dataset.cell]??'')}}
 function matrix(){const selected=selectionCells(),rows=[...new Set(selected.map(x=>pos(x).r))];return rows.map(r=>selected.filter(x=>pos(x).r===r).sort((a,b)=>a.cellIndex-b.cellIndex).map(valueOf))}
 function pasteMatrix(data){if(!selection||!Array.isArray(data)||!data.length||data.length>10000||data.some(r=>!Array.isArray(r)||r.length>100||r.some(v=>!v||typeof v.text!=='string')))return;const targets=selectionCells(),start=pos(selection.a),available=cells();let rejected=0;const tiled=targets.length>1&&data.length===1&&data[0].length===1;const edits=tiled?targets.map(td=>[td,data[0][0]]):data.flatMap((row,ri)=>row.map((v,ci)=>[available.find(td=>{const p=pos(td);return p.r===start.r+ri&&p.c===start.c+ci}),v]));for(const [td,v]of edits){if(!td||!writeControl(control(td),v.text,v.type!==undefined?v:null))rejected++}const id=control(selection.a)?.dataset.rowid,key=control(selection.a)?.dataset.cell;commit('Wklejono komórki');redraw();selectId(id,key);if(rejected)notice('Pominięto '+rejected+' zablokowanych lub niezgodnych komórek.')}
 function notice(text){let el=$('#gridNotice');if(!el){el=document.createElement('div');el.id='gridNotice';el.setAttribute('role','status');document.body.append(el)}el.textContent=text;clearTimeout(notice.timer);notice.timer=setTimeout(()=>el.remove(),4500)}
 function searchPanel(){if($('#sheetFind')){$('#sheetFind input').focus();return}const bar=document.createElement('div');bar.id='sheetFind';bar.innerHTML='<input type="search" aria-label="Znajdź w tabeli" placeholder="Znajdź w tabeli…"><span id="findCount"></span><button id="findPrev" aria-label="Poprzedni wynik">↑</button><button id="findNext" aria-label="Następny wynik">↓</button><button id="findClose" aria-label="Zamknij wyszukiwanie">×</button>';$('.sheet-page').prepend(bar);bar.querySelector('input').oninput=()=>{searchIndex=-1;findNext(1)};$('#findNext').onclick=()=>findNext(1);$('#findPrev').onclick=()=>findNext(-1);$('#findClose').onclick=()=>bar.remove();bar.querySelector('input').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();findNext(e.shiftKey?-1:1)}if(e.key==='Escape')bar.remove()};bar.querySelector('input').focus()}
 function findNext(direction){const q=$('#sheetFind input').value.toLocaleLowerCase('pl');if(!q)return;const matches=[...(grid()?.querySelectorAll('tbody td')||[])].filter(td=>td.colSpan===1&&(control(td)?.value||td.textContent).toLocaleLowerCase('pl').includes(q));searchIndex=(searchIndex+direction+matches.length)%matches.length;$('#findCount').textContent=matches.length?(searchIndex+1)+' / '+matches.length:'Brak wyników';const td=matches[searchIndex];if(td){const row=td.closest('tr'),parent=parentOf(row.dataset.row);row.hidden=false;if(parent){state.ui.splitFold??={};state.ui.splitFold[parent.id]=false}const h=hierarchy(project()).get(parent?.id||row.dataset.row);if(h){delete state.ui.folded?.[h.cat];delete state.ui.folded?.[h.sub]}td.scrollIntoView({block:'center',inline:'center'});select(td);$('#sheetFind input').focus()}}
 function installGrid(){learnDescriptions();selection=null;editing=null;const table=grid();if(!table)return;table.classList.add('excel-grid');table.querySelectorAll('tbody input[data-cell]').forEach(el=>{if(el.closest('td').colSpan===1){el.readOnly=true;el.tabIndex=-1;el.classList.toggle('grid-locked',!writable(el))}});table.querySelectorAll('tbody button[data-cell]').forEach(el=>el.tabIndex=-1);cells().forEach(td=>td.tabIndex=-1);
  $('#costHints')?.remove();const dl=document.createElement('datalist');dl.id='costHints';dl.innerHTML=[...new Set([...(state.costDictionary||[]),...state.projects.flatMap(p=>p.rows.filter(r=>r.kind==='item'&&!r.system).map(r=>r.name))])].sort().map(n=>'<option value="'+esc(n)+'">').join('');document.body.append(dl);
  const actions=$('.row-actions');actions?.insertAdjacentHTML('beforeend','<div class="grid-tools"><button data-grid-find aria-label="Znajdź w tabeli">'+icon('search')+' Szukaj</button><button data-grid-range>Zaznacz zakres</button><button data-grid-edit>Edytuj</button><button data-grid-copy>Kopiuj</button><button data-grid-paste>Wklej</button><button data-grid-fill>Wypełnij</button><button data-grid-context>Menu</button><button data-grid-fullscreen>Pełny ekran</button></div><div class="mobile-history"><button data-grid-undo aria-label="Cofnij">'+icon('undo')+'</button><button data-grid-redo aria-label="Ponów">'+icon('redo')+'</button></div>');
 }
 const page=sheetPage;sheetPage=function(mode){page(mode);installGrid()};
 window.addEventListener('pointerdown',e=>{
  if(!grid()||e.target.closest('#typeMenu'))return;const handle=e.target.closest('.fill-handle');if(handle){e.preventDefault();e.stopImmediatePropagation();fillSource=valueOf(selection.a);dragging=true;return}
  const td=e.target.closest('.excel-grid tbody td');if(!td||e.target.closest('.group-label, .row-menu,.trash-button,.sub-toggle,.child-details select,.child-details input'))return;if(td.colSpan!==1)return;if(editing?.el===e.target)return;
  e.preventDefault();e.stopImmediatePropagation();const second=e.button===0&&selection?.a===td&&selection.a===selection.b&&!e.shiftKey;select(td,e.shiftKey||rangeMode);if(second&&!rangeMode){activate(td)}else dragging=e.button===0&&e.pointerType!=='touch';
 },true);
 window.addEventListener('pointermove',e=>{if(!dragging||!selection)return;const td=document.elementFromPoint(e.clientX,e.clientY)?.closest('.excel-grid tbody td');if(td&&td.colSpan===1){selection.b=td;paint();if(e.clientY>innerHeight-65)td.closest('.table-shell')?.scrollBy(0,24);if(e.clientY<160)td.closest('.table-shell')?.scrollBy(0,-24)}},true);
 window.addEventListener('pointerup',()=>{if(fillSource&&selection){const source=fillSource;fillSource=null;const a=pos(selection.a);let skipped=0;for(const td of selectionCells().filter(td=>pos(td).c===a.c)){if(!writeControl(control(td),source.text,source.type!==undefined?source:null))skipped++}const id=control(selection.a)?.dataset.rowid,key=control(selection.a)?.dataset.cell;commit('Wypełniono komórki');redraw();selectId(id,key);if(skipped)notice('Pominięto zablokowane komórki.')}dragging=false},true);
 window.addEventListener('click',e=>{
  const cellTarget=e.target.closest('.excel-grid td');if(cellTarget&&control(cellTarget)?.dataset.cell==='actualType'&&$('#typeMenu')){e.preventDefault();e.stopImmediatePropagation();return}const b=e.target.closest('button');if(!b)return;
  if(b.id==='duplicateProject'){e.preventDefault();e.stopImmediatePropagation();duplicateDialog();return}
  if(b.dataset.v2Type!==undefined||b.dataset.v2Price){e.preventDefault();e.stopImmediatePropagation();const r=findRow(pickerOrigin);setType(r,b.dataset.v2Price?'BBF':b.dataset.v2Type,b.dataset.v2Price||'');$('#typeMenu').remove();commit('Zmieniono typ');redraw();selectId(r.id,'actualType');return}
  if(b.dataset.cell&&b.closest('.excel-grid')){e.preventDefault();e.stopImmediatePropagation();return}
  if(b.dataset.splitAdd){e.stopImmediatePropagation();$('#contextMenu').classList.remove('open');splitRow(b.dataset.splitAdd);return}
  if(b.dataset.splitRemove){e.stopImmediatePropagation();const p=parentOf(b.dataset.splitRemove);if(p){p.settlements=p.settlements.filter(s=>s.id!==b.dataset.splitRemove);if(!p.settlements.length){p.actualType='';p.actualNet=0;}dirty('Usunięto podpozycję');redraw()}$('#contextMenu').classList.remove('open');return}
  if(b.dataset.splitFold){e.stopImmediatePropagation();state.ui.splitFold??={};state.ui.splitFold[b.dataset.splitFold]=!state.ui.splitFold[b.dataset.splitFold];redraw();return}
  const action=Object.keys(b.dataset).find(k=>k.startsWith('grid'));if(!action)return;e.preventDefault();e.stopImmediatePropagation();
  if(action==='gridRange'){rangeMode=!rangeMode;b.classList.toggle('active',rangeMode);b.setAttribute('aria-pressed',rangeMode);}
  if(action==='gridUndo')undo();if(action==='gridRedo')redo();
  if(action==='gridFind')searchPanel();
  if(action==='gridEdit'&&selection)activate(selection.a);
  if(action==='gridCopy'){clipboardCells=matrix();navigator.clipboard?.writeText(clipboardCells.map(r=>r.map(v=>v.text).join('\t')).join('\n')).then(()=>notice('Skopiowano')).catch(()=>notice('Użyj Cmd/Ctrl+C, aby skopiować zaznaczenie.'))}
  if(action==='gridPaste')navigator.clipboard?.readText().then(text=>pasteMatrix(text===clipboardCells?.map(r=>r.map(v=>v.text).join('\t')).join('\n')?clipboardCells:text.replace(/\r/g,'').split('\n').map(r=>r.split('\t').map(text=>({text}))))).catch(()=>notice('Użyj Cmd/Ctrl+V, aby wkleić.'));
  if(action==='gridFill'&&selection){const data=valueOf(selection.a);pasteMatrix([[data]])}
  if(action==='gridContext'&&selection){const rect=selection.a.getBoundingClientRect();openContext(selection.a.closest('tr').dataset.row,rect)}
  if(action==='gridFullscreen')document.body.classList.toggle('table-fullscreen');
 },true);
 window.addEventListener('input',e=>{if(e.target.closest('.excel-grid')&&!e.target.closest('.group-label')&&e.target.dataset.cell){e.stopImmediatePropagation();if(editing?.el===e.target){writeControl(e.target,e.target.value);commit('Edytowano komórkę')}}},true);
 window.addEventListener('change',e=>{if(e.target.dataset.childDate){findRow(e.target.dataset.childDate).date=e.target.value;commit('Zmieniono datę podpozycji');redraw();return}if(e.target.dataset.childPerson){const r=findRow(e.target.dataset.childPerson);r.personId=e.target.value;dirty('Przypisano osobę do podpozycji');return}},true);
 window.addEventListener('focusout',e=>{if(editing?.el===e.target){finishEdit();commit('Edytowano komórkę')}},true);
 window.addEventListener('keydown',e=>{
  if(!grid()||e.target.closest('#typeMenu,#modalBackdrop,#sheetFind,.group-label,.child-details'))return;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='f'){e.preventDefault();e.stopImmediatePropagation();searchPanel();return}
  if(!selection||(!e.target.closest('.excel-grid')&&e.target!==document.body))return;
  if((e.metaKey||e.ctrlKey)&&['c','v','x','z'].includes(e.key.toLowerCase()))return;
  if(!['Enter','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Delete','Backspace'].includes(e.key))return;
  if(editing&&['Backspace','Delete'].includes(e.key)){e.stopImmediatePropagation();return}
  e.preventDefault();e.stopImmediatePropagation();
  if(e.key==='Escape'){finishEdit(true);select(selection.a);return}
  if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)&&state.ui.tab==='estimate'){addRow('subcategory',state.ui.activeRow);return}
  if(e.key==='Enter'&&e.shiftKey&&state.ui.tab==='estimate'){addRow('item',state.ui.activeRow);return}
  if(e.key==='Enter'&&!editing){activate(selection.a);return}
  if(e.key==='Delete'||e.key==='Backspace'){if(state.ui.tab==='estimate'){deleteRow(state.ui.activeRow)}return}
  if(editing){finishEdit();commit('Edytowano komórkę')}
  const at=pos(selection.b),vertical=['Enter','ArrowDown','ArrowUp'].includes(e.key),delta=['ArrowUp','ArrowLeft'].includes(e.key)||e.key==='Tab'&&e.shiftKey?-1:1;
  const next=cells().filter(td=>{const p=pos(td);return vertical?(p.r-at.r)*delta>0&&p.c===at.c:p.r===at.r&&(p.c-at.c)*delta>0}).sort((a,b)=>vertical?Math.abs(pos(a).r-at.r)-Math.abs(pos(b).r-at.r):Math.abs(pos(a).c-at.c)-Math.abs(pos(b).c-at.c))[0];if(next){select(next,e.shiftKey&&e.key!=='Tab');next.scrollIntoView({block:'nearest',inline:'nearest'})}
 },true);
 window.addEventListener('copy',e=>{if(!selection||editing||!e.target.closest('.excel-grid'))return;e.preventDefault();clipboardCells=matrix();e.clipboardData.setData('text/plain',clipboardCells.map(r=>r.map(v=>v.text).join('\t')).join('\n'));e.clipboardData.setData('application/x-bbf-cells',JSON.stringify(clipboardCells))},true);
 window.addEventListener('paste',e=>{if(!selection||editing||!e.target.closest('.excel-grid'))return;e.preventDefault();e.stopImmediatePropagation();let data;try{data=JSON.parse(e.clipboardData.getData('application/x-bbf-cells'))}catch{}const text=e.clipboardData.getData('text/plain');pasteMatrix(data||text.replace(/\r/g,'').replace(/\n$/,'').split('\n').map(r=>r.split('\t').map(text=>({text}))))},true);
 const historyRestore=restoreHistory;restoreHistory=function(cursor){
  if(cursor<0||cursor>timeline.entries.length||cursor===timeline.cursor)return;
  const chosen=control(selection?.a),id=chosen?.dataset.rowid,key=chosen?.dataset.cell;
  const scrolling=[...document.querySelectorAll('.table-shell,#view,.content,main,#sidebar')].map(el=>({el,selector:el.id?'#'+el.id:el.classList.contains('table-shell')?'.sheet-page .table-shell':el.tagName==='MAIN'?'main':'.content',x:el.scrollLeft,y:el.scrollTop}));const x=scrollX,y=scrollY;
  if(editing)finishEdit();
  const focusBefore=focusCell;focusCell=()=>{};try{historyRestore(cursor)}finally{focusCell=focusBefore}
  if(id&&key)selectId(id,key);for(const p of scrolling){const el=p.el.isConnected?p.el:document.querySelector(p.selector);el?.scrollTo(p.x,p.y)}window.scrollTo(x,y);
 };
 window.bbfSheet={selectId,findRow,activeBook,books,redraw,finishEdit,installGrid};
 render();
})();
