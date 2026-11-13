'use strict';

/* =====================================================
   モードの流れ（フリー対戦・先取マッチ・協力ストーリー）
   ===================================================== */
const mkPlayer = label => ({ label, ch: null, strokes: [], name: '', deck: PRESET.slice(), wins: 0 });
const MATCH = { on: false, target: 5, phase: 'setup', setup: 0, round: 1, runner: 0, over: false, history: [], players: [mkPlayer('A'), mkPlayer('B')] };
const copyStrokes = st => st.map(s => ({ ...s, pts: s.pts.slice() }));
const roleWho = role => MATCH.players[role === 'runner' ? MATCH.runner : 1 - MATCH.runner];
function startFree() { COOP = false; MATCH.on = false; updateScoreUI(); updateRoleLabels(); setSetupTexts(); show('scr-draw'); }
function startMatch() {
  SFX.init(); COOP = false;
  Object.assign(MATCH, { on: true, phase: 'setup', setup: 0, round: 1, runner: 0, over: false, history: [], players: [mkPlayer('A'), mkPlayer('B')] });
  updateScoreUI(); beginDrawFor(0, false);
}
function beginDrawFor(i, keep) {
  const pl = MATCH.players[i];
  D.strokes = keep ? copyStrokes(pl.strokes) : []; D.cur = null;
  $('#charName').value = pl.name || ('ラクガキ' + pl.label);
  setSetupTexts(); show('scr-draw'); redrawDrawing(); analyzeAndShow();
}
function goDeck() {
  const an = D.analysis; if (!an || !an.enough) return;
  SFX.init();
  CH = makeCharacter(an);
  if (COOP) { storyCH = CH; storyStrokes = copyStrokes(D.strokes); showStory(); return; }
  if (NET.role && NET.vsMode) { // オンライン対戦：自分のキャラ・デッキは自分のPCで用意する
    const pl = MATCH.players[netMyIdx()];
    pl.ch = CH; pl.strokes = copyStrokes(D.strokes); pl.name = CH.name;
    if (NET.redo === 'draw') { netRedoDone(); return; } // 組み直し：キャラだけ変えて結果画面に戻る
    if (NET.vsMode === 'free') { netPrepSend(); netPrepWait(); return; } // フリー：ホストはキャラだけ描く
    DECK = pl.deck.slice(); setSetupTexts(); show('scr-deck'); refreshDeckUI(); return;
  }
  if (MATCH.on) {
    const pl = MATCH.players[MATCH.phase === 'redraw' ? MATCH.runner : MATCH.setup];
    pl.ch = CH; pl.strokes = copyStrokes(D.strokes); pl.name = CH.name;
    if (MATCH.phase === 'redraw') { MATCH.phase = 'play'; showSwap(); return; }
    DECK = pl.deck.slice();
  }
  setSetupTexts(); show('scr-deck'); refreshDeckUI();
}
function deckGo() {
  if (!DECK.length) return;
  if (NET.role && NET.vsMode) {
    MATCH.players[netMyIdx()].deck = DECK.slice();
    if (NET.redo === 'deck') { netRedoDone(); return; } // 組み直し：デッキだけ変えて結果画面に戻る
    netPrepSend(); netPrepWait(); return;
  }
  if (!MATCH.on) { startGame(); return; }
  if (MATCH.phase === 'redeck') { roleWho('builder').deck = DECK.slice(); MATCH.phase = 'play'; showSwap(); return; }
  MATCH.players[MATCH.setup].deck = DECK.slice();
  if (MATCH.setup === 0) { MATCH.setup = 1; beginDrawFor(1, false); return; }
  MATCH.phase = 'play'; MATCH.round = 1; MATCH.runner = 0; showSwap();
}
function setSetupTexts() {
  if (COOP) {
    $('#drawTitle').innerHTML = '<span class="pill p1">P1</span> ランナーのキャラを描こう';
    $('#drawSub').textContent = '協力ストーリー：このキャラで全8ページを旅します。P2はサポーターになってランナーを守ります。';
    $('#btnGo').textContent = 'ページ選択へ';
    return;
  }
  if (!MATCH.on) {
    $('#drawTitle').innerHTML = '<span class="pill p1">P1</span> キャラを描こう';
    $('#drawSub').textContent = '描いた絵がそのまま自キャラになります。描くたびに能力が変わります。';
    $('#btnGo').textContent = '次へ：ビルダーのカード選び';
    $('#deckTitle').innerHTML = '<span class="pill p2">P2</span> カードを選ぼう';
    $('#deckSub').textContent = '69種類から8枚まで選びます（特殊は2枚まで）。選んだ順に1〜8キーへ割り当てられます。';
    $('#btnDeckGo').textContent = 'このデッキで対戦開始';
    return;
  }
  const dl = MATCH.players[MATCH.phase === 'redraw' ? MATCH.runner : MATCH.setup].label;
  const kl = MATCH.players[MATCH.phase === 'redeck' ? 1 - MATCH.runner : MATCH.setup].label;
  $('#drawTitle').innerHTML = `<span class="pill p1">${dl}</span> プレイヤー${dl}のキャラを${MATCH.phase === 'redraw' ? '描き直そう' : '描こう'}`;
  $('#drawSub').textContent = 'ランナーになったときに使うキャラです。相手に見えないように描くと盛り上がります。';
  $('#btnGo').textContent = MATCH.phase === 'redraw' ? '描き直し完了' : `次へ：プレイヤー${dl}のカード選び`;
  $('#deckTitle').innerHTML = `<span class="pill p2">${kl}</span> プレイヤー${kl}のカードを選ぼう`;
  $('#deckSub').textContent = 'ビルダーになったときに使うデッキです。69種類から8枚まで選べます（特殊は2枚まで）。';
  $('#btnDeckGo').textContent = MATCH.phase === 'redeck' ? 'このデッキで次のラウンドへ' : MATCH.setup === 0 ? '次へ：プレイヤーBのキャラ' : 'マッチ開始';
}
function updateRoleLabels() {
  $('#bbHint').textContent = COOP ? 'ゲーム画面をクリックしてブロックや道具を使う。点線の場所に近づけると自動でぴったり合う。扉のスイッチはカーソルを合わせたまま長押し。ホイールか1〜8キーでカード切り替え'
    : 'ビルダー側の画面でクリック配置・ドラッグで描く。1〜8キーでカード切り替え。ホイール・右ドラッグ・ミニマップで視点移動';
  $('#btnBView').hidden = COOP;
  $('#atkHint').hidden = COOP; $('#coopNoAtk').hidden = !COOP;
  $('#runnerWho').textContent = MATCH.on ? `ランナー：プレイヤー${roleWho('runner').label}` : 'ランナー';
  $('#builderWho').textContent = COOP ? `サポーター（相手：消しゴム大王・${CPU_LV[COOP_LV].name}）` : MATCH.on ? `ビルダー：プレイヤー${roleWho('builder').label}` : 'ビルダー';
}
function startCoop() {
  SFX.init(); COOP = true; MATCH.on = false; updateScoreUI(); updateRoleLabels();
  if (storyCH) { storySel = Math.min(storySave[COOP_LV].open - 1, STORY.length - 1); showStory(); }
  else { setSetupTexts(); show('scr-draw'); }
}
function showStory() {
  const sv = storySave[COOP_LV];
  storySel = clamp(storySel, 0, EX_IDX);
  $$('.lv-pick .btn').forEach(x => x.classList.toggle('on', x.dataset.lv === COOP_LV));
  const grid = $('#storyGrid'); grid.innerHTML = '';
  STORY.forEach((st, i) => {
    const locked = i >= sv.open;
    const b = document.createElement('button');
    b.className = 'page-card' + (locked ? ' locked' : '') + (i === storySel ? ' sel' : '');
    b.style.borderTop = `8px solid ${BGS[st.bg].sky[0]}`;
    b.innerHTML = `<span class="pc-no">ページ${i + 1}</span><span class="pc-name hand">${st.name}</span><span class="pc-rank">${locked ? 'ロック中' : sv.ranks[i] ? 'ベスト ランク' + sv.ranks[i] : '未クリア'}</span>${locked ? '' : `<span class="pc-medal">${medalHtml(sv.medals && sv.medals[i])}</span>`}`;
    b.addEventListener('click', () => { storySel = i; showStory(); });
    grid.appendChild(b);
  });
  {
    const ok = exUnlocked(), eb = document.createElement('button');
    eb.className = 'page-card ex' + (ok ? '' : ' locked') + (storySel === EX_IDX ? ' sel' : '');
    const gold = STORY.filter((_, i) => ['gold', 'rainbow'].includes(bestMedal(sv.medals && sv.medals[i]))).length;
    eb.innerHTML = `<span class="pc-no">EXステージ</span><span class="pc-name hand">${ok ? EX_PAGE.name : '？？？'}</span><span class="pc-rank">${ok ? (sv.ranks[EX_IDX] ? 'ベスト ランク' + sv.ranks[EX_IDX] : '未クリア') : `全ページで金メダル以上を取ると解放（いま ${gold} / ${STORY.length}）`}</span>${ok ? `<span class="pc-medal">${medalHtml(sv.medals && sv.medals[EX_IDX])}</span>` : ''}`;
    eb.addEventListener('click', () => { storySel = EX_IDX; showStory(); });
    grid.appendChild(eb);
  }
  const st = pageDef(storySel), locked = storySel === EX_IDX ? !exUnlocked() : storySel >= sv.open;
  const counts = {}; st.kinds.forEach(k => { counts[k] = (counts[k] || 0) + 1; });
  const meta = Object.entries(counts).map(([k, n]) => `${KIND_JP[k]}×${n}`).join('・') + (st.cave ? '・低い天井' : '') + (st.erase ? '・地面けし' : '') + (st.boss ? '・ボス戦' : '');
  $('#storyIntro').innerHTML = `<div class="si-head"><span class="si-page">${pageLabel(storySel)}</span><h3 class="hand">${locked && st.ex ? '？？？' : st.name}</h3></div>
    <div class="si-text">${locked ? (st.ex ? '<p>全8ページで金メダル以上を取ると解放されます。とても難しいページです。</p>' : '<p>前のページをクリアすると読めます。</p>') : st.story.map(t => `<p>${t}</p>`).join('')}</div>
    <p class="si-meta">関門：${meta}　制限時間：${st.time}秒　大王の強さ：${CPU_LV[COOP_LV].name}</p>
    ${locked ? '' : `<p class="si-hint">ヒント：${st.hint}</p><p class="si-medal">${medalHtml(sv.medals && sv.medals[storySel])}<small>${(k => k ? `いまは${MEDAL_JP[k][0]}メダル　` : '')(bestMedal(sv.medals && sv.medals[storySel]))}銀＝クリア　金＝Sランク　虹＝ノーダメージでクリア</small></p>`}
    <button class="btn blue big" id="btnStoryGo"${locked ? ' disabled' : ''}>${locked ? 'ロック中' : 'このページをはじめる'}</button>`;
  $('#btnStoryGo').addEventListener('click', () => { if (storySel === EX_IDX ? exUnlocked() : storySel < storySave[COOP_LV].open) startStoryPage(storySel); });
  $('#storyProg').textContent = `クリア ${sv.ranks.slice(0, STORY.length).filter(Boolean).length} / ${STORY.length} ページ`;
  updateScoreUI();
  if (curScreen !== 'scr-story') show('scr-story');
}
function startStoryPage(i) { storyIdx = i; CH = storyCH; startCoopGame(); }
function showEnding() {
  const sv = storySave[COOP_LV];
  const spr = storyStrokes ? bigSprite(storyStrokes, 220, 180) : null;
  $('#endingChar').src = (spr || storyCH.spr).toDataURL();
  $('#endingText').innerHTML = ENDING.map(t => `<p>${t}</p>`).join('') + `<p class="end-lv">大王の強さ「${CPU_LV[COOP_LV].name}」で全${STORY.length}ページをクリア！</p>`;
  $('#endingRanks').innerHTML = STORY.map((st, i) => `<span class="hchip a"><b>ページ${i + 1}　ランク ${sv.ranks[i] || '—'}</b><small>${st.name}</small>${medalHtml(sv.medals && sv.medals[i])}</span>`).join('');
  show('scr-ending'); SFX.win();
}
$('#btnStoryRedraw').addEventListener('click', () => { setSetupTexts(); show('scr-draw'); });
$('#btnDbgUnlock').addEventListener('click', () => { storySave[COOP_LV].open = STORY.length; saveStory(); showStory(); });
$('#btnDbgMedal').addEventListener('click', () => { const sv = storySave[COOP_LV]; sv.open = STORY.length; STORY.forEach((_, i) => { sv.ranks[i] = 'S'; sv.medals[i] = { silver: true, gold: true, rainbow: true }; }); saveStory(); showStory(); });
let dbgResetArm = 0;
$('#btnDbgReset').addEventListener('click', e => {
  const b = e.currentTarget;
  // 2回押しで確定（うっかり消さないように）
  if (Date.now() - dbgResetArm > 3000) { dbgResetArm = Date.now(); b.textContent = 'もう一度押すとリセット'; setTimeout(() => { if (Date.now() - dbgResetArm >= 3000) b.textContent = '記録リセット'; }, 3100); return; }
  dbgResetArm = 0; b.textContent = '記録リセット';
  storySave[COOP_LV] = newSave(); saveStory(); storySel = 0; showStory();
});
$('#btnStoryTitle').addEventListener('click', () => quitToTitle());
$('#btnEndMap').addEventListener('click', () => { storySel = STORY.length - 1; showStory(); });
$('#btnEndTitle').addEventListener('click', () => quitToTitle());
$('#btnNextPage').addEventListener('click', () => {
  $('#result').classList.add('hidden');
  if (storyIdx >= STORY.length - 1) showEnding(); else startStoryPage(storyIdx + 1);
});
$('#btnStoryMap').addEventListener('click', () => { $('#result').classList.add('hidden'); storySel = storyIdx; showStory(); });
function startCoopGame() {
  DECK = SUPPORT_DECK.slice();
  SFX.init(); updateRoleLabels();
  show('scr-game'); buildToolbar(); resizeGame(); resetRound();
  $('#btnPause').textContent = 'ポーズ';
  gcv.focus({ preventScroll: true });
}
$('#btnCoop').addEventListener('click', startCoop);
$$('.lv-pick .btn').forEach(b => b.addEventListener('click', () => { COOP_LV = b.dataset.lv; $$('.lv-pick .btn').forEach(x => x.classList.toggle('on', x.dataset.lv === COOP_LV)); updateRoleLabels(); if (curScreen === 'scr-story') showStory(); }));
function scoreHtml() {
  const [a, b] = MATCH.players;
  return `<span class="pa">プレイヤーA</span> <b>${a.wins}</b> − <b>${b.wins}</b> <span class="pb">プレイヤーB</span>　<small>${MATCH.target}本先取</small>`;
}
function updateScoreUI() {
  $('#scoreBox').innerHTML = (COOP && NET.role) ? `オンライン協力（${CPU_LV[COOP_LV].name}）　あなたは<b>${NET.role === 'host' ? 'P1ランナー' : 'P2サポーター'}</b>` : COOP ? `協力ストーリー（${CPU_LV[COOP_LV].name}）　クリア <b>${storySave[COOP_LV].ranks.slice(0, STORY.length).filter(Boolean).length}</b> / ${STORY.length}ページ`
    : MATCH.on ? scoreHtml()
    : `通算 <span class="r">ランナー</span> <b>${SCORE.runner}</b> − <b>${SCORE.builder}</b> <span class="b">ビルダー</span>`;
}
const isMatchPoint = () => MATCH.players.some(p => p.wins === MATCH.target - 1);
function showSwap() {
  const r = roleWho('runner'), b = roleWho('builder');
  $('#swapRound').textContent = `ラウンド ${MATCH.round}`;
  $('#swapScore').innerHTML = scoreHtml();
  $('#swapRunner').textContent = `プレイヤー${r.label}`;
  $('#swapBuilder').textContent = `プレイヤー${b.label}`;
  const cv = $('#swapChar'), cx = cv.getContext('2d'); cx.clearRect(0, 0, cv.width, cv.height);
  if (r.ch) { const spr = r.ch.spr, k = Math.min(130 / spr.width, 130 / spr.height); cx.drawImage(spr, (160 - spr.width * k) / 2, (160 - spr.height * k) / 2, spr.width * k, spr.height * k); }
  $('#swapRunnerSub').textContent = r.ch ? `${r.ch.name}　体力${r.ch.stats.hp}・速さ${r.ch.stats.spd}・攻撃${r.ch.stats.atk}` : '';
  const dk = $('#swapDeck'); dk.innerHTML = '';
  b.deck.forEach(id => { const c = document.createElement('canvas'); c.width = 96; c.height = 70; c.title = CARD[id].name; dk.appendChild(c); iconCanvas(c, id, 48, 35); });
  $('#swapNote').textContent = (MATCH.round === 1
    ? `プレイヤー${r.label}はキーボード、プレイヤー${b.label}はマウスを持ってください`
    : `席を交代！ プレイヤー${r.label}がキーボード、プレイヤー${b.label}がマウスです`) + (isMatchPoint() ? '　マッチポイント！' : '');
  show('scr-swap');
}
function startRound() {
  CH = roleWho('runner').ch; DECK = roleWho('builder').deck.slice();
  if (!CH || !DECK.length) return;
  SFX.init(); updateRoleLabels();
  show('scr-game'); buildToolbar(); resizeGame(); resetRound();
  $('#btnPause').textContent = 'ポーズ';
  gcv.focus({ preventScroll: true });
}
function quitToTitle() { if (NET.role) netClose(true); $('#btnPause').textContent = 'ポーズ'; $('#btnTitle').textContent = 'タイトルへ'; $('#result').classList.add('hidden'); $('#pauseMenu').classList.add('hidden'); MATCH.on = false; COOP = false; updateScoreUI(); updateRoleLabels(); show('scr-title'); }
$('#btnMatch').addEventListener('click', startMatch);
$$('.target-pick .btn').forEach(b => b.addEventListener('click', () => {
  MATCH.target = +b.dataset.t;
  $$('.target-pick .btn').forEach(x => x.classList.toggle('on', +x.dataset.t === MATCH.target));
  $('#matchTitle').textContent = `${MATCH.target}本先取マッチ`; $('#targetLabel').textContent = MATCH.target;
}));
$('#btnRoundGo').addEventListener('click', startRound);
$('#btnSwapDeck').addEventListener('click', () => { MATCH.phase = 'redeck'; DECK = roleWho('builder').deck.slice(); setSetupTexts(); show('scr-deck'); refreshDeckUI(); });
$('#btnSwapDraw').addEventListener('click', () => { MATCH.phase = 'redraw'; beginDrawFor(MATCH.runner, true); });
$('#btnSwapQuit').addEventListener('click', quitToTitle);
$('#btnNextRound').addEventListener('click', () => { if (netBusyGuard()) return; $('#result').classList.add('hidden'); MATCH.round++; MATCH.runner = 1 - MATCH.runner; if (NET.role) netOnlineRound(); else showSwap(); });
$('#btnRematch').addEventListener('click', () => {
  if (netBusyGuard()) return;
  $('#result').classList.add('hidden');
  MATCH.players.forEach(p => { p.wins = 0; });
  Object.assign(MATCH, { over: false, round: 1, runner: 0, phase: 'play', history: [] });
  updateScoreUI(); if (NET.role) netOnlineRound(); else showSwap();
});
