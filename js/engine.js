// Moteur d'entraînement : programmes (Méthode Thomas Boulet), charges calculées, surcharge progressive ajustée au réel.
import { S, update, today } from "./store.js";

let PROG = null, FICHES = null;
export async function loadPrograms() {
  if (!PROG) PROG = await (await fetch("data/programs.json")).json();
  return PROG;
}
export async function loadFiches() {
  if (!FICHES) { try { FICHES = await (await fetch("data/fiches.json")).json(); } catch { FICHES = { ex: {}, fam: {}, svg: {} }; } }
  return FICHES;
}
export const programs = () => PROG?.P || [];
export const program = (id) => programs().find(p => p.id === id) || null;
export const fiches = () => FICHES;

export const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const DAY_SHORT = ["L", "M", "M", "J", "V", "S", "D"];
export const KIND_LABEL = { F: "Force", S: "Secondaire", P: "Principal", I: "Isolation", C: "Gainage", A: "Accessoire", N: "Street", K: "Activation", M: "Mobilité", G: "Gainage", R: "Rééducation", U: "Unilatéral", J: "Renfort" };
const REST = { F: 180, N: 150, S: 120, P: 120, A: 90, U: 90, J: 90, I: 75, G: 60, C: 60, R: 60, K: 45, M: 30 };

// ---------- Choix du programme ----------
export function pickProgram(p) {
  if (p.backPain) return "tb-dos4";
  const adv = p.level === "advanced", beg = p.level === "beginner" || p.level === "comeback";
  if (beg) return p.days <= 2 ? "tb-rep2" : "tb-rep3";
  if (p.discipline === "streetlifting") return adv ? "tb-ml4" : "tb-pb4";
  if (p.discipline === "powerbuilding") return adv ? "tb-pb4" : "tb-int4";
  if (p.days <= 2) return "tb-rep2";
  if (p.days === 3) return "tb-int3";
  if (p.days >= 5 && adv) return "tb-adv5";
  return "tb-int4";
}

export function weeksOf(p) { const sc = PROG.SC[p.sc]; return sc[Object.keys(sc)[0]].length; }
export function phaseOf(p, w) { return (p.ph || PROG.PH)[w - 1] || ""; }

// ---------- Lecture des schémas : "3x8-10 RPE8", "1x3@85% + 4x5@75%", "2x10-12 RPE9 + 1x10-12 RPE10 DS"
export function parseScheme(str) {
  return String(str || "3x8-12 RPE8").split("+").map(s => s.trim()).map(s => {
    const m = s.match(/^(\d+)\s*x\s*(\d+)(?:-(\d+))?(?:\s*@\s*([\d.]+)%)?(?:\s*RPE\s*([\d.]+))?(\s*DS)?/i);
    if (!m) return { sets: 3, lo: 8, hi: 12, rpe: 8 };
    return { sets: +m[1], lo: +m[2], hi: +(m[3] || m[2]), pct: m[4] ? +m[4] : null, rpe: m[5] ? +m[5] : null, ds: !!m[6] };
  });
}

// ---------- Exercices : unités, incréments, poids du corps
const BW = /poids de corps|pompes|gainage|planche|plank|dead bug|bird dog|hollow|relev[ée] de jambes(?! .*lest)|hip airplane|stretch|étirement|copenhagen|chaise contre|superman|mobilit|respiration|90\/90|cat camel|McGill|crunch au sol|tractions(?!.*lest)|dips(?!.*lest)|muscle-up|traction australienne/i;
export function unitOf(name, kind) {
  if (kind === "M") return "s";
  if (/gainage|planche|plank|chaise contre|copenhagen|hollow|suspension|isom|L-sit|stretch|étirement/i.test(name)) return "s";
  return "reps";
}
export const isBodyweight = (name) => BW.test(name) && !/lest/i.test(name);
export function stepOf(name) {
  if (/lest/i.test(name)) return 1.25;
  if (/kettlebell/i.test(name)) return 4;
  if (/haltère/i.test(name)) return 2;
  return 2.5;
}
export const roundTo = (kg, step) => Math.max(0, Math.round(kg / step) * step);
export const fmtKg = (kg) => (Math.round(kg * 100) / 100).toString().replace(".", ",");

// Formule d'Epley avec répétitions en réserve (RIR = 10 − RPE)
export function e1rm(kg, reps, rpe = 8) {
  if (!kg || !reps) return 0;
  const r = Math.min(reps + Math.max(0, 10 - (rpe || 8)), 15);
  return kg * (1 + r / 30);
}
export const loadFor = (e, reps, rpe = 8) => e / (1 + Math.min(reps + Math.max(0, 10 - rpe), 15) / 30);

// Estimations de départ à partir des records saisis à l'onboarding
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
export function seedE1rm(name) {
  const rec = S().profile?.records || {};
  for (const [re, key, f] of SEEDS) if (re.test(name) && rec[key]?.e1rm) return rec[key].e1rm * f;
  return 0;
}
export function currentE1rm(name) {
  const h = S().lifts[name];
  if (!h?.length) return seedE1rm(name);
  const last = h[h.length - 1].e1rm, best3 = Math.max(...h.slice(-3).map(x => x.e1rm));
  return last * .6 + best3 * .4; // suit la forme du moment sans s'effondrer sur une mauvaise séance
}

// ---------- Plan et séance du jour ----------
export function planState() { return S().plan; }
export function nextSession() {
  const pl = S().plan; if (!pl) return null;
  const p = program(pl.programId); if (!p) return null;
  const s = p.s[pl.idx % p.s.length];
  return { p, week: pl.week, idx: pl.idx, title: s[0], day: s[1], exercises: s[2], phase: phaseOf(p, pl.week), weeks: weeksOf(p), cycle: pl.cycle || 1 };
}

export function daysSinceLast() {
  const w = S().workouts; if (!w.length) return null;
  return Math.floor((Date.now() - new Date(w[w.length - 1].end).getTime()) / 864e5);
}

export function buildSession() {
  const ns = nextSession(); if (!ns) return null;
  const { p, week } = ns;
  const sc = PROG.SC[p.sc];
  const gap = daysSinceLast();
  const comeback = gap !== null && gap >= 14; // reprise après 2 semaines : charges à 90 %
  const exercises = ns.exercises.map((t, i) => {
    const orig = t[0], name = S().swaps[orig] || orig, kind = t[1];
    const scheme = (sc[kind] || sc.I || ["3x8-12 RPE8"])[week - 1] || "3x8-12 RPE8";
    const groups = parseScheme(scheme);
    const unit = unitOf(name, kind), bw = isBodyweight(name) || unit === "s";
    const e = bw ? 0 : currentE1rm(name), step = stepOf(name);
    const prev = lastPerformance(name);
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
        sets.push({ g: gi, kg, reps: unit === "s" ? g.lo : (prev && !e && bw ? prev.reps : g.lo), lo: g.lo, hi: g.hi, rpe: g.rpe, trpe: g.rpe || 8, pct: g.pct, ds: g.ds && k === g.sets - 1, done: false });
      }
    });
    return { orig, name, kind, note: t[2] || "", ss: t[3] || null, tempo: t[4] || null, scheme, unit, bw, step, rest: REST[kind] || 90, sets, newE: e };
  });
  return { id: Date.now(), programId: p.id, week, idx: ns.idx, title: ns.title, phase: ns.phase, start: new Date().toISOString(), comeback, exercises };
}

export function lastPerformance(name) {
  const w = S().workouts;
  for (let i = w.length - 1; i >= 0; i--) {
    const ex = w[i].exercises.find(x => x.name === name);
    if (ex) { const s = ex.sets.filter(x => x.done); if (s.length) return s.reduce((a, b) => (e1rm(b.kg, b.reps, b.rpe) > e1rm(a.kg, a.reps, a.rpe) ? b : a)); }
  }
  return null;
}

// Fin de séance : met à jour les e1RM, détecte les records, fait avancer le plan.
export function finishSession(cur) {
  const d = today(), records = [];
  let volume = 0, sets = 0;
  update(st => {
    cur.exercises.forEach(ex => {
      const done = ex.sets.filter(s => s.done);
      sets += done.length;
      done.forEach(s => { if (s.kg && ex.unit === "reps") volume += s.kg * s.reps; });
      if (ex.bw) return;
      const best = Math.max(0, ...done.filter(s => s.kg && s.reps && !s.ds).map(s => e1rm(s.kg, s.reps, s.rpe ?? s.trpe)));
      if (!best) return;
      const cur0 = currentE1rm(ex.name);
      const felt = done.some(s => s.rpeSet);
      // Séries en % ou ressenti non précisé : une séance sous-maximale ne fait pas baisser l'estimation.
      const val = (!felt && cur0 && best < cur0) ? cur0 : best;
      const h = st.lifts[ex.name] || (st.lifts[ex.name] = []);
      const prevBest = h.length ? Math.max(...h.map(x => x.e1rm)) : 0;
      if (Math.max(prevBest, seedE1rm(ex.name)) && best > Math.max(prevBest, seedE1rm(ex.name)) * 1.005) records.push({ name: ex.name, before: Math.max(prevBest, seedE1rm(ex.name)), after: best });
      h.push({ d, e1rm: Math.round(val * 10) / 10 });
      if (h.length > 120) h.splice(0, h.length - 120);
    });
    cur.end = new Date().toISOString();
    cur.volume = Math.round(volume); cur.setsDone = sets; cur.records = records;
    st.workouts.push(cur);
    st.current = null;
    const p = program(st.plan.programId);
    st.plan.idx++;
    if (st.plan.idx >= p.s.length) {
      st.plan.idx = 0; st.plan.week++;
      if (st.plan.week > weeksOf(p)) { st.plan.week = 1; st.plan.cycle = (st.plan.cycle || 1) + 1; }
    }
  });
  return cur;
}

// Semaine type : séances placées sur les jours du programme
export function weekLayout(p) {
  const out = []; let k = 0;
  p.days.forEach((on, i) => { if (on && k < p.s.length) { out.push({ dow: i, s: p.s[k], k }); k++; } });
  return out;
}

export function workoutsThisWeek() {
  const now = new Date(), mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  return S().workouts.filter(w => new Date(w.end) >= mon);
}
export function activeWeeks(n = 8) {
  const out = []; const now = new Date(); now.setHours(0, 0, 0, 0);
  const mon = new Date(now); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  for (let i = n - 1; i >= 0; i--) {
    const a = new Date(mon); a.setDate(a.getDate() - 7 * i); const b = new Date(a); b.setDate(b.getDate() + 7);
    out.push({ start: a, count: S().workouts.filter(w => { const t = new Date(w.end); return t >= a && t < b; }).length });
  }
  return out;
}
export function streakWeeks() {
  const w = activeWeeks(52); let n = 0;
  for (let i = w.length - 1; i >= 0; i--) { if (w[i].count > 0) n++; else if (i === w.length - 1) continue; else break; }
  return n;
}

// Exercices de remplacement : même schéma moteur (famille)
export function alternatives(name) {
  const F = FICHES; if (!F?.ex?.[name]) return [];
  const fam = F.ex[name].fam;
  return Object.keys(F.ex).filter(n => n !== name && F.ex[n].fam === fam);
}
export function ficheOf(name) {
  const F = FICHES; const ex = F?.ex?.[name]; if (!ex) return null;
  const fam = F.fam[ex.fam] || {};
  return { ...ex, famName: fam.nom, muscles: fam.muscles, svg: F.svg[fam.schema] || F.svg[ex.fam] || null };
}
