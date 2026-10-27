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

// Les formules. Les liens de paiement Stripe se collent dans `pay` quand ils sont prêts.
// Les identifiants (free, premium, essentiel, suivi, avance, surmesure) sont ceux du serveur : ne pas les changer.
// Prix pensés pour la conversion : .99 sur l'app (achat d'impulsion), prix ronds sur le coaching (prestige),
// une offre d'ancrage en haut (Élite, places limitées) pour rendre l'offre du milieu évidente, l'annuel très avantageux.
export const OFFERS = [
  { id: "free", rank: 0, name: "Gratuit", price: "0 €", per: "", msgs: "2 messages par semaine avec Thomas",
    tagline: "La Parole et l'essentiel, pour toujours.",
    feats: ["La Bible complète, surlignages, notes, favoris : gratuits pour toujours", "Verset du jour, affirmations, « Qui est Jésus ? »", "Carnet de séance, minuteur, charges calculées", "Agenda, routine du jour, eau et jeûne", "Journal alimentaire et repas enregistrés"] },
  { id: "premium", rank: 1, name: "Bâtisseur", price: "14,99 €", per: "/mois", alt: "ou 99 € par an : 8,25 € par mois, plus de 5 mois offerts", msgs: "5 messages par semaine",
    tagline: "L'app complète, pour avancer seul avec ma méthode.", ribbon: "7 jours d'essai",
    feats: ["Tout le Gratuit", "Tous les programmes et le cycle complet de 12 semaines", "Réglage de la surcharge progressive, suggestions selon ton RPE", "Plan de repas, 49 recettes, batch cooking", "Budget des courses : prix des recettes et de la liste", "Dépense calorique détaillée, statistiques, photos, mensurations", "Toute la bibliothèque de connaissances"],
    pay: { month: "", year: "" } },
  { id: "essentiel", rank: 2, name: "Fraternité", price: "59 €", per: "/mois", msgs: "10 messages par semaine",
    tagline: "Avancer avec d'autres hommes, et un coach qui garde un œil sur toi.",
    feats: ["Tout Bâtisseur", "Le groupe privé des bâtisseurs : entraide, prière, défis", "Un live questions-réponses par mois avec Thomas", "2 corrections vidéo de ta technique par mois", "Bilan mensuel commenté"] },
  { id: "suivi", rank: 3, name: "Coaching Essentiel", price: "189 €", per: "/mois", msgs: "20 messages par semaine",
    tagline: "Ton programme et ton plan, écrits pour toi.",
    feats: ["Tout Fraternité", "Programme 100 % sur mesure : ta semaine, ta salle ou ta maison", "Plan alimentaire selon tes goûts et ton budget de courses", "Bilan chaque semaine, ajustements chaque mois", "Réponse sous 24 h"] },
  { id: "avance", rank: 4, name: "Coaching Proximité", price: "339 €", per: "/mois", alt: "ou 890 € les 12 semaines payées d'avance", msgs: "50 messages par semaine",
    tagline: "Je corrige, j'ajuste et je te suis de près.", ribbon: "Le plus choisi",
    feats: ["Tout le Coaching Essentiel", "Corrections vidéo illimitées", "Ajustements chaque semaine", "Un appel visio de 30 min par mois", "Accompagnement corps, âme et esprit"] },
  { id: "surmesure", rank: 5, name: "Coaching Élite", price: "509 €", per: "/mois", alt: "ou 1 390 € les 12 semaines payées d'avance · 5 places", msgs: "Messages et vocaux illimités, réponse prioritaire",
    tagline: "Le mentorat complet. Je ne prends que 5 hommes à la fois.",
    feats: ["Tout le Coaching Proximité", "Disponibilité quasi directe (vocaux prioritaires)", "Un appel toutes les 2 semaines", "Nutrition revue au détail, adaptée à chaque imprévu", "Une séance en salle offerte (Paris)"] },
];
export const offer = (id) => OFFERS.find(o => o.id === id) || OFFERS[0];
export const MSGS_PER_WEEK = { free: 2, premium: 5, essentiel: 10, suivi: 20, avance: 50, surmesure: null };
// Programmes accessibles sans Premium
// Phase de test : toutes les fonctionnalités sont ouvertes à tous (les offres restent visibles pour le coaching)
export const ALL_FREE = true;
export const FREE_PROGRAMS = ["tb-rep2", "tb-rep3"];
export const FREE_WEEKS = 4;
export const FREE_FAVORITES = 5;
