// Carburant : cibles, base Ciqual, plats types, plan alimentaire, journal.
import { S, update, today } from "./store.js";

let CQ = null, MODELS = null;
export async function loadModels() { if (!MODELS) MODELS = await (await fetch("data/nutrition-models.json")).json(); return MODELS; }
export async function loadCiqual() {
  if (!CQ) { const j = await (await fetch("data/ciqual.json")).json(); CQ = j.foods.map(f => ({ n: f[0], cat: f[1], kcal: f[2], p: f[3], c: f[4], f: f[5], k: norm(f[0]) })); }
  return CQ;
}
export const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe");

export function searchFoods(q, max = 30) {
  if (!CQ || !q.trim()) return [];
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const res = [];
  for (const f of CQ) {
    if (!terms.every(t => f.k.includes(t))) continue;
    let s = 0;
    if (f.k.startsWith(terms[0])) s += 4;
    if (/cru|cuit|bouilli/.test(f.k) && /cuit|bouilli/.test(f.k)) s += 1;
    if (f.cat === "Plats préparés") s -= 1;
    s -= f.n.length / 80;
    res.push([s, f]);
  }
  return res.sort((a, b) => b[0] - a[0]).slice(0, max).map(x => x[1]);
}

// ---------- Cibles caloriques (Mifflin-St Jeor) ----------
export const ACTIVITY = { low: 1.35, mid: 1.5, high: 1.65 };
export function pickModel(p) {
  if (p.diet === "vegan") return "vegan";
  if (p.diet === "vegetarian") return "vege";
  if (p.age >= 50) return "senior";
  if (p.goal === "fat") return p.sex === "f" ? "femme" : (p.level === "comeback" || p.level === "beginner" ? "douce" : "ventre");
  if (p.goal === "recomp") return "recompo";
  if (p.goal === "strength") return "force";
  if (p.goal === "restart") return "douce";
  return "prise";
}
export function targets(p = S().profile) {
  if (!p || !MODELS) return null;
  const m = MODELS.find(x => x.id === (p.nutritionModel || pickModel(p))) || MODELS[0];
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "f" ? -161 : 5);
  const kcal = Math.round(bmr * (ACTIVITY[p.activity] || 1.5) * (1 + (m.adj || 0) / 100) / 10) * 10;
  const prot = Math.round((m.pk || 1.8) * p.weight), fat = Math.round((m.lk || .9) * p.weight);
  const carbs = Math.max(50, Math.round((kcal - prot * 4 - fat * 9) / 4));
  return { model: m, kcal, prot, fat, carbs };
}

// ---------- Ingrédients de base (valeurs moyennes Ciqual arrondies, pour 100 g, pesés cuits) ----------
const ING = {
  riz: ["Riz cuit", 130, 2.7, 28, .3], pates: ["Pâtes cuites", 150, 5.2, 30, .9], pdt: ["Pommes de terre cuites", 80, 1.8, 16.7, .3],
  quinoa: ["Quinoa cuit", 149, 4.7, 27.9, 1.1], avoine: ["Flocons d'avoine", 370, 13, 58, 7], pain: ["Pain complet", 244, 8.4, 44.3, 1.8],
  poulet: ["Filet de poulet cuit", 160, 31, 0, 3.5], boeuf: ["Bœuf haché 5 % cuit", 155, 25.5, 0, 5.8], saumon: ["Saumon cuit", 200, 24, 0, 12],
  thon: ["Thon au naturel", 115, 26, 0, 1], oeuf: ["Œufs", 140, 12.5, .7, 9.8], tofu: ["Tofu nature", 148, 13.4, 2.9, 8.5],
  lentilles: ["Lentilles cuites", 104, 9, 12.2, .4], skyr: ["Skyr nature", 63, 11, 4, .2], fb: ["Fromage blanc 0 %", 46, 7.5, 4, .2],
  soja: ["Boisson au soja", 40, 3.4, 1.5, 2], legumes: ["Légumes", 30, 2, 4, .2], banane: ["Banane", 90, 1.1, 20, .3],
  pomme: ["Pomme", 52, .3, 11.6, .2], amandes: ["Amandes", 600, 19, 9.5, 51], huile: ["Huile d'olive", 900, 0, 0, 100],
};
// Plats nommés : ce que les gens mangent vraiment
export const DISHES = [
  { id: "porridge", n: "Porridge skyr banane", slot: "matin", diet: ["all", "vegetarian"], ing: { avoine: 60, skyr: 150, banane: 100 } },
  { id: "omelette", n: "Omelette 3 œufs, pain complet", slot: "matin", diet: ["all", "vegetarian"], ing: { oeuf: 165, pain: 60, huile: 5 } },
  { id: "porridge-soja", n: "Porridge soja banane amandes", slot: "matin", diet: ["all", "vegetarian", "vegan"], ing: { avoine: 70, soja: 250, banane: 100, amandes: 15 } },
  { id: "riz-poulet", n: "Riz, poulet, haricots verts", slot: "repas", diet: ["all"], ing: { riz: 200, poulet: 150, legumes: 200, huile: 10 } },
  { id: "bolo", n: "Pâtes bolognaise maigre", slot: "repas", diet: ["all"], ing: { pates: 220, boeuf: 125, legumes: 150, huile: 5 } },
  { id: "saumon", n: "Saumon, pommes de terre, légumes", slot: "repas", diet: ["all"], ing: { saumon: 130, pdt: 250, legumes: 200 } },
  { id: "salade-thon", n: "Salade thon, œufs, pommes de terre", slot: "repas", diet: ["all"], ing: { thon: 120, oeuf: 110, pdt: 200, legumes: 150, huile: 10 } },
  { id: "bowl-tofu", n: "Bowl lentilles, quinoa, tofu", slot: "repas", diet: ["all", "vegetarian", "vegan"], ing: { lentilles: 150, quinoa: 150, tofu: 120, legumes: 150, huile: 10 } },
  { id: "sin-carne", n: "Chili sin carne et riz", slot: "repas", diet: ["all", "vegetarian", "vegan"], ing: { lentilles: 200, riz: 150, legumes: 200, huile: 10 } },
  { id: "oeufs-riz", n: "Riz sauté aux œufs et légumes", slot: "repas", diet: ["all", "vegetarian"], ing: { riz: 200, oeuf: 165, legumes: 200, huile: 10 } },
  { id: "fb-amandes", n: "Fromage blanc, amandes, pomme", slot: "collation", diet: ["all", "vegetarian"], ing: { fb: 200, amandes: 20, pomme: 150 } },
  { id: "skyr-banane", n: "Skyr et banane", slot: "collation", diet: ["all", "vegetarian"], ing: { skyr: 150, banane: 100 } },
  { id: "soja-pomme", n: "Boisson soja, pomme, amandes", slot: "collation", diet: ["all", "vegetarian", "vegan"], ing: { soja: 300, pomme: 150, amandes: 20 } },
];
export function macrosOf(ing) {
  let kcal = 0, p = 0, c = 0, f = 0;
  for (const [k, g] of Object.entries(ing)) { const v = ING[k]; kcal += v[1] * g / 100; p += v[2] * g / 100; c += v[3] * g / 100; f += v[4] * g / 100; }
  return { kcal: Math.round(kcal), p: Math.round(p), c: Math.round(c), f: Math.round(f) };
}
const r5 = (g, k) => k === "oeuf" ? Math.max(55, Math.round(g / 55) * 55) : k === "huile" ? Math.max(5, Math.round(g / 5) * 5) : Math.max(5, Math.round(g / 5) * 5);
export function scaleDish(d, kcal) {
  const base = macrosOf(d.ing), f = kcal / base.kcal, ing = {};
  for (const [k, g] of Object.entries(d.ing)) ing[k] = (k === "legumes") ? g : r5(g * f, k);
  return { ...d, ing, m: macrosOf(ing), lines: Object.entries(ing).map(([k, g]) => k === "oeuf" ? `${g / 55} œuf${g > 55 ? "s" : ""}` : `${g} g ${ING[k][0].toLowerCase()}`) };
}

// ---------- Plan alimentaire du jour ----------
const SPLIT = [["Petit-déjeuner", "matin", .25], ["Déjeuner", "repas", .35], ["Collation", "collation", .12], ["Dîner", "repas", .28]];
export function dayPlan(t, date = today()) {
  if (S().myPlan?.meals?.length) return S().myPlan.meals.map(m => ({ meal: m.name, time: m.time, n: m.items.map(i => i.label).join(", ") || m.name, lines: m.items.map(i => `${i.g ? i.g + " g " : ""}${i.label}`), m: m.items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, p: a.p + i.p, c: a.c + i.c, f: a.f + i.f }), { kcal: 0, p: 0, c: 0, f: 0 }), poolSize: 1, mine: true }));
  const diet = S().profile?.diet || "all";
  const seed = Math.floor(new Date(date).getTime() / 864e5);
  const choice = S().planChoice?.[date] || {};
  return SPLIT.map(([meal, slot, share], i) => {
    const pool = DISHES.filter(d => d.slot === slot && d.diet.includes(diet === "all" ? "all" : diet));
    const pick = choice[meal] != null ? pool[choice[meal] % pool.length] : pool[(seed + i * 3) % pool.length];
    return { meal, slot, time: MEAL_TIMES[meal], ...scaleDish(pick, t.kcal * share), poolSize: pool.length };
  });
}
export function swapDish(meal, date = today()) {
  update(st => { st.planChoice = st.planChoice || {}; const c = st.planChoice[date] = st.planChoice[date] || {}; c[meal] = (c[meal] ?? Math.floor(Math.random() * 5)) + 1; });
}

// ---------- Journal ----------
export const MEALS = ["Petit-déjeuner", "Déjeuner", "Collation", "Dîner"];
export function dayLog(date = today()) { return S().food[date] || []; }
export function dayTotals(date = today()) {
  return dayLog(date).reduce((a, e) => ({ kcal: a.kcal + e.kcal, p: a.p + e.p, c: a.c + e.c, f: a.f + e.f }), { kcal: 0, p: 0, c: 0, f: 0 });
}
export const MEAL_TIMES = { "Petit-déjeuner": "08:00", "Déjeuner": "12:30", "Collation": "16:30", "Dîner": "19:30" };
export function addEntry(e, date = today()) {
  const now = new Date(); const t = e.time || (date === today() ? now.toTimeString().slice(0, 5) : MEAL_TIMES[e.meal] || "12:00");
  update(st => { (st.food[date] = st.food[date] || []).push({ id: Date.now() + Math.random(), ...e, time: t }); });
}
export function setEntryTime(id, time, date = today()) { update(st => { const e = (st.food[date] || []).find(x => x.id === id); if (e) e.time = time; }); }
export const isFavFood = (n) => S().favFoods.some(f => f.n === n);
export function toggleFavFood(f) { update(st => { st.favFoods = isFavFood(f.n) ? st.favFoods.filter(x => x.n !== f.n) : [f, ...st.favFoods]; }); }
export function lastMealTime(date = today()) { const l = dayLog(date); return l.length ? l.map(e => e.time || "00:00").sort().at(-1) : null; }
export function removeEntry(id, date = today()) { update(st => { st.food[date] = (st.food[date] || []).filter(e => e.id !== id); }); }
export function entryFromFood(f, g, meal) {
  const k = g / 100;
  return { meal, label: f.n, g, kcal: Math.round(f.kcal * k), p: +(f.p * k).toFixed(1), c: +(f.c * k).toFixed(1), f: +(f.f * k).toFixed(1) };
}
export function rememberFood(f) {
  update(st => { st.recentFoods = [f, ...st.recentFoods.filter(x => x.n !== f.n)].slice(0, 12); });
}

// Open Food Facts : code-barres
export async function lookupBarcode(code) {
  const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,nutriments,brands`);
  const j = await r.json();
  if (j.status !== 1) return null;
  const n = j.product.nutriments || {};
  return { n: [j.product.product_name, j.product.brands].filter(Boolean).join(" · ") || "Produit scanné", kcal: Math.round(n["energy-kcal_100g"] || 0), p: n.proteins_100g || 0, c: n.carbohydrates_100g || 0, f: n.fat_100g || 0 };
}
