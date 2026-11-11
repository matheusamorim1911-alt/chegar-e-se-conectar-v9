// Ônibus de linhas fora da lista do app, dentro da ilha (o Worker passou a mandá-los com f:1): aparecem no mapa,
// na busca e no card de seguir, avisando que a linha não tem horários no app, sem erros de JavaScript.
const { chromium } = require('playwright');const servir=require('./servidor');
(async()=>{const srv=await servir(8821);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const c=await b.newContext({viewport:{width:1200,height:900},serviceWorkers:'block'});
 await c.route(/gstatic\.com\/firebasejs/,r=>r.abort());await c.route(/open-meteo/,r=>r.abort());await c.route('**workers.dev/tiroteios**',r=>r.abort());
 let k=0;
 await c.route('**workers.dev/',r=>{const t=Date.now()-20000;k++;r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({t:Date.now(),onibus:[
  {v:'N1',l:'474',s:'',la:-22.8586,lo:-43.2318+k*0.0002,vel:20,dir:90,t,f:1},{v:'N4',l:'SVA485',s:'',la:-22.846,lo:-43.224,vel:0,dir:0,t,f:1},{v:'A1',l:'321',s:'',la:-22.8394,lo:-43.2396,vel:10,dir:0,t}]})})});
 await c.addInitScript(()=>{localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}))});
 const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
 await p.goto('http://localhost:8821/');await p.waitForTimeout(1500);
 await p.click('#segBtn');await p.waitForTimeout(1500);
 ok(await p.$$eval('#gLive .xlive',x=>x.map(y=>y.dataset.v).sort().join()==='A1,N1,N4'),'os ônibus de linhas fora da lista aparecem no mapa');
 const lista=await p.textContent('#segLista');
 ok(/Linha 474Sem horários no app · Carro N1/.test(lista)&&/Bancários - CasteloCarro A1/.test(lista),'na busca, a linha fora da lista avisa que não tem horários no app');
 await p.fill('#segQ','474');await p.waitForTimeout(200);await p.press('#segQ','Enter');await p.waitForTimeout(1500);
 const card=await p.textContent('#segCard');
 ok(/Linha 474/.test(card)&&/Linha fora da lista do app/.test(card)&&!/Fora do traçado da linha/.test(card),'o card de seguir explica por que a linha aparece');
 await p.waitForTimeout(11000);
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));
 await b.close();srv.close();process.exit(falhou?1:0)})();
