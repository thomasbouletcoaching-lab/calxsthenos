// Moteur d'entraînement : programmes (Méthode Thomas Boulet + programmes perso), charges calculées,
// surcharge progressive ajustée au réel (RPE), agenda, volume, alertes.
import { S, update, today } from "./store.js";

let PROG = null, FICHES = null, LIB = null;
export async function loadPrograms() { if (!PROG) PROG = await (await fetch("data/programs.json")).json(); return PROG; }
export async function loadFiches() { if (!FICHES) { try { FICHES = await (await fetch("data/fiches.json")).json(); } catch { FICHES = { ex: {}, fam: {}, svg: {} }; } } return FICHES; }
export async function loadLib() { if (!LIB) { try { LIB = await (await fetch("data/lib.json")).json(); } catch { LIB = { BASE: [] }; } } return LIB; }
export const programs = () => [...(PROG?.P || []), ...(S().customPrograms || [])];
export const program = (id) => programs().find(p => p.id === id) || null;
export const fiches = () => FICHES;
export const lib = () => LIB;

export const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const DAY_SHORT = ["L", "M", "M", "J", "V", "S", "D"];
export const KIND_LABEL = { F: "Force", S: "Secondaire", P: "Principal", I: "Isolation", C: "Gainage", A: "Accessoire", N: "Street", K: "Activation", M: "Mobilité", G: "Gainage", R: "Rééducation", U: "Unilatéral", J: "Renfort", X: "Perso" };
const REST = { F: 180, N: 150, S: 120, P: 120, A: 90, U: 90, J: 90, I: 75, G: 60, C: 60, R: 60, K: 45, M: 30, X: 120 };

// Types de séries et techniques d'intensification
export const SET_TYPES = { N: "Normale", W: "Échauffement", T: "Top set", B: "Back-off", D: "Dégressive", A: "AMRAP", E: "À l'échec" };
export const TECHS = [
  ["♨️", "Échauffement"], ["📶", "Montée en gamme"], ["💀", "À l'échec"], ["🔻", "Dropset"], ["⏱️", "Rest-pause"], ["🔁", "Myo-reps"],
  ["🧩", "Cluster"], ["🔀", "Dropset mécanique"], ["✂️", "Partielles"], ["🤝", "Reps forcées"], ["⬇️", "Négatives"], ["🐢", "Excentrique lent"],
  ["🛑", "Pause à chaque rep"], ["⏸️", "Isométrie"], ["½", "Reps et demie"], ["7️⃣", "Série 21 (7-7-7)"], ["😈", "Reps trichées"],
  ["🔗", "Enchaînée (superset, pré-fatigue)"], ["🩸", "Occlusion (BFR)"],
];

// ---------- Choix du programme ----------
export function pickProgram(p) {
  if (p.backPain) return "tb-dos4";
  const adv = p.level === "advanced", beg = p.level === "beginner" || p.level === "comeback";
  if (beg) return p.days <= 2 ? "tb-rep2" : "tb-rep3";
  if (p.discipline === "streetlifting") return adv ? "tb-ml4" : "tb-pb4";
  if (p.discipline === "powerbuilding") return adv ? "tb-pb4" : "tb-int4";
  if (p.discipline === "powerlifting") return adv ? "tb-ml4" : "tb-pb4";
  if (p.days <= 2) return "tb-rep2";
  if (p.days === 3) return "tb-int3";
  if (p.days >= 5 && adv) return "tb-adv5";
  return "tb-int4";
}
export function weeksOf(p) { if (p.custom) return p.weeks || 8; const sc = PROG.SC[p.sc]; return sc[Object.keys(sc)[0]].length; }
export function phaseOf(p, w) { if (p.custom) return w % 4 === 0 ? "Allègement" : "Bloc perso"; return (p.ph || PROG.PH)[w - 1] || ""; }
export function schemeFor(p, row, week) {
  const kind = row[1];
  if (p.custom || row[5]) { const x = row[5] || {}; return `${x.sets || 3}x${x.lo || 8}${x.hi && x.hi !== x.lo ? "-" + x.hi : ""}${x.pct ? "@" + x.pct + "%" : ""} RPE${x.rpe || 8}`; }
  const sc = PROG.SC[p.sc];
  return (sc[kind] || sc.I || ["3x8-12 RPE8"])[week - 1] || "3x8-12 RPE8";
}

// "3x8-10 RPE8", "1x3@85% + 4x5@75%", "2x10-12 RPE9 + 1x10-12 RPE10 DS"
export function parseScheme(str) {
  return String(str || "3x8-12 RPE8").split("+").map(s => s.trim()).map(s => {
    const m = s.match(/^(\d+)\s*x\s*(\d+)(?:-(\d+))?(?:\s*@\s*([\d.]+)%)?(?:\s*RPE\s*([\d.]+))?(\s*DS)?/i);
    if (!m) return { sets: 3, lo: 8, hi: 12, rpe: 8 };
    return { sets: +m[1], lo: +m[2], hi: +(m[3] || m[2]), pct: m[4] ? +m[4] : null, rpe: m[5] ? +m[5] : null, ds: !!m[6] };
  });
}

// ---------- Exercices ----------
const BW = /poids de corps|pompes|gainage|planche|plank|dead bug|bird dog|hollow|relev[ée] de jambes(?! .*lest)|hip airplane|stretch|étirement|copenhagen|chaise contre|superman|mobilit|respiration|90\/90|cat camel|McGill|crunch au sol|tractions(?!.*lest)|dips(?!.*lest)|muscle-up|traction australienne/i;
export function unitOf(name, kind) {
  if (kind === "M") return "s";
  if (/gainage|planche|plank|chaise contre|copenhagen|hollow|suspension|isom|L-sit|stretch|étirement/i.test(name)) return "s";
  return "reps";
}
export const isBodyweight = (name) => BW.test(name) && !/lest/i.test(name);
export function stepOf(name) { if (/lest/i.test(name)) return 1.25; if (/kettlebell/i.test(name)) return 4; if (/haltère/i.test(name)) return 2; return 2.5; }
export const roundTo = (kg, step) => Math.max(0, Math.round(kg / step) * step);
export const fmtKg = (kg) => (Math.round((kg || 0) * 100) / 100).toString().replace(".", ",");

// Epley corrigé par les répétitions en réserve (RIR = 10 − RPE)
// (une répétition à RPE 10 = le 1RM lui-même)
const effR = (reps, rpe) => Math.min(reps + Math.max(0, 10 - (rpe || 8)), 15);
export function e1rm(kg, reps, rpe = 8) { if (!kg || !reps) return 0; const r = effR(reps, rpe); return r <= 1 ? kg : kg * (1 + r / 30); }
export const loadFor = (e, reps, rpe = 8) => { const r = effR(reps, rpe); return r <= 1 ? e : e / (1 + r / 30); };
export const pctFor = (reps, rpe = 10) => 100 * loadFor(1, reps, rpe);

// Records de départ (onboarding ou saisis à la main)
const SEEDS = [
  [/^squat barre(?!.*(pause|tempo))/i, "squat", 1], [/squat barre.*pause/i, "squat", .85], [/squat barre.*tempo/i, "squat", .75],
  [/^front squat/i, "squat", .8], [/hack squat|leg press|presse à cuisses/i, "squat", 1.6],
  [/^développé couché barre(?!.*(pause|serrée|incliné))/i, "bench", 1], [/développé couché barre.*pause/i, "bench", .93], [/développé couché.*serrée/i, "bench", .88],
  [/développé incliné barre/i, "bench", .82], [/développé incliné haltères/i, "bench", .32], [/développé couché haltères/i, "bench", .36],
  [/^soulevé de terre(?!.*(roumain|jambes))/i, "deadlift", 1], [/soulevé de terre roumain barre/i, "deadlift", .62], [/soulevé de terre roumain haltères/i, "deadlift", .26],
  [/développé militaire barre/i, "ohp", 1], [/développé (épaules|militaire) haltères/i, "ohp", .36],
  [/rowing barre/i, "row", 1], [/rowing haltère/i, "row", .42],
  [/tractions lestées/i, "pullup", 1], [/dips lestés/i, "dip", 1],
];
export const MAIN_LIFTS = [["squat", "Squat barre"], ["bench", "Développé couché barre"], ["deadlift", "Soulevé de terre"], ["ohp", "Développé militaire barre (OHP)"], ["row", "Rowing barre"], ["pullup", "Tractions lestées (pronation)"], ["dip", "Dips lestés"]];
export function seedE1rm(name) {
  const rec = S().profile?.records || {};
  for (const [re, key, f] of SEEDS) if (re.test(name) && rec[key]?.e1rm) return rec[key].e1rm * f;
  return 0;
}
export function currentE1rm(name) {
  const h = S().lifts[name];
  if (!h?.length) return seedE1rm(name);
  const last = h.at(-1).e1rm, best3 = Math.max(...h.slice(-3).map(x => x.e1rm));
  return last * .6 + best3 * .4;
}
export function setRecord(key, kg, reps, rpe = 10) {
  update(st => { st.profile.records = st.profile.records || {}; st.profile.records[key] = { k: kg, r: reps, rpe, e1rm: Math.round(e1rm(kg, reps, rpe) * 10) / 10, d: today() }; });
  const name = MAIN_LIFTS.find(m => m[0] === key)?.[1];
  if (name) update(st => { (st.lifts[name] = st.lifts[name] || []).push({ d: today(), e1rm: Math.round(e1rm(kg, reps, rpe) * 10) / 10, manual: true }); });
}

// ---------- Plan et séance du jour ----------
export function nextSession() {
  const pl = S().plan; if (!pl) return null;
  const p = program(pl.programId); if (!p) return null;
  const s = p.s[pl.idx % p.s.length];
  return { p, week: pl.week, idx: pl.idx, title: s[0], day: s[1], exercises: s[2], phase: phaseOf(p, pl.week), weeks: weeksOf(p), cycle: pl.cycle || 1 };
}
export function daysSinceLast() { const w = S().workouts; if (!w.length) return null; return Math.floor((Date.now() - new Date(w.at(-1).end).getTime()) / 864e5); }

function lastExercise(name) {
  const w = S().workouts;
  for (let i = w.length - 1; i >= 0; i--) { const ex = w[i].exercises.find(x => x.name === name); if (ex && ex.sets.some(s => s.done)) return { ex, date: w[i].end }; }
  return null;
}
export function lastPerformance(name) {
  const l = lastExercise(name); if (!l) return null;
  const s = l.ex.sets.filter(x => x.done && x.type !== "W");
  return s.length ? s.reduce((a, b) => (e1rm(b.kg, b.reps, b.rpe) > e1rm(a.kg, a.reps, a.rpe) ? b : a)) : null;
}
// Suggestion pour la prochaine fois : compare le ressenti réel au ressenti prévu
export function suggestion(name, targetRpe = 8, lo = 8, hi = 10, step = 2.5) {
  const l = lastExercise(name); if (!l) return null;
  const work = l.ex.sets.filter(s => s.done && s.type !== "W" && s.kg);
  if (!work.length) return null;
  const avgRpe = work.reduce((a, s) => a + (s.rpe ?? s.trpe ?? 8), 0) / work.length;
  const best = work.reduce((a, b) => (b.kg > a.kg ? b : a));
  const allTop = work.every(s => s.reps >= hi);
  const pain = l.ex.sets.some(s => s.pain);
  let txt, kg = best.kg;
  if (pain) { txt = "Douleur signalée la dernière fois : garde la même charge ou change d'exercice."; }
  else if (avgRpe >= targetRpe + 1) { txt = `Plus dur que prévu (RPE ${fmtKg(avgRpe)} pour ${fmtKg(targetRpe)}) : on garde ${fmtKg(kg)} kg et on vise des reps plus propres.`; }
  else if (avgRpe <= targetRpe - 1.5 || allTop) { kg = roundTo(best.kg + step * (avgRpe <= targetRpe - 2 ? 2 : 1), step); txt = `Plus facile que prévu (RPE ${fmtKg(avgRpe)}) : monte à ${fmtKg(kg)} kg.`; }
  else { txt = `Dans la cible (RPE ${fmtKg(avgRpe)}) : vise ${best.reps + 1} reps à ${fmtKg(kg)} kg ou la charge proposée.`; }
  return { txt, kg, last: `${fmtKg(best.kg)} kg × ${best.reps} à RPE ${fmtKg(best.rpe ?? best.trpe ?? 8)}`, date: l.date };
}

export function buildSession() {
  const ns = nextSession(); if (!ns) return null;
  const { p, week } = ns;
  const gap = daysSinceLast();
  const comeback = gap !== null && gap >= 14;
  const exercises = ns.exercises.map((row, i) => {
    const orig = row[0], name = S().swaps[orig] || orig, kind = row[1];
    const scheme = schemeFor(p, row, week);
    const groups = parseScheme(scheme);
    const unit = unitOf(name, kind), bw = isBodyweight(name) || unit === "s";
    const e = bw ? 0 : currentE1rm(name), step = stepOf(name);
    const prev = lastPerformance(name);
    const plannedTech = (row[5]?.tech) || [];
    const sets = [];
    groups.forEach((g, gi) => {
      for (let k = 0; k < g.sets; k++) {
        let kg = null;
        if (!bw) {
          if (e) kg = g.pct ? e * g.pct / 100 : loadFor(e, g.lo, g.rpe || 8);
          else if (prev) kg = prev.kg;
          if (kg && comeback) kg *= .9;
          if (kg && g.ds && k === g.sets - 1) kg *= .8;
          if (kg) kg = roundTo(kg, step);
        }
        const type = g.ds && k === g.sets - 1 ? "D" : groups.length > 1 ? (gi === 0 ? "T" : "B") : "N";
        sets.push({ g: gi, type, kg, reps: g.lo, lo: g.lo, hi: g.hi, rpe: null, trpe: g.rpe || 8, pct: g.pct || (e && kg ? Math.round(kg / e * 100) : null), tech: g.ds && k === g.sets - 1 ? ["Dropset"] : [...plannedTech], note: "", done: false });
      }
    });
    // Échauffement proposé sur les mouvements de force
    if (!bw && (kind === "F" || (kind === "P" && i === 0)) && sets[0]?.kg) {
      const top = sets[0].kg;
      [[.5, 8], [.7, 4], [.85, 2]].reverse().forEach(([f, r]) => sets.unshift({ g: -1, type: "W", kg: roundTo(top * f, step), reps: r, lo: r, hi: r, trpe: 5, rpe: null, pct: null, tech: [], note: "", done: false }));
    }
    const sug = bw ? null : suggestion(name, groups.at(-1).rpe || 8, groups.at(-1).lo, groups.at(-1).hi, step);
    return { orig, name, kind, note: row[2] || "", ss: row[3] || null, tempo: row[4] || null, scheme, unit, bw, step, rest: (row[5]?.rest) || REST[kind] || 90, sets, e1: e, sug, myNote: "" };
  });
  return { id: Date.now(), programId: p.id, week, idx: ns.idx, title: ns.title, phase: ns.phase, start: new Date().toISOString(), comeback, exercises };
}
export function freeSession(title = "Séance libre") {
  return { id: Date.now(), programId: null, free: true, week: S().plan?.week || 1, idx: null, title, phase: "Libre", start: new Date().toISOString(), comeback: false, exercises: [] };
}
export function blankExercise(name) {
  const unit = unitOf(name, "X"), bw = isBodyweight(name) || unit === "s", e = bw ? 0 : currentE1rm(name), step = stepOf(name);
  const prev = lastPerformance(name);
  const kg = bw ? null : prev?.kg ?? (e ? roundTo(loadFor(e, 8, 8), step) : null);
  const sets = [0, 1, 2].map(() => ({ g: 0, type: "N", kg, reps: prev?.reps || 8, lo: 8, hi: 12, trpe: 8, rpe: null, pct: e && kg ? Math.round(kg / e * 100) : null, tech: [], note: "", done: false }));
  return { orig: name, name, kind: "X", note: "", scheme: "3x8-12 RPE8", unit, bw, step, rest: 120, sets, e1: e, sug: bw ? null : suggestion(name, 8, 8, 12, step), myNote: "" };
}

// Fin de séance : e1RM, records, volume, avance le plan (sauf séance libre)
export function finishSession(cur) {
  const d = today(), records = [];
  let volume = 0, sets = 0;
  update(st => {
    cur.exercises.forEach(ex => {
      const done = ex.sets.filter(s => s.done && s.type !== "W");
      sets += done.length;
      done.forEach(s => { if (s.kg && ex.unit === "reps") volume += s.kg * s.reps; });
      if (ex.bw) return;
      const best = Math.max(0, ...done.filter(s => s.kg && s.reps && s.type !== "D").map(s => e1rm(s.kg, s.reps, s.rpe ?? s.trpe)));
      if (!best) return;
      const cur0 = currentE1rm(ex.name);
      const felt = done.some(s => s.rpe != null);
      const val = (!felt && cur0 && best < cur0) ? cur0 : best;
      const h = st.lifts[ex.name] || (st.lifts[ex.name] = []);
      const ref = Math.max(h.length ? Math.max(...h.map(x => x.e1rm)) : 0, seedE1rm(ex.name));
      if (ref && best > ref * 1.005) records.push({ name: ex.name, before: ref, after: best });
      h.push({ d, e1rm: Math.round(val * 10) / 10 });
      if (h.length > 200) h.splice(0, h.length - 200);
    });
    cur.end = new Date().toISOString();
    cur.volume = Math.round(volume); cur.setsDone = sets; cur.records = records;
    st.workouts.push(cur);
    st.current = null;
    if (!cur.free && st.plan) {
      const p = program(st.plan.programId);
      st.plan.idx++;
      if (st.plan.idx >= p.s.length) { st.plan.idx = 0; st.plan.week++; if (st.plan.week > weeksOf(p)) { st.plan.week = 1; st.plan.cycle = (st.plan.cycle || 1) + 1; } }
    }
  });
  return cur;
}

// ---------- Semaine, agenda ----------
export function weekLayout(p) {
  const out = []; let k = 0;
  (p.days || []).forEach((on, i) => { if (on && k < p.s.length) { out.push({ dow: i, s: p.s[k], k }); k++; } });
  return out;
}
const iso = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
export const dowOf = (dateStr) => (new Date(dateStr + "T12:00:00").getDay() + 6) % 7;
// Statut de chaque jour entre deux dates : fait, loupé, prévu (avec la séance prévue), déplacé
export function agenda(from, to) {
  const out = {}, pl = S().plan, p = pl && program(pl.programId);
  const moves = S().moves || {}, skips = S().skips || {};
  const doneBy = {}; S().workouts.forEach(w => { const k = iso(new Date(w.end)); (doneBy[k] = doneBy[k] || []).push(w); });
  const lay = p ? weekLayout(p) : [];
  const t = today(), start = pl?.startedAt || t;
  const movedTo = {}; Object.entries(moves).forEach(([a, b]) => { movedTo[b] = a; });
  // séances futures : on déroule l'ordre du programme à partir de la prochaine séance
  let idx = pl ? pl.idx : 0;
  const d0 = new Date(from + "T12:00:00"), d1 = new Date(to + "T12:00:00");
  const futureStart = doneBy[t] ? iso(new Date(Date.now() + 864e5)) : t;
  const seq = [];
  for (let d = new Date(futureStart + "T12:00:00"); iso(d) <= to; d.setDate(d.getDate() + 1)) {
    const k = iso(d);
    const planned = lay.some(l => l.dow === dowOf(k)) && !moves[k] && !skips[k];
    if ((planned || movedTo[k]) && p) { seq.push([k, p.s[idx % p.s.length][0]]); idx++; }
  }
  const futureMap = Object.fromEntries(seq);
  for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
    const k = iso(d), dow = dowOf(k);
    const plannedDay = p && lay.some(l => l.dow === dow);
    if (doneBy[k]) out[k] = { st: "done", title: doneBy[k].map(w => w.title).join(" + "), w: doneBy[k] };
    else if (k >= futureStart && futureMap[k]) out[k] = { st: "planned", title: futureMap[k], moved: !!movedTo[k] };
    else if (k < t && k >= start && ((plannedDay && !moves[k] && !skips[k]) || movedTo[k])) out[k] = { st: "missed", title: p?.s[(lay.find(l => l.dow === dow)?.k) ?? 0]?.[0] || "Séance" };
    else if (skips[k] && plannedDay) out[k] = { st: "rest", title: "Repos choisi" };
    if (moves[k]) out[k] = { ...(out[k] || {}), st: out[k]?.st === "done" ? "done" : "away", to: moves[k] };
  }
  return out;
}
export function moveSession(from, to) { update(st => { st.moves = st.moves || {}; if (from === to) delete st.moves[from]; else st.moves[from] = to; }); }
export function toggleSkip(day) { update(st => { st.skips = st.skips || {}; if (st.skips[day]) delete st.skips[day]; else st.skips[day] = true; }); }

export function workoutsThisWeek() {
  const now = new Date(), mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  return S().workouts.filter(w => new Date(w.end) >= mon);
}
export function activeWeeks(n = 8) {
  const out = []; const now = new Date(); now.setHours(0, 0, 0, 0);
  const mon = new Date(now); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  for (let i = n - 1; i >= 0; i--) {
    const a = new Date(mon); a.setDate(a.getDate() - 7 * i); const b = new Date(a); b.setDate(b.getDate() + 7);
    const ws = S().workouts.filter(w => { const t = new Date(w.end); return t >= a && t < b; });
    out.push({ start: a, count: ws.length, volume: ws.reduce((x, w) => x + (w.volume || 0), 0), sets: ws.reduce((x, w) => x + (w.setsDone || 0), 0) });
  }
  return out;
}
export function streakWeeks() {
  const w = activeWeeks(52); let n = 0;
  for (let i = w.length - 1; i >= 0; i--) { if (w[i].count > 0) n++; else if (i === w.length - 1) continue; else break; }
  return n;
}

// ---------- Volume et muscles ----------
export function musclesOf(name) {
  const r = LIB?.BASE?.find(x => x[0] === name);
  if (r) return [r[1], r[2], r[3]].filter(Boolean);
  const F = FICHES?.ex?.[name]; return F ? [(FICHES.fam[F.fam]?.nom || F.fam).split("(")[0].trim()] : ["Autre"];
}
// Séries effectives par muscle (principal = 1, secondaires = 0,5) et tonnage, sur une période
export function volumeStats(fromDate, toDate = today()) {
  const byMuscle = {}, byExercise = {}, sessions = [];
  S().workouts.forEach(w => {
    const k = iso(new Date(w.end)); if (k < fromDate || k > toDate) return;
    let ton = 0, n = 0;
    w.exercises.forEach(ex => {
      const done = ex.sets.filter(s => s.done && s.type !== "W"); if (!done.length) return;
      const t = done.reduce((a, s) => a + (ex.unit === "reps" && s.kg ? s.kg * s.reps : 0), 0);
      ton += t; n += done.length;
      const e = byExercise[ex.name] = byExercise[ex.name] || { sets: 0, ton: 0 }; e.sets += done.length; e.ton += t;
      musclesOf(ex.name).forEach((m, i) => { const v = byMuscle[m] = byMuscle[m] || { sets: 0, ton: 0 }; v.sets += done.length * (i === 0 ? 1 : .5); v.ton += i === 0 ? t : 0; });
    });
    sessions.push({ d: k, title: w.title, ton: Math.round(ton), sets: n });
  });
  return { byMuscle, byExercise, sessions };
}
export function monthlyVolume(n = 6) {
  const out = [], now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const a = new Date(now.getFullYear(), now.getMonth() - i, 1), b = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const ws = S().workouts.filter(w => { const t = new Date(w.end); return t >= a && t < b; });
    out.push({ label: a.toLocaleDateString("fr-FR", { month: "short" }), volume: ws.reduce((x, w) => x + (w.volume || 0), 0), count: ws.length });
  }
  return out;
}

// ---------- Alertes de blessure ----------
const PAIN_WORDS = /douleur|mal |mal$|gêne|gene|bless|tendin|pincement|craqu|lombaire|sciatique/i;
export function injuryAlerts(days = 21) {
  const since = Date.now() - days * 864e5, out = [];
  S().workouts.forEach(w => {
    if (new Date(w.end) < since) return;
    w.exercises.forEach(ex => {
      const pain = ex.sets.filter(s => s.pain || PAIN_WORDS.test(s.note || ""));
      if (pain.length || PAIN_WORDS.test(ex.myNote || "")) out.push({ name: ex.name, date: w.end, note: ex.myNote || pain.map(s => s.note).filter(Boolean).join(" · ") || "Douleur signalée" });
    });
  });
  const byName = {}; out.forEach(a => { (byName[a.name] = byName[a.name] || []).push(a); });
  return Object.entries(byName).map(([name, list]) => ({ name, count: list.length, last: list.at(-1) }));
}

// ---------- Objectif : nombre de cycles ----------
export function cyclesToGoal(current, target, level = "regular") {
  if (!current || !target || target <= current) return { cycles: 0, months: 0, rate: 0 };
  const rate = { beginner: .1, comeback: .1, regular: .05, advanced: .025 }[level] ?? .05; // gain par cycle de 12 semaines
  const cycles = Math.ceil(Math.log(target / current) / Math.log(1 + rate));
  return { cycles, months: cycles * 3, rate };
}

// ---------- Vue du cycle ----------
export function cycleOverview(p) {
  const weeks = weeksOf(p), kinds = [...new Set(p.s.flatMap(s => s[2].map(r => r[1])))];
  const rows = [];
  for (let w = 1; w <= weeks; w++) rows.push({ w, phase: phaseOf(p, w), schemes: Object.fromEntries(kinds.map(k => [k, p.custom ? "selon le plan" : schemeFor(p, [null, k], w)])) });
  return { weeks, kinds, rows };
}

// ---------- Exercices : remplacements, fiches ----------
export function alternatives(name) {
  const F = FICHES; if (!F?.ex?.[name]) return [];
  const fam = F.ex[name].fam;
  return Object.keys(F.ex).filter(n => n !== name && F.ex[n].fam === fam);
}
export function ficheOf(name) {
  const F = FICHES; const ex = F?.ex?.[name]; if (!ex) return null;
  const fam = F.fam[ex.fam] || {};
  return { name, ...ex, fam, svg: F.svg[fam.schema] || F.svg[ex.fam] || null };
}
export function allExercises() { return Object.keys(FICHES?.ex || {}).sort((a, b) => a.localeCompare(b, "fr")); }
