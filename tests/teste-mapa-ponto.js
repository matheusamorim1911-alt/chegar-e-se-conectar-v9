// Mapa ao vivo até o ponto (src/js/49-mapa-ate-o-ponto.js): na ida com "Sair agora", abre o mapa da cidade
// (Leaflet servido daqui; os quadros do OpenStreetMap e o Worker são simulados), mostra você, o ponto e os ônibus
// das linhas que levam ao Fundão, com o tempo estimado até o ponto. O Worker recebe o ponto, não a posição da pessoa.
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');const servir=require('./servidor');
const VF=JSON.parse(fs.readFileSync(path.join(__dirname,'..','vindo-de-fora.json'),'utf8'));
const LDIR=path.join(__dirname,'..','node_modules','leaflet','dist');
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64');
/* um ônibus de verdade da linha pedida, 3 pontos antes do ponto de embarque, andando para ele */
function onibusAntes(la,lo,linha){
  let pi=-1,dm=1e9;VF.p.forEach((p,i)=>{const d=Math.hypot(p[1]/1e5-la,p[2]/1e5-lo);if(d<dm){dm=d;pi=i}});
  for(const R of VF.r){if(R.n!==linha)continue;for(let k=0;k<R.s.length;k+=2)if(R.s[k]===pi&&k>=6){const a=VF.p[R.s[k-6]],b=VF.p[R.s[k-4]];
    const dir=(Math.atan2((b[2]-a[2])*Math.cos(la*Math.PI/180),b[1]-a[1])*180/Math.PI+360)%360;return {la:a[1]/1e5,lo:a[2]/1e5,dir,min:R.s[k+1]-R.s[k-5]}}}
  return null;
}
(async()=>{const srv=await servir(8857);const b=await chromium.launch();let falhou=false;const ok=(c,m)=>{console.log((c?'ok   ':'FALHA')+'  '+m);if(!c)falhou=true};
 const c=await b.newContext({viewport:{width:430,height:900},serviceWorkers:'block',timezoneId:'America/Sao_Paulo',geolocation:{latitude:-22.8461,longitude:-43.2731},permissions:['geolocation']});
 await c.route(/gstatic\.com\/firebasejs|open-meteo|tiroteios/,r=>r.abort());
 await c.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/leaflet\/1\.9\.4\/leaflet\.min\.(js|css)/,r=>{const css=/\.css$/.test(r.request().url());r.fulfill({contentType:css?'text/css':'text/javascript',body:fs.readFileSync(path.join(LDIR,css?'leaflet.css':'leaflet.js'))})});
 await c.route(/tile\.openstreetmap\.org/,r=>r.fulfill({contentType:'image/png',body:PNG}));
 const pedidos=[];let esperado=null;
 await c.route('**workers.dev/perto**',r=>{const u=new URL(r.request().url());pedidos.push(u.search);const la=+u.searchParams.get('la'),lo=+u.searchParams.get('lo'),L=u.searchParams.get('l').split(',');
   const o=[];for(const l of L){const x=onibusAntes(la,lo,l);if(x){o.push({v:'C'+l,l,la:x.la,lo:x.lo,vel:25,dir:Math.round(x.dir),t:Date.now()-10000,d:800});if(!esperado)esperado={l,min:x.min}}}
   r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-expose-headers':'x-prox','x-prox':'8000'},body:JSON.stringify({t:Date.now(),onibus:o})})});
 await c.route('**workers.dev/',r=>r.abort());
 await c.addInitScript(()=>{if(sessionStorage.j)return;sessionStorage.j=1;localStorage.setItem('cse-cfg',JSON.stringify({cover:'none',login:false,banner:false,flow:false}));localStorage.setItem('cse-instalar',JSON.stringify({nunca:true}))});
 const p=await c.newPage();const e=[];p.on('pageerror',x=>e.push(x.message));
 await p.clock.setFixedTime(new Date('2026-11-16T07:00:00-03:00'));
 await p.goto('http://localhost:8857/');await p.waitForTimeout(1800);
 await p.click('#fdVf summary');await p.waitForSelector('#vfBusca',{timeout:8000});
 await p.fill('#vfBusca','Penha');await p.waitForTimeout(300);await p.click('#vfLista button');await p.waitForTimeout(300);
 await p.selectOption('#vfPara','ctl');await p.waitForTimeout(300);await p.click('[data-vfmodo="agora"]');await p.waitForTimeout(500);
 ok(!!(await p.$('#vmAbre')),'na ida com "Sair agora" aparece "Ver os ônibus ao vivo no mapa"');
 await p.click('#vmAbre');await p.waitForSelector('#vmFolha .leaflet-container',{timeout:8000});await p.waitForTimeout(1500);
 ok(await p.$$eval('.leaflet-tile',L=>L.length)>0,'o mapa do OpenStreetMap carrega (Leaflet só quando abre)');
 ok(/OpenStreetMap/.test(await p.textContent('#vmFolha')),'mostra o crédito do OpenStreetMap');
 const q=new URLSearchParams(pedidos[0]||'');
 ok(pedidos.length>0&&q.get('l')&&!/-22\.846|-43\.273/.test(pedidos[0]),'pede ao Worker só o ponto e as linhas, não a posição da pessoa ('+pedidos[0]+')');
 ok(await p.$$eval('#vmFolha path.leaflet-interactive',L=>L.length)>=3,'desenha você, o ponto e o caminho a pé');
 const nb=await p.$$eval('.vm-bus',L=>L.length);
 ok(nb>0,'os ônibus ao vivo aparecem no mapa ('+nb+')');
 const lista=await p.textContent('#vmLista');
 const m=lista.match(/Chega em ~(\d+) min/);
 ok(!!m&&esperado&&Math.abs(+m[1]-esperado.min)<=Math.max(4,esperado.min*0.6),'tempo até o ponto pela viagem da linha ('+(m&&m[0])+'; GTFS '+(esperado&&esperado.min)+' min)');
 ok(/~\d+ min a pé/.test(await p.textContent('#vmPonto')),'diz quanto tempo a pé até o ponto');
 await p.keyboard.press('Escape');await p.waitForTimeout(300);
 ok(!(await p.$('#vmFolha')),'fecha com Esc');
 const n=pedidos.length;await p.waitForTimeout(9000);
 ok(pedidos.length===n,'fechado, para de pedir posições');
 ok(e.length===0,'sem erros de JavaScript '+JSON.stringify(e));
 await b.close();srv.close();process.exit(falhou?1:0)})();
