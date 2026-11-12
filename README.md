# ラクガキ・ランナーズ

`index.html` をブラウザで開くだけで遊べます（ビルド不要。ダブルクリックで開いても、GitHub Pages などに置いても動きます）。

## ファイル構成

```
index.html          画面のHTML（スクリプトの読み込み順もここで決まる）
css/style.css       見た目
js/
  core/util.js      共通ユーティリティ（$ / clamp / 乱数など）
  audio/            効果音（sfx.js）・BGM（bgm.js）
  game/             ゲームのデータとロジック
    config.js         定数・画面分割レイアウト
    cards.js          カード・デッキ
    story.js          協力ストーリー・セーブ・メダル
    enemy-types.js    敵の基本データ
    viewport.js       キャンバスのサイズ合わせ
    state.js          ラウンド中の状態
    level.js          ステージ生成
    gimmicks.js       スイッチ扉・カギ・リフト・暗闇
    physics.js        当たり判定・演出
    builder.js        ビルダーの操作
    cpu.js            CPUジャマー・ボス戦
    player.js         ランナーの更新
    enemies.js        敵と弾の更新
    step.js           1フレームの更新
  render/           描画（スプライト・背景・地形・HUD・カードアイコン）
  draw/             キャラ作成（お絵かき・解析・スプライト化）
  ui/               画面（切り替え・デッキ・モードの流れ・結果・優勝シーン）
  input/            キーボード／マウス入力
  debug.js          デバッグモード
  net/              オンライン（WebRTC）
  main.js           メインループと起動時の初期化（いちばん最後に読み込む）
```

## しくみのメモ

- どのファイルもふつうの `<script>` で、トップレベルの変数・関数は全ファイルで共有されます。
  ES Modules（`import`）を使っていないので、`file://` で開いても動きます。
- 読み込みは `index.html` に書いた順番です。各ファイルのトップレベルでは「定義」と
  「イベントの登録」だけをして、起動時に実行する処理は `js/main.js` にまとめています。
  新しいファイルを足すときも、トップレベルで後ろのファイルの関数を呼ばないようにしてください
  （イベントハンドラの中から呼ぶのは OK）。
