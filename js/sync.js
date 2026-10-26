// Synchronisation avec le serveur : profil, formule, compteurs (messages, notifications).
import { S, update } from "./store.js";
import { cloud, badges, isCoach } from "./core.js";

export async function syncProfile() {
  const c = await cloud(); if (!c || !S().profile) return;
  try {
    await c.ensureSession();
    const p = S().profile;
    await c.saveProfile({ email: p.email, name: p.name, onboarding: { ...p, word: S().settings.word, application: S().application || null } });
    update(st => st.synced = true);
    await refreshMe();
  } catch (e) { console.warn("Synchronisation impossible :", e.message); }
}
export async function refreshMe() {
  const c = await cloud(); if (!c || !S().profile) return;
  try {
    if (!(await c.currentSession())) await c.ensureSession();
    if (!S().synced) return syncProfile();
    const me = await c.fetchMe();
    if (me) update(st => st.me = { tier: me.tier, isCoach: me.is_coach, msgsLeft: me.msgsLeft, until: me.tier_until });
    const [un, ns] = await Promise.all([c.unreadFromCoach(), c.notifications()]);
    badges.msgs = un; badges.notifs = ns.filter(n => new Date(n.created_at).getTime() > S().notifSeen).length;
    if (isCoach()) { const ms = await c.members(); window.__members = ms; badges.msgs = ms.reduce((a, m) => a + m.unread, 0); }
    document.querySelectorAll(".top [data-a=notifs]").forEach(b => { b.querySelector(".badge")?.remove(); if (badges.notifs) b.insertAdjacentHTML("beforeend", `<span class="badge">${badges.notifs}</span>`); });
    document.querySelectorAll('.tab[href="#/coach"]').forEach(b => { b.querySelector(".badge")?.remove(); if (badges.msgs) b.insertAdjacentHTML("beforeend", `<span class="badge">${badges.msgs}</span>`); });
  } catch (e) { console.warn(e.message); }
}
export function pushStats() {
  const d = S().daily || {}, last = Object.keys(d).sort().at(-1);
  cloud().then(c => c?.touch({ workouts: S().workouts.length, lastWorkout: S().workouts.at(-1)?.end || null, weight: (last && d[last].weight) || S().profile?.weight, program: S().plan?.programId, week: S().plan?.week })).catch(() => { });
}
