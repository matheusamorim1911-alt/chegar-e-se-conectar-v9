/* ======================= rosa dos ventos: bússola que aponta para o destino ======================= */
var CMP={on:false,h:null,hRaw:null,lastTxt:'',got:false,raf:0,timer:0};
function angN(){return Math.atan2(-GEO.b,GEO.a)*180/Math.PI}/* norte real no mapa, em graus a partir do topo */
function norm180(a){a=((a+180)%360+360)%360-180;return a}
function cardinal(b){var n=['norte','nordeste','leste','sudeste','sul','sudoeste','oeste','noroeste'];return n[Math.round(((b%360)+360)%360/45)%8]}
function cmpGeom(){
  var ori=CFG.bussolaAlvo==='origem',alvo=STOPS[ori?state.from:state.to];if(!alvo)return null;
  var hasLoc=typeof LOC!=='undefined'&&LOC.on&&LOC.p&&!LOC.out;
  var S=hasLoc?LOC.p:(STOPS[ori?state.to:state.from]&&STOPS[ori?state.to:state.from].p);
  if(!S)return null;
  var vx=alvo.p[0]-S[0],vy=alvo.p[1]-S[1],m=Math.hypot(vx,vy)*mPerUnit();
  var angV=Math.atan2(vx,-vy)*180/Math.PI,bear=((angV-angN())%360+360)%360;
  return {to:alvo,fromLoc:hasLoc,m:m,angV:angV,bear:bear,origem:ori};
}
function distTxt(m){return m<1000?(Math.round(m/10)*10)+' m':(m/1000).toFixed(1).replace('.',',')+' km'}
function drawRose(){
  var rb=$('#rosebox');if(!rb)return;
  if(!CMP.on){rb.innerHTML='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,NORTH+ROT)+'</svg>';var rc=$('#rosecard');if(rc)rc.hidden=true;return}
  var g=cmpGeom(),hasH=CMP.h!=null,roseDeg=hasH?-CMP.h:angN(),needle=null,txt='',sub='';
  if(!g){txt='Escolha o destino em Seu trajeto';}
  else if(g.m<25){txt='Você chegou: '+(g.to.short||g.to.name);needle=null}
  else{
    needle=hasH?g.bear-CMP.h:g.angV;
    var rel=norm180(g.bear-(hasH?CMP.h:0));
    var dir=hasH?(Math.abs(rel)<=25?'à sua frente':Math.abs(rel)>=155?'atrás de você':rel>0?(rel<70?'à frente, à direita':'à sua direita'):(rel>-70?'à frente, à esquerda':'à sua esquerda')):'a '+cardinal(g.bear);
    txt=(g.to.short||g.to.name);sub=distTxt(g.m)+' · '+dir+(g.fromLoc?'':' (a partir do ponto de origem)');
  }
  var s='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,roseDeg);
  if(needle!=null)s+='<g class="cmp-needle" transform="rotate('+needle.toFixed(1)+')"><path d="M0,-60 L11,-38 L0,-44 L-11,-38Z"/><line x1="0" y1="-14" x2="0" y2="-40"/></g>';
  rb.innerHTML=s+'</svg>';
  var rc=$('#rosecard');if(rc){rc.hidden=false;var full=txt+(sub?' · '+sub:'');
    rc.innerHTML='<b>'+esc(txt)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+(hasH?(CMP.acc!=null&&(CMP.acc<0||CMP.acc>25)?'<small class="cmp-cal">Bússola imprecisa: mova o celular desenhando um 8 no ar.</small>':''):'<small class="cmp-hint">'+(CMP.got?'':'Sem bússola neste aparelho: a seta segue o mapa.')+'</small>');
    if(full!==CMP.lastTxt){CMP.lastTxt=full}}
  /* GPS: precisão e como a bússola está se ajustando */
  drawRoseGps();
}
function drawRoseGps(){
  var rc=$('#rosecard');if(!CMP.on||!rc||rc.hidden)return;
  var g=cmpGeom(),bits=[];
  if(g&&g.fromLoc){bits.push('GPS ± '+Math.round(LOC.acc)+' m');if(LOC.acc>40&&g.m>25)bits.push('posição imprecisa: vá para um lugar aberto')}
  else if(typeof LOC!=='undefined'&&LOC.on&&!LOC.p)bits.push('procurando o GPS…');
  if(CMP.gpsH&&!CMP.got)bits.push('direção pelo seu movimento');
  else if(CMP.offN>=5&&CMP.h!=null)bits.push('bússola ajustada pelo GPS');
  else if(CMP.got&&LOC.on)bits.push('ande uns passos olhando para a tela para ajustar');
  if(bits.length)rc.insertAdjacentHTML('beforeend','<small class="cmp-gps">'+esc(bits.join(' · '))+'</small>');
  if(g&&g.fromLoc&&g.m>25&&g.m<=LOC.acc){var b=rc.querySelector('b');if(b)b.textContent=(g.to.short||g.to.name)+': você está bem perto'}
}
function cmpSchedule(){if(CMP.raf)return;CMP.raf=requestAnimationFrame(function(){CMP.raf=0;drawRose()})}
/* v24: bússola corrigida.
   1) o sensor dá o norte MAGNÉTICO; no Fundão ele fica ~23,5° a oeste do norte verdadeiro (declinação, modelo WMM).
   2) no Android o "alpha" só vale com o celular deitado; com o celular em pé ou inclinado, calculamos a direção
      para onde a pessoa está olhando (parte de cima da tela + traseira do aparelho), já levando em conta a rotação da tela. */
var DECL=-23.5;
function scrAng(){return (screen.orientation&&typeof screen.orientation.angle==='number')?screen.orientation.angle:(+window.orientation||0)}
function headingFromEuler(al,be,ga,so){
  var r=Math.PI/180,ca=Math.cos(al*r),sa=Math.sin(al*r),cb=Math.cos(be*r),sb=Math.sin(be*r),cg=Math.cos(ga*r),sg=Math.sin(ga*r);
  var yE=-sa*cb,yN=ca*cb,xE=ca*cg-sa*sg*sb,xN=sa*cg+ca*sg*sb,zE=ca*sg+sa*sb*cg,zN=sa*sg-ca*sb*cg;
  var t=so*r,uE=Math.cos(t)*yE+Math.sin(t)*xE,uN=Math.cos(t)*yN+Math.sin(t)*xN;/* "para cima" na tela */
  var fE=uE-zE,fN=uN-zN;/* + traseira do aparelho (para onde a câmera aponta) */
  if(Math.hypot(fE,fN)<1e-3)return null;
  return (Math.atan2(fE,fN)*180/Math.PI+360)%360;
}
function onOri(e){
  var h=null,so=scrAng();
  if(typeof e.webkitCompassHeading==='number'&&!isNaN(e.webkitCompassHeading)&&e.webkitCompassHeading>=0){
    h=e.webkitCompassHeading+so;CMP.acc=typeof e.webkitCompassAccuracy==='number'?e.webkitCompassAccuracy:null;CMP.src='ios';
  }else if(e.absolute===true&&typeof e.alpha==='number'){
    if(typeof e.beta==='number'&&typeof e.gamma==='number')h=headingFromEuler(e.alpha,e.beta,e.gamma,so);
    if(h==null)h=360-e.alpha+so;
    CMP.src='abs';
  }
  if(h==null||(CMP.src==='ios'&&e.type==='deviceorientationabsolute'))return;
  h=((h+DECL)%360+360)%360;CMP.hRaw=h;CMP.tRaw=Date.now();
  if(CMP.offN>=5)h=((h+CMP.off)%360+360)%360;/* v25: ajuste fino aprendido com o GPS */
  if(CMP.h==null)CMP.h=h;else{var d=norm180(h-CMP.h);CMP.h=((CMP.h+d*0.25)%360+360)%360}/* suaviza a agulha */
  CMP.got=true;cmpSchedule();
}
function cmpListen(){window.addEventListener('deviceorientationabsolute',onOri,true);window.addEventListener('deviceorientation',onOri,true)}
function cmpStart(){
  CMP.on=true;CMP.h=null;CMP.got=false;var rb=$('#rosebox');rb.setAttribute('aria-pressed','true');rb.classList.add('on');
  var DOE=window.DeviceOrientationEvent;
  if(DOE)cmpListen();
  if(DOE&&typeof DOE.requestPermission==='function'){DOE.requestPermission().then(function(st){if(st!=='granted'&&!CMP.got)gToast('Sem permissão de orientação: a seta segue o mapa.')}).catch(function(){})}
  if(typeof LOC!=='undefined'&&!LOC.on&&'geolocation' in navigator)locStart();
  var g=cmpGeom();gToast(g?'A seta laranja aponta para '+(g.to.short||g.to.name)+'.':'Escolha o destino em Seu trajeto.');
  drawRose();
}
function cmpStop(){CMP.on=false;window.removeEventListener('deviceorientationabsolute',onOri,true);window.removeEventListener('deviceorientation',onOri,true);var rb=$('#rosebox');rb.setAttribute('aria-pressed','false');rb.classList.remove('on');drawRose()}
(function(){var rb=$('#rosebox');if(!rb)return;rb.removeAttribute('aria-hidden');rb.setAttribute('role','button');rb.tabIndex=0;rb.setAttribute('aria-pressed','false');rb.setAttribute('aria-label','Bússola: apontar para o ponto de destino');rb.title='Apontar para o destino';
  rb.insertAdjacentHTML('afterend','<div class="rosecard glass" id="rosecard" role="status" aria-live="polite" hidden></div>');
  rb.addEventListener('click',function(){if(CMP.on){cmpStop();CFG.bussola=false}else{cmpStart();CFG.bussola=true}saveCfg();if(!cfgM.hidden){var t=$('#cfgCompass');if(t)t.checked=CFG.bussola}});
  rb.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();rb.click()}});
})();
document.addEventListener('change',function(e){if(e.target&&e.target.id==='cfgCompass'){CFG.bussola=e.target.checked;saveCfg();if(CFG.bussola&&!CMP.on)cmpStart();else if(!CFG.bussola&&CMP.on)cmpStop()}});
if(CFG.bussola)setTimeout(function(){if(!CMP.on)cmpStart()},800);
aoFazer('trajeto montado',function(){if(CMP.on)cmpSchedule()});/* ---------- filtros do topo: encurta os nomes se não couberem numa linha ---------- */
(function(){var bar=document.querySelector('.bar'),ch=bar&&bar.querySelector('.chips');if(!ch)return;
  function fit(){bar.classList.remove('short');if(getComputedStyle(ch).display!=='grid')return;
    var over=[].some.call(ch.children,function(c){var l=c.lastElementChild,r=c.getBoundingClientRect();return c.scrollWidth>c.clientWidth||(l&&l.getBoundingClientRect().right>r.right-9)})||ch.scrollWidth>ch.clientWidth;
    if(over)bar.classList.add('short')}
  var t;function later(){clearTimeout(t);t=setTimeout(fit,80)}
  window.addEventListener('resize',later);window.addEventListener('orientationchange',later);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
  new MutationObserver(later).observe(document.documentElement,{attributes:true,attributeFilter:['data-font','style','class']});
  requestAnimationFrame(fit);/* depois que a página terminar de montar: medir agora obrigaria um layout a mais */
})();
