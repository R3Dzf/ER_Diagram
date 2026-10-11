import {validateModel} from './core.js';
export const WORKSPACE_KEY='bosha-er-studio-projects-v2', LEGACY_KEY='bosha-er-studio-v1';
export const blankDiagram=()=>({version:1,title:'Untitled diagram',nodes:[],edges:[]});
export function makeProject(model,id,now=Date.now()){return {id,model:validateModel(model),createdAt:now,updatedAt:now};}
export function validateWorkspace(raw){
 if(!raw||raw.version!==2||!Array.isArray(raw.projects)||raw.projects.length>60)throw Error('Invalid workspace.');
 const validTime=t=>Number.isFinite(t)&&t>=0&&t<=8.64e15;
 const ids=new Set(),projects=raw.projects.map(p=>{if(!p||typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(p.id)||ids.has(p.id)||!validTime(p.createdAt)||!validTime(p.updatedAt))throw Error('Invalid project metadata.');ids.add(p.id);return makeProject(p.model,p.id,p.createdAt);});
 projects.forEach((p,i)=>p.updatedAt=raw.projects[i].updatedAt);
 return {version:2,projects,activeId:ids.has(raw.activeId)?raw.activeId:null};
}
export function loadWorkspace(storage,newId,now=Date.now()){
 const empty={version:2,projects:[],activeId:null};
 try{const current=storage.getItem(WORKSPACE_KEY);if(current)return {db:validateWorkspace(JSON.parse(current)),readError:false,migrated:false};const old=storage.getItem(LEGACY_KEY);if(old){const p=makeProject(JSON.parse(old),newId(),now);return {db:{version:2,projects:[p],activeId:p.id},readError:false,migrated:true};}return {db:empty,readError:false,migrated:false};}
 catch{return {db:empty,readError:true,migrated:false};}
}
