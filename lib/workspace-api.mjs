import {nativeIdentity,resolveIdentity} from './auth-identity.mjs';
import {diagramAccess} from './diagram-access.mjs';
import {mergeDiagram} from '../public/studio/merge.js';
import {validateModel} from '../public/studio/core.js';
const response=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const validId=s=>/^[a-zA-Z0-9_-]{1,80}$/.test(s||'');
const project=r=>({id:r.id,model:JSON.parse(r.model),revision:r.revision,createdAt:r.created_at,updatedAt:r.updated_at,role:r.role||'owner',ownerId:r.owner_id});
export const identity=nativeIdentity;
export async function workspaceAPI(request,DB){
 const user=await resolveIdentity(request,DB),path=new URL(request.url).pathname.replace(/^\/api\/workspace\/?/,'').split('/').filter(Boolean),method=request.method;
 if(!user)return path.length===0&&method==='GET'?response({user:null,projects:[]}):response({error:'Sign in to access your diagrams.'},401);
 if(!DB)return response({error:'Cloud storage is temporarily unavailable.'},503);
 if(method!=='GET'){if(request.headers.has('X-Bosha-Account-ID')&&request.headers.get('X-Bosha-Account-ID')!==user.id)return response({error:'Your signed-in account changed. Reload or sign in again to keep these changes in the correct account.'},409);const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return response({error:'This request must come from this site.'},403);if(method!=='DELETE'&&!request.headers.get('content-type')?.startsWith('application/json'))return response({error:'Expected a JSON request.'},415);}
 try{
  const now=Date.now();
  await DB.prepare('INSERT INTO accounts (id,email,name,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name').bind(user.id,user.email,user.name,now).run();
  if(!path.length&&method==='GET'){const rows=await DB.prepare("SELECT d.*, CASE WHEN d.owner_id=? THEN 'owner' ELSE m.role END AS role FROM diagrams d LEFT JOIN diagram_members m ON m.diagram_id=d.id AND m.account_id=? WHERE (d.owner_id=? OR m.account_id=?) AND d.deleted=0 ORDER BY d.updated_at DESC").bind(user.id,user.id,user.id,user.id).all();return response({user,projects:rows.results.map(project)});}
  const id=path[0];if(!validId(id))return response({error:'Invalid diagram ID.'},400);
  let row=await diagramAccess(DB,id,user.id);
  if(path.length===1&&method==='GET'){if(!row||row.deleted)return response({error:'Diagram not found.'},404);if(request.headers.get('if-none-match')===String(row.revision))return new Response(null,{status:304,headers:{'Cache-Control':'no-store'}});return response(project(row));}
  if(row?.role==='viewer'&&method!=='GET')return response({error:'This diagram is read-only. Ask its owner for editor access.'},403);
  if(path.length===2&&path[1]==='versions'&&method==='GET'){if(!row||row.deleted)return response({error:'Diagram not found.'},404);const rows=await DB.prepare('SELECT revision,model,created_at FROM diagram_versions WHERE diagram_id=? ORDER BY revision DESC LIMIT 50').bind(id).all();return response({versions:rows.results.map(v=>({revision:v.revision,model:JSON.parse(v.model),createdAt:v.created_at}))});}
  if(path.length!==1)return response({error:'Not found.'},404);
  if(method==='DELETE'){if(row&&row.role!=='owner')return response({error:'Only the owner can delete this diagram.'},403);if(!row||row.deleted)return response({error:'Diagram not found.'},404);const rev=Number(request.headers.get('if-match'));if(!Number.isSafeInteger(rev)||rev!==row.revision)return response({error:'This diagram changed on another device. Refresh before deleting.'},409);const result=await DB.prepare('UPDATE diagrams SET deleted=1,revision=revision+1,updated_at=? WHERE id=? AND owner_id=? AND revision=? AND deleted=0').bind(now,id,user.id,rev).run();if(!result.meta.changes)return response({error:'This diagram changed. Refresh and try again.'},409);return response({revision:rev+1});}
  if(method!=='PUT')return response({error:'Method not allowed.'},405);
  if(Number(request.headers.get('content-length')||0)>3_000_000)return response({error:'Diagram is too large.'},413);
  let bodyText='';const reader=request.body?.getReader(),decoder=new TextDecoder();let bytes=0;if(reader){while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>3_000_000){await reader.cancel();return response({error:'Diagram is too large.'},413);}bodyText+=decoder.decode(chunk.value,{stream:true});}bodyText+=decoder.decode();}
  let body,model;try{body=JSON.parse(bodyText);model=validateModel(body.model);}catch(error){return response({error:error.message||'Invalid diagram.'},400);}
  const revision=body.revision;if(!Number.isSafeInteger(revision)||revision<0)return response({error:'A valid revision is required.'},400);
  let encoded=JSON.stringify(model);
  if(!row){if(revision!==0)return response({error:'Diagram not found.'},404);const count=await DB.prepare('SELECT (SELECT count(*) FROM diagrams WHERE owner_id=? AND deleted=0)+(SELECT count(*) FROM diagram_members m JOIN diagrams d ON d.id=m.diagram_id WHERE m.account_id=? AND d.deleted=0) AS count').bind(user.id,user.id).first();if(count.count>=60)return response({error:'Your account can hold up to 60 diagrams.'},409);const results=await DB.batch([DB.prepare('INSERT OR IGNORE INTO diagrams (id,owner_id,model,revision,created_at,updated_at,deleted) SELECT ?,?,?,1,?,?,0 WHERE (SELECT count(*) FROM diagrams WHERE owner_id=? AND deleted=0)<60').bind(id,user.id,encoded,now,now,user.id),DB.prepare('INSERT OR IGNORE INTO diagram_versions (diagram_id,revision,model,created_at) SELECT id,revision,model,updated_at FROM diagrams WHERE id=? AND owner_id=? AND revision=1').bind(id,user.id)]);if(!results[0].meta.changes)return response({error:'Diagram ID is unavailable.'},409);return response({revision:1,updatedAt:now});}
  if(row.deleted&&row.role!=='owner')return response({error:'Diagram was deleted.'},404);
  let base=null;if(body.baseModel&&!row.deleted){try{base=validateModel(body.baseModel);}catch{return response({error:'Invalid merge baseline.'},400);}}
  // Authenticate the baseline against immutable history: stale clients cannot
  // manufacture a baseline to silently replace other participants' edits.
  if(base){const saved=await DB.prepare('SELECT model FROM diagram_versions WHERE diagram_id=? AND revision=?').bind(id,revision).first();if(!saved||JSON.stringify(validateModel(JSON.parse(saved.model)))!==JSON.stringify(base))return response({error:'Your saved baseline is unavailable. Save a copy before refreshing.',conflict:true},409);}
  for(let attempt=0;attempt<4;attempt++){
   if(row.revision!==revision&&!base)return response({error:'A newer version exists. Your changes are kept locally; save a copy.',conflict:true},409);
   if(base){const merged=mergeDiagram(base,model,JSON.parse(row.model));if(merged.conflicts.length)return response({error:'Another participant changed the same field. Your edits are kept locally; save a copy before refreshing.',conflict:true},409);encoded=JSON.stringify(validateModel(merged.model));}
   const next=row.revision+1;
   const results=await DB.batch([DB.prepare("UPDATE diagrams SET model=?,revision=revision+1,updated_at=?,deleted=0 WHERE id=? AND revision=? AND (deleted=0 OR owner_id=?) AND (owner_id=? OR EXISTS (SELECT 1 FROM diagram_members m WHERE m.diagram_id=diagrams.id AND m.account_id=? AND m.role='editor'))").bind(encoded,now,id,row.revision,user.id,user.id,user.id),DB.prepare('INSERT OR IGNORE INTO diagram_versions (diagram_id,revision,model,created_at) SELECT id,revision,model,updated_at FROM diagrams WHERE id=? AND revision=?').bind(id,next),DB.prepare('DELETE FROM diagram_versions WHERE diagram_id=? AND revision NOT IN (SELECT revision FROM diagram_versions WHERE diagram_id=? ORDER BY revision DESC LIMIT 50)').bind(id,id)]);
   if(results[0].meta.changes)return response({revision:next,updatedAt:now,model:JSON.parse(encoded),role:row.role});
   row=await diagramAccess(DB,id,user.id);if(!row||row.deleted||row.role==='viewer')return response({error:'Your editing access was removed. Export your local changes to keep them.'},403);
  }
  return response({error:'This diagram is busy. Your changes are kept locally; retry sync.',conflict:true},409);
 }catch(error){console.error('Workspace operation failed',error instanceof Error?error.message:'unknown');return response({error:'Cloud storage could not complete this request. Your local changes are preserved.'},500);}
}
