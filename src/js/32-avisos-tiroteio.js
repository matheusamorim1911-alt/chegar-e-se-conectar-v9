/* ======================= Notificações de tiroteio (Web Push) =======================
   Ajustes › Segurança no caminho › "Notificar tiroteios novos": o aparelho assina no Worker (/push/assinar) e o Worker,
   pelo gatilho a cada 5 min, avisa quando o Fogo Cruzado registra tiroteio novo (últimas 2 h) perto das saídas da ilha.
   O aviso chega sem conteúdo e o service worker (sw.js) busca onde e quando foi. No iPhone, só com o app na Tela de
   Início (iOS 16.4 ou mais novo). Guardado no aparelho em cse-push ({on, e: endereço, k: chave do Worker}). */
var PUSH={url:LIVE.url?LIVE.url.replace(/\/$/,'')+'/push':'',busy:false,msg:''};
function pushSuportado(){return ON_SITE&&!!PUSH.url&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window}
function pushIosSemInstalar(){return instPlataforma()==='ios'&&!pwaStandalone()}
function pushGuardado(){try{return JSON.parse(localStorage.getItem('cse-push')||'null')}catch(e){return null}}
function pushGuarda(v){try{if(v)localStorage.setItem('cse-push',JSON.stringify(v));else localStorage.removeItem('cse-push')}catch(e){}}
function pushPermissao(){try{return Notification.permission}catch(e){return 'default'}}
function pushLigado(){var g=pushGuardado();return !!(g&&g.on)&&pushPermissao()==='granted'}
function pushBytes(t){t=String(t).replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';var s=atob(t),a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a}
function pushMesmaChave(s,chave){var k=s&&s.options&&s.options.applicationServerKey;if(!k)return true;var a=new Uint8Array(k),b=pushBytes(chave);
  if(a.length!==b.length)return false;for(var i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true}
function pushPost(rota,endpoint){/* text/plain: pedido simples, sem consulta prévia de CORS */
  return fetch(PUSH.url+'/'+rota,{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({endpoint:endpoint})}).then(function(r){return r.json().catch(function(){return {}}).then(function(j){j.status=r.status;return j})})}
function pushChave(){return fetch(PUSH.url+'/chave',{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){if(!j||!j.disponivel||!j.chave)throw new Error('servidor');return j.chave})}
/* assina (ou confirma a assinatura) neste aparelho; "calado" não mexe na mensagem da tela */
function pushAssina(chave){
  return navigator.serviceWorker.ready.then(function(reg){
    return reg.pushManager.getSubscription().then(function(s){
      if(s&&!pushMesmaChave(s,chave))return s.unsubscribe().then(function(){return null});/* o Worker trocou de chave: assina de novo */
      return s}).then(function(s){return s||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushBytes(chave)})})})
  .then(function(s){var g=pushGuardado();
    if(g&&g.on&&g.e===s.endpoint&&g.k===chave)return s;/* nada mudou: não grava de novo no Worker */
    return pushPost('assinar',s.endpoint).then(function(j){if(!j.ok)throw new Error('servidor');pushGuarda({on:true,e:s.endpoint,k:chave,t:Date.now()});return s})});
}
function pushLiga(){
  if(PUSH.busy)return;PUSH.busy=true;PUSH.msg='';pushPinta();
  Promise.resolve(Notification.requestPermission()).then(function(p){if(p!=='granted')throw new Error(p==='denied'?'negado':'sem-resposta');return pushChave()})
  .then(pushAssina).then(function(){
    if(CFG.tiroteios!==true){CFG.tiroteios=true;saveCfg();tiroLoop();tiroRepaint();var c=$('#cfgTiro');if(c)c.checked=true}
    PUSH.msg='Pronto. Você vai receber um aviso quando houver tiroteio novo perto do Fundão.'})
  .catch(function(e){var m=String(e&&e.message||e);pushGuarda(null);
    PUSH.msg=m==='negado'?'As notificações estão bloqueadas para este site. Libere nos ajustes do navegador e tente de novo.':m==='sem-resposta'?'Sem permissão para notificar. Tente de novo.':m==='servidor'?'As notificações ainda não foram ativadas no servidor do app.':'Não deu para ligar as notificações agora. Tente de novo.'})
  .then(function(){PUSH.busy=false;pushPinta()});
}
function pushDesliga(){
  if(PUSH.busy)return;PUSH.busy=true;pushPinta();var g=pushGuardado();
  navigator.serviceWorker.ready.then(function(reg){return reg.pushManager.getSubscription()}).then(function(s){var e=(s&&s.endpoint)||(g&&g.e);
    return Promise.all([s?s.unsubscribe():null,e?pushPost('sair',e).catch(function(){}):null])}).catch(function(){})
  .then(function(){pushGuarda(null);PUSH.busy=false;PUSH.msg='Notificações de tiroteio desligadas.';pushPinta()});
}
function pushTeste(){var g=pushGuardado();if(!g||PUSH.busy)return;PUSH.busy=true;pushPinta();
  pushPost('teste',g.e).then(function(j){PUSH.msg=j.ok?'Aviso de teste enviado. Ele chega em alguns segundos.':j.status===429?'Espere um minuto para mandar outro teste.':j.status===404?'Este aparelho não está mais inscrito. Desligue e ligue de novo.':'O serviço de notificações recusou o teste. Desligue e ligue de novo.'},
    function(){PUSH.msg='Sem conexão com o servidor do app.'}).then(function(){PUSH.busy=false;pushPinta()})}
function pushHTML(){
  if(!ON_SITE||!PUSH.url)return '';
  var desc='Avisa no celular quando o Fogo Cruzado registra tiroteio perto das saídas da ilha, mesmo com o app fechado.';
  if(pushIosSemInstalar())return '<div class="push-ios"><span class="grow"><b>Notificar tiroteios novos</b><small>No iPhone, as notificações só funcionam com o app na Tela de Início.</small></span><button type="button" class="copy" id="pushInst">Como instalar</button></div>';
  if(!pushSuportado())return '<p class="muted small keep">Este navegador não recebe notificações do app.</p>';
  var on=pushLigado(),h=tg('cfgPush',on,'Notificar tiroteios novos',desc);
  if(PUSH.busy)h=h.replace('id="cfgPush"','id="cfgPush" disabled');
  if(pushPermissao()==='denied'&&!PUSH.msg)PUSH.msg='As notificações estão bloqueadas para este site. Libere nos ajustes do navegador.';
  return '<div class="tgls">'+h+'</div>'+(on?'<div class="row gbtns"><button type="button" class="copy" id="pushTeste"'+(PUSH.busy?' disabled':'')+'>Mandar um teste</button></div>':'')+
    '<p class="muted small keep push-msg" role="status">'+(PUSH.busy?'Aguarde…':esc(PUSH.msg))+'</p>';
}
function pushPinta(){var b=$('#pushBox');if(b)b.innerHTML=pushHTML()}
aoFazer('ajustes montados',function(){var s=$('#tirosec');if(!s||$('#pushBox'))return;var t=s.querySelector('.tgls');
  (t||s.querySelector('h2')).insertAdjacentHTML('afterend','<div id="pushBox">'+pushHTML()+'</div>')});
document.addEventListener('change',function(e){if(e.target.id!=='cfgPush')return;if(e.target.checked)pushLiga();else pushDesliga()});
document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('#pushTeste,#pushInst');if(!t)return;if(t.id==='pushTeste')pushTeste();else instAbre()});
/* ao abrir: permissão retirada nos ajustes do aparelho desliga aqui também; endereço ou chave trocados assinam de novo */
setTimeout(function(){var g=pushGuardado();if(!g||!g.on||!pushSuportado())return;
  if(pushPermissao()!=='granted'){pushGuarda(null);pushPinta();return}
  pushChave().then(pushAssina).catch(function(){})},5000);
