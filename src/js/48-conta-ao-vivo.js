/* ======================= Conta ao vivo entre aparelhos =======================
   Antes, o aparelho lia a conta só ao entrar (ou ao abrir o app). Agora, com a conta Google ou e-mail, ele fica
   ouvindo o documento da conta (usuarios/{uid}): um aviso de ônibus, favorito, prova ou ajuste mudado em outro
   aparelho aparece aqui em segundos, sem fechar o app. Ignora o que este próprio aparelho acabou de gravar
   (ts igual a ACC.tsEnviado; não compara relógios, que variam entre aparelhos) e espera terminar de gravar o que mudou aqui (ACC.state 'salvando'),
   para não desfazer uma mudança local com uma cópia velha da conta. Avisos, favoritos e provas se juntam pelo id
   (alvJunta, favJunta, prvJunta); o resto segue a regra de "Mesma personalização em todos os aparelhos". */
var CAV={pare:null,pend:null,ts:0};
function cavOuve(){
  cavPara();if(ACC.kind!=='google'||!ACC.fb||!ACC.uid)return;
  CAV.pare=ACC.fb.db.collection('usuarios').doc(ACC.uid).onSnapshot(function(d){
    if(!d||!d.exists||(d.metadata&&d.metadata.hasPendingWrites))return;
    var x=d.data()||{},ts=+x.ts||0;if(ts===ACC.tsEnviado||ts===CAV.ts)return;/* é o que este aparelho gravou, ou já foi aplicado */
    if(ACC.state==='salvando'){CAV.pend=x;return}
    cavAplica(x);
  },function(){});
}
function cavAplica(x){CAV.pend=null;CAV.ts=+x.ts||0;ACC.last=+x.ts||Date.now();applyRemote(x);if(typeof alvPinta==='function')alvPinta();if(typeof favPinta==='function')favPinta()}
function cavPara(){if(CAV.pare){try{CAV.pare()}catch(e){}CAV.pare=null}CAV.pend=null}
/* chegou mudança enquanto este aparelho gravava: aplica quando terminar */
setInterval(function(){if(CAV.pend&&ACC.state!=='salvando')cavAplica(CAV.pend)},1500);
aoFazer('conta carregada',cavOuve);
aoFazer('usuário saiu',cavPara);
