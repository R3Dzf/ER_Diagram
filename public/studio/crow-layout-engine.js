import {crowProjection,crowSize} from './crowfoot.js';
import {inspectLayout} from './layout-validation.js';

// This planner works solely with projected tables and association cards. Chen
// diamonds, attribute fans and cluster extents never participate in placement.
export const CROW_LAYOUT_RULES=Object.freeze({tableGap:64,columnGap:160,componentGap:180,bandGap:220,maxExtent:190000,maxBalancedLayers:5});
const lexical=(a,b)=>a<b?-1:a>b?1:0;
const compare=(a,b)=>lexical(a.name.normalize('NFKC').toLowerCase(),b.name.normalize('NFKC').toLowerCase())||lexical(a.id,b.id);
const extent=(cards,positions)=>{const boxes=cards.map(n=>{const p=positions.get(n.id),s=crowSize(n);return {l:p.x-s.w/2,r:p.x+s.w/2,t:p.y-s.h/2,b:p.y+s.h/2};});return {l:Math.min(...boxes.map(r=>r.l)),r:Math.max(...boxes.map(r=>r.r)),t:Math.min(...boxes.map(r=>r.t)),b:Math.max(...boxes.map(r=>r.b))};};
function network(cards,links){
 const byId=new Map(cards.map(n=>[n.id,n])),graph=new Map(cards.map(n=>[n.id,new Set()])),inbound=new Map(cards.map(n=>[n.id,0]));
 for(const link of links)if(link.source!==link.target&&graph.has(link.source)&&graph.has(link.target)){graph.get(link.source).add(link.target);graph.get(link.target).add(link.source);if(link.start.many!==link.end.many)inbound.set(link.start.many?link.source:link.target,inbound.get(link.start.many?link.source:link.target)+1);}
 const components=[],seen=new Set();for(const seed of [...cards].sort(compare)){if(seen.has(seed.id))continue;const queue=[seed.id];seen.add(seed.id);for(let i=0;i<queue.length;i++)for(const id of [...graph.get(queue[i])].sort((a,b)=>compare(byId.get(a),byId.get(b))))if(!seen.has(id)){seen.add(id);queue.push(id);}components.push(queue.map(id=>byId.get(id)));}
 return {byId,graph,inbound,components};
}
function layersFor(cards,net){
 const chain=cards.every(n=>net.graph.get(n.id).size<=2)&&cards.some(n=>net.graph.get(n.id).size<=1),roots=chain?cards.filter(n=>net.graph.get(n.id).size<=1):cards;
 const root=[...roots].sort((a,b)=>chain?net.inbound.get(a.id)-net.inbound.get(b.id)||compare(a,b):net.graph.get(b.id).size-net.graph.get(a.id).size||net.inbound.get(a.id)-net.inbound.get(b.id)||compare(a,b))[0],rank=new Map([[root.id,0]]),queue=[root.id],layers=[];
 for(let i=0;i<queue.length;i++){const id=queue[i],level=rank.get(id);(layers[level]||= []).push(id);for(const other of [...net.graph.get(id)].sort((a,b)=>compare(net.byId.get(a),net.byId.get(b))))if(!rank.has(other)){rank.set(other,level+1);queue.push(other);}}
 // Stable barycenter sweeps align children to their neighboring tables. They
 // use only topology, never coordinates left over from a different notation.
 const order=new Map();const update=()=>layers.forEach(ids=>ids.forEach((id,i)=>order.set(id,i)));update();
 for(let pass=0;pass<4;pass++)for(const forward of [true,false]){const indices=Array.from({length:layers.length},(_,i)=>forward?i:layers.length-1-i);for(const level of indices){const neighborLevel=level+(forward?-1:1);if(!layers[neighborLevel])continue;const bary=id=>{const values=[...net.graph.get(id)].filter(n=>rank.get(n)===neighborLevel).map(n=>order.get(n));return values.length?values.reduce((a,b)=>a+b,0)/values.length:order.get(id);};layers[level].sort((a,b)=>bary(a)-bary(b)||compare(net.byId.get(a),net.byId.get(b)));update();}}
 return {layers,rank,chain};
}
function placeBand(layers,net,links,rules,vertical){
 const sizes=new Map(layers.flat().map(id=>{const s=crowSize(net.byId.get(id));return [id,vertical?{w:s.h,h:s.w}:s];})),heights=layers.map(ids=>ids.reduce((sum,id)=>sum+sizes.get(id).h,0)+Math.max(0,ids.length-1)*rules.tableGap),totalH=Math.max(...heights),positions=new Map(),rankOf=new Map(layers.flatMap((ids,i)=>ids.map(id=>[id,i])));
 let x=0;for(let level=0;level<layers.length;level++){const ids=layers[level],width=Math.max(...ids.map(id=>sizes.get(id).w));if(level){const labels=links.filter(e=>rankOf.has(e.source)&&rankOf.has(e.target)&&Math.min(rankOf.get(e.source),rankOf.get(e.target))<level&&Math.max(rankOf.get(e.source),rankOf.get(e.target))>=level);const labelWidth=Math.max(90,...labels.map(e=>Math.min(310,e.role.length*7+24)));x+=rules.columnGap+(vertical?50:labelWidth);}
  let y=(totalH-heights[level])/2;for(const id of ids){const s=sizes.get(id),p={x:x+width/2,y:y+s.h/2};positions.set(id,vertical?{x:p.y,y:p.x}:p);y+=s.h+rules.tableGap;}x+=width;
 }
 return positions;
}
function placeComponent(cards,net,links,rules,direction){
 const {layers,chain}=layersFor(cards,net),positions=new Map(),balanced=direction==='balanced',count=balanced?rules.maxBalancedLayers:layers.length;let bandY=0;
 for(let start=0;start<layers.length;start+=count){const slice=layers.slice(start,start+count),band=placeBand(slice,net,links,rules,direction==='vertical'),included=slice.flat().map(id=>net.byId.get(id)),box=extent(included,band);for(const [id,p] of band)positions.set(id,{x:p.x-box.l,y:p.y-box.t+bandY});bandY+=box.b-box.t+rules.bandGap;}
 return {cards,positions,...extent(cards,positions),kind:chain?'table-chain':'table-layers'};
}
function pack(groups,rules){
 const target=Math.max(...groups.map(g=>g.r-g.l),Math.sqrt(groups.reduce((sum,g)=>sum+(g.r-g.l+rules.componentGap)*(g.b-g.t+rules.componentGap),0))*1.45),positions=new Map();let x=0,y=0,rowH=0;
 for(const group of groups){const w=group.r-group.l,h=group.b-group.t;if(x&&x+w>target){x=0;y+=rowH+rules.componentGap;rowH=0;}for(const [id,p] of group.positions)positions.set(id,{x:p.x-group.l+x,y:p.y-group.t+y});x+=w+rules.componentGap;rowH=Math.max(rowH,h);}
 return positions;
}
function moveHiddenNodes(candidate,original,positions){
 // Hidden attributes retain offsets in this view only. They never reserve an
 // ellipse-sized box or alter the placement of the visible tables.
 const before=new Map(original.nodes.map(n=>[n.id,n])),adj=new Map(candidate.nodes.map(n=>[n.id,[]]));for(const e of candidate.edges){adj.get(e.source)?.push(e.target);adj.get(e.target)?.push(e.source);}
 const seen=new Set(positions.keys()),queue=[...positions.keys()].sort(),owners=new Map(queue.map(id=>[id,id]));for(let i=0;i<queue.length;i++)for(const id of [...adj.get(queue[i])].sort())if(before.get(id)?.type==='attribute'&&!seen.has(id)){seen.add(id);owners.set(id,owners.get(queue[i]));queue.push(id);}
 for(const n of candidate.nodes){if(positions.has(n.id)){Object.assign(n,positions.get(n.id));continue;}if(n.type==='attribute'&&owners.has(n.id)){const root=owners.get(n.id),old=before.get(root),at=positions.get(root);n.x=Math.max(-100000,Math.min(100000,n.x+at.x-old.x));n.y=Math.max(-100000,Math.min(100000,n.y+at.y-old.y));}
  if(n.type==='relationship'){const participants=adj.get(n.id).map(id=>positions.get(id)).filter(Boolean);if(participants.length){n.x=participants.reduce((sum,p)=>sum+p.x,0)/participants.length;n.y=participants.reduce((sum,p)=>sum+p.y,0)/participants.length;}}
 }
}
export function planCrowLayout(model,options={},attempt=0){
 const direction=['horizontal','vertical'].includes(options.direction)?options.direction:'balanced',spacing=options.spacing==='compact'?'compact':'comfortable',candidate=structuredClone(model),{cards,links}=crowProjection(model),rules={...CROW_LAYOUT_RULES,...(spacing==='compact'?{tableGap:48,columnGap:110,componentGap:140,bandGap:180}:{} )};
 if(!cards.length)return {model:candidate,report:{engine:'crowfoot',algorithm:'table-layers',overlaps:0,components:0,visibleNodes:0,direction,spacing}};
 rules.columnGap*=2**attempt;rules.tableGap*=2**attempt;rules.componentGap*=2**attempt;rules.bandGap*=2**attempt;
 const net=network(cards,links),groups=net.components.map(ns=>placeComponent(ns,net,links,rules,direction)),positions=pack(groups,rules),box=extent(cards,positions);
 if(box.r-box.l>rules.maxExtent||box.b-box.t>rules.maxExtent){if(direction!=='balanced')return planCrowLayout(model,{...options,direction:'balanced'});throw Error('This table layout exceeds the canvas limits. Split it into smaller diagrams.');}
 const center={x:(box.l+box.r)/2,y:(box.t+box.b)/2};for(const p of positions.values()){p.x-=center.x;p.y-=center.y;}
 moveHiddenNodes(candidate,model,positions);for(const e of candidate.edges){e.routing='orthogonal';e.points=[];}
 const inspection=inspectLayout(candidate,{connections:true});if((inspection.blocked.length||inspection.labelIssues.length)&&attempt<3)return planCrowLayout(model,options,attempt+1);
 if(inspection.overlaps.length||inspection.outOfBounds.length||inspection.blocked.length||inspection.labelIssues.length)throw Object.assign(Error('The table layout did not pass its spacing and route checks. Your positions were preserved.'),{details:inspection,candidate});
 return {model:candidate,report:{engine:'crowfoot',algorithm:'table-layers',overlaps:0,components:groups.length,visibleNodes:cards.length,direction,spacing,rules:CROW_LAYOUT_RULES}};
}
