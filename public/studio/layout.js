import {planLayout} from './layout-engine.js';

function adjacency(model){
 const graph=new Map(model.nodes.map(n=>[n.id,[]])),byId=new Map(model.nodes.map(n=>[n.id,n]));
 for(const e of model.edges){if(!byId.has(e.source)||!byId.has(e.target))continue;graph.get(e.source).push(e.target);graph.get(e.target).push(e.source);}
 return {graph,byId};
}

// Only attributes follow a moved entity/relationship; other entities stay put.
export function movementGroup(model,ids){
 const {graph,byId}=adjacency(model),moving=new Set(ids.filter(id=>byId.has(id))),queue=[...moving].filter(id=>byId.get(id).type!=='attribute');
 for(let i=0;i<queue.length;i++)for(const id of graph.get(queue[i]))if(byId.get(id).type==='attribute'&&!moving.has(id)){moving.add(id);queue.push(id);}
 return [...moving];
}
export function moveGroup(model,before,ids,dx,dy){
 const moving=new Set(ids),original=before.nodes.filter(n=>moving.has(n.id));if(!original.length)return {dx:0,dy:0};
 dx=Math.max(-100000-Math.min(...original.map(n=>n.x)),Math.min(100000-Math.max(...original.map(n=>n.x)),dx));
 dy=Math.max(-100000-Math.min(...original.map(n=>n.y)),Math.min(100000-Math.max(...original.map(n=>n.y)),dy));
 const oldNodes=new Map(original.map(n=>[n.id,n])),oldEdges=new Map(before.edges.map(e=>[e.id,e]));
 for(const n of model.nodes){const old=oldNodes.get(n.id);if(old){n.x=old.x+dx;n.y=old.y+dy;}}
 for(const e of model.edges)if(moving.has(e.source)&&moving.has(e.target))e.points=(oldEdges.get(e.id)?.points||[]).map(p=>({x:p.x+dx,y:p.y+dy}));
 return {dx,dy};
}

// Compute and validate the complete candidate before changing the live diagram.
export function autoLayout(model,options={}){
 const {model:arranged,report}=planLayout(model,options),positions=new Map(arranged.nodes.map(n=>[n.id,n])),edges=new Map(arranged.edges.map(e=>[e.id,e]));
 for(const n of model.nodes){const p=positions.get(n.id);n.x=p.x;n.y=p.y;}
 for(const e of model.edges){const p=edges.get(e.id);e.routing=p.routing;e.points=p.points;}
 return report;
}
