// Ônibus ao vivo sem andar de ré na tela (src/js/22-onibus-ao-vivo.js: lvCorrige, LV_PRED_MAX, LV_SEGURA_M):
// quando a posição nova chega atrás do que a previsão mostrava, o marcador espera parado; correção grande vira salto.
const { chromium } = require('playwright');const servir=require('./servidor');const fs=require('fs'),path=require('path');
(async()=>{const srv=await servir(8818);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const am=JSON.parse(fs.readFileSync(path.join(__dirname,'amostra-onibus.json'),'utf8'));
 const base=am.onibus.find(o=>o.v==='B28568');  // linha 329, andando a 38 km/h
 const anda=(o,m)=>{const r=o.dir*Math.PI/180;return Object.assign({},o,{la:o.la+m*Math.cos(r)/110574,lo:o.lo+m*Math.sin(r)/(111320*Math.cos(o.la*Math.PI/180))})};
 let fase=0,t0=Date.now();
 const resp=()=>{const agora=Date.now();let o;
   if(fase===0)o=Object.assign({},base,{vel:40,t:agora-2000});
   else if(fase===1)o=Object.assign(anda(base,25),{vel:40,t:agora-2000});          // andou só 25 m: a previsão tinha passado
   else o=Object.assign(anda(base,-250),{vel:0,t:agora-2000});                      // parado bem atrás: correção grande
   return {t:agora,onibus:[o]}};
 const c=await b.newContext({viewport:{width:1100,height:850},serviceWorkers:'block'});
 await c.route(/gstatic|open-meteo|tiroteios/,r=>r.abort());
 await c.route('**workers.dev/',r=>r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(resp())}));
 await c.addInitScript(()=>{localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));localStorage.setItem('cse-lay-ext','1')});
 const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
 await p.goto('http://localhost:8818/');await p.waitForTimeout(2500);
 await p.evaluate(()=>{window.__pos=[];setInterval(()=>{const g=document.querySelector('#gLive .xlive[data-v="B28568"]');if(!g)return;const m=/translate\(([-\d.]+)[ ,]([-\d.]+)\)/.exec(g.getAttribute('transform')||'');if(m)window.__pos.push([performance.now(),+m[1],+m[2]])},50)});
 await p.waitForTimeout(6000);
 const P0=await p.evaluate(()=>window.__pos.slice());
 ok(P0.length>20,'o ônibus aparece e anda ('+P0.length+' posições)');
 const a=P0[0],z=P0[P0.length-1],dx=z[1]-a[1],dy=z[2]-a[2],L=Math.hypot(dx,dy)||1,u=[dx/L,dy/L];
 ok(L>3,'anda para a frente com a previsão');
 // posição nova atrás do que aparece
 fase=1;await p.evaluate(()=>window.__pos=[]);
 await p.waitForTimeout(12000);
 const P1=await p.evaluate(()=>window.__pos.slice());
 let re=0;for(let k=1;k<P1.length;k++){const d=(P1[k][1]-P1[k-1][1])*u[0]+(P1[k][2]-P1[k-1][2])*u[1];if(d<0)re+=-d}
 ok(re<1.5,'posição nova atrás da previsão: o marcador não anda de ré (ré somada: '+re.toFixed(2)+' unidades)');
 const parado=P1.some((q,k)=>k>5&&Math.hypot(q[1]-P1[k-5][1],q[2]-P1[k-5][2])<0.05);
 ok(parado,'o marcador espera parado até a previsão alcançá-lo');
 // correção grande: salta (sem posições no meio do caminho de volta)
 fase=2;await p.evaluate(()=>window.__pos=[]);
 await p.waitForTimeout(12000);
 const P2=await p.evaluate(()=>window.__pos.slice());
 let passos=0,maior=0;for(let k=1;k<P2.length;k++){const d=(P2[k][1]-P2[k-1][1])*u[0]+(P2[k][2]-P2[k-1][2])*u[1];if(d<-0.5)passos++;maior=Math.min(maior,d)}
 ok(maior<-20&&passos<=1,'correção grande para trás vira um salto, não um deslize (passos para trás: '+passos+', maior '+maior.toFixed(0)+')');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));
 await b.close();srv.close();process.exit(falhou?1:0)})();
