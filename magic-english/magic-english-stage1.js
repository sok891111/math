import {walkingPortal} from './magic-english-portals.js';
import {dialogueCharacter} from './character-voices.js';
import {createTravel, departure, arrival} from './world-travel.js';
import {AirportLife, OPTIONAL_NPC_PRAISE} from './magic-english-airport-life.js';
import {assessLearningSpeech, ensureLearningState, REPEAT_DIALOGUES} from './magic-english-learning.js';
import {ensureStage2, stage2Goal, createStage2Maps, renderStage2Map, STAGE2_WORDS, STAGE2_CHECKLIST, advanceStage2} from './magic-english-stage2.js';
// Magic English Stage 1 Main Controller
// Implements natural turn-based NPC & Clue conversations with in-dialogue ElevenLabs Guide Voice + Speak (STT) + Rewards.

import {
  STAGE1_REWARD_ID,
  STAGE1_WORDS,
  STAGE1_CHECKLIST,
  currentStageGoal,
  JOSEON_MARKET_MAP,
  createAirportHallMap,
} from './magic-english-story.js';
import {
  speakEnglishPhrase,
  preloadCharacterVoice,
  warmCharacterVoices,
  cancelActiveVoice,
  createSpeechRecognizer,
} from './magic-english-speech.js';
import {
  magicEnglishSaveKey,
  createInitialMagicEnglishState,
  parseMagicEnglishState,
  serializeMagicEnglishState,
  recordWordDiscovery,
  recordPracticeCompletion,
  recordStaffSpeechCompletion,
  grantSpeakRewardOnce,
  grantStage1ClearReward,
} from './magic-english-storage.js';
import {
  renderJoseonMarketMap,
  renderAirportHallMap,
  updateMapLabelsOverlay,
} from './magic-english-map-renderer.js';
import { walkingPose, PlayerWalk, MOVEMENT_TIMING } from './overworld-player.js?v=20261018-table19';
import { DIRECTIONS } from './engine.js?v=20261025-early1';

function detectVoiceClipForDialogPage(text) {
  if (!text) return null;
  if (text.includes('Are you okay?')) return 'traveler_are_you_okay';
  if (text.includes('TIXE') && text.includes('히히히')) return 'misspell_exit_tixe';
  if (text.includes('나는 에이미야') || text.includes('Welcome to America')) return 'amy_hello_gildong';
  if (text.includes('오늘의 알파벳은 A!')) return 'ringo_intro_a';
  if (text.includes('When you don’t know') || text.includes('Ask는 ‘묻다’')) return 'amy_teach_ask';
  if (text.includes('Try again!')) return 'amy_try_again';
  if (text.includes('Hello! Can I help you?')) return 'staff_hello_help';
  if (text.includes('Sure! How can I help you?')) return 'staff_sure_help';
  if (text.includes('My friend. Help, please!')) return 'gildong_my_friend_help';
  if (text.includes('Your friend is in the Lost') || text.includes('Your friend is over there')) return 'staff_friend_over_there';
  if (text.includes('Ding! Correct!')) return 'ringo_ding_correct';
  if (text.includes('Help! 도와줘!') || text.includes('Thank you, Gildong!')) return 'hwalbin_help_thank_you';
  if (text.includes('BUS') && text.includes('SUB')) return 'misspell_bus_sub';
  return null;
}

export async function startMagicEnglishStage1App() {
  const $ = s => document.querySelector(s);
  const canvas = $('#screen');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const screenWrap = document.querySelector('.screen-wrap');
  let mapLabelsOverlay = $('#map-labels-overlay');
  if (!mapLabelsOverlay && screenWrap) {
    mapLabelsOverlay = document.createElement('div');
    mapLabelsOverlay.id = 'map-labels-overlay';
    mapLabelsOverlay.className = 'me-map-labels-overlay';
    mapLabelsOverlay.setAttribute('aria-hidden', 'true');
    screenWrap.insertBefore(mapLabelsOverlay, $('#loading'));
  }

  const AIRPORT_MAP = createAirportHallMap();
  const STAGE2_MAPS = createStage2Maps();
  const airportLife=new AirportLife();
  const airportObjects=AIRPORT_MAP.getObjects.bind(AIRPORT_MAP);
  AIRPORT_MAP.getObjects=state=>airportLife.objects(airportObjects(state));
  const busStopObjects=STAGE2_MAPS.BusStop.getObjects.bind(STAGE2_MAPS.BusStop);
  STAGE2_MAPS.BusStop.getObjects=state=>airportLife.objects(busStopObjects(state));
  const nextStopObjects=STAGE2_MAPS.NextStop.getObjects.bind(STAGE2_MAPS.NextStop);
  STAGE2_MAPS.NextStop.getObjects=state=>airportLife.objects(nextStopObjects(state));
  const MAPS = {
    JoseonMarket: JOSEON_MARKET_MAP,
    AirportHall: AIRPORT_MAP,
    ...STAGE2_MAPS,
  };

  const user = window.__BLOCK_USER__ || (new URLSearchParams(location.search).get('user') ? {id:new URLSearchParams(location.search).get('user')} : null);
  const saveKey = magicEnglishSaveKey(user);
  const playerWalk = new PlayerWalk();
  const followerWalk = new PlayerWalk();
  const speechRecognizer = createSpeechRecognizer();

  const spriteNames = [
    'me_gildong',
    'me_hwalbin',
    'me_amy',
    'me_ringo',
    'me_misspell',
    'me_staff',
    'me_traveler',
    'me_merchant',
    'me_kid',
    'me_nono',
    'me_copycat',
  ];
  const images = {};

  let state = createInitialMagicEnglishState();
  let followerState = { x: 16, y: 3, facing: 'down' };
  let saveCorruptedError = null;
  let dialog = null;
  let menuOpen = false;
  let cutsceneLocked = false;
  let toastTimer = null;
  let nextMove = 0;
  let pendingWalkPortal=null;
  const held = new Set();

  function isHwalbinFollowing() {
    return Boolean(
      state.map !== 'JoseonMarket' &&
        (state.rewardReceipts?.['hwalbin-rescued'] ||
          state.rewardReceipts?.[STAGE1_REWARD_ID] ||
          ['battle_misspell', 'stage1_complete'].includes(state.stage))
    );
  }

  function syncFollowerToPlayer() {
    const opp = {
      up: [0, 1],
      down: [0, -1],
      left: [1, 0],
      right: [-1, 0],
    }[state.facing] || [-1, 0];
    const candidates = [
      [state.x + opp[0], state.y + opp[1]],
      [state.x - 1, state.y],
      [state.x + 1, state.y],
      [state.x, state.y + 1],
      [state.x, state.y - 1],
    ];
    for (const [cx, cy] of candidates) {
      if (currentMap().isPassable(state, cx, cy)) {
        followerState = { x: cx, y: cy, facing: state.facing };
        followerWalk.reset();
        return;
      }
    }
    followerState = { x: state.x, y: state.y, facing: state.facing };
    followerWalk.reset();
  }

  const interactiveModal = document.createElement('dialog');
  interactiveModal.id = 'magic-english-modal';
  interactiveModal.className = 'me-modal';
  document.body.append(interactiveModal);

  function toast(text) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 2800);
  }

  function persist() {
    if (saveCorruptedError) return false;
    try {
      localStorage.setItem(saveKey, serializeMagicEnglishState(state));
      const note = $('#save-note');
      if (note) note.textContent = `자동 저장됨 (${saveKey})`;
      return true;
    } catch {
      toast('브라우저 저장 공간을 확인해 주세요.');
      return false;
    }
  }

  const blockUser = typeof user === 'string' ? user : user?.id || new URLSearchParams(location.search).get('user') || 'demo';
  let delivering = false;
  async function flushRewards() {
    if (delivering || saveCorruptedError) return;
    delivering = true;
    try {
      for (const reward of [...ensureLearningState(state).pending]) {
        const response = await fetch('/api/magic-english/rewards', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...reward,userId:blockUser})});
        if (!response.ok) break;
        state.learning.pending = state.learning.pending.filter(r=>r.id!==reward.id);
        persist();
      }
    } catch { /* Outbox is saved and retried on reconnect. */ }
    finally {delivering=false;}
  }
  function queueReward(reward) {
    const learning=ensureLearningState(state);
    if (!learning.pending.some(r=>r.id===reward.id)) learning.pending.push(reward);
    persist(); void flushRewards();
  }
  function milestone(stage) {
    for (const type of ['fragment','clear']) {
      const id=`stage${stage}:${type}:v2`;
      if (!state.rewardReceipts[id]) {state.rewardReceipts[id]={id};queueReward({id,type,stage});}
    }
  }
  const travelToWorld=createTravel({save:persist,navigate:url=>location.assign(url),animate:departure});
  const blockWorldUI = {
    active:()=>false, close:()=>{},
    open:()=>{void flushRewards();const returnTo=location.pathname+location.search;
      return travelToWorld('/magic-english/block-world?user='+encodeURIComponent(blockUser)+'&controls=easy&returnTo='+encodeURIComponent(returnTo),'🧱 내 블록 세계로 여행하는 중…');},
  };
  window.addEventListener('online',flushRewards);
  setInterval(flushRewards,10000);

  function anyModalOpen() {
    return interactiveModal.open || blockWorldUI.active();
  }

  function currentMap() {
    return MAPS[state.map] || AIRPORT_MAP;
  }

  function say(speaker, pages, done = null, choices = null, comicImage = null) {
    speechRecognizer.cancel();
    cancelActiveVoice();
    const learning=ensureLearningState(state);learning.praised??={};
    const pageList=(Array.isArray(pages)?pages:[pages]).filter(page=>page?.type!=='praise'||!learning.praised[page.npcId]);
    for(const page of pageList){if(typeof page!=='object'||!page)continue;const voice=page.type==='speak'?page.guideClip||page.targetPhrase:page.voiceClip;if(voice)void preloadCharacterVoice(voice,page.type==='speak'?'amy':dialogueCharacter(page.speaker||speaker,page.text)).catch(()=>{});}
    dialog = {
      speaker,
      pages: pageList,
      index: 0,
      done,
      choices,
      comicImage,
      speakState: null,
    };
    held.clear();
    renderDialog();
  }

  function renderDialog() {
    const el = $('#dialog');
    if (mapLabelsOverlay) {
      mapLabelsOverlay.classList.toggle('dimmed', Boolean(dialog || menuOpen));
    }
    el.hidden = !dialog;
    if (!dialog) return;

    const rawStep = dialog.pages[dialog.index];
    if(rawStep?.type==='praise'&&!rawStep.prepared){
      const learning=ensureLearningState(state),variants=OPTIONAL_NPC_PRAISE[rawStep.npcId];
      const [english,korean]=variants[(learning.praiseSequence||0)%variants.length];
      rawStep.text=`에이미: “${english} ${korean}${learning.lastQuality==='complete'?' 문장으로 마음을 전했어!':''}”`;rawStep.voiceClip=english;rawStep.prepared=true;
      learning.praiseSequence=(learning.praiseSequence||0)+1;learning.praised[rawStep.npcId]=true;persist();
    }
    const isSpeakTurn = typeof rawStep === 'object' && rawStep !== null && rawStep.type === 'speak';
    const isBadgeRevealTurn = typeof rawStep === 'object' && rawStep !== null && rawStep.type === 'badge_reveal';
    const isObjectNpc = typeof rawStep === 'object' && rawStep !== null && !isSpeakTurn;

    const currentSpeaker = (isSpeakTurn || isObjectNpc ? rawStep.speaker : null) || dialog.speaker;
    const pageText = isSpeakTurn
      ? rawStep.prompt || '가이드 음성을 듣고 Speak 버튼을 눌러 영어로 말해 보세요!'
      : isObjectNpc
      ? rawStep.text
      : String(rawStep);

    $('#speaker').textContent = currentSpeaker;
    $('#dialog-text').textContent = pageText;

    // Optional Boss Battle HP Bar at top of dialog
    const bossInfo = typeof rawStep === 'object' && rawStep !== null ? rawStep.bossBattle : null;
    let bossHpEl = $('#dialog-boss-hp');
    if (bossInfo) {
      if (!bossHpEl) {
        bossHpEl = document.createElement('div');
        bossHpEl.id = 'dialog-boss-hp';
        bossHpEl.className = 'me-boss-hp-bar';
        el.insertBefore(bossHpEl, $('#speaker'));
      }
      const hearts =
        '✨'.repeat(Math.max(0, bossInfo.hp)) +
        '·'.repeat(Math.max(0, bossInfo.maxHp - Math.max(0, bossInfo.hp)));
      const pct = Math.max(0, Math.min(100, Math.round((bossInfo.hp / bossInfo.maxHp) * 100)));
      bossHpEl.innerHTML = `
        <div class="me-boss-hp-top">
          <span class="me-boss-name">😈 ${bossInfo.name || '보스 미스터 미스스펠'}</span>
          <span class="me-boss-hearts" aria-label="남은 글자 마법 ${bossInfo.hp}/${bossInfo.maxHp}">${hearts} <b>${bossInfo.hp}/${bossInfo.maxHp}</b></span>
        </div>
        <div class="me-boss-hp-track">
          <div class="me-boss-hp-fill ${bossInfo.hp <= 1 ? 'low' : ''}" style="width:${pct}%"></div>
        </div>
      `;
      bossHpEl.hidden = false;
    } else if (bossHpEl) {
      bossHpEl.hidden = true;
    }

    // Optional Giant Alphabet Gym Badge Reveal Showcase inside dialog
    let badgeShowEl = $('#dialog-badge-showcase');
    if (isBadgeRevealTurn) {
      if (!badgeShowEl) {
        badgeShowEl = document.createElement('div');
        badgeShowEl.id = 'dialog-badge-showcase';
        badgeShowEl.className = 'me-badge-showcase';
        el.insertBefore(badgeShowEl, $('#choices'));
      }
      const isStage2Badge = rawStep.letter === 'B';
      badgeShowEl.innerHTML = `
        <span class="me-badge-showcase-kicker">🏆 MAGIC LETTER #0${isStage2Badge ? '2' : '1'} · ALPHABET PIECE</span>
        <div class="me-badge-giant-emblem" role="img" aria-label="황금 ${rawStep.letter || 'A'} 알파벳 조각">
          <span class="me-badge-giant-letter">${rawStep.letter || 'A'}</span>
          <span class="me-badge-giant-sub">${isStage2Badge ? 'STAGE 2' : 'STAGE 1'}</span>
        </div>
        <div class="me-badge-showcase-title">${rawStep.badgeTitle || '황금 알파벳 「A」 알파벳 조각 획득!'}</div>
        <div class="me-badge-showcase-words">
          ${
            isStage2Badge
              ? `<span>🚌 Bus [bʌs]</span><span>🎒 Bag [bæɡ]</span><span>🐘 Big [bɪɡ]</span>`
              : `<span>✈️ Airplane [ˈeər.pleɪn]</span><span>🍎 Apple [ˈæp.əl]</span><span>❓ Ask [æsk]</span>`
          }
        </div>
      `;
      badgeShowEl.hidden = false;
    } else if (badgeShowEl) {
      badgeShowEl.hidden = true;
    }

    // Optional comic / clue image thumbnail inside dialog
    const imgSrc = (isSpeakTurn || isObjectNpc ? rawStep.image : null) || dialog.comicImage;
    let preview = $('#dialog-comic-preview');
    if (imgSrc && !isSpeakTurn && !isBadgeRevealTurn) {
      if (!preview) {
        preview = document.createElement('img');
        preview.id = 'dialog-comic-preview';
        preview.className = 'me-dialog-comic';
        el.insertBefore(preview, $('#dialog-text'));
      }
      preview.src = imgSrc;
      preview.alt = currentSpeaker;
      preview.hidden = false;
    } else if (preview) {
      preview.hidden = true;
    }

    // Optional Reward Banner on NPC reply turn
    let rewardEl = $('#dialog-reward-banner');
    const rewardBannerText = isObjectNpc
      ? typeof rawStep.rewardBanner === 'function'
        ? rawStep.rewardBanner()
        : rawStep.rewardBanner
      : null;
    if (rewardBannerText) {
      if (!rewardEl) {
        rewardEl = document.createElement('div');
        rewardEl.id = 'dialog-reward-banner';
        rewardEl.className = 'me-dialog-reward-banner';
        el.insertBefore(rewardEl, $('#choices'));
      }
      rewardEl.textContent = isBadgeRevealTurn ? '🏆 알파벳 조각: 철 1개 · Stage 완료: 나무·흙·철 각 5개' : (typeof rawStep.rewardBanner==='string' ? rewardBannerText : rawStep.speaker?.includes('활빈') ? '💛 활빈과 함께 여행해요!' : ensureLearningState(state).lastRewardQuantity ? '🪵 나무 블록 +'+state.learning.lastRewardQuantity+'개 · 내 블록 세계로 전달해요!' : rewardBannerText);
      rewardEl.hidden = false;
    } else if (rewardEl) {
      rewardEl.hidden = true;
    }

    // Clean up or render Speak Turn UI vs NPC Turn UI
    let speakBox = $('#dialog-speak-box');
    const oldVoiceBtn = $('#dialog-voice-replay');
    if (oldVoiceBtn) oldVoiceBtn.remove();

    if (isSpeakTurn) {
      $('#dialog-next').hidden = true;
      $('#choices').replaceChildren();

      if (!speakBox) {
        speakBox = document.createElement('div');
        speakBox.id = 'dialog-speak-box';
        speakBox.className = 'me-turn-speak-box';
        el.insertBefore(speakBox, $('#choices'));
      }
      speakBox.hidden = false;

      if (!dialog.speakState || dialog.speakState.stepIndex !== dialog.index) {
        dialog.speakState = {
          stepIndex: dialog.index,
          statusType: 'info',
          statusText: '💡 먼저 가이드 음성을 듣고, 🎙️ Speak를 눌러 따라 말해 보세요!',
          autoPlayed: false,
        };
      }

      const st = dialog.speakState;
      const isRec = speechRecognizer.isRecording();

      speakBox.innerHTML = `
        <div class="me-turn-guide ${isRec ? 'recording' : st.statusType === 'success' ? 'success' : ''}">
          <div class="me-turn-guide-top">
            <span class="me-turn-badge">${isRec ? '🔴 영어를 읽고 Complete를 눌러 주세요!' : '🗣️ 내가 말할 영어 가이드'}</span>
            ${rawStep.rewardHint ? `<span class="me-turn-reward-pill">🎁 ${rawStep.rewardHint}</span>` : ''}
          </div>
          <div class="me-turn-phrase">“${rawStep.targetPhrase}”</div>
          ${rawStep.phonetic ? `<div class="me-turn-phonetic">${rawStep.phonetic}</div>` : ''}
        </div>
        <div class="me-turn-status ${st.statusType}">${st.statusText}</div>
        <div class="me-turn-actions">
          <button type="button" id="turn-listen-btn" class="me-turn-btn listen">🔊 가이드 듣기</button>
          <button type="button" id="turn-speak-btn" ${st.pending||st.settled?'disabled aria-busy="true"':''} class="me-turn-btn speak ${isRec ? 'recording' : ''}">
            ${st.preparing ? '마이크 준비 중…' : st.pending ? '링고가 듣고 있어!' : isRec ? '⏹️ Complete' : '🎙️ Speak'}
          </button>
          <button type="button" id="turn-myvoice-btn" class="me-turn-btn myvoice" ${!speechRecognizer.hasMyVoice() ? 'disabled' : ''}>
            🎧 내 목소리
          </button>
          <button type="button" id="turn-close-btn" class="me-turn-btn skip">닫기</button>
        </div>
      `;

      speakBox.querySelector('#turn-listen-btn').onclick = e => {
        e.stopPropagation();
        if(!speechRecognizer.isRecording()&&!st.pending)speakEnglishPhrase(rawStep.guideClip || rawStep.targetPhrase,{character:'amy'});
      };

      speakBox.querySelector('#turn-myvoice-btn').onclick = e => {
        e.stopPropagation();
        speechRecognizer.playMyVoice();
      };

      speakBox.querySelector('#turn-close-btn').onclick = e => {
        e.stopPropagation();
        speechRecognizer.cancel();
        cancelActiveVoice();
        cutsceneLocked = false;
        dialog = null;
        renderDialog();
        canvas.focus({ preventScroll: true });
      };

      speakBox.querySelector('#turn-speak-btn').onclick = e => {
        e.stopPropagation();
        if (speechRecognizer.isRecording()) {
          speechRecognizer.stop();
          st.statusType = 'info';
          st.statusText = '링고가 듣고 있어!';
          renderDialog();
          return;
        }

        const turnDialog = dialog;
        const attemptId = globalThis.crypto?.randomUUID?.() || 'speech-'+Date.now()+'-'+Math.random().toString(36).slice(2);
        const stillHere = () => dialog === turnDialog && dialog?.speakState === st;
        speechRecognizer.start({
          userId:blockUser, attemptId,
          target: rawStep.targetKey || 'full',
          onPreparing:()=>{if(stillHere()){st.pending=true;st.preparing=true;st.statusText='마이크를 준비하고 있어요…';renderDialog();}},
          onProcessing:()=>{if(stillHere()&&!st.settled){st.pending=true;st.statusType='info';st.statusText='링고가 듣고 있어!';renderDialog();}},
          onStart: () => {
            if(!stillHere())return;st.pending=false;st.preparing=false;
            st.statusType = 'recording';
            st.statusText = `🎙️ 녹음 중… “${rawStep.targetPhrase}”라고 말한 뒤 [⏹️ Complete]를 눌러 주세요!`;
            renderDialog();
          },
          onResult: (transcript, _alts, serverAssessment) => {
            if (!stillHere() || st.settled) return;
            st.pending=false;
            const outcome = serverAssessment || assessLearningSpeech(transcript,rawStep.targetKey || 'full');
            if (!outcome.passed) {finishUnheard(turnDialog,st);return;}
            st.settled=true;
            const learning=ensureLearningState(state); learning.failures=0; learning.lastFeedback=outcome.message;learning.lastQuality=outcome.quality; learning.lastRewardQuantity=outcome.quantity || 1;
            if(serverAssessment?.rewardToken) queueReward({id:attemptId,type:'speech',token:serverAssessment.rewardToken});
            st.statusType='success';
            st.statusText=`💬 ${outcome.message} 🪵 나무 블록 +${outcome.quantity || 1}개`;
            rawStep.onPass?.('self'); persist();updateSidebar();renderDialog();
            setTimeout(()=>{if(stillHere())advanceDialog(true);},750);
          },
          onError: () => {st.pending=false;if(stillHere()&&!st.settled) finishUnheard(turnDialog,st);},
          onEnd: () => {
            if(!stillHere())return;st.pending=false;st.preparing=false;
            renderDialog();
          },
        });
      };

      if (!st.autoPlayed) {
        st.autoPlayed = true;
        speakEnglishPhrase(rawStep.guideClip || rawStep.targetPhrase,{character:'amy'});
      }
      return;
    }

    // Standard NPC Turn (No replay button; plays NPC voice automatically once per turn)
    if (speakBox) speakBox.hidden = true;

    const voiceClipId = (isObjectNpc && rawStep.voiceClip) || detectVoiceClipForDialogPage(pageText);
    if (voiceClipId && dialog.voicePlayedIndex !== dialog.index) {
      dialog.voicePlayedIndex=dialog.index;
      speakEnglishPhrase(voiceClipId,{character:dialogueCharacter(currentSpeaker,pageText),onError:()=>toast('목소리를 준비하지 못했어요. 잠시 후 다시 들어 보세요.')});
    }

    const choicesEl = $('#choices');
    choicesEl.replaceChildren();
    const isLast = dialog.index === dialog.pages.length - 1;
    const choosing = isLast && dialog.choices?.length;
    $('#dialog-next').hidden = !!choosing;
    if (choosing) {
      for (const [label, fn] of dialog.choices) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.onclick = () => {
          cancelActiveVoice();
          dialog = null;
          el.hidden = true;
          if (mapLabelsOverlay) mapLabelsOverlay.classList.remove('dimmed');
          fn?.();
          canvas.focus({ preventScroll: true });
        };
        choicesEl.append(b);
      }
    }
  }

  function advanceDialog(forceFromSpeak = false) {
    if (!dialog) return;
    const currentStep = dialog.pages[dialog.index];
    if (currentStep && typeof currentStep === 'object' && currentStep.type === 'speak' && !forceFromSpeak) {
      const speakBtn = $('#turn-speak-btn');
      if (speakBtn) speakBtn.click();
      return;
    }

    speechRecognizer.cancel();
    cancelActiveVoice();
    if (dialog.index === dialog.pages.length - 1 && dialog.choices?.length) {
      $('#choices button')?.focus();
      return;
    }
    dialog.index += 1;
    while (dialog.index < dialog.pages.length) {
      const nextStep = dialog.pages[dialog.index];
      if (nextStep && typeof nextStep === 'object' && typeof nextStep.skipIf === 'function' && nextStep.skipIf()) {
        dialog.index += 1;
      } else {
        break;
      }
    }
    if (dialog.index >= dialog.pages.length) {
      const done = dialog.done;
      dialog = null;
      renderDialog();
      done?.();
      updateSidebar();
    } else {
      renderDialog();
    }
  }

  // 1. Clue Discovery + Speak Practice + Reward (Airplane, Apple, Ask)
  function finishUnheard(turnDialog,st) {
    st.settled=true; ensureLearningState(state).failures++; persist();
    speechRecognizer.cancel(); cancelActiveVoice(); dialog=null; cutsceneLocked=false;
    say('에이미','목소리가 잘 들리지 않았어. 괜찮아, 다음에 다시 이야기하자! (블록 보상 0개)');
  }
  function openRepeatConversation(target) {
    const learning=ensureLearningState(state), variants=REPEAT_DIALOGUES[target.id] || REPEAT_DIALOGUES.npc_amy;
    const count=learning.visits[target.id]||0;learning.visits[target.id]=count+1;persist();
    const [question,phrase,key]=variants[(count-1+variants.length)%variants.length];
    say(target.label||'친구',[
      {type:'npc',speaker:target.label||'친구',text:question,voiceClip:question},
      {type:'speak',prompt:'친구에게 영어로 대답해 보세요!',targetPhrase:phrase,targetKey:key,guideClip:phrase,rewardHint:'말하기 성공: 나무 1개 · 완전한 문장: 2개'},
      {type:'npc',speaker:target.label||'친구',text:'Thanks for stopping by! 또 만나서 반가웠어. 다음에 또 이야기하자!',voiceClip:'Thanks for stopping by! See you again!'},
    ]);
  }
  function enterStage2(map = 'BusStop') {
    if (!state.rewardReceipts[STAGE1_REWARD_ID]) return;
    ensureStage2(state);
    state.map = map;
    state.x = 10;
    state.y = 12;
    state.facing = 'up';
    playerWalk.reset();
    syncFollowerToPlayer();
    persist();
    updateSidebar();
    say(
      '제2화 · 사라진 보따리와 B의 버스! (공항 앞 버스 정류장)',
      [
        {
          type: 'npc',
          speaker: '에이미 & 딩고(활빈)',
          text: '공항 밖 버스 정류장으로 나왔어요! 그런데 길동의 소중한 보따리(주먹밥과 활빈당 표식)가 큰 파란 버스에 실려 가 버렸어요!\n에이미: “보따리가 실린 큰 파란 버스를 찾으려면 먼저 정류장에서 Bus, Bag, Big 단서 3개를 찾아 말해 보자!”',
          voiceClip: 'Let us find the Bus, Bag, and Big clues!',
          image: 'assets/stage2/page03.jpg',
        },
      ]
    );
  }

  function stage2Act(target) {
    const st = ensureStage2(state);
    if (!target) return;
    const go = (map, x = 10, y = 12) => {
      state.map = map;
      state.x = x;
      state.y = y;
      playerWalk.reset();
      syncFollowerToPlayer();
      persist();
      updateSidebar();
    };
    const speak = (phrase, key, onPass, extra = {}) => ({
      type: 'speak',
      prompt: extra.prompt || '🔊 가이드 음성을 듣고 Speak 버튼을 눌러 영어로 말해 보세요!',
      targetPhrase: phrase,
      phonetic: extra.phonetic || '',
      meaningKo: extra.meaningKo || '',
      targetKey: key,
      guideClip: phrase,
      rewardHint: extra.rewardHint || '나무 블록 1개 · 완전한 문장 2개',
      bossBattle: extra.bossBattle || null,
      onPass: () => {
        onPass?.();
        persist();
        updateSidebar();
      },
    });

    if (target.id.startsWith('s2_word_')) {
      const w = target.id.slice(8);
      const info = STAGE2_WORDS[w];
      say(`단서 발견 · ${info.word} (${info.korean})`, [
        {
          type: 'npc',
          speaker: '링고 (Ringo)',
          text: {
            bus: `링고: “It is a Bus ${info.phonetic}! 버스야! 알파벳 B의 이름은 ‘비’지만, 단어 첫소리는 입술을 다물었다 터뜨리는 ‘브(/b/)’ 소리가 나!”`,
            bag: `링고: “My Bag ${info.phonetic} is here! 길동의 소중한 보따리(가방) 흔적이야! Bag도 입술을 붙였다 떼며 ‘브(/b/)’ 소리로 시작해!”`,
            big: `링고: “A Big ${info.phonetic} blue bus! 저기 그려진 파란 버스는 정말 크다(Big)! Big도 ‘브(/b/)’ 소리로 시작해!”`,
          }[w],
          voiceClip: info.sentence,
          image: info.image,
        },
        speak(
          info.word,
          w,
          () => {
            advanceStage2(state,'word',w);
            grantSpeakRewardOnce(state, `s2-clue-${w}`, 10, `${info.word} 단서 말하기 보상`);
          },
          {
            prompt: `🔊 가이드 음성을 듣고 Speak 버튼을 눌러 「${info.word}」를 따라 말해 보세요!`,
            phonetic: info.phonetic,
            meaningKo: info.korean,
            rewardHint: '단서 도감 등록 + 나무 블록 1개',
          }
        ),
        {
          type: 'npc',
          speaker: '링고 & 딩고(활빈)',
          text: `링고: “${info.word} ${info.phonetic}! 아주 또렷한 /b/ 소리였어! 지도에 단서를 기록해 둘게!”`,
          voiceClip: 'Good job! You found the clue!',
        },
      ]);
      return;
    }

    if (target.id === 's2_board') {
      if(st.boarded){go('BusInterior',10,11);return;}
      if (!['bus', 'bag', 'big'].every(w => st.words[w])) {
        const found = ['bus', 'bag', 'big'].filter(w => st.words[w]).length;
        say(
          '딩고(활빈)의 안내 (B 단서 3종 필요)',
          `딩고(활빈): “길동아! 버스에 타기 전에 먼저 정류장에서 Bus [bʌs], Bag [bæɡ], Big [bɪɡ] 단서 세 가지를 모두 찾아 말해 보자! (현재 ${found}/3)”`
        );
        return;
      }
      say(
        '악당 미스터 미스스펠과 오해 삼총사(노노·웅얼이·따라쟁이)의 함정!',
        [
          {
            type: 'npc',
            speaker: '미스터 미스스펠 & 오해 삼총사',
            text: '미스터 미스스펠: “히히히! BUS 글자를 SUB로 바꿔 놓았지! 오해 삼총사 노노·웅얼이·따라쟁이야, 길동이를 엉뚱한 노란 버스로 유인해라!”\n노노 & 따라쟁이: “No, no! This way! Sub! Sub!”',
            voiceClip: 'misspell_bus_sub',
            image: 'assets/stage2/page08.jpg',
          },
          {
            type: 'npc',
            speaker: '홍길동 & 딩고(활빈)',
            text: '홍길동: “앗! 보따리가 실린 큰 파란 버스가 아니라 다른 버스에 타 버렸어!”\n딩고(활빈): “괜찮아 길동아! 공항 안내 데스크에서 배운 것처럼 앞쪽 버스 기사님께 정중히 물어보자!”',
            voiceClip: 'Let us ask the bus driver!',
            image: 'assets/stage2/page09.jpg',
          },
        ],
        () => {
          st.boarded = true;
          advanceStage2(state,'board');
          go('BusInterior', 10, 10);
        }
      );
      return;
    }

    if (target.id === 's2_driver') {
      if (st.driver) {
        openRepeatConversation({ id: 'npc_staff', label: '버스 기사님' });
        return;
      }
      say('버스 기사님께 큰 파란 버스 정류장 묻기', [
        {
          type: 'npc',
          speaker: '버스 기사님 (Bus Driver)',
          text: '버스 기사님: “Hello! Can I help you?”\n(안녕하세요! 무엇을 도와드릴까요?)',
          voiceClip: 'Hello! Can I help you?',
          image: 'assets/stage2/page11.jpg',
        },
        speak('Excuse me. Can I ask?', 'full', null, {
          prompt: '안내 데스크에서 배운 표현으로 정중하게 질문을 시작해 보세요!',
          meaningKo: '실례합니다. 여쭤봐도 될까요?',
        }),
        {
          type: 'npc',
          speaker: '버스 기사님 (Bus Driver)',
          text: '버스 기사님: “Sure! What would you like to know?”\n(그럼요! 무엇이 궁금한가요?)',
          voiceClip: 'Sure! What would you like to know?',
          image: 'assets/stage2/page12.jpg',
        },
        speak(
          'Where is the bus?',
          'where_bus',
          () => {
            advanceStage2(state,'driver');
            grantSpeakRewardOnce(state, 's2-driver-ask', 20, '버스 기사님과 실전 대화 완료');
          },
          {
            prompt: '우리가 찾는 버스가 어디에 있는지 영어로 물어보세요!',
            meaningKo: '그 버스는 어디에 있나요?',
          }
        ),
        {
          type: 'npc',
          speaker: '버스 기사님 (Bus Driver)',
          text: '버스 기사님: “Aha! The big blue bus is at the next stop! 다음 정류장에서 내리면 큰 파란 버스를 만날 수 있단다!”',
          voiceClip: 'The big blue bus is at the next stop!',
        },
      ]);
      return;
    }

    if (target.id === 's2_alight') {
      if(st.alighted){go('NextStop',10,11);return;}
      if (!st.driver) {
        say('딩고(활빈)', '딩고(활빈): “길동아! 먼저 앞쪽 버스 기사님(10, 3)께 큰 파란 버스가 어디 있는지 물어보자!”');
        return;
      }
      say(
        '다음 정류장 도착 · 큰 파란 버스 환승 정류장!',
        [
          {
            type: 'npc',
            speaker: '에이미 & 딩고(활빈)',
            text: '창밖으로 나무와 집이 지나가고 다음 정류장에 도착했어요!\n에이미: “저기 큰 파란 버스가 보여! 그런데 미스터 미스스펠이 정류장 간판 3개(SUB·GAB·GIB)를 전부 뒤섞어 놓았어!”',
            voiceClip: 'Look! There is the big blue bus!',
            image: 'assets/stage2/page13.jpg',
          },
        ],
        () => {
          advanceStage2(state,'alight');
          go('NextStop');
        }
      );
      return;
    }

    if (target.id.startsWith('s2_sign_')) {
      const w = target.id.slice(8);
      const info = STAGE2_WORDS[w];
      const expected = w.toUpperCase();
      st.signSelections ??= {};
      let chosen = st.signSelections[w] || '';
      const choose = () =>
        say(
          `뒤섞인 간판 복구 · ${expected}`,
          `미스터 미스스펠이 뒤섞어 놓은 글자를 바른 순서로 골라 보자! (${info.korean} · ${info.phonetic})\n현재 조합: ${chosen || '___'}`,
          null,
          [
            ...expected
              .split('')
              .sort()
              .map(letter => [
                letter,
                () => {
                  chosen += letter;
                  st.signSelections[w] = chosen;
                  persist();
                  if (chosen.length < 3) choose();
                  else if (chosen === expected)
                    say('링고 · 간판 복구 Speak!', [
                      speak(
                        info.word,
                        w,
                        () => {
                          advanceStage2(state,'sign',w);
                        },
                        {
                          prompt: `간판 글자를 맞췄어요! 이제 「${info.word}」를 힘차게 말해 간판 마법을 풀어 주세요!`,
                          phonetic: info.phonetic,
                          meaningKo: info.korean,
                        }
                      ),
                      {
                        type: 'npc',
                        speaker: '링고 (Ringo)',
                        text: `링고: “Ding! ${expected} ${info.phonetic} 간판이 원래대로 돌아왔어!”`,
                        voiceClip: expected,
                      },
                    ]);
                  else {
                    chosen = '';
                    st.signSelections[w] = '';persist();
                    say('링고', '글자 순서를 다시 한번 살펴보자! 첫소리는 /b/ (B)야!', choose);
                  }
                },
              ]),
            [
              '처음부터',
              () => {
                chosen = '';
                st.signSelections[w] = '';persist();
                choose();
              },
            ],
          ]
        );
      if (chosen === expected)
        say('링고 · 간판 복구 Speak!', [
          speak(
            info.word,
            w,
            () => {
              advanceStage2(state,'sign',w);
            },
            {
              prompt: `간판 글자를 맞췄어요! 이제 「${info.word}」를 힘차게 말해 간판 마법을 풀어 주세요!`,
              phonetic: info.phonetic,
              meaningKo: info.korean,
            }
          ),
          {
            type: 'npc',
            speaker: '링고 (Ringo)',
            text: `링고: “Ding! ${expected} ${info.phonetic} 간판이 원래대로 돌아왔어!”`,
            voiceClip: expected,
          },
        ]);
      else choose();
      return;
    }

    if (target.id === 's2_bigbus') {
      say('큰 파란 버스 (Big Blue Bus)', [
        speak('Big bus!', 'big_bus', null, {
          prompt: '눈앞의 커다란 파란 버스를 보며 “Big bus!”라고 외쳐 보세요!',
          phonetic: '[bɪɡ bʌs]',
          meaningKo: '큰 버스!',
        }),
        {
          type: 'npc',
          speaker: '딩고(활빈)',
          text: '딩고(활빈): “와아! 정말 커다란 파란 버스(Big bus)야! 오른쪽 짐칸(16, 9)에 우리가 찾던 보따리가 보여!”',
          voiceClip: 'Look! Your bag!',
          image: 'assets/stage2/page13.jpg',
        },
      ]);
      return;
    }

    if (target.id === 's2_misspell' || target.id === 's2_luggage') {
      if (!['bus', 'bag', 'big'].every(w => st.signs[w])) {
        if (target.id === 's2_misspell') {
          say('악당 미스터 미스스펠의 도발', [
            {
              type: 'npc',
              speaker: '악당 미스터 미스스펠 (Mr. Misspell)',
              text: '미스터 미스스펠: “히히히! 내가 뒤섞어 놓은 SUB, GAB, GIB 간판 3개도 못 고치는 주제에 보따리와 황금 B 조각을 되찾겠다고? 어림없지!”',
              voiceClip: 'misspell_bus_sub',
              image: 'assets/stage2/page09.jpg',
            },
          ]);
        } else {
          say('활빈', '먼저 뒤섞인 간판 세 개(SUB · GAB · GIB)를 바로잡자!');
        }
        return;
      }

      say('⚡ 보스 대결 · 미스터 미스스펠 격파 & 소중한 보따리·황금 B 조각 회수!', [
        {
          type: 'npc',
          speaker: '악당 미스터 미스스펠 · 짐칸 봉인 마법',
          text: '미스터 미스스펠: “Hahaha! You fixed my signs, but you cannot open this big bus luggage bay!\n(히히히! 간판은 고쳤겠지만, 큰 버스 짐칸에 걸어 둔 내 마법 봉인은 못 풀걸!)”',
          voiceClip: 'Hahaha! You cannot open this big bus!',
          bossBattle: { name: '보스 미스터 미스스펠', hp: 2, maxHp: 2 },
          image: 'assets/stage2/page13.jpg',
        },
        speak('Big bus!', 'big_bus', null, {
          prompt: '🚌 첫 번째 봉인을 깨뜨리도록 “Big bus!”라고 외쳐 보세요!',
          phonetic: '[bɪɡ bʌs]',
          meaningKo: '큰 버스!',
          rewardHint: '✨ 첫 번째 짐칸 봉인 해제',
          bossBattle: { name: '보스 미스터 미스스펠', hp: 2, maxHp: 2 },
        }),
        {
          type: 'npc',
          speaker: '악당 미스터 미스스펠 · 흔들리는 봉인',
          text: '미스터 미스스펠: “Oh no! The big bus seal is breaking!\n(앗! 큰 버스의 첫 번째 봉인이 깨졌잖아!)”',
          voiceClip: 'Oh no! The big bus seal is breaking!',
          bossBattle: { name: '보스 미스터 미스스펠', hp: 1, maxHp: 2 },
        },
        speak(
          'My bag!',
          'my_bag',
          () => {
            if (!st.bagRecovered) {
              advanceStage2(state,'recover');
              queueReward({ id: 'stage2:fragment:v2', type: 'fragment', stage: 2 });
            }
          },
          {
            prompt: '🎒 마지막 봉인을 풀고 보따리와 황금 B 조각을 되찾도록 “My bag!”이라고 외쳐 주세요!',
            phonetic: '[maɪ bæɡ]',
            meaningKo: '내 가방(보따리)!',
            rewardHint: '✨ 마지막 봉인 해제 & 보따리·B 조각 획득!',
            bossBattle: { name: '보스 미스터 미스스펠', hp: 1, maxHp: 2 },
          }
        ),
        {
          type: 'npc',
          speaker: '홍길동 & 딩고(활빈) · 보따리 회수!',
          text: '미스터 미스스펠의 마법이 풀리고 짐칸이 열렸습니다! 보따리 안에 주먹밥과 고향의 활빈당 표식이 그대로 들어 있어요!\n딩고(활빈): “길동아! 우리가 고향의 마음이 담긴 소중한 보따리를 되찾았어!”',
          voiceClip: 'We found your bag!',
          bossBattle: { name: '보스 미스터 미스스펠 (격파!)', hp: 0, maxHp: 2 },
          image: 'assets/stage2/page14.jpg',
        },
        {
          type: 'badge_reveal',
          speaker: '🏆 두 번째 모험 알파벳 조각 획득! · GOLDEN LETTER [B]',
          letter: 'B',
          badgeTitle: '두 번째 모험 황금 알파벳 「B」 조각 획득!',
          text: '링고: “Ding! Correct! You got the letter B piece! Good job!\n축하합니다! 빛나는 두 번째 황금 B 조각을 얻었어요! 철 블록 1개가 내 세계로 전달돼요!”',
          voiceClip: 'You got the letter B piece! Good job!',
          rewardBanner: '🎁 보스 격파 보상: 🅱️ 황금 B 조각 + 🧱 철 블록 1개 전달!',
        },
      ]);
      return;
    }

    if (target.id === 's2_next') {
      if (!st.bagRecovered) {
        say('활빈', '보따리를 먼저 되찾자!');
        return;
      }
      say(
        'STAGE 2 클리어 · 다음 여행은 C의 학교!',
        [
          {
            type: 'npc',
            speaker: '홍길동 · 에이미 · 딩고(활빈)',
            text: '이번에는 올바른 큰 파란 버스에 올랐어요! “Bus! Big bus! My bag!”\n창밖으로 시계를 든 수상한 그림자(마담 클락)와 학교가 스쳐 지나갑니다. 다음 모험은 C의 학교예요!',
            voiceClip: 'Bus! Big bus! My bag!',
            image: 'assets/stage2/page15.jpg',
          },
        ],
        () => {
          advanceStage2(state,'complete');
          milestone(2);
          persist();
          updateSidebar();
          toast('Stage 2 완료! 나무·흙·철 블록 각 5개를 받았어요!');
        }
      );
      return;
    }

    if (target.id === 's2_airport') {
      go('AirportHall', 10, 2);
      return;
    }
    if (target.id === 's2_back') {
      go('BusStop',3,12);
      return;
    }
    if (target.id === 's2_amy' || target.id === 's2_ringo') {
      openRepeatConversation({ id: target.id === 's2_amy' ? 'npc_amy' : 'npc_ringo', label: target.label });
      return;
    }
    if (REPEAT_DIALOGUES[target.id]) {
      openRepeatConversation(target);
    }
  }
  function openWordDiscoveryModal(wordId) {
    if (STAGE2_WORDS[wordId]) {
      held.clear();
      stage2Act({ id: `s2_word_${wordId}` });
      return;
    }
    const info = STAGE1_WORDS[wordId];
    if (!info) return;
    held.clear();

    const guideMap = {
      airplane: {
        phonetic: '[ˈeər.pleɪn]',
        meaning: '비행기',
        sentenceClip: 'sentence_airplane',
        wordClip: 'word_airplane',
      },
      apple: {
        phonetic: '[ˈæp.əl]',
        meaning: '사과',
        sentenceClip: 'sentence_apple',
        wordClip: 'word_apple',
      },
      ask: {
        phonetic: '[æsk]',
        meaning: '묻다 · 질문하다',
        sentenceClip: 'sentence_ask',
        wordClip: 'word_ask',
      },
    }[wordId];

    let rewardGrantedNow = false;
    let allFoundNow = false;

    say(
      `단서 발견 · ${info.word} (${info.korean})`,
      [
        {
          type: 'npc',
          speaker: '링고 (Ringo)',
          text: `링고: “${info.sentence} (${info.sentenceKo})”`,
          voiceClip: guideMap.sentenceClip,
          image: info.image,
        },
        {
          type: 'speak',
          speaker: `홍길동 · 단서 말하기 차례 🎙️`,
          prompt: `🔊 가이드 음성을 듣고 Speak 버튼을 눌러 「${info.word}」를 따라 말해 보세요!`,
          targetPhrase: info.word,
          phonetic: guideMap.phonetic,
          meaningKo: guideMap.meaning,
          targetKey: wordId,
          guideClip: guideMap.wordClip,
          rewardHint: '단서 도감 등록 + 나무 블록 1개',
          onPass: () => {
            const disc = recordWordDiscovery(state, wordId);
            allFoundNow = disc.allDiscovered;
            const r = grantSpeakRewardOnce(
              state,
              `clue-speak-${wordId}`,
              10,
              `${info.word} 단서 말하기 보상`
            );
            rewardGrantedNow = r.granted;
          },
        },
        {
          type: 'npc',
          speaker: '링고 (Ringo)',
          text: `링고: “${info.word}! 이제 이 글자를 알아볼 수 있겠어. 지도에 남겨 둘게!”`,
          voiceClip: 'You found a new word!',
          rewardBanner: () =>
            rewardGrantedNow
              ? `🎁 ${info.word} 말하기 성공 보상: 🪵 나무 블록 보상 전달! & 단서 등록 완료!`
              : `✓ ${info.word} 단서 복습 완료! (다시 말해도 블록을 받을 수 있어요!)`,
        },

      ],
      () => {
        if (allFoundNow) {
          toast('세 가지 A 단서(Airplane·Apple·Ask)를 모두 말했어요! 이제 안내 데스크 직원과 대화해 보세요!');
        } else {
          toast(`${info.word} 단서 연습 완료! 남은 단서나 주변 NPC와도 대화해 보세요.`);
        }
      }
    );
  }

  function allCluesDiscovered() {
    return Boolean(state.discoveries.airplane && state.discoveries.apple && state.discoveries.ask);
  }

  function missingCluesLabel() {
    const missing = [];
    if (!state.discoveries.airplane) missing.push('✈️ Airplane(북서쪽 창문)');
    if (!state.discoveries.apple) missing.push('🍎 Apple(중앙 카페)');
    if (!state.discoveries.ask) missing.push('❓ Ask(안내 데스크 표지)');
    return missing.join(', ');
  }

  // 2. Turn-based Speaking Conversation with Amy or Staff
  function openSpeakingModal(context = 'practice') {
    if (context === 'staff') {
      interactWithStaff();
    } else {
      startAmyConversation();
    }
  }

  function startTravelerConversation() {
    let rewardGrantedNow = false;
    say(
      '친절한 미국 여행객과의 대화',
      [
        {
          type: 'npc',
          speaker: '미국 여행객 (Airport Traveler)',
          text: '여행객: “Are you okay? What happened?”\n(괜찮으세요? 무슨 일 있었나요?)',
          voiceClip: 'traveler_are_you_okay',
        },
        {
          type: 'speak',
          speaker: '홍길동 · 내 대답 차례 🎙️',
          prompt: '걱정해 주는 여행객에게 괜찮다고 영어로 대답해 보세요!',
          targetPhrase: 'I am okay.',
          meaningKo: '저는 괜찮아요.',
          targetKey: 'i_am_okay',
          guideClip: 'phrase_i_am_okay',
          rewardHint: '나무 블록 1개 · 완전한 문장 2개',
          onPass: () => {
            const r = grantSpeakRewardOnce(state, 'npc-speak-traveler', 15, '여행객과 안부 인사하기');
            rewardGrantedNow = r.granted;
          },
        },
        {
          type: 'npc',
          speaker: '미국 여행객 (Airport Traveler)',
          text: '여행객: “Haha, nice to meet you! Welcome to America!”\n(하하, 다행이네요! 미국에 온 걸 환영합니다!)',
          voiceClip: 'traveler_reply_welcome',
          rewardBanner: () =>
            rewardGrantedNow
              ? '🎁 여행객 대화 성공 보상: 🪵 나무 블록 보상 전달!'
              : `✓ 여행객과 반갑게 인사를 나누었어요! (다시 말해도 블록을 받을 수 있어요!)`,
        },
        {type:'praise',npcId:'npc_traveler',speaker:'에이미',text:'',skipIf:()=>!rewardGrantedNow},
      ]
    );
  }

  function startPilotConversation() {
    let rewardGrantedNow = false;
    say(
      '비행기 파일럿 기장님과의 인사',
      [
        {
          type: 'npc',
          speaker: '파일럿 기장님 (Captain)',
          text: '기장님: “Good morning! Welcome aboard!”\n(좋은 아침이에요! 비행기 탑승을 환영합니다!)',
          voiceClip: 'pilot_good_morning',
        },
        {
          type: 'speak',
          speaker: '홍길동 · 내 대답 차례 🎙️',
          prompt: '기장님에게 밝은 목소리로 아침 인사를 건네 보세요!',
          targetPhrase: 'Good morning!',
          meaningKo: '좋은 아침이에요!',
          targetKey: 'good_morning',
          guideClip: 'phrase_good_morning',
          rewardHint: '나무 블록 1개 · 완전한 문장 2개',
          onPass: () => {
            const r = grantSpeakRewardOnce(state, 'npc-speak-pilot', 15, '기장님과 아침 인사하기');
            rewardGrantedNow = r.granted;
          },
        },
        {
          type: 'npc',
          speaker: '파일럿 기장님 (Captain)',
          text: '기장님: “Good morning! Have a great flight!”\n(좋은 아침이에요! 즐거운 여행 되세요!)',
          voiceClip: 'pilot_reply_flight',
          rewardBanner: () =>
            rewardGrantedNow
              ? '🎁 기장님 대화 성공 보상: 🪵 나무 블록 보상 전달!'
              : `✓ 기장님과 반갑게 아침 인사를 나누었어요! (다시 말해도 블록을 받을 수 있어요!)`,
        },
        {type:'praise',npcId:'npc_pilot',speaker:'에이미',text:'',skipIf:()=>!rewardGrantedNow},
      ]
    );
  }

  function startGuardConversation() {
    let rewardGrantedNow = false;
    say(
      '공항 입국 심사관과의 자기소개 대화',
      [
        {
          type: 'npc',
          speaker: '입국 심사관 (Airport Officer)',
          text: '심사관: “Hello! What is your name?”\n(안녕하세요! 당신의 이름은 무엇인가요?)',
          voiceClip: 'guard_what_is_name',
        },
        {
          type: 'speak',
          speaker: '홍길동 · 내 대답 차례 🎙️',
          prompt: '심사관에게 내 이름을 영어로 소개해 보세요!',
          targetPhrase: 'I am Gildong.',
          meaningKo: '나는 길동입니다.',
          targetKey: 'i_am_gildong',
          guideClip: 'phrase_i_am_gildong',
          rewardHint: '나무 블록 1개 · 완전한 문장 2개',
          onPass: () => {
            const r = grantSpeakRewardOnce(state, 'npc-speak-guard', 15, '심사관에게 자기소개하기');
            rewardGrantedNow = r.granted;
          },
        },
        {
          type: 'npc',
          speaker: '입국 심사관 (Airport Officer)',
          text: '심사관: “Nice to meet you, Gildong! Welcome!”\n(만나서 반가워요, 길동! 환영합니다!)',
          voiceClip: 'guard_reply_welcome',
          rewardBanner: () =>
            rewardGrantedNow
              ? '🎁 심사관 대화 성공 보상: 🪵 나무 블록 보상 전달!'
              : `✓ 심사관에게 멋지게 이름을 소개했어요! (다시 말해도 블록을 받을 수 있어요!)`,
        },
        {type:'praise',npcId:'npc_guard',speaker:'에이미',text:'',skipIf:()=>!rewardGrantedNow},
      ]
    );
  }

  function startCafeConversation() {
    let rewardGrantedNow = false;
    say(
      '공항 카페 점원과의 주문 대화',
      [
        {
          type: 'npc',
          speaker: '카페 점원 (Cafe Staff)',
          text: '카페 점원: “Hello! Do you want an apple?”\n(안녕하세요! 맛있는 사과 하나 드릴까요?)',
          voiceClip: 'cafe_want_apple',
        },
        {
          type: 'speak',
          speaker: '홍길동 · 내 대답 차례 🎙️',
          prompt: '사과를 받고 싶다고 정중하게 영어로 대답해 보세요!',
          targetPhrase: 'Yes, please!',
          meaningKo: '네, 주세요!',
          targetKey: 'yes_please',
          guideClip: 'phrase_yes_please',
          rewardHint: '나무 블록 1개 · 완전한 문장 2개',
          onPass: () => {
            const r = grantSpeakRewardOnce(state, 'npc-speak-cafe', 15, '카페 점원에게 정중히 대답하기');
            rewardGrantedNow = r.granted;
          },
        },
        {
          type: 'npc',
          speaker: '카페 점원 (Cafe Staff)',
          text: '카페 점원: “Here you go! Enjoy your apple!”\n(여기 있어요! 사과 맛있게 드세요!)',
          voiceClip: 'cafe_reply_enjoy',
          rewardBanner: () =>
            rewardGrantedNow
              ? '🎁 카페 대화 성공 보상: 🪵 나무 블록 보상 전달!'
              : `✓ 카페 점원에게 정중하게 인사를 건넸어요! (다시 말해도 블록을 받을 수 있어요!)`,
        },
        {type:'praise',npcId:'npc_cafe',speaker:'에이미',text:'',skipIf:()=>!rewardGrantedNow},
      ]
    );
  }

  function startKidTravelerConversation() {
    let rewardGrantedNow = false;
    say(
      '미국 꼬마 친구와의 감사 인사',
      [
        {
          type: 'npc',
          speaker: '미국 꼬마 친구 (Little Kid)',
          text: '꼬마 친구: “Hi! Here is a gift for you!”\n(안녕! 여기 너를 위한 선물이야!)',
          voiceClip: 'kid_gift_for_you',
        },
        {
          type: 'speak',
          speaker: '홍길동 · 내 대답 차례 🎙️',
          prompt: '선물을 준 꼬마 친구에게 고맙다고 영어로 말해 보세요!',
          targetPhrase: 'Thank you!',
          meaningKo: '고마워!',
          targetKey: 'thank_you',
          guideClip: 'phrase_thank_you',
          rewardHint: '나무 블록 1개 · 완전한 문장 2개',
          onPass: () => {
            const r = grantSpeakRewardOnce(state, 'npc-speak-kid', 15, '꼬마 친구에게 감사 인사하기');
            rewardGrantedNow = r.granted;
          },
        },
        {
          type: 'npc',
          speaker: '미국 꼬마 친구 (Little Kid)',
          text: '꼬마 친구: “You’re welcome! Let’s be friends! Bye-bye!”\n(천만에! 우리 친구 하자! 안녕!)',
          voiceClip: 'kid_reply_friends',
          rewardBanner: () =>
            rewardGrantedNow
              ? '🎁 꼬마 친구 대화 성공 보상: 🪵 나무 블록 보상 전달!'
              : `✓ 꼬마 친구와 고마운 마음을 나누었어요! (다시 말해도 블록을 받을 수 있어요!)`,
        },
        {type:'praise',npcId:'npc_kid_traveler',speaker:'에이미',text:'',skipIf:()=>!rewardGrantedNow},
      ]
    );
  }

  function startAmyConversation() {
    let rewardGrantedNow = false;
    state.practice.attempted = true;
    persist();

    say(
      '에이미 & 링고와의 영어 대화 연습',
      [
        {
          type: 'npc',
          speaker: '에이미 (Amy)',
          text: '에이미: “When you don’t know, just ask! 모를 땐 용기 내어 물어보면 돼. 나한테 먼저 질문하는 말을 해 볼래?”',
          voiceClip: 'amy_teach_ask',
        },
        {
          type: 'speak',
          speaker: '홍길동 · 내 대답 차례 🎙️',
          prompt: '가이드 음성을 듣고 에이미에게 정중하게 질문하는 문장을 말해 보세요!',
          targetPhrase: 'Excuse me. Can I ask?',
          meaningKo: '실례합니다. 물어봐도 될까요?',
          targetKey: 'full',
          guideClip: 'sentence_ask',
          rewardHint: '나무 블록 1개 · 완전한 문장 2개',
          onPass: method => {
            recordPracticeCompletion(state, method);
            const r = grantSpeakRewardOnce(state, 'npc-speak-amy', 20, '에이미와 질문 대화 연습');
            rewardGrantedNow = r.granted;
          },
        },
        {
          type: 'npc',
          speaker: '링고 (Ringo)',
          text: '링고: “질문이 들렸어! 이제 직원에게 활빈이 어디 있는지 물어보자.”',
          voiceClip: 'Let us ask for help!',
          rewardBanner: () =>
            rewardGrantedNow
              ? '🎁 에이미 대화 연습 보상: 🪵 나무 블록 보상 전달!'
              : `✓ 에이미와 대화 연습 완료! (다시 말해도 블록을 받을 수 있어요!)`,
        },

      ]
    );
  }

  function startStaffConversation() {
    state.staffSpeech.attempted = true;
    state.staffSpeech.hesitatedOnce = true;
    persist();

    let rewardGrantedNow = false;

    say(
      '공항 안내 데스크 직원과의 실전 대화',
      [
        {
          type: 'npc',
          speaker: '공항 안내 직원 (Information Desk)',
          text: '공항 안내 직원: “Hello! Can I help you?”\n(안녕하세요! 무엇을 도와드릴까요?)',
          voiceClip: 'staff_hello_help',
          image: 'assets/stage1/page11.jpg',
        },
        {
          type: 'speak',
          speaker: '홍길동 → 안내 직원 (내 차례 1/2 🎙️)',
          prompt: '안내 직원의 물음에 가이드 음성을 따라 정중히 질문을 시작해 보세요!',
          targetPhrase: 'Excuse me. Can I ask?',
          meaningKo: '실례합니다. 물어봐도 될까요?',
          targetKey: 'full',
          guideClip: 'sentence_ask',
          rewardHint: '직원과의 대화 연결',
        },
        {
          type: 'npc',
          speaker: '공항 안내 직원 (Information Desk)',
          text: '공항 안내 직원: “Sure! How can I help you?”\n(그럼요! 어떻게 도와드릴까요?)',
          voiceClip: 'staff_sure_help',
          image: 'assets/stage1/page12.jpg',
        },
        {
          type: 'speak',
          speaker: '홍길동 → 안내 직원 (내 차례 2/2 🎙️)',
          prompt: '손으로 아기 용 활빈을 가리키며 가이드 음성을 따라 도움을 요청해 보세요!',
          targetPhrase: 'My friend. Help, please!',
          meaningKo: '제 친구예요. 도와주세요!',
          targetKey: 'help_please',
          guideClip: 'gildong_my_friend_help',
          rewardHint: '🔓 분실물 보관소 잠금 해제 + 나무 블록 1~2개',
          onPass: method => {
            recordStaffSpeechCompletion(state, method);
            const r = grantSpeakRewardOnce(state, 'npc-speak-staff', 30, '안내 직원과 실전 영어 대화 완료');
            rewardGrantedNow = r.granted;
          },
        },
        {
          type: 'npc',
          speaker: '공항 안내 직원 (Information Desk)',
          text: '공항 안내 직원: “Oh! Your friend is in the Lost and Found room right over there!”\n(아! 당신의 친구는 바로 저쪽 분실물 보관소에 있어요! 문을 열어 드릴게요!)',
          voiceClip: 'staff_friend_over_there',
          rewardBanner: () =>
            rewardGrantedNow
              ? '🎁 실전 대화 성공 보상: 🔓 분실물 보관소 문 열림 + 🪵 나무 블록 보상 전달!'
              : '🔓 분실물 보관소 문이 열려 있어요! 활빈에게 가 보세요!',
        },

      ],
      () => {
        toast('분실물 보관소 문이 열렸어요! 오른쪽 위 방으로 들어가 활빈과 대화하세요!');
      }
    );
  }

  // Alphabet Gym Badge Case & Word Dex Modal (마법영어 조각 보관함 & 알파벳 단어 도감)
  function openAlphabetDexModal(opts = {}) {
    held.clear();
    interactiveModal.replaceChildren();
    interactiveModal.setAttribute('aria-label', '알파벳 조각 케이스 및 단어 도감');

    const earnedA = Boolean(
      state.alphabetPieces?.includes('A') ||
        state.alphabet?.includes('A') ||
        state.rewardReceipts?.[STAGE1_REWARD_ID]
    );
    const earnedB = Boolean(
      state.alphabetPieces?.includes('B') ||
        state.alphabet?.includes('B') ||
        state.stage2?.fragmentB
    );
    const earnedCount = new Set([
      ...(state.alphabetPieces || []),
      ...(earnedA ? ['A'] : []),
      ...(earnedB ? ['B'] : []),
    ]).size;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const wordClipMap = {
      airplane: 'word_airplane',
      apple: 'word_apple',
      ask: 'word_ask',
    };

    const wrap = document.createElement('div');
    wrap.className = 'me-reward-modal me-dex-modal';
    wrap.innerHTML = `
      <div class="me-modal-header">
        <div>
          <span class="me-badge">📖 MAGIC LETTERS & WORD JOURNAL · 마법영어 모험 기록</span>
          <h2>${
            opts.justCleared
              ? '🎉 보스 미스터 미스스펠 격파! 황금 「A」 조각가 도감에 등록되었어요!'
              : '🏆 알파벳 조각 케이스 & 단어 도감'
          }</h2>
        </div>
      </div>

      <div class="me-dex-badge-board">
        <div class="me-dex-badge-board-top">
          <div>
            <strong>🎖️ 알파벳 조각 보관함 (${earnedCount} / 26)</strong>
            <div style="font-size:11px;color:#cfe0c4;margin-top:2px;">
              ${
                earnedB
                  ? '✓ 황금 배지 [A], [B] 획득 완료! (보스 미스터 미스스펠 격파 보상 · 클릭하면 발음을 들려줘요)'
                  : earnedA
                  ? '✓ 첫 번째 모험 배지 [A] 획득 완료! (보스 미스터 미스스펠 격파 보상 · 클릭하면 발음을 들려줘요)'
                  : '🔒 보스 미스터 미스스펠에게 Airplane·Apple·Ask 3단어를 모두 Speak하면 [A] 배지를 얻어요!'
              }
            </div>
          </div>
          <button type="button" id="dex-listen-letter-a" class="me-inline-tts" style="background:#ffe787;color:#3b2100;font-weight:900;border-color:#b87800;padding:5px 10px;">
            🔊 알파벳 A 발음 듣기
          </button>
        </div>
        <div class="me-dex-badge-grid">
          ${letters
            .map(L => {
              const isEarned =
                L === 'A'
                  ? earnedA
                  : L === 'B'
                  ? earnedB
                  : Boolean(state.alphabetPieces?.includes(L) || state.alphabet?.includes(L));
              return `
                <div class="me-dex-badge-cell ${isEarned ? 'earned' : ''}" data-letter="${L}" title="${
                  isEarned ? `${L} 알파벳 조각 획득 완료!` : `${L} 배지 (다음 스테이지)`
                }">
                  <span>${L}</span>
                  <small>${isEarned ? '★배지' : '잠김'}</small>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>

      <h3 style="margin:6px 0 6px;font-size:14px;">🔤 Stage 1 · 알파벳 A 단어 도감 (3종)</h3>
      <div class="me-dex-word-grid">
        ${Object.entries(STAGE1_WORDS)
          .map(([id, info]) => {
            const collected = Boolean(state.discoveries?.[id]);
            return `
              <div class="me-dex-word-card ${collected ? 'collected' : ''}" id="dex-word-card-${id}">
                <img src="${info.image}" alt="${info.word}">
                <div class="me-dex-word-head">
                  <strong>${info.word}</strong>
                  <span class="me-dex-word-phonetic">${info.phonetic || ''}</span>
                </div>
                <div style="font-size:12px;font-weight:800;color:#2c4a34;">
                  뜻: ${info.korean} · <span style="color:${collected ? '#2c7a1f' : '#8a5a20'};">${
                    collected ? '✓ 수집 완료' : '🔍 미발견'
                  }</span>
                </div>
                <div style="font-size:11px;color:#4f614a;">“${info.sentence}”</div>
                <div class="me-dex-word-actions">
                  <button type="button" data-word-clip="${wordClipMap[id]}">🔊 단어 듣기</button>
                  <button type="button" data-practice-word="${id}">🎙️ Speak 연습</button>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>

      ${
        earnedA
          ? `
        <div class="me-reward-grid" style="margin-top:8px;">
          <div class="me-reward-card">
            <span class="icon">🅰️</span>
            <b>첫 번째 모험 황금 A 조각</b>
            <small>미스터 미스스펠 격파 증표</small>
          </div>
          <div class="me-reward-card">
            <span class="icon">🪙</span>
            <b>대화로 모은 블록은 내 세계에서 확인해요</b>
            <small>조각: 철 1개 · 완료: 나무·흙·철 각 5개</small>
          </div>
        </div>
      `
          : ''
      }

      <div class="me-modal-footer">
        <button type="button" id="open-block-world-from-dex" class="me-primary-btn">
          🧱 내 블록 세계로 (건축 보상 꾸미기)
        </button>
        <button type="button" id="close-alphabet-dex-btn" class="me-secondary-btn">
          닫기
        </button>
      </div>
    `;
    interactiveModal.append(wrap);
    if (state.stage2) {
      const s2Title = document.createElement('h3');
      s2Title.style.cssText = 'margin:10px 0 6px;font-size:14px;';
      s2Title.textContent = '🔤 Stage 2 · 알파벳 B 단어 도감 (3종)';
      const section = document.createElement('div');
      section.className = 'me-dex-word-grid';
      section.innerHTML = Object.entries(STAGE2_WORDS)
        .map(([id, info]) => {
          const collected = Boolean(state.stage2?.words?.[id]);
          return `
            <div class="me-dex-word-card ${collected ? 'collected' : ''}" id="dex-word-card-${id}">
              <img src="${info.image}" alt="${info.word}">
              <div class="me-dex-word-head">
                <strong>${info.word}</strong>
                <span class="me-dex-word-phonetic">${info.phonetic || ''}</span>
              </div>
              <div style="font-size:12px;font-weight:800;color:#2c4a34;">
                뜻: ${info.korean} · <span style="color:${collected ? '#2c7a1f' : '#8a5a20'};">${
                  collected ? '✓ 수집 완료' : '🔍 미발견'
                }</span>
              </div>
              <div style="font-size:11px;color:#4f614a;">“${info.sentence}”</div>
              <div class="me-dex-word-actions">
                <button type="button" data-word-clip="${info.word}">🔊 단어 듣기</button>
                <button type="button" data-practice-word="${id}">🎙️ Speak 연습</button>
              </div>
            </div>
          `;
        })
        .join('');
      const footer = wrap.querySelector('.me-modal-footer');
      footer.before(s2Title);
      footer.before(section);
    }


    wrap.querySelector('#dex-listen-letter-a').onclick = () => speakEnglishPhrase('letter_a');
    for (const cell of wrap.querySelectorAll('.me-dex-badge-cell.earned')) {
      cell.onclick = () => speakEnglishPhrase('letter_a');
    }
    for (const btn of wrap.querySelectorAll('[data-word-clip]')) {
      btn.onclick = () => speakEnglishPhrase(btn.dataset.wordClip);
    }
    for (const btn of wrap.querySelectorAll('[data-practice-word]')) {
      btn.onclick = () => {
        const wId = btn.dataset.practiceWord;
        cancelActiveVoice();
        interactiveModal.close();
        openWordDiscoveryModal(wId);
      };
    }
    wrap.querySelector('#open-block-world-from-dex').onclick = () => {
      cancelActiveVoice();
      interactiveModal.close();
      blockWorldUI.open();
    };
    wrap.querySelector('#close-alphabet-dex-btn').onclick = () => {
      cancelActiveVoice();
      interactiveModal.close();
      canvas.focus({ preventScroll: true });
    };

    if (!interactiveModal.open) interactiveModal.showModal();
  }

  // Stage 1 Clear & Reward Summary Modal (`stage-1-first-clear`)
  function openStage1ClearRewardModal() {
    openAlphabetDexModal({ justCleared: true });
  }

  // Ringo's English Scroll (16쪽 링고의 영어 두루마리 & 길동의 실수 노트)
  function openRingoScrollModal() {
    held.clear();
    interactiveModal.replaceChildren();
    interactiveModal.setAttribute('aria-label', '링고의 영어 두루마리 복습 코너');

    const wrap = document.createElement('div');
    wrap.className = 'me-scroll-modal';
    wrap.innerHTML = `
      <div class="me-modal-header">
        <div>
          <span class="me-badge">16쪽 복습 코너 · ElevenLabs 음성 지원</span>
          <h2>📜 링고의 영어 두루마리 & 길동의 실수 노트</h2>
        </div>
      </div>
      <div class="me-scroll-grid">
        <div>
          <h3>오늘의 알파벳: <strong>A a (에이)</strong> <button type="button" class="me-inline-tts" data-clip="letter_a">🔊 듣기</button></h3>
          <ul class="me-scroll-list">
            <li><b>Airplane [ˈeər.pleɪn] (비행기)</b> — “A is for Airplane.” <button type="button" class="me-inline-tts" data-clip="sentence_airplane">🔊 듣기</button></li>
            <li><b>Apple [ˈæp.əl] (사과)</b> — “A is for Apple.” <button type="button" class="me-inline-tts" data-clip="sentence_apple">🔊 듣기</button></li>
            <li><b>Ask [æsk] (묻다)</b> — “Excuse me. Can I ask?” <button type="button" class="me-inline-tts" data-clip="sentence_ask">🔊 듣기</button></li>
            <li><b>직원 응답</b> — “Sure! How can I help you?” <button type="button" class="me-inline-tts" data-clip="staff_sure_help">🔊 듣기</button></li>
            <li><b>딩고(활빈)의 한마디</b> — “Help! Wow! Thank you!” <button type="button" class="me-inline-tts" data-clip="hwalbin_help_thank_you">🔊 듣기</button></li>
          </ul>
          <h3>길동의 실수 노트</h3>
          <ul class="me-scroll-list">
            <li><b>“Are you okay?”</b> → 공격 주문이 아니라 “괜찮으세요?”라고 묻는 친절한 인사예요. <button type="button" class="me-inline-tts" data-clip="traveler_are_you_okay">🔊 듣기</button></li>
            <li><b>“TIXE” → “EXIT”</b> → 글자 순서가 바뀌면 뜻을 잃어요. EXIT는 ‘출구’!</li>
            <li><b>묻는 용기</b> → 틀려도 괜찮아요. 다시 말하면 됩니다. <strong>Try again!</strong> <button type="button" class="me-inline-tts" data-clip="amy_try_again">🔊 듣기</button></li>
          </ul>
        </div>
        <div class="me-scroll-img-wrap">
          <img src="assets/stage1/page16.jpg" alt="16쪽 링고의 영어 두루마리">
        </div>
      </div>
      <div class="me-modal-footer">
        <button type="button" id="close-scroll-btn" class="me-primary-btn">닫기</button>
      </div>
    `;
    interactiveModal.append(wrap);
    for (const btn of wrap.querySelectorAll('[data-clip]')) {
      btn.onclick = () => speakEnglishPhrase(btn.dataset.clip);
    }
    wrap.querySelector('#close-scroll-btn').onclick = () => {
      cancelActiveVoice();
      interactiveModal.close();
      canvas.focus({ preventScroll: true });
    };
    if (!interactiveModal.open) interactiveModal.showModal();
  }

  // Story Scene Transitions (Concise & Action-Focused)
  function triggerJoseonIntroAndArriveAtAirport() {
    cutsceneLocked = true;
    say(
      '제1화 · 시간 균열과 미국 공항 도착!',
      [
        '홍길동: “모르면 묻고, 의심하기 전에 살펴라!”\n장터 아이의 누명을 풀어주던 순간, 하늘의 푸른 시간 균열(A)이 길동과 활빈을 삼켜 버립니다!',
      ],
      () => {
        state.map = 'AirportHall';
        state.x = 4;
        state.y = 9;
        state.facing = 'right';
        state.stage = 'explore_misspell';
        playerWalk.reset();
        persist();
        updateSidebar();
        cutsceneLocked = false;

        say(
          '미국 국제공항 · 활빈과의 이별',
          [
            {
              type: 'npc',
              speaker: '공항 여행객 & 홍길동',
              text: '수하물 벨트를 타고 딩고(활빈)가 동북쪽 분실물 보관소로 실려 가 버렸습니다!\n여행객: “Are you okay? What happened?”\n활빈을 찾아주세요!',
              voiceClip: 'traveler_are_you_okay',
              image: 'assets/stage1/page06.jpg',
            },
          ]
        );
      },
      null,
      'assets/stage1/page03.jpg'
    );
  }

  function triggerMisspellScrambleAndMeetAmy() {
    cutsceneLocked = true;
    say(
      '미스터 미스스펠의 장난 · 에이미와 링고 합류!',
      [
        {
          type: 'npc',
          speaker: '미스터 미스스펠 (Mr. Misspell)',
          text: '미스터 미스스펠: “히히히! Upside down! 출구(EXIT) 글자를 TIXE로 뒤섞어 놓았지! A 배지를 얻고 싶다면 단서 3개를 찾고 네 친구 딩고(활빈)를 구해서 나에게 도전해 봐라!”',
          voiceClip: 'misspell_exit_tixe',
          image: 'assets/stage1/page09.jpg',
        },
        {
          type: 'npc',
          speaker: '에이미 & 링고',
          text: '에이미: “Welcome to America! 나는 에이미야. 활빈이 저 문 너머에 갇혔구나! 먼저 공항을 살펴보자. 비행기와 사과, 안내판에 실마리가 있을 거야.”',
          voiceClip: 'amy_hello_gildong',
        },
      ],
      () => {
        state.stage = 'discover_words';
        cutsceneLocked = false;
        persist();
        updateSidebar();
        toast('단서(Airplane·Apple·Ask)와 NPC들에게 말을 걸어 Speak로 대답하고 블록 보상을 받아 보세요!');
      }
    );
  }

  function interactWithStaff() {
    if (['joseon_intro', 'baggage_separation', 'explore_misspell'].includes(state.stage)) {
      triggerMisspellScrambleAndMeetAmy();
      return;
    }

    if (!allCluesDiscovered()) {
      const foundCount = ['airplane', 'apple', 'ask'].filter(k => state.discoveries[k]).length;
      say(
        '공항 안내 직원 & 에이미의 안내 (단서 3종 필요)',
        [
          {
            type: 'npc',
            speaker: '공항 안내 직원 (Information Desk)',
            text: '공항 안내 직원: “Hello! Can I help you?”\n(안녕하세요! 무엇을 도와드릴까요?)',
            voiceClip: 'staff_hello_help',
          },
          {
            type: 'npc',
            speaker: '에이미 & 링고 (단서 확인)',
            text: `에이미: “길동아, 직원에게 가기 전에 주위를 조금 더 살펴보자. 아직 못 본 실마리가 있어!”\n• 현재 찾은 단서: ${foundCount}/3\n• 남은 단서: ${missingCluesLabel()}`,
            voiceClip: 'Let us find the clues together.',
          },
        ]
      );
      return;
    }

    startStaffConversation();
  }

  // Rescue Dingo(Hwalbin) in the Lost & Found room -> starts companion following!
  function interactWithHwalbin() {
    if (!state.staffSpeech.completed) {
      say(
        '분실물 보관소 유리문 너머의 딩고(활빈)',
        [
          '딩고(활빈): “길동아! 문이 잠겨 있어서 못 나가! 바로 아래 「안내 데스크 직원」과 영어로 대화하면 문을 열어 줄 거야!”',
        ]
      );
      return;
    }

    cutsceneLocked = true;
    const rescueReward = grantSpeakRewardOnce(state, 'hwalbin-rescued', 20, '파트너 딩고(활빈) 구출 성공');
    if (state.stage !== 'stage1_complete') {
      state.stage = 'battle_misspell';
    }
    followerState = { x: 17, y: 3, facing: 'down' };
    followerWalk.reset();
    persist();
    updateSidebar();

    say(
      '파트너 딩고(활빈) 구출 성공 · 함께하는 여행! 💛',
      [
        {
          type: 'npc',
          speaker: '단짝 파트너 딩고(활빈)',
          text: '딩고(활빈): “길동아아아! 나를 구해 줘서 정말 고마워! Help! Wow! Thank you, Gildong!\n이제 떨어지지 말자. 나도 함께 보따리를 찾을게!”',
          voiceClip: 'hwalbin_help_thank_you',
          image: 'assets/stage1/page13.jpg',
          rewardBanner: () =>
            rescueReward.granted
              ? '💛 딩고(활빈)를 구했어요! 이제 함께 여행해요!'
              : '💛 파트너 딩고(활빈)가 길동이의 뒤를 따라다니고 있어요!',
        },
        {
          type: 'npc',
          speaker: '에이미',
          text: '에이미: “다시 함께할 수 있어서 다행이야. 그런데 미스스펠이 북쪽 출구를 막았어! 우리가 알아낸 글자로 마법을 풀어 보자.”',
          voiceClip: 'Let us open the exit together.',
        },
      ],
      () => {
        cutsceneLocked = false;
        updateSidebar();
        toast('활빈과 다시 만났어요! 함께 북쪽 출구의 마법을 풀러 가요!');
      }
    );
  }

  function interactWithFollowerHwalbin() {
    const cleared = Boolean(state.rewardReceipts?.[STAGE1_REWARD_ID]);
    say(
      '뒤따라오는 단짝 파트너 딩고(활빈) 💛',
      [
        {
          type: 'npc',
          speaker: '파트너 딩고(활빈)',
          text: cleared
            ? '딩고(활빈): “삐약! 길동아, 우리가 함께 미스터 미스스펠을 물리치고 황금 A 조각을 얻었어! Thank you, Gildong!”'
            : '딩고(활빈): “길동아! 내가 바로 뒤에서 함께할게! 북쪽 출구 앞의 악당 미스터 미스스펠에게 가서 Airplane, Apple, Ask를 크게 외쳐 물리치자!”',
          voiceClip: 'hwalbin_help_thank_you',
        },
      ]
    );
  }

  // Final Quest: 3-HP Boss Speak Battle with Villain Mr. Misspell!
  function startMisspellBossBattle() {
    if (!allCluesDiscovered() || !isHwalbinFollowing()) {
      const foundCount = ['airplane', 'apple', 'ask'].filter(k => state.discoveries[k]).length;
      say(
        '보스 미스터 미스스펠의 도발',
        [
          {
            type: 'npc',
            speaker: '악당 미스터 미스스펠 (Mr. Misspell)',
            text: `미스터 미스스펠: “히히히! 글자도 헷갈리는 주제에 내 마법을 풀겠다고? 네 친구나 먼저 찾아오시지!”`,
            voiceClip: 'misspell_exit_tixe',
          },
        ]
      );
      return;
    }

    cutsceneLocked = true;
    let grantResult = { granted: false };

    say(
      '⚡ 최종 보스 대결 · 악당 미스터 미스스펠 vs 홍길동 & 딩고(활빈)!',
      [
        {
          type: 'npc',
          speaker: '악당 미스터 미스스펠 · 뒤섞인 마법',
          text: '미스터 미스스펠: “Hahaha! You cannot read my signs!\n(히히히! 글자를 뒤섞어 출구를 감췄지! 어디 한번 읽어 보시지!)”',
          voiceClip: 'Hahaha! You cannot read my signs!',
          bossBattle: { name: '보스 미스터 미스스펠', hp: 3, maxHp: 3 },
          image: 'assets/stage1/page09.jpg',
        },
        {
          type: 'speak',
          speaker: '홍길동 & 딩고 · 보스 공격 1/3 🎙️',
          prompt: '✈️ 뒤섞인 비행기 글자를 되찾도록 Airplane이라고 말해 보세요!',
          targetPhrase: 'Airplane',
          phonetic: '[ˈeər.pleɪn]',
          meaningKo: '비행기',
          targetKey: 'airplane',
          guideClip: 'word_airplane',
          rewardHint: '✨ 첫 번째 글자 마법 풀기',
          bossBattle: { name: '보스 미스터 미스스펠', hp: 3, maxHp: 3 },
        },
        {
          type: 'npc',
          speaker: '악당 미스터 미스스펠 · 흔들리는 마법',
          text: '미스터 미스스펠: “Oh! You found the airplane!\n(어라? 비행기 글자를 알아봤잖아! 내 마법이 흔들리고 있어!)”',
          voiceClip: 'Oh! You found the airplane!',
          bossBattle: { name: '보스 미스터 미스스펠', hp: 2, maxHp: 3 },
          rewardBanner: '✨ 비행기 글자가 돌아왔어요!',
        },
        {
          type: 'speak',
          speaker: '홍길동 & 딩고 · 보스 공격 2/3 🎙️',
          prompt: '🍎 사과 그림에 걸린 마법을 풀도록 Apple이라고 말해 보세요!',
          targetPhrase: 'Apple',
          phonetic: '[ˈæp.əl]',
          meaningKo: '사과',
          targetKey: 'apple',
          guideClip: 'word_apple',
          rewardHint: '✨ 두 번째 글자 마법 풀기',
          bossBattle: { name: '보스 미스터 미스스펠', hp: 2, maxHp: 3 },
        },
        {
          type: 'npc',
          speaker: '악당 미스터 미스스펠 · 마지막 봉인',
          text: '미스터 미스스펠: “Not the apple too!\n(사과 글자까지 되찾다니! 하지만 마지막 봉인은 못 풀걸!)”',
          voiceClip: 'Not the apple too!',
          bossBattle: { name: '보스 미스터 미스스펠', hp: 1, maxHp: 3 },
          rewardBanner: '✨ 사과 글자도 돌아왔어요!',
        },
        {
          type: 'speak',
          speaker: '홍길동 & 딩고 · 최후의 일격 3/3 🎙️',
          prompt: '❓ 마지막 세 번째 A 단어를 외쳐 마지막 마법을 풀고 A 조각을 되찾아 주세요!',
          targetPhrase: 'Ask',
          phonetic: '[æsk]',
          meaningKo: '묻다 · 질문하다',
          targetKey: 'ask',
          guideClip: 'word_ask',
          rewardHint: '✨ 마지막 봉인을 풀고 A 조각 되찾기!',
          bossBattle: { name: '보스 미스터 미스스펠', hp: 1, maxHp: 3 },
          onPass: () => {
            grantResult = grantStage1ClearReward(state);
            milestone(1);
          },
        },
        {
          type: 'npc',
          speaker: '악당 미스터 미스스펠 · 풀려난 출구',
          text: '미스터 미스스펠: “My spell is broken! I will be back!\n(앗, 내 마법이 풀렸어! A 조각까지 빛나잖아! 다음에는 못 지나갈 거야!)”',
          voiceClip: 'My spell is broken! I will be back!',
          bossBattle: { name: '보스 미스터 미스스펠 (격파!)', hp: 0, maxHp: 3 },
          rewardBanner: '✨ 출구의 마법이 풀렸어요! EXIT 문이 열렸습니다!',
        },
        {
          type: 'badge_reveal',
          speaker: '🏆 첫 번째 모험 알파벳 조각 획득! · GOLDEN LETTER [A]',
          letter: 'A',
          badgeTitle: '첫 번째 모험 황금 알파벳 「A」 조각 획득!',
          text: '링고: “We found the A piece! The way is open!\n축하합니다! 흩어졌던 첫 번째 A 조각을 되찾았어요! 이제 공항 밖으로 나갈 수 있어요!”',
          voiceClip: 'We found the A piece! The way is open!',
          rewardBanner: () =>
            grantResult.granted
              ? '🎁 보스 격파 보상: 🅰️ 황금 A 조각 + 철 블록 1개 + 완료 보상 나무·흙·철 각 5개!'
              : `✓ 황금 A 조각 보유 중! (다시 말해도 블록을 받을 수 있어요!)`,
        },

      ],
      () => {
        cutsceneLocked = false;
        updateSidebar();
        openAlphabetDexModal({ justCleared: true });
      }
    );
  }

  function triggerBusEndingHook() {
    state.busHookSeen = true;
    persist();
    updateSidebar();
    say(
      '15쪽 엔딩 후크 · 다음은 B! (BUS → SUB)',
      [
        {
          type: 'npc',
          speaker: '미스터 미스스펠 (Mr. Misspell)',
          text: '미스터 미스스펠: “흥, A 배지 하나 얻었다고 우쭐대긴! 다음엔 BUS를 SUB로 바꿔 놓겠다! 히히히!”\n— [제2화 예고: 사라진 보따리와 B의 버스!] —',
          voiceClip: 'misspell_bus_sub',
          image: 'assets/stage1/page15.jpg',
        },
      ],
      null,
      [
        ['📖 알파벳 조각 & 단어 도감 열기', () => openAlphabetDexModal()],
        ['🧱 내 블록 세계로 가기', () => blockWorldUI.open()],
        ['📜 링고의 영어 두루마리(복습) 열기', () => openRingoScrollModal()],
        ['계속 공항 둘러보기', () => {}],
      ]
    );
  }

  function act() {
    if (saveCorruptedError || cutsceneLocked || anyModalOpen()) return;
    if (menuOpen) {
      toggleMenu(false);
      return;
    }
    if (dialog) {
      advanceDialog();
      return;
    }

    const map = currentMap();
    const d = DIRECTIONS[state.facing] || DIRECTIONS.down;
    const tx = state.x + d[0];
    const ty = state.y + d[1];
    const objs = map.getObjects(state);

    if (state.map === 'JoseonMarket') {
      triggerJoseonIntroAndArriveAtAirport();
      return;
    }

    // Check if facing the companion following Dingo(Hwalbin)
    if (isHwalbinFollowing() && followerState.x === tx && followerState.y === ty) {
      if(ensureLearningState(state).failures>=5){say('활빈','너의 목소리가 안 들려. 마이크를 한번 확인해 볼래?',null,[['확인했어',()=>{state.learning.failures=0;persist();}]]);}else openRepeatConversation({id:'npc_hwalbin',label:'활빈'});
      return;
    }

    const target =
      objs.find(o => o.x === tx && o.y === ty) ||
      (map.collision[ty]?.[tx] === 'COUNTER'
        ? objs.find(o => o.x === tx + d[0] && o.y === ty + d[1])
        : null);

    if (!target) {
      if (tx === 17 && ty === 5 && !state.staffSpeech.completed) {
        say(
          '분실물 보관소 출입문 (LOCK)',
          '문이 잠겨 있습니다! 바로 왼쪽 아래 「안내 데스크 직원」에게 가서 Speak로 대화하면 문을 열어 줍니다.'
        );
      }
      return;
    }

    if (target.kind === 'npc' && ensureLearningState(state).failures >= 5) {
      say(target.label || '친구','너의 목소리가 안 들려. 마이크가 켜져 있는지 한번 확인해 볼래?',null,[['확인했어! 다시 이야기하기',()=>{state.learning.failures=0;persist();}],['나중에 이야기하기',()=>{}]]);return;
    }
    if (state.map !== 'AirportHall') {stage2Act(target);return;}
    if (target.kind === 'npc' && REPEAT_DIALOGUES[target.id]) {
      const visits=ensureLearningState(state).visits;
      const functional=target.id==='npc_staff'&&!state.staffSpeech.completed || ['npc_amy','npc_ringo'].includes(target.id)&&!state.practice.completed || target.id==='npc_hwalbin'&&!isHwalbinFollowing();
      if(visits[target.id]&&!functional){openRepeatConversation(target);return;}
      visits[target.id]=(visits[target.id]||0)+1;persist();
    }

    if (target.kind === 'investigate' && target.wordId) {
      if (state.stage === 'explore_misspell') {
        state.stage = 'discover_words';
        persist();
      }
      openWordDiscoveryModal(target.wordId);
      return;
    }

    if (target.id === 'target_exit_sign' || target.id === 'npc_misspell') {
      if (state.stage === 'explore_misspell') {
        triggerMisspellScrambleAndMeetAmy();
        return;
      }
      if (state.stage === 'stage1_complete' || state.rewardReceipts?.[STAGE1_REWARD_ID]) {
        if (target.id === 'target_exit_sign') {
          enterStage2();
          return;
        }
      }
      startMisspellBossBattle();
      return;
    }

    if (target.id === 'npc_traveler') {
      startTravelerConversation();
      return;
    }

    if (target.id === 'npc_pilot') {
      startPilotConversation();
      return;
    }

    if (target.id === 'npc_guard') {
      startGuardConversation();
      return;
    }

    if (target.id === 'npc_cafe') {
      startCafeConversation();
      return;
    }

    if (target.id === 'npc_kid_traveler') {
      startKidTravelerConversation();
      return;
    }

    if (target.id === 'npc_amy' || target.id === 'npc_ringo') {
      if (!allCluesDiscovered()) {
        const foundCount = ['airplane', 'apple', 'ask'].filter(k => state.discoveries[k]).length;
        say(
          '에이미 & 링고 (A 단서 3종 찾기)',
          [
            {
              type: 'npc',
              speaker: '에이미 & 링고',
              text: `에이미: “길동아, 미스스펠이 어떤 글자를 뒤섞었는지 알아내야 해. 나머지 실마리도 같이 찾아보자!”\n• 현재 진행: ${foundCount}/3 완료\n• 남은 단서: ${missingCluesLabel()}\n(주변 기장님, 심사관, 카페 점원, 여행객과도 자유롭게 영어 인사를 나눠 봐!)`,
              voiceClip: 'Let us find the clues together.',
            },
          ]
        );
        return;
      }
      startAmyConversation();
      return;
    }

    if (target.id === 'npc_staff') {
      interactWithStaff();
      return;
    }

    if (target.id === 'npc_hwalbin') {
      interactWithHwalbin();
      return;
    }
  }

  function move(dir) {
    if (saveCorruptedError || cutsceneLocked || anyModalOpen() || dialog || menuOpen) return;
    const d = DIRECTIONS[dir];
    if (!d) return;
    if (playerWalk.sample({ map: state.map, x: state.x, y: state.y }, performance.now()).walking) return;

    state.facing = dir;
    const map = currentMap();
    const nx = state.x + d[0];
    const ny = state.y + d[1];

    if (state.map === 'JoseonMarket') {
      const canStep =
        nx >= 0 &&
        ny >= 0 &&
        nx < map.width &&
        ny < map.height &&
        map.collision[ny]?.[nx] === 'FLOOR' &&
        !map.getObjects(state).some(o => o.x === nx && o.y === ny && o.kind === 'npc');
      if (!canStep) return;
      const before = { map: state.map, x: state.x, y: state.y };
      state.x = nx;
      state.y = ny;
      state.steps += 1;
      playerWalk.begin(before, { map: state.map, x: state.x, y: state.y }, performance.now());
      persist();
      if (ny <= 3) {
        triggerJoseonIntroAndArriveAtAirport();
      }
      return;
    }

    const portal=walkingPortal(state,nx,ny);
    if(portal&&!portal.ready){held.clear();if(portal.id!=='airport_exit')stage2Act(portal);return;}
    if (!map.isPassable(state, nx, ny)&&!portal?.ready) {
      if (nx === 17 && ny === 5 && !state.staffSpeech.completed) {
        say(
          '분실물 보관소 출입문',
          '안내 데스크 직원에게 가서 Speak 버튼으로 “Excuse me. Can I ask?”라고 말하면 문을 열어 줍니다!'
        );
      }
      return;
    }

    const before = { map: state.map, x: state.x, y: state.y };
    state.x = nx;
    state.y = ny;
    state.steps += 1;
    const nowTs = performance.now();
    if(portal?.ready)pendingWalkPortal={...portal,map:state.map};
    playerWalk.begin(before, { map: state.map, x: state.x, y: state.y }, nowTs);

    // companion follower: Dingo(Hwalbin) steps onto Gildong's previous tile!
    if (isHwalbinFollowing()) {
      const fBefore = { map: state.map, x: followerState.x, y: followerState.y };
      const dx = before.x - fBefore.x;
      const dy = before.y - fBefore.y;
      const fDir =
        Math.abs(dx) + Math.abs(dy) === 1
          ? dx === 1
            ? 'right'
            : dx === -1
            ? 'left'
            : dy === 1
            ? 'down'
            : 'up'
          : dir;
      followerState = { x: before.x, y: before.y, facing: fDir };
      if (Math.abs(dx) + Math.abs(dy) <= 2) {
        followerWalk.begin(fBefore, { map: state.map, x: followerState.x, y: followerState.y }, nowTs);
      } else {
        followerWalk.reset();
      }
    }

    persist();

    if (state.stage === 'explore_misspell' && ny <= 4 && nx >= 7 && nx <= 13) {
      triggerMisspellScrambleAndMeetAmy();
    }
  }

  function toggleMenu(force) {
    if (saveCorruptedError || cutsceneLocked || anyModalOpen()) return;
    if (dialog) {
      speechRecognizer.cancel();
      cancelActiveVoice();
      dialog = null;
      renderDialog();
      return;
    }
    menuOpen = force ?? !menuOpen;
    $('#menu').hidden = !menuOpen;
    if (mapLabelsOverlay) {
      mapLabelsOverlay.classList.toggle('dimmed', Boolean(dialog || menuOpen));
    }
    held.clear();
    if (menuOpen) $('#close-menu')?.focus();
    else canvas.focus({ preventScroll: true });
    updateSidebar();
  }

  function updateSidebar() {
    const map = currentMap();
    $('#location').textContent = map.name;
    $('#trainer-name').textContent = user?.name || '홍길동';

    const goalEl = $('#current-goal-banner');
    if (goalEl) goalEl.textContent = ['BusStop','BusInterior','NextStop'].includes(state.map) ? stage2Goal(state) : currentStageGoal(state);

    const listEl = $('#stage1-checklist');
    if (listEl) {
      listEl.replaceChildren();
      for (const item of STAGE1_CHECKLIST) {
        const done = item.isDone(state);
        const li = document.createElement('li');
        li.id = `check-${item.id}`;
        if (done) li.className = 'done';
        li.innerHTML = `<span class="check"></span><div><b>${item.title}</b><small>${item.subtitle}</small></div>`;
        listEl.append(li);
      }
    }

    const wordsEl = $('#stage1-word-badges');
    if (wordsEl) {
      wordsEl.replaceChildren();
      for (const [id, w] of Object.entries(STAGE1_WORDS)) {
        const found = !!state.discoveries[id];
        const b = document.createElement('button');
        b.type = 'button';
        b.id = `sidebar-word-${id}`;
        b.className = 'me-word-chip' + (found ? ' found' : '');
        b.innerHTML = `<b>${found ? '✓ ' : '🎙️ '}${w.word} ${w.phonetic || ''}</b><small>${w.korean} · Speak 연습</small>`;
        b.onclick = () => {
          openWordDiscoveryModal(id);
        };
        wordsEl.append(b);
      }
    }

    // Pokémon Gold-style Gym Badge Case (A ~ Z)
    const rewardCleared = Boolean(
      state.rewardReceipts?.[STAGE1_REWARD_ID] ||
        state.alphabetPieces?.includes('A') ||
        state.alphabet?.includes('A')
    );
    const badgeCaseEl = $('#alphabet-badge-case');
    const badgeCountEl = $('#badge-case-count');
    if (badgeCountEl) {
      badgeCountEl.textContent = `${new Set([...(state.alphabetPieces||[]),...(rewardCleared?['A']:[])]).size} / 26 BADGES`;
    }
    if (badgeCaseEl) {
      badgeCaseEl.replaceChildren();
      for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')) {
        const earned =
          L === 'A' ? rewardCleared : Boolean(state.alphabetPieces?.includes(L) || state.alphabet?.includes(L));
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 'me-badge-slot' + (earned ? ' earned' : '');
        slot.textContent = earned ? `★${L}` : L;
        slot.title = earned ? `${L} 알파벳 조각 획득 완료! (클릭하여 도감 열기)` : `${L} 배지 (미획득)`;
        slot.onclick = () => openAlphabetDexModal();
        badgeCaseEl.append(slot);
      }
    }

    const stage2Active=['BusStop','BusInterior','NextStop'].includes(state.map);
    document.querySelector('.chapter-number').textContent=stage2Active?'02':'01';
    document.querySelector('.chapter .eyebrow').textContent=stage2Active?'STAGE 2 · ALPHABET B':'STAGE 1 · ALPHABET A';
    document.querySelector('.chapter h2').textContent=stage2Active?'사라진 보따리와 B의 버스':'활빈 찾기와 첫 영어 말하기';
    document.querySelector('.partner .eyebrow').textContent='ADVENTURE · BLOCK REWARDS';
    $('#partner').textContent=(isHwalbinFollowing()?'💛 활빈과 동행 중 · ':'활빈을 찾아주세요 · ')+`알파벳 조각: ${state.alphabetPieces.join(' · ') || '아직 없음'}`;
    $('#party').textContent='대화 성공: 나무 1개 · 완전한 문장: 2개 · 조각: 철 1개 · Stage 완료: 나무·흙·철 각 5개';
    const pending=ensureLearningState(state).pending.length;
    if(pending)$('#party').textContent+=` · 보상 ${pending}건 전달 대기`;
    const label=document.querySelector('.console-bottom span:nth-child(2)');if(label)label.textContent=stage2Active?'MAGIC ENGLISH · STAGE 2':'MAGIC ENGLISH · STAGE 1';
    if(stage2Active){
      const st=ensureStage2(state);
      listEl.replaceChildren();
      for(const item of STAGE2_CHECKLIST){
        const done=item.isDone(state);
        const li=document.createElement('li');
        li.id=`check-${item.id}`;
        if(done)li.className='done';
        li.innerHTML=`<span class="check"></span><div><b>${item.title}</b><small>${item.subtitle}</small></div>`;
        listEl.append(li);
      }
      wordsEl.replaceChildren();
      for(const [id,w] of Object.entries(STAGE2_WORDS)){
        const found=Boolean(st.words[id]);
        const button=document.createElement('button');
        button.type='button';
        button.id=`sidebar-word-${id}`;
        button.className='me-word-chip'+(found?' found':'');
        button.innerHTML=`<b>${found?'✓ ':'🎙️ '}${w.word} ${w.phonetic||''}</b><small>${w.korean} · Speak 연습</small>`;
        button.onclick=()=>openWordDiscoveryModal(id);
        wordsEl.append(button);
      }
    }
  }

  function drawSprite(spriteName, x, y, dir = 'down', pose = null) {
    const image = images[spriteName] || images.me_gildong;
    if (!image) return;
    const { frame, flip, mirrorLegs } = pose || walkingPose(dir, false);
    ctx.save();
    ctx.translate(Math.round(x) + (flip ? 16 : 0), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    if (mirrorLegs) {
      ctx.drawImage(image, 0, frame * 16, 16, 11, 0, 0, 16, 11);
      ctx.save();
      ctx.translate(16, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(image, 0, frame * 16 + 11, 16, 5, 0, 11, 16, 5);
      ctx.restore();
    } else {
      ctx.drawImage(image, 0, frame * 16, 16, 16, 0, 0, 16, 16);
    }
    ctx.restore();
  }

  function drawLoop(now) {
    requestAnimationFrame(drawLoop);
    if(pendingWalkPortal&&!dialog&&!menuOpen&&!cutsceneLocked&&!anyModalOpen()&&!playerWalk.sample({map:state.map,x:state.x,y:state.y},now).walking){
      const portal=pendingWalkPortal;pendingWalkPortal=null;held.clear();
      if(portal.map===state.map){if(portal.id==='airport_exit')enterStage2();else stage2Act(portal);}
    }
    if (saveCorruptedError) return;

    if (held.size && now >= nextMove && !anyModalOpen() && !dialog && !menuOpen && !cutsceneLocked) {
      move([...held].at(-1));
      nextMove = now + MOVEMENT_TIMING.repeat;
    }

    ctx.fillStyle = '#dbe7ba';
    ctx.fillRect(0, 0, 160, 144);

    const map = currentMap();
    const pos = playerWalk.sample({ map: state.map, x: state.x, y: state.y }, now);
    const { x, y } = pos;

    const ox = Math.round(
      map.width <= 10 ? (160 - map.width * 16) / 2 : -Math.max(0, Math.min(map.width * 16 - 160, x * 16 - 72))
    );
    const oy = Math.round(
      map.height <= 9 ? (144 - map.height * 16) / 2 : -Math.max(0, Math.min(map.height * 16 - 144, y * 16 - 64))
    );

    if (state.map === 'JoseonMarket') {
      renderJoseonMarketMap(ctx, ox, oy, state, now);
    } else if (state.map !== 'AirportHall') {
      renderStage2Map(ctx, ox, oy, state, currentMap());
    } else {
      renderAirportHallMap(ctx, ox, oy, state, now);
      const exitOpen=!!state.rewardReceipts[STAGE1_REWARD_ID];ctx.fillStyle=exitOpen?'#426c52':'#875b3e';ctx.fillRect(ox+160,oy+16,16,16);if(!exitOpen){ctx.fillStyle='#f0ce5c';ctx.fillRect(ox+172,oy+24,2,2);}
    }

    const baseObjectsMap = {
      AirportHall: airportObjects,
      BusStop: busStopObjects,
      NextStop: nextStopObjects,
    }[state.map];
    if (baseObjectsMap) {
      airportLife.update(now, {
        paused: Boolean(dialog || cutsceneLocked || menuOpen || anyModalOpen()),
        objects: baseObjectsMap(state),
        collision: map.collision,
        player: state,
        follower: isHwalbinFollowing() ? followerState : null,
      });
    }
    const objects = map.getObjects(state);
    const actors = objects
      .filter(o => o.sprite)
      .map(o => ({
        ...(baseObjectsMap ? airportLife.sample(o, now) : o),
        dir: ['up', 'down', 'left', 'right'].includes(o.direction) ? o.direction : 'down',
      }));

    let followerSample = null;
    if (isHwalbinFollowing()) {
      followerSample = followerWalk.sample({ map: state.map, x: followerState.x, y: followerState.y }, now);
      actors.push({
        x: followerSample.x,
        y: followerSample.y,
        sprite: 'me_hwalbin',
        dir: followerState.facing || state.facing,
        follower: true,
        walkSample: followerSample,
      });
    }

    actors.push({
      x,
      y,
      sprite: 'me_gildong',
      dir: state.facing,
      player: true,
    });
    actors.sort((a, b) => a.y - b.y);

    for (const actor of actors) {
      drawSprite(
        actor.sprite,
        ox + actor.x * 16,
        oy + actor.y * 16 - 4,
        actor.dir,
        actor.player
          ? walkingPose(actor.dir, pos.walking, pos.foot, pos.progress)
          : actor.follower && actor.walkSample
          ? walkingPose(actor.dir, actor.walkSample.walking, actor.walkSample.foot, actor.walkSample.progress)
          : actor.walking ? walkingPose(actor.dir,true,Math.floor(now/260)%2,actor.progress) : null
      );
    }

    if (state.map !== 'JoseonMarket' && state.map !== 'AirportHall') {
      mapLabelsOverlay.replaceChildren();
      mapLabelsOverlay.dataset.sig = '';
      for (const o of objects) {
        const actor = actors.find(a => a.id === o.id);
        const ax = actor ? actor.x : o.x;
        const ay = actor ? actor.y : o.y;
        if (ox + ax * 16 < 0 || ox + ax * 16 > 152 || oy + ay * 16 < 8 || oy + ay * 16 > 140) continue;
        const el = document.createElement('span');
        const cls = o.badge?.startsWith('✓')
          ? 'done'
          : o.id?.startsWith('s2_word_')
          ? 'word'
          : o.id?.startsWith('s2_sign_') || o.id === 's2_misspell'
          ? 'scramble'
          : o.kind === 'npc'
          ? 'npc'
          : 'sign';
        el.className = `me-map-label ${cls}`;
        el.textContent = o.badge;
        el.style.position = 'absolute';
        el.style.left = ((ox + ax * 16 + 8) / 160) * 100 + '%';
        el.style.top = ((oy + ay * 16 - 3) / 144) * 100 + '%';
        mapLabelsOverlay.append(el);
      }
      if (followerSample) {
        const fx = ox + (followerSample.x + 0.5) * 16;
        const fy = oy + (followerSample.y - 0.35) * 16;
        if (fx >= 6 && fx <= 154 && fy >= 4 && fy <= 138) {
          const fEl = document.createElement('span');
          fEl.className = 'me-map-label done';
          fEl.textContent = '💛 딩고(활빈)';
          fEl.style.position = 'absolute';
          fEl.style.left = (fx / 160) * 100 + '%';
          fEl.style.top = (fy / 144) * 100 + '%';
          mapLabelsOverlay.append(fEl);
        }
      }
      return;
    }
    updateMapLabelsOverlay(
      mapLabelsOverlay,
      ox,
      oy,
      state,
      followerSample ? { x: followerSample.x, y: followerSample.y } : null,
      actors
    );
  }

  await Promise.all(
    spriteNames.map(
      name =>
        new Promise((resolve, reject) => {
          const im = new Image();
          im.onload = () => {
            images[name] = im;
            resolve();
          };
          im.onerror = () => reject(new Error(`스프라이트 로딩 실패: ${name}`));
          im.src = `assets/${name}.png?v=20261025-stage1`;
        })
    )
  );

  const rawSave = localStorage.getItem(saveKey);
  if (rawSave !== null) {
    const parsed = parseMagicEnglishState(rawSave);
    if (!parsed.ok) {
      saveCorruptedError = parsed.error;
      const loadingEl = $('#loading');
      loadingEl.hidden = false;
      loadingEl.innerHTML = `
        <div style="padding:18px;text-align:center;">
          <b>기존 마법영어 저장 기록(${saveKey})을 읽지 못했어요.</b>
          <p style="font-size:12px;margin:8px 0;">기록 보호를 위해 자동으로 덮어쓰거나 초기화하지 않고 멈추었어요.</p>
        </div>
      `;
      return;
    }
    state = parsed.state;
    if (isHwalbinFollowing()) {
      syncFollowerToPlayer();
    }
    toast('저장된 마법영어 Stage 1 모험을 이어서 시작해요!');
  } else {
    persist();
  }

  ensureLearningState(state); void flushRewards();
  $('#loading').hidden = true;
  warmCharacterVoices();
  const savedPortal=walkingPortal(state,state.x,state.y);if(savedPortal?.ready)pendingWalkPortal={...savedPortal,map:state.map};
  if(new URLSearchParams(location.search).get('arrival')==='adventure'){void arrival('📖 마법영어 모험으로 돌아왔어요!');const url=new URL(location.href);url.searchParams.delete('arrival');history.replaceState(null,'',url.pathname+url.search);}
  updateSidebar();

  if (state.stage === 'joseon_intro' && state.map === 'JoseonMarket' && state.steps === 0) {
    say(
      '제1화 · 조선의 영웅, 미국에 떨어지다!',
      [
        '홍길동: “내 이름은 홍길동! 억울한 아이를 구하고 푸른 시간 균열(A)을 조사해 보자!” · 활빈을 찾아주세요!',
      ],
      null,
      null,
      'assets/stage1/page01.jpg'
    );
  } else if (state.stage === 'baggage_separation') {
    state.stage = 'explore_misspell';
    persist();
    updateSidebar();
  }

  const keyMap = {
    ArrowUp: 'up',
    w: 'up',
    ArrowDown: 'down',
    s: 'down',
    ArrowLeft: 'left',
    a: 'left',
    ArrowRight: 'right',
    d: 'right',
  };

  window.addEventListener('keydown', e => {
    if (anyModalOpen() || saveCorruptedError) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.tagName === 'BUTTON' && e.key === 'Enter') return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keyMap[k]) {
      e.preventDefault();
      if (!held.has(keyMap[k])) {
        move(keyMap[k]);
        nextMove = performance.now() + MOVEMENT_TIMING.holdDelay;
      }
      held.add(keyMap[k]);
    } else if (['z', 'Enter', ' '].includes(k)) {
      e.preventDefault();
      if (!e.repeat) act();
    } else if (['x', 'Escape'].includes(k)) {
      e.preventDefault();
      if (!e.repeat) toggleMenu();
    }
  });

  window.addEventListener('keyup', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keyMap[k]) held.delete(keyMap[k]);
  });
  window.addEventListener('blur', () => held.clear());

  for (const b of document.querySelectorAll('[data-move]')) {
    b.onpointerdown = e => {
      e.preventDefault();
      if (anyModalOpen() || cutsceneLocked) return;
      b.setPointerCapture(e.pointerId);
      move(b.dataset.move);
      held.add(b.dataset.move);
      nextMove = performance.now() + MOVEMENT_TIMING.holdDelay;
    };
    b.onpointerup = b.onpointercancel = () => held.delete(b.dataset.move);
    b.onlostpointercapture = () => held.delete(b.dataset.move);
  }

  $('#dialog-next').onclick = () => advanceDialog(false);
  $('#menu-button').onclick = () => toggleMenu();
  $('#touch-menu').onclick = () => toggleMenu();
  $('#touch-action').onclick = act;

  const saveHandler = () => {
    if (persist()) toast('마법영어 Stage 1 모험과 블록 세계를 저장했어요!');
  };
  $('#save-button').onclick = saveHandler;
  $('#save-menu').onclick = saveHandler;

  $('#load-menu').onclick = () => {
    const raw = localStorage.getItem(saveKey);
    const parsed = parseMagicEnglishState(raw);
    if (!parsed.ok) {
      toast('불러올 수 있는 마법영어 저장 기록이 없어요.');
      return;
    }
    state = parsed.state;
    playerWalk.reset();
    if (isHwalbinFollowing()) syncFollowerToPlayer();
    toggleMenu(false);
    updateSidebar();
    toast('저장한 마법영어 모험을 불러왔어요.');
  };

  $('#open-alphabet-dex-btn')?.addEventListener('click', () => {
    toggleMenu(false);
    openAlphabetDexModal();
  });
  $('#open-alphabet-dex-menu')?.addEventListener('click', () => {
    toggleMenu(false);
    openAlphabetDexModal();
  });
  $('#open-block-world-btn')?.addEventListener('click', () => {
    toggleMenu(false);
    blockWorldUI.open();
  });
  $('#open-block-world-menu')?.addEventListener('click', () => {
    toggleMenu(false);
    blockWorldUI.open();
  });
  $('#open-scroll-menu')?.addEventListener('click', () => {
    toggleMenu(false);
    openRingoScrollModal();
  });
  $('#open-scroll-btn')?.addEventListener('click', () => {
    openRingoScrollModal();
  });
  $('#open-practice-menu')?.addEventListener('click', () => {
    toggleMenu(false);
    openSpeakingModal('practice');
  });

  $('#close-menu').onclick = () => toggleMenu(false);
  $('#restart').onclick = () => {
    toggleMenu(false);
    say(
      '마법영어 Stage 1 처음부터 다시 시작',
      '조선 장터 도입부터 Stage 1 모험을 새로 시작할까요?\n(기존 건축 세계와 받은 블록은 그대로 남아요.)',
      null,
      [
        [
          '처음부터 시작하기',
          () => {
            state = createInitialMagicEnglishState();
            playerWalk.reset();
            followerWalk.reset();
            persist();
            updateSidebar();
            toast('조선 장터에서 홍길동과 활빈의 이야기를 새로 시작해요!');
          },
        ],
        ['계속 모험하기', () => {}],
      ]
    );
  };

  window.__MAGIC_ENGLISH_STAGE1__ = {
    getState: () => state,
    getAirportObjects:()=>AIRPORT_MAP.getObjects(state),
    getFollowerState: () => ({ ...followerState, following: isHwalbinFollowing() }),
    saveKey,
    openWordDiscoveryModal,
    openSpeakingModal,
    openAlphabetDexModal,
    startMisspellBossBattle,
    openBlockWorld: () => blockWorldUI.open(),
    closeBlockWorld: () => blockWorldUI.close(),
    openRingoScrollModal,
    act,
    move,
  };

  if (new URLSearchParams(location.search).get('view') === 'block-world') {
    blockWorldUI.open();
  }

  canvas.focus({ preventScroll: true });
  requestAnimationFrame(drawLoop);
}
