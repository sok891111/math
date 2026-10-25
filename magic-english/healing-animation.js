export function healingTimeline(count,frames={take:20,turn:10,perBall:30,flashes:8,perFlash:10,return:30,face:10,bowUp:10,bowDown:10}){
 let at=0;const phases=[];const add=(phase,length,balls=0,cycle=0)=>{phases.push({phase,start:at,end:at+length,balls,cycle});at+=length};
 add('take',frames.take);add('turn',frames.turn);
 for(let n=1;n<=count;n++)add('load',frames.perBall,n);
 for(let n=0;n<frames.flashes;n++)add('restore',frames.perFlash,count,(n+1)%4);
 add('return',frames.return,count);add('face',frames.face,count);add('bow-up',frames.bowUp);add('bow-down',frames.bowDown);
 return {phases,frames:at};
}
export function healingFrameAt(count,frame,frames){const t=healingTimeline(count,frames);return t.phases.find(p=>frame<p.end)||t.phases.at(-1)}
export function createHealingAnimation(container){
 let source,images,promise,active=false,snapshot=null,context=null,buffer=null,muted=false,finished=null;
 const status=document.createElement('div');status.id='healing-status';status.hidden=true;status.setAttribute('role','status');const copy=document.createElement('span');status.append(copy);container.append(status);
 let audioBytes,output,globalMuted=false,globalVolume=.4;
 document.addEventListener('game-audio-setting',e=>{globalMuted=e.detail.muted;globalVolume=e.detail.volume;if(output)output.gain.value=globalVolume;if(context)context[muted||globalMuted?'suspend':'resume']().catch(()=>{})});
 function prepare(){return promise??=(async()=>{const r=await fetch('assets/healing/source.json?v=20261018-table19');if(!r.ok)throw Error('회복 자산을 읽지 못했어요');source=await r.json();images=await Promise.all([0,1,2,3].map(async n=>{const im=new Image();im.src=`assets/healing/machine-${n}.png?v=20261018-table19`;await im.decode();return im}));fetch('assets/healing/heal.wav?v=20261018-table19').then(r=>r.arrayBuffer()).then(bytes=>{audioBytes=bytes;if(context)context.decodeAudioData(bytes.slice(0)).then(b=>buffer=b).catch(()=>{})}).catch(()=>{});return source})()}
 function unlock(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!context){context=new Audio();output=context.createGain();output.gain.value=globalVolume;output.connect(context.destination);}if(!muted&&!globalMuted)context.resume().catch(()=>{});if(audioBytes&&!buffer)context.decodeAudioData(audioBytes.slice(0)).then(b=>buffer=b).catch(()=>{})}catch{}}
 function tick(){if(muted||globalMuted||!context||context.state!=='running')return;const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='square';oscillator.frequency.setValueAtTime(170.7,context.currentTime);oscillator.frequency.exponentialRampToValueAtTime(341.4,context.currentTime+.06);gain.gain.setValueAtTime(.035,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.11);oscillator.connect(gain).connect(output);oscillator.start();oscillator.stop(context.currentTime+.12)}
 function melody(){if(muted||globalMuted||!buffer||!context||context.state!=='running')return;const node=context.createBufferSource();node.buffer=buffer;node.connect(output);node.start();}
 async function play(count){
  if(active)return;active=true;unlock();status.hidden=false;copy.textContent='친구들을 회복 기계에 맡기고 있어요.';
  try{await prepare()}catch{active=false;status.hidden=true;return}
  const timeline=healingTimeline(count,source.frames),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,total=reduced?1000:timeline.frames*1000/60;let previous='',lastBalls=0,musicPlayed=false;
  return new Promise(resolve=>{finished=()=>{active=false;snapshot=null;status.hidden=true;delete container.dataset.healingPhase;delete container.dataset.healingBalls;finished=null;resolve()};const start=performance.now();
   const draw=now=>{if(!active)return;const p=Math.max(0,Math.min(1,(now-start)/total));snapshot=healingFrameAt(count,p*timeline.frames,source.frames);
    const marker=snapshot.phase+':'+snapshot.balls+':'+snapshot.cycle;
    if(marker!==previous){previous=marker;container.dataset.healingPhase=snapshot.phase;container.dataset.healingBalls=String(snapshot.balls);container.dispatchEvent(new CustomEvent('healing-animation-phase',{bubbles:true,detail:{...snapshot,count}}));if(snapshot.phase==='load'&&snapshot.balls!==lastBalls){lastBalls=snapshot.balls;copy.textContent=`친구 ${snapshot.balls} / ${count} · 볼이 하나씩 올라가요.`;tick()}if(snapshot.phase==='restore'){copy.textContent='반짝반짝! 친구들의 힘이 돌아오고 있어요.';if(!musicPlayed){musicPlayed=true;melody()}}}
    if(p<1)requestAnimationFrame(draw);else finished?.();
   };requestAnimationFrame(draw);
  });
 }
 function draw(ctx,ox,oy){if(!active||!source||!snapshot||!images)return;if(!['load','restore','return'].includes(snapshot.phase))return;const minX=Math.min(...source.oam.map(o=>o.x)),minY=Math.min(...source.oam.map(o=>o.y));const cycle=matchMedia('(prefers-reduced-motion: reduce)').matches?0:snapshot.cycle;const im=images[cycle];
  for(const o of source.oam.slice(0,2+snapshot.balls)){ctx.save();const x=ox+source.anchor.x+o.x-minX,y=oy+source.anchor.y+o.y-minY;ctx.translate(x+(o.flip?8:0),y);if(o.flip)ctx.scale(-1,1);ctx.drawImage(im,0,o.tile*8,8,8,0,0,8,8);ctx.restore()}
 }
 return {prepare,play,draw,active:()=>active,nurseDirection:()=>!active?'down':['take','face','bow-down'].includes(snapshot?.phase)?'down':snapshot?.phase==='bow-up'?'up':'left'};
}
