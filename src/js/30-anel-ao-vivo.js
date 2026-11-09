/* ======================= Anel ao redor da bússola: estado dos ônibus ao vivo =======================
   Com a camada "Ônibus da cidade" ligada, um arco gira ao redor da bússola enquanto o Worker entrega posições:
   verde = chegando normalmente; laranja = chegando, mas com problema (a prefeitura falhou e o Worker mandou cópia,
   ou as posições estão velhas). Se nenhuma resposta boa chega há ANEL_PARADO_MS, o anel para e fica vermelho.
   No modo leve (sem movimento) o arco fica parado; a cor continua valendo. */
var ANEL_PARADO_MS=40000,ANEL_VELHO_MS=90000,ANEL={estado:''};
function anelEstado(){
  if(!LIVE.url||!state.layers.ext)return '';
  var agora=Date.now();
  if(!LIVE.t)return LIVE.err?'parado':'ok';/* ainda na primeira busca */
  if(agora-LIVE.t>ANEL_PARADO_MS)return 'parado';
  var novo=LIVE.bus.reduce(function(m,o){return Math.max(m,o.t||0)},0);
  if(LIVE.err||(novo&&agora-novo>ANEL_VELHO_MS))return 'lento';
  return 'ok';
}
var ANEL_TXT={ok:'Ônibus ao vivo: atualizando.',lento:'Ônibus ao vivo: atualizando com atraso.',parado:'Ônibus ao vivo: parados. O Worker não responde.'};
function anelPinta(){
  var a=$('#anelVivo');if(!a)return;var e=anelEstado();if(e===ANEL.estado)return;ANEL.estado=e;
  a.hidden=!e;a.className='anelvivo'+(e?' '+e:'');
  var t=$('#anelVivoTxt');if(t)t.textContent=e?ANEL_TXT[e]:'';
}
(function(){
  var mw=document.querySelector('.mapwrap');if(!mw||!LIVE.url)return;
  /* r=46 → circunferência ≈ 289; o arco ocupa um quarto */
  mw.insertAdjacentHTML('beforeend','<div class="anelvivo" id="anelVivo" hidden aria-hidden="true"><svg viewBox="0 0 100 100"><circle class="av-trilho" cx="50" cy="50" r="46"/><circle class="av-arco" cx="50" cy="50" r="46" pathLength="100"/></svg></div>'+
    '<span class="sr" id="anelVivoTxt" role="status" aria-live="polite"></span>');
  setInterval(function(){if(!document.hidden)anelPinta()},1000);
})();
aoFazer('mapa atualizado',anelPinta);
anelPinta();
