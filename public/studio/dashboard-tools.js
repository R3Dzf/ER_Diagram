export function dashboardProjects(projects,{search='',notation='all',sort='updated'}={}){
 const query=search.toLocaleLowerCase('en').trim();
 return projects.filter(p=>p.model.title.toLocaleLowerCase('en').includes(query)&&(notation==='all'||(p.model.notation||'chen')===notation)).sort((a,b)=>sort==='name'?a.model.title.localeCompare(b.model.title,'en',{numeric:true,sensitivity:'base'}):sort==='created'?b.createdAt-a.createdAt:b.updatedAt-a.updatedAt);
}
export function dashboardTotals(projects){return {diagrams:projects.length,entities:projects.reduce((total,p)=>total+p.model.nodes.filter(n=>n.type==='entity').length,0),connections:projects.reduce((total,p)=>total+p.model.edges.length,0)};}
