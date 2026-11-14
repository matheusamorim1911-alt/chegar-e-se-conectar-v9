/* ======================= Ônibus ao vivo desenhados em canvas =======================
   Os ônibus da cidade se mexem ~10 vezes por segundo. Mexer em dezenas de elementos do SVG a cada quadro obrigava o
   navegador a recalcular estilo e layout; agora eles são pintados num canvas por cima do mapa (um desenho só por quadro).
   Os marcadores do SVG continuam lá, invisíveis, para tocar, para o teclado, para leitores de tela e para "Seguir"
   (mas só andam a cada ~0,7 s). O desenho segue a vista do mapa (viewBox), o giro (ROT) e o tamanho dos marcadores (MS).
   Sem canvas no navegador, fica tudo como antes (SVG). */
var LVC={on:false,cv:null,cx:null,fonte:'',m:null,t:0};
(function(){
  var c=document.createElement('canvas');if(!svg||!c.getContext||!c.getContext('2d'))return;
  /* logo depois do SVG do mapa: fica por cima dele e por baixo dos botões do mapa */
  c.id='lvCanvas';c.setAttribute('aria-hidden','true');svg.insertAdjacentElement('afterend',c);
  LVC.cv=c;LVC.cx=c.getContext('2d');LVC.on=true;document.documentElement.classList.add('lv-canvas');
  try{LVC.fonte=getComputedStyle(document.body).getPropertyValue('--f-body')||'sans-serif'}catch(e){LVC.fonte='sans-serif'}
})();
/* da coordenada do mapa (dentro de #world, girado por ROT) para o pixel do canvas */
function lvcMatriz(){
  var b=box(),k=Math.min(b.w/view.w,b.h/view.h),ox=(b.w-view.w*k)/2-view.x*k,oy=(b.h-view.h*k)/2-view.y*k,r=(ROT||0)*Math.PI/180;
  return {k:k,ox:ox,oy:oy,c:Math.cos(r),s:Math.sin(r),w:b.w,h:b.h};
}
function lvcPinta(){
  if(!LVC.on)return;var c=LVC.cv,x=LVC.cx,M=lvcMatriz(),dpr=Math.min(2,window.devicePixelRatio||1);
  var W=Math.round(M.w*dpr),H=Math.round(M.h*dpr);if(c.width!==W||c.height!==H){c.width=W;c.height=H}
  LVC.m=M;if(c.style.transform)c.style.transform='';
  x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);
  var g=$('#gExt');if(!g||g.classList.contains('off'))return;
  var G=$('#gLive'),modo=G&&G.classList.contains('seg-modo'),R=11*(+MS||1)*M.k,seg=null;
  x.setTransform(dpr,0,0,dpr,0,0);x.textAlign='center';x.textBaseline='alphabetic';
  x.font='800 '+(9.5*(+MS||1)*M.k).toFixed(1)+'px '+LVC.fonte;
  var um=function(S){
    var px=M.c*S.x-M.s*S.y,py=M.s*S.x+M.c*S.y,X=px*M.k+M.ox,Y=py*M.k+M.oy,on=S.el&&S.el.classList.contains('seg-on');
    if(X<-30||Y<-30||X>M.w+30||Y>M.h+30)return;
    x.globalAlpha=modo&&!on?0.55:1;
    if(on){x.beginPath();x.arc(X,Y,R*16/11,0,6.2832);x.fillStyle='rgba(255,210,74,.28)';x.fill()}
    if(S.ang!=null){var a=(S.ang+(ROT||0))*Math.PI/180,u=R/11;x.save();x.translate(X,Y);x.rotate(a);x.beginPath();x.moveTo(0,-18*u);x.lineTo(5.5*u,-11.5*u);x.lineTo(-5.5*u,-11.5*u);x.closePath();
      x.fillStyle='#fff';x.fill();x.lineWidth=1*u;x.strokeStyle='#1a2a3a';x.stroke();x.restore()}
    x.beginPath();x.arc(X,Y,R,0,6.2832);x.fillStyle=S.cor||'#5B6B7A';x.fill();x.lineWidth=(on?3.5:2.5)*R/11;x.strokeStyle=on?'#FFD24A':'#fff';x.stroke();
    if(S.txt){x.fillStyle='#fff';x.fillText(S.txt,X,Y+3.5*R/11)}
  };
  Object.keys(LV2.st).forEach(function(v){var S=LV2.st[v];if(S.x==null||!S.el||!S.el.isConnected)return;if(S.el.classList.contains('seg-on')){seg=S;return}um(S)});
  if(seg)um(seg);/* o ônibus seguido por cima dos outros */
  x.globalAlpha=1;
}
/* a vista mudou (arrastar, zoom, girar) ou a tela mudou de tamanho */
/* arrastar e dar zoom: em vez de repintar a cada quadro, só move e estica o desenho (o compositor faz isso de graça);
   o desenho de verdade vem no próximo passo da animação (~10 por segundo) ou logo depois que o gesto para */
aoFazer('vista aplicada',function(){
  if(!LVC.on)return;var A=LVC.m;
  if(!A||(ROT||0)*Math.PI/180!==Math.atan2(A.s,A.c)){lvcPinta();return}
  var M=lvcMatriz(),e=M.k/A.k;LVC.cv.style.transform='translate('+(M.ox-A.ox*e).toFixed(1)+'px,'+(M.oy-A.oy*e).toFixed(1)+'px) scale('+e.toFixed(4)+')';
  clearTimeout(LVC.t);LVC.t=setTimeout(lvcPinta,120);
});
aoFazer('mapa atualizado',function(){if(LVC.on)lvcPinta()});
window.addEventListener('resize',function(){if(LVC.on)requestAnimationFrame(lvcPinta)});
