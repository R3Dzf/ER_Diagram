import {size} from './core.js';
import {LAYOUT_RULES,inspectLayout} from './layout-validation.js';
import {intersects} from './routing.js';

// Geometry rules are hard constraints. Topology only chooses among legal slots.
const lexical=(a,b)=>a<b?-1:a>b?1:0;
const compare=(a,b)=>lexical(a.name.normalize('NFKC').toLowerCase(),b.name.normalize('NFKC').toLowerCase())||lexical(a.id,b.id);
const attributeOrder=(a,b)=>Number(!!(b.key||b.partialKey))-Number(!!(a.key||a.partialKey))||compare(a,b);
const rect=(n,s,pad=0)=>({l:n.x-s.w/2-pad,r:n.x+s.w/2+pad,t:n.y-s.h/2-pad,b:n.y+s.h/2+pad});
const overlap=(a,b,gap=0)=>a.l<b.r+gap-1e-6&&a.r>b.l-gap+1e-6&&a.t<b.b+gap-1e-6&&a.b>b.t-gap+1e-6;
const bounds=rs=>({l:Math.min(...rs.map(r=>r.l)),r:Math.max(...rs.map(r=>r.r)),t:Math.min(...rs.map(r=>r.t)),b:Math.max(...rs.map(r=>r.b))});
const median=values=>{const v=[...values].sort((a,b)=>a-b);return v.length%2?v[Math.floor(v.length/2)]:(v[v.length/2-1]+v[v.length/2])/2;};
function forest(model){
 const byId=new Map(model.nodes.map(n=>[n.id,n])),adj=new Map(model.nodes.map(n=>[n.id,[]]));for(const e of model.edges){adj.get(e.source)?.push(e.target);adj.get(e.target)?.push(e.source);}for(const list of adj.values())list.sort((a,b)=>attributeOrder(byId.get(a),byId.get(b)));
 const roots=model.nodes.filter(n=>n.type!=='attribute').sort((a,b)=>Number(a.type==='relationship')-Number(b.type==='relationship')||compare(a,b)),children=new Map(model.nodes.map(n=>[n.id,[]])),claimed=new Set(roots.map(n=>n.id)),owner=new Map(),queue=roots.map(n=>n.id);
 for(const n of roots)owner.set(n.id,n.id);
 function grow(){for(let i=0;i<queue.length;i++)for(const next of adj.get(queue[i]))if(byId.get(next).type==='attribute'&&!claimed.has(next)){claimed.add(next);children.get(queue[i]).push(next);owner.set(next,owner.get(queue[i]));queue.push(next);}}
 grow();for(const n of model.nodes.filter(n=>n.type==='attribute').sort(attributeOrder))if(!claimed.has(n.id)){roots.push(n);owner.set(n.id,n.id);claimed.add(n.id);queue.length=0;queue.push(n.id);grow();}
 return {byId,adj,roots,children,owner};
}
function panelFactory(f,rules){
 const cache=new Map();
 function tree(id,sideways){const n=f.byId.get(id),actual=size(n),s=sideways?{w:actual.h,h:actual.w}:actual,parts=f.children.get(id).map(id=>tree(id,sideways)),rows=[];let row={parts:[],w:0,h:0};
 for(const p of parts){if(row.parts.length&&(row.parts.length>=6||row.w+rules.attributeGap+p.w>1500)){rows.push(row);row={parts:[],w:0,h:0};}row.w+=(row.parts.length?rules.attributeGap:0)+p.w;row.h=Math.max(row.h,p.h);row.parts.push(p);}if(row.parts.length)rows.push(row);
 // Avoid a lonely attribute on a second row when two balanced rows fit.
 for(let pass=0;pass<rows.length;pass++)for(let i=rows.length-1;i>0;i--){const previous=rows[i-1],next=rows[i],last=previous.parts.at(-1);if(previous.parts.length>next.parts.length+1&&next.parts.length<6&&next.w+rules.attributeGap+last.w<=1500){previous.parts.pop();next.parts.unshift(last);for(const r of [previous,next]){r.w=r.parts.reduce((s,p)=>s+p.w,0)+(r.parts.length-1)*rules.attributeGap;r.h=Math.max(...r.parts.map(p=>p.h));}}}
 const w=Math.max(s.w,...rows.map(r=>r.w)),height=rows.reduce((h,r)=>h+r.h,0)+Math.max(0,rows.length-1)*rules.attributeGap,h=s.h+(rows.length?rules.attributeLevelGap+height:0),positions=[{id,x:w/2,y:h-s.h/2}];let y=0;
 for(const r of rows){let x=(w-r.w)/2;for(const p of r.parts){for(const at of p.positions)positions.push({id:at.id,x:at.x+x,y:at.y+y+r.h-p.h});x+=p.w+rules.attributeGap;}y+=r.h+rules.attributeGap;}return {positions,w,h};}
 return (id,direction=0)=>{const key=id+':'+direction;if(cache.has(key))return cache.get(key);const base=tree(id,direction%2===1),origin=base.positions[0];const positions=base.positions.map(p=>{const x=p.x-origin.x,y=p.y-origin.y;return {id:p.id,x:direction===1?-y:direction===3?y:x,y:direction===1||direction===3?x:direction===2?-y:y};});const b=bounds(positions.map(p=>rect(p,size(f.byId.get(p.id))))),result={id,positions,...b,w:b.r-b.l,h:b.b-b.t};cache.set(key,result);return result;};
}
function components(nodes,links){const graph=new Map(nodes.map(n=>[n.id,new Set()])),byId=new Map(nodes.map(n=>[n.id,n]));for(const e of links)if(e.source!==e.target&&graph.has(e.source)&&graph.has(e.target)){graph.get(e.source).add(e.target);graph.get(e.target).add(e.source);}const seen=new Set(),out=[];
 for(const seed of [...nodes].sort(compare)){if(seen.has(seed.id))continue;const queue=[seed.id];seen.add(seed.id);for(let i=0;i<queue.length;i++)for(const id of [...graph.get(queue[i])].sort((a,b)=>compare(byId.get(a),byId.get(b))))if(!seen.has(id)){seen.add(id);queue.push(id);}out.push(queue.map(id=>byId.get(id)));}return {graph,components:out,byId};}
function topology(nodes,graph,byId,mode){
 const sorted=[...nodes].sort(compare),isChain=nodes.every(n=>graph.get(n.id).size<=2)&&nodes.some(n=>graph.get(n.id).size<=1),seed=isChain?sorted.find(n=>graph.get(n.id).size<=1):[...sorted].sort((a,b)=>graph.get(b.id).size-graph.get(a.id).size||compare(a,b))[0],hub=seed.id;
 const edgeCount=nodes.reduce((s,n)=>s+graph.get(n.id).size,0)/2;
 if(mode==='balanced'&&nodes.length<=60&&graph.get(hub).size>=3&&graph.get(hub).size<=4&&edgeCount===nodes.length-1){
  const cells=new Map([[hub,{x:0,y:0}]]),occupied=new Set(['0,0']),directions=new Map([[hub,0]]),queue=[hub],incoming=new Map(),base=[[-1,0],[1,0],[0,1],[0,-1]];
  for(let i=0;i<queue.length;i++){const id=queue[i],at=cells.get(id),forward=incoming.get(id),ports=forward?[forward,[-forward[1],forward[0]],[forward[1],-forward[0]],[-forward[0],-forward[1]]]:base;
   for(const next of [...graph.get(id)].sort((a,b)=>compare(byId.get(a),byId.get(b)))){if(cells.has(next))continue;let target;for(let distance=1;distance<=nodes.length&&!target;distance++)for(const [dx,dy] of ports){const point={x:at.x+dx*distance,y:at.y+dy*distance};if(!occupied.has(point.x+','+point.y)){target=point;incoming.set(next,[dx,dy]);directions.set(next,dx===-1?3:dx===1?1:dy===1?2:0);break;}}cells.set(next,target);occupied.add(target.x+','+target.y);queue.push(next);}
  }
  return {kind:'branches',cells,directions};
 }
 const seen=new Set([hub]),queue=[hub],ranks=new Map([[hub,0]]);for(let i=0;i<queue.length;i++)for(const id of [...graph.get(queue[i])].sort((a,b)=>compare(byId.get(a),byId.get(b))))if(!seen.has(id)){seen.add(id);ranks.set(id,ranks.get(queue[i])+1);queue.push(id);}
 let cells=new Map();if(mode!=='balanced'){const levels=new Map();for(const id of queue){const rank=ranks.get(id);if(!levels.has(rank))levels.set(rank,[]);levels.get(rank).push(id);}for(const [rank,ids] of levels)ids.forEach((id,i)=>cells.set(id,mode==='vertical'?{x:i,y:rank}:{x:rank,y:i}));}
 else {const cols=nodes.length<=4?nodes.length:Math.min(5,Math.ceil(Math.sqrt(nodes.length)));queue.forEach((id,i)=>{const row=Math.floor(i/cols),column=i%cols;cells.set(id,{x:row%2?cols-1-column:column,y:row});});}
 return {kind:isChain?'chain':'layers',cells,directions:new Map(queue.map(id=>[id,mode==='vertical'?3:0]))};
}
function gridCenters(plan,panels,corridor){const cells=[...plan.cells.values()],minX=Math.min(...cells.map(c=>c.x)),maxX=Math.max(...cells.map(c=>c.x)),minY=Math.min(...cells.map(c=>c.y)),maxY=Math.max(...cells.map(c=>c.y)),cols=Array.from({length:maxX-minX+1},()=>({before:0,after:0})),rows=Array.from({length:maxY-minY+1},()=>({before:0,after:0}));
 for(const [id,cell] of plan.cells){const p=panels.get(id),c=cols[cell.x-minX],r=rows[cell.y-minY];c.before=Math.max(c.before,-p.l);c.after=Math.max(c.after,p.r);r.before=Math.max(r.before,-p.t);r.after=Math.max(r.after,p.b);}
 const centers=(slots,gap)=>{let at=0;return slots.map((s,i)=>{if(i)at+=slots[i-1].after+s.before+gap;return at;});},xs=centers(cols,corridor.x),ys=centers(rows,corridor.y);return new Map([...plan.cells].map(([id,c])=>[id,{x:xs[c.x-minX],y:ys[c.y-minY]}]));}
const placePanel=(p,at)=>({id:p.id,positions:p.positions.map(n=>({id:n.id,x:n.x+at.x,y:n.y+at.y})),l:p.l+at.x,r:p.r+at.x,t:p.t+at.y,b:p.b+at.y});
function arrangeChen(model,f,rules,mode){
 const panel=panelFactory(f,rules),entities=f.roots.filter(n=>n.type==='entity'),relationships=f.roots.filter(n=>n.type==='relationship'),participants=new Map(relationships.map(r=>[r.id,[...new Set(f.adj.get(r.id).filter(id=>f.byId.get(id).type==='entity'))].sort((a,b)=>compare(f.byId.get(a),f.byId.get(b)))])),links=relationships.flatMap(r=>{const ps=participants.get(r.id);return ps.slice(1).map(id=>({source:ps[0],target:id}));}),network=components(entities,links),groups=[],claimedRelationships=new Set();
 for(const ns of network.components){const ids=new Set(ns.map(n=>n.id)),rs=relationships.filter(r=>participants.get(r.id).some(id=>ids.has(id))),plan=topology(ns,network.graph,network.byId,mode),panels=new Map(ns.map(n=>[n.id,panel(n.id,plan.directions.get(n.id))])),relW=Math.max(200,...rs.map(r=>size(r).w)),relH=Math.max(110,...rs.map(r=>size(r).h)),centers=gridCenters(plan,panels,{x:relW+rules.clusterGap*2,y:relH+rules.clusterGap*2}),placed=ns.map(n=>placePanel(panels.get(n.id),centers.get(n.id))),positions=new Map(placed.flatMap(p=>p.positions).map(n=>[n.id,n])),majorSegments=[];
 const groupBounds=bounds(placed),mid={x:(groupBounds.l+groupBounds.r)/2,y:(groupBounds.t+groupBounds.b)/2};
 for(const r of [...rs].sort(compare)){claimedRelationships.add(r.id);const ps=participants.get(r.id).map(id=>positions.get(id)),cx=median(ps.map(n=>n.x)),cy=median(ps.map(n=>n.y)),vertical=ps.length===2&&Math.abs(ps[0].y-ps[1].y)>Math.abs(ps[0].x-ps[1].x),directions=vertical?[cx>=mid.x?1:3,cx>=mid.x?3:1,0,2]:[cy<=mid.y?0:2,cy<=mid.y?2:0,1,3];let best=null;
 const valid=(p,at)=>{const candidate=placePanel(p,at);const occupied=placed.flatMap(other=>other.positions).map(n=>rect(n,size(f.byId.get(n.id))));return candidate.positions.every(n=>occupied.every(r=>!overlap(rect(n,size(f.byId.get(n.id))),r,rules.shapeGap)))?candidate:null;};
 // Binary relationships first occupy their direct midpoint, with attributes
 // perpendicular to the connection axis. Repeated relationships use lanes.
 const maxDimension=Math.max(...directions.map(d=>{const p=panel(r.id,d);return vertical?p.w:p.h;}))+rules.shapeGap*2;
 const candidates=[{x:cx,y:cy}];for(let lane=1;lane<=rs.length+2;lane++)for(const sign of [1,-1])candidates.push({x:cx+(vertical?sign*lane*maxDimension:0),y:cy+(vertical?0:sign*lane*maxDimension)});
 for(const at of candidates){for(const d of directions){const p=panel(r.id,d),candidate=valid(p,at);if(!candidate)continue;let crossings=0;for(const e of ps)for(const old of majorSegments)if(e.id!==old.id&&cross(e,at,old.a,old.b))crossings++;const score=ps.reduce((s,n)=>s+Math.hypot(at.x-n.x,at.y-n.y),0)+crossings*80+Math.hypot(at.x-cx,at.y-cy)*.2+directions.indexOf(d)*.001;if(!best||score<best.score)best={candidate,at,score};}if(best&&at.x===cx&&at.y===cy)break;}
 // A reserved shelf is the legal fallback for crowded n-ary junctions and
 // unusually large relationship attribute trees; it never overlaps a cluster.
 if(!best){const b=bounds(placed),p=panel(r.id,directions[0]),at={x:cx,y:b.b+rules.clusterGap-p.t};best={candidate:placePanel(p,at),at};}
 placed.push(best.candidate);for(const p of best.candidate.positions)positions.set(p.id,p);for(const n of ps)majorSegments.push({id:n.id,a:n,b:best.at});}
 groups.push({positions:[...positions.values()],...bounds(placed),kind:plan.kind});
 }
 for(const root of f.roots.filter(n=>n.type==='attribute'||n.type==='relationship'&&!claimedRelationships.has(n.id))){const p=panel(root.id);groups.push({...placePanel(p,{x:0,y:0}),kind:'isolated'});}
 return groups;
}
function packComponents(groups,rules,mode){if(!groups.length)return [];
 const area=groups.reduce((s,g)=>s+(g.r-g.l+rules.componentGap)*(g.b-g.t+rules.componentGap),0),target=Math.max(...groups.map(g=>g.r-g.l),Math.sqrt(area)*1.45),out=[];let x=0,y=0,rowH=0;
 for(const g of groups){const w=g.r-g.l,h=g.b-g.t;if(x&&x+w>target){x=0;y+=rowH+rules.componentGap;rowH=0;}for(const p of g.positions)out.push({id:p.id,x:p.x-g.l+x,y:p.y-g.t+y});x+=w+rules.componentGap;rowH=Math.max(rowH,h);}return out;}
function cross(a,b,c,d){const side=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return side(a,b,c)*side(a,b,d)<0&&side(c,d,a)*side(c,d,b)<0;}
export function planChenLayout(model,options={},attempt=0){
 const mode=['horizontal','vertical'].includes(options.direction)?options.direction:'balanced',rules={...LAYOUT_RULES,...(options.spacing==='compact'?{attributeGap:36,attributeLevelGap:72,clusterGap:80,componentGap:160}:{})},f=forest(model),candidate=JSON.parse(JSON.stringify(model));
 if(!model.nodes.length)return {model:candidate,report:{overlaps:0,components:0,visibleNodes:0,direction:mode}};
 rules.clusterGap*=2**attempt;rules.componentGap*=2**attempt;
 let groups=arrangeChen(model,f,rules,mode),positions=packComponents(groups,rules,mode),byId=new Map(candidate.nodes.map(n=>[n.id,n]));
 for(const p of positions)Object.assign(byId.get(p.id),{x:p.x,y:p.y});
 const visible=candidate.nodes,b=bounds(visible.map(n=>rect(n,size(n)))),dx=(b.l+b.r)/2,dy=(b.t+b.b)/2;
 for(const n of candidate.nodes){n.x-=dx;n.y-=dy;}
 if(b.r-b.l>rules.maxExtent||b.b-b.t>rules.maxExtent){if(mode!=='balanced')return planChenLayout(model,{...options,direction:'balanced'});throw Error('This diagram is too large to arrange within the canvas limits. Reduce the number of elements or split it into diagrams.');}
 for(const e of candidate.edges){e.points=[];e.routing='straight';{const a=byId.get(e.source),b=byId.get(e.target);if(a.type!=='attribute'&&b.type!=='attribute'&&candidate.nodes.some(n=>n.id!==a.id&&n.id!==b.id&&intersects(a,b,rect(n,size(n),12))))e.routing='orthogonal';}}
 // Separate the two legs of a recursive Chen relationship at the entity.
 {const pairs=new Map();for(const e of candidate.edges){const a=byId.get(e.source),b=byId.get(e.target);if(a.type==='attribute'||b.type==='attribute')continue;const key=[a.id,b.id].sort().join('|');if(!pairs.has(key))pairs.set(key,[]);pairs.get(key).push(e);}for(const edges of pairs.values())if(edges.length>1){const sorted=[...edges].sort((a,b)=>lexical(a.id,b.id));sorted.forEach((e,i)=>{const a=byId.get(e.source),b=byId.get(e.target),offset=(i-(sorted.length-1)/2)*72,vertical=Math.abs(b.y-a.y)>Math.abs(b.x-a.x);e.routing='orthogonal';e.points=vertical?[{x:a.x+offset,y:a.y+(b.y-a.y)/3},{x:b.x+offset,y:a.y+(b.y-a.y)*2/3}]:[{x:a.x+(b.x-a.x)/3,y:a.y+offset},{x:a.x+(b.x-a.x)*2/3,y:b.y+offset}];});}}
 const inspection=inspectLayout(candidate,{connections:true});if((inspection.blocked.length||inspection.labelIssues.length)&&attempt<3)return planChenLayout(model,options,attempt+1);if(inspection.overlaps.length||inspection.outOfBounds.length||inspection.blocked.length||inspection.labelIssues.length)throw Object.assign(Error('The layout did not pass its spacing checks. Your previous positions were preserved.'),{details:inspection,candidate});
 return {model:candidate,report:{engine:'chen',algorithm:'chen-clusters',overlaps:0,components:groups.length,visibleNodes:inspection.visibleNodes,direction:mode,spacing:options.spacing==='compact'?'compact':'comfortable',rules:LAYOUT_RULES}};
}
