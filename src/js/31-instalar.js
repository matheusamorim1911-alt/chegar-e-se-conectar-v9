/* ======================= Convite para instalar o app (iPhone e Android) =======================
   No celular, quando o app está aberto no navegador (não instalado), mostra uma folha com o passo a passo:
   - Android com o pedido de instalação do navegador disponível: um botão "Instalar" (o próprio navegador confirma);
   - Android sem esse pedido (outros navegadores): menu ⋮ › "Instalar app" ou "Adicionar à tela inicial";
   - iPhone/iPad: Compartilhar › "Adicionar à Tela de Início" › "Adicionar" (no Safari e no Chrome do iPhone).
   Aparece uma vez por sessão, depois de uns segundos e só com a tela livre (sem capa, login ou janela aberta).
   "Agora não" adia 7 dias; "Não mostrar mais" para de vez (cse-instalar). Em Ajustes › Instalar o app há
   "Ver o passo a passo". Nos navegadores internos (WhatsApp, Instagram…) não aparece: lá não dá para instalar. */
var INST={aberto:false,mostrado:false};
function instPlataforma(){var u=navigator.userAgent||'';
  if(/iphone|ipad|ipod/i.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return 'ios';
  if(/android/i.test(u))return 'android';return ''}
function instPode(){return ON_SITE&&!pwaStandalone()&&!INAPP&&!!instPlataforma()}
function instAdiado(){try{var v=JSON.parse(localStorage.getItem('cse-instalar')||'null');return v&&(v.nunca||Date.now()<v.ate)}catch(e){return false}}
function instAdia(nunca){try{localStorage.setItem('cse-instalar',JSON.stringify(nunca?{nunca:true}:{ate:Date.now()+7*864e5}))}catch(e){}}
var INST_IC={
  share:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M7 10H5.5A1.5 1.5 0 0 0 4 11.5v8A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 18.5 10H17"/></svg>',
  mais:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
  ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  menu:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/></svg>',
  baixa:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/></svg>'};
function instPassos(L){return '<ol class="inst-passos">'+L.map(function(p,i){return '<li><span class="inst-n">'+(i+1)+'</span><span class="inst-ic">'+INST_IC[p[0]]+'</span><span class="inst-t">'+p[1]+'</span></li>'}).join('')+'</ol>'}
function instHTML(){
  var pl=instPlataforma(),u=navigator.userAgent||'',h='<div class="inst-topo"><img src="icone.svg" alt="" width="52" height="52"><div><h2 id="instT">Instale o Chega aí</h2>'+
    '<p class="inst-sub">Ícone na tela inicial, tela cheia e funciona mesmo sem internet.</p></div></div>';
  if(pl==='android'&&PWA.evt)h+='<p class="inst-dica">É só um toque: o celular pede para confirmar.</p><div class="inst-acoes"><button type="button" class="copy primary inst-grande" id="instGo">'+INST_IC.baixa+'Instalar o app</button></div>';
  else if(pl==='android')h+=instPassos([['menu','Toque no menu <b>⋮</b> do navegador, no canto de cima.'],['baixa','Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.'],['ok','Confirme em <b>Instalar</b>.']]);
  else{var chrome=/CriOS/.test(u),outro=/FxiOS|EdgiOS|OPiOS/.test(u);
    h+=instPassos([['share',chrome?'Toque em <b>Compartilhar</b>, na barra de endereço, em cima.':'Toque em <b>Compartilhar</b> na barra do Safari. Se não aparecer, toque antes em <b>···</b>.'],
      ['mais','Role a lista e toque em <b>Adicionar à Tela de Início</b>.'],['ok','Toque em <b>Adicionar</b>, no canto de cima.']]);
    if(outro)h+='<p class="inst-dica">Se o seu navegador não tiver essa opção, abra este endereço no Safari.</p>';}
  return h+'<div class="inst-acoes inst-fim"><button type="button" class="linkbtn" id="instNunca">Não mostrar mais</button><button type="button" class="copy" id="instDepois">Agora não</button></div>';
}
function instAbre(){
  if(INST.aberto)return;INST.aberto=true;INST.mostrado=true;INST.antes=document.activeElement;
  document.body.insertAdjacentHTML('beforeend','<div class="inst-fundo" id="instFundo"></div><div class="inst-folha" id="instFolha" role="dialog" aria-modal="true" aria-labelledby="instT">'+instHTML()+'</div>');
  requestAnimationFrame(function(){var f=$('#instFolha');if(f){f.classList.add('on');$('#instFundo').classList.add('on');var b=f.querySelector('#instGo')||f.querySelector('#instDepois');if(b)b.focus({preventScroll:true})}});
}
function instFecha(){var f=$('#instFolha'),g=$('#instFundo');if(f)f.remove();if(g)g.remove();INST.aberto=false;try{if(INST.antes&&INST.antes.focus)INST.antes.focus({preventScroll:true})}catch(e){}}
/* tela livre: nada cobrindo o app (capa, login, Ajustes, gestão…) */
function instTelaLivre(){
  var M=document.querySelectorAll('[role="dialog"], .login, .cover');
  for(var i=0;i<M.length;i++){var m=M[i];if(m.id==='instFolha'||m.closest('.mapwrap'))continue;if(m.hidden)continue;var r=m.getBoundingClientRect(),cs=getComputedStyle(m);
    if(r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0.05)return false}
  return !document.hidden;
}
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;
  if(t.closest('[data-instalar]')){e.preventDefault();instAbre();return}
  if(t.closest('#instDepois')||t.closest('#instFundo')){instAdia(false);instFecha();return}
  if(t.closest('#instNunca')){instAdia(true);instFecha();if(typeof gToast==='function')gToast('Tudo bem. Para instalar depois, veja Ajustes › Instalar o app.');return}
  if(t.closest('#instGo')&&PWA.evt){var ev=PWA.evt;ev.prompt();ev.userChoice.then(function(r){PWA.evt=null;instFecha();if(r&&r.outcome!=='accepted')instAdia(false)},function(){instFecha()})}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&INST.aberto){instAdia(false);instFecha()}});
window.addEventListener('appinstalled',function(){if(INST.aberto)instFecha()});
/* "Ver o passo a passo" em Ajustes › Instalar o app */
aoFazer('ajustes montados',function(){var s=$('#pwasec');if(s&&instPode()&&!s.querySelector('[data-instalar]')&&!s.querySelector('#pwaGo'))s.insertAdjacentHTML('beforeend','<div class="row"><button type="button" class="copy" data-instalar>Ver o passo a passo</button></div>')});
/* convite: uma vez por sessão, depois de 15 s, com a tela livre */
(function(){if(!instPode()||instAdiado())return;var n=0,ini=Date.now(),t=setInterval(function(){
  if(INST.mostrado||pwaStandalone()){clearInterval(t);return}
  if(Date.now()-ini<15000)return;
  if(instTelaLivre()){clearInterval(t);instAbre()}else if(++n>120)clearInterval(t)},2500)})();
