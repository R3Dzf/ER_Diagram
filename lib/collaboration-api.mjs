import {resolveIdentity,hash,token} from './auth-identity.mjs';
import {diagramAccess} from './diagram-access.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const valid=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(s);
async function body(request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw Error('Expected JSON.');const reader=request.body?.getReader();let size=0,text='';const decoder=new TextDecoder();if(reader)while(true){const c=await reader.read();if(c.done)break;size+=c.value.byteLength;if(size>4096){await reader.cancel();throw Error('Request too large.');}text+=decoder.decode(c.value,{stream:true});}return JSON.parse(text+decoder.decode());}
export async function collaborationAPI(request,DB){
 const url=new URL(request.url),[id,action,target]=url.pathname.replace(/^\/api\/collaboration\/?/,'').split('/'),method=request.method;
 if(!DB)return json({error:'Collaboration is temporarily unavailable.'},503);
 const user=await resolveIdentity(request,DB);if(!user)return json({error:'Sign in to collaborate on a diagram.'},401);
 if(method!=='GET'&&(request.headers.get('origin')!==url.origin||request.headers.get('X-Bosha-Account-ID')!==user.id))return json({error:'Reconnect your account before collaborating.'},403);
 try{
  const now=Date.now();await DB.prepare('INSERT INTO accounts (id,email,name,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name').bind(user.id,user.email,user.name,now).run();
  if(id==='join'){
   if(method!=='POST')return json({error:'Method not allowed.'},405);const data=await body(request);if(!/^[A-Za-z0-9_-]{43}$/.test(data.token||''))return json({error:'Invitation is unavailable or expired.'},404);
   const invite=await DB.prepare('SELECT i.*,d.owner_id FROM diagram_invites i JOIN diagrams d ON d.id=i.diagram_id WHERE i.token_hash=? AND i.expires_at>? AND d.deleted=0').bind(await hash(data.token),now).first();if(!invite)return json({error:'Invitation is unavailable or expired.'},404);if(invite.owner_id===user.id)return json({error:'You already own this diagram.'},400);
   const count=await DB.prepare('SELECT (SELECT count(*) FROM diagrams WHERE owner_id=? AND deleted=0)+(SELECT count(*) FROM diagram_members m JOIN diagrams d ON d.id=m.diagram_id WHERE m.account_id=? AND d.deleted=0) AS count').bind(user.id,user.id).first();if(count.count>=60)return json({error:'Make room in your workspace before joining.'},409);
   // Consume a single-use invitation and insert membership atomically. A race
   // cannot join a second account after the token has been consumed or revoked.
   const results=await DB.batch([DB.prepare('INSERT OR IGNORE INTO diagram_members (diagram_id,account_id,role,created_at) SELECT diagram_id,?,role,? FROM diagram_invites WHERE id=? AND token_hash=? AND expires_at>? AND EXISTS (SELECT 1 FROM diagrams d WHERE d.id=diagram_invites.diagram_id AND d.deleted=0) AND (SELECT count(*) FROM diagram_members WHERE diagram_id=?)<20').bind(user.id,now,invite.id,await hash(data.token),now,invite.diagram_id),DB.prepare('DELETE FROM diagram_invites WHERE id=? AND EXISTS (SELECT 1 FROM diagram_members WHERE diagram_id=? AND account_id=?)').bind(invite.id,invite.diagram_id,user.id)]);
   if(!results[1].meta.changes)return json({error:'Invitation is unavailable or the team is full.'},409);return json({diagramId:invite.diagram_id});
  }
  if(!valid(id))return json({error:'Invalid diagram.'},400);const row=await diagramAccess(DB,id,user.id);if(!row||row.deleted)return json({error:'Diagram access is unavailable.'},404);
  if(!action&&method==='GET'){
   const members=await DB.prepare('SELECT a.id,a.name,m.role FROM accounts a JOIN diagram_members m ON m.account_id=a.id WHERE m.diagram_id=? UNION ALL SELECT a.id,a.name,\'owner\' AS role FROM accounts a WHERE a.id=?').bind(id,row.owner_id).all();
   const presence=await DB.prepare('SELECT p.account_id AS id,a.name,p.x,p.y,p.selected_id AS selectedId FROM diagram_presence p JOIN accounts a ON a.id=p.account_id WHERE p.diagram_id=? AND p.updated_at>? AND (p.account_id=? OR EXISTS (SELECT 1 FROM diagram_members m WHERE m.diagram_id=p.diagram_id AND m.account_id=p.account_id))').bind(id,now-15000,row.owner_id).all();
   const comments=await DB.prepare('SELECT c.id,c.account_id AS accountId,a.name,c.element_id AS elementId,c.body,c.created_at AS createdAt FROM diagram_comments c JOIN accounts a ON a.id=c.account_id WHERE c.diagram_id=? ORDER BY c.created_at DESC LIMIT 100').bind(id).all();
   const invites=row.role==='owner'?(await DB.prepare('SELECT id,role,expires_at AS expiresAt FROM diagram_invites WHERE diagram_id=? AND expires_at>?').bind(id,now).all()).results:[];return json({role:row.role,members:members.results,presence:presence.results,comments:comments.results,invites});
  }
  if(action==='presence'&&method==='POST'){const data=await body(request);const coord=v=>Number.isFinite(v)&&Math.abs(v)<=100000?Math.round(v):null;await DB.prepare('INSERT INTO diagram_presence (diagram_id,account_id,x,y,selected_id,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(diagram_id,account_id) DO UPDATE SET x=excluded.x,y=excluded.y,selected_id=excluded.selected_id,updated_at=excluded.updated_at').bind(id,user.id,coord(data.x),coord(data.y),valid(data.selectedId)?data.selectedId:null,now).run();return json({ok:true});}
  if(action==='comments'){
   if(method==='POST'){const data=await body(request);if(typeof data.body!=='string'||!data.body.trim()||data.body.length>1000)return json({error:'Write a comment of up to 1,000 characters.'},400);const elementId=valid(data.elementId)?data.elementId:null;if(elementId&&!([...JSON.parse(row.model).nodes,...JSON.parse(row.model).edges].some(n=>n.id===elementId)))return json({error:'This element no longer exists.'},400);const count=await DB.prepare('SELECT count(*) count FROM diagram_comments WHERE diagram_id=?').bind(id).first();if(count.count>=100)return json({error:'This diagram has 100 comments. Remove an older comment first.'},409);await DB.prepare('INSERT INTO diagram_comments (id,diagram_id,account_id,element_id,body,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),id,user.id,elementId,data.body.trim(),now).run();return json({ok:true});}
   if(method==='DELETE'&&valid(target)){await DB.prepare('DELETE FROM diagram_comments WHERE id=? AND diagram_id=? AND (account_id=? OR ?=\'owner\')').bind(target,id,user.id,row.role).run();return json({ok:true});}
  }
  if(row.role!=='owner')return json({error:'Only the owner can manage access.'},403);
  if(action==='invites'){
   if(method==='DELETE'&&valid(target)){await DB.prepare('DELETE FROM diagram_invites WHERE id=? AND diagram_id=?').bind(target,id).run();return json({ok:true});}
   if(method==='POST'){const data=await body(request);if(!['editor','viewer'].includes(data.role))return json({error:'Choose editor or viewer.'},400);await DB.prepare('DELETE FROM diagram_invites WHERE diagram_id=? AND expires_at<=?').bind(id,now).run();const count=await DB.prepare('SELECT count(*) count FROM diagram_invites WHERE diagram_id=?').bind(id).first();if(count.count>=20)return json({error:'Revoke an invitation before creating another.'},409);const raw=token(),inviteId=crypto.randomUUID();await DB.prepare('INSERT INTO diagram_invites (id,diagram_id,token_hash,role,created_at,expires_at) VALUES (?,?,?,?,?,?)').bind(inviteId,id,await hash(raw),data.role,now,now+7*86400000).run();return json({id:inviteId,token:raw,role:data.role});}
  }
  if(action==='members'&&target){let data={};if(method==='PATCH'){data=await body(request);if(!['editor','viewer'].includes(data.role))return json({error:'Invalid role.'},400);await DB.prepare('UPDATE diagram_members SET role=? WHERE diagram_id=? AND account_id=?').bind(data.role,id,target).run();return json({ok:true});}if(method==='DELETE'){await DB.batch([DB.prepare('DELETE FROM diagram_members WHERE diagram_id=? AND account_id=?').bind(id,target),DB.prepare('DELETE FROM diagram_presence WHERE diagram_id=? AND account_id=?').bind(id,target)]);return json({ok:true});}}
  return json({error:'Method not allowed.'},405);
 }catch(error){console.error('Collaboration request failed',error.message);return json({error:'Could not complete the collaboration request.'},400);}
}
