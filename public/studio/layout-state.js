// x/y and routing/points are the active view's rendering projection. The saved
// positions and routes below are independent, durable parts of each notation.
export const NOTATIONS=['chen','crowfoot'];
const copy=value=>structuredClone(value);
export const notationOf=model=>model.notation==='crowfoot'?'crowfoot':'chen';
export const positionKey=notation=>notation+'Position';
export const routeKey=notation=>notation+'Route';
export function ensureLayouts(model){
 for(const node of model.nodes)for(const notation of NOTATIONS){const key=positionKey(notation);if(!node[key])node[key]={x:node.x,y:node.y};}
 for(const edge of model.edges)for(const notation of NOTATIONS){const key=routeKey(notation);if(!edge[key])edge[key]={routing:edge.routing==='orthogonal'?'orthogonal':'straight',points:copy(edge.points||[])};}
 return model;
}
export function captureLayout(model){
 ensureLayouts(model);const notation=notationOf(model);
 for(const node of model.nodes)node[positionKey(notation)]={x:node.x,y:node.y};
 for(const edge of model.edges){edge.routing=edge.routing==='orthogonal'?'orthogonal':'straight';edge.points=copy(edge.points||[]);edge[routeKey(notation)]={routing:edge.routing,points:copy(edge.points)};}
 return model;
}
export function restoreLayout(model){
 const notation=notationOf(model);
 for(const node of model.nodes){const p=node[positionKey(notation)];if(p){node.x=p.x;node.y=p.y;}}
 for(const edge of model.edges){const route=edge[routeKey(notation)];if(route){edge.routing=route.routing;edge.points=copy(route.points);}}
 return model;
}
export function switchNotation(model,notation){
 captureLayout(model);model.notation=notation==='crowfoot'?'crowfoot':'chen';return restoreLayout(model);
}
export function geometryScope(key){return key==='chenPosition'||key==='chenRoute'?'chen':key==='crowfootPosition'||key==='crowfootRoute'?'crowfoot':null;}
export function projectionKey(kind,key){return kind==='nodes'?key==='x'||key==='y':key==='routing'||key==='points';}
