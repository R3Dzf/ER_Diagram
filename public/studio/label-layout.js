let context;
const cache=new Map();

export function measureLabel(text,fontSize,weight=400){
 const key=JSON.stringify([text,fontSize,weight]);
 if(cache.has(key))return cache.get(key);
 if(!context&&typeof document!=='undefined'){
  try{context=document.createElement('canvas').getContext('2d');}catch{/* Non-browser rendering uses conservative font metrics. */}
 }
 let metrics;
 if(context){
  context.font=`${weight} ${fontSize}px Arial, sans-serif`;
  context.textAlign='left';context.textBaseline='alphabetic';context.direction='ltr';
  const measured=context.measureText(text);
  metrics={width:measured.width,actualBoundingBoxAscent:measured.actualBoundingBoxAscent,actualBoundingBoxDescent:measured.actualBoundingBoxDescent};
 }else{
  metrics={width:Array.from(text).length*fontSize*.56,actualBoundingBoxAscent:fontSize*.75,actualBoundingBoxDescent:/[_gjpqy\u0600-\u06ff]/u.test(text)?fontSize*.28:fontSize*.04};
 }
 if(cache.size>2000)cache.clear();
 cache.set(key,metrics);return metrics;
}

export function labelGeometry(text,fontSize,weight,maxWidth,measure=measureLabel){
 const m=measure(text,fontSize,weight),rawWidth=Math.max(0,m.width);
 const ascent=Number.isFinite(m.actualBoundingBoxAscent)?m.actualBoundingBoxAscent:fontSize*.75;
 const descent=Number.isFinite(m.actualBoundingBoxDescent)?m.actualBoundingBoxDescent:fontSize*.28;
 const baseline=(ascent-descent)/2,width=Math.min(maxWidth,rawWidth),strokeWidth=1.2;
 return {width,baseline,glyphTop:baseline-ascent,glyphBottom:baseline+descent,underlineY:baseline+descent+2+strokeWidth/2,strokeWidth,fitted:rawWidth>maxWidth};
}
