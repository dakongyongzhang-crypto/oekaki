'use strict';

/* =====================================================
   追加カードの敵・ワナの動き（updateEnemy から呼ばれる）
   ===================================================== */
// 置いた直後の初期化（spawnEnemy から呼ばれる）
function initExtraEnemy(e) {
  switch (e.type) {
    case 'frog': e.timer = 45; break;
    case 'spitter': case 'snowman': e.timer = 60; break;
    case 'ninja': e.timer = 40; break;
    case 'homing': e.timer = 90; break;
    case 'dropper': e.timer = 30; break;
    case 'mole': e.mode = 'hide'; e.pop = 0; e.hide = true; break;
    case 'sawv': e.vdir = 1; break;
    case 'spikeball': e.vx = e.dir * 2.4; e.vy = -2.4; break;
    case 'pendulum': e.ofs = 0; break;
  }
}
// 床を左右に往復（足場の端で引き返す）
function walkPatrol(e, spd) {
  e.vx = lerp(e.vx, e.dir * spd, 0.15);
  const r = moveEntity(e);
  if (r.hitX) e.dir *= -1;
  if (e.onGround) {
    const fx = e.dir > 0 ? e.x + e.w + 2 : e.x - 2;
    if (!isFloorT(tileAt(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T)))) e.dir *= -1;
  }
}
// 山なりに飛ぶ弾（だいたい狙った場所に落ちる）
function lobShot(x, y, tx, ty, kind, dmg, word) {
  const t = clamp(Math.abs(tx - x) / 4, 30, 70), gg = 0.25;
  bullets.push({ kind, x, y, vx: (tx - x) / t, vy: (ty - y) / t - 0.5 * gg * t, r: 7, life: 240, rot: 0, dmg, word, dead: false });
}
function smallBlast(cx, cy, R, dmg, word) {
  shake = Math.max(shake, 10); SFX.boom();
  for (let i = 0; i < 16; i++) { const a = rand(0, TAU), s = rand(1, 4.5); particles.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: rand(18, 34), max: 34, r: rand(2.5, 5), color: ['#ff7a3d', '#ffd166', '#3a3d48'][i % 3], g: 0.08 }); }
  particles.push({ x: cx, y: cy, vx: 0, vy: 0, life: 18, max: 18, r: R, color: '#ff7a3d', g: 0, ring: true });
  if (circleRect(cx, cy, R, P)) {
    const wasSafe = P.inv > 0 || P.shield > 0;
    hurt(dmg, cx, word);
    if (!wasSafe && state === 'play') { P.vx = (P.x + P.w / 2 < cx ? -1 : 1) * 5; P.vy = -8.5; P.kb = 14; P.noCut = 20; P.onGround = false; }
  }
}
// パンチブロックのこぶし（いまの伸び具合）
function pistonFist(e) {
  const ext = e.ext || 0;
  return { x: e.dir > 0 ? e.x + e.w : e.x - ext, y: e.y + 5, w: ext, h: 18 };
}
function pendulumBall(e) {
  const L = 80, a = e.rot || 0;
  return { x: e.x + e.w / 2 + Math.sin(a) * L, y: e.y + e.h / 2 + Math.cos(a) * L };
}
function updateExtraEnemy(e, pcx, pcy, ecx, ecy, play) {
  const toward = pcx < ecx ? -1 : 1, d = dist(pcx, pcy, ecx, ecy);
  switch (e.type) {
    case 'bat': {
      e.vx = lerp(e.vx, e.dir * 1.9, 0.1); e.x += e.vx;
      e.y = e.homeY + Math.sin(e.t * 0.06 + e.ofs) * 38;
      if ((e.dir > 0 && ecx > pcx + 260) || (e.dir < 0 && ecx < pcx - 260)) e.dir *= -1;
      break;
    }
    case 'mole': {
      moveEntity(e);
      if (e.mode === 'hide') {
        e.pop = Math.max(0, e.pop - 0.1);
        if (e.timer > 0) e.timer--;
        else if (play && Math.abs(pcx - ecx) < 120 && Math.abs(pcy - ecy) < 120) { e.mode = 'up'; e.timer = 80; dust(ecx, e.y + e.h, 5); if (nearView(ecx, ecy)) SFX.thud(); }
      } else {
        e.pop = Math.min(1, e.pop + 0.15);
        if (--e.timer <= 0) { e.mode = 'hide'; e.timer = 70; }
      }
      e.hide = e.pop < 0.6;
      break;
    }
    case 'tate': {
      const near = play && Math.abs(pcx - ecx) < 220 && Math.abs(pcy - ecy) < 90;
      if (near) { // 近づいたら盾を向けて、じりじり迫る
        e.dir = toward; e.vx = lerp(e.vx, e.dir * 0.7, 0.15);
        const fx = e.dir > 0 ? e.x + e.w + 2 : e.x - 2;
        if (e.onGround && !isFloorT(tileAt(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T)))) e.vx = 0;
        moveEntity(e);
      } else walkPatrol(e, 0.9);
      break;
    }
    case 'frog': {
      e.vy = Math.min(e.vy + GRAV, 12);
      if (e.onGround) {
        e.vx *= 0.6;
        if (--e.timer <= 0) { e.vy = -11.5; e.vx = toward * 3.2; e.timer = 70; e.onGround = false; if (nearView(ecx, ecy)) SFX.boing(); }
      }
      const vx0 = e.vx; const r = moveEntity(e); if (r.hitX) e.vx = -vx0 * 0.4;
      if (Math.abs(e.vx) > 0.3) e.dir = Math.sign(e.vx);
      break;
    }
    case 'spitter': case 'snowman': {
      moveEntity(e); if (e.recoil > 0) e.recoil--;
      if (e.timer > 0) e.timer--;
      else if (play && d < 470) {
        const snow = e.type === 'snowman';
        lobShot(ecx + toward * 10, e.y + 8, pcx, pcy, snow ? 'snow' : 'seed', snow ? 8 : 12, snow ? 'ヒヤッ!' : 'ペッ!');
        e.timer = snow ? 120 : 110; e.recoil = 12; SFX.whoosh();
      }
      break;
    }
    case 'eye': {
      e.y = e.homeY + Math.sin(e.t * 0.05) * 6;
      if (e.cyc > 0 || (play && d < 560)) e.cyc = (e.cyc + 1) % 150;
      if (e.cyc >= 50 && e.cyc < 110) e.aim = Math.atan2(pcy - ecy, pcx - ecx); // 狙いを合わせて、少し前に固定する
      if (e.cyc === 50 && nearView(ecx, ecy)) SFX.charge();
      if (e.cyc === 130) {
        bullets.push({ x: ecx + Math.cos(e.aim) * 16, y: ecy + Math.sin(e.aim) * 16, vx: Math.cos(e.aim) * 7.5, vy: Math.sin(e.aim) * 7.5, r: 5, life: 160, dmg: 14, word: 'ビシッ!', dead: false });
        e.recoil = 8; SFX.shoot();
      }
      if (e.recoil > 0) e.recoil--;
      break;
    }
    case 'dropper': {
      const ty = Math.max(20, P.y - 150);
      e.vx = lerp(e.vx, clamp((pcx - ecx) * 0.03, -2.2, 2.2), 0.08); e.x += e.vx; e.y += (ty - e.y) * 0.03;
      if (Math.abs(e.vx) > 0.2) e.dir = e.vx < 0 ? -1 : 1;
      if (e.timer > 0) e.timer--;
      else if (play && Math.abs(pcx - ecx) < 26 && pcy > ecy) {
        bullets.push({ kind: 'rock', x: ecx, y: e.y + e.h, vx: 0, vy: 1, r: 10, life: 200, rot: 0, dmg: 15, word: 'ゴツン!', dead: false });
        e.timer = 90; SFX.whoosh();
      }
      break;
    }
    case 'ninja': {
      e.vx *= 0.9; moveEntity(e);
      if (e.mode === 'jump') {
        if (!e.thrown && e.vy >= -1) {
          e.thrown = true; const a = Math.atan2(pcy - ecy, pcx - ecx);
          bullets.push({ kind: 'shuri', x: ecx, y: ecy, vx: Math.cos(a) * 5.5, vy: Math.sin(a) * 5.5, r: 7, life: 200, rot: 0, dmg: 12, word: 'シュッ!', dead: false });
          SFX.whoosh();
        }
        if (e.onGround && e.thrown) { e.mode = ''; e.timer = 75; }
      } else if (e.onGround) {
        if (e.timer > 0) e.timer--;
        else if (play && d < 460) { e.vy = -9; e.vx = -toward * 1.5; e.onGround = false; e.mode = 'jump'; e.thrown = false; }
      }
      break;
    }
    case 'puffer': {
      e.cyc = (e.cyc + 1) % 220;
      const big = e.cyc >= 140, a = Math.atan2(pcy - ecy, pcx - ecx);
      e.vx = lerp(e.vx, Math.cos(a) * 0.55, 0.03); e.vy = lerp(e.vy, Math.sin(a) * 0.55, 0.03);
      e.x += e.vx; e.y += e.vy;
      const W = big ? 46 : 30, H = big ? 42 : 26;
      if (W !== e.w) { e.x -= (W - e.w) / 2; e.y -= (H - e.h) / 2; e.w = W; e.h = H; if (big && nearView(ecx, ecy)) SFX.boing(); }
      e.noStomp = big;
      break;
    }
    case 'jelly': {
      e.y = e.homeY + Math.sin(e.t * 0.03) * 50;
      e.x = e.homeX + Math.sin(e.t * 0.017) * 18;
      break;
    }
    case 'ufo': {
      e.life++;
      if (e.life > 900) { e.dead = true; burst(ecx, ecy, '#b0bccd', 10, 2); break; }
      const ty = Math.max(20, P.y - 170);
      e.vx = lerp(e.vx, clamp((pcx - ecx) * 0.02, -1.4, 1.4), 0.06); e.x += e.vx; e.y += (ty - e.y) * 0.03;
      e.cyc = (e.cyc + 1) % 240; e.beam = e.cyc >= 150 && e.cyc < 225;
      if (e.cyc === 150 && nearView(ecx, ecy)) SFX.charge();
      if (play && e.beam && Math.abs(pcx - ecx) < 24 && P.y > e.y) { P.vy = Math.max(P.vy - 1.25, -4.5); P.onGround = false; }
      break;
    }
    case 'catapult': {
      moveEntity(e);
      if (e.timer > 0) e.timer--;
      if (e.recoil > 0) e.recoil--;
      if (play && e.timer <= 0 && P.vy >= 0 && overlap(P, { x: e.x, y: e.y - 4, w: e.w, h: e.h + 4 })) {
        const back = stage.vertical ? toward : -1; // 横に進むステージはスタート側へ
        P.vy = -15; P.vx = back * 7; P.kb = 22; P.noCut = 30; P.onGround = false;
        e.timer = 40; e.recoil = 12; SFX.boing(); popup(ecx, e.y - 14, 'ビヨーン!', C.bad, 20);
      }
      break;
    }
    case 'pendulum': {
      e.rot = Math.sin(e.t * 0.045) * 1.15;
      const b = pendulumBall(e);
      if (play && circleRect(b.x, b.y, 13, P)) hurt(18, b.x, 'ゴーン!');
      break;
    }
    case 'piston': {
      moveEntity(e);
      e.cyc = (e.cyc + 1) % 150;
      const c = e.cyc, q = c < 100 ? 0 : c < 110 ? (c - 100) / 10 : c < 130 ? 1 : Math.max(0, 1 - (c - 130) / 20);
      e.ext = q * 70;
      if (c === 100 && nearView(ecx, ecy)) SFX.whoosh();
      if (play && c >= 100 && c < 130 && overlap(P, pistonFist(e))) {
        const wasSafe = P.inv > 0 || P.shield > 0;
        hurt(12, ecx, 'ボカッ!');
        if (!wasSafe) { P.vx = e.dir * 9; P.vy = -5; P.kb = 16; P.onGround = false; }
      }
      break;
    }
    case 'mine': {
      moveEntity(e);
      if (play && overlap(P, { x: e.x - 4, y: e.y - 6, w: e.w + 8, h: e.h + 6 })) { e.dead = true; smallBlast(ecx, ecy, 60, 20, 'ドカン!'); }
      break;
    }
    case 'geyser': {
      moveEntity(e);
      e.cyc = (e.cyc + 1) % 170;
      const c = e.cyc;
      e.wh = c < 110 ? 0 : c < 120 ? (c - 110) * 14 : c < 155 ? 140 : (170 - c) / 15 * 140;
      if (c >= 80 && c < 110 && c % 6 === 0) particles.push({ x: ecx + rand(-6, 6), y: e.y, vx: 0, vy: rand(-1.4, -0.6), life: 20, max: 20, r: rand(2, 3.5), color: '#9fd3f4', g: 0 });
      if (c === 110 && nearView(ecx, ecy)) SFX.fwoosh();
      if (play && e.wh > 20 && overlap(P, { x: e.x + 2, y: e.y - e.wh, w: e.w - 4, h: e.wh })) { P.vy = Math.min(P.vy, -12.5); P.onGround = false; P.noCut = 20; }
      break;
    }
    case 'blackhole': {
      e.life++; e.rot += 0.1;
      if (e.life > 480) { e.dead = true; burst(ecx, ecy, '#6b4fa0', 14, 2.5); break; }
      if (play) {
        const dx = ecx - pcx, dy = ecy - pcy, dd = Math.hypot(dx, dy), R = 190;
        if (dd < R && dd > 1) { const f = (1 - dd / R) * 2.6; P.wind += dx / dd * f; P.vy += dy / dd * f * 0.12; }
        if (circleRect(ecx, ecy, 12, P)) hurt(15, ecx, 'ズオッ!');
      }
      if (tick % 3 === 0 && nearView(ecx, ecy)) { const a = rand(0, TAU), r = rand(60, 150); particles.push({ x: ecx + Math.cos(a) * r, y: ecy + Math.sin(a) * r, vx: -Math.cos(a) * r / 22, vy: -Math.sin(a) * r / 22, life: 20, max: 20, r: rand(1.5, 2.5), color: '#8a6cc8', g: 0 }); }
      break;
    }
    case 'arrow': {
      if (e.recoil > 0) e.recoil--;
      e.cyc = (e.cyc + 1) % 100;
      if (e.cyc === 0 && play && d < 620) {
        bullets.push({ kind: 'arrow', x: ecx + e.dir * 14, y: e.y + e.h / 2, vx: e.dir * 6.5, vy: 0, r: 5, life: 180, dmg: 12, word: 'ブスッ!', dead: false });
        e.recoil = 8; SFX.whoosh();
      }
      break;
    }
    case 'sawv': {
      e.rot += 0.28 * e.vdir; e.vx = 0; e.vy = e.vdir * 1.7;
      const r = moveEntity(e);
      if (r.landed || r.hitCeil || Math.abs(e.y - e.homeY) > 90) { if (!r.landed && !r.hitCeil) e.y = e.homeY + Math.sign(e.y - e.homeY) * 90; e.vdir *= -1; }
      break;
    }
    case 'spikeball': {
      e.life++; e.rot += 0.15;
      if (e.life > 900) { e.dead = true; burst(ecx, ecy, '#7a8091', 10, 2); break; }
      const vx0 = e.vx, vy0 = e.vy, r = moveEntity(e);
      e.vx = r.hitX ? -vx0 : vx0; e.vy = (r.landed || r.hitCeil) ? -vy0 : vy0;
      if (e.y < 0) e.vy = Math.abs(e.vy);
      if (e.y + e.h > WH) e.vy = -Math.abs(e.vy);
      if (r.hitX || r.landed || r.hitCeil) { if (nearView(ecx, ecy)) SFX.clank(); }
      break;
    }
    case 'homing': {
      moveEntity(e);
      const ax = ecx, ay = e.y + e.h * 0.45, target = Math.atan2(pcy - ay, pcx - ax);
      let da = target - e.aim; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      e.aim += da * 0.08;
      if (e.timer > 0) e.timer--;
      else if (play && dist(pcx, pcy, ax, ay) < 560) {
        bullets.push({ kind: 'missile', x: ax + Math.cos(e.aim) * 20, y: ay + Math.sin(e.aim) * 20, vx: Math.cos(e.aim) * 2.6, vy: Math.sin(e.aim) * 2.6, r: 7, life: 330, dmg: 15, word: 'ドーン!', dead: false });
        e.timer = 180; e.recoil = 8; SFX.shoot();
      }
      break;
    }
  }
}
// 追加の弾の動き（updateBullets から呼ばれる）
function updateExtraBullet(b) {
  if (b.kind === 'seed' || b.kind === 'snow') { b.vy = Math.min(b.vy + 0.25, 9); b.rot += 0.15; }
  else if (b.kind === 'shuri') b.rot += 0.5;
  else if (b.kind === 'missile') {
    const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2;
    let a = Math.atan2(b.vy, b.vx), da = Math.atan2(pcy - b.y, pcx - b.x) - a;
    while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    a += clamp(da, -0.035, 0.035);
    b.vx = Math.cos(a) * 2.8; b.vy = Math.sin(a) * 2.8;
    if (tick % 4 === 0 && nearView(b.x, b.y)) particles.push({ x: b.x - b.vx * 3, y: b.y - b.vy * 3, vx: 0, vy: 0, life: 16, max: 16, r: 2.5, color: '#c9cdd6', g: -0.02 });
  }
}
