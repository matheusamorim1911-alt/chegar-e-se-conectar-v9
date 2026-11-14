/* ======================= v11: exigir login para consultar (a gestão liga e desliga) ======================= */
var ACESSO={login:false};
var AUTH_READY=!FBMODE;   /* no site, só decide depois que o Firebase diz se há conta entrada */
try{if(FBMODE&&localStorage.getItem('cse-acesso')==='1')ACESSO.login=true}catch(e){}
function acessoOn(){return FBMODE?ACESSO.login:!!(GST.acesso&&GST.acesso.login===true)}
var AUTH_USER=false,GATE_ON=false;
function autenticado(){return AUTH_USER||ACC.kind==='claude'||GESTOR===true||GESTOR==='demo'}
function gateHTML(){
  return '<div class="acgate" id="acGate" role="dialog" aria-modal="true" aria-labelledby="acGateT" hidden>'+
    '<div class="acgate-card"><span class="acgate-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg></span>'+
    '<h2 id="acGateT">Entre para consultar</h2>'+
    '<p class="muted">A gestão pediu que o mapa, os trajetos e as fotos só apareçam para quem entrou com uma conta.</p>'+
    (FB_ON?'<div class="acgate-b"><button type="button" class="lg-btn pri" data-goo>Entrar com Google</button><button type="button" class="lg-btn sec" data-mail>Entrar com e-mail</button></div>'
          :'<p class="muted small keep">Abra o app pelo site publicado ou pelo claude.ai para entrar com sua conta.</p>')+
    '</div></div>';
}
function gateUpdate(){
  var on=acessoOn(),need=on&&AUTH_READY&&!autenticado(),r=document.documentElement;
  r.classList.toggle('gated',need);r.classList.toggle('prot',on);
  var g=$('#acGate');
  if(need&&!g){document.body.insertAdjacentHTML('beforeend',gateHTML());g=$('#acGate')}
  if(g)g.hidden=!need;
  if(need)r.style.overflow='hidden';
  else if(GATE_ON&&cover.hidden&&login.hidden&&cfgM.hidden&&glM.hidden&&(!gestM||gestM.hidden))r.style.overflow='';
  GATE_ON=need;
}
/* o Firebase avisa quando há conta entrada (ou nenhuma) e quando a gestão muda a regra */
aoFazer('Firebase conectado',function(fb){
  fb.db.doc('meta/acesso').onSnapshot(function(s){
    ACESSO.login=!!(s.exists&&(s.data()||{}).login===true);
    try{localStorage.setItem('cse-acesso',ACESSO.login?'1':'0')}catch(e){}
    gateUpdate();if(gestM&&!gestM.hidden&&gTab==='geral')renderGest();
  },function(){gateUpdate()});
  fb.auth.onAuthStateChanged(function(u){AUTH_USER=!!u;AUTH_READY=true;gateUpdate()});
});
if(FBMODE&&!FB_ON)AUTH_READY=true;
aoFazer('tudo reconstruído',function(){gateUpdate()});
/* com a regra ligada: sem clique direito nem arrastar em imagens, mapa e fotos (só desanima; print de tela continua possível) */
document.addEventListener('contextmenu',function(e){if(!acessoOn())return;var t=e.target;if(t&&t.closest&&t.closest('img,svg,canvas,.mapwrap,.planwrap,.cvdet,.cv-map,.lg-bg'))e.preventDefault()});
document.addEventListener('dragstart',function(e){if(acessoOn()&&e.target&&e.target.tagName==='IMG')e.preventDefault()});
/* gestão › Visão geral: o interruptor (só quem tem o privilégio de administradores) */
function acessoCard(){
  if(!gcan('admins'))return '';
  return '<h3 class="gh">Acesso ao app</h3><div class="tgls">'+
    tg('gAcessoLogin',acessoOn(),'Exigir login para consultar','Quem não entrou com Google ou e-mail não vê o mapa, os trajetos nem as fotos. Também bloqueia clique direito e arrastar nas imagens.')+
    '</div><p class="muted small keep">'+(FBMODE?'Vale para todos os aparelhos. Os dados do Firebase só ficam protegidos de verdade depois de publicar as regras novas (arquivo firestore.rules).':'Modo demonstração: vale só para este aparelho.')+'</p>';
}
document.addEventListener('change',function(e){
  if(!e.target||e.target.id!=='gAcessoLogin')return;
  var v=e.target.checked,box=e.target;
  var volta=function(err){box.checked=!v;
    var neg=err&&(err.code==='permission-denied'||/permission/i.test(String(err.message||'')));
    gToast(neg?'O Firebase recusou. Publique o firestore.rules novo (ele libera meta/acesso) e confira se seu e-mail está em gestores, sem o campo perms.':'Não deu para salvar agora. Confira a conexão e tente de novo.',1)};
  if(FBMODE){
    if(!SH.db){volta();return}
    SH.db.doc('meta/acesso').set({login:v,ts:Date.now(),by:SH.uid||''}).then(function(){gToast(v?'Login obrigatório ligado.':'Login obrigatório desligado.')},volta);
  }else{
    saveG('acesso',{login:v}).then(function(){gateUpdate()});
  }
});
gateUpdate();
/* ======================= v12: mapa claro no tema claro ======================= */
function mapThemeSync(light){
  var suf=light?'-claro':'';if(suf===MAPSUF)return;MAPSUF=suf;
  var oldVec=MAPVEC;
  MAPIMG=mapaUrl('mapa-bordas'+suf+MAPEXT);MAPHD=window.MAPHD_URL=mapaUrl('mapa-campus'+suf+MAPEXT);MAPVEC=mapaUrl('mapa-campus'+suf+'.svg');MAPMINI=mapaUrl('mapa-mini'+suf+MAPEXT);MAPBLUR=mapaUrl('mapa-blur'+suf+MAPEXT);
  var im=document.querySelector('#baseimg image');if(im)im.setAttribute('href',MAPIMG);
  var hd=$('#imgHD');if(hd)hd.setAttribute('href',MAPHD);
  var vc=$('#imgVec');if(vc&&vc.getAttribute('href')===oldVec)vc.setAttribute('href',MAPVEC);
  var pk=document.querySelector('#pkMap image');if(pk)pk.setAttribute('href',MAPHD);
  var r=document.documentElement;r.style.setProperty('--bgmap-sw','url('+MAPMINI+')');if(CFG.bg==='mapa')r.style.setProperty('--bgmap','url('+MAPBLUR+')');
  r.classList.toggle('mapclaro',!!light);
}
document.documentElement.classList.toggle('mapclaro',MAPSUF==='-claro');
/* v14: horário em faixa de 10 min passa a ser o padrão */
if(CFG.faixaV!==1){CFG.faixa=10;CFG.faixaV=1;try{saveCfg()}catch(e){}}
/* v14: modo simplificado ligado por padrão */
if(CFG.simplesV!==1){CFG.simples=true;CFG.simplesV=1;try{saveCfg()}catch(e){}applySimples()}
renderAll();
/* ======================= v13: Wi-Fi em Lugares, balão no mapa e Volta à noite visível ======================= */
var WSEL=null;
function wScale(id){var m=mine[id],h='';for(var i=1;i<=5;i++)h+='<button type="button" data-wrate="'+i+'" data-wid="'+id+'" aria-pressed="'+(m===i)+'" aria-label="Nota '+i+' de 5">'+i+'</button>';
  return '<div class="scale wscale" role="group" aria-label="Nota do sinal">'+h+'</div><div class="ends"><span>Fraco</span><span>Forte</span></div>'}
function pWifiHTML(){
  var ids=Object.keys(WIFI).sort(function(a,b){return avgOf(b)-avgOf(a)});
  return '<div><p class="eyebrow">Lugares</p><h2>Wi-Fi</h2></div>'+
    '<p class="muted small">Redes abertas do campus, com a nota dos alunos. Toque numa rede para dar sua nota ou ver no mapa.</p>'+
    '<div class="list wlist">'+ids.map(function(id){var w=WIFI[id],a=avgOf(id),q=info(a),open=WSEL===id;
      return '<div class="wrow'+(open?' open':'')+'" id="wrow-'+id+'"><button class="item tint wsel" type="button" data-wsel="'+id+'" aria-expanded="'+open+'" style="--c:var(--good)">'+barsSvg(q.bars,24,20)+
        '<span class="grow">'+esc(w.name)+'<small>'+esc(w.ssid||'Rede aberta')+' · '+q.label+'</small></span><span class="mono wnota">'+br(a)+'</span></button>'+
        (open?'<div class="wbody"><dl class="kv"><dt>Rede</dt><dd>'+esc(w.ssid||'Nome a confirmar no local')+'</dd><dt>Acesso</dt><dd>'+esc(w.acesso||'Sem senha')+'</dd><dt>Dica</dt><dd>'+esc(w.note||'—')+'</dd><dt>Nota</dt><dd>'+br(a)+' de 5 · '+votesOf(id)+' avaliações</dd></dl>'+
          (PERFIL?'<p><b>Como está o sinal aqui agora?</b></p>'+wScale(id):needProfileHTML('dar nota ao sinal'))+
          '<div class="gbtns"><button type="button" class="copy" data-wmap="'+id+'">Ver no mapa</button></div></div>':'')+'</div>'}).join('')+'</div>'+
    '<div class="educard"><div class="educard-t"><span class="lb" style="--c:var(--good)">edu</span><span class="grow"><b>eduroam</b><small class="keep">Wi-Fi seguro das universidades, com o login da UFRJ</small></span></div>'+
    (EDUC.open?eduCfgHTML(false):'<div class="row"><button type="button" class="copy primary" data-educfg>Configurar eduroam</button><button type="button" class="linkbtn" data-wedu>Ver tutorial</button></div>')+'</div>';
}
function renderWifiPane(){var el=$('#pWifi');if(el&&!pPane.hidden)el.innerHTML=pWifiHTML()}
/* "Onde fica e quando abre" vira uma seção recolhível, fechada por padrão */
pstate.hrsOpen=(function(){try{return localStorage.getItem('cse-fold-hrs')==='1'}catch(e){return false}})();
pPane.addEventListener('toggle',function(e){var d=e.target;if(!d||d.id!=='fdHrs'||pstate.hrsOpen===d.open)return;
  pstate.hrsOpen=d.open;try{localStorage.setItem('cse-fold-hrs',d.open?'1':'0')}catch(x){}
  if(d.open){var b=d.querySelector('.fold-b');if(b&&!b.firstChild){pH.innerHTML=hoursHTML(nowMin());var s2=$('#fdHrs summary');if(s2)s2.focus({preventScroll:true})}}},true);
/* balão no mapa ao tocar num ícone de Wi-Fi */
function wifiPopClose(){var p=$('#wPop');if(p)p.remove()}
function wifiPopHTML(id){
  var w=WIFI[id],a=avgOf(id),q=info(a);
  return '<button type="button" class="wpop-x" data-wpopx aria-label="Fechar">×</button>'+
    '<div class="wpop-h">'+barsSvg(q.bars,26,22)+'<span><b>'+esc(w.name)+'</b><small>'+br(a)+' de 5 · '+votesOf(id)+' avaliações · '+q.label+'</small></span></div>'+
    (PERFIL?'<p class="wpop-q">Como está o sinal agora?</p>'+wScale(id)+(mine[id]?'<p class="wpop-ok">Sua nota: '+mine[id]+'</p>':'')
      :'<button type="button" class="copy" data-needprof>Criar perfil para dar nota</button>')+
    '<button type="button" class="linkbtn" data-wmore="'+id+'">Mais sobre esta rede</button>';
}
function wifiPop(id){
  if(!WIFI[id])return;var mw=document.querySelector('.mapwrap');if(!mw)return;
  var mk=svg.querySelector('.mk.wifi[data-id="'+id+'"]');if(!mk){wifiPopClose();return}
  var p=$('#wPop');if(!p){mw.insertAdjacentHTML('beforeend','<div class="wpop" id="wPop" role="dialog" aria-label="Rede Wi-Fi"></div>');p=$('#wPop')}
  p.dataset.id=id;p.innerHTML=wifiPopHTML(id);
  var r=mk.getBoundingClientRect(),R=mw.getBoundingClientRect(),pw=p.offsetWidth,ph=p.offsetHeight;
  var x=r.left+r.width/2-R.left,y=r.top-R.top;
  x=Math.max(pw/2+8,Math.min(R.width-pw/2-8,x));
  var below=y-ph-14<8;p.classList.toggle('below',below);
  p.style.left=x+'px';p.style.top=(below?r.bottom-R.top+14:y-14)+'px';
  var f=p.querySelector('[data-wrate],[data-needprof]');if(f)f.focus({preventScroll:true});
}
svg.addEventListener('click',function(e){
  if(suppressClick)return;
  var g=e.target.closest&&e.target.closest('.mk.wifi');
  if(g)setTimeout(function(){wifiPop(g.dataset.id)},0);else wifiPopClose();
},true);
svg.addEventListener('pointerdown',function(e){if(!(e.target.closest&&e.target.closest('.mk.wifi')))wifiPopClose()},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')wifiPopClose()});
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-wrate],[data-wsel],[data-wmap],[data-wmore],[data-wedu],[data-wpopx],[data-nightoff]');if(!t)return;
  if(t.dataset.wpopx!==undefined){wifiPopClose();return}
  if(t.dataset.nightoff!==undefined){state.sel=null;renderAll();return}
  if(t.dataset.wedu!==undefined){setTab('trajeto');select('guide','eduroam',true);return}
  if(t.dataset.wsel){WSEL=WSEL===t.dataset.wsel?null:t.dataset.wsel;renderWifiPane();var b=$('#pWifi [data-wsel="'+t.dataset.wsel+'"]');if(b)b.focus({preventScroll:true});return}
  if(t.dataset.wrate){
    var id=t.dataset.wid,n=+t.dataset.wrate;if(!PERFIL||!WIFI[id])return;
    mine[id]=n;saveMine();writeVotes();drawShared();updateMap();
    if(state.sel&&state.sel.kind==='wifi'&&state.sel.id===id)renderDetail();
    renderWifiPane();if($('#wPop'))wifiPop(id);
    gToast('Obrigado! Sua nota para '+WIFI[id].name+': '+n+'.');return}
  if(t.dataset.wmap){var wid=t.dataset.wmap;
    if(!state.layers.wifi){var c=$('#chWifi');if(c)setLayer('wifi',c)}
    select('wifi',wid,false);scrollToMap();setTimeout(function(){wifiPop(wid)},450);return}
  if(t.dataset.wmore){var wm=t.dataset.wmore;wifiPopClose();WSEL=wm;setTab('predios');try{history.replaceState(null,'','#predios')}catch(x){}
    setTimeout(function(){var r=$('#wrow-'+wm);if(r)r.scrollIntoView({behavior:'smooth',block:'center'})},60)}
});
/* Volta à noite: a lua aparece no mapa, o mapa escurece e o painel vem para a tela */
function nightBadge(){
  var on=!!state.sel&&(state.sel.kind==='night'||state.sel.kind==='guard'),mw=document.querySelector('.mapwrap');if(!mw)return;
  mw.classList.toggle('noite',on);var b=$('#nightBadge');
  if(on&&!b)mw.insertAdjacentHTML('beforeend','<div class="nightbadge" id="nightBadge" role="status">'+MOON+'<span>Volta à noite</span><button type="button" data-nightoff>Sair</button></div>');
  else if(!on&&b)b.remove();
}
aoFazer('mapa atualizado',nightBadge);
wifiChip();
/* ======================= v16: tela cheia no primeiro toque ======================= */
var FSE=document.documentElement;
function fsOk(){return !!(FSE.requestFullscreen||FSE.webkitRequestFullscreen)}
function fsOn(){return !!(document.fullscreenElement||document.webkitFullscreenElement)}
function fsWanted(){return typeof CFG.telaCheia==='boolean'?CFG.telaCheia:window.matchMedia('(pointer:coarse)').matches}
function fsEnter(){
  if(!fsOk()||fsOn())return;
  try{var r=(FSE.requestFullscreen||FSE.webkitRequestFullscreen).call(FSE,{navigationUI:'hide'});if(r&&r.catch)r.catch(function(){})}catch(e){}
}
function fsExit(){try{var f=document.exitFullscreen||document.webkitExitFullscreen;if(f){var r=f.call(document);if(r&&r.catch)r.catch(function(){})}}catch(e){}}
function fsCfgHTML(){
  if(!fsOk())return '<div class="faixa-w"><p class="balvo-t"><b>Tela cheia</b></p><p class="muted small">Este navegador não deixa o site abrir em tela cheia. No iPhone, use Compartilhar › Adicionar à Tela de Início: o app abre sem a barra de endereço.</p></div>';
  return tg('cfgTelaCheia',fsWanted(),'Abrir em tela cheia','No primeiro toque em cada visita, o app esconde a barra de endereço. O navegador exige esse toque; não dá para ser antes. Sai com o gesto de voltar ou Esc.')+
    '<div class="faixa-w"><button type="button" class="fs-btn" id="fsNow">'+(fsOn()?'Sair da tela cheia':'Entrar em tela cheia agora')+'</button></div>';
}
var fsTried=false;
function fsFirstTap(){
  if(fsTried)return;fsTried=true;
  document.removeEventListener('click',fsFirstTap,true);document.removeEventListener('touchend',fsFirstTap,true);
  if(fsWanted())fsEnter();
}
document.addEventListener('click',fsFirstTap,true);
document.addEventListener('touchend',fsFirstTap,true);
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('#fsNow');if(!b)return;
  fsTried=true;if(fsOn())fsExit();else fsEnter();
});
function fsLabel(){var b=document.getElementById('fsNow');if(b)b.textContent=fsOn()?'Sair da tela cheia':'Entrar em tela cheia agora'}
document.addEventListener('fullscreenchange',fsLabel);document.addEventListener('webkitfullscreenchange',fsLabel);
