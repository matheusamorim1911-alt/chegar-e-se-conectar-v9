# Peças comuns das ferramentas de previsão dos ônibus (tools/redutores.py, tools/perfil_trechos.py):
# traçados e pontos das linhas como no app, semáforos e lombadas, leitura do GPS da prefeitura, encaixe no traçado
# e a conta da previsão (a mesma de lvDist em src/js/22-onibus-ao-vivo.js; conferida por tests/teste-previsao.js).
import csv, gzip, json, math, os, re, collections
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTES = os.path.join(ROOT, 'tools', 'dados', 'redutores-fontes.json')
EXT = json.load(open(os.path.join(ROOT, 'src', 'ext_onibus.json'), encoding='utf-8'))
LAT0 = -22.86; KX = 111320 * math.cos(math.radians(LAT0)); KY = 110574
def xy(la, lo): return ((lo + 43.23) * KX, (la - LAT0) * KY)  # metros, norte para cima

# ---------- posições (UFRJ + OpenStreetMap, sem repetir o mesmo ponto) ----------
F = json.load(open(FONTES, encoding='utf-8'))
ev = []
for f in F['semaforos'][0]['f']: ev.append(('s', f['g'][1], f['g'][0]))
for L in F['lombadas']:
  for f in L['f']:
    g = f['g']
    if isinstance(g[0], list): R = g[0]; ev.append(('l', sum(p[1] for p in R) / len(R), sum(p[0] for p in R) / len(R)))
    else: ev.append(('l', g[1], g[0]))
for e in F['osm']['elements']:
  t = e['tags']
  if t.get('highway') == 'traffic_signals' or t.get('crossing') == 'traffic_signals': ev.append(('s', e['lat'], e['lon']))
  elif t.get('traffic_calming') in ('bump', 'hump', 'table', 'cushion', 'yes'): ev.append(('l', e['lat'], e['lon']))
RED = []
for k, la, lo in ev:
  p = xy(la, lo)
  if any(r[0] == k and math.hypot(r[3][0] - p[0], r[3][1] - p[1]) < (25 if k == 's' else 12) for r in RED): continue
  RED.append((k, round(la, 6), round(lo, 6), p))

# ---------- traçados e pontos das linhas, como no app ----------
SH = []
for d in EXT['shp']:
  a, o, P = -2280000, -4320000, []
  for i in range(0, len(d), 2): a += d[i]; o += d[i + 1]; P.append(xy(a / 1e5, o / 1e5))
  c = [0]
  for i in range(1, len(P)): c.append(c[-1] + math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]))
  SH.append({'P': P, 'c': c})
def proj(S, p):
  best = None
  for j in range(1, len(S['P'])):
    a, b = S['P'][j - 1], S['P'][j]; dx, dy = b[0] - a[0], b[1] - a[1]; L2 = dx * dx + dy * dy or 1e-9
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)); d = math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
    if best is None or d < best[0]: best = (d, S['c'][j - 1] + t * math.sqrt(L2), math.degrees(math.atan2(dx, dy)) % 360)
  return best
for k, S in enumerate(SH):
  S['st'] = sorted(r[1] for r in (proj(S, xy(*q)) for q in EXT['shs'].get(str(k), [])) if r[0] <= 25)
  S['ev'] = sorted((r[1], t) for t, la, lo, p in RED for r in [proj(S, p)] if r[0] <= (20 if t == 's' else 15))

# ---------- previsão: o mesmo que lvDist no app, com semáforos e lombadas opcionais ----------
PONTO_S, PONTO_IGNORA, EV_IGNORA = 12, 25, 10
def dist(S, s, sign, v, dt, ps=0, pl=0):
  """metros andados em dt s a v m/s a partir de s (sentido sign): para PONTO_S s no próximo ponto e, se ps/pl > 0,
  perde ps s em cada semáforo e pl s em cada lombada pelo caminho."""
  if v <= 0 or dt <= 0: return 0
  evs = [(x, 'p') for x in S['st']] + ([(x, t) for x, t in S['ev'] if (t == 's' and ps) or (t == 'l' and pl)])
  ahead = sorted(((x - s) * sign, t) for x, t in evs if (x - s) * sign > (PONTO_IGNORA if t == 'p' else EV_IGNORA))
  andou, tempo, ponto_feito = 0, dt, False
  for n, t in ahead:
    if t == 'p' and ponto_feito: continue  # como no app: só o próximo ponto
    falta = n - andou
    if falta > v * tempo: break
    tempo -= falta / v; andou = n
    perda = PONTO_S if t == 'p' else ps if t == 's' else pl
    if t == 'p': ponto_feito = True
    if perda >= tempo: return andou
    tempo -= perda
  return andou + v * tempo

# ---------- leitura do GPS e pares de posições, encaixados como no app ----------
def ler_gps(caminhos):
  campos = {'id': ('id_veiculo', 'ordem'), 'l': ('servico', 'linha'), 'la': ('latitude',), 'lo': ('longitude',),
            'v': ('velocidade', 'velocidade_instantanea'), 'dir': ('direcao',), 't': ('datetime', 'datetime_gps', 'timestamp_gps', 'datahora')}
  out = []
  for c in caminhos:
    for r in csv.DictReader(gzip.open(c, 'rt', encoding='utf-8') if c.endswith('.gz') else open(c, encoding='utf-8')):
      g = {k: next((r[n] for n in ns if n in r and r[n] != ''), None) for k, ns in campos.items()}
      if None in (g['id'], g['l'], g['la'], g['lo'], g['t']): continue
      out.append((g['id'], g['l'], float(g['la']), float(g['lo']), float(g['v'] or 0), float(g['dir'] or 0),
                  datetime.fromisoformat(g['t'].replace('Z', '').replace(' UTC', '')[:19]).timestamp()))
  return out
PARADOS = []  # (traçado, posição, veículo) de cada posição com o ônibus parado
def pares(gps):
  V = collections.defaultdict(list)
  for o in gps:
    if o[1] in EXT['sh']: V[o[0]].append(o)
  res = []
  for L in V.values():
    L.sort(key=lambda o: o[6]); P = None
    for o in L:
      if P and o[6] == P['t']: continue
      p = xy(o[2], o[3]); dt = o[6] - P['t'] if P else 0; comp = o[5] if o[4] > 2 else None; best = None
      for i in EXT['sh'][o[1]]:
        S = SH[i]
        for j in range(1, len(S['P'])):
          a, b = S['P'][j - 1], S['P'][j]; dx, dy = b[0] - a[0], b[1] - a[1]; L2 = dx * dx + dy * dy or 1e-9
          t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)); d = math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
          if d > 120: continue
          s = S['c'][j - 1] + t * math.sqrt(L2); ang = math.degrees(math.atan2(dx, dy)) % 360; pen = 0
          if comp is not None and abs((ang - comp + 540) % 360 - 180) > 100: pen += 40
          if P and dt > 0:
            if P['i'] != i: pen += 20
            else:
              ds = (s - P['s']) * P['sign']
              if ds < -40 or ds > 25 * dt + 80: pen += 60
          if best is None or d + pen < best[0]: best = (d + pen, i, s, ang)
      if not best: P = None; continue
      i, s, ang = best[1], best[2], best[3]
      if P and P['i'] == i and o[4] <= 2: sign = P['sign']  # parado: mantém o sentido (como lvSign no app)
      elif P and P['i'] == i and abs(s - P['s']) > 5: sign = 1 if s > P['s'] else -1
      elif comp is not None: sign = -1 if abs((ang - comp + 540) % 360 - 180) > 90 else 1
      else: sign = P['sign'] if P else 1
      O = {'t': o[6], 'i': i, 's': s, 'sign': sign, 'v': min(70, o[4]) / 3.6}
      if o[4] < 2 and best[0] <= 30: PARADOS.append((i, s, o[0]))
      if P and P['i'] == i and 5 <= dt <= 120 and P['v'] >= 0.6:
        real = (s - P['s']) * P['sign']
        if abs(real) <= 25 * dt + 60:
          h = min(dt, 60); res.append({'t': P['t'], 'S': SH[i], 'Si': i, 's': P['s'], 'sign': P['sign'], 'v': P['v'], 'h': h, 'real': real * h / dt, 'veh': o[0]})
      P = O
  return res


# ---------- tipo de dia e período, como no app (FERIADOS em src/js/06-calendario-e-lugares.js) ----------
FERIADOS = set(re.findall(r"\['(\d{4}-\d{2}-\d{2})'", re.search(r'var FERIADOS=\[(.*?)\];', open(os.path.join(ROOT, 'src', 'js', '06-calendario-e-lugares.js'), encoding='utf-8').read()).group(1)))
def dia_util(t):
  d = datetime.fromtimestamp(t); return d.weekday() < 5 and d.strftime('%Y-%m-%d') not in FERIADOS
def periodo(t):
  h = datetime.fromtimestamp(t).hour; return 'manha' if 5 <= h < 12 else 'tarde' if 12 <= h < 18 else 'noite'
