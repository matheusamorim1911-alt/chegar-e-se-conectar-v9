# Ícone do app: pin laranja com a silhueta da Ilha do Fundão e um ponto no CT.
#
#   python3 tools/icones.py    → refaz icone.svg e os PNG (icon-192, icon-512, icon-maskable-512, apple-touch-icon,
#                                favicon-32) na raiz do site
#
# A silhueta vem do litoral da Ilha do Fundão no OpenStreetMap (© colaboradores do OpenStreetMap, ODbL), da cópia em
# tools/dados/osm-ruas-fundao.json.gz. Os PNG são desenhados pelo Chromium do Playwright a partir do SVG.
import gzip, json, math, os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUNDO, BRANCO, PONTO = '#0E1A24', '#F4F7FA', '#FFB070'
CT = (-22.8584, -43.2302)  # Centro de Tecnologia

D = json.load(gzip.open(os.path.join(ROOT, 'tools', 'dados', 'osm-ruas-fundao.json.gz'), 'rt', encoding='utf-8'))
w = next(x for x in D['caminhos'] if x[1] == 'coast' and x[2] == 'Ilha do Fundão')
LL = [(w[3][k] / 1e5, w[3][k + 1] / 1e5) for k in range(0, len(w[3]), 2)]
kx = math.cos(math.radians(sum(p[0] for p in LL) / len(LL)))
def xy(la, lo): return (lo * kx, -la)
Q = [xy(*p) for p in LL]
def dp(P, t):
  if len(P) < 3: return P
  a, b = P[0], P[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1e-12
  i, d = max(((k, abs(dy * (P[k][0] - a[0]) - dx * (P[k][1] - a[1])) / L) for k in range(1, len(P) - 1)), key=lambda x: x[1])
  return dp(P[:i + 1], t)[:-1] + dp(P[i:], t) if d > t else [a, b]
x0, x1 = min(q[0] for q in Q), max(q[0] for q in Q); y0, y1 = min(q[1] for q in Q), max(q[1] for q in Q)
esc = 1 / max(x1 - x0, y1 - y0)
def norm(q): return ((q[0] - x0) * esc, (q[1] - y0) * esc)
R = [norm(q) for q in Q]; h = len(R) // 2
ILHA = dp(R[:h + 1], 0.0025)[:-1] + dp(R[h:], 0.0025)
LARG, ALT = (x1 - x0) * esc, (y1 - y0) * esc
CTN = norm(xy(*CT))

PIN = 'M256 476C214 410 112 330 112 214A144 144 0 1 1 400 214C400 330 298 410 256 476Z'
GRAD = '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFA463"/><stop offset="1" stop-color="#EE5F22"/></linearGradient>'
def miolo(tam=158, cx=256, cy=214):
  ox, oy = cx - LARG * tam / 2, cy - ALT * tam / 2
  pts = ' '.join('%.1f,%.1f' % (ox + x * tam, oy + y * tam) for x, y in ILHA)
  px, py = ox + CTN[0] * tam, oy + CTN[1] * tam
  return ('<path d="%s" fill="url(#g)"/><circle cx="%d" cy="%d" r="106" fill="%s"/><polygon points="%s" fill="%s"/>'
          '<circle cx="%.1f" cy="%.1f" r="12" fill="%s" stroke="%s" stroke-width="5"/>') % (PIN, cx, cy, FUNDO, pts, BRANCO, px, py, PONTO, FUNDO)
def svg(fundo, corpo, escala=1):
  t = '' if escala == 1 else ' transform="translate(256 256) scale(%s) translate(-256 -256)"' % escala
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>%s</defs>%s<g%s>%s</g></svg>' % (GRAD, fundo, t, corpo)
REDONDO = '<rect width="512" height="512" rx="114" fill="%s"/>' % FUNDO
CHEIO = '<rect width="512" height="512" fill="%s"/>' % FUNDO
# no favicon (32 px) a ilha não aparece: só o pin com o miolo escuro e o ponto
PEQ = '<path d="%s" fill="url(#g)"/><circle cx="256" cy="214" r="78" fill="%s"/><circle cx="256" cy="214" r="34" fill="%s"/>' % (PIN, FUNDO, BRANCO)

icone = svg(REDONDO, miolo())
open(os.path.join(ROOT, 'icone.svg'), 'w', encoding='utf-8').write(icone)
saidas = [('icon-512.png', 512, icone, True), ('icon-192.png', 192, icone, True),
          ('icon-maskable-512.png', 512, svg(CHEIO, miolo(), 0.8), False),  # área segura: 80% do centro
          ('apple-touch-icon.png', 180, svg(CHEIO, miolo(), 0.92), False),
          ('favicon-32.png', 32, svg('', PEQ, 1.08), True)]
with sync_playwright() as p:
  b = p.chromium.launch(); pg = b.new_page()
  for nome, tam, s, transp in saidas:
    pg.set_viewport_size({'width': tam, 'height': tam})
    pg.set_content('<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;utf8,%s" width="%d" height="%d" style="display:block"></body></html>' % (s.replace('#', '%23').replace('"', "'"), tam, tam))
    pg.wait_for_timeout(100)
    pg.screenshot(path=os.path.join(ROOT, nome), omit_background=transp)
    print(nome, tam)
  b.close()
