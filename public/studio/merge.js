// Three-way merge: independent elements and independent fields compose safely.
import {captureLayout,restoreLayout,projectionKey,notationOf} from './layout-state.js';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function mergeDiagram(base,local,remote,{preferLocal=false}={}){
 const independent=[base,local,remote].some(m=>m.nodes.some(n=>n.chenPosition||n.crowfootPosition)||m.edges.some(e=>e.chenRoute||e.crowfootRoute));
 if(independent){base=captureLayout(structuredClone(base));local=captureLayout(structuredClone(local));remote=captureLayout(structuredClone(remote));}
 const out=structuredClone(remote),conflicts=[];
 const choose=(b,l,r,path)=>{if(same(b,l))return r;if(same(b,r)||same(l,r))return l;conflicts.push(path);return preferLocal?l:r;};
 for(const key of ['title','notation']){const v=key==='notation'&&independent?notationOf(local):choose(base[key],local[key],remote[key],key);if(v===undefined)delete out[key];else out[key]=v;}
 for(const kind of ['nodes','edges']){
  const b=new Map((base[kind]||[]).map(n=>[n.id,n])),l=new Map((local[kind]||[]).map(n=>[n.id,n])),r=new Map((remote[kind]||[]).map(n=>[n.id,n]));const result=[];
  for(const id of new Set([...r.keys(),...l.keys(),...b.keys()])){const bv=b.get(id),lv=l.get(id),rv=r.get(id);let v;
   if(!bv||!lv||!rv)v=choose(bv,lv,rv,kind+'.'+id);
   else{v={...rv};for(const key of new Set([...Object.keys(bv),...Object.keys(lv),...Object.keys(rv)])){if(independent&&projectionKey(kind,key))continue;const value=choose(bv[key],lv[key],rv[key],kind+'.'+id+'.'+key);if(value===undefined)delete v[key];else v[key]=value;}}
   if(v)result.push(v);
  }out[kind]=result;
 }
 const ids=new Set(out.nodes.map(n=>n.id));out.edges=out.edges.filter(e=>{if(ids.has(e.source)&&ids.has(e.target))return true;if(!same(local.edges.find(x=>x.id===e.id),base.edges.find(x=>x.id===e.id)))conflicts.push('edges.'+e.id+'.endpoint');return false;});
 return {model:independent?restoreLayout(out):out,conflicts};
}
