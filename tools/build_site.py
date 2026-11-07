# Gera o site (raiz do repositório, servida pelo GitHub Pages) a partir das partes em src/ (ver src/PARTES.md).
# Uso, na raiz do repositório:  python3 tools/build_site.py
# (opcional: python3 tools/build_site.py <fonte.html ou -> <pasta de saída> [versão])
import sys,re,os,json,datetime,shutil
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src=sys.argv[1] if len(sys.argv)>1 and sys.argv[1]!='-' else None
out=sys.argv[2] if len(sys.argv)>2 else ROOT
ver=sys.argv[3] if len(sys.argv)>3 else datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).strftime('%Y%m%d-%H%M')
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import montar
s=open(src,encoding='utf-8').read() if src else montar.montar()
css=s[s.index('<style>')+7:s.index('</style>')]
m=max(re.finditer(r'<script>(.*?)</script>',s,re.S),key=lambda m:len(m.group(1)))
js=m.group(1).replace("'img/mapa-","'mapa-")
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
imgs=sorted(f for f in os.listdir(out) if f.startswith('mapa-'))
pre=['./','index.html','style.css?v='+ver,'app.js?v='+ver,'config.js?v='+ver,'manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png','favicon-32.png']+imgs
sw=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'sw_template.js'),encoding='utf-8').read().replace('__VER__',ver).replace('__PRE__',json.dumps(pre))
open(os.path.join(out,'sw.js'),'w',encoding='utf-8').write(sw)
print('versão',ver)
