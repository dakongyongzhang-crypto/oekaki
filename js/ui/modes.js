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
    $('#deckSub').textContent = '64種類から8枚まで選びます（特殊は2枚まで）。選んだ順に1〜8キーへ割り当てられます。';
    $('#btnDeckGo').textContent = 'このデッキで対戦開始';
    return;
  }
  const dl = MATCH.players[MATCH.phase === 'redraw' ? MATCH.runner : MATCH.setup].label;
  const kl = MATCH.players[MATCH.phase === 'redeck' ? 1 - MATCH.runner : MATCH.setup].label;
  $('#drawTitle').innerHTML = `<span class="pill p1">${dl}</span> プレイヤー${dl}のキャラを${MATCH.phase === 'redraw' ? '描き直そう' : '描こう'}`;
  $('#drawSub').textContent = 'ランナーになったときに使うキャラです。相手に見えないように描くと盛り上がります。';
  $('#btnGo').textContent = MATCH.phase === 'redraw' ? '描き直し完了' : `次へ：プレイヤー${dl}のカード選び`;
  $('#deckTitle').innerHTML = `<span class="pill p2">${kl}</span> プレイヤー${kl}のカードを選ぼう`;
  $('#deckSub').textContent = 'ビルダーになったときに使うデッキです。64種類から8枚まで選べます（特殊は2枚まで）。';
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
  if (storyCH) { storySel = 0; showStory(); }
  else { setSetupTexts(); show('scr-draw'); }
}
// 冒険の記録：15ステージの道のり（クリア済み・いまのステージ）と、つづきから／最初から。EXステージは別に1回ずつ遊ぶ
// storySel：0 = 冒険 / EX_IDX = EXステージ
const boostSummary = run => Object.keys(BOOSTS).filter(k => run.boosts[k]).map(k => `<span class="rw-chip ${BOOSTS[k].who}">${BOOSTS[k].mark} ${BOOSTS[k].name}${run.boosts[k] > 1 ? ' ×' + run.boosts[k] : ''}</span>`).join('') || '<span class="rw-none">まだなし</span>';
function deckIconsHtml(deck) { return deck.map(id => `<span class="rw-card" data-id="${id}"><canvas width="96" height="64"></canvas><small>${CARD[id].name}</small></span>`).join(''); }
function drawDeckIcons(root) { root.querySelectorAll('.rw-card').forEach(el => iconCanvas(el.querySelector('canvas'), el.dataset.id, 48, 32)); }
function showStory() {
  const sv = storySave[COOP_LV], run = sv.run;
  if (storySel !== EX_IDX) storySel = 0;
  $$('.lv-pick .btn').forEach(x => x.classList.toggle('on', x.dataset.lv === COOP_LV));
  const grid = $('#storyGrid'); grid.innerHTML = '';
  const cur = run ? run.stage : -1;
  STORY.forEach((st, i) => {
    const b = document.createElement('div');
    const done = run ? i < cur : false, now = i === cur;
    b.className = 'page-card run-card' + (now ? ' sel' : '') + (!done && !now ? ' locked' : '');
    b.style.borderTop = `8px solid ${BGS[st.bg].sky[0]}`;
    b.innerHTML = `<span class="pc-no">ステージ${i + 1}${st.boss ? '　ボス' : ''}</span><span class="pc-name hand">${st.name}</span><span class="pc-rank">${now ? (run.pending ? 'ごほうびをえらぶ' : 'つぎはここ') : done ? 'クリア' : sv.ranks[i] ? 'ベスト ランク' + sv.ranks[i] : '　'}</span>${sv.medals && sv.medals[i] ? `<span class="pc-medal">${medalHtml(sv.medals[i])}</span>` : ''}`;
    b.addEventListener('click', () => { storySel = 0; showStory(); });
    grid.appendChild(b);
  });
  {
    const ok = exUnlocked(), eb = document.createElement('button');
    eb.className = 'page-card ex' + (ok ? '' : ' locked') + (storySel === EX_IDX ? ' sel' : '');
    eb.innerHTML = `<span class="pc-no">EXステージ</span><span class="pc-name hand">${ok ? EX_PAGE.name : '？？？'}</span><span class="pc-rank">${ok ? (sv.ranks[EX_IDX] ? 'ベスト ランク' + sv.ranks[EX_IDX] : '未クリア') : '15ステージの冒険を最後までクリアすると解放'}</span>${ok ? `<span class="pc-medal">${medalHtml(sv.medals && sv.medals[EX_IDX])}</span>` : ''}`;
    eb.addEventListener('click', () => { storySel = storySel === EX_IDX ? 0 : EX_IDX; showStory(); });
    grid.appendChild(eb);
  }
  const intro = $('#storyIntro');
  if (storySel === EX_IDX) {
    const st = EX_PAGE, locked = !exUnlocked();
    intro.innerHTML = `<div class="si-head"><span class="si-page">EXステージ</span><h3 class="hand">${locked ? '？？？' : st.name}</h3></div>
      <div class="si-text">${locked ? '<p>15ステージの冒険を最後までクリアすると解放されます。とても難しいステージです。</p>' : st.story.map(t => `<p>${t}</p>`).join('')}</div>
      ${locked ? '' : `<p class="si-meta">制限時間：${st.time}秒　大王の強さ：${CPU_LV[COOP_LV].name}　サポーターはすべてのカードを使えます（冒険のごほうびは使いません）</p><p class="si-hint">ヒント：${st.hint}</p>`}
      <div class="si-btns"><button class="btn blue big" id="btnStoryGo"${locked ? ' disabled' : ''}>${locked ? 'ロック中' : 'EXステージに挑戦'}</button><button class="btn" id="btnStoryBack">冒険にもどる</button></div>`;
    $('#btnStoryGo').addEventListener('click', () => { if (exUnlocked()) startStoryPage(EX_IDX); });
    $('#btnStoryBack').addEventListener('click', () => { storySel = 0; showStory(); });
  } else {
    const i = run ? run.stage : 0, st = STORY[i];
    const counts = {}; st.kinds.forEach(k => { counts[k] = (counts[k] || 0) + 1; });
    const meta = Object.entries(counts).map(([k, n]) => `${KIND_JP[k]}×${n}`).join('・') + (st.cave ? '・低い天井' : '') + (st.erase ? '・地面けし' : '') + (st.boss ? '・ボス戦' : '');
    const deck = run ? run.deck : START_DECK;
    intro.innerHTML = `<div class="si-head"><span class="si-page">${run ? `冒険のつづき：ステージ${i + 1} / ${STORY.length}` : '新しい冒険'}</span><h3 class="hand">${st.name}</h3></div>
      <div class="si-text">${st.story.map(t => `<p>${t}</p>`).join('')}</div>
      <p class="si-meta">関門：${meta}　制限時間：${st.time}秒　大王の強さ：${CPU_LV[COOP_LV].name}</p>
      <p class="si-hint">ヒント：${st.hint}</p>
      <div class="si-run"><div><b>サポーターのカード（${deck.length}枚）</b><div class="rw-deck">${deckIconsHtml(deck)}</div></div>
        <div><b>強化</b><div class="rw-boosts">${run ? boostSummary(run) : '<span class="rw-none">ステージをクリアすると、ごほうびで強くなれます</span>'}</div></div></div>
      <div class="si-btns">${run ? `<button class="btn blue big" id="btnRunGo">${run.pending ? 'ごほうびをえらんで、つづける' : `ステージ${i + 1}からつづける`}</button><button class="btn" id="btnRunNew">最初からやり直す</button>` : '<button class="btn blue big" id="btnRunNew">冒険をはじめる（ステージ1から）</button>'}</div>`;
    drawDeckIcons(intro);
    if (run) $('#btnRunGo').addEventListener('click', runContinue);
    $('#btnRunNew').addEventListener('click', () => {
      if (curRun() && !confirm('いまの冒険をやめて、ステージ1からやり直しますか？（集めたカードと強化はなくなります）')) return;
      newRun(); startStoryPage(0);
    });
  }
  $('#storyProg').textContent = run ? `いま ステージ${run.stage + 1} / ${STORY.length}` : sv.cleared ? '冒険クリア済み！' : `全${STORY.length}ステージ`;
  updateScoreUI();
  if (curScreen !== 'scr-story') show('scr-story');
}
function runContinue() { const run = curRun(); if (!run) { newRun(); startStoryPage(0); return; } if (run.pending) showReward(); else startStoryPage(run.stage); }
// ごほうび：3枚の中から1枚えらぶと、次のステージへ
function showReward() {
  const run = curRun(); if (!run) { showStory(); return; }
  if (!run.choices || !run.choices.length) { run.choices = rollRewards(run); saveStory(); }
  $('#rewardTitle').textContent = `ステージ${run.stage} クリア！ ごほうびを1枚えらぼう`;
  $('#rewardSub').textContent = `次はステージ${run.stage + 1}「${STORY[run.stage].name}」。えらんだごほうびは、この冒険のあいだずっと続きます。`;
  const row = $('#rewardRow'); row.innerHTML = '';
  if (!run.choices.length) { // もう選べるものがないとき
    row.innerHTML = '<p class="rw-none">ごほうびは全部そろいました！</p><button class="btn blue big" id="rwSkip">次のステージへ</button>';
    $('#rwSkip').addEventListener('click', () => { run.pending = false; run.choices = null; saveStory(); startStoryPage(run.stage); });
  }
  run.choices.forEach(r => {
    const b = document.createElement('button');
    const isCard = r.type === 'card', bo = !isCard && BOOSTS[r.id];
    b.className = 'rw-pick ' + (isCard ? 'card' : bo.who);
    b.innerHTML = `<span class="rw-kind">${isCard ? 'サポーターのカード' : bo.who === 'runner' ? 'ランナーの強化' : 'サポーターの強化'}</span>
      ${isCard ? '<canvas width="208" height="128"></canvas>' : `<span class="rw-mark">${bo.mark}</span>`}
      <span class="rw-name hand">${rewardName(r)}</span>
      <span class="rw-desc">${isCard ? CARD[r.id].desc : bo.desc}${!isCard && run.boosts[r.id] ? `（いま ${run.boosts[r.id]} → ${run.boosts[r.id] + 1}）` : ''}</span>`;
    if (isCard) iconCanvas(b.querySelector('canvas'), r.id, 104, 64);
    b.addEventListener('click', () => {
      applyReward(run, r); run.pending = false; run.choices = null; saveStory();
      SFX.pick(); startStoryPage(run.stage);
    });
    row.appendChild(b);
  });
  $('#rewardHave').innerHTML = `<div><b>サポーターのカード（${run.deck.length}枚）</b><div class="rw-deck">${deckIconsHtml(run.deck)}</div></div><div><b>強化</b><div class="rw-boosts">${boostSummary(run)}</div></div>`;
  drawDeckIcons($('#rewardHave'));
  show('scr-reward');
}
function startStoryPage(i) { storyIdx = i; CH = runCharacter(storyCH); startCoopGame(); } // 冒険中はランナーの強化を反映したキャラで
function showEnding() {
  const sv = storySave[COOP_LV];
  const spr = storyStrokes ? bigSprite(storyStrokes, 220, 180) : null;
  $('#endingChar').src = (spr || storyCH.spr).toDataURL();
  $('#endingText').innerHTML = ENDING.map(t => `<p>${t}</p>`).join('') + `<p class="end-lv">大王の強さ「${CPU_LV[COOP_LV].name}」で全${STORY.length}ステージをクリア！ EXステージが解放されました</p>`;
  $('#endingRanks').innerHTML = STORY.map((st, i) => `<span class="hchip a"><b>ステージ${i + 1}　ランク ${sv.ranks[i] || '—'}</b><small>${st.name}</small>${medalHtml(sv.medals && sv.medals[i])}</span>`).join('');
  show('scr-ending'); SFX.win();
}
$('#btnStoryRedraw').addEventListener('click', () => { setSetupTexts(); show('scr-draw'); });
$('#btnDbgUnlock').addEventListener('click', () => { storySave[COOP_LV].cleared = true; saveStory(); showStory(); });
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
$('#btnEndMap').addEventListener('click', () => { storySel = 0; showStory(); });
$('#btnEndTitle').addEventListener('click', () => quitToTitle());
$('#btnNextPage').addEventListener('click', () => {
  $('#result').classList.add('hidden');
  if (storyIdx >= STORY.length - 1) showEnding(); else showReward();
});
$('#btnStoryMap').addEventListener('click', () => { $('#result').classList.add('hidden'); storySel = storyIdx === EX_IDX ? EX_IDX : 0; showStory(); });
function startCoopGame() {
  DECK = inRun() ? curRun().deck.slice() : SUPPORT_DECK.slice(); // 冒険中は集めたカードだけ（EXステージは全部）
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
  $('#scoreBox').innerHTML = (COOP && NET.role) ? `オンライン協力（${CPU_LV[COOP_LV].name}）　あなたは<b>${NET.role === 'host' ? 'P1ランナー' : 'P2サポーター'}</b>` : COOP ? `協力ストーリー（${CPU_LV[COOP_LV].name}）　${storySave[COOP_LV].run ? `いま ステージ<b>${storySave[COOP_LV].run.stage + 1}</b> / ${STORY.length}` : storySave[COOP_LV].cleared ? '冒険クリア済み' : `全${STORY.length}ステージ`}`
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
/* ---------- キャラを描く画面・カードを選ぶ画面の「戻る」「タイトルへ」 ----------
   オンラインは相手と準備がつながっているので「タイトルへ」だけ（確認してから接続を切る） */
function drawBackTarget() {
  if (NET.role) return null;
  if (COOP) return storyCH ? 'story' : null; // ストーリーの「キャラを描き直す」から来たとき
  if (MATCH.on) { if (MATCH.phase === 'redraw') return 'swap'; if (MATCH.setup === 1) return 'deckA'; }
  return null; // 最初の画面（戻る先はタイトルだけ）
}
function deckBackTarget() {
  if (NET.role) return null;
  if (MATCH.on && MATCH.phase === 'redeck') return 'swap';
  return 'draw';
}
function updateSetupNav() {
  const d = drawBackTarget(), k = deckBackTarget();
  $('#btnDrawBack').hidden = !d; $('#btnDeckBack').hidden = !k;
  $('#btnDrawBack').textContent = { story: '◀ 冒険の記録へ', swap: '◀ 戻る', deckA: '◀ プレイヤーAのカード選び' }[d] || '◀ 戻る';
  $('#btnDeckBack').textContent = k === 'swap' ? '◀ 戻る' : '◀ キャラを描く';
}
function setupToTitle() {
  if (NET.role && !confirm('オンラインの接続が切れます。タイトルに戻りますか？')) return;
  quitToTitle();
}
$('#btnDrawBack').addEventListener('click', () => {
  const d = drawBackTarget();
  if (d === 'story') showStory();
  else if (d === 'swap') { MATCH.phase = 'play'; showSwap(); }
  else if (d === 'deckA') { MATCH.setup = 0; DECK = MATCH.players[0].deck.slice(); setSetupTexts(); show('scr-deck'); refreshDeckUI(); }
});
$('#btnDeckBack').addEventListener('click', () => {
  const k = deckBackTarget();
  if (k === 'swap') { MATCH.phase = 'play'; showSwap(); return; }
  if (MATCH.on) { MATCH.players[MATCH.setup].deck = DECK.slice(); beginDrawFor(MATCH.setup, true); return; } // 選んだカードは覚えておく
  setSetupTexts(); show('scr-draw'); redrawDrawing(); analyzeAndShow(); // フリー：描いた絵はそのまま
});
$('#btnDrawTitle').addEventListener('click', setupToTitle);
$('#btnDeckTitle').addEventListener('click', setupToTitle);
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
