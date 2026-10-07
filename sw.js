/* 스포츠다트 리그 — 홈 화면 설치용 서비스 워커.
   앱 화면은 '새것 먼저(네트워크 우선)'로 받고, 끊겼을 때만 보관본을 보여 준다.
   Firebase 실시간 통신은 건드리지 않는다 — 기록은 항상 최신이어야 한다. */
const CACHE = "darts-shell-v24";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // 브라우저 임시 저장(깃허브는 10분)을 건너뛰고 서버에 새 버전이 있는지 늘 확인한다
  e.respondWith(fetch(req, { cache: "no-cache" }).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});
