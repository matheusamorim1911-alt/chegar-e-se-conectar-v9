/* ======================= Notificações na capa =======================
   Na capa, abaixo do aviso do dia: o alerta de tiroteio (vermelho até 2 h, amarelo até 5 h, quando os avisos estão
   ligados) e o estado das notificações do celular, com o botão para ligar ali mesmo. */
var CAPA_SINO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
function capaAvisosHTML(){
  var h='',N=tiroNivel();
  if(N){var o=N.ult;
    h+='<button type="button" class="cv-aviso '+N.cor+'" id="cvTiro"><span class="cv-av-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.5L22 20.5H2z"/><path class="ta-x" d="M12 9.5v5.2M12 17.4v.1"/></svg></span>'+
      '<span class="grow"><b>'+esc((N.cor==='vermelho'?'Tiroteio ':'Teve tiroteio ')+tiroHa(o.t)+(o.bairro?' em '+o.bairro:' perto das saídas'))+'</b><small>Evite a região se puder. Toque para ver. Fonte: Fogo Cruzado.</small></span></button>'}
  if(ON_SITE&&PUSH.url){
    if(pushIosSemInstalar())h+='<button type="button" class="cv-aviso neutro" data-instalar>'+'<span class="cv-av-ic" aria-hidden="true">'+CAPA_SINO+'</span><span class="grow"><b>Receba avisos de tiroteio</b><small>No iPhone, instale o app na Tela de Início. Toque para ver como.</small></span></button>';
    else if(pushSuportado()){
      if(pushLigado())h+='<p class="cv-aviso neutro ok"><span class="cv-av-ic" aria-hidden="true">'+CAPA_SINO+'</span><span class="grow"><b>Notificações ligadas</b><small>'+esc(PUSH.msg&&!PUSH.busy?PUSH.msg:'Você recebe um aviso quando há tiroteio novo perto do Fundão.')+'</small></span></p>';
      else h+='<button type="button" class="cv-aviso neutro" id="cvPush"'+(PUSH.busy?' disabled':'')+'><span class="cv-av-ic" aria-hidden="true">'+CAPA_SINO+'</span><span class="grow"><b>'+(PUSH.busy?'Aguarde…':'Ativar notificações')+'</b><small>'+esc(PUSH.msg&&!PUSH.busy?PUSH.msg:'Aviso no celular quando houver tiroteio perto das saídas da ilha.')+'</small></span></button>'}
  }
  return h;
}
function capaAvisos(){
  if(!cover||cover.hidden)return;var b=$('#cvAvisos');
  if(!b){var t=$('#cvToday');if(!t)return;t.insertAdjacentHTML('afterend','<div class="cv-avisos" id="cvAvisos"></div>');b=$('#cvAvisos')}
  var h=capaAvisosHTML();if(b.dataset.h===h)return;
  var foco=document.activeElement&&b.contains(document.activeElement)?document.activeElement.id:'';
  b.dataset.h=h;b.innerHTML=h;b.hidden=!h;if(foco){var f=document.getElementById(foco);if(f)f.focus({preventScroll:true})}
  placeCoverMap();
}
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;
  if(t.closest('#cvPush')){pushLiga();capaAvisos();return}
  if(t.closest('#cvTiro')){closeCover(function(){setTab('trajeto');var v=$('#tiroVer');if(v)v.click()})}
});
capaAvisos();
setInterval(function(){if(!document.hidden)capaAvisos()},1500);
