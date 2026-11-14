/* ======================= Avisos em todos os aparelhos da conta =======================
   Com conta, os avisos de ônibus, os de tiroteio e os testes chegam em todos os aparelhos em que a pessoa entrou e
   permitiu as notificações. A conta guarda um código aleatório (CFG.pushGrupo, só na conta da pessoa); cada aparelho
   manda o código ao Worker junto com a assinatura e o Worker avisa todos os aparelhos do mesmo código, uma vez cada.
   "Notificar tiroteios novos" também vai com a conta (CFG.tiroPush: 'on'/'off'): ligar ou desligar num aparelho vale
   para os outros quando eles abrirem o app. Sem conta, nada muda: cada aparelho é só dele. */
function pushGrupoAtual(){
  if(!contaOk()||!ACC.remotoOk)return '';/* só depois de ler a conta: um aparelho novo usa o código que ela já tem */
  if(!/^[a-f0-9]{32}$/.test(CFG.pushGrupo||'')){var a=new Uint8Array(16);crypto.getRandomValues(a);
    CFG.pushGrupo=Array.prototype.map.call(a,function(x){return (x<16?'0':'')+x.toString(16)}).join('');saveCfg()}
  return CFG.pushGrupo;
}
/* depois de entrar: entra no grupo da conta e segue a escolha dos tiroteios feita em outro aparelho */
function pushContaPronta(){
  if(!contaOk()||!pushSuportado())return;pushGrupoAtual();
  var perm=pushPermissao();
  if(CFG.tiroPush==='on'&&!pushLigado()){
    if(perm==='granted')pushChave().then(pushAssina).then(function(){PUSH.msg='Notificações de tiroteio ligadas, como nos seus outros aparelhos.';pushPinta();
      if(CFG.tiroteios!==true){CFG.tiroteios=true;saveCfg();if(typeof tiroLoop==='function')tiroLoop()}}).catch(function(){});
    else if(perm==='default'&&!pushContaPronta.avisou){pushContaPronta.avisou=1;gToast('Os avisos de tiroteio estão ligados na sua conta. Para receber neste aparelho, ligue em Ajustes › Segurança no caminho.')}
  }else if(CFG.tiroPush==='off'&&pushLigado()){PUSH.daConta=true;pushDesliga()}
  /* com notificações já permitidas: confirma o aparelho no grupo (mesmo sem avisos de ônibus) */
  if(perm==='granted')alvSincroniza(false).then(function(){alvPinta()});
}
aoFazer('conta carregada',pushContaPronta);
/* ao sair da conta: o aparelho deixa o grupo (o Worker tira quem chega sem o código) */
aoFazer('usuário saiu',function(){if(pushSuportado()&&pushPermissao()==='granted')alvSincroniza(false)});
