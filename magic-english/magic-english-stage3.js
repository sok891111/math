import {stage3Floor as floor} from './magic-english-stage3-layout.js';
import {renderSchoolScene,drawSchoolAnimal} from './magic-english-stage3-renderer.js';
import {STAGE3_PRACTICE} from './magic-english-stage3-learning.js';
export const STAGE3_MAP_IDS=['SchoolYard','SchoolHall','Classroom','CocoRoom'];
export const isStage3Map=id=>STAGE3_MAP_IDS.includes(id);
export const STAGE3_WORDS={
 class:{word:'Class',korean:'반 · 교실',phonetic:'/klæs/',sentence:STAGE3_PRACTICE.s3_class.text},
 cat:{word:'Cat',korean:'고양이',phonetic:'/kæt/',sentence:STAGE3_PRACTICE.s3_cat.text},
 come:{word:'Come',korean:'오다',phonetic:'/kʌm/',sentence:STAGE3_PRACTICE.s3_come.text},
};
export function ensureStage3(state){
 const s=state.stage3??={version:1};
 s.conversations??={};s.words??={class:false,cat:false,come:false};
 s.restored??={class:false,cat:false,come:false};
 s.boss??={round:0,completed:false};
 for(const key of ['incidentSeen','tommyReconciled','fragmentC','introductionCompleted','completed','dHookSeen'])s[key]??=false;
 s.rescue??={phase:'locked',completed:false};return s;
}
export function validStage3(s){
 if(!s)return true;
 return s.version===1&&s.conversations&&typeof s.conversations==='object'&&!Array.isArray(s.conversations)&&Object.values(s.conversations).every(v=>Number.isInteger(v)&&v>=0&&v<=3)
 &&['words','restored'].every(group=>s[group]&&['class','cat','come'].every(k=>typeof s[group][k]==='boolean'))
 &&s.boss&&Number.isInteger(s.boss.round)&&s.boss.round>=0&&s.boss.round<=3&&typeof s.boss.completed==='boolean'
 &&(!s.boss.completed||s.boss.round===3)&&s.rescue&&['locked','open','complete'].includes(s.rescue.phase)&&typeof s.rescue.completed==='boolean'
 &&['incidentSeen','tommyReconciled','fragmentC','introductionCompleted','completed','dHookSeen'].every(k=>typeof s[k]==='boolean')
 &&(!s.completed||(s.fragmentC&&s.introductionCompleted&&s.rescue.completed));
}
export function advanceStage3(state,action,key){
 const s=ensureStage3(state);
 if(action==='word'&&Object.hasOwn(STAGE3_WORDS,key)){s.words[key]=true;return true;}
 if(action==='incident'&&s.words.cat){s.incidentSeen=true;return true;}
 if(action==='tommy'&&s.incidentSeen&&s.words.come){s.tommyReconciled=true;return true;}
 if(action==='restore'&&s.tommyReconciled&&Object.hasOwn(s.restored,key)){s.restored[key]=true;return true;}
 if(action==='round'&&Object.values(s.restored).every(Boolean)&&s.tommyReconciled&&key===s.boss.round&&key<3){s.boss.round++;if(s.boss.round===3){s.boss.completed=true;s.rescue.phase='open';}return true;}
 if(action==='rescue'&&s.boss.completed){s.rescue={phase:'complete',completed:true,releasedAt:s.rescue.releasedAt||Date.now()};s.fragmentC=true;if(!state.alphabetPieces.includes('C'))state.alphabetPieces.push('C');return true;}
 if(action==='complete'&&s.fragmentC&&s.rescue.completed){s.introductionCompleted=true;s.completed=true;return true;}
 return false;
}
export const STAGE3_CHECKLIST=[
 ['s3-class','교실 찾아 인사하기','Class 간판을 조사하고 선생님과 인사해요.',s=>s.words.class&&s.conversations.teacher===2],
 ['s3-cat','학급 고양이 코코 만나기','Cat 그림과 코코를 조사해요.',s=>s.words.cat],
 ['s3-incident','사라진 C 소리','칠판 앞 발표 자리에서 이야기를 확인해요.',s=>s.incidentSeen],
 ['s3-team','토미와 함께 용기 내기','Come 연습 후 토미의 이야기를 들어요.',s=>s.tommyReconciled],
 ['s3-restore','교실의 C 세 곳 복원','CLASS · CAT · COME을 되찾아요.',s=>Object.values(s.restored).every(Boolean)],
 ['s3-rescue','사일런트 섀도와 코코 구출','문 앞에서 배운 문장으로 세 봉인을 풀어요.',s=>s.rescue.completed],
 ['s3-finish','첫 자기소개와 C 조각','선생님 앞에서 소개한 뒤 식당으로 향해요.',s=>s.completed],
].map(([id,title,subtitle,done])=>({id,title,subtitle,isDone:state=>done(ensureStage3(state))}));
export function stage3Goal(state){const s=ensureStage3(state);if(!s.words.class)return '🎯 복도 중앙의 CLASS 안내판 앞에 서서 A 버튼으로 조사해요.';if(s.conversations.teacher!==2)return '🎯 교실 선생님께 아침 인사를 해요.';if(!s.words.cat)return '🎯 교실의 코코와 고양이 그림을 조사해요.';if(!s.incidentSeen)return '🎯 칠판 앞 발표 자리를 조사해요.';if(!s.words.come)return '🎯 링고에게 C 소리를 배우고 활빈을 불러 봐요.';if(!s.tommyReconciled)return '🎯 토미에게 다가가 함께 말할 용기를 찾아요.';if(!Object.values(s.restored).every(Boolean))return '🎯 칠판·고양이 카드·문 옆에서 빠진 C를 되찾아요.';if(!s.rescue.completed)return '🎯 준비실 문 앞에서 사일런트 섀도의 봉인을 풀어요!';if(!s.completed)return '🎯 선생님에게 돌아가 첫 자기소개를 해요!';return '🎯 C 조각을 얻었어요! 복도의 식당 입구에서 다음 D 모험을 만나 보세요.';}
const obj=(id,kind,x,y,badge,sprite,label)=>({id,kind,x,y,badge,sprite,label:label||badge,direction:'down',labelOffsetY:id==='s3_class'?-18:0});
function objects(map,state){const s=ensureStage3(state),dark=s.incidentSeen&&!s.rescue.completed;
 if(map==='SchoolYard')return [obj('s3_amy','npc',8,6,'에이미','me_amy'),obj('s3_yard_keeper','npc',4,9,'학교 관리인','me_staff'),obj('s3_bus_driver','npc',12,12,'스쿨버스 기사','me_staff'),obj('s3_yard_student','npc',5,7,'등교하는 친구','me_kid'),obj('s3_hall','exit',10,5,'학교 현관'),obj('s3_bus','exit',10,13,'↩ B 정류장')];
 if(map==='SchoolHall')return [obj('s3_class','investigate',10,5,s.words.class?'✓ CLASS':'CLASS · 교실 간판'),obj('s3_amy','npc',8,7,'에이미','me_amy'),obj('s3_hall_student','npc',5,8,'학교 친구','me_kid'),obj('s3_librarian','npc',6,4,'도서 선생님','me_traveler'),obj('s3_hall_teacher','npc',12,10,'담임 선생님','me_staff'),obj('s3_hall_nurse','npc',8,11,'보건 선생님','me_traveler'),obj('s3_classroom','exit',16,6,'교실 문'),obj('s3_yard','exit',10,13,'↩ 운동장'),obj('s3_lunch','exit',10,2,s.completed?'🍽 D · 식당':'식당 · 점심시간에 만나요')];
 if(map==='CocoRoom')return [obj('s3_room_amy','npc',5,9,'에이미','me_amy'),obj('s3_room_monitor','npc',10,9,'도우미 친구','me_kid'),obj('s3_room_caretaker','npc',13,11,'준비실 선생님','me_staff'),obj('s3_coco_bed','investigate',12,6,'코코의 바구니'),obj('s3_room_back','exit',2,7,'↩ 교실')];
 return [obj('s3_teacher','npc',9,3,'선생님','me_teacher'),obj('s3_tommy','npc',s.tommyReconciled?13:5,s.tommyReconciled?8:7,'토미','me_tommy'),obj('s3_ringo','npc',7,10,'링고 · C 연습','me_ringo'),obj('s3_class_student','npc',13,11,'반 친구','me_kid'),obj('s3_class_lily','npc',3,8,'릴리 · 책 읽기','me_amy'),obj('s3_class_art','npc',11,8,'미술 선생님','me_traveler'),obj('s3_class_helper','npc',6,5,'보조 선생님','me_staff'),
 obj('s3_cat','investigate',14,10,dark&&!s.restored.cat?'AT · 고양이 카드':'CAT · 코코 그림'),obj('s3_incident','investigate',10,5,'첫 발표 자리'),
 obj('s3_restore_class','investigate',5,3,s.restored.class?'✓ CLASS':dark?'_LASS · C 복원':'CLASS · 칠판'),obj('s3_restore_cat','investigate',14,4,s.restored.cat?'✓ CAT':dark?'_AT · C 복원':'CAT · 카드'),obj('s3_restore_come','investigate',16,8,s.restored.come?'✓ COME':dark?'_OME · C 복원':'COME · 안내'),
 obj('s3_boss','investigate',17,6,s.rescue.completed?'✓ 준비실 · 코코':'준비실 · 코코 구출'),obj('s3_back','exit',10,13,'↩ 복도'),
 ...(!s.incidentSeen?[obj('s3_coco','npc',13,9,'코코','me_coco')]:s.rescue.completed?[obj('s3_coco_rescued','npc',14,7,'코코 · 구출 완료','me_coco')]:[]),...(dark?[obj('s3_shadow','npc',16,5,'사일런트 섀도','me_shadow')]:[])];
}
export function createStage3Maps(){return Object.fromEntries(STAGE3_MAP_IDS.map(id=>[id,{id,name:{SchoolYard:'학교 앞 · C의 첫걸음',SchoolHall:'학교 복도 · 파란 사물함',Classroom:'에이미의 교실 · C의 목소리',CocoRoom:'준비실 · 코코의 쉼터'}[id],width:20,height:15,collision:Array.from({length:15},(_,y)=>Array.from({length:20},(_,x)=>floor(id,x,y)?'FLOOR':'WALL')),getObjects:state=>objects(id,state),isPassable(state,x,y){return floor(id,x,y)&&!this.getObjects(state).some(o=>o.kind==='npc'&&o.x===x&&o.y===y);}}]));}
export function stage3Portal(state,x,y){if(!isStage3Map(state.map))return null;const o=objects(state.map,state).find(o=>o.kind==='exit'&&o.x===x&&o.y===y);if(!o)return null;return {...o,ready:o.id!=='s3_classroom'||ensureStage3(state).words.class};}
export function renderStage3Map(ctx,ox,oy,state,map,now=0){renderSchoolScene(ctx,ox,oy,state,map,now);}
export function drawStage3Actor(ctx,name,x,y,now){
 if(!['me_coco','me_shadow'].includes(name))return false;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));
 if(name==='me_coco'){drawSchoolAnimal(ctx,0,0,now);}
 else{ctx.translate(0,Math.sin(now/450));ctx.fillStyle='#302641';ctx.fillRect(3,1,10,4);ctx.fillRect(1,5,14,8);ctx.fillRect(3,13,3,3);ctx.fillRect(10,13,3,3);ctx.fillStyle='#9780b0';ctx.fillRect(2,5,1,7);ctx.fillStyle='#e9c6ff';ctx.fillRect(4,5,3,2);ctx.fillRect(10,5,3,2);}
 ctx.restore();return true;
}

export function sampleStage3Actor(actor,state){
 if(actor.id!=='s3_coco_rescued')return actor;
 const released=state.stage3?.rescue?.releasedAt;if(!released)return actor;
 const path=[[17,6],[16,6],[16,7],[15,7],[14,7]],progress=Math.max(0,Math.min(4,(Date.now()-released)/300)),index=Math.min(3,Math.floor(progress)),fraction=progress-index;
 return {...actor,x:path[index][0]+(path[index+1][0]-path[index][0])*fraction,y:path[index][1]+(path[index+1][1]-path[index][1])*fraction,walking:progress<4,progress:progress%1};
}
