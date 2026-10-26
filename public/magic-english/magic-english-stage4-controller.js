import {ensureStage4,advanceStage4,stage4Goal} from './magic-english-stage4.js';
import {STAGE4_PRACTICE,STAGE4_TRAINS} from './magic-english-stage4-learning.js';
import {createStage4Daily} from './magic-english-stage4-daily.js';
export const STAGE4_DIALOGUES={
 door:[['에이미','낱말을 이어 정중하게 문을 열어 달라고 부탁해 봐.','How can we open the door?','s4_open'],['링고','잘했어. 이번에는 들어가도 되는지 여쭤보자.','May we come in?','s4_enter'],['에이미','부탁을 들어주면 감사 인사도 잊지 말자.','The door is open!','s4_thanks']],
 drink:[['에이미','음료대에 시원한 물이 있어. 음료를 부탁해 보자.','What would you like to drink?','s4_drink'],['에이미','좋아. 이번에는 물을 원한다고 말해 봐.','Would you like water?','s4_water'],['에이미','자, 여기 있어!','Here you are.','s4_thanks']],
 dish:[['활빈','이 접시에 따뜻한 음식을 받고 싶어!','May we have a dish?','s4_dish'],['에이미','친구와 함께 나누면 더 맛있지.','Shall we share the dish?','s4_share'],['활빈','친절하게 도와주셔서 기뻐!','Here is your dish.','s4_thanks']],
 delicious:[['활빈','음식이 정말 맛있어 보여! 문장으로 말해 보자.','How does the food taste?','s4_delicious'],['에이미','냄새도 아주 맛있지?','How does it smell?','s4_smell'],['활빈','이제 점심 먹을 준비가 됐니?','Are you ready for lunch?','s4_ready']],
 meal:[['미즈 데이지','따뜻한 음식을 한 입 먹어 보렴.','How is your lunch?','s4_meal_delicious'],['에이미','맛있는 음식을 주신 데이지에게 고마운 마음을 전해 보자.','What can we say to Ms. Daisy?','s4_meal_thanks'],['미즈 데이지','천천히, 정중하게 말해 줘서 고맙구나.','You are very welcome!','s4_meal_finish']],
};
const npc=(speaker,text,voiceClip,page)=>({type:'npc',speaker,text,voiceClip,...(page?{image:`assets/stage4/page${String(page).padStart(2,'0')}.jpg`}:{})});
export function createStage4Controller({getState,say,save,update,go,queueReward}){
 const state=()=>getState(),s=()=>ensureStage4(state()),daily=createStage4Daily({getState,say,save,update});
 function reward(type){const id=`stage4:${type}:v2`;if(!state().rewardReceipts[id]){state().rewardReceipts[id]={id};queueReward({id,type,stage:4});}}
 function conversation(id,done){
  const rows=STAGE4_DIALOGUES[id],completed=s().conversations[id]||0,repeat=completed===rows.length,pages=[];
  for(const [index,[speaker,text,english,key]]of rows.entries()){if(!repeat&&index<completed)continue;const p=STAGE4_PRACTICE[key];pages.push(npc(speaker,text,english,id==='door'?5:id==='meal'?14:4),{type:'speak',speaker:'홍길동 · 내 대답',targetKey:key,targetPhrase:p.text,guideClip:p.text,meaningKo:p.korean,noFollowup:true,conversationTurn:index+1,conversationTotal:rows.length,onPass:()=>{if(!repeat&&(s().conversations[id]||0)===index){s().conversations[id]=index+1;if(index===rows.length-1)done?.();save();update();}}});}
  pages.push(npc('에이미','단어를 이어 마음을 전했어!','Well done!'));say('D · '+(id==='meal'?'함께하는 식사':'정중한 문장 연습'),pages);
 }
 function incident(){
  if(!Object.values(s().words).every(Boolean)){daily.open('s4_daisy',stage4Goal(state()));return;}
  if(s().incidentSeen){if(Object.values(s().trains).every(Boolean))boss();else daily.open('s4_daisy',stage4Goal(state()));return;}
  advanceStage4(state(),'incident');save();update();
  say('어순의 함정 · 낱말을 이어야 해!',[npc('미즈 데이지','무엇을 드릴까요? 배고픈 길동과 활빈이 Drink! Water! 하고 단어만 외쳤어.','What would you like?',6),npc('미스터 미스스펠','이번에는 낱말의 순서를 통째로 뒤섞어 주마! May I have water가 Water have I may로 흩어져 버렸어.','I will scramble your sentences!',7),npc('미즈 데이지','원하는 것이 무엇인지 잘 모르겠구나. 길동은 엉뚱한 빈 접시를 받고 시무룩해졌어.','Can you say a full sentence?',8),npc('링고','낱말을 차례로 이어 마음을 전해 보자. 문장 기차에서 낱말의 순서를 연습하자!','Put the words in order.',9)]);
 }
 function train(key){
  const data=STAGE4_TRAINS[key];if(!data)return;
  if(!s().incidentSeen){say('링고',stage4Goal(state()));return;}
  if(s().trains[key]){say('링고','이 문장 기차는 완성했어. 다른 기차나 배식대의 봉인을 확인해 보자.');return;}
  const selected=s().trainSelections[key]??=[];
  if(selected.length===data.tokens.length){
   if(selected.some((index,position)=>index!==position)){
    say('링고 · 기차의 순서 확인','낱말의 순서가 조금 달라. 누가, 무엇을 원하는지 천천히 다시 이어 보자.',null,[['다시 조합하기',()=>{s().trainSelections[key]=[];save();train(key);}]]);return;
   }
   const p=STAGE4_PRACTICE[data.target];say('링고 · 문장 기차 완성',[npc('링고','기차가 이어졌어! 이번에는 문장 전체를 소리 내어 말해 보자.','Now say the whole sentence.',10),{type:'speak',speaker:'홍길동 · 완성한 문장',targetKey:data.target,targetPhrase:p.text,guideClip:p.text,meaningKo:p.korean,noFollowup:true,onPass:()=>{advanceStage4(state(),'train',key);save();update();}}]);return;
  }
  // Token IDs, rather than token text, make repeated words and undo unambiguous.
  const order=[...data.tokens.keys()].reverse();
  const choices=order.filter(i=>!selected.includes(i)).map(i=>[data.tokens[i],()=>{s().trainSelections[key].push(i);save();train(key);}]);
  if(selected.length)choices.push(['↶ 한 낱말 되돌리기',()=>{s().trainSelections[key].pop();save();train(key);}]);
  choices.push(['처음부터 조합',()=>{s().trainSelections[key]=[];save();train(key);}]);
  say('링고 · 문장 기차',`${data.korean}\n선택한 기차: ${selected.map(i=>data.tokens[i]).join(' → ')||'빈 기차'}\n낱말을 올바른 순서로 선택해 주세요.`,null,choices);
 }
 function boss(){
  if(s().boss.completed){daily.open('s4_daisy');return;}
  if(!Object.values(s().trains).every(Boolean)){say('에이미',stage4Goal(state()));return;}
  const keys=['s4_boss_water','s4_boss_order','s4_boss_thanks'],pages=[];
  for(let round=s().boss.round;round<3;round++){
   const p=STAGE4_PRACTICE[keys[round]],hp={name:'미스터 미스스펠 · 어순의 봉인',hp:3-round,maxHp:3};
   pages.push(npc(round===0?'미스터 미스스펠':round===1?'미즈 데이지':'미즈 데이지',round===0?'이번에도 네 주문을 뒤섞어 주마! 물을 원한다고 정중하게 말해 보자.':round===1?'첫 봉인이 깨졌어. 이번에는 음료를 받을 수 있는지 정중하게 물어보자.':'마지막 봉인! Here you are. 음식을 건네받고 감사 인사를 해 보자.',round===0?'Your words cannot stay in order!':round===1?'What would you like to drink?':'Here you are.',11),{type:'speak',speaker:'홍길동 · 정중한 문장의 힘',targetKey:keys[round],targetPhrase:p.text,guideClip:p.text,meaningKo:p.korean,noFollowup:true,bossBattle:hp,onPass:()=>{if(advanceStage4(state(),'round',round)){if(s().boss.completed)reward('fragment');save();update();}}});
  }
  pages.push(npc('미스터 미스스펠','낱말이 이어져 문장이 되다니! 미스스펠이 빛에 밀려 보라색 연기 속으로 물러났어.','Your sentences are too strong!',13),{type:'badge_reveal',speaker:'링고',letter:'D',badgeTitle:'정중한 문장의 힘 · 황금 D 배지',text:'미스스펠을 이기고 황금 D 배지를 얻었어! 준비된 식탁으로 돌아가 맛있게 먹고 감사 인사를 하자.',voiceClip:'You got the letter D piece!',rewardBanner:'황금 D 배지 · 돌 1개와 하트 0.5개'});say('미스스펠 대결 · 황금 D 배지',pages);
 }
 function enter(){if(!state().stage3?.completed){say('에이미','먼저 C의 교실에서 코코를 구하고 자기소개를 마쳐 보자.');return false;}ensureStage4(state());go('CafeteriaEntrance',10,11);return true;}
 function act(target){const id=target.id;
  if(id==='s4_door'){if(s().doorOpened)go('CafeteriaHall',10,11);else conversation('door',()=>advanceStage4(state(),'word','door'));return;}
  if(id==='s4_back_school'){go('SchoolHall',10,3);return;}
  if(id==='s4_counter'){go('ServingCounter',10,11);return;}
  if(id==='s4_workshop'){go('SentenceCorner',10,11);return;}
  if(id==='s4_workshop_back'||id==='s4_counter_back'){go('CafeteriaHall',id==='s4_workshop_back'?3:10,id==='s4_workshop_back'?6:3);return;}
  if(id==='s4_exit'){
   if(!s().completed){go('CafeteriaEntrance',10,4);return;}
   s().eHookSeen=true;save();say('다음은 E · Egg, Eat, Enjoy!',[npc('미즈 데이지','후식으로 삶은 달걀을 가져왔단다.','Here are some eggs for dessert.',14),npc('활빈','어라? 이 동그란 것은 Egg?','Egg!',14),npc('링고','다음 좌표는 E! Egg, Eat, Enjoy. 다음 모험이 준비될 때까지 식당 친구들과 대화해 보자.','E. Egg. Eat. Enjoy.',15)]);return;
  }
  if(id.startsWith('s4_word_')){const key=id.slice(8);if(!s().doorOpened){say('에이미',stage4Goal(state()));return;}conversation(key,()=>advanceStage4(state(),'word',key));return;}
  if(id.startsWith('s4_train_')){train(id.slice(9));return;}
  if(id==='s4_daisy'){if(!s().boss.completed)incident();else daily.open(id);return;}
  if(id==='s4_boss'||id==='s4_misspell'){if(!s().incidentSeen)incident();else boss();return;}
  if(id==='s4_meal'){if(!s().boss.completed){say('활빈',stage4Goal(state()));return;}conversation('meal',()=>{advanceStage4(state(),'complete');reward('clear');});return;}
  daily.open(id);
 }
 return {act,enter};
}
