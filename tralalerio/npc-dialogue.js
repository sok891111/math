// Short, optional thinking games for a seven-year-old. Familiar characters keep
// their navigation roles; their conversations invite noticing and trying.
export const LESSONS={
 pattern:{question:'풀, 불, 풀, 불… 다음에는 어떤 조각이 올까?',choices:['풀','불'],correct:0,hint:'풀과 불이 짝꿍이야. 한 묶음을 다시 읽어 봐.',success:'맞아, 풀이야! 반복되는 짝꿍을 찾아냈네.'},
 mirror:{question:'거울 가까이에 빛이 켜졌어. 반대편 빛은 어디에 켤까?',choices:['거울 가까이에','거울 멀리'],correct:0,hint:'거울에서 같은 거리의 칸끼리 짝을 지어 봐.',success:'그래! 거울 가까운 곳끼리 마주 보지. 방패의 빛도 그렇게 찾아봐.'},
 count:{question:'블록 2개와 1개를 모았어. 모두 몇 개일까?',choices:['3개','2개'],correct:0,hint:'블록을 하나씩 짚어 세어 보자. 하나, 둘, 셋!',success:'세 개! 하나씩 세니까 빠뜨리지 않았어.'},
 path:{question:'보석이 있는 길과 없는 길이 있어. 보석을 모으려면?',choices:['보석이 있는 길','아무 길이나'],correct:0,hint:'출발하기 전에 보석이 어디 있는지 손가락으로 짚어 봐.',success:'좋아! 목표를 먼저 보고 길을 고르면 도움이 돼.'},
 classify:{question:'초록 조각만 모으자! 파란 조각도 넣어야 할까?',choices:['초록 조각만 넣어요','파란 조각도 넣어요'],correct:0,hint:'지금 약속은 “초록”이야. 색을 하나씩 비교해 봐.',success:'약속을 잘 찾았네! 모양이 달라도 초록이면 같은 팀이야.'},
 rotate:{question:'네모 그림을 돌리면, 블록의 개수도 늘어날까?',choices:['개수는 그대로예요','더 많아져요'],correct:0,hint:'돌리기 전과 뒤의 블록을 하나씩 세어 봐.',success:'맞아! 자리는 바뀌어도 개수는 같아. 그림 돌려보기를 눌러 확인해 봐.'},
 balance:{question:'보석 하나와 추 3개가 똑같이 무거워. 보석은 추 몇 개와 같을까?',choices:['3개','1개'],correct:0,hint:'저울이 나란하면 양쪽 무게가 같다는 뜻이야.',success:'그래! 보석 하나가 추 세 개의 힘과 같아.'},
 logic:{question:'1, 2, 3 중에서 1과 3을 썼어. 남은 수는?',choices:['2','3'],correct:0,hint:'하나씩 손가락을 접어 보자. 아직 안 쓴 수를 찾아봐.',success:'2를 찾았네! 이미 쓴 것부터 지워 보면 빈자리가 보여.'},
};
export function npcDialogue(map,object){
 const sprite=object.sprite;
 const places={
  NewBarkTown:{teacher:['규칙 선생님','나뭇잎에도 반복되는 무늬가 숨어 있어.','같은 묶음을 찾으면 다음 공격도 알 수 있단다.','pattern'],fisher:['물가 탐험가','물고기 대신 반짝이는 생각을 찾고 있어!','문제가 나오면 아는 것부터 하나씩 살펴봐.','count'],rival:['빨간 머리 친구','나도 첫 문제에서 틀렸어. 그래서 다시 놓아 봤지.','골드, 같이 천천히 해 보자. 힌트도 좋은 도구야.','logic']},
  ElmsLab:{scientist:['생각 연구원','세 친구는 서로 다른 힘을 가졌어.','정답 조각을 모으면 네가 고른 기술이 나간단다.','classify'],officer:['길 안내원','길을 고를 때는 도착할 곳부터 찾아봐.','보석을 지나가는 길을 손가락으로 이어 보자.','path']},
  PlayersNeighborsHouse:{cooltrainer_f:['이웃집 친구','내가 만든 무늬를 보여 줄게!','다음 조각을 먼저 생각해 보고 골라 봐.','pattern']},
  ElmsHouse:{teacher:['그림 놀이 선생님','그림을 돌리면 어디가 위쪽이 될까?','작은 블록 하나를 따라가 보면 알 수 있어.','rotate'],bug_catcher:['블록 친구','나는 블록 탑을 만들고 있어.','탑을 하나씩 세고, 마지막에 모두 모아 보자.','count']},
  CherrygrovePokecenter1F:{fisher:['쉬는 탐험가','나도 어려운 문제를 만나 잠깐 쉬고 있어.','쉬고 다시 보면 새로운 방법이 떠오르기도 해.','count'],gentleman:['거울 놀이 할아버지','왼쪽 빛을 오른쪽에 비춰 볼까?','거울에서 같은 거리의 칸끼리 짝을 지어 봐.','mirror'],teacher:['생각 친구','오늘은 답보다 찾는 방법이 궁금해!','어떤 조각부터 살펴봤는지 말해 줄래?','logic']},
  CherrygroveMart:{cooltrainer_m:['조각 수집가','나는 초록 조각만 모으고 있어.','색, 모양, 크기 중 어떤 약속인지 먼저 읽어 봐.','classify'],youngster:['보석 친구','보석의 무게가 궁금해서 저울에 올려 봤어.','양쪽이 같아지는 순간을 찾아보자!','balance']},
  CherrygroveGymSpeechHouse:{pokefan_m:['생각 놀이 아저씨','몸이 아니라 생각도 연습할 수 있어.','틀린 자리를 하나 찾으면, 벌써 새 발견이야.','logic'],bug_catcher:['탑 만들기 친구','같은 블록으로 다른 모양을 만들어 봤어.','모양이 달라져도 개수는 같을까?','rotate']},
  GuideGentsHouse:{gramps:['안내 할아버지','길을 먼저 눈으로 따라가 보고 출발해 보렴.','막힌 곳을 만나면 다른 길도 찾아볼 수 있단다.','path']},
  CherrygroveEvolutionSpeechHouse:{lass:['변신 놀이 친구','초록이 파랑으로 바뀌는 마법을 찾고 있어!','예시 두 개를 비교하면 같은 약속이 보일 거야.','classify'],youngster:['숫자 친구','숫자 격자의 빈자리에 숨은 수를 찾아봐.','가로줄을 먼저, 그다음 세로줄을 확인해 봐.','logic']},
 };
 let row=places[map]?.[sprite];
 if(!row&&map==='Route29')row=sprite==='youngster'?['길 찾기 친구','보석은 어디에 숨어 있을까?','출발과 도착, 보석을 차례로 찾아보자.','path']:sprite==='fisher'?['돌 세기 아저씨','돌멩이를 한 개씩 놓으면 세기 쉬워.','많아 보이면 작은 묶음으로 나눠 봐.','count']:sprite==='cooltrainer_m'?['탐험 선배','풀숲에서 만난 친구의 기술이 궁금하지?','문제를 풀고 볼을 던지면 네 동료가 될 수도 있어!','pattern']:['생각 탐험가','골드, 길에서도 작은 규칙을 찾아볼까?','서두르지 말고 조각을 하나씩 비교해 봐.','pattern'];
 if(!row&&map==='CherrygroveCity')row=sprite==='youngster'?['새싹 탐험가','나는 친구와 다른 방법으로 풀었어.','같은 답으로 가는 길이 여럿일 수도 있구나!','count']:sprite==='fisher'?['물가 친구','물결은 커졌다 작아졌다 반복돼.','무늬에도 이런 약속이 숨어 있을까?','pattern']:['마을의 생각 친구','무궁시티에 온 걸 환영해, 골드!','궁금한 것을 하나 골라 같이 살펴보자.','balance'];
 row??=['생각 친구','작은 조각에도 새로운 발견이 숨어 있어.','어떤 방법으로 풀었는지 같이 이야기해 보자.','count'];
 return {speaker:row[0],pages:[row[1],row[2]],lesson:row[3]};
}
export function signDialogue(map,script){
 if(script.includes('PlayersHouse'))return ['골드의 집','모험하기 전에는 엄마에게 인사해요.'];
 if(script.includes('ElmsLab'))return ['생각 탐험 연구소','첫 동료를 고르고, 생각의 힘을 모아 봐요.'];
 if(script.includes('Pokecenter'))return ['포켓몬센터','지친 친구가 쉬고 힘을 되찾는 곳이에요.'];
 if(script.includes('Mart'))return ['프렌들리숍','친구를 도울 물건을 골라요. 가격도 살펴봐요.'];
 return map==='Route29'?['29번 도로 · 생각 산책길','서쪽으로 가면 무궁시티예요. 풀숲에서는 초급 문제로 모험해요.']:['골드의 생각 탐험','작은 발견 하나씩! 궁금한 곳에 말을 걸어 봐요.'];
}
