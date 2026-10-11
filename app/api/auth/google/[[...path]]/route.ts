import {env} from 'cloudflare:workers';
import {googleAuthAPI} from '../../../../../lib/google-auth.mjs';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>googleAuthAPI(request,env);
export const POST=GET;
