// Lien avec le serveur CalXsthenos (Supabase). Tout échec réseau est silencieux : l'app reste utilisable hors ligne.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { CONFIG } from "./config.js";

export const sb = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "cxs.auth" } });

let uid = null;
export const userId = () => uid;

export async function ensureSession() {
  const { data } = await sb.auth.getSession();
  if (data.session) { uid = data.session.user.id; return uid; }
  const r = await sb.auth.signInAnonymously();
  if (r.error) throw r.error;
  uid = r.data.user.id; return uid;
}
export async function currentSession() {
  const { data } = await sb.auth.getSession(); uid = data.session?.user.id || null; return uid;
}

export async function saveProfile(fields) {
  if (!uid) await ensureSession();
  const { error } = await sb.from("profiles").update({ ...fields, last_seen: new Date().toISOString() }).eq("id", uid);
  if (error) throw error;
}
export async function fetchMe() {
  if (!uid) return null;
  const [{ data: p }, { data: left }] = await Promise.all([
    sb.from("profiles").select("id,email,name,tier,tier_until,is_coach").eq("id", uid).maybeSingle(),
    sb.rpc("msgs_left"),
  ]);
  return p ? { ...p, msgsLeft: left } : null;
}
export async function touch(stats) {
  if (!uid) return;
  const f = { last_seen: new Date().toISOString() }; if (stats) f.stats = stats;
  await sb.from("profiles").update(f).eq("id", uid);
}

// Messagerie
export async function thread(memberId = uid) {
  const { data, error } = await sb.from("messages").select("id,user_id,sender,body,created_at,read_at,reactions").eq("user_id", memberId).order("created_at", { ascending: true }).limit(300);
  if (error) throw error; return data;
}
export async function send(body, memberId = uid) {
  const { error } = await sb.from("messages").insert({ user_id: memberId, sender: uid, body });
  if (error) throw error;
}
// Réaction : { [userId]: emoji } (une réaction par personne, la retoucher l'enlève)
export async function react(id, emoji, current = {}) {
  const r = { ...(current || {}) }; if (r[uid] === emoji) delete r[uid]; else r[uid] = emoji;
  const { error } = await sb.from("messages").update({ reactions: r }).eq("id", id); if (error) throw error; return r;
}
export async function markRead(memberId, fromOther) {
  await sb.from("messages").update({ read_at: new Date().toISOString() }).eq("user_id", memberId).neq("sender", uid).is("read_at", null);
}
export async function unreadFromCoach() {
  if (!uid) return 0;
  const { count } = await sb.from("messages").select("id", { count: "exact", head: true }).eq("user_id", uid).neq("sender", uid).is("read_at", null);
  return count || 0;
}

// Notifications
export async function notifications() {
  if (!uid) return [];
  const { data } = await sb.from("notifications").select("id,user_id,title,body,created_at").or(`user_id.is.null,user_id.eq.${uid}`).order("created_at", { ascending: false }).limit(50);
  return data || [];
}

// Espace coach
export async function members() {
  const { data, error } = await sb.from("profiles").select("id,email,name,tier,tier_until,onboarding,stats,created_at,last_seen,is_coach").order("last_seen", { ascending: false }).limit(500);
  if (error) throw error;
  const { data: un } = await sb.from("messages").select("user_id,sender").is("read_at", null).limit(2000);
  const unread = {}; (un || []).forEach(m => { if (m.sender === m.user_id) unread[m.user_id] = (unread[m.user_id] || 0) + 1; });
  return data.filter(p => !p.is_coach).map(p => ({ ...p, unread: unread[p.id] || 0 }));
}
export async function setTier(id, tier) { const { error } = await sb.rpc("set_tier", { target: id, new_tier: tier }); if (error) throw error; }
export async function notify(title, body, to = null) {
  const { error } = await sb.from("notifications").insert({ user_id: to, title, body }); if (error) throw error;
}

// Données du membre pour l'espace coach (séances, journal, agenda, mesures)
export async function pushData(data, summary) {
  if (!uid) await ensureSession();
  const { error } = await sb.from("member_data").upsert({ user_id: uid, data, summary, updated_at: new Date().toISOString() });
  if (error) throw error;
}
export async function memberData(id) {
  const { data, error } = await sb.from("member_data").select("data,summary,updated_at").eq("user_id", id).maybeSingle();
  if (error) throw error; return data;
}
export async function allSummaries() {
  const { data, error } = await sb.from("member_data").select("user_id,summary,updated_at").order("updated_at", { ascending: false }).limit(500);
  if (error) throw error; return data || [];
}
