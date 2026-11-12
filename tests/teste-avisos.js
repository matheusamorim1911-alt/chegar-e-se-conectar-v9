// Notificações de tiroteio (src/js/32-avisos-tiroteio.js e o "push" do sw.js): ligar em Ajustes assina no Worker,
// o teste chega, desligar apaga a assinatura; permissão negada e iPhone sem instalar explicam o que fazer.
// O aviso que chega ao service worker é conferido aqui mesmo, rodando o sw.js com um "self" de mentira.
const { chromium } = require('playwright');const servir=require('./servidor');const fs=require('fs'),path=require('path');
(async()=>{const srv=await servir(8822);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
 const CHAVE='B'+'A'.repeat(86);
 async function abre(o){o=o||{};const c=await b.newContext({viewport:{width:1200,height:900},serviceWorkers:'block',userAgent:o.ua});
   const pedidos=[];
   await c.route(/gstatic\.com\/firebasejs/,r=>r.abort());await c.route(/open-meteo/,r=>r.abort());await c.route('**workers.dev/tiroteios**',r=>r.abort());
   await c.route('**workers.dev/',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({t:Date.now(),onibus:[]})}));
   await c.route('**workers.dev/push/**',r=>{const u=r.request().url(),rota=u.split('/push/')[1];pedidos.push({rota,corpo:r.request().postData(),tipo:r.request().headers()['content-type']});
     const J=(o,st)=>r.fulfill({status:st||200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
     if(rota==='chave')return o.semKv?J({disponivel:false,motivo:'sem-kv'},503):J({disponivel:true,chave:CHAVE});
     if(rota==='teste')return J({ok:true,status:201});return J({ok:true})});
   await c.addInitScript(o=>{if(sessionStorage.getItem('ja'))return;sessionStorage.setItem('ja','1');
     localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));if(o.guardado)localStorage.setItem('cse-push',JSON.stringify(o.guardado))},o);
   // navegador com notificações, mas sem serviço de push de verdade
   await c.addInitScript(o=>{let perm=o.perm||'default';window.__subs=0;window.__unsub=0;
     const sub={endpoint:'https://fcm.googleapis.com/fcm/send/aparelho1',options:{applicationServerKey:null},unsubscribe:async()=>{window.__unsub++;return true}};
     let atual=o.guardado?sub:null;
     const pm={getSubscription:async()=>atual,subscribe:async op=>{window.__subs++;window.__chave=Array.from(new Uint8Array(op.applicationServerKey)).length;sub.options.applicationServerKey=op.applicationServerKey.buffer;atual=sub;return sub}};
     sub.unsubscribe=async()=>{window.__unsub++;atual=null;return true};
     window.Notification=function(){};Object.defineProperty(window.Notification,'permission',{get:()=>perm});
     window.Notification.requestPermission=async()=>{if(perm==='default')perm=o.resposta||'granted';return perm};
     window.PushManager=function(){};
     Object.defineProperty(navigator,'serviceWorker',{value:{ready:Promise.resolve({pushManager:pm}),register:()=>Promise.resolve({}),addEventListener(){},controller:null,getRegistration:async()=>null}});},o);
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8822/');await p.waitForTimeout(1500);return [c,p,e,pedidos]}
 const msg=p=>p.evaluate(()=>(document.querySelector('#pushBox .push-msg')||{}).textContent||'');
 // 1) ligar, testar e desligar
 let [c,p,e,ped]=await abre();
 await p.click('#tab-cfg');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>{const t=document.getElementById('cfgPush');return !!t&&!t.checked&&!!t.closest('#tirosec')}),'Ajustes › Segurança no caminho tem "Notificar tiroteios novos", desligado');
 await p.click('label[for="cfgPush"]');await p.waitForTimeout(800);
 ok(/Pronto\. Você vai receber um aviso/.test(await msg(p))&&await p.isChecked('#cfgPush'),'ligar pede permissão, assina e confirma');
 const as=ped.find(x=>x.rota==='assinar');
 ok(ped[0].rota==='chave'&&as&&JSON.parse(as.corpo).endpoint==='https://fcm.googleapis.com/fcm/send/aparelho1'&&/text\/plain/.test(as.tipo),'manda ao Worker só o endereço do aparelho');
 ok(await p.evaluate(()=>window.__chave===65),'assina com a chave pública do Worker');
 ok(await p.evaluate(()=>{const g=JSON.parse(localStorage.getItem('cse-push'));const cfg=JSON.parse(localStorage.getItem('cse-cfg'));return g.on&&/aparelho1/.test(g.e)&&cfg.tiroteios===true&&document.getElementById('cfgTiro').checked}),'guarda no aparelho e liga também os tiroteios em Trajetos');
 await p.click('#pushTeste');await p.waitForTimeout(500);
 ok(ped.some(x=>x.rota==='teste')&&/Aviso de teste enviado/.test(await msg(p)),'"Mandar um teste" pede um aviso ao Worker');
 await p.click('label[for="cfgPush"]');await p.waitForTimeout(600);
 ok(ped.some(x=>x.rota==='sair')&&await p.evaluate(()=>!localStorage.getItem('cse-push')&&window.__unsub===1)&&/desligadas/.test(await msg(p)),'desligar cancela no aparelho e no Worker');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 // 2) já assinado: ao abrir de novo não grava outra vez no Worker
 [c,p,e,ped]=await abre({perm:'granted',guardado:{on:true,e:'https://fcm.googleapis.com/fcm/send/aparelho1',k:CHAVE,t:1}});
 await p.waitForTimeout(5500);
 ok(ped.filter(x=>x.rota==='assinar').length===0&&await p.evaluate(()=>window.__subs===0),'já assinado: abrir o app não grava de novo');await c.close();
 // permissão retirada nos ajustes do aparelho
 [c,p,e,ped]=await abre({perm:'denied',guardado:{on:true,e:'x',k:CHAVE,t:1}});
 await p.waitForTimeout(5500);await p.click('#tab-cfg');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>!localStorage.getItem('cse-push')&&!document.getElementById('cfgPush').checked)&&/bloqueadas para este site/.test(await msg(p)),'permissão retirada: desliga e explica como liberar');await c.close();
 // 3) recusar a permissão
 [c,p,e,ped]=await abre({resposta:'denied'});
 await p.click('#tab-cfg');await p.waitForTimeout(400);await p.click('label[for="cfgPush"]');await p.waitForTimeout(600);
 ok(!ped.some(x=>x.rota==='assinar')&&!(await p.isChecked('#cfgPush'))&&/bloqueadas para este site/.test(await msg(p)),'permissão negada: não assina e explica');await c.close();
 // 4) Worker sem o KV
 [c,p,e,ped]=await abre({semKv:true});
 await p.click('#tab-cfg');await p.waitForTimeout(400);await p.click('label[for="cfgPush"]');await p.waitForTimeout(600);
 ok(/ainda não foram ativadas no servidor/.test(await msg(p))&&!(await p.isChecked('#cfgPush')),'servidor sem notificações: avisa');await c.close();
 // 5) iPhone sem o app instalado
 [c,p,e,ped]=await abre({ua:IPHONE});
 await p.click('#tab-cfg');await p.waitForTimeout(400);
 ok(/só funcionam com o app na Tela de Início/.test(await p.textContent('#pushBox'))&&!(await p.$('#cfgPush')),'iPhone sem instalar: explica que precisa do app na Tela de Início');
 await p.click('#pushInst');await p.waitForTimeout(500);
 ok(!!(await p.$('#instFolha'))&&/Compartilhar/.test(await p.textContent('#instFolha')),'"Como instalar" abre o passo a passo');await c.close();
 await b.close();srv.close();

 // ---------- o aviso no service worker ----------
 const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
 let avisoBus=null;const pedAviso=[];
 async function chega(resp,falha){const h={},mostradas=[];
   const self={addEventListener:(t,f)=>{h[t]=f},registration:{scope:'https://site/app/',showNotification:async(t,o)=>{mostradas.push({t,o})}},clients:{matchAll:async()=>[],openWindow:async u=>{mostradas.push({abriu:u})}},skipWaiting(){}};
   self.registration.pushManager={getSubscription:async()=>({endpoint:'https://fcm.googleapis.com/fcm/send/ap1'})};
   const fetch=async(u,o)=>{if(falha)throw new Error('sem rede');if(/\/push\/aviso$/.test(u)){pedAviso.push(JSON.parse(o.body).endpoint);return {json:async()=>avisoBus||{nada:true}}}if(!/\/tiroteios$/.test(u))throw new Error('url '+u);return {json:async()=>resp}};
   new Function('self','fetch','caches','location',sw)(self,fetch,{},{origin:'https://site'});
   let espera;h.push({waitUntil:p=>{espera=p}});await espera;return {mostradas,h}}
 const agora=Date.now();
 let r=await chega({disponivel:true,ocorrencias:[{id:'a',t:agora-12*60e3,bairro:'Maré',local:'Av. Brasil, Maré'},{id:'b',t:agora-90*60e3,bairro:'Penha'}]});
 ok(r.mostradas[0].t==='Tiroteio perto do Fundão'&&r.mostradas[0].o.body==='Tiroteio há 12 min em Maré (Av. Brasil, Maré). 2 registros nas últimas 2 h. Evite a região se puder. Fonte: Fogo Cruzado.','aviso: onde e há quanto tempo, com a fonte');
 r=await chega({disponivel:true,ocorrencias:[{id:'c',t:agora-4*3600e3,bairro:'Penha'}]});
 ok(/Nenhum registro nas últimas 2 h/.test(r.mostradas[0].o.body),'aviso de teste (sem tiroteio recente): diz que está ligado');
 r=await chega(null,true);
 ok(r.mostradas[0].t==='Aviso do Chega aí UFRJ'&&/Abra o app/.test(r.mostradas[0].o.body),'sem internet para os detalhes: aviso genérico, sem inventar');
 let foco=0;r.h.notificationclick&&await new Promise(res=>{r.h.notificationclick({notification:{close(){},data:{url:'./'}},waitUntil:p=>p.then(res)})});
 ok(r.mostradas.some(x=>x.abriu==='https://site/app/'),'tocar no aviso abre o app');
 avisoBus={titulo:'485 chega em ~4 min',corpo:'Em CCMN - Geografia, a 900 m. Carro B1.',tag:'onibus-a1'};
 r=await chega({disponivel:true,ocorrencias:[{id:'a',t:agora-12*60e3,bairro:'Maré'}]});
 ok(r.mostradas[0].t==='485 chega em ~4 min'&&/a 900 m/.test(r.mostradas[0].o.body)&&r.mostradas[0].o.tag==='onibus-a1'&&pedAviso.includes('https://fcm.googleapis.com/fcm/send/ap1'),'aviso de ônibus: o texto vem do Worker (/push/aviso) e tem prioridade');
 process.exit(falhou?1:0)})();
