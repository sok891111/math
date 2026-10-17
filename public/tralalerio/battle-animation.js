import {minecraftProfile,minecraftDuration,drawMinecraftMove} from './minecraft-animation.js?v=20261018-mobs16';
// Original OAM frames are pre-rendered at build time. Motion and screen effects
// are recreated on a low-resolution Canvas; no ROM or emulator is involved.
const REV='20261016-capture3';
const GROUPS={electric:['THUNDERSHOCK','THUNDERBOLT','THUNDER','THUNDER_WAVE'],scratch:['FURY_CUTTER','DRAGON_CLAW','BREAKING_SWIPE','SCRATCH','FURY_SWIPES','SLASH'],leer:['LEER','FORESIGHT'],sound:['GROWL','SCREECH'],wag:['TAIL_WHIP'],sand:['SAND_ATTACK','SMOKESCREEN'],wind:['GUST','WHIRLWIND'],fire:['FLAME_CHARGE','FLARE_BLITZ','EMBER','FLAMETHROWER','FLAME_WHEEL'],water:['WATER_GUN','HYDRO_PUMP'],leaf:['RAZOR_LEAF'],bite:['BITE','HYPER_FANG','SUPER_FANG'],shield:['REFLECT','LIGHT_SCREEN','SAFEGUARD'],heal:['SYNTHESIS','REST','DREAM_EATER'],powder:['PSYCHIC_M','ANCIENTPOWER','POISONPOWDER','HYPNOSIS','CONFUSION'],charge:['SOLARBEAM','FOCUS_ENERGY'],rush:['QUICK_ATTACK','AGILITY','PURSUIT'],lunge:['POUND','MEGA_PUNCH','ROCK_SMASH','DRAIN_PUNCH','COLLISION_COURSE','CLOSE_COMBAT','GIGA_IMPACT','COUNTER','OUTRAGE','TACKLE','BODY_SLAM','SLAM','TAKE_DOWN','STRUGGLE','PECK','WING_ATTACK','RAGE']};
export function profileFor(id){return minecraftProfile(id)||Object.keys(GROUPS).find(key=>GROUPS[key].includes(id))||'status'}
const DURATION={electric:1050,scratch:1050,leer:1100,sound:1350,wag:1000,sand:1100,wind:1300,fire:1200,water:1250,leaf:1200,bite:1050,shield:1100,heal:1200,powder:1200,charge:1200,rush:900,lunge:900,status:950};
let assetsPromise;
export function animationAssets(){return assetsPromise??=(async()=>{const r=await fetch(`assets/animations/frames.json?v=${REV}`);if(!r.ok)throw Error('Animation frames unavailable');const manifest=await r.json(),images={};await Promise.all(Object.entries(manifest).filter(([key])=>key!=='_source').map(async([key,d])=>{const image=new Image();image.src=`assets/animations/${d.image}?v=${REV}`;await image.decode();images[key]=image}));return {manifest,images}})()}
export function frameAt(def,milliseconds){const total=def.timeline.reduce((n,f)=>n+f.frames,0);let tick=Math.floor(milliseconds*60/1000);if(def.loop)tick%=total;else if(tick>=total)return -1;for(const f of def.timeline){if(tick<f.frames)return f.index;tick-=f.frames}return -1}
const ease=t=>Math.min(1,Math.max(0,t));
const lerp=(a,b,t)=>a+(b-a)*t;
function center(image,scene,isPlayer){const r=image.getBoundingClientRect(),s=scene.getBoundingClientRect(),scale=Math.min(r.width/image.naturalWidth,r.height/image.naturalHeight);return {x:(r.x+r.width/2-s.x)/s.width*160,y:(isPlayer?r.bottom-image.naturalHeight*scale*.48:r.y+r.height/2)-s.y,scaleY:96/s.height}}
export function createBattleAnimator(){let ticket=0,resolveCurrent=null;
 function cancel(){ticket++;resolveCurrent?.();resolveCurrent=null}
 async function play(scene,event,onImpact){cancel();const serial=ticket;let assets;try{assets=await animationAssets()}catch{if(!minecraftProfile(event.move)){onImpact();return}assets={manifest:{},images:{}}}if(serial!==ticket||!scene.isConnected)return;
 await Promise.all([...scene.querySelectorAll('.player-mon,.enemy-mon')].map(i=>i.decode().catch(()=>{})));if(serial!==ticket||!scene.isConnected)return;const canvas=document.createElement('canvas');canvas.width=160;canvas.height=96;canvas.className='battle-fx';canvas.setAttribute('aria-hidden','true');scene.append(canvas);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const player=scene.querySelector('.player-mon'),enemy=scene.querySelector('.enemy-mon');const actor=event.actor==='player'?player:enemy,target=event.actor==='player'?enemy:player;const ac=center(actor,scene,event.actor==='player'),tc=center(target,scene,event.actor!=='player');const a={x:ac.x,y:ac.y*ac.scaleY},t={x:tc.x,y:tc.y*tc.scaleY};const profile=profileFor(event.move),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,total=reduced?220:(minecraftProfile(event.move)?minecraftDuration(event.move):DURATION[profile]);const unit=scene.getBoundingClientRect().width/160,sign=event.actor==='player'?1:-1,defender=event.actor==='player'?'enemy':'player',lostHP=event.before[defender].hp-event.after[defender].hp;
 scene.dataset.animating=event.actor;scene.dataset.move=event.move;scene.dataset.profile=profile;
 let impacted=false,finished=false;const finish=()=>{if(finished)return;finished=true;canvas.remove();for(const m of [actor,target]){m.style.transform='';m.style.filter='';m.style.opacity=''}delete scene.dataset.animating;delete scene.dataset.move;delete scene.dataset.profile;resolveCurrent=null};
 const stamp=(key,x,y,ms,scale=1,flip=false,alpha=1)=>{const def=assets.manifest[key],im=assets.images[key];if(!def||!im)return;const index=frameAt(def,ms);if(index<0)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,-1);ctx.drawImage(im,index*128,0,128,128,-64*scale,-64*scale,128*scale,128*scale);ctx.restore()};
 const orb=(x,y,size,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x-size/2),Math.round(y-size/2),Math.round(size),Math.round(size));};
 return new Promise(resolve=>{resolveCurrent=()=>{finish();resolve()};const start=performance.now();const draw=now=>{if(serial!==ticket||!scene.isConnected){finish();resolve();return}const ms=now-start,p=ease(ms/total),impactTime=reduced?.45:profile==='leer'||profile==='sound'||profile==='wag'?.6:.56;ctx.clearRect(0,0,160,96);
 if(!impacted&&p>=impactTime){impacted=true;onImpact();scene.dispatchEvent(new CustomEvent('battle-animation-impact',{bubbles:true,detail:{actor:event.actor,move:event.move}}))}
 if(reduced&&minecraftProfile(event.move)&&!event.failed)drawMinecraftMove(ctx,event.move,{a,t,p,reduced:true});
 if(!reduced){
 const flash=p>.57&&p<.91;if(flash&&lostHP>0&&!event.failed){target.style.opacity=Math.floor((p-.57)*28)%2?'0.1':'1';target.style.transform=`translate(${Math.round(Math.sin(p*92)*2)*unit}px,0)`}else{target.style.opacity='';target.style.transform=''}
 if(event.failed){if(p>.4&&p<.75)target.style.transform=`translate(${sign*7*unit}px,0)`}
 else if(minecraftProfile(event.move)){
  const motion=drawMinecraftMove(ctx,event.move,{a,t,p});
  actor.style.transform=`translate(${motion.x*unit}px,${motion.y*unit}px)`;actor.style.opacity=String(motion.opacity);
 }else if(profile==='electric'){
 if(p>.15&&p<.8){ctx.strokeStyle='#e6b53d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);for(let i=1;i<=8;i++){const q=i/8;ctx.lineTo(lerp(a.x,t.x,q),lerp(a.y,t.y,q)+(i%2?1:-1)*6*Math.sin(p*40));}ctx.stroke();if(p>.48){ctx.strokeStyle='#fff4ac';ctx.beginPath();ctx.moveTo(t.x-8,t.y-14);ctx.lineTo(t.x+3,t.y-2);ctx.lineTo(t.x-2,t.y+4);ctx.lineTo(t.x+8,t.y+14);ctx.stroke();}}
 }else if(profile==='scratch'){
  ctx.filter='brightness(.55)';const local=(p-.12)*total;for(let i=0;i<3;i++)stamp(event.move==='SLASH'?'slash':'scratch',t.x+sign*(10-i*4),t.y-10-i*4,local,1,event.actor==='enemy');ctx.filter='none';
 }else if(['lunge','rush'].includes(profile)){
  const swing=p<.2?-3*Math.sin(p/.2*Math.PI):p<.48?14*Math.sin((p-.2)/.28*Math.PI):0;actor.style.transform=`translate(${sign*swing*unit}px,${-sign*swing*.35*unit}px)`;
  if(profile==='rush'&&p<.5)for(let i=0;i<5;i++){ctx.fillStyle='#85966e';ctx.fillRect(Math.round(a.x-sign*(12+i*4)),Math.round(a.y+i*2-5),8,1)}if(p>=.45&&p<.64)stamp('hit',t.x,t.y,(p-.45)*total,1,event.actor==='enemy');
 }else if(profile==='leer'){
  actor.style.filter=p>.1&&p<.6?'contrast(1.7) brightness(1.25)':'';
  for(let eye=0;eye<2;eye++)for(let i=0;i<8;i++){const q=i/8;if(p>.12+q*.25&&p<.7){const x=lerp(a.x+sign*(eye*5-4),t.x+sign*(eye*3-4),q),y=lerp(a.y-6,t.y-6,q);stamp(i===7?'leerTip':'leer',x,y,(p*total)%130,.8,event.actor==='enemy')}}
  if(p>.55&&p<.88)target.style.filter=`brightness(${.6+.4*Math.cos(p*45)}) sepia(.4)`;
 }else if(profile==='sound'){
  actor.style.transform=`translateY(${Math.round(Math.sin(p*60)*1.5)*unit}px)`;
  for(let i=0;i<3;i++){const q=((p*2.5-i*.24)%1+1)%1;const x=lerp(a.x,t.x,q),y=lerp(a.y,t.y,q);stamp(['sound','sound2','sound3'][i],x,y,(p*total)%130,.8,event.actor==='enemy',1-q*.45)}if(p>.6)target.style.filter=`brightness(${.7+.3*Math.cos(p*40)})`;
 }else if(profile==='wag'){
  actor.style.transform=`translateX(${Math.round(Math.sin(p*32)*5)*unit}px) rotate(${Math.sin(p*32)*9}deg)`;if(p>.62)target.style.filter=`brightness(${.8+.2*Math.sin(p*35)})`;
 }else if(profile==='sand'||profile==='powder'){
  const key=profile==='sand'?'sand':'powder';for(let i=0;i<9;i++){const q=ease((p-i*.035)/.65);if(q>0&&q<1)stamp(key,lerp(a.x,t.x,q)+Math.sin(i*17)*8,lerp(a.y,t.y,q)-Math.sin(q*Math.PI)*12+(i%3)*4,(p*total+i*33)%240,.7,event.actor==='enemy');}
  if(event.move==='SMOKESCREEN'&&p>.4&&p<.8){ctx.fillStyle='#485849';for(let i=0;i<12;i++)orb(t.x+Math.sin(i*2)*16,t.y+Math.cos(i*3)*12,5,'#68736a')}
 }else if(profile==='wind'){
  for(let i=0;i<7;i++){const q=((p*2.5+i*.13)%1);stamp('wind',t.x+Math.sin(q*6.28)*9,t.y+15-q*32,(p*total+i*40)%240,.8,event.actor==='enemy')}
  if(p>.45)target.style.transform=`translateX(${Math.round(Math.sin(p*85)*2)*unit}px)`;
 }else if(['fire','water','leaf'].includes(profile)){
  const key={fire:'fire',water:'water',leaf:'leaf'}[profile];const count=profile==='leaf'?6:3;for(let i=0;i<count;i++){const q=ease((p-.08-i*.08)/.4);if(q>0&&q<1)stamp(key,lerp(a.x,t.x,q),lerp(a.y-i*3,t.y+i*2,q)-Math.sin(q*Math.PI)*5,(p*total+i*45)%250,.85,event.actor==='enemy');if(p>.48+i*.03&&p<.8)stamp(key,t.x+(i-1)*8,t.y-4+(i%2)*8,(p*total)%150,.9,event.actor==='enemy')}
 }else if(profile==='bite'){
  if(p>.2&&p<.65){const gap=(1-ease((p-.2)/.3))*12;stamp('bite',t.x,t.y-gap,(p*total)%100,1,event.actor==='enemy');stamp('smallHit',t.x,t.y+gap,(p*total)%90,.8,event.actor!=='enemy')}
 }else if(profile==='shield'){
  stamp('screen',a.x,a.y,(p*total)%500,1.1,event.actor==='enemy',Math.sin(p*Math.PI));actor.style.filter='brightness(1.2)';
 }else if(profile==='heal'||profile==='charge'||profile==='status'){
  const dest=profile==='status'?t:a;for(let i=0;i<6;i++){const q=(p+i/6)%1;stamp('shine',dest.x+Math.cos(i*6.28/6)*14,dest.y+12-q*28,(p*total+i*33)%220,.65,false,Math.sin(q*Math.PI))}actor.style.filter=`brightness(${1+.3*Math.sin(p*20)})`;
 }
 if(event.critical&&p>.56&&p<.64){ctx.globalAlpha=.22;ctx.fillStyle='#fff';ctx.fillRect(0,0,160,96);ctx.globalAlpha=1}
 if(lostHP>0&&event.after[defender].hp===0&&p>.85){target.style.opacity=String(1-(p-.85)/.15);target.style.transform=`translateY(${(p-.85)/.15*14*unit}px)`}
 }
 if(p<1)requestAnimationFrame(draw);else{if(!impacted)onImpact();finish();resolve();}};requestAnimationFrame(draw)});
 }
 return {play,cancel};
}
