import {animationAssets,frameAt} from './battle-animation.js?v=20261018-grid14';
import {SENDOUT_FRAMES as F} from './capture-source.js?v=20261016-capture3';
export function createSendoutAnimator(){
 let ticket=0,stop=null;
 function cancel(){ticket++;stop?.();stop=null}
 async function play(scene,event,release){
  cancel();const serial=ticket,which=event.actor==='enemy'?'enemy':'player';const target=scene.querySelector('.'+which+'-mon');if(!event.recall)target.style.visibility='hidden';const incoming=new Image();incoming.src=`assets/battle/${event.after[which].species}-${which==='player'?'back':'front'}.png?v=20261016-capture3`;await incoming.decode().catch(()=>{});let assets;try{assets=await animationAssets()}catch{}if(serial!==ticket||!scene.isConnected)return;
  await target.decode().catch(()=>{});if(serial!==ticket||!scene.isConnected)return;
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=96;canvas.className='battle-fx sendout-fx';canvas.setAttribute('aria-hidden','true');scene.append(canvas);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,recall=event.recall?F.recall:0,totalFrames=recall+F.poof+F.enter,total=reduced?240:totalFrames*1000/60;
  let released=false,previous='',finished=false;target.style.animation='none';target.style.transformOrigin='50% 95%';
  const finish=()=>{if(finished)return;finished=true;canvas.remove();target.style.transform='';target.style.opacity='';target.style.filter='';target.style.visibility='';target.style.animation='';target.style.transformOrigin='';delete scene.dataset.sendoutPhase;stop=null};
  return new Promise(resolve=>{
   stop=()=>{finish();resolve()};const start=performance.now();
   const draw=now=>{if(serial!==ticket||!scene.isConnected){finish();resolve();return}
    const p=Math.max(0,Math.min(1,(now-start)/total)),frame=p*totalFrames,phase=frame<recall?'recall':frame<recall+F.poof?'poof':'enter';
    if(phase!==previous){previous=phase;scene.dataset.sendoutPhase=phase;scene.dispatchEvent(new CustomEvent('sendout-animation-phase',{bubbles:true,detail:{phase,recall:event.recall}}))}
    ctx.clearRect(0,0,160,96);
    if(frame<recall){const q=frame/recall;target.style.opacity=String(1-q*.6);if(!reduced){target.style.filter='brightness(1.5)';target.style.transform=`scale(${q<.25?1:q<.5?.66:q<.75?.44:.22})`}}
    else{
     if(!released){released=true;target.style.visibility='hidden';release()}
     const local=frame-recall,progress=Math.max(0,Math.min(1,(local-F.poof)/F.enter));
     target.style.filter='';target.style.opacity=String(reduced?progress:1);target.style.visibility=local<F.poof?'hidden':'';
     if(!reduced)target.style.transform=`scale(${progress<.3?.25:progress<.65?.5:1})`;
     const def=assets?.manifest.ballPoof,im=assets?.images.ballPoof;
     if(def&&im&&local<12){const r=target.getBoundingClientRect(),s=scene.getBoundingClientRect(),x=(r.left+r.width/2-s.left)/s.width*160,y=(r.bottom-s.top)/s.height*96-5,index=frameAt(def,local*1000/60);if(index>=0)ctx.drawImage(im,index*128,0,128,128,Math.round(x-64),Math.round(y-64),128,128)}
    }
    if(p<1)requestAnimationFrame(draw);else{if(!released)release();finish();resolve()}
   };requestAnimationFrame(draw);
  });
 }
 return {play,cancel};
}
