'use strict';

/* =====================================================
   協力ストーリー（ページ定義・EXステージ・セーブデータ・メダル）
   ===================================================== */
let COOP = false, COOP_LV = 'normal', cpu = { energy: 0, timer: 0 };
// 協力ストーリーの全8ページ（kinds = 出てくる関門の順番 / cpu = 大王の強さの倍率 / pool = 使ってくる敵の種類の多さ）
const STORY = [
  { name: 'はじまりの草原', bg: 'meadow', terr: '#e3e6ee', kinds: ['pit', 'key', 'wall', 'gate', 'lift', 'spikes', 'pit'], time: 130, cpu: 0.65, pool: 0.4,
    hint: 'カギは高い所に。ジャンプ台で取りに行こう。高すぎる崖はP2がレバーを押さえてリフトで登る',
    story: ['ノートのすみっこで生まれたラクガキが、目をさました。', 'ところが、ページのあちこちが何者かに消されて、道がボロボロになっている。', 'サポーター「だいじょうぶ。足りない道は、わたしがつなぐから！」'] },
  { name: 'とびらの森', bg: 'forest', terr: '#e0ebe0', kinds: ['gate', 'key', 'lift', 'spikes', 'gate', 'dark', 'key', 'pit'], time: 140, cpu: 0.8, pool: 0.6,
    hint: '扉・カギ・リフトが続く森。暗い場所ではP2のカーソルだけが明かりになる',
    story: ['森の奥には、カギのかかった扉がならんでいる。', '消しゴム大王「ケシケシ…このノートは、まっさらに消してやるのだ！」', 'いたずらの犯人が、ついに姿をあらわした。'] },
  { name: 'トゲトゲ谷', bg: 'canyon', terr: '#e7e2d6', kinds: ['spikes', 'key', 'spikes', 'pit', 'lift', 'spikes', 'gate', 'spikes'], time: 145, cpu: 0.85, pool: 0.65,
    hint: 'トゲ地帯がいくつも続く谷。足場ブロックやくもブロックで、トゲの上に橋をかけよう',
    story: ['谷底いっぱいに、とがった線が描きなぐられている。', '消しゴム大王「このトゲの谷は、だれにも越えられまい！」', 'サポーター「トゲの上に、橋をかけていこう！」'] },
  { name: 'どうくつ迷路', bg: 'cave', terr: '#d8dbe5', grass: false, cave: true, kinds: ['dark', 'pit', 'gate', 'dark', 'key', 'spikes', 'dark', 'gate'], time: 145, cpu: 0.95, pool: 0.8,
    hint: '暗闇が何度も来る。P2はカーソルで先を照らしながら、ブロックも置いていこう',
    story: ['谷を抜けた先は、ページのすき間にある、まっくらな洞くつ。', 'ランナー「何も見えない…どこへ進めばいいの？」', 'サポーター「わたしが照らす！ 光のほうへ走って！」'] },
  { name: 'くものうえ', bg: 'sky', terr: '#e1e9f3', kinds: ['pit', 'pit', 'lift', 'key', 'pit', 'gate', 'pit', 'dark'], time: 150, cpu: 1.0, pool: 0.85,
    hint: '大穴が続く空の上。安い「くもブロック」も使って、エネルギーを大事にしよう',
    story: ['洞くつを抜けると、ページの上のほうの白い空に出た。', '足場になる線が、ほとんどない。', 'サポーター「エネルギーは無限じゃない。大事に使っていこう」'] },
  { name: 'がけっぷち山', bg: 'mountain', terr: '#e7e2d6', kinds: ['wall', 'lift', 'wall', 'key', 'spikes', 'lift', 'wall', 'gate'], time: 155, cpu: 1.05, pool: 0.9,
    hint: '高い崖が続く山。ジャンプ台で越えられる崖と、リフトが必要な崖を見分けよう',
    story: ['そびえ立つ崖に、消しゴムのカスが雪のように積もっている。', 'ランナー「こんな高い崖、どうやって登るの…？」', 'サポーター「ジャンプ台とリフトで、いっしょに登ろう！」'] },
  { name: 'あらしの空', bg: 'storm', terr: '#e4e1ef', kinds: ['dark', 'pit', 'gate', 'lift', 'dark', 'key', 'spikes', 'pit'], time: 160, cpu: 1.1, pool: 1, erase: true,
    hint: '大王が地面を消してくる！ 暗闇と嵐の中、消された穴にもすぐ橋をかけよう',
    story: ['城の手前の空には、消しゴムの竜巻が吹きあれている。', '消しゴム大王「地面ごと消してしまえば、走れまい！」', '道が消えるなら、そのたびにつなぎ直すだけだ。'] },
  { name: '消しゴム大王の城', bg: 'castle', terr: '#ece4e4', kinds: ['lift', 'gate', 'dark', 'key', 'spikes', 'pit', 'wall', 'gate'], time: 175, cpu: 1.15, pool: 1, erase: true, boss: true,
    hint: 'すべての仕掛けを2人で突破して、最後は大王との対決！ ボムとストップは3回まで',
    story: ['ついに最後のページ。消しゴム大王の城がそびえている。', '消しゴム大王「ここまで来たか…この橋の先へは、ぜったいに通さぬぞ！」', '2人「スイッチを押して、いっしょにゴールするんだ！」'] }
];
const ENDING = ['最後のゴールにたどりつくと、消しゴム大王はしょんぼりとうなだれた。', '大王「…ほんとうは、みんなといっしょにラクガキしたかっただけなのだ」', 'その日から、ノートには3人ぶんの新しいラクガキが描き足されていった。おしまい。'];
const KIND_JP = { pit: '大穴', wall: '絶壁', gate: 'スイッチ扉', spikes: 'トゲ地帯', key: 'カギの扉', lift: 'リフト', dark: '暗闇', darkpit: '暗闇の大穴' };
// ---- EXステージ：全ページで金メダル以上を取ると解放される、とても難しいページ ----
const EX_IDX = STORY.length;
const EX_PAGE = { name: '真っ白なページ', bg: 'ex', terr: '#e6e1f0', ex: true,
  kinds: ['darkpit', 'lift', 'spikes', 'key', 'gate', 'darkpit', 'wall', 'lift', 'spikes', 'gate', 'key', 'darkpit'],
  time: 225, cpu: 1.6, pool: 1, erase: true, boss: true, regen: 0.13, limit: 2,
  hint: '暗闇の中の大穴、長いトゲ、強い妨害、少ないエネルギー。ボム・ストップ・ハートは2回まで',
  story: ['すべてのページで輝くメダルを集めると、ノートの最後に、まっしろなページが現れた。', '真・消しゴム大王「ここは、すべてを消し去るためのページ…生きて帰れると思うな！」', '2人「最後の最後まで、いっしょに描き続けるんだ！」'] };
const pageDef = i => i === EX_IDX ? EX_PAGE : STORY[i];
const pageLabel = i => i === EX_IDX ? 'EXステージ' : `ページ${i + 1}`;
const isEX = () => COOP && storyIdx === EX_IDX;
let storyIdx = 0, storySel = 0, storyCH = null, storyStrokes = null;
const STORY_KEY = 'rr-story-v2';
const newSave = () => ({ open: 1, ranks: [], medals: [], pages: STORY.length });
let storySave = { easy: newSave(), normal: newSave(), hard: newSave() };
try {
  const sv = JSON.parse(localStorage.getItem(STORY_KEY) || 'null');
  if (sv) for (const k of Object.keys(storySave)) {
    const o = sv[k]; if (!o) continue;
    if (o.pages === STORY.length) { storySave[k] = { open: o.open || 1, ranks: o.ranks || [], medals: o.medals || [], pages: STORY.length }; continue; }
    // 4ページ版の記録を8ページ版の同じページへ移す（草原→1, 森→2, 洞くつ→4, 城→8）
    const MAP = [0, 1, 3, 7], ranks = [], medals = [];
    (o.ranks || []).forEach((r, i) => { if (MAP[i] != null) ranks[MAP[i]] = r; });
    (o.medals || []).forEach((m, i) => { if (MAP[i] != null) medals[MAP[i]] = m; });
    let open = 1; while (open < STORY.length && ranks[open - 1]) open++;
    storySave[k] = { open, ranks, medals, pages: STORY.length };
  }
} catch (_e) {}
// メダル：銀＝クリア / 金＝Sランク / 虹＝ノーダメージ。表示するのはいちばん良い色の1枚だけ
const MEDAL_ORDER = ['silver', 'gold', 'rainbow'];
const MEDAL_JP = { silver: ['銀', 'クリア'], gold: ['金', 'Sランク'], rainbow: ['虹', 'ノーダメージ'] };
const bestMedal = m => !m ? null : m.rainbow ? 'rainbow' : m.gold ? 'gold' : m.silver ? 'silver' : null;
const medalOne = (k, extra = '') => `<span class="medal-wrap ${k}${extra}"><span class="rib"></span><span class="medal ${k}" title="${MEDAL_JP[k][0]}メダル：${MEDAL_JP[k][1]}" aria-label="${MEDAL_JP[k][0]}メダル"></span>${k !== 'silver' ? '<span class="spk s1" aria-hidden="true">✦</span><span class="spk s2" aria-hidden="true">✦</span>' : ''}</span>`;
const exOpen = lv => STORY.every((_, i) => { const k = bestMedal(storySave[lv].medals[i]); return k === 'gold' || k === 'rainbow'; });
const exUnlocked = () => exOpen(COOP_LV) || DBG.on;
const medalHtml = (m, extra = '') => { const k = bestMedal(m); return k ? medalOne(k, extra) : `<span class="medal off${extra}" aria-label="メダルなし"></span>`; };
function saveStory() { try { localStorage.setItem(STORY_KEY, JSON.stringify(storySave)); } catch (_e) {} }
const roundLen = () => COOP ? pageDef(storyIdx).time * 60 : ROUND_T;
const COOP_STATS = { tries: 0, clears: 0, best: null };
