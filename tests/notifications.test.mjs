import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {setupToasts} from '../public/studio/notifications.js';
function fixture(popover=true){
 const {document:doc}=parseHTML('<html><body><dialog id="share" open></dialog><dialog id="team"></dialog><div id="toast" hidden><span id="toastMark"></span><span id="toastText"></span><button id="toastUndo" hidden>Undo</button><button id="toastClose">Close</button></div></body></html>');
 const layer=doc.getElementById('toast'),calls=[],timers=new Map();let next=0;
 if(popover){layer.showPopover=()=>calls.push(['show',layer.parentElement.id]);layer.hidePopover=()=>calls.push(['hide',layer.parentElement.id]);}
 const notices=setupToasts({document:doc,schedule:(fn,ms)=>{timers.set(++next,{fn,ms});return next;},cancel:id=>timers.delete(id)});
 return {doc,layer,calls,timers,notices};
}
const mutations=()=>new Promise(r=>setImmediate(r));
test('copy feedback is promoted above its modal, follows modal changes and remains dismissible',async()=>{
 const {doc,layer,calls,notices}=fixture();notices.show('Link copied');assert.equal(layer.hidden,false);assert.equal(layer.parentElement.id,'share');assert.equal(layer.getAttribute('popover'),'manual');assert.deepEqual(calls.at(-1),['show','share']);
 doc.getElementById('team').setAttribute('open','');await mutations();assert.equal(layer.parentElement.id,'team');assert.deepEqual(calls.slice(-2),[['hide','share'],['show','team']]);
 doc.getElementById('team').removeAttribute('open');doc.getElementById('share').removeAttribute('open');await mutations();assert.equal(layer.parentElement,doc.body);assert.equal(layer.hidden,false);
 doc.getElementById('toastClose').click();assert.equal(layer.hidden,true);assert.equal(calls.at(-1)[0],'hide');notices.destroy();
});
test('fallback feedback stays inside the modal and Undo uses only the latest action and timer',async()=>{
 const {doc,layer,notices,timers}=fixture(false);let actions=0;notices.show('Removed a diagram',false,()=>actions++);assert.equal(layer.parentElement.id,'share');assert.ok(layer.classList.contains('toast-in-dialog'));assert.equal([...timers.values()][0].ms,9000);assert.equal(doc.getElementById('toastUndo').hidden,false);
 notices.show('<script>plain text</script>',true);assert.equal(timers.size,1);assert.equal([...timers.values()][0].ms,4500);assert.equal(doc.getElementById('toastText').textContent,'<script>plain text</script>');assert.equal(layer.querySelector('script'),null);assert.equal(layer.getAttribute('aria-live'),'assertive');assert.equal(doc.getElementById('toastUndo').hidden,true);
 notices.show('Removed another diagram',false,()=>actions+=2);doc.getElementById('toastUndo').click();assert.equal(actions,2);assert.equal(timers.size,0);assert.equal(layer.hidden,true);
 notices.show('Export complete');[...timers.values()][0].fn();assert.equal(layer.hidden,true);notices.destroy();await mutations();
});
test('a failed popover operation falls back to a visible in-dialog notice',()=>{
 const {layer,notices}=fixture();layer.showPopover=()=>{throw Error('Unavailable');};notices.show('Copied');assert.ok(layer.classList.contains('toast-in-dialog'));assert.equal(layer.hasAttribute('popover'),false);assert.equal(layer.hidden,false);notices.destroy();
});
