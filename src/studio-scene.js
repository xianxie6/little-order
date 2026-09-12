import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {cabinetMaterials,dressCabinet,dressDrawer} from './cabinet-design.js';
import { drawerDimensions,layoutDrawer,compressedLayout,drawerFace,drawerBase,CLOSED_DEPTH,BANK_RADIUS,itemById,DRAWER_COUNT,DRAWER_CAPACITY } from './storage-layout.js';
export async function createStudio({canvas,stage,foods,items,onLoad,onFaceChange}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.91;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-7,7,4,-4,.1,70);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04).texture;scene.environment=env;scene.environmentIntensity=.56;pmrem.dispose();room.dispose();
 scene.add(new THREE.HemisphereLight(0xf5f8ff,0xb9b8a9,.85));const key=new THREE.DirectionalLight(0xfff5e7,2.1);key.position.set(-5,11,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-10,right:10,top:10,bottom:-7,near:.5,far:35});key.shadow.normalBias=.025;key.shadow.bias=-.0002;key.shadow.radius=7;key.shadow.blurSamples=8;scene.add(key);const fill=new THREE.DirectionalLight(0xe4eeff,.9);fill.position.set(7,7,-3);scene.add(fill);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.065}));floor.rotation.x=-Math.PI/2;floor.position.y=-.13;floor.receiveShadow=true;scene.add(floor);
 const left=new THREE.Group(),right=new THREE.Group();scene.add(left,right);
 const table=new THREE.Mesh(new RoundedBoxGeometry(5.50,.16,4.65,4,.12),new THREE.MeshStandardMaterial({color:0xdeddd0,roughness:.7}));table.position.set(0,2.03,.12);table.receiveShadow=true;table.castShadow=true;right.add(table);
 const tableEdge=new THREE.Mesh(new RoundedBoxGeometry(5.37,.075,4.5,3,.04),new THREE.MeshStandardMaterial({color:0xc8ccbe,roughness:.65}));tableEdge.position.set(0,1.94,.12);right.add(tableEdge);
 for(const x of [-2.4,2.4])for(const z of [-1.8,2]){const leg=new THREE.Mesh(new RoundedBoxGeometry(.075,1.96,.075,2,.02),new THREE.MeshStandardMaterial({color:0xb8c0b0,roughness:.35,metalness:.6}));leg.position.set(x,.97,z);leg.castShadow=true;right.add(leg);}
 const cloth=new THREE.Mesh(new RoundedBoxGeometry(2.3,.018,2.7,3,.03),new THREE.MeshStandardMaterial({color:0xf1ecdd,roughness:1}));cloth.position.set(.9,2.12,.2);cloth.rotation.y=-.19;cloth.receiveShadow=true;right.add(cloth);
 const loader=new GLTFLoader();let count=0;const names=['drawer',...foods.map(f=>f.type)];
 const models=Object.fromEntries(await Promise.all(names.map(async name=>{const gltf=await loader.loadAsync(`${import.meta.env.BASE_URL}models/${name==='drawer'?'drawer-pantry':name}.glb`);gltf.scene.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const m=o.material;if(m.name==='clear recycled plastic'){m.transmission=0;m.transparent=true;m.opacity=.27;m.color.set(0xb7d1c0);m.depthWrite=false;m.roughness=.12;o.castShadow=false;}if(m.name==='frosted edges'){m.transmission=0;m.transparent=true;m.opacity=.85;m.color.set(0x8ba692);m.depthWrite=false;o.castShadow=false;}});onLoad(++count/names.length);return[name,gltf.scene];})));
 const turret=new THREE.Group();left.add(turret);let angle=0,targetAngle=0,currentFace=0,dragging=false;
 const finishMaterials=cabinetMaterials(),frameMat=finishMaterials.enamel,backMat=finishMaterials.interior;
 models.drawer.traverse(o=>{if(!o.isMesh)return;const name=o.material.name;if(name==='pantry satin metal')o.material=finishMaterials.chrome;else{const mat=(name==='pantry endgrain'?finishMaterials.interior:finishMaterials.enamel).clone();mat.name=name;o.material=mat;}});
 table.material=finishMaterials.stone;tableEdge.material=finishMaterials.enamel;
 function frameBox(parent,size,pos,mat=frameMat){const m=new THREE.Mesh(new RoundedBoxGeometry(...size,3,.035),mat);m.position.set(...pos);m.receiveShadow=true;m.castShadow=true;m.userData.cabinet=true;parent.add(m);return m;}
 // Closed trays occupy four separate shallow banks; they extend only after clearing
 // the cabinet. This leaves space for six working rows on every face.
 const faceRadius=BANK_RADIUS;
 const faces=Array.from({length:4},(_,i)=>{const g=new THREE.Group();g.rotation.y=i*Math.PI/2;g.position.set(Math.sin(i*Math.PI/2)*faceRadius,0,Math.cos(i*Math.PI/2)*faceRadius);for(const x of [-1.75,1.75])frameBox(g,[.12,4.62,.10],[x,2.41,.30]);for(const y of [.16,4.72])frameBox(g,[3.6,.10,.10],[0,y,.30]);frameBox(g,[3.36,4.43,.045],[0,2.42,-.32],backMat);turret.add(g);return g;});
 frameBox(turret,[4.76,.055,4.76],[0,4.785,0]);frameBox(turret,[4.67,.10,4.67],[0,.065,0]);
 frameBox(turret,[1.4,4.5,1.4],[0,2.42,0],backMat);
 dressCabinet(turret,faces,finishMaterials);
 const shelfMat=finishMaterials.interior;
 const drawers=Array.from({length:DRAWER_COUNT},(_,i)=>{const group=new THREE.Group(),basket=models.drawer.clone(true),dividerGroup=new THREE.Group(),rims=[];group.position.set(i%2?.86:-.86,drawerBase(i),0);group.add(basket,dividerGroup);group.userData.drawerIndex=i;basket.traverse(o=>{if(o.isMesh&&o.material.name==='pantry rail'){o.material=o.material.clone();rims.push(o.material);}});faces[drawerFace(i)].add(group);const finish=dressDrawer(group,finishMaterials);return{group,basket,dividerGroup,rims,finish,target:0,width:1.63,depth:CLOSED_DEPTH,height:.82,dim:{width:1.63,depth:1.05,height:.82,x:group.position.x},layout:{positions:new Map(),dividers:[]},dividerMeshes:[]};});
 for(const face of faces)for(let row=0;row<6;row++){const shelf=new THREE.Mesh(new RoundedBoxGeometry(3.4,.025,.53,3,.005),shelfMat);shelf.position.set(0,3.885-row*.695-.04,-.01);shelf.receiveShadow=true;shelf.userData.cabinet=true;face.add(shelf);}
 // Shared GPU instances keep a table with 156 detailed objects responsive.
 const drawerBounds=new THREE.Box3().setFromObject(models.drawer);
 const templates=new Map(),measuredSizes=new Map(),batches=[];
 for(const food of foods){const template=models[food.type];template.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(template);const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),packedOffset=new THREE.Vector3(-center.x,-box.min.y,-center.z);measuredSizes.set(food.type,[size.x,size.z,size.y]);const parts=[];template.traverse(o=>{if(o.isMesh)parts.push({geometry:o.geometry,material:o.material,local:o.matrixWorld.clone()});});const typeItems=items.filter(i=>i.type===food.type);const typeBatches=parts.map(part=>{const batch=new THREE.InstancedMesh(part.geometry,part.material,typeItems.length);batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);batch.castShadow=!part.material.transparent;batch.receiveShadow=true;batch.frustumCulled=false;batch.userData.ids=typeItems.map(i=>i.id);scene.add(batch);batches.push(batch);return{batch,local:part.local};});templates.set(food.type,{parts:typeBatches,box,packedOffset,index:new Map(typeItems.map((i,n)=>[i.id,n]))});}
 const entries=new Map();let seed=347;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};const order=[...items];for(let i=order.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const anchors=[];const baseCount=84;
 order.forEach((item,k)=>{const root=new THREE.Group(),model=new THREE.Group();root.add(model);right.add(root);const layer=Math.floor(k/baseCount),anchor=k%baseCount,col=anchor%12,row=Math.floor(anchor/12),x=(col-5.5)*.42+(rand()-.5)*.16,z=(row-3)*.61+.1+(rand()-.5)*.18;
  root.rotation.y=rand()*Math.PI*2;root.scale.setScalar(.70);if(['milk','soda','egg'].includes(item.type)&&rand()<.63)model.rotation.z=Math.PI/2+(rand()-.5)*.12;else model.rotation.z=(rand()-.5)*.17;
  model.updateMatrix();const bounds=templates.get(item.type).box.clone().applyMatrix4(model.matrix);const center=bounds.getCenter(new THREE.Vector3());model.position.set(-center.x,-bounds.min.y,-center.z);const objectHeight=(bounds.max.y-bounds.min.y)*.7;
  const support=layer?anchors[anchor]:null;root.position.set(x,2.13+(support?support.height:0),z);root.userData.id=item.id;
  const entry={root,model,type:item.type,id:item.id,home:root.position.clone(),homeQ:root.quaternion.clone(),modelQ:model.quaternion.clone(),modelPos:model.position.clone(),height:objectHeight,support:support?.id,initialSupport:support?.id,packed:false,drawer:-1,slot:null,packedOffset:templates.get(item.type).packedOffset,index:templates.get(item.type).index.get(item.id)};
  entries.set(item.id,entry);if(!layer)anchors[anchor]={id:item.id,height:objectHeight};
 });
 let active=-1,hover=null,needsFrames=90,last=performance.now(),mobile=false,frame,allRecords=[];const flights=new Map();
 const matrix=new THREE.Matrix4(),localMatrix=new THREE.Matrix4(),temp=new THREE.Vector3(),identityQ=new THREE.Quaternion();
 function setRecords(records,instant=false){allRecords=records.map(r=>({...r}));const dims=drawerDimensions(records);drawers.forEach((d,i)=>{d.dim=dims[i];d.records=records.filter(r=>r.drawer===i);d.layout=compressedLayout(layoutDrawer(d.records,d.dim.width,d.dim.depth,measuredSizes),d.depth,d.dim.depth);if(instant){d.width=d.dim.width;d.depth=CLOSED_DEPTH+(d.dim.depth-CLOSED_DEPTH)*Math.max(0,(d.group.position.z-.9)/.9);d.layout=compressedLayout(layoutDrawer(d.records,d.width,d.dim.depth,measuredSizes),d.depth,d.dim.depth);d.height=d.dim.height;d.group.position.x=d.dim.x;}
  while(d.dividerMeshes.length<d.layout.dividers.length){const divider=new THREE.Mesh(new RoundedBoxGeometry(1,.31,1,2,.005),finishMaterials.inset);d.dividerGroup.add(divider);d.dividerMeshes.push(divider);}
  d.dividerMeshes.forEach((m,n)=>{m.visible=n<d.layout.dividers.length;if(m.visible){const p=d.layout.dividers[n];m.position.set(p.x,.245,p.z);m.scale.set(p.width,1,p.depth);}});
 });records.forEach(r=>{const e=entries.get(r.id);e.drawer=r.drawer;e.slot=drawers[r.drawer].layout.positions.get(r.id);});needsFrames=100;}
 function restore(records){flights.forEach(f=>f.resolve());flights.clear();entries.forEach(e=>{e.root.removeFromParent();right.add(e.root);e.packed=false;e.drawer=-1;e.slot=null;e.support=e.initialSupport;e.bounceTime=0;e.root.position.copy(e.home);e.root.quaternion.copy(e.homeQ);e.root.scale.setScalar(.7);e.model.position.copy(e.modelPos);e.model.quaternion.copy(e.modelQ);});setRecords(records,true);records.forEach(r=>{const e=entries.get(r.id),d=drawers[r.drawer],p=e.slot;e.packed=true;d.group.add(e.root);e.root.position.set(p.x,p.y,p.z);e.root.rotation.set(0,0,0);e.root.scale.set(p.scale,p.scale,p.scale*(p.depthScale??1));e.model.position.copy(e.packedOffset);e.model.rotation.set(0,0,0);});}
 function choose(index){if(index>=0&&drawerFace(index)!==currentFace){const face=drawerFace(index);targetAngle=-face*Math.PI/2;setFace(face);}active=index;drawers.forEach((d,i)=>{d.target=i===index?1.80:0;d.rims.forEach(m=>{m.color.set(i===index?0xfff3df:0xeee9dc);m.opacity=1;});});needsFrames=100;}
 function pack(id,drawer,records){const entry=entries.get(id);if(!entry||entry.packed||flights.has(id))return Promise.resolve();const start=entry.root.getWorldPosition(new THREE.Vector3()),startQ=entry.root.getWorldQuaternion(new THREE.Quaternion()),startScale=entry.root.getWorldScale(new THREE.Vector3()).x;scene.attach(entry.root);entry.packed=true;entry.drawer=drawer;hover=null;setRecords(records);return new Promise(resolve=>flights.set(id,{mode:'pack',entry,start,startQ,startScale,startDepthScale:entry.root.getWorldScale(new THREE.Vector3()).z/startScale,startModelQ:entry.model.quaternion.clone(),startModelPos:entry.model.position.clone(),time:performance.now(),duration:reduced?0:760,resolve}));}

 function dropSpot(entry){
  let best=null;const radius=Math.max(...foods.find(f=>f.type===entry.type).size.slice(0,2))*.35;
  for(let i=0;i<84;i++){const x=(i%12-5.5)*.42,z=(Math.floor(i/12)-3)*.61+.1;let top=2.13,support=null;
   entries.forEach(e=>{if(e===entry||e.packed||flights.has(e.id))return;const otherRadius=Math.max(...foods.find(f=>f.type===e.type).size.slice(0,2))*.35;if(Math.hypot(x-e.root.position.x,z-e.root.position.z)<radius+otherRadius){const y=e.root.position.y+e.height;if(y>top){top=y;support=e.id;}}});
   const score=top*3+Math.hypot(x-entry.home.x,z-entry.home.z)*.12;if(!best||score<best.score)best={score,point:new THREE.Vector3(x,top,z),support};
  }return best;
 }
 function eject(id,records){const entry=entries.get(id);if(!entry?.packed||flights.has(id))return Promise.resolve();entries.forEach(e=>{if(e.support===id)e.support=null;});const start=entry.root.getWorldPosition(new THREE.Vector3()),startQ=entry.root.getWorldQuaternion(new THREE.Quaternion()),startScale=entry.root.getWorldScale(new THREE.Vector3()).x,drop=dropSpot(entry);scene.attach(entry.root);entry.packed=false;entry.drawer=-1;entry.slot=null;entry.support=drop.support;hover=null;setRecords(records);
  return new Promise(resolve=>flights.set(id,{mode:'eject',entry,start,startQ,startScale,startDepthScale:entry.root.getWorldScale(new THREE.Vector3()).z/startScale,drop:drop.point,startModelQ:entry.model.quaternion.clone(),startModelPos:entry.model.position.clone(),time:performance.now(),duration:reduced?0:740,resolve}));
 }
 function setFace(face){currentFace=(face%4+4)%4;onFaceChange?.(currentFace);}
 function rotate(direction){choose(-1);targetAngle+=direction*Math.PI/2;setFace(Math.round(-targetAngle/(Math.PI/2)));needsFrames=110;}
 function dragRotate(delta){dragging=true;angle+=delta;targetAngle=angle;needsFrames=110;}
 function snapRotation(){dragging=false;targetAngle=Math.round(angle/(Math.PI/2))*Math.PI/2;setFace(Math.round(-targetAngle/(Math.PI/2)));needsFrames=110;}
 function project(world){const v=world.clone().project(camera);return{x:(v.x+1)*stage.clientWidth/2,y:(1-v.y)*stage.clientHeight/2};}
 function syncPins(){const scale=stage.clientHeight/(camera.top-camera.bottom)*left.scale.x;drawers.forEach((d,i)=>{const el=document.querySelector(`[data-drawer="${i}"]`);el.hidden=drawerFace(i)!==currentFace||Math.abs(angle-targetAngle)>.035||dragging;const p=project(d.group.localToWorld(new THREE.Vector3(0,.30,d.depth*.52+.08)));el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;el.style.width=`${d.width*scale}px`;el.style.height=`${.58*scale}px`;});entries.forEach(e=>{const el=document.querySelector(`[data-item="${e.id}"]`);el.hidden=flights.has(e.id)||e.packed&&(e.drawer!==active||drawerFace(e.drawer)!==currentFace||drawers[e.drawer].group.position.z<1.5);if(el.hidden)return;const p=project(e.root.localToWorld(new THREE.Vector3(0,.25,0)));el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;el.style.width='28px';el.style.height='28px';});}
 function resize(){mobile=matchMedia('(max-width:740px)').matches;const w=stage.clientWidth,h=stage.clientHeight;const height=mobile?Math.max(13.4,5.4*h/w):Math.max(8.6,14*h/w);camera.top=height/2;camera.bottom=-height/2;camera.left=-height*w/h/2;camera.right=height*w/h/2;
  if(mobile){left.position.set(0,4.0,0);left.scale.setScalar(1.38);right.position.set(0,-.3,1.2);right.scale.setScalar(.92);camera.position.set(0,11.4,19);camera.lookAt(0,4.9,0);}else{left.position.set(-3.55,0,0);left.scale.setScalar(1.40);right.position.set(3.05,.23,.3);right.scale.setScalar(1);camera.position.set(0,10.4,19);camera.lookAt(0,3.5,0);}
  // Present the cabinet in elevation so its top has zero projected area.
  const pitch=mobile?Math.atan2(11.4-4.9,19):Math.atan2(10.4-3.5,19);left.rotation.x=-pitch;
  camera.updateProjectionMatrix();renderer.setSize(w,h,false);needsFrames=100;
 }
 const observer=new ResizeObserver(resize);observer.observe(stage);resize();
 function renderInstances(){scene.updateMatrixWorld(true);entries.forEach(e=>{const template=templates.get(e.type);matrix.multiplyMatrices(e.root.matrixWorld,e.model.matrix);template.parts.forEach(part=>{localMatrix.multiplyMatrices(matrix,part.local);part.batch.setMatrixAt(e.index,localMatrix);});});batches.forEach(b=>{b.instanceMatrix.needsUpdate=true;b.computeBoundingSphere();});}
 function animate(now){frame=requestAnimationFrame(animate);if(document.hidden||needsFrames<=0&&!flights.size)return;needsFrames--;const dt=Math.min((now-last)/1000,.05);last=now;const ease=reduced?1:1-Math.exp(-dt*8);
  angle=THREE.MathUtils.lerp(angle,targetAngle,ease);turret.rotation.y=angle;
  drawers.forEach(d=>{d.group.position.z=THREE.MathUtils.lerp(d.group.position.z,d.target,ease);d.group.position.x=THREE.MathUtils.lerp(d.group.position.x,d.dim.x,ease);d.width=THREE.MathUtils.lerp(d.width,d.dim.width,ease);const reveal=THREE.MathUtils.clamp((d.group.position.z-.9)/.9,0,1);d.depth=CLOSED_DEPTH+(d.dim.depth-CLOSED_DEPTH)*reveal;d.group.rotation.x=.34*reveal;d.height=THREE.MathUtils.lerp(d.height,d.dim.height,ease);d.basket.scale.set(d.width/1.54,d.height,d.depth);d.finish.update(d.width,d.depth,d.height,reveal);
   // One layout per rendered frame: dividers and food share the current envelope.
   // Independently lerping old slots causes crossings when the grid changes columns.
   d.layout=compressedLayout(layoutDrawer(d.records??[],d.width,d.dim.depth,measuredSizes),d.depth,d.dim.depth);
   for(const r of d.records??[])entries.get(r.id).slot=d.layout.positions.get(r.id);
   d.dividerMeshes.forEach((m,n)=>{m.visible=n<d.layout.dividers.length;if(m.visible){const p=d.layout.dividers[n];m.position.set(p.x,.245,p.z);m.scale.set(p.width,1,p.depth);}});});
  entries.forEach(e=>{if(flights.has(e.id))return;if(!e.packed){const supported=e.support&&!entries.get(e.support).packed&&!flights.has(e.support);const supportEntry=supported?entries.get(e.support):null;const t=e.bounceTime?Math.min((now-e.bounceTime)/190,1):1;const bounce=Math.sin(t*Math.PI)*.055;const y=(supportEntry?supportEntry.root.position.y+supportEntry.height:2.13)+(hover===e.id?.08:0)+bounce;e.root.position.y=THREE.MathUtils.lerp(e.root.position.y,y,ease);}else if(e.slot){e.root.position.set(e.slot.x,e.slot.y+(hover===e.id?.025:0),e.slot.z);e.root.scale.set(e.slot.scale,e.slot.scale,e.slot.scale*(e.slot.depthScale??1));}});
  flights.forEach((f,id)=>{const t=f.duration?Math.min((now-f.time)/f.duration,1):1,e=t*t*(3-2*t);let dest,targetQ,targetScale,targetDepthScale=1;
   if(f.mode==='eject'){right.updateWorldMatrix(true,false);dest=right.localToWorld(f.drop.clone());targetQ=right.getWorldQuaternion(new THREE.Quaternion()).multiply(f.entry.homeQ);targetScale=.7*right.scale.x;}
   else{const d=drawers[f.entry.drawer],slot=f.entry.slot;d.group.updateWorldMatrix(true,false);dest=d.group.localToWorld(new THREE.Vector3(slot.x,slot.y,slot.z));targetQ=d.group.getWorldQuaternion(new THREE.Quaternion());targetScale=slot.scale*left.scale.x;targetDepthScale=slot.depthScale??1;}
   let poseEase=e;
   if(f.mode==='pack'){
    const travel=Math.min(t/.65,1);poseEase=travel*travel*(3-2*travel);
    f.entry.root.position.lerpVectors(f.start,dest,poseEase);
    const clearance=Math.max(f.start.y,dest.y+1.5*left.scale.x);
    f.entry.root.position.y=t<.65?THREE.MathUtils.lerp(f.start.y,clearance,poseEase):THREE.MathUtils.lerp(clearance,dest.y,((t-.65)/.35)**2);
   }else{f.entry.root.position.lerpVectors(f.start,dest,e);f.entry.root.position.y+=Math.sin(Math.PI*t)*1.55;}
f.entry.root.quaternion.slerpQuaternions(f.startQ,targetQ,poseEase);if(f.mode==='eject')f.entry.root.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,2*Math.PI*t,.45*Math.sin(Math.PI*t))));f.entry.root.scale.setScalar(THREE.MathUtils.lerp(f.startScale,targetScale,poseEase));f.entry.root.scale.z*=THREE.MathUtils.lerp(f.startDepthScale??1,targetDepthScale,poseEase);f.entry.model.position.lerpVectors(f.startModelPos,f.mode==='eject'?f.entry.modelPos:f.entry.packedOffset,poseEase);f.entry.model.quaternion.slerpQuaternions(f.startModelQ,f.mode==='eject'?f.entry.modelQ:identityQ,poseEase);
   if(t===1){if(f.mode==='eject'){right.attach(f.entry.root);f.entry.root.position.copy(f.drop);f.entry.root.quaternion.copy(f.entry.homeQ);f.entry.root.scale.setScalar(.7);f.entry.bounceTime=now;}else{const d=drawers[f.entry.drawer],slot=f.entry.slot;d.group.attach(f.entry.root);f.entry.root.position.set(slot.x,slot.y,slot.z);f.entry.root.rotation.set(0,0,0);f.entry.root.scale.set(slot.scale,slot.scale,slot.scale*(slot.depthScale??1));}flights.delete(id);needsFrames=80;f.resolve();}
  });
  renderInstances();renderer.render(scene,camera);syncPins();
 }
 frame=requestAnimationFrame(animate);
 const raycaster=new THREE.Raycaster();function hit(x,y){if(dragging||Math.abs(angle-targetAngle)>.035)return{cabinet:true};const rect=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),camera);const hits=raycaster.intersectObjects([...batches,left,right],true);let drawerHit=null,cabinetHit=false;
  for(const h of hits){if(h.instanceId!==undefined&&h.object.userData.ids){const id=h.object.userData.ids[h.instanceId],entry=entries.get(id);if(flights.has(id))continue;if(entry.packed){if(drawerFace(entry.drawer)!==currentFace)continue;if(entry.drawer!==active)return{drawer:entry.drawer};return{packed:id,drawer:entry.drawer};}return{item:id};}
   let o=h.object;while(o){if(o.userData.drawerIndex!==undefined&&drawerFace(o.userData.drawerIndex)===currentFace){drawerHit??=o.userData.drawerIndex;if(!h.object.material?.transparent)return{drawer:drawerHit};break;}if(o.userData.cabinet)cabinetHit=true;o=o.parent;}if(h.object===table)break;
  }return drawerHit!==null?{drawer:drawerHit}:cabinetHit?{cabinet:true}:null;
 }
 // Read-only geometry diagnostics use the same model matrices as the GPU instances.
 function geometrySnapshot(){
  scene.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(turret.matrixWorld).invert(),packed=[],errors=[];
  for(const e of entries.values())if(e.packed&&!flights.has(e.id)){
   const transform=new THREE.Matrix4().multiplyMatrices(e.root.matrixWorld,e.model.matrix),box=templates.get(e.type).box.clone();
   const local=box.clone().applyMatrix4(new THREE.Matrix4().copy(drawers[e.drawer].group.matrixWorld).invert().multiply(transform));
   const world=box.clone().applyMatrix4(inverse.clone().multiply(transform));packed.push({id:e.id,drawer:e.drawer,box:world});
   const d=drawers[e.drawer];
   if(local.min.x < -d.width/2+.035 || local.max.x > d.width/2-.035 || local.min.z < -d.depth/2+.035 || local.max.z > d.depth/2-.035 || local.min.y < .065*d.height)errors.push({kind:'wall',id:e.id,drawer:e.drawer});
   for(const divider of d.dividerMeshes)if(divider.visible){divider.geometry.computeBoundingBox();const b=box.clone().applyMatrix4(new THREE.Matrix4().copy(divider.matrixWorld).invert().multiply(transform));if(b.intersectsBox(divider.geometry.boundingBox))errors.push({kind:'divider',id:e.id,drawer:e.drawer});}
   drawers.forEach((other,index)=>{if(index===e.drawer)return;const b=box.clone().applyMatrix4(new THREE.Matrix4().copy(other.basket.matrixWorld).invert().multiply(transform));if(b.intersectsBox(drawerBounds))errors.push({kind:'other-drawer',id:e.id,drawer:e.drawer,other:index});});
   turret.traverse(o=>{if(!o.isMesh||!o.userData.cabinet)return;o.geometry.computeBoundingBox();const b=box.clone().applyMatrix4(new THREE.Matrix4().copy(o.matrixWorld).invert().multiply(transform));if(b.intersectsBox(o.geometry.boundingBox))errors.push({kind:'frame',id:e.id,drawer:e.drawer});});
  }
  for(let i=0;i<packed.length;i++)for(let j=i+1;j<packed.length;j++)if(packed[i].box.intersectsBox(packed[j].box))errors.push({kind:'items',ids:[packed[i].id,packed[j].id]});
  return {errors,packed:packed.map(p=>({id:p.id,drawer:p.drawer,min:p.box.min.toArray(),max:p.box.max.toArray()})),sizes:Object.fromEntries(measuredSizes)};
 }
 return{geometrySnapshot,choose,pack,eject,restore,hit,rotate,dragRotate,snapRotation,face:()=>currentFace,isTurning:()=>dragging||Math.abs(angle-targetAngle)>.035,hover:id=>{if(hover===id)return;hover=id;needsFrames=50;},snapshot:()=>({active,face:currentFace,angle,targetAngle,capacity:DRAWER_CAPACITY,flights:flights.size,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,drawers:drawers.map(d=>({open:d.group.position.z,width:d.width,depth:d.depth,groups:d.layout.dividers.length+Number(d.layout.positions.size>0)})),slots:allRecords.map(r=>({id:r.id,drawer:r.drawer,...drawers[r.drawer].layout.positions.get(r.id)}))}),dispose:()=>{cancelAnimationFrame(frame);observer.disconnect();renderer.dispose();env.dispose();}};
}
