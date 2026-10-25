// Stage 1 Magic English conversations & optional thinking/English games.
export const LESSONS={
 pattern:{question:'A로 시작하는 세 가지 마법 단어! "Airplane(비행기), Apple(사과), _____(물어보다)" 빈칸에 들어갈 말은?',choices:['Ask (물어보다)','Sub (뒤섞인 글자)'],correct:0,hint:'안내 데스크에서 "Can I ask?"라고 말할 때 쓰는 A 단어야!',success:'딩동! Correct! Ask는 "물어보다"라는 뜻이야!'},
 mirror:{question:'미스터 미스스펠이 출구 표지판 "EXIT"의 글자를 거꾸로 뒤집어 "TIXE"로 바꿔 놓았어! 올바른 출구 표지판은?',choices:['EXIT (출구)','TIXE (혼란 글자)'],correct:0,hint:'첫 글자 E로 시작하는 올바른 출구 표지판을 골라 봐.',success:'맞아! EXIT가 바로 출구야! 미스스펠의 장난에 속지 않았구나!'},
 count:{question:'컨베이어 벨트에서 넘어진 길동에게 공항 직원이 "Are you okay?"라고 물었어. 무슨 뜻일까?',choices:['괜찮으세요?','거기 서라!'],correct:0,hint:'걱정스러운 표정으로 다친 곳이 없는지 묻는 친절한 인사야.',success:'그래! "Are you okay?"는 "괜찮으세요?"라는 따뜻한 말이야!'},
 path:{question:'공항 안내 데스크에서 정중하게 "실례합니다. 물어봐도 될까요?"라고 말할 때 쓰는 1화 핵심 문장은?',choices:['Excuse me. Can I ask?','No! Not me!'],correct:0,hint:'에이미와 링고가 알려 준 정중한 질문 시작 표현을 떠올려 봐.',success:'완벽해! "Excuse me. Can I ask?"라고 말하면 누구든 친절히 도와줄 거야!'},
 classify:{question:'대문자 "A"의 단짝 소문자 친구는 누구일까?',choices:['소문자 a','소문자 b'],correct:0,hint:'링고의 홀로그램 카드에 적힌 "A a"를 떠올려 봐.',success:'딩동! 대문자 A와 소문자 a는 같은 소리를 내는 단짝이야!'},
 rotate:{question:'당황한 길동에게 다가와 "What happened?"라고 물었어. 무슨 뜻일까?',choices:['무슨 일 있나요?','사과 주세요!'],correct:0,hint:'놀란 사람에게 어떤 일이 일어났는지 물어보는 표현이야.',success:'맞았어! "What happened?"는 "무슨 일 있나요?"라는 뜻이야!'},
 balance:{question:'길동과 활빈이 가장 좋아하는 빨갛고 달콤한 과일! "A is for _____!"에 들어갈 말은?',choices:['Apple (사과)','Pots (뒤섞인 글자)'],correct:0,hint:'능금이라고도 부르는 빨간 과일이야.',success:'얌미! "A is for Apple!" 사과를 먹으면 용기가 솟아나지!'},
 logic:{question:'길동이 "Excuse me. Can I ask?"라고 말하자 안내 직원이 밝게 웃으며 한 대답은?',choices:['Sure! How can I help you?','Um...? Maybe...'],correct:0,hint:'"물론이죠! 어떻게 도와드릴까요?"라는 친절한 대답을 찾아봐.',success:'정답이야! "Sure! How can I help you?" 덕분에 활빈을 만날 수 있었어!'},
};
export function npcDialogue(map,object){
 const sprite=object.sprite;
 const places={
  NewBarkTown:{teacher:['공항 안내원','길동아, 넘어졌을 때 들은 아 유 오케이는 공격 주문이 아니야.','괜찮으세요라고 걱정해 주는 친절한 생활 영어란다.','count'],fisher:['여행자 아저씨','하늘을 나는 거대한 강철 새는 영어로 에어플레인이라고 부르지!','대문자 A와 소문자 a로 시작하는 첫 번째 핵심 단어야.','pattern'],rival:['미스터 미스스펠','히히! 내가 공항 출구 표지판 글자를 거꾸로 뒤섞어 놓았지!','틀리면 창피하니까 아무에게도 물어보지 말라고!','mirror']},
  ElmsLab:{scientist:['링고','딩동! A의 세 가지 마법 단어는 에어플레인, 애플, 애스크야!','공격할 때 영어 문제를 맞히면 강력한 마법이 나간단다.','classify'],officer:['공항 보안관','안내 데스크로 갈 때는 정중한 질문 주문부터 기억해 보렴.','엑스큐즈 미, 캔 아이 애스크라고 또렷하게 외쳐 보자.','path']},
  PlayersNeighborsHouse:{cooltrainer_f:['친절한 승무원','누군가 놀랐을 때는 왓 해픈드, 무슨 일 있나요라고 물어봐요.','상대방의 마음을 먼저 살피는 따뜻한 영어 표현이에요.','rotate']},
  ElmsHouse:{teacher:['에이미의 노트','영어는 완벽하지 않아도 괜찮아! 소리를 내어 물어보는 용기가 중요해.','틀려도 다시 해 보면 돼! 트라이 어게인!','path'],bug_catcher:['알파벳 수집가','나는 대문자 A와 소문자 a 카드를 모으고 있어!','애플과 에어플레인 모두 A로 시작하는 단짝 단어지.','balance']},
  CherrygrovePokecenter1F:{fisher:['쉬는 여행자','미스터 미스스펠의 글자 장난 때문에 길을 잃을 뻔했어.','잠깐 쉬면서 에이미에게 배운 A 단어들을 복습해 보자.','count'],gentleman:['표지판 수리공','미스터 미스스펠이 출구 표지판을 자꾸 뒤집어 놓는군!','원래 글자 순서를 차근차근 되짚어 보면 금방 고칠 수 있어.','mirror'],teacher:['발음 코치','입안에서 작게 웅얼거리면 상대방이 알아듣기 어려워요.','엑스큐즈 미, 캔 아이 애스크처럼 끝까지 또렷하게 말해 봐요!','logic']},
  CherrygroveMart:{cooltrainer_m:['단어 카드 수집가','나는 A로 시작하는 마법영어 카드만 모으고 있어!','에어플레인, 애플, 애스크 세 장을 모두 모아 봤니?','classify'],youngster:['사과 좋아하는 아이','활빈도 빨갛고 달콤한 애플(사과)을 정말 좋아한대!','사과 향기를 따라가면 활빈이 있는 곳을 찾을 수 있을 거야.','balance']},
  CherrygroveGymSpeechHouse:{pokefan_m:['공항 역무원','모르면 묻고, 의심하기 전에 살펴라! 참 멋진 말이지?','미국 공항에서도 그 마음가짐이면 어디든 갈 수 있단다.','logic'],bug_catcher:['모형 비행기 소년','이 거대한 비행기는 영어로 에어플레인이라고 해!','A로 시작하는 멋진 단어지! 소리 내어 말해 볼까?','pattern']},
  GuideGentsHouse:{gramps:['공항 원로 안내원','국제선 중앙 로비에서 북쪽으로 올라가면 분실물 보관소 가는 길이 나온단다.','그 길의 북동쪽 안내 데스크에서 활빈을 찾아보렴!','path']},
  CherrygroveEvolutionSpeechHouse:{lass:['영어 스터디 학생','오해 삼총사 노노는 무조건 노라고만 외쳐서 대화를 막아 버려.','부끄러워하지 말고 캔 아이 애스크라고 물어보면 이길 수 있어!','classify'],youngster:['회화 연습생','질문을 받은 안내 직원은 하우 캔 아이 헬프 유라고 대답해 주셨어!','어떻게 도와드릴까요라는 뜻의 반가운 표현이야.','logic']},
 };
 let row=places[map]?.[sprite];
 if(!row&&map==='Route29')row=sprite==='youngster'?['길 찾기 소년','공항 연결 통로 표지판이 미스스펠 때문에 엉망이 되었어!','정중하게 길을 물어보는 주문을 연습해 볼까?','path']:sprite==='fisher'?['과일 가게 아저씨','능금은 영어로 애플이라고 부른단다!','A로 시작하는 달콤한 사과 단어를 기억해 두렴.','balance']:sprite==='cooltrainer_m'?['탐험 선배','통로에서 만난 마법카드나 오해 삼총사가 궁금하지?','가방에서 마법카드 볼을 던지고 영어 문제를 풀면 동료가 돼!','pattern']:['공항 여행객','길동아, 서쪽으로 가면 국제선 중앙 로비야!','천천히 A 알파벳 단어들을 떠올리며 걸어가 보자.','pattern'];
 if(!row&&map==='CherrygroveCity')row=sprite==='youngster'?['로비 소년','방금 보라색 모자를 쓴 수상한 마법사가 동쪽 길로 갔어!','글자를 뒤섞는 미스터 미스스펠을 조심해!','mirror']:sprite==='fisher'?['출국장 여행객','비행기(에어플레인)를 타려면 안내판을 잘 읽어야 해.','모르는 표지판이 나오면 주저하지 말고 물어보렴!','pattern']:['중앙 로비 안내원','국제선 중앙 로비에 온 걸 환영해, 길동아!','북쪽 분실물 보관소 가는 길로 올라가면 안내 데스크가 있단다.','balance'];
 row??=['공항 친구','새로운 영어 단어 하나가 닫힌 문을 여는 열쇠가 돼!','오늘 배운 A 표현을 같이 복습해 볼까?','count'];
 return {speaker:row[0],pages:[row[1],row[2]],lesson:row[3]};
}
export function signDialogue(map,script){
 if(script.includes('PlayersHouse'))return ['골드의 집 · 홍길동 입국 게이트','시간 균열이 열렸던 공항 입국 라운지예요.'];
 if(script.includes('ElmsLab'))return ['때르릉호 임시 연구실','에이미와 링고와 함께 알파벳 조각으로 때르릉호를 고쳐요!'];
 if(script.includes('Pokecenter'))return ['링고 에너지 충전소','지친 동료들이 쉬고 에너지를 되찾는 곳이에요.'];
 if(script.includes('Mart'))return ['공항 영어 북스토어','모험에 필요한 Apple 용기물약과 마법카드 볼을 골라요.'];
 return map==='Route29'?['공항 연결 통로 (A 구역)','서쪽으로 가면 국제선 중앙 로비예요. A 마법카드(Airplane, Apple, Ask)를 만나 봐요!']:['마법영어 Stage 1 안내판','모르면 묻고, 의심하기 전에 살펴라! "Excuse me. Can I ask?"'];
}
