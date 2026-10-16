// Outdoors in Gen II uses SpinToBlack: twenty clockwise, tile-stepped wedges.
// The field is not physically rotated; the black mask sweeps over it.
const REV='20261016-skills1';
let dataPromise;
export function transitionData(){return dataPromise??=fetch(`assets/transition-spin.json?v=${REV}`).then(r=>{if(!r.ok)throw Error('Transition data unavailable');return r.json()})}
export function tilesThrough(data,count){const set=new Set();for(const f of data.frames.slice(0,count))for(const tile of f.tiles)set.add(tile);return [...set]}
export function createEncounterTransition(container){let active=false,token=0,overlay=null,resolveWait=null;
 const emit=(name,detail={})=>container.dispatchEvent(new CustomEvent('encounter-transition-'+name,{bubbles:true,detail}));
 function cancel(){token++;active=false;overlay?.remove();overlay=null;resolveWait?.();resolveWait=null;container.removeAttribute('aria-busy')}
 async function play(source,{onCovered,onReveal=()=>{},onDone=()=>{}}){if(active)return false;active=true;const run=++token;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;container.setAttribute('aria-busy','true');overlay=document.createElement('canvas');overlay.id='encounter-transition';overlay.width=160;overlay.height=144;overlay.setAttribute('aria-hidden','true');overlay.dataset.phase=reduced?'fade':'pulse';container.append(overlay);const canvas=overlay,ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const snapshot=document.createElement('canvas');snapshot.width=160;snapshot.height=144;const sc=snapshot.getContext('2d');sc.imageSmoothingEnabled=false;
 let covered=false;const revealBattle=async()=>{if(covered||run!==token)return;covered=true;canvas.dataset.phase='black';ctx.fillStyle='#08100d';ctx.fillRect(0,0,160,144);emit('covered');await onCovered();};
 emit('start',{reduced});
 const tween=(duration,draw)=>new Promise(resolve=>{resolveWait=resolve;const start=performance.now();const frame=now=>{if(run!==token){resolve();return}const p=Math.min(1,(now-start)/duration);draw(p);if(p<1)requestAnimationFrame(frame);else{resolveWait=null;resolve()}};requestAnimationFrame(frame)});
 try{
  // Let the field renderer paint the exact grass step that triggered the battle.
  await new Promise(requestAnimationFrame);if(run!==token)return false;sc.drawImage(source,0,0,160,144);ctx.drawImage(snapshot,0,0);
  if(reduced){await tween(180,p=>{ctx.drawImage(snapshot,0,0);ctx.fillStyle=`rgba(8,16,13,${p})`;ctx.fillRect(0,0,160,144)});}
  else{
   const data=await transitionData();if(run!==token)return false;
   // Gentle palette-like pulses instead of high-contrast full-white flashes.
   await tween(1080,p=>{ctx.drawImage(snapshot,0,0);const wave=Math.sin(p*Math.PI*3);ctx.fillStyle=wave>=0?`rgba(8,16,13,${wave*.38})`:`rgba(245,248,223,${-wave*.38})`;ctx.fillRect(0,0,160,144)});
   if(run!==token)return false;canvas.dataset.phase='spin';emit('spin');let previous=-1;
   await tween(900,p=>{const count=Math.min(20,Math.floor(p*20)+1);if(count===previous)return;previous=count;ctx.drawImage(snapshot,0,0);ctx.fillStyle='#08100d';for(const tile of tilesThrough(data,count))ctx.fillRect(tile%20*8,Math.floor(tile/20)*8,8,8);canvas.dataset.frame=String(count)});
  }
  if(run!==token)return false;await revealBattle();if(run!==token)return false;
  await tween(reduced?40:100,()=>{});if(run!==token)return false;canvas.dataset.phase='reveal';onReveal();emit('reveal');await tween(reduced?120:240,p=>{canvas.style.opacity=String(1-p)});
  return true;
 }catch{if(run===token)await revealBattle();return false;}
 finally{if(run===token){canvas.remove();overlay=null;active=false;container.removeAttribute('aria-busy');emit('end');onDone();}}
 }
 return {play,cancel,active:()=>active};
}
