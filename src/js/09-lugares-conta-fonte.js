/* ======================= Lugares: lista enxuta + planta ======================= */
var LCAT=[['todos','Todos'],['aberto','Abertos agora'],['comida','Alimentação'],['biblio','Bibliotecas'],['atend','Atendimento'],['seg','Segurança']];
var LORD={comida:0,biblio:1,atend:2,seg:3},LNAME={comida:'Alimentação',biblio:'Bibliotecas',atend:'Atendimento',seg:'Segurança'},LMAX=4;
pstate.more=pstate.more||{};
function lugRank(it,now){var s=statusOf(it,now);if(it.wk===null&&!it.fechadoTemp)return 4;return s.c==='good'?0:s.c==='warn'?1:2}
function lugHrs(it,we){return it.wk===null?'Sem horário fixo':rangesTxt(rangesOf(it,we),it.incl)}
function lugDetail(k,now){
  var it=PL[k],goPlan=it.bld&&BLD[it.bld]&&it.b;
  return '<div class="lgd" id="lgd-'+k+'"><dl class="kv"><dt>Onde</dt><dd>'+esc(it.where)+'</dd><dt>Seg. a sex.</dt><dd class="mono">'+rangesTxt(it.wk,it.incl)+'</dd><dt>Fim de semana</dt><dd class="mono">'+rangesTxt(it.we===undefined?'unk':it.we)+'</dd></dl>'+
    (it.fechadoTemp?'<div class="warnbox"><b>Fechado temporariamente</b>Informado pela gestão do app.</div>':'')+
    (it.note?'<p class="small muted keep">'+esc(it.note)+'</p>':'')+
    (RUS.indexOf(k)>=0?'<div class="fila-in lgfila"><p class="small"><b>Fila agora</b></p>'+filaRow(k,now)+'</div>':'')+
    '<div class="later">'+(goPlan?'<button class="copy" type="button" data-goplan="'+k+'">Ver na planta</button>':'')+(it.p&&!it.bld?'<button class="copy" type="button" data-showmap="'+k+'">Ver no mapa</button>':'')+
    '<button type="button" class="linkbtn sugg" data-req="servico||'+esc(it.name)+'">Sugerir correção</button></div></div>';
}
function lugRow(k,now,we){
  var it=PL[k],open=pstate.pl===k&&pstate.open;
  return '<div class="lgi'+(open?' open':'')+'"><button class="lgrow" type="button" data-lgo="'+k+'" aria-expanded="'+open+'"><span class="grow"><b>'+esc(it.name)+'</b><small>'+esc(it.s&&it.bld?it.where:it.where)+'</small></span><span class="lgr"><span class="mono lgh2">'+lugHrs(it,we)+'</span>'+pill(statusOf(it,now))+(RUS.indexOf(k)>=0&&filaOf(k)?filaPill(k):'')+'</span></button>'+(open?lugDetail(k,now):'')+'</div>';
}
/* lista de lugares com horário, busca e filtros (fica dentro da dobra "Onde fica e quando abre") */
function hoursListHTML(now){
  if(!LCAT.some(function(c){return c[0]===pstate.cat}))pstate.cat='todos';
  var q=glFold(pstate.q.trim()),we=isWeekend()&&!state.manual;
  var all=Object.keys(PL).filter(function(k){var it=PL[k];return LORD[it.cat]!==undefined&&!it.line});
  var nOpen=all.filter(function(k){return statusOf(PL[k],now).c==='good'}).length,nSoon=all.filter(function(k){return /Fecha em|Última em/.test(statusOf(PL[k],now).t)}).length;
  var list=all.filter(function(k){var it=PL[k],s=statusOf(it,now);
    if(pstate.cat==='aberto'){if(s.c==='bad'||it.wk===null||/Confirmar/.test(s.t))return false}
    else if(pstate.cat!=='todos'&&it.cat!==pstate.cat)return false;
    return !q||glFold(it.name+' '+(it.s||'')+' '+it.where).indexOf(q)>=0});
  list.sort(function(a,b){return LORD[PL[a].cat]-LORD[PL[b].cat]||lugRank(PL[a],now)-lugRank(PL[b],now)||PL[a].name.localeCompare(PL[b].name,'pt')});
  var groups={};list.forEach(function(k){(groups[PL[k].cat]=groups[PL[k].cat]||[]).push(k)});
  var cut=!q&&pstate.cat==='todos',out='';
  Object.keys(LORD).forEach(function(c){var g=groups[c];if(!g)return;
    var show=cut&&!pstate.more[c]&&g.length>LMAX+1?g.slice(0,LMAX):g;
    if(pstate.pl&&g.indexOf(pstate.pl)>=0&&show.indexOf(pstate.pl)<0)show=show.concat([pstate.pl]);
    out+='<div class="lgg"><h3 class="lgt">'+LNAME[c]+' <span class="muted">'+g.length+'</span></h3>'+show.map(function(k){return lugRow(k,now,we)}).join('')+
      (show.length<g.length?'<button type="button" class="linkbtn lgmore" data-lgmore="'+c+'">Ver mais '+(g.length-show.length)+'</button>':'')+'</div>'});
  return '<label class="fld"><span class="sr">Buscar local</span><input type="search" id="hq" placeholder="Buscar local, sala ou bloco" value="'+esc(pstate.q)+'"></label>'+
    '<div class="chips lgchips" role="group" aria-label="Filtrar">'+LCAT.map(function(c){return '<button class="chip" type="button" data-cat="'+c[0]+'" aria-pressed="'+(pstate.cat===c[0])+'">'+c[1]+(c[0]==='aberto'?' <span class="cnum">'+nOpen+'</span>':'')+'</button>'}).join('')+'</div>'+
    (nSoon?'<p class="small lgsoon"><i class="pin-dot warn"></i>'+nSoon+(nSoon>1?' locais fecham':' local fecha')+' em até 30 min</p>':'')+
    '<div class="lglist">'+(out||'<p class="muted">Nada encontrado. Tente outra palavra.</p>')+'</div>'+
    '<p class="muted small keep">Horários de dias úteis informados pela UFRJ; em férias e feriados podem mudar. Os horários dos ônibus estão na aba Trajetos.</p>';
}function saveFolds(){try{localStorage.setItem('cse-folds',JSON.stringify({f:!!pstate.filaBox,b:!!pstate.bldOpen}))}catch(e){}}
(function(){try{var o=JSON.parse(localStorage.getItem('cse-folds'))||{};pstate.filaBox=!!o.f;pstate.bldOpen=!!o.b}catch(e){}})();
function filaResumo(){
  var known=RUS.map(function(k){return [k,filaOf(k)]}).filter(function(x){return x[1]});
  if(!known.length)return '<span class="fsum muted">Ninguém informou nos últimos 45 min</span>';
  known.sort(function(a,b){return b[1].n-a[1].n});
  return '<span class="fsum">'+known.slice(0,2).map(function(x){var L=FILA_N[x[1].n];return '<span class="fdot '+L[2]+'"></span>'+esc(PL[x[0]].name)+': '+(x[1].n?L[0].toLowerCase():'sem fila')}).join(' · ')+(known.length>2?' · +'+(known.length-2):'')+'</span>';
}
function filaBody(){
  var now=nowMin(),why='';
  if(SH.on&&blocked(SH.uid))why='Sua conta não pode informar filas no momento (decisão da gestão).';
  else if(SH.on&&FBMODE&&SH.full&&GESTOR!==true)why=fullMsg('informar a fila');
  else if(SH.on&&(SH.denied||SH.write===false))why=FBMODE?'Você pode ver as filas. Para informar, toque em Informar e entre com sua conta.':'Você pode ver as filas. Para informar, o dono da página precisa te dar acesso de colaborador.';
  if(!PERFIL)return '<div class="filabox flat" id="filabox"><div class="fila-l">'+RUS.map(function(k){return filaRow(k,now)}).join('')+'</div><div class="row bdj-row">'+bandejaLinkHTML()+'</div>'+needProfileHTML('informar a fila')+'</div>';
  return '<div class="filabox flat" id="filabox"><div class="fila-l">'+RUS.map(function(k){return filaRow(k,now)}).join('')+'</div><div class="row bdj-row">'+bandejaLinkHTML()+'</div>'+
    (filaMsg?'<p class="small fila-ok" role="status">'+esc(filaMsg)+'</p>':'')+
    '<p class="muted small keep">'+(why||'Está na fila? Toque em Informar e escolha o tamanho. Seu nome não aparece, e os avisos mais recentes pesam mais.')+'</p></div>';
}
function foldHTML(id,open,title,sub,body){
  return '<details class="fold" id="'+id+'"'+(open?' open':'')+'><summary><span class="fold-t"><b>'+title+'</b>'+sub+'</span><span class="fold-c" aria-hidden="true"></span></summary><div class="fold-b">'+body+'</div></details>';
}
function bldInner(now){
  var extra=[];(GST.plantas.items||[]).forEach(function(p){if(!BLD[p.bld]&&extra.indexOf(p.bld)<0)extra.push(p.bld)});
  if(!BLD[pstate.bld]&&extra.indexOf(pstate.bld)<0)pstate.bld='ct';
  var chips='<div class="chips" role="group" aria-label="Escolha o prédio">'+Object.keys(BLD).concat(extra).map(function(k){var nm=BLD[k]?BLD[k].short:plantName(plantasDe(k)[0]);return '<button class="chip" type="button" data-bld="'+esc(k)+'" aria-pressed="'+(k===pstate.bld)+'">'+esc(nm)+'</button>'}).join('')+'</div>';
  var head=chips;
  if(!BLD[pstate.bld])return head+'<p class="small"><b>'+esc(plantName(plantasDe(pstate.bld)[0]))+'</b></p>'+plantasHTML(pstate.bld);
  var B=BLD[pstate.bld],sel=PL[pstate.pl]&&PL[pstate.pl].bld===pstate.bld&&PL[pstate.pl].b?pstate.pl:null;
  if(pstate.bld==='ct'){
    if(!CTP)return head+'<p class="muted small">Carregando a planta do CT…</p>';/* a parte da planta (21) ainda não carregou */
    /* no CT, a planta real substitui o esquema de exemplo; uma sala escolhida em outro lugar (glossário, grade) abre no bloco e andar dela */
    var P=PL[pstate.pl];if(pstate.pl!==CTP.lastPl){CTP.lastPl=pstate.pl;if(P&&P.bld==='ct'){if(P.b)CTP.bl=P.b;if(P.f!=null)CTP.pav=P.f<=0?'subsolo':'pav'+P.f;CTP.f={biblio:'estudo',aula:'aula',wc:'wc',lab:'lab'}[P.cat]||'';CTP.vb=null;CTP.sel=null}}
    if(CTP.d&&CTP.bl&&!CTP.d.salas.some(function(s){return s[0]===CTP.bl})){var alt=CTP.d.salas.filter(function(s){return s[0].indexOf(CTP.bl)>=0})[0];CTP.bl=alt?alt[0]:''}
    return head+'<p class="small"><b>'+B.name+'</b> · <span class="muted">'+B.addr+'</span></p>'+plantasHTML('ct')+ctpHTML();
  }
  return head+'<p class="small"><b>'+B.name+'</b> · <span class="muted">'+B.addr+'</span></p>'+plantasHTML(pstate.bld)+planHTML(sel)+
    '<details class="det lgabout"><summary>Sobre este esquema</summary><p class="muted small keep">'+B.note+' Planta ilustrativa: a UFRJ não publica as plantas dos prédios. Bloco, andar e número da sala são oficiais; a posição exata da sala no corredor é aproximada. Quando a fonte só dá a sala, o andar sai do número (sala 527 → 5º andar).</p></details>';
};
pPane.addEventListener('toggle',function(e){var d=e.target;if(!d||!d.classList||!d.classList.contains('fold'))return;
  var was=d.id==='fdFila'?pstate.filaBox:pstate.bldOpen;if(was===d.open)return;
  if(d.id==='fdFila')pstate.filaBox=d.open;else if(d.id==='fdBld')pstate.bldOpen=d.open;else return;
  saveFolds();if(d.open){var b=d.querySelector('.fold-b');if(b&&!b.firstChild){renderPredios();var n=document.getElementById(d.id);if(n){var s=n.querySelector('summary');if(s)s.focus({preventScroll:true})}}}},true);
pPane.addEventListener('click',function(e){
  var t=e.target.closest('[data-lgo],[data-goplan],[data-lgmore]');if(!t)return;
  if(t.dataset.lgmore){pstate.more[t.dataset.lgmore]=true;renderPredios();return}
  var k=t.dataset.lgo||t.dataset.goplan,it=PL[k];if(!it)return;
  if(t.dataset.lgo){var was=pstate.pl===k&&pstate.open;pstate.open=!was;pstate.pl=k}
  if(it.bld&&BLD[it.bld]&&it.b){pstate.bld=it.bld;pstate.pf=undefined;if(it.b!=='?'){pstate.eb=it.b;pstate.ef=it.f}}
  renderPredios(t.dataset.lgo?'[data-lgo="'+k+'"]':null);
  if(t.dataset.goplan){if(!pstate.bldOpen||!pstate.planOpen){pstate.bldOpen=true;pstate.planOpen=true;saveFolds();renderPredios()}var pb=$('#planbox');if(pb){pb.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});var f=pb.querySelector('.chip[aria-pressed="true"]');if(f)f.focus({preventScroll:true})}}
});
/* membros: registra a visita (uma escrita a cada 30 min no máximo) */
function trackMember(uid){
  if(!uid||!SH.db)return;
  if(FBMODE&&typeof memberFlow==='function'){memberFlow(uid);return}
  var k='cse-seen-'+uid,last=0;try{last=+localStorage.getItem(k)||0}catch(e){}
  if(Date.now()-last<30*60000)return;
  SH.db.doc('members/'+uid).get().then(function(d){var x=d.exists?(d.data()||{}):{},now=Date.now();
    var o={first:+x.first||now,last:now,visits:(+x.visits||0)+1};if(FBMODE&&ACC.name)o.nome=String(ACC.name).slice(0,60);
    return SH.db.doc('members/'+uid).set(o);
  }).then(function(){try{localStorage.setItem(k,String(Date.now()))}catch(e){}},function(){});
}
if((!window.claude||typeof window.claude.use!=='function')&&!FBMODE){loadLocalG();if(Object.keys(GST.linhas).length||Object.keys(GST.pontos).length||Object.keys(GST.wifi).length||Object.keys(GST.servicos).length||(GST.plantas.items||[]).length)rebuildAll();setGestor('demo')}
$('#gestBtn').addEventListener('click',function(){if(gestM&&!gestM.hidden)closeGest();else openGest()});
/* ======================= conta: claude.ai ou Google (Firebase) + ajustes na nuvem ======================= */
/* No claude.ai a conta do Claude identifica a pessoa (ajustes em data/users/<id>/ajustes, privado).
   Fora dele (GitHub Pages), com js/config.js preenchido, entra com Google via Firebase Auth e guarda em Firestore usuarios/<uid>. */
var FB_CFG=window.CSE_FIREBASE||null;
var FB_ON=!!(FB_CFG&&FB_CFG.apiKey&&FB_CFG.projectId)&&!(window.claude&&typeof window.claude.use==='function');
var ACC={kind:null,uid:null,name:'',email:'',photo:'',fb:null,mute:false,t:0,last:0,state:'',busy:false};
function accSettings(){return {cfg:Object.assign({},CFG),rota:{from:state.from,to:state.to}}}
function applyRemote(d){
  if(!d||typeof d!=='object')return;
  var ch=false;
  /* idioma escolhido neste aparelho e ainda não salvo na conta: vale o daqui */
  var idiAqui=d.cfg&&CFG.idiomaOk&&!d.cfg.idiomaOk;
  if(d.cfg&&typeof d.cfg==='object')Object.keys(CFG).forEach(function(k){if(idiAqui&&(k==='idioma'||k==='idiomaOk'))return;if(k==='favs'){if(Array.isArray(d.cfg.favs)&&typeof favJunta==='function'&&favJunta(d.cfg.favs))ch=true;return}if(k==='provas'){if(Array.isArray(d.cfg.provas)&&typeof prvJunta==='function'&&prvJunta(d.cfg.provas))ch=true;return}if(k in d.cfg&&typeof d.cfg[k]===typeof CFG[k]&&CFG[k]!==d.cfg[k]){CFG[k]=d.cfg[k];ch=true}});
  ACC.mute=true;
  if(ch){saveCfg();applyBg();applyFont();applyTheme();applyCoverStyle();updateMap();drawBanner();drawShared();renderDetail();coverToday();if(typeof idiAplica==='function')idiAplica()}
  if(d.rota&&STOPS[d.rota.from]&&STOPS[d.rota.to]&&d.rota.from!==d.rota.to&&(d.rota.from!==state.from||d.rota.to!==state.to)){state.from=d.rota.from;state.to=d.rota.to;savePrefs();renderPlan();updateMap()}
  if(ACC.kind==='google'&&Array.isArray(d.grade)&&d.grade.length){GRADE=d.grade.filter(function(x){return x&&x.nome}).slice(0,40);saveGrade();syncAulas();renderGrade()}
  ACC.mute=false;
  if(!cfgM.hidden)renderCfg();
  applyExtra(d);
}
function accQueue(){if(!ACC.kind||ACC.mute)return;clearTimeout(ACC.t);ACC.state='salvando';accPaint();ACC.t=setTimeout(accPush,900)}
function accPush(){
  if(!ACC.kind)return;
  var s=accSettings(),p;
  if(ACC.kind==='claude')p=SH.db.doc('data/users/'+ACC.uid+'/ajustes').set({cfg:s.cfg,rota:s.rota,ts:Date.now()});
  else p=ACC.fb.db.collection('usuarios').doc(ACC.uid).set({cfg:s.cfg,rota:s.rota,grade:GRADE||[],nome:ACC.name||'',ts:Date.now()},{merge:true});
  /* contato para a volta à noite e contagem de contribuições vão junto */
  try{if(ACC.kind==='google'&&ACC.fb)ACC.fb.db.collection('usuarios').doc(ACC.uid).set({contato:CONT,contrib:CONTRIB},{merge:true}).catch(function(){});
    else if(ACC.kind==='claude'&&SH.db)SH.db.doc('data/users/'+ACC.uid+'/extra').set({contato:CONT,contrib:CONTRIB,ts:Date.now()}).catch(function(){})}catch(e){}
  return p.then(function(){ACC.last=Date.now();ACC.state='ok';accPaint()},function(){ACC.state='erro';accPaint()});
}
/* claude.ai */
function accClaude(user,uid){
  if(user&&user.me)user.me().then(function(me){if(me&&me.avatarUrl)savePhoto(me.avatarUrl)},function(){});/* foto da conta do Claude */
  if(!uid||!SH.db)return;
  /* contato da volta à noite e contribuições guardadas na conta */
  try{SH.db.doc('data/users/'+uid+'/extra').get().then(function(d){if(d.exists){applyExtra(d.data());if(!cfgM.hidden)renderCfgKeep()}},function(){})}catch(e){}
  ACC.kind='claude';ACC.uid=uid;ACC.state='carregando';
  (user?user.me():Promise.resolve({})).then(function(me){ACC.name=me&&me.name||'';ACC.photo=me&&me.avatarUrl||'';accPaint()});
  SH.db.doc('data/users/'+uid+'/ajustes').get().then(function(d){
    if(d.exists){applyRemote(d.data()||{});ACC.last=+(d.data()||{}).ts||Date.now();ACC.state='ok'}else accPush();
    accPaint();
  },function(){ACC.state='erro';accPaint()});
}
/* Google via Firebase (só fora do claude.ai, com js/config.js preenchido) */
var FBV='10.12.2';
function loadJS(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=function(){rej(new Error('Não deu para carregar '+src))};document.head.appendChild(s)})}
function fbInit(){
  if(ACC.fb)return Promise.resolve(ACC.fb);
  var base='https://www.gstatic.com/firebasejs/'+FBV+'/';
  return loadJS(base+'firebase-app-compat.js').then(function(){return Promise.all([loadJS(base+'firebase-auth-compat.js'),loadJS(base+'firebase-firestore-compat.js')])}).then(function(){
    if(!firebase.apps.length)firebase.initializeApp(FB_CFG);
    ACC.fb={auth:firebase.auth(),db:firebase.firestore()};return ACC.fb;
  });
}
function fbMsg(e,kind){var c=e&&e.code||'',mail=kind==='mail';
  if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return '';
  if(c==='auth/unauthorized-domain')return 'Este endereço ainda não está autorizado no Firebase (Authentication › Configurações › Domínios autorizados).';
  if(c==='auth/operation-not-allowed')return mail?'Ative o login com e-mail e senha no Firebase (Authentication › Método de login › E-mail/senha).':'Ative o login com Google no Firebase (Authentication › Método de login).';
  if(c==='auth/network-request-failed')return 'Sem conexão. Tente de novo.';
  if(c==='auth/invalid-email'||c==='auth/missing-email')return 'Esse e-mail não parece válido. Confira se digitou certo.';
  if(c==='auth/user-not-found'||c==='auth/wrong-password'||c==='auth/invalid-credential'||c==='auth/invalid-login-credentials')return 'E-mail ou senha não conferem. Confira os dois ou toque em "Esqueci a senha".';
  if(c==='auth/missing-password')return 'Digite a senha.';
  if(c==='auth/email-already-in-use')return 'Já existe uma conta com esse e-mail. Toque em "Já tenho conta" para entrar.';
  if(c==='auth/weak-password')return 'A senha precisa ter pelo menos 6 caracteres.';
  if(c==='auth/too-many-requests')return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if(c==='auth/user-disabled')return 'Esta conta foi desativada pelo gestor do app.';
  if(c==='auth/account-exists-with-different-credential')return 'Esse e-mail já entra por outro método. Tente "Entrar com Google".';
  return mail?'Não deu para entrar com e-mail agora.':'Não deu para entrar com Google agora.'}
function googleIn(){
  fbInit().then(function(fb){
    var pr=new firebase.auth.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
    return fb.auth.signInWithPopup(pr).catch(function(e){if(e&&(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'))return fb.auth.signInWithRedirect(pr);throw e});
  }).then(function(){if(!login.hidden)closeLogin()}).catch(function(e){var m=fbMsg(e);if(m)gToast(m,1)});
}
function googleOut(){if(!ACC.fb)return;var w=ACC.prov==='email'?'da sua conta':'da conta Google';ACC.fb.auth.signOut().then(function(){if(PERFIL&&PERFIL.google){PERFIL=null;savePerfil()}gToast('Você saiu '+w+'. Os ajustes continuam neste aparelho.')})}
function accGoogle(u){
  var pv=(u.providerData||[]).map(function(x){return x&&x.providerId});
  ACC.prov=pv.indexOf('google.com')>=0?'google':'email';ACC.verified=!!u.emailVerified;
  ACC.kind='google';ACC.uid=u.uid;ACC.name=u.displayName||(ACC.prov==='email'?String(u.email||'').split('@')[0]:'');ACC.email=u.email||'';ACC.photo=u.photoURL||'';ACC.state='carregando';accPaint();
  if(!PERFIL&&ACC.name){PERFIL={name:ACC.name.split(' ')[0].slice(0,24),pin:null,google:true};savePerfil();if(!login.hidden)lgShow('saved')}
  ACC.fb.db.collection('usuarios').doc(u.uid).get().then(function(d){
    if(d.exists){applyRemote(d.data()||{});ACC.last=+(d.data()||{}).ts||Date.now();ACC.state='ok';gToast(ACC.prov==='email'?'Ajustes carregados da sua conta.':'Ajustes carregados da sua conta Google.')}else accPush();
    accPaint();
  },function(){ACC.state='erro';accPaint()});
  /* foto: a da conta Google ou, para e-mail e senha, a do Gravatar */
  if(ACC.photo)savePhoto(ACC.photo);else gravatar(u.email).then(function(url){if(url&&ACC.uid===u.uid)savePhoto(url)});
  gradeAuthSync();
}
/* Firebase também como banco compartilhado: fila, avisos, notas, pedidos, calendário e gestão */
function fbShared(fb){
  var db=fb.db;SH.db=db;SH.on=true;SH.write=false;
  db.collection('votes').onSnapshot(function(s){SH.votes=aggVotes(s.docs);refreshAll()},function(){});
  db.collection('cal').onSnapshot(function(s){MUD_DB=s.docs.map(function(d){var x=d.data()||{};return {id:d.id,d:String(x.d||''),de:x.de?String(x.de):'',t:String(x.t||'').slice(0,60),k:String(x.k||'facultativo'),txt:String(x.txt||'').slice(0,240),src:/^https:\/\//.test(x.src||'')?String(x.src):''}});drawBanner();refreshAll();if(cPane&&!cPane.hidden&&!cPane.contains(document.activeElement))renderCal()},function(){});
  db.collection('fila').onSnapshot(function(s){SH.fila=flatFila(s.docs);refreshAll();drawShared();if(gestM&&!gestM.hidden)renderGest()},function(){});
  db.collection('reports').onSnapshot(function(s){SH.reps=flatReps(s.docs);refreshAll();if(gestM&&!gestM.hidden)renderGest()},function(){});
  db.collection('gestao').onSnapshot(function(s){var seen={};s.docs.forEach(function(d){if(GKEYS.indexOf(d.id)<0)return;var v=(d.data()||{}).v;if(v&&typeof v==='object'){GST[d.id]=v;seen[d.id]=1}});
    GKEYS.forEach(function(k){if(!seen[k])GST[k]=k==='plantas'?{items:[]}:k==='bloqueados'?{ids:[]}:{}});if(!Array.isArray(GST.plantas.items))GST.plantas.items=[];GST.plantas.items=GST.plantas.items.filter(function(x){return x&&typeof x==='object'});if(!Array.isArray(GST.bloqueados.ids))GST.bloqueados.ids=[];
    rebuildAll();if(!cfgM.hidden)renderCfg()},function(){});
  refreshAll();
  etapas('Firebase conectado',fb);
}
var fbReqUnsub=null;
function fbUserOn(u){
  var db=SH.db,uid=u.uid;SH.uid=uid;SH.write=true;SH.denied=false;
  db.doc('votes/'+uid).get().then(function(d){if(d.exists){var rr=(d.data()||{}).r||{};Object.keys(rr).forEach(function(k){if(WIFI[k]&&rr[k]>=1&&rr[k]<=5)mine[k]=+rr[k]});saveMine()}else if(Object.keys(mine).length){writeVotes()}refreshAll()},function(){});
  loadGrade();setTimeout(function(){trackMember(uid)},400);
  if(fbReqUnsub)fbReqUnsub();
  fbReqUnsub=db.doc('requests/'+uid).onSnapshot(function(d){var it=d.exists?((d.data()||{}).items||[]):[];SH.myReq=flatReq([{id:uid,data:function(){return {items:it}}}]);if(!cfgM.hidden)renderCfg()},function(){});
  if(u.email)db.doc('gestores/'+String(u.email).toLowerCase()).get().then(function(d){if(d.exists){var gx=d.data()||{};ME.principal=gx.super===true||!('perms' in gx);ME.perms=ME.principal?null:(gx.perms||{});MUD_OWNER=true;setGestor(true);if(cPane&&!cPane.hidden)renderCal();gToast('Você entrou como gestor.')}},function(){});
  refreshAll();
setTimeout(covLoop,3000);}
function fbUserOff(){
  SH.uid=null;SH.write=false;SH.myReq=[];if(fbReqUnsub){fbReqUnsub();fbReqUnsub=null}
  MUD_OWNER=false;if(GESTOR===true){if(gestM&&!gestM.hidden)closeGest();GESTOR=false;var b=$('#gestBtn');if(b)b.hidden=true}
  refreshAll();if(cPane&&!cPane.hidden)renderCal();
  etapas('usuário saiu');
}
if(FB_ON){
  fbInit().then(function(fb){
    fbShared(fb);
    fb.auth.getRedirectResult().catch(function(e){var m=fbMsg(e);if(m)gToast(m,1)});
    fb.auth.onAuthStateChanged(function(u){if(u){accGoogle(u);fbUserOn(u)}else{if(ACC.kind==='google'){ACC.kind=null;ACC.uid=null;ACC.state='';accPaint()}fbUserOff()}});
  }).catch(function(){FB_ON=false;accPaint()});
}
/* interface: Ajustes › Conta e botão no login */
function accHTML(){
  var st=ACC.state==='salvando'?'<span class="pill warn">Salvando…</span>':ACC.state==='erro'?'<span class="pill bad">Não salvou</span>':ACC.state==='carregando'?'<span class="pill">Carregando…</span>':'<span class="pill good">Sincronizado</span>';
  var av=function(){return ACC.photo?'<img class="acc-av" src="'+esc(ACC.photo)+'" alt="" referrerpolicy="no-referrer">':'<span class="acc-av">'+esc((ACC.name||'?').charAt(0).toUpperCase())+'</span>'};
  var h='<div class="accsec" id="accsec"><h2>Conta</h2>';
  if(ACC.kind==='claude')h+='<div class="acc">'+av()+'<span class="grow"><b>'+esc(ACC.name||'Você')+'</b><small>Conta do claude.ai'+(ACC.last?' · salvo '+agoTxt(ACC.last):'')+'</small></span>'+st+'</div><p class="muted small keep">Seus ajustes e o trajeto favorito ficam guardados na sua conta, só para você, e aparecem em qualquer aparelho. A grade também.</p><p class="muted small keep">Para sair da conta do Claude, use o menu do próprio claude.ai. O botão Sair do perfil fecha só o app.</p>';
  else if(ACC.kind==='google'){var em=ACC.prov==='email';
    h+='<div class="acc">'+av()+'<span class="grow"><b>'+esc(ACC.name||(em?'Sua conta':'Conta Google'))+'</b><small>'+esc(ACC.email)+(em?' · e-mail e senha':'')+(ACC.last?' · salvo '+agoTxt(ACC.last):'')+'</small></span>'+st+'</div>'+
      (em&&!ACC.verified?'<div class="accmail"><p class="small"><span class="pill warn">E-mail não confirmado</span> Abra o link que enviamos para '+esc(ACC.email)+'. Olhe também a caixa de spam.</p><div class="row"><button type="button" class="copy" id="accVerify">Reenviar e-mail</button><button type="button" class="copy" id="accVerified">Já confirmei</button></div></div>':'')+
      '<p class="muted small keep">Seus ajustes, o trajeto favorito e a grade ficam na sua conta e aparecem em qualquer aparelho em que você entrar.</p><div class="accmail"><div class="row">'+(em?'<button type="button" class="copy" id="accReset">Trocar a senha</button>':'')+'<button type="button" class="copy" id="accOut">Sair da conta</button></div></div>'}
  else if(FB_ON)h+='<p class="small">Entre com a conta Google ou com e-mail e senha para levar seus ajustes, o trajeto favorito e a grade para qualquer aparelho.</p><div class="accmail"><div class="row"><button type="button" class="copy primary" data-goo>Entrar com Google</button><button type="button" class="copy primary" data-mail>Entrar com e-mail</button></div></div><p class="muted small keep">Sem entrar, tudo fica salvo só neste aparelho.</p>';
  else h+='<p class="small">Seus ajustes ficam salvos só neste aparelho.</p><p class="muted small keep">Para entrar com Google, publique o app com o arquivo js/config.js preenchido (passo a passo no README do projeto). No claude.ai, a sua conta do Claude já guarda tudo.</p>';
  /* com conta: contribuições e dados; sem conta: o que se ganha entrando */
  if(contaOk())h+=contribHTML()+dadosHTML();
  else if(FB_ON)h+='<p class="small keep la-p"><b>Com uma conta você também tem:</b></p>'+laBenHTML();
  return h+'</div>';
}
function accPaint(){var s=$('#accsec');if(s&&!cfgM.hidden){var tmp=document.createElement('div');tmp.innerHTML=accHTML();s.replaceWith(tmp.firstChild)}}
aoFazer('ajustes montados',function(f){var R=$('#cfgR');if(R&&!R.querySelector('#accsec'))R.insertAdjacentHTML('afterbegin',accHTML())});
document.querySelectorAll('#login .lg-goo').forEach(function(b){b.hidden=!FB_ON});
/* login com e-mail e senha (Firebase) */
var MAIL={mode:'in',busy:false};
function mailMode(m){
  MAIL.mode=m;var up=m==='up';
  $('#lgMailIn').setAttribute('aria-pressed',String(!up));$('#lgMailUp').setAttribute('aria-pressed',String(up));
  $('#lgMailT').textContent=up?'Criar conta com e-mail':'Entrar com e-mail';
  $('#lgMailNome').hidden=!up;$('#lgMailNomeL').hidden=!up;
  $('#lgMailPass').setAttribute('autocomplete',up?'new-password':'current-password');
  $('#lgMailGo').textContent=up?'Criar conta e entrar':'Entrar';
  $('#lgMailForgotW').hidden=up;$('#lgMailErr').textContent='';$('#lgMailOk').textContent='';
}
function openMail(mode){if(mode)MAIL.mode=mode;if(login.hidden)openLogin();lgShow('mail')}
function mailBusy(on,label){MAIL.busy=on;var g=$('#lgMailGo');g.disabled=on;g.textContent=on?label:(MAIL.mode==='up'?'Criar conta e entrar':'Entrar')}
function mailFb(){return fbInit().then(function(fb){try{fb.auth.languageCode='pt-BR'}catch(_){}return fb})}
$('#lgMailIn').addEventListener('click',function(){mailMode('in')});
$('#lgMailUp').addEventListener('click',function(){mailMode('up')});
$('#lgMailShow').addEventListener('change',function(){$('#lgMailPass').type=this.checked?'text':'password'});
$('#lgMailBack').addEventListener('click',function(){lgShow(PERFIL?'saved':'new')});
$('#lgMail').addEventListener('submit',function(e){
  e.preventDefault();if(MAIL.busy)return;
  var up=MAIL.mode==='up',nome=$('#lgMailNome').value.trim().slice(0,40),mail=$('#lgMailEmail').value.trim().toLowerCase(),pass=$('#lgMailPass').value,er=$('#lgMailErr');
  er.textContent='';$('#lgMailOk').textContent='';
  if(up&&!nome){er.textContent='Escreva como você quer ser chamado.';$('#lgMailNome').focus();return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){er.textContent='Digite um e-mail válido, como nome@exemplo.com.';$('#lgMailEmail').focus();return}
  if(pass.length<6){er.textContent='A senha precisa ter pelo menos 6 caracteres.';$('#lgMailPass').focus();return}
  mailBusy(true,up?'Criando a conta…':'Entrando…');
  mailFb().then(function(fb){
    if(!up)return fb.auth.signInWithEmailAndPassword(mail,pass).then(function(){mailBusy(false);$('#lgMailPass').value='';if(!login.hidden)closeLogin()});
    return fb.auth.createUserWithEmailAndPassword(mail,pass).then(function(cred){
      var u=cred.user;
      return u.updateProfile({displayName:nome}).catch(function(){}).then(function(){
        ACC.name=nome;if(!PERFIL||PERFIL.google){PERFIL={name:nome.split(' ')[0].slice(0,24),pin:null,google:true};savePerfil()}
        accPaint();
        return u.sendEmailVerification().then(function(){return true},function(){return false});
      }).then(function(sent){
        mailBusy(false);$('#lgMailPass').value='';if(!login.hidden)closeLogin();
        gToast(sent?'Conta criada. Enviamos um link para '+mail+' confirmar o e-mail.':'Conta criada. Não deu para enviar o e-mail de confirmação agora; tente em Ajustes › Conta.');
      });
    });
  }).catch(function(err){mailBusy(false);er.textContent=fbMsg(err,'mail')||'Não deu para entrar com e-mail agora.'});
});
function mailReset(mail,out){
  return mailFb().then(function(fb){return fb.auth.sendPasswordResetEmail(mail)}).then(function(){out(true,'Se houver uma conta com '+mail+', enviamos um link para criar uma senha nova. Olhe também a caixa de spam.')},
    function(err){var c=err&&err.code||'';if(c==='auth/user-not-found')out(true,'Se houver uma conta com '+mail+', enviamos um link para criar uma senha nova. Olhe também a caixa de spam.');else out(false,fbMsg(err,'mail'))});
}
$('#lgMailForgot').addEventListener('click',function(){
  var mail=$('#lgMailEmail').value.trim().toLowerCase(),er=$('#lgMailErr'),ok=$('#lgMailOk');er.textContent='';ok.textContent='';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){er.textContent='Digite seu e-mail acima e toque de novo em "Esqueci a senha".';$('#lgMailEmail').focus();return}
  mailReset(mail,function(good,msg){if(good)ok.textContent=msg;else er.textContent=msg});
});
document.querySelectorAll('#login [data-mail]').forEach(function(b){b.hidden=!FB_ON});
document.addEventListener('click',function(e){
  if(e.target.closest('[data-mail]')){e.preventDefault();openMail('in');return}
  if(e.target.closest('#accVerify')){var u=ACC.fb&&ACC.fb.auth.currentUser;if(!u)return;
    u.sendEmailVerification().then(function(){gToast('Enviamos outro link para '+u.email+'.')},function(err){gToast(err&&err.code==='auth/too-many-requests'?'Já enviamos há pouco. Espere alguns minutos.':'Não deu para enviar agora.',1)});return}
  if(e.target.closest('#accVerified')){var v=ACC.fb&&ACC.fb.auth.currentUser;if(!v)return;
    v.reload().then(function(){var w=ACC.fb.auth.currentUser;ACC.verified=!!(w&&w.emailVerified);
      if(ACC.verified){w.getIdToken(true).catch(function(){}).then(function(){fbUserOn(w)});gToast('E-mail confirmado.')}else gToast('Ainda não aparece como confirmado. Abra o link do e-mail e tente de novo.',1);
      accPaint()},function(){gToast('Não deu para conferir agora.',1)});return}
  if(e.target.closest('#accReset')&&ACC.email){mailReset(ACC.email,function(good,msg){gToast(good?'Enviamos um link para '+ACC.email+' trocar a senha.':msg,!good)})}
});
document.addEventListener('click',function(e){
  if(e.target.closest('[data-goo]')){e.preventDefault();googleIn();return}
  if(e.target.closest('#accOut')){googleOut()}
});
setInterval(function(){if(ACC.kind&&ACC.state==='ok')accPaint()},60000);
/* ======================= fonte: família e tamanho ======================= */
var FONTS=[
  ['aparelho','Do aparelho','A fonte do seu celular ou computador. Carrega na hora.',null,null],
  ['inter','Inter','Neutra e moderna, muito usada em apps.','Inter:wght@400;500;600;700;800',"'Inter',system-ui,sans-serif"],
  ['atkinson','Atkinson Hyperlegible','Feita para quem tem baixa visão: letras bem diferentes entre si.','Atkinson+Hyperlegible:wght@400;700',"'Atkinson Hyperlegible',system-ui,sans-serif"],
  ['lexend','Lexend','Espaçada, pensada para leitura mais fluida.','Lexend:wght@400;500;600;700;800',"'Lexend',system-ui,sans-serif"],
  ['nunito','Nunito','Arredondada e amigável.','Nunito:wght@400;600;700;800',"'Nunito',system-ui,sans-serif"],
  ['plex','IBM Plex Sans','Técnica, com cara de engenharia.','IBM+Plex+Sans:wght@400;500;600;700',"'IBM Plex Sans',system-ui,sans-serif"],
  ['literata','Literata','Serifada, para quem prefere cara de livro.','Literata:wght@400;600;700;800',"'Literata',Georgia,serif"]
];
var FSIZES=[['p','Pequeno',.92],['m','Normal',1],['g','Grande',1.12],['gg','Muito grande',1.25]];
var fontOpen=false;
function fontDef(k){return FONTS.filter(function(f){return f[0]===k})[0]||FONTS[0]}
function loadFont(f){if(!f||!f[3])return;var id='gf-'+f[0];if(document.getElementById(id))return;var l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family='+f[3]+'&display=swap';document.head.appendChild(l)}
function applyFont(){
  var f=fontDef(CFG.font),r=document.documentElement;loadFont(f);
  if(f[4])r.style.setProperty('--f-body',f[4]);else r.style.removeProperty('--f-body');
  r.dataset.fs=FSIZES.some(function(s){return s[0]===CFG.fsize})?CFG.fsize:'m';
  if(typeof schedule==='function')setTimeout(function(){applyView(true)},60);
}
function fontFoldHTML(){
  var f=fontDef(CFG.font),sz=FSIZES.filter(function(s){return s[0]===CFG.fsize})[0]||FSIZES[1],fam=function(x){return x[4]?x[4]:"-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif"};
  return '<details class="cvdet" id="fontdet"'+(fontOpen?' open':'')+'><summary><span class="cvsum"><span class="fsw" style="font-family:'+fam(f)+'">Aa</span></span><span class="grow"><b>Fonte</b><small>'+esc(f[1])+' · texto '+sz[1].toLowerCase()+'</small></span><span class="chev" aria-hidden="true">▾</span></summary>'+
    '<div class="fontopts" role="radiogroup" aria-label="Fonte">'+FONTS.map(function(x){var on=x[0]===f[0];
      return '<button type="button" class="fontopt" role="radio" aria-checked="'+on+'" data-font="'+x[0]+'"><b style="font-family:'+fam(x)+'">'+esc(x[1])+'</b><span class="fprev" style="font-family:'+fam(x)+'">Próximo ônibus em 5 min · Bloco H, sala 210</span><small>'+esc(x[2])+'</small></button>'}).join('')+'</div>'+
    '<p class="small fslab"><b>Tamanho do texto</b></p><div class="chips fsizes" role="radiogroup" aria-label="Tamanho do texto">'+FSIZES.map(function(s){return '<button type="button" class="chip" role="radio" aria-checked="'+(s[0]===sz[0])+'" aria-pressed="'+(s[0]===sz[0])+'" data-fsize="'+s[0]+'"><span style="font-size:'+Math.round(14*s[2])+'px">A</span> '+s[1]+'</button>'}).join('')+'</div>'+
    '<p class="muted small keep">As fontes vêm do Google Fonts e baixam na primeira vez que você escolhe. O tamanho vale para os painéis; o mapa tem o zoom próprio.</p></details>';
}
aoFazer('ajustes montados',function(f){var L=$('#cfgL');if(L&&!L.querySelector('#fontdet')){L.insertAdjacentHTML('beforeend',fontFoldHTML());if(fontOpen)FONTS.forEach(loadFont);if(f&&/data-f(ont|size)/.test(f)){var el=L.querySelector(f);if(el)el.focus({preventScroll:true})}}});
document.addEventListener('toggle',function(e){if(e.target&&e.target.id==='fontdet'){fontOpen=e.target.open;if(fontOpen)FONTS.forEach(loadFont)}},true);
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-font],[data-fsize]');if(!t||!t.closest('#fontdet'))return;
  if(t.dataset.font){CFG.font=t.dataset.font;saveCfg();applyFont();renderCfg('[data-font="'+t.dataset.font+'"]')}
  else{CFG.fsize=t.dataset.fsize;saveCfg();applyFont();renderCfg('[data-fsize="'+t.dataset.fsize+'"]')}
});
applyFont();
