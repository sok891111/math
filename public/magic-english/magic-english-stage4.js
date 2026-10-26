import {STAGE4_PRACTICE,STAGE4_TRAINS} from './magic-english-stage4-learning.js';
import {renderCafeteriaScene} from './magic-english-stage4-renderer.js';
export const STAGE4_MAP_IDS=['CafeteriaEntrance','CafeteriaHall','SentenceCorner','ServingCounter'];
export const isStage4Map=id=>STAGE4_MAP_IDS.includes(id);
export const STAGE4_WORDS={
 door:{word:'Door',korean:'문',phonetic:'/dɔːr/',sentence:STAGE4_PRACTICE.s4_open.text},
 drink:{word:'Drink',korean:'음료 · 마실 것',phonetic:'/drɪŋk/',sentence:STAGE4_PRACTICE.s4_drink.text},
 delicious:{word:'Delicious',korean:'아주 맛있는',phonetic:'/dɪˈlɪʃəs/',sentence:STAGE4_PRACTICE.s4_delicious.text},
 dish:{word:'Dish',korean:'음식 · 접시',phonetic:'/dɪʃ/',sentence:STAGE4_PRACTICE.s4_dish.text},
};
export function ensureStage4(state){
 const s=state.stage4??={version:1};s.words??={door:false,drink:false,delicious:false,dish:false};s.conversations??={};s.trains??={water:false,order:false,dish:false};s.trainSelections??={};s.boss??={round:0,completed:false};
 for(const k of ['doorOpened','incidentSeen','fragmentD','mealCompleted','completed','eHookSeen'])s[k]??=false;return s;
}
export function validStage4(s){
 if(s===undefined)return true;
 return s&&s.version===1&&s.words&&Object.keys(STAGE4_WORDS).every(k=>typeof s.words[k]==='boolean')&&s.trains&&Object.keys(STAGE4_TRAINS).every(k=>typeof s.trains[k]==='boolean')&&s.conversations&&Object.values(s.conversations).every(n=>Number.isInteger(n)&&n>=0&&n<=3)&&s.trainSelections&&Object.entries(s.trainSelections).every(([key,selection])=>STAGE4_TRAINS[key]&&Array.isArray(selection)&&new Set(selection).size===selection.length&&selection.every(i=>Number.isInteger(i)&&i>=0&&i<STAGE4_TRAINS[key].tokens.length))&&s.boss&&Number.isInteger(s.boss.round)&&s.boss.round>=0&&s.boss.round<=3&&typeof s.boss.completed==='boolean'&&(!s.boss.completed||s.boss.round===3)&&['doorOpened','incidentSeen','fragmentD','mealCompleted','completed','eHookSeen'].every(k=>typeof s[k]==='boolean')&&(!s.fragmentD||s.boss.completed)&&(!s.completed||s.fragmentD&&s.mealCompleted);
}
export function advanceStage4(state,action,key){
 const s=ensureStage4(state);
 if(action==='word'&&Object.hasOwn(STAGE4_WORDS,key)){s.words[key]=true;if(key==='door')s.doorOpened=true;return true;}
 if(action==='incident'&&Object.values(s.words).every(Boolean)){s.incidentSeen=true;return true;}
 if(action==='train'&&s.incidentSeen&&Object.hasOwn(STAGE4_TRAINS,key)){s.trains[key]=true;s.trainSelections[key]=[];return true;}
 if(action==='round'&&Object.values(s.trains).every(Boolean)&&key===s.boss.round&&key<3){s.boss.round++;if(s.boss.round===3){s.boss.completed=true;s.fragmentD=true;if(!state.alphabetPieces.includes('D'))state.alphabetPieces.push('D');}return true;}
 if(action==='complete'&&s.fragmentD){s.mealCompleted=true;s.completed=true;return true;}
 return false;
}
export const STAGE4_CHECKLIST=[
 ['s4-door','D의 문 열기','Open the door, please. 정중하게 부탁해요.',s=>s.doorOpened],
 ['s4-words','D 단어 네 가지 찾기','Door · Drink · Delicious · Dish를 발견해요.',s=>Object.values(s.words).every(Boolean)],
 ['s4-incident','데이지에게 첫 주문','배식대에서 뒤섞인 말의 순서를 확인해요.',s=>s.incidentSeen],
 ['s4-trains','문장 기차 세 대 완성','물을 부탁하기·음료 주문·접시 부탁을 순서대로 이어요.',s=>Object.values(s.trains).every(Boolean)],
 ['s4-boss','미스스펠 대결과 황금 D 배지','정중한 문장 세 번으로 봉인을 풀어요.',s=>s.boss.completed],
 ['s4-meal','함께 식사하고 감사하기','It is delicious! 식탁에서 말해요.',s=>s.completed],
].map(([id,title,subtitle,done])=>({id,title,subtitle,isDone:state=>done(ensureStage4(state))}));
export function stage4Goal(state){const s=ensureStage4(state);if(!s.doorOpened)return '🎯 DOOR 문 앞에서 정중한 문장으로 문을 열어요.';if(!Object.values(s.words).every(Boolean))return '🎯 식당의 음료·접시·맛있는 음식에서 D 단서를 찾아요.';if(!s.incidentSeen)return '🎯 배식대의 미즈 데이지에게 주문해 보세요.';if(!Object.values(s.trains).every(Boolean))return '🎯 문장 연습실에서 낱말을 순서대로 이어 문장 기차 세 대를 완성해요.';if(!s.boss.completed)return '🎯 배식대로 돌아가 미스스펠의 세 봉인을 풀고 황금 D 배지를 얻어요!';if(!s.completed)return '🎯 식당의 준비된 식탁에서 음식을 맛보고 감사 인사를 해요.';return '🎯 D 모험 완료! 식당 출구에서 다음 E 이야기를 만나 보세요.';}
const o=(id,kind,x,y,badge,sprite)=>({id,kind,x,y,badge,label:badge,sprite,direction:'down'});
function objects(map,state){const s=ensureStage4(state);
 if(map==='CafeteriaEntrance')return [o('s4_amy','npc',7,7,'에이미','me_amy'),o('s4_cleaner','npc',4,10,'학교 관리인','me_staff'),o('s4_entrance_student','npc',13,8,'식당 친구','me_kid'),o('s4_door','exit',10,3,s.doorOpened?'✓ DOOR · 식당':'DOOR · 문을 열어 주세요'),o('s4_back_school','exit',10,13,'↩ C의 학교 복도')];
 if(map==='SentenceCorner')return [o('s4_ringo','npc',9,9,'링고 · 문장 기차','me_ringo'),o('s4_tutor','npc',5,10,'선생님','me_staff'),o('s4_workshop_student','npc',14,10,'함께 연습하는 친구','me_kid'),o('s4_train_water','investigate',4,5,s.trains.water?'✓ WATER':'문장 기차 · 물'),o('s4_train_order','investigate',10,5,s.trains.order?'✓ DRINK':'문장 기차 · 음료 주문'),o('s4_train_dish','investigate',15,5,s.trains.dish?'✓ DISH':'문장 기차 · 음식'),o('s4_workshop_back','exit',10,13,'↩ 식당 홀')];
 if(map==='ServingCounter')return [o('s4_daisy','npc',10,4,'미즈 데이지 · 주문','me_daisy'),o('s4_chef','npc',4,8,'조리사','me_staff'),o('s4_helper','npc',14,9,'배식 도우미','me_amy'),o('s4_boss','investigate',10,6,s.boss.completed?'✓ 정중한 주문 완료':'미스스펠 · 문장 봉인'),o('s4_counter_back','exit',10,13,'↩ 식당 홀'),...(!s.boss.completed?[o('s4_misspell','npc',15,5,'미스터 미스스펠','me_misspell')]:[])];
 return [o('s4_amy','npc',7,8,'에이미','me_amy'),o('s4_tommy','npc',3,8,'토미','me_tommy'),o('s4_hall_student','npc',12,8,'점심 친구','me_kid'),o('s4_hall_monitor','npc',15,11,'도우미 친구','me_traveler'),o('s4_word_drink','investigate',4,3,s.words.drink?'✓ DRINK':'DRINK · 음료대'),o('s4_word_dish','investigate',14,3,s.words.dish?'✓ DISH':'DISH · 식판 선반'),o('s4_word_delicious','investigate',15,6,s.words.delicious?'✓ DELICIOUS':'DELICIOUS · 음식 진열대'),o('s4_counter','exit',10,2,'배식대 · 미즈 데이지'),o('s4_workshop','exit',2,6,'문장 연습실'),o('s4_meal','investigate',8,10,s.completed?'✓ 함께한 식탁':'따뜻한 식사 자리'),o('s4_exit','exit',10,13,s.completed?'E · 후식과 다음 모험':'↩ 식당 입구')];
}
export const STAGE4_OBSTACLES={
 CafeteriaEntrance:[{x:1,y:1,w:18,h:2},{x:3,y:4,w:3,h:2},{x:14,y:4,w:3,h:2}],
 CafeteriaHall:[{x:1,y:1,w:18,h:1},{x:3,y:2,w:3,h:2},{x:13,y:2,w:3,h:2},{x:15,y:5,w:3,h:2},{x:6,y:5,w:3,h:2},{x:6,y:9,w:3,h:2},{x:11,y:10,w:3,h:2}],
 SentenceCorner:[{x:1,y:1,w:18,h:1},{x:3,y:3,w:3,h:2},{x:9,y:3,w:3,h:2},{x:14,y:3,w:3,h:2}],
 ServingCounter:[{x:1,y:1,w:18,h:1},{x:3,y:2,w:14,h:2},{x:7,y:5,w:3,h:1},{x:11,y:5,w:3,h:1}],
};
export function stage4Floor(map,x,y){if(!Number.isInteger(x)||!Number.isInteger(y)||x<1||y<1||x>18||y>13)return false;return !(STAGE4_OBSTACLES[map]||[]).some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);}
export function createStage4Maps(){return Object.fromEntries(STAGE4_MAP_IDS.map(id=>[id,{id,name:{CafeteriaEntrance:'식당 입구 · D의 문',CafeteriaHall:'학교 식당 · 점심시간',SentenceCorner:'문장 연습실 · 낱말 기차',ServingCounter:'배식대 · 데이지와 정중한 주문'}[id],width:20,height:15,collision:Array.from({length:15},(_,y)=>Array.from({length:20},(_,x)=>stage4Floor(id,x,y)?'FLOOR':'WALL')),getObjects:state=>objects(id,state),isPassable(state,x,y){return stage4Floor(id,x,y)&&!this.getObjects(state).some(a=>a.kind==='npc'&&a.x===x&&a.y===y);}}]));}
export function stage4Portal(state,x,y){if(!isStage4Map(state.map))return null;const target=objects(state.map,state).find(a=>a.kind==='exit'&&a.x===x&&a.y===y);return target?{...target,ready:target.id!=='s4_door'||ensureStage4(state).doorOpened}:null;}
export function renderStage4Map(c,x,y,state,map,now){renderCafeteriaScene(c,x,y,state,map,now);}
