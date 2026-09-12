// Short, non-melodic contact sounds, synthesized locally with no audio downloads.
// Noise transients, low resonances and small rebounds vary with the object material.
export function makeFoley(kind='place',type='milk',rate=44100,seed=1){
 const profiles={milk:[145,430,.045,.42],soda:[310,1270,.027,.72],apple:[83,205,.036,.18],orange:[75,185,.031,.16],yogurt:[235,720,.030,.55],egg:[185,520,.024,.38]};
 const [low,high,decay,crisp]=profiles[type]||profiles.milk;
 const opening=kind==='drawer-open',closing=kind==='drawer-close';
 const duration=opening?.68:closing?.55:kind==='drawer'?.36:kind==='arrange'?.23:kind==='lift'?.13:kind==='throw'?.20:kind==='drop'?.36:.25;
 const data=new Float32Array(Math.ceil(rate*duration));let randState=seed>>>0,brown=0,previous=0;
 const rand=()=>{randState=(Math.imul(randState,1664525)+1013904223)>>>0;return randState/4294967296*2-1;};
 function impact(t,weight=1){if(t<0)return 0;const attack=Math.min(1,t/.0013),noise=rand();return weight*attack*(Math.sin(2*Math.PI*low*t)*Math.exp(-t/decay)*.20+Math.sin(2*Math.PI*high*t)*Math.exp(-t/(decay*.32))*.025*crisp+noise*Math.exp(-t/.007)*(.16+.1*crisp));}
 for(let i=0;i<data.length;i++){const t=i/rate,n=rand();brown=.88*brown+.12*n;const airy=n-previous;previous=n;let s=0;
  if(opening||closing){
   // Handle release, textured bearing roll, then the soft rail stop. The roll
   // slows with the drawer's easing instead of sounding like an object drop.
   const travel=opening?.50:.37,f=Math.min(1,t/travel);
   const motion=Math.min(1,t/.018)*Math.exp(-t/.28)*Math.max(0,1-f)**.35;
   const bearings=.76+.24*Math.sin(2*Math.PI*(48*t-25*t*t));
   s=(brown*.62+airy*.025)*motion*bearings;
   s+=impact(t-.004,opening?.70:.24)+impact(t-.033,.15);
   s+=impact(t-travel,opening?.38:.85)+impact(t-travel-.035,.10);
  }
  else if(kind==='drawer'){const f=t/duration;s=brown*Math.sin(Math.PI*f)**1.5*.13+airy*(.018+.014*Math.sin(2*Math.PI*37*t))*Math.sin(Math.PI*f);s+=impact(t-.29,.48);}
  else if(kind==='lift'||kind==='throw'){const f=t/duration;s=(brown*.10+airy*.007)*Math.sin(Math.PI*f)**2*(kind==='throw'?1:.58);}
  else if(kind==='arrange'){s=brown*Math.sin(Math.PI*t/duration)**2*.08+impact(t-.027,.30)+impact(t-.097,.23)+impact(t-.162,.14);}
  else {s=impact(t,kind==='drop'?1.22:1)+impact(t-.065,kind==='drop'?.32:.13)+impact(t-.137,kind==='drop'?.12:.055);s+=brown*Math.exp(-t/.07)*.023;}
  data[i]=Math.max(-.8,Math.min(.8,s));
 }
 return data;
}
export function createFoley(enabled=true){
 let ctx,master,serial=0,lastArrange=-1;const cache=new Map();
 function init(){if(ctx)return;ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=enabled?.85:0;const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-15;compressor.knee.value=12;compressor.ratio.value=4;compressor.attack.value=.002;compressor.release.value=.12;master.connect(compressor);compressor.connect(ctx.destination);}
 return {setEnabled(value){enabled=value;if(ctx){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(value?.85:0,ctx.currentTime,.008);}},play(kind='place',type='milk',delay=0){if(!enabled)return;try{init();ctx.resume().catch(()=>{});if(kind==='arrange'&&ctx.currentTime-lastArrange<.10)return;if(kind==='arrange')lastArrange=ctx.currentTime;const variant=serial++%4,key=`${kind}:${type}:${variant}`;let buffer=cache.get(key);if(!buffer){const pcm=makeFoley(kind,type,ctx.sampleRate,variant+73);buffer=ctx.createBuffer(1,pcm.length,ctx.sampleRate);buffer.copyToChannel(pcm,0);cache.set(key,buffer);}const source=ctx.createBufferSource();source.buffer=buffer;source.playbackRate.value=.97+(serial%7)*.01;source.connect(master);source.start(ctx.currentTime+delay);source.onended=()=>source.disconnect();}catch{}},state:()=>({enabled,initialized:!!ctx,plays:serial})};
}
