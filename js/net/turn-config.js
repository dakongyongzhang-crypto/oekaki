'use strict';

/* =====================================================
   中継サーバー（TURN）の設定
   - リポジトリにはユーザー名・パスワードを書かない（ここは null のまま）
   - GitHub Pages に公開するとき、GitHub Actions が Secrets（TURN_USERNAME / TURN_CREDENTIAL）から
     このファイルを作り直す（.github/workflows/pages.yml）
   - null のとき（手元で開いたときなど）は STUN だけで接続する
   ===================================================== */
window.TURN_CONFIG = null;
