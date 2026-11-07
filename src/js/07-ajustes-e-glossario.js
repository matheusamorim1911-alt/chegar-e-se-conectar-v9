/* ---------- ajustes (salvos neste aparelho) ---------- */
function saveCfg(){
  /* o que a pessoa mudou deixa de seguir o padrão definido pela gestão */
  if(PAD_SNAP)PAD_KEYS.forEach(function(k){if(CFG[k]!==PAD_SNAP[k])CFG.mine[k]=1});
  saveCfgSemMarcar();
}
/* grava os ajustes sem marcar nada como escolha da pessoa (usado ao aplicar os padrões da gestão) */
function saveCfgSemMarcar(){
  try{localStorage.setItem('cse-cfg',JSON.stringify(CFG))}catch(e){}
  if(!ACC.mute)accQueue();
}
var COVERS=[['folha','Folha inferior','O mapa nítido com uma folha de vidro embaixo.'],['cartao','Cartão central','Cartão de vidro no meio, sobre o mapa desfocado.'],['titulo','Título gigante','Nome grande e barra de ícones.'],['none','Sem capa','Abre direto no mapa.']];
function applyCoverStyle(){var c=$('#cover');if(c){c.dataset.style=CFG.cover==='none'?'folha':CFG.cover;if(!c.hidden&&typeof placeCoverMap==='function')placeCoverMap()}}
function cvMini(k){
  if(k==='none')return '<span class="cm cm-none"><span class="cm-map"></span><span class="cm-chip"></span><span class="cm-chip s"></span></span>';
  return '<span class="cm cm-'+k+'"><span class="cm-map"></span><span class="cm-glass"><i></i><i></i><i class="b"></i></span></span>';
}
function tg(id,on,label,desc){return '<label class="tgl" for="'+id+'"><span class="grow"><b>'+label+'</b><small>'+desc+'</small></span><input type="checkbox" role="switch" id="'+id+'"'+(on?' checked':'')+'><span class="sw2" aria-hidden="true"></span></label>'}
var BGS=[['brilho','Brilho','#FF9F5A','#79AEFF','#4CD38D'],['aurora','Aurora','#4CD38D','#A895FF','#4FD1DE'],['sol','Pôr do sol','#FF7A59','#F27BBE','#FFC15A'],['oceano','Oceano','#3D8BFF','#4FD1DE','#2B5BD7'],['mapa','Mapa do campus','',''],['liso','Liso','','','']];
function applyBg(){
  document.documentElement.style.setProperty('--bgmap-sw','url('+MAPMINI+')');
  var r=document.documentElement;r.dataset.bg=CFG.bg||'brilho';
  if(CFG.bg==='mapa')r.style.setProperty('--bgmap','url('+MAPBLUR+')');
}
function bgSwatch(b){
  if(b[0]==='mapa')return '<span class="bgsw bgsw-mapa"></span>';
  if(b[0]==='liso')return '<span class="bgsw bgsw-liso"></span>';
  return '<span class="bgsw" style="background:radial-gradient(70% 70% at 15% 15%,'+b[2]+'aa,transparent 70%),radial-gradient(70% 70% at 90% 30%,'+b[3]+'99,transparent 70%),radial-gradient(80% 70% at 50% 110%,'+b[4]+'88,transparent 70%),var(--surface)"></span>';
}
function renderCfg(focusSel){
  var L=$('#cfgL'),Rr=$('#cfgR');if(!L)return;
  var cur=COVERS.filter(function(c){return c[0]===CFG.cover})[0]||COVERS[0];
  var wasOpen=!!(document.getElementById('cvdet')&&document.getElementById('cvdet').open),bgOpen=!!(document.getElementById('bgdet')&&document.getElementById('bgdet').open);
  var curBg=BGS.filter(function(b){return b[0]===(CFG.bg||'brilho')})[0]||BGS[0];
  L.innerHTML='<div><p class="eyebrow">Ajustes</p><h2>Aparência</h2></div>'+
    '<details class="cvdet" id="bgdet"'+(bgOpen?' open':'')+'><summary><span class="cvsum">'+bgSwatch(curBg)+'</span><span class="grow"><b>Plano de fundo</b><small>'+curBg[1]+'</small></span><span class="chev" aria-hidden="true">▾</span></summary>'+
    '<div class="bgopts" role="radiogroup" aria-label="Plano de fundo">'+BGS.map(function(b){var on=(CFG.bg||'brilho')===b[0];
      return '<button type="button" class="bgopt" role="radio" aria-checked="'+on+'" data-bg="'+b[0]+'">'+bgSwatch(b)+'<span>'+b[1]+'</span></button>'}).join('')+'</div></details>'+
    '<details class="cvdet" id="cvdet"'+(wasOpen?' open':'')+'><summary><span class="cvsum">'+cvMini(cur[0])+'</span><span class="grow"><b>Capa</b><small>'+cur[1]+'</small></span><span class="chev" aria-hidden="true">▾</span></summary>'+
    '<div class="cvopts" role="radiogroup" aria-label="Estilo da capa">'+COVERS.map(function(c){var on=CFG.cover===c[0];
      return '<button type="button" class="cvopt" role="radio" aria-checked="'+on+'" data-cover="'+c[0]+'">'+cvMini(c[0])+'<span class="cvo-t"><b>'+c[1]+'</b><small>'+c[2]+'</small></span></button>'}).join('')+'</div>'+
    '<button class="copy" type="button" id="cfgPreview"'+(CFG.cover==='none'?' disabled':'')+'>Ver a capa agora</button></details>';
  Rr.innerHTML='<div><p class="eyebrow">Ajustes</p><h2>Mapa</h2></div>'+
    '<div class="tgls">'+tg('cfgFlow',CFG.flow,'Movimento nas rotas','A linha se desenha do início ao fim, no sentido do ônibus. Desligue para a linha ficar parada.')+
    tg('cfgCompass',!!CFG.bussola,'Bússola na rosa dos ventos','A rosa gira com o celular e uma seta laranja aponta para o destino ou a partida do Seu trajeto, com a distância. Usa a localização e o sensor de direção. Também liga tocando na rosa.')+tg('cfgBldn',CFG.bldn!==false,'Nomes dos prédios no zoom','Ao aproximar o mapa, aparecem os nomes dos prédios e institutos, tirados da planta da UFRJ.')+'</div>'+
    '<div class="cfgtime"><label for="clk">Simular horário</label><div class="cfgtimerow"><input type="time" id="clk" value="'+esc(state.manual&&state.clk?state.clk:fmt(realNow()))+'"><button class="linkbtn" id="nowBtn" type="button"'+(state.manual?'':' hidden')+'>Agora</button></div></div>'+
    '<p class="muted small keep">Para ver como ficam as linhas e os avisos em outro horário, inclusive de noite. Deixe vazio ou toque em Agora para voltar à hora real do aparelho.</p>'+
    '<div><p class="eyebrow">Ajustes</p><h2>Avisos e notificações</h2></div>'+
    '<div class="tgls">'+
    tg('cfgBanner',CFG.banner,'Mudanças de data acima do mapa','Feriados transferidos, pontos facultativos e aulas suspensas.')+
    tg('cfgReps',CFG.reps,'Avisos dos alunos','Fila, ônibus atrasado e Wi-Fi fora do ar, no mapa e no painel.')+
    tg('cfgCoverToday',CFG.coverToday,'Aviso do dia na capa','A etiqueta amarela com o que muda hoje ou amanhã.')+
    '</div>'+
    '<div><p class="eyebrow">Ajustes</p><h2>Perfil</h2></div>'+
    (PERFIL?'<div class="prof"><span class="lg-face" aria-hidden="true">'+esc(PERFIL.name.charAt(0).toUpperCase())+'</span><span class="grow"><b>'+esc(PERFIL.name)+'</b><small>'+(PERFIL.bio?'Com biometria':PERFIL.pin?'Com código de 4 dígitos':'Sem código')+'</small></span><button class="copy" type="button" id="cfgLogout">Sair</button></div><div class="profact"><button class="linkbtn" type="button" id="cfgForget">Esquecer este perfil neste aparelho</button></div>':'<p class="muted small keep">Nenhum perfil salvo neste aparelho.</p>')+
    '<div class="tgls">'+tg('cfgLogin',CFG.login,'Tela de entrada ao abrir','Mostra o perfil salvo e o Face ID antes da capa.')+'</div>'+
    '<p class="muted small keep">Os ajustes ficam salvos neste aparelho.</p>';
  if(focusSel){var el=document.querySelector(focusSel);if(el)el.focus({preventScroll:true})};
  etapas('ajustes montados',focusSel);
}
document.addEventListener('click',function(e){var b=e.target.closest('[data-bg]');if(!b||!b.classList.contains('bgopt'))return;CFG.bg=b.dataset.bg;saveCfg();applyBg();renderCfg('.bgopt[data-bg="'+CFG.bg+'"]');var d=document.getElementById('bgdet');if(d)d.open=true});
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-cover]');
  if(b){CFG.cover=b.dataset.cover;saveCfg();applyCoverStyle();renderCfg('[data-cover="'+CFG.cover+'"]');var dt=document.getElementById('cvdet');if(dt)dt.open=true;return}
  if(e.target.closest('#cfgPreview')){cfgM.hidden=true;$('#tab-cfg').setAttribute('aria-pressed','false');openCover()}
});
document.addEventListener('change',function(e){
  var id=e.target.id,map={cfgBanner:'banner',cfgReps:'reps',cfgCoverToday:'coverToday',cfgLogin:'login',cfgFlow:'flow',cfgBldn:'bldn'};
  if(!map[id])return;CFG[map[id]]=e.target.checked;saveCfg();updateMap();if(id==='cfgBldn'&&gLab)drawLabels();drawBanner();drawShared();renderDetail();coverToday();
});
cPane=$('#pane-cal');cL=$('#cL');cR=$('#cR');
document.addEventListener('click',function(e){var g=e.target.closest('[data-tab-go]');if(!g)return;setTab(g.dataset.tabGo);try{history.replaceState(null,'','#'+g.dataset.tabGo)}catch(err){}var c=$('#pane-cal');if(c)c.scrollIntoView({behavior:'auto',block:'start'})});
cPane.addEventListener('submit',function(e){
  if(e.target.id!=='mudform')return;e.preventDefault();
  var t=$('#mudt').value.trim(),d=$('#mudd').value,de=$('#mudde').value,err=$('#muderr');
  if(!t||!d){err.className='gerr';err.textContent='Preencha o nome e a nova data.';return}
  if(!SH.on||mudBusy){err.className='gerr';err.textContent='O armazenamento compartilhado não está disponível agora.';return}
  mudBusy=true;var x=$('#mudx').value.trim();
  SH.db.doc('cal/m'+Date.now().toString(36)).set({t:t,d:d,de:de,k:$('#mudk').value,txt:x}).then(function(){mudBusy=false;err.className='gerr ok';err.textContent='Publicado. Todos já veem o aviso.'},function(){mudBusy=false;err.className='gerr';err.textContent='Não deu para publicar. Só o dono da página pode registrar mudanças.'});
});
cPane.addEventListener('click',function(e){var x=e.target.closest('[data-muddel]');if(x&&SH.on){SH.db.doc('cal/'+x.dataset.muddel).delete().catch(function(){});return}
  var b=e.target.closest('[data-per]');if(!b)return;cs.per=b.dataset.per;renderCal('[data-per="'+cs.per+'"]')});
/* ---------- ajustes em tela cheia ---------- */
var cfgM=$('#pane-cfg'),cfgPrevFocus=null;
function openCfg(){
  cfgPrevFocus=document.activeElement;renderCfg();cfgM.hidden=false;cfgM.classList.remove('closing');perfEnter(cfgM);
  document.documentElement.style.overflow='hidden';$('#tab-cfg').setAttribute('aria-pressed','true');
  cfgM.querySelector('.cfgsheet').scrollTop=0;setTimeout(function(){$('#cfgClose').focus({preventScroll:true})},30);
}
function closeCfg(){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;cfgM.classList.add('closing');
  setTimeout(function(){cfgM.hidden=true;if(cover.hidden&&login.hidden)document.documentElement.style.overflow='';$('#tab-cfg').setAttribute('aria-pressed','false');var g=$('#tab-cfg');if(g)g.focus({preventScroll:true})},rm?0:220);
}
$('#cfgClose').addEventListener('click',closeCfg);
cfgM.addEventListener('click',function(e){if(e.target===cfgM)closeCfg()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!cfgM.hidden&&cover.hidden&&login.hidden)closeCfg()});
/* ---------- glossário de siglas ---------- */
var GL_CATS=[['todas','Todas'],['lugar','Prédios e unidades'],['serv','Órgãos e serviços'],['acad','Vida acadêmica'],['net','Internet e sistemas']];
/* [sigla, nome por extenso, explicação, categoria, atalho] atalho: 's:<parada>' mapa · 'b:<prédio>' Lugares · 'c:<categoria>' Lugares */
var GLOSS=[
 ['UFRJ','Universidade Federal do Rio de Janeiro','A Cidade Universitária, na Ilha do Fundão, é o maior campus da UFRJ.','lugar',''],
 ['CT','Centro de Tecnologia','Engenharias (Escola Politécnica), Escola de Química e parte do Instituto de Química. Tem dois RUs.','lugar','b:ct'],
 ['CCMN','Centro de Ciências Matemáticas e da Natureza','Matemática, Física, Química, Geociências e Computação. Fica ao lado do CT.','lugar','b:ccmn'],
 ['CCS','Centro de Ciências da Saúde','O prédio grande ao lado do HU, com os cursos da saúde e da biologia.','lugar','s:ccsbb'],
 ['HU','Hospital Universitário Clementino Fraga Filho','Hospital da UFRJ, colado no CCS. Tem ponto das linhas internas na porta.','lugar','s:hu'],
 ['IPPMG','Instituto de Puericultura e Pediatria Martagão Gesteira','Hospital pediátrico da UFRJ, perto do HU.','lugar',''],
 ['EEFD','Escola de Educação Física e Desportos','Educação Física e Dança, com quadras, piscina e pista.','lugar','s:eefd'],
 ['IF','Instituto de Física','Parte fica no CCMN e parte no prédio novo da Av. Athos da Silveira Ramos.','lugar','s:ifn'],
 ['IM','Instituto de Matemática','Fica no CCMN, bloco C. A biblioteca é a Leopoldo Nachbin.','lugar','b:ccmn'],
 ['IQ','Instituto de Química','Aulas e biblioteca no CT, bloco A.','lugar','b:ct'],
 ['IC','Instituto de Computação','Fica no CCMN, com secretaria e laboratórios.','lugar','b:ccmn'],
 ['IGEO','Instituto de Geociências','Geografia, Geologia e Meteorologia, no CCMN.','lugar','b:ccmn'],
 ['PPGG','Programa de Pós-Graduação em Geografia','Dá nome à biblioteca de Geografia, no CCMN, bloco I.','lugar','b:ccmn'],
 ['NCE','Núcleo de Computação Eletrônica','Hoje se chama Instituto Tércio Pacitti, mas todo mundo ainda diz NCE. Fica no CCMN, bloco C.','lugar','b:ccmn'],
 ['EQ','Escola de Química','Fica no CT. A biblioteca atende Química e Engenharia Química.','lugar','b:ct'],
 ['EBA','Escola de Belas Artes','Fica no prédio da Reitoria (Jorge Machado Moreira).','lugar','s:reit'],
 ['FAU','Faculdade de Arquitetura e Urbanismo','Divide o prédio da Reitoria com a EBA.','lugar','s:reit'],
 ['IMA','Instituto de Macromoléculas Professora Eloisa Mano','Pesquisa em polímeros, entre o CT e a Reitoria.','lugar',''],
 ['COPPEAD','Instituto de Pós-Graduação e Pesquisa em Administração','Fim da linha 2 das linhas internas.','lugar','s:coppead'],
 ['RU','Restaurante Universitário','O “bandejão”. Há o RU Central, dois no CT e um em Letras.','lugar','c:comida'],
 ['IE','Instituto de Economia','Fica no campus da Praia Vermelha. Aqui aparece como fonte do calendário.','lugar',''],
 ['FND','Faculdade Nacional de Direito','Fica no centro do Rio. Aqui aparece como fonte do calendário.','lugar',''],
 ['CETEM','Centro de Tecnologia Mineral','Instituto federal de pesquisa (não é da UFRJ) com ponto das linhas internas.','lugar','s:cetem'],
 ['CEPEL','Centro de Pesquisas de Energia Elétrica','Centro de pesquisa da Eletrobras na ilha.','lugar','s:cepel'],
 ['CENPES','Centro de Pesquisas Leopoldo Américo Miguez de Mello','Centro de pesquisa da Petrobras. Há dois pontos: Cenpes I e II.','lugar','s:cenpes1'],
 ['CEPE','Clube dos Empregados da Petrobras','Clube na Av. Horácio Macedo, com ponto das linhas internas.','lugar','s:cepe'],
 ['IEN','Instituto de Engenharia Nuclear','Instituto da CNEN (não é da UFRJ), perto da Xistoquímica.','lugar',''],
 ['DISEG','Divisão de Segurança','Segurança e vigilância do campus. Cuida das guaritas e das câmeras.','serv','c:seg'],
 ['CCO','Centro de Controle Operacional','Central da Prefeitura que acompanha o trânsito e as câmeras da ilha.','serv','c:seg'],
 ['DFO','Divisão da Frota Oficial','Setor da Prefeitura Universitária que cuida dos veículos. Dá nome ao ponto CPST / DFO.','serv','s:cpst'],
 ['DIPRO','Divisão de Produção','Setor da Prefeitura Universitária. Dá nome a um ponto das linhas internas.','serv','s:dipro'],
 ['CPST','Coordenação de Políticas de Saúde do Trabalhador','Saúde dos servidores da UFRJ, ligada à PR-4.','serv','s:cpst'],
 ['PR-4','Pró-Reitoria de Pessoal','Cuida dos servidores. Publica a lista de endereços das unidades.','serv',''],
 ['SiBI','Sistema de Bibliotecas e Informação','Rede das bibliotecas da UFRJ. Os horários das bibliotecas vêm de lá.','serv','c:biblio'],
 ['TIC','Superintendência de Tecnologia da Informação e Comunicação','A TI da UFRJ. Cuida da Intranet e do eduroam.','serv',''],
 ['BRT','Bus Rapid Transit','Ônibus expresso em corredor exclusivo. A Estação de Integração liga o BRT às linhas internas.','serv','s:est'],
 ['MGI','Ministério da Gestão e da Inovação em Serviços Públicos','Define pontos facultativos e trocas de feriado para órgãos federais, como a UFRJ.','serv',''],
 ['SIGA','Sistema Integrado de Gestão Acadêmica','O Portal do Aluno: inscrição em disciplinas, notas e boletim.','acad',''],
 ['CRID','Confirmação de Registro de Inscrição em Disciplinas','O comprovante de que você ficou inscrito. Salve uma cópia a cada período.','acad',''],
 ['CR','Coeficiente de Rendimento','A média ponderada das suas notas no período.','acad',''],
 ['CRA','Coeficiente de Rendimento Acumulado','A média de todo o curso até agora. Pesa em bolsas e estágios.','acad',''],
 ['CA','Centro Acadêmico','Representação dos alunos de um curso. Bom lugar para tirar dúvidas de calouro.','acad',''],
 ['DCE','Diretório Central dos Estudantes Mário Prata','Representação de todos os alunos da UFRJ.','acad',''],
 ['eduroam','education roaming','Wi-Fi das universidades. Com o login da UFRJ, conecta aqui e em instituições do mundo todo.','net',''],
 ['RNP','Rede Nacional de Ensino e Pesquisa','Rede que liga as universidades brasileiras e opera o eduroam no país.','net',''],
 ['CPF','Cadastro de Pessoas Físicas','Seu login na Intranet UFRJ, junto com a senha.','net','']
];
var gl={cat:'todas',q:''},glM=$('#glossM'),glPrev=null;
function glFold(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
function glEsc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function glGo(a){
  if(!a)return '';
  var k=a.slice(0,1),v=a.slice(2);
  if(k==='s'&&STOPS[v])return '<button type="button" class="chip gl-go" data-glgo="'+a+'">Ver no mapa</button>';
  if(k==='b'||k==='c')return '<button type="button" class="chip gl-go" data-glgo="'+a+'">Ver em Lugares</button>';
  return '';
}
function renderGloss(){
  var q=glFold(gl.q.trim());
  var list=GLOSS.filter(function(g){
    if(gl.cat!=='todas'&&g[3]!==gl.cat)return false;
    if(!q)return true;
    return glFold(g[0]).indexOf(q)>=0||glFold(g[1]).indexOf(q)>=0||glFold(g[2]).indexOf(q)>=0;
  }).sort(function(a,b){
    if(q){var ea=glFold(a[0])===q?0:glFold(a[0]).indexOf(q)===0?1:2,eb=glFold(b[0])===q?0:glFold(b[0]).indexOf(q)===0?1:2;if(ea!==eb)return ea-eb}
    return a[0].localeCompare(b[0],'pt',{sensitivity:'base'});
  });
  $('#glCats').innerHTML=GL_CATS.map(function(c){return '<button type="button" class="chip" data-glcat="'+c[0]+'" aria-pressed="'+(gl.cat===c[0])+'">'+c[1]+'</button>'}).join('');
  $('#glSub').textContent=GLOSS.length+' siglas usadas no app e no dia a dia da UFRJ';
  $('#glList').innerHTML=list.length?list.map(function(g){
    return '<article class="gl-item"><h3 class="gl-s" lang="pt-BR">'+glEsc(g[0])+'</h3><p class="gl-n">'+glEsc(g[1])+'</p><p class="gl-d muted">'+glEsc(g[2])+'</p>'+glGo(g[4])+'</article>';
  }).join(''):'<p class="gl-empty muted">Nenhuma sigla encontrada para “'+glEsc(gl.q.trim())+'”.</p>';
}
function openGloss(q){
  glPrev=document.activeElement;if(typeof q==='string'){gl.q=q;gl.cat='todas'}
  if(!cfgM.hidden)cfgM.hidden=true,$('#tab-cfg').setAttribute('aria-pressed','false');
  renderGloss();$('#glQ').value=gl.q;glM.hidden=false;glM.classList.remove('closing');perfEnter(glM);
  document.documentElement.style.overflow='hidden';$('#glossBtn').setAttribute('aria-pressed','true');
  glM.querySelector('.cfgsheet').scrollTop=0;
  setTimeout(function(){var f=window.matchMedia('(pointer:fine)').matches?$('#glQ'):$('#glClose');f.focus({preventScroll:true})},30);
}
function closeGloss(after){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;glM.classList.add('closing');
  setTimeout(function(){glM.hidden=true;document.documentElement.style.overflow='';$('#glossBtn').setAttribute('aria-pressed','false');
    if(after)after();else{var g=$('#glossBtn');if(g)g.focus({preventScroll:true})}},rm?0:220);
}
$('#glossBtn').addEventListener('click',function(){if(glM.hidden)openGloss();else closeGloss()});
$('#glClose').addEventListener('click',function(){closeGloss()});
glM.addEventListener('click',function(e){
  if(e.target===glM){closeGloss();return}
  var c=e.target.closest('[data-glcat]');if(c){gl.cat=c.dataset.glcat;renderGloss();var f=glM.querySelector('[data-glcat="'+gl.cat+'"]');if(f)f.focus();return}
  var g=e.target.closest('[data-glgo]');if(!g)return;
  var a=g.dataset.glgo,k=a.slice(0,1),v=a.slice(2);
  closeGloss(function(){
    if(k==='s'){setTab('trajeto');try{history.replaceState(null,'','#trajeto')}catch(err){}select('stop',v,false);scrollToMap()}
    else{if(k==='b'){pstate.bld=v;pstate.pl=null;pstate.pf=undefined;pstate.bldOpen=true}else{pstate.cat=v;pstate.q='';pstate.hrsOpen=true}
      setTab('predios');try{history.replaceState(null,'','#predios')}catch(err){}
      var el=k==='b'?$('#planbox'):$('#pHours');if(el)el.scrollIntoView({behavior:'auto',block:'start'})}
  });
});
$('#glQ').addEventListener('input',function(e){gl.q=e.target.value;renderGloss()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!glM.hidden){e.stopPropagation();closeGloss()}},true);
