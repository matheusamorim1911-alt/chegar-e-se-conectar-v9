// Ônibus chegando e legenda do ao vivo (33), perfil de uso e Volta à noite para a Vila (34), avisos na capa (35)
// e escolha do idioma (36).
const { chromium } = require('playwright');const servir=require('./servidor');const am=require('./amostra-onibus.json');
(async()=>{const srv=await servir(8824);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 async function abre(o){o=o||{};const c=await b.newContext({viewport:{width:o.w||1280,height:950},serviceWorkers:'block'});
   await c.route(/gstatic\.com\/firebasejs/,r=>r.abort());await c.route(/open-meteo/,r=>r.abort());
   await c.route('**workers.dev/tiroteios**',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({disponivel:true,janelaH:6,atualizado:'',ocorrencias:o.tiro?[{id:'a',t:Date.now()-35*60e3,la:-22.86,lo:-43.24,bairro:'Maré',local:'Av. Brasil'}]:[]})}));
   await c.route('**workers.dev/push/**',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"disponivel":false}'}));
   await c.route('**workers.dev/',r=>{const dt=Date.now()-am.t-15000;r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({t:Date.now(),onibus:am.onibus.map(x=>({...x,t:x.t+dt}))})})});
   await c.addInitScript(o=>{if(sessionStorage.j)return;sessionStorage.j=1;localStorage.setItem('cse-cfg',JSON.stringify(Object.assign({cover:'none',login:false,banner:false,flow:false},o.cfg||{})));
     localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}));if(o.ext)localStorage.setItem('cse-lay-ext','1');if(o.uso)localStorage.setItem('cse-uso',JSON.stringify(o.uso));if(o.perfil)localStorage.setItem('cse-perfil',JSON.stringify({name:'Ana',pin:null}));
     if(o.push){window.Notification=function(){};Object.defineProperty(Notification,'permission',{get:()=>'default'});Notification.requestPermission=async()=>'denied';window.PushManager=function(){};
       Object.defineProperty(navigator,'serviceWorker',{value:{ready:new Promise(()=>{}),register:()=>Promise.resolve({}),addEventListener(){}}})}},o);
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8824/');await p.waitForTimeout(o.espera||2500);return [c,p,e]}
 // 1) chegando e legenda
 let [c,p,e]=await abre({ext:true});
 const ids=await p.$$eval('#map .mk.ext:not(.xlive)',x=>x.map(y=>y.dataset.id));let melhor=null;
 for(const id of ids.slice(0,40)){await p.evaluate(id=>document.querySelector('#map .mk.ext:not(.xlive)[data-id="'+id+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true})),id);await p.waitForTimeout(120);
   const n=await p.$$eval('#chgBox li',x=>x.length).catch(()=>0);if(!melhor||n>melhor.n)melhor={id,n}}
 ok(!!(await p.$('#chgBox')),'ponto de ônibus da cidade mostra "Chegando agora"');
 await p.evaluate(id=>document.querySelector('#map .mk.ext:not(.xlive)[data-id="'+id+'"]').dispatchEvent(new MouseEvent('click',{bubbles:true})),melhor.id);await p.waitForTimeout(400);
 const chg=await p.textContent('#chgBox');
 ok(melhor.n>0&&/(~\d+ min|menos de 1 min|chegando)/.test(chg)&&/ a \d+( m|,\d km| km)/.test(chg)&&/carro /.test(chg),'lista os ônibus ao vivo vindo para o ponto, com tempo e distância: '+chg.slice(14,90));
 await p.click('#chgBox [data-chgseg]');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>{const s=document.getElementById('segCard');return !!s&&!s.hidden}),'"Seguir" na lista passa a seguir o ônibus');
 ok(await p.evaluate(()=>{const g=document.getElementById('lgVivo');return !!g&&!g.hidden&&/Ônibus ao vivo/.test(g.textContent)&&/Anel verde/.test(g.textContent)}),'legenda tem os itens do ao vivo com a camada ligada');
 await p.evaluate(()=>{const t=document.querySelector('[data-layer="ext"]');t&&t.click()});await p.waitForTimeout(400);
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 [c,p,e]=await abre();
 ok(await p.evaluate(()=>document.getElementById('lgVivo').hidden),'sem a camada "Ônibus da cidade", a legenda não mostra o ao vivo');await c.close();
 // 2) perfil de uso
 [c,p,e]=await abre({perfil:true,espera:6500,w:390});
 ok(!!(await p.$('#usoFolha')),'com perfil e sem resposta, pergunta como a pessoa usa o Fundão');
 await p.click('#usoFolha [data-uso="vila"]');await p.waitForTimeout(150);
 ok(!(await p.isChecked('#usoGrade')),'só morador da Vila: a aba Grade vem desligada');
 await p.click('#usoOk');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>{const t=document.getElementById('tab-grade');return (t.hidden||getComputedStyle(t).display==='none')&&JSON.parse(localStorage.getItem('cse-uso')).vila===true}),'salva e esconde a aba Grade');
 await p.evaluate(()=>document.querySelector('[data-kind="night"]').click());await p.waitForTimeout(500);await p.selectOption('#nightFrom','est');await p.waitForTimeout(400);
 let nt=await p.textContent('#detail');
 ok(/Último ônibus daqui para a Vila Residencial \(ponto /.test(nt)&&/min a pé/.test(nt),'Volta à noite de morador leva ao ponto mais perto da Vila, com a caminhada');
 await p.click('[data-nightest]');await p.waitForTimeout(400);
 ok(/Você já está na Estação BRT/.test(await p.textContent('#detail')),'dá para ver a volta para a Estação BRT quando for sair da ilha');
 await p.click('#tab-cfg');await p.waitForTimeout(500);
 ok(/Moro na Vila Residencial/.test(await p.textContent('#usoCfg')),'Ajustes › Perfil mostra a resposta e deixa mudar');
 await p.click('#usoCfg [data-usoabre]');await p.waitForTimeout(300);await p.click('#usoFolha [data-uso="vila"]');await p.click('#usoFolha [data-uso="estuda"]');await p.check('#usoGrade');await p.click('#usoOk');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>{const t=document.getElementById('tab-grade');return !t.hidden&&getComputedStyle(t).display!=='none'}),'estudante: a aba Grade volta');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 [c,p,e]=await abre({espera:6000});
 ok(!(await p.$('#usoFolha')),'sem perfil (só consultando), não pergunta');await c.close();
 // 3) capa: tiroteio e notificações
 [c,p,e]=await abre({cfg:{cover:'folha',tiroteios:true},tiro:true,push:true,espera:4000,w:390});
 const cv=await p.textContent('#cvAvisos');
 ok(/Tiroteio há 3\d min em Maré/.test(cv)&&await p.evaluate(()=>document.getElementById('cvTiro').classList.contains('vermelho')),'capa mostra o tiroteio recente em vermelho');
 ok(!(await p.$('#cvPush'))&&!/notificações/i.test(cv),'capa: sem o botão das notificações (ficam em Ajustes)');
 await p.click('#cvTiro');await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>document.getElementById('cover').hidden&&!!document.getElementById('fdTiro')&&document.getElementById('fdTiro').open),'tocar no alerta da capa abre os detalhes em Trajetos');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 // 4) idioma
 [c,p,e]=await abre({cfg:{cover:'folha'},espera:3000,w:390});
 await p.click('#cvIdioma [data-idioma="en"]');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.documentElement.lang==='en'&&/Open the map/.test(document.getElementById('cover').textContent)&&/Where are you going today\?/.test(document.getElementById('cover').textContent)),'inglês escolhido na capa traduz a capa');
 await p.waitForTimeout(700);
 ok(!(await p.$('#cvIdioma'))&&await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-cfg')).idiomaOk===true),'depois da escolha, as opções de idioma somem da capa e a resposta fica guardada');
 await p.click('[data-cv="mapa"]');await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>document.getElementById('tab-trajeto').textContent.trim()==='Routes'&&/Your route/.test(document.getElementById('pane-trajeto').textContent)&&document.getElementById('segBtn').textContent.trim()==='Find a bus'),'abas e painel em inglês');
 ok(await p.evaluate(()=>/Line 1 · towards |Line \d/.test(document.getElementById('pane-trajeto').textContent)&&JSON.parse(localStorage.getItem('cse-cfg')).idioma==='en'),'textos montados ("Linha 1 · sentido …") também; a escolha fica guardada');
 await p.click('#tab-cfg');await p.waitForTimeout(600);await p.click('#idiSec [data-idioma="es"]');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.getElementById('tab-trajeto').textContent.trim()==='Trayectos'&&document.documentElement.lang==='es'),'troca para espanhol sem recarregar');
 await p.click('#idiSec [data-idioma="pt"]');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.getElementById('tab-trajeto').textContent.trim()==='Trajetos'&&document.documentElement.lang==='pt-BR'&&document.querySelector('#idiSec h2').textContent==='Idioma'),'volta para português');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));
 await p.reload();await p.waitForTimeout(2500);
 ok(!(await p.$('#cvIdioma'))&&await p.evaluate(()=>document.documentElement.lang==='pt-BR'),'abrindo de novo, a capa não pergunta o idioma outra vez');await c.close();
 // escolher o português (que já estava) também conta como resposta
 [c,p,e]=await abre({cfg:{cover:'folha'},espera:3000,w:390});
 await p.click('#cvIdioma [data-idioma="pt"]');await p.waitForTimeout(900);
 ok(!(await p.$('#cvIdioma'))&&await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-cfg')).idiomaOk===true&&document.documentElement.lang==='pt-BR'),'escolher português na capa também guarda a resposta');
 // quem já tinha trocado o idioma antes desta versão não é perguntado
 await c.close();[c,p,e]=await abre({cfg:{cover:'folha',idioma:'es'},espera:3000,w:390});
 ok(!(await p.$('#cvIdioma'))&&await p.evaluate(()=>document.documentElement.lang==='es'),'quem já usava outro idioma não vê a pergunta');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 // portal da UFRJ na capa: só para quem disse que estuda na UFRJ
 [c,p,e]=await abre({cfg:{cover:'folha'},uso:{estuda:true,t:1},espera:3500});
 const por=await p.$('#cvPortal');
 ok(!!por&&await por.getAttribute('href')==='https://portal.ufrj.br/Portal/acesso?cid=8475'&&await por.getAttribute('target')==='_blank'&&/noopener/.test(await por.getAttribute('rel')),'capa: quem estuda na UFRJ vê o botão do portal, que abre em outra aba');
 ok(await p.$eval('#cvPortal',x=>{const s=getComputedStyle(x);return s.backgroundColor==='rgba(0, 0, 0, 0)'&&/52, 199, 89/.test(s.color)})&&await p.$eval('#cvPortal .cv-av-ic svg',x=>!!x),'o botão é transparente, verde e tem ícone (sem o brasão)');
 await c.close();
 [c,p,e]=await abre({cfg:{cover:'folha'},uso:{vila:true,t:1},espera:3500});
 ok(!(await p.$('#cvPortal')),'capa: quem não marcou "Estudo na UFRJ" não vê o botão');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 await b.close();srv.close();process.exit(falhou?1:0)})();
