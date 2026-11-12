/* ======================= Alertas de ônibus: qual ônibus, onde e quando =======================
   O usuário cria até 5 alertas, cada um com: o ônibus (uma linha, qualquer linha ou um carro), o ponto,
   a antecedência (3, 5, 10 ou 15 min) e quando vale (só o próximo, ou sempre em certos dias e horários).
   - Ônibus da cidade: pela posição ao vivo (a mesma conta de "Chegando agora").
   - Linhas internas da UFRJ (sem GPS): pelo horário estimado do trajeto De → Para.
   Com o app aberto, o próprio app confere a cada 15 s. Com o app fechado, quem confere é o Worker (gatilho Cron):
   o app manda para /push/alertas o trecho do traçado que chega ao ponto (ou os horários, nas linhas internas) e o
   Worker avisa por notificação. Guardado no aparelho em cse-alertas-onibus. Criar: sino em "Chegando agora",
   botão em Seu trajeto e Ajustes › Alertas. */
var ALV={lista:[],max:5,folha:null,msg:'',push:false,sinc:0,disparados:{}};
try{var _alv=JSON.parse(localStorage.getItem('cse-alertas-onibus')||'[]');if(Array.isArray(_alv))ALV.lista=_alv}catch(e){}
var ALV_MIN=[3,5,10,15];
function alvSalva(){try{localStorage.setItem('cse-alertas-onibus',JSON.stringify(ALV.lista))}catch(e){}alvSincroniza();alvPinta()}
function alvVivos(){var ag=Date.now();return ALV.lista.filter(function(a){return a.on!==false&&!(a.fim&&ag>a.fim)})}
function alvLimpa(){var ag=Date.now(),n=ALV.lista.length;ALV.lista=ALV.lista.filter(function(a){return !(a.fim&&ag>a.fim)});if(ALV.lista.length!==n)alvSalva()}
/* a camada ao vivo precisa estar rodando enquanto houver alerta de ônibus da cidade valendo */
/* (é chamada logo na carga pela parte 20, antes de ALV existir: por isso a guarda) */
function alvQuerVivo(){return !!ALV&&alvVivos().some(function(a){return a.tipo==='c'&&alvNaHora(a)})}
function alvMinDia(h){var p=String(h||'').split(':');return (+p[0]||0)*60+(+p[1]||0)}
function alvNaHora(a){
  if(a.quando!=='sempre')return true;
  var d=new Date(),dia=d.getDay(),m=d.getHours()*60+d.getMinutes(),de=alvMinDia(a.hDe),ate=alvMinDia(a.hAte);
  if(a.dias==='uteis'&&(dia===0||dia===6))return false;
  return de<=ate?m>=de&&m<=ate:m>=de||m<=ate;
}
function alvNomePonto(a){return a.tipo==='c'?(EXTS[a.ponto]?EXTS[a.ponto].name:'ponto'):(STOPS[a.de]?STOPS[a.de].name:'ponto')}
function alvLinhasDoPonto(id){return EXT.lines.filter(function(L){return L.st.some(function(s){return s[0]===id})}).map(function(L){return L.n}).filter(function(n,i,A){return A.indexOf(n)===i})}
function alvLinhasInternas(de,para){return Object.keys(LINES).filter(function(lid){return LINES[lid].trips.some(function(tr){for(var i=0;i<tr.passes.length;i++)if(tr.passes[i].stop===de)for(var j=i+1;j<tr.passes.length;j++)if(tr.passes[j].stop===para)return true;return false})})}
function alvResumo(a){
  var q=a.tipo==='c'?(a.carro?'Carro '+a.carro+(a.linhas[0]?' ('+a.linhas[0]+')':''):a.linhas.length?'Linha '+a.linhas.join(', '):'Qualquer linha'):(a.linhas.length?'Linha '+a.linhas.join(', '):'Qualquer linha interna');
  var onde=a.tipo==='c'?'em '+alvNomePonto(a):'de '+alvNomePonto(a)+' para '+(STOPS[a.para]?STOPS[a.para].short||STOPS[a.para].name:'');
  var qd=a.quando==='sempre'?(a.dias==='uteis'?'dias úteis':'todos os dias')+', '+a.hDe+' às '+a.hAte:'só o próximo';
  return {t:q+' · '+a.min+' min antes',s:onde+' · '+qd};
}
/* ---------- o que vai para o Worker ---------- */
/* trecho de até 3,5 km do traçado que chega ao ponto (lat/lon × 1e5), para cada traçado das linhas escolhidas */
function alvCorredores(a){
  var G=EXT.stops[a.ponto];if(!G)return [];
  var linhas=a.linhas.length?a.linhas:alvLinhasDoPonto(a.ponto),vistos={},out=[],kx=1.1132*Math.cos(G[1]*Math.PI/180),ky=1.10574;
  linhas.forEach(function(n){((EXT.sh||{})[n]||[]).forEach(function(i){
    if(vistos[i]||out.length>=6)return;vistos[i]=1;var d=EXT.shp[i],la=-2280000,lo=-4320000,P=[];
    for(var k=0;k<d.length;k+=2){la+=d[k];lo+=d[k+1];P.push([la,lo])}
    /* ponto do traçado mais perto da parada (os traçados têm poucos vértices: vale a projeção no segmento) */
    var bi=-1,bd=1e9,bq=null,gx=G[2]*1e5*kx,gy=G[1]*1e5*ky;
    for(k=1;k<P.length;k++){var ax=P[k-1][1]*kx,ay=P[k-1][0]*ky,dx=P[k][1]*kx-ax,dy=P[k][0]*ky-ay,L2=dx*dx+dy*dy||1e-9,t=Math.max(0,Math.min(1,((gx-ax)*dx+(gy-ay)*dy)/L2)),dd=Math.hypot(gx-ax-t*dx,gy-ay-t*dy);
      if(dd<bd){bd=dd;bi=k;bq=[Math.round(P[k-1][0]+t*(P[k][0]-P[k-1][0])),Math.round(P[k-1][1]+t*(P[k][1]-P[k-1][1]))]}}
    if(bi<1||bd>90)return;
    var C=[bq],ac=0,ant=bq;for(k=bi-1;k>=0&&ac<3500;k--){ac+=Math.hypot((ant[1]-P[k][1])*kx,(ant[0]-P[k][0])*ky);C.unshift(P[k]);ant=P[k]}
    if(C.length<2)return;
    while(C.length>80){var R=[];for(k=0;k<C.length;k+=2)R.push(C[k]);if(R[R.length-1]!==C[C.length-1])R.push(C[C.length-1]);C=R}
    var flat=[];C.forEach(function(p){flat.push(p[0],p[1])});out.push(flat)})});
  return out;
}
/* horários estimados (minuto do dia) em que as linhas internas escolhidas passam em "de" indo para "para" */
function alvHoras(a){
  var linhas=a.linhas.length?a.linhas:alvLinhasInternas(a.de,a.para),H={};
  linhas.forEach(function(lid){var L=LINES[lid];if(!L||L.susp)return;L.trips.forEach(function(tr){
    for(var i=0;i<tr.passes.length;i++){if(tr.passes[i].stop!==a.de)continue;
      for(var j=i+1;j<tr.passes.length;j++){if(tr.passes[j].stop!==a.para)continue;tr.deps.forEach(function(d){var m=Math.round(d+tr.passes[i].off);if(m>=0&&m<1440)H[m]=1});break}}})});
  return Object.keys(H).map(Number).sort(function(x,y){return x-y}).slice(0,200);
}
function alvParaServidor(a){
  var o={id:a.id,tipo:a.tipo,min:a.min,nome:alvNomePonto(a)};
  if(a.quando==='sempre'){o.dias=a.dias==='uteis'?[1,2,3,4,5]:[0,1,2,3,4,5,6];o.de=alvMinDia(a.hDe);o.ate=alvMinDia(a.hAte)}else{o.uma=1;o.fim=a.fim}
  if(a.tipo==='c'){o.l=a.linhas;if(a.carro)o.v=a.carro;o.cor=alvCorredores(a);if(!o.cor.length)return null}
  else{o.txt=a.linhas.length===1?'Linha '+a.linhas[0]:'Ônibus da UFRJ';o.horas=alvHoras(a);if(!o.horas.length)return null;
    var ints=alvLinhasInternas(a.de,a.para),uteis=ints.length&&ints.every(function(l){return LINES[l].weekdays});if(uteis&&!o.dias)o.dias=[1,2,3,4,5]}
  return o;
}
/* manda a lista ao Worker (assinando as notificações se preciso); sem permissão, os alertas valem só com o app aberto */
function alvSincroniza(pedir){
  if(!pushSuportado()||pushIosSemInstalar())return Promise.resolve(false);
  if(pushPermissao()!=='granted'&&!pedir)return Promise.resolve(false);
  var L=alvVivos().map(alvParaServidor).filter(Boolean),chave;
  return Promise.resolve(pushPermissao()==='granted'?'granted':Notification.requestPermission()).then(function(p){if(p!=='granted')throw new Error('negado');return pushChave()})
  .then(function(c){chave=c;return navigator.serviceWorker.ready})
  .then(function(reg){return reg.pushManager.getSubscription().then(function(s){
    if(s&&!pushMesmaChave(s,chave))return s.unsubscribe().then(function(){return null});return s})
    .then(function(s){if(s||!L.length)return s;return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushBytes(chave)})})})
  .then(function(s){if(!s)return false;
    return fetch(PUSH.url+'/alertas',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({endpoint:s.endpoint,alertas:L})}).then(function(r){return r.json()}).then(function(j){ALV.push=!!(j&&j.ok)&&L.length>0;ALV.sinc=Date.now();return ALV.push})})
  .catch(function(){ALV.push=false;return false});
}
function alvTem(){return ALV.lista.length>0}
/* ---------- conferência com o app aberto ---------- */
function alvDispara(chave,titulo,corpo,a){
  if(ALV.disparados[chave])return;ALV.disparados[chave]=Date.now();
  gToast(titulo+' · '+corpo);try{if(navigator.vibrate)navigator.vibrate([120,60,120])}catch(e){}
  /* com o Worker avisando, a notificação do aparelho vem dele; sem ele, o app mostra uma quando está em segundo plano */
  if(!ALV.push&&document.hidden&&pushPermissao()==='granted')try{new Notification(titulo,{body:corpo,tag:'onibus-'+a.id})}catch(e){}
  if(a.quando!=='sempre'){a.fim=Date.now()+60e3;try{localStorage.setItem('cse-alertas-onibus',JSON.stringify(ALV.lista))}catch(e){}setTimeout(alvPinta,300)}
}
function alvConfere(){
  alvLimpa();var now=nowMin();
  alvVivos().forEach(function(a){
    if(!alvNaHora(a))return;
    if(a.tipo==='c'){
      var L=chegandoEm(a.ponto).filter(function(x){return a.carro?x.o.v===a.carro:(!a.linhas.length||a.linhas.indexOf(x.o.l)>=0)});
      var x=L.filter(function(x){return x.t<=a.min*60})[0];if(!x)return;var m=Math.round(x.t/60);
      alvDispara(a.id+'|'+x.o.v,x.o.l+' chega em '+(m?'~'+m+' min':'instantes'),'Em '+alvNomePonto(a)+', a '+segM(x.m)+'. Carro '+x.o.v+'.',a);
    }else{
      var O=(options(a.de,a.para,now)||[]).filter(function(o){return !a.linhas.length||a.linhas.indexOf(String(o.lid))>=0})[0];if(!O)return;
      var d=Math.round(O.dep)-now;if(d<0||d>a.min)return;
      alvDispara(a.id+'|'+Math.round(O.dep),'Linha '+O.lid+' passa em '+(d?'~'+d+' min':'instantes'),'Em '+alvNomePonto(a)+'. Horário estimado.',a);
    }
  });
}
setInterval(alvConfere,15000);setTimeout(alvConfere,5000);
/* ---------- criar ---------- */
function alvNovoId(){return 'a'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36)}
function alvCria(a){
  if(ALV.lista.length>=ALV.max){gToast('Você já tem '+ALV.max+' alertas. Apague um em Ajustes › Alertas para criar outro.');return false}
  a.id=alvNovoId();a.on=true;a.criado=Date.now();if(a.quando!=='sempre')a.fim=Date.now()+3*3600e3;
  ALV.lista.push(a);try{localStorage.setItem('cse-alertas-onibus',JSON.stringify(ALV.lista))}catch(e){}
  alvSincroniza(true).then(function(ok){
    gToast(ok?'Alerta criado. Você recebe o aviso mesmo com o app fechado.':pushIosSemInstalar()?'Alerta criado. No iPhone, ele avisa com o app aberto; para receber com o app fechado, instale o app na Tela de Início.':'Alerta criado. Ele avisa enquanto o app estiver aberto.');alvPinta()});
  if(a.tipo==='c'&&LIVE.url)liveLoop();alvPinta();setTimeout(alvConfere,1500);return true;
}
function alvFolhaHTML(F){
  var linhas=F.tipo==='c'?alvLinhasDoPonto(F.ponto):alvLinhasInternas(F.de,F.para);
  var onde=F.tipo==='c'?'No ponto <b>'+esc(EXTS[F.ponto].name)+'</b> · ônibus da cidade, pela posição ao vivo':'De <b>'+esc(STOPS[F.de].name)+'</b> para <b>'+esc(STOPS[F.para].name)+'</b> · linhas internas, pelo horário estimado';
  return '<div class="inst-topo"><div><h2 id="alvT">Avisar quando o ônibus estiver chegando</h2><p class="inst-sub">'+onde+'</p></div></div>'+
    '<label class="fld alv-f">Qual ônibus<select id="alvLinha"><option value="">'+(F.tipo==='c'?'Qualquer linha':'Qualquer linha interna')+'</option>'+linhas.map(function(n){var L=F.tipo==='c'?segLinha(n):null;return '<option value="'+esc(n)+'"'+(F.linha===String(n)?' selected':'')+'>'+(F.tipo==='c'?esc(n)+(L&&L.d?' · para '+esc(L.d):''):'Linha '+esc(n)+' · '+esc(LINES[n].name))+'</option>'}).join('')+'</select></label>'+
    '<div class="alv-f"><p class="balvo-t"><b>Avisar com antecedência de</b></p><div class="seg chips" role="group" aria-label="Antecedência">'+ALV_MIN.map(function(m){return '<button type="button" data-alvmin="'+m+'" aria-pressed="'+(F.min===m)+'">'+m+' min</button>'}).join('')+'</div></div>'+
    '<div class="alv-f"><p class="balvo-t"><b>Quando</b></p><div class="seg chips" role="group" aria-label="Quando"><button type="button" data-alvq="uma" aria-pressed="'+(F.quando==='uma')+'">Só o próximo</button><button type="button" data-alvq="sempre" aria-pressed="'+(F.quando==='sempre')+'">Sempre</button></div></div>'+
    (F.quando==='sempre'?'<div class="alv-f"><div class="seg chips" role="group" aria-label="Dias"><button type="button" data-alvd="uteis" aria-pressed="'+(F.dias==='uteis')+'">Dias úteis</button><button type="button" data-alvd="todos" aria-pressed="'+(F.dias==='todos')+'">Todos os dias</button></div>'+
      '<div class="alv-h"><label class="fld">Das<input type="time" id="alvDe" value="'+esc(F.hDe)+'"></label><label class="fld">Até<input type="time" id="alvAte" value="'+esc(F.hAte)+'"></label></div></div>':
      '<p class="inst-dica">Vale para o próximo ônibus, nas próximas 3 horas.</p>')+
    '<div class="inst-acoes inst-fim"><button type="button" class="linkbtn" id="alvCancela">Cancelar</button><button type="button" class="copy primary" id="alvOk">Criar alerta</button></div>';
}
function alvAbre(F){
  if(ALV.folha)alvFecha();
  F.min=F.min||5;F.quando=F.quando||'uma';F.dias=F.dias||'uteis';F.hDe=F.hDe||'06:00';F.hAte=F.hAte||'23:00';F.linha=F.linha||'';ALV.folha=F;ALV.antes=document.activeElement;
  document.body.insertAdjacentHTML('beforeend','<div class="inst-fundo" id="alvFundo"></div><div class="inst-folha" id="alvFolha" role="dialog" aria-modal="true" aria-labelledby="alvT">'+alvFolhaHTML(F)+'</div>');
  requestAnimationFrame(function(){var f=$('#alvFolha');if(f){f.classList.add('on');$('#alvFundo').classList.add('on');var s=$('#alvLinha');if(s)s.focus({preventScroll:true})}});
}
function alvLeFolha(){var F=ALV.folha;if(!F)return;var s=$('#alvLinha');if(s)F.linha=s.value;var d=$('#alvDe'),a=$('#alvAte');if(d&&d.value)F.hDe=d.value;if(a&&a.value)F.hAte=a.value}
function alvRepintaFolha(){var f=$('#alvFolha');if(f&&ALV.folha)f.innerHTML=alvFolhaHTML(ALV.folha)}
function alvFecha(){var f=$('#alvFolha'),g=$('#alvFundo');if(f)f.remove();if(g)g.remove();ALV.folha=null;try{if(ALV.antes&&ALV.antes.focus)ALV.antes.focus({preventScroll:true})}catch(e){}}
function alvAbrePonto(id){if(EXTS[id])alvAbre({tipo:'c',ponto:id})}
function alvAbreTrajeto(){if(STOPS[state.from]&&STOPS[state.to]&&state.from!==state.to)alvAbre({tipo:'i',de:state.from,para:state.to});else gToast('Escolha a origem e o destino em Seu trajeto.')}
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;var b;
  if((b=t.closest('[data-alvponto]'))){alvAbrePonto(b.dataset.alvponto);return}
  if(t.closest('[data-alvtrajeto]')){alvAbreTrajeto();return}
  if((b=t.closest('[data-alvcarro]'))){var p=b.dataset.alvcarro.split('|');alvCria({tipo:'c',ponto:p[0],carro:p[1],linhas:p[2]?[p[2]]:[],min:5,quando:'uma'});return}
  if((b=t.closest('[data-alvmin]'))){alvLeFolha();ALV.folha.min=+b.dataset.alvmin;alvRepintaFolha();return}
  if((b=t.closest('[data-alvq]'))){alvLeFolha();ALV.folha.quando=b.dataset.alvq;alvRepintaFolha();return}
  if((b=t.closest('[data-alvd]'))){alvLeFolha();ALV.folha.dias=b.dataset.alvd;alvRepintaFolha();return}
  if(t.closest('#alvCancela')||t.closest('#alvFundo')){alvFecha();return}
  if(t.closest('#alvOk')){alvLeFolha();var F=ALV.folha,a={tipo:F.tipo,linhas:F.linha?[F.linha]:[],min:F.min,quando:F.quando,dias:F.dias,hDe:F.hDe,hAte:F.hAte};
    if(F.tipo==='c')a.ponto=F.ponto;else{a.de=F.de;a.para=F.para}alvFecha();alvCria(a);return}
  if((b=t.closest('[data-alvdel]'))){ALV.lista=ALV.lista.filter(function(a){return a.id!==b.dataset.alvdel});alvSalva();gToast('Alerta apagado.');return}
  if((b=t.closest('[data-alvnovo]'))){var id=$('#alvNovoPonto')&&$('#alvNovoPonto').value;if(id==='~trajeto')alvAbreTrajeto();else alvAbrePonto(id);return}
});
document.addEventListener('change',function(e){var t=e.target;if(t.dataset&&t.dataset.alvon){var a=ALV.lista.filter(function(a){return a.id===t.dataset.alvon})[0];if(a){a.on=t.checked;alvSalva()}}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&ALV.folha)alvFecha()});
/* ---------- telas ---------- */
/* "Chegando agora": botão para criar o alerta do ponto e sino em cada ônibus da lista */
aoFazer('detalhe montado',function(){
  var box=detail&&detail.querySelector('#chgBox');if(!box||!state.sel||state.sel.kind!=='ext'||box.querySelector('.alv-ponto'))return;var id=state.sel.id;
  box.insertAdjacentHTML('beforeend','<button type="button" class="copy alv-ponto" data-alvponto="'+esc(id)+'">'+ALV_SINO+'Avisar quando um ônibus estiver chegando</button>');
  box.querySelectorAll('[data-chgseg]').forEach(function(s){var v=s.dataset.chgseg,o=LIVE.bus.filter(function(o){return o.v===v})[0];if(!o)return;
    var tem=ALV.lista.some(function(a){return a.carro===v&&a.ponto===id});
    s.insertAdjacentHTML('beforebegin','<button type="button" class="alv-sino'+(tem?' on':'')+'" data-alvcarro="'+esc(id+'|'+v+'|'+o.l)+'"'+(tem?' disabled':'')+' aria-label="'+(tem?'Alerta já criado para o carro ':'Avisar quando o carro ')+esc(v)+(tem?'':' estiver a 5 min deste ponto')+'">'+ALV_SINO+'</button>')});
});
var ALV_SINO='<svg class="alv-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
/* Seu trajeto: alerta das linhas internas para a origem e o destino escolhidos */
function alvBotaoTrajeto(){
  if(!plan||plan.querySelector('#alvTrajeto'))return;var w=plan.querySelector('#wdet-plan')||plan.querySelector('details');if(!w)return;
  w.insertAdjacentHTML('beforebegin','<button type="button" class="copy alv-traj" id="alvTrajeto" data-alvtrajeto>'+ALV_SINO+'Avisar quando o ônibus estiver chegando</button>');
}
aoFazer('trajeto montado',alvBotaoTrajeto);alvBotaoTrajeto();/* o trajeto já foi montado antes desta parte carregar */
/* Ajustes › Alertas: a lista, com liga/desliga e apagar, e a criação de um alerta novo */
function alvAjustesHTML(){
  alvLimpa();
  var h='<h3 class="la-h3">Meus alertas de ônibus</h3><p class="muted small keep">Escolha o ônibus, o ponto, a antecedência e quando vale. '+(ALV.push?'Os avisos chegam mesmo com o app fechado.':pushIosSemInstalar()?'No iPhone, instale o app na Tela de Início para receber com o app fechado.':pushSuportado()?'Ao criar o primeiro, o app pede permissão para avisar com o app fechado.':'Neste navegador, os avisos aparecem com o app aberto.')+'</p>';
  if(ALV.lista.length)h+='<ul class="alv-lista">'+ALV.lista.map(function(a){var r=alvResumo(a);
    return '<li class="alv-item"><span class="grow"><b>'+esc(r.t)+'</b><small>'+esc(r.s)+'</small></span>'+
      '<label class="alv-sw"><input type="checkbox" role="switch" data-alvon="'+esc(a.id)+'"'+(a.on!==false?' checked':'')+' aria-label="Alerta ligado"></label>'+
      '<button type="button" class="alv-x" data-alvdel="'+esc(a.id)+'" aria-label="Apagar este alerta">×</button></li>'}).join('')+'</ul>';
  else h+='<p class="muted small keep">Nenhum alerta criado.</p>';
  if(ALV.lista.length<ALV.max){
    var ids=Object.keys(EXTS).sort(function(x,y){return EXTS[x].name.localeCompare(EXTS[y].name)});
    h+='<div class="alv-novo"><label class="fld">Novo alerta em<select id="alvNovoPonto"><option value="~trajeto">Linhas internas: meu trajeto ('+esc(STOPS[state.from].short||STOPS[state.from].name)+' → '+esc(STOPS[state.to].short||STOPS[state.to].name)+')</option>'+
      ids.map(function(k){return '<option value="'+esc(k)+'">Ônibus da cidade: '+esc(EXTS[k].name)+'</option>'}).join('')+'</select></label>'+
      '<button type="button" class="copy" data-alvnovo>Criar alerta</button></div>';
  }else h+='<p class="muted small keep">Limite de '+ALV.max+' alertas. Apague um para criar outro.</p>';
  return h;
}
function alvPinta(){var b=$('#alvCfg');if(b)b.innerHTML=alvAjustesHTML();var d=detail&&detail.querySelector('#chgBox');if(d&&state.sel&&state.sel.kind==='ext')renderDetail()}
aoFazer('ajustes montados',function(){var s=$('#alsec');if(!s||$('#alvCfg'))return;s.insertAdjacentHTML('beforeend','<div id="alvCfg" class="alv-cfg">'+alvAjustesHTML()+'</div>')});
/* ao abrir o app: confirma a lista no Worker (ele esquece o aparelho se a assinatura mudou) */
setTimeout(function(){if(ALV.lista.length)alvSincroniza(false).then(alvPinta)},6000);
