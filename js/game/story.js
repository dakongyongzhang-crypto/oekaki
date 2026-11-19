'use strict';

/* =====================================================
   協力ストーリー（ページ定義・EXステージ・セーブデータ・メダル）
   ===================================================== */
let COOP = false, COOP_LV = 'normal', cpu = { energy: 0, timer: 0 };
// 協力ストーリーの全15ステージ（1から順に進む。後のステージほど敵のダメージも大きい。kinds = 出てくる関門の順番 / cpu = 大王の強さの倍率 / pool = 使ってくる敵の種類の多さ）
const STORY = [
  { name: 'はじまりの草原', bg: 'meadow', terr: '#e3e6ee', kinds: ['pit', 'key', 'wall', 'gate', 'lift', 'spikes', 'pit'], time: 115, cpu: 0.75, pool: 0.55,
    hint: 'カギは高い所に。ジャンプ台で取りに行こう。高すぎる崖はP2がレバーを押さえてリフトで登る',
    story: ['ノートのすみっこで生まれたラクガキが、目をさました。', 'ところが、ページのあちこちが何者かに消されて、道がボロボロになっている。', 'サポーター「だいじょうぶ。足りない道は、わたしがつなぐから！」'] },
  { name: 'とびらの森', bg: 'forest', terr: '#e0ebe0', kinds: ['gate', 'key', 'lift', 'spikes', 'gate', 'dark', 'key', 'pit'], time: 125, cpu: 0.83, pool: 0.6,
    hint: '扉・カギ・リフトが続く森。暗い場所ではP2のカーソルだけが明かりになる',
    story: ['森の奥には、カギのかかった扉がならんでいる。', '消しゴム大王「ケシケシ…このノートは、まっさらに消してやるのだ！」', 'いたずらの犯人が、ついに姿をあらわした。'] },
  { name: 'ひだまりの丘', bg: 'meadow', terr: '#e3e6ee', kinds: ['key', 'pit', 'gate', 'spikes', 'lift', 'wall', 'pit'], time: 120, cpu: 0.9, pool: 0.67,
    hint: 'これまでの仕掛けがひととおり出てくる丘。ジャンプ台・橋・リフトを使い分けよう',
    story: ['草原を抜けると、あたたかい日の当たる丘に出た。', 'ランナー「ここは静かだね…」', 'サポーター「油断しないで。大王のいたずらは、まだまだ続いてる」'] },
  { name: 'トゲトゲ谷', bg: 'canyon', terr: '#e7e2d6', kinds: ['spikes', 'key', 'spikes', 'pit', 'lift', 'spikes', 'gate', 'spikes'], time: 130, cpu: 1.0, pool: 0.75,
    hint: 'トゲ地帯がいくつも続く谷。足場ブロックやくもブロックで、トゲの上に橋をかけよう',
    story: ['谷底いっぱいに、とがった線が描きなぐられている。', '消しゴム大王「このトゲの谷は、だれにも越えられまい！」', 'サポーター「トゲの上に、橋をかけていこう！」'] },
  { name: 'まよいの森', bg: 'forest', terr: '#e0ebe0', kinds: ['dark', 'key', 'gate', 'dark', 'dark', 'pit', 'lift', 'dark', 'spikes'], time: 135, cpu: 1.05, pool: 0.81,
    hint: '暗闇が何度も来る森。P2はカーソルで先を照らして、ランナーを導こう',
    story: ['谷の先には、木々が空をおおう深い森が広がっていた。', 'ランナー「さっきから、同じところを回ってる気がする…」', 'サポーター「わたしが照らす方へ進んで。きっと出口はある！」'] },
  { name: 'どうくつ迷路', bg: 'cave', terr: '#d8dbe5', grass: false, cave: true, kinds: ['dark', 'pit', 'gate', 'dark', 'pit', 'key', 'spikes', 'dark', 'gate'], time: 130, cpu: 1.1, pool: 0.85,
    hint: '暗闇が何度も来る。P2はカーソルで先を照らしながら、ブロックも置いていこう',
    story: ['谷を抜けた先は、ページのすき間にある、まっくらな洞くつ。', 'ランナー「何も見えない…どこへ進めばいいの？」', 'サポーター「わたしが照らす！ 光のほうへ走って！」'] },
  { name: 'くものうえ', bg: 'sky', terr: '#e1e9f3', kinds: ['pit', 'pit', 'lift', 'key', 'pit', 'pit', 'gate', 'pit', 'dark'], time: 135, cpu: 1.17, pool: 0.93,
    hint: '大穴が続く空の上。安い「くもブロック」も使って、エネルギーを大事にしよう',
    story: ['洞くつを抜けると、ページの上のほうの白い空に出た。', '足場になる線が、ほとんどない。', 'サポーター「エネルギーは無限じゃない。大事に使っていこう」'] },
  { name: '大王の見張り塔', bg: 'castle', terr: '#ece4e4', kinds: ['gate', 'key', 'lift', 'spikes', 'spikes', 'wall', 'gate'], time: 135, cpu: 1.23, pool: 0.97, boss: true,
    hint: 'ノートの真ん中にそびえる塔。最後は大王との対決！ スイッチまでたどりつこう',
    story: ['ノートの真ん中に、大王の見張り塔が建っていた。', '消しゴム大王「ここから先へは行かせぬ！ まずはわしが相手だ！」', 'サポーター「スイッチまでたどりつけば、塔のとびらが開くはず！」'] },
  { name: 'がけっぷち山', bg: 'mountain', terr: '#e7e2d6', kinds: ['wall', 'lift', 'wall', 'key', 'wall', 'spikes', 'lift', 'wall', 'gate'], time: 140, cpu: 1.27, pool: 1,
    hint: '高い崖が続く山。ジャンプ台で越えられる崖と、リフトが必要な崖を見分けよう',
    story: ['そびえ立つ崖に、消しゴムのカスが雪のように積もっている。', 'ランナー「こんな高い崖、どうやって登るの…？」', 'サポーター「ジャンプ台とリフトで、いっしょに登ろう！」'] },
  { name: '夕やけ渓谷', bg: 'canyon', terr: '#e7e2d6', kinds: ['spikes', 'wall', 'pit', 'spikes', 'spikes', 'key', 'lift', 'gate', 'spikes', 'pit'], time: 150, cpu: 1.33, pool: 1,
    hint: 'トゲと大穴がたくさんの長い渓谷。エネルギーの使いどころを考えよう',
    story: ['山をこえると、夕日に染まった渓谷が続いていた。', '消しゴム大王「見張り塔を抜けたくらいで、いい気になるな！」', 'ランナー「どんな道でも、2人ならつないでいける！」'] },
  { name: 'こおりの洞くつ', bg: 'cave', terr: '#d8dbe5', grass: false, cave: true, kinds: ['dark', 'darkpit', 'gate', 'key', 'darkpit', 'dark', 'spikes', 'lift', 'darkpit'], time: 150, cpu: 1.38, pool: 1,
    hint: '暗闇の中に大穴がある洞くつ。照らしながら橋をかけよう',
    story: ['渓谷の底には、つめたい風が吹きぬける洞くつがあった。', 'ランナー「足もとが見えない…落ちたらどうしよう」', 'サポーター「光と橋は、わたしにまかせて！」'] },
  { name: '雲の上の塔', bg: 'sky', terr: '#e1e9f3', kinds: ['lift', 'pit', 'lift', 'key', 'lift', 'pit', 'wall', 'gate', 'pit', 'lift'], time: 155, cpu: 1.41, pool: 1,
    hint: 'リフトと大穴が続く、空にうかぶ塔。リフトはP2がレバーを押さえているあいだだけ上がる',
    story: ['洞くつを抜けると、雲の上まで続く高い塔が見えた。', '消しゴム大王「城はこの先だ…来られるものなら来てみろ！」', 'サポーター「いっしょに、てっぺんまで登ろう！」'] },
  { name: 'あらしの空', bg: 'storm', terr: '#e4e1ef', kinds: ['dark', 'pit', 'gate', 'lift', 'pit', 'dark', 'key', 'spikes', 'pit'], time: 145, cpu: 1.45, pool: 1, erase: true,
    hint: '大王が地面を消してくる！ 暗闇と嵐の中、消された穴にもすぐ橋をかけよう',
    story: ['城の手前の空には、消しゴムの竜巻が吹きあれている。', '消しゴム大王「地面ごと消してしまえば、走れまい！」', '道が消えるなら、そのたびにつなぎ直すだけだ。'] },
  { name: 'かみなり峠', bg: 'storm', terr: '#e4e1ef', kinds: ['dark', 'wall', 'pit', 'gate', 'spikes', 'key', 'spikes', 'darkpit', 'lift', 'gate'], time: 160, cpu: 1.5, pool: 1, erase: true,
    hint: '城の目の前の峠。大王が地面を消してくる中、暗闇の大穴もこえていこう',
    story: ['嵐をぬけた先は、かみなりの鳴りひびく峠だった。', '消しゴム大王「城には一歩も近づけさせぬ！」', '2人「あと少し…ここをこえれば、城だ！」'] },
  { name: '消しゴム大王の城', bg: 'castle', terr: '#ece4e4', kinds: ['lift', 'gate', 'dark', 'key', 'darkpit', 'spikes', 'pit', 'wall', 'gate'], time: 165, cpu: 1.56, pool: 1, erase: true, boss: true,
    hint: 'すべての仕掛けを2人で突破して、最後は大王との対決！ ボムとストップは3回まで',
    story: ['ついに最後のページ。消しゴム大王の城がそびえている。', '消しゴム大王「ここまで来たか…この橋の先へは、ぜったいに通さぬぞ！」', '2人「スイッチを押して、いっしょにゴールするんだ！」'] }
];
const ENDING = ['最後のゴールにたどりつくと、消しゴム大王はしょんぼりとうなだれた。', '大王「…ほんとうは、みんなといっしょにラクガキしたかっただけなのだ」', 'その日から、ノートには3人ぶんの新しいラクガキが描き足されていった。おしまい。'];
const KIND_JP = { pit: '大穴', wall: '絶壁', gate: 'スイッチ扉', spikes: 'トゲ地帯', key: 'カギの扉', lift: 'リフト', dark: '暗闇', darkpit: '暗闇の大穴' };
// ---- EXステージ：15ステージの冒険を最後までクリアすると解放される、とても難しいステージ（冒険とは別に1回ずつ遊ぶ） ----
const EX_IDX = STORY.length;
const EX_PAGE = { name: '真っ白なページ', bg: 'ex', terr: '#e6e1f0', ex: true,
  kinds: ['darkpit', 'lift', 'spikes', 'key', 'gate', 'darkpit', 'wall', 'lift', 'spikes', 'gate', 'key', 'darkpit'],
  time: 225, cpu: 1.6, pool: 1, erase: true, boss: true, regen: 0.13, limit: 2,
  hint: '暗闇の中の大穴、長いトゲ、強い妨害、少ないエネルギー。ボム・ストップ・ハートは2回まで',
  story: ['15のステージをすべてクリアすると、ノートの最後に、まっしろなページが現れた。', '真・消しゴム大王「ここは、すべてを消し去るためのページ…生きて帰れると思うな！」', '2人「最後の最後まで、いっしょに描き続けるんだ！」'] };
const pageDef = i => i === EX_IDX ? EX_PAGE : STORY[i];
const pageLabel = i => i === EX_IDX ? 'EXステージ' : `ステージ${i + 1}`;
const isEX = () => COOP && storyIdx === EX_IDX;
let storyIdx = 0, storySel = 0, storyCH = null, storyStrokes = null;
const STORY_KEY = 'rr-story-v2';
// セーブ：ステージごとのベストランク・メダル／cleared = 冒険を最後までクリアした（EX解放）／run = いまの冒険のつづき
const newSave = () => ({ open: 1, ranks: [], medals: [], pages: STORY.length, cleared: false, run: null });
let storySave = { easy: newSave(), normal: newSave(), hard: newSave() };
try {
  const sv = JSON.parse(localStorage.getItem(STORY_KEY) || 'null');
  if (sv) for (const k of Object.keys(storySave)) {
    const o = sv[k]; if (!o) continue;
    if (o.pages === STORY.length) { storySave[k] = Object.assign(newSave(), { open: o.open || 1, ranks: o.ranks || [], medals: o.medals || [], cleared: !!o.cleared, run: o.run || null }); continue; }
    // 前の版（4ページ・8ページ）の記録を、15ステージ版の同じステージへ移す
    const MAP = o.pages === 8 ? [0, 1, 3, 5, 6, 8, 12, 14] : [0, 1, 5, 14], EXOLD = o.pages === 8 ? 8 : 4, ranks = [], medals = [];
    (o.ranks || []).forEach((r, i) => { if (i === EXOLD) ranks[EX_IDX] = r; else if (MAP[i] != null) ranks[MAP[i]] = r; });
    (o.medals || []).forEach((m, i) => { if (i === EXOLD) medals[EX_IDX] = m; else if (MAP[i] != null) medals[MAP[i]] = m; });
    storySave[k] = Object.assign(newSave(), { ranks, medals, cleared: !!(o.ranks && o.ranks[MAP.length - 1]) });
  }
} catch (_e) {}

/* ---------- 冒険（ローグライク）：ステージ1から順に進み、クリアするたびに3枚の中から1枚ごほうびを選ぶ ---------- */
const START_DECK = ['s_pen', 's_cloud', 's_bounce']; // サポーターの最初のカード（これだけでどの関門も越えられる）
// ごほうび：サポーターのカード（まだ持っていないもの）か、強化（何度でも重ねられる。max まで）
const BOOSTS = {
  hp: { who: 'runner', name: '体力アップ', desc: 'ランナーの最大HPが +20', mark: '♥', max: 6 },
  spd: { who: 'runner', name: '速さアップ', desc: 'ランナーの走る速さが少し上がる', mark: '»', max: 4 },
  jump: { who: 'runner', name: 'ジャンプ力アップ', desc: 'ランナーのジャンプが少し高くなる', mark: '↑', max: 4 },
  guard: { who: 'runner', name: 'ダメージ軽減', desc: 'ランナーが受けるダメージが 15% へる', mark: '◆', max: 4 },
  djump: { who: 'runner', name: '二段ジャンプ', desc: '空中でもう1回ジャンプできる', mark: '⇈', max: 1 },
  inv: { who: 'runner', name: 'むてき時間アップ', desc: 'ダメージを受けたあと、無敵でいられる時間が長くなる', mark: '✧', max: 3 },
  fall: { who: 'runner', name: '落下ダメージ軽減', desc: '穴に落ちたときのダメージが 10 へる', mark: '☂', max: 2 },
  autoheal: { who: 'runner', name: '自動回復', desc: '3秒ごとにHPが 2 ずつ回復する', mark: '✚', max: 3 },
  heart: { who: 'runner', name: 'ハート回復アップ', desc: 'ステージに落ちているハートの回復量が +15', mark: '♡', max: 3 },
  guts: { who: 'runner', name: 'ふんばり', desc: '1ステージに1回、やられそうになってもHP1で耐える', mark: '!', max: 1 },
  stomp: { who: 'runner', name: 'ふみつけ強化', desc: '敵を踏んだときのダメージが +1', mark: '▼', max: 3 },
  regen: { who: 'support', name: 'エネルギー回復アップ', desc: 'サポーターのエネルギーがたまる速さ +15%', mark: '⚡', max: 5 },
  energy: { who: 'support', name: 'スタートエネルギー', desc: 'ステージ開始時のエネルギーが +20', mark: '★', max: 2 },
  uses: { who: 'support', name: '使用回数アップ', desc: '回数に限りのあるカード（ボム・ストップ・ハートなど）を使える回数が +1', mark: '＋', max: 3, needs: ['s_heart', 's_bomb', 's_freeze', 's_timer', 's_nojam', 's_thunder'] }
};
// カードのアップグレード（★1・★2）：コストが下がり、効果が強くなる。[ふつう, ★1, ★2]
const CARD_UP = {
  s_pen: { cost: [7, 5, 4], v: [20, 26, 32], f: v => `${v}秒`, d: v => `クリックで横3マスの足場を置く。${v}秒で消える` },
  s_cloud: { cost: [5, 4, 3], v: [15, 20, 25], f: v => `${v}秒`, d: v => `下からすり抜けられる横3マスの足場。${v}秒で消える` },
  s_bounce: { cost: [9, 7, 5], v: [20, 26, 32], f: v => `${v}秒`, d: v => `乗ると高く跳べる横2マスの台。${v}秒で消える` },
  s_heart: { cost: [40, 35, 30], v: [30, 45, 60], f: v => `回復${v}`, d: v => `カードを押すだけでランナーのHPが${v}回復（カーソル不要）。1ステージ3回まで` },
  s_shield: { cost: [90, 80, 70], v: [4, 5.5, 7], f: v => `${v}秒`, d: v => `${v}秒間ランナーがダメージを受けない` },
  s_speed: { cost: [40, 35, 30], v: [5, 7, 9], f: v => `${v}秒`, d: v => `${v}秒間ランナーの足とジャンプが強くなる` },
  s_bomb: { cost: [30, 25, 20], v: [90, 115, 140], f: (v, lv) => `範囲：${['ふつう', '広い', 'とても広い'][lv]}`, d: (v, lv) => `クリックした場所の敵とCPUの壁をまとめて吹き飛ばす${['', '（範囲が広い）', '（範囲がとても広い）'][lv]}。1ステージ3回まで` },
  s_freeze: { cost: [55, 48, 40], v: [3, 4, 5], f: v => `${v}秒`, d: v => `${v}秒間すべての敵と弾を止めて無害にする。1ステージ3回まで` },
  // ---- 冒険で増えるカード ----
  s_long: { cost: [11, 9, 7], v: [15, 20, 25], f: v => `${v}秒`, d: v => `横5マスの長い足場を置く。${v}秒で消える` },
  s_bridge: { cost: [9, 7, 5], v: [12, 16, 20], f: v => `${v}秒`, d: v => `下からすり抜けられる横6マスの橋。${v}秒で消える` },
  s_bigpad: { cost: [14, 11, 9], v: [15, 20, 25], f: v => `${v}秒`, d: v => `横4マスのジャンプ台。${v}秒で消える` },
  s_stairs: { cost: [10, 8, 6], v: [18, 24, 30], f: v => `${v}秒`, d: v => `3段の階段を置く。高い段差もラクラク。${v}秒で消える` },
  s_wall: { cost: [8, 6, 5], v: [12, 16, 20], f: v => `${v}秒`, d: v => `縦3マスのかべ。敵や弾を止める。${v}秒で消える` },
  s_miniheart: { cost: [15, 12, 10], v: [12, 16, 20], f: v => `回復${v}`, d: v => `カードを押すだけでランナーのHPが${v}回復（カーソル不要）` },
  s_regen: { cost: [35, 30, 25], v: [8, 11, 14], f: v => `${v}秒（合計${v * 3}）`, d: v => `${v}秒間、ランナーのHPが少しずつ回復する（合計${v * 3}）` },
  s_timer: { cost: [50, 45, 40], v: [15, 20, 25], f: v => `+${v}秒`, d: v => `制限時間が${v}秒のびる。1ステージ2回まで` },
  s_feather: { cost: [35, 30, 25], v: [6, 8, 10], f: v => `${v}秒`, d: v => `${v}秒間ランナーがふわふわになり、遠くまで跳べる` },
  s_jump: { cost: [30, 25, 20], v: [6, 8, 10], f: v => `${v}秒`, d: v => `${v}秒間ランナーのジャンプが高くなる` },
  s_double: { cost: [35, 30, 25], v: [8, 11, 14], f: v => `${v}秒`, d: v => `${v}秒間ランナーが空中でもう1回ジャンプできる` },
  s_wind: { cost: [25, 20, 16], v: [6, 8, 10], f: v => `${v}秒`, d: v => `${v}秒間ランナーを前に押す追い風がふく` },
  s_cushion: { cost: [30, 25, 20], v: [10, 14, 18], f: v => `${v}秒`, d: v => `${v}秒間、穴に落ちてもダメージを受けない` },
  s_spikeboots: { cost: [30, 25, 20], v: [8, 11, 14], f: v => `${v}秒`, d: v => `${v}秒間トゲを踏んでもダメージを受けない` },
  s_lamp: { cost: [25, 20, 16], v: [12, 16, 20], f: v => `${v}秒`, d: v => `暗闇を消し、${v}秒間は暗くならない。暗いステージではランナーのまわりが広く明るくなる` },
  s_slow: { cost: [40, 34, 28], v: [6, 8, 10], f: v => `${v}秒`, d: v => `${v}秒間、敵と弾の動きが半分の速さになる` },
  s_nojam: { cost: [60, 52, 45], v: [8, 10, 12], f: v => `${v}秒`, d: v => `${v}秒間、消しゴム大王が敵やワナを置けなくなる。1ステージ2回まで` },
  s_clear: { cost: [15, 12, 10], v: [40, 400, 900], f: (v, lv) => ['画面の中', '画面の外まで', 'ずっと遠くまで'][lv], d: (v, lv) => `${['画面の中', '画面の外まで', 'ずっと遠く'][lv]}の敵の弾をすべて消す` },
  s_shot: { cost: [20, 17, 14], v: [3, 5, 7], f: v => `${v}発`, d: v => `ランナーの前に${v}発のインク弾を撃つ。敵にダメージ` },
  s_push: { cost: [25, 21, 18], v: [110, 140, 170], f: (v, lv) => `範囲：${['ふつう', '広い', 'とても広い'][lv]}`, d: (v, lv) => `クリックした場所のまわり${['', '（広い範囲）', '（とても広い範囲）'][lv]}の敵を吹き飛ばして1ダメージ` },
  s_thunder: { cost: [45, 40, 35], v: [3, 4, 5], f: v => `${v}体`, d: v => `ランナーに近い敵${v}体に雷を落として3ダメージ。1ステージ3回まで` },
  s_column: { cost: [20, 16, 13], v: [3, 5, 7], f: v => `${v}列`, d: v => `クリックした場所のたて${v}列にある大王の壁をまとめて消す` }
};
const UP_MAX = 2;
// カードの性能をレベルに合わせて書きかえる（冒険以外ではすべて「ふつう」に戻す）
function applyCardLevels(ups) {
  for (const id in CARD_UP) {
    const u = CARD_UP[id], lv = Math.min(UP_MAX, (ups && ups[id]) || 0), c = CARD[id];
    c.lv = lv; c.cost = u.cost[lv]; c.costLabel = String(c.cost); c.pow = u.v[lv]; c.desc = u.d(u.v[lv], lv);
    if (SUPPORT_BLOCKS[id]) SUPPORT_BLOCKS[id].life = u.v[lv];
  }
}
applyCardLevels({});
const stars = lv => lv ? '★'.repeat(lv) : '';
const curRun = () => storySave[COOP_LV].run;
const inRun = () => COOP && storyIdx !== EX_IDX && !!curRun();
const runBoost = k => inRun() ? (curRun().boosts[k] || 0) : 0;
const runUps = () => inRun() ? (curRun().ups || {}) : {};
function newRun() { storySave[COOP_LV].run = { stage: 0, deck: START_DECK.slice(), boosts: {}, ups: {}, pending: false, choices: null }; saveStory(); return curRun(); }
// ランナーの強化をキャラに反映したコピー（元の絵・名前はそのまま）
function runCharacter(base) {
  if (!inRun()) return base;
  const b = curRun().boosts, ch = Object.assign({}, base);
  ch.maxHp = base.maxHp + 20 * (b.hp || 0);
  ch.runSpeed = base.runSpeed + 0.25 * (b.spd || 0);
  ch.jumpV = base.jumpV + 0.6 * (b.jump || 0);
  return ch;
}
// ごほうびの候補を3つ（サポーターのカードがまだ残っていれば、少なくとも1枚は入れる）
function rollRewards(run) {
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cards = shuffle(SUPPORT_DECK.filter(id => !run.deck.includes(id)).map(id => ({ type: 'card', id })));
  const boosts = shuffle(Object.keys(BOOSTS).filter(k => (run.boosts[k] || 0) < BOOSTS[k].max && (!BOOSTS[k].needs || BOOSTS[k].needs.some(c => run.deck.includes(c)))).map(k => ({ type: 'boost', id: k })));
  const ups = shuffle(run.deck.filter(id => CARD_UP[id] && ((run.ups || {})[id] || 0) < UP_MAX).map(id => ({ type: 'up', id, lv: ((run.ups || {})[id] || 0) + 1 })));
  // 1枚目：サポーター側（カード・アップグレード・強化）／2枚目：ランナーの強化／3枚目：なんでも。種類ごとに同じくらいの確率で
  const pools = { card: cards, up: ups, sup: boosts.filter(r => BOOSTS[r.id].who !== 'runner'), run: boosts.filter(r => BOOSTS[r.id].who === 'runner') };
  const pickFrom = keys => { const ks = keys.filter(k => pools[k].length); return ks.length ? pools[ks[Math.floor(Math.random() * ks.length)]].shift() : null; };
  const out = [];
  for (const keys of [['card', 'up', 'sup'], ['run'], ['card', 'up', 'sup', 'run']]) { const r = pickFrom(keys); if (r) out.push(r); }
  const rest = shuffle([].concat(pools.card, pools.up, pools.sup, pools.run));
  while (out.length < 3 && rest.length) out.push(rest.shift());
  return shuffle(out);
}
function applyReward(run, r) {
  if (r.type === 'card') { if (!run.deck.includes(r.id)) run.deck.push(r.id); run.deck.sort((a, b) => SUPPORT_DECK.indexOf(a) - SUPPORT_DECK.indexOf(b)); }
  else if (r.type === 'up') { run.ups = run.ups || {}; run.ups[r.id] = Math.min(UP_MAX, (run.ups[r.id] || 0) + 1); }
  else run.boosts[r.id] = (run.boosts[r.id] || 0) + 1;
}
const rewardName = r => r.type === 'card' ? CARD[r.id].name : r.type === 'up' ? `${CARD[r.id].name} ${stars(r.lv)}` : BOOSTS[r.id].name;
// メダル：銀＝クリア / 金＝Sランク / 虹＝ノーダメージ。表示するのはいちばん良い色の1枚だけ
const MEDAL_ORDER = ['silver', 'gold', 'rainbow'];
const MEDAL_JP = { silver: ['銀', 'クリア'], gold: ['金', 'Sランク'], rainbow: ['虹', 'ノーダメージ'] };
const bestMedal = m => !m ? null : m.rainbow ? 'rainbow' : m.gold ? 'gold' : m.silver ? 'silver' : null;
const medalOne = (k, extra = '') => `<span class="medal-wrap ${k}${extra}"><span class="rib"></span><span class="medal ${k}" title="${MEDAL_JP[k][0]}メダル：${MEDAL_JP[k][1]}" aria-label="${MEDAL_JP[k][0]}メダル"></span>${k !== 'silver' ? '<span class="spk s1" aria-hidden="true">✦</span><span class="spk s2" aria-hidden="true">✦</span>' : ''}</span>`;
const exOpen = lv => !!storySave[lv].cleared;
const exUnlocked = () => exOpen(COOP_LV) || DBG.on;
const medalHtml = (m, extra = '') => { const k = bestMedal(m); return k ? medalOne(k, extra) : `<span class="medal off${extra}" aria-label="メダルなし"></span>`; };
function saveStory() { try { localStorage.setItem(STORY_KEY, JSON.stringify(storySave)); } catch (_e) {} }
const roundLen = () => COOP ? pageDef(storyIdx).time * 60 : ROUND_T;
const COOP_STATS = { tries: 0, clears: 0, best: null };
