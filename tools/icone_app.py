# Ícone do app: um pin laranja com a Ilha do Fundão (litoral do OpenStreetMap, © colaboradores do OpenStreetMap, ODbL)
# e um ponto no Centro de Tecnologia. Gera icone.svg e os PNGs usados pelo site e pelo app instalado.
#
#   pip install cairosvg   (uma vez)
#   python3 tools/icone_app.py
#
# Arquivos (raiz do site): icone.svg, icon-512.png, icon-192.png, icon-maskable-512.png (fundo cheio, desenho na
# área segura de 80%), apple-touch-icon.png (180, sem transparência) e favicon-32.png.
import gzip, json, math, os
import cairosvg
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(gzip.open(os.path.join(ROOT, 'tools', 'dados', 'osm-ruas-fundao.json.gz'), 'rt', encoding='utf-8'))
ilha = next(w for w in D['caminhos'] if w[1] == 'coast' and w[2] == 'Ilha do Fundão')[3]
LAT0 = -22.853; KX = math.cos(math.radians(LAT0))
P = [(ilha[k + 1] / 1e5 * KX, -ilha[k] / 1e5) for k in range(0, len(ilha), 2)]

def dp(Q, tol):
  if len(Q) < 3: return Q
  a, b = Q[0], Q[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1e-12
  i, d = max(((k, abs(dy * (Q[k][0] - a[0]) - dx * (Q[k][1] - a[1])) / L) for k in range(1, len(Q) - 1)), key=lambda x: x[1])
  return dp(Q[:i + 1], tol)[:-1] + dp(Q[i:], tol) if d > tol else [a, b]

x0, x1 = min(p[0] for p in P), max(p[0] for p in P); y0, y1 = min(p[1] for p in P), max(p[1] for p in P)
esc = 1 / max(x1 - x0, y1 - y0)
def norm(p): return ((p[0] - x0) * esc - (x1 - x0) * esc / 2, (p[1] - y0) * esc - (y1 - y0) * esc / 2)  # centrado, lado maior = 1
N = [norm(p) for p in P]; h = len(N) // 2
N = dp(N[:h + 1], 0.0018)[:-1] + dp(N[h:], 0.0018)
CT = norm((-43.2318 * KX, 22.8586))  # Centro de Tecnologia

PIN = 'M256 478C213 411 108 331 108 212A148 148 0 1 1 404 212C404 331 299 411 256 478Z'
def desenho(tam=196, cx=256, cy=212):
  pts = ' '.join('%.1f,%.1f' % (cx + x * tam, cy + y * tam) for x, y in N)
  return ('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFA463"/>'
          '<stop offset="1" stop-color="#EE5F22"/></linearGradient></defs>'
          '<path d="%s" fill="url(#g)"/><circle cx="%d" cy="%d" r="116" fill="#0B1117"/>'
          '<polygon points="%s" fill="#F4F7FA" stroke="#F4F7FA" stroke-width="3" stroke-linejoin="round"/>'
          '<circle cx="%.1f" cy="%.1f" r="15" fill="#FF9F5A" stroke="#0B1117" stroke-width="6"/>') % (PIN, cx, cy, pts, cx + CT[0] * tam, cy + CT[1] * tam)
def svg(fundo, escala=1.0):
  t = 'translate(%.1f %.1f) scale(%.3f)' % (256 * (1 - escala), 256 * (1 - escala), escala)
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">%s<g transform="%s">%s</g></svg>' % (fundo, t, desenho())
ARREDONDADO = '<rect width="512" height="512" rx="114" fill="#0B1117"/>'
CHEIO = '<rect width="512" height="512" fill="#0B1117"/>'
saidas = {
  'icone.svg': (svg(ARREDONDADO), None),
  'icon-512.png': (svg(ARREDONDADO), 512), 'icon-192.png': (svg(ARREDONDADO), 192),
  'icon-maskable-512.png': (svg(CHEIO, 0.8), 512),
  'apple-touch-icon.png': (svg(CHEIO, 0.92), 180),
  'favicon-32.png': (svg('', 1.12), 32),
}
for nome, (s, px) in saidas.items():
  arq = os.path.join(ROOT, nome)
  if px is None: open(arq, 'w', encoding='utf-8').write(s)
  else: cairosvg.svg2png(bytestring=s.encode(), write_to=arq, output_width=px, output_height=px)
  print(nome, os.path.getsize(arq), 'bytes')
