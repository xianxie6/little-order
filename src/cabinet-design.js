import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export function cabinetMaterials(){
 const enamel=new THREE.MeshPhysicalMaterial({color:0xeee9dc,roughness:.36,metalness:0,clearcoat:.24,clearcoatRoughness:.30});
 const inset=new THREE.MeshStandardMaterial({color:0xe6dfd0,roughness:.65});
 const interior=new THREE.MeshStandardMaterial({color:0xd4cebf,roughness:.72});
 const acrylic=new THREE.MeshPhysicalMaterial({color:0x58321f,transparent:true,opacity:.60,transmission:.15,thickness:.055,ior:1.49,roughness:.08,metalness:0,clearcoat:.85,clearcoatRoughness:.12,depthWrite:false});
 const acrylicEdge=new THREE.MeshPhysicalMaterial({color:0x58321f,transparent:true,opacity:.78,roughness:.17,clearcoat:.7,depthWrite:false});
 return {enamel,inset,interior,acrylic,acrylicEdge,chrome:new THREE.MeshStandardMaterial({color:0xcac2b1,roughness:.28,metalness:.82}),dark:new THREE.MeshStandardMaterial({color:0xaaa291,roughness:.75}),felt:inset,stone:new THREE.MeshStandardMaterial({color:0xf4f1e8,roughness:.38})};
}
function rounded(parent,size,position,material,radius=.012){
 const mesh=new THREE.Mesh(new RoundedBoxGeometry(...size,3,radius),material);mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function dressCabinet(turret,faces,materials){
 const {enamel,dark}=materials;
 rounded(turret,[4.48,.10,4.48],[0,-.035,0],dark,.012);
 for(const face of faces){
  for(const x of [-1.73,1.73])rounded(face,[.13,4.53,.10],[x,2.43,.32],enamel,.015);
  rounded(face,[3.36,.13,.035],[0,4.62,.33],enamel,.007);
  rounded(face,[3.36,.24,.035],[0,.25,.33],enamel,.007);
 }
 // Chamfered corner cheeks conceal the ends of adjacent banks.
 for(let i=0;i<4;i++){
  const corner=new THREE.Group();corner.rotation.y=i*Math.PI/2;turret.add(corner);
  const cheek=rounded(corner,[.79,4.60,.04],[2.065,2.42,2.065],enamel,.01);cheek.rotation.y=Math.PI/4;
 }
}
export function dressDrawer(group,materials){
 const front=new THREE.Group();group.add(front);
 const panel=rounded(front,[1,1,.055],[0,0,0],materials.acrylic,.015);panel.castShadow=false;panel.receiveShadow=false;
 const edges=Array.from({length:4},()=>{const edge=rounded(front,[1,1,.014],[0,0,0],materials.acrylicEdge,.005);edge.castShadow=false;return edge;});
 const pull=new THREE.Group();front.add(pull);
 for(const x of [-.145,.145])rounded(pull,[.045,.055,.033],[x,0,.02],materials.chrome,.012);
 rounded(pull,[.36,.053,.045],[0,0,.045],materials.chrome,.022);
 return{update(width,depth,height,reveal=0){
  const faceHeight=.60-.38*reveal;
  const panelWidth=width-.055,z=depth*.52+.065;
  panel.scale.set(panelWidth,faceHeight,1);panel.position.set(0,.03+faceHeight/2,depth*.52+.035);
  for(let i=0;i<2;i++){edges[i].scale.set(panelWidth,.009,1);edges[i].position.set(0,.035+i*(faceHeight-.01),z);edges[i+2].scale.set(.009,faceHeight,1);edges[i+2].position.set((i?1:-1)*(panelWidth/2-.0045),.03+faceHeight/2,z);}
  pull.position.set(0,.03+faceHeight*.48,depth*.52+.075);
 }};
}
