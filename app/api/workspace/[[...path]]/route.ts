import {env} from 'cloudflare:workers';
import {workspaceAPI} from '../../../../lib/workspace-api.mjs';
export const dynamic='force-dynamic';
export const GET=(request:Request)=>workspaceAPI(request,env.DB);
export const PUT=GET;
export const DELETE=GET;
