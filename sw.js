/* DGS Takip — servis çalışanı: uygulamanın internetsiz de açılması için dosyaları önbelleğe alır.
   Firebase veri istekleri (firestore/identitytoolkit) önbelleğe ALINMAZ; onları Firebase kendi yönetir. */
const CACHE = 'dgs-takip-v1';
const SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const LIBS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'];
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    // Önce ağ (güncel sürüm), bağlantı yoksa önbellek
    e.respondWith(fetch(req).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || (req.mode === 'navigate' ? caches.match('./index.html') : null)).then(m => m || Response.error())));
    return;
  }
  if (LIBS.includes(url.hostname) && (url.hostname !== 'www.gstatic.com' || url.pathname.startsWith('/firebasejs/'))) {
    // Kütüphaneler: önce önbellek
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    })));
  }
});
