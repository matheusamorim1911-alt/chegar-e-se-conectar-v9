# Ajusta a previsão dos ônibus da cidade com o HISTÓRICO de GPS da prefeitura (em vez de esperar os aparelhos medirem).
# Uso: python3 tools/historico_gps.py <historico.csv ou .json> <pasta do GTFS> historico-previsao.json
#
# O arquivo de histórico pode vir do BigQuery do Data.Rio (ver tools/HISTORICO.md) ou da API ao vivo.
# As colunas são reconhecidas pelo nome: veículo (id_veiculo/ordem), linha (servico/linha), data e hora
# (datetime_gps/timestamp_gps/datetime/datahora), latitude, longitude, velocidade e direção (opcional).
#
# O que sai (historico-previsao.json, lido pelo app):
#   D   tempo parado em um ponto típico (s)                          — só se melhorar o erro nos dias de teste
#   pd  tempo parado por ponto {"lat,lon": s}, onde há dados          — idem
#   f   fator de velocidade por trecho/sentido/faixa/período          — idem
#   aval  erro médio (m) nos dias de teste: só velocidade × com o ajuste
import csv,json,math,sys,collections,bisect,statistics as st
from datetime import datetime,timezone,timedelta
ARQ,GT,OUT=sys.argv[1],sys.argv[2],sys.argv[3]
BOX=dict(latMin=-22.885,latMax=-22.825,lonMin=-43.27,lonMax=-43.195)
FATORES=[0.5,0.6,0.7,0.8,0.9,1,1.1,1.25];MIN_N=100;GANHO=0.9
RIO=timezone(timedelta(hours=-3))

def pega(o,ks):
  for k in ks:
    if k in o and o[k] not in (None,''):return o[k]
def hora(v):
  v=str(v).strip()
  if v.replace('.','').isdigit():x=float(v);return x/1000 if x>1e12 else x
  v=v.replace(' UTC','').replace('Z','').replace(' ','T')
  d=datetime.fromisoformat(v[:19])
  return d.replace(tzinfo=RIO).timestamp()  # a API e o Data.Rio usam horário de Brasília
def ler(arq):
  txt=open(arq,encoding='utf-8-sig').read()
  if txt.lstrip()[:1] in '[{':
    d=json.loads(txt);return d if isinstance(d,list) else d.get('onibus') or d.get('data') or []
  return list(csv.DictReader(txt.splitlines()))
R=[]
for o in ler(ARQ):
  try:
    la=float(str(pega(o,['latitude','lat','la'])).replace(',','.'));lo=float(str(pega(o,['longitude','lon','lo'])).replace(',','.'))
    if not(BOX['latMin']<=la<=BOX['latMax'] and BOX['lonMin']<=lo<=BOX['lonMax']):continue
    R.append(dict(v=str(pega(o,['id_veiculo','ordem','veiculo','v'])),l=str(pega(o,['servico','linha','l'])).strip().upper(),t=hora(pega(o,['datetime_gps','timestamp_gps','datetime','datahora','t'])),
      la=la,lo=lo,vel=float(str(pega(o,['velocidade','velocidade_instantanea','vel']) or 0).replace(',','.')),dir=pega(o,['direcao','dir'])))
  except Exception as e:
    if len(R)==0 and not globals().get("_e"):globals()["_e"]=1;print("linha ignorada:",repr(e))
print(len(R),'posições na região')
# GTFS: todos os traçados das linhas presentes, e os pontos de cada traçado
rd=lambda f:csv.DictReader(open(GT+'/'+f,encoding='utf-8'))
linhas={r['l'] for r in R};rt={r['route_id']:r['route_short_name'].upper() for r in rd('routes.txt')}
LS=collections.defaultdict(set);um={}
for t in rd('trips.txt'):
  n=rt.get(t['route_id'])
  if n in linhas and t['shape_id']:LS[n].add(t['shape_id']);um.setdefault(t['shape_id'],t['trip_id'])
k=111320*math.cos(math.radians(-22.86));XY=lambda la,lo:((lo+43.25)*k,(la+22.86)*110574)
pts=collections.defaultdict(list);alvo=set().union(*LS.values()) if LS else set()
for r in rd('shapes.txt'):
  if r['shape_id'] in alvo:pts[r['shape_id']].append((int(r['shape_pt_sequence']),float(r['shape_pt_lat']),float(r['shape_pt_lon']),float(r['shape_dist_traveled'] or 0)))
SP={}
for s,P in pts.items():
  P.sort();Q=[XY(a,b) for _,a,b,_ in P];c=[0]
  for i in range(1,len(Q)):c.append(c[-1]+math.hypot(Q[i][0]-Q[i-1][0],Q[i][1]-Q[i-1][1]))
  # só os trechos perto da região (acelera muito)
  dentro=[i for i,(_,a,b,_) in enumerate(P) if BOX['latMin']-0.01<=a<=BOX['latMax']+0.01 and BOX['lonMin']-0.01<=b<=BOX['lonMax']+0.01]
  # índice espacial: segmentos por quadrado de 100 m (busca só os vizinhos)
  ix=collections.defaultdict(list);dset=set(dentro)
  for i in range(1,len(Q)):
    if i not in dset and i-1 not in dset:continue
    a,b=Q[i-1],Q[i]
    for gx in range(int(min(a[0],b[0])//100),int(max(a[0],b[0])//100)+1):
      for gy in range(int(min(a[1],b[1])//100),int(max(a[1],b[1])//100)+1):ix[(gx,gy)].append(i)
  SP[s]=(Q,c,ix)
S={r['stop_id']:r for r in rd('stops.txt')};qual=set(um.values());pst=collections.defaultdict(list)
with open(GT+'/stop_times.txt',encoding='utf-8') as f:
  r=csv.reader(f);cab=next(r);it,isq,ist=cab.index('trip_id'),cab.index('stop_sequence'),cab.index('stop_id')
  for x in r:
    if x[it] in qual:pst[x[it]].append((int(x[isq]),x[ist]))
def proj(sid,p,prev=None,hd=None,base=0):
  Q,c,ix=SP[sid];best=None;gx,gy=int(p[0]//100),int(p[1]//100)
  cand=set()
  for ddx in (-1,0,1):
    for ddy in (-1,0,1):cand.update(ix.get((gx+ddx,gy+ddy),()))
  for i in cand:
    a,b=Q[i-1],Q[i];dx,dy=b[0]-a[0],b[1]-a[1];L2=dx*dx+dy*dy or 1e-9;t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2))
    d=math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
    if d>60:continue
    s=c[i-1]+t*math.sqrt(L2);pen=base
    if hd is not None and abs((math.degrees(math.atan2(dx,dy))%360-hd+540)%360-180)>100:pen+=40
    if prev is not None and not(-40<=s-prev<=1500):pen+=80
    if best is None or d+pen<best[0]:best=(d+pen,s)
  return best
STP={}
for s in SP:
  L=[];Q,c,_=SP[s]
  for _,sid in sorted(pst.get(um.get(s),[])):
    x=S.get(sid)
    if not x:continue
    la,lo=float(x['stop_lat']),float(x['stop_lon'])
    if not(BOX['latMin']<=la<=BOX['latMax'] and BOX['lonMin']<=lo<=BOX['lonMax']):continue
    pr=proj(s,XY(la,lo))
    if pr and pr[0]<=25:L.append((pr[1],'%.5f,%.5f'%(la,lo)))
  STP[s]=sorted(L)
# pares de posições consecutivas de cada ônibus, encaixados no traçado da linha
V=collections.defaultdict(list)
for o in R:
  if o['l'] in LS:V[o['v']].append(o)
pares=[]
for v,L in V.items():
  L.sort(key=lambda o:o['t']);prev=None;ult=None
  for o in L:
    if ult is not None and o['t']==ult:continue
    ult=o['t'];p=XY(o['la'],o['lo'])
    hd=None
    if o['dir'] not in (None,'') and o['vel']>2:hd=float(o['dir'])
    elif prev and o['vel']>2:hd=math.degrees(math.atan2(p[0]-prev['p'][0],p[1]-prev['p'][1]))%360
    best=None
    for sid in LS[o['l']]:
      r=proj(sid,p,prev['s'] if prev and prev['sid']==sid else None,hd,0 if not prev or prev['sid']==sid else 20)
      if r and (best is None or r[0]<best[0]):best=(r[0],r[1],sid)
    cur=dict(t=o['t'],sid=best[2],s=best[1],v=o['vel']/3.6,p=p,la=o['la'],lo=o['lo']) if best else None
    if prev and cur and prev['sid']==cur['sid'] and 8<=cur['t']-prev['t']<=60:
      real=cur['s']-prev['s']
      if real>=-40:
        dt=cur['t']-prev['t'];d=datetime.fromtimestamp(prev['t'],RIO);h=d.hour+d.minute/60
        per='w' if d.weekday()>=5 else ('p' if (6<=h<9.5 or 16<=h<20) else 'f')
        ang=hd if hd is not None else 0
        pares.append(dict(t=prev['t'],dt=dt,v=prev['v'],s0=prev['s'],sid=prev['sid'],real=real,
          cel='%d,%d'%(math.floor(prev['la']/0.0015),math.floor(prev['lo']/0.0015)),d8=int(((ang%360)+22.5)//45)%8,
          vb=0 if prev['v']*3.6<2 else 1 if prev['v']*3.6<15 else 2 if prev['v']*3.6<35 else 3,per=per))
    prev=cur
print(len(pares),'pares de posições;',len({p['sid'] for p in pares}),'traçados')
if len(pares)<200:sys.exit('poucos dados para ajustar')
pares.sort(key=lambda p:p['t']);corte=int(len(pares)*0.7);TR,TE=pares[:corte],pares[corte:]
def prox(p,sk=25):
  L=STP.get(p['sid'])
  if not L:return None
  i=bisect.bisect_right([x[0] for x in L],p['s0']+sk)
  return (L[i][0]-p['s0'],L[i][1]) if i<len(L) else None
def pred(p,D=0,pd=None,f=None):
  v=p['v']*(f(p) if f else 1)
  if v<=0:return 0
  d=v*p['dt'];n=prox(p)
  if D is None or n is None or n[0]>d:return d
  dw=(pd or {}).get(n[1],D)
  return n[0]+max(0,p['dt']-n[0]/v-dw)*v
mae=lambda A,**kw:sum(abs(p['real']-pred(p,**kw)) for p in A)/max(1,len(A))
mov=lambda A:[p for p in A if p['v']>0.6]
base=mae(mov(TE),D=None)
# 1) tempo típico parado num ponto
Dg=min(range(0,41,2),key=lambda D:mae(mov(TR),D=D))
# 2) por ponto (onde há dados suficientes)
porPonto=collections.defaultdict(list)
for p in mov(TR):
  n=prox(p)
  if n and n[0]<=p['v']*p['dt']:porPonto[n[1]].append(p)
pd={}
for k2,A in porPonto.items():
  if len(A)>=40:
    b=min(range(0,61,3),key=lambda D:sum(abs(p['real']-pred(p,D=D)) for p in A))
    if sum(abs(p['real']-pred(p,D=b)) for p in A)<=0.95*sum(abs(p['real']-pred(p,D=Dg)) for p in A):pd[k2]=b
# 3) fator de velocidade por trecho (só com prova de ganho)
grp=collections.defaultdict(list)
for p in mov(TR):grp[(p['cel'],p['d8'],p['vb'],p['per'])].append(p)
fat={}
for g,A in grp.items():
  if len(A)<MIN_N:continue
  E=[sum(abs(p['real']-pred(p,D=Dg,pd=pd,f=lambda q,c=c:c)) for p in A) for c in FATORES]
  b=min(range(len(FATORES)),key=lambda i:E[i])
  if FATORES[b]!=1 and E[b]<=GANHO*E[FATORES.index(1)]:fat['%s|%d|%d|%s'%g]=FATORES[b]
fk=lambda p:fat.get('%s|%d|%d|%s'%(p['cel'],p['d8'],p['vb'],p['per']),1)
r_pt=mae(mov(TE),D=Dg);r_pd=mae(mov(TE),D=Dg,pd=pd);r_f=mae(mov(TE),D=Dg,pd=pd,f=fk)
print('erro médio nos dias de teste (m): só velocidade %.1f | parada típica de %d s %.1f | por ponto %.1f | + fator por trecho %.1f'%(base,Dg,r_pt,r_pd,r_f))
out={'fonte':'histórico de GPS da SMTR/Prefeitura do Rio','de':datetime.fromtimestamp(pares[0]['t'],RIO).strftime('%Y-%m-%d'),'ate':datetime.fromtimestamp(pares[-1]['t'],RIO).strftime('%Y-%m-%d'),
     'pares':len(pares),'aval':{'so_velocidade':round(base,1)}}
if r_pt<base:out['D']=Dg;out['aval']['com_paradas']=round(r_pt,1)
if 'D' in out and r_pd<r_pt:out['pd']=pd;out['aval']['por_ponto']=round(r_pd,1)
if 'D' in out and r_f<min(r_pt,r_pd):out['f']=fat;out['aval']['com_fator']=round(r_f,1)
json.dump(out,open(OUT,'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(OUT,'gravado:',{k2:(len(v) if isinstance(v,dict) else v) for k2,v in out.items() if k2!='aval'},out['aval'])
