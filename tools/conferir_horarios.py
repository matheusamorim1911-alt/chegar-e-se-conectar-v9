# Confere os horários dos ônibus da cidade em vindo-de-fora.json com o GPS de verdade (CSV da prefeitura do Rio, o
# mesmo de tools/perfil_trechos.py; só a área do Worker em volta do Fundão) e mede a espera real nos pontos.
#
# Uso: python3 tools/conferir_horarios.py vindo-de-fora.json tools/dados/gps-*.csv.gz [--sabado | --domingo]
# Mais GPS (com sábados, domingos e BRT): o ramo dados-gps, coletado por .github/workflows/coletar-gps.yml.
#
# O que se descobriu (nov/2026): o GTFS da prefeitura do Rio só tem frequências ("a cada x min"), não horas de
# verdade. O tempo de viagem entre dois pontos bate com o GPS, mas quem chega ao ponto na "hora" do GTFS espera
# ~14 min e chega ~17 min depois do previsto. Por isso o app planeja com a espera medida aqui (por linha e faixa de
# horário) e uma folga no tempo de viagem; tools/vindo_de_fora.py grava esse modelo (campo "e") quando recebe o GPS.
#
# A conferência compara os dois jeitos, deixando um dia de fora de cada vez (o modelo é feito com os outros dias e
# testado no que ficou de fora), em pares de pontos dentro da área do GPS (um na ilha e outro fora, nos dois sentidos):
#  - "chegar até T": com que frequência a pessoa chega até T e quanto antes chega;
#  - "sair agora": erro da hora de chegada prevista.
import csv, gzip, json, sys, math, collections, datetime, statistics
AREA = (-22.885, -43.27, -22.825, -43.195)  # a mesma do Worker
KX, KY = 111320 * math.cos(math.radians(-22.85)), 110574
FAIXAS = [(5, 7), (7, 9), (9, 13), (13, 18), (18, 29)]  # 18–5h: noite (até 29h = 5h do dia seguinte)
Q_ESPERA, Q_VIAGEM = 0.85, 0.85  # folga: 85% das esperas e das viagens cabem nela
def faixa(m):
  h = (m / 60) % 24
  if h < 5: h += 24
  for i, (a, b) in enumerate(FAIXAS):
    if a <= h < b: return i
  return len(FAIXAS) - 1
def xy(la, lo): return lo * KX, la * KY
def q(L, p): L = sorted(L); return L[min(len(L) - 1, int(len(L) * p))] if L else None

def carregar(vf_json, arquivos, tipo='U'):
  """tipo: U (dias úteis), S (sábados) ou D (domingos)"""
  VF = vf_json
  P = [{'n': p[0], 'la': p[1] / 1e5, 'lo': p[2] / 1e5, 'il': len(p) > 3} for p in VF['p']]
  for p in P:
    p['x'], p['y'] = xy(p['la'], p['lo'])
    p['area'] = AREA[0] <= p['la'] <= AREA[2] and AREA[1] <= p['lo'] <= AREA[3]
  pts = {}
  for f in arquivos:
    op = gzip.open if f.endswith('.gz') else open
    for r in csv.DictReader(op(f, 'rt', encoding='utf-8')):
      t = r.get('datetime') or r.get('datetime_gps')
      pts[(r['id_veiculo'], t)] = (r['servico'], float(r['latitude']), float(r['longitude']))
  veic = collections.defaultdict(list); conta = collections.Counter()
  for (v, t), (l, la, lo) in pts.items():
    d = datetime.datetime.fromisoformat(t[:19])
    if {'U': d.weekday() >= 5, 'S': d.weekday() != 5, 'D': d.weekday() != 6}[tipo]: continue  # só o tipo de dia pedido
    m = d.hour * 60 + d.minute + d.second / 60
    veic[v].append((d.date().isoformat(), m, l, *xy(la, lo)))
    conta[(d.date().isoformat(), int(m // 10))] += 1
  # os arquivos vieram em pedaços e algumas horas quase vazias: só valem os trechos de 10 min com dados completos
  # (pelo menos metade das posições de um trecho típico)
  tipico = statistics.median(conta.values()) if conta else 0
  cobre = {k for k, n in conta.items() if n >= tipico / 2}
  linhas = collections.defaultdict(set)
  for R in VF['r']:
    for i in range(0, len(R['s']), 2):
      if P[R['s'][i]]['area']: linhas[R['n']].add(R['s'][i])
  # passagens: o carro passa a menos de 60 m do ponto (no segmento entre duas posições seguidas, até 3 min)
  pas = collections.defaultdict(list)
  for v, L in veic.items():
    L.sort()
    for a, b in zip(L, L[1:]):
      if a[0] != b[0] or b[1] - a[1] > 3 or a[2] != b[2]: continue
      for pi in linhas.get(a[2], ()):
        p = P[pi]; dx, dy = b[3] - a[3], b[4] - a[4]; L2 = dx * dx + dy * dy
        t = 0 if L2 < 1 else max(0, min(1, ((p['x'] - a[3]) * dx + (p['y'] - a[4]) * dy) / L2))
        if math.hypot(a[3] + t * dx - p['x'], a[4] + t * dy - p['y']) < 60: pas[a[2]].append((a[0], a[1] + t * (b[1] - a[1]), pi, v))
  # o carro parado no ponto (ou no terminal) vira uma passagem só: chegou (primeira vez perto) e saiu (última)
  porVeic = collections.defaultdict(list)
  for l in pas:
    pas[l].sort(key=lambda x: (x[3], x[2], x[0], x[1])); o = []
    for x in pas[l]:
      if o and o[-1][3] == x[3] and o[-1][2] == x[2] and o[-1][0] == x[0] and x[1] - o[-1][4] < 4: o[-1][4] = x[1]; continue
      o.append([x[0], x[1], x[2], x[3], x[1]])
    pas[l] = sorted(o, key=lambda x: (x[0], x[1]))
    for x in pas[l]: porVeic[(x[3], x[0])].append((x[1], x[2], x[4]))
  for k in porVeic: porVeic[k].sort()
  # pares de pontos (ida: o ponto fora da ilha mais longe dentro da área → o primeiro da ilha; volta: o último da ilha → o mais longe)
  pares = {}
  for R in VF['r']:
    U = R['t'].get(tipo)
    if not U: continue
    s = R['s']; idx = [(s[i], s[i + 1]) for i in range(0, len(s), 2)]
    fora = [k for k, (pi, _) in enumerate(idx) if P[pi]['area'] and not P[pi]['il']]
    ilha = [k for k, (pi, _) in enumerate(idx) if P[pi]['il']]
    if not fora or not ilha: continue
    ida = [k for k in fora if k < ilha[0]]; volta = [k for k in fora if k > ilha[-1]]
    if ida: pares.setdefault((R['n'], idx[ida[0]][0], idx[ilha[0]][0], 'ida'), []).extend((u + idx[ida[0]][1], u + idx[ilha[0]][1]) for u in U)
    if volta: pares.setdefault((R['n'], idx[ilha[-1]][0], idx[volta[-1]][0], 'volta'), []).extend((u + idx[ilha[-1]][1], u + idx[volta[-1]][1]) for u in U)
  for k in pares: pares[k] = sorted(set(pares[k]))
  dias = sorted({c[0] for c in cobre})
  # viagens de verdade de cada par, por dia: [(passou em pi, chegou em pj)]
  reais = {}
  for (l, pi, pj, sen) in pares:
    for dia in dias:
      o = []; vp = statistics.median([a - d for d, a in pares[(l, pi, pj, sen)]])
      for x in pas.get(l, []):
        if x[0] != dia or x[2] != pi: continue
        sai = x[4]  # hora em que saiu do ponto
        for t, p, _ in porVeic[(x[3], dia)]:
          if t <= sai: continue
          if t > sai + 120 or p == pi: break
          if p == pj:
            if t - sai <= max(3 * vp, vp + 20): o.append((sai, t))  # mais que isso: passou no outro sentido e deu a volta
            break
      reais[(l, pi, pj, sen, dia)] = sorted(o)
  return {'P': P, 'pares': pares, 'reais': reais, 'dias': dias, 'cobre': cobre}

def coberto(G, dia, a, b): return all((dia, k) in G['cobre'] for k in range(int(a // 10), int(b // 10) + 1))
def viagem_prog(prog, t):
  d, a = min(prog, key=lambda x: abs(x[0] - t)); return a - d
def intervalo_prog(prog, m):
  """minutos entre ônibus programados na hora em volta de m"""
  n = sum(1 for d, _ in prog if m - 30 <= d < m + 30)
  return 60 / n if n else None
def proximo(R, A, lim=90):
  for ti, tj in R:
    if ti >= A: return (ti, tj) if ti <= A + lim else None
  return None

def modelo(G, dias):
  """espera (mediana e folga) por linha e faixa, folga na viagem (razão) e o fator para linhas sem GPS"""
  esp = collections.defaultdict(list); raz = collections.defaultdict(list); interv = collections.defaultdict(list)
  for (l, pi, pj, sen), prog in G['pares'].items():
    for dia in dias:
      R = G['reais'][(l, pi, pj, sen, dia)]
      if not R: continue
      for A in range(5 * 60, 23 * 60, 2):
        if not coberto(G, dia, A, A + 90): continue
        x = proximo(R, A); f = faixa(A)
        esp[(l, f)].append(x[0] - A if x else 90)
        h = intervalo_prog(prog, A)
        if h: interv[(l, f)].append(h)
      for ti, tj in R:
        vp = viagem_prog(prog, ti)
        if vp >= 4: raz[faixa(ti)].append((tj - ti) / vp)
  e = {}; fat = []
  for (l, f), W in esp.items():
    if len(W) < 40: continue
    med, p = statistics.median(W), q(W, Q_ESPERA)
    e.setdefault(l, {})[str(f)] = [round(med, 1), round(p, 1)]
    if interv[(l, f)]: h = statistics.median(interv[(l, f)]); fat.append((med / h, p / h))
  r = {str(f): [round(statistics.median(v), 3), round(q(v, Q_VIAGEM), 3)] for f, v in raz.items() if len(v) >= 30}
  k = [round(statistics.median([x[0] for x in fat]), 3), round(statistics.median([x[1] for x in fat]), 3)] if fat else [0.5, 1.0]
  return {'e': e, 'r': r, 'k': k, 'faixas': [list(f) for f in FAIXAS]}

def espera(M, l, m, prog=None):
  x = M['e'].get(l, {}).get(str(faixa(m)))
  if x: return x
  h = intervalo_prog(prog, m) if prog else None
  if not h: return None
  return [round(h * M['k'][0], 1), round(h * M['k'][1], 1)]
def razao(M, m):
  return M['r'].get(str(faixa(m)), [1, 1.2])

def avaliar(G, teste, M):
  """os dois jeitos de planejar, no dia "teste"; M = modelo feito sem ele"""
  out = {'antigo': [], 'novo': [], 'agora_antigo': [], 'agora_novo': []}
  for (l, pi, pj, sen), prog in G['pares'].items():
    R = G['reais'][(l, pi, pj, sen, teste)]
    if not R: continue  # linha sem GPS nesse dia (o BRT não vem nesse GPS): não dá para conferir
    for T in range(6 * 60, 22 * 60, 10):
      if not coberto(G, teste, T - 150, T + 5): continue
      # antigo: a saída programada mais tarde que chega até T; a pessoa está no ponto 1 min antes
      ok = [d for d, a in prog if a <= T and a > T - 150]
      if ok:
        A = max(ok) - 1; x = proximo(R, A, 120)
        out['antigo'].append((x[1] if x else None, T, A))
      # novo: espera com folga + viagem com folga
      vp = viagem_prog(prog, T - 30); w = espera(M, l, T - vp - 15, prog)
      if w and intervalo_prog(prog, T - vp - w[1]):  # só onde a linha tem ônibus programados nessa hora
        A = T - vp * razao(M, T - vp)[1] - w[1]; x = proximo(R, A, 120)
        out['novo'].append((x[1] if x else None, T, A))
    # "sair agora": erro da chegada prevista
    for A in range(6 * 60, 21 * 60, 10):
      if not coberto(G, teste, A, A + 150): continue
      x = proximo(R, A, 120)
      if not x: continue
      d = [p for p in prog if p[0] >= A]
      if d: out['agora_antigo'].append(d[0][1] - x[1])
      vp = viagem_prog(prog, A); w = espera(M, l, A, prog)
      if w and intervalo_prog(prog, A): out['agora_novo'].append(A + w[0] + vp * razao(M, A)[0] - x[1])
  return out

def resumo(L):
  n = len(L); chega = [c for c, T, A in L if c is not None and c <= T]
  return {'casos': n, 'chega_a_tempo': round(len(chega) / n, 3) if n else None,
          'antecedencia_mediana_min': round(statistics.median([T - c for c, T, A in L if c is not None and c <= T]), 1) if chega else None,
          'atraso_mediano_quando_atrasa_min': round(statistics.median([c - T for c, T, A in L if c is not None and c > T]), 1) if n > len(chega) else None,
          'sai_antes_de_T_mediana_min': round(statistics.median([T - A for c, T, A in L]), 1) if n else None}
def erro(L): return {'casos': len(L), 'erro_abs_mediano_min': round(statistics.median([abs(x) for x in L]), 1) if L else None,
                     'ate_5min': round(sum(1 for x in L if abs(x) <= 5) / len(L), 3) if L else None}

if __name__ == '__main__':
  tipo = 'S' if '--sabado' in sys.argv else 'D' if '--domingo' in sys.argv else 'U'
  args = [a for a in sys.argv[1:] if not a.startswith('--')]
  G = carregar(json.load(open(args[0], encoding='utf-8')), args[1:], tipo)
  print({'U': 'Dias úteis', 'S': 'Sábados', 'D': 'Domingos'}[tipo], 'com GPS:', ', '.join(G['dias']))
  if len(G['dias']) < 2: print('Precisa de pelo menos 2 dias para testar deixando um de fora.'); sys.exit(0)
  tot = collections.defaultdict(list)
  for d in G['dias']:
    M = modelo(G, [x for x in G['dias'] if x != d]); o = avaliar(G, d, M)
    print('\n' + d + ' (modelo com os outros dias)')
    print('  chegar até, horário do GTFS:', resumo(o['antigo']))
    print('  chegar até, espera medida:  ', resumo(o['novo']))
    print('  sair agora, horário do GTFS:', erro(o['agora_antigo']))
    print('  sair agora, espera medida:  ', erro(o['agora_novo']))
    for k in o: tot[k] += o[k]
  print('\nTODOS OS DIAS')
  print('  chegar até, horário do GTFS:', resumo(tot['antigo']))
  print('  chegar até, espera medida:  ', resumo(tot['novo']))
  print('  sair agora, horário do GTFS:', erro(tot['agora_antigo']))
  print('  sair agora, espera medida:  ', erro(tot['agora_novo']))
  M = modelo(G, G['dias'])
  print('\nModelo com todos os dias: fator para linhas sem GPS', M['k'], '· folga na viagem por faixa', M['r'], '·', len(M['e']), 'linhas com espera medida')
