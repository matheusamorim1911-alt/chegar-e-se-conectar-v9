// Avisos em todos os aparelhos da conta (src/js/47-avisos-em-todos-aparelhos.js), com Firebase e Worker simulados:
// os dois aparelhos mandam o mesmo código de grupo ao Worker, e ligar os tiroteios num liga no outro.
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');const servir=require('./servidor');
const mock=fs.readFileSync(path.join(__dirname,'firebase-mock.js'),'utf8');
const USER={uid:'uA',displayName:'Aluna',email:'aluna@ufrj.br',photoURL:'',emailVerified:true,providerData:[{providerId:'google.com'}]};
const AVISO={id:'a1',st:'hu',int:true,ext:false,li:[],lc:[],min:5,dias:'uteis',hDe:'06:00',hAte:'22:00',on:true};
(async()=>{const srv=await servir(8856);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 async function aparelho(o){
   const c=await b.newContext({viewport:{width:1200,height:900},serviceWorkers:'block'});const posts=[];
   await c.route(/gstatic\.com\/firebasejs\/.*app-compat\.js/,r=>r.fulfill({contentType:'text/javascript',body:mock}));
   await c.route(/gstatic\.com\/firebasejs\/.*(auth|firestore)-compat\.js/,r=>r.fulfill({contentType:'text/javascript',body:''}));
   await c.route(/open-meteo|gravatar|tiroteios/,r=>r.abort());
   await c.route('**workers.dev/',r=>r.abort());
   await c.route('**workers.dev/push/**',r=>{const rota=r.request().url().split('/push/')[1];let corpo={};try{corpo=JSON.parse(r.request().postData()||'{}')}catch(x){}
     posts.push({rota,corpo});r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(rota==='chave'?{disponivel:true,chave:'B'+'A'.repeat(86)}:{ok:true,n:1,feitos:[],aparelhos:2})})});
   await c.addInitScript(o=>{window.__nextUser=o.user;
     let perm='granted';const sub={endpoint:'https://fcm.googleapis.com/fcm/send/'+o.nome,options:{},unsubscribe:async()=>true};let atual=sub;
     window.Notification=function(){};Object.defineProperty(window.Notification,'permission',{get:()=>perm});window.Notification.requestPermission=async()=>(perm='granted');window.PushManager=function(){};
     Object.defineProperty(navigator,'serviceWorker',{value:{ready:Promise.resolve({pushManager:{getSubscription:async()=>atual,subscribe:async()=>(atual=sub)}}),register:()=>Promise.resolve({}),addEventListener(){},controller:null}});
     if(sessionStorage.j)return;sessionStorage.j=1;window.__fbstore=o.loja||{};
     localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',banner:false,login:false,flow:false}));localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}));
     if(o.avisos)localStorage.setItem('cse-avisos-onibus',JSON.stringify({c:o.avisos,u:[]}))},Object.assign({user:USER},o));
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));await p.goto('http://localhost:8856/');await p.waitForTimeout(1800);
   await p.click('#tab-cfg');await p.waitForTimeout(400);await p.click('#accsec [data-goo]');await p.waitForTimeout(2500);
   return {c,p,e,posts};
 }
 const A=await aparelho({nome:'computador',avisos:[AVISO]});
 const gA=(A.posts.filter(x=>x.rota==='alertas').pop()||{corpo:{}}).corpo.g;
 ok(/^[a-f0-9]{32}$/.test(gA||''),'depois de entrar, o aparelho manda ao Worker o código de grupo da conta');
 // A liga os tiroteios
 await A.p.evaluate(()=>{const d=document.getElementById('cfgPush');if(d){d.checked=true;d.dispatchEvent(new Event('change',{bubbles:true}))}});await A.p.waitForTimeout(2000);
 const asA=A.posts.filter(x=>x.rota==='assinar').pop();
 ok(asA&&asA.corpo.g===gA,'ao ligar os tiroteios, a assinatura vai com o código de grupo');
 const loja=await A.p.evaluate(()=>JSON.parse(JSON.stringify(window.__fbstore)));
 ok(loja['usuarios/uA'].cfg.tiroPush==='on'&&loja['usuarios/uA'].cfg.pushGrupo===gA,'a conta guarda o código e "tiroteios ligados"');
 // B: mesma conta, outro aparelho com notificações permitidas
 const B=await aparelho({nome:'celular',loja});
 const gB=(B.posts.filter(x=>x.rota==='alertas').pop()||{corpo:{}}).corpo.g;
 ok(gB===gA,'o outro aparelho usa o mesmo código (os avisos da conta chegam nos dois)');
 ok(B.posts.some(x=>x.rota==='assinar'&&x.corpo.g===gA),'o outro aparelho liga os tiroteios sozinho, como na conta');
 // teste mandado de B: com o código
 await B.p.evaluate(()=>{const b=document.querySelector('#alvsec button[id*="este"], #alvTeste');if(b)b.click()});await B.p.waitForTimeout(800);
 const tB=B.posts.filter(x=>x.rota==='teste').pop();
 ok(tB&&tB.corpo.g===gA&&tB.corpo.tipo==='onibus','"Mandar um teste" vai com o código (o Worker manda para todos os aparelhos)');
 ok(/Teste enviado para 2 aparelhos/.test(await B.p.textContent('#alvsec')),'o app diz para quantos aparelhos o teste foi');
 ok(A.e.length===0&&B.e.length===0,'sem erros de JavaScript '+JSON.stringify(A.e.concat(B.e)));
 await b.close();srv.close();process.exit(falhou?1:0)})();
