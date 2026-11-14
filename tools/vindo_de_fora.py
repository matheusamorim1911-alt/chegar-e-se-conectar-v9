# Gera vindo-de-fora.json (raiz do site): as viagens dos ônibus e BRT da prefeitura do Rio que passam por um ponto da
# Ilha do Fundão, com todos os pontos da viagem (dentro e fora da ilha) e os horários programados. O app usa para
# "De casa até a UFRJ": ida (de um ponto da cidade até a ilha, e daí a linha interna) e volta (da ilha até perto de casa).
# Uso: python3 tools/vindo_de_fora.py <pasta do GTFS descompactado> vindo-de-fora.json [tools/dados/gps-*.csv.gz]
#
# O GTFS da prefeitura do Rio só tem frequências, não horas de verdade (tools/conferir_horarios.py mostrou que
# quem chega ao ponto na "hora" do GTFS chega ~17 min atrasado). Com o GPS, grava também a espera medida nos pontos
# e a folga no tempo de viagem (campos e, r2, k, fx; ver modelo() em tools/conferir_horarios.py), que o app usa.
#
# Formato (números pequenos para o arquivo ficar leve):
#   p: pontos [nome, lat*1e5, lon*1e5, 1 se é da ilha]
#   r: viagens-tipo {n: linha, d: destino, c: cor, b: 1 se BRT, s: [ponto, minutos desde a saída, ponto, minutos, …],
#      t: {U|S|D: [saídas em minutos do dia]} (U dias úteis, S sábado, D domingo e feriado), f: 1 se o horário é
#      só a frequência (a cada x min, sem hora exata)}
import csv, collections, json, sys, re
D, OUT, GPS = sys.argv[1], sys.argv[2], sys.argv[3:]
rd = lambda f: csv.DictReader(open(D + '/' + f, encoding='utf-8'))
S = {r['stop_id']: r for r in rd('stops.txt')}
ilha = {k for k, v in S.items() if k.startswith('3105') or v['parent_station'].startswith('3105')}  # 3105 = Cidade Universitária
T = {r['trip_id']: r for r in rd('trips.txt')}
R = {r['route_id']: r for r in rd('routes.txt')}
SV = {r['service_id']: ('U' if r['monday'] == '1' else 'S' if r['saturday'] == '1' else 'D') for r in rd('calendar.txt')}
F = collections.defaultdict(list)
for r in rd('frequencies.txt'): F[r['trip_id']].append(r)
def m(s): h, mi, se = map(int, s.split(':')); return h * 60 + mi + se / 60
seq = collections.defaultdict(list)
with open(D + '/stop_times.txt', encoding='utf-8') as f:
  r = csv.reader(f); next(r)
  for t, sq, st, arr, dep, *_ in r: seq[t].append((int(sq), st, m(arr or dep), m(dep or arr)))
def nome(st):
  n = S[st]['stop_name'].split(' :: ')[0].strip()
  return re.sub(r'\s+', ' ', n)
pontos, pidx = [], {}
def pid(st):
  if st not in pidx:
    pidx[st] = len(pontos)
    s = S[st]; pontos.append([nome(st), round(float(s['stop_lat']) * 1e5), round(float(s['stop_lon']) * 1e5)] + ([1] if st in ilha else []))
  return pidx[st]
tipos = {}
for t, L in seq.items():
  if not any(x[1] in ilha for x in L): continue
  tr = T[t]; rt = R[tr['route_id']]; L.sort()
  base = L[0][3]; s = []
  for _, st, arr, dep in L: s += [pid(st), round(arr - base)]
  key = (rt['route_short_name'], tr['trip_headsign'], tuple(s))
  o = tipos.setdefault(key, {'n': rt['route_short_name'], 'd': tr['trip_headsign'], 'c': ('#' + rt['route_color']) if rt['route_color'] else '',
                             'b': 1 if rt['route_type'] == '702' else 0, 's': s, 't': collections.defaultdict(set), 'f': 0})
  dia = SV.get(tr['service_id'], 'U')
  if t in F:
    o['f'] = 1
    for fr in F[t]:
      a, b, h = m(fr['start_time']), m(fr['end_time']), int(fr['headway_secs']) / 60
      x = a
      while x < b - 0.01: o['t'][dia].add(round(x)); x += h
  else: o['t'][dia].add(round(base))
saida = []
for o in tipos.values():
  o['t'] = {k: sorted(v) for k, v in o['t'].items() if v}
  if not o['t']: continue
  if not o['c']: del o['c']
  if not o['b']: del o['b']
  if not o['f']: del o['f']
  saida.append(o)
saida.sort(key=lambda o: (o['n'], o['d']))
with open(D + '/feed_info.txt', encoding='utf-8') as f: fi = next(csv.DictReader(f))
res = {'fonte': 'SMTR / prefeitura do Rio (GTFS, CC BY 4.0)', 'ate': fi.get('feed_end_date', ''), 'p': pontos, 'r': saida}
if GPS:
  import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
  import conferir_horarios as C
  G = C.carregar(res, GPS); M = C.modelo(G, G['dias'])
  res.update({'e': M['e'], 'r2': M['r'], 'k': M['k'], 'fx': M['faixas'], 'gps': G['dias'][0] + '/' + G['dias'][-1]})
  print('espera medida em', len(M['e']), 'linhas; GPS de', res['gps'])
json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(pontos), 'pontos,', len(saida), 'viagens-tipo,', sum(1 for p in pontos if len(p) > 3), 'na ilha')
