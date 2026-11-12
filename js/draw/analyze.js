'use strict';

/* =====================================================
   キャラ作成：ラクガキの解析（色・形 → 能力）
   ===================================================== */
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
// [体力, 速さ, 攻撃] の重み（色相ごとのアンカー）
const HUE_ANCHORS = [[0, [.1, .1, .8]], [30, [.2, .3, .5]], [55, [.1, .6, .3]], [90, [.45, .45, .1]], [130, [.8, .1, .1]], [190, [.2, .7, .1]], [225, [.1, .8, .1]], [275, [.4, .1, .5]], [330, [.55, .3, .15]], [360, [.1, .1, .8]]];
const HEAVY = [.6, .05, .35];
function colorWeights(r, g, b) {
  const [h, s, l] = rgb2hsl(r, g, b);
  let w = null;
  if (s < 0.15) w = l < 0.45 ? [.45, .1, .45] : [.3, .5, .2];
  else {
    for (let i = 0; i < HUE_ANCHORS.length - 1; i++) {
      const [h0, a] = HUE_ANCHORS[i], [h1, c] = HUE_ANCHORS[i + 1];
      if (h >= h0 && h <= h1) { const t = (h - h0) / (h1 - h0 || 1); w = [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)]; break; }
    }
    if (!w) w = [1 / 3, 1 / 3, 1 / 3];
    if (l < 0.32) { const k = (0.32 - l) / 0.32 * 0.6; w = w.map((v, i) => lerp(v, HEAVY[i], k)); }
    else if (l < 0.45 && s < 0.5) w = w.map((v, i) => lerp(v, HEAVY[i], 0.45));
  }
  return w;
}
function colorName(r, g, b) {
  let best = null, bd = 1e9;
  for (const [n, hex] of PALETTE) {
    const pr = parseInt(hex.slice(1, 3), 16), pg = parseInt(hex.slice(3, 5), 16), pb = parseInt(hex.slice(5, 7), 16);
    const d = (pr - r) ** 2 + (pg - g) ** 2 + (pb - b) ** 2;
    if (d < bd) { bd = d; best = n; }
  }
  return bd < 3600 ? best : 'カスタム色（' + best + 'っぽい）';
}
function countCorners(pts) {
  const rs = [pts[0]];
  for (const p of pts) { const l = rs[rs.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) >= 7) rs.push(p); }
  let c = 0;
  for (let i = 2; i < rs.length - 2; i++) {
    const ax = rs[i].x - rs[i - 2].x, ay = rs[i].y - rs[i - 2].y, bx = rs[i + 2].x - rs[i].x, by = rs[i + 2].y - rs[i].y;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (!la || !lb) continue;
    if ((ax * bx + ay * by) / (la * lb) < 0.45) { c++; i += 2; }
  }
  return c;
}
function analyze() {
  const data = dctx.getImageData(0, 0, DS, DS).data;
  let minX = DS, minY = DS, maxX = -1, maxY = -1, filled = 0, cn = 0;
  const cw = [0, 0, 0]; const buckets = new Map();
  for (let y = 0; y < DS; y += 2) {
    for (let x = 0; x < DS; x += 2) {
      const i = (y * DS + x) * 4, a = data[i + 3];
      if (a < 60) continue;
      filled++;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (a > 200) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const w = colorWeights(r, g, b); cw[0] += w[0]; cw[1] += w[1]; cw[2] += w[2]; cn++;
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
    }
  }
  if (filled < 12 || cn < 6) return null;
  const colorVec = cw.map(v => v / cn);
  let domKey = 0, domN = -1;
  buckets.forEach((n, k) => { if (n > domN) { domN = n; domKey = k; } });
  const dr = ((domKey >> 8) & 15) * 16 + 8, dg = ((domKey >> 4) & 15) * 16 + 8, db = (domKey & 15) * 16 + 8;
  const domHex = '#' + [dr, dg, db].map(v => v.toString(16).padStart(2, '0')).join('');

  let lenSum = 0, wSum = 0, corners = 0;
  for (const s of D.strokes) {
    if (s.eraser) continue;
    let len = 0; for (let i = 1; i < s.pts.length; i++) len += Math.hypot(s.pts[i].x - s.pts[i - 1].x, s.pts[i].y - s.pts[i - 1].y);
    const L = Math.max(len, s.size); lenSum += L; wSum += L * s.size; corners += countCorners(s.pts);
  }
  const avgW = lenSum ? wSum / lenSum : 8;
  const t = clamp((avgW - 3) / 25, 0, 1);
  const bw = maxX - minX + 2, bh = maxY - minY + 2;
  const sRaw = Math.sqrt(bw * bh) / DS;
  const sN = clamp((sRaw - 0.15) / 0.7, 0, 1);
  const density = clamp(filled / ((bw / 2) * (bh / 2)), 0, 1);
  const kN = clamp((corners / Math.max(1, lenSum / 100)) / 1.4, 0, 1);

  const raw = [
    0.40 * colorVec[0] + 0.25 * t + 0.25 * sN + 0.10 * density,
    0.40 * colorVec[1] + 0.30 * (1 - t) + 0.30 * (1 - sN),
    0.40 * colorVec[2] + 0.35 * kN + 0.15 * t + 0.10 * density
  ].map(v => Math.pow(Math.max(v, 0.02), 1.6));
  const sum = raw[0] + raw[1] + raw[2];
  const st = raw.map(v => clamp(Math.round(10 + 120 * v / sum), 10, 99));
  return {
    stats: { hp: st[0], spd: st[1], atk: st[2] },
    colorVec, domHex, domName: colorName(dr, dg, db), avgW, t, sRaw, sN, density, kN, corners,
    bbox: { minX, minY, maxX: maxX + 2, maxY: maxY + 2 }, bw, bh, enough: filled >= 120
  };
}
function deriveParams(an) {
  const s = an.stats;
  const h = Math.round(30 + an.sN * 24);
  const aspect = clamp(an.bw / an.bh, 0.55, 1.5);
  const w = Math.round(clamp(h * aspect * 0.95, 22, 54));
  return {
    w, h, legH: Math.max(5, Math.round(h * 0.15)),
    maxHp: Math.round(60 + s.hp * 1.4),
    runSpeed: 3.0 + s.spd * 0.042,
    jumpV: 10.5 + s.spd * 0.014,
    slashR: Math.round(32 + s.atk * 0.42),
    dmg: 1 + Math.floor(s.atk / 30),
    atkType: atkTypeOf(s),
    shotSpd: 7 + s.atk * 0.03, shotR: 8 + Math.round(s.atk * 0.05),
    dashSpd: Math.max(9, (3.0 + s.spd * 0.042) * 2.4),
    quakeR: Math.round(80 + s.hp * 0.5)
  };
}
function typeName(s) {
  const arr = [['どっしりタンク型', s.hp], ['すばしっこスプリンター型', s.spd], ['トゲトゲアタッカー型', s.atk]].sort((a, b) => b[1] - a[1]);
  if (arr[0][1] - arr[2][1] < 16) return 'バランス型';
  return arr[0][0];
}
// 攻撃方法：いちばん高い能力で決まる（3つが近いときはバランス型の「斬り」）
const ATK_TYPES = {
  slash: { name: '斬り', desc: '3つの能力のバランスがよいので、まわりをまとめて斬る（攻撃が高いほど範囲が広い）' },
  shot: { name: 'インクショット', desc: '攻撃がいちばん高いので、前にインクの弾を撃つ（攻撃が高いほど弾が速くて大きい）' },
  dash: { name: 'ダッシュ突進', desc: '速さがいちばん高いので、前へ一気に突っ込んで体当たり（突進中は無敵・空中でも使える）' },
  quake: { name: 'ドスン', desc: '体力がいちばん高いので、地面をゆらして両側の敵を攻撃（空中で使うと急降下してから）' }
};
function atkTypeOf(s) {
  const arr = [['quake', s.hp], ['dash', s.spd], ['shot', s.atk]].sort((a, b) => b[1] - a[1]);
  return arr[0][1] - arr[2][1] < 16 ? 'slash' : arr[0][0];
}
function analyzeAndShow() {
  const an = analyze(); D.analysis = an;
  const set = (id, v) => { $('#b' + id).style.width = (v || 0) + '%'; $('#v' + id).textContent = v ? v : '—'; };
  if (!an) {
    set('Hp', 0); set('Spd', 0); set('Atk', 0);
    $('#sHp').textContent = $('#sSpd').textContent = $('#sAtk').textContent = '';
    $('#typeBadge').textContent = 'まだ白紙'; $('#bodySize').textContent = '';
    $('#breakdown').innerHTML = '<li class="muted">線を描くと、ここに解析結果が出ます</li>';
    $('#btnGo').disabled = true; $('#goHint').textContent = 'まずはキャラを描いてください';
    return;
  }
  const s = an.stats, p = deriveParams(an);
  set('Hp', s.hp); set('Spd', s.spd); set('Atk', s.atk);
  $('#sHp').textContent = `最大HP ${p.maxHp}`;
  $('#sSpd').textContent = `最高速 ${p.runSpeed.toFixed(1)}　ジャンプ力 ${p.jumpV.toFixed(1)}`;
  $('#sAtk').textContent = `攻撃方法：${ATK_TYPES[p.atkType].name}　ダメージ ${p.dmg}`;
  $('#typeBadge').textContent = typeName(s);
  $('#bodySize').textContent = `体格 ${p.w}×${p.h}`;
  const lab = ['体力', '速さ', '攻撃'][an.colorVec.indexOf(Math.max(...an.colorVec))];
  const tw = an.t > 0.45 ? ['太め', '体力・攻撃が上がる'] : an.t < 0.2 ? ['細め', '速さが上がる'] : ['ふつう', '影響は小さめ'];
  const sz = an.sN > 0.6 ? ['大きい', '体力↑ 速さ↓'] : an.sN < 0.3 ? ['小さい', '速さ↑ 体力↓'] : ['中くらい', 'バランス'];
  const kk = an.kN > 0.5 ? ['とがってる', '攻撃が上がる'] : an.kN < 0.15 ? ['まるい', '攻撃は控えめ'] : ['角あり', '攻撃が少し上がる'];
  const dn = an.density > 0.45 ? ['ぎっしり', '体力・攻撃が少し上がる'] : ['すかすか', '身軽'];
  $('#breakdown').innerHTML = [
    `<li><span class="k">色</span><span><span class="chip" style="--sw:${an.domHex}"></span>${an.domName}が中心。全体として<b>${lab}</b>寄り</span></li>`,
    `<li><span class="k">線</span><span>平均 ${an.avgW.toFixed(1)}px（${tw[0]}）。${tw[1]}</span></li>`,
    `<li><span class="k">大きさ</span><span>紙の${Math.round(an.sRaw * 100)}%（${sz[0]}）。${sz[1]}</span></li>`,
    `<li><span class="k">形</span><span>トゲトゲ度 ${Math.round(an.kN * 100)}%（${kk[0]}）。${kk[1]}</span></li>`,
    `<li><span class="k">塗り</span><span>密度 ${Math.round(an.density * 100)}%（${dn[0]}）。${dn[1]}</span></li>`,
    `<li><span class="k">攻撃</span><span><b>${ATK_TYPES[p.atkType].name}</b>：${ATK_TYPES[p.atkType].desc}</span></li>`
  ].join('');
  $('#btnGo').disabled = !an.enough;
  $('#goHint').textContent = an.enough ? '描き足すと能力が変わります' : 'もう少し描きこむと次へ進めます';
}
function sampleDoodle() {
  const col = PALETTE[Math.floor(Math.random() * 10)][1];
  const size = 4 + Math.floor(Math.random() * 20);
  const cx = 200, cy = 215, R = rand(70, 135), sq = rand(0.75, 1.2), spiky = Math.random() < 0.5;
  const Rx = Math.min(R * sq, 140), Ry = Math.min(R, 140);
  const pts = []; const n = 48;
  for (let i = 0; i <= n; i++) {
    const a = i / n * TAU; const k = 1 + (spiky && i % 4 === 0 && i !== n ? 0.28 : 0) + (Math.random() - 0.5) * 0.04;
    pts.push({ x: cx + Math.cos(a) * Rx * k, y: cy + Math.sin(a) * Ry * k });
  }
  pts[n] = { ...pts[0] };
  D.strokes = [{ color: col, size, eraser: false, pts }];
  const ey = cy - Ry * 0.18, es = Math.max(10, Ry * 0.16);
  D.strokes.push({ color: '#24252b', size: es, eraser: false, pts: [{ x: cx + Rx * 0.08, y: ey }] });
  D.strokes.push({ color: '#24252b', size: es, eraser: false, pts: [{ x: cx + Rx * 0.5, y: ey }] });
  const m = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * 0.15 + i / 8 * Math.PI * 0.7; m.push({ x: cx + Rx * 0.29 + Math.cos(a) * Rx * 0.22, y: cy + Ry * 0.08 + Math.sin(a) * Ry * 0.18 }); }
  D.strokes.push({ color: '#24252b', size: 5, eraser: false, pts: m });
  redrawDrawing(); analyzeAndShow();
}
$('#btnGo').addEventListener('click', () => goDeck());
