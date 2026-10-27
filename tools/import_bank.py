# Importe la banque de programmes de TB my Coach (tools/tb_bank.json) au format CalXsthenos (séries écrites par semaine).
import json, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = json.load(open(f"{ROOT}/tools/tb_bank.json", encoding="utf8"))
P = json.load(open(f"{ROOT}/data/programs.json", encoding="utf8"))
FI = json.load(open(f"{ROOT}/data/fiches.json", encoding="utf8"))["ex"]

def parse(s):
    out = []
    parts = [x.strip() for x in str(s or "").split("+") if x.strip()]
    for gi, part in enumerate(parts):
        m = re.match(r"^(\d+)\s*x\s*(\d+)(?:\s*-\s*(\d+))?", part, re.I)
        if not m: continue
        pct = re.search(r"@\s*([\d.,]+)\s*%", part); rpe = re.search(r"RPE\s*([\d.,]+)", part, re.I)
        t = "A" if re.search("AMRAP", part, re.I) else "D" if re.search(r"\bDS\b", part) else ("T" if gi == 0 else "B") if len(parts) > 1 else "N"
        for _ in range(int(m[1])):
            out.append({"t": t, "lo": int(m[2]), "hi": int(m[3] or m[2]), "pct": float(pct[1].replace(",", ".")) if pct else None, "kg": None,
                        "rpe": float(rpe[1].replace(",", ".")) if rpe else (None if pct else 8), "tech": []})
    return out

LEVEL = {"pb4": "Avancé", "pl4": "Avancé", "531": "Intermédiaire", "ppl6": "Avancé", "fb3": "Débutant", "street": "Avancé", "home0": "Tous niveaux", "home1": "Tous niveaux"}
SPLIT = {"pb4": "Haut / Bas", "pl4": "SBD", "531": "Force", "ppl6": "Push / Pull / Legs", "fb3": "Full body", "street": "Street lifting", "home0": "Full body", "home1": "Haut / Bas"}
PROF = {
  "pb4": "Pratiquant de plus de 2 ans qui veut monter ses 3 mouvements tout en construisant un physique : 4 séances de 75 min.",
  "pl4": "Pratiquant qui vise une compétition ou un test de ses maxima au squat, au développé couché et au soulevé de terre.",
  "531": "Pratiquant intermédiaire qui aime la simplicité : 4 mouvements, une progression mensuelle, du volume BBB.",
  "ppl6": "Pratiquant avancé disponible 6 jours, objectif volume musculaire maximal.",
  "fb3": "Débutant complet en salle : 3 séances simples pour apprendre les mouvements et prendre de la force.",
  "street": "Pratiquant de street workout qui veut monter ses tractions et ses dips lestés, plus le squat.",
  "home0": "Pas de salle, pas de matériel : 3 séances au poids du corps, progression par le volume.",
  "home1": "À la maison avec des haltères et des élastiques : 4 séances, haut et bas du corps.",
}
REST = {"F": 180, "P": 120, "I": 75}
out = []
for b in B:
    phases = b.get("phases") or []
    ov = (b.get("ov") or {}).get("Accumulation") or {}
    sessions = []
    for name, day, rows in b["s"]:
        R = []
        for i, x in enumerate(rows):
            ex = x["name"]
            if ex not in FI: print("absent de la bibliothèque :", ex)
            weeks = x.get("weeks") or [None, "3x8-12 RPE8"]
            base = parse(weeks[1])
            has_pct = any(s["pct"] for s in base)
            kind = "F" if has_pct else ("P" if i < 2 else "I")
            prog = {"load": "auto", "step": 2.5, "every": 1, "addSet": None, "reps": None}
            if has_pct and x.get("mode") != "Manuel":
                prog.update({"load": "pct", "step": 1.5, "reps": {"delta": -1, "every": 4, "min": 2}})
            if ov.get("t") in ("volume", "mixte") and not has_pct:
                prog["addSet"] = {"every": ov.get("n", 2), "max": ov.get("max", 5)}
            if ov.get("t") == "intensite" and not has_pct:
                prog.update({"load": "rpe", "step": 0.5, "every": 2})
            xr = {"sets": base, "rest": REST[kind], "prog": prog}
            if x.get("mode") == "Manuel":
                xr["weeks"] = {str(w): parse(s) for w, s in enumerate(weeks) if w and s}
            R.append([ex, kind, x.get("note", ""), x.get("ss"), None, xr])
        sessions.append([name, day, R])
    out.append({"id": "tbm-" + b["id"], "name": b["name"], "lvl": LEVEL.get(b["id"], "Intermédiaire"), "split": SPLIT.get(b["id"], ""),
                "cat": b.get("cat", ""), "days": b["days"], "weeks": len(phases) or 12, "phases": phases, "prof": PROF.get(b["id"], ""), "desc": b.get("desc", ""),
                "why": "", "rules": ["Chaque série de chaque semaine est écrite à l'avance : ouvre « Mon cycle » pour voir la semaine suivante.",
                                     "Les pourcentages se calculent sur ton 1RM estimé ; le RPE ajuste au jour.",
                                     "Semaines d'allègement prévues : charge et volume baissent, tu récupères et tu repars plus fort."], "s": sessions, "src": "TB my Coach"})
ids = {p["id"] for p in out}
P["P"] = [p for p in P["P"] if p["id"] not in ids] + out
json.dump(P, open(f"{ROOT}/data/programs.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
print(len(P["P"]), "programmes")
