'use strict';

/* =====================================================
   協力モードのCPUジャマー（消しゴム大王）とボス戦
   ===================================================== */
// 協力モードのCPUジャマー：一定間隔でランナーの先に敵やワナを置く
function cpuX(ahead) {
  // 協力モードでは、いま見えているエリアの中でランナーより先に置く
  if (SPLIT !== 's') return P.x + rand(ahead, ahead + 420);
  const s0 = camSlide.to, lo = Math.max(P.x + ahead, s0 + 40), hi = s0 + VWW - 40;
  return lo < hi ? rand(lo, hi) : null;
}
function cpuUpdate() {
  const L = CPU_LV[COOP_LV], SP = pageDef(storyIdx);
  cpu.energy = Math.min(EMAX, cpu.energy + L.regen * SP.cpu);
  if (--cpu.timer > 0) return;
  cpu.timer = Math.round((L.every + rand(-20, 20)) / SP.cpu);
  if (SP.erase && Math.random() < 0.2 && cpu.energy >= 25 && cpuErase()) return;
  if (storyIdx >= 1 && L.special && Math.random() < L.special) {
    const id = ['dark', 'reverse', 'weight'][Math.floor(Math.random() * 3)], key = { dark: 'dark', reverse: 'rev', weight: 'heavy' }[id];
    if (cpu.energy >= CARD[id].cost && !(effects[key] > 0)) { cpu.energy -= CARD[id].cost; activateSpecial(id); return; }
  }
  if (L.wall && Math.random() < L.wall && cpu.energy >= 12 && cpuWall()) return;
  const pool = L.pool.slice(0, Math.max(4, Math.ceil(L.pool.length * SP.pool)));
  const id = pool[Math.floor(Math.random() * pool.length)], card = CARD[id];
  if (cpu.energy < card.cost) return;
  for (let k = 0; k < 6; k++) {
    const wx = cpuX(150), wy = rand(210, 470);
    if (wx == null) continue;
    const save = energy; energy = cpu.energy;
    const pl = placementFor(id, wx, wy);
    energy = save;
    if (!pl.ok) continue;
    cpu.energy -= card.cost;
    if (SPAWNS[id]) for (const [t, ox, oy] of SPAWNS[id]) { const e = ETYPES[t]; spawnEnemy(t, wx + ox - e.w / 2, wy + oy - e.h / 2); }
    else spawnEnemy(id, pl.x, pl.y);
    popup(wx, (SPAWNS[id] ? wy : pl.y) - 20, '大王', C.bad, 14);
    return;
  }
}
// 大王の「地面けし」：ランナーの先の地面を2列ぶん消して穴をあける（12秒で戻る）
function cpuErase() {
  const ex = cpuX(220); if (ex == null) return false;
  const c = Math.floor(ex / T);
  let r = 4; while (r < ROWS && !solid(c, r)) r++;
  if (r >= ROWS || tileAt(c, r) !== 1 || tileAt(c + 1, r) !== 1 || solid(c, r - 1) || solid(c + 1, r - 1)) return false;
  if (inGoalZone(c * T, r * T, 2 * T, T) || dist(c * T + T, r * T, P.x + P.w / 2, P.y + P.h) < SAFE_R) return false;
  if (guides.some(gd => c + 1 >= gd.c0 - 2 && c <= gd.c1 + 2) || gates.some(gt => Math.abs(gt.c - c) < 4)) return false;
  for (let cc = c; cc <= c + 1; cc++) for (let rr = r; rr < ROWS; rr++) { const i = idx(cc, rr); if (tiles[i] === 1) { origTile[i] = 1; tiles[i] = 6; paintT[i] = tick; paintExp[i] = tick + 12 * 60; } }
  guides.push({ kind: 'bridge', row: r, c0: c, c1: c + 1, until: tick + 12 * 60 });
  cpu.energy -= 25; popup(c * T + T, r * T - 24, 'ケシケシ！', C.bad, 18); SFX.erase();
  return true;
}
// ---- ボス戦 ----
function spawnBoss() {
  const B = bossInfo; B.spawned = true;
  const e = spawnEnemy('boss', B.min + (B.max - B.min) * 0.6, B.h * T - ETYPES.boss.h - 1);
  e.spawnT = 70; e.dir = -1; e.timer = 60; e.stun = 0;
  banner = { text: isEX() ? '真・消しゴム大王があらわれた！' : '消しゴム大王があらわれた！', life: 100, color: C.bad };
  SFX.tone(150, 70, 0.8, 'sawtooth', 0.06); SFX.noise(0.5, 0.1, 300);
  BGM.play('cave', { tr: 1, bpm: 165, restart: true });
}
function bossSmash(e) {
  const fx = e.dir > 0 ? e.x + e.w + 4 : e.x - 4, c = Math.floor(fx / T); let n = 0;
  for (let r = Math.floor(e.y / T); r <= Math.floor((e.y + e.h - 1) / T); r++) {
    if (c < 0 || c >= LW || r < 0 || r >= ROWS) continue;
    const i = idx(c, r);
    if (tiles[i] === 3 || (tiles[i] === 4 && paintKind[i] === 9)) { tiles[i] = 0; n++; burst(c * T + T / 2, r * T + T / 2, '#8fd8a8', 3, 2); }
  }
  if (n) { popup(fx, e.y - 10, 'バキッ', C.bad, 18); SFX.crumble(); }
}
function triggerBossSwitch() {
  state = 'cutscene'; bossCut = { t: 0, col: bossInfo.b1 - 1, fell: false, done: false };
  P.vx = 0; P.atkT = 0; stopPaint(); releaseGate();
  for (const e of enemies) if (!e.dead && e.type !== 'boss') { e.dead = true; burst(e.x + e.w / 2, e.y + e.h / 2, ETYPES[e.type].color, 8, 2); }
  bullets = []; BGM.stop(0.2); SFX.clank(); SFX.thud();
  banner = { text: 'ポチッ！', life: 50, color: C.runner };
}
function stepBossCut() {
  const B = bossInfo, bc = bossCut; bc.t++;
  P.vx = 0; P.vy = Math.min(P.vy + GRAV, 13); moveEntity(P); P.squash = lerp(P.squash, 1, 0.2);
  if (bc.t > 24 && bc.t % 3 === 0 && bc.col >= B.b0) {
    const i = idx(bc.col, B.h);
    if (tiles[i] === 9) { tiles[i] = 0; burst(bc.col * T + T / 2, B.h * T + 6, '#b07a4f', 3, 2); if (bc.col % 3 === 0) SFX.crumble(); }
    bc.col--;
  }
  const boss = enemies.find(e => e.type === 'boss' && !e.dead);
  if (boss) {
    boss.vy = Math.min(boss.vy + GRAV, 14); boss.vx = 0; boss.t++; boss.stun = 0;
    moveEntity(boss);
    if (!bc.fell && boss.vy > 2 && !boss.onGround) { bc.fell = true; popup(boss.x + boss.w / 2, boss.y - 20, 'わあああ〜っ！', C.bad, 24); SFX.tone(900, 120, 1.4, 'triangle', 0.06); }
  }
  if (!bc.done && bc.col < B.b0 && (!boss || boss.y > WH + 40)) { bc.done = true; if (boss) boss.dead = true; endRound('runner', '消しゴム大王をやっつけた！'); }
}
function drawBossArena() {
  if (!bossInfo) return;
  const B = bossInfo;
  if (B.max + 300 < viewX || B.min - 300 > viewX + VWW) return;
  g.save();
  g.fillStyle = 'rgba(244,228,234,0.95)'; g.strokeStyle = 'rgba(36,37,43,0.25)'; g.lineWidth = 1.5;
  for (let x = B.min; x < B.max; x += 24) { const y = WH - 12 + Math.sin(x * 0.07 + tick * 0.05) * 4; g.beginPath(); g.ellipse(x + 12, y, 15, 9, (x % 3) * 0.3, 0, TAU); g.fill(); g.stroke(); }
  const x = B.sx, y = B.sy, pressed = !!bossCut;
  rrect(g, x - 24, y - 8, 48, 8, 3); g.fillStyle = '#6b7080'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#8b90a0'; g.fillRect(x - 6, y - 44, 12, 36); g.strokeRect(x - 6, y - 44, 12, 36);
  g.beginPath(); g.arc(x, y - 44 + (pressed ? 5 : 0), 18, Math.PI, 0); g.closePath(); g.fillStyle = pressed ? '#33b06a' : '#e5383b'; g.fill(); g.stroke();
  g.font = `16px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineWidth = 4; g.strokeStyle = '#fff';
  const label = pressed ? 'ポチッ！' : 'さわってクリア！';
  const by = y - 76 + (pressed ? 0 : Math.sin(tick * 0.15) * 4);
  g.strokeText(label, x, by); g.fillStyle = pressed ? '#2a9d5c' : C.bad; g.fillText(label, x, by);
  if (!pressed) { g.beginPath(); g.moveTo(x - 7, by + 6); g.lineTo(x + 7, by + 6); g.lineTo(x, by + 14); g.closePath(); g.fill(); }
  g.restore();
}
function cpuWall() {
  const wx = cpuX(200); if (wx == null) return false;
  const c = Math.floor(wx / T);
  let r = 4; while (r < ROWS && !solid(c, r)) r++;
  if (r >= ROWS || r < 7) return false;
  const rows = [r - 1, r - 2, r - 3];
  if (rows.some(rr => tiles[idx(c, rr)] !== 0) || inGoalZone(c * T, (r - 3) * T, T, T * 3) || dist(c * T + T / 2, (r - 2) * T, P.x + P.w / 2, P.y + P.h / 2) < SAFE_R) return false;
  for (const rr of rows) { const i = idx(c, rr); tiles[i] = 3; paintKind[i] = 0; paintHp[i] = 1; paintCol[i] = 1; paintT[i] = tick; paintExp[i] = tick + 15 * 60; }
  cpu.energy -= 12; mmDirty = true; popup(c * T + T / 2, (r - 4) * T, '大王', C.bad, 14);
  return true;
}
function activateSpecial(id) {
  SFX.special();
  if (id === 'dark') { effects.dark = 360; banner = { text: '暗闇！', life: 45, color: C.builder }; }
  if (id === 'reverse') { effects.rev = 240; banner = { text: 'さかさま！', life: 45, color: C.builder }; }
  if (id === 'weight') { effects.heavy = 300; banner = { text: 'おもり！', life: 45, color: C.builder }; }
  if (id === 'slip') { effects.slip = 300; banner = { text: 'ツルツル！', life: 45, color: C.builder }; }
  if (id === 'float') { effects.float = 300; banner = { text: 'ふわふわ！', life: 45, color: C.builder }; }
  if (id === 'seal') { effects.seal = 180; banner = { text: 'ふういん！', life: 45, color: C.builder }; }
}
