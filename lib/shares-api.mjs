import {resolveIdentity,token,hash} from './auth-identity.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
async function body(request){if(!request.headers.get('content-type')?.startsWith('application/json'))throw Error('Expected JSON.');const reader=request.body?.getReader();if(!reader)throw Error('Missing request.');let text='',count=0;const decoder=new TextDecoder();while(true){const part=await reader.read();if(part.done)break;count+=part.value.byteLength;if(count>2048){await reader.cancel();throw Error('Request is too large.');}text+=decoder.decode(part.value,{stream:true});}return JSON.parse(text+decoder.decode());}
export async function sharesAPI(request,DB){
 const url=new URL(request.url),path=url.pathname.replace(/^\/api\/shares\/?/,'');
 if(!DB)return json({error:'Sharing is temporarily unavailable.'},503);
 if(request.method!=='GET'&&request.headers.get('origin')!==url.origin)return json({error:'This request must come from Bosha Studio.'},403);
 try{
  if(path==='view'){
   if(request.method!=='POST')return json({error:'Method not allowed.'},405);
   let data;try{data=await body(request);}catch{return json({error:'Invalid share request.'},400);}
   if(typeof data.token!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(data.token))return json({error:'This link is unavailable or has expired.'},404);
   const row=await DB.prepare('SELECT d.model,d.revision,d.updated_at FROM diagram_shares s JOIN diagrams d ON d.id=s.diagram_id AND d.owner_id=s.owner_id WHERE s.token_hash=? AND s.token IS NOT NULL AND (s.expires_at IS NULL OR s.expires_at>?) AND d.deleted=0').bind(await hash(data.token),Date.now()).first();
   return row?json({model:JSON.parse(row.model),revision:row.revision,updatedAt:row.updated_at}):json({error:'This link is unavailable or has expired.'},404);
  }
  const user=await resolveIdentity(request,DB);if(!user)return json({error:'Sign in to manage sharing.'},401);
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(path))return json({error:'Invalid diagram.'},400);
  if(request.method!=='GET'&&request.headers.get('X-Bosha-Account-ID')!==user.id)return json({error:'Your account changed. Sign in again before sharing.'},409);
  const owned=await DB.prepare('SELECT id FROM diagrams WHERE id=? AND owner_id=? AND deleted=0').bind(path,user.id).first();if(!owned)return json({error:'Diagram not found.'},404);
  if(request.method==='GET'){const row=await DB.prepare('SELECT token,created_at,expires_at FROM diagram_shares WHERE diagram_id=? AND owner_id=?').bind(path,user.id).first();return json({enabled:!!row?.token&&(row.expires_at===null||row.expires_at>Date.now()),token:row?.token||null,createdAt:row?.created_at||null,expiresAt:row?.expires_at??null});}
  if(request.method==='DELETE'){await DB.prepare('UPDATE diagram_shares SET token=NULL,token_hash=NULL WHERE diagram_id=? AND owner_id=?').bind(path,user.id).run();return json({ok:true});}
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  let data;try{data=await body(request);}catch{return json({error:'Invalid share settings.'},400);}
  if(![0,7,30].includes(data.days))return json({error:'Choose an available expiration period.'},400);
  const now=Date.now(),raw=token(),expiresAt=data.days?now+data.days*86400000:null;
  await DB.prepare('INSERT INTO diagram_shares (diagram_id,owner_id,token,token_hash,created_at,expires_at) VALUES (?,?,?,?,?,?) ON CONFLICT(diagram_id) DO UPDATE SET token=excluded.token,token_hash=excluded.token_hash,created_at=excluded.created_at,expires_at=excluded.expires_at WHERE owner_id=excluded.owner_id').bind(path,user.id,raw,await hash(raw),now,expiresAt).run();
  return json({enabled:true,token:raw,createdAt:now,expiresAt});
 }catch{console.error('Sharing operation failed');return json({error:'Could not complete the sharing request.'},500);}
}
