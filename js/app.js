import { S, save, update, today, resetAll, exportJSON, importJSON, addPhoto, listPhotos, deletePhoto } from "./store.js";
import * as E from "./engine.js";
import * as N from "./nutrition.js";
import { verseOfDay, verseFor, declarationOfDay, wordCard } from "./word.js";
import { CONFIG } from "./config.js";

const $app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const buzz = (ms = 12) => { if (S().settings.haptics && navigator.vibrate) navigator.vibrate(ms); };
const kgTxt = (v) => v == null || v === "" ? "" : E.fmtKg(v);

// ---------- Icônes ----------
const I = {
  x: (s = 28) => `<svg viewBox="0 0 40 40" width="${s}" height="${s}" aria-hidden="true"><path d="M9 9l22 22" stroke="var(--ivoire)" stroke-width="6" stroke-linecap="round"/><path d="M9 31 31 9" stroke="var(--or)" stroke-width="6" stroke-linecap="round"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/><path class="acc" d="M9 21v-6h6v6"/></svg>`,
  bar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path class="acc" d="M7 12h10"/><path d="M4 8v8M7 6v12M17 6v12M20 8v8"/></svg>`,
  fork: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6"/><path class="acc" d="M17 21V3c-2 1-3 4-3 8h3"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path class="acc" d="m5 15 4-4 4 3 6-7"/></svg>`,
  coach: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/><path class="acc" d="m15 3 4 4M19 3l-4 4"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`,
  chev: `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.3-3.4 3.8-5 7-5s5.7 1.6 7 5" stroke-linecap="round"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>`,
  dots: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,
  scan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 9v6M11 9v6M14 9v6M17 9v6"/></svg>`,
};
const logo = (size = 22) => `<span class="logo" style="font-size:${size}px">CAL${I.x(size)}STHENOS</span>`;

// ---------- Utilitaires d'interface ----------
let toastT;
function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.append(t);
  clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2400);
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
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

function lineChart(points, { h = 150, unit = "kg" } = {}) {
  if (points.length < 2) return `<p class="empty small">La courbe apparaît après deux séances.</p>`;
  const W = 340, H = h, pl = 34, pr = 10, pt = 14, pb = 22;
  const ys = points.map(p => p.y), lo = Math.min(...ys), hi = Math.max(...ys), span = (hi - lo) || 1;
  const x = i => pl + i * (W - pl - pr) / (points.length - 1), y = v => pt + (1 - (v - lo) / span) * (H - pt - pb);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.y).toFixed(1)}`).join("");
  const last = points[points.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe">
    <line x1="${pl}" x2="${W - pr}" y1="${y(hi)}" y2="${y(hi)}" stroke="var(--fer)" stroke-dasharray="3 4"/>
    <line x1="${pl}" x2="${W - pr}" y1="${y(lo)}" y2="${y(lo)}" stroke="var(--fer)" stroke-dasharray="3 4"/>
    <text x="${pl - 6}" y="${y(hi) + 4}" fill="var(--pierre)" font-size="11" text-anchor="end">${Math.round(hi)}</text>
    <text x="${pl - 6}" y="${y(lo) + 4}" fill="var(--pierre)" font-size="11" text-anchor="end">${Math.round(lo)}</text>
    <path d="${d}" fill="none" stroke="var(--or)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(points.length - 1)}" cy="${y(last.y)}" r="4.5" fill="var(--or)"/>
    <text x="${pl}" y="${H - 4}" fill="var(--pierre)" font-size="11">${points[0].l}</text>
    <text x="${W - pr}" y="${H - 4}" fill="var(--pierre)" font-size="11" text-anchor="end">${last.l}</text></svg>`;
}

// ---------- Routeur ----------
const routes = {};
let route = "home", param = null;
function go(r, p = null) { location.hash = "#/" + r + (p != null ? "/" + encodeURIComponent(p) : ""); }
function render() {
  const h = location.hash.replace(/^#\/?/, "").split("/");
  route = h[0] || "home"; param = h[1] ? decodeURIComponent(h[1]) : null;
  if (!S().profile && !["onboarding", "x"].includes(route)) route = "onboarding";
  if (S().current && route !== "workout" && route !== "x" && sessionStorage.getItem("cxs.min") !== "1") route = "workout";
  (routes[route] || routes.home)();
  window.scrollTo(0, 0);
}
function tabbar(active) {
  const t = [["home", "Accueil", I.home], ["train", "Séance", I.bar], ["food", "Carburant", I.fork], ["progress", "Progrès", I.chart], ["coach", "Coach", I.coach]];
  const cur = S().current ? `<button data-a="resume" class="card press" style="position:fixed;left:12px;right:12px;bottom:calc(76px + var(--safe-b));z-index:29;max-width:536px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;gap:12px;border-color:var(--or)"><span class="grow" style="text-align:left"><b>Séance en cours</b><br><span class="small dim">${esc(S().current.title)}</span></span><span class="gold" style="font-weight:600">Reprendre</span></button>` : "";
  return cur + `<nav class="tabbar" aria-label="Navigation">${t.map(([r, l, ic]) => `<a href="#/${r}" class="tab" ${r === active ? 'aria-current="page"' : ""}>${ic}<span>${l}</span></a>`).join("")}</nav>`;
}

// =====================================================================
// ONBOARDING CONVERSATIONNEL
// =====================================================================
const OB = { i: -1, a: {}, echo: null };
const STEPS = [
  { id: "name", type: "text", q: () => `Salut. Je suis Thomas, ton coach. <span class="k">Comment tu t'appelles ?</span>`, ph: "Ton prénom" },
  { id: "goal", q: (a) => `Enchanté ${esc(a.name)}. Quel est ton <span class="k">objectif principal</span> ?`, opts: [["muscle", "Prendre du muscle"], ["strength", "Gagner en force"], ["fat", "Perdre du gras"], ["recomp", "Perdre du gras et prendre du muscle"], ["restart", "Reprendre le sport"]] },
  { id: "discipline", q: () => `Et ce qui te <span class="k">parle le plus</span> ?`, opts: [["musculation", "Musculation"], ["powerbuilding", "Powerbuilding", "Force et muscle"], ["streetlifting", "Street lifting", "Tractions et dips lestés"], ["street", "Street workout", "Le programme poids du corps arrive bientôt"]] },
  { id: "level", q: () => `Où en es-tu <span class="k">aujourd'hui</span> ?`, opts: [["beginner", "Je débute"], ["comeback", "Je reprends après une pause"], ["regular", "Je m'entraîne régulièrement"], ["advanced", "Je m'entraîne depuis plus de 2 ans"]] },
  { id: "place", q: () => `Compris, on part de là où tu es. <span class="k">Où</span> t'entraînes-tu ?`, opts: [["bigGym", "En salle (Basic-Fit ou équivalent)"], ["smallGym", "Dans une petite salle"], ["home", "À la maison, avec haltères"], ["bodyweight", "Au poids du corps, dehors"]] },
  { id: "days", q: () => `Combien de <span class="k">jours par semaine</span> peux-tu vraiment t'entraîner ?`, sub: "Vise ce que tu tiens sur 12 semaines, pas ce que tu ferais une bonne semaine.", opts: [[2, "2 jours"], [3, "3 jours"], [4, "4 jours"], [5, "5 jours"], [6, "6 jours"]] },
  { id: "backPain", q: () => `As-tu une <span class="k">gêne au bas du dos</span> en ce moment ?`, opts: [[false, "Non"], [true, "Oui, régulièrement"]] },
  { id: "records", type: "records", skip: (a) => a.level === "beginner" || a.level === "comeback", q: () => `Tes <span class="k">meilleures séries</span> récentes`, sub: "Répétitions et charge sur une série récente faite avec effort et bonne technique. Laisse vide ce que tu ne fais pas." },
  { id: "body", type: "body", q: () => `Pour calculer ton <span class="k">carburant</span>`, sub: "Ces infos restent sur ton téléphone." },
  { id: "activity", q: () => `Ta journée, en dehors du sport ?`, opts: [["low", "Assis la plupart du temps"], ["mid", "Debout ou en mouvement une partie du temps"], ["high", "Métier physique"]] },
  { id: "diet", q: () => `Ton <span class="k">alimentation</span> ?`, opts: [["all", "Je mange de tout"], ["vegetarian", "Végétarien"], ["vegan", "Vegan"]] },
  { id: "word", q: () => `Dernière chose. Veux-tu une <span class="k">Parole pour la route</span> chaque jour ?`, sub: "Cal X Sthenos est fondée sur 1 Timothée 4:8 : l'exercice du corps est utile, et il n'est pas tout. Tu peux changer ce choix à tout moment.", opts: [["daily", "Oui, chaque jour"], ["discreet", "Seulement sur l'accueil"], ["off", "Pas maintenant"]] },
];
const LIFTS_ASK = (a) => a.discipline === "streetlifting"
  ? [["pullup", "Tractions lestées", "lest"], ["dip", "Dips lestés", "lest"], ["squat", "Squat barre"], ["bench", "Développé couché barre"]]
  : [["squat", "Squat barre"], ["bench", "Développé couché barre"], ["deadlift", "Soulevé de terre"], ["ohp", "Développé militaire barre"]];

function visibleSteps() { return STEPS.filter(s => !(s.skip && s.skip(OB.a))); }

routes.onboarding = () => {
  if (OB.i < 0) return renderWelcome();
  const steps = visibleSteps(), s = steps[OB.i];
  if (!s) return renderBuilding();
  const pct = Math.round((OB.i) / steps.length * 100);
  let body = "";
  if (s.type === "text") body = `<form class="choices" data-f="ob-text" style="align-items:stretch"><label class="field"><span>${s.ph}</span><input name="v" autocomplete="given-name" required maxlength="30" value="${esc(OB.a[s.id] || "")}" autofocus></label><button class="btn btn-gold">Continuer</button></form>`;
  else if (s.type === "records") body = `<form class="choices" data-f="ob-records" style="align-items:stretch">${LIFTS_ASK(OB.a).map(([k, n, lest]) => `<div><div class="small" style="font-weight:600;margin-bottom:6px">${n}</div><div class="grid2"><label class="field"><span>Répétitions</span><input name="${k}-r" inputmode="numeric" placeholder="0"></label><label class="field"><span>${lest ? "Lest (kg)" : "Charge (kg)"}</span><input name="${k}-k" inputmode="decimal" placeholder="0"></label></div></div>`).join("")}<button class="btn btn-gold">Continuer</button><button type="button" class="btn-text" data-a="ob-skip" style="align-self:center">Je ne sais pas, passer</button></form>`;
  else if (s.type === "body") body = `<form class="choices" data-f="ob-body" style="align-items:stretch"><div class="seg" role="group"><button type="button" data-a="ob-sex" data-v="m" class="${OB.a.sex !== "f" ? "on" : ""}">Homme</button><button type="button" data-a="ob-sex" data-v="f" class="${OB.a.sex === "f" ? "on" : ""}">Femme</button></div><div class="grid2"><label class="field"><span>Âge</span><input name="age" inputmode="numeric" required value="${OB.a.age || ""}"></label><label class="field"><span>Taille (cm)</span><input name="height" inputmode="numeric" required value="${OB.a.height || ""}"></label></div><label class="field"><span>Poids (kg)</span><input name="weight" inputmode="decimal" required value="${OB.a.weight || ""}"></label><button class="btn btn-gold">Continuer</button></form>`;
  else body = `<div class="choices">${s.opts.map(([v, l, sub]) => `<button class="choice" data-a="ob-pick" data-v='${JSON.stringify(v)}'>${l}${sub ? `<small>${sub}</small>` : ""}</button>`).join("")}</div>`;
  $app.innerHTML = `<section class="convo">
    <div class="convo-top"><button class="icon-btn" data-a="ob-back" aria-label="Retour">${I.back}</button><div class="progress"><i style="width:${pct}%"></i></div><span style="width:44px"></span></div>
    ${OB.echo ? `<div class="echo">${esc(OB.echo)}</div>` : ""}
    <div class="coach-mark">${I.x(44)}</div>
    <h1 class="q">${s.q(OB.a)}</h1>${s.sub ? `<p class="q-sub">${s.sub}</p>` : ""}
    ${body}</section>`;
  $app.querySelector("input")?.focus({ preventScroll: true });
};
function renderWelcome() {
  $app.innerHTML = `<section class="convo" style="justify-content:space-between">
    <div class="mt32">${logo(24)}</div>
    <div>
      <h1 class="h-xl">Un corps fort et noble.<br>Un plan qui suit ce que tu fais vraiment.</h1>
      <p class="dim mt16" style="font-size:17px">Entraînement, nutrition et progression calculés pour toi, par un coach diplômé STAPS. Le X au centre.</p>
    </div>
    <div class="stack"><button class="btn btn-gold" data-a="ob-start">Commencer</button>
    <label class="btn btn-ghost" style="cursor:pointer">Restaurer une sauvegarde<input type="file" accept="application/json" data-f="import" hidden></label></div>
  </section>`;
}
function obNext(val, echo) {
  const s = visibleSteps()[OB.i]; if (s) OB.a[s.id] = val;
  OB.echo = echo; OB.i++; buzz(); routes.onboarding();
}
async function renderBuilding() {
  const a = OB.a;
  const lines = ["Analyse de ton profil", "Choix de ton programme", "Calcul de tes charges", "Calcul de ton carburant"];
  $app.innerHTML = `<section class="loader"><svg class="big-x" viewBox="0 0 40 40"><path class="s1" d="M9 31 31 9" stroke="var(--or)" stroke-width="5" stroke-linecap="round" fill="none"/><path class="s2" d="M9 9l22 22" stroke="var(--ivoire)" stroke-width="5" stroke-linecap="round" fill="none"/></svg><ul style="padding:0;margin:0">${lines.map(l => `<li><i></i>${l}</li>`).join("")}</ul></section>`;
  await Promise.all([E.loadPrograms(), N.loadModels()]);
  const rec = {};
  Object.entries(a.records || {}).forEach(([k, v]) => { if (v.k > 0 && v.r > 0) rec[k] = { ...v, e1rm: Math.round(E.e1rm(v.k, v.r, 9) * 10) / 10 }; });
  const profile = { name: a.name, goal: a.goal, discipline: a.discipline === "street" ? "musculation" : a.discipline, wantsStreet: a.discipline === "street", level: a.level, place: a.place, days: a.days, backPain: a.backPain, records: rec, sex: a.sex || "m", age: +a.age, height: +a.height, weight: +a.weight, activity: a.activity, diet: a.diet, createdAt: today() };
  profile.nutritionModel = N.pickModel(profile);
  update(st => {
    st.profile = profile; st.settings.word = a.word || "daily";
    st.plan = { programId: E.pickProgram(profile), startedAt: today(), week: 1, idx: 0, cycle: 1 };
    st.measures.push({ d: today(), weight: profile.weight });
  });
  const lis = [...$app.querySelectorAll("li")];
  for (let k = 0; k < lis.length; k++) { await new Promise(r => setTimeout(r, 650)); lis[k].classList.add("ok"); lis[k].querySelector("i").innerHTML = I.check.replace("<svg", '<svg width="14" height="14"'); }
  await new Promise(r => setTimeout(r, 500));
  OB.i = -1; OB.a = {}; OB.echo = null;
  go("plan");
}

// Révélation du plan
routes.plan = () => {
  const ns = E.nextSession(); if (!ns) return go("home");
  const { p } = ns, t = N.targets(), lay = E.weekLayout(p);
  $app.innerHTML = `<section class="screen full">
    <p class="gold" style="font-weight:600;margin:12px 0 6px">Ton plan</p>
    <h1 class="h-xl">${esc(p.name.split("·")[0].trim())}</h1>
    <p class="dim mt8">${esc(p.desc)}</p>
    <div class="stat3 mt24"><div><b>${p.s.length}×</b><span>par semaine</span></div><div><b>${ns.weeks}</b><span>semaines</span></div><div><b class="small" style="font-size:17px;line-height:31px">${esc(p.lvl)}</b><span>niveau</span></div></div>
    ${S().profile.days !== p.s.length ? `<p class="small dim mt16">Tu as choisi ${S().profile.days} jours : ce programme en demande ${p.s.length}, le meilleur rapport résultats / régularité pour ton profil. Tu peux en changer dans l'onglet Séance.</p>` : ""}
    ${S().profile.wantsStreet ? `<p class="small dim mt8">Le programme street workout arrive bientôt : en attendant, ce plan construit la force de base qui le prépare.</p>` : ""}
    <h2 class="h2 mt32">Ta semaine type</h2>
    ${lay.map((l, i) => `<div class="day-card ${i === 0 ? "first" : ""}"><div><span class="tag ${i === 0 ? "g" : ""}">${E.DAY_NAMES[l.dow]}</span>${i === 0 ? '<span class="tag g">Première séance</span>' : ""}<div class="h3 mt8">${esc(l.s[0])}</div><div class="small dim">${l.s[2].length} exercices</div></div></div>`).join("")}
    <h2 class="h2 mt32">Pourquoi ce plan marche</h2>
    <p class="mt8">${esc(p.why)}</p>
    <div class="card mt16"><div class="h3">Ton carburant</div><p class="small dim mt8">${esc(t.model.name)}</p>
      <div class="row between mt8"><span class="num" style="font-size:30px">${t.kcal}<span class="small dim" style="font-family:var(--f-text);font-weight:400"> kcal/jour</span></span></div>
      <p class="small dim">${t.prot} g de protéines · ${t.carbs} g de glucides · ${t.fat} g de lipides</p></div>
    ${wordOn("home") ? `<div class="mt24">${wordCard({ ref: "Colossiens 3:23", t: "Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes." })}</div>` : ""}
  </section><div class="dock"><button class="btn btn-gold" data-a="go" data-r="home">C'est parti</button></div>`;
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
  const v = hard ? verseFor("dur") : verseOfDay();
  $app.innerHTML = `<section class="screen">
    <div class="row between">${logo(18)}<button class="icon-btn" data-a="go" data-r="profile" aria-label="Profil">${I.user}</button></div>
    <h1 class="h-display mt24">${greet()} ${esc(pr.name)}.</h1>
    <p class="dim mt8">${fmtDate(new Date())}</p>
    ${hard ? `<div class="card mt16"><p style="margin:0"><b>${gap} jours sans séance.</b> On reprend là où tu es, pas là où tu aurais voulu être. Les charges de la prochaine séance sont allégées de 10 %.</p></div>` : ""}
    ${ns ? `<div class="card-hero mt24">
      <div class="small dim">Semaine ${ns.week} sur ${ns.weeks} · ${esc(ns.phase || "")}${ns.cycle > 1 ? ` · cycle ${ns.cycle}` : ""}</div>
      <h2 class="h1 mt8">${esc(ns.title)}</h2>
      <p class="small dim mt8" style="margin-bottom:18px">${ns.exercises.length} exercices · ${ns.exercises.slice(0, 3).map(e => esc(S().swaps[e[0]] || e[0])).join(", ")}…</p>
      <button class="btn btn-gold" data-a="start">${S().current ? "Reprendre la séance" : "Commencer la séance"}</button>
    </div>` : ""}
    <div class="wk mt16">${E.DAY_SHORT.map((d, i) => `<div class="${lay.some(l => l.dow === i) ? "plan" : ""} ${doneDows.has(i) ? "done" : ""} ${i === dow ? "today" : ""}">${d}<b>${doneDows.has(i) ? "✓" : lay.some(l => l.dow === i) ? "•" : ""}</b></div>`).join("")}</div>
    <p class="small dim mt8">${done} séance${done > 1 ? "s" : ""} cette semaine${streak > 1 ? ` · ${streak} semaines actives d'affilée` : ""}</p>
    ${wordOn("home") ? `<div class="card mt24">${wordCard(v)}</div>` : ""}
    ${t ? `<button class="card press mt16" data-a="go" data-r="food" style="width:100%;text-align:left;display:block">
      <div class="row between"><span class="h3">Carburant</span><span class="small dim">${Math.max(0, t.kcal - tot.kcal)} kcal restantes</span></div>
      <div class="macro mt16">${[["Calories", tot.kcal, t.kcal, ""], ["Protéines", tot.p, t.prot, " g"], ["Glucides", tot.c, t.carbs, " g"]].map(([l, a, b, u], i) => `<div><div class="xs dim">${l}</div><div class="num" style="font-size:18px">${Math.round(a)}<span class="xs dim" style="font-family:var(--f-text);font-weight:400"> / ${b}${u}</span></div><div class="gauge ${i === 1 ? "g" : ""} ${a > b * 1.08 ? "over" : ""} mt8"><i style="width:${Math.min(100, a / b * 100)}%"></i></div></div>`).join("")}</div></button>` : ""}
    <button class="card press mt16" data-a="go" data-r="coach" style="width:100%;text-align:left;display:flex;align-items:center;gap:14px">
      <span class="grow"><span class="h3">Coaching privé avec ${esc(CONFIG.coachName.split(" ")[0])}</span><br><span class="small dim">Un suivi sur mesure, sur candidature.</span></span>${I.chev}</button>
  </section>${tabbar("home")}`;
};

// =====================================================================
// SÉANCE : programme
// =====================================================================
routes.train = () => {
  const ns = E.nextSession(); const { p } = ns;
  $app.innerHTML = `<section class="screen">
    <h1 class="h-display">Séance</h1>
    <div class="card mt24"><div class="small dim">Ton programme</div><div class="h2 mt8">${esc(p.name)}</div>
      <p class="small dim mt8">Semaine ${ns.week} sur ${ns.weeks} · ${esc(ns.phase)}</p>
      <button class="btn-text" data-a="programs">Changer de programme</button></div>
    <h2 class="label">Prochaine séance</h2>
    <div class="card"><div class="h2">${esc(ns.title)}</div>
      <ul style="padding:0;margin:14px 0 18px;list-style:none">${ns.exercises.map(e => `<li class="row between small" style="padding:7px 0;border-top:1px solid var(--fer)"><span>${esc(S().swaps[e[0]] || e[0])}</span><span class="dim">${E.KIND_LABEL[e[1]] || ""}</span></li>`).join("")}</ul>
      <button class="btn btn-gold" data-a="start">${S().current ? "Reprendre la séance" : "Commencer la séance"}</button></div>
    <h2 class="label">Les règles de ton programme</h2>
    <div class="card"><ul style="margin:0;padding-left:18px" class="small">${(p.rules || []).map(r => `<li style="margin-bottom:8px">${esc(r)}</li>`).join("")}</ul></div>
    <h2 class="label">Toutes les séances de la semaine</h2>
    <div class="list">${p.s.map((s, i) => `<div class="li"><span class="tag ${i === ns.idx ? "g" : ""}">${i + 1}</span><span class="grow">${esc(s[0])}<br><span class="xs dim">${s[2].length} exercices</span></span></div>`).join("")}</div>
  </section>${tabbar("train")}`;
};
function programsSheet() {
  const cur = S().plan.programId;
  sheet(`<h2 class="h1">Programmes</h2><p class="small dim mt8">Conçus et testés en salle par ${esc(CONFIG.coachName)}. Changer de programme repart en semaine 1, tes charges sont conservées.</p>
    <div class="stack mt16">${E.programs().map(p => `<button class="card press" data-a="set-program" data-id="${p.id}" style="text-align:left;width:100%;${p.id === cur ? "border-color:var(--or)" : ""}"><div class="h3">${esc(p.name)}</div><div class="small dim mt8">${esc(p.prof)}</div></button>`).join("")}</div>`);
}

// =====================================================================
// SÉANCE EN COURS
// =====================================================================
let restT = null, restEnd = 0, restTotal = 0, clockT = null;
routes.workout = () => {
  const cur = S().current; if (!cur) return go("train");
  sessionStorage.removeItem("cxs.min");
  const doneSets = cur.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0), all = cur.exercises.reduce((a, e) => a + e.sets.length, 0);
  $app.innerHTML = `<section class="screen" style="padding-bottom:180px">
    <div class="row between"><button class="icon-btn" data-a="minimize" aria-label="Réduire">${I.back}</button>
      <div style="text-align:center"><div class="num" id="clock" style="font-size:20px">0:00</div><div class="xs dim">${doneSets}/${all} séries</div></div>
      <button class="btn btn-ghost btn-sm" data-a="finish">Terminer</button></div>
    <p class="small dim mt24">Semaine ${cur.week} · ${esc(cur.phase || "")}</p>
    <h1 class="h1 mt8">${esc(cur.title)}</h1>
    ${cur.comeback ? `<p class="small mt8 gold">Reprise : charges allégées de 10 % aujourd'hui.</p>` : ""}
    ${cur.exercises.map((ex, xi) => exerciseBlock(ex, xi)).join("")}
    <button class="btn btn-gold mt24" data-a="finish">Terminer la séance</button>
  </section>`;
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
  return `<article class="ex" id="ex${xi}">
    <div class="ex-head"><div class="grow"><div>${ex.ss ? `<span class="tag g">Superset ${ex.ss}</span>` : ""}<span class="tag">${E.KIND_LABEL[ex.kind] || ex.kind}</span>${ex.tempo ? `<span class="tag">Tempo ${ex.tempo}</span>` : ""}</div>
      <h3 class="h3 mt8">${esc(ex.name)}</h3><div class="xs dim mt8">${target}${ex.name !== ex.orig ? ` · remplace ${esc(ex.orig)}` : ""}</div>
      ${!ex.bw && ex.sets.every(s => !s.kg) ? `<div class="xs mt8 gold">Première fois : choisis une charge qui te laisse 2 à 3 répétitions en réserve. L'app calcule la suite.</div>` : ""}
      ${ex.note ? `<div class="xs mt8" style="color:var(--ivoire);opacity:.85">${esc(ex.note)}</div>` : ""}</div>
      <button class="icon-btn" data-a="ex-menu" data-x="${xi}" aria-label="Options de l'exercice" style="width:38px;height:38px">${I.dots}</button></div>
    <div class="sets">
      ${ex.sets.map((s, si) => {
        const head = s.g !== lastG && groups.length > 1 ? `<div class="set-group">${s.g === 0 ? "Série lourde" : "Séries de travail"}</div>` : ""; lastG = s.g;
        return head + `<div class="set ${s.done ? "done" : ""}"><span class="n">${si + 1}</span>
        <div>${ex.bw ? `<input value="PDC" disabled aria-label="Poids du corps" style="font-size:14px">` : `<input inputmode="decimal" data-in="kg" data-x="${xi}" data-s="${si}" value="${kgTxt(s.kg)}" placeholder="kg" aria-label="Charge en kg">`}<div class="u">${ex.bw ? "corps" : "kg"}</div></div>
        <div><input inputmode="numeric" data-in="reps" data-x="${xi}" data-s="${si}" value="${s.reps ?? ""}" aria-label="${unit}"><div class="u">${s.ds ? "dégressive" : unit}${s.lo !== s.hi ? ` · ${s.lo}-${s.hi}` : ""}</div></div>
        <button class="tick" data-a="tick" data-x="${xi}" data-s="${si}" aria-label="Valider la série ${si + 1}">${I.check}</button></div>
        ${s.done && ex.unit !== "s" ? `<div class="rpe">Ressenti ${[["7", "facile"], ["8", "juste"], ["9", "dur"], ["10", "max"]].map(([r, l]) => `<button data-a="rpe" data-x="${xi}" data-s="${si}" data-v="${r}" class="${Math.round(s.rpe ?? s.trpe) == r ? "on" : ""}">${l}</button>`).join("")}</div>` : ""}`;
      }).join("")}
    </div></article>`;
}
function showRest() {
  document.querySelector(".rest")?.remove();
  const v = wordOn("rest") && restTotal >= 60 ? verseFor("repos", Math.floor(restEnd / 1000)) : null;
  const el = document.createElement("div"); el.className = "rest";
  el.innerHTML = `<div class="row between"><div><div class="xs dim">Repos</div><div class="t" id="rest-t"></div></div><div class="row" style="gap:8px"><button class="btn btn-ghost btn-sm" data-a="rest-add">+30 s</button><button class="btn btn-ghost btn-sm" data-a="rest-skip">Passer</button></div></div><div class="bar"><i id="rest-bar"></i></div>${v ? wordCard(v, "small") : ""}`;
  document.body.append(el);
  const tick = () => {
    const left = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000));
    const t = document.getElementById("rest-t"), b = document.getElementById("rest-bar");
    if (!t) return clearInterval(restT);
    t.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    b.style.width = `${100 - left / restTotal * 100}%`;
    if (left <= 0) { clearInterval(restT); buzz([180, 90, 180]); el.remove(); }
  };
  clearInterval(restT); tick(); restT = setInterval(tick, 250);
}
function startRest(sec) { restTotal = sec; restEnd = Date.now() + sec * 1000; showRest(); }
function exMenu(xi) {
  const ex = S().current.exercises[xi], f = E.ficheOf(ex.name), alts = E.alternatives(ex.name);
  sheet(`<h2 class="h1">${esc(ex.name)}</h2>
    ${f?.svg ? `<div style="background:#ECE7DC;border-radius:16px;padding:8px;margin-top:14px;color:#151515">${f.svg}</div>` : ""}
    ${f ? `${f.setup ? `<p class="mt16"><b>Installation.</b> ${esc(f.setup)}</p>` : ""}${f.cues?.length ? `<ul class="small" style="padding-left:18px">${f.cues.map(c => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}${f.note ? `<p class="small dim">${esc(f.note)}</p>` : ""}${f.muscles ? `<p class="xs dim">${esc(f.muscles)}</p>` : ""}` : `<p class="small dim mt16">Fiche détaillée bientôt disponible.</p>`}
    <div class="row mt16" style="gap:10px"><button class="btn btn-ghost btn-sm grow" data-a="add-set" data-x="${xi}">Ajouter une série</button>${ex.name !== ex.orig ? `<button class="btn btn-ghost btn-sm grow" data-a="swap" data-x="${xi}" data-n="${esc(ex.orig)}">Revenir à l'original</button>` : ""}</div>
    ${alts.length ? `<h3 class="label">Remplacer par (même mouvement)</h3><div class="list">${alts.slice(0, 14).map(n => `<button class="li" data-a="swap" data-x="${xi}" data-n="${esc(n)}"><span class="grow">${esc(n)}</span>${I.chev}</button>`).join("")}</div>` : ""}`);
}
function setInput(el) {
  const cur = S().current, ex = cur.exercises[+el.dataset.x], s = ex.sets[+el.dataset.s];
  const v = parseFloat(String(el.value).replace(",", "."));
  if (el.dataset.in === "kg") s.kg = isNaN(v) ? null : v; else s.reps = isNaN(v) ? null : Math.round(v);
  // propage la charge aux séries suivantes non validées du même groupe
  if (el.dataset.in === "kg") ex.sets.forEach((o, i) => { if (i > +el.dataset.s && !o.done && o.g === s.g && !o.ds) o.kg = s.kg; });
  save();
}
async function finishFlow() {
  const cur = S().current, n = cur.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  if (!n) { if (confirm("Aucune série validée. Abandonner cette séance ?")) { update(st => st.current = null); clearInterval(restT); document.querySelector(".rest")?.remove(); go("home"); } return; }
  if (!confirm("Terminer la séance et enregistrer tes séries ?")) return;
  clearInterval(restT); clearInterval(clockT); document.querySelector(".rest")?.remove();
  const w = E.finishSession(cur);
  sessionStorage.setItem("cxs.last", String(w.id));
  go("done");
}
routes.done = () => {
  const w = S().workouts[S().workouts.length - 1]; if (!w) return go("home");
  const mins = Math.round((new Date(w.end) - new Date(w.start)) / 6e4);
  $app.innerHTML = `<section class="screen full" style="text-align:center">
    <svg class="big-x mt32" viewBox="0 0 40 40"><path class="s1" d="M9 31 31 9" stroke="var(--or)" stroke-width="5" stroke-linecap="round" fill="none"/><path class="s2" d="M9 9l22 22" stroke="var(--ivoire)" stroke-width="5" stroke-linecap="round" fill="none"/></svg>
    <h1 class="h-xl mt24">Séance terminée.</h1><p class="dim mt8">${esc(w.title)}</p>
    <div class="stat3 mt24"><div><b>${mins}</b><span>minutes</span></div><div><b>${w.setsDone}</b><span>séries</span></div><div><b>${(w.volume / 1000).toFixed(1).replace(".", ",")}</b><span>tonnes</span></div></div>
    ${w.records.length ? `<div class="card mt16" style="text-align:left"><div class="h3 gold">Nouveau${w.records.length > 1 ? "x" : ""} record${w.records.length > 1 ? "s" : ""}</div>${w.records.map(r => `<div class="row between small mt8"><span>${esc(r.name)}</span><span class="num">${Math.round(r.after)} kg <span class="dim" style="font-weight:400">1RM estimé</span></span></div>`).join("")}</div>` : ""}
    <p class="small dim mt16">Tes charges de la prochaine séance sont recalculées à partir de ce que tu viens de faire.</p>
    ${wordOn("fin") ? `<div class="card mt24" style="text-align:left">${wordCard(verseFor("fin", w.id % 1000))}</div>` : ""}
  </section><div class="dock"><button class="btn btn-gold" data-a="go" data-r="home">Retour à l'accueil</button></div>`;
};

// =====================================================================
// CARBURANT
// =====================================================================
let foodTab = "journal";
routes.food = async () => {
  await N.loadModels();
  const t = N.targets(), tot = N.dayTotals(), log = N.dayLog();
  const gauge = (l, a, b, u, gold) => `<div><div class="row between"><span class="small">${l}</span><span class="small"><b class="num">${Math.round(a)}</b><span class="dim"> / ${b}${u}</span></span></div><div class="gauge ${gold ? "g" : ""} ${a > b * 1.08 ? "over" : ""} mt8"><i style="width:${Math.min(100, a / b * 100)}%"></i></div></div>`;
  let body = "";
  if (foodTab === "journal") {
    body = N.MEALS.map(m => {
      const es = log.filter(e => e.meal === m), k = es.reduce((a, e) => a + e.kcal, 0);
      return `<div class="card tight mt16"><div class="row between"><span class="h3">${m}</span><span class="small dim">${k} kcal</span></div>
        ${es.map(e => `<div class="row between small" style="padding:9px 0;border-top:1px solid var(--fer);margin-top:8px"><span class="grow">${esc(e.label)}<br><span class="xs dim">${e.g ? e.g + " g · " : ""}${Math.round(e.p)} g prot.</span></span><span class="num">${e.kcal}</span><button class="icon-btn" style="width:32px;height:32px;margin-left:8px" data-a="del-food" data-id="${e.id}" aria-label="Supprimer">${I.close}</button></div>`).join("")}
        <div class="row mt8" style="gap:8px"><button class="btn btn-ghost btn-sm grow" data-a="add-food" data-m="${m}">${I.plus.replace("<svg", '<svg width="18"')} Ajouter</button>${es.length ? `<button class="btn btn-ghost btn-sm" data-a="save-dish" data-m="${m}">Enregistrer ce repas</button>` : ""}</div></div>`;
    }).join("");
  } else {
    const plan = N.dayPlan(t);
    body = `<p class="small dim mt16">Ton plan du jour, calculé sur ta cible. Les quantités sont pesées cuites.</p>` + plan.map(d => `<div class="card mt16"><div class="row between"><span class="small dim">${d.meal}</span><span class="small dim">${d.m.kcal} kcal · ${d.m.p} g prot.</span></div>
      <div class="h3 mt8">${esc(d.n)}</div><ul class="small" style="padding-left:18px;margin:10px 0 14px">${d.lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul>
      <div class="row" style="gap:8px"><button class="btn btn-ghost btn-sm grow" data-a="eat-plan" data-meal="${d.meal}">Je l'ai mangé</button>${d.poolSize > 1 ? `<button class="btn btn-ghost btn-sm" data-a="swap-dish" data-meal="${d.meal}">Changer</button>` : ""}</div></div>`).join("");
  }
  $app.innerHTML = `<section class="screen">
    <h1 class="h-display">Carburant</h1><p class="dim mt8">${fmtDate(new Date())}</p>
    <div class="card mt24"><div class="row between"><span class="num" style="font-size:34px">${Math.max(0, t.kcal - tot.kcal)}</span><span class="small dim">kcal restantes sur ${t.kcal}</span></div>
      <div class="stack mt16">${gauge("Protéines", tot.p, t.prot, " g", true)}${gauge("Glucides", tot.c, t.carbs, " g")}${gauge("Lipides", tot.f, t.fat, " g")}</div></div>
    <div class="seg mt16"><button data-a="food-tab" data-v="journal" class="${foodTab === "journal" ? "on" : ""}">Journal</button><button data-a="food-tab" data-v="plan" class="${foodTab === "plan" ? "on" : ""}">Mon plan</button></div>
    ${body}
    ${wordOn("repas") ? `<div class="mt24">${wordCard(verseFor("repas"), "small")}</div>` : ""}
    <p class="xs dim mt24">Valeurs nutritionnelles : table Ciqual de l'ANSES et Open Food Facts. ${esc(t.model.name)} : ${esc(t.model.why || "")}</p>
  </section>${tabbar("food")}`;
};
async function addFoodSheet(meal) {
  sheet(`<h2 class="h1">${esc(meal)}</h2>
    <div class="search mt16">${I.search}<input id="fq" placeholder="Rechercher un aliment" autocomplete="off" enterkeyhint="search"></div>
    ${"BarcodeDetector" in window ? `<button class="btn btn-ghost btn-sm mt8" data-a="scan" data-m="${esc(meal)}" style="width:100%">${I.scan.replace("<svg", '<svg width="20"')} Scanner un code-barres</button>` : ""}
    <div id="fr" class="mt16"></div>`, async (w) => {
    const box = w.querySelector("#fr"), inp = w.querySelector("#fq");
    const idle = () => {
      const rec = S().recentFoods, dishes = S().dishes;
      box.innerHTML = (dishes.length ? `<h3 class="label" style="margin-top:4px">Mes plats</h3><div class="list">${dishes.map((d, i) => `<button class="li" data-a="eat-dish" data-i="${i}" data-m="${esc(meal)}"><span class="grow">${esc(d.n)}<br><span class="xs dim">${d.kcal} kcal · ${Math.round(d.p)} g prot.</span></span>${I.plus.replace("<svg", '<svg width="20"')}</button>`).join("")}</div>` : "")
        + (rec.length ? `<h3 class="label">Récents</h3><div class="list">${rec.map((f, i) => `<button class="li" data-a="pick-food" data-src="recent" data-i="${i}" data-m="${esc(meal)}"><span class="grow">${esc(f.n)}<br><span class="xs dim">${f.kcal} kcal / 100 g</span></span>${I.chev}</button>`).join("")}</div>` : `<p class="empty small">Tape le nom d'un aliment : « riz », « poulet », « skyr »…</p>`);
    };
    idle(); await N.loadCiqual();
    let deb;
    inp.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(() => {
      const q = inp.value.trim(); if (!q) return idle();
      const r = N.searchFoods(q); window.__fr = r;
      box.innerHTML = r.length ? `<div class="list">${r.map((f, i) => `<button class="li" data-a="pick-food" data-src="search" data-i="${i}" data-m="${esc(meal)}"><span class="grow">${esc(f.n)}<br><span class="xs dim">${f.kcal} kcal · ${String(f.p).replace(".", ",")} g prot. / 100 g</span></span>${I.chev}</button>`).join("")}</div>` : `<p class="empty small">Aucun aliment trouvé pour « ${esc(q)} ». Essaie un mot plus simple.</p>`;
    }, 140); });
  });
}
function gramsSheet(food, meal) {
  let g = 100;
  const draw = (w) => {
    const e = N.entryFromFood(food, g, meal);
    w.querySelector("#gv").innerHTML = `<span class="num" style="font-size:34px">${e.kcal}</span><span class="small dim"> kcal · ${Math.round(e.p)} g prot. · ${Math.round(e.c)} g gluc. · ${Math.round(e.f)} g lip.</span>`;
  };
  sheet(`<h2 class="h2">${esc(food.n)}</h2><div id="gv" class="mt16"></div>
    <label class="field mt16"><span>Quantité (g ou ml)</span><input id="gq" inputmode="decimal" value="100"></label>
    <div class="chips mt16">${[30, 50, 100, 150, 200, 250, 300].map(x => `<button class="chip ${x === 100 ? "on" : ""}" data-g="${x}">${x} g</button>`).join("")}</div>
    <button class="btn btn-gold mt24" id="gadd">Ajouter à ${esc(meal.toLowerCase())}</button>`, (w) => {
    draw(w);
    const inp = w.querySelector("#gq");
    inp.addEventListener("input", () => { g = parseFloat(inp.value.replace(",", ".")) || 0; w.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", +c.dataset.g === g)); draw(w); });
    w.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => { g = +c.dataset.g; inp.value = g; w.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === c)); draw(w); }));
    w.querySelector("#gadd").addEventListener("click", () => { if (!g) return; N.addEntry(N.entryFromFood(food, g, meal)); N.rememberFood(food); buzz(); closeSheet(); toast("Ajouté"); routes.food(); });
  });
}
async function scanFlow(meal) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    sheet(`<h2 class="h2">Scanner</h2><video id="cam" playsinline autoplay muted style="width:100%;border-radius:16px;margin-top:14px;background:#000"></video><p class="small dim mt8">Place le code-barres dans le cadre.</p>`, async (w) => {
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
// PROGRÈS
// =====================================================================
let progTab = "force", liftSel = null;
routes.progress = async () => {
  let body = "";
  if (progTab === "force") {
    const lifts = Object.entries(S().lifts).filter(([, h]) => h.length).sort((a, b) => b[1].length - a[1].length);
    if (!liftSel || !S().lifts[liftSel]) liftSel = lifts[0]?.[0];
    const h = liftSel ? S().lifts[liftSel] : [];
    const wk = E.activeWeeks(8), mx = Math.max(1, ...wk.map(w => w.count));
    const recs = lifts.map(([n, h]) => [n, Math.max(...h.map(x => x.e1rm))]).sort((a, b) => b[1] - a[1]).slice(0, 8);
    body = lifts.length ? `<div class="card mt16"><div class="h3">Force estimée (1RM)</div>
        <div class="chips mt16">${lifts.slice(0, 8).map(([n]) => `<button class="chip ${n === liftSel ? "on" : ""}" data-a="lift" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div>
        <div class="mt16">${lineChart(h.map(x => ({ y: x.e1rm, l: x.d.slice(8, 10) + "/" + x.d.slice(5, 7) })))}</div></div>`
      : `<div class="card mt16"><p class="empty" style="padding:8px">Tes courbes de force apparaissent après ta première séance.</p><button class="btn btn-gold" data-a="start">Commencer la séance</button></div>`;
    body += `<div class="card mt16"><div class="row between"><span class="h3">Régularité</span><span class="small dim">8 dernières semaines</span></div>
      <svg class="chart mt16" viewBox="0 0 340 110" role="img" aria-label="Séances par semaine">${wk.map((w, i) => { const bh = w.count / mx * 70; return `<rect x="${i * 42 + 6}" y="${84 - bh}" width="30" height="${Math.max(2, bh)}" rx="6" fill="${i === wk.length - 1 ? "var(--or)" : "var(--ivoire)"}" opacity="${w.count ? 1 : .2}"/><text x="${i * 42 + 21}" y="104" font-size="11" text-anchor="middle" fill="var(--pierre)">${w.count}</text>`; }).join("")}</svg></div>`;
    if (recs.length) body += `<h2 class="label">Records</h2><div class="list">${recs.map(([n, v]) => `<div class="li"><span class="grow small">${esc(n)}</span><span class="num">${Math.round(v)} kg</span></div>`).join("")}</div>`;
    const ws = S().workouts.slice(-8).reverse();
    if (ws.length) body += `<h2 class="label">Dernières séances</h2><div class="list">${ws.map(w => `<div class="li"><span class="grow small">${esc(w.title)}<br><span class="xs dim">${new Date(w.end).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${w.setsDone} séries</span></span><span class="small dim">${Math.round((new Date(w.end) - new Date(w.start)) / 6e4)} min</span></div>`).join("")}</div>`;
  } else {
    const ms = S().measures, ws = ms.filter(m => m.weight);
    const avg = ws.map((m, i) => { const win = ws.slice(Math.max(0, i - 6), i + 1); return { y: win.reduce((a, b) => a + b.weight, 0) / win.length, l: m.d.slice(8, 10) + "/" + m.d.slice(5, 7) }; });
    const lastT = [...ms].reverse().find(m => m.waist);
    const photos = await listPhotos();
    body = `<div class="card mt16"><div class="row between"><span class="h3">Poids</span><span class="small dim">moyenne sur 7 jours</span></div>
        ${avg.length ? `<div class="num mt8" style="font-size:32px">${avg[avg.length - 1].y.toFixed(1).replace(".", ",")} kg</div>` : ""}
        <div class="mt8">${lineChart(avg)}</div>
        <form class="row mt16" data-f="weight" style="gap:8px"><label class="field grow"><span>Pesée du jour (kg)</span><input name="w" inputmode="decimal" required></label><button class="btn btn-gold btn-sm">Enregistrer</button></form>
        <p class="xs dim mt8">Pèse-toi le matin, à jeun. La moyenne compte, pas la pesée du jour.</p></div>
      <div class="card mt16"><div class="h3">Mensurations (cm)</div>
        <form data-f="measures" class="mt16"><div class="grid2">${[["waist", "Tour de taille"], ["hips", "Hanches"], ["chest", "Poitrine"], ["arm", "Bras"], ["thigh", "Cuisse"]].map(([k, l]) => `<label class="field"><span>${l}</span><input name="${k}" inputmode="decimal" placeholder="${lastT?.[k] ?? ""}"></label>`).join("")}</div><button class="btn btn-ghost btn-sm mt16" style="width:100%">Enregistrer les mensurations</button></form>
        ${lastT ? `<p class="xs dim mt8">Dernière prise le ${new Date(lastT.d).toLocaleDateString("fr-FR")} : taille ${lastT.waist} cm.</p>` : ""}</div>
      <div class="card mt16"><div class="row between"><span class="h3">Photos</span><label class="btn-text" style="cursor:pointer">Ajouter<input type="file" accept="image/*" capture="environment" data-f="photo" hidden></label></div>
        <p class="xs dim">Elles restent sur ce téléphone, personne d'autre ne les voit.</p>
        ${photos.length ? `<div class="photo-grid mt16">${photos.map(p => `<button data-a="photo" data-id="${p.id}"><img alt="Photo du ${p.d}" src="${URL.createObjectURL(p.blob)}"></button>`).join("")}</div>` : `<p class="empty small">Une photo par mois, même lumière, même tenue : c'est le meilleur miroir de ta progression.</p>`}</div>
      ${wordOn("dur") ? `<div class="card mt16"><div class="small dim" style="margin-bottom:10px">Déclaration du jour</div>${wordCard(declarationOfDay())}</div>` : ""}`;
  }
  $app.innerHTML = `<section class="screen"><h1 class="h-display">Progrès</h1>
    <div class="seg mt24"><button data-a="prog-tab" data-v="force" class="${progTab === "force" ? "on" : ""}">Force</button><button data-a="prog-tab" data-v="corps" class="${progTab === "corps" ? "on" : ""}">Corps</button></div>
    ${body}</section>${tabbar("progress")}`;
};

// =====================================================================
// COACH & CANDIDATURE
// =====================================================================
routes.coach = () => {
  const app = S().application;
  $app.innerHTML = `<section class="screen">
    <h1 class="h-display">Coaching privé</h1>
    <div class="card-hero mt24"><div class="row" style="gap:14px"><div style="width:56px;height:56px;border-radius:50%;background:var(--ardoise);display:grid;place-items:center">${I.x(30)}</div><div><div class="h2">${esc(CONFIG.coachName)}</div><div class="small dim">${esc(CONFIG.coachTitle)}</div></div></div>
      <p class="mt16">${esc(CONFIG.offer)}</p>
      <ul class="small" style="padding-left:18px;margin:10px 0 18px"><li>Un programme écrit pour toi, ajusté chaque semaine</li><li>Un plan alimentaire fait de vrais plats</li><li>Un bilan hebdomadaire et des appels avec moi</li><li>Corps, âme et esprit : on avance sur tout</li></ul>
      ${app ? `<p class="small gold">Candidature envoyée le ${new Date(app.at).toLocaleDateString("fr-FR")}.</p>${CONFIG.calendly ? `<a class="btn btn-gold" href="${calendlyUrl(app)}" target="_blank" rel="noopener">Réserver mon appel</a>` : ""}` : `<button class="btn btn-gold" data-a="apply">Candidater</button>`}
      <p class="xs dim mt16">${esc(CONFIG.founderNote)} Je lis chaque candidature moi-même.</p></div>
    <h2 class="label">Comment ça se passe</h2>
    <div class="list">${[["Tu candidates", "6 questions, 2 minutes."], ["On s'appelle 15 minutes", "Pour voir si je peux vraiment t'aider."], ["On démarre", "Programme, nutrition et suivi dès la semaine suivante."]].map(([a, b], i) => `<div class="li"><span class="tag g">${i + 1}</span><span class="grow"><b>${a}</b><br><span class="small dim">${b}</span></span></div>`).join("")}</div>
  </section>${tabbar("coach")}`;
};
const AP = { i: 0, a: {} };
const AQ = [
  { id: "goal", q: "Ton objectif précis dans 12 semaines ?", type: "text", ph: "Ex. perdre 6 kg et tenir 3 séances par semaine" },
  { id: "obstacle", q: "Qu'est-ce qui t'a fait abandonner les fois précédentes ?", type: "text", ph: "Sois honnête, c'est entre nous" },
  { id: "time", q: "Combien d'heures par semaine peux-tu vraiment bloquer ?", opts: [["lt2", "Moins de 2 h"], ["2-3", "2 à 3 h"], ["3-5", "3 à 5 h"], ["5+", "Plus de 5 h"]] },
  { id: "urgency", q: "De 1 à 10, à quel point c'est important pour toi maintenant ?", opts: [[10, "10 · c'est ma priorité"], [8, "8"], [6, "6"], [4, "4 ou moins"]] },
  { id: "budget", q: "Si on travaille ensemble, quel investissement mensuel est envisageable ?", opts: [["lt100", "Moins de 100 €"], ["100-200", "100 à 200 €"], ["200-400", "200 à 400 €"], ["400+", "Plus de 400 €"]] },
  { id: "contact", q: "Pour te recontacter", type: "contact" },
];
routes.apply = () => {
  const s = AQ[AP.i];
  if (!s) return applyDone();
  let body;
  if (s.type === "text") body = `<form class="choices" data-f="ap-text" style="align-items:stretch"><label class="field"><span>${esc(s.ph)}</span><textarea name="v" required maxlength="400">${esc(AP.a[s.id] || "")}</textarea></label><button class="btn btn-gold">Continuer</button></form>`;
  else if (s.type === "contact") body = `<form class="choices" data-f="ap-contact" style="align-items:stretch"><label class="field"><span>Prénom</span><input name="name" required value="${esc(S().profile?.name || "")}"></label><label class="field"><span>E-mail</span><input name="email" type="email" required autocomplete="email"></label><label class="field"><span>Téléphone (facultatif)</span><input name="phone" type="tel" autocomplete="tel"></label><button class="btn btn-gold">Envoyer ma candidature</button></form>`;
  else body = `<div class="choices">${s.opts.map(([v, l]) => `<button class="choice" data-a="ap-pick" data-v='${JSON.stringify(v)}'>${l}</button>`).join("")}</div>`;
  $app.innerHTML = `<section class="convo"><div class="convo-top"><button class="icon-btn" data-a="ap-back" aria-label="Retour">${I.back}</button><div class="progress"><i style="width:${AP.i / AQ.length * 100}%"></i></div><span style="width:44px"></span></div>
    <div class="coach-mark">${I.x(44)}</div><h1 class="q">${esc(s.q)}</h1>${body}</section>`;
};
function scoreApp(a) {
  return ({ lt100: 0, "100-200": 15, "200-400": 35, "400+": 45 }[a.budget] || 0) + (a.urgency || 0) * 3 + ({ lt2: 0, "2-3": 15, "3-5": 25, "5+": 25 }[a.time] || 0);
}
function calendlyUrl(a) {
  const u = new URL(CONFIG.calendly);
  u.searchParams.set("name", a.name || ""); u.searchParams.set("email", a.email || "");
  u.searchParams.set("a1", `Objectif : ${a.goal}\nFrein : ${a.obstacle}\nTemps : ${a.time} · Urgence : ${a.urgency}/10 · Budget : ${a.budget} · Score : ${a.score}`);
  return u.toString();
}
function applyDone() {
  const a = { ...AP.a, at: new Date().toISOString() }; a.score = scoreApp(a);
  update(st => st.application = a);
  const ok = a.score >= 60;
  const mail = CONFIG.email ? `mailto:${CONFIG.email}?subject=${encodeURIComponent("Candidature coaching · " + a.name)}&body=${encodeURIComponent(`Objectif : ${a.goal}\nCe qui m'a fait abandonner : ${a.obstacle}\nTemps : ${a.time}\nUrgence : ${a.urgency}/10\nBudget : ${a.budget}\nTéléphone : ${a.phone || "-"}`)}` : null;
  $app.innerHTML = `<section class="convo" style="justify-content:center">
    <div class="coach-mark">${I.x(44)}</div>
    <h1 class="q">Merci ${esc(a.name)}. ${ok ? "Ton profil correspond à ce que je fais de mieux." : "J'ai bien reçu ta candidature."}</h1>
    <p class="q-sub">${ok ? "Réserve ton appel de 15 minutes : tes réponses me seront transmises avec la réservation." : "Je lis chaque candidature. En attendant, ton plan dans l'app est le meilleur point de départ : tiens-le 4 semaines et on en reparle."}</p>
    <div class="stack mt32">${CONFIG.calendly ? `<a class="btn ${ok ? "btn-gold" : "btn-ghost"}" href="${calendlyUrl(a)}" target="_blank" rel="noopener">Réserver mon appel</a>` : ""}
    ${mail ? `<a class="btn btn-ghost" href="${mail}">Envoyer aussi par e-mail</a>` : ""}
    <button class="btn ${ok ? "btn-ghost" : "btn-gold"}" data-a="go" data-r="home">Retour à mon plan</button></div></section>`;
  AP.i = 0; AP.a = {};
}

// =====================================================================
// PROFIL & POURQUOI LE X
// =====================================================================
routes.profile = () => {
  const p = S().profile, t = N.targets(), w = S().settings.word;
  $app.innerHTML = `<section class="screen">
    <div class="row"><button class="icon-btn" data-a="go" data-r="home" aria-label="Retour">${I.back}</button></div>
    <h1 class="h-display mt16">${esc(p.name)}</h1>
    <p class="dim mt8">${p.age} ans · ${p.height} cm · ${E.fmtKg(p.weight)} kg</p>
    <h2 class="label">La Parole dans l'app</h2>
    <div class="seg">${[["daily", "Chaque jour"], ["discreet", "Accueil seul"], ["off", "Pause"]].map(([v, l]) => `<button data-a="word" data-v="${v}" class="${w === v ? "on" : ""}">${l}</button>`).join("")}</div>
    <h2 class="label">Réglages</h2>
    <div class="list">
      <button class="li" data-a="go" data-r="x"><span class="grow">Pourquoi le X ?</span>${I.chev}</button>
      <button class="li" data-a="programs"><span class="grow">Programme<br><span class="xs dim">${esc(E.program(S().plan.programId)?.name || "")}</span></span>${I.chev}</button>
      <button class="li" data-a="edit-body"><span class="grow">Mes infos et mon carburant<br><span class="xs dim">${t ? `${t.kcal} kcal · ${esc(t.model.name)}` : ""}</span></span>${I.chev}</button>
      <div class="li"><span class="grow">Vibrations</span><button class="switch ${S().settings.haptics ? "on" : ""}" data-a="haptics" aria-label="Vibrations"></button></div>
    </div>
    <h2 class="label">Mes données</h2>
    <p class="small dim">Tout est stocké sur ce téléphone. Télécharge une sauvegarde chaque mois, ou avant de changer de téléphone.</p>
    <div class="list"><button class="li" data-a="export"><span class="grow">Télécharger ma sauvegarde</span>${I.chev}</button>
      <label class="li" style="cursor:pointer"><span class="grow">Restaurer une sauvegarde</span>${I.chev}<input type="file" accept="application/json" data-f="import" hidden></label>
      <button class="li" data-a="reset"><span class="grow" style="color:var(--grenat)">Tout effacer et recommencer</span></button></div>
    <p class="xs dim mt24">Cal X Sthenos · version 1.0 · ${esc(CONFIG.coachName)}. Les conseils de l'app ne remplacent pas un avis médical : en cas de douleur ou de problème de santé, consulte un médecin avant de t'entraîner.</p>
  </section>`;
};
routes.x = () => {
  $app.innerHTML = `<section class="screen full">
    <div class="row"><button class="icon-btn" data-a="back" aria-label="Retour">${I.back}</button></div>
    <div class="mt32">${logo(26)}</div>
    <h1 class="h-xl mt32">Pourquoi le X ?</h1>
    <p class="mt24" style="font-size:17px"><i>Kalos</i>, en grec, c'est le beau, le noble. <i>Sthenos</i>, c'est la force. Ensemble, ils ont donné la calisthénie : l'art de bâtir un corps fort et noble.</p>
    <p style="font-size:17px">« Cal », ce sont aussi les calories : ce qui te nourrit. « Sthenos », ce qui te rend fort. Au centre, le X. C'est la lettre grecque Chi, la première du nom du Christ.</p>
    <p style="font-size:17px">Nous croyons que le corps compte, qu'il mérite d'être servi avec exigence. Et qu'il n'est pas tout.</p>
    <div class="card mt24">${wordCard({ ref: "1 Timothée 4:8", t: "L'exercice corporel est utile à peu de chose, tandis que la piété est utile à tout, ayant la promesse de la vie présente et de celle qui est à venir." })}</div>
    <p class="mt24" style="font-size:17px">La force que tu construis ici est réelle. Celle que Dieu offre l'est davantage, et elle ne se gagne pas : elle se reçoit.</p>
    <div class="card mt16">${wordCard({ ref: "Jean 3:16", t: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle." })}</div>
    <p class="mt24 dim">Si tu veux en parler, écris-moi. Sans pression, sans jugement.</p>
    ${CONFIG.instagram ? `<a class="btn btn-ghost mt16" href="${CONFIG.instagram}" target="_blank" rel="noopener">M'écrire sur Instagram</a>` : CONFIG.email ? `<a class="btn btn-ghost mt16" href="mailto:${CONFIG.email}">M'écrire</a>` : ""}
  </section>`;
};
function editBodySheet() {
  const p = S().profile;
  sheet(`<h2 class="h1">Mes infos</h2><form data-f="edit-body" class="stack mt16">
    <div class="grid2"><label class="field"><span>Poids (kg)</span><input name="weight" inputmode="decimal" value="${p.weight}"></label><label class="field"><span>Âge</span><input name="age" inputmode="numeric" value="${p.age}"></label></div>
    <label class="field"><span>Objectif</span><select name="goal">${STEPS[1].opts.map(([v, l]) => `<option value="${v}" ${p.goal === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="field"><span>Activité</span><select name="activity">${STEPS[9].opts.map(([v, l]) => `<option value="${v}" ${p.activity === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="field"><span>Alimentation</span><select name="diet">${STEPS[10].opts.map(([v, l]) => `<option value="${v}" ${p.diet === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <button class="btn btn-gold">Enregistrer</button></form>`);
}

// =====================================================================
// ÉVÉNEMENTS
// =====================================================================
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a, d = b.dataset;
  const cur = S().current;
  switch (a) {
    case "go": closeSheet(); go(d.r); break;
    case "back": history.length > 1 ? history.back() : go("home"); break;
    case "ob-start": OB.i = 0; OB.echo = null; routes.onboarding(); break;
    case "ob-back": if (OB.i <= 0) { OB.i = -1; } else { OB.i--; OB.echo = null; } routes.onboarding(); break;
    case "ob-pick": { const v = JSON.parse(d.v); obNext(v, b.firstChild.textContent.trim()); break; }
    case "ob-skip": obNext({}, "Je passe"); break;
    case "ob-sex": OB.a.sex = d.v; b.parentElement.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); break;
    case "start": {
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
      if (s.done) { const last = ex.sets.every(x => x.done); startRest(last ? Math.max(60, ex.rest) : ex.rest); }
      break;
    }
    case "rpe": { const s = cur.exercises[+d.x].sets[+d.s]; s.rpe = +d.v; s.rpeSet = true; save(); const y = window.scrollY; routes.workout(); window.scrollTo(0, y); break; }
    case "rest-add": restEnd += 30000; restTotal += 30; break;
    case "rest-skip": restEnd = 0; clearInterval(restT); document.querySelector(".rest")?.remove(); break;
    case "ex-menu": await E.loadFiches(); exMenu(+d.x); break;
    case "add-set": { const ex = cur.exercises[+d.x], l = ex.sets[ex.sets.length - 1]; ex.sets.push({ ...l, done: false, rpe: null }); save(); closeSheet(); routes.workout(); break; }
    case "swap": {
      const ex = cur.exercises[+d.x], n = d.n;
      update(st => { if (n === ex.orig) delete st.swaps[ex.orig]; else st.swaps[ex.orig] = n; });
      const fresh = E.buildSession().exercises[+d.x];
      ex.name = fresh.name; ex.unit = fresh.unit; ex.bw = fresh.bw; ex.step = fresh.step;
      ex.sets = fresh.sets; save(); closeSheet(); routes.workout(); toast("Exercice remplacé, charges recalculées"); break;
    }
    case "finish": finishFlow(); break;
    case "programs": await E.loadPrograms(); programsSheet(); break;
    case "set-program": {
      if (cur) return toast("Termine d'abord ta séance en cours.");
      update(st => st.plan = { programId: d.id, startedAt: today(), week: 1, idx: 0, cycle: 1 });
      closeSheet(); toast("Programme changé"); render(); break;
    }
    case "food-tab": foodTab = d.v; routes.food(); break;
    case "add-food": addFoodSheet(d.m); break;
    case "pick-food": { const f = d.src === "recent" ? S().recentFoods[+d.i] : window.__fr[+d.i]; gramsSheet(f, d.m); break; }
    case "del-food": N.removeEntry(+d.id); routes.food(); break;
    case "scan": scanFlow(d.m); break;
    case "eat-plan": {
      const t = N.targets(), dish = N.dayPlan(t).find(x => x.meal === d.meal);
      N.addEntry({ meal: d.meal, label: dish.n, g: null, kcal: dish.m.kcal, p: dish.m.p, c: dish.m.c, f: dish.m.f }); buzz(); toast(`${d.meal} enregistré`); routes.food(); break;
    }
    case "swap-dish": N.swapDish(d.meal); routes.food(); break;
    case "save-dish": {
      const es = N.dayLog().filter(x => x.meal === d.m); const n = prompt("Nom du plat", es.map(x => x.label.split(",")[0]).slice(0, 2).join(" + "));
      if (!n) break;
      const tot = es.reduce((a, x) => ({ kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 });
      update(st => st.dishes.unshift({ n, ...tot })); toast("Plat enregistré"); break;
    }
    case "eat-dish": { const di = S().dishes[+d.i]; N.addEntry({ meal: d.m, label: di.n, g: null, kcal: di.kcal, p: di.p, c: di.c, f: di.f }); closeSheet(); toast("Ajouté"); routes.food(); break; }
    case "prog-tab": progTab = d.v; routes.progress(); break;
    case "lift": liftSel = d.n; routes.progress(); break;
    case "photo": if (confirm("Supprimer cette photo ?")) { await deletePhoto(+d.id); routes.progress(); } break;
    case "apply": AP.i = 0; AP.a = {}; go("apply"); break;
    case "ap-back": if (AP.i === 0) go("coach"); else { AP.i--; routes.apply(); } break;
    case "ap-pick": AP.a[AQ[AP.i].id] = JSON.parse(d.v); AP.i++; buzz(); routes.apply(); break;
    case "word": update(st => st.settings.word = d.v); routes.profile(); break;
    case "haptics": update(st => st.settings.haptics = !st.settings.haptics); routes.profile(); break;
    case "edit-body": await N.loadModels(); editBodySheet(); break;
    case "export": {
      const blob = new Blob([exportJSON()], { type: "application/json" }), u = URL.createObjectURL(blob);
      const l = document.createElement("a"); l.href = u; l.download = `calxsthenos-sauvegarde-${today()}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(u), 3000); break;
    }
    case "reset": if (confirm("Effacer toutes tes données de ce téléphone ? Cette action est définitive.")) { resetAll(); OB.i = -1; go("onboarding"); render(); } break;
  }
});

document.addEventListener("input", (e) => { if (e.target.matches("[data-in]")) setInput(e.target); });

document.addEventListener("submit", (e) => {
  const f = e.target.closest("form[data-f]"); if (!f) return; e.preventDefault();
  const v = Object.fromEntries(new FormData(f)); const num = (x) => parseFloat(String(x || "").replace(",", "."));
  switch (f.dataset.f) {
    case "ob-text": if (v.v.trim()) obNext(v.v.trim(), v.v.trim()); break;
    case "ob-records": {
      const rec = {}; LIFTS_ASK(OB.a).forEach(([k]) => { const r = num(v[k + "-r"]), kg = num(v[k + "-k"]); if (r > 0 && kg > 0) rec[k] = { r, k: kg }; });
      obNext(rec, Object.keys(rec).length ? `${Object.keys(rec).length} record${Object.keys(rec).length > 1 ? "s" : ""} enregistré${Object.keys(rec).length > 1 ? "s" : ""}` : "Je passe"); break;
    }
    case "ob-body": {
      const age = num(v.age), height = num(v.height), weight = num(v.weight);
      if (!(age > 12 && age < 100 && height > 120 && height < 230 && weight > 30 && weight < 250)) return toast("Vérifie ton âge, ta taille et ton poids.");
      Object.assign(OB.a, { age, height, weight, sex: OB.a.sex || "m" }); obNext({ age, height, weight }, `${age} ans · ${height} cm · ${E.fmtKg(weight)} kg`); break;
    }
    case "ap-text": AP.a[AQ[AP.i].id] = v.v.trim(); AP.i++; routes.apply(); break;
    case "ap-contact": Object.assign(AP.a, { name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim() }); AP.i++; routes.apply(); break;
    case "weight": { const w = num(v.w); if (!(w > 30 && w < 250)) return toast("Poids invalide"); update(st => { st.measures.push({ d: today(), weight: w }); st.profile.weight = w; }); toast("Pesée enregistrée"); routes.progress(); break; }
    case "measures": { const m = { d: today() }; let any = false; ["waist", "hips", "chest", "arm", "thigh"].forEach(k => { const x = num(v[k]); if (x > 0) { m[k] = x; any = true; } }); if (!any) return; update(st => st.measures.push(m)); toast("Mensurations enregistrées"); routes.progress(); break; }
    case "edit-body": update(st => { const p = st.profile; p.weight = num(v.weight) || p.weight; p.age = num(v.age) || p.age; p.goal = v.goal; p.activity = v.activity; p.diet = v.diet; p.nutritionModel = N.pickModel(p); }); closeSheet(); toast("Infos mises à jour"); routes.profile(); break;
  }
});

document.addEventListener("change", async (e) => {
  const f = e.target;
  if (f.matches('[data-f="import"]') && f.files[0]) {
    try { importJSON(await f.files[0].text()); toast("Sauvegarde restaurée"); go("home"); render(); }
    catch (err) { toast(err.message || "Fichier illisible"); }
  }
  if (f.matches('[data-f="photo"]') && f.files[0]) { await addPhoto(f.files[0]); toast("Photo ajoutée"); routes.progress(); }
});

window.addEventListener("hashchange", render);

// Démarrage
(async () => {
  await Promise.all([E.loadPrograms(), N.loadModels()]).catch(() => { });
  render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => { });
})();
