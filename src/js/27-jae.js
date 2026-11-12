/* ======================= Atalho para o Jaé (passagem dos ônibus, BRT e VLT da prefeitura do Rio) =======================
   O Jaé não tem serviço aberto para outros apps (saldo, recarga, QR Code) nem um link público que abra o app direto
   (como o wa.me do WhatsApp). Por isso o atalho leva à página do app oficial na loja do aparelho: lá aparece "Abrir"
   se o app já estiver instalado e "Instalar"/"Obter" se não estiver. No computador, mostra as duas lojas. */
var JAE_IOS='https://apps.apple.com/br/app/id6449981829';
var JAE_PLAY='https://play.google.com/store/apps/details?id=br.com.billingpay.app.pf';
function jaeAparelho(){
  var ua=navigator.userAgent;
  if(/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return 'ios';
  return /Android/.test(ua)?'android':'';
}
var JAE_IC='<svg class="lk-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M7 14.5h4"/></svg>';
function jaeLink(url,txt){return '<a class="copy jae-link" href="'+url+'" target="_blank" rel="noopener">'+JAE_IC+txt+'</a>'}
function jaeHTML(){
  var a=jaeAparelho();
  var botoes=a==='ios'?jaeLink(JAE_IOS,'Abrir ou baixar o Jaé'):a==='android'?jaeLink(JAE_PLAY,'Abrir ou baixar o Jaé'):
    jaeLink(JAE_PLAY,'Jaé no Google Play')+jaeLink(JAE_IOS,'Jaé na App Store');
  return '<div class="jae-box"><p class="small keep">Nos ônibus, BRT e VLT da prefeitura do Rio, a passagem é paga com o <b>Jaé</b>: cartão ou QR Code no app.</p>'+
    '<div class="jae-bt">'+botoes+'</div>'+(a?'<p class="muted small keep">Se o app já estiver instalado, a loja mostra o botão Abrir.</p>':'')+'</div>';
}
/* em Trajetos, logo depois de "Ônibus da cidade" (fora do bloco, que é redesenhado a cada minuto) */
function jaeTrajeto(){
  if(!plan||$('#jaebox'))return;
  var d=document.createElement('div');d.id='jaebox';d.innerHTML=jaeHTML();
  var x=$('#extbox');if(x)x.insertAdjacentElement('afterend',d);else plan.appendChild(d);
}
aoFazer('trajeto montado',jaeTrajeto);
jaeTrajeto();/* Trajetos já foi montado uma vez antes desta parte carregar */
/* no detalhe de um ponto da prefeitura do Rio */
aoFazer('detalhe montado',function(){
  if(state.sel&&state.sel.kind==='ext'&&detail&&!detail.querySelector('.jae-box'))detail.insertAdjacentHTML('beforeend',jaeHTML());
});
