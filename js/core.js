// Noyau d'interface : état partagé, routeur, en-tête, barre d'onglets, feuilles, graphiques, formules.
import { S, update, today } from "./store.js";
import { CONFIG, offer, MSGS_PER_WEEK, FREE_PROGRAMS, FREE_WEEKS, ALL_FREE } from "./config.js";

export const $app = document.getElementById("app");
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const buzz = (ms = 12) => { if (S().settings.haptics && navigator.vibrate) navigator.vibrate(ms); };
export const num = (x) => parseFloat(String(x ?? "").replace(",", "."));
export const fr = (n, d = 0) => (Math.round((n || 0) * 10 ** d) / 10 ** d).toLocaleString("fr-FR");
export const fmtDate = (d, o = { weekday: "long", day: "numeric", month: "long" }) => new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("fr-FR", o);
export const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 6e4); return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); };
export const addDays = (d, n) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return today(x); };
export const hhmm = (d = new Date()) => d.toTimeString().slice(0, 5);

// ---------- Formules ----------
export const tier = () => S().demoTier || S().me?.tier || "free";
export const rank = () => offer(tier()).rank;
export const premium = () => (ALL_FREE && !S().demoTier) || rank() >= 1;
export const expert = () => (ALL_FREE && !S().demoTier) || rank() >= 2; // contenus « suivi » (connaissances expertes)
export const isCoach = () => !!S().me?.isCoach && !S().demoTier;
export const programOpen = (id) => premium() || FREE_PROGRAMS.includes(id) || id === S().profile?.startProgram || (S().customPrograms || []).some(p => p.id === id);
export const weekOpen = (w) => premium() || w <= FREE_WEEKS;
export function msgQuotaText() {
  const lim = MSGS_PER_WEEK[tier()];
  if (lim == null) return "Messages illimités";
  const left = S().demoTier ? lim : (S().me?.msgsLeft ?? lim);
  return `${left} message${left > 1 ? "s" : ""} disponible${left > 1 ? "s" : ""} cette semaine`;
}

// ---------- Serveur (chargé à la demande) ----------
let C = null;
export const cloud = async () => { if (!C) { try { C = await import("./cloud.js"); } catch { C = null; } } return C; };
export const cloudNow = () => C;

// ---------- Icônes ----------
const svg = (d, w = 1.9) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const I = {
  x: (s = 28) => `<svg viewBox="0 0 40 40" width="${s}" height="${s}" aria-hidden="true"><defs><linearGradient id="gx${s}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#8F3510"/><stop offset=".6" stop-color="#C2541F"/><stop offset="1" stop-color="#EE8A45"/></linearGradient></defs><path d="M9 9l22 22" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M9 31 31 9" stroke="url(#gx${s})" stroke-width="6" stroke-linecap="round"/></svg>`,
  home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  cal: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  bar: svg('<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>'),
  fork: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  book: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21a2 2 0 0 1 2-2h13v2H6"/><path d="M11.5 7v7M9 9.5h5"/>'),
  coach: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/>'),
  bell: svg('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
  user: svg('<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.3-3.4 3.8-5 7-5s5.7 1.6 7 5"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>', 2.2),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>', 2.2),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 2.6),
  chev: `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>`,
  plus: svg('<path d="M12 5v14M5 12h14"/>', 2.2),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>'),
  dots: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 2.2),
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.6 3.3 4.4 6.7C19.5 15.4 12 20 12 20z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`,
  send: svg('<path d="M4 12 20 4l-6 16-3-7z"/>', 2),
  refresh: svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>', 2),
  scan: svg('<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 9v6M11 9v6M14 9v6M17 9v6"/>'),
};
// Nom de marque : CAL X STHENOS, avec le X du logo
const MINI_X = `<svg viewBox="54 52 292 320" aria-hidden="true" style="height:.74em;width:.68em;margin:0 .12em"><defs><linearGradient id="mxr" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#8F3510"/><stop offset=".55" stop-color="#C2541F"/><stop offset="1" stop-color="#EE8A45"/></linearGradient><linearGradient id="mxd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9501E"/><stop offset="1" stop-color="#5C2410"/></linearGradient></defs><path d="M300 52H346L212 212L118 372H70L188 212Z" fill="url(#mxd)"/><path d="M54 52H100L212 212L330 372H282L188 212Z" fill="url(#mxr)"/></svg>`;
export const logo = (size = 24) => `<span role="img" aria-label="Cal X Sthenos" style="display:inline-flex;align-items:center;font-family:var(--fg);font-weight:900;font-size:${size}px;letter-spacing:.08em;white-space:nowrap">CAL&nbsp;<span style="color:var(--red)">X</span>&nbsp;STHENOS</span>`;
export const markImg = (size = 96) => `<img src="assets/logo-grec.jpg" alt="Logo Cal X Sthenos" width="${size}" height="${size}" style="border-radius:${Math.round(size * .22)}px;box-shadow:0 12px 30px rgba(42,11,19,.3)">`;

// ---------- Retours visuels ----------
let toastT;
export function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.append(t);
  clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2600);
}
export function sheet(html, onMount, { keep = false } = {}) {
  const old = document.getElementById("sheet");
  if (keep && old) { const sh = old.querySelector(".sheet"), y = sh.scrollTop; sh.innerHTML = `<div class="grab" role="button" aria-label="Fermer"></div>${html}`; sh.querySelector(".grab").addEventListener("click", closeSheet); sh.scrollTop = y; onMount?.(old); return old; }
  closeSheet();
  const w = document.createElement("div"); w.className = "sheet-wrap"; w.id = "sheet";
  w.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  w.addEventListener("click", e => { if (e.target === w) closeSheet(); });
  const g = w.querySelector(".grab"), sh = w.querySelector(".sheet");
  g.setAttribute("role", "button"); g.setAttribute("aria-label", "Fermer"); g.addEventListener("click", closeSheet);
  let y0 = null; // glisser vers le bas depuis le haut de la fenêtre
  sh.addEventListener("touchstart", e => { y0 = sh.scrollTop <= 0 && e.touches[0].clientY - sh.getBoundingClientRect().top < 90 ? e.touches[0].clientY : null; }, { passive: true });
  sh.addEventListener("touchmove", e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  sh.addEventListener("touchend", e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; y0 = null; if (dy > 90) closeSheet(); else sh.style.transform = ""; });
  document.body.append(w); onMount?.(w); return w;
}
export function closeSheet() { const s = document.getElementById("sheet"); if (!s) return; s.remove(); if (s.dataset.rr) rerender(); }
export const wordOn = (place) => { const w = S().settings.word; return w === "daily" || (w === "discreet" && place === "home"); };
export const greet = () => { const h = new Date().getHours(); return h < 5 ? "Bonne nuit" : h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"; };

// ---------- En-tête et barre d'onglets ----------
export const badges = { msgs: 0, notifs: 0 };
export function header(title, sub = "", { back = null, actions = "" } = {}) {
  const demo = S().demoTier ? `<div class="demo-bar"><span class="grow">Démo · <b>${esc(offer(S().demoTier).name)}</b></span><button data-a="demo-choose">Choisir</button><button data-a="demo-exit">Quitter</button></div>` : "";
  const lead = back ? `<button class="icon-btn" ${back === "__hist" ? `data-a="hist-back"` : `data-a="go" data-r="${back}"`} aria-label="Retour">${I.back}</button>` : `<button class="appic" data-a="go" data-r="profile" aria-label="Profil"><img src="assets/logo-grec.jpg" alt="" width="40" height="40" style="width:100%;height:100%;border-radius:inherit;display:block"></button>`;
  return demo + `<header class="top"><div class="row1">${lead}<h1>${title}</h1>
    ${actions}<button class="pill ic" data-a="notifs" aria-label="Notifications">${I.bell}${badges.notifs ? `<span class="badge">${badges.notifs}</span>` : ""}</button>
    ${isCoach() ? "" : `<button class="pill" data-a="go" data-r="offers">🚀 ${rank() >= 2 ? "Coaching" : "Offres"}</button>`}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</header>`;
}
export function tabbar(active) {
  const t = [["home", "Accueil", I.home], ["train", "Entraînement", I.bar], ["food", "Nutrition", I.fork], ["word", "Parole", I.book], ["coach", isCoach() ? "Membres" : "Coach", I.coach]];
  const cur = S().current ? `<button data-a="resume" class="card tap" style="position:fixed;left:12px;right:12px;bottom:calc(80px + var(--safe-b));z-index:29;width:auto;max-width:616px;margin:0 auto;box-sizing:border-box;padding:12px 16px;display:flex;align-items:center;gap:12px;text-align:left;box-shadow:0 0 0 2px var(--red) inset,var(--shadow)"><span style="font-size:26px">🏋️</span><span class="grow"><b>Séance en cours</b><br><span class="small muted">${esc(S().current.title)}</span></span><span class="red" style="font-weight:700">Reprendre</span></button>` : "";
  return cur + `<nav class="tabbar" aria-label="Navigation">${t.map(([r, l, ic]) => `<a href="#/${r}" class="tab" ${r === active ? 'aria-current="page"' : ""}>${ic}<span>${l}</span>${r === "coach" && badges.msgs ? `<span class="badge">${badges.msgs}</span>` : ""}</a>`).join("")}</nav>`;
}
export const lockVeil = (label = "Bâtisseur", why = "") => `<div class="veil"><span class="lock">🔒 ${esc(label)}</span>${why ? `<p class="small muted" style="max-width:280px;margin:0">${esc(why)}</p>` : ""}<button class="btn btn-red btn-sm" data-a="go" data-r="offers">Voir les offres</button></div>`;
export const lockBtn = (label = "Bâtisseur") => `<button class="lock" data-a="go" data-r="offers">🔒 ${esc(label)}</button>`;
export const seg = (opts, cur, action) => `<div class="seg">${opts.map(([v, l]) => `<button data-a="${action}" data-v="${v}" class="${cur === v ? "on" : ""}">${l}</button>`).join("")}</div>`;
export const chips = (opts, cur, action, extra = "") => `<div class="chips ${extra}">${opts.map(([v, l]) => `<button class="chip ${cur === v ? "on" : ""}" data-a="${action}" data-v="${esc(v)}">${l}</button>`).join("")}</div>`;

// ---------- Graphiques ----------
export function ring(pct, size, stroke, color, track = "var(--line)") {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct || 0));
  return `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" opacity="${p > .004 ? 1 : 0}"/>`;
}
export const gradDef = (id) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EE8A45"/><stop offset=".5" stop-color="#C2541F"/><stop offset="1" stop-color="#8F3510"/></linearGradient></defs>`;
export function lineChart(series, { h = 160, unit = "", proj = null, yfmt = (v) => Math.round(v) } = {}) {
  const pts = series.filter(p => p.y != null);
  if (pts.length < 2 && !proj) return `<p class="empty small">La courbe apparaît après deux mesures.</p>`;
  const all = [...pts, ...(proj || [])];
  const W = 340, H = h, pl = 36, pr = 12, pt = 14, pb = 22;
  const ys = all.map(p => p.y), lo = Math.min(...ys), hi = Math.max(...ys), span = (hi - lo) || 1;
  const n = all.length, x = i => pl + i * (W - pl - pr) / Math.max(1, n - 1), y = v => pt + (1 - (v - lo) / span) * (H - pt - pb);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.y).toFixed(1)}`).join("");
  const pd = proj ? `M${x(pts.length - 1).toFixed(1)} ${y(pts.at(-1).y).toFixed(1)}` + proj.map((p, i) => `L${x(pts.length + i).toFixed(1)} ${y(p.y).toFixed(1)}`).join("") : "";
  const last = all.at(-1);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe">${gradDef("lg")}
    <line x1="${pl}" x2="${W - pr}" y1="${y(hi)}" y2="${y(hi)}" stroke="var(--line)" stroke-dasharray="3 4"/><line x1="${pl}" x2="${W - pr}" y1="${y(lo)}" y2="${y(lo)}" stroke="var(--line)" stroke-dasharray="3 4"/>
    <text x="${pl - 6}" y="${y(hi) + 4}" fill="var(--soft)" font-size="11" text-anchor="end">${yfmt(hi)}</text><text x="${pl - 6}" y="${y(lo) + 4}" fill="var(--soft)" font-size="11" text-anchor="end">${yfmt(lo)}</text>
    <path d="${d}" fill="none" stroke="url(#lg)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${pd ? `<path d="${pd}" fill="none" stroke="var(--red)" stroke-width="2" stroke-dasharray="5 5" opacity=".7"/><circle cx="${x(n - 1)}" cy="${y(last.y)}" r="4" fill="none" stroke="var(--red)" stroke-width="2"/>` : ""}
    <circle cx="${x(pts.length - 1)}" cy="${y(pts.at(-1).y)}" r="5" fill="var(--red)"/>
    <text x="${pl}" y="${H - 4}" fill="var(--soft)" font-size="11">${all[0].l}</text><text x="${W - pr}" y="${H - 4}" fill="var(--soft)" font-size="11" text-anchor="end">${last.l}</text></svg>`;
}
export function barChart(items, { h = 130, fmt = (v) => Math.round(v), hi = -1 } = {}) {
  const W = 340, mx = Math.max(1, ...items.map(i => i.v)), bw = (W - 20) / items.length;
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img" aria-label="Histogramme">${gradDef("bg1")}${items.map((it, i) => { const bh = it.v / mx * (h - 44); const xx = 10 + i * bw; return `<rect x="${xx + bw * .18}" y="${h - 24 - bh}" width="${bw * .64}" height="${Math.max(2, bh)}" rx="6" fill="${i === (hi < 0 ? items.length - 1 : hi) ? "url(#bg1)" : "var(--ink)"}" opacity="${it.v ? (i === (hi < 0 ? items.length - 1 : hi) ? 1 : .22) : .1}"/><text x="${xx + bw / 2}" y="${h - 8}" font-size="11" text-anchor="middle" fill="var(--soft)">${esc(it.l)}</text>${it.v ? `<text x="${xx + bw / 2}" y="${h - 28 - bh}" font-size="10.5" text-anchor="middle" fill="var(--soft)">${fmt(it.v)}</text>` : ""}`; }).join("")}</svg>`;
}
export function hbars(items, fmt = (v) => fr(v, 1)) {
  const mx = Math.max(1, ...items.map(i => i.v));
  return `<div class="bars">${items.map(i => `<div class="bar"><span>${esc(i.l)}</span><span><i style="width:${Math.max(3, i.v / mx * 100)}%"></i></span><b>${fmt(i.v)}</b></div>`).join("")}</div>`;
}

// ---------- Routeur ----------
export const routes = {};
export const R = { route: "home", param: null, param2: null };
export function go(r, p = null) { const h = "#/" + r + (p != null ? "/" + encodeURIComponent(p) : ""); if (location.hash === h) render(); else location.hash = h; }
const stops = new Set();
export const onLeave = (fn) => stops.add(fn);
export function render() {
  const h = location.hash.replace(/^#\/?/, "").split("/");
  R.route = h[0] || "home"; R.param = h[1] ? decodeURIComponent(h[1]) : null; R.param2 = h[2] ? decodeURIComponent(h[2]) : null;
  if (!S().profile && !["onboarding", "x", "privacy"].includes(R.route)) R.route = "onboarding";
  if (S().current && !["workout", "x", "fiche", "simu"].includes(R.route) && sessionStorage.getItem("cxs.min") !== "1") R.route = "workout";
  stops.forEach(f => f()); stops.clear(); closeSheet(); document.getElementById("hlb")?.remove();
  Promise.resolve((routes[R.route] || routes.home)()).then(centerChips);
  window.scrollTo(0, 0);
}
// Redessine la page sans la faire sauter : position de défilement et rangées de menus conservées
export function rerender(keepY = true) {
  const y = window.scrollY, rows = [...document.querySelectorAll(".chips:not(.wrap)")].map(r => r.scrollLeft);
  const restore = () => { document.querySelectorAll(".chips:not(.wrap)").forEach((r, i) => { if (rows[i] != null) r.scrollLeft = rows[i]; const on = r.querySelector(".chip.on"); if (on && (on.offsetLeft < r.scrollLeft || on.offsetLeft + on.offsetWidth > r.scrollLeft + r.clientWidth)) r.scrollTo({ left: on.offsetLeft - 16, behavior: "smooth" }); }); if (keepY) window.scrollTo(0, y); };
  const p = Promise.resolve((routes[R.route] || routes.home)()); restore(); p.then(restore);
}
// Fait apparaître la puce active dans les rangées qui défilent
function centerChips() { document.querySelectorAll(".chips:not(.wrap)").forEach(row => { const on = row.querySelector(".chip.on"); if (on && row.scrollWidth > row.clientWidth) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2; }); }

// ---------- Actions (délégation d'événements) ----------
export const actions = {}, forms = {}, changes = {};
actions["hist-back"] = () => { if (history.length > 1) history.back(); else go("home"); };
export function installEvents() {
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const fn = actions[b.dataset.a]; if (fn) { e.preventDefault(); await fn(b, b.dataset, e); }
  });
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest("form[data-f]"); if (!f) return; e.preventDefault();
    const fn = forms[f.dataset.f]; if (fn) await fn(Object.fromEntries(new FormData(f)), f, e);
  });
  document.addEventListener("change", async (e) => { const el = e.target.closest("[data-c]"); if (el && changes[el.dataset.c]) await changes[el.dataset.c](el, e); });
  document.addEventListener("input", (e) => { const el = e.target.closest("[data-i]"); if (el && changes["i:" + el.dataset.i]) changes["i:" + el.dataset.i](el, e); });
}
actions.go = (b, d) => { closeSheet(); go(d.r, d.p ?? null); };
actions.close = () => closeSheet();
