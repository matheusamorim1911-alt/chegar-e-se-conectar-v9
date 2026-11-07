// Envia um feedback com o Firebase simulado (tests/firebase-mock.js) e confere o que foi gravado.
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');const servir=require('./servidor');
const mock=fs.readFileSync(path.join(__dirname,'firebase-mock.js'),'utf8');
(async()=>{const srv=await servir(8798);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const c=await b.newContext({viewport:{width:430,height:860}});
 await c.route(/gstatic\.com\/firebasejs\/.*app-compat\.js/,r=>r.fulfill({contentType:'text/javascript',body:mock}));
 await c.route(/gstatic\.com\/firebasejs\/.*(auth|firestore)-compat\.js/,r=>r.fulfill({contentType:'text/javascript',body:''}));
 await c.route(/open-meteo/,r=>r.abort());
 await c.addInitScript(()=>{window.__fbstore={};localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',banner:false,login:false,flow:false}));localStorage.setItem('cse-perfil',JSON.stringify({name:'Teste',pin:null}))});
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8798/');await p.waitForTimeout(2000);
 await p.click('#tab-cfg');await p.waitForTimeout(500);
 await p.evaluate(()=>document.querySelector('#fbksec [data-fbk]').click());await p.waitForTimeout(300);
 await p.fill('#fbkTxt','Mensagem de teste');await p.click('#fbkSend');await p.waitForTimeout(800);
 const g=await p.evaluate(()=>Object.entries(window.__fbstore).filter(([k])=>k.startsWith('feedback/')).map(([,v])=>v));
 ok(g.length===1&&g[0].txt==='Mensagem de teste','feedback gravado na coleção feedback');
 ok(errs.length===0,'sem erros de JavaScript');
 await b.close();srv.close();process.exit(falhou?1:0)})();
