'use strict';

/* =====================================================
   先取マッチの優勝シーン
   ===================================================== */
const vcv = $('#vicCanvas'), vg = vcv.getContext('2d');
let VIC = null;
const PCOL = ['#e07a1f', '#16899b'];
function bigSprite(strokes, maxW, maxH) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const st of strokes) { if (st.eraser) continue; const h = st.size / 2; for (const q of st.pts) { x0 = Math.min(x0, q.x - h); y0 = Math.min(y0, q.y - h); x1 = Math.max(x1, q.x + h); y1 = Math.max(y1, q.y + h); } }
  if (x0 > x1) return null;
  const pad = 4, bw = x1 - x0 + pad * 2, bh = y1 - y0 + pad * 2, k = Math.min(maxW / bw, maxH / bh), m = 7;
  const W = Math.ceil(bw * k) + m * 2 + 4, H = Math.ceil(bh * k) + m * 2 + 4;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; };
  const [base, bc] = mk();
  bc.setTransform(k, 0, 0, k, m - (x0 - pad) * k, m - (y0 - pad) * k);
  for (const st of strokes) paintStroke(bc, st, 2.5 / k);
  const [sil, sl] = mk();
  for (let a = 0; a < 16; a++) sl.drawImage(base, Math.cos(a / 16 * TAU) * m * 0.8, Math.sin(a / 16 * TAU) * m * 0.8);
  sl.globalCompositeOperation = 'source-in'; sl.fillStyle = '#ffffff'; sl.fillRect(0, 0, W, H);
  const [out, oc] = mk();
  oc.globalAlpha = 0.25; oc.drawImage(sil, 4, 5); oc.globalAlpha = 1;
  oc.drawImage(sil, 0, 0); oc.drawImage(base, 0, 0);
  return out;
}
function vicResize() { const d = Math.min(window.devicePixelRatio || 1, 2); vcv.width = 960 * d; vcv.height = 540 * d; if (VIC) VIC.dpr = d; }
window.addEventListener('resize', () => { if (curScreen === 'scr-victory') vicResize(); });
function showVictory() {
  $('#result').classList.add('hidden');
  const wi = lastResult.winIdx, w = MATCH.players[wi], l = MATCH.players[1 - wi];
  VIC = { wi, w, l, winSpr: bigSprite(w.strokes, 210, 160) || w.ch.spr, loseSpr: bigSprite(l.strokes, 110, 90) || l.ch.spr, conf: [], dpr: 1 };
  for (let i = 0; i < 90; i++) VIC.conf.push(newConfetti(Math.random() * 540));
  const h = MATCH.history;
  $('#vicHistory').innerHTML = `<h3>ラウンドの記録（${h.length}ラウンド）</h3><div class="hchips">` + h.map(r =>
    `<span class="hchip ${r.winIdx ? 'b' : 'a'}"><b>R${r.round}　${MATCH.players[r.winIdx].label}の勝ち</b><small>${r.role === 'runner' ? 'ランナーでゴール' : 'ビルダーで阻止'}・${r.stage}</small></span>`).join('') + '</div>';
  const row = (p, i) => {
    const asR = h.filter(r => r.winIdx === i && r.role === 'runner').length, asB = h.filter(r => r.winIdx === i && r.role === 'builder').length;
    return `<tr><td><span class="${i ? 'pb' : 'pa'}">プレイヤー${p.label}</span><br><small>${escapeHtml(p.name || '')}</small></td><td><b>${p.wins}</b></td><td>${asR}</td><td>${asB}</td></tr>`;
  };
  $('#vicStats').innerHTML = `<h3>成績</h3><table class="vic-table"><tr><th></th><th>勝利</th><th>ランナー</th><th>ビルダー</th></tr>${MATCH.players.map(row).join('')}</table>`;
  show('scr-victory'); vicResize();
  SFX.win(); setTimeout(() => SFX.win(), 900);
}
function newConfetti(y) {
  return { x: Math.random() * 960, y: y != null ? y : -10, vx: rand(-0.6, 0.6), vy: rand(1.2, 2.6), r: rand(0, TAU), vr: rand(-0.15, 0.15), w: rand(6, 11), h: rand(3, 6), c: ['#e8305f', '#2a5bd7', '#ffe24a', '#2a9d5c', '#e07a1f', '#16899b'][Math.floor(Math.random() * 6)] };
}
$('#btnVicRematch').addEventListener('click', () => { VIC = null; $('#btnRematch').click(); });
$('#btnVicTitle').addEventListener('click', () => { VIC = null; quitToTitle(); });
function drawVictory(ts) {
  const v = VIC, d = v.dpr || 1, t = ts / 1000, c = vg;
  c.setTransform(d, 0, 0, d, 0, 0);
  c.fillStyle = C.paper; c.fillRect(0, 0, 960, 540);
  c.strokeStyle = C.grid; c.lineWidth = 1; c.beginPath();
  for (let x = 0; x <= 960; x += 24) { c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, 540); }
  for (let y = 0; y <= 540; y += 24) { c.moveTo(0, y + 0.5); c.lineTo(960, y + 0.5); }
  c.stroke();
  // 回る光の筋
  c.save(); c.translate(480, 330); c.rotate(t * 0.15);
  for (let k = 0; k < 14; k++) { c.rotate(TAU / 14); c.beginPath(); c.moveTo(0, 0); c.lineTo(-45, -700); c.lineTo(45, -700); c.closePath(); c.fillStyle = 'rgba(255,226,74,0.13)'; c.fill(); }
  c.restore();
  const spot = c.createRadialGradient(480, 400, 10, 480, 380, 300); spot.addColorStop(0, 'rgba(255,226,74,0.4)'); spot.addColorStop(1, 'rgba(255,226,74,0)');
  c.fillStyle = spot; c.fillRect(0, 0, 960, 540);
  // 地面
  const GY = 470;
  c.fillStyle = C.terr; c.fillRect(0, GY, 960, 70); c.fillStyle = hatch; c.fillRect(0, GY, 960, 70);
  c.strokeStyle = C.ink; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, GY); c.lineTo(960, GY); c.stroke();
  // 表彰台
  const PX = 395, PW = 170, PT = 418;
  rrect(c, PX, PT, PW, 140, 6); c.fillStyle = '#ffe58a'; c.fill(); c.lineWidth = 3; c.stroke();
  c.fillStyle = C.ink; c.font = `40px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1', 480, PT + 34);
  // 負けたほう（右で座ってくやしがる）
  const ls = v.loseSpr, lw = ls.width, lh = ls.height, LX = 790;
  c.save(); c.translate(LX, GY); c.rotate(Math.sin(t * 1.3) * 0.04);
  c.globalAlpha = 0.85; c.drawImage(ls, -lw / 2, -lh + 4, lw, lh); c.globalAlpha = 1;
  c.restore();
  c.strokeStyle = '#7fb3e8'; c.lineWidth = 2; c.beginPath();
  for (let k = 0; k < 3; k++) { const yy = GY - lh - 4 - k * 8; c.moveTo(LX + lw / 2 - 6 + k * 3, yy); c.lineTo(LX + lw / 2 + 4 + k * 3, yy - 6); }
  c.stroke();
  c.font = `18px ${FONT}`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#fff';
  c.strokeText(`プレイヤー${v.l.label}「くやしい〜」`, LX, GY - lh - 26); c.fillStyle = C.ink; c.fillText(`プレイヤー${v.l.label}「くやしい〜」`, LX, GY - lh - 26);
  // 勝ったほう（中央で飛び跳ねる）
  const period = 0.62, ph = (t % period) / period, hop = Math.sin(ph * Math.PI);
  const air = hop * 75, legL = 24, footY = PT - air;
  const ground = hop < 0.14 ? 1 - hop / 0.14 : 0;
  const sx = 1 + ground * 0.16 - (1 - ground) * hop * 0.06, sy = 1 - ground * 0.16 + (1 - ground) * hop * 0.08;
  const sh = 1 - Math.min(0.6, air / 300);
  c.fillStyle = 'rgba(36,37,43,0.18)'; c.beginPath(); c.ellipse(480, PT, 80 * sh, 9 * sh, 0, 0, TAU); c.fill();
  const ws = v.winSpr, sw = ws.width, shh = ws.height;
  c.save(); c.translate(480, footY - legL);
  c.rotate(Math.sin(t * 4.2) * 0.07);
  c.scale(sx, sy);
  // 足
  c.strokeStyle = C.ink; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath();
  if (ground > 0.2) { c.moveTo(-sw * 0.18, -4); c.lineTo(-sw * 0.22, legL); c.moveTo(sw * 0.18, -4); c.lineTo(sw * 0.22, legL); }
  else { c.moveTo(-sw * 0.18, -4); c.lineTo(-sw * 0.28, legL * 0.7); c.moveTo(sw * 0.18, -4); c.lineTo(sw * 0.3, legL * 0.6); }
  c.stroke();
  // バンザイの腕
  const wave = Math.sin(t * 9) * 8;
  c.beginPath(); c.moveTo(-sw * 0.42, -shh * 0.5); c.lineTo(-sw * 0.42 - 22, -shh * 0.5 - 34 + wave); c.moveTo(sw * 0.42, -shh * 0.5); c.lineTo(sw * 0.42 + 22, -shh * 0.5 - 34 - wave); c.stroke();
  c.drawImage(ws, -sw / 2, -shh + 6, sw, shh);
  c.restore();
  // キラキラ
  for (let k = 0; k < 5; k++) {
    const a = t * 1.6 + k * TAU / 5, rx = 480 + Math.cos(a) * (sw * 0.75), ry = footY - legL - shh * 0.5 + Math.sin(a) * shh * 0.55, sz = 5 + Math.sin(t * 6 + k) * 2;
    c.fillStyle = '#ffd23f'; c.beginPath();
    for (let j = 0; j < 8; j++) { const aa = j / 8 * TAU, rr = j % 2 ? sz * 0.35 : sz; c.lineTo(rx + Math.cos(aa) * rr, ry + Math.sin(aa) * rr); }
    c.closePath(); c.fill();
  }
  // 紙吹雪
  if (v.conf.length < 160) v.conf.push(newConfetti());
  for (const q of v.conf) {
    q.vy = Math.min(q.vy + 0.05, 3); q.vx *= 0.99; q.x += q.vx + Math.sin(t * 2 + q.r) * 0.3; q.y += q.vy; q.r += q.vr;
    c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.fillStyle = q.c; c.fillRect(-q.w / 2, -q.h / 2, q.w, q.h * Math.abs(Math.cos(q.r * 2))); c.restore();
  }
  v.conf = v.conf.filter(q => q.y < 560);
  // 見出し
  const col = PCOL[v.wi];
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const pop = 1 + Math.sin(t * 3) * 0.03;
  c.save(); c.translate(480, 70); c.scale(pop, pop);
  c.font = `58px ${FONT}`; c.lineWidth = 10; c.strokeStyle = '#ffffff'; c.strokeText(`プレイヤー${v.w.label}の優勝！`, 0, 0);
  c.fillStyle = col; c.fillText(`プレイヤー${v.w.label}の優勝！`, 0, 0);
  c.restore();
  const [a, b] = MATCH.players;
  c.font = `30px ${FONT}`; c.lineWidth = 6; c.strokeStyle = '#fff';
  const sc = `A  ${a.wins} − ${b.wins}  B　（${MATCH.target}本先取）`;
  c.strokeText(sc, 480, 124); c.fillStyle = C.ink; c.fillText(sc, 480, 124);
}
