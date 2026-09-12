import fs from 'node:fs';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3,Matrix4,Quaternion,Euler} from 'three';
import {items,drawerFace,drawerBase,drawerDimensions,CLOSED_DEPTH,BANK_RADIUS} from '../src/storage-layout.js';
const buffer=fs.readFileSync(new URL('../public/models/drawer-pantry.glb',import.meta.url));
const gltf=await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
const bounds=new Box3().setFromObject(gltf.scene);
let frames=0;
for(const [previous,next] of [[0,24],[24,0],[0,1],[0,6],[30,36],[47,23]]){
 const records=items.slice(0,32).map((item,i)=>({id:item.id,drawer:i<16?previous:next})),dims=drawerDimensions(records);
 for(let frame=0;frame<=30;frame++){
  const alpha=frame/30,boxes=[];
  for(let id=0;id<48;id++){
   const open=id===previous?1.8*(1-alpha):id===next?1.8*alpha:0,reveal=Math.max(0,(open-.9)/.9),d=dims[id];
   const angle=drawerFace(id)*Math.PI/2;
   const face=new Matrix4().compose(new Vector3(Math.sin(angle)*BANK_RADIUS,0,Math.cos(angle)*BANK_RADIUS),new Quaternion().setFromEuler(new Euler(0,angle,0)),new Vector3(1,1,1));
   const drawer=new Matrix4().compose(new Vector3(d.x,drawerBase(id),open),new Quaternion().setFromEuler(new Euler(.34*reveal,0,0)),new Vector3(d.width/1.54,d.height,CLOSED_DEPTH+(d.depth-CLOSED_DEPTH)*reveal));
   const box=bounds.clone().applyMatrix4(face.multiply(drawer));
   for(const other of boxes)assert(!box.intersectsBox(other.box),`drawers ${id}/${other.id} overlap at ${previous}->${next}, frame ${frame}`);
   boxes.push({id,box});
  }
  frames++;
 }
}
console.log(`${frames} opening/switching frames: all 48 physical tray envelopes remain separate.`);
