// eduroam: o perfil da UFRJ dentro do app (src/js/42-eduroam-perfil.js): baixar o perfil no iPhone, configurar à mão
// com os valores do perfil, conferir o usuário e o aviso de certificado vencido.
const { chromium } = require('playwright');const servir=require('./servidor');
(async()=>{const srv=await servir(8847);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
 const ANDROID='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
 async function abre(ua){const c=await b.newContext({viewport:{width:430,height:900},userAgent:ua,serviceWorkers:'block'});
   await c.route(/gstatic\.com\/firebasejs|open-meteo|workers\.dev|ipify/,r=>r.abort());
   await c.addInitScript(()=>{if(sessionStorage.j)return;sessionStorage.j=1;localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}))});
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8847/');await p.waitForTimeout(1800);
   await p.click('#tab-predios');await p.waitForTimeout(400);await p.click('[data-educfg]');await p.waitForTimeout(400);return [c,p,e]}
 let [c,p,e]=await abre(IPHONE);
 const a=await p.$('#educfg [data-eduperfil]');
 ok(!!a&&await a.getAttribute('href')==='eduroam-ufrj.mobileconfig','iPhone: botão "Baixar o perfil da UFRJ"');
 const r=await p.evaluate(()=>fetch('eduroam-ufrj.mobileconfig').then(r=>r.arrayBuffer()).then(b=>b.byteLength));
 ok(r>5000,'o perfil está no site ('+r+' bytes)');
 await p.click('#educfg .edup-man summary');await p.waitForTimeout(200);
 const t=await p.textContent('#educfg .edup-man');
 ok(/PEAP/.test(t)&&/MSCHAPv2/.test(t)&&/eduroam\.ufrj\.br/.test(t)&&/WPA2-Enterprise/.test(t),'à mão: método, fase 2, servidor e segurança do perfil');
 ok(/está vencido/.test(t)&&/Não desligue a verificação/.test(t),'avisa que o certificado da UFRJ venceu, sem mandar desligar a verificação');
 await p.fill('#eduUsuario','123.456.789-00');await p.waitForTimeout(100);
 ok(/não o CPF/.test(await p.textContent('#eduUsuarioMsg')),'usuário: CPF é recusado');
 await p.fill('#eduUsuario','aluno');await p.waitForTimeout(100);
 ok(/e-mail completo/.test(await p.textContent('#eduUsuarioMsg')),'usuário: sem @ pede o e-mail completo');
 await p.fill('#eduUsuario','aluno@gmail.com');await p.waitForTimeout(100);
 ok(/Formato certo/.test(await p.textContent('#eduUsuarioMsg'))&&await p.evaluate(()=>!JSON.stringify(localStorage).includes('aluno@gmail.com')),'usuário: e-mail aceito e nada é guardado');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 [c,p,e]=await abre(ANDROID);
 ok(!(await p.$('#educfg [data-eduperfil]'))&&/No Android/.test(await p.textContent('#educfg .edup-man')),'Android: sem perfil para baixar, com o passo a passo do Android');
 ok(e.length===0,'sem erros de JavaScript (Android) '+JSON.stringify(e));await c.close();
 await b.close();srv.close();process.exit(falhou?1:0)})();
