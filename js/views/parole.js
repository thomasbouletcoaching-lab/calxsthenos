// Parole : verset et affirmation du jour, Bible complète (Louis Segond 1910) avec surlignages et notes,
// affirmations, favoris, « Et après ? ». Tout est gratuit : l'Évangile ne se paie pas.
import { S, update } from "../store.js";
import * as W from "../word.js";
import { $app, esc, toast, routes, R, actions, changes, forms, go, I, header, tabbar, seg, chips, sheet, closeSheet, rerender } from "../core.js";

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
  if (R.param && ["jour", "bible", "affirm", "favoris", "apres"].includes(R.param)) tab = R.param;
  let body = "";
  if (tab === "jour") body = dayBody();
  else if (tab === "bible") body = await bibleBody();
  else if (tab === "affirm") body = `<div class="mt12">${chips(W.CATS.map(c => [c.id, c.n]), affCat, "aff-cat")}</div>
      ${W.AFFIRMATIONS.filter(a => a.cat === affCat).map(a => `<div class="card mt8"><div class="row" style="align-items:flex-start"><p class="affirm grow" style="font-size:22px">${esc(a.t)}</p>${heartBtn(a.id)}</div><div class="aref">${esc(a.ref)}</div></div>`).join("")}`;
  else if (tab === "favoris") body = favBody();
  else body = `<p class="muted mt12">Le corps est utile pour un temps. Ces pages parlent de ce qui dure.</p>
      ${W.ETERNAL.map(e => `<button class="card tap mt8" data-a="go" data-r="eternal" data-p="${e.id}" style="display:flex;align-items:center;gap:12px"><span class="grow"><b class="h3">${esc(e.n)}</b><br><span class="small muted">${esc(e.lead)}</span></span>${I.chev}</button>`).join("")}`;
  $app.innerHTML = header("Parole", "Pour l'âme et l'esprit · gratuit, pour toujours") + `<main class="page">${chips([["jour", "☀️ Aujourd'hui"], ["bible", "📖 Bible"], ["affirm", "💬 Affirmations"], ["favoris", "❤️ Favoris"], ["apres", "✝ Et après ?"]], tab, "word-tab")}${body}</main>${tabbar("word")}`;
  if (tab === "bible") afterBible();
};
actions["word-tab"] = (b, d) => { tab = d.v; R.param = d.v; history.replaceState(null, "", "#/word/" + d.v); routes.word(); };
actions["aff-cat"] = (b, d) => { affCat = d.v; tab = "affirm"; R.param = "affirm"; routes.word(); };

function dayBody() {
  const af = W.affirmationOfDay(), v = W.verseOfDay(), at = S().bibleAt, bk = IDX.find(b => b.i === at.b);
  return `<div class="daycard mt12"><div class="deco">✝</div><div class="row between" style="align-items:flex-start"><p class="affirm grow">${esc(af.t)}</p>${heartBtn(af.id)}</div><div class="aref">${esc(af.ref)}</div>
      <div class="row mt16" style="gap:8px"><button class="btn btn-ghost btn-sm" data-a="share" data-t="${esc(af.t)}">Partager</button><button class="btn btn-ghost btn-sm" data-a="declare">🗣️ Déclarer à voix haute</button></div></div>
    <h2 class="sec">📜 Parole du jour</h2>
    <div class="card"><div class="row" style="align-items:flex-start"><div class="grow">${W.wordCard(v)}</div>${heartBtn(v.id)}</div>${readBtn(v.ref)}</div>
    <h2 class="sec">📖 Continuer ma lecture</h2>
    <button class="card tap" data-a="bible-go" data-b="${at.b}" data-c="${at.c}" style="display:flex;align-items:center;gap:12px"><span style="font-size:30px">📖</span><span class="grow"><b>${esc(bk?.name || "Jean")} ${at.c}</b><br><span class="small muted">La Bible complète, à lire, surligner et annoter</span></span>${I.chev}</button>
    <h2 class="sec">💬 Affirmations</h2>
    <div class="list">${W.CATS.map(c => `<button class="li" data-a="aff-cat" data-v="${c.id}"><span class="grow"><b>${c.n}</b><br><span class="xs muted">${W.AFFIRMATIONS.filter(a => a.cat === c.id).length} affirmations</span></span>${I.chev}</button>`).join("")}</div>
    <button class="card tap mt16" data-a="word-tab" data-v="apres" style="display:flex;align-items:center;gap:12px"><span style="font-size:28px">✝</span><span class="grow"><b>Et après ?</b><br><span class="small muted">Qui est Jésus, naître de nouveau, la vie éternelle</span></span>${I.chev}</button>`;
}

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
  const e = W.ETERNAL.find(x => x.id === R.param) || W.ETERNAL[0];
  $app.innerHTML = header(esc(e.n), "", { back: "word" }) + `<main class="page full prose">
    <p class="red" style="font-weight:700">${esc(e.lead)}</p>
    ${e.body.map(p => `<p>${esc(p)}</p>`).join("")}
    ${e.verses.map(v => `<div class="card mt12">${W.wordCard(v)}${readBtn(v.ref)}</div>`).join("")}
    <div class="card mt24 center"><p>Tu as des questions ? Je serais heureux d'en parler avec toi, simplement.</p><button class="btn btn-red mt8" data-a="go" data-r="chat">Écrire à Thomas</button></div>
  </main>${tabbar("word")}`;
};
