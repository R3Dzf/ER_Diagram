import {validateModel} from './core.js';
export const LAST_ACCOUNT='bosha-last-account';
export function cachedAccountWorkspace(storage){
 try{
  const user=JSON.parse(storage.getItem(LAST_ACCOUNT)||'null');
  if(!user||typeof user.id!=='string'||!user.id.length||user.id.length>300||typeof user.name!=='string'||typeof user.email!=='string')return null;
  const raw=JSON.parse(storage.getItem('bosha-account-'+user.id)||'null');if(!raw||raw.version!==2||!Array.isArray(raw.projects)||raw.projects.length>60)return null;
  const ids=new Set();const project=p=>{if(!p||typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(p.id)||!Number.isFinite(p.createdAt)||!Number.isFinite(p.updatedAt)||!Number.isSafeInteger(p.revision||0)||(p.revision||0)<0)throw Error('Invalid offline project.');return {...p,model:validateModel(p.model)};};
  const projects=raw.projects.map(p=>{const n=project(p);if(ids.has(n.id))throw Error('Duplicate offline diagram.');ids.add(n.id);return n;}),deletions=Array.isArray(raw.deletions)?raw.deletions.slice(0,60).map(project):[];
  return {user:{id:user.id,name:user.name.slice(0,160),email:user.email.slice(0,320),provider:user.provider==='google'?'google':'chatgpt'},db:{version:2,projects,activeId:ids.has(raw.activeId)?raw.activeId:null,deletions}};
 }catch{return null;}
}
