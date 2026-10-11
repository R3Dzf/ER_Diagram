import {test} from 'node:test';
import assert from 'node:assert/strict';
import {labelGeometry} from '../public/studio/label-layout.js';
import {connectionSegments,edgeMarkup,nodeMarkup,exportSVG,size,boundary} from '../public/studio/core.js';

const onOutline=(node,point)=>{const {w,h}=size(node),x=Math.abs(point.x-node.x)/(w/2),y=Math.abs(point.y-node.y)/(h/2);return node.type==='relationship'?x+y:node.type==='attribute'?x*x+y*y:Math.max(x,y);};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);

test('a total-participation line spans the entire entity-to-relationship connection in every direction',()=>{
 for(const [x,y] of [[500,0],[0,500],[-500,0],[0,-500],[500,330],[-500,330],[500,-330],[-500,-330],[1,500],[500,1]]){
  const relation={id:'r',name:'Publishes',type:'relationship',x:0,y:0},entity={id:'e',name:'Book',type:'entity',x,y},nodes=[relation,entity];
  for(const flags of [{totalSource:true},{totalTarget:true},{totalSource:true,totalTarget:true}]){
   const segments=connectionSegments({source:'r',target:'e',...flags},nodes);
   assert.equal(segments.length,2);
   const len=Math.hypot(x,y),normal={x:-y/len,y:x/len};
   for(const segment of segments){
    near(onOutline(relation,segment.start),1);near(onOutline(entity,segment.end),1);
    // Every line terminates on both shapes, not at the connection midpoint.
    const startOffset=(segment.start.x-relation.x)*normal.x+(segment.start.y-relation.y)*normal.y;
    const endOffset=(segment.end.x-entity.x)*normal.x+(segment.end.y-entity.y)*normal.y;
    near(Math.abs(startOffset),3.5);near(startOffset,endOffset);
   }
   const markup=edgeMarkup({source:'r',target:'e',...flags},nodes);
   assert.equal((markup.match(/<path /g)||[]).length,2);
  }
 }
});

test('the reported vertical and horizontal gaps are removed at diamond corners',()=>{
 const r={id:'r',name:'Publishes',type:'relationship',x:0,y:0},book={id:'b',name:'Book',type:'entity',x:0,y:300};
 for(const {start,end} of connectionSegments({source:'r',target:'b',totalTarget:true},[r,book])){
  assert.ok(start.y<size(r).h/2,'Offset lines must attach to the diamond side, not float below its bottom corner');
  near(end.y,book.y-size(book).h/2);near(start.x,end.x);
 }
 const stocks={id:'s',name:'Stocks',type:'relationship',x:350,y:300};
 for(const {start,end} of connectionSegments({source:'b',target:'s',totalSource:true},[book,stocks])){
  near(start.x,book.x+size(book).w/2);assert.ok(end.x>stocks.x-size(stocks).w/2);near(start.y,end.y);
 }
});

test('offset rays also clip accurately to ellipses and rectangles',()=>{
 for(const type of ['attribute','entity','relationship'])for(const [x,y] of [[700,450],[-700,-450],[0,700],[700,0]])for(const offset of [-3.5,3.5]){
  const n={id:'n',name:'Attribute',type,x:20,y:40};near(onOutline(n,boundary(n,{x:n.x+x,y:n.y+y},offset)),1);
 }
});

test('attribute connections stay single even if old project metadata has a participation flag',()=>{
 const a={id:'a',type:'entity',name:'Entity',x:0,y:0},b={id:'b',type:'attribute',name:'id',x:0,y:-200};
 assert.equal(connectionSegments({source:'a',target:'b',totalSource:true},[a,b]).length,1);
});

test('key underlines follow the full label width and clear descenders in canvas and export markup',()=>{
 for(const name of ['id','title','isbn','student_id','registration_number','gyqp','_'.repeat(5),'W'.repeat(80)]){
  const n={id:'n',type:'attribute',name,x:0,y:0,key:true},markup=nodeMarkup(n),layout=labelGeometry(name,18,400,size(n).w-40);
  assert.ok(markup.includes('data-key-underline="true"'));
  assert.ok(markup.includes('dominant-baseline="alphabetic"'));
  assert.equal(markup.includes('text-decoration="underline"'),false);
  const line=markup.match(/<line data-key-underline="true"[^>]+/)[0];
  const value=k=>Number(line.match(new RegExp(k+'="([^" ]+)"'))[1]);
  near(value('x2')-value('x1'),layout.width);
  near(value('y1')-value('stroke-width')/2-layout.glyphBottom,2);
  const exported=exportSVG({version:1,title:'Keys',nodes:[n],edges:[]}).svg;
  assert.ok(exported.includes(line));
 }
 const plain=nodeMarkup({id:'n',type:'attribute',name:'name',x:0,y:0});assert.equal(plain.includes('data-key-underline'),false);
 const partial=nodeMarkup({id:'n',type:'attribute',name:'code_id',x:0,y:0,partialKey:true});assert.ok(partial.includes('stroke-dasharray="5 3"'));
});

test('measured underscore and descender glyphs always stay above the underline',()=>{
 for(const descent of [0,2,4,8,12]){
  const measured={width:86.5,actualBoundingBoxAscent:14,actualBoundingBoxDescent:descent};
  const layout=labelGeometry('student_id',18,400,250,()=>measured);
  const bottom=layout.baseline+descent;
  near(layout.underlineY-layout.strokeWidth/2-bottom,2);
  near(layout.glyphTop+layout.glyphBottom,0);
  near(layout.width,86.5);
 }
});

test('fitting long key names shrinks only the width and preserves the glyph-to-line gap',()=>{
 const measured={width:1000,actualBoundingBoxAscent:14,actualBoundingBoxDescent:5};
 const layout=labelGeometry('student_id'.repeat(10),18,400,250,()=>measured);
 assert.equal(layout.fitted,true);assert.equal(layout.width,250);
 near(layout.underlineY-layout.strokeWidth/2-(layout.baseline+5),2);
});
