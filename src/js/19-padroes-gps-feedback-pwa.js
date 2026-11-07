/* ======================= v23: a gestão define as configurações padrão ======================= */
GKEYS.push('padrao');GST.padrao=GST.padrao||{};if(!SH.on||!FBMODE){try{var _gp=JSON.parse(localStorage.getItem(GLS+'padrao'));if(_gp)GST.padrao=_gp}catch(e){}}
GTABS.splice(1,0,['padrao','Padrões do app']);TAB_PERM.padrao='admins';
var PAD_DEF={tema:'escuro',simples:true,faixa:10,perf:'auto',cover:'folha',fsize:'m',clima:true,telaCheia:null};
var PAD_OPTS={
  tema:['Tema',TEMAS.map(function(t){return [t[0],t[1]]})],
  simples:['Modo simplificado',[[true,'Ligado'],[false,'Desligado']]],
  faixa:['Horário do ônibus',[[0,'Exato'],[5,'Faixa de 5 min'],[10,'Faixa de 10 min']]],
  perf:['Desempenho',PERFS.map(function(p){return [p[0],p[1]]})],
  cover:['Capa ao abrir',COVERS.map(function(c){return [c[0],c[1]]}).concat([['none','Sem capa']])],
  fsize:['Tamanho do texto',FSIZES.map(function(f){return [f[0],f[1]]})],
  clima:['Previsão do tempo',[[true,'Mostrar'],[false,'Esconder']]],
  telaCheia:['Tela cheia no primeiro toque',[[null,'Automático (só no celular)'],[true,'Sempre'],[false,'Nunca']]]};
var PAD_KEYS=Object.keys(PAD_OPTS);
function padOk(k,v){return PAD_OPTS[k]&&PAD_OPTS[k][1].some(function(o){return o[0]===v})}
/* o que o próprio usuário escolheu não é sobrescrito pelo padrão */
if(!CFG.mine||typeof CFG.mine!=='object')CFG.mine={};
if(CFG.padV!==1){PAD_KEYS.forEach(function(k){if(k in CFG&&CFG[k]!==PAD_DEF[k]&&!(k==='tema'&&CFG.tema==='escuro'))CFG.mine[k]=1});CFG.padV=1;try{localStorage.setItem('cse-cfg',JSON.stringify(CFG))}catch(e){}}
var PAD_SNAP=null;
['click','change','input','keydown'].forEach(function(ev){document.addEventListener(ev,function(e){
  if(!e.isTrusted)return;if(e.target&&e.target.closest&&e.target.closest('#gestM'))return;
  var s={};PAD_KEYS.forEach(function(k){s[k]=CFG[k]});PAD_SNAP=s;setTimeout(function(){PAD_SNAP=null},1500)},true)});
function padApply(){
  var P=GST.padrao||{},v=P.v||{},ch=false;
  if(P.forcar&&P.forcar!==CFG.padForc){PAD_KEYS.forEach(function(k){if(k in v)delete CFG.mine[k]});CFG.padForc=P.forcar;ch=true}
  PAD_KEYS.forEach(function(k){if(!(k in v)||CFG.mine[k]||!padOk(k,v[k]))return;if(CFG[k]!==v[k]){CFG[k]=v[k];ch=true}});
  if(!ch)return;
  saveCfgSemMarcar();
  try{applyTheme()}catch(e){}try{applySimples()}catch(e){}try{applyPerf()}catch(e){}try{applyCoverStyle()}catch(e){}try{applyFont()}catch(e){}
  try{renderAll()}catch(e){}try{if(CFG.clima&&!CLIMA.d)climaLoad(false)}catch(e){}
  try{if(cfgM&&!cfgM.hidden)renderCfgKeep()}catch(e){}
}
aoFazer('dados da gestão aplicados',function(){padApply()});
padApply();
function gPadrao(){
  var v=(GST.padrao||{}).v||{};
  return '<h3 class="gh">Configurações padrão</h3><p class="muted small keep">Valem para quem ainda não mudou a opção em Ajustes. Quem já escolheu mantém a própria escolha, a menos que você aplique para todos.</p>'+
    '<form class="gform" data-gform="padrao">'+PAD_KEYS.map(function(k){var o=PAD_OPTS[k];
      return '<label class="gf">'+o[0]+'<select id="gPad_'+k+'"><option value="">Padrão do app ('+esc((o[1].filter(function(x){return x[0]===PAD_DEF[k]})[0]||['',''])[1])+')</option>'+
        o[1].map(function(x,i){return '<option value="'+i+'"'+((k in v)&&v[k]===x[0]?' selected':'')+'>'+esc(x[1])+'</option>'}).join('')+'</select></label>'}).join('')+
    '<label class="wsafe"><input type="checkbox" id="gPadForce"> Aplicar também a quem já mudou essas opções</label>'+
    '<div class="gbtns"><button type="submit" class="copy primary">Salvar padrões</button></div></form>'+
    ((GST.padrao||{}).forcar?'<p class="muted small keep">Última aplicação para todos: '+new Date((GST.padrao||{}).forcar).toLocaleString('pt-BR')+'.</p>':'');
}
aoFazer('gestão montada',function(){if(gTab==='padrao'&&$('#gBody')&&gcan('admins'))$('#gBody').innerHTML=gPadrao()});
document.addEventListener('submit',function(e){var f=e.target.closest&&e.target.closest('form[data-gform="padrao"]');if(!f)return;e.preventDefault();e.stopPropagation();
  var v={};PAD_KEYS.forEach(function(k){var s=$('#gPad_'+k);if(s&&s.value!=='')v[k]=PAD_OPTS[k][1][+s.value][0]});
  var o={v:v};var old=GST.padrao||{};if($('#gPadForce').checked)o.forcar=Date.now();else if(old.forcar)o.forcar=old.forcar;
  saveG('padrao',o);renderGest();
},true);
/* ======================= v25: a bússola usa o GPS ======================= */
/* 1) ponto de partida: a sua posição do GPS (já era); agora mostra a precisão e avisa quando ela é ruim.
   2) andando, o GPS dá o rumo real do movimento (sem interferência magnética). Com ele o app:
      - aprende a diferença entre a bússola deste celular e o rumo real e corrige a seta (fica salvo no aparelho);
      - usa o próprio rumo do GPS quando o aparelho não tem bússola. */
CMP.off=0;CMP.offN=0;
try{var _co=JSON.parse(localStorage.getItem('cse-cmp-off'));if(_co&&typeof _co.o==='number'&&Date.now()-(+_co.t||0)<30*864e5){CMP.off=_co.o;CMP.offN=Math.min(+_co.n||0,20)}}catch(e){}
var GPSC={prev:null,course:null,ct:0,speed:null};
function llDist(a,b){var k=Math.cos(a[0]*Math.PI/180),dx=(b[1]-a[1])*111320*k,dy=(b[0]-a[0])*110574;return {m:Math.hypot(dx,dy),brg:(Math.atan2(dx,dy)*180/Math.PI+360)%360}}
function gpsFix(c,t){
  var ll=[c.latitude,c.longitude],acc=c.accuracy||50,sp=typeof c.speed==='number'&&!isNaN(c.speed)?c.speed:null,crs=null;
  if(typeof c.heading==='number'&&!isNaN(c.heading)&&sp!=null&&sp>=0.7)crs=c.heading;
  if(GPSC.prev){var d=llDist(GPSC.prev.ll,ll),dt=(t-GPSC.prev.t)/1000;
    if(crs==null&&d.m>=Math.max(8,1.5*acc)&&dt>0){crs=d.brg;if(sp==null)sp=d.m/dt}
    if(d.m>=Math.max(8,1.5*acc)||t-GPSC.prev.t>20000)GPSC.prev={ll:ll,t:t}}
  else GPSC.prev={ll:ll,t:t};
  GPSC.speed=sp;
  if(crs==null||acc>25)return;
  GPSC.course=crs;GPSC.ct=t;
  /* aprende só andando a pé (0,7 a 2,5 m/s), com a bússola lendo agora e o celular apontado mais ou menos para a frente */
  if(sp!=null&&sp>=0.7&&sp<=2.5&&CMP.hRaw!=null&&t-CMP.tRaw<3000){
    var smp=norm180(crs-CMP.hRaw);
    if(Math.abs(norm180(smp-CMP.off))<45||CMP.offN<3){CMP.off=norm180(CMP.off+(CMP.offN<3?0.5:0.12)*norm180(smp-CMP.off));CMP.offN++;
      try{localStorage.setItem('cse-cmp-off',JSON.stringify({o:CMP.off,n:CMP.offN,t:t}))}catch(e){}}
  }
  /* sem bússola no aparelho: a direção do movimento vira a direção do celular */
  if(CMP.on&&(!CMP.got||Date.now()-(CMP.tRaw||0)>5000)&&sp!=null&&sp>=0.7){CMP.h=crs;CMP.gpsH=true;cmpSchedule()}
}
/* texto do cartão da bússola: precisão do GPS e se a seta já foi ajustada */
/* ======================= v26: feedback dos usuários + app instalável (PWA) ======================= */
var FBK_TIPOS=[['erro','Algo errado'],['ideia','Sugestão'],['elogio','Elogio'],['outro','Outro']];
var FBK_LOCAL='cse-feedback-local';
function fbkSave(o){
  o.ts=Date.now();o.ver=APP_VERSION;o.tela=(location.hash||'#mapa').slice(0,30);o.disp=/android/i.test(navigator.userAgent)?'android':/iphone|ipad/i.test(navigator.userAgent)?'ios':'outro';
  if(SH.uid)o.uid=SH.uid;
  try{var last=+localStorage.getItem('cse-fbk-ult')||0;if(Date.now()-last<60000&&o.txt)return Promise.reject({code:'rate'})}catch(e){}
  var done=function(){try{localStorage.setItem('cse-fbk-ult',String(Date.now()))}catch(e){}};
  if(FB_ON)return fbInit().then(function(fb){return fb.db.collection('feedback').add(o)}).then(done);
  try{var a=JSON.parse(localStorage.getItem(FBK_LOCAL)||'[]');a.unshift(o);localStorage.setItem(FBK_LOCAL,JSON.stringify(a.slice(0,200)))}catch(e){}
  done();return Promise.resolve();
}
function fbkOpen(nota){
  var el=$('#fbkSheet');
  if(!el){document.body.insertAdjacentHTML('beforeend','<div class="la-wrap" id="fbkSheet" role="dialog" aria-modal="true" aria-labelledby="fbkT" hidden><div class="la-box"></div></div>');el=$('#fbkSheet')}
  el.querySelector('.la-box').innerHTML='<p class="eyebrow keep">Feedback</p><h2 id="fbkT">Conte para a gente</h2><p class="la-p">Achou um erro, tem uma ideia ou quer elogiar? A equipe lê tudo.</p>'+
    '<div class="seg" role="radiogroup" aria-label="Tipo">'+FBK_TIPOS.map(function(t,i){return '<button type="button" data-fbkt="'+t[0]+'" aria-pressed="'+(i===0)+'">'+t[1]+'</button>'}).join('')+'</div>'+
    '<label class="fld">Sua mensagem<textarea id="fbkTxt" rows="5" maxlength="1000" placeholder="Ex.: o horário da Linha 2 no CT estava errado hoje às 18h"></textarea></label>'+
    (ACC.email?'<label class="wsafe"><input type="checkbox" id="fbkMail"> Pode me responder em '+esc(ACC.email)+'</label>':'')+
    '<div class="la-btns"><button type="button" class="lg-btn pri" id="fbkSend">Enviar</button></div><button type="button" class="la-no" data-fbkclose>Cancelar</button>'+
    '<p class="la-priv">Enviamos junto só a tela em que você estava, a versão do app e o tipo de aparelho.</p>';
  el.dataset.nota=nota||'';el.hidden=false;setTimeout(function(){var t=$('#fbkTxt');if(t)t.focus()},40);
}
function fbkClose(){var el=$('#fbkSheet');if(el)el.hidden=true}
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-fbk],[data-fbkt],#fbkSend,[data-fbkclose],[data-fbnota],[data-fbqno]');if(!t){var s=$('#fbkSheet');if(s&&!s.hidden&&e.target===s)fbkClose();return}
  if(t.hasAttribute('data-fbk')){fbkOpen();return}
  if(t.dataset.fbkt){t.parentNode.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',b===t)});return}
  if(t.hasAttribute('data-fbkclose')){fbkClose();return}
  if(t.id==='fbkSend'){
    var txt=($('#fbkTxt').value||'').trim();if(txt.length<3){gToast('Escreva sua mensagem.');return}
    var tp=($('#fbkSheet [data-fbkt][aria-pressed="true"]')||{dataset:{fbkt:'outro'}}).dataset.fbkt,o={tipo:tp,txt:txt.slice(0,1000)};
    var n=+$('#fbkSheet').dataset.nota;if(n)o.nota=n;var m=$('#fbkMail');if(m&&m.checked)o.email=ACC.email;
    t.disabled=true;t.textContent='Enviando…';
    fbkSave(o).then(function(){fbkClose();gToast('Obrigado! Sua mensagem chegou à equipe.')},function(err){t.disabled=false;t.textContent='Enviar';gToast(err&&err.code==='rate'?'Espere um minuto para enviar outra mensagem.':'Não deu para enviar agora. Tente de novo.',1)});
    return}
  if(t.dataset.fbnota){var nv=+t.dataset.fbnota;try{localStorage.setItem('cse-fbq-ate',String(Date.now()+14*864e5))}catch(x){}
    var q=$('#fbQ');fbkSave({tipo:'nota',nota:nv}).catch(function(){});
    if(q)q.innerHTML='<p><b>Obrigado!</b><small>'+(nv<=3?'O que podemos melhorar?':'Quer contar mais alguma coisa?')+'</small></p><button type="button" class="copy primary" data-fbk>Contar</button><button type="button" class="la-x" data-fbqno>Fechar</button>';
    return}
  if(t.hasAttribute('data-fbqno')){try{localStorage.setItem('cse-fbq-ate',String(Date.now()+14*864e5))}catch(x){}var q2=$('#fbQ');if(q2)q2.remove()}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')fbkClose()});
/* pergunta curta a partir da 4ª visita (dias diferentes), no máximo a cada 14 dias */
function fbqShow(){
  if((+VIS.n||0)<4||$('#fbQ')||$('#laNudge'))return;var ate=0;try{ate=+localStorage.getItem('cse-fbq-ate')||0}catch(e){}if(Date.now()<ate)return;
  if(!login.hidden||!cover.hidden||!cfgM.hidden)return;
  document.body.insertAdjacentHTML('beforeend','<div class="la-nudge fbq" id="fbQ" role="region" aria-label="Pergunta rápida"><p><b>O app te ajudou hoje?</b><small>De 1 (nada) a 5 (muito)</small></p><div class="fbq-n">'+[1,2,3,4,5].map(function(n){return '<button type="button" data-fbnota="'+n+'" aria-label="Nota '+n+'">'+n+'</button>'}).join('')+'</div><button type="button" class="la-x" data-fbqno aria-label="Agora não">✕</button></div>');
}
setTimeout(fbqShow,45000);
/* Ajustes: seção "Fale com a gente" e "Instalar o app" */
var PWA={evt:null};
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();PWA.evt=e;if(cfgM&&!cfgM.hidden)renderCfgKeep()});
window.addEventListener('appinstalled',function(){PWA.evt=null;gToast('App instalado! Abra pelo ícone na tela inicial.');if(cfgM&&!cfgM.hidden)renderCfgKeep()});
function pwaStandalone(){return (window.matchMedia&&matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches)||navigator.standalone===true}
function pwaHTML(){
  if(!ON_SITE)return '';
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),h='<div class="accsec" id="pwasec"><h2>Instalar o app</h2>';
  if(pwaStandalone())return h+'<p class="small keep"><span class="pill good">Instalado</span> Você está usando o app instalado.</p></div>';
  if(PWA.evt)return h+'<p class="small keep">Ícone na tela inicial, tela cheia e funciona mesmo sem internet.</p><div class="row"><button type="button" class="copy primary" id="pwaGo">Instalar o app</button></div></div>';
  if(ios)return h+'<p class="small keep">No Safari, toque em <b>Compartilhar</b> (o quadrado com a seta) e depois em <b>Adicionar à Tela de Início</b>. O app abre em tela cheia e funciona sem internet.</p></div>';
  return h+'<p class="small keep">No menu do navegador, escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p></div>';
}
function fbkCfgHTML(){return '<div class="accsec" id="fbksec"><h2>Fale com a gente</h2><p class="small keep">Achou um erro ou tem uma ideia? Sua mensagem vai direto para a equipe.</p><div class="row"><button type="button" class="copy primary" data-fbk>Algo errado? Conte aqui</button></div></div>'}
aoFazer('ajustes montados',function(f){var a=$('#alsec')||$('#accsec');if(a&&!$('#fbksec'))a.insertAdjacentHTML('afterend',fbkCfgHTML()+pwaHTML())});
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#pwaGo')&&PWA.evt){PWA.evt.prompt();PWA.evt.userChoice.then(function(){PWA.evt=null;renderCfgKeep()},function(){})}});
/* service worker: só no site publicado (https) */
if(ON_SITE&&'serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')&&APP_VERSION!=='dev'){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
}
/* Gestão › Feedback */
GTABS.push(['feedback','Feedback']);TAB_PERM.feedback='avisos';
var FBKG={list:null,busy:false};
function fbkLoad(){
  if(FBKG.busy)return;FBKG.busy=true;
  var p=FB_ON?fbInit().then(function(fb){return fb.db.collection('feedback').limit(500).get()}).then(function(s){return s.docs.map(function(d){var o=d.data();o.id=d.id;return o}).sort(function(x,y){return (y.ts||0)-(x.ts||0)})}):Promise.resolve((function(){try{return JSON.parse(localStorage.getItem(FBK_LOCAL)||'[]').map(function(o,i){o.id='l'+i;return o})}catch(e){return []}})());
  p.then(function(l){FBKG.list=l;FBKG.busy=false;if(gTab==='feedback')renderGest()},function(){FBKG.list=[];FBKG.err=true;FBKG.busy=false;if(gTab==='feedback')renderGest()});
}
function gFeedback(){
  if(!FBKG.list){fbkLoad();return '<h3 class="gh">Feedback</h3><p class="muted small keep">Carregando…</p>'}
  var L=FBKG.list,notas=L.filter(function(o){return o.nota}),med=notas.length?(notas.reduce(function(s,o){return s+o.nota},0)/notas.length).toFixed(1).replace('.',','):'—';
  var cnt={};L.forEach(function(o){cnt[o.tipo]=(cnt[o.tipo]||0)+1});
  var nomes={erro:'Algo errado',ideia:'Sugestão',elogio:'Elogio',outro:'Outro',nota:'Só nota'};
  return '<h3 class="gh">Feedback</h3>'+(FBKG.err?'<p class="small keep">Sem acesso ao feedback. Publique as regras do Firestore (firestore.rules) no console do Firebase.</p>':'')+
    '<div class="la-nums fbk-sum"><span><b>'+L.length+'</b>respostas</span><span><b>'+med+'</b>nota média ('+notas.length+')</span><span><b>'+(cnt.erro||0)+'</b>erros</span><span><b>'+(cnt.ideia||0)+'</b>sugestões</span></div>'+
    '<div class="row"><button type="button" class="copy" id="fbkReload">Atualizar</button></div>'+
    '<ul class="fbk-list">'+L.filter(function(o){return o.txt}).map(function(o){return '<li><div class="fbk-h"><span class="pill">'+(nomes[o.tipo]||esc(o.tipo))+'</span>'+(o.nota?'<span class="pill">nota '+o.nota+'</span>':'')+'<small>'+new Date(o.ts).toLocaleString('pt-BR')+' · '+esc(o.tela||'')+' · '+esc(o.disp||'')+' · v'+esc(o.ver||'')+'</small></div><p>'+esc(o.txt)+'</p>'+(o.email?'<p class="small"><a href="mailto:'+esc(o.email)+'">Responder: '+esc(o.email)+'</a></p>':'')+'<button type="button" class="linkbtn" data-fbkdel="'+esc(o.id)+'">Apagar</button></li>'}).join('')+'</ul>'+
    (L.some(function(o){return o.txt})?'':'<p class="muted small keep">Nenhuma mensagem ainda.</p>');
}
aoFazer('gestão montada',function(){if(gTab==='feedback'&&$('#gBody')&&gcan('avisos'))$('#gBody').innerHTML=gFeedback()});
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('#fbkReload')){FBKG.list=null;renderGest();return}
  var d=e.target.closest&&e.target.closest('[data-fbkdel]');if(!d)return;var id=d.dataset.fbkdel;
  var p=FB_ON?fbInit().then(function(fb){return fb.db.collection('feedback').doc(id).delete()}):Promise.resolve((function(){try{var a=JSON.parse(localStorage.getItem(FBK_LOCAL)||'[]');a.splice(+id.slice(1),1);localStorage.setItem(FBK_LOCAL,JSON.stringify(a))}catch(x){}})());
  p.then(function(){FBKG.list=null;renderGest();gToast('Mensagem apagada.')},function(){gToast('Não deu para apagar.',1)});
});
