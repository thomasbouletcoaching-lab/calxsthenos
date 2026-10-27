import { OFFERS, CONFIG } from "../js/config.js";
import { TEMOIGNAGES } from "./temoignages.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Menu mobile
const burger = document.querySelector(".burger"), menu = document.getElementById("menu");
burger?.addEventListener("click", () => {
  const o = menu.classList.toggle("ouvert");
  burger.setAttribute("aria-expanded", o);
});
menu?.addEventListener("click", (e) => { if (e.target.closest("a")) { menu.classList.remove("ouvert"); burger.setAttribute("aria-expanded", "false"); } });

// Offres, lues depuis la config de l'app (une seule source de vérité)
const GROUPES = { app: ["free", "premium"], coaching: ["essentiel", "suivi", "avance", "surmesure"] };
const CTA = {
  free: ["Commencer gratuitement", "../", "btn-ligne"],
  premium: ["Essayer 7 jours", "../#/offers", "btn-plein"],
  essentiel: ["Rejoindre la Fraternité", "../#/offers", "btn-ligne"],
};
const calendly = CONFIG.calendly || "https://calendly.com/thomboulet/15min";
document.querySelectorAll("[data-offres]").forEach((box) => {
  box.innerHTML = GROUPES[box.dataset.offres].map((id) => {
    const o = OFFERS.find((x) => x.id === id);
    if (!o) return "";
    const [label, href, cls] = CTA[id] || ["Réserver mon appel", calendly, id === "avance" ? "btn-plein" : "btn-ligne"];
    const ext = href.startsWith("http") ? ' target="_blank" rel="noopener"' : "";
    return `<article class="offre${o.ribbon ? " mise" : ""}">
      ${o.ribbon ? `<span class="ruban">${esc(o.ribbon)}</span>` : ""}
      <h3>${esc(o.name)}</h3>
      <p class="accroche">${esc(o.tagline)}</p>
      <div class="prix">${esc(o.price)}<small>${esc(o.per)}</small></div>
      <div class="alt">${esc(o.alt || "")}</div>
      <ul>${o.feats.map((f) => `<li>${esc(f)}</li>`).join("")}<li>${esc(o.msgs)}</li></ul>
      <a class="btn ${cls}" href="${href}"${ext}>${esc(label)}</a>
    </article>`;
  }).join("");
});

// Résultats réels, ou offre fondateur tant qu'il n'y en a pas
const res = document.querySelector("[data-resultats]");
if (res) {
  if (TEMOIGNAGES.length) {
    res.innerHTML = TEMOIGNAGES.map((t) => `<article class="carte resultat">
      ${t.photo ? `<img src="${esc(t.photo)}" alt="Résultat de ${esc(t.prenom)}" loading="lazy">` : ""}
      <div class="chiffre">${esc(t.chiffre)}</div>
      <p class="gris" style="margin:4px 0 0">${esc(t.prenom)}${t.age ? `, ${esc(t.age)} ans` : ""} · ${esc(t.situation || "")}${t.duree ? ` · ${esc(t.duree)}` : ""}</p>
      ${t.citation ? `<blockquote>« ${esc(t.citation)} »</blockquote>` : ""}
    </article>`).join("");
  } else {
    res.innerHTML = `<article class="carte fondateur" style="grid-column:1/-1">
      <span class="surtitre">Offre fondateur · 10 places</span>
      <h3 style="margin:6px 0 10px">CalXsthenos vient de naître. Les premiers résultats, ce sera peut-être les tiens.</h3>
      <p>Je ne vais pas t'afficher des avant/après empruntés. Je cherche 10 hommes, pères ou très occupés, pour un premier cycle de 12 semaines en Coaching Proximité à <b>590 €</b> au lieu de 890 €. En échange : tu remplis tes bilans chaque semaine et, si tu en es content, tu acceptes de témoigner (photos facultatives).</p>
      <div class="actions" style="margin-top:16px"><a class="btn btn-plein" href="${calendly}" target="_blank" rel="noopener">Candidater en 15 min</a></div>
    </article>`;
  }
}

document.querySelectorAll("[data-annee]").forEach((e) => (e.textContent = new Date().getFullYear()));
