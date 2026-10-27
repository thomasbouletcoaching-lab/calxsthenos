// Service worker CalXsthenos : l'app fonctionne hors ligne en salle.
// Après chaque modification de l'app, augmenter ce numéro de version.
const C = "cxs-v28";
const SHELL = ["./", "index.html", "css/app.css", "js/app.js", "js/core.js", "js/sync.js", "js/store.js", "js/engine.js", "js/energy.js", "js/nutrition.js", "js/recipes.js", "js/word.js", "js/config.js",
  "js/views/onboarding.js", "js/views/home.js", "js/views/agenda.js", "js/views/train.js", "js/views/food.js", "js/views/parole.js", "js/views/coach.js", "js/views/more.js", "js/views/season.js", "data/fiches.json", "data/lib.json",
  "data/programs.json", "data/nutrition-models.json", "data/bible/index.json", "data/bible/43.json", "manifest.webmanifest", "assets/logo-grec.jpg", "assets/favicon-96-grec.png", "assets/icon-192-grec.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.hostname.includes("openfoodfacts") || u.hostname.includes("supabase")) return; // toujours en ligne
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok && (u.origin === location.origin || u.hostname.includes("fonts."))) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
