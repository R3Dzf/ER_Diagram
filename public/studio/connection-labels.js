import {measureLabel} from './label-layout.js';
export const labelRect=l=>({l:l.x-l.w/2,r:l.x+l.w/2,t:l.y-l.h/2,b:l.y+l.h/2});
export const labelOverlap=(a,b,gap=8)=>a.l<b.r+gap&&a.r>b.l-gap&&a.t<b.b+gap&&a.b>b.t-gap;
// Stable placements use the actual path segments, avoid cards and endpoint
// markers, and reserve every preceding label before placing another one.
export function placeConnectionLabels(links,obstacles=[]){const reserved=[...obstacles],result=new Map();
 for(const e of [...links].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)){if(!e.text||e.points.length<2)continue;const w=Math.min(310,measureLabel(e.text,e.fontSize||12,500).width+24),h=26,segments=e.points.slice(1).map((b,i)=>({a:e.points[i],b,length:Math.hypot(b.x-e.points[i].x,b.y-e.points[i].y)})).sort((a,b)=>b.length-a.length),endpoints=[e.points[0],e.points.at(-1)].map(p=>({l:p.x-42,r:p.x+42,t:p.y-42,b:p.y+42}));let best;
  for(const segment of segments){for(const ratio of [.5,.35,.65,.2,.8]){const x=segment.a.x+(segment.b.x-segment.a.x)*ratio,y=segment.a.y+(segment.b.y-segment.a.y)*ratio,vertical=segment.a.x===segment.b.x;for(const shift of [0,-1,1,-2,2,-3,3]){const label={x:x+(vertical&&shift?Math.sign(shift)*(w/2+12+(Math.abs(shift)-1)*32):0),y:y+(!vertical?shift*28:0),w,h,valid:true},r=labelRect(label);if([...reserved,...endpoints].some(other=>labelOverlap(r,other)))continue;best=label;break;}if(best)break;}if(best)break;}
  if(!best){const s=segments[0];best={x:(s.a.x+s.b.x)/2,y:(s.a.y+s.b.y)/2,w,h,valid:false};}reserved.push(labelRect(best));result.set(e.id,best);
 }return result;}
