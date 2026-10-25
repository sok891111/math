'use strict';
(()=>{
 const $=id=>document.getElementById(id),{blocks,levels,expected,validate}=CreativePuzzles;
 const {badges,grant}=CreativeRewards;
 const canvas=$('scene'),ctx=canvas.getContext('2d');
 const key='block-creative-bridge-v1:'+(window.__BLOCK_USER__?.id||'guest');
 let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{}
 const wardenState=saved?.warden&&typeof saved.warden==='object'?saved.warden:{};
 let completed=Array.isArray(saved?.completed)?[...new Set(saved.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<levels.length))]:[];
 let index=Number.isInteger(saved?.index)&&saved.index>=0&&saved.index<levels.length?saved.index:0;
 let gems=Number.isSafeInteger(saved?.gems)&&saved.gems>=0?saved.gems:0;
 let points=Number.isSafeInteger(saved?.points)&&saved.points>=0?saved.points:0;
 let records=Array.isArray(saved?.records)?saved.records.slice(-60):[];
 let placements={},selected='leaf',history=[],hints=0,attempts=0,falls=0;
 let fallMessage='';
 let mode='play',player={x:130,y:165},checkpoint=130,fallTime=0,fallSlot=-1,camera=0,hoverSlot=-1;
 let pendingReward=null,drag=null,suppressClick=false,previousTime=0,pausedMode='play';
 const keys=new Set(),touches=new Map();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(window.__BLOCK_USER__){$('home').href='/'+encodeURIComponent(window.__BLOCK_USER__.id);$('saved').textContent=window.__BLOCK_USER__.name+'의 모험';}
 function save(){try{localStorage.setItem(key,JSON.stringify({index,completed,records,gems,points,pendingReward,warden:wardenState,run:{placements,x:checkpoint,hints,attempts,falls}}));}catch{$('storage-note').textContent='이 브라우저에서는 저장할 수 없어요. 지금 모험은 계속할 수 있어요.';}}
 function feedback(message,error=false){$('feedback').textContent=message;$('feedback').className='feedback'+(error?' error':'');}
 function say(message,error=false){$('story').textContent=message;feedback(message,error);}
 function block(id){return blocks.find(b=>b.id===id);}
 function resetInputs(){keys.clear();touches.clear();document.querySelectorAll('[data-move]').forEach(el=>el.classList.remove('held'));}
 function editable(){return mode==='play'||mode==='repair';}
 function guideSlot(){return levels[index].holes.find(i=>!placements[i])??fallSlot;}
 function width(){return 610/levels[index].length;}
 function slotAt(x){return x>=195&&x<805?Math.floor((x-195)/width()):-1;}
 function isSafe(x){const i=slotAt(x+14);return i<0||!levels[index].holes.includes(i)||placements[i]===expected(levels[index],i);}
 function dashboard(){
  $('count').textContent=String(index+1).padStart(2,'0')+' / 06';$('lesson').textContent=`MISSION ${String(index+1).padStart(2,'0')} · ${levels[index].title}`;
  $('badge').textContent=`다리 건축가 · ${completed.length} / 6`;$('badge-count').textContent=`${completed.length+(wardenState.completed?.length||0)} / 11`;$('gems').textContent=gems;$('points').textContent=points;
  $('progress').innerHTML=levels.map((_,i)=>`<i class="${completed.includes(i)?'done':i===index?'current':''}"></i>`).join('');
 }
 function place(i,id){
  if(!editable()||!levels[index].holes.includes(i)||!block(id))return;
  history.push({...placements});placements[i]=id;attempts++;
  if(i===fallSlot){mode='play';fallSlot=-1;}
  say('블록을 놓았어! 직접 걸어서 길이 이어졌는지 확인해 봐.');renderBridge();save();
 }
 function renderBridge(){
  const l=levels[index];$('bridge').replaceChildren();
  for(let i=0;i<l.length;i++){
   const hole=l.holes.includes(i),b=block(hole?placements[i]:expected(l,i));const el=document.createElement('div');
   el.className='tile'+(hole?' editable':'')+(b?'':' empty')+(guideSlot()===i?' guide':'');el.dataset.position=i;
   el.setAttribute('aria-label',`${i+1}번째 ${b?b.name:'빈칸'}${hole?' · 블록을 끌어 놓는 칸':''}`);
   if(b){el.style.setProperty('--block',b.color);el.style.setProperty('--dark',b.dark);}el.textContent=b?b.symbol:'?';
   const num=document.createElement('small');num.textContent=i+1;el.append(num);
   $('bridge').append(el);
  }
  if(hints>0)for(let i=0;i<l.pattern.length;i++)$('bridge').children[i].classList.add('group');
 }
 function renderPalette(){
  $('palette').replaceChildren();
  for(const b of blocks){const el=document.createElement('button');el.dataset.block=b.id;el.setAttribute('aria-pressed',String(selected===b.id));el.setAttribute('aria-label',b.name+' 선택');el.style.setProperty('--dark',b.dark);el.innerHTML=`<b>${b.symbol}</b><span>${b.name}</span>`;
   el.addEventListener('pointerdown',startDrag);$('palette').append(el);
  }
 }
 function load(restore=false){
  if(!(restore&&saved?.pendingReward&&completed.includes(index))){
   const next=levels.findIndex((_,i)=>!completed.includes(i));
   if(next<0){startWarden();return;}
   if(index!==next)restore=false;
   index=next;
  }
  resetInputs();cancelDrag();placements={};history=[];hints=0;attempts=0;falls=0;mode='play';player={x:130,y:165};checkpoint=130;fallSlot=-1;pendingReward=null;selected=levels[index].pattern[0];
  if(restore&&saved?.run){const run=saved.run;for(const i of levels[index].holes)if(block(run.placements?.[i]))placements[i]=run.placements[i];
   for(const field of ['hints','attempts','falls'])if(!Number.isSafeInteger(run[field])||run[field]<0)run[field]=0;
   hints=run.hints;attempts=run.attempts;falls=run.falls;
   if(Number.isFinite(run.x)&&run.x>=20&&run.x<=875&&isSafe(run.x))player.x=checkpoint=run.x;
  }
  if(restore&&saved?.pendingReward?.index===index&&completed.includes(index))pendingReward=saved.pendingReward;
  dashboard();renderBridge();renderPalette();say('오른쪽 친구에게 가 보자! 끊어진 다리는 블록으로 고쳐 줘.');save();
  if(pendingReward){mode='reward';renderBridge();showReward();}
 }
 function startDrag(e){
  if(!editable()||e.button!==0||drag)return;e.preventDefault();resetInputs();selected=e.currentTarget.dataset.block;
  const b=block(selected),ghost=document.createElement('div');ghost.className='drag-ghost';ghost.style.background=b.color;ghost.textContent=b.symbol;document.body.append(ghost);
  drag={id:e.pointerId,block:selected,source:e.currentTarget,x:e.clientX,y:e.clientY,moved:false,ghost};e.currentTarget.setPointerCapture(e.pointerId);moveDrag(e);
  [...$('palette').children].forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.block===selected)));
 }
 function targetSlot(x,y){
  const target=document.elementFromPoint(x,y),tile=target?.closest('[data-position]');if(tile)return Number(tile.dataset.position);
  const r=canvas.getBoundingClientRect();if(x<r.left||x>r.right||y<r.top||y>r.bottom)return -1;
  const wy=(y-r.top)*canvas.height/r.height,wx=(x-r.left)*canvas.width/r.width+camera;
  return wy>=198&&wy<=280?slotAt(wx):-1;
 }
 function moveDrag(e){if(!drag||drag.id!==e.pointerId)return;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6;drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';hoverSlot=targetSlot(e.clientX,e.clientY);}
 function cancelDrag(){if(!drag)return;const d=drag;drag=null;d.ghost.remove();hoverSlot=-1;if(d.source.hasPointerCapture(d.id))d.source.releasePointerCapture(d.id);}
 function endDrag(e){if(!drag||drag.id!==e.pointerId)return;const d=drag,i=targetSlot(e.clientX,e.clientY);cancelDrag();suppressClick=true;setTimeout(()=>suppressClick=false,0);if(d.moved&&levels[index].holes.includes(i))place(i,d.block);else if(d.moved)say('블록은 다리의 점선 빈칸에 놓아 줘.');}
 document.addEventListener('pointermove',moveDrag);document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',cancelDrag);
 canvas.addEventListener('click',e=>{
  if(suppressClick)return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*canvas.width/r.width+camera,y=(e.clientY-r.top)*canvas.height/r.height;
  if(x>=865&&x<=930&&y>=156&&y<=244){openFriend();return;}

 });
 let friendPrevious='play',lastFriendMessage='';
 function openFriend(){
  if(!editable())return;friendPrevious=mode;mode='friend';resetInputs();cancelDrag();
  const ready=validate(levels[index],placements).solved;
  const messages=ready?[
   '다리가 완성됐네! 크리퍼가 건너오면 함께 놀 수 있겠다.',
   '우와, 길이 이어졌어! 크리퍼야, 이쪽으로 와. 같이 보물을 찾자!',
   '튼튼한 다리를 만들어 줬구나! 크리퍼랑 숲에서 숨바꼭질하고 싶어.',
   '멋진 다리야! 크리퍼가 오면 함께 소풍을 갈 거야.'
  ]:[
   '크리퍼랑 놀고 싶은데 다리가 끊어져 있어. 다리를 이어 줄래?',
   '크리퍼야, 보고 싶어! 블록의 규칙을 찾아서 우리를 만나게 해 줄래?',
   '같이 보물을 찾으러 가고 싶어. 어떤 블록이 이어지는지 살펴봐 줘!',
   '강 건너에서 기다리고 있어! 같은 순서가 반복되도록 다리를 만들어 줘.',
   '크리퍼랑 숨바꼭질할 거야! 빈칸에 알맞은 블록을 끌어 놓아 줄래?',
   '우리 함께 소풍 가자! 끊어진 다리를 고치면 크리퍼가 올 수 있어.'
  ];
  const candidates=messages.filter(message=>message!==lastFriendMessage);
  lastFriendMessage=candidates[Math.floor(Math.random()*candidates.length)];
  $('friend-message').textContent=lastFriendMessage;
  $('close-friend').textContent=validate(levels[index],placements).solved?'친구에게 걸어가기 →':'함께 놀 수 있게 다리 만들기 →';
  $('friend-dialog').showModal();$('close-friend').focus();
 }
 function closeFriend(){$('friend-dialog').close();mode=friendPrevious;resetInputs();canvas.focus({preventScroll:true});}
 $('close-friend').onclick=closeFriend;
 $('friend-dialog').addEventListener('cancel',e=>{e.preventDefault();closeFriend();});
 $('undo').onclick=()=>{if(!editable()||!history.length)return;placements=history.pop();renderBridge();say('한 칸 되돌렸어. 다른 블록으로도 생각해 보자.');save();};
 $('hint').onclick=()=>{if(!editable())return;hints++;const names=levels[index].pattern.map(id=>block(id).name.replace(' 블록',''));say(hints===1?'설계도의 금빛 테두리 한 묶음을 봐. 같은 순서가 어디에 또 있을까?':`${names.join(' → ')}. 이 묶음이 반복돼. 빈칸은 묶음의 어디에 있을까?`);renderBridge();save();};
 function fall(i){
  const wrong=!!placements[i];
  fallMessage=wrong?'잘못된 블럭을 놓아서 크리퍼가 빠졌어요. 다시 규칙을 찾아서 다리를 완성해주세요.':'블럭을 완성해서 크리퍼가 친구에게 갈 수 있도록 해줘요.';
  mode='fall';fallSlot=i;fallTime=0;falls++;resetInputs();cancelDrag();
  if(wrong){placements={};history=[];fallSlot=levels[index].holes[0];}
  checkpoint=130;say(fallMessage,true);renderBridge();save();
 }
 function recover(){
  player={x:130,y:165};checkpoint=130;mode='fall-guide';resetInputs();
  $('fall-message').textContent=fallMessage;renderBridge();save();
  if(!$('fall-dialog').open)$('fall-dialog').showModal();
  $('repair-bridge').focus({preventScroll:true});
 }
 function closeFallGuide(){
  $('fall-dialog').close();mode='repair';resetInputs();renderBridge();
  canvas.focus({preventScroll:true});save();
 }
 $('repair-bridge').onclick=closeFallGuide;
 $('fall-dialog').addEventListener('cancel',e=>{e.preventDefault();closeFallGuide();});

 function finish(){
  if(completed.includes(index)||mode==='reward'||pendingReward||!validate(levels[index],placements).solved)return;
  resetInputs();mode='reward';pendingReward=grant(completed,index);gems+=pendingReward.gems;points+=pendingReward.points;
  if(pendingReward.fresh)completed.push(index);
  records.push({level:index,attempts,hints,falls,at:Date.now()});records=records.slice(-60);checkpoint=player.x;save();dashboard();renderBridge();showReward();
 }
 function showReward(){const prize=pendingReward,b=badges[index];$('reward').style.setProperty('--prize',b.color);$('reward-rarity').textContent=prize.fresh?b.rarity+' · 새 배지 획득!':'다시 도전 성공!';$('reward-icon').textContent=b.icon;$('reward-title').textContent=prize.fresh?b.name:'다시 건넜어!';$('reward-copy').textContent='네가 이은 다리로 크리퍼가 친구에게 도착했어!';$('reward-values').textContent=`💎 보석 +${prize.gems}     ✦ ${prize.points}점`;$('reward-note').textContent=prize.fresh?'새 배지를 보물방에 보관했어!':'배지는 간직하고, 연습 보석을 더 모았어!';$('reward-next').textContent=index===5?'워든의 동물 공원으로 →':'보물 챙기고 다음 다리로 →';if(!$('reward').open)$('reward').showModal();$('reward-next').focus();}
 $('reward').addEventListener('cancel',e=>e.preventDefault());
 $('reward-next').onclick=()=>{if(!pendingReward)return;$('reward').close();pendingReward=null;load();canvas.focus({preventScroll:true});};
 function openAlbum(){resetInputs();cancelDrag();if(mode!=='reward'){pausedMode=mode;mode='album';}const grid=$('album-grid');grid.replaceChildren();badges.forEach((b,i)=>{const earned=i<6?completed.includes(i):wardenState.completed.includes(i-6);const card=document.createElement('article');card.className='badge-card'+(earned?' earned':' locked');card.style.setProperty('--prize',b.color);const art=document.createElement('span');art.textContent=earned?b.icon:'🔒';const title=document.createElement('b');title.textContent=b.name;const text=document.createElement('small');text.textContent=earned?b.rarity+' · 획득 완료':i<6?`${i+1}번째 다리를 건너면 획득`:'워든의 문장 문제를 완성하면 획득';card.append(art,title,text);grid.append(card);});$('album-summary').textContent=`배지 ${completed.length+wardenState.completed.length} / 11개 · 보석 ${gems}개 · ${points}점`;$('album').showModal();}
 function closeAlbum(){$('album').close();if(mode==='album')mode=pausedMode;resetInputs();}
 $('open-album').onclick=openAlbum;$('reward-album').onclick=openAlbum;$('close-album').onclick=closeAlbum;$('album').addEventListener('cancel',e=>{e.preventDefault();closeAlbum();});
 function pause(){if(fullscreenTransition)return;resetInputs();cancelDrag();if(!['play','repair','fall'].includes(mode))return;pausedMode=mode;mode='pause';$('pause-dialog').showModal();}
 function resume(){$('pause-dialog').close();mode=pausedMode;resetInputs();}
 $('pause').onclick=pause;$('resume').onclick=resume;$('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();resume();});
 window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editable()){if(!document.body.classList.contains('game-only')){e.preventDefault();pause();}return;}if(!editable()||e.target.closest('input,textarea,select'))return;const dir=['ArrowLeft','a','A'].includes(e.key)?-1:['ArrowRight','d','D'].includes(e.key)?1:0;if(dir){e.preventDefault();keys.add(dir);}});
 document.addEventListener('keyup',e=>{if(['ArrowLeft','a','A'].includes(e.key))keys.delete(-1);if(['ArrowRight','d','D'].includes(e.key))keys.delete(1);});
 document.querySelectorAll('[data-move]').forEach(el=>{
  el.addEventListener('pointerdown',e=>{if(!editable()||e.button!==0)return;e.preventDefault();touches.set(e.pointerId,Number(el.dataset.move));el.classList.add('held');el.setPointerCapture(e.pointerId);});
  const stop=e=>{touches.delete(e.pointerId);el.classList.remove('held');};el.addEventListener('pointerup',stop);el.addEventListener('pointercancel',stop);el.addEventListener('lostpointercapture',stop);
 });

 function update(dt){
  if(mode==='fall'){fallTime+=dt;player.y=165+230*fallTime*fallTime;if(fallTime>.7)recover();return;}
  if(!editable()||drag)return;
  const dir=Number(keys.has(1)||[...touches.values()].includes(1))-Number(keys.has(-1)||[...touches.values()].includes(-1));
  // Check along the path, not just at the end, so even a slow frame cannot skip a gap.
  const steps=Math.max(1,Math.ceil(Math.abs(dir*175*dt)/4));
  for(let n=0;n<steps;n++){player.x=Math.max(20,Math.min(875,player.x+dir*175*dt/steps));if(!isSafe(player.x)){fall(slotAt(player.x+14));return;}checkpoint=player.x;}
  if(player.x>=850)finish();
 }
 window.creativeGame={snapshot:()=>({mode,index,player:{...player},camera,placements:{...placements},warden:JSON.parse(JSON.stringify(wardenState)),falls,fallSlot,guideSlot:guideSlot(),completed:[...completed],gems,points,pendingReward:pendingReward?{...pendingReward}:null})};
 function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
 function tree(x,y,s){rect(x+18*s,y+30*s,10*s,45*s,'#52604a');rect(x,y,46*s,35*s,'#547d63');rect(x+8*s,y-15*s,30*s,48*s,'#739568');rect(x+3*s,y+7*s,15*s,15*s,'#89a574');}
 function creeper(x,y){rect(x,y,28,29,'#8abe65');rect(x+3,y+3,9,8,'#a4ce77');rect(x+4,y+10,7,7,'#223f35');rect(x+18,y+10,7,7,'#223f35');rect(x+10,y+17,9,9,'#223f35');rect(x+6,y+23,6,6,'#223f35');rect(x+19,y+23,5,6,'#223f35');rect(x+5,y+29,19,23,'#76a855');rect(x+1,y+48,10,9,'#487a4a');rect(x+18,y+48,10,9,'#487a4a');}
 function draw(){
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);camera=Math.max(0,Math.min(1000-canvas.width,player.x-canvas.width*.4));ctx.translate(-camera,0);
 rect(0,0,1000,360,'#bcdacb');rect(0,90,1000,125,'#acc9b3');for(const [x,y] of [[75,40],[415,24],[770,55]]){rect(x,y,90,12,'#edf1d9');rect(x+15,y-10,45,10,'#edf1d9');}for(let i=0;i<11;i++)tree(i*107-20,95+(i%3)*13,1.1);
 rect(0,218,1000,142,'#5c9caa');for(let i=0;i<24;i++)rect((i*83)%990,241+(i%5)*23,32+(i%3)*12,3,i%2?'#83b8bd':'#70aeb5');
 for(const x of [0,805]){rect(x,227,195,133,'#8d7960');rect(x,222,195,16,'#739652');rect(x,217,195,7,'#a6ba71');for(let i=0;i<14;i++)rect(x+(i*47)%180,252+(i%4)*26,14,9,'#a38c6b');}
 tree(22,132,.8);tree(915,139,.9);rect(859,176,4,43,'#79644c');rect(863,175,33,22,'#ead38a');
 const l=levels[index],width=610/l.length;for(let i=0;i<l.length;i++){const id=l.holes.includes(i)?placements[i]:expected(l,i),b=block(id),x=195+i*width;if(b){rect(x,226,width-3,25,b.color);rect(x,246,width-3,6,b.dark);rect(x+4,229,width-11,3,'#ffffff55');ctx.fillStyle=b.dark;ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText(b.symbol,x+width/2,245);}else{ctx.strokeStyle='#dae7cb';ctx.setLineDash([4,5]);ctx.strokeRect(x+2,228,width-7,22);ctx.setLineDash([]);}}
 if(guideSlot()>=0||hoverSlot>=0){const i=hoverSlot>=0?hoverSlot:guideSlot();if(l.holes.includes(i)){ctx.strokeStyle=hoverSlot>=0?'#fff9bb':'#f6cf79';ctx.lineWidth=4;ctx.strokeRect(195+i*width+2,221,width-7,36);ctx.lineWidth=1;ctx.font='bold 15px sans-serif';ctx.fillStyle='#254b41';ctx.fillText('↓',195+(i+.5)*width,212);}}
 if(mode==='fall'){for(let i=0;i<8;i++)rect(player.x-15+i*8,265-Math.sin(fallTime*5+i)*14,5,5,'#d3f5eb');}
 rect(827,204,29,23,'#c59a45');rect(825,200,33,9,'#e9c36a');rect(839,208,6,9,'#fff2a3');
 creeper(player.x,player.y);rect(886,178,23,23,'#e9c68e');rect(883,173,29,10,'#684e38');rect(887,201,21,26,'#e7b552');rect(887,227,8,7,'#4a6b70');rect(901,227,8,7,'#4a6b70');rect(899,187,4,4,'#354b41');
 if(mode==='reward'){ctx.fillStyle='#f5d878';ctx.font='bold 28px sans-serif';ctx.fillText('✦',857,145);}ctx.font='bold 11px sans-serif';ctx.fillStyle='#375e4b';ctx.textAlign='center';ctx.fillText('크리퍼',player.x+14,152);ctx.fillText('친구',898,158);
 }
 let fullscreenTransition=false,nativeFullscreen=false,fullscreenTimer;
 function isIpadSafari(){
  const ua=navigator.userAgent||'';
  const ipad=/iPad/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  return ipad&&/Safari/i.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
 }
 function gameOnly(on){
  resetInputs();cancelDrag();document.body.classList.toggle('game-only',on);
  $('fullscreen').setAttribute('aria-pressed',String(on));$('warden-fullscreen').setAttribute('aria-pressed',String(on));$('warden-fullscreen').textContent=on?'✕ 전체화면 나가기':'⛶ 전체화면';
  $('fullscreen').setAttribute('aria-label',on?'전체화면 나가기':'전체화면');
  $('fullscreen').textContent=on?'✕ 전체화면 나가기':'⛶ 전체화면';resize();
  if(editable())canvas.focus({preventScroll:true});
 }
 async function toggleFullscreen(){
  fullscreenTransition=true;clearTimeout(fullscreenTimer);fullscreenTimer=setTimeout(()=>fullscreenTransition=false,1400);
  if(document.body.classList.contains('game-only')){gameOnly(false);if(document.fullscreenElement)try{await document.exitFullscreen();}catch{}nativeFullscreen=false;return;}
  gameOnly(true);
  if(!isIpadSafari()&&document.documentElement.requestFullscreen)try{await document.documentElement.requestFullscreen();nativeFullscreen=true;}catch{}
 }
 $('fullscreen').onclick=toggleFullscreen;$('warden-fullscreen').onclick=toggleFullscreen;$('ending-fullscreen').onclick=toggleFullscreen;
 document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement){nativeFullscreen=true;gameOnly(true);}else if(nativeFullscreen){nativeFullscreen=false;gameOnly(false);}clearTimeout(fullscreenTimer);fullscreenTimer=setTimeout(()=>fullscreenTransition=false,1400);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('game-only')&&!document.querySelector('dialog[open]')){e.preventDefault();toggleFullscreen();}});
 // Keep iPad gestures from taking over game input while allowing page scrolling.
 for(const event of ['contextmenu','selectstart','dblclick','gesturestart','gesturechange','gestureend'])document.addEventListener(event,e=>e.preventDefault(),{passive:false});
 for(const event of ['touchstart','touchmove'])document.addEventListener(event,e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
 function resize(){canvas.width=window.innerWidth<650?480:1000;canvas.height=360;draw();}
 const warden=createWardenGame({state:wardenState,save,onWallet:(g,p)=>{gems+=g;points+=p;dashboard();},onFinish:showEnding});
 for(const [i,name] of ['동물 공원의 관찰자','워든의 숫자 탐정','동물 친구 수호자','크기 비교 탐정','수 비교 마스터'].entries())badges.push({icon:i===2?'🏆':'🐾',name,rarity:i===2?'전설':'희귀',color:i===2?'#e4b74f':'#69a7c8'});
 function startWarden(){
  resetInputs();cancelDrag();mode='warden';document.querySelector('.adventure').hidden=true;document.querySelector('.workshop').hidden=true;document.querySelector('.title').hidden=true;
  dashboard();warden.start();
 }
 function showEnding(){
  mode='ending';$('warden-game').hidden=true;$('creative-ending').hidden=false;dashboard();save();
 }
 $('ending-album').onclick=openAlbum;
 load(true);resize();window.addEventListener('resize',resize);
 function tick(now){const dt=Math.min(.04,(now-(previousTime||now))/1000);previousTime=now;update(dt);draw();requestAnimationFrame(tick);}
 requestAnimationFrame(tick);
})();
