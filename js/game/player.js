'use strict';

/* =====================================================
   ランナーの更新（ダメージ・攻撃・移動）
   ===================================================== */
function hurt(amount, srcX, word) {
  const p = P;
  if (p.inv > 0 || state !== 'play' || dbg('inv')) return;
  if (p.shield > 0) { if (tick - (p.guardT || 0) > 20) { popup(p.x + p.w / 2, p.y - 8, 'ガード！', C.builder, 18); p.guardT = tick; } return; }
  if (!COOP) amount = Math.round(amount * VS_DMG_MUL); // 対戦：敵やワナのダメージが少し大きい
  p.hp -= amount; p.inv = 70; p.kb = 10;
  p.vx = (p.x + p.w / 2 < srcX ? -1 : 1) * 5.5; p.vy = -6;
  shake = 9; ST.dmg += amount; SFX.hurt();
  popup(p.x + p.w / 2, p.y - 8, word ? `${word} -${amount}` : ('-' + amount), C.bad, 22);
  burst(p.x + p.w / 2, p.y + p.h / 2, CH.color, 10, 3);
  if (p.hp <= 0) { p.hp = 0; endRound('builder', 'ランナーの体力が0になった'); }
}
function damageEnemy(e, dmg, dir) {
  const d = ETYPES[e.type];
  if (d.invuln) { SFX.clank(); popup(e.x + e.w / 2, e.y - 6, 'カキン', '#6b7080', 16); return false; }
  e.hp -= dmg; e.flash = 8;
  if (dir && WALK_SPD[e.type] && e.type !== 'giant') { e.vx += dir * 3; e.vy = -3; }
  if (dir && (e.type === 'hopper' || e.type === 'charger')) { e.vx += dir * 3; e.vy = -3; }
  if (e.hp <= 0) {
    e.dead = true; ST.kills++; SFX.kill(); hitStop = 3;
    if (e.type === 'slime') {
      SFX.splat();
      for (const sgn of [-1, 1]) { const n = spawnEnemy('slimelet', e.x + e.w / 2 - 9 + sgn * 8, e.y + 6, true); n.spawnT = 14; n.vx = sgn * 2.4; n.vy = -4.5; n.timer = 24; }
    }
    burst(e.x + e.w / 2, e.y + e.h / 2, d.color === '#ffffff' ? '#c9cdd6' : d.color, 16, 3.6);
    popup(e.x + e.w / 2, e.y - 6, e.type === 'bomb' ? '解除！' : 'ポコッ', C.ink, 20);
  } else SFX.tick();
  return true;
}
function doSlash() {
  const p = P, cx = p.x + p.w / 2 + p.facing * 10, cy = p.y + p.h / 2, R = CH.slashR;
  SFX.slash();
  let hit = false;
  for (const e of enemies) {
    if (e.dead) continue;
    let box = e;
    if (e.type === 'firebar') box = { x: e.x - 4, y: e.y - 4, w: e.w + 8, h: e.h + 8 };
    if (circleRect(cx, cy, R, box)) { if (damageEnemy(e, CH.dmg, p.facing)) hit = true; }
  }
  for (const b of bullets) { if (!b.dead && !b.friendly && dist(cx, cy, b.x, b.y) < R + b.r) { b.dead = true; hit = true; burst(b.x, b.y, C.ink, 5, 2); } }
  breakCells(cx, cy, R, cx + p.facing * R * 0.6, cy - R * 0.5);
  if (hit) popup(cx + p.facing * R * 0.5, cy - R * 0.7, 'バシッ!', C.runner, 20);
}
// ペンで描かれたブロックやネバネバを壊す（攻撃方法に関係なく使う）
function breakCells(cx, cy, R, px, py) {
  let broke = 0, dented = 0;
  const c0 = Math.floor((cx - R) / T), c1 = Math.floor((cx + R) / T), r0 = Math.floor((cy - R) / T), r1 = Math.floor((cy + R) / T);
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    if (c < 0 || c >= LW || r < 0 || r >= ROWS) continue;
    const i = idx(c, r);
    if ((tiles[i] === 3 || tiles[i] === 5) && dist(cx, cy, c * T + T / 2, r * T + T / 2) <= R + 6) {
      const k = tiles[i] === 5 ? 5 : paintKind[i];
      if (tiles[i] === 3 && paintHp[i] > CH.dmg) { paintHp[i] -= CH.dmg; dented++; continue; }
      tiles[i] = 0; broke++;
      if (broke < 14) burst(c * T + T / 2, r * T + T / 2, (k === 0 || k === 8) ? INKS[paintCol[i]] : KCOL[k], 3, 2.4);
    }
  }
  if (broke) { ST.broken += broke; SFX.crumble(); popup(px, py, 'ガリッ', C.builder, 18); }
  else if (dented) { SFX.clank(); popup(px, py, 'ガキン', '#5a6072', 18); }
  return broke + dented;
}
function doAttack() {
  const p = P, t = CH.atkType || 'slash';
  if (t === 'shot') { p.atkT = 8; p.atkCd = 22; doShot(); }
  else if (t === 'dash') { p.atkCd = 34; p.dashT = 11; p.dashDir = p.facing; p.dashHit = []; p.slam = 0; p.inv = Math.max(p.inv, 14); SFX.whoosh(); dust(p.x + p.w / 2, p.y + p.h, 5); }
  else if (t === 'quake') { p.atkCd = 40; if (p.onGround) doQuake(1); else { p.slam = 1; p.vy = 12; SFX.whoosh(); } }
  else { p.atkT = 16; p.atkCd = 22; doSlash(); }
}
function doShot() { // インクショット：前に弾を撃つ
  const p = P, d = p.facing;
  bullets.push({ kind: 'ink', friendly: true, x: p.x + p.w / 2 + d * (p.w / 2 + 2), y: p.y + p.h * 0.42, vx: d * (CH.shotSpd || 8), vy: 0, r: CH.shotR || 9, hr: (CH.shotR || 9) + 8, life: 46, dmg: CH.dmg, col: CH.color || C.runner, dead: false });
  SFX.shoot();
}
function doQuake(pow) { // ドスン：地面をゆらして両側を攻撃
  const p = P, cx = p.x + p.w / 2, fy = p.y + p.h, R = (CH.quakeR || 100) * pow;
  p.quakeT = 16; p.quakeR = Math.round(R); shake = Math.max(shake, 6 + 3 * pow); SFX.thud();
  let hit = false;
  for (const e of enemies) {
    if (e.dead || e.spawnT > 0) continue;
    const ex = e.x + e.w / 2;
    if (Math.abs(ex - cx) <= R + e.w / 2 && e.y + e.h > fy - 90 && e.y < fy + 24) { if (damageEnemy(e, CH.dmg + 1, ex < cx ? -1 : 1)) hit = true; }
  }
  for (const b of bullets) if (!b.dead && !b.friendly && Math.abs(b.x - cx) <= R && Math.abs(b.y - fy) < 90) { b.dead = true; burst(b.x, b.y, C.ink, 4, 2); }
  breakCells(cx, fy - 12, R * 0.55, cx, p.y - 30);
  for (let k = -3; k <= 3; k++) dust(cx + k * R / 3.2, fy, 3);
  popup(cx, p.y - 12, hit ? 'ドスン!!' : 'ドスン!', C.runner, 22);
}
function fallOut() {
  const p = P;
  if (!dbg('inv')) { p.hp -= 25; ST.dmg += 25; } shake = 10; SFX.hurt();
  if (p.hp <= 0) { p.hp = 0; p.y = WH + 200; endRound('builder', '穴に落ちて力尽きた'); return; }
  p.x = p.safeX; p.y = p.safeY; p.vx = p.vy = 0; p.inv = 110; p.kb = 0;
  if (COOP && SPLIT === 's' && p.x < camSlide.to + 2) {
    // 画面の外（もう戻れない場所）に復帰しそうなときは、画面の左端に復帰する
    p.x = camSlide.to + 6;
    const c = Math.floor((p.x + p.w / 2) / T); let r = 0;
    while (r < ROWS - 1 && !solid(c, r)) r++;
    p.y = r * T - p.h - 2; p.safeX = p.x; p.safeY = p.y;
  }
  const c0 = Math.floor((p.x - 30) / T), c1 = Math.floor((p.x + p.w + 30) / T), r0 = Math.floor((p.y - 30) / T), r1 = Math.floor((p.y + p.h + 30) / T);
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    if (c < 0 || c >= LW || r < 0 || r >= ROWS) continue;
    const i = idx(c, r);
    if (tiles[i] === 3 || tiles[i] === 5) tiles[i] = 0;
    else if (tiles[i] === 6) tiles[i] = origTile[i];
  }
  const zone = { x: p.x - 60, y: p.y - 60, w: p.w + 120, h: p.h + 120 };
  for (const e of enemies) if (!e.dead && e.type !== 'boss' && overlap(zone, e)) { e.dead = true; burst(e.x + e.w / 2, e.y + e.h / 2, ETYPES[e.type].color, 8, 2); }
  popup(p.x + p.w / 2, p.y - 10, 'おちた! -25', C.bad, 20);
}
function updatePlayer() {
  const p = P, ch = CH;
  let L = held(K_LEFT), R = held(K_RIGHT); const J = held(K_JUMP);
  if (effects.rev > 0) { const tmp = L; L = R; R = tmp; }
  const dir = (R ? 1 : 0) - (L ? 1 : 0);
  const heavy = effects.heavy > 0;
  const maxSp = ch.runSpeed * (p.glued ? 0.4 : 1) * (heavy ? 0.75 : 1) * (effects.boost > 0 ? 1.35 : 1);
  if (p.kb > 0) p.kb--;
  else if (p.stuck > 0) { p.stuck--; p.vx = 0; }
  else {
    const acc = p.onIce ? 0.14 : (p.onGround ? 0.75 : 0.5);
    if (dir) { p.vx += dir * acc; p.facing = dir; }
    else { p.vx *= p.onIce ? 0.988 : (p.onGround ? 0.72 : 0.93); if (Math.abs(p.vx) < 0.08) p.vx = 0; }
    p.vx = clamp(p.vx, -maxSp * (p.onIce ? 1.25 : 1), maxSp * (p.onIce ? 1.25 : 1));
  }
  if (p.onGround) p.coyote = 7; else if (p.coyote > 0) p.coyote--;
  if (p.jumpBuf > 0) p.jumpBuf--;
  if (p.noCut > 0) p.noCut--;
  if (p.jumpBuf > 0 && p.coyote > 0 && !(p.stuck > 0)) {
    p.vy = -ch.jumpV * (p.glued ? 0.65 : 1) * (heavy ? 0.68 : 1) * (effects.boost > 0 ? 1.1 : 1); p.coyote = 0; p.jumpBuf = 0; p.onGround = false; p.squash = 0.78;
    SFX.jump(); dust(p.x + p.w / 2, p.y + p.h, 4);
  }
  if (!J && p.vy < -4.5 && p.noCut <= 0) p.vy = -4.5;
  if (dbg('fly')) p.vy = held(K_JUMP) ? -6 : (keys.KeyS || keys.ArrowDown) ? 6 : 0; // デバッグ：ふわふわ移動
  else p.vy = Math.min(p.vy + GRAV * (p.glued ? 0.7 : 1), p.glued ? 5 : 13);
  if (p.dashT > 0) { p.vy = 0; p.vx = p.dashDir * (CH.dashSpd || 9); } // ダッシュ突進中は高さを保ってまっすぐ進む
  if (p.slam) p.vy = Math.max(p.vy, 12); // ドスン（空中）：急降下
  const vyPrev = p.vy, prevBottom = p.y + p.h, wasGround = p.onGround;
  const baseVx = p.vx;
  p.vx = baseVx + p.wind;
  const mr = moveEntity(p);
  if (COOP && SPLIT === 's' && p.x < camSlide.to + 2) { p.x = camSlide.to + 2; if (p.vx < 0) p.vx = 0; } // 画面に見えている範囲より左へは戻れない
  p.onLift = null;
  for (const lf of lifts) {
    if (p.x + p.w > lf.x + 2 && p.x < lf.x + lf.w - 2 && p.vy >= 0 && prevBottom <= lf.y + 12 && p.y + p.h >= lf.y) { p.y = lf.y - p.h; p.vy = 0; p.onGround = true; p.onLift = lf; }
  }
  p.vx = mr.hitX ? 0 : baseVx;
  p.wind = 0;
  if (p.dashT > 0) { // ダッシュ突進：ぶつかった敵にダメージ、壁にぶつかったらペンのブロックを壊して止まる
    p.dashT--;
    const hb = { x: p.x - 6, y: p.y - 4, w: p.w + 12, h: p.h + 8 };
    p.dashHit = p.dashHit || [];
    for (const e of enemies) if (!e.dead && e.spawnT <= 0 && !p.dashHit.includes(e) && overlap(hb, e)) { p.dashHit.push(e); if (damageEnemy(e, CH.dmg, p.dashDir)) popup(e.x + e.w / 2, e.y - 8, 'ドカッ!', C.runner, 20); }
    for (const b of bullets) if (!b.dead && !b.friendly && circleRect(b.x, b.y, b.r, hb)) { b.dead = true; burst(b.x, b.y, C.ink, 5, 2); }
    if (mr.hitX) { breakCells(p.x + p.w / 2 + p.dashDir * (p.w / 2 + 10), p.y + p.h / 2, Math.max(26, p.h * 0.6), p.x + p.w / 2 + p.dashDir * 30, p.y - 10); p.dashT = 0; shake = Math.max(shake, 4); }
    if (p.dashT === 0) p.vx = p.dashDir * (CH.runSpeed || 3);
  }
  if (p.slam && p.onGround) { p.slam = 0; doQuake(1.3); }
  if (p.quakeT > 0) p.quakeT--;
  trail.push([p.x, p.y, p.facing]); if (trail.length > 200) trail.shift();
  if (p.onGround && !wasGround && vyPrev > 6) { p.squash = 1.25; dust(p.x + p.w / 2, p.y + p.h, 5); }
  p.squash = lerp(p.squash, 1, 0.2);
  if (p.onGround && Math.abs(p.vx) > 0.3) p.walk += Math.abs(p.vx) * 0.22;
  if (p.inv > 0) p.inv--;
  if (p.shield > 0) p.shield--;

  // surfaces: ice / bounce / glue / thorn
  p.onIce = false; let bounce = false, belt = false, thornX = null;
  if (p.onGround) {
    const r = Math.floor((p.y + p.h + 1) / T);
    for (let c = Math.floor((p.x + 1) / T); c <= Math.floor((p.x + p.w - 1) / T); c++) {
      if (c < 0 || c >= LW || r >= ROWS) continue;
      const i = idx(c, r);
      if (tiles[i] === 3) {
        const k = paintKind[i];
        if (k === 3) p.onIce = true; if (k === 4) bounce = true; if (k === 7) belt = true;
        if (k === 8 && paintHp[i] !== 9) { paintHp[i] = 9; paintExp[i] = tick + 22; crumbling.push(i); SFX.crumble(); }
      }
    }
  }
  if (belt) p.wind -= 2.2;
  if (bounce) {
    p.vy = -15.5; p.onGround = false; p.coyote = 0; p.squash = 0.7; p.noCut = 30;
    SFX.boing(); burst(p.x + p.w / 2, p.y + p.h, '#33b06a', 6, 2);
  }
  p.glued = false;
  {
    const c0 = Math.floor((p.x - 2) / T), c1 = Math.floor((p.x + p.w + 2) / T), r0 = Math.floor((p.y - 2) / T), r1 = Math.floor((p.y + p.h + 2) / T);
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
      if (c < 0 || c >= LW || r < 0 || r >= ROWS) continue;
      const i = idx(c, r);
      if (tiles[i] === 5 && overlap(p, { x: c * T, y: r * T, w: T, h: T })) p.glued = true;
      if ((tiles[i] === 3 && paintKind[i] === 2) || tiles[i] === 8) thornX = c * T + T / 2;
    }
  }
  if (thornX !== null) hurt(12, thornX, 'チクッ!');

  if (p.atkCd > 0) p.atkCd--;
  if (atkPressed && COOP) { if (tick - (p.noAtkT || 0) > 50) { popup(p.x + p.w / 2, p.y - 10, '攻撃できない！', C.bad, 16); p.noAtkT = tick; } }
  else if (atkPressed && p.atkCd <= 0) doAttack();
  atkPressed = false;
  if (p.atkT > 0) p.atkT--;

  if (p.onGround && tick % 6 === 0) {
    const r = Math.floor((p.y + p.h + 1) / T);
    const tl = tileAt(Math.floor((p.x + 2) / T), r), tr = tileAt(Math.floor((p.x + p.w - 2) / T), r);
    if ((tl === 1 || tl === 2) && (tr === 1 || tr === 2)) { p.safeX = p.x; p.safeY = p.y; }
  }

  for (const e of enemies) {
    if (e.dead || e.spawnT > 0 || state !== 'play' || e.mode === 'vanish' || effects.freeze > 0) continue;
    const d = ETYPES[e.type];
    if (d.touch === false && !d.stomp) continue;
    const box = e.type === 'spike' ? { x: e.x + 3, y: e.y + 5, w: e.w - 6, h: e.h - 5 } : e;
    if (!overlap(p, box)) continue;
    if (d.stomp && vyPrev > 0.5 && prevBottom <= e.y + 10) {
      damageEnemy(e, CH.dmg, 0); // ストーリーでも踏めばダメージ（大王は踏んでも効かない）
      p.vy = held(K_JUMP) ? -11 : -8; p.y = e.y - p.h; p.onGround = false;
      popup(e.x + e.w / 2, e.y - 4, e.type === 'boss' ? 'ポヨン' : 'ムギュッ', C.ink, 18);
      continue;
    }
    if (d.touch !== false) hurt(d.dmg, e.x + e.w / 2, d.word || 'ドカッ!');
  }
  for (const it of items) {
    if (it.taken) continue;
    if (circleRect(it.x, it.y, 12, p)) {
      it.taken = true;
      if (it.type === 'key') { popup(it.x, it.y - 10, 'カギをゲット！', '#b8860b', 20); burst(it.x, it.y, '#ffd23f', 14, 3); openLock(it.lock); continue; }
      const heal = Math.min(30, p.maxHp - p.hp); p.hp += heal;
      SFX.pick(); popup(it.x, it.y - 10, '+' + Math.round(heal) + ' HP', C.grass, 18); burst(it.x, it.y, '#f27eb1', 10, 2.5);
    }
  }
  if (state !== 'play') return;
  if (p.y > WH + 60) fallOut();
  if (state === 'play' && reachedGoal()) {
    endRound('runner', 'ゴールにたどり着いた');
    for (let i = 0; i < 60; i++) particles.push({ x: goalX + rand(-40, 80), y: goalY - rand(60, 200), vx: rand(-3, 3), vy: rand(-5, -1), life: 70, max: 70, r: rand(2.5, 5), color: ['#e8305f', '#2a5bd7', '#ffe24a', '#2a9d5c'][i % 4], g: 0.12 });
  }
}
