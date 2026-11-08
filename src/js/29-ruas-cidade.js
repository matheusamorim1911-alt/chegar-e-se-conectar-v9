/* ======================= Esboço das ruas ao redor da ilha, só com "Ônibus da cidade" ligado =======================
   Os ônibus da cidade fora da ilha (Maré, Bonsucesso, Penha, Ilha do Governador…) apareciam soltos no escuro, porque
   a planta só cobre a Cidade Universitária. Com a camada ligada, o mapa desenha por baixo deles um esboço das vias
   (OpenStreetMap, gerado por tools/ruas_cidade.py em ruas-cidade.json) e deixa arrastar até a área do ao vivo.
   Dentro da ilha nada muda: lá vale a planta. Sem a camada, o arquivo nem é baixado. */
var RUAS={d:null,carregando:false,svg:'',box:null};
/* área do ao vivo (a mesma do Worker em worker/gps-fundao.js) */
var RUAS_AREA=[-22.885,-43.27,-22.825,-43.195];
function ruasCarrega(){
  if(RUAS.d||RUAS.carregando||!window.fetch)return;RUAS.carregando=true;
  fetch('ruas-cidade.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).then(function(o){
    RUAS.carregando=false;if(o&&o.c){RUAS.d=o;RUAS.svg='';ruasDesenha()}
  },function(){RUAS.carregando=false});
}
function ruasMonta(){
  var C=RUAS.d.c,h='',f=function(v){return v.toFixed(1)};
  ['m','c','b','a'].forEach(function(k){var d='';(C[k]||[]).forEach(function(L){var la=0,lo=0;
      for(var i=0;i<L.length;i+=2){la+=L[i];lo+=L[i+1];var p=ll2map(la/1e5,lo/1e5);d+=(i?'L':'M')+f(p[0])+' '+f(p[1])}});
    if(d)h+='<path class="rua '+k+'" vector-effect="non-scaling-stroke" d="'+d+'"/>'});
  (RUAS.d.n||[]).forEach(function(n){var a=ll2map(n[1]/1e5,n[2]/1e5),b=ll2map(n[3]/1e5,n[4]/1e5),ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI+(ROT||0);
    ang=((ang%360)+540)%360-180;if(ang>90)ang-=180;if(ang<-90)ang+=180;ang-=(ROT||0);
    h+='<text class="rua-n" x="'+f(a[0])+'" y="'+f(a[1])+'" transform="rotate('+ang.toFixed(0)+' '+f(a[0])+' '+f(a[1])+')">'+esc(n[0])+'</text>'});
  return h;
}
function ruasCaixa(){
  var A=RUAS_AREA,P=[[A[0],A[1]],[A[0],A[3]],[A[2],A[1]],[A[2],A[3]]].map(function(q){return U(ll2map(q[0],q[1]))}),
      xs=P.map(function(p){return p[0]}),ys=P.map(function(p){return p[1]}),x0=Math.min.apply(0,xs),y0=Math.min.apply(0,ys);
  return {x:x0,y:y0,w:Math.max.apply(0,xs)-x0,h:Math.max.apply(0,ys)-y0};
}
function ruasDesenha(){
  var W=$('#world'),g=$('#gRuas'),on=!!state.layers.ext,at=$('#ruasFonte');
  if(at)at.hidden=!(on&&RUAS.d);
  if(!on){if(g)g.classList.add('off');return}
  ruasCarrega();if(!RUAS.d||!W)return;
  if(!g){if(!RUAS.svg)RUAS.svg=ruasMonta();W.insertAdjacentHTML('afterbegin','<g id="gRuas" pointer-events="none" aria-hidden="true">'+RUAS.svg+'</g>');g=$('#gRuas')}
  g.classList.remove('off');
}
/* com a camada ligada, dá para arrastar o mapa até a área do ao vivo */
LIMITES_EXTRA.push(function(){if(!state.layers.ext||!RUAS.d)return null;if(!RUAS.box)RUAS.box=ruasCaixa();return RUAS.box});
aoFazer('mapa vai montar',function(){RUAS.svg='';RUAS.box=null});/* a calibração do mapa pode ter mudado */
aoFazer('mapa montado',ruasDesenha);
aoFazer('mapa atualizado',ruasDesenha);
(function(){var mw=document.querySelector('.mapwrap');if(mw)mw.insertAdjacentHTML('beforeend','<p class="ruas-fonte" id="ruasFonte" hidden><span class="rf-l">Ruas ao redor: </span>© <span class="rf-l">colaboradores do </span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></p>')})();
ruasDesenha();
