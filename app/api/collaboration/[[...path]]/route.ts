import {env} from 'cloudflare:workers';
import {collaborationAPI} from '../../../../lib/collaboration-api.mjs';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>collaborationAPI(request,env.DB);
export const POST=GET;
export const PATCH=GET;
export const DELETE=GET;
