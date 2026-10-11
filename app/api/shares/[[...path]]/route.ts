import {env} from 'cloudflare:workers';
import {sharesAPI} from '../../../../lib/shares-api.mjs';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>sharesAPI(request,env.DB);
export const POST=GET;
export const DELETE=GET;
