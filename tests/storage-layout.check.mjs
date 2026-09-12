import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3} from 'three';
import {foods,items,layoutDrawer,compressedLayout,CLOSED_DEPTH,drawerFace,drawerBase,cleanRecords,DRAWER_COUNT} from '../src/storage-layout.js';

// Validate real model extents, including stems and leaves, across mixed compartments.
const sizes=new Map();
for(const food of foods){
 const buffer=fs.readFileSync(fileURLToPath(new URL(`../public/models/${food.type}.glb`,import.meta.url)));
 const gltf=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
 const size=new Box3().setFromObject(gltf.scene).getSize(new Vector3());sizes.set(food.type,[size.x,size.z,size.y]);
}
let cases=0;
for(let offset=0;offset<items.length;offset++)for(let count=1;count<=16;count++)for(const width of [.9128,1.63,2.3472]){
 const records=Array.from({length:count},(_,i)=>({id:items[(offset+i*7)%items.length].id,drawer:0}));
 const layout=layoutDrawer(records,width,1.05,sizes),boxes=[];
 for(const record of records){
  const slot=layout.positions.get(record.id),size=sizes.get(record.id.split('-')[0]);assert(slot.scale>0);
  const box=new Box3(new Vector3(slot.x-size[0]*slot.scale/2,slot.y,slot.z-size[1]*slot.scale/2),new Vector3(slot.x+size[0]*slot.scale/2,slot.y+size[2]*slot.scale,slot.z+size[1]*slot.scale/2));
  assert(box.min.x>=-width/2+.035&&box.max.x<=width/2-.035&&box.min.z>=-.49&&box.max.z<=.49,'food crosses a tray wall');
  for(const other of boxes)assert(!box.intersectsBox(other),'food overlaps food');
  for(const divider of layout.dividers){
   const bounds=new Box3(new Vector3(divider.x-divider.width/2,.09,divider.z-divider.depth/2),new Vector3(divider.x+divider.width/2,.40,divider.z+divider.depth/2));
   assert(!box.intersectsBox(bounds),'food overlaps a wood partition');
  }
  boxes.push(box);
 }
 cases++;
}
// Old saves keep their IDs/faces; every new panel owns a distinct usable row.
assert.equal(DRAWER_COUNT,48);
for(let face=0;face<4;face++){
 const ids=Array.from({length:48},(_,i)=>i).filter(id=>drawerFace(id)===face);
 assert.equal(ids.length,12);assert.equal(new Set(ids.map(id=>`${drawerBase(id)}:${id%2}`)).size,12);
 for(let i=0;i<6;i++)assert.equal(drawerFace(face*6+i),face);
}
const legacy=items.slice(0,24).map((item,i)=>({id:item.id,drawer:i}));assert.deepEqual(cleanRecords(legacy),legacy);
for(let start=0;start<156;start++){
 const records=Array.from({length:16},(_,i)=>({id:items[(start+i*7)%156].id,drawer:24}));
 for(const depth of [CLOSED_DEPTH,.7,1.05]){
  const layout=compressedLayout(layoutDrawer(records,1.63,1.05,sizes),depth,1.05);
  const open=layoutDrawer(records,1.63,1.05,sizes),boxes=[];
  for(const record of records){
   const p=layout.positions.get(record.id),original=open.positions.get(record.id),size=sizes.get(record.id.split('-')[0]);
   assert.equal(p.scale,original.scale,'closing must preserve visible item size');
   assert.equal(p.x,original.x,'closing must preserve item columns');
   const halfDepth=size[1]*p.scale*p.depthScale/2;
   assert(Math.abs(p.z)+halfDepth<depth/2-.035);
   assert(p.y+size[2]*p.scale<.66,'closed contents must remain in their own row');
   const box=new Box3(new Vector3(p.x-size[0]*p.scale/2,p.y,p.z-halfDepth),new Vector3(p.x+size[0]*p.scale/2,p.y+size[2]*p.scale,p.z+halfDepth));
   for(const other of boxes)assert(!box.intersectsBox(other),'closing must not overlap contents');
   for(const divider of layout.dividers){
    const bounds=new Box3(new Vector3(divider.x-divider.width/2,.09,divider.z-divider.depth/2),new Vector3(divider.x+divider.width/2,.40,divider.z+divider.depth/2));
    assert(!box.intersectsBox(bounds),'closing must not cross a divider');
   }
   boxes.push(box);
  }
 }
}
console.log(`${cases} mixed layouts, expanding trays, all 48 IDs and legacy saves passed.`);
