/* ======================= v18: motivos para entrar com uma conta ======================= */
function contaOk(){return ACC.kind==='google'||ACC.kind==='claude'}
function semConta(){return FB_ON&&!contaOk()}
function askBtn(why,label,cls){return '<button type="button" class="copy primary la-ask'+(cls?' '+cls:'')+'" data-ask="'+why+'">'+label+'</button>'}
var LA_WHY={
  fila:['Entre para informar a fila','Para evitar relatos falsos, só quem tem conta informa a fila. Seu nome não aparece para ninguém.'],
  wifi:['Entre para sua nota contar','Sem conta, a nota fica só neste aparelho. Com conta, ela entra na média que todo mundo vê.'],
  avisos:['Entre para enviar avisos','Com conta, seus avisos aparecem para todos no mapa. Seu nome não aparece.'],
  alertas:['Entre para receber alertas','Alertas do seu ônibus, de chuva e da fila do RU ficam ligados à sua conta.'],
  noite:['Entre para avisar alguém','Com conta, você manda para alguém de confiança de onde saiu, qual ônibus pegou e quando deve chegar.'],
  lembrete:['Leve o app com você','Com uma conta, nada do que você configurou se perde ao trocar de celular.']};
var LA_BEN=[['sync','Ajustes, trajeto favorito e grade em qualquer aparelho'],['bell','Alertas do seu ônibus, de chuva e da fila do RU'],['moon','Volta à noite: avise alguém de confiança'],['users','Informe fila, Wi-Fi e avisos para todo mundo']];
var LA_IC={sync:'<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'};
function laBenHTML(){return '<ul class="la-ben">'+LA_BEN.map(function(b){return '<li><svg viewBox="0 0 24 24" aria-hidden="true">'+LA_IC[b[0]]+'</svg><span>'+b[1]+'</span></li>'}).join('')+'</ul>'}
function loginAsk(why){
  var w=LA_WHY[why]||LA_WHY.lembrete,el=$('#laSheet');
  if(!el){document.body.insertAdjacentHTML('beforeend','<div class="la-wrap" id="laSheet" role="dialog" aria-modal="true" aria-labelledby="laT" hidden><div class="la-box"></div></div>');el=$('#laSheet')}
  el.querySelector('.la-box').innerHTML='<p class="eyebrow keep">Conta</p><h2 id="laT">'+w[0]+'</h2><p class="la-p">'+w[1]+'</p>'+laBenHTML()+
    (FB_ON?'<div class="la-btns"><button type="button" class="lg-btn pri" data-goo data-laclose>Entrar com Google</button><button type="button" class="copy la-mail" data-mail data-laclose>Entrar com e-mail</button></div>':'<p class="la-p">Abra o app pelo site publicado para entrar com uma conta.</p>')+
    '<button type="button" class="la-no" data-laclose>Agora não</button><p class="la-priv">Usamos seu nome e e-mail só para guardar seus dados. Veja tudo em Ajustes › Conta › Seus dados.</p>';
  el.hidden=false;LA_PREV=document.activeElement;setTimeout(function(){var b=el.querySelector('[data-goo],.la-no');if(b)b.focus({preventScroll:true})},30);
}
var LA_PREV=null;
function loginAskClose(){var el=$('#laSheet');if(el&&!el.hidden){el.hidden=true;if(LA_PREV&&LA_PREV.focus)try{LA_PREV.focus({preventScroll:true})}catch(e){}}}
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('[data-ask]');if(a){e.preventDefault();loginAsk(a.dataset.ask);return}
  var c=e.target.closest&&e.target.closest('[data-laclose]');if(c){setTimeout(loginAskClose,0)}
  var s=$('#laSheet');if(s&&!s.hidden&&e.target===s)loginAskClose();
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')loginAskClose()});
/* fila: o botão Informar aparece também para quem não entrou e leva ao pedido de conta */
/* contribuições: contagem guardada na conta */
var CONTRIB={fila:0,avisos:0,pedidos:0};try{var _c=JSON.parse(localStorage.getItem('cse-contrib'));if(_c&&typeof _c==='object')Object.keys(CONTRIB).forEach(function(k){CONTRIB[k]=+_c[k]||0})}catch(e){}
function saveContrib(){try{localStorage.setItem('cse-contrib',JSON.stringify(CONTRIB))}catch(e){}}
function contribTotal(){return CONTRIB.fila+CONTRIB.avisos+CONTRIB.pedidos+Object.keys(mine||{}).length}
function seloOf(n){return n>=20?['Guia do Fundão','good']:n>=5?['Colaborador frequente','good']:n>=1?['Colaborador','']:['Ainda sem contribuições','']}
function contribHTML(){
  var n=contribTotal(),s=seloOf(n),nx=n<1?1:n<5?5:n<20?20:0;
  return '<div class="la-contrib"><div class="la-ch"><b>Suas contribuições</b><span class="pill '+s[1]+'">'+s[0]+'</span></div>'+
    '<div class="la-nums"><span><b>'+CONTRIB.fila+'</b>filas</span><span><b>'+Object.keys(mine||{}).length+'</b>notas de Wi-Fi</span><span><b>'+CONTRIB.avisos+'</b>avisos</span><span><b>'+CONTRIB.pedidos+'</b>pedidos</span></div>'+
    '<p class="small keep la-p">'+(n?'Obrigado! Cada aviso ajuda quem está chegando agora.':'Informe a fila do RU ou dê nota a uma rede Wi-Fi para começar.')+(nx?' Faltam '+(nx-n)+' para o selo “'+seloOf(nx)[0]+'”.':'')+'</p></div>';
}
/* contato de confiança (Volta à noite) */
var CONT={nome:'',tel:''};try{var _ct=JSON.parse(localStorage.getItem('cse-contato'));if(_ct&&typeof _ct==='object'){CONT.nome=String(_ct.nome||'').slice(0,40);CONT.tel=String(_ct.tel||'').slice(0,20)}}catch(e){}
function saveCont(){try{localStorage.setItem('cse-contato',JSON.stringify(CONT))}catch(e){}if(contaOk())accQueue()}
function telDig(t){var d=String(t||'').replace(/\D/g,'');if(d.length===10||d.length===11)d='55'+d;return d.length>=12?d:''}
function nightMsg(kind,from,now){
  var hi=CONT.nome?'Oi, '+CONT.nome+'! ':'',dest=nightDest(),vila=dest!=='est',onde=vila?'na Vila Residencial':'na Estação BRT';
  if(kind==='cheguei')return hi+'Cheguei bem '+onde+'. (Chega aí UFRJ)';
  if(from===dest)return hi+(vila?'Estou no ponto '+(STOPS[dest].short||STOPS[dest].name)+', indo a pé para a Vila Residencial agora':'Estou na Estação BRT do Fundão saindo agora')+'. Te aviso quando chegar. (Chega aí UFRJ)';
  var o=options(from,dest,now)[0]||lastTo(from,dest)[0];
  return hi+'Estou saindo de '+STOPS[from].name+' agora'+(o?'. Vou pegar a Linha '+o.lid+' ('+LINES[o.lid].name+') por volta de '+hm(Math.round(o.dep))+' e devo chegar '+(vila?'no ponto '+(STOPS[dest].short||STOPS[dest].name)+', perto da Vila Residencial,':'na Estação BRT')+' perto de '+hm(Math.round(o.arr)):'')+'. Te aviso quando chegar. (Chega aí UFRJ)';
}
function hm(m){m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function nightSend(kind){
  var txt=nightMsg(kind,state.nightFrom||state.to,nowMin()),d=telDig(CONT.tel);
  if(d){window.open('https://wa.me/'+d+'?text='+encodeURIComponent(txt),'_blank','noopener');return}
  if(navigator.share){navigator.share({text:txt}).catch(function(){});return}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){gToast('Mensagem copiada. Cole no app de mensagens.')},function(){gToast(txt)});else gToast(txt);
}
function nightShareHTML(){
  var h='<h3>Avise alguém de confiança</h3>';
  if(!contaOk())return h+'<div class="la-lock"><p class="small keep">Mande para alguém de onde você está saindo, qual ônibus vai pegar e quando deve chegar. Depois, avise que chegou bem.</p>'+(FB_ON?askBtn('noite','Entrar para usar'):'')+'</div>';
  return h+'<div class="la-night"><p class="small keep">'+(CONT.nome||CONT.tel?'Enviar para <b>'+esc(CONT.nome||'seu contato')+'</b>'+(telDig(CONT.tel)?' pelo WhatsApp':'')+'.':'Escolha o app na hora de enviar, ou cadastre um contato.')+' <button type="button" class="linkbtn" data-ctedit>'+(CONT.nome||CONT.tel?'Trocar':'Cadastrar contato')+'</button></p>'+
    '<div class="row"><button type="button" class="copy primary" data-nsend="saindo">Avisar que estou saindo</button><button type="button" class="copy" data-nsend="cheguei">Avisar que cheguei</button></div></div>';
}
document.addEventListener('click',function(e){
  var s=e.target.closest&&e.target.closest('[data-nsend]');if(s){if(contaOk())nightSend(s.dataset.nsend);else loginAsk('noite');return}
  if(e.target.closest&&e.target.closest('[data-ctedit]')){openCfg();setTimeout(function(){var f=$('#ctNome');if(f){f.scrollIntoView({block:'center'});f.focus({preventScroll:true})}},120)}
});
/* alertas (só com conta): funcionam com o app aberto, mesmo em outra aba */
function alertasHTML(){
  var h='<div class="accsec la-al" id="alsec"><h2>Alertas</h2>';
  if(!contaOk())return h+'<div class="la-lock"><p class="small keep">Receba um aviso quando for chover e quando a fila do RU estiver curta.</p>'+(FB_ON?askBtn('alertas','Entrar para ativar'):'<p class="muted small keep">Disponível ao entrar com uma conta.</p>')+'</div></div>';
  var perm=('Notification' in window)?Notification.permission:'na';
  h+='<div class="tgls">'+
    tg('cfgAlChuva',CFG.alChuva,'Chuva chegando','Quando a chance de chuva passar de 60% na próxima hora.')+
    tg('cfgAlFila',CFG.alFila,'Fila do RU curta','Entre 11h e 14h, quando alguém informar fila pequena ou sem fila.')+'</div>'+
    (perm==='default'?'<div class="accmail"><div class="row"><button type="button" class="copy primary" id="alPerm">Permitir notificações do aparelho</button></div></div>':'')+
    '<p class="muted small keep">Os alertas aparecem enquanto o app estiver aberto, mesmo em outra aba'+(perm==='granted'?', também como notificação':'')+'. Com o app fechado, ainda não.</p>';
  h+='<h3 class="la-h3">Contato de confiança</h3><p class="muted small keep">Usado em Volta à noite. Com telefone, a mensagem abre no WhatsApp.</p>'+
    '<div class="la-ct"><label class="fld">Nome<input id="ctNome" type="text" maxlength="40" autocomplete="off" value="'+esc(CONT.nome)+'" placeholder="Ex.: Mãe"></label><label class="fld">Celular (opcional)<input id="ctTel" type="tel" inputmode="tel" maxlength="20" autocomplete="off" value="'+esc(CONT.tel)+'" placeholder="(21) 9…"></label></div>';
  return h+'</div>';
}
document.addEventListener('input',function(e){if(e.target.id==='ctNome'){CONT.nome=e.target.value.slice(0,40);saveCont()}else if(e.target.id==='ctTel'){CONT.tel=e.target.value.slice(0,20);saveCont()}});
document.addEventListener('change',function(e){
  var m={cfgAlChuva:'alChuva',cfgAlFila:'alFila'}[e.target.id];if(!m)return;
  CFG[m]=e.target.checked;saveCfg();if(m==='alChuva'&&CFG.alChuva&&!CLIMA.d)climaLoad(false);
  if(e.target.checked&&('Notification' in window)&&Notification.permission==='default')try{Notification.requestPermission().then(renderCfgKeep)}catch(x){}
  renderCfgKeep();alCheck();
});
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('#alPerm')){try{Notification.requestPermission().then(renderCfgKeep)}catch(x){}}
});
var ALF={};try{ALF=JSON.parse(sessionStorage.getItem('cse-alf'))||{}}catch(e){ALF={}}
function alFire(key,title,body){
  if(ALF[key])return false;ALF[key]=Date.now();try{sessionStorage.setItem('cse-alf',JSON.stringify(ALF))}catch(e){}
  gToast(title+' · '+body);try{if(navigator.vibrate)navigator.vibrate([120,60,120])}catch(e){}
  if(document.hidden&&('Notification' in window)&&Notification.permission==='granted')try{new Notification(title,{body:body,tag:key})}catch(e){}
  return true;
}
function alCheck(){
  if(!contaOk())return;
  var now=nowMin(),day=new Date().toISOString().slice(0,10);
  if(CFG.alChuva){var c=climaChuva();if(c&&c.h*60-now<=60&&c.h*60-now>=-30)alFire('chuva:'+day+':'+c.h,'Chuva chegando',c.p+'% de chance por volta das '+String(c.h).padStart(2,'0')+'h. Leve guarda-chuva.')}
  if(CFG.alFila&&now>=660&&now<=840)RUS.forEach(function(k){var f=filaOf(k);if(f&&f.n<=1)alFire('fila:'+day+':'+k,PL[k].name+': '+(f.n?'fila pequena':'sem fila'),'Informado '+agoTxt(f.last)+'.')});
}
setInterval(alCheck,30000);setTimeout(alCheck,4000);
/* Ajustes › Conta: contribuições, benefícios e seus dados */
function dadosHTML(){
  var g=ACC.kind==='google';
  return '<details class="la-dados"><summary>Seus dados e privacidade</summary><div class="la-dd">'+
    '<p class="small keep"><b>O que fica guardado na sua conta:</b></p><ul class="small">'+
    (g?'<li>Nome, e-mail e o link da foto (vindos do Google ou do seu cadastro).</li><li>Data da primeira e da última visita e quantas vezes entrou (para controlar as vagas).</li>':'<li>Seu nome e foto, vindos da conta do claude.ai.</li>')+
    '<li>Ajustes, trajeto favorito'+(g?', grade de aulas':'')+', contato de confiança e a contagem de contribuições.</li>'+
    '<li>Filas, avisos, notas de Wi-Fi e pedidos que você enviou. Os outros veem esses dados sem o seu nome; a gestão consegue ligar cada um à sua conta para combater abuso.</li></ul>'+
    '<p class="small keep"><b>O que não guardamos:</b> sua localização exata. O mapeamento do Wi-Fi é opcional e envia só a área aproximada (30 m), sem dizer quem você é.</p>'+
    '<p class="small keep">Nada disso é vendido ou repassado. O uso é só o funcionamento do app (LGPD, art. 7º).</p>'+
    (g?'<div class="row"><button type="button" class="copy" id="laExport">Baixar meus dados</button><button type="button" class="copy la-del" id="laDelete">Apagar meus dados e a conta</button></div>':'')+'</div></details>';
}
aoFazer('ajustes montados',function(f){var a=$('#accsec');if(a&&!$('#alsec'))a.insertAdjacentHTML('afterend',alertasHTML())});
function myDocs(){var u=SH.uid||ACC.uid;return ['usuarios/'+u,'votes/'+u,'fila/'+u,'reports/'+u,'requests/'+u]}
function laExport(){
  var db=ACC.fb&&ACC.fb.db;if(!db)return;
  Promise.all(myDocs().map(function(p){return db.doc(p).get().then(function(d){return [p.split('/')[0],d.exists?d.data():null]},function(){return [p.split('/')[0],'sem acesso']})})).then(function(r){
    var o={app:'Chega aí UFRJ',geradoEm:new Date().toISOString(),conta:{uid:ACC.uid,nome:ACC.name,email:ACC.email,foto:ACC.photo},nesteAparelho:{ajustes:CFG,contato:CONT,contribuicoes:CONTRIB}};
    r.forEach(function(x){o[x[0]]=x[1]});
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}));a.download='meus-dados-chega-ai-ufrj.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000);
    gToast('Arquivo com seus dados baixado.');
  });
}
var LA_DEL=0;
function laDelete(b){
  if(Date.now()-LA_DEL>6000){LA_DEL=Date.now();b.textContent='Toque de novo para apagar tudo';b.classList.add('arm');setTimeout(function(){if(b.isConnected){b.textContent='Apagar meus dados e a conta';b.classList.remove('arm')}},6000);return}
  LA_DEL=0;var fb=ACC.fb,u=fb&&fb.auth.currentUser;if(!u)return;b.disabled=true;b.textContent='Apagando…';
  Promise.all(myDocs().map(function(p){return fb.db.doc(p).delete().catch(function(){})})).then(function(){
    CONTRIB={fila:0,avisos:0,pedidos:0};saveContrib();CONT={nome:'',tel:''};try{localStorage.removeItem('cse-contato')}catch(e){}
    return u.delete().then(function(){gToast('Seus dados e a sua conta foram apagados.')},function(e){
      if(e&&e.code==='auth/requires-recent-login'){gToast('Seus dados foram apagados. Para apagar também a conta, saia, entre de novo e repita.',1)}else gToast('Seus dados foram apagados, mas a conta não. Tente de novo mais tarde.',1);
      b.disabled=false;b.textContent='Apagar meus dados e a conta'});
  });
}
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('#laExport'))laExport();
  var d=e.target.closest&&e.target.closest('#laDelete');if(d)laDelete(d);
});
/* conta guarda contato e contribuições junto com os ajustes */
function applyExtra(d){
  if(!d||typeof d!=='object')return;
  if(d.contato&&typeof d.contato==='object'&&!CONT.nome&&!CONT.tel){CONT.nome=String(d.contato.nome||'').slice(0,40);CONT.tel=String(d.contato.tel||'').slice(0,20);try{localStorage.setItem('cse-contato',JSON.stringify(CONT))}catch(e){}}
  if(d.contrib&&typeof d.contrib==='object'){Object.keys(CONTRIB).forEach(function(k){CONTRIB[k]=Math.max(CONTRIB[k],+d.contrib[k]||0)});saveContrib()}
}
/* lembrete leve: a partir da 3ª visita (em dias diferentes), sem conta; "Agora não" some por 5 dias */
var VIS={n:0,d:''};try{VIS=JSON.parse(localStorage.getItem('cse-visitas'))||VIS}catch(e){}
(function(){var d=new Date().toISOString().slice(0,10);if(VIS.d!==d){VIS.n=(+VIS.n||0)+1;VIS.d=d;try{localStorage.setItem('cse-visitas',JSON.stringify(VIS))}catch(e){}}})();
function nudgeShow(){
  if(!semConta()||(+VIS.n||0)<3||(typeof AUTH_READY!=='undefined'&&!AUTH_READY))return;
  var until=0;try{until=+localStorage.getItem('cse-nudge-ate')||0}catch(e){}if(Date.now()<until)return;
  if(!login.hidden||!cover.hidden||!cfgM.hidden||$('#laNudge')||document.documentElement.classList.contains('gated'))return;
  document.body.insertAdjacentHTML('beforeend','<div class="la-nudge" id="laNudge" role="region" aria-label="Sugestão de conta"><span class="la-ni"><svg viewBox="0 0 24 24" aria-hidden="true">'+LA_IC.sync+'</svg></span><p><b>Salve sua grade e receba alertas</b><small>Entre com uma conta. Leva 10 segundos.</small></p><button type="button" class="copy primary" data-ask="lembrete" data-nudgex>Entrar</button><button type="button" class="la-x" data-nudgeno aria-label="Agora não">Agora não</button></div>');
}
document.addEventListener('click',function(e){
  var n=e.target.closest&&e.target.closest('[data-nudgeno],[data-nudgex]');if(!n)return;
  if(n.hasAttribute('data-nudgeno'))try{localStorage.setItem('cse-nudge-ate',String(Date.now()+5*864e5))}catch(x){}
  var el=$('#laNudge');if(el)el.remove();
});
setTimeout(nudgeShow,8000);setInterval(function(){if(!$('#laNudge'))nudgeShow();else if(!semConta())$('#laNudge').remove()},20000);
/* ======================= v19: grade só para quem entrou com uma conta ======================= */
LA_WHY.grade=['Faça login para salvar sua grade','Sua grade fica guardada na sua conta, só você vê, e aparece em qualquer aparelho em que você entrar.'];
function gradeAuthSync(){try{syncAulas();if(typeof updateMap==='function')updateMap();renderGrade()}catch(e){}}
aoFazer('usuário saiu',function(){gradeAuthSync()});
gradeAuthSync();
/* ======================= v20: botão "Configurar eduroam" (leva ao geteduroam certo para o aparelho) ======================= */
function eduPlat(){var u=navigator.userAgent||'';
  if(/android/i.test(u))return 'android';
  if(/iphone|ipad|ipod/i.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return 'ios';
  if(/windows/i.test(u))return 'win';if(/mac os/i.test(u))return 'mac';if(/linux|cros/i.test(u))return 'linux';return 'outro'}
var EDU_APP={
  android:['Android','https://play.google.com/store/apps/details?id=app.eduroam.geteduroam','Instalar o geteduroam','Google Play'],
  ios:['iPhone e iPad','https://apps.apple.com/app/geteduroam/id1504076137','Instalar o geteduroam','App Store'],
  win:['Windows','https://www.geteduroam.app/','Baixar o geteduroam','para Windows'],
  mac:['Mac','https://www.geteduroam.app/','Baixar o geteduroam','para Mac'],
  linux:['Linux','https://www.geteduroam.app/','Baixar o geteduroam','para Linux'],
  outro:['Outro aparelho','https://www.geteduroam.app/','Baixar o geteduroam','site oficial']};
var EDUC={open:false,plat:null,msg:'',tone:'',busy:false};
function eduMark(i,v){eduDone[i]=v;try{localStorage.setItem(DKEY,JSON.stringify(eduDone))}catch(e){}}
function eduCfgHTML(inTut){
  var pl=EDUC.plat||eduPlat(),a=EDU_APP[pl],c1=!!eduDone[0],c2=!!eduDone[2];
  var outros=['android','ios','win','mac'].filter(function(k){return k!==pl}).map(function(k){return '<button type="button" class="linkbtn" data-eduplat="'+k+'">'+EDU_APP[k][0]+'</button>'}).join(' · ');
  return '<div class="educfg" id="educfg">'+
    (inTut?'':'<div class="educfg-h"><b>Configurar eduroam</b><button type="button" class="la-x" data-educlose aria-label="Fechar">Fechar</button></div>')+
    '<ol class="educfg-s">'+
    '<li class="'+(c1?'done':'')+'"><span class="n">1</span><div><b class="keep">Cadastre seu e-mail no eduroam</b><p class="small keep">Na Intranet UFRJ, com CPF e senha. A ativação leva até 24 h.</p><div class="row"><a class="copy" href="https://intranet.ufrj.br/atualizar-email-eduroam" target="_blank" rel="noopener">Abrir a Intranet</a>'+(c1?'<span class="pill good">Feito</span>':'<button type="button" class="copy" data-edustep="0">Já cadastrei</button>')+'</div></div></li>'+
    '<li class="'+(c2?'done':'')+'"><span class="n">2</span><div><b class="keep">Instale o app oficial do eduroam</b><p class="small keep">'+(EDUC.plat?'Para':'Detectamos')+': <b>'+a[0]+'</b>. O geteduroam configura a rede e o certificado sozinho.</p><a class="educfg-app" href="'+a[1]+'" target="_blank" rel="noopener" data-eduapp><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg><span>'+a[2]+'<small>'+a[3]+'</small></span></a><p class="small keep">Outro aparelho? '+outros+'</p></div></li>'+
    '<li><span class="n">3</span><div><b class="keep">No app, escolha a UFRJ</b><p class="small keep">Busque “UFRJ”. Usuário: o e-mail do passo 1. Senha: a da Intranet. Depois toque em Conectar e Permitir.</p></div></li>'+
    '</ol>'+
    '<div class="row"><button type="button" class="copy primary" data-educheck'+(EDUC.busy?' disabled':'')+'>'+(EDUC.busy?'Verificando…':'Verificar minha conexão')+'</button>'+(inTut?'':'<button type="button" class="linkbtn" data-wedu>Tutorial completo</button>')+'</div>'+
    (EDUC.msg?'<p class="small keep educfg-r '+EDUC.tone+'" role="status">'+esc(EDUC.msg)+'</p>':'')+'</div>';
}
function eduCfgPaint(){var el=$('#educfg');if(!el)return;var t=document.createElement('div');t.innerHTML=eduCfgHTML(!!el.closest('#detail'));el.replaceWith(t.firstChild)}
function eduCheck(){
  if(EDUC.busy)return;EDUC.busy=true;EDUC.msg='';eduCfgPaint();
  netCheck().then(function(r){
    EDUC.busy=false;
    if(!r){EDUC.msg='Não deu para verificar agora.';EDUC.tone='warn'}
    else if(r.edu===true){EDUC.msg='Você está na eduroam. Tudo certo!';EDUC.tone='good';eduMark(4,true)}
    else if(r.ufrj&&r.edu===false){EDUC.msg='Você está numa rede da UFRJ, mas não na eduroam. Escolha “eduroam” na lista de Wi-Fi.';EDUC.tone='warn'}
    else if(r.ufrj){EDUC.msg='Você está numa rede da UFRJ. Confira se o nome do Wi-Fi é “eduroam”.';EDUC.tone='good'}
    else if(r.ufrj===false){EDUC.msg=(r.tipo==='cellular'?'Você está nos dados móveis. ':'Você não está numa rede da UFRJ agora. ')+'Ligue o Wi-Fi perto de um prédio e tente de novo.';EDUC.tone='warn'}
    else{EDUC.msg=r.erro||'Não deu para verificar agora.';EDUC.tone='warn'}
    eduCfgPaint();
  });
}
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-educfg],[data-educlose],[data-eduplat],[data-edustep],[data-educheck],[data-eduapp]');if(!t)return;
  if(t.hasAttribute('data-eduapp')){eduMark(2,true);setTimeout(eduCfgPaint,300);return}
  e.preventDefault();
  if(t.hasAttribute('data-educfg')){EDUC.open=!EDUC.open;renderWifiPane();if(EDUC.open)setTimeout(function(){var c=$('#educfg');if(c)c.scrollIntoView({block:'nearest',behavior:'smooth'})},50);return}
  if(t.hasAttribute('data-educlose')){EDUC.open=false;renderWifiPane();return}
  if(t.dataset.eduplat){EDUC.plat=t.dataset.eduplat;eduCfgPaint();return}
  if(t.dataset.edustep){eduMark(+t.dataset.edustep,true);eduCfgPaint();return}
  if(t.hasAttribute('data-educheck'))eduCheck();
},true);
/* v21: setas na capa: voltar para o login e avançar para o app */
$('#cvToLogin').addEventListener('click',function(e){e.stopPropagation();openLogin()});
