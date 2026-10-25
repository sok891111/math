// Stage 2: Episode 2 - 사라진 보따리와 B의 버스! (BusStop -> BusInterior -> NextStop)
export const STAGE2_WORDS = {
  bus: {
    id: 'bus',
    word: 'Bus',
    phonetic: '[bʌs]',
    korean: '버스',
    sound: '/b/ (브)',
    soundTip: "입술을 다물었다가 '브' 하고 힘차게 터뜨리는 소리예요!",
    emoji: '🚌',
    sentence: 'It is a big bus!',
    sentenceKo: '이건 큰 버스야!',
    image: 'assets/stage2/page05.jpg',
  },
  bag: {
    id: 'bag',
    word: 'Bag',
    phonetic: '[bæɡ]',
    korean: '가방 (보따리)',
    sound: '/b/ (브)',
    soundTip: "입술을 붙였다 떼며 '브' 소리로 시작해요!",
    emoji: '🎒',
    sentence: 'My bag is here!',
    sentenceKo: '내 가방(보따리)이 여기 있어!',
    image: 'assets/stage2/page06.jpg',
  },
  big: {
    id: 'big',
    word: 'Big',
    phonetic: '[bɪɡ]',
    korean: '큰, 커다란',
    sound: '/b/ (브)',
    soundTip: "글자 이름은 '비(B)'지만 단어 속에서는 '브(/b/)' 소리가 나요!",
    emoji: '🐘',
    sentence: 'A big blue bus!',
    sentenceKo: '커다란 파란 버스!',
    image: 'assets/stage2/page04.jpg',
  },
};

export const STAGE2_CHECKLIST = [
  {
    id: 's2-words',
    title: '정류장 B 단서 3종 찾기 (Bus · Bag · Big)',
    subtitle: '버스 표지판·짐수레·큰 버스 그림판을 조사해 Speak!',
    isDone: state => ['bus', 'bag', 'big'].every(w => state.stage2?.words?.[w]),
  },
  {
    id: 's2-board',
    title: '노란 버스 탑승 & 오해 삼총사의 함정',
    subtitle: '노노·웅얼이·따라쟁이의 속임수로 잘못 탄 버스!',
    isDone: state => Boolean(state.stage2?.boarded || state.stage2?.driver || state.map === 'BusInterior' || state.map === 'NextStop'),
  },
  {
    id: 's2-driver',
    title: '버스 기사님께 큰 버스 정류장 묻기',
    subtitle: '“Excuse me. Can I ask?” → “Where is the bus?”',
    isDone: state => Boolean(state.stage2?.driver),
  },
  {
    id: 's2-signs',
    title: '뒤바뀐 간판 3개 복구 (SUB·GAB·GIB → BUS·BAG·BIG)',
    subtitle: '환승 정류장의 뒤섞인 간판 글자를 맞추고 Speak!',
    isDone: state => ['bus', 'bag', 'big'].every(w => state.stage2?.signs?.[w]),
  },
  {
    id: 's2-luggage',
    title: '미스터 미스스펠 대결 & 보따리·황금 B 조각 회수',
    subtitle: '큰 파란 버스 짐칸에서 Big bus! · My bag! 외치기!',
    isDone: state => Boolean(state.stage2?.bagRecovered),
  },
  {
    id: 's2-complete',
    title: '올바른 버스로 다음 여행(Stage 3) 출발!',
    subtitle: '북쪽 환승 게이트(10, 2)로 이동해 Stage 2 클리어!',
    isDone: state => Boolean(state.stage2?.completed),
  },
];

export function ensureStage2(state) {
  state.stage2 ??= {
    phase: 'words',
    words: { bus: false, bag: false, big: false },
    boarded: false,
    driver: false,
    alighted: false,
    signs: { bus: false, bag: false, big: false },
    signSelections: {},
    bagRecovered: false,
    fragmentB: false,
    bossDefeated: false,
    bossHp: 3,
    completed: false,
  };
  state.stage2.words ??= { bus: false, bag: false, big: false };
  state.stage2.signs ??= { bus: false, bag: false, big: false };
  state.stage2.signSelections ??= {};
  if (typeof state.stage2.bossHp !== 'number') state.stage2.bossHp = 3;
  if(state.stage2.driver||state.stage2.alighted||state.stage2.bagRecovered)state.stage2.boarded=true;
  if(state.map==='NextStop'&&state.stage2.driver)state.stage2.alighted=true;
  return state.stage2;
}

export const ensureStage2State = ensureStage2;

export function stage2Goal(state) {
  const s = ensureStage2(state);
  if (!['bus', 'bag', 'big'].every(w => s.words[w])) {
    const found = ['bus', 'bag', 'big'].filter(w => s.words[w]).length;
    return `🎯 버스 정류장에서 Bus [bʌs], Bag [bæɡ], Big [bɪɡ] 단서 3개를 찾아 말해 보세요! (${found}/3)`;
  }
  if (state.map === 'BusStop' && !s.driver) {
    return '🎯 단서 3개를 모두 찾았어요! 북쪽 노란 버스 문(10, 2)에서 버스에 타 보세요!';
  }
  if (!s.driver) {
    return '🎯 잘못된 버스에 탔어요! 앞쪽 버스 기사님(10, 3)께 “Where is the bus?”라고 물어보세요!';
  }
  if (state.map === 'BusInterior') {
    return '🎯 기사님이 다음 정류장을 알려 주셨어요! 남쪽 출입문(10, 12)으로 내려 큰 파란 버스를 찾으세요!';
  }
  if (!['bus', 'bag', 'big'].every(w => s.signs[w])) {
    const fixed = ['bus', 'bag', 'big'].filter(w => s.signs[w]).length;
    return `🎯 미스터 미스스펠이 뒤섞어 놓은 SUB · GAB · GIB 간판 3개를 바로잡으세요! (${fixed}/3)`;
  }
  if (!s.bagRecovered) {
    return '🎯 큰 파란 버스 앞의 악당 미스터 미스스펠과 대결하고 짐칸(16, 9)에서 보따리와 황금 B 조각을 되찾으세요!';
  }
  if (!s.completed) {
    return '🎯 보따리와 황금 B 조각을 되찾았어요! 북쪽 출발 게이트(10, 2)에서 올바른 버스를 타세요!';
  }
  return '🎉 STAGE 2 클리어! 황금 B 조각을 얻었어요! 정류장 친구들과 자유롭게 영어로 대화해 보세요!';
}

function makeGrid(fn) {
  return Array.from({ length: 15 }, (_, y) =>
    Array.from({ length: 20 }, (_, x) => (fn(x, y) ? 'FLOOR' : 'WALL'))
  );
}

export function createStage2Maps() {
  const busStopFloor = (x, y) =>
    x > 0 &&
    x < 19 &&
    y > 1 &&
    y < 14 &&
    !(x >= 8 && x <= 12 && y === 2) &&
    !(x === 4 && y === 3) &&
    !(x === 10 && y === 5) &&
    !(x === 15 && y === 3);

  const busInteriorFloor = (x, y) =>
    x > 4 &&
    x < 15 &&
    y > 2 &&
    y < 13 &&
    !(x === 10 && y === 3);

  const nextStopFloor = (x, y) =>
    x > 0 &&
    x < 19 &&
    y > 1 &&
    y < 14 &&
    !([4, 9, 14].includes(x) && y === 4) &&
    !(x >= 13 && x <= 17 && y >= 8 && y <= 9);

  return {
    BusStop: {
      id: 'BusStop',
      name: '버스 정류장',
      width: 20,
      height: 15,
      collision: makeGrid(busStopFloor),
      isPassable(state, x, y) {
        return (
          busStopFloor(x, y) &&
          !this.getObjects(state).some(o => o.kind === 'npc' && o.x === x && o.y === y)
        );
      },
      getObjects: state => {
        const s = ensureStage2(state);
        return [
          {
            id: 's2_word_bus',
            kind: 'investigate',
            wordId: 'bus',
            x: 4,
            y: 3,
            badge: s.words.bus ? '✓ Bus [bʌs]' : '🚌 Bus (조사)',
          },
          {
            id: 's2_word_bag',
            kind: 'investigate',
            wordId: 'bag',
            x: 10,
            y: 5,
            badge: s.words.bag ? '✓ Bag [bæɡ]' : '🧳 Bag (조사)',
          },
          {
            id: 's2_word_big',
            kind: 'investigate',
            wordId: 'big',
            x: 15,
            y: 3,
            badge: s.words.big ? '✓ Big [bɪɡ]' : '🔎 Big (조사)',
          },
          {
            id: 's2_board',
            kind: 'investigate',
            x: 10,
            y: 2,
            badge: ['bus', 'bag', 'big'].every(w => s.words[w]) ? '🚌 노란 버스 타기!' : '🚌 버스 문',
          },
          { id: 's2_amy', kind: 'npc', x: 5, y: 8, sprite: 'me_amy', direction: 'down', label: '에이미', badge: '에이미' },
          { id: 's2_ringo', kind: 'npc', x: 7, y: 8, sprite: 'me_ringo', direction: 'down', label: '링고', badge: '링고' },
          { id: 's2_nono', kind: 'npc', x: 12, y: 4, sprite: 'me_nono', direction: 'down', label: '노노 (오해 삼총사)', badge: '😈 노노' },
          { id: 's2_ungeori', kind: 'npc', x: 14, y: 8, sprite: 'me_merchant', direction: 'down', label: '웅얼이 (오해 삼총사)', badge: '😈 웅얼이' },
          { id: 's2_commuter', kind: 'npc', x: 3, y: 7, sprite: 'me_traveler', direction: 'down', label: '정류장 승객', badge: '💬 정류장 승객' },
          { id: 's2_student', kind: 'npc', x: 16, y: 7, sprite: 'me_kid', direction: 'down', label: '통학버스 아이', badge: '🎈 통학버스 아이' },
          { id: 's2_airport', kind: 'exit', x: 3, y: 13, badge: '↩ 공항 로비' },
        ];
      },
    },
    BusInterior: {
      id: 'BusInterior',
      name: '버스 안',
      width: 20,
      height: 15,
      collision: makeGrid(busInteriorFloor),
      isPassable(state, x, y) {
        return (
          busInteriorFloor(x, y) &&
          !this.getObjects(state).some(o => o.kind === 'npc' && o.x === x && o.y === y)
        );
      },
      getObjects: state => {
        const s = ensureStage2(state);
        return [
          {
            id: 's2_driver',
            kind: 'npc',
            x: 10,
            y: 3,
            sprite: 'me_staff',
            direction: 'down',
            label: '버스 기사님',
            badge: s.driver ? '✓ 버스 기사님' : '🎙️ 버스 기사님 (길 묻기!)',
          },
          { id: 's2_passenger', kind: 'npc', x: 7, y: 6, sprite: 'me_traveler', direction: 'down', label: '버스 승객', badge: '💬 버스 승객' },
          { id: 's2_amy', kind: 'npc', x: 8, y: 8, sprite: 'me_amy', direction: 'up', label: '에이미', badge: '에이미' },
          { id: 's2_ringo', kind: 'npc', x: 12, y: 8, sprite: 'me_ringo', direction: 'up', label: '링고', badge: '링고' },
          {
            id: 's2_alight',
            kind: 'exit',
            x: 10,
            y: 12,
            badge: s.driver ? '🚪 다음 정류장 하차!' : '🚪 하차 문',
          },
        ];
      },
    },
    NextStop: {
      id: 'NextStop',
      name: '다음 정류장 · 큰 파란 버스',
      width: 20,
      height: 15,
      collision: makeGrid(nextStopFloor),
      isPassable(state, x, y) {
        return (
          nextStopFloor(x, y) &&
          !this.getObjects(state).some(o => o.kind === 'npc' && o.x === x && o.y === y)
        );
      },
      getObjects: state => {
        const s = ensureStage2(state);
        const allSigns = ['bus', 'bag', 'big'].every(w => s.signs[w]);
        return [
          {
            id: 's2_sign_bus',
            kind: 'investigate',
            x: 4,
            y: 4,
            badge: s.signs.bus ? '✓ BUS' : '🪧 SUB → BUS',
          },
          {
            id: 's2_sign_bag',
            kind: 'investigate',
            x: 9,
            y: 4,
            badge: s.signs.bag ? '✓ BAG' : '🪧 GAB → BAG',
          },
          {
            id: 's2_sign_big',
            kind: 'investigate',
            x: 14,
            y: 4,
            badge: s.signs.big ? '✓ BIG' : '🪧 GIB → BIG',
          },
          {
            id: 's2_misspell',
            kind: 'npc',
            x: 12,
            y: 9,
            sprite: 'me_misspell',
            direction: 'down',
            label: '미스터 미스스펠',
            badge: s.bagRecovered ? '💫 미스스펠 (항복)' : '😈 미스터 미스스펠',
          },
          {
            id: 's2_bigbus',
            kind: 'investigate',
            x: 14,
            y: 9,
            badge: '🚌 큰 파란 버스 (BIG BUS)',
          },
          {
            id: 's2_luggage',
            kind: 'investigate',
            x: 16,
            y: 9,
            badge: s.bagRecovered ? '✓ 보따리 · B 조각' : allSigns ? '🧳 짐칸 (보따리 찾기!)' : '🧳 짐칸 (간판 먼저!)',
          },
          {
            id: 's2_copycat',
            kind: 'npc',
            x: 8,
            y: 11,
            sprite: 'me_copycat',
            direction: 'down',
            label: '따라쟁이 (오해 삼총사)',
            badge: '😈 따라쟁이',
          },
          { id: 's2_amy', kind: 'npc', x: 5, y: 8, sprite: 'me_amy', direction: 'down', label: '에이미', badge: '에이미' },
          { id: 's2_ringo', kind: 'npc', x: 7, y: 8, sprite: 'me_ringo', direction: 'down', label: '링고', badge: '링고' },
          {
            id: 's2_next',
            kind: 'exit',
            x: 10,
            y: 2,
            badge: s.completed ? '🏁 STAGE 2 완료!' : s.bagRecovered ? '🚌 올바른 버스 출발!' : '🚌 출발 게이트',
          },
          { id: 's2_back', kind: 'exit', x: 3, y: 13, badge: '↩ 이전 정류장' },
        ];
      },
    },
  };
}

function drawPixelRoad(ctx, ox, oy, W = 20) {
  // Multi-lane asphalt road along y = 1..2 (32px tall)
  const rTop = oy + 16;
  ctx.fillStyle = '#334155';
  ctx.fillRect(ox + 16, rTop, (W - 2) * 16, 32);
  // Top and bottom curb stone lines
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(ox + 16, rTop, (W - 2) * 16, 2);
  ctx.fillRect(ox + 16, rTop + 30, (W - 2) * 16, 2);
  // Dashed yellow center lane divider
  ctx.fillStyle = '#facc15';
  for (let x = 1; x < W - 1; x++) {
    ctx.fillRect(ox + x * 16 + 3, rTop + 15, 10, 2);
  }
  // White pedestrian crosswalk at x = 6..7
  ctx.fillStyle = '#f8fafc';
  for (let s = 0; s < 5; s++) {
    ctx.fillRect(ox + 6 * 16 + 2, rTop + 3 + s * 6, 28, 3);
  }
}

export function renderStage2Map(ctx, ox, oy, state, map) {
  const s = ensureStage2(state);

  // 1. Base Tile Grid (16x16 per tile on 160x144 GBC viewport)
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const px = ox + x * 16;
      const py = oy + y * 16;
      const isBorder = x === 0 || x === map.width - 1 || y === 0 || y === map.height - 1;

      if (map.id === 'BusInterior') {
        if (x <= 4 || x >= 15 || y <= 2 || y >= 13) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(px, py, 16, 16);
        } else {
          const isAisle = x >= 9 && x <= 11;
          ctx.fillStyle = isAisle
            ? (x + y) % 2 === 0 ? '#cbd5e1' : '#94a3b8'
            : (x + y) % 2 === 0 ? '#e2e8f0' : '#cbd5e1';
          ctx.fillRect(px, py, 16, 16);
          if ((y === 5 || y === 7 || y === 9 || y === 11) && (x === 6 || x === 13)) {
            // Blue passenger bus seats
            ctx.fillStyle = '#1d4ed8';
            ctx.fillRect(px + 1, py + 2, 14, 11);
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(px + 2, py + 3, 12, 4);
          }
        }
        continue;
      }

      if (isBorder) {
        ctx.fillStyle = '#2d3f4e';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#435b6e';
        ctx.fillRect(px + 1, py + 1, 14, 12);
        continue;
      }

      // Sidewalk & bus stop plaza (y = 3..13)
      const onGuideWalk = (x === 10 && y >= 3 && y <= 12) || (y === 8 && x >= 4 && x <= 15);
      if (onGuideWalk) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#bfd6de' : '#b2cbd4';
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#dce6d5' : '#d1dec8';
      }
      ctx.fillRect(px, py, 16, 16);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.06)';
      ctx.fillRect(px, py + 15, 16, 1);
    }
  }

  if (map.id === 'BusStop') {
    drawPixelRoad(ctx, ox, oy, map.width);

    // Bus Stop Glass Shelter Canopy at x = 2..6, y = 3
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(ox + 2 * 16, oy + 3 * 16 - 4, 4 * 16, 6);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.fillRect(ox + 2 * 16 + 2, oy + 3 * 16 + 2, 4 * 16 - 4, 12);

    // Clue 1: Bus Stop Signpost at (4, 3)
    const b1x = ox + 4 * 16;
    const b1y = oy + 3 * 16;
    ctx.fillStyle = '#475569';
    ctx.fillRect(b1x + 7, b1y + 6, 2, 10);
    ctx.fillStyle = s.words.bus ? '#16a34a' : '#2563eb';
    ctx.fillRect(b1x + 2, b1y, 12, 9);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b1x + 4, b1y + 2, 8, 5);

    // Parked Yellow Bus at x = 8..12, y = 2 (Door at 10, 2)
    const busX = ox + 8 * 16;
    const busY = oy + 2 * 16 - 4;
    const busW = 5 * 16;
    const busH = 20;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(busX, busY, busW, busH);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(busX, busY + busH - 4, busW, 4);
    // Windows
    ctx.fillStyle = '#bae6fd';
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue; // Door slot at x = 10
      ctx.fillRect(busX + 4 + i * 19, busY + 3, 14, 8);
    }
    // Bus door at (10, 2)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(ox + 10 * 16 + 3, busY + 3, 10, busH - 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(ox + 10 * 16 + 5, busY + 5, 6, busH - 8);
    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(busX + 8, busY + busH - 1, 8, 3);
    ctx.fillRect(busX + busW - 16, busY + busH - 1, 8, 3);

    // Clue 2: Baggage Cart & Traditional Bundle Trace at (10, 5)
    const bagX = ox + 10 * 16;
    const bagY = oy + 5 * 16;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bagX + 1, bagY + 4, 14, 10);
    ctx.fillStyle = s.words.bag ? '#16a34a' : '#dc2626';
    ctx.fillRect(bagX + 4, bagY + 2, 8, 9);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(bagX + 7, bagY + 5, 2, 3);

    // Clue 3: Big Bus Picture Billboard at (15, 3)
    const bigX = ox + 15 * 16;
    const bigY = oy + 3 * 16;
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(bigX, bigY, 16, 14);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bigX + 1, bigY + 1, 14, 12);
    ctx.fillStyle = s.words.big ? '#16a34a' : '#2563eb';
    ctx.fillRect(bigX + 2, bigY + 3, 12, 8);

    // Airport Return Mat at (3, 13)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(ox + 3 * 16, oy + 13 * 16 + 2, 16, 12);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(ox + 3 * 16 + 3, oy + 13 * 16 + 5, 10, 6);
  } else if (map.id === 'BusInterior') {
    // Yellow Bus Frame around x = 5..14, y = 3..12
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox + 5 * 16 - 1, oy + 3 * 16 - 1, 10 * 16 + 2, 10 * 16 + 2);
    // Front Windshield at y = 2, x = 6..13
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(ox + 6 * 16, oy + 2 * 16 + 6, 8 * 16, 10);
    // Steering Wheel console at (10, 3)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ox + 10 * 16 + 2, oy + 3 * 16 - 2, 12, 5);
    // Exit Door Mat at (10, 12)
    ctx.fillStyle = s.driver ? '#16a34a' : '#64748b';
    ctx.fillRect(ox + 10 * 16 + 1, oy + 12 * 16 + 2, 14, 12);
  } else if (map.id === 'NextStop') {
    drawPixelRoad(ctx, ox, oy, map.width);

    // Three Scrambled/Restored Roadside Signboards at (4,4), (9,4), (14,4)
    for (const [id, x] of [
      ['bus', 4],
      ['bag', 9],
      ['big', 14],
    ]) {
      const sx = ox + x * 16;
      const sy = oy + 4 * 16;
      const fixed = Boolean(s.signs[id]);
      ctx.fillStyle = '#334155';
      ctx.fillRect(sx + 7, sy + 9, 2, 7);
      ctx.fillStyle = fixed ? '#16a34a' : '#dc2626';
      ctx.fillRect(sx + 1, sy + 1, 14, 10);
      ctx.fillStyle = fixed ? '#bbf7d0' : '#fecaca';
      ctx.fillRect(sx + 3, sy + 3, 10, 6);
    }

    // Giant Blue Bus (BIG BLUE BUS) parked at x = 13..17, y = 8..9
    const bbx = ox + 13 * 16;
    const bby = oy + 8 * 16;
    const bbw = 5 * 16;
    const bbh = 2 * 16;
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(bbx, bby, bbw, bbh);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(bbx, bby + bbh - 6, bbw, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(bbx, bby + 14, bbw, 2);
    // Panoramic windows
    ctx.fillStyle = '#bae6fd';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(bbx + 4 + i * 19, bby + 3, 15, 9);
    }
    // Open Luggage Bay at (16, 9) with Gil-dong's Bag & Golden B Piece!
    const lx = ox + 16 * 16;
    const ly = oy + 9 * 16;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lx + 1, ly + 2, 14, 12);
    ctx.fillStyle = s.bagRecovered ? '#22c55e' : '#dc2626';
    ctx.fillRect(lx + 4, ly + 4, 8, 8);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(lx + 7, ly + 6, 3, 3);
    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bbx + 10, bby + bbh - 1, 10, 3);
    ctx.fillRect(bbx + bbw - 20, bby + bbh - 1, 10, 3);

    // Stage 2 Departure Arch at (10, 2)
    ctx.fillStyle = s.bagRecovered ? '#16a34a' : '#475569';
    ctx.fillRect(ox + 10 * 16, oy + 2 * 16, 16, 16);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(ox + 10 * 16 + 3, oy + 2 * 16 + 3, 10, 10);

    // Return to BusStop at (3, 13)
    ctx.fillStyle = '#475569';
    ctx.fillRect(ox + 3 * 16, oy + 13 * 16 + 2, 16, 12);
  }
}

// Shared, idempotent story transitions used by actual Speak completion callbacks.
export function advanceStage2(state,action,word){
 const s=ensureStage2(state),words=['bus','bag','big'];
 if(action==='word'){if(!words.includes(word))return false;s.words[word]=true;return true;}
 if(action==='board'){if(!words.every(w=>s.words[w]))return false;s.boarded=true;s.phase='driver';return true;}
 if(action==='driver'){s.boarded=true;s.driver=true;s.phase='signs';return true;}
 if(action==='alight'){if(!s.driver)return false;s.alighted=true;s.phase='signs';return true;}
 if(action==='sign'){if(!s.driver||!words.includes(word))return false;s.signs[word]=true;s.signSelections[word]='';return true;}
 if(action==='recover'){
   if(!words.every(w=>s.signs[w]))return false;
   s.bagRecovered=true;s.fragmentB=true;s.bossDefeated=true;s.bossHp=0;s.phase='recovered';
   if(!state.alphabetPieces.includes('B'))state.alphabetPieces.push('B');return true;
 }
 if(action==='complete'){if(!s.bagRecovered||!s.fragmentB)return false;s.completed=true;s.phase='complete';return true;}
 return false;
}
