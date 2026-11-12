'use strict';

/* =====================================================
   ゲーム開始と1フレームぶんの更新（step）
   ===================================================== */
function startGame() {
  if (!CH || !DECK.length) return;
  SFX.init(); updateRoleLabels();
  show('scr-game'); buildToolbar(); resizeGame(); resetRound();
  $('#btnPause').textContent = 'ポーズ';
  gcv.focus({ preventScroll: true });
}

function slideCam() {
  // 切り替えは約0.9秒かけて、ゆっくり始まってゆっくり止まる
  camSlide.t = Math.min(1, camSlide.t + 1 / 55);
  const k = camSlide.t, ease = k < 0.5 ? 2 * k * k : 1 - (2 - 2 * k) ** 2 / 2;
  camX = camSlide.from + (camSlide.to - camSlide.from) * ease;
}
function step() {
  if (NET.role === 'guest') { guestStep(); return; }
  tick++;
  if (state === 'paused') return;
  if (SPLIT === 's' && camSlide.t < 1 && (state === 'play' || state === 'countdown')) { slideCam(); return; } // エリア切り替え中はゲームを止めてカメラだけ動かす
  if (hitStop > 0) { hitStop--; return; }
  if (shake > 0) { shake *= 0.85; if (shake < 0.3) shake = 0; }
  if (state === 'countdown') {
    countT--;
    if (countT > 0 && countT % 60 === 0) SFX.count(false);
    if (countT <= 0) { state = 'play'; banner = { text: 'GO!', life: 45, color: C.runner }; SFX.count(true); P.jumpBuf = 0; atkPressed = false; }
  }
  if (state === 'play' || state === 'countdown') {
    if (penCapOn()) penLive = countPenCells();
    energy = Math.min(EMAX, energy + (COOP ? (pageDef(storyIdx).regen || 0.17) : EREGEN));
    if (dbg('energy')) energy = EMAX;
    if (lifts.length && COOP) {
      const overL = pointerIsDown && hover.on ? liftAt(bwx(hover.sx), bwy(hover.sy)) : null;
      if (holdLift && overL !== holdLift) { holdLift.hold = false; holdLift.grace = 20; holdLift = null; }
      if (!holdLift && overL && !painting && builderActive()) { holdLift = overL; overL.hold = true; }
    }
    if (gates.length && COOP) {
      // カーソルがスイッチから外れたら閉める。押したまま戻ってきたらまた開く
      const over = pointerIsDown && hover.on ? gateAt(bwx(hover.sx), bwy(hover.sy)) : null;
      if (holdGate && over !== holdGate) releaseGate();
      if (!holdGate && over && !painting && builderActive()) { holdGate = over; over.hold = true; if (!over.open) setGate(over, true); }
    }
    if (gates.length) updateGates();
    if (effects.dark > 0) effects.dark--;
    if (effects.rev > 0) effects.rev--;
    if (effects.heavy > 0) effects.heavy--;
    if (effects.boost > 0) effects.boost--;
    if (effects.freeze > 0) effects.freeze--;
    for (const k of ['slip', 'float', 'seal']) if (effects[k] > 0) effects[k]--;
    for (const k in cardCd) if (cardCd[k] > 0) cardCd[k]--;
  }
  if (state === 'play' && lifts.length) updateLifts();
  if (state === 'play') { if (!dbg('freezeTime')) timeLeft--; updatePlayer(); }
  if (state === 'play' && bossInfo && !bossInfo.spawned && P.x > bossInfo.arenaStart) spawnBoss();
  if (state === 'play' && bossInfo && !bossCut && overlap(P, { x: bossInfo.sx - 18, y: bossInfo.sy - 62, w: 36, h: 62 })) triggerBossSwitch();
  if (state === 'cutscene') stepBossCut();
  if (COOP && state === 'play' && !dbg('noCpu') && !(bossInfo && P.x > bossInfo.arenaStart - 200)) cpuUpdate();
  if (state === 'play' && timeLeft === 15 * 60) { BGM.setTempo(1.2); banner = { text: 'あと15秒！', life: 50, color: C.runner }; }
  if (state === 'countdown') atkPressed = false;
  if (state === 'play' || state === 'countdown') {
    for (const e of enemies) if (!e.dead) updateEnemy(e);
    enemies = enemies.filter(e => !e.dead);
    if (spawnQueue.length) { enemies.push(...spawnQueue); spawnQueue = []; }
    if (crumbling.length) crumbling = crumbling.filter(i => {
      if (tiles[i] !== 3 || paintKind[i] !== 8) return false;
      if (tick < paintExp[i]) return true;
      tiles[i] = 0; burst((i % LW) * T + T / 2, ((i / LW) | 0) * T + T / 2, INKS[paintCol[i]], 4, 2); return false;
    });
    if (!(effects.freeze > 0)) updateBullets();
    if (painting && lastPaint) { const w = { x: bwx(hover.sx), y: bwy(hover.sy) }; if (dist(w.x, w.y, lastPaint.x, lastPaint.y) > 3) { paintLine(lastPaint, w); lastPaint = w; } }
    if (tick % 10 === 0) {
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (!(t === 3 || t === 5 || t === 6 || (t === 4 && paintKind[i] === 9))) continue; // 時間で消えるのはペン・ブロック・消しゴム跡だけ
        if (tick <= paintExp[i]) continue;
        const c = i % LW, r = (i / LW) | 0;
        if (t === 6) {
          const cell = { x: c * T, y: r * T, w: T, h: T };
          if (overlap(P, cell) || enemies.some(e => !e.dead && overlap(e, cell))) { paintExp[i] = tick + 30; continue; }
          tiles[i] = origTile[i];
        } else {
          tiles[i] = 0;
          if (nearView(c * T, r * T)) burst(c * T + T / 2, r * T + T / 2, t === 5 ? '#a0703f' : INKS[paintCol[i]], 2, 1.2);
        }
      }
    }
    if (tick % 6 === 0) updateToolAvailability();
  }
  if (state === 'play' && timeLeft <= 0) { timeLeft = 0; endRound('builder', '時間切れ'); }
  for (const pt of particles) { pt.x += pt.vx; pt.y += pt.vy; pt.vy += pt.g; pt.life--; }
  particles = particles.filter(pt => pt.life > 0);
  for (const pp of popups) { pp.y -= 0.7; pp.life--; }
  popups = popups.filter(pp => pp.life > 0);
  if (banner) { banner.life--; if (banner.life <= 0) banner = null; }
  if (SPLIT === 's') {
    // 協力モード：カメラは固定。ランナーが画面の端を越えたら、次のエリアへスライドする
    const pc = P.x + P.w / 2, last = Math.max(0, Math.ceil(WW / AREA_W) - 1);
    while (scrIdx < last && pc > (scrIdx + 1) * AREA_W + 6) scrIdx++;
    // 一方通行：前のエリアには戻らない
    const tx = areaCamX(scrIdx, pc);
    if (tx !== camSlide.to) camSlide = { from: camX, to: tx, t: 0 };
    else slideCam();
    camY = Math.max(0, WH - VWH);
  } else {
    camX = lerp(camX, clamp(P.x + P.w / 2 - VWW * 0.3, 0, Math.max(0, WW - VWW)), 0.12);
    camY = lerp(camY, clamp(P.y + P.h / 2 - VWH * 0.55, 0, Math.max(0, WH - VWH)), 0.12);
  }
  // ビルダーの視点：自由にスクロールできるが、ランナーより後ろ（横なら左、縦なら下）だけを見ることはできない
  if (isH()) bCamT = clamp(Math.max(bCamT, P.x + P.w + 120 - VWW), 0, Math.max(0, WW - VWW));
  else bCamTY = clamp(Math.min(bCamTY, P.y - 120), 0, Math.max(0, WH - VWH));
  bCam = lerp(bCam, bCamT, 0.25); bCamY = lerp(bCamY, bCamTY, 0.25);
  if (tick % 20 === 0) mmDirty = true;
  if (state === 'over') { overT--; if (overT === 0) showResult(); }
}
