# Refaz as imagens da planta (mapa-campus, mapa-bordas, mapa-mini e mapa-blur, temas escuro e claro) com os prédios
# do cadastro da UFRJ (src/edificacoes.json, gerado por tools/edificacoes_ufrj.py): os que faltavam e os redesenhados.
# Essas imagens aparecem na capa, no fundo do login, no fundo do app e na visão geral do mapa; no zoom o app usa o
# SVG da planta com os mesmos prédios desenhados por cima (src/js/26-predios-ufrj.js).
#
# Parte sempre das imagens originais, guardadas em tools/dados/planta/, então pode rodar quantas vezes quiser.
# Uso, na raiz do repositório:  python3 tools/planta_imagens.py
import json, os, re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(ROOT, 'tools', 'dados', 'planta')
EDIF = json.load(open(os.path.join(ROOT, 'src', 'edificacoes.json'), encoding='utf-8'))

# cores da planta (as mesmas de src/css/12-predios-ufrj.css): chão, prédio e contorno
CORES = {'': ('#12161c', '#4d5967', '#6f7b89'), '-claro': ('#f4f6f8', '#c4cdd7', '#96a2af')}
# área de cada imagem em unidades do mapa (x, y, largura, altura)
CAMPUS, BORDAS = (109, -45, 1233, 701), (-270, -340, 2034, 1300)
SS = 4  # desenha em 4x e reduz, para as bordas ficarem suaves

def aneis(d):
  out = []
  for parte in re.findall(r'M([^MZ]*)Z', d):
    v = [float(t) for t in parte.split()]
    out.append([(v[i], v[i + 1]) for i in range(0, len(v) - 1, 2)])
  return out
def dentro(P, x, y):
  o = False; j = len(P) - 1
  for i in range(len(P)):
    (ax, ay), (bx, by) = P[i], P[j]
    if (ay > y) != (by > y) and x < (bx - ax) * (y - ay) / (by - ay) + ax: o = not o
    j = i
  return o
FUNDO = aneis(EDIF.get('apagar', ''))
PREDIOS = [aneis(p[1]) for p in EDIF['predios']]

def mascaras(area, tam):
  """Máscaras (tons de cinza) do chão a cobrir, dos prédios e dos contornos, no tamanho da imagem."""
  x0, y0, w, h = area; k = tam[0] / w * SS
  big = (tam[0] * SS, tam[1] * SS)
  pt = lambda p: ((p[0] - x0) * k, (p[1] - y0) * k)
  chao, cheio, borda = (Image.new('L', big, 0) for _ in range(3))
  dc, dp, db = ImageDraw.Draw(chao), ImageDraw.Draw(cheio), ImageDraw.Draw(borda)
  for A in FUNDO:
    q = [pt(p) for p in A]; dc.polygon(q, fill=255); dc.line(q + [q[0]], fill=255, width=max(1, round(2.4 * k)), joint='curve')
  for R in PREDIOS:
    for i, A in enumerate(R):  # anéis de dentro de um prédio são pátios: ficam vazios
      buraco = i > 0 and dentro(R[0], *A[0])
      dp.polygon([pt(p) for p in A], fill=0 if buraco else 255)
  for R in PREDIOS:
    for A in R:
      q = [pt(p) for p in A]; db.line(q + [q[0]], fill=255, width=max(1, round(0.45 * k)), joint='curve')
  return [m.resize(tam, Image.LANCZOS) for m in (chao, cheio, borda)]

def aplica(img, area, suf):
  img = img.convert('RGB')
  for cor, m in zip(CORES[suf], mascaras(area, img.size)):
    img.paste(Image.new('RGB', img.size, cor), (0, 0), m)
  return img

for suf in CORES:
  ler = lambda n: Image.open(os.path.join(ORIG, 'mapa-%s%s.jpg' % (n, suf)))
  def salva(img, n, q):
    img.save(os.path.join(ROOT, 'mapa-%s%s.jpg' % (n, suf)), quality=q, optimize=True)
    # WebP (cerca de metade do tamanho, mesma aparência): o app usa quando o navegador mostra WebP
    img.save(os.path.join(ROOT, 'mapa-%s%s.webp' % (n, suf)), 'WEBP', quality=q, method=6)
  salva(aplica(ler('campus'), CAMPUS, suf), 'campus', 80)
  salva(aplica(ler('bordas'), BORDAS, suf), 'bordas', 80)
  mini0 = ler('mini').convert('RGB'); mini = aplica(mini0, CAMPUS, suf); salva(mini, 'mini', 80)
  # o fundo desfocado recebe só a diferença, desfocada do mesmo jeito (raio 6), para manter o tom original
  bl = lambda im: im.filter(ImageFilter.GaussianBlur(6))
  a = lambda im: np.asarray(im, dtype=np.int16)
  blur = np.clip(a(ler('blur').convert('RGB')) + a(bl(mini)) - a(bl(mini0)), 0, 255).astype(np.uint8)
  salva(Image.fromarray(blur), 'blur', 60)
print('imagens da planta refeitas com %d prédios do cadastro' % len(PREDIOS))
