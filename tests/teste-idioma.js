// Idioma: percorre as telas principais em inglês e em espanhol e falha se sobrar texto de interface em português
// (palavras que só aparecem em frases da interface, não em nomes de lugares). Mensagens prontas para enviar a
// alguém (caixa de texto) e nomes próprios ficam em português de propósito.
const { chromium } = require('playwright');const servir=require('./servidor');const am=require('./amostra-onibus.json');
const INI='(^|[\\s(“"])(',FIM=')([\\s.,:;!?)”"]|$)';
// palavras do português que não existem em inglês; para o espanhol, só as que também não existem em espanhol
const PT={en:new RegExp(INI+'você|ônibus|não|horários?|toque|aqui|agora|mostrar?|avisos?|sua|seus?|para o|para a|pelo|pela|então|também|quando|está|estão|são|trajetos?|paradas?|salvar|fechar|abrir|buscar|ligad[oa]s?|próxim[oa]s?|último|até|hoje|amanhã|ainda|mais|sem|com o|com a|aula|prédios?|senha|entrar'+FIM,'i'),
  es:new RegExp(INI+'você|ônibus|não|horários?|toque em|aqui|agora|sua|seus?|pelo|pela|então|também|quando|estão|são|trajetos?|salvar|fechar|ligad[oa]s?|até|hoje|amanhã|ainda|mais|sem|com o|com a|prédios?|senha|e os|e as|do app|da linha'+FIM,'i')};
const NOMES=/Linha (Vermelha|Amarela)|Restaurante Universitário Edson|Prédio da Prefeitura|Prédio Jorge|Até breve|^Oi[!,]|Chega aí/;
(async()=>{const srv=await servir(8825);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 for(const L of ['en','es']){
   const c=await b.newContext({viewport:{width:1280,height:950},serviceWorkers:'block'});
   await c.route(/gstatic\.com\/firebasejs/,r=>r.abort());await c.route(/open-meteo/,r=>r.abort());
   await c.route('**workers.dev/tiroteios**',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({disponivel:true,janelaH:6,atualizado:'',ocorrencias:[{id:'a',t:Date.now()-35*60e3,la:-22.86,lo:-43.24,bairro:'Maré',local:'Av. Brasil',policia:true,vitimas:1}]})}));
   await c.route('**workers.dev/',r=>{const dt=Date.now()-am.t-15000;r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({t:Date.now(),onibus:am.onibus.map(o=>({...o,t:o.t+dt}))})})});
   await c.addInitScript(L=>{if(sessionStorage.j)return;sessionStorage.j=1;localStorage.setItem('cse-cfg',JSON.stringify({login:false,tiroteios:true,simples:false,idioma:L}));localStorage.setItem('cse-lay-ext','1');localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}));localStorage.setItem('cse-perfil',JSON.stringify({name:'Ana',pin:null}));localStorage.setItem('cse-uso',JSON.stringify({t:1,estuda:true}))},L);
   const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));const sobras=new Map();
   const colhe=async tela=>{const R=await p.evaluate(()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
     while(n=w.nextNode()){const el=n.parentElement;if(!el||el.closest('script,style,#world,textarea,[data-idi-nao],.planwrap svg,#ctPlan svg'))continue;const t=n.nodeValue.replace(/\s+/g,' ').trim();if(t.length>1)out.push(t)}return out});
     R.forEach(t=>{if(PT[L].test(t)&&!NOMES.test(t)&&!sobras.has(t))sobras.set(t,tela)})};
   const cl=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.dispatchEvent(new MouseEvent('click',{bubbles:true}))},s);await p.waitForTimeout(400)};
   await p.goto('http://localhost:8825/');await p.waitForTimeout(2500);await colhe('capa');
   ok(await p.evaluate(()=>document.documentElement.lang)===L,L+': a página declara o idioma');
   await cl('[data-cv="mapa"]');await p.waitForTimeout(900);await colhe('trajetos');
   await cl('#legBtn');await colhe('legenda');await cl('#segBtn');await p.waitForTimeout(500);await colhe('buscar ônibus');await cl('#segBtn');
   await p.evaluate(()=>document.querySelectorAll('#pane-trajeto details').forEach(d=>d.open=true));await p.waitForTimeout(500);await colhe('trajetos (seções abertas)');
   await cl('#map .mk.stop');await colhe('parada');await cl('[data-go="home"]');await cl('[data-kind="night"]');await colhe('volta à noite');await cl('[data-go="home"]');
   for(const t of ['predios','grade','cal']){await cl('#tab-'+t);await p.waitForTimeout(400);await colhe(t)}
   await cl('#tab-cfg');await p.waitForTimeout(500);await p.evaluate(()=>document.querySelectorAll('#pane-cfg details').forEach(d=>d.open=true));await p.waitForTimeout(300);await colhe('ajustes');
   await cl('[data-usoabre]');await colhe('perfil de uso');
   ok(sobras.size===0,L+': nenhuma frase de interface sobrou em português'+(sobras.size?' ('+sobras.size+'): '+[...sobras].slice(0,25).map(x=>'['+x[1]+'] '+x[0].slice(0,90)).join(' | '):''));
   ok(e.length===0,L+': sem erros de JavaScript '+JSON.stringify(e));await c.close()}
 await b.close();srv.close();process.exit(falhou?1:0)})();
