import {WORLD_FOV} from './zoom-lock.js';
import {rewardHotbar} from './reward-hotbar.js';
import {hurtPush} from './hurt-feedback.js';
import {updateGroundLoot} from './ground-loot.js';
import {heartCount,tickHearts,spendHearts} from './hearts.js';
import {advanceTime,isNight} from './day-night.js';
import {LOOT_ITEMS,collectLoot,eatFood,heartCapacity} from './loot.js';
import {WEAPONS,isWeapon,validEquipment} from './weapons.js';
import {worldEntry, adventureURL, blocksEmpty, shouldShowEmptyNotice, createTravel, departure, arrival} from '../world-travel.js';
import {VoxelWorld,BLOCKS,DEFAULT_BAR,FORMAT,SIZE,HEIGHT,collides,intersectsPlayer,movePlayer,raycast,validateSave} from './world.js';
import {makeAtlas,WorldRenderer} from './renderer.js';
import {EasyControls,EditHistory,groundPlayer,easyTarget} from './easy-controls.js';
import {AnimalWorld,ANIMALS} from './animals.js';
import {createInventory,countBlock,planInventoryEdit,reverseInventoryEdit,applyRewards} from './inventory.js';
import {RewardClient} from './reward-client.js';

const $=s=>document.querySelector(s),canvas=$('#world');
const profile=(new URLSearchParams(location.search).get('user')||'').trim().slice(0,80);
const KEY='magic-english-block-world-v1'+(profile?':'+profile:''),SETTINGS=KEY+':settings';
let stock=createInventory(),selectedFood=null;
let emptyNoticeAcknowledged=false,emptyNoticeReadyAt=Infinity;
const atlas=makeAtlas();let animals=null,tool='stick',animalTarget=null,lastAttack=-Infinity;let view,world,player,bar=[...DEFAULT_BAR],slot=0,active=false,mode='welcome',worldName='나의 작은 세계',started=false;
let dirty=false,saved=null,storageError=false,readError=false,category='전체',selected=null,toastTimer,lastFrame=performance.now(),saveAt=0,lastAction=0,swing=0,heldButton=null,lastForward=0,toggleSprint=false,grounded=false,velocity={x:0,y:0,z:0},lastFoot=0;
const keys=new Set(),touchMove={x:0,z:0},easy=new EasyControls(),history=new EditHistory();const easyPointers=new Map();let easyAim=null,allBlocks=false;
const isEasy=()=>settings.controls==='easy';
let lookPointer=null,joyPointer=null,confirmAction=null,audio=null,settings={fov:75,sensitivity:100,distance:96,sound:true,cycle:true,dayCycleVersion:1,controls:'easy'};
const errorMessage=error=>error instanceof Error?error.message:String(error);
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
function status(message){$('#save-status').textContent=message;}
function fail(error){console.error(error);setPanel('error-panel');$('#error-message').textContent='이 브라우저에서 WebGL을 사용할 수 있는지 확인해 주세요. '+errorMessage(error);}
function clearInput(){keys.clear();easy.release();easyPointers.clear();toggleSprint=false;touchMove.x=touchMove.z=0;velocity.x=velocity.z=0;heldButton=null;lookPointer=null;joyPointer=null;$('#stick').style.transform='';for(const b of document.querySelectorAll('[data-easy-direction]'))b.classList.remove('pressed');}
function setPanel(id){mode=id||'playing';active=!id&&started&&heartCount(stock)>0;updateAdventureGuide();clearInput();$('#overlay').hidden=!id;for(const panel of document.querySelectorAll('#overlay > section'))panel.hidden=panel.id!==id;if(id){if(document.pointerLockElement)document.exitPointerLock();requestAnimationFrame(()=>[...($('#'+id)?.querySelectorAll('button,input,select,summary')||[])].find(el=>el.getClientRects().length&&el.tagName!=='INPUT')?.focus({preventScroll:true}));}}
async function resume(){if(!started)return;setPanel(null);canvas.focus();if(!isEasy()&&!document.body.classList.contains('touch')){try{await canvas.requestPointerLock?.();}catch{toast('화면을 드래그하면 시점을 움직일 수 있어요.');}}}
function pause(){if(!started)return;persist();setPanel('pause-panel');}
function ask(title,copy,action){$('#confirm-title').textContent=title;$('#confirm-copy').textContent=copy;confirmAction=action;setPanel('confirm-panel');}
function snapshot(){return {format:FORMAT,name:worldName,seed:world.seed,terrain:world.terrain,edits:[...world.edits],player:{x:player.x,y:player.y,z:player.z,yaw:player.yaw,pitch:player.pitch,flying:player.flying},bar:[...bar],slot,tool,inventory:stock,animals:animals.snapshot(),time:view.time,updatedAt:Date.now()};}
function persist(force=false){
 if(!started||(!dirty&&!force))return true;
 try{const value=snapshot();localStorage.setItem(KEY,JSON.stringify(value));saved=value;dirty=false;storageError=false;status('✓ 저장됨');updateSavedCard();return true;}catch{storageError=true;status('저장 실패 · 파일로 백업하세요');$('#storage-note').textContent='브라우저 저장 공간을 사용할 수 없어요. 세계 내보내기로 보관해 주세요.';return false;}
}
function markDirty(){dirty=true;if(!storageError)status('저장 중…');}
function updateSavedCard(){if(!saved)return;$('#saved-world').hidden=false;$('#saved-name').textContent=saved.name;$('#saved-date').textContent=new Date(saved.updatedAt||Date.now()).toLocaleString('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
function storeBackup(){try{const raw=localStorage.getItem(KEY);if(raw)localStorage.setItem(KEY+':before-replace',raw);updateBackupButtons();return true;}catch{toast('현재 세계를 먼저 파일로 내보내 주세요. 백업 저장에 실패했어요.');return false;}}
function updateBackupButtons(){let available=false;try{const raw=localStorage.getItem(KEY+':before-replace');if(raw){validateSave(JSON.parse(raw));available=true;}}catch{/* Invalid backups are never loaded automatically. */}for(const id of ['welcome-backup','restore-backup'])if($('#'+id))$('#'+id).hidden=!available;}
function restoreBackup(){try{const raw=localStorage.getItem(KEY+':before-replace');const value=validateSave(JSON.parse(raw));ask('교체 전 세계를 복원할까요?',`‘${value.name}’ 세계로 돌아갑니다. 현재 세계는 교체 전 백업으로 보관합니다.`,()=>{persist();if(storeBackup())loadWorld(value);});}catch{toast('복원할 수 있는 백업이 없어요.');}}
async function loadWorld(value=null){
 emptyNoticeAcknowledged=false;emptyNoticeReadyAt=performance.now()+1600;
 rewardClient.stop();setPanel('loading-panel');await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,30)));
 try{
  if(value)validateSave(value);worldName=value?.name||$('#name-input').value.trim()||'나의 작은 세계';
  world=new VoxelWorld(value?.seed||$('#seed-input').value.trim()||String(Date.now()),value?.terrain||$('#terrain-input').value).generate();if(value)world.applyEdits(value.edits);
  player={...world.spawn,yaw:.2,pitch:isEasy()?-.48:-.05,flying:false,crouch:false};if(value){for(const key of ['x','y','z','yaw','pitch'])player[key]=value.player[key];}player.pitch=Math.max(-1.55,Math.min(1.55,player.pitch));
  if(collides(world,player)||value?.player.flying||isEasy())groundPlayer(world,player);
  selectedFood=null;stock=createInventory(value?.inventory||null,value?.edits||[]);bar=rewardHotbar(value?[...value.bar]:[...DEFAULT_BAR],stock);slot=Number.isInteger(value?.slot)?Math.max(0,Math.min(8,value.slot)):0;view.time=Number.isFinite(value?.time)?((value.time%1)+1)%1:.27;
  velocity={x:0,y:0,z:0};easy.reset();history.clear();grounded=false;selected=null;view.attach(world);animals=new AnimalWorld(world,value?.animals||null);animals.setNight(isNight(view.time));tool=validEquipment(value?.tool,stock)?value.tool:'stick';lastAttack=-Infinity;animalTarget=null;started=true;$('#hud').hidden=false;$('#world-name').textContent=worldName;if(isEasy()&&slot>4)slot=0;renderBars();renderInventory();markDirty();persist(true);readError=false;
  rewardClient.start();await resume();setTimeout(updateAdventureGuide,1650);void arrival('🧱 내 블록 세계에 도착했어요!');toast(isEasy()?'막대기는 A로 치기 · B로 블록 고르기':value?'다시 오신 걸 환영해요. 이어서 만들어 보세요.':'모험에서 받은 블록으로 내 세계를 만들어 보세요.');
 }catch(error){toast(errorMessage(error));if(started)pause();else{setPanel('welcome');$('#error-message').textContent=errorMessage(error);}}
}
function renderBars(){
 updateAdventureGuide();
 for(const id of ['hotbar','inventory-bar']){$('#'+id).replaceChildren();if(id==='hotbar'){const button=document.createElement('button');button.id='stick-slot';button.className='slot'+(tool==='stick'?' selected':'');button.setAttribute('aria-label','공격 막대기 들기');button.setAttribute('aria-pressed',String(tool==='stick'));button.title='공격 막대기';button.innerHTML=`<img src="${atlas.icons.stick}" alt=""><span class="slot-label">막대기</span>`;button.onclick=()=>{selectedFood=null;tool='stick';renderBars();markDirty();};$('#'+id).append(button);const sword=Object.keys(WEAPONS).filter(key=>stock.weapons?.[key]>0).sort((a,b)=>WEAPONS[b].damage-WEAPONS[a].damage)[0];if(sword){const choice=document.createElement('button');choice.className='slot'+(isWeapon(tool)?' selected':'');choice.title='검 선택 · B 버튼에서 다른 검도 고를 수 있어요';choice.setAttribute('aria-label',WEAPONS[sword].name+' 들기');choice.innerHTML='⚔️<span class="slot-label">'+WEAPONS[isWeapon(tool)?tool:sword].name+'</span>';choice.onclick=()=>{selectedFood=null;tool=sword;markDirty();renderBars();};$('#'+id).append(choice);}}if(id==='hotbar')for(const [foodId,food]of Object.entries(LOOT_ITEMS)){const count=stock.loot?.[foodId]||0;if(!food.healing||!count)continue;const b=document.createElement('button');b.className='slot food-slot'+(selectedFood===foodId?' selected':'');b.setAttribute('aria-label',food.name+' '+count+'개 · 선택 후 A로 먹기');b.innerHTML='<strong class="food-icon">'+food.emoji+'</strong><em>'+count+'</em><span class="slot-label">'+food.name+'</span>';b.onclick=()=>{selectedFood=foodId;tool=null;renderBars();markDirty();};$('#'+id).append(b);}bar.forEach((block,index)=>{if(id==='hotbar'&&((isEasy()&&index>=5)||countBlock(stock,block)===0&&!(slot===index&&!tool&&!selectedFood)))return;const button=document.createElement('button');button.className='slot'+(slot===index&&!tool&&!selectedFood?' selected':'');button.title=`${index+1} · ${BLOCKS[block].name} · ${countBlock(stock,block)}개`;button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(slot===index&&!tool&&!selectedFood));button.innerHTML=`<small>${index+1}</small><img src="${atlas.icons[block]}" alt=""><em>${countBlock(stock,block)}</em>${isEasy()&&id==='hotbar'?'<span class="slot-label">'+BLOCKS[block].name+'</span>':''}`;button.addEventListener('click',()=>selectSlot(index));$('#'+id).append(button);});}
 $('#selected-name').textContent=selectedFood?LOOT_ITEMS[selectedFood].name+' · A로 먹기':tool?(WEAPONS[tool]?.name||'공격 막대기'):BLOCKS[bar[slot]].name;view?.setHeld(bar[slot]);view?.setTool(tool);view?.setFood(selectedFood);$('#easy-place span').textContent=selectedFood?'먹기':Boolean(tool)?'치기':'놓기';$('#easy-break span').textContent=selectedFood||tool?'블록':'지우기';$('#easy-place').setAttribute('aria-label',selectedFood?'A 음식 먹기':Boolean(tool)?'A 무기로 치기':'A 블록 놓기');$('#easy-break').setAttribute('aria-label',selectedFood||tool?'B 블록 고르기':'B 블록 지우기');
}
function selectSlot(index){selectedFood=null;tool=null;const count=isEasy()?5:9;slot=(index%count+count)%count;renderBars();if(started)markDirty();if(mode==='inventory-panel')renderInventory();}
function renderInventory(){
 const query=isEasy()?'':$('#block-search').value.toLowerCase().trim();$('#block-grid').replaceChildren();
 for(const [id,weapon]of Object.entries(WEAPONS)){const count=stock.weapons?.[id]||0;if(!count||query&&!weapon.name.includes(query))continue;const button=document.createElement('button');button.className='block-item weapon-item'+(tool===id?' active':'');button.setAttribute('aria-label',weapon.name+' 들기');button.innerHTML='<strong style="font-size:36px;color:'+weapon.color+'">⚔️</strong><span>'+weapon.name+'</span><small>공격력 '+weapon.damage+' · '+count+'개</small>';button.onclick=()=>{selectedFood=null;tool=id;markDirty();renderBars();renderInventory();if(isEasy())resume();};$('#block-grid').append(button);}

 BLOCKS.forEach((b,id)=>{if(!b||b.unbreakable||isEasy()&&!allBlocks&&countBlock(stock,id)===0||(!isEasy()&&category!=='전체'&&b.group!==category)||query&&!`${b.name} ${b.en}`.toLowerCase().includes(query))return;const button=document.createElement('button');button.className='block-item'+(bar[slot]===id?' active':'');button.title=b.en;button.disabled=countBlock(stock,id)===0;button.setAttribute('aria-label',`${b.name} 선택`);button.innerHTML=`<img src="${atlas.icons[id]}" alt=""><span>${b.name}</span><small class="block-count">${countBlock(stock,id)}개</small>`;button.addEventListener('click',()=>{selectedFood=null;tool=null;bar[slot]=id;renderBars();renderInventory();markDirty();sound('pick');if(isEasy())resume();});$('#block-grid').append(button);});
 for(const [id,count]of Object.entries(stock.loot||{})){if(!count)continue;const item=document.createElement('div');item.className='block-item loot-item';item.innerHTML='<strong style="font-size:34px">'+LOOT_ITEMS[id].emoji+'</strong><span>'+LOOT_ITEMS[id].name+'</span><small>'+count+'개</small>';$('#block-grid').append(item);}
 $('#inventory-total').textContent='보유 블록 '+Object.values(stock.counts).reduce((sum,n)=>sum+n,0)+'개';
 if(!$('#block-grid').children.length){const p=document.createElement('p');p.textContent='마법영어 모험에서 블록을 더 받아 와요.';p.style.gridColumn='1 / -1';$('#block-grid').append(p);}
}
function inventory(){if(!started)return;persist();setPanel('inventory-panel');renderInventory();if(!isEasy())$('#block-search').focus();}
function sound(kind){
 if(!settings.sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const gain=audio.createGain();gain.connect(audio.destination);const now=audio.currentTime;gain.gain.setValueAtTime(kind==='step'?.018:.055,now);gain.gain.exponentialRampToValueAtTime(.001,now+.1);
 if(kind==='hurt'){const oscillator=audio.createOscillator();oscillator.type='triangle';oscillator.frequency.setValueAtTime(150,now);oscillator.frequency.exponentialRampToValueAtTime(65,now+.1);oscillator.connect(gain);oscillator.start(now);oscillator.stop(now+.12);}else if(kind==='pick'){const oscillator=audio.createOscillator();oscillator.type='sine';oscillator.frequency.value=660;oscillator.connect(gain);oscillator.start(now);oscillator.stop(now+.08);}else{const buffer=audio.createBuffer(1,audio.sampleRate*.11,audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);const source=audio.createBufferSource();source.buffer=buffer;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='break'?1700:kind==='step'?400:850;source.connect(filter);filter.connect(gain);source.start(now);source.stop(now+.11);}
 }catch{/* Audio is optional; interaction still succeeds. */}
}
function target(){view.camera.position.set(player.x,player.y+(player.crouch?1.32:1.62),player.z);view.camera.rotation.set(player.pitch,player.yaw,0);view.camera.updateMatrixWorld();return raycast(world,view.camera.position,view.direction(),6,bar[slot]===11);}
function commitEdit(x,y,z,before,after){
 try{const plan=planInventoryEdit(stock,world.index(x,y,z),before,after);if(!plan)return false;if(!world.set(x,y,z,after))return false;stock=plan.inventory;history.record(x,y,z,before,after,plan.resource);markDirty();persist(true);renderBars();return true;}catch(error){toast(errorMessage(error));return false;}
}
function act(kind){
 if(!active)return false;if(selectedFood){if(kind==='break'&&isEasy()){inventory();return true;}return eatSelectedFood();}if(Boolean(tool)&&kind!=='pick'){if(isEasy()&&kind==='break'){inventory();return true;}return attack();}if(isEasy())return easyAct(kind);selected=target();if(!selected)return false;const hit=selected;
 if(kind==='pick'){if(BLOCKS[hit.id].unbreakable)return false;if(!countBlock(stock,hit.id)){toast('이 블록은 모험 보상으로 받아요.');return false;}tool=null;const existing=bar.indexOf(hit.id);if(existing>=0)selectSlot(existing);else{bar[slot]=hit.id;renderBars();markDirty();}return true;}
 if(kind==='break'){if(BLOCKS[hit.id].unbreakable){toast('세계 바닥은 부술 수 없어요.');return false;}if(!commitEdit(hit.x,hit.y,hit.z,hit.id,0))return false;view.burst(hit);}
 else{
  const x=hit.x+hit.normal.x,y=hit.y+hit.normal.y,z=hit.z+hit.normal.z;if(!world.inside(x,y,z)||y===0)return false;
  if(world.get(x,y,z)&&world.get(x,y,z)!==11)return false;if(intersectsPlayer(x,y,z,player,player.crouch?1.5:1.8)&&!BLOCKS[bar[slot]].liquid)return false;
  if(!commitEdit(x,y,z,world.get(x,y,z),bar[slot]))return false;
 }
 swing=1;markDirty();sound(kind);return true;
}
function spawn(){easy.reset();Object.assign(player,world.spawn,{flying:false,crouch:false});groundPlayer(world,player);velocity={x:0,y:0,z:0};markDirty();toast('처음 자리로 돌아왔어요.');}
function eatSelectedFood(){const next=eatFood(stock,selectedFood);if(!next){toast(heartCount(stock)>=heartCapacity(stock)?'하트가 가득 찼어요!':'먹을 음식이 없어요.');return false;}const name=LOOT_ITEMS[selectedFood].name;stock=next;if(!stock.loot[selectedFood]){selectedFood=null;tool='stick';}swing=1;markDirty();persist(true);renderBars();renderInventory();sound('pick');toast(name+'를 먹었어요! 하트가 회복됐어요.');return true;}
function attack(){
 const now=performance.now();if(now-lastAttack<420)return false;lastAttack=now;swing=1;const hit=animals.attack(player,WEAPONS[tool]?.damage||1);sound(hit?'break':'step');if(hit){markDirty();persist(true);toast(hit.drops?.length?'아이템이 떨어졌어요! 가까이 가서 주워요.':hit.defeated?ANIMALS[hit.type].name+'가 잠시 쉬러 갔어요.':ANIMALS[hit.type].name+' · '+('♥'.repeat(hit.hp)));}return true;
}
function easyAct(kind){
 if(easy.busy)return false;const aim=easyTarget(world,player);
 if(kind==='place'&&aim.canPlace){const p=aim.place,before=world.get(p.x,p.y,p.z);if(!commitEdit(p.x,p.y,p.z,before,bar[slot]))return false;}
 else if(kind==='break'&&aim.canBreak){const hit=aim.hit;if(!commitEdit(hit.x,hit.y,hit.z,hit.id,0))return false;view.burst(hit);}
 else{toast(aim.reason);return false;}
 swing=1;markDirty();sound(kind);return true;
}
function undo(){
 if(!active||easy.busy)return;try{const next=reverseInventoryEdit(stock,history.entries.at(-1)?.resource);if(history.undo(world,player)){stock=next;markDirty();persist(true);renderBars();sound('pick');toast('블록과 작업을 함께 되돌렸어요.');}else toast(history.entries.length?'조금 움직인 뒤 다시 눌러요.':'아직 되돌릴 작업이 없어요.');}catch(error){toast(errorMessage(error));}
}
function easyJump(){if(active&&isEasy()&&easy.jump(world,player)){markDirty();sound('step');}}
function easyPhysics(dt){
 const moved=easy.update(world,player,dt);if(moved)markDirty();easyAim=easyTarget(world,player);
 selected=easyAim.hit;animalTarget=Boolean(tool)?animals.target(player):null;view.setBuildPreview(!selectedFood&&!tool&&countBlock(stock,bar[slot])>0&&!easy.busy&&easyAim.canPlace?easyAim.place:null);
 $('#easy-place').disabled=!selectedFood&&!tool&&(easy.busy||!easyAim.canPlace||!countBlock(stock,bar[slot]));$('#easy-break').disabled=!selectedFood&&!tool&&(easy.busy||!easyAim.canBreak);$('#easy-undo').disabled=history.entries.length===0||easy.busy;
 $('#easy-tip').textContent=selectedFood?'음식을 골랐어요! A로 먹으면 하트가 회복돼요.':Boolean(tool)?(animalTarget?ANIMALS[animalTarget.animal.type].name+' · A로 치기':'크리퍼·좀비를 바라보고 A로 치기'):countBlock(stock,bar[slot])===0?'블록이 없어요. 모험에서 더 받아 와요.':easy.busy?'방향키는 걷기 · 화면을 밀면 둘러보기':easyAim.reason;$('#movement-mode').textContent='쉬운 조작';
 if(moved&&performance.now()-lastFoot>380){lastFoot=performance.now();sound('step');}return moved;
}
function rotate(dx,dy){const sense=(isEasy()?.0017:.002)*settings.sensitivity/100;player.yaw-=dx*sense;player.yaw=((player.yaw+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;player.pitch=Math.max(-1.55,Math.min(1.55,player.pitch-dy*sense));markDirty();}
function physics(dt){
 const sneak=keys.has('ShiftLeft')||keys.has('ShiftRight')||keys.has('TouchDown');const wantsCrouch=sneak;
 if(wantsCrouch||!collides(world,player,1.8))player.crouch=wantsCrouch;
 const h=player.crouch?1.5:1.8,water=world.get(Math.floor(player.x),Math.floor(player.y+.8),Math.floor(player.z))===11;
 let side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+touchMove.x,forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)-touchMove.z;const length=Math.hypot(side,forward);if(length>1){side/=length;forward/=length;}
 const sprint=keys.has('ControlLeft')||keys.has('ControlRight')||toggleSprint,speed=water?2.8:player.crouch?1.5:sprint?7:4.35;
 const tx=(Math.cos(player.yaw)*side-Math.sin(player.yaw)*forward)*speed,tz=(-Math.sin(player.yaw)*side-Math.cos(player.yaw)*forward)*speed,lerp=1-Math.exp(-dt*14);velocity.x+=(tx-velocity.x)*lerp;velocity.z+=(tz-velocity.z)*lerp;
 grounded=collides(world,{...player,y:player.y-.04},h);const jump=keys.has('Space')||keys.has('TouchJump');
 if(water){velocity.y+=((jump?12:0)-4)*dt;velocity.y*=Math.exp(-dt*3);}else{if(jump&&grounded)velocity.y=8.2;velocity.y=Math.max(-25,velocity.y-24*dt);}
 const before={x:player.x,y:player.y,z:player.z};const result=movePlayer(world,player,{x:velocity.x*dt,y:velocity.y*dt,z:velocity.z*dt},h,player.crouch&&grounded);if(result.grounded||result.ceiling)velocity.y=0;
 if(Math.hypot(player.x-before.x,player.y-before.y,player.z-before.z)>.0001)markDirty();if(length>.1&&grounded&&performance.now()-lastFoot>(sprint?290:430)){lastFoot=performance.now();sound('step');}
 $('#movement-mode').textContent=water?'수영':player.crouch?'웅크리기':sprint?'달리기':'걷기';return length>.05;
}
function frame(now){
 const elapsed=Math.max(0,(now-lastFrame)/1000),dt=Math.min(elapsed,.04);lastFrame=now;
 if(view&&world&&player){if(active){stock=tickHearts(stock,elapsed);markDirty();}updateHeartGate();let moving=false;if(active){const wasNight=isNight(view.time);view.time=advanceTime(view.time,dt,settings.cycle);const night=isNight(view.time);if(wasNight!==night){markDirty();toast(night?'🌙 밤이 되었어요! 검을 들고 몬스터를 찾아봐요.':'☀️ 아침이에요! 이제 마음껏 만들어 봐요.');}const clock=document.getElementById('daynight-clock');if(clock){const label=night?'🌙 밤 · 몬스터가 나타나요':'☀️ 낮 · 자유롭게 만들어요';if(clock.textContent!==label)clock.textContent=label;}if(animals.update(dt,player,{night}))markDirty();for(const event of animals.events.splice(0)){if(event.damage){stock=spendHearts(stock,event.damage);showHurt(event);markDirty();persist(true);toast(event.type==='player-hit'?'좀비에게 공격받았어요! ❤️ −1':'크리퍼가 펑! ❤️ −2');}if(event.type==='creeper-puff'){view.burst({...event,id:7});sound('break');}}updateHeartGate();if(active){const ground=updateGroundLoot(animals.groundDrops,dt,player,world);if(animals.groundDrops.length||ground.picked.length)markDirty();animals.groundDrops=ground.drops;if(ground.picked.length){stock=collectLoot(stock,ground.picked);sound('pick');persist(true);renderBars();toast(ground.picked.map(d=>LOOT_ITEMS[d.itemId].emoji+' '+LOOT_ITEMS[d.itemId].name+' +'+d.quantity).join(' · '));}if(isEasy())moving=easyPhysics(dt);else{view.setBuildPreview(null);moving=physics(dt);selected=target();animalTarget=Boolean(tool)?animals.target(player):null;}if(!isEasy()&&heldButton&&now-lastAction>180){act(heldButton);lastAction=now;}if(now-saveAt>5000){if(settings.cycle)markDirty();persist();saveAt=now;}}}if(active)swing=Math.max(0,swing-dt*(Boolean(tool)?2.2:4));if(!active)view.setBuildPreview(null);view.renderAnimals(animals,dt,active);view.render(player,dt,moving,swing,active&&!tool?selected:null,isEasy()&&started);$('#target-label').textContent=active&&Boolean(tool)?(animalTarget?ANIMALS[animalTarget.animal.type].name+' '+('♥'.repeat(animalTarget.animal.hp)):''):active&&selected?BLOCKS[selected.id].name:'';$('#crosshair').classList.toggle('has-animal',!!tool&&!!animalTarget);$('#coordinates').textContent=`${player.x.toFixed(0)} / ${player.y.toFixed(0)} / ${player.z.toFixed(0)}`;}
 requestAnimationFrame(frame);
}
function exportWorld(){if(!started)return;persist(true);const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot())],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=worldName.replace(/[\\/:*?"<>|]/g,'_')+'.block-world.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('세계 파일을 내보냈어요.');}
async function importFile(file){if(!file)return;try{if(file.size>12*1024*1024)throw Error('세계 파일은 12MB 이하만 가져올 수 있어요.');const value=validateSave(JSON.parse(await file.text()));ask('가져온 세계를 열까요?',`‘${value.name}’ 세계로 바꿉니다. 현재 세계는 교체 전 백업으로 보관합니다. 중요한 세계는 먼저 파일로 내보내 주세요.`,()=>{if(storeBackup())loadWorld(value);});}catch(error){toast('가져오기 실패: '+errorMessage(error));}finally{$('#file-input').value='';}}
function updateModeUI(){
 const changed=document.body.dataset.controls!==settings.controls;document.body.dataset.controls=settings.controls;document.body.classList.toggle('easy-mode',isEasy());
 if(changed){$('#world-options').open=!isEasy();$('#adult-menu').open=!isEasy();}
 for(const b of document.querySelectorAll('[data-controls]'))b.setAttribute('aria-pressed',String(b.dataset.controls===settings.controls));
 $('#create-button').innerHTML=isEasy()?'놀러 가기 <span>→</span>':'새 세계 만들기 <span>→</span>';
 $('#continue-world').textContent=isEasy()?'계속 놀기 →':'계속하기 ↗';$('#resume-button').textContent=isEasy()?'계속 놀기 →':'계속 만들기 →';
 $('#controls-mode-button').textContent=isEasy()?'기존 조작으로 바꾸기':'방향키 + A/B로 바꾸기';$('#inventory-title').textContent=isEasy()?'어떤 블록으로 만들까요?':'무엇을 만들어 볼까요?';
 if(!readError)$('#welcome .intro-copy').innerHTML=isEasy()?'평지에서 돼지와 닭을 만나 봐요.<br>막대기로 치고, 블록으로 만들어 봐요.':'숲을 거닐고, 블록을 쌓고, 작은 집을 지어요.<br>잔디·흙·돌·참나무 판자로 작은 세계를 만들어요.';
 if(started){if(isEasy()&&slot>4)slot=0;renderBars();renderInventory();}
}
function changeControls(controls){
 clearInput();easy.reset();settings.controls=controls;if(started){groundPlayer(world,player);velocity={x:0,y:0,z:0};markDirty();}applySettings();if(started)toast(isEasy()?'방향키와 A/B로 놀아요.':'기존 이동과 마우스 조작으로 바꿨어요.');
}
function applySettings(){if(!view)return;updateModeUI();settings.fov=WORLD_FOV;view.camera.fov=WORLD_FOV;view.camera.updateProjectionMatrix();view.drawDistance=settings.distance;view.cycle=settings.cycle;$('#fov').value=settings.fov;$('#sensitivity').value=settings.sensitivity;$('#distance').value=settings.distance;$('#sound').checked=settings.sound;$('#day-cycle').checked=settings.cycle;$('#fov-value').value=settings.fov+'°';$('#sensitivity-value').value=settings.sensitivity+'%';try{localStorage.setItem(SETTINGS,JSON.stringify(settings));}catch{/* World saving reports storage errors separately. */}}

const rewardClient=new RewardClient(profile||'demo',items=>{
 if(!started)return;try{const result=applyRewards(stock,items,profile||'demo');if(!result.applied){$('#reward-status').textContent='모험 보상 연결됨';return;}const previous=stock,previousBar=[...bar];stock=result.inventory;bar=rewardHotbar(bar,stock);markDirty();if(!persist(true)){stock=previous;bar=previousBar;$('#reward-status').textContent='저장 실패 · 보상은 다음에 다시 받아요';return;}renderBars();updateHeartGate();if(mode==='inventory-panel')renderInventory();$('#reward-status').textContent='새 모험 보상을 받았어요';toast(items.some(item=>item.items?.length)?'⚔️ 완전한 문장 보상! 블록·하트·새 검을 받았어요!':'모험 보상으로 블록과 하트를 받았어요!');}catch(error){$('#reward-status').textContent=errorMessage(error);}
},()=>{$('#reward-status').textContent='오프라인 · 보유 블록으로 계속 놀아요';});

$('#create-form').addEventListener('submit',event=>{event.preventDefault();if(saved||started||readError)ask('새 세계를 만들까요?','현재 세계를 교체합니다. 교체 전 기록을 백업하지만, 보관할 세계는 먼저 파일로 내보내 주세요.',()=>{if(storeBackup())loadWorld();});else loadWorld();});
for(const b of document.querySelectorAll('[data-controls]'))b.onclick=()=>changeControls(b.dataset.controls);
$('#show-all-blocks').onclick=()=>{allBlocks=!allBlocks;$('#show-all-blocks').textContent=allBlocks?'처음 블록만 보기 −':'다른 블록도 보기 ＋';renderInventory();};
$('#easy-home-button').onclick=()=>{spawn();resume();};
for(const [id,action]of [['easy-place',()=>act('place')],['easy-break',()=>act('break')],['easy-undo',undo],['easy-jump',easyJump]]){
 const button=$('#'+id);button.addEventListener('pointerdown',event=>{if(!active||!isEasy())return;event.preventDefault();event.stopPropagation();action();});button.addEventListener('click',event=>{if(event.detail===0)action();});
}
for(const b of document.querySelectorAll('[data-easy-direction]')){
 b.addEventListener('pointerdown',event=>{if(!active||!isEasy())return;event.preventDefault();event.stopPropagation();b.setPointerCapture(event.pointerId);easyPointers.set(event.pointerId,b);b.classList.add('pressed');easy.press(world,player,b.dataset.easyDirection,true,'pointer:'+event.pointerId);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,event=>{if(!easyPointers.has(event.pointerId))return;easyPointers.delete(event.pointerId);if(!Array.from(easyPointers.values()).includes(b))b.classList.remove('pressed');easy.release('pointer:'+event.pointerId,name!=='pointerup');});
 b.addEventListener('click',event=>{if(event.detail===0&&active&&isEasy())easy.press(world,player,b.dataset.easyDirection,false);});
}
$('#easy-controls').addEventListener('contextmenu',event=>event.preventDefault());
const backupButton=document.createElement('button');backupButton.id='restore-backup';backupButton.className='text-button';backupButton.textContent='교체 전 세계 복원하기 ↶';backupButton.style.display='block';$('#new-world-button').after(backupButton);backupButton.onclick=restoreBackup;$('#welcome-backup').onclick=restoreBackup;updateBackupButtons();
$('#continue-world').onclick=()=>loadWorld(saved);$('#pause-button').onclick=pause;$('#resume-button').onclick=resume;$('#inventory-button').onclick=inventory;$('#close-inventory').onclick=resume;$('#block-search').oninput=renderInventory;$('#spawn-button').onclick=()=>{spawn();resume();};$('#controls-mode-button').onclick=()=>changeControls(isEasy()?'classic':'easy');$('#export-button').onclick=exportWorld;
$('#sync-rewards').onclick=()=>{if(started)void rewardClient.sync();};
for(const id of ['import-button','welcome-import'])$('#'+id).onclick=()=>$('#file-input').click();$('#file-input').onchange=()=>importFile($('#file-input').files[0]);$('#new-world-button').onclick=()=>{persist();setPanel('welcome');updateSavedCard();};$('#confirm-cancel').onclick=()=>{confirmAction=null;setPanel(started?'pause-panel':'welcome');};$('#confirm-ok').onclick=()=>{const action=confirmAction;confirmAction=null;action?.();};
$('#fullscreen-button').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('이 브라우저는 전체 화면을 지원하지 않아요.');}};
for(const [id,key]of [['fov','fov'],['sensitivity','sensitivity'],['distance','distance']])$('#'+id).oninput=event=>{settings[key]=Number(event.target.value);applySettings();};$('#sound').onchange=event=>{settings.sound=event.target.checked;applySettings();};$('#day-cycle').onchange=event=>{settings.cycle=event.target.checked;applySettings();};for(const b of document.querySelectorAll('[data-time]'))b.onclick=()=>{view.time=Number(b.dataset.time);animals?.setNight(isNight(view.time));markDirty();};
for(const name of ['전체','자연','건축','색상','장식']){const b=document.createElement('button');b.textContent=name;b.setAttribute('role','tab');b.setAttribute('aria-selected',String(name===category));b.onclick=()=>{category=name;for(const item of $('#categories').children)item.setAttribute('aria-selected',String(item===b));renderInventory();};$('#categories').append(b);}
document.addEventListener('keydown',event=>{
 if(event.code==='Tab'&&mode!=='playing'){const controls=[...$('#overlay').querySelectorAll('button,input,select,summary')].filter(el=>el.getClientRects().length&&!el.disabled);if(controls.length){const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){last.focus();event.preventDefault();}else if(!event.shiftKey&&document.activeElement===last){first.focus();event.preventDefault();}}return;}
 if(event.code==='Escape'){event.preventDefault();if(mode==='playing')pause();else if(mode==='pause-panel'||mode==='inventory-panel')resume();else if(mode==='confirm-panel')$('#confirm-cancel').click();return;}
 if(/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
 if(event.code==='KeyE'&&!event.repeat&&started){event.preventDefault();if(mode==='inventory-panel')resume();else if(active)inventory();return;}
 if(!active)return;if(isEasy()){const direction={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[event.code];if(direction){event.preventDefault();if(!event.repeat)easy.press(world,player,direction,true,event.code);return;}if(event.code==='KeyZ'||event.code==='KeyX'){event.preventDefault();if(!event.repeat)act(event.code==='KeyZ'?'place':'break');return;}if(event.code==='KeyU'){event.preventDefault();if(!event.repeat)undo();return;}if(event.code==='Space'){event.preventDefault();if(!event.repeat)easyJump();return;}if(['KeyF','KeyW','KeyA','KeyS','KeyD'].includes(event.code)){event.preventDefault();return;}}if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','KeyF','ControlLeft','ControlRight','ShiftLeft','ShiftRight'].includes(event.code)||/^Digit[1-9]$/.test(event.code))event.preventDefault();
 if(event.code.startsWith('Digit')&&Number(event.code.slice(5))>=1&&Number(event.code.slice(5))<=9)selectSlot(Number(event.code.slice(5))-1);
 if(event.code==='KeyW'&&!event.repeat){const now=performance.now();if(lastForward>0&&now-lastForward<280)toggleSprint=true;lastForward=now;}
 keys.add(event.code);
});document.addEventListener('keyup',event=>{keys.delete(event.code);if(event.code.startsWith('Arrow'))easy.release(event.code);if(event.code==='KeyW')toggleSprint=false;});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&active)pause();});document.addEventListener('pointerlockerror',()=>{if(active)toast('마우스를 누른 채 드래그하면 둘러볼 수 있어요.');});
document.addEventListener('mousemove',event=>{if(active&&!isEasy()&&document.pointerLockElement===canvas)rotate(event.movementX,event.movementY);});
canvas.addEventListener('contextmenu',event=>event.preventDefault());canvas.addEventListener('pointerdown',event=>{
 if(!active)return;event.preventDefault();canvas.focus();if(isEasy()||event.pointerType==='touch'){lookPointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);return;}
 if(!document.pointerLockElement){lookPointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);canvas.requestPointerLock?.()?.catch?.(()=>{});}
 if(event.button===1)act('pick');else{heldButton=event.button===2?'place':'break';act(heldButton);lastAction=performance.now();}
});canvas.addEventListener('pointermove',event=>{if(!active||document.pointerLockElement||lookPointer?.id!==event.pointerId)return;rotate(event.clientX-lookPointer.x,event.clientY-lookPointer.y);lookPointer.x=event.clientX;lookPointer.y=event.clientY;});
document.addEventListener('pointerup',event=>{if(event.pointerType!=='touch')heldButton=null;if(lookPointer?.id===event.pointerId)lookPointer=null;});canvas.addEventListener('pointercancel',event=>{if(event.pointerType!=='touch')heldButton=null;if(lookPointer?.id===event.pointerId)lookPointer=null;});
canvas.addEventListener('wheel',event=>{if(!active)return;event.preventDefault();if(isEasy()){if(!event.ctrlKey)rotate(event.deltaX*.65,event.deltaY*.65);}else selectSlot(slot+Math.sign(event.deltaY));},{passive:false});
const joystick=$('#joystick');function moveJoystick(event){const rect=joystick.getBoundingClientRect(),dx=event.clientX-rect.left-rect.width/2,dy=event.clientY-rect.top-rect.height/2,length=Math.hypot(dx,dy),scale=length>38?38/length:1;touchMove.x=dx*scale/38;touchMove.z=dy*scale/38;$('#stick').style.transform=`translate(${dx*scale}px,${dy*scale}px)`;}
joystick.addEventListener('pointerdown',event=>{if(!active)return;event.preventDefault();event.stopPropagation();joyPointer=event.pointerId;joystick.setPointerCapture(event.pointerId);moveJoystick(event);});joystick.addEventListener('pointermove',event=>{if(joyPointer===event.pointerId)moveJoystick(event);});for(const name of ['pointerup','pointercancel'])joystick.addEventListener(name,event=>{if(joyPointer===event.pointerId){joyPointer=null;touchMove.x=touchMove.z=0;$('#stick').style.transform='';}});
for(const button of document.querySelectorAll('[data-touch]')){button.addEventListener('pointerdown',event=>{if(!active)return;event.preventDefault();event.stopPropagation();button.setPointerCapture(event.pointerId);const action=button.dataset.touch;if(action==='jump')keys.add('TouchJump');else if(action==='down')keys.add('TouchDown');else{heldButton=action;act(action);lastAction=performance.now();}});for(const name of ['pointerup','pointercancel'])button.addEventListener(name,event=>{event.stopPropagation();keys.delete('TouchJump');keys.delete('TouchDown');heldButton=null;});}
window.addEventListener('blur',()=>{if(active)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(active)pause();persist();}else if(started)void rewardClient.sync();});window.addEventListener('pagehide',()=>persist());window.addEventListener('beforeunload',event=>{persist();if(storageError&&dirty){event.preventDefault();event.returnValue='';}});

try{
 if(matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).has('touch'))document.body.classList.add('touch');
 try{const raw=localStorage.getItem(KEY);if(raw){saved=validateSave(JSON.parse(raw));updateSavedCard();}const rawSettings=JSON.parse(localStorage.getItem(SETTINGS)||'null');if(rawSettings){for(const [key,min,max]of [['fov',55,100],['sensitivity',30,200],['distance',64,140]])if(Number.isFinite(rawSettings[key]))settings[key]=Math.max(min,Math.min(max,rawSettings[key]));for(const key of ['sound','cycle'])if(typeof rawSettings[key]==='boolean')settings[key]=rawSettings[key];if(rawSettings.dayCycleVersion!==1)settings.cycle=true;settings.dayCycleVersion=1;if(['easy','classic'].includes(rawSettings.controls))settings.controls=rawSettings.controls;}}catch{readError=true;$('#welcome .intro-copy').textContent='기존 저장 기록을 읽지 못했어요. 자동으로 덮어쓰지 않습니다. 새 세계를 만들기 전에 브라우저 기록을 보관해 주세요.';}
 const requestedControls=new URLSearchParams(location.search).get('controls');if(['easy','classic'].includes(requestedControls))settings.controls=requestedControls;
 view=new WorldRenderer(canvas,atlas);applySettings();world=new VoxelWorld('block-forest-preview').generate();player={x:76,y:27,z:85,yaw:.47,pitch:-.22,flying:false,crouch:false};view.attach(world);animals=new AnimalWorld(world);renderBars();renderInventory();setPanel(readError?'welcome':'loading-panel');requestAnimationFrame(frame);
 // Read-only diagnostics for browser regression checks; game mutations still use real input.
 window.blockWorld={getState:()=>({mode,terrain:world.terrain,tool,inventory:structuredClone(stock),swing,stickPose:view.getStickPose(),animals:animals.snapshot(),animalTarget:animalTarget?{id:animalTarget.animal.id,type:animalTarget.animal.type,hp:animalTarget.animal.hp,distance:animalTarget.distance}:null,controls:settings.controls,fov:view.camera.fov,easyBusy:easy.busy,easyInputs:[...easy.inputs],easyAim,undoCount:history.entries.length,name:worldName,player:{...player},bar:[...bar],slot,selected:selected?{...selected}:null,edits:[...world.edits],key:KEY,dirty,storageError,blocks:world.data.length,drawCalls:view.renderer.info.render.calls,triangles:view.renderer.info.render.triangles}),getBlock:(x,y,z)=>world.get(x,y,z)};
 const entry=worldEntry(saved,readError);
 if(entry.action!=='blocked'){if(entry.action==='create')$('#terrain-input').value=entry.terrain;void loadWorld(entry.save||null);}
}catch(error){fail(error);}

// Always offer a safe return path, including standalone visits to the block world.
const returnPath=adventureURL(new URLSearchParams(location.search).get('returnTo'),location.origin,profile);
const returnURL=new URL(returnPath,location.origin);returnURL.searchParams.set('arrival','adventure');
const returnToAdventure=createTravel({save:()=>persist(true),animate:async label=>{clearInput();active=false;if(document.pointerLockElement)document.exitPointerLock();await departure(label);},navigate:url=>location.assign(url)});
let returningToAdventure=false;
async function goBack(){if(returningToAdventure)return;returningToAdventure=true;const moved=await returnToAdventure(returnURL.pathname+returnURL.search,'📖 마법영어 모험으로 돌아가는 중…');if(!moved){returningToAdventure=false;if(started&&mode==='playing'&&heartCount(stock)>0)active=true;}}
const backButton=document.createElement('button');backButton.id='return-to-adventure';backButton.innerHTML='📖 <span class="return-label">모험</span>';backButton.setAttribute('aria-label','마법영어 모험으로 돌아가기');backButton.title='마법영어 모험으로 돌아가기';backButton.onclick=goBack;document.querySelector('.hud-actions').prepend(backButton);
const emptyGuide=document.createElement('dialog');emptyGuide.id='empty-block-guide';emptyGuide.setAttribute('aria-labelledby','empty-block-title');emptyGuide.setAttribute('aria-describedby','empty-block-copy');
emptyGuide.innerHTML='<div class="empty-block-icon" aria-hidden="true">🪵 ✨ 📖</div><h2 id="empty-block-title">블록을 모두 사용했어요!</h2><p id="empty-block-copy">블록을 모으기 위해<br>마법영어 모험으로 돌아가자!</p><button id="collect-more-blocks" class="primary">📖 모험으로 돌아가 블록 모으기</button><button id="stay-in-world" class="text-button">조금 더 둘러볼게요</button>';
emptyGuide.querySelector('#collect-more-blocks').onclick=()=>{emptyGuide.close();void goBack();};
function dismissEmptyGuide(){emptyNoticeAcknowledged=true;emptyGuide.close();}
emptyGuide.querySelector('#stay-in-world').onclick=dismissEmptyGuide;
emptyGuide.addEventListener('keydown',event=>event.stopPropagation());
emptyGuide.addEventListener('cancel',event=>{event.preventDefault();dismissEmptyGuide();});
emptyGuide.addEventListener('close',()=>{if(!returningToAdventure&&started&&mode==='playing'&&heartCount(stock)>0){active=true;clearInput();canvas.focus();}});
document.body.append(emptyGuide);updateAdventureGuide();
function updateAdventureGuide(){
 updateHeartGate();if(started&&!heartCount(stock))return;
 const guide=document.getElementById('empty-block-guide');
 if(!blocksEmpty(stock)){emptyNoticeAcknowledged=false;if(guide?.open)guide.close();}
 else if(guide&&shouldShowEmptyNotice({started,active,empty:true,acknowledged:emptyNoticeAcknowledged,ready:performance.now()>=emptyNoticeReadyAt,open:guide.open})){
   clearInput();active=false;if(document.pointerLockElement)document.exitPointerLock();guide.showModal();
 }
 const back=document.getElementById('return-to-adventure');if(back)back.hidden=!started;
}

{const clock=document.createElement('div');clock.id='daynight-clock';clock.setAttribute('role','status');clock.style.cssText='position:absolute;top:82px;left:24px;padding:7px 12px;border-radius:12px;background:#243c36b0;color:white;font-size:16px;font-weight:750;';document.getElementById('hud').append(clock);}

const heartHud=document.createElement('div');heartHud.id='heart-hud';heartHud.setAttribute('role','status');document.getElementById('hud').append(heartHud);
const heartGuide=document.createElement('dialog');heartGuide.id='heart-guide';heartGuide.setAttribute('aria-labelledby','heart-guide-title');heartGuide.innerHTML='<div style="font-size:56px">❤️ 📖</div><h2 id="heart-guide-title">모험 하트를 모으러 가자!</h2><p>블록 세계에서 쓸 하트가 없어요.<br>마법영어에서 친구와 이야기하고<br>퀘스트를 깨면 하트를 받을 수 있어요!</p><button class="primary">📖 모험으로 돌아가 하트 모으기</button><small>하트 1개로 20초 동안 놀 수 있어요.</small>';heartGuide.querySelector('button').onclick=()=>void goBack();heartGuide.addEventListener('cancel',event=>event.preventDefault());heartGuide.addEventListener('keydown',event=>event.stopPropagation());document.body.append(heartGuide);
function updateHeartGate(){
 const hud=document.getElementById('heart-hud'),guide=document.getElementById('heart-guide');if(!guide||!started)return;
 const count=heartCount(stock),capacity=heartCapacity(stock),key=count+':'+capacity;if(hud&&hud.dataset.hearts!==key){hud.dataset.hearts=key;hud.setAttribute('aria-label','모험 하트 '+count+' / '+capacity);hud.replaceChildren();for(let i=0;i<Math.min(capacity,300);i++){const heart=document.createElement('span');heart.className='heart-cell'+(i+1<=count?' full':i<count?' half':'');heart.setAttribute('aria-hidden','true');hud.append(heart);}if(capacity>300){const more=document.createElement('small');more.textContent='+'+Math.max(0,count-300);hud.append(more);}}
 if(count===0){if(active){active=false;clearInput();persist(true);}document.getElementById('empty-block-guide')?.close();if(document.pointerLockElement)document.exitPointerLock();if(!guide.open&&!returningToAdventure)guide.showModal();}
 else if(guide.open){guide.close();if(mode==='playing'&&!returningToAdventure){active=true;clearInput();canvas.focus();}}
}

const hurtOverlay=document.createElement('div');hurtOverlay.id='hurt-overlay';hurtOverlay.setAttribute('aria-hidden','true');document.body.append(hurtOverlay);let hurtTimer;
function showHurt(event){view.hurt(event.damage);sound('hurt');easy.reset();movePlayer(world,player,hurtPush(player,event));const overlay=document.getElementById('hurt-overlay'),hearts=document.getElementById('heart-hud');overlay?.classList.remove('hit');if(overlay){void overlay.offsetWidth;overlay.classList.add('hit');}hearts?.classList.remove('hurt');if(hearts){void hearts.offsetWidth;hearts.classList.add('hurt');}clearTimeout(hurtTimer);hurtTimer=setTimeout(()=>{overlay?.classList.remove('hit');hearts?.classList.remove('hurt');},550);}
