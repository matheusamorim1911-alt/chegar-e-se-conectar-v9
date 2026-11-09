/* ======================= v27: ônibus da cidade (GTFS da SMTR) que saem do Fundão ======================= */
var EXT=__EXT_ONIBUS__;
var EXT_G=[['centro','Centro'],['sul','Zona Sul'],['tijuca','Tijuca'],['norte','Zona Norte'],['ilha','Ilha do Governador'],['oeste','Zona Oeste']];
var EXTS={};Object.keys(EXT.stops).forEach(function(k){var s=EXT.stops[k],p=ll2map(s[1],s[2]);EXTS[k]={name:s[0],p:[p[0],p[1]]}});
var EXTSEL={g:null,ln:null};
/* ônibus ao vivo: o estado vem antes de tudo, porque o bloco "Ônibus da cidade" aberto já mostra as contagens ao vivo
   na carga (extNoTrajeto, mais abaixo). Ele ficava depois: com o bloco aberto, a carga parava com erro e o resto do
   app (ônibus ao vivo, planta do CT, seguir ônibus…) nem chegava a rodar. */
var LIVE={url:(window.CSE_GPS_URL||'').replace(/\/$/,''),bus:[],t:0,err:false,timer:null};
state.layers.ext=(function(){try{return localStorage.getItem('cse-lay-ext')==='1'}catch(e){return false}})();
function extSvc(d){var w=d.getDay();return w===0?'D':w===6?'S':'U'}
/* próximas saídas de uma linha numa parada (minutos do dia; inclui viagens da madrugada do dia anterior) */
function extNext(L,stop,now,n){
  var off=0,has=false;L.st.forEach(function(s){if(s[0]===stop){off=s[1];has=true}});if(!has&&stop)return [];
  var d=new Date(),hoje=L.t[extSvc(d)]||[],ont=L.t[extSvc(new Date(d.getTime()-864e5))]||[],r=[];
  ont.forEach(function(t){var x=t+off-1440;if(x>=now-1)r.push(x)});hoje.forEach(function(t){var x=t+off;if(x>=now-1)r.push(x)});
  r.sort(function(a,b){return a-b});return r.slice(0,n||3);
}
function extToday(L){return (L.t[extSvc(new Date())]||[]).length}
function extBadge(L){return '<span class="xb'+(L.brt?' brt':'')+'" style="--xc:'+(L.c||'#5B6B7A')+'">'+(L.brt?'BRT ':'')+esc(L.n)+'</span>'}
function extWhen(L,stop,now){
  var nx=extNext(L,stop,now,2),vivo=liveTag(L.n);
  if(!extToday(L))return '<span class="muted">não circula hoje</span>'+vivo;
  if(!nx.length)return '<span class="muted">sem mais saídas hoje</span>'+vivo;
  var a=Math.round(nx[0]-now);
  return '<b>'+(a<=1?'agora':a<60?'em '+a+' min':bt(nx[0]))+'</b>'+(nx[1]!=null?' · depois '+bt(nx[1]):'')+vivo;
}
function extStopsOf(L){return L.st.map(function(s){return EXTS[s[0]]?EXTS[s[0]].name:s[0]})}
/* painel "Ônibus da cidade" em Trajetos */
function extPanelHTML(now){
  var g=EXTSEL.g,all=EXT.lines.filter(function(L){return !g||L.g===g}),ls=all.filter(function(L){return extToday(L)}),fora=all.length-ls.length;
  ls.sort(function(a,b){var x=extNext(a,a.st[0][0],now,1)[0],y=extNext(b,b.st[0][0],now,1)[0];return (x==null?1e9:x)-(y==null?1e9:y)});
  var chips='<div class="seg chips xg" role="group" aria-label="Destino"><button type="button" data-xg="" aria-pressed="'+!g+'">Todos</button>'+EXT_G.map(function(G){return '<button type="button" data-xg="'+G[0]+'" aria-pressed="'+(g===G[0])+'">'+G[1]+'</button>'}).join('')+'</div>';
  var list='<ul class="xl-list">'+ls.map(function(L){
    var k=L.n+'|'+L.d,open=EXTSEL.ln===k,first=L.st[0][0];
    return '<li><button type="button" class="xl-row" data-xln="'+esc(k)+'" aria-expanded="'+open+'">'+extBadge(L)+'<span class="grow"><b>'+esc(L.d)+'</b><small>'+extWhen(L,first,now)+' · '+esc(EXTS[first]?EXTS[first].name:'')+'</small></span></button>'+
      (open?'<div class="xl-more"><p class="small keep">'+esc(L.nm)+'. Passa por: '+extStopsOf(L).map(function(n,i){return '<button type="button" class="linkbtn" data-kind="ext" data-id="'+L.st[i][0]+'">'+esc(n)+'</button>'}).join(', ')+'.</p><p class="small keep">Hoje: '+extToday(L)+' saídas'+(extToday(L)?', da primeira às '+fmt((L.t[extSvc(new Date())]||[0])[0])+' à última às '+fmt((L.t[extSvc(new Date())]||[0]).slice(-1)[0]):'')+'.</p></div>':'')+'</li>'}).join('')+'</ul>';
  return liveStatusHTML()+chips+list+(fora?'<p class="muted small keep">'+fora+' linha'+(fora>1?'s':'')+' deste destino não circula'+(fora>1?'m':'')+' hoje.</p>':'')+'<p class="muted small keep xsrc">Horários programados pela prefeitura ('+esc(EXT.fonte)+'). O trânsito pode atrasar o ônibus.'+
    (REDUT&&REDUT.ajuste?' A posição ao vivo considera os semáforos mapeados pela UFRJ e pelo OpenStreetMap (© colaboradores do OpenStreetMap).':'')+'</p>';
}
function extFoldHTML(now){
  var open=(function(){try{return localStorage.getItem('cse-fold-ext')==='1'}catch(e){return false}})();
  var nx=EXT.lines.map(function(L){return {L:L,t:extNext(L,L.st[0][0],now,1)[0]}}).filter(function(x){return x.t!=null}).sort(function(a,b){return a.t-b.t})[0];
  var sub=nx?'Próximo: '+esc(nx.L.n)+' para '+esc(nx.L.d)+' '+(nx.t-now<=1?'agora':'em '+Math.round(nx.t-now)+' min'):'Linhas municipais e BRT que saem do Fundão';
  return '<div id="extbox">'+foldHTML('fdExt',open,'Ônibus da cidade','<small>'+sub+'</small>',open?extPanelHTML(now):'')+'</div>';
}
function extNoTrajeto(){if(plan&&!$('#extbox'))plan.insertAdjacentHTML('beforeend',extFoldHTML(nowMin()))}
aoFazer('trajeto montado',extNoTrajeto);
extNoTrajeto();/* Trajetos já foi montado uma vez antes desta parte carregar: sem isto, o bloco só aparecia na remontagem seguinte */
function extRepaint(){var b=$('#extbox');if(b){var t=document.createElement('div');t.innerHTML=extFoldHTML(nowMin());b.replaceWith(t.firstChild)}}
document.addEventListener('toggle',function(e){if(e.target&&e.target.id==='fdExt'){try{localStorage.setItem('cse-fold-ext',e.target.open?'1':'0')}catch(x){}if(e.target.open&&!e.target.querySelector('.xl-list'))extRepaint()}},true);
document.addEventListener('click',function(e){
  var g=e.target.closest&&e.target.closest('[data-xg]');if(g){EXTSEL.g=g.dataset.xg||null;EXTSEL.ln=null;extRepaint();return}
  var r=e.target.closest&&e.target.closest('[data-xln]');if(r){EXTSEL.ln=EXTSEL.ln===r.dataset.xln?null:r.dataset.xln;extRepaint();var n=$('[data-xln="'+r.dataset.xln.replace(/"/g,'')+'"]');if(n)n.focus({preventScroll:true})}
});
setInterval(function(){var b=$('#fdExt');if(b&&b.open&&!(document.activeElement&&b.contains(document.activeElement)))extRepaint()},60000);
/* parada externa no mapa: o painel ao lado lista as próximas saídas */
function extStopHTML(id,now){
  var S=EXTS[id];if(!S)return linesHTML();
  var ls=EXT.lines.filter(function(L){return L.st.some(function(s){return s[0]===id})});
  ls.sort(function(a,b){var x=extNext(a,id,now,1)[0],y=extNext(b,id,now,1)[0];return (x==null?1e9:x)-(y==null?1e9:y)});
  return '<p class="eyebrow">Ônibus da cidade</p><h2>'+esc(S.name)+'</h2>'+(S.alt&&S.alt.length?'<p class="muted small keep">Parada da UFRJ e ponto da prefeitura “'+esc(S.alt.join('”, “'))+'”.</p>':'')+liveStatusHTML()+'<p class="muted small keep">'+ls.length+' linha'+(ls.length>1?'s':'')+(ls.length>1?' saem':' sai')+' daqui. Horários programados pela prefeitura.</p>'+
    (function(){var row=function(L){return '<li><div class="xl-row">'+extBadge(L)+'<span class="grow"><b>'+esc(L.d)+'</b><small>'+extWhen(L,id,now)+'</small></span></div></li>'},on=ls.filter(extToday),off=ls.filter(function(L){return !extToday(L)});return '<ul class="xl-list">'+on.map(row).join('')+'</ul>'+(off.length?'<details class="xoff"><summary>'+off.length+' linha'+(off.length>1?'s':'')+' não circula'+(off.length>1?'m':'')+' hoje</summary><ul class="xl-list">'+off.map(row).join('')+'</ul></details>':'')})()+
    '<p class="muted small keep xsrc">Fonte: '+esc(EXT.fonte)+'.</p>';
}
function extDraw(){
  var old=$('#gExt');if(old)old.remove();
  var s='<g id="gExt"'+(state.layers.ext?'':' class="off"')+'>';
  Object.keys(EXTS).forEach(function(id){var S=EXTS[id];
    s+=mk('ext',id,S.p,'Ônibus da cidade: '+S.name,'<circle class="hit" cy="-20" r="20"/><path class="xpin" d="M0 0C-4 -7 -14 -12 -14 -23A14 14 0 1 1 14 -23C14 -12 4 -7 0 0Z"/><circle class="xin" cy="-23" r="10"/><g class="xbus" transform="translate(0 -23)"><rect x="-5.6" y="-6.4" width="11.2" height="10.6" rx="2.6"/><rect class="xw" x="-4.2" y="-4.6" width="8.4" height="4" rx="0.8"/><circle class="xw" cx="-2.9" cy="1.8" r="1"/><circle class="xw" cx="2.9" cy="1.8" r="1"/><rect x="-4.6" y="4" width="2.4" height="2.4" rx=".6"/><rect x="2.2" y="4" width="2.4" height="2.4" rx=".6"/><rect x="-6.8" y="-4.2" width="1" height="3" rx=".5"/><rect x="5.8" y="-4.2" width="1" height="3" rx=".5"/></g>')});
  s+='</g>';var lab=$('#gLab');if(lab)lab.insertAdjacentHTML('beforebegin',s);
}
aoFazer('mapa montado',extDraw);
extDraw();
aoFazer('mapa atualizado',function(){var g=$('#gExt');if(g)g.classList.toggle('off',!state.layers.ext)});
(function(){var w=$('#chSvc');if(!w)return;
  w.insertAdjacentHTML('afterend','<button class="chip" id="chExt" type="button" aria-pressed="'+!!state.layers.ext+'"><span class="sw sw-ext"></span><span>Cidade<span class="xl"> (ônibus)</span></span></button>');
  $('#chExt').addEventListener('click',function(){setLayer('ext',this)});
})();
updateMap();
/* ======================= v28: ônibus da cidade ao vivo (via Worker do Cloudflare) ======================= */
function liveWanted(){return !!LIVE.url&&!document.hidden&&(state.layers.ext||(state.sel&&state.sel.kind==='ext')||!!($('#fdExt')&&$('#fdExt').open))}
function liveFetch(){
  if(!liveWanted())return;
  /* v38: no máximo um pedido a cada 5 s, mesmo quando várias partes do app pedem ao mesmo tempo ao abrir */
  var agora=Date.now();if(LIVE.ult&&agora-LIVE.ult<5000)return;LIVE.ult=agora;
  fetch(LIVE.url,{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
    var novos=(d.onibus||[]).filter(function(o){return Date.now()-o.t<6*60e3});
    /* a prefeitura falhou e o Worker não tinha cópia: mantém os ônibus que já estavam no mapa (até 6 min) */
    if(d.falhou&&!novos.length)novos=LIVE.bus.filter(function(o){return Date.now()-o.t<6*60e3});
    LIVE.bus=novos;LIVE.t=Date.now();LIVE.err=!!d.falhou;LIVE.falhas=d.falhou?(LIVE.falhas||0)+1:0;liveDraw();liveRefreshText();
    if(d.falhou)setTimeout(liveFetch,5200);
  },function(){LIVE.err=true;LIVE.falhas=(LIVE.falhas||0)+1;liveRefreshText();setTimeout(liveFetch,5200)});
}
function liveLoop(){clearInterval(LIVE.timer);if(!LIVE.url)return;liveFetch();LIVE.timer=setInterval(function(){liveFetch()},10000)}
document.addEventListener('visibilitychange',function(){if(!document.hidden)liveFetch()});
function liveCount(n){return LIVE.bus.filter(function(o){return o.l===n}).length}
function liveColor(n){var L=EXT.lines.filter(function(x){return x.n===n})[0];return (L&&L.c)||'#5B6B7A'}
function liveNearStop(p){var best=null,bd=1e18;Object.keys(EXTS).forEach(function(k){var q=EXTS[k].p,d=(q[0]-p[0])*(q[0]-p[0])+(q[1]-p[1])*(q[1]-p[1]);if(d<bd){bd=d;best=k}});return best}
function liveDraw(){
  var antes={};Object.keys(LV2.st).forEach(function(v){antes[v]=LV2.st[v].obs});
  liveDrawCore();
  var mudou=false;
  LIVE.bus.forEach(function(o){var S=LV2.st[o.v];if(!S||!S.obs)return;var O=S.obs,P=antes[o.v];
    if(P&&P.t===O.t){O.signOk=P.signOk;O.ve=P.ve;return}
    O.signOk=o.vel>2||!!(P&&P.i===O.i&&Math.abs(O.s-P.s)/MPU>5)||!!(P&&P.signOk);
    if(P){lvmMede(o,P,O);mudou=true}
    O.ve=null;lvV(O);
  });
  if(mudou){lvmSalva();lvmEnvia(false)}
  if(LV2.raf)cancelAnimationFrame(LV2.raf);LV2.raf=0;lvFrame();
}
function liveAgo(){var s=Math.round((Date.now()-LIVE.t)/1000);return s<60?'há '+s+' s':'há '+Math.round(s/60)+' min'}
function liveStatusHTML(){
  if(!LIVE.url)return '';
  if(LIVE.err&&!LIVE.t)return '<p class="lv-st muted small keep">Ao vivo indisponível agora; mostrando os horários programados.</p>';
  if(!LIVE.t)return '<p class="lv-st muted small keep"><span class="lv-ping"></span> Buscando ônibus ao vivo…</p>';
  var extra='',d=liveDelay(),n=lvmTotal();
  if(LIVE.bus.length&&d!=null)extra=' · posições com ~'+d+' s de atraso, ajustadas pela velocidade'+(n>=20?' e por '+n.toLocaleString('pt-BR')+' trajetos já medidos':'');
  return '<p class="lv-st small keep"><span class="lv-ping on"></span> <b>Ao vivo:</b> '+LIVE.bus.length+' ônibus na região do Fundão · atualizado '+liveAgo()+(LIVE.err?' (última tentativa falhou)':'')+extra+'</p>';
}
function liveTag(n){var c=liveCount(n);return c?' <span class="lv-tag">'+c+' ao vivo</span>':''}
function liveRefreshText(){
  if(state.sel&&state.sel.kind==='ext'&&!(document.activeElement&&detail.contains(document.activeElement)))renderDetail();
  var b=$('#fdExt');if(b&&b.open&&!(document.activeElement&&b.contains(document.activeElement)))extRepaint();
}
aoFazer('mapa atualizado',function(){if(LIVE.url&&liveWanted()&&!LIVE.timer)liveLoop()});
aoFazer('mapa montado',liveDraw);
document.addEventListener('toggle',function(e){if(e.target&&e.target.id==='fdExt'&&e.target.open)setTimeout(liveFetch,0)},true);
if(LIVE.url)liveLoop();
/* ======================= v29: paradas da prefeitura alinhadas às da UFRJ, um botão "Ônibus" e ônibus ao vivo sobre as ruas ======================= */
var MPU=Math.hypot(GEO.a,GEO.b);/* unidades do mapa por metro */
/* 1) ponto da prefeitura a até 100 m de uma parada interna (ou 170 m com nome parecido) vira a mesma parada */
(function(){
  var tok=function(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').split(/[^a-z0-9]+/).filter(function(w){return w.length>=4&&['fundao','ufrj','predio','faculdade'].indexOf(w)<0})};
  var G={},map={};
  Object.keys(EXTS).forEach(function(k){
    var P=EXTS[k].p,ta=tok(EXTS[k].name),best=null,bd=1e9,bs=null,bsd=1e9;
    Object.keys(STOPS).forEach(function(s){var q=STOPS[s].p,d=Math.hypot(q[0]-P[0],q[1]-P[1])/MPU,tb=tok(STOPS[s].name),sim=ta.some(function(w){return tb.some(function(v){return v.indexOf(w)===0||w.indexOf(v)===0})});
      if(d<bd){bd=d;best=s}if(sim&&d<bsd){bsd=d;bs=s}});
    /* nome parecido até 250 m vence; senão, a parada mais perto até 100 m. O Terminal Fundão é o mesmo complexo da Estação BRT. */
    var alvo=(k==='terminal'&&STOPS.est&&Math.hypot(STOPS.est.p[0]-P[0],STOPS.est.p[1]-P[1])/MPU<300)?'est':(bs&&bsd<=250)?bs:(best&&bd<=100)?best:null;
    var gid=alvo?'a_'+alvo:k;best=alvo||best;
    map[k]=gid;
    if(!G[gid])G[gid]=gid.indexOf('a_')===0?{name:STOPS[best].name,p:STOPS[best].p.slice(),alt:[],stop:best}:{name:EXTS[k].name,p:EXTS[k].p,alt:[]};
    if(G[gid].stop)G[gid].alt.push(EXTS[k].name);
  });
  Object.keys(EXTS).forEach(function(k){delete EXTS[k]});Object.keys(G).forEach(function(g){EXTS[g]=G[g]});
  EXT.lines.forEach(function(L){var seen={},st=[];L.st.forEach(function(s){var g=map[s[0]];if(!(g in seen)){seen[g]=1;st.push([g,s[1]])}});L.st=st});
})();
extDraw();
/* na parada interna, também os ônibus da cidade que param ali */
aoFazer('detalhe montado',function(){
  var s=state.sel;if(s&&s.kind==='stop'&&EXTS['a_'+s.id]){
    var id='a_'+s.id,now=nowMin(),ls=EXT.lines.filter(function(L){return extToday(L)&&L.st.some(function(x){return x[0]===id})});
    ls.sort(function(a,b){var x=extNext(a,id,now,1)[0],y=extNext(b,id,now,1)[0];return (x==null?1e9:x)-(y==null?1e9:y)});
    if(ls.length)detail.insertAdjacentHTML('beforeend','<div class="xhere"><h3>Ônibus da cidade nesta parada</h3><ul class="xl-list">'+ls.slice(0,6).map(function(L){return '<li><div class="xl-row">'+extBadge(L)+'<span class="grow"><b>'+esc(L.d)+'</b><small>'+extWhen(L,id,now)+'</small></span></div></li>'}).join('')+'</ul>'+(ls.length>6?'<p class="small keep"><button type="button" class="linkbtn" data-kind="ext" data-id="'+id+'">Ver as '+ls.length+' linhas</button></p>':'')+'</div>');
  }
});/* 2) um botão "Ônibus" com duas opções, como o do Wi-Fi */
function busChip(){var c=$('#chBus');if(!c)return;c.setAttribute('aria-pressed',String(!!(state.layers.bus||state.layers.ext)));c.setAttribute('aria-expanded',String(!!$('#busMenu')&&!$('#busMenu').hidden))}
(function(){
  var old=$('#chExt');if(old)old.remove();
  var c=$('#chBus');if(!c)return;
  c.innerHTML='<span class="sw sw-bus"></span><span>Ônibus</span><svg class="chev2" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>';
  c.setAttribute('aria-haspopup','true');c.setAttribute('aria-controls','busMenu');
  document.body.insertAdjacentHTML('beforeend','<div class="wifimenu" id="busMenu" role="menu" aria-label="Ônibus no mapa" hidden></div>');
  var m=$('#busMenu');
  function paint(){
    m.innerHTML='<p class="wm-t">Ônibus no mapa</p>'+
      '<label class="wm-i" role="menuitemcheckbox" aria-checked="'+!!state.layers.bus+'"><span class="sw sw-bus" style="opacity:1"></span><span class="grow"><b>Linhas internas</b><small>Ônibus gratuitos da UFRJ, paradas e trajetos</small></span><input type="checkbox" id="bmInt"'+(state.layers.bus?' checked':'')+'></label>'+
      '<label class="wm-i" role="menuitemcheckbox" aria-checked="'+!!state.layers.ext+'"><span class="sw sw-ext" style="opacity:1"></span><span class="grow"><b>Ônibus da cidade</b><small>Linhas municipais e BRT'+(LIVE.url?', com posição ao vivo':'')+'</small></span><input type="checkbox" id="bmExt"'+(state.layers.ext?' checked':'')+'></label>';
  }
  function place(){var r=c.getBoundingClientRect(),w=Math.min(300,innerWidth-24),x=Math.max(12,Math.min(r.left,innerWidth-w-12));m.style.width=w+'px';m.style.left=x+'px';m.style.top=(r.bottom+8)+'px'}
  function open(o){if(o){paint();place();m.hidden=false;var f=m.querySelector('input');if(f)f.focus({preventScroll:true})}else m.hidden=true;busChip()}
  c.addEventListener('click',function(e){e.stopImmediatePropagation();e.preventDefault();open(m.hidden)},true);
  m.addEventListener('change',function(e){if(e.target.id==='bmInt')setLayer('bus',c);if(e.target.id==='bmExt')setLayer('ext',c);paint();busChip()});
  document.addEventListener('click',function(e){if(!m.hidden&&!m.contains(e.target)&&!c.contains(e.target))open(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!m.hidden){open(false);c.focus()}});
  window.addEventListener('resize',function(){if(!m.hidden)place()});
  window.addEventListener('scroll',function(){if(!m.hidden)place()},{passive:true});
  busChip();
})();
/* 3) ônibus ao vivo presos ao traçado da linha e deslizando pela rua entre as atualizações */
var SHP=(EXT.shp||[]).map(function(d){var a=-2280000,o=-4320000,P=[],cum=[0];for(var i=0;i<d.length;i+=2){a+=d[i];o+=d[i+1];var p=ll2map(a/1e5,o/1e5);if(P.length){var q=P[P.length-1];cum.push(cum[cum.length-1]+Math.hypot(p[0]-q[0],p[1]-q[1]))}P.push(p)}return {P:P,c:cum}});
function snapBus(n,p){
  var best=null;
  /* dentro do campus: as ruas desenhadas no mapa vencem, se estiverem a até 45 m */
  SHP_INT.forEach(function(i){var r=projOn(i,p);if(r&&(!best||r.d<best.d))best=r});
  if(best&&best.d<=45*MPU)return best;
  var b2=null;((EXT.sh||{})[n]||[]).forEach(function(i){var r=SHP_EXT[i]!=null?projOn(SHP_EXT[i],p):null;if(r&&(!b2||r.d<b2.d))b2=r});
  if(b2&&b2.d<=120*MPU)return b2;
  return best&&best.d<=80*MPU?best:null;
}
function shpAt(i,s){var S=SHP[i],c=S.c,P=S.P;s=Math.max(0,Math.min(c[c.length-1],s));var j=1;while(j<c.length-1&&c[j]<s)j++;var a=P[j-1],b=P[j],L=(c[j]-c[j-1])||1e-9,t=(s-c[j-1])/L;return {x:a[0]+t*(b[0]-a[0]),y:a[1]+t*(b[1]-a[1]),ang:Math.atan2(b[0]-a[0],-(b[1]-a[1]))*180/Math.PI}}
function setMkPos(el,x,y){el.dataset.x=x.toFixed(1);el.dataset.y=y.toFixed(1);el.setAttribute('transform','translate('+el.dataset.x+','+el.dataset.y+')'+(ROT?' rotate('+(-ROT)+')':'')+' scale('+(+MS||1).toFixed(3)+')')}
/* atualização mais rápida: a cada 20 s (a prefeitura recebe uma posição a cada ~25 s) */
if(LIVE.url)liveLoop();
