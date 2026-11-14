/* ======================= De casa até a UFRJ (e de volta) =======================
   Para quem vem de fora: calouros, pacientes do HU, quem trabalha no Fundão. A pessoa escolhe de onde sai (um ponto
   de ônibus da cidade, pela busca, ou a localização do aparelho) e para onde vai na UFRJ; o app junta o ônibus ou BRT
   da prefeitura do Rio até a ilha com a linha interna (ou a caminhada) até o destino. Na volta, sai de um ponto da
   UFRJ até perto de casa ou até a Vila Residencial.
   "Hora de sair": com "Chegar até", o app procura a saída mais tarde que ainda chega a tempo (a hora da próxima aula
   da Grade vem sugerida). A viagem pode ser programada (até 4: dias e horário) e, com as notificações ligadas, o
   aviso chega na hora de ir para o ponto, pelo mesmo serviço dos Avisos de ônibus (ALV_EXTRA em 39-alertas-onibus.js).
   Ônibus da cidade: o GTFS da prefeitura do Rio só tem frequências ("a cada x min"), não horas de verdade; conferido
   com o GPS (tools/conferir_horarios.py), quem chegava ao ponto na "hora" do GTFS chegava a tempo só 35% das vezes.
   Por isso o app não promete hora de ônibus da cidade: soma a espera medida no GPS (por linha e faixa de horário;
   sem GPS, o intervalo programado × fator) e o tempo de viagem do GTFS com folga, e mostra "por volta de" (mediana)
   e "até" (85%). Com a folga, 81% chegaram a tempo no mesmo teste. Linhas internas: horários da Prefeitura
   Universitária. Dados em vindo-de-fora.json (tools/vindo_de_fora.py, baixado só quando a seção abre).
   A casa e as viagens programadas ficam só neste navegador (cse-vf), nunca na conta; a casa, como um ponto
   aproximado (~100 m). */
var VF_ARQ='vindo-de-fora.json';
var VF={d:null,carregando:false,erro:false,aba:'ida',origem:null,para:'',de:'',alvo:'',modo:'',h:'',busca:'',res:null,msg:'',max:4,ver:0};
var VF_PE=75,VF_FATOR=1.3,VF_RAIO=700,VF_TROCA=2;/* caminhada: 75 m/min, linha reta × 1,3; até 700 m do ponto; 2 min para trocar */
function vfCfg(){try{var o=JSON.parse(localStorage.getItem('cse-vf')||'{}');return o&&typeof o==='object'?o:{}}catch(e){return {}}}
function vfGuarda(o){try{localStorage.setItem('cse-vf',JSON.stringify(o))}catch(e){}}
function vfCasa(){var c=vfCfg().casa;return c&&isFinite(c.la)&&isFinite(c.lo)?c:null}
function vfProgs(){var p=vfCfg().prog;return Array.isArray(p)?p.filter(function(x){return x&&x.id}):[]}
/* ---------- dados ---------- */
function vfCarrega(){
  if(VF.d||VF.carregando||!window.fetch)return;VF.carregando=true;VF.erro=false;
  fetch(VF_ARQ).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){VF.d=vfPrepara(d);VF.carregando=false;vfRecalculaProgs();vfPinta()})
    .catch(function(){VF.carregando=false;VF.erro=true;vfPinta()});
}
function vfMetros(la,lo){return [lo*1e-5*111320*Math.cos(-22.85*Math.PI/180),la*1e-5*110574]}
function vfPrepara(d){
  var P=d.p.map(function(p){var m=vfMetros(p[1],p[2]);return {n:p[0],la:p[1]/1e5,lo:p[2]/1e5,x:m[0],y:m[1],il:p[3]===1,perto:[],r:[]}});
  /* pontos da ilha: as paradas da UFRJ a até 300 m, com a caminhada */
  P.forEach(function(p){if(!p.il)return;var q=ll2map(p.la,p.lo);Object.keys(STOPS).forEach(function(k){
    var m=Math.hypot(STOPS[k].p[0]-q[0],STOPS[k].p[1]-q[1])/MPU*VF_FATOR;if(m<=300)p.perto.push([k,Math.max(1,Math.round(m/VF_PE))])})});
  d.r.forEach(function(R,ri){for(var i=0;i<R.s.length;i+=2)P[R.s[i]].r.push([ri,i])});
  return {p:P,r:d.r,ate:d.ate||'',e:d.e||{},r2:d.r2||{},k:d.k||[0.75,1.5],fx:d.fx||[[5,7],[7,9],[9,13],[13,18],[18,29]],gps:d.gps||'',cache:{}};
}
/* ---------- dia e linhas internas ---------- */
function vfDia(off){var d=new Date();d.setDate(d.getDate()+(off||0));var w=d.getDay(),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  if(typeof FERIADOS!=='undefined'&&FERIADOS.some(function(f){return f[0]===k}))return 'D';return w===0?'D':w===6?'S':'U'}
/* a linha interna mais cedo de u até v saindo depois de t (como options(), mas para um dia escolhido) */
function vfInt(u,v,t,dia,C){
  if(u===v)return {dep:t,arr:t,lid:null};var ch=u+'|'+v+'|'+Math.round(t);if(C&&ch in C)return C[ch];var best=null,fds=dia!=='U';
  Object.keys(LINES).forEach(function(lid){var L=LINES[lid];if(L.susp||(L.weekdays&&fds))return;
    L.trips.forEach(function(tr){for(var i=0;i<tr.passes.length;i++){if(tr.passes[i].stop!==u)continue;
      for(var j=i+1;j<tr.passes.length;j++){if(tr.passes[j].stop!==v)continue;
        tr.deps.forEach(function(d){var dep=d+tr.passes[i].off,arr=d+tr.passes[j].off;if(dep>=t&&(!best||arr<best.arr))best={lid:lid,dep:dep,arr:arr}});break}}})});
  if(C)C[ch]=best;return best;
}
/* a linha interna mais tarde de u até v que chega até T */
function vfIntAte(u,v,T,dia,C){
  var ch='a'+u+'|'+v+'|'+Math.round(T);if(C&&ch in C)return C[ch];var best=null,fds=dia!=='U';
  Object.keys(LINES).forEach(function(lid){var L=LINES[lid];if(L.susp||(L.weekdays&&fds))return;
    L.trips.forEach(function(tr){for(var i=0;i<tr.passes.length;i++){if(tr.passes[i].stop!==u)continue;
      for(var j=i+1;j<tr.passes.length;j++){if(tr.passes[j].stop!==v)continue;
        tr.deps.forEach(function(d){var dep=d+tr.passes[i].off,arr=d+tr.passes[j].off;if(arr<=T&&arr>T-120&&(!best||dep>best.dep))best={lid:lid,dep:dep,arr:arr}});break}}})});
  if(C)C[ch]=best;return best;
}
/* ---------- ônibus da cidade: espera e viagem ---------- */
function vfFaixa(m){var h=((m/60)%24+24)%24;if(h<5)h+=24;var F=VF.d.fx;for(var i=0;i<F.length;i++)if(h>=F[i][0]&&h<F[i][1])return i;return F.length-1}
/* saídas programadas de uma linha (mesmo número e destino) num ponto */
function vfSaidasNoPonto(i,R,dia){var D=VF.d,ch=i+'|'+R.n+'|'+R.d+'|'+dia;if(D.cache[ch])return D.cache[ch];var L=[];
  D.p[i].r.forEach(function(x){var Q=D.r[x[0]];if(Q.n!==R.n||Q.d!==R.d)return;((Q.t&&Q.t[dia])||[]).forEach(function(s){L.push(s+Q.s[x[1]+1])})});
  return D.cache[ch]=L.sort(function(a,b){return a-b})}
function vfConta(L,a,b){var n=0;for(var k=0;k<L.length;k++)if(L[k]>=a&&L[k]<b)n++;return n}
/* espera no ponto i chegando às m: [mediana, folga] e se veio do GPS; null se a linha não passa nessa hora */
function vfEspera(i,R,m,dia){
  var c=vfConta(vfSaidasNoPonto(i,R,dia),m-30,m+30);if(!c)return null;
  var g=dia==='U'&&VF.d.e[R.n]&&VF.d.e[R.n][vfFaixa(m)];if(g)return {w:g,gps:true};
  var h=60/c;return {w:[Math.round(h*VF.d.k[0]*10)/10,Math.round(h*VF.d.k[1]*10)/10],gps:false};
}
function vfRazao(m){return VF.d.r2[vfFaixa(m)]||[1,1.3]}
/* esta variante da viagem vale perto da hora m? (o tempo de viagem muda com a hora do dia) */
function vfVariante(R,pos,m,dia){var o=R.s[pos+1];return ((R.t&&R.t[dia])||[]).some(function(s){return Math.abs(s+o-m)<=45})}
/* o trecho de ônibus da cidade do ponto pos ao q, chegando ao ponto às A: espera, viagem e chegada (mediana e folga) */
function vfTrecho(R,pos,q,A,dia){
  var i=R.s[pos],E=vfEspera(i,R,A,dia);if(!E||!vfVariante(R,pos,A,dia))return null;
  var base=R.s[q+1]-R.s[pos+1],r=vfRazao(A),v=[base*r[0],base*r[1]];
  return {A:A,w:E.w,gps:E.gps,v:v,x:[A+E.w[0]+v[0],A+E.w[1]+v[1]]};
}
/* ---------- pontos perto de um lugar ---------- */
function vfPertoDe(la,lo){var m=vfMetros(la*1e5,lo*1e5),o=[];VF.d.p.forEach(function(p,i){if(p.il)return;var d=Math.hypot(p.x-m[0],p.y-m[1])*VF_FATOR;
  if(d<=VF_RAIO*VF_FATOR)o.push({i:i,w:Math.max(1,Math.round(d/VF_PE))})});return o}
function vfCor(R){return R.c||liveColor(R.n)}
function vfPernaC(R,pos,q,t){var D=VF.d;return {c:R,de:D.p[R.s[pos]].n,para:D.p[R.s[q]].n,A:t.A,w:t.w,gps:t.gps,v:t.v}}
/* ---------- ida: de perto de casa até a parada v da UFRJ ---------- */
function vfIda(orig,v,dia,modo,T){
  var O=vfPertoDe(orig.la,orig.lo),C={},porLinha={},D=VF.d;
  O.forEach(function(o){D.p[o.i].r.forEach(function(x){var R=D.r[x[0]],pos=x[1];
    for(var q=pos+2;q<R.s.length;q+=2){var pq=D.p[R.s[q]];if(!pq.il||!pq.perto.length)continue;
      pq.perto.forEach(function(k){
        var op=modo==='chegar'?vfIdaChegar(R,pos,q,k,o,v,dia,T,C):vfIdaAgora(R,pos,q,k,o,v,dia,T,C);if(!op)return;
        var b=porLinha[R.n];if(!b||(modo==='chegar'?op.sai>b.sai||(op.sai===b.sai&&op.tip<b.tip):op.fim<b.fim||(op.fim===b.fim&&op.tip<b.tip)))porLinha[R.n]=op})}
  })});
  return vfOrdena(porLinha,modo);
}
/* da ilha até v: chegando ao ponto da ilha às X, a pé ou de linha interna; devolve a chegada e as pernas */
function vfDaIlha(k,v,X,dia,C){
  if(k[0]===v)return {fim:X+k[1],p:[{pe:k[1],para:STOPS[v].name}]};
  var a=vfInt(k[0],v,X+k[1]+VF_TROCA,dia,C);if(!a)return null;
  return {fim:a.arr,p:[{pe:k[1],para:STOPS[k[0]].name},{i:a.lid,de:STOPS[k[0]].name,dep:a.dep,para:STOPS[v].name,arr:a.arr}]};
}
function vfIdaChegar(R,pos,q,k,o,v,dia,T,C){
  /* até quando é preciso estar no ponto da ilha */
  var X,a=null;if(k[0]===v)X=T-k[1];else{a=vfIntAte(k[0],v,T,dia,C);if(!a)return null;X=a.dep-k[1]-VF_TROCA}
  var base=R.s[q+1]-R.s[pos+1],A=X-base*1.3-15,t=null;
  for(var it=0;it<2;it++){var E=vfEspera(R.s[pos],R,A,dia);if(!E)return null;A=X-base*vfRazao(A)[1]-E.w[1]}
  t=vfTrecho(R,pos,q,A,dia);if(!t||t.x[1]>X+0.5)return null;
  var tip=vfDaIlha(k,v,t.x[0],dia,C),p=[{pe:o.w,para:D_n(R.s[pos])},vfPernaC(R,pos,q,t)];
  if(a)p.push({pe:k[1],para:STOPS[k[0]].name},{i:a.lid,de:STOPS[k[0]].name,dep:a.dep,para:STOPS[v].name,arr:a.arr});else p.push({pe:k[1],para:STOPS[v].name});
  var fim=a?a.arr:t.x[1]+k[1];return {sai:A-o.w,fim:fim,tip:tip?Math.min(tip.fim,fim):fim,pernas:p};
}
function D_n(i){return VF.d.p[i].n}
function vfIdaAgora(R,pos,q,k,o,v,dia,T,C){
  var A=T+o.w,t=vfTrecho(R,pos,q,A,dia);if(!t)return null;
  var seg=vfDaIlha(k,v,t.x[1],dia,C),tip=vfDaIlha(k,v,t.x[0],dia,C);if(!seg)return null;
  return {sai:T,fim:seg.fim,tip:tip?tip.fim:seg.fim,pernas:[{pe:o.w,para:D_n(R.s[pos])},vfPernaC(R,pos,q,t)].concat(seg.p)};
}
function vfOrdena(M,modo){return Object.keys(M).map(function(k){return M[k]}).sort(function(a,b){return modo==='chegar'?b.sai-a.sai:a.fim-b.fim}).slice(0,3)}
/* ---------- volta: da parada u da UFRJ até perto de casa, ou até a Vila ---------- */
function vfVolta(u,alvo,dia,T){
  var D=VF.d,C={},porLinha={},vila=alvo==='vila'?vilaPonto():null,casa=alvo==='casa'?vfCasa():null;if(!vila&&!casa)return [];
  var fimPe=vila?vila.min:0,fimNome=vila?'Vila Residencial':'casa';
  /* só a linha interna (Vila) */
  if(vila){var a=vfInt(u,vila.id,T,dia,C);if(a&&a.lid)porLinha['i'+a.lid]={sai:a.dep,fim:a.arr+fimPe,tip:a.arr+fimPe,pernas:[{i:a.lid,de:STOPS[u].name,dep:a.dep,para:STOPS[vila.id].name,arr:a.arr},{pe:fimPe,para:fimNome}]}}
  /* chegar a cada ponto da cidade na ilha: a pé ou de linha interna */
  var chegaPonto={};D.p.forEach(function(p,i){if(!p.il)return;var best=null;
    p.perto.forEach(function(k){var a=k[0]===u?{lid:null,dep:T,arr:T}:vfInt(u,k[0],T,dia,C);if(!a)return;var t=a.arr+k[1]+(a.lid?VF_TROCA:0);if(!best||t<best.t)best={t:t,k:k,a:a}});
    if(best)chegaPonto[i]=best});
  var destinos={};if(casa)vfPertoDe(casa.la,casa.lo).forEach(function(o){destinos[o.i]=o.w});
  else D.p.forEach(function(p,i){if(!p.il)return;p.perto.forEach(function(k){if(k[0]===vila.id)destinos[i]=k[1]})});
  Object.keys(chegaPonto).forEach(function(ii){var i=+ii,cp=chegaPonto[i];D.p[i].r.forEach(function(x){var R=D.r[x[0]],pos=x[1];
    var desce=null;for(var q=pos+2;q<R.s.length;q+=2)if(R.s[q] in destinos){if(desce==null||destinos[R.s[q]]<destinos[R.s[desce]])desce=q}
    if(desce==null)return;
    var t=vfTrecho(R,pos,desce,cp.t,dia);if(!t)return;
    var w=destinos[R.s[desce]]+(vila?fimPe:0),p=[];
    if(cp.a.lid)p.push({i:cp.a.lid,de:STOPS[u].name,dep:cp.a.dep,para:STOPS[cp.k[0]].name,arr:cp.a.arr});
    p.push({pe:cp.k[1],para:D.p[i].n});p.push(vfPernaC(R,pos,desce,t));p.push({pe:w,para:fimNome});
    var op={sai:cp.a.lid?cp.a.dep:T,fim:t.x[1]+w,tip:t.x[0]+w,pernas:p},b=porLinha[R.n];if(!b||op.fim<b.fim)porLinha[R.n]=op})});
  return vfOrdena(porLinha,'sair');
}
/* ---------- formulário ---------- */
function vfPadroes(){
  var nc=typeof nextClass==='function'&&typeof gradeList==='function'&&gradeList().length?nextClass(nowMin()):null;
  if(!VF.para)VF.para=nc?aulaStop(nc.a):(USO&&USO.visita?'hu':'ctl');
  if(!VF.de)VF.de=VF.para;
  if(!VF.alvo)VF.alvo=typeof usoMoraNaVila==='function'&&usoMoraNaVila()?'vila':'casa';
  if(!VF.modo){if(nc&&nc.dd===0&&!nc.going&&nc.rel>20){VF.modo='chegar';VF.h=fmt(nc.ini-10)}else VF.modo='agora'}
  if(!VF.h)VF.h=fmt(Math.ceil((nowMin()+60)/10)*10);
  if(!VF.origem){var c=vfCasa();if(c)VF.origem={n:c.n,la:c.la,lo:c.lo,casa:true}}
}
function vfParadasOpc(sel){return Object.keys(STOPS).sort(function(a,b){return STOPS[a].name.localeCompare(STOPS[b].name,'pt-BR')}).map(function(k){return '<option value="'+k+'"'+(k===sel?' selected':'')+'>'+esc(STOPS[k].name)+'</option>'}).join('')}
function vfNorm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
/* busca de pontos pelo nome (pontos com o mesmo nome a menos de 400 m viram um só) */
function vfBusca(q){
  var n=vfNorm(q);if(n.length<3||!VF.d)return [];var G={},o=[];
  VF.d.p.forEach(function(p,i){if(p.il||vfNorm(p.n).indexOf(n)<0)return;var g=G[p.n]||(G[p.n]=[]);
    var c=g.filter(function(c){return Math.hypot(c.x-p.x,c.y-p.y)<400})[0];if(!c){c={n:p.n,x:p.x,y:p.y,la:p.la,lo:p.lo,l:{}};g.push(c);o.push(c)}
    p.r.forEach(function(x){c.l[VF.d.r[x[0]].n]=1})});
  /* primeiro os que começam com o que foi digitado, depois os que têm a palavra, depois o resto */
  var nota=function(c){var x=vfNorm(c.n);return x.indexOf(n)===0?0:(' '+x).indexOf(' '+n)>=0?1:2};
  o.sort(function(a,b){return nota(a)-nota(b)||a.n.localeCompare(b.n,'pt-BR')});
  return o.slice(0,8).map(function(c){return {n:c.n,la:c.la,lo:c.lo,l:Object.keys(c.l).sort(function(a,b){return a.localeCompare(b,'pt-BR',{numeric:true})}).slice(0,6)}});
}
function vfBadge(p){return p.i?badge(p.i):'<span class="lb" style="--c:'+esc(vfCor(p.c))+'" title="Linha '+esc(p.c.n)+'">'+esc(p.c.n)+'</span>'}
function vfOpHTML(op,i){
  var tip=Math.round(op.tip),fim=Math.round(op.fim);
  var h='<li class="vf-op'+(i===0?' vf-1':'')+'"><p class="vf-sai"><span>Saia às <b class="mono">'+fmt(op.sai)+'</b></span><span class="muted small keep">'+(fim-tip>=2?'chega por volta de '+fmt(tip)+', até '+fmt(fim):'chega '+fmt(fim))+'</span></p><ol class="vf-pernas">';
  op.pernas.forEach(function(p){
    if(p.pe!=null){if(p.pe>0)h+='<li class="vf-pe"><span class="vf-ic" aria-hidden="true">🚶</span><span>Caminhe '+p.pe+' min até '+esc(p.para)+'</span></li>';return}
    /* ônibus da cidade: sem hora exata; linha interna: horário da Prefeitura Universitária */
    if(p.c)h+='<li class="vf-bus">'+vfBadge(p)+'<span><span>Esteja em '+esc(p.de)+' às '+fmt(p.A)+'</span> <span class="muted keep">(para '+esc(p.c.d)+')</span><span class="vf-l muted small keep">Espera típica ~'+Math.max(1,Math.round(p.w[0]))+' min · viagem ~'+Math.max(1,Math.round(p.v[0]))+' min'+(p.gps?'':' (estimada)')+'</span><span class="vf-l muted small keep">Desça em '+esc(p.para)+'</span></span></li>';
    else h+='<li class="vf-bus">'+vfBadge(p)+'<span><span class="mono">'+fmt(p.dep)+'</span> <span>Embarque em '+esc(p.de)+'</span><br><span class="muted small keep">Desça em '+esc(p.para)+' · '+fmt(p.arr)+'</span></span></li>'});
  return h+'</ol></li>';
}
function vfResultadoHTML(){
  if(VF.carregando)return '<p class="muted small keep" role="status">Carregando os horários dos ônibus…</p>';
  if(VF.erro)return '<p class="muted small keep">Não deu para carregar os horários dos ônibus da cidade. '+(typeof ON_SITE!=='undefined'&&!ON_SITE?'Abra o app pelo site.':'Confira a conexão.')+'</p>';
  if(!VF.d)return '';
  var r=vfCalcula();if(r.falta)return '<p class="muted small keep">'+r.falta+'</p>';
  var h=r.ops.length?'<ol class="vf-ops">'+r.ops.map(vfOpHTML).join('')+'</ol>':'<p class="muted small keep">'+r.vazio+'</p>';
  return (r.dia?'<p class="vf-dia small keep">'+r.dia+'</p>':'')+h+
    '<p class="muted small keep">Os ônibus da cidade não têm hora certa. A espera e a folga vêm do GPS da prefeitura do Rio: com elas, 8 em cada 10 viagens chegaram a tempo. Linhas internas: horários da Prefeitura Universitária.</p>';
}
/* T e o dia: "chegar até" uma hora que já passou vale para amanhã */
function vfQuando(){
  var now=nowMin();if(VF.modo==='agora')return {T:now,dia:vfDia(0),off:0};
  var T=toMin(VF.h||'00:00'),off=T<now?1:0;return {T:T,dia:vfDia(off),off:off};
}
function vfCalcula(){
  var q=vfQuando(),dia=q.off?'Para amanhã'+(q.dia==='U'?'':q.dia==='S'?' (sábado)':' (domingo ou feriado)')+'.':q.dia!=='U'?'Hoje os ônibus seguem os horários de '+(q.dia==='S'?'sábado':'domingo e feriado')+'.':'';
  if(VF.aba==='ida'){
    if(!VF.origem)return {falta:'Escolha de onde você sai: busque o ponto de ônibus perto de casa ou use a localização.'};
    var ops=vfIda(VF.origem,VF.para,q.dia,VF.modo==='chegar'?'chegar':'sair',q.T);
    return {ops:ops,dia:dia,vazio:VF.modo==='chegar'?'Nenhum ônibus da cidade chega a tempo saindo daí. Tente um horário mais tarde ou outro ponto perto de casa.':'Nenhum ônibus da cidade perto daí até a UFRJ nas próximas 3 horas. Tente outro ponto perto de casa.'};
  }
  if(VF.alvo==='casa'&&!vfCasa())return {falta:'Para a volta, salve sua casa na aba Ida (o ponto de ônibus perto de casa).'};
  var o=vfVolta(VF.de,VF.alvo,q.dia,q.T);
  return {ops:o,dia:dia,vazio:VF.alvo==='vila'?'Nenhuma linha até a Vila depois desse horário.':'Nenhum ônibus da cidade da UFRJ até perto da sua casa nas próximas 2 horas.'};
}
function vfFormHTML(){
  vfPadroes();var h='<div class="seg chips vf-abas" role="group" aria-label="Sentido"><button type="button" data-vfaba="ida" aria-pressed="'+(VF.aba==='ida')+'">Ida para a UFRJ</button><button type="button" data-vfaba="volta" aria-pressed="'+(VF.aba==='volta')+'">Volta</button></div>';
  if(VF.aba==='ida'){
    var c=vfCasa(),o=VF.origem;
    h+='<div class="vf-de"><p class="balvo-t"><b>Saindo de</b></p>'+(o?'<p class="vf-orig small keep"><span>'+(o.casa?'Casa · ':'')+esc(o.n)+'</span><button type="button" class="linkbtn" id="vfTroca">Trocar</button></p>':'')+
      (!o||VF.trocando?'<label class="fld">Ponto de ônibus perto de casa<input type="search" id="vfBusca" autocomplete="off" placeholder="Ex.: Avenida Brasil, Penha, Méier" value="'+esc(VF.busca)+'"></label><ul class="vf-lista" id="vfLista">'+vfListaHTML()+'</ul>'+
        '<button type="button" class="copy" id="vfLocal">Usar minha localização</button>':'')+
      (o&&!o.casa?'<button type="button" class="linkbtn" id="vfSalvaCasa">Salvar como minha casa</button>':'')+(c&&o&&o.casa?'':'')+'</div>'+
      '<label class="fld">Para<select id="vfPara">'+vfParadasOpc(VF.para)+'</select></label>';
  }else{
    h+='<label class="fld">Saindo de<select id="vfDe">'+vfParadasOpc(VF.de)+'</select></label>'+
      '<p class="balvo-t"><b>Para</b></p><div class="seg chips" role="group" aria-label="Para onde"><button type="button" data-vfalvo="casa" aria-pressed="'+(VF.alvo==='casa')+'">Minha casa</button><button type="button" data-vfalvo="vila" aria-pressed="'+(VF.alvo==='vila')+'">Vila Residencial</button></div>';
  }
  h+='<p class="balvo-t"><b>Quando</b></p><div class="vf-quando"><div class="seg chips" role="group" aria-label="Quando"><button type="button" data-vfmodo="agora" aria-pressed="'+(VF.modo==='agora')+'">Sair agora</button><button type="button" data-vfmodo="'+(VF.aba==='ida'?'chegar':'sair')+'" aria-pressed="'+(VF.modo!=='agora')+'">'+(VF.aba==='ida'?'Chegar até':'Sair às')+'</button></div>'+
    (VF.modo!=='agora'?'<input type="time" id="vfHora" aria-label="Horário" value="'+esc(VF.h)+'">':'')+'</div>';
  return h;
}
function vfListaHTML(){if(!VF.d)return '';return vfBusca(VF.busca).map(function(c,i){return '<li><button type="button" data-vfp="'+i+'"><b>'+esc(c.n)+'</b><span class="muted small keep">'+esc(c.l.join(', '))+'</span></button></li>'}).join('')}
/* ---------- programados ---------- */
function vfDiasTxt(d){return d==='todos'?'todos os dias':'dias úteis'}
function vfProgTxt(p){return p.s==='ida'?'Ida · chegar até '+p.h+' em '+(STOPS[p.p]?STOPS[p.p].name:'UFRJ'):'Volta · sair às '+p.h+' de '+(STOPS[p.o]?STOPS[p.o].name:'UFRJ')+' para '+(p.p==='vila'?'a Vila Residencial':'casa')}
/* a viagem programada num dia: a melhor opção */
function vfProgCalc(p,dia){
  if(!VF.d)return null;var T=toMin(p.h);
  if(p.s==='ida'){var c=vfCasa();if(!c||!STOPS[p.p])return null;return vfIda(c,p.p,dia,'chegar',T)[0]||null}
  if(!STOPS[p.o])return null;return vfVolta(p.o,p.p,dia,T)[0]||null;
}
/* guarda, para cada tipo de dia, o primeiro ônibus e a caminhada: o aviso funciona sem baixar os horários de novo */
function vfRecalculaProgs(){
  if(!VF.d)return;var o=vfCfg(),mudou=false;
  (o.prog||[]).forEach(function(p){var c={};(p.dias==='todos'?['U','S','D']:['U']).forEach(function(dia){var op=vfProgCalc(p,dia);if(!op)return;
      var b=op.pernas.filter(function(x){return x.pe==null})[0],pe=op.pernas[0].pe!=null?op.pernas[0].pe:0;
      /* o aviso sai na hora de sair: "o 635 passa em ~N min" com N = caminhada + espera típica (ônibus da cidade) */
      var h=b.c?b.A+b.w[0]:b.dep,min=b.c?pe+b.w[0]:pe+3;if(min>30){h-=min-30;min=30}
      c[dia]={ln:b.i?String(b.i):b.c.n,h:Math.round(h),sai:Math.round(op.sai),min:Math.max(3,Math.round(min)),txt:'Hora de sair: '+(b.i?'linha '+b.i:'o '+b.c.n),nome:p.s==='ida'?'seu ponto':b.de}});/* o ponto perto de casa não vai para o servidor */
    if(JSON.stringify(c)!==JSON.stringify(p.c||{})){p.c=c;mudou=true}});
  if(mudou){vfGuarda(o);if(typeof alvSincroniza==='function'&&vfProgs().some(function(p){return p.av}))alvSincroniza(false)}
}
function vfDiasDe(dia){return dia==='U'?[1,2,3,4,5]:dia==='S'?[6]:[0]}
/* para o Worker (avisos com o app fechado) */
function vfAlertas(){var S=[];vfProgs().forEach(function(p){if(!p.av||!p.c)return;Object.keys(p.c).forEach(function(dia){var c=p.c[dia];
  S.push({id:(p.id+dia).slice(0,24),tipo:'i',min:c.min,nome:c.nome,txt:c.txt,horas:[((c.h%1440)+1440)%1440],dias:vfDiasDe(dia)})})});return S}
if(typeof ALV_EXTRA!=='undefined')ALV_EXTRA.push(vfAlertas);
/* com o app aberto */
function vfConfere(){var now=nowMin(),dia=vfDia(0);vfProgs().forEach(function(p){if(!p.av||!p.c||!p.c[dia]||(p.dias!=='todos'&&dia!=='U'))return;var c=p.c[dia],f=c.h-now;
  if(f>=0&&f<=c.min&&typeof alvDispara==='function')alvDispara('vf|'+p.id+'|'+isoToday(),c.txt+' passa em '+(f?'~'+f+' min':'instantes'),'Em '+c.nome+'. Horário estimado.',{id:p.id})})}
setInterval(vfConfere,15000);
function vfProgsHTML(){
  var L=vfProgs();if(!L.length)return '';var dia=vfDia(0);
  return '<div class="vf-progs"><h3>Programados</h3><ul class="vf-plista">'+L.map(function(p){var c=p.c&&p.c[dia]&&(p.dias==='todos'||dia==='U')?p.c[dia]:null;
    return '<li><span class="grow"><b>'+esc(vfProgTxt(p))+'</b><span class="muted small keep">'+vfDiasTxt(p.dias)+(c?' · hoje: saia às '+fmt(c.sai):'')+'</span></span>'+
      '<button type="button" class="linkbtn" data-vfav="'+esc(p.id)+'" aria-pressed="'+!!p.av+'">'+(p.av?'Avisar: ligado':'Avisar: desligado')+'</button>'+
      '<button type="button" class="alv-x" data-vfdel="'+esc(p.id)+'" aria-label="Apagar esta viagem">×</button></li>'}).join('')+'</ul></div>';
}
function vfPodeProgramar(){return VF.modo!=='agora'&&(VF.aba==='ida'?!!vfCasa():VF.alvo==='vila'||!!vfCasa())}
function vfProgramaHTML(){
  if(!VF.d||!vfPodeProgramar()||vfProgs().length>=VF.max)return VF.modo!=='agora'&&VF.aba==='ida'&&!vfCasa()&&VF.origem?'<p class="muted small keep">Para programar esta viagem, salve o ponto como sua casa.</p>':'';
  return '<div class="vf-prog"><div class="seg chips" role="group" aria-label="Dias"><button type="button" data-vfdias="uteis" aria-pressed="'+(VF.dias!=='todos')+'">Dias úteis</button><button type="button" data-vfdias="todos" aria-pressed="'+(VF.dias==='todos')+'">Todos os dias</button></div>'+
    '<button type="button" class="copy" id="vfProgramar">Programar esta viagem</button></div>';
}
function vfInnerHTML(){
  if(!VF.d&&!VF.carregando&&!VF.erro)vfCarrega();
  return '<p class="muted small keep">Ônibus e BRT da prefeitura do Rio até a ilha, e daí a linha interna ou a caminhada.</p>'+vfFormHTML()+'<div id="vfRes" aria-live="polite">'+vfResultadoHTML()+'</div>'+vfProgramaHTML()+
    (VF.msg?'<p class="muted small keep" role="status">'+esc(VF.msg)+'</p>':'')+vfProgsHTML()+'<p class="muted small keep">'+'<span class="jae-n">Passagem com o Jaé.</span> '+(VF.d&&VF.d.ate?'Horários válidos até '+VF.d.ate.slice(6,8)+'/'+VF.d.ate.slice(4,6)+'/'+VF.d.ate.slice(0,4)+'.':'')+'</p>';
}
function vfAberto(){try{return localStorage.getItem('cse-fold-vf')==='1'}catch(e){return false}}
function vfSub(){var L=vfProgs(),dia=vfDia(0),c=null;L.forEach(function(p){var x=p.c&&p.c[dia]&&(p.dias==='todos'||dia==='U')?p.c[dia]:null;if(x&&x.sai>=nowMin()-5&&(!c||x.sai<c.sai))c=x});
  return c?'Hoje: saia às '+fmt(c.sai)+' · '+(c.ln||''):'Ônibus da cidade, BRT e linhas internas'}
function vfHTML(){var o=vfAberto();return '<div id="vfBox">'+foldHTML('fdVf',o,'De casa até a UFRJ','<small>'+esc(vfSub())+'</small>',o?vfInnerHTML():'')+'</div>'}
function vfPinta(){
  if(typeof plan==='undefined'||!plan)return;var b=$('#vfBox');
  if(b&&document.activeElement&&b.contains(document.activeElement)&&/^(INPUT|SELECT)$/.test(document.activeElement.tagName)&&document.activeElement.id!=='vfHora'){vfParcial();return}
  var t=document.createElement('div');t.innerHTML=vfHTML();
  if(b){b.replaceWith(t.firstChild);return}
  var f=$('#favBox');if(f)f.insertAdjacentElement('afterend',t.firstChild);else plan.insertAdjacentElement('afterbegin',t.firstChild);
}
/* enquanto se digita na busca, troca só a lista e o resultado (o campo continua com o foco) */
function vfParcial(){var l=$('#vfLista');if(l)l.innerHTML=vfListaHTML();var r=$('#vfRes');if(r)r.innerHTML=vfResultadoHTML()}
aoFazer('trajeto montado',vfPinta);vfPinta();
document.addEventListener('toggle',function(e){if(e.target.id!=='fdVf')return;try{localStorage.setItem('cse-fold-vf',e.target.open?'1':'0')}catch(x){}
  if(e.target.open&&!e.target.querySelector('#vfRes'))vfPinta()},true);
document.addEventListener('input',function(e){var t=e.target;if(!t.closest||!t.closest('#vfBox'))return;
  if(t.id==='vfBusca'){VF.busca=t.value;var l=$('#vfLista');if(l)l.innerHTML=vfListaHTML();return}
  if(t.id==='vfHora'&&/^\d\d:\d\d$/.test(t.value)){VF.h=t.value;var r=$('#vfRes');if(r)r.innerHTML=vfResultadoHTML()}});
document.addEventListener('change',function(e){var t=e.target;if(!t.closest||!t.closest('#vfBox'))return;
  if(t.id==='vfPara'){VF.para=t.value;vfPinta()}else if(t.id==='vfDe'){VF.de=t.value;vfPinta()}else if(t.id==='vfHora'){VF.h=t.value||VF.h;vfPinta()}});
document.addEventListener('click',function(e){var t=e.target;if(!t.closest||!t.closest('#vfBox'))return;var b;
  if((b=t.closest('[data-vfaba]'))){VF.aba=b.dataset.vfaba;VF.modo='';VF.h='';VF.msg='';if(VF.aba==='volta'){var nc=typeof gradeList==='function'&&gradeList().length?nextClass(nowMin()):null;
      if(nc&&nc.dd===0){VF.modo='sair';VF.h=fmt(nc.fim)}else VF.modo='agora'}else vfPadroes();vfPinta();return}
  if((b=t.closest('[data-vfmodo]'))){VF.modo=b.dataset.vfmodo;VF.msg='';vfPinta();if(VF.modo!=='agora'){var h=$('#vfHora');if(h)h.focus()}return}
  if((b=t.closest('[data-vfalvo]'))){VF.alvo=b.dataset.vfalvo;vfPinta();return}
  if((b=t.closest('[data-vfdias]'))){VF.dias=b.dataset.vfdias;vfPinta();return}
  if((b=t.closest('[data-vfp]'))){var c=vfBusca(VF.busca)[+b.dataset.vfp];if(c){VF.origem={n:c.n,la:c.la,lo:c.lo};VF.trocando=false;VF.busca='';VF.msg=''}vfPinta();return}
  if(t.closest('#vfTroca')){VF.trocando=true;vfPinta();var i=$('#vfBusca');if(i)i.focus();return}
  if(t.closest('#vfLocal')){vfLocal();return}
  if(t.closest('#vfSalvaCasa')){var o=vfCfg(),g=VF.origem;o.casa={n:g.n,la:Math.round(g.la*1e3)/1e3,lo:Math.round(g.lo*1e3)/1e3};vfGuarda(o);VF.origem={n:g.n,la:o.casa.la,lo:o.casa.lo,casa:true};VF.msg='Casa salva só neste aparelho. Ela vale para a ida e para a volta.';vfRecalculaProgs();vfPinta();return}
  if(t.closest('#vfProgramar')){vfPrograma();return}
  if((b=t.closest('[data-vfdel]'))){var o2=vfCfg();o2.prog=(o2.prog||[]).filter(function(p){return p.id!==b.dataset.vfdel});vfGuarda(o2);if(typeof alvSincroniza==='function')alvSincroniza(false);VF.msg='Viagem apagada.';vfPinta();return}
  if((b=t.closest('[data-vfav]'))){var o3=vfCfg(),p=(o3.prog||[]).filter(function(p){return p.id===b.dataset.vfav})[0];if(!p)return;p.av=!p.av;vfGuarda(o3);
    if(p.av&&typeof alvSincroniza==='function')alvSincroniza(true).then(function(ok){VF.msg=ok?'Aviso ligado: chega na hora de ir para o ponto.':(typeof alvMotivoTxt==='function'&&alvMotivoTxt()?alvMotivoTxt()+' Com o app aberto, o aviso aparece aqui.':'Com o app aberto, o aviso aparece aqui.');vfPinta()});
    else if(typeof alvSincroniza==='function')alvSincroniza(false);VF.msg=p.av?'':'Aviso desligado.';vfPinta();return}
});
function vfLocal(){
  if(!('geolocation' in navigator)){VF.msg='Este navegador não informa a localização.';vfPinta();return}
  VF.msg='Procurando onde você está…';vfPinta();
  navigator.geolocation.getCurrentPosition(function(p){var c=p.coords;VF.origem={n:'Onde você está agora',la:c.latitude,lo:c.longitude};VF.trocando=false;
      VF.msg=VF.d&&!vfPertoDe(c.latitude,c.longitude).length?'Nenhum ponto de ônibus até a UFRJ a menos de 700 m daqui. Busque um ponto pelo nome.':'';vfPinta()},
    function(){VF.msg='Não deu para saber onde você está. Busque o ponto pelo nome.';vfPinta()},{enableHighAccuracy:false,maximumAge:120000,timeout:15000});
}
function vfPrograma(){
  var o=vfCfg();o.prog=(o.prog||[]).filter(function(p){return p&&p.id});if(o.prog.length>=VF.max)return;
  var p={id:'v'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),s:VF.aba,h:VF.h,dias:VF.dias==='todos'?'todos':'uteis',av:false};
  if(VF.aba==='ida'){p.o='casa';p.p=VF.para}else{p.o=VF.de;p.p=VF.alvo}
  o.prog.push(p);vfGuarda(o);vfRecalculaProgs();VF.msg='Viagem programada. Ligue o aviso para saber a hora de sair.';vfPinta();
}
