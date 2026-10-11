import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {library} from '../public/studio/presets.js';
test('Chen Auto layout renders and saves the hub, places the relationship attribute beside the diamond, and supports Undo/Redo',async()=>{
 const {window}=parseHTML(fs.readFileSync(new URL('../public/studio/index.html',import.meta.url),'utf8')),doc=window.document,saved=new Map(),initial=library();
 saved.set('bosha-er-studio-projects-v2',JSON.stringify({version:2,activeId:'p1',projects:[{id:'p1',model:initial,createdAt:1,updatedAt:1}]}));
 globalThis.window=window;globalThis.document=doc;globalThis.innerWidth=1440;globalThis.ResizeObserver=class{observe(){}};
 globalThis.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};globalThis.fetch=async()=>Response.json({user:null,projects:[]});
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')||this.querySelector('option')?.getAttribute('value')||'';},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.getAttribute('value')===String(v));}});
 for(const d of doc.querySelectorAll('dialog')){d.showModal=()=>d.setAttribute('open','');d.close=()=>d.removeAttribute('open');}
 await import('../public/studio/app.js');for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));doc.querySelector('[data-open="p1"]').click();
 const $=id=>doc.getElementById(id),current=()=>JSON.parse(saved.get('bosha-er-studio-projects-v2')).projects[0].model,positions=m=>m.nodes.map(n=>[n.id,n.x,n.y]);
 const before=current();$('layoutBtn').click();const after=current();assert.notDeepEqual(positions(after),positions(before));
 const book=after.nodes.find(n=>n.name==='Book'),stocks=after.nodes.find(n=>n.name==='Stocks'),copies=after.nodes.find(n=>n.name==='number_of_copies');
 assert.equal(stocks.x,book.x);assert.equal(copies.y,stocks.y);assert.notEqual(copies.x,stocks.x);
 for(const n of after.nodes)assert.equal(doc.querySelector(`#graph [data-node="${n.id}"]`).getAttribute('transform'),`translate(${n.x},${n.y})`);
 for(let i=0;i<before.edges.length;i++)for(const field of ['labelSource','labelTarget','totalSource','totalTarget','source','target'])assert.equal(after.edges[i][field],before.edges[i][field]);
 // A second identical arrangement does not consume another Undo step.
 $('layoutBtn').click();$('undoBtn').click();assert.deepEqual(positions(current()),positions(before));$('redoBtn').click();assert.deepEqual(positions(current()),positions(after));
 $('layoutSettingsBtn').click();assert.equal($('layoutDialog').hasAttribute('open'),true);$('layoutDirection').value='vertical';$('layoutSpacing').value='compact';$('applyLayoutBtn').click();assert.equal($('layoutDialog').hasAttribute('open'),false);assert.match($('layoutResult').textContent,/spacing verified/);assert.notDeepEqual(positions(current()),positions(after));assert.deepEqual(JSON.parse(saved.get('bosha-layout-options-v2')).chen,{direction:'vertical',spacing:'compact'});$('undoBtn').click();assert.deepEqual(positions(current()),positions(after));
 // Switching presentation is not an Undo step; each view keeps its geometry.
 const switchTo=notation=>{$('notationSelect').value=notation;$('notationSelect').onchange({target:$('notationSelect')});};
 switchTo('crowfoot');assert.equal($('undoBtn').disabled,true);assert.deepEqual(positions(current()),positions(before));
 $('layoutBtn').click();const crowAfter=current();assert.notDeepEqual(positions(crowAfter),positions(before));$('layoutSettingsBtn').click();assert.equal($('layoutDirection').value,'balanced');assert.equal($('layoutSpacing').value,'comfortable');assert.match($('layoutDialog').querySelector('h2').textContent,/Crow/);$('layoutDirection').value='horizontal';$('applyLayoutBtn').click();assert.deepEqual(JSON.parse(saved.get('bosha-layout-options-v2')),{chen:{direction:'vertical',spacing:'compact'},crowfoot:{direction:'horizontal',spacing:'comfortable'}});
 switchTo('chen');assert.deepEqual(positions(current()),positions(after));$('layoutSettingsBtn').click();assert.equal($('layoutDirection').value,'vertical');assert.equal($('layoutSpacing').value,'compact');$('layoutDialog').close();switchTo('crowfoot');$('undoBtn').click();assert.deepEqual(positions(current()),positions(before));$('redoBtn').click();assert.deepEqual(positions(current()),positions(crowAfter));
 // Live name edits are shared, but their Undo does not roll back either layout.
 const bookId=after.nodes.find(n=>n.name==='Book').id;doc.querySelector(`[data-outline="${bookId}"]`).click();$('nodeName').value='Books renamed';$('nodeName').oninput();$('nodeName').onblur();
 switchTo('chen');assert.equal(current().nodes.find(n=>n.id===bookId).name,'Books renamed');$('undoBtn').click();assert.equal(current().nodes.find(n=>n.id===bookId).name,'Book');assert.deepEqual(positions(current()),positions(after));
 switchTo('crowfoot');assert.deepEqual(positions(current()),positions(crowAfter));$('redoBtn').click();assert.equal(current().nodes.find(n=>n.id===bookId).name,'Books renamed');
 // Creating a relationship is data: Undo/Redo is available from the other view.
 window.HTMLInputElement.prototype.select=()=>{};doc.querySelector('[data-add="relationship"]').click();const added=current().nodes.at(-1).id;switchTo('chen');assert.ok(current().nodes.some(n=>n.id===added));$('undoBtn').click();assert.ok(!current().nodes.some(n=>n.id===added));assert.deepEqual(positions(current()),positions(after));switchTo('crowfoot');$('redoBtn').click();assert.ok(current().nodes.some(n=>n.id===added));
});
