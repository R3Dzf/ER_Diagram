export const LAYOUT_OPTIONS_KEY='bosha-layout-options-v2';
const defaults=()=>({direction:'balanced',spacing:'comfortable'});
export function normalizeOptions(value){const out=defaults();if(['balanced','horizontal','vertical'].includes(value?.direction))out.direction=value.direction;if(['comfortable','compact'].includes(value?.spacing))out.spacing=value.spacing;return out;}
export function readLayoutOptions(storage){
 try{const current=JSON.parse(storage.getItem(LAYOUT_OPTIONS_KEY)||'null');if(current)return {chen:normalizeOptions(current.chen),crowfoot:normalizeOptions(current.crowfoot)};
  // A legacy global preference seeds Chen only, never both engines.
  return {chen:normalizeOptions(JSON.parse(storage.getItem('bosha-layout-options')||'null')),crowfoot:defaults()};
 }catch{return {chen:defaults(),crowfoot:defaults()};}
}
export function writeLayoutOptions(storage,options){try{storage.setItem(LAYOUT_OPTIONS_KEY,JSON.stringify(options));}catch{}}
