'use strict';
(() => {
const $ = id => document.getElementById(id);
const user = typeof window !== 'undefined' ? window.__BLOCK_USER__ : null;
const SAVE = 'seonyul-block-island-v1' + (user ? ('_' + user.id) : '');
const missions = [
 {a:7,b:8,name:'여우의 숲으로 가는 길',chapter:'첫 번째 모험',icon:'🌿',friend:'🦊',description:'강 너머 여우가 기다려.<br>블록으로 열 칸 다리를 만들어 볼까?',title:'여우에게 가는 다리를 만들자!',message:'내가 놓은 블록은 7개야. 수레에서 가져와 열 칸을 채워 줘!',left:'열 칸 다리',right:'여우의 블록 수레',endpoint:[7,11],destination:[11,11],bridge:[8,10,11,12],reward:'여우의 숲을 발견했어!',rewardText:'7개에 3개를 더하니 10개!<br>수레에 남은 5개도 합치면 모두 15개야.',location:'여우의 숲'},
 {a:9,b:6,name:'반짝 광산으로 가는 길',chapter:'두 번째 모험',icon:'💎',friend:'🐻',description:'곰이 반짝이는 광석을 찾았대.<br>열 칸 철길을 이어서 만나러 가자!',title:'광산으로 가는 철길을 잇자!',message:'철길 블록 9개를 놓았어. 열 칸이 되려면 몇 개 더 필요할까?',left:'열 칸 철길',right:'곰의 광석 수레',endpoint:[13,9],destination:[13,5],bridge:[13,14,6,8],reward:'반짝 광산을 발견했어!',rewardText:'9개에 1개를 더하니 10개!<br>남은 5개와 합치면 이번에도 15개야.',location:'반짝 광산'},
 {a:8,b:5,name:'우리만의 블록 정원',chapter:'세 번째 모험',icon:'🌼',friend:'🐰',description:'토끼가 작은 정원에 초대했어.<br>마지막 다리 너머엔 어떤 놀이가 있을까?',title:'블록 정원으로 가는 다리를 만들자!',message:'다리에 블록이 8개 있어. 파란 블록을 옮겨 열 칸을 만들어 줘!',left:'정원으로 가는 다리',right:'토끼의 블록 수레',endpoint:[17,2],destination:[21,2],bridge:[18,20,2,3],reward:'선율이의 블록 정원이 열렸어!',rewardText:'8개에 2개를 더하니 10개!<br>남은 3개와 합치면 모두 13개야.<br>이제 정원에서 나만의 모양을 만들어 봐!',location:'선율이의 블록 정원'}
];
// All 45 ordered single-digit pairs whose sums are 10 through 18.
const questionBank=[];
for(let a=9;a>=1;a--)for(let b=1;b<=9;b++)if(a+b>=10)questionBank.push({a,b,key:`${a}+${b}`});
const friends={
 fox:{name:'여우 루루',emoji:'🦊',item:'🍎',activity:'사과 소풍',target:'🧺 사과 바구니',unit:'사과',badge:'소풍 친구',unlock:1,x:14,y:13,color:'#dc9866',intro:'소풍 갈래? 사과를 열 칸 바구니에 담아 줘!',pet:['헤헤, 간질간질해!','선율이 손이 따뜻해!','우린 멋진 소풍 친구야!'],material:'사과 바구니',decoration:'사과 소풍 자리'},
 bear:{name:'곰 보보',emoji:'🐻',item:'💎',activity:'반짝 보석 광산',target:'🚃 보석 수레',unit:'보석',badge:'보석 탐험가',unlock:2,x:12,y:4,color:'#7aaeb7',intro:'반짝! 보석을 찾아서 열 칸 수레에 실어 보자!',pet:['으히히! 기분이 좋아!','폭신폭신 곰 포옹!','선율이는 나의 보석 친구야!'],material:'보석 수레',decoration:'보석 전시장'},
 rabbit:{name:'토끼 모모',emoji:'🐰',item:'🥕',activity:'당근 정원',target:'🌱 당근 밭',unit:'당근',badge:'당근 정원사',unlock:3,x:24,y:2,color:'#b1b969',intro:'당근이 쑥쑥! 열 칸 밭에 당근을 모아 줘!',pet:['깡충! 정말 좋아!','귀도 살살 만져 줘!','선율이랑 또 놀고 싶어!'],material:'당근 밭',decoration:'꽃 정원'}
};
const friendKeys=Object.keys(friends);
const treasures=[{id:'leaf',icon:'🍀',name:'행운의 네잎클로버',x:3,y:13,island:0},{id:'apple',icon:'🍎',name:'반짝 황금 사과',x:15,y:14,island:1},{id:'gem',icon:'💎',name:'무지개 보석',x:14,y:1,island:2},{id:'flower',icon:'🌸',name:'별빛 꽃',x:22,y:3,island:3}];
const milestones=[{at:5,icon:'🌱',name:'새싹 탐험가'},{at:10,icon:'⭐',name:'반짝 탐험가'},{at:20,icon:'👑',name:'블록 왕관'},{at:45,icon:'🏆',name:'열칸 섬 마스터'}];
let saved = {};
try { saved = JSON.parse(localStorage.getItem(SAVE) || '{}') || {}; } catch {}
let completed = Number.isInteger(saved.completed) ? Math.max(0,Math.min(3,saved.completed)) : 0;
let garden = Array.isArray(saved.garden) && saved.garden.length===60 ? saved.garden.map(v=>Number.isInteger(v)&&v>=0&&v<4?v:null) : Array(60).fill(null);
let badges={};
if(saved.badges&&typeof saved.badges==='object')for(const q of questionBank){const v=saved.badges[q.key];if(v&&Number.isSafeInteger(v.count)&&v.count>0)badges[q.key]={count:Math.min(v.count,100000),friend:friends[v.friend]?v.friend:'fox'};}
// Preserve the achievements of children who played the original three bridges.
if(!saved.badges)for(let i=0;i<completed;i++){const m=missions[i];badges[`${m.a}+${m.b}`]={count:1,friend:friendKeys[i]};}
let bonds={},supplies={};
for(const key of friendKeys){bonds[key]=Number.isInteger(saved.bonds?.[key])?Math.max(0,Math.min(5,saved.bonds[key])):0;supplies[key]=Number.isSafeInteger(saved.supplies?.[key])?Math.max(0,Math.min(100000,saved.supplies[key])):0;}
let foundTreasures=new Set(Array.isArray(saved.treasures)?saved.treasures.filter(id=>treasures.some(t=>t.id===id)):[]);
let currentProblem=null,roundSolved=false,selectedFriend='fox',albumReturn=null,practiceCycle=0,lastReward=null;
const problem=()=>currentProblem||{...missions[activeMission],kind:'bridge',friendKey:friendKeys[activeMission]};
const badgeTotal=()=>Object.values(badges).reduce((sum,b)=>sum+b.count,0);
let muted = true, audioContext, toastTimer, started = false, activeMission = 0, moved = 0, selectedColor=0, replaceAnswer=false, demoAnimation=null;
let player = {x:4,y:12,visualX:4,visualY:12,lastLandX:4,lastLandY:12,inWater:false,splashUntil:0,shockUntil:0}, path=[], onArrival=null, walking=0, lastTime=0;
const dialogs = ['welcome','puzzle','reward','sandbox','album','friend-dialog','discovery','rescue-dialog','zombie-dialog','bomb-dialog'];
const modalOpen = () => dialogs.some(id=>$(id).open);
function save(){try{localStorage.setItem(SAVE,JSON.stringify({completed,garden,badges,bonds,supplies,treasures:[...foundTreasures]}));}catch{}}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function tone(notes=[440],duration=.12){if(muted)return;try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();notes.forEach((n,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime+i*.1;o.type='sine';o.frequency.value=n;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.08,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+duration+.02);});}catch{}}
function openDialog(id){path=[];onArrival=null;for(const d of dialogs)if($(d).open)$(d).close();$(id).showModal();$(id).scrollTop=0;if(id==='reward')$(id).focus({preventScroll:true});}
function closeDialog(id){$(id).close();if('speechSynthesis' in window)window.speechSynthesis.cancel();$('world').focus({preventScroll:true});}
function updateQuest(){
 $('collection').textContent=`✦ 발견한 섬 ${completed+1} / 4`;
 $('badge-count').textContent=badgeTotal();$('practice-now').hidden=completed===0||completed===3;
 for(const button of document.querySelectorAll('[data-friend]'))button.querySelector('small').textContent=completed>=friends[button.dataset.friend].unlock?'👆 같이 놀자':'🔒 다리 먼저';
 if(completed<3){const m=missions[completed];$('quest-icon').textContent=m.icon;$('quest-chapter').textContent=m.chapter;$('quest-step').textContent=`0${completed+1} / 03`;$('quest-title').textContent=m.name;$('quest-desc').innerHTML=m.description;$('go-quest').innerHTML='다리 만들러 가기 <span>→</span>';}
 else{$('quest-icon').textContent='🌼';$('quest-chapter').textContent='선율이의 새로운 세상';$('quest-step').textContent='03 / 03';$('quest-title').textContent='모든 섬이 이어졌어!';$('quest-desc').innerHTML=`친구들과 놀며 배지를 모아 봐!<br>서로 다른 문제 ${Object.keys(badges).length} / 45개`; $('go-quest').innerHTML='🎲 새로운 문제 풀기 <span>→</span>';}
 $('progress-dots').innerHTML=missions.map((_,i)=>`<i class="${i<completed?'done':i===completed?'active':''}"></i>`).join('');$('free-build').hidden=completed<3;
}
function openPuzzle(index){
 activeMission=index;beginProblem({...missions[index],kind:'bridge',friendKey:friendKeys[index],key:`${missions[index].a}+${missions[index].b}`});
}
function startPractice(friendKey=selectedFriend){
 if(completed<1){openPuzzle(0);return;}
 if(!friends[friendKey]||completed<friends[friendKey].unlock)friendKey='fox';
 selectedFriend=friendKey;
 const unseen=questionBank.filter(q=>!badges[q.key]);
 const q=unseen.length?unseen[0]:questionBank[(practiceCycle++)%questionBank.length];
 beginProblem({...q,kind:'practice',friendKey,friend:friends[friendKey].emoji});
}
function beginProblem(q){
 currentProblem=q;roundSolved=false;moved=0;replaceAnswer=false;stopDemo();delete $('puzzle').dataset.highlightOrigin;for(const ghost of document.querySelectorAll('.transfer-cube'))ghost.remove();
 $('answer-input').value='';$('answer-input').removeAttribute('aria-invalid');
 $('reward-text').textContent='';$('reward-equation').textContent='';
 $('friend-face').textContent=q.friend;$('original-a').textContent=q.a;$('original-b').textContent=q.b;
 $('activity-banner').hidden=q.kind!=='practice';$('puzzle').dataset.theme=q.kind==='practice'?q.friendKey:'bridge';
 if(q.kind==='practice'){const f=friends[q.friendKey];$('activity-banner').textContent=`${f.item} ${f.name}의 ${f.activity} · 맞히면 배지 +1`;}
 renderPuzzle();openDialog('puzzle');requestAnimationFrame(showDemo);
}
function cube(side,index,movable){
 const button=document.createElement('button');
 button.className='cell cube'+(movable?' movable':'');button.innerHTML=`<span>${problem().kind==='practice'?friends[problem().friendKey].item:'·'}</span>`;
 button.dataset.side=side;button.dataset.index=index;button.dataset.origin=movable?'b':'a';
 button.setAttribute('aria-label',movable?(side==='right'?'파란 블록을 다리로 옮기기':'파란 블록을 수레로 돌려놓기'):`처음 놓인 블록 ${index+1}`);
 if(!movable)button.disabled=true;
 else{button.addEventListener('pointerdown',startDrag);button.addEventListener('click',e=>{if(e.detail===0)transfer(side);});}
 return button;
}
function renderPuzzle(){
 const m=problem(),left=m.a+moved,right=m.b-moved,full=left===10;
 $('puzzle').classList.toggle('answer-phase',full);
 $('left-frame').replaceChildren();$('right-frame').replaceChildren();
 for(let i=0;i<10;i++){
   if(i<left)$('left-frame').append(cube('left',i,i>=m.a));
   else{const empty=document.createElement('button');empty.className='cell hinted';empty.textContent='+';empty.setAttribute('aria-label','반짝이는 빈칸에 파란 블록 놓기');empty.onclick=()=>transfer('right');$('left-frame').append(empty);}
   if(i<right)$('right-frame').append(cube('right',i,true));
   else{const empty=document.createElement('button');empty.className='cell';empty.setAttribute('aria-label','이 칸으로 블록 돌려놓기');empty.onclick=()=>transfer('left');$('right-frame').append(empty);}
 }
 if(!full)$('right-frame').querySelector('.movable')?.classList.add('tap-target');
 $('left-count').textContent=left;$('right-count').textContent=right;
 $('left-name').textContent=full?'🌉 10개 한 묶음':'🌉 열 칸 다리';
 $('right-name').textContent=full?'🧊 남은 블록':'🧊 파란 블록';
 $('left-caption').textContent=full?'10개가 한 묶음!':'반짝이는 곳을 채워 줘!';
 $('right-caption').textContent=full?'남은 블록도 함께 세어 봐!':'👆 파란 블록을 눌러!';
 $('puzzle-title').textContent=full?'모두 몇 개인지 써 볼까?':'파란 블록을 톡 눌러 봐!';
 $('instruction').textContent=full?'10개와 남은 블록을 모두 세어 봐.':moved?'좋아! 반짝이는 빈칸을 마저 채워 줘.':'반짝이는 빈칸으로 옮겨 줘.';
 if(m.kind==='practice'){
  const f=friends[m.friendKey];$('left-name').textContent=full?'10개 한 묶음':f.target;$('right-name').textContent=full?`남은 ${f.unit}`:f.item+' '+f.unit;
  $('puzzle-title').textContent=full?'모두 몇 개인지 써 볼까?':`${f.unit} 블록을 톡 눌러 봐!`;
  $('right-caption').textContent=full?'남은 것도 함께 세어 봐!':`👆 ${f.unit}를 눌러!`;
 }
 // Match left-to-right block groups to the written addends, retaining provenance.
 $('origin-a-label').textContent=`처음 주황 ${m.a}개`;$('origin-b-label').textContent=`처음 파란 ${m.b}개`;
 $('current-a').textContent=left;$('current-b').textContent=right;
 $('regroup-equals').hidden=moved===0;$('regrouped-sum').hidden=moved===0;
 $('puzzle-title').textContent=full?`${m.a} + ${m.b}, 모아서 세어 볼까?`:`${m.a}개를 10개로 만들어 보자!`;
 $('instruction').textContent=full?`10개와 남은 ${right}개. 처음 블록을 모두 합하면 몇 개일까?`:`파란 ${m.b}개에서 ${10-m.a}개를 주황 ${m.a}개 쪽으로 옮겨 봐!`;
 $('left-name').textContent=full?'10개 한 묶음':`주황 ${m.a}개가 있어`;
 $('right-name').textContent=moved?'남은 파란 블록':`파란 ${m.b}개를 더할 거야`;
 $('left-caption').textContent=moved?`주황 ${m.a}개 + 옮겨 온 파란 ${moved}개`:'이쪽에 모아서 10개 만들기';
 $('right-caption').textContent=moved?`처음 ${m.b}개 중 ${right}개가 남았어`:'👆 여기서 블록을 옮겨 봐!';
 $('move-story').textContent=moved?`파란 ${m.b}개 중 ${moved}개가 이쪽으로 왔어!`:`주황 ${m.a}개 + 파란 ${m.b}개를 모두 세어 보자.`;
 $('split-story').hidden=moved===0;
 $('split-original').textContent=`처음 파란 ${m.b}개`;$('split-moved').textContent=`옮긴 ${moved}개`;$('split-left').textContent=`남은 ${right}개`;
 $('right-frame').setAttribute('aria-label',m.kind==='practice'?friends[m.friendKey].unit+' 블록':'옮길 파란 블록');
 $('left-frame').setAttribute('aria-label',m.kind==='practice'?friends[m.friendKey].target:'열 칸 다리');
 $('left-frame').classList.toggle('full',full);
 $('build-area').querySelector('.transfer-mark').textContent=full?'+':'←';
 $('completion-note').hidden=!full;
 $('completion-note').textContent=`${m.a} + ${m.b}도, 10 + ${right}도 같은 블록이야!`;
 $('step-move').classList.toggle('active',!full);$('step-move').classList.toggle('done',full);
 $('step-answer').classList.toggle('active',full);
 $('answer-panel').hidden=!full;$('hint').hidden=full;$('undo').disabled=moved===0;
 $('answer-input').value='';replaceAnswer=false;clearAnswerFeedback();updateAnswerButton();
}
let originTimer;
function highlightOrigin(origin){
 clearTimeout(originTimer);$('puzzle').dataset.highlightOrigin=origin;
 const m=problem();$('move-story').textContent=origin==='a'?`처음 주황 ${m.a}개는 여기 있어!`:`처음 파란 ${m.b}개야. 옮겨도 파란색은 그대로!`;
 originTimer=setTimeout(()=>{delete $('puzzle').dataset.highlightOrigin;},1800);
}
$('original-a').onclick=()=>highlightOrigin('a');$('original-b').onclick=()=>highlightOrigin('b');
function animateTransfer(from,destination,item){
 if(!from||!destination||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const to=destination.getBoundingClientRect();destination.classList.add('in-transit');
 const ghost=document.createElement('div');ghost.className='transfer-cube';ghost.textContent=item;
 Object.assign(ghost.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
 $('puzzle').append(ghost);
 const animation=ghost.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(${to.width/from.width})`,opacity:1}],{duration:480,easing:'ease-in-out',fill:'forwards'});
 animation.onfinish=()=>{ghost.remove();destination.classList.remove('in-transit');};
}
function stopDemo(){demoAnimation?.cancel();demoAnimation=null;$('demo-hand').hidden=true;}
function showDemo(){
 stopDemo();if(!$('puzzle').open||problem().a+moved===10)return;
 const source=$('right-frame').querySelector('.movable'),target=$('left-frame').querySelector('.cell:not(.cube)');
 if(!source||!target)return;
 const area=$('build-area').getBoundingClientRect(),a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
 const hand=$('demo-hand');hand.hidden=false;
 const from=`translate(${a.left-area.left+a.width/2-14}px,${a.top-area.top+a.height/2-5}px)`;
 const to=`translate(${b.left-area.left+b.width/2-14}px,${b.top-area.top+b.height/2-5}px)`;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){hand.style.transform=from;return;}
 demoAnimation=hand.animate([
  {transform:from,opacity:0,offset:0},{transform:from,opacity:1,offset:.12},
  {transform:from+' scale(.8)',opacity:1,offset:.28},
  {transform:to,opacity:1,offset:.68},{transform:to,opacity:0,offset:.9},{transform:to,opacity:0,offset:1}
 ],{duration:2200,iterations:2});
 demoAnimation.onfinish=()=>{hand.hidden=true;};
}
function transfer(side){
 const m=problem();
 for(const ghost of document.querySelectorAll('.transfer-cube'))ghost.remove();for(const cube of document.querySelectorAll('.in-transit'))cube.classList.remove('in-transit');
 const source=(side==='right'?$('right-frame').querySelector('.movable'):[...$('left-frame').querySelectorAll('.movable')].at(-1))?.getBoundingClientRect();
 if(side==='right'&&m.a+moved<10&&m.b-moved>0){moved++;tone([390+moved*60]);}
 else if(side==='left'&&moved>0){moved--;tone([350]);}
 else return;
 stopDemo();renderPuzzle();
 const target=(side==='right'?[...$('left-frame').querySelectorAll('.movable')].at(-1):[...$('right-frame').querySelectorAll('.movable')].at(-1));
 animateTransfer(source,target,m.kind==='practice'?friends[m.friendKey].item:'');
 $('regrouped-sum').animate([{transform:'scale(1)'},{transform:'scale(1.1)'},{transform:'scale(1)'}],{duration:400});
 if(m.a+moved===10)tone([523,659,784],.22);
}
function clearAnswerFeedback(){
 $('answer-input').removeAttribute('aria-invalid');
 $('answer-feedback').textContent='천천히 세어도 괜찮아.';
 $('answer-feedback').classList.remove('try-again');
}
function updateAnswerButton(){
 $('finish').disabled=problem().a+moved!==10||!/^\d{1,2}$/.test($('answer-input').value);
 $('erase-answer').disabled=!$('answer-input').value;
}
function enterDigit(digit){
 if($('answer-panel').hidden)return;
 const input=$('answer-input');
 if(replaceAnswer){input.value='';replaceAnswer=false;}
 if(input.value.length<2)input.value+=digit;
 clearAnswerFeedback();updateAnswerButton();
}
for(const key of document.querySelectorAll('[data-digit]'))key.onclick=()=>enterDigit(key.dataset.digit);
$('answer-input').addEventListener('input',()=>{
 $('answer-input').value=$('answer-input').value.normalize('NFKC').replace(/[^0-9]/g,'').slice(0,2);
 replaceAnswer=false;clearAnswerFeedback();updateAnswerButton();
});
$('erase-answer').onclick=()=>{$('answer-input').value=$('answer-input').value.slice(0,-1);replaceAnswer=false;clearAnswerFeedback();updateAnswerButton();};
$('puzzle').addEventListener('keydown',e=>{
 if($('answer-panel').hidden)return;
 if(e.target!==$('answer-input')&&/^\d$/.test(e.key)){e.preventDefault();enterDigit(e.key);}
 else if(e.target!==$('answer-input')&&e.key==='Backspace'){e.preventDefault();$('erase-answer').click();}
 else if(e.key==='Enter'&&(e.target===$('answer-input')||e.target===$('puzzle'))){e.preventDefault();submitAnswer();}
});
function submitAnswer(){
 const m=problem(),value=$('answer-input').value;
 if(roundSolved||!$('puzzle').open||m.a+moved!==10||!/^\d{1,2}$/.test(value))return;
 if(Number(value)!==m.a+m.b){
  $('answer-feedback').textContent='한 번 더 세어 볼까? 10개부터 남은 블록을 이어 세어 봐.';
  $('answer-feedback').classList.add('try-again');$('answer-input').setAttribute('aria-invalid','true');
  replaceAnswer=true;return;
 }
 roundSolved=true;
 const previousUnique=Object.keys(badges).length,key=`${m.a}+${m.b}`,existing=badges[key];
 badges[key]={count:(existing?.count||0)+1,friend:existing?.friend||m.friendKey};
 supplies[m.friendKey]++;bonds[m.friendKey]=Math.min(5,bonds[m.friendKey]+1);
 const newBridge=m.kind==='bridge'&&activeMission>=completed;
 if(m.kind==='bridge')completed=Math.max(completed,activeMission+1);
 const milestone=milestones.find(t=>previousUnique<t.at&&Object.keys(badges).length>=t.at);
 lastReward={...m,newBadge:!existing,newBridge,milestone};
 save();updateQuest();showReward();
}
function showReward(){
 const m=lastReward;if(!m)return;const f=friends[m.friendKey];
 $('reward-kicker').textContent=m.newBadge?'새 배지를 받았어!':'한 번 더 해냈어! 배지 +1';
 $('reward-icon').textContent=f.item;$('reward-badge-name').textContent=f.badge;
 $('reward-title').textContent=`선율아, ${f.badge} 배지야!`;
 $('reward-text').textContent=m.newBridge?`${f.emoji} 새 다리도 열렸어! 친구를 만나러 가자.`:`${f.emoji} 고마워! ${f.material} 하나를 완성했어!`;
 $('reward-equation').textContent=`${m.a} + ${m.b} = 10 + ${m.a+m.b-10} = ${m.a+m.b}`;
 $('reward-math-story').textContent=`처음 ${m.a}개와 ${m.b}개를 합치면 ${m.a+m.b}개! 옮겨도 전체 개수는 같아.`;
 $('reward-total').textContent=badgeTotal()+'개';
 const next=milestones.find(t=>t.at>Object.keys(badges).length);
 $('reward-milestone').textContent=m.milestone?`${m.milestone.icon} 특별 선물! ${m.milestone.name} 달성!`:next?`서로 다른 배지 ${Object.keys(badges).length} / ${next.at}개 · 다음 선물 ${next.icon}`:'🏆 45가지 문제를 모두 해냈어!';
 $('continue').textContent=m.kind==='bridge'?'새로운 섬으로 걸어가기 →':'🎲 다음 문제 · 배지 또 받기';
 $('reward-confetti').replaceChildren();for(let i=0;i<28;i++){const bit=document.createElement('i');bit.style.setProperty('--x',(i*37%100)+'%');bit.style.setProperty('--delay',(-i*.11)+'s');bit.style.setProperty('--turn',(i*53)+'deg');bit.style.background=['#f3c45d','#86b8ac','#e5a8bb','#b4c777'][i%4];$('reward-confetti').append(bit);}
 openDialog('reward');tone([523,659,784,1047],.3);confettiUntil=performance.now()+3500;
}

let drag=null, handledPointer=null;
// A touch click can land on a different button after the answer layout opens.
// Consume the compatibility click for a block gesture already handled on pointerup.
$('puzzle').addEventListener('click',e=>{
 if(handledPointer&&e.detail>0&&performance.now()<handledPointer.until&&Math.hypot(e.clientX-handledPointer.x,e.clientY-handledPointer.y)<30){
  e.preventDefault();e.stopImmediatePropagation();handledPointer=null;
 }
},true);
function startDrag(e){if(e.button!==0)return;e.preventDefault();handledPointer=null;cleanupDrag();drag={side:e.currentTarget.dataset.side,x:e.clientX,y:e.clientY,dragged:false,pointerId:e.pointerId};document.addEventListener('pointermove',moveDrag);document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',cancelDrag);}
function moveDrag(e){if(!drag||e.pointerId!==drag.pointerId)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)drag.dragged=true;if(drag.dragged){if(!drag.ghost){drag.ghost=document.createElement('div');drag.ghost.className='drag-ghost';$('puzzle').append(drag.ghost);}drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';}}
function endDrag(e){if(!drag||e.pointerId!==drag.pointerId)return;const side=drag.side,target=$(side==='right'?'left-frame':'right-frame').getBoundingClientRect(),accepted=!drag.dragged||(e.clientX>=target.left&&e.clientX<=target.right&&e.clientY>=target.top&&e.clientY<=target.bottom);handledPointer={x:e.clientX,y:e.clientY,until:performance.now()+500};cleanupDrag();if(accepted)transfer(side);}
function cancelDrag(){cleanupDrag();}
function cleanupDrag(){if(drag?.ghost)drag.ghost.remove();drag=null;document.removeEventListener('pointermove',moveDrag);document.removeEventListener('pointerup',endDrag);document.removeEventListener('pointercancel',cancelDrag);}
$('undo').onclick=()=>transfer('left');$('hint').onclick=showDemo;$('close-puzzle').onclick=()=>closeDialog('puzzle');
$('speak').onclick=()=>{if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance($('puzzle-title').textContent+' '+$('instruction').textContent);u.lang='ko-KR';u.rate=.85;speechSynthesis.speak(u);};
$('finish').onclick=submitAnswer;
$('continue').onclick=()=>{
 const m=lastReward;if(!m)return;
 if(m.kind==='practice'){startPractice(m.friendKey);return;}
 closeDialog('reward');walkTo(...m.destination,()=>{toast(`${m.location}에 도착했어! 친구를 눌러 봐.`);openFriend(m.friendKey);});
};
$('replay').onclick=()=>{const m=lastReward;if(m)beginProblem({...m});};
$('reward-world').onclick=()=>closeDialog('reward');
$('reward-album').onclick=()=>openAlbum('reward');
$('open-album').onclick=()=>openAlbum();
$('practice-now').onclick=()=>startPractice();
$('sound').onclick=()=>{muted=!muted;$('sound').setAttribute('aria-pressed',String(!muted));$('sound').setAttribute('aria-label',muted?'효과음 켜기':'효과음 끄기');$('sound').style.background=muted?'':'#dfeccf';tone([523,659]);toast(muted?'효과음을 껐어.':'효과음을 켰어.');};
$('settings').onclick=()=>{openDialog('welcome');$('start').innerHTML='모험 이어가기 <span>→</span>';};$('start').onclick=()=>{started=true;closeDialog('welcome');tone([392,523,659]);};
$('reset-save').onclick=()=>{if(!confirm('다리, 배지, 친구 하트와 정원을 지우고 처음부터 놀까요?'))return;completed=0;garden=Array(60).fill(null);badges={};foundTreasures.clear();for(const key of friendKeys){bonds[key]=0;supplies[key]=0;}currentProblem=null;lastReward=null;selectedFriend='fox';practiceCycle=0;player={x:4,y:12,visualX:4,visualY:12};path=[];save();updateQuest();$('start').innerHTML='모험 시작하기 <span>→</span>';toast('새로운 모험이 준비됐어!');};
$('go-quest').onclick=()=>{if(completed>=3){startPractice();return;}const i=completed;walkTo(...missions[i].endpoint,()=>openPuzzle(i));};
$('free-build').onclick=openSandbox;$('close-sandbox').onclick=()=>closeDialog('sandbox');
function openSandbox(){renderGarden();openDialog('sandbox');}
function renderGarden(){const colors=['#dfa157','#68b8ae','#e3c45d','#8bb470'];$('garden').replaceChildren();garden.forEach((color,i)=>{const b=document.createElement('button');b.className=color===null?'':'filled';if(color!==null)b.style.backgroundColor=colors[color];b.setAttribute('aria-label',`${i+1}번 칸: ${color===null?'블록 놓기':'블록 돌려놓기'}`);b.onclick=()=>{garden[i]=garden[i]===null?selectedColor:null;save();renderGarden();tone([330+(garden.filter(v=>v!==null).length%10)*30]);};$('garden').append(b);});const n=garden.filter(v=>v!==null).length;$('sandbox-count').textContent=`놓은 블록 ${n}개`;$('garden-bundles').textContent=n?`10개 묶음 ${Math.floor(n/10)}개 + 낱개 ${n%10}개 = ${n}개`:'어떤 모양을 만들어 볼까?';}
for(const b of document.querySelectorAll('.color-choice'))b.onclick=()=>{selectedColor=Number(b.dataset.color);for(const c of document.querySelectorAll('.color-choice')){c.classList.toggle('selected',c===b);c.setAttribute('aria-pressed',String(c===b));}};
$('clear-garden').onclick=()=>{garden.fill(null);save();renderGarden();};
for(const id of dialogs)$(id).addEventListener('close',()=>{cleanupDrag();if(id==='puzzle')stopDemo();if('speechSynthesis'in window)speechSynthesis.cancel();});
function openAlbum(returnTo=null){
 albumReturn=returnTo;
 $('album-total').textContent=badgeTotal();$('album-unique').textContent=`${Object.keys(badges).length} / 45`;$('album-treasures').textContent=`${foundTreasures.size} / 4`;
 $('milestone-shelf').replaceChildren();for(const m of milestones){const item=document.createElement('div');item.className='milestone-item'+(Object.keys(badges).length>=m.at?' earned':'');item.textContent=`${m.icon} ${m.name} · ${m.at}종`;$('milestone-shelf').append(item);}
 $('badge-grid').replaceChildren();for(const q of questionBank){
  const earned=badges[q.key],tile=document.createElement('div');tile.className='badge-tile'+(earned?' earned':'');
  const icon=document.createElement('span');icon.className='mini-medal';icon.textContent=earned?friends[earned.friend].item:'?';
  const label=document.createElement('b');label.textContent=`${q.a} + ${q.b}`;
  const count=document.createElement('small');count.textContent=earned?`배지 ${earned.count}개`:'아직 빈자리';tile.append(icon,label,count);$('badge-grid').append(tile);
 }
 openDialog('album');
}
$('close-album').onclick=()=>{if(albumReturn==='reward')showReward();else closeDialog('album');};
$('album').addEventListener('cancel',e=>{if(albumReturn==='reward'){e.preventDefault();showReward();}});
$('album-play').onclick=()=>startPractice();
function openFriend(key){
 selectedFriend=key;const f=friends[key],unlocked=completed>=f.unlock;
 $('friend-avatar').textContent=f.emoji;$('friend-avatar').setAttribute('aria-label',f.name+' 쓰다듬기');$('friend-title').textContent=f.name;
 $('friend-dialog').dataset.character=key;$('friend-speech').textContent=unlocked?f.intro:'안녕, 선율아! 다리를 만들면 나랑 같이 놀 수 있어!';
 $('friend-play').textContent=unlocked?`${f.item} ${f.activity} 시작!`:'🌉 다리부터 만들러 가자!';
 $('pet-friend').disabled=!unlocked;$('dance-friend').disabled=!unlocked;$('friend-avatar').disabled=!unlocked;$('friend-visit').hidden=!unlocked;
 updateFriendStats();openDialog('friend-dialog');
}
function updateFriendStats(){
 const f=friends[selectedFriend];$('friend-hearts').textContent='♥'.repeat(bonds[selectedFriend])+'♡'.repeat(5-bonds[selectedFriend]);
 $('friend-hearts').setAttribute('aria-label',`친밀도 ${bonds[selectedFriend]} / 5`);
 $('friend-supplies').textContent=`${f.item} 함께 완성한 ${f.material} ${supplies[selectedFriend]}개 · ${f.decoration}를 꾸미는 중!`;
}
function petFriend(){
 const f=friends[selectedFriend];if(completed<f.unlock)return;
 bonds[selectedFriend]=Math.min(5,bonds[selectedFriend]+1);save();updateFriendStats();
 $('friend-speech').textContent=f.pet[(bonds[selectedFriend]-1)%f.pet.length];
 $('friend-avatar').animate([{transform:'scale(1)'},{transform:'scale(1.2) rotate(-8deg)'},{transform:'scale(1)'}],{duration:420});tone([659,784],.15);
}
$('friend-avatar').onclick=petFriend;$('pet-friend').onclick=petFriend;
$('dance-friend').onclick=()=>{
 const f=friends[selectedFriend];if(completed<f.unlock)return;
 $('friend-speech').textContent='왼쪽, 오른쪽, 깡충! 선율이도 같이 춤추자!';
 $('friend-avatar').animate([{transform:'translateY(0) rotate(-13deg)'},{transform:'translateY(-20px) rotate(13deg)'},{transform:'translateY(0) rotate(-13deg)'}],{duration:650,iterations:3});tone([523,659,784,659,523,784],.2);
};
$('close-friend').onclick=()=>closeDialog('friend-dialog');
$('friend-play').onclick=()=>{const f=friends[selectedFriend];if(completed<f.unlock){closeDialog('friend-dialog');const i=completed;walkTo(...missions[i].endpoint,()=>openPuzzle(i));}else startPractice(selectedFriend);};
$('friend-visit').onclick=()=>{const f=friends[selectedFriend];closeDialog('friend-dialog');walkTo(f.x,f.y,()=>openFriend(selectedFriend));};
for(const button of document.querySelectorAll('[data-friend]'))button.onclick=()=>openFriend(button.dataset.friend);
function collectTreasure(t){
 const already=foundTreasures.has(t.id);foundTreasures.add(t.id);save();
 $('discovery').querySelector('.discovery-icon').textContent=t.icon;$('discovery-title').textContent=already?'내가 찾은 보물이야!':'숨겨진 보물을 찾았어!';
 $('discovery-text').textContent=`${t.name} · 찾은 보물 ${foundTreasures.size} / 4개. 다른 섬의 상자도 찾아보자!`;openDialog('discovery');tone([659,880,1047],.2);
}
$('close-discovery').onclick=()=>closeDialog('discovery');
// A small connected tile world. Water and unbuilt crossings are never walkable.
const islands=[{x1:1,x2:7,y1:9,y2:15,name:'풀빛 시작섬',label:[3,16],color:0},{x1:11,x2:17,y1:9,y2:15,name:'여우의 숲',label:[14,16],color:1},{x1:11,x2:17,y1:0,y2:5,name:'반짝 광산',label:[12,-1],color:2},{x1:21,x2:27,y1:0,y2:5,name:'블록 정원',label:[24,-1],color:3}];
const tiles=[];const terrain=new Map();
for(let k=0;k<islands.length;k++){const is=islands[k];for(let x=is.x1;x<=is.x2;x++)for(let y=is.y1;y<=is.y2;y++){if((x===is.x1||x===is.x2)&&(y===is.y1||y===is.y2))continue;const t={x,y,island:k};tiles.push(t);terrain.set(`${x},${y}`,t);}}
missions.forEach((m,i)=>{const [x1,x2,y1,y2]=m.bridge;for(let x=x1;x<=x2;x++)for(let y=y1;y<=y2;y++){const t={x,y,bridge:i};tiles.push(t);terrain.set(`${x},${y}`,t);}});
tiles.sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x);
const props=[{x:2,y:10,type:'tree'},{x:3,y:9,type:'tree'},{x:7,y:13,type:'tree'},{x:2,y:14,type:'flower'},{x:5,y:10,type:'house'},{x:6,y:10,type:'sign'}, {x:11,y:10,type:'tree'},{x:12,y:9,type:'tree'},{x:16,y:10,type:'tree'},{x:17,y:13,type:'tree'},{x:12,y:14,type:'tree'},{x:14,y:13,type:'fox'}, {x:16,y:2,type:'mine'},{x:12,y:1,type:'crystal'},{x:15,y:4,type:'crystal'},{x:12,y:4,type:'bear'},{x:17,y:1,type:'rock'}, {x:23,y:1,type:'tree'},{x:26,y:1,type:'tree'},{x:25,y:4,type:'flower'},{x:24,y:2,type:'rabbit'},{x:22,y:4,type:'garden'},{x:26,y:3,type:'flower'}];
const obstacles=new Set(props.filter(p=>['tree','house','mine','rock','crystal'].includes(p.type)).map(p=>`${p.x},${p.y}`));

const zombies=[
 {id:'z1',x:5,y:14,minX:4,maxX:6,dir:1,stepTimer:0,a:7,name:'풀빛 좀비',item:'🍀',defeated:false},
 {id:'z2',x:15,y:11,minX:14,maxX:16,dir:1,stepTimer:0,a:6,name:'사과 숲 좀비',item:'🍎',defeated:false},
 {id:'z3',x:14,y:3,minX:13,maxX:15,dir:1,stepTimer:0,a:8,name:'반짝 광산 좀비',item:'💎',defeated:false}
];
const bombs=[
 {id:'b1',x:2,y:11,a:7,defused:false,exploded:false,resetTimer:0},
 {id:'b2',x:12,y:13,a:6,defused:false,exploded:false,resetTimer:0},
 {id:'b3',x:16,y:3,a:8,defused:false,exploded:false,resetTimer:0}
];

let currentRescue=null,activeZombie=null,activeBomb=null,bombTimerId=null,bombTimeLeft=10;

function renderChoices(containerId,answer,onPick){
 const container=$(containerId);container.replaceChildren();
 const set=new Set([answer]);
 while(set.size<4){set.add(Math.floor(Math.random()*9)+1);}
 const choices=Array.from(set).sort(()=>Math.random()-.5);
 for(const num of choices){
  const btn=document.createElement('button');btn.type='button';btn.className='choice-btn';btn.textContent=num;btn.setAttribute('aria-label',`숫자 ${num}`);btn.onclick=()=>onPick(num);container.append(btn);
 }
}

function fallIntoRiver(tx,ty){
 if(player.inWater||modalOpen())return;
 path=[];onArrival=null;player.x=tx;player.y=ty;player.visualX=tx;player.visualY=ty;player.inWater=true;player.splashUntil=performance.now()+2200;
 tone([380,310,240,330],.28);toast('첨벙! 🌊 강에 빠졌어! 튜브를 모으자!');
 setTimeout(()=>{if(player.inWater&&!modalOpen())openRescueDialog();},450);
}

function openRescueDialog(){
 const a=Math.floor(Math.random()*8)+1,answer=10-a;
 currentRescue={a,answer};$('rescue-a').textContent=a;$('rescue-feedback').textContent='';$('rescue-feedback').className='action-feedback';
 const frame=$('rescue-ten-frame');frame.replaceChildren();
 for(let i=0;i<10;i++){const cell=document.createElement('div');if(i<a){cell.className='mini-cell filled';cell.textContent='🛟';}else{cell.className='mini-cell target-hint';cell.textContent='?';}frame.append(cell);}
 renderChoices('rescue-choices',answer,checkRescueAnswer);openDialog('rescue-dialog');
}

function checkRescueAnswer(num){
 if(!currentRescue)return;
 if(num===currentRescue.answer){
  tone([523,659,784,1047],.3);$('rescue-feedback').textContent='✨ 성공! 10개 튜브 징검다리로 육지에 도착했어!';$('rescue-feedback').className='action-feedback';
  setTimeout(()=>{closeDialog('rescue-dialog');player.inWater=false;player.x=player.lastLandX;player.y=player.lastLandY;player.visualX=player.lastLandX;player.visualY=player.lastLandY;toast('선율이가 무사히 육지로 올라왔어! 🛟');},600);
 }else{
  tone([260,200],.2);$('rescue-feedback').textContent='어푸어푸! 💦 다시 한 번 세어 볼까? 빈칸을 세어 봐!';$('rescue-feedback').className='action-feedback error';
 }
}

function encounterZombie(z){
 if(modalOpen())return;
 if(z.defeated){toast(`좀비 친구: 헤헤! 배가 불러서 신나! ${z.item} 🌸`);return;}
 activeZombie=z;tone([220,180,240],.25);openZombieDialog(z);
}

function openZombieDialog(z){
 const a=z.a||(Math.floor(Math.random()*7)+2),answer=10-a;
 activeZombie={...z,a,answer,ref:z};$('zombie-a').textContent=a;$('zombie-feedback').textContent='';$('zombie-feedback').className='action-feedback';
 const frame=$('zombie-ten-frame');frame.replaceChildren();
 for(let i=0;i<10;i++){const cell=document.createElement('div');if(i<a){cell.className='mini-cell filled';cell.textContent='🌿';}else{cell.className='mini-cell target-hint';cell.textContent='?';}frame.append(cell);}
 renderChoices('zombie-choices',answer,checkZombieAnswer);openDialog('zombie-dialog');
}

function checkZombieAnswer(num){
 if(!activeZombie)return;
 if(num===activeZombie.answer){
  tone([440,554,659,880],.35);$('zombie-feedback').textContent='🎉 얍! 마법 햇빛 블록으로 좀비가 정화되었어!';$('zombie-feedback').className='action-feedback';activeZombie.ref.defeated=true;
  setTimeout(()=>{closeDialog('zombie-dialog');toast(`좀비가 배가 불러서 방긋 웃었어! ${activeZombie.ref.item} 선물 +1 💖`);},700);
 }else{
  tone([180,150],.2);$('zombie-feedback').textContent='으어어~ 10개가 안 맞아! 다시 세어 줘~';$('zombie-feedback').className='action-feedback error';
  player.x=player.lastLandX;player.y=player.lastLandY;player.visualX=player.lastLandX;player.visualY=player.lastLandY;
 }
}

function triggerBomb(b){
 if(modalOpen())return;
 if(b.defused){toast('이미 해체된 안전한 축하 폭죽이야! ✨');return;}
 if(b.exploded){toast('펑 터졌던 폭탄이야! 잠시 후에 다시 생길 거야. 💨');return;}
 activeBomb=b;tone([700,850],.1);openBombDialog(b);
}

function openBombDialog(b){
 const a=b.a||(Math.floor(Math.random()*8)+1),answer=10-a;
 activeBomb={...b,a,answer,ref:b};$('bomb-a').textContent=a;$('bomb-feedback').textContent='';$('bomb-feedback').className='action-feedback';
 const frame=$('bomb-ten-frame');frame.replaceChildren();
 for(let i=0;i<10;i++){const cell=document.createElement('div');if(i<a){cell.className='mini-cell filled';cell.textContent='⚡';}else{cell.className='mini-cell target-hint';cell.textContent='?';}frame.append(cell);}
 renderChoices('bomb-choices',answer,checkBombAnswer);
 clearInterval(bombTimerId);bombTimeLeft=10;$('bomb-timer-progress').style.width='100%';
 bombTimerId=setInterval(()=>{
  bombTimeLeft-=.1;const pct=Math.max(0,(bombTimeLeft/10)*100);$('bomb-timer-progress').style.width=pct+'%';
  if(bombTimeLeft<=0){clearInterval(bombTimerId);explodeBomb();}
 },100);
 openDialog('bomb-dialog');
}

function checkBombAnswer(num){
 if(!activeBomb)return;
 if(num===activeBomb.answer){
  clearInterval(bombTimerId);tone([523,659,784,1047],.4);$('bomb-feedback').textContent='치이익~ 휴! 폭탄 해체 성공! 💥 축하 폭죽으로 변신!';$('bomb-feedback').className='action-feedback';activeBomb.ref.defused=true;confettiUntil=performance.now()+3500;
  setTimeout(()=>{closeDialog('bomb-dialog');toast('💥 팡팡팡! 시한폭탄을 축하 불꽃놀이로 바꿨어!');},800);
 }else{
  tone([200,140],.2);$('bomb-feedback').textContent='암호가 틀렸어! 도화선이 더 빨리 타오르고 있어!';$('bomb-feedback').className='action-feedback error';bombTimeLeft=Math.max(1,bombTimeLeft-2.5);
 }
}

function explodeBomb(){
 tone([140,100,70,50],.5);$('bomb-feedback').textContent='콰쾅~! 💥 폭탄이 펑 터졌어!';$('bomb-feedback').className='action-feedback error';
 if(activeBomb?.ref){activeBomb.ref.exploded=true;activeBomb.ref.resetTimer=performance.now()+15000;}
 player.shockUntil=performance.now()+2200;player.x=player.lastLandX;player.y=player.lastLandY;player.visualX=player.lastLandX;player.visualY=player.lastLandY;
 setTimeout(()=>{closeDialog('bomb-dialog');toast('아이쿠 깜짝이야! 💥 엉덩방아를 찧었지만 괜찮아!');},1000);
}

$('close-rescue').onclick=()=>{closeDialog('rescue-dialog');player.inWater=false;player.x=player.lastLandX;player.y=player.lastLandY;player.visualX=player.lastLandX;player.visualY=player.lastLandY;};
$('close-zombie').onclick=()=>closeDialog('zombie-dialog');
$('close-bomb').onclick=()=>{clearInterval(bombTimerId);closeDialog('bomb-dialog');};

function passable(x,y){const t=terrain.get(`${x},${y}`);return !!t&&(t.bridge===undefined||t.bridge<completed)&&!obstacles.has(`${x},${y}`);}
function findPath(tx,ty){if(!passable(tx,ty))return null;const queue=[[player.x,player.y]],seen=new Map([[`${player.x},${player.y}`,null]]);let head=0;while(head<queue.length){const [x,y]=queue[head++];if(x===tx&&y===ty){const route=[];let cur=[x,y];while(cur){route.push(cur);cur=seen.get(cur.join(','));}return route.reverse().slice(1);}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,key=`${a},${b}`;if(!seen.has(key)&&passable(a,b)){seen.set(key,[x,y]);queue.push([a,b]);}}}return null;}
function walkTo(x,y,cb=null){const route=findPath(x,y);if(route===null){toast('아직 갈 수 없는 곳이야. 다리를 이어 보자!');return;}path=route;onArrival=cb;if(!path.length){const done=onArrival;onArrival=null;done?.();}else if(cb)toast('좋아! 블록을 놓을 곳으로 걸어가자.');}
function manualMove(dx,dy){
 if(!started||modalOpen()||player.inWater)return;
 path=[];onArrival=null;const nx=player.x+dx,ny=player.y+dy;
 if(passable(nx,ny)){path=[[nx,ny]];}
 else{
  for(let i=0;i<missions.length;i++){const m=missions[i];if(i===completed&&Math.abs(player.x-m.endpoint[0])+Math.abs(player.y-m.endpoint[1])<=1){openPuzzle(i);return;}}
  const t=terrain.get(`${nx},${ny}`);
  if(!obstacles.has(`${nx},${ny}`)&&(!t||(t.bridge!==undefined&&t.bridge>=completed))){fallIntoRiver(nx,ny);}
 }
}
const directions={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};
window.addEventListener('keydown',e=>{if(modalOpen()||player.inWater)return;if(directions[e.key]){e.preventDefault();manualMove(...directions[e.key]);}if(e.key==='Enter'||e.key===' '){if(e.target!==$('world'))return;e.preventDefault();missions.forEach((m,i)=>{if(i<=completed&&Math.abs(player.x-m.endpoint[0])+Math.abs(player.y-m.endpoint[1])<=2)openPuzzle(i);});}});
for(const b of document.querySelectorAll('[data-dir]'))b.onclick=()=>manualMove(...({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.dir]));
const canvas=$('world'),ctx=canvas.getContext('2d');let width=0,height=0,unit=25,originX=0,originY=0,dpr=1,confettiUntil=0,beaconUntil=0,markers=[],worldTargets=[];
function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
new ResizeObserver(resize).observe(canvas);resize();
function projection(x,y,z=0){return{x:originX+(x-y)*unit,y:originY+(x+y)*unit*.5-z};}
function polygon(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}}
function box(x,y,sx,sy,h,top,left,right,z=0){const a=projection(x,y,z),b=projection(x+sx,y,z),c=projection(x+sx,y+sy,z),d=projection(x,y+sy,z);polygon([[d.x,d.y-h],[c.x,c.y-h],[c.x,c.y],[d.x,d.y]],left);polygon([[b.x,b.y-h],[c.x,c.y-h],[c.x,c.y],[b.x,b.y]],right);polygon([[a.x,a.y-h],[b.x,b.y-h],[c.x,c.y-h],[d.x,d.y-h]],top);}
function hash(x,y){return(Math.sin(x*127.1+y*311.7)*43758.5453)%1;}
function drawTile(t){const s=unit/24;if(t.bridge!==undefined){if(t.bridge>=completed){const p=projection(t.x+.5,t.y+.5);ctx.fillStyle='#8ab9b73b';ctx.beginPath();ctx.ellipse(p.x,p.y+10*s,unit*.65,unit*.23,0,0,Math.PI*2);ctx.fill();return;}const m=missions[t.bridge],[x1,x2,y1,y2]=m.bridge;if(t.x===x1&&t.y===y1){const vertical=t.bridge===1;for(let row=0;row<2;row++)for(let col=0;col<5;col++){const index=row*5+col,dx=vertical?row:col*.6,dy=vertical?col*.6:row;box(x1+dx+.025,y1+dy+.025,(vertical?1:.6)-.05,(vertical?.6:1)-.05,8*s,index<m.a?'#d8b578':'#79b5a6',index<m.a?'#ac8a59':'#579784',index<m.a?'#bc9963':'#68a393');}}return;}
 const palette=[['#afc98b','#a6c280','#b7ce92'],['#9dbc7d','#aac785','#a1bf7c'],['#adc2a0','#b7c9aa','#a3b899'],['#b7cc8b','#bed496','#acc57e']][t.island];const color=palette[Math.abs(Math.floor(hash(t.x,t.y)*19))%3];box(t.x,t.y,1,1,25*s,'#af9a75','#b19a76','#9b8868',-18*s);box(t.x,t.y,1,1,9*s,color,'#849f62','#91ac6c');const p=projection(t.x+.5,t.y+.5,9*s);if(Math.abs(hash(t.x+4,t.y))>.7){ctx.strokeStyle='#7f9e5550';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-2*s,p.y);ctx.lineTo(p.x,p.y-3*s);ctx.moveTo(p.x+3*s,p.y);ctx.lineTo(p.x+4*s,p.y-2*s);ctx.stroke();}}
function drawProp(p,time){const s=unit/24,z=9*s;
 if(p.type==='tree'){box(p.x+.36,p.y+.36,.27,.27,33*s,'#a98b59','#8e7449','#79643e',z);box(p.x-.06,p.y-.06,1.12,1.12,29*s,'#779c66','#547b52','#648b59',z+26*s);box(p.x+.1,p.y+.1,.8,.8,15*s,'#89ac71','#668a59','#769962',z+55*s);}
 else if(p.type==='house'){box(p.x-.2,p.y-.15,1.35,1.3,35*s,'#f5e6bd','#e9d9ac','#d9c99e',z);box(p.x-.35,p.y-.3,1.65,1.6,12*s,'#c78460','#a7684b','#b37450',z+35*s);box(p.x,p.y,.95,.95,9*s,'#d4936c','#b67852','#c2855a',z+47*s);const q=projection(p.x+.5,p.y+1.16,z);ctx.fillStyle='#6a7f68';ctx.fillRect(q.x-5*s,q.y-19*s,10*s,18*s);}
 else if(p.type==='mine'){box(p.x-.3,p.y-.3,1.6,1.5,38*s,'#a7b4ab','#8b9f96','#768e88',z);box(p.x,p.y,.9,.9,19*s,'#bec8ba','#9dac9f','#8e9e94',z+38*s);const q=projection(p.x+.6,p.y+1.2,z);ctx.fillStyle='#435c55';ctx.fillRect(q.x-12*s,q.y-26*s,24*s,26*s);ctx.strokeStyle='#bba171';ctx.lineWidth=5*s;ctx.strokeRect(q.x-13*s,q.y-29*s,26*s,29*s);}
 else if(p.type==='crystal'){box(p.x+.2,p.y+.2,.35,.35,22*s,'#b1e0da','#76b7b5','#88c9bf',z);box(p.x+.55,p.y+.45,.25,.25,13*s,'#d1e8da','#87beb0','#9cccc0',z);}
 else if(p.type==='rock'){box(p.x+.15,p.y+.15,.65,.7,18*s,'#b4bdb2','#8e9f96','#9aaba0',z);}
 else if(p.type==='flower'){for(let i=0;i<4;i++){const q=projection(p.x+.15+i*.2,p.y+.2+(i%2)*.4,z);ctx.fillStyle='#83a066';ctx.fillRect(q.x,q.y-7*s,2*s,7*s);ctx.fillStyle=i%2?'#f4dc9b':'#e8b494';ctx.fillRect(q.x-3*s,q.y-11*s,7*s,6*s);}}
 else if(p.type==='sign'){box(p.x+.4,p.y+.4,.15,.15,21*s,'#d5bd8b','#ac9368','#9b845d',z);box(p.x+.15,p.y+.4,.7,.15,11*s,'#e4c993','#c7aa73','#bca171',z+15*s);}
 else if(p.type==='garden'){for(let i=0;i<3;i++)for(let j=0;j<2;j++)box(p.x+i*.3,p.y+j*.3,.27,.27,7*s,['#e0b56c','#82b9a7','#eccb7c'][(i+j)%3],'#ae9765','#b7a273',z);}
 else{const q=projection(p.x+.5,p.y+.5,12*s+Math.sin(time/600)*2*s);ctx.font=`${36*s}px sans-serif`;ctx.textAlign='center';ctx.fillText({fox:'🦊',bear:'🐻',rabbit:'🐰'}[p.type],q.x,q.y);if(friends[p.type])worldTargets.push({kind:'friend',key:p.type,x:q.x,y:q.y-15*s});}
}
function drawPlayer(time){
 const x=player.visualX,y=player.visualY,s=unit/24,z=9*s;
 if(player.inWater){
  const p=projection(x+.5,y+.5,0),bob=Math.sin(time/180)*2*s;
  ctx.strokeStyle='#5eaec755';ctx.lineWidth=2.5*s;ctx.beginPath();ctx.ellipse(p.x,p.y+bob,17*s,7*s,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#ff7043';ctx.beginPath();ctx.ellipse(p.x,p.y+bob-2*s,13*s,6*s,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fffdf0';ctx.beginPath();ctx.ellipse(p.x,p.y+bob-2*s,7*s,3*s,0,0,Math.PI*2);ctx.fill();
  box(x+.25,y+.28,.5,.45,12*s,'#f3d6a9','#e4bb8a','#ecc898',z+bob);
  box(x+.2,y+.22,.6,.55,6*s,'#68574b','#53463d','#605043',z+12*s+bob);
  const n=projection(x+.5,y+.5,z+38*s+bob);
  ctx.font=`600 ${10*s}px sans-serif`;ctx.textAlign='center';ctx.fillStyle='#1d6c82';ctx.fillText('선율 🛟',n.x,n.y);
  return;
 }
 const step=path.length?Math.sin(time/65)*2*s:0;
 const q=projection(x+.5,y+.5);ctx.fillStyle='#48644928';ctx.beginPath();ctx.ellipse(q.x,q.y-5*s,13*s,5*s,0,0,Math.PI*2);ctx.fill();
 box(x+.28,y+.31,.18,.2,9*s,'#576c72','#425766','#4a5e69',z+step);
 box(x+.54,y+.47,.18,.2,9*s,'#576c72','#425766','#4a5e69',z-step);
 box(x+.2,y+.25,.55,.48,15*s,'#e9bb70','#d09c50','#dfab5d',z+8*s);
 box(x+.19,y+.21,.58,.55,16*s,'#f3d6a9','#e4bb8a','#ecc898',z+23*s);
 box(x+.15,y+.16,.65,.63,6*s,'#68574b','#53463d','#605043',z+37*s);
 const face=projection(x+.72,y+.76,z+30*s);ctx.fillStyle='#574d43';ctx.fillRect(face.x-5*s,face.y-3*s,2*s,3*s);ctx.fillRect(face.x+1*s,face.y-1*s,2*s,3*s);
 const n=projection(x+.5,y+.5,z+56*s);ctx.font=`600 ${10*s}px sans-serif`;ctx.textAlign='center';
 if(time<player.shockUntil){ctx.fillStyle='#c84021';ctx.fillText('선율 (앗! 💥)',n.x,n.y);}
 else{ctx.fillStyle='#3c6250';ctx.fillText('선율',n.x,n.y);}
}
function roundRect(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function drawMarker(i,time){const m=missions[i],p=projection(m.endpoint[0]+.5,m.endpoint[1]+.5,unit*2.25),bob=Math.sin(time/650+i)*3,done=i<completed;const x=p.x,y=p.y+bob;ctx.fillStyle='#4764491a';ctx.beginPath();ctx.ellipse(x,y+unit*1.75,15,5,0,0,Math.PI*2);ctx.fill();roundRect(x-17,y-18,34,34,11,done?'#f6f9ee':'#355f46');ctx.fillStyle=done?'#77985b':'#f5e7b5';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText(done?'✓':'+',x,y+5);polygon([[x-5,y+15],[x+5,y+15],[x,y+21]],done?'#f6f9ee':'#355f46');markers.push({x,y,index:i});if(i===completed){const label='다리 만들기';ctx.font='600 10px sans-serif';roundRect(x-43,y-44,86,20,10,'#fafbf6ed');ctx.fillStyle='#4e6e51';ctx.fillText(label,x,y-30);}}
function drawWorld(time){
 const small=width<900;unit=small?(width<580?23:27):Math.min(31,(width-360)/43,(height-220)/19);unit=Math.max(17,unit);
 if(small){originX=width*.55-(player.visualX-player.visualY)*unit;originY=height*.43-(player.visualX+player.visualY)*unit*.5;}else{const left=325,right=width-30;originX=(left+right)/2-6.5*unit;originY=(height-32*unit*.5)/2+32;}
 ctx.clearRect(0,0,width,height);const gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,'#e7f0e8');gradient.addColorStop(.5,'#dcecea');gradient.addColorStop(1,'#cce3df');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='#ffffff42';ctx.lineWidth=1.2;for(let i=0;i<95;i++){const x=((i*137.8+Math.sin(time/4500+i)*7)%width),y=(i*83.7)%height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+10+(i%3)*6,y);ctx.stroke();}
 for(const is of islands){const p=projection((is.x1+is.x2+1)/2,(is.y1+is.y2+1)/2);ctx.fillStyle='#6ea09b16';ctx.beginPath();ctx.ellipse(p.x+10,p.y+36,unit*5.8,unit*2.8,0,0,Math.PI*2);ctx.fill();}
 for(const t of tiles)drawTile(t);
 worldTargets=[];
 const actors=props.map(p=>({depth:p.x+p.y+.5,p}));actors.push({depth:player.visualX+player.visualY+.6,player:true});actors.sort((a,b)=>a.depth-b.depth);for(const a of actors)a.player?drawPlayer(time):drawProp(a.p,time);
 for(const target of worldTargets){const f=friends[target.key];ctx.font='600 10px sans-serif';roundRect(target.x-33,target.y-44,66,21,10,'#fff9e9ee');ctx.textAlign='center';ctx.fillStyle='#667c51';ctx.fillText(completed>=f.unlock?'👆 같이 놀자':'다리 너머 친구',target.x,target.y-29);}
 for(const t of treasures){const p=projection(t.x+.5,t.y+.5,unit*.5),found=foundTreasures.has(t.id);ctx.font=`${unit*1.05}px sans-serif`;ctx.textAlign='center';ctx.fillText(found?t.icon:'🎁',p.x,p.y);worldTargets.push({kind:'treasure',key:t.id,x:p.x,y:p.y-unit*.45});}
 for(const z of zombies){
  const s=unit/24,p=projection(z.x+.5,z.y+.5,8*s);
  ctx.font=`${28*s}px sans-serif`;ctx.textAlign='center';
  ctx.fillText(z.defeated?'🌸':'🧟',p.x,p.y+Math.sin(time/350+Number(z.id.slice(1)))*3*s);
  ctx.font='600 10px sans-serif';roundRect(p.x-32,p.y-36,64,18,9,z.defeated?'#edf7e9ee':'#f8f2eeee');
  ctx.fillStyle=z.defeated?'#4b843a':'#7b4d37';ctx.fillText(z.defeated?'친구 좀비':'🧟 10개 줘~',p.x,p.y-23);
  worldTargets.push({kind:'zombie',key:z.id,x:p.x,y:p.y-15*s});
 }
 for(const b of bombs){
  const s=unit/24,p=projection(b.x+.5,b.y+.5,8*s);
  ctx.font=`${24*s}px sans-serif`;ctx.textAlign='center';
  if(b.defused){ctx.fillText('✨',p.x,p.y);}
  else if(b.exploded){ctx.fillText('💨',p.x,p.y);}
  else{ctx.fillText('💣',p.x,p.y+Math.sin(time/200)*2*s);}
  ctx.font='600 10px sans-serif';roundRect(p.x-28,p.y-34,56,18,9,b.defused?'#fbfbe7ee':'#faebe8ee');
  ctx.fillStyle=b.defused?'#78842e':'#b23e24';ctx.fillText(b.defused?'✨ 불꽃놀이':b.exploded?'💨 펑!':'💣 10 암호',p.x,p.y-21);
  worldTargets.push({kind:'bomb',key:b.id,x:p.x,y:p.y-15*s});
 }
 for(const key of friendKeys){const f=friends[key],n=Math.min(5,supplies[key]);for(let i=0;i<n;i++){const coords=key==='fox'?[14+i*.45,11]:key==='bear'?[14+i*.35,3]:[23+i*.45,4];const p=projection(...coords,unit*.5);ctx.font=`${unit*.65}px sans-serif`;ctx.textAlign='center';ctx.fillText(key==='fox'?'🍎':key==='bear'?'💎':'🌷',p.x,p.y);}}
 if(time<beaconUntil){const p=projection(player.visualX+.5,player.visualY+.5,unit*2.65);ctx.fillStyle='#f2c15b';ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.fillText('↓',p.x,p.y+Math.sin(time/150)*5);}
 markers=[];missions.forEach((_,i)=>{if(i<=completed)drawMarker(i,time);});
 for(let i=0;i<islands.length;i++){const is=islands[i],p=projection(...is.label,-15);ctx.font='500 11px sans-serif';ctx.textAlign='center';const label=(i>completed?'◌ ':'')+is.name,w=ctx.measureText(label).width+26;roundRect(p.x-w/2,p.y-13,w,25,12,'#f7fbf3b8');ctx.fillStyle=i>completed?'#91a592':'#668367';ctx.fillText(label,p.x,p.y+3);}
 if(completed>=3){const p=projection(23,4,unit*2);roundRect(p.x-40,p.y-15,80,28,10,'#f7fbf3ee');ctx.font='600 10px sans-serif';ctx.fillStyle='#56714b';ctx.textAlign='center';ctx.fillText('▦ 블록 놀이터',p.x,p.y+3);markers.push({x:p.x,y:p.y,index:3});}
 if(time<confettiUntil){const colors=['#e5b466','#87b8a1','#f6d883','#b6cc88'];for(let i=0;i<45;i++){const x=(i*97.13)%width,y=((time*.07+i*57)%(height+30))-20;ctx.save();ctx.translate(x,y);ctx.rotate(time*.002+i);ctx.fillStyle=colors[i%4];ctx.fillRect(-3,-3,6,9);ctx.restore();}}
}
function tick(time){
 const dt=Math.min((time-lastTime)/1000,.04)||0;lastTime=time;
 if(passable(player.x,player.y)){player.lastLandX=player.x;player.lastLandY=player.y;}
 for(const z of zombies){
  if(!z.defeated&&started&&!modalOpen()){
   z.stepTimer+=dt;
   if(z.stepTimer>=1.8){z.stepTimer=0;z.x+=z.dir;if(z.x>=z.maxX){z.x=z.maxX;z.dir=-1;}else if(z.x<=z.minX){z.x=z.minX;z.dir=1;}}
  }
 }
 for(const b of bombs){if(b.exploded&&b.resetTimer&&performance.now()>=b.resetTimer){b.exploded=false;b.defused=false;b.resetTimer=0;}}
 if(!modalOpen()&&started){
  walking-=dt;
  if(path.length&&walking<=0){
   const next=path.shift();
   if(passable(...next)){player.x=next[0];player.y=next[1];}
   walking=.12;
  }
  player.visualX+=(player.x-player.visualX)*Math.min(1,dt*17);
  player.visualY+=(player.y-player.visualY)*Math.min(1,dt*17);
  if(!path.length&&Math.abs(player.x-player.visualX)+Math.abs(player.y-player.visualY)<.08&&onArrival){const callback=onArrival;onArrival=null;callback();}
  const t=terrain.get(`${player.x},${player.y}`);if(t?.island!==undefined)$('location-label').textContent=islands[t.island].name;
  if(!player.inWater){
   for(const z of zombies){if(!z.defeated&&Math.hypot(player.x-z.x,player.y-z.y)<.85){encounterZombie(z);break;}}
   for(const b of bombs){if(!b.defused&&!b.exploded&&Math.hypot(player.x-b.x,player.y-b.y)<.85){triggerBomb(b);break;}}
  }
 }
 drawWorld(time);requestAnimationFrame(tick);
}
canvas.addEventListener('click',e=>{
 if(modalOpen()||!started||player.inWater)return;
 const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 const target=worldTargets.find(t=>Math.hypot(x-t.x,y-t.y)<27);
 if(target){
  if(target.kind==='friend'){openFriend(target.key);}
  else if(target.kind==='zombie'){const z=zombies.find(z=>z.id===target.key);if(z)encounterZombie(z);}
  else if(target.kind==='bomb'){const b=bombs.find(b=>b.id===target.key);if(b)triggerBomb(b);}
  else{const t=treasures.find(t=>t.id===target.key);if(t.island>completed)toast('다리를 만들면 저 보물을 찾을 수 있어!');else walkTo(t.x,t.y,()=>collectTreasure(t));}
  return;
 }
 const hit=markers.find(m=>Math.hypot(x-m.x,y-m.y)<29);
 if(hit){if(hit.index===3){walkTo(23,4,openSandbox);}else{const i=hit.index;walkTo(...missions[i].endpoint,()=>openPuzzle(i));}return;}
 const a=(x-originX)/unit,b=(y-originY+9*(unit/24))/(unit*.5),tx=Math.floor((a+b)/2),ty=Math.floor((b-a)/2);
 if(passable(tx,ty)){walkTo(tx,ty);}
 else{
  const prop=props.find(p=>p.x===tx&&p.y===ty);
  if(prop){toast('옆의 풀밭을 눌러 걸어가자!');}
  else{
   const t=terrain.get(`${tx},${ty}`);
   if(!obstacles.has(`${tx},${ty}`)&&(!t||(t.bridge!==undefined&&t.bridge>=completed))){
    if(Math.hypot(tx-player.x,ty-player.y)<=4.5){fallIntoRiver(tx,ty);}
    else{toast('첨벙! 물소리가 들려. 강에 가까이 가면 빠질 수 있어!');}
   }
  }
 }
});
$('home-camera').onclick=()=>{beaconUntil=performance.now()+4000;toast('노란 옷을 입은 친구가 선율이야!');$('world').focus({preventScroll:true});};
$('welcome').addEventListener('cancel',()=>{started=true;});
updateQuest();openDialog('welcome');if(completed>0)$('start').innerHTML='모험 이어가기 <span>→</span>';requestAnimationFrame(tick);
// Expose a read-only snapshot for browser smoke tests and debugging.
window.blockIsland={snapshot:()=>({completed,activeMission,moved,left:problem().a+moved,right:problem().b-moved,total:problem().a+problem().b,kind:problem().kind,friendKey:problem().friendKey,questionKey:`${problem().a}+${problem().b}`,player:{x:player.x,y:player.y},answer:$('answer-input').value,gardenCount:garden.filter(v=>v!==null).length,badgeTotal:badgeTotal(),uniqueBadges:Object.keys(badges).length,badges:JSON.parse(JSON.stringify(badges)),supplies:{...supplies},bonds:{...bonds},treasures:[...foundTreasures]}),findPath:(x,y)=>findPath(x,y),questions:()=>questionBank.map(q=>({...q})),targets:()=>worldTargets.map(t=>({...t}))};
// Prevent gesture zoom, multi-touch pinch zoom, double-click zoom, and context menus on iPad
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', e => e.preventDefault(), { passive: false });
document.addEventListener('touchstart', e => {
 if (e.touches && e.touches.length > 1) e.preventDefault();
}, { passive: false });
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', e => e.preventDefault(), { passive: false });

})();
