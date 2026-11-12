/* ======================= Perfil de uso: quem é você no Fundão =======================
   Depois do primeiro login, uma folha pergunta como a pessoa usa o Fundão (estuda, mora na Vila Residencial,
   trabalha, é paciente ou visitante). Com isso:
   - quem mora na Vila tem a "Volta à noite" apontando para o ponto mais perto da Vila (e não para a Estação BRT);
   - a aba Grade aparece só para quem quer (por padrão, quem estuda).
   Guardado no aparelho em cse-uso; dá para mudar em Ajustes › Perfil. */
var USO=null;try{USO=JSON.parse(localStorage.getItem('cse-uso')||'null')}catch(e){USO=null}
var USO_OPC=[['estuda','Estudo na UFRJ'],['vila','Moro na Vila Residencial'],['trabalha','Trabalho no Fundão'],['visita','Sou paciente ou visitante']];
var VILA_LL=[-22.8689,-43.2182];/* centro da Vila Residencial (ruas das flores, ponta sudeste da ilha; OpenStreetMap) */
var USO_ST={aberto:false,antes:null,mexeuGrade:false};
function usoRespondeu(){return !!(USO&&USO.t)}
function usoAdiado(){return !!(USO&&USO.ate&&Date.now()<USO.ate)}
function usoSalva(v){USO=v;try{localStorage.setItem('cse-uso',JSON.stringify(v))}catch(e){}}
function usoMoraNaVila(){return !!(USO&&USO.vila)}
/* ponto das linhas internas mais perto da Vila, com a caminhada (linha reta × 1,3, a 75 m/min) */
function vilaPonto(){
  if(vilaPonto.r)return vilaPonto.r;var p=ll2map(VILA_LL[0],VILA_LL[1]),best=null,bd=1e18;
  Object.keys(STOPS).forEach(function(k){var q=STOPS[k].p,d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<bd){bd=d;best=k}});
  var m=bd/MPU*1.3;return vilaPonto.r={id:best,m:Math.round(m/10)*10,min:Math.max(1,Math.round(m/75))};
}
/* destino da Volta à noite: a Vila para quem mora lá (a não ser que peça a Estação), senão a Estação BRT */
function nightDest(){return usoMoraNaVila()&&!state.nightEst?vilaPonto().id:'est'}
function usoResumo(){if(!usoRespondeu())return 'Ainda não informado';var L=USO_OPC.filter(function(o){return USO[o[0]]}).map(function(o){return o[1]});return L.length?L.join(' · '):'Nenhuma opção marcada'}
function usoAplicaGrade(mostra){var off=tabOff().filter(function(t){return t!=='grade'});if(!mostra)off.push('grade');
  if(off.join()!==tabOff().join())saveTabs(tabOrder(),off)}
function usoHTML(){
  var u=USO||{},grade=usoRespondeu()?tabOn('grade'):true;
  return '<div class="inst-topo"><img src="icone.svg" alt="" width="52" height="52"><div><h2 id="usoT">Como você usa o Fundão?</h2>'+
    '<p class="inst-sub">Para o app mostrar o que serve para você. Marque o que valer.</p></div></div>'+
    '<div class="uso-opc" role="group" aria-labelledby="usoT">'+USO_OPC.map(function(o){return '<label class="uso-o"><input type="checkbox" data-uso="'+o[0]+'"'+(u[o[0]]?' checked':'')+'><span>'+o[1]+'</span></label>'}).join('')+'</div>'+
    '<p class="inst-dica" id="usoVila"'+(u.vila?'':' hidden')+'>A Volta à noite vai mostrar o último ônibus até o ponto mais perto da Vila ('+esc(STOPS[vilaPonto().id].short||STOPS[vilaPonto().id].name)+').</p>'+
    '<label class="uso-o uso-g"><input type="checkbox" id="usoGrade"'+(grade?' checked':'')+'><span>Mostrar a aba Grade<small>Seu horário de aulas, com o ônibus de cada uma.</small></span></label>'+
    '<div class="inst-acoes inst-fim"><button type="button" class="linkbtn" id="usoDepois">Agora não</button><button type="button" class="copy primary" id="usoOk">Salvar</button></div>';
}
function usoAbre(){
  if(USO_ST.aberto)return;USO_ST.aberto=true;USO_ST.mexeuGrade=usoRespondeu();USO_ST.antes=document.activeElement;
  document.body.insertAdjacentHTML('beforeend','<div class="inst-fundo" id="usoFundo"></div><div class="inst-folha" id="usoFolha" role="dialog" aria-modal="true" aria-labelledby="usoT">'+usoHTML()+'</div>');
  requestAnimationFrame(function(){var f=$('#usoFolha');if(f){f.classList.add('on');$('#usoFundo').classList.add('on');var b=f.querySelector('input');if(b)b.focus({preventScroll:true})}});
}
function usoFecha(){var f=$('#usoFolha'),g=$('#usoFundo');if(f)f.remove();if(g)g.remove();USO_ST.aberto=false;try{if(USO_ST.antes&&USO_ST.antes.focus)USO_ST.antes.focus({preventScroll:true})}catch(e){}}
function usoGuardaFolha(){
  var v={t:Date.now()};USO_OPC.forEach(function(o){var c=document.querySelector('#usoFolha [data-uso="'+o[0]+'"]');v[o[0]]=!!(c&&c.checked)});
  var g=$('#usoGrade').checked;usoSalva(v);usoFecha();state.nightEst=false;usoAplicaGrade(g);
  if(!$('#pane-cfg').hidden)renderCfgKeep();refreshAll();
  gToast(v.vila?'Pronto. A Volta à noite agora leva até a Vila Residencial.':'Pronto. Dá para mudar em Ajustes › Perfil.');
}
document.addEventListener('change',function(e){var t=e.target;if(!t.closest||!t.closest('#usoFolha'))return;
  if(t.id==='usoGrade'){USO_ST.mexeuGrade=true;return}
  if(t.dataset.uso==='vila'){var p=$('#usoVila');if(p)p.hidden=!t.checked}
  /* enquanto a pessoa não mexer na Grade, ela acompanha "Estudo na UFRJ" (sem nada marcado, fica ligada) */
  if(!USO_ST.mexeuGrade){var m=[].slice.call(document.querySelectorAll('#usoFolha [data-uso]')),algum=m.some(function(c){return c.checked}),est=m.filter(function(c){return c.dataset.uso==='estuda'})[0];
    $('#usoGrade').checked=!algum||est.checked}
});
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;
  if(t.closest('#usoOk')){usoGuardaFolha();return}
  if(t.closest('#usoDepois')||t.closest('#usoFundo')){if(!usoRespondeu())usoSalva({ate:Date.now()+7*864e5});usoFecha();return}
  if(t.closest('[data-usoabre]')){usoAbre();return}
  if(t.closest('[data-nightest]')){state.nightEst=!state.nightEst;refreshAll();return}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&USO_ST.aberto){if(!usoRespondeu())usoSalva({ate:Date.now()+7*864e5});usoFecha()}});
/* pergunta: logo depois do login; para quem já tinha perfil, uma vez, com a tela livre */
function usoTalvezPergunte(){
  if(!PERFIL||usoRespondeu()||usoAdiado()||USO_ST.aberto)return;
  var n=0,t=setInterval(function(){if(usoRespondeu()||USO_ST.aberto||!PERFIL||++n>40){clearInterval(t);return}
    if(instTelaLivre()&&!document.querySelector('#instFolha')){clearInterval(t);usoAbre()}},1500);
}
aoFazer('login fechado',function(){setTimeout(usoTalvezPergunte,600)});
setTimeout(usoTalvezPergunte,4000);
/* Ajustes › Perfil: resumo e botão para mudar */
aoFazer('ajustes montados',function(){
  var p=document.querySelector('#pane-cfg .prof');if(!p||document.querySelector('#usoCfg'))return;
  p.insertAdjacentHTML('afterend','<div class="prof uso-cfg" id="usoCfg"><span class="grow"><b>Como você usa o Fundão</b><small>'+esc(usoResumo())+'</small></span><button class="copy" type="button" data-usoabre>'+(usoRespondeu()?'Mudar':'Responder')+'</button></div>');
});
