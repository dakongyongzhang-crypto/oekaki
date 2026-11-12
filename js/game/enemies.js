'use strict';

/* =====================================================
   敵と弾の更新
   ===================================================== */
function fireH(e) {
  if (e.cyc < 130) return 0;
  return Math.min(110, (e.cyc - 130) * 22) * (e.cyc > 171 ? (180 - e.cyc) / 9 : 1);
}
function fanZone(e) { return { x: e.dir > 0 ? e.x + e.w : e.x - 230, y: e.y - 18, w: 230, h: e.h + 18 }; }
function explode(e) {
  e.dead = true;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, R = BOMB_R;
  shake = 18; SFX.boom();
  for (let i = 0; i < 28; i++) { const a = rand(0, TAU), s = rand(1, 6); particles.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: rand(20, 45), max: 45, r: rand(3, 7), color: ['#ff7a3d', '#ffd166', '#3a3d48', '#e0313f'][i % 4], g: 0.08 }); }
  particles.push({ x: cx, y: cy, vx: 0, vy: 0, life: 22, max: 22, r: R, color: '#ff7a3d', g: 0, ring: true });
  popup(cx, cy - 24, 'ドカーン!', '#e07a1f', 26);
  if (circleRect(cx, cy, R, P)) {
    const wasSafe = P.inv > 0 || P.shield > 0;
    hurt(BOMB_DMG, cx, 'ドカーン!');
    if (!wasSafe && state === 'play') { P.vx = (P.x + P.w / 2 < cx ? -1 : 1) * 8.5; P.vy = -9.5; P.kb = 16; P.noCut = 24; P.onGround = false; }
  }
  const c0 = Math.floor((cx - R) / T), c1 = Math.floor((cx + R) / T), r0 = Math.floor((cy - R) / T), r1 = Math.floor((cy + R) / T);
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
    if (c < 0 || c >= LW || r < 0 || r >= ROWS) continue;
    const i = idx(c, r);
    if ((tiles[i] === 3 || tiles[i] === 5) && dist(cx, cy, c * T + T / 2, r * T + T / 2) <= R) tiles[i] = 0;
  }
}
function updateEnemy(e) {
  if (effects.freeze > 0) return;
  if (e.spawnT > 0) {
    e.spawnT--;
    if (e.spawnT === 0 && (e.type === 'fan' || e.type === 'laser')) e.dir = (P.x + P.w / 2 < e.x + e.w / 2) ? -1 : 1;
    if (e.type === 'shadow') followTrail(e);
    return;
  }
  e.t++; if (e.flash > 0) e.flash--; if (e.recoil > 0) e.recoil--;
  const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2, ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
  const play = state === 'play';
  if (GRAVITY_TYPES.has(e.type) && e.type !== 'hopper' && e.type !== 'charger') e.vy = Math.min(e.vy + GRAV, 12);
  switch (e.type) {
    case 'walker': case 'spiny': case 'giant': case 'mini': {
      e.vx = lerp(e.vx, e.dir * WALK_SPD[e.type], 0.15);
      const r = moveEntity(e);
      if (r.hitX) e.dir *= -1;
      if (e.onGround) {
        const fx = e.dir > 0 ? e.x + e.w + 2 : e.x - 2;
        if (!isFloorT(tileAt(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T)))) e.dir *= -1;
      }
      break;
    }
    case 'hopper': {
      e.vy = Math.min(e.vy + GRAV, 12);
      if (e.onGround) {
        e.vx *= 0.7; e.timer--;
        if (e.timer <= 0) { e.vy = -9.5; e.vx = (pcx < ecx ? -1 : 1) * 2.4; e.timer = 75; e.onGround = false; }
      }
      const vx0 = e.vx; const r = moveEntity(e); if (r.hitX) e.vx = -vx0 * 0.5;
      break;
    }
    case 'flyer': case 'bee': {
      const bee = e.type === 'bee', acc = bee ? 0.11 : 0.045, mx = bee ? 2.3 : 1.6;
      const tx = pcx + (bee ? Math.cos(e.t * 0.05 + e.ofs) * 34 : 0), ty = pcy - (bee ? 6 : 36) + (bee ? Math.sin(e.t * 0.07 + e.ofs) * 22 : 0);
      if (dist(pcx, pcy, ecx, ecy) < 680) { e.vx += Math.sign(tx - ecx) * acc; e.vy += Math.sign(ty - ecy) * acc * 0.7; }
      e.vx = clamp(e.vx, -mx, mx); e.vy = clamp(e.vy, -mx * 0.65, mx * 0.65);
      const vx0 = e.vx, vy0 = e.vy;
      e.vy = vy0 + Math.sin(e.t * 0.08 + e.ofs) * 0.6;
      const r = moveEntity(e);
      e.vy = (r.landed || r.hitCeil) ? 0 : vy0;
      if (r.hitX) e.vx = -vx0 * 0.5;
      e.dir = e.vx < 0 ? -1 : 1;
      break;
    }
    case 'spike': case 'fire': case 'bomb': {
      moveEntity(e);
      if (e.type === 'fire') {
        e.cyc = (e.cyc + 1) % 180;
        if (e.cyc >= 90 && e.cyc < 130 && e.cyc % 6 === 0) particles.push({ x: ecx + rand(-5, 5), y: e.y, vx: rand(-0.3, 0.3), vy: rand(-1.4, -0.7), life: 26, max: 26, r: rand(3, 5), color: '#9aa1b3', g: -0.01 });
        if (e.cyc === 130 && nearView(ecx, ecy)) SFX.fwoosh();
        const fh = fireH(e);
        if (play && fh > 8 && overlap(P, { x: e.x + 3, y: e.y - fh, w: e.w - 6, h: fh })) hurt(18, ecx, 'アチッ!');
      }
      if (e.type === 'bomb') {
        e.fuse--;
        if (e.fuse % 60 === 0 && e.fuse > 0) SFX.tick();
        if (e.fuse <= 0) explode(e);
      }
      break;
    }
    case 'cannon': case 'triple': {
      moveEntity(e);
      const ax = ecx, ay = e.y + e.h * 0.45;
      const target = Math.atan2(pcy - ay, pcx - ax);
      let da = target - e.aim; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      e.aim += da * 0.08;
      e.timer--;
      if (e.timer <= 0 && dist(pcx, pcy, ax, ay) < 560) {
        e.timer = e.type === 'triple' ? 150 : 120; e.recoil = 8;
        const spread = e.type === 'triple' ? [-0.32, 0, 0.32] : [0];
        for (const s of spread) { const a = e.aim + s; bullets.push({ x: ax + Math.cos(a) * 20, y: ay + Math.sin(a) * 20, vx: Math.cos(a) * 3.7, vy: Math.sin(a) * 3.7, r: 6, life: 260, dead: false }); }
        SFX.shoot();
      }
      break;
    }
    case 'boulder': {
      e.vx = lerp(e.vx, e.dir * 3.2, 0.05);
      const r = moveEntity(e);
      if (r.hitX) { e.dir *= -1; dust(e.x + (e.dir < 0 ? e.w : 0), e.y + e.h * 0.6, 4); }
      e.rot += e.vx / (e.w / 2);
      break;
    }
    case 'charger': {
      e.vy = Math.min(e.vy + GRAV, 12);
      if (!e.mode) e.mode = 'wait';
      if (e.mode === 'wait') {
        e.vx *= 0.8; e.dir = pcx < ecx ? -1 : 1; if (e.timer > 0) e.timer--;
        if (play && e.timer <= 0 && Math.abs(pcy - ecy) < 70 && Math.abs(pcx - ecx) < 420) { e.mode = 'ready'; e.timer = 26; popup(ecx, e.y - 12, '!', C.bad, 24); }
      } else if (e.mode === 'ready') { e.vx = 0; if (--e.timer <= 0) { e.mode = 'dash'; e.timer = 70; } }
      else if (e.mode === 'dash') { e.vx = e.dir * 5.6; if (--e.timer <= 0) { e.mode = 'stun'; e.timer = 40; } if (tick % 3 === 0) dust(ecx - e.dir * e.w / 2, e.y + e.h, 1); }
      else { e.vx *= 0.8; if (--e.timer <= 0) { e.mode = 'wait'; e.timer = 30; } }
      const r = moveEntity(e);
      if (r.hitX && e.mode === 'dash') { e.mode = 'stun'; e.timer = 60; shake = Math.max(shake, 4); burst(ecx + e.dir * e.w / 2, ecy, '#b9c2d0', 6, 2); popup(ecx, e.y - 10, 'ゴンッ', C.ink, 16); SFX.thud(); }
      break;
    }
    case 'crusher': {
      if (!e.mode) e.mode = 'hover';
      if (e.mode === 'hover') { e.vy = 0; e.vx = 0; if (play && pcx > e.x - 14 && pcx < e.x + e.w + 14 && pcy > e.y + e.h) { e.mode = 'shake'; e.timer = 14; } }
      else if (e.mode === 'shake') { if (--e.timer <= 0) e.mode = 'fall'; }
      else if (e.mode === 'fall') {
        e.vy = Math.min(e.vy + 0.9, 14); const r = moveEntity(e);
        if (r.landed) { e.mode = 'land'; e.timer = 55; shake = Math.max(shake, 6); dust(ecx, e.y + e.h, 8); SFX.thud(); }
      } else if (e.mode === 'land') { if (--e.timer <= 0) e.mode = 'rise'; }
      else if (e.mode === 'rise') {
        e.vy = -1.6; const r = moveEntity(e);
        if (e.y <= e.homeY || r.hitCeil) { if (e.y < e.homeY) e.y = e.homeY; e.vy = 0; e.mode = 'hover'; }
      }
      break;
    }
    case 'ghost': {
      const a = Math.atan2(pcy - ecy, pcx - ecx);
      e.vx = lerp(e.vx, Math.cos(a) * 0.8, 0.05); e.vy = lerp(e.vy, Math.sin(a) * 0.8, 0.05);
      e.x += e.vx; e.y += e.vy + Math.sin(e.t * 0.06) * 0.3;
      e.dir = e.vx < 0 ? -1 : 1;
      break;
    }
    case 'saw': {
      e.rot += 0.28 * e.dir; e.vx = e.dir * 1.7; e.vy = 0;
      const r = moveEntity(e);
      if (r.hitX || Math.abs(e.x - e.homeX) > 100) { if (!r.hitX) e.x = e.homeX + Math.sign(e.x - e.homeX) * 100; e.dir *= -1; }
      break;
    }
    case 'firebar': {
      e.rot += 0.035;
      if (play) {
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        for (let i = 1; i <= 4; i++) {
          const bx = cx + Math.cos(e.rot) * 16 * i, by = cy + Math.sin(e.rot) * 16 * i;
          if (circleRect(bx, by, 7, P)) { hurt(15, bx, 'ジュッ!'); break; }
        }
      }
      break;
    }
    case 'fan': {
      moveEntity(e); e.rot += 0.45;
      if (play && overlap(P, fanZone(e))) P.wind += e.dir * 2.4;
      if (tick % 4 === 0 && nearView(ecx, ecy)) { const z = fanZone(e); particles.push({ x: e.dir > 0 ? z.x : z.x + z.w, y: z.y + rand(4, z.h - 4), vx: e.dir * 5, vy: 0, life: 40, max: 40, r: 1.6, color: '#8fd0e8', g: 0 }); }
      break;
    }
    case 'warper': {
      if (!e.mode) e.mode = 'walk';
      if (e.mode === 'walk') {
        e.vx = lerp(e.vx, (pcx < ecx ? -1 : 1) * 0.9, 0.1); e.dir = e.vx < 0 ? -1 : 1;
        const r = moveEntity(e); if (r.hitX) e.vx = 0;
        if (--e.timer <= 0) { e.mode = 'vanish'; e.timer = 20; SFX.warp(); }
      } else {
        e.vx = 0; moveEntity(e);
        if (--e.timer <= 0) {
          for (let tries = 0; tries < 10; tries++) {
            const tx = pcx + (Math.random() < 0.5 ? -1 : 1) * rand(130, 185);
            const c = Math.floor(tx / T); let r = clamp(Math.floor((P.y - 30) / T), 0, ROWS - 1);
            if (solid(c, r)) continue;
            while (r < ROWS && !isFloorT(tileAt(c, r))) r++;
            if (r >= ROWS) continue;
            const nx = tx - e.w / 2, ny = r * T - e.h;
            if (boxSolid(nx, ny, e.w, e.h) || rectNearPlayer(nx, ny, e.w, e.h, 105)) continue;
            e.x = nx; e.y = ny; e.vy = 0; break;
          }
          e.mode = 'walk'; e.timer = 170; e.spawnT = 30;
        }
      }
      break;
    }
    case 'thrower': {
      e.vx *= 0.8; moveEntity(e); e.dir = pcx < ecx ? -1 : 1;
      if (e.throwT > 0) e.throwT--;
      if (e.timer > 0) e.timer--;
      else if (play && dist(pcx, pcy, ecx, ecy) < 430 && !bullets.some(b => b.owner === e)) {
        bullets.push({ kind: 'boom', owner: e, x: ecx + e.dir * 12, y: e.y + 8, vx: e.dir * 6.3, vy: clamp((pcy - (e.y + 8)) * 0.012, -1.6, 1.6), ax: -e.dir * 0.08, r: 9, life: 230, rot: 0, dmg: 12, word: 'ビュン!', dead: false });
        e.timer = 90; e.throwT = 12; SFX.whoosh();
      }
      break;
    }
    case 'slime': case 'slimelet': {
      const small = e.type === 'slimelet';
      if (e.onGround) {
        e.vx *= 0.75;
        if (--e.timer <= 0) { e.vy = small ? -4.5 : -5.5; e.vx = (pcx < ecx ? -1 : 1) * (small ? 2.2 : 1.7); e.timer = small ? 34 : 48; e.onGround = false; }
      }
      const vx0 = e.vx; const r = moveEntity(e); if (r.hitX) e.vx = -vx0 * 0.5;
      e.dir = pcx < ecx ? -1 : 1;
      break;
    }
    case 'shadow': {
      e.life++;
      if (e.life > 720) { e.dead = true; burst(ecx, ecy, '#4b3a6b', 12, 2); break; }
      followTrail(e);
      break;
    }
    case 'laser': {
      moveEntity(e);
      e.cyc = (e.cyc + 1) % 200;
      const by = e.y + 9, sx = e.dir > 0 ? e.x + e.w + 3 : e.x - 3;
      if (e.cyc >= 120) {
        let x = sx; const rr = Math.floor(by / T);
        for (let k = 0; k < 60; k++) { const nx = x + e.dir * T * 0.5; if (solid(Math.floor(nx / T), rr)) break; x = nx; }
        e.beamEnd = x;
      }
      const onScr = nearView(ecx, ecy);
      if (e.cyc === 120 && onScr) SFX.charge();
      if (e.cyc === 170 && onScr) SFX.beam();
      if (play && e.cyc >= 170) {
        const x0 = Math.min(sx, e.beamEnd), x1 = Math.max(sx, e.beamEnd);
        if (overlap(P, { x: x0, y: by - 5, w: x1 - x0, h: 10 })) hurt(20, sx, 'ビーッ!');
      }
      break;
    }
    case 'snare': {
      moveEntity(e);
      if (play && overlap(P, e)) {
        e.dead = true;
        if (P.inv <= 0) hurt(8, ecx, 'ベタッ!'); else popup(ecx, e.y - 10, 'ベタッ!', C.bad, 18);
        P.stuck = 90; P.vx = 0; P.vy = Math.max(0, P.vy); P.kb = 0;
        SFX.splat(); burst(ecx, e.y, '#f2dc8c', 10, 2);
      }
      break;
    }
    case 'rockfall': {
      e.cyc++;
      for (let k = 0; k < 3; k++) {
        if (e.cyc === 36 + k * 45) {
          bullets.push({ kind: 'rock', x: e.rxs[k], y: e.y - 20, vx: 0, vy: 2, r: 11, life: 240, rot: rand(0, TAU), dmg: 18, word: 'ゴツン!', dead: false });
        }
      }
      if (e.cyc > 130) e.dead = true;
      break;
    }
    case 'boss': {
      const B = bossInfo; if (!B) break;
      e.vy = Math.min(e.vy + GRAV, 14);
      if (e.stun > 0) { e.stun--; e.vx *= 0.85; moveEntity(e); e.mode = 'walk'; e.timer = 40; break; }
      if (!e.mode) { e.mode = 'walk'; e.timer = 80; }
      e.timer--;
      const exB = isEX(), toward = pcx < ecx ? -1 : 1, angry = exB || e.t > 1200;
      if (angry && !e.angryShown) { e.angryShown = true; banner = { text: '大王がおこった！', life: 80, color: C.bad }; SFX.tone(140, 60, 0.7, 'sawtooth', 0.06); }
      const shot = (a, sp) => bullets.push({ kind: 'shot', x: ecx, y: ecy, vx: Math.cos(a) * sp * (exB ? 1.2 : 1), vy: Math.sin(a) * sp * (exB ? 1.2 : 1), r: 8, life: 320, dmg: 10, word: 'ペチッ!', dead: false });
      if (e.mode === 'walk') {
        if (Math.abs(pcx - ecx) > 140) e.dir = toward;
        e.vx = e.dir * (angry ? 2.3 : 1.9);
        if (e.timer <= 0) {
          const k = Math.random(); e.dir = toward; e.wave = 0;
          if (k < 0.16) { if (exB) { e.mode = 'aim'; e.timer = 70; popup(ecx, e.y - 30, 'ねらい撃ち！', C.bad, 20); } else { e.mode = 'throw'; e.timer = 56; } }
          else if (k < 0.3) { e.mode = 'jump'; e.timer = 200; e.jumped = false; }
          else if (k < 0.44) { e.mode = 'ready'; e.timer = 30; popup(ecx, e.y - 30, '!!', C.bad, 26); }
          else if (k < 0.64) { e.mode = 'ring'; e.timer = 84; popup(ecx, e.y - 30, 'ケシケシ弾！', C.bad, 20); }
          else if (k < 0.84) { e.mode = 'spiral'; e.timer = 110; e.spin = Math.random() * TAU; popup(ecx, e.y - 30, 'ぐるぐる弾！', C.bad, 20); }
          else { e.mode = 'rain'; e.timer = 90; popup(ecx, e.y - 30, '消しカスの雨！', C.bad, 20); }
        }
      } else if (e.mode === 'aim') {
        // EXだけ：ランナーをねらった5方向の弾を連射
        e.vx = 0;
        if (play && e.timer % 14 === 0 && e.timer > 0) { const base = Math.atan2(pcy - ecy, pcx - ecx); for (let k = -2; k <= 2; k++) shot(base + k * 0.22, 3.2); SFX.shoot(); }
        if (e.timer <= 0) { e.mode = 'walk'; e.timer = 30; }
      } else if (e.mode === 'ring') {
        // 弾幕1：全方向に広がる輪を3回（少しずつ角度をずらす）
        e.vx = 0;
        if (play && (e.timer === 50 || e.timer === 32 || e.timer === 14)) {
          const n = angry ? 16 : 12, off = e.wave * Math.PI / n; e.wave++;
          for (let k = 0; k < n; k++) shot(off + k / n * TAU, angry ? 3.1 : 2.7);
          SFX.shoot();
        }
        if (e.timer <= 0) { e.mode = 'walk'; e.timer = angry ? 35 : 55; }
      } else if (e.mode === 'spiral') {
        // 弾幕2：回転しながらばらまくうずまき
        e.vx = 0;
        if (play && e.timer % 5 === 0 && e.timer < 100) {
          e.spin += 0.42;
          const arms = angry ? 3 : 2;
          for (let k = 0; k < arms; k++) shot(e.spin + k * TAU / arms, 2.9);
          if (e.timer % 15 === 0) SFX.tick();
        }
        if (e.timer <= 0) { e.mode = 'walk'; e.timer = angry ? 35 : 55; }
      } else if (e.mode === 'rain') {
        // 弾幕3：ランナーのまわりに上から消しカスが降ってくる
        e.vx = 0;
        if (play && e.timer % (angry ? 4 : 6) === 0 && e.timer < 84) {
          const x = clamp(pcx + rand(-260, 260), B.min - 120, B.max + 160);
          bullets.push({ kind: 'crumb', x, y: camY - 10, vx: rand(-0.5, 0.5), vy: rand(0.5, 2), r: 8, life: 260, rot: rand(0, TAU), dmg: 12, word: 'ペチッ!', dead: false });
        }
        if (e.timer <= 0) { e.mode = 'walk'; e.timer = angry ? 35 : 55; }
      } else if (e.mode === 'throw') {
        e.vx = 0; e.dir = toward;
        if (play && (e.timer === 40 || e.timer === 22 || e.timer === 6)) {
          bullets.push({ kind: 'crumb', x: ecx + e.dir * 30, y: e.y + 20, vx: e.dir * rand(2.2, 4.6), vy: -rand(5, 8.5), r: 8, life: 240, rot: rand(0, TAU), dmg: 12, word: 'ペチッ!', dead: false });
          SFX.whoosh();
        }
        if (e.timer <= 0) { e.mode = 'walk'; e.timer = 70; }
      } else if (e.mode === 'jump') {
        if (!e.jumped && e.onGround) { e.vy = -11.5; e.vx = toward * 2.4; e.jumped = true; e.onGround = false; }
        else if ((e.jumped && e.onGround) || e.timer <= 0) {
          if (e.onGround) {
            shake = Math.max(shake, 10); SFX.thud(); dust(ecx, e.y + e.h, 10);
            for (const sg of [-1, 1]) bullets.push({ kind: 'crumb', x: ecx + sg * 40, y: e.y + e.h - 10, vx: sg * 3.4, vy: -4, r: 8, life: 200, rot: 0, dmg: 12, word: 'ペチッ!', dead: false });
          }
          e.mode = 'walk'; e.timer = 60; e.vx = 0;
        }
      } else if (e.mode === 'ready') { e.vx = 0; if (e.timer <= 0) { e.mode = 'dash'; e.timer = 60; } }
      else if (e.mode === 'dash' && angry) { e.vx = e.dir * 6.4; if (e.timer <= 0) { e.mode = 'walk'; e.timer = 40; } }
      else if (e.mode === 'dash') { e.vx = e.dir * 5.2; if (e.timer <= 0) { e.mode = 'walk'; e.timer = 70; } }
      const r = moveEntity(e);
      if (r.hitX) { bossSmash(e); if (e.mode === 'dash') { e.mode = 'walk'; e.timer = 50; shake = Math.max(shake, 6); } }
      if (e.x < B.min) { e.x = B.min; e.dir = 1; if (e.mode === 'dash') { e.mode = 'walk'; e.timer = 50; } }
      if (e.x + e.w > B.max) { e.x = B.max - e.w; e.dir = -1; if (e.mode === 'dash') { e.mode = 'walk'; e.timer = 50; } }
      break;
    }
    case 'thunder': {
      e.life++;
      if (e.life > 900) { e.dead = true; burst(ecx, ecy, '#9aa7bd', 10, 2); break; }
      e.cyc = (e.cyc + 1) % 170;
      if (e.cyc < 110) { e.vx = lerp(e.vx, clamp((pcx - ecx) * 0.02, -1.3, 1.3), 0.1); e.x += e.vx; }
      if (e.cyc === 110) {
        const c = Math.floor(ecx / T); let r = Math.max(0, Math.floor((e.y + e.h) / T));
        while (r < ROWS && !solid(c, r)) r++;
        e.gy = Math.min(r * T, WH + 40);
      }
      if (e.cyc === 155) { SFX.zap(); shake = Math.max(shake, 4); }
      if (play && e.cyc >= 155 && overlap(P, { x: ecx - 11, y: e.y + e.h - 4, w: 22, h: e.gy - (e.y + e.h) + 4 })) hurt(20, ecx, 'ビリッ!');
      break;
    }
  }
  if (e.type !== 'shadow' && e.type !== 'boss') {
    if (e.y > WH + 80 || farBehind(e)) e.dead = true;
  }
}
function followTrail(e) {
  const pt = trail[Math.max(0, trail.length - 1 - 120)];
  if (pt) { e.x = pt[0]; e.y = pt[1]; e.dir = pt[2]; }
}
function updateBullets() {
  for (const b of bullets) {
    if (b.dead) continue;
    if (b.friendly) { // ランナーのインクショット：敵・敵の弾・ペンのブロックに当たる
      b.x += b.vx; b.y += b.vy; b.life--;
      if (b.life <= 0) { b.dead = true; continue; }
      if (solid(Math.floor(b.x / T), Math.floor(b.y / T))) { b.dead = true; if (!breakCells(b.x, b.y, 14, b.x, b.y - 12)) burst(b.x, b.y, b.col, 6, 2); continue; }
      for (const e of enemies) if (!e.dead && e.spawnT <= 0 && circleRect(b.x, b.y, b.hr || b.r, e)) { b.dead = true; if (damageEnemy(e, b.dmg, Math.sign(b.vx))) popup(b.x, b.y - 12, 'ビシャッ!', C.runner, 18); burst(b.x, b.y, b.col, 8, 2.4); break; }
      if (b.dead) continue;
      for (const o of bullets) if (o !== b && !o.dead && !o.friendly && dist(o.x, o.y, b.x, b.y) < o.r + (b.hr || b.r)) { o.dead = true; b.dead = true; burst(b.x, b.y, C.ink, 5, 2); break; }
      continue;
    }
    if (b.kind === 'boom') {
      b.vx += b.ax; b.rot += 0.45;
      const o = b.owner;
      if (Math.sign(b.vx) === Math.sign(b.ax) && o && !o.dead) {
        b.vy = clamp((o.y + 8 - b.y) * 0.05, -2, 2);
        if (Math.abs(b.x - (o.x + o.w / 2)) < 14) { b.dead = true; continue; }
      }
    }
    if (b.kind === 'rock') { b.vy = Math.min(b.vy + 0.45, 11); b.rot += 0.1; }
    if (b.kind === 'crumb') { b.vy = Math.min(b.vy + 0.32, 10); b.rot += 0.2; }
    b.x += b.vx; b.y += b.vy; b.life--;
    if (b.life <= 0) b.dead = true;
    else if (b.kind !== 'boom' && solid(Math.floor(b.x / T), Math.floor(b.y / T))) {
      b.dead = true;
      if (b.kind === 'rock') { burst(b.x, b.y, '#a59c8e', 9, 2.4); dust(b.x, b.y, 4); if (nearView(b.x, b.y)) SFX.thud(); }
      else burst(b.x, b.y, '#8b90a0', 5, 1.6);
    }
    else if (!b.friendly && state === 'play' && P.inv <= 0 && circleRect(b.x, b.y, b.r, P)) { b.dead = true; hurt(b.dmg || 12, b.x, b.word || 'ドン!'); }
  }
  bullets = bullets.filter(b => !b.dead);
}
