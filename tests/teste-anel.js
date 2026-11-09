// Anel ao redor da bússola (src/js/30-anel-ao-vivo.js): verde girando com posições chegando, laranja quando a
// prefeitura falha (o Worker responde sem dados novos), vermelho e parado quando o Worker para de responder.
const { chromium } = require('playwright');const servir=require('./servidor');const fs=require('fs'),path=require('path');
(async()=>{const srv=await servir(8822);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const am=JSON.parse(fs.readFileSync(path.join(__dirname,'amostra-onibus.json'),'utf8'));let modo='ok';
 const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await c.route(/gstatic|open-meteo|tiroteios/,r=>r.abort());
 await c.route('**workers.dev/',r=>{if(modo==='cai')return r.abort('failed');const ag=Date.now();r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({t:ag,falhou:modo==='lento',onibus:modo==='lento'?[]:am.onibus.map(o=>Object.assign({},o,{t:ag-(am.t-o.t)}))})})});
 await c.addInitScript(()=>{localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false}));localStorage.setItem('cse-lay-ext','1')});
 const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
 await p.clock.install();await p.goto('http://localhost:8822/');await p.clock.runFor(3000);await p.waitForTimeout(1500);
 const st=()=>p.evaluate(()=>{const a=document.getElementById('anelVivo'),arco=a&&a.querySelector('.av-arco');return {c:a&&!a.hidden?a.className:'oculto',gira:arco?getComputedStyle(arco).animationName:'',txt:(document.getElementById('anelVivoTxt')||{}).textContent}});
 let s=await st();ok(/ ok$/.test(s.c)&&s.gira==='avgira'&&/atualizando\./.test(s.txt),'posições chegando: anel verde girando '+JSON.stringify(s));
 modo='lento';await p.clock.runFor(12000);await p.waitForTimeout(400);s=await st();ok(/lento/.test(s.c)&&s.gira==='avgira'&&await p.$$eval('#gLive .xlive',x=>x.length)>0,'prefeitura falhou: laranja girando, e os ônibus continuam no mapa');
 modo='cai';await p.clock.runFor(50000);await p.waitForTimeout(400);s=await st();ok(/parado/.test(s.c)&&s.gira==='none'&&/parados/.test(s.txt),'Worker sem responder: vermelho e parado');
 modo='ok';await p.clock.runFor(12000);await p.waitForTimeout(600);s=await st();ok(/ ok$/.test(s.c),'voltou: verde de novo');
 await p.evaluate(()=>{document.getElementById('chBus').click()});await p.waitForTimeout(300);
 const menu=await p.$('label:has(#bmExt)');if(menu){await menu.click();await p.clock.runFor(1500);await p.waitForTimeout(300)}
 s=await st();ok(s.c==='oculto','sem a camada "Ônibus da cidade", o anel some');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));
 await b.close();srv.close();process.exit(falhou?1:0)})();
