// La Parole — Louis Segond 1910 (domaine public). Chaque texte est à relire sur une Bible avant publication.
// tags des versets : jour, repos, fin, dur, repas
export const VERSES = [
  { id: "v-1tm4-8", ref: "1 Timothée 4:8", t: "Exerce-toi à la piété; car l'exercice corporel est utile à peu de chose, tandis que la piété est utile à tout, ayant la promesse de la vie présente et de celle qui est à venir.", tags: ["jour", "fin"] },
  { id: "v-ph4-13", ref: "Philippiens 4:13", t: "Je puis tout par celui qui me fortifie.", tags: ["jour", "repos", "fin"] },
  { id: "v-ne8-10", ref: "Néhémie 8:10", t: "La joie de l'Éternel sera votre force.", tags: ["jour", "repos"] },
  { id: "v-ps18-33", ref: "Psaume 18:33", t: "C'est Dieu qui me ceint de force, Et qui me conduit dans la voie droite.", tags: ["jour", "repos", "fin"] },
  { id: "v-es40-31", ref: "Ésaïe 40:31", t: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles; Ils courent, et ne se lassent point, Ils marchent, et ne se fatiguent point.", tags: ["jour", "fin"] },
  { id: "v-ga6-9", ref: "Galates 6:9", t: "Ne nous lassons pas de faire le bien; car nous moissonnerons au temps convenable, si nous ne nous relâchons pas.", tags: ["jour", "fin", "dur"] },
  { id: "v-he12-11", ref: "Hébreux 12:11", t: "Il est vrai que tout châtiment semble d'abord un sujet de tristesse, et non de joie; mais il produit plus tard pour ceux qui ont été ainsi exercés un fruit paisible de justice.", tags: ["jour", "fin"] },
  { id: "v-1co6-19", ref: "1 Corinthiens 6:19-20", t: "Ne savez-vous pas que votre corps est le temple du Saint-Esprit qui est en vous, que vous avez reçu de Dieu, et que vous ne vous appartenez point à vous-mêmes? Car vous avez été rachetés à un grand prix. Glorifiez donc Dieu dans votre corps et dans votre esprit, qui appartiennent à Dieu.", tags: ["jour", "dur"] },
  { id: "v-1co10-31", ref: "1 Corinthiens 10:31", t: "Soit donc que vous mangiez, soit que vous buviez, soit que vous fassiez quelque autre chose, faites tout pour la gloire de Dieu.", tags: ["jour", "repas"] },
  { id: "v-col3-23", ref: "Colossiens 3:23", t: "Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes,", tags: ["jour", "repos", "fin"] },
  { id: "v-ps139-14", ref: "Psaume 139:14", t: "Je te loue de ce que je suis une créature si merveilleuse. Tes œuvres sont admirables, Et mon âme le reconnaît bien.", tags: ["jour", "dur"] },
  { id: "v-2co12-9", ref: "2 Corinthiens 12:9", t: "Ma grâce te suffit, car ma puissance s'accomplit dans la faiblesse.", tags: ["repos", "dur"] },
  { id: "v-jos1-9", ref: "Josué 1:9", t: "Ne t'ai-je pas donné cet ordre: Fortifie-toi et prends courage? Ne t'effraie point et ne t'épouvante point, car l'Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.", tags: ["jour", "fin"] },
  { id: "v-2tm1-7", ref: "2 Timothée 1:7", t: "Car ce n'est pas un esprit de timidité que Dieu nous a donné, mais un esprit de force, d'amour et de sagesse.", tags: ["jour", "repos"] },
  { id: "v-lm3-22", ref: "Lamentations 3:22-23", t: "Les bontés de l'Éternel ne sont pas épuisées, Ses compassions ne sont pas à leur terme; Elles se renouvellent chaque matin. Oh! Que ta fidélité est grande!", tags: ["jour", "dur"] },
  { id: "v-pr24-16", ref: "Proverbes 24:16", t: "Car sept fois le juste tombe, et il se relève.", tags: ["repos", "dur"] },
  { id: "v-mt11-28", ref: "Matthieu 11:28", t: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.", tags: ["dur"] },
  { id: "v-es41-10", ref: "Ésaïe 41:10", t: "Ne crains rien, car je suis avec toi; Ne promène pas des regards inquiets, car je suis ton Dieu; Je te fortifie, je viens à ton secours.", tags: ["jour", "dur"] },
  { id: "v-1co9-24", ref: "1 Corinthiens 9:24", t: "Ne savez-vous pas que ceux qui courent dans le stade courent tous, mais qu'un seul remporte le prix? Courez de manière à le remporter.", tags: ["fin", "repos"] },
  { id: "v-mt4-4", ref: "Matthieu 4:4", t: "L'homme ne vivra pas de pain seulement, mais de toute parole qui sort de la bouche de Dieu.", tags: ["repas"] },
  { id: "v-jn3-16", ref: "Jean 3:16", t: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.", tags: ["jour"] },
  { id: "v-ph1-6", ref: "Philippiens 1:6", t: "Je suis persuadé que celui qui a commencé en vous cette bonne œuvre la rendra parfaite pour le jour de Jésus-Christ.", tags: ["jour", "dur"] },
  { id: "v-ps46-2", ref: "Psaume 46:2", t: "Dieu est pour nous un refuge et un appui, Un secours qui ne manque jamais dans la détresse.", tags: ["dur"] },
];

// Vérités : ce que la Parole dit, à la première personne. La force et la valeur viennent de Dieu, pas de soi.
export const CATS = [
  { id: "valeur", n: "Mon identité" }, { id: "force", n: "Sa force" }, { id: "perseverance", n: "Persévérance" },
  { id: "corps", n: "Mon corps" }, { id: "paix", n: "Paix" }, { id: "recommencer", n: "Recommencer" }, { id: "discipline", n: "Discipline" },
];
export const AFFIRMATIONS = [
  { id: "a1", cat: "valeur", t: "Ma valeur ne vient pas de la balance : j'ai été créé par Dieu, avec soin.", ref: "Psaume 139:14" },
  { id: "a2", cat: "valeur", t: "Dieu a tant aimé le monde qu'il a donné son Fils : c'est là que se mesure ma valeur.", ref: "Jean 3:16" },
  { id: "a3", cat: "valeur", t: "Je suis sauvé par grâce, par la foi, et non par mes œuvres : je n'ai rien à prouver.", ref: "Éphésiens 2:8-9" },
  { id: "a4", cat: "valeur", t: "Dieu m'a formé dans le sein de ma mère. Je ne suis pas une erreur.", ref: "Psaume 139:13-14" },
  { id: "a5", cat: "valeur", t: "Je suis créé à l'image de Dieu : mon identité est en lui, pas dans mon apparence.", ref: "Genèse 1:27" },
  { id: "a6", cat: "valeur", t: "Je cours la course qui m'est proposée, les regards fixés sur Jésus, et non sur les autres.", ref: "Hébreux 12:1-2" },
  { id: "a7", cat: "force", t: "Je puis tout par Christ qui me fortifie, dans le manque comme dans l'abondance.", ref: "Philippiens 4:13" },
  { id: "a8", cat: "force", t: "Dieu est avec moi : c'est lui qui me fortifie et qui me soutient.", ref: "Ésaïe 41:10" },
  { id: "a9", cat: "force", t: "Dieu ne m'a pas donné un esprit de timidité, mais de force, d'amour et de sagesse.", ref: "2 Timothée 1:7" },
  { id: "a10", cat: "force", t: "La joie de l'Éternel est ma force.", ref: "Néhémie 8:10" },
  { id: "a11", cat: "force", t: "La grâce de Christ me suffit : sa puissance s'accomplit dans ma faiblesse.", ref: "2 Corinthiens 12:9-10" },
  { id: "a12", cat: "perseverance", t: "Je ne me lasse pas de faire le bien : je moissonnerai au temps convenable.", ref: "Galates 6:9" },
  { id: "a13", cat: "perseverance", t: "La discipline semble pénible sur le moment, mais elle produit un fruit paisible de justice.", ref: "Hébreux 12:11" },
  { id: "a14", cat: "perseverance", t: "Je cours pour une couronne incorruptible, pas pour une gloire qui passe.", ref: "1 Corinthiens 9:24-25" },
  { id: "a15", cat: "perseverance", t: "Ceux qui se confient en l'Éternel renouvellent leur force.", ref: "Ésaïe 40:31" },
  { id: "a16", cat: "perseverance", t: "Celui qui a commencé en moi cette bonne œuvre la rendra parfaite.", ref: "Philippiens 1:6" },
  { id: "a17", cat: "corps", t: "Mon corps est le temple du Saint-Esprit : je ne m'appartiens pas.", ref: "1 Corinthiens 6:19-20" },
  { id: "a18", cat: "corps", t: "Je m'entraîne de bon cœur, comme pour le Seigneur, et non pour le regard des hommes.", ref: "Colossiens 3:23" },
  { id: "a19", cat: "corps", t: "L'homme ne vivra pas de pain seulement, mais de toute parole qui sort de la bouche de Dieu.", ref: "Matthieu 4:4" },
  { id: "a20", cat: "corps", t: "Que je mange ou que je m'entraîne, je veux tout faire pour la gloire de Dieu.", ref: "1 Corinthiens 10:31" },
  { id: "a21", cat: "corps", t: "Je nourris et je soigne mon corps, sans le négliger ni l'idolâtrer.", ref: "Éphésiens 5:29" },
  { id: "a22", cat: "paix", t: "Je viens à Jésus avec ce qui me pèse : c'est lui qui donne du repos à mon âme.", ref: "Matthieu 11:28" },
  { id: "a23", cat: "paix", t: "Dieu est mon refuge et mon appui, un secours qui ne manque jamais dans la détresse.", ref: "Psaume 46:2" },
  { id: "a24", cat: "paix", t: "Le repos est un don de Dieu : me reposer n'est pas abandonner.", ref: "Marc 6:31" },
  { id: "a25", cat: "paix", t: "Je ne m'inquiète pas du lendemain : mon Père céleste sait de quoi j'ai besoin.", ref: "Matthieu 6:32-34" },
  { id: "a26", cat: "recommencer", t: "Les bontés de l'Éternel se renouvellent chaque matin.", ref: "Lamentations 3:22-23" },
  { id: "a27", cat: "recommencer", t: "Le juste tombe sept fois, et il se relève.", ref: "Proverbes 24:16" },
  { id: "a28", cat: "recommencer", t: "S'il tombe, il n'est pas terrassé, car l'Éternel lui prend la main.", ref: "Psaume 37:24" },
  { id: "a29", cat: "recommencer", t: "J'oublie ce qui est en arrière et je cours vers le but, en Jésus-Christ.", ref: "Philippiens 3:13-14" },
  { id: "a30", cat: "recommencer", t: "Si je suis en Christ, je suis une nouvelle créature : les choses anciennes sont passées.", ref: "2 Corinthiens 5:17" },
  { id: "a31", cat: "discipline", t: "Je fais ce qui est juste devant Dieu, même quand personne ne regarde.", ref: "Colossiens 3:23" },
  { id: "a32", cat: "discipline", t: "J'accepte d'être repris : celui qui aime la correction aime la connaissance.", ref: "Proverbes 12:1" },
  { id: "a33", cat: "discipline", t: "Je veux être fidèle dans les petites choses.", ref: "Luc 16:10" },
  { id: "a34", cat: "discipline", t: "Je traite durement mon corps et je le tiens assujetti, pour ne pas être disqualifié.", ref: "1 Corinthiens 9:27" },
  { id: "a35", cat: "discipline", t: "Dieu ne me demande pas la perfection, mais la fidélité.", ref: "Matthieu 25:21" },
];

// « Et après ? » : pages discrètes sur l'Évangile
export const ETERNAL = [
  { id: "jesus", n: "Qui est Jésus ?", lead: "Plus qu'un sage ou un exemple.",
    body: ["Jésus de Nazareth a vécu en Galilée il y a environ deux mille ans. Il a guéri, enseigné, accueilli ceux que tout le monde rejetait.", "Il a dit qu'il était le Fils de Dieu, venu non pour être servi, mais pour servir et donner sa vie. Il est mort sur une croix, puis il est ressuscité.", "Le X au cœur de CalXsthenos, c'est la lettre grecque Chi, la première de son nom : Christ."],
    verses: [{ ref: "Jean 14:6", t: "Jésus lui dit: Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi." }, { ref: "Marc 10:45", t: "Car le Fils de l'homme est venu, non pour être servi, mais pour servir et donner sa vie comme la rançon de plusieurs." }] },
  { id: "naissance", n: "Naître de nouveau", lead: "Un nouveau départ que l'on ne se donne pas soi-même.",
    body: ["Un homme respecté, Nicodème, est venu voir Jésus de nuit. Jésus lui a répondu qu'il fallait naître de nouveau, naître d'en haut.", "On peut transformer son corps par l'effort. La nouvelle naissance, elle, ne se gagne pas : elle se reçoit, par la foi.", "C'est le changement le plus profond qu'un être humain puisse vivre."],
    verses: [{ ref: "Jean 3:3", t: "Jésus lui répondit: En vérité, en vérité, je te le dis, si un homme ne naît de nouveau, il ne peut voir le royaume de Dieu." }, { ref: "2 Corinthiens 5:17", t: "Si quelqu'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles." }] },
  { id: "eternite", n: "La vie éternelle", lead: "Le corps est utile pour un temps. Il y a plus.",
    body: ["Un jour, nos records n'auront plus d'importance. Notre corps vieillira. C'est pour cela que l'entraînement le plus important ne se fait pas en salle.", "La Bible promet une vie qui ne s'arrête pas, offerte gratuitement à quiconque met sa confiance en Jésus.", "Si tu veux en parler, sans pression, écris-moi. Je serai heureux d'échanger avec toi."],
    verses: [{ ref: "Jean 3:16", t: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle." }, { ref: "Romains 6:23", t: "Car le salaire du péché, c'est la mort; mais le don gratuit de Dieu, c'est la vie éternelle en Jésus-Christ notre Seigneur." }] },
];

const dayIndex = (d = new Date()) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5) + d.getFullYear() * 7;
export function verseFor(tag, seed = dayIndex()) {
  const pool = VERSES.filter(v => v.tags.includes(tag));
  return pool[((seed % pool.length) + pool.length) % pool.length];
}
export const verseOfDay = () => verseFor("jour");
export const affirmationOfDay = () => AFFIRMATIONS[dayIndex() % AFFIRMATIONS.length];
export const byId = (id) => VERSES.find(v => v.id === id) || AFFIRMATIONS.find(a => a.id === id) || null;
export const bibleUrl = (ref) => `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=LSG`;
export function wordCard(v, cls = "") {
  if (!v) return "";
  return `<figure class="word ${cls}"><q>${v.t}</q><cite>${v.ref}</cite></figure>`;
}
