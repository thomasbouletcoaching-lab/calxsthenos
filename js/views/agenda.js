// Agenda : mois et semaine, séances faites / loupées / prévues, déplacer une séance, vue du cycle.
import { S, today } from "../store.js";
import * as E from "../engine.js";
import { $app, esc, fr, routes, actions, go, I, header, tabbar, seg, sheet, closeSheet, toast, fmtDate, addDays, rerender } from "../core.js";

let mode = "month", cursor = null; // cursor = 1er du mois affiché (YYYY-MM-01) ou lundi de la semaine
const MK = { done: "✓", missed: "✕", planned: "•", rest: "–", away: "↪" };
const CLS = { done: "dn", missed: "ms", planned: "pl", rest: "", away: "" };

function monthGrid(first) {
  const d0 = new Date(first + "T12:00:00");
  const last = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate();
  const end = first.slice(0, 8) + String(last).padStart(2, "0");
  const ag = E.agenda(first, end), lead = E.dowOf(first), t = today();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(`<button class="empty" tabindex="-1" aria-hidden="true"></button>`);
  for (let n = 1; n <= last; n++) {
    const k = first.slice(0, 8) + String(n).padStart(2, "0"), a = ag[k];
    cells.push(`<button class="${a ? CLS[a.st] + " has" : ""} ${k === t ? "today" : ""}" data-a="ag-day" data-v="${k}" aria-label="${fmtDate(k)}${a ? " : " + esc(a.title) : ""}"><span>${n}</span><span class="mk">${a ? MK[a.st] : ""}</span></button>`);
  }
  const stats = Object.values(ag).reduce((o, a) => (o[a.st] = (o[a.st] || 0) + 1, o), {});
  return { html: `<div class="cal">${E.DAY_SHORT.map(d => `<div class="dh">${d}</div>`).join("")}${cells.join("")}</div>`, stats };
}
function weekList(mon) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i)), ag = E.agenda(days[0], days[6]), t = today();
  return `<div class="list">${days.map((k, i) => {
    const a = ag[k];
    const em = a ? { done: "✅", missed: "❌", planned: "🏋️", rest: "😌", away: "↪️" }[a.st] : "·";
    const sub = !a ? "Repos" : a.st === "done" ? "Faite" : a.st === "missed" ? "Loupée" : a.st === "planned" ? (a.moved ? "Prévue (déplacée)" : "Prévue") : a.st === "away" ? `Déplacée au ${fmtDate(a.to, { weekday: "long", day: "numeric" })}` : "Repos choisi";
    return `<button class="li" data-a="ag-day" data-v="${k}" style="${k === t ? "box-shadow:0 0 0 2px var(--red) inset;border-radius:14px" : ""}"><span class="em" style="font-size:22px">${em}</span><span class="grow"><b>${E.DAY_NAMES[i]} ${Number(k.slice(8))}</b><br><span class="small muted">${a && a.st !== "rest" && a.st !== "away" ? esc(a.title) + " · " : ""}${sub}</span></span>${I.chev}</button>`;
  }).join("")}</div>`;
}
function cycleBlock() {
  const ns = E.nextSession(); if (!ns) return "";
  const ov = E.cycleOverview(ns.p);
  return `<h2 class="sec">🎯 Mon cycle <small>${ov.weeks} semaines · cycle ${ns.cycle}</small></h2>
    <div class="card"><div class="lbl">${esc(ns.p.n || ns.p.name || "Programme")}</div>
    <div class="gauge mt8"><i style="width:${Math.round((ns.week - 1) / ov.weeks * 100)}%"></i></div>
    <div class="cycle mt12">${ov.rows.map(r => `<div class="wk ${r.w === ns.week ? "cur" : ""}"><b class="num">S${r.w}</b><span><b class="small">${esc(r.phase)}</b>${r.w < ns.week ? ` <span class="tag g">faite</span>` : r.w === ns.week ? ` <span class="tag r">en cours</span>` : ""}<br><span class="xs muted">${ov.kinds.slice(0, 3).map(k => `${E.KIND_LABEL[k] || k} ${esc(r.schemes[k])}`).join(" · ")}</span></span></div>`).join("")}</div>
    <p class="xs muted mt8">Les séries, répétitions et RPE changent chaque semaine. Tes charges suivent tes performances réelles.</p></div>`;
}

// Les vues de l'agenda vivent maintenant dans l'accueil (Semaine, Mois, Année)
export const AG = { week: null, month: null, year: null };
export function agendaWeekView() {
  const t = today(); if (!AG.week) AG.week = addDays(t, -E.dowOf(t));
  return `${navRow("week", `Semaine du ${fmtDate(AG.week, { day: "numeric", month: "long" })}`)}<div class="mt12">${weekList(AG.week)}</div>`;
}
export function agendaMonthView() {
  const t = today(); if (!AG.month) AG.month = t.slice(0, 8) + "01";
  const g = monthGrid(AG.month), title = new Date(AG.month + "T12:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return `${navRow("month", title)}<div class="card mt12">${g.html}<div class="legend"><span><i style="background:var(--good)"></i>Faite ${g.stats.done || 0}</span><span><i style="background:var(--red)"></i>Loupée ${g.stats.missed || 0}</span><span><i style="background:#2563EB"></i>Prévue ${g.stats.planned || 0}</span></div></div>
    <p class="small muted center mt8">Touche un jour pour voir la séance, la déplacer ou prendre un jour de repos.</p>${cycleBlock()}`;
}
export function agendaYearView(extra = "") {
  const y = AG.year || new Date().getFullYear(), t = today();
  const months = Array.from({ length: 12 }, (_, m) => `${y}-${String(m + 1).padStart(2, "0")}-01`);
  const ag = E.agenda(`${y}-01-01`, `${y}-12-31`);
  const all = Object.values(ag), done = all.filter(a => a.st === "done").length, missed = all.filter(a => a.st === "missed").length;
  const ws = S().workouts.filter(w => w.end.slice(0, 4) === String(y));
  const ton = ws.reduce((a, w) => a + (w.volume || 0), 0);
  const mini = (first) => { const d0 = new Date(first + "T12:00:00"), last = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate(), lead = E.dowOf(first);
    let c = ""; for (let i = 0; i < lead; i++) c += `<i class="e"></i>`;
    for (let n = 1; n <= last; n++) { const k = first.slice(0, 8) + String(n).padStart(2, "0"), a = ag[k]; c += `<i class="${a ? CLS[a.st] : ""} ${k === t ? "t" : ""}"></i>`; }
    const n = Object.entries(ag).filter(([k, a]) => k.startsWith(first.slice(0, 7)) && a.st === "done").length;
    return `<button class="ymon" data-a="ag-open-month" data-v="${first}"><b>${d0.toLocaleDateString("fr-FR", { month: "short" })}</b><span class="xs muted">${n ? n + " séance" + (n > 1 ? "s" : "") : ""}</span><div class="ygrid">${c}</div></button>`; };
  return `${navRow("year", String(y))}<div class="card mt12"><div class="stat3"><div><b>${done}</b><span>séances faites</span></div><div><b>${fr(ton / 1000, 1)}</b><span>tonnes soulevées</span></div><div><b>${done + missed ? Math.round(done / (done + missed) * 100) + " %" : "–"}</b><span>régularité</span></div></div></div>
    ${extra}<div class="yeargrid mt12">${months.map(mini).join("")}</div>`;
}
function navRow(m, title) { return `<div class="row between mt16"><button class="icon-btn" data-a="ag-nav" data-m="${m}" data-v="-1" aria-label="Précédent">${I.back}</button><b class="h3" style="text-transform:capitalize">${esc(title)}</b><button class="icon-btn" data-a="ag-nav" data-m="${m}" data-v="1" aria-label="Suivant" style="transform:scaleX(-1)">${I.back}</button></div>`; }
actions["ag-nav"] = (b, d) => {
  const m = d.m, v = +d.v;
  if (m === "month") { const x = new Date(AG.month + "T12:00:00"); x.setMonth(x.getMonth() + v, 1); AG.month = today(x).slice(0, 8) + "01"; }
  else if (m === "week") AG.week = addDays(AG.week, 7 * v);
  else AG.year = (AG.year || new Date().getFullYear()) + v;
  rerender();
};
actions["ag-open-month"] = (b, d) => { AG.month = d.v; go("home", "month"); };
routes.agenda = () => go("home", "month");

actions["ag-day"] = (b, d) => {
  const k = d.v, a = E.agenda(k, k)[k], t = today();
  const opts = Array.from({ length: 7 }, (_, i) => addDays(k, i - 3)).filter(x => x >= t && x !== k);
  let html = `<h2 class="h1">${fmtDate(k)}</h2>`;
  if (a?.st === "done") html += a.w.map(w => `<div class="card mt12"><div class="lbl">✅ Séance faite</div><b class="h3">${esc(w.title)}</b><p class="small muted mt4">${w.setsDone} séries · ${(w.volume / 1000).toFixed(1).replace(".", ",")} t · ${Math.round((new Date(w.end) - new Date(w.start)) / 6e4)} min</p>
      <div class="small mt8">${w.exercises.filter(e => e.sets.some(s => s.done)).map(e => `<div class="row between"><span>${esc(e.name)}</span><span class="muted">${e.sets.filter(s => s.done && s.type !== "W").map(s => s.kg ? `${E.fmtKg(s.kg)}×${s.reps}` : s.reps).join(" · ")}</span></div>`).join("")}</div></div>`).join("");
  else if (a?.st === "planned") html += `<div class="card mt12"><div class="lbl">🏋️ Prévue</div><b class="h3">${esc(a.title)}</b>
      ${k === t ? `<button class="btn btn-red mt12" data-a="start">Commencer maintenant</button>` : ""}
      ${opts.length ? `<h3 class="sec">Déplacer au</h3><div class="chips wrap">${opts.map(x => `<button class="chip" data-a="ag-move" data-f="${k}" data-v="${x}">${fmtDate(x, { weekday: "short", day: "numeric" })}</button>`).join("")}</div>` : ""}
      <button class="btn btn-line btn-sm mt12" data-a="ag-skip" data-v="${k}">Prendre ce jour en repos</button></div>`;
  else if (a?.st === "missed") html += `<div class="card mt12"><div class="lbl">❌ Séance loupée</div><b class="h3">${esc(a.title)}</b><p class="small muted mt4">Pas de culpabilité : le programme reprend à la prochaine séance, sans rien sauter.</p></div>`;
  else if (a?.st === "away") html += `<div class="card mt12"><p>Séance déplacée au <b>${fmtDate(a.to)}</b>.</p><button class="btn btn-line btn-sm mt8" data-a="ag-move" data-f="${k}" data-v="${k}">Annuler le déplacement</button></div>`;
  else if (a?.st === "rest") html += `<div class="card mt12"><p>Repos choisi ce jour-là.</p><button class="btn btn-line btn-sm mt8" data-a="ag-skip" data-v="${k}">Remettre la séance</button></div>`;
  else html += `<div class="card mt12"><p class="muted">Jour de repos. Récupérer fait partie du programme.</p>${k === t ? `<button class="btn btn-line btn-sm mt8" data-a="free-session">Faire une séance libre</button>` : ""}</div>`;
  sheet(html);
};
actions["ag-move"] = (b, d) => { E.moveSession(d.f, d.v); closeSheet(); toast(d.f === d.v ? "Déplacement annulé" : "Séance déplacée"); rerender(); };
actions["ag-skip"] = (b, d) => { E.toggleSkip(d.v); closeSheet(); toast("Agenda mis à jour"); rerender(); };
