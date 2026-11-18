# ラクガキ・ランナーズ

`index.html` をブラウザで開くだけで遊べます（ビルド不要。ダブルクリックで開いても、GitHub Pages などに置いても動きます）。

## ファイル構成

```
index.html          画面のHTML（スクリプトの読み込み順もここで決まる）
manifest.webmanifest PWA（アプリとして追加）の設定
sw.js               PWA のオフライン対応（index.html に書かれたファイルを自動で保存する）
icons/              アプリのアイコン
.github/            GitHub Pages への公開（TURN の設定を Secrets から書き込む）
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

## PWA（アプリとして遊ぶ）

- https のサイト（GitHub Pages など）に置くと、PWA として「ホーム画面に追加」／「インストール」できます。
  一度開けば、オフラインでも遊べます（オンライン対戦だけは通信が必要）。
- `index.html` をダブルクリックして開いた場合（file://）は、ふつうに遊べますが PWA にはなりません。
- 更新したファイルは、次にアプリを開いたときに新しくなります（開くときは保存済みのものを使い、裏で最新版を取りに行くため）。
- JS や CSS のファイルを増やしても、`index.html` に書けば `sw.js` は直さなくて大丈夫です。

## オンライン対戦の中継サーバー（TURN・Metered）

学校や会社のWi-Fi、スマホ回線などで直接つながらないときに、Metered の TURN サーバーで中継します。
ユーザー名とパスワードはリポジトリには入れず、GitHub の Secrets で管理します。

1. **Secrets を登録する**：Settings → Secrets and variables → Actions → New repository secret
   - `TURN_USERNAME`：Metered のダッシュボードに出ている TURN の Username
   - `TURN_CREDENTIAL`：同じく Credential（パスワード）
2. **公開のしかたを変える**：Settings → Pages → Build and deployment の Source を「GitHub Actions」にする
3. main にプッシュすると `.github/workflows/pages.yml` が動き、Secrets から `js/net/turn-config.js` を作って GitHub Pages に公開します
   （Actions タブの「GitHub Pages に公開」から手動でも動かせます）

- TURN の URL は Metered の標準（`global.relay.metered.ca`）を使います。ダッシュボードの URL が違うときは、
  Settings → Secrets and variables → Actions → Variables に `TURN_URLS`（カンマ区切り）を登録してください。
- リポジトリの `js/net/turn-config.js` は `null`（TURN なし）のままにしておきます。手元で開いたときは STUN だけで接続します。
- **注意**：公開したページを開いた人のブラウザには、TURN のユーザー名とパスワードが届きます（ブラウザが TURN に接続するために必要なため）。
  Secrets で管理するのは「リポジトリに書かない」ためで、ページを調べれば見えてしまいます。
  Metered のダッシュボードで、使える通信量の上限やアラートを設定しておくと安心です。
