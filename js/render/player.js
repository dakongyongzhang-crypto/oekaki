'use strict';

/* =====================================================
   ランナーとパーティクルの描画
   ===================================================== */
function drawPlayer() {
  const p = P, ch = CH;
  if (p.y > WH + 100) return;
  const blink = p.inv > 0 && (p.inv >> 2) % 2 === 0;
  g.save(); if (blink) g.globalAlpha = 0.35;
  const cx = p.x + p.w / 2, footY = p.y + p.h, legH = ch.legH, bodyH = p.h - legH, lx = p.w * 0.22;
  g.strokeStyle = C.ink; g.lineWidth = 2.6; g.lineCap = 'round';
  g.beginPath();
  if (p.onGround) {
    const s = Math.abs(p.vx) > 0.3 ? Math.sin(p.walk) * legH * 0.7 : 0;
    g.moveTo(cx - lx, footY - legH); g.lineTo(cx - lx + s, footY);
    g.moveTo(cx + lx, footY - legH); g.lineTo(cx + lx - s, footY);
  } else {
    g.moveTo(cx - lx, footY - legH); g.lineTo(cx - lx - 3 * p.facing, footY - 1);
    g.moveTo(cx + lx, footY - legH); g.lineTo(cx + lx + 4 * p.facing, footY - 4);
  }
  g.stroke();
  g.translate(cx, footY - legH);
  g.rotate(clamp(p.vx * 0.025, -0.15, 0.15));
  g.scale(p.facing * p.squash, 1 / p.squash);
  const bob = p.onGround && Math.abs(p.vx) > 0.3 ? -Math.abs(Math.sin(p.walk)) * 2 : 0;
  g.drawImage(ch.spr, -p.w / 2, -bodyH + bob, p.w, bodyH);
  g.restore();
  if (p.glued) { g.fillStyle = 'rgba(150,98,52,0.5)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(p.x + p.w * (0.2 + k * 0.3), p.y + p.h + 2 + Math.sin(tick * 0.2 + k) * 2, 3, 0, TAU); g.fill(); } }
  if (p.stuck > 0) {
    g.fillStyle = 'rgba(242,220,140,0.85)'; g.strokeStyle = 'rgba(160,112,63,0.8)'; g.lineWidth = 1.4;
    g.beginPath(); g.ellipse(cx, p.y + p.h - 2, p.w * 0.62, 7, 0, 0, TAU); g.fill(); g.stroke();
  }
  if (p.shield > 0) {
    g.save(); g.globalAlpha = p.shield < 60 && (tick >> 3) % 2 ? 0.3 : 0.8;
    g.beginPath(); g.arc(cx, p.y + p.h / 2, Math.max(p.w, p.h) * 0.78, 0, TAU);
    g.fillStyle = 'rgba(126,200,255,0.22)'; g.fill(); g.strokeStyle = '#3e8fd6'; g.lineWidth = 3; g.stroke(); g.restore();
  }
  if (effects.boost > 0 && Math.abs(p.vx) > 1) {
    g.strokeStyle = 'rgba(255,190,40,0.8)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i < 3; i++) { const y = p.y + p.h * (0.3 + i * 0.2), x = p.vx > 0 ? p.x - 6 : p.x + p.w + 6; g.moveTo(x, y); g.lineTo(x - Math.sign(p.vx) * (16 + i * 6), y); }
    g.stroke();
  }
  if (effects.heavy > 0) drawWeight(g, cx, p.y - (effects.rev > 0 ? 40 : 18) + Math.sin(tick * 0.15) * 1.5, 8);
  if (effects.rev > 0) {
    g.save(); g.translate(cx, p.y - 16 + Math.sin(tick * 0.2) * 2);
    g.font = `${Math.round(15 * TXS)}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 5.5; g.strokeStyle = '#fff'; g.strokeText('⇄ さかさま', 0, 0); g.fillStyle = C.builder; g.fillText('⇄ さかさま', 0, 0);
    g.restore();
  }
  const atype = ch.atkType || 'slash';
  if (p.dashT > 0) { // ダッシュ突進：残像と集中線
    g.save();
    for (let k = 1; k <= 3; k++) {
      g.save(); g.globalAlpha = 0.26 / k; g.translate(cx - p.dashDir * k * 16, footY - legH); g.scale(p.facing, 1);
      g.drawImage(ch.spr, -p.w / 2, -bodyH, p.w, bodyH); g.restore();
    }
    g.strokeStyle = ch.color || C.runner; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i < 4; i++) { const y = p.y + p.h * (0.15 + i * 0.22), x = p.dashDir > 0 ? p.x - 4 : p.x + p.w + 4; g.moveTo(x, y); g.lineTo(x - p.dashDir * (22 + i * 8), y); }
    g.stroke(); g.restore();
  }
  if (p.slam) { // ドスン（空中）：急降下の線
    g.save(); g.strokeStyle = ch.color || C.runner; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i < 3; i++) { const x = p.x + p.w * (0.2 + i * 0.3); g.moveTo(x, p.y - 6); g.lineTo(x, p.y - 24 - i * 4); }
    g.stroke(); g.restore();
  }
  if (p.quakeT > 0) { // ドスン：足もとから広がる衝撃波
    const q = 1 - p.quakeT / 16, R = (p.quakeR || 100) * (0.25 + q * 0.75);
    g.save(); g.globalAlpha = 1 - q; g.strokeStyle = ch.color || C.runner; g.lineWidth = 6 * (1 - q) + 2;
    g.beginPath(); g.ellipse(cx, footY, R, R * 0.22, 0, 0, TAU); g.stroke();
    const U = (p.quakeU || 50) * (0.4 + q * 0.6); // 上にも広がる衝撃波
    g.lineWidth = 4 * (1 - q) + 1.5; g.beginPath(); g.arc(cx, p.y + p.h / 2, U, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); g.restore();
  }
  if (p.atkT > 0 && atype === 'shot') { // インクショット：発射の光
    const fx = p.x + p.w / 2 + p.facing * (p.w / 2 + 4), fy = p.y + p.h * 0.42;
    g.save(); g.globalAlpha = p.atkT / 8; g.fillStyle = ch.color || C.runner; g.beginPath(); g.arc(fx, fy, 6 + (8 - p.atkT), 0, TAU); g.fill(); g.restore();
  }
  if (p.atkT > 0 && atype === 'slash') {
    const q = 1 - p.atkT / 16, scx = p.x + p.w / 2 + p.facing * 10, scy = p.y + p.h / 2, R = ch.slashR * (0.78 + q * 0.22);
    const a0 = -Math.PI / 2 - p.facing * 0.3, span = TAU * Math.min(1, q * 1.7) * p.facing;
    g.save(); g.lineCap = 'round'; g.globalAlpha = 1 - q * 0.75;
    g.strokeStyle = ch.color; g.lineWidth = 10 * (1 - q) + 2;
    g.beginPath(); g.arc(scx, scy, R, a0, a0 + span, p.facing < 0); g.stroke();
    g.strokeStyle = C.ink; g.lineWidth = 1.6;
    g.beginPath(); g.arc(scx, scy, R + 6, a0 + span * 0.1, a0 + span * 0.85, p.facing < 0); g.stroke();
    g.restore();
  }
}
function drawParticles() {
  for (const pt of particles) {
    const a = clamp(pt.life / pt.max, 0, 1);
    if (pt.ring) { g.globalAlpha = a; g.strokeStyle = pt.color; g.lineWidth = 6 * a + 1; g.beginPath(); g.arc(pt.x, pt.y, pt.r * (1.1 - a * 0.6), 0, TAU); g.stroke(); continue; }
    g.globalAlpha = a; g.fillStyle = pt.color; g.beginPath(); g.arc(pt.x, pt.y, pt.r, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (const pp of popups) {
    g.globalAlpha = clamp(pp.life / 20, 0, 1);
    const sc = pp.life > pp.max - 6 ? 1 + (pp.life - (pp.max - 6)) * 0.08 : 1;
    g.font = `${Math.round(pp.size * sc * TXS)}px ${FONT}`;
    g.lineWidth = 6; g.strokeStyle = '#ffffff'; g.strokeText(pp.text, pp.x, pp.y);
    g.fillStyle = pp.color; g.fillText(pp.text, pp.x, pp.y);
  }
  g.globalAlpha = 1;
}
