export function gestureAction({button=0,mode='select',space=false,nodeId=null,edgeId=null}){
 if(button!==0&&button!==1)return 'ignore';
 if(button===1||space||mode==='pan')return 'pan';
 if(!nodeId&&!edgeId)return 'pan';
 if(mode==='connect'&&nodeId)return 'connect';
 if(nodeId)return 'move-node';
 return 'select-edge';
}
export function panCamera(start,dx,dy){return {...start,x:start.x-dx/start.scale,y:start.y-dy/start.scale};}
export function zoomCamera(camera,factor,anchor){const scale=Math.max(.001,Math.min(3,camera.scale*factor));return {scale,x:camera.x+anchor.x/camera.scale-anchor.x/scale,y:camera.y+anchor.y/camera.scale-anchor.y/scale};}
