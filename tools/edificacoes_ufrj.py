# Gera src/edificacoes.json: os prédios do cadastro da UFRJ que não aparecem na planta do mapa (mapa-campus*.svg),
# já nas coordenadas do mapa, e os nomes que entram no zoom.
#
# Fonte: mapa público da UFRJ no ArcGIS Online, "Cidade Universitária-Parâmetros Urbanos e Arquitetônicos_Edificações
# por Centro" (dono: UniversidadeFederalDoRioDeJaneiro), camadas "CENTROS" (edificações) e "UNIDADES TERRITORIAIS DE
# GESTÃO (UTG)" (lotes). Os dados ficam em tools/dados/edificacoes-ufrj.json (GeoJSON em graus). Para atualizar, abra
#   https://ufrj.maps.arcgis.com/sharing/rest/content/items/7c0652800dcc498e8b9d2754aa962f8c/data?f=json
# no navegador, salve o arquivo e passe-o no lugar do de tools/dados (o script aceita os dois formatos).
#
# Uso: python3 tools/edificacoes_ufrj.py [entrada.json] [saida.json]
# Um prédio "falta na planta" quando quase nada da planta foi desenhado no lugar dele: menos de 35% da borda tem
# traço ou preenchimento a até 1,5 unidade (~5 m) e menos de 15% do interior está preenchido.
import json, math, os, re, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools', 'dados', 'edificacoes-ufrj.json')
SAI = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'src', 'edificacoes.json')
PLANTA = os.path.join(ROOT, 'mapa-campus-claro.svg')

# mesma conversão do app (GEO0 em src/js/10-localizacao-tema-admins.js)
g = re.search(r'var GEO0=\{([^}]*)\}', open(os.path.join(ROOT, 'src', 'js', '10-localizacao-tema-admins.js'), encoding='utf-8').read()).group(1)
G = {k: float(v) for k, v in re.findall(r'(\w+):([-\d.]+)', g)}
KX = 111320 * math.cos(G['lat0'] * math.pi / 180)
def ll2map(lng, lat):
  e, n = (lng - G['lng0']) * KX, (lat - G['lat0']) * 110574
  return (G['a'] * e - G['b'] * n + G['tx'], -G['b'] * e - G['a'] * n + G['ty'])

# ---------- leitura (GeoJSON exportado ou o mapa do ArcGIS como baixado) ----------
def merc2ll(x, y): return (x / 6378137 * 180 / math.pi, math.atan(math.exp(y / 6378137)) * 360 / math.pi - 90)
def ler(p):
  d = json.load(open(p, encoding='utf-8'))
  if 'operationalLayers' not in d:
    return d['edificacoes']['features'], d['lotes']['features']
  def camada(nome):
    l = next(l for l in d['operationalLayers'] if l['title'] == nome or l['title'].startswith(nome))
    out = []
    for f in l['featureCollection']['layers'][0]['featureSet']['features']:
      geo = f.get('geometry') or {}
      props = {k: (v.strip() if isinstance(v, str) else v) for k, v in f['attributes'].items() if v is not None and str(v).strip()}
      out.append({'properties': props, 'geometry': {'type': 'Polygon', 'coordinates': [[merc2ll(*q[:2]) for q in r] for r in geo['rings']]} if geo.get('rings') else None})
    return out
  return camada('CENTROS'), camada('UNIDADES')
edif, lotes = ler(ENT)
LOTE = {f['properties'].get('CODIGO'): f['properties'].get('NOME') for f in lotes if f['properties'].get('NOME')}

# nomes para quem usa (o cadastro usa siglas, caixa alta e "CESSÃO" para áreas cedidas)
NOMES = {
  'CUF-CES-13': 'CENPES II (Petrobras)', 'CUF-CES-15': 'CENPES (Petrobras)', 'CUF-CES-14': 'CEPEL',
  'CUF-CES-20': 'IEN (Instituto de Engenharia Nuclear)', 'CUF-CES-21': 'CETEM', 'CUF-CES-24': 'Embratel',
  'CUF-CES-01': 'Subestação da Light', 'CUF-CES-04': 'CEDAE', 'CUF-CES-05': 'Corpo de Bombeiros',
  'CUF-CT-01': 'Centro de Tecnologia (CT)', 'CUF-CT-04': 'Anexo da COPPE (bloco M)', 'CUF-CT-07': 'Instituto Virtual de Mudanças Globais',
  'CUF-CT-05': 'Manutenção da COPPE (bloco N)', 'CUF-CT-09': 'CT 2', 'CUF-CCS-01': 'CCS', 'CUF-CT-17': 'LabOceano', 'CUF-CT-18': 'Instituto de Macromoléculas (anexo)', 'CUF-CT-19': 'Núcleo de Estruturas Oceânicas',
  'CUF-CLA-02': 'Faculdade de Letras', 'CUF-CCMN-04': 'Polo de Xistoquímica', 'CUF-CCMN-05': 'Estação Meteorológica',
  'CUF-CCS-06': 'Centro de Pesquisa em Medicina Regenerativa', 'CUF-CCS-07': 'CENIMP',
  'CUF-REIT-05': 'Horto', 'CUF-REIT-07': 'Alojamento Estudantil', 'CUF-REIT-08': 'DIPRO',
}
def nome(p):
  c = p.get('CODIGO', '')
  if c in NOMES: return NOMES[c]
  if c.startswith('CUF-CES-') and LOTE.get(c) == 'Parque Tecnologico': return 'Parque Tecnológico'
  n = p.get('NOME', '')
  return '' if n in ('', 'CESSÃO') else n.capitalize()

# ---------- a planta atual, rasterizada (4 px por unidade do mapa) ----------
S, X0, Y0, W, H = 4, 109, -45, 1233, 701
svg = open(PLANTA, encoding='utf-8').read()
fill = Image.new('1', (W * S, H * S), 0); trac = Image.new('1', (W * S, H * S), 0)
df, dt = ImageDraw.Draw(fill), ImageDraw.Draw(trac)
px = lambda x, y: ((x - X0) * S, (y - Y0) * S)
def subpaths(d):
  for parte in re.split(r'M', d)[1:]:
    v = [float(t) for t in re.findall(r'-?\d+(?:\.\d+)?', parte)]
    yield [px(v[i], v[i + 1]) for i in range(0, len(v) - 1, 2)]
for attrs, d in re.findall(r'<path ([^>]*?) d="([^"]*)"', svg):
  if 'fill="#c4cdd7"' in attrs:
    for p in subpaths(d):
      if len(p) > 2: df.polygon(p, fill=1)
  elif 'fill="none"' in attrs:
    for p in subpaths(d):
      if len(p) > 1: dt.line(p, fill=1, width=2)
F, T = fill.load(), trac.load()
def tinta(ix, iy): return 0 <= ix < W * S and 0 <= iy < H * S and (F[ix, iy] or T[ix, iy])
def perto(x, y, r=1.5):
  cx, cy = round((x - X0) * S), round((y - Y0) * S); R = round(r * S)
  return any(tinta(cx + dx, cy + dy) for dx in range(-R, R + 1, 2) for dy in range(-R, R + 1, 2))
def dentro(P, x, y):
  o = False; j = len(P) - 1
  for i in range(len(P)):
    (ax, ay), (bx, by) = P[i], P[j]
    if (ay > y) != (by > y) and x < (bx - ax) * (y - ay) / (by - ay) + ax: o = not o
    j = i
  return o

def simplifica(P, t=0.25):  # Douglas–Peucker num anel fechado
  def dp(Q):
    if len(Q) < 3: return Q
    (ax, ay), (bx, by) = Q[0], Q[-1]; L = math.hypot(bx - ax, by - ay) or 1e-9
    i, m = max(((i, abs((bx - ax) * (ay - Q[i][1]) - (ax - Q[i][0]) * (by - ay)) / L) for i in range(1, len(Q) - 1)), key=lambda t: t[1])
    return dp(Q[:i + 1])[:-1] + dp(Q[i:]) if m > t else [Q[0], Q[-1]]
  if len(P) < 4: return P
  f = max(range(len(P)), key=lambda i: math.hypot(P[i][0] - P[0][0], P[i][1] - P[0][1]))
  return dp(P[:f + 1])[:-1] + dp(P[f:] + [P[0]])[:-1]

faltam, n_total = [], 0
for f in edif:
  if not f['geometry']: continue
  n_total += 1
  aneis = [simplifica([ll2map(*q[:2]) for q in r]) for r in f['geometry']['coordinates']]
  aneis = [a for a in aneis if len(a) >= 3]
  if not aneis: continue
  borda = acerto = 0
  for A in aneis:
    for i in range(len(A)):
      (ax, ay), (bx, by) = A[i], A[(i + 1) % len(A)]
      k = max(1, math.ceil(math.hypot(bx - ax, by - ay) / 0.75))
      for j in range(k):
        borda += 1; acerto += perto(ax + (bx - ax) * j / k, ay + (by - ay) * j / k)
  A = aneis[0]; xs, ys = [p[0] for p in A], [p[1] for p in A]
  n = cheio = 0; y = min(ys)
  while y <= max(ys):
    x = min(xs)
    while x <= max(xs):
      if dentro(A, x, y):
        n += 1; ix, iy = round((x - X0) * S), round((y - Y0) * S); cheio += 0 <= ix < W * S and 0 <= iy < H * S and F[ix, iy]
      x += 0.25
    y += 0.25
  if acerto / borda < 0.35 and (not n or cheio / n < 0.15):
    faltam.append((f['properties'].get('CODIGO', ''), nome(f['properties']), aneis))

def fmt(v): return ('%.1f' % v).rstrip('0').rstrip('.')
def centro(cod):
  P = [p for c, _, aneis in faltam if c == cod for p in aneis[0]]
  return [round(sum(p[0] for p in P) / len(P), 1), round(sum(p[1] for p in P) / len(P), 1)]
# nomes novos no zoom: [texto, x, y, nível] (nível 1 aparece primeiro; 3 só bem de perto), como BLDN em src/js/03-mapa.js
ROTULOS = [('CENPES II (Petrobras)', 'CUF-CES-13', 2), ('Centro de Tecnologia', 'CUF-CT-01', 2), ('IEN (Engenharia Nuclear)', 'CUF-CES-20', 2),
           ('LabOceano', 'CUF-CT-17', 3), ('Estação Meteorológica', 'CUF-CCMN-05', 3), ('Embratel', 'CUF-CES-24', 3)]
saida = {
  'fonte': 'UFRJ, cadastro de edificações da Cidade Universitária (ArcGIS Online)',
  'item': '7c0652800dcc498e8b9d2754aa962f8c',
  'predios': [[n, ' '.join('M' + ' '.join(fmt(v) for p in A for v in p) + 'Z' for A in aneis)] for c, n, aneis in faltam],
  'rotulos': [[t] + centro(c) + [lv] for t, c, lv in ROTULOS],
}
json.dump(saida, open(SAI, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('%d prédios no cadastro, %d faltavam na planta → %s (%d KB)' % (n_total, len(faltam), os.path.relpath(SAI, ROOT), os.path.getsize(SAI) // 1024))
