// Chen settings belong to the entity participating in a relationship. Keep the
// existing edge fields readable so saved diagrams and reversed edges still work.
export function relationshipParticipant(edge,nodes){
 const source=nodes.find(n=>n.id===edge.source),target=nodes.find(n=>n.id===edge.target);
 let entity,relationship,side;if(source?.type==='entity'&&target?.type==='relationship'){entity=source;relationship=target;side='Source';}else if(target?.type==='entity'&&source?.type==='relationship'){entity=target;relationship=source;side='Target';}else return null;
 const value=edge['label'+side];return {entity,relationship,edge,side,cardinality:['1','N','M'].includes(value)?value:'',total:!!(edge.totalSource||edge.totalTarget)};
}
export function relationshipParticipants(model,relationshipId){return model.edges.flatMap(edge=>{const p=relationshipParticipant(edge,model.nodes);return p?.relationship.id===relationshipId?[p]:[];});}
export function setRelationshipParticipant(edge,nodes,changes){
 const p=relationshipParticipant(edge,nodes);if(!p)throw Error('Choose an entity connected to a relationship.');
 const cardinality=changes.cardinality??p.cardinality,total=changes.total??p.total;if(!['','1','N','M'].includes(cardinality)||typeof total!=='boolean')throw Error('Invalid participant settings.');
 edge.labelSource='';edge.labelTarget='';edge['label'+p.side]=cardinality;edge.totalSource=false;edge.totalTarget=false;edge['total'+p.side]=total;
}
