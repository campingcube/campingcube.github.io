// 캠핑큐브 파워뱅크 계산기 — 인터넷이 안 될 때도 계산기가 열리도록 저장해 두는 파일
// 계산기 파일만 다루고, 홈페이지의 다른 페이지는 건드리지 않아요.
const CACHE = "cc-calc-v5";
const FILES = [
  "./calculator.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("cc-calc-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isCalcFile(url) {
  if (url.origin !== self.location.origin) return false;
  const p = url.pathname;
  return p.endsWith("/calculator.html") || p.endsWith("/manifest.webmanifest") || p.includes("/icons/");
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || !isCalcFile(url)) return; // 다른 페이지는 평소처럼
  const key = url.pathname.endsWith("/calculator.html") ? "./calculator.html" : e.request;
  // 인터넷이 되면 항상 최신 파일을 받아 저장하고, 안 되면 저장된 파일을 보여줘요.
  e.respondWith(
    fetch(e.request, { cache: "no-cache" }) // 휴대폰에 남은 예전 파일 대신 항상 최신 파일 확인
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(key, copy));
        }
        return res;
      })
      .catch(() => caches.match(key))
  );
});
