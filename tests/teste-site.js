// Carrega o site como o GitHub Pages serve e confere: sem erros de JavaScript, sem arquivos faltando,
// mapa e abas aparecem, app instalável (manifesto + service worker) e abre sem internet.
// Rodar: npm test   (antes, uma vez: npm install && npx playwright install chromium)
const { chromium } = require('playwright');const servir=require('./servidor');
(async()=>{const srv=await servir(8799);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const c=await b.newContext({viewport:{width:430,height:860},colorScheme:'dark'});
 await c.route(/gstatic\.com\/firebasejs/,r=>r.abort());await c.route(/open-meteo/,r=>r.abort());
 await c.addInitScript(()=>{if(!sessionStorage.getItem('x')){sessionStorage.setItem('x',1);localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}))}});
 const p=await c.newPage();const errs=[],faltando=[];p.on('pageerror',e=>errs.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://localhost'))faltando.push(r.url())});
 await p.goto('http://localhost:8799/');await p.waitForTimeout(2500);
 ok(await p.evaluate(()=>!!document.querySelector('#map .mk')),'mapa com pontos');
 ok((await p.$$('.tabs [data-tab]')).length>=4,'abas presentes');
 ok(await p.evaluate(()=>{const g=document.querySelector('#baseimg #gEdif');return !!g&&g.getAttribute('d').split('M').length>100}),'prédios que faltavam na planta desenhados (CENPES II, IEN…)');
 ok(await p.evaluate(async()=>{const m=await (await fetch('manifest.json')).json();return m.icons.length>=3}),'manifesto com ícones');
 await p.reload();await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>!!navigator.serviceWorker.controller),'service worker ativo');
 await c.setOffline(true);await p.reload();await p.waitForTimeout(2000);
 ok(await p.evaluate(()=>!!document.querySelector('#map .mk')),'abre sem internet');
 await c.setOffline(false);
 await p.click('#glossBtn');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>!document.getElementById('glossM').hidden&&document.querySelectorAll('#glList .gl-item').length>10),'glossário abre com as siglas');
 await p.click('#glClose');await p.waitForTimeout(400);
 await p.click('#tab-cfg');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>!document.getElementById('pane-cfg').hidden),'Ajustes abre');
 ok(errs.length===0,'sem erros de JavaScript '+(errs.length?JSON.stringify(errs):''));
 ok(faltando.length===0,'sem arquivos faltando '+(faltando.length?JSON.stringify(faltando):''));
 // abrir direto em cada aba pelo endereço (ex.: #predios) não pode quebrar a carga
 for(const h of ['predios','grade','cal','trajeto','siglas']){
   const c2=await b.newContext({viewport:{width:430,height:860},serviceWorkers:'block'});await c2.route(/gstatic\.com\/firebasejs/,r=>r.abort());await c2.route(/open-meteo|workers\.dev/,r=>r.abort());
   await c2.addInitScript(()=>{localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}))});
   const p2=await c2.newPage();const e2=[];p2.on('pageerror',e=>e2.push(e.message));await p2.goto('http://localhost:8799/#'+h);await p2.waitForTimeout(1500);
   const aba=await p2.evaluate(h=>h==='siglas'?(document.getElementById('glossM').hidden?'':'siglas'):[...document.querySelectorAll('.tabs [data-tab][aria-selected="true"]')].map(b=>b.dataset.tab).join(),h);
   ok(e2.length===0&&aba===h,'abre direto em #'+h+(e2.length?' '+JSON.stringify(e2):''));await c2.close();
 }
 await b.close();srv.close();process.exit(falhou?1:0)})();
