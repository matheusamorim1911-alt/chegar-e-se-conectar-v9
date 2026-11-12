// Alertas de ônibus (src/js/39-alertas-onibus.js): criar pelo ponto ("Chegando agora"), pelo sino de um carro,
// pelo Seu trajeto e por Ajustes; o app avisa com ele aberto e manda a lista ao Worker para avisar com ele fechado.
const { chromium } = require('playwright');const servir=require('./servidor');const am=require('./amostra-onibus.json');
(async()=>{const srv=await servir(8827);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 async function abre(o){o=o||{};const c=await b.newContext({viewport:{width:1280,height:950},serviceWorkers:'block'});const posts=[];
   await c.route(/gstatic\.com\/firebasejs|open-meteo|tiroteios/,r=>r.abort());
   await c.route('**workers.dev/',r=>{const dt=Date.now()-am.t-15000;r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({t:Date.now(),onibus:am.onibus.map(x=>({...x,t:x.t+dt}))})})});
   await c.route('**workers.dev/push/**',r=>{const rota=r.request().url().split('/push/')[1];if(rota==='alertas')posts.push(JSON.parse(r.request().postData()));
     r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(rota==='chave'?{disponivel:true,chave:'B'+'A'.repeat(86)}:{ok:true,n:1})})});
   await c.addInitScript(o=>{if(!sessionStorage.j){sessionStorage.j=1;localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}));if(o.ext)localStorage.setItem('cse-lay-ext','1')}
     if(o.semPush)return;let perm='default';const sub={endpoint:'https://fcm.googleapis.com/fcm/send/ap1',options:{},unsubscribe:async()=>true};let atual=null;
     window.Notification=function(){};Object.defineProperty(window.Notification,'permission',{get:()=>perm});window.Notification.requestPermission=async()=>(perm='granted');window.PushManager=function(){};
     Object.defineProperty(navigator,'serviceWorker',{value:{ready:Promise.resolve({pushManager:{getSubscription:async()=>atual,subscribe:async()=>(atual=sub)}}),register:()=>Promise.resolve({}),addEventListener(){},controller:null}})},o);
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));p.on('console',m=>{if(/ALVERR/.test(m.text()))console.log(m.text())});await p.goto('http://localhost:8827/');await p.waitForTimeout(2500);return [c,p,e,posts]}
 const toast=p=>p.evaluate(()=>[...document.querySelectorAll('.gtoast,.toast,[role="status"]')].map(x=>x.textContent).join(' | '));
 // 1) pelo ponto: escolhe linha, antecedência e "sempre"
 let [c,p,e,posts]=await abre({ext:true});
 const ids=await p.$$eval('#map .mk.ext:not(.xlive)',x=>x.map(y=>y.dataset.id));let melhor=null;
 for(const id of ids.slice(0,40)){await p.evaluate(id=>document.querySelector('#map .mk.ext:not(.xlive)[data-id="'+id+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true})),id);await p.waitForTimeout(120);
   const n=await p.$$eval('#chgBox li',x=>x.length).catch(()=>0);if(!melhor||n>melhor.n)melhor={id,n}}
 await p.evaluate(id=>document.querySelector('#map .mk.ext:not(.xlive)[data-id="'+id+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true})),melhor.id);await p.waitForTimeout(400);
 ok(!!(await p.$('#chgBox [data-alvponto]'))&&(await p.$$('#chgBox [data-alvcarro]')).length===melhor.n,'"Chegando agora" tem o botão do alerta e um sino por ônibus');
 await p.click('#chgBox [data-alvponto]');await p.waitForTimeout(400);
 ok(!!(await p.$('#alvFolha'))&&await p.$$eval('#alvLinha option',x=>x.length>1&&x[0].textContent==='Qualquer linha'),'a folha deixa escolher a linha do ponto');
 const linha=await p.$eval('#alvLinha option:nth-child(2)',x=>x.value);await p.selectOption('#alvLinha',linha);
 await p.click('[data-alvmin="10"]');await p.click('[data-alvq="sempre"]');await p.waitForTimeout(150);await p.click('[data-alvd="todos"]');await p.fill('#alvDe','00:00');await p.fill('#alvAte','23:59');
 await p.click('#alvOk');await p.waitForTimeout(900);
 const g=await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-alertas-onibus')));
 ok(g.length===1&&g[0].tipo==='c'&&g[0].linhas[0]===linha&&g[0].min===10&&g[0].quando==='sempre'&&g[0].dias==='todos','guarda o alerta com linha, antecedência, dias e horário');
 const s1=posts[posts.length-1];
 ok(s1&&/aparelho|ap1/.test(s1.endpoint)&&s1.alertas.length===1&&s1.alertas[0].l[0]===linha&&s1.alertas[0].cor.length>=1&&s1.alertas[0].cor[0].length>=4&&s1.alertas[0].dias.length===7&&s1.alertas[0].ate===1439,'manda ao Worker o alerta com o trecho do traçado que chega ao ponto');
 ok(/mesmo com o app fechado/.test(await toast(p)),'confirma que o aviso chega com o app fechado');
 // 2) sino de um carro: alerta de uma vez, que dispara com o app aberto quando ele está a menos de 5 min
 const antes=posts.length;await p.evaluate(()=>{const s=document.querySelector('#chgBox [data-alvcarro]:not([disabled])');s&&s.click()});await p.waitForTimeout(900);
 const g2=await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-alertas-onibus')));
 ok(g2.length===2&&!!g2[1].carro&&g2[1].quando==='uma'&&posts.length>antes&&posts[posts.length-1].alertas.some(a=>a.v===g2[1].carro&&a.uma===1),'sino do carro cria um alerta só para ele, uma vez');
 await p.waitForTimeout(3000);
 ok(await p.evaluate(()=>!!document.querySelector('#chgBox .alv-sino.on')),'o sino fica marcado no carro com alerta');
 // 3) Ajustes: lista, desligar e apagar
 await p.click('#tab-cfg');await p.waitForTimeout(600);
 ok(await p.$$eval('#alvCfg .alv-item',x=>x.length)===2&&/10 min antes/.test(await p.textContent('#alvCfg')),'Ajustes › Alertas lista os alertas criados');
 await p.evaluate(()=>document.querySelector('#alvCfg [data-alvon]').click());await p.waitForTimeout(700);
 ok(posts[posts.length-1].alertas.length===1&&await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-alertas-onibus'))[0].on===false),'desligar um alerta tira do Worker sem apagar');
 for(let k=0;k<2;k++){await p.evaluate(()=>{const b=document.querySelector('#alvCfg [data-alvdel]');b&&b.click()});await p.waitForTimeout(700)}
 ok(posts[posts.length-1].alertas.length===0&&await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-alertas-onibus')).length===0)&&/Nenhum alerta criado/.test(await p.textContent('#alvCfg')),'apagar tira do aparelho e do Worker');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 // 4) linhas internas, pelo Seu trajeto
 [c,p,e,posts]=await abre();
 ok(!!(await p.$('#alvTrajeto')),'Seu trajeto tem "Avisar quando o ônibus estiver chegando"');
 await p.click('#alvTrajeto');await p.waitForTimeout(400);
 ok(/linhas internas, pelo horário estimado/.test(await p.textContent('#alvFolha')),'alerta das linhas internas usa o horário estimado');
 await p.click('[data-alvq="sempre"]');await p.waitForTimeout(150);await p.click('#alvOk');await p.waitForTimeout(900);
 const si=posts[posts.length-1];
 ok(si&&si.alertas[0].tipo==='i'&&si.alertas[0].horas.length>10&&si.alertas[0].dias.join()==='1,2,3,4,5','manda ao Worker os horários estimados do trajeto');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 // 5) sem notificações no navegador: o alerta vale com o app aberto
 [c,p,e,posts]=await abre({semPush:true});
 await p.click('#alvTrajeto');await p.waitForTimeout(300);await p.click('#alvOk');await p.waitForTimeout(9500);
 await p.click('#tab-cfg');await p.waitForTimeout(600);
 ok(posts.length===0&&/Por enquanto, só com o app aberto\. \S/.test(await p.textContent('#alvCfg'))&&await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-alertas-onibus')).length===1),'sem notificações: avisa que vale com o app aberto');await c.close();
 // 6) Worker antigo (sem a rota dos alertas): diz o motivo e deixa tentar de novo
 [c,p,e,posts]=await abre();
 await c.route('**workers.dev/push/alertas',r=>r.fulfill({status:404,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"erro":"rota desconhecida"}'}));
 await p.click('#alvTrajeto');await p.waitForTimeout(300);await p.click('#alvOk');await p.waitForTimeout(1200);
 ok(/Worker precisa ser publicado de novo na Cloudflare/.test(await toast(p)),'Worker sem a rota dos alertas: explica o motivo');
 await p.click('#tab-cfg');await p.waitForTimeout(600);
 ok(/Por enquanto, só com o app aberto/.test(await p.textContent('#alvCfg'))&&!!(await p.$('#alvCfg [data-alvtenta]')),'Ajustes mostra o motivo e o botão Tentar de novo');
 await c.unroute('**workers.dev/push/alertas');await p.click('#alvCfg [data-alvtenta]');await p.waitForTimeout(1200);
 ok(/Os avisos chegam mesmo com o app fechado/.test(await p.textContent('#alvCfg'))&&!(await p.$('#alvCfg .alv-aviso')),'depois de publicar o Worker, Tentar de novo liga o aviso com o app fechado');await c.close();
 await b.close();srv.close();process.exit(falhou?1:0)})();
