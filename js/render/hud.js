'use strict';

/* =====================================================
   置く位置のゴースト・HUD・ミニマップ・デバッグ表示
   ===================================================== */
function ghostLabel(text, x, y, ok) {
  g.font = `${Math.round(13 * TXS)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.lineWidth = 5.5; g.strokeStyle = '#fff'; g.strokeText(text, x, y);
  g.fillStyle = ok ? C.builder : C.bad; g.fillText(text, x, y);
}
const trapNote = pl => pl.trapN != null ? `（この画面のワナ ${pl.trapN}/${TRAP_SCREEN_MAX}）` : '';
function drawGhost() {
  if (!hover.on || !builderActive()) return;
  const wx = bwx(hover.sx), wy = bwy(hover.sy), card = CARD[tool];
  const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2;
  if (COOP) {
    const lf = holdLift || liftAt(wx, wy);
    if (lf) {
      g.save(); g.setLineDash([4, 4]); g.strokeStyle = '#2a9d5c'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(lf.sx, lf.sy, 26, 0, TAU); g.stroke(); g.setLineDash([]); g.restore();
      ghostLabel(holdLift ? 'カーソルをずらすとリフトが下がる！' : 'カーソルを合わせたまま長押しでリフトが上がる', lf.sx, lf.sy + 46, true);
      return;
    }
    const gt = holdGate || gateAt(wx, wy);
    if (gt) {
      g.save(); g.setLineDash([4, 4]); g.strokeStyle = '#2a9d5c'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(gt.sx, gt.sy, 26, 0, TAU); g.stroke(); g.setLineDash([]); g.restore();
      ghostLabel(holdGate ? 'カーソルをずらすと閉まる！' : 'カーソルを合わせたまま長押し', gt.sx, gt.sy + 46, true);
      return;
    }
  }
  g.save();
  if (!COOP && card.cat !== 'special' && tool !== 'shadow') {
    g.setLineDash([6, 6]); g.strokeStyle = 'rgba(232,48,95,0.6)'; g.lineWidth = 2;
    g.beginPath(); g.arc(pcx, pcy, safeR(), 0, TAU); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(232,48,95,0.06)'; g.fill();
  }
  if (isDrawPen(tool)) {
    const pen = PENS[tool], c = Math.floor(wx / T), r = Math.floor(wy / T);
    const cells = pen.thick ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] : [[0, 0]];
    let any = false;
    for (const [dx, dy] of cells) {
      const why = cellBlocked(c + dx, r + dy, tool); const ok = !why; any = any || ok;
      g.strokeStyle = ok ? C.builder : C.bad; g.lineWidth = 2; g.strokeRect((c + dx) * T + 1, (r + dy) * T + 1, T - 2, T - 2);
    }
    g.beginPath(); g.arc(wx, wy, 4, 0, TAU); g.fillStyle = any ? C.builder : C.bad; g.fill();
    ghostLabel(`${card.name}  ${card.costLabel}`, wx, r * T - (pen.thick ? 26 : 6), any);
  } else if (card.cat === 'special' || card.cat === 'support' || tool === 'shadow') {
    const pl = placementFor(tool, wx, wy);
    if (SUPPORT_BLOCKS[tool]) {
      g.globalAlpha = 0.65;
      for (const [c, r] of pl.cells) {
        if (SUPPORT_BLOCKS[tool].plank) { g.fillStyle = '#e2c29c'; g.fillRect(c * T, r * T, T, 8); }
        else drawPaintCell(g, SUPPORT_BLOCKS[tool].kind, c * T + T / 2, r * T + T / 2, T * 0.62, INKS[0], 1);
      }
      g.globalAlpha = 1;
      g.setLineDash([4, 4]); g.strokeStyle = pl.ok ? '#2a9d5c' : C.bad; g.lineWidth = pl.snapped ? 3 : 2; g.strokeRect(pl.x - 2, pl.y - 2, pl.all.length * T + 4, T + 4); g.setLineDash([]);
      ghostLabel(pl.ok ? `${card.name}  ${pl.cost}${pl.snapped ? '　ぴったり！' : ''}` : pl.why, pl.x + pl.all.length * T / 2, pl.y - 10, pl.ok);
      g.restore(); return;
    }
    if (tool === 's_bomb') { g.setLineDash([6, 6]); g.strokeStyle = 'rgba(42,157,92,0.7)'; g.lineWidth = 2; g.beginPath(); g.arc(wx, wy, 90, 0, TAU); g.stroke(); g.setLineDash([]); }
    if (tool === 's_heart') { g.globalAlpha = 0.6; drawHeart(g, wx, wy, 11); g.fillStyle = '#f27eb1'; g.fill(); g.globalAlpha = 1; }
    g.beginPath(); g.arc(wx, wy, 14, 0, TAU); g.strokeStyle = pl.ok ? C.builder : C.bad; g.lineWidth = 2; g.setLineDash([4, 4]); g.stroke(); g.setLineDash([]);
    const left = usesLeft(tool);
    ghostLabel(pl.ok ? `クリックで「${card.name}」${tool === 'shadow' ? 'を出す' : '発動'}  ${card.cost}${left !== Infinity ? `（のこり${left}回）` : ''}` : pl.why, wx, wy - 22, pl.ok);
  } else if (isBlockCard(tool)) {
    const pl = placementFor(tool, wx, wy);
    g.globalAlpha = 0.5;
    for (const [c, r] of pl.cells) drawPaintCell(g, PENS[tool].kind, c * T + T / 2, r * T + T / 2, T * 0.62, INKS[0], 1);
    g.globalAlpha = 1;
    g.setLineDash([4, 4]); g.strokeStyle = pl.ok ? C.builder : C.bad; g.lineWidth = 2; g.strokeRect(pl.x - 3, pl.y - 3, T * 2 + 6, T * 2 + 6); g.setLineDash([]);
    ghostLabel(pl.ok ? `${card.name}  ${card.cost}${trapNote(pl)}` : pl.why, pl.x + T, pl.y - 12, pl.ok);
  } else if (tool === 'rockfall') {
    const pl = placementFor(tool, wx, wy), c = Math.floor(wx / T); let r = Math.max(0, Math.floor(camY / T)); while (r < ROWS && !solid(c, r)) r++;
    g.setLineDash([5, 7]); g.strokeStyle = pl.ok ? 'rgba(42,91,215,0.7)' : C.bad; g.lineWidth = 2;
    g.beginPath(); g.moveTo(wx, camY + 70); g.lineTo(wx, Math.min(r * T, WH)); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.ellipse(wx, Math.min(r * T, WH) - 2, 16, 4, 0, 0, TAU); g.fillStyle = 'rgba(36,37,43,0.2)'; g.fill();
    ghostLabel(pl.ok ? `${card.name}  ${card.cost}${trapNote(pl)}` : pl.why, wx, wy - 14, pl.ok);
  } else {
    const pl = placementFor(tool, wx, wy);
    const parts = SPAWNS[tool] ? SPAWNS[tool].map(([t, ox, oy]) => [t, wx + ox - ETYPES[t].w / 2, wy + oy - ETYPES[t].h / 2]) : [[tool, pl.x, pl.y]];
    g.globalAlpha = 0.5;
    for (const [t, x, y] of parts) {
      const d = ETYPES[t]; g.save(); g.translate(x, y);
      if (t === 'fire') drawFlame(g, 0, 2, d.w, 30, tick);
      drawEnemyShape(g, t, d.w, d.h, { t: tick, face: Math.sign(pcx - (x + d.w / 2)) || 1, rot: tick * 0.035 });
      g.restore();
    }
    g.globalAlpha = 1;
    const d = SPAWNS[tool] ? FOOT[tool] : ETYPES[tool];
    g.setLineDash([4, 4]); g.strokeStyle = pl.ok ? C.builder : C.bad; g.lineWidth = 2; g.strokeRect(pl.x - 3, pl.y - 3, d.w + 6, d.h + 6); g.setLineDash([]);
    if (tool === 'fan') { const zx = pcx < pl.x + d.w / 2 ? pl.x - 230 : pl.x + d.w; g.fillStyle = 'rgba(143,208,232,0.18)'; g.fillRect(zx, pl.y - 18, 230, d.h + 18); }
    if (tool === 'laser') { const dir = pcx < pl.x + d.w / 2 ? -1 : 1, sx = dir > 0 ? pl.x + d.w + 3 : pl.x - 3; g.setLineDash([4, 6]); g.strokeStyle = 'rgba(255,92,132,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, pl.y + 9); g.lineTo(sx + dir * 220, pl.y + 9); g.stroke(); g.setLineDash([]); }
    if (tool === 'bomb') { g.setLineDash([6, 6]); g.strokeStyle = 'rgba(224,122,31,0.6)'; g.lineWidth = 2; g.beginPath(); g.arc(pl.x + d.w / 2, pl.y + d.h / 2, BOMB_R, 0, TAU); g.stroke(); g.setLineDash([]); }
    ghostLabel(pl.ok ? `${card.name}  ${card.cost}${trapNote(pl)}` : pl.why, pl.x + d.w / 2, pl.y - 10 - (ETYPES[tool] && ETYPES[tool].reach ? ETYPES[tool].reach : 0), pl.ok);
  }
  g.restore();
}
function panel(x, y, w, h) {
  g.fillStyle = 'rgba(36,37,43,0.85)'; rrect(g, x + 3, y + 3, w, h, 10); g.fill();
  g.fillStyle = '#ffffff'; rrect(g, x, y, w, h, 10); g.fill();
  g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
}
function bar(x, y, w, h, ratio, color) {
  rrect(g, x, y, w, h, 6); g.fillStyle = '#eef1f6'; g.fill();
  if (ratio > 0) { g.save(); rrect(g, x, y, w, h, 6); g.clip(); g.fillStyle = color; g.fillRect(x, y, w * ratio, h); g.restore(); }
  rrect(g, x, y, w, h, 6); g.strokeStyle = C.ink; g.lineWidth = 1.6; g.stroke();
}
function drawDebugBoxes() {
  if (!dbg('hitbox')) return;
  g.save(); g.lineWidth = 1.5;
  if (COOP) {
    g.setLineDash([8, 6]); g.strokeStyle = 'rgba(214,0,214,0.7)';
    for (let x = 0; x <= WW; x += AREA_W) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, WH); g.stroke(); }
    g.setLineDash([]);
  }
  g.strokeStyle = '#00c853'; g.strokeRect(P.x, P.y, P.w, P.h);
  g.strokeStyle = '#ff1744'; for (const e of enemies) if (!e.dead) g.strokeRect(e.x, e.y, e.w, e.h);
  g.strokeStyle = '#ff9100'; for (const b of bullets) if (!b.dead) { g.beginPath(); g.arc(b.x, b.y, b.r || 6, 0, TAU); g.stroke(); }
  g.strokeStyle = '#2979ff'; for (const it of items) if (!it.taken) { g.beginPath(); g.arc(it.x, it.y, 12, 0, TAU); g.stroke(); }
  for (const gt of gates) { g.beginPath(); g.arc(gt.sx, gt.sy, 40, 0, TAU); g.stroke(); }
  for (const lf of lifts) { g.beginPath(); g.arc(lf.sx, lf.sy, 40, 0, TAU); g.stroke(); }
  g.restore();
}
function drawDebugInfo() {
  if (!DBG.on) return;
  g.save();
  g.font = '12px ui-monospace, Menlo, Consolas, monospace'; g.textAlign = 'left'; g.textBaseline = 'top';
  if (!DBG.info) {
    g.fillStyle = 'rgba(36,37,43,0.75)'; g.fillRect(GW / 2 - 40, GH - 22, 80, 18);
    g.fillStyle = '#ffd23f'; g.textAlign = 'center'; g.fillText('DEBUG', GW / 2, GH - 19); g.restore(); return;
  }
  const alive = enemies.filter(e => !e.dead).length;
  const lines = [
    `FPS ${dbgFps.toFixed(0)}  速さ×${DBG.speed}  状態 ${state}`,
    `ステージ ${stage ? stage.name : '-'}${COOP ? `（${pageLabel(storyIdx)}）` : ''}  残り ${(timeLeft / 60).toFixed(1)}秒`,
    `ランナー x${P.x.toFixed(0)} y${P.y.toFixed(0)}  マス(${Math.floor((P.x + P.w / 2) / T)}, ${Math.floor((P.y + P.h - 1) / T)})  HP ${Math.ceil(P.hp)}/${P.maxHp}  被ダメ ${ST.dmg}`,
    `vx ${P.vx.toFixed(2)} vy ${P.vy.toFixed(2)}  地面 ${P.onGround ? 'o' : '-'}  リフト ${P.onLift ? 'o' : '-'}`,
    COOP ? `エリア ${scrIdx + 1}/${Math.ceil(WW / AREA_W)}  エネルギー ${energy.toFixed(0)}  大王 ${cpu.energy.toFixed(0)}` : `エネルギー ${energy.toFixed(0)}  ビルダー視点 x${bCam.toFixed(0)}`,
    `敵 ${alive}  弾 ${bullets.length}  粒子 ${particles.length}`
  ];
  const w = Math.max(...lines.map(l => g.measureText(l).width)) + 16, y0 = SPLIT === 'h' ? 70 : 84;
  g.fillStyle = 'rgba(20,22,30,0.78)'; g.fillRect(8, y0, w, lines.length * 16 + 10);
  g.fillStyle = '#e8ffe8'; lines.forEach((l, i) => g.fillText(l, 16, y0 + 6 + i * 16));
  g.restore();
}
function drawHUD() {
  g.save(); g.textBaseline = 'alphabetic';
  const LP = 250, PH = 44;
  // ランナー（上 or 左）
  panel(10, 8, LP, PH);
  const ic = 30, s = Math.min(ic / CH.spr.width, ic / CH.spr.height);
  g.drawImage(CH.spr, 16 + (ic - CH.spr.width * s) / 2, 15 + (ic - CH.spr.height * s) / 2, CH.spr.width * s, CH.spr.height * s);
  g.textAlign = 'left'; g.font = `13px ${FONT}`; g.fillStyle = C.runner; g.fillText(MATCH.on ? roleWho('runner').label : 'P1', 52, 25);
  g.fillStyle = C.ink; g.fillText(CH.name.length > 6 ? CH.name.slice(0, 6) + '…' : CH.name, 72, 25);
  g.textAlign = 'right'; g.font = `12px ${FONT}`; g.fillText(`HP ${Math.ceil(P.hp)}/${P.maxHp}`, LP, 25);
  const hr = P.hp / P.maxHp;
  bar(52, 31, LP - 46, 13, hr, hr > 0.5 ? '#2a9d5c' : hr > 0.25 ? '#f2a52e' : '#e5383b');
  const tags = [];
  if (effects.dark > 0) tags.push(`暗闇 ${Math.ceil(effects.dark / 60)}`);
  if (effects.rev > 0) tags.push(`さかさま ${Math.ceil(effects.rev / 60)}`);
  if (effects.heavy > 0) tags.push(`おもり ${Math.ceil(effects.heavy / 60)}`);
  if (P.shield > 0) tags.push(`バリア ${Math.ceil(P.shield / 60)}`);
  if (effects.boost > 0) tags.push(`スピード ${Math.ceil(effects.boost / 60)}`);
  if (effects.freeze > 0) tags.push(`ストップ ${Math.ceil(effects.freeze / 60)}`);
  if (effects.slip > 0) tags.push(`ツルツル ${Math.ceil(effects.slip / 60)}`);
  if (effects.float > 0) tags.push(`ふわふわ ${Math.ceil(effects.float / 60)}`);
  if (effects.seal > 0) tags.push(`ふういん ${Math.ceil(effects.seal / 60)}`);
  if (P.chill > 0) tags.push('ひえひえ');
  if (P.stuck > 0) tags.push('トリモチ');
  if (P.glued) tags.push('ネバネバ');
  if (P.onIce) tags.push('ツルツル');
  let tx0 = 12;
  g.font = `12px ${FONT}`; g.textAlign = 'left';
  for (const tg of tags) { const tw = g.measureText(tg).width + 16; rrect(g, tx0, 58, tw, 19, 9); g.fillStyle = C.builder; g.fill(); g.fillStyle = '#fff'; g.fillText(tg, tx0 + 8, 72); tx0 += tw + 6; }
  // タイマー（上下分割なら境目、左右分割なら上の中央）
  const tx = GW / 2, ty = SPLIT === 'h' ? VH : 33; panel(tx - 72, ty - 25, 144, 50);
  const sec = Math.ceil(timeLeft / 60), mm = Math.floor(sec / 60), ss = sec % 60;
  g.textAlign = 'center'; g.font = `24px ${FONT}`;
  g.fillStyle = sec <= 15 && state === 'play' && (tick >> 4) % 2 ? C.bad : C.ink;
  g.fillText(`${mm}:${String(ss).padStart(2, '0')}`, tx, ty + 3);
  const px0 = tx - 56, px1 = tx + 46, py = ty + 14, prog = progress();
  g.lineCap = 'round'; g.lineWidth = 4;
  g.strokeStyle = '#dde3ec'; g.beginPath(); g.moveTo(px0, py); g.lineTo(px1, py); g.stroke();
  g.strokeStyle = C.runner; g.beginPath(); g.moveTo(px0, py); g.lineTo(lerp(px0, px1, prog), py); g.stroke();
  g.fillStyle = C.runner; g.beginPath(); g.moveTo(px1 + 2, py - 11); g.lineTo(px1 + 13, py - 7); g.lineTo(px1 + 2, py - 3); g.closePath(); g.fill();
  g.strokeStyle = C.ink; g.lineWidth = 1.6; g.beginPath(); g.moveTo(px1 + 2, py + 3); g.lineTo(px1 + 2, py - 12); g.stroke();
  g.beginPath(); g.arc(lerp(px0, px1, prog), py, 4.5, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.stroke();
  // ビルダー（下 or 右）
  const rx = GW - 10 - LP, ry = BY + 8; panel(rx, ry, LP, PH);
  g.textAlign = 'left'; g.font = `13px ${FONT}`; g.fillStyle = C.builder; g.fillText(MATCH.on ? roleWho('builder').label : 'P2', rx + 10, ry + 17);
  g.fillStyle = C.ink; g.fillText(SPLIT === 'o' && netIAmRunner() ? 'ビルダー' : CARD[tool].name, rx + 32, ry + 17); // オンライン対戦のランナーには、相手のカードを見せない
  g.textAlign = 'right'; g.font = `12px ${FONT}`; g.fillText(`エネルギー ${Math.floor(energy)}`, rx + LP - 10, ry + 17);
  bar(rx + 10, ry + 23, LP - 20, 13, energy / EMAX, C.builder);
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.beginPath();
  for (let i = 1; i < 10; i++) { const x = rx + 10 + (LP - 20) * i / 10; g.moveTo(x, ry + 25); g.lineTo(x, ry + 34); }
  g.stroke();
  if (penCapOn()) { // 対戦：ペン系のマスの上限
    const full = penLive >= VS_PEN_MAX, t = `ペン ${Math.min(penLive, VS_PEN_MAX)}/${VS_PEN_MAX}${full ? '（上限）' : ''}`;
    g.font = `12px ${FONT}`; g.textAlign = 'right'; g.lineWidth = 3; g.strokeStyle = '#fff';
    g.strokeText(t, rx + LP - 4, ry + PH + 16); g.fillStyle = full ? C.bad : C.builder; g.fillText(t, rx + LP - 4, ry + PH + 16);
  }
  if (COOP) {
    const t = `消しゴム大王（${CPU_LV[COOP_LV].name}）`;
    g.font = `12px ${FONT}`; g.textAlign = 'right'; g.lineWidth = 3; g.strokeStyle = '#fff';
    g.strokeText(t, rx + LP - 4, ry + PH + 16); g.fillStyle = C.bad; g.fillText(t, rx + LP - 4, ry + PH + 16);
  }
  g.restore();
}
function drawCenterText(text, size, color, y, alpha = 1, x = GW / 2) {
  g.save(); g.globalAlpha = alpha; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `${size}px ${FONT}`; g.lineJoin = 'round';
  g.lineWidth = size * 0.16; g.strokeStyle = '#ffffff'; g.strokeText(text, x, y);
  g.fillStyle = color; g.fillText(text, x, y);
  g.restore();
}
function buildMinimap() {
  mmDirty = false;
  if (!mmCanvas || mmCanvas.width !== LW || mmCanvas.height !== ROWS) { mmCanvas = document.createElement('canvas'); mmCanvas.width = LW; mmCanvas.height = ROWS; }
  const c = mmCanvas.getContext('2d'), img = c.createImageData(LW, ROWS), d = img.data;
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i]; if (!t || t === 6) continue;
    const col = t === 3 ? [42, 91, 215] : t === 5 ? [160, 112, 63] : t === 4 ? [201, 154, 104] : t === 2 ? [226, 186, 70] : [150, 156, 172];
    d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);
}
function drawMinimap() {
  if (mmDirty || !mmCanvas) buildMinimap();
  const m = mmRect(), x = m.x - BX, y = m.y - BY, w = m.w, h = m.h, kx = w / WW, ky = h / WH;
  g.save();
  rrect(g, x - 4, y - 4, w + 8, h + 8, 6); g.fillStyle = 'rgba(255,255,255,0.94)'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.5; g.stroke();
  g.imageSmoothingEnabled = false; g.drawImage(mmCanvas, x, y, w, h); g.imageSmoothingEnabled = true;
  g.fillStyle = C.runner;
  if (m.horiz) g.fillRect(x + goalX * kx - 1, y - 3, 2, h + 6); else g.fillRect(x - 3, y + goalY * ky - 1, w + 6, 2);
  g.fillStyle = '#8e5bd6';
  for (const e of enemies) if (!e.dead) g.fillRect(x + clamp((e.x + e.w / 2) * kx, 0, w) - 1, y + clamp((e.y + e.h / 2) * ky, 0, h) - 1, 2.5, 2.5);
  g.strokeStyle = 'rgba(232,48,95,0.75)'; g.lineWidth = 1.5; g.strokeRect(x + camX * kx, y + camY * ky, VWW * kx, VWH * ky);
  g.strokeStyle = C.builder; g.lineWidth = 2; g.strokeRect(x + bCam * kx - (m.horiz ? 0 : 2), y + bCamY * ky - (m.horiz ? 2 : 0), VWW * kx + (m.horiz ? 0 : 4), VWH * ky + (m.horiz ? 4 : 0));
  g.fillStyle = C.runner; g.beginPath(); g.arc(x + clamp((P.x + P.w / 2) * kx, 1, w - 1), y + clamp((P.y + P.h / 2) * ky, 1, h - 1), 3, 0, TAU); g.fill();
  g.restore();
}
function drawRunnerPointer() {
  const px = (P.x + P.w / 2 - viewX) * VS, py = (P.y + P.h / 2 - viewY) * VS;
  if (px >= 0 && px <= VW && py >= 0 && py <= VH) return;
  const x = clamp(px, 18, VW - 34), y = clamp(py, 70, VH - 36);
  const a = Math.atan2(py - y, px - x), d = Math.round(Math.hypot(px - x, py - y) / VS / T);
  g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = C.runner; g.beginPath(); g.moveTo(10, 0); g.lineTo(-6, -9); g.lineTo(-6, 9); g.closePath(); g.fill(); g.restore();
  const ca = Math.cos(a), sa = Math.sin(a), lx = x - ca * 16, ly = y - sa * 18;
  g.save(); g.font = `12px ${FONT}`; g.textAlign = ca > 0.5 ? 'right' : ca < -0.5 ? 'left' : 'center'; g.textBaseline = 'middle';
  g.lineWidth = 3; g.strokeStyle = '#fff'; g.strokeText(`P1まで ${d}マス`, lx, ly); g.fillStyle = C.runner; g.fillText(`P1まで ${d}マス`, lx, ly);
  g.restore();
}
