// Ônibus ao vivo sincronizados com a prefeitura do Rio: o app marca o próximo pedido para logo depois de quando o
// Worker diz que sai a posição nova (cabeçalho x-prox); sem o cabeçalho (Worker antigo), continua de 10 em 10 s.
const { chromium } = require('playwright');const servir=require('./servidor');
(async()=>{const srv=await servir(8826);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 async function mede(prox,espera){const c=await b.newContext({viewport:{width:1000,height:800},serviceWorkers:'block'});const T=[];
   await c.route(/gstatic\.com\/firebasejs|open-meteo|tiroteios/,r=>r.abort());
   await c.route('**workers.dev/',r=>{T.push(Date.now());const h={'access-control-allow-origin':'*','access-control-expose-headers':'x-prox'};if(prox!=null)h['x-prox']=String(prox);
     r.fulfill({contentType:'application/json',headers:h,body:JSON.stringify({t:Date.now(),onibus:[]})})});
   await c.addInitScript(()=>{localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false}));localStorage.setItem('cse-lay-ext','1');localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}))});
   const p=await c.newPage();await p.goto('http://localhost:8826/');await p.waitForTimeout(espera);await c.close();
   const d=[];for(let i=1;i<T.length;i++)d.push(T[i]-T[i-1]);return d}
 let d=await mede(3000,14000);
 ok(d.length>=3&&d.every(x=>x>=3300&&x<=4300),'com x-prox de 3 s, pede de novo logo depois (3,4 a 4 s): '+d.join(', '));
 d=await mede(0,9000);
 ok(d.length>=2&&d.every(x=>x>=1900&&x<=2600),'nunca mais de um pedido a cada 2 s: '+d.join(', '));
 d=await mede(null,22000);
 ok(d.length>=1&&d.every(x=>x>=9500&&x<=10800),'Worker antigo (sem x-prox): de 10 em 10 s: '+d.join(', '));
 await b.close();srv.close();process.exit(falhou?1:0)})();
