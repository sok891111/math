// Pinned Gold scripts: IlexForest.asm and GoldenrodGym.asm (not HGSS).
export const WHITNEY='GoldenrodGym:GoldenrodGymWhitneyScript';
export const FARFETCHD_ROUTES={1:{next:2},2:{next:3,down:8},3:{next:4,left:2},4:{next:5,up:3},5:{next:6,left:7,up:4,right:4},6:{next:7,right:5},7:{next:8,left:6,down:5},8:{next:9,right:7,up:2,left:2},9:{next:10,right:8,down:8}};
export function thirdObjectVisible(game,o){
 const {map,flags:f}=game.state;
 if(map==='IlexForest'){
  if(/^FarfetchdPosition\d+$/.test(o.script))return Number(o.script.replace('FarfetchdPosition',''))===(f.cutGift?0:f.farfetchdPosition||1);
  if(o.script==='IlexForestCharcoalMasterScript')return !!f.herdedFarfetchd&&!f.cutGift;
  if(o.script==='IlexForestCharcoalApprenticeScript')return !f.cutGift;
 }
 if(map==='CharcoalKiln'&&/Boss|Apprentice|Farfetch/.test(o.script))return !!f.cutGift;
 if(map==='GoldenrodCity'&&o.sprite==='rocket')return o.script==='GoldenrodCityRocketScoutScript';
 if(map==='RadioTower1F'&&o.sprite==='rocket')return false;
 if(map==='Route34'&&(/DayCareMon/.test(o.script)||o.script==='DayCareManScript_Outside'))return false;
 return true;
}
export function thirdStep(game,x,y){
 const s=game.state;
 if(s.map==='IlexForestAzaleaGate'&&game.map.warps.some(w=>w.x===x&&w.y===y&&w.map==='ILEX_FOREST')&&!s.flags.azaleaRival)return {type:'story-blocked',speaker:'숲으로 가는 길',pages:['고동마을 서쪽 길에서 라이벌과의 대결을 마친 뒤 출발해요.']};
 return null;
}
export function thirdGoal(s){const f=s.flags;
 if(!f.azaleaRival)return '고동마을 서쪽 길에서 라이벌을 만나 대결해요.';
 if(!f.herdedFarfetchd)return '서쪽 게이트를 지나 너도밤나무숲에서 도망친 파오리를 주인에게 돌려보내요.';
 if(!f.cutGift)return '파오리 옆 숯 장인에게 말을 걸어 비전머신 풀베기를 받아요.';
 if(!f.ilexCut)return '숲 가운데 작은 나무를 마주 보고 조사해 풀베기로 길을 열어요.';
 if(!f.goldenrod)return '숲 북서쪽 출구 → 34번 도로를 따라 북쪽 금빛시티로 가요.';
 if(!f['trainer:'+WHITNEY])return '금빛시티 북동쪽 체육관에서 꼭두에게 도전해요. 삐삐와 밀탱크가 기다려요!';
 if(!f.whitneyCalmed)return '꼭두가 울고 있어요. 아래로 내려가 체육관 트레이너의 이야기를 들어요.';
 if(!f.plain)return '다시 꼭두에게 말을 걸어 레귤러배지와 기술머신을 받아요.';
 if(!f.squirtBottle)return '레귤러배지를 얻었어요! 금빛시티 꽃집에서 꼬부기물뿌리개를 받아요.';
 return '세 번째 레귤러배지 모험 완료! 금빛시티를 둘러보거나 PC에서 동료를 만나 보세요.';
}
const reply=(speaker,pages)=>({speaker,pages});
function gift(s,flag,item,speaker,pages,again){if(s.flags[flag])return reply(speaker,again);s.flags[flag]=true;s.items??={};s.items[item]=(s.items[item]||0)+1;return reply(speaker,pages);}
function quiz(game,index=0){
 const s=game.state,text=game.map.texts;
 if(index===5){s.flags.radioCard=true;delete s.flags.radioQuizStep;return reply('라디오타워 퀴즈',text.RadioTower1FRadioCardWomanYouWinText||['다섯 문제를 모두 맞혔어요! 라디오카드를 받았다!']);}
 s.flags.radioQuizStep=index;
 return {speaker:'라디오타워 퀴즈',pages:text[`RadioTower1FRadioCardWomanQuestion${index+1}Text`],choices:[['예',true],['아니요',false]].map(([label,answer])=>[label,()=>{if(answer===[true,true,false,true,false][index])return quiz(game,index+1);delete s.flags.radioQuizStep;return reply('라디오타워 퀴즈',text.RadioTower1FRadioCardWomanWrongAnswerText||['아쉬워요! 다시 도전해 보세요.']);}])};
}
export function thirdInteraction(game,o){
 const s=game.state,f=s.flags,id=s.map,script=o.script||'',texts=game.map.texts;
 if(o.cutTree){if(!f.hive||!f.cutGift)return reply('작은 나무',['인섹트배지와 비전머신 풀베기가 필요해요. 숲에서 파오리를 찾아 주인을 도와주세요.']);f.ilexCut=true;return reply('풀베기',['풀베기로 작은 나무를 잘랐다! 북쪽으로 가는 길이 열렸어요.']);}
 if(id==='IlexForest'){
  if(/^FarfetchdPosition\d+$/.test(script)){
   f.farfetchdPosition=10;f.herdedFarfetchd=true;
   return reply('파오리',['꽥! 파오리가 주인 곁으로 날아갔어요! 숯 장인에게 말을 걸어 주세요.']);
  }
  if(script==='IlexForestCharcoalMasterScript')return gift(s,'cutGift','HM01','숯 장인',['파오리를 찾아 주어서 정말 고맙다! 비전머신01 풀베기를 주마.','인섹트배지와 풀베기가 있으면 숲 가운데 작은 나무를 잘라 북쪽으로 갈 수 있단다.'],['풀베기로 작은 나무를 베어 보렴.']);
  if(script==='IlexForestCharcoalApprenticeScript')return reply('숯 장인의 제자',f.herdedFarfetchd?['파오리를 찾아 줘서 고마워! 우리 스승님께 말을 걸어 봐.']:['숯을 만드는 파오리가 도망갔어! 말을 걸면 주인에게 돌아올 거야.','숲 남동쪽에서 파오리를 찾아 서쪽의 주인에게 돌아오게 도와줘.']);
  if(script==='IlexForestHeadbuttGuyScript')return gift(s,'headbuttGift','TM02','박치기 청년',['기술머신02 박치기를 받았다!'],texts.Text_HeadbuttOutro||['나무에도 포켓몬이 살고 있단다.']);
 }
 if(script==='Route34IlexForestGateTeacherScript')return gift(s,'sweetScentGift','TM12','숲 게이트의 선생님',texts.Route34IlexForestGateTeacherText||['기술머신12 달콤한향기를 받았다!'],texts.Route34IlexForestGateTeacher_GotSweetScent||['향기를 따라 포켓몬이 찾아오지.']);
 if(id==='CharcoalKiln'&&/Apprentice/.test(script)&&f.cutGift)return gift(s,'charcoalGift','CHARCOAL','숯 장인의 제자',['파오리를 찾아 줘서 고마워! 목탄 1개를 받았다!'],['숯 장인의 일을 열심히 배우고 있어.']);
 if(id==='GoldenrodGym'){
  if(o.trainer===WHITNEY&&f['trainer:'+WHITNEY]){
   if(!f.whitneyCalmed)return reply('꼭두',texts.WhitneyYouMeanieText||['흐아앙! 너무해!']);
   if(!f.plain){f.plain=true;s.items??={};s.items.TM45=1;return reply('꼭두',['레귤러배지를 받았다! 기술머신45 헤롱헤롱도 받았다!','금빛시티 꽃집에도 들러 봐. 배지를 보여주면 좋은 일이 생길 거야.']);}
   return reply('꼭두',texts.WhitneyGoodCryText||['다음에도 멋진 승부를 하자!']);
  }
  if(script==='TrainerLassBridget'&&f['trainer:'+WHITNEY]&&!f.whitneyCalmed){f.whitneyCalmed=true;return reply('체육관 트레이너',texts.BridgetWhitneyCriesText||['꼭두는 지면 울어 버려. 잠시 지나면 괜찮아질 거야. 다시 말을 걸어 봐.']);}
  if(/Guide/.test(script))return reply('체육관 안내원',['꼭두는 노말 타입 전문가야. 밀탱크는 구르기를 연속으로 쓰고 우유 마시기로 회복하기도 해!','마지막 공격은 수학 문제를 맞혀야 해. 동료의 체력과 기술도 살펴봐.']);
 }
 if(script==='GoldenrodBikeShopClerkScript')return gift(s,'bicycleGift','BICYCLE','자전거 가게 점원',['우리 가게를 널리 알려 주겠니? 자전거를 빌려 주마!','자전거를 받았다! 소중히 간직해 줘.'],['자전거를 소중히 사용해 줘!']);
 if(script==='FlowerShopTeacherScript')return f.plain?gift(s,'squirtBottle','SQUIRTBOTTLE','꽃집 주인',['꼭두에게 레귤러배지를 받았구나! 꼬부기물뿌리개를 받았다!','북쪽 36번 도로의 이상한 나무에 물을 주면 무슨 일이 생길까? 다음 모험에서 확인해 보자.'],['꽃들에게 물을 주면 쑥쑥 자라지.']):reply('꽃집 주인',['금빛 체육관의 꼭두에게 이기고 레귤러배지를 받아 오렴.']);
 if(script==='RadioTower1FRadioCardWomanScript')return f.radioCard?reply('라디오 퀴즈 안내원',['이미 라디오카드를 받았어요!']):quiz(game,Number.isInteger(f.radioQuizStep)?f.radioQuizStep:0);
 if(id==='RadioTower1F'&&script==='RadioTower1FLuckyNumberManScript')return reply('행운의 번호 안내원',['행운의 번호는 트레이너 번호로 선물을 받는 방송이란다. 이 모험에서는 추첨을 진행하지 않아.']);
 if(script==='OfficerKeithScript'&&game.now().getHours()>=4&&game.now().getHours()<18)return reply('경찰관',texts.OfficerKeithDaytimeText);
 if(id==='DayCare')return reply('키우미집',['포켓몬을 맡아 돌봐 주는 키우미집이란다. 이번 모험에서는 동료를 맡기거나 알을 만들 수는 없어. 센터 PC는 이용할 수 있단다.']);
 return null;
}
export function thirdEntry(game){const s=game.state;
 if(s.map==='GoldenrodGym'&&s.flags['trainer:'+WHITNEY]&&!s.flags.whitneyCalmed&&s.x===8&&s.y===5){s.flags.whitneyCalmed=true;return reply('체육관 트레이너',game.map.texts.BridgetWhitneyCriesText||['꼭두는 잠시 지나면 괜찮아질 거야. 다시 말을 걸어 봐!']);}
 return null;
}
