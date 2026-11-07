/* ======================= Gestão › Saúde e estatísticas =======================
   Confere, a pedido, se cada serviço de que o app depende está respondendo (e em quanto tempo),
   e mostra números de uso. Só lê: não apaga nem altera nada. */
GTABS.push(['saude','Saúde e estatísticas']);
var SAUDE={res:{},quando:0,busy:false,est:null,estBusy:false};
var SAUDE_TEMPO=8000,SAUDE_LENTO=3000;
function sdTempo(p){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej(new Error('sem resposta em 8 s'))},SAUDE_TEMPO)})])}
function sdJson(url){return fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}
function sdIdade(ms){var s=Math.round(ms/1000);return s<90?s+' s':s<5400?Math.round(s/60)+' min':Math.round(s/3600)+' h'}
/* cada verificação devolve {estado:'ok'|'aviso'|'falha', det:'texto'} (ou lança erro = falha) */
var SAUDE_CHECKS=[
  ['site','Site (GitHub Pages)','version.json e a versão deste aparelho',function(){
    if(!ON_SITE)return Promise.resolve({estado:'aviso',det:'Fora do site publicado (aqui não há version.json).'});
    return sdJson('version.json').then(function(v){return v.v===APP_VERSION?{estado:'ok',det:'Versão '+v.v+', a mesma deste aparelho.'}:{estado:'aviso',det:'Publicada: '+v.v+'. Este aparelho: '+APP_VERSION+'. Recarregue para atualizar.'}})}],
  ['worker','Ônibus ao vivo (Worker da Cloudflare)','posições dos ônibus da cidade',function(){
    if(!LIVE.url)return Promise.resolve({estado:'aviso',det:'Endereço do Worker não configurado (config.js).'});
    return sdJson(LIVE.url).then(function(d){var n=(d.onibus||[]).length;SAUDE.gps=d;return {estado:'ok',det:n+' ônibus na região do Fundão agora.'}})}],
  ['prefeitura','GPS da prefeitura (dados.mobilidade.rio)','pelo Worker: idade da posição mais nova',function(){
    if(!LIVE.url)return Promise.resolve({estado:'aviso',det:'Depende do Worker.'});
    var d=SAUDE.gps;var p=d?Promise.resolve(d):sdJson(LIVE.url);
    return p.then(function(d){var L=d.onibus||[];if(!L.length){var h=new Date().getHours();return {estado:h>=5&&h<23?'aviso':'ok',det:'Nenhum ônibus na região'+(h>=5&&h<23?' em horário de serviço: a prefeitura pode estar sem dados.':' (madrugada).')}}
      var novo=Math.max.apply(null,L.map(function(o){return o.t||0})),idade=(d.t||Date.now())-novo;
      return {estado:idade<120000?'ok':idade<600000?'aviso':'falha',det:'Posição mais nova de '+sdIdade(idade)+' atrás.'}})}],
  ['tiroteios','Tiroteios (Fogo Cruzado)','pelo Worker, com a conta do projeto',function(){
    if(!LIVE.url)return Promise.resolve({estado:'aviso',det:'Depende do Worker.'});
    return sdJson(LIVE.url+'/tiroteios').then(function(d){
      if(!d.disponivel)return {estado:d.motivo==='sem-conta'?'aviso':'falha',det:d.motivo==='sem-conta'?'Conta do projeto não configurada no Worker.':'O Worker não conseguiu consultar a API.'};
      var at=Date.parse(d.atualizado||''),idade=at>0?Date.now()-at:null;
      return {estado:idade!=null&&idade>24*3600e3?'aviso':'ok',det:(d.ocorrencias||[]).length+' registro(s) nas últimas '+(d.janelaH||6)+' h'+(idade!=null?' · base atualizada há '+sdIdade(idade):'')+'.'}})}],
  ['cota','Cota do Worker (Cloudflare)','pedidos de hoje no plano grátis',function(){
    if(!LIVE.url)return Promise.resolve({estado:'aviso',det:'Depende do Worker.'});
    return sdJson(LIVE.url+'/saude').then(function(d){
      if(!d.cloudflareConfigurado)return {estado:'info',det:'Para ver o uso, configure CF_CONTA e CF_TOKEN no Worker (worker/README.md).'};
      if(!d.cloudflare)return {estado:'aviso',det:'Não deu para ler o uso: '+(d.cloudflareErro||'erro')+'.'};
      var c=d.cloudflare,pct=c.pedidos/c.limite*100,zera=new Date(Date.parse(c.desde)+864e5);
      return {estado:pct<70?'ok':pct<90?'aviso':'falha',det:c.pedidos.toLocaleString('pt-BR')+' de '+c.limite.toLocaleString('pt-BR')+' pedidos hoje ('+pct.toFixed(pct<10?1:0).replace('.',',')+'%)'+(c.erros?', '+c.erros+' com erro':'')+'. Zera às '+zera.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'.'}})}],
  ['firebase','Banco de dados e login (Firebase)','leitura de um documento pequeno',function(){
    if(!FB_ON)return Promise.resolve({estado:'aviso',det:'Firebase não configurado aqui.'});
    return fbInit().then(function(fb){return fb.db.doc('meta/vagas').get()}).then(function(d){return {estado:'ok',det:'Respondendo'+(SH.uid?', com a sua conta conectada':'')+'.'}})}],
  ['fbuso','Cota do Firebase','leituras e gravações do dia',function(){
    return Promise.resolve({estado:'info',det:'O Firebase não informa o uso ao app. Veja no console: Firestore › Uso (plano grátis: 50 mil leituras e 20 mil gravações por dia).',link:'https://console.firebase.google.com/project/'+((window.CSE_FIREBASE||{}).projectId||'_')+'/firestore/usage'})}],
  ['clima','Previsão do tempo (Open-Meteo)','temperatura agora na Ilha do Fundão',function(){
    return sdJson('https://api.open-meteo.com/v1/forecast?latitude=-22.86&longitude=-43.23&current=temperature_2m&timezone=America%2FSao_Paulo').then(function(d){var t=d.current&&d.current.temperature_2m;return {estado:'ok',det:t!=null?String(t).replace('.',',')+' °C agora.':'Respondendo.'}})}],
  ['rede','Diagnóstico de rede (ipify)','descobre se o aparelho está na rede da UFRJ',function(){
    return sdJson('https://api.ipify.org?format=json').then(function(j){return {estado:'ok',det:'Respondendo.'}})}],
  ['gtfs','Horários da prefeitura (GTFS)','dados embutidos no app',function(){
    var a=String(EXT.ate||''),fim=a.length===8?Date.parse(a.slice(0,4)+'-'+a.slice(4,6)+'-'+a.slice(6,8)+'T23:59:59-03:00'):NaN;
    if(!(fim>0))return Promise.resolve({estado:'aviso',det:'Validade não informada.'});
    var dias=Math.floor((fim-Date.now())/864e5),dt=new Date(fim).toLocaleDateString('pt-BR');
    return Promise.resolve({estado:dias<0?'falha':dias<45?'aviso':'ok',det:dias<0?'Venceu em '+dt+': gere de novo com tools/gtfs_fundao.py.':'Válido até '+dt+(dias<45?' (faltam '+dias+' dias: baixe o GTFS novo).':'.')})}],
  ['ct','Planta do CT (ct-plantas.json)','arquivo do site',function(){
    return fetch('ct-plantas.json',{method:'HEAD',cache:'no-store'}).then(function(r){return r.ok?{estado:'ok',det:'Disponível.'}:{estado:'falha',det:'HTTP '+r.status+'.'}})}]
];
function saudeVerifica(){
  if(SAUDE.busy)return;SAUDE.busy=true;SAUDE.gps=null;SAUDE.res={};
  /* o Worker antes da prefeitura, que reaproveita a resposta */
  var ordem=SAUDE_CHECKS.slice();
  (function proxima(i){
    if(i>=ordem.length){SAUDE.busy=false;SAUDE.quando=Date.now();if(gTab==='saude')renderGest();return}
    var c=ordem[i],t0=performance.now();
    sdTempo(Promise.resolve().then(c[3])).then(function(r){r.ms=Math.round(performance.now()-t0);if(r.estado==='ok'&&r.ms>SAUDE_LENTO){r.estado='aviso';r.det+=' Lento.'}return r},
      function(e){return {estado:'falha',det:String(e&&e.message||e),ms:Math.round(performance.now()-t0)}})
      .then(function(r){SAUDE.res[c[0]]=r;if(gTab==='saude')renderGest();proxima(i+1)});
  })(0);
}
/* números de uso: lidos do que a gestão já carrega e de duas consultas pequenas */
function saudeEstatisticas(){
  if(SAUDE.estBusy)return;SAUDE.estBusy=true;var E=SAUDE.est={};
  var fim=function(){SAUDE.estBusy=false;if(gTab==='saude')renderGest()};
  if(!FB_ON||!SH.on){fim();return}
  var ps=[];
  ps.push(fbInit().then(function(fb){return fb.db.collection('feedback').limit(500).get()}).then(function(s){var L=s.docs.map(function(d){return d.data()||{}}),n=L.filter(function(o){return o.nota});
    E.fbk={n:L.length,sem:L.filter(function(o){return (o.ts||0)>Date.now()-7*864e5}).length,med:n.length?n.reduce(function(a,o){return a+o.nota},0)/n.length:null}},function(){E.fbk=null}));
  if(gcan('usuarios'))ps.push(SH.db.collection('erros').get().then(function(s){var L=s.docs.map(function(d){return d.data()||{}}),agora=Date.now();
    E.err={n:L.length,dia:L.filter(function(o){return (o.ts||0)>agora-864e5}).length,sem:L.filter(function(o){return (o.ts||0)>agora-7*864e5}).length}},function(){E.err=null}));
  Promise.all(ps).then(fim,fim);
}
function sdPill(e){if(e==='info')return '<span class="pill">Ver</span>';return '<span class="pill '+(e==='ok'?'good':e==='aviso'?'warn':'bad')+'">'+(e==='ok'?'Funcionando':e==='aviso'?'Atenção':'Fora do ar')+'</span>'}
function gSaude(){
  if(!SAUDE.quando&&!SAUDE.busy)setTimeout(saudeVerifica,0);
  if(!SAUDE.est&&!SAUDE.estBusy)setTimeout(saudeEstatisticas,0);
  var lista=SAUDE_CHECKS.map(function(c){var r=SAUDE.res[c[0]];
    return '<div class="grow2"><span class="grow"><b>'+esc(c[1])+'</b><small>'+esc(r?r.det:c[2])+(r&&r.link?' <a href="'+esc(r.link)+'" target="_blank" rel="noopener">Abrir o console</a>':'')+'</small></span>'+(r?(r.ms>=1&&r.estado!=='info'?'<span class="sd-ms">'+r.ms+' ms</span>':'')+sdPill(r.estado):'<span class="pill">'+(SAUDE.busy?'Verificando…':'—')+'</span>')+'</div>'}).join('');
  var nOk=0,nAv=0,nF=0;Object.keys(SAUDE.res).forEach(function(k){var e=SAUDE.res[k].estado;if(e==='ok')nOk++;else if(e==='aviso')nAv++;else if(e==='falha')nF++});
  /* uso */
  var agora=Date.now(),M=SH.on?SH.members:[],dia=864e5;
  var hoje=M.filter(function(m){return m.last>agora-dia}).length,sem=M.filter(function(m){return m.last>agora-7*dia}).length,novos=M.filter(function(m){return m.first>agora-7*dia}).length,vis=M.reduce(function(a,m){return a+(m.visits||0)},0);
  var filas7=(SH.on?SH.fila:[]).filter(function(r){return r.ts>agora-7*dia}).length,avisos7=(SH.on?SH.reps:[]).filter(function(r){return r.ts>agora-7*dia}).length;
  var reqs=allReqs(),abertas=reqs.filter(function(r){var s=reqStatus(r.id).st;return s==='nova'||s==='analise'}).length;
  var E=SAUDE.est||{},f=E.fbk,er=E.err,num=function(v){return v==null?'—':Number(v).toLocaleString('pt-BR')};
  var tiles=function(L){return '<div class="la-nums fbk-sum">'+L.map(function(x){return '<span><b>'+x[0]+'</b>'+x[1]+'</span>'}).join('')+'</div>'};
  return '<h3 class="gh">Saúde e estatísticas</h3>'+
    '<p class="muted small keep">Confere agora, a partir deste aparelho, se cada serviço de que o app depende está respondendo. '+(SAUDE.quando?'Última verificação '+agoTxt(SAUDE.quando)+'.':'')+'</p>'+
    (SAUDE.quando?tiles([[nOk,'funcionando'],[nAv,'com atenção'],[nF,'fora do ar']]):'')+
    '<div class="glist sd-list">'+lista+'</div>'+
    '<div class="row gbtns"><button type="button" class="copy primary" id="sdCheck"'+(SAUDE.busy?' disabled':'')+'>'+(SAUDE.busy?'Verificando…':'Verificar agora')+'</button></div>'+
    '<h3 class="gh sd-sec">Uso</h3>'+
    (SH.on?tiles([[num(M.length),'pessoas no total'],[num(hoje),'usaram nas últimas 24 h'],[num(sem),'usaram nos últimos 7 dias'],[num(novos),'novas nos últimos 7 dias'],[num(vis),'visitas somadas']])
      :'<p class="muted small keep">Os números de uso aparecem no site com o Firebase.</p>')+
    '<h3 class="gh sd-sec">Participação (últimos 7 dias)</h3>'+
    tiles([[num(filas7),'filas do RU informadas'],[num(avisos7),'avisos'],[num(abertas),'solicitações abertas'],[f?num(f.sem):'—','feedbacks'],[f&&f.med!=null?f.med.toFixed(1).replace('.',','):'—','nota média do app'+(f?' ('+f.n+' no total)':'')]])+
    '<h3 class="gh sd-sec">Ônibus e erros</h3>'+
    tiles([[num(LIVE.bus.length),'ônibus da cidade no mapa agora'],[num((LVM.hist||[]).length),'medições da previsão neste aparelho'],[er?num(er.dia):'—','erros nos aparelhos (24 h)'],[er?num(er.sem):'—','erros (7 dias)']])+
    (er===undefined&&!gcan('usuarios')?'<p class="muted small keep">Os erros aparecem para quem tem o privilégio Usuários.</p>':'')+
    '<div class="row gbtns"><button type="button" class="copy" id="sdStats">Atualizar números</button></div>';
}
aoFazer('gestão montada',function(){if(gTab==='saude'&&$('#gBody'))$('#gBody').innerHTML=gSaude()});
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('#sdCheck')){saudeVerifica();renderGest();return}
  if(e.target.closest&&e.target.closest('#sdStats')){SAUDE.est=null;saudeEstatisticas();renderGest()}
});
