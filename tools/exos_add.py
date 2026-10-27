# Enrichit data/fiches.json : muscles et matériel pour chaque exercice, nouvelles familles, nouveaux exercices.
# Lancer depuis la racine : python3 tools/exos_add.py
import json, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = json.load(open(f"{ROOT}/data/fiches.json", encoding="utf8"))
LIB = json.load(open(f"{ROOT}/data/lib.json", encoding="utf8"))

Q, F_, I_, A_, AD, MO = "Quadriceps", "Fessiers", "Ischios", "Abdos", "Adducteurs", "Mollets"
PE, DL, DE, EA, EL, EP, TR, BI, TRI, AB, LO = "Pecs", "Dos-largeur", "Dos-épaisseur", "Épaules-avant", "Épaules-latéral", "Épaules-arrière", "Trapèzes", "Biceps", "Triceps", "Avant-bras", "Lombaires"
COU, MOB, CAR = "Cou", "Mobilité", "Cardio"

FAM_MUS = {
  "squat": [Q, F_, AD], "squat_bw": [Q, F_], "presse": [Q, F_], "unilateral": [Q, F_, I_], "knee_ext": [Q],
  "hinge": [I_, F_, LO], "swing": [F_, I_, LO], "bridge": [F_, I_], "knee_flex": [I_], "back_ext": [LO, F_, I_],
  "hip_abd": [F_], "calf": [MO], "bench": [PE, TRI, EA], "incline": [PE, EA, TRI], "dips": [TRI, PE, EA],
  "ohp": [EA, TRI, EL], "fly": [PE], "pullover": [DL, PE], "vpull": [DL, BI, DE], "muscleup": [DL, TRI, PE],
  "row": [DE, DL, BI], "shrug": [TR], "lateral": [EL], "front_raise": [EA], "rear": [EP, TR], "cuff": [EP],
  "curl": [BI, AB], "triceps": [TRI], "forearm": [AB], "carry": [AB, TR, A_], "abs_flex": [A_], "anti": [A_, LO],
  "rotation": [A_], "skill": [DL, A_, EA], "mob": [MOB], "cond": [CAR],
}

def eq_of(name):
  n = name.lower()
  for k, v in [("élastique", "Élastique"), ("kettlebell", "Kettlebell"), ("smith", "Smith"), ("anneaux", "Anneaux"), ("trap bar", "Trap bar"),
               ("landmine", "Landmine"), ("poulie", "Poulie"), ("machine", "Machine"), ("presse", "Machine"), ("haltère", "Haltères"), ("barre", "Barre")]:
    if k in n: return v
  return "Poids de corps"

# ---------- Nouvelles familles ----------
F["fam"]["skill"] = {
  "nom": "Figures de street workout (front lever, planche, équilibre)", "plan": "Selon la figure", "type": "Isométrie et force relative au poids du corps",
  "artic": "Épaules (extension ou flexion bras tendus), omoplates, coudes verrouillés, hanches gainées",
  "muscles": "Front lever : grand dorsal, grand rond, abdominaux. Planche : deltoïde antérieur, pectoraux, dentelé antérieur, abdominaux. Équilibre : deltoïdes, triceps, trapèzes, avant-bras.",
  "setup": "Échauffe les épaules et les poignets. Choisis la version que tu tiens 8 à 15 secondes propres.",
  "exec": ["Verrouille les bras tendus et le gainage avant de quitter le sol.", "Tiens la position sans perdre l'alignement du bassin.", "Arrête la série dès que la forme se dégrade."],
  "resp": "Respiration courte et contrôlée, sans bloquer longtemps.",
  "erreurs": ["Bras qui plient.", "Bassin qui tombe ou se cambre.", "Passer à la version suivante trop tôt."],
  "conseils": ["Mieux vaut 5 × 8 s propres que 2 × 20 s approximatives.", "Travaille la figure en début de séance, frais."],
  "progresser": ["Groupé (tuck), groupé avancé, une jambe, straddle, complet.", "Ajoute 2 à 3 secondes par séance, puis passe à la version suivante."],
  "prog": "3 à 6 séries de 5 à 15 secondes, 2 à 3 fois par semaine, en début de séance.",
  "access": ["Tirage bras tendu poulie", "Hollow body hold", "Pompes pseudo-planche", "Scapular pull-up"]}
F["fam"]["mob"] = {
  "nom": "Mobilité et activation", "plan": "Tous plans", "type": "Mobilité active, étirement, activation",
  "artic": "Hanches, colonne thoracique, épaules, chevilles selon l'exercice",
  "muscles": "Travail des amplitudes articulaires et des muscles profonds qui les contrôlent.",
  "setup": "Sans charge ou avec une charge très légère. Dans une amplitude confortable, sans douleur.",
  "exec": ["Mouvement lent et contrôlé.", "Va un peu plus loin à chaque répétition, jamais dans la douleur.", "Respire longuement en fin d'amplitude."],
  "resp": "Expiration longue en fin d'amplitude pour relâcher.",
  "erreurs": ["Forcer dans la douleur.", "Aller trop vite.", "Compenser avec le bas du dos."],
  "conseils": ["5 à 10 minutes en échauffement suffisent.", "Les jours sans séance, une courte routine entretient les amplitudes."],
  "progresser": ["Augmente l'amplitude et la durée de maintien.", "Ajoute une charge légère en fin d'amplitude (mobilité chargée)."],
  "prog": "1 à 3 séries de 6 à 10 répétitions ou 30 à 60 secondes par côté.",
  "access": []}
F["fam"]["cond"] = {
  "nom": "Conditionnement et cardio", "plan": "Tous plans", "type": "Effort cardiovasculaire, par intervalles ou continu",
  "artic": "Corps entier",
  "muscles": "Cœur et poumons d'abord ; les muscles des jambes, du tronc et des bras selon l'engin.",
  "setup": "Règle l'engin (selle, sangles, résistance). Échauffe-toi 3 à 5 minutes progressivement.",
  "exec": ["Zone 2 : tu peux parler en phrases courtes.", "Intervalles : effort court et intense, récupération active.", "Garde une technique propre même fatigué."],
  "resp": "Respiration régulière ; en intervalles, récupère par le nez entre les efforts.",
  "erreurs": ["Faire toutes les séances à fond.", "Négliger l'échauffement.", "Technique qui s'effondre en fin de série."],
  "conseils": ["80 % du cardio en zone 2, 20 % en intervalles.", "Après la musculation, ou un autre jour, pour ne pas gêner la force."],
  "progresser": ["Augmente la durée, puis l'intensité.", "Intervalles : réduis la récupération ou ajoute une répétition."],
  "prog": "Zone 2 : 20 à 45 min. Intervalles : 6 à 10 × 20 à 60 s.",
  "access": []}

# ---------- Nouveaux exercices : (nom, famille, muscles, matériel, installation, points clés, unité) ----------
N = [
 # Squat
 ("Box squat barre", "squat", [Q, F_, AD], "Barre", "Box réglée à hauteur de la parallèle derrière toi, barre sur les trapèzes.", ["Assieds-toi en arrière sur la box sans te relâcher.", "Pause d'une seconde, tronc gainé.", "Pousse fort pour remonter."]),
 ("Squat Zercher", "squat", [Q, F_, A_], "Barre", "Barre dans le creux des coudes, mains jointes devant la poitrine.", ["Coudes hauts, buste droit.", "Descends entre les genoux.", "Garde la barre collée au corps."]),
 ("Squat haltères", "squat", [Q, F_, AD], "Haltères", "Un haltère dans chaque main le long du corps, pieds largeur d'épaules.", ["Buste droit, épaules basses.", "Descends en gardant les talons au sol.", "Remonte en poussant le sol."]),
 ("Squat double kettlebell (front rack)", "squat", [Q, F_, A_], "Kettlebell", "Deux kettlebells en appui sur les avant-bras, à hauteur des épaules.", ["Coudes serrés, poignets droits.", "Descends profond, buste vertical.", "Gaine fort pour ne pas basculer."]),
 ("Squat landmine", "squat", [Q, F_], "Landmine", "Bout de la barre landmine tenu contre la poitrine à deux mains.", ["Penche-toi légèrement vers la barre.", "Descends profond, genoux dans l'axe des pieds.", "Idéal pour apprendre le squat."]),
 ("Squat talons surélevés haltères", "squat", [Q, F_], "Haltères", "Talons sur une cale de 2 à 5 cm, haltères le long du corps ou en goblet.", ["Genoux qui avancent loin au-dessus des orteils.", "Buste très droit.", "Accent maximal sur les quadriceps."]),
 ("Squat départ des sécurités (Anderson)", "squat", [Q, F_, AD], "Barre", "Sécurités du rack réglées au point bas du squat, barre posée dessus.", ["Place-toi sous la barre en position basse.", "Gaine avant de pousser.", "Repose la barre à chaque répétition, sans rebond."]),
 ("Front squat avec pause", "squat", [Q, F_, A_], "Barre", "Barre en front squat, sur les deltoïdes.", ["Pause de 2 secondes en bas.", "Coudes hauts pendant la pause.", "Remonte sans perdre le buste."]),
 ("Thruster haltères", "squat", [Q, F_, EA], "Haltères", "Haltères à hauteur des épaules.", ["Squat complet.", "Remonte avec élan et pousse les haltères au-dessus de la tête.", "Un seul mouvement fluide."]),
 ("Squat sumo poids de corps", "squat_bw", [Q, F_, AD], "Poids de corps", "Pieds très écartés, pointes vers l'extérieur.", ["Genoux dans l'axe des pieds.", "Descends en gardant le buste droit.", "Serre les fessiers en haut."]),
 ("Squat isométrique tenu en bas", "squat_bw", [Q, F_], "Poids de corps", "Position basse du squat, talons au sol.", ["Tiens la position basse.", "Buste droit, genoux ouverts.", "Respire calmement."], "s"),
 # Presse
 ("Leg press unilatérale", "presse", [Q, F_], "Machine", "Un pied au centre de la plateforme, l'autre posé au sol ou sur le cadre.", ["Descends jusqu'à ce que le bassin reste collé.", "Genou dans l'axe du pied.", "Corrige les écarts entre les deux jambes."]),
 ("Leg press pieds hauts (focus fessiers)", "presse", [F_, I_, Q], "Machine", "Pieds en haut de la plateforme, largeur d'épaules.", ["Descends profond sans décoller le bassin.", "Pousse par les talons.", "Plus de hanche, moins de genou."]),
 ("Hack squat inversé", "presse", [F_, I_, Q], "Machine", "Face à la machine, poitrine contre le dossier.", ["Hanches en arrière à la descente.", "Pousse par les talons.", "Garde le dos plaqué."]),
 ("V-squat machine", "presse", [Q, F_], "Machine", "Épaules sous les appuis, pieds au milieu de la plateforme.", ["Descends profond, dos plaqué.", "Genoux dans l'axe des pieds.", "Remonte sans verrouiller sèchement."]),
 ("Presse horizontale assise", "presse", [Q, F_], "Machine", "Assis, pieds à plat sur la plateforme verticale.", ["Fléchis jusqu'à 90° de genou ou plus.", "Bassin collé au siège.", "Pousse sans verrouiller."]),
 ("Squat Smith pieds avancés", "presse", [Q, F_], "Smith", "Barre du Smith sur les trapèzes, pieds 20 à 30 cm devant toi.", ["Dos qui glisse le long de la barre.", "Descends profond.", "Accent quadriceps sans charger le dos."]),
 # Unilatéral
 ("Fentes avant haltères", "unilateral", [Q, F_, I_], "Haltères", "Debout, un haltère dans chaque main.", ["Grand pas en avant.", "Genou arrière vers le sol.", "Pousse sur le pied avant pour revenir."]),
 ("Fentes latérales haltère", "unilateral", [AD, Q, F_], "Haltères", "Haltère tenu en goblet, pieds joints.", ["Grand pas sur le côté.", "Hanche en arrière, jambe opposée tendue.", "Reviens en poussant sur le pied fléchi."]),
 ("Squat cosaque", "unilateral", [AD, Q, F_], "Poids de corps", "Pieds très écartés.", ["Descends sur une jambe, l'autre tendue pointe vers le haut.", "Talon d'appui au sol.", "Passe d'un côté à l'autre."]),
 ("Fentes marchées barre", "unilateral", [Q, F_, I_], "Barre", "Barre sur les trapèzes.", ["Pas réguliers, buste droit.", "Genou arrière proche du sol.", "Gaine pour ne pas te déséquilibrer."]),
 ("Fentes bulgares barre", "unilateral", [Q, F_], "Barre", "Barre sur les trapèzes, pied arrière sur un banc.", ["Descends à la verticale.", "Genou avant dans l'axe.", "Commence léger : l'équilibre est exigeant."]),
 ("Fentes bulgares Smith", "unilateral", [Q, F_], "Smith", "Barre du Smith sur les trapèzes, pied arrière sur un banc.", ["Le rail sécurise l'équilibre.", "Descends profond.", "Pousse par le talon avant."]),
 ("Step-up barre", "unilateral", [Q, F_], "Barre", "Box à hauteur du genou, barre sur les trapèzes.", ["Pose tout le pied sur la box.", "Monte sans pousser avec la jambe du bas.", "Redescends en contrôlant."]),
 ("Pistol squat", "unilateral", [Q, F_, A_], "Poids de corps", "Debout sur une jambe, l'autre tendue devant toi.", ["Descends le plus bas possible en contrôle.", "Bras devant pour l'équilibre.", "Talon au sol."]),
 ("Shrimp squat (squat crevette)", "unilateral", [Q, F_], "Poids de corps", "Sur une jambe, tiens la cheville de l'autre derrière toi.", ["Descends jusqu'à toucher le sol avec le genou arrière.", "Buste légèrement penché.", "Remonte sans élan."]),
 ("Fentes arrière déficit haltères", "unilateral", [F_, Q, I_], "Haltères", "Pied avant sur un step de 5 à 10 cm.", ["Recule le pied arrière.", "Descends plus bas qu'une fente classique.", "Pousse par le talon avant."]),
 ("Fentes croisées (curtsy lunge)", "unilateral", [F_, AD, Q], "Haltères", "Debout, haltères le long du corps.", ["Recule une jambe en diagonale derrière l'autre.", "Bassin de face.", "Accent sur le moyen fessier."]),
 ("Box pistol (squat une jambe sur banc)", "unilateral", [Q, F_], "Poids de corps", "Debout sur une jambe devant un banc.", ["Assieds-toi lentement sur le banc.", "Relève-toi sur une jambe.", "Baisse la hauteur du banc pour progresser."]),
 # Extension du genou
 ("Spanish squat élastique", "knee_ext", [Q], "Élastique", "Gros élastique derrière les genoux, accroché à un rack devant toi.", ["Recule pour mettre l'élastique en tension.", "Tibias verticaux, assieds-toi en arrière.", "Excellent pour les tendons rotuliens."]),
 ("Reverse Nordic", "knee_ext", [Q], "Poids de corps", "À genoux, buste droit, pieds bloqués ou libres.", ["Bascule le buste en arrière d'un bloc, hanches tendues.", "Va aussi loin que tu contrôles.", "Remonte avec les quadriceps."]),
 # Charnière
 ("Soulevé de terre trap bar", "hinge", [Q, F_, I_], "Trap bar", "Debout au centre de la trap bar, poignées hautes ou basses.", ["Hanches plus basses qu'au soulevé classique.", "Pousse le sol, dos neutre.", "Plus doux pour le bas du dos."]),
 ("Soulevé de terre haltères", "hinge", [I_, F_, LO], "Haltères", "Haltères devant les tibias ou sur les côtés.", ["Hanches en arrière, dos neutre.", "Tire en poussant le sol.", "Verrouille les hanches en haut."]),
 ("Soulevé de terre sumo kettlebell", "hinge", [F_, AD, I_], "Kettlebell", "Pieds très écartés, kettlebell entre les pieds.", ["Hanches en arrière, buste incliné.", "Bras tendus.", "Serre les fessiers en haut."]),
 ("Soulevé de terre jambes tendues haltères", "hinge", [I_, LO], "Haltères", "Debout, haltères devant les cuisses.", ["Genoux presque tendus.", "Descends jusqu'à l'étirement maximal des ischios.", "Dos neutre."]),
 ("Soulevé de terre roumain Smith", "hinge", [I_, F_], "Smith", "Barre du Smith à hauteur des cuisses.", ["Hanches loin en arrière.", "Barre qui glisse le long des cuisses.", "Étirement des ischios, puis remonte."]),
 ("Soulevé de terre sur blocs (block pull)", "hinge", [LO, F_, I_], "Barre", "Disques posés sur des blocs de 5 à 15 cm.", ["Même placement qu'au soulevé de terre.", "Travaille le verrouillage avec plus de charge.", "Dos neutre au départ."]),
 ("Soulevé de terre prise arrachée", "hinge", [DE, I_, F_], "Barre", "Prise très large, mains vers les extrémités de la barre.", ["Hanches plus basses.", "Haut du dos très engagé.", "Charge plus légère qu'au classique."]),
 ("Good morning assis", "back_ext", [LO, I_], "Barre", "Assis sur un banc, barre sur les trapèzes.", ["Penche le buste en avant, dos neutre.", "Amplitude contrôlée.", "Renforce les érecteurs du rachis."]),
 # Hanche dynamique
 ("Kettlebell swing unilatéral", "swing", [F_, I_, A_], "Kettlebell", "Kettlebell tenue à une main entre les jambes.", ["Charnière de hanche, pas un squat.", "Projette avec les hanches.", "Résiste à la rotation du tronc."]),
 ("Kettlebell clean", "swing", [F_, I_, TR], "Kettlebell", "Kettlebell au sol entre les pieds.", ["Élan de hanche, coude près du corps.", "La kettlebell se pose en douceur sur l'avant-bras.", "Poignet droit."]),
 ("Kettlebell snatch", "swing", [F_, I_, EA], "Kettlebell", "Kettlebell entre les pieds.", ["Swing puissant, la kettlebell monte au-dessus de la tête en un seul mouvement.", "Bras verrouillé en haut.", "Redescends en contrôlant."]),
 ("Épaulé en force (power clean)", "swing", [F_, Q, TR], "Barre", "Barre au sol, prise juste à l'extérieur des jambes.", ["Première tirée comme un soulevé de terre.", "Extension explosive des hanches.", "Réception en quart de squat, coudes hauts."]),
 ("Sauts sur box (box jump)", "swing", [Q, F_, MO], "Poids de corps", "Face à une box stable.", ["Élan des bras et des hanches.", "Réception souple, genoux dans l'axe.", "Redescends en marchant."]),
 ("Saut en longueur sans élan", "swing", [F_, Q, I_], "Poids de corps", "Pieds largeur de hanches.", ["Élan des bras, charnière de hanche.", "Saute loin devant.", "Réception amortie."]),
 # Pont / hip thrust
 ("Hip thrust Smith", "bridge", [F_, I_], "Smith", "Haut du dos sur un banc, barre du Smith sur le bassin.", ["Menton rentré.", "Pousse par les talons jusqu'à l'alignement.", "Serre les fessiers 1 seconde en haut."]),
 ("Hip thrust haltère", "bridge", [F_, I_], "Haltères", "Haut du dos sur un banc, haltère posé sur le bassin.", ["Tibias verticaux en haut.", "Bassin en rétroversion.", "Descends en contrôlant."]),
 ("Hip thrust élastique", "bridge", [F_], "Élastique", "Élastique tendu sur le bassin et bloqué sous les mains ou un banc.", ["Pousse jusqu'à l'alignement.", "Pause en haut.", "Idéal à la maison."]),
 ("Frog pump", "bridge", [F_], "Poids de corps", "Allongé, plantes des pieds jointes, genoux ouverts.", ["Pousse le bassin vers le haut.", "Serre fort les fessiers.", "Séries longues."]),
 # Flexion du genou
 ("Leg curl allongé unilatéral", "knee_flex", [I_], "Machine", "Allongé, une jambe sous le boudin.", ["Hanche plaquée sur le banc.", "Fléchis complètement.", "Redescends lentement."]),
 ("Leg curl haltère allongé", "knee_flex", [I_], "Haltères", "Allongé sur un banc, haltère tenu entre les pieds.", ["Serre bien l'haltère.", "Fléchis jusqu'à 90°.", "Contrôle la descente."]),
 ("Leg curl ballon suisse", "knee_flex", [I_, F_], "Autre", "Allongé sur le dos, talons sur un ballon.", ["Monte le bassin.", "Ramène le ballon vers les fesses.", "Garde le bassin haut."]),
 ("Leg curl élastique", "knee_flex", [I_], "Élastique", "Allongé sur le ventre, élastique autour des chevilles accroché devant.", ["Fléchis les genoux.", "Contrôle le retour.", "Bon en séries longues."]),
 # Extension du tronc
 ("Hyperextension 45° poids de corps", "back_ext", [LO, F_, I_], "Poids de corps", "Banc à 45°, bord du coussin au niveau des hanches.", ["Descends en contrôlant.", "Remonte jusqu'à l'alignement, pas au-delà.", "Bras croisés sur la poitrine."]),
 ("Extension lombaire machine", "back_ext", [LO], "Machine", "Assis, haut du dos contre le dossier mobile.", ["Amplitude contrôlée.", "Ne cambre pas à l'excès en fin de mouvement.", "Charges modérées."]),
 ("Hyperextension dos rond (focus fessiers)", "back_ext", [F_, I_], "Poids de corps", "Banc à 45°, pieds tournés vers l'extérieur.", ["Dos légèrement arrondi, menton rentré.", "Remonte en serrant les fessiers.", "Le dos ne travaille presque pas."]),
 # Abduction / adduction
 ("Abduction assis élastique", "hip_abd", [F_], "Élastique", "Assis, élastique au-dessus des genoux.", ["Écarte les genoux.", "Contrôle le retour.", "Penche-toi un peu en avant pour plus de fessier."]),
 ("Abduction couché sur le côté", "hip_abd", [F_], "Poids de corps", "Allongé sur le côté, jambes tendues.", ["Monte la jambe du dessus, pointe vers l'avant.", "Bassin immobile.", "Descends lentement."]),
 ("Clamshell élastique", "hip_abd", [F_], "Élastique", "Couché sur le côté, genoux fléchis, élastique au-dessus des genoux.", ["Ouvre le genou du dessus.", "Pieds collés.", "Bassin qui ne roule pas en arrière."]),
 ("Fire hydrant", "hip_abd", [F_], "Poids de corps", "À quatre pattes.", ["Monte le genou sur le côté.", "Dos immobile.", "Pause en haut."]),
 # Mollets
 ("Mollets assis haltères", "calf", [MO], "Haltères", "Assis, pointes de pieds sur un step, haltères sur les genoux.", ["Amplitude complète.", "Pause en bas étiré.", "Travaille le soléaire."]),
 ("Mollets à la hack squat", "calf", [MO], "Machine", "Épaules sous les appuis, pointes de pieds en bas de la plateforme.", ["Jambes tendues.", "Descends le talon au maximum.", "Monte sur la pointe."]),
 ("Mollets unilatéral à la presse", "calf", [MO], "Machine", "Pointe d'un pied en bas de la plateforme.", ["Corrige les écarts entre les deux jambes.", "Amplitude complète.", "Pas de rebond."]),
 ("Tibial raise (releveurs)", "calf", [MO], "Poids de corps", "Dos contre un mur, pieds 30 cm devant.", ["Relève les pointes de pieds.", "Pause en haut.", "Protège les genoux et les tibias."]),
 # Poussée horizontale
 ("Chest press machine", "bench", [PE, TRI, EA], "Machine", "Assis, poignées à hauteur du milieu de la poitrine.", ["Omoplates serrées contre le dossier.", "Pousse sans décoller les épaules.", "Retour lent."]),
 ("Développé couché Smith", "bench", [PE, TRI, EA], "Smith", "Banc sous la barre du Smith, barre au-dessus du bas des pecs.", ["Omoplates serrées.", "Descends jusqu'à la poitrine.", "Sécurise sans pareur."]),
 ("Développé couché prise large", "bench", [PE, EA], "Barre", "Mains plus larges que d'habitude (index sur les anneaux).", ["Amplitude plus courte, plus de pecs.", "Coudes à 60-70°.", "Charge un peu plus légère."]),
 ("Développé couché depuis les sécurités (pin press)", "bench", [PE, TRI], "Barre", "Sécurités réglées 3 à 8 cm au-dessus de la poitrine.", ["Départ arrêté, sans élan.", "Renforce la poussée à mi-course.", "Gaine avant de pousser."]),
 ("Développé couché barre avec élastiques", "bench", [PE, TRI, EA], "Barre", "Élastiques accrochés aux extrémités de la barre et au pied du banc.", ["La résistance augmente en haut.", "Pousse vite.", "Charge de barre plus légère."]),
 ("Développé couché haltère unilatéral", "bench", [PE, TRI, A_], "Haltères", "Un seul haltère, l'autre main sur le ventre.", ["Résiste à la rotation du tronc.", "Pieds bien ancrés.", "Amplitude complète."]),
 ("Développé couché barre multiprise (Swiss bar)", "bench", [PE, TRI], "Barre", "Barre à poignées neutres.", ["Prise neutre, plus douce pour les épaules.", "Coudes près du corps.", "Charge proche du couché serré."]),
 ("Pompes surélevées mains", "bench", [PE, TRI], "Poids de corps", "Mains sur un banc ou une marche.", ["Corps gainé.", "Poitrine vers le banc.", "Plus facile que les pompes au sol."]),
 ("Pompes sur les genoux", "bench", [PE, TRI], "Poids de corps", "Genoux au sol, corps aligné des genoux aux épaules.", ["Coudes à 45°.", "Poitrine au sol.", "Étape avant les pompes complètes."]),
 ("Pompes claquées", "bench", [PE, TRI], "Poids de corps", "Position de pompe.", ["Pousse explosif pour décoller les mains.", "Réception souple.", "Peu de répétitions, toujours rapides."]),
 ("Pompes aux anneaux", "bench", [PE, TRI, EA], "Anneaux", "Anneaux à 10-20 cm du sol.", ["Stabilise les anneaux.", "Tourne les mains vers l'extérieur en haut.", "Très exigeant pour les stabilisateurs."]),
 ("Pompes pseudo-planche", "bench", [EA, PE, A_], "Poids de corps", "Mains au niveau des hanches, doigts vers l'extérieur.", ["Penche les épaules loin devant les mains.", "Bras gainés, dos rond (protraction).", "Prépare la planche."]),
 ("Pompes prise serrée", "bench", [TRI, PE], "Poids de corps", "Mains sous les épaules.", ["Coudes collés au corps.", "Descends poitrine au sol.", "Focus triceps."]),
 ("Pompes déficit (sur poignées)", "bench", [PE, TRI], "Poids de corps", "Mains sur des poignées ou des disques.", ["Descends plus bas que les mains.", "Étirement des pecs.", "Contrôle la descente."]),
 # Poussée inclinée
 ("Développé incliné Smith", "incline", [PE, EA, TRI], "Smith", "Banc à 30° sous la barre du Smith.", ["Barre vers le haut des pecs.", "Omoplates serrées.", "Charge stable sans pareur."]),
 ("Développé incliné haltères prise neutre", "incline", [PE, EA, TRI], "Haltères", "Banc à 30°, paumes face à face.", ["Coudes près du corps.", "Plus doux pour les épaules.", "Amplitude complète."]),
 ("Développé incliné bas (15°) haltères", "incline", [PE, EA], "Haltères", "Banc à 15°.", ["Compromis entre couché et incliné.", "Étirement en bas.", "Coudes à 45-60°."]),
 ("Développé landmine", "incline", [EA, PE, TRI], "Landmine", "Debout ou à genoux, bout de la barre à hauteur de l'épaule.", ["Pousse vers le haut et l'avant.", "Gaine fort.", "Doux pour les épaules."]),
 ("Développé incliné machine", "incline", [PE, EA, TRI], "Machine", "Assis, poignées à hauteur du haut des pecs.", ["Omoplates serrées.", "Pousse sans décoller.", "Retour lent."]),
 # Dips
 ("Dips aux anneaux", "dips", [TRI, PE, EA], "Anneaux", "Appui bras tendus sur les anneaux, mains tournées vers l'extérieur.", ["Stabilise avant de descendre.", "Descends épaules sous les coudes.", "Bien plus instable qu'aux barres."]),
 ("Dips sur banc", "dips", [TRI], "Poids de corps", "Mains sur un banc derrière toi, pieds au sol devant.", ["Descends à 90° de coude.", "Épaules basses.", "Pieds surélevés pour plus de difficulté."]),
 ("Dips machine assise", "dips", [TRI, PE], "Machine", "Assis, poignées à hauteur des côtes.", ["Pousse vers le bas.", "Coudes près du corps.", "Charge progressive et sûre."]),
 # Poussée verticale
 ("Développé militaire debout haltères", "ohp", [EA, TRI, EL], "Haltères", "Debout, haltères à hauteur des épaules.", ["Gaine, fessiers serrés.", "Pousse au-dessus de la tête.", "Pas de cambrure."]),
 ("Développé épaules unilatéral haltère", "ohp", [EA, TRI, A_], "Haltères", "Debout, un haltère à hauteur d'épaule.", ["Résiste à l'inclinaison du tronc.", "Pousse à la verticale.", "Corrige les écarts entre côtés."]),
 ("Pompes en équilibre (handstand push-up)", "ohp", [EA, TRI, TR], "Poids de corps", "Équilibre contre un mur, mains à 15-20 cm du mur.", ["Descends la tête vers le sol en contrôle.", "Coudes vers l'avant.", "Repousse jusqu'aux bras tendus."]),
 ("Pompes pike pieds surélevés", "ohp", [EA, TRI], "Poids de corps", "Pieds sur un banc, hanches hautes.", ["Tête vers le sol entre les mains.", "Coudes vers l'arrière.", "Étape vers le handstand push-up."]),
 ("Développé landmine unilatéral", "ohp", [EA, PE, TRI], "Landmine", "À genoux ou debout, barre à l'épaule.", ["Pousse en diagonale.", "Tronc gainé.", "Bonne alternative au développé militaire."]),
 ("Développé Bradford", "ohp", [EA, EL, TRI], "Barre", "Debout ou assis, barre devant les épaules.", ["Passe la barre juste au-dessus de la tête, devant puis derrière.", "Charge légère, mouvement continu.", "Tension constante sur les épaules."]),
 # Écartés
 ("Écarté poulie unilatéral", "fly", [PE], "Poulie", "Debout de profil, poignée à hauteur d'épaule.", ["Bras légèrement fléchi.", "Ramène la main devant le sternum.", "Étirement contrôlé."]),
 ("Écarté élastique", "fly", [PE], "Élastique", "Élastique fixé derrière toi à hauteur d'épaules.", ["Bras légèrement fléchis.", "Serre les pecs devant toi.", "Retour lent."]),
 ("Svend press (pression de disque)", "fly", [PE, EA], "Autre", "Debout, deux disques serrés entre les paumes devant la poitrine.", ["Serre fort les disques.", "Tends les bras devant toi.", "Garde la pression au retour."]),
 ("Écarté haltères décliné", "fly", [PE], "Haltères", "Banc légèrement décliné.", ["Ouvre jusqu'à l'étirement.", "Coudes fixes.", "Accent bas des pecs."]),
 # Pull-over
 ("Pull-over barre EZ allongé", "pullover", [DL, PE, TRI], "Barre", "Allongé, barre EZ tenue bras légèrement fléchis au-dessus de la poitrine.", ["Descends derrière la tête jusqu'à l'étirement.", "Côtes basses.", "Remonte avec les dorsaux."]),
 ("Pull-over machine", "pullover", [DL], "Machine", "Assis, coudes contre les appuis.", ["Ramène les coudes vers les hanches.", "Amplitude complète.", "Isole le grand dorsal."]),
 ("Tirage bras tendu corde", "pullover", [DL], "Poulie", "Debout face à la poulie haute, corde en main.", ["Buste légèrement penché.", "Bras tendus jusqu'aux cuisses.", "Écarte la corde en bas."]),
 # Tirage vertical
 ("Tractions supination (chin-up)", "vpull", [DL, BI], "Poids de corps", "Prise en supination largeur d'épaules.", ["Épaules basses au départ.", "Poitrine vers la barre.", "Plus de biceps qu'en pronation."]),
 ("Tractions aux anneaux", "vpull", [DL, BI, AB], "Anneaux", "Suspendu aux anneaux.", ["Les mains tournent librement.", "Tire jusqu'à la poitrine.", "Doux pour les coudes."]),
 ("Tractions archer", "vpull", [DL, BI], "Poids de corps", "Prise très large.", ["Monte vers une main, l'autre bras se tend.", "Alterne les côtés.", "Étape vers la traction à un bras."]),
 ("Traction à un bras assistée", "vpull", [DL, BI, AB], "Poids de corps", "Une main sur la barre, l'autre sur le poignet ou une serviette.", ["Le bras assistant aide le moins possible.", "Corps gainé, pas de rotation.", "Peu de répétitions."]),
 ("Tractions L-sit", "vpull", [DL, A_, BI], "Poids de corps", "Suspendu, jambes tendues à l'horizontale.", ["Garde les jambes à 90°.", "Tire jusqu'au menton.", "Abdominaux très sollicités."]),
 ("Tractions typewriter", "vpull", [DL, BI], "Poids de corps", "Prise large.", ["Monte au centre.", "Glisse vers une main puis l'autre en haut.", "Redescends au centre."]),
 ("Tirage vertical prise serrée (triangle)", "vpull", [DL, BI], "Poulie", "Poignée triangle sur la poulie haute.", ["Buste légèrement incliné.", "Tire vers le haut de la poitrine.", "Coudes vers les hanches."]),
 ("Tirage vertical à genoux unilatéral", "vpull", [DL], "Poulie", "À genoux de côté à la poulie haute, une poignée.", ["Tire le coude vers la hanche.", "Étire bien en haut.", "Excellent pour la connexion au dorsal."]),
 ("Tirage vertical machine convergente", "vpull", [DL, BI], "Machine", "Assis, cuisses bloquées, poignées au-dessus de la tête.", ["Tire les coudes vers le bas.", "Épaules basses.", "Retour contrôlé."]),
 # Muscle-up
 ("Muscle-up aux anneaux", "muscleup", [DL, TRI, PE], "Anneaux", "Prise fausse (faux grip) sur les anneaux.", ["Tire haut, poitrine vers les anneaux.", "Bascule les épaules au-dessus des mains.", "Finis par un dips."]),
 ("Muscle-up strict", "muscleup", [DL, TRI, PE], "Poids de corps", "Prise pronation à la barre, sans élan.", ["Traction explosive jusqu'au sternum.", "Bascule rapide des poignets.", "Aucun balancement."]),
 # Rowing
 ("Rowing haltères buste penché", "row", [DE, DL, BI], "Haltères", "Buste penché à 45°, un haltère dans chaque main.", ["Dos neutre.", "Tire les coudes vers les hanches.", "Pause en haut."]),
 ("Rowing landmine unilatéral", "row", [DE, DL], "Landmine", "Debout de côté à la barre, une main sur le bout.", ["Buste penché, dos neutre.", "Tire vers la hanche.", "Grande amplitude."]),
 ("Rowing iso-latéral machine", "row", [DE, DL, BI], "Machine", "Poitrine contre l'appui, poignées indépendantes.", ["Tire un bras ou les deux.", "Serre les omoplates.", "Étire bien devant."]),
 ("Rowing aux anneaux", "row", [DE, BI], "Anneaux", "Suspendu sous les anneaux, corps gainé.", ["Tire la poitrine vers les mains.", "Plus les pieds sont devant, plus c'est dur.", "Pause en haut."]),
 ("Rowing Helms haltères", "row", [DE, EP], "Haltères", "Debout, poitrine contre le haut d'un banc incliné.", ["Pas d'élan possible.", "Tire vers les hanches.", "Contrôle la descente."]),
 ("Rowing australien pieds surélevés", "row", [DE, BI], "Poids de corps", "Sous une barre basse, pieds sur un banc.", ["Corps aligné.", "Poitrine à la barre.", "Plus dur que pieds au sol."]),
 ("Rowing poulie basse unilatéral", "row", [DE, DL], "Poulie", "Assis ou debout, une poignée sur la poulie basse.", ["Rotation légère du buste en étirement.", "Tire le coude derrière toi.", "Pause en contraction."]),
 # Trapèzes, cou
 ("Shrug trap bar", "shrug", [TR], "Trap bar", "Au centre de la trap bar.", ["Monte les épaules vers les oreilles.", "Pause en haut.", "Pas de rotation des épaules."]),
 ("Shrug incliné haltères (trapèzes moyens)", "shrug", [TR, DE], "Haltères", "Allongé sur le ventre sur un banc incliné.", ["Serre les omoplates vers le haut et l'arrière.", "Bras tendus.", "Pause en contraction."]),
 ("Extension du cou avec harnais", "shrug", [COU, TR], "Autre", "Assis, buste penché, harnais avec un disque léger.", ["Charge très légère.", "Lève la tête lentement.", "Amplitude confortable, jamais dans la douleur."]),
 ("Flexion du cou allongé", "shrug", [COU], "Poids de corps", "Allongé sur le dos, tête dans le vide au bord d'un banc.", ["Rentre le menton vers la poitrine.", "Lentement.", "Ajoute une serviette et une main pour la résistance."]),
 # Épaules
 ("Élévation latérale assis haltères", "lateral", [EL], "Haltères", "Assis au bout d'un banc.", ["Monte jusqu'à l'horizontale.", "Pas d'élan possible.", "Descends lentement."]),
 ("Élévation latérale poulie derrière le dos", "lateral", [EL], "Poulie", "Poulie basse derrière toi, câble passant dans ton dos.", ["Étirement en bas.", "Monte jusqu'à l'horizontale.", "Tension constante."]),
 ("Élévation frontale disque", "front_raise", [EA], "Autre", "Debout, disque tenu à deux mains.", ["Monte jusqu'à hauteur des yeux.", "Pas d'élan.", "Descends lentement."]),
 ("Oiseau poulie croisé", "rear", [EP], "Poulie", "Entre deux poulies hautes, câbles croisés.", ["Bras presque tendus.", "Ouvre vers l'arrière.", "Contrôle le retour."]),
 ("W-raise sur banc incliné", "rear", [EP, TR], "Haltères", "Allongé sur le ventre, banc incliné, haltères légers.", ["Coudes fléchis en W.", "Serre les omoplates.", "Pouces vers le haut."]),
 ("Rotation interne poulie", "cuff", [EP, PE], "Poulie", "De profil, coude collé au corps à 90°.", ["Ramène la main vers le ventre.", "Coude fixe.", "Charge légère."]),
 ("Rotation externe élastique", "cuff", [EP], "Élastique", "Élastique tenu à deux mains, coudes au corps.", ["Écarte les mains vers l'extérieur.", "Omoplates serrées.", "Lentement."]),
 ("Rotation externe à 90° poulie", "cuff", [EP], "Poulie", "Coude levé à hauteur d'épaule, fléchi à 90°.", ["Tourne l'avant-bras vers le haut.", "Coude immobile.", "Très léger."]),
 # Biceps
 ("Curl haltères simultané", "curl", [BI, AB], "Haltères", "Debout, un haltère dans chaque main.", ["Coudes fixes le long du corps.", "Supination en montant.", "Descends lentement."]),
 ("Curl haltères assis", "curl", [BI], "Haltères", "Assis au bout d'un banc.", ["Pas d'élan possible.", "Amplitude complète.", "Contrôle la descente."]),
 ("Curl marteau croisé", "curl", [BI, AB], "Haltères", "Debout, prise marteau.", ["Monte l'haltère vers l'épaule opposée.", "Coude fixe.", "Travaille le brachial."]),
 ("Curl poulie unilatéral", "curl", [BI], "Poulie", "Poulie basse, une poignée.", ["Tension constante.", "Coude fixe.", "Contraction en haut."]),
 ("Drag curl", "curl", [BI], "Barre", "Debout, barre devant les cuisses.", ["Fais glisser la barre le long du corps.", "Coudes qui reculent.", "Accent sur la longue portion."]),
 ("Curl 21 barre EZ", "curl", [BI], "Barre", "Debout, barre EZ.", ["7 reps du bas à mi-course.", "7 reps de mi-course en haut.", "7 reps complètes."]),
 ("Curl biceps aux anneaux", "curl", [BI], "Anneaux", "Suspendu sous les anneaux, corps incliné.", ["Coudes fixes devant toi.", "Ramène les mains vers le front.", "Plus tu es horizontal, plus c'est dur."]),
 ("Curl kettlebell", "curl", [BI, AB], "Kettlebell", "Kettlebell tenue par la poignée.", ["Coudes fixes.", "Le poids décalé travaille la prise.", "Descends lentement."]),
 # Triceps
 ("Extension triceps barre EZ au-dessus de la tête", "triceps", [TRI], "Barre", "Assis, barre EZ au-dessus de la tête.", ["Coudes vers le plafond.", "Descends derrière la tête.", "Étirement de la longue portion."]),
 ("Extension triceps haltère unilatérale au-dessus de la tête", "triceps", [TRI], "Haltères", "Assis ou debout, un haltère au-dessus de la tête.", ["Coude fixe vers le plafond.", "Descends derrière la tête.", "Contrôle le bas."]),
 ("Skullcrusher incliné barre EZ", "triceps", [TRI], "Barre", "Banc incliné à 30°, barre EZ bras tendus.", ["Descends derrière la tête.", "Coudes fixes.", "Plus d'étirement qu'à plat."]),
 ("Extension triceps au poids du corps (barre basse)", "triceps", [TRI], "Poids de corps", "Mains sur une barre basse, corps incliné.", ["Fléchis les coudes, tête sous la barre.", "Corps gainé.", "Repousse jusqu'aux bras tendus."]),
 ("Développé serré haltères", "triceps", [TRI, PE], "Haltères", "Allongé, haltères collés l'un à l'autre, prise neutre.", ["Coudes près du corps.", "Descends sur le sternum.", "Pousse en serrant les haltères."]),
 ("Extension triceps poulie haute prise inversée", "triceps", [TRI], "Poulie", "Barre droite, prise en supination.", ["Coudes fixes.", "Tends complètement.", "Accent sur le vaste médial."]),
 # Avant-bras
 ("Flexion poignet derrière le dos barre", "forearm", [AB], "Barre", "Debout, barre derrière les cuisses, paumes vers l'arrière.", ["Laisse rouler la barre dans les doigts.", "Fléchis les poignets.", "Amplitude complète."]),
 ("Pronation-supination haltère", "forearm", [AB], "Haltères", "Avant-bras en appui, haltère tenu par une extrémité.", ["Tourne lentement d'un côté à l'autre.", "Coude fixe.", "Protège les coudes."]),
 ("Extension des doigts élastique", "forearm", [AB], "Élastique", "Élastique autour des doigts.", ["Ouvre les doigts contre l'élastique.", "Lentement.", "Équilibre les fléchisseurs."]),
 ("Suspension à la barre (dead hang)", "forearm", [AB, DL], "Poids de corps", "Suspendu à la barre, bras tendus.", ["Épaules actives.", "Tiens le plus longtemps possible.", "Décompresse le dos."], "s"),
 ("Suspension à une main", "forearm", [AB, DL], "Poids de corps", "Suspendu par une main.", ["Épaule active.", "Corps gainé.", "Alterne les mains."], "s"),
 # Portés et traîneau
 ("Suitcase carry (porté unilatéral)", "carry", [A_, AB, TR], "Haltères", "Un haltère ou une kettlebell lourde d'un seul côté.", ["Marche droit, sans pencher.", "Épaules à niveau.", "Change de côté."], "s"),
 ("Porté au-dessus de la tête", "carry", [EA, A_, TR], "Kettlebell", "Kettlebell ou haltère bras tendu au-dessus de la tête.", ["Bras verrouillé.", "Côtes basses.", "Marche lentement."], "s"),
 ("Poussée de traîneau (prowler)", "carry", [Q, F_, MO], "Autre", "Mains sur les montants du traîneau, corps penché.", ["Petits pas puissants.", "Dos neutre.", "Excellent conditionnement sans excentrique."], "s"),
 ("Traîneau tiré à reculons", "carry", [Q], "Autre", "Sangle attachée au traîneau, face à lui.", ["Recule à petits pas.", "Genoux qui avancent.", "Doux pour les genoux."], "s"),
 # Abdominaux
 ("Relevé de genoux suspendu", "abs_flex", [A_], "Poids de corps", "Suspendu à la barre.", ["Monte les genoux vers la poitrine.", "Enroule le bassin.", "Pas de balancement."]),
 ("Relevé de jambes au sol", "abs_flex", [A_], "Poids de corps", "Allongé sur le dos, mains sous les fesses.", ["Bas du dos plaqué.", "Monte les jambes tendues.", "Descends sans toucher le sol."]),
 ("Relevé de jambes à la chaise romaine", "abs_flex", [A_], "Machine", "Avant-bras sur les appuis, dos contre le dossier.", ["Monte les genoux puis enroule le bassin.", "Descends lentement.", "Jambes tendues pour progresser."]),
 ("Crunch sur ballon suisse", "abs_flex", [A_], "Autre", "Bas du dos sur un ballon.", ["Grande amplitude en extension.", "Enroule le haut du corps.", "Mains derrière la tête sans tirer."]),
 ("Toes to bar", "abs_flex", [A_, DL], "Poids de corps", "Suspendu à la barre.", ["Monte les pieds jusqu'à la barre.", "Bras tendus.", "Contrôle la descente."]),
 ("Sit-up décliné lesté", "abs_flex", [A_], "Autre", "Sur un banc décliné, disque contre la poitrine.", ["Enroule le buste.", "Remonte jusqu'à la verticale.", "Descends lentement."]),
 ("V-up", "abs_flex", [A_], "Poids de corps", "Allongé, bras tendus derrière la tête.", ["Monte jambes et buste ensemble.", "Touche les pieds.", "Descends en contrôle."]),
 ("Gainage latéral (side plank)", "anti", [A_], "Poids de corps", "Sur un avant-bras, de côté, corps aligné.", ["Hanches hautes.", "Ne laisse pas tomber le bassin.", "Change de côté."], "s"),
 ("Planche RKC", "anti", [A_], "Poids de corps", "Gainage sur les avant-bras.", ["Serre fessiers, cuisses et abdos au maximum.", "Tire les coudes vers les pieds.", "Séries courtes et intenses."], "s"),
 ("Planche toucher d'épaules", "anti", [A_, EA], "Poids de corps", "Gainage bras tendus.", ["Touche l'épaule opposée.", "Bassin immobile.", "Pieds écartés pour faciliter."]),
 ("Bear hold (position de l'ours)", "anti", [A_, Q], "Poids de corps", "À quatre pattes, genoux à 3 cm du sol.", ["Dos plat.", "Respire sans bouger.", "Pousse le sol avec les mains."], "s"),
 ("Body saw", "anti", [A_], "Autre", "Gainage sur les avant-bras, pieds sur des glisseurs.", ["Recule et avance de quelques centimètres.", "Bassin fixe.", "Très intense pour les abdos."]),
 ("Bird dog", "anti", [A_, LO, F_], "Poids de corps", "À quatre pattes.", ["Tends un bras et la jambe opposée.", "Dos immobile.", "Pause de 2 secondes."]),
 ("Hollow rock", "anti", [A_], "Poids de corps", "Position hollow body.", ["Bascule d'avant en arrière.", "Garde la forme en banane.", "Bas du dos collé."]),
 # Rotation
 ("Woodchopper bas-haut poulie", "rotation", [A_], "Poulie", "Poulie basse, de côté.", ["Tire en diagonale vers le haut.", "Rotation par les hanches et le tronc.", "Bras presque tendus."]),
 ("Rotation landmine", "rotation", [A_, EA], "Landmine", "Debout, bout de la barre tenu à deux mains au-dessus de la tête.", ["Décris un arc d'une hanche à l'autre.", "Pivote sur les pieds.", "Bras tendus."]),
 ("Crunch bicyclette", "rotation", [A_], "Poids de corps", "Allongé, mains derrière la tête.", ["Coude vers le genou opposé.", "Lentement.", "Jambe tendue sans toucher le sol."]),
 ("Lancer rotatif de médecine-ball", "rotation", [A_], "Autre", "De profil à un mur, ballon à deux mains.", ["Rotation explosive des hanches.", "Lance contre le mur.", "Rattrape et recommence."]),
 # Figures
 ("Front lever groupé (tuck)", "skill", [DL, A_], "Poids de corps", "Suspendu, genoux contre la poitrine.", ["Bras tendus, épaules basses.", "Dos à l'horizontale.", "Tiens la position."], "s"),
 ("Front lever avancé (advanced tuck)", "skill", [DL, A_], "Poids de corps", "Comme le tuck, dos plat et hanches ouvertes.", ["Dos plat, cuisses à 90°.", "Bras verrouillés.", "Tiens la position."], "s"),
 ("Front lever complet", "skill", [DL, A_, LO], "Poids de corps", "Suspendu, corps tendu à l'horizontale.", ["Corps aligné des épaules aux pieds.", "Bras tendus.", "Fessiers serrés."], "s"),
 ("Front lever raises", "skill", [DL, A_], "Poids de corps", "Suspendu.", ["Monte le corps tendu jusqu'à l'horizontale.", "Redescends en contrôle.", "Version groupée pour commencer."]),
 ("Back lever", "skill", [DL, PE, BI], "Anneaux", "Suspendu, corps à l'horizontale face au sol.", ["Monte par le skin the cat.", "Bras tendus, épaules en extension.", "Progresse par paliers."], "s"),
 ("Planche groupée (tuck planche)", "skill", [EA, PE, A_], "Poids de corps", "Appui sur les mains, genoux contre la poitrine, pieds décollés.", ["Épaules devant les mains.", "Dos rond.", "Bras tendus."], "s"),
 ("Planche lean", "skill", [EA, PE], "Poids de corps", "Position de pompe, mains au niveau des hanches.", ["Penche les épaules loin devant.", "Bras verrouillés.", "Tiens la position."], "s"),
 ("Équilibre contre le mur (handstand)", "skill", [EA, TRI, TR], "Poids de corps", "Face au mur ou dos au mur, en appui renversé.", ["Bras tendus, épaules ouvertes.", "Corps aligné.", "Pousse le sol."], "s"),
 ("Équilibre libre (handstand)", "skill", [EA, TRI, AB], "Poids de corps", "Appui renversé sans mur.", ["Les doigts corrigent l'équilibre.", "Corps gainé.", "Apprends à sortir en roulade ou sur le côté."], "s"),
 ("Drapeau (human flag)", "skill", [DL, A_, EA], "Poids de corps", "Mains sur un poteau vertical, une en haut une en bas.", ["Bras du haut tire, bras du bas pousse.", "Corps à l'horizontale.", "Version groupée d'abord."], "s"),
 ("L-sit au sol", "skill", [A_, TRI], "Poids de corps", "Assis, mains au sol à côté des hanches.", ["Pousse le sol pour décoller.", "Jambes tendues à l'horizontale.", "Épaules basses."], "s"),
 ("Skin the cat", "skill", [DL, EA], "Anneaux", "Suspendu aux anneaux ou à une barre.", ["Passe les jambes entre les bras.", "Descends doucement en extension d'épaules.", "Reviens en contrôle."]),
 # Mobilité
 ("Cat-camel", "mob", [MOB, LO], "Poids de corps", "À quatre pattes.", ["Arrondis le dos en expirant.", "Creuse en inspirant.", "Lentement, vertèbre par vertèbre."]),
 ("Mobilité 90/90 des hanches", "mob", [MOB, F_], "Poids de corps", "Assis, les deux genoux fléchis à 90°, un devant, un sur le côté.", ["Passe d'un côté à l'autre sans les mains.", "Buste droit.", "Rotation interne et externe."]),
 ("Fente basse (fléchisseurs de hanche)", "mob", [MOB, Q], "Poids de corps", "Genou arrière au sol, pied avant devant.", ["Bascule le bassin en arrière.", "Avance doucement.", "Serre le fessier de la jambe arrière."], "s"),
 ("World's greatest stretch", "mob", [MOB], "Poids de corps", "Grande fente, mains au sol.", ["Coude vers la cheville avant.", "Ouvre le bras vers le plafond.", "Change de côté."]),
 ("Dislocations d'épaules au bâton", "mob", [MOB, EP], "Autre", "Debout, bâton ou élastique tenu prise large.", ["Passe de devant à derrière bras tendus.", "Resserre la prise avec le temps.", "Lentement."]),
 ("Rotation thoracique à quatre pattes", "mob", [MOB], "Poids de corps", "À quatre pattes, une main derrière la tête.", ["Tourne le coude vers le plafond.", "Bassin immobile.", "Suis le coude du regard."]),
 ("Mobilité de cheville genou au mur", "mob", [MOB, MO], "Poids de corps", "Face à un mur, pied à 10 cm.", ["Avance le genou vers le mur.", "Talon au sol.", "Recule le pied pour progresser."]),
 ("Posture du pigeon", "mob", [MOB, F_], "Poids de corps", "Une jambe pliée devant, l'autre tendue derrière.", ["Bassin de face.", "Penche-toi doucement en avant.", "Respire longuement."], "s"),
 ("Squat profond tenu", "mob", [MOB, Q], "Poids de corps", "En bas du squat, talons au sol.", ["Coudes poussent les genoux vers l'extérieur.", "Buste droit.", "Respire."], "s"),
 ("Pompes scapulaires", "mob", [MOB, EA], "Poids de corps", "Position de pompe, bras tendus.", ["Rapproche puis écarte les omoplates.", "Bras toujours tendus.", "Active le dentelé antérieur."]),
 ("Respiration 90/90", "mob", [MOB, A_], "Poids de corps", "Allongé sur le dos, pieds sur un mur, hanches et genoux à 90°.", ["Inspire par le nez dans le ventre.", "Expire longuement, côtes basses.", "5 respirations lentes."]),
 ("Étirement des ischios jambe tendue", "mob", [MOB, I_], "Poids de corps", "Allongé, une jambe tendue vers le haut avec une sangle.", ["Jambe opposée au sol.", "Rapproche doucement.", "Pas de douleur."], "s"),
 # Conditionnement
 ("Burpees", "cond", [CAR, Q, PE], "Poids de corps", "Debout.", ["Mains au sol, pieds en arrière.", "Poitrine au sol, puis remonte.", "Saut final, bras en haut."]),
 ("Corde à sauter", "cond", [CAR, MO], "Autre", "Corde réglée à hauteur des aisselles.", ["Petits sauts sur l'avant du pied.", "Poignets qui tournent, pas les bras.", "Rythme régulier."], "s"),
 ("Rameur", "cond", [CAR, DE, Q], "Machine", "Pieds sanglés, résistance moyenne.", ["Jambes, puis buste, puis bras.", "Retour dans l'ordre inverse.", "Dos droit."], "s"),
 ("Vélo à air (assault bike)", "cond", [CAR, Q], "Machine", "Selle à hauteur de hanche.", ["Pousse et tire les poignées.", "Intervalles courts et intenses.", "Récupère en pédalant doucement."], "s"),
 ("Sprints en côte", "cond", [CAR, I_, F_], "Poids de corps", "Côte de 5 à 10 %.", ["Montée courte et explosive.", "Redescends en marchant.", "Moins traumatisant que le sprint à plat."], "s"),
 ("Vélo zone 2", "cond", [CAR], "Machine", "Selle réglée, résistance légère.", ["Rythme où tu peux parler.", "Cadence régulière.", "20 à 45 minutes."], "s"),
 ("Marche inclinée tapis", "cond", [CAR, MO, F_], "Machine", "Tapis incliné à 8-12 %, vitesse 5-6 km/h.", ["Ne te tiens pas aux barres.", "Grands pas.", "Excellent cardio doux."], "s"),
 ("Wall balls", "cond", [CAR, Q, EA], "Autre", "Face à un mur, médecine-ball contre la poitrine.", ["Squat complet.", "Lance le ballon vers une cible haute.", "Rattrape et enchaîne."]),
]

added = 0
for row in N:
  name, fam, mus, eq, setup, cues = row[:6]
  unit = row[6] if len(row) > 6 else None
  if name in F["ex"]: continue
  F["ex"][name] = {"fam": fam, "setup": setup, "cues": cues, "note": "", "mus": mus, "eq": eq, **({"unit": unit} if unit else {})}
  added += 1

# Muscles et matériel pour tous les exercices existants
base = {r[0]: r for r in LIB["BASE"]}
for name, e in F["ex"].items():
  if "mus" not in e:
    r = base.get(name)
    e["mus"] = [m for m in (r[1], r[2], r[3]) if m] if r else FAM_MUS.get(e["fam"], ["Autre"])
  if "eq" not in e:
    r = base.get(name)
    e["eq"] = (r[4] if r and r[4] not in (None, "Autre") else eq_of(name))
    if e["eq"] == "Poids de corps" and "lest" in name.lower(): e["eq"] = "Lest"
  if "unit" not in e and re.search(r"gainage|planche|plank|chaise contre|copenhagen|hollow body hold|suspension|L-sit|farmers walk|dead hang", name, re.I): e["unit"] = "s"

F["meta"]["exos"] = len(F["ex"])
json.dump(F, open(f"{ROOT}/data/fiches.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
from collections import Counter
print("ajoutés", added, "total", len(F["ex"]))
print(Counter(m for e in F["ex"].values() for m in e["mus"][:1]))
print(Counter(e["eq"] for e in F["ex"].values()))
