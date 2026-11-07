// Tiroteios perto das saídas (Fogo Cruzado): desligado por padrão; ligado, mostra o resumo do Worker em Trajetos.
const { chromium } = require('playwright');const servir=require('./servidor');
(async()=>{const srv=await servir(8812);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const agora=Date.now(),pedidos=[];
 const dados={t:agora,fonte:'Fogo Cruzado',disponivel:true,janelaH:6,atualizado:new Date(agora-30*60e3).toISOString(),ocorrencias:[{id:'a',t:agora-40*60e3,la:-22.86,lo:-43.243,bairro:'Maré',local:'Av. Brasil, Maré',policia:true,vitimas:1}]};
 async function abre(cfg,resp){const c=await b.newContext({viewport:{width:1200,height:900},serviceWorkers:'block'});
   await c.route(/gstatic\.com\/firebasejs/,r=>r.abort());await c.route(/open-meteo/,r=>r.abort());
   await c.route('**workers.dev/tiroteios**',r=>{pedidos.push(1);r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(resp)})});
   await c.route('**workers.dev/',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({t:agora,onibus:[]})}));
   await c.addInitScript(cfg=>{localStorage.setItem('cse-cfg',JSON.stringify(Object.assign({cover:'none',login:false,banner:false,flow:false},cfg)));localStorage.setItem('cse-fold-tiro','1')},cfg);
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8812/');await p.waitForTimeout(2000);return [c,p,e]}
 let [c,p,e]=await abre({},dados);
 ok(pedidos.length===0&&!(await p.$('#tirobox')),'desligado por padrão: não consulta nem mostra nada');
 await p.click('#tab-cfg');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>!!document.getElementById('cfgTiro')&&!document.getElementById('cfgTiro').checked),'Ajustes tem a opção, desligada');
 await p.click('label[for="cfgTiro"]');await p.waitForTimeout(800);await p.click('#cfgClose');await p.waitForTimeout(400);
 const txt=await p.evaluate(()=>{const b=document.getElementById('tirobox');return b?b.innerText:''});
 ok(pedidos.length===1&&/1 registro nas últimas 6 h/.test(txt)&&/Maré/.test(txt)&&/Fonte: Instituto Fogo Cruzado/.test(txt)&&/Base atualizada hoje às/.test(txt),'ligado: mostra o registro com fonte e horário');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));await c.close();
 [c,p,e]=await abre({tiroteios:true},{t:agora,disponivel:false,motivo:'erro'});
 const t2=await p.evaluate(()=>(document.getElementById('tirobox')||{}).innerText||'');
 ok(/Sem dados do Fogo Cruzado agora/.test(t2)&&/não quer dizer que esteja tudo calmo/.test(t2),'sem dados: diz que não há dados, não que está calmo');
 await c.close();await b.close();srv.close();process.exit(falhou?1:0)})();
