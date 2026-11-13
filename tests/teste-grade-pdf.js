// Importar a grade horária em PDF (src/js/40-importar-grade.js): lê o PDF de amostra (dados inventados, com o desenho da
// "Minha grade horária" do portal da UFRJ), mostra o que achou, importa para a grade e não repete.
const { chromium } = require('playwright');const servir=require('./servidor');const fs=require('fs'),path=require('path');
(async()=>{const srv=await servir(8843);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const pdfjs=path.join(__dirname,'..','node_modules','pdfjs-dist','build');
 const c=await b.newContext({viewport:{width:1100,height:900},serviceWorkers:'block'});
 await c.route(/gstatic\.com\/firebasejs|open-meteo|workers\.dev/,r=>r.abort());
 const baixou=[];
 await c.route('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/*',r=>{const f=r.request().url().split('/').pop();baixou.push(f);r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(path.join(pdfjs,f))})});
 await c.addInitScript(()=>{if(sessionStorage.j)return;sessionStorage.j=1;localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}))});
 const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8843/');await p.waitForTimeout(2000);
 await p.click('#tab-grade');await p.waitForTimeout(500);
 ok(!!(await p.$('#igAbrir'))&&!baixou.length,'a aba Grade tem "Importar do PDF" e o leitor de PDF só é baixado depois de escolher um arquivo');
 // um arquivo que não é PDF
 await p.setInputFiles('#igArq',{name:'x.pdf',mimeType:'application/pdf',buffer:Buffer.from('isto não é um pdf')});await p.waitForTimeout(2500);
 ok(/Não deu para ler esse PDF|Não parece/.test(await p.textContent('#igBox')),'arquivo que não é PDF: explica, sem travar');
 // a grade de amostra
 await p.setInputFiles('#igArq',path.join(__dirname,'amostra-grade.pdf'));await p.waitForSelector('#igFolha',{timeout:15000});await p.waitForTimeout(400);
 ok(baixou.includes('pdf.min.js')&&baixou.includes('pdf.worker.min.js'),'baixa o leitor de PDF (pdf.js) ao escolher o arquivo');
 const txt=await p.textContent('#igFolha');
 ok(/2026\/2 · 6 aulas encontradas/.test(txt),'acha o período e as 6 aulas com horário ('+txt.slice(0,80).replace(/\s+/g,' ')+')');
 ok(/Cálculo Infinitesimal 1 - Turma 2/.test(txt)&&/Seg, Qua, Sex · 10:00–12:00 · MAE111/.test(txt)&&/Ter, Qui · 08:00–10:00 · ICP144/.test(txt)&&/Qua, Sex · 08:00–10:00 · ICP141/.test(txt)&&/Qui · 10:00–12:00 · ICP145/.test(txt),'junta os dias da mesma disciplina que têm o mesmo horário');
 ok(/Sem dia e horário \(não entram na grade\): Ativ Curricular Extensão/.test(txt),'o que não tem dia e horário fica de fora e é avisado');
 ok(!/ALUNO DE EXEMPLO|100000000|PROFESSOR/.test(txt),'nome, matrícula e professores não aparecem');
 ok(await p.$eval('[data-igb="0"]',x=>x.value)==='ccmn'&&await p.$eval('[data-igbl="0"]',x=>x.value)==='C','prédio e bloco sugeridos pela unidade (CCMN, bloco C)');
 await p.selectOption('[data-igb="1"]','ct');await p.waitForTimeout(100);
 ok(await p.$$eval('[data-igbl="1"] option',x=>x.length===10),'trocar o prédio troca os blocos');
 await p.fill('[data-igs="0"]','210');await p.click('[data-igi="2"]');// desmarca a terceira
 await p.click('#igOk');await p.waitForTimeout(800);
 const g=await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-ufrj-grade-v1')));
 ok(g.length===5&&!(await p.$('#igFolha')),'importa só as aulas marcadas e fecha a folha');
 const a0=g.find(x=>x.cod==='ICP145'),mat=g.find(x=>x.cod==='MAE111');
 ok(a0&&a0.sala==='210'&&a0.bld==='ccmn'&&a0.b==='C'&&a0.ini==='10:00'&&a0.fim==='12:00'&&String(a0.dias)==='4'&&mat.bld==='ct'&&String(mat.dias)==='1,3,5'&&!JSON.stringify(g).match(/PROFESSOR|ALUNO|100000000/),'a aula entra com dias, horário, prédio, bloco e sala (sem dados pessoais)');
 ok(await p.$$eval('.gclass b',x=>x.some(y=>y.textContent==='Matemática Discreta')),'a semana mostra as aulas importadas');
 // de novo: não repete
 await p.setInputFiles('#igArq',path.join(__dirname,'amostra-grade.pdf'));await p.waitForSelector('#igFolha');await p.click('#igOk');await p.waitForTimeout(500);
 const g2=await p.evaluate(()=>JSON.parse(localStorage.getItem('cse-ufrj-grade-v1')));
 ok(g2.length===6,'importar de novo só acrescenta o que faltava (a aula que tinha sido desmarcada), sem repetir');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));
 await b.close();srv.close();process.exit(falhou?1:0)})();
