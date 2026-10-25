import {createPokemon} from './battle.js?v=20261025-early1';
import {recordCaught} from './monster-dex.js?v=20261018-gaddoongi30';
import {thirdInteraction,thirdEntry,thirdGoal} from './third-badge.js?v=20261025-third1';
import {secondInteraction,secondEntry,secondGoal} from './second-badge.js?v=20261025-third1';
import {beginLabCall,LAB_CALL_PAGES} from './phone-call.js?v=20261018-table19';
import {functionalInteraction} from './functional-npc.js?v=20261018-table19';
// Stage 1 PoC: Episode 1 "조선의 영웅, 미국에 떨어지다!" (Alphabet A: Airplane, Apple, Ask)
export function chapterGoal(state){
 if(!state.flags.mysteryEgg&&!state.flags.eggDelivered)return '【Stage 1 목표】 국제선 중앙 로비 북쪽 길의 오른쪽 통로를 따라 「공항 안내 데스크 · 분실물 보관소」로 가서 "Excuse me. Can I ask?"를 외치고 활빈을 찾아요!';
 if(!state.flags.eggDelivered)return '【Stage 1 목표】 활빈과 「A 알파벳 조각」을 찾았어요! 미스터 미스스펠을 물리치고 「때르릉호 연구실」의 에이미에게 돌아가 때르릉호를 수리해요!';
 if(!state.flags.violet)return '【Stage 1 완료!】 때르릉호 A 알파벳 수리 완료! 분실물 보관소 가는 길에서 오해 삼총사와 대결하거나 A 마법카드를 모아 보세요!';
 if(!state.flags.zephyr)return '도라지 체육관에서 관장 비상에게 도전해요. 북쪽 모다피탑에도 올라갈 수 있어요.';
 if(state.flags.hive)return thirdGoal(state);
 return secondGoal(state);
}
export function storyInteraction(game,o){
 const s=game.state,id=s.map;const third=thirdInteraction(game,o);if(third)return third;const second=secondInteraction(game,o);if(second)return second;
 if(id==='MrPokemonsHouse'&&o.sprite==='gentleman'){
  if(!s.flags.mysteryEgg&&!s.flags.eggDelivered){
   s.flags.mysteryEgg=true;s.flags.pokedex=true;s.flags.labTheft=true;s.lastCenter='CherrygrovePokecenter1F';s.items??={};s.items.MYSTERY_EGG=1;
   if(typeof window!=='undefined'&&game.battleData?.species?.hwalbin&&s.party&&!s.party.some(p=>p.species==='hwalbin')&&s.party.length<6){
    s.party.push(createPokemon(game.battleData,'hwalbin',5,game.rng));recordCaught(s,'hwalbin');
   }
   game.healParty();
   return {speaker:'공항 안내 데스크 직원 & 활빈',pages:[
    '홍길동이 조선에서의 다짐("모르면 묻고, 의심하기 전에 살펴라!")을 떠올리며 용기 있게 외쳤다! "Excuse me. Can I ask?"',
    '안내 데스크 직원: "Sure! How can I help you?" 분실물 선반에서 활빈이 뛰어오르고, 빛나는 「A 알파벳 조각」과 마법영어 도감을 받았다!',
    '활빈: "길동아! 나 여기 있었어! Apple(사과) 냄새를 따라왔지!" 활빈이 동료로 합류하고 모두 힘을 회복했어! 이제 때르릉호 연구실의 에이미에게 돌아가자!'
   ]};
  }
  game.healParty();return {speaker:'공항 안내 데스크 직원',pages:['"Excuse me. Can I ask?"라고 정중하게 물어보면 낯선 공항에서도 누구든 친절하게 도와준단다!','길동과 동료들이 모두 용기와 에너지를 회복했어!']};
 }
 if(id==='ElmsLab'&&o.sprite==='elm'&&(s.flags.easyStart||s.flags.mysteryEgg)){
  if(s.flags.mysteryEgg&&!s.flags.eggDelivered){
   s.flags.eggDelivered=true;s.items??={};delete s.items.MYSTERY_EGG;game.healParty();
   return {speaker:'에이미 (Amy) & 링고 (Ringo)',pages:[
    '에이미: 와! 활빈도 구출하고 「A 알파벳 조각」도 가져왔구나! 두려움을 이겨 내고 "Excuse me. Can I ask?"를 외치다니 정말 멋져!',
    '링고: Ding! Correct! A — Airplane(비행기), Apple(사과), Ask(물어보다)! 때르릉호에 「A 알파벳 조각」을 장착해 1단계 복구를 마쳤어!',
    '🎉 Stage 1 (제1화: 조선의 영웅, 미국에 떨어지다!) 완료! 분실물 보관소 가는 길에서 오해 삼총사(노노·웅얼이·따라쟁이)와 대결하거나 A 마법카드를 수집해 봐!'
   ]};
  }
  if(s.flags.eggDelivered){game.healParty();return {speaker:'에이미 (Amy)',pages:['때르릉호 1단계(알파벳 A: Airplane, Apple, Ask) 수리가 완벽히 끝났어! 동료들도 모두 힘을 되찾았단다!','앗, 방금 버스 정류장의 BUS 표지판이 SUB로 바뀌었다는 소식이 들려왔어! 다음 Stage 2(알파벳 B) 모험도 기대해 줘!']};}
  game.healParty();return {speaker:'에이미 (Amy) & 링고 (Ringo)',pages:[
   '에이미: 길동아, 정신이 드니? 여기는 미국 공항의 때르릉호 임시 연구실이야! 시간 균열 때문에 단짝 친구 「활빈」과 헤어졌구나.',
   '링고: Ding! 오늘 배울 첫 알파벳은 「A a」야! Airplane(비행기), Apple(사과), 그리고 모르는 걸 물어보는 Ask(물어보다)!',
   '에이미: 서쪽 공항 연결 통로 → 국제선 중앙 로비 → 북쪽 길의 「공항 안내 데스크 · 분실물 보관소」로 가서 "Excuse me. Can I ask?"라고 물어보면 활빈과 A 알파벳 조각을 찾을 수 있을 거야!'
  ]};
 }
 if(o.trainer){const t=game.battleData.trainers[o.trainer];if(s.flags['trainer:'+o.trainer])return {speaker:t.name,pages:[t.badge?`${t.badgeName||'윙배지'}를 얻은 걸 축하해!`:'으악! "Excuse me. Can I ask?"의 또렷한 영어 발음에 내 혼란 마법이 풀려 버렸어!']};return {trainer:o.trainer,speaker:t.name,pages:t.introPages||['내 혼란 영어 마법과 승부를 겨뤄 보자!']};}
 if(id==='Route30BerryHouse'&&o.sprite==='pokefan_m'){if(!s.flags.berryGift){s.flags.berryGift=true;s.items??={};s.items.BERRY=(s.items.BERRY||0)+1;}return {speaker:'능금(Apple) 하우스 아저씨',pages:['"A is for Apple!" 조선에서는 능금이라고 부른다지? 달콤한 사과 열매(Apple) 1개를 받았다!','공항 안내 데스크와 분실물 보관소는 이 길의 북동쪽에 있단다.']};}
 if(id==='VioletPokecenter1F'&&o.sprite==='scientist'&&s.flags.zephyr){if(!s.flags.eggGift){s.flags.eggGift=true;s.items??={};s.items.TOGEPI_EGG=1;}return {speaker:'박사님의 조수',pages:['윙배지를 얻었구나! 박사님도 아주 기뻐하셨어.','알을 받았다! 이제 남쪽 32번 도로에서 연결동굴을 지나 고동마을로 가 보렴.']};}
 if(o.kind==='OBJECTTYPE_ITEMBALL'){
  const key='item:'+id+':'+o.script;if(s.flags[key])return null;s.flags[key]=true;
  const item=o.item||'POTION';s.items??={};s.items[item]=(s.items[item]||0)+1;
  if(item==='POTION')s.potions++;if(item==='POKE_BALL')s.balls++;
  const names={POTION:'Apple 용기물약',POKE_BALL:'마법카드 볼',ANTIDOTE:'해독제',PARLYZ_HEAL:'마비치료제',X_DEFEND:'디펜드업',ESCAPE_ROPE:'동굴탈출로프',RARE_CANDY:'이상한사탕',HYPER_POTION:'고급상처약'};
  return {speaker:'마법 도구 발견',pages:[`${names[item]||item} 1개를 찾았다!`]};
 }
 return functionalInteraction(game,o);
}


export function storyEntry(game){
 const s=game.state;if(s.battle||s.healing||s.trainerEncounter)return null;
 const third=thirdEntry(game);if(third)return third;
 const second=secondEntry(game);if(second)return second;
 if(s.map==='MrPokemonsHouse'&&s.flags.mysteryEgg&&!s.flags.pokedex)return functionalInteraction(game,game.objects().find(o=>o.sprite==='oak'));
 if(s.map==='MrPokemonsHouse'&&!s.flags.mysteryEgg&&!s.flags.eggDelivered)return storyInteraction(game,game.objects().find(o=>o.sprite==='gentleman'));
 if(s.phoneCall||beginLabCall(s))return {phone:true,speaker:'에이미 & 링고의 무전 전화',pages:LAB_CALL_PAGES};
 if(s.map==='ElmsLab'&&s.flags.mysteryEgg&&!s.flags.eggDelivered&&!s.flags.policeReport){s.flags.labTheft=true;s.flags.policeReport=true;return {speaker:'경찰관',pages:['공항 표지판 EXIT를 TIXE로 뒤섞어 놓은 보라색 모자 악당(미스터 미스스펠)을 물리쳤다고? 알려 줘서 고맙다!','에이미와 링고가 기다리고 있어. 안쪽의 에이미에게 말을 걸어 찾아온 「A 알파벳 조각」을 전해 주렴!']};}
 return null;
}
