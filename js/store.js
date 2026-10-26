// Données locales : tout reste sur le téléphone de l'utilisateur.
const KEY = "cxs.v1";

const blank = () => ({
  profile: null,          // réponses de l'onboarding
  plan: null,             // { programId, startedAt, week, idx, cycle }
  lifts: {},              // { [exercice]: [{ d, e1rm }] } historique e1RM
  workouts: [],           // séances terminées
  current: null,          // séance en cours
  food: {},               // { 'YYYY-MM-DD': [entrées] }
  dishes: [],             // plats enregistrés par l'utilisateur
  recentFoods: [],        // derniers aliments utilisés
  measures: [],           // { d, weight, waist, hips, chest, arm, thigh }
  application: null,      // candidature coaching
  swaps: {},              // exercice d'origine -> remplaçant choisi
  settings: { word: "daily", haptics: true },
});

let state;
try { state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
catch { state = blank(); }

export const S = () => state;
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn("Stockage plein", e); }
}
export function update(fn) { fn(state); save(); }
export function resetAll() { state = blank(); save(); }
export function exportJSON() { return JSON.stringify({ app: "calxsthenos", v: 1, at: new Date().toISOString(), data: state }, null, 1); }
export function importJSON(text) {
  const o = JSON.parse(text);
  if (!o || o.app !== "calxsthenos" || !o.data) throw new Error("Ce fichier n'est pas une sauvegarde CalXsthenos.");
  state = Object.assign(blank(), o.data); save();
}

export const today = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4);
  return z.toISOString().slice(0, 10);
};

// Photos de progrès (IndexedDB)
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("cxs-photos", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("p", { keyPath: "id" });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
export async function addPhoto(blob) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction("p", "readwrite");
    tx.objectStore("p").put({ id: Date.now(), d: today(), blob });
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
export async function listPhotos() {
  try {
    const d = await db();
    return await new Promise((res) => {
      const r = d.transaction("p").objectStore("p").getAll();
      r.onsuccess = () => res(r.result.sort((a, b) => b.id - a.id)); r.onerror = () => res([]);
    });
  } catch { return []; }
}
export async function deletePhoto(id) {
  const d = await db();
  d.transaction("p", "readwrite").objectStore("p").delete(id);
}
