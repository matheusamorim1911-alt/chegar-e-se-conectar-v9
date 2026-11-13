/* ======================= Avisos na capa =======================
   Na capa, abaixo do aviso do dia: o alerta de tiroteio (vermelho até 2 h, amarelo até 5 h, quando os avisos estão
   ligados) e, para quem estuda na UFRJ, o botão do portal. As notificações do celular ficam em Ajustes. */
var PORTAL_UFRJ='https://portal.ufrj.br/Portal/acesso?cid=8475';
var CAPA_BECA='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.8v4.2c1.5 1.5 3.4 2.2 5.5 2.2s4-.7 5.5-2.2v-4.2"/><path d="M21.5 9.5v5"/></svg>';
function capaAvisosHTML(){
  var h='',N=tiroNivel();
  if(N){var o=N.ult;
    h+='<button type="button" class="cv-aviso '+N.cor+'" id="cvTiro"><span class="cv-av-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.5L22 20.5H2z"/><path class="ta-x" d="M12 9.5v5.2M12 17.4v.1"/></svg></span>'+
      '<span class="grow"><b>'+esc((N.cor==='vermelho'?'Tiroteio ':'Teve tiroteio ')+tiroHa(o.t)+(o.bairro?' em '+o.bairro:' perto das saídas'))+'</b><small>Evite a região se puder. Toque para ver. Fonte: Fogo Cruzado.</small></span></button>'}
  if(typeof favCapaHTML==='function')h+=favCapaHTML();/* favoritos (parte 43) */
  /* quem disse que estuda na UFRJ: atalho para o portal (sem o brasão: o app não é oficial) */
  if(typeof USO!=='undefined'&&USO&&USO.estuda)h+='<a class="cv-aviso cv-portal" id="cvPortal" href="'+PORTAL_UFRJ+'" target="_blank" rel="noopener noreferrer"><span class="cv-av-ic" aria-hidden="true">'+CAPA_BECA+'</span><span class="grow"><b>Portal da UFRJ</b><small>Abre o acesso ao portal em outra aba.</small></span></a>';
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
  if(t.closest('#cvTiro')){closeCover(function(){setTab('trajeto');var v=$('#tiroVer');if(v)v.click()})}
});
capaAvisos();
setInterval(function(){if(!document.hidden)capaAvisos()},1500);
