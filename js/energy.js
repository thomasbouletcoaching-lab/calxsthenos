// Dépense énergétique : MB (Mifflin-St Jeor), NEAT (pas + activité), EAT (séances, cardio), TEF (effet thermique), TDEE.
import { S, today } from "./store.js";

export const ACTIVITY_NEAT = { low: 0.15, light: 0.22, mid: 0.3, high: 0.5, vhigh: 0.65 }; // fraction du MB hors pas comptés
export const CARDIO = [
  ["Marche", 3.5], ["Marche rapide / inclinée", 5], ["Vélo zone 2", 6], ["Rameur", 7], ["Course lente", 8], ["Course", 10],
  ["Corde à sauter", 11], ["Natation", 7], ["Elliptique", 5.5], ["Sport collectif", 7], ["HIIT", 9],
];
export const day = (d = today()) => S().daily?.[d] || {};
export function bmr(p = S().profile) {
  if (!p) return 1600;
  const w = day().weight || p.weight;
  return 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === "f" ? -161 : 5);
}
const weight = () => day().weight || S().profile?.weight || 75;
// kcal des pas : ~0,0005 kcal par pas et par kg (≈ 0,04 kcal/pas à 80 kg)
export const stepsKcal = (steps, w = weight()) => Math.round((steps || 0) * 0.0005 * w);
// kcal d'une séance de musculation : MET 5 par heure
export const liftKcal = (min, w = weight()) => Math.round(5 * w * (min / 60));
export const cardioKcal = (met, min, w = weight()) => Math.round(met * w * (min / 60));

export function breakdown(d = today()) {
  const p = S().profile, D = S().daily?.[d] || {};
  const B = Math.round(bmr(p));
  const steps = D.steps ?? 0;
  const baseNeat = Math.round(B * (ACTIVITY_NEAT[p?.activity] ?? .3) * .5);
  const neat = baseNeat + stepsKcal(steps);
  const lifts = S().workouts.filter(w => w.end?.slice(0, 10) === d).reduce((a, w) => a + liftKcal(Math.max(10, (new Date(w.end) - new Date(w.start)) / 6e4)), 0);
  const cardio = (D.cardio || []).reduce((a, c) => a + cardioKcal(c.met, c.min), 0);
  const eat = lifts + cardio;
  const intake = (S().food?.[d] || []).reduce((a, e) => a + e.kcal, 0);
  const tef = Math.round((intake || 0) * 0.1);
  return { bmr: B, neat, steps, eat, lifts, cardio, tef, intake, tdee: B + neat + eat + tef };
}
// Dépense « à cette heure » : MB et NEAT de base au prorata de l'heure + ce qui a été fait
export function burnedNow(d = today()) {
  const b = breakdown(d), now = new Date();
  const frac = d === today() ? (now.getHours() * 60 + now.getMinutes()) / 1440 : 1;
  const base = Math.round((b.bmr + (b.neat - stepsKcal(b.steps))) * frac);
  return { now: base + stepsKcal(b.steps) + b.eat + b.tef, total: b.tdee, frac, ...b };
}
// Jeûne : ce qui se passe dans le corps (repères moyens, variables d'une personne à l'autre)
export const FAST_STAGES = [
  [0, "🍽️", "Digestion", "Le corps utilise le repas : glycémie et insuline montent puis redescendent."],
  [4, "📉", "Fin de digestion", "L'insuline revient à son niveau de base. Le corps puise dans le glycogène du foie."],
  [12, "🔥", "Bascule vers les graisses", "Le glycogène du foie baisse : la part d'énergie venant des graisses augmente nettement."],
  [16, "⚡", "Début de cétose légère", "Le foie produit davantage de corps cétoniques. La faim se stabilise souvent par vagues."],
  [24, "🧠", "Cétose installée", "Les corps cétoniques deviennent un carburant important. À réserver aux personnes en bonne santé."],
  [48, "⚠️", "Jeûne prolongé", "Au-delà de 48 h, avis médical recommandé. Hydratation et électrolytes indispensables."],
];
export function fastState() {
  const f = S().fast; if (!f?.start) return null;
  const h = (Date.now() - new Date(f.start)) / 36e5;
  const stage = [...FAST_STAGES].reverse().find(s => h >= s[0]);
  const next = FAST_STAGES.find(s => s[0] > h);
  return { hours: h, stage, next, goal: f.goal || 16 };
}
