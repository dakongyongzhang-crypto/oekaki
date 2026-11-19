'use strict';

/* =====================================================
   カードのアイコン描画
   ===================================================== */
function drawPaintCell(ctx, kind, cx, cy, rad, ink, hp) {
  if (kind > 10 && drawExtraPaintCell(ctx, kind, cx, cy, rad, hp)) return;
  switch (kind) {
    case 0: ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fill(); break;
    case 1: {
      const s = rad * 0.86; rrect(ctx, cx - s, cy - s, s * 2, s * 2, 3);
      ctx.fillStyle = '#5a6072'; ctx.fill(); ctx.strokeStyle = '#2f333f'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = '#a3aabb';
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.arc(cx + dx * s * 0.55, cy + dy * s * 0.55, 1.4, 0, TAU); ctx.fill(); }
      if (hp < 3) {
        ctx.strokeStyle = '#eef0f5'; ctx.lineWidth = 1.2; ctx.beginPath();
        ctx.moveTo(cx - s * 0.6, cy - s * 0.2); ctx.lineTo(cx - s * 0.1, cy + s * 0.1); ctx.lineTo(cx + s * 0.25, cy - s * 0.45);
        if (hp < 2) { ctx.moveTo(cx - s * 0.1, cy + s * 0.1); ctx.lineTo(cx + s * 0.3, cy + s * 0.6); }
        ctx.stroke();
      }
      break;
    }
    case 2: {
      ctx.fillStyle = '#9e1a28'; ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * TAU + 0.3;
        ctx.moveTo(cx + Math.cos(a - 0.35) * rad * 0.8, cy + Math.sin(a - 0.35) * rad * 0.8);
        ctx.lineTo(cx + Math.cos(a) * rad * 1.35, cy + Math.sin(a) * rad * 1.35);
        ctx.lineTo(cx + Math.cos(a + 0.35) * rad * 0.8, cy + Math.sin(a + 0.35) * rad * 0.8);
      }
      ctx.fill(); ctx.fillStyle = '#e0313f'; ctx.beginPath(); ctx.arc(cx, cy, rad * 0.9, 0, TAU); ctx.fill();
      break;
    }
    case 3: {
      const s = rad * 0.9; rrect(ctx, cx - s, cy - s, s * 2, s * 2, 4);
      ctx.fillStyle = '#9fe0f4'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy + s * 0.15); ctx.lineTo(cx - s * 0.05, cy - s * 0.45); ctx.stroke();
      break;
    }
    case 4: {
      ctx.fillStyle = '#33b06a'; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx - rad * 0.6, cy);
      for (let k = 1; k <= 4; k++) ctx.lineTo(cx - rad * 0.6 + k * rad * 0.3, cy + (k % 2 ? -rad * 0.35 : rad * 0.35));
      ctx.stroke();
      break;
    }
    case 10: {
      const s = rad * 0.86; rrect(ctx, cx - s, cy - s, s * 2, s * 2, 4);
      ctx.fillStyle = '#8fd8a8'; ctx.fill(); ctx.strokeStyle = '#2a7d4a'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx - s * 0.5, cy - s * 0.45); ctx.lineTo(cx + s * 0.2, cy - s * 0.45); ctx.stroke();
      break;
    }
    case 9: {
      ctx.fillStyle = '#e2c29c'; ctx.fillRect(cx - rad, cy - rad * 0.4, rad * 2, rad * 0.8);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.strokeRect(cx - rad, cy - rad * 0.4, rad * 2, rad * 0.8);
      break;
    }
    case 5: {
      ctx.fillStyle = 'rgba(150,98,52,0.55)'; ctx.beginPath(); ctx.arc(cx, cy, rad * 1.02, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(cx - rad * 0.3, cy - rad * 0.3, rad * 0.22, 0, TAU); ctx.fill();
      break;
    }
  }
}
function drawCardIcon(ctx, id, W, H) {
  const card = CARD[id];
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const k = H / 38;
  if (isBlockCard(id) && id !== 'thorn' && blockSize(id) === 1) { // 1マスのブロックのワナ
    drawPaintCell(ctx, PENS[id].kind, W / 2, H / 2, H * 0.3, INKS[0], 9);
    ctx.restore(); return;
  }
  if (isBlockCard(id) && id !== 'thorn') { // 2×2のブロックのワナ
    const r = H * 0.17, kind = PENS[id].kind;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) drawPaintCell(ctx, kind, W / 2 + dx * r * 1.05, H / 2 + dy * r * 1.05, r, INKS[0], 9);
    ctx.restore(); return;
  }
  if (card.cat === 'pen') {
    const pen = PENS[id];
    if (pen.erase) {
      ctx.setLineDash([3, 3]); ctx.strokeStyle = C.runner; ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) ctx.strokeRect(W * 0.12 + i * 11 * k, H * 0.55, 10 * k, 10 * k);
      ctx.setLineDash([]);
      ctx.translate(W * 0.62, H * 0.42); ctx.rotate(-0.5);
      rrect(ctx, -12 * k, -7 * k, 24 * k, 14 * k, 3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.stroke();
      rrect(ctx, 2 * k, -7 * k, 10 * k, 14 * k, 3); ctx.fillStyle = '#f7a8c4'; ctx.fill(); ctx.stroke();
    } else {
      const r = 6.4 * k, pts = [[0.18, 0.72], [0.32, 0.56], [0.46, 0.4]];
      for (const [px, py] of pts) drawPaintCell(ctx, pen.kind, W * px, H * py, r, INKS[0], 3);
      ctx.translate(W * 0.74, H * 0.18); ctx.rotate(0.7);
      ctx.fillStyle = '#ffe58a'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.fillRect(-3 * k, 0, 6 * k, 15 * k); ctx.strokeRect(-3 * k, 0, 6 * k, 15 * k);
      ctx.fillStyle = KCOL[pen.kind];
      ctx.beginPath(); ctx.moveTo(-3 * k, 15 * k); ctx.lineTo(3 * k, 15 * k); ctx.lineTo(0, 21 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore(); return;
  }
  if (drawExtraIcon(ctx, id, W, H)) { ctx.restore(); return; }
  if (id === 'dark') {
    rrect(ctx, W * 0.1, H * 0.1, W * 0.8, H * 0.8, 6); ctx.fillStyle = '#1b1d26'; ctx.fill();
    const grd = ctx.createRadialGradient(W / 2, H / 2, 2, W / 2, H / 2, H * 0.32);
    grd.addColorStop(0, '#fffbe0'); grd.addColorStop(1, 'rgba(255,251,224,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(W / 2, H / 2, H * 0.32, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffe24a'; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.28, H * 0.09, 0, TAU); ctx.fill();
    ctx.restore(); return;
  }
  if (id === 'reverse') {
    ctx.strokeStyle = C.runner; ctx.fillStyle = C.runner; ctx.lineWidth = 3.2 * k;
    const y1 = H * 0.36, y2 = H * 0.66, x0 = W * 0.22, x1 = W * 0.78;
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1 - 6 * k, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - 9 * k, y1 - 6 * k); ctx.lineTo(x1 - 9 * k, y1 + 6 * k); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.builder; ctx.fillStyle = C.builder;
    ctx.beginPath(); ctx.moveTo(x1, y2); ctx.lineTo(x0 + 6 * k, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y2); ctx.lineTo(x0 + 9 * k, y2 - 6 * k); ctx.lineTo(x0 + 9 * k, y2 + 6 * k); ctx.closePath(); ctx.fill();
    ctx.restore(); return;
  }
  if (id === 'weight') { drawWeight(ctx, W / 2, H * 0.56, H * 0.3); ctx.restore(); return; }
  if (SUPPORT_BLOCKS[id]) {
    const b = SUPPORT_BLOCKS[id], shape = blockShape(b), sw = Math.max(...shape.map(s => s[0])) + 1, top = Math.min(...shape.map(s => s[1])), sh = 1 - top;
    const cs = Math.min(W / (sw + 1.2), H * 0.5, H * 0.86 / sh), x0 = W / 2 - cs * sw / 2, y0 = H / 2 + cs * sh / 2 - cs;
    for (const [dx, dy] of shape) {
      const x = x0 + dx * cs, y = y0 + dy * cs;
      if (b.plank) { ctx.fillStyle = '#e2c29c'; ctx.fillRect(x, y + cs * 0.25, cs, cs * 0.5); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x, y + cs * 0.25, cs, cs * 0.5); }
      else drawPaintCell(ctx, b.kind, x + cs / 2, y + cs / 2, cs * 0.5, INKS[0], 1);
    }
    ctx.restore(); return;
  }
  if (drawSupportIcon2(ctx, id, W, H, k)) { ctx.restore(); return; }
  if (id === 's_heart') {
    drawHeart(ctx, W / 2, H * 0.6, H * 0.32); ctx.fillStyle = '#f27eb1'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(W / 2 - 5 * k, H * 0.5); ctx.lineTo(W / 2 + 5 * k, H * 0.5); ctx.moveTo(W / 2, H * 0.5 - 5 * k); ctx.lineTo(W / 2, H * 0.5 + 5 * k); ctx.stroke();
    ctx.restore(); return;
  }
  if (id === 's_shield') {
    ctx.beginPath(); ctx.arc(W / 2, H / 2, H * 0.38, 0, TAU); ctx.fillStyle = 'rgba(126,200,255,0.35)'; ctx.fill(); ctx.strokeStyle = '#3e8fd6'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, H * 0.28, Math.PI * 1.1, Math.PI * 1.45); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore(); return;
  }
  if (id === 's_speed') {
    ctx.beginPath(); ctx.moveTo(W * 0.56, H * 0.12); ctx.lineTo(W * 0.4, H * 0.52); ctx.lineTo(W * 0.52, H * 0.52); ctx.lineTo(W * 0.44, H * 0.9); ctx.lineTo(W * 0.64, H * 0.42); ctx.lineTo(W * 0.52, H * 0.42); ctx.closePath();
    ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(36,37,43,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 3; i++) { ctx.moveTo(W * 0.12, H * (0.35 + i * 0.15)); ctx.lineTo(W * 0.32, H * (0.35 + i * 0.15)); }
    ctx.stroke(); ctx.restore(); return;
  }
  if (id === 's_bomb') {
    ctx.beginPath();
    for (let j = 0; j < 16; j++) { const a = j / 16 * TAU, rr = j % 2 ? H * 0.2 : H * 0.42; ctx.lineTo(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = '#7ddc94'; ctx.fill(); ctx.strokeStyle = '#2a9d5c'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, H * 0.13, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore(); return;
  }
  if (id === 's_freeze') {
    ctx.strokeStyle = '#3e8fd6'; ctx.lineWidth = 2.4; ctx.beginPath();
    for (let j = 0; j < 3; j++) {
      const a = j / 3 * Math.PI + Math.PI / 2, dx = Math.cos(a) * H * 0.38, dy = Math.sin(a) * H * 0.38;
      ctx.moveTo(W / 2 - dx, H / 2 - dy); ctx.lineTo(W / 2 + dx, H / 2 + dy);
      for (const sg of [-1, 1]) { const bx = W / 2 + sg * dx * 0.6, by = H / 2 + sg * dy * 0.6, pa = a + Math.PI / 2; ctx.moveTo(bx + Math.cos(pa) * 4 * k, by + Math.sin(pa) * 4 * k); ctx.lineTo(bx + sg * dx * 0.25, by + sg * dy * 0.25); ctx.lineTo(bx - Math.cos(pa) * 4 * k, by - Math.sin(pa) * 4 * k); }
    }
    ctx.stroke(); ctx.restore(); return;
  }
  if (id === 'thorn') {
    const r = H * 0.17;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) drawPaintCell(ctx, 2, W / 2 + dx * r * 1.05, H / 2 + dy * r * 1.05, r, INKS[0], 1);
    ctx.restore(); return;
  }
  if (id === 'shadow') {
    ctx.setLineDash([2, 4]); ctx.strokeStyle = 'rgba(75,58,107,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.86); ctx.lineTo(W * 0.5, H * 0.86); ctx.stroke(); ctx.setLineDash([]);
    ctx.translate(W * 0.55, H * 0.1); const s = H / 46; ctx.scale(s, s);
    drawEnemyShape(ctx, 'shadow', 30, 40, { face: 1 });
    ctx.restore(); return;
  }
  if (id === 'rockfall') {
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(209,41,63,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W / 2, H * 0.42); ctx.lineTo(W / 2, H * 0.9); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.9, W * 0.14, H * 0.05, 0, 0, TAU); ctx.fillStyle = 'rgba(36,37,43,0.25)'; ctx.fill();
    const s = H / 30; ctx.translate(W / 2 - 20 * s, H * 0.06); ctx.scale(s, s);
    drawEnemyShape(ctx, 'rockfall', 40, 16, {});
    ctx.restore(); return;
  }
  if (id === 'laser') {
    ctx.strokeStyle = '#ff5c84'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W * 0.45, H * 0.42); ctx.lineTo(W * 0.95, H * 0.42); ctx.stroke();
    const s = H / 34; ctx.translate(W * 0.12, H * 0.42 - 9 * s); ctx.scale(s, s);
    drawEnemyShape(ctx, 'laser', 28, 24, { face: 1, charging: true });
    ctx.restore(); return;
  }
  if (id === 'firebar') {
    const s = H / 54; ctx.translate(W * 0.28, H * 0.74); ctx.scale(s, s);
    drawEnemyShape(ctx, 'firebar', 16, 16, { rot: -0.62, balls: 4, spacing: 14 });
    ctx.restore(); return;
  }
  const parts = SPAWNS[id] || [[id, 0, 0]];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [t, ox, oy] of parts) { const e = ETYPES[t]; x0 = Math.min(x0, ox - e.w / 2); x1 = Math.max(x1, ox + e.w / 2); y0 = Math.min(y0, oy - e.h / 2); y1 = Math.max(y1, oy + e.h / 2); }
  let extraTop = 0;
  if (id === 'fire') extraTop = 22;
  if (id === 'thunder') extraTop = -14;
  const bw = x1 - x0, bh = y1 - y0 + Math.abs(extraTop);
  const s = Math.min((W - 8) / bw, (H - 6) / bh, 1.3 * k);
  ctx.translate(W / 2 - (x0 + bw / 2) * s, H / 2 - (y0 + (y1 - y0) / 2) * s + (extraTop > 0 ? extraTop * s / 2 : extraTop * s / 2));
  ctx.scale(s, s);
  for (const [t, ox, oy] of parts) {
    const e = ETYPES[t];
    ctx.save(); ctx.translate(ox - e.w / 2, oy - e.h / 2);
    if (t === 'fire') drawFlame(ctx, 0, 0, e.w, 26, 0);
    drawEnemyShape(ctx, t, e.w, e.h, { t: 0, face: 1, aim: -0.6, rot: 0.3 });
    if (t === 'thunder') { ctx.beginPath(); ctx.moveTo(e.w * 0.5, e.h); ctx.lineTo(e.w * 0.4, e.h + 7); ctx.lineTo(e.w * 0.56, e.h + 7); ctx.lineTo(e.w * 0.46, e.h + 15); ctx.strokeStyle = '#f2b800'; ctx.lineWidth = 3; ctx.stroke(); }
    if (t === 'fan') { ctx.strokeStyle = '#7ec8e3'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(e.w + 3, 4 + i * 7); ctx.lineTo(e.w + 12, 4 + i * 7); } ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
}

// 冒険で増えるサポーターのカードのアイコン
function drawSupportIcon2(ctx, id, W, H, k) {
  const cx = W / 2, cy = H / 2, R = H * 0.36;
  const line = (col, w = 2.4) => { ctx.strokeStyle = col; ctx.lineWidth = w * k; };
  const circle = (x, y, r, fill, stroke) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2 * k; ctx.stroke(); } };
  const arrow = (x0, y0, x1, y1, col) => {
    line(col, 3); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    const a = Math.atan2(y1 - y0, x1 - x0); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1 + Math.cos(a) * 3 * k, y1 + Math.sin(a) * 3 * k);
    ctx.lineTo(x1 + Math.cos(a + 2.4) * 8 * k, y1 + Math.sin(a + 2.4) * 8 * k); ctx.lineTo(x1 + Math.cos(a - 2.4) * 8 * k, y1 + Math.sin(a - 2.4) * 8 * k); ctx.closePath(); ctx.fill();
  };
  const boot = (x, y, s, col) => { ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s); ctx.lineTo(x + s * 0.1, y - s); ctx.lineTo(x + s * 0.1, y - s * 0.35); ctx.lineTo(x + s * 0.8, y - s * 0.2); ctx.lineTo(x + s * 0.8, y); ctx.lineTo(x - s * 0.5, y); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6 * k; ctx.stroke(); };
  switch (id) {
    case 's_miniheart':
      drawHeart(ctx, cx, H * 0.62, H * 0.26); ctx.fillStyle = '#f9a8cc'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.stroke(); return true;
    case 's_regen':
      for (let i = 0; i < 3; i++) { const x = W * (0.3 + i * 0.2), y = H * (0.7 - (i % 2) * 0.25); ctx.fillStyle = '#7ddc94'; ctx.fillRect(x - 2.5 * k, y - 7 * k, 5 * k, 14 * k); ctx.fillRect(x - 7 * k, y - 2.5 * k, 14 * k, 5 * k); }
      circle(cx, cy, R * 1.05, null, 'rgba(42,157,92,0.5)'); return true;
    case 's_timer':
      circle(cx, cy + 2 * k, R, '#ffffff', C.ink); line(C.ink, 2.4); ctx.beginPath(); ctx.moveTo(cx, cy + 2 * k); ctx.lineTo(cx, cy - R * 0.6); ctx.moveTo(cx, cy + 2 * k); ctx.lineTo(cx + R * 0.45, cy + 2 * k); ctx.stroke();
      ctx.fillStyle = '#2a9d5c'; ctx.font = `900 ${11 * k}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('+15', W * 0.82, H * 0.3); return true;
    case 's_feather':
      ctx.beginPath(); ctx.moveTo(W * 0.3, H * 0.85); ctx.quadraticCurveTo(W * 0.35, H * 0.2, W * 0.72, H * 0.12); ctx.quadraticCurveTo(W * 0.66, H * 0.6, W * 0.3, H * 0.85); ctx.fillStyle = '#f4f7ff'; ctx.fill(); ctx.strokeStyle = '#6a8fc7'; ctx.lineWidth = 2 * k; ctx.stroke();
      line('#6a8fc7', 1.4); ctx.beginPath(); ctx.moveTo(W * 0.3, H * 0.85); ctx.quadraticCurveTo(W * 0.48, H * 0.45, W * 0.68, H * 0.18); ctx.stroke(); return true;
    case 's_jump':
      arrow(cx, H * 0.88, cx, H * 0.14, '#2a5bd7'); ctx.fillStyle = C.ink; ctx.fillRect(W * 0.28, H * 0.86, W * 0.44, 3 * k); return true;
    case 's_double':
      boot(W * 0.42, H * 0.86, H * 0.32, '#f2a65a'); arrow(W * 0.72, H * 0.7, W * 0.72, H * 0.12, '#2a5bd7'); arrow(W * 0.58, H * 0.5, W * 0.58, H * 0.12, 'rgba(42,91,215,0.5)'); return true;
    case 's_wind':
      line('#6a8fc7', 2.6); ctx.beginPath();
      for (let i = 0; i < 3; i++) { const y = H * (0.3 + i * 0.2), x0 = W * (0.12 + (i % 2) * 0.08); ctx.moveTo(x0, y); ctx.lineTo(W * 0.68, y); ctx.arc(W * 0.68, y - 5 * k, 5 * k, Math.PI / 2, -Math.PI / 2 * 0.2, true); }
      ctx.stroke(); arrow(W * 0.6, H * 0.88, W * 0.9, H * 0.88, C.builder); return true;
    case 's_cushion':
      rrect(ctx, W * 0.18, H * 0.48, W * 0.64, H * 0.34, 10 * k); ctx.fillStyle = '#ffd1e0'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * k; ctx.stroke();
      arrow(cx, H * 0.08, cx, H * 0.38, C.runner); return true;
    case 's_spikeboots':
      ctx.fillStyle = '#9e1a28'; ctx.beginPath(); for (let i = 0; i < 4; i++) { const x = W * (0.2 + i * 0.2); ctx.moveTo(x - 6 * k, H * 0.92); ctx.lineTo(x, H * 0.72); ctx.lineTo(x + 6 * k, H * 0.92); } ctx.fill();
      boot(W * 0.45, H * 0.66, H * 0.36, '#7ec8ff'); return true;
    case 's_lamp':
      { const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, R * 1.3); grd.addColorStop(0, 'rgba(255,240,150,0.9)'); grd.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, R * 1.3, 0, TAU); ctx.fill(); }
      rrect(ctx, cx - 7 * k, cy - 9 * k, 14 * k, 20 * k, 4 * k); ctx.fillStyle = '#ffe24a'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * k; ctx.stroke();
      line(C.ink, 2); ctx.beginPath(); ctx.arc(cx, cy - 11 * k, 5 * k, Math.PI, 0); ctx.stroke(); return true;
    case 's_slow':
      ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.62, W * 0.2, H * 0.2, 0, Math.PI, 0); ctx.fillStyle = '#c9a26a'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * k; ctx.stroke();
      line(C.ink, 1.6); ctx.beginPath(); ctx.arc(W * 0.5, H * 0.56, H * 0.09, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#e8d6a8'; ctx.fillRect(W * 0.25, H * 0.62, W * 0.55, 4 * k); circle(W * 0.78, H * 0.56, 5 * k, '#e8d6a8', C.ink); return true;
    case 's_nojam':
      ctx.fillStyle = '#4b3a6b'; ctx.font = `900 ${13 * k}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('Z', W * 0.42, H * 0.62); ctx.font = `900 ${10 * k}px sans-serif`; ctx.fillText('z', W * 0.6, H * 0.44); ctx.font = `900 ${8 * k}px sans-serif`; ctx.fillText('z', W * 0.72, H * 0.3);
      rrect(ctx, W * 0.2, H * 0.7, W * 0.5, H * 0.18, 4 * k); ctx.fillStyle = '#f2b6c6'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6 * k; ctx.stroke(); return true;
    case 's_clear':
      for (const [x, y] of [[0.32, 0.38], [0.56, 0.62], [0.7, 0.32]]) { circle(W * x, H * y, 6 * k, '#e5383b', C.ink); }
      line('#2a9d5c', 3); ctx.beginPath(); ctx.moveTo(W * 0.18, H * 0.85); ctx.lineTo(W * 0.85, H * 0.15); ctx.stroke(); return true;
    case 's_shot':
      for (const dy of [-0.22, 0, 0.22]) { circle(W * 0.62, H * (0.5 + dy), 6 * k, '#2a9d5c', C.ink); line('rgba(42,157,92,0.5)', 2); ctx.beginPath(); ctx.moveTo(W * 0.2, H * (0.5 + dy * 0.4)); ctx.lineTo(W * 0.5, H * (0.5 + dy * 0.9)); ctx.stroke(); }
      return true;
    case 's_push':
      circle(cx, cy, R * 0.35, '#9fd3f4', C.ink);
      for (let j = 0; j < 6; j++) { const a = j / 6 * TAU; arrow(cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5, cx + Math.cos(a) * R * 1.05, cy + Math.sin(a) * R * 1.05, '#3e8fd6'); }
      return true;
    case 's_thunder':
      ctx.beginPath(); ctx.ellipse(cx, H * 0.26, W * 0.24, H * 0.14, 0, 0, TAU); ctx.fillStyle = '#9aa3b5'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(W * 0.52, H * 0.34); ctx.lineTo(W * 0.4, H * 0.62); ctx.lineTo(W * 0.52, H * 0.62); ctx.lineTo(W * 0.44, H * 0.94); ctx.lineTo(W * 0.66, H * 0.54); ctx.lineTo(W * 0.54, H * 0.54); ctx.lineTo(W * 0.62, H * 0.34); ctx.closePath();
      ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5 * k; ctx.stroke(); return true;
    case 's_column':
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = 'rgba(36,37,43,0.25)'; ctx.fillRect(W * 0.32 + i * 8 * k, H * 0.12 + j * 9 * k, 7 * k, 8 * k); }
      rrect(ctx, W * 0.28, H * 0.55, W * 0.44, H * 0.3, 4 * k); ctx.fillStyle = '#f7c6d6'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * k; ctx.stroke();
      ctx.fillStyle = '#5b8def'; ctx.fillRect(W * 0.28, H * 0.55, W * 0.14, H * 0.3); return true;
  }
  return false;
}
