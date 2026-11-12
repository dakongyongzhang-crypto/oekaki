'use strict';

/* =====================================================
   オンライン対戦（フリー／先取マッチ）
   ===================================================== */
// 協力・フリー対戦はホストがランナー。先取マッチはラウンドごとに交代する（走る側が「手元のキーボード」を使う）
const netRunnerIsHost = () => COOP || NET.runnerSide !== 'guest';
const netIAmRunner = () => !NET.role || (NET.role === 'host') === netRunnerIsHost();
const netIAmBuilder = () => !NET.role || (NET.role === 'host') !== netRunnerIsHost();
const netPtrIntercept = () => NET.role === 'guest' || (NET.role === 'host' && !netIAmBuilder());
const netMyIdx = () => NET.role === 'host' ? 0 : 1;
function netApplyRoleClasses() {
  document.body.classList.toggle('net-notool', !!NET.role && !netIAmBuilder());
  document.body.classList.toggle('net-hidecards', !!NET.role && !COOP && !netIAmBuilder()); // 対戦のランナーには相手のカードを見せない
}
function serializeCH(ch) {
  const o = {};
  for (const k in ch) { const v = ch[k]; if (k === 'spr' || typeof v === 'function') continue; o[k] = v; }
  o.spr = ch.spr.toDataURL('image/png');
  return o;
}
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
async function deserializeCH(o) {
  const img = await loadImg(o.spr), cv = document.createElement('canvas');
  cv.width = img.naturalWidth; cv.height = img.naturalHeight; cv.getContext('2d').drawImage(img, 0, 0);
  const ch = Object.assign({}, o); ch.spr = cv; return ch;
}
function netFixTexts() { // オンライン対戦の準備画面の文言
  if (!NET.vsMode) return;
  if (NET.vsMode === 'free') {
    if (NET.role === 'host') {
      $('#drawTitle').innerHTML = '<span class="pill p1">P1</span> ランナーのキャラを描こう';
      $('#drawSub').textContent = 'オンライン対戦：あなたはランナー（キーボード）です。相手はビルダー（マウス）のカードを選んでいます。';
      $('#btnGo').textContent = '準備完了（相手を待つ）';
    } else {
      $('#deckTitle').innerHTML = '<span class="pill p2">P2</span> ビルダーのカードを選ぼう';
      $('#deckSub').textContent = 'オンライン対戦：あなたはビルダー（マウス）です。70種類から8枚まで選びます。';
      $('#btnDeckGo').textContent = '準備完了';
    }
  } else $('#btnDeckGo').textContent = '準備完了';
  const red = !!NET.redo; // 組み直し中
  $('#btnRedoCancel1').hidden = !red; $('#btnRedoCancel2').hidden = !red;
  if (red) {
    $('#btnGo').textContent = '決定して結果に戻る'; $('#btnDeckGo').textContent = '決定して結果に戻る';
    $('#drawSub').textContent = '組み直し：描き直して「決定して結果に戻る」を押します。やめるときは「やめて結果に戻る」。';
    $('#deckSub').textContent = '組み直し：カードを選び直して「決定して結果に戻る」を押します。やめるときは「やめて結果に戻る」。';
  }
}
function netPrepSend() {
  const i = netMyIdx(), pl = MATCH.players[i];
  NET.ready[i] = true;
  netSend({ t: 'prep', i, name: pl.name, ch: pl.ch ? serializeCH(pl.ch) : null, strokes: pl.strokes, deck: pl.deck });
}
function netPrepWait(msg) {
  onShow('onWait'); $('#waitTitle').textContent = 'じゅんび完了！'; $('#waitMsg').textContent = msg || '相手の準備を待っています…';
  show('scr-online'); netTryStartVersus();
}
async function netOnPrep(m) {
  const pl = MATCH.players[m.i]; if (!pl) return;
  if (m.ch) { try { pl.ch = await deserializeCH(m.ch); } catch (_e) { return; } pl.strokes = m.strokes || []; pl.name = m.name || pl.ch.name; }
  if (m.deck) pl.deck = m.deck;
  if (m.redo) { // 組み直しが終わった（ゲームはまだ始めない）
    if (NET.role === 'host' && !MATCH.on && m.i === 1 && m.deck) DECK = m.deck.slice();
    NET.busy[m.i] = false; netUpdateWait(); return;
  }
  NET.ready[m.i] = true;
  netTryStartVersus();
}
function netTryStartVersus() { // ホスト：2人とも準備できたら始める
  if (NET.role !== 'host' || !NET.open || !NET.vsMode || !NET.ready[0] || !NET.ready[1]) return;
  NET.ready = [false, false];
  const p0 = MATCH.players[0], p1 = MATCH.players[1];
  NET.runnerSide = 'host';
  if (NET.vsMode === 'free') { MATCH.on = false; CH = p0.ch; DECK = p1.deck.slice(); startGame(); }
  else { MATCH.on = true; Object.assign(MATCH, { phase: 'play', round: 1, runner: 0, over: false, history: [] }); p0.wins = p1.wins = 0; startRound(); }
}
function netOnlineRound() { NET.runnerSide = MATCH.runner === 0 ? 'host' : 'guest'; startRound(); } // マッチ：席替えの画面は飛ばして、すぐ次のラウンドへ
function netBusyGuard() { // ホスト：相手が組み直し中なら、ゲームを始めない
  if (NET.role === 'host' && NET.busy[1]) { netToast('相手がキャラ・カードを組み直しています。少し待ってください。', 3500); return true; }
  return false;
}
function netUpdateWait() {
  const el = $('#resWait'), other = 1 - netMyIdx();
  if (NET.busy[other]) { el.textContent = '相手がキャラ・カードを組み直しています…'; el.hidden = false; }
  else if (NET.role === 'guest') { el.textContent = 'ホストが次の操作を選んでいます…'; el.hidden = false; }
  else el.hidden = true;
}
function netBackToResult() { show('scr-game'); resizeGame(); $('#result').classList.remove('hidden'); netUpdateWait(); }
function netRedo(kind) { // 自分のキャラ／デッキを組み直す（相手には「組み直し中」と伝える）
  const me = netMyIdx(), pl = MATCH.players[me];
  NET.redo = kind; NET.busy[me] = true; netSend({ t: 'redo', i: me, on: 1 });
  $('#result').classList.add('hidden');
  if (kind === 'draw') beginDrawFor(me, true);
  else { DECK = pl.deck.slice(); setSetupTexts(); show('scr-deck'); refreshDeckUI(); }
}
function netRedoDone() {
  const me = netMyIdx(), pl = MATCH.players[me];
  NET.redo = null; NET.busy[me] = false;
  netSend({ t: 'prep', i: me, name: pl.name, ch: pl.ch ? serializeCH(pl.ch) : null, strokes: pl.strokes, deck: pl.deck, redo: 1 });
  $('#btnRedoCancel1').hidden = true; $('#btnRedoCancel2').hidden = true;
  netBackToResult();
}
function netRedoCancel() {
  if (!NET.redo) return;
  const me = netMyIdx();
  NET.redo = null; NET.busy[me] = false; netSend({ t: 'redo', i: me, on: 0 });
  $('#btnRedoCancel1').hidden = true; $('#btnRedoCancel2').hidden = true;
  netBackToResult();
}
function netOnlineRetry() { // フリー：組み直したキャラ・デッキで、もう一度
  if (netBusyGuard()) return;
  CH = MATCH.players[0].ch; DECK = MATCH.players[1].deck.slice();
  startGame();
}
function netBeginVsHost(mode) {
  if (!NET.open) return;
  NET.vsMode = mode; NET.ready = [false, false]; NET.runnerSide = 'host'; COOP = false;
  netSend({ t: 'mode', m: mode, target: MATCH.target });
  if (mode === 'match') startMatch();
  else { Object.assign(MATCH, { on: false, phase: 'setup', setup: 0, players: [mkPlayer('A'), mkPlayer('B')] }); updateScoreUI(); updateRoleLabels(); setSetupTexts(); show('scr-draw'); }
}
function netOnMode(m) { // ゲスト：ホストが選んだ対戦モードの準備に入る
  NET.vsMode = m.m; NET.ready = [false, false]; NET.runnerSide = 'host'; COOP = false; NET.guestReady = false; NET.queue = [];
  const players = [mkPlayer('A'), mkPlayer('B')];
  if (m.m === 'match') {
    MATCH.target = m.target || 3;
    Object.assign(MATCH, { on: true, phase: 'setup', setup: 1, round: 1, runner: 0, over: false, history: [], players });
    updateScoreUI(); updateRoleLabels(); beginDrawFor(1, false);
  } else {
    Object.assign(MATCH, { on: false, phase: 'setup', setup: 1, players });
    DECK = PRESET.slice(); updateScoreUI(); updateRoleLabels(); setSetupTexts(); show('scr-deck'); refreshDeckUI();
  }
}
function netSendVictory() { netSend({ t: 'vic', wins: MATCH.players.map(p => p.wins), history: MATCH.history, winIdx: lastResult.winIdx }); }
function netShowVictory(m) {
  MATCH.on = true; MATCH.over = true; MATCH.history = m.history; m.wins.forEach((w, i) => { MATCH.players[i].wins = w; });
  lastResult = { winIdx: m.winIdx, winner: '', reason: '', time: 0 };
  showVictory(); $('#btnVicRematch').hidden = true; $('#btnVicTitle').textContent = '切断してタイトルへ';
}
function netPointerVs(kind, e) { // ゲストがビルダー（対戦）：視点はこちらで動かし、「置く・描く」操作だけをホストへ送る
  const p = gpos(e);
  if (kind === 'd') {
    if (!inBuilder(p)) { hover.on = false; return; }
    hover.sx = p.x; hover.sy = p.y;
    try { gcv.setPointerCapture(e.pointerId); } catch (_e) {}
    if (inMM(p)) { mmDrag = true; hover.on = false; mmSeek(p); return; }
    if (e.button === 1 || e.button === 2) { panDrag = { sx: p.x, sy: p.y, cx: bCamT, cy: bCamTY }; hover.on = false; return; }
    hover.on = true; NET.vsDown = true; NET.mv = null; NET.pts = [];
    netSend({ t: 'pd', x: r1(bwx(p.x)), y: r1(bwy(p.y)) });
  } else if (kind === 'm') {
    if (mmDrag) { mmSeek(p); return; }
    if (panDrag) { bCamT = clamp(panDrag.cx - (p.x - panDrag.sx) / VS, 0, Math.max(0, WW - VWW)); return; }
    hover.sx = Math.max(p.x, BX); hover.sy = Math.max(p.y, BY); hover.on = NET.vsDown || (inBuilder(p) && !inMM(p));
    gcv.style.cursor = !inBuilder(p) ? 'default' : inMM(p) ? 'ew-resize' : 'crosshair';
    const wx = r1(bwx(hover.sx)), wy = r1(bwy(hover.sy));
    if (NET.vsDown) NET.pts.push([wx, wy]); else NET.mv = { t: 'pm', x: wx, y: wy, on: hover.on ? 1 : 0 };
  } else {
    if (NET.vsDown) { netFlushMove(); netSend({ t: 'pu' }); }
    NET.vsDown = false; panDrag = null; mmDrag = false; NET.mv = null;
    if (e.pointerType && e.pointerType !== 'mouse') hover.on = false;
  }
}
