'use strict';
(() => {
 const KEY='seonyul-sunshine-campaign-v1',STAGES=6,TEST_MS=600000,QUESTION_COUNT=15,PASS_COUNT=11;
 const levels=[
  {id:1,name:'10 만들기',description:'한 자리 덧셈 · 블록으로 10을 만들어요',monsters:['zombie','creeper','slime','fox','endermite'],sum:[6,18]},
  {id:2,name:'큰 수와 작은 묶음',description:'합 20~40 덧셈 · 2~3단의 작은 묶음',monsters:['skeleton','spider','witch','enderman','magma','ghast','shulker','pig','chicken','rabbit'],sum:[20,40]},
  {id:3,name:'강적과 숫자 마법',description:'합 30~50 덧셈 · 2~5단',monsters:['wither','elderguardian','evoker','ravager','piglinbrute','enderdragon','warden','enderknight','pig','chicken','rabbit'],sum:[30,50]}
 ];
 const clone=x=>JSON.parse(JSON.stringify(x));
 const qkey=q=>`${q.a}${q.operator}${q.b}`;
 function pool(level,operator='+'){
  const def=levels[level-1],out=[];
  if(operator==='×'){
   const maxA=level<3?(level===1?2:3):5,maxB=level===1?3:level===2?5:9;
   for(let a=2;a<=maxA;a++)for(let b=1;b<=maxB;b++)out.push({a,b,operator});
  }else{
   const min=level===1?1:10,max=level===1?9:40;
   for(let a=min;a<=max;a++)for(let b=min;b<=max;b++)if(a+b>=def.sum[0]&&a+b<=def.sum[1])out.push({a,b,operator:'+'});
  }
  return out;
 }
 function shuffle(items,random){const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
 const solution=q=>q.operator==='×'?q.a*q.b:q.a+q.b;
 function create(storage,random=Math.random,now=Date.now){
  let saved;try{saved=JSON.parse(storage.getItem(KEY));}catch{}
  const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
  const state={level:integer(saved?.level,1,levels.length)?saved.level:1,stage:integer(saved?.stage,1,STAGES)?saved.stage:1,cycle:integer(saved?.cycle,1,1000000)?saved.cycle:1,stageCompleted:!!saved?.stageCompleted,awaitingTest:false,exam:null,history:Array.isArray(saved?.history)?saved.history.filter(r=>r&&integer(r.level,1,3)&&integer(r.correct,0,15)&&integer(r.answered,0,15)&&['complete','time'].includes(r.reason)).slice(-30):[],
   rewards:{score:Number.isSafeInteger(saved?.rewards?.score)&&saved.rewards.score>=0?saved.rewards.score:0,collected:Number.isSafeInteger(saved?.rewards?.collected)&&saved.rewards.collected>=0?saved.rewards.collected:0,weapon:['sword','bow','shield'].includes(saved?.rewards?.weapon)?saved.rewards.weapon:null}};
  state.awaitingTest=state.stage===STAGES&&!!saved?.awaitingTest;
  if(state.awaitingTest)state.stageCompleted=false;
  const exam=saved?.exam;
  if(state.awaitingTest&&exam?.level===state.level&&Array.isArray(exam.questions)&&exam.questions.length===QUESTION_COUNT&&Array.isArray(exam.answers)&&exam.answers.length<=QUESTION_COUNT&&Number.isFinite(exam.deadline)&&exam.deadline>0){
   const allowed=new Set([...pool(state.level),...(state.level>1?pool(state.level,'×'):[])].map(qkey));
   if(exam.questions.every(q=>q&&allowed.has(qkey(q)))&&new Set(exam.questions.map(qkey)).size===QUESTION_COUNT&&exam.answers.every(v=>integer(v,0,99))){
    state.exam={level:state.level,questions:exam.questions.map(q=>({a:q.a,b:q.b,operator:q.operator})),answers:exam.answers.slice(),deadline:exam.deadline,finished:!!exam.finished,reason:exam.reason==='time'?'time':'complete'};
   }
  }
  let lastQuestion='';
  function save(){try{storage.setItem(KEY,JSON.stringify(state));}catch{}}
  function finishExam(reason){
   const e=state.exam;if(!e||e.finished)return;
   e.finished=true;e.reason=reason;
   state.history.push({level:state.level,correct:e.answers.filter((v,i)=>v===solution(e.questions[i])).length,answered:e.answers.length,reason});
   state.history=state.history.slice(-30);save();
  }
  function checkExpiry(){const e=state.exam;if(e&&!e.finished){if(now()>=e.deadline)finishExam('time');else if(e.answers.length===QUESTION_COUNT)finishExam('complete');}return e;}
  function result(){const e=checkExpiry();if(!e)return null;const correct=e.answers.filter((v,i)=>v===solution(e.questions[i])).length;return {finished:e.finished,correct,total:QUESTION_COUNT,answered:e.answers.length,percentage:correct/QUESTION_COUNT*100,passed:e.finished&&e.reason==='complete'&&e.answers.length===QUESTION_COUNT&&correct>=PASS_COUNT,reason:e.reason||null,previousCorrect:state.history.filter(r=>r.level===state.level).at(e.finished?-2:-1)?.correct??null,remainingMs:e.finished?0:Math.max(0,e.deadline-now())};}
  function snapshot(){checkExpiry();return {...clone(state),stagesPerLevel:STAGES,totalLevels:levels.length,definition:clone(levels[state.level-1]),test:result()};}
  function question(math=''){
   const options=pool(state.level,math==='multiply'?'×':'+').filter(q=>qkey(q)!==lastQuestion),q=options[Math.floor(random()*options.length)];lastQuestion=qkey(q);return [q.a,q.b];
  }
  function finishStage(){if(state.awaitingTest||state.stageCompleted)return false;state.stageCompleted=true;save();return true;}
  function continueAfterStage(){
   if(!state.stageCompleted)return false;
   state.stageCompleted=false;
   if(state.stage===STAGES)state.awaitingTest=true;else state.stage++;
   save();return state.awaitingTest?'test':'stage';
  }
  function startTest(retry=false){
   if(!state.awaitingTest)return false;
   if(state.exam&&(!state.exam.finished||!retry))return snapshot();
   if(state.exam&&result().passed)return snapshot();
   let questions;
   if(state.level===1){const p=pool(1);questions=[...shuffle(p.filter(q=>q.a+q.b>=10),random).slice(0,10),...shuffle(p.filter(q=>q.a+q.b<10),random).slice(0,5)];}
   else questions=[...shuffle(pool(state.level),random).slice(0,10),...shuffle(pool(state.level,'×'),random).slice(0,5)];
   state.exam={level:state.level,questions:shuffle(questions,random),answers:[],deadline:now()+TEST_MS,finished:false};save();return snapshot();
  }
  function submitTest(value){
   const e=checkExpiry();if(!e||e.finished||!integer(value,0,99))return false;
   e.answers.push(value);if(e.answers.length===QUESTION_COUNT)finishExam('complete');save();return true;
  }
  function advanceLevel(){
   if(!result()?.passed)return false;
   if(state.level===levels.length){state.level=1;state.cycle++;}else state.level++;
   state.stage=1;state.stageCompleted=false;state.awaitingTest=false;state.exam=null;save();return true;
  }
  function updateRewards(rewards){const next={...state.rewards,...rewards};if(JSON.stringify(next)!==JSON.stringify(state.rewards)){state.rewards=next;save();}}
  function restart(){if(state.awaitingTest)return false;state.level=1;state.stage=1;state.stageCompleted=false;state.exam=null;save();return true;}
  save();return {snapshot,question,finishStage,continueAfterStage,startTest,submitTest,advanceLevel,updateRewards,restart};
 }
 const api={create,levels,pool,solution,STAGES,TEST_MS,QUESTION_COUNT,PASS_COUNT,KEY};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.SunshineCampaign=api;
})();
