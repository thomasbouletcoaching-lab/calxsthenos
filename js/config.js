// Réglages publics de CalXsthenos (aucun secret ici : ce fichier est visible de tous).
export const CONFIG = {
  coachName: "Thomas Boulet",
  coachTitle: "Coach diplômé STAPS · Paris",
  calendly: "https://calendly.com/thomboulet/15min",
  instagram: "",
  email: "",
  supabaseUrl: "https://rqmkghfvwntlmjkoiezh.supabase.co",
  supabaseKey: "sb_publishable_G8Qbq88SyD9ZGNBwavcacA_xi1HuhVU",
};

// Les 6 formules. Les liens de paiement Stripe se collent dans `pay` quand ils sont prêts.
export const OFFERS = [
  { id: "free", rank: 0, name: "Gratuit", price: "0 €", per: "", msgs: "2 messages par semaine avec Thomas",
    tagline: "Pour commencer, sans engagement.",
    feats: ["Ton programme de départ : les 4 premières semaines", "Charges calculées à chaque séance", "Journal alimentaire et anneaux de macros", "Parole du jour, affirmations, 5 favoris", "Suivi du poids"] },
  { id: "premium", rank: 1, name: "Premium", price: "19,99 €", per: "/mois", alt: "ou 119,99 € par an, soit 10 € par mois", msgs: "5 messages par semaine",
    tagline: "L'app complète, en autonomie.", ribbon: "Le plus choisi",
    feats: ["Tous les programmes de la banque", "Progression sur 12 semaines et au-delà", "Plan alimentaire en vrais plats", "Courbes de force, mensurations et photos", "Favoris illimités"],
    pay: { month: "", year: "" } },
  { id: "essentiel", rank: 2, name: "Suivi essentiel", price: "59 €", per: "/mois", msgs: "10 messages par semaine",
    tagline: "L'app, avec un coach qui garde un œil sur toi.",
    feats: ["Tout le Premium", "Bilan mensuel lu et commenté par Thomas", "Programme choisi et ajusté chaque mois", "Réponse à tes questions sous 48 h"] },
  { id: "suivi", rank: 3, name: "Suivi", price: "99 €", per: "/mois", msgs: "20 messages par semaine",
    tagline: "Un bilan chaque semaine, des ajustements chaque semaine.",
    feats: ["Tout le Suivi essentiel", "Bilan hebdomadaire avec retour personnalisé", "Charges et macros ajustées chaque semaine", "Réponse sous 24 h"] },
  { id: "avance", rank: 4, name: "Suivi avancé", price: "249 €", per: "/mois", msgs: "50 messages par semaine",
    tagline: "Un programme et un plan écrits pour toi.",
    feats: ["Tout le Suivi", "Programme écrit sur mesure", "Plan alimentaire personnalisé", "Analyse vidéo de ta technique", "1 appel par mois avec Thomas"] },
  { id: "surmesure", rank: 5, name: "Coaching sur mesure", price: "339 €", per: "/mois", msgs: "Messages illimités, réponse prioritaire",
    tagline: "L'accompagnement complet, corps, âme et esprit.",
    feats: ["Tout le Suivi avancé", "Un appel toutes les 2 semaines", "Une séance en salle offerte (Paris)", "Accompagnement corps, âme et esprit"] },
];
export const offer = (id) => OFFERS.find(o => o.id === id) || OFFERS[0];
export const MSGS_PER_WEEK = { free: 2, premium: 5, essentiel: 10, suivi: 20, avance: 50, surmesure: null };
// Programmes accessibles sans Premium
export const FREE_PROGRAMS = ["tb-rep2", "tb-rep3"];
export const FREE_WEEKS = 4;
export const FREE_FAVORITES = 5;
