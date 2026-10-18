import {secondInteraction,secondEntry,secondGoal} from './second-badge.js?v=20261018-table19';
import {beginLabCall,LAB_CALL_PAGES} from './phone-call.js?v=20261018-table19';
import {functionalInteraction} from './functional-npc.js?v=20261018-table19';
// First badge chapter: original Gold locations, with short directions for young players.
export function chapterGoal(state){
 if(!state.flags.mysteryEgg&&!state.flags.eggDelivered)return '무궁시티 북쪽 30번 도로의 오른쪽 길로 가요! 북동쪽 포켓몬 할아버지의 집을 찾아요.';
 if(!state.flags.eggDelivered)return '이상한 알을 받았어요! 29번 도로를 지나 연구실로 돌아가 박사님께 전해요.';
 if(!state.flags.violet)return '30번 도로의 왼쪽 길 → 31번 도로 → 도라지시티로 가요.';
 if(!state.flags.zephyr)return '도라지 체육관에서 관장 비상에게 도전해요. 북쪽 모다피탑에도 올라갈 수 있어요.';
 return secondGoal(state);
}
export function storyInteraction(game,o){
 const s=game.state,id=s.map;const second=secondInteraction(game,o);if(second)return second;
 if(id==='MrPokemonsHouse'&&o.sprite==='gentleman'){
  if(!s.flags.mysteryEgg&&!s.flags.eggDelivered){s.flags.mysteryEgg=true;s.flags.pokedex=true;s.flags.labTheft=true;s.lastCenter='CherrygrovePokecenter1F';s.items??={};s.items.MYSTERY_EGG=1;game.healParty();return {speaker:'포켓몬 할아버지와 오박사',pages:['신기한 알을 발견했단다. 연구실의 박사님께 전해 주겠니?','오박사: 피카츄와 좋은 친구가 되었구나! 포켓몬 도감을 선물하마.','친구들의 힘을 회복했어. 30번 도로를 내려가 무궁시티 → 29번 도로 → 연구실로 돌아가자!']};}
  game.healParty();return {speaker:'포켓몬 할아버지',pages:['알에는 어떤 친구가 들어 있을까? 모양과 무늬를 자세히 관찰해 보렴.','지친 친구들이 모두 힘을 되찾았단다.']};
 }
 if(id==='ElmsLab'&&o.sprite==='elm'&&(s.flags.easyStart||s.flags.mysteryEgg)){
  if(s.flags.mysteryEgg&&!s.flags.eggDelivered){s.flags.eggDelivered=true;s.items??={};delete s.items.MYSTERY_EGG;game.healParty();return {speaker:'공박사',pages:['이상한 알을 가져왔구나! 고마워. 알은 내가 살펴볼게.','이제 30번 도로의 왼쪽 길로 가 보렴. 31번 도로를 지나면 도라지시티란다.','도라지 체육관의 관장 비상에게 도전해 봐! 생각을 모으면 강력한 공격을 할 수 있어.']};}
  if(s.flags.eggDelivered){game.healParty();return {speaker:'공박사',pages:['친구들이 모두 힘을 되찾았어!',s.flags.zephyr?'윙배지를 얻었구나! 관찰하고 생각하는 힘이 많이 자랐네.':'30번 도로 왼쪽 길에서 31번 도로를 지나 도라지시티로 가렴. 체육관에서 비상이 기다린단다.']};}
  game.healParty();return {speaker:'공박사',pages:['피카츄는 이미 네 친구란다. 준비는 끝났어!','연구실을 나가 서쪽 29번 도로 → 무궁시티 → 북쪽 30번 도로로 가렴.','포켓몬 할아버지가 신기한 알을 발견했대. 같이 살펴봐 줄래?']};
 }
 if(o.trainer){const t=game.battleData.trainers[o.trainer];if(s.flags['trainer:'+o.trainer])return {speaker:t.name,pages:[t.badge?`${t.badgeName||'윙배지'}를 얻은 걸 축하해! 서로 다른 방법으로 생각하는 힘이 멋지구나.`:'좋은 대결이었어! 다음에 또 생각 놀이를 해 보자.']};return {trainer:o.trainer,speaker:t.name,pages:t.introPages||['내 포켓몬과 승부를 겨뤄 보자!']};}
 if(id==='Route30BerryHouse'&&o.sprite==='pokefan_m'){if(!s.flags.berryGift){s.flags.berryGift=true;s.items??={};s.items.BERRY=(s.items.BERRY||0)+1;}return {speaker:'열매 할아버지',pages:['열매는 친구들이 힘을 내도록 도와준단다. 나무열매 1개를 받았다!','포켓몬 할아버지의 집은 이 길의 북동쪽에 있어.']};}
 if(id==='VioletPokecenter1F'&&o.sprite==='scientist'&&s.flags.zephyr){if(!s.flags.eggGift){s.flags.eggGift=true;s.items??={};s.items.TOGEPI_EGG=1;}return {speaker:'박사님의 조수',pages:['윙배지를 얻었구나! 박사님도 아주 기뻐하셨어.','알을 받았다! 이제 남쪽 32번 도로에서 연결동굴을 지나 고동마을로 가 보렴.']};}
 if(o.kind==='OBJECTTYPE_ITEMBALL'){
  const key='item:'+id+':'+o.script;if(s.flags[key])return null;s.flags[key]=true;
  const item=o.item||'POTION';s.items??={};s.items[item]=(s.items[item]||0)+1;
  if(item==='POTION')s.potions++;if(item==='POKE_BALL')s.balls++;
  const names={POTION:'상처약',POKE_BALL:'몬스터볼',ANTIDOTE:'해독제',PARLYZ_HEAL:'마비치료제',X_DEFEND:'디펜드업',ESCAPE_ROPE:'동굴탈출로프',RARE_CANDY:'이상한사탕',HYPER_POTION:'고급상처약'};
  return {speaker:'도구 발견',pages:[`${names[item]||item} 1개를 찾았다!`]};
 }
 return functionalInteraction(game,o);
}


export function storyEntry(game){
 const s=game.state;if(s.battle||s.healing||s.trainerEncounter)return null;
 const second=secondEntry(game);if(second)return second;
 if(s.map==='MrPokemonsHouse'&&s.flags.mysteryEgg&&!s.flags.pokedex)return functionalInteraction(game,game.objects().find(o=>o.sprite==='oak'));
 if(s.map==='MrPokemonsHouse'&&!s.flags.mysteryEgg&&!s.flags.eggDelivered)return storyInteraction(game,game.objects().find(o=>o.sprite==='gentleman'));
 if(s.phoneCall||beginLabCall(s))return {phone:true,speaker:'공박사의 전화',pages:LAB_CALL_PAGES};
 if(s.map==='ElmsLab'&&s.flags.mysteryEgg&&!s.flags.eggDelivered&&!s.flags.policeReport){s.flags.labTheft=true;s.flags.policeReport=true;return {speaker:'경찰관',pages:['포켓몬을 훔쳐 간 빨간 머리 아이를 보았다고? 알려 줘서 고맙다.','공박사님이 기다리고 계셔. 연구소 안쪽 박사님께 말을 걸어 알을 전해 드리렴.']};}
 return null;
}
