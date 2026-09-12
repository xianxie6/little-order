import './studio.css';
import { createStudio } from './studio-scene.js';
import { createFoley } from './foley.js';
import { foods,items,itemById,cleanRecords,drawerFace,DRAWER_COUNT,DRAWER_CAPACITY } from './storage-layout.js';
const $=s=>document.querySelector(s);
let records=[],active=-1,sound=true,studio,flights=0,before=false;
const movingIds=new Set(),undoStack=[];
try{const saved=JSON.parse(localStorage.getItem('little-order-free-v2'));records=cleanRecords(saved?.records);if(typeof saved?.sound==='boolean')sound=saved.sound;}catch{}
const foley=createFoley(sound);
const svg=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
$('#app').innerHTML=`<main class="playground"><div class="stage" id="stage"><canvas id="scene" aria-label="收纳柜与堆满物品的桌面"></canvas><div class="interaction-layer">${Array.from({length:DRAWER_COUNT},(_,i)=>`<button class="drawer-target" data-drawer="${i}" aria-label="打开第 ${i+1} 个抽屉" aria-pressed="false" disabled></button>`).join('')}${items.map(item=>`<button class="item-target" data-item="${item.id}" aria-label="收纳${foods.find(f=>f.type===item.type).name}，第 ${Number(item.id.split('-')[1])+1} 件" disabled></button>`).join('')}</div><div class="loading" id="loading" role="status" aria-label="正在加载"><span class="spinner"></span><div class="loading-track"><i id="loading-progress"></i></div></div><div class="completion" id="completion" hidden><button id="admire">合上抽屉</button><button id="compare">收纳前</button><button id="replay">再来一次</button></div><button id="return-now" class="return-now" hidden>收纳后</button></div><nav class="toolbar" aria-label="收纳操作"><button id="undo" disabled>${svg('<path d="m8 5-5 5 5 5M3 10h11a6 6 0 0 1 0 12" transform="translate(1 -2)"/>')}<span>撤回</span></button><button id="reset" disabled>${svg('<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>')}<span>重来</span></button><i class="toolbar-rule"></i><button id="close-drawer" disabled>${svg('<path d="M4 9h16v11H4zM8 13h8m-4-4V2M8 6l4-4 4 4"/>')}<span>合上</span></button><button id="sound" aria-pressed="true">${svg('<path d="m11 5-5 4H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>')}<span>声音开</span></button><button id="rotate-left" aria-label="向左旋转柜子">${svg('<path d="M8 4 3 9l5 5M3 9h10a7 7 0 0 1 0 14"/>')}<span>左转</span></button><button id="rotate-right" aria-label="向右旋转柜子">${svg('<path d="m16 4 5 5-5 5m5-5H11a7 7 0 0 0 0 14"/>')}<span>右转</span></button><button id="fullscreen">${svg('<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>')}<span>全屏</span></button><div class="progress-track" role="progressbar" aria-label="收纳进度" aria-valuemin="0" aria-valuemax="${items.length}" aria-valuenow="0"><span id="progress-fill"></span></div></nav><div class="sr-only" id="announcer" aria-live="polite"></div></main><dialog id="reset-dialog"><button id="cancel-reset">继续收纳</button><button id="confirm-reset">重新开始</button></dialog>`;
function save(){try{localStorage.setItem('little-order-free-v2',JSON.stringify({records,sound}));}catch{}}
function remember(){undoStack.push({records:records.map(r=>({...r})),active});if(undoStack.length>80)undoStack.shift();}
function update(){const complete=records.length===items.length;
 $('#undo').disabled=!studio||(!records.length&&!undoStack.length)||flights>0||before;$('#reset').disabled=!studio||!records.length||flights>0;$('#close-drawer').disabled=!studio||active<0||before;
 $('#rotate-left').disabled=$('#rotate-right').disabled=!studio||before||!!flights;$('#sound').setAttribute('aria-pressed',sound);$('#sound span').textContent=sound?'声音开':'声音关';$('#completion').hidden=!complete||!!flights||before;$('#return-now').hidden=!before;
 $('#progress-fill').style.width=`${records.length/items.length*100}%`;$('.progress-track').setAttribute('aria-valuenow',records.length);
 document.querySelectorAll('[data-drawer]').forEach((el,i)=>{el.disabled=!studio||before||drawerFace(i)!==(studio?.face()??0);el.setAttribute('aria-pressed',i===active);el.setAttribute('aria-label',`${i===active?'合上':'打开'}第 ${i+1} 个抽屉`);el.classList.toggle('is-active',i===active);});
 document.querySelectorAll('[data-item]').forEach(el=>{const r=records.find(r=>r.id===el.dataset.item),item=itemById.get(el.dataset.item);el.disabled=!studio||movingIds.has(item.id)||before||!!r&&r.drawer!==active;el.setAttribute('aria-label',`${r?'扔回桌面':'收纳'}${foods.find(f=>f.type===item.type).name}，第 ${Number(item.id.split('-')[1])+1} 件`);});
}
function choose(i){if(!studio||before||studio.isTurning())return;active=i===active?-1:i;studio.choose(active);foley.play(active<0?'drawer-close':'drawer-open');update();}
async function collect(id){if(!studio||before||studio.isTurning()||movingIds.has(id)||records.some(r=>r.id===id)||!itemById.has(id))return;if(active<0){$('.interaction-layer').classList.remove('invite');void $('.interaction-layer').offsetWidth;$('.interaction-layer').classList.add('invite');$('#announcer').textContent='先打开任意一个抽屉';return;}
 const item=itemById.get(id),drawer=active;
 if(records.filter(r=>r.drawer===drawer).length>=DRAWER_CAPACITY){const el=$(`[data-drawer="${drawer}"]`);el.classList.remove('is-full');void el.offsetWidth;el.classList.add('is-full');$('#announcer').textContent='抽屉已满，请打开另一个抽屉';return;}
 remember();records.push({id,drawer});movingIds.add(id);flights++;foley.play('lift',item.type);save();update();await studio.pack(id,drawer,records);movingIds.delete(id);flights--;update();foley.play('place',item.type);if(records.filter(r=>r.drawer===drawer).length>1)foley.play('arrange',item.type,.065);$('#announcer').textContent=`已收纳 ${records.length} 件，共 ${items.length} 件`;
}
async function eject(id){
 const record=records.find(r=>r.id===id);if(!studio||before||!record||movingIds.has(id))return;
 remember();if(active!==record.drawer){active=record.drawer;studio.choose(active);foley.play('drawer-open');}
 const item=itemById.get(id);records=records.filter(r=>r.id!==id);movingIds.add(id);flights++;save();update();foley.play('throw',item.type);if(records.some(r=>r.drawer===record.drawer))foley.play('arrange',item.type,.12);
 await studio.eject(id,records);movingIds.delete(id);flights--;update();foley.play('drop',item.type);$('#announcer').textContent='物品已扔回桌面';
}
function actOnItem(id){if(records.some(r=>r.id===id))eject(id);else collect(id);}
function reset(){if(flights)return;records=[];active=-1;before=false;undoStack.length=0;studio.restore(records);studio.choose(-1);save();update();$('#reset-dialog').close();}
$('.interaction-layer').addEventListener('click',e=>{if(suppressClick)return;const drawer=e.target.closest('[data-drawer]'),item=e.target.closest('[data-item]');if(drawer){const h=e.detail?studio?.hit(e.clientX,e.clientY):null;if(h?.packed)eject(h.packed);else choose(h?.drawer??Number(drawer.dataset.drawer));}else if(item)actOnItem(item.dataset.item);});
$('.interaction-layer').addEventListener('focusin',e=>{if(e.target.dataset.item){studio?.hover(e.target.dataset.item);if(matchMedia('(max-width:740px)').matches)e.target.scrollIntoView({block:'center'});}});
$('.interaction-layer').addEventListener('focusout',()=>studio?.hover(null));
$('#scene').addEventListener('click',e=>{if(suppressClick)return;const h=studio?.hit(e.clientX,e.clientY);if(h?.packed)eject(h.packed);else if(h?.item)collect(h.item);else if(h?.drawer!==undefined)choose(h.drawer);});
let lastHover=0;$('#stage').addEventListener('pointermove',e=>{if(dragTurn||e.pointerType==='touch'||performance.now()-lastHover<70)return;lastHover=performance.now();const h=studio?.hit(e.clientX,e.clientY);studio?.hover(h?.packed||h?.item||null);$('#scene').style.cursor=h?'pointer':'default';});
$('#scene').addEventListener('pointerleave',()=>studio?.hover(null));
function rotate(direction){if(!studio||before||flights)return;active=-1;studio.rotate(direction);foley.play('drawer');update();}
$('#rotate-left').onclick=()=>rotate(-1);$('#rotate-right').onclick=()=>rotate(1);
let dragTurn=null,suppressClick=false;
$('#stage').addEventListener('pointerdown',e=>{if(!studio||before||flights||e.button!==0||e.target.closest('.completion,.return-now'))return;const h=studio.hit(e.clientX,e.clientY);if(e.target.closest('[data-drawer]')||h?.drawer!==undefined||h?.packed||h?.cabinet)dragTurn={pointer:e.pointerId,x:e.clientX,last:e.clientX,started:false};});
window.addEventListener('pointermove',e=>{if(!dragTurn||e.pointerId!==dragTurn.pointer)return;if(!dragTurn.started&&Math.abs(e.clientX-dragTurn.x)>9){dragTurn.started=true;active=-1;studio.choose(-1);update();}if(dragTurn.started){e.preventDefault();studio.dragRotate((e.clientX-dragTurn.last)*.008);dragTurn.last=e.clientX;}},{passive:false});
function endTurn(){if(!dragTurn)return;if(dragTurn.started){studio.snapRotation();suppressClick=true;setTimeout(()=>suppressClick=false,0);update();}dragTurn=null;}
window.addEventListener('pointerup',endTurn);window.addEventListener('pointercancel',endTurn);
$('#close-drawer').onclick=()=>choose(active);
$('#undo').onclick=()=>{if(flights)return;const previous=undoStack.pop();if(previous){records=previous.records;active=previous.active;}else{const entry=records.pop();if(!entry)return;active=entry.drawer;}studio.restore(records);studio.choose(active);save();update();foley.play('arrange');};
$('#reset').onclick=()=>$('#reset-dialog').showModal();$('#cancel-reset').onclick=()=>$('#reset-dialog').close();$('#confirm-reset').onclick=reset;$('#replay').onclick=reset;
$('#sound').onclick=()=>{sound=!sound;foley.setEnabled(sound);save();update();if(sound)foley.play('place');};
$('#admire').onclick=()=>{active=-1;studio.choose(-1);update();};$('#compare').onclick=()=>{before=true;active=-1;studio.choose(-1);studio.restore([]);update();};$('#return-now').onclick=()=>{before=false;studio.restore(records);update();};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{}};
if(!document.fullscreenEnabled)$('#fullscreen').hidden=true;
document.addEventListener('fullscreenchange',()=>$('#fullscreen span').textContent=document.fullscreenElement?'退出全屏':'全屏');
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('dialog[open]')&&active>=0)choose(active);});
update();
try{studio=await createStudio({canvas:$('#scene'),stage:$('#stage'),foods,items,onFaceChange:()=>{if(active>=0&&drawerFace(active)!==(studio?.face()??0))active=-1;update();},onLoad:p=>$('#loading-progress').style.width=`${p*100}%`});studio.restore(records);update();$('#loading').classList.add('ready');setTimeout(()=>$('#loading').hidden=true,350);}catch(error){console.error(error);$('#loading').innerHTML='<button onclick="location.reload()">重新加载</button>';}
$('#scene').addEventListener('webglcontextlost',e=>{e.preventDefault();$('#loading').hidden=false;$('#loading').classList.remove('ready');$('#loading').innerHTML='<button onclick="location.reload()">刷新继续</button>';});
window.__studio={geometry:()=>studio?.geometrySnapshot(),pick:(x,y)=>studio?.hit(x,y),ready:()=>!!studio,state:()=>({records:records.map(r=>({...r})),placed:records.map(r=>r.id),total:items.length,active,flights,sound,before,audio:foley.state(),...studio?.snapshot()})};
