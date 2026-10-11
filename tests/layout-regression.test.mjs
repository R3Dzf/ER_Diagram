import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {autoLayout,movementGroup,moveGroup} from '../public/studio/layout.js';
import {size,boundary,cardinalityPosition,graphMarkup,exportSVG,validateModel} from '../public/studio/core.js';
import {route} from '../public/studio/routing.js';
import {templates,library,flight} from '../public/studio/presets.js';

const node=(id,type='attribute',name=id)=>({id,type,name,x:0,y:0});
const edge=(source,target,extra={})=>({id:source+'_'+target,source,target,...extra});
function nonOverlapping(m){
 for(let i=0;i<m.nodes.length;i++)for(let j=0;j<i;j++){const a=m.nodes[i],b=m.nodes[j],sa=size(a),sb=size(b);assert.ok(Math.abs(a.x-b.x)>=(sa.w+sb.w)/2+20||Math.abs(a.y-b.y)>=(sa.h+sb.h)/2+20,`${a.id} overlaps ${b.id}`);}
 validateModel(m);
}
test('auto layout reserves complete clusters for adjacent entities and long attributes',()=>{
 for(const make of [...templates.map(t=>t.build),library,flight]){const m=make(),before=structuredClone(m);autoLayout(m);nonOverlapping(m);assert.deepEqual(m.nodes.map(n=>[n.id,n.name,n.type]),before.nodes.map(n=>[n.id,n.name,n.type]));assert.deepEqual(m.edges.map(e=>[e.source,e.target]),before.edges.map(e=>[e.source,e.target]));const first=structuredClone(m);autoLayout(m);assert.deepEqual(m,first);}
 const m={version:1,nodes:[node('Book','entity'),node('Author','entity'),node('Publisher','entity')],edges:[]};
 for(const root of [...m.nodes])for(let i=0;i<16;i++){const a=node(root.id+i,'attribute','Attribute with a very long name '.repeat(3));m.nodes.push(a);m.edges.push(edge(root.id,a.id,{points:[{x:1,y:2}],routing:'orthogonal'}));}
 autoLayout(m);nonOverlapping(m);assert.ok(m.edges.every(e=>e.routing==='straight'&&!e.points.length));
});
test('composite parents, cyclic/shared attributes, disconnected nodes and 500-element diagrams are laid out once without overlaps',()=>{
 const m={version:1,nodes:[node('E','entity'),node('F','entity'),node('composite'),node('given'),node('family'),node('orphan'),node('orphan_child')],edges:[edge('E','composite'),edge('composite','given'),edge('composite','family'),edge('given','family'),edge('F','given'),edge('orphan','orphan_child')]};
 autoLayout(m);nonOverlapping(m);assert.notDeepEqual([m.nodes[2].x,m.nodes[2].y],[0,0]);
 const dense={version:1,nodes:[node('E','entity')],edges:[]};for(let i=1;i<500;i++){dense.nodes.push(node('a'+i));dense.edges.push(edge('E','a'+i));}autoLayout(dense);nonOverlapping(dense);
 const chain={version:1,nodes:[node('E','entity')],edges:[]};for(let i=1;i<500;i++){chain.nodes.push(node('a'+i));chain.edges.push(edge(i===1?'E':'a'+(i-1),'a'+i));}autoLayout(chain);nonOverlapping(chain);
});
test('entity movement carries composite attributes and internal bends once while preserving other entities and individual attribute editing',()=>{
 const m={nodes:[node('E','entity'),node('F','entity'),node('R','relationship'),node('parent'),node('child'),node('sibling')],edges:[edge('E','parent'),edge('parent','child',{points:[{x:40,y:20}]}),edge('E','sibling'),edge('E','R'),edge('R','F')]};
 const ids=movementGroup(m,['E','child']);assert.deepEqual(new Set(ids),new Set(['E','parent','child','sibling']));
 const before=structuredClone(m);moveGroup(m,before,ids,130,-70);for(const n of m.nodes)assert.deepEqual([n.x,n.y],ids.includes(n.id)?[130,-70]:[0,0]);assert.deepEqual(m.edges[1].points,[{x:170,y:-50}]);
 moveGroup(m,before,ids,200,100);assert.equal(m.nodes[0].x,200);assert.deepEqual(m.edges[1].points,[{x:240,y:120}]);assert.deepEqual(movementGroup(m,['child']),['child']);
 moveGroup(m,before,ids,200000,0);assert.equal(m.nodes[0].x,100000);assert.ok(m.nodes.every(n=>n.x<=100000));
});
test('legacy automatic attribute routes remain direct behind opaque shapes, including exported SVG; manual bends remain editable',()=>{
 const nodes=[{...node('E','entity'),x:0,y:400},{...node('a'),x:-160,y:0},{...node('obstacle'),x:-80,y:200}],e=edge('E','a',{routing:'orthogonal'}),points=route(e,nodes,size,boundary);assert.equal(points.length,2);
 const {document}=parseHTML('<svg>'+graphMarkup({nodes,edges:[e]},{interactive:true})+'</svg>'),layers=document.querySelector('svg').children;
 assert.equal(layers[0].getAttribute('data-layer'),'connections');assert.equal(layers[1].getAttribute('data-layer'),'elements');assert.ok(layers[1].querySelector('[data-node="obstacle"] ellipse').parentNode.getAttribute('fill')!=='none');
 const svg=exportSVG({title:'Behind elements',nodes,edges:[e]}).svg;assert.ok(svg.indexOf('data-layer="connections"')<svg.indexOf('data-layer="elements"'));
 e.points=[{x:350,y:120}];assert.deepEqual(route(e,nodes,size,boundary)[1],e.points[0]);
});
test('chain relationships sit between their participants and separate outgoing cardinality labels in the library regression',()=>{
 const chain=templates[0].build();autoLayout(chain);for(const r of chain.nodes.filter(n=>n.type==='relationship')){const ps=chain.edges.filter(e=>e.source===r.id||e.target===r.id).map(e=>chain.nodes.find(n=>n.id===(e.source===r.id?e.target:e.source))).filter(n=>n.type==='entity');assert.ok(r.x>Math.min(...ps.map(n=>n.x))&&r.x<Math.max(...ps.map(n=>n.x)));assert.equal(r.y,ps[0].y);assert.equal(r.y,ps[1].y);}
 const m=library();autoLayout(m);nonOverlapping(m);const b=m.nodes.find(n=>n.name==='Book');const labels=m.edges.filter(e=>e.source===b.id||e.target===b.id).map(e=>m.nodes.find(n=>n.id===(e.source===b.id?e.target:e.source))).filter(n=>n.type==='relationship').map(r=>{return cardinalityPosition(b,boundary(b,r),r);});
 for(let i=0;i<labels.length;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(labels[i].x-labels[j].x,labels[i].y-labels[j].y)>=24,'Book cardinalities overlap');
 const w=m.nodes.find(n=>n.name==='Warehouse');assert.ok(Math.abs(w.y-b.y)>200,'four entity groups should not become one excessively wide row');
});
test('parallel, recursive and ternary relationships preserve the model and keep full relationship attribute panels clear',()=>{
 const m={version:1,title:'Multiple relationships',nodes:[node('E','entity'),node('F','entity'),node('G','entity'),node('r1','relationship'),node('r2','relationship'),node('r3','relationship'),node('r4','relationship'),node('detail')],edges:[edge('E','r1'),edge('r1','F'),edge('E','r2'),edge('r2','F'),edge('E','r3'),edge('r3','E',{id:'recursive_return'}),edge('E','r4'),edge('F','r4'),edge('G','r4'),edge('r4','detail')]};
 const endpoints=m.edges.map(e=>[e.id,e.source,e.target]);autoLayout(m);nonOverlapping(m);assert.deepEqual(m.edges.map(e=>[e.id,e.source,e.target]),endpoints);const first=structuredClone(m);autoLayout(m);assert.deepEqual(m,first);
});

test('a hub layout keeps all three library diamonds at direct midpoints and its relationship attribute off the connection axis',()=>{
 const m=library();autoLayout(m);const book=m.nodes.find(n=>n.name==='Book');
 for(const r of m.nodes.filter(n=>n.type==='relationship')){
  const endpoints=m.edges.filter(e=>e.source===r.id||e.target===r.id).map(e=>m.nodes.find(n=>n.id===(e.source===r.id?e.target:e.source))).filter(n=>n.type==='entity');
  assert.equal(r.x,(endpoints[0].x+endpoints[1].x)/2);assert.equal(r.y,(endpoints[0].y+endpoints[1].y)/2);
  assert.ok(endpoints[0].x===endpoints[1].x||endpoints[0].y===endpoints[1].y,'hub links should be on separate axes');
 }
 const stocks=m.nodes.find(n=>n.name==='Stocks'),copies=m.nodes.find(n=>n.name==='number_of_copies');assert.equal(stocks.x,book.x);assert.equal(copies.y,stocks.y);assert.ok(Math.abs(copies.x-stocks.x)>100);
 // Rebuild in the screenshot's creation/edge order, rather than relying on a
 // preset's incidental node order, and include a composite attribute fan.
 m.nodes.reverse();m.edges.reverse();const author=m.nodes.find(n=>n.name==='Author'),composite=node('composite','attribute','Composite name');m.nodes.push(composite,node('first','attribute','A long given name'),node('last','attribute','A long family name'));m.edges.push(edge(author.id,'composite'),edge('composite','first'),edge('composite','last'));autoLayout(m);nonOverlapping(m);
});
test('cardinality text clears the entity border at every outgoing angle and in rendered SVG',()=>{
 const entity=node('E','entity','Book'),{w,h}=size(entity);
 for(let degrees=0;degrees<360;degrees+=2){const a=degrees*Math.PI/180,other={x:Math.cos(a)*500,y:Math.sin(a)*500},p=cardinalityPosition(entity,boundary(entity,other),other);assert.ok(Math.abs(p.x)>=w/2+14||Math.abs(p.y)>=h/2+14,'label touches entity at '+degrees);}
 const m=library();autoLayout(m);const {document}=parseHTML('<svg>'+graphMarkup(m,{interactive:true})+'</svg>');for(const e of m.edges){const a=m.nodes.find(n=>n.id===e.source),b=m.nodes.find(n=>n.id===e.target),entity=a.type==='entity'?a:b.type==='entity'?b:null;if(!entity)continue;const text=document.querySelector(`[data-edge="${e.id}"] text`);if(!text)continue;const s=size(entity);assert.ok(Math.abs(Number(text.getAttribute('x'))-entity.x)>=s.w/2+14||Math.abs(Number(text.getAttribute('y'))-entity.y)>=s.h/2+14);}
});
