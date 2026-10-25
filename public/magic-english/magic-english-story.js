// Magic English Stage 1 Story, Map Layout, Word Discoveries & NPC Conditions
// Based on STAGE-1-PLAN.md and /Users/gimseongjin/english_book/book_1/마법영어_1화_스토리.md

export const STAGE1_REWARD_ID = 'stage-1-first-clear';

export const STAGE1_STAGES = [
  'joseon_intro',       // 1. 짧은 조선 도입: 길동의 의로운 마음과 시간 균열 소개
  'baggage_separation', // 2. 수하물 벨트에서 활빈과 헤어지는 장면
  'explore_misspell',   // 3. 공항을 돌아보고 미스스펠이 안내판을 뒤섞는 사건 목격 → 에이미·링고와 만남
  'discover_words',     // 4. 비행기 표지·사과·안내 데스크를 조사하며 Airplane·Apple·Ask 발견
  'practice_with_amy',  // 5. 에이미에게 표현을 듣고 짧게 말하기 연습
  'speak_to_staff',     // 6. 안내 직원에게 “Excuse me. Can I ask?” 말하기
  'reunite_hwalbin',    // 7. 분실물 보관소에서 딩고(활빈) 구출 → 친구로서 따라다니기 시작!
  'battle_misspell',    // 8. 마지막 퀘스트: 미스터 미스스펠과 3단어 Speak 대결 (글자 마법 해제 격파 후 황금 A 조각 획득!)
  'stage1_complete',    // 9. 내 블록 세계 건축 & 모험으로 돌아와 BUS → SUB 다음 화 예고
];

export const STAGE1_WORDS = {
  airplane: {
    id: 'airplane',
    word: 'Airplane',
    phonetic: '[ˈeər.pleɪn]',
    korean: '비행기',
    alphabet: 'A a',
    letterName: '에이 (/eɪ/)',
    wordSound: '에어 (/ɛər/) — 첫 글자 A가 뒤에 오는 글자들과 만나 "에어" 소리를 내요',
    soundCompare: '글자 이름은 「에이(A)」이지만, Airplane 단어 속에서는 「에어플레인」으로 소리 나요!',
    sentence: 'A is for Airplane.',
    sentenceKo: 'A는 비행기(Airplane)의 A야.',
    gildongQuote: 'A... Airplane... 하늘을 나는 거대한 쇠가마 말이냐!',
    image: 'assets/battle/me_airplane-front.png',
    comicPage: 'assets/stage1/page10.jpg',
    objectLabel: '활주로 전망 창문 (비행기 표지)',
  },
  apple: {
    id: 'apple',
    word: 'Apple',
    phonetic: '[ˈæp.əl]',
    korean: '사과',
    alphabet: 'A a',
    letterName: '에이 (/eɪ/)',
    wordSound: '애 (/æ/) — 입을 옆으로 넓게 벌려 짧고 또렷하게 "애" 소리를 내요',
    soundCompare: '글자 이름은 「에이(A)」이지만, Apple 단어 속 첫소리는 「애(/æ/)」여서 「애플」이라고 읽어요!',
    sentence: 'A is for Apple.',
    sentenceKo: 'A는 사과(Apple)의 A야.',
    gildongQuote: '오호! 활빈이 가장 좋아하는 달콤한 능금(사과) 같은 것이로구나!',
    image: 'assets/battle/me_apple-front.png',
    comicPage: 'assets/stage1/page10.jpg',
    objectLabel: '공항 카페 과일 바구니 (사과)',
  },
  ask: {
    id: 'ask',
    word: 'Ask',
    phonetic: '[æsk]',
    korean: '묻다 · 질문하다',
    alphabet: 'A a',
    letterName: '에이 (/eɪ/)',
    wordSound: '애 (/æ/) — 입을 벌려 "애스크"라고 소리 내며, 모를 때 용기 내어 묻는 말이에요',
    soundCompare: '글자 이름은 「에이(A)」이지만, Ask 단어 속 첫소리는 「애(/æ/)」여서 「애스크」라고 읽어요!',
    sentence: 'Excuse me. Can I ask?',
    sentenceKo: '실례합니다. 물어봐도 될까요?',
    gildongQuote: '모를 때는 묻는 것! 조선에서 내가 외쳤던 "모르면 묻고 살펴라"와 똑같구나!',
    image: 'assets/battle/me_ask-front.png',
    comicPage: 'assets/stage1/page11.jpg',
    objectLabel: '안내 데스크 질문 표지판 (Ask)',
  },
};

export const STAGE1_CHECKLIST = [
  {
    id: 'step1',
    title: '1. 조선 장터와 시간 균열',
    subtitle: '억울한 아이를 구하고 시간 균열로 미국 공항에 도착해요.',
    isDone: s => s.stage !== 'joseon_intro',
  },
  {
    id: 'step2',
    title: '2. 수하물 벨트와 파트너 이별',
    subtitle: '컨베이어 벨트에 실려 간 파트너 딩고(활빈)를 찾으러 출발해요.',
    isDone: s => !['joseon_intro', 'baggage_separation'].includes(s.stage),
  },
  {
    id: 'step3',
    title: '3. 뒤섞인 표지판(TIXE)과 에이미·링고',
    subtitle: '미스스펠의 장난을 목격하고 에이미·링고를 만나요.',
    isDone: s => !['joseon_intro', 'baggage_separation', 'explore_misspell'].includes(s.stage),
  },
  {
    id: 'step4',
    title: '4. 단서 3종 (Airplane · Apple · Ask) 찾기',
    subtitle: '비행기 창문·사과 바구니·안내 데스크를 조사해 Speak로 말해요.',
    isDone: s => !!(s.discoveries?.airplane && s.discoveries?.apple && s.discoveries?.ask),
  },
  {
    id: 'step5',
    title: '5. 에이미와 질문 대화 연습',
    subtitle: '“Excuse me. Can I ask?”를 듣고 Speak로 연습해요.',
    isDone: s => !!s.practice?.completed,
  },
  {
    id: 'step6',
    title: '6. 안내 직원과 실전 대화하기',
    subtitle: '안내 직원에게 영어로 물어 분실물 보관소 문을 열어요.',
    isDone: s => !!s.staffSpeech?.completed,
  },
  {
    id: 'step7',
    title: '7. 파트너 딩고(활빈) 구출 및 동행',
    subtitle: '분실물 보관소에서 딩고(활빈)를 구하면 내 뒤를 졸졸 따라다녀요!',
    isDone: s => !!(s.rewardReceipts?.['hwalbin-rescued'] || s.rewardReceipts?.[STAGE1_REWARD_ID]),
  },
  {
    id: 'step8',
    title: '8. 보스 미스터 미스스펠 격파 & A 배지 획득',
    subtitle: '오늘 찾은 세 단어로 미스스펠의 글자 마법을 풀고 출구를 열어요!',
    isDone: s => !!s.rewardReceipts?.[STAGE1_REWARD_ID],
  },
  {
    id: 'step9',
    title: '9. 알파벳 도감 확인 & 블록 세계 건축',
    subtitle: '획득한 황금 A 조각와 알파벳 도감을 확인하고 블록 세계를 꾸며요.',
    isDone: s => !!s.busHookSeen || (s.blockWorld?.blocks?.length || 0) > 0,
  },
];

export function currentStageGoal(state) {
  switch (state.stage) {
    case 'joseon_intro':
      return '조선 장터에서 아이의 누명을 풀고 푸른 시간 균열(A)을 조사하세요.';
    case 'baggage_separation':
      return '수하물 벨트에서 일어나 주변을 살펴보고 이동을 시작하세요.';
    case 'explore_misspell':
      return '공항 북쪽의 초록색 출구 표지판(EXIT) 쪽으로 걸어가 조사해 보세요.';
    case 'discover_words': {
      const found = ['airplane', 'apple', 'ask'].filter(k => state.discoveries?.[k]).length;
      const missing = [];
      if (!state.discoveries?.airplane) missing.push('비행기 창문(북서쪽)');
      if (!state.discoveries?.apple) missing.push('사과 바구니(중앙 카페)');
      if (!state.discoveries?.ask) missing.push('안내 데스크 표지(동쪽)');
      return `공항의 A 단서 3개를 모두 찾아 Speak로 말하세요 (${found}/3 완료 · 남은 곳: ${missing.join(', ')})`;
    }
    case 'practice_with_amy':
      return '공항 중앙의 에이미에게 말을 걸어 “Excuse me. Can I ask?” 말하기를 연습하세요.';
    case 'speak_to_staff':
      return '동쪽 안내 데스크 직원에게 말을 걸어 “Excuse me. Can I ask?”라고 물어보세요.';
    case 'reunite_hwalbin':
      return '열린 분실물 보관소(오른쪽 위)로 들어가 파트너 딩고(활빈)를 구출하세요!';
    case 'battle_misspell':
      return '마지막 퀘스트! 뒤를 따라다니는 파트너 딩고(활빈)와 함께 북쪽 출구 앞의 악당 「미스터 미스스펠」에게 말을 걸어 세 단어로 출구의 마법을 풀어요!';
    case 'stage1_complete':
      if (!state.busHookSeen) {
        return '축하합니다! 황금 A 조각를 획득했어요! 북쪽의 열린 출구로 가서 Stage 2 버스 정류장 모험을 시작하세요.';
      }
      return 'Stage 1 완료! 북쪽의 열린 문에서 Stage 2로 이동할 수 있어요.';
    default:
      return '안내 직원에게 활빈을 찾을 방법을 물어보세요.';
  }
}

// Map 1: JoseonMarket (12 x 10 tiles) — Short Interactive Prologue
export const JOSEON_MARKET_MAP = {
  id: 'JoseonMarket',
  name: '조선 장터 (시간 균열 발생!)',
  width: 12,
  height: 10,
  // Collision legend:
  // 'WALL' = impassable roof/stall/fence, 'FLOOR' = walkable dirt/stone road
  collision: [
    ['WALL','WALL','WALL','WALL','WALL','WALL','WALL','WALL','WALL','WALL','WALL','WALL'],
    ['WALL','WALL','WALL','WALL','WALL','FLOOR','FLOOR','WALL','WALL','WALL','WALL','WALL'],
    ['WALL','WALL','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','WALL','WALL','WALL'],
    ['WALL','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','WALL','WALL'],
    ['WALL','FLOOR','WALL','WALL','FLOOR','FLOOR','FLOOR','FLOOR','WALL','WALL','FLOOR','WALL'],
    ['WALL','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','WALL'],
    ['WALL','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','WALL'],
    ['WALL','FLOOR','WALL','WALL','FLOOR','FLOOR','FLOOR','FLOOR','WALL','WALL','FLOOR','WALL'],
    ['WALL','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','FLOOR','WALL'],
    ['WALL','WALL','WALL','WALL','WALL','WALL','WALL','WALL','WALL','WALL','WALL','WALL'],
  ],
  getObjects(state) {
    return [
      {
        id: 'time_rift',
        kind: 'rift',
        x: 6,
        y: 2,
        sprite: null, // drawn as glowing blue 'A' rift on canvas
        direction: 'down',
        badge: 'A 균열',
        label: '푸른 시간 균열 (A 좌표)',
      },
      {
        id: 'joseon_kid',
        kind: 'npc',
        x: 5,
        y: 5,
        sprite: 'me_kid',
        direction: 'right',
        badge: '아이',
        label: '심부름꾼 아이',
      },
      {
        id: 'joseon_merchant',
        kind: 'npc',
        x: 4,
        y: 5,
        sprite: 'me_merchant',
        direction: 'right',
        badge: '장사꾼',
        label: '장터 상인',
      },
      {
        id: 'joseon_hwalbin',
        kind: 'npc',
        x: 7,
        y: 6,
        sprite: 'me_hwalbin',
        direction: 'left',
        badge: '활빈',
        label: '단짝 아기 용 활빈',
      },
    ];
  },
};

// Map 2: AirportHall (20 x 16 tiles) — Unified US International Airport Map
// Includes:
// - Baggage Belt (west: x=2..4, y=7..11)
// - Airplane Window (northwest: x=4, y=2)
// - Exit / TIXE Sign & Bus Stop (north center: x=10, y=1)
// - Apple Basket Table (center: x=9, y=10)
// - Amy & Ringo (center: x=8, y=6 and x=10, y=6)
// - Information Desk & Ask Sign (east: x=13, y=6; desk staff at x=15, y=6 behind counter y=7)
// - Lost & Found Room with Hwalbin (northeast: x=16..18, y=2..4, doorway at x=17, y=5)
export function createAirportHallMap() {
  const W = 20;
  const H = 16;
  const grid = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => {
      if (x === 0 || x === W - 1 || y === 0 || y === H - 1) return 'WALL';
      // North wall & windows (row 1)
      if (y === 1 && x !== 10) return 'WALL';
      // Baggage conveyor belt machine (x=2..3, y=7..11)
      if ((x === 2 || x === 3) && y >= 7 && y <= 11) return 'WALL';
      // Airport cafe Apple table (x=9, y=10)
      if (x === 9 && y === 10) return 'WALL';
      // Information Desk counter (x=14..16, y=7) and Ask sign stand (x=13, y=7)
      if (y === 7 && x >= 13 && x <= 16) return 'COUNTER';
      // Lost & Found glass partition wall (x=15..18, y=5, except doorway at x=17, y=5)
      if (y === 5 && x >= 15 && x <= 18 && x !== 17) return 'WALL';
      if (x === 15 && y >= 2 && y <= 5) return 'WALL';
      return 'FLOOR';
    })
  );

  return {
    id: 'AirportHall',
    name: '미국 국제공항 (입국장 · 안내 로비)',
    width: W,
    height: H,
    collision: grid,
    isPassable(state, x, y) {
      if (x < 0 || y < 0 || x >= W || y >= H) return false;
      const tile = grid[y][x];
      if (tile === 'WALL' || tile === 'COUNTER') return false;
      // Doorway to Lost & Found (x=17, y=5) is locked until staffSpeech.completed is true
      if (x === 17 && y === 5 && !state.staffSpeech?.completed) {
        return false;
      }
      for (const obj of this.getObjects(state)) {
        if (obj.solid !== false && obj.x === x && obj.y === y) return false;
      }
      return true;
    },
    getObjects(state) {
      const objs = [];

      // 1. Investigation Target: Airplane Window (x=4, y=1, player stands at x=4, y=2 facing up)
      objs.push({
        id: 'target_airplane',
        kind: 'investigate',
        wordId: 'airplane',
        x: 4,
        y: 1,
        sprite: null,
        badge: state.discoveries?.airplane ? '✓ Airplane' : '★ 조사: Airplane',
        label: '활주로 전망 창문 (Airplane)',
      });

      // 2. Investigation Target: Exit / TIXE Sign (x=10, y=1)
      const isScrambled = !['joseon_intro', 'baggage_separation', 'explore_misspell', 'stage1_complete'].includes(state.stage) && !state.rewardReceipts?.[STAGE1_REWARD_ID];
      objs.push({
        id: 'target_exit_sign',
        kind: 'sign',
        x: 10,
        y: 1,
        sprite: null,
        badge: state.stage === 'explore_misspell'
          ? '❗ 조사: EXIT'
          : state.stage === 'stage1_complete' && !state.busHookSeen
          ? '🚪 열린 문 · Stage 2'
          : isScrambled
          ? 'TIXE (뒤섞임)'
          : 'EXIT (출구)',
        label: '공항 출구 & 버스 정류장 안내판',
      });

      // 3. Investigation Target: Apple Basket Table (x=9, y=10)
      objs.push({
        id: 'target_apple',
        kind: 'investigate',
        wordId: 'apple',
        x: 9,
        y: 10,
        sprite: null,
        badge: state.discoveries?.apple ? '✓ Apple' : '★ 조사: Apple',
        label: '공항 카페 사과 바구니 (Apple)',
      });

      // 4. Investigation Target: Ask Stand at Info Desk (x=13, y=7)
      objs.push({
        id: 'target_ask',
        kind: 'investigate',
        wordId: 'ask',
        x: 13,
        y: 7,
        sprite: null,
        badge: state.discoveries?.ask ? '✓ Ask' : '★ 조사: Ask',
        label: '안내 데스크 질문 표지판 (Ask)',
      });

      // 5. Airport Traveler near Baggage Belt (x=5, y=12)
      objs.push({
        id: 'npc_traveler',
        kind: 'npc',
        x: 5,
        y: 12,
        sprite: 'me_traveler',
        direction: 'up',
        badge: '여행객',
        label: '친절한 미국 여행객',
      });

      // 5b. Additional Airport NPCs for diverse natural English conversations
      objs.push({
        id: 'npc_pilot',
        kind: 'npc',
        x: 2,
        y: 3,
        sprite: 'me_staff',
        direction: 'down',
        badge: '✈️ 기장님',
        label: '비행기 파일럿 기장님',
      });
      objs.push({
        id: 'npc_guard',
        kind: 'npc',
        x: 6,
        y: 4,
        sprite: 'me_merchant',
        direction: 'down',
        badge: '👮 심사관',
        label: '공항 입국 심사관',
      });
      objs.push({
        id: 'npc_cafe',
        kind: 'npc',
        x: 11,
        y: 10,
        sprite: 'me_amy',
        direction: 'left',
        badge: '🍎 카페 점원',
        label: '공항 카페 점원',
      });
      objs.push({
        id: 'npc_kid_traveler',
        kind: 'npc',
        x: 14,
        y: 12,
        sprite: 'me_kid',
        direction: 'up',
        badge: '🎈 꼬마 친구',
        label: '미국 꼬마 여행객',
      });

      // 6. Mr. Misspell (always guarding the scrambled EXIT/TIXE sign at x=11, y=2 until defeated in the final Boss Battle)
      if (!state.rewardReceipts?.[STAGE1_REWARD_ID]) {
        objs.push({
          id: 'npc_misspell',
          kind: 'npc',
          x: 11,
          y: 2,
          sprite: 'me_misspell',
          direction: 'down',
          badge: state.stage === 'battle_misspell' ? '😈 미스스펠 (보스 대결!)' : '😈 미스스펠',
          label: '악당 미스터 미스스펠',
        });
      }

      // 7. Amy & Ringo (appear once explore_misspell is completed)
      if (!['joseon_intro', 'baggage_separation', 'explore_misspell'].includes(state.stage)) {
        objs.push({
          id: 'npc_amy',
          kind: 'npc',
          x: 8,
          y: 6,
          sprite: 'me_amy',
          direction: 'down',
          badge: state.stage === 'practice_with_amy' ? '💬 에이미 (연습!)' : '에이미',
          label: '영어 안내 친구 에이미',
        });
        objs.push({
          id: 'npc_ringo',
          kind: 'npc',
          x: 10,
          y: 6,
          sprite: 'me_ringo',
          direction: 'down',
          badge: '링고 (AI)',
          label: '알파벳 로봇 링고',
        });
      }

      // 8. Information Desk Staff (behind counter at x=15, y=6; player can talk from x=15, y=8 across counter y=7, or directly)
      objs.push({
        id: 'npc_staff',
        kind: 'npc',
        x: 15,
        y: 6,
        sprite: 'me_staff',
        direction: 'down',
        badge: state.stage === 'speak_to_staff' ? '🎙️ 안내 직원 (말하기!)' : '안내 직원',
        label: '공항 안내 데스크 직원',
      });

      // 9. Dingo/Hwalbin (inside Lost & Found at x=17, y=3 before rescue; once rescued, follows behind player like Pikachu!)
      const hwalbinRescued = Boolean(
        state.rewardReceipts?.['hwalbin-rescued'] ||
          state.rewardReceipts?.[STAGE1_REWARD_ID] ||
          ['battle_misspell', 'stage1_complete'].includes(state.stage)
      );
      if (!hwalbinRescued) {
        objs.push({
          id: 'npc_hwalbin',
          kind: 'npc',
          x: 17,
          y: 3,
          sprite: 'me_hwalbin',
          direction: 'down',
          badge: state.stage === 'reunite_hwalbin' ? '💛 딩고/활빈 (구출!)' : '딩고/활빈 (분실물함)',
          label: '분실물 보관소의 딩고(활빈)',
        });
      }

      return objs;
    },
  };
}
