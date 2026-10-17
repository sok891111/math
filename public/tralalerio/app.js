import {createPhoneAnimation,LAB_CALL_PAGES,finishLabCall} from './phone-call.js?v=20261017-learning4';
import {installTouchGuard} from './touch-guard.js?v=20261017-learning4';
installTouchGuard();
import {createTrainerEncounter,rivalEncounterPlan} from './trainer-encounter.js?v=20261017-learning4';
import {chapterGoal,storyInteraction,storyEntry} from './chapter.js?v=20261017-learning4';
import {createHealingAnimation} from './healing-animation.js?v=20261017-learning4';
import {npcDialogue,signDialogue,LESSONS} from './npc-dialogue.js?v=20261017-learning4';
import {trainerName,personalize,walkingPose,PlayerWalk} from './overworld-player.js?v=20261016-capture3';
import {Game} from './engine.js?v=20261017-learning4';
import {createBattleView} from './battle-view.js?v=20261017-learning4';
const $=s=>document.querySelector(s);const canvas=$('#screen'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
import {createEncounterTransition,transitionData} from './battle-transition.js?v=20261016-skills1';
const playerName=trainerName(window.__BLOCK_USER__);const playerWalk=new PlayerWalk();
const encounterTransition=createEncounterTransition(document.querySelector('.screen-wrap'));
const healing=createHealingAnimation(document.querySelector('.screen-wrap'));
const phone=createPhoneAnimation(document.querySelector('.screen-wrap'));
const trainerScene=createTrainerEncounter(document.querySelector('.screen-wrap'));
const KEY=window.__BLOCK_USER__?.id?`tralalerio-save-v1:${window.__BLOCK_USER__.id}`:'tralalerio-save-v1';let game,images={},dialog=null,menu=false,toastTimer,nextMove=0;const held=new Set();
function persist(){if(!game)return;try{localStorage.setItem(KEY,game.serialize())}catch{toast('브라우저 저장소를 확인해 주세요.')}}
const battleUI=createBattleView(()=>game,update,persist,()=>{held.clear();update()});
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600)}
function say(speaker,pages,done=null,choices=null){dialog={speaker,pages:(Array.isArray(pages)?pages:[pages]).map(text=>personalize(text,playerName)),index:0,done,choices};renderDialog();held.clear()}
function renderDialog(){const el=$('#dialog');el.hidden=!dialog;if(!dialog)return;$('#speaker').textContent=dialog.speaker;$('#dialog-text').textContent=dialog.pages[dialog.index];$('#choices').replaceChildren();const choosing=dialog.index===dialog.pages.length-1&&dialog.choices;$('#dialog-next').hidden=!!choosing;if(choosing)for(const [label,fn]of dialog.choices){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{dialog=null;el.hidden=true;fn();canvas.focus({preventScroll:true})};$('#choices').append(b)}}
function advance(){if(!dialog)return;if(dialog.phone){const marker=game.state.phoneCall;if(marker&&dialog.index+1<dialog.pages.length){marker.page=dialog.index+1;persist();}}if(dialog.index===dialog.pages.length-1&&dialog.choices){$('#choices button')?.focus();return}if(++dialog.index>=dialog.pages.length){const done=dialog.done;dialog=null;renderDialog();done?.();update();}else renderDialog()}
function showStoryEvent(event){if(event.phone){resumePhoneCall();return;}say(event.speaker,event.pages);}
async function resumePhoneCall(){
 const marker=game.state.phoneCall;if(!marker||phone.active())return;held.clear();menu=false;$('#menu').hidden=true;persist();
 if(marker.phase==='ring'){await phone.ring();if(game.state.phoneCall!==marker)return;marker.phase='talk';persist();}
 if(marker.phase==='talk'){
  phone.showCaller();say('공박사',LAB_CALL_PAGES,()=>{marker.phase='hangup';persist();endPhoneCall(marker);});dialog.index=marker.page;dialog.phone=true;renderDialog();return;
 }
 phone.showCaller();await endPhoneCall(marker);
}
async function endPhoneCall(marker){await phone.hangup();if(game.state.phoneCall===marker){finishLabCall(game.state);held.clear();persist();update();canvas.focus({preventScroll:true});}}
function update(){if(!game)return;$('#location').textContent=game.map.name;$('#trainer-name').textContent=playerName;$('#trainer-menu-title').textContent=playerName+'의 모험 기록';for(const f of ['mom','town','starter','route','city','mapCard'])$('#quest-'+f).classList.toggle('done',!!game.state.flags[f]);if(game.state.flags.easyStart){const quests=[['mom','피카츄와 출발하기','연구실에서 바로 시작해요.',true],['town','포켓몬 할아버지 만나기','무궁시티 북쪽 30번 도로예요.',game.state.flags.mysteryEgg],['starter','알을 연구실에 전하기','서쪽 길을 되돌아 박사님께 가요.',game.state.flags.eggDelivered],['route','30·31번 도로 걷기','30번 도로의 왼쪽 길로 가요.',game.state.flags.eggDelivered&&game.state.flags.violet],['city','도라지시티 도착하기','체육관과 모다피탑을 둘러봐요.',game.state.flags.violet],['mapCard','비상에게 윙배지 받기','도라지 체육관 관장에게 도전해요.',game.state.flags.zephyr]];for(const [id,title,hint,done]of quests){const row=$('#quest-'+id);row.querySelector('b').textContent=title;row.querySelector('small').textContent=hint;row.classList.toggle('done',!!done)}}const p=game.state.party?.[0];$('#partner').textContent=p?`${game.battleData.species[p.species].name} · Lv. ${p.level} · HP ${p.hp}/${p.stats.hp}`:game.state.starter?`${game.state.starter} · Lv. 5`:'아직 만나지 않았어요.';$('#party').textContent=(game.state.party?.length?game.state.party.map(p=>`${game.battleData.species[p.species].name} Lv.${p.level} HP ${p.hp}/${p.stats.hp}`).join(' / '):'아직 함께하는 포켓몬이 없어요.')+` / 소지금 ${game.state.money.toLocaleString()}원 · 상처약 ${game.state.potions}개 · 몬스터볼 ${game.state.balls||0}개${game.state.items?.MYSTERY_EGG?' · 중요한 물건: 이상한 알':''}${game.state.flags.zephyr?' · 윙배지 ★':''}`;$('#battle-hint').textContent=chapterGoal(game.state)+' 공격 기술을 고르면 50% 확률로 강력한 공격 도전이 나와요.';}

function toggleMenu(force){if(game?.state.phoneCall)return;if(game?.state.trainerEncounter||trainerScene.active())return;if(!game||encounterTransition.active()||healing.active())return;if(battleUI.active()){battleUI.key('Escape');return;}if(dialog){if(dialog.choices){dialog=null;renderDialog()}else{dialog=null;renderDialog()}return}menu=force??!menu;$('#menu').hidden=!menu;held.clear();if(menu)$('#close-menu').focus();else canvas.focus({preventScroll:true});update()}
function save(){if(!game)return;try{localStorage.setItem(KEY,game.serialize());$('#save-note').textContent='방금 모험을 저장했어요.';toast('모험을 저장했어요. 다음에 여기서 만나요!')}catch{toast('브라우저에서 저장을 허용하지 않았어요.')}}
function load(){if(game?.state.phoneCall)return;if(healing.active()||game?.state.trainerEncounter)return;try{const raw=localStorage.getItem(KEY);if(!raw||!game.restore(raw)){toast('불러올 수 있는 모험 기록이 없어요.');return}playerWalk.reset();menu=false;$('#menu').hidden=true;dialog=null;renderDialog();battleUI.close();if(game.battle)battleUI.show();if(game.state.healing)resumeHealing();if(game.state.trainerEncounter)resumeTrainerEncounter();if(game.state.phoneCall)resumePhoneCall();update();toast('저장한 모험을 불러왔어요.')}catch{toast('모험 기록을 읽지 못했어요.')}}
function speakWithLesson(info){
 const lesson=LESSONS[info.lesson];
 say(info.speaker,info.pages,null,[['같이 생각해 볼래요',()=>{
  const quiz=()=>say(info.speaker,lesson.question,null,lesson.choices.map((label,i)=>[label,()=>say(info.speaker,i===lesson.correct?[lesson.success,'어떻게 찾았는지 말해 줘도 좋아. 다음 모험에서 또 만나!']:[lesson.hint,'틀려도 괜찮아. 다시 살펴보면 새로운 것이 보여.'],null,i===lesson.correct?null:[['다시 생각해 볼래요',quiz],['모험하러 갈래요',()=>{}]])]));quiz();
 }],['모험하러 갈래요',()=>{}]]);
}
async function resumeHealing(){
 if(!game.state.healing||healing.active())return;held.clear();menu=false;$('#menu').hidden=true;dialog=null;renderDialog();
 const marker=game.state.healing;
 try{await healing.play(marker.count)}finally{
  if(game.state.healing===marker){game.finishHealing();update();persist();say('포켓몬센터',['친구들이 모두 힘을 되찾았어요!','골드, 쉬어 가는 것도 좋은 생각이야. 다음에는 어떤 방법으로 풀어 볼까?']);}
 }
}
function startHealing(){if(game.beginHealing()){persist();resumeHealing()}}
function revealBattle(){encounterTransition.play(canvas,{onCovered:async()=>{battleUI.show(true);await Promise.all([...document.querySelectorAll('#battle-screen img')].map(i=>i.decode().catch(()=>{})))},onReveal:()=>{battleUI.show();const screen=document.querySelector('#battle-screen');if(!matchMedia('(prefers-reduced-motion: reduce)').matches){screen.classList.add('battle-arriving');setTimeout(()=>screen.classList.remove('battle-arriving'),650)}},onDone:()=>{held.clear();document.querySelector('#battle-screen button:not(:disabled)')?.focus({preventScroll:true})}});}
async function resumeTrainerEncounter(){
 const marker=game.state.trainerEncounter;if(!marker||trainerScene.active())return;held.clear();menu=false;$('#menu').hidden=true;dialog=null;renderDialog();persist();
 await trainerScene.play(marker);if(game.state.trainerEncounter!==marker)return;game.state.facing={up:'down',down:'up',left:'right',right:'left'}[marker.direction];playerWalk.reset();persist();beginTrainer(marker.id,marker.kind==='rival'?['포켓몬과 함께 여행하는구나! 우리도 실력을 겨뤄 보자.']:null);
}
function beginTrainer(id,pages=null){const t=game.battleData.trainers[id];if(!t||game.state.battle)return;say(t.name,pages||t.introPages||['내 포켓몬과 승부를 겨뤄 보자!'],()=>{if(game.startTrainer(id)){held.clear();trainerScene.clear();persist();revealBattle();}});}
function act(){if(game?.state.phoneCall){if(dialog?.phone)advance();return;}
 if(!game||trainerScene.active()||encounterTransition.active()||healing.active())return;
 if(playerWalk.sample({map:game.state.map,x:game.state.x,y:game.state.y},performance.now()).jumping)return;
 if(battleUI.active()){battleUI.key('z');return;}if(menu){toggleMenu(false);return}if(dialog){advance();return}
 const o=game.target();if(!o){const c=game.map.collision[game.state.y+({up:-1,down:1}[game.state.facing]||0)]?.[game.state.x+({left:-1,right:1}[game.state.facing]||0)];if(game.state.map==='PlayersHouse2F')say('내 방',['골드의 작은 생각 탐험이 시작돼!','오른쪽 위 계단으로 내려가 엄마에게 인사해 보자.']);else if(c?.includes('WATER'))say('물가',['큰 물결, 작은 물결이 차례로 와.','같은 모양이 반복되는지 찾아볼까?']);return}
 const story=storyInteraction(game,o);if(story){persist();update();if(story.trainer)beginTrainer(story.trainer,story.pages);else if(story.trade)say(story.speaker,story.pages,null,[['교환할래요',()=>{const ok=game.tradeOnix();persist();update();say(story.speaker,ok?'모다피와 롱스톤을 교환했다! 롱스톤이 새로운 동료가 되었다!':'파티에 모다피가 없네. 모다피와 함께 오면 교환할 수 있어.')}],['다음에 할게요',()=>{}]]);else say(story.speaker,story.pages);return;}
 const script=o.script||'';
 if(game.state.map==='Route29'&&script==='Route29Potion'){game.state.flags.routePotion=true;game.state.potions++;say('작은 보물 발견',['상처약 1개를 찾았어!','지친 친구에게 써도 좋고, 센터에서 함께 쉬어도 좋아.'],()=>save());return}
 if(o.sprite==='clerk'){say('프렌들리숍',[`모험에 쓸 물건을 같이 골라 볼까?\n소지금: ${game.state.money.toLocaleString()}원`,'상처약은 300원, 몬스터볼은 200원이야. 필요한 만큼 골라 봐.'],null,[['상처약 사기',()=>{if(game.buyPotion())say('점원',`상처약을 1개 샀어.\n남은 돈: ${game.state.money.toLocaleString()}원`,()=>save());else say('점원','지금 가진 돈으로는 부족하네. 친구들과 더 산책하고 와도 좋아.')}],['몬스터볼 사기',()=>{if(game.buyBall())say('점원',`몬스터볼을 1개 샀어.\n남은 돈: ${game.state.money.toLocaleString()}원`,()=>save());else say('점원','돈을 조금 더 모은 다음에 다시 만나자.')}],['그만둘게요',()=>{}]]);return}
 if(o.sprite==='nurse'){
  if(!game.state.party.length){say('포켓몬센터',['여기는 친구들이 쉬는 곳이야.','연구소에서 첫 동료를 만나면 함께 들러 줘!']);return}
  say('포켓몬센터',['골드, 어서 오세요! 포켓몬센터입니다.','함께 온 포켓몬을 회복시켜 드릴까요?'],null,[['치료해 주세요',()=>say('포켓몬센터','좋아. 친구들을 잠깐 맡아 줄게.',startHealing)],['조금 더 모험할래요',()=>say('포켓몬센터','그래, 쉬고 싶을 때 언제든 와. 천천히 가도 괜찮아!')]]);return;
 }
 if(o.sprite==='gramps'&&game.state.map==='CherrygroveCity'){say('안내 할아버지',game.state.flags.mapCard?['골드, 지도를 보고 길을 찾아왔구나!','다음에는 보석이 있는 길부터 눈으로 따라가 보렴.']:['무궁시티에 잘 왔구나, 골드!','빨간 지붕은 친구들이 쉬는 센터란다. 이 지도 카드로 길을 살펴보렴. 북쪽 30번 도로를 지나면 도라지시티로 갈 수 있단다.'],()=>{game.state.flags.mapCard=true;update();persist()});return}
 if(o.sprite==='mom'){say('엄마',game.state.flags.mom?['여행은 잘하고 있니? 포켓몬과 함께 잠깐 쉬고 가렴.','공박사님께 받은 심부름은 연구실에서 확인해 보렴.']:['잘 잤니, 골드? 공박사님이 너를 찾고 계시더라.','북쪽 연구소에 들러 보렴. 여행 중 다치면 엄마에게 돌아와도 괜찮아.'],()=>{game.state.flags.mom=true;game.healParty();update();persist();toast('엄마에게 인사했어요. 첫 동료를 만나러 가 볼까요?')});return}
 if(o.sprite==='elm'){say('공박사',game.state.starter?[`${game.state.starter}와 잘 지내고 있니?`,'포켓몬 할아버지의 집은 무궁시티에서 북쪽 30번 도로에 있단다.']:['반가워, 골드! 여기는 생각 탐험 연구소야.','오른쪽 볼에서 첫 동료를 골라 봐. 조각을 맞추면 동료의 기술이 힘을 얻는단다.']);return}
 if(o.sprite==='poke_ball'){const name=({CyndaquilPokeBallScript:'브케인',TotodilePokeBallScript:'리아코',ChikoritaPokeBallScript:'치코리타'})[script]||'치코리타';const type=({'브케인':'불꽃','리아코':'물','치코리타':'풀'})[name];say('첫 파트너',[`${type} 친구 ${name}!\n이 친구와 생각 탐험을 떠날까?`],null,[['함께할래요',()=>{game.chooseStarter(name);update();say('공박사',[`${name}가 네 첫 동료가 되었어!`,'싸운다에서 기술을 고르고 문제를 풀면 동료가 공격해. 서두르지 않아도 돼.','몬스터볼 5개도 챙겼어. 서쪽 29번 도로에서 새 친구를 만나 보렴.'],()=>save())}],['다시 생각할게요',()=>{}]]);return}
 if(o.sprite){speakWithLesson(npcDialogue(game.state.map,o));return}
 say('표지판',signDialogue(game.state.map,script));
}
function move(dir){if(game?.state.phoneCall)return;if(game?.state.trainerEncounter||trainerScene.active()||encounterTransition.active()||healing.active())return;if(battleUI.active()){battleUI.key({up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[dir]);return}if(!game||dialog||menu)return;if(playerWalk.sample({map:game.state.map,x:game.state.x,y:game.state.y},performance.now()).jumping)return;const before={map:game.state.map,x:game.state.x,y:game.state.y};const result=game.move(dir);if(result.type==='trainer-spotted'){playerWalk.begin(before,{map:game.state.map,x:game.state.x,y:game.state.y},performance.now());resumeTrainerEncounter();return;}if(result.type==='encounter'){playerWalk.reset();held.clear();persist();revealBattle();return}if(result.type==='partner-required'){say('모험을 떠나기 전에','공박사 연구소에서 첫 파트너를 만난 뒤 29번 도로로 나가 보세요.');return}if(result.type==='boundary')return;if(['step','warp'].includes(result.type)){playerWalk.begin(before,{map:game.state.map,x:game.state.x,y:game.state.y},performance.now());if(result.type==='warp'){update();toast(game.map.name);const event=storyEntry(game);if(event){held.clear();persist();update();showStoryEvent(event);return;}}if(game.state.map==='CherrygroveCity'&&[6,7].includes(game.state.y)&&game.state.x===33&&game.state.flags.mysteryEgg&&!game.state.flags.rivalDone&&!game.state.flags['trainer:CherrygroveRival']){const marker=rivalEncounterPlan(game);if(marker){game.state.trainerEncounter=marker;game.state.facing='right';resumeTrainerEncounter();}}}}
function sprite(name,x,y,dir='down',pose=null){
 const image=images[name]||images.teacher;if(!image)return;
 const {frame,flip,mirrorLegs}=pose||walkingPose(dir,false);
 ctx.save();ctx.translate(Math.round(x)+(flip?16:0),Math.round(y));if(flip)ctx.scale(-1,1);
 if(mirrorLegs){
  ctx.drawImage(image,0,frame*16,16,11,0,0,16,11);
  ctx.save();ctx.translate(16,0);ctx.scale(-1,1);ctx.drawImage(image,0,frame*16+11,16,5,0,11,16,5);ctx.restore();
 }else ctx.drawImage(image,0,frame*16,16,16,0,0,16,16);
 ctx.restore();
}
function draw(now){
 requestAnimationFrame(draw);if(!game)return;
 if(held.size&&now>=nextMove){move([...held].at(-1));nextMove=now+145}
 ctx.fillStyle='#dbe7ba';ctx.fillRect(0,0,160,144);
 const map=game.map,position=playerWalk.sample({map:game.state.map,x:game.state.x,y:game.state.y},now);
 const {x,y}=position;
 const ox=Math.round(map.width<=10?(160-map.width*16)/2:-Math.max(0,Math.min(map.width*16-160,x*16-72)));
 const oy=Math.round(map.height<=9?(144-map.height*16)/2:-Math.max(0,Math.min(map.height*16-144,y*16-64)));
 ctx.drawImage(images[map.id],ox,oy);
 healing.draw(ctx,ox,oy);
 const objects=game.objects();if(game.state.trainerEncounter?.kind==='rival')objects.push({trainer:'CherrygroveRival',sprite:'rival',x:39,y:game.state.y,direction:'left'});
 const actors=objects.map(o=>({...o,dir:o.sprite==='nurse'?healing.nurseDirection():o.sprite==='rival'?'right':o.sprite==='mom'?'left':['up','down','left','right'].includes(o.direction)?o.direction:'down'})).map(o=>trainerScene.actor(o,game.state.trainerEncounter,now));
 actors.push({x,y,sprite:'chris',dir:game.state.facing,player:true});actors.sort((a,b)=>a.y-b.y);
 for(const actor of actors){
  if(actor.hidden)continue;
  if(actor.player&&position.jumping){ctx.fillStyle='#536d5655';ctx.beginPath();ctx.ellipse(ox+actor.x*16+8,oy+actor.y*16+11,5-position.elevation*.08,2,0,0,Math.PI*2);ctx.fill();}
  sprite(actor.sprite,ox+actor.x*16,oy+actor.y*16-4-(actor.player?position.elevation:0),actor.dir,actor.player?walkingPose(actor.dir,position.walking,position.foot,position.progress):actor.trainerWalking?walkingPose(actor.dir,true,actor.trainerFoot,actor.trainerProgress):null);
 }
 trainerScene.draw(ctx,ox,oy,game.state.trainerEncounter,now);
}
for(const type of ['dblclick','contextmenu','selectstart','dragstart','gesturestart','gesturechange','gestureend'])document.addEventListener(type,e=>e.preventDefault(),{passive:false});
const keys={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
window.addEventListener('keydown',e=>{if(trainerScene.active()){e.preventDefault();return;}if(healing.active()){if(e.target.closest('#healing-status button'))return;e.preventDefault();return;}if(document.querySelector('.math-dialog[open]'))return;if(!game||e.ctrlKey||e.metaKey||e.altKey)return;if(encounterTransition.active()){e.preventDefault();return}if(battleUI.active()){e.preventDefault();if(!e.repeat)battleUI.key(e.key);return}if(dialog?.choices&&e.target.closest('#choices')){if(e.key==='Escape'||e.key==='x'){e.preventDefault();dialog=null;renderDialog();canvas.focus()}return}if(e.target.tagName==='BUTTON'&&e.key==='Enter')return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(keys[k]){e.preventDefault();if(!held.has(keys[k])){move(keys[k]);nextMove=performance.now()+165}held.add(keys[k]);}else if(['z','Enter',' '].includes(k)){e.preventDefault();if(!e.repeat)act()}else if(['x','Escape'].includes(k)){e.preventDefault();if(!e.repeat)toggleMenu()}});
window.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(keys[k])held.delete(keys[k])});window.addEventListener('blur',()=>held.clear());document.addEventListener('visibilitychange',()=>held.clear());
for(const b of document.querySelectorAll('[data-move]')){b.onpointerdown=e=>{e.preventDefault();if(game?.state.trainerEncounter||trainerScene.active()||encounterTransition.active()||healing.active())return;b.setPointerCapture(e.pointerId);move(b.dataset.move);held.add(b.dataset.move);nextMove=performance.now()+165};b.onpointerup=b.onpointercancel=()=>held.delete(b.dataset.move);b.onlostpointercapture=()=>held.delete(b.dataset.move)}
$('#party-menu').onclick=()=>{if(game?.state.phoneCall)return;if(game?.state.trainerEncounter||encounterTransition.active()||healing.active())return;menu=false;$('#menu').hidden=true;held.clear();battleUI.openParty()};$('#dialog-next').onclick=advance;$('#menu-button').onclick=()=>toggleMenu();$('#touch-menu').onclick=()=>toggleMenu();$('#touch-action').onclick=act;$('#save-button').onclick=save;$('#save-menu').onclick=save;$('#load-menu').onclick=load;$('#close-menu').onclick=()=>toggleMenu(false);$('#restart').onclick=()=>{if(game?.state.phoneCall)return;if(game?.state.trainerEncounter||healing.active())return;menu=false;$('#menu').hidden=true;say('새로운 모험','피카츄와 연구실에서 새 모험을 시작할까요?\n현재 저장 기록이 새 모험으로 바뀌어요.',null,[['처음부터',()=>{battleUI.close();game=new Game(game.maps,game.battleData);game.startAdventure();persist();playerWalk.reset();update();toast('피카츄와 함께 연구실에서 출발해요!')}],['계속할래요',()=>{}]])};
async function init(){try{const res=await fetch('assets/maps.json?v=20261017-learning4', {cache:'no-store'});if(!res.ok)throw Error('맵 파일을 읽을 수 없어요');const maps=await res.json();const sprites=await (await fetch('assets/sprites.json?v=20261017-learning4', {cache:'no-store'})).json();const names=[...Object.keys(maps),...sprites];await Promise.all(names.map(n=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[n]=im;resolve()};im.onerror=()=>reject(Error('그래픽 로딩 실패: '+n));im.src=`assets/${n}.png?v=20261017-learning4`;})));const battleData=await(await fetch('assets/battle-data.json?v=20261017-learning4',{cache:'no-store'})).json();game=new Game(maps,battleData);try{const raw=localStorage.getItem(KEY);if(raw&&game.restore(raw))toast('지난 모험을 이어서 시작해요.')}catch{}if(!game.state.starter)game.startAdventure();transitionData().catch(()=>{});$('#loading').hidden=true;update();canvas.focus({preventScroll:true});if(game.battle)battleUI.show();healing.prepare().catch(()=>{});if(game.state.healing)resumeHealing();if(game.state.trainerEncounter)resumeTrainerEncounter();const event=storyEntry(game);if(event){persist();showStoryEvent(event);}persist();requestAnimationFrame(draw);}catch(e){$('#loading').textContent=`로딩하지 못했어요. 새로고침해 주세요. (${e.message})`;console.error(e)}}
init();
