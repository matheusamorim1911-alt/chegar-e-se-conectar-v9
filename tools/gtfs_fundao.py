# Gera src/ext_onibus.json: ônibus municipais (GTFS da SMTR) que saem da Ilha do Fundão.
# Uso: python3 tools/gtfs_fundao.py <pasta do GTFS descompactado> src/ext_onibus.json
import csv,collections,json,re,statistics,unicodedata,sys
D,OUT=sys.argv[1],sys.argv[2]
rd=lambda f:csv.DictReader(open(D+'/'+f,encoding='utf-8'))
S={r['stop_id']:r for r in rd('stops.txt')}
ilha={k for k,v in S.items() if k.startswith('3105') or v['parent_station'].startswith('3105')}  # 3105 = Cidade Universitária
def grp(sid):
  n=S[sid]['stop_name']
  if 'Aroldo Melodia' in n:return 'terminal','Terminal Fundão (Aroldo Melodia)'
  if 'Hélio de Almeida' in n:return 'helio','Fundão · Rua Hélio de Almeida'
  return re.sub(r'[^a-z0-9]+','',unicodedata.normalize('NFD',n.lower()).encode('ascii','ignore').decode())[:16],n
T={r['trip_id']:r for r in rd('trips.txt')};R={r['route_id']:r for r in rd('routes.txt')}
F=collections.defaultdict(list)
for r in rd('frequencies.txt'):F[r['trip_id']].append(r)
hit=collections.defaultdict(list);first={}
with open(D+'/stop_times.txt',encoding='utf-8') as f:
  r=csv.reader(f);next(r)
  for t,seq,st,arr,dep,*_ in r:
    if t not in first or int(seq)<first[t][0]:first[t]=(int(seq),dep)
    if st in ilha:hit[t].append((int(seq),st,dep))
def m(s):h,mi,se=map(int,s.split(':'));return h*60+mi+se/60
G={'Castelo':'centro','Candelária':'centro','Gentileza':'centro','General Osório':'sul','Saens Peña':'tijuca','Del Castilho':'norte','Méier':'norte','Irajá':'norte','Madureira':'norte','Manacéia':'norte','Bonsucesso':'norte','Santa Efigênia':'oeste','Bancários':'ilha','Bananal':'ilha','Ribeira':'ilha','Tubiacanga':'ilha','Dendê':'ilha','Aeroporto':'ilha','Galeão':'ilha'}
stops={};L={}
for t,hs in hit.items():
  tr=T[t];rt=R[tr['route_id']];hd=tr['trip_headsign']
  if re.search('Fundão|Aroldo Melodia',hd):continue
  g=next((v for k,v in G.items() if k in hd),None)
  # destino sem grupo conhecido: entra em "Outros destinos" (antes a linha sumia do app e do filtro do Worker)
  if not g:print('sem grupo (vai para Outros destinos):',rt['route_short_name'],hd);g='outros'
  hs.sort();key=(rt['route_short_name'],g)
  o=L.setdefault(key,{'n':rt['route_short_name'],'nm':rt['route_long_name'],'d':hd,'g':g,'c':('#'+rt['route_color']) if rt['route_color'] else '','brt':rt['route_type']=='702','t':collections.defaultdict(list),'off':collections.defaultdict(list),'hd':collections.Counter()})
  o['hd'][hd]+=1
  base=m(hs[0][2]);seen=set()
  for sq,st,dep in hs:
    gid,gn=grp(st)
    if gid in seen:continue
    seen.add(gid);stops.setdefault(gid,[gn,[],[]]);stops[gid][1].append(float(S[st]['stop_lat']));stops[gid][2].append(float(S[st]['stop_lon']))
    o['off'][gid].append(m(dep)-base)
  if t in F:
    off=base-m(first[t][1])
    for fr in F[t]:
      a=m(fr['start_time']);b=m(fr['end_time']);h=int(fr['headway_secs'])/60;x=a
      while x<b:o['t'][tr['service_id'][0]].append(round(x+off));x+=h
  else:o['t'][tr['service_id'][0]].append(round(base))
fi=next(rd('feed_info.txt'))
out={'fonte':'SMTR / Prefeitura do Rio (GTFS, CC BY 4.0)','ate':fi.get('feed_end_date',''),'stops':{},'lines':[]}
for gid,(n,la,lo) in stops.items():out['stops'][gid]=[n,round(sum(la)/len(la),6),round(sum(lo)/len(lo),6)]
for k,o in sorted(L.items()):
  st=sorted(o['off'],key=lambda g:statistics.median(o['off'][g]))
  out['lines'].append({'n':o['n'],'nm':o['nm'],'d':o['hd'].most_common(1)[0][0],'g':o['g'],'c':o['c'],'brt':o['brt'],'st':[[g,round(statistics.median(o['off'][g]))] for g in st],'t':{s:sorted(set(v)) for s,v in o['t'].items()}})
open(OUT,'w',encoding='utf-8').write(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print(OUT,len(out['stops']),'paradas,',len(out['lines']),'linhas por sentido')

# Traçados (shapes) das linhas na região do Fundão, para os ônibus ao vivo andarem sobre as ruas
TOL=4  # metros de simplificação das curvas (antes 10)
A=dict(latMin=-22.885,latMax=-22.825,lonMin=-43.27,lonMax=-43.195)
nomes={l['n'] for l in out['lines']}|{'486','SP485'}
sid=collections.defaultdict(set)
for t in T.values():
  n=R[t['route_id']]['route_short_name']
  if n in nomes and t['shape_id']:sid[t['shape_id']].add(n)
pts=collections.defaultdict(list)
for r in rd('shapes.txt'):
  if r['shape_id'] in sid:pts[r['shape_id']].append((int(r['shape_pt_sequence']),float(r['shape_pt_lat']),float(r['shape_pt_lon'])))
import math
def simp(P,tol):
  if len(P)<3:return P
  k=math.cos(math.radians(-22.85));xy=[(p[1]*111320*k,p[0]*110574) for p in P]
  keep=[False]*len(P);keep[0]=keep[-1]=True;st=[(0,len(P)-1)]
  while st:
    a,b=st.pop();ax,ay=xy[a];bx,by=xy[b];L=math.hypot(bx-ax,by-ay) or 1e-9;md=-1;mi=None
    for i in range(a+1,b):
      d=abs((bx-ax)*(ay-xy[i][1])-(ax-xy[i][0])*(by-ay))/L
      if d>md:md=d;mi=i
    if md>tol:keep[mi]=True;st+=[(a,mi),(mi,b)]
  return [p for p,k2 in zip(P,keep) if k2]
inA=lambda la,lo:A['latMin']<=la<=A['latMax'] and A['lonMin']<=lo<=A['lonMax']
# pontos de parada de cada traçado (de uma viagem que usa o traçado), para a previsão parar nos pontos
um={}
for t in T.values():
  if t['shape_id'] in pts and t['shape_id'] not in um:um[t['shape_id']]=t['trip_id']
qual=set(um.values());pst=collections.defaultdict(list)
with open(D+'/stop_times.txt',encoding='utf-8') as f:
  r=csv.reader(f);next(r)
  for t,seq,st,*_ in r:
    if t in qual:pst[t].append((int(seq),st))
sh=collections.defaultdict(list);uniq={};lista=[];spts=collections.defaultdict(dict)
for s,P in pts.items():
  P.sort();seg=[]
  pars=[S[st] for _,st in sorted(pst.get(um.get(s),[]))]
  for _,la,lo in P+[(0,0,0)]:
    if la and inA(la,lo):seg.append((la,lo))
    else:
      if len(seg)>1:
        q=tuple((round(a,5),round(b,5)) for a,b in simp(seg,TOL))
        if q not in uniq:uniq[q]=len(lista);lista.append([[a,b] for a,b in q])
        for n in sid[s]:
          if uniq[q] not in sh[n]:sh[n].append(uniq[q])
        # pontos dentro do recorte (o app projeta no traçado e descarta o que estiver a mais de 25 m)
        la0=min(a for a,b in seg)-0.0004;la1=max(a for a,b in seg)+0.0004;lo0=min(b for a,b in seg)-0.0004;lo1=max(b for a,b in seg)+0.0004
        for x in pars:
          a,b=float(x['stop_lat']),float(x['stop_lon'])
          if la0<=a<=la1 and lo0<=b<=lo1:spts[uniq[q]][x['stop_id']]=[round(a,5),round(b,5)]
      seg=[]
def enc(P):
  r=[];pa=-2280000;po=-4320000
  for a,b in P:
    ia=round(a*1e5);ib=round(b*1e5);r+=[ia-pa,ib-po];pa,po=ia,ib
  return r
out['sh']=sh;out['shp']=[enc(P) for P in lista]
out['shs']={str(k):list(v.values()) for k,v in spts.items()}  # pontos de parada perto de cada traçado
open(OUT,'w',encoding='utf-8').write(json.dumps(out,ensure_ascii=False,separators=(',',':')))
print('traçados:',len(lista),'trechos,',sum(len(p) for p in lista),'pontos; arquivo',len(json.dumps(out,separators=(',',':'))),'bytes')
# linhas que o Worker não pede à prefeitura (fora de LINHAS em worker/gps-fundao.js): ônibus delas só aparecem
# ao vivo quando estão dentro da ilha. Acrescente lá e publique o Worker de novo.
import os
_w=open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'worker','gps-fundao.js'),encoding='utf-8').read()
_lw=set(re.findall(r"'([^']+)'",re.search(r"const LINHAS = new Set\(\[(.*?)\]\)",_w).group(1)))
_fal=sorted({l['n'] for l in out['lines']}-_lw)
if _fal:print('ATENÇÃO: linhas fora de LINHAS no Worker:',', '.join(_fal))
# GTFS Realtime: o Worker tira a linha do route_id ("O0321AAA0A" → 321, "O0803AAP0A" → SP803). As rotas que fogem
# dessa regra (variantes SN, SV, SR…, BRT) vão para ROTAS, entre as marcas ROTAS-INICIO e ROTAS-FIM do Worker.
# Depois de rodar, publique o Worker de novo.
_VAR={'AAA':'','AAP':'SP'}
def _regra(rid):
  m=re.match(r'^[A-Z](\d{3,4})([A-Z]{3})\d[A-Z]$',rid)
  if m: n=str(int(m.group(1))); return (_VAR[m.group(2)]+n) if m.group(2) in _VAR else n
  return rid if re.match(r'^[A-Z]{0,3}\d{1,4}[A-Z]?$',rid) else ''
_rot={k:v['route_short_name'] for k,v in R.items() if v['route_short_name'] and _regra(k)!=v['route_short_name']}
_wf=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'worker','gps-fundao.js')
_ini,_fim='// ROTAS-INICIO\n','// ROTAS-FIM\n'
_a=_w.index(_ini)+len(_ini);_b=_w.index(_fim)
_novo=_w[:_a]+'const ROTAS = '+json.dumps(dict(sorted(_rot.items())),ensure_ascii=False,separators=(',',':'))+';\n'+_w[_b:]
if _novo!=_w: open(_wf,'w',encoding='utf-8').write(_novo); print('Worker: %d rotas fora da regra gravadas em ROTAS. Publique o Worker de novo.'%len(_rot))
