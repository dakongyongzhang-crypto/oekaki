'use strict';
/* =====================================================
   Service Worker（PWA）：一度開けば、オフラインでも遊べるようにする
   - インストール時に index.html を読み、そこに書かれている CSS・JS・アイコンを全部保存する
     （ファイルを足しても、この一覧を手で直す必要はない）
   - 開くときは保存してあるものをすぐ使い、裏で最新版を取りに行く（次に開いたときに新しくなる）
   - 保存のしかたを大きく変えたときだけ、CACHE の名前を変える
   ===================================================== */
const CACHE = 'rr-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const html = await (await fetch('./index.html', { cache: 'no-cache' })).text();
    const local = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(u => !/^[a-z]+:|^\/\/|^#/i.test(u));
    try { // manifest に書いてあるアイコンも保存する
      const man = await (await fetch('./manifest.webmanifest', { cache: 'no-cache' })).json();
      for (const ic of man.icons || []) local.push(ic.src);
    } catch (_e) {}
    await cache.addAll([...new Set(['./', './index.html', ...local])].map(u => new Request(u, { cache: 'no-cache' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (!same && !FONT_HOSTS.includes(url.hostname)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: same });
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone());
      return res;
    }).catch(() => cached || Response.error());
    if (cached) { e.waitUntil(fresh); return cached; }
    return fresh;
  })());
});
