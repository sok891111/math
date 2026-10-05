'use strict';
(() => {
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const themes=[{name:'초록빛 들판',sky:'#bee5df',hill:'#9bcca0',far:'#c0dac0',grass:'#8eb05e'},{name:'노을빛 버섯 숲',sky:'#f2dec8',hill:'#b7bf91',far:'#d7cfac',grass:'#94a666'},{name:'반짝이는 하늘 정원',sky:'#cbdfee',hill:'#a8bad0',far:'#c6d2df',grass:'#8faea1'}];
const {catalog,worlds,draw:drawMonster,portrait}=window.MonsterArt;
let progressStorage;try{progressStorage=localStorage;}catch{progressStorage={getItem:()=>null,setItem:()=>{}};}
const progress=SunshineProgress.create(progressStorage),campaign=SunshineCampaign.create(progressStorage);
const rewardUI=createRewardUI(progress),pickMap=SunshineMaps.createPicker(progressStorage);
let windPad=null,cameraY=0,quizStartedAt=0,multiplyCount=0;
let currentMap,drops=[],pendingBadgeQueue=[],wrongAttempts=0,runId=globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random();
let fullscreenTransition=false,fullscreenTransitionTimer=null;
let stageNumber=(campaign.snapshot().level-1)*SunshineCampaign.STAGES+campaign.snapshot().stage;
const BATTLE_MS=15000;
const STAGE_MS=180000;
let battleDurationMs=BATTLE_MS;
let battleOutcome='idle',battleDeadline=0,battleTimer=null,battleWarned=false;
const SAVE='seonyul-sunshine-best-v1'+(typeof window!=='undefined'&&window.__BLOCK_USER__?('_'+window.__BLOCK_USER__.id):'');let best=0;try{best=Number(localStorage.getItem(SAVE))||0;}catch{} $('best').innerHTML=`${best} <small>점</small>`;
let mode='intro',level=0,score=0,collected=0,defeated=0,camera=0,viewW=960,active=null,answer='',solved=false,clock=0,toastUntil=0,movedBlocks=0,movedOrange=0,consecutiveLosses=0,stageStartedAt=0,tntTimer=null;
let player,platforms,monsters,coins,particles=[],checkpoint=70,last=0,accumulator=0,jumpBuffer=0,coyote=0;
let weapon=SunshineWeapons.create(),enemyCombat=SunshineEnemyCombat.create();
const savedRewards=campaign.snapshot().rewards;score=savedRewards.score;collected=savedRewards.collected;SunshineWeapons.equip(weapon,savedRewards.weapon);
const keys=new Set(),touch=new Map(),FLOOR=390;let WORLD=3260;
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function text(s,x,y,size=12,color='#486447'){ctx.font=`700 ${size}px "Apple SD Gothic Neo", sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,x,y);}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function resetInputs(){keys.clear();touch.clear();jumpBuffer=0;}
function updateSuperJump(){
 const s=progress.superJumpState(),button=$('super-jump');
 button.disabled=mode!=='play'||!player?.grounded||s.superCharges===0;
 button.classList.toggle('charged',s.superCharges>0);
 const label=s.superCharges?'🚀 슈퍼 점프 ×'+s.superCharges:'🚀 슈퍼 점프 '+s.superWins+'/6';
 if(button.textContent!==label)button.textContent=label;
}
function superJump(){
 if(mode!=='play'||!player.grounded||!progress.useSuperJump())return;
 player.vy=-1000;player.grounded=false;player.superFlight=true;coyote=0;jumpBuffer=0;
 burst(player.x+14,player.y+player.h);notify('슈퍼 점프! 하늘 높이 깡충 🚀');updateSuperJump();
}
$('super-jump').onclick=superJump;
function hud(){campaign.updateRewards({score,collected,weapon:weapon.kind});updateSuperJump();const gear=SunshineWeapons.catalog[weapon.kind];$('weapon-status').textContent=gear?`${gear.icon} ${gear.name}`:'';
 const stats=progress.snapshot();$('wind-progress').textContent=stats.windUnlocked?'🌪️ 바람 모험 열림 · 바람 발판에서 점프해 봐!':`🔒 바람 모험 · 몬스터 ${stats.total} / 50마리`;const journey=campaign.snapshot();$('chapter').textContent=`LEVEL ${journey.level} · STAGE ${journey.stage}/${journey.stagesPerLevel}`;$('world-name').textContent=currentMap.name;$('scene-text').textContent=currentMap.name+' · 맵 '+(SunshineMaps.layouts.findIndex(m=>m.id===currentMap.id)+1)+' / '+SunshineMaps.layouts.length;$('score').textContent=score;$('coins').textContent=collected;$('rescued').textContent=stats.total;$('badge-count').textContent=stats.badgeCount;$('open-badges').setAttribute('aria-label','잡은 몬스터 '+stats.total+'마리, 배지 '+stats.badgeCount+'개. 배지 앨범 열기');rewardUI.dashboard();
}
function groundAt(x){return platforms.find(p=>p.ground&&x>=p.x&&x<p.x+p.w);}
function safeGround(x){return groundAt(x)||platforms.filter(p=>p.ground).sort((a,b)=>Math.abs(a.x+a.w/2-x)-Math.abs(b.x+b.w/2-x))[0];}
function safePosition(x,w=36){const floor=safeGround(x+w/2);return {x:Math.max(floor.x+8,Math.min(floor.x+floor.w-w-8,x)),floor};}
function loadLevel(mapId){
 weapon.arrows=[];weapon.cooldown=1;weapon.animation=0;enemyCombat=SunshineEnemyCombat.create();
 stageNumber=(campaign.snapshot().level-1)*SunshineCampaign.STAGES+campaign.snapshot().stage;currentMap=mapId?SunshineMaps.build(mapId):pickMap();level=currentMap.theme;WORLD=currentMap.length;platforms=currentMap.platforms;drops=[];windPad=null;
 player={x:70,y:groundAt(84).y-46,w:28,h:46,vx:0,vy:0,grounded:true,face:1,knockback:0,hurtTime:0};checkpoint=70;camera=0;cameraY=0;quizStartedAt=0;defeated=0;coyote=.1;particles=[];
 monsters=MonsterArt.populate(currentMap,Math.random,{windUnlocked:progress.snapshot().windUnlocked,allowedKinds:campaign.snapshot().definition.monsters}).map(({x,kind,supportIndex},i)=>{const m=catalog[kind],ground=platforms[supportIndex]||groundAt(x);return {id:runId+':'+stageNumber+':'+i+':'+Math.random(),kind,name:m.name,supportIndex,x,y:ground.y-m.h-(m.flying?100:0),flying:!!m.flying,flightPhase:i,baseY:ground.y,w:m.w,h:m.h,min:kind==='enderdragon'?Math.max(180,x-650):Math.max(ground.x+8,x-45),max:kind==='enderdragon'?Math.min(WORLD-m.w-220,x+650):Math.min(ground.x+ground.w-m.w-8,x+65),vx:m.speed,defeated:false,q:null};});
 renderGuide();coins=[];
 for(const p of platforms.filter(p=>!p.ground))for(let x=p.x+25;x<p.x+p.w-10;x+=43)coins.push({x,y:p.y-28,w:17,h:22,got:false});
 for(let x=160;x<WORLD-220;x+=190){const floor=groundAt(x);if(floor&&x+17<floor.x+floor.w)coins.push({x,y:floor.y-43,w:17,h:22,got:false});}
 if(progress.snapshot().windUnlocked)activateWindCourse();
 hud();
}
function activateWindCourse(){
 if(windPad)return;
 let breeze=monsters.find(z=>z.kind==='breeze');
 if(!breeze){
  const candidates=monsters.filter(z=>!z.defeated&&!z.flying&&z.x>WORLD*.35&&platforms[z.supportIndex].ground);
  breeze=candidates[Math.floor(Math.random()*candidates.length)];
  if(!breeze)return;
  const m=catalog.breeze,g=platforms[breeze.supportIndex];
  Object.assign(breeze,{kind:'breeze',name:m.name,w:m.w,h:m.h,y:g.y-m.h,baseY:g.y,vx:m.speed,attackCooldown:2,attackCharge:0});
 }
 const ground=platforms[breeze.supportIndex];
 const x=Math.max(ground.x+12,Math.min(ground.x+ground.w-260,breeze.x-160));
 windPad={x,y:ground.y,w:110};
 // Keep the launch column clear: these ledges can be crossed from below.
 for(const p of platforms)if(!p.ground&&p.x<x+150&&p.x+p.w>x-20)p.oneWay=true;
 breeze.min=Math.max(ground.x+8,x+155);breeze.max=Math.min(ground.x+ground.w-breeze.w-8,x+235);
 breeze.x=Math.max(breeze.min,Math.min(breeze.max,breeze.x));
 for(let floor=5;floor<=7;floor++){
  const ledge={x:x-15,y:ground.y-floor*80,w:140,h:18,ground:false,oneWay:true,windBonus:true,floor};
  platforms.push(ledge);
  for(let i=0;i<3;i++)coins.push({x:ledge.x+18+i*36,y:ledge.y-30,w:17,h:22,got:false,value:50,windBonus:true});
 }
 renderGuide();
}
function stageRemaining(now=performance.now()){
 const time=quizStartedAt||now;
 return stageStartedAt?Math.max(0,Math.min(STAGE_MS,STAGE_MS-(time-stageStartedAt))):STAGE_MS;
}
function updateStageTimer(now=performance.now()){
 if(!stageStartedAt||!['play','quiz'].includes(mode))return;
 const remaining=stageRemaining(now);
 const seconds=Math.ceil(remaining/1000),min=Math.floor(seconds/60),sec=String(seconds%60).padStart(2,'0');
 const timer=$('stage-timer');if(timer){timer.querySelector('b').textContent=`${min}:${sec}`;timer.classList.toggle('urgent',remaining<=30000);}
 if(remaining<=0)triggerTnt();
}
function triggerTnt(reason='time'){
 if(['tnt','clear','intro'].includes(mode))return;
 consecutiveLosses=0;mode='tnt';resetInputs();stopBattleTimer();cancelBlockDrag();
 if($('quiz').open)$('quiz').close();
 $('tnt-dialog').querySelector('p').textContent=reason==='losses'?'몬스터가 3번 연속 이겼어! 잠깐 숨을 고르고 이번 스테이지를 다시 도전해 보자.':'3분 안에 깃발에 도착하지 못했어. 이번 스테이지를 처음부터 다시 도전해 보자!';$('tnt-dialog').showModal();
 for(let i=0;i<70;i++)particles.push({x:player.x+14+(Math.random()-.5)*120,y:player.y+20+(Math.random()-.5)*90,vx:(Math.random()-.5)*300,vy:-Math.random()*280,life:1.8,color:i%2?'#e8744f':'#f4cc64'});
 clearTimeout(tntTimer);tntTimer=setTimeout(()=>{if(mode==='tnt')restartAfterTnt();},2200);
}
function restartAfterTnt(){if(mode!=='tnt')return;clearTimeout(tntTimer);tntTimer=null;if($('tnt-dialog').open)$('tnt-dialog').close();loadLevel(currentMap.id);begin();notify('TNT가 터졌어! 이번에는 깃발까지 집중해 보자.');}

function renderGuide(){
 const list=$('monster-guide');list.replaceChildren();
 for(const kind of [...new Set(monsters.map(z=>z.kind))]){
  const m=catalog[kind],monster=monsters.find(z=>z.kind===kind),card=document.createElement('article');
  card.className='monster-card'+(monster.defeated?' purified':'');card.dataset.kind=kind;
  const picture=document.createElement('canvas');picture.width=192;picture.height=176;portrait(picture,kind);
  const copy=document.createElement('div'),name=document.createElement('b'),detail=document.createElement('p'),state=document.createElement('small');
  name.textContent=m.name;detail.textContent=m.detail;state.textContent=`${monster.defeated?'✦ 이번 만남 완료 · ':''}누적 ${progress.snapshot().counts[kind]}마리`;
  copy.append(name,detail,state);card.append(picture,copy);list.append(card);
 }
 $('guide-title').textContent=currentMap.name+'에서 만날 몬스터';
}

function showNewBadges(badges){
 const box=$('badge-reward');box.replaceChildren();box.hidden=!badges.length;
 if(badges.length){const summary=document.createElement('div');summary.className='new-badge';summary.textContent='🏅 새 배지가 생겼어! 보물상자에서 한 개씩 펼쳐 봐.';box.append(summary);}
}
let albumPrevious='intro';
function openBadges(){if(!['intro','play','pause'].includes(mode))return;albumPrevious=mode;mode='album';resetInputs();rewardUI.renderAlbum();$('badge-album').showModal();}
function closeBadges(){if(mode!=='album')return;$('badge-detail').close();$('badge-album').close();mode=albumPrevious;resetInputs();hud();if(mode==='play')canvas.focus({preventScroll:true});}
$('open-badges').onclick=openBadges;$('collection-open').onclick=openBadges;$('close-badges').onclick=closeBadges;$('badge-album').addEventListener('cancel',e=>{e.preventDefault();closeBadges();});
function makeDrop(monster,badges,elapsedMs){
 const dragon=monster.kind==='enderdragon',perfect=wrongAttempts===0,fast=elapsedMs<=5000,tier=dragon?'dragon':perfect&&fast?'prism':perfect?'gold':'sun';
 const direction=Math.random()<.5?-1:1,landing=safePosition(monster.x+monster.w/2-18);
  drops.push({id:monster.id,kind:monster.kind,x:landing.x,y:landing.floor.y-32,w:36,h:32,baseY:landing.floor.y,weapon:SunshineWeapons.roll(weapon.kind),
  vx:direction*(95+Math.random()*85),vy:-(255+Math.random()*85),bounced:false,settled:false,
  gems:dragon?30:3+(perfect?1:0)+(fast?2:0),points:dragon?1500:tier==='prism'?300:tier==='gold'?200:120,tier,age:0,got:false,badges});
}
function collectDrop(drop){
 if(drop.got)return;const result=progress.claim(drop);if(!result)return;
 drop.got=true;drop.previousWeapon=weapon.kind;SunshineWeapons.equip(weapon,drop.weapon);score+=drop.points;saveBest();burst(drop.x,drop.y);hud();mode='loot';resetInputs();player.vx=0;
 const incoming=[...drop.badges,...result.unlocked];
 for(const badge of incoming)if(!pendingBadgeQueue.some(b=>b.id===badge.id))pendingBadgeQueue.push(badge);
 // 한 번의 보물 획득에서는 배지 하나만 공개하고 나머지는 다음 보물로 넘긴다.
 rewardUI.reveal(drop,drop.tier==='dragon'?pendingBadgeQueue.splice(0):pendingBadgeQueue.length?[pendingBadgeQueue.shift()]:[],()=>{mode='play';resetInputs();canvas.focus({preventScroll:true});});
}
function updateDrops(dt){
 for(const drop of drops){if(drop.got)continue;drop.age+=dt;
  if(!drop.settled){
   const oldBottom=drop.y+drop.h;drop.vy+=1050*dt;drop.x+=drop.vx*dt;drop.y+=drop.vy*dt;drop.vx*=Math.pow(.18,dt);
   // Treasure lands on the walkable ground so Seonyul can reach it without
   // requiring a surprise jump onto a high ledge.
   const surface=platforms.find(p=>p.ground&&drop.x+drop.w*.55>p.x&&drop.x+drop.w*.45<p.x+p.w&&drop.y+drop.h>=p.y&&oldBottom<=p.y+8);
   if(surface){drop.y=surface.y-drop.h;drop.baseY=surface.y;if(!drop.bounced){drop.bounced=true;drop.vy=-125;drop.vx*=.35;}else{drop.vy=0;drop.vx=0;drop.settled=true;}}
   if(drop.y>600){const landing=safePosition(drop.x);drop.x=landing.x;drop.baseY=landing.floor.y;drop.y=drop.baseY-drop.h;drop.vy=drop.vx=0;drop.settled=true;}
  }
  if(drop.age>.75&&drop.settled&&Math.abs(player.x+player.w/2-drop.x-drop.w/2)<42&&Math.abs(player.y+player.h-drop.baseY)<55){collectDrop(drop);break;}
 }
}

function notify(s){$('toast').textContent=s;toastUntil=clock+3;$('toast').classList.add('show');}
function saveBest(){if(score<=best)return;best=score;try{localStorage.setItem(SAVE,String(best));}catch{}$('best').innerHTML=`${best} <small>점</small>`;}
function burst(x,y){for(let i=0;i<28;i++)particles.push({x,y,vx:(Math.random()-.5)*220,vy:-Math.random()*210,life:1.1,color:['#f4cc64','#fffbd9','#91b979'][i%3]});}
function begin(){mode='play';stageStartedAt=performance.now();$('intro').hidden=true;resetInputs();canvas.focus({preventScroll:true});hud();}
function pause(){if(mode!=='play')return;mode='pause';resetInputs();$('pause-dialog').showModal();}
function resume(){if(mode!=='pause')return;$('pause-dialog').close();mode='play';resetInputs();canvas.focus({preventScroll:true});}
function stopBattleTimer(){if(battleTimer!==null){clearInterval(battleTimer);battleTimer=null;}}
function cancelBlockDrag(){if(blockDrag){blockDrag.ghost?.remove();blockDrag=null;}}
function loseBattle(){
 if(mode!=='quiz'||battleOutcome!=='pending')return;
 battleOutcome='lost';consecutiveLosses++;progress.lose();stopBattleTimer();cancelBlockDrag();resetInputs();answer='';$('answer').textContent='?';
 $('battle-timer').dataset.state='lost';$('battle-timer').classList.remove('urgent');$('battle-seconds').textContent='시간 끝';$('battle-timer').style.setProperty('--time-left','0%');
 $('quiz-title').textContent=`${active.name}의 승리!`;$('monster-greeting').textContent='이번엔 몬스터가 이겼어. 다시 도전할 수 있어!';
 $('feedback').textContent=`${battleDurationMs/1000}초가 지났어! 처치 수와 배지는 늘어나지 않아.`;$('feedback').className='wrong';
 renderBlocks();$('block-workspace').hidden=true;$('badge-reward').hidden=true;$('keypad').hidden=true;$('submit').hidden=true;$('retreat').hidden=true;
 $('continue').textContent='다시 도전하러 가기 →';$('continue').hidden=false;$('continue').focus();if(consecutiveLosses>=3)triggerTnt('losses');
}
function updateBattleTimer(){
 if(mode!=='quiz'||battleOutcome!=='pending')return;
 const remaining=battleDeadline-performance.now();
 if(remaining<=0){loseBattle();return;}
 const seconds=Math.ceil(remaining/1000),timer=$('battle-timer');timer.dataset.state='pending';timer.classList.toggle('urgent',seconds<=5);timer.style.setProperty('--time-left',`${remaining/battleDurationMs*100}%`);
 const label=`${seconds}초`;
 if($('battle-seconds').textContent!==label)$('battle-seconds').textContent=label;
 if(seconds<=5&&!battleWarned){battleWarned=true;$('timer-announcement').textContent='5초 남았어!';}
}
function canAnswer(){
 if(mode!=='quiz'||battleOutcome!=='pending')return false;
 // Check the absolute deadline even when background tabs throttle timers.
 if(performance.now()>=battleDeadline){loseBattle();return false;}
 return true;
}
function isMultiply(){return catalog[active.kind].math==='multiply';}
function isHardAddition(){return !isMultiply()&&(catalog[active.kind].math==='hard'||active.q.some(n=>n>=10));}
function trayCapacity(){return isHardAddition()?50:10;}
function encounter(z){enemyCombat.projectiles=[];weapon.arrows=[];weapon.animation=0;wrongAttempts=0;stopBattleTimer();battleOutcome='pending';mode='quiz';active=z;battleDurationMs=catalog[z.kind].math==='multiply'?60000:(catalog[z.kind].math==='hard'||campaign.snapshot().level>1)?30000:BATTLE_MS;quizStartedAt=performance.now();$('battle-label').textContent=`${battleDurationMs/1000}초 수학 대결`;z.q=campaign.question(catalog[z.kind].math);$('badge-reward').hidden=true;$('block-workspace').hidden=false;answer='';solved=false;resetInputs();$('operator').textContent=isMultiply()?'×':'+';$('a').textContent=z.q[0];$('b').textContent=z.q[1];$('answer').textContent='?';$('feedback').textContent='숫자를 누르거나 키보드로 답을 써 줘.';$('feedback').className='';movedBlocks=0;movedOrange=0;multiplyCount=0;renderBlocks();$('keypad').hidden=false;$('submit').hidden=false;$('continue').hidden=true;$('continue').textContent='멋져! 모험 계속하기 →';$('retreat').hidden=false;$('quiz-title').textContent=`${z.name}의 ${isMultiply()?'구구단':'덧셈'} 도전!`;$('monster-greeting').textContent=catalog[z.kind].greeting;portrait($('monster-portrait'),z.kind);$('monster-portrait').dataset.kind=z.kind;$('quiz').showModal();(isMultiply()?$('multiply-next'):$('submit')).focus({preventScroll:true});$('quiz').scrollTop=0;battleDeadline=performance.now()+battleDurationMs;battleWarned=false;$('timer-announcement').textContent='';updateBattleTimer();battleTimer=setInterval(updateBattleTimer,100);}
function input(value){if(!canAnswer())return;if(value==='clear')answer='';else if(value==='back')answer=answer.slice(0,-1);else if(answer.length<2)answer+=value;$('answer').textContent=answer||'?';}
function submit(){
 if(!canAnswer())return;
 if(!answer){$('feedback').textContent='먼저 숫자로 답을 써 줘.';return;}
 if(Number(answer)!==(isMultiply()?active.q[0]*active.q[1]:active.q[0]+active.q[1])){wrongAttempts++;$('feedback').textContent=isMultiply()?'괜찮아! 묶음을 하나씩 누르며 같은 수를 더해 봐.':'아직 시간이 있어! 블록을 옮겨 다시 세어 봐.';$('feedback').className='wrong';answer='';$('answer').textContent='?';return;}
 const elapsedMs=battleDurationMs-(battleDeadline-performance.now());
 battleOutcome='won';consecutiveLosses=0;stopBattleTimer();$('battle-timer').classList.remove('urgent');$('battle-timer').dataset.state='won';$('battle-seconds').textContent='승리!';solved=true;cancelBlockDrag();renderBlocks();active.defeated=true;defeated++;
 const windWasUnlocked=progress.snapshot().windUnlocked;
 const earned=progress.award(active.kind,{elapsedMs,perfect:wrongAttempts===0,tenFrame:!isMultiply()&&(active.q[0]-movedOrange+movedBlocks===10||active.q[1]+movedOrange-movedBlocks===10),mapId:currentMap.id});
 if(!windWasUnlocked&&progress.snapshot().windUnlocked)activateWindCourse();
 makeDrop(active,earned,elapsedMs);showNewBadges(earned);score+=100;
 checkpoint=safePosition(active.x+65,player.w).x;
 saveBest();hud();$('feedback').textContent=active.q[0]+(isMultiply()?' × ':' + ')+active.q[1]+' = '+answer+' · 승리 +100점';$('feedback').className='correct';$('quiz-title').textContent=active.name+', 정화 성공!';$('monster-greeting').textContent=active.kind==='enderdragon'?'선율아, 드래곤을 이겼어! 전설의 보물이 기다리고 있어!':'보물 상자가 떨어졌어! 가끔 특별한 무기도 들어 있어.';renderGuide();$('block-workspace').hidden=true;$('keypad').hidden=true;$('submit').hidden=true;$('retreat').hidden=true;$('continue').textContent='보물 주우러 가기 →';$('continue').hidden=false;$('continue').focus();burst(active.x,active.y);if(!windWasUnlocked&&progress.snapshot().windUnlocked){$('quiz-title').textContent='50마리 달성! 바람 모험이 열렸어!';$('monster-greeting').textContent='브리즈가 찾아왔어! 길에서 빛나는 바람 발판을 찾아 5~7층 하늘길로 점프해 봐.';}
}

function closeQuiz(){if(mode!=='quiz'||!active)return;updateBattleTimer();if(mode!=='quiz')return;stopBattleTimer();cancelBlockDrag();if(solved){notify(active.kind==='enderdragon'?'전설의 드래곤 보물! 보석 30개와 특별한 선물을 찾아봐!':'보물 상자 발견! 어떤 선물이 들어 있을까?');}else{active.reencounterAt=clock+2;const retreat=safePosition(player.x-100,player.w);player.x=retreat.x;player.y=retreat.floor.y-player.h;player.vx=0;player.vy=0;notify(battleOutcome==='lost'?'이번에는 몬스터가 이겼어! 다시 도전해 보자.':'준비되면 다시 만나자!');}if(stageStartedAt&&quizStartedAt)stageStartedAt+=performance.now()-quizStartedAt;quizStartedAt=0;$('quiz').close();mode='play';active=null;battleOutcome='idle';resetInputs();canvas.focus({preventScroll:true});}
// Both colors can move in either direction; each tray holds ten blocks.
let blockDrag=null,suppressBlockClickUntil=0;
function multiplicationFood(){return {pig:{icon:'🍎',name:'사과'},rabbit:{icon:'🥕',name:'당근'},chicken:{icon:'🌽',name:'옥수수'}}[active.kind];}
function updateMultiplication(){
 const [a,b]=active.q,food=multiplicationFood(),pending=battleOutcome==='pending';
 const groups=[...$('multiply-groups').children];
 groups.forEach((group,n)=>{
  group.setAttribute('aria-pressed',String(n<multiplyCount));
  group.classList.toggle('next-group',n===multiplyCount);
  group.disabled=!pending;
  group.querySelector('.multiply-group-label').textContent=`${n+1}번 접시 · ${n<multiplyCount?'세었어 ✓':`${a}개`}`;
 });
 $('multiply-next').disabled=!pending||multiplyCount>=b;
 $('multiply-next').textContent=multiplyCount>=b?'다 세었어! 숫자판에 답을 써 줘 ↓':`${multiplyCount+1}번 접시 더하기 (+${a}) →`;
 $('multiply-easier').hidden=a===2&&b===3;
 $('multiply-easier').disabled=!pending;
 $('reset-blocks').disabled=!pending||multiplyCount===0;
 const explanation=$('block-explanation');explanation.replaceChildren();
 const step=document.createElement('strong');step.className='multiply-step';
 step.textContent=multiplyCount===0?`첫 접시부터 ${food.name}를 함께 세어 보자.`:multiplyCount===1?`첫 접시에 ${a}개가 있어!`:`${(multiplyCount-1)*a}개에 ${a}개를 더하면 ${multiplyCount*a}개!`;
 const addition=document.createElement('span');addition.className='multiply-addition';
 addition.textContent=multiplyCount?`${Array(multiplyCount).fill(a).join(' + ')} = ${a*multiplyCount} · ${multiplyCount}/${b}접시`:`${Array(b).fill(a).join(' + ')} = ?`;
 const meaning=document.createElement('span');meaning.className='multiply-summary';
 meaning.textContent=multiplyCount===b?`${a}개씩 ${b}접시, 모두 ${a*b}개! 그래서 ${a} × ${b} = ${a*b}.`:`${a} × ${b}는 ${a}를 ${b}번 더한다는 뜻이야.`;
 explanation.append(step,addition,meaning);
}
function countMultiplyGroup(n){
 if(!canAnswer()||!isMultiply())return;
 if(n!==multiplyCount){$('feedback').textContent=n<multiplyCount?'이 접시는 이미 세었어. 테두리가 진한 다음 접시를 눌러 봐.':'차례대로 세어 보자. 테두리가 진한 접시를 눌러 봐.';return;}
 multiplyCount++;updateMultiplication();
 $('feedback').textContent=multiplyCount===active.q[1]?'모두 세었어! 찾은 수를 답에 써 줘.':'잘하고 있어! 다음 접시도 더해 보자.';
 $('feedback').className='';
}
$('multiply-next').onclick=()=>countMultiplyGroup(multiplyCount);
$('multiply-easier').onclick=()=>{
 if(!canAnswer()||!isMultiply())return;
 active.q=[2,3];multiplyCount=0;answer='';$('a').textContent='2';$('b').textContent='3';$('answer').textContent='?';
 $('feedback').textContent='작은 접시 3개로 다시 배워 보자!';$('feedback').className='';renderBlocks();
};
function renderBlocks(){
 const [a,b]=active.q;
 const multiply=isMultiply(),hard=isHardAddition();
 $('quiz').classList.toggle('multiply-quiz',multiply&&battleOutcome==='pending');
 $('block-workspace').classList.toggle('large-addition',hard);
 $('block-workspace').setAttribute('aria-label',multiply?'먹이 접시로 곱셈 배우기':'블록 옮겨 열 칸 만들기');
 $('multiply-lesson').hidden=!multiply;$('multiply-actions').hidden=!multiply;
 $('reset-blocks').textContent=multiply?'↶ 처음부터 같이 세기':'↶ 블록 처음으로';
 $('addition-frames').hidden=multiply;$('multiply-groups').hidden=!multiply;$('reset-blocks').hidden=false;
 $('block-instruction').textContent=multiply?'접시마다 같은 개수! 한 접시씩 눌러 봐.':hard?'10칸 틀마다 10개! 블록을 옮겨 10개 묶음을 만들어 봐.':'어느 쪽 블록이든 누르거나 반대쪽으로 옮겨 봐!';
 if(multiply){
  const food=multiplicationFood(),groups=$('multiply-groups');groups.replaceChildren();
  $('multiply-story').textContent=`${active.name}에게 ${food.name}를 주자! 한 접시에 ${a}개씩, 접시가 ${b}개야. 모두 몇 개일까?`;
  $('multiply-size').textContent=`${a}개씩`;$('multiply-times').textContent=`${b}접시`;
  for(let n=0;n<b;n++){
   const group=document.createElement('button');group.type='button';group.className='multiply-group';
   group.setAttribute('aria-label',`${n+1}번 접시, ${food.name} ${a}개 더하기`);
   const label=document.createElement('span');label.className='multiply-group-label';group.append(label);
   for(let j=0;j<a;j++){const block=document.createElement('i');block.className='multiply-block';block.textContent=food.icon;block.setAttribute('aria-hidden','true');group.append(block);}
   group.onclick=()=>countMultiplyGroup(n);groups.append(group);
  }
  updateMultiplication();return;
 }

 const colors={left:[...Array(a-movedOrange).fill('orange'),...Array(movedBlocks).fill('blue')],right:[...Array(b-movedBlocks).fill('blue'),...Array(movedOrange).fill('orange')]};
 for(const side of ['left','right']){
  const tray=$(side+'-blocks');tray.replaceChildren();
  const slots=hard?Math.max(20,Math.ceil(colors[side].length/10)*10):10;
  let frame=tray;
  for(let i=0;i<slots;i++){
   if(hard&&i%10===0){frame=document.createElement('div');frame.className='ten-block-group';frame.setAttribute('aria-label','10칸 묶음');tray.append(frame);}
   const color=colors[side][i],cell=document.createElement(color?'button':'span');cell.className='move-block '+(color||'empty');
   if(color){cell.type='button';cell.dataset.side=side;cell.dataset.color=color;cell.disabled=battleOutcome!=='pending';cell.setAttribute('aria-label',(color==='blue'?'파란':'주황')+' 블록 '+(side==='left'?'오른쪽':'왼쪽')+'으로 옮기기');cell.addEventListener('click',()=>{if(performance.now()>suppressBlockClickUntil)moveBlock(side,color);});cell.addEventListener('pointerdown',startBlockDrag);}
   else cell.setAttribute('aria-label','빈칸');frame.append(cell);
  }
 }
 $('left-count').textContent=colors.left.length+(hard?'개':' / 10');$('right-count').textContent=colors.right.length+(hard?'개':' / 10');
 $('block-explanation').textContent=colors.left.length===10||colors.right.length===10?'열 칸 완성! 10개와 다른 쪽 블록을 더해 봐.':'양쪽 블록을 누르거나 반대쪽으로 끌어 옮겨 봐!';
 $('reset-blocks').disabled=battleOutcome!=='pending'||(movedBlocks===0&&movedOrange===0);
}
function moveBlock(side,color='blue'){
 if(!canAnswer())return;
 const left=active.q[0]-movedOrange+movedBlocks,right=active.q[1]+movedOrange-movedBlocks;
 if(isMultiply()||(side==='left'?right:left)>=trayCapacity())return;
 if(color==='blue'){if(side==='right'&&movedBlocks<active.q[1])movedBlocks++;else if(side==='left'&&movedBlocks>0)movedBlocks--;else return;}
 else{if(side==='left'&&movedOrange<active.q[0])movedOrange++;else if(side==='right'&&movedOrange>0)movedOrange--;else return;}
 renderBlocks();
}
function startBlockDrag(e){
 if(!canAnswer()||e.button!==0||blockDrag)return;
 const button=e.currentTarget;button.setPointerCapture(e.pointerId);
 blockDrag={id:e.pointerId,side:button.dataset.side,color:button.dataset.color,x:e.clientX,y:e.clientY,dragged:false,ghost:null};
}
document.addEventListener('pointermove',e=>{
 if(!blockDrag||blockDrag.id!==e.pointerId)return;
 const d=blockDrag;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>6)d.dragged=true;
 if(!d.dragged)return;
 if(!d.ghost){d.ghost=document.createElement('span');d.ghost.className='block-ghost '+d.color;d.ghost.setAttribute('aria-hidden','true');$('quiz').append(d.ghost);}
 d.ghost.style.left=`${e.clientX-14}px`;d.ghost.style.top=`${e.clientY-14}px`;
});
function endBlockDrag(e){
 if(!blockDrag||blockDrag.id!==e.pointerId)return;
 const d=blockDrag;blockDrag=null;d.ghost?.remove();
 if(d.dragged){suppressBlockClickUntil=performance.now()+400;
  if(e.type==='pointerup'){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.frame-well');if(target&&target.dataset.side!==d.side)moveBlock(d.side,d.color);}
 }
}
document.addEventListener('pointerup',endBlockDrag);document.addEventListener('pointercancel',endBlockDrag);
$('reset-blocks').onclick=()=>{if(canAnswer()){if(isMultiply()){multiplyCount=0;updateMultiplication();$('feedback').textContent='첫 접시부터 다시 같이 세어 보자.';$('feedback').className='';}else{movedBlocks=0;movedOrange=0;renderBlocks();}}};
let fullscreenNative=false;
// iPad Safari shows its own transient fullscreen/input notice when the native
// Fullscreen API is invoked. The CSS game-only mode gives the same game view
// without triggering that browser-owned overlay.
function isIpadSafari(){
 const ua=navigator.userAgent||'';
 const ipad=/iPad/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 return ipad&&/Safari/i.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
}
function gameOnly(on){
 resetInputs();document.body.classList.toggle('game-only',on);
 for(const id of ['fullscreen','fullscreen-game']){$(id).setAttribute('aria-pressed',String(on));$(id).setAttribute('aria-label',on?'전체화면 나가기':'전체화면');}
 $('fullscreen').textContent=on?'⛶ 전체화면 나가기':'⛶ 전체화면';$('fullscreen-game').textContent=on?'✕':'⛶';
 if(mode==='play')canvas.focus({preventScroll:true});
}
async function toggleFullscreen(){
 fullscreenTransition=true;clearTimeout(fullscreenTransitionTimer);fullscreenTransitionTimer=setTimeout(()=>{fullscreenTransition=false;},1400);
 if(document.body.classList.contains('game-only')){gameOnly(false);if(document.fullscreenElement)try{await document.exitFullscreen();}catch{}fullscreenNative=false;return;}
 gameOnly(true);
 if(!isIpadSafari()&&document.documentElement.requestFullscreen)try{await document.documentElement.requestFullscreen();fullscreenNative=true;}catch{/* Game-only layout also works without native fullscreen. */}
}
document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement){fullscreenNative=true;gameOnly(true);}else if(fullscreenNative){fullscreenNative=false;gameOnly(false);}clearTimeout(fullscreenTransitionTimer);fullscreenTransitionTimer=setTimeout(()=>{fullscreenTransition=false;},1400);});
$('fullscreen').onclick=toggleFullscreen;$('fullscreen-game').onclick=toggleFullscreen;
function down(action,id){if(mode!=='play')return;touch.set(id,action);if(action==='jump')jumpBuffer=.15;}
function held(action){return keys.has(action)||[...touch.values()].includes(action);}
function step(dt){clock+=dt;if(clock>toastUntil)$('toast').classList.remove('show');if(mode!=='play')return;const p=player;p.hurtTime=Math.max(0,(p.hurtTime||0)-dt);const recoiling=(p.knockback||0)>0;p.knockback=Math.max(0,(p.knockback||0)-dt);if(recoiling&&!p.knockback)p.vx=0;jumpBuffer=Math.max(0,jumpBuffer-dt);coyote=p.grounded?.1:Math.max(0,coyote-dt);const dir=Number(held('right'))-Number(held('left'));const target=dir*235;if(!recoiling)p.vx+=Math.max(-1550*dt,Math.min(1550*dt,target-p.vx));if(dir&&!recoiling)p.face=dir;if(!recoiling&&jumpBuffer>0&&coyote>0){const windJump=windPad&&p.x+p.w>windPad.x&&p.x<windPad.x+windPad.w&&Math.abs(p.y+p.h-windPad.y)<3;p.vy=windJump?-1400:-590;if(windJump){p.superFlight=true;burst(p.x+14,p.y+p.h);}p.grounded=false;coyote=0;jumpBuffer=0;}p.vy+=1550*dt;if(!recoiling&&!p.superFlight&&!held('jump')&&p.vy<-250)p.vy+=1600*dt;p.vy=Math.min(p.vy,760);p.x+=p.vx*dt;for(const r of platforms)if(!r.oneWay&&overlap(p,r)){if(p.vx>0)p.x=r.x-p.w;else if(p.vx<0)p.x=r.x+r.w;p.vx=0;}p.x=Math.max(0,Math.min(WORLD-p.w,p.x));const oldFeet=p.y+p.h;p.y+=p.vy*dt;p.grounded=false;for(const r of platforms)if(overlap(p,r)&&(!r.oneWay||(p.vy>0&&oldFeet<=r.y+1))){if(p.vy>0){p.y=r.y-p.h;p.grounded=true;p.superFlight=false;}else if(p.vy<0){p.y=r.y+r.h;}p.vy=0;}if(p.y>600){p.x=checkpoint;p.y=(groundAt(checkpoint+p.w/2)?.y||FLOOR)-p.h;p.vx=p.vy=0;p.superFlight=false;notify('구름이 받아 줬어! 여기서 다시 출발하자 ☁');}for(const c of coins)if(!c.got&&overlap(p,c)){c.got=true;collected++;score+=c.value||10;burst(c.x,c.y);hud();saveBest();}updateDrops(dt);if(mode!=='play')return;for(const z of monsters){if(z.defeated)continue;z.x+=z.vx*dt;if(z.x<z.min||z.x>z.max){z.x=Math.max(z.min,Math.min(z.max,z.x));z.vx*=-1;}if(z.flying){z.baseY=safeGround(z.x+z.w/2).y;const dragon=z.kind==='enderdragon';z.y=Math.max(42,z.baseY-z.h-(dragon?105:85)-(dragon?80:60)*Math.sin(clock*(dragon?.7:1.3)+z.flightPhase));}if(!p.hurtTime&&clock>=(z.reencounterAt||0)&&overlap(p,z)){encounter(z);break;}}if(mode==='play'){const impact=SunshineEnemyCombat.update(enemyCombat,dt,p,monsters,platforms);if(impact&&!p.hurtTime){p.vx=impact.direction*400;p.vy=impact.type==='wind'?-1400:-340;p.grounded=false;p.superFlight=impact.type==='wind';p.knockback=impact.type==='wind'?.22:.35;p.hurtTime=1.1;jumpBuffer=0;for(let i=0;i<10;i++)particles.push({x:p.x+p.w/2,y:p.y+20,vx:-impact.direction*(60+i*12),vy:-80+i*18,life:.3,color:i%2?'#fff4cf':'#f1a47c'});}}if(mode==='play'){const hit=SunshineWeapons.update(weapon,dt,p,monsters.filter(z=>clock>=(z.reencounterAt||0)),platforms);if(hit)encounter(hit);}if(mode==='play'&&p.x>WORLD-190){mode='clear';resetInputs();campaign.finishStage();const clearBadges=progress.clear(defeated,monsters.length);score+=200;saveBest();hud();$('clear-title').textContent=`레벨 ${campaign.snapshot().level} · 스테이지 ${campaign.snapshot().stage}, 도착했어!`;$('clear-copy').textContent=`이번 단계 ${defeated}마리 · 누적 ${progress.snapshot().total}마리! 깃발 보너스 +200점 · ${score}점`;if(clearBadges.length)$('clear-copy').textContent+=' · 새 배지 '+clearBadges.map(b=>b.icon+' '+b.title).join(', ');$('next').textContent=campaign.snapshot().stage===SunshineCampaign.STAGES?'레벨 테스트 시작하기 →':'다음 스테이지로 →';$('clear').showModal();}camera=Math.max(0,Math.min(WORLD-viewW,p.x-viewW*.36));for(const q of particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=500*dt;q.life-=dt;}particles=particles.filter(q=>q.life>0);}
function cloud(x,y,s=1){ctx.fillStyle='#ffffffb8';for(const [dx,dy,w,h] of [[0,15,90,20],[16,0,30,35],[40,8,34,27]])ctx.fillRect(x+dx*s,y+dy*s,w*s,h*s);}
function hill(x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w*.22,y-h*.68);ctx.lineTo(x+w*.42,y-h);ctx.lineTo(x+w*.63,y-h);ctx.lineTo(x+w,y);ctx.fill();}
function tree(x,y,s=1){rect(x+22*s,y-80*s,14*s,80*s,'#a48c68');rect(x-12*s,y-117*s,84*s,45*s,'#76a36c');rect(x,y-142*s,60*s,35*s,'#88b67b');rect(x+14*s,y-159*s,32*s,25*s,'#9ac88b');rect(x-4*s,y-111*s,12*s,10*s,'#a9cd89');}
function character(x,y,zombie=false,facing=1,moving=false){ctx.save();ctx.translate(Math.round(x+16),Math.round(y));ctx.scale(facing,1);const stride=moving?Math.sin(clock*14)*3:0;if(zombie){rect(-14,0,28,24,'#77945c');rect(-17,7,4,11,'#91ae72');rect(-10,4,21,18,'#a2bf7e');rect(-8,9,5,5,'#344f38');rect(5,9,5,5,'#344f38');rect(-3,18,8,3,'#637b4b');rect(-12,24,25,13,'#8186a5');rect(-18,24,7,7,'#a2bf7e');rect(13,23,10,7,'#a2bf7e');rect(-11,36,9,8+stride,'#536a68');rect(5,36,9,8-stride,'#536a68');}else{rect(-12,4,25,19,'#f4d4a0');rect(-14,0,28,9,'#64513f');rect(-14,8,6,7,'#64513f');rect(0,0,16,6,'#75614b');rect(5,12,3,4,'#4d4736');rect(11,18,5,3,'#e5b88a');rect(-12,24,25,14,'#e9b64b');rect(-14,24,6,11,'#f7cb60');rect(13,26,5,10,'#f4d4a0');rect(-10,37,9,7+stride,'#526f7b');rect(5,37,9,7-stride,'#526f7b');rect(-12,42+stride,12,4,'#405967');rect(4,42-stride,13,4,'#405967');rect(0,25,4,4,'#fff0b1');}ctx.restore();}
function drawMapDecor(){
 const decor=currentMap.decor;
 if(decor==='water'){rect(0,420,WORLD,60,'#80bdcb');for(let x=0;x<WORLD;x+=80)rect(x+Math.sin(clock)*8,429,40,3,'#b9e2dc');}
 for(let x=130,i=0;x<WORLD;x+=285,i++){const y=groundAt(x)?.y||430;
  if(decor==='mushrooms'){rect(x+15,y-65,16,65,'#ede1b9');rect(x-15,y-94,78,31,'#bc7e76');rect(x-3,y-105,53,17,'#d19386');rect(x,y-88,12,10,'#f4ddbe');rect(x+33,y-95,10,10,'#f4ddbe');}
  else if(decor==='ruins'){rect(x,y-120,28,120,'#97a4a2');rect(x-6,y-128,40,12,'#bdc7ba');for(let j=0;j<4;j++)rect(x+3,y-110+j*26,20,2,'#798f8c');}
  else if(decor==='crystals'){hill(x-15,y,55,85,'#ad9bc9');hill(x+25,y,40,55,'#86b6c4');rect(x+13,y-53,3,30,'#d7d5eb');}
  else if(decor==='clouds'){cloud(x,y-75,.65);rect(x+25,y-37,8,37,'#aaa6b2');}
  else if(decor==='apples'){tree(x,y,.8);for(let j=0;j<3;j++)rect(x-18+j*20,y-95-(j%2)*20,10,10,'#d87864');}
  else if(decor==='cactus'){rect(x,y-80,17,80,'#80a080');rect(x-20,y-55,24,12,'#80a080');rect(x-20,y-75,10,25,'#80a080');rect(x+17,y-40,24,12,'#80a080');rect(x+31,y-66,10,32,'#80a080');}
  else if(decor==='snow'){rect(x+16,y-80,12,80,'#9a938b');for(let j=0;j<3;j++){hill(x-18+j*7,y-22-j*25,80-j*14,60,'#8aafa5');hill(x-10+j*7,y-38-j*25,64-j*14,42,'#edf6f5');}text('❄',x+115,y-115,18,'#ffffff');}
  else if(decor==='bamboo'){for(let j=0;j<3;j++){const h=110+j*22;rect(x+j*22,y-h,9,h,'#7a9e69');for(let k=20;k<h;k+=25)rect(x+j*22,y-k,9,3,'#c1d59c');rect(x+j*22+8,y-h+30,19,6,'#80ae76');}}
  else if(decor==='lanterns'){rect(x,y-120,7,120,'#8b879b');rect(x,y-120,45,6,'#8b879b');rect(x+28,y-115,2,15,'#8b879b');rect(x+17,y-100,26,32,'#edc87d');rect(x+22,y-97,16,26,'#ffe8b0');text('✦',x+120,y-150,15,'#fff1c4');}
  else{tree(x,y,.55+(i%3)*.16);if(decor==='flowers')text('✿',x+96,y-4,19,i%2?'#e7bd7d':'#d59c99');}
 }
}
function drawDrops(){
 for(const d of drops){if(d.got)continue;const bounce=d.settled?Math.sin(clock*3+d.x)*2:0,y=d.y-bounce;
  ctx.fillStyle=(d.tier==='prism'||d.tier==='dragon')?'#b9a2df35':'#ffe6a540';ctx.beginPath();ctx.ellipse(d.x+18,d.baseY-5,45,12,0,0,Math.PI*2);ctx.fill();
  rect(d.x,y+5,36,27,(d.tier==='prism'||d.tier==='dragon')?'#8d78b4':'#af793d');rect(d.x-2,y,40,13,(d.tier==='prism'||d.tier==='dragon')?'#c4aae8':'#ebbd60');rect(d.x+3,y+15,30,13,(d.tier==='prism'||d.tier==='dragon')?'#a78ccb':'#ca954a');rect(d.x+15,y+8,7,12,'#fff1b2');
  text('✦',d.x-9,y+2,17,'#fff1b2');text('✦',d.x+48,y-10,12,'#fff1b2');SunshineWeapons.icon(ctx,d.weapon,d.x+18,y-25,.65);text(d.tier==='dragon'?'전설의 드래곤 보물':SunshineWeapons.catalog[d.weapon]?.name||'보물 상자',d.x+18,y-55,11,'#624777');
 }
}
function draw(){cameraY=Math.min(0,player.y-140);const t={...themes[level],...currentMap.palette};ctx.clearRect(0,0,viewW,480);rect(0,0,viewW,480,t.sky);rect(0,220,viewW,170,'#ffffff19');for(let i=0;i<9;i++)cloud(i*240-camera*.2,70+(i%3)*29,.7+(i%2)*.3);for(let i=0;i<9;i++)hill(i*420-camera*.28-130,390,490,180+(i%2)*50,t.far);for(let i=0;i<12;i++)hill(i*300-camera*.5-90,405,350,115+(i%3)*20,t.hill);ctx.save();ctx.translate(-Math.floor(camera),-Math.floor(cameraY));drawMapDecor();if(windPad){rect(windPad.x,windPad.y-8,windPad.w,8,'#81c5d2');for(let i=0;i<5;i++){const y=windPad.y-15-((clock*45+i*35)%180);ctx.strokeStyle='#dafbffaa';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(windPad.x+windPad.w/2+Math.sin(clock*3+i)*8,y,22-i*2,5,0,0,Math.PI*1.7);ctx.stroke();}text('↑ 5~7층',windPad.x+windPad.w/2,windPad.y-30,16,'#506746');}for(const p of platforms){if(p.x+p.w<camera||p.x>camera+viewW)continue;if(p.ground){rect(p.x,p.y,p.w,p.h,'#c5a37a');rect(p.x,p.y,p.w,13,t.grass);rect(p.x,p.y+13,p.w,6,'#a1bf75');for(let x=p.x+12;x<p.x+p.w;x+=32){rect(x,p.y+34,9,5,'#b4946d');rect(x+14,p.y+67,6,6,'#d4b58a');}for(let x=p.x+6;x<p.x+p.w;x+=22)rect(x,p.y-4,3,7,t.grass);}else{rect(p.x,p.y,p.w,p.h,p.windBonus?'#83bccb':'#b69261');rect(p.x,p.y,p.w,5,'#e7c889');for(let x=p.x;x<p.x+p.w;x+=48){rect(x+2,p.y+7,43,18,'#d8b479');rect(x+5,p.y+8,36,3,'#e4c38b');}}}for(const p of platforms)if(p.windBonus)text(p.floor+'층 · 바람 하늘길',p.x+p.w/2,p.y+34,11,'#506746');for(const c of coins)if(!c.got){const bob=Math.sin(clock*3+c.x)*3;rect(c.x+4,c.y+bob,10,21,'#d8a746');rect(c.x+1,c.y+4+bob,16,13,'#f6d674');rect(c.x+6,c.y+4+bob,3,12,'#fff1b2');}for(const z of monsters){if(!z.defeated){if(z.kind==='enderdragon'){ctx.fillStyle='#4b356d22';ctx.beginPath();ctx.ellipse(z.x+z.w/2,z.baseY-3,80,10,0,0,Math.PI*2);ctx.fill();for(let i=0;i<4;i++)rect(z.x+z.w/2-(z.vx>0?1:-1)*(80+i*16),z.y+z.h*.65+Math.sin(clock*3+i)*9,5-i*.7,5-i*.7,'#ba8bdc88');}drawMonster(ctx,z.kind,z.x,z.y,z.w,z.h,clock,z.attackCharge>0?z.attackFacing:(z.vx<0?-1:1));text(z.name,z.x+z.w/2,z.y-13,10,'#506746');}else{rect(z.x+12,z.baseY-18,4,18,'#7da75d');text('✿',z.x+14,z.baseY-20,25,'#f7e7a5');}}SunshineEnemyCombat.draw(ctx,enemyCombat,monsters);drawDrops();const flagX=WORLD-165,flagY=groundAt(flagX).y;rect(flagX,flagY-210,6,210,'#f5f0d3');rect(flagX+6,flagY-200,68,40,'#edbd58');text('✦',flagX+35,flagY-172,23,'#fff8d9');rect(flagX-16,flagY-8,38,8,'#a6b56b');text('GOAL',flagX+20,flagY-225,12,'#5b805c');ctx.save();if(player.hurtTime>0)ctx.globalAlpha=Math.floor(player.hurtTime*14)%2?.45:1;character(player.x,player.y,false,player.face,Math.abs(player.vx)>10&&mode==='play');ctx.restore();SunshineWeapons.draw(ctx,weapon,player);const equipped=rewardUI.equippedIcon();text((equipped?equipped+' ':'')+'선율',player.x+14,player.y-12,11,'#456b50');for(const p of particles)rect(p.x,p.y,5,5,p.color);ctx.restore();}
function resize(){const r=canvas.getBoundingClientRect();viewW=Math.round(480*r.width/r.height);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=viewW*dpr;canvas.height=480*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;camera=Math.max(0,Math.min(WORLD-viewW,player.x-viewW*.36));draw();}
let examAnswer='',examReviewIndex=-1,examResultShown=false,blastTimer=null,warmupQuestion=null;
function continueJourney(){
 const destination=campaign.continueAfterStage();
 if(destination==='test'){openLevelTest();return;}
 if(destination==='stage'){loadLevel();begin();}
}
function startAdventure(){
 const state=campaign.snapshot();
 if(state.awaitingTest){openLevelTest();return;}
 if(state.stageCompleted){continueJourney();return;}
 begin();
}
function openLevelTest(retry=false){
 if(!campaign.startTest(retry))return;
 stopBattleTimer();resetInputs();mode='exam';stageStartedAt=0;quizStartedAt=0;examAnswer='';examReviewIndex=-1;examResultShown=false;
 clearTimeout(blastTimer);$('exam-blast').hidden=true;$('level-test').classList.remove('is-blasting');$('intro').hidden=true;
 if(!$('level-test').open)$('level-test').showModal();
 $('level-test').scrollTop=0;renderExamQuestion();updateLevelTest();
}
function examInput(value){
 const state=campaign.snapshot();
 if(mode!=='exam'||state.test?.finished||examReviewIndex>=0){updateLevelTest();return;}
 if(value==='clear')examAnswer='';else if(value==='back')examAnswer=examAnswer.slice(0,-1);else if(examAnswer.length<2)examAnswer+=value;
 $('exam-answer').textContent=examAnswer||'?';
}
function renderExamProgress(state){
 const row=$('exam-progress');row.replaceChildren();
 state.exam.questions.forEach((q,i)=>{
  const dot=document.createElement('span'),answered=i<state.exam.answers.length,correct=answered&&state.exam.answers[i]===SunshineCampaign.solution(q);
  dot.className=answered?(correct?'correct':'missed'):i===state.exam.answers.length?'current':'';
  dot.textContent=answered?(correct?'✓':'·'):String(i+1);
  dot.setAttribute('aria-label',`${i+1}번 ${answered?(correct?'정답':'다시 연습'):'아직 풀지 않은 문제'}`);row.append(dot);
 });
}
function renderExamQuestion(){
 const state=campaign.snapshot();if(!state.exam)return;
 renderExamProgress(state);
 $('exam-level').textContent=`LEVEL ${state.level} · ${state.definition.name}`;
 if(state.test.finished){finishLevelTest();return;}
 const index=examReviewIndex>=0?examReviewIndex:state.exam.answers.length,q=state.exam.questions[index];
 $('exam-title').textContent=`레벨 ${state.level} 테스트 · 다음 모험의 문을 열자!`;
 $('exam-counter').textContent=`${index+1} / ${SunshineCampaign.QUESTION_COUNT}`;
 $('exam-question').hidden=false;$('exam-result').hidden=true;
 $('exam-a').textContent=q.a;$('exam-b').textContent=q.b;$('exam-operator').textContent=q.operator;$('exam-answer').textContent=examAnswer||'?';
 $('exam-keypad').hidden=examReviewIndex>=0;$('exam-submit').hidden=examReviewIndex>=0;$('exam-next').hidden=examReviewIndex<0;
 const blocks=$('exam-blocks');blocks.replaceChildren();$('exam-block-help').open=false;
 const operands=q.operator==='×'?Array(q.b).fill(q.a):[q.a,q.b];
 operands.forEach((n,i)=>{
  const well=document.createElement('section'),label=document.createElement('b'),grid=document.createElement('div');
  label.textContent=q.operator==='×'?`${i+1}묶음 · ${n}개`:`${n}개`;grid.className='exam-ten-frame';
  for(let j=0;j<n;j++){const block=document.createElement('span');block.className=i%2?'blue':'orange';grid.append(block);}
  well.append(label,grid);blocks.append(well);
 });
 if(examReviewIndex<0){$('exam-feedback').textContent=`${state.test.correct}개 정답 · 목표는 11개! 한 문제씩 차근차근 풀어 봐.`;$('exam-feedback').className='';}
}
function submitExamAnswer(){
 const state=campaign.snapshot();if(mode!=='exam'||state.test?.finished||examReviewIndex>=0){updateLevelTest();return;}
 if(!examAnswer){$('exam-feedback').textContent='먼저 숫자로 답을 써 줘.';return;}
 const index=state.exam.answers.length,q=state.exam.questions[index],correct=Number(examAnswer)===SunshineCampaign.solution(q);
 if(!campaign.submitTest(Number(examAnswer))){updateLevelTest();return;}
 examReviewIndex=index;renderExamQuestion();
 if(campaign.snapshot().test.finished)return;
 $('exam-feedback').textContent=correct?`${q.a} ${q.operator} ${q.b} = ${SunshineCampaign.solution(q)} · 맞혔어! 다음 문제도 차근차근.`:`${q.a} ${q.operator} ${q.b} = ${SunshineCampaign.solution(q)} · 이 문제는 결과 화면에서 같이 연습하자.`;
 $('exam-feedback').className=correct?'correct':'missed';$('exam-next').focus({preventScroll:true});
}
function nextExamQuestion(){if(mode!=='exam'||examReviewIndex<0)return;examReviewIndex=-1;examAnswer='';renderExamQuestion();$('level-test').scrollTop=0;}
function updateLevelTest(){
 if(mode!=='exam')return;
 const state=campaign.snapshot();if(!state.exam)return;
 const seconds=Math.ceil(state.test.remainingMs/1000),timer=$('exam-timer');
 timer.querySelector('b').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
 timer.classList.toggle('urgent',!state.test.finished&&seconds<=60);
 if(state.test.finished&&!examResultShown)finishLevelTest();
}
function learningHint(q){
 if(q.operator==='×')return `${q.a}개씩 ${q.b}묶음이야. ${Array(q.b).fill(q.a).join(' + ')} = ${SunshineCampaign.solution(q)}. 묶음을 하나씩 세어 봐.`;
 if(q.a<10&&q.b<10&&q.a+q.b>=10){const need=10-q.a;return `${q.a}에는 ${need}개만 더 있으면 10이야. ${q.b}를 ${need}과 ${q.b-need}로 나누면, 10 + ${q.b-need} = ${q.a+q.b}!`;}
 if(q.a>=10){return `10개 묶음은 ${Math.floor(q.a/10)} + ${Math.floor(q.b/10)}묶음, 낱개는 ${q.a%10} + ${q.b%10}개야. 함께 더하면 ${q.a+q.b}개!`;}
 return `${q.a}개에서 시작해서 ${q.b}개를 더 세면 ${q.a+q.b}개야.`;
}
function finishLevelTest(){
 if(examResultShown)return;
 const state=campaign.snapshot();if(!state.test?.finished)return;
 examResultShown=true;examReviewIndex=-1;examAnswer='';$('exam-question').hidden=true;
 renderExamProgress(state);
 const r=state.test;$('exam-counter').textContent=`${r.correct} / 15 정답`;
 $('exam-result-art').textContent=r.passed?'🏅':'🛠️';
 $('exam-result-title').textContent=r.passed?'숫자 도전 성공!':r.reason==='time'?'TNT가 펑! 다음에는 끝까지 도전해 보자!':'TNT가 펑! 배운 만큼 다시 도전하자!';
 const growth=r.previousCorrect!==null&&r.correct>r.previousCorrect?` 지난번보다 ${r.correct-r.previousCorrect}개 더 맞혔어!`:'';
 $('exam-result-copy').textContent=r.passed?`15문제 중 ${r.correct}개 정답 (${r.percentage.toFixed(1)}%)! ${state.level===3?'레벨 1부터 새로운 모험을 시작하자.':'레벨 '+(state.level+1)+' 모험이 열렸어!'}`:
  `${r.answered}문제를 풀고 ${r.correct}개를 맞혔어.${growth} ${r.reason==='time'?'다음 목표는 10분 안에 15문제를 끝까지 풀기야.':`통과까지 ${Math.max(0,11-r.correct)}개 더! 놓친 문제 하나를 배우고 다시 해 보자.`}`;
 $('exam-action').textContent=r.passed?(state.level===3?'보물과 함께 레벨 1로 돌아가기 →':'다음 레벨 모험 시작 →'):'TNT 다시 장전! 10분 재도전 →';
 const review=$('exam-review');review.replaceChildren();warmupQuestion=null;
 state.exam.questions.forEach((q,i)=>{
  const value=state.exam.answers[i],correct=value===SunshineCampaign.solution(q),li=document.createElement('li');
  li.textContent=`${q.a} ${q.operator} ${q.b} = ${SunshineCampaign.solution(q)} · ${value===undefined?'아직 풀지 못했어':correct?'정답 ✓':'내 답 '+value+' · 다시 연습'}`;
  li.className=correct?'correct':'missed';review.append(li);if(!correct&&!warmupQuestion)warmupQuestion=q;
 });
 $('exam-warmup').hidden=r.passed;$('exam-warmup').open=false;$('warmup-answer').value='';$('warmup-feedback').textContent='';
 if(warmupQuestion){$('warmup-question').textContent=`${warmupQuestion.a} ${warmupQuestion.operator} ${warmupQuestion.b} = ?`;$('warmup-hint').textContent=learningHint(warmupQuestion);}
 if(r.passed){$('exam-result').hidden=false;$('exam-action').focus({preventScroll:true});}
 else playExamBlast();
}
function playExamBlast(){
 const dialog=$('level-test'),pieces=$('blast-pieces');pieces.replaceChildren();
 for(let i=0;i<42;i++){
  const piece=document.createElement('i'),angle=i*Math.PI*2/42,distance=90+Math.random()*240;
  piece.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);piece.style.setProperty('--dy',`${Math.sin(angle)*distance}px`);piece.style.setProperty('--spin',`${i*43}deg`);piece.style.background=['#e88747','#f3c35b','#846759','#f5dfa9'][i%4];pieces.append(piece);
 }
 $('exam-result').hidden=true;$('exam-blast').hidden=false;dialog.classList.add('is-blasting');dialog.scrollTop=0;
 clearTimeout(blastTimer);blastTimer=setTimeout(()=>{dialog.classList.remove('is-blasting');$('exam-blast').hidden=true;$('exam-result').hidden=false;$('exam-action').focus({preventScroll:true});},1800);
}
$('exam-submit').onclick=submitExamAnswer;$('exam-next').onclick=nextExamQuestion;
$('exam-action').onclick=()=>{
 const state=campaign.snapshot();if(!state.test?.finished)return;
 if(state.test.passed){if(!campaign.advanceLevel())return;$('level-test').close();loadLevel();begin();notify(state.level===3?'새로운 모험 한 바퀴! 모은 보물은 그대로야.':'새 레벨이 열렸어!');}
 else openLevelTest(true);
};
$('warmup-check').onclick=()=>{
 if(!warmupQuestion)return;
 const value=$('warmup-answer').value;
 $('warmup-feedback').textContent=/^\d{1,2}$/.test(value)&&Number(value)===SunshineCampaign.solution(warmupQuestion)?'🌟 배운 방법으로 한 문제 해결! 이제 다시 도전할 준비가 됐어.':'힌트를 보며 한 번 더 세어 보자. 천천히 해도 괜찮아.';
};
$('level-test').addEventListener('cancel',e=>e.preventDefault());
for(const v of ['1','2','3','4','5','6','7','8','9','clear','0','back']){
 const button=document.createElement('button');button.textContent=v==='clear'?'지우기':v==='back'?'⌫':v;button.dataset.digit=v;button.type='button';button.setAttribute('aria-label',v==='clear'?'모두 지우기':v==='back'?'한 자리 지우기':v);button.onclick=()=>examInput(v);$('exam-keypad').append(button);
}

function frame(now){updateLevelTest();updateSuperJump();updateBattleTimer();updateStageTimer(now);if(last)accumulator+=Math.min((now-last)/1000,.05);last=now;while(accumulator>=1/120){step(1/120);accumulator-=1/120;}draw();requestAnimationFrame(frame);}
// Keep iPad taps and holds inside the game: prevent zoom-in and text selection/callout
for(const eventName of ['dblclick','selectstart','contextmenu','dragstart']){
 document.addEventListener(eventName,event=>{
  event.preventDefault();
 },{capture:true,passive:false});
}
document.addEventListener('selectionchange',()=>{
 const sel=window.getSelection();
 if(sel&&sel.rangeCount>0&&!sel.isCollapsed)sel.removeAllRanges();
});
for(const gestureEvent of ['gesturestart','gesturechange','gestureend']){
 document.addEventListener(gestureEvent,e=>e.preventDefault(),{capture:true,passive:false});
}
let lastTouchEnd=0;
document.addEventListener('touchend',e=>{
 const now=performance.now();
 if(now-lastTouchEnd<=300){
  const el=e.target instanceof Element?e.target:e.target?.parentElement;
  if(!el?.closest('button, a, input, textarea, select, [role="button"], [data-control], .move-block')){
   e.preventDefault();
  }
 }
 lastTouchEnd=now;
},{passive:false});
const map={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump'};
document.addEventListener('keydown',e=>{if(mode==='exam'){if(e.target instanceof HTMLInputElement)return;if(/^\d$/.test(e.key)){e.preventDefault();examInput(e.key);}else if(e.key==='Backspace'){e.preventDefault();examInput('back');}else if(e.key==='Enter'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();$('exam-next').hidden?submitExamAnswer():nextExamQuestion();}return;}if(mode==='quiz'){if(/^\d$/.test(e.key)){e.preventDefault();input(e.key);}else if(e.key==='Backspace'){e.preventDefault();input('back');}else if(e.key==='Enter'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();solved?closeQuiz():submit();}return;}if(document.querySelector('dialog[open]'))return;if(e.key==='Escape'&&document.body.classList.contains('game-only')&&!document.fullscreenElement){e.preventDefault();gameOnly(false);return;}if(e.key==='Escape'||e.key==='p'||e.key==='P'){if(mode==='play'){e.preventDefault();pause();}return;}if(mode!=='play')return;const action=map[e.key];if(action){e.preventDefault();if(action==='jump'&&!keys.has(action))jumpBuffer=.15;keys.add(action);}});
document.addEventListener('keyup',e=>{if(map[e.key])keys.delete(map[e.key]);});
for(const b of document.querySelectorAll('[data-control]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);down(b.dataset.control,e.pointerId);});for(const evt of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(evt,e=>touch.delete(e.pointerId));}
window.addEventListener('blur',()=>{resetInputs();if(!fullscreenTransition)pause();});document.addEventListener('visibilitychange',()=>{updateLevelTest();updateBattleTimer();if(document.hidden&&!fullscreenTransition){resetInputs();pause();}});
for(const v of ['1','2','3','4','5','6','7','8','9','clear','0','back']){const b=document.createElement('button');b.textContent=v==='clear'?'지우기':v==='back'?'⌫':v;b.dataset.digit=v;b.setAttribute('aria-label',v==='back'?'한 자리 지우기':v==='clear'?'모두 지우기':v);b.onclick=()=>input(v);$('keypad').append(b);}
$('start').onclick=startAdventure;$('pause').onclick=pause;$('resume').onclick=resume;$('tnt-restart').onclick=restartAfterTnt;$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('tnt-dialog').addEventListener('cancel',e=>{e.preventDefault();restartAfterTnt();});$('quiz').addEventListener('cancel',e=>{e.preventDefault();closeQuiz();});$('clear').addEventListener('cancel',e=>e.preventDefault());$('submit').onclick=submit;$('continue').onclick=closeQuiz;$('retreat').onclick=closeQuiz;
$('restart').onclick=()=>{if(!['play','intro'].includes(mode)||!campaign.restart())return;consecutiveLosses=0;loadLevel();begin();notify('레벨 1부터 새로운 모험! 모은 보물과 배지는 그대로야.');};
$('next').onclick=()=>{if(mode!=='clear')return;$('clear').close();continueJourney();};
// Read-only state for browser regression tests and local diagnostics.
window.sunshine={snapshot:()=>({mode,level,stageNumber,difficultyLevel:campaign.snapshot().level,campaign:campaign.snapshot(),map:{id:currentMap.id,name:currentMap.name,length:WORLD,goal:WORLD-190},stageRemainingMs:stageRemaining(),drops:drops.map(d=>({...d})),collection:progress.collection(),progress:progress.snapshot(),score,collected,defeated,windPad:windPad?{...windPad}:null,coins:coins.map(c=>({...c})),enemyProjectiles:enemyCombat.projectiles.map(p=>({...p})),weapon:{...weapon,arrows:weapon.arrows.map(a=>({...a}))},player:{...player},camera,cameraY,checkpoint,monsters:monsters.map(z=>({...z})),zombies:monsters.map(z=>({...z})),platforms:platforms.map(p=>({...p})),answer,movedBlocks,movedOrange,consecutiveLosses,battle:{outcome:battleOutcome,durationMs:battleDurationMs,remainingMs:battleOutcome==='pending'?Math.max(0,battleDeadline-performance.now()):0}})};
loadLevel();if(campaign.snapshot().awaitingTest)$('start').textContent='레벨 테스트 이어서 하기 →';new ResizeObserver(resize).observe(canvas);requestAnimationFrame(frame);
})();
