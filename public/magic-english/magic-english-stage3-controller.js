import {createStage3Daily} from './magic-english-stage3-daily.js';
import {ensureStage3,advanceStage3,stage3Goal} from './magic-english-stage3.js';
import {STAGE3_PRACTICE} from './magic-english-stage3-learning.js';
const npc=(speaker,text,english,page)=>({type:'npc',speaker,text,voiceClip:english,...(page?{image:`assets/stage3/page${String(page).padStart(2,'0')}.jpg`}:{})});
export const STAGE3_DIALOGUES={
 class:[['에이미','여기가 우리 반이야. 교실을 가리키며 말해 볼까?','This is my class.','s3_class'],['에이미','파란 사물함 옆에 우리 교실이 보여?','Can you see our class?','s3_see_class'],['에이미','좋아! 함께 들어갈 준비가 됐니?','Are you ready to go?','s3_ready']],
 teacher:[['선생님','좋은 아침! 우리 반에 온 걸 환영해.','Good morning! Welcome to our class.','s3_morning'],['선생님','들어오렴. Come in은 들어오라는 말이야.','Come in.','s3_thanks']],
 cat:[['활빈','저기 학급 고양이가 있어! 무엇이 보이니?','What can you see?','s3_cat'],['에이미','이 고양이 이름은 코코야.','The cat is Coco.','s3_cat_name'],['에이미','작은 코코를 함께 소개해 볼까?','Is the cat small?','s3_cat_small']],
 come:[['링고','C의 이름은 씨. Class, Cat, Come의 첫소리는 /k/야. 활빈을 불러 보자.','C. Class. Cat. Come.','s3_come'],['활빈','왔어! 이번에는 함께 가자고 말해 줘.','I am here! Shall we go together?','s3_with_me']],
 tommy:[['토미','아까 웃어서 미안해. 사실 나도 발표가 무서워. 함께 가 줄래?','I am sorry. I am scared too.','s3_with_me'],['토미','혼자 하기 무서웠어. 함께 연습할까?','Can we try together?','s3_together'],['토미','같이 한다면 할 수 있을 것 같아!','Can we do it?','s3_can_do']],
 introduction:[['선생님','이제 친구들에게 네 이름을 말해 주겠니?','Hello! What is your name?','s3_introduction'],['토미','멋졌어, 길동! 진짜 친구가 되어 기뻐.','Well done, Gildong!','s3_meet']],
};
export const STAGE3_NEIGHBOURS={
   s3_yard_keeper:['학교 관리인','어서 와! 현관 위 학교 시계와 SCHOOL 간판을 찾아봐. 중앙 보도를 따라가면 에이미의 교실로 갈 수 있어.','Welcome to our school. Please follow the path.'],
   s3_bus_driver:['스쿨버스 기사','노란 스쿨버스에서 잘 내렸구나! 횡단보도를 건너 학교 현관으로 가렴.','Walk safely to the school entrance.'],
   s3_yard_student:['등교하는 친구','안녕! 에이미는 학교 현관 앞에서 기다려. 나도 오늘 Class를 배우러 가!','Good morning! Let us go to class.'],
   s3_librarian:['도서 선생님','복도 중앙 받침대의 CLASS 안내판을 조사해 봐. 실제 교실 문은 오른쪽 벽에 있어.','Our class is beside the blue lockers.'],
   s3_hall_teacher:['담임 선생님','복도에서는 천천히 걸어도 괜찮아. 교실 문은 손잡이와 유리창이 있는 오른쪽 문이란다.','The classroom door is on your right.'],
   s3_hall_nurse:['보건 선생님','처음 온 학교라 긴장되니? 천천히 숨을 쉬고 친구들과 말해 보면 괜찮아.','Take your time. It is okay to feel shy.'],
   s3_class_lily:['릴리','창가에서 고양이 그림책을 보고 있었어! 여기 고양이도 Class의 친구야.','Look at the cat in my book!'],
   s3_class_art:['미술 선생님','이젤의 CAT 그림은 코코를 보고 그렸어. 그림과 실제 코코를 비교해 봐!','We painted a picture of Coco.'],
   s3_class_helper:['보조 선생님','책상 위 공책과 연필은 함께 쓰면 돼. 발표할 때는 칠판 앞 발자국 자리로 와 줘.','Your notebook and pencil are on the desk.'],
   s3_room_amy:['에이미','여기는 수업 준비실이야. 책과 미술 도구가 있고, 코코가 쉬는 바구니도 있어.','This is our supply room. Coco has a basket here.'],
   s3_room_monitor:['도우미 친구','코코가 무사해서 정말 다행이야! 바구니 옆에는 물과 고양이 장난감도 준비했어.','Coco is safe. We brought some water.'],
   s3_room_caretaker:['준비실 선생님','책장과 미술 도구는 함께 쓰는 물건이야. 이제 친구들과 교실에서 다시 이야기해 보렴.','Please keep our books and art supplies tidy.'],
  };

export function createStage3Controller({getState,say,save,update,go,queueReward}){
 const state=()=>getState(),s=()=>ensureStage3(state());
 const daily=createStage3Daily({getState,say,save,update});
 function reward(type){const id=`stage3:${type}:v2`;if(!state().rewardReceipts[id]){state().rewardReceipts[id]={id};queueReward({id,type,stage:3});}}
 function conversation(id,done){
  const rows=STAGE3_DIALOGUES[id],completed=s().conversations[id]||0,repeat=completed===rows.length,pages=[];
  rows.forEach(([speaker,text,english,key],index)=>{if(!repeat&&index<completed)return;const p=STAGE3_PRACTICE[key];pages.push(npc(speaker,text,english,id==='class'?2:id==='cat'?5:id==='tommy'?9:id==='introduction'?13:6),{type:'speak',speaker:'홍길동 · 내 대답',targetKey:key,targetPhrase:p.text,guideClip:p.text,meaningKo:p.korean,noFollowup:true,onPass:()=>{
   if(!repeat&&index===(s().conversations[id]||0)){s().conversations[id]=index+1;if(index===rows.length-1)done?.();save();update();}
  }});});
  pages.push(npc(id==='teacher'?'선생님':'에이미','잘했어! 네 마음이 전해졌어.','Well done!'));say(rows[0][0],pages);
 }
 function rescue(){advanceStage3(state(),'rescue');reward('fragment');save();update();}
 function boss(){
  if(s().rescue.completed){go('CocoRoom',3,7);return;}
  if(!Object.values(s().restored).every(Boolean)){say('에이미',stage3Goal(state()));return;}
  if(s().boss.completed){rescue();return;}
  const keys=['s3_class','s3_cat','s3_call_coco'],pages=[];
  for(let round=s().boss.round;round<3;round++){
   const p=STAGE3_PRACTICE[keys[round]],hp={name:'사일런트 섀도 · 목소리 봉인',hp:3-round,maxHp:3};
   pages.push(npc(round===0?'사일런트 섀도':'에이미',round===0?'쉬이잇… 이 교실의 목소리는 내 거야!':round===1?'준비실 창에 코코가 보여! 배운 문장으로 말해 보자.':'토미와 친구들이 함께 응원해. 이제 코코를 불러 줘!',round===0?'Your class will be silent!':round===1?'Can you see the cat?':'Call Coco! We are with you!',round===2?12:11),{type:'speak',speaker:'홍길동 · 목소리의 힘',targetKey:keys[round],targetPhrase:p.text,guideClip:p.text,meaningKo:p.korean,noFollowup:true,bossBattle:hp,onPass:()=>{if(advanceStage3(state(),'round',round)){if(s().boss.completed)rescue();save();update();}}});
  }
  pages.push(npc('활빈','그림자가 흩어지고 문이 열렸어! 코코가 달려 나와 네 품에 안겨.','Coco is safe! You did it!',12),{type:'badge_reveal',speaker:'링고',letter:'C',badgeTitle:'목소리의 용기 · 황금 C 조각',text:'C 조각을 얻었어! 선생님에게 돌아가 친구들 앞에서 첫 자기소개를 해 보자.',voiceClip:'You got the letter C piece!',rewardBanner:'C 조각 · 돌 1개와 하트 0.5개'});
  say('사일런트 섀도 · 코코를 구해 줘!',pages);
 }
 function act(target){const id=target.id;
  if(STAGE3_NEIGHBOURS[id]){daily.open(id,{text:STAGE3_NEIGHBOURS[id][1],voiceClip:STAGE3_NEIGHBOURS[id][2]});return;}
  if(id==='s3_hwalbin'){daily.open(id);return;}
  if(id==='s3_hall'){go('SchoolHall',10,11);return;}
  if(id==='s3_yard'){go('SchoolYard',10,6);return;}
  if(id==='s3_bus'){go('NextStop',10,3);return;}
  if(id==='s3_back'){go('SchoolHall',15,6);return;}
  if(id==='s3_room_back'){go('Classroom',16,6);return;}
  if(id==='s3_classroom'){if(!s().words.class){say('에이미',stage3Goal(state()));return;}go('Classroom',10,11);return;}
  if(id==='s3_class'){conversation('class',()=>advanceStage3(state(),'word','class'));return;}
  if(id==='s3_amy'){if(!s().words.class)conversation('class',()=>advanceStage3(state(),'word','class'));else daily.open(id);return;}
  if(id==='s3_teacher'){
   if(s().rescue.completed&&!s().introductionCompleted){conversation('introduction',()=>{advanceStage3(state(),'complete');reward('clear');});return;}
   if(s().conversations.teacher!==2){conversation('teacher');return;}
   daily.open(id,stage3Goal(state()));return;
  }
  if(id==='s3_coco_bed'){say('코코의 바구니','코코가 숨어 있던 작은 바구니야. 이제 코코는 친구들과 교실에 있어.');return;}
  if(id==='s3_cat'||id==='s3_coco'||id==='s3_coco_rescued'){
   if(s().rescue.completed){daily.open('s3_coco_rescued','코코가 네 손에 얼굴을 비비며 야옹 하고 반갑게 인사해. 에이미와 함께 코코 이야기를 해 보자.');return;}
   if(s().conversations.teacher!==2){say('에이미','먼저 선생님께 인사를 드리자!');return;}
   if(s().incidentSeen){say('에이미','코코가 준비실 안에 있어. 함께 C 소리를 되찾자!');return;}
   conversation('cat',()=>advanceStage3(state(),'word','cat'));return;
  }
  if(id==='s3_incident'){
   if(s().incidentSeen){say('링고',stage3Goal(state()));return;}
   if(!s().words.cat){say('에이미',stage3Goal(state()));return;}
   // Scripted hesitation belongs to the story, never a forced failed player recording.
   advanceStage3(state(),'incident');save();update();
   say('사라진 C 소리',[npc('홍길동','모두가 나를 보니… 영어가 입에서 나오지 않는구나.','I feel shy.',3),npc('토미','토미가 작게 웃자 길동이 고개를 숙였어. 교실 구석에서 그림자가 일어나!', 'Oh...',3),npc('사일런트 섀도','침묵은 내 힘이야! CLASS → LASS, CAT → AT, COME → OME! 코코가 준비실로 피신하고 문이 닫혔어.','I will take your C sounds!',4),npc('에이미','틀려도 괜찮아. 작게라도 소리 내면 시작이야. 링고와 연습하자!','It is okay to make mistakes. We can try together.',7)]);return;
  }
  if(id==='s3_ringo'){
   if(!s().incidentSeen||s().words.come){daily.open(id,stage3Goal(state()));return;}
   conversation('come',()=>advanceStage3(state(),'word','come'));return;
  }
  if(id==='s3_tommy'){
   if(!s().words.come||s().tommyReconciled){daily.open(id,s().incidentSeen&&!s().tommyReconciled?'나도 말하기가 무서워… 먼저 조금 이야기해 볼래?':undefined);return;}
   conversation('tommy',()=>advanceStage3(state(),'tommy'));return;
  }
  if(id.startsWith('s3_restore_')){
   const word=id.slice(11);
   if(!s().tommyReconciled){say('에이미',stage3Goal(state()));return;}
   if(s().restored[word]){say('링고',`${word.toUpperCase()}의 C 소리가 돌아왔어!`);return;}
   const key='s3_'+word,p=STAGE3_PRACTICE[key];
   say('링고',`${word.toUpperCase().slice(1)} 앞에서 빠진 글자를 골라 줘.`,null,[['C',()=>say('C 소리 되찾기',[npc('링고',`맞아! ${word.toUpperCase()}의 첫소리를 문장으로 말해 보자.`,'Now say the sentence.',11),{type:'speak',targetKey:key,targetPhrase:p.text,guideClip:p.text,meaningKo:p.korean,noFollowup:true,onPass:()=>{advanceStage3(state(),'restore',word);save();update();}}])],['B',()=>say('링고','단어의 첫소리는 /k/야. C를 다시 찾아보자.')]]);return;
  }
  if(id==='s3_boss'||id==='s3_shadow'){boss();return;}
  if(id==='s3_lunch'){
   if(!s().completed){say('에이미',stage3Goal(state()));return;}
   s().dHookSeen=true;save();say('다음은 D · 식당의 문과 D의 주문!',[npc('활빈','킁킁… 식당에서 달콤한 냄새가 나! Delicious?','Delicious?',14),npc('링고','다음 좌표 D 감지! Door, Drink, Delicious.','D. Door. Drink. Delicious.',14),npc('미스터 미스스펠','섀도까지 당하다니! 다음엔 식당의 글자를 뒤바꿔 주마!','Next time, I will change the words in the cafeteria!',15),npc('에이미','C 모험 완료! D 모험이 준비될 때까지 친구들과 다시 이야기해 보자.','You finished our C adventure!',16)]);return;
  }
  if(id.endsWith('_student')){daily.open(id);return;}
 }
 return {act,conversation,enter:()=>go('SchoolYard',10,11)};
}
