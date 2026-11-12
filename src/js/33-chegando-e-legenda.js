/* ======================= Ônibus chegando (ao vivo) e legenda do ao vivo =======================
   1) No painel de um ponto de ônibus da cidade, "Chegando agora": os ônibus ao vivo que vêm no sentido do ponto
      pelo traçado da linha, com o tempo estimado (a mesma conta de "seguir um ônibus") e a distância.
   2) Na legenda do mapa, os itens do ao vivo (só com a camada "Ônibus da cidade" ligada). */
var CHG_MAX_M=6000,CHG_PERTO_M=45;
function chegandoEm(id){
  var G=EXTS[id];if(!G)return [];var L=[];
  LIVE.bus.forEach(function(o){var S=LV2.st[o.v],O=S&&S.obs;if(!O||O.i==null||S.s==null||!SHP[O.i])return;
    var r=projOn(O.i,G.p);if(!r||r.d>CHG_PERTO_M*MPU)return;
    var sg=O.sign>0?1:-1,m=(r.s-S.s)*sg/MPU;if(!(m>-15&&m<CHG_MAX_M))return;
    if(lvV(O)<=0.3&&m>1500)return;/* parado longe (ponto final, garagem): não está chegando */
    m=Math.max(0,m);L.push({o:o,m:m,t:m>0?segTempo(O,S.s,m):0,idade:Math.round((Date.now()-o.t)/1000)})});
  return L.sort(function(a,b){return a.t-b.t}).slice(0,8);
}
function chegandoHTML(id){
  if(!LIVE.url)return '';
  var L=chegandoEm(id),h='<div class="chg-box" id="chgBox"><h3>Chegando agora <span class="lv-tag">ao vivo</span></h3>';
  if(!LIVE.t)return h+'<p class="muted small keep">Buscando ônibus ao vivo…</p></div>';
  if(!L.length)return h+'<p class="muted small keep">Nenhum ônibus ao vivo vindo para este ponto agora.'+(LIVE.err?' A prefeitura do Rio não respondeu na última tentativa.':'')+'</p></div>';
  return h+'<ul class="xl-list chg-list">'+L.map(function(x){var Li=segLinha(x.o.l);
    return '<li><div class="xl-row">'+extBadge(Li)+'<span class="grow"><b>'+segQuando(x.t,x.m)+'</b><small>'+(Li.d?'Para '+esc(Li.d)+' · ':'')+'a '+segM(x.m)+' · carro '+esc(x.o.v)+(x.idade>60?' · posição de '+segIdade(x.idade)+' atrás':'')+'</small></span>'+
      '<button type="button" class="copy chg-seg" data-chgseg="'+esc(x.o.v)+'" aria-label="Seguir o ônibus '+esc(x.o.l)+', carro '+esc(x.o.v)+', no mapa">Seguir</button></div></li>'}).join('')+'</ul>'+
    '<p class="muted small keep">Tempo estimado pela posição e velocidade do ônibus. Pode variar com o trânsito.</p></div>';
}
aoFazer('detalhe montado',function(){
  if(!state.sel||state.sel.kind!=='ext'||!detail||detail.querySelector('#chgBox'))return;
  var h=chegandoHTML(state.sel.id);if(!h)return;var a=detail.querySelector('.lv-st');
  if(a)a.insertAdjacentHTML('afterend',h);else{var t=detail.querySelector('h2');if(t)t.insertAdjacentHTML('afterend',h)}
});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-chgseg]');if(!b)return;segSeguir(b.dataset.chgseg);
  var m=document.querySelector('.mapwrap');if(m&&m.scrollIntoView)m.scrollIntoView({block:'nearest',behavior:'smooth'})});

/* ---------- legenda: itens do ao vivo ---------- */
(function(){
  var lg=$('#legend');if(!lg||!LIVE.url||$('#lgVivo'))return;var ref=lg.querySelector('.hint');
  var h='<span class="lg-vivo" id="lgVivo" role="group" aria-label="Ônibus da cidade ao vivo">'+
    '<span><i class="lg-bus"><b>485</b></i>Ônibus ao vivo: número da linha; a ponta mostra o sentido</span>'+
    '<span><i class="lg-bus seg"><b>485</b></i>Ônibus que você está seguindo</span>'+
    '<span><i class="lg-bus cinza"><b>95</b></i>Linha sem horários no app</span>'+
    '<span><i class="sw sw-ext"></i>Ponto de ônibus da cidade</span>'+
    '<span><i class="lg-anel ok"></i>Anel verde na bússola: posições chegando</span>'+
    '<span><i class="lg-anel lento"></i>Laranja: chegando com atraso</span>'+
    '<span><i class="lg-anel parado"></i>Vermelho: ao vivo parado</span>'+
    '<span>Entre uma posição e outra, o ônibus avança pela velocidade (estimativa)</span></span>';
  if(ref)ref.insertAdjacentHTML('beforebegin',h);else lg.insertAdjacentHTML('beforeend',h);
})();
function lgVivoPinta(){var g=$('#lgVivo');if(g)g.hidden=!state.layers.ext}
aoFazer('mapa atualizado',lgVivoPinta);
lgVivoPinta();
