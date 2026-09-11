/* Per-project column widths and settlement amount presentation. */
(()=>{
 function settlementAppearance(){
  const table=$('#settlementSheet');if(!table)return;
  for(const tr of table.querySelectorAll('tbody tr[data-row]')){
   const row=bbfSheet.findRow(tr.dataset.row);if(!row||['category','subcategory'].includes(row.kind))continue;
   [...tr.cells].forEach((td,i)=>{td.classList.toggle('amount-cell',[3,4,5,6,8,9,10,11,12,13].includes(i));td.classList.toggle('settlement-locked',i<7&&!(row.isSettlementChild&&[1,2].includes(i)));});
   const rate=tr.querySelector('[data-cell="actualNet"]');if(rate)rate.classList.toggle('rate-editable',!row.system&&!row.settlements?.length&&!['BBF','administracja'].includes(row.actualType));
   for(const td of tr.querySelectorAll('[data-metric="margin"],[data-metric="retention"]')){const negative=num(td.textContent)<0;td.classList.toggle('amount-negative',negative);td.classList.toggle('amount-positive',!negative)}
  }
 }
 function installWidths(table,key){
  if(!table?.tHead?.rows[0]||table.dataset.resizable)return;table.dataset.resizable=key;
  const heads=[...table.tHead.rows[0].cells],saved=project()?.columnWidths?.[key];
  let widths=heads.map((th,i)=>Math.max(34,Number(saved?.[i])||Math.ceil(th.getBoundingClientRect().width)||110));
  const cols=document.createElement('colgroup');widths.forEach(()=>cols.append(document.createElement('col')));table.prepend(cols);table.classList.add('user-columns');
  const apply=()=>{widths.forEach((w,i)=>cols.children[i].style.width=w+'px');table.style.setProperty('width',widths.reduce((a,b)=>a+b,0)+'px','important')};apply();
  heads.forEach((th,i)=>{
   const grip=document.createElement('span');grip.className='column-resizer';grip.tabIndex=0;grip.setAttribute('role','separator');grip.setAttribute('aria-orientation','vertical');grip.setAttribute('aria-label','Szerokość kolumny '+(th.textContent.trim()||i+1));th.append(grip);
   const persist=()=>{const p=project();p.columnWidths??={};p.columnWidths[key]=[...widths];dirty('Zmieniono szerokość kolumny')};
   grip.addEventListener('pointerdown',e=>{if(e.button!==0||window.bbfCloud?.getRole()==='viewer')return;e.preventDefault();e.stopImmediatePropagation();const x=e.clientX,start=widths[i];grip.setPointerCapture(e.pointerId);document.body.classList.add('resizing-column');
    const move=ev=>{widths[i]=Math.max(34,Math.min(1000,start+ev.clientX-x));apply()};
    const done=ev=>{grip.removeEventListener('pointermove',move);grip.removeEventListener('pointerup',done);grip.removeEventListener('pointercancel',done);if(grip.hasPointerCapture(ev.pointerId))grip.releasePointerCapture(ev.pointerId);document.body.classList.remove('resizing-column');persist()};
    grip.addEventListener('pointermove',move);grip.addEventListener('pointerup',done);grip.addEventListener('pointercancel',done);
   });
   grip.addEventListener('click',e=>{e.preventDefault();e.stopPropagation()});
   grip.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key)||window.bbfCloud?.getRole()==='viewer')return;e.preventDefault();e.stopPropagation();widths[i]=Math.max(34,Math.min(1000,widths[i]+(e.key==='ArrowRight'?10:-10)));apply();persist()});
  });
 }
 const sheet=sheetPage;sheetPage=function(mode){sheet(mode);settlementAppearance();installWidths($('.sheet-page table'),mode)};
 const crew=renderCrew;renderCrew=function(){crew();document.querySelectorAll('.crew-section').forEach(section=>installWidths(section.querySelector('table'),'crew-'+section.dataset.crewSection))};
 const numbers=refreshNumbers;refreshNumbers=function(){numbers();settlementAppearance()};
 window.bbfTableLayout={settlementAppearance};
})();
