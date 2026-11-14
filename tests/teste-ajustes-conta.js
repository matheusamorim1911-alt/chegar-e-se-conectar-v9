// Avisos de ônibus pela conta e personalização por aparelho (src/js/39-alertas-onibus.js, 46-ajustes-por-aparelho.js),
// com o Firebase simulado: o aparelho A grava, o aparelho B (outro navegador, mesma conta) recebe.
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');const servir=require('./servidor');
const mock=fs.readFileSync(path.join(__dirname,'firebase-mock.js'),'utf8');
const USER={uid:'uA',displayName:'Aluna',email:'aluna@ufrj.br',photoURL:'',emailVerified:true,providerData:[{providerId:'google.com'}]};
const AVISO={id:'a1',st:'hu',int:true,ext:false,li:[],lc:[],min:5,dias:'uteis',hDe:'06:00',hAte:'22:00',on:true};
(async()=>{const srv=await servir(8855);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 async function aparelho(o){
   const c=await b.newContext({viewport:{width:1200,height:900},serviceWorkers:'block'});
   await c.route(/gstatic\.com\/firebasejs\/.*app-compat\.js/,r=>r.fulfill({contentType:'text/javascript',body:mock}));
   await c.route(/gstatic\.com\/firebasejs\/.*(auth|firestore)-compat\.js/,r=>r.fulfill({contentType:'text/javascript',body:''}));
   await c.route(/open-meteo|workers\.dev|gravatar/,r=>r.abort());
   await c.addInitScript(o=>{window.__nextUser=o.user;if(sessionStorage.j)return;sessionStorage.j=1;window.__fbstore=o.loja||{};
     localStorage.setItem('cse-cfg',JSON.stringify(Object.assign({cover:'none',banner:false,login:false,flow:false},o.cfg)));localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}));
     if(o.pers0)localStorage.setItem('cse-pers-conta','0');if(o.avisos)localStorage.setItem('cse-avisos-onibus',JSON.stringify({c:o.avisos,u:[]}))},Object.assign({user:USER},o));
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8855/');await p.waitForTimeout(1800);
   await p.click('#tab-cfg');await p.waitForTimeout(400);await p.click('#accsec [data-goo]');await p.waitForTimeout(2200);
   return {c,p,e};
 }
 const conta=p=>p.evaluate(()=>(window.__fbstore['usuarios/uA']||{}).cfg||{});
 const local=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('cse-cfg')));
 // aparelho A: aviso de antes (só no aparelho) entra na conta
 const A=await aparelho({cfg:{tema:'escuro'},avisos:[AVISO]});
 let cA=await conta(A.p);
 ok((cA.avisos||[]).some(a=>a.id==='a1'&&!a.x&&a.t),'o aviso de ônibus deste aparelho vai para a conta');
 ok(cA.tema==='escuro','com a opção ligada (padrão), a personalização vai para a conta');
 ok(!!(await A.p.$('#cfgPersConta'))&&await A.p.isChecked('#cfgPersConta'),'Ajustes › Conta tem "Mesma personalização em todos os aparelhos", ligado');
 // A desliga a opção e muda o tema: a conta não muda
 await A.p.click('label[for="cfgPersConta"]');await A.p.waitForTimeout(300);
 await A.p.evaluate(()=>{const d=document.getElementById('temadet');if(d)d.open=true});await A.p.click('[data-tema="claro"]');await A.p.waitForTimeout(1500);
 cA=await conta(A.p);
 const lA=await local(A.p);ok(lA.tema==='claro'&&cA.tema==='escuro','desligada, o tema muda só neste aparelho (conta continua com "escuro")');
 ok((cA.avisos||[]).some(a=>a.id==='a1'),'os avisos continuam na conta mesmo com a personalização só no aparelho');
 const loja=await A.p.evaluate(()=>JSON.parse(JSON.stringify(window.__fbstore)));
 // aparelho B: mesma conta, outro tema guardado nele
 const B=await aparelho({cfg:{tema:'sistema'},loja});
 const lB=await local(B.p),avB=await B.p.evaluate(()=>JSON.parse(localStorage.getItem('cse-avisos-onibus')||'{}'));
 ok((avB.c||[]).some(a=>a.id==='a1'&&a.st==='hu'),'o aviso aparece no outro aparelho (B), vindo da conta');
 ok(/Avisos de ônibus|hu|Hospital/.test(await B.p.textContent('#alvsec')),'Ajustes › Avisos de ônibus de B mostra o aviso');
 ok(lB.tema==='escuro','B, com a opção ligada, recebe a personalização da conta');
 // ao vivo: outro aparelho grava um aviso novo na conta enquanto B está aberto
 await B.p.evaluate(()=>{const db=firebase.firestore(),ref=db.collection('usuarios').doc('uA');return ref.get().then(d=>{const x=d.data(),c=Object.assign({},x.cfg);
   c.avisos=(c.avisos||[]).concat([{id:'a2',st:'ccmn',int:true,ext:false,li:[],lc:[],min:10,dias:'todos',hDe:'06:00',hAte:'22:00',on:true,t:Date.now()+1}]);c.tema='claro';
   return ref.set({cfg:c,ts:Date.now()+1},{merge:true})})});
 await B.p.waitForTimeout(1500);
 const avB2=await B.p.evaluate(()=>JSON.parse(localStorage.getItem('cse-avisos-onibus')||'{}'));
 ok((avB2.c||[]).some(a=>a.id==='a2'),'ao vivo: o aviso criado em outro aparelho aparece em B sem reabrir o app');
 ok((await local(B.p)).tema==='claro','ao vivo: a personalização da conta também chega (com a opção ligada)');
 // B apaga o aviso: a marca de apagado vai para a conta
 await B.p.evaluate(()=>document.querySelector('#alvsec [data-alvdel="a1"]').click());await B.p.waitForTimeout(1500);
 const cB=await conta(B.p);
 ok((cB.avisos||[]).some(a=>a.id==='a1'&&a.x),'apagar em B deixa a marca na conta (o aviso não volta)');
 // aparelho C: opção desligada antes de entrar: recebe os avisos, mas não a personalização da conta
 const C=await aparelho({cfg:{tema:'claro'},loja,pers0:true});
 const lC=await local(C.p),avC=await C.p.evaluate(()=>JSON.parse(localStorage.getItem('cse-avisos-onibus')||'{}'));
 ok(lC.tema==='claro'&&(avC.c||[]).some(a=>a.id==='a1'),'com a opção desligada, o aparelho recebe os avisos mas mantém o próprio tema');
 ok(A.e.length===0&&B.e.length===0&&C.e.length===0,'sem erros de JavaScript '+JSON.stringify(A.e.concat(B.e,C.e)));
 await b.close();srv.close();process.exit(falhou?1:0)})();
