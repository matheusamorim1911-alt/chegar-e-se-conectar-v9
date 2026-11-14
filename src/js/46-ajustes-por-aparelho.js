/* ======================= Personalização por aparelho =======================
   Com conta, os ajustes iam todos para a conta e eram os mesmos em todos os aparelhos. Agora a personalização (tema,
   capa, fundo, letra, desempenho, mapa, abas, avisos da tela…) pode ficar só neste aparelho: Ajustes › Conta ›
   "Mesma personalização em todos os aparelhos" (cse-pers-conta, no aparelho; ligado por padrão). Desligado, o aparelho
   não muda a personalização da conta nem recebe a dela. Favoritos, provas, avisos de ônibus e idioma vão sempre com a
   conta (CFG_CONTA em 09-lugares-conta-fonte.js). Ligar de novo traz a personalização da conta para este aparelho. */
function persHTML(){
  var on=persNaConta();
  return '<div class="tgls" id="perssec">'+tg('cfgPersConta',on,'Mesma personalização em todos os aparelhos',
    on?'Tema, capa, mapa e outras preferências seguem a sua conta. Desligue para este aparelho ter as suas.':'Este aparelho tem a sua própria personalização. Favoritos, provas e avisos de ônibus continuam com a conta.')+'</div>';
}
function persPinta(){var a=$('#accsec'),p=$('#perssec');if(p)p.remove();if(a&&contaOk())a.insertAdjacentHTML('afterend',persHTML())}
aoFazer('ajustes montados',persPinta);
document.addEventListener('change',function(e){if(e.target.id!=='cfgPersConta')return;var on=e.target.checked;
  try{localStorage.setItem('cse-pers-conta',on?'1':'0')}catch(x){}
  if(on){if(ACC.cfgConta)applyRemote({cfg:ACC.cfgConta});accQueue();gToast('Este aparelho agora segue a personalização da conta.')}
  else gToast('A personalização deste aparelho agora é só dele.');
  persPinta();var c=$('#cfgPersConta');if(c)c.focus()});
