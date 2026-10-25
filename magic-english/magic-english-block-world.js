// Magic English Stage 1 — Separate 16x16x8 Isometric Block World View
// Implements STAGE-1-PLAN.md Section 5 requirements.

import {
  BLOCK_CATALOG,
  BLOCK_WORLD_DIMS,
  SHOP_BLOCKS,
  placeBlockInWorld,
  removeBlockFromWorld,
  unlockShopBlockInWorld,
} from './magic-english-storage.js';

export function createBlockWorldUI({ getState, onSave, onReturnToAdventure, onToast }) {
  const modal = document.createElement('dialog');
  modal.id = 'magic-block-world-modal';
  modal.className = 'me-modal me-block-world-dialog';
  modal.setAttribute('aria-label', '내 블록 세계 (16×16×8 입체 건축 공간)');
  document.body.append(modal);

  let cursor = { x: 7, y: 7, z: 0 };
  let toolMode = 'place'; // 'place' | 'remove'

  function rotateCoords(x, y, angle) {
    const W = BLOCK_WORLD_DIMS.width - 1;
    const D = BLOCK_WORLD_DIMS.depth - 1;
    const a = ((angle % 4) + 4) % 4;
    if (a === 1) return { rx: D - y, ry: x };
    if (a === 2) return { rx: W - x, ry: D - y };
    if (a === 3) return { rx: y, ry: W - x };
    return { rx: x, ry: y };
  }

  function unrotateCoords(rx, ry, angle) {
    const W = BLOCK_WORLD_DIMS.width - 1;
    const D = BLOCK_WORLD_DIMS.depth - 1;
    const a = ((angle % 4) + 4) % 4;
    if (a === 1) return { x: ry, y: D - rx };
    if (a === 2) return { x: W - rx, y: D - ry };
    if (a === 3) return { x: W - ry, y: rx };
    return { x: rx, y: ry };
  }

  function topZAt(state, x, y) {
    let maxZ = -1;
    for (const b of state.blockWorld.blocks) {
      if (b.x === x && b.y === y && b.z > maxZ) maxZ = b.z;
    }
    return maxZ;
  }

  function applyActionAt(x, y) {
    const state = getState();
    const bw = state.blockWorld;
    cursor.x = Math.max(0, Math.min(BLOCK_WORLD_DIMS.width - 1, x));
    cursor.y = Math.max(0, Math.min(BLOCK_WORLD_DIMS.depth - 1, y));

    if (toolMode === 'remove') {
      const topZ = topZAt(state, cursor.x, cursor.y);
      const targetZ = topZ >= 0 ? topZ : cursor.z;
      const res = removeBlockFromWorld(state, cursor.x, cursor.y, targetZ);
      if (res.ok) {
        cursor.z = Math.max(0, topZAt(state, cursor.x, cursor.y) + 1);
        onSave();
        onToast?.(`${BLOCK_CATALOG[res.removed.type]?.name || '블록'}을(를) 철거했어요.`);
      } else {
        onToast?.(res.reason);
      }
    } else {
      const nextZ = Math.min(BLOCK_WORLD_DIMS.height - 1, topZAt(state, cursor.x, cursor.y) + 1);
      const selected = bw.selectedBlock || 'dirt';
      const res = placeBlockInWorld(state, cursor.x, cursor.y, nextZ, selected);
      if (res.ok) {
        cursor.z = Math.min(BLOCK_WORLD_DIMS.height - 1, nextZ + 1);
        onSave();
        onToast?.(`(${cursor.x + 1}, ${cursor.y + 1}, ${nextZ + 1}층)에 ${BLOCK_CATALOG[selected]?.name}을(를) 배치했어요!`);
      } else {
        onToast?.(res.reason);
      }
    }
    render();
  }

  function drawIsometricWorld(canvas) {
    const ctx = canvas.getContext('2d');
    const state = getState();
    const bw = state.blockWorld;
    const angle = bw.cameraAngle || 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#d8eefc');
    grad.addColorStop(1, '#eef5e4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tileW = 28;
    const tileH = 14;
    const blockH = 14;
    const originX = canvas.width / 2;
    const originY = 92;

    function isoPoint(rx, ry, z) {
      return {
        px: originX + (rx - ry) * (tileW / 2),
        py: originY + (rx + ry) * (tileH / 2) - z * blockH,
      };
    }

    // 1. Draw 16x16 base buildplate
    for (let ry = 0; ry < BLOCK_WORLD_DIMS.depth; ry++) {
      for (let rx = 0; rx < BLOCK_WORLD_DIMS.width; rx++) {
        const { x, y } = unrotateCoords(rx, ry, angle);
        const { px, py } = isoPoint(rx, ry, 0);
        const isCursor = x === cursor.x && y === cursor.y;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + tileW / 2, py + tileH / 2);
        ctx.lineTo(px, py + tileH);
        ctx.lineTo(px - tileW / 2, py + tileH / 2);
        ctx.closePath();

        ctx.fillStyle = isCursor
          ? '#ffe270'
          : (x + y) % 2 === 0
          ? '#9bc27c'
          : '#8eb670';
        ctx.fill();
        ctx.strokeStyle = isCursor ? '#d96b27' : '#7aa15e';
        ctx.lineWidth = isCursor ? 2 : 0.6;
        ctx.stroke();
      }
    }

    // 2. Sort and draw placed blocks in back-to-front painter's order
    const sorted = bw.blocks
      .map(b => {
        const { rx, ry } = rotateCoords(b.x, b.y, angle);
        return { ...b, rx, ry };
      })
      .sort((a, b) => a.rx + a.ry - (b.rx + b.ry) || a.z - b.z);

    for (const b of sorted) {
      const spec = BLOCK_CATALOG[b.type] || BLOCK_CATALOG.dirt;
      const { px, py } = isoPoint(b.rx, b.ry, b.z);

      // Top face
      ctx.beginPath();
      ctx.moveTo(px, py - blockH);
      ctx.lineTo(px + tileW / 2, py + tileH / 2 - blockH);
      ctx.lineTo(px, py + tileH - blockH);
      ctx.lineTo(px - tileW / 2, py + tileH / 2 - blockH);
      ctx.closePath();
      ctx.fillStyle = spec.topColor || spec.color;
      ctx.fill();
      ctx.strokeStyle = '#2b3a3344';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Left face
      ctx.beginPath();
      ctx.moveTo(px - tileW / 2, py + tileH / 2 - blockH);
      ctx.lineTo(px, py + tileH - blockH);
      ctx.lineTo(px, py + tileH);
      ctx.lineTo(px - tileW / 2, py + tileH / 2);
      ctx.closePath();
      ctx.fillStyle = spec.color;
      ctx.fill();
      ctx.stroke();

      // Right face
      ctx.beginPath();
      ctx.moveTo(px + tileW / 2, py + tileH / 2 - blockH);
      ctx.lineTo(px, py + tileH - blockH);
      ctx.lineTo(px, py + tileH);
      ctx.lineTo(px + tileW / 2, py + tileH / 2);
      ctx.closePath();
      ctx.fillStyle = spec.color;
      ctx.fill();
      ctx.stroke();

      if (spec.isDecoration) {
        // Draw paper airplane icon on top
        ctx.fillStyle = '#d9483b';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✈️', px, py - blockH + 9);
      }
    }
  }

  function render() {
    if (!modal.open) return;
    const state = getState();
    const bw = state.blockWorld;
    modal.replaceChildren();

    const header = document.createElement('div');
    header.className = 'me-modal-header';
    header.innerHTML = `
      <div>
        <span class="me-badge">MY BLOCK WORLD · 16×16×8 입체 건축 공간</span>
        <h2>🧱 내 블록 세계 (Stage 1 보상 건축)</h2>
      </div>
    `;
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.id = 'block-world-return-btn';
    backBtn.className = 'me-primary-btn';
    backBtn.textContent = '✈️ 공항 모험 이어하기';
    backBtn.onclick = () => {
      modal.close();
      onReturnToAdventure?.();
    };
    header.append(backBtn);
    modal.append(header);

    // Status bar
    const deco = bw.decorations.paper_airplane_deco;
    const status = document.createElement('div');
    status.className = 'me-bw-status';
    status.innerHTML = `
      <span>🪙 건축 코인: <strong id="bw-coin-count">${bw.coins}</strong>개</span>
      <span>🧱 배치한 블록: <strong id="bw-placed-count">${bw.blocks.length}</strong>개</span>
      <span>✈️ 종이비행기 장식: <strong>${deco.owned - deco.placed}/${deco.owned}</strong>개 배치 가능</span>
      <span>📍 선택 위치: <strong>(${cursor.x + 1}, ${cursor.y + 1}) · 높이 ${Math.min(8, Math.max(1, topZAt(state, cursor.x, cursor.y) + 2))}층</strong></span>
    `;
    modal.append(status);

    // Canvas & Controls Layout
    const body = document.createElement('div');
    body.className = 'me-bw-layout';

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'me-bw-canvas-wrap';
    const canvas = document.createElement('canvas');
    canvas.id = 'block-world-canvas';
    canvas.width = 520;
    canvas.height = 340;
    canvas.onclick = e => {
      const rect = canvas.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const tileW = 28;
      const tileH = 14;
      const originX = canvas.width / 2;
      const originY = 92;
      const dx = sx - originX;
      const dy = sy - originY;
      const rx = Math.floor((dx / (tileW / 2) + dy / (tileH / 2)) / 2);
      const ry = Math.floor((dy / (tileH / 2) - dx / (tileW / 2)) / 2);
      if (rx >= 0 && rx < BLOCK_WORLD_DIMS.width && ry >= 0 && ry < BLOCK_WORLD_DIMS.depth) {
        const { x, y } = unrotateCoords(rx, ry, bw.cameraAngle || 0);
        applyActionAt(x, y);
      }
    };
    canvasWrap.append(canvas);

    // Touch & Keyboard Cursor Controls bar
    const controls = document.createElement('div');
    controls.className = 'me-bw-controls';
    const mkBtn = (label, id, fn, cls = 'me-secondary-btn') => {
      const b = document.createElement('button');
      b.type = 'button';
      if (id) b.id = id;
      b.className = cls;
      b.textContent = label;
      b.onclick = fn;
      return b;
    };
    controls.append(
      mkBtn('◀ 시점 회전', 'bw-rotate-left', () => {
        bw.cameraAngle = ((bw.cameraAngle || 0) + 3) % 4;
        onSave();
        render();
      }),
      mkBtn('시점 회전 ▶', 'bw-rotate-right', () => {
        bw.cameraAngle = ((bw.cameraAngle || 0) + 1) % 4;
        onSave();
        render();
      }),
      mkBtn(
        toolMode === 'place' ? '🧱 현재 모드: 블록 쌓기' : '⛏️ 현재 모드: 블록 철거',
        'bw-toggle-mode',
        () => {
          toolMode = toolMode === 'place' ? 'remove' : 'place';
          render();
        },
        toolMode === 'place' ? 'me-primary-btn' : 'me-secondary-btn'
      ),
      mkBtn('🧱 선택 칸에 쌓기', 'bw-place-btn', () => {
        toolMode = 'place';
        applyActionAt(cursor.x, cursor.y);
      }),
      mkBtn('⛏️ 선택 칸 철거', 'bw-remove-btn', () => {
        const prev = toolMode;
        toolMode = 'remove';
        applyActionAt(cursor.x, cursor.y);
        toolMode = prev;
      })
    );

    // Cursor step buttons for touch devices
    const dpadRow = document.createElement('div');
    dpadRow.className = 'me-bw-controls';
    dpadRow.append(
      mkBtn('← X-1', 'bw-cur-left', () => { cursor.x = Math.max(0, cursor.x - 1); render(); }),
      mkBtn('→ X+1', 'bw-cur-right', () => { cursor.x = Math.min(15, cursor.x + 1); render(); }),
      mkBtn('↑ Y-1', 'bw-cur-up', () => { cursor.y = Math.max(0, cursor.y - 1); render(); }),
      mkBtn('↓ Y+1', 'bw-cur-down', () => { cursor.y = Math.min(15, cursor.y + 1); render(); })
    );
    canvasWrap.append(controls, dpadRow);
    body.append(canvasWrap);

    // Right sidebar: Palette & Coin Shop
    const side = document.createElement('div');
    side.className = 'me-bw-side';

    const palTitle = document.createElement('h3');
    palTitle.textContent = '🎨 내 블록 & 장식 선택';
    side.append(palTitle);

    const palList = document.createElement('div');
    palList.className = 'me-bw-palette';
    const selectableIds = [...bw.unlockedBlocks];
    if (deco.owned > 0) selectableIds.push('paper_airplane_deco');

    for (const blockId of selectableIds) {
      const spec = BLOCK_CATALOG[blockId];
      if (!spec) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.blockId = blockId;
      b.className = 'me-bw-palette-btn' + (bw.selectedBlock === blockId ? ' active' : '');
      const extra = spec.isDecoration ? ` (남은 수량 ${deco.owned - deco.placed}/${deco.owned})` : ' (무제한)';
      b.innerHTML = `<span class="swatch" style="background:${spec.topColor || spec.color}"></span><b>${spec.name}</b><small>${extra}</small>`;
      b.onclick = () => {
        bw.selectedBlock = blockId;
        toolMode = 'place';
        onSave();
        render();
      };
      palList.append(b);
    }
    side.append(palList);

    // Coin Shop for unlocking extra blocks
    const shopTitle = document.createElement('h3');
    shopTitle.textContent = '🏪 블록 해금 상점 (코인 사용)';
    side.append(shopTitle);

    const shopList = document.createElement('div');
    shopList.className = 'me-bw-shop';
    for (const shopItem of Object.values(SHOP_BLOCKS)) {
      const unlocked = bw.unlockedBlocks.includes(shopItem.id);
      const b = document.createElement('button');
      b.type = 'button';
      b.id = `shop-unlock-${shopItem.id}`;
      b.className = 'me-secondary-btn';
      b.disabled = unlocked;
      b.textContent = unlocked
        ? `✓ ${shopItem.name} (해금 완료)`
        : `🔓 ${shopItem.name} 해금 (${shopItem.price} 코인)`;
      b.onclick = () => {
        const res = unlockShopBlockInWorld(state, shopItem.id);
        if (res.ok) {
          bw.selectedBlock = shopItem.id;
          onSave();
          onToast?.(`${shopItem.name}을(를) 해금했어요! 이제 마음껏 배치할 수 있어요.`);
          render();
        } else {
          onToast?.(res.reason);
        }
      };
      shopList.append(b);
    }
    side.append(shopList);

    body.append(side);
    modal.append(body);

    drawIsometricWorld(canvas);
  }

  return {
    open() {
      if (!modal.open) modal.showModal();
      render();
    },
    close() {
      if (modal.open) modal.close();
    },
    active: () => modal.open,
    render,
  };
}
