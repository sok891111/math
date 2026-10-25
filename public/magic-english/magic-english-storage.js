import {STAGE3_MAP_IDS, validStage3, createStage3Maps} from './magic-english-stage3.js';
// Magic English Stage 1 Save, State Transitions, Idempotent Rewards & Block World Storage
// Implements STAGE-1-PLAN.md Sections 5 & 6.

import { STAGE1_REWARD_ID, STAGE1_STAGES, STAGE1_WORDS } from './magic-english-story.js';

export const MAGIC_ENGLISH_SAVE_PREFIX = 'magic-english-save-v1';

export const STARTER_BLOCKS = ['dirt', 'stone', 'wood'];
export const STAGE1_REWARD_BLOCKS = ['airport_glass', 'airport_white_brick', 'airport_blue_floor'];
export const SHOP_BLOCKS = {
  gold_a_block: { id: 'gold_a_block', name: '황금 A 빛블록', price: 50, color: '#eab839', topColor: '#ffe074' },
  hwalbin_mint_block: { id: 'hwalbin_mint_block', name: '활빈 민트 비늘블록', price: 50, color: '#45b69c', topColor: '#6dd9bf' },
};

export const BLOCK_CATALOG = {
  dirt: { id: 'dirt', name: '기본 흙 블록', category: 'starter', color: '#8f6239', topColor: '#6d9c47' },
  stone: { id: 'stone', name: '단단한 돌 블록', category: 'starter', color: '#7c858e', topColor: '#98a2ab' },
  wood: { id: 'wood', name: '따뜻한 나무 블록', category: 'starter', color: '#b07d48', topColor: '#ca975e' },
  airport_glass: { id: 'airport_glass', name: '공항 전망 유리', category: 'stage1', color: '#79c2e6', topColor: '#aee2fa' },
  airport_white_brick: { id: 'airport_white_brick', name: '공항 흰 벽돌', category: 'stage1', color: '#dcded6', topColor: '#f4f5ef' },
  airport_blue_floor: { id: 'airport_blue_floor', name: '공항 파란 바닥', category: 'stage1', color: '#396fa8', topColor: '#548dc8' },
  gold_a_block: SHOP_BLOCKS.gold_a_block,
  hwalbin_mint_block: SHOP_BLOCKS.hwalbin_mint_block,
  paper_airplane_deco: {
    id: 'paper_airplane_deco',
    name: '종이비행기 특별 장식',
    category: 'decoration',
    isDecoration: true,
    color: '#f26a4b',
    topColor: '#fff5e4',
  },
};

export const BLOCK_WORLD_DIMS = { width: 16, depth: 16, height: 8 };

export function magicEnglishSaveKey(user = null) {
  const id = typeof user === 'string' ? user.trim() : user?.id ? String(user.id).trim() : '';
  return id ? `${MAGIC_ENGLISH_SAVE_PREFIX}:${id}` : `${MAGIC_ENGLISH_SAVE_PREFIX}:guest`;
}

export function createInitialMagicEnglishState() {
  return {
    version: 1,
    stage: 'joseon_intro',
    map: 'JoseonMarket',
    x: 6,
    y: 6,
    facing: 'up',
    steps: 0,
    discoveries: {
      airplane: false,
      apple: false,
      ask: false,
    },
    practice: {
      attempted: false,
      completed: false,
      method: null, // 'self' | 'assisted' | 'dev-skip'
    },
    staffSpeech: {
      hesitatedOnce: false,
      attempted: false,
      completed: false,
      method: null, // 'self' | 'assisted' | 'dev-skip'
    },
    alphabetPieces: [],
    rewardReceipts: {},
    busHookSeen: false,
    blockWorld: {
      coins: 0,
      unlockedBlocks: [...STARTER_BLOCKS],
      decorations: {
        paper_airplane_deco: { owned: 0, placed: 0 },
      },
      blocks: [], // Array of { x, y, z, type }
      cameraAngle: 0,
      selectedBlock: 'dirt',
    },
  };
}

export function validMagicEnglishState(s) {
  if (!s || typeof s !== 'object' || s.version !== 1) return false;
  if (!STAGE1_STAGES.includes(s.stage)) return false;
  if (!['JoseonMarket', 'AirportHall', 'BusStop', 'BusInterior', 'NextStop', ...STAGE3_MAP_IDS].includes(s.map)) return false;
  if (!Number.isInteger(s.x) || !Number.isInteger(s.y) || s.x < 0 || s.y < 0 || s.x >= 20 || s.y >= 16) return false;
  if (!['up', 'down', 'left', 'right'].includes(s.facing)) return false;
  if (!s.discoveries || typeof s.discoveries !== 'object') return false;
  for (const k of ['airplane', 'apple', 'ask']) {
    if (typeof s.discoveries[k] !== 'boolean') return false;
  }
  if (!s.practice || typeof s.practice !== 'object') return false;
  if (typeof s.practice.attempted !== 'boolean' || typeof s.practice.completed !== 'boolean') return false;
  if (![null, 'self', 'assisted', 'dev-skip'].includes(s.practice.method)) return false;

  if (!s.staffSpeech || typeof s.staffSpeech !== 'object') return false;
  if (typeof s.staffSpeech.attempted !== 'boolean' || typeof s.staffSpeech.completed !== 'boolean') return false;
  if (![null, 'self', 'assisted', 'dev-skip'].includes(s.staffSpeech.method)) return false;

  if (!validStage3(s.stage3)) return false;
  if (!Array.isArray(s.alphabetPieces) || !s.alphabetPieces.every(p => typeof p === 'string')) return false;
  if (!s.rewardReceipts || typeof s.rewardReceipts !== 'object' || Array.isArray(s.rewardReceipts)) return false;

  const bw = s.blockWorld;
  if (!bw || typeof bw !== 'object') return false;
  if (!Number.isSafeInteger(bw.coins) || bw.coins < 0) return false;
  if (!Array.isArray(bw.unlockedBlocks) || !bw.unlockedBlocks.every(b => typeof b === 'string' && BLOCK_CATALOG[b])) return false;
  if (!bw.decorations?.paper_airplane_deco) return false;
  const deco = bw.decorations.paper_airplane_deco;
  if (!Number.isInteger(deco.owned) || deco.owned < 0 || !Number.isInteger(deco.placed) || deco.placed < 0 || deco.placed > deco.owned) {
    return false;
  }
  if (!Array.isArray(bw.blocks)) return false;
  for (const b of bw.blocks) {
    if (
      !b ||
      !Number.isInteger(b.x) || b.x < 0 || b.x >= BLOCK_WORLD_DIMS.width ||
      !Number.isInteger(b.y) || b.y < 0 || b.y >= BLOCK_WORLD_DIMS.depth ||
      !Number.isInteger(b.z) || b.z < 0 || b.z >= BLOCK_WORLD_DIMS.height ||
      !BLOCK_CATALOG[b.type]
    ) {
      return false;
    }
  }
  return true;
}

export function serializeMagicEnglishState(state) {
  return JSON.stringify(state);
}

/**
 * Safely parse and validate a saved state without mutating or auto-resetting on failure.
 */
export function parseMagicEnglishState(raw) {
  if (!raw || typeof raw !== 'string') return { ok: false, error: 'empty', state: null };
  try {
    const parsed = JSON.parse(raw);
    if (!validMagicEnglishState(parsed)) {
      return { ok: false, error: 'invalid-schema', state: null };
    }
    // Resume safety: if refreshed mid-intro or on a non-walkable spot in AirportHall, ensure safe coordinates
    if (parsed.map === 'AirportHall') {
      if (parsed.x <= 0 || parsed.x >= 19 || parsed.y <= 0 || parsed.y >= 15) {
        parsed.x = 6;
        parsed.y = 10;
      }
    }
    if(STAGE3_MAP_IDS.includes(parsed.map)){const map=createStage3Maps()[parsed.map];if(!map.isPassable(parsed,parsed.x,parsed.y)){parsed.x=parsed.map==='CocoRoom'?3:10;parsed.y=parsed.map==='CocoRoom'?7:12;}}
    return { ok: true, error: null, state: parsed };
  } catch {
    return { ok: false, error: 'corrupt-json', state: null };
  }
}

/**
 * Record discovery of one of the 3 words (airplane, apple, ask).
 * Idempotent: re-investigating an already discovered object does not duplicate state or rewards.
 */
export function recordWordDiscovery(state, wordId) {
  if (!STAGE1_WORDS[wordId]) return { newlyDiscovered: false, allDiscovered: false };
  const already = !!state.discoveries[wordId];
  state.discoveries[wordId] = true;
  const allDiscovered = !!(state.discoveries.airplane && state.discoveries.apple && state.discoveries.ask);
  if (allDiscovered && state.stage === 'discover_words') {
    state.stage = 'practice_with_amy';
  }
  return { newlyDiscovered: !already, allDiscovered };
}

/**
 * Record practice completion with Amy ('self' | 'assisted' | 'dev-skip').
 */
export function recordPracticeCompletion(state, method = 'self') {
  state.practice.attempted = true;
  state.practice.completed = true;
  if (state.practice.method !== 'self') {
    state.practice.method = method;
  }
  if (['discover_words', 'practice_with_amy'].includes(state.stage)) {
    state.stage = 'speak_to_staff';
  }
  return true;
}

/**
 * Record speaking “Excuse me. Can I ask?” to the Airport Staff ('self' | 'assisted' | 'dev-skip').
 * Both 'self' and 'assisted' advance the story and unlock the Lost & Found room to Hwalbin.
 */
export function recordStaffSpeechCompletion(state, method = 'self') {
  state.staffSpeech.attempted = true;
  state.staffSpeech.completed = true;
  if (state.staffSpeech.method !== 'self') {
    state.staffSpeech.method = method;
  }
  if (['discover_words', 'practice_with_amy', 'speak_to_staff'].includes(state.stage)) {
    state.stage = 'reunite_hwalbin';
  }
  return true;
}

/**
 * Atomically grant a per-clue or per-NPC Speak reward once.
 */
export function grantSpeakRewardOnce(state, receiptId, coins = 10, description = '') {
  if (!state.rewardReceipts) state.rewardReceipts = {};
  if (state.rewardReceipts[receiptId]) {
    return { granted: false, coins, description, receipt: state.rewardReceipts[receiptId] };
  }
  state.blockWorld.coins += coins;
  const receipt = {
    id: receiptId,
    grantedAt: Date.now(),
    coins,
    description,
  };
  state.rewardReceipts[receiptId] = receipt;
  return { granted: true, coins, description, receipt };
}

/**
 * Atomically grant Stage 1 First Clear rewards (`stage-1-first-clear`) exactly once.
 * Subsequent calls with an existing receipt are strict no-ops.
 */
export function grantStage1ClearReward(state, timestamp = Date.now()) {
  if (state.rewardReceipts?.[STAGE1_REWARD_ID]) {
    state.stage = 'stage1_complete';
    return { granted: false, receipt: state.rewardReceipts[STAGE1_REWARD_ID] };
  }

  if (!state.alphabetPieces.includes('A')) {
    state.alphabetPieces.push('A');
  }

  state.blockWorld.coins += 100;
  for (const blockId of STAGE1_REWARD_BLOCKS) {
    if (!state.blockWorld.unlockedBlocks.includes(blockId)) {
      state.blockWorld.unlockedBlocks.push(blockId);
    }
  }
  state.blockWorld.decorations.paper_airplane_deco.owned = Math.max(
    1,
    state.blockWorld.decorations.paper_airplane_deco.owned
  );

  const receipt = {
    id: STAGE1_REWARD_ID,
    grantedAt: timestamp,
    speechMethod: state.staffSpeech.method || 'self',
    alphabetPiece: 'A',
    coins: 100,
    unlockedBlocks: [...STAGE1_REWARD_BLOCKS],
    decoration: 'paper_airplane_deco',
  };
  state.rewardReceipts[STAGE1_REWARD_ID] = receipt;
  state.stage = 'stage1_complete';
  return { granted: true, receipt };
}

/**
 * Place a block or special decoration in the 16x16x8 Block World.
 */
export function placeBlockInWorld(state, x, y, z, blockType) {
  if (
    !Number.isInteger(x) || x < 0 || x >= BLOCK_WORLD_DIMS.width ||
    !Number.isInteger(y) || y < 0 || y >= BLOCK_WORLD_DIMS.depth ||
    !Number.isInteger(z) || z < 0 || z >= BLOCK_WORLD_DIMS.height
  ) {
    return { ok: false, reason: '건축 공간(16×16×8) 범위를 벗어났어요.' };
  }
  const spec = BLOCK_CATALOG[blockType];
  if (!spec) return { ok: false, reason: '알 수 없는 블록 종류예요.' };

  const bw = state.blockWorld;
  const existingIdx = bw.blocks.findIndex(b => b.x === x && b.y === y && b.z === z);
  if (existingIdx >= 0) {
    return { ok: false, reason: '이미 블록이 놓여 있는 칸이에요.' };
  }

  if (spec.isDecoration) {
    const deco = bw.decorations[blockType];
    if (!deco || deco.owned <= 0) {
      return { ok: false, reason: '아직 이 특별 장식을 보유하고 있지 않아요.' };
    }
    if (deco.placed >= deco.owned) {
      return { ok: false, reason: '종이비행기 장식은 이미 배치되어 있어요. 철거하면 다른 곳에 다시 배치할 수 있어요!' };
    }
    deco.placed += 1;
  } else {
    if (!bw.unlockedBlocks.includes(blockType)) {
      return { ok: false, reason: '아직 해금되지 않은 블록이에요.' };
    }
  }

  bw.blocks.push({ x, y, z, type: blockType });
  return { ok: true };
}

/**
 * Remove a block or special decoration at (x, y, z).
 * If a special decoration is removed, its placed count is decremented so it can be placed again.
 */
export function removeBlockFromWorld(state, x, y, z) {
  const bw = state.blockWorld;
  const idx = bw.blocks.findIndex(b => b.x === x && b.y === y && b.z === z);
  if (idx < 0) return { ok: false, reason: '해당 위치에 철거할 블록이 없어요.' };
  const [removed] = bw.blocks.splice(idx, 1);
  if (BLOCK_CATALOG[removed.type]?.isDecoration && bw.decorations[removed.type]) {
    bw.decorations[removed.type].placed = Math.max(0, bw.decorations[removed.type].placed - 1);
  }
  return { ok: true, removed };
}

/**
 * Unlock a shop block using coins. Idempotent if already unlocked.
 */
export function unlockShopBlockInWorld(state, blockId) {
  const shopItem = SHOP_BLOCKS[blockId];
  if (!shopItem) return { ok: false, reason: '상점에 없는 블록이에요.' };
  const bw = state.blockWorld;
  if (bw.unlockedBlocks.includes(blockId)) {
    return { ok: true, alreadyUnlocked: true };
  }
  if (bw.coins < shopItem.price) {
    return { ok: false, reason: `코인이 부족해요. (필요: ${shopItem.price} 코인, 보유: ${bw.coins} 코인)` };
  }
  bw.coins -= shopItem.price;
  bw.unlockedBlocks.push(blockId);
  return { ok: true, alreadyUnlocked: false };
}
