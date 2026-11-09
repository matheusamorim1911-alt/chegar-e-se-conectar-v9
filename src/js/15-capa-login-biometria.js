/* ---------- desempenho: pausa a animação das rotas quando ninguém está vendo ---------- */
(function(){
  var mw=document.querySelector('.mapwrap'),vis=true;
  function sync(){
    var ov=['#cover','#login','#pane-cfg','#glossM','#gestM','#reqM'].some(function(s){var e=$(s);return e&&!e.hidden});
    svg.classList.toggle('paused',!vis||ov||document.hidden);
  }
  if(mw&&'IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;sync()},{rootMargin:'80px'}).observe(mw);
  document.addEventListener('visibilitychange',sync);
  if('MutationObserver' in window){var mo=new MutationObserver(sync);['#cover','#login','#pane-cfg','#glossM'].forEach(function(s){var e=$(s);if(e)mo.observe(e,{attributes:true,attributeFilter:['hidden']})})}
  sync();
  /* HD em telas de alta densidade: baixa depois que a página assentou */
  var idle=window.requestIdleCallback||function(f){return setTimeout(f,1500)};
  if(!LITE)idle(function(){applyView()},{timeout:3000});
})();
drawBanner();
/* ---------- modo enxuto: menos texto na tela (detalhes ficam em 'Sobre' e na legenda) ---------- */
document.documentElement.dataset.density='compact';
$('#legBtn').addEventListener('click',function(){var l=$('#legend'),o=!l.classList.contains('open');l.classList.toggle('open',o);this.setAttribute('aria-expanded',String(o))});
/* ---------- capa translúcida ---------- */
var cover=$('#cover');
function coverToday(){
  var el=$('#cvToday'),t=today0(),m=mudancas().filter(function(x){var n=dDiff(dParse(x.d),t);return n>=0&&n<=7})[0];
  if(m&&CFG.coverToday){var n=dDiff(dParse(m.d),t);el.textContent=(n===0?'Hoje':n===1?'Amanhã':dTxt(m.d))+': '+(MUD_K[m.k]||'Mudança').toLowerCase()+' · '+m.t;el.hidden=false}else el.hidden=true;
}
function placeCoverMap(){
  var m=$('#cvMap'),pin=$('#cvPin');if(!m||!window.MAPHD_URL)return;
  var W=m.clientWidth,H=m.clientHeight,sh=document.querySelector('.cv-sheet'),sheetH=sh?sh.offsetHeight:0,wide=W>=700;
  var st=cover.dataset.style||'folha';
  var visH=st!=='folha'?H:(wide?H-sheetH-28:H-sheetH+30);
  // mapa nítido (campus) sobre o mapa estendido (bordas prolongadas), que garante tela cheia
  var s=wide?Math.max(1.2*W/1233,H/1300*1.02):Math.max(H/1300*1.02,visH/701*1.35,W/1233*2.4);
  var tx=814,ty=412,ox=W/2-tx*s,oy=visH*0.45-ty*s;
  var ex=-270,ey=-340,ew=2034*s,eh=1300*s;
  ox=Math.min(-ex*s,Math.max(W-(ex+2034)*s,ox));oy=Math.min(-ey*s,Math.max(H-(ey+1300)*s,oy));
  m.style.backgroundImage='url('+window.MAPHD_URL+'),url('+MAPIMG+')';
  m.style.backgroundSize=(1233*s)+'px '+(701*s)+'px,'+ew+'px '+eh+'px';
  m.style.backgroundPosition=(ox+109*s)+'px '+(oy+(-45)*s)+'px,'+(ox+ex*s)+'px '+(oy+ey*s)+'px';
  pin.style.left=(ox+tx*s)+'px';pin.style.top=(oy+ty*s)+'px';
}
window.addEventListener('resize',function(){if(!cover.hidden)placeCoverMap()});
function cvEnter(){cover.classList.remove('enter','pre');void cover.offsetWidth;cover.classList.add('enter')}
function openCover(){coverToday();cover.hidden=false;cover.classList.remove('closing');placeCoverMap();cvEnter();document.documentElement.style.overflow='hidden';var b=cover.querySelector('.cv-btn.main');if(b)b.focus({preventScroll:true})}
function closeCover(then){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  cover.classList.add('closing');
  setTimeout(function(){cover.hidden=true;cover.classList.remove('enter');cover.classList.add('pre');document.documentElement.style.overflow='';if(then)then()},rm?0:420);
}
cover.addEventListener('click',function(e){
  var b=e.target.closest('[data-cv]');
  if(!b&&e.target.closest('a,button,input,select,textarea,summary,label,[role="button"]'))return;
  var a=b?b.dataset.cv:'mapa';
  closeCover(function(){
    if(a==='trajeto'){setTab('trajeto');try{history.replaceState(null,'','#trajeto')}catch(err){}var s=$('#to');if(s){s.scrollIntoView({block:'center'});s.focus()}}
    else if(a==='grade'||a==='cal'){setTab(a);try{history.replaceState(null,'','#'+a)}catch(err){}var pn=$('#pane-'+a);if(pn)pn.scrollIntoView({block:'start'})}
    else if(a==='noite'){openNight()}
    else{var mc=document.querySelector('.mapcard');if(mc)mc.scrollIntoView({block:'start'})}
    if(a!=='trajeto'&&a!=='noite'){var t=$('#tab-'+(a==='mapa'?'trajeto':a));if(a==='mapa'){var z=$('#zin');if(z)z.focus({preventScroll:true})}else if(t)t.focus({preventScroll:true})}
  });
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!cover.hidden&&login.hidden)closeCover()});
$('#showCover').addEventListener('click',openCover);$('#coverBtn').addEventListener('click',openCover);
applyCoverStyle();applyBg();
if(CFG.cover==='none'){cover.hidden=true}else{coverToday();placeCoverMap();document.documentElement.style.overflow='hidden';}
/* ---------- login: perfil salvo (protótipo; guardado só neste aparelho) ---------- */
var PERFIL=null;try{PERFIL=JSON.parse(localStorage.getItem('cse-perfil'))}catch(e){}
if(PERFIL&&!PERFIL.name)PERFIL=null;
function pinHash(s){var x=5381;for(var i=0;i<s.length;i++)x=((x<<5)+x+s.charCodeAt(i))|0;return 'h'+(x>>>0).toString(36)}
function savePerfil(){try{if(PERFIL)localStorage.setItem('cse-perfil',JSON.stringify(PERFIL));else localStorage.removeItem('cse-perfil')}catch(e){}document.documentElement.classList.toggle('noprof',!PERFIL);setTimeout(paintFaces,0)}
document.documentElement.classList.toggle('noprof',!PERFIL);
var login=$('#login');
function lgShow(which){
  var m=$('#lgMail');if(m)m.hidden=which!=='mail';
  if(which==='mail'){/* entrar com e-mail e senha */
    $('#lgSaved').hidden=true;$('#lgNew').hidden=true;mailMode(MAIL.mode);
    setTimeout(function(){var f=MAIL.mode==='up'?$('#lgMailNome'):$('#lgMailEmail');if(f)f.focus({preventScroll:true})},50);
    return;
  }
  $('#lgSaved').hidden=which!=='saved';$('#lgNew').hidden=which!=='new';
  if(which==='saved'){$('#lgInit').textContent=PERFIL.name.charAt(0).toUpperCase();$('#lgName').textContent=PERFIL.name;
    lgBioState();$('#lgPinForm').hidden=true;$('#lgUsePin').hidden=!PERFIL.pin;$('#lgPin').value='';$('#lgPinErr').textContent='';
    setTimeout(function(){$('#lgBio').focus({preventScroll:true})},50);paintFaces()}
  else{$('#lgNewErr').textContent='';bioCheck().then(function(v){$('#lgNewBioW').hidden=!v});setTimeout(function(){$('#lgNewName').focus({preventScroll:true})},50)}
}
function openLogin(){
  var bg=login.querySelector('.lg-bg');if(bg&&window.MAPHD_URL)bg.style.backgroundImage='url('+window.MAPHD_URL+')';
  login.hidden=false;login.classList.remove('closing');document.documentElement.style.overflow='hidden';
  lgShow(PERFIL?'saved':'new');
}
function closeLogin(){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;login.classList.add('closing');if(!cover.hidden)setTimeout(cvEnter,rm?0:120);
  setTimeout(function(){login.hidden=true;if(cover.hidden)document.documentElement.style.overflow='';else{var b=cover.querySelector('.cv-btn.main');if(b)b.focus({preventScroll:true})}},rm?0:300);
  if(!$('#pane-cfg').hidden)renderCfg();setTimeout(function(){refreshAll();if(!pPane.hidden)renderPredios()},0);}
$('#lgBio').addEventListener('click',function(){bioLogin()});
$('#lgUsePin').addEventListener('click',function(){this.hidden=true;$('#lgPinForm').hidden=false;$('#lgPin').focus()});
$('#lgPinForm').addEventListener('submit',function(e){e.preventDefault();
  if(pinHash($('#lgPin').value)===PERFIL.pin)closeLogin();else{$('#lgPinErr').textContent='Código errado. Tente de novo.';$('#lgPin').value='';$('#lgPin').focus()}});
$('#lgSwitch').addEventListener('click',function(){PERFIL=null;savePerfil();lgShow('new')});
$('#lgNew').addEventListener('submit',function(e){e.preventDefault();
  var n=$('#lgNewName').value.trim(),pn=$('#lgNewPin').value.trim(),er=$('#lgNewErr');
  if(!n){er.textContent='Escreva um nome.';$('#lgNewName').focus();return}
  if(pn&&!/^\d{4}$/.test(pn)){er.textContent='O código precisa ter 4 números.';$('#lgNewPin').focus();return}
  PERFIL={name:n.slice(0,24),pin:pn?pinHash(pn):null};savePerfil();
  var wantBio=!$('#lgNewBioW').hidden&&$('#lgNewBio').checked,go=$('#lgNewGo');
  if(!wantBio){lgShow('saved');$('#lgHint').textContent='Perfil criado. Toque para entrar.';return}
  go.disabled=true;go.textContent='Confirme no aparelho…';er.textContent='';
  bioCreate(PERFIL.name).then(function(bio){PERFIL.bio=bio;savePerfil();go.disabled=false;go.textContent='Criar perfil e entrar';lgShow('saved');$('#lgHint').textContent='Perfil criado com biometria. Toque para entrar.'},
    function(err){go.disabled=false;go.textContent='Criar perfil e entrar';lgShow('saved');$('#lgHint').textContent='Perfil criado sem biometria. '+bioErrMsg(err)});
});
$('#lgSkip').addEventListener('click',closeLogin);
/* sair: fecha a sessão (e a conta Google ou de e-mail, no site) e volta para a tela de entrada; o perfil continua salvo */
function logoutAll(){
  var go=function(){if(!cfgM.hidden)renderCfg();openLogin();gToast('Você saiu. Para voltar, entre de novo.')};
  if(FBMODE&&ACC.kind==='google'&&ACC.fb){var keep=PERFIL&&!PERFIL.google?PERFIL:null;if(keep)delete keep.photo;
    ACC.fb.auth.signOut().then(function(){if(PERFIL&&PERFIL.google){PERFIL=keep;savePerfil()}go()},function(){gToast('Não deu para sair da conta agora.',1)});return}
  go();
}
document.addEventListener('click',function(e){
  if(e.target.closest('#cfgLogout')){logoutAll();return}
  if(e.target.closest('#cfgForget')){var fb=FBMODE&&ACC.kind==='google'&&ACC.fb;PERFIL=null;savePerfil();
    (fb?ACC.fb.auth.signOut():Promise.resolve()).then(function(){renderCfg();openLogin();gToast('Perfil apagado deste aparelho.')})}
});
/* ======================= biometria de verdade (WebAuthn) ======================= */
/* Usa o autenticador do próprio aparelho (Face ID, Touch ID, digital, Windows Hello).
   A biometria nunca sai do aparelho: o app só guarda o id da credencial e a chave pública,
   e confere a assinatura de cada entrada com WebCrypto. */
var BIO={avail:null,busy:false};
function b64u(buf){var b=new Uint8Array(buf),s='';for(var i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function ub64u(s){s=String(s).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
function derToRaw(der){/* assinatura ECDSA em DER -> r||s com 32 bytes cada */
  var o=2;if(der[1]&0x80)o=2+(der[1]&0x7f);
  function int(){if(der[o]!==2)throw new Error('der');var l=der[o+1],v=der.slice(o+2,o+2+l);o+=2+l;while(v.length>32&&v[0]===0)v=v.slice(1);var p=new Uint8Array(32);p.set(v,32-v.length);return p}
  var r=int(),s=int(),out=new Uint8Array(64);out.set(r,0);out.set(s,32);return out}
function bioCheck(){
  if(BIO.avail!==null)return Promise.resolve(BIO.avail);
  if(!window.PublicKeyCredential||!window.isSecureContext||!navigator.credentials||!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)return Promise.resolve(BIO.avail=false);
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(function(v){return BIO.avail=!!v},function(){return BIO.avail=false});
}
function bioErrMsg(e){
  var inClaude=!!(window.claude&&typeof window.claude.use==='function'),n=e&&e.name||'';
  if(n==='NotAllowedError')return inClaude?'A biometria foi cancelada ou não está liberada dentro do claude.ai. No site do GitHub ela funciona.':'Biometria cancelada ou não reconhecida.';
  if(n==='SecurityError')return 'A biometria só funciona em endereço seguro (https).';
  if(n==='InvalidStateError')return 'Este aparelho já tem uma biometria cadastrada para este app.';
  if(n==='NotSupportedError')return 'Este aparelho não oferece biometria para sites.';
  return 'Não deu para usar a biometria agora.';
}
function bioCreate(name){
  var ch=crypto.getRandomValues(new Uint8Array(32)),uid=crypto.getRandomValues(new Uint8Array(16));
  return navigator.credentials.create({publicKey:{challenge:ch,rp:{name:'Chega aí UFRJ'},user:{id:uid,name:name,displayName:name},
    pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
    authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged',requireResidentKey:false},
    timeout:60000,attestation:'none'}}).then(function(c){
      var r=c.response,pk=null,alg=-7;
      try{pk=r.getPublicKey?r.getPublicKey():null;alg=r.getPublicKeyAlgorithm?r.getPublicKeyAlgorithm():-7}catch(e){}
      return {id:b64u(c.rawId),pk:pk?b64u(pk):null,alg:alg,ts:Date.now()};
    });
}
function bioVerify(bio){
  var ch=crypto.getRandomValues(new Uint8Array(32));
  return navigator.credentials.get({publicKey:{challenge:ch,allowCredentials:[{type:'public-key',id:ub64u(bio.id),transports:['internal','hybrid']}],userVerification:'required',timeout:60000}}).then(function(a){
    var r=a.response,cd=JSON.parse(new TextDecoder().decode(r.clientDataJSON)),ad=new Uint8Array(r.authenticatorData);
    if(cd.type!=='webauthn.get'||cd.challenge!==b64u(ch)||cd.origin!==location.origin)throw new Error('desafio');
    if(!(ad[32]&0x04))throw new Error('sem verificação do usuário');
    if(!bio.pk)return true;
    var rsa=bio.alg===-257;
    return crypto.subtle.digest('SHA-256',r.clientDataJSON).then(function(h){
      var data=new Uint8Array(ad.length+32);data.set(ad,0);data.set(new Uint8Array(h),ad.length);
      return crypto.subtle.importKey('spki',ub64u(bio.pk),rsa?{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}:{name:'ECDSA',namedCurve:'P-256'},false,['verify']).then(function(k){
        var sig=new Uint8Array(r.signature);if(!rsa)sig=derToRaw(sig);
        return crypto.subtle.verify(rsa?{name:'RSASSA-PKCS1-v1_5'}:{name:'ECDSA',hash:'SHA-256'},k,sig,data)});
    }).then(function(ok){if(!ok)throw new Error('assinatura');return true});
  });
}
/* tela de entrada */
function lgBioState(){
  var b=$('#lgBio'),hint=$('#lgHint'),act=$('#lgBioOn');if(!b||!PERFIL)return;
  b.className='lg-bio'+(PERFIL.bio?'':' nobio');
  b.setAttribute('aria-label',PERFIL.bio?'Entrar com a biometria do aparelho':'Entrar');
  hint.textContent=PERFIL.bio?'Toque para entrar com a biometria do aparelho':'Toque para entrar';
  if(act)bioCheck().then(function(v){act.hidden=!(v&&!PERFIL.bio)});
}
function bioLogin(){
  var b=$('#lgBio');if(BIO.busy||b.classList.contains('ok'))return;
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function ok(){b.classList.remove('scan','fail');b.classList.add('ok');$('#lgHint').textContent='Pronto, '+PERFIL.name+'!';setTimeout(closeLogin,rm?200:550)}
  if(!PERFIL.bio){ok();return}
  BIO.busy=true;b.classList.remove('fail');b.classList.add('scan','wait');$('#lgHint').textContent='Confirme no aparelho…';
  bioVerify(PERFIL.bio).then(function(){BIO.busy=false;b.classList.remove('wait');ok()},function(e){
    BIO.busy=false;b.classList.remove('scan','wait');b.classList.add('fail');
    $('#lgHint').textContent=(e&&e.name?bioErrMsg(e):'Não reconheci.')+(PERFIL.pin?' Você também pode usar o código.':'');
    if(PERFIL.pin)$('#lgUsePin').hidden=false;
  });
}
function bioEnable(btn,done){
  if(!PERFIL)return;btn.disabled=true;var t=btn.textContent;btn.textContent='Confirme no aparelho…';
  bioCreate(PERFIL.name).then(function(bio){PERFIL.bio=bio;savePerfil();btn.disabled=false;btn.textContent=t;gToast('Biometria ativada neste aparelho.');if(done)done(true)},
    function(e){btn.disabled=false;btn.textContent=t;gToast(bioErrMsg(e),1);if(done)done(false)});
}
/* perfil em Ajustes: estado da biometria */
aoFazer('ajustes montados',function(f){var p=document.querySelector('#cfgR .prof');if(!p||!PERFIL||document.getElementById('cfgBioRow'))return;
  p.insertAdjacentHTML('afterend','<div class="biorow" id="cfgBioRow"><span class="grow"><b>Biometria</b><small>'+(PERFIL.bio?'Ativada neste aparelho. O rosto ou a digital nunca saem do celular.':'Desativada. Entre com o rosto ou a digital do aparelho.')+'</small></span>'+
    (PERFIL.bio?'<button type="button" class="copy" id="cfgBioOff">Desativar</button>':'<button type="button" class="copy" id="cfgBioOnBtn" hidden>Ativar</button>')+'</div>');
  if(!PERFIL.bio)bioCheck().then(function(v){var b=$('#cfgBioOnBtn');if(b)b.hidden=!v;if(!v){var s=document.querySelector('#cfgBioRow small');if(s)s.textContent='Este aparelho ou navegador não oferece biometria para sites.'}});
});
document.addEventListener('click',function(e){
  if(e.target.closest('#cfgBioOff')){delete PERFIL.bio;savePerfil();renderCfg();gToast('Biometria desativada neste aparelho.');return}
  var on=e.target.closest('#cfgBioOnBtn');if(on){bioEnable(on,function(){renderCfg()});return}
  var la=e.target.closest('#lgBioOn');if(la){bioEnable(la,function(ok){if(ok)lgBioState()})}
});
/* ======================= só quem tem perfil informa ======================= */
function needProfileHTML(acao){
  return '<div class="needprof"><p class="small"><b>Crie seu perfil para '+acao+'.</b> <span class="aux">Sem perfil, o app só mostra as informações.</span></p><button type="button" class="copy" data-needprof>Criar perfil</button></div>';
}
document.addEventListener('click',function(e){if(e.target.closest('[data-needprof]')){e.preventDefault();openLogin();if(!PERFIL)lgShow('new')}});
refreshAll();
if(CFG.login)openLogin();
if(!cover.hidden&&login.hidden)requestAnimationFrame(function(){cvEnter()});
if('MutationObserver' in window)new MutationObserver(function(){if(login.hidden&&!cover.hidden&&cover.classList.contains('pre'))cvEnter()}).observe(login,{attributes:true,attributeFilter:['hidden']});
setTimeout(function(){if(login.hidden&&!cover.hidden&&cover.classList.contains('pre'))cvEnter()},1500);
$('#rosebox').innerHTML='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,NORTH+ROT)+'</svg>';
/* o mapa base fica sempre sólido (o controle de transparência saiu; no lugar dele fica "Buscar ônibus") */
renderAll();
/* Liquid Glass: brilho segue o ponteiro; refração só em navegadores Chromium */
try{if(LITE===false&&perfEff()==='completo'&&navigator.userAgentData&&navigator.userAgentData.brands&&navigator.userAgentData.brands.some(function(b){return /Chromium/.test(b.brand)}))document.documentElement.classList.add('refract')}catch(e){}
document.addEventListener('pointermove',function(e){
  var el=e.target.closest&&e.target.closest('.chip,.item,.swap,.scale button,.copy,.seg button,.zoomctl button,.cv-btn');
  if(!el)return;var r=el.getBoundingClientRect();
  el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px');
},{passive:true});
/* no toque também: o brilho nasce onde o dedo encosta */
document.addEventListener('pointerdown',function(e){var el=e.target.closest&&e.target.closest('.cv-btn');if(!el)return;var r=el.getBoundingClientRect();
  el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px');
  el.classList.remove('tap');void el.offsetWidth;el.classList.add('tap');setTimeout(function(){el.classList.remove('tap')},650)},{passive:true});
