export const SQL_TYPES=['TEXT','INTEGER','BIGINT','REAL','DECIMAL(12,2)','VARCHAR(255)','BOOLEAN','DATE','TIMESTAMP','UUID','JSON','BLOB'];
// Rooted traversal: flags belong to ancestors, never to siblings.
export function attributeTree(model,id){
 const nodes=new Map(model.nodes.map(n=>[n.id,n])),adj=new Map(model.nodes.map(n=>[n.id,[]]));
 for(const e of model.edges){adj.get(e.source)?.push(e.target);adj.get(e.target)?.push(e.source);}
 for(const ids of adj.values())ids.sort((a,b)=>{const x=nodes.get(a),y=nodes.get(b);return Number(!!(y.key||y.partialKey))-Number(!!(x.key||x.partialKey))||(x.name<y.name?-1:x.name>y.name?1:a<b?-1:a>b?1:0);});
 const seen=new Set([id]);
 function walk(parent,path=[],flags={}){const result=[];for(const next of adj.get(parent)||[]){const n=nodes.get(next);if(n?.type!=='attribute'||seen.has(next))continue;seen.add(next);const inherited={key:!!(flags.key||n.key),partialKey:!!(flags.partialKey||n.partialKey),derived:!!(flags.derived||n.derived),nullable:flags.nullable===false?false:n.nullable},p=[...path,n.name];const item={...n,...inherited,path:p,children:[]};item.children=walk(next,p,inherited);result.push(item);}return result;}
 return walk(id);
}
export function attributeLeaves(model,id){const out=[];function visit(items,multi=false){for(const a of items){const many=multi||!!a.multivalued;if(a.children.length)visit(a.children,many);else out.push({...a,multivalued:many});}}visit(attributeTree(model,id));return out;}
export function hasInheritedKey(model,attribute){for(const n of model.nodes.filter(n=>n.type!=='attribute')){const a=attributeLeaves(model,n.id).find(a=>a.id===attribute.id);if(a)return !!(a.key||a.partialKey);}return !!(attribute.key||attribute.partialKey);}
