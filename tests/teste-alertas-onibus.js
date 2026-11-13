// Avisos de ônibus (src/js/39-alertas-onibus.js): tudo se programa em Ajustes (até 5; ponto, internos e/ou da cidade,
// antecedência, dias e horário), o sino de cada carro avisa uma vez só e os botões dos painéis levam a Ajustes.
const { chromium } = require('playwright');const servir=require('./servidor');const am=require('./amostra-onibus.json');
(async()=>{const srv=await servir(8827);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 async function abre(o){o=o||{};const c=await b.newContext({viewport:{width:1280,height:950},serviceWorkers:'block'});const posts=[];
   await c.route(/gstatic\.com\/firebasejs|open-meteo|tiroteios/,r=>r.abort());
   await c.route('**workers.dev/',r=>{const dt=Date.now()-am.t-15000;r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({t:Date.now(),onibus:am.onibus.map(x=>({...x,t:x.t+dt}))})})});
   await c.route('**workers.dev/push/**',r=>{const rota=r.request().url().split('/push/')[1];let corpo={};try{corpo=JSON.parse(r.request().postData()||'{}')}catch(x){}
     if(rota==='alertas')posts.push(corpo);if(rota==='teste')posts.teste=corpo;
     const feitos=rota==='alertas'&&o.feitos?(corpo.alertas||[]).filter(a=>a.uma).map(a=>a.id):[];
     r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(rota==='chave'?{disponivel:true,chave:'B'+'A'.repeat(86)}:{ok:true,n:1,feitos})})});
   await c.addInitScript(o=>{if(!sessionStorage.j){sessionStorage.j=1;localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}));if(o.ext)localStorage.setItem('cse-lay-ext','1')}
     if(o.semPush)return;let perm=o.granted?'granted':'default';const sub={endpoint:'https://fcm.googleapis.com/fcm/send/ap1',options:{},unsubscribe:async()=>true};let atual=o.granted?sub:null;
     window.Notification=function(){};Object.defineProperty(window.Notification,'permission',{get:()=>perm});window.Notification.requestPermission=async()=>(perm='granted');window.PushManager=function(){};
     Object.defineProperty(navigator,'serviceWorker',{value:{ready:Promise.resolve({pushManager:{getSubscription:async()=>atual,subscribe:async()=>(atual=sub)}}),register:()=>Promise.resolve({}),addEventListener(){},controller:null}})},o);
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));p.on('console',m=>{if(/ALVERR/.test(m.text()))console.log(m.text())});await p.goto('http://localhost:8827/');await p.waitForTimeout(2500);return [c,p,e,posts]}

 const cfg=async p=>{if(await p.$('#pane-cfg[hidden]'))await p.click('#tab-cfg');await p.waitForTimeout(500)};
 // 1) começa do zero: só em Ajustes, sem as opções antigas
 let [c,p,e,posts]=await abre({ext:true});
 await p.evaluate(()=>localStorage.setItem('cse-alertas-onibus','[{"id":"velho"}]'));await p.reload();await p.waitForTimeout(2000);
 await cfg(p);
 ok(!!(await p.$('#alvsec'))&&/Nenhum aviso programado/.test(await p.textContent('#alvsec')),'Ajustes tem "Avisos de ônibus", vazio');
 ok(!(await p.$('#cfgAlOn'))&&!(await p.$('[data-almin]')),'as opções antigas do trajeto favorito saíram de Alertas');
 // 2) criar: ponto, internos e/ou cidade, antecedência, dias e horário
 await p.click('[data-alvnovo]');await p.waitForTimeout(300);
 const op=await p.$$eval('#alvPonto option',x=>x.map(o=>({v:o.value,t:o.textContent})));
 const junto=op.find(o=>/UFRJ e cidade/.test(o.t)),so=op.find(o=>/\(cidade\)/.test(o.t));
 ok(!!junto&&!!so,'a lista junta parada da UFRJ e ponto da cidade no mesmo lugar (e mostra os que só têm um tipo)');
 await p.selectOption('#alvPonto',junto.v);await p.waitForTimeout(200);
 ok(await p.$eval('[data-alvint]',x=>x.getAttribute('aria-pressed')==='true'&&!x.disabled)&&await p.$eval('[data-alvext]',x=>x.getAttribute('aria-pressed')==='true'&&!x.disabled),'ponto junto: internos e da cidade vêm ligados');
 await p.selectOption('#alvPonto',so.v);await p.waitForTimeout(200);
 ok(await p.$eval('[data-alvint]',x=>x.disabled)&&await p.$eval('[data-alvext]',x=>x.getAttribute('aria-pressed')==='true'),'ponto só da cidade: internos desabilitado');
 await p.selectOption('#alvPonto',junto.v);await p.waitForTimeout(200);
 await p.click('[data-alvmin="10"]');await p.click('[data-alvd="todos"]');await p.fill('#alvDe','00:00');await p.fill('#alvAte','23:59');await p.click('#alvSalvar');await p.waitForTimeout(1200);
 const g=await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-avisos-onibus')));
 ok(g.c.length===1&&g.c[0].min===10&&g.c[0].dias==='todos'&&g.c[0].int&&g.c[0].ext,'guarda o aviso com ponto, tipos, antecedência, dias e horário');
 ok(await p.evaluate(()=>localStorage.getItem('cse-alertas-onibus')===null),'a lista antiga é apagada');
 const s1=posts[posts.length-1];
 ok(s1&&s1.alertas.some(a=>a.tipo==='c'&&a.cor.length>=1&&a.dias.length===7&&a.ate===1439&&a.min===10)&&s1.alertas.some(a=>a.tipo==='i'&&a.horas.length>5&&a.min===10),'manda ao Worker um aviso da cidade (traçado) e um interno (horários)');
 ok(/Os avisos chegam mesmo com o app fechado/.test(await p.textContent('#alvsec')),'confirma que chega com o app fechado');
 // 3) editar
 await p.click('[data-alved]');await p.waitForTimeout(300);await p.click('[data-alvmin="3"]');await p.click('#alvSalvar');await p.waitForTimeout(900);
 ok(await p.evaluate(()=>{const g=JSON.parse(localStorage.getItem('cse-avisos-onibus'));return g.c.length===1&&g.c[0].min===3}),'editar salva no mesmo aviso');
 // 4) só internos: um alerta só ao Worker
 await p.click('[data-alvnovo]');await p.waitForTimeout(200);await p.selectOption('#alvPonto',junto.v);await p.click('[data-alvext]');await p.click('#alvSalvar');await p.waitForTimeout(900);
 ok(posts[posts.length-1].alertas.filter(a=>a.tipo==='i').length===2&&posts[posts.length-1].alertas.filter(a=>a.tipo==='c').length===1,'aviso só de internos manda só o alerta interno');
 // 5) limite de 5
 for(let i=0;i<3;i++){await p.click('[data-alvnovo]');await p.waitForTimeout(150);await p.click('#alvSalvar');await p.waitForTimeout(500)}
 ok(!(await p.$('[data-alvnovo]'))&&/Limite de 5 avisos/.test(await p.textContent('#alvsec'))&&(await p.$$('#alvsec .alv-item')).length===5,'no máximo 5 avisos: some o botão e explica');
 // 6) teste
 await p.click('#alvTeste');await p.waitForTimeout(900);
 ok(posts.teste&&posts.teste.tipo==='onibus'&&/Teste enviado/.test(await p.textContent('#alvsec')),'"Mandar um teste" pede o aviso de teste de ônibus ao Worker');
 // 7) apagar
 for(let i=0;i<5;i++){await p.click('#alvsec [data-alvdel]');await p.waitForTimeout(250)}
 ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-avisos-onibus')).c.length===0)&&posts[posts.length-1].alertas.length===0,'apagar tudo limpa o aparelho e o Worker');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 // 8) o mapa: um marcador só nos pontos que são o mesmo lugar; o painel da parada leva a Ajustes
 [c,p,e,posts]=await abre({ext:true});
 ok(await p.evaluate(()=>{const g=document.getElementById('gExt'),m=g&&g.querySelectorAll('.mk.xmerge');return !!g&&g.classList.contains('dup')&&m.length>0&&[...m].every(x=>getComputedStyle(x).display==='none')}),'ponto da cidade no mesmo lugar de parada da UFRJ: marcador duplicado some do mapa');
 await cfg(p);const jv=(await p.$$eval('#alvPonto option',x=>x.map(o=>({v:o.value,t:o.textContent})))).length;
 await p.click('[data-alvnovo]');const junto2=(await p.$$eval('#alvPonto option',x=>x.map(o=>({v:o.value,t:o.textContent})))).find(o=>/UFRJ e cidade/.test(o.t));await p.click('#cfgClose');await p.waitForTimeout(500);
 const sid=junto2.v.slice(2);
 await p.evaluate(id=>document.querySelector('#map .mk[data-kind="stop"][data-id="'+id+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true})),sid);await p.waitForTimeout(500);
 ok(!!(await p.$('#detail .alv-ponto[data-alvir]'))&&!!(await p.$('#detail #chgBox')),'a parada da UFRJ que também é ponto da cidade mostra "Chegando agora" e o botão que leva a Ajustes');
 await p.click('#detail .alv-ponto');await p.waitForTimeout(700);
 ok(!(await p.$('#pane-cfg[hidden]'))&&!!(await p.$('#alvForm'))&&await p.$eval('#alvPonto',x=>x.value)===junto2.v,'o botão abre Ajustes já no aviso novo, com aquele ponto');
 await p.click('#alvCancela');await p.click('#cfgClose');await p.waitForTimeout(400);
 ok(!!(await p.$('#alvTrajeto[data-alvir]')),'Seu trajeto tem o botão que leva a Ajustes');
 // 9) sininho: um aviso de uma vez
 const ids=await p.$$eval('#map .mk.ext:not(.xlive)',x=>x.map(y=>y.dataset.id));let melhor=null;
 for(const id of ids.slice(0,40)){await p.evaluate(id=>document.querySelector('#map .mk.ext:not(.xlive)[data-id="'+id+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true})),id);await p.waitForTimeout(120);
   const n=await p.$$eval('#chgBox [data-alvsino]',x=>x.length).catch(()=>0);if(!melhor||n>melhor.n)melhor={id,n}}
 await p.evaluate(id=>document.querySelector('#map .mk.ext:not(.xlive)[data-id="'+id+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true})),melhor.id);await p.waitForTimeout(500);
 ok(melhor.n>0,'"Chegando agora" tem um sino por ônibus');
 await p.click('#chgBox [data-alvsino]:not([disabled])');await p.waitForTimeout(1200);
 const u=posts[posts.length-1];
 ok(u&&u.alertas.length===1&&u.alertas[0].uma===1&&u.alertas[0].v&&u.alertas[0].cor.length>=1&&u.alertas[0].min===5,'o sino manda ao Worker um aviso de uma vez para aquele carro');
 ok(await p.evaluate(()=>{const g=JSON.parse(localStorage.getItem('cse-avisos-onibus'));return g.c.length===0&&g.u.length===1})&&await p.$eval('#chgBox .alv-sino.on',x=>x.disabled),'o sino fica ligado e não conta nos 5 de Ajustes');
 ok(e.length===0,'sem erros de JavaScript (mapa) '+JSON.stringify(e));await c.close();
 // 10) o Worker já avisou: o sino volta a ficar desligado
 [c,p,e,posts]=await abre({ext:true,feitos:true,granted:true});
 await p.evaluate(()=>localStorage.setItem('cse-avisos-onibus',JSON.stringify({c:[],u:[{id:'ax1',ponto:'a_est',carro:'B1',linhas:['485'],min:5,fim:Date.now()+36e5,nome:'x'}]})));
 await p.reload();await p.waitForTimeout(7500);
 ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-avisos-onibus')).u.length===0),'depois que o Worker avisa, o aviso de uma vez sai do aparelho (o sino desliga)');
 ok(e.length===0,'sem erros de JavaScript (feitos) '+JSON.stringify(e));await c.close();
 await b.close();srv.close();process.exit(falhou?1:0)})();
