// Gestão › Saúde e estatísticas: confere cada serviço (simulado) e mostra a cota do Worker; atalho do BandejApp no RU.
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');const servir=require('./servidor');
const mock=fs.readFileSync(path.join(__dirname,'firebase-mock.js'),'utf8');
(async()=>{const srv=await servir(8813);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const agora=Date.now(),J=(r,o)=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
 const c=await b.newContext({viewport:{width:1100,height:900},serviceWorkers:'block'});
 await c.route(/gstatic\.com\/firebasejs\/.*app-compat\.js/,r=>r.fulfill({contentType:'text/javascript',body:mock}));
 await c.route(/gstatic\.com\/firebasejs\/.*(auth|firestore)-compat\.js/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await c.route(/open-meteo/,r=>J(r,{current:{temperature_2m:27.5}}));
 await c.route(/ipify/,r=>J(r,{ip:'146.164.1.1'}));
 await c.route('**workers.dev/tiroteios**',r=>J(r,{t:agora,disponivel:true,janelaH:6,atualizado:new Date(agora-3600e3).toISOString(),ocorrencias:[]}));
 await c.route('**workers.dev/saude**',r=>J(r,{t:agora,cloudflareConfigurado:true,cloudflare:{pedidos:42000,erros:2,limite:100000,desde:new Date(new Date().setUTCHours(0,0,0,0)).toISOString()}}));
 await c.route('**workers.dev/',r=>J(r,{t:agora,onibus:[{v:'A1',l:'321',la:-22.84,lo:-43.24,vel:20,dir:90,t:agora-30000}]}));
 await c.addInitScript(()=>{window.__fbstore={'meta/vagas':{n:1,max:80},'gestores/gestor@ufrj.br':{},'members/uG':{nome:'Gestora',email:'gestor@ufrj.br',first:Date.now()-86400e3,last:Date.now(),visits:5},
   'feedback/f1':{nota:4,tipo:'elogio',ts:Date.now()-3600e3},'erros/e1':{msg:'x',ts:Date.now()-3600e3}};
   window.__nextUser={uid:'uG',displayName:'Gestora',email:'gestor@ufrj.br',photoURL:'',emailVerified:true,providerData:[{providerId:'google.com'}]};
   localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',banner:false,login:false,flow:false}))});
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8813/');await p.waitForTimeout(2000);
 await p.click('[data-tab="predios"]');await p.waitForTimeout(500);await p.evaluate(()=>{const d=document.getElementById('fdFila');if(d&&!d.open)d.querySelector('summary').click()});await p.waitForTimeout(400);
 ok(await p.evaluate(()=>{const a=document.querySelector('#filabox a.bdj-link');return !!a&&a.href.indexOf('devmobufrj.github.io/BandejApp')>=0&&a.target==='_blank'}),'atalho do BandejApp junto à fila do RU');
 await p.route('**gravatar.com**',r=>r.abort());await p.click('#tab-cfg');await p.waitForTimeout(400);await p.click('#accsec [data-goo]');await p.waitForTimeout(1500);
 await p.evaluate(()=>document.getElementById('cfgClose').click());await p.waitForTimeout(300);
 await p.click('#gestBtn');await p.waitForTimeout(500);await p.click('.gtab[data-gtab="saude"]');await p.waitForTimeout(4000);
 const t=await p.evaluate(()=>document.getElementById('gBody').innerText);
 ok(/Saúde e estatísticas/.test(t)&&!/Verificando…/.test(t),'aba Saúde verifica todos os serviços');
 ok(/1 ônibus na região/.test(t)&&/Posição mais nova de 30 s/.test(t),'Worker e GPS da prefeitura');
 ok(/42\.000 de 100\.000 pedidos hoje \(42%\)/.test(t),'cota do Worker');
 ok(/Cota do Firebase/.test(t)&&/Abrir o console/.test(t),'Firebase: status e atalho para o uso no console');
 ok(/27,5 °C/.test(t)&&/0 registro\(s\) nas últimas 6 h/.test(t),'previsão do tempo e Fogo Cruzado');
 ok(/pessoas no total/.test(t)&&/nota média do app/.test(t),'estatísticas de uso e participação');
 const pills=await p.evaluate(()=>[...document.querySelectorAll('#gBody .sd-list .pill')].map(e=>e.textContent));
 ok(pills.length>=10&&!pills.includes('Fora do ar'),'nenhum serviço simulado aparece fora do ar '+JSON.stringify(pills));
 ok(errs.length===0,'sem erros de JavaScript '+JSON.stringify(errs));
 await (await p.$('#gBody')).screenshot({path:process.env.FOTO||'/tmp/saude.png'});
 // Worker caindo: quem está fora do ar, por quê, falhas por hora e tentativas com a prefeitura
 const h0=new Date();h0.setMinutes(0,0,0);
 await p.route('**workers.dev/',r=>r.abort('failed'));
 await p.route('**workers.dev/saude**',r=>J(r,{t:agora,cloudflareConfigurado:true,dataCenter:'GIG',cloudflare:{pedidos:769,erros:215,limite:100000,desde:new Date(new Date().setUTCHours(0,0,0,0)).toISOString()},
   cloudflareDetalhe:{porStatus:{success:554,exceededResources:190,scriptThrewException:5,clientDisconnected:20},porHora:[{h:new Date(h0-3600e3).toISOString(),pedidos:300,falhas:80},{h:h0.toISOString(),pedidos:469,falhas:115}],cpuMedianoMs:6.2,cpuP99Ms:15.4},
   registro:[{t:agora-120e3,r:'ok',n:40,fontes:[{f:'sppo',ok:true,ms:1800,kb:3650},{f:'brt',ok:true,ms:400,kb:280}]},{t:agora-60e3,r:'reserva',fontes:[{f:'sppo',ok:false,motivo:'a prefeitura não respondeu em 8 s',ms:8000},{f:'brt',ok:false,motivo:'a prefeitura respondeu HTTP 503 (erro no servidor dela)',ms:300}]}]}));
 await p.click('#sdCheck');await p.waitForTimeout(4000);
 const t2=await p.evaluate(()=>document.getElementById('gBody').innerText);
 ok(/Fora do ar agora/.test(t2)&&/O Worker não respondeu\. Quase sempre é o limite de processamento/.test(t2),'Worker caindo: aparece em "Fora do ar agora" com o motivo');
 ok(/Não dá para conferir agora: o Worker não respondeu\. Nas últimas 2 tentativas do Worker, 1 falhou/.test(t2),'a prefeitura não leva a culpa quando quem caiu foi o Worker');
 ok(/195 de 769 pedidos ao Worker falharam hoje/.test(t2)&&/190 passaram do limite de processamento da Cloudflare/.test(t2)&&/5 deram erro no código do Worker/.test(t2)&&/não é falha do Worker/.test(t2),'falhas de hoje por motivo, sem contar quem desistiu');
 ok(/15,4 ms \(o limite é 10 ms\)/.test(t2)&&await p.$$eval('.sd-hora',x=>x.length===2),'tempo de processamento e falhas por hora');
 ok(/Prefeitura: 1 de 2 tentativas falhou/.test(t2)&&/data center GIG/.test(t2)&&/não respondeu em 8 s/.test(t2)&&/usou a cópia guardada/.test(t2),'tentativas com a prefeitura, com o motivo de cada falha');
 await p.evaluate(()=>{const e=document.querySelector('.sd-fora');if(e)e.scrollIntoView()});await p.waitForTimeout(300);await p.screenshot({path:(process.env.FOTO||'/tmp/saude.png').replace('.png','-fora.png')});await p.evaluate(()=>{const e=document.querySelector('.sd-horas');if(e)e.scrollIntoView({block:'center'})});await p.waitForTimeout(300);await p.screenshot({path:(process.env.FOTO||'/tmp/saude.png').replace('.png','-falhas.png')});
 ok(errs.length===0,'sem erros de JavaScript com o Worker caindo '+JSON.stringify(errs));
 await b.close();srv.close();process.exit(falhou?1:0)})();
