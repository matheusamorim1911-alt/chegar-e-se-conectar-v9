# Semáforos e lombadas na região do Fundão para a previsão dos ônibus ao vivo, e a prova de que ajudam.
#
#   python3 tools/redutores.py                      → gera src/redutores.json só com as posições (sem ajuste na previsão)
#   python3 tools/redutores.py gps.csv [gps2.csv…]  → também testa a previsão com o GPS da prefeitura e grava o ajuste
#                                                     (tempo perdido em cada semáforo e lombada) só se ele reduzir o erro
#
# Fontes (cópia em tools/dados/redutores-fontes.json):
#   - UFRJ, mapa "Cidade Universitária - Mobilidade e Transporte" no ArcGIS Online: camadas SEMÁFOROS e LOMBADAS;
#   - OpenStreetMap (© colaboradores do OpenStreetMap, licença ODbL): highway=traffic_signals,
#     crossing=traffic_signals e traffic_calming, na caixa da região do Fundão.
# Amostra usada no teste (5 e 6/11/2026, picos e meio do dia, só linhas do Fundão na região):
#   python3 tools/redutores.py tools/dados/gps-fundao-2026-11-05-06.csv.gz
# O GPS pode ser o CSV do BigQuery (ver tools/HISTORICO.md) ou o salvo direto da API (colunas id_veiculo, servico,
# latitude, longitude, velocidade, direcao, datetime). A previsão testada é a mesma do app (src/js/22-onibus-ao-vivo.js):
# encaixe no traçado da linha pelo sentido do movimento, velocidade informada e parada nos pontos.
import json, math, os, sys, collections, statistics as st
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from previsao_comum import *

SAIDA = os.path.join(ROOT, 'src', 'redutores.json')

def erro(A, ps=0, pl=0): return st.mean(abs(a['real'] - dist(a['S'], a['s'], a['sign'], a['v'], a['h'], ps, pl)) for a in A)

ajuste = None
if len(sys.argv) > 1:
  A = pares(ler_gps(sys.argv[1:])); A.sort(key=lambda a: a['t'])
  print('%d pares de posições com o ônibus andando' % len(A))
  corte = int(len(A) * 0.7); treino, teste = A[:corte], A[corte:]
  base_tr, base_te = erro(treino), erro(teste)
  grade = [(ps, pl) for ps in (0, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20) for pl in (0, 1, 2, 3, 4, 6, 8)]
  melhor = min(grade, key=lambda q: erro(treino, *q))
  te = erro(teste, *melhor)
  print('erro médio (m), treino / teste:  sem semáforos e lombadas %.1f / %.1f' % (base_tr, base_te))
  print('  com %d s por semáforo e %d s por lombada:  %.1f / %.1f' % (melhor[0], melhor[1], erro(treino, *melhor), te))
  ganho = base_te - te
  if melhor != (0, 0) and ganho >= 1 and ganho / base_te >= 0.02:
    ajuste = {'semaforo_s': melhor[0], 'lombada_s': melhor[1], 'pares': len(A), 'erro_antes_m': round(base_te, 1), 'erro_depois_m': round(te, 1)}
    print('→ ajuste gravado (ganho de %.1f m no teste)' % ganho)
  else:
    print('→ sem ganho comprovado: a previsão continua sem semáforos e lombadas')

def ponto_em(S, s):
  c, P = S['c'], S['P']; j = next((k for k in range(1, len(c)) if c[k] >= s), len(c) - 1)
  t = (s - c[j - 1]) / ((c[j] - c[j - 1]) or 1e-9); x, y = P[j - 1][0] + t * (P[j][0] - P[j - 1][0]), P[j - 1][1] + t * (P[j][1] - P[j - 1][1])
  return (y / KY + LAT0, x / KX - 43.23)
if len(sys.argv) > 1 and PARADOS:
  # lugares onde muitos ônibus diferentes ficam parados longe de um ponto: semáforo, lombada ou retenção
  B = collections.defaultdict(set)
  for i, s, v in PARADOS:
    if all(abs(s - x) > 40 for x in SH[i]['st']): B[(i, round(s / 30))].add(v)
  top, vistos = [], []
  for (i, b), vs in sorted(B.items(), key=lambda kv: -len(kv[1])):
    if len(vs) < 3: break
    la, lo = ponto_em(SH[i], b * 30); p = xy(la, lo)
    if any(math.hypot(p[0] - q[0], p[1] - q[1]) < 40 for q in vistos): continue
    vistos.append(p)
    perto = min(((math.hypot(p[0] - r[3][0], p[1] - r[3][1]), r[0]) for r in RED), default=(1e9, ''))
    top.append((len(vs), round(la, 5), round(lo, 5), {'s': 'semáforo', 'l': 'lombada'}.get(perto[1], '') if perto[0] < 40 else ''))
  arq = os.path.join(ROOT, 'tools', 'dados', 'paradas-fora-dos-pontos.csv')
  with open(arq, 'w', encoding='utf-8') as f:
    f.write('onibus_diferentes,latitude,longitude,mapeado_a_menos_de_40m\n')
    for t in top: f.write('%d,%s,%s,%s\n' % t)
  print('%d lugares onde 3 ou mais ônibus pararam longe de um ponto (%d já têm semáforo ou lombada mapeados) → %s'
        % (len(top), sum(1 for t in top if t[3]), os.path.relpath(arq, ROOT)))

saida = {
  'fonte': 'UFRJ (Mobilidade e Transporte, ArcGIS Online) e OpenStreetMap (© colaboradores do OpenStreetMap, ODbL)',
  's': [[la, lo] for k, la, lo, p in RED if k == 's'], 'l': [[la, lo] for k, la, lo, p in RED if k == 'l'],
  'ajuste': ajuste,
}
if ajuste is None and os.path.exists(SAIDA) and len(sys.argv) == 1:  # sem GPS: mantém o ajuste já comprovado
  saida['ajuste'] = json.load(open(SAIDA, encoding='utf-8')).get('ajuste')
json.dump(saida, open(SAIDA, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('%d semáforos e %d lombadas → %s' % (len(saida['s']), len(saida['l']), os.path.relpath(SAIDA, ROOT)))
