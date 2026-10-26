// Entraînement : programme et cycle, banque, programme perso, carnet de séance, stats, records, simulateur, fiches.
import { S, update, save, today } from "../store.js";
import * as E from "../engine.js";
import * as W from "../word.js";
import { CONFIG } from "../config.js";
import { $app, esc, num, fr, buzz, toast, routes, R, actions, changes, forms, go, I, header, tabbar, chips, sheet, closeSheet, lockVeil, lineChart, barChart, hbars, wordOn, premium, rank, programOpen, weekOpen, fmtDate, addDays, rerender, onLeave } from "../core.js";
import { pushStats } from "../sync.js";

const kgTxt = (v) => v == null || v === "" ? "" : E.fmtKg(v);
const adv = () => S().settings.adv ?? (S().profile?.level === "advanced");
let tab = "programme";
const TABS = [["programme", "🎯 Programme"], ["stats", "📈 Stats"], ["outils", "🧮 Records et outils"], ["exos", "📖 Exercices"], ["banque", "🗂️ Banque"], ["historique", "🕘 Historique"]];

// =====================================================================
// PAGE ENTRAÎNEMENT
// =====================================================================
routes.train = async () => {
  await Promise.all([E.loadPrograms(), E.loadFiches(), E.loadLib()]);
  if (R.param && TABS.some(t => t[0] === R.param)) tab = R.param;
  const ns = E.nextSession();
  let body = "";
  if (tab === "programme") body = programBody(ns);
  else if (tab === "stats") body = statsBody();
  else if (tab === "outils") body = toolsBody();
  else if (tab === "exos") body = exosBody();
  else if (tab === "banque") body = bankBody();
  else body = historyBody();
  $app.innerHTML = header("Entraînement", ns ? esc(ns.p.name.split("·")[0].trim()) : "") + `<main class="page">${chips(TABS, tab, "train-tab")}${body}</main>${tabbar("train")}`;
  if (tab === "exos") bindExoSearch();
};
actions["train-tab"] = (b, d) => { tab = d.v; R.param = d.v; history.replaceState(null, "", "#/train/" + d.v); routes.train(); };

let viewWeek = null;
function programBody(ns) {
  if (!ns) return `<p class="empty">Choisis un programme dans la banque.</p>`;
  const { p } = ns, cur = S().current, cyc = ns.cycle;
  if (viewWeek == null || viewWeek > ns.weeks) viewWeek = ns.week;
  const vw = viewWeek, blocked = !weekOpen(vw), done = E.doneIn(p.id, cyc, vw);
  const alerts = E.injuryAlerts(), pc = S().settings.pace || "normal";
  const weekDone = (w) => E.doneIn(p.id, cyc, w).size;
  const chipsW = Array.from({ length: ns.weeks }, (_, i) => i + 1).map(w => { const n = weekDone(w), all = n >= p.s.length;
    return `<button class="chip ${w === vw ? "on" : ""}" data-a="cy-week" data-v="${w}" style="${w === ns.week && w !== vw ? "box-shadow:0 0 0 2px var(--red) inset" : ""}">S${w}${all ? " ✓" : n ? ` ${n}/${p.s.length}` : ""}</button>`; }).join("");
  return `<div class="card grad mt12"><div class="lbl">🎯 Ton programme · cycle ${cyc}</div><h2 class="h2 mt4">${esc(p.name)}</h2>
      <p class="small mt8">Tu es en <b>semaine ${ns.week}</b> sur ${ns.weeks} · ${esc(ns.phase)}</p><div class="gauge mt8" style="background:rgba(255,255,255,.25)"><i style="width:${Math.round((ns.week - 1 + weekDone(ns.week) / p.s.length) / ns.weeks * 100)}%;background:#fff"></i></div></div>
    ${alerts.length ? `<div class="card mt12" style="box-shadow:0 0 0 2px var(--warn) inset"><div class="lbl">⚠️ Alertes blessure</div>${alerts.map(a => `<p class="small mt8" style="margin-bottom:0"><b>${esc(a.name)}</b> · ${a.count} fois en 3 semaines<br><span class="muted">${esc(a.last.note)}</span></p>`).join("")}<p class="xs muted mt8">Réduis la charge, change d'exercice (🔄 dans la séance) ou parles-en à Thomas. Si la douleur persiste, consulte un professionnel de santé.</p></div>` : ""}
    <h2 class="sec">🗓️ Mon cycle <small>touche une semaine</small></h2>
    <div class="chips">${chipsW}</div>
    <div class="card mt8"><div class="row between"><div><b class="h3">Semaine ${vw}</b> <span class="tag ${vw === ns.week ? "r" : ""}">${vw === ns.week ? "en cours" : vw < ns.week ? "passée" : "à venir"}</span><div class="xs muted mt4">${esc(E.phaseOf(p, vw))} · ${done.size}/${p.s.length} séances faites</div></div>
      ${vw !== ns.week ? `<button class="btn btn-line btn-xs" data-a="cy-place" data-v="${vw}">Me placer ici</button>` : ""}</div>
      ${p.s.map((se, i) => { const isNext = vw === ns.week && i === ns.idx % p.s.length, isDone = done.has(i);
        return `<div class="mt12" style="border-top:1px solid var(--line);padding-top:12px${isNext ? ";box-shadow:inset 3px 0 0 var(--red);padding-left:10px" : ""}">
          <div class="row between"><b>${isDone ? "✅ " : isNext ? "👉 " : ""}${esc(se[0])}</b><span class="xs muted">${esc(se[1] || "")}</span></div>
          ${se[2].map(e => `<div class="row between xs" style="padding:3px 0;gap:8px"><span class="grow muted">${esc(S().swaps[e[0]] || e[0])}</span><span style="white-space:nowrap">${esc(E.schemeFor(p, e, vw).replace(/x/i, "×"))}</span></div>`).join("")}
          ${blocked ? "" : isDone ? `<button class="link xs mt4" data-a="cy-do" data-w="${vw}" data-i="${i}">Refaire cette séance</button>` : `<button class="btn ${isNext ? "btn-red" : "btn-line"} btn-sm mt8" data-a="cy-do" data-w="${vw}" data-i="${i}">${cur ? "Reprendre ma séance en cours" : isNext ? "Commencer cette séance" : "Faire cette séance"}</button>`}</div>`; }).join("")}
      ${blocked ? `<button class="btn btn-red mt12" data-a="go" data-r="offers">🔓 Débloquer la semaine ${vw}</button>` : ""}</div>
    <button class="btn btn-line btn-sm mt8" data-a="free-session" style="width:100%">Séance libre (hors programme)</button>

    <h2 class="sec">📈 Ma surcharge progressive</h2>
    <div class="card"><div class="lbl">Rythme de progression</div>${chips(Object.entries(E.PROG_PACE).map(([k, v]) => [k, v.n]), pc, "pace-set")}
      <p class="xs muted mt8" style="margin-bottom:0">${{ prudent: "Charges calculées 5 % plus légères, et petits sauts quand c'est facile. Idéal en reprise ou avec une gêne.", normal: "Charges calculées sur ton 1RM estimé, un saut de charge quand tu es sous le RPE prévu.", ambitieux: "Charges 3 % plus lourdes et sauts plus grands. Pour les périodes où tout va bien (sommeil, nutrition)." }[pc]}</p>
      <p class="xs muted mt8" style="margin-bottom:0">Pendant la séance, le bouton <b>📈 Progression</b> de chaque exercice permet d'ajuster la charge, les reps ou ton 1RM estimé.</p></div>
    ${p.rules?.length ? `<h2 class="sec">📏 Les règles</h2><div class="card"><ul style="margin:0;padding-left:18px" class="small">${p.rules.map(r => `<li style="margin-bottom:8px">${esc(r)}</li>`).join("")}</ul></div>` : ""}
    ${p.desc ? `<p class="small muted mt12">${esc(p.desc)}</p>` : ""}
    <div class="row mt12" style="gap:8px"><button class="btn btn-line btn-sm grow" data-a="go" data-r="kb">📚 Connaissances</button><button class="btn btn-line btn-sm grow" data-a="go" data-r="builder">✏️ Créer mon programme</button></div>`;
}
actions["cy-week"] = (b, d) => { viewWeek = +d.v; rerender(); };
actions["cy-place"] = (b, d) => { if (S().current) return toast("Termine d'abord ta séance en cours."); E.placeIn(+d.v); viewWeek = +d.v; toast(`Tu es maintenant en semaine ${d.v}`); rerender(); };
actions["cy-do"] = async (b, d) => {
  if (S().current) { sessionStorage.removeItem("cxs.min"); return go("workout"); }
  E.placeIn(+d.w, +d.i); viewWeek = +d.w; await actions.start();
};
actions["pace-set"] = (b, d) => { update(st => st.settings.pace = d.v); toast(`Rythme ${E.PROG_PACE[d.v].n.toLowerCase()} : appliqué dès ta prochaine séance`); rerender(); };

function bankBody() {
  const mine = S().customPrograms || [];
  return `<p class="small muted mt12">Les programmes de ${esc(CONFIG.coachName)}, testés en salle. Changer de programme repart en semaine 1 ; tes charges sont conservées.</p>
    <button class="card tap mt8" data-a="go" data-r="builder" style="display:flex;align-items:center;gap:12px"><span style="font-size:28px">✏️</span><span class="grow"><b>Créer mon programme</b><br><span class="small muted">Séances, séries, RPE, techniques, temps de repos${premium() ? "" : " · Premium"}</span></span>${premium() ? I.chev : `<span class="lock">🔒</span>`}</button>
    ${mine.length ? `<h2 class="sec">Mes programmes</h2>${mine.map(pg => progCard(pg, true)).join("")}` : ""}
    <h2 class="sec">La banque</h2>${E.programs().filter(p => !p.custom).map(pg => progCard(pg)).join("")}`;
}
function progCard(pg, mine = false) {
  const open = programOpen(pg.id), cur = pg.id === S().plan?.programId;
  return `<div class="card ${cur ? "hl" : ""} mt8"><div class="row between"><span>${cur ? '<span class="tag r">En cours</span>' : ""}<span class="tag">${esc(pg.lvl || "Perso")}</span><span class="tag">${pg.days.filter(Boolean).length} j</span>${pg.split ? `<span class="tag">${esc(pg.split)}</span>` : ""}</span>${open ? "" : `<span class="lock">🔒 Premium</span>`}</div>
    <h3 class="h3 mt8">${esc(pg.name)}</h3>${pg.prof ? `<p class="small muted mt4">${esc(pg.prof)}</p>` : ""}
    <div class="row mt8" style="gap:8px">${cur ? "" : open ? `<button class="btn btn-line btn-sm" data-a="set-program" data-id="${pg.id}">Choisir</button>` : `<button class="btn btn-line btn-sm" data-a="go" data-r="offers">Débloquer</button>`}${mine ? `<button class="btn btn-ghost btn-sm" data-a="go" data-r="builder" data-p="${pg.id}">Modifier</button>` : ""}</div></div>`;
}
actions["set-program"] = (b, d) => {
  if (S().current) return toast("Termine d'abord ta séance en cours.");
  if (!programOpen(d.id)) return go("offers");
  update(st => st.plan = { programId: d.id, startedAt: today(), week: 1, idx: 0, cycle: 1 });
  tab = "programme"; toast("Programme changé"); pushStats(); routes.train();
};

function historyBody() {
  const ws = S().workouts.slice().reverse();
  return ws.length ? `<div class="list mt12">${ws.slice(0, 60).map(w => `<button class="li" data-a="ag-day" data-v="${today(new Date(w.end))}"><span class="em">${w.free ? "🤸" : "🏋️"}</span><span class="grow"><b>${esc(w.title)}</b><br><span class="xs muted">${new Date(w.end).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · ${w.setsDone} séries · ${(w.volume / 1000).toFixed(1).replace(".", ",")} t</span></span><span class="small muted">${Math.round((new Date(w.end) - new Date(w.start)) / 6e4)} min</span></button>`).join("")}</div>` : `<p class="empty">Tes séances terminées apparaîtront ici.</p>`;
}

// ---------- Statistiques ----------
let period = "month", liftSel = null, volView = "muscle";
function statsBody() {
  const from = { week: addDays(today(), -6), month: addDays(today(), -29), quarter: addDays(today(), -89) }[period];
  const v = E.volumeStats(from);
  const wk = E.activeWeeks(8);
  const free = `<div class="card mt12"><div class="lbl">🔥 Régularité · ${E.streakWeeks()} semaine${E.streakWeeks() > 1 ? "s" : ""} d'affilée</div><div class="mt8">${barChart(wk.map(w => ({ v: w.count, l: `${w.start.getDate()}/${w.start.getMonth() + 1}` })))}</div><p class="xs muted" style="margin:0">Séances par semaine, 8 dernières semaines.</p></div>`;
  const lifts = Object.entries(S().lifts).filter(([, h]) => h.length).sort((a, b) => b[1].length - a[1].length);
  if (!liftSel || !S().lifts[liftSel]) liftSel = lifts[0]?.[0];
  const h = liftSel ? S().lifts[liftSel] : [];
  const mv = E.monthlyVolume(6);
  let volHtml;
  if (volView === "muscle") { const it = Object.entries(v.byMuscle).map(([l, x]) => ({ l, v: x.sets })).sort((a, b) => b.v - a.v); volHtml = it.length ? hbars(it, (x) => fr(x, 1) + " s.") + `<p class="xs muted">Séries effectives : muscle principal = 1, secondaires = ½. Repère : 10 à 20 séries par muscle et par semaine pour progresser.</p>` : `<p class="empty small">Pas encore de séance sur la période.</p>`; }
  else if (volView === "exo") { const it = Object.entries(v.byExercise).map(([l, x]) => ({ l, v: x.ton })).sort((a, b) => b.v - a.v).slice(0, 12); volHtml = it.length ? hbars(it, (x) => fr(x / 1000, 1) + " t") : `<p class="empty small">Pas encore de séance sur la période.</p>`; }
  else if (volView === "seance") volHtml = v.sessions.length ? hbars(v.sessions.slice(-12).map(s => ({ l: `${s.d.slice(8)}/${s.d.slice(5, 7)} ${s.title}`, v: s.ton })), (x) => fr(x / 1000, 1) + " t") : `<p class="empty small">Pas encore de séance sur la période.</p>`;
  else if (volView === "semaine") volHtml = barChart(wk.map(w => ({ v: w.volume / 1000, l: `${w.start.getDate()}/${w.start.getMonth() + 1}` })), { fmt: (x) => fr(x, 1) }) + `<p class="xs muted">Tonnage par semaine (tonnes).</p>`;
  else volHtml = barChart(mv.map(m => ({ v: m.volume / 1000, l: m.label })), { fmt: (x) => fr(x, 1) }) + `<p class="xs muted">Tonnage par mois (tonnes).</p>`;
  const recs = lifts.map(([n, hh]) => [n, Math.max(...hh.map(x => x.e1rm))]).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const locked = !premium();
  return free + `<div class="${locked ? "locked" : ""}" style="position:relative">
    <h2 class="sec">💪 Volume</h2>
    ${chips([["week", "7 jours"], ["month", "30 jours"], ["quarter", "3 mois"]], period, "st-period")}
    <div class="card mt8">${chips([["muscle", "Par muscle"], ["exo", "Par exercice"], ["seance", "Par séance"], ["semaine", "Par semaine"], ["mois", "Par mois"]], volView, "st-vol")}<div class="mt12">${volHtml}</div></div>
    <h2 class="sec">📈 Force estimée (e1RM)</h2>
    ${lifts.length ? `<div class="card">${chips(lifts.slice(0, 12).map(([n]) => [n, esc(n)]), liftSel, "st-lift")}
      <div class="row between mt12"><b class="num" style="font-size:28px">${fr(h.at(-1)?.e1rm, 1)} kg</b><span class="small muted">meilleur ${fr(Math.max(...h.map(x => x.e1rm)), 1)} kg</span></div>
      <div class="mt8">${lineChart(h.map(x => ({ y: x.e1rm, l: x.d.slice(8, 10) + "/" + x.d.slice(5, 7) })), { yfmt: (x) => fr(x) })}</div><p class="xs muted" style="margin:0">1RM estimé à partir de tes séries (charge, reps et RPE).</p></div>` : `<p class="empty small">Tes courbes apparaissent après tes premières séances.</p>`}
    ${recs.length ? `<h2 class="sec">🏆 Records</h2><div class="list">${recs.map(([n, x]) => `<div class="li"><span class="grow small">${esc(n)}</span><span class="num">${fr(x)} kg</span></div>`).join("")}</div>` : ""}
    ${locked ? lockVeil("Premium", "Volume par muscle, par exercice, par séance, par semaine et par mois, courbes de force et records.") : ""}</div>`;
}
actions["st-period"] = (b, d) => { period = d.v; rerender(); };
actions["st-vol"] = (b, d) => { volView = d.v; rerender(); };
actions["st-lift"] = (b, d) => { liftSel = d.v; rerender(); };

// ---------- Records et outils ----------
let simu = { kg: 100, reps: 5, rpe: 9 }, goal = { lift: "squat", target: null };
function toolsBody() {
  const recs = S().profile?.records || {};
  const e = E.e1rm(simu.kg, simu.reps, simu.rpe);
  const gl = E.MAIN_LIFTS.find(m => m[0] === goal.lift);
  const curE = gl ? Math.round(E.currentE1rm(gl[1]) || recs[goal.lift]?.e1rm || 0) : 0;
  const cg = goal.target ? E.cyclesToGoal(curE, goal.target, S().profile?.level) : null;
  return `<h2 class="sec">🏆 Mes records <small>servent à calculer tes charges</small></h2>
    <div class="list">${E.MAIN_LIFTS.map(([k, n]) => { const r = recs[k], cur = Math.round(E.currentE1rm(n)); return `<button class="li" data-a="rec-edit" data-k="${k}"><span class="grow"><b class="small">${esc(n)}</b><br><span class="xs muted">${r ? `saisi : ${E.fmtKg(r.k)} kg × ${r.r}${r.rpe && r.rpe < 10 ? ` à RPE ${r.rpe}` : ""}` : "non renseigné"}</span></span><span class="num">${cur ? cur + " kg" : "–"}</span>${I.chev}</button>`; }).join("")}</div>
    <p class="xs muted mt8">Le chiffre à droite est ton 1RM estimé actuel : il part de ton record saisi, puis se recalcule à chaque séance du carnet.</p>
    <h2 class="sec">🧮 Simulateur de 1RM</h2>
    <div class="card"><div class="grid3"><label class="field"><span>Charge (kg)</span><input inputmode="decimal" value="${E.fmtKg(simu.kg)}" data-c="simu" data-k="kg"></label><label class="field"><span>Reps</span><input inputmode="numeric" value="${simu.reps}" data-c="simu" data-k="reps"></label><label class="field"><span>RPE</span><input inputmode="decimal" value="${String(simu.rpe).replace(".", ",")}" data-c="simu" data-k="rpe"></label></div>
      <div class="center mt12"><div class="lbl">1RM estimé</div><b class="num" style="font-size:42px">${fr(e, 1)} kg</b></div>
      <table class="mt12" style="width:100%;font-size:14px;border-collapse:collapse"><tr class="muted"><th style="text-align:left">Reps</th><th>RPE 10</th><th>RPE 8</th><th>%</th></tr>
      ${[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map(r => `<tr style="border-top:1px solid var(--line)"><td style="padding:6px 0"><b>${r}</b></td><td class="center">${E.fmtKg(E.roundTo(E.loadFor(e, r, 10), 2.5))} kg</td><td class="center">${E.fmtKg(E.roundTo(E.loadFor(e, r, 8), 2.5))} kg</td><td class="center muted">${Math.round(E.pctFor(r, 10))} %</td></tr>`).join("")}</table>
      <p class="xs muted mt8">Formule d'Epley corrigée par les répétitions en réserve (RPE). Fiable entre 1 et 10 reps.</p></div>
    <h2 class="sec">🎯 Mon objectif de performance</h2>
    <div class="card"><div class="grid2"><label class="field"><span>Mouvement</span><select data-c="goal" data-k="lift">${E.MAIN_LIFTS.map(([k, n]) => `<option value="${k}" ${k === goal.lift ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label><label class="field"><span>Objectif 1RM (kg)</span><input inputmode="decimal" value="${goal.target ?? ""}" data-c="goal" data-k="target" placeholder="ex. 140"></label></div>
      <p class="small mt12">Aujourd'hui : <b>${curE ? curE + " kg" : "renseigne ton record"}</b></p>
      ${cg ? cg.cycles ? `<div class="card soft mt8"><b class="h2">${cg.cycles} cycle${cg.cycles > 1 ? "s" : ""} de 12 semaines</b><p class="small muted mt4">soit environ ${cg.months} mois, à raison de +${Math.round(cg.rate * 100)} % par cycle (rythme moyen à ton niveau, si l'entraînement, le sommeil et l'alimentation suivent).</p></div>
        <p class="small mt12">Avec un coach qui ajuste tes charges chaque semaine, tu évites les cycles perdus (plateaux, blessures, mauvais choix d'exercices).</p><button class="btn btn-red mt8" data-a="choose" data-v="suivi">🚀 Candidater au coaching</button>` : `<p class="small mt8">Objectif déjà atteint 🎉 Fixe-toi la marche suivante.</p>` : ""}</div>`;
}
changes.simu = (el) => { const v = num(el.value); if (v > 0) { simu[el.dataset.k] = v; rerender(); } };
changes.goal = (el) => { if (el.dataset.k === "lift") goal.lift = el.value; else goal.target = num(el.value) || null; rerender(); };
actions["rec-edit"] = (b, d) => {
  const n = E.MAIN_LIFTS.find(m => m[0] === d.k)[1], r = S().profile.records?.[d.k];
  sheet(`<h2 class="h2">${esc(n)}</h2><p class="small muted mt4">Une série récente et honnête : la charge, le nombre de reps, et le RPE si tu n'étais pas à l'échec.</p>
    <form data-f="rec" data-k="${d.k}" class="mt12"><div class="grid3"><label class="field"><span>Charge (kg)</span><input name="kg" inputmode="decimal" value="${r ? E.fmtKg(r.k) : ""}" required></label><label class="field"><span>Reps</span><input name="reps" inputmode="numeric" value="${r?.r ?? 1}" required></label><label class="field"><span>RPE</span><input name="rpe" inputmode="decimal" value="${r?.rpe ?? 10}"></label></div>
    <button class="btn btn-red mt12">Enregistrer</button></form>`);
};
forms.rec = (v, f) => {
  const kg = num(v.kg), reps = Math.round(num(v.reps)), rpe = num(v.rpe) || 10;
  if (!(kg > 0 && reps >= 1 && reps <= 20)) return toast("Valeurs invalides");
  E.setRecord(f.dataset.k, kg, reps, rpe); closeSheet(); toast("Record enregistré, charges recalculées"); pushStats(); rerender();
};
routes.simu = async () => { await E.loadPrograms(); $app.innerHTML = header("Records et outils", "", { back: S().current ? "workout" : "train" }) + `<main class="page">${toolsBody()}</main>`; };

// ---------- Exercices et fiches techniques ----------
let exoQ = "", exoFam = "";
function exosBody() {
  const F = E.fiches(); const fams = Object.entries(F.fam || {});
  return `<div class="search mt12">${I.search}<input id="exq" placeholder="Rechercher parmi ${E.allExercises().length} exercices" value="${esc(exoQ)}" autocomplete="off"></div>
    <div class="mt8">${chips([["", "Tous"], ...fams.map(([k, f]) => [k, esc(f.nom.split("(")[0].trim())])], exoFam, "exo-fam")}</div><div id="exlist" class="mt12">${exoList()}</div>`;
}
function exoList() {
  const F = E.fiches(), q = exoQ.toLowerCase();
  const names = E.allExercises().filter(n => (!exoFam || F.ex[n].fam === exoFam) && (!q || n.toLowerCase().includes(q)));
  return names.length ? `<div class="list">${names.slice(0, 120).map(n => `<button class="li" data-a="go" data-r="fiche" data-p="${esc(n)}"><span class="grow">${esc(n)}<br><span class="xs muted">${esc(E.musclesOf(n).join(" · "))}</span></span>${I.chev}</button>`).join("")}</div>` : `<p class="empty small">Aucun exercice trouvé.</p>`;
}
function bindExoSearch() {
  const i = document.getElementById("exq"); if (!i) return;
  i.addEventListener("input", () => { exoQ = i.value; document.getElementById("exlist").innerHTML = exoList(); });
}
actions["exo-fam"] = (b, d) => { exoFam = d.v; rerender(); };

const FIELD = [["exec", "▶️ Exécution"], ["resp", "🌬️ Respiration"], ["erreurs", "⚠️ Erreurs fréquentes"], ["muscles", "💪 Muscles"], ["artic", "🦴 Articulations"], ["plan", "📐 Plan"], ["type", "🏷️ Type"], ["moment", "⚙️ Biomécanique : moments"], ["courbe", "📈 Courbe de résistance"], ["levier", "📏 Leviers et morphologie"], ["conseils", "💡 Conseils de coach"], ["progresser", "🚀 Progresser"], ["prog", "🪜 Progressions"], ["access", "♿ Adaptations"]];
const FREE_FIELDS = ["exec", "resp", "erreurs", "muscles"];
const block = (v) => Array.isArray(v) ? `<ul class="small" style="padding-left:18px;margin:6px 0">${v.map(x => `<li>${esc(typeof x === "string" ? x : Object.values(x).join(" : "))}</li>`).join("")}</ul>` : typeof v === "object" && v ? `<ul class="small" style="padding-left:18px;margin:6px 0">${Object.entries(v).map(([k, x]) => `<li><b>${esc(k)}</b> : ${esc(Array.isArray(x) ? x.join(", ") : x)}</li>`).join("")}</ul>` : `<p class="small" style="margin:6px 0">${esc(v)}</p>`;
routes.fiche = async () => {
  await Promise.all([E.loadFiches(), E.loadLib()]);
  const f = E.ficheOf(R.param);
  const back = S().current ? "workout" : "train";
  if (!f) { $app.innerHTML = header("Fiche", "", { back }) + `<main class="page"><p class="empty">Fiche introuvable.</p></main>`; return; }
  const fam = f.fam || {}, alts = E.alternatives(f.name).slice(0, 10), deep = premium();
  const recordE = Math.round(E.currentE1rm(f.name));
  $app.innerHTML = header("Fiche technique", "", { back }) + `<main class="page">
    <h1 class="h1 mt8" style="color:var(--red)">${esc(f.name)}</h1><p class="small muted">${esc(E.musclesOf(f.name).join(" · "))}${fam.nom ? ` · ${esc(fam.nom)}` : ""}</p>
    ${recordE ? `<div class="card mt12"><div class="lbl">📈 Ton 1RM estimé</div><b class="num" style="font-size:26px">${recordE} kg</b></div>` : ""}
    <div class="card mt12">${f.setup ? `<div class="lbl">🛠️ Installation</div><p class="small mt4">${esc(f.setup)}</p>` : ""}${f.cues?.length ? `<div class="lbl mt12">🎯 Points clés</div>${block(f.cues)}` : ""}${f.note ? `<p class="small muted mt8" style="margin-bottom:0">${esc(f.note)}</p>` : ""}</div>
    ${FIELD.filter(([k]) => fam[k] && (deep || FREE_FIELDS.includes(k))).map(([k, l]) => `<div class="card mt12"><div class="lbl">${l}</div>${block(fam[k])}</div>`).join("")}
    ${deep ? "" : (() => { const lk = FIELD.filter(([k]) => fam[k] && !FREE_FIELDS.includes(k)); return lk.length ? `<div class="card mt12 locked" style="position:relative;min-height:220px"><div class="lbl">🔬 Biomécanique complète</div><p class="small muted mt4">${lk.map(([, l]) => l).join(" · ")}</p>${lockVeil("Premium", "Moments, courbe de résistance, leviers, conseils de coach et progressions.")}</div>` : ""; })()}
    ${alts.length ? `<h2 class="sec">🔄 Variantes du même mouvement</h2><div class="list">${alts.map(n => `<button class="li" data-a="go" data-r="fiche" data-p="${esc(n)}"><span class="grow">${esc(n)}</span>${I.chev}</button>`).join("")}</div>` : ""}
  </main>`;
};

// =====================================================================
// CARNET DE SÉANCE
// =====================================================================
let restT = null, restEnd = 0, restTotal = 0, clockT = null;
actions.start = async () => {
  const cur = S().current, ns = E.nextSession();
  if (ns && !weekOpen(ns.week) && !cur) return go("offers");
  sessionStorage.removeItem("cxs.min");
  if (!cur) { await Promise.all([E.loadPrograms(), E.loadFiches(), E.loadLib()]); const s = E.buildSession(); if (!s) return toast("Choisis d'abord un programme."); update(st => st.current = s); }
  go("workout");
};
actions.resume = () => { sessionStorage.removeItem("cxs.min"); go("workout"); };
actions.minimize = () => { sessionStorage.setItem("cxs.min", "1"); go("home"); };

routes.workout = async () => {
  const cur = S().current; if (!cur) return go("train");
  await Promise.all([E.loadPrograms(), E.loadFiches(), E.loadLib()]);
  sessionStorage.removeItem("cxs.min");
  const doneSets = cur.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0), all = cur.exercises.reduce((a, e) => a + e.sets.length, 0);
  $app.innerHTML = `<header class="top"><div class="row1"><button class="icon-btn" data-a="minimize" aria-label="Réduire">${I.back}</button><h1 style="font-size:20px">${esc(cur.title)}</h1><button class="btn btn-red btn-sm" data-a="finish" style="width:auto">Terminer</button></div>
      <div class="sub">⏱️ <span id="clock">0:00</span> · ${doneSets}/${all} séries${cur.free ? "" : ` · semaine ${cur.week} · ${esc(cur.phase)}`}</div></header>
    <main class="page" style="padding-bottom:200px">
    ${cur.comeback ? `<p class="small red">Reprise après une pause : charges allégées de 10 % aujourd'hui.</p>` : ""}
    <div class="row between small muted"><span>${adv() ? "Mode avancé : % et RPE visibles" : "RPE visible · % masqués"}</span><button class="link" data-a="adv-toggle">${adv() ? "Simplifier" : "Afficher les %"}</button></div>
    ${cur.exercises.map((ex, xi) => exerciseBlock(ex, xi)).join("")}
    ${cur.exercises.length ? "" : `<p class="empty">Ajoute ton premier exercice.</p>`}
    <button class="btn btn-line mt16" data-a="add-ex">${I.plus.replace("<svg", '<svg width="20"')} Ajouter un exercice</button>
    <button class="btn btn-red mt12" data-a="finish">Terminer la séance</button></main>`;
  tickClock(); clearInterval(clockT); clockT = setInterval(tickClock, 1000);
  if (restEnd > Date.now()) showRest();
};
function tickClock() {
  const c = document.getElementById("clock"), cur = S().current; if (!c || !cur) return clearInterval(clockT);
  const s = Math.floor((Date.now() - new Date(cur.start)) / 1000); c.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function targetTxt(ex) {
  return E.parseScheme(ex.scheme).map(g => `${g.sets}×${g.lo}${g.hi !== g.lo ? "-" + g.hi : ""}${g.pct && adv() ? ` à ${g.pct} %` : ""}${g.rpe ? ` RPE ${String(g.rpe).replace(".", ",")}` : ""}${g.ds ? " + dégressive" : ""}`).join(" puis ");
}
function exerciseBlock(ex, xi) {
  const unit = ex.unit === "s" ? "Sec" : "Reps";
  let n = 0;
  const sugBox = ex.sug ? (premium() ? `<div class="sug">💡 <b>Suggestion</b> · ${esc(ex.sug.txt)}<br><span class="xs muted">Dernière fois : ${esc(ex.sug.last)}</span></div>` : `<div class="sug">💡 Dernière fois : <b>${esc(ex.sug.last)}</b> <button class="lock" data-a="go" data-r="offers" style="margin-left:4px">🔒 Suggestion Premium</button></div>`) : "";
  return `<article class="card ex"><div class="head"><div class="grow">
      <div>${ex.ss ? `<span class="tag r">Superset ${esc(ex.ss)}</span>` : ""}<span class="tag">${E.KIND_LABEL[ex.kind] || ex.kind}</span>${ex.tempo ? `<span class="tag">Tempo ${esc(ex.tempo)}</span>` : ""}<span class="tag">⏱️ ${Math.floor(ex.rest / 60)}:${String(ex.rest % 60).padStart(2, "0")}</span></div>
      <h3 class="mt8">${esc(ex.name)}</h3><div class="xs muted mt4">🎯 ${targetTxt(ex)}${ex.name !== ex.orig ? ` · remplace ${esc(ex.orig)}` : ""}${adv() && ex.e1 ? ` · e1RM ${fr(ex.e1)} kg` : ""}</div>
      ${!ex.bw && ex.sets.every(s => !s.kg) ? `<div class="xs mt8 red">Première fois : choisis une charge qui te laisse 2 à 3 répétitions en réserve. L'app calcule la suite.</div>` : ""}
      ${ex.note ? `<div class="xs mt8">📝 ${esc(ex.note)}</div>` : ""}</div></div>
    <div class="acts"><button data-a="go" data-r="fiche" data-p="${esc(ex.name)}">📖 Fiche</button><button data-a="ex-swap" data-x="${xi}">🔄 Remplacer</button><button data-a="ex-prog" data-x="${xi}">📈 Progression</button><button data-a="ex-rest" data-x="${xi}">⏱️ Repos</button><button data-a="ex-more" data-x="${xi}">${I.dots.replace("<svg", '<svg width="18"')}</button></div>
    ${sugBox}
    <div class="sethead"><span>Série</span><span>${ex.bw ? "Lest" : "Kg"}</span><span>${unit}</span><span>RPE</span><span></span></div>
    ${ex.sets.map((s, si) => {
      const lab = s.type === "W" ? "É" : String(++n);
      const meta = [s.type !== "N" ? `<span class="tag ${s.type === "W" ? "" : "r"}">${E.SET_TYPES[s.type]}</span>` : "", ...(s.tech || []).map(t => `<span class="tag">${(E.TECHS.find(x => x[1] === t) || ["⚡"])[0]} ${esc(t)}</span>`), `<span>${s.lo !== s.hi ? `${s.lo}-${s.hi}` : s.lo} ${unit.toLowerCase()} · RPE ${String(s.trpe).replace(".", ",")}${adv() && s.pct ? ` · ${s.pct} %` : ""}</span>`, s.pain ? `<span class="tag" style="background:var(--warn);color:#fff">Douleur</span>` : "", s.note ? `<span>📝 ${esc(s.note)}</span>` : ""].filter(Boolean).join("");
      return `<div class="set ${s.done ? "done" : ""} ${s.type === "W" ? "w" : ""}"><button class="n" data-a="set-menu" data-x="${xi}" data-s="${si}" aria-label="Options de la série">${lab}${s.type !== "N" ? `<small>${s.type === "W" ? "échauf." : E.SET_TYPES[s.type].split(" ")[0].toLowerCase()}</small>` : ""}</button>
        <input inputmode="decimal" data-i="set" data-k="kg" data-x="${xi}" data-s="${si}" value="${ex.bw ? kgTxt(s.kg || "") : kgTxt(s.kg)}" placeholder="${ex.bw ? "PDC" : "kg"}" aria-label="Charge">
        <input inputmode="numeric" data-i="set" data-k="reps" data-x="${xi}" data-s="${si}" value="${s.reps ?? ""}" placeholder="${s.lo}" aria-label="${unit}">
        <input inputmode="decimal" data-i="set" data-k="rpe" data-x="${xi}" data-s="${si}" value="${s.rpe != null ? String(s.rpe).replace(".", ",") : ""}" placeholder="${String(s.trpe).replace(".", ",")}" aria-label="RPE">
        <button class="tick" data-a="tick" data-x="${xi}" data-s="${si}" aria-label="Valider la série">${I.check}</button>
        <div class="setmeta">${meta}</div></div>`;
    }).join("")}
    <div class="row mt8" style="gap:8px"><button class="btn btn-ghost btn-xs" data-a="add-set" data-x="${xi}">+ Série</button><button class="btn btn-ghost btn-xs" data-a="add-set" data-x="${xi}" data-t="W">+ Échauffement</button></div>
    <label class="field mt8"><span>📝 Note sur l'exercice (réglages, sensations, douleur…)</span><textarea rows="1" data-i="exnote" data-x="${xi}" placeholder="Ex. siège cran 4, gêne épaule droite">${esc(ex.myNote || "")}</textarea></label>
  </article>`;
}
changes["i:set"] = (el) => {
  const ex = S().current.exercises[+el.dataset.x], si = +el.dataset.s, s = ex.sets[si], k = el.dataset.k;
  const v = num(el.value);
  if (k === "kg") { s.kg = isNaN(v) ? null : v; ex.sets.forEach((o, i) => { if (i > si && !o.done && o.g === s.g && o.type === s.type) o.kg = s.kg; }); if (ex.e1 && s.kg) s.pct = Math.round(s.kg / ex.e1 * 100); }
  else if (k === "reps") s.reps = isNaN(v) ? null : Math.round(v);
  else s.rpe = isNaN(v) ? null : Math.min(10, Math.max(5, v));
  save();
};
changes["i:exnote"] = (el) => { S().current.exercises[+el.dataset.x].myNote = el.value; save(); };
changes["i:setnote"] = (el) => { S().current.exercises[+el.dataset.x].sets[+el.dataset.s].note = el.value; save(); };
actions["adv-toggle"] = () => { update(st => st.settings.adv = !adv()); rerender(); };
actions.tick = (b, d) => {
  const ex = S().current.exercises[+d.x], s = ex.sets[+d.s];
  s.done = !s.done;
  if (s.done && s.reps == null) s.reps = s.lo;
  save(); buzz(s.done ? 18 : 8); rerender();
  if (s.done) startRest(s.type === "W" ? 60 : ex.rest);
};
actions["add-set"] = (b, d) => {
  const ex = S().current.exercises[+d.x];
  if (d.t === "W") { const top = ex.sets.find(s => s.type !== "W")?.kg; const w = ex.sets.filter(s => s.type === "W").length; ex.sets.splice(w, 0, { g: -1, type: "W", kg: top ? E.roundTo(top * .5, ex.step) : null, reps: 8, lo: 8, hi: 8, trpe: 5, rpe: null, pct: null, tech: [], note: "", done: false }); }
  else { const l = ex.sets.filter(s => s.type !== "W").at(-1) || ex.sets.at(-1); ex.sets.push({ ...l, type: l?.type === "T" ? "B" : (l?.type || "N"), tech: [...(l?.tech || [])], note: "", done: false, rpe: null, pain: false }); }
  save(); closeSheet(); rerender();
};
actions["ex-prog"] = (b, d) => progSheet(+d.x);
function progSheet(xi) {
  const ex = S().current.exercises[xi], e1 = Math.round(E.currentE1rm(ex.name) * 10) / 10, st = ex.step || 2.5, pending = ex.sets.filter(s => !s.done && s.type !== "W");
  const last = ex.sug?.last;
  sheet(`<h2 class="h2">📈 ${esc(ex.name)}</h2>${last ? `<p class="small muted mt4">Dernière fois : ${esc(last)}</p>` : ""}${ex.sug && premium() ? `<div class="sug">💡 ${esc(ex.sug.txt)}</div>` : ""}
    <div class="lbl mt12">Aujourd'hui · ${pending.length} série${pending.length > 1 ? "s" : ""} à faire</div>
    ${ex.bw ? `<p class="small muted">Exercice au poids du corps : joue sur les répétitions ou ajoute du lest dans le carnet.</p>` : `<div class="row mt8" style="gap:6px">${[-2, -1, 1, 2].map(k => `<button class="btn btn-line btn-sm grow" data-a="pg-kg" data-x="${xi}" data-v="${k * st}">${k > 0 ? "+" : "−"}${E.fmtKg(Math.abs(k * st))} kg</button>`).join("")}</div>`}
    <div class="row mt8" style="gap:6px"><button class="btn btn-line btn-sm grow" data-a="pg-rep" data-x="${xi}" data-v="-1">−1 rep</button><button class="btn btn-line btn-sm grow" data-a="pg-rep" data-x="${xi}" data-v="1">+1 rep</button><button class="btn btn-line btn-sm grow" data-a="pg-set" data-x="${xi}">+1 série</button></div>
    ${ex.bw ? "" : `<div class="lbl mt16">Mon 1RM estimé · ${e1 ? E.fmtKg(e1) + " kg" : "pas encore connu"}</div>
    <p class="xs muted mt4">Il sert à calculer toutes tes charges sur cet exercice. Ajuste-le si les charges proposées sont trop légères ou trop lourdes : les prochaines séances suivent.</p>
    ${e1 ? `<div class="row mt8" style="gap:6px">${[-5, -2.5, 2.5, 5].map(v => `<button class="btn btn-line btn-sm grow" data-a="pg-e1" data-x="${xi}" data-v="${v}">${v > 0 ? "+" : "−"}${E.fmtKg(Math.abs(v))} kg</button>`).join("")}</div>` : `<p class="small">Fais une première série : l'app le calcule tout de suite après.</p>`}`}
    <button class="btn btn-red mt16" data-a="set-close">OK</button>`);
}
actions["pg-kg"] = (b, d) => { const ex = S().current.exercises[+d.x]; ex.sets.forEach(s => { if (!s.done && s.type !== "W") s.kg = E.roundTo((s.kg || 0) + +d.v, ex.step || 2.5); }); save(); toast(`${+d.v > 0 ? "+" : ""}${E.fmtKg(+d.v)} kg sur les séries restantes`); rerender(); progSheet(+d.x); };
actions["pg-rep"] = (b, d) => { const ex = S().current.exercises[+d.x]; ex.sets.forEach(s => { if (!s.done && s.type !== "W") { s.reps = Math.max(1, (s.reps || s.lo) + +d.v); s.lo = Math.max(1, s.lo + +d.v); s.hi = Math.max(s.lo, s.hi + +d.v); } }); save(); rerender(); progSheet(+d.x); };
actions["pg-set"] = (b, d) => { actions["add-set"](b, { x: d.x }); progSheet(+d.x); };
actions["pg-e1"] = (b, d) => {
  const ex = S().current.exercises[+d.x], v = E.nudgeE1rm(ex.name, +d.v); if (!v) return;
  const old = ex.e1 || v; ex.e1 = v;
  ex.sets.forEach(s => { if (!s.done && s.kg) { s.kg = E.roundTo(s.kg * v / old, ex.step || 2.5); if (s.pct) s.pct = Math.round(s.kg / v * 100); } });
  save(); toast(`1RM estimé : ${E.fmtKg(v)} kg, charges recalculées`); rerender(); progSheet(+d.x);
};
actions["ex-rest"] = (b, d) => {
  const ex = S().current.exercises[+d.x];
  sheet(`<h2 class="h2">Temps de repos</h2><p class="small muted">${esc(ex.name)}</p><div class="chips wrap mt12">${[45, 60, 75, 90, 120, 150, 180, 240, 300].map(x => `<button class="chip ${ex.rest === x ? "on" : ""}" data-a="ex-rest-set" data-x="${d.x}" data-v="${x}">${Math.floor(x / 60)}:${String(x % 60).padStart(2, "0")}</button>`).join("")}</div><p class="xs muted mt12">Le minuteur démarre tout seul dès que tu valides une série.</p>`);
};
actions["ex-rest-set"] = (b, d) => { S().current.exercises[+d.x].rest = +d.v; save(); closeSheet(); rerender(); };
actions["ex-more"] = (b, d) => {
  const xi = +d.x, ex = S().current.exercises[xi], L = S().current.exercises.length;
  sheet(`<h2 class="h2">${esc(ex.name)}</h2><div class="list mt12">
    ${xi > 0 ? `<button class="li" data-a="ex-move" data-x="${xi}" data-v="-1"><span class="grow">⬆️ Monter</span></button>` : ""}
    ${xi < L - 1 ? `<button class="li" data-a="ex-move" data-x="${xi}" data-v="1"><span class="grow">⬇️ Descendre</span></button>` : ""}
    <button class="li" data-a="ex-tech" data-x="${xi}"><span class="grow">⚡ Technique sur toutes les séries</span>${I.chev}</button>
    <button class="li" data-a="ex-del" data-x="${xi}"><span class="grow" style="color:var(--red)">🗑️ Retirer de la séance</span></button></div>`);
};
actions["ex-move"] = (b, d) => { const a = S().current.exercises, i = +d.x, j = i + +d.v; [a[i], a[j]] = [a[j], a[i]]; save(); closeSheet(); rerender(); };
actions["ex-del"] = (b, d) => { if (!confirm("Retirer cet exercice de la séance ?")) return; S().current.exercises.splice(+d.x, 1); save(); closeSheet(); rerender(); };
actions["ex-tech"] = (b, d) => {
  sheet(`<h2 class="h2">Technique d'intensification</h2><p class="small muted">S'applique à toutes les séries de travail.</p><div class="chips wrap mt12">${E.TECHS.map(([e, t]) => `<button class="chip" data-a="ex-tech-set" data-x="${d.x}" data-v="${esc(t)}">${e} ${esc(t)}</button>`).join("")}</div>`);
};
actions["ex-tech-set"] = (b, d) => { S().current.exercises[+d.x].sets.forEach(s => { if (s.type !== "W" && !s.tech.includes(d.v)) s.tech.push(d.v); }); save(); closeSheet(); rerender(); };
function setMenu(xi, si) {
  const ex = S().current.exercises[xi], s = ex.sets[si];
  sheet(`<h2 class="h2">Série ${si + 1} · ${esc(ex.name)}</h2>
    <div class="lbl mt12">Type de série</div><div class="chips wrap mt8">${Object.entries(E.SET_TYPES).map(([k, l]) => `<button class="chip ${s.type === k ? "on" : ""}" data-a="set-type" data-x="${xi}" data-s="${si}" data-v="${k}">${l}</button>`).join("")}</div>
    <div class="lbl mt16">Techniques</div><div class="chips wrap mt8">${E.TECHS.map(([e, t]) => `<button class="chip ${s.tech.includes(t) ? "on" : ""}" data-a="set-tech" data-x="${xi}" data-s="${si}" data-v="${esc(t)}">${e} ${esc(t)}</button>`).join("")}</div>
    <label class="field mt16"><span>📝 Note sur cette série</span><textarea data-i="setnote" data-x="${xi}" data-s="${si}" rows="2" placeholder="Ex. dernière rep lente, prise large">${esc(s.note || "")}</textarea></label>
    <div class="li mt8" style="padding:8px 0"><span class="grow">🩹 Douleur ou gêne</span><button class="switch ${s.pain ? "on" : ""}" data-a="set-pain" data-x="${xi}" data-s="${si}" aria-label="Douleur"></button></div>
    <div class="row mt12" style="gap:8px"><button class="btn btn-line btn-sm grow" data-a="set-dup" data-x="${xi}" data-s="${si}">Dupliquer</button><button class="btn btn-line btn-sm grow" data-a="set-del" data-x="${xi}" data-s="${si}" style="color:var(--red)">Supprimer</button></div>
    <button class="btn btn-red mt12" data-a="set-close">OK</button>`);
}
actions["set-menu"] = (b, d) => setMenu(+d.x, +d.s);
actions["set-type"] = (b, d) => { const s = S().current.exercises[+d.x].sets[+d.s]; s.type = d.v; if (d.v === "W") s.trpe = 5; save(); setMenu(+d.x, +d.s); };
actions["set-tech"] = (b, d) => { const s = S().current.exercises[+d.x].sets[+d.s]; s.tech = s.tech.includes(d.v) ? s.tech.filter(t => t !== d.v) : [...s.tech, d.v]; save(); setMenu(+d.x, +d.s); };
actions["set-pain"] = (b, d) => { const s = S().current.exercises[+d.x].sets[+d.s]; s.pain = !s.pain; save(); setMenu(+d.x, +d.s); };
actions["set-dup"] = (b, d) => { const a = S().current.exercises[+d.x].sets; a.splice(+d.s + 1, 0, { ...a[+d.s], tech: [...a[+d.s].tech], done: false, rpe: null }); save(); closeSheet(); rerender(); };
actions["set-del"] = (b, d) => { S().current.exercises[+d.x].sets.splice(+d.s, 1); save(); closeSheet(); rerender(); };
actions["set-close"] = () => { closeSheet(); rerender(); };

// Choisir un exercice (séance, programme perso)
let onPick = null;
export function pickExercise(cb, title = "Ajouter un exercice") {
  onPick = cb;
  sheet(`<h2 class="h2">${esc(title)}</h2><div class="search mt12">${I.search}<input id="pq" placeholder="Rechercher un exercice" autocomplete="off"></div><div id="pl" class="mt12"></div>`, (w) => {
    const inp = w.querySelector("#pq"), box = w.querySelector("#pl");
    const draw = () => { const q = inp.value.trim().toLowerCase(); const r = E.allExercises().filter(n => !q || n.toLowerCase().includes(q)).slice(0, 60); box.innerHTML = r.length ? `<div class="list">${r.map(n => `<button class="li" data-a="pick-ex" data-n="${esc(n)}"><span class="grow">${esc(n)}<br><span class="xs muted">${esc(E.musclesOf(n).join(" · "))}</span></span>${I.plus.replace("<svg", '<svg width="20"')}</button>`).join("")}</div>` : `<p class="empty small">Aucun exercice.</p>`; };
    inp.addEventListener("input", draw); draw();
  });
}
actions["pick-ex"] = (b, d) => { closeSheet(); onPick?.(d.n); };
actions["add-ex"] = async () => {
  await Promise.all([E.loadFiches(), E.loadLib()]);
  pickExercise((n) => { S().current.exercises.push(E.blankExercise(n)); save(); rerender(); setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 50); });
};
actions["ex-swap"] = async (b, d) => {
  await E.loadFiches();
  const xi = +d.x, ex = S().current.exercises[xi], alts = E.alternatives(ex.name);
  sheet(`<h2 class="h2">Remplacer</h2><p class="small muted">${esc(ex.name)} · machine prise, douleur, matériel absent : les charges sont recalculées.</p>
    ${ex.name !== ex.orig ? `<button class="btn btn-line btn-sm mt8" data-a="swap" data-x="${xi}" data-n="${esc(ex.orig)}">Revenir à ${esc(ex.orig)}</button>` : ""}
    ${alts.length ? `<h3 class="sec">Même mouvement</h3><div class="list">${alts.slice(0, 14).map(n => `<button class="li" data-a="swap" data-x="${xi}" data-n="${esc(n)}"><span class="grow">${esc(n)}</span>${I.chev}</button>`).join("")}</div>` : ""}
    <button class="btn btn-line mt12" data-a="swap-any" data-x="${xi}">Chercher un autre exercice</button>`);
};
function doSwap(xi, n) {
  const cur = S().current, ex = cur.exercises[xi];
  if (!cur.free && ex.kind !== "X") update(st => { if (n === ex.orig) delete st.swaps[ex.orig]; else st.swaps[ex.orig] = n; });
  const fresh = E.blankExercise(n);
  ex.name = n; ex.unit = fresh.unit; ex.bw = fresh.bw; ex.step = fresh.step; ex.e1 = fresh.e1; ex.sug = fresh.sug;
  ex.sets.forEach(s => { if (s.done) return; s.kg = fresh.bw ? null : fresh.e1 ? E.roundTo(s.type === "W" ? (fresh.sets[0].kg || 0) * .6 : E.loadFor(fresh.e1, s.lo, s.trpe), fresh.step) : fresh.sets[0].kg; s.pct = fresh.e1 && s.kg ? Math.round(s.kg / fresh.e1 * 100) : null; });
  save(); closeSheet(); rerender(); toast("Exercice remplacé, charges recalculées");
}
actions.swap = (b, d) => doSwap(+d.x, d.n);
actions["swap-any"] = (b, d) => pickExercise((n) => doSwap(+d.x, n), "Remplacer par");

// Minuteur de repos (démarre seul à la validation d'une série)
function showRest() {
  document.querySelector(".rest")?.remove();
  const v = wordOn("rest") && restTotal >= 60 ? W.verseFor("repos", Math.floor(restEnd / 1000)) : null;
  const el = document.createElement("div"); el.className = "rest";
  el.innerHTML = `<div class="row between"><div><div class="xs" style="opacity:.8">⏱️ Repos</div><div class="t" id="rest-t"></div></div><div class="row" style="gap:6px"><button class="btn btn-xs" data-a="rest-add" data-v="-15">−15 s</button><button class="btn btn-xs" data-a="rest-add" data-v="30">+30 s</button><button class="btn btn-xs" data-a="rest-skip">Passer</button></div></div><div class="bar"><i id="rest-bar"></i></div>${v ? W.wordCard(v, "small") : ""}`;
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
actions["rest-add"] = (b, d) => { restEnd += +d.v * 1000; restTotal = Math.max(1, restTotal + +d.v); };
actions["rest-skip"] = () => { restEnd = 0; clearInterval(restT); document.querySelector(".rest")?.remove(); };
onLeave(() => { });

actions.finish = () => {
  const cur = S().current, n = cur.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  if (!n) { if (confirm("Aucune série validée. Abandonner cette séance ?")) { update(st => st.current = null); actions["rest-skip"](); go("home"); } return; }
  if (!confirm("Terminer la séance et enregistrer tes séries ?")) return;
  actions["rest-skip"](); clearInterval(clockT);
  E.finishSession(cur); pushStats(); go("done");
};
routes.done = () => {
  const w = S().workouts.at(-1); if (!w) return go("home");
  const mins = Math.round((new Date(w.end) - new Date(w.start)) / 6e4);
  const adj = w.exercises.filter(e => !e.bw && e.sets.some(s => s.done && s.type !== "W")).map(e => {
    const g = E.parseScheme(e.scheme).at(-1); const s = E.suggestion(e.name, g.rpe || 8, g.lo, g.hi, e.step); return s ? { n: e.name, s } : null;
  }).filter(Boolean);
  $app.innerHTML = `<section class="loader done" style="justify-content:flex-start;padding-top:calc(40px + var(--safe-t));text-align:center;overflow:auto">
    <svg class="big-x" viewBox="0 0 40 40"><path class="s1" d="M9 9l22 22" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/><path class="s2" d="M9 31 31 9" stroke="#EE8A45" stroke-width="5" stroke-linecap="round" fill="none"/></svg>
    <div><h1 class="h1" style="color:#fff">Séance terminée 💪</h1><p style="opacity:.8" class="mt8">${esc(w.title)}</p></div>
    <div style="width:100%;max-width:560px"><div class="stat3"><div><b>${mins}</b><span>minutes</span></div><div><b>${w.setsDone}</b><span>séries</span></div><div><b>${(w.volume / 1000).toFixed(1).replace(".", ",")}</b><span>tonnes</span></div></div></div>
    ${w.records.length ? `<div style="width:100%;max-width:560px;text-align:left;background:rgba(255,255,255,.12);border-radius:18px;padding:14px"><b>🏆 Nouveau${w.records.length > 1 ? "x" : ""} record${w.records.length > 1 ? "s" : ""}</b>${w.records.map(r => `<div class="row between small mt8"><span>${esc(r.name)}</span><b>${Math.round(r.after)} kg <span style="opacity:.7;font-weight:400">1RM estimé</span></b></div>`).join("")}</div>` : ""}
    ${adj.length ? `<div style="width:100%;max-width:560px;text-align:left;background:rgba(255,255,255,.12);border-radius:18px;padding:14px"><b>🎯 Pour la prochaine séance</b>${premium() ? adj.map(a => `<div class="small mt8"><b>${esc(a.n)}</b><br><span style="opacity:.85">${esc(a.s.txt)}</span></div>`).join("") : `<p class="small mt8" style="opacity:.85">Tes charges sont recalculées. Les conseils détaillés (charge ou reps à viser selon ton RPE) sont dans Premium.</p>`}</div>` : ""}
    ${wordOn("fin") ? `<div style="width:100%;max-width:560px;text-align:left">${W.wordCard(W.verseFor("fin", w.id % 1000))}</div>` : ""}
    <button class="btn" style="max-width:560px;background:#fff;color:var(--red)" data-a="go" data-r="home">Retour à l'accueil</button></section>`;
};

// =====================================================================
// CRÉER SON PROGRAMME
// =====================================================================
let draft = null;
const blankRow = (n) => [n, "X", "", null, null, { sets: 3, lo: 8, hi: 12, rpe: 8, pct: null, tech: [], rest: 120 }];
routes.builder = async () => {
  await Promise.all([E.loadPrograms(), E.loadFiches(), E.loadLib()]);
  if (!premium()) {
    $app.innerHTML = header("Créer mon programme", "", { back: "train" }) + `<main class="page"><div class="card locked" style="min-height:300px;position:relative"><h2 class="h2">Ton programme, tes règles</h2><p class="small muted">Séances, exercices, séries, fourchettes de reps, RPE, % du 1RM, techniques d'intensification et temps de repos : tout se planifie, puis le carnet calcule tes charges.</p>${lockVeil("Premium")}</div></main>${tabbar("train")}`;
    return;
  }
  if (!draft || (R.param && draft.id !== R.param)) {
    const ex = R.param && (S().customPrograms || []).find(p => p.id === R.param);
    draft = ex ? JSON.parse(JSON.stringify(ex)) : { id: "my-" + Date.now(), custom: true, name: "Mon programme", lvl: "Perso", split: "Perso", weeks: 8, days: [true, false, true, false, true, false, false], s: [["Séance A", "Lundi", []]], prof: "", desc: "Programme créé par moi." };
  }
  const D = draft;
  $app.innerHTML = header("Créer mon programme", "", { back: "train" }) + `<main class="page">
    <label class="field"><span>Nom</span><input data-c="bd" data-k="name" value="${esc(D.name)}" maxlength="60"></label>
    <div class="stack mt8"><label class="field"><span>Durée du cycle</span><select data-c="bd" data-k="weeks">${[4, 6, 8, 10, 12].map(w => `<option ${D.weeks === w ? "selected" : ""} value="${w}">${w} semaines</option>`).join("")}</select></label><div class="field"><span>Jours d'entraînement</span><div class="row" style="gap:3px">${E.DAY_SHORT.map((l, i) => `<button class="chip sm ${D.days[i] ? "on" : ""}" data-a="bd-day" data-v="${i}" style="padding:6px 8px">${l}</button>`).join("")}</div></div></div>
    ${D.s.map((s, si) => `<div class="card mt16"><div class="row" style="gap:8px"><input class="inp grow" data-c="bd-s" data-s="${si}" value="${esc(s[0])}" aria-label="Nom de la séance" style="text-align:left;font-weight:800">${D.s.length > 1 ? `<button class="icon-btn" data-a="bd-sdel" data-s="${si}" aria-label="Supprimer la séance">${I.close}</button>` : ""}</div>
      ${s[2].map((r, ri) => { const x = r[5]; return `<div class="mt12" style="border-top:1px solid var(--line);padding-top:10px"><div class="row between"><b class="small" style="color:var(--red)">${esc(r[0])}</b><button class="link xs" data-a="bd-rdel" data-s="${si}" data-r="${ri}">Retirer</button></div>
        <div class="grid3 mt8">${[["sets", "Séries"], ["lo", "Reps min"], ["hi", "Reps max"], ["rpe", "RPE"], ["pct", "% 1RM"], ["rest", "Repos (s)"]].map(([k, l]) => `<label class="field"><span>${l}</span><input inputmode="decimal" data-c="bd-r" data-s="${si}" data-r="${ri}" data-k="${k}" value="${x[k] ?? ""}" placeholder="–"></label>`).join("")}</div>
        <div class="chips mt8">${E.TECHS.slice(1).map(([e, t]) => `<button class="chip sm ${x.tech.includes(t) ? "on" : ""}" data-a="bd-tech" data-s="${si}" data-r="${ri}" data-v="${esc(t)}">${e} ${esc(t)}</button>`).join("")}</div></div>`; }).join("")}
      <button class="btn btn-line btn-sm mt12" data-a="bd-add" data-s="${si}" style="width:100%">+ Exercice</button></div>`).join("")}
    <button class="btn btn-ghost mt12" data-a="bd-sadd">+ Ajouter une séance</button>
    <p class="xs muted mt12">La semaine ${D.weeks} et chaque 4ᵉ semaine sont des semaines d'allègement conseillées. Les charges sont calculées à partir de tes records et de ton carnet.</p>
    <div class="row mt12" style="gap:8px"><button class="btn btn-red grow" data-a="bd-save">Enregistrer</button><button class="btn btn-line grow" data-a="bd-use">Enregistrer et suivre</button></div>
    ${(S().customPrograms || []).some(p => p.id === D.id) ? `<button class="btn btn-ghost mt8" data-a="bd-del" style="color:var(--red)">Supprimer ce programme</button>` : ""}
  </main>${tabbar("train")}`;
};
changes.bd = (el) => { const k = el.dataset.k; draft[k] = k === "weeks" ? +el.value : el.value; };
changes["bd-s"] = (el) => { draft.s[+el.dataset.s][0] = el.value; };
changes["bd-r"] = (el) => { const x = draft.s[+el.dataset.s][2][+el.dataset.r][5], v = num(el.value); x[el.dataset.k] = isNaN(v) ? null : v; };
actions["bd-day"] = (b, d) => { draft.days[+d.v] = !draft.days[+d.v]; rerender(); };
actions["bd-sadd"] = () => { draft.s.push([`Séance ${String.fromCharCode(65 + draft.s.length)}`, "", []]); rerender(); };
actions["bd-sdel"] = (b, d) => { draft.s.splice(+d.s, 1); rerender(); };
actions["bd-rdel"] = (b, d) => { draft.s[+d.s][2].splice(+d.r, 1); rerender(); };
actions["bd-tech"] = (b, d) => { const x = draft.s[+d.s][2][+d.r][5]; x.tech = x.tech.includes(d.v) ? x.tech.filter(t => t !== d.v) : [...x.tech, d.v]; rerender(); };
actions["bd-add"] = (b, d) => pickExercise((n) => { draft.s[+d.s][2].push(blankRow(n)); rerender(); });
function saveDraft() {
  if (!draft.s.some(s => s[2].length)) { toast("Ajoute au moins un exercice."); return false; }
  const nd = draft.days.filter(Boolean).length; if (!nd) { toast("Choisis au moins un jour."); return false; }
  let k = 0; draft.days.forEach((on, i) => { if (on && draft.s[k]) draft.s[k++][1] = E.DAY_NAMES[i]; });
  update(st => { st.customPrograms = (st.customPrograms || []).filter(p => p.id !== draft.id); st.customPrograms.push(JSON.parse(JSON.stringify(draft))); });
  return true;
}
actions["bd-save"] = () => { if (saveDraft()) { toast("Programme enregistré"); tab = "banque"; draft = null; go("train", "banque"); } };
actions["bd-use"] = () => { if (!saveDraft()) return; if (S().current) return toast("Enregistré. Termine ta séance en cours pour changer."); update(st => st.plan = { programId: draft.id, startedAt: today(), week: 1, idx: 0, cycle: 1 }); toast("C'est parti avec ton programme"); draft = null; tab = "programme"; pushStats(); go("train", "programme"); };
actions["bd-del"] = () => { if (!confirm("Supprimer ce programme ?")) return; const id = draft.id; update(st => { st.customPrograms = st.customPrograms.filter(p => p.id !== id); if (st.plan?.programId === id) st.plan = { programId: st.profile.startProgram || "tb-rep3", startedAt: today(), week: 1, idx: 0, cycle: 1 }; }); draft = null; go("train", "banque"); };
