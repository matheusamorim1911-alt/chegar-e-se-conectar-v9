/* ======================= versão de apresentação: robustez ======================= */
/* Número da versão: o empacotamento para o GitHub troca 'dev' pela data e hora do pacote. */
var APP_VERSION='dev';
var ON_SITE=!(window.claude&&typeof window.claude.use==='function');
/* ---------- limite de envios: carimbo do servidor + intervalo no aparelho ---------- */
var POST_GAP={rep:30,fila:30,req:60};
function stamp(o){try{if(FBMODE&&window.firebase&&firebase.firestore&&firebase.firestore.FieldValue)o.at=firebase.firestore.FieldValue.serverTimestamp()}catch(e){}return o}
function postLast(k){try{return +localStorage.getItem('cse-post-'+k)||0}catch(e){return 0}}
function postGap(k){
  if(!FBMODE||GESTOR===true)return true;
  var wait=Math.ceil((postLast(k)+POST_GAP[k]*1000-Date.now())/1000);
  if(wait>0){gToast('Espere '+wait+' s para enviar de novo. O limite evita envios repetidos.',1);return false}
  return true;
}
function postDone(k){try{localStorage.setItem('cse-post-'+k,String(Date.now()))}catch(e){};var m={fila:'fila',rep:'avisos',req:'pedidos'}[k];if(m){CONTRIB[m]++;saveContrib();if(contaOk())accQueue()}}
function postFail(){
  if(FBMODE){gToast(SH.full&&GESTOR!==true?fullMsg('enviar'):'Não deu para enviar agora. Espere alguns segundos e tente de novo.',1);return}
  SH.denied=true;refreshAll();
}
/* ---------- limite de pessoas que participam (vagas) ---------- */
var VAGAS={n:null,max:80,ok:false};SH.full=false;SH.member=false;
function fullMsg(acao){return 'As '+VAGAS.max+' vagas para participar já foram preenchidas. Você continua vendo tudo, mas não consegue '+acao+'.'}
function vagasRef(){return SH.db.doc('meta/vagas')}
function memberData(old){var now=Date.now(),o={first:+(old&&old.first)||now,last:now,visits:(+(old&&old.visits)||0)+1};if(ACC.name)o.nome=String(ACC.name).slice(0,60);if(ACC.email)o.email=String(ACC.email).toLowerCase().slice(0,120);return o}
function isGestorEmail(email){
  if(!email)return Promise.resolve(false);
  return SH.db.doc('gestores/'+String(email).toLowerCase()).get().then(function(d){return !!d.exists},function(){return false});
}
function memberFlow(uid){
  var db=SH.db,u=ACC.fb&&ACC.fb.auth.currentUser,email=u&&u.email;
  var k='cse-seen-'+uid,last=0;try{last=+localStorage.getItem(k)||0}catch(e){}
  Promise.all([db.doc('members/'+uid).get(),vagasRef().get().catch(function(){return {exists:false}}),isGestorEmail(u&&u.emailVerified!==false?email:null)]).then(function(r){
    var m=r[0],v=r[1],gest=r[2];
    if(v.exists){var vd=v.data()||{};VAGAS.n=+vd.n||0;VAGAS.max=+vd.max||80;VAGAS.ok=true}
    if(gest&&!v.exists)initVagas();
    if(m.exists){SH.member=true;SH.full=false;
      if(Date.now()-last<30*60000)return;
      return db.doc('members/'+uid).set(memberData(m.data()||{})).then(function(){try{localStorage.setItem(k,String(Date.now()))}catch(e){}});}
    if(gest||!v.exists){/* gestor não ocupa vaga; antes da gestão configurar as vagas, entra sem contar */
      return db.doc('members/'+uid).set(memberData(null)).then(function(){SH.member=true;SH.full=false;try{localStorage.setItem(k,String(Date.now()))}catch(e){}refreshAll()});}
    if(VAGAS.n>=VAGAS.max){SH.full=true;refreshAll();gToast(fullMsg('enviar avisos, filas ou notas'),1);return}
    var b=db.batch();b.set(db.doc('members/'+uid),memberData(null));b.update(vagasRef(),{n:firebase.firestore.FieldValue.increment(1)});
    return b.commit().then(function(){SH.member=true;SH.full=false;VAGAS.n++;try{localStorage.setItem(k,String(Date.now()))}catch(e){}refreshAll()},
      function(){/* alguém pegou a última vaga ao mesmo tempo */SH.full=true;refreshAll();gToast(fullMsg('enviar avisos, filas ou notas'),1)});
  }).catch(function(){});
}
function initVagas(){
  SH.db.collection('members').get().then(function(s){return s.docs.length},function(){return 0}).then(function(n){
    return vagasRef().set({n:n,max:80}).then(function(){VAGAS.n=n;VAGAS.max=80;VAGAS.ok=true;if(gestM&&!gestM.hidden)renderGest()});
  }).catch(function(){});
}
function watchVagas(){vagasRef().onSnapshot(function(d){if(!d.exists)return;var x=d.data()||{};VAGAS.n=+x.n||0;VAGAS.max=+x.max||80;VAGAS.ok=true;if(gestM&&!gestM.hidden&&(gTab==='usuarios'||gTab==='geral'))renderGest()},function(){})}
aoFazer('gestor definido',function(v){if(v===true&&FBMODE&&SH.db&&!VAGAS.watch){VAGAS.watch=true;watchVagas()}});
aoFazer('usuário saiu',function(){SH.full=false;SH.member=false});
/* gestão › Usuários: vagas e liberar vaga */
document.addEventListener('submit',function(e){
  var f=e.target.closest('form[data-gform="vagas"]');if(!f)return;e.preventDefault();e.stopPropagation();
  var mx=Math.round(+$('#gVmax').value);if(!(mx>=1&&mx<=2000)){gToast('Use um número entre 1 e 2000.',1);return}
  vagasRef().set({n:VAGAS.n||0,max:mx}).then(function(){gToast('Limite salvo: '+mx+' pessoas.')},function(){gToast('Não deu para salvar. Você precisa do privilégio Usuários e das regras novas do Firestore.',1)});
},true);
document.addEventListener('click',function(e){
  var fr=e.target.closest('[data-gfree]');
  if(fr&&FBMODE){var id=fr.dataset.gfree,b=SH.db.batch();b.delete(SH.db.doc('members/'+id));b.update(vagasRef(),{n:firebase.firestore.FieldValue.increment(-1)});
    b.commit().then(function(){gToast('Vaga liberada.')},function(){gToast('Não deu para liberar a vaga.',1)});return}
  if(e.target.closest('#gVrecount')){SH.db.collection('members').get().then(function(s){return vagasRef().set({n:s.docs.length,max:VAGAS.max})}).then(function(){gToast('Contador refeito.')},function(){gToast('Não deu para recontar.',1)})}
});
/* ---------- registro de erros dos aparelhos (só no site com Firebase) ---------- */
var ERR={n:0,seen:{},queue:[]};
function errUA(){var u=navigator.userAgent||'';return u.slice(0,200)}
function errLog(msg,src,line){
  if(!FBMODE)return;
  msg=String(msg||'erro').slice(0,300);var key=msg+'|'+line;if(ERR.seen[key]||ERR.n>=5)return;ERR.seen[key]=1;ERR.n++;
  var o={msg:msg,src:String(src||'').replace(location.origin,'').slice(0,200),linha:+line||0,ua:errUA(),ver:APP_VERSION,pag:(location.pathname||'').slice(0,100),ts:Date.now(),uid:SH.uid||''};
  if(SH.db)SH.db.collection('erros').add(o).catch(function(){});else ERR.queue.push(o);
}
window.addEventListener('error',function(e){if(e&&e.message)errLog(e.message,e.filename,e.lineno)});
window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;if(r&&r.code&&/^(auth|permission|firestore)\//.test(String(r.code)))return;
  /* falhas conhecidas do IndexedDB do Safari, dentro do login do Firebase: o login segue funcionando, então não viram erro */
  if(/Indexed ?Database|IndexedDB|IDBDatabase|in-progress transaction|Connection to Indexed Database server lost/i.test(String(r&&(r.message||r)||''))){try{e.preventDefault()}catch(x){}return}errLog('Promessa rejeitada: '+(r&&(r.message||r.code)||r),'',0)});
aoFazer('Firebase conectado',function(fb){ERR.queue.splice(0).forEach(function(o){SH.db.collection('erros').add(o).catch(function(){})})});
var ERRL=null;
function loadErrs(){SH.db.collection('erros').get().then(function(s){ERRL=s.docs.map(function(d){var x=d.data()||{};return {id:d.id,msg:String(x.msg||''),src:String(x.src||''),linha:+x.linha||0,ua:String(x.ua||''),ver:String(x.ver||''),ts:+x.ts||0}}).sort(function(a,b){return b.ts-a.ts});if(gestM&&!gestM.hidden&&gTab==='geral')renderGest()},function(){ERRL=[];})}
function uaShort(u){var os=/iPhone|iPad/.test(u)?'iPhone/iPad':/Android/.test(u)?'Android':/Windows/.test(u)?'Windows':/Mac OS/.test(u)?'Mac':'outro';
  var br=/Instagram/.test(u)?'Instagram':/FBAN|FBAV/.test(u)?'Facebook':/WhatsApp/.test(u)?'WhatsApp':/SamsungBrowser/.test(u)?'Samsung Internet':/EdgA?\//.test(u)?'Edge':/CriOS|Chrome\//.test(u)?'Chrome':/FxiOS|Firefox/.test(u)?'Firefox':/Safari/.test(u)?'Safari':'navegador interno';return os+' · '+br}
function errCard(){
  if(!FBMODE||!SH.on||!gcan('usuarios'))return '';
  if(ERRL===null){ERRL=[];loadErrs()}
  var l=ERRL.slice(0,20);
  return '<h3 class="gh">Erros nos aparelhos</h3><p class="muted small">Falhas que aconteceram no celular de quem usa o app, com o aparelho e a versão. Útil no dia da apresentação para saber o que corrigir.</p>'+
    (l.length?'<div class="glist">'+l.map(function(x){return '<div class="grow2"><span class="grow"><b>'+esc(x.msg)+'</b><small>'+esc(uaShort(x.ua))+' · versão '+esc(x.ver)+' · '+agoTxt(x.ts)+(x.src?' · '+esc(x.src)+(x.linha?':'+x.linha:''):'')+'</small></span></div>'}).join('')+'</div><div class="gbtns"><button type="button" class="copy" id="gErrReload">Atualizar</button><button type="button" class="copy danger" id="gErrClear">Apagar todos</button></div>'
      :'<p class="muted small">Nenhum erro registrado.</p><div class="gbtns"><button type="button" class="copy" id="gErrReload">Atualizar</button></div>');
}
document.addEventListener('click',function(e){
  if(e.target.closest('#gErrReload')){loadErrs();return}
  if(e.target.closest('#gErrClear')){var b=SH.db.batch();(ERRL||[]).forEach(function(x){b.delete(SH.db.doc('erros/'+x.id))});b.commit().then(function(){ERRL=[];renderGest();gToast('Erros apagados.')},function(){gToast('Não deu para apagar.',1)})}
});
/* ---------- modo apresentação: exemplos de fila e avisos ---------- */
var DEMO_ID='exemplo-apresentacao';
/* malha de cobertura de exemplo: parte da mesma simulação da prévia, agrupada em hexágonos de 30 m; quase toda com eduroam */
function demoMesh(){
  var src=covSamplesExemplo(),cells={},t=Math.floor(Date.now()/600000)*600000,r=covRand(4242),out=[];
  src.forEach(function(s){var c=cellOf(s.p),o=cells[c.k]||(cells[c.k]={c:c,n:0,ok:0,mb:0});o.n++;if(s.ok){o.ok++;o.mb+=s.mb}});
  Object.keys(cells).forEach(function(k){var o=cells[k],ok=o.ok/o.n>=.5,mb=ok?Math.min(999,Math.round(o.mb/Math.max(1,o.ok)*10)/10):0,reps=o.n>=8?3:o.n>=4?2:1;
    for(var i=0;i<reps;i++)out.push({cell:k,x:o.c.x,y:o.c.y,ok:ok,edu:ok?r()<.85:null,mb:mb,ms:ok?Math.round(30+r()*150):0,tipo:'wifi',acc:20,t:t,ver:'exemplo'})});
  return out.slice(0,1200);
}
function demoWriteMed(list){
  if(typeof SH.db.batch!=='function')return Promise.all(list.map(function(x){return SH.db.collection('medicoes').add(x)}));
  var ps=[],tag=Date.now().toString(36);for(var i=0;i<list.length;i+=400){var b=SH.db.batch();list.slice(i,i+400).forEach(function(x,j){b.set(SH.db.doc('medicoes/exemplo-'+tag+'-'+(i+j)),x)});ps.push(b.commit())}
  return Promise.all(ps);
}
function demoHasVotes(){return !!(SH.voteDocs&&SH.voteDocs[DEMO_ID])}
function demoClearMed(){if(!FBMODE||!SH.db)return Promise.resolve();return SH.db.collection('medicoes').where('ver','==','exemplo').get().then(function(q){if(!q.docs.length)return;var ps=[];for(var i=0;i<q.docs.length;i+=400){var b=SH.db.batch();q.docs.slice(i,i+400).forEach(function(x){b.delete(x.ref)});ps.push(b.commit())}return Promise.all(ps)})}
function demoCard(){
  if(!SH.on||!gcan('avisos'))return '';
  var has=SH.fila.some(function(r){return r.owner===DEMO_ID})||SH.reps.some(function(r){return r.owner===DEMO_ID})||demoHasVotes();
  return '<h3 class="gh">Modo apresentação</h3><div class="gcard"><p class="small">Preenche com exemplos tudo o que os alunos informam: fila dos RUs, um aviso de cada tipo, notas para todas as redes Wi-Fi, a malha do mapa de cobertura (com eduroam) e pedidos de correção. Filas somem em 45 min e avisos em 4 h; o resto sai com o botão Limpar.</p>'+
    '<p class="muted small">Dica: no campo Horário, escolha 22:00 para mostrar a Volta à noite a qualquer hora.</p><div class="gbtns"><button type="button" class="copy primary" id="gDemoOn">'+(has?'Renovar exemplos':'Preencher exemplos')+'</button>'+(has?'<button type="button" class="copy danger" id="gDemoOff">Limpar exemplos</button>':'')+'</div></div>';
}
function demoItems(){
  var now=Date.now(),m=60000,f=[],r=[];
  var lv=[3,1,2,0,2,1];
  RUS.forEach(function(k,i){f.push({id:'fx'+i,ru:k,n:lv[i%lv.length],ts:now-(3+i*4)*m})});
  var st=Object.keys(STOPS),wf=Object.keys(WIFI),pl=Object.keys(PL).filter(function(k){return PL[k].p&&PL[k].cat!=='aula'});
  var pick=function(a,i){return a.length?a[i%a.length]:null};
  var ex={onibus:['stop:'+(STOPS.ctl?'ctl':pick(st,1)),'Linha 1 passou lotada'],wifi:['wifi:'+pick(wf,0),'Rede caiu depois das 10h'],
    fila:['pl:'+(PL.ru_central?'ru_central':pick(pl,0)),'Fila até a porta'],fechado:['pl:'+pick(pl,3),'Fechado sem aviso hoje'],
    elevador:['pl:'+pick(pl,5),'Elevador parado no bloco A'],limpeza:['pl:'+pick(pl,7),'Banheiro do 2º andar sem papel'],
    seguranca:['stop:'+pick(st,6),'Pouca luz no ponto à noite'],outro:['stop:'+pick(st,9),'Obra na calçada perto do ponto']};
  REP_K.forEach(function(k,i){var e=ex[k[0]];if(!e||/null$/.test(e[0]))return;r.push({id:'rx'+i,k:k[0],place:e[0],txt:e[1],ts:now-(5+i*7)*m})});
  /* uma nota para cada rede Wi-Fi, de 1 a 5, variando */
  var v={},nt=[4,2,5,3,1,4,3,5,2,4];wf.forEach(function(id,i){v[id]=nt[i%nt.length]});
  /* pedidos de correção, um de cada tipo */
  var q=REQ_T.slice(0,6).map(function(t,i){var al={onibus:'Linha 2',ponto:STOPS[pick(st,4)]?STOPS[pick(st,4)].name:'Ponto',wifi:WIFI[pick(wf,1)]?WIFI[pick(wf,1)].name:'Wi-Fi',servico:'RU Central',planta:'CT, bloco H',outro:'App'}[t[0]]||'';
    var tx={onibus:'O horário das 18h mudou para 18h10.',ponto:'O ponto mudou para o outro lado da rua.',wifi:'A senha da rede mudou.',servico:'O RU abre às 10h30 nas sextas.',planta:'Falta a planta do 3º andar.',outro:'Seria bom ter o horário do bandejão no fim de semana.'}[t[0]]||'';
    return {id:'qx'+i,t:t[0],alvo:al,txt:tx,ts:now-(20+i*30)*m}});
  /* medições do mapa de cobertura em volta dos pontos de Wi-Fi */
  var md=demoMesh();
  return {f:f,r:r,v:v,q:q,md:md};
}
document.addEventListener('click',function(e){
  if(e.target.closest('#gDemoOn')){var d=demoItems(),falhou=[];
    var job=function(nome,p){return Promise.resolve(p).then(function(){return true},function(){falhou.push(nome);return false})};
    var tasks=[job('fila',SH.db.doc('fila/'+DEMO_ID).set({items:d.f})),job('avisos',SH.db.doc('reports/'+DEMO_ID).set({items:d.r})),
      job('notas de Wi-Fi',SH.db.doc('votes/'+DEMO_ID).set({r:d.v,ts:Date.now()})),job('pedidos de correção',SH.db.doc('requests/'+DEMO_ID).set({items:d.q}))];
    if(FBMODE)tasks.push(job('malha de cobertura',demoClearMed().then(function(){return demoWriteMed(d.md)})));
    else{try{localStorage.setItem('cse-demo-med',JSON.stringify(d.md))}catch(x){}}
    Promise.all(tasks).then(function(){if(!falhou.length)gToast('Exemplos publicados. Todos que abrirem o app vão ver.');
      else gToast('Exemplos publicados, menos: '+falhou.join(', ')+'. Confira os privilégios e publique as regras novas do Firestore.',1);if(typeof COV!=='undefined'){COV.real=null;if(COV.on&&FBMODE)covLoadReal()}if(FBMODE&&SH.db&&gcan('solicitacoes'))SH.db.collection('requests').get().then(function(x){SH.req=flatReq(x.docs);if(gestM&&!gestM.hidden)renderGest()},function(){})});return}
  if(e.target.closest('#gDemoOff')){var ps=[SH.db.doc('fila/'+DEMO_ID).delete(),SH.db.doc('reports/'+DEMO_ID).delete(),SH.db.doc('votes/'+DEMO_ID).delete(),SH.db.doc('requests/'+DEMO_ID).delete()].map(function(x){return Promise.resolve(x).catch(function(){})});
    if(FBMODE)ps.push(demoClearMed().catch(function(){}));try{localStorage.removeItem('cse-demo-med')}catch(x){}
    Promise.all(ps).then(function(){gToast('Exemplos removidos.');if(typeof COV!=='undefined'){COV.real=null;if(COV.on&&FBMODE)covLoadReal()}})}
});
/* os exemplos não contam como usuário bloqueado nem aparecem como pessoa */
/* ---------- navegador interno (WhatsApp, Instagram, Facebook…) ---------- */
var INAPP=(function(){var u=navigator.userAgent||'';
  if(/FBAN|FBAV|FB_IAB|Instagram|Line\/|LinkedInApp|Snapchat|musical_ly|TikTok|BytedanceWebview|WhatsApp|GSA\//i.test(u))return true;
  if(/Android/.test(u)&&/; wv\)/.test(u))return true;
  if(/iPhone|iPad|iPod/.test(u)&&!/Safari\//.test(u)&&!navigator.standalone)return true;
  return false})();
/* qual app abriu o link e onde fica o menu dele, para o passo a passo */
var IA=(function(){var u=navigator.userAgent||'',android=/Android/.test(u),n='';
  if(/Instagram/i.test(u))n='Instagram';else if(/FBAN|FBAV|FB_IAB|FBIOS/.test(u))n='Facebook';else if(/WhatsApp/i.test(u))n='WhatsApp';
  else if(/musical_ly|TikTok|BytedanceWebview/i.test(u))n='TikTok';else if(/LinkedInApp/i.test(u))n='LinkedIn';else if(/Snapchat/i.test(u))n='Snapchat';
  else if(/Line\//.test(u))n='LINE';else if(/GSA\//.test(u))n='app do Google';
  var br=android?'Chrome':'Safari',menu=android&&n!=='Instagram'&&n!=='TikTok'?'⋮':'⋯';
  var opt=n==='Instagram'||n==='Facebook'?'Abrir no navegador externo':n==='WhatsApp'?'Abrir no '+br:'Abrir no navegador';
  return {android:android,app:n,br:br,menu:menu,opt:opt}})();
function iaURL(){return location.href.split('#')[0]}
function iaIntent(){var url=iaURL();return 'intent://'+url.replace(/^https?:\/\//,'')+'#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url='+encodeURIComponent(url)+';end'}
function inappHTML(){
  return '<div class="inapp" id="inapp" role="region" aria-label="Aviso sobre o navegador"><p><b>Você está no navegador '+(IA.app?'do '+esc(IA.app):'de outro aplicativo')+'.</b> Para entrar com Google e usar localização, bússola e biometria, abra no '+IA.br+'.</p>'+
    '<div class="inapp-b">'+(IA.android?'<a class="copy primary" href="'+esc(iaIntent())+'">Abrir no Chrome</a>':'<button type="button" class="copy primary" id="inappHow">Como abrir no Safari</button>')+
    '<button type="button" class="copy" id="inappCopy">Copiar link</button><button type="button" class="copy" id="inappX" aria-label="Fechar aviso">Agora não</button></div></div>';
}
/* tela cheia que aparece antes do login e da capa */
function iaGateHTML(){
  var who=IA.app?'do '+esc(IA.app):'deste aplicativo';
  return '<div class="iagate" id="iagate" role="dialog" aria-modal="true" aria-labelledby="iagT">'+
    '<span class="iag-arrow" aria-hidden="true">Menu '+IA.menu+' aqui ↑</span>'+
    '<div class="iagate-card">'+
      '<p class="eyebrow">Você abriu pelo '+(IA.app?esc(IA.app):'link de outro app')+'</p>'+
      '<h2 id="iagT">Abra no '+IA.br+' para usar o app inteiro</h2>'+
      '<p>No navegador '+who+', o Google não deixa entrar e o celular bloqueia localização, bússola e biometria.</p>'+
      (IA.android?'<a class="copy primary iag-go" id="iagGo" href="'+esc(iaIntent())+'">Abrir no Chrome</a><p class="muted small iag-or">Se não abrir, faça assim:</p>':'')+
      '<ol class="iag-steps"><li>Toque em <b>'+IA.menu+'</b> no canto de cima da tela.</li><li>Escolha <b>'+esc(IA.opt)+'</b> (o nome muda um pouco de app para app).</li></ol>'+
      '<div class="inapp-b"><button type="button" class="copy" id="inappCopy">Copiar link</button><span class="small muted">e cole no '+IA.br+'</span></div>'+
      '<button type="button" class="linkbtn iag-stay" id="iagStay">Continuar aqui mesmo</button>'+
      '<p class="muted small">Aqui dá para consultar o mapa e entrar com e-mail e senha.</p>'+
    '</div></div>';
}
function iaGate(){if($('#iagate'))return;document.body.insertAdjacentHTML('beforeend',iaGateHTML());setTimeout(function(){var b=$('#iagGo')||$('#iagStay');if(b)b.focus({preventScroll:true})},60)}
if(ON_SITE&&INAPP){
  var _skipIA=false;try{_skipIA=sessionStorage.getItem('cse-inapp-x')==='1'}catch(e){}
  if(!_skipIA)iaGate();
  else{var app0=document.querySelector('.app');if(app0)app0.insertAdjacentHTML('afterbegin',inappHTML())}
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('#iagate')){var st=$('#iagStay');if(st)st.click()}});
  document.addEventListener('click',function(e){
    if(e.target.closest('#iagStay')){var g=$('#iagate');if(g)g.remove();try{sessionStorage.setItem('cse-inapp-x','1')}catch(_){}
      if(!$('#inapp')){var a=document.querySelector('.app');if(a)a.insertAdjacentHTML('afterbegin',inappHTML())}return}
    if(e.target.closest('#inappHow')){iaGate();return}
    if(e.target.closest('#inappX')){var b=$('#inapp');if(b)b.remove();try{sessionStorage.setItem('cse-inapp-x','1')}catch(_){}return}
    if(e.target.closest('#inappCopy')){var url=location.href.split('#')[0];
      var done=function(){gToast('Link copiado. Cole no '+(/Android/.test(navigator.userAgent)?'Chrome':'Safari')+'.')};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(done,function(){prompt('Copie o link:',url)});else prompt('Copie o link:',url)}
  });
  /* o Google recusa login nesses navegadores: explica em vez de abrir uma tela de erro */
  document.addEventListener('click',function(e){
    var g=e.target.closest('[data-goo]');if(!g)return;e.preventDefault();e.stopImmediatePropagation();
    gToast('O Google não deixa entrar por aqui. Abra no '+IA.br+' ou use "Entrar com e-mail".',1);
    iaGate();
  },true);
}
/* ---------- aviso de versão nova (site) ---------- */
function verCheck(){
  if(!ON_SITE||APP_VERSION==='dev'||!window.fetch)return;
  fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){
    if(!j||!j.v||j.v===APP_VERSION||$('#newver'))return;
    document.body.insertAdjacentHTML('beforeend','<div class="newver" id="newver" role="status"><span>Saiu uma versão nova do app.</span><button type="button" class="copy primary" id="newverGo">Atualizar</button></div>');
  }).catch(function(){});
}
/* "Atualizar": pede ao service worker a versão nova antes de recarregar (senão podia voltar a versão guardada) */
document.addEventListener('click',function(e){if(!e.target.closest('#newverGo'))return;var b=e.target.closest('#newverGo');b.disabled=true;b.textContent='Atualizando…';
  var rec=function(){location.reload()};try{if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration){navigator.serviceWorker.getRegistration().then(function(g){return g&&g.update()}).then(rec,rec);setTimeout(rec,4000);return}}catch(x){}rec()});
if(ON_SITE&&APP_VERSION!=='dev'){setTimeout(verCheck,4000);setInterval(verCheck,5*60000);document.addEventListener('visibilitychange',function(){if(!document.hidden)verCheck()})}
