// Profil, réglages, sauvegarde, connaissances, « Pourquoi le X ? », confidentialité.
import { S, update, resetAll, exportJSON, importJSON, today } from "../store.js";
import * as E from "../engine.js";
import * as N from "../nutrition.js";
import * as W from "../word.js";
import { CONFIG, offer } from "../config.js";
import { $app, esc, num, fr, toast, routes, R, actions, forms, changes, go, I, logo, markImg, header, tabbar, seg, sheet, closeSheet, lockVeil, premium, rank, expert, render, rerender } from "../core.js";
import { syncProfile } from "../sync.js";
import { ONB_STEPS, resetOnboarding } from "./onboarding.js";

routes.profile = async () => {
  await N.loadModels();
  const p = S().profile, t = N.targets(), w = S().settings.word;
  $app.innerHTML = header(esc(p.name), `${p.age} ans · ${p.height} cm · ${E.fmtKg(p.weight)} kg`, { back: "home" }) + `<main class="page">
    <div class="card"><div class="lbl">Ta formule</div><div class="row between mt4"><span class="h2">${esc(offer(S().me?.tier || "free").name)}</span><button class="link" data-a="go" data-r="offers">Changer</button></div>${p.email ? `<p class="xs muted mt4" style="margin:0">${esc(p.email)}</p>` : ""}</div>
    <h2 class="sec">✝ La Parole dans l'app</h2>
    ${seg([["daily", "Chaque jour"], ["discreet", "Accueil seul"], ["off", "Pause"]], w, "word-set")}
    <p class="xs muted mt8">La Bible reste toujours accessible dans l'onglet Parole.</p>
    <h2 class="sec">⚙️ Réglages</h2>
    <div class="list">
      <button class="li" data-a="edit-body"><span class="em">🔥</span><span class="grow">Mes infos et mon carburant<br><span class="xs muted">${t ? `${fr(t.kcal)} kcal · ${esc(t.model.name)}` : ""}</span></span>${I.chev}</button>
      <button class="li" data-a="go" data-r="simu"><span class="em">🏆</span><span class="grow">Mes records (1RM)</span>${I.chev}</button>
      <button class="li" data-a="go" data-r="kb"><span class="em">📚</span><span class="grow">Connaissances</span>${I.chev}</button>
      <div class="li"><span class="em">📊</span><span class="grow">Afficher les % et l'e1RM dans le carnet</span><button class="switch ${S().settings.adv ?? p.level === "advanced" ? "on" : ""}" data-a="adv-toggle" aria-label="Mode avancé"></button></div>
      <div class="li"><span class="em">📳</span><span class="grow">Vibrations</span><button class="switch ${S().settings.haptics ? "on" : ""}" data-a="haptics" aria-label="Vibrations"></button></div>
      <div class="li"><span class="em">🌗</span><span class="grow">Thème</span><select data-c="theme" class="inp" style="width:auto;padding:4px 8px;font-size:15px"><option value="">Automatique</option><option value="light" ${localStorage.getItem("cxs.theme") === "light" ? "selected" : ""}>Clair</option><option value="dark" ${localStorage.getItem("cxs.theme") === "dark" ? "selected" : ""}>Sombre</option></select></div>
      <button class="li" data-a="go" data-r="x"><span class="em">✖️</span><span class="grow">Pourquoi le X ?</span>${I.chev}</button>
    </div>
    <h2 class="sec">💾 Mes données</h2>
    <p class="small muted">Tes séances, ton journal et tes notes restent sur ce téléphone. Télécharge une sauvegarde chaque mois.</p>
    <div class="list"><button class="li" data-a="export"><span class="grow">Télécharger ma sauvegarde</span>${I.chev}</button>
      <label class="li" style="cursor:pointer"><span class="grow">Restaurer une sauvegarde</span>${I.chev}<input type="file" accept="application/json" data-c="import" hidden></label>
      <a class="li" href="#/privacy" style="color:inherit;text-decoration:none"><span class="grow">Confidentialité</span>${I.chev}</a>
      <button class="li" data-a="reset"><span class="grow" style="color:var(--red)">Tout effacer et recommencer</span></button></div>
    <p class="xs muted mt24">CalXsthenos · version 3.0 · ${esc(CONFIG.coachName)}. Les conseils de l'app ne remplacent pas un avis médical : en cas de douleur ou de problème de santé, consulte un médecin avant de t'entraîner.</p>
  </main>${tabbar("")}`;
};
actions["word-set"] = (b, d) => { update(st => st.settings.word = d.v); rerender(); };
actions.haptics = () => { update(st => st.settings.haptics = !st.settings.haptics); rerender(); };
changes.theme = (el) => { if (el.value) localStorage.setItem("cxs.theme", el.value); else localStorage.removeItem("cxs.theme"); applyTheme(); };
export function applyTheme() { const t = localStorage.getItem("cxs.theme"); if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
actions.export = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([exportJSON()], { type: "application/json" })); a.download = `calxsthenos-${today()}.json`; a.click(); toast("Sauvegarde téléchargée"); };
changes.import = async (el) => { const f = el.files?.[0]; if (!f) return; try { importJSON(await f.text()); toast("Sauvegarde restaurée"); go("home"); } catch (e) { toast(e.message); } };
actions.reset = () => { if (confirm("Effacer toutes tes données de ce téléphone ? Cette action est définitive.")) { resetAll(); localStorage.removeItem("cxs.auth"); resetOnboarding(); go("onboarding"); } };
actions["edit-body"] = () => {
  const p = S().profile, opt = (id) => ONB_STEPS.find(s => s.id === id).opts;
  sheet(`<h2 class="h1">Mes infos</h2><form data-f="edit-body" class="stack mt12">
    <div class="grid3"><label class="field"><span>Poids (kg)</span><input name="weight" inputmode="decimal" value="${E.fmtKg(p.weight)}"></label><label class="field"><span>Taille (cm)</span><input name="height" inputmode="numeric" value="${p.height}"></label><label class="field"><span>Âge</span><input name="age" inputmode="numeric" value="${p.age}"></label></div>
    <label class="field"><span>E-mail</span><input name="email" type="email" value="${esc(p.email || "")}"></label>
    <label class="field"><span>Objectif de pas par jour</span><input name="stepsGoal" inputmode="numeric" value="${p.stepsGoal || 8000}"></label>
    <label class="field"><span>Objectif</span><select name="goal">${opt("goal").map(([v, l]) => `<option value="${v}" ${p.goal === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="field"><span>Activité</span><select name="activity">${opt("activity").map(([v, l]) => `<option value="${v}" ${p.activity === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="field"><span>Pas par jour en moyenne</span><select name="stepsAvg">${opt("steps").map(([v, l]) => `<option value="${v}" ${p.stepsAvg == v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <div class="grid2"><label class="field"><span>Séances de muscu / semaine</span><select name="days">${[1, 2, 3, 4, 5, 6, 7].map(d => `<option ${p.days == d ? "selected" : ""}>${d}</option>`).join("")}</select></label><label class="field"><span>Durée d'une séance</span><select name="sessionMin">${opt("sessionMin").map(([v, l]) => `<option value="${v}" ${(p.sessionMin || 60) == v ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
    <label class="field"><span>Sport ou cardio en plus</span><select name="sportHours">${opt("sportHours").map(([v, l, sub]) => `<option value="${v}" ${(p.sportHours || 0) == v ? "selected" : ""}>${l}${sub ? " · " + sub : ""}</option>`).join("")}</select></label>
    <label class="field"><span>Alimentation</span><select name="diet">${opt("diet").map(([v, l]) => `<option value="${v}" ${p.diet === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <button class="btn btn-red">Enregistrer</button></form>`);
};
forms["edit-body"] = (v) => {
  update(st => { const p = st.profile; p.weight = num(v.weight) || p.weight; p.height = num(v.height) || p.height; p.age = num(v.age) || p.age; p.email = v.email.trim() || p.email; p.stepsGoal = Math.round(num(v.stepsGoal)) || 8000; p.goal = v.goal; p.activity = v.activity; p.stepsAvg = +v.stepsAvg || null; p.days = +v.days || p.days; p.sessionMin = +v.sessionMin || 60; p.sportHours = +v.sportHours || 0; p.diet = v.diet; p.nutritionModel = N.pickModel(p); st.synced = false; });
  closeSheet(); toast("Infos mises à jour"); syncProfile(); rerender();
};

// ---------- Connaissances ----------
let KB = null;
const EXTRA = [
  { id: "depense", ic: "🔥", t: "Ta dépense : MB, NEAT, EAT, TEF, TDEE", cli: `<p>Ce que tu brûles dans une journée se découpe en quatre parts :</p><ul><li><b>MB, métabolisme de base</b> (60 à 70 %) : ce que ton corps dépense au repos complet pour respirer, penser, garder sa température. Il dépend surtout de ton poids, de ta taille, de ton âge et de ta masse musculaire.</li><li><b>NEAT</b> (15 à 30 %) : tout le mouvement hors sport. Marcher, rester debout, monter les escaliers. C'est la part qui varie le plus d'une personne à l'autre, et la plus facile à augmenter : 4 000 pas de plus, c'est environ 150 à 200 kcal.</li><li><b>EAT</b> (5 à 10 %) : l'exercice volontaire. Une séance de musculation d'une heure brûle moins qu'on le croit (300 à 400 kcal) : son vrai rôle, c'est de construire et protéger le muscle.</li><li><b>TEF, effet thermique des aliments</b> (≈ 10 %) : l'énergie pour digérer. Les protéines en demandent le plus.</li></ul><p><b>TDEE</b> = MB + NEAT + EAT + TEF. Manger sous ton TDEE fait perdre du poids, au-dessus en fait prendre. Les calculs sont des estimations : c'est la tendance de ton poids sur 2 à 3 semaines qui dit la vérité.</p>`, co: `<p><b>Modèle utilisé.</b> MB par Mifflin-St Jeor (10 × poids + 6,25 × taille − 5 × âge + 5 ou −161). NEAT : fraction du MB selon le métier (0,15 à 0,5 × ½) + 0,0005 kcal par pas et par kg. EAT : MET 5 pour la musculation, MET tabulés pour le cardio (kcal = MET × kg × h). TEF : 10 % de l'apport.</p><p><b>Limites.</b> Erreur individuelle du MB ±10 %, adaptation métabolique en déficit prolongé (baisse du NEAT spontané surtout), surestimation fréquente des montres pour l'EAT. Ajuster par paliers de 100 à 200 kcal selon la moyenne mobile du poids.</p>` },
  { id: "jeune", ic: "⏳", t: "Le jeûne : ce qui se passe vraiment", cli: `<p>Pendant un jeûne, ton corps change progressivement de carburant :</p><ul><li><b>0 à 4 h</b> : digestion, l'insuline monte puis redescend.</li><li><b>4 à 12 h</b> : le foie puise dans ses réserves de glycogène.</li><li><b>12 à 16 h</b> : la part d'énergie venant des graisses augmente nettement.</li><li><b>16 à 24 h</b> : production accrue de corps cétoniques, la faim vient par vagues.</li></ul><p>Le jeûne n'a pas de pouvoir magique sur la perte de gras : il aide surtout parce qu'il réduit le nombre de repas, donc les calories. Si tu t'entraînes, garde assez de protéines sur la journée (1,6 à 2,2 g par kg) et place ta séance près d'un repas.</p><p>À éviter sans avis médical : grossesse, diabète traité, antécédents de troubles alimentaires, traitements médicaux.</p>`, co: `<p>Les études comparant jeûne intermittent et restriction continue à calories égales montrent des pertes de poids et de gras similaires. L'intérêt est l'adhérence. Pour la masse musculaire, la répartition des protéines (3 à 4 prises de 0,4 g/kg) reste légèrement favorable aux fenêtres larges (8 h ou plus).</p>` },
  { id: "eau", ic: "💧", t: "L'hydratation", cli: `<p>Repère simple : environ 30 à 35 ml par kg de poids corporel par jour, plus 500 ml à 1 L par heure d'entraînement. Tes urines doivent être jaune pâle.</p><p>Une perte d'eau de 2 % du poids suffit à faire baisser la force et l'endurance. Bois un grand verre au réveil, un pendant chaque repas, et pendant tes séances.</p>` },
];
const KB_FREE = ["priorites", "ventre", "surcharge", "rpe", "depense", "jeune", "eau"];
let kbMode = "cli";
routes.kb = async () => {
  if (!KB) KB = [...(await (await fetch("data/kb.json")).json()), ...EXTRA];
  if (R.param) return kbChapter(R.param);
  const open = (c) => c.g ? expert() : premium() || KB_FREE.includes(c.id);
  const groups = [["Les bases", KB.filter(c => !c.g && !EXTRA.includes(c))], ["Énergie, jeûne, eau", EXTRA], ["Maillons faibles et dos (suivi)", KB.filter(c => c.g)]];
  $app.innerHTML = header("Connaissances", "Science de l'entraînement, physiologie, biomécanique", { back: "train" }) + `<main class="page">
    <p class="small muted">${expert() ? "Toute la bibliothèque est ouverte, avec la version experte de chaque chapitre." : "Gratuit : les bases. Premium : toute la bibliothèque. Suivi : la version experte et le module maillons faibles."}</p>
    ${groups.map(([g, list]) => `<h2 class="sec">${g}</h2><div class="list">${list.map(c => `<button class="li" data-a="go" data-r="kb" data-p="${c.id}"><span class="em">${c.ic || "📘"}</span><span class="grow"><b class="small">${esc(c.t)}</b>${S().kbRead?.[c.id] ? ` <span class="tag g">lu</span>` : ""}</span>${open(c) ? I.chev : `<span class="lock">🔒</span>`}</button>`).join("")}</div>`).join("")}
  </main>${tabbar("train")}`;
};
function kbChapter(id) {
  const c = KB.find(x => x.id === id); if (!c) return go("kb");
  const open = c.g ? expert() : premium() || KB_FREE.includes(c.id), isExp = expert() && c.co;
  if (open) update(st => { st.kbRead = st.kbRead || {}; st.kbRead[id] = true; });
  const html = open ? (kbMode === "co" && isExp ? c.co : (c.cli || c.co)) : "";
  $app.innerHTML = header(`${c.ic || "📘"} ${esc(c.t)}`, "", { back: "kb" }) + `<main class="page full">
    ${c.co ? `<div class="mt8">${expert() ? seg([["cli", "Version simple"], ["co", "Version experte"]], kbMode, "kb-mode") : `<p class="xs muted">🔒 Version experte avec les formules de suivi.</p>`}</div>` : ""}
    ${open ? `<article class="card mt12 prose kb">${html}</article>` : `<div class="card mt12 locked" style="position:relative;min-height:260px"><p class="small muted">${esc((c.cli || "").replace(/<[^>]+>/g, " ").slice(0, 160))}…</p>${lockVeil(c.g ? "Suivi" : "Premium")}</div>`}
  </main>`;
}
actions["kb-mode"] = (b, d) => { kbMode = d.v; kbChapter(R.param); };

// ---------- Pourquoi le X, confidentialité ----------
routes.x = () => {
  $app.innerHTML = header("Pourquoi le X ?", "", { back: S().profile ? "profile" : "onboarding" }) + `<main class="page full prose">
    <img src="assets/logo-grec-complet.jpg" alt="Le logo Cal X Sthenos : un athlète grec en figure noire, vu de dos, fait une traction sur la barre d'une croix, dans un médaillon à frise grecque" style="width:100%;border-radius:18px;margin-top:12px;display:block">
    <p class="mt24"><i>Kalos</i>, en grec, c'est le beau, le noble. <i>Sthenos</i>, c'est la force. Ensemble, ils ont donné la calisthénie : l'art de bâtir un corps fort.</p>
    <p>« Cal », ce sont aussi les calories : ce qui te nourrit. « Sthenos », ce qui te rend fort. Et le X : la lettre grecque Chi, la première du nom du Christ.</p>
    <p>Sur le logo, un athlète peint comme sur un vase grec fait une traction sur la barre d'une croix. La force se construit en s'élevant, et la croix est ce qui nous relève : « Je puis tout par celui qui me fortifie » (Philippiens 4:13).</p>
    <p>Nous croyons que le corps compte et mérite d'être servi avec exigence. Et qu'il n'est pas tout : nous voulons édifier le corps, l'âme et l'esprit, pour cette vie et pour l'éternité.</p>
    <div class="card mt16">${W.wordCard(W.VERSES[0])}</div>
    <p class="mt16">La force que tu construis ici est réelle. Celle que Dieu offre l'est davantage, et elle ne se gagne pas : elle se reçoit.</p>
    <button class="btn btn-line mt16" data-a="go" data-r="eternal" data-p="jesus">Qui est Jésus ?</button>
  </main>`;
};
routes.privacy = () => {
  $app.innerHTML = header("Confidentialité", "", { back: S().profile ? "profile" : "onboarding" }) + `<main class="page full prose">
    <p><b>Responsable :</b> ${esc(CONFIG.coachName)}, micro-entrepreneur, coach sportif.</p>
    <p><b>Ce qui est envoyé sur notre serveur</b> (hébergé à Paris) : ton prénom, ton e-mail, tes réponses au questionnaire de départ, un résumé de ton activité (nombre de séances, poids, semaine du programme), tes messages avec Thomas et leurs réactions, ta candidature si tu en envoies une.</p>
    <p><b>Ce qui reste uniquement sur ton téléphone :</b> le détail de tes séances, ton journal alimentaire, tes jeûnes, ta routine, tes mensurations, tes photos, tes surlignages et tes notes de la Bible.</p>
    <p><b>Pourquoi :</b> te proposer un programme adapté, te répondre et, si tu l'as accepté, t'envoyer des conseils par e-mail. Tes données ne sont jamais vendues.</p>
    <p><b>Tes droits :</b> accès, rectification, suppression. Écris à Thomas depuis l'onglet Coach, ou efface tout depuis ton profil. Les données de ton compte serveur sont supprimées sur simple demande.</p>
    <p><b>Textes bibliques :</b> Louis Segond 1910, domaine public (édition numérique de l'Alliance biblique universelle, via eBible.org).</p>
  </main>`;
};
