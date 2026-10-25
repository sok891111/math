// Main Gold story through Azalea: guards, Kurt, the well, Bugsy and the rival.
export const CENTERS=['CherrygrovePokecenter1F','VioletPokecenter1F','Route32Pokecenter1F','AzaleaPokecenter1F','GoldenrodPokecenter1F'];
export function secondObjectVisible(game,o){const s=game.state,id=s.map,f=s.flags;
 if(id==='AzaleaTown'){
  if(o.script==='ObjectEvent')return false;
  if(o.script==='AzaleaTownRocket1Script')return !f.kurtHelp;
  if(o.script==='AzaleaTownRocket2Script')return !f.slowpokeWell;
  if(o.sprite==='slowpoke')return !!f.slowpokeWell;
 }
 if(id==='KurtsHouse'){
  if(o.sprite==='kurt')return o.x===3&&(!f.kurtHelp||f.slowpokeWell);
  if(o.sprite==='slowpoke')return !!f.slowpokeWell;
 }
 if(id==='SlowpokeWellB1F'){
  if(o.trainer||o.sprite==='kurt')return !!f.kurtHelp&&!f.slowpokeWell;
  if(o.sprite==='slowpoke')return !f.slowpokeWell;
 }
 if(id==='Route32'&&o.script==='SlowpokeTailSalesmanScript')return !f.slowpokeWell;
 if(id==='Route32'&&o.script==='FriedaScript')return game.now().getDay?.()===5;
 return true;
}
export function secondStep(game,x,y){const s=game.state;
 if(s.map==='Route32'&&x===18&&y===8&&(!s.flags.zephyr||!s.flags.eggGift))return {type:'story-blocked',speaker:'32번 도로의 트레이너',pages:[!s.flags.zephyr?'도라지 체육관에서 윙배지를 얻은 뒤에 내려가렴.':'도라지 포켓몬센터에서 공박사님의 조수가 기다리고 있어. 알을 받아 온 뒤에 출발하렴.']};
 if(s.map==='AzaleaTown'&&((x===31&&y===7&&!s.flags.kurtHelp)||(x===10&&y===15&&!s.flags.slowpokeWell)))return {type:'story-blocked',speaker:'로켓단',pages:['지금은 지나갈 수 없다! 마을 북서쪽 강집의 집을 찾아보자.']};
 return null;
}
export function secondInteraction(game,o){const s=game.state,f=s.flags,id=s.map,script=o.script||'',reply=(speaker,pages)=>({speaker,pages});
 if(id==='KurtsHouse'&&o.sprite==='kurt'){
  if(!f.slowpokeWell){f.kurtHelp=true;return reply('강집',game.map.texts.KurtsHouseKurtMakingBallsMustWaitText||['로켓단이 야돈의 꼬리를 자르고 있다니! 가만둘 수 없지.','내가 먼저 야돈우물로 가겠다. 마을 동쪽 우물로 따라오너라!']);}
  if(!f.lureBallGift){f.lureBallGift=true;s.items??={};s.items.LURE_BALL=(s.items.LURE_BALL||0)+1;return reply('강집',['야돈들을 구해 줘서 정말 고맙다.','감사의 표시로 루어볼 1개를 주마! 이제 고동 체육관에서 호일에게 도전할 수 있단다.']);}
  return reply('강집',['규토리로 특별한 볼을 만드는 것이 내 일이란다.','고동 체육관의 호일은 벌레 포켓몬을 연구하고 있지.']);
 }
 if(id==='SlowpokeWellB1F'&&o.sprite==='kurt')return reply('강집',game.map.texts.SlowpokeWellB1FKurtText||['우물에 내려오다 허리를 다쳤구나. 나 대신 야돈들을 구해 주겠니?']);
 if(id==='AzaleaTown'&&script==='AzaleaTownRocket1Script')return reply('로켓단',['이 우물에는 들어갈 수 없다!','마을 북서쪽에 있는 강집에게 상황을 알려보자.']);
 if(id==='AzaleaTown'&&script==='AzaleaTownRocket2Script')return reply('로켓단',['체육관은 지금 문을 닫았다!','야돈우물에서 무슨 일이 일어나고 있는지 알아보자.']);
 if(id==='Route32'&&script==='Route32CooltrainerMScript'){
  if(!f.zephyr||!f.eggGift)return reply('32번 도로의 트레이너',[!f.zephyr?'윙배지를 얻었니? 먼저 도라지 체육관에 도전해 보렴.':'도라지 포켓몬센터에서 공박사님의 조수에게 알을 받아 오렴.']);
  if(!f.miracleSeed){f.miracleSeed=true;s.items??={};s.items.MIRACLE_SEED=1;return reply('32번 도로의 트레이너',['윙배지를 얻었구나! 좋은 포켓몬을 키우고 있네.','기적의씨를 받았다! 남쪽 연결동굴을 지나면 고동마을이야.']);}
  return reply('32번 도로의 트레이너',['32번 도로를 따라 남쪽으로 내려가 연결동굴로 가 보렴.']);
 }
 if(script==='Route32Pokecenter1FFishingGuruScript'){
  if(!f.oldRod){f.oldRod=true;s.items??={};s.items.OLD_ROD=1;return reply('낚시꾼',['낚시를 좋아하니? 낡은낚싯대를 주마!','물가에는 헤엄치는 포켓몬들이 있단다.']);}
  return reply('낚시꾼',['낚싯대를 소중히 간직하렴.']);
 }
 if(id==='AzaleaGym'&&/Guide/.test(script))return reply('체육관 안내원',['고동 체육관의 관장 호일은 벌레 타입 전문가야.','불꽃·비행·바위 공격을 활용해 봐. 마지막 공격은 수학 문제를 맞혀야 성공해!']);
 if(id==='Route32'&&script==='SlowpokeTailSalesmanScript')return reply('꼬리 장사꾼',['맛있는 야돈꼬리는 백만원!','살 수 없구나. 고동마을에서 야돈들에게 무슨 일이 생겼는지 알아보자.']);
 if(/Kurt|Slowpoke|Charcoal|Kiln/.test(script)||o.sprite==='slowpoke'){
  const key=game.map.scriptTexts?.[script];return reply(o.sprite==='slowpoke'?'야돈':'고동마을 주민',game.map.texts[key]||['야돈이 무사히 돌아올 수 있도록 도와줘.']);
 }
 return null;
}
export function secondEntry(game){const s=game.state;
 if(s.flags.wellReturn){delete s.flags.wellReturn;return {speaker:'강집',pages:['로켓단이 도망쳤구나! 야돈들이 무사해서 다행이다.','집으로 돌아와 친구들을 모두 회복했단다. 내게 말을 걸면 선물을 주마.','이제 고동 체육관의 관장 호일에게 도전해 보렴!']};}
 return null;
}
export function secondGoal(s){if(!s.flags.eggGift)return '도라지 포켓몬센터에서 공박사의 조수에게 알을 받아요.';if(!s.flags.azalea)return '32번 도로 → 연결동굴 → 33번 도로를 지나 고동마을로 가요.';if(!s.flags.kurtHelp)return '고동마을 북서쪽 강집의 집에서 이야기를 들어요.';if(!s.flags.slowpokeWell)return '마을 동쪽 야돈우물에서 로켓단을 물리쳐요.';if(!s.flags.hive)return '고동 체육관에서 관장 호일에게 도전해 인섹트배지를 얻어요.';return '인섹트배지를 얻었어요! 고동마을 서쪽 길에서 라이벌도 만나 보세요.';}
