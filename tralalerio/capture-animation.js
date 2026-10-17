import {animationAssets,frameAt} from './battle-animation.js?v=20261018-violet15';
import {CAPTURE_FRAMES as F} from './capture-source.js?v=20261016-capture3';
const fps=60,clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,q)=>a+(b-a)*q;
export function captureTimeline(event){
 let cursor=0;const phases=[];const add=(name,frames,extra={})=>{phases.push({name,start:cursor,end:cursor+frames,...extra});cursor+=frames};
 for(const name of ['throw','open','poof','absorb','close','bounce','settle'])add(name,F[name]);
 // The original script checks every 48 frames. A passed check then starts a
 // 35-frame left/right wobble; the rest of the interval is a stationary pause.
 add('wait',F.check);
 for(let i=0;i<event.shakes;i++){add('shake',F.wobble,{shake:i+1});add('wait',F.check-F.wobble)}
 add(event.caught?'caught':'escape',event.caught?F.lock:F.escape);
 return {phases,frames:cursor};
}
export function capturePhaseAt(event,frame){const timeline=captureTimeline(event);return timeline.phases.find(p=>frame<p.end)||timeline.phases.at(-1)}
function targetPoint(scene){const im=scene.querySelector('.enemy-mon'),s=scene.getBoundingClientRect(),r=im.getBoundingClientRect();return {x:(r.left+r.width/2-s.left)/s.width*160,y:(r.top+r.height/2-s.top)/s.height*96,ground:Math.min(85,(r.bottom-s.top)/s.height*96-2)}}
// A closed ball persists after success, including on a restored finished battle.
export function showCaughtBall(scene){
 scene.classList.add('capture-complete');scene.querySelector('.enemy-mon').style.visibility='hidden';
 const ball=document.createElement('span');ball.className='caught-ball';ball.setAttribute('aria-label','몬스터가 잡힌 몬스터볼');const t=targetPoint(scene);ball.style.left=t.x/160*100+'%';ball.style.top=t.ground/96*100+'%';scene.append(ball);
 animationAssets().then(({images})=>{if(!scene.isConnected)return;const canvas=document.createElement('canvas');canvas.width=160;canvas.height=96;canvas.className='caught-ball-art';const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(images.ballClosed,0,0,128,128,Math.round(t.x-64),Math.round(t.ground-66),128,128);scene.append(canvas);ball.remove()}).catch(()=>{});
}
export function createCaptureAnimator(){
 let ticket=0,stop=null;
 function cancel(){ticket++;stop?.();stop=null}
 async function play(scene,event){
  cancel();const serial=ticket;let assets;try{assets=await animationAssets()}catch{assets=null}if(serial!==ticket||!scene.isConnected)return;
  await scene.querySelector('.enemy-mon').decode().catch(()=>{});if(serial!==ticket||!scene.isConnected)return;
  const target=scene.querySelector('.enemy-mon'),point=targetPoint(scene);
  const x=point.x,y=point.y,ground=point.ground;
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=96;canvas.className='battle-fx capture-fx';canvas.setAttribute('aria-hidden','true');scene.append(canvas);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const timeline=captureTimeline(event),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,total=reduced?900:timeline.frames/fps*1000;
  let previous='',previousShake=0,finished=false;
  const emit=(phase,shake=0)=>scene.dispatchEvent(new CustomEvent('capture-animation-phase',{bubbles:true,detail:{phase,shake,caught:event.caught,shakes:event.shakes}}));
  const finish=()=>{if(finished)return;finished=true;canvas.remove();target.style.transform='';target.style.filter='';target.style.opacity='';target.style.transformOrigin='';target.style.visibility=event.caught?'hidden':'';delete scene.dataset.capturePhase;delete scene.dataset.captureShake;stop=null};
  function fallbackBall(bx,by,open=false){ctx.fillStyle='#22352c';ctx.fillRect(bx-4,by-4,8,8);ctx.fillStyle='#e85c49';ctx.fillRect(bx-3,by-3,6,3);ctx.fillStyle='#fff6d7';ctx.fillRect(bx-3,by+1,6,2);if(open){ctx.clearRect(bx-4,by-1,8,2)}else{ctx.fillStyle='#fff';ctx.fillRect(bx-1,by-1,2,2)}}
  function stamp(key,bx,by,ms=0){
   const def=assets?.manifest[key],im=assets?.images[key];if(!def||!im){if(key!=='ballPoof')fallbackBall(Math.round(bx),Math.round(by),['ballOpen','ballContact'].includes(key));return}
   const length=def.timeline.reduce((n,f)=>n+f.frames,0)*1000/60;
   const index=frameAt(def,def.loop?ms:Math.min(ms,Math.max(0,length-1)));if(index<0)return;
   ctx.drawImage(im,index*128,0,128,128,Math.round(bx-64),Math.round(by-66),128,128);
  }
  return new Promise(resolve=>{
   stop=()=>{finish();resolve()};const started=performance.now();
   const draw=now=>{
    if(serial!==ticket||!scene.isConnected){finish();resolve();return}
    const progress=clamp((now-started)/total),frame=progress*timeline.frames;
    const phase=capturePhaseAt(event,frame),local=clamp((frame-phase.start)/(phase.end-phase.start));
    if(phase.name!==previous||(phase.shake||0)!==previousShake){previous=phase.name;previousShake=phase.shake||0;scene.dataset.capturePhase=phase.name;scene.dataset.captureShake=String(previousShake);emit(phase.name,previousShake)}
    ctx.clearRect(0,0,160,96);
    target.style.opacity='1';target.style.visibility='';target.style.transform='';target.style.filter='';
    const hidden=['close','bounce','settle','wait','shake','caught'].includes(phase.name);if(hidden)target.style.visibility='hidden';
    if(reduced){
     if(phase.name==='absorb')target.style.opacity=String(1-local);
     if(phase.name==='escape'){target.style.opacity=String(local)}
     stamp(phase.name==='escape'?'ballOpen':'ballClosed',x,ground);
    }else if(phase.name==='throw'){
     stamp('ball',mix(36,x,local),mix(78,y,local)-Math.sin(local*Math.PI)*40,(frame-phase.start)*1000/fps);
    }else if(['open','poof'].includes(phase.name)){
     stamp('ballContact',x,y);if(phase.name==='poof')stamp('ballPoof',x,y,(frame-phase.start)*1000/fps);
    }else if(phase.name==='absorb'){
     const scale=1-local;
     target.style.transformOrigin='50% 50%';target.style.transform=`scale(${scale})`;target.style.opacity=String(1-local*.7);target.style.filter='brightness(1.7) sepia(.5)';stamp('ballContact',x,y);
    }else if(phase.name==='close'){
     stamp('ballClosed',x,y);
    }else if(phase.name==='bounce'){
     // Four original 32-frame bounces, with amplitudes 16,12,8,4.
     const f=frame-phase.start,hop=Math.min(3,Math.floor(f/32)),q=(f%32)/32;
     const settling=clamp(f/32),base=mix(y,ground,settling);
     stamp('ballClosed',x,base-Math.abs(Math.sin(q*Math.PI))*(16-hop*4));
    }else if(phase.name==='shake'){
     stamp('ballWobble',x,ground,(frame-phase.start)*1000/fps);
    }else if(phase.name==='escape'){
     stamp('ballOpen',x,ground);stamp('ballPoof',x,ground,(frame-phase.start)*1000/fps);
     target.style.transformOrigin='50% 80%';target.style.transform=`scale(${local})`;target.style.opacity=String(local);
    }else{
     if(phase.name==='caught'){ctx.filter='brightness(.65)';stamp('ballClosed',x,ground);ctx.filter='none'}else stamp('ballClosed',x,ground);
    }
    if(progress<1)requestAnimationFrame(draw);else{finish();resolve()}
   };requestAnimationFrame(draw);
  });
 }
 return {play,cancel};
}
