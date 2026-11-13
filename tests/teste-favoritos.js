// Favoritos (src/js/43-favoritos.js): favoritar pela estrela do painel e por "Adicionar", categorias próprias,
// filtro, próximo ônibus, abrir pelo favorito, capa e tirar dos favoritos.
const { chromium } = require('playwright');const servir=require('./servidor');
(async()=>{const srv=await servir(8848);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const c=await b.newContext({viewport:{width:1200,height:950},serviceWorkers:'block'});
 await c.route(/gstatic\.com\/firebasejs|open-meteo|workers\.dev/,r=>r.abort());
 await c.addInitScript(()=>{if(sessionStorage.j)return;sessionStorage.j=1;localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}))});
 const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8848/');await p.waitForTimeout(1800);
 ok(!!(await p.$('#favBox'))&&/Guarde pontos e linhas/.test(await p.textContent('#favBox')),'Trajetos começa com "Meus favoritos" vazio e explicado');
 // estrela no painel da parada
 await p.evaluate(()=>document.querySelector('#map .mk[data-kind="stop"][data-id="est"]').dispatchEvent(new MouseEvent('click',{bubbles:true})));await p.waitForTimeout(500);
 ok(!!(await p.$('#favEstrela [data-favstar]')),'o painel do ponto tem a estrela "Favoritar"');
 await p.click('#favEstrela [data-favstar]');await p.waitForTimeout(200);
 await p.click('#favEstrela [data-favcat="Estudos"]');await p.waitForTimeout(400);
 ok(/Nos favoritos · Estudos/.test(await p.textContent('#favEstrela')),'escolhida a categoria, a estrela fica marcada');
 let t=await p.textContent('#favBox');
 ok(/Estudos/.test(t)&&/Estação/.test(t)&&/(em \d+ min|agora|às \d\d:\d\d|sem mais ônibus hoje)/.test(t),'o favorito aparece em Trajetos com o próximo ônibus ('+t.replace(/\s+/g,' ').slice(0,120)+')');
 // adicionar linha da UFRJ e linha da cidade com categoria nova
 await p.click('#favNovo');await p.click('[data-favt="i"]');await p.waitForTimeout(150);await p.selectOption('#favRef','1');await p.click('#favForm [data-favcat="Casa"]');await p.click('#favSalvar');await p.waitForTimeout(300);
 await p.click('#favNovo');await p.click('[data-favt="c"]');await p.waitForTimeout(150);await p.fill('#favCatNova','Academia');await p.click('#favSalvar');await p.waitForTimeout(300);
 t=await p.textContent('#favBox');
 ok(/Casa/.test(t)&&/Academia/.test(t)&&(await p.$$('#favBox .fav-it')).length===3,'"Adicionar" guarda linha da UFRJ e linha da cidade, com categoria criada pelo aluno');
 await p.click('[data-favf="Casa"]');await p.waitForTimeout(200);
 ok((await p.$$('#favBox .fav-it')).length===1,'o filtro mostra só a categoria escolhida');
 await p.click('[data-favf=""]');await p.waitForTimeout(200);
 // abrir pelo favorito
 await p.click('#favBox .fav-ir:has(.lb)');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>/Linha 1|Estação × Gráfica/.test(document.getElementById('detail').textContent)),'tocar no favorito da linha abre a linha');
 // capa
 await p.evaluate(()=>{const c=JSON.parse(localStorage.getItem('cse-cfg'));c.cover='folha';localStorage.setItem('cse-cfg',JSON.stringify(c))});await p.reload();await p.waitForTimeout(2500);
 ok((await p.$$('#cvAvisos .cv-fav')).length===3,'a capa mostra os favoritos');
 await p.click('#cvAvisos .cv-fav');await p.waitForTimeout(1200);
 ok(await p.evaluate(()=>document.getElementById('cover').hidden),'tocar no favorito da capa entra no app');
 // tirar
 await p.click('#favBox [data-favdel]');await p.waitForTimeout(300);
 const g=await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-cfg')).favs);
 ok((await p.$$('#favBox .fav-it')).length===2&&g.filter(f=>f.x).length===1,'tirar dos favoritos (fica a marca para a conta não trazer de volta)');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));
 await b.close();srv.close();process.exit(falhou?1:0)})();
