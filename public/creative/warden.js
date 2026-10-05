'use strict';
window.createWardenGame=function({state,save,onFinish,onWallet}){
 const $=id=>document.getElementById(id);
 const kinds=['pig','skeleton','witch'],names={pig:'돼지',skeleton:'스켈레톤',witch:'보랏빛 마녀'};
 const puzzles=[
  {counts:[2,3,4],outside:[1,1,2],questions:[['pig','all'],['skeleton','all'],['witch','all'],['all','all']]},
  {counts:[3,3,2],outside:[1,2,1],questions:[['pig','inside'],['skeleton','outside'],['witch','all'],['all','all']]},
  {counts:[4,2,4],outside:[2,1,2],questions:[['pig','all'],['skeleton','all'],['witch','all'],['all','all']]},
  {counts:[2,3,5],outside:[1,1,3],questions:[['pig','all'],['skeleton','all'],['witch','all'],['skeleton','more','pig'],['witch','more','skeleton']]},
  {counts:[1,3,6],outside:[0,2,3],questions:[['pig','all'],['skeleton','all'],['witch','all'],['witch','more','pig'],['skeleton','less','witch']]} 
 ];
 function creatures(q){const list=[],remaining=q.counts.slice(),seen=[0,0,0];while(remaining.some(n=>n>0))for(let k=0;k<3;k++)if(remaining[k]>0){list.push({kind:kinds[k],outside:seen[k]<q.outside[k]});seen[k]++;remaining[k]--;}return list;}
 function answer(q,[kind,region,other]){if(region==='more'||region==='less'){const difference=q.counts[kinds.indexOf(kind)]-q.counts[kinds.indexOf(other)];return region==='more'?difference:-difference;}return creatures(q).filter(a=>(kind==='all'||a.kind===kind)&&(region==='all'||(region==='outside'?a.outside:!a.outside))).length;}
 function paint(canvas,kind){canvas.width=100;canvas.height=100;MonsterArt.portrait(canvas,kind);}
 if(state.contentVersion!==2){state.answers=[null,null,null,null];state.counted=[];state.contentVersion=2;}

 state.completed=Array.isArray(state.completed)?[...new Set(state.completed.filter(i=>Number.isInteger(i)&&i>=0&&i<puzzles.length))]:[];
 state.index=Number.isInteger(state.index)&&state.index>=0&&state.index<puzzles.length?state.index:0;
 state.answers=Array.isArray(state.answers)?state.answers.slice(0,puzzles[state.index].questions.length):[null,null,null,null];
 let drag=null;
 paint($('warden-avatar'),'warden');
 function speak(message){$('warden-speech').textContent=message;$('warden-feedback').textContent=message;$('warden-avatar').classList.remove('reacting');void $('warden-avatar').offsetWidth;$('warden-avatar').classList.add('reacting');}
 $('warden-companion').onclick=()=>speak(state.gateOpen&&state.index>=3?'쿵쿵! 먼저 종류별로 세고, 더 많은 쪽에서 더 적은 쪽의 수를 빼 보자.':state.gateOpen?'쿵쿵! 같은 종류끼리 세어 보자. 울타리 안과 밖도 잘 살펴봐!':'친구들이 소풍을 가고 싶대. 울타리 문부터 열어 줄래?');
 function render(animate=false){
  const q=puzzles[state.index],field=$('animal-field');field.replaceChildren();
  const list=creatures(q);let inside=0,outside=0;
  for(let i=0;i<list.length;i++){
   const a=list[i],out=state.gateOpen&&a.outside,j=out?outside++:inside++;
   const spots=[[220,125],[300,115],[380,125],[175,200],[255,200],[335,200],[415,200],[220,270],[300,280],[380,270]];
   const x=out?650+(j%2)*100:spots[j][0],y=out?110+Math.floor(j/2)*100:spots[j][1];
   const dog=document.createElement('button');dog.className='pixel-dog';dog.dataset.kind=a.kind;dog.dataset.region=out?'outside':'inside';dog.dataset.creature=i;
   dog.style.left=x/8+'%';dog.style.top=y/4+'%';dog.setAttribute('aria-label',names[a.kind]+' '+(i+1)+(out?' · 울타리 밖':' · 울타리 안'));
   const sprite=document.createElement('canvas');paint(sprite,a.kind);const mark=document.createElement('span');
   if(state.counted?.includes(i)){dog.classList.add('counted');mark.textContent='✓';}
   dog.append(sprite,mark);
   dog.onclick=()=>{state.counted=Array.isArray(state.counted)?state.counted:[];if(state.counted.includes(i))state.counted=state.counted.filter(n=>n!==i);else state.counted.push(i);dog.classList.toggle('counted');mark.textContent=dog.classList.contains('counted')?'✓':'';save();};
   field.append(dog);
   if(animate&&out&&!matchMedia('(prefers-reduced-motion: reduce)').matches)dog.animate([{left:(175+i%3*115)/8+'%',top:(110+Math.floor(i/3)*90)/4+'%'},{left:dog.style.left,top:dog.style.top}],{duration:900,easing:'ease-in-out'});
  }
  $('animal-gate').disabled=!!state.gateOpen;$('animal-gate').textContent=state.gateOpen?'문이 열렸어요':'울타리 문 열기 →';
  $('warden-mission').textContent='워든과 함께 세어 보기 · '+(state.index+1)+' / '+puzzles.length;
  $('sentences').replaceChildren();q.questions.forEach(([kind,region,other],i)=>{
   const row=document.createElement('div');row.className='sentence';
   if(kind!=='all'){const icon=document.createElement('canvas');icon.className='sentence-sprite';paint(icon,kind);row.append(icon);}
   const lead=document.createElement('span');lead.textContent=kind==='all'?'친구들은 모두':(region==='inside'?'울타리 안의 ':region==='outside'?'울타리 밖의 ':'')+names[kind]+(kind==='skeleton'?'은':'는');
   if(other)lead.textContent+=' '+names[other]+'보다';
   const slot=document.createElement('div');slot.className='number-slot';slot.dataset.answer=i;slot.setAttribute('aria-label',lead.textContent+' 수');slot.textContent=Number.isInteger(state.answers[i])?state.answers[i]:'?';
   const tail=document.createElement('span');tail.textContent=region==='more'?'마리 더 많아요.':region==='less'?'마리 더 적어요.':'마리예요.';row.append(lead,slot,tail);$('sentences').append(row);
  });
  speak(state.gateOpen&&state.index>=3?'쿵쿵! 두 종류를 한 마리씩 짝지어 봐. 남는 친구가 몇 마리인지 생각해 보자.':state.gateOpen?'쿵쿵! 돼지, 스켈레톤, 보랏빛 마녀을 나누어 세어 보자. 센 친구를 누르면 표시할 수 있어.':'나랑 함께 친구들을 세어 볼래? 울타리 문을 열어 줘!');
 }

 function closeDrag(){if(!drag)return;const d=drag;drag=null;d.ghost.remove();if(d.source.hasPointerCapture(d.id))d.source.releasePointerCapture(d.id);}
 function startDrag(e){if(!state.gateOpen||state.pendingReward||e.button!==0||drag)return;e.preventDefault();const ghost=document.createElement('div');ghost.className='drag-ghost number-ghost';ghost.textContent=e.currentTarget.dataset.number;document.body.append(ghost);drag={id:e.pointerId,value:Number(e.currentTarget.dataset.number),source:e.currentTarget,ghost,startX:e.clientX,startY:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId);move(e);}
 function move(e){if(!drag||drag.id!==e.pointerId)return;drag.moved ||= Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6;drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';}
 function drop(e){if(!drag||drag.id!==e.pointerId)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-answer]'),d=drag;closeDrag();if(target&&d.moved){state.answers[Number(target.dataset.answer)]=d.value;save();render();}}
 document.addEventListener('pointermove',move);document.addEventListener('pointerup',drop);document.addEventListener('pointercancel',closeDrag);window.addEventListener('blur',closeDrag);
 for(let n=0;n<=10;n++){const el=document.createElement('button');el.dataset.number=n;el.textContent=n;el.setAttribute('aria-label',n+' 숫자 끌기');el.addEventListener('pointerdown',startDrag);$('number-bank').append(el);}
 $('animal-gate').onclick=()=>{if(state.pendingReward)return;state.gateOpen=true;save();render(true);};
 function showReward(){const dialog=$('warden-reward');$('warden-prize-title').textContent=['동물 공원의 관찰자','워든의 숫자 탐정','동물 친구 수호자','크기 비교 탐정','수 비교 마스터'][state.index];if(!dialog.open)dialog.showModal();}
 $('check-sentences').onclick=()=>{
  if(!state.gateOpen){speak('먼저 울타리 문을 열어 줘.');return;}
  if(state.pendingReward)return;const q=puzzles[state.index],expected=q.questions.map(question=>answer(q,question)),wrong=expected.findIndex((n,i)=>state.answers[i]!==n);
  if(wrong>=0){speak(Number.isInteger(state.answers[wrong])?(q.questions[wrong][2]?'쿵쿵! 몇 마리 더 많거나 적은지 물었어. 두 종류를 한 마리씩 짝지으면 몇 마리가 남을까?':'쿵쿵! 종류와 위치를 다시 살펴봐. 돼지, 스켈레톤, 보랏빛 마녀을 따로 세어 보자.'):'모든 문장의 빈칸에 숫자를 모두 끌어 놓아 줘.');$('sentences').children[wrong].classList.add('needs-thought');return;}
  if(!state.completed.includes(state.index)){state.completed.push(state.index);onWallet(15,150);}
  state.pendingReward=true;save();speak('쿵쿵! 해냈어! 친구들을 종류별로 잘 세었구나. 내가 보물을 준비했어!');showReward();
 };
 $('warden-reward').addEventListener('cancel',e=>e.preventDefault());
 $('warden-next').onclick=()=>{if(!state.pendingReward)return;$('warden-reward').close();state.pendingReward=false;state.answers=[];state.gateOpen=false;state.counted=[];const next=puzzles.findIndex((_,i)=>!state.completed.includes(i));if(next<0){save();onFinish();return;}state.index=next;save();render();};
 function start(){
  $('warden-game').hidden=false;
  if(state.pendingReward){render();showReward();return;}
  const next=puzzles.findIndex((_,i)=>!state.completed.includes(i));if(next<0){onFinish();return;}
  if(state.index!==next){state.answers=[];state.counted=[];state.gateOpen=false;}state.index=next;render();save();
 }
 return {start,snapshot:()=>JSON.parse(JSON.stringify(state)),cancelDrag:closeDrag};
};
