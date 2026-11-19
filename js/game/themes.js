'use strict';

/* =====================================================
   ステージの特徴（背景ごとのしかけ）。協力ストーリーだけ
   - 草原：そよ風（ときどき強い風でランナーが流される）
   - 森：手前の木の葉が視界をさえぎる
   - 谷：落石
   - 洞くつ：暗闇と低い天井（level.js）。こおりの洞くつは床がつるつる
   - 空：穴が多く、穴の上を動く足場が行き来する
   - 城：回る炎の棒（ファイアバー）
   - 雪山：雪で足もとが滑る・雪が降る
   - 嵐：雷が落ちてくる（地面けしは story.js の erase）
   ===================================================== */
const THEME = {
  meadow: { name: 'そよ風', desc: 'ときどき強い風がふいて、ランナーが横に流される' },
  forest: { name: '木のかげ', desc: '手前の木の葉で先が見えにくい。ランナーやP2のカーソルが近づくと葉っぱが透ける' },
  canyon: { name: '落石', desc: 'ときどき上から岩が落ちてくる。赤い点線と影が見えたら、そこからはなれよう' },
  cave: { name: 'まっくらな洞くつ', desc: '暗闇と低い天井。P2のカーソルのまわりだけが明るい' },
  ice: { name: 'こおりの床', desc: '地面がこおっていて、つるつる滑る。止まりたいところの少し手前で手をはなそう' },
  sky: { name: '動く足場', desc: '穴の多い空の上。穴の上を行き来する足場に乗れば、橋がなくても渡れる' },
  castle: { name: 'ファイアバー', desc: '城の中には、ぐるぐる回る炎の棒がしかけてある' },
  mountain: { name: '雪山', desc: '雪が積もっていて足もとが滑る。雪も降っている' },
  storm: { name: 'かみなり', desc: '空から雷が落ちてくる。地面が光ったらすぐによけよう' }
};
const themeOf = st => !st ? null : st.ice ? 'ice' : THEME[st.bg] ? st.bg : null;
const curTheme = () => COOP ? themeOf(pageDef(storyIdx)) : null;
let movers = [], foliage = [], envT = 0;

/* ---------- ステージを作るとき（ホストもゲストも同じ乱数で作る） ---------- */
function themeGen(rng) {
  foliage = [];
  for (const m of movers) { // 動く足場：穴の上を左右に行き来する（位置は時間だけで決まるので、ゲストにも同じに見える）
    m.w = 3 * T; m.y = (m.row + 1) * T; m.x0 = m.c0 * T; m.x1 = (m.c0 + m.pw) * T - m.w; m.x = m.x0; m.spd = 1.15; m.ph = Math.floor(rng() * 400);
  }
  if (curTheme() === 'forest') { // 手前の木の葉のかたまり
    for (let x = 560 + rng() * 200; x < WW - 300; x += 440 + rng() * 280) { // まばらに
      const c = Math.floor(x / T); let r = 0; while (r < ROWS - 1 && !solid(c, r)) r++;
      const gy = r * T, rad = 58 + rng() * 32;
      const blobs = []; for (let k = 0; k < 5; k++) blobs.push([(rng() - 0.5) * rad * 1.4, (rng() - 0.5) * rad * 0.8, rad * (0.45 + rng() * 0.3)]);
      foliage.push({ x, y: gy - 80 - rng() * 100, rad, blobs }); // ジャンプの高さあたりにかかる
    }
  }
}
// ステージが始まるとき（ホストだけ。敵はゲストに送られる）
function themeStart() {
  envT = 300;
  if (curTheme() !== 'castle' || NET.role === 'guest') return;
  // ファイアバー：道のとちゅうに、地面から少し上に置く
  const n = 4 + Math.floor(storyIdx / 5);
  for (let k = 1; k <= n; k++) {
    const x = WW * (0.12 + 0.76 * k / (n + 1)), c = Math.floor(x / T);
    let r = 0; while (r < ROWS - 1 && !solid(c, r)) r++;
    if (r >= ROWS - 1 || inGoalZone(x - 40, r * T - 120, 80, 120) || (bossInfo && x > bossInfo.arenaStart - 100)) continue;
    const e = spawnEnemy('firebar', c * T + T / 2 - 8, r * T - 70); e.spawnT = 0; e.env = true;
  }
}

/* ---------- 毎フレーム（ホスト） ---------- */
// 動く足場の位置は時間（tick）だけで決まる（ゲストも同じ計算で描ける）
function moverPos(m) { const d = m.x1 - m.x0; if (d <= 0) return m.x0; const t = ((tick + m.ph) * m.spd) % (2 * d); return m.x0 + (t < d ? t : 2 * d - t); }
function updateMovers() {
  for (const m of movers) {
    const nx = moverPos(m), dx = nx - m.x;
    if (dx && P && P.onMover === m) P.x += dx; // 乗っているランナーもいっしょに動く
    m.x = nx;
  }
}
function updateTheme() {
  if (!COOP || state !== 'play' || NET.role === 'guest') return;
  const th = curTheme(); if (!th) return;
  const boss = bossInfo && P.x > bossInfo.arenaStart - 200; // ボス戦のあいだは、しかけはお休み
  if (th === 'meadow') {
    if (effects.gust > 0) P.wind += (effects.gustDir || 1) * 1.5;
    else if (--envT <= 0 && !boss) { effects.gust = 170; effects.gustDir = Math.random() < 0.6 ? -1 : 1; envT = 360 + Math.random() * 300; popup(P.x + P.w / 2, P.y - 30, effects.gustDir < 0 ? '← 強い風！' : '強い風！ →', '#3e8fd6', 20); }
  } else if (th === 'canyon') {
    if (--envT <= 0 && !boss) { envT = 300 + Math.random() * 180 - storyIdx * 6; const x = cpuX(120); if (x != null && !inGoalZone(x - 20, camY, 40, 16)) { const e = spawnEnemy('rockfall', x - 20, camY); e.env = true; } }
  } else if (th === 'storm') {
    if (--envT <= 0 && !boss) { // かみなり：少し光ってから落ちる
      envT = 240 + Math.random() * 180 - storyIdx * 4;
      const x = P.x + P.w / 2 + (Math.random() < 0.7 ? rand(-40, 260) : rand(-200, 400)), c = Math.floor(x / T);
      let r = Math.max(0, Math.floor(camY / T)); while (r < ROWS && !solid(c, r)) r++;
      bullets.push({ kind: 'bolt', x, y: camY, gy: Math.min(r * T, WH), vx: 0, vy: 0, r: 0, life: 75, dmg: 20, dead: false });
    }
  }
}
// かみなりの弾（enemies.js の updateBullets から）。光る→落ちる
function updateBolt(b) {
  b.life--;
  if (b.life === 18) { SFX.zap(); shake = Math.max(shake, 4); burst(b.x, b.gy - 4, '#ffd23f', 10, 3); }
  if (b.life <= 18 && b.life > 10 && state === 'play' && P.inv <= 0 && overlap(P, { x: b.x - 14, y: b.y, w: 28, h: b.gy - b.y })) hurt(b.dmg, b.x, 'ビリッ!');
  if (b.life <= 0) b.dead = true;
}
// 足もとが滑るか（0 = ふつう / 1 = 雪 / 2 = こおり）。自然の地面のときだけ
function groundSlide(p) {
  const th = curTheme(); if (th !== 'mountain' && th !== 'ice') return 0;
  const r = Math.floor((p.y + p.h + 1) / T);
  for (let c = Math.floor((p.x + 1) / T); c <= Math.floor((p.x + p.w - 1) / T); c++) if (tileAt(c, r) === 1) return th === 'ice' ? 2 : 1;
  return 0;
}

/* ---------- 描画 ---------- */
function drawThemeBack() {
  const th = curTheme();
  if (th === 'mountain' || th === 'ice') { // 滑る地面：上に雪（こおり）をのせて見せる
    g.save(); g.fillStyle = th === 'ice' ? '#bfe6ff' : '#ffffff'; g.strokeStyle = th === 'ice' ? '#6fb3e0' : '#b9c6d8'; g.lineWidth = 1.5;
    const c0 = Math.max(0, Math.floor(viewX / T) - 1), c1 = Math.min(LW - 1, Math.ceil((viewX + VWW) / T) + 1), r0 = Math.max(1, Math.floor(viewY / T)), r1 = Math.min(ROWS - 1, Math.ceil((viewY + VWH) / T));
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (tileAt(c, r) === 1 && !solid(c, r - 1)) { rrect(g, c * T - 1, r * T - 4, T + 2, 7, 3); g.fill(); }
    g.restore();
  }
  for (const m of movers) {
    if (NET.role === 'guest') m.x = moverPos(m);
    if (m.x + m.w < viewX - 100 || m.x > viewX + VWW + 100) continue;
    g.save();
    g.strokeStyle = 'rgba(62,143,214,0.35)'; g.setLineDash([4, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(m.x0 + 6, m.y + 6); g.lineTo(m.x1 + m.w - 6, m.y + 6); g.stroke(); g.setLineDash([]);
    rrect(g, m.x, m.y, m.w, 12, 5); g.fillStyle = '#eef6ff'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#9ec9ef'; for (let k = 8; k < m.w - 6; k += 14) { g.beginPath(); g.arc(m.x + k, m.y + 13, 5, 0, Math.PI); g.fill(); }
    g.restore();
  }
}
function drawThemeFront() {
  const th = curTheme(); if (!th) return;
  if (th === 'forest') {
    for (const f of foliage) {
      if (f.x + f.rad * 2 < viewX || f.x - f.rad * 2 > viewX + VWW) continue;
      // ランナーやP2のカーソルが近いほど透ける（遠くの葉っぱだけが視界をじゃまする）
      const near = (x, y) => clamp((Math.hypot((x - f.x) / 1.3, y - f.y) - f.rad * 0.5) / (f.rad * 1.6), 0, 1);
      let k = P ? near(P.x + P.w / 2, P.y + P.h / 2) : 1;
      if (hover.on) k = Math.min(k, near(bwx(hover.sx), bwy(hover.sy)));
      g.save(); g.globalAlpha = 0.2 + 0.45 * k;
      g.beginPath(); for (const [dx, dy, r] of f.blobs) { g.moveTo(f.x + dx + r, f.y + dy); g.arc(f.x + dx, f.y + dy, r, 0, TAU); } g.fillStyle = '#3f8a4c'; g.fill(); // 重なっても濃くならないよう1回でぬる
      g.beginPath(); for (const [dx, dy, r] of f.blobs) { g.moveTo(f.x + dx - r * 0.25 + r * 0.5, f.y + dy - r * 0.25); g.arc(f.x + dx - r * 0.25, f.y + dy - r * 0.25, r * 0.5, 0, TAU); } g.fillStyle = '#5aa865'; g.fill();
      g.strokeStyle = 'rgba(30,70,38,0.6)'; g.lineWidth = 2; for (const [dx, dy, r] of f.blobs) { g.beginPath(); g.arc(f.x + dx, f.y + dy, r, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
      g.restore();
    }
  } else if (th === 'mountain' || th === 'ice') {
    g.save(); g.fillStyle = th === 'ice' ? 'rgba(220,240,255,0.7)' : 'rgba(255,255,255,0.9)';
    const n = th === 'ice' ? 30 : 70;
    for (let i = 0; i < n; i++) {
      const sp = 0.6 + (i % 4) * 0.25, x = viewX + ((i * 137.5 + tick * 0.4 * (1 + i % 3) + Math.sin((tick + i * 50) / 40) * 20) % VWW + VWW) % VWW, y = viewY + ((i * 91.7 + tick * sp) % VWH);
      g.beginPath(); g.arc(x, y, 1.5 + (i % 3), 0, TAU); g.fill();
    }
    g.restore();
  } else if (th === 'meadow' && effects.gust > 0) {
    g.save(); g.strokeStyle = 'rgba(62,143,214,0.45)'; g.lineWidth = 2;
    const dir = effects.gustDir || 1;
    for (let i = 0; i < 18; i++) {
      const x = viewX + (((i * 173 + tick * 9 * dir) % VWW) + VWW) % VWW, y = viewY + 40 + (i * 61) % (VWH - 80);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - dir * 40, y); g.stroke();
    }
    g.restore();
  }
}
// かみなりの弾の絵（world.js の drawBullets から）
function drawBolt(b) {
  if (b.life > 18) { // 前ぶれ：落ちる場所が光る
    const a = (Math.floor(b.life / 4) % 2) ? 0.65 : 0.25;
    g.save(); g.fillStyle = `rgba(255,214,63,${a * 0.5})`; g.fillRect(b.x - 14, b.y, 28, b.gy - b.y);
    g.beginPath(); g.ellipse(b.x, b.gy - 2, 18, 5, 0, 0, TAU); g.fillStyle = `rgba(255,190,0,${a})`; g.fill(); g.restore();
    return;
  }
  if (b.life <= 10) return;
  g.save(); g.strokeStyle = '#fff7b0'; g.lineWidth = 7; g.shadowColor = '#ffd23f'; g.shadowBlur = 16;
  g.beginPath(); let y = b.y, x = b.x; g.moveTo(x, y);
  while (y < b.gy) { y += 34; x = b.x + ((Math.floor(y / 34) % 2) ? 12 : -12); g.lineTo(x, Math.min(y, b.gy)); }
  g.stroke(); g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.stroke(); g.restore();
}
