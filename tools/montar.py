# Junta as partes de src/ (pagina/, css/, js/) no arquivo único do app, na ordem dos nomes (01-, 02-, …).
# Uso: python3 tools/montar.py [saida.html]   (sem saída, imprime o caminho de um arquivo temporário)
# O arquivo único é o que vai para o claude.ai (artifact) e é a entrada do build do site.
import os,sys,glob
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));S=os.path.join(ROOT,'src')
def ler(p):return open(p,encoding='utf-8').read()
def montar():
  css=''.join(ler(f) for f in sorted(glob.glob(os.path.join(S,'css','*.css'))))
  js=''.join(ler(f) for f in sorted(glob.glob(os.path.join(S,'js','*.js'))))
  # dados dos ônibus da cidade (gerados por tools/gtfs_fundao.py a partir do GTFS da prefeitura)
  assert js.count('__EXT_ONIBUS__')==1
  js=js.replace('__EXT_ONIBUS__',ler(os.path.join(S,'ext_onibus.json')).strip())
  # prédios que faltavam na planta (gerados por tools/edificacoes_ufrj.py a partir do cadastro da UFRJ)
  assert js.count('__EDIFICACOES__')==1
  js=js.replace('__EDIFICACOES__',ler(os.path.join(S,'edificacoes.json')).strip())
  return (ler(os.path.join(S,'pagina','cabecalho.html'))+'<style>\n'+css+'</style>\n'+ler(os.path.join(S,'pagina','corpo.html'))+
          "<script>\n(function(){\n'use strict';\n"+js+'})();\n</script>\n'+ler(os.path.join(S,'pagina','fim.html')))
if __name__=='__main__':
  out=sys.argv[1] if len(sys.argv)>1 else os.path.join(ROOT,'app-completo.html')
  open(out,'w',encoding='utf-8').write(montar());print(out)
