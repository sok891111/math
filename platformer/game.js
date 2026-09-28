'use strict';
(() => {
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const themes=[{name:'초록빛 들판',sky:'#bee5df',hill:'#9bcca0',far:'#c0dac0',grass:'#8eb05e'},{name:'노을빛 버섯 숲',sky:'#f2dec8',hill:'#b7bf91',far:'#d7cfac',grass:'#94a666'},{name:'반짝이는 하늘 정원',sky:'#cbdfee',hill:'#a8bad0',far:'#c6d2df',grass:'#8faea1'}];
const {catalog,worlds,draw:drawMonster,portrait}=window.MonsterArt;
let progressStorage;try{progressStorage=localStorage;}catch{progressStorage={getItem:()=>null,setItem:()=>{}};}
const progress=SunshineProgress.create(progressStorage);
const rewardUI=createRewardUI(progress),pickMap=SunshineMaps.createPicker(progressStorage);
let currentMap,drops=[],wrongAttempts=0,runId=globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random();
let fullscreenTransition=false,fullscreenTransitionTimer=null;
let stageNumber=1;
const BATTLE_MS=15000;
let battleOutcome='idle',battleDeadline=0,battleTimer=null,battleWarned=false;
const SAVE='seonyul-sunshine-best-v1';let best=0;try{best=Number(localStorage.getItem(SAVE))||0;}catch{} $('best').innerHTML=`${best} <small>점</small>`;
let mode='intro',level=0,score=0,collected=0,defeated=0,camera=0,viewW=960,active=null,answer='',solved=false,clock=0,toastUntil=0,movedBlocks=0;
let player,platforms,monsters,coins,particles=[],checkpoint=70,last=0,accumulator=0,jumpBuffer=0,coyote=0;
const keys=new Set(),touch=new Map(),FLOOR=390;let WORLD=3260;
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function text(s,x,y,size=12,color='#486447'){ctx.font=`700 ${size}px "Apple SD Gothic Neo", sans-serif`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(s,x,y);}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function resetInputs(){keys.clear();touch.clear();jumpBuffer=0;}
function hud(){
 const stats=progress.snapshot();$('chapter').textContent='STAGE '+String(stageNumber).padStart(2,'0');$('world-name').textContent=currentMap.name;$('scene-text').textContent=currentMap.name+' · 맵 '+(SunshineMaps.layouts.findIndex(m=>m.id===currentMap.id)+1)+' / 6';$('score').textContent=score;$('coins').textContent=collected;$('rescued').textContent=stats.total;$('badge-count').textContent=stats.badgeCount;$('open-badges').setAttribute('aria-label','잡은 몬스터 '+stats.total+'마리, 배지 '+stats.badgeCount+'개. 배지 앨범 열기');rewardUI.dashboard();
}
function groundAt(x){return platforms.find(p=>p.ground&&x>=p.x&&x<p.x+p.w);}
function loadLevel(){
 currentMap=pickMap();level=currentMap.theme;WORLD=currentMap.length;platforms=currentMap.platforms;drops=[];
 player={x:70,y:groundAt(84).y-46,w:28,h:46,vx:0,vy:0,grounded:true,face:1};checkpoint=70;camera=0;defeated=0;coyote=.1;particles=[];
 monsters=currentMap.spawns.map((x,i)=>{const kind=worlds[level][i],m=catalog[kind],ground=groundAt(x);return {id:runId+':'+stageNumber+':'+i+':'+Math.random(),kind,name:m.name,x,y:ground.y-m.h,baseY:ground.y,w:m.w,h:m.h,min:Math.max(ground.x+8,x-45),max:Math.min(ground.x+ground.w-m.w-8,x+65),vx:m.speed,defeated:false,q:null};});
 renderGuide();coins=[];
 for(const p of platforms.filter(p=>!p.ground))for(let x=p.x+25;x<p.x+p.w-10;x+=43)coins.push({x,y:p.y-28,w:17,h:22,got:false});
 for(let x=160;x<WORLD-220;x+=190){const floor=groundAt(x);if(floor&&x+17<floor.x+floor.w)coins.push({x,y:floor.y-43,w:17,h:22,got:false});}
 hud();
}

function renderGuide(){
 const list=$('monster-guide');list.replaceChildren();
 for(const kind of worlds[level]){
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
 if(badges.length){const summary=document.createElement('div');summary.className='new-badge';summary.textContent='🏅 새 배지 '+badges.length+'개! 보물상자를 주우며 크게 펼쳐 봐.';box.append(summary);}
}
let albumPrevious='intro';
function openBadges(){if(!['intro','play','pause'].includes(mode))return;albumPrevious=mode;mode='album';resetInputs();rewardUI.renderAlbum();$('badge-album').showModal();}
function closeBadges(){$('badge-album').close();mode=albumPrevious;resetInputs();hud();if(mode==='play')canvas.focus({preventScroll:true});}
$('open-badges').onclick=openBadges;$('collection-open').onclick=openBadges;$('close-badges').onclick=closeBadges;$('badge-album').addEventListener('cancel',e=>{e.preventDefault();closeBadges();});
function makeDrop(monster,badges,elapsedMs){
 const perfect=wrongAttempts===0,fast=elapsedMs<=5000,tier=perfect&&fast?'prism':perfect?'gold':'sun';
 const direction=Math.random()<.5?-1:1;
  drops.push({id:monster.id,kind:monster.kind,x:monster.x+monster.w/2-18,y:monster.baseY-32,w:36,h:32,baseY:monster.baseY,
  vx:direction*(95+Math.random()*85),vy:-(255+Math.random()*85),bounced:false,settled:false,
  gems:3+(perfect?1:0)+(fast?2:0),points:tier==='prism'?300:tier==='gold'?200:120,tier,age:0,got:false,badges});
}
function collectDrop(drop){
 if(drop.got)return;const result=progress.claim(drop);if(!result)return;
 drop.got=true;score+=drop.points;saveBest();burst(drop.x,drop.y);hud();mode='loot';resetInputs();player.vx=0;
 rewardUI.reveal(drop,[...drop.badges,...result.unlocked],()=>{mode='play';resetInputs();canvas.focus({preventScroll:true});});
}
function updateDrops(dt){
 for(const drop of drops){if(drop.got)continue;drop.age+=dt;
  if(!drop.settled){
   const oldBottom=drop.y+drop.h;drop.vy+=1050*dt;drop.x+=drop.vx*dt;drop.y+=drop.vy*dt;drop.vx*=Math.pow(.18,dt);
   // Treasure lands on the walkable ground so Seonyul can reach it without
   // requiring a surprise jump onto a high ledge.
   const surface=platforms.find(p=>p.ground&&drop.x+drop.w*.55>p.x&&drop.x+drop.w*.45<p.x+p.w&&drop.y+drop.h>=p.y&&oldBottom<=p.y+8);
   if(surface){drop.y=surface.y-drop.h;drop.baseY=surface.y;if(!drop.bounced){drop.bounced=true;drop.vy=-125;drop.vx*=.35;}else{drop.vy=0;drop.vx=0;drop.settled=true;}}
   if(drop.y>600){drop.y=drop.baseY-drop.h;drop.vy=drop.vx=0;drop.settled=true;}
  }
  if(drop.age>.75&&drop.settled&&Math.abs(player.x+player.w/2-drop.x-drop.w/2)<42&&Math.abs(player.y+player.h-drop.baseY)<55){collectDrop(drop);break;}
 }
}

function notify(s){$('toast').textContent=s;toastUntil=clock+3;$('toast').classList.add('show');}
function saveBest(){if(score<=best)return;best=score;try{localStorage.setItem(SAVE,String(best));}catch{}$('best').innerHTML=`${best} <small>점</small>`;}
function burst(x,y){for(let i=0;i<28;i++)particles.push({x,y,vx:(Math.random()-.5)*220,vy:-Math.random()*210,life:1.1,color:['#f4cc64','#fffbd9','#91b979'][i%3]});}
function begin(){mode='play';$('intro').hidden=true;resetInputs();canvas.focus({preventScroll:true});}
function pause(){if(mode!=='play')return;mode='pause';resetInputs();$('pause-dialog').showModal();}
function resume(){$('pause-dialog').close();mode='play';resetInputs();canvas.focus({preventScroll:true});}
function stopBattleTimer(){if(battleTimer!==null){clearInterval(battleTimer);battleTimer=null;}}
function cancelBlockDrag(){if(blockDrag){blockDrag.ghost?.remove();blockDrag=null;}}
function loseBattle(){
 if(mode!=='quiz'||battleOutcome!=='pending')return;
 battleOutcome='lost';progress.lose();stopBattleTimer();cancelBlockDrag();resetInputs();
 $('battle-timer').dataset.state='lost';$('battle-timer').classList.remove('urgent');$('battle-seconds').textContent='시간 끝';$('battle-timer').style.setProperty('--time-left','0%');
 $('quiz-title').textContent=`${active.name}의 승리!`;$('monster-greeting').textContent='이번엔 몬스터가 이겼어. 다시 도전할 수 있어!';
 $('feedback').textContent='15초가 지났어! 처치 수와 배지는 늘어나지 않아.';$('feedback').className='wrong';
 renderBlocks();$('block-workspace').hidden=true;$('badge-reward').hidden=true;$('keypad').hidden=true;$('submit').hidden=true;$('retreat').hidden=true;
 $('continue').textContent='다시 도전하러 가기 →';$('continue').hidden=false;$('continue').focus();
}
function updateBattleTimer(){
 if(mode!=='quiz'||battleOutcome!=='pending')return;
 const remaining=battleDeadline-performance.now();
 if(remaining<=0){loseBattle();return;}
 const seconds=Math.ceil(remaining/1000),timer=$('battle-timer');timer.dataset.state='pending';timer.classList.toggle('urgent',seconds<=5);timer.style.setProperty('--time-left',`${remaining/BATTLE_MS*100}%`);
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
function encounter(z){wrongAttempts=0;stopBattleTimer();battleOutcome='pending';mode='quiz';active=z;z.q=progress.nextQuestion();$('badge-reward').hidden=true;$('block-workspace').hidden=false;answer='';solved=false;resetInputs();$('a').textContent=z.q[0];$('b').textContent=z.q[1];$('answer').textContent='?';$('feedback').textContent='숫자를 누르거나 키보드로 답을 써 줘.';$('feedback').className='';movedBlocks=0;renderBlocks();$('keypad').hidden=false;$('submit').hidden=false;$('continue').hidden=true;$('continue').textContent='멋져! 모험 계속하기 →';$('retreat').hidden=false;$('quiz-title').textContent=`${z.name}의 덧셈 도전!`;$('monster-greeting').textContent=catalog[z.kind].greeting;portrait($('monster-portrait'),z.kind);$('monster-portrait').dataset.kind=z.kind;$('quiz').showModal();$('submit').focus();battleDeadline=performance.now()+BATTLE_MS;battleWarned=false;$('timer-announcement').textContent='';updateBattleTimer();battleTimer=setInterval(updateBattleTimer,100);}
function input(value){if(!canAnswer())return;if(value==='clear')answer='';else if(value==='back')answer=answer.slice(0,-1);else if(answer.length<2)answer+=value;$('answer').textContent=answer||'?';}
function submit(){
 if(!canAnswer())return;
 if(!answer){$('feedback').textContent='먼저 숫자로 답을 써 줘.';return;}
 if(Number(answer)!==active.q[0]+active.q[1]){wrongAttempts++;$('feedback').textContent='아직 시간이 있어! 블록을 옮겨 다시 세어 봐.';$('feedback').className='wrong';answer='';$('answer').textContent='?';return;}
 const elapsedMs=BATTLE_MS-(battleDeadline-performance.now());
 battleOutcome='won';stopBattleTimer();$('battle-timer').classList.remove('urgent');$('battle-timer').dataset.state='won';$('battle-seconds').textContent='승리!';solved=true;cancelBlockDrag();renderBlocks();active.defeated=true;defeated++;
 const earned=progress.award(active.kind,{elapsedMs,perfect:wrongAttempts===0,tenFrame:movedBlocks===10-active.q[0],mapId:currentMap.id});
 makeDrop(active,earned,elapsedMs);showNewBadges(earned);score+=100;
 const floor=groundAt(active.x+active.w/2);checkpoint=Math.min(active.x+65,floor.x+floor.w-player.w-8);
 saveBest();hud();$('feedback').textContent=active.q[0]+' + '+active.q[1]+' = '+answer+' · 승리 +100점';$('feedback').className='correct';$('quiz-title').textContent=active.name+', 정화 성공!';$('monster-greeting').textContent='몬스터 자리에 보물상자가 떨어졌어! 가까이 가서 주워 봐.';renderGuide();$('block-workspace').hidden=true;$('keypad').hidden=true;$('submit').hidden=true;$('retreat').hidden=true;$('continue').textContent='보물 주우러 가기 →';$('continue').hidden=false;$('continue').focus();burst(active.x,active.y);
}

function closeQuiz(){updateBattleTimer();stopBattleTimer();cancelBlockDrag();if(solved){notify('보물상자 발견! 가까이 가면 보석과 배지가 반짝 ✦');}else{player.x=Math.max(groundAt(active.x).x+8,active.x-125);player.y=(groundAt(player.x+player.w/2)?.y||active.baseY)-player.h;player.vx=0;player.vy=0;notify(battleOutcome==='lost'?'이번에는 몬스터가 이겼어! 다시 도전해 보자.':'준비되면 다시 만나자!');}$('quiz').close();mode='play';active=null;battleOutcome='idle';resetInputs();canvas.focus({preventScroll:true});}
// Blue blocks retain their identity and color while regrouping; orange blocks stay put.
let blockDrag=null,suppressBlockClickUntil=0;
function renderBlocks(){
 const [a,b]=active.q,left=$('left-blocks'),right=$('right-blocks');left.replaceChildren();right.replaceChildren();
 for(const side of ['left','right'])for(let i=0;i<10;i++){
  const fixed=side==='left'&&i<a;
  const blue=side==='left'?i>=a&&i<a+movedBlocks:i<b-movedBlocks;
  const cell=document.createElement(blue?'button':'span');cell.className='move-block '+(fixed?'orange':blue?'blue':'empty');
  if(blue){cell.type='button';cell.dataset.side=side;cell.disabled=battleOutcome!=='pending';cell.setAttribute('aria-label',side==='left'?'파란 블록 오른쪽으로 돌려놓기':'파란 블록 왼쪽으로 옮기기');cell.addEventListener('click',()=>{if(performance.now()>suppressBlockClickUntil)moveBlock(side);});cell.addEventListener('pointerdown',startBlockDrag);}
  else cell.setAttribute('aria-label',fixed?'주황 블록':'빈칸');
  (side==='left'?left:right).append(cell);
 }
 $('left-count').textContent=`${a+movedBlocks} / 10`;$('right-count').textContent=`${b-movedBlocks}개`;
 $('block-explanation').textContent=movedBlocks===10-a?`열 칸 완성! 10개와 남은 파란 블록을 더해 봐.`:`${a}개에 파란 블록 ${10-a-movedBlocks}개를 더 옮기면 10이 돼!`;
 $('reset-blocks').disabled=battleOutcome!=='pending'||movedBlocks===0;
}
function moveBlock(side){
 if(!canAnswer())return;
 if(side==='right'&&movedBlocks<10-active.q[0]&&movedBlocks<active.q[1])movedBlocks++;
 else if(side==='left'&&movedBlocks>0)movedBlocks--;
 else return;
 renderBlocks();
}
function startBlockDrag(e){
 if(!canAnswer()||e.button!==0||blockDrag)return;
 const button=e.currentTarget;button.setPointerCapture(e.pointerId);
 blockDrag={id:e.pointerId,side:button.dataset.side,x:e.clientX,y:e.clientY,dragged:false,ghost:null};
}
document.addEventListener('pointermove',e=>{
 if(!blockDrag||blockDrag.id!==e.pointerId)return;
 const d=blockDrag;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>6)d.dragged=true;
 if(!d.dragged)return;
 if(!d.ghost){d.ghost=document.createElement('span');d.ghost.className='block-ghost';d.ghost.setAttribute('aria-hidden','true');$('quiz').append(d.ghost);}
 d.ghost.style.left=`${e.clientX-14}px`;d.ghost.style.top=`${e.clientY-14}px`;
});
function endBlockDrag(e){
 if(!blockDrag||blockDrag.id!==e.pointerId)return;
 const d=blockDrag;blockDrag=null;d.ghost?.remove();
 if(d.dragged){suppressBlockClickUntil=performance.now()+400;
  if(e.type==='pointerup'){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.frame-well');if(target&&target.dataset.side!==d.side)moveBlock(d.side);}
 }
}
document.addEventListener('pointerup',endBlockDrag);document.addEventListener('pointercancel',endBlockDrag);
$('reset-blocks').onclick=()=>{if(canAnswer()){movedBlocks=0;renderBlocks();}};
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
function step(dt){clock+=dt;if(clock>toastUntil)$('toast').classList.remove('show');if(mode!=='play')return;const p=player;jumpBuffer=Math.max(0,jumpBuffer-dt);coyote=p.grounded?.1:Math.max(0,coyote-dt);const dir=Number(held('right'))-Number(held('left'));const target=dir*235;p.vx+=Math.max(-1550*dt,Math.min(1550*dt,target-p.vx));if(dir)p.face=dir;if(jumpBuffer>0&&coyote>0){p.vy=-590;p.grounded=false;coyote=0;jumpBuffer=0;}p.vy+=1550*dt;if(!held('jump')&&p.vy<-250)p.vy+=1600*dt;p.vy=Math.min(p.vy,760);p.x+=p.vx*dt;for(const r of platforms)if(overlap(p,r)){if(p.vx>0)p.x=r.x-p.w;else if(p.vx<0)p.x=r.x+r.w;p.vx=0;}p.x=Math.max(0,Math.min(WORLD-p.w,p.x));p.y+=p.vy*dt;p.grounded=false;for(const r of platforms)if(overlap(p,r)){if(p.vy>0){p.y=r.y-p.h;p.grounded=true;}else if(p.vy<0){p.y=r.y+r.h;}p.vy=0;}if(p.y>600){p.x=checkpoint;p.y=(groundAt(checkpoint+p.w/2)?.y||FLOOR)-p.h;p.vx=p.vy=0;notify('구름이 받아 줬어! 여기서 다시 출발하자 ☁');}for(const c of coins)if(!c.got&&overlap(p,c)){c.got=true;collected++;score+=10;burst(c.x,c.y);hud();saveBest();}updateDrops(dt);if(mode!=='play')return;for(const z of monsters){if(z.defeated)continue;z.x+=z.vx*dt;if(z.x<z.min||z.x>z.max){z.x=Math.max(z.min,Math.min(z.max,z.x));z.vx*=-1;}if(overlap(p,z)){encounter(z);break;}}if(mode==='play'&&p.x>WORLD-190){mode='clear';resetInputs();const clearBadges=progress.clear(defeated,monsters.length);score+=200;saveBest();hud();$('clear-title').textContent=`스테이지 ${stageNumber}, 도착했어!`;$('clear-copy').textContent=`이번 단계 ${defeated}마리 · 누적 ${progress.snapshot().total}마리! 깃발 보너스 +200점 · ${score}점`;if(clearBadges.length)$('clear-copy').textContent+=' · 새 배지 '+clearBadges.map(b=>b.icon+' '+b.title).join(', ');$('next').textContent='다음 단계로 →';$('clear').showModal();}camera=Math.max(0,Math.min(WORLD-viewW,p.x-viewW*.36));for(const q of particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=500*dt;q.life-=dt;}particles=particles.filter(q=>q.life>0);}
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
  else{tree(x,y,.55+(i%3)*.16);if(decor==='flowers')text('✿',x+96,y-4,19,i%2?'#e7bd7d':'#d59c99');}
 }
}
function drawDrops(){
 for(const d of drops){if(d.got)continue;const bounce=d.settled?Math.sin(clock*3+d.x)*2:0,y=d.y-bounce;
  ctx.fillStyle=d.tier==='prism'?'#b9a2df35':'#ffe6a540';ctx.beginPath();ctx.ellipse(d.x+18,d.baseY-5,45,12,0,0,Math.PI*2);ctx.fill();
  rect(d.x,y+5,36,27,d.tier==='prism'?'#8d78b4':'#af793d');rect(d.x-2,y,40,13,d.tier==='prism'?'#c4aae8':'#ebbd60');rect(d.x+3,y+15,30,13,d.tier==='prism'?'#a78ccb':'#ca954a');rect(d.x+15,y+8,7,12,'#fff1b2');
  text('✦',d.x-9,y+2,17,'#fff1b2');text('✦',d.x+48,y-10,12,'#fff1b2');text('보물 +'+d.gems+'💎',d.x+18,y-18,11,'#7a623d');
 }
}
function draw(){const t=themes[level];ctx.clearRect(0,0,viewW,480);rect(0,0,viewW,480,t.sky);rect(0,220,viewW,170,'#ffffff19');for(let i=0;i<9;i++)cloud(i*240-camera*.2,70+(i%3)*29,.7+(i%2)*.3);for(let i=0;i<9;i++)hill(i*420-camera*.28-130,390,490,180+(i%2)*50,t.far);for(let i=0;i<12;i++)hill(i*300-camera*.5-90,405,350,115+(i%3)*20,t.hill);ctx.save();ctx.translate(-Math.floor(camera),0);drawMapDecor();for(const p of platforms){if(p.x+p.w<camera||p.x>camera+viewW)continue;if(p.ground){rect(p.x,p.y,p.w,p.h,'#c5a37a');rect(p.x,p.y,p.w,13,t.grass);rect(p.x,p.y+13,p.w,6,'#a1bf75');for(let x=p.x+12;x<p.x+p.w;x+=32){rect(x,p.y+34,9,5,'#b4946d');rect(x+14,p.y+67,6,6,'#d4b58a');}for(let x=p.x+6;x<p.x+p.w;x+=22)rect(x,p.y-4,3,7,t.grass);}else{rect(p.x,p.y,p.w,p.h,'#b69261');rect(p.x,p.y,p.w,5,'#e7c889');for(let x=p.x;x<p.x+p.w;x+=48){rect(x+2,p.y+7,43,18,'#d8b479');rect(x+5,p.y+8,36,3,'#e4c38b');}}}for(const c of coins)if(!c.got){const bob=Math.sin(clock*3+c.x)*3;rect(c.x+4,c.y+bob,10,21,'#d8a746');rect(c.x+1,c.y+4+bob,16,13,'#f6d674');rect(c.x+6,c.y+4+bob,3,12,'#fff1b2');}for(const z of monsters){if(!z.defeated){drawMonster(ctx,z.kind,z.x,z.y,z.w,z.h,clock,z.vx<0?-1:1);text(z.name,z.x+z.w/2,z.y-13,10,'#506746');}else{rect(z.x+12,z.baseY-18,4,18,'#7da75d');text('✿',z.x+14,z.baseY-20,25,'#f7e7a5');}}drawDrops();const flagX=WORLD-165,flagY=groundAt(flagX).y;rect(flagX,flagY-210,6,210,'#f5f0d3');rect(flagX+6,flagY-200,68,40,'#edbd58');text('✦',flagX+35,flagY-172,23,'#fff8d9');rect(flagX-16,flagY-8,38,8,'#a6b56b');text('GOAL',flagX+20,flagY-225,12,'#5b805c');character(player.x,player.y,false,player.face,Math.abs(player.vx)>10&&mode==='play');const equipped=rewardUI.equippedIcon();text((equipped?equipped+' ':'')+'선율',player.x+14,player.y-12,11,'#456b50');for(const p of particles)rect(p.x,p.y,5,5,p.color);ctx.restore();}
function resize(){const r=canvas.getBoundingClientRect();viewW=Math.round(480*r.width/r.height);const dpr=Math.min(devicePixelRatio||1,2);canvas.width=viewW*dpr;canvas.height=480*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;camera=Math.max(0,Math.min(WORLD-viewW,player.x-viewW*.36));draw();}
function frame(now){updateBattleTimer();if(last)accumulator+=Math.min((now-last)/1000,.05);last=now;while(accumulator>=1/120){step(1/120);accumulator-=1/120;}draw();requestAnimationFrame(frame);}
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
document.addEventListener('keydown',e=>{if(mode==='quiz'){if(/^\d$/.test(e.key)){e.preventDefault();input(e.key);}else if(e.key==='Backspace'){e.preventDefault();input('back');}else if(e.key==='Enter'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();solved?closeQuiz():submit();}return;}if(mode==='album'||mode==='loot')return;if(e.key==='Escape'&&document.body.classList.contains('game-only')&&!document.fullscreenElement){e.preventDefault();gameOnly(false);return;}if(e.key==='Escape'||e.key==='p'||e.key==='P'){if(mode==='play'){e.preventDefault();pause();}return;}if(mode!=='play')return;const action=map[e.key];if(action){e.preventDefault();if(action==='jump'&&!keys.has(action))jumpBuffer=.15;keys.add(action);}});
document.addEventListener('keyup',e=>{if(map[e.key])keys.delete(map[e.key]);});
for(const b of document.querySelectorAll('[data-control]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);down(b.dataset.control,e.pointerId);});for(const evt of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(evt,e=>touch.delete(e.pointerId));}
window.addEventListener('blur',()=>{resetInputs();if(!fullscreenTransition)pause();});document.addEventListener('visibilitychange',()=>{updateBattleTimer();if(document.hidden&&!fullscreenTransition){resetInputs();pause();}});
for(const v of ['1','2','3','4','5','6','7','8','9','clear','0','back']){const b=document.createElement('button');b.textContent=v==='clear'?'지우기':v==='back'?'⌫':v;b.dataset.digit=v;b.setAttribute('aria-label',v==='back'?'한 자리 지우기':v==='clear'?'모두 지우기':v);b.onclick=()=>input(v);$('keypad').append(b);}
$('start').onclick=begin;$('pause').onclick=pause;$('resume').onclick=resume;$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});$('quiz').addEventListener('cancel',e=>{e.preventDefault();closeQuiz();});$('clear').addEventListener('cancel',e=>e.preventDefault());$('submit').onclick=submit;$('continue').onclick=closeQuiz;$('retreat').onclick=closeQuiz;
$('restart').onclick=()=>{if(mode==='quiz'||mode==='clear')return;stageNumber=1;level=score=collected=0;loadLevel();begin();notify('새로운 모험을 시작해 보자!');};$('next').onclick=()=>{$('clear').close();stageNumber++;level=(stageNumber-1)%themes.length;loadLevel();begin();};
// Read-only state for browser regression tests and local diagnostics.
window.sunshine={snapshot:()=>({mode,level,stageNumber,map:{id:currentMap.id,name:currentMap.name,length:WORLD,goal:WORLD-190},drops:drops.map(d=>({...d})),collection:progress.collection(),progress:progress.snapshot(),score,collected,defeated,player:{...player},camera,checkpoint,monsters:monsters.map(z=>({...z})),zombies:monsters.map(z=>({...z})),platforms:platforms.map(p=>({...p})),answer,movedBlocks,battle:{outcome:battleOutcome,remainingMs:battleOutcome==='pending'?Math.max(0,battleDeadline-performance.now()):0}})};
loadLevel();new ResizeObserver(resize).observe(canvas);requestAnimationFrame(frame);
})();
