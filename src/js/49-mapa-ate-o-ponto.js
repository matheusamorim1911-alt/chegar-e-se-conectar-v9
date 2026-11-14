/* ======================= Mapa ao vivo até o ponto =======================
   Em "De casa até a UFRJ", na ida com "Sair agora": "Ver os ônibus ao vivo no mapa" abre um mapa da cidade
   (OpenStreetMap, pela biblioteca Leaflet, baixada só nessa hora) com onde a pessoa está, o caminho a pé até o
   ponto de embarque e os ônibus ao vivo das linhas que levam ao Fundão a partir dali, com a distância e o tempo
   estimado até o ponto. As posições vêm do Worker (/perto: só as linhas e o ponto; a posição da pessoa não sai do
   aparelho). O tempo: o ônibus é encaixado no ponto mais perto da viagem dele (no sentido do movimento) e soma-se o
   tempo do GTFS até o ponto de embarque, com a mesma razão de viagem medida no GPS (r2). */
var VM={L:null,carregando:null,mapa:null,camada:null,pi:-1,linhas:[],timer:0,geo:null,eu:null,aberto:false,ult:null,ajustou:false,erro:''};
var VM_LEAFLET='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
function vmBotaoHTML(){return '<div class="row gbtns vm-bt"><button type="button" class="copy primary" id="vmAbre">Ver os ônibus ao vivo no mapa</button></div>'}
function vmCarregaLeaflet(){
  if(window.L&&window.L.map)return Promise.resolve(window.L);
  if(VM.carregando)return VM.carregando;
  VM.carregando=new Promise(function(ok,falha){
    var c=document.createElement('link');c.rel='stylesheet';c.href=VM_LEAFLET+'leaflet.min.css';document.head.appendChild(c);
    var s=document.createElement('script');s.src=VM_LEAFLET+'leaflet.min.js';s.onload=function(){window.L&&window.L.map?ok(window.L):falha()};s.onerror=function(){VM.carregando=null;falha()};document.head.appendChild(s);
  });
  return VM.carregando;
}
/* os pontos de embarque das opções da ida e as linhas que levam ao Fundão a partir de cada um */
function vmPontos(){
  var o=[],D=VF.d;(VF.ops||[]).forEach(function(op){op.pernas.forEach(function(p){if(!p.c||p.pi==null)return;
    var x=o.filter(function(y){return y.pi===p.pi})[0];if(!x){x={pi:p.pi,n:D.p[p.pi].n,la:D.p[p.pi].la,lo:D.p[p.pi].lo,pe:op.pernas[0].pe||0,l:[]};o.push(x)}
    if(x.l.indexOf(p.c.n)<0)x.l.push(p.c.n)})});
  /* mais as outras linhas que passam aqui rumo à ilha */
  o.forEach(function(x){D.p[x.pi].r.forEach(function(r){var R=D.r[r[0]];if(x.l.length>=12||x.l.indexOf(R.n)>=0)return;
    for(var q=r[1]+2;q<R.s.length;q+=2)if(D.p[R.s[q]].il){x.l.push(R.n);break}})});
  return o;
}
function vmDist(la1,lo1,la2,lo2){var kx=111320*Math.cos(la1*Math.PI/180);return Math.hypot((lo2-lo1)*kx,(la2-la1)*110574)}
function vmRumo(la1,lo1,la2,lo2){var kx=Math.cos(la1*Math.PI/180);return (Math.atan2((lo2-lo1)*kx,la2-la1)*180/Math.PI+360)%360}
/* tempo até o ponto: encaixa o ônibus na viagem da linha que passa no ponto rumo à ilha */
function vmChegada(o,pi){
  var D=VF.d,best=null;
  D.p[pi].r.forEach(function(r){var R=D.r[r[0]];if(R.n!==o.l)return;var pos=r[1];
    for(var j=0;j<R.s.length;j+=2){var P=D.p[R.s[j]],d=vmDist(o.la,o.lo,P.la,P.lo);if(d>500)continue;
      if(o.vel>3&&j+2<R.s.length){var N=D.p[R.s[j+2]],dr=Math.abs(((o.dir-vmRumo(P.la,P.lo,N.la,N.lo))%360+540)%360-180);if(dr>100)continue}
      if(!best||d<best.d)best={d:d,j:j,pos:pos,R:R}}});
  if(!best)return null;
  if(best.j>best.pos)return {passou:true};
  var min=(best.R.s[best.pos+1]-best.R.s[best.j+1])*vfRazao(nowMin())[0];
  return {min:Math.max(0,Math.round(min)),passou:false};
}
function vmFolhaHTML(){
  var P=vmPontos(),x=P.filter(function(p){return p.pi===VM.pi})[0]||P[0];if(x)VM.pi=x.pi;
  return '<div class="vm-cab"><h2 id="vmT">Ônibus ao vivo até o ponto</h2><button type="button" class="alv-x" id="vmFecha" aria-label="Fechar o mapa">×</button></div>'+
    (P.length>1?'<div class="seg chips vm-pts" role="group" aria-label="Ponto de embarque">'+P.map(function(p){return '<button type="button" data-vmpi="'+p.pi+'" aria-pressed="'+(p.pi===VM.pi)+'">'+esc(p.n)+' <span class="muted">· '+esc(p.l.slice(0,3).join(', '))+'</span></button>'}).join('')+'</div>':'')+
    '<div id="vmMapa" class="vm-mapa" role="img" aria-label="Mapa com você, o ponto de ônibus e os ônibus ao vivo"></div>'+
    '<p class="small keep vm-ponto" id="vmPonto"></p><ul class="vm-lista" id="vmLista" aria-live="polite"></ul>'+
    '<p class="muted small keep vm-cred">Mapa: © colaboradores do OpenStreetMap. Posições: prefeitura do Rio (GPS dos ônibus).</p>';
}
function vmAbre(){
  if(VM.aberto)return;VM.aberto=true;VM.ajustou=false;VM.ult=null;VM.erro='';
  document.body.insertAdjacentHTML('beforeend','<div class="inst-fundo" id="vmFundo"></div><div class="vm-folha" id="vmFolha" role="dialog" aria-modal="true" aria-labelledby="vmT">'+vmFolhaHTML()+'</div>');
  requestAnimationFrame(function(){var f=$('#vmFolha');if(f)f.classList.add('on');var g=$('#vmFundo');if(g)g.classList.add('on');var b=$('#vmFecha');if(b)b.focus({preventScroll:true})});
  vmTexto('Carregando o mapa…');
  vmCarregaLeaflet().then(function(L){VM.L=L;vmMontaMapa();vmPede()}).catch(function(){vmTexto('Não deu para carregar o mapa. Confira a conexão.');vmPede()});
  /* onde a pessoa está: só no aparelho */
  if('geolocation' in navigator)try{VM.geo=navigator.geolocation.watchPosition(function(p){VM.eu=[p.coords.latitude,p.coords.longitude];vmPinta()},function(){},{enableHighAccuracy:true,maximumAge:15000,timeout:20000})}catch(e){}
}
function vmFecha(){
  VM.aberto=false;clearTimeout(VM.timer);if(VM.geo!=null&&navigator.geolocation)try{navigator.geolocation.clearWatch(VM.geo)}catch(e){}VM.geo=null;
  if(VM.mapa){try{VM.mapa.remove()}catch(e){}VM.mapa=null}
  var f=$('#vmFolha'),g=$('#vmFundo');if(f)f.remove();if(g)g.remove();var b=$('#vmAbre');if(b)b.focus({preventScroll:true});
}
function vmTexto(t){var l=$('#vmLista');if(l)l.innerHTML='<li class="muted small keep">'+esc(t)+'</li>'}
function vmPonto(){return vmPontos().filter(function(p){return p.pi===VM.pi})[0]}
function vmMontaMapa(){
  var L=VM.L,x=vmPonto();if(!L||!x||!$('#vmMapa'))return;
  VM.mapa=L.map('vmMapa',{zoomControl:true,attributionControl:true}).setView([x.la,x.lo],15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(VM.mapa);
  VM.camada=L.layerGroup().addTo(VM.mapa);vmPinta();
}
/* posições: o Worker devolve os ônibus das linhas perto do ponto (até 6 km) */
function vmPede(){
  clearTimeout(VM.timer);if(!VM.aberto)return;var x=vmPonto();
  if(!x||!LIVE.url||!window.fetch){vmTexto('Ônibus ao vivo indisponíveis aqui.');return}
  var prox=10000;
  fetch(LIVE.url+'/perto?la='+x.la.toFixed(5)+'&lo='+x.lo.toFixed(5)+'&l='+encodeURIComponent(x.l.join(','))+'&r=6000',{cache:'no-store'})
    .then(function(r){var h=+r.headers.get('x-prox');if(h>=0)prox=Math.min(12000,Math.max(2000,h+600));if(r.status===404)throw 'velho';return r.json()})
    .then(function(j){VM.ult=j;VM.erro=j.falhou?'A prefeitura do Rio não respondeu agora. Tentando de novo.':'';vmPinta()})
    .catch(function(e){VM.erro=e==='velho'?'O Worker ainda não tem o mapa ao vivo: ele precisa ser publicado de novo na Cloudflare.':'Sem conexão com os ônibus ao vivo. Tentando de novo.';prox=5000;vmPinta()})
    .then(function(){if(VM.aberto)VM.timer=setTimeout(vmPede,prox)});
}
function vmIcone(L,o,c){return L.divIcon({className:'vm-ic',html:'<span class="vm-bus" style="--c:'+esc(c)+'"><i style="transform:rotate('+(o.dir||0)+'deg)"></i>'+esc(o.l.replace(/^S[A-Z]*/,''))+'</span>',iconSize:[34,22],iconAnchor:[17,11]})}
function vmPinta(){
  if(!VM.aberto)return;var x=vmPonto();if(!x)return;var L=VM.L;
  var eu=VM.eu||(VF.origem?[VF.origem.la,VF.origem.lo]:null),pe=eu?Math.max(1,Math.round(vmDist(eu[0],eu[1],x.la,x.lo)*1.3/75)):x.pe;
  var pt=$('#vmPonto');if(pt)pt.textContent='Seu ponto: '+x.n+(pe?' · ~'+pe+' min a pé':'');
  var bus=((VM.ult&&VM.ult.onibus)||[]).map(function(o){var c=vmChegada(o,x.pi);return {o:o,c:c}}).filter(function(b){return !(b.c&&b.c.passou)});
  bus.sort(function(a,b){return (a.c?a.c.min:999)-(b.c?b.c.min:999)||a.o.d-b.o.d});
  if(L&&VM.mapa){
    VM.camada.clearLayers();
    L.circleMarker([x.la,x.lo],{radius:9,color:'#fff',weight:3,fillColor:'#1A73E8',fillOpacity:1}).bindTooltip('Seu ponto: '+x.n).addTo(VM.camada);
    if(eu){L.circleMarker(eu,{radius:7,color:'#fff',weight:2,fillColor:'#E8453C',fillOpacity:1}).bindTooltip(VM.eu?'Você':'Saindo daqui').addTo(VM.camada);
      L.polyline([eu,[x.la,x.lo]],{color:'#1A73E8',weight:3,dashArray:'6 8',opacity:.8}).addTo(VM.camada)}
    bus.forEach(function(b){var R=VF.d.r.filter(function(R){return R.n===b.o.l})[0];
      L.marker([b.o.la,b.o.lo],{icon:vmIcone(L,b.o,R?vfCor(R):liveColor(b.o.l)),keyboard:false}).bindTooltip(b.o.l+(b.c?' · ~'+b.c.min+' min até o ponto':'')).addTo(VM.camada)});
    if(!VM.ajustou){var pts=[[x.la,x.lo]];if(eu)pts.push(eu);bus.slice(0,3).forEach(function(b){pts.push([b.o.la,b.o.lo])});
      if(pts.length>1){VM.mapa.fitBounds(pts,{padding:[30,30],maxZoom:16,animate:false});/* sem animação: um enquadramento no meio da animação de outro era ignorado */VM.ajustou=!!VM.ult}}
  }
  var l=$('#vmLista');if(!l)return;
  if(VM.erro&&!bus.length){vmTexto(VM.erro);return}
  if(!VM.ult){vmTexto('Procurando os ônibus…');return}
  if(!bus.length){var w=VF.ops&&VF.ops[0]&&VF.ops[0].pernas.filter(function(p){return p.c})[0];
    vmTexto('Nenhum ônibus destas linhas visto perto agora.'+(w?' Pela espera típica, ~'+Math.max(1,Math.round(w.w[0]))+' min.':''));return}
  l.innerHTML=bus.slice(0,8).map(function(b){var R=VF.d.r.filter(function(R){return R.n===b.o.l})[0];
    return '<li><span class="lb" style="--c:'+esc(R?vfCor(R):liveColor(b.o.l))+'">'+esc(b.o.l)+'</span><span class="grow">'+(b.c?'<b>Chega em ~'+b.c.min+' min</b>':'<b>Perto do ponto</b>')+'<span class="muted small keep">A '+(b.o.d<1000?b.o.d+' m':(b.o.d/1000).toFixed(1).replace('.',',')+' km')+' do ponto · carro '+esc(b.o.v)+'</span></span></li>'}).join('')+
    (VM.erro?'<li class="muted small keep">'+esc(VM.erro)+'</li>':'');
}
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;var b;
  if(t.closest('#vmAbre')){vmAbre();return}
  if(t.closest('#vmFecha')||t.id==='vmFundo'){vmFecha();return}
  if((b=t.closest('[data-vmpi]'))){VM.pi=+b.dataset.vmpi;VM.ajustou=false;VM.ult=null;
    document.querySelectorAll('[data-vmpi]').forEach(function(x){x.setAttribute('aria-pressed',String(+x.dataset.vmpi===VM.pi))});
    if(VM.mapa){var x=vmPonto();VM.mapa.setView([x.la,x.lo],15)}vmPinta();vmPede();return}
});
document.addEventListener('keydown',function(e){if(VM.aberto&&e.key==='Escape')vmFecha()});
