/* Column pinning stays scoped to the current project and sheet. */
(()=>{
 let observer;
 const close=()=>document.getElementById('columnPinMenu')?.remove();
 function apply(table,mode){
  const heads=[...table.tHead.rows[0].cells],pins=project()?.columnPins?.[mode]||[];
  const offsets=new Map();let left=0;
  heads.forEach((h,i)=>{if(pins.includes(i)){offsets.set(i,left);left+=h.getBoundingClientRect().width}});
  for(const tr of table.rows){let index=0;for(const cell of tr.cells){
   const pinned=cell.colSpan===1&&offsets.has(index);
   cell.classList.toggle('column-pinned',pinned);cell.classList.toggle('column-pin-edge',pinned&&index===pins.filter(i=>offsets.has(i)).sort((a,b)=>a-b).at(-1));
   if(pinned){cell.style.setProperty('left',offsets.get(index)+'px','important');cell.style.setProperty('--pin-background',getComputedStyle(cell).backgroundColor==='rgba(0, 0, 0, 0)'?'#fff':getComputedStyle(cell).backgroundColor)}else cell.style.removeProperty('left');
   if(cell.tagName==='TH'){cell.classList.toggle('has-pin',pinned);cell.title=pinned?'Przypięta kolumna · prawy przycisk, aby odpiąć':'Prawy przycisk, aby przypiąć kolumnę'}index+=cell.colSpan;
  }}
 }
 function install(mode){observer?.disconnect();close();const table=document.querySelector('.sheet-page table');if(!table)return;apply(table,mode);observer=new ResizeObserver(()=>apply(table,mode));observer.observe(table);
  table.tHead.addEventListener('contextmenu',e=>{const th=e.target.closest('th');if(!th)return;e.preventDefault();e.stopPropagation();close();const index=th.cellIndex,p=project(),pins=p.columnPins?.[mode]||[];
   const menu=document.createElement('div');menu.id='columnPinMenu';menu.className='context-menu column-pin-menu';menu.setAttribute('role','menu');
   const add=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('role','menuitem');b.onclick=()=>{p.columnPins??={};p.columnPins[mode]=fn();apply(table,mode);close();dirty('Przypięcie kolumn')};menu.append(b)};
   add(pins.includes(index)?'Odepnij kolumnę':'Przypnij kolumnę',()=>pins.includes(index)?pins.filter(i=>i!==index):[...pins,index].sort((a,b)=>a-b));
   add('Przypnij kolumny do tego miejsca',()=>Array.from({length:index+1},(_,i)=>i));add('Odepnij wszystkie kolumny',()=>[]);
   document.body.append(menu);menu.style.left=Math.max(8,Math.min(e.clientX,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.max(8,Math.min(e.clientY,innerHeight-menu.offsetHeight-8))+'px';menu.querySelector('button').focus();
  });
 }
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#columnPinMenu'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 const previous=sheetPage;sheetPage=function(mode){previous(mode);install(mode)};
})();
