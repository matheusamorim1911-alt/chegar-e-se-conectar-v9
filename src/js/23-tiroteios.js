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
tiroLoop();
