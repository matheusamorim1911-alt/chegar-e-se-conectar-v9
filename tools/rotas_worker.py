#!/usr/bin/env python3
"""Grava em ROTAS (worker/gps-fundao.js) as rotas do GTFS da prefeitura do Rio cujo route_id não segue a regra do
Worker ("O0321AAA0A" → 321, "O0803AAP0A" → SP803): variantes (SN, SV, SR, SVA, SPB…) e o BRT (route_id numérico).
Só precisa do routes.txt (o tools/gtfs_fundao.py faz o mesmo junto com o resto). Depois, publique o Worker de novo.
Uso: python3 tools/rotas_worker.py <routes.txt>"""
import csv, re, json, os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAR = {'AAA': '', 'AAP': 'SP'}
def regra(rid):
    m = re.match(r'^[A-Z](\d{3,4})([A-Z]{3})\d[A-Z]$', rid)
    if m:
        n = str(int(m.group(1)))
        return VAR[m.group(2)] + n if m.group(2) in VAR else n
    return rid if re.match(r'^[A-Z]{0,3}\d{1,4}[A-Z]?$', rid) else ''
if len(sys.argv) != 2:
    sys.exit(__doc__)
R = list(csv.DictReader(open(sys.argv[1], encoding='utf-8-sig')))
rot = {r['route_id']: r['route_short_name'] for r in R if r['route_short_name'] and regra(r['route_id']) != r['route_short_name']}
wf = os.path.join(RAIZ, 'worker', 'gps-fundao.js')
w = open(wf, encoding='utf-8').read()
a = w.index('// ROTAS-INICIO\n') + len('// ROTAS-INICIO\n'); b = w.index('// ROTAS-FIM\n')
novo = w[:a] + 'const ROTAS = ' + json.dumps(dict(sorted(rot.items())), ensure_ascii=False, separators=(',', ':')) + ';\n' + w[b:]
if novo != w:
    open(wf, 'w', encoding='utf-8').write(novo)
print('%d rotas no routes.txt; %d fora da regra gravadas em ROTAS.%s' % (len(R), len(rot), ' Publique o Worker de novo.' if novo != w else ' Nada mudou.'))
