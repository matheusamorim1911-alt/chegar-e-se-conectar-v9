// De casa até a UFRJ (src/js/45-vindo-de-fora.js): busca do ponto perto de casa, ida com "Chegar até" (hora de sair),
// casa salva, viagem programada com o aviso no formato do Worker, volta para casa e para a Vila Residencial.
const { chromium } = require('playwright');const servir=require('./servidor');
(async()=>{const srv=await servir(8851);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const c=await b.newContext({viewport:{width:1200,height:950},serviceWorkers:'block',timezoneId:'America/Sao_Paulo'});
 const posts=[];
 await c.route(/gstatic\.com\/firebasejs|open-meteo|tiroteios/,r=>r.abort());
 await c.route('**workers.dev/',r=>r.abort());
 await c.route('**workers.dev/push/**',r=>{const rota=r.request().url().split('/push/')[1];let corpo={};try{corpo=JSON.parse(r.request().postData()||'{}')}catch(x){}
   if(rota==='alertas')posts.push(corpo);r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(rota==='chave'?{disponivel:true,chave:'B'+'A'.repeat(86)}:{ok:true,n:1,feitos:[]})})});
 await c.addInitScript(()=>{if(!sessionStorage.j){sessionStorage.j=1;localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}))}
   let perm='default';const sub={endpoint:'https://fcm.googleapis.com/fcm/send/vf1',options:{},unsubscribe:async()=>true};let atual=null;
   window.Notification=function(){};Object.defineProperty(window.Notification,'permission',{get:()=>perm});window.Notification.requestPermission=async()=>(perm='granted');window.PushManager=function(){};
   Object.defineProperty(navigator,'serviceWorker',{value:{ready:Promise.resolve({pushManager:{getSubscription:async()=>atual,subscribe:async()=>(atual=sub)}}),register:()=>Promise.resolve({}),addEventListener(){},controller:null}})});
 const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
 await p.clock.setFixedTime(new Date('2026-11-16T06:30:00-03:00'));/* uma segunda-feira, 6h30 */
 await p.goto('http://localhost:8851/');await p.waitForTimeout(1800);
 ok(!!(await p.$('#vfBox')),'Trajetos tem "De casa até a UFRJ"');
 await p.click('#fdVf summary');await p.waitForSelector('#vfBusca',{timeout:8000});
 await p.fill('#vfBusca','Del Castilho');await p.waitForTimeout(300);
 const itens=await p.$$eval('#vfLista button',L=>L.map(x=>x.textContent));
 ok(itens.length>0&&itens.some(t=>/Del Castilho/.test(t)&&/616|913/.test(t)),'a busca acha o ponto e mostra as linhas ('+itens.slice(0,2).join(' | ')+')');
 await p.click('#vfLista button');await p.waitForTimeout(300);
 await p.selectOption('#vfPara','hu');await p.waitForTimeout(200);
 await p.click('[data-vfmodo="chegar"]');await p.fill('#vfHora','08:00');await p.dispatchEvent('#vfHora','change');await p.waitForTimeout(400);
 let ops=await p.$$eval('.vf-op',L=>L.map(x=>x.textContent.replace(/\s+/g,' ')));
 const chega=ops.map(t=>(t.match(/chega (\d\d):(\d\d)/)||[]).slice(1).map(Number)).filter(x=>x.length);
 ok(ops.length>0&&/Saia às \d\d:\d\d/.test(ops[0])&&chega.every(x=>x[0]*60+x[1]<=480),'"Chegar até 08:00" mostra a hora de sair e chega a tempo ('+(ops[0]||'').slice(0,160)+')');
 ok(ops.some(t=>/Desça em/.test(t)&&/Caminhe \d+ min/.test(t)),'cada opção tem a caminhada, o ônibus e onde descer');
 await p.click('#vfSalvaCasa');await p.waitForTimeout(300);
 let vf=await p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('cse-cfg')).vf));
 ok(vf.casa&&Math.abs(vf.casa.la*1e3-Math.round(vf.casa.la*1e3))<1e-6,'a casa fica salva só como um ponto aproximado ('+JSON.stringify(vf.casa)+')');
 await p.click('#vfProgramar');await p.waitForTimeout(400);
 vf=await p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('cse-cfg')).vf));
 ok(vf.prog&&vf.prog.length===1&&vf.prog[0].c&&vf.prog[0].c.U&&vf.prog[0].c.U.sai<=480,'a viagem programada guarda a hora de sair dos dias úteis ('+JSON.stringify(vf.prog&&vf.prog[0].c)+')');
 ok(/Programados/.test(await p.textContent('#vfBox'))&&/hoje: saia às/.test(await p.textContent('#vfBox')),'"Programados" mostra a hora de sair de hoje');
 await p.click('[data-vfav]');await p.waitForTimeout(800);
 const al=(posts[posts.length-1]||{}).alertas||[];
 ok(al.some(a=>a.tipo==='i'&&/^Hora de sair/.test(a.txt)&&a.horas.length===1&&a.dias.join()==='1,2,3,4,5'),'ligado o aviso, ele vai para o Worker junto com os avisos de ônibus ('+JSON.stringify(al[0])+')');
 ok(/Aviso ligado/.test(await p.textContent('#vfBox')),'o app confirma que o aviso foi ligado');
 // volta
 await p.click('[data-vfaba="volta"]');await p.waitForTimeout(200);
 await p.selectOption('#vfDe','hu');await p.click('[data-vfmodo="sair"]');await p.fill('#vfHora','17:00');await p.dispatchEvent('#vfHora','change');await p.waitForTimeout(400);
 ops=await p.$$eval('.vf-op',L=>L.map(x=>x.textContent.replace(/\s+/g,' ')));
 ok(ops.length>0&&/Caminhe \d+ min até casa/.test(ops[0]),'a volta leva até perto de casa ('+(ops[0]||'').slice(0,140)+')');
 await p.click('[data-vfalvo="vila"]');await p.waitForTimeout(400);
 ops=await p.$$eval('.vf-op',L=>L.map(x=>x.textContent.replace(/\s+/g,' ')));
 ok(ops.length>0&&ops.every(t=>/Vila Residencial/.test(t)),'a volta também vai até a Vila Residencial ('+(ops[0]||'').slice(0,140)+')');
 await p.click('#vfProgramar');await p.waitForTimeout(300);
 vf=await p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('cse-cfg')).vf));
 ok(vf.prog.length===2&&vf.prog[1].p==='vila'&&vf.prog[1].c.U,'dá para programar o retorno para a Vila');
 await p.click('[data-vfdel]');await p.waitForTimeout(300);
 vf=await p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('cse-cfg')).vf));
 ok(vf.prog.length===1,'apagar uma viagem programada ('+vf.prog.length+')');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));
 await b.close();srv.close();process.exit(falhou?1:0)})();
