# Gera o site (raiz do repositório, servida pelo GitHub Pages) a partir das partes em src/ (ver src/PARTES.md).
# Uso, na raiz do repositório:  python3 tools/build_site.py
# (opcional: python3 tools/build_site.py <fonte.html ou -> <pasta de saída> [versão])
import sys,re,os,json,datetime,shutil,hashlib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src=sys.argv[1] if len(sys.argv)>1 and sys.argv[1]!='-' else None
out=sys.argv[2] if len(sys.argv)>2 else ROOT
ver=sys.argv[3] if len(sys.argv)>3 else datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).strftime('%Y%m%d-%H%M')
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import montar
s=open(src,encoding='utf-8').read() if src else montar.montar()
css=s[s.index('<style>')+7:s.index('</style>')]
m=max(re.finditer(r'<script>(.*?)</script>',s,re.S),key=lambda m:len(m.group(1)))
js=m.group(1)
# imagens da planta: no site ficam na raiz, e cada uma ganha uma marca do seu conteúdo no endereço (?v=...),
# para o navegador e o service worker baixarem de novo só a que mudou
imgs=sorted(f for f in os.listdir(out) if f.startswith('mapa-') and f.endswith(('.jpg','.webp','.svg')))
marca={f:hashlib.sha1(open(os.path.join(out,f),'rb').read()).hexdigest()[:10] for f in imgs}
assert js.count("var MAPA_DIR='img/',MAPA_V={};")==1
js=js.replace("var MAPA_DIR='img/',MAPA_V={};","var MAPA_DIR='',MAPA_V=%s;"%json.dumps(marca,separators=(',',':')))
# traduções (inglês e espanhol) fora do app.js: só quem escolhe outro idioma baixa idioma.json
_idi={'tab':'','frag':''}
def _tira(rx,chave,novo):
  global js
  m=re.search(rx,js,re.S);assert m,rx
  _idi[chave]+=m.group(1);js=js[:m.start()]+novo+js[m.end():]
_tira(r"var IDI_TAB=`(.*?)`;",'tab',"var IDI_TAB='';")
_tira(r"\nIDI_TAB\+=`(.*?)`;",'tab',"\nIDI_TAB+='';")
_tira(r"var IDI_FRAG=`(.*?)`;",'frag',"var IDI_FRAG='';")
_idj=json.dumps(_idi,ensure_ascii=False,separators=(',',':'))
_idv=hashlib.sha1(_idj.encode()).hexdigest()[:10]
open(os.path.join(out,'idioma.json'),'w',encoding='utf-8').write(_idj)
assert js.count("var IDI_ARQ='';")==1
js=js.replace("var IDI_ARQ='';","var IDI_ARQ='idioma.json?v=%s';"%_idv)
assert js.count("var APP_VERSION='dev';")==1
js=js.replace("var APP_VERSION='dev';","var APP_VERSION='%s';"%ver)
body=s[s.index('</style>')+8:m.start()].strip('\n')
tpl=open(os.path.join(out,'index.html'),encoding='utf-8').read().split('\n')
head='\n'.join(tpl[:tpl.index('<body>')+1]);
head=re.sub(r'href="style\.css(\?v=[^"]*)?"','href="style.css?v=%s"'%ver,head)
tail='<script src="config.js?v=%s"></script>\n<script src="app.js?v=%s"></script>\n</body>\n</html>\n'%(ver,ver)
os.makedirs(out,exist_ok=True)
open(os.path.join(out,'index.html'),'w',encoding='utf-8').write(head+'\n'+body+'\n'+tail)
open(os.path.join(out,'app.js'),'w',encoding='utf-8').write(js.strip('\n')+'\n')
open(os.path.join(out,'style.css'),'w',encoding='utf-8').write(css.strip('\n')+'\n')
open(os.path.join(out,'version.json'),'w',encoding='utf-8').write(json.dumps({'v':ver})+'\n')
# service worker: guarda o app para abrir sem internet; o nome do cache muda a cada versão
pre=['./','index.html','style.css?v='+ver,'app.js?v='+ver,'config.js?v='+ver,'manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png','favicon-32.png']+[f+'?v='+marca[f] for f in imgs if not f.endswith('.jpg')]+['idioma.json?v='+_idv]  # o JPG fica só para navegador sem WebP (baixado quando pedido)
# endereço do Worker (config.js) para o aviso de tiroteio: a notificação chega sem conteúdo e o service worker busca os detalhes
import re as _re
_cfg=open(os.path.join(out,'config.js'),encoding='utf-8').read() if os.path.exists(os.path.join(out,'config.js')) else ''
_gps=(_re.search(r'CSE_GPS_URL\s*=\s*["\']([^"\']*)["\']',_cfg) or [None,''])[1]
sw=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'sw_template.js'),encoding='utf-8').read().replace('__VER__',ver).replace('__PRE__',json.dumps(pre)).replace('__GPS__',json.dumps(_gps))
open(os.path.join(out,'sw.js'),'w',encoding='utf-8').write(sw)
print('versão',ver)
