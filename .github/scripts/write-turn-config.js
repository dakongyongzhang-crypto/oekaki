// GitHub Actions から呼ぶ：Secrets の TURN のユーザー名・パスワードで js/net/turn-config.js を作り直す。
// 値はログに出さない。Secrets が無いときは何もしない（STUN だけで動く）。
const fs = require('fs');
const user = process.env.TURN_USERNAME || '', cred = process.env.TURN_CREDENTIAL || '';
const urls = (process.env.TURN_URLS || '').split(/[\s,]+/).filter(Boolean);
if (!user || !cred) {
  console.log('TURN_USERNAME / TURN_CREDENTIAL が Secrets に無いので、TURN なし（STUN だけ）で公開します。');
  process.exit(0);
}
const cfg = { username: user, credential: cred };
if (urls.length) cfg.urls = urls;
fs.writeFileSync('js/net/turn-config.js', `'use strict';\n// GitHub Actions が Secrets から作ったファイル（リポジトリには入っていない）\nwindow.TURN_CONFIG = ${JSON.stringify(cfg)};\n`);
console.log(`TURN の設定を書き込みました（URL: ${urls.length ? urls.length + '個（TURN_URLS）' : 'Metered の標準'}）。`);
