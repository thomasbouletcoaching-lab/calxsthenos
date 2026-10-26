import { S, save, update, today, resetAll, exportJSON, importJSON, addPhoto, listPhotos, deletePhoto } from "./store.js";
import * as E from "./engine.js";
import * as N from "./nutrition.js";
import * as W from "./word.js";
import { CONFIG, OFFERS, offer, MSGS_PER_WEEK, FREE_PROGRAMS, FREE_WEEKS, FREE_FAVORITES } from "./config.js";

let C = null; // module serveur, chargé à la demande (l'app marche sans réseau)
const cloud = async () => { if (!C) { try { C = await import("./cloud.js"); } catch { C = null; } } return C; };

const $app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const buzz = (ms = 12) => { if (S().settings.haptics && navigator.vibrate) navigator.vibrate(ms); };
const kgTxt = (v) => v == null || v === "" ? "" : E.fmtKg(v);
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 6e4); return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); };

// ---------- Formules ----------
const tier = () => S().demoTier || S().me?.tier || "free";
const rank = () => offer(tier()).rank;
const premium = () => rank() >= 1;
const isCoach = () => !!S().me?.isCoach && !S().demoTier;
const programOpen = (id) => premium() || FREE_PROGRAMS.includes(id) || id === S().profile?.startProgram;
const weekOpen = (w) => premium() || w <= FREE_WEEKS;

// ---------- Icônes ----------
const svg = (d, w = 1.9) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  x: (s = 28, light = false) => `<svg viewBox="0 0 40 40" width="${s}" height="${s}" aria-hidden="true"><path d="M9 9l22 22" stroke="${light ? "#fff" : "currentColor"}" stroke-width="6" stroke-linecap="round"/><path d="M9 31 31 9" stroke="var(--red)" stroke-width="6" stroke-linecap="round"/></svg>`,
  home: svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  bar: svg('<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>'),
  fork: svg('<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6M17 21V3c-2 1-3 4-3 8h3"/>'),
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
  scan: svg('<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 9v6M11 9v6M14 9v6M17 9v6"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 2.2),
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.6 3.3 4.4 6.7C19.5 15.4 12 20 12 20z"/></svg>`,
  share: svg('<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>'),
  send: svg('<path d="M4 12 20 4l-6 16-3-7z"/>', 2),
};
const logo = (size = 24, light = false) => `<span class="logo" style="font-size:${size}px">CAL${I.x(size * .9, light)}STHENOS</span>`;

// ---------- Utilitaires d'interface ----------
let toastT;
function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.append(t);
  clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2600);
}
function sheet(html, onMount) {
  closeSheet();
  const w = document.createElement("div"); w.className = "sheet-wrap"; w.id = "sheet";
  w.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  w.addEventListener("click", e => { if (e.target === w) closeSheet(); });
  document.body.append(w); onMount?.(w);
}
function closeSheet() { document.getElementById("sheet")?.remove(); }
const greet = () => { const h = new Date().getHours(); return h < 5 ? "Bonne nuit" : h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"; };
const wordOn = (place) => { const w = S().settings.word; return w === "daily" || (w === "discreet" && place === "home"); };

let badges = { msgs: 0, notifs: 0 };
function header(title, sub = "", { back = null } = {}) {
  const demo = S().demoTier ? `<div class="demo-bar"><span class="grow">Démo · <b>${esc(offer(S().demoTier).name)}</b></span><button data-a="demo-choose">Choisir</button><button data-a="demo-exit">Quitter</button></div>` : "";
  return demo + `<header class="top">
    ${back ? `<button class="ib" data-a="go" data-r="${back}" aria-label="Retour">${I.back}</button>` : ""}
    <h1>${title}${sub ? `<span class="sub">${sub}</span>` : ""}</h1>
    <button class="ib" data-a="notifs" aria-label="Notifications">${I.bell}${badges.notifs ? `<span class="badge">${badges.notifs}</span>` : ""}</button>
    <button class="ib" data-a="go" data-r="profile" aria-label="Profil">${I.user}</button></header>`;
}
function tabbar(active) {
  const t = [["home", "Accueil", I.home], ["train", "Séance", I.bar], ["food", "Nutrition", I.fork], ["word", "Parole", I.book], ["coach", isCoach() ? "Membres" : "Coach", I.coach]];
  const cur = S().current ? `<button data-a="resume" class="card tap" style="position:fixed;left:10px;right:10px;bottom:calc(74px + var(--safe-b));z-index:29;max-width:600px;margin:0 auto;padding:11px 14px;display:flex;align-items:center;gap:12px;border-color:var(--red)"><span class="grow"><b>Séance en cours</b><br><span class="small muted">${esc(S().current.title)}</span></span><span class="red" style="font-weight:700">Reprendre</span></button>` : "";
  return cur + `<nav class="tabbar" aria-label="Navigation">${t.map(([r, l, ic]) => `<a href="#/${r}" class="tab" ${r === active ? 'aria-current="page"' : ""}>${ic}<span>${l}</span>${r === "coach" && badges.msgs ? `<span class="badge">${badges.msgs}</span>` : ""}</a>`).join("")}</nav>`;
}
function lockVeil(label = "Premium") {
  return `<div class="veil"><span class="lock">${I.lock} ${esc(label)}</span><button class="btn btn-red btn-sm" data-a="go" data-r="offers">Voir les offres</button></div>`;
}
function lineChart(points) {
  if (points.length < 2) return `<p class="empty small">La courbe apparaît après deux mesures.</p>`;
  const Wd = 340, H = 150, pl = 34, pr = 10, pt = 14, pb = 22;
  const ys = points.map(p => p.y), lo = Math.min(...ys), hi = Math.max(...ys), span = (hi - lo) || 1;
  const x = i => pl + i * (Wd - pl - pr) / (points.length - 1), y = v => pt + (1 - (v - lo) / span) * (H - pt - pb);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.y).toFixed(1)}`).join("");
  const last = points[points.length - 1];
  return `<svg class="chart" viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Courbe">
    <line x1="${pl}" x2="${Wd - pr}" y1="${y(hi)}" y2="${y(hi)}" stroke="var(--line)" stroke-dasharray="3 4"/><line x1="${pl}" x2="${Wd - pr}" y1="${y(lo)}" y2="${y(lo)}" stroke="var(--line)" stroke-dasharray="3 4"/>
    <text x="${pl - 6}" y="${y(hi) + 4}" fill="var(--soft)" font-size="11" text-anchor="end">${Math.round(hi)}</text><text x="${pl - 6}" y="${y(lo) + 4}" fill="var(--soft)" font-size="11" text-anchor="end">${Math.round(lo)}</text>
    <path d="${d}" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(points.length - 1)}" cy="${y(last.y)}" r="4.5" fill="var(--red)"/>
    <text x="${pl}" y="${H - 4}" fill="var(--soft)" font-size="11">${points[0].l}</text><text x="${Wd - pr}" y="${H - 4}" fill="var(--soft)" font-size="11" text-anchor="end">${last.l}</text></svg>`;
}
function ring(pct, size, stroke, color, track = "var(--paper2)") {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct || 0));
  return `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" opacity="${p > 0.005 ? 1 : 0}"/>`;
}
function nutritionRings(t, tot) {
  const over = tot.kcal > t.kcal * 1.05;
  const big = `<div class="ring-big"><svg viewBox="0 0 150 150">${ring(tot.kcal / t.kcal, 150, 14, over ? "var(--warn)" : "var(--red)")}</svg><div class="c"><b>${Math.abs(t.kcal - Math.round(tot.kcal))}</b><span>kcal ${tot.kcal > t.kcal ? "en trop" : "restantes"}</span><span class="xs">${Math.round(tot.kcal)} / ${t.kcal}</span></div></div>`;
  const m = [["Protéines", tot.p, t.prot, "var(--red)"], ["Glucides", tot.c, t.carbs, "var(--ink)"], ["Lipides", tot.f, t.fat, "var(--gold)"]];
  const rows = m.map(([l, a, b, col]) => `<div class="macro-row"><svg class="mini-ring" viewBox="0 0 40 40">${ring(a / b, 40, 5, col)}</svg><div class="row between small"><b>${l}</b><span class="num">${Math.round(a)}<span class="muted" style="font-family:var(--f);font-weight:400"> / ${b} g</span></span></div></div>`).join("");
  return `<div class="rings">${big}<div>${rows}</div></div>`;
}

// ---------- Routeur ----------
const routes = {};
let route = "home", param = null;
function go(r, p = null) { const h = "#/" + r + (p != null ? "/" + encodeURIComponent(p) : ""); if (location.hash === h) render(); else location.hash = h; }
function render() {
  const h = location.hash.replace(/^#\/?/, "").split("/");
  route = h[0] || "home"; param = h[1] ? decodeURIComponent(h[1]) : null;
  if (!S().profile && !["onboarding", "x", "privacy"].includes(route)) route = "onboarding";
  if (S().current && !["workout", "x"].includes(route) && sessionStorage.getItem("cxs.min") !== "1") route = "workout";
  stopPoll(); closeSheet();
  (routes[route] || routes.home)();
  window.scrollTo(0, 0);
}

// =====================================================================
// ONBOARDING
// =====================================================================
const OB = { i: -1, a: {}, echo: null };
const STEPS = [
  { id: "name", type: "text", q: () => `Salut, je suis Thomas, ton coach. <span class="k">Comment tu t'appelles ?</span>`, ph: "Ton prénom", ac: "given-name" },
  { id: "email", type: "email", q: (a) => `Enchanté ${esc(a.name)}. Quelle est ton <span class="k">adresse e-mail</span> ?`, sub: "Elle sert à retrouver ton compte et à recevoir mes réponses. Jamais revendue." },
  { id: "goal", q: () => `Quel est ton <span class="k">objectif principal</span> ?`, opts: [["muscle", "Prendre du muscle"], ["strength", "Gagner en force"], ["fat", "Perdre du gras"], ["recomp", "Perdre du gras et prendre du muscle"], ["restart", "Reprendre le sport"]] },
  { id: "discipline", q: () => `Ce qui te <span class="k">parle le plus</span> ?`, opts: [["musculation", "Musculation"], ["powerbuilding", "Powerbuilding", "Force et muscle"], ["streetlifting", "Street lifting", "Tractions et dips lestés"], ["street", "Street workout", "Le programme poids du corps arrive bientôt"]] },
  { id: "level", q: () => `Où en es-tu <span class="k">aujourd'hui</span> ?`, opts: [["beginner", "Je débute"], ["comeback", "Je reprends après une pause"], ["regular", "Je m'entraîne régulièrement"], ["advanced", "Je m'entraîne depuis plus de 2 ans"]] },
  { id: "place", q: () => `Compris. <span class="k">Où</span> t'entraînes-tu ?`, opts: [["bigGym", "En salle (Basic-Fit ou équivalent)"], ["smallGym", "Dans une petite salle"], ["home", "À la maison, avec haltères"], ["bodyweight", "Au poids du corps, dehors"]] },
  { id: "days", q: () => `Combien de <span class="k">jours par semaine</span> peux-tu vraiment t'entraîner ?`, sub: "Vise ce que tu tiens sur 12 semaines, pas ce que tu ferais une bonne semaine.", opts: [[2, "2 jours"], [3, "3 jours"], [4, "4 jours"], [5, "5 jours"], [6, "6 jours"]] },
  { id: "backPain", q: () => `As-tu une <span class="k">gêne au bas du dos</span> en ce moment ?`, opts: [[false, "Non"], [true, "Oui, régulièrement"]] },
  { id: "records", type: "records", skip: (a) => a.level === "beginner" || a.level === "comeback", q: () => `Tes <span class="k">meilleures séries</span> récentes`, sub: "Répétitions et charge sur une série récente faite avec effort et bonne technique. Laisse vide ce que tu ne fais pas." },
  { id: "body", type: "body", q: () => `Pour calculer ton <span class="k">carburant</span>`, sub: "Âge, taille et poids." },
  { id: "activity", q: () => `Ta journée, en dehors du sport ?`, opts: [["low", "Assis la plupart du temps"], ["mid", "Debout ou en mouvement une partie du temps"], ["high", "Métier physique"]] },
  { id: "diet", q: () => `Ton <span class="k">alimentation</span> ?`, opts: [["all", "Je mange de tout"], ["vegetarian", "Végétarien"], ["vegan", "Vegan"]] },
  { id: "word", q: () => `Dernière chose. Veux-tu une <span class="k">parole pour la route</span> chaque jour ?`, sub: "CalXsthenos veut prendre soin de ton corps, de ton âme et de ton esprit. Tu peux changer ce choix à tout moment.", opts: [["daily", "Oui, chaque jour"], ["discreet", "Seulement sur l'accueil"], ["off", "Pas maintenant"]] },
];
const LIFTS_ASK = (a) => a.discipline === "streetlifting"
  ? [["pullup", "Tractions lestées", "lest"], ["dip", "Dips lestés", "lest"], ["squat", "Squat barre"], ["bench", "Développé couché barre"]]
  : [["squat", "Squat barre"], ["bench", "Développé couché barre"], ["deadlift", "Soulevé de terre"], ["ohp", "Développé militaire barre"]];
const visibleSteps = () => STEPS.filter(s => !(s.skip && s.skip(OB.a)));

routes.onboarding = () => {
  if (OB.i < 0) return renderWelcome();
  const steps = visibleSteps(), s = steps[OB.i];
  if (!s) return renderBuilding();
  const pct = Math.round(OB.i / steps.length * 100);
  let body = "";
  if (s.type === "text") body = `<form class="choices" data-f="ob-text" style="align-items:stretch"><label class="field"><span>${s.ph}</span><input name="v" autocomplete="${s.ac}" required maxlength="30" value="${esc(OB.a[s.id] || "")}"></label><button class="btn btn-red">Continuer</button></form>`;
  else if (s.type === "email") body = `<form class="choices" data-f="ob-email" style="align-items:stretch"><label class="field"><span>Adresse e-mail</span><input name="v" type="email" autocomplete="email" inputmode="email" required value="${esc(OB.a.email || "")}"></label>
    <label class="check"><input type="checkbox" name="news" ${OB.a.news !== false ? "checked" : ""}> Recevoir mes conseils et les nouveautés de CalXsthenos par e-mail (désinscription en un clic).</label>
    <p class="xs muted" style="text-align:left;margin:0">En continuant, tu acceptes la <a href="#/privacy">politique de confidentialité</a>.</p><button class="btn btn-red">Continuer</button></form>`;
  else if (s.type === "records") body = `<form class="choices" data-f="ob-records" style="align-items:stretch">${LIFTS_ASK(OB.a).map(([k, n, lest]) => `<div><div class="small" style="font-weight:700;margin-bottom:6px;text-align:left">${n}</div><div class="grid2"><label class="field"><span>Répétitions</span><input name="${k}-r" inputmode="numeric" placeholder="0"></label><label class="field"><span>${lest ? "Lest (kg)" : "Charge (kg)"}</span><input name="${k}-k" inputmode="decimal" placeholder="0"></label></div></div>`).join("")}<button class="btn btn-red">Continuer</button><button type="button" class="link" data-a="ob-skip" style="align-self:center">Je ne sais pas, passer</button></form>`;
  else if (s.type === "body") body = `<form class="choices" data-f="ob-body" style="align-items:stretch"><div class="seg" role="group"><button type="button" data-a="ob-sex" data-v="m" class="${OB.a.sex !== "f" ? "on" : ""}">Homme</button><button type="button" data-a="ob-sex" data-v="f" class="${OB.a.sex === "f" ? "on" : ""}">Femme</button></div><div class="grid3"><label class="field"><span>Âge</span><input name="age" inputmode="numeric" required value="${OB.a.age || ""}"></label><label class="field"><span>Taille (cm)</span><input name="height" inputmode="numeric" required value="${OB.a.height || ""}"></label><label class="field"><span>Poids (kg)</span><input name="weight" inputmode="decimal" required value="${OB.a.weight || ""}"></label></div><button class="btn btn-red">Continuer</button></form>`;
  else body = `<div class="choices">${s.opts.map(([v, l, sub]) => `<button class="choice" data-a="ob-pick" data-v='${JSON.stringify(v)}'>${l}${sub ? `<small>${sub}</small>` : ""}</button>`).join("")}</div>`;
  $app.innerHTML = `<section class="convo">
    <div class="convo-top"><button class="icon-btn" data-a="ob-back" aria-label="Retour">${I.back}</button><div class="progress"><i style="width:${pct}%"></i></div></div>
    ${OB.echo ? `<div class="echo">${esc(OB.echo)}</div>` : ""}
    <div class="coach-mark"><span class="av">${I.x(20, true)}</span>Thomas · ton coach</div>
    <h1 class="q">${s.q(OB.a)}</h1>${s.sub ? `<p class="q-sub">${s.sub}</p>` : ""}${body}</section>`;
};
function renderWelcome() {
  $app.innerHTML = `<section class="convo dark" style="justify-content:space-between">
    <div class="mt24">${logo(30, true)}</div>
    <div><h1 class="h-hero" style="font-size:44px">Ton corps, ton âme, ton esprit.<br><span style="color:var(--red)">Un seul plan.</span></h1>
      <p class="mt16" style="font-size:17px;color:rgba(255,255,255,.72)">Entraînement, nutrition et progression calculés pour toi par un coach diplômé STAPS. Des charges qui suivent ce que tu fais vraiment.</p></div>
    <div class="stack"><button class="btn btn-red" data-a="ob-start">Créer mon plan gratuit</button>
      <label class="btn btn-ghost" style="cursor:pointer">Restaurer une sauvegarde<input type="file" accept="application/json" data-f="import" hidden></label></div></section>`;
}
function obNext(val, echo) { const s = visibleSteps()[OB.i]; if (s) OB.a[s.id] = val; OB.echo = echo; OB.i++; buzz(); routes.onboarding(); }
async function renderBuilding() {
  const a = OB.a;
  const lines = ["Analyse de ton profil", "Choix de ton programme", "Calcul de tes charges", "Calcul de ton carburant"];
  $app.innerHTML = `<section class="loader"><svg class="big-x" viewBox="0 0 40 40"><path class="s1" d="M9 9l22 22" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/><path class="s2" d="M9 31 31 9" stroke="var(--red)" stroke-width="5" stroke-linecap="round" fill="none"/></svg><ul style="padding:0;margin:0">${lines.map(l => `<li><i></i>${l}</li>`).join("")}</ul></section>`;
  await Promise.all([E.loadPrograms(), N.loadModels()]);
  const rec = {};
  Object.entries(a.records || {}).forEach(([k, v]) => { if (v.k > 0 && v.r > 0) rec[k] = { ...v, e1rm: Math.round(E.e1rm(v.k, v.r, 9) * 10) / 10 }; });
  const profile = { name: a.name, email: a.email, news: a.news !== false, goal: a.goal, discipline: a.discipline === "street" ? "musculation" : a.discipline, wantsStreet: a.discipline === "street", level: a.level, place: a.place, days: a.days, backPain: a.backPain, records: rec, sex: a.sex || "m", age: +a.age, height: +a.height, weight: +a.weight, activity: a.activity, diet: a.diet, createdAt: today() };
  profile.nutritionModel = N.pickModel(profile);
  profile.startProgram = E.pickProgram(profile);
  update(st => {
    st.profile = profile; st.settings.word = a.word || "daily"; st.synced = false;
    st.plan = { programId: profile.startProgram, startedAt: today(), week: 1, idx: 0, cycle: 1 };
    st.measures.push({ d: today(), weight: profile.weight });
  });
  const sync = syncProfile();
  const lis = [...$app.querySelectorAll("li")];
  for (let k = 0; k < lis.length; k++) { await new Promise(r => setTimeout(r, 600)); lis[k].classList.add("ok"); lis[k].querySelector("i").innerHTML = I.check.replace("<svg", '<svg width="13" height="13"'); }
  await Promise.race([sync, new Promise(r => setTimeout(r, 2500))]);
  OB.i = -1; OB.a = {}; OB.echo = null;
  go("plan");
}
async function syncProfile() {
  const c = await cloud(); if (!c) return;
  try {
    await c.ensureSession();
    const p = S().profile;
    await c.saveProfile({ email: p.email, name: p.name, onboarding: { ...p, word: S().settings.word, application: S().application || null } });
    update(st => st.synced = true);
    await refreshMe();
  } catch (e) { console.warn("Synchronisation impossible :", e.message); }
}
async function refreshMe() {
  const c = await cloud(); if (!c || !S().profile) return;
  try {
    if (!(await c.currentSession())) await c.ensureSession();
    if (!S().synced) return syncProfile();
    const me = await c.fetchMe();
    if (me) update(st => st.me = { tier: me.tier, isCoach: me.is_coach, msgsLeft: me.msgsLeft, until: me.tier_until });
    const [un, ns] = await Promise.all([c.unreadFromCoach(), c.notifications()]);
    badges.msgs = un; badges.notifs = ns.filter(n => new Date(n.created_at).getTime() > S().notifSeen).length;
    if (isCoach()) { const ms = await c.members(); window.__members = ms; badges.msgs = ms.reduce((a, m) => a + m.unread, 0); }
    document.querySelectorAll(".top .ib[data-a=notifs]").forEach(b => { b.querySelector(".badge")?.remove(); if (badges.notifs) b.insertAdjacentHTML("beforeend", `<span class="badge">${badges.notifs}</span>`); });
    document.querySelectorAll('.tab[href="#/coach"]').forEach(b => { b.querySelector(".badge")?.remove(); if (badges.msgs) b.insertAdjacentHTML("beforeend", `<span class="badge">${badges.msgs}</span>`); });
  } catch (e) { console.warn(e.message); }
}
function pushStats() {
  cloud().then(c => c?.touch({ workouts: S().workouts.length, lastWorkout: S().workouts.at(-1)?.end || null, weight: S().profile?.weight, program: S().plan?.programId, week: S().plan?.week })).catch(() => { });
}

// Révélation du plan
routes.plan = () => {
  const ns = E.nextSession(); if (!ns) return go("home");
  const { p } = ns, t = N.targets(), lay = E.weekLayout(p);
  $app.innerHTML = `<section class="page full">
    <p class="red" style="font-weight:700;margin:14px 0 4px">Ton plan, ${esc(S().profile.name)}</p>
    <h1 class="h-hero">${esc(p.name.split("·")[0].trim())}</h1>
    <p class="muted mt8">${esc(p.desc)}</p>
    <div class="stat3 mt16"><div><b>${p.s.length}×</b><span>par semaine</span></div><div><b>${ns.weeks}</b><span>semaines</span></div><div><b style="font-size:18px;line-height:31px">${esc(p.lvl)}</b><span>niveau</span></div></div>
    ${S().profile.days !== p.s.length ? `<p class="small muted mt12">Tu as choisi ${S().profile.days} jours : ce programme en demande ${p.s.length}, le meilleur rapport résultats / régularité pour ton profil.</p>` : ""}
    <h2 class="sec">Ta semaine type</h2>
    ${lay.map((l, i) => `<div class="day-card ${i === 0 ? "first" : ""}"><div class="grow"><span class="tag ${i === 0 ? "r" : ""}">${E.DAY_NAMES[l.dow]}</span>${i === 0 ? '<span class="tag r">Première séance</span>' : ""}<div class="h3 mt8">${esc(l.s[0])}</div><div class="small muted">${l.s[2].length} exercices</div></div></div>`).join("")}
    <h2 class="sec">Pourquoi ce plan marche</h2><p>${esc(p.why)}</p>
    <div class="card mt12"><div class="h3">Ton carburant</div><p class="small muted mt4" style="margin-bottom:12px">${esc(t.model.name)} · ${t.kcal} kcal par jour</p>${nutritionRings(t, { kcal: 0, p: 0, c: 0, f: 0 })}</div>
    ${wordOn("home") ? `<div class="card mt12">${W.wordCard(W.VERSES.find(v => v.id === "v-col3-23"))}</div>` : ""}
  </section><div class="dock"><button class="btn btn-red" data-a="go" data-r="home">C'est parti</button></div>`;
};

// =====================================================================
// ACCUEIL
// =====================================================================
routes.home = () => {
  const pr = S().profile, ns = E.nextSession(), t = N.targets(), tot = N.dayTotals();
  const done = E.workoutsThisWeek().length, streak = E.streakWeeks(), gap = E.daysSinceLast();
  const lay = ns ? E.weekLayout(ns.p) : [], dow = (new Date().getDay() + 6) % 7;
  const doneDows = new Set(E.workoutsThisWeek().map(w => (new Date(w.end).getDay() + 6) % 7));
  const hard = gap !== null && gap >= 10;
  const af = W.affirmationOfDay();
  const blocked = ns && !weekOpen(ns.week);
  $app.innerHTML = header(`${greet()} ${esc(pr.name)}`, fmtDate(new Date())) + `<section class="page">
    ${hard ? `<div class="card red-edge" style="margin-bottom:12px"><b>${gap} jours sans séance.</b> On reprend là où tu es, pas là où tu aurais voulu être. Les charges de la prochaine séance sont allégées de 10 %.</div>` : ""}
    ${ns ? `<div class="hero">
      <div class="small muted">Semaine ${ns.week} sur ${ns.weeks} · ${esc(ns.phase || "")}</div>
      <h2 class="h1 mt4">${esc(ns.title)}</h2>
      <p class="small muted mt8" style="margin-bottom:16px;max-width:85%">${ns.exercises.length} exercices · ${ns.exercises.slice(0, 3).map(e => esc(S().swaps[e[0]] || e[0])).join(", ")}…</p>
      ${blocked ? `<p class="small" style="margin-bottom:12px">Tes ${FREE_WEEKS} premières semaines sont faites. Ton bloc suivant est prêt, avec tes charges calculées.</p><button class="btn btn-red" data-a="go" data-r="offers">Débloquer la suite</button>` : `<button class="btn btn-red" data-a="start">${S().current ? "Reprendre la séance" : "Commencer la séance"}</button>`}
    </div>` : ""}
    <div class="wk mt12">${E.DAY_SHORT.map((d, i) => `<div class="${lay.some(l => l.dow === i) ? "plan" : ""} ${doneDows.has(i) ? "done" : ""} ${i === dow ? "today" : ""}">${d}<b>${doneDows.has(i) ? "✓" : lay.some(l => l.dow === i) ? "•" : ""}</b></div>`).join("")}</div>
    <p class="small muted mt8">${done} séance${done > 1 ? "s" : ""} cette semaine${streak > 1 ? ` · ${streak} semaines actives d'affilée` : ""}</p>
    ${wordOn("home") ? `<button class="daycard mt16" data-a="go" data-r="word" style="display:block;width:100%;text-align:left"><p class="affirm">${esc(hard ? "Je tombe peut-être, mais je me relève." : af.t)}</p><div class="affirm-ref">${esc(hard ? "Proverbes 24:16" : af.ref)}</div></button>` : ""}
    ${t ? `<h2 class="sec">Nutrition du jour <small>${Math.round(tot.kcal)} / ${t.kcal} kcal</small></h2><button class="card tap" data-a="go" data-r="food">${nutritionRings(t, tot)}</button>` : ""}
    <h2 class="sec">Ton coach</h2>
    <button class="card tap" data-a="go" data-r="${isCoach() ? "coach" : "chat"}" style="display:flex;align-items:center;gap:12px">
      <span style="width:44px;height:44px;border-radius:50%;background:var(--head);display:grid;place-items:center;flex:none">${I.x(22, true)}</span>
      <span class="grow"><b>${isCoach() ? "Espace coach" : "Écrire à Thomas"}</b><br><span class="small muted">${isCoach() ? "Tes membres et leurs messages" : badges.msgs ? `${badges.msgs} nouveau${badges.msgs > 1 ? "x" : ""} message${badges.msgs > 1 ? "s" : ""}` : msgQuotaText()}</span></span>${I.chev}</button>
    ${rank() < 2 && !isCoach() ? `<button class="card tap mt12" data-a="go" data-r="offers" style="display:flex;align-items:center;gap:12px"><span class="grow"><b>${premium() ? "Passer au suivi avec Thomas" : "Découvrir Premium et le coaching"}</b><br><span class="small muted">Essaie chaque offre en démo avant de choisir.</span></span>${I.chev}</button>` : ""}
  </section>${tabbar("home")}`;
};
function msgQuotaText() {
  const lim = MSGS_PER_WEEK[tier()];
  if (lim == null) return "Messages illimités";
  const left = S().demoTier ? lim : (S().me?.msgsLeft ?? lim);
  return `${left} message${left > 1 ? "s" : ""} disponible${left > 1 ? "s" : ""} cette semaine`;
}

// =====================================================================
// SÉANCE : programme, banque, progrès, historique
// =====================================================================
let trainTab = "programme";
routes.train = async () => {
  await E.loadPrograms();
  const ns = E.nextSession(); const { p } = ns;
  const seg = `<div class="seg">${[["programme", "Programme"], ["banque", "Banque"], ["progres", "Progrès"], ["historique", "Historique"]].map(([v, l]) => `<button data-a="train-tab" data-v="${v}" class="${trainTab === v ? "on" : ""}">${l}</button>`).join("")}</div>`;
  let body = "";
  if (trainTab === "programme") {
    const blocked = !weekOpen(ns.week);
    body = `<div class="card mt12"><div class="small muted">Ton programme</div><div class="h2 mt4">${esc(p.name)}</div><p class="small muted mt8">Semaine ${ns.week} sur ${ns.weeks} · ${esc(ns.phase)}</p></div>
      <h2 class="sec">Prochaine séance</h2>
      <div class="card"><div class="h2">${esc(ns.title)}</div>
        <ul style="padding:0;margin:12px 0 16px;list-style:none">${ns.exercises.map(e => `<li class="row between small" style="padding:7px 0;border-top:1px solid var(--line)"><span>${esc(S().swaps[e[0]] || e[0])}</span><span class="tag">${E.KIND_LABEL[e[1]] || ""}</span></li>`).join("")}</ul>
        ${blocked ? `<button class="btn btn-red" data-a="go" data-r="offers">Débloquer la semaine ${ns.week}</button>` : `<button class="btn btn-red" data-a="start">${S().current ? "Reprendre la séance" : "Commencer la séance"}</button>`}</div>
      <h2 class="sec">Les règles de ton programme</h2>
      <div class="card"><ul style="margin:0;padding-left:18px" class="small">${(p.rules || []).map(r => `<li style="margin-bottom:8px">${esc(r)}</li>`).join("")}</ul></div>`;
  } else if (trainTab === "banque") {
    body = `<p class="small muted mt12">Les programmes de ${esc(CONFIG.coachName)}, conçus et testés en salle. Changer de programme repart en semaine 1, tes charges sont conservées.</p>
      ${E.programs().map(pg => { const open = programOpen(pg.id), cur = pg.id === S().plan.programId;
        return `<div class="card ${cur ? "hl" : ""} mt8"><div class="row between"><span>${cur ? '<span class="tag r">En cours</span>' : ""}<span class="tag">${esc(pg.lvl)}</span><span class="tag">${pg.days.filter(Boolean).length} j</span></span>${open ? "" : `<span class="lock">${I.lock} Premium</span>`}</div>
        <div class="h3 mt8">${esc(pg.name)}</div><p class="small muted mt4">${esc(pg.prof)}</p>
        ${cur ? "" : open ? `<button class="btn btn-line btn-sm mt8" data-a="set-program" data-id="${pg.id}">Choisir ce programme</button>` : `<button class="btn btn-line btn-sm mt8" data-a="go" data-r="offers">Débloquer</button>`}</div>`; }).join("")}`;
  } else if (trainTab === "progres") {
    body = await progressBody();
  } else {
    const ws = S().workouts.slice().reverse();
    body = ws.length ? `<div class="list mt12">${ws.slice(0, 40).map(w => `<div class="li"><span class="grow">${esc(w.title)}<br><span class="xs muted">${new Date(w.end).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${w.setsDone} séries · ${(w.volume / 1000).toFixed(1).replace(".", ",")} t</span></span><span class="small muted">${Math.round((new Date(w.end) - new Date(w.start)) / 6e4)} min</span></div>`).join("")}</div>` : `<p class="empty">Tes séances terminées apparaîtront ici.</p>`;
  }
  $app.innerHTML = header("Séance", esc(p.name.split("·")[0].trim())) + `<section class="page">${seg}${body}</section>${tabbar("train")}`;
};
let progTab = "force", liftSel = null;
async function progressBody() {
  let body = `<div class="chips mt12">${[["force", "Force"], ["corps", "Corps"]].map(([v, l]) => `<button class="chip ${progTab === v ? "on" : ""}" data-a="prog-tab" data-v="${v}">${l}</button>`).join("")}</div>`;
  if (progTab === "force") {
    const lifts = Object.entries(S().lifts).filter(([, h]) => h.length).sort((a, b) => b[1].length - a[1].length);
    if (!liftSel || !S().lifts[liftSel]) liftSel = lifts[0]?.[0];
    const h = liftSel ? S().lifts[liftSel] : [];
    const wk = E.activeWeeks(8), mx = Math.max(1, ...wk.map(w => w.count));
    const recs = lifts.map(([n, h]) => [n, Math.max(...h.map(x => x.e1rm))]).sort((a, b) => b[1] - a[1]).slice(0, 8);
    body += `<div class="card mt12"><div class="row between"><span class="h3">Régularité</span><span class="small muted">8 semaines</span></div>
      <svg class="chart mt12" viewBox="0 0 340 110" role="img" aria-label="Séances par semaine">${wk.map((w, i) => { const bh = w.count / mx * 70; return `<rect x="${i * 42 + 6}" y="${84 - bh}" width="30" height="${Math.max(2, bh)}" rx="5" fill="${i === wk.length - 1 ? "var(--red)" : "var(--ink)"}" opacity="${w.count ? 1 : .15}"/><text x="${i * 42 + 21}" y="104" font-size="11" text-anchor="middle" fill="var(--soft)">${w.count}</text>`; }).join("")}</svg></div>`;
    body += lifts.length ? `<div class="card mt12 ${premium() ? "" : "locked"}"><div class="h3">Force estimée (1RM)</div>
        <div class="chips mt12">${lifts.slice(0, 8).map(([n]) => `<button class="chip ${n === liftSel ? "on" : ""}" data-a="lift" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div>
        <div class="mt12">${lineChart(h.map(x => ({ y: x.e1rm, l: x.d.slice(8, 10) + "/" + x.d.slice(5, 7) })))}</div>${premium() ? "" : lockVeil()}</div>` : "";
    if (recs.length) body += `<h2 class="sec">Records</h2><div class="list">${recs.map(([n, v]) => `<div class="li"><span class="grow small">${esc(n)}</span><span class="num">${Math.round(v)} kg</span></div>`).join("")}</div>`;
  } else {
    const ms = S().measures, ws = ms.filter(m => m.weight);
    const avg = ws.map((m, i) => { const win = ws.slice(Math.max(0, i - 6), i + 1); return { y: win.reduce((a, b) => a + b.weight, 0) / win.length, l: m.d.slice(8, 10) + "/" + m.d.slice(5, 7) }; });
    const lastT = [...ms].reverse().find(m => m.waist);
    const photos = premium() ? await listPhotos() : [];
    body += `<div class="card mt12"><div class="row between"><span class="h3">Poids</span><span class="small muted">moyenne sur 7 jours</span></div>
        ${avg.length ? `<div class="num mt8" style="font-size:32px">${avg.at(-1).y.toFixed(1).replace(".", ",")} kg</div>` : ""}
        <div class="mt8">${lineChart(avg)}</div>
        <form class="row mt12" data-f="weight" style="gap:8px"><label class="field grow"><span>Pesée du jour (kg)</span><input name="w" inputmode="decimal" required></label><button class="btn btn-red btn-sm">Enregistrer</button></form>
        <p class="xs muted mt8">Pèse-toi le matin, à jeun. La moyenne compte, pas la pesée du jour.</p></div>
      <div class="card mt12 ${premium() ? "" : "locked"}"><div class="h3">Mensurations (cm)</div>
        <form data-f="measures" class="mt12"><div class="grid2">${[["waist", "Tour de taille"], ["hips", "Hanches"], ["chest", "Poitrine"], ["arm", "Bras"], ["thigh", "Cuisse"]].map(([k, l]) => `<label class="field"><span>${l}</span><input name="${k}" inputmode="decimal" placeholder="${lastT?.[k] ?? ""}"></label>`).join("")}</div><button class="btn btn-line btn-sm mt12" style="width:100%">Enregistrer</button></form>${premium() ? "" : lockVeil()}</div>
      <div class="card mt12 ${premium() ? "" : "locked"}"><div class="row between"><span class="h3">Photos</span><label class="link" style="cursor:pointer">Ajouter<input type="file" accept="image/*" data-f="photo" hidden></label></div>
        <p class="xs muted">Elles restent sur ce téléphone, personne d'autre ne les voit.</p>
        ${photos.length ? `<div class="photo-grid mt12">${photos.map(p => `<button data-a="photo" data-id="${p.id}"><img alt="Photo du ${p.d}" src="${URL.createObjectURL(p.blob)}"></button>`).join("")}</div>` : `<p class="empty small">Une photo par mois, même lumière, même tenue.</p>`}${premium() ? "" : lockVeil()}</div>`;
  }
  return body;
}

// =====================================================================
// SÉANCE EN COURS
// =====================================================================
let restT = null, restEnd = 0, restTotal = 0, clockT = null;
routes.workout = () => {
  const cur = S().current; if (!cur) return go("train");
  sessionStorage.removeItem("cxs.min");
  const doneSets = cur.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0), all = cur.exercises.reduce((a, e) => a + e.sets.length, 0);
  $app.innerHTML = `<header class="top"><button class="ib" data-a="minimize" aria-label="Réduire">${I.back}</button><h1>${esc(cur.title)}<span class="sub"><span id="clock">0:00</span> · ${doneSets}/${all} séries · semaine ${cur.week}</span></h1><button class="btn btn-red btn-sm" data-a="finish">Terminer</button></header>
    <section class="page" style="padding-bottom:180px">
    ${cur.comeback ? `<p class="small red">Reprise : charges allégées de 10 % aujourd'hui.</p>` : ""}
    ${cur.exercises.map((ex, xi) => exerciseBlock(ex, xi)).join("")}
    <button class="btn btn-red mt24" data-a="finish">Terminer la séance</button></section>`;
  tickClock(); clearInterval(clockT); clockT = setInterval(tickClock, 1000);
  if (restEnd > Date.now()) showRest();
};
function tickClock() {
  const c = document.getElementById("clock"), cur = S().current; if (!c || !cur) return clearInterval(clockT);
  const s = Math.floor((Date.now() - new Date(cur.start)) / 1000); c.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function exerciseBlock(ex, xi) {
  const groups = E.parseScheme(ex.scheme), unit = ex.unit === "s" ? "sec" : "reps";
  const target = groups.map(g => `${g.sets}×${g.lo}${g.hi !== g.lo ? "-" + g.hi : ""}${g.pct ? ` à ${g.pct} %` : g.rpe ? ` RPE ${String(g.rpe).replace(".", ",")}` : ""}${g.ds ? " + dégressive" : ""}`).join(" puis ");
  let lastG = -1;
  return `<article class="ex"><div class="ex-head"><div class="grow"><div>${ex.ss ? `<span class="tag r">Superset ${ex.ss}</span>` : ""}<span class="tag">${E.KIND_LABEL[ex.kind] || ex.kind}</span>${ex.tempo ? `<span class="tag">Tempo ${ex.tempo}</span>` : ""}</div>
      <h3 class="h3 mt8">${esc(ex.name)}</h3><div class="xs muted mt4">${target}${ex.name !== ex.orig ? ` · remplace ${esc(ex.orig)}` : ""}</div>
      ${!ex.bw && ex.sets.every(s => !s.kg) ? `<div class="xs mt8 red">Première fois : choisis une charge qui te laisse 2 à 3 répétitions en réserve. L'app calcule la suite.</div>` : ""}
      ${ex.note ? `<div class="xs mt8">${esc(ex.note)}</div>` : ""}</div>
      <button class="icon-btn" data-a="ex-menu" data-x="${xi}" aria-label="Options de l'exercice">${I.dots}</button></div>
    <div class="sets">${ex.sets.map((s, si) => {
      const head = s.g !== lastG && groups.length > 1 ? `<div class="set-group">${s.g === 0 ? "Série lourde" : "Séries de travail"}</div>` : ""; lastG = s.g;
      return head + `<div class="set ${s.done ? "done" : ""}"><span class="n">${si + 1}</span>
        <div>${ex.bw ? `<input value="PDC" disabled aria-label="Poids du corps" style="font-size:15px">` : `<input inputmode="decimal" data-in="kg" data-x="${xi}" data-s="${si}" value="${kgTxt(s.kg)}" placeholder="kg" aria-label="Charge en kg">`}<div class="u">${ex.bw ? "corps" : "kg"}</div></div>
        <div><input inputmode="numeric" data-in="reps" data-x="${xi}" data-s="${si}" value="${s.reps ?? ""}" aria-label="${unit}"><div class="u">${s.ds ? "dégressive" : unit}${s.lo !== s.hi ? ` · ${s.lo}-${s.hi}` : ""}</div></div>
        <button class="tick" data-a="tick" data-x="${xi}" data-s="${si}" aria-label="Valider la série ${si + 1}">${I.check}</button></div>
        ${s.done && ex.unit !== "s" ? `<div class="rpe">Ressenti ${[["7", "facile"], ["8", "juste"], ["9", "dur"], ["10", "max"]].map(([r, l]) => `<button data-a="rpe" data-x="${xi}" data-s="${si}" data-v="${r}" class="${Math.round(s.rpe ?? s.trpe) == r ? "on" : ""}">${l}</button>`).join("")}</div>` : ""}`;
    }).join("")}</div></article>`;
}
function showRest() {
  document.querySelector(".rest")?.remove();
  const v = wordOn("rest") && restTotal >= 60 ? W.verseFor("repos", Math.floor(restEnd / 1000)) : null;
  const el = document.createElement("div"); el.className = "rest";
  el.innerHTML = `<div class="row between"><div><div class="xs" style="opacity:.6">Repos</div><div class="t" id="rest-t"></div></div><div class="row" style="gap:6px"><button class="btn btn-sm" data-a="rest-add">+30 s</button><button class="btn btn-sm" data-a="rest-skip">Passer</button></div></div><div class="bar"><i id="rest-bar"></i></div>${v ? W.wordCard(v, "small") : ""}`;
  document.body.append(el);
  const tick = () => {
    const left = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000)), t = document.getElementById("rest-t"), b = document.getElementById("rest-bar");
    if (!t) return clearInterval(restT);
    t.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; b.style.width = `${100 - left / restTotal * 100}%`;
    if (left <= 0) { clearInterval(restT); buzz([180, 90, 180]); el.remove(); }
  };
  clearInterval(restT); tick(); restT = setInterval(tick, 250);
}
function startRest(sec) { restTotal = sec; restEnd = Date.now() + sec * 1000; showRest(); }
function exMenu(xi) {
  const ex = S().current.exercises[xi], f = E.ficheOf(ex.name), alts = E.alternatives(ex.name);
  sheet(`<h2 class="h1">${esc(ex.name)}</h2>
    ${f?.svg ? `<div style="background:#F1ECE7;border-radius:14px;padding:8px;margin-top:12px;color:#151515">${f.svg}</div>` : ""}
    ${f ? `${f.setup ? `<p class="mt12"><b>Installation.</b> ${esc(f.setup)}</p>` : ""}${f.cues?.length ? `<ul class="small" style="padding-left:18px">${f.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}${f.note ? `<p class="small muted">${esc(f.note)}</p>` : ""}` : `<p class="small muted mt12">Fiche détaillée bientôt disponible.</p>`}
    <div class="row mt12" style="gap:8px"><button class="btn btn-line btn-sm grow" data-a="add-set" data-x="${xi}">Ajouter une série</button>${ex.name !== ex.orig ? `<button class="btn btn-line btn-sm grow" data-a="swap" data-x="${xi}" data-n="${esc(ex.orig)}">Revenir à l'original</button>` : ""}</div>
    ${alts.length ? `<h3 class="sec">Remplacer par (même mouvement)</h3><div class="list">${alts.slice(0, 14).map(n => `<button class="li" data-a="swap" data-x="${xi}" data-n="${esc(n)}"><span class="grow">${esc(n)}</span>${I.chev}</button>`).join("")}</div>` : ""}`);
}
function setInput(el) {
  const ex = S().current.exercises[+el.dataset.x], s = ex.sets[+el.dataset.s];
  const v = parseFloat(String(el.value).replace(",", "."));
  if (el.dataset.in === "kg") { s.kg = isNaN(v) ? null : v; ex.sets.forEach((o, i) => { if (i > +el.dataset.s && !o.done && o.g === s.g && !o.ds) o.kg = s.kg; }); }
  else s.reps = isNaN(v) ? null : Math.round(v);
  save();
}
function finishFlow() {
  const cur = S().current, n = cur.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  if (!n) { if (confirm("Aucune série validée. Abandonner cette séance ?")) { update(st => st.current = null); clearInterval(restT); document.querySelector(".rest")?.remove(); go("home"); } return; }
  if (!confirm("Terminer la séance et enregistrer tes séries ?")) return;
  clearInterval(restT); clearInterval(clockT); document.querySelector(".rest")?.remove();
  E.finishSession(cur); pushStats(); go("done");
}
routes.done = () => {
  const w = S().workouts.at(-1); if (!w) return go("home");
  const mins = Math.round((new Date(w.end) - new Date(w.start)) / 6e4);
  $app.innerHTML = `<section class="loader" style="justify-content:flex-start;padding-top:calc(48px + var(--safe-t));text-align:center">
    <svg class="big-x" viewBox="0 0 40 40"><path class="s1" d="M9 9l22 22" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/><path class="s2" d="M9 31 31 9" stroke="var(--red)" stroke-width="5" stroke-linecap="round" fill="none"/></svg>
    <div><h1 class="h-hero">Séance terminée.</h1><p style="opacity:.65" class="mt8">${esc(w.title)}</p></div>
    <div class="hero" style="width:100%;max-width:560px;padding:0;background:none"><div class="stat3"><div><b>${mins}</b><span>minutes</span></div><div><b>${w.setsDone}</b><span>séries</span></div><div><b>${(w.volume / 1000).toFixed(1).replace(".", ",")}</b><span>tonnes</span></div></div></div>
    ${w.records.length ? `<div style="width:100%;max-width:560px;text-align:left;background:rgba(255,255,255,.07);border-radius:16px;padding:14px"><div class="h3" style="color:var(--red)">Nouveau${w.records.length > 1 ? "x" : ""} record${w.records.length > 1 ? "s" : ""}</div>${w.records.map(r => `<div class="row between small mt8"><span>${esc(r.name)}</span><span class="num">${Math.round(r.after)} kg <span style="opacity:.6;font-weight:400">1RM estimé</span></span></div>`).join("")}</div>` : ""}
    <p class="small" style="opacity:.65;max-width:520px">Tes charges de la prochaine séance sont recalculées à partir de ce que tu viens de faire.</p>
    ${wordOn("fin") ? `<div style="width:100%;max-width:560px;text-align:left">${W.wordCard(W.verseFor("fin", w.id % 1000))}</div>` : ""}
    <button class="btn btn-red" style="max-width:560px" data-a="go" data-r="home">Retour à l'accueil</button></section>`;
};

// =====================================================================
// NUTRITION
// =====================================================================
let foodTab = "journal";
routes.food = async () => {
  await N.loadModels();
  const t = N.targets(), tot = N.dayTotals(), log = N.dayLog();
  let body = "";
  if (foodTab === "journal") {
    body = N.MEALS.map(m => {
      const es = log.filter(e => e.meal === m), k = es.reduce((a, e) => a + e.kcal, 0);
      return `<div class="card mt12"><div class="row between"><span class="h3">${m}</span><span class="small muted">${k} kcal</span></div>
        ${es.map(e => `<div class="row between small" style="padding:9px 0;border-top:1px solid var(--line);margin-top:8px"><span class="grow">${esc(e.label)}<br><span class="xs muted">${e.g ? e.g + " g · " : ""}${Math.round(e.p)} g prot.</span></span><span class="num">${e.kcal}</span><button class="icon-btn" style="width:32px;height:32px;margin-left:8px" data-a="del-food" data-id="${e.id}" aria-label="Supprimer">${I.close}</button></div>`).join("")}
        <div class="row mt8" style="gap:8px"><button class="btn btn-line btn-sm grow" data-a="add-food" data-m="${m}">${I.plus.replace("<svg", '<svg width="18"')} Ajouter</button>${es.length ? `<button class="btn btn-line btn-sm" data-a="save-dish" data-m="${m}">Enregistrer le repas</button>` : ""}</div></div>`;
    }).join("");
  } else if (premium()) {
    body = `<p class="small muted mt12">Ton plan du jour, calculé sur ta cible. Les quantités sont pesées cuites.</p>` + N.dayPlan(t).map(d => `<div class="card mt8"><div class="row between"><span class="small muted">${d.meal}</span><span class="small muted">${d.m.kcal} kcal · ${d.m.p} g prot.</span></div>
      <div class="h3 mt4">${esc(d.n)}</div><ul class="small" style="padding-left:18px;margin:8px 0 12px">${d.lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul>
      <div class="row" style="gap:8px"><button class="btn btn-red btn-sm grow" data-a="eat-plan" data-meal="${d.meal}">Je l'ai mangé</button>${d.poolSize > 1 ? `<button class="btn btn-line btn-sm" data-a="swap-dish" data-meal="${d.meal}">Changer</button>` : ""}</div></div>`).join("");
  } else {
    const d = N.dayPlan(t)[1];
    body = `<div class="card mt12 locked" style="min-height:230px"><div class="small muted">${d.meal}</div><div class="h3 mt4">${esc(d.n)}</div><ul class="small" style="padding-left:18px">${d.lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul>${lockVeil("Plan alimentaire · Premium")}</div>
      <p class="small muted mt12">Le plan alimentaire calcule chaque jour 4 repas faits de vrais plats, aux bonnes quantités pour ta cible. Un tap pour l'enregistrer.</p>`;
  }
  $app.innerHTML = header("Nutrition", fmtDate(new Date())) + `<section class="page">
    <div class="card">${nutritionRings(t, tot)}</div>
    <div class="seg mt12"><button data-a="food-tab" data-v="journal" class="${foodTab === "journal" ? "on" : ""}">Journal</button><button data-a="food-tab" data-v="plan" class="${foodTab === "plan" ? "on" : ""}">Mon plan</button></div>
    ${body}
    ${wordOn("repas") ? `<div class="mt24">${W.wordCard(W.verseFor("repas"), "small")}</div>` : ""}
    <p class="xs muted mt24">${esc(t.model.name)} : ${esc(t.model.why || "")} Valeurs : table Ciqual (ANSES) et Open Food Facts.</p>
  </section>${tabbar("food")}`;
};
async function addFoodSheet(meal) {
  sheet(`<h2 class="h1">${esc(meal)}</h2>
    <div class="search mt12">${I.search}<input id="fq" placeholder="Rechercher un aliment" autocomplete="off" enterkeyhint="search"></div>
    ${"BarcodeDetector" in window ? `<button class="btn btn-line btn-sm mt8" data-a="scan" data-m="${esc(meal)}" style="width:100%">${I.scan.replace("<svg", '<svg width="20"')} Scanner un code-barres</button>` : ""}
    <div id="fr" class="mt12"></div>`, async (w) => {
    const box = w.querySelector("#fr"), inp = w.querySelector("#fq");
    const idle = () => {
      const rec = S().recentFoods, dishes = S().dishes;
      box.innerHTML = (dishes.length ? `<h3 class="sec" style="margin-top:4px">Mes plats</h3><div class="list">${dishes.map((d, i) => `<button class="li" data-a="eat-dish" data-i="${i}" data-m="${esc(meal)}"><span class="grow">${esc(d.n)}<br><span class="xs muted">${d.kcal} kcal · ${Math.round(d.p)} g prot.</span></span>${I.plus.replace("<svg", '<svg width="20"')}</button>`).join("")}</div>` : "")
        + (rec.length ? `<h3 class="sec">Récents</h3><div class="list">${rec.map((f, i) => `<button class="li" data-a="pick-food" data-src="recent" data-i="${i}" data-m="${esc(meal)}"><span class="grow">${esc(f.n)}<br><span class="xs muted">${f.kcal} kcal / 100 g</span></span>${I.chev}</button>`).join("")}</div>` : `<p class="empty small">Tape le nom d'un aliment : « riz », « poulet », « skyr »…</p>`);
    };
    idle(); await N.loadCiqual();
    let deb;
    inp.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(() => {
      const q = inp.value.trim(); if (!q) return idle();
      const r = N.searchFoods(q); window.__fr = r;
      box.innerHTML = r.length ? `<div class="list">${r.map((f, i) => `<button class="li" data-a="pick-food" data-src="search" data-i="${i}" data-m="${esc(meal)}"><span class="grow">${esc(f.n)}<br><span class="xs muted">${f.kcal} kcal · ${String(f.p).replace(".", ",")} g prot. / 100 g</span></span>${I.chev}</button>`).join("")}</div>` : `<p class="empty small">Aucun aliment trouvé pour « ${esc(q)} ». Essaie un mot plus simple.</p>`;
    }, 140); });
  });
}
function gramsSheet(food, meal) {
  let g = 100;
  const draw = (w) => { const e = N.entryFromFood(food, g, meal); w.querySelector("#gv").innerHTML = `<span class="num" style="font-size:34px">${e.kcal}</span><span class="small muted"> kcal · ${Math.round(e.p)} g prot. · ${Math.round(e.c)} g gluc. · ${Math.round(e.f)} g lip.</span>`; };
  sheet(`<h2 class="h2">${esc(food.n)}</h2><div id="gv" class="mt12"></div>
    <label class="field mt12"><span>Quantité (g ou ml)</span><input id="gq" inputmode="decimal" value="100"></label>
    <div class="chips wrap mt12">${[30, 50, 100, 150, 200, 250, 300].map(x => `<button class="chip ${x === 100 ? "on" : ""}" data-g="${x}">${x} g</button>`).join("")}</div>
    <button class="btn btn-red mt16" id="gadd">Ajouter à ${esc(meal.toLowerCase())}</button>`, (w) => {
    draw(w); const inp = w.querySelector("#gq");
    inp.addEventListener("input", () => { g = parseFloat(inp.value.replace(",", ".")) || 0; w.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", +c.dataset.g === g)); draw(w); });
    w.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => { g = +c.dataset.g; inp.value = g; w.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === c)); draw(w); }));
    w.querySelector("#gadd").addEventListener("click", () => { if (!g) return; N.addEntry(N.entryFromFood(food, g, meal)); N.rememberFood(food); buzz(); closeSheet(); toast("Ajouté"); routes.food(); });
  });
}
async function scanFlow(meal) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    sheet(`<h2 class="h2">Scanner</h2><video id="cam" playsinline autoplay muted style="width:100%;border-radius:14px;margin-top:12px;background:#000"></video><p class="small muted mt8">Place le code-barres dans le cadre.</p>`, async (w) => {
      const v = w.querySelector("#cam"); v.srcObject = stream;
      const det = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
      let alive = true; const stop = () => { alive = false; stream.getTracks().forEach(t => t.stop()); };
      w.addEventListener("click", e => { if (e.target === w) stop(); });
      while (alive && document.body.contains(v)) {
        try { const c = await det.detect(v); if (c[0]) { stop(); const f = await N.lookupBarcode(c[0].rawValue); if (f) gramsSheet(f, meal); else { closeSheet(); toast("Produit introuvable : recherche-le par son nom."); } return; } } catch { }
        await new Promise(r => setTimeout(r, 300));
      }
      stop();
    });
  } catch { toast("Caméra indisponible : recherche l'aliment par son nom."); }
}

// =====================================================================
// PAROLE
// =====================================================================
let wordTab = "jour", affCat = "valeur";
const isFav = (id) => S().favorites.includes(id);
const heartBtn = (id) => `<button class="heart ${isFav(id) ? "on" : ""}" data-a="fav" data-id="${id}" aria-label="${isFav(id) ? "Retirer des favoris" : "Garder en favori"}">${I.heart}</button>`;
routes.word = () => {
  const seg = `<div class="seg">${[["jour", "Aujourd'hui"], ["affirm", "Affirmations"], ["favoris", "Favoris"], ["apres", "Et après ?"]].map(([v, l]) => `<button data-a="word-tab" data-v="${v}" class="${wordTab === v ? "on" : ""}">${l}</button>`).join("")}</div>`;
  let body = "";
  if (wordTab === "jour") {
    const af = W.affirmationOfDay(), v = W.verseOfDay();
    body = `<div class="daycard mt12"><div class="row between" style="align-items:flex-start"><p class="affirm grow">${esc(af.t)}</p>${heartBtn(af.id)}</div><div class="affirm-ref">${esc(af.ref)}</div>
        <div class="row mt16" style="gap:8px"><button class="btn btn-ghost btn-sm" data-a="share" data-t="${esc(af.t)}">Partager</button><button class="btn btn-ghost btn-sm" data-a="declare">Déclarer à voix haute</button></div></div>
      <h2 class="sec">Parole du jour</h2>
      <div class="card"><div class="row" style="align-items:flex-start"><div class="grow">${W.wordCard(v)}</div>${heartBtn(v.id)}</div>
        <a class="link mt8" style="display:inline-block" href="${W.bibleUrl(v.ref)}" target="_blank" rel="noopener">Lire le passage</a></div>
      <h2 class="sec">Affirmations</h2>
      <div class="list">${W.CATS.map(c => `<button class="li" data-a="aff-cat" data-v="${c.id}"><span class="grow"><b>${c.n}</b><br><span class="xs muted">${W.AFFIRMATIONS.filter(a => a.cat === c.id).length} affirmations</span></span>${I.chev}</button>`).join("")}</div>`;
  } else if (wordTab === "affirm") {
    body = `<div class="chips mt12">${W.CATS.map(c => `<button class="chip ${affCat === c.id ? "on" : ""}" data-a="aff-cat" data-v="${c.id}">${c.n}</button>`).join("")}</div>
      ${W.AFFIRMATIONS.filter(a => a.cat === affCat).map(a => `<div class="card mt8"><div class="row" style="align-items:flex-start"><p class="affirm grow" style="font-size:22px">${esc(a.t)}</p>${heartBtn(a.id)}</div><div class="affirm-ref">${esc(a.ref)}</div></div>`).join("")}`;
  } else if (wordTab === "favoris") {
    const favs = S().favorites.map(W.byId).filter(Boolean);
    body = favs.length ? favs.map(f => `<div class="card mt8"><div class="row" style="align-items:flex-start"><div class="grow">${f.cat ? `<p class="affirm" style="font-size:21px">${esc(f.t)}</p><div class="affirm-ref">${esc(f.ref)}</div>` : W.wordCard(f)}</div>${heartBtn(f.id)}</div></div>`).join("")
      + (premium() ? "" : `<p class="small muted mt12">${favs.length} / ${FREE_FAVORITES} favoris en gratuit · illimités avec Premium.</p>`)
      : `<div class="empty"><p>Touche le cœur sur une parole qui te parle : elle se retrouve ici.</p></div>`;
  } else {
    body = `<p class="muted mt12">Le corps est utile pour un temps. Ces pages parlent de ce qui dure.</p>
      ${W.ETERNAL.map(e => `<button class="card tap mt8" data-a="go" data-r="eternal" data-p="${e.id}" style="display:flex;align-items:center;gap:12px"><span class="grow"><b class="h3">${esc(e.n)}</b><br><span class="small muted">${esc(e.lead)}</span></span>${I.chev}</button>`).join("")}`;
  }
  $app.innerHTML = header("Parole", "Pour l'âme et l'esprit") + `<section class="page">${seg}${body}</section>${tabbar("word")}`;
};
routes.eternal = () => {
  const e = W.ETERNAL.find(x => x.id === param) || W.ETERNAL[0];
  $app.innerHTML = header(esc(e.n), "", { back: "word" }) + `<section class="page full prose">
    <p class="red" style="font-weight:700">${esc(e.lead)}</p>
    ${e.body.map(p => `<p>${esc(p)}</p>`).join("")}
    ${e.verses.map(v => `<div class="card mt12">${W.wordCard(v)}<a class="link mt8" style="display:inline-block" href="${W.bibleUrl(v.ref)}" target="_blank" rel="noopener">Lire le passage</a></div>`).join("")}
    <div class="card mt24" style="text-align:center"><p>Tu as des questions ? Je serais heureux d'en parler avec toi, simplement.</p><button class="btn btn-red mt8" data-a="go" data-r="chat">Écrire à Thomas</button></div>
  </section>${tabbar("word")}`;
};

// =====================================================================
// COACH : messages, offres, suivi
// =====================================================================
routes.coach = () => {
  if (isCoach()) return adminHome();
  const o = offer(tier());
  $app.innerHTML = header("Coach", esc(CONFIG.coachName)) + `<section class="page">
    <div class="hero"><div class="row" style="gap:12px"><span style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.1);display:grid;place-items:center;flex:none">${I.x(26, true)}</span><div><div class="h2">${esc(CONFIG.coachName)}</div><div class="small muted">${esc(CONFIG.coachTitle)}</div></div></div>
      <p class="mt12" style="max-width:88%">Je lis et je réponds moi-même à chaque message.</p>
      <button class="btn btn-red mt8" data-a="go" data-r="chat">Écrire à Thomas${badges.msgs ? ` · ${badges.msgs} nouveau${badges.msgs > 1 ? "x" : ""}` : ""}</button>
      <p class="xs muted mt8">${msgQuotaText()}</p></div>
    <h2 class="sec">Ta formule <small>${esc(o.name)}</small></h2>
    ${rank() >= 2 ? followUp() : `<button class="card tap" data-a="go" data-r="offers" style="display:flex;align-items:center;gap:12px"><span class="grow"><b>${premium() ? "Passer au suivi avec Thomas" : "Voir toutes les offres"}</b><br><span class="small muted">De 0 € à l'accompagnement complet. Chaque offre se teste en démo.</span></span>${I.chev}</button>`}
    ${rank() >= 2 ? `<button class="card tap mt12" data-a="go" data-r="offers" style="display:flex;align-items:center;gap:12px"><span class="grow"><b>Toutes les offres</b><br><span class="small muted">Comparer et changer de formule</span></span>${I.chev}</button>` : ""}
  </section>${tabbar("coach")}`;
};
function followUp() {
  const r = rank(), weekly = r >= 3;
  return `<div class="card"><div class="h3">${weekly ? "Bilan de la semaine" : "Bilan du mois"}</div><p class="small muted mt4">Envoie-le chaque ${weekly ? "dimanche" : "fin de mois"} : je te réponds avec tes ajustements.</p><button class="btn btn-red btn-sm mt8" data-a="checkin">Remplir mon bilan</button></div>
    ${r >= 4 ? `<div class="card"><div class="h3">Mes appels avec Thomas</div><p class="small muted mt4">${r >= 5 ? "Un appel toutes les deux semaines." : "Un appel par mois."}</p><a class="btn btn-line btn-sm mt8" href="${CONFIG.calendly}" target="_blank" rel="noopener">Réserver un appel</a></div>
      <div class="card"><div class="h3">Analyse de ta technique</div><p class="small muted mt4">Filme une série de profil et envoie-moi le lien de la vidéo dans les messages : je te réponds avec mes corrections.</p></div>` : ""}
    ${r >= 5 ? `<div class="card red-edge"><div class="h3">Corps, âme et esprit</div><p class="small muted mt4">Ton accompagnement inclut aussi tes objectifs de vie, ta discipline et, si tu le souhaites, ta foi. On en parle à chaque appel.</p></div>` : ""}`;
}
routes.offers = () => {
  const cur = S().me?.tier || "free";
  $app.innerHTML = header("Les offres", "Essaie chaque formule en démo", { back: "coach" }) + `<section class="page">
    <p class="muted">Touche « Voir la démo » : l'app passe dans cette formule pour te montrer tout ce qu'elle débloque. Rien n'est payé.</p>
    ${OFFERS.map(o => `<div class="offer ${o.id === cur ? "cur" : ""} mt16">${o.id === cur ? `<span class="ribbon">Ta formule</span>` : o.ribbon ? `<span class="ribbon">${esc(o.ribbon)}</span>` : ""}
      <div class="row between" style="align-items:flex-end"><div><div class="h2">${esc(o.name)}</div><div class="small muted">${esc(o.tagline)}</div></div><div class="price" style="text-align:right;white-space:nowrap">${esc(o.price)}<small>${esc(o.per)}</small></div></div>
      ${o.alt ? `<div class="small red mt4" style="text-align:right">${esc(o.alt)}</div>` : ""}
      <ul>${o.feats.map(f => `<li>${I.check}<span>${esc(f)}</span></li>`).join("")}<li>${I.check}<span>${esc(o.msgs)}</span></li></ul>
      ${o.id === "free" ? "" : `<div class="row" style="gap:8px"><button class="btn btn-line btn-sm grow" data-a="demo" data-v="${o.id}">Voir la démo</button>${o.id === cur ? "" : `<button class="btn btn-red btn-sm grow" data-a="choose" data-v="${o.id}">Choisir</button>`}</div>`}
    </div>`).join("")}
    <p class="xs muted mt16">Sans engagement, résiliable à tout moment. Les formules de suivi démarrent après un appel de 15 minutes pour vérifier que je peux vraiment t'aider.</p>
  </section>${tabbar("coach")}`;
};
function chooseOffer(id) {
  const o = offer(id);
  if (o.rank === 1) {
    const link = o.pay?.month;
    if (link) { const u = new URL(link); const c = C?.userId?.(); if (c) u.searchParams.set("client_reference_id", c); if (S().profile?.email) u.searchParams.set("prefilled_email", S().profile.email); location.href = u.toString(); return; }
    sheet(`<h2 class="h1">Premium</h2><p class="mt12">Le paiement en ligne ouvre très bientôt. En attendant, écris-moi : je t'active Premium moi-même.</p><button class="btn btn-red mt12" data-a="prefill" data-t="Bonjour Thomas, je veux passer à Premium.">Écrire à Thomas</button>`);
    return;
  }
  AP.i = 0; AP.a = { offer: id }; go("apply");
}

// Candidature aux formules de suivi
const AP = { i: 0, a: {} };
const AQ = [
  { id: "goal", q: "Ton objectif précis dans 12 semaines ?", type: "text", ph: "Ex. perdre 6 kg et tenir 3 séances par semaine" },
  { id: "obstacle", q: "Qu'est-ce qui t'a fait abandonner les fois précédentes ?", type: "text", ph: "Sois honnête, c'est entre nous" },
  { id: "time", q: "Combien d'heures par semaine peux-tu vraiment bloquer ?", opts: [["lt2", "Moins de 2 h"], ["2-3", "2 à 3 h"], ["3-5", "3 à 5 h"], ["5+", "Plus de 5 h"]] },
  { id: "urgency", q: "De 1 à 10, à quel point c'est important pour toi maintenant ?", opts: [[10, "10 · c'est ma priorité"], [8, "8"], [6, "6"], [4, "4 ou moins"]] },
  { id: "phone", q: "Ton téléphone, pour notre appel", type: "phone" },
];
routes.apply = () => {
  if (!AP.a.offer) return go("offers");
  const s = AQ[AP.i]; if (!s) return applyDone();
  let body;
  if (s.type === "text") body = `<form class="choices" data-f="ap-text" style="align-items:stretch"><label class="field"><span>${esc(s.ph)}</span><textarea name="v" required maxlength="400">${esc(AP.a[s.id] || "")}</textarea></label><button class="btn btn-red">Continuer</button></form>`;
  else if (s.type === "phone") body = `<form class="choices" data-f="ap-phone" style="align-items:stretch"><label class="field"><span>Téléphone (facultatif)</span><input name="v" type="tel" autocomplete="tel"></label><button class="btn btn-red">Envoyer ma candidature</button></form>`;
  else body = `<div class="choices">${s.opts.map(([v, l]) => `<button class="choice" data-a="ap-pick" data-v='${JSON.stringify(v)}'>${l}</button>`).join("")}</div>`;
  $app.innerHTML = `<section class="convo"><div class="convo-top"><button class="icon-btn" data-a="ap-back" aria-label="Retour">${I.back}</button><div class="progress"><i style="width:${AP.i / AQ.length * 100}%"></i></div></div>
    <div class="coach-mark"><span class="av">${I.x(20, true)}</span>Candidature · ${esc(offer(AP.a.offer).name)}</div><h1 class="q">${esc(s.q)}</h1>${body}</section>`;
};
function calendlyUrl(a) {
  const u = new URL(CONFIG.calendly);
  u.searchParams.set("name", S().profile?.name || ""); u.searchParams.set("email", S().profile?.email || "");
  u.searchParams.set("a1", `Offre : ${offer(a.offer).name}\nObjectif : ${a.goal}\nFrein : ${a.obstacle}\nTemps : ${a.time} · Urgence : ${a.urgency}/10`);
  return u.toString();
}
async function applyDone() {
  const a = { ...AP.a, at: new Date().toISOString() };
  update(st => st.application = a);
  cloud().then(c => c?.saveProfile({ onboarding: { ...S().profile, word: S().settings.word, application: a } })).catch(() => { });
  $app.innerHTML = `<section class="convo" style="justify-content:center">
    <div class="coach-mark"><span class="av">${I.x(20, true)}</span>Thomas</div>
    <h1 class="q">Merci ${esc(S().profile.name)}. J'ai bien reçu ta candidature pour ${esc(offer(a.offer).name)}.</h1>
    <p class="q-sub">Dernière étape : réserve notre appel de 15 minutes. Tes réponses me seront transmises avec la réservation.</p>
    <div class="stack mt32"><a class="btn btn-red" href="${calendlyUrl(a)}" target="_blank" rel="noopener">Réserver mon appel</a><button class="btn btn-line" data-a="go" data-r="home">Plus tard</button></div></section>`;
  AP.i = 0; AP.a = {};
}

// Messagerie
let pollT = null;
const stopPoll = () => { clearInterval(pollT); pollT = null; };
routes.chat = async () => {
  const memberId = isCoach() ? param : null;
  const m = memberId ? (window.__members || []).find(x => x.id === memberId) : null;
  $app.innerHTML = header(memberId ? esc(m?.name || "Membre") : "Thomas", memberId ? esc(m?.email || "") : "Je réponds moi-même", { back: memberId ? "member/" + memberId : "coach" })
    + `<section class="page" style="padding-bottom:calc(90px + var(--safe-b))"><div class="thread" id="thread"><p class="empty small">Chargement…</p></div>${memberId ? "" : `<p class="xs muted" style="text-align:center">${msgQuotaText()}</p>`}</section>
    <form class="composer" data-f="send"><textarea name="v" rows="1" placeholder="Ton message" maxlength="2000" aria-label="Message">${esc(window.__prefill || "")}</textarea><button class="send" aria-label="Envoyer">${I.send}</button></form>`;
  window.__prefill = "";
  const load = async () => {
    const c = await cloud(); const box = document.getElementById("thread"); if (!box) return stopPoll();
    try {
      await c.ensureSession();
      const me = c.userId(), list = await c.thread(memberId || me);
      box.innerHTML = list.length ? list.map(x => `<div class="msg ${x.sender === me ? "me" : "them"}">${esc(x.body)}<time>${ago(x.created_at)}</time></div>`).join("") : `<div class="msg them">Salut ${esc(S().profile?.name || "")} ! Je suis Thomas. Pose-moi ta question sur ton entraînement, ta nutrition ou ce que tu vis : je te réponds moi-même.</div>`;
      await c.markRead(memberId || me);
      if (!memberId) badges.msgs = 0;
      window.scrollTo(0, document.body.scrollHeight);
    } catch (e) { box.innerHTML = `<p class="empty small">Messagerie indisponible pour le moment. Vérifie ta connexion et réessaie.</p>`; }
  };
  await load(); pollT = setInterval(load, 15000);
};
async function sendMessage(form) {
  const ta = form.querySelector("textarea"), v = ta.value.trim(); if (!v) return;
  const c = await cloud(); if (!c) return toast("Pas de connexion.");
  const memberId = isCoach() ? param : null;
  if (!memberId && S().demoTier) toast("En démo, ton message part avec ta formule actuelle.");
  try {
    await c.ensureSession(); await c.send(v, memberId || c.userId()); ta.value = ""; buzz();
    document.getElementById("thread")?.insertAdjacentHTML("beforeend", `<div class="msg me">${esc(v)}<time>à l'instant</time></div>`);
    window.scrollTo(0, document.body.scrollHeight);
    refreshMe();
  }
  catch (e) {
    const quota = /row-level|policy/i.test(e.message);
    toast(quota ? "Tu as utilisé tes messages de la semaine. Une formule supérieure t'en donne plus." : "Envoi impossible, réessaie.");
    if (quota) setTimeout(() => go("offers"), 1800);
  }
}
function checkinSheet() {
  sheet(`<h2 class="h1">Mon bilan</h2><form data-f="checkin" class="stack mt12">
    <div class="grid2"><label class="field"><span>Poids moyen (kg)</span><input name="poids" inputmode="decimal" value="${E.fmtKg(S().profile.weight)}"></label><label class="field"><span>Séances faites</span><input name="seances" inputmode="numeric" value="${E.workoutsThisWeek().length}"></label></div>
    <div class="grid3">${[["energie", "Énergie /10"], ["sommeil", "Sommeil /10"], ["faim", "Faim /10"]].map(([k, l]) => `<label class="field"><span>${l}</span><input name="${k}" inputmode="numeric"></label>`).join("")}</div>
    <label class="field"><span>Ma victoire</span><textarea name="victoire"></textarea></label>
    <label class="field"><span>Ma difficulté</span><textarea name="difficulte"></textarea></label>
    <button class="btn btn-red">Envoyer à Thomas</button></form>`);
}

// Notifications
async function notifsSheet() {
  sheet(`<h2 class="h1">Notifications</h2><div id="nl" class="mt12"><p class="empty small">Chargement…</p></div>`, async (w) => {
    const c = await cloud(); let list = [];
    try { await c.currentSession(); list = await c.notifications(); } catch { }
    const seen = S().notifSeen;
    w.querySelector("#nl").innerHTML = list.length ? `<div class="list">${list.map(n => `<div class="li" style="align-items:flex-start"><span style="width:8px;height:8px;border-radius:50%;margin-top:8px;background:${new Date(n.created_at).getTime() > seen ? "var(--red)" : "transparent"};flex:none"></span><span class="grow"><b>${esc(n.title)}</b>${n.body ? `<br><span class="small muted">${esc(n.body)}</span>` : ""}<br><span class="xs muted">${ago(n.created_at)}</span></span></div>`).join("")}</div>` : `<p class="empty">Aucune notification pour l'instant.</p>`;
    update(st => st.notifSeen = Date.now()); badges.notifs = 0; document.querySelectorAll(".top .badge").forEach(b => b.remove());
  });
}

// =====================================================================
// ESPACE COACH
// =====================================================================
let adminFilter = "";
async function adminHome() {
  $app.innerHTML = header("Espace coach", "Tes membres") + `<section class="page"><p class="empty">Chargement…</p></section>${tabbar("coach")}`;
  const c = await cloud(); let list = [];
  try { list = await c.members(); window.__members = list; } catch (e) { $app.querySelector(".page").innerHTML = `<p class="empty">Impossible de charger les membres : ${esc(e.message)}</p>`; return; }
  const q = adminFilter.toLowerCase();
  const shown = list.filter(m => !q || (m.name || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q)).sort((a, b) => b.unread - a.unread);
  $app.querySelector(".page").innerHTML = `
    <div class="stat3"><div><b>${list.length}</b><span>membres</span></div><div><b>${list.filter(m => m.tier !== "free").length}</b><span>payants</span></div><div><b>${list.reduce((a, m) => a + m.unread, 0)}</b><span>non lus</span></div></div>
    <div class="chips mt12">${OFFERS.map(o => `<span class="chip">${esc(o.name)} · ${list.filter(m => m.tier === o.id).length}</span>`).join("")}</div>
    <div class="search mt12">${I.search}<input id="aq" placeholder="Nom ou e-mail" value="${esc(adminFilter)}"></div>
    <div class="list mt12">${shown.length ? shown.map(m => `<button class="li" data-a="go" data-r="member" data-p="${m.id}"><span class="grow"><b>${esc(m.name || "Sans nom")}</b> <span class="tag ${m.tier !== "free" ? "r" : ""}">${esc(offer(m.tier).name)}</span><br><span class="xs muted">${esc(m.email || "e-mail non renseigné")} · vu ${ago(m.last_seen)}</span></span>${m.unread ? `<span class="badge" style="position:static;border:0">${m.unread}</span>` : ""}${I.chev}</button>`).join("") : `<p class="empty small">Aucun membre pour l'instant.</p>`}</div>
    <h2 class="sec">Notification à tous</h2>
    <form class="card stack" data-f="broadcast"><label class="field"><span>Titre</span><input name="t" required maxlength="80"></label><label class="field"><span>Message</span><textarea name="b" maxlength="300"></textarea></label><button class="btn btn-red btn-sm">Envoyer à tous les membres</button></form>`;
  const inp = $app.querySelector("#aq"); inp.addEventListener("input", () => { adminFilter = inp.value; clearTimeout(window.__aqT); window.__aqT = setTimeout(adminHome, 350); });
}
routes.member = async () => {
  if (!isCoach()) return go("home");
  const c = await cloud();
  if (!window.__members) { try { window.__members = await c.members(); } catch { } }
  const m = (window.__members || []).find(x => x.id === param); if (!m) return go("coach");
  const o = m.onboarding || {}, ap = o.application, st = m.stats || {};
  const L = { goal: "Objectif", discipline: "Discipline", level: "Niveau", place: "Lieu", days: "Jours / semaine", age: "Âge", height: "Taille", weight: "Poids", diet: "Alimentation", activity: "Activité", backPain: "Gêne lombaire", word: "Parole", news: "Accepte les e-mails" };
  $app.innerHTML = header(esc(m.name || "Membre"), esc(m.email || ""), { back: "coach" }) + `<section class="page">
    <div class="row" style="gap:8px"><a class="btn btn-red btn-sm grow" href="#/chat/${m.id}">Messages${m.unread ? ` · ${m.unread}` : ""}</a>${m.email ? `<a class="btn btn-line btn-sm grow" href="mailto:${esc(m.email)}">E-mail</a>` : ""}</div>
    <h2 class="sec">Formule</h2>
    <div class="card"><div class="row" style="gap:8px"><select id="tier" class="field grow" style="font-size:16px">${OFFERS.map(x => `<option value="${x.id}" ${x.id === m.tier ? "selected" : ""}>${esc(x.name)} · ${esc(x.price)}</option>`).join("")}</select><button class="btn btn-red btn-sm" data-a="set-tier" data-id="${m.id}">Valider</button></div></div>
    ${ap ? `<h2 class="sec">Candidature <small>${new Date(ap.at).toLocaleDateString("fr-FR")}</small></h2><div class="card small"><b>${esc(offer(ap.offer).name)}</b><p class="mt8"><b>Objectif :</b> ${esc(ap.goal)}</p><p><b>Frein :</b> ${esc(ap.obstacle)}</p><p><b>Temps :</b> ${esc(ap.time)} · <b>Urgence :</b> ${esc(ap.urgency)}/10</p>${ap.phone ? `<p><b>Téléphone :</b> <a href="tel:${esc(ap.phone)}">${esc(ap.phone)}</a></p>` : ""}</div>` : ""}
    <h2 class="sec">Activité</h2>
    <div class="stat3"><div><b>${st.workouts ?? 0}</b><span>séances</span></div><div><b>${st.weight ? E.fmtKg(st.weight) : "–"}</b><span>kg</span></div><div><b>${st.week ?? "–"}</b><span>semaine</span></div></div>
    <p class="xs muted mt8">Inscrit le ${new Date(m.created_at).toLocaleDateString("fr-FR")} · dernière visite ${ago(m.last_seen)}${st.lastWorkout ? ` · dernière séance ${ago(st.lastWorkout)}` : ""}</p>
    <h2 class="sec">Réponses de l'onboarding</h2>
    <div class="list">${Object.entries(L).filter(([k]) => o[k] !== undefined && o[k] !== null && o[k] !== "").map(([k, l]) => `<div class="li"><span class="grow small muted">${l}</span><span class="small"><b>${esc(typeof o[k] === "boolean" ? (o[k] ? "oui" : "non") : o[k])}</b></span></div>`).join("")}
      ${Object.entries(o.records || {}).map(([k, v]) => `<div class="li"><span class="grow small muted">Record ${esc(k)}</span><span class="small"><b>${v.r} × ${E.fmtKg(v.k)} kg</b></span></div>`).join("")}</div>
    <h2 class="sec">Notification à ${esc(m.name || "ce membre")}</h2>
    <form class="card stack" data-f="notify-one" data-id="${m.id}"><label class="field"><span>Titre</span><input name="t" required maxlength="80"></label><label class="field"><span>Message</span><textarea name="b" maxlength="300"></textarea></label><button class="btn btn-red btn-sm">Envoyer</button></form>
  </section>${tabbar("coach")}`;
};

// =====================================================================
// PROFIL, POURQUOI LE X, CONFIDENTIALITÉ
// =====================================================================
routes.profile = () => {
  const p = S().profile, t = N.targets(), w = S().settings.word;
  $app.innerHTML = header(esc(p.name), `${p.age} ans · ${p.height} cm · ${E.fmtKg(p.weight)} kg`, { back: "home" }) + `<section class="page">
    <div class="card"><div class="small muted">Ta formule</div><div class="row between mt4"><span class="h2">${esc(offer(S().me?.tier || "free").name)}</span><button class="link" data-a="go" data-r="offers">Changer</button></div>${p.email ? `<p class="xs muted mt4">${esc(p.email)}</p>` : ""}</div>
    <h2 class="sec">La Parole dans l'app</h2>
    <div class="seg">${[["daily", "Chaque jour"], ["discreet", "Accueil seul"], ["off", "Pause"]].map(([v, l]) => `<button data-a="word-set" data-v="${v}" class="${w === v ? "on" : ""}">${l}</button>`).join("")}</div>
    <h2 class="sec">Réglages</h2>
    <div class="list">
      <button class="li" data-a="go" data-r="x"><span class="grow">Pourquoi le X ?</span>${I.chev}</button>
      <button class="li" data-a="edit-body"><span class="grow">Mes infos et mon carburant<br><span class="xs muted">${t ? `${t.kcal} kcal · ${esc(t.model.name)}` : ""}</span></span>${I.chev}</button>
      <div class="li"><span class="grow">Vibrations</span><button class="switch ${S().settings.haptics ? "on" : ""}" data-a="haptics" aria-label="Vibrations"></button></div>
      <div class="li"><span class="grow">Thème</span><select data-f="theme" class="field" style="width:auto;padding:4px 8px;font-size:15px"><option value="">Automatique</option><option value="light" ${localStorage.getItem("cxs.theme") === "light" ? "selected" : ""}>Clair</option><option value="dark" ${localStorage.getItem("cxs.theme") === "dark" ? "selected" : ""}>Sombre</option></select></div>
    </div>
    <h2 class="sec">Mes données</h2>
    <p class="small muted">Tes séances et ton journal restent sur ce téléphone. Télécharge une sauvegarde chaque mois.</p>
    <div class="list"><button class="li" data-a="export"><span class="grow">Télécharger ma sauvegarde</span>${I.chev}</button>
      <label class="li" style="cursor:pointer"><span class="grow">Restaurer une sauvegarde</span>${I.chev}<input type="file" accept="application/json" data-f="import" hidden></label>
      <a class="li" href="#/privacy" style="color:inherit;text-decoration:none"><span class="grow">Confidentialité</span>${I.chev}</a>
      <button class="li" data-a="reset"><span class="grow" style="color:var(--red)">Tout effacer et recommencer</span></button></div>
    <p class="xs muted mt24">CalXsthenos · version 2.0 · ${esc(CONFIG.coachName)}. Les conseils de l'app ne remplacent pas un avis médical : en cas de douleur ou de problème de santé, consulte un médecin avant de t'entraîner.</p>
  </section>${tabbar("")}`;
};
routes.x = () => {
  $app.innerHTML = header("Pourquoi le X ?", "", { back: S().profile ? "profile" : "onboarding" }) + `<section class="page full prose">
    <div class="mt16">${logo(30)}</div>
    <p class="mt24"><i>Kalos</i>, en grec, c'est le beau, le noble. <i>Sthenos</i>, c'est la force. Ensemble, ils ont donné la calisthénie : l'art de bâtir un corps fort et noble.</p>
    <p>« Cal », ce sont aussi les calories : ce qui te nourrit. « Sthenos », ce qui te rend fort. Entre les deux, le X : la lettre grecque Chi, la première du nom du Christ, et la forme d'une croix.</p>
    <p>Nous croyons que le corps compte et mérite d'être servi avec exigence. Et qu'il n'est pas tout.</p>
    <div class="card mt16">${W.wordCard(W.VERSES[0])}</div>
    <p class="mt16">La force que tu construis ici est réelle. Celle que Dieu offre l'est davantage, et elle ne se gagne pas : elle se reçoit.</p>
    <button class="btn btn-line mt16" data-a="go" data-r="eternal" data-p="jesus">Qui est Jésus ?</button>
  </section>`;
};
routes.privacy = () => {
  $app.innerHTML = header("Confidentialité", "", { back: S().profile ? "profile" : "onboarding" }) + `<section class="page full prose">
    <p><b>Responsable :</b> ${esc(CONFIG.coachName)}, micro-entrepreneur, coach sportif.</p>
    <p><b>Ce qui est envoyé sur notre serveur</b> (hébergé à Paris) : ton prénom, ton e-mail, tes réponses au questionnaire de départ, un résumé de ton activité (nombre de séances, poids, semaine du programme), tes messages avec Thomas et ta candidature si tu en envoies une.</p>
    <p><b>Ce qui reste uniquement sur ton téléphone :</b> le détail de tes séances, ton journal alimentaire, tes mensurations et tes photos.</p>
    <p><b>Pourquoi :</b> te proposer un programme adapté, te répondre et, si tu l'as accepté, t'envoyer des conseils par e-mail. Tes données ne sont jamais vendues.</p>
    <p><b>Tes droits :</b> accès, rectification, suppression. Écris à Thomas depuis l'onglet Coach, ou efface tout depuis ton profil. Les données de ton compte serveur sont supprimées sur simple demande.</p>
  </section>`;
};
function editBodySheet() {
  const p = S().profile;
  sheet(`<h2 class="h1">Mes infos</h2><form data-f="edit-body" class="stack mt12">
    <div class="grid2"><label class="field"><span>Poids (kg)</span><input name="weight" inputmode="decimal" value="${p.weight}"></label><label class="field"><span>Âge</span><input name="age" inputmode="numeric" value="${p.age}"></label></div>
    <label class="field"><span>E-mail</span><input name="email" type="email" value="${esc(p.email || "")}"></label>
    <label class="field"><span>Objectif</span><select name="goal">${STEPS[2].opts.map(([v, l]) => `<option value="${v}" ${p.goal === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="field"><span>Activité</span><select name="activity">${STEPS[10].opts.map(([v, l]) => `<option value="${v}" ${p.activity === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="field"><span>Alimentation</span><select name="diet">${STEPS[11].opts.map(([v, l]) => `<option value="${v}" ${p.diet === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <button class="btn btn-red">Enregistrer</button></form>`);
}

// =====================================================================
// ÉVÉNEMENTS
// =====================================================================
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a, d = b.dataset, cur = S().current;
  switch (a) {
    case "go": closeSheet(); go(d.r, d.p ?? null); break;
    case "ob-start": OB.i = 0; OB.echo = null; routes.onboarding(); break;
    case "ob-back": if (OB.i <= 0) OB.i = -1; else { OB.i--; OB.echo = null; } routes.onboarding(); break;
    case "ob-pick": obNext(JSON.parse(d.v), b.firstChild.textContent.trim()); break;
    case "ob-skip": obNext({}, "Je passe"); break;
    case "ob-sex": OB.a.sex = d.v; b.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); break;
    case "start": {
      const ns = E.nextSession(); if (ns && !weekOpen(ns.week) && !cur) return go("offers");
      sessionStorage.removeItem("cxs.min");
      if (!cur) { await Promise.all([E.loadPrograms(), E.loadFiches()]); const s = E.buildSession(); update(st => st.current = s); }
      go("workout"); break;
    }
    case "resume": sessionStorage.removeItem("cxs.min"); go("workout"); break;
    case "minimize": sessionStorage.setItem("cxs.min", "1"); go("home"); break;
    case "tick": {
      const ex = cur.exercises[+d.x], s = ex.sets[+d.s];
      s.done = !s.done; if (s.done && s.rpe == null) s.rpe = s.trpe;
      save(); buzz(s.done ? 18 : 8);
      const y = window.scrollY; routes.workout(); window.scrollTo(0, y);
      if (s.done) startRest(ex.sets.every(x => x.done) ? Math.max(60, ex.rest) : ex.rest);
      break;
    }
    case "rpe": { const s = cur.exercises[+d.x].sets[+d.s]; s.rpe = +d.v; s.rpeSet = true; save(); const y = window.scrollY; routes.workout(); window.scrollTo(0, y); break; }
    case "rest-add": restEnd += 30000; restTotal += 30; break;
    case "rest-skip": restEnd = 0; clearInterval(restT); document.querySelector(".rest")?.remove(); break;
    case "ex-menu": await E.loadFiches(); exMenu(+d.x); break;
    case "add-set": { const ex = cur.exercises[+d.x], l = ex.sets.at(-1); ex.sets.push({ ...l, done: false, rpe: null }); save(); closeSheet(); routes.workout(); break; }
    case "swap": {
      const ex = cur.exercises[+d.x], n = d.n;
      update(st => { if (n === ex.orig) delete st.swaps[ex.orig]; else st.swaps[ex.orig] = n; });
      const fresh = E.buildSession().exercises[+d.x];
      Object.assign(ex, { name: fresh.name, unit: fresh.unit, bw: fresh.bw, step: fresh.step, sets: fresh.sets });
      save(); closeSheet(); routes.workout(); toast("Exercice remplacé, charges recalculées"); break;
    }
    case "finish": finishFlow(); break;
    case "train-tab": trainTab = d.v; routes.train(); break;
    case "set-program": {
      if (cur) return toast("Termine d'abord ta séance en cours.");
      if (!programOpen(d.id)) return go("offers");
      update(st => st.plan = { programId: d.id, startedAt: today(), week: 1, idx: 0, cycle: 1 });
      trainTab = "programme"; toast("Programme changé"); pushStats(); routes.train(); break;
    }
    case "prog-tab": progTab = d.v; routes.train(); break;
    case "lift": liftSel = d.n; routes.train(); break;
    case "photo": if (confirm("Supprimer cette photo ?")) { await deletePhoto(+d.id); routes.train(); } break;
    case "food-tab": foodTab = d.v; routes.food(); break;
    case "add-food": addFoodSheet(d.m); break;
    case "pick-food": gramsSheet(d.src === "recent" ? S().recentFoods[+d.i] : window.__fr[+d.i], d.m); break;
    case "del-food": N.removeEntry(+d.id); routes.food(); break;
    case "scan": scanFlow(d.m); break;
    case "eat-plan": { const dish = N.dayPlan(N.targets()).find(x => x.meal === d.meal); N.addEntry({ meal: d.meal, label: dish.n, g: null, kcal: dish.m.kcal, p: dish.m.p, c: dish.m.c, f: dish.m.f }); buzz(); toast(`${d.meal} enregistré`); routes.food(); break; }
    case "swap-dish": N.swapDish(d.meal); routes.food(); break;
    case "save-dish": {
      if (!premium() && S().dishes.length >= 3) { toast("3 plats enregistrés en gratuit · illimités avec Premium"); return; }
      const es = N.dayLog().filter(x => x.meal === d.m); const n = prompt("Nom du plat", es.map(x => x.label.split(",")[0]).slice(0, 2).join(" + "));
      if (!n) break;
      const tot = es.reduce((acc, x) => ({ kcal: acc.kcal + x.kcal, p: acc.p + x.p, c: acc.c + x.c, f: acc.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 });
      update(st => st.dishes.unshift({ n, ...tot })); toast("Plat enregistré"); break;
    }
    case "eat-dish": { const di = S().dishes[+d.i]; N.addEntry({ meal: d.m, label: di.n, g: null, kcal: di.kcal, p: di.p, c: di.c, f: di.f }); closeSheet(); toast("Ajouté"); routes.food(); break; }
    case "word-tab": wordTab = d.v; routes.word(); break;
    case "aff-cat": affCat = d.v; wordTab = "affirm"; routes.word(); break;
    case "fav": {
      const on = isFav(d.id);
      if (!on && !premium() && S().favorites.length >= FREE_FAVORITES) { toast(`${FREE_FAVORITES} favoris en gratuit · illimités avec Premium`); return; }
      update(st => st.favorites = on ? st.favorites.filter(x => x !== d.id) : [d.id, ...st.favorites]); buzz();
      b.classList.toggle("on", !on); if (wordTab === "favoris" && route === "word") routes.word(); break;
    }
    case "share": { const t = d.t + "\n\nCalXsthenos · " + location.origin + location.pathname; if (navigator.share) navigator.share({ text: t }).catch(() => { }); else { navigator.clipboard?.writeText(t); toast("Copié"); } break; }
    case "declare": { const t = W.affirmationOfDay().t; if ("speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(t); u.lang = "fr-FR"; u.rate = .92; speechSynthesis.speak(u); } toast("Répète-la à voix haute, lentement."); break; }
    case "notifs": notifsSheet(); break;
    case "demo": update(st => st.demoTier = d.v); toast(`Démo ${offer(d.v).name} : explore l'app`); go("home"); break;
    case "demo-exit": update(st => st.demoTier = null); render(); break;
    case "demo-choose": { const t = S().demoTier; update(st => st.demoTier = null); chooseOffer(t); break; }
    case "choose": chooseOffer(d.v); break;
    case "prefill": closeSheet(); window.__prefill = d.t; go("chat"); break;
    case "checkin": checkinSheet(); break;
    case "ap-back": if (AP.i === 0) go("offers"); else { AP.i--; routes.apply(); } break;
    case "ap-pick": AP.a[AQ[AP.i].id] = JSON.parse(d.v); AP.i++; buzz(); routes.apply(); break;
    case "set-tier": {
      const t = document.getElementById("tier").value, c = await cloud();
      try { await c.setTier(d.id, t); await c.notify("Ta formule a changé", `Tu es maintenant en ${offer(t).name}.`, d.id); const m = window.__members.find(x => x.id === d.id); if (m) m.tier = t; toast("Formule mise à jour"); } catch (err) { toast(err.message); }
      break;
    }
    case "word-set": update(st => st.settings.word = d.v); routes.profile(); break;
    case "haptics": update(st => st.settings.haptics = !st.settings.haptics); routes.profile(); break;
    case "edit-body": await N.loadModels(); editBodySheet(); break;
    case "export": {
      const blob = new Blob([exportJSON()], { type: "application/json" }), u = URL.createObjectURL(blob);
      const l = document.createElement("a"); l.href = u; l.download = `calxsthenos-sauvegarde-${today()}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(u), 3000); break;
    }
    case "reset": if (confirm("Effacer toutes tes données de ce téléphone ? Cette action est définitive.")) { resetAll(); localStorage.removeItem("cxs.auth"); OB.i = -1; go("onboarding"); } break;
  }
});
document.addEventListener("input", (e) => { if (e.target.matches("[data-in]")) setInput(e.target); });
document.addEventListener("submit", async (e) => {
  const f = e.target.closest("form[data-f]"); if (!f) return; e.preventDefault();
  const v = Object.fromEntries(new FormData(f)); const num = (x) => parseFloat(String(x || "").replace(",", "."));
  switch (f.dataset.f) {
    case "ob-text": if (v.v.trim()) obNext(v.v.trim(), v.v.trim()); break;
    case "ob-email": { const em = v.v.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return toast("Vérifie ton adresse e-mail."); OB.a.news = !!v.news; obNext(em, em); break; }
    case "ob-records": {
      const rec = {}; LIFTS_ASK(OB.a).forEach(([k]) => { const r = num(v[k + "-r"]), kg = num(v[k + "-k"]); if (r > 0 && kg > 0) rec[k] = { r, k: kg }; });
      const n = Object.keys(rec).length; obNext(rec, n ? `${n} record${n > 1 ? "s" : ""} enregistré${n > 1 ? "s" : ""}` : "Je passe"); break;
    }
    case "ob-body": {
      const age = num(v.age), height = num(v.height), weight = num(v.weight);
      if (!(age > 12 && age < 100 && height > 120 && height < 230 && weight > 30 && weight < 250)) return toast("Vérifie ton âge, ta taille et ton poids.");
      Object.assign(OB.a, { age, height, weight, sex: OB.a.sex || "m" }); obNext({ age, height, weight }, `${age} ans · ${height} cm · ${E.fmtKg(weight)} kg`); break;
    }
    case "ap-text": AP.a[AQ[AP.i].id] = v.v.trim(); AP.i++; routes.apply(); break;
    case "ap-phone": AP.a.phone = v.v.trim(); AP.i++; routes.apply(); break;
    case "send": sendMessage(f); break;
    case "checkin": {
      const txt = `Bilan ${rank() >= 3 ? "de la semaine" : "du mois"}\nPoids moyen : ${v.poids} kg · Séances : ${v.seances}\nÉnergie ${v.energie || "-"}/10 · Sommeil ${v.sommeil || "-"}/10 · Faim ${v.faim || "-"}/10\nVictoire : ${v.victoire || "-"}\nDifficulté : ${v.difficulte || "-"}`;
      const c = await cloud(); try { await c.ensureSession(); await c.send(txt); closeSheet(); toast("Bilan envoyé à Thomas"); } catch { toast("Envoi impossible, réessaie."); } break;
    }
    case "broadcast": { const c = await cloud(); try { await c.notify(v.t, v.b, null); f.reset(); toast("Notification envoyée à tous"); } catch (err) { toast(err.message); } break; }
    case "notify-one": { const c = await cloud(); try { await c.notify(v.t, v.b, f.dataset.id); f.reset(); toast("Notification envoyée"); } catch (err) { toast(err.message); } break; }
    case "weight": { const w = num(v.w); if (!(w > 30 && w < 250)) return toast("Poids invalide"); update(st => { st.measures.push({ d: today(), weight: w }); st.profile.weight = w; }); pushStats(); toast("Pesée enregistrée"); routes.train(); break; }
    case "measures": { if (!premium()) return go("offers"); const m = { d: today() }; let any = false; ["waist", "hips", "chest", "arm", "thigh"].forEach(k => { const x = num(v[k]); if (x > 0) { m[k] = x; any = true; } }); if (!any) return; update(st => st.measures.push(m)); toast("Mensurations enregistrées"); routes.train(); break; }
    case "edit-body": update(st => { const p = st.profile; p.weight = num(v.weight) || p.weight; p.age = num(v.age) || p.age; p.email = v.email.trim() || p.email; p.goal = v.goal; p.activity = v.activity; p.diet = v.diet; p.nutritionModel = N.pickModel(p); st.synced = false; }); closeSheet(); toast("Infos mises à jour"); syncProfile(); routes.profile(); break;
  }
});
document.addEventListener("change", async (e) => {
  const f = e.target;
  if (f.matches('[data-f="import"]') && f.files[0]) { try { importJSON(await f.files[0].text()); toast("Sauvegarde restaurée"); go("home"); } catch (err) { toast(err.message || "Fichier illisible"); } }
  if (f.matches('[data-f="photo"]') && f.files[0]) { if (!premium()) return go("offers"); await addPhoto(f.files[0]); toast("Photo ajoutée"); routes.train(); }
  if (f.matches('[data-f="theme"]')) { const t = f.value; if (t) { localStorage.setItem("cxs.theme", t); document.documentElement.dataset.theme = t; } else { localStorage.removeItem("cxs.theme"); delete document.documentElement.dataset.theme; } }
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && e.target.matches(".composer textarea")) { e.preventDefault(); e.target.form.requestSubmit(); } });
window.addEventListener("hashchange", render);

// Démarrage
(async () => {
  try { const t = localStorage.getItem("cxs.theme"); if (t) document.documentElement.dataset.theme = t; } catch { }
  await Promise.all([E.loadPrograms(), N.loadModels()]).catch(() => { });
  render();
  refreshMe().then(() => { if (["home", "coach"].includes(route) && !document.querySelector(".sheet-wrap, .composer")) render(); });
  setInterval(refreshMe, 60000);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => { });
})();
