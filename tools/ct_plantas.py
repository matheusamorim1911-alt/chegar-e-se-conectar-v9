# Gera ct-plantas.json: espaços internos do CT (EPLAN CT / UFRJ, 2018) a partir do GeoJSON do ArcGIS.
# Uso: python3 tools/ct_plantas.py parte1.json parte2.json parte3.json blocos.json saida.json
import json,sys,math,collections,re
*partes,blocos,OUT=sys.argv[1:]
F=[]
for p in partes:F+=json.load(open(p,encoding='utf-8'))['features']
F=[f for f in F if f.get('geometry')]
FORA={'Shaft','Cobertura','Prisma de ventilação'}
G={'Sala de aula':'aula','Laboratório':'lab','Laboratório de pesquisa':'lab','Laboratório de graduação':'lab','Laboratório de informática':'info',
 'Gabinete':'gab','Administrativo':'adm','Gerência':'adm','Sanitário':'wc','Vestiário':'wc','Circulação':'circ','Circulação vertical':'vert',
 'Biblioteca':'estudo','Acervo':'estudo','Sala de alunos':'estudo','Copa-cozinha':'comer','Restaurante universitário':'comer',
 'Auditório':'evento','Teatro':'evento','Espaço cultural':'evento','Museu':'evento','Ginásio':'evento',
 'Pátio':'ext','Área não edificada':'ext','Estacionamento':'ext','Terraço':'ext'}
lat0,lon0=-22.8603,-43.2295;kx=111320*math.cos(math.radians(lat0));ky=110574
xy=lambda c:((c[0]-lon0)*kx,(c[1]-lat0)*ky)
pts=[xy(c) for f in F if f['properties']['USO'] not in FORA for ring in (f['geometry']['coordinates'] if f['geometry']['type']=='Polygon' else [r for pp in f['geometry']['coordinates'] for r in pp]) for c in ring]
mx=sum(p[0] for p in pts)/len(pts);my=sum(p[1] for p in pts)/len(pts)
sxx=sum((p[0]-mx)**2 for p in pts);syy=sum((p[1]-my)**2 for p in pts);sxy=sum((p[0]-mx)*(p[1]-my) for p in pts)
# mesma orientação do mapa do campus no app (GEO.a, GEO.b): o CT fica na horizontal, como no mapa
GA,GB=0.141984,0.216726;GK=math.hypot(GA,GB);th=math.atan2(-GB,GA)
def tr0(p):x,y=p[0]-mx,p[1]-my;return ((GA*x-GB*y)/GK,(-GB*x-GA*y)/GK)
# esquadrejar: gira o mínimo necessário para as paredes ficarem exatamente na horizontal/vertical
hist=collections.Counter()
for f in F:
  if f['properties']['USO'] in FORA:continue
  for ring in (f['geometry']['coordinates'] if f['geometry']['type']=='Polygon' else [r for pp in f['geometry']['coordinates'] for r in pp]):
    Q=[tr0(xy(cc)) for cc in ring]
    for a,b in zip(Q,Q[1:]):
      L=math.hypot(b[0]-a[0],b[1]-a[1])
      if L>0.5:hist[round(math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))%90*2)/2]+=L
dom=max(hist,key=lambda k:sum(hist.get(round((k+d/2)%90*2)/2,0) for d in range(-2,3)))
ex=-(dom if dom<=45 else dom-90)  # correção em graus
ce,se=math.cos(math.radians(ex)),math.sin(math.radians(ex))
def tr(p):x,y=tr0(p);return (x*ce-y*se,x*se+y*ce)
print('paredes a',dom,'graus; correção',round(ex,2))
def simp(P,tol):
  if len(P)<4:return P
  keep=[False]*len(P);keep[0]=keep[-1]=True;st=[(0,len(P)-1)]
  while st:
    a,b=st.pop();ax,ay=P[a];bx,by=P[b];L=math.hypot(bx-ax,by-ay) or 1e-9;md=-1;mi=None
    for i in range(a+1,b):
      d=abs((bx-ax)*(ay-P[i][1])-(ax-P[i][0])*(by-ay))/L
      if d>md:md=d;mi=i
    if md>tol:keep[mi]=True;st+=[(a,mi),(mi,b)]
  return [p for p,k in zip(P,keep) if k]
def norm(b):b=(b or '').strip();return 'Auditório' if b.lower().startswith('audit') else b.upper()
rooms=[];xs=[];ys=[]
for f in F:
  pr=f['properties'];uso=(pr['USO'] or '').strip()
  if uso in FORA or pr.get('NOME')=='Shaft':continue
  if uso=='LIMPEZA':uso='Limpeza'
  rings=f['geometry']['coordinates'] if f['geometry']['type']=='Polygon' else [pp[0] for pp in f['geometry']['coordinates']]
  enc=[]
  for ring in (rings[:1] if f['geometry']['type']=='Polygon' else rings):
    Q=[tr(xy(cc)) for cc in ring];m=max(range(len(Q)),key=lambda i:(Q[i][0]-Q[0][0])**2+(Q[i][1]-Q[0][1])**2)
    P=simp(Q[:m+1],0.2)+simp(Q[m:],0.2)[1:]  # anel fechado: simplifica em duas metades
    if len(P)<4:continue
    r=[];px=py=0
    for x,y in P[:-1]:
      ix,iy=round(x*10),round(y*10);r+=[ix-px,iy-py];px,py=ix,iy;xs.append(x);ys.append(y)
    enc.append(r)
  if not enc:continue
  nm=(pr.get('NOME') or '').strip()
  rooms.append([norm(pr['BLOCO']),(pr['PAVIMENTO'] or '').strip(),G.get(uso,'apoio'),uso,'' if nm.lower()==uso.lower() else nm,enc])
B=[]
for b in json.load(open(blocos,encoding='utf-8'))['features']:
  x,y=tr(xy(b['geometry']['coordinates']));B.append([norm(b['properties']['BLOCO']),round(x,1),round(y,1),(b['properties'].get('UNIDADES') or '').strip()])
out={'fonte':'EPLAN CT / UFRJ, levantamento de 2018 (ArcGIS)','rot':round(math.degrees(th),2),'bbox':[round(min(xs),1),round(min(ys),1),round(max(xs),1),round(max(ys),1)],'blocos':B,'salas':rooms}
s=json.dumps(out,ensure_ascii=False,separators=(',',':'));open(OUT,'w',encoding='utf-8').write(s)
print(len(rooms),'espaços,',len(s)//1024,'KB; rotação',out['rot'],'bbox',out['bbox'])
print(collections.Counter(r[1] for r in rooms));print(collections.Counter(r[2] for r in rooms))
