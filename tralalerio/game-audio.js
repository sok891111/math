// Gold score data -> Game Boy style pulse, wave and LFSR noise synthesis.
const BASE='/tralalerio/assets/audio/';
export function trainerEncounterMusic(t,groups={}){
 if(groups[t?.group])return groups[t.group];
 const group=t?.group||'';
 if(group.startsWith('RIVAL'))return 'MUSIC_RIVAL_ENCOUNTER';
 if(['GRUNTM','GRUNTF','EXECUTIVEM','EXECUTIVEF'].includes(group))return 'MUSIC_ROCKET_ENCOUNTER';
 if(group==='SAGE')return 'MUSIC_SAGE_ENCOUNTER';
 if(['LASS','TWINS','PICNICKER','BEAUTY'].includes(group))return 'MUSIC_LASS_ENCOUNTER';
 if(group==='HIKER')return 'MUSIC_HIKER_ENCOUNTER';
 return 'MUSIC_YOUNGSTER_ENCOUNTER';
}
export function musicForState(state,data,manifest,hour=new Date().getHours(),encounter=null){
 const b=state.battle,t=data.trainers?.[b?.trainer];let id;
 if(b){
  if(['won','caught'].includes(b.result)&&!b.animationPending)id=t?.badge?'MUSIC_GYM_VICTORY':t?'MUSIC_TRAINER_VICTORY':'MUSIC_WILD_VICTORY';
  else if(['lost','fled'].includes(b.result))return manifest.maps[state.map];
  else if(t)id=t.badge?'MUSIC_JOHTO_GYM_LEADER_BATTLE':t.group?.startsWith('RIVAL')?'MUSIC_RIVAL_BATTLE':['GRUNTM','GRUNTF'].includes(t.group)?'MUSIC_ROCKET_BATTLE':'MUSIC_JOHTO_TRAINER_BATTLE';
  else id=hour>=18||hour<4?'MUSIC_JOHTO_WILD_BATTLE_NIGHT':'MUSIC_JOHTO_WILD_BATTLE';
 }else if(state.trainerEncounter||encounter)id=trainerEncounterMusic(data.trainers?.[state.trainerEncounter?.id||encounter],manifest.encounterGroups);
 return id?manifest.ids[id]:manifest.maps[state.map];
}
export function synthesizeChannel(context,channel,waves,rate=22050){
 const buffer=context.createBuffer(2,Math.ceil((channel.duration+.015)*rate),rate),left=buffer.getChannelData(0),right=buffer.getChannelData(1);
 for(const e of channel.events){
  const [start,duration]=e,first=Math.floor(start*rate),count=Math.min(Math.ceil(duration*rate),left.length-first);
  if(channel.channel===4){
   let at=0,lfsr=0x7fff,phase=0;
   for(const [frames,volume,envelope,poly] of e[2]){
    const shift=poly>>4,div=poly&7,width=poly&8,frequency=524288/(div||.5)/2**(shift+1),span=Math.min(count-at,Math.ceil((frames+1)/59.7275*rate));
    for(let i=0;i<span;i++){
     phase+=frequency/rate;while(phase>=1){const bit=(lfsr^(lfsr>>1))&1;lfsr=(lfsr>>1)|(bit<<14);if(width)lfsr=(lfsr&~64)|(bit<<6);phase--;}
     const v=Math.max(0,Math.min(15,volume+(envelope<0?1:-1)*Math.floor(i/rate/(Math.abs(envelope)/64||1e9))))/15;
     const value=((lfsr&1)?-1:1)*v*.12;const n=first+at+i;if(e[3]!==1)left[n]+=value;if(e[3]!==-1)right[n]+=value;
    }at+=span;if(at>=count)break;
   }continue;
  }
  const [, ,frequency,volume,envelope,duty,pan,delay,depth,speed]=e,wave=waves[Math.max(0,Math.min(waves.length-1,envelope))];let phase=0;
  for(let i=0;i<count;i++){
   const t=i/rate,vibrato=t>delay/59.7275?Math.sin((t-delay/59.7275)*Math.PI*2*59.7275/Math.max(2,speed*2))*depth*.0015:0;
   phase=(phase+frequency*(1+vibrato)/rate)%1;
   let value,amp;
   if(channel.channel===3){value=(wave[Math.floor(phase*32)]/15-.5)*2;amp=[0,1,.5,.25][volume]||0;}
   else{value=phase<[.125,.25,.5,.75][duty]?1:-1;amp=Math.max(0,Math.min(15,volume+(envelope<0?1:-1)*Math.floor(t/(Math.abs(envelope)/64||1e9))))/15;}
   const fade=Math.min(1,i/30,(count-i)/40);value*=amp*fade*.14;
   if(pan!==1)left[first+i]+=value;if(pan!==-1)right[first+i]+=value;
  }
 }
 return buffer;
}
export function createGameAudio(getGame,{storage=window.localStorage}={}){
 let context,master,manifest,manifestPromise,desired=null,current=null,nodes=[],ticket=0,encounter=null,encounterMap=null,healing=false,disposed=false;
 let muted=false,volume=.4;try{const p=JSON.parse(storage.getItem('tralalerio-audio')||'null');if(p){muted=p.muted===true;volume=typeof p.volume==='number'?Math.max(0,Math.min(1,p.volume)):.4}}catch{}
 const cache=new Map(),loads=new Map();let effects,fxNodes=new Set();
 const button=document.createElement('button');button.id='sound-toggle';button.type='button';button.setAttribute('aria-label','게임 소리 켜기 또는 끄기');
 const slider=document.createElement('input');slider.id='sound-volume';slider.type='range';slider.min='0';slider.max='100';slider.value=String(Math.round(volume*100));slider.setAttribute('aria-label','게임 소리 크기');
 const controls=document.createElement('div');controls.className='game-audio-controls';controls.append(button,slider);document.querySelector('.console-bottom')?.after(controls);
 function reflect(){button.textContent=muted?'소리 켜기':'소리 끄기';button.setAttribute('aria-pressed',String(!muted));if(master&&context)master.gain.setTargetAtTime(muted||healing?0:volume,context.currentTime,.04);document.dispatchEvent(new CustomEvent('game-audio-setting',{detail:{muted,volume}}));}
 function save(){try{storage.setItem('tralalerio-audio',JSON.stringify({muted,volume}))}catch{}reflect();}
 fetch(BASE+'effects.json?v=20261018-azalea20').then(r=>r.json()).then(raw=>effects=raw).catch(()=>{});
 const prepare=()=>manifestPromise??=(fetch(BASE+'manifest.json?v=20261018-azalea20').then(r=>{if(!r.ok)throw Error('music manifest');return r.json()}).then(m=>{manifest=m;return m}).catch(()=>null));
 function stop(){ticket++;for(const n of nodes){try{n.stop()}catch{}n.disconnect();}nodes=[];current=null;controls.dataset.track='';}
 async function score(id){
  if(cache.has(id)){const value=cache.get(id);cache.delete(id);cache.set(id,value);return value;}
  if(loads.has(id))return loads.get(id);
  const p=(async()=>{const res=await fetch(BASE+manifest.tracks[id].file+'?v=20261018-azalea20');if(!res.ok)throw Error('music score');const raw=await res.json();const value=raw.channels.map(ch=>({buffer:synthesizeChannel(context,ch,raw.waves),loopStart:ch.loopStart,duration:ch.duration}));cache.set(id,value);while(cache.size>2)cache.delete(cache.keys().next().value);return value;})().finally(()=>loads.delete(id));loads.set(id,p);return p;
 }
 async function play(id){
  if(disposed||!context||context.state!=='running'||!manifest||!id||current===id)return;
  stop();current=id;const serial=ticket;
  try{const channels=await score(id);if(serial!==ticket||desired!==id||disposed)return;
   const when=context.currentTime+.03;
   nodes=channels.map(ch=>{const n=context.createBufferSource();n.buffer=ch.buffer;n.loop=ch.loopStart!==null;if(n.loop){n.loopStart=ch.loopStart;n.loopEnd=ch.duration;}n.connect(master);n.start(when);return n;});controls.dataset.track=id;
  }catch{if(serial===ticket)current=null;}
 }
 async function unlock(){
  if(disposed||document.hidden)return;
  try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
   if(!context){context=new Audio();master=context.createGain();master.connect(context.destination);reflect();}
   await context.resume();await prepare();sync();if(desired)play(desired);
  }catch{}
 }
 function sync(){
  const game=getGame();if(!game||!manifest)return;
  if(game.state.battle||encounterMap!==game.state.map){encounter=null;encounterMap=null;}
  desired=musicForState(game.state,game.battleData,manifest,undefined,encounter);
  if(desired!==current)play(desired);
 }
 button.onclick=()=>{muted=!muted;save();unlock();};slider.oninput=()=>{volume=Number(slider.value)/100;save();unlock();};
 const gesture=()=>unlock();document.addEventListener('pointerdown',gesture,{passive:true});document.addEventListener('keydown',gesture);
 const visibility=()=>{if(!context)return;if(document.hidden){stop();context.suspend().catch(()=>{});}else unlock();};document.addEventListener('visibilitychange',visibility);
 const timer=setInterval(sync,150);reflect();prepare().then(sync);
 return {sync,unlock,effect(id){if(!effects?.effects[id]||!context||context.state!=='running'||muted)return;const n=context.createBufferSource();n.buffer=synthesizeChannel(context,effects.effects[id],effects.waves);n.connect(master);fxNodes.add(n);n.onended=()=>{fxNodes.delete(n);n.disconnect()};n.start();},encounter(id){encounter=id;encounterMap=getGame()?.state.map;sync();},healing(active){healing=active;reflect();},get settings(){return {muted,volume}},dispose(){disposed=true;clearInterval(timer);stop();for(const n of fxNodes){try{n.stop()}catch{}n.disconnect();}fxNodes.clear();context?.close().catch(()=>{});document.removeEventListener('pointerdown',gesture);document.removeEventListener('keydown',gesture);document.removeEventListener('visibilitychange',visibility);controls.remove();}};
}
