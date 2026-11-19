'use strict';

/* =====================================================
   カード（ビルダー／サポーターのデッキ）とCPUジャマーの強さ
   ===================================================== */
const CATS = {
  pen: { name: 'ペン', color: '#2a5bd7' },
  enemy: { name: '敵', color: '#8e5bd6' },
  trap: { name: 'ワナ', color: '#e07a1f' },
  special: { name: '特殊', color: '#e8305f' }
};
// paint kinds: 0 ink, 1 hard, 2 thorn, 3 ice, 4 bounce, 5 glue
const PENS = {
  pen: { kind: 0, cost: 1.5, life: 10, hp: 1, solid: true },
  hard: { kind: 1, cost: 3, life: 6, hp: 3, solid: true, block: true }, // block = トゲブロックと同じく、クリックで2×2を置くワナ（コストは CARDS 側）
  thorn: { kind: 2, cost: 5, life: 6, hp: 1, solid: true },
  ice: { kind: 3, cost: 1.5, life: 10, hp: 1, solid: true },
  bounce: { kind: 4, cost: 2, life: 10, hp: 1, solid: true },
  glue: { kind: 5, cost: 1.2, life: 10, hp: 1, solid: false },
  eraser: { kind: 6, cost: 3, life: 10, hp: 0, erase: true },
  quick: { kind: 0, cost: 0.6, life: 6, hp: 1, solid: true },
  clear: { kind: 13, cost: 3, life: 6, hp: 1, solid: true, block: true, size: 1 } // size = ブロックの大きさ（マス。ないときは2×2）
};
// ペンの種類ごとの色（0:インク 1:かたい 2:トゲ 3:氷 4:バネ 5:ネバネバ 6:消しゴム 7:（未使用） 8:（未使用） 9:板 10:足場 11:（未使用） 12:（未使用） 13:すけすけ 14:（未使用））
const KCOL = ['#2a5bd7', '#5a6072', '#e0313f', '#9fe0f4', '#33b06a', '#a0703f', '#f7a8c4', '#7a8091', '#8fa6d9', '#c99a68', '#8fd8a8', '#3d4250', '#ff7a3d', '#c7d3e6', '#ff5ca8'];
const CARDS = [
  { id: 'pen', cat: 'pen', name: 'ペン', desc: 'なぞった線が壁になる。10秒で消える' },
  { id: 'ice', cat: 'pen', name: '氷ペン', desc: '乗るとツルツル滑って止まれない足場。10秒で消える' },
  { id: 'bounce', cat: 'pen', name: 'バネペン', desc: '乗ると高く跳ね上げられる。トゲとの組み合わせに。10秒で消える' },
  { id: 'glue', cat: 'pen', name: 'ネバネバペン', desc: '通り抜けられるが、中では動きもジャンプも鈍る。10秒で消える' },
  { id: 'eraser', cat: 'pen', name: '消しゴム', desc: '地面を消して穴をあける。10秒で元に戻る' },
  { id: 'quick', cat: 'pen', name: 'はやがきペン', desc: 'とても安く描けるが、6秒で消えてしまう' },
  { id: 'walker', cat: 'enemy', name: 'ノシノシ', cost: 20, desc: '左右に歩いて往復する基本の敵' },
  { id: 'hopper', cat: 'enemy', name: 'ピョンタ', cost: 25, desc: 'ランナーめがけて跳ねてくる' },
  { id: 'flyer', cat: 'enemy', name: 'パタパタ', cost: 30, desc: '空を飛んで追いかけてくる' },
  { id: 'spiny', cat: 'enemy', name: 'トゲコロ', cost: 25, desc: '背中がトゲ。踏むとこっちが痛い' },
  { id: 'giant', cat: 'enemy', name: 'デカノシ', cost: 45, desc: '大きくてタフ。体力9、体当たり25' },
  { id: 'minis', cat: 'enemy', name: 'ミニノシ隊', cost: 25, desc: 'すばしっこい小さな3匹組' },
  { id: 'boulder', cat: 'enemy', name: 'ゴロゴロ岩', cost: 30, desc: '転がって突っ込んでくる。踏めない' },
  { id: 'charger', cat: 'enemy', name: 'トッシン', cost: 30, desc: '同じ高さに来ると猛ダッシュしてくる' },
  { id: 'crusher', cat: 'enemy', name: 'ズドン', cost: 35, desc: '空中で待ち、真下に来たら落ちてくる' },
  { id: 'ghost', cat: 'enemy', name: 'オバケ', cost: 30, desc: '壁をすり抜けて、ゆっくり迫ってくる' },
  { id: 'swarm', cat: 'enemy', name: 'ハチの群れ', cost: 35, desc: '小さなハチ3匹がまとわりつく' },
  { id: 'warper', cat: 'enemy', name: 'シュンシュン', cost: 35, desc: '消えてはランナーの近くに瞬間移動する' },
  { id: 'thrower', cat: 'enemy', name: 'ブーメランくん', cost: 35, desc: '壁をすり抜けて戻ってくるブーメランを投げる' },
  { id: 'slime', cat: 'enemy', name: 'ぷるぷる', cost: 30, desc: '跳ねて近づく。倒すと2匹に分裂する' },
  { id: 'shadow', cat: 'enemy', name: 'カゲぼうし', cost: 35, desc: 'ランナーの通った道を2秒遅れで追う影。12秒で消える' },
  { id: 'bat', cat: 'enemy', name: 'コウモリ', cost: 25, desc: '波のように上下しながら、壁をすり抜けて飛んでくる' },
  { id: 'mole', cat: 'enemy', name: 'モグラ', cost: 25, desc: '地面に隠れていて、近づくと飛び出す。隠れている間は無敵' },
  { id: 'tate', cat: 'enemy', name: 'タテノシ', cost: 30, desc: '盾を持っていて正面からの攻撃が効かない。後ろか上をねらえ' },
  { id: 'frog', cat: 'enemy', name: 'ケロッパ', cost: 25, desc: '高く遠くまでジャンプして飛びかかってくる' },
  { id: 'spitter', cat: 'enemy', name: 'タネッポ', cost: 30, desc: '地面に生えた花。ランナーめがけて山なりにタネを飛ばす' },
  { id: 'eye', cat: 'enemy', name: 'メダマン', cost: 35, desc: '空中でじっと狙いを定め、速い弾を撃つ。赤い線が予告' },
  { id: 'dropper', cat: 'enemy', name: 'ポイポイドリ', cost: 30, desc: 'ランナーの頭上を飛び、真上から岩を落とす' },
  { id: 'ninja', cat: 'enemy', name: 'ニンニン', cost: 35, desc: '跳び上がって手裏剣を投げてくる' },
  { id: 'puffer', cat: 'enemy', name: 'プクプク', cost: 30, desc: 'ゆっくり迫り、ときどき大きくふくらむ。ふくらむと踏めない' },
  { id: 'jelly', cat: 'enemy', name: 'フワクラゲ', cost: 25, desc: 'その場でふわふわ上下する。しびれるので踏めない' },
  { id: 'ufo', cat: 'enemy', name: 'ユーフォー', cost: 40, desc: '頭上から光線でランナーを吸い上げる。15秒で消える' },
  { id: 'snowman', cat: 'enemy', name: 'ユキダルマ', cost: 30, desc: '雪玉を投げる。当たると少しの間ひえて動きが鈍る' },
  { id: 'spike', cat: 'trap', name: 'トゲトゲ', cost: 15, desc: '床に置くトゲ。安くて手軽' },
  { id: 'thorn', cat: 'trap', name: 'トゲブロック', cost: 20, desc: 'クリックで2×2のトゲブロックを置く。触れるとダメージ。1秒に1個まで、6秒で消える' },
  { id: 'hard', cat: 'trap', name: 'かたいブロック', cost: 12, desc: 'クリックで2×2の頑丈なブロックを置く。何度も斬らないと壊れない。1秒に1個まで、6秒で消える' },
  { id: 'clear', cat: 'trap', name: 'すけすけブロック', cost: 3, desc: 'クリックで1マスのブロックを置く。ランナーの画面ではまったく見えない。1秒に1個まで、6秒で消える' },
  { id: 'cannon', cat: 'trap', name: 'ポンポン砲', cost: 40, desc: 'ランナーを狙って弾を撃つ' },
  { id: 'triple', cat: 'trap', name: '3連砲', cost: 55, desc: '扇状に3発まとめて撃つ' },
  { id: 'bomb', cat: 'trap', name: '時限バクダン', cost: 30, desc: '3秒後に大爆発。ダメージ35で大きく吹き飛ばす。解除できない' },
  { id: 'saw', cat: 'trap', name: 'ノコギリ', cost: 35, desc: '左右に往復する刃。壊せない' },
  { id: 'fire', cat: 'trap', name: '火柱', cost: 30, desc: '床から周期的に炎が噴き出す。壊せない' },
  { id: 'firebar', cat: 'trap', name: 'ぐるぐるボール', cost: 40, desc: '回転する火の玉の列。壊せない' },
  { id: 'fan', cat: 'trap', name: '扇風機', cost: 25, desc: '強い風でランナーを押し戻す' },
  { id: 'thunder', cat: 'trap', name: '雷雲', cost: 40, desc: '頭上を追いかけて雷を落とす。15秒で消える' },
  { id: 'laser', cat: 'trap', name: 'レーザー砲', cost: 40, desc: '予告のあと、横一直線にレーザーを撃つ' },
  { id: 'snare', cat: 'trap', name: 'トリモチ', cost: 20, desc: '踏むと1.5秒その場から動けなくなる。1回きり' },
  { id: 'rockfall', cat: 'trap', name: 'らくせき', cost: 30, desc: 'クリックした列に、上から岩が3つ降ってくる' },
  { id: 'catapult', cat: 'trap', name: 'ふっとびバネ', cost: 25, desc: '踏むとスタート側へ大きくふっ飛ばされる床' },
  { id: 'pendulum', cat: 'trap', name: 'ふりこ鉄球', cost: 40, desc: 'クリックした場所から鉄球がぶら下がって揺れる。壊せない' },
  { id: 'piston', cat: 'trap', name: 'パンチブロック', cost: 35, desc: 'ときどきパンチを突き出して、ランナーを押し返す' },
  { id: 'mine', cat: 'trap', name: 'じらい', cost: 20, desc: 'ランナーの画面ではほとんど見えない。踏むと爆発する' },
  { id: 'geyser', cat: 'trap', name: 'ふんすい', cost: 25, desc: '床から周期的に水が噴き出し、ランナーを打ち上げる' },
  { id: 'blackhole', cat: 'trap', name: 'ブラックホール', cost: 45, desc: 'まわりのランナーを吸い寄せる。中心は痛い。8秒で消える' },
  { id: 'arrow', cat: 'trap', name: '矢の発射台', cost: 30, desc: '向いている方向へ、まっすぐ矢を撃ち続ける' },
  { id: 'sawv', cat: 'trap', name: 'たてノコギリ', cost: 35, desc: '上下に往復する刃。壊せない' },
  { id: 'spikeball', cat: 'trap', name: 'はねトゲ玉', cost: 40, desc: '壁や床で跳ね返りながら飛び回る。壊せない。15秒で消える' },
  { id: 'homing', cat: 'trap', name: 'ホーミング砲', cost: 45, desc: 'ランナーを追いかけるミサイルを撃つ。斬れば落とせる' },
  { id: 'dark', cat: 'special', name: '暗闇', cost: 40, desc: '6秒間、ランナーの周り以外が真っ暗に' },
  { id: 'reverse', cat: 'special', name: 'さかさま', cost: 45, desc: '4秒間、ランナーの左右の操作が逆になる' },
  { id: 'weight', cat: 'special', name: 'おもり', cost: 40, desc: '5秒間、ランナーのジャンプ力と速さが落ちる' },
  { id: 'slip', cat: 'special', name: 'ツルツル', cost: 40, desc: '5秒間、どの床も氷のように滑る' },
  { id: 'float', cat: 'special', name: 'ふわふわ', cost: 40, desc: '5秒間、重力が弱くなってうまく着地できない' },
  { id: 'seal', cat: 'special', name: 'ふういん', cost: 45, desc: '3秒間、ランナーが攻撃できなくなる' }
];
CARDS.forEach(c => { if (c.cat === 'pen') { c.cost = PENS[c.id].cost; c.per = true; } c.costLabel = c.per ? `${c.cost}/マス` : String(c.cost); });
const CARD = Object.fromEntries(CARDS.map(c => [c.id, c]));
// クリックで2×2のブロックを置くワナ（トゲブロック・かたいブロック・すけすけブロック）と、ドラッグで描くペン
const isBlockCard = id => id === 'thorn' || !!(PENS[id] && PENS[id].block);
const isDrawPen = id => CARD[id].cat === 'pen' && !isBlockCard(id);
const blockSize = id => (PENS[id] && PENS[id].size) || 2; // ブロックのワナの大きさ（1なら1×1、2なら2×2）
const blockCells = (id, wx, wy) => blockSize(id) === 1 ? [[Math.floor(wx / T), Math.floor(wy / T)]] : thornCells(wx, wy);
const CAT_MAX = { special: 2 }; // デッキに入れられる枚数に上限がある種類（特殊）
const catCount = (deck, cat) => deck.filter(id => CARD[id] && CARD[id].cat === cat).length;
const catFull = (deck, cat) => CAT_MAX[cat] != null && catCount(deck, cat) >= CAT_MAX[cat];
const PRESET = ['pen', 'walker', 'hopper', 'flyer', 'spike', 'cannon', 'slime', 'dark'];
let DECK = PRESET.slice();
// 協力モードでP2（サポーター）が使うカード
// サポーターのブロック（クリック1回で決まった形を置く）
// sh = 形（左下を[0,0]としたマスの並び。上は -1）。ないときは横 w マス
const SUPPORT_BLOCKS = {
  s_pen: { w: 3, kind: 10, life: 20 }, s_cloud: { w: 3, plank: true, life: 15 }, s_bounce: { w: 2, kind: 4, life: 20 },
  s_long: { w: 5, kind: 10, life: 15 }, s_bridge: { w: 6, plank: true, life: 12 }, s_bigpad: { w: 4, kind: 4, life: 15 },
  s_stairs: { w: 3, kind: 10, life: 18, sh: [[0, 0], [1, 0], [1, -1], [2, 0], [2, -1], [2, -2]] },
  s_wall: { w: 1, kind: 10, life: 12, sh: [[0, 0], [0, -1], [0, -2]] }
};
const blockShape = b => b.sh || Array.from({ length: b.w }, (_, i) => [i, 0]);
const SUPPORT_CARDS = [
  { id: 's_pen', cat: 'support', name: '足場ブロック', cost: 7, desc: 'クリックで横3マスの足場を置く。20秒で消える' },
  { id: 's_cloud', cat: 'support', name: 'くもブロック', cost: 5, desc: '下からすり抜けられる横3マスの足場。15秒で消える' },
  { id: 's_bounce', cat: 'support', name: 'ジャンプ台', cost: 9, desc: '乗ると高く跳べる横2マスの台。20秒で消える' },
  { id: 's_heart', cat: 'support', name: '回復ハート', cost: 40, desc: 'カードを押すだけでランナーのHPが30回復（カーソル不要）。1ページ3回まで' },
  { id: 's_shield', cat: 'support', name: 'バリア', cost: 90, desc: '4秒間ランナーがダメージを受けない' },
  { id: 's_speed', cat: 'support', name: 'スピードアップ', cost: 40, desc: '5秒間ランナーの足とジャンプが強くなる' },
  { id: 's_bomb', cat: 'support', name: 'おたすけボム', cost: 30, desc: 'クリックした場所の敵とCPUの壁をまとめて吹き飛ばす。1ページ3回まで' },
  { id: 's_freeze', cat: 'support', name: 'ストップ', cost: 55, desc: '3秒間すべての敵と弾を止めて無害にする。1ページ3回まで' },
  // ---- 冒険のごほうびで増えるカード ----
  { id: 's_long', cat: 'support', name: '長い足場', cost: 11, desc: '横5マスの長い足場を置く。15秒で消える' },
  { id: 's_bridge', cat: 'support', name: 'くもの橋', cost: 9, desc: '下からすり抜けられる横6マスの橋。12秒で消える' },
  { id: 's_bigpad', cat: 'support', name: '大きなジャンプ台', cost: 14, desc: '横4マスのジャンプ台。15秒で消える' },
  { id: 's_stairs', cat: 'support', name: 'かいだんブロック', cost: 10, desc: '3段の階段を置く。高い段差もラクラク。18秒で消える' },
  { id: 's_wall', cat: 'support', name: 'かべブロック', cost: 8, desc: '縦3マスのかべ。敵や弾を止める。12秒で消える' },
  { id: 's_miniheart', cat: 'support', name: 'ちびハート', cost: 15, desc: 'カードを押すだけでランナーのHPが12回復（カーソル不要）' },
  { id: 's_regen', cat: 'support', name: 'いやしの光', cost: 35, desc: '8秒間、ランナーのHPが少しずつ回復する（合計24）' },
  { id: 's_timer', cat: 'support', name: 'のびる時計', cost: 50, desc: '制限時間が15秒のびる。1ステージ2回まで' },
  { id: 's_feather', cat: 'support', name: 'はねの羽', cost: 35, desc: '6秒間ランナーがふわふわになり、遠くまで跳べる' },
  { id: 's_jump', cat: 'support', name: 'ジャンプアップ', cost: 30, desc: '6秒間ランナーのジャンプが高くなる' },
  { id: 's_double', cat: 'support', name: 'ジャンプぐつ', cost: 35, desc: '8秒間ランナーが空中でもう1回ジャンプできる' },
  { id: 's_wind', cat: 'support', name: 'おいかぜ', cost: 25, desc: '6秒間ランナーを前に押す追い風がふく' },
  { id: 's_cushion', cat: 'support', name: 'クッション', cost: 30, desc: '10秒間、穴に落ちてもダメージを受けない' },
  { id: 's_spikeboots', cat: 'support', name: 'トゲよけぐつ', cost: 30, desc: '8秒間トゲを踏んでもダメージを受けない' },
  { id: 's_lamp', cat: 'support', name: 'ランタン', cost: 25, desc: '暗闇を消し、12秒間は暗くならない。暗いステージではランナーのまわりが広く明るくなる' },
  { id: 's_slow', cat: 'support', name: 'スロー', cost: 40, desc: '6秒間、敵と弾の動きが半分の速さになる' },
  { id: 's_nojam', cat: 'support', name: '大王おやすみ', cost: 60, desc: '8秒間、消しゴム大王が敵やワナを置けなくなる。1ステージ2回まで' },
  { id: 's_clear', cat: 'support', name: '弾けし', cost: 15, desc: '画面の中の敵の弾をすべて消す' },
  { id: 's_shot', cat: 'support', name: 'おたすけ弾', cost: 20, desc: 'ランナーの前に3発のインク弾を撃つ。敵にダメージ' },
  { id: 's_push', cat: 'support', name: 'ふきとばし', cost: 25, desc: 'クリックした場所のまわりの敵を吹き飛ばして1ダメージ' },
  { id: 's_thunder', cat: 'support', name: 'かみなり', cost: 45, desc: 'ランナーに近い敵3体に雷を落として3ダメージ。1ステージ3回まで' },
  { id: 's_column', cat: 'support', name: 'たて消しゴム', cost: 20, desc: 'クリックした場所のたて3列にある大王の壁をまとめて消す' }
];
const SUPPORT_BASIC = ['s_pen', 's_cloud', 's_bounce', 's_heart', 's_shield', 's_speed', 's_bomb', 's_freeze']; // EXステージなどで使う基本のカード
const SUPPORT_EFFECT = { s_shield: null, s_speed: 'boost', s_freeze: 'freeze', s_regen: 'regen', s_feather: 'float', s_jump: 'jumpup', s_double: 'djump', s_wind: 'tail', s_cushion: 'cushion', s_spikeboots: 'spikeproof', s_lamp: 'lamp', s_slow: 'slow', s_nojam: 'nojam' };
const SUPPORT_TIME = { s_regen: 8, s_feather: 6, s_jump: 6, s_double: 8, s_wind: 6, s_cushion: 10, s_spikeboots: 8, s_lamp: 12, s_slow: 6, s_nojam: 8 }; // 効果時間（秒）
const INSTANT_SUPPORT = new Set(['s_heart', 's_miniheart']); // カードを押すだけで使える（カーソル不要）
SUPPORT_CARDS.forEach(c => { if (c.cat === 'pen') { c.cost = PENS[c.id].cost; c.per = true; } c.costLabel = c.per ? `${c.cost}/マス` : String(c.cost); CARD[c.id] = c; });
const SUPPORT_DECK = SUPPORT_CARDS.map(c => c.id);
// CPUジャマーの強さ
const CPU_LV = {
  easy: { name: 'やさしい', regen: 0.2, every: 78, pool: ['walker', 'hopper', 'flyer', 'spike', 'cannon', 'bomb', 'slime', 'minis'], wall: 0.1, special: 0 },
  normal: { name: 'ふつう', regen: 0.29, every: 54, pool: ['walker', 'hopper', 'flyer', 'spike', 'cannon', 'bomb', 'slime', 'minis', 'spiny', 'saw', 'fire', 'boulder', 'charger', 'swarm', 'laser', 'snare', 'fan'], wall: 0.2, special: 0.07 },
  hard: { name: 'むずかしい', regen: 0.38, every: 38, pool: ['walker', 'hopper', 'flyer', 'spike', 'cannon', 'bomb', 'slime', 'minis', 'spiny', 'saw', 'fire', 'boulder', 'charger', 'swarm', 'laser', 'snare', 'fan', 'giant', 'triple', 'thunder', 'firebar', 'crusher', 'warper', 'thrower', 'ghost'], wall: 0.26, special: 0.16 }
};
