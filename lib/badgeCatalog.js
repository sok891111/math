// Comprehensive Badge Catalog for Craft Runner (143) and Complete! Block Island (56)

const MONSTER_NAMES = {
  wither: ['💀', '위더 정복자'],
  elderguardian: ['🔱', '바다 신전 수호자'],
  evoker: ['📜', '소환 마법 박사'],
  ravager: ['🦏', '파괴수 친구'],
  piglinbrute: ['🪓', '보루 탐험 대장'],
  breeze: ['🌪️', '바람 타는 브리즈 친구'],
  shulker: ['🟪', '셜커 껍데기 박사'],
  endermite: ['🐛', '엔더마이트 친구'],
  enderknight: ['⚔️', '엔더 기사 정복자'],
  enderdragon: ['🐉', '엔더드래곤 정복자'],
  warden: ['🩵', '워든 수호자'],
  chicken: ['🐔', '꼬꼬 곱셈 친구'],
  pig: ['🐷', '꿀꿀 사과 친구'],
  rabbit: ['🐰', '깡충 토끼 친구'],
  fox: ['🦊', '살금 여우 친구'],
  zombie: ['🧟', '좀비 햇살 친구'],
  creeper: ['🌿', '쉬이익 진정 대장'],
  slime: ['🍮', '말랑말랑 젤리 왕'],
  skeleton: ['🦴', '달그락 뼈 박사'],
  spider: ['🕸️', '여덟 다리 댄서'],
  witch: ['🧪', '보글보글 물약 달인'],
  enderman: ['🌌', '별빛 순간이동 대장'],
  magma: ['🌋', '따끈따끈 용암 요리사'],
  ghast: ['☁️', '두둥실 구름 선장'],
};

const TIERS = [
  { at: 1, label: '첫 만남', mark: '🌱', rarity: 'common', rarityName: '새싹', rarityColor: '#85a765' },
  { at: 3, label: '단짝 친구', mark: '⭐', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { at: 5, label: '전설의 친구', mark: '👑', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { at: 10, label: '수호 기사', mark: '🛡️', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { at: 20, label: '별빛 마스터', mark: '🌟', rarity: 'legendary', rarityName: '전설', rarityColor: '#d6a443' },
];

const catalog = [];

// 1. Craft Runner: 120 Monster Badges (24 species * 5 tiers)
for (const [kind, [icon, title]] of Object.entries(MONSTER_NAMES)) {
  for (const t of TIERS) {
    catalog.push({
      id: `${kind}-${t.at}`,
      game: 'runner',
      category: 'monster',
      icon,
      title: `${title} · ${t.label}`,
      desc: `${title} 몬스터를 ${t.at}마리 물리치기`,
      target: t.at,
      rarity: t.rarity,
      rarityName: t.rarityName,
      rarityColor: t.rarityColor,
    });
  }
}

// 2. Craft Runner: 23 Special Challenge Badges
const RUNNER_SPECIALS = [
  { id: 'wind-unlock', category: 'adventure', icon: '🌪️', title: '바람 모험의 문', desc: '몬스터 50마리를 잡아 브리즈와 바람 점프 열기', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'first-light', category: 'math', icon: '🔥', title: '첫 햇살 마법', desc: '15초 대결에서 처음 승리하기', rarity: 'common', rarityName: '새싹', rarityColor: '#85a765' },
  { id: 'math-10', category: 'math', icon: '🧮', title: '열 번의 자신감', desc: '수학 대결 10번 승리하기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'math-30', category: 'math', icon: '🎓', title: '수학 박사', desc: '수학 대결 30번 승리하기', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'math-100', category: 'math', icon: '👑', title: '수학 황제', desc: '수학 대결 100번 승리하기', rarity: 'legendary', rarityName: '전설', rarityColor: '#d6a443' },
  { id: 'speed-1', category: 'math', icon: '⚡', title: '번개 마법사', desc: '5초 안에 정답으로 승리하기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'speed-10', category: 'math', icon: '☄️', title: '혜성 집중력', desc: '5초 안에 승리 10번 달성하기', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'perfect-5', category: 'math', icon: '💯', title: '정확한 마법', desc: '첫 제출 정답으로 5번 승리하기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'streak-3', category: 'math', icon: '🔥', title: '3연승 불꽃', desc: '대결에서 실수 없이 3번 연속 승리하기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'streak-10', category: 'math', icon: '🐉', title: '불꽃 드래곤', desc: '대결에서 10번 연속으로 승리하기', rarity: 'legendary', rarityName: '전설', rarityColor: '#d6a443' },
  { id: 'ten-frame-5', category: 'math', icon: '🧱', title: '열 칸 건축가', desc: '블록으로 열 칸을 완성하고 5번 승리하기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'big-math-1', category: 'math', icon: '🌟', title: '첫 큰 수 정복', desc: '두 자리 수 큰 수 덧셈 첫 승리하기', rarity: 'common', rarityName: '새싹', rarityColor: '#85a765' },
  { id: 'big-math-5', category: 'math', icon: '⚡', title: '큰 수 탐험가', desc: '두 자리 수 큰 수 덧셈 5번 승리하기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'big-math-15', category: 'math', icon: '🔥', title: '큰 수 계산왕', desc: '두 자리 수 큰 수 덧셈 15번 승리하기', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'big-math-30', category: 'math', icon: '👑', title: '큰 수 대마법사', desc: '두 자리 수 큰 수 덧셈 30번 승리하기', rarity: 'legendary', rarityName: '전설', rarityColor: '#d6a443' },
  { id: 'sum-20', category: 'math', icon: '🥉', title: '합 20 돌파', desc: '합이 20 이상인 큰 수 덧셈 문제 정복하기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'sum-30', category: 'math', icon: '🥈', title: '합 30 돌파', desc: '합이 30 이상인 큰 수 덧셈 문제 정복하기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'sum-40', category: 'math', icon: '🥇', title: '합 40 돌파', desc: '합이 40 이상인 큰 수 덧셈 문제 정복하기', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'sum-50', category: 'math', icon: '🏆', title: '합 50 전설 정복', desc: '합이 50인 최고 난이도 보스 큰 수 덧셈 정복하기', rarity: 'legendary', rarityName: '전설', rarityColor: '#d6a443' },
  { id: 'big-tens', category: 'math', icon: '🧱', title: '십의 자리 마스터', desc: '10개 묶음 두 자리 수 덧셈 3번 해결하기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'big-fast', category: 'math', icon: '⚡', title: '번개 큰 수 마법', desc: '두 자리 수 큰 수 덧셈을 10초 안에 빠르게 정답 맞추기', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'big-carry', category: 'math', icon: '🌈', title: '받아올림 마법사', desc: '일의 자리 합이 10 이상인 두 자리 수 덧셈 3번 해결하기', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'chest-1', category: 'treasure', icon: '🎁', title: '첫 보물상자', desc: '승리 후 떨어진 보물상자 1개 줍기', rarity: 'common', rarityName: '새싹', rarityColor: '#85a765' },
  { id: 'chest-10', category: 'treasure', icon: '🗝️', title: '보물 사냥꾼', desc: '몬스터 보물상자 10개 줍기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'chest-30', category: 'treasure', icon: '💎', title: '보물섬의 주인', desc: '몬스터 보물상자 30개 줍기', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'gems-30', category: 'treasure', icon: '💠', title: '반짝 주머니', desc: '보물에서 보석 30개 모으기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'gems-100', category: 'treasure', icon: '💰', title: '보석 왕국', desc: '보물에서 보석 100개 모으기', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'relic-3', category: 'treasure', icon: '🧰', title: '작은 보물 도감', desc: '서로 다른 몬스터 보물 3종 모으기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'relic-9', category: 'treasure', icon: '🏆', title: '아홉 보물의 전설', desc: '서로 다른 몬스터 보물 9종 모으기', rarity: 'legendary', rarityName: '전설', rarityColor: '#d6a443' },
  { id: 'species-9', category: 'adventure', icon: '🌈', title: '모두의 햇살 친구', desc: '서로 다른 몬스터 9종에게 승리하기', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'maps-3', category: 'adventure', icon: '🧭', title: '길 찾는 탐험가', desc: '서로 다른 맵 3곳에서 승리하기', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'maps-6', category: 'adventure', icon: '🗺️', title: '여섯 세계의 수호자', desc: '서로 다른 맵 6곳에서 승리하기', rarity: 'legendary', rarityName: '전설', rarityColor: '#d6a443' },
  { id: 'clear-5', category: 'adventure', icon: '🚩', flag: '깃발 원정대', title: '깃발 원정대', desc: '몬스터에게 승리한 단계 5번 완주', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'clean-3', category: 'adventure', icon: '🌞', title: '햇살 완벽 원정', desc: '모든 몬스터에게 승리하고 3번 완주', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
];

RUNNER_SPECIALS.forEach(b => {
  catalog.push({
    ...b,
    game: 'runner',
  });
});

// 3. Complete! Block Island: Story Bridges (3), Treasures (4), Milestones (4), and 45 Addition Problems
catalog.push(
  { id: 'island-bridge-0', game: 'island', category: 'bridge', icon: '🌿', title: '여우의 숲 다리', desc: '강 너머 여우를 만나기 위한 열 칸 다리 완성', rarity: 'common', rarityName: '새싹', rarityColor: '#85a765' },
  { id: 'island-bridge-1', game: 'island', category: 'bridge', icon: '💎', title: '반짝 광산 철길', desc: '곰을 만나기 위한 열 칸 철길 다리 완성', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'island-bridge-2', game: 'island', category: 'bridge', icon: '🌼', title: '선율이의 블록 정원', desc: '토끼를 만나기 위한 마지막 정원 다리 완성', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },

  { id: 'island-treasure-leaf', game: 'island', category: 'treasure', icon: '🍀', title: '행운의 네잎클로버', desc: '풀빛 시작섬에서 숨겨진 보물 발견', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'island-treasure-apple', game: 'island', category: 'treasure', icon: '🍎', title: '반짝 황금 사과', desc: '여우의 숲에서 발견한 황금 사과', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'island-treasure-gem', game: 'island', category: 'treasure', icon: '💎', title: '무지개 보석', desc: '반짝 광산에서 캐낸 무지개 원석', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'island-treasure-flower', game: 'island', category: 'treasure', icon: '🌸', title: '별빛 꽃', desc: '블록 정원에 피어난 신비로운 별빛 꽃', rarity: 'legendary', rarityName: '전설', rarityColor: '#d6a443' },

  { id: 'island-milestone-5', game: 'island', category: 'milestone', icon: '🌱', title: '새싹 탐험가', desc: '서로 다른 열 칸 문제 5종 해결', rarity: 'common', rarityName: '새싹', rarityColor: '#85a765' },
  { id: 'island-milestone-10', game: 'island', category: 'milestone', icon: '⭐', title: '반짝 탐험가', desc: '서로 다른 열 칸 문제 10종 해결', rarity: 'rare', rarityName: '희귀', rarityColor: '#5b9ec8' },
  { id: 'island-milestone-20', game: 'island', category: 'milestone', icon: '👑', title: '블록 왕관', desc: '서로 다른 열 칸 문제 20종 해결', rarity: 'epic', rarityName: '영웅', rarityColor: '#a382c1' },
  { id: 'island-milestone-45', game: 'island', category: 'milestone', icon: '🏆', title: '열칸 섬 마스터', desc: '45가지 모든 열 칸 퍼즐 정복', rarity: 'legendary', rarityName: '전설', rarityColor: '#d6a443' }
);

// 45 single-digit addition problem badges in Block Island (a+b where a+b >= 10)
for (let a = 9; a >= 1; a--) {
  for (let b = 1; b <= 9; b++) {
    if (a + b >= 10) {
      catalog.push({
        id: `island-q-${a}+${b}`,
        game: 'island',
        category: 'math',
        icon: '🧊',
        title: `${a} + ${b} = ${a + b} 완성`,
        desc: `블록을 옮겨 10을 채우고 ${a} + ${b} = ${a + b} 해결하기`,
        rarity: (a + b >= 15) ? 'rare' : 'common',
        rarityName: (a + b >= 15) ? '희귀' : '새싹',
        rarityColor: (a + b >= 15) ? '#5b9ec8' : '#85a765',
      });
    }
  }
}

export const BADGE_CATALOG = catalog;
