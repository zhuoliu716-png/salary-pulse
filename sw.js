const CACHE = 'salary-pulse-5ef49a4c61e5';
const FILES = ["./","index.html","manifest.webmanifest","icon.png","assets/index-B6aqCRVY.css","assets/index-DFL4YRnk.js"];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(file, {cache: 'reload'}))))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('salary-pulse-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (event.request.mode === 'navigate') return (await cache.match('index.html')) || fetch(event.request);
    return (await cache.match(event.request, {ignoreVary: true})) || fetch(event.request);
  }));
});