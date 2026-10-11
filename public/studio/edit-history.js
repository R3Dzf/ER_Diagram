import {captureLayout,restoreLayout,notationOf,geometryScope,projectionKey} from './layout-state.js';
const copy=value=>value===undefined?undefined:structuredClone(value);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function changes(before,after){
 const result=[];
 for(const key of ['title'])if(!same(before[key],after[key]))result.push({kind:'model',key,before:copy(before[key]),after:copy(after[key])});
 for(const kind of ['nodes','edges']){
  const b=new Map(before[kind].map(n=>[n.id,n])),a=new Map(after[kind].map(n=>[n.id,n]));
  for(const id of new Set([...b.keys(),...a.keys()])){const bv=b.get(id),av=a.get(id);
   if(!bv||!av){result.push({kind,id,before:copy(bv),after:copy(av),index:!av?before[kind].findIndex(n=>n.id===id):after[kind].findIndex(n=>n.id===id)});continue;}
   for(const key of new Set([...Object.keys(bv),...Object.keys(av)]))if(!projectionKey(kind,key)&&!same(bv[key],av[key]))result.push({kind,id,key,before:copy(bv[key]),after:copy(av[key])});
  }
 }
 return result;
}
function scopeOf(patches,notation){return patches.some(p=>!p.key||!geometryScope(p.key))?'shared':notation;}
function eligible(entry,model){return entry.patches.length&&(entry.scope==='shared'||entry.scope===notationOf(model))&&entry.patches.some(p=>p.kind==='model'||!p.key||model[p.kind].some(n=>n.id===p.id));}
function apply(model,entry,backward){
 const out=copy(model);captureLayout(out);
 for(const patch of entry.patches){const value=copy(patch[backward?'before':'after']);
  if(patch.kind==='model'){if(value===undefined)delete out[patch.key];else out[patch.key]=value;continue;}
  const list=out[patch.kind],index=list.findIndex(n=>n.id===patch.id);
  if(patch.key){if(index<0)continue;if(value===undefined)delete list[index][patch.key];else list[index][patch.key]=value;}
  else if(value===undefined){if(index>=0){patch[backward?'after':'before']=copy(list[index]);list.splice(index,1);}}
  else if(index<0)list.splice(Math.min(patch.index,list.length),0,value);
 }
 const ids=new Set(out.nodes.map(n=>n.id));out.edges=out.edges.filter(e=>ids.has(e.source)&&ids.has(e.target));
 return restoreLayout(out);
}
// Shared edits participate in either view's timeline. Geometry entries are
// eligible only in their own view; patches never restore an old full model.
export class EditHistory{
 constructor(limit=80){this.limit=limit;this.clear();}
 clear(){this.past=[];this.future=[];this.pending=null;}
 begin(model){const before=captureLayout(copy(model)),entry={before,after:copy(before),patches:[],scope:notationOf(model)};this.pending=entry;return entry;}
 update(model){const entry=this.pending;if(!entry)return;entry.after=captureLayout(copy(model));entry.patches=changes(entry.before,entry.after);entry.scope=scopeOf(entry.patches,notationOf(entry.before));
  if(entry.patches.length&&!this.past.includes(entry)){this.future=this.future.filter(e=>entry.scope!=='shared'&&e.scope!=='shared'&&e.scope!==entry.scope);this.past.push(entry);if(this.past.length>this.limit)this.past.shift();}
 }
 finish(model){this.update(model);if(this.pending&&!this.pending.patches.length)this.discard(this.pending);this.pending=null;}
 discard(entry){this.past=this.past.filter(e=>e!==entry);if(this.pending===entry)this.pending=null;}
 canUndo(model){return this.past.some(e=>eligible(e,model));}
 canRedo(model){return this.future.some(e=>eligible(e,model));}
 undo(model){this.finish(model);const index=this.past.findLastIndex(e=>eligible(e,model));if(index<0)return null;const [entry]=this.past.splice(index,1),out=apply(model,entry,true);this.future.push(entry);return out;}
 redo(model){this.finish(model);const index=this.future.findLastIndex(e=>eligible(e,model));if(index<0)return null;const [entry]=this.future.splice(index,1),out=apply(model,entry,false);this.past.push(entry);return out;}
 rebase(transform){for(const entry of [...this.past,...this.future]){entry.before=transform(entry.before);entry.after=transform(entry.after);entry.patches=changes(entry.before,entry.after);} }
}
