export function setupPWA({win=window,nav=navigator,doc=document,onMessage=()=>{},canReload=()=>true}={}){
 let prompt=null,registration=null,confirmed=false;
 const storage=win.localStorage;try{confirmed=storage?.getItem('bosha-app-installed')==='1';}catch{}
 const media=win.matchMedia?.('(display-mode: standalone)');
 const markInstalled=()=>{confirmed=true;try{storage?.setItem('bosha-app-installed','1');}catch{}};const button=doc.getElementById('installAppBtn'),status=doc.getElementById('installStatus'),update=doc.getElementById('updateAppBtn');
 const installed=()=>!!(confirmed||media?.matches||nav.standalone);
 const refresh=()=>{button.hidden=installed();status.textContent=installed()?'Bosha Studio is running as an installed app.':prompt?'Ready to install. Add Bosha Studio to your device.':'Install Bosha Studio using your browser’s app menu.';};
 win.addEventListener('beforeinstallprompt',event=>{event.preventDefault();confirmed=false;try{storage?.removeItem('bosha-app-installed');}catch{}prompt=event;refresh();});
 win.addEventListener('appinstalled',()=>{markInstalled();prompt=null;refresh();onMessage('Bosha Studio is installed.');});
 button.onclick=async()=>{if(prompt){const current=prompt;prompt=null;try{await current.prompt();const choice=await current.userChoice;if(choice?.outcome==='accepted')markInstalled();}catch{onMessage('Use your browser’s menu to install Bosha Studio.');}refresh();}else doc.getElementById('installDialog').showModal();};
 update.onclick=()=>{if(!canReload()){onMessage('Save or sync your changes before updating the app.',true);return;}registration?.waiting?.postMessage({type:'ACTIVATE_UPDATE'});};
 const offline=doc.getElementById('offlineReady');
 if(nav.serviceWorker){nav.serviceWorker.register('/sw.js',{scope:'/',type:'module',updateViaCache:'none'}).then(reg=>{registration=reg;const waiting=()=>{update.hidden=!reg.waiting;};waiting();reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',waiting));return nav.serviceWorker.ready;}).then(()=>{offline.textContent='Offline tools are ready on this device. Open the app once online to keep them up to date.';}).catch(()=>{offline.textContent='Offline tools could not be prepared. Reopen the app online to try again.';});let controlled=!!nav.serviceWorker.controller;nav.serviceWorker.addEventListener('controllerchange',()=>{if(controlled&&canReload())win.location.reload();else if(controlled)onMessage('An app update is ready. Sync your changes, then reopen Bosha Studio.');controlled=true;});}else offline.textContent='This browser does not support offline app installation. Your diagrams can still be backed up as JSON.';
 media?.addEventListener?.('change',()=>{if(media.matches)markInstalled();refresh();});
 if(media?.matches||nav.standalone)markInstalled();
 if(nav.getInstalledRelatedApps)nav.getInstalledRelatedApps().then(apps=>{if(apps.some(app=>app.platform==='webapp'&&(app.url===new URL('/manifest.webmanifest',win.location.href).href||app.id===new URL('/bosha-studio',win.location.href).href))){markInstalled();refresh();}}).catch(()=>{});
 refresh();return {isInstalled:installed};
}
