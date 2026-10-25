// Functional actors must never fall through to the optional Creative conversation.
export function isFunctionalNpc(map,o){return !!(o.trainer||['elm','oak','officer','scientist','nurse','clerk','mom','fruit_tree','poke_ball'].includes(o.sprite)||o.flag==='EVENT_ROUTE_30_BATTLE'||/CatchingTutorial|HealingMachine|GymGuide|Earl|Kyle$|MailRecipient/.test(o.script||'')||map==='CherrygroveCity'&&o.sprite==='gramps'||map==='Route30BerryHouse'&&o.sprite==='pokefan_m');}
export function functionalInteraction(game,o){
 const s=game.state,map=s.map,script=o.script||'';
 if(map==='Route30'&&o.flag==='EVENT_ROUTE_30_BATTLE')return {speaker:'대결 중인 트레이너',pages:['가거라 꼬렛! 몸통박치기!!','지금은 친구와 중요한 승부를 하고 있어!','포켓몬 할아버지의 집은 이 길 오른쪽으로 돌아 북동쪽에 있어. 박사님께 알을 전한 뒤 다시 만나자!']};
 if(o.sprite==='oak'){
  if(s.flags.mysteryEgg&&!s.flags.pokedex){s.flags.pokedex=true;return {speaker:'오박사',pages:['포켓몬과 아주 잘 지내고 있구나!','포켓몬 도감을 받았다! 만난 친구들을 기록해 보렴.','알을 연구실의 공박사에게 전해 주겠니?']};}
  return {speaker:'오박사',pages:['나는 포켓몬을 연구하는 오박사란다.','먼저 옆에 계신 포켓몬 할아버지의 이야기를 들어 보렴.']};
 }
 if(o.sprite==='officer')return {speaker:'경찰관',pages:['연구소에서 포켓몬을 훔쳐 간 빨간 머리 아이를 보았니?','알려 줘서 고맙다. 가지고 온 알은 공박사님께 전해 드리렴.']};
 if(map==='ElmsLab'&&o.sprite==='scientist'){
  if(s.flags.eggDelivered&&!s.flags.aideBalls){s.flags.aideBalls=true;s.balls+=5;return {speaker:'공박사의 조수',pages:['박사님의 심부름을 해 줘서 고마워!','몬스터볼 5개를 받았다!','29번 도로의 포획 안내 선배에게 잡는 방법을 물어봐.']};}
  if(!s.flags.aidePotion){s.flags.aidePotion=true;s.potions++;return {speaker:'공박사의 조수',pages:['여행하는 동안 친구가 다치면 이걸 써.','상처약 1개를 받았다!']};}
  return {speaker:'공박사의 조수',pages:[s.flags.eggDelivered?'포켓몬을 약하게 만든 다음 몬스터볼을 던지면 잡기 쉬워.':'포켓몬 할아버지의 집은 무궁시티에서 북쪽 30번 도로에 있어.']};
 }
 if(script==='ElmsLabHealingMachine'){game.healParty();return {speaker:'회복 장치',pages:['친구들의 HP와 기술 PP가 모두 회복되었다!']};}
 if(o.sprite==='fruit_tree'){
  const day=game.now().toISOString().slice(0,10),key='fruit:'+map+':'+script;s.harvests??={};
  if(s.harvests[key]===day)return {speaker:'열매나무',pages:['오늘의 열매는 이미 땄어. 내일 다시 와 보자!']};
  const item=script==='Route30FruitTree2'?'PSNCUREBERRY':map==='Route31'?'BITTER_BERRY':map==='VioletCity'||script==='Route46FruitTree2'?'PRZCUREBERRY':'BERRY';s.harvests[key]=day;s.items??={};s.items[item]=(s.items[item]||0)+1;
  return {speaker:'열매나무',pages:[`${({BERRY:'나무열매',PSNCUREBERRY:'해독열매',BITTER_BERRY:'쓴맛열매',PRZCUREBERRY:'마비치료열매'})[item]} 1개를 얻었다!`]};
 }
 if(script==='CatchingTutorialDudeScript')return {speaker:'포획 안내 선배',pages:['야생 포켓몬은 먼저 공격해서 HP를 줄인 다음 잡는 거야.','가방에서 몬스터볼을 골라 던져 봐! 트레이너의 포켓몬은 잡을 수 없어.']};
 if(/GymGuide/.test(script))return {speaker:'체육관 안내원',pages:['여기는 도라지 체육관! 관장 비상은 비행 타입 포켓몬을 사용해.','피카츄의 전기 공격은 비행 타입에 강해. 상처를 입으면 센터에서 회복하고 도전해!']};
 if(/Earl/.test(script)||map==='EarlsPokemonAcademy'&&o.sprite==='earl')return {speaker:'포켓몬 학원 선생님',pages:['포켓몬마다 타입과 기술이 다르지요!','전기 기술은 비행 타입에 강하지만, 땅 타입에는 통하지 않아요. 배틀에서 확인해 보세요.']};
 if(script==='Kyle')return {speaker:'교환하는 친구',trade:!s.flags.onixTrade,pages:[s.flags.onixTrade?'교환해 준 모다피와 잘 지내고 있어!':'모다피가 있니? 내 롱스톤과 교환하지 않을래?']};
 if(['nurse','clerk','mom','elm','poke_ball'].includes(o.sprite)||map==='CherrygroveCity'&&o.sprite==='gramps')return null;
 if(isFunctionalNpc(map,o)){const label=game.map.scriptTexts?.[script],pages=game.map.texts?.[label];return {speaker:'포켓몬 안내',pages:pages||['포켓몬과 함께 여행하며 사람들에게 말을 걸어 보세요. 필요한 도구와 여행 정보를 얻을 수 있어요.']};}
 return null;
}
