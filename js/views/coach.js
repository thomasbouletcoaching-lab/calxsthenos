// Coach : messagerie (avec réactions), offres et démo, candidature, bilans, notifications, espace coach.
import { S, update, today } from "../store.js";
import * as E from "../engine.js";
import { CONFIG, OFFERS, offer } from "../config.js";
import { $app, esc, num, buzz, toast, ago, routes, R, actions, forms, go, I, header, tabbar, sheet, closeSheet, badges, tier, rank, premium, isCoach, msgQuotaText, cloud, cloudNow, render, onLeave } from "../core.js";
import { refreshMe, syncProfile } from "../sync.js";

routes.coach = () => {
  if (isCoach()) return adminHome();
  const o = offer(tier());
  $app.innerHTML = header("Coach", esc(CONFIG.coachName)) + `<main class="page">
    <div class="card grad"><div class="row" style="gap:12px"><span style="width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.95);display:grid;place-items:center;flex:none;color:#151515">${I.x(28)}</span><div><div class="h2">${esc(CONFIG.coachName)}</div><div class="small" style="opacity:.85">${esc(CONFIG.coachTitle)}</div></div></div>
      <p class="mt12">Je lis et je réponds moi-même à chaque message.</p>
      <button class="btn mt8" style="background:#fff;color:var(--red)" data-a="go" data-r="chat">💬 Écrire à Thomas${badges.msgs ? ` · ${badges.msgs} nouveau${badges.msgs > 1 ? "x" : ""}` : ""}</button>
      <p class="xs mt8" style="opacity:.85;margin-bottom:0">${msgQuotaText()}</p></div>
    <h2 class="sec">🎯 Ta formule <small>${esc(o.name)}</small></h2>
    ${rank() >= 2 ? followUp() : `<button class="card tap" data-a="go" data-r="offers" style="display:flex;align-items:center;gap:12px"><span style="font-size:28px">🚀</span><span class="grow"><b>${premium() ? "Passer au suivi avec Thomas" : "Voir toutes les offres"}</b><br><span class="small muted">De 0 € à l'accompagnement complet. Chaque offre se teste en démo.</span></span>${I.chev}</button>`}
    ${rank() >= 2 ? `<button class="card tap mt12" data-a="go" data-r="offers" style="display:flex;align-items:center;gap:12px"><span class="grow"><b>Toutes les offres</b><br><span class="small muted">Comparer et changer de formule</span></span>${I.chev}</button>` : ""}
    <h2 class="sec">📚 Pour aller plus loin</h2>
    <div class="list"><button class="li" data-a="go" data-r="kb"><span class="em">📚</span><span class="grow"><b>Connaissances</b><br><span class="xs muted">Science de l'entraînement, physiologie, biomécanique</span></span>${I.chev}</button>
      <button class="li" data-a="go" data-r="simu"><span class="em">🧮</span><span class="grow"><b>Records, simulateur 1RM et objectif</b><br><span class="xs muted">Combien de cycles pour atteindre ta performance</span></span>${I.chev}</button></div>
  </main>${tabbar("coach")}`;
};
function followUp() {
  const r = rank(), weekly = r >= 3;
  return `<div class="card"><div class="h3">📝 ${weekly ? "Bilan de la semaine" : "Bilan du mois"}</div><p class="small muted mt4">Envoie-le chaque ${weekly ? "dimanche" : "fin de mois"} : je te réponds avec tes ajustements.</p><button class="btn btn-red btn-sm mt8" data-a="checkin">Remplir mon bilan</button></div>
    ${r >= 4 ? `<div class="card"><div class="h3">📞 Mes appels avec Thomas</div><p class="small muted mt4">${r >= 5 ? "Un appel toutes les deux semaines." : "Un appel par mois."}</p><a class="btn btn-line btn-sm mt8" href="${CONFIG.calendly}" target="_blank" rel="noopener">Réserver un appel</a></div>
      <div class="card"><div class="h3">🎥 Analyse de ta technique</div><p class="small muted mt4">Filme une série de profil et envoie-moi le lien de la vidéo dans les messages : je te réponds avec mes corrections.</p></div>` : ""}
    ${r >= 5 ? `<div class="card hl"><div class="h3">✝ Corps, âme et esprit</div><p class="small muted mt4">Ton accompagnement inclut aussi tes objectifs de vie, ta discipline et, si tu le souhaites, ta foi. On en parle à chaque appel.</p></div>` : ""}`;
}

// ---------- Offres et démo ----------
routes.offers = () => {
  const cur = S().me?.tier || "free";
  $app.innerHTML = header("Les offres", "Essaie chaque formule en démo", { back: "coach" }) + `<main class="page">
    <p class="muted">Touche « Voir la démo » : l'app passe dans cette formule pour te montrer tout ce qu'elle débloque. Rien n'est payé.</p>
    <div class="card soft"><b>✝ La Parole reste gratuite, pour toujours.</b><p class="small muted mt4" style="margin:0">La Bible complète, les surlignages, les notes et les favoris ne sont dans aucune offre payante.</p></div>
    ${OFFERS.map(o => `<div class="offer ${o.id === cur ? "cur" : ""} mt16">${o.id === cur ? `<span class="ribbon">Ta formule</span>` : o.ribbon ? `<span class="ribbon">${esc(o.ribbon)}</span>` : ""}
      <div class="row between" style="align-items:flex-end"><div><div class="h2">${esc(o.name)}</div><div class="small muted">${esc(o.tagline)}</div></div><div class="price" style="text-align:right;white-space:nowrap">${esc(o.price)}<small>${esc(o.per)}</small></div></div>
      ${o.alt ? `<div class="small red mt4" style="text-align:right">${esc(o.alt)}</div>` : ""}${o.was ? `<div class="small mt4" style="text-align:right"><span class="muted">au lieu de <s>${esc(o.was)}</s></span></div>` : ""}
      <ul>${o.feats.map(f => `<li>${I.check}<span>${esc(f)}</span></li>`).join("")}<li>${I.check}<span>${esc(o.msgs)}</span></li></ul>
      ${o.id === "free" ? "" : `<div class="row" style="gap:8px"><button class="btn btn-line btn-sm grow" data-a="demo" data-v="${o.id}">Voir la démo</button>${o.id === cur ? "" : `<button class="btn btn-red btn-sm grow" data-a="choose" data-v="${o.id}">${o.rank >= 2 ? "Candidater" : "Choisir"}</button>`}</div>`}
    </div>`).join("")}
    <p class="xs muted mt16">Sans engagement, résiliable à tout moment. Les formules de suivi démarrent après un appel de 15 minutes pour vérifier que je peux vraiment t'aider.</p>
  </main>${tabbar("coach")}`;
};
actions.demo = (b, d) => { update(st => st.demoTier = d.v); toast(`Démo ${offer(d.v).name} : explore l'app`); go("home"); };
actions["demo-exit"] = () => { update(st => st.demoTier = null); render(); };
actions["demo-choose"] = () => { const t = S().demoTier; update(st => st.demoTier = null); chooseOffer(t); };
actions.choose = (b, d) => chooseOffer(d.v);
function chooseOffer(id) {
  const o = offer(id);
  if (o.rank === 1) {
    const link = o.pay?.month;
    if (link) { const u = new URL(link); const c = cloudNow()?.userId?.(); if (c) u.searchParams.set("client_reference_id", c); if (S().profile?.email) u.searchParams.set("prefilled_email", S().profile.email); location.href = u.toString(); return; }
    sheet(`<h2 class="h1">Premium</h2><p class="mt12">Le paiement en ligne ouvre très bientôt. En attendant, écris-moi : je t'active Premium moi-même.</p><button class="btn btn-red mt12" data-a="prefill" data-t="Bonjour Thomas, je veux passer à Premium.">Écrire à Thomas</button>`);
    return;
  }
  AP.i = 0; AP.a = { offer: id }; go("apply");
}
actions.prefill = (b, d) => { closeSheet(); window.__prefill = d.t; go("chat"); };

// ---------- Candidature ----------
const AP = { i: 0, a: {} };
const AQ = [
  { id: "goal", q: "🎯 Ton objectif précis dans 12 semaines ?", type: "text", ph: "Ex. perdre 6 kg, ou passer de 100 à 120 kg au squat" },
  { id: "obstacle", q: "Qu'est-ce qui t'a fait abandonner ou stagner les fois précédentes ?", type: "text", ph: "Sois honnête, c'est entre nous" },
  { id: "time", q: "⏱️ Combien d'heures par semaine peux-tu vraiment bloquer ?", opts: [["lt2", "Moins de 2 h"], ["2-3", "2 à 3 h"], ["3-5", "3 à 5 h"], ["5+", "Plus de 5 h"]] },
  { id: "urgency", q: "🔥 De 1 à 10, à quel point c'est important pour toi maintenant ?", opts: [[10, "10 · c'est ma priorité"], [8, "8"], [6, "6"], [4, "4 ou moins"]] },
  { id: "phone", q: "📞 Ton téléphone, pour notre appel", type: "phone" },
];
routes.apply = () => {
  if (!AP.a.offer) return go("offers");
  const s = AQ[AP.i]; if (!s) return applyDone();
  let body;
  if (s.type === "text") body = `<form class="choices" data-f="ap-text" style="align-items:stretch"><label class="field"><span>${esc(s.ph)}</span><textarea name="v" required maxlength="400">${esc(AP.a[s.id] || "")}</textarea></label><button class="btn btn-red">Continuer</button></form>`;
  else if (s.type === "phone") body = `<form class="choices" data-f="ap-phone" style="align-items:stretch"><label class="field"><span>Téléphone (facultatif)</span><input name="v" type="tel" autocomplete="tel"></label><button class="btn btn-red">Envoyer ma candidature</button></form>`;
  else body = `<div class="choices">${s.opts.map(([v, l]) => `<button class="choice" data-a="ap-pick" data-v='${JSON.stringify(v)}'>${l}</button>`).join("")}</div>`;
  $app.innerHTML = `<section class="convo"><div class="convo-top"><button class="icon-btn" data-a="ap-back" aria-label="Retour">${I.back}</button><div class="progress"><i style="width:${AP.i / AQ.length * 100}%"></i></div></div>
    <div class="coach-mark"><span class="av">${I.x(20)}</span>Candidature · ${esc(offer(AP.a.offer).name)}</div><h1 class="q">${esc(s.q)}</h1>${body}</section>`;
};
actions["ap-back"] = () => { if (AP.i === 0) go("offers"); else { AP.i--; routes.apply(); } };
actions["ap-pick"] = (b, d) => { AP.a[AQ[AP.i].id] = JSON.parse(d.v); AP.i++; buzz(); routes.apply(); };
forms["ap-text"] = (v) => { AP.a[AQ[AP.i].id] = v.v.trim(); AP.i++; routes.apply(); };
forms["ap-phone"] = (v) => { AP.a.phone = v.v.trim(); AP.i++; routes.apply(); };
function calendlyUrl(a) {
  const u = new URL(CONFIG.calendly);
  u.searchParams.set("name", S().profile?.name || ""); u.searchParams.set("email", S().profile?.email || "");
  u.searchParams.set("a1", `Offre : ${offer(a.offer).name}\nObjectif : ${a.goal}\nFrein : ${a.obstacle}\nTemps : ${a.time} · Urgence : ${a.urgency}/10`);
  return u.toString();
}
function applyDone() {
  const a = { ...AP.a, at: new Date().toISOString() };
  update(st => { st.application = a; st.synced = false; });
  syncProfile();
  $app.innerHTML = `<section class="convo" style="justify-content:center">
    <div class="coach-mark"><span class="av">${I.x(20)}</span>Thomas</div>
    <h1 class="q">Merci ${esc(S().profile.name)}. J'ai bien reçu ta candidature pour ${esc(offer(a.offer).name)}.</h1>
    <p class="q-sub">Dernière étape : réserve notre appel de 15 minutes. Tes réponses me seront transmises avec la réservation.</p>
    <div class="stack mt32"><a class="btn btn-red" href="${calendlyUrl(a)}" target="_blank" rel="noopener">📞 Réserver mon appel</a><button class="btn btn-line" data-a="go" data-r="home">Plus tard</button></div></section>`;
  AP.i = 0; AP.a = {};
}

// ---------- Messagerie (avec réactions) ----------
const REACTS = ["👍", "❤️", "🙏", "🔥", "💪", "😂"];
let pollT = null, msgs = [], me = null;
const stopPoll = () => { clearInterval(pollT); pollT = null; };
function msgHtml(x) {
  const mine = x.sender === me, rs = Object.values(x.reactions || {});
  const grouped = rs.reduce((o, e) => (o[e] = (o[e] || 0) + 1, o), {});
  return `<div class="msg ${mine ? "me" : "them"}" data-a="msg" data-id="${x.id}">${esc(x.body)}<time>${ago(x.created_at)}${mine && x.read_at ? " · lu" : ""}</time></div>${rs.length ? `<div class="reacts ${mine ? "me" : "them"}">${Object.entries(grouped).map(([e, n]) => `<span>${e}${n > 1 ? " " + n : ""}</span>`).join("")}</div>` : ""}`;
}
routes.chat = async () => {
  const memberId = isCoach() ? R.param : null;
  const m = memberId ? (window.__members || []).find(x => x.id === memberId) : null;
  $app.innerHTML = header(memberId ? esc(m?.name || "Membre") : "Thomas", memberId ? esc(m?.email || "") : "Je réponds moi-même", { back: memberId ? "member/" + memberId : "coach" })
    + `<main class="page" style="padding-bottom:calc(100px + var(--safe-b))"><div class="thread" id="thread"><p class="empty small">Chargement…</p></div>${memberId ? "" : `<p class="xs muted center">${msgQuotaText()} · touche un message pour réagir</p>`}</main>
    <form class="composer" data-f="send"><textarea name="v" rows="1" placeholder="Ton message" maxlength="2000" aria-label="Message">${esc(window.__prefill || "")}</textarea><button class="send" aria-label="Envoyer">${I.send}</button></form>`;
  window.__prefill = "";
  const load = async (first) => {
    const c = await cloud(); const box = document.getElementById("thread"); if (!box) return stopPoll();
    try {
      await c.ensureSession(); me = c.userId();
      const list = await c.thread(memberId || me);
      const changed = JSON.stringify(list) !== JSON.stringify(msgs); msgs = list;
      if (changed || first) box.innerHTML = list.length ? list.map(msgHtml).join("") : `<div class="msg them">Salut ${esc(S().profile?.name || "")} ! Je suis Thomas. Pose-moi ta question sur ton entraînement, ta nutrition ou ce que tu vis : je te réponds moi-même.</div>`;
      await c.markRead(memberId || me);
      if (!memberId) badges.msgs = 0;
      if (changed || first) window.scrollTo(0, document.body.scrollHeight);
    } catch (e) { box.innerHTML = `<p class="empty small">Messagerie indisponible pour le moment. Vérifie ta connexion et réessaie.</p>`; }
  };
  msgs = []; await load(true); stopPoll(); pollT = setInterval(() => load(false), 15000);
  onLeave(stopPoll);
};
actions.msg = (b, d) => {
  const x = msgs.find(m => String(m.id) === d.id); if (!x) return;
  sheet(`<p class="small muted center">Réagir au message</p><div class="reactbar">${REACTS.map(e => `<button data-a="react" data-id="${x.id}" data-v="${e}" style="${x.reactions?.[me] === e ? "box-shadow:0 0 0 2px var(--red) inset" : ""}">${e}</button>`).join("")}</div>
    <button class="btn btn-ghost btn-sm mt8" data-a="msg-copy" data-id="${x.id}">Copier le texte</button>`);
};
actions.react = async (b, d) => {
  const x = msgs.find(m => String(m.id) === d.id); closeSheet();
  try { const c = await cloud(); x.reactions = await c.react(x.id, d.v, x.reactions); buzz(); document.getElementById("thread").innerHTML = msgs.map(msgHtml).join(""); }
  catch { toast("Réaction impossible, réessaie."); }
};
actions["msg-copy"] = (b, d) => { const x = msgs.find(m => String(m.id) === d.id); navigator.clipboard?.writeText(x.body); closeSheet(); toast("Copié"); };
forms.send = async (v, form) => {
  const ta = form.querySelector("textarea"), body = ta.value.trim(); if (!body) return;
  const c = await cloud(); if (!c) return toast("Pas de connexion.");
  const memberId = isCoach() ? R.param : null;
  if (!memberId && S().demoTier) toast("En démo, ton message part avec ta formule actuelle.");
  try {
    await c.ensureSession(); await c.send(body, memberId || c.userId()); ta.value = ""; buzz();
    const x = { id: "tmp" + Date.now(), sender: c.userId(), body, created_at: new Date().toISOString(), reactions: {} };
    msgs.push(x); document.getElementById("thread")?.insertAdjacentHTML("beforeend", msgHtml(x));
    window.scrollTo(0, document.body.scrollHeight);
    refreshMe();
  } catch (e) {
    const quota = /row-level|policy/i.test(e.message);
    toast(quota ? "Tu as utilisé tes messages de la semaine. Une formule supérieure t'en donne plus." : "Envoi impossible, réessaie.");
    if (quota) setTimeout(() => go("offers"), 1800);
  }
};

// ---------- Bilan ----------
actions.checkin = () => {
  sheet(`<h2 class="h1">📝 Mon bilan</h2><form data-f="checkin" class="stack mt12">
    <div class="grid2"><label class="field"><span>Poids moyen (kg)</span><input name="poids" inputmode="decimal" value="${E.fmtKg(S().profile.weight)}"></label><label class="field"><span>Séances faites</span><input name="seances" inputmode="numeric" value="${E.workoutsThisWeek().length}"></label></div>
    <div class="grid3">${[["energie", "Énergie /10"], ["sommeil", "Sommeil /10"], ["faim", "Faim /10"]].map(([k, l]) => `<label class="field"><span>${l}</span><input name="${k}" inputmode="numeric"></label>`).join("")}</div>
    <label class="field"><span>Ma victoire</span><textarea name="victoire"></textarea></label>
    <label class="field"><span>Ma difficulté</span><textarea name="difficulte"></textarea></label>
    <button class="btn btn-red">Envoyer à Thomas</button></form>`);
};
forms.checkin = async (v) => {
  const t = `📝 Bilan du ${new Date().toLocaleDateString("fr-FR")}\nPoids moyen : ${v.poids} kg · Séances : ${v.seances}\nÉnergie ${v.energie || "–"}/10 · Sommeil ${v.sommeil || "–"}/10 · Faim ${v.faim || "–"}/10\nVictoire : ${v.victoire || "–"}\nDifficulté : ${v.difficulte || "–"}`;
  const c = await cloud(); try { await c.ensureSession(); await c.send(t); closeSheet(); toast("Bilan envoyé à Thomas"); refreshMe(); } catch { toast("Envoi impossible, réessaie."); }
};

// ---------- Notifications ----------
actions.notifs = () => {
  sheet(`<h2 class="h1">🔔 Notifications</h2><div id="nl" class="mt12"><p class="empty small">Chargement…</p></div>`, async (w) => {
    const c = await cloud(); let list = [];
    try { await c.currentSession(); list = await c.notifications(); } catch { }
    const seen = S().notifSeen;
    w.querySelector("#nl").innerHTML = list.length ? `<div class="list">${list.map(n => `<div class="li" style="align-items:flex-start"><span style="width:8px;height:8px;border-radius:50%;margin-top:8px;background:${new Date(n.created_at).getTime() > seen ? "var(--red)" : "transparent"};flex:none"></span><span class="grow"><b>${esc(n.title)}</b>${n.body ? `<br><span class="small muted">${esc(n.body)}</span>` : ""}<br><span class="xs muted">${ago(n.created_at)}</span></span></div>`).join("")}</div>` : `<p class="empty">Aucune notification pour l'instant.</p>`;
    update(st => st.notifSeen = Date.now()); badges.notifs = 0; document.querySelectorAll("[data-a=notifs] .badge").forEach(b => b.remove());
  });
};

// ---------- Espace coach ----------
let adminFilter = "";
async function adminHome() {
  $app.innerHTML = header("Espace coach", "Tes membres") + `<main class="page"><p class="empty">Chargement…</p></main>${tabbar("coach")}`;
  const c = await cloud(); let list = [];
  try { list = await c.members(); window.__members = list; } catch (e) { $app.querySelector(".page").innerHTML = `<p class="empty">Impossible de charger les membres : ${esc(e.message)}</p>`; return; }
  const q = adminFilter.toLowerCase();
  const shown = list.filter(m => !q || (m.name || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q)).sort((a, b) => b.unread - a.unread);
  const page = $app.querySelector(".page"); if (!page) return;
  page.innerHTML = `
    <div class="card"><div class="stat3"><div><b>${list.length}</b><span>membres</span></div><div><b>${list.filter(m => m.tier !== "free").length}</b><span>payants</span></div><div><b>${list.reduce((a, m) => a + m.unread, 0)}</b><span>non lus</span></div></div></div>
    <div class="chips mt12">${OFFERS.map(o => `<span class="chip">${esc(o.name)} · ${list.filter(m => m.tier === o.id).length}</span>`).join("")}</div>
    <div class="search mt12">${I.search}<input id="aq" placeholder="Nom ou e-mail" value="${esc(adminFilter)}"></div>
    <div class="list mt12">${shown.length ? shown.map(m => `<button class="li" data-a="go" data-r="member" data-p="${m.id}"><span class="grow"><b>${esc(m.name || "Sans nom")}</b> <span class="tag ${m.tier !== "free" ? "r" : ""}">${esc(offer(m.tier).name)}</span>${m.onboarding?.application ? ` <span class="tag r">Candidature</span>` : ""}<br><span class="xs muted">${esc(m.email || "e-mail non renseigné")} · vu ${ago(m.last_seen)}</span></span>${m.unread ? `<span class="badge" style="position:static;border:0">${m.unread}</span>` : ""}${I.chev}</button>`).join("") : `<p class="empty small">Aucun membre pour l'instant.</p>`}</div>
    <button class="btn btn-line btn-sm mt12" data-a="export-members">⬇️ Exporter les e-mails (CSV)</button>
    <h2 class="sec">📣 Notification à tous</h2>
    <form class="card stack" data-f="broadcast"><label class="field"><span>Titre</span><input name="t" required maxlength="80"></label><label class="field"><span>Message</span><textarea name="b" maxlength="300"></textarea></label><button class="btn btn-red btn-sm">Envoyer à tous les membres</button></form>`;
  const inp = page.querySelector("#aq"); inp.addEventListener("input", () => { adminFilter = inp.value; clearTimeout(window.__aqT); window.__aqT = setTimeout(adminHome, 350); });
}
actions["export-members"] = () => {
  const rows = [["prenom", "email", "formule", "inscrit", "derniere_visite", "accepte_emails", "objectif"], ...(window.__members || []).map(m => [m.name || "", m.email || "", offer(m.tier).name, (m.created_at || "").slice(0, 10), (m.last_seen || "").slice(0, 10), m.onboarding?.news ? "oui" : "non", m.onboarding?.goal || ""])];
  const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); a.download = `membres-calxsthenos-${today()}.csv`; a.click();
};
routes.member = async () => {
  if (!isCoach()) return go("home");
  const c = await cloud();
  if (!window.__members) { try { window.__members = await c.members(); } catch { } }
  const m = (window.__members || []).find(x => x.id === R.param); if (!m) return go("coach");
  const o = m.onboarding || {}, ap = o.application, st = m.stats || {};
  const L = { goal: "Objectif", discipline: "Discipline", level: "Niveau", place: "Lieu", days: "Jours / semaine", sex: "Sexe", age: "Âge", height: "Taille", weight: "Poids", diet: "Alimentation", activity: "Activité", backPain: "Gêne lombaire", word: "Parole", news: "Accepte les e-mails" };
  $app.innerHTML = header(esc(m.name || "Membre"), esc(m.email || ""), { back: "coach" }) + `<main class="page">
    <div class="row" style="gap:8px"><a class="btn btn-red btn-sm grow" href="#/chat/${m.id}">💬 Messages${m.unread ? ` · ${m.unread}` : ""}</a>${m.email ? `<a class="btn btn-line btn-sm grow" href="mailto:${esc(m.email)}">✉️ E-mail</a>` : ""}</div>
    <h2 class="sec">Formule</h2>
    <div class="card"><div class="row" style="gap:8px"><select id="tier" class="inp grow" style="text-align:left">${OFFERS.map(x => `<option value="${x.id}" ${x.id === m.tier ? "selected" : ""}>${esc(x.name)} · ${esc(x.price)}</option>`).join("")}</select><button class="btn btn-red btn-sm" style="width:auto" data-a="set-tier" data-id="${m.id}">Valider</button></div></div>
    ${ap ? `<h2 class="sec">Candidature <small>${new Date(ap.at).toLocaleDateString("fr-FR")}</small></h2><div class="card small"><b>${esc(offer(ap.offer).name)}</b><p class="mt8"><b>Objectif :</b> ${esc(ap.goal)}</p><p><b>Frein :</b> ${esc(ap.obstacle)}</p><p><b>Temps :</b> ${esc(ap.time)} · <b>Urgence :</b> ${esc(ap.urgency)}/10</p>${ap.phone ? `<p><b>Téléphone :</b> <a href="tel:${esc(ap.phone)}">${esc(ap.phone)}</a></p>` : ""}</div>` : ""}
    <h2 class="sec">Activité</h2>
    <div class="card"><div class="stat3"><div><b>${st.workouts ?? 0}</b><span>séances</span></div><div><b>${st.weight ? E.fmtKg(st.weight) : "–"}</b><span>kg</span></div><div><b>${st.week ?? "–"}</b><span>semaine</span></div></div></div>
    <p class="xs muted mt8">Inscrit le ${new Date(m.created_at).toLocaleDateString("fr-FR")} · dernière visite ${ago(m.last_seen)}${st.lastWorkout ? ` · dernière séance ${ago(st.lastWorkout)}` : ""}${st.program ? ` · programme ${esc(st.program)}` : ""}</p>
    <h2 class="sec">Réponses de l'onboarding</h2>
    <div class="list">${Object.entries(L).filter(([k]) => o[k] !== undefined && o[k] !== null && o[k] !== "").map(([k, l]) => `<div class="li"><span class="grow small muted">${l}</span><span class="small"><b>${esc(typeof o[k] === "boolean" ? (o[k] ? "oui" : "non") : o[k])}</b></span></div>`).join("")}
      ${Object.entries(o.records || {}).map(([k, v]) => `<div class="li"><span class="grow small muted">Record ${esc(k)}</span><span class="small"><b>${v.r} × ${E.fmtKg(v.k)} kg</b></span></div>`).join("")}</div>
    <h2 class="sec">Notification à ${esc(m.name || "ce membre")}</h2>
    <form class="card stack" data-f="notify-one" data-id="${m.id}"><label class="field"><span>Titre</span><input name="t" required maxlength="80"></label><label class="field"><span>Message</span><textarea name="b" maxlength="300"></textarea></label><button class="btn btn-red btn-sm">Envoyer</button></form>
  </main>${tabbar("coach")}`;
};
actions["set-tier"] = async (b, d) => {
  const t = document.getElementById("tier").value, c = await cloud();
  try { await c.setTier(d.id, t); const m = window.__members.find(x => x.id === d.id); if (m) m.tier = t; toast(`Formule ${offer(t).name} activée`); } catch (e) { toast(e.message); }
};
forms.broadcast = async (v, f) => { const c = await cloud(); try { await c.notify(v.t, v.b, null); f.reset(); toast("Notification envoyée à tous"); } catch (err) { toast(err.message); } };
forms["notify-one"] = async (v, f) => { const c = await cloud(); try { await c.notify(v.t, v.b, f.dataset.id); f.reset(); toast("Notification envoyée"); } catch (err) { toast(err.message); } };
