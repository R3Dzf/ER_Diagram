import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureLayouts,captureLayout,switchNotation} from '../public/studio/layout-state.js';
import {EditHistory} from '../public/studio/edit-history.js';
import {validateModel,exportSVG} from '../public/studio/core.js';
import {autoLayout,moveGroup,movementGroup} from '../public/studio/layout.js';
import {library} from '../public/studio/presets.js';
import {mergeDiagram} from '../public/studio/merge.js';
import {copyGroup,pasteGroup} from '../public/studio/design-tools.js';
const copy=structuredClone;
const positions=m=>m.nodes.map(n=>[n.id,n.x,n.y]);
const routes=m=>m.edges.map(e=>[e.id,e.routing,e.points]);
function edit(history,model,fn){history.begin(model);fn();captureLayout(model);history.finish(model);return model;}

test('both auto layouts, group movement and manual routes are independent and survive JSON reload',()=>{
 const m=ensureLayouts(library()),chenBefore=positions(m),chenRoutes=routes(m);switchNotation(m,'crowfoot');const crowBefore=positions(m);switchNotation(m,'chen');autoLayout(m);captureLayout(m);const chenAfter=positions(m),afterRoutes=routes(m);switchNotation(m,'crowfoot');assert.deepEqual(positions(m),crowBefore);autoLayout(m,{direction:'vertical'});captureLayout(m);const crowAfter=positions(m);assert.notDeepEqual(crowAfter,crowBefore);switchNotation(m,'chen');assert.deepEqual(positions(m),chenAfter);assert.deepEqual(routes(m),afterRoutes);
 const entity=m.nodes.find(n=>n.type==='entity'),before=copy(m);moveGroup(m,before,movementGroup(m,[entity.id]),105,-87);m.edges[0].points=[{x:800,y:-200}];captureLayout(m);const moved=positions(m),movedRoutes=routes(m);switchNotation(m,'crowfoot');assert.deepEqual(positions(m),crowAfter);assert.notDeepEqual(routes(m),movedRoutes);
 const imported=validateModel(JSON.parse(JSON.stringify(m)));switchNotation(imported,'chen');assert.deepEqual(positions(imported),moved);assert.deepEqual(routes(imported),movedRoutes);switchNotation(imported,'crowfoot');assert.deepEqual(positions(imported),crowAfter);assert.match(exportSVG(imported).svg,/Book/);assert.notDeepEqual(chenBefore,chenAfter);assert.notDeepEqual(chenRoutes,afterRoutes);
});
test('Undo and Redo select this view’s drawing edits while shared names and relationships affect both views',()=>{
 const h=new EditHistory();let m=ensureLayouts(library());const initial=positions(m);edit(h,m,()=>{m.nodes[0].x+=200;});const chenMoved=positions(m);switchNotation(m,'crowfoot');assert.equal(h.canUndo(m),false);edit(h,m,()=>{m.nodes[0].y+=300;});const crowMoved=positions(m);switchNotation(m,'chen');m=h.undo(m);assert.deepEqual(positions(m),initial);switchNotation(m,'crowfoot');assert.deepEqual(positions(m),crowMoved);assert.equal(h.canRedo(m),false);m=h.undo(m);assert.deepEqual(positions(m),initial);switchNotation(m,'chen');m=h.redo(m);assert.deepEqual(positions(m),chenMoved);switchNotation(m,'crowfoot');m=h.redo(m);assert.deepEqual(positions(m),crowMoved);
 const oldName=m.nodes[0].name;edit(h,m,()=>{m.nodes[0].name='Shared name';});switchNotation(m,'chen');m=h.undo(m);assert.equal(m.nodes[0].name,oldName);assert.deepEqual(positions(m),chenMoved);switchNotation(m,'crowfoot');assert.deepEqual(positions(m),crowMoved);m=h.redo(m);assert.equal(m.nodes[0].name,'Shared name');
 const count=m.nodes.length;edit(h,m,()=>{m.nodes.push({id:'newR',name:'New relationship',type:'relationship',x:200,y:300});m.edges.push({id:'newE',source:m.nodes[0].id,target:'newR'});});switchNotation(m,'chen');m=h.undo(m);assert.equal(m.nodes.length,count);assert.ok(!m.edges.some(e=>e.id==='newE'));assert.deepEqual(positions(m),chenMoved);switchNotation(m,'crowfoot');m=h.redo(m);assert.ok(m.nodes.some(n=>n.id==='newR'));assert.ok(m.edges.some(e=>e.id==='newE'));
});
test('deleting and restoring shared objects retains each saved position and route without rolling back other nodes',()=>{
 const h=new EditHistory();let m=ensureLayouts(library());const id=m.nodes[0].id;switchNotation(m,'crowfoot');edit(h,m,()=>m.nodes[0].x+=420);const crow=copy(m.nodes[0].crowfootPosition);switchNotation(m,'chen');const chen=copy(m.nodes[0].chenPosition);edit(h,m,()=>{m.nodes=m.nodes.filter(n=>n.id!==id);m.edges=m.edges.filter(e=>e.source!==id&&e.target!==id);});switchNotation(m,'crowfoot');m=h.undo(m);assert.deepEqual(m.nodes.find(n=>n.id===id).crowfootPosition,crow);assert.deepEqual(m.nodes.find(n=>n.id===id).chenPosition,chen);m=h.redo(m);assert.ok(!m.nodes.some(n=>n.id===id));switchNotation(m,'chen');m=h.undo(m);assert.deepEqual(m.nodes.find(n=>n.id===id).chenPosition,chen);
});
test('migration seeds both views once; same-object edits in opposite notations merge without layout conflicts',()=>{
 const legacy=library(),base=copy(legacy),local=ensureLayouts(copy(legacy)),remote=ensureLayouts(copy(legacy));local.nodes[0].x+=120;local.edges[0].points=[{x:90,y:120}];captureLayout(local);switchNotation(remote,'crowfoot');remote.nodes[0].y+=240;remote.edges[0].points=[{x:720,y:450}];remote.nodes[0].name='Remote name';captureLayout(remote);
 const merged=mergeDiagram(base,local,remote);assert.deepEqual(merged.conflicts,[]);assert.equal(merged.model.notation,'chen');assert.equal(merged.model.nodes[0].x,local.nodes[0].x);assert.equal(merged.model.nodes[0].name,'Remote name');assert.deepEqual(merged.model.edges[0].points,local.edges[0].points);switchNotation(merged.model,'crowfoot');assert.equal(merged.model.nodes[0].y,remote.nodes[0].y);assert.deepEqual(merged.model.edges[0].points,remote.edges[0].points);
 const sameBase=captureLayout(copy(local)),a=copy(sameBase),b=copy(sameBase);a.nodes[0].x+=10;b.nodes[0].x+=20;captureLayout(a);captureLayout(b);assert.ok(mergeDiagram(sameBase,a,b).conflicts.includes('nodes.'+a.nodes[0].id+'.chenPosition'));
});
test('independent layout schema rejects unsafe hidden coordinates and routes; copies offset both views',()=>{
 const m=ensureLayouts(library());switchNotation(m,'crowfoot');m.nodes[0].x+=700;captureLayout(m);switchNotation(m,'chen');const bad=copy(m);bad.nodes[0].crowfootPosition.x=Infinity;assert.throws(()=>validateModel(bad),/saved layout/);const badRoute=copy(m);badRoute.edges[0].crowfootRoute.points=[{x:100001,y:0}];assert.throws(()=>validateModel(badRoute),/saved layout/);const badCount=copy(m);badCount.edges[0].chenRoute.points=Array.from({length:51},()=>({x:1,y:1}));assert.throws(()=>validateModel(badCount),/saved connection/);
 let i=0;const original=copy(m.nodes[0]);pasteGroup(m,copyGroup(m,[original.id]),prefix=>prefix+'copy'+i++);captureLayout(m);const duplicate=m.nodes.at(-1);for(const view of ['chen','crowfoot'])assert.deepEqual(duplicate[view+'Position'],{x:original[view+'Position'].x+48,y:original[view+'Position'].y+48});
});
