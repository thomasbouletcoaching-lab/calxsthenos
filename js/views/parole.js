// Parole : verset et affirmation du jour, Bible complète (Louis Segond 1910) avec surlignages et notes,
// affirmations, favoris, « Et après ? ». Tout est gratuit : l'Évangile ne se paie pas.
import { S, update } from "../store.js";
import * as W from "../word.js";
import * as F from "../faith.js";
import { $app, esc, toast, routes, R, actions, changes, forms, go, I, header, tabbar, seg, chips, sheet, closeSheet, rerender, fmtDate, addDays, buzz } from "../core.js";
import { today } from "../store.js";

let tab = "jour", affCat = "valeur";
let IDX = null; const BOOKS = {};
const loadIndex = async () => IDX || (IDX = await (await fetch("data/bible/index.json")).json());
const loadBook = async (i) => BOOKS[i] || (BOOKS[i] = await (await fetch(`data/bible/${String(i).padStart(2, "0")}.json`)).json());
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
// « 1 Corinthiens 6:19-20 » → { b, c, v, v2 }
export function parseRef(ref) {
  if (!IDX) return null;
  const m = String(ref).match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/); if (!m) return null;
  let n = norm(m[1]); if (n === "psaume") n = "psaumes";
  const bk = IDX.find(b => norm(b.name) === n || norm(b.abbr) === n) || IDX.find(b => norm(b.name).startsWith(n));
  return bk ? { b: bk.i, c: +m[2], v: m[3] ? +m[3] : null, v2: m[4] ? +m[4] : null } : null;
}
const isFav = (id) => S().favorites.includes(id);
const heartBtn = (id) => `<button class="heart ${isFav(id) ? "on" : ""}" data-a="fav" data-id="${id}" aria-label="${isFav(id) ? "Retirer des favoris" : "Garder en favori"}">${I.heart}</button>`;
const readBtn = (ref) => `<button class="link small mt8" data-a="read-ref" data-ref="${esc(ref)}">📖 Lire le passage</button>`;

routes.word = async () => {
  await loadIndex();
  if (R.param === "apres") R.param = "rocher";
  if (R.param && ["jour", "journal", "defis", "rocher", "bible", "affirm", "favoris"].includes(R.param)) tab = R.param;
  let body = "";
  if (tab === "jour") body = dayBody();
  else if (tab === "journal") body = journalBody();
  else if (tab === "defis") body = await defisBody();
  else if (tab === "rocher") body = rocherBody();
  else if (tab === "bible") body = await bibleBody();
  else if (tab === "affirm") body = `<p class="small muted mt12">Ce que la Parole dit de toi. Pas des formules pour se motiver soi-même : notre force et notre valeur viennent de Dieu.</p><div class="mt8">${chips(W.CATS.map(c => [c.id, c.n]), affCat, "aff-cat")}</div>
      ${W.AFFIRMATIONS.filter(a => a.cat === affCat).map(a => `<div class="card mt8"><div class="row" style="align-items:flex-start"><p class="affirm grow" style="font-size:22px">${esc(a.t)}</p>${heartBtn(a.id)}</div><div class="aref">${esc(a.ref)}</div>${readBtn(a.ref)}</div>`).join("")}`;
  else body = favBody();
  const TABS = [["jour", "☀️ Aujourd'hui"], ["journal", "📓 Mon journal"], ["defis", "🔥 Défis"], ["rocher", "🪨 Le Rocher"], ["affirm", "📜 Vérités"], ["favoris", "❤️ Favoris"], ...(tab === "bible" ? [["bible", "📖 Bible"]] : [])];
  $app.innerHTML = header("Parole", "Pour l'âme et l'esprit · gratuit, pour toujours") + `<main class="page">${chips(TABS, tab, "word-tab")}${body}</main>${tabbar("word")}`;
  if (tab === "bible") afterBible();
};
actions["word-tab"] = (b, d) => { tab = d.v; R.param = d.v; history.replaceState(null, "", "#/word/" + d.v); rerender(false); window.scrollTo(0, 0); };
actions["aff-cat"] = (b, d) => { affCat = d.v; tab = "affirm"; R.param = "affirm"; routes.word(); };

// Jour de repos : le dimanche par défaut (réglable dans le profil)
export const sabbatOn = (d = today()) => { const sb = S().settings?.sabbat; if (sb && sb.on === false) return false; return ((new Date(d + "T12:00:00").getDay() + 6) % 7) === (sb?.dow ?? 6); };
export function sabbatCard() {
  const m = F.SABBAT[Math.floor(Date.now() / 6048e5) % F.SABBAT.length];
  return `<div class="daycard mt12" style="background:linear-gradient(135deg,#2F3B2A,#55623F)"><div class="deco">🕊️</div><div class="lbl" style="color:#fff;opacity:.85">Jour de repos</div><p class="affirm" style="font-size:20px;margin-top:8px">${esc(m.m)}</p>
    <p class="small" style="opacity:.92;margin:8px 0 0">« ${esc(m.t)} »</p><div class="aref">${esc(m.ref)}</div></div>`;
}
const JQ = { sleep: "Sommeil", food: "Nourriture", move: "Mouvement" };
const HEART = [["proche", "🙏 Proche de Dieu"], ["lutte", "⚔️ En lutte"], ["tiede", "🌫️ Tiède"], ["loin", "🏚️ Loin de lui"]];
const LUTTES = ["Paresse", "Orgueil", "Découragement", "Gourmandise", "Colère", "Inquiétude", "Convoitise", "Impatience", "Mensonge", "Écrans"];
const jOf = (d) => S().journal?.[d] || {};
function dayBody() {
  const af = W.affirmationOfDay(), v = W.verseOfDay(), j = jOf(today()), ch = S().challenge, C = ch && F.CHALLENGES.find(x => x.id === ch.id);
  const dayN = C ? Math.min(7, Object.keys(ch.done || {}).length + 1) : 0, cd = C && C.days[dayN - 1];
  return `${sabbatOn() ? sabbatCard() : ""}
    <div class="card mt12"><div class="row between"><span class="lbl">📓 Bilan de la chair et de l'esprit</span><span class="xs muted">30 s</span></div>
      ${j.heart ? `<p class="small mt8" style="margin-bottom:0">Fait aujourd'hui : ${Object.keys(JQ).map(k => `${JQ[k]} ${j.body?.[k] === 2 ? "✅" : j.body?.[k] === 1 ? "🟡" : "❌"}`).join(" · ")} · ${esc(HEART.find(h => h[0] === j.heart)?.[1] || "")}</p><button class="link xs mt4" data-a="word-tab" data-v="journal">Relire ou compléter</button>`
        : `<p class="small mt8">As-tu honoré ton corps aujourd'hui ? Où en est ton cœur face à Dieu ?</p><button class="btn btn-red btn-sm mt4" data-a="word-tab" data-v="journal">Faire mon bilan</button>`}</div>
    ${C ? `<button class="card tap mt12" data-a="word-tab" data-v="defis" style="display:block;width:100%;text-align:left"><div class="lbl">${C.e} Défi · ${esc(C.n)} · jour ${dayN}/7</div><b class="h3 mt4" style="display:block">${esc(cd.n)}</b><p class="small muted" style="margin:4px 0 0">${esc(cd.ref)} · ${esc(cd.act)}</p></button>`
      : `<button class="card tap mt12" data-a="word-tab" data-v="defis" style="display:flex;align-items:center;gap:12px"><span style="font-size:28px">🔥</span><span class="grow"><b>Commencer un défi de 7 jours</b><br><span class="small muted">Maîtrise de soi, vanité de l'effort sans Dieu, force dans la faiblesse…</span></span>${I.chev}</button>`}
    <h2 class="sec">📜 Parole du jour</h2>
    <div class="card"><div class="row" style="align-items:flex-start"><div class="grow">${W.wordCard(v)}</div>${heartBtn(v.id)}</div>${readBtn(v.ref)}</div>
    <div class="daycard mt12"><div class="deco">✝</div><div class="row between" style="align-items:flex-start"><p class="affirm grow">${esc(af.t)}</p>${heartBtn(af.id)}</div><div class="aref">${esc(af.ref)}</div>
      <div class="row mt16" style="gap:8px"><button class="btn btn-ghost btn-sm" data-a="share" data-t="${esc(af.t)}">Partager</button></div></div>
    <button class="card tap mt16" data-a="word-tab" data-v="rocher" style="display:flex;align-items:center;gap:12px"><span style="font-size:28px">🪨</span><span class="grow"><b>Le Rocher</b><br><span class="small muted">Pourquoi le sport ne suffit pas, qui est Jésus, naître de nouveau</span></span>${I.chev}</button>
    <p class="xs muted mt12 center">Pour l'étude complète, garde ta Bible papier. <button class="link xs" data-a="bible-open">Ouvrir le texte de la Bible ici</button></p>`;
}
actions["bible-open"] = () => { tab = "bible"; R.param = "bible"; history.replaceState(null, "", "#/word/bible"); rerender(false); window.scrollTo(0, 0); };
// ---------- Journal du Bâtisseur ----------
let jDay = null;
function journalBody() {
  const d = jDay || today(), j = jOf(d), b = j.body || {}, prayers = S().prayers || [];
  const lvl = (k) => [[2, "Oui"], [1, "Un peu"], [0, "Non"]].map(([v, l]) => `<button class="chip ${b[k] === v ? "on" : ""}" data-a="jr-body" data-k="${k}" data-v="${v}">${l}</button>`).join("");
  const hist = Object.entries(S().journal || {}).sort((x, y) => y[0].localeCompare(x[0])).slice(0, 28);
  const freq = {}; hist.forEach(([, e]) => (e.struggles || []).forEach(s => freq[s] = (freq[s] || 0) + 1));
  const top = Object.entries(freq).sort((a, b2) => b2[1] - a[1]).slice(0, 3);
  return `<div class="row between mt12"><button class="icon-btn" data-a="jr-day" data-v="-1" aria-label="Jour précédent">${I.back}</button><b class="h3" style="text-transform:capitalize">${d === today() ? "Aujourd'hui" : fmtDate(d)}</b><button class="icon-btn" data-a="jr-day" data-v="1" aria-label="Jour suivant" style="transform:scaleX(-1);${d === today() ? "visibility:hidden" : ""}">${I.back}</button></div>
    <div class="card mt8"><div class="lbl">🏋️ As-tu honoré ton corps ?</div>${Object.entries(JQ).map(([k, l]) => `<div class="row between mt8" style="gap:6px"><span class="small" style="flex:none;width:92px">${l}</span><div class="chips wrap" style="justify-content:flex-end">${lvl(k)}</div></div>`).join("")}</div>
    <div class="card mt12"><div class="lbl">✝ Où en est ton cœur face à Dieu ?</div><div class="chips wrap mt8">${HEART.map(([k, l]) => `<button class="chip ${j.heart === k ? "on" : ""}" data-a="jr-heart" data-v="${k}">${l}</button>`).join("")}</div>
      <div class="lbl mt12">Mes luttes du jour</div><div class="chips wrap mt8">${LUTTES.map(l => `<button class="chip ${(j.struggles || []).includes(l) ? "on" : ""}" data-a="jr-str" data-v="${l}">${l}</button>`).join("")}</div>
      <label class="field mt12"><span>Ce que je retiens, ce que je confesse</span><textarea rows="3" data-c="jr-note" data-d="${d}" placeholder="Écris librement : ça reste sur ton téléphone.">${esc(j.note || "")}</textarea></label></div>
    <h2 class="sec">🙏 Mes prières</h2>
    <form data-f="jr-pray" class="row" style="gap:8px"><input name="t" class="inp grow" style="text-align:left" maxlength="200" placeholder="Un sujet de prière, une requête"><button class="btn btn-red btn-sm" style="width:auto">+</button></form>
    ${prayers.length ? `<div class="list mt8">${prayers.slice().reverse().map(p => `<div class="li" style="gap:8px"><button class="rk" data-a="jr-ans" data-id="${p.id}" aria-label="Exaucée" style="width:28px;height:28px;border-radius:50%;border:1.5px solid var(--line);background:${p.ans ? "var(--gradbtn)" : "var(--paper)"};color:#fff;flex:none">${p.ans ? "✓" : ""}</button><span class="grow small" style="${p.ans ? "text-decoration:line-through;opacity:.7" : ""}">${esc(p.t)}<br><span class="xs muted">${fmtDate(p.d, { day: "numeric", month: "short" })}${p.ans ? ` · exaucée le ${fmtDate(p.ans, { day: "numeric", month: "short" })}` : ""}</span></span><button class="icon-btn sm" data-a="jr-pdel" data-id="${p.id}" aria-label="Supprimer">${I.close}</button></div>`).join("")}</div>` : `<p class="xs muted mt8">Note tes sujets de prière et coche-les quand Dieu répond : tu verras sa fidélité au fil des mois.</p>`}
    <h2 class="sec">📈 Au fil des semaines</h2>
    ${hist.length ? `<div class="card">${top.length ? `<p class="small" style="margin-top:0">Tes luttes les plus fréquentes (4 semaines) : ${top.map(([k, n]) => `<b>${esc(k)}</b> (${n})`).join(", ")}.</p>` : ""}
      <div class="list">${hist.map(([dd, e]) => `<button class="li" data-a="jr-goto" data-v="${dd}"><span class="grow small"><b style="text-transform:capitalize">${fmtDate(dd, { weekday: "short", day: "numeric", month: "short" })}</b> · ${Object.keys(JQ).map(k => e.body?.[k] === 2 ? "✅" : e.body?.[k] === 1 ? "🟡" : e.body?.[k] === 0 ? "❌" : "·").join("")} ${HEART.find(h => h[0] === e.heart)?.[1].split(" ")[0] || ""}<br><span class="xs muted">${esc((e.struggles || []).join(", "))}${e.note ? ` · ${esc(e.note.slice(0, 60))}${e.note.length > 60 ? "…" : ""}` : ""}</span></span>${I.chev}</button>`).join("")}</div></div>` : `<p class="xs muted">Ton historique apparaîtra ici.</p>`}
    <p class="xs muted mt12">Ton journal reste sur ton téléphone. Il n'est pas envoyé à ton coach.</p>`;
}
const jSet = (fn) => update(st => { st.journal = st.journal || {}; const d = jDay || today(); st.journal[d] = st.journal[d] || {}; fn(st.journal[d]); });
actions["jr-day"] = (b, d) => { const n = addDays(jDay || today(), +d.v); jDay = n >= today() ? null : n; rerender(); };
actions["jr-goto"] = (b, d) => { jDay = d.v === today() ? null : d.v; rerender(false); window.scrollTo(0, 0); };
actions["jr-body"] = (b, d) => { jSet(j => { j.body = j.body || {}; j.body[d.k] = +d.v; }); buzz(8); rerender(); };
actions["jr-heart"] = (b, d) => { jSet(j => j.heart = d.v); buzz(8); rerender(); };
actions["jr-str"] = (b, d) => { jSet(j => { const l = new Set(j.struggles || []); l.has(d.v) ? l.delete(d.v) : l.add(d.v); j.struggles = [...l]; }); rerender(); };
changes["jr-note"] = (el) => { update(st => { st.journal = st.journal || {}; (st.journal[el.dataset.d] = st.journal[el.dataset.d] || {}).note = el.value.trim(); }); toast("Gardé dans ton journal"); };
forms["jr-pray"] = (v) => { if (!v.t.trim()) return; update(st => st.prayers = [...(st.prayers || []), { id: Date.now(), t: v.t.trim(), d: today(), ans: null }]); rerender(); };
actions["jr-ans"] = (b, d) => { update(st => { const p = st.prayers.find(x => x.id === +d.id); p.ans = p.ans ? null : today(); }); buzz(); rerender(); };
actions["jr-pdel"] = (b, d) => { if (!confirm("Supprimer ce sujet de prière ?")) return; update(st => st.prayers = st.prayers.filter(x => x.id !== +d.id)); rerender(); };
// ---------- Défis de discipline et de vérité ----------
let defiOpen = null;
async function defisBody() {
  const ch = S().challenge, C = ch && F.CHALLENGES.find(x => x.id === ch.id);
  if (C) {
    const done = ch.done || {}, cur = Math.min(7, Object.keys(done).length + 1), k = defiOpen ?? cur, dd = C.days[k - 1];
    return `<div class="card grad mt12"><div class="lbl">${C.e} Défi en cours</div><h2 class="h2 mt4">${esc(C.n)}</h2><p class="small mt4" style="margin-bottom:0">${esc(C.lead)}</p>
        <div class="gauge mt8" style="background:rgba(255,255,255,.25)"><i style="width:${Object.keys(done).length / 7 * 100}%;background:#fff"></i></div></div>
      <div class="chips mt12">${C.days.map((x, i) => `<button class="chip ${i + 1 === k ? "on" : ""}" data-a="df-day" data-v="${i + 1}">${done[i + 1] ? "✓ " : ""}Jour ${i + 1}</button>`).join("")}</div>
      <div class="card mt8"><div class="lbl">Jour ${k} · ${esc(dd.ref)}</div><h3 class="h2 mt4">${esc(dd.n)}</h3>
        <p class="verse-q mt8" style="font-family:var(--fs, serif);font-size:17px;line-height:1.5">« ${esc(dd.t)} »</p>${readBtn(dd.ref)}
        <p class="mt12"><b>Question.</b> ${esc(dd.q)}</p><p><b>Action du jour.</b> ${esc(dd.act)}</p>
        <label class="field mt8"><span>Ma réponse</span><textarea rows="3" data-c="df-note" data-k="${k}">${esc(ch.notes?.[k] || "")}</textarea></label>
        ${done[k] ? `<p class="small mt8">✅ Fait le ${fmtDate(done[k], { day: "numeric", month: "long" })}.</p>` : `<button class="btn btn-red mt12" data-a="df-done" data-v="${k}">✅ J'ai médité et agi</button>`}</div>
      ${Object.keys(done).length >= 7 ? `<div class="card mt12 center"><b>🏁 Défi terminé.</b><p class="small muted mt4">Que Dieu fasse croître ce qu'il a semé. Choisis le suivant quand tu veux.</p></div>` : ""}
      <button class="btn btn-ghost btn-sm mt12" data-a="df-stop" style="width:100%">${Object.keys(done).length >= 7 ? "Choisir un autre défi" : "Arrêter ce défi"}</button>`;
  }
  return `<p class="small muted mt12">Sept jours, un thème, un passage par jour, une question qui remet en question, et une action concrète pour ton corps et ton foyer.</p>
    ${F.CHALLENGES.map(c => `<div class="card mt8"><div class="row" style="gap:12px"><span style="font-size:30px">${c.e}</span><div class="grow"><b class="h3">${esc(c.n)}</b><p class="small muted" style="margin:4px 0 0">${esc(c.lead)}</p></div></div>
      <p class="xs muted mt8" style="margin-bottom:0">${c.days.map(x => esc(x.ref)).join(" · ")}</p><button class="btn btn-line btn-sm mt8" data-a="df-start" data-id="${c.id}">Commencer</button></div>`).join("")}`;
}
actions["df-start"] = (b, d) => { update(st => st.challenge = { id: d.id, start: today(), done: {}, notes: {} }); defiOpen = null; toast("Défi commencé : jour 1"); rerender(); window.scrollTo(0, 0); };
actions["df-day"] = (b, d) => { defiOpen = +d.v; rerender(); };
actions["df-done"] = (b, d) => { update(st => { st.challenge.done = st.challenge.done || {}; st.challenge.done[d.v] = today(); }); defiOpen = null; buzz(); toast("Jour validé"); rerender(); };
actions["df-stop"] = () => { if (Object.keys(S().challenge?.done || {}).length < 7 && !confirm("Arrêter ce défi ?")) return; update(st => { st.challengesDone = [...(st.challengesDone || []), st.challenge]; st.challenge = null; }); rerender(); };
changes["df-note"] = (el) => update(st => { st.challenge.notes = st.challenge.notes || {}; st.challenge.notes[el.dataset.k] = el.value.trim(); });
// ---------- Le Rocher ----------
function rocherBody() {
  return `<div class="card mt12"><p style="margin:0">Le sport rend fort pour un temps. Ces pages parlent de ce qui demeure. Que tu sois chrétien ou simplement en recherche, prends le temps de les lire.</p></div>
    ${F.ROCHER.map(e => `<button class="card tap mt8" data-a="go" data-r="eternal" data-p="${e.id}" style="display:flex;align-items:center;gap:12px"><span class="grow"><b class="h3">${esc(e.n)}</b><br><span class="small muted">${esc(e.lead)}</span></span>${I.chev}</button>`).join("")}
    <div class="card mt12"><b>💬 Poser une question</b><p class="small muted mt4">Une question sur la foi, un doute, une difficulté ? Écris à Thomas. Il lit et répond lui-même, et garde tes messages pour lui.</p>
      <form data-f="rocher-q"><textarea name="q" rows="3" class="inp" style="text-align:left;height:auto;padding:12px;width:100%;box-sizing:border-box" maxlength="1500" placeholder="Ta question"></textarea><button class="btn btn-red btn-sm mt8" style="width:100%">Envoyer à Thomas</button></form></div>`;
}
forms["rocher-q"] = (v) => { if (!v.q.trim()) return; window.__prefill = "🪨 Question (Le Rocher) : " + v.q.trim(); go("chat"); };

// ---------- Bible ----------
let sel = new Set(), pick = null; // pick: null | "books" | "chapters"
async function bibleBody() {
  const at = S().bibleAt, idx = IDX;
  if (pick === "books") return `<div class="mt12">${seg([["ot", "Ancien Testament"], ["nt", "Nouveau Testament"]], window.__testament || "nt", "bible-test")}</div>
    <div class="chips wrap mt12">${idx.filter(b => (window.__testament || "nt") === "nt" ? b.nt : !b.nt).map(b => `<button class="chip ${b.i === at.b ? "on" : ""}" data-a="bible-book" data-v="${b.i}">${esc(b.name)}</button>`).join("")}</div>`;
  const bk = idx.find(b => b.i === at.b), book = await loadBook(at.b);
  if (pick === "chapters") return `<h2 class="sec">${esc(bk.name)}</h2><div class="cal">${Array.from({ length: bk.n }, (_, i) => `<button class="${i + 1 === at.c ? "today" : ""}" data-a="bible-go" data-b="${at.b}" data-c="${i + 1}"><span>${i + 1}</span></button>`).join("")}</div>`;
  const ch = book.c[at.c - 1] || [], heads = book.s?.[at.c - 1] || {}, hl = S().highlights, notes = S().bibleNotes;
  return `<div class="row between mt12" style="gap:8px"><button class="pill" data-a="bible-pick" data-v="books">${esc(bk.name)} ▾</button><button class="pill" data-a="bible-pick" data-v="chapters">Chapitre ${at.c} ▾</button><button class="pill ic" data-a="bible-find" aria-label="Aller à une référence">${I.search}</button></div>
    <div class="card mt12 bible-text"><h3 class="h2" style="margin:0 0 8px">${esc(bk.name)} ${at.c}</h3>
      ${ch.map((t, i) => { const v = i + 1, k = `${at.b}.${at.c}.${v}`, h = hl[k]; return `${heads[v] ? `<h4>${esc(heads[v])}</h4>` : ""}<span class="verse ${h ? "hl-" + (h.col || h) : ""} ${sel.has(v) ? "sel" : ""}" data-a="verse" data-v="${v}" id="v${v}"><sup>${v}</sup>${esc(t)}${notes[k] ? ` <span title="Note">📝</span>` : ""}</span> `; }).join("")}</div>
    <div class="row between mt12"><button class="btn btn-line btn-sm" data-a="bible-step" data-v="-1" ${at.b === 1 && at.c === 1 ? "disabled" : ""} style="width:auto">← Précédent</button><button class="btn btn-line btn-sm" data-a="bible-step" data-v="1" style="width:auto">Suivant →</button></div>
    <p class="xs muted mt12">Louis Segond 1910, domaine public. Touche un verset pour le surligner, l'annoter ou le garder.</p>`;
}
function afterBible() {
  const h = window.__bibleScroll; if (h) { window.__bibleScroll = null; setTimeout(() => document.getElementById("v" + h)?.scrollIntoView({ block: "center" }), 60); }
  if (sel.size) showHlbar();
}
async function goTo(b, c, v = null) {
  await loadIndex(); const bk = IDX.find(x => x.i === b); if (!bk) return;
  c = Math.max(1, Math.min(bk.n, c)); update(st => st.bibleAt = { b, c }); sel = new Set(v ? [v] : []); pick = null; window.__bibleScroll = v;
  tab = "bible"; if (R.route === "word") { R.param = "bible"; history.replaceState(null, "", "#/word/bible"); routes.word(); } else go("word", "bible");
}
actions["bible-go"] = (b, d) => goTo(+d.b, +d.c);
actions["bible-pick"] = (b, d) => { pick = pick === d.v ? null : d.v; rerender(); };
actions["bible-test"] = (b, d) => { window.__testament = d.v; rerender(); };
actions["bible-book"] = (b, d) => { update(st => st.bibleAt = { b: +d.v, c: 1 }); pick = "chapters"; sel.clear(); rerender(); };
actions["bible-step"] = (b, d) => {
  const at = S().bibleAt, bk = IDX.find(x => x.i === at.b);
  let nb = at.b, nc = at.c + +d.v;
  if (nc < 1) { nb--; if (nb < 1) return; nc = IDX.find(x => x.i === nb).n; }
  if (nc > bk.n) { nb++; if (nb > 66) return; nc = 1; }
  sel.clear(); update(st => st.bibleAt = { b: nb, c: nc }); routes.word().then(() => window.scrollTo(0, 0));
};
actions["read-ref"] = async (b, d) => { await loadIndex(); const r = parseRef(d.ref.replace(/[–—]/g, "-")); if (!r) return toast("Passage introuvable"); goTo(r.b, r.c, r.v); };
actions["bible-find"] = () => {
  sheet(`<h2 class="h2">Aller à…</h2><form data-f="bible-find" class="row mt12" style="gap:8px"><input name="r" class="inp grow" style="text-align:left" placeholder="Jean 3:16, Psaumes 23, Romains 8" autofocus><button class="btn btn-red btn-sm" style="width:auto">OK</button></form>
    <div class="chips wrap mt12">${["Jean 1", "Psaumes 23", "Matthieu 5", "Romains 8", "1 Corinthiens 13", "Philippiens 4", "Ésaïe 40", "Hébreux 12"].map(r => `<button class="chip" data-a="read-ref" data-ref="${r}">${r}</button>`).join("")}</div>`);
};

forms["bible-find"] = (v) => { const r = parseRef(v.r.trim()); if (!r) return toast("Référence introuvable"); closeSheet(); goTo(r.b, r.c, r.v); };

actions.verse = (b, d) => { const v = +d.v; sel.has(v) ? sel.delete(v) : sel.add(v); b.classList.toggle("sel", sel.has(v)); showHlbar(); };
function selRef() {
  const at = S().bibleAt, bk = IDX.find(x => x.i === at.b), vs = [...sel].sort((a, b) => a - b);
  const range = vs.length > 1 && vs.at(-1) - vs[0] === vs.length - 1 ? `${vs[0]}-${vs.at(-1)}` : vs.join(",");
  return { ref: `${bk.name} ${at.c}:${range}`, text: vs.map(v => BOOKS[at.b].c[at.c - 1][v - 1]).join(" "), keys: vs.map(v => `${at.b}.${at.c}.${v}`) };
}
function showHlbar() {
  document.getElementById("hlb")?.remove();
  if (!sel.size) return;
  const { ref, keys } = selRef(), fid = "b:" + keys[0] + (sel.size > 1 ? "+" + (sel.size - 1) : "");
  const el = document.createElement("div"); el.id = "hlb"; el.className = "rest"; el.style.background = "var(--paper)"; el.style.color = "var(--ink)"; el.style.border = "1px solid var(--line)";
  el.innerHTML = `<div class="row between"><b class="small">${esc(ref)}</b><button class="icon-btn" data-a="hl-close" aria-label="Fermer">${I.close}</button></div>
    <div class="hlbar mt8">${[["y", "#FACC15"], ["r", "#F87171"], ["g", "#4ADE80"], ["b", "#60A5FA"]].map(([c, col]) => `<button class="dot" data-a="hl" data-v="${c}" style="background:${col}" aria-label="Surligner"></button>`).join("")}<button class="dot" data-a="hl" data-v="" style="background:var(--btn2);border:1px solid var(--line)" aria-label="Effacer">✕</button>
    <span class="grow"></span><button class="icon-btn" data-a="hl-note" aria-label="Note">📝</button><button class="heart ${isFav(fid) ? "on" : ""}" data-a="hl-fav" aria-label="Favori">${I.heart}</button><button class="icon-btn" data-a="hl-share" aria-label="Partager">↗</button></div>`;
  document.body.append(el);
}
actions["hl-close"] = () => { sel.clear(); document.getElementById("hlb")?.remove(); document.querySelectorAll(".verse.sel").forEach(v => v.classList.remove("sel")); };
actions.hl = (b, d) => {
  const at = S().bibleAt;
  update(st => [...sel].forEach(v => { const k = `${at.b}.${at.c}.${v}`; if (d.v) st.highlights[k] = { col: d.v, t: BOOKS[at.b].c[at.c - 1][v - 1], ref: `${IDX.find(x => x.i === at.b).name} ${at.c}:${v}` }; else delete st.highlights[k]; }));
  sel.clear(); document.getElementById("hlb")?.remove(); rerender();
};
actions["hl-note"] = () => {
  const { ref, keys } = selRef(), k = keys[0];
  sheet(`<h2 class="h2">📝 ${esc(ref)}</h2><p class="small muted mt4">${esc(selRef().text)}</p><label class="field mt12"><span>Ma note</span><textarea rows="5" data-c="bnote" data-k="${k}" data-ref="${esc(ref)}" placeholder="Ce que ce verset me dit aujourd'hui…">${esc(S().bibleNotes[k]?.n || "")}</textarea></label><button class="btn btn-red mt12" data-a="note-done">Enregistrer</button>`);
};
changes.bnote = (el) => { const k = el.dataset.k; update(st => { if (el.value.trim()) st.bibleNotes[k] = { n: el.value.trim(), ref: el.dataset.ref, t: selRef().text, d: new Date().toISOString() }; else delete st.bibleNotes[k]; }); };
actions["note-done"] = () => { closeSheet(); toast("Note enregistrée"); sel.clear(); rerender(); };
actions["hl-fav"] = (b) => {
  const { ref, text, keys } = selRef(), id = "b:" + keys[0] + (keys.length > 1 ? "+" + (keys.length - 1) : "");
  update(st => { const on = st.favorites.includes(id); st.favorites = on ? st.favorites.filter(x => x !== id) : [id, ...st.favorites]; st.favBible = st.favBible || {}; if (on) delete st.favBible[id]; else st.favBible[id] = { ref, t: text }; });
  b.classList.toggle("on", isFav(id)); toast(isFav(id) ? "Gardé dans tes favoris" : "Retiré des favoris");
};
actions["hl-share"] = () => { const { ref, text } = selRef(); const t = `« ${text} »\n${ref} (LSG)`; if (navigator.share) navigator.share({ text: t }).catch(() => { }); else { navigator.clipboard?.writeText(t); toast("Copié"); } };

// ---------- Favoris, surlignages, notes ----------
let favTab = "fav";
function favBody() {
  let inner;
  if (favTab === "fav") {
    const favs = S().favorites.map(id => id.startsWith("b:") ? { id, bible: true, ...(S().favBible?.[id] || {}) } : W.byId(id)).filter(f => f && (f.t || f.ref));
    inner = favs.length ? favs.map(f => `<div class="card mt8"><div class="row" style="align-items:flex-start"><div class="grow">${f.cat ? `<p class="affirm" style="font-size:21px">${esc(f.t)}</p><div class="aref">${esc(f.ref)}</div>` : W.wordCard({ t: esc(f.t), ref: esc(f.ref) })}</div>${heartBtn(f.id)}</div>${f.cat ? "" : readBtn(f.ref.replace(/[+,].*$/, ""))}</div>`).join("") : `<div class="empty"><p>Touche le cœur sur une parole qui te parle : elle se retrouve ici. Illimité et gratuit.</p></div>`;
  } else if (favTab === "hl") {
    const hs = Object.entries(S().highlights).filter(([, h]) => h.t);
    inner = hs.length ? hs.reverse().map(([k, h]) => `<button class="card tap mt8" data-a="read-ref" data-ref="${esc(h.ref)}" style="display:block;width:100%;text-align:left"><span class="verse hl-${h.col}" style="cursor:inherit">${esc(h.t)}</span><div class="xs muted mt4">${esc(h.ref)}</div></button>`).join("") : `<div class="empty"><p>Dans la Bible, touche un verset puis une couleur pour le surligner.</p></div>`;
  } else {
    const ns = Object.entries(S().bibleNotes);
    inner = ns.length ? ns.sort((a, b) => (b[1].d || "").localeCompare(a[1].d || "")).map(([k, n]) => `<button class="card tap mt8" data-a="read-ref" data-ref="${esc(n.ref.replace(/[-,].*$/, ""))}" style="display:block;width:100%;text-align:left"><div class="lbl">📝 ${esc(n.ref)}</div><p class="small muted mt4" style="margin-bottom:4px">${esc(n.t || "")}</p><p class="small" style="margin:0">${esc(n.n)}</p></button>`).join("") : `<div class="empty"><p>Tes notes sur les versets apparaîtront ici.</p></div>`;
  }
  return `<div class="mt12">${seg([["fav", "❤️ Favoris"], ["hl", "🖍️ Surlignés"], ["notes", "📝 Notes"]], favTab, "fav-tab")}</div>${inner}`;
}
actions["fav-tab"] = (b, d) => { favTab = d.v; rerender(); };
actions.fav = (b, d) => {
  const on = isFav(d.id);
  update(st => st.favorites = on ? st.favorites.filter(x => x !== d.id) : [d.id, ...st.favorites]);
  b.classList.toggle("on", !on); if (tab === "favoris" && R.route === "word") rerender();
};
actions.share = (b, d) => { const t = d.t + "\n\nCalXsthenos · " + location.origin + location.pathname; if (navigator.share) navigator.share({ text: t }).catch(() => { }); else { navigator.clipboard?.writeText(t); toast("Copié"); } };
actions.declare = () => { const t = W.affirmationOfDay().t; if ("speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(t); u.lang = "fr-FR"; u.rate = .92; speechSynthesis.speak(u); } toast("Répète-la à voix haute, lentement."); };

routes.eternal = () => {
  const e = F.ROCHER.find(x => x.id === R.param) || F.ROCHER[0];
  $app.innerHTML = header(esc(e.n), "", { back: "word" }) + `<main class="page full prose">
    <p class="red" style="font-weight:700">${esc(e.lead)}</p>
    ${e.body.map(p => `<p>${esc(p)}</p>`).join("")}
    ${e.verses.map(v => `<div class="card mt12">${W.wordCard(v)}${readBtn(v.ref)}</div>`).join("")}
    <div class="card mt24 center"><p>Tu as des questions ? Je serais heureux d'en parler avec toi, simplement.</p><button class="btn btn-red mt8" data-a="go" data-r="chat">Écrire à Thomas</button></div>
    <div class="row mt16" style="gap:8px;flex-wrap:wrap">${F.ROCHER.filter(x => x.id !== e.id).map(x => `<button class="chip" data-a="go" data-r="eternal" data-p="${x.id}">${esc(x.n)}</button>`).join("")}</div>
  </main>${tabbar("word")}`;
};
