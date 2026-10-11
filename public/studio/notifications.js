// A modal lives in the browser top layer. Promote notices into that same layer,
// and keep them inside the active dialog so their controls remain accessible.
export function setupToasts({document:doc=globalThis.document,schedule=setTimeout,cancel=clearTimeout}={}){
 const layer=doc.getElementById('toast'),text=doc.getElementById('toastText'),undo=doc.getElementById('toastUndo'),close=doc.getElementById('toastClose'),mark=doc.getElementById('toastMark');
 let timer=null,visible=false,promoted=false;
 const popovers=typeof layer.showPopover==='function'&&typeof layer.hidePopover==='function';
 function lower(){if(promoted){try{layer.hidePopover();}catch{}promoted=false;}}
 function place(){
  if(!visible)return;
  const dialogs=[...doc.querySelectorAll('dialog[open]')],focused=doc.activeElement?.closest?.('dialog[open]');
  const parent=focused||dialogs.at(-1)||doc.body;
  lower();if(layer.parentElement!==parent)parent.append(layer);
  layer.classList.toggle('toast-in-dialog',parent.tagName==='DIALOG');
  if(popovers){layer.setAttribute('popover','manual');try{layer.showPopover();promoted=true;layer.classList.remove('toast-in-dialog');}catch{layer.removeAttribute('popover');}}
  else layer.removeAttribute('popover');
 }
 function hide(){cancel(timer);timer=null;visible=false;lower();layer.hidden=true;undo.onclick=null;}
 close.onclick=hide;
 function show(message,error=false,action=null){
  cancel(timer);lower();text.textContent=String(message);mark.textContent=error?'!':'✓';
  layer.classList.toggle('error',error);layer.setAttribute('role',error?'alert':'status');layer.setAttribute('aria-live',error?'assertive':'polite');
  undo.hidden=!action;undo.onclick=()=>{hide();action?.();};visible=true;layer.hidden=false;place();
  timer=schedule(hide,action?9000:4500);
 }
 const Observer=doc.defaultView?.MutationObserver||globalThis.MutationObserver;
 const observer=Observer?new Observer(place):null;
 for(const dialog of doc.querySelectorAll('dialog'))observer?.observe(dialog,{attributes:true,attributeFilter:['open']});
 doc.addEventListener('close',place,true);
 return {show,hide,destroy(){hide();observer?.disconnect();doc.removeEventListener('close',place,true);}};
}
