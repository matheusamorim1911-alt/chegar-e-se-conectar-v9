// O app tem de abrir sem erro com qualquer estado guardado no aparelho (seções abertas, aba, camadas, ônibus seguido).
// Um erro na carga para o resto do app (as partes seguintes nem rodam): foi assim que, com "Prédios por dentro"
// aberto, sumiram os ônibus ao vivo e o conteúdo de Lugares (CTP e LIVE ficavam sem valor).
const { chromium } = require('playwright');const servir=require('./servidor');const fs=require('fs'),path=require('path');
(async()=>{const srv=await servir(8819);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const am=JSON.parse(fs.readFileSync(path.join(__dirname,'amostra-onibus.json'),'utf8'));
 const estados=[
   ['bloco "Ônibus da cidade" aberto em Trajetos (a carga parava aqui)',{'cse-fold-ext':'1'},''],
   ['Prédios por dentro aberto, na aba Lugares',{'cse-folds':'{"f":true,"b":true}'},'#predios'],
   ['Prédios por dentro aberto, na aba Trajetos',{'cse-folds':'{"f":false,"b":true}'},''],
   ['ônibus da cidade ligado e um ônibus seguido',{'cse-lay-ext':'1','cse-seguir':JSON.stringify({v:'B28568',l:'329',t:Date.now()})},''],
   ['tudo junto, modo leve',{'cse-folds':'{"f":true,"b":true}','cse-lay-ext':'1','cse-fold-ext':'1'},'#predios','leve'],
 ];
 for(const [nome,ls,hash,perf] of estados){
   const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   await c.route(/gstatic|open-meteo|tiroteios/,r=>r.abort());
   await c.route('**workers.dev/',r=>{const ag=Date.now();r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({t:ag,onibus:am.onibus.map(o=>Object.assign({},o,{t:ag-(am.t-o.t)}))})})});
   await c.addInitScript(([ls,perf])=>{localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,perf:perf||'auto'}));Object.keys(ls).forEach(k=>localStorage.setItem(k,ls[k]))},[ls,perf]);
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
   await p.goto('http://localhost:8819/'+hash);await p.waitForTimeout(2500);
   const r=await p.evaluate(()=>({ct:!!document.querySelector('#ctsvg')||!document.querySelector('#fdBld[open]'),seg:!!document.getElementById('segBtn'),ruas:typeof document.getElementById('ruasFonte')}));
   ok(e.length===0&&r.seg,nome+': abre sem erro e carrega até as últimas partes '+JSON.stringify(e.slice(0,2)));
   if(ls['cse-lay-ext'])ok(await p.$$eval('#gLive .xlive',x=>x.length)>0,nome+': ônibus ao vivo no mapa');
   if(/b":true/.test(ls['cse-folds']||'')&&hash==='#predios'){await p.waitForTimeout(1500);ok(await p.evaluate(()=>!!document.querySelector('#fdBld[open] #ctsvg, #fdBld[open] .ctwrap')),nome+': a planta do CT aparece na seção aberta')}
   await c.close()}
 await b.close();srv.close();process.exit(falhou?1:0)})();
