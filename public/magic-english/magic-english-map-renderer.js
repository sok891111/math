// Pixel-Art GBC Top-Down Map Renderer + High-Resolution DOM Label Overlay
// Removes blurry low-res canvas fillText and renders crisp Retina DOM badges positioned over tiles.

import { STAGE1_REWARD_ID } from './magic-english-story.js';

export function renderJoseonMarketMap(ctx, ox, oy, state, now) {
  const W = 12;
  const H = 10;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = ox + x * 16;
      const py = oy + y * 16;
      const isEdge = x === 0 || x === W - 1 || y === 0 || y === H - 1;
      if (isEdge || (y === 1 && (x < 5 || x > 6))) {
        // Giwa roof tiles
        ctx.fillStyle = '#364147';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#252d32';
        for (let rx = 2; rx < 16; rx += 4) {
          ctx.fillRect(px + rx, py, 2, 14);
        }
        ctx.fillStyle = '#526068';
        ctx.fillRect(px, py + 13, 16, 3);
      } else if ((y === 4 || y === 7) && (x === 2 || x === 3 || x === 8 || x === 9)) {
        // Wooden market stalls
        ctx.fillStyle = '#d9c49a';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#8c5830';
        ctx.fillRect(px + 1, py + 2, 14, 12);
        ctx.fillStyle = '#b97b45';
        ctx.fillRect(px + 2, py + 3, 12, 8);
        ctx.fillStyle = x < 5 ? '#d9483b' : '#4a89c7';
        ctx.fillRect(px + 4, py + 5, 3, 3);
        ctx.fillStyle = '#f2c14e';
        ctx.fillRect(px + 9, py + 5, 3, 3);
      } else {
        // Joseon market dirt path
        ctx.fillStyle = (x + y) % 2 === 0 ? '#dfc89c' : '#d6be90';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#c2a878';
        ctx.fillRect(px + 3, py + 4, 2, 1);
        ctx.fillRect(px + 11, py + 11, 2, 1);
      }
    }
  }

  // Clue marks on ground near (5, 6): red thread & cart wheel track
  const cx = ox + 5 * 16;
  const cy = oy + 6 * 16;
  ctx.fillStyle = '#c83228';
  ctx.fillRect(cx + 4, cy + 5, 5, 2);
  ctx.fillStyle = '#9c7e54';
  ctx.fillRect(cx + 10, cy + 2, 2, 12);

  // Swirling Blue Time Rift ('A' Portal) at (6, 2)
  const rx = ox + 6 * 16;
  const ry = oy + 2 * 16;
  const pulse = Math.sin(now / 180) * 1.5;
  ctx.fillStyle = '#1b4d7e';
  ctx.beginPath();
  ctx.arc(rx + 8, ry + 8, 8 + pulse * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4ec4ff';
  ctx.beginPath();
  ctx.arc(rx + 8, ry + 8, 5 - pulse * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Pixel-art 'A' shape inside portal (no blurry font)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(rx + 7, ry + 5, 2, 1);
  ctx.fillRect(rx + 6, ry + 6, 1, 5);
  ctx.fillRect(rx + 9, ry + 6, 1, 5);
  ctx.fillRect(rx + 7, ry + 8, 2, 1);
}

export function renderAirportHallMap(ctx, ox, oy, state, now) {
  const W = 20;
  const H = 16;
  const isScrambled =
    !['joseon_intro', 'baggage_separation', 'explore_misspell', 'stage1_complete'].includes(state.stage) &&
    !state.rewardReceipts?.[STAGE1_REWARD_ID];
  const doorOpen = !!state.staffSpeech?.completed;

  // 1. Floor & Walls
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = ox + x * 16;
      const py = oy + y * 16;

      if (x === 0 || x === W - 1 || y === 0 || y === H - 1) {
        ctx.fillStyle = '#334858';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#496378';
        ctx.fillRect(px + 1, py + 1, 14, 12);
        continue;
      }

      if (y === 1) {
        ctx.fillStyle = '#dce7ee';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#6f8ea6';
        ctx.fillRect(px, py + 13, 16, 3);
        continue;
      }

      if (x >= 16 && x <= 18 && y >= 2 && y <= 4) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#e4f0d8' : '#d6e7c6';
        ctx.fillRect(px, py, 16, 16);
        continue;
      }

      const onGuidePath =
        (y === 8 && x >= 4 && x <= 14) ||
        (x === 10 && y >= 2 && y <= 8);
      if (onGuidePath) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#4d7cb8' : '#4470a8';
        ctx.fillRect(px, py, 16, 16);
        ctx.fillStyle = '#73a3de';
        ctx.fillRect(px + 2, py + 2, 12, 1);
        continue;
      }

      ctx.fillStyle = (x + y) % 2 === 0 ? '#edf1e6' : '#e2e8d9';
      ctx.fillRect(px, py, 16, 16);
      ctx.fillStyle = '#d2dac7';
      ctx.fillRect(px, py + 15, 16, 1);
      ctx.fillRect(px + 15, py, 1, 16);
    }
  }

  // 2. Northwest Panoramic Runway Window & Airplane (x = 3..5, y = 1)
  {
    const wx = ox + 3 * 16;
    const wy = oy + 1 * 16;
    ctx.fillStyle = '#7ec8f5';
    ctx.fillRect(wx + 2, wy + 1, 44, 13);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx + 6, wy + 3, 8, 3);
    ctx.fillRect(wx + 32, wy + 2, 9, 3);
    // Crisp pixel-art airplane
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wx + 15, wy + 6, 16, 4);
    ctx.fillStyle = '#2c6eb5';
    ctx.fillRect(wx + 20, wy + 3, 4, 10);
    ctx.fillStyle = '#e04f3e';
    ctx.fillRect(wx + 14, wy + 4, 3, 3);
    ctx.strokeStyle = '#334858';
    ctx.lineWidth = 1;
    ctx.strokeRect(wx + 2, wy + 1, 44, 13);
  }

  // 3. North Center Exit / TIXE Sign Board (x = 9..11, y = 1)
  {
    const ex = ox + 9 * 16 + 6;
    const ey = oy + 1 * 16 + 1;
    if (isScrambled) {
      ctx.fillStyle = '#5c2d82';
      ctx.fillRect(ex, ey, 36, 12);
      ctx.fillStyle = '#ffe169';
      // Pixel question/scramble pattern
      ctx.fillRect(ex + 6, ey + 3, 6, 2);
      ctx.fillRect(ex + 15, ey + 5, 6, 2);
      ctx.fillRect(ex + 24, ey + 3, 6, 2);
    } else {
      ctx.fillStyle = '#1f7a4c';
      ctx.fillRect(ex, ey, 36, 12);
      // Crisp pixel up-arrow
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex + 17, ey + 2, 2, 8);
      ctx.fillRect(ex + 15, ey + 4, 6, 2);
    }
  }

  // 4. West Baggage Conveyor Belt (x = 2..3, y = 7..11)
  {
    const bx = ox + 2 * 16;
    const by = oy + 7 * 16;
    ctx.fillStyle = '#3b464e';
    ctx.fillRect(bx, by, 32, 5 * 16);
    ctx.fillStyle = '#687682';
    ctx.fillRect(bx + 2, by + 2, 28, 5 * 16 - 4);
    ctx.fillStyle = '#242c31';
    ctx.fillRect(bx + 5, by + 5, 22, 5 * 16 - 10);

    const offset = Math.floor(now / 120) % 8;
    ctx.fillStyle = '#4a565e';
    for (let sy = offset; sy < 5 * 16 - 10; sy += 8) {
      ctx.fillRect(bx + 6, by + 5 + sy, 20, 2);
    }

    // Suitcases on belt
    ctx.fillStyle = '#d1523e';
    ctx.fillRect(bx + 8, by + 12 + (offset % 6), 10, 8);
    ctx.fillStyle = '#f4d03f';
    ctx.fillRect(bx + 11, by + 10 + (offset % 6), 4, 2);

    ctx.fillStyle = '#3b82b6';
    ctx.fillRect(bx + 10, by + 46 - (offset % 6), 11, 8);
  }

  // 5. Center Airport Cafe Apple Basket Table (x = 9, y = 10)
  {
    const ax = ox + 9 * 16;
    const ay = oy + 10 * 16;
    ctx.fillStyle = '#8c5a32';
    ctx.fillRect(ax + 1, ay + 2, 14, 12);
    ctx.fillStyle = '#d9b382';
    ctx.fillRect(ax + 2, ay + 3, 12, 9);
    ctx.fillStyle = '#a86b32';
    ctx.fillRect(ax + 3, ay + 5, 10, 6);
    ctx.fillStyle = '#e0392b';
    ctx.fillRect(ax + 4, ay + 3, 4, 4);
    ctx.fillRect(ax + 8, ay + 3, 4, 4);
    ctx.fillRect(ax + 6, ay + 2, 4, 4);
    ctx.fillStyle = '#3ca34d';
    ctx.fillRect(ax + 7, ay + 1, 2, 2);
  }

  // 6. East Information Desk Counter (x = 13..16, y = 7) & Ask Sign Stand (x = 13, y = 7)
  {
    const sx = ox + 13 * 16;
    const sy = oy + 7 * 16;
    ctx.fillStyle = '#255c99';
    ctx.fillRect(sx + 2, sy + 2, 12, 12);
    ctx.fillStyle = '#f4d03f';
    ctx.fillRect(sx + 3, sy + 3, 10, 10);
    // Crisp pixel '?' mark
    ctx.fillStyle = '#1b3b5c';
    ctx.fillRect(sx + 6, sy + 4, 4, 1);
    ctx.fillRect(sx + 9, sy + 5, 1, 2);
    ctx.fillRect(sx + 7, sy + 7, 2, 2);
    ctx.fillRect(sx + 7, sy + 10, 2, 1);

    const dx = ox + 14 * 16;
    const dy = oy + 7 * 16;
    ctx.fillStyle = '#2c5378';
    ctx.fillRect(dx, dy + 2, 3 * 16, 13);
    ctx.fillStyle = '#7eb0d9';
    ctx.fillRect(dx + 1, dy + 3, 3 * 16 - 2, 5);
  }

  // 7. Northeast Lost & Found Partition & Gate (x = 15..18, y = 2..5)
  {
    const lx = ox + 15 * 16;
    const ly = oy + 2 * 16;
    ctx.fillStyle = '#58788c';
    ctx.fillRect(lx + 11, ly, 5, 4 * 16);
    ctx.fillStyle = '#a4d4ec';
    ctx.fillRect(lx + 12, ly + 2, 3, 4 * 16 - 4);

    for (let x = 15; x <= 18; x++) {
      const gx = ox + x * 16;
      const gy = oy + 5 * 16;
      if (x === 17) {
        if (!doorOpen) {
          // Crisp pixel lock bar
          ctx.fillStyle = '#c84b31';
          ctx.fillRect(gx + 1, gy + 5, 14, 6);
          ctx.fillStyle = '#ffe169';
          ctx.fillRect(gx + 6, gy + 6, 4, 4);
        } else {
          ctx.fillStyle = '#68b678';
          ctx.fillRect(gx + 1, gy + 12, 14, 3);
        }
      } else {
        ctx.fillStyle = '#58788c';
        ctx.fillRect(gx, gy + 4, 16, 8);
        ctx.fillStyle = '#a4d4ec';
        ctx.fillRect(gx + 1, gy + 6, 14, 4);
      }
    }
  }
}

/**
 * Updates the high-resolution DOM overlay (`#map-labels-overlay`) so every in-game sign
 * and interactive target badge is rendered with crystal-clear native font resolution.
 */
export function updateMapLabelsOverlay(overlayEl, ox, oy, state, followerTile = null, actors = []) {
  if (!overlayEl) return;

  const items = [];

  if (state.map === 'JoseonMarket') {
    items.push({
      key: 'rift',
      tx: 6.5,
      ty: 1.5,
      text: '✨ 시간 균열 (A)',
      cls: 'priority',
    });
    items.push({
      key: 'kid',
      tx: 5.5,
      ty: 4.5,
      text: '심부름꾼 아이',
      cls: 'npc',
    });
    items.push({
      key: 'hwalbin_joseon',
      tx: 7.5,
      ty: 5.5,
      text: '활빈',
      cls: 'npc',
    });
  } else {
    const isScrambled =
      !['joseon_intro', 'baggage_separation', 'explore_misspell', 'stage1_complete'].includes(state.stage) &&
      !state.rewardReceipts?.[STAGE1_REWARD_ID];
    const doorOpen = !!state.staffSpeech?.completed;

    // 1. Airplane Window
    items.push({
      key: 'airplane',
      tx: 4.5,
      ty: 0.85,
      text: state.discoveries?.airplane ? '✓ Airplane' : '✈️ Airplane (조사)',
      cls: state.discoveries?.airplane ? 'done' : 'word',
    });

    // 2. Exit / TIXE / Bus Stop Sign
    items.push({
      key: 'exit',
      tx: 10.5,
      ty: 0.85,
      text:
        state.stage === 'explore_misspell'
          ? '❗ EXIT (조사)'
          : state.stage === 'stage1_complete' && !state.busHookSeen
          ? '🚪 열린 문 · Stage 2'
          : isScrambled
          ? '🔮 TIXE ?!'
          : '🚪 EXIT ↑',
      cls: isScrambled || state.stage === 'explore_misspell' ? 'scramble' : 'sign',
    });

    // 3. Baggage Belt
    items.push({
      key: 'baggage',
      tx: 3.0,
      ty: 6.7,
      text: '🧳 수하물 벨트',
      cls: 'sign',
    });

    // 4. Apple Cafe Table
    items.push({
      key: 'apple',
      tx: 9.5,
      ty: 9.65,
      text: state.discoveries?.apple ? '✓ Apple' : '🍎 Apple (조사)',
      cls: state.discoveries?.apple ? 'done' : 'word',
    });

    // 5. Ask Sign Stand
    items.push({
      key: 'ask',
      tx: 13.5,
      ty: 6.55,
      text: state.discoveries?.ask ? '✓ Ask' : '❓ Ask (조사)',
      cls: state.discoveries?.ask ? 'done' : 'word',
    });

    // 6. Info Desk & Staff
    items.push({
      key: 'staff',
      tx: 15.5,
      ty: 5.55,
      text: state.stage === 'speak_to_staff' ? '🎙️ 안내 직원 (말하기!)' : '💁 INFO DESK 직원',
      cls: state.stage === 'speak_to_staff' ? 'priority' : 'npc',
    });

    // 7. Mr. Misspell Boss & Lost & Found Dingo/Hwalbin
    if (!state.rewardReceipts?.[STAGE1_REWARD_ID]) {
      items.push({
        key: 'misspell',
        tx: 11.5,
        ty: 1.55,
        text: state.stage === 'battle_misspell' ? '😈 미스터 미스스펠 (보스 대결!)' : '😈 미스터 미스스펠',
        cls: state.stage === 'battle_misspell' ? 'priority' : 'scramble',
      });
    }

    const hwalbinRescued = Boolean(
      state.rewardReceipts?.['hwalbin-rescued'] ||
        state.rewardReceipts?.[STAGE1_REWARD_ID] ||
        ['battle_misspell', 'stage1_complete'].includes(state.stage)
    );
    if (!hwalbinRescued) {
      items.push({
        key: 'hwalbin',
        tx: 17.5,
        ty: 2.55,
        text: doorOpen ? '💛 딩고(활빈) 구출!' : '🔒 분실물함 (딩고/활빈)',
        cls: doorOpen ? 'priority' : 'sign',
      });
    } else if (followerTile) {
      items.push({
        key: 'hwalbin_follower',
        tx: followerTile.x + 0.5,
        ty: followerTile.y - 0.35,
        text: '💛 딩고(활빈)',
        cls: 'done',
      });
    }

    // 8. Amy & Ringo
    if (!['joseon_intro', 'baggage_separation', 'explore_misspell'].includes(state.stage)) {
      items.push({
        key: 'amy',
        tx: 8.5,
        ty: 5.55,
        text: state.stage === 'practice_with_amy' ? '💬 에이미 (연습!)' : '에이미',
        cls: state.stage === 'practice_with_amy' ? 'priority' : 'npc',
      });
      items.push({
        key: 'ringo',
        tx: 10.5,
        ty: 5.55,
        text: '링고',
        cls: 'npc',
      });
    }

    // 9. Traveler & Additional Airport NPCs
    items.push({
      key: 'traveler',
      tx: 5.5,
      ty: 11.55,
      text: '🧳 여행객',
      cls: 'npc',
    });
    items.push({
      key: 'pilot',
      tx: 2.5,
      ty: 2.55,
      text: '✈️ 기장님',
      cls: 'npc',
    });
    items.push({
      key: 'guard',
      tx: 6.5,
      ty: 3.55,
      text: '👮 심사관',
      cls: 'npc',
    });
    items.push({
      key: 'cafe',
      tx: 11.5,
      ty: 9.55,
      text: '🍎 카페 점원',
      cls: 'npc',
    });
    items.push({
      key: 'kid_traveler',
      tx: 14.5,
      ty: 11.55,
      text: '🎈 꼬마 친구',
      cls: 'npc',
    });
  }

  for(const [key,id]of [['traveler','npc_traveler'],['pilot','npc_pilot'],['kid_traveler','npc_kid_traveler'],['cafe','npc_cafe'],['guard','npc_guard']]){const actor=actors.find(a=>a.id===id),label=items.find(i=>i.key===key);if(actor&&label){label.tx=actor.x+.5;label.ty=actor.y-.45;}}

  // Filter to only items within the visible 160x144 viewport
  const visible = items.filter(it => {
    const px = ox + it.tx * 16;
    const py = oy + it.ty * 16;
    return px >= 6 && px <= 154 && py >= 4 && py <= 138;
  });

  const sig = visible.map(v => `${v.key}:${Math.round(ox + v.tx * 16)}:${Math.round(oy + v.ty * 16)}:${v.text}:${v.cls}`).join('|');
  if (overlayEl.dataset.sig === sig) return;
  overlayEl.dataset.sig = sig;

  overlayEl.replaceChildren();
  for (const it of visible) {
    const px = ox + it.tx * 16;
    const py = oy + it.ty * 16;
    const tag = document.createElement('span');
    tag.className = `me-map-label ${it.cls}`;
    tag.style.left = `${(px / 160) * 100}%`;
    tag.style.top = `${(py / 144) * 100}%`;
    tag.textContent = it.text;
    overlayEl.append(tag);
  }
}
