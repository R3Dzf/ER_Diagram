import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {validateModel,exportSVG} from '../public/studio/core.js';
let session=0;
async function open({saved=new Map(),user=null,projects=[],storageFails=false,pending=false}={}){
 const {window}=parseHTML(fs.readFileSync(new URL('../public/studio/index.html',import.meta.url),'utf8')),doc=window.document;
 globalThis.window=window;globalThis.document=doc;globalThis.innerWidth=1440;globalThis.ResizeObserver=class{observe(){}};
 globalThis.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>{if(storageFails)throw Error('No storage');saved.set(k,v);},removeItem:k=>saved.delete(k)};
 globalThis.fetch=async()=>pending?new Promise(()=>{}):Response.json({user,projects});
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.getAttribute('value')||this.querySelector('option')?.getAttribute('value')||'';},set(v){for(const o of this.querySelectorAll('option'))o.toggleAttribute('selected',o.getAttribute('value')===String(v));}});
 for(const d of doc.querySelectorAll('dialog')){d.showModal=()=>d.setAttribute('open','');d.close=()=>d.removeAttribute('open');}
 await import('../public/studio/app.js?welcome-test='+ ++session);for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));
 return {doc,saved,$:id=>doc.getElementById(id),db:()=>JSON.parse(saved.get(user?'bosha-account-'+user.id:'bosha-er-studio-projects-v2'))};
}
test('first visit presents two working starts, remembers completion, and preserves existing diagrams',async()=>{
 let ui=await open();assert.equal(ui.$('accountLoading').hidden,true);assert.equal(ui.$('welcomeHome').hidden,false);assert.equal(ui.$('dashboardContent').hidden,true);assert.ok(ui.doc.body.classList.contains('welcome-mode'));assert.equal(ui.$('welcomeAccount').textContent,'Sign in');
 ui.$('welcomeAccount').click();assert.ok(ui.$('accountDialog').hasAttribute('open'));ui.$('accountDialog').close();
 ui.$('welcomeCreate').click();assert.equal(ui.$('editor').hidden,false);assert.equal(ui.$('welcomeHome').hidden,true);assert.equal(ui.db().projects.length,1);assert.equal(ui.db().projects[0].model.nodes.length,0);assert.equal(ui.$('emptyState').hidden,false);
 ui.$('workspaceNav').click();assert.equal(ui.$('welcomeHome').hidden,true);assert.equal(ui.$('dashboardContent').hidden,false);
 ui=await open({saved:ui.saved});assert.equal(ui.$('welcomeHome').hidden,true);ui.doc.querySelector('[data-delete]').click();assert.equal(ui.$('welcomeHome').hidden,true,'deleting the last diagram must not restart onboarding');
 ui.$('helpBtn').click();ui.$('showWelcomeBtn').click();assert.equal(ui.$('helpDialog').hasAttribute('open'),false);assert.equal(ui.$('welcomeHome').hidden,false);
 ui.$('welcomeExample').click();const model=ui.db().projects[0].model;assert.equal(model.title,'Customer orders');assert.equal(model.nodes.length,5);assert.equal(model.edges.length,4);assert.doesNotThrow(()=>validateModel(model));assert.match(exportSVG(model).svg,/Customer/);assert.match(ui.$('graph').textContent,/Places/);assert.equal(model.edges.filter(e=>e.labelSource||e.labelTarget).length,2);assert.equal(model.edges.filter(e=>e.totalTarget).length,1);
 // The example is a real editable saved project, not a decorative preview.
 ui.doc.querySelector('[data-outline="customer"]').click();ui.$('nodeName').value='Buyer';ui.$('nodeName').oninput();ui.$('nodeName').onblur();assert.equal(ui.db().projects[0].model.nodes.find(n=>n.id==='customer').name,'Buyer');
 ui.$('workspaceNav').click();const before=JSON.stringify(ui.db().projects);ui.$('helpBtn').click();ui.$('showWelcomeBtn').click();ui.$('welcomeWorkspace').click();assert.equal(ui.$('dashboardContent').hidden,false);assert.equal(JSON.stringify(ui.db().projects),before,'opening the introduction never replaces existing work');
 const ids=[...ui.doc.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
});
test('templates and skip are remembered, while account onboarding remains separate from guest onboarding',async()=>{
 let ui=await open();ui.$('welcomeTemplates').click();assert.equal(ui.$('welcomeHome').hidden,true);assert.equal(ui.$('templatesView').hidden,false);assert.equal(ui.doc.querySelectorAll('.template-card').length,6);ui.$('workspaceNav').click();assert.equal(ui.$('welcomeHome').hidden,true);
 ui=await open({saved:ui.saved});assert.equal(ui.$('welcomeHome').hidden,true);
 const user={id:'alice',name:'Alice',email:'alice@test'};ui=await open({saved:ui.saved,user});assert.equal(ui.$('welcomeHome').hidden,false);assert.equal(ui.$('welcomeAccount').textContent,'Account');assert.match(ui.$('welcomeSaving').textContent,/save automatically to your account/);ui.$('welcomeWorkspace').click();assert.equal(ui.saved.get('bosha-welcome-completed-alice'),'1');
 const project={id:'cloud1',revision:1,createdAt:1,updatedAt:1,model:{version:1,title:'Existing cloud model',nodes:[],edges:[]}};ui=await open({user,projects:[project]});assert.equal(ui.$('welcomeHome').hidden,true);assert.equal(ui.db().projects[0].model.title,project.model.title);
});
test('storage failure still permits dismissal, and drawing stays disabled while loading the account',async()=>{
 let ui=await open({storageFails:true});assert.equal(ui.$('welcomeHome').hidden,false);ui.$('welcomeWorkspace').click();assert.equal(ui.$('welcomeHome').hidden,true);
 ui=await open({pending:true});assert.equal(ui.$('accountLoading').hidden,false);assert.equal(ui.$('welcomeCreate').disabled,true);assert.equal(ui.$('welcomeExample').disabled,true);ui.$('welcomeExample').onclick();assert.equal(ui.saved.size,0);
});
