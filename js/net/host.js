'use strict';

/* =====================================================
   オンライン：ホスト側（操作の受け取り・状態の送信）
   ===================================================== */
function supporterDown() {
  const sx = hover.sx, sy = hover.sy;
  if (!builderActive()) return;
  const gt = gateAt(bwx(sx), bwy(sy));
  if (gt) { holdGate = gt; gt.hold = true; if (!gt.open) setGate(gt, true); return; }
  const lf = liftAt(bwx(sx), bwy(sy));
  if (lf) { holdLift = lf; lf.hold = true; return; }
  tryPlace(sx, sy);
}
function netHostInput(m) {
  if (curScreen !== 'scr-game' || !NET.live) return;
  if (m.t === 'key') { // ゲストがランナーのとき：キー操作を受け取る
    if (netIAmRunner()) return;
    keys[m.c] = !!m.d;
    if (m.d) { if (K_JUMP.includes(m.c)) pressJump(); if (K_ATK.includes(m.c)) pressAtk(); }
    return;
  }
  if (m.t === 'keys0') { if (!netIAmRunner()) for (const k in keys) keys[k] = false; return; }
  if (m.t === 'bcam') { if (!COOP && !netIAmBuilder()) bCamT = clamp(m.x, 0, Math.max(0, WW - VWW)); return; } // ゲストがビルダー：視点をそろえる
  if (netIAmBuilder()) return; // ホスト自身がビルダーのときは、ゲストからの操作は使わない
  if (m.t === 'tool') { if (DECK.includes(m.id)) selectTool(m.id); return; }
  if (!COOP) { // 対戦：ゲストがビルダー（ワールド座標で受け取る）
    const hoverW = (x, y, on) => { hover.sx = (x - bCam) * VS + BX; hover.sy = (y - bCamY) * VS + BY; hover.on = !!on; };
    if (m.t === 'pu') { stopPaint(); return; }
    if (m.t === 'pd') {
      hoverW(m.x, m.y, 1);
      if (!builderActive()) return;
      if (CARD[tool].cat === 'pen') { painting = true; paintInk = (paintInk + 1) % INKS.length; lastPaint = { x: m.x, y: m.y }; paintAt(m.x, m.y); }
      else tryPlaceW(m.x, m.y);
      return;
    }
    if (m.t === 'pm') {
      for (const q of (m.p || [[m.x, m.y]])) {
        hoverW(q[0], q[1], m.on !== 0);
        if (painting && builderActive()) { const w = { x: q[0], y: q[1] }; paintLine(lastPaint, w); lastPaint = w; }
      }
    }
    return;
  }
  if (m.t === 'pu') { pointerIsDown = false; releaseGate(); return; }
  if (m.t !== 'pd' && m.t !== 'pm') return;
  hover.sx = (m.x - camX) * VS + BX; hover.sy = (m.y - camY) * VS + BY; hover.on = m.on !== 0;
  if (m.t === 'pd') { pointerIsDown = true; supporterDown(); }
}

/* ---------- ホスト側：状態の送信（差分だけを送る） ---------- */
function serPrim(o) {
  const r = {};
  for (const k in o) {
    if (k === '_id' || k === 'tx' || k === 'ty') continue;
    const v = o[k], ty = typeof v;
    if (ty === 'number') { if (Number.isFinite(v)) r[k] = Number.isInteger(v) ? v : Math.round(v * 100) / 100; }
    else if (ty === 'string' || ty === 'boolean') r[k] = v;
    else if (Array.isArray(v) && v.length <= 8 && v.every(x => typeof x === 'number' && Number.isFinite(x))) r[k] = v.map(x => Math.round(x * 100) / 100);
  }
  return r;
}
function netDelta(map, id, o) {
  const cur = serPrim(o), last = map.get(id);
  if (!last) { map.set(id, cur); return { i: id, f: cur }; }
  let d = null;
  for (const k in cur) {
    const a = cur[k], b = last[k];
    if (a === b || (Array.isArray(a) && JSON.stringify(a) === JSON.stringify(b))) continue;
    (d || (d = {}))[k] = a; last[k] = a;
  }
  return d ? { i: id, d } : null;
}
function netMakeShadow() { return { t: tiles.slice(), k: paintKind.slice(), c: paintCol.slice(), h: paintHp.slice(), pt: paintT.slice(), pe: paintExp.slice() }; }
function netTileDiff() {
  const sh = NET.shadow, out = [];
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === sh.t[i] && paintKind[i] === sh.k[i] && paintCol[i] === sh.c[i] && paintHp[i] === sh.h[i] && paintT[i] === sh.pt[i] && paintExp[i] === sh.pe[i]) continue;
    sh.t[i] = tiles[i]; sh.k[i] = paintKind[i]; sh.c[i] = paintCol[i]; sh.h[i] = paintHp[i]; sh.pt[i] = paintT[i]; sh.pe[i] = paintExp[i];
    out.push([i, tiles[i], paintKind[i], paintCol[i], paintHp[i], paintT[i], paintExp[i]]);
  }
  return out;
}
function netHostBegin() {
  if (!NET.open) { NET.role = null; document.body.classList.remove('net-host'); updateNetPill(); return; } // 相手がいなければ、ふつうの協力プレイとして続ける
  NET.busy = [false, false]; NET.redo = null;
  NET.seq = 0; NET.fx.length = 0; NET.idc = 0; NET.mP = new Map(); NET.mE = new Map(); NET.mB = new Map(); NET.small = {}; NET.sE = ''; NET.sB = '';
  NET.shadow = netMakeShadow(); NET.live = true;
  netApplyRoleClasses(); resizeGame(); // カード欄の表示が変わるので、画面の大きさを合わせ直す
  netSend({ t: 'start', seed: NET.seed, idx: storyIdx, lv: COOP_LV, ck: sumArr(tiles), vs: COOP ? 0 : 1, rs: NET.runnerSide, deck: DECK.slice(),
    match: MATCH.on ? { target: MATCH.target, round: MATCH.round, runner: MATCH.runner, wins: MATCH.players.map(p => p.wins), history: MATCH.history } : 0,
    ch: serializeCH(CH) });
}
function netOnHostScreen(id) {
  NET.live = false;
  if (NET.vsMode) return; // 対戦の準備中は、ゲストも自分の画面で準備している
  const msg = { 'scr-draw': 'ホストがキャラを描いています…', 'scr-story': 'ホストがページを選んでいます…', 'scr-ending': 'エンディングです！ ホストの画面を見てね', 'scr-online': 'ホストが準備中です…' }[id];
  if (msg) netSend({ t: 'wait', msg });
}
function netSendResult() {
  netSend({ t: 'res', title: $('#resTitle').textContent, cls: $('#resTitle').className, reason: $('#resReason').textContent,
    match: $('#resMatch').innerHTML, matchHidden: $('#resMatch').hidden, cols: $('#resCols').innerHTML,
    sc: { r: SCORE.runner, b: SCORE.builder }, mt: MATCH.on ? { wins: MATCH.players.map(p => p.wins), history: MATCH.history, over: MATCH.over, round: MATCH.round, runner: MATCH.runner } : 0 });
}
function netSendSnap() {
  const dc = NET.dc; if (!dc || dc.readyState !== 'open' || dc.bufferedAmount > 600000) return;
  const sm = (k, v) => { const j = JSON.stringify(v); if (NET.small[k] === j) return undefined; NET.small[k] = j; return v; };
  const s = { t: 'snap', n: ++NET.seq, k: tick, st: state, c: countT, tl: timeLeft, e: r1(energy), sh: r1(shake), cx: r1(camX), si: scrIdx };
  if (!COOP) { s.cy = r1(camY); s.bv = r1(bCam); }
  s.p = netDelta(NET.mP, 0, P) || undefined;
  const E = [], ids = [];
  for (const e of enemies) { if (e.dead) continue; const id = e._id || (e._id = ++NET.idc); ids.push(id); const d = netDelta(NET.mE, id, e); if (d) E.push(d); }
  const ej = ids.join(','); if (ej !== NET.sE) { NET.sE = ej; s.Ei = ids; const set = new Set(ids); for (const id of NET.mE.keys()) if (!set.has(id)) NET.mE.delete(id); }
  if (E.length) s.E = E;
  const B = [], bids = [];
  for (const b of bullets) { if (b.dead) continue; const id = b._id || (b._id = ++NET.idc); bids.push(id); const d = netDelta(NET.mB, id, b); if (d) B.push(d); }
  const bj = bids.join(','); if (bj !== NET.sB) { NET.sB = bj; s.Bi = bids; const set = new Set(bids); for (const id of NET.mB.keys()) if (!set.has(id)) NET.mB.delete(id); }
  if (B.length) s.B = B;
  s.fx = sm('fx', effects); s.cd = sm('cd', cardCd); s.su = sm('su', supUses);
  s.it = sm('it', items.map(i => i.taken ? '1' : '0').join(''));
  s.g = sm('g', gates.map(g => (g.open ? 1 : 0) | (g.hold ? 2 : 0)));
  s.kl = sm('kl', locks.map(l => l.open ? 1 : 0));
  s.li = sm('li', lifts.map(l => [r1(l.y), l.hold ? 1 : 0]));
  s.bc = sm('bc', bossCut ? bossCut.col : -1);
  s.gd = sm('gd', guides.slice(NET.baseGuides).map(g => ({ kind: g.kind, row: g.row, c0: g.c0, c1: g.c1, until: g.until })));
  s.bn = sm('bn', banner ? { text: banner.text, life: banner.life, color: banner.color } : null);
  if (!COOP) { s.tool = sm('tool', tool); s.hv = sm('hv', hover.on ? [r1(hover.sx), r1(hover.sy)] : 0); }
  const td = netTileDiff(); if (td.length) s.ti = td;
  if (NET.fx.length) s.fe = NET.fx.splice(0).slice(-80);
  netSend(s);
}
let netLastSnap = 0;
function netHostTick(ts) { if (ts - netLastSnap >= 28) { netLastSnap = ts; netSendSnap(); } }

/* ホスト側：演出（効果音・ポップアップ・パーティクル）をゲストにも送る */
(function netHookFx() {
  const rec = ev => { if (NET.role === 'host' && NET.live) { NET.fx.push(ev); if (NET.fx.length > 200) NET.fx.splice(0, 100); } };
  const _popup = popup, _burst = burst, _dust = dust;
  popup = function (x, y, text, color, size) { rec(['p', Math.round(x), Math.round(y), text, color, size]); return _popup.apply(this, arguments); };
  burst = function (x, y, color, n, spd) { rec(['b', Math.round(x), Math.round(y), color, n, spd]); return _burst.apply(this, arguments); };
  dust = function (x, y, n) { rec(['d', Math.round(x), Math.round(y), n]); return _dust.apply(this, arguments); };
  const wrap = (obj, tag, skip) => {
    for (const name of Object.keys(obj)) {
      const desc = Object.getOwnPropertyDescriptor(obj, name);
      if (!desc || typeof desc.value !== 'function' || skip.includes(name)) continue;
      const orig = desc.value; let depth = 0;
      obj[name] = function (...args) {
        if (depth === 0) rec([tag, name, args]);
        depth++; try { return orig.apply(this, args); } finally { depth--; }
      };
    }
  };
  wrap(SFX, 'x', ['init', 'tone', 'noise', 'noiseAt']);
  wrap(BGM, 'm', ['setEnabled']);
})();
