/* ======================= Seguir um ônibus da cidade, como num radar de voos =======================
   "Buscar ônibus" no mapa procura, entre os ônibus ao vivo, pela linha, pelo destino ou pelo número do carro.
   Tocar num ônibus da lista (ou direto no mapa) passa a segui-lo: o mapa acompanha o ônibus, desenha o caminho feito
   desde que começou a seguir e mostra o próximo ponto com o tempo estimado (perfil dos trechos quando há; senão,
   a velocidade informada e ~12 s em cada ponto). Arrastar o mapa pausa o acompanhamento; "Voltar ao ônibus" retoma.
   Só há posições na região do Fundão (o Worker filtra a área): fora dela, o card avisa que não há posição.
   O ônibus seguido fica guardado no aparelho por 30 min, para continuar depois de recarregar a página. */
var SEG={v:null,l:null,auto:true,rastro:[],timer:0,anim:0,ultT:0,salvo:0,preso:0};
var SEG_IC='<svg class="seg-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>';
function segNorm(s){return String(s||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Z0-9]/g,'')}
function segLinha(n){return EXT.lines.filter(function(L){return L.n===n})[0]||{n:n||'?',c:liveColor(n),st:[]}}
function segOnibus(v){return LIVE.bus.filter(function(o){return o.v===v})[0]||null}
function segIdade(s){return s<60?s+' s':Math.round(s/60)+' min'}
function segM(m){return m<1000?Math.max(10,Math.round(m/10)*10)+' m':(m/1000).toFixed(1).replace('.',',')+' km'}
function segQuando(t,m){return (t<20||m<120)?'chegando':t<60?'menos de 1 min':'~'+Math.round(t/60)+' min'}
/* a planta só cobre a Cidade Universitária; com as ruas ao redor (29-ruas-cidade.js), o mapa vai até onde há ônibus ao vivo */
function segNoMapa(S){if(!S||S.x==null)return false;var q=U([S.x,S.y]),B=limitesMapa(),m=40;return q[0]>=B.x-m&&q[0]<=B.x+B.w+m&&q[1]>=B.y-m&&q[1]<=B.y+B.h+m}
function segLonge(S){var c=U([724,405]),q=U([S.x,S.y]);return Math.hypot(q[0]-c[0],q[1]-c[1])/MPU}
function segSalva(){try{if(SEG.v)localStorage.setItem('cse-seguir',JSON.stringify({v:SEG.v,l:SEG.l,t:Date.now()}));else localStorage.removeItem('cse-seguir')}catch(e){}SEG.salvo=Date.now()}

/* botão, busca e card dentro do mapa */
(function(){
  var mw=document.querySelector('.mapwrap');if(!mw||!LIVE.url)return;
  mw.insertAdjacentHTML('beforeend','<button type="button" class="segbtn glass" id="segBtn" aria-expanded="false" aria-controls="segBusca">'+SEG_IC+'<span>Buscar ônibus</span></button>'+
    '<div class="segbusca glass" id="segBusca" role="dialog" aria-label="Buscar ônibus ao vivo" hidden></div>'+
    '<div class="segcard glass" id="segCard" role="region" aria-label="Ônibus seguido" hidden></div>'+
    '<button type="button" class="segseta" id="segSeta" aria-label="Ir até o ônibus seguido" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 16-7-4-7 4z"/></svg></button>');
  mw.addEventListener('click',function(e){
    var t=e.target;
    if(t.closest('#segBtn')){segBuscaAbre($('#segBusca').hidden);return}
    if(t.closest('#segFecha')){segBuscaAbre(false);$('#segBtn').focus();return}
    var r=t.closest('[data-segv]');if(r){segSeguir(r.dataset.segv);return}
    if(t.closest('#segX')){segPara();return}
    if(t.closest('#segVolta')||t.closest('#segSeta')){SEG.auto=true;segCard();var S=LV2.st[SEG.v];if(S&&S.x!=null)segPan(U([S.x,S.y]));return}
    var p=t.closest('[data-segpt]');if(p){select('ext',p.dataset.segpt,true);return}
  });
  mw.addEventListener('input',function(e){if(e.target.id==='segQ')segLista()});
  mw.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&!$('#segBusca').hidden){segBuscaAbre(false);$('#segBtn').focus()}
    if(e.key==='Enter'&&e.target.id==='segQ'){var r=$('#segLista [data-segv]');if(r){e.preventDefault();segSeguir(r.dataset.segv)}}
  });
  /* tocar num ônibus ao vivo no mapa passa a segui-lo (o card tem os horários do próximo ponto) */
  svg.addEventListener('click',function(e){if(suppressClick)return;var g=e.target.closest&&e.target.closest('.xlive');if(!g||!g.dataset.v)return;e.stopImmediatePropagation();segSeguir(g.dataset.v)},true);
  /* arrastar o mapa pausa o acompanhamento */
  svg.addEventListener('pointermove',function(){if(SEG.v&&SEG.auto&&svg.classList.contains('dragging')){SEG.auto=false;cancelAnimationFrame(SEG.anim);SEG.anim=0;segCard()}});
  svg.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var g=e.target.closest&&e.target.closest('.xlive');if(!g||!g.dataset.v)return;e.preventDefault();e.stopImmediatePropagation();segSeguir(g.dataset.v)},true);
})();

function segBuscaAbre(on){
  var p=$('#segBusca'),b=$('#segBtn');if(!p)return;
  if(on){
    if(!state.layers.ext)setLayer('ext',$('#chBus'));
    p.innerHTML='<div class="seg-bh"><label class="sr" for="segQ">Linha, destino ou número do carro</label><input id="segQ" type="search" placeholder="Linha, destino ou carro" autocomplete="off" enterkeyhint="search"><button type="button" class="seg-x" id="segFecha" aria-label="Fechar a busca">×</button></div>'+
      '<div id="segLista" class="seg-lista"></div><p class="seg-nota">Só aparecem os ônibus da cidade na região do Fundão.</p>';
    p.hidden=false;segLista();$('#segQ').focus({preventScroll:true});
  }else p.hidden=true;
  b.setAttribute('aria-expanded',String(!!on));segTimer();
}
function segLista(){
  var box=$('#segLista'),q=$('#segQ');if(!box)return;SEG.ultT=LIVE.t;
  if(!LIVE.t){box.innerHTML='<p class="seg-msg">'+(LIVE.err?'Ao vivo indisponível agora.':'Buscando ônibus ao vivo…')+'</p>';return}
  var Q=segNorm(q&&q.value),A=LIVE.bus.slice(),agora=Date.now();
  if(Q)A=A.filter(function(o){var L=segLinha(o.l);return segNorm(o.l).indexOf(Q)>=0||segNorm(o.v).indexOf(Q)>=0||segNorm(L.nm||L.d).indexOf(Q)>=0});
  A.sort(function(a,b){return a.l.localeCompare(b.l,'pt',{numeric:true})||a.v.localeCompare(b.v)});
  if(!A.length){box.innerHTML='<p class="seg-msg">'+(Q?'Nenhum ônibus com “'+esc(q.value.trim())+'” ao vivo agora.':'Nenhum ônibus ao vivo na região agora.')+'</p>';return}
  var top=box.scrollTop;
  box.innerHTML='<p class="seg-msg">'+A.length+' ônibus ao vivo'+(Q?' com “'+esc(q.value.trim())+'”':'')+'</p><ul>'+A.slice(0,40).map(function(o){var L=segLinha(o.l);
    return '<li><button type="button" class="seg-row'+(o.v===SEG.v?' on':'')+'" data-segv="'+esc(o.v)+'">'+extBadge(L)+'<span class="grow"><b>'+esc(L.nm||('Linha '+o.l))+'</b><small>'+(L.nm?'':'Sem horários no app · ')+'Carro '+esc(o.v)+' · '+(o.vel>2?Math.round(o.vel)+' km/h':'parado')+' · há '+segIdade(Math.max(0,Math.round((agora-o.t)/1000)))+(LV2.st[o.v]&&!segNoMapa(LV2.st[o.v])?' · fora do mapa':'')+'</small></span></button></li>'}).join('')+'</ul>'+
    (A.length>40?'<p class="seg-msg">Digite a linha para ver os outros.</p>':'');
  box.scrollTop=top;
}

function segSeguir(v,semZoom){
  if(!v)return;
  if(!state.layers.ext)setLayer('ext',$('#chBus'));
  var o=segOnibus(v);if(v!==SEG.v)SEG.rastro=[];
  SEG.v=v;SEG.l=o?o.l:SEG.l;SEG.auto=true;segSalva();
  var p=$('#segBusca');if(p&&!p.hidden)segBuscaAbre(false);
  if(!semZoom){var b=box(),z=fitW/2.6;if(view.w>z){var c=centerMap();view.w=z;view.h=z*b.h/b.w;view.x=c[0]-z/2;view.y=c[1]-z/2*b.h/b.w}}
  var S=LV2.st[v];if(S&&S.x!=null)segPan(U([S.x,S.y]),true);else schedule();
  segTimer();segTick();
}
function segPara(){
  SEG.v=null;SEG.l=null;SEG.rastro=[];segSalva();cancelAnimationFrame(SEG.anim);SEG.anim=0;
  var g=$('#gSeg');if(g)g.remove();var sa=$('#segSeta');if(sa)sa.hidden=true;var G=$('#gLive');if(G)G.classList.remove('seg-modo');
  Array.prototype.forEach.call(document.querySelectorAll('#gLive .seg-on'),function(e){e.classList.remove('seg-on')});
  segCard();segTimer();
}
function segTimer(){
  var p=$('#segBusca'),on=!!SEG.v||!!(p&&!p.hidden);
  if(on&&!SEG.timer)SEG.timer=setInterval(segTick,500);
  if(!on&&SEG.timer){clearInterval(SEG.timer);SEG.timer=0}
}
function segTick(){
  if(document.hidden)return;
  var p=$('#segBusca');if(p&&!p.hidden&&LIVE.t!==SEG.ultT)segLista();
  if(!SEG.v)return;
  if(!state.layers.ext){segPara();return}
  segMarca();segRastro();segCamera();segCard();segSetaPos();
  if(Date.now()-SEG.salvo>30e3&&segOnibus(SEG.v))segSalva();
}
/* o ônibus seguido em destaque e por cima dos outros */
function segMarca(){
  var G=$('#gLive'),S=LV2.st[SEG.v];if(!G)return;G.classList.add('seg-modo');
  Array.prototype.forEach.call(G.querySelectorAll('.seg-on'),function(e){if(!S||e!==S.el)e.classList.remove('seg-on')});
  if(S&&S.el&&S.el.isConnected){S.el.classList.add('seg-on');if(S.el!==G.lastElementChild)G.appendChild(S.el)}
}
/* caminho feito desde que começou a seguir */
function segRastro(){
  var g=$('#gExt');if(!g)return;var S=LV2.st[SEG.v],R=SEG.rastro,el=$('#gSeg');
  if(S&&S.x!=null){var u=R[R.length-1];if(!u||Math.hypot(S.x-u[0],S.y-u[1])>1.5){R.push([+S.x.toFixed(1),+S.y.toFixed(1)]);if(R.length>1200)R.shift()}}
  if(!el){g.insertAdjacentHTML('afterbegin','<g id="gSeg" pointer-events="none"><path class="seg-rastro" vector-effect="non-scaling-stroke"/></g>');el=$('#gSeg')}
  el.style.setProperty('--sc',liveColor(SEG.l));
  el.firstChild.setAttribute('d',R.length>1?'M'+R.join('L'):'');
}
/* o mapa acompanha: quando o ônibus se afasta do centro, desliza até ele */
function segCamera(){
  if(!SEG.auto)return;
  if(svg.classList.contains('dragging')){SEG.auto=false;return}
  var S=LV2.st[SEG.v];if(!S||S.x==null||SEG.anim||Date.now()-SEG.preso<5000)return;
  var p=U([S.x,S.y]),cx=view.x+view.w/2,cy=view.y+view.h/2,m=Math.min(view.w,view.h)*0.14;
  if(Math.abs(p[0]-cx)>m||Math.abs(p[1]-cy)>m)segPan(p);
}
function segPan(p,ja){
  cancelAnimationFrame(SEG.anim);SEG.anim=0;
  var x0=view.x,y0=view.y,x1=p[0]-view.w/2,y1=p[1]-view.h/2,t0=performance.now(),D=(ja||matchMedia('(prefers-reduced-motion:reduce)').matches)?0:700;
  (function f(){
    if(svg.classList.contains('dragging')){SEG.anim=0;SEG.auto=false;segCard();return}
    var k=D?Math.min(1,(performance.now()-t0)/D):1,e=1-Math.pow(1-k,3);
    view.x=x0+(x1-x0)*e;view.y=y0+(y1-y0)*e;
    if(k<1){lastGesture=Date.now();applyView();SEG.anim=requestAnimationFrame(f)}
    else{SEG.anim=0;lastGesture=0;applyView();/* na borda do mapa não dá para centralizar: espera um pouco antes de tentar de novo */
      if(Math.hypot(view.x+view.w/2-p[0],view.y+view.h/2-p[1])>Math.min(view.w,view.h)*0.14)SEG.preso=Date.now()}
  })();
}
/* seta na borda do mapa quando o ônibus seguido está fora da tela */
function segSetaPos(){
  var a=$('#segSeta'),mw=document.querySelector('.mapwrap'),S=LV2.st[SEG.v];if(!a||!mw)return;
  var el=S&&S.el&&S.el.isConnected&&S.el.querySelector('.lv-dot');if(!el){a.hidden=true;return}
  var r=el.getBoundingClientRect(),m=mw.getBoundingClientRect(),x=r.left+r.width/2-m.left,y=r.top+r.height/2-m.top,M=26;
  if(x>=0&&x<=m.width&&y>=0&&y<=m.height){a.hidden=true;return}
  var cx=m.width/2,cy=m.height/2,dx=x-cx,dy=y-cy,k=Math.min((cx-M)/Math.abs(dx||1e-9),(cy-M)/Math.abs(dy||1e-9));
  a.style.left=(cx+dx*k)+'px';a.style.top=(cy+dy*k)+'px';a.style.setProperty('--rot',(Math.atan2(dx,-dy)*180/Math.PI).toFixed(0)+'deg');a.style.setProperty('--sc',liveColor(SEG.l));a.hidden=false;
}
/* próximo ponto à frente no traçado: os pontos com nome no Fundão; fora dele, o próximo ponto do GTFS */
function segProximo(S){
  var O=S.obs;if(!O||O.i==null||S.s==null||!SHP[O.i])return null;
  var sg=O.sign>0?1:-1,L=segLinha(SEG.l),best=null;
  (L.st||[]).forEach(function(x){var G=EXTS[x[0]];if(!G)return;var r=projOn(O.i,G.p);if(!r||r.d>60*MPU)return;
    var m=(r.s-S.s)*sg/MPU;if(m>20&&m<8000&&(!best||m<best.m))best={m:m,g:x[0],nome:G.name}});
  var st=SHP[O.i].st||[];
  if(!best)for(var j=0;j<st.length;j++){var m=(st[j]-S.s)*sg/MPU;if(m>20&&(!best||m<best.m))best={m:m,g:null,nome:null}}
  if(best)best.t=segTempo(O,S.s,best.m);
  return best;
}
/* tempo até lá: trecho a trecho, a velocidade do perfil (dias úteis); onde não há perfil, a informada e ~12 s por ponto */
function segTempo(O,s0,m){
  var P=LV_PERF,agora=Date.now(),v0=lvV(O),vf=v0>2?v0:5,tr=lvmTracado(O.i),A=null,sg=O.sign>0?1:-1;
  if(P&&tr!=null&&lvDiaUtil(agora)){var per=lvPeriodo(agora);if(per&&P.periodos[per])A=P.p[tr+'|'+sg+'|'+per]||null}
  var T=0,pos=s0/MPU,falta=m,semPerfil=0,tm=(P&&P.trecho_m)||60;
  while(falta>0){var d=Math.min(20,falta),v=A?A[1][Math.floor(pos/tm)-A[0]]:null,vv;
    if(v!=null&&v>=0)vv=v/10;else{vv=vf;semPerfil+=d}
    T+=d/Math.max(1.5,vv);pos+=sg*d;falta-=d}
  if(semPerfil>m/2){var st=SHP[O.i].st||[],n=0;st.forEach(function(x){var k=(x-s0)*sg/MPU;if(k>LV_PONTO_IGNORA&&k<m-20)n++});T+=n*LV_PONTO_S}
  return T;
}
function segCard(){
  var c=$('#segCard'),mw=document.querySelector('.mapwrap');if(!c)return;
  if(!SEG.v){c.hidden=true;c.innerHTML='';if(mw)mw.classList.remove('seguindo');return}
  if(mw)mw.classList.add('seguindo');c.hidden=false;
  var o=segOnibus(SEG.v),L=segLinha(SEG.l||(o&&o.l)),S=LV2.st[SEG.v],h;
  if(!c.firstChild){
    c.innerHTML='<div class="seg-top"><span id="segBadge"></span><span class="grow"><b id="segNome"></b><small id="segCarro"></small></span><button type="button" class="seg-x" id="segX" aria-label="Parar de seguir">×</button></div><div id="segInfo"></div>'+
      '<button type="button" class="seg-volta" id="segVolta" hidden>Voltar ao ônibus</button>';
  }
  var bd=extBadge(L);if($('#segBadge').innerHTML!==bd)$('#segBadge').innerHTML=bd;
  $('#segNome').textContent=L.nm||('Linha '+L.n);$('#segCarro').textContent='Carro '+SEG.v+(SEG.auto?' · seguindo':' · seguir pausado');
  if(!LIVE.t)h='<p>Buscando a posição…</p>';
  else if(!o||!S)h='<p>Sem posição deste ônibus agora. Ele pode ter saído da região do Fundão ou parado de enviar sinal.</p>';
  else{
    h=(segNoMapa(S)?'':'<p><b>Fora da área do mapa</b>, a '+segM(segLonge(S))+' do centro da Cidade Universitária. A seta na borda mostra para onde.</p>')+'<p>'+(o.vel>2?Math.round(o.vel)+' km/h':'Parado')+' · posição de '+segIdade(Math.max(0,Math.round((Date.now()-o.t)/1000)))+' atrás, ajustada pela velocidade</p>';
    if(!L.nm)h+='<p class="seg-nota">Linha fora da lista do app (sem horários nem traçado). Ela aparece porque o ônibus está dentro da ilha.</p>';
    var nx=segProximo(S);
    if(nx)h+='<p><b>Próximo ponto'+(nx.nome?': '+esc(nx.nome):'')+'</b> · '+segM(nx.m)+' · '+segQuando(nx.t,nx.m)+'</p>'+(nx.g?'<button type="button" class="linkbtn seg-pt" data-segpt="'+esc(nx.g)+'">Horários deste ponto</button>':'');
    else if(S.i==null&&L.nm)h+='<p class="seg-nota">Fora do traçado da linha: sem estimativa de chegada.</p>';
  }
  var inf=$('#segInfo');if(inf.innerHTML!==h)inf.innerHTML=h;
  $('#segVolta').hidden=SEG.auto;
}
/* continua seguindo depois de recarregar (até 30 min) */
(function(){try{var s=JSON.parse(localStorage.getItem('cse-seguir')||'null');
  if(s&&s.v&&Date.now()-s.t<30*60e3&&LIVE.url){SEG.l=s.l;setTimeout(function(){segSeguir(s.v)},0)}else if(s)localStorage.removeItem('cse-seguir')}catch(e){}})();
