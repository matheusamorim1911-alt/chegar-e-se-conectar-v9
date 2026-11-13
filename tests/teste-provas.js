// Minhas provas (src/js/41-provas.js): anotar, ver a contagem, editar, apagar e guardar; a conta junta listas sem ressuscitar o que foi apagado.
const { chromium } = require('playwright');const servir=require('./servidor');
(async()=>{const srv=await servir(8845);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const c=await b.newContext({viewport:{width:1100,height:900},serviceWorkers:'block'});
 await c.route(/gstatic\.com\/firebasejs|open-meteo|workers\.dev/,r=>r.abort());
 await c.addInitScript(()=>{if(sessionStorage.j)return;sessionStorage.j=1;localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}));
   localStorage.setItem('cse-ufrj-grade-v1',JSON.stringify([{id:'g1',nome:'Matemática Discreta',bld:'ccmn',b:'C',sala:'',dias:[2,4],ini:'08:00',fim:'10:00'}]))});
 const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8845/');await p.waitForTimeout(1800);
 const dia=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
 await p.click('#tab-cal');await p.waitForTimeout(500);
 ok(!!(await p.$('#prvBox'))&&/Anote aqui as datas/.test(await p.textContent('#prvBox')),'o Calendário tem "Minhas provas", vazio');
 await p.click('#prvNova');await p.waitForTimeout(200);
 ok(await p.$$eval('#prvNomes option',x=>x.some(o=>o.value==='Matemática Discreta')),'sugere as disciplinas da grade');
 await p.click('#prvForm button[type=submit]');await p.waitForTimeout(200);
 ok(/nome da disciplina/.test(await p.textContent('#prvErr')),'sem disciplina: pede o nome');
 await p.fill('#prvN','Matemática Discreta');await p.click('#prvForm button[type=submit]');await p.waitForTimeout(200);
 ok(/Escolha a data/.test(await p.textContent('#prvErr')),'sem data: pede a data');
 await p.fill('#prvO','P1');await p.fill('#prvD',dia(3));await p.fill('#prvH','10:00');await p.fill('#prvL','CCMN, bloco C');await p.click('#prvForm button[type=submit]');await p.waitForTimeout(400);
 let t=await p.textContent('#prvBox');
 ok(/Matemática Discreta · P1/.test(t)&&/Em 3 dias/.test(t)&&/10:00/.test(t)&&/CCMN, bloco C/.test(t),'mostra a prova com data, horário, local e "Em 3 dias"');
 await p.click('#prvNova');await p.fill('#prvN','Cálculo');await p.fill('#prvD',dia(0));await p.fill('#prvH','14:00');await p.click('#prvForm button[type=submit]');await p.waitForTimeout(300);
 await p.click('#prvNova');await p.fill('#prvN','Física');await p.fill('#prvD',dia(-5));await p.click('#prvForm button[type=submit]');await p.waitForTimeout(300);
 t=await p.textContent('#prvBox');
 ok(/Hoje às 14:00/.test(t)&&t.indexOf('Cálculo')<t.indexOf('Matemática Discreta'),'em ordem de data, com "Hoje às 14:00"');
 ok(/Provas que já passaram \(1\)/.test(t)&&/A data já passou/.test(t),'a que já passou vai para "Provas que já passaram"');
 // editar
 await p.click('#prvBox .cal-list [data-prved]');await p.waitForTimeout(200);await p.fill('#prvO','P2');await p.click('#prvForm button[type=submit]');await p.waitForTimeout(300);
 ok(/Cálculo · P2/.test(await p.textContent('#prvBox')),'editar muda a prova');
 // guarda no aparelho
 await p.reload();await p.waitForTimeout(1800);await p.click('#tab-cal');await p.waitForTimeout(400);
 ok(/Matemática Discreta · P1/.test(await p.textContent('#prvBox'))&&await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-cfg')).provas.length===3),'abrindo de novo, as provas continuam lá');
 // apagar
 await p.click('#prvBox [data-prvdel]');await p.waitForTimeout(300);
 const g=await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-cfg')).provas);
 ok(!/Cálculo · P2/.test(await p.textContent('#prvBox'))&&g.filter(x=>x.x).length===1,'apagar tira da lista (e deixa a marca para a conta não trazer de volta)');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));
 await b.close();srv.close();process.exit(falhou?1:0)})();
