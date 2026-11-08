// Seguir um ônibus (src/js/28-seguir-onibus.js): busca pela linha, card com o próximo ponto, mapa acompanhando,
// caminho feito, pausa ao arrastar, tocar no ônibus do mapa, continuar depois de recarregar e tela de celular.
const { chromium } = require('playwright');const servir=require('./servidor');const fs=require('fs'),path=require('path');
(async()=>{const srv=await servir(8813);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const am=JSON.parse(fs.readFileSync(path.join(__dirname,'amostra-onibus.json'),'utf8'));
 let rodada=0;
 const resposta=()=>{const agora=Date.now(),d0=am.t;rodada++;
   // a cada pedido, os ônibus andam um pouco no sentido em que estão indo
   return {t:agora,onibus:am.onibus.map(o=>{const k=o.vel>2?rodada*0.00012:0,r=o.dir*Math.PI/180;return Object.assign({},o,{t:agora-(d0-o.t)-3000,la:o.la+k*Math.cos(r),lo:o.lo+k*Math.sin(r)})})}};
 async function abre(vp,ls){const c=await b.newContext({viewport:vp,serviceWorkers:'block'});
   await c.route(/gstatic\.com\/firebasejs/,r=>r.abort());await c.route(/open-meteo/,r=>r.abort());await c.route('**workers.dev/tiroteios**',r=>r.abort());
   await c.route('**workers.dev/',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(resposta())}));
   await c.addInitScript(ls=>{if(sessionStorage.getItem('ja'))return;sessionStorage.setItem('ja','1');localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));Object.keys(ls).forEach(k=>localStorage.setItem(k,ls[k]))},ls||{});
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8813/');await p.waitForTimeout(1500);return [c,p,e]}
 let [c,p,e]=await abre({width:1200,height:900});
 ok(await p.isVisible('#segBtn'),'o mapa tem o botão "Buscar ônibus"');
 await p.click('#segBtn');await p.waitForTimeout(1200);
 ok(await p.evaluate(()=>{const g=document.getElementById('gExt');return !!g&&!g.classList.contains('off')}),'abrir a busca liga a camada "Ônibus da cidade"');
 const n=await p.$$eval('#segLista [data-segv]',x=>x.length);
 ok(n===40&&/51 ônibus ao vivo/.test(await p.textContent('#segLista')),'lista os ônibus ao vivo ('+n+' na tela, de 51)');
 await p.fill('#segQ','485');await p.waitForTimeout(200);
 const ls=await p.$$eval('#segLista [data-segv]',x=>x.map(y=>y.querySelector('.xb').textContent));
 ok(ls.length>0&&ls.every(t=>/485/.test(t)),'a busca pela linha filtra: '+ls.join(', '));
 await p.fill('#segQ','B28568');await p.waitForTimeout(200);
 ok(await p.$$eval('#segLista [data-segv]',x=>x.length===1&&x[0].dataset.segv==='B28568'),'a busca pelo número do carro acha o carro');
 await p.fill('#segQ','zzzz');await p.waitForTimeout(200);
 ok(/Nenhum ônibus com “zzzz”/.test(await p.textContent('#segLista')),'busca sem resultado avisa');
 await p.fill('#segQ','');await p.waitForTimeout(200);
 // um ônibus andando dentro do mapa
 const alvo0=await p.$$eval('#segLista [data-segv]',x=>{const r=x.find(y=>/km\/h/.test(y.textContent)&&!/fora do mapa/.test(y.textContent));return r&&r.dataset.segv});
 await p.fill('#segQ',alvo0);await p.waitForTimeout(200);
 const z0=parseInt(await p.textContent('#zoomlvl'));
 const alvo=await p.$eval('#segLista [data-segv]',x=>x.dataset.segv);
 await p.press('#segQ','Enter');await p.waitForTimeout(1500);
 ok(await p.isHidden('#segBusca')&&await p.isVisible('#segCard'),'Enter segue o primeiro da lista: a busca fecha e o card aparece');
 const card=await p.textContent('#segCard');
 ok(new RegExp('Carro '+alvo).test(card)&&/posição de .* atrás/.test(card),'o card mostra o carro e a idade da posição');
 ok(await p.evaluate(v=>{const el=document.querySelector('#gLive .xlive[data-v="'+v+'"]');return !!el&&el.classList.contains('seg-on')&&el===el.parentNode.lastElementChild},alvo),'o ônibus seguido fica em destaque e por cima');
 ok(parseInt(await p.textContent('#zoomlvl'))>z0,'o mapa aproxima ao começar a seguir');
 const centro=()=>p.evaluate(v=>{const a=document.querySelector('#gLive .xlive[data-v="'+v+'"] .lv-dot').getBoundingClientRect(),m=document.getElementById('map').getBoundingClientRect();return Math.hypot(a.left+a.width/2-(m.left+m.width/2),a.top+a.height/2-(m.top+m.height/2))/Math.min(m.width,m.height)},alvo);
 ok(await centro()<0.2,'o ônibus fica perto do centro do mapa');
 const txt=await p.textContent('#segCard');
 ok(/Próximo ponto/.test(txt)&&/(~\d+ min|chegando|menos de 1 min)/.test(txt),'mostra o próximo ponto e o tempo estimado: '+txt.replace(/\s+/g,' ').replace(/×/,'').trim());
 await p.waitForTimeout(11000);
 const dr=await p.evaluate(()=>{const e=document.querySelector('#gSeg path');return e?e.getAttribute('d'):''});
 ok(/^M[-\d.]+,[-\d.]+L/.test(dr),'desenha o caminho feito ('+dr.split('L').length+' pontos)');
 // arrastar o mapa pausa; "Voltar ao ônibus" retoma
 const mb=await p.$eval('#map',x=>{const r=x.getBoundingClientRect();return [r.left+r.width*0.6,r.top+r.height*0.4]});
 await p.mouse.move(mb[0],mb[1]);await p.mouse.down();await p.mouse.move(mb[0]-150,mb[1]-90,{steps:8});await p.mouse.up();await p.waitForTimeout(900);
 ok(await p.isVisible('#segVolta')&&/seguir pausado/.test(await p.textContent('#segCard')),'arrastar o mapa pausa o acompanhamento');
 await p.click('#segVolta');await p.waitForTimeout(1200);
 ok(await p.isHidden('#segVolta')&&await centro()<0.2,'"Voltar ao ônibus" centraliza de novo');
 ok(await p.$('#segCard [data-segpt]').then(x=>!!x)||!/Próximo ponto:/.test(await p.textContent('#segCard')),'ponto com nome tem o atalho para os horários');
 await p.click('#segX');await p.waitForTimeout(700);
 ok(await p.isHidden('#segCard')&&!(await p.$('#gLive .seg-on'))&&!(await p.$('#gSeg'))&&await p.evaluate(()=>!localStorage.getItem('cse-seguir')),'parar de seguir tira o card, o destaque e o caminho');
 // tocar num ônibus do mapa
 const v2=await p.evaluate(()=>{const g=[...document.querySelectorAll('#gLive .xlive')].find(x=>{const r=x.getBoundingClientRect(),m=document.getElementById('map').getBoundingClientRect();return r.width&&r.left>m.left+60&&r.right<m.right-170&&r.top>m.top+180&&r.bottom<m.bottom-140});return g?g.dataset.v:null});
 if(v2){await p.click('#gLive .xlive[data-v="'+v2+'"] .lv-dot',{force:true});await p.waitForTimeout(900);
   ok(new RegExp('Carro '+v2).test(await p.textContent('#segCard'))&&await p.isVisible('#segCard'),'tocar num ônibus do mapa passa a segui-lo')}
 else ok(false,'nenhum ônibus visível no mapa para tocar');
 // ônibus fora da planta: o card avisa e a seta na borda leva até ele
 await p.click('#segBtn');await p.waitForTimeout(300);await p.fill('#segQ','B28597');await p.waitForTimeout(200);
 ok(/fora do mapa/.test(await p.textContent('#segLista')),'a lista avisa quando o ônibus está fora do mapa');
 await p.press('#segQ','Enter');await p.waitForTimeout(1500);
 ok(/Fora da área do mapa/.test(await p.textContent('#segCard'))&&await p.isVisible('#segSeta'),'seguindo um ônibus fora do mapa: o card avisa e aparece a seta na borda');
 await p.click('#segX');await p.waitForTimeout(400);
 ok(await p.isHidden('#segSeta'),'parar de seguir tira a seta');
 await p.click('#segBtn');await p.waitForTimeout(300);await p.fill('#segQ',v2);await p.press('#segQ','Enter');await p.waitForTimeout(900);
 // recarregar continua seguindo
 await p.reload();await p.waitForTimeout(2500);
 ok(await p.evaluate(v=>{const el=document.querySelector('#gLive .xlive[data-v="'+v+'"]');return !document.getElementById('segCard').hidden&&document.getElementById('segCard').textContent.indexOf('Carro '+v)>=0&&!!el&&el.classList.contains('seg-on')},v2),'depois de recarregar, continua seguindo o mesmo ônibus');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));
 await c.close();
 // celular: o card e o botão não cobrem os botões de zoom
 [c,p,e]=await abre({width:390,height:844});
 await p.evaluate(()=>document.querySelector('.mapcard').scrollIntoView());await p.click('#segBtn');await p.waitForTimeout(1200);
 await p.click('#segLista [data-segv]');await p.waitForTimeout(1200);
 const sob=await p.evaluate(()=>{const a=document.getElementById('segCard').getBoundingClientRect(),z=document.querySelector('.zoomctl').getBoundingClientRect(),bt=document.getElementById('segBtn').getBoundingClientRect(),ro=document.getElementById('rosebox').getBoundingClientRect(),m=document.querySelector('.mapwrap').getBoundingClientRect();
   const cruza=(x,y)=>!(x.right<=y.left||y.right<=x.left||x.bottom<=y.top||y.bottom<=x.top);return {card:cruza(a,z),btn:cruza(bt,z)||cruza(bt,ro),dentro:a.left>=m.left&&a.right<=m.right&&a.bottom<=m.bottom&&a.top>=m.top}});
 ok(!sob.card&&!sob.btn&&sob.dentro,'no celular, o card e o botão ficam no mapa sem cobrir o zoom nem a bússola '+JSON.stringify(sob));
 await p.screenshot({path:path.join(require('os').tmpdir(),'seguir-celular.png')});
 ok(e.length===0,'sem erros de JavaScript no celular '+JSON.stringify(e));
 await c.close();await b.close();srv.close();process.exit(falhou?1:0)})();
