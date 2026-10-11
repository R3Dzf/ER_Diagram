const cache=new Map();
export function intersects(a,b,r){const x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y);if(a.x===b.x)return a.x>r.l&&a.x<r.r&&y1>r.t&&y0<r.b;if(a.y===b.y)return a.y>r.t&&a.y<r.b&&x1>r.l&&x0<r.r;let lo=0,hi=1;for(const [p,q] of [[-(b.x-a.x),a.x-r.l],[b.x-a.x,r.r-a.x],[-(b.y-a.y),a.y-r.t],[b.y-a.y,r.b-a.y]]){if(!p){if(q<0)return false;continue;}const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false;}return true;}
const simplify=points=>points.filter((p,i,a)=>!i||i===a.length-1||!((a[i-1].x===p.x&&p.x===a[i+1].x)||(a[i-1].y===p.y&&p.y===a[i+1].y)));
export function route(e,nodes,size,boundary){const a=nodes.find(n=>n.id===e.source),b=nodes.find(n=>n.id===e.target);if(!a||!b)return [];
 if(e.points?.length)return [boundary(a,e.points[0]),...e.points,boundary(b,e.points.at(-1))];
 // Attribute spokes may pass behind other shapes. Detouring each spoke around
 // nearby attributes merges unrelated connections into the same stepped route.
 if(e.routing!=='orthogonal'||a.type==='attribute'||b.type==='attribute')return [boundary(a,b),boundary(b,a)];
 const signature=JSON.stringify([e.source,e.target,nodes.map(n=>[n.id,n.x,n.y,n.name,n.type,size(n).w,size(n).h]).sort((a,b)=>a[0]<b[0]?-1:1)]);if(cache.has(signature))return cache.get(signature).map(p=>({...p}));
 const obstacles=nodes.filter(n=>n!==a&&n!==b).map(n=>{const s=size(n);return {id:n.id,l:n.x-s.w/2-12,r:n.x+s.w/2+12,t:n.y-s.h/2-12,b:n.y+s.h/2+12};});
 const clear=(p,q)=>!obstacles.some(r=>intersects(p,q,r)),complete=points=>{points=simplify(points);if(points.length>1){points[0]=boundary(a,points[1]);points[points.length-1]=boundary(b,points.at(-2));}if(cache.size>1000)cache.clear();cache.set(signature,points);return points.map(p=>({...p}));};
 if((a.x===b.x||a.y===b.y)&&clear(a,b))return complete([{x:a.x,y:a.y},{x:b.x,y:b.y}]);
 const elbows=[[{x:a.x,y:a.y},{x:b.x,y:a.y},{x:b.x,y:b.y}],[{x:a.x,y:a.y},{x:a.x,y:b.y},{x:b.x,y:b.y}]];
 for(const points of elbows)if(points.slice(1).every((p,i)=>clear(points[i],p)))return complete(points);
 const xs=[a.x,b.x],ys=[a.y,b.y],near=obstacles.filter(r=>r.r>=Math.min(a.x,b.x)-350&&r.l<=Math.max(a.x,b.x)+350&&r.b>=Math.min(a.y,b.y)-350&&r.t<=Math.max(a.y,b.y)+350).sort((r,s)=>Math.hypot((r.l+r.r)/2-(a.x+b.x)/2,(r.t+r.b)/2-(a.y+b.y)/2)-Math.hypot((s.l+s.r)/2-(a.x+b.x)/2,(s.t+s.b)/2-(a.y+b.y)/2)||(r.id<s.id?-1:1)).slice(0,160);
 for(const r of near){xs.push(r.l,r.r);ys.push(r.t,r.b);}if(obstacles.length){xs.push(Math.min(...obstacles.map(r=>r.l))-24,Math.max(...obstacles.map(r=>r.r))+24);ys.push(Math.min(...obstacles.map(r=>r.t))-24,Math.max(...obstacles.map(r=>r.b))+24);}
 const X=[...new Set(xs)].sort((a,b)=>a-b),Y=[...new Set(ys)].sort((a,b)=>a-b),start=(Y.indexOf(a.y)*X.length+X.indexOf(a.x))*3,end=Y.indexOf(b.y)*X.length+X.indexOf(b.x),get=state=>{const i=Math.floor(state/3);return {x:X[i%X.length],y:Y[Math.floor(i/X.length)]};},dist=new Map([[start,0]]),prev=new Map(),heap=[],closed=new Set();let serial=0;
 const less=(a,b)=>a.score<b.score||a.score===b.score&&a.serial<b.serial;
 const push=(state,score)=>{const item={state,score,serial:serial++};let i=heap.length;heap.push(item);while(i){const parent=Math.floor((i-1)/2);if(!less(heap[i],heap[parent]))break;[heap[i],heap[parent]]=[heap[parent],heap[i]];i=parent;}};
 const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){let child=i*2+1;if(child>=heap.length)break;if(child+1<heap.length&&less(heap[child+1],heap[child]))child++;if(!less(heap[child],heap[i]))break;[heap[i],heap[child]]=[heap[child],heap[i]];i=child;}}return first;};
 push(start,Math.abs(a.x-b.x)+Math.abs(a.y-b.y));let finish=null,steps=0;
 while(heap.length&&steps++<100000){const {state}=pop();if(closed.has(state))continue;closed.add(state);const index=Math.floor(state/3),direction=state%3;if(index===end){finish=state;break;}const cx=index%X.length,cy=Math.floor(index/X.length);for(const [next,axis] of [[cx?index-1:-1,1],[cx<X.length-1?index+1:-1,1],[cy?index-X.length:-1,2],[cy<Y.length-1?index+X.length:-1,2]]){if(next<0)continue;const other=next*3+axis,p=get(state),q=get(other);if(!clear(p,q))continue;const d=dist.get(state)+Math.abs(p.x-q.x)+Math.abs(p.y-q.y)+(direction&&direction!==axis?32:0);if(d<(dist.get(other)??Infinity)){dist.set(other,d);prev.set(other,state);push(other,d+Math.abs(q.x-b.x)+Math.abs(q.y-b.y));}}}
 if(finish!==null){const points=[get(finish)];let at=finish;while(at!==start){at=prev.get(at);points.unshift(get(at));}return complete(points);}
 // Outer corridors are also tested against every obstacle. The layout planner
 // rejects a candidate if no clear route can be found, keeping the live model.
 for(const x of [X[0],X.at(-1)]){const p=[a,{x,y:a.y},{x,y:b.y},b];if(p.slice(1).every((q,i)=>clear(p[i],q)))return complete(p);}
 for(const y of [Y[0],Y.at(-1)]){const p=[a,{x:a.x,y},{x:b.x,y},b];if(p.slice(1).every((q,i)=>clear(p[i],q)))return complete(p);}
 return [boundary(a,b),boundary(b,a)];
}

export function offsetRoute(points,d){return points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],before=i?{x:p.x-a.x,y:p.y-a.y}:{x:b.x-p.x,y:b.y-p.y},after=i<points.length-1?{x:b.x-p.x,y:b.y-p.y}:before;const l=Math.hypot(before.x,before.y)||1,m=Math.hypot(after.x,after.y)||1,n1={x:-before.y/l,y:before.x/l},n2={x:-after.y/m,y:after.x/m},den=1+n1.x*n2.x+n1.y*n2.y;return {x:p.x+d*(n1.x+n2.x)/Math.max(.25,den),y:p.y+d*(n1.y+n2.y)/Math.max(.25,den)};});}
export const pathData=p=>p.map((v,i)=>(i?'L':'M')+v.x+' '+v.y).join('');
