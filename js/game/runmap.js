'use strict';

/* =====================================================
   冒険のマップ：15階の分かれ道。次に進むマスを自分でえらぶ
   - 戦＝ふつうのステージ／強＝強敵ステージ（ごほうび2枚）／休＝休けい（アップグレード）
   - 宝＝たからばこ（ステージなしでごほうび）／？＝ふしぎ（何かが起こる）／王＝ボス（8階と15階）
   ===================================================== */
const NODE_T = {
  stage: { mark: '戦', name: 'ステージ', desc: '大王のじゃまを越えてゴールをめざす。クリアするとごほうびを1枚えらべる' },
  elite: { mark: '強', name: '強敵ステージ', desc: '大王がいつもより強く、敵のダメージも大きい。そのかわり、クリアするとごほうびを2枚えらべる' },
  rest: { mark: '休', name: '休けい', desc: 'ひと休み。持っているカードかランナーの強化を、1つアップグレードできる' },
  treasure: { mark: '宝', name: 'たからばこ', desc: 'ステージなしで、ごほうびを1枚えらべる' },
  event: { mark: '？', name: 'ふしぎ', desc: '何が起こるかはお楽しみ。いいことがあるかも' },
  boss: { mark: '王', name: 'ボス', desc: '消しゴム大王との対決！' }
};
const BOSS_FLOORS = [7, 14];
const MAP_ROWS = 4;
// 階ごとのマスの種類を決める
function mapNodeType(f, rnd) {
  if (f === 0) return 'stage';
  if (BOSS_FLOORS.includes(f)) return 'boss';
  if (f === STORY.length - 2) return 'rest'; // 最後のボスの前はかならず休けい
  const w = [['stage', 50], ['elite', f >= 3 ? 16 : 0], ['event', 14], ['treasure', f >= 2 ? 8 : 0], ['rest', f >= 4 ? 12 : 0]];
  let t = rnd() * w.reduce((s, [, n]) => s + n, 0);
  for (const [k, n] of w) { if ((t -= n) < 0) return k; }
  return 'stage';
}
// ステージのマスは、その階の前後のステージを土台にする（ボスのステージは使わない）。強さはその階に合わせる
function mapPickTpl(f, rnd) {
  const c = [f - 1, f, f + 1].filter(i => i >= 0 && i < STORY.length && !BOSS_FLOORS.includes(i));
  return c[Math.floor(rnd() * c.length)];
}
function genRunMap() {
  const rnd = Math.random, floors = [];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let id = 0;
  for (let f = 0; f < STORY.length; f++) {
    const n = BOSS_FLOORS.includes(f) ? 1 : f === 0 ? 3 : 2 + Math.floor(rnd() * 3);
    const ys = n === 1 ? [(MAP_ROWS - 1) / 2] : shuffle([0, 1, 2, 3]).slice(0, n).sort((a, b) => a - b);
    floors.push(ys.map(y => {
      const type = mapNodeType(f, rnd);
      return { id: id++, f, y, type, tpl: type === 'boss' ? f : (type === 'stage' || type === 'elite') ? mapPickTpl(f, rnd) : null, next: [] };
    }));
  }
  // となりの階どうしを、線が交差しないようにつなぐ（どのマスにも行ける道がある）
  for (let f = 0; f < floors.length - 1; f++) {
    const A = floors[f], B = floors[f + 1], link = (a, b) => { if (!a.next.includes(b.id)) a.next.push(b.id); };
    let i = 0, j = 0; link(A[0], B[0]);
    while (i < A.length - 1 || j < B.length - 1) {
      const fa = i < A.length - 1 ? (i + 1) / (A.length - 1) : 9, fb = j < B.length - 1 ? (j + 1) / (B.length - 1) : 9;
      if (Math.abs(fa - fb) < 1e-6) { i++; j++; const k = rnd(); if (k < 0.35) link(A[i - 1], B[j]); else if (k < 0.7) link(A[i], B[j - 1]); }
      else if (fa < fb) i++; else j++;
      link(A[i], B[j]);
    }
  }
  return { floors };
}
const mapNodes = run => run && run.map ? run.map.floors.flat() : [];
const mapNode = (run, id) => mapNodes(run).find(n => n.id === id) || null;
// 前の版のセーブ（マップなし）は、いまの階からマップを始める
function ensureRunMap(run) {
  if (!run || run.map) return run;
  run.map = genRunMap(); run.pos = null; run.cur = null; run.path = []; run.extra = 0; run.rwKind = 'stage';
  return run;
}
// 次にえらべるマス（ステージに負けたときは、そのマスに再挑戦）
function mapReachable(run) {
  if (!run || !run.map || run.stage >= STORY.length) return [];
  if (run.cur != null) return [run.cur];
  const fl = run.map.floors[run.stage] || [];
  if (run.pos == null) return fl.map(n => n.id);
  const p = mapNode(run, run.pos);
  return p ? p.next.filter(id => fl.some(n => n.id === id)) : fl.map(n => n.id);
}
// マスのステージ（強敵は大王が強く、関門が1つ多く、時間が少し長い）
function makeNodePage(nd) {
  if (nd.type === 'boss') return STORY[nd.f];
  const base = STORY[nd.tpl], diff = STORY[nd.f], elite = nd.type === 'elite';
  const kinds = base.kinds.slice();
  if (elite) kinds.splice(Math.ceil(kinds.length / 2), 0, kinds[0]);
  return Object.assign({}, base, {
    name: elite ? `強敵！${base.name}` : base.name, kinds, elite,
    cpu: Math.round(diff.cpu * (elite ? 1.25 : 1) * 100) / 100, pool: Math.min(1, diff.pool + (elite ? 0.1 : 0)),
    time: base.time + (elite ? 15 : 0)
  });
}
// マスに入る
let nodePage = null; // いま遊んでいるマスのステージ（pageDef で使う）
function setNodePage(nd) { nodePage = nd ? { f: nd.f, nd: { f: nd.f, tpl: nd.tpl, type: nd.type }, page: makeNodePage(nd) } : null; }
// マスを通った（ステージをクリア、またはステージ以外のマスに入った）
function completeNode(run, nd) {
  run.pos = nd.id; run.stage = nd.f + 1; run.cur = null; (run.path = run.path || []).push(nd.id);
}
// ステージをクリアしたとき（result.js から）。最後のボスなら冒険クリア
function runStageCleared(sv) {
  const run = sv.run; if (!run) return;
  ensureRunMap(run);
  const nd = mapNode(run, run.cur) || (run.map.floors[storyIdx] || [])[0];
  if (storyIdx >= STORY.length - 1) {
    completeNode(run, nd);
    sv.lastPath = run.path.map(id => { const n = mapNode(run, id); return n.type === 'stage' || n.type === 'elite' || n.type === 'boss' ? makeNodePage(n).name : NODE_T[n.type].name; });
    sv.run = null; sv.cleared = true; return;
  }
  completeNode(run, nd);
  run.pending = true; run.choices = null; run.rwKind = nd.type === 'elite' ? 'elite' : 'stage'; run.extra = nd.type === 'elite' ? 1 : 0;
}
// 休けい：アップグレードできるもの（カード・ランナーの強化）から3つ
function rollUpgrades(run) {
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ups = run.deck.filter(id => CARD_UP[id] && ((run.ups || {})[id] || 0) < UP_MAX).map(id => ({ type: 'up', id, lv: ((run.ups || {})[id] || 0) + 1 }));
  const rups = Object.keys(RUN_UP).filter(k => run.boosts[k] && run.boosts[k] < 3).map(k => ({ type: 'rup', id: k, lv: Math.min(3, run.boosts[k]) + 1 }));
  return shuffle(ups.concat(rups)).slice(0, 3);
}
// ふしぎ：いいことが1つ起こる
function runEvent(run) {
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cards = shuffle(SUPPORT_DECK.filter(id => !run.deck.includes(id)));
  const ups = shuffle(run.deck.filter(id => CARD_UP[id] && ((run.ups || {})[id] || 0) < UP_MAX));
  const rb = shuffle(Object.keys(RUN_UP).filter(k => (run.boosts[k] || 0) < 3));
  const evs = [];
  if (cards.length) evs.push(() => { const id = cards[0]; applyReward(run, { type: 'card', id }); return { title: 'ふしぎなインクだまり', text: `インクの中から、カードが1枚出てきた！「${CARD[id].name}」を手に入れた。`, card: id }; });
  if (ups.length) evs.push(() => { const id = ups[0], lv = ((run.ups || {})[id] || 0) + 1; applyReward(run, { type: 'up', id, lv }); return { title: 'えんぴつけずり', text: `道ばたのえんぴつけずりで、カードをとがらせた。「${CARD[id].name}」が ${stars(lv)} になった！`, card: id }; });
  if (rb.length) evs.push(() => { const k = rb[0], had = run.boosts[k] || 0; run.boosts[k] = Math.min(3, had + 1); return { title: 'げんきの泉', text: had ? `泉の水を飲んだ。ランナーの「${BOOSTS[k].name}」が ${stars(Math.min(3, had + 1) - 1)} になった！` : `泉の水を飲んだ。ランナーが「${BOOSTS[k].name}」を身につけた！`, mark: BOOSTS[k].mark }; });
  evs.push(() => ({ title: '大王の落とし物', text: '消しゴム大王が、たからばこを落としていった。ごほうびを2枚えらべる！', treasure: 2 }));
  return evs[Math.floor(Math.random() * evs.length)]();
}
