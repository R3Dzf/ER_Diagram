import {planChenLayout} from './chen-layout-engine.js';
import {planCrowLayout} from './crow-layout-engine.js';
export {LAYOUT_RULES,inspectLayout} from './layout-validation.js';

// Dispatch only. Placement algorithms and options belong to their own view.
export function planLayout(model,options={}){return model.notation==='crowfoot'?planCrowLayout(model,options):planChenLayout(model,options);}
