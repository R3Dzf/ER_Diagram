import {size} from './core.js';
import {intersects} from './routing.js';
import {crowSize,attached} from './crowfoot.js';

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

// Pack whole attribute trees before packing their owning elements. Each panel
// reserves the actual dimensions of its descendants, including composite nodes.
export function autoLayout(model){
 if(!model.nodes.length)return;
 const {graph,byId}=adjacency(model),major=model.nodes.filter(n=>n.type!=='attribute'),roots=[],seen=new Set(),children=new Map(model.nodes.map(n=>[n.id,[]]));
 // Keep connected major elements near each other rather than using creation order.
 for(const n of major)if(!seen.has(n.id)){const queue=[n.id];seen.add(n.id);for(let i=0;i<queue.length;i++){const id=queue[i];roots.push(id);for(const next of graph.get(id))if(byId.get(next).type!=='attribute'&&!seen.has(next)){seen.add(next);queue.push(next);}}}
 const claimed=new Set(roots),queue=[...roots];
 const grow=()=>{for(let i=0;i<queue.length;i++)for(const next of graph.get(queue[i]))if(byId.get(next).type==='attribute'&&!claimed.has(next)){claimed.add(next);children.get(queue[i]).push(next);queue.push(next);}};
 grow();
 for(const n of model.nodes)if(!claimed.has(n.id)){roots.push(n.id);claimed.add(n.id);queue.length=0;queue.push(n.id);grow();}
 const gap=48,levelGap=110;
 function tree(id,vertical=false){
  const n=byId.get(id),actual=model.notation==='crowfoot'&&n.type!=='attribute'?crowSize({...n,rows:attached(model,id)}):size(n),s=vertical?{w:actual.h,h:actual.w}:actual,parts=children.get(id).map(child=>tree(child,vertical)),rows=[];
  let row={parts:[],w:0,h:0};
  for(const p of parts){if(row.parts.length&&row.w+gap+p.w>1600){rows.push(row);row={parts:[],w:0,h:0};}row.w+=(row.parts.length?gap:0)+p.w;row.h=Math.max(row.h,p.h);row.parts.push(p);}
  if(row.parts.length)rows.push(row);
  const w=Math.max(s.w,...rows.map(r=>r.w)),childHeight=rows.reduce((h,r)=>h+r.h,0)+Math.max(0,rows.length-1)*gap,h=s.h+(rows.length?levelGap+childHeight:0);
  const positions=[{id,x:w/2,y:h-s.h/2}];let y=0;
  for(const r of rows){let x=(w-r.w)/2;for(const p of r.parts){for(const pos of p.positions)positions.push({...pos,x:pos.x+x,y:pos.y+y+r.h-p.h});x+=p.w+gap;}y+=r.h+gap;}
  return {w,h,positions};
 }
 const panels=new Map();
 function panel(id,direction=0){
  const key=id+':'+direction;if(panels.has(key))return panels.get(key);
  const base=tree(id,direction%2===1);if(!direction){panels.set(key,base);return base;}
  const root=base.positions[0],positions=base.positions.map(pos=>{const x=pos.x-root.x,y=pos.y-root.y;return {id:pos.id,x:direction===1?-y:direction===2?-x:y,y:direction===1?x:direction===2?-y:-x};});
  let l=Infinity,r=-Infinity,t=Infinity,b=-Infinity;
  for(const pos of positions){const n=byId.get(pos.id),d=size(n);l=Math.min(l,pos.x-d.w/2);r=Math.max(r,pos.x+d.w/2);t=Math.min(t,pos.y-d.h/2);b=Math.max(b,pos.y+d.h/2);}
  const result={w:r-l,h:b-t,positions:positions.map(pos=>({...pos,x:pos.x-l,y:pos.y-t}))};panels.set(key,result);return result;
 }

 if(model.notation!=='crowfoot'&&connectedLayout(model,roots,panel,graph,byId)){for(const e of model.edges){e.points=[];e.routing='straight';}return;}
 const blocks=roots.map(panel),cols=Math.max(1,Math.ceil(Math.sqrt(blocks.length))),colWidths=Array(cols).fill(0),rowHeights=Array(Math.ceil(blocks.length/cols)).fill(0);
 blocks.forEach((p,i)=>{colWidths[i%cols]=Math.max(colWidths[i%cols],p.w);rowHeights[Math.floor(i/cols)]=Math.max(rowHeights[Math.floor(i/cols)],p.h);});
 const starts=values=>{let next=0;return values.map(v=>{const start=next;next+=v+180;return start;});},xs=starts(colWidths),ys=starts(rowHeights),width=xs.at(-1)+colWidths.at(-1),height=ys.at(-1)+rowHeights.at(-1);
 blocks.forEach((p,i)=>{const c=i%cols,r=Math.floor(i/cols);for(const pos of p.positions){const n=byId.get(pos.id);n.x=pos.x+xs[c]+(colWidths[c]-p.w)/2-width/2;n.y=pos.y+ys[r]+rowHeights[r]-p.h-height/2;}});
 // Layout uses independent direct connections behind the shape layer. An
 // explicit orthogonal route can still be selected in the connection inspector.
 for(const e of model.edges){e.points=[];e.routing='straight';}
}

// Entity clusters reserve their complete attribute trees. Relationships are
// then placed near their actual participants, in clear corridors between them.
function connectedLayout(model,roots,panel,graph,byId){
 const entities=roots.filter(id=>byId.get(id).type==='entity');if(!entities.length)return false;
 const relationships=roots.filter(id=>byId.get(id).type==='relationship'),neighbors=new Map(entities.map(id=>[id,new Set()]));
 const participants=id=>[...new Set(graph.get(id).filter(id=>byId.get(id).type==='entity'))];
 for(const id of relationships){const ps=participants(id);for(const a of ps)for(const b of ps)if(a!==b)neighbors.get(a).add(b);}
 const ordered=[],seen=new Set();
 // Starting at a leaf keeps a chain in reading order. Stable IDs/order make
 // repeated layout deterministic, independently of its previous coordinates.
 for(const seed of [...entities].sort((a,b)=>neighbors.get(a).size-neighbors.get(b).size)){
  if(seen.has(seed))continue;const queue=[seed];seen.add(seed);
  for(let i=0;i<queue.length;i++){const id=queue[i];ordered.push(id);for(const next of neighbors.get(id))if(!seen.has(next)){seen.add(next);queue.push(next);}}
 }
 const plan=topologyPlan(entities,neighbors,panel);
 const blocks=new Map(roots.map(id=>[id,panel(id,plan?.directions.get(id)||0)])),placed=[],directions=new Map(entities.map(id=>[id,[]]));
 const rootPoint=p=>p.positions[0];
 function place(id,x,y){const p=blocks.get(id);for(const pos of p.positions){const n=byId.get(pos.id);n.x=x+pos.x;n.y=y+pos.y;}placed.push({id,l:x,r:x+p.w,t:y,b:y+p.h});}
 const cols=entities.length<=3?entities.length:Math.ceil(Math.sqrt(entities.length)),widths=Array(cols).fill(0),heights=Array(Math.ceil(entities.length/cols)).fill(0);
 ordered.forEach((id,i)=>{const p=blocks.get(id);widths[i%cols]=Math.max(widths[i%cols],p.w);heights[Math.floor(i/cols)]=Math.max(heights[Math.floor(i/cols)],p.h);});
 const corridor=Math.max(320,...relationships.map(id=>blocks.get(id).w+100));
 const starts=values=>{let at=0;return values.map(value=>{const start=at;at+=value+corridor;return start;});},xs=starts(widths),ys=starts(heights);
 if(plan){for(const id of entities){const p=blocks.get(id),root=p.positions[0],at=plan.centers.get(id);place(id,at.x-root.x,at.y-root.y);}}else ordered.forEach((id,i)=>{const p=blocks.get(id),c=i%cols,r=Math.floor(i/cols);place(id,xs[c]+(widths[c]-p.w)/2,ys[r]+heights[r]-p.h);});
 const overlaps=(a,b)=>a.l<b.r+36&&a.r>b.l-36&&a.t<b.b+36&&a.b>b.t-36;
 const nodeRect=n=>{const s=size(n);return {l:n.x-s.w/2-12,r:n.x+s.w/2+12,t:n.y-s.h/2-12,b:n.y+s.h/2+12};};
 const majorLinks=[];
 for(const id of relationships){
  let p=blocks.get(id),root=rootPoint(p);const ps=participants(id).map(id=>byId.get(id));
  const cx=ps.length?ps.reduce((x,n)=>x+n.x,0)/ps.length:0,cy=ps.length?ps.reduce((y,n)=>y+n.y,0)/ps.length:Math.max(...placed.map(r=>r.b))+p.h;
  let best=null,bestScore=Infinity;
  function consider(x,y,variant=p){
   const origin=variant.positions[0],rect={l:x-origin.x,r:x-origin.x+variant.w,t:y-origin.y,b:y-origin.y+variant.h};
   // Empty space within an attribute fan is usable by a relationship. Check
   // real shape bounds rather than rejecting its entire enclosing rectangle.
   for(const q of placed){if(!overlaps(rect,q))continue;for(const pos of variant.positions){const n=byId.get(pos.id),at={...n,x:x-origin.x+pos.x,y:y-origin.y+pos.y};for(const old of blocks.get(q.id).positions)if(overlaps(nodeRect(at),nodeRect(byId.get(old.id))))return;}}

   let score=0;
   for(const n of ps){
    score+=Math.hypot(x-n.x,y-n.y);
    for(const pos of variant.positions.slice(1)){const own={...byId.get(pos.id),x:x-origin.x+pos.x,y:y-origin.y+pos.y};if(intersects(n,{x,y},nodeRect(own)))score+=1000;}

    const angle=Math.atan2(y-n.y,x-n.x);
    for(const old of directions.get(n.id)){const diff=Math.abs(Math.atan2(Math.sin(angle-old),Math.cos(angle-old)));if(diff<.4)score+=(.4-diff)*10000;}
    // A short line is still a poor choice if it runs through another element.
    for(const q of placed)for(const pos of blocks.get(q.id).positions){if(pos.id===n.id)continue;const other=byId.get(pos.id);if(intersects(n,{x,y},nodeRect(other)))score+=other.type==='attribute'?500:2000;}
    for(const link of majorLinks)if(link.entity!==n.id&&segmentsCross(n,{x,y},link.a,link.b))score+=240;
   }
   score+=Math.hypot(x-cx,y-cy)*.12;
   if(score<bestScore){bestScore=score;best={x,y,variant};}
  }
  const variants=[0,1,2,3].map(direction=>panel(id,direction));
  for(const variant of variants)consider(cx,cy,variant);
  // Search nearby positions on a deterministic grid, preferring the direct
  // midpoint when it is clear. Additional lanes separate repeated relations.
  for(let ring=1;ring<=12;ring++){const step=90;for(let k=-ring;k<=ring;k++){for(const variant of variants){consider(cx+k*step,cy-ring*step,variant);consider(cx+k*step,cy+ring*step,variant);if(Math.abs(k)<ring){consider(cx-ring*step,cy+k*step,variant);consider(cx+ring*step,cy+k*step,variant);}}}}
  // Large attribute trees or extremely dense graphs always get a free panel.
  if(!best)best={x:cx,y:Math.max(...placed.map(r=>r.b))+80+root.y};
  p=best.variant||p;root=rootPoint(p);blocks.set(id,p);place(id,best.x-root.x,best.y-root.y);
  for(const n of ps){directions.get(n.id).push(Math.atan2(best.y-n.y,best.x-n.x));majorLinks.push({entity:n.id,a:{x:n.x,y:n.y},b:best});}
 }
 let orphanX=0,orphanY=Math.max(...placed.map(r=>r.b))+180,rowHeight=0;
 for(const id of roots.filter(id=>byId.get(id).type==='attribute')){const p=blocks.get(id);if(orphanX&&orphanX+p.w>2000){orphanX=0;orphanY+=rowHeight+100;rowHeight=0;}place(id,orphanX,orphanY);orphanX+=p.w+100;rowHeight=Math.max(rowHeight,p.h);}
 const midX=(Math.min(...placed.map(r=>r.l))+Math.max(...placed.map(r=>r.r)))/2,midY=(Math.min(...placed.map(r=>r.t))+Math.max(...placed.map(r=>r.b)))/2;
 for(const n of model.nodes){n.x-=midX;n.y-=midY;}
 return true;
}
function segmentsCross(a,b,c,d){const side=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return side(a,b,c)*side(a,b,d)<0&&side(c,d,a)*side(c,d,b)<0;}

// Branching components start at their hub, with neighbors on separate sides.
// Attribute fans point toward free space rather than into connection corridors.
function topologyPlan(entities,neighbors,panel){
 if(entities.length>80||!entities.some(id=>neighbors.get(id).size>=3))return null;
 const cells=new Map(),occupied=new Set(),directions=new Map(),ports=[[-1,0],[1,0],[0,1],[0,-1]],key=(x,y)=>x+','+y;
 let nextOrigin=0;
 for(const seed of [...entities].sort((a,b)=>neighbors.get(b).size-neighbors.get(a).size)){
  if(cells.has(seed))continue;cells.set(seed,{x:nextOrigin,y:0});occupied.add(key(nextOrigin,0));const queue=[seed];
  for(let i=0;i<queue.length;i++){
   const at=cells.get(queue[i]);
   for(const id of neighbors.get(queue[i])){
    if(cells.has(id))continue;let best=null,bestScore=Infinity;
    for(let radius=1;radius<=Math.ceil(Math.sqrt(entities.length))+2&&!best;radius++)for(const [dx,dy] of ports)for(let offset=0;offset<radius;offset++){
     const x=at.x+dx*radius+(dy?offset:0),y=at.y+dy*radius+(dx?offset:0);if(occupied.has(key(x,y)))continue;
     let score=radius*10+offset*3;for(const neighbor of neighbors.get(id)){const p=cells.get(neighbor);if(p)score+=Math.abs(p.x-x)+Math.abs(p.y-y);}
     if(score<bestScore){bestScore=score;best={x,y};}
    }
    if(!best)return null;cells.set(id,best);occupied.add(key(best.x,best.y));queue.push(id);
   }
  }
  nextOrigin=Math.max(...[...cells.values()].map(p=>p.x))+4;
 }
 const attributeDirections=[[0,-1],[1,0],[0,1],[-1,0]],center={x:[...cells.values()].reduce((n,p)=>n+p.x,0)/entities.length,y:[...cells.values()].reduce((n,p)=>n+p.y,0)/entities.length};
 for(const id of entities){const at=cells.get(id);let selected=0,best=Infinity;
  attributeDirections.forEach(([dx,dy],direction)=>{let score=((center.x-at.x)*dx+(center.y-at.y)*dy)*2;
   for(const neighbor of neighbors.get(id)){const p=cells.get(neighbor),vx=p.x-at.x,vy=p.y-at.y;score+=Math.max(0,(vx*dx+vy*dy)/(Math.hypot(vx,vy)||1))*100;}
   if(score<best){best=score;selected=direction;}
  });directions.set(id,selected);
 }
 const blocks=new Map(entities.map(id=>[id,panel(id,directions.get(id))]));
 // Deep attribute trees use the general cluster packer to keep coordinates
 // bounded instead of multiplying their height by every topology grid row.
 if([...blocks.values()].some(p=>p.w>2500||p.h>2500))return null;
 let pitchX=600,pitchY=380;
 for(let i=0;i<entities.length;i++)for(let j=0;j<i;j++){
  const a=entities[i],b=entities[j],ca=cells.get(a),cb=cells.get(b),pa=blocks.get(a),pb=blocks.get(b),ra=pa.positions[0],rb=pb.positions[0];
  if(ca.y===cb.y){const left=ca.x<cb.x?{p:pa,r:ra}:{p:pb,r:rb},right=ca.x<cb.x?{p:pb,r:rb}:{p:pa,r:ra};pitchX=Math.max(pitchX,(left.p.w-left.r.x+right.r.x+100)/Math.abs(ca.x-cb.x));}
  if(ca.x===cb.x){const top=ca.y<cb.y?{p:pa,r:ra}:{p:pb,r:rb},bottom=ca.y<cb.y?{p:pb,r:rb}:{p:pa,r:ra};pitchY=Math.max(pitchY,(top.p.h-top.r.y+bottom.r.y+100)/Math.abs(ca.y-cb.y));}
 }
 // Diagonal fans can meet at a corner. Expand both axes until every reserved
 // cluster is clear; the finite limit preserves the model coordinate bounds.
 for(let pass=0;pass<20;pass++){
  let collision=false;const rects=entities.map(id=>{const p=blocks.get(id),r=p.positions[0],c=cells.get(id);return {l:c.x*pitchX-r.x,r:c.x*pitchX-r.x+p.w,t:c.y*pitchY-r.y,b:c.y*pitchY-r.y+p.h};});
  for(let i=0;i<rects.length;i++)for(let j=0;j<i;j++){const a=rects[i],b=rects[j];if(a.l<b.r+40&&a.r>b.l-40&&a.t<b.b+40&&a.b>b.t-40)collision=true;}
  if(!collision){if(Math.max(...rects.map(r=>r.r))-Math.min(...rects.map(r=>r.l))>190000||Math.max(...rects.map(r=>r.b))-Math.min(...rects.map(r=>r.t))>190000)return null;return {directions,centers:new Map(entities.map(id=>{const c=cells.get(id);return [id,{x:c.x*pitchX,y:c.y*pitchY}];}))};}
  pitchX*=1.15;pitchY*=1.15;
 }
 return null;
}
