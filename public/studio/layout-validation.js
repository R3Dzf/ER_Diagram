import {size,boundary,chenLabelPlan} from './core.js';
import {crowProjection,crowSize,crowRoute,crowGeometry} from './crowfoot.js';
import {intersects,route} from './routing.js';
export const LAYOUT_RULES=Object.freeze({shapeGap:28,attributeGap:44,attributeLevelGap:84,clusterGap:100,componentGap:200,maxExtent:190000});
const rect=(n,s,pad=0)=>({l:n.x-s.w/2-pad,r:n.x+s.w/2+pad,t:n.y-s.h/2-pad,b:n.y+s.h/2+pad});
const overlap=(a,b,gap=0)=>a.l<b.r+gap-1e-6&&a.r>b.l-gap+1e-6&&a.t<b.b+gap-1e-6&&a.b>b.t-gap+1e-6;
export function inspectLayout(model,{gap=LAYOUT_RULES.shapeGap,connections=false}={}){
 const crow=model.notation==='crowfoot',projection=crow?crowProjection(model):null,nodes=crow?projection.cards:model.nodes,sizing=crow?crowSize:size,rects=nodes.map(n=>({id:n.id,...rect(n,sizing(n))})),overlaps=[];
 for(let i=0;i<rects.length;i++)for(let j=0;j<i;j++)if(overlap(rects[i],rects[j],gap))overlaps.push({a:rects[i].id,b:rects[j].id});const outOfBounds=model.nodes.filter(n=>!Number.isFinite(n.x)||!Number.isFinite(n.y)||Math.abs(n.x)>100000||Math.abs(n.y)>100000).map(n=>n.id),blocked=[];
 if(connections)for(const e of crow?projection.links:model.edges){if(!crow&&[e.source,e.target].some(id=>model.nodes.find(n=>n.id===id)?.type==='attribute'))continue;const points=crow?crowRoute(e,nodes):route(e,nodes,size,boundary);if(rects.some(r=>r.id!==e.source&&r.id!==e.target&&points.slice(1).some((p,i)=>intersects(points[i],p,r))))blocked.push(e.id);}
 const labelIssues=connections?(crow?crowGeometry(model).links.filter(e=>e.label&&!e.label.valid).map(e=>e.edge.id):[...chenLabelPlan(model)].filter(([,l])=>!l.valid).map(([id])=>id)):[];return {overlaps,outOfBounds,blocked,labelIssues,visibleNodes:nodes.length};
}
