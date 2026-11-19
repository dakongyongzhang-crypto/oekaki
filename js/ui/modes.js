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
// 冒険のマップ：分かれ道を自分でえらんで、15階のボスをめざす。EXステージは別に1回ずつ遊ぶ
// storySel：0 = 冒険 / EX_IDX = EXステージ。mapSel = マップでえらんでいるマス
let mapSel = null;
const boostSummary = run => Object.keys(BOOSTS).filter(k => run.boosts[k]).map(k => `<span class="rw-chip ${BOOSTS[k].who}">${BOOSTS[k].mark} ${BOOSTS[k].name}${BOOSTS[k].who === 'runner' ? (run.boosts[k] > 1 ? ` <b class="tlv">${stars(Math.min(3, run.boosts[k]) - 1)}</b>` : '') : run.boosts[k] > 1 ? ' ×' + run.boosts[k] : ''}</span>`).join('') || '<span class="rw-none">まだなし</span>';
function deckIconsHtml(deck, ups = {}) { return deck.map(id => `<span class="rw-card" data-id="${id}"><canvas width="96" height="64"></canvas><small>${CARD[id].name}${ups[id] ? `<b class="tlv">${stars(ups[id])}</b>` : ''}</small></span>`).join(''); }
function drawDeckIcons(root) { root.querySelectorAll('.rw-card').forEach(el => iconCanvas(el.querySelector('canvas'), el.dataset.id, 48, 32)); }
// マップ（左から右へ1〜15階。線でつながったマスにだけ進める）
function mapHtml(run) {
  const reach = mapReachable(run), path = run.path || [], W = STORY.length * 100, H = MAP_ROWS * 100;
  const edges = new Set(); for (let k = 0; k + 1 < path.length; k++) edges.add(path[k] + '-' + path[k + 1]);
  const pt = n => [n.f * 100 + 50, n.y * 100 + 50];
  let lines = '';
  for (const n of mapNodes(run)) for (const id of n.next) {
    const m = mapNode(run, id), [x1, y1] = pt(n), [x2, y2] = pt(m);
    const cls = edges.has(n.id + '-' + m.id) ? 'on' : (run.pos === n.id && reach.includes(m.id)) ? 'can' : n.f < run.stage - 1 ? 'past' : '';
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
  }
  const nodes = mapNodes(run).map(n => {
    const t = NODE_T[n.type], cls = ['mnode', n.type, path.includes(n.id) ? 'done' : '', reach.includes(n.id) ? 'reach' : '', n.id === mapSel ? 'sel' : '', n.id === run.cur ? 'cur' : '', n.f < run.stage && !path.includes(n.id) ? 'past' : ''].join(' ');
    return `<button class="${cls}" data-id="${n.id}" style="left:${(n.f + 0.5) / STORY.length * 100}%;top:${(n.y + 0.5) / MAP_ROWS * 100}%" title="${n.f + 1}階：${t.name}">${t.mark}</button>`;
  }).join('');
  const labels = STORY.map((_, f) => `<span class="mfl${f === run.stage ? ' now' : ''}" style="left:${(f + 0.5) / STORY.length * 100}%">${f + 1}</span>`).join('');
  return `<div class="run-map"><div class="rm-in"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${lines}</svg>${nodes}${labels}</div>
    <div class="rm-legend">${Object.keys(NODE_T).map(k => `<span><i class="mnode ${k}">${NODE_T[k].mark}</i>${NODE_T[k].name}</span>`).join('')}</div></div>`;
}
// マスの説明（ステージのマスは、関門・時間・ヒントも）
function nodeInfoHtml(nd) {
  const t = NODE_T[nd.type];
  if (nd.type !== 'stage' && nd.type !== 'elite' && nd.type !== 'boss') return `<div class="si-text"><p>${t.desc}</p></div>`;
  const st = makeNodePage(nd), counts = {}; st.kinds.forEach(k => { counts[k] = (counts[k] || 0) + 1; });
  const meta = Object.entries(counts).map(([k, n]) => `${KIND_JP[k]}×${n}`).join('・') + (st.cave ? '・低い天井' : '') + (st.erase ? '・地面けし' : '') + (st.boss ? '・ボス戦' : '');
  return `<div class="si-text">${nd.type === 'elite' ? `<p class="si-elite">${t.desc}</p>` : ''}${st.story.map(x => `<p>${x}</p>`).join('')}</div>
    <p class="si-meta">関門：${meta}　制限時間：${st.time}秒　大王の強さ：${CPU_LV[COOP_LV].name}${nd.type === 'elite' ? '（強敵）' : ''}</p><p class="si-hint">ヒント：${st.hint}</p>`;
}
function showStory() {
  const sv = storySave[COOP_LV], run = ensureRunMap(sv.run);
  if (storySel !== EX_IDX) storySel = 0;
  $$('.lv-pick .btn').forEach(x => x.classList.toggle('on', x.dataset.lv === COOP_LV));
  const grid = $('#storyGrid'); grid.innerHTML = '';
  const reach = run ? mapReachable(run) : [];
  if (run) {
    const cur = mapNode(run, mapSel);
    if (!cur || (cur.f < run.stage && !reach.includes(cur.id))) mapSel = reach.length ? reach[0] : null;
    grid.insertAdjacentHTML('beforeend', mapHtml(run));
    grid.querySelectorAll('.run-map .rm-in .mnode').forEach(b => b.addEventListener('click', () => { mapSel = +b.dataset.id; storySel = 0; showStory(); }));
  }
  {
    const ok = exUnlocked(), eb = document.createElement('button');
    eb.className = 'page-card ex' + (ok ? '' : ' locked') + (storySel === EX_IDX ? ' sel' : '');
    eb.innerHTML = `<span class="pc-no">EXステージ</span><span class="pc-name hand">${ok ? EX_PAGE.name : '？？？'}</span><span class="pc-rank">${ok ? (sv.ranks[EX_IDX] ? 'ベスト ランク' + sv.ranks[EX_IDX] : '未クリア') : '15階の冒険を最後までクリアすると解放'}</span>${ok ? `<span class="pc-medal">${medalHtml(sv.medals && sv.medals[EX_IDX])}</span>` : ''}`;
    eb.addEventListener('click', () => { storySel = storySel === EX_IDX ? 0 : EX_IDX; showStory(); });
    grid.appendChild(eb);
  }
  const intro = $('#storyIntro');
  if (storySel === EX_IDX) {
    const st = EX_PAGE, locked = !exUnlocked();
    intro.innerHTML = `<div class="si-head"><span class="si-page">EXステージ</span><h3 class="hand">${locked ? '？？？' : st.name}</h3></div>
      <div class="si-text">${locked ? '<p>15階の冒険を最後までクリアすると解放されます。とても難しいステージです。</p>' : st.story.map(t => `<p>${t}</p>`).join('')}</div>
      ${locked ? '' : `<p class="si-meta">制限時間：${st.time}秒　大王の強さ：${CPU_LV[COOP_LV].name}　サポーターは基本の8枚のカードを使います（冒険のごほうびは使いません）</p><p class="si-hint">ヒント：${st.hint}</p>`}
      <div class="si-btns"><button class="btn blue big" id="btnStoryGo"${locked ? ' disabled' : ''}>${locked ? 'ロック中' : 'EXステージに挑戦'}</button><button class="btn" id="btnStoryBack">冒険にもどる</button></div>`;
    $('#btnStoryGo').addEventListener('click', () => { if (exUnlocked()) startStoryPage(EX_IDX); });
    $('#btnStoryBack').addEventListener('click', () => { storySel = 0; showStory(); });
  } else if (!run) {
    intro.innerHTML = `<div class="si-head"><span class="si-page">新しい冒険</span><h3 class="hand">消しゴム大王をとめろ！</h3></div>
      <div class="si-text"><p>ノートの中の分かれ道を、2人で進む冒険。どの道を通るかは自分たちで決めよう。</p>
        <p>ふつうのステージ・強敵・休けい・たからばこ・ふしぎなマス…。5階はどの道でもたからばこ。8階と15階には消しゴム大王が待っている。</p></div>
      <div class="si-run"><div><b>サポーターのカード（${START_DECK.length}枚）</b><div class="rw-deck">${deckIconsHtml(START_DECK)}</div></div>
        <div><b>強化</b><div class="rw-boosts"><span class="rw-none">ステージをクリアすると、ごほうびで強くなれます</span></div></div></div>
      <div class="si-btns"><button class="btn blue big" id="btnRunNew">冒険をはじめる（マップを作る）</button></div>`;
    drawDeckIcons(intro);
    $('#btnRunNew').addEventListener('click', () => { newRun(); mapSel = null; SFX.pick(); showStory(); });
  } else {
    const nd = mapNode(run, mapSel), t = nd && NODE_T[nd.type], canGo = nd && reach.includes(nd.id) && !run.pending;
    const name = !nd ? '' : (nd.type === 'stage' || nd.type === 'elite' || nd.type === 'boss') ? makeNodePage(nd).name : t.name;
    const go = run.pending ? '<button class="btn blue big" id="btnRunGo">ごほうびをえらぶ</button>'
      : canGo ? `<button class="btn blue big" id="btnRunGo">${run.cur === nd.id ? 'もう一度挑戦する' : `${nd.f + 1}階「${name}」へ進む`}</button>`
      : `<button class="btn big" disabled>${nd && nd.f < run.stage ? 'もう通りすぎたマス' : 'ここへはまだ進めない'}</button>`;
    intro.innerHTML = `<div class="si-head"><span class="si-page">${nd ? `${nd.f + 1}階 / ${STORY.length}　${t.name}` : ''}</span><h3 class="hand">${name}</h3></div>
      <div class="si-btns">${go}<button class="btn" id="btnRunNew">最初からやり直す</button></div>
      ${nd ? nodeInfoHtml(nd) : ''}
      <p class="si-note">${run.pending ? 'ごほうびをえらんでから、次のマスへ進もう。' : run.cur != null ? 'さっき負けたマスに、もう一度挑戦しよう。' : '光っているマスが、次に進めるマスです。マスをタップすると説明が見られます。'}</p>
      <div class="si-run"><div><b>サポーターのカード（${run.deck.length}枚）</b><div class="rw-deck">${deckIconsHtml(run.deck, run.ups)}</div></div>
        <div><b>強化</b><div class="rw-boosts">${boostSummary(run)}</div></div></div>`;
    drawDeckIcons(intro);
    const bg = $('#btnRunGo'); if (bg) bg.addEventListener('click', () => { if (run.pending) showReward(); else enterNode(nd); });
    $('#btnRunNew').addEventListener('click', () => {
      if (!confirm('いまの冒険をやめて、最初からやり直しますか？（マップ・集めたカード・強化はなくなります）')) return;
      sv.run = null; saveStory(); mapSel = null; showStory();
    });
  }
  $('#storyProg').textContent = run ? `いま ${Math.min(STORY.length, run.stage + 1)}階 / ${STORY.length}` : sv.cleared ? '冒険クリア済み！' : `全${STORY.length}階`;
  updateScoreUI();
  if (curScreen !== 'scr-story') show('scr-story');
}
// マスに入る：ステージなら始める。ほかのマスは、その場でごほうび・休けい・ふしぎ
function enterNode(nd) {
  const run = curRun(); if (!run || !nd || !mapReachable(run).includes(nd.id)) return;
  SFX.pick();
  if (nd.type === 'stage' || nd.type === 'elite' || nd.type === 'boss') { run.cur = nd.id; saveStory(); setNodePage(nd); startStoryPage(nd.f); return; }
  completeNode(run, nd); run.pending = true; run.choices = null; run.extra = 0; run.evt = null;
  if (nd.type === 'rest') { run.choices = rollUpgrades(run); run.rwKind = run.choices.length ? 'rest' : 'treasure'; if (!run.choices.length) run.choices = null; }
  else if (nd.type === 'treasure') run.rwKind = 'treasure';
  else { const ev = runEvent(run); run.evt = ev; if (ev.treasure) { run.rwKind = 'treasure'; run.extra = ev.treasure - 1; } else run.rwKind = 'event'; }
  saveStory(); showReward();
}
function runContinue() { const run = curRun(); if (run && run.pending) showReward(); else showStory(); }
// ごほうび：3枚の中から1枚えらぶと、次のステージへ
// オンライン：ホストがえらんでいる様子を、ゲスト（サポーター）の画面にも同じように見せる
const rewardOnline = () => (NET.role === 'host' && NET.open && !NET.vsMode) || NET.role === 'guest';
function showReward() {
  const run = curRun(), guest = NET.role === 'guest'; if (!run) { if (!guest) showStory(); return; }
  if (!guest) { NET.rwHov = null; NET.rwPick = null; NET.rwSug = null; }
  const kind = run.rwKind || 'stage', evt = run.evt, left = (run.extra || 0) + 1;
  if (!guest && kind !== 'event' && (!run.choices || !run.choices.length)) { run.choices = kind === 'rest' ? rollUpgrades(run) : rollRewards(run); saveStory(); }
  run.choices = kind === 'event' ? [] : run.choices || [];
  const online = rewardOnline();
  $('#rewardTitle').textContent = evt ? `ふしぎ：${evt.title}` : kind === 'rest' ? '休けい：アップグレードを1つえらぼう' : kind === 'treasure' ? `たからばこ！ ごほうびをえらぼう${left > 1 ? `（あと${left}枚）` : ''}`
    : kind === 'elite' ? `強敵をたおした！ ごほうびをえらぼう（あと${left}枚）` : `${run.stage}階 クリア！ ごほうびを1枚えらぼう`;
  $('#rewardSub').textContent = (evt ? evt.text + '　' : '') + (kind === 'event' ? '' : 'えらんだら、マップで次の道をえらぼう。') + (kind === 'event' ? '' : guest ? '　カードをタップすると、ホストに「これがいい！」と提案できます（決めるのはホスト）' : online ? '　サポーターの提案には「P2のおすすめ」がつきます。えらんでいるカードは相手の画面にも見えます' : '');
  const row = $('#rewardRow'); row.innerHTML = ''; row.classList.toggle('watch', guest);
  if (!run.choices.length) { // ふしぎのマスの結果・もう選べるものがないとき
    row.innerHTML = (kind === 'event' && evt ? `<div class="rw-event">${evt.card ? '<canvas width="208" height="128"></canvas>' : `<span class="rw-mark">${evt.mark || '？'}</span>`}<p>${evt.text}</p></div>` : '<p class="rw-none">ごほうびは全部そろいました！</p>')
      + (guest ? '' : '<button class="btn blue big" id="rwSkip">マップへ</button>');
    if (kind === 'event' && evt && evt.card) iconCanvas(row.querySelector('canvas'), evt.card, 104, 64);
    if (!guest) $('#rwSkip').addEventListener('click', () => { run.pending = false; run.choices = null; run.evt = null; run.extra = 0; saveStory(); mapSel = null; showStory(); });
  }
  run.choices.forEach((r, ci) => {
    const b = document.createElement('button');
    const isCard = r.type === 'card', isUp = r.type === 'up', isRup = r.type === 'rup', bo = (r.type === 'boost' || isRup) && BOOSTS[r.id];
    b.className = 'rw-pick ' + (isCard ? 'card' : isUp ? 'up' : isRup ? 'runner rup' : bo.who);
    let desc;
    if (isCard) desc = CARD[r.id].desc;
    else if (isUp) { const u = CARD_UP[r.id], a = r.lv - 1; desc = `コスト ${u.cost[a]} → <b>${u.cost[r.lv]}</b>／${u.f(u.v[a], a)} → <b>${u.f(u.v[r.lv], r.lv)}</b>`; }
    else if (isRup) { const u = RUN_UP[r.id], a = r.lv - 1; desc = `${u.f(u.v[a], a)} → <b>${u.f(u.v[r.lv], r.lv)}</b>`; }
    else desc = bo.desc + (run.boosts[r.id] ? `（いま ${run.boosts[r.id]} → ${run.boosts[r.id] + 1}）` : '');
    b.innerHTML = `<span class="rw-kind">${isCard ? 'サポーターのカード' : isUp ? 'カードのアップグレード' : isRup ? 'ランナーのアップグレード' : bo.who === 'runner' ? 'ランナーの強化' : 'サポーターの強化'}</span>
      ${isCard || isUp ? '<canvas width="208" height="128"></canvas>' : `<span class="rw-mark">${bo.mark}</span>`}
      <span class="rw-name hand">${isUp ? `${CARD[r.id].name} <b class="tlv">${stars(r.lv)}</b>` : isRup ? `${BOOSTS[r.id].name} <b class="tlv">${stars(r.lv - 1)}</b>` : rewardName(r)}</span>
      <span class="rw-desc">${desc}</span>${online ? '<span class="rw-badges"><i class="p1">P1</i><i class="p2">P2のおすすめ</i></span>' : ''}`;
    if (isCard || isUp) iconCanvas(b.querySelector('canvas'), r.id, 104, 64);
    if (!guest) {
      b.addEventListener('pointerenter', () => rewardHover(ci));
      b.addEventListener('focus', () => rewardHover(ci));
      b.addEventListener('click', () => rewardPick(ci));
    } else b.addEventListener('click', () => rewardSuggest(ci)); // ゲスト：タップで提案
    row.appendChild(b);
  });
  $('#rewardHave').innerHTML = `<div><b>サポーターのカード（${run.deck.length}枚）</b><div class="rw-deck">${deckIconsHtml(run.deck, run.ups)}</div></div><div><b>強化</b><div class="rw-boosts">${boostSummary(run)}</div></div>`;
  drawDeckIcons($('#rewardHave'));
  show('scr-reward');
  markReward();
  if (!guest) netSendReward(); // オンライン：ゲストにも同じごほうびを見せる
}
// えらんでいるカード（hov）・決めたカード（chosen）を光らせる
function markReward() {
  document.querySelectorAll('#rewardRow .rw-pick').forEach((b, i) => {
    b.classList.toggle('hov', NET.rwHov === i && NET.rwPick == null); b.classList.toggle('chosen', NET.rwPick === i);
    b.classList.toggle('sug', NET.rwSug === i); // サポーター（ゲスト）のおすすめ
  });
}
// ゲスト：このごほうびがいい！とホストに提案する（もう一度タップで取り消し）
function rewardSuggest(i) {
  if (NET.rwPick != null) return;
  NET.rwSug = NET.rwSug === i ? null : i; markReward(); SFX.pick();
  netSend({ t: 'rwsug', i: NET.rwSug });
}
function rewardHover(i) {
  if (NET.rwPick != null || NET.rwHov === i) return;
  NET.rwHov = i; markReward();
  if (rewardOnline()) netSend({ t: 'rwhov', i });
}
// ごほうびを決める。オンラインでは決めたカードを両方の画面で少し見せてから、マップへ
function rewardPick(i) {
  const run = curRun(); if (!run || !run.choices || !run.choices[i] || NET.rwPick != null) return;
  const go = () => {
    applyReward(run, run.choices[i]); NET.rwPick = null; NET.rwHov = null; NET.rwSug = null;
    if (run.extra > 0) { run.extra--; run.choices = null; saveStory(); showReward(); return; } // 強敵・たからばこ：もう1枚
    run.pending = false; run.choices = null; run.evt = null; saveStory(); mapSel = null; showStory(); // マップで次の道をえらぶ
  };
  SFX.pick();
  if (!rewardOnline()) { go(); return; }
  NET.rwPick = i; markReward(); netSend({ t: 'rwhov', i, pick: 1 });
  setTimeout(go, 900);
}
function startStoryPage(i) { if (i === EX_IDX) setNodePage(null); storyIdx = i; CH = runCharacter(storyCH); startCoopGame(); } // 冒険中はランナーの強化を反映したキャラで
function showEnding() {
  const sv = storySave[COOP_LV];
  const spr = storyStrokes ? bigSprite(storyStrokes, 220, 180) : null;
  $('#endingChar').src = (spr || storyCH.spr).toDataURL();
  $('#endingText').innerHTML = ENDING.map(t => `<p>${t}</p>`).join('') + `<p class="end-lv">大王の強さ「${CPU_LV[COOP_LV].name}」で全${STORY.length}階の冒険をクリア！ EXステージが解放されました</p>`;
  const names = sv.lastPath || [];
  $('#endingRanks').innerHTML = names.map((nm, i) => `<span class="hchip a"><b>${i + 1}階</b><small>${nm}</small></span>`).join('');
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
$('#btnEndMap').addEventListener('click', () => { storySel = 0; mapSel = null; showStory(); });
$('#btnEndTitle').addEventListener('click', () => quitToTitle());
$('#btnNextPage').addEventListener('click', () => {
  $('#result').classList.add('hidden');
  if (storyIdx >= STORY.length - 1) showEnding(); else showReward();
});
$('#btnStoryMap').addEventListener('click', () => { $('#result').classList.add('hidden'); storySel = storyIdx === EX_IDX ? EX_IDX : 0; showStory(); });
function startCoopGame() {
  DECK = inRun() ? curRun().deck.slice() : SUPPORT_BASIC.slice(); // 冒険中は集めたカードだけ（EXステージは基本の8枚）
  applyCardLevels(runUps()); // 冒険中はアップグレードしたカードの性能で
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
  $('#scoreBox').innerHTML = (COOP && NET.role) ? `オンライン協力（${CPU_LV[COOP_LV].name}）　あなたは<b>${NET.role === 'host' ? 'P1ランナー' : 'P2サポーター'}</b>` : COOP ? `協力ストーリー（${CPU_LV[COOP_LV].name}）　${storySave[COOP_LV].run ? `いま <b>${Math.min(STORY.length, storySave[COOP_LV].run.stage + 1)}</b>階 / ${STORY.length}` : storySave[COOP_LV].cleared ? '冒険クリア済み' : `全${STORY.length}階`}`
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
  $('#btnDrawBack').textContent = { story: '◀ 冒険のマップへ', swap: '◀ 戻る', deckA: '◀ プレイヤーAのカード選び' }[d] || '◀ 戻る';
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
