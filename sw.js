// Keeps the app working offline. Bump VERSION whenever you change a file,
// so phones pick up the new copy.
const VERSION = "breath-v2";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // The page itself: try the network first so updates show up, fall back to the saved copy.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); return r; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }
  // Everything else (icons, fonts): use the saved copy, and save new things as they load.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok || r.type === "opaque") {
        const copy = r.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
      }
      return r;
    }))
  );
});
