# Esboço das ruas ao redor da Cidade Universitária, para os ônibus da cidade fora da ilha não aparecerem "no vazio".
#
#   python3 tools/ruas_cidade.py        → grava ruas-cidade.json (raiz do site), que o app carrega só com a camada
#                                         "Ônibus da cidade" ligada (src/js/29-ruas-cidade.js)
#
# Fonte: OpenStreetMap (© colaboradores do OpenStreetMap, licença ODbL), cópia em tools/dados/osm-ruas-fundao.json.gz
# (API 0.6 /map em blocos, na caixa da área do ao vivo do Worker com folga; só ruas e o litoral).
# Dentro da Ilha do Fundão nada é desenhado: lá vale a planta do campus. Os traçados são simplificados
# (Douglas–Peucker: 3 m nas vias grandes, 6 m nas ruas), guardados em lat/lon ×1e5 com diferenças, e o app os põe
# no mapa com a mesma conta da localização (ll2map).
import gzip, json, math, os, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(gzip.open(os.path.join(ROOT, 'tools', 'dados', 'osm-ruas-fundao.json.gz'), 'rt', encoding='utf-8'))
SAIDA = os.path.join(ROOT, 'ruas-cidade.json')
LAT0, LON0 = -22.855, -43.228
KX, KY = 111320 * math.cos(math.radians(LAT0)), 110574
def m(p): return ((p[1] / 1e5 - LON0) * KX, (p[0] / 1e5 - LAT0) * KY)  # metros locais

CLASSE = {}
for k in ('motorway', 'trunk', 'motorway_link', 'trunk_link'): CLASSE[k] = 'a'
for k in ('primary', 'secondary', 'busway', 'primary_link', 'secondary_link'): CLASSE[k] = 'b'
for k in ('tertiary', 'tertiary_link', 'residential', 'unclassified', 'living_street', 'pedestrian'): CLASSE[k] = 'c'
CLASSE['coast'] = 'm'
TOL = {'a': 3, 'b': 3, 'c': 6, 'm': 8}

caminhos = D['caminhos']
ilha = next(w for w in caminhos if w[1] == 'coast' and w[2] == 'Ilha do Fundão')
I = [m((ilha[3][k], ilha[3][k + 1])) for k in range(0, len(ilha[3]), 2)]
def dentro(q, P=I):
  x, y, c = q[0], q[1], False
  for i in range(len(P)):
    a, b = P[i - 1], P[i]
    if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]: c = not c
  return c
# a ilha com folga de ~40 m para dentro não conta como "fora" (o litoral da planta e o do OSM não batem ao metro)
def dist_borda(q):
  best = 1e9
  for i in range(len(I)):
    a, b = I[i - 1], I[i]; dx, dy = b[0] - a[0], b[1] - a[1]; L = dx * dx + dy * dy or 1e-9
    t = max(0, min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L)); best = min(best, math.hypot(q[0] - a[0] - t * dx, q[1] - a[1] - t * dy))
  return best
BX = (min(p[0] for p in I) - 100, max(p[0] for p in I) + 100, min(p[1] for p in I) - 100, max(p[1] for p in I) + 100)
def na_ilha(q, folga):
  if not (BX[0] <= q[0] <= BX[1] and BX[2] <= q[1] <= BX[3]): return False
  return dentro(q) or (folga > 0 and dist_borda(q) < folga)

saida = collections.defaultdict(list); nomes = collections.defaultdict(list); pontos = 0
for wid, tipo, nome, g in caminhos:
  c = CLASSE.get(tipo)
  if not c or (tipo == 'coast' and nome == 'Ilha do Fundão'): continue
  P = [(g[k], g[k + 1]) for k in range(0, len(g), 2)]
  folga = 60 if c == 'm' else 0
  # corta o caminho nos pedaços fora da ilha
  pedacos, atual = [], []
  for p in P:
    if na_ilha(m(p), folga):
      if len(atual) > 1: pedacos.append(atual)
      atual = []
    else: atual.append(p)
  if len(atual) > 1: pedacos.append(atual)
  for pd in pedacos:
    M = [m(p) for p in pd]
    # Douglas–Peucker sobre os metros, guardando os pontos originais
    idx = list(range(len(M)))
    def dpi(ii, tol):
      if len(ii) < 3: return ii
      a, b = M[ii[0]], M[ii[-1]]; dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1e-9
      k, d = max(((j, abs(dy * (M[ii[j]][0] - a[0]) - dx * (M[ii[j]][1] - a[1])) / L) for j in range(1, len(ii) - 1)), key=lambda x: x[1])
      return dpi(ii[:k + 1], tol)[:-1] + dpi(ii[k:], tol) if d > tol else [ii[0], ii[-1]]
    keep = dpi(idx, TOL[c]); q = [pd[j] for j in keep]
    comp = sum(math.hypot(M[keep[j]][0] - M[keep[j - 1]][0], M[keep[j]][1] - M[keep[j - 1]][1]) for j in range(1, len(keep)))
    if c == 'c' and comp < 25: continue
    enc, la, lo = [], 0, 0
    for p in q: enc += [p[0] - la, p[1] - lo]; la, lo = p
    saida[c].append(enc); pontos += len(q)
    if nome and c in 'ab' and comp > 150: nomes[nome].append((comp, q))

# nomes das vias maiores: um rótulo por via (no maior pedaço), as mais compridas primeiro
rot = []
for nome, L in sorted(nomes.items(), key=lambda kv: -sum(x[0] for x in kv[1]))[:14]:
  comp, q = max(L, key=lambda x: x[0]); k = len(q) // 2
  a, b = q[max(0, k - 1)], q[min(len(q) - 1, k + 1)] if len(q) > 2 else q[-1]
  rot.append([nome, a[0], a[1], b[0], b[1]])
res = {'fonte': '© colaboradores do OpenStreetMap (ODbL)', 'c': saida, 'n': rot}
json.dump(res, open(SAIDA, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('%d traçados, %d pontos (%s), %d nomes → %s (%d KB)' % (sum(len(v) for v in saida.values()), pontos,
      ', '.join('%s %d' % (k, len(v)) for k, v in sorted(saida.items())), len(rot), os.path.relpath(SAIDA, ROOT), os.path.getsize(SAIDA) // 1024))
print('nomes:', ', '.join(r[0] for r in rot))
