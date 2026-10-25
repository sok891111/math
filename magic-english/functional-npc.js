// Functional actors must never fall through to the optional Creative conversation.
export function isFunctionalNpc(map,o){return !!(o.trainer||['elm','oak','officer','scientist','nurse','clerk','mom','fruit_tree','poke_ball'].includes(o.sprite)||o.flag==='EVENT_ROUTE_30_BATTLE'||/CatchingTutorial|HealingMachine|GymGuide|Earl|Kyle$|MailRecipient/.test(o.script||'')||map==='CherrygroveCity'&&o.sprite==='gramps'||map==='Route30BerryHouse'&&o.sprite==='pokefan_m');}
export function functionalInteraction(game,o){
 const s=game.state,map=s.map,script=o.script||'';
 if(map==='Route30'&&o.flag==='EVENT_ROUTE_30_BATTLE')return {speaker:'오해 삼총사 소동',pages:['노노: "No! Not me!" vs 따라쟁이: "Me too!" 몸통박치기처럼 부딪치며 길을 막고 소동을 벌이고 있어!','웅얼이: "Um...? Maybe..." 지금은 오해 삼총사끼리 말싸움 중이야!','오른쪽 길로 돌아 북동쪽 「공항 안내 데스크 · 분실물 보관소」에서 활빈과 A 알파벳 조각을 먼저 찾자!']};
 if(o.sprite==='oak'){
  if(s.flags.mysteryEgg&&!s.flags.pokedex){s.flags.pokedex=true;return {speaker:'활빈 (Hwalbin)',pages:['활빈: "길동아! 드디어 찾았구나! Apple(사과) 냄새를 따라 여기서 기다렸어!"','마법영어 도감을 받았다! 공항에서 만난 친구들과 A 마법카드를 기록해 보렴.','찾아낸 「A 알파벳 조각」을 때르릉호 연구실의 에이미에게 전해 주자!']};}
  return {speaker:'활빈 (Hwalbin)',pages:['활빈: "길동아! 나 여기 분실물 보관소에 있어!"','옆에 계신 공항 안내 데스크 직원에게 "Excuse me. Can I ask?"라고 정중하게 물어봐!']};
 }
 if(o.sprite==='officer')return {speaker:'공항 보안 경찰관',pages:['공항 표지판 EXIT를 TIXE로 바꿔 놓은 미스터 미스스펠을 보았니?','알려 줘서 고맙다! 찾아온 「A 알파벳 조각」은 에이미와 링고에게 전해 주렴.']};
 if(map==='ElmsLab'&&o.sprite==='scientist'){
  if(s.flags.eggDelivered&&!s.flags.aideBalls){s.flags.aideBalls=true;s.balls+=5;return {speaker:'링고 (Ringo)',pages:['Ding! Correct! 때르릉호 1단계(알파벳 A) 복구를 도와줘서 고마워, 길동아!','마법카드 볼 5개를 받았다!','공항 연결 통로나 분실물 보관소 가는 길에서 A 마법카드(Airplane, Apple, Ask)를 수집해 봐!']};}
  if(!s.flags.aidePotion){s.flags.aidePotion=true;s.potions++;return {speaker:'링고 (Ringo)',pages:['Ding! 모험하는 동안 지치면 이 달콤한 사과(Apple) 회복약을 써!','Apple 용기물약(상처약) 1개를 받았다!']};}
  return {speaker:'링고 (Ringo)',pages:[s.flags.eggDelivered?'Ding! 야생 마법카드나 오해 삼총사를 만나면 영어 문제를 풀어 동료로 맞이할 수 있어!':'Ding! 「공항 안내 데스크 · 분실물 보관소」는 국제선 중앙 로비 북쪽 길의 오른쪽 통로 끝에 있어!']};
 }
 if(script==='ElmsLabHealingMachine'){game.healParty();return {speaker:'때르릉호 에너지 충전기',pages:['Ding! 길동과 동료들의 HP와 영어 주문 PP가 모두 회복되었다!']};}
 if(o.sprite==='fruit_tree'){
  const day=game.now().toISOString().slice(0,10),key='fruit:'+map+':'+script;s.harvests??={};
  if(s.harvests[key]===day)return {speaker:'사과(Apple) 나무',pages:['오늘의 사과 열매(Apple)는 이미 땄어. 내일 다시 와 보자!']};
  const item=script==='Route30FruitTree2'?'PSNCUREBERRY':map==='Route31'?'BITTER_BERRY':map==='VioletCity'||script==='Route46FruitTree2'?'PRZCUREBERRY':'BERRY';s.harvests[key]=day;s.items??={};s.items[item]=(s.items[item]||0)+1;
  return {speaker:'사과(Apple) 나무',pages:[`${({BERRY:'달콤한 사과(Apple) 열매',PSNCUREBERRY:'해독 사과열매',BITTER_BERRY:'쓴맛 사과열매',PRZCUREBERRY:'마비치료 사과열매'})[item]} 1개를 얻었다!`]};
 }
 if(script==='CatchingTutorialDudeScript')return {speaker:'공항 영어 안내 선배',pages:['공항 통로에서 만나는 마법카드나 오해 삼총사는 가방의 「마법카드 볼」을 던져 동료로 맞이할 수 있어!','영어 문제를 맞히면 100% 동료가 된단다!']};
 if(/GymGuide/.test(script))return {speaker:'체육관 안내원',pages:['여기는 도라지 체육관! 관장 비상은 비행 타입을 사용해.']};
 if(/Earl/.test(script)||map==='EarlsPokemonAcademy'&&o.sprite==='earl')return {speaker:'마법영어 학원 선생님',pages:['알파벳마다 고유한 소리와 핵심 단어가 있단다!','A는 Airplane(비행기), Apple(사과), Ask(물어보다)를 기억해 보렴!']};
 if(script==='Kyle')return {speaker:'교환하는 친구',trade:!s.flags.onixTrade,pages:[s.flags.onixTrade?'교환해 준 친구와 잘 지내고 있어!':'모다피가 있니? 내 롱스톤과 교환하지 않을래?']};
 if(['nurse','clerk','mom','elm','poke_ball'].includes(o.sprite)||map==='CherrygroveCity'&&o.sprite==='gramps')return null;
 if(isFunctionalNpc(map,o)){const label=game.map.scriptTexts?.[script],pages=game.map.texts?.[label];return {speaker:'공항 안내',pages:pages||['모르는 것이 있을 때는 "Excuse me. Can I ask?"라고 정중하게 물어보세요!']};}
 return null;
}
