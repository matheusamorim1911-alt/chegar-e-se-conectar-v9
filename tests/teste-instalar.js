// Convite para instalar o app (src/js/31-instalar.js): passo a passo no iPhone e no Android, botão "Instalar" quando o
// navegador oferece, "Agora não" e "Não mostrar mais", e nada no computador.
const { chromium } = require('playwright');const servir=require('./servidor');const path=require('path');
(async()=>{const srv=await servir(8823);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
 const ANDROID='Mozilla/5.0 (Linux; Android 14; SM-A145M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
 async function abre(ua,ls,vp){const c=await b.newContext({viewport:vp||{width:390,height:844},userAgent:ua,isMobile:!!vp===false,hasTouch:true,serviceWorkers:'block'});
   await c.route(/gstatic|open-meteo|workers\.dev/,r=>r.abort());
   await c.addInitScript(ls=>{localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false}));Object.keys(ls||{}).forEach(k=>localStorage.setItem(k,ls[k]))},ls);
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.clock.install();await p.goto('http://localhost:8823/');await p.clock.runFor(2000);await p.waitForTimeout(800);return [c,p,e]}
 // iPhone
 let [c,p,e]=await abre(IPHONE);
 ok(await p.$('#instFolha')===null,'iPhone: não aparece logo de cara');
 await p.clock.runFor(20000);await p.waitForTimeout(600);
 let t=await p.evaluate(()=>{const f=document.getElementById('instFolha');return f?f.innerText:''});
 ok(/Instale o Chega aí/.test(t)&&/Compartilhar/.test(t)&&/Adicionar à Tela de Início/.test(t)&&/Adicionar/.test(t),'iPhone: passo a passo com Compartilhar › Adicionar à Tela de Início');
 ok(await p.evaluate(()=>document.activeElement&&document.activeElement.id==='instDepois'),'iPhone: o foco vai para a folha');
 await p.screenshot({path:path.join(require('os').tmpdir(),'instalar-iphone.png')});
 await p.click('#instDepois');await p.waitForTimeout(300);
 ok(await p.$('#instFolha')===null&&await p.evaluate(()=>{const v=JSON.parse(localStorage.getItem('cse-instalar'));return v&&v.ate>Date.now()+6*864e5}),'"Agora não" fecha e adia 7 dias');
 const ls=await p.evaluate(()=>localStorage.getItem('cse-instalar'));await c.close();
 [c,p,e]=await abre(IPHONE,{'cse-instalar':ls});await p.clock.runFor(30000);await p.waitForTimeout(500);
 ok(await p.$('#instFolha')===null,'adiado: não aparece de novo ao abrir o app');
 await c.close();
 // Android sem o pedido do navegador: menu ⋮
 [c,p,e]=await abre(ANDROID);await p.clock.runFor(20000);await p.waitForTimeout(600);
 t=await p.evaluate(()=>{const f=document.getElementById('instFolha');return f?f.innerText:''});
 ok(/⋮/.test(t)&&/Instalar app/.test(t)&&/Adicionar à tela inicial/.test(t),'Android: passo a passo pelo menu ⋮');
 await p.click('#instNunca');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-instalar')).nunca===true),'"Não mostrar mais" para de vez');
 await c.close();
 // Android com o pedido do navegador: botão Instalar
 [c,p,e]=await abre(ANDROID);
 await p.evaluate(()=>{const ev=new Event('beforeinstallprompt',{cancelable:true});ev.prompt=()=>{window.__pediu=true};ev.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(ev)});
 await p.clock.runFor(20000);await p.waitForTimeout(600);
 ok(await p.isVisible('#instGo'),'Android com o pedido do navegador: botão "Instalar o app"');
 await p.click('#instGo');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>window.__pediu===true)&&await p.$('#instFolha')===null,'o botão chama a instalação do navegador e fecha a folha');
 await c.close();
 // computador: nada
 [c,p,e]=await abre('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',{}, {width:1280,height:800});
 await p.clock.runFor(30000);await p.waitForTimeout(500);ok(await p.$('#instFolha')===null,'no computador não aparece');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 await b.close();srv.close();process.exit(falhou?1:0)})();
