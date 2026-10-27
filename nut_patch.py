import json
best=None
for l in open('/root/.claude/projects/-home-claude/34074780-3dba-5ef7-b0ec-daf4b86bc930.jsonl'):
    if 'ING_CQ' not in l: continue
    try: d=json.loads(l)
    except: continue
    m=d.get('message',{})
    if not isinstance(m,dict): continue
    for c in m.get('content',[]) if isinstance(m.get('content'),list) else []:
        if isinstance(c,dict) and c.get('type')=='tool_use':
            cmd=c.get('input',{}).get('command','')
            if 'ING_CQ' in cmd and 'PLAN_PRESETS' in cmd: best=cmd
start=best.index("python3 - <<'EOF'\n")+len("python3 - <<'EOF'\n"); end=best.rindex("\nEOF")
t=best[start:end]
t=t.replace("a=s.index('// Plats nommés : ce que les gens mangent vraiment')\nb=s.index('export function macrosOf(ing) {')","a=b=s.index('export function macrosOf(ing) {')")
open('nut_patch.py','w').write(t); print(len(t), "a=b=" in t)