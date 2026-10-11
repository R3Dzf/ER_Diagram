export const THEME_KEY='bosha-theme';
export function resolvedTheme(choice,systemDark=false){return choice==='dark'||choice==='system'&&systemDark?'dark':'light';}
export function setupTheme({storage=localStorage,doc=document,win=window}={}){
 const media=win.matchMedia?.('(prefers-color-scheme: dark)');let choice='system';try{const saved=storage.getItem(THEME_KEY);if(['light','dark','system'].includes(saved))choice=saved;}catch{}
 function apply(){doc.documentElement.dataset.theme=resolvedTheme(choice,media?.matches);doc.querySelector('meta[name="theme-color"]')?.setAttribute('content',doc.documentElement.dataset.theme==='dark'?'#171f2a':'#f7f7fa');doc.querySelectorAll('[data-theme-choice]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.themeChoice===choice));button.classList.toggle('active',button.dataset.themeChoice===choice);});}
 const set=value=>{if(!['light','dark','system'].includes(value))return;choice=value;try{storage.setItem(THEME_KEY,value);}catch{}apply();};
 media?.addEventListener?.('change',apply);apply();return {set,get:()=>choice};
}
