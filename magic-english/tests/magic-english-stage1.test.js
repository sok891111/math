import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE1_REWARD_ID,
  STAGE1_WORDS,
  currentStageGoal,
  createAirportHallMap,
} from '../magic-english-story.js';
import {
  normalizeSpeechText,
  evaluateStage1Speech,
  evaluateWordSimilarity60,
  resolveElevenLabsClip,
} from '../magic-english-speech.js';
import { STAGE1_AUDIO_MANIFEST } from '../assets/audio/stage1/manifest.js';
import fs from 'node:fs';
import path from 'node:path';
import {
  magicEnglishSaveKey,
  createInitialMagicEnglishState,
  parseMagicEnglishState,
  serializeMagicEnglishState,
  recordWordDiscovery,
  recordPracticeCompletion,
  recordStaffSpeechCompletion,
  grantStage1ClearReward,
  placeBlockInWorld,
  removeBlockFromWorld,
  unlockShopBlockInWorld,
} from '../magic-english-storage.js';

test('save keys are strictly separated from existing Pokemon saves and separated per personal code', () => {
  assert.equal(magicEnglishSaveKey(null), 'magic-english-save-v1:guest');
  assert.equal(magicEnglishSaveKey({ id: 'kid-01' }), 'magic-english-save-v1:kid-01');
  assert.equal(magicEnglishSaveKey({ id: 'kid-02' }), 'magic-english-save-v1:kid-02');
  assert.notEqual(magicEnglishSaveKey({ id: 'kid-01' }), 'tralalerio-save-v1:kid-01');
});

test('corrupted or unreadable save is rejected without auto-resetting', () => {
  const badJson = parseMagicEnglishState('{corrupted-json');
  assert.equal(badJson.ok, false);
  assert.equal(badJson.error, 'corrupt-json');
  assert.equal(badJson.state, null);

  const badSchema = parseMagicEnglishState(JSON.stringify({ version: 1, stage: 'unknown_stage' }));
  assert.equal(badSchema.ok, false);
  assert.equal(badSchema.error, 'invalid-schema');
  assert.equal(badSchema.state, null);
});

test('three words (Airplane, Apple, Ask) can be discovered in any order and repeat investigations never duplicate progress', () => {
  const s = createInitialMagicEnglishState();
  s.stage = 'discover_words';

  // Discover Ask first, then Apple, then repeat Ask, then Airplane
  const r1 = recordWordDiscovery(s, 'ask');
  assert.equal(r1.newlyDiscovered, true);
  assert.equal(r1.allDiscovered, false);
  assert.equal(s.stage, 'discover_words');

  const r1Repeat = recordWordDiscovery(s, 'ask');
  assert.equal(r1Repeat.newlyDiscovered, false);
  assert.equal(r1Repeat.allDiscovered, false);

  const r2 = recordWordDiscovery(s, 'apple');
  assert.equal(r2.newlyDiscovered, true);
  assert.equal(r2.allDiscovered, false);

  const r3 = recordWordDiscovery(s, 'airplane');
  assert.equal(r3.newlyDiscovered, true);
  assert.equal(r3.allDiscovered, true);
  assert.equal(s.stage, 'practice_with_amy');

  // Verify each word distinguishes letter name vs word sound
  for (const w of Object.values(STAGE1_WORDS)) {
    assert.ok(w.letterName.includes('에이'));
    assert.ok(w.wordSound.length > 0);
    assert.ok(w.soundCompare.includes('글자 이름'));
  }
});

test('speech evaluation accepts case/punctuation variations and explicit allowed phrases, rejecting arbitrary sounds or unrelated words', () => {
  assert.equal(normalizeSpeechText('  Excuse me! Can I ask?! '), 'excuse me can i ask');

  // Full sentence variations
  assert.equal(evaluateStage1Speech('Excuse me. Can I ask?', 'full').ok, true);
  assert.equal(evaluateStage1Speech('EXCUSE ME, can i ask', 'full').ok, true);
  assert.equal(evaluateStage1Speech('Excuse me may I ask you?', 'full').ok, true);
  assert.equal(evaluateStage1Speech('익스큐즈 미 캔 아이 애스크', 'full').ok, true);

  // Split mode parts
  assert.equal(evaluateStage1Speech('Excuse me!', 'excuse_me').ok, true);
  assert.equal(evaluateStage1Speech('Can I ask?', 'can_i_ask').ok, true);

  // Reject random noise, partial match in full mode, or unrelated words
  assert.equal(evaluateStage1Speech('', 'full').ok, false);
  assert.equal(evaluateStage1Speech('aaa hmmm noise', 'full').ok, false);
  assert.equal(evaluateStage1Speech('hello apple airplane', 'full').ok, false);
  assert.equal(evaluateStage1Speech('Excuse me', 'full').ok, false);
  assert.equal(evaluateStage1Speech('Can I ask', 'full').ok, false);

  // Section 7.3: 60% edit-distance similarity and stop-word stripping
  const antMatch = evaluateWordSimilarity60('I said and', 'ant');
  assert.equal(antMatch.passed, true);
  assert.equal(antMatch.letterMatch, 67);

  const appleMatch = evaluateWordSimilarity60('the apple', 'apple');
  assert.equal(appleMatch.passed, true);
  assert.equal(appleMatch.letterMatch, 100);
});

test('all 41 pre-generated ElevenLabs NPC, Boss Battle, and word MP3 files exist and map cleanly', () => {
  const keys = Object.keys(STAGE1_AUDIO_MANIFEST);
  assert.equal(keys.length, 41);
  for (const item of Object.values(STAGE1_AUDIO_MANIFEST)) {
    assert.ok(fs.existsSync(item.src), `Missing MP3 file: ${item.src}`);
    const stat = fs.statSync(item.src);
    assert.ok(stat.size > 10000, `MP3 file too small: ${item.src} (${stat.size} bytes)`);
  }
  assert.equal(resolveElevenLabsClip('Are you okay? What happened?')?.id, 'traveler_are_you_okay');
  assert.equal(resolveElevenLabsClip('Sure! How can I help you?')?.id, 'staff_sure_help');
  assert.equal(resolveElevenLabsClip('Excuse me. Can I ask?')?.id, 'sentence_ask');
  assert.equal(resolveElevenLabsClip('Apple')?.id, 'word_apple');
  assert.ok(STAGE1_AUDIO_MANIFEST.misspell_battle_start);
  assert.ok(STAGE1_AUDIO_MANIFEST.misspell_hit_1);
  assert.ok(STAGE1_AUDIO_MANIFEST.misspell_hit_2);
  assert.ok(STAGE1_AUDIO_MANIFEST.misspell_defeated);
});

test('self-spoken and assisted completions are distinguished in save state while both unlock Hwalbin and grant identical rewards once', () => {
  const airport = createAirportHallMap();

  const selfState = createInitialMagicEnglishState();
  selfState.map = 'AirportHall';
  selfState.stage = 'speak_to_staff';
  // Doorway to Lost & Found (17, 5) is locked before speaking to staff
  assert.equal(airport.isPassable(selfState, 17, 5), false);

  recordStaffSpeechCompletion(selfState, 'self');
  assert.equal(selfState.staffSpeech.completed, true);
  assert.equal(selfState.staffSpeech.method, 'self');
  assert.equal(selfState.stage, 'reunite_hwalbin');
  assert.equal(airport.isPassable(selfState, 17, 5), true);

  const assistedState = createInitialMagicEnglishState();
  assistedState.map = 'AirportHall';
  assistedState.stage = 'speak_to_staff';
  recordPracticeCompletion(assistedState, 'assisted');
  recordStaffSpeechCompletion(assistedState, 'assisted');
  assert.equal(assistedState.practice.method, 'assisted');
  assert.equal(assistedState.staffSpeech.method, 'assisted');
  assert.equal(assistedState.stage, 'reunite_hwalbin');
  assert.equal(airport.isPassable(assistedState, 17, 5), true);

  // Grant rewards to both and verify identical reward contents and strict 1-time idempotency
  const g1 = grantStage1ClearReward(selfState, 1000);
  const g2 = grantStage1ClearReward(assistedState, 1000);
  assert.equal(g1.granted, true);
  assert.equal(g2.granted, true);
  assert.deepEqual(selfState.alphabetPieces, ['A']);
  assert.deepEqual(assistedState.alphabetPieces, ['A']);
  assert.equal(selfState.blockWorld.coins, 100);
  assert.equal(assistedState.blockWorld.coins, 100);
  assert.equal(selfState.blockWorld.decorations.paper_airplane_deco.owned, 1);
  assert.equal(assistedState.blockWorld.decorations.paper_airplane_deco.owned, 1);

  // Repeat reward calls (simulating re-talking, refreshing, or re-entering Block World) must NOT add coins or duplicate pieces
  const repeat = grantStage1ClearReward(selfState, 2000);
  assert.equal(repeat.granted, false);
  assert.equal(selfState.blockWorld.coins, 100);
  assert.deepEqual(selfState.alphabetPieces, ['A']);
  assert.ok(selfState.rewardReceipts[STAGE1_REWARD_ID]);
});

test('16x16x8 block world supports placement, removal, special decoration reuse, shop unlocking, and full save/restore', () => {
  const s = createInitialMagicEnglishState();
  grantStage1ClearReward(s, 12345);

  // Place starter block and Stage 1 unlocked airport block
  assert.equal(placeBlockInWorld(s, 0, 0, 0, 'dirt').ok, true);
  assert.equal(placeBlockInWorld(s, 0, 0, 1, 'airport_glass').ok, true);

  // Place special paper airplane decoration (owned: 1)
  assert.equal(placeBlockInWorld(s, 5, 5, 0, 'paper_airplane_deco').ok, true);
  assert.equal(s.blockWorld.decorations.paper_airplane_deco.placed, 1);
  // Cannot place a second paper airplane while the first is placed
  assert.equal(placeBlockInWorld(s, 6, 6, 0, 'paper_airplane_deco').ok, false);

  // Removing the paper airplane decoration returns it to inventory so it can be placed again
  assert.equal(removeBlockFromWorld(s, 5, 5, 0).ok, true);
  assert.equal(s.blockWorld.decorations.paper_airplane_deco.placed, 0);
  assert.equal(placeBlockInWorld(s, 7, 7, 0, 'paper_airplane_deco').ok, true);
  assert.equal(s.blockWorld.decorations.paper_airplane_deco.placed, 1);

  // Unlock shop block with coins (costs 50 of 100 coins)
  const unlock = unlockShopBlockInWorld(s, 'gold_a_block');
  assert.equal(unlock.ok, true);
  assert.equal(s.blockWorld.coins, 50);
  assert.equal(placeBlockInWorld(s, 2, 2, 0, 'gold_a_block').ok, true);

  // Out-of-bounds placement is rejected (16x16x8 bounds)
  assert.equal(placeBlockInWorld(s, 16, 0, 0, 'dirt').ok, false);
  assert.equal(placeBlockInWorld(s, 0, 0, 8, 'dirt').ok, false);

  // Serialize and restore
  const raw = serializeMagicEnglishState(s);
  const restored = parseMagicEnglishState(raw);
  assert.equal(restored.ok, true);
  assert.equal(restored.state.blockWorld.coins, 50);
  assert.equal(restored.state.blockWorld.blocks.length, 4);
  assert.equal(restored.state.blockWorld.decorations.paper_airplane_deco.placed, 1);
  assert.ok(currentStageGoal(restored.state).includes('Stage 2'));
});
