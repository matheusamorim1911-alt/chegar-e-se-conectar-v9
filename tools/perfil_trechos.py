# Perfil de cada trecho de rua, para a previsão dos ônibus ao vivo: "o que os outros ônibus fizeram a partir daqui".
#
#   python3 tools/perfil_trechos.py gps.csv [gps2.csv…]   → grava perfil-onibus.json (raiz do site) se houver ganho
#
# Para cada traçado de linha, sentido e trecho de 60 m, guarda a velocidade mediana com que os ônibus seguiram dali
# nos dias úteis (sem feriados), separada por período: manhã (5h às 12h), tarde (12h às 18h) e noite (18h às 5h).
# O app mistura essa velocidade com a sua previsão (velocidade informada + parada no próximo ponto):
#   previsto = w × previsão do app + (1 − w) × velocidade do trecho × tempo
# Fins de semana e feriados ficam de fora (o app usa só a previsão de sempre) até haver dados para eles.
#
# Prova: cada dia útil dos dados é testado com o perfil feito pelos OUTROS dias. Um período só entra se o erro médio
# cair pelo menos 2% e 1 m no conjunto dos testes e não piorar na maioria dos dias. Precisa de pelo menos 2 dias úteis.
# O GPS pode ser o CSV do BigQuery (ver tools/HISTORICO.md) ou o salvo da API (amostras em tools/dados/gps-*.csv.gz).
import json, os, sys, collections, statistics as st, zlib
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from previsao_comum import ROOT, ler_gps, pares, dist, dia_util, periodo

TRECHO_M, MIN_AMOSTRAS = 60, 3
PERIODOS = ('manha', 'tarde', 'noite')
SAIDA = os.path.join(ROOT, 'perfil-onibus.json')
if len(sys.argv) < 2: sys.exit(__doc__ if __doc__ else 'uso: python3 tools/perfil_trechos.py gps.csv [gps2.csv…]')

A = [a for a in pares(ler_gps(sys.argv[1:])) if dia_util(a['t'])]
for a in A:
  a['dia'] = datetime.fromtimestamp(a['t']).strftime('%Y-%m-%d'); a['per'] = periodo(a['t'])
  a['chave'] = (a['Si'], a['sign'], int(a['s'] // TRECHO_M), a['per']); a['app'] = dist(a['S'], a['s'], a['sign'], a['v'], a['h'])
dias = sorted({a['dia'] for a in A})
print('%d pares de posições em dias úteis, %d dias: %s' % (len(A), len(dias), ', '.join(dias)))

def perfil(B):
  M = collections.defaultdict(list)
  for a in B: M[a['chave']].append(a['real'] / a['h'])
  return {k: st.median(v) for k, v in M.items() if len(v) >= MIN_AMOSTRAS}
def prev(a, P, w):
  v = P.get(a['chave']); return a['app'] if v is None else w * a['app'] + (1 - w) * v * a['h']
def erro(B, P, w): return st.mean(abs(a['real'] - prev(a, P, w)) for a in B) if B else None
PESOS = [i / 10 for i in range(0, 11)]
def escolhe_w(tr):
  """peso escolhido fora da amostra: perfil com metade dos ônibus, erro medido na outra metade (e vice-versa)"""
  meio = lambda a: zlib.crc32(a['veh'].encode()) % 2  # estável entre execuções
  G = [[a for a in tr if meio(a) == k] for k in (0, 1)]
  Ps = [perfil(G[1]), perfil(G[0])]
  return min(PESOS, key=lambda w: sum(erro(G[k], Ps[k], w) * len(G[k]) for k in (0, 1) if G[k]))

resultado, pesos = {}, {}
for per in PERIODOS:
  Ap = [a for a in A if a['per'] == per]; dias_p = sorted({a['dia'] for a in Ap})
  if len(dias_p) < 2: print('  %-6s poucos dados (%d dia%s): fica de fora' % (per, len(dias_p), '' if len(dias_p) == 1 else 's')); continue
  antes = depois = n = 0; melhorou = 0; ws = []
  for d in dias_p:  # testa cada dia com o perfil dos outros dias
    tr = [a for a in Ap if a['dia'] != d]; te = [a for a in Ap if a['dia'] == d]
    P = perfil(tr); w = escolhe_w(tr); ws.append(w)
    e0, e1 = erro(te, {}, 1), erro(te, P, w)
    antes += e0 * len(te); depois += e1 * len(te); n += len(te); melhorou += e1 < e0
    print('  %-6s teste %s: %5d pares, erro %.1f → %.1f m (w=%.1f)' % (per, d, len(te), e0, e1, w))
  antes /= n; depois /= n; ganho = antes - depois
  ok = ganho >= 1 and ganho / antes >= 0.02 and melhorou * 2 > len(dias_p)
  print('  %-6s no conjunto: %.1f → %.1f m (%+.1f%%) → %s' % (per, antes, depois, -100 * ganho / antes, 'entra' if ok else 'fica de fora'))
  if ok:
    pesos[per] = st.median(ws)
    resultado[per] = {'w': pesos[per], 'erro_antes_m': round(antes, 1), 'erro_depois_m': round(depois, 1), 'pares': n, 'dias': len(dias_p)}

# perfil final com todos os dias, só para os períodos com ganho comprovado: {"traçado|sentido|período": [trecho inicial, [dm/s…]]}
P = perfil([a for a in A if a['per'] in pesos])
grupos = collections.defaultdict(dict)
for (i, sg, b, per), v in P.items(): grupos['%d|%d|%s' % (i, sg, per)][b] = v
p = {}
for k, D in grupos.items():
  b0, b1 = min(D), max(D); p[k] = [b0, [round(D[b] * 10) if b in D else -1 for b in range(b0, b1 + 1)]]
saida = {'fonte': 'GPS dos ônibus (SMTR / Prefeitura do Rio), dias úteis: ' + ', '.join(dias),
         'trecho_m': TRECHO_M, 'periodos': resultado, 'p': p}
if resultado:
  json.dump(saida, open(SAIDA, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
  print('%d trechos com perfil (%s) → %s (%d KB)' % (len(P), ', '.join(resultado), os.path.relpath(SAIDA, ROOT), os.path.getsize(SAIDA) // 1024))
else:
  if os.path.exists(SAIDA): os.remove(SAIDA)
  print('nenhum período com ganho comprovado: sem perfil (a previsão continua a de sempre)')
