// La Parole — Louis Segond 1910 (domaine public). Texte à vérifier sur une Bible avant toute publication.
// tags : jour (accueil), repos (minuteur), fin (bilan de séance), dur (moments difficiles), repas (nutrition)
export const VERSES = [
  { ref: "1 Timothée 4:8", t: "Exerce-toi à la piété ; car l'exercice corporel est utile à peu de chose, tandis que la piété est utile à tout, ayant la promesse de la vie présente et de celle qui est à venir.", tags: ["jour", "fin"] },
  { ref: "Philippiens 4:13", t: "Je puis tout par celui qui me fortifie.", tags: ["jour", "repos", "fin"] },
  { ref: "Néhémie 8:10", t: "La joie de l'Éternel sera votre force.", tags: ["jour", "repos"] },
  { ref: "Psaume 18:33", t: "C'est Dieu qui me ceint de force, et qui me conduit dans la voie droite.", tags: ["jour", "repos", "fin"] },
  { ref: "Ésaïe 40:31", t: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles ; ils courent, et ne se lassent point, ils marchent, et ne se fatiguent point.", tags: ["jour", "fin"] },
  { ref: "Galates 6:9", t: "Ne nous lassons pas de faire le bien ; car nous moissonnerons au temps convenable, si nous ne nous relâchons pas.", tags: ["jour", "fin", "dur"] },
  { ref: "Hébreux 12:11", t: "Il est vrai que tout châtiment semble d'abord un sujet de tristesse, et non de joie ; mais il produit plus tard pour ceux qui ont été ainsi exercés un fruit paisible de justice.", tags: ["jour", "fin"] },
  { ref: "1 Corinthiens 6:19-20", t: "Ne savez-vous pas que votre corps est le temple du Saint-Esprit qui est en vous, que vous avez reçu de Dieu, et que vous ne vous appartenez point à vous-mêmes ? Car vous avez été rachetés à un grand prix. Glorifiez donc Dieu dans votre corps et dans votre esprit, qui appartiennent à Dieu.", tags: ["jour", "dur"] },
  { ref: "1 Corinthiens 10:31", t: "Soit donc que vous mangiez, soit que vous buviez, soit que vous fassiez quelque autre chose, faites tout pour la gloire de Dieu.", tags: ["jour", "repas"] },
  { ref: "Colossiens 3:23", t: "Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes.", tags: ["jour", "repos", "fin"] },
  { ref: "Psaume 139:14", t: "Je te loue de ce que je suis une créature si merveilleuse. Tes œuvres sont admirables, et mon âme le reconnaît bien.", tags: ["jour", "dur"] },
  { ref: "2 Corinthiens 12:9", t: "Ma grâce te suffit, car ma puissance s'accomplit dans la faiblesse.", tags: ["repos", "dur"] },
  { ref: "Josué 1:9", t: "Ne t'ai-je pas donné cet ordre : Fortifie-toi et prends courage ? Ne t'effraie point et ne t'épouvante point, car l'Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.", tags: ["jour", "fin"] },
  { ref: "2 Timothée 1:7", t: "Car ce n'est pas un esprit de timidité que Dieu nous a donné, mais un esprit de force, d'amour et de sagesse.", tags: ["jour", "repos"] },
  { ref: "Lamentations 3:22-23", t: "Les bontés de l'Éternel ne sont pas épuisées, ses compassions ne sont pas à leur terme ; elles se renouvellent chaque matin. Oh ! que ta fidélité est grande !", tags: ["jour", "dur"] },
  { ref: "Proverbes 24:16", t: "Car sept fois le juste tombe, et il se relève.", tags: ["repos", "dur"] },
  { ref: "Matthieu 11:28", t: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.", tags: ["dur"] },
  { ref: "Ésaïe 41:10", t: "Ne crains rien, car je suis avec toi ; ne promène pas des regards inquiets, car je suis ton Dieu ; je te fortifie, je viens à ton secours.", tags: ["jour", "dur"] },
  { ref: "1 Corinthiens 9:24", t: "Ne savez-vous pas que ceux qui courent dans le stade courent tous, mais qu'un seul remporte le prix ? Courez de manière à le remporter.", tags: ["fin", "repos"] },
  { ref: "Matthieu 4:4", t: "L'homme ne vivra pas de pain seulement, mais de toute parole qui sort de la bouche de Dieu.", tags: ["repas"] },
  { ref: "Jean 3:16", t: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.", tags: ["jour"] },
];

// Déclarations : vérités de la Parole dites à la première personne
export const DECLARATIONS = [
  { t: "Mon corps est le temple du Saint-Esprit ; j'en prends soin pour la gloire de Dieu.", ref: "1 Corinthiens 6:19-20" },
  { t: "Je suis une créature merveilleuse ; ma valeur ne dépend pas d'un chiffre.", ref: "Psaume 139:14" },
  { t: "Dieu ne m'a pas donné un esprit de timidité, mais de force, d'amour et de sagesse.", ref: "2 Timothée 1:7" },
  { t: "Sa grâce me suffit ; sa puissance s'accomplit dans ma faiblesse.", ref: "2 Corinthiens 12:9" },
  { t: "Ses compassions se renouvellent chaque matin ; aujourd'hui, je recommence.", ref: "Lamentations 3:22-23" },
  { t: "Je tombe peut-être, mais je me relève.", ref: "Proverbes 24:16" },
  { t: "Je fais tout de bon cœur, comme pour le Seigneur.", ref: "Colossiens 3:23" },
];

const dayIndex = (d = new Date()) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5) + d.getFullYear() * 7;

export function verseFor(tag, seed = dayIndex()) {
  const pool = VERSES.filter(v => v.tags.includes(tag));
  return pool[((seed % pool.length) + pool.length) % pool.length];
}
export const verseOfDay = () => verseFor("jour");
export const declarationOfDay = () => DECLARATIONS[dayIndex() % DECLARATIONS.length];

export function wordCard(v, cls = "") {
  if (!v) return "";
  return `<figure class="word ${cls}" style="margin:0"><q>${v.t}</q><cite>${v.ref}</cite></figure>`;
}
