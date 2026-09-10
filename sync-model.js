/* Pure record/field diff model, shared by the app and concurrency tests. */
(function(root){
 const tables=['projects','people','price_books','prices','cost_rows','clients','cost_descriptions','settings'];
 const copy=x=>JSON.parse(JSON.stringify(x));
 const equal=(a,b)=>stable(a)===stable(b);
 function stable(x){return Array.isArray(x)?'['+x.map(stable).join(',')+']':x&&typeof x==='object'?'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}':JSON.stringify(x)}
 function fromSnapshot(entities){const map={};for(const table of tables)for(const row of entities[table]||[])map[table+'/'+row.id]={table,id:row.id,data:row.data};return map}
 function pack(state){
  const map={},put=(table,id,data)=>{map[table+'/'+id]={table,id,data:copy(data)}};
  state.projects.forEach((p,i)=>{const {rows,...data}=p;put('projects',p.id,{...data,_position:i+1});rows.forEach((r,j)=>{const {settlements,...rd}=r;put('cost_rows',r.id,{...rd,projectId:p.id,_position:j+1});(settlements||[]).forEach((s,k)=>put('cost_rows',s.id,{...s,projectId:p.id,parentId:r.id,_position:k+1}))})});
  state.crew.forEach(c=>put('people',c.id,c));
  const books=state.priceBooks?.length?state.priceBooks:[{id:'legacy',name:'Cennik podstawowy',validFrom:'0001-01-01',items:state.priceList||[]}];
  books.forEach(b=>{const {id,items,...data}=b;put('price_books',id,data);items.forEach(p=>put('prices',id+':'+p.id,{...p,bookId:id}))});
  state.clients.forEach(name=>put('clients','client:'+name,{name}));
  (state.costDictionary||[]).forEach(name=>put('cost_descriptions','description:'+name,{name}));
  const {projects,crew,clients,priceList,priceBooks,costDictionary,ui,...settings}=state;put('settings','settings',settings);
  return map;
 }
 function unpack(map){const items=table=>Object.values(map).filter(x=>x.table===table).map(x=>({recordId:x.id,...copy(x.data)}));
  const clean=x=>{const {recordId,_position,projectId,parentId,bookId,...rest}=x;return rest};
  const order=(a,b)=>(a._position||0)-(b._position||0)||a.recordId.localeCompare(b.recordId);
  const rows=items('cost_rows'),projects=items('projects').sort(order).map(p=>({...clean(p),id:p.recordId,rows:rows.filter(r=>r.projectId===p.recordId&&!r.parentId).sort(order).map(r=>{const children=rows.filter(s=>s.parentId===r.recordId).sort(order).map(s=>({...clean(s),id:s.recordId,isSettlementChild:true}));return {...clean(r),id:r.recordId,...(children.length?{settlements:children}:{})}})}));
  const prices=items('prices'),priceBooks=items('price_books').map(b=>({...clean(b),id:b.recordId,items:prices.filter(x=>x.bookId===b.recordId).map(clean)})).sort((a,b)=>a.validFrom.localeCompare(b.validFrom));
  return {...clean(items('settings')[0]||{}),projects,crew:items('people').map(x=>({...clean(x),id:x.recordId})),clients:items('clients').map(x=>x.name),priceBooks,priceList:copy(priceBooks.find(b=>b.id==='legacy')?.items||priceBooks[0]?.items||[]),costDictionary:items('cost_descriptions').map(x=>x.name)};
 }
 function diff(before,after){return [...new Set([...Object.keys(before),...Object.keys(after)])].sort().filter(k=>!equal(before[k]?.data,after[k]?.data)).map(k=>({table:(after[k]||before[k]).table,id:(after[k]||before[k]).id,before:before[k]?.data??null,after:after[k]?.data??null}))}
 function rebase(base,local,remote){const result=copy(remote),conflicts=[];for(const op of diff(base,local)){const key=op.table+'/'+op.id,current=remote[key]?.data;
  if(op.before===null||op.after===null){if(!equal(current,op.before??undefined)&&!equal(current,op.after??undefined)){conflicts.push({key,field:'record'});continue}if(op.after===null)delete result[key];else result[key]={table:op.table,id:op.id,data:copy(op.after)};continue}
  if(!current){conflicts.push({key,field:'deleted'});continue}
  const value=copy(current);for(const field of new Set([...Object.keys(op.before),...Object.keys(op.after)])){if(equal(op.before[field],op.after[field]))continue;if(!equal(current[field],op.before[field])&&!equal(current[field],op.after[field])){conflicts.push({key,field});continue}if(Object.hasOwn(op.after,field))value[field]=copy(op.after[field]);else delete value[field]}
  result[key]={table:op.table,id:op.id,data:value};
 }return {result,conflicts}}
 root.BBFSyncModel={pack,unpack,diff,rebase,fromSnapshot,equal,stable};
})(typeof window==='undefined'?globalThis:window);
