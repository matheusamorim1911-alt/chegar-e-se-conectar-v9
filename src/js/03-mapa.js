/* ---------- estado ---------- */
var SORTED=Object.keys(STOPS).sort(function(a,b){if(a==='est')return -1;if(b==='est')return 1;return STOPS[a].name.localeCompare(STOPS[b].name,'pt')});
var state={layers:{bus:true,wifi:(function(){try{return localStorage.getItem('cse-lay-wifi')==='1'}catch(e){return false}})()},sel:null,
  from:STOPS[prefs.from]?prefs.from:'est',to:STOPS[prefs.to]?prefs.to:'ctl',manual:false,clk:''};
if(state.from===state.to)state.to=state.from==='ctl'?'est':'ctl';
function realNow(){var d=new Date();return d.getHours()*60+d.getMinutes()}
function nowMin(){return (state.manual&&state.clk)?toMin(state.clk):realNow()}
/* ---------- mapa ---------- */
/* rosa dos ventos: neste mapa o norte fica ~50° à esquerda do "para cima" (HU → Reitoria aponta para sudeste) */
var NORTH=-56.4;
function rose(cx,cy,r,deg){
  var s='<g class="rose" aria-hidden="true" transform="translate('+cx+','+cy+')"><circle class="rose-disc" r="'+(r+14)+'"/><circle class="rose-ring" r="'+(r-14)+'"/>';
  s+='<g transform="rotate('+deg+')">';
  [45,135,225,315].forEach(function(a){s+='<path class="rose-q" transform="rotate('+a+')" d="M0,'+(-r*0.62)+' L7,0 L0,7 L-7,0Z"/>'});
  [90,180,270].forEach(function(a){s+='<path class="rose-p" transform="rotate('+a+')" d="M0,'+(-r)+' L10,0 L0,10 L-10,0Z"/>'});
  s+='<path class="rose-n" d="M0,'+(-r)+' L10,0 L0,10 L-10,0Z"/><circle r="3.5" class="rose-n"/></g>';
  [['N',0],['L',90],['S',180],['O',270]].forEach(function(c){
    var a=(c[1]+deg)*Math.PI/180,d=r+30;
    s+='<text class="rose-lb'+(c[0]==='N'?'':' dim')+'" x="'+(Math.sin(a)*d).toFixed(1)+'" y="'+(-Math.cos(a)*d).toFixed(1)+'">'+c[0]+'</text>';
  });
  return s+'</g>';
}
/* ---------- mapa vetorial (traçado a partir do mapa da Prefeitura Universitária) ---------- */
/* tema claro usa as versões claras do mapa; decide já na carga, para não baixar as duas */
var MAPSUF=(function(){try{var t=CFG.tema||'escuro';if(t==='claro')return '-claro';if(t==='escuro'||t==='horario')return '';return window.matchMedia('(prefers-color-scheme: light)').matches?'-claro':''}catch(e){return ''}})();
var MAPIMG='img/mapa-bordas'+MAPSUF+'.jpg';
/* mapa base: planta cadastral da Cidade Universitária (ETU/UFRJ), vetorizada; JPG para a visão geral, SVG nítido no zoom */
var MAPHD=window.MAPHD_URL='img/mapa-campus'+MAPSUF+'.jpg',MAPVEC='img/mapa-campus'+MAPSUF+'.svg',MAPMINI='img/mapa-mini'+MAPSUF+'.jpg',MAPBLUR='img/mapa-blur'+MAPSUF+'.jpg',MAPVEC0='img/mapa-campus.svg';
/* nomes recriados como texto: [texto, x, y, classe, nível de zoom, rotação] */
/* guaritas (posições do mapa da Prefeitura; o nº 33 da legenda é "Guaritas / DISEG") */
var GUARDS={
  g1:{name:'Guarita 1',short:'G1',where:'Acesso pela Linha Vermelha, sentido Ilha do Governador e Baixada.',p:[256.4,378.8]},
  g2:{name:'Guarita 2',short:'G2',where:'Acesso pela Av. Brasil.',p:[391.1,444.5]},
  g3:{name:'Guarita 3',short:'G3',where:'Acesso pela Linha Amarela e pela Linha Vermelha, sentido Centro.',p:[816.9,564.2]}
};
var svg=$('#map'),gLines,gStops,gWifi,gGuard,gLab;
/* rotação desativada (o mapa base tem nomes na horizontal); ROT fica 0 */
var ROT=0;
function U(p){return ROT?[-p[1],p[0]]:p}
function bounds(){return ROT?{x:-(BASE.y+BASE.h),y:BASE.x,w:BASE.h,h:BASE.w}:BASE}
function wantRot(){return 0}
function orient(){
  var r=wantRot();if(r===ROT)return false;
  ROT=r;var w=$('#world');if(w)w.setAttribute('transform','rotate('+ROT+')');var w0=$('#world0');if(w0)w0.setAttribute('transform','rotate('+ROT+')');
  var rb=$('#rosebox');if(rb)rb.innerHTML='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,NORTH+ROT)+'</svg>';
  return true;
}
var BASE={x:109,y:-45,w:1233,h:701},view={x:109,y:-45,w:1233,h:701},fitW=1233,REF=0.83,MS=1,suppressClick=false;
function mbars(n){var s='',hs=[6,10,14,18];for(var i=0;i<4;i++)s+='<rect class="wb'+(i<n?'':' off')+'" x="'+(-11.5+i*6.2)+'" y="'+(9-hs[i])+'" width="4.4" height="'+hs[i]+'" rx="1.2"/>';return s}
function f1(p){return (+p[0].toFixed(1))+','+(+p[1].toFixed(1))}
/* polilinha com cantos arredondados (curvas suaves nas esquinas e rotatórias) */
function roundPath(pts,r){
  var q=[];pts.forEach(function(p){var l=q[q.length-1];if(!l||Math.abs(l[0]-p[0])>0.01||Math.abs(l[1]-p[1])>0.01)q.push(p)});
  if(q.length<2)return '';
  var d='M'+f1(q[0]);
  for(var i=1;i<q.length-1;i++){
    var a=q[i-1],b=q[i],c=q[i+1],l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]),rr=Math.min(r,l1/2,l2/2);
    var p1=[b[0]-(b[0]-a[0])/l1*rr,b[1]-(b[1]-a[1])/l1*rr],p2=[b[0]+(c[0]-b[0])/l2*rr,b[1]+(c[1]-b[1])/l2*rr];
    d+=' L'+f1(p1)+' Q'+f1(b)+' '+f1(p2);
  }
  return d+' L'+f1(q[q.length-1]);
}
function mk(kind,id,p,label,inner){
  return '<g class="mk '+kind+'" data-kind="'+kind+'" data-id="'+id+'" data-x="'+p[0]+'" data-y="'+p[1]+'" tabindex="0" role="button" aria-label="'+label+'" transform="translate('+p[0]+','+p[1]+')">'+inner+'</g>';
}
function buildMap(){
  etapas('mapa vai montar');
  $('#mapbase').innerHTML='<g id="world0" transform="rotate('+ROT+')"><g id="baseimg"'+(window.__opac?' style="opacity:'+window.__opac+'"':'')+'><image href="'+MAPIMG+'" x="-270" y="-340" width="2034" height="1300" preserveAspectRatio="none" decoding="async"/><image id="imgHD" href="'+MAPHD+'" x="109" y="-45" width="1233" height="701" preserveAspectRatio="none" decoding="async"/><image id="imgVec"'+(vecOn?' href="'+MAPVEC+'"':'')+' x="109" y="-45" width="1233" height="701" preserveAspectRatio="none"/></g></g>';
  var s='<rect class="v-hit" x="-3000" y="-3000" width="8000" height="8000"/>';
  s+='<g id="world" transform="rotate('+ROT+')">';
  s+='<g id="gLines">';
  Object.keys(LINES).forEach(function(id){
    LINES[id].trips.forEach(function(tr){
      s+='<path class="ln'+(LINES[id].susp?' susp':'')+'" data-line="'+id+'" style="stroke:var(--m'+id+')" d="'+roundPath(tr.pts,0)+'"/>';
    });
  });
  /* onda que corre no sentido do ônibus: cauda na cor da linha, cabeça clara (os trechos seguem a ordem das paradas) */
  s+='</g><g id="gFlow" aria-hidden="true">';var kf='';
  Object.keys(LINES).forEach(function(id){
    /* ida e volta encadeadas (a volta sai de onde a ida termina) viram um circuito só, como nas outras linhas;
       trechos soltos são animados um de cada vez, nunca duas pontas ao mesmo tempo */
    if(LINES[id].susp||!LINES[id].trips.length)return;
    var c='var(--m'+id+')',tps=LINES[id].trips.map(function(tr){return tr.pts});
    var chain=tps.every(function(q,n){if(!n)return true;var e=tps[n-1][tps[n-1].length-1];return e[0]===q[0][0]&&e[1]===q[0][1]});
    if(chain&&tps.length>1){var all=[];tps.forEach(function(q){q.forEach(function(pt,k){if(k||!all.length)all.push(pt)})});tps=[all]}
    var parts=tps.map(function(pts){var L=0;
      for(var k=1;k<pts.length;k++)L+=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]);
      return {d:roundPath(pts,0),du:Math.max(2.4,Math.min(5,L/320))}});
    var T=parts.reduce(function(a,q){return a+q.du},0),t0=0,inner='';
    parts.forEach(function(q,n){
      var cls=parts.length>1?' t'+n:'';
      if(parts.length>1){var a=t0/T*100,w=q.du/T*100,f=function(x){return Math.max(0,Math.min(100,x)).toFixed(3)+'%'},nm='rd'+id.replace(/\W/g,'_')+'_'+n;
        kf+='@keyframes '+nm+'{0%{stroke-dashoffset:1}'+f(a)+'{stroke-dashoffset:1}'+f(a+w*.48)+'{stroke-dashoffset:0}'+f(a+w*.58)+'{stroke-dashoffset:0}'+f(a+w)+'{stroke-dashoffset:-1}100%{stroke-dashoffset:-1}}'+
          '#gFlow:not(.off) .fl.on[data-line="'+id+'"] .fw.t'+n+'{animation-name:'+nm+'}';}
      inner+='<path class="fw gl'+cls+'" pathLength="1" d="'+q.d+'" style="stroke:'+c+'"/><path class="fw dr'+cls+'" pathLength="1" d="'+q.d+'" style="stroke:'+c+'"/>';
      t0+=q.du;
    });
    var du=T.toFixed(2);
    s+='<g class="fl" data-line="'+id+'" data-dur="'+du+'" style="--dur:'+du+'s">'+inner+'</g>';
  });
  var kfEl=document.getElementById('flowKF');if(!kfEl){kfEl=document.createElement('style');kfEl.id='flowKF';document.head.appendChild(kfEl)}kfEl.textContent=kf;
  s+='</g><g id="gStops">';
  Object.keys(STOPS).forEach(function(id){
    var st=STOPS[id],ls=linesAt(id),hub=ls.length>2,r=id==='est'?15:(hub?12:9);
    s+=mk('stop'+(hub?' hub':'')+(st.off?' stoff':''),id,st.p,'Parada '+st.name+(st.off?' (desativada)':'')+', linhas '+ls.join(', '),'<circle class="hit" r="'+(r+10)+'"/><circle class="dot" r="'+r+'"/>').replace(/data-kind="stop[^"]*"/,'data-kind="stop"');
  });
  s+='</g><g id="gGuard">';
  Object.keys(GUARDS).forEach(function(id){
    var g=GUARDS[id];
    s+=mk('guard',id,g.p,g.name+', segurança','<circle class="hit" r="22"/><rect x="-11" y="-11" width="22" height="22" rx="4" transform="rotate(45)"/><text y="0.5">'+g.short+'</text>');
  });
  s+='</g><g id="gSvc" class="off">'+SVC.map(svcMarker).join('')+'</g><g id="gWifi">';
  Object.keys(WIFI).forEach(function(id){
    s+=mk('wifi',id,WIFI[id].p,'Wi-Fi aberto: '+WIFI[id].name,'<circle class="hit" r="26"/><rect class="wbox" x="-17" y="-17" width="34" height="34" rx="8"/><g class="wbars">'+mbars(info(avgOf(id)).bars)+'</g>');
  });
  s+='</g><g id="gRep"></g><g id="gLab" pointer-events="none"></g></g>';
  svg.innerHTML=s;
  gLines=$('#gLines');gStops=$('#gStops');gWifi=$('#gWifi');gGuard=$('#gGuard');gLab=$('#gLab');gSvc=$('#gSvc');gRep=$('#gRep');
  etapas('mapa montado');
}
/* ---------- zoom e arrasto ---------- */
function box(){var r=svg.getBoundingClientRect();return {l:r.left,t:r.top,w:Math.max(1,r.width),h:Math.max(1,r.height)}}
function clampView(){
  var b=box(),minW=b.w/7;
  view.w=Math.max(minW,Math.min(fitW,view.w));view.h=view.w*b.h/b.w;
  var cx=view.x+view.w/2,cy=view.y+view.h/2;
  var B=bounds();cx=Math.max(B.x,Math.min(B.x+B.w,cx));cy=Math.max(B.y,Math.min(B.y+B.h,cy));
  view.x=cx-view.w/2;view.y=cy-view.h/2;
}
var raf=0;
var lastMS=-1,lastMk=-1,lblT=0,lastGesture=0,mapBase=null;
var vecOn=false,vecLoading=false;
function loadVec(){
  if(vecOn||vecLoading||perfEff()==='leve')return;vecLoading=true;
  var im=new Image();im.onload=function(){vecOn=true;var e=$('#imgVec');if(e)e.setAttribute('href',MAPVEC)};im.onerror=function(){vecLoading=false};im.src=MAPVEC;
}
function applyView(force){
  clampView();
  var vb=view.x.toFixed(2)+' '+view.y.toFixed(2)+' '+view.w.toFixed(2)+' '+view.h.toFixed(2);
  svg.setAttribute('viewBox',vb);if(!mapBase)mapBase=$('#mapbase');if(mapBase)mapBase.setAttribute('viewBox',vb);
  var bw=box().w,ppu=bw/view.w;MS=REF/ppu*(bw<680?0.8:1);
  if(!vecOn&&ppu*(window.devicePixelRatio||1)>1.7)loadVec();
  svg.classList.toggle('z2',ppu>1.25);svg.classList.toggle('z3',ppu>2.1);
  var mks=svg.querySelectorAll('.mk');
  if(force===true||MS!==lastMS||mks.length!==lastMk){
    svg.style.setProperty('--fw',(5/ppu).toFixed(2));
    var sc=' scale('+MS.toFixed(3)+')',rr=ROT?' rotate('+(-ROT)+')':'';
    for(var i=0;i<mks.length;i++){var el=mks[i];el.setAttribute('transform','translate('+el.dataset.x+','+el.dataset.y+')'+rr+sc)}
    lastMS=MS;lastMk=mks.length;
  }
  var z=$('#zoomlvl');if(z)z.textContent=Math.round(fitW/view.w*100)+'%';
  if(gLab){clearTimeout(lblT);if(Date.now()-lastGesture<160)lblT=setTimeout(drawLabels,170);else drawLabels()};etapas('vista aplicada',force);}
function schedule(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;applyView()})}
function fitView(){
  var b=box(),ar=b.h/b.w,B=bounds();
  if(ar>=B.h/B.w){view.w=B.w;view.h=view.w*ar}else{view.h=B.h;view.w=view.h/ar}
  fitW=view.w;view.x=B.x+B.w/2-view.w/2;view.y=B.y+B.h/2-view.h/2;
}
function toMap(cx,cy){var b=box();return [view.x+(cx-b.l)/b.w*view.w,view.y+(cy-b.t)/b.h*view.h]}
function zoomAt(m,f){var nw=Math.max(box().w/7,Math.min(fitW,view.w/f)),k=nw/view.w;view.x=m[0]-(m[0]-view.x)*k;view.y=m[1]-(m[1]-view.y)*k;view.w=nw;view.h=nw*box().h/box().w;schedule()}
function centerMap(){return [view.x+view.w/2,view.y+view.h/2]}
/* zoom pelos botões: aproxima do item escolhido; sem escolha, do eixo central do campus (o centro da tela inteira cai na baía) */
function focusPoint(){
  var s=state.sel,o=null;
  if(s&&s.kind==='stop')o=STOPS[s.id];else if(s&&s.kind==='wifi')o=WIFI[s.id];else if(s&&s.kind==='guard')o=GUARDS[s.id];
  else if(s&&s.kind==='night')o=STOPS[state.nightFrom];else if(s&&s.kind==='place')o=PL[s.id];else if(s&&s.kind==='svc')o=SVCMAP[s.id];else if(!s)o=STOPS[state.to];
  var c=centerMap();
  if(o){var q=U(o.p);if(q[0]>view.x&&q[0]<view.x+view.w&&q[1]>view.y&&q[1]<view.y+view.h)return q}
  return Math.abs(view.w-fitW)<1?U([724,405]):c;
}
function ensureVisible(p){
  p=U(p);var mx=view.w*0.12,my=view.h*0.12;
  if(p[0]<view.x+mx||p[0]>view.x+view.w-mx||p[1]<view.y+my||p[1]>view.y+view.h-my){view.x=p[0]-view.w/2;view.y=p[1]-view.h/2;schedule()}
}
function initZoom(){
  orient();fitView();
  if(!ROT&&box().w<680){var c=[665,382];view.w=Math.min(fitW,700,860*box().w/box().h);view.h=view.w*box().h/box().w;view.x=c[0]-view.w/2;view.y=Math.max(BASE.y-60,Math.min(c[1]-view.h/2,BASE.y+BASE.h+40-view.h))}
  applyView();
  var pts={},start=null,moved=0;
  svg.addEventListener('wheel',function(e){e.preventDefault();lastGesture=Date.now();zoomAt(toMap(e.clientX,e.clientY),Math.exp(-e.deltaY*(e.deltaMode===1?0.05:0.0016)))},{passive:false});
  svg.addEventListener('pointerdown',function(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    pts[e.pointerId]={x:e.clientX,y:e.clientY};moved=0;
    if(Object.keys(pts).length===1)start={x:e.clientX,y:e.clientY};
  });
  svg.addEventListener('pointermove',function(e){
    var p=pts[e.pointerId];if(!p)return;
    var ids=Object.keys(pts),b=box();lastGesture=Date.now();
    if(ids.length===1){
      var dx=e.clientX-p.x,dy=e.clientY-p.y;
      moved+=Math.abs(dx)+Math.abs(dy);
      if(moved>6){
        if(!svg.classList.contains('dragging')){svg.classList.add('dragging');try{svg.setPointerCapture(e.pointerId)}catch(err){}}
        view.x-=dx*view.w/b.w;view.y-=dy*view.h/b.h;schedule();
      }
      p.x=e.clientX;p.y=e.clientY;
    }else if(ids.length===2){
      var o=pts[ids[0]===String(e.pointerId)?ids[1]:ids[0]];
      var d0=Math.hypot(p.x-o.x,p.y-o.y),d1=Math.hypot(e.clientX-o.x,e.clientY-o.y);
      var m0=[(p.x+o.x)/2,(p.y+o.y)/2],m1=[(e.clientX+o.x)/2,(e.clientY+o.y)/2];
      if(d0>0){zoomAt(toMap(m1[0],m1[1]),d1/d0)}
      view.x-=(m1[0]-m0[0])*view.w/b.w;view.y-=(m1[1]-m0[1])*view.h/b.h;
      moved+=99;p.x=e.clientX;p.y=e.clientY;schedule();
    }
  });
  function up(e){
    if(!pts[e.pointerId])return;
    delete pts[e.pointerId];
    if(moved>6)suppressClick=true;
    if(!Object.keys(pts).length){svg.classList.remove('dragging');lastGesture=0;clearTimeout(lblT);if(gLab)drawLabels();setTimeout(function(){suppressClick=false},0)}
  }
  svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);svg.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')up(e)});
  svg.addEventListener('dblclick',function(e){e.preventDefault();zoomAt(toMap(e.clientX,e.clientY),1.8)});
  $('#zin').addEventListener('click',function(){var f=focusPoint();zoomAt(f,1.6);view.x+=(f[0]-(view.x+view.w/2))*0.5;view.y+=(f[1]-(view.y+view.h/2))*0.5;schedule()});
  $('#zout').addEventListener('click',function(){zoomAt(centerMap(),1/1.6)});
  $('#zfit').addEventListener('click',function(){fitView();applyView()});
  svg.addEventListener('keydown',function(e){
    if(e.target!==svg)return;
    if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(centerMap(),1.4)}
    else if(e.key==='-'){e.preventDefault();zoomAt(centerMap(),1/1.4)}
  });
  var lastW=box().w;
  if(window.ResizeObserver)new ResizeObserver(function(){if(orient()){lastW=box().w;fitView();applyView();return}var w=box().w;if(Math.abs(w-lastW)<1&&Math.abs(view.h-view.w*box().h/w)<0.5)return;var keep=fitW/view.w,c=centerMap();lastW=w;fitView();view.w=fitW/keep;view.h=view.w*box().h/box().w;view.x=c[0]-view.w/2;view.y=c[1]-view.h/2;applyView()}).observe(svg);
}
var planBest=null;
function activeLines(){
  if(!state.sel)return planBest?[planBest.lid]:null;
  if(state.sel.kind==='line')return [state.sel.id];
  if(state.sel.kind==='stop')return linesAt(state.sel.id);
  if(state.sel.kind==='night')return linesAt(state.nightFrom);
  return null;
}
/* rótulo sempre de pé, acima do ponto na tela, sem sair pelas bordas */
function label(p,txt,off){
  var half=(txt.length*6.5+8)*MS,u=U(p);if(u[0]<view.x||u[0]>view.x+view.w||u[1]<view.y||u[1]>view.y+view.h)return '';
  var dx=Math.min(view.x+view.w-half,Math.max(view.x+half,u[0]))-u[0];
  return '<g transform="translate('+p[0]+','+p[1]+')'+(ROT?' rotate('+(-ROT)+')':'')+'"><text class="sl halo" x="'+dx.toFixed(1)+'" y="'+(-off*MS).toFixed(1)+'" text-anchor="middle" style="font-size:'+(21*MS).toFixed(2)+'px;stroke-width:'+(6*MS).toFixed(2)+'px">'+txt+'</text></g>';
}
/* nomes dos pontos ao dar zoom (a partir de ~150% no computador); evita sobreposição */
function lblBox(p,txt,off,fs){var u=U(p),w=txt.length*fs*0.56*MS,hh=fs*1.2*MS;return {x:u[0]-w/2,y:u[1]-off*MS-hh*0.8,w:w,h:hh}}
function hits(a,b){return a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h}
function pointLabels(skip,taken){
  var ppu=box().w/view.w;if(ppu<(box().w<680?0.8:1.2))return '';
  var fs=14,list=[];
  if(state.layers.bus)Object.keys(STOPS).forEach(function(id){var st=STOPS[id],hub=linesAt(id).length>2;list.push({p:st.p,t:st.short||st.name,full:st.name,r:id==='est'?15:(hub?12:9),pr:hub?1:2})});
  Object.keys(GUARDS).forEach(function(id){var g=GUARDS[id];list.push({p:g.p,t:g.name,full:g.name,r:15,pr:3})});
  if(state.layers.wifi)Object.keys(WIFI).forEach(function(id){var w=WIFI[id];list.push({p:w.p,t:w.name,full:w.name,r:17,pr:4})});
  SVC.forEach(function(sv){if(svcVisible(sv))list.push({p:sv.p,t:sv.name,full:sv.full,r:12,pr:5})});
  list.sort(function(a,b){return a.pr-b.pr});
  var s='',marks=list.map(function(it){var u=U(it.p),r=it.r*MS;return {x:u[0]-r,y:u[1]-r,w:2*r,h:2*r}});
  list.forEach(function(it){
    if(skip[it.full])return;
    var u=U(it.p);
    if(u[0]<view.x||u[0]>view.x+view.w||u[1]<view.y||u[1]>view.y+view.h)return;
    var w=it.t.length*fs*0.56*MS,hh=fs*1.15*MS,gap=(it.r+5)*MS;
    var cands=[{dx:0,dy:gap+hh*0.85,a:'middle',bx:u[0]-w/2,by:u[1]+gap},{dx:0,dy:-gap-hh*0.2,a:'middle',bx:u[0]-w/2,by:u[1]-gap-hh},{dx:gap,dy:hh*0.35,a:'start',bx:u[0]+gap,by:u[1]-hh/2},{dx:-gap,dy:hh*0.35,a:'end',bx:u[0]-gap-w,by:u[1]-hh/2}];
    for(var i=0;i<cands.length;i++){
      var c=cands[i],bb={x:c.bx,y:c.by,w:w,h:hh};
      if(bb.x<view.x||bb.x+bb.w>view.x+view.w)continue;
      if(taken.some(function(t){return hits(t,bb)})||marks.some(function(m){return hits(m,bb)}))continue;
      taken.push(bb);
      s+='<g transform="translate('+it.p[0]+','+it.p[1]+')'+(ROT?' rotate('+(-ROT)+')':'')+'"><text class="pt-lbl halo" x="'+c.dx.toFixed(1)+'" y="'+c.dy.toFixed(1)+'" text-anchor="'+c.a+'" style="font-size:'+(fs*MS).toFixed(2)+'px;stroke-width:'+(4.5*MS).toFixed(2)+'px">'+it.t+'</text></g>';
      break;
    }
  });
  return s;
}
function drawLabels(){
  var s='',sel=state.sel,o=null;
  if(sel&&sel.kind==='stop')o=STOPS[sel.id];
  else if(sel&&sel.kind==='wifi')o=WIFI[sel.id];
  else if(sel&&sel.kind==='guard')o=GUARDS[sel.id];
  else if(sel&&sel.kind==='night')o=STOPS[state.nightFrom];
  else if(sel&&sel.kind==='place')o=PL[sel.id];
  else if(sel&&sel.kind==='svc')o={p:SVCMAP[sel.id].p,name:SVCMAP[sel.id].name};
  var skip={},taken=[];
  if(o){s+=label(o.p,o.name,34);skip[o.name]=1;taken.push(lblBox(o.p,o.name,34,21))}
  else if(!sel&&state.layers.bus)[state.from,state.to].forEach(function(id){var st=STOPS[id],n=st.short||st.name;s+=label(st.p,n,30);skip[st.name]=1;taken.push(lblBox(st.p,n,30,21))});
  s+=pointLabels(skip,taken);
  if(CFG.bldn!==false)s=bldLabels(taken)+s;
  gLab.innerHTML=s;
}
/* ======================= nomes dos prédios no zoom (da planta da ETU/UFRJ) ======================= */
var BLDN=[["Hospital Universitário",325.7,364,1],["IPPMG (Pediatria)",279.9,370,2],["CCS",352.6,290.8,1],["Instituto de Microbiologia",324.9,274,3],["Escola de Educação Infantil",272.9,345.2,3],["Usina Verde",362.3,235.3,3],["Polo Bio-Rio",377.5,192.6,2],["RU Central",424.4,330.8,1],["EEFD",428.2,302.6,1],["Ginásio",450.8,293.6,3],["Gastronomia",459.3,327.3,3],["Prefeitura · DISEG",417.4,449.2,1],["Horto Universitário",435,461.4,3],["CENPES (Petrobras)",606.9,480.1,2],["Instituto de Física",750.6,447,2],["Instituto de Química",749.5,396,2],["Instituto de Matemática",753.5,467.9,2],["CCMN",765,501.4,1],["CT 2",936.5,558.2,2],["Macromoléculas",938.2,457,3],["LNDC",961.4,460,3],["Polo de Xistoquímica",1000.4,553.4,2],["Faculdade de Letras",940,379.9,1],["CCJE",908.2,386.2,2],["Reitoria (CLA)",1013.5,367.7,1],["COPPEAD",1027.5,226,1],["Incubadora",1119.3,336.2,2],["Gráfica",1142.3,337.2,3],["Almoxarifado",1172.3,335.9,3],["Frota Oficial",1168.1,355.1,3],["CPST · EBA",1148.4,362,3],["DIPRO",423.9,83.6,2],["UFRJ-Mar",469.3,45.6,3],["Escola Tenente Antônio João",1020.9,213.3,3]];
function bldLabels(taken){
  var ppu=box().w/view.w,mob=box().w<680;
  if(ppu<(mob?1.5:2.2))return '';
  var lvl=ppu>=(mob?3:4)?3:ppu>=(mob?2:2.6)?2:1,fs=15,s='';
  var dup={};if(state.layers.wifi)Object.keys(WIFI).forEach(function(k){dup[WIFI[k].name]=1});Object.keys(STOPS).forEach(function(k){dup[STOPS[k].short||STOPS[k].name]=1});
  BLDN.forEach(function(b){
    if(b[3]>lvl||dup[b[0]])return;var p=[b[1],b[2]],u=U(p);
    if(u[0]<view.x||u[0]>view.x+view.w||u[1]<view.y||u[1]>view.y+view.h)return;
    var w=b[0].length*fs*0.55*MS,hh=fs*1.2*MS,bb={x:u[0]-w/2,y:u[1]-hh/2,w:w,h:hh};
    if(taken.some(function(t){return hits(t,bb)}))return;taken.push(bb);
    s+='<g transform="translate('+p[0]+','+p[1]+')'+(ROT?' rotate('+(-ROT)+')':'')+'"><text class="bld-lbl halo" y="'+(hh*0.33).toFixed(1)+'" text-anchor="middle" style="font-size:'+(fs*MS).toFixed(2)+'px;stroke-width:'+(4*MS).toFixed(2)+'px">'+esc(b[0])+'</text></g>';
  });
  return s;
}
/* ---------- várias linhas no ponto: uma de cada vez ---------- */
var seq={key:'',lines:null,i:0,cur:null,t:0};
function flowSeq(lines){
  var gF=$('#gFlow');if(!gF)return;
  var key=lines?lines.join(','):'';
  if(key===seq.key)return;
  seq.key=key;seq.lines=lines;seq.i=0;seq.cur=null;
  gF.classList.toggle('seq',!!lines);svg.classList.toggle('seqing',!!lines);
  gF.querySelectorAll('.fl').forEach(function(el){el.style.setProperty('--dur',el.dataset.dur+'s')});
  if(lines)seqShow();
}
function seqShow(){
  var gF=$('#gFlow');if(!gF||!seq.lines)return;
  var id=seq.lines[seq.i%seq.lines.length],mx=0;seq.cur=id;seq.t=Date.now();
  var gs=gF.querySelectorAll('.fl');
  gs.forEach(function(el){if(el.dataset.line===id)mx=Math.max(mx,+el.dataset.dur)});
  gs.forEach(function(el){var on=el.dataset.line===id;if(on)el.style.setProperty('--dur',mx+'s');el.classList.toggle('on',on)});
  svg.dataset.seqline=id;
}
document.addEventListener('animationiteration',function(e){
  if(!seq.lines||!e.target.classList||!e.target.classList.contains('dr'))return;
  var fl=e.target.closest&&e.target.closest('#gFlow .fl');if(!fl||fl.dataset.line!==seq.cur)return;
  if(Date.now()-seq.t<400)return;
  seq.i++;seqShow();
},true);
function updateMap(){
  gLines.classList.toggle('off',!state.layers.bus);
  gStops.classList.toggle('off',!state.layers.bus);
  gWifi.classList.toggle('off',!state.layers.wifi);
  if(gSvc){gSvc.classList.toggle('off',!state.layers.svc);gSvc.querySelectorAll('.mk').forEach(function(el){el.classList.toggle('off',!svcVisible(SVCMAP[el.dataset.id]))})}
  svg.classList.toggle('night-on',!!state.sel&&(state.sel.kind==='night'||state.sel.kind==='guard'));
  var act=activeLines();
  Array.prototype.slice.call(svg.querySelectorAll('.ln')).forEach(function(el){
    var on=!act||act.indexOf(el.dataset.line)>=0;
    el.classList.toggle('dim',!on);
    if(on&&act)gLines.appendChild(el);
  });
  var gF=$('#gFlow');
  svg.classList.toggle('flowing',!!(state.layers.bus&&CFG.flow&&perfEff()!=='leve'&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches));
  if(gF){gF.classList.toggle('off',!state.layers.bus||!CFG.flow||perfEff()==='leve');gF.classList.toggle('all',!act);
    /* várias linhas (parada, ou nenhuma linha específica: serviço, Wi-Fi, guarita): uma de cada vez */
    var seqL=act&&act.length>1?act:(!act?Object.keys(LINES).filter(function(l){return !LINES[l].susp}):null);
    svg.classList.toggle('seqall',!act);
    if(seqL&&seqL.length>1)flowSeq(seqL);
    else{flowSeq(null);gF.querySelectorAll('.fl').forEach(function(el){el.classList.toggle('on',!act||act.indexOf(el.dataset.line)>=0)})}}
  var sel=state.sel;
  svg.querySelectorAll('.mk').forEach(function(el){
    var k=el.dataset.kind,id=el.dataset.id;
    el.classList.toggle('sel',!!sel&&((k===sel.kind&&id===sel.id)||(sel.kind==='night'&&k==='stop'&&id===state.nightFrom)));
    el.classList.toggle('end',!sel&&k==='stop'&&(id===state.from||id===state.to));
  });
  svg.querySelectorAll('.mk.wifi').forEach(function(el){var b=$('.wbars',el);if(!b||!WIFI[el.dataset.id])return;b.innerHTML=mbars(info(avgOf(el.dataset.id)).bars)});
  drawLabels();etapas('mapa atualizado');}
