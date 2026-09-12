export const FACE_COUNT=4;
export const DRAWER_COUNT=48;
export const CLOSED_DEPTH=.48;
export const BANK_RADIUS=2.06;
// Preserve the original 24 IDs and their faces so saved items never move drawers.
export const drawerFace=id=>Math.floor((id%24)/6);
export function drawerLevel(id){const face=drawerFace(id),pair=Math.floor((id%6)/2);return pair*2+(id<24?(face%2?0:1):(face%2?1:0));}
export const drawerBase=id=>3.885-drawerLevel(id)*.695;
export function compressedLayout(layout,depth,fullDepth){
 const ratio=Math.min(1,depth/fullDepth);
 // Closing changes the tray's hidden depth, never the visible width or height
 // of its contents. A small rear riser keeps rows legible through the front.
 const closed=(fullDepth-depth)/(fullDepth-CLOSED_DEPTH);
 for(const slot of layout.positions.values()){
  const rear=Math.max(0,Math.min(1,.5-slot.z/fullDepth));
  const headroom=Math.max(0,.62-slot.y-(slot.height??.49));
  slot.y+=Math.min(.18,headroom)*Math.max(0,Math.min(1,closed))*rear;
  slot.z*=ratio;slot.depthScale=ratio;
 }
 for(const divider of layout.dividers){divider.z*=ratio;divider.depth*=ratio;}
 return layout;
}
export const DRAWER_CAPACITY=16;
export const foods = [
 {type:'milk',name:'牛奶',count:18,size:[.36,.33,.80]},
 {type:'soda',name:'汽水',count:24,size:[.38,.40,.70]},
 {type:'apple',name:'苹果',count:30,size:[.49,.48,.63]},
 {type:'orange',name:'橘子',count:36,size:[.49,.49,.55]},
 {type:'yogurt',name:'酸奶',count:20,size:[.48,.45,.41]},
 {type:'egg',name:'鸡蛋',count:28,size:[.38,.38,.53]}
];
export const items=foods.flatMap(f=>Array.from({length:f.count},(_,n)=>({id:`${f.type}-${n}`,type:f.type})));
export const itemById=new Map(items.map(i=>[i.id,i]));
export function cleanRecords(input){
 const seen=new Set(),counts=Array(DRAWER_COUNT).fill(0),result=[];
 if(!Array.isArray(input))return result;
 for(const r of input){const item=itemById.get(r?.id);if(!item||!Number.isInteger(r.drawer)||r.drawer<0||r.drawer>=DRAWER_COUNT||seen.has(r.id))continue;
  let drawer=r.drawer;if(counts[drawer]>=DRAWER_CAPACITY)drawer=counts.findIndex(n=>n<DRAWER_CAPACITY);if(drawer<0)continue;counts[drawer]++;seen.add(r.id);result.push({id:r.id,drawer});
 }return result;
}
export function drawerDimensions(records){
 const counts=Array.from({length:DRAWER_COUNT},(_,drawer)=>records.filter(r=>r.drawer===drawer).length);
 return counts.map((count,i)=>{const row=Math.floor(i/2),a=Math.pow(1+counts[row*2],.32),b=Math.pow(1+counts[row*2+1],.32),split=Math.max(.28,Math.min(.72,a/(a+b))),width=3.26*(i%2?1-split:split);
 return {width,x:i%2?-1.68+3.26*split+.10+width/2:-1.68+width/2,depth:1.05+Math.min(.34,count*.009),height:.82+Math.min(.5,count*.018)};
 });
}
export function layoutDrawer(records,width,depth,measuredSizes){
 const groups=foods.map(food=>({food:{...food,size:measuredSizes?.get(food.type)??food.size},items:records.filter(r=>itemById.get(r.id)?.type===food.type)})).filter(g=>g.items.length);
 const positions=new Map(),dividers=[],gap=.055;
 for(const group of groups)group.area=group.items.length*group.food.size[0]*group.food.size[1];
 groups.sort((a,b)=>b.area-a.area);
 function fill(group,rect){
  let best={scale:0,cols:1,rows:group.items.length};
  for(let cols=1;cols<=group.items.length;cols++){
   const rows=Math.ceil(group.items.length/cols);
   const scale=Math.min((rect.width/cols-.028)/group.food.size[0],(rect.depth/rows-.028)/group.food.size[1],.49/group.food.size[2],.90);
   if(scale>best.scale)best={scale,cols,rows};
  }
  group.items.forEach((record,n)=>positions.set(record.id,{x:rect.x+(n%best.cols+.5)*rect.width/best.cols,y:.09,z:rect.z+(Math.floor(n/best.cols)+.5)*rect.depth/best.rows,scale:best.scale,height:group.food.size[2]*best.scale}));
 }
 // Area-proportional rectangular compartments keep large families together without
 // shrinking every category into a narrow strip across the full drawer depth.
 function partition(list,rect){
  if(!list.length)return;if(list.length===1){fill(list[0],rect);return;}
  const total=list.reduce((sum,g)=>sum+g.area,0);let sum=0,best=Infinity,pivot=1,share=.5;
  for(let i=1;i<list.length;i++){sum+=list[i-1].area;const distance=Math.abs(total/2-sum);if(distance<best){best=distance;pivot=i;share=sum/total;}}
  if(rect.width>=rect.depth){
   const first=(rect.width-gap)*share;
   dividers.push({x:rect.x+first+gap/2,z:rect.z+rect.depth/2,width:.023,depth:rect.depth});
   partition(list.slice(0,pivot),{...rect,width:first});partition(list.slice(pivot),{...rect,x:rect.x+first+gap,width:rect.width-first-gap});
  }else{
   const first=(rect.depth-gap)*share;
   dividers.push({x:rect.x+rect.width/2,z:rect.z+first+gap/2,width:rect.width,depth:.023});
   partition(list.slice(0,pivot),{...rect,depth:first});partition(list.slice(pivot),{...rect,z:rect.z+first+gap,depth:rect.depth-first-gap});
  }
 }
 partition(groups,{x:-(width-.16)/2,z:-(depth-.16)/2,width:width-.16,depth:depth-.16});
 return {positions,dividers};
}
