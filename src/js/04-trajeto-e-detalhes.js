/* ---------- volta à noite (telefones: Prefeitura Universitária, dez/2024) ---------- */
var MOON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z"/></svg>';
var NIGHTITEM='<button class="item tint" type="button" style="--c:var(--l5)" data-kind="night" data-id="x"><span class="ico">'+MOON+'</span><span class="grow">Volta à noite<small>Último ônibus, guaritas e telefone da segurança</small></span></button>';
var CALLS=[
  {n:'DISEG – Cidade Universitária',d:'Divisão de Segurança da UFRJ · 24 horas',num:'(21) 97380-2554',raw:'21973802554'},
  {n:'Centro de Controle Operacional',d:'Prefeitura Universitária · WhatsApp 24 horas',num:'(21) 99871-1621',raw:'21998711621'},
  {n:'Polícia Militar',d:'Em caso de violência',num:'190',raw:'190'}
];
var NTIPS=['Evite chegar ou sair do campus sozinho tarde da noite; combine de ir junto com colegas.','Espere o ônibus em ponto movimentado e iluminado, sem deixar o celular à mostra.','Viu um carro rondando ou algo estranho? Anote placa, cor e modelo e avise a DISEG.','Não fique no prédio além do necessário depois que as aulas acabam.'];
function nightOK(lid){return !(LINES[lid].weekdays&&isWeekend()&&!state.manual)}
/* último ônibus de A até B, por linha */
function lastTo(from,to){
  var best={};
  Object.keys(LINES).forEach(function(lid){
    if(!nightOK(lid)||LINES[lid].susp)return;
    LINES[lid].trips.forEach(function(tr){
      var last=tr.deps[tr.deps.length-1];
      for(var i=0;i<tr.passes.length;i++){
        if(tr.passes[i].stop!==from)continue;
        for(var j=i+1;j<tr.passes.length;j++){
          if(tr.passes[j].stop!==to)continue;
          var dep=last+tr.passes[i].off,arr=last+tr.passes[j].off;
          if(!best[lid]||dep>best[lid].dep)best[lid]={lid:lid,dep:dep,arr:arr};
          break;
        }
      }
    });
  });
  return Object.keys(best).map(function(k){return best[k]}).sort(function(a,b){return b.dep-a.dep});
}
/* último horário de cada linha numa parada, por sentido */
function lastAt(lid,sid){
  var out={};
  LINES[lid].trips.forEach(function(tr){
    var last=tr.deps[tr.deps.length-1];
    tr.passes.forEach(function(ps,i){
      if(ps.stop!==sid||i===tr.passes.length-1)return;
      var to=tr.halves[ps.half].to,t=last+ps.off;
      if(!out[to]||t>out[to])out[to]=t;
    });
  });
  return Object.keys(out).map(function(k){return {to:k,t:out[k]}}).sort(function(a,b){return b.t-a.t});
}
function lastPill(t,now){
  var d=Math.round(t)-now;
  if(d<0)return '<span class="pill bad">Encerrado</span>';
  if(d<=60)return '<span class="pill warn">Faltam '+d+' min</span>';
  return '<span class="pill good">Ainda há tempo</span>';
}
function nightHTML(now){
  var from=state.nightFrom||state.to;state.nightFrom=from;
  /* destino: a Estação BRT ou, para quem mora na Vila Residencial (perfil de uso), o ponto mais perto da Vila */
  var dest=nightDest(),vila=dest!=='est',DN=STOPS[dest].short||STOPS[dest].name,V=vila?vilaPonto():null;
  var ape=vila?' De lá até a Vila são uns '+V.min+' min a pé ('+V.m+' m).':'';
  var opts=SORTED.map(function(k){return '<option value="'+k+'"'+(k===from?' selected':'')+'>'+STOPS[k].name+'</option>'}).join('');
  var top='';
  if(from===dest){
    top=vila?'<div class="next"><p><b>Você já está no ponto mais perto da Vila Residencial.</b></p><p class="muted small">'+ape.trim().replace('De lá','Daqui')+'</p></div>'
      :'<div class="next"><p><b>Você já está na Estação BRT.</b></p><p class="muted small">Daqui saem o BRT e os ônibus para fora da ilha.</p></div>';
  }else{
    var L=lastTo(from,dest);
    if(!L.length)top='<div class="next"><p><b>Nenhuma linha vai direto daqui para '+(vila?'o ponto mais perto da Vila Residencial ('+DN+')':'a Estação BRT')+'.</b></p><p class="muted small">Veja abaixo os últimos horários de cada linha nesta parada.</p></div>';
    else{
      var b=L[0],d=Math.round(b.dep)-now;
      top='<div class="next lastbig"><p class="eyebrow">Último ônibus daqui para '+(vila?'a Vila Residencial (ponto '+DN+')':'a Estação BRT')+'</p>'+
        '<div class="nx-top">'+badge(b.lid)+'<span>Linha '+b.lid+' · '+LINES[b.lid].name+'</span></div>'+
        '<div class="nx-big"><span class="nx-min">'+tilde(b.lid)+bt(b.dep)+'</span>'+lastPill(b.dep,now)+'</div>'+faixaGraf(b.dep,now,b.lid)+
        '<p class="muted small">'+(d>=0?(CFG.faixa?'Passa '+relB(b.dep,now).pre+' '+relB(b.dep,now).val:'Faltam '+(d>=60?Math.floor(d/60)+' h '+(d%60)+' min':d+' min'))+'. ':'Este horário já passou hoje. ')+(vila?'Chega no ponto '+DN+' ':'Chega na Estação ')+(CFG.faixa?atTxt(b.arr):'por volta de '+fmt(b.arr))+'.'+ape+'</p>'+
        (L.length>1?'<div class="later"><span class="lab">Outras</span>'+L.slice(1).map(function(c){return badge(c.lid)+' <span class="mono">'+tilde(c.lid)+bt(c.dep)+'</span>'}).join(' ')+'</div>':'')+'</div>';
    }
  }
  if(usoMoraNaVila())top+='<p class="small keep"><button type="button" class="linkbtn" data-nightest>'+(vila?'Hoje vou sair da ilha: ver a volta para a Estação BRT':'Ver a volta para a Vila Residencial')+'</button></p>';
  var rows=linesAt(from).map(function(lid){
    if(!nightOK(lid))return '<div class="lastrow">'+badge(lid)+'<span class="grow">'+LINES[lid].name+'</span><span class="pill bad">Só seg. a sex.</span></div>';
    return lastAt(lid,from).map(function(g){
      return '<div class="lastrow">'+badge(lid)+'<span class="grow">Sentido '+g.to+'</span><span class="mono">'+tilde(lid)+bt(g.t)+'</span>'+lastPill(g.t,now)+'</div>';
    }).join('');
  }).join('');
  return '<button class="back" type="button" data-go="home">← Voltar</button>'+
    '<div><p class="eyebrow">Segurança</p><h2>Volta à noite</h2></div>'+
    (isWeekend()&&!state.manual?weekendNote:'')+
    '<label class="fld">Onde você está?<select id="nightFrom">'+opts+'</select></label>'+top+
    (from!==dest?(function(){var o=options(from,dest,now)[0]||lastTo(from,dest)[0];return o?warnHTML({from:from,to:dest,lid:o.lid,dep:o.dep,arr:o.arr},'night',true):''})():'')+
    '<h3>Último horário de cada linha aqui</h3><div>'+rows+'</div>'+
    nightShareHTML()+'<h3>Telefones da segurança</h3><div class="calls">'+CALLS.map(function(c){
      return '<div class="callrow"><span class="grow"><b>'+c.n+'</b><small>'+c.d+'</small></span><a class="num" href="tel:'+c.raw+'">'+c.num+'</a><button class="copy" type="button" data-copy="'+c.num+'">Copiar</button></div>';
    }).join('')+'</div>'+
    '<p class="muted small">Salve esses números no celular antes de precisar. Se a ligação não abrir pelo botão, copie o número.</p>'+
    '<h3>Guaritas</h3><div class="list">'+Object.keys(GUARDS).map(function(id){
      var g=GUARDS[id];
      return '<button class="item tint" type="button" style="--c:var(--warn)" data-kind="guard" data-id="'+id+'"><span class="lb" style="--c:var(--mc-guard);color:#0A0E13">'+g.short+'</span><span class="grow">'+g.name+'<small>'+g.where+'</small></span></button>';
    }).join('')+'</div>'+
    '<h3>Dicas da Prefeitura Universitária</h3><ul class="tips">'+NTIPS.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul>';
}
function guardHTML(id){
  var g=GUARDS[id];
  var near=Object.keys(STOPS).filter(function(s){return Math.hypot(STOPS[s].p[0]-g.p[0],STOPS[s].p[1]-g.p[1])<=130});
  return '<button class="back" type="button" data-kind="night" data-id="x">← Volta à noite</button>'+
    '<div><p class="eyebrow">Segurança · guarita</p><h2>'+g.name+'</h2></div><p>'+g.where+'</p>'+
    '<p class="note">No mapa da Prefeitura Universitária, as guaritas aparecem com o nº 33, junto da Divisão de Segurança (DISEG). Em caso de problema, procure a guarita mais próxima ou ligue para a DISEG.</p>'+
    '<div class="calls">'+CALLS.slice(0,2).map(function(c){
      return '<div class="callrow"><span class="grow"><b>'+c.n+'</b><small>'+c.d+'</small></span><a class="num" href="tel:'+c.raw+'">'+c.num+'</a><button class="copy" type="button" data-copy="'+c.num+'">Copiar</button></div>';
    }).join('')+'</div>'+
    (near.length?'<h3>Paradas por perto</h3><div class="list">'+near.map(stopItem).join('')+'</div>':'');
}
/* ---------- componentes ---------- */
function badge(id){return '<span class="lb" style="--c:var('+LINES[id].color+')" title="Linha '+id+'">'+id+'</span>'}
function barsSvg(n,w,h){var hs=[3.5,6,8.5,11],s='<svg class="bars" viewBox="0 0 14 12" width="'+(w||22)+'" height="'+(h||19)+'" aria-hidden="true">';for(var i=0;i<4;i++)s+='<rect class="'+(i<n?'bf':'bo')+'" x="'+(i*3.7)+'" y="'+(12-hs[i])+'" width="2.6" height="'+hs[i]+'" rx=".7"/>';return s+'</svg>'}
function wifiItem(id){var a=avgOf(id),q=info(a);return '<button class="item" type="button" data-kind="wifi" data-id="'+id+'">'+barsSvg(q.bars)+'<span class="grow">'+WIFI[id].name+'</span><span class="mono">'+br(a)+'</span></button>'}
function stopItem(id){return '<button class="item" type="button" data-kind="stop" data-id="'+id+'"><span class="grow">'+STOPS[id].name+'</span>'+linesAt(id).map(badge).join('')+'</button>'}
/* na faixa: quantos minutos faltam para o começo e o fim da janela */
function relB(t,now){if(!CFG.faixa)return rel(t,now);var f=faixaOf(t),a=Math.max(0,f[0]-now),b=f[1]-now;if(b<=0)return {pre:'',val:'Agora'};if(a<=0)return {pre:'até',val:b+' min'};if(b<60)return {pre:'em',val:a+'–'+b+' min'};return {pre:'em',val:rel(t,now).val}}
/* gráfico da janela: uma barra por minuto; a altura é a chance de o ônibus passar naquele minuto */
function faixaGraf(m,now,lid){
  if(!CFG.faixa)return '';var f=faixaOf(m),w=f[1]-f[0],sd=Math.max(1.2,w/3.2),bars='';
  for(var t=f[0];t<=f[1];t++){var z=(t-m)/sd,h=Math.exp(-z*z/2);
    bars+='<i class="'+(t<now?'past':'')+(t===Math.round(m)?' pk':'')+'" style="height:'+Math.round(18+h*82)+'%"></i>'}
  var nowIn=now>=f[0]&&now<=f[1];
  return '<figure class="fxg"'+(lid&&LINES[lid]?' style="--fx:var(--l'+lid+')"':'')+' role="img" aria-label="O ônibus deve passar entre '+fmt(f[0])+' e '+fmt(f[1])+'. As barras mais altas são os minutos mais prováveis.">'+
    '<div class="fxg-b" aria-hidden="true">'+bars+(nowIn?'<b class="fxg-now" style="left:'+((now-f[0]+.5)/(w+1)*100).toFixed(1)+'%"><span>agora</span></b>':'')+'</div>'+
    '<figcaption aria-hidden="true"><span class="mono">'+fmt(f[0])+'</span><span>mais provável no meio</span><span class="mono">'+fmt(f[1])+'</span></figcaption></figure>';
}
function rel(t,now){var d=Math.round(t)-now;if(d<=0)return {pre:'',val:'Agora'};if(d<60)return {pre:'em',val:d+' min'};return {pre:'em',val:Math.floor(d/60)+' h '+(d%60)+' min'}}
function tilde(lid){return CFG.faixa?'':LINES[lid].approx?'~':''}
/* horário de ônibus: exato ou numa faixa de alguns minutos (Ajustes) */
function faixaOf(m){var w=+CFG.faixa||0,a=Math.round((m-w/2)/5)*5;return [a,a+w]}
function bt(m){if(!CFG.faixa)return fmt(m);var f=faixaOf(m);return fmt(f[0])+'–'+fmt(f[1])}
function atT(m){if(!CFG.faixa)return 'às <span class="mono">'+fmt(m)+'</span>';var f=faixaOf(m);return 'entre <span class="mono">'+fmt(f[0])+'</span> e <span class="mono">'+fmt(f[1])+'</span>'}
function atTxt(m){if(!CFG.faixa)return 'às '+fmt(m);var f=faixaOf(m);return 'entre '+fmt(f[0])+' e '+fmt(f[1])}
var weekendNote='<p class="note">Hoje é fim de semana. A página da Prefeitura Universitária só informa horários de dias úteis; confirme antes de sair.</p>';
/* ---------- planejador ---------- */
var plan=$('#plan'),detail=$('#detail');
function renderPlan(focusSel){
  /* busca de ponto: o foco volta para a caixa de busca certa depois de redesenhar */
  var ativo=document.activeElement,pedido=focusSel,buscaAtiva=ativo&&ativo.classList&&ativo.classList.contains('scb-in')?ativo.id:null;
  if(focusSel&&/^#(from|to)Q$/.test(focusSel))focusSel=focusSel.slice(0,-1);
  var now=nowMin(),f=state.from,t=state.to,body='';
  var opt=function(sel){return SORTED.map(function(k){return '<option value="'+k+'"'+(k===sel?' selected':'')+'>'+STOPS[k].name+'</option>'}).join('')};
  planBest=null;
  if(f===t){body='<p class="muted">Escolha pontos diferentes para origem e destino.</p>'}
  else{
    var o=options(f,t,now);
    if(!o.length){
      body=served(f,t)
        ?'<div class="next"><p><b>Sem mais circulares diretos hoje.</b></p><p class="muted">Mude o horário acima para ver as saídas de amanhã.</p></div>'
        :'<div class="next"><p><b>Nenhuma linha interna liga esses dois pontos direto.</b></p><p class="muted">Tente ir até a Estação BRT ou até o CT e trocar de linha lá.</p></div>';
    }else{
      var b=o[0],x=relB(b.dep,now);planBest=b;
      var more=passesAt(b.lid,f,now,5).filter(function(g){return g.to===b.to&&!g.last})[0];
      var later=more?more.times.filter(function(tm){return tm>b.dep+0.5}).slice(0,3):[];
      body='<div class="next"><div class="nx-top">'+badge(b.lid)+'<span>Linha '+b.lid+' · sentido '+b.to+'</span></div>'+
        '<div class="nx-big">'+(x.pre?'<span class="nx-in">passa '+x.pre+'</span>':'')+'<span class="nx-min">'+x.val+'</span></div>'+faixaGraf(b.dep,now,b.lid)+
        '<p>Embarque em <b>'+STOPS[f].name+'</b> '+(CFG.faixa?atT(b.dep):'às <span class="mono">'+tilde(b.lid)+fmt(b.dep)+'</span>')+'</p>'+
        '<p class="muted">Chega em '+STOPS[t].name+' '+(CFG.faixa?atT(b.arr):'por volta de <span class="mono">'+fmt(b.arr)+'</span>')+' · cerca de '+Math.max(1,Math.round(b.arr-b.dep))+' min</p></div>'+
        (later.length?'<p class="later"><span class="lab">Depois</span>'+later.map(function(tm){return '<span class="mono">'+tilde(b.lid)+bt(tm)+'</span>'}).join(' · ')+'</p>':'')+
        (o.length>1?'<div class="later"><span class="lab">Outras linhas</span>'+o.slice(1,4).map(function(c){return badge(c.lid)+' <span class="mono">'+tilde(c.lid)+bt(c.dep)+'</span> <span class="muted small">chega '+fmt(c.arr)+'</span>'}).join(' ')+'</div>':'');
    }
  }
  var ws=wifiNearStop(t);
  var fora='<details class="det"><summary>Como chegar à Ilha do Fundão</summary><dl class="kv">'+
    '<dt>BRT</dt><dd>Desça na estação Fundão – Cidade Universitária e pegue a linha interna na Estação de Integração.</dd>'+
    '<dt>Metrô</dt><dd>Del Castilho – Nova América e ônibus 913 até a Cidade Universitária.</dd>'+
    '<dt>Ônibus</dt><dd>Linhas como 485, 4, 913, 616 e 936 são citadas pela UFRJ. Confirme no app de transporte antes de sair.</dd></dl></details>';
  plan.innerHTML='<div><p class="eyebrow">Linhas internas da UFRJ</p><h2>Seu trajeto</h2></div>'+
    (isWeekend()&&!state.manual?weekendNote:'')+
    '<div class="fromto"><label class="fld">De<select id="from">'+opt(f)+'</select></label>'+
    '<button class="swap" id="swap" type="button" aria-label="Inverter origem e destino">⇅</button>'+
    '<label class="fld">Para<select id="to">'+opt(t)+'</select></label></div>'+
    body+
    (planBest?warnHTML({from:f,to:t,lid:planBest.lid,dep:planBest.dep,arr:planBest.arr},'plan',false):'')+
    NIGHTITEM+
    (ws.length?'<h3>Wi-Fi aberto perto do destino</h3><div class="list">'+ws.map(wifiItem).join('')+'</div>':'')+fora;
  if(focusSel){var el=plan.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
  enhanceStopSelect($('#from'));enhanceStopSelect($('#to'));
  var fid=pedido==='#from'||pedido==='#fromQ'?'fromQ':pedido==='#to'||pedido==='#toQ'?'toQ':buscaAtiva;
  if(fid){var q=document.getElementById(fid);if(q){SCB.quiet=true;q.focus({preventScroll:true});setTimeout(function(){SCB.quiet=false},0)}}
  etapas('trajeto montado');
}
/* ---------- detalhes ---------- */
function linesHTML(){
  return (typeof locCardHTML==='function'?locCardHTML():'')+(CFG.reps?repsHTML():'')+'<div><p class="eyebrow">Guia de prédios</p></div>'+
    '<div class="list">'+Object.keys(PLACES).map(function(id){
      return '<button class="item tint" type="button" style="--c:var(--ink-3)" data-kind="stop" data-id="'+id+'"><span class="lb" style="--c:var(--ink)">'+PLACES[id].name+'</span><span class="grow">'+PLACES[id].full+'<small>Institutos, bibliotecas e horários de funcionamento</small></span></button>';
    }).join('')+'</div>'+
    NIGHTITEM+
    '<div><p class="eyebrow">Transporte integrado</p><h2>Linhas internas</h2></div>'+
    '<p class="muted small">Toque numa linha para ver o itinerário, ou numa parada do mapa para ver os próximos horários.</p>'+
    '<div class="list">'+Object.keys(LINES).map(function(id){
      return '<button class="item tint" type="button" style="--c:var('+LINES[id].color+')" data-kind="line" data-id="'+id+'">'+badge(id)+'<span class="grow">'+LINES[id].name+'<small>'+LINES[id].sum+'</small></span>'+(LINES[id].susp?'<span class="pill bad">Suspensa</span>':LINES[id].aviso?'<span class="pill warn">Aviso</span>':'')+'</button>';
    }).join('')+'</div>';
}
function lineHTML(id,now){
  var l=LINES[id],h='';
  l.trips.forEach(function(tr){
    var d=tr.deps.filter(function(x){return x>=now})[0],tomorrow=d===undefined;
    if(tomorrow)d=tr.deps[0];
    tr.halves.forEach(function(hf,hi){
      var ps=tr.passes.filter(function(p){return p.half===hi||(hi>0&&p===tr.passes[0])}).filter(function(p,i,arr){return p.half===hi});
      if(hi>0){var prevLast=tr.passes.filter(function(p){return p.half===hi-1}).slice(-1)[0];if(prevLast&&ps[0]&&ps[0].stop!==prevLast.stop)ps=[ps[0]].concat(ps.slice(1));}
      h+='<h3>Sentido '+hf.to+'</h3><ol class="seq" style="--c:var('+l.color+')">'+ps.map(function(p){
        return '<li><button type="button" data-kind="stop" data-id="'+p.stop+'"><span class="nm">'+STOPS[p.stop].name+'</span><span class="mono muted">'+tilde(id)+bt(d+p.off)+'</span></button></li>';
      }).join('')+'</ol>';
    });
    h+='<p class="muted small">'+(tomorrow?'Primeira viagem de amanhã':'Próxima viagem')+': saída '+atT(d)+' de '+STOPS[tr.passes[0].stop].name+'. Horários por parada estimados.</p>';
  });
  return '<button class="back" type="button" data-go="home">← Todas as linhas</button>'+
    '<div class="nx-top">'+badge(id)+'<h2>'+l.name+'</h2></div><p class="muted">'+l.sum+'</p>'+lineNote(id)+h;
}
function stopHTML(id,now){
  var tts=linesAt(id).map(function(k){
    var gs=passesAt(k,id,now,3);
    var rows=gs.map(function(g){
      var body;
      if(g.last)return '<div class="tt-row"><span class="tt-dir">Ponto final do sentido '+g.to+'</span></div>';
      if(!g.times.length)body='<span class="muted small">Sem mais passagens hoje. Primeira de amanhã: <span class="mono">'+tilde(k)+bt(g.first)+'</span></span>';
      else{var x=relB(g.times[0],now);body='<div class="tt-times"><span class="mono first">'+tilde(k)+bt(g.times[0])+'</span><span class="in">'+(x.pre?x.pre+' '+x.val:x.val)+'</span>'+g.times.slice(1).map(function(t){return '<span class="mono">'+tilde(k)+bt(t)+'</span>'}).join('')+'</div>'}
      return '<div class="tt-row"><span class="tt-dir">Sentido '+g.to+'</span>'+body+'</div>';
    }).join('');
    return '<div class="tt"><button class="item" type="button" data-kind="line" data-id="'+k+'" style="border:0;padding:0;min-height:30px">'+badge(k)+'<span class="grow"><b>'+LINES[k].name+'</b></span>'+(LINES[k].susp?'<span class="pill bad">Suspensa</span>':'')+'</button>'+rows+'</div>';
  }).join('');
  var ws=wifiNearStop(id);
  return '<button class="back" type="button" data-go="home">← Todas as linhas</button>'+
    (PLACES[id]?placeHTML(id,now)+'<h3>Ônibus nesta parada</h3>':'<div><p class="eyebrow">Parada</p><h2>'+STOPS[id].name+'</h2></div>')+stopNote(id)+
    (isWeekend()&&!state.manual?weekendNote:'')+tts+
    '<div class="later"><button class="linkbtn" type="button" data-plan="from" style="padding-left:0">Sair daqui</button><button class="linkbtn" type="button" data-plan="to">Ir para cá</button></div>'+
    (ws.length?'<h3>Wi-Fi aberto por perto</h3><div class="list">'+ws.map(wifiItem).join('')+'</div>':'');
}
function wifiHTML(id){
  var w=WIFI[id],a=avgOf(id),q=info(a),m=mine[id],scale='';
  for(var i=1;i<=5;i++)scale+='<button type="button" data-rate="'+i+'" aria-pressed="'+(m===i)+'" aria-label="Nota '+i+' de 5">'+i+'</button>';
  var ss=stopsNearWifi(id);
  return '<button class="back" type="button" data-go="home">← Todas as linhas</button>'+
    '<div><p class="eyebrow">Wi-Fi aberto'+(isExample(id)?' · nota de exemplo':' · nota dos alunos')+'</p><h2>'+w.name+'</h2></div>'+
    '<div class="sig">'+barsSvg(q.bars,34,29)+'<span class="score"><b>'+br(a)+'</b> de 5 · '+votesOf(id)+' avaliações</span><span class="pill '+q.tone+'">'+q.label+'</span></div>'+
    '<dl class="kv"><dt>Rede</dt><dd>'+esc(w.ssid||'Nome a confirmar no local')+'</dd><dt>Acesso</dt><dd>'+esc(w.acesso||'Sem senha')+'</dd><dt>Dica</dt><dd>'+esc(w.note||'—')+'</dd></dl>'+
    '<div class="warnbox"><b>Atenção</b>Rede aberta não tem criptografia. Evite entrar no banco ou digitar senhas importantes aqui. Para isso, use os dados móveis.</div>'+
    (PERFIL?'':needProfileHTML('dar nota ao sinal'))+'<div class="rate"'+(PERFIL?'':' hidden')+'><p><b>Como está o sinal aqui agora?</b></p><div class="scale" role="group" aria-label="Nota do sinal">'+scale+'</div><div class="ends"><span>Fraco</span><span>Forte</span></div>'+
    (m?'<p class="muted small">Sua nota: '+m+'. '+(SH.on&&SH.uid&&!SH.denied?'Entra na média de todos.':'Salva só neste aparelho.')+'</p>':'')+(SH.on&&(SH.denied||SH.write===false)?(FBMODE?'<p class="small keep la-cta">Para sua nota contar na média, entre com sua conta. '+askBtn('wifi','Entrar')+'</p>':'<p class="muted small">'+'Para sua nota contar na média, o dono da página precisa te dar acesso de colaborador.</p>'):'')+'</div>'+
    '<button class="item tint" type="button" style="--c:var(--good)" data-kind="guide" data-id="eduroam"><span class="lb" style="--c:var(--good)">Wi-Fi</span><span class="grow">Prefira o eduroam<small>Rede segura com o login da UFRJ. Veja como conectar.</small></span></button>'+
    (ss.length?'<h3>Paradas por perto</h3><div class="list">'+ss.map(stopItem).join('')+'</div>':'');
}
function renderDetail(focusSel){
  if(state.sel&&state.sel.kind==='ext'){detail.innerHTML=extStopHTML(state.sel.id,nowMin());etapas('detalhe montado');return}/* ponto da prefeitura do Rio */
  var now=nowMin(),s=state.sel,h;
  if(!s)h=linesHTML();
  else if(s.kind==='line')h=lineHTML(s.id,now);
  else if(s.kind==='guide')h=eduHTML();
  else if(s.kind==='place')h='<button class="back" type="button" data-go="home">← Voltar</button>'+placeCard(s.id,now,true)+repBlock('pl:'+s.id);
  else if(s.kind==='night')h=nightHTML(now);
  else if(s.kind==='guard')h=guardHTML(s.id);
  else if(s.kind==='svc')h=svcHTML(s.id);
  else if(s.kind==='stop')h=stopHTML(s.id,now)+repBlock('stop:'+s.id);
  else if(WIFI[s.id])h=wifiHTML(s.id)+repBlock('wifi:'+s.id);
  else {state.sel=null;h=linesHTML()}  /* a rede saiu do ar enquanto estava aberta */
  detail.innerHTML=h;
  if(focusSel){var el=detail.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
  var s=state.sel,t=null,a='';
  if(s){
    if(s.kind==='stop'&&STOPS[s.id]){t='ponto';a='Ponto '+STOPS[s.id].name}
    else if(s.kind==='line'&&LINES[s.id]){t='onibus';a='Linha '+s.id+' · '+LINES[s.id].name}
    else if(s.kind==='wifi'&&WIFI[s.id]){t='wifi';a='Wi-Fi '+WIFI[s.id].name}
    if(t)detail.insertAdjacentHTML('beforeend','<button type="button" class="linkbtn sugg" data-req="'+t+'||'+esc(a)+'">Sugerir correção</button>');
  }
  etapas('detalhe montado');
}
function renderAll(){renderPlan();renderDetail();updateMap()}
function select(kind,id,scroll){
  /* ponto da prefeitura do Rio: liga a camada de ônibus da cidade e vai para Trajetos */
  if(kind==='ext'&&EXTS[id]){
    if(!state.layers.ext){state.layers.ext=true;try{localStorage.setItem('cse-lay-ext','1')}catch(e){}busChip();setTimeout(liveFetch,0)}
    setTab('trajeto');
  }
  /* destino automático: o ponto escolhido no mapa vira o destino */
  if(CFG.autoDest&&['stop','wifi','svc','place'].indexOf(kind)>=0){
    var to=pointStop(kind,id);
    if(to&&to!==state.to){
      var from=(typeof LOC!=='undefined'&&LOC.on&&LOC.near&&LOC.near.id!==to)?LOC.near.id:state.from;
      if(from===to)from=state.to!==to?state.to:(to==='est'?'ctl':'est');
      state.to=to;state.from=from;savePrefs();
    }
  }
  state.sel={kind:kind,id:id};
  renderAll();
  if(kind==='svc'&&SVCMAP[id])ensureVisible(SVCMAP[id].p);else if(kind==='stop'&&STOPS[id])ensureVisible(STOPS[id].p);else if(kind==='wifi'&&WIFI[id])ensureVisible(WIFI[id].p);else if(kind==='guard'&&GUARDS[id])ensureVisible(GUARDS[id].p);else if(kind==='night'&&STOPS[state.nightFrom])ensureVisible(STOPS[state.nightFrom].p);
  if(scroll&&window.matchMedia('(max-width:859px)').matches){
    detail.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
  }
  if(kind!=='wifi')wifiPopClose();
  if(kind==='night'){nightBadge();setTimeout(function(){var d=$('#detail');if(!d)return;var r=d.getBoundingClientRect();
    if(r.top>window.innerHeight*.55||r.bottom<80)d.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'})},80)}
}
/* ---------- eventos ---------- */
svg.addEventListener('click',function(e){
  if(suppressClick){suppressClick=false;return}
  var g=e.target.closest('.mk');
  if(g)select(g.dataset.kind,g.dataset.id,true);
  else if(state.sel){state.sel=null;renderAll()}
});
svg.addEventListener('keydown',function(e){
  if(e.key==='Enter'||e.key===' '){var g=e.target.closest('.mk');if(g){e.preventDefault();select(g.dataset.kind,g.dataset.id,true)}}
});
function onPanelClick(e){
  var t=e.target.closest('[data-go],[data-rate],[data-kind],[data-plan],#swap');
  if(!t)return;
  if(t.id==='swap'){var x=state.from;state.from=state.to;state.to=x;savePrefs();renderPlan('#swap');updateMap();return}
  if(t.dataset.go==='home'){state.sel=null;renderAll();return}
  if(t.dataset.plan&&state.sel){
    var sid=state.sel.id;
    if(t.dataset.plan==='from'){state.from=sid;if(state.to===sid)state.to=sid==='est'?'ctl':'est'}
    else{state.to=sid;if(state.from===sid)state.from=sid==='est'?'ctl':'est'}
    savePrefs();state.sel=null;renderAll();
    plan.scrollIntoView({behavior:'auto',block:'nearest'});return;
  }
  if(t.dataset.rate&&state.sel&&PERFIL){mine[state.sel.id]=+t.dataset.rate;saveMine();writeVotes();drawShared();renderDetail('[data-rate="'+t.dataset.rate+'"]');renderPlan();updateMap();return}
  if(t.dataset.kind)select(t.dataset.kind,t.dataset.id,this===plan);
}
plan.addEventListener('click',onPanelClick);
detail.addEventListener('click',onPanelClick);
detail.addEventListener('change',function(e){
  if(e.target.id==='nightFrom'){state.nightFrom=e.target.value;renderDetail('#nightFrom');updateMap();return}
  var i=e.target.dataset&&e.target.dataset.edu;
  if(i===undefined)return;
  if(e.target.checked)eduDone[i]=1;else delete eduDone[i];
  try{localStorage.setItem(DKEY,JSON.stringify(eduDone))}catch(err){}
  renderDetail('#edu'+i);
});
plan.addEventListener('change',function(e){
  if(e.target.id==='from'||e.target.id==='to'){
    state[e.target.id]=e.target.value;savePrefs();
    if(state.sel){state.sel=null;renderDetail()}
    renderPlan('#'+e.target.id);updateMap();
  }
});
function setLayer(key,btn){
  if(key==='ext'){try{localStorage.setItem('cse-lay-ext',state.layers.ext?'0':'1')}catch(e){}if(state.layers.ext&&state.sel&&state.sel.kind==='ext')state.sel=null}
  state.layers[key]=!state.layers[key];if(key==='wifi'){try{localStorage.setItem('cse-lay-wifi',state.layers.wifi?'1':'0')}catch(e){}if(!state.layers.wifi)wifiPopClose()}
  btn.setAttribute('aria-pressed',String(state.layers[key]));
  if(state.sel&&(((state.sel.kind==='stop'||state.sel.kind==='line')&&!state.layers.bus)||(state.sel.kind==='wifi'&&!state.layers.wifi)||(state.sel.kind==='svc'&&!state.layers.svc)))state.sel=null;
  renderAll();
  if(key==='ext')setTimeout(liveFetch,0);
  busChip();
}
$('#chBus').addEventListener('click',function(){setLayer('bus',this)});
function openNight(){setTab('trajeto');try{history.replaceState(null,'','#trajeto')}catch(e){}state.nightFrom=state.nightFrom||state.to;select('night','x',true)}
detail.addEventListener('click',function(e){
  var c=e.target.closest('[data-copy]');if(!c)return;
  var txt=c.dataset.copy,lab=c.textContent;
  function done(ok){c.textContent=ok?'Copiado':'Selecione o número';setTimeout(function(){c.textContent=lab},1600)}
  try{navigator.clipboard.writeText(txt).then(function(){done(true)},function(){selectNum(c);done(false)})}catch(err){selectNum(c);done(false)}
});
function selectNum(c){var n=c.parentNode.querySelector('.num');if(!n)return;var r=document.createRange();r.selectNodeContents(n);var s=window.getSelection();s.removeAllRanges();s.addRange(r)}
$('#chWifi').addEventListener('click',function(){setLayer('wifi',this)});
/* Horário simulado: o controle mora em Ajustes (CFG › Mapa); aqui só a lógica, por delegação, pois o campo #clk é recriado a cada vez que os Ajustes são redesenhados. */
document.addEventListener('input',function(e){
  if(!e.target||e.target.id!=='clk')return;
  var clk=e.target,nowBtn=$('#nowBtn');
  if(clk.value){state.manual=true;state.clk=clk.value;if(nowBtn)nowBtn.hidden=false}
  else{state.manual=false;state.clk='';if(nowBtn)nowBtn.hidden=true;clk.value=fmt(realNow())}
  renderAll();
});
document.addEventListener('click',function(e){
  if(!e.target.closest||!e.target.closest('#nowBtn'))return;
  state.manual=false;state.clk='';var clk=$('#clk');if(clk)clk.value=fmt(realNow());e.target.closest('#nowBtn').hidden=true;renderAll();
});
setInterval(function(){
  if(state.manual)return;
  var clk=$('#clk');if(clk)clk.value=fmt(realNow());
  var a=document.activeElement;
  if(!plan.contains(a)&&!detail.contains(a)&&!(a&&a.classList&&a.classList.contains('wtxt')))renderAll();
  if(!pPane.contains(a))renderPredios();
  if(gPane&&!gPane.contains(a))renderGrade();
  drawShared();
},30000);
