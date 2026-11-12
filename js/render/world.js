'use strict';

/* =====================================================
   地形・ゴール・アイテム・敵の描画
   ===================================================== */
function drawTerrain() {
  const c0 = Math.max(0, Math.floor(viewX / T) - 1), c1 = Math.min(LW - 1, Math.floor((viewX + VWW) / T) + 1);
  const r0 = Math.max(0, Math.floor(viewY / T) - 1), r1 = Math.min(ROWS - 1, Math.floor((viewY + VWH) / T) + 1);
  const terr = t => t === 1 || t === 2 || t === 8;
  g.beginPath();
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (tiles[r * LW + c] === 1 || tiles[r * LW + c] === 8) g.rect(c * T, r * T, T + 0.6, T + 0.6);
  g.fillStyle = stage.terr; g.fill(); g.fillStyle = hatch; g.fill();
  g.beginPath();
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (tiles[r * LW + c] === 2) g.rect(c * T, r * T, T, T);
  g.fillStyle = C.brick; g.fill();
  g.beginPath();
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (tiles[r * LW + c] === 2) {
    const x = c * T, y = r * T;
    g.moveTo(x + 3, y + T / 2); g.lineTo(x + T - 3, y + T / 2);
    const vx = x + (r % 2 ? T * 0.35 : T * 0.65);
    g.moveTo(vx, y + 3); g.lineTo(vx, y + T / 2 - 2);
  }
  g.strokeStyle = 'rgba(36,37,43,0.4)'; g.lineWidth = 1.2; g.stroke();
  g.beginPath();
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    const t = tiles[r * LW + c]; if (!terr(t)) continue;
    const x = c * T, y = r * T;
    if (t === 2) { wline(g, x, y, x + T, y); wline(g, x, y + T, x + T, y + T); wline(g, x, y, x, y + T); wline(g, x + T, y, x + T, y + T); continue; }
    if (!terr(tileAt(c, r - 1))) wline(g, x, y, x + T, y);
    if (r + 1 < ROWS && !terr(tileAt(c, r + 1))) wline(g, x, y + T, x + T, y + T);
    if (!terr(tileAt(c - 1, r))) wline(g, x, y, x, y + T);
    if (!terr(tileAt(c + 1, r))) wline(g, x + T, y, x + T, y + T);
  }
  g.strokeStyle = C.ink; g.lineWidth = 2.2; g.lineCap = 'round'; g.stroke();
  g.beginPath();
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    if (!stage.grass || r === 0 || tiles[r * LW + c] !== 1 || terr(tileAt(c, r - 1))) continue;
    const hh = hash2(c, r); if (hh > 0.65) continue;
    const x = c * T + 4 + hh * 11, y = r * T;
    g.moveTo(x - 3, y - 1); g.lineTo(x - 1, y - 6 - hh * 4); g.lineTo(x + 1, y - 1); g.lineTo(x + 3.5, y - 5 - hh * 2);
  }
  g.strokeStyle = C.grass; g.lineWidth = 1.6; g.stroke();
  // トゲ地帯（触れるとダメージの床）
  g.beginPath();
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    if (tiles[r * LW + c] !== 8 || terr(tileAt(c, r - 1))) continue;
    const x = c * T, y = r * T;
    for (let k = 0; k < 2; k++) { g.moveTo(x + k * 10 + 1, y + 1); g.lineTo(x + k * 10 + 5, y - 11); g.lineTo(x + k * 10 + 9, y + 1); g.closePath(); }
  }
  g.fillStyle = '#d9dce4'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.6; g.stroke();
  g.beginPath();
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (tiles[r * LW + c] === 4) g.rect(c * T, r * T, T, 8);
  g.fillStyle = C.plank; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.8; g.stroke();
  g.beginPath();
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (tiles[r * LW + c] === 9) g.rect(c * T, r * T, T, 12);
  g.fillStyle = '#b07a4f'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.8; g.stroke();
  g.beginPath();
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (tiles[r * LW + c] === 9 && tileAt(c - 1, r) === 9 && (c % 4 === 0)) { g.moveTo(c * T, r * T + 12); g.lineTo(c * T, r * T + 26); }
  g.strokeStyle = 'rgba(36,37,43,0.5)'; g.lineWidth = 2; g.stroke();
  // erased holes
  const holes = [];
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (tiles[r * LW + c] === 6) holes.push([c, r, paintExp[r * LW + c] - tick]);
  if (holes.length) {
    g.fillStyle = 'rgba(255,255,255,0.8)';
    for (const [c, r] of holes) g.fillRect(c * T, r * T, T, T);
    g.setLineDash([3, 3]); g.lineWidth = 1.5;
    for (const [c, r, left] of holes) { g.strokeStyle = left < 120 && (tick >> 3) % 2 ? C.runner : 'rgba(232,48,95,0.45)'; g.strokeRect(c * T + 2, r * T + 2, T - 4, T - 4); }
    g.setLineDash([]);
  }
  // painted cells
  const inkPaths = INKS.map(() => new Path2D()); const others = [];
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    const i = r * LW + c, t = tiles[i]; if (t !== 3 && t !== 5) continue;
    const kind = t === 5 ? 5 : paintKind[i];
    const age = tick - paintT[i], left = paintExp[i] - tick;
    const cx = c * T + T / 2 + (hash2(c, r) - 0.5) * 3, cy = r * T + T / 2 + (hash2(r, c) - 0.5) * 3, rad = T * 0.62 + hash2(c + 9, r) * 2;
    if (kind === 0 && age >= 8 && left > 180) { const p = inkPaths[paintCol[i]]; p.moveTo(cx + rad, cy); p.arc(cx, cy, rad, 0, TAU); }
    else others.push([kind, cx, cy, rad, i, age, left]);
  }
  inkPaths.forEach((p, k) => { g.fillStyle = INKS[k]; g.fill(p); });
  for (const [kind, cx, cy, rad, i, age, left] of others) {
    const sc = age < 8 ? 0.3 + age / 8 * 0.7 : 1;
    g.globalAlpha = left <= 180 ? ((tick >> 3) % 2 ? 0.35 : 0.85) : 1;
    drawPaintCell(g, kind, cx, cy, rad * sc, INKS[paintCol[i]], paintHp[i]);
    g.globalAlpha = 1;
  }
}
function drawGoal() {
  if (bossInfo) return;
  const gx = goalX, gy = goalY;
  if (gx < viewX - 200 || gx > viewX + VWW + 200 || gy < viewY - 60 || gy - 230 > viewY + VWH) return;
  g.save();
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? C.ink : '#ffffff'; g.fillRect(gx - 4, gy + i * 8 - 48, 8, 8); }
  g.strokeStyle = C.ink; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy - 170); g.stroke();
  g.beginPath(); g.arc(gx, gy - 174, 6, 0, TAU); g.fillStyle = '#ffe24a'; g.fill(); g.lineWidth = 2; g.stroke();
  const wv = Math.sin(tick * 0.1) * 6;
  g.beginPath(); g.moveTo(gx, gy - 166);
  g.quadraticCurveTo(gx + 42, gy - 166 + wv, gx + 84, gy - 148);
  g.quadraticCurveTo(gx + 42, gy - 128 - wv, gx, gy - 122);
  g.closePath(); g.fillStyle = C.runner; g.fill(); g.lineWidth = 2; g.stroke();
  g.fillStyle = '#fff'; g.font = `18px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('GOAL', gx + 34, gy - 146);
  g.restore();
}
function drawStart() {
  const x = startSign.x, gy = startSign.y; if (x > viewX + VWW + 80 || gy < viewY - 20 || gy - 100 > viewY + VWH) return;
  g.save(); g.strokeStyle = C.ink; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(x - 20, gy); g.lineTo(x - 20, gy - 56); g.stroke();
  rrect(g, x - 52, gy - 80, 64, 28, 5); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 2; g.stroke();
  g.fillStyle = C.ink; g.font = `15px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('START', x - 20, gy - 65);
  g.restore();
}
function drawItems() {
  for (const it of items) {
    if (it.taken || it.x < viewX - 30 || it.x > viewX + VWW + 30) continue;
    const y = it.y + Math.sin(tick * 0.08 + it.x) * 3;
    if (it.type === 'key') {
      g.save(); g.globalAlpha = 0.5 + Math.sin(tick * 0.2) * 0.2; g.beginPath(); g.arc(it.x, y, 20, 0, TAU); g.fillStyle = '#fff3a0'; g.fill(); g.restore();
      drawKey(g, it.x, y); continue;
    }
    drawHeart(g, it.x, y, 11); g.fillStyle = '#f27eb1'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
  }
}
function drawEnemyExtras(e, front) {
  const ecx = e.x + e.w / 2;
  if (!front) {
    if (e.type === 'fire') {
      if (e.cyc >= 90 && e.cyc < 130) drawFlame(g, e.x + 4, e.y + 2, e.w - 8, 6 + Math.sin(tick * 0.6) * 3, tick);
      drawFlame(g, e.x, e.y + 2, e.w, fireH(e), tick);
    }
    if (e.type === 'crusher' && e.mode === 'hover' && e.spawnT <= 0) {
      g.save(); g.setLineDash([2, 6]); g.strokeStyle = 'rgba(36,37,43,0.3)'; g.lineWidth = 2; g.beginPath();
      g.moveTo(e.x + 6, e.y + e.h + 4); g.lineTo(e.x + 6, e.y + e.h + 50); g.moveTo(e.x + e.w - 6, e.y + e.h + 4); g.lineTo(e.x + e.w - 6, e.y + e.h + 50);
      g.stroke(); g.restore();
    }
    if (e.type === 'charger' && e.mode === 'dash') {
      g.strokeStyle = 'rgba(36,37,43,0.35)'; g.lineWidth = 2; g.beginPath();
      for (let k = 0; k < 3; k++) { const y = e.y + 6 + k * 7, x = e.dir > 0 ? e.x - 6 : e.x + e.w + 6; g.moveTo(x, y); g.lineTo(x - e.dir * (14 + k * 4), y); }
      g.stroke();
    }
    return;
  }
  if (e.type === 'boss' && e.spawnT <= 0) {
    g.save(); g.font = `${Math.round(15 * TXS)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineWidth = 4; g.strokeStyle = '#fff';
    const bn = isEX() ? '真・消しゴム大王' : '消しゴム大王'; g.strokeText(bn, ecx, e.y - 12); g.fillStyle = C.bad; g.fillText(bn, ecx, e.y - 12);
    if (e.stun > 0) {
      for (let k = 0; k < 3; k++) {
        const a = tick * 0.15 + k * TAU / 3, sx = ecx + Math.cos(a) * 34, sy = e.y + 6 + Math.sin(a) * 8;
        g.beginPath(); for (let j = 0; j < 10; j++) { const aa = j / 10 * TAU, rr = j % 2 ? 3 : 7; g.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr); } g.closePath();
        g.fillStyle = '#ffd23f'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.stroke();
      }
    }
    g.restore();
  }
  if (e.type === 'laser' && e.spawnT <= 0 && e.cyc >= 120 && e.beamEnd != null) {
    const by = e.y + 9, sx = e.dir > 0 ? e.x + e.w + 3 : e.x - 3;
    g.save(); g.lineCap = 'round';
    if (e.cyc < 170) {
      g.setLineDash([4, 6]); g.lineDashOffset = -tick * 2; g.strokeStyle = (tick >> 2) % 2 ? 'rgba(255,92,132,0.9)' : 'rgba(255,92,132,0.35)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(sx, by); g.lineTo(e.beamEnd, by); g.stroke();
    } else {
      const wv = 1 + Math.sin(tick * 1.3) * 0.25;
      g.strokeStyle = 'rgba(255,92,132,0.85)'; g.lineWidth = 10 * wv; g.beginPath(); g.moveTo(sx, by); g.lineTo(e.beamEnd, by); g.stroke();
      g.strokeStyle = '#fff6fa'; g.lineWidth = 3; g.stroke();
    }
    g.restore();
  }
  if (e.type === 'rockfall') {
    for (let k = 0; k < 3; k++) {
      const st = k * 45; if (e.cyc < st || e.cyc >= st + 36) continue;
      const x = e.rxs[k], c = Math.floor(x / T); let r = Math.max(0, Math.floor(e.y / T)); while (r < ROWS && !solid(c, r)) r++;
      const gyy = Math.min(r * T, WH);
      g.save(); g.setLineDash([5, 7]); g.strokeStyle = (tick >> 2) % 2 ? 'rgba(209,41,63,0.8)' : 'rgba(209,41,63,0.3)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, e.y + 70); g.lineTo(x, gyy); g.stroke(); g.setLineDash([]);
      const q = (e.cyc - st) / 36;
      g.beginPath(); g.ellipse(x, gyy - 2, 6 + q * 10, 3 + q * 2, 0, 0, TAU); g.fillStyle = 'rgba(36,37,43,0.25)'; g.fill();
      g.font = `${Math.round(20 * TXS)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineWidth = 6; g.strokeStyle = '#fff'; g.strokeText('!', x, e.y + 112); g.fillStyle = C.bad; g.fillText('!', x, e.y + 112);
      g.restore();
    }
  }
  if (e.type === 'thunder' && e.spawnT <= 0) {
    if (e.cyc >= 110 && e.cyc < 155) {
      g.save(); g.setLineDash([6, 6]); g.lineDashOffset = -tick * 2;
      g.strokeStyle = (tick >> 2) % 2 ? 'rgba(242,184,0,0.9)' : 'rgba(209,41,63,0.6)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(ecx, e.y + e.h); g.lineTo(ecx, e.gy); g.stroke(); g.restore();
    }
    if (e.cyc >= 155) {
      const pts = []; const y0 = e.y + e.h, n = Math.max(3, Math.floor((e.gy - y0) / 22));
      for (let k = 0; k <= n; k++) pts.push([ecx + (k === 0 || k === n ? 0 : rand(-9, 9)), y0 + (e.gy - y0) * k / n]);
      for (const [col, lw] of [['#f2b800', 8], ['#fffbe0', 3]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); }
    }
  }
  if (e.type === 'bomb' && e.spawnT <= 0) {
    g.save(); g.setLineDash([6, 6]); g.lineDashOffset = -tick;
    g.strokeStyle = e.fuse < 60 && (tick >> 2) % 2 ? 'rgba(209,41,63,0.9)' : 'rgba(224,122,31,0.45)'; g.lineWidth = e.fuse < 60 ? 3 : 2;
    g.beginPath(); g.arc(ecx, e.y + e.h / 2, BOMB_R, 0, TAU); g.stroke();
    if (e.fuse < 60) { g.fillStyle = 'rgba(209,41,63,0.07)'; g.fill(); }
    g.restore();
    const n = Math.ceil(e.fuse / 60);
    g.font = `${Math.round((e.fuse < 60 ? 22 : 18) * TXS)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.lineWidth = 4; g.strokeStyle = '#fff'; g.strokeText(String(n), ecx, e.y - 10);
    g.fillStyle = (e.fuse < 60 && (tick >> 2) % 2) ? C.ink : C.bad; g.fillText(String(n), ecx, e.y - 10);
  }
}
function drawEnemies() {
  for (const e of enemies) {
    const reach = (ETYPES[e.type].reach || 0) + (e.type === 'fan' ? 240 : 0) + (e.type === 'laser' ? 620 : 0) + (e.type === 'rockfall' ? 800 : 0);
    if (e.x - reach > viewX + VWW + 60 || e.x + e.w + reach < viewX - 60 || e.y - reach > viewY + VWH + 60 || e.y + e.h + reach < viewY - 60) continue;
    drawEnemyExtras(e, false);
    g.save(); g.translate(e.x, e.y);
    if (e.type === 'crusher' && e.mode === 'shake') g.translate(rand(-2, 2), 0);
    if (e.spawnT > 0) {
      const q = 1 - e.spawnT / SPAWN;
      g.globalAlpha = 0.2 + q * 0.6;
      drawEnemyShape(g, e.type, e.w, e.h, { t: tick, face: e.dir, aim: e.aim, rot: e.rot });
      g.globalAlpha = 1;
      g.setLineDash([5, 5]); g.lineDashOffset = -tick; g.strokeStyle = C.builder; g.lineWidth = 2;
      g.beginPath(); g.ellipse(e.w / 2, e.h / 2, Math.max(e.w, 16) * (1.2 - q * 0.4), Math.max(e.h, 16) * (1.2 - q * 0.4), 0, 0, TAU); g.stroke(); g.setLineDash([]);
      g.fillStyle = C.builder; g.font = `${Math.round(18 * TXS)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      if ((tick >> 2) % 2) g.fillText('!', e.w / 2, -8);
    } else {
      const face = WALK_SPD[e.type] || ['charger', 'fan', 'bee', 'ghost', 'laser', 'warper', 'shadow', 'thrower', 'slime', 'slimelet'].includes(e.type) ? e.dir : Math.sign(P.x + P.w / 2 - (e.x + e.w / 2));
      if (e.type === 'ghost') g.globalAlpha = 0.72 + Math.sin(e.t * 0.08) * 0.18;
      if (e.type === 'warper' && e.mode === 'vanish') { const q = e.timer / 20; g.globalAlpha = q; g.translate(e.w / 2, e.h); g.scale(q, 1 + (1 - q) * 0.6); g.translate(-e.w / 2, -e.h); }
      if (e.type === 'shadow' && CH) drawShadowRunner(e);
      else drawEnemyShape(g, e.type, e.w, e.h, { t: e.t, face, flash: e.flash > 0, vy: e.vy, aim: e.aim, recoil: e.recoil, rot: e.rot, mode: e.mode, angry: e.type === 'boss' && e.t > 1200, charging: e.type === 'laser' && e.cyc >= 120, empty: e.type === 'thrower' && bullets.some(b => b.owner === e), throwing: e.throwT > 0 });
      g.globalAlpha = 1;
      if (effects.freeze > 0) { g.fillStyle = 'rgba(150,215,255,0.5)'; g.fillRect(-3, -3, e.w + 6, e.h + 6); g.strokeStyle = '#3e8fd6'; g.lineWidth = 2; g.strokeRect(-3, -3, e.w + 6, e.h + 6); }
      if (e.hp < e.maxHp && !ETYPES[e.type].invuln) {
        g.fillStyle = '#fff'; g.fillRect(0, -8, e.w, 4); g.fillStyle = C.bad; g.fillRect(0, -8, e.w * e.hp / e.maxHp, 4);
        g.strokeStyle = C.ink; g.lineWidth = 1; g.strokeRect(0, -8, e.w, 4);
      }
    }
    g.restore();
    drawEnemyExtras(e, true);
  }
  for (const b of bullets) {
    if (b.kind === 'boom') { g.save(); g.translate(b.x, b.y); g.rotate(b.rot); drawBoomerang(g, 0, 0, 9); g.restore(); continue; }
    if (b.kind === 'ink') {
      g.save(); g.globalAlpha = 0.35; g.fillStyle = b.col; g.beginPath(); g.ellipse(b.x - Math.sign(b.vx) * b.r * 1.4, b.y, b.r * 1.6, b.r * 0.6, 0, 0, TAU); g.fill(); g.restore();
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fillStyle = b.col; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fill();
      continue;
    }
    if (b.kind === 'shot') {
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fillStyle = '#ff7fa6'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.arc(b.x - 2, b.y - 2, 2.2, 0, TAU); g.fillStyle = '#ffffff'; g.fill();
      continue;
    }
    if (b.kind === 'crumb') {
      g.save(); g.translate(b.x, b.y); g.rotate(b.rot); rrect(g, -8, -5, 16, 10, 3); g.fillStyle = '#fbe6ee'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 1.6; g.stroke(); g.restore();
      continue;
    }
    if (b.kind === 'rock') {
      g.save(); g.translate(b.x, b.y); g.rotate(b.rot); g.beginPath();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, q = b.r * (0.85 + 0.15 * ((k * 5) % 3) / 2); if (k) g.lineTo(Math.cos(a) * q, Math.sin(a) * q); else g.moveTo(Math.cos(a) * q, Math.sin(a) * q); }
      g.closePath(); g.fillStyle = '#a59c8e'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke(); g.restore();
      continue;
    }
    g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fillStyle = C.ink; g.fill();
    g.beginPath(); g.moveTo(b.x - b.vx * 3, b.y - b.vy * 3); g.lineTo(b.x - b.vx * 6, b.y - b.vy * 6);
    g.strokeStyle = 'rgba(36,37,43,0.4)'; g.lineWidth = 2; g.stroke();
  }
}
function drawShadowRunner(e) {
  if (shadowFor !== CH) {
    shadowFor = CH; shadowSpr = document.createElement('canvas'); shadowSpr.width = CH.spr.width; shadowSpr.height = CH.spr.height;
    const sc = shadowSpr.getContext('2d'); sc.drawImage(CH.spr, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = 'rgba(75,58,107,0.9)'; sc.fillRect(0, 0, shadowSpr.width, shadowSpr.height);
  }
  const legH = CH.legH, bodyH = e.h - legH;
  g.save(); g.globalAlpha *= 0.8 + Math.sin(tick * 0.2) * 0.1;
  g.strokeStyle = 'rgba(75,58,107,0.9)'; g.lineWidth = 2.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(e.w * 0.28, e.h - legH); g.lineTo(e.w * 0.28, e.h); g.moveTo(e.w * 0.72, e.h - legH); g.lineTo(e.w * 0.72, e.h); g.stroke();
  g.translate(e.w / 2, 0); g.scale(e.dir || 1, 1);
  g.drawImage(shadowSpr, -e.w / 2, 0, e.w, bodyH);
  g.fillStyle = '#ff5c84'; g.beginPath(); g.arc(e.w * 0.12, bodyH * 0.35, 2.4, 0, TAU); g.arc(e.w * 0.3, bodyH * 0.35, 2.4, 0, TAU); g.fill();
  g.restore();
}
