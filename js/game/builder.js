'use strict';

/* =====================================================
   ビルダー／サポーターの操作（敵・ワナ・ペンを置く）
   ===================================================== */
const SPECIAL_FX = { dark: 'dark', reverse: 'rev', weight: 'heavy', slip: 'slip', float: 'float', seal: 'seal' }; // 特殊カード → effects のキー
const liveEnemies = () => enemies.reduce((n, e) => n + (e.dead ? 0 : 1), 0);
function boxSolid(x, y, w, h) {
  const c0 = Math.floor(x / T), c1 = Math.floor((x + w - 0.01) / T), r0 = Math.floor(y / T), r1 = Math.floor((y + h - 0.01) / T);
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (solid(c, r)) return true;
  return false;
}
const safeR = () => COOP ? SAFE_R : VS_SAFE_R; // 対戦：ビルダーはランナーの近くにも置ける
function rectNearPlayer(x, y, w, h, R = safeR()) {
  const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2;
  return dist(pcx, pcy, clamp(pcx, x, x + w), clamp(pcy, y, y + h)) < R;
}
function placementFor(id, wx, wy) {
  const card = CARD[id];
  if (SUPPORT_BLOCKS[id]) {
    // おすすめ場所の近くなら自動でぴったり合わせる。ふさがっているマスは飛ばして、置けるマスだけに置く（コストもその分だけ）
    const b = SUPPORT_BLOCKS[id], sn = snapBlock(id, wx, wy);
    const c0 = sn ? sn.c0 : Math.round(wx / T - b.w / 2), r0 = sn ? sn.r0 : Math.floor(wy / T);
    const all = []; for (let i = 0; i < b.w; i++) all.push([c0 + i, r0]);
    const cells = all.filter(([c, r]) => cellFree(c, r));
    const cost = Math.ceil(card.cost * cells.length / b.w);
    const why = !cells.length ? 'ここには置けない' : energy < cost ? 'エネルギー不足' : '';
    return { ok: !why, x: c0 * T, y: r0 * T, why, cells, all, cost, snapped: !!sn };
  }
  if (card.cat === 'support') {
    const busy = { s_shield: P.shield, s_speed: effects.boost, s_freeze: effects.freeze }[id] > 0;
    const why = usesLeft(id) <= 0 ? 'このページではもう使えない' : energy < card.cost ? 'エネルギー不足' : busy ? '発動中' : (id === 's_heart' && boxSolid(wx - 10, wy - 10, 20, 20)) ? 'ここには置けない' : '';
    return { ok: !why, x: wx, y: wy, why };
  }
  if (card.cat === 'special') {
    const why = energy < card.cost ? 'エネルギー不足' : effects[SPECIAL_FX[id]] > 0 ? '発動中' : '';
    return { ok: !why, x: wx, y: wy, why };
  }
  if (id === 'thorn') {
    const cells = thornCells(wx, wy), x = cells[0][0] * T, y = cells[0][1] * T, box = { x, y, w: T * 2, h: T * 2 };
    let why = '';
    if ((cardCd.thorn || 0) > 0) why = `あと${(cardCd.thorn / 60).toFixed(1)}秒`;
    else if (energy < card.cost) why = 'エネルギー不足';
    else if (cells.some(([c, r]) => c < 0 || c >= LW || r < 0 || r >= ROWS || tiles[idx(c, r)] !== 0)) why = 'ここには置けない';
    else if (enemies.some(e => !e.dead && overlap(e, box))) why = 'ここには置けない';
    else if (rectNearPlayer(x, y, T * 2, T * 2)) why = 'ランナーに近すぎ';
    else if (inGoalZone(x, y, T * 2, T * 2)) why = 'ゴール前には置けない';
    return { ok: !why, x, y, why, cells };
  }
  if (id === 'shadow') {
    const why = energy < card.cost ? 'エネルギー不足' : enemies.some(e => !e.dead && e.type === 'shadow') ? 'カゲぼうしは1体まで' : liveEnemies() >= MAX_EN ? 'これ以上置けない' : '';
    return { ok: !why, x: wx, y: wy, why };
  }
  if (id === 'rockfall') {
    const why = energy < card.cost ? 'エネルギー不足' : liveEnemies() >= MAX_EN ? 'これ以上置けない' : Math.abs(wx - (P.x + P.w / 2)) < 70 ? 'ランナーの真上には置けない' : inGoalZone(wx - 20, wy, 40, 16) ? 'ゴール前には置けない' : '';
    return { ok: !why, x: wx - 20, y: camY, why };
  }
  const group = SPAWNS[id];
  const d = group ? FOOT[id] : ETYPES[id];
  let x = wx - d.w / 2, y = wy - d.h / 2;
  if (d.snap) {
    const c = Math.floor(wx / T); let r = clamp(Math.floor(wy / T), 0, ROWS - 1);
    if (isFloorT(tileAt(c, r))) { while (r > 0 && isFloorT(tileAt(c, r - 1))) r--; }
    else { while (r < ROWS && !isFloorT(tileAt(c, r))) r++; }
    if (r >= ROWS) return { ok: false, x, y, why: '下に足場がない' };
    y = r * T - d.h;
    x = id === 'spike' ? Math.round(wx / T) * T - d.w / 2 : c * T + T / 2 - d.w / 2;
  }
  const reach = d.reach || 0;
  let why = '';
  if (energy < card.cost) why = 'エネルギー不足';
  else if (liveEnemies() + (group ? group.length : 1) > MAX_EN) why = 'これ以上置けない';
  else if (group ? group.some(([t, ox, oy]) => { const e = ETYPES[t]; return boxSolid(wx + ox - e.w / 2, wy + oy - e.h / 2, e.w, e.h); }) : boxSolid(x, y, d.w, d.h)) why = 'ここには置けない';
  else if (rectNearPlayer(x - reach, y - reach, d.w + reach * 2, d.h + reach * 2)) why = 'ランナーに近すぎ';
  else if (inGoalZone(x - reach, y - reach, d.w + reach * 2, d.h + reach * 2)) why = 'ゴール前には置けない';
  return { ok: !why, x, y, why };
}
const vsHp = hp => !COOP && hp >= 2 ? Math.ceil(hp * VS_HP_MUL) : hp; // 対戦：ビルダーの敵はしぶとい
function spawnEnemy(type, x, y, defer) {
  const d = ETYPES[type];
  const toward = (P.x + P.w / 2 < x + d.w / 2) ? -1 : 1;
  const e = {
    type, x, y, w: d.w, h: d.h, vx: 0, vy: 0, hp: vsHp(d.hp), maxHp: vsHp(d.hp), dir: toward,
    spawnT: SPAWN, t: 0, flash: 0, timer: 0, aim: -Math.PI / 2, recoil: 0, onGround: false, dead: false,
    mode: '', homeX: x, homeY: y, rot: 0, cyc: 0, fuse: 180, life: 0, gy: WH, ofs: Math.random() * TAU
  };
  if (type === 'hopper') e.timer = 40;
  if (type === 'cannon') e.timer = 70;
  if (type === 'triple') e.timer = 90;
  if (type === 'thrower') e.timer = 50;
  if (type === 'slime' || type === 'slimelet') e.timer = 30;
  if (type === 'warper') e.timer = 150;
  if (type === 'rockfall') e.rxs = [0, 1, 2].map(() => x + 20 + rand(-18, 18));
  initExtraEnemy(e);
  (defer ? spawnQueue : enemies).push(e);
  return e;
}
function tryPlace(sx, sy) { tryPlaceW(bwx(sx), bwy(sy)); }
function tryPlaceW(wx, wy) {
  const card = CARD[tool];
  const pl = placementFor(tool, wx, wy);
  if (!pl.ok) { popup(wx, wy - 14, pl.why, C.bad, 15); SFX.deny(); return; }
  energy -= pl.cost != null ? pl.cost : card.cost; ST.placed++;
  if (card.cat === 'support') {
    useSupport(tool, wx, wy, pl);
    if (COOP && SUPPORT_LIMIT[tool]) { supUses[tool] = usesLeft(tool) - 1; popup(wx, wy - 40, `のこり${supUses[tool]}回`, C.builder, 16); }
    updateToolAvailability(); return;
  }
  if (card.cat === 'special') { activateSpecial(tool); updateToolAvailability(); return; }
  if (tool === 'shadow') {
    const pt = trail[Math.max(0, trail.length - 1 - 120)] || [P.x, P.y, P.facing];
    const e = spawnEnemy('shadow', pt[0], pt[1]); e.w = P.w; e.h = P.h; e.dir = pt[2];
    SFX.warp(); updateToolAvailability(); return;
  }
  if (tool === 'thorn') {
    const pen = PENS.thorn;
    for (const [c, r] of pl.cells) {
      const i = idx(c, r);
      tiles[i] = 3; paintKind[i] = pen.kind; paintHp[i] = pen.hp; paintCol[i] = 0; paintT[i] = tick; paintExp[i] = tick + pen.life * 60;
    }
    cardCd.thorn = THORN_CD; mmDirty = true;
    SFX.place(); burst(pl.x + T, pl.y + T, '#e0313f', 8, 2.5);
    updateToolAvailability(); return;
  }
  if (SPAWNS[tool]) for (const [t, ox, oy] of SPAWNS[tool]) { const e = ETYPES[t]; spawnEnemy(t, wx + ox - e.w / 2, wy + oy - e.h / 2); }
  else spawnEnemy(tool, pl.x, pl.y);
  SFX.place();
  burst(wx, wy, C.builder, 8, 2.5);
  updateToolAvailability();
}
function cellFree(c, r) {
  if (c < 0 || c >= LW || r < 0 || r >= ROWS || (tiles[idx(c, r)] !== 0 && tiles[idx(c, r)] !== 6)) return false;
  const box = { x: c * T, y: r * T, w: T, h: T };
  return !overlap(P, box) && !enemies.some(e => !e.dead && overlap(e, box));
}
function snapBlock(id, wx, wy) {
  const b = SUPPORT_BLOCKS[id], cx = wx / T, cy = wy / T;
  let best = null, bd = 1e9;
  for (const gd of guides) {
    if ((gd.kind === 'pad') !== (id === 's_bounce') || (gd.until && tick > gd.until)) continue;
    let empty = 0; for (let c = gd.c0; c <= gd.c1; c++) if (cellFree(c, gd.row)) empty++;
    if (!empty) continue;
    const dc = cx < gd.c0 ? gd.c0 - cx : cx > gd.c1 + 1 ? cx - gd.c1 - 1 : 0, dr = Math.abs(cy - (gd.row + 0.5));
    if (dc <= 2.5 && dr <= 3 && dc + dr < bd) { bd = dc + dr; best = gd; }
  }
  if (!best) return null;
  let c0 = best.c0, score = -1e9;
  for (let s0 = best.c0; s0 <= Math.max(best.c0, best.c1 - b.w + 1); s0++) {
    let empty = 0; for (let i = 0; i < b.w; i++) { const c = s0 + i; if (c <= best.c1 && cellFree(c, best.row)) empty++; }
    const sc = empty * 10 - Math.abs(s0 + b.w / 2 - cx);
    if (sc > score) { score = sc; c0 = s0; }
  }
  return { c0, r0: best.row };
}
function drawGuides() {
  if (!COOP || !guides.length) return;
  const sel = SUPPORT_BLOCKS[tool] ? tool : null;
  g.save(); g.lineWidth = 2;
  let labeled = false;
  for (const gd of guides) {
    if ((gd.until && tick > gd.until) || gd.c1 * T < P.x - 40 || gd.c1 * T < viewX - 40 || gd.c0 * T > viewX + VWW + 40) continue;
    const cells = []; for (let c = gd.c0; c <= gd.c1; c++) { const t = tiles[idx(c, gd.row)]; if (t === 0 || t === 6) cells.push(c); }
    if (!cells.length) continue;
    const active = sel && ((gd.kind === 'pad') === (sel === 's_bounce'));
    g.setLineDash([4, 4]); g.strokeStyle = active ? 'rgba(42,157,92,0.85)' : 'rgba(42,157,92,0.3)';
    for (const c of cells) g.strokeRect(c * T + 2, gd.row * T + 2, T - 4, T - 4);
    g.setLineDash([]);
    if (!labeled && gd.c0 * T > P.x) {
      labeled = true;
      ghostLabel(gd.kind === 'pad' ? 'ここにジャンプ台！' : '橋をかけよう！', (gd.c0 + gd.c1 + 1) / 2 * T, gd.row * T - 8, true);
    }
  }
  g.restore();
}
function useSupport(id, wx, wy, pl) {
  if (SUPPORT_BLOCKS[id]) {
    const b = SUPPORT_BLOCKS[id];
    for (const [c, r] of pl.cells) {
      const i = idx(c, r);
      tiles[i] = b.plank ? 4 : 3; paintKind[i] = b.plank ? 9 : b.kind; paintHp[i] = 1; paintCol[i] = 7;
      paintT[i] = tick; paintExp[i] = tick + b.life * 60; ST.painted++;
    }
    SFX.place(); burst(pl.x + b.w * T / 2, pl.y + T / 2, '#2a9d5c', 6, 2);
    return;
  }
  SFX.special();
  if (id === 's_heart') { items.push({ type: 'heart', x: wx, y: wy, taken: false }); burst(wx, wy, '#f27eb1', 8, 2); }
  if (id === 's_shield') { P.shield = 240; banner = { text: 'バリア！', life: 40, color: C.builder }; }
  if (id === 's_speed') { effects.boost = 300; banner = { text: 'スピードアップ！', life: 40, color: C.builder }; }
  if (id === 's_freeze') { effects.freeze = 180; banner = { text: 'ストップ！', life: 40, color: C.builder }; }
  if (id === 's_bomb') {
    SFX.boom(); const R = 90;
    for (const e of enemies) if (!e.dead && circleRect(wx, wy, R, e)) { if (e.type === 'boss') { e.stun = isEX() ? 55 : 90; popup(e.x + e.w / 2, e.y - 24, 'ピヨピヨ…', C.builder, 20); } else if (e.type === 'bomb') { e.dead = true; popup(e.x + e.w / 2, e.y - 6, '解除！', C.ink, 20); } else damageEnemy(e, 4, 0); }
    for (const b of bullets) if (dist(wx, wy, b.x, b.y) < R) b.dead = true;
    for (let c = Math.floor((wx - R) / T); c <= Math.floor((wx + R) / T); c++) for (let r = Math.floor((wy - R) / T); r <= Math.floor((wy + R) / T); r++) {
      if (c < 0 || c >= LW || r < 0 || r >= ROWS) continue;
      const i = idx(c, r);
      if ((tiles[i] === 3 || tiles[i] === 5) && paintCol[i] !== 7 && dist(wx, wy, c * T + T / 2, r * T + T / 2) <= R) { tiles[i] = 0; burst(c * T + T / 2, r * T + T / 2, INKS[paintCol[i] % INKS.length], 2, 2); }
    }
    particles.push({ x: wx, y: wy, vx: 0, vy: 0, life: 22, max: 22, r: R, color: '#33b06a', g: 0, ring: true });
    burst(wx, wy, '#33b06a', 16, 3.5); popup(wx, wy - 20, 'おたすけ！', '#2a9d5c', 22);
  }
}

// 対戦：いま残っているペン系のマス（ペン・ネバネバ・消しゴム跡。トゲのワナは数えない）
const penCapOn = () => !COOP && !dbg('noLimit');
function countPenCells() {
  let n = 0;
  for (let i = 0; i < tiles.length; i++) { const t = tiles[i]; if ((t === 3 && paintKind[i] !== 2) || t === 5 || t === 6) n++; }
  return n;
}
function cellBlocked(c, r, id) {
  if (c < 0 || c >= LW || r < 0 || r >= ROWS) return 'x';
  const pen = PENS[id], t = tiles[idx(c, r)];
  if (pen.erase ? !(t === 1 || t === 2 || t === 4) : t !== 0) return 'x';
  const cx = c * T + T / 2, cy = r * T + T / 2;
  if (COOP && pen.support) { if (overlap(P, { x: c * T, y: r * T, w: T, h: T })) return 'x'; }
  else if (dist(cx, cy, P.x + P.w / 2, P.y + P.h / 2) < safeR()) return 'x';
  if (inGoalZone(c * T, r * T, T, T)) return 'x';
  if (pen.erase && inStartZone(c, r)) return 'x';
  if (pen.solid) for (const e of enemies) if (!e.dead && cx + T / 2 > e.x && cx - T / 2 < e.x + e.w && cy + T / 2 > e.y && cy - T / 2 < e.y + e.h) return 'x';
  if (penCapOn() && penLive >= VS_PEN_MAX) return 'max';
  if (energy < pen.cost) return 'ink';
  return '';
}
function paintCell(c, r) {
  const id = tool, pen = PENS[id];
  const why = cellBlocked(c, r, id);
  if (why === 'ink') { if (tick - inkWarnT > 50) { popup(c * T + T / 2, r * T - 4, 'エネルギー不足', C.bad, 15); SFX.deny(); inkWarnT = tick; } return; }
  if (why === 'max') { if (tick - inkWarnT > 50) { popup(c * T + T / 2, r * T - 4, `ペンは${VS_PEN_MAX}マスまで`, C.bad, 15); SFX.deny(); inkWarnT = tick; } return; }
  if (why) return;
  const i = idx(c, r);
  energy -= pen.cost; ST.painted++; penLive++;
  paintT[i] = tick; paintExp[i] = tick + pen.life * 60;
  if (pen.plank) { tiles[i] = 4; paintKind[i] = 9; SFX.paint(); return; }
  if (pen.erase) {
    origTile[i] = tiles[i]; tiles[i] = 6; SFX.erase();
    particles.push({ x: c * T + T / 2, y: r * T + T / 2, vx: rand(-1, 1), vy: rand(-2, -0.5), life: 22, max: 22, r: 2.5, color: '#f7a8c4', g: 0.15 });
    return;
  }
  tiles[i] = pen.solid ? 3 : 5; paintKind[i] = pen.kind; paintHp[i] = pen.hp; paintCol[i] = Math.max(0, paintInk);
  SFX.paint();
}
function paintAt(wx, wy) {
  const c = Math.floor(wx / T), r = Math.floor(wy / T);
  paintCell(c, r);
  if (PENS[tool].thick) { paintCell(c + 1, r); paintCell(c - 1, r); paintCell(c, r + 1); paintCell(c, r - 1); }
}
function paintLine(a, b) {
  if (!a) { paintAt(b.x, b.y); return; }
  const n = Math.max(1, Math.ceil(dist(a.x, a.y, b.x, b.y) / (T * 0.4)));
  for (let i = 1; i <= n; i++) paintAt(lerp(a.x, b.x, i / n), lerp(a.y, b.y, i / n));
}
