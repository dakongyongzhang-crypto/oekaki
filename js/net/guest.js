'use strict';

/* =====================================================
   オンライン：ゲスト側（受信・描画・操作の送信）
   ===================================================== */
function netGuestMsg(m) {
  if (m.t === 'start') netStartMirror(m);
  else if (m.t === 'mode') netOnMode(m);
  else if (m.t === 'vic') netShowVictory(m);
  else if (m.t === 'snap') netApplySnap(m);
  else if (m.t === 'res') netShowRes(m);
  else if (m.t === 'wait') { NET.guestReady = false; NET.queue = []; $('#result').classList.add('hidden'); onShow('onWait'); $('#waitTitle').textContent = '接続中'; $('#waitMsg').textContent = m.msg; show('scr-online'); }
}
async function netStartMirror(m) {
  NET.guestReady = false; NET.queue = []; NET.busy = [false, false]; NET.redo = null;
  try { CH = await deserializeCH(m.ch); } catch (_e) { netToast('キャラ画像を受け取れませんでした', 6000); return; }
  COOP = !m.vs; COOP_LV = m.lv; storyIdx = m.idx; NET.runnerSide = m.rs || 'host'; NET.seed = m.seed;
  if (m.vs) {
    DECK = (m.deck || []).slice();
    if (m.match) {
      Object.assign(MATCH, { on: true, target: m.match.target, round: m.match.round, runner: m.match.runner, over: false, history: m.match.history || [] });
      m.match.wins.forEach((w, i) => { MATCH.players[i].wins = w; });
    } else MATCH.on = false;
  } else { MATCH.on = false; DECK = SUPPORT_DECK.slice(); }
  SFX.init(); updateRoleLabels(); netApplyRoleClasses();
  $('#guestHint').textContent = COOP ? 'P2 サポーター：画面をクリックしてブロックを置く／ホイールか1〜8キーでカード切り替え'
    : netIAmBuilder() ? 'ビルダー：クリック・ドラッグで置く／描く、ホイールで視点移動、1〜8キーでカード切り替え'
    : 'ランナー：A・D（←・→）で移動、W・Spaceでジャンプ、J・Fで攻撃';
  show('scr-game'); buildToolbar(); resizeGame(); resetRound();
  NET.gE = new Map(); NET.gB = new Map(); NET.camTarget = camX; NET.camTargetY = camY; NET.bTarget = bCam; NET.bSent = bCamT; NET.bPend = false; NET.mv = null; NET.pts = []; NET.vsDown = false;
  $('#btnPause').textContent = '切断'; $('#resWait').hidden = true; $('#btnVicRematch').hidden = false; $('#btnVicTitle').textContent = 'タイトルへ';
  document.body.classList.add('net-guest'); updateScoreUI(); updateNetPill();
  if (m.ck !== sumArr(tiles)) netToast('ステージが一致しませんでした（ホストと別のバージョンかも）。画面がずれる可能性があります。', 9000);
  NET.guestReady = true;
  const q = NET.queue; NET.queue = [];
  for (const sn of q) netApplySnap(sn);
}
function netMerge(o, d) { for (const k in d) { if (k === 'x') o.tx = d.x; else if (k === 'y') o.ty = d.y; else o[k] = d[k]; } }
function netApplySnap(s) {
  if (!NET.guestReady || !P) return;
  tick = s.k; state = s.st; countT = s.c; timeLeft = s.tl; energy = s.e; if (s.sh > shake) shake = s.sh;
  NET.camTarget = s.cx; scrIdx = s.si;
  if (s.cy !== undefined) NET.camTargetY = s.cy;
  if (!netIAmBuilder()) {
    if (s.bv !== undefined) NET.bTarget = s.bv;
    if (s.tool !== undefined && s.tool !== tool) { tool = s.tool; $$('.tool').forEach(b => b.classList.toggle('on', b.dataset.id === tool)); }
    if (s.hv !== undefined) { if (s.hv) { hover.sx = s.hv[0]; hover.sy = s.hv[1]; hover.on = true; } else hover.on = false; }
  }
  if (s.p) { if (s.p.f) { Object.assign(P, s.p.f); P.tx = P.x; P.ty = P.y; } else netMerge(P, s.p.d); }
  const ent = (list, map, ids) => {
    if (list) for (const m of list) {
      if (m.f) { const o = Object.assign({}, m.f); o.tx = o.x; o.ty = o.y; o._id = m.i; map.set(m.i, o); }
      else { const o = map.get(m.i); if (o) netMerge(o, m.d); }
    }
    if (ids) { const set = new Set(ids); for (const id of map.keys()) if (!set.has(id)) map.delete(id); }
  };
  ent(s.E, NET.gE, s.Ei); if (s.E || s.Ei) enemies = [...NET.gE.values()];
  ent(s.B, NET.gB, s.Bi); if (s.B || s.Bi) bullets = [...NET.gB.values()];
  if (s.fx) effects = s.fx;
  if (s.cd) cardCd = s.cd;
  if (s.su) supUses = s.su;
  if (s.it !== undefined) for (let i = 0; i < items.length; i++) items[i].taken = s.it[i] === '1';
  if (s.g) s.g.forEach((v, i) => { if (gates[i]) { gates[i].open = !!(v & 1); gates[i].hold = !!(v & 2); } });
  if (s.kl) s.kl.forEach((v, i) => { if (locks[i]) locks[i].open = !!v; });
  if (s.li) s.li.forEach((v, i) => { if (lifts[i]) { lifts[i].y = v[0]; lifts[i].hold = !!v[1]; } });
  if (s.bc !== undefined) bossCut = s.bc >= 0 ? { col: s.bc } : null;
  if (s.gd) { guides.length = NET.baseGuides; for (const g of s.gd) guides.push(g); }
  if (s.bn !== undefined) banner = s.bn;
  if (s.ti) for (const c of s.ti) { const i = c[0]; tiles[i] = c[1]; paintKind[i] = c[2]; paintCol[i] = c[3]; paintHp[i] = c[4]; paintT[i] = c[5]; paintExp[i] = c[6]; }
  if (s.fe) for (const ev of s.fe) netPlayFx(ev);
}
function netPlayFx(ev) {
  try {
    switch (ev[0]) {
      case 'p': popup(ev[1], ev[2], ev[3], ev[4], ev[5]); break;
      case 'b': burst(ev[1], ev[2], ev[3], ev[4], ev[5]); break;
      case 'd': dust(ev[1], ev[2], ev[3]); break;
      case 'x': if (typeof SFX[ev[1]] === 'function') SFX[ev[1]](...ev[2]); break;
      case 'm': if (typeof BGM[ev[1]] === 'function') BGM[ev[1]](...ev[2]); break;
    }
  } catch (_e) {}
}
const netSmooth = (o, k) => {
  if (o.tx === undefined) return;
  const dx = o.tx - o.x, dy = o.ty - o.y;
  if (dx * dx + dy * dy > 22500) { o.x = o.tx; o.y = o.ty; } else { o.x += dx * k; o.y += dy * k; }
};
function guestStep() {
  tick++;
  if (shake > 0) { shake *= 0.85; if (shake < 0.3) shake = 0; }
  netSmooth(P, 0.5); for (const e of enemies) netSmooth(e, 0.5); for (const b of bullets) netSmooth(b, 0.6);
  camX += (NET.camTarget - camX) * 0.4; if (Math.abs(NET.camTarget - camX) < 0.5) camX = NET.camTarget;
  if (COOP) camY = Math.max(0, WH - VWH);
  else {
    camY += (NET.camTargetY - camY) * 0.4;
    if (netIAmBuilder()) { // 自分がビルダー：視点は自分で動かす（ランナーより後ろは見られない）
      if (isH()) bCamT = clamp(Math.max(bCamT, P.x + P.w + 120 - VWW), 0, Math.max(0, WW - VWW));
      bCam = lerp(bCam, bCamT, 0.25);
      if (Math.abs(bCamT - NET.bSent) > 0.5) { NET.bSent = bCamT; NET.bPend = true; }
    } else bCam += (NET.bTarget - bCam) * 0.4;
    if (tick % 20 === 0) mmDirty = true;
  }
  for (const pt of particles) { pt.x += pt.vx; pt.y += pt.vy; pt.vy += pt.g; pt.life--; }
  particles = particles.filter(pt => pt.life > 0);
  for (const pp of popups) { pp.y -= 0.7; pp.life--; }
  popups = popups.filter(pp => pp.life > 0);
  if (banner) { banner.life--; if (banner.life <= 0) banner = null; }
  if (penCapOn()) penLive = countPenCells();
  if (tick % 6 === 0) updateToolAvailability();
}
function netShowRes(m) {
  $('#resTitle').textContent = m.title; $('#resTitle').className = m.cls; $('#resReason').textContent = m.reason;
  $('#resMatch').innerHTML = m.match; $('#resMatch').hidden = !!m.matchHidden; $('#resCols').innerHTML = m.cols;
  if (m.sc) { SCORE.runner = m.sc.r; SCORE.builder = m.sc.b; }
  if (m.mt) { m.mt.wins.forEach((w, i) => { MATCH.players[i].wins = w; }); MATCH.history = m.mt.history; MATCH.over = m.mt.over; }
  updateScoreUI();
  const keep = new Set(['btnTitle']);
  if (!COOP) { keep.add('btnRedeck'); if (MATCH.on) keep.add('btnRedraw'); } // ゲスト：フリーではデッキ、マッチではキャラとデッキを自分で組み直せる
  $$('#result .result-btns .btn').forEach(b => { b.hidden = !keep.has(b.id); });
  $('#btnTitle').textContent = '切断してタイトルへ'; $('#resWait').hidden = false; netUpdateWait();
  $('#result').classList.remove('hidden');
}

/* ゲスト側：操作をホストへ送る */
function netPointer(kind, e) {
  if (NET.role !== 'guest' || !NET.guestReady || !netIAmBuilder()) return;
  if (!COOP) { netPointerVs(kind, e); return; }
  const p = gpos(e);
  hover.sx = p.x; hover.sy = p.y;
  const wx = r1(bwx(p.x)), wy = r1(bwy(p.y));
  if (kind === 'd') { hover.on = true; NET.mv = null; netSend({ t: 'pd', x: wx, y: wy }); try { gcv.setPointerCapture(e.pointerId); } catch (_e) {} }
  else if (kind === 'u') { netSend({ t: 'pu' }); if (e.pointerType && e.pointerType !== 'mouse') hover.on = false; }
  else { hover.on = true; NET.mv = { t: 'pm', x: wx, y: wy }; }
  gcv.style.cursor = 'crosshair';
}
function netFlushMove() {
  if (NET.pts.length) { netSend({ t: 'pm', p: NET.pts, on: 1 }); NET.pts = []; NET.mv = null; }
  else if (NET.mv) { netSend(NET.mv); NET.mv = null; }
  if (NET.bPend) { netSend({ t: 'bcam', x: r1(NET.bSent) }); NET.bPend = false; }
}
