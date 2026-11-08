/* ======================= Atalho para o Jaé (passagem dos ônibus, BRT e VLT da prefeitura) =======================
   O Jaé não tem serviço aberto para outros apps (saldo, recarga, QR Code): aqui só há um aviso curto e um link para
   o app oficial. No iPhone abre a página do app na App Store (que mostra "Abrir" se já estiver instalado); nos outros
   aparelhos, a busca do app no Google Play. */
var JAE_IOS='https://apps.apple.com/br/app/id6449981829';
var JAE_PLAY='https://play.google.com/store/search?q='+encodeURIComponent('Jaé Transporte')+'&c=apps';
function jaeUrl(){return /iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?JAE_IOS:JAE_PLAY}
function jaeHTML(){
  return '<div class="jae-box"><p class="small keep">Nos ônibus, BRT e VLT da prefeitura, a passagem é paga com o <b>Jaé</b>: cartão ou QR Code no app.</p>'+
    '<a class="copy jae-link" href="'+jaeUrl()+'" target="_blank" rel="noopener">'+
    '<svg class="lk-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M7 14.5h4"/></svg>App do Jaé</a></div>';
}
/* em Trajetos, logo depois de "Ônibus da cidade" (fora do bloco, que é redesenhado a cada minuto) */
function jaeTrajeto(){
  if(!plan||$('#jaebox'))return;
  var d=document.createElement('div');d.id='jaebox';d.innerHTML=jaeHTML();
  var x=$('#extbox');if(x)x.insertAdjacentElement('afterend',d);else plan.appendChild(d);
}
aoFazer('trajeto montado',jaeTrajeto);
jaeTrajeto();/* Trajetos já foi montado uma vez antes desta parte carregar */
/* no detalhe de um ponto da prefeitura */
aoFazer('detalhe montado',function(){
  if(state.sel&&state.sel.kind==='ext'&&detail&&!detail.querySelector('.jae-box'))detail.insertAdjacentHTML('beforeend',jaeHTML());
});
