/* ======================= Tiroteios perto das saídas do Fundão (Fogo Cruzado) =======================
   Opcional e desligado por padrão (Ajustes › Segurança no caminho). Os dados vêm do Instituto Fogo Cruzado
   (conteúdo de uso livre), pelo Worker do projeto, que consulta a API com a conta do projeto a cada 5 min.
   O app só mostra registros das últimas horas perto das saídas da ilha, sempre com fonte e horário.
   Não é alerta oficial: quando não há dados, diz que não há dados, nunca que "está tudo calmo". */
var TIRO={url:LIVE.url?LIVE.url+'/tiroteios':'',d:null,t:0,err:false,timer:null};
function tiroOn(){return CFG.tiroteios===true&&!!TIRO.url}
function tiroBusca(){
  if(!tiroOn()||document.hidden)return;
  fetch(TIRO.url,{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){TIRO.d=d;TIRO.t=Date.now();TIRO.err=false;tiroRepaint()},
    function(){TIRO.err=true;tiroRepaint()});
}
function tiroLoop(){clearInterval(TIRO.timer);TIRO.timer=null;if(!tiroOn())return;tiroBusca();TIRO.timer=setInterval(tiroBusca,300000)}
document.addEventListener('visibilitychange',function(){if(!document.hidden&&tiroOn()&&Date.now()-TIRO.t>240000)tiroBusca()});
function tiroHa(t){var m=Math.max(0,Math.round((Date.now()-t)/60000));return m<1?'agora há pouco':m<60?'há '+m+' min':'há '+Math.floor(m/60)+' h'+(m%60?' '+(m%60)+' min':'')}
function tiroResumo(){
  var d=TIRO.d;
  if(!d)return TIRO.err?'Sem dados do Fogo Cruzado agora':'Buscando registros…';
  if(!d.disponivel)return 'Sem dados do Fogo Cruzado agora';
  var n=(d.ocorrencias||[]).length;
  return n?n+' registro'+(n>1?'s':'')+' nas últimas '+(d.janelaH||6)+' h · último '+tiroHa(d.ocorrencias[0].t):'Nenhum registro nas últimas '+(d.janelaH||6)+' h';
}
function tiroBodyHTML(){
  var d=TIRO.d,at=d&&d.atualizado?Date.parse(d.atualizado):NaN;
  /* a base do Fogo Cruzado é atualizada de tempos em tempos (não em tempo real): mostra quando foi a última vez */
  var base=at>0?' Base atualizada '+(new Date(at).toDateString()===new Date().toDateString()?'hoje às ':'em '+new Date(at).toLocaleDateString('pt-BR')+' às ')+new Date(at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'.':'';
  var fonte='<p class="muted small keep tiro-src">Fonte: Instituto Fogo Cruzado, que reúne e confere relatos de tiroteios.'+base+' Os registros podem demorar a aparecer e não são alerta oficial. Em emergência, ligue 190.</p>';
  if(!d||!d.disponivel)return '<p class="small keep">'+(d&&d.motivo==='sem-conta'?'O serviço ainda não foi ativado pela equipe do app.':'Não deu para consultar o Fogo Cruzado agora. Isso não quer dizer que esteja tudo calmo.')+'</p>'+fonte;
  var L=d.ocorrencias||[];
  if(!L.length)return '<p class="small keep">Nenhum tiroteio registrado pelo Fogo Cruzado perto das saídas do Fundão nas últimas '+(d.janelaH||6)+' horas.</p>'+fonte;
  return '<ul class="tiro-list">'+L.slice(0,6).map(function(o){
    return '<li><span class="tiro-ha">'+tiroHa(o.t)+'</span><span class="grow"><b>'+esc(o.bairro||'Local não informado')+'</b><small>'+esc(o.local||'')+'</small>'+
      '<small>'+(o.policia?'Com ação policial':'Sem ação policial informada')+(o.vitimas?' · '+o.vitimas+' vítima'+(o.vitimas>1?'s':''):'')+'</small></span></li>'}).join('')+'</ul>'+
    (L.length>6?'<p class="muted small keep">E mais '+(L.length-6)+' registro'+(L.length-6>1?'s':'')+'.</p>':'')+fonte;
}
function tiroFoldHTML(){
  var open=(function(){try{return localStorage.getItem('cse-fold-tiro')==='1'}catch(e){return false}})();
  return '<div id="tirobox">'+foldHTML('fdTiro',open,'Tiroteios perto das saídas','<small>'+esc(tiroResumo())+'</small>',open?tiroBodyHTML():'')+'</div>';
}
function tiroRepaint(){
  tiroAlerta();
  var b=$('#tirobox');if(!tiroOn()){if(b)b.remove();return}
  var t=document.createElement('div');t.innerHTML=tiroFoldHTML();
  if(b)b.replaceWith(t.firstChild);else if(plan){var x=$('#extbox');if(x)x.insertAdjacentElement('beforebegin',t.firstChild);else plan.appendChild(t.firstChild)}
}
aoFazer('trajeto montado',function(){if(tiroOn()&&!$('#tirobox'))tiroRepaint()});
document.addEventListener('toggle',function(e){if(e.target.id!=='fdTiro')return;try{localStorage.setItem('cse-fold-tiro',e.target.open?'1':'0')}catch(x){}
  var b=e.target.querySelector('.fold-b');if(b&&e.target.open&&!b.firstChild)b.innerHTML=tiroBodyHTML()},true);
/* Ajustes › Segurança no caminho */
function tiroCfgHTML(){
  return '<div class="accsec" id="tirosec"><h2>Segurança no caminho</h2><div class="tgls">'+
    tg('cfgTiro',CFG.tiroteios===true,'Tiroteios perto das saídas do Fundão','Mostra em Trajetos os registros do Instituto Fogo Cruzado das últimas 6 horas na Linha Vermelha, Av. Brasil, Maré, Bonsucesso, Penha e ponte para a Ilha do Governador.')+'</div>'+
    (TIRO.url?'':'<p class="muted small keep">Disponível no site do app.</p>')+
    '<p class="muted small keep">Os registros dependem de verificação e podem atrasar. Não é alerta oficial. A Defesa Civil manda alertas por SMS: envie seu CEP para 40199.</p></div>';
}
aoFazer('ajustes montados',function(){var a=$('#alsec')||$('#accsec');if(a&&!$('#tirosec'))a.insertAdjacentHTML('afterend',tiroCfgHTML())});
document.addEventListener('change',function(e){if(e.target.id!=='cfgTiro')return;
  CFG.tiroteios=e.target.checked;saveCfg();tiroLoop();tiroRepaint();if(CFG.tiroteios&&!TIRO.url)gToast('Disponível no site do app.',1)});
/* ---------- alerta em destaque, acima da previsão do tempo ----------
   Vermelho: tiroteio registrado nas últimas 2 h. Amarelo: nas últimas 5 h. Sem registro nesse tempo, nada aparece.
   "Ocultar" esconde até aparecer um registro mais novo (cse-tiro-visto). "Ver detalhes" abre a lista em Trajetos. */
var TIRO_VERMELHO_H=2,TIRO_AMARELO_H=5;
function tiroNivel(){
  var d=TIRO.d;if(!tiroOn()||!d||!d.disponivel)return null;
  var L=(d.ocorrencias||[]).filter(function(o){return o.t&&Date.now()-o.t<TIRO_AMARELO_H*3600e3});if(!L.length)return null;
  var ult=L[0],rec=L.filter(function(o){return Date.now()-o.t<TIRO_VERMELHO_H*3600e3});
  return {cor:rec.length?'vermelho':'amarelo',ult:ult,n:L.length,nRec:rec.length};
}
function tiroVisto(){try{return +localStorage.getItem('cse-tiro-visto')||0}catch(e){return 0}}
function tiroAlerta(){
  var a=$('#tiroAlerta'),N=tiroNivel();
  if(!N||N.ult.t<=tiroVisto()){if(a)a.remove();return}
  var o=N.ult,lugar=o.bairro||'perto das saídas do Fundão',
    tit=N.cor==='vermelho'?'Tiroteio '+tiroHa(o.t)+(o.bairro?' em '+o.bairro:' perto das saídas'):'Teve tiroteio '+tiroHa(o.t)+(o.bairro?' em '+o.bairro:' perto das saídas'),
    sub=(o.local?o.local+'. ':'')+(N.n>1?N.n+' registros nas últimas '+(N.cor==='vermelho'&&N.nRec===N.n?TIRO_VERMELHO_H:TIRO_AMARELO_H)+' h. ':'')+'Evite a região se puder.',
    h='<span class="ta-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3.5L22 20.5H2z"/><path class="ta-x" d="M12 9.5v5.2M12 17.4v.1"/></svg></span>'+
      '<span class="ta-txt"><b>'+esc(tit)+'</b><small>'+esc(sub)+'</small><small class="ta-fonte">Fonte: Fogo Cruzado. Não é alerta oficial. Emergência: 190.</small></span>'+
      '<span class="ta-acoes"><button type="button" class="ta-ver" id="tiroVer">Ver detalhes</button><button type="button" class="ta-x-btn" id="tiroOculta" aria-label="Ocultar este alerta">×</button></span>';
  var chave=N.cor+'|'+o.t+'|'+N.n+'|'+Math.floor((Date.now()-o.t)/60000);
  /* antes dos avisos de mudança e da previsão do tempo (que entra logo depois de #mudbar), sempre por cima dela */
  if(!a){var m=$('#mudbar');if(!m)return;m.insertAdjacentHTML('beforebegin','<div class="tiroalerta" id="tiroAlerta" role="alert"></div>');a=$('#tiroAlerta')}
  if(a.dataset.k===chave)return;a.dataset.k=chave;a.className='tiroalerta '+N.cor;a.innerHTML=h;
}
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;
  if(t.closest('#tiroOculta')){var N=tiroNivel();try{if(N)localStorage.setItem('cse-tiro-visto',String(N.ult.t))}catch(x){}tiroAlerta();return}
  if(t.closest('#tiroVer')){if(typeof setTab==='function')setTab('trajeto');try{localStorage.setItem('cse-fold-tiro','1')}catch(x){}tiroRepaint();
    var f=$('#fdTiro');if(f){f.open=true;var b=f.querySelector('.fold-b');if(b&&!b.firstChild)b.innerHTML=tiroBodyHTML();f.scrollIntoView({behavior:'smooth',block:'start'})}}
});
/* a cor muda com o tempo (vermelho → amarelo → some) mesmo sem busca nova */
setInterval(function(){if(!document.hidden&&tiroOn())tiroAlerta()},60000);
tiroLoop();
