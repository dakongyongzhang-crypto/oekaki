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
    case 8: {
      const j = hp === 9 ? (Math.random() - 0.5) * 3 : 0;
      ctx.save(); if (hp === 9) ctx.globalAlpha *= 0.6;
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(cx + j, cy, rad, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (const [dx, dy] of [[-0.35, -0.2], [0.25, 0.3], [0.1, -0.45]]) { ctx.beginPath(); ctx.arc(cx + j + dx * rad, cy + dy * rad, 1.3, 0, TAU); ctx.fill(); }
      ctx.restore();
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
      const r = 6.4 * k, pts = pen.thick ? [[0.18, 0.72], [0.3, 0.58], [0.42, 0.44], [0.18, 0.5], [0.32, 0.8], [0.44, 0.66]] : [[0.18, 0.72], [0.32, 0.56], [0.46, 0.4]];
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
    const b = SUPPORT_BLOCKS[id], cs = Math.min(W / (b.w + 1.2), H * 0.5), x0 = W / 2 - cs * b.w / 2, y0 = H / 2 - cs / 2;
    for (let i = 0; i < b.w; i++) {
      if (b.plank) { ctx.fillStyle = '#e2c29c'; ctx.fillRect(x0 + i * cs, y0 + cs * 0.25, cs, cs * 0.5); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x0 + i * cs, y0 + cs * 0.25, cs, cs * 0.5); }
      else drawPaintCell(ctx, b.kind, x0 + i * cs + cs / 2, y0 + cs / 2, cs * 0.5, INKS[0], 1);
    }
    ctx.restore(); return;
  }
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
