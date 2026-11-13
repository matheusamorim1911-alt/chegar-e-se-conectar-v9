/* ======================= Avisos de ônibus chegando =======================
   Tudo se programa em Ajustes › Avisos de ônibus (até 5): o ponto, quais ônibus (internos da UFRJ e/ou da cidade),
   a antecedência e quando vale (dias e horário). Os botões "Avisar…" dos painéis só levam para lá.
   Única exceção: o sininho de cada carro em "Chegando agora", que cria um aviso de uma vez só (push também) e se
   apaga ao avisar, voltando a ficar desligado.
   - Ônibus da cidade: pela posição ao vivo (a mesma conta de "Chegando agora").
   - Linhas internas da UFRJ (sem GPS): pelo horário estimado em cada parada.
   Com o app aberto, o próprio app confere a cada 15 s. Com o app fechado, quem confere é o Worker (gatilho Cron):
   o app manda para /push/alertas o trecho do traçado que chega ao ponto (ou os horários, nas linhas internas) e o
   Worker avisa por notificação. Guardado no aparelho em cse-avisos-onibus ({c: programados, u: de uma vez}). */
var ALV={lista:[],uma:[],max:5,maxUma:5,form:null,msg:'',busy:false,push:false,sinc:0,disparados:{},motivo:'',falhas:{}};
try{localStorage.removeItem('cse-alertas-onibus')}catch(e){}/* versão anterior: começa do zero */
try{var _alv=JSON.parse(localStorage.getItem('cse-avisos-onibus')||'{}');if(_alv&&Array.isArray(_alv.c))ALV.lista=_alv.c.slice(0,ALV.max);if(_alv&&Array.isArray(_alv.u))ALV.uma=_alv.u.slice(0,ALV.maxUma)}catch(e){}
var ALV_MIN=[3,5,10,15];
function alvGuarda(){try{localStorage.setItem('cse-avisos-onibus',JSON.stringify({c:ALV.lista,u:ALV.uma}))}catch(e){}}
function alvSalva(){alvGuarda();alvSincroniza();alvPinta()}
function alvVivosUma(){var ag=Date.now();return ALV.uma.filter(function(a){return !(a.fim&&ag>a.fim)})}
function alvLimpa(){var ag=Date.now(),n=ALV.uma.length;ALV.uma=ALV.uma.filter(function(a){return !(a.fim&&ag>a.fim)});if(ALV.uma.length!==n)alvSalva()}
/* a camada ao vivo precisa estar rodando enquanto houver aviso de ônibus da cidade valendo (a parte 20 chama antes de ALV existir: por isso a guarda) */
function alvQuerVivo(){return !!ALV&&(ALV.uma.length>0||ALV.lista.some(function(a){return a.on!==false&&a.ext&&a.gr&&alvNaHora(a)}))}
function alvMinDia(h){var p=String(h||'').split(':');return (+p[0]||0)*60+(+p[1]||0)}
function alvNaHora(a){
  var d=new Date(),dia=d.getDay(),m=d.getHours()*60+d.getMinutes(),de=alvMinDia(a.hDe),ate=alvMinDia(a.hAte);
  if(a.dias==='uteis'&&(dia===0||dia===6))return false;
  return de<=ate?m>=de&&m<=ate:m>=de||m<=ate;
}
/* ---------- os pontos: parada da UFRJ e ponto da cidade no mesmo lugar são um só ---------- */
function alvPontos(){
  var intern={},out=[],usados={};
  Object.keys(LINES).forEach(function(lid){LINES[lid].trips.forEach(function(tr){tr.passes.forEach(function(p){intern[p.stop]=1})})});
  Object.keys(intern).forEach(function(s){if(!STOPS[s])return;var gr=EXTS['a_'+s]?'a_'+s:'';if(gr)usados[gr]=1;out.push({k:'s:'+s,name:STOPS[s].name,st:s,gr:gr})});
  Object.keys(EXTS).forEach(function(g){if(usados[g])return;var G=EXTS[g],n=G.stop&&STOPS[G.stop]?STOPS[G.stop].name:G.name;out.push({k:'g:'+g,name:n,st:'',gr:g})});
  return out.sort(function(x,y){return x.name.localeCompare(y.name,'pt-BR')});
}
function alvPonto(k){return alvPontos().filter(function(p){return p.k===k})[0]||null}
function alvPontoDe(a){return alvPontos().filter(function(p){return (a.st&&p.st===a.st)||(!a.st&&a.gr&&p.gr===a.gr)})[0]||null}
function alvNome(a){var p=alvPontoDe(a);return p?p.name:(a.nome||'ponto')}
function alvLinhasDoPonto(id){return EXT.lines.filter(function(L){return L.st.some(function(s){return s[0]===id})}).map(function(L){return L.n}).filter(function(n,i,A){return A.indexOf(n)===i})}
function alvResumo(a){
  var q=a.int&&a.ext?'Internos e da cidade':a.int?'Internos da UFRJ':'Da cidade';
  return {t:alvNome(a),s:q+' · '+a.min+' min antes · '+(a.dias==='uteis'?'dias úteis':'todos os dias')+', '+a.hDe+'–'+a.hAte};
}
/* ---------- o que vai para o Worker ---------- */
/* trecho de até 3,5 km do traçado que chega ao ponto (lat/lon × 1e5), para cada traçado das linhas que passam nele */
function alvCorredores(a,todas){
  /* o ponto do app pode juntar várias paradas do GTFS (ids em EXTS[ponto].ids): cada uma conta */
  var ids=((EXTS[a.ponto]||{}).ids||[a.ponto]).filter(function(i){return EXT.stops[i]}),out=[],vistos={};
  var linhas=a.linhas&&a.linhas.length&&!todas?a.linhas:alvLinhasDoPonto(a.ponto);
  ids.forEach(function(sid){var G=EXT.stops[sid],kx=1.1132*Math.cos(G[1]*Math.PI/180),ky=1.10574;
  linhas.forEach(function(n){((EXT.sh||{})[n]||[]).forEach(function(i){
    var ch=sid+'|'+i;if(vistos[ch]||out.length>=6)return;vistos[ch]=1;var d=EXT.shp[i],la=-2280000,lo=-4320000,P=[];
    for(var k=0;k<d.length;k+=2){la+=d[k];lo+=d[k+1];P.push([la,lo])}
    /* ponto do traçado mais perto da parada (os traçados têm poucos vértices: vale a projeção no segmento) */
    var bi=-1,bd=1e9,bq=null,gx=G[2]*1e5*kx,gy=G[1]*1e5*ky;
    for(k=1;k<P.length;k++){var ax=P[k-1][1]*kx,ay=P[k-1][0]*ky,dx=P[k][1]*kx-ax,dy=P[k][0]*ky-ay,L2=dx*dx+dy*dy||1e-9,t=Math.max(0,Math.min(1,((gx-ax)*dx+(gy-ay)*dy)/L2)),dd=Math.hypot(gx-ax-t*dx,gy-ay-t*dy);
      if(dd<bd){bd=dd;bi=k;bq=[Math.round(P[k-1][0]+t*(P[k][0]-P[k-1][0])),Math.round(P[k-1][1]+t*(P[k][1]-P[k-1][1]))]}}
    if(bi<1||bd>90)return;
    var C=[bq],ac=0,ant=bq;for(k=bi-1;k>=0&&ac<3500;k--){ac+=Math.hypot((ant[1]-P[k][1])*kx,(ant[0]-P[k][0])*ky);C.unshift(P[k]);ant=P[k]}
    if(C.length<2)return;
    while(C.length>80){var R=[];for(k=0;k<C.length;k+=2)R.push(C[k]);if(R[R.length-1]!==C[C.length-1])R.push(C[C.length-1]);C=R}
    var flat=[];C.forEach(function(p){flat.push(p[0],p[1])});out.push(flat)})})});
  /* linha sem traçado guardado (linha de fora da lista, por exemplo): vale o traçado de qualquer linha que passa no ponto */
  if(!out.length&&!todas&&a.linhas&&a.linhas.length)return alvCorredores(a,true);
  return out;
}
/* horários estimados (minuto do dia) em que as linhas internas passam na parada, e se todas são só de dias úteis */
function alvHoras(st){
  var H={},uteis=true;
  Object.keys(LINES).forEach(function(lid){var L=LINES[lid];if(!L||L.susp)return;L.trips.forEach(function(tr){
    for(var i=0;i<tr.passes.length;i++){if(tr.passes[i].stop!==st)continue;
      tr.deps.forEach(function(d){var m=Math.round(d+tr.passes[i].off);if(m>=0&&m<1440){H[m]=1;if(!L.weekdays)uteis=false}});break}})});
  return {h:Object.keys(H).map(Number).sort(function(x,y){return x-y}),uteis:uteis};
}
/* os alertas (1 ou 2 por aviso programado) no formato do Worker; marca em ALV.falhas o que não deu para mandar */
function alvServidor(){
  var S=[];ALV.falhas={};
  ALV.lista.forEach(function(a){
    if(a.on===false)return;var nome=alvNome(a),base={min:a.min,nome:nome,dias:a.dias==='uteis'?[1,2,3,4,5]:[0,1,2,3,4,5,6],de:alvMinDia(a.hDe),ate:alvMinDia(a.hAte)};
    if(a.ext&&a.gr){var cor=alvCorredores({ponto:a.gr,linhas:[]});
      if(cor.length)S.push(Object.assign({id:a.id+'c',tipo:'c',l:[],cor:cor},base));else ALV.falhas[a.id]='tracado'}
    if(a.int&&a.st){var H=alvHoras(a.st);
      if(H.h.length){var o=Object.assign({id:a.id+'i',tipo:'i',txt:'Ônibus da UFRJ',horas:H.h},base);if(H.uteis&&a.dias!=='uteis')o.dias=[1,2,3,4,5];S.push(o)}else ALV.falhas[a.id]='horarios'}
  });
  alvVivosUma().forEach(function(a){var cor=alvCorredores(a);
    if(cor.length)S.push({id:a.id,tipo:'c',uma:1,fim:a.fim,min:a.min,nome:alvNome({gr:a.ponto,nome:a.nome}),l:a.linhas,v:a.carro,cor:cor});else ALV.falhas[a.id]='tracado'});
  return S;
}
/* permissão, chave do Worker e assinatura deste aparelho; devolve a assinatura ou null (com o motivo em ALV.motivo) */
function alvAssina(pedir,criar){
  ALV.motivo='';var chave;
  if(!ON_SITE){ALV.motivo='prototipo';return Promise.resolve(null)}
  if(pushIosSemInstalar()){ALV.motivo='iphone';return Promise.resolve(null)}
  if(!pushSuportado()){ALV.motivo='navegador';return Promise.resolve(null)}
  if(pushPermissao()==='denied'){ALV.motivo='bloqueado';return Promise.resolve(null)}
  if(pushPermissao()!=='granted'&&!pedir){ALV.motivo='permissao';return Promise.resolve(null)}
  return Promise.resolve(pushPermissao()==='granted'?'granted':Notification.requestPermission()).then(function(p){if(p!=='granted')throw new Error(p==='denied'?'bloqueado':'permissao');
    return fetch(PUSH.url+'/chave',{cache:'no-store'}).then(function(r){return r.json().catch(function(){return {}})},function(){throw new Error('rede')})})
  .then(function(j){if(!j||!j.disponivel||!j.chave)throw new Error('kv');chave=j.chave;
    /* o service worker pode demorar (ou não existir, se o site ainda não instalou a versão nova): espera até 8 s */
    return Promise.race([navigator.serviceWorker.ready,new Promise(function(_,nao){setTimeout(function(){nao(new Error('sw'))},8000)})])})
  .then(function(reg){return reg.pushManager.getSubscription().then(function(s){
    if(s&&!pushMesmaChave(s,chave))return s.unsubscribe().then(function(){return null});return s})
    .then(function(s){if(s||!criar)return s;return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:pushBytes(chave)}).catch(function(){throw new Error('assinatura')})})})
  .catch(function(e){ALV.motivo=String(e&&e.message||'rede');if(!/^(bloqueado|permissao|rede|kv|sw|assinatura)$/.test(ALV.motivo))ALV.motivo='rede';return null});
}
/* manda a lista ao Worker (assinando as notificações se preciso); sem permissão, os avisos valem só com o app aberto */
function alvSincroniza(pedir){
  var L=alvServidor();
  return alvAssina(pedir,L.length>0).then(function(s){if(!s)return false;
    return fetch(PUSH.url+'/alertas',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({endpoint:s.endpoint,alertas:L})}).then(function(r){return r.json().catch(function(){return {}})},function(){throw new Error('rede')})
      .then(function(j){if(!j||!j.ok)throw new Error('worker');
        /* "de uma vez" que o Worker já avisou: sai do aparelho e o sininho volta a ficar desligado */
        if(j.feitos&&j.feitos.length){ALV.uma=ALV.uma.filter(function(a){return j.feitos.indexOf(a.id)<0});alvGuarda();alvPinta()}
        ALV.push=L.length>0;ALV.sinc=Date.now();return ALV.push})
      .catch(function(e){ALV.push=false;ALV.motivo=e&&e.message==='rede'?'rede':'worker';return false})});
}
/* por que o aviso com o app fechado não está valendo, em palavras */
function alvMotivoTxt(){
  var M={prototipo:'No protótipo do claude.ai as notificações não funcionam. Abra o app pelo site.',
    iphone:'No iPhone, instale o app na Tela de Início para receber com o app fechado.',
    navegador:'Este navegador não recebe notificações de sites.',
    bloqueado:'As notificações estão bloqueadas para este site. Libere nos ajustes do navegador e toque em Tentar de novo.',
    permissao:'Falta permitir as notificações. Toque em Tentar de novo e aceite o pedido.',
    kv:'As notificações ainda não foram ativadas no servidor do app (falta o KV PUSH no Worker).',
    worker:'O servidor do app ainda não aceita avisos de ônibus: o Worker precisa ser publicado de novo na Cloudflare.',
    sw:'O app ainda não terminou de se instalar neste navegador. Recarregue a página e toque em Tentar de novo.',
    assinatura:'O navegador não conseguiu assinar as notificações. Confira a conexão e toque em Tentar de novo.',
    rede:'Sem conexão com o servidor do app. Toque em Tentar de novo.'};
  return M[ALV.motivo]||'';
}
function alvTem(){return ALV.lista.length>0||ALV.uma.length>0}
/* ---------- conferência com o app aberto ---------- */
function alvDispara(chave,titulo,corpo,a){
  if(ALV.disparados[chave])return;ALV.disparados[chave]=Date.now();
  gToast(titulo+' · '+corpo);try{if(navigator.vibrate)navigator.vibrate([120,60,120])}catch(e){}
  /* com o Worker avisando, a notificação do aparelho vem dele; sem ele, o app mostra uma quando está em segundo plano */
  if(!ALV.push&&document.hidden&&pushPermissao()==='granted')try{new Notification(titulo,{body:corpo,tag:'onibus-'+a.id})}catch(e){}
  if(a.uma){ALV.uma=ALV.uma.filter(function(x){return x.id!==a.id});alvGuarda();setTimeout(alvPinta,300)}
}
function alvConfere(){
  alvLimpa();var now=nowMin();
  ALV.uma.slice().forEach(function(a){
    var x=chegandoEm(a.ponto).filter(function(x){return x.o.v===a.carro&&x.t<=a.min*60})[0];if(!x)return;var m=Math.round(x.t/60);
    alvDispara(a.id+'|'+x.o.v,x.o.l+' chega em '+(m?'~'+m+' min':'instantes'),'Em '+alvNome({gr:a.ponto,nome:a.nome})+', a '+segM(x.m)+'. Carro '+x.o.v+'.',a);
  });
  ALV.lista.forEach(function(a){
    if(a.on===false||!alvNaHora(a))return;
    if(a.ext&&a.gr){
      var x=chegandoEm(a.gr).filter(function(x){return x.t<=a.min*60})[0];
      if(x){var m=Math.round(x.t/60);alvDispara(a.id+'|'+x.o.v,x.o.l+' chega em '+(m?'~'+m+' min':'instantes'),'Em '+alvNome(a)+', a '+segM(x.m)+'. Carro '+x.o.v+'.',a)}
    }
    if(a.int&&a.st){
      var H=alvHoras(a.st),dia=new Date().getDay();if(H.uteis&&(dia===0||dia===6))return;
      var h=H.h.filter(function(h){return h-now>=0&&h-now<=a.min})[0];
      if(h!=null){var d=h-now;alvDispara(a.id+'|'+h,'Ônibus da UFRJ passa em '+(d?'~'+d+' min':'instantes'),'Em '+alvNome(a)+'. Horário estimado.',a)}
    }
  });
}
setInterval(alvConfere,15000);setTimeout(alvConfere,5000);
/* ---------- sininho: um aviso de uma vez só ---------- */
function alvSininho(ponto,carro,linha){
  if(ALV.uma.some(function(a){return a.carro===carro&&a.ponto===ponto}))return;
  if(alvVivosUma().length>=ALV.maxUma){gToast('Você já tem '+ALV.maxUma+' avisos de uma vez. Espere um disparar ou apague em Ajustes › Avisos de ônibus.');return}
  ALV.uma.push({id:alvNovoId(),ponto:ponto,carro:carro,linhas:linha?[linha]:[],min:5,fim:Date.now()+3*3600e3,nome:(EXTS[ponto]||{}).name||''});
  alvGuarda();
  alvSincroniza(true).then(function(ok){
    gToast(ok?'Aviso ligado: você recebe uma notificação, uma vez, mesmo com o app fechado.':'Aviso ligado, só com o app aberto. '+alvMotivoTxt());alvPinta()});
  if(LIVE.url)liveLoop();alvPinta();setTimeout(alvConfere,1500);
}
function alvNovoId(){return 'a'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36)}
/* ---------- formulário (em Ajustes) ---------- */
function alvFormNovo(k){
  var p=alvPonto(k)||alvPontos()[0]||{st:'',gr:''};
  return {id:'',k:p.k,int:!!p.st,ext:!!p.gr,min:5,dias:'uteis',hDe:'06:00',hAte:'23:00'};
}
function alvFormEditar(a){var p=alvPontoDe(a);return {id:a.id,k:p?p.k:'',int:!!a.int,ext:!!a.ext,min:a.min,dias:a.dias,hDe:a.hDe,hAte:a.hAte}}
function alvLeForm(){var F=ALV.form;if(!F)return;var s=$('#alvPonto');if(s&&s.value!==F.k){F.k=s.value;var p=alvPonto(F.k);if(p){F.int=!!p.st;F.ext=!!p.gr}}
  var d=$('#alvDe'),a=$('#alvAte');if(d&&d.value)F.hDe=d.value;if(a&&a.value)F.hAte=a.value}
function alvFormHTML(F){
  var P=alvPontos(),p=alvPonto(F.k)||P[0];if(p&&!alvPonto(F.k))F.k=p.k;
  var tem=function(x){return '<span class="alv-par">'+(x?'':' · não há neste ponto')+'</span>'};
  return '<div class="alv-form" id="alvForm"><label class="fld alv-f">Ponto de ônibus<select id="alvPonto">'+P.map(function(x){return '<option value="'+esc(x.k)+'"'+(x.k===F.k?' selected':'')+'>'+esc(x.name)+(x.st&&x.gr?' (UFRJ e cidade)':x.gr?' (cidade)':' (UFRJ)')+'</option>'}).join('')+'</select></label>'+
    '<div class="alv-f"><p class="balvo-t"><b>Quais ônibus</b></p><div class="seg chips" role="group" aria-label="Quais ônibus">'+
      '<button type="button" data-alvint aria-pressed="'+(!!F.int&&!!p.st)+'"'+(p.st?'':' disabled')+'>Internos da UFRJ</button>'+
      '<button type="button" data-alvext aria-pressed="'+(!!F.ext&&!!p.gr)+'"'+(p.gr?'':' disabled')+'>Da cidade</button></div>'+
      (p.st&&p.gr?'':'<p class="muted small keep">'+(p.st?'Neste ponto só passam ônibus internos.':'Neste ponto só passam ônibus da cidade.')+'</p>')+'</div>'+
    '<div class="alv-f"><p class="balvo-t"><b>Avisar com antecedência de</b></p><div class="seg chips" role="group" aria-label="Antecedência">'+ALV_MIN.map(function(m){return '<button type="button" data-alvmin="'+m+'" aria-pressed="'+(F.min===m)+'">'+m+' min</button>'}).join('')+'</div></div>'+
    '<div class="alv-f"><p class="balvo-t"><b>Dias e horário</b></p><div class="seg chips" role="group" aria-label="Dias"><button type="button" data-alvd="uteis" aria-pressed="'+(F.dias==='uteis')+'">Dias úteis</button><button type="button" data-alvd="todos" aria-pressed="'+(F.dias==='todos')+'">Todos os dias</button></div>'+
      '<div class="alv-h"><label class="fld">Das<input type="time" id="alvDe" value="'+esc(F.hDe)+'"></label><label class="fld">Até<input type="time" id="alvAte" value="'+esc(F.hAte)+'"></label></div></div>'+
    '<div class="row gbtns"><button type="button" class="copy primary" id="alvSalvar">'+(F.id?'Salvar alterações':'Criar aviso')+'</button><button type="button" class="copy" id="alvCancela">Cancelar</button></div></div>';
}
function alvSalvaForm(){
  alvLeForm();var F=ALV.form,p=alvPonto(F.k);if(!p)return;
  var inte=!!F.int&&!!p.st,ext=!!F.ext&&!!p.gr;
  if(!inte&&!ext){gToast('Escolha internos da UFRJ, da cidade ou os dois.');return}
  var a={id:F.id||alvNovoId(),st:p.st,gr:p.gr,nome:p.name,int:inte,ext:ext,min:F.min,dias:F.dias,hDe:F.hDe,hAte:F.hAte,on:true};
  if(F.id)ALV.lista=ALV.lista.map(function(x){return x.id===F.id?Object.assign(x,a):x});else ALV.lista.push(a);
  ALV.form=null;ALV.msg='';alvGuarda();
  alvSincroniza(true).then(function(ok){gToast(ok?'Aviso salvo. Você recebe mesmo com o app fechado.':'Aviso salvo. Por enquanto ele avisa só com o app aberto. '+alvMotivoTxt());alvPinta()});
  if(a.ext&&LIVE.url)liveLoop();alvPinta();setTimeout(alvConfere,1500);
}
/* teste: pede ao Worker uma notificação de ônibus neste aparelho */
function alvTeste(){
  if(ALV.busy)return;ALV.busy=true;ALV.msg='';alvPinta();
  alvAssina(true,true).then(function(s){
    if(!s)throw new Error('sem');
    return fetch(PUSH.url+'/teste',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({endpoint:s.endpoint,tipo:'onibus'})}).then(function(r){return r.json().catch(function(){return {}}).then(function(j){j.status=r.status;return j})},function(){throw new Error('rede')})})
  .then(function(j){ALV.msg=j.ok?'Teste enviado. A notificação chega em alguns segundos.':j.status===429?'Espere um minuto para mandar outro teste.':j.status===404||j.status===400||!j.status?'O Worker ainda não faz o teste de ônibus: ele precisa ser publicado de novo na Cloudflare.':'O serviço de notificações recusou o teste. Tente de novo.'})
  .catch(function(e){ALV.msg=e&&e.message==='rede'?'Sem conexão com o servidor do app.':(alvMotivoTxt()||'Não deu para mandar o teste agora.')})
  .then(function(){ALV.busy=false;alvPinta()});
}
/* ---------- Ajustes › Avisos de ônibus ---------- */
function alvAjustesHTML(){
  alvLimpa();
  var h='<h2>Avisos de ônibus</h2><p class="muted small keep">Escolha o ponto, quais ônibus (da UFRJ e/ou da cidade), a antecedência e quando vale. Até '+ALV.max+' avisos. '+(ALV.push?'Os avisos chegam mesmo com o app fechado.':!alvTem()&&pushSuportado()&&!pushIosSemInstalar()?'Ao criar o primeiro, o app pede permissão para avisar com o app fechado.':'')+'</p>';
  if(!ALV.push&&alvTem()&&alvMotivoTxt())h+='<p class="alv-aviso" role="status"><b>Por enquanto, só com o app aberto.</b> '+esc(alvMotivoTxt())+(/^(bloqueado|permissao|rede|sw|assinatura|worker|kv)$/.test(ALV.motivo)?' <button type="button" class="linkbtn" data-alvtenta>Tentar de novo</button>':'')+'</p>';
  if(ALV.lista.length)h+='<ul class="alv-lista">'+ALV.lista.map(function(a){var r=alvResumo(a),f=ALV.falhas[a.id];
    return '<li class="alv-item"><span class="grow"><b>'+esc(r.t)+'</b><small>'+esc(r.s)+'</small>'+(f&&a.on!==false?'<small class="alv-nota">'+(f==='tracado'?'Não achei o traçado dos ônibus da cidade neste ponto: esse aviso só vale com o app aberto.':'Sem horário de linha interna neste ponto: esse aviso só vale com o app aberto.')+'</small>':'')+'</span>'+
      '<label class="alv-sw"><input type="checkbox" role="switch" data-alvon="'+esc(a.id)+'"'+(a.on!==false?' checked':'')+' aria-label="Aviso ligado"></label>'+
      '<button type="button" class="alv-ed" data-alved="'+esc(a.id)+'">Editar</button>'+
      '<button type="button" class="alv-x" data-alvdel="'+esc(a.id)+'" aria-label="Apagar este aviso">×</button></li>'}).join('')+'</ul>';
  else if(!ALV.form)h+='<p class="muted small keep">Nenhum aviso programado.</p>';
  if(ALV.form)h+=alvFormHTML(ALV.form);
  else if(ALV.lista.length<ALV.max)h+='<div class="row gbtns"><button type="button" class="copy primary" data-alvnovo>Novo aviso</button></div>';
  else h+='<p class="muted small keep">Limite de '+ALV.max+' avisos. Apague um para criar outro.</p>';
  var U=alvVivosUma();
  if(U.length)h+='<h3 class="la-h3">Sininhos ligados</h3><p class="muted small keep">Cada um avisa uma vez e se apaga.</p><ul class="alv-lista">'+U.map(function(a){
    return '<li class="alv-item"><span class="grow"><b>Carro '+esc(a.carro)+(a.linhas[0]?' ('+esc(a.linhas[0])+')':'')+'</b><small>Em '+esc(alvNome({gr:a.ponto,nome:a.nome}))+' · '+a.min+' min antes</small></span><button type="button" class="alv-x" data-alvdel="'+esc(a.id)+'" aria-label="Apagar este aviso">×</button></li>'}).join('')+'</ul>';
  if(pushSuportado()&&!pushIosSemInstalar())h+='<div class="row gbtns"><button type="button" class="copy" id="alvTeste"'+(ALV.busy?' disabled':'')+'>Mandar um teste</button></div>';
  h+='<p class="muted small keep alv-msg" role="status">'+(ALV.busy?'Aguarde…':esc(ALV.msg))+'</p>';
  return h;
}
function alvPinta(){var b=$('#alvsec');if(b)b.innerHTML=alvAjustesHTML();var d=detail&&detail.querySelector('#chgBox');if(d&&selGrupo())renderDetail()}
aoFazer('ajustes montados',function(){var s=$('#alsec')||$('#tirosec');if(!s||$('#alvsec'))return;s.insertAdjacentHTML('beforebegin','<div class="accsec alv-cfg" id="alvsec">'+alvAjustesHTML()+'</div>')});
/* abre Ajustes já no formulário de um aviso novo, com o ponto escolhido */
function alvIrAjustes(k){
  if(ALV.lista.length>=ALV.max){ALV.form=null;gToast('Você já tem '+ALV.max+' avisos. Apague ou edite um em Ajustes › Avisos de ônibus.')}else ALV.form=alvFormNovo(k);
  if($('#pane-cfg').hidden)openCfg();else renderCfg();
  setTimeout(function(){var s=$('#alvsec');if(s&&s.scrollIntoView)s.scrollIntoView({block:'start'})},120);
}
/* ---------- os botões dos painéis só levam para Ajustes ---------- */
var ALV_SINO='<svg class="alv-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;var b;
  if((b=t.closest('[data-alvir]'))){alvIrAjustes(b.dataset.alvir);return}
  if((b=t.closest('[data-alvsino]'))){var p=b.dataset.alvsino.split('|');alvSininho(p[0],p[1],p[2]);return}
  if(!t.closest('#alvsec'))return;
  if(t.closest('[data-alvnovo]')){ALV.form=alvFormNovo('');alvPinta();return}
  if(t.closest('[data-alvint]')){alvLeForm();ALV.form.int=!ALV.form.int;alvPinta();return}
  if(t.closest('[data-alvext]')){alvLeForm();ALV.form.ext=!ALV.form.ext;alvPinta();return}
  if((b=t.closest('[data-alvmin]'))){alvLeForm();ALV.form.min=+b.dataset.alvmin;alvPinta();return}
  if((b=t.closest('[data-alvd]'))){alvLeForm();ALV.form.dias=b.dataset.alvd;alvPinta();return}
  if(t.closest('#alvSalvar')){alvSalvaForm();return}
  if(t.closest('#alvCancela')){ALV.form=null;alvPinta();return}
  if((b=t.closest('[data-alved]'))){var a=ALV.lista.filter(function(a){return a.id===b.dataset.alved})[0];if(a){ALV.form=alvFormEditar(a);alvPinta()}return}
  if(t.closest('#alvTeste')){alvTeste();return}
  if(t.closest('[data-alvtenta]')){alvSincroniza(true).then(function(ok){gToast(ok?'Pronto. Os avisos chegam mesmo com o app fechado.':alvMotivoTxt()||'Ainda não deu. Tente de novo mais tarde.');alvPinta()});return}
  if((b=t.closest('[data-alvdel]'))){var id=b.dataset.alvdel;ALV.lista=ALV.lista.filter(function(a){return a.id!==id});ALV.uma=ALV.uma.filter(function(a){return a.id!==id});alvSalva();gToast('Aviso apagado.');return}
});
document.addEventListener('change',function(e){var t=e.target;
  if(t.dataset&&t.dataset.alvon){var a=ALV.lista.filter(function(a){return a.id===t.dataset.alvon})[0];if(a){a.on=t.checked;alvSalva()}return}
  if(t.id==='alvPonto'){alvLeForm();alvPinta()}});
/* "Chegando agora": o sino de cada carro (uma vez só) e o botão que leva para Ajustes; na parada da UFRJ que também é ponto da cidade, o mesmo */
aoFazer('detalhe montado',function(){
  var s=state.sel;if(!s||!detail||(s.kind!=='ext'&&s.kind!=='stop'))return;
  var gid=selGrupo(),p=alvPontos().filter(function(x){return s.kind==='stop'?x.st===s.id:x.gr===s.id})[0];if(!p)return;
  var box=detail.querySelector('#chgBox');
  if(detail.querySelector('.alv-ponto'))return;
  var btn='<button type="button" class="copy alv-ponto" data-alvir="'+esc(p.k)+'">'+ALV_SINO+'Programar aviso deste ponto</button>';
  if(box)box.insertAdjacentHTML('beforeend',btn);else detail.insertAdjacentHTML('beforeend',btn);
  if(box&&gid)box.querySelectorAll('[data-chgseg]').forEach(function(sg){var v=sg.dataset.chgseg,o=LIVE.bus.filter(function(o){return o.v===v})[0];if(!o)return;
    var tem=ALV.uma.some(function(a){return a.carro===v&&a.ponto===gid});
    sg.insertAdjacentHTML('beforebegin','<button type="button" class="alv-sino'+(tem?' on':'')+'" data-alvsino="'+esc(gid+'|'+v+'|'+o.l)+'"'+(tem?' disabled':'')+' aria-label="'+(tem?'Aviso já ligado para o carro ':'Avisar uma vez quando o carro ')+esc(v)+(tem?'':' estiver a 5 min deste ponto')+'">'+ALV_SINO+'</button>')});
});
/* Seu trajeto: leva para Ajustes com a origem escolhida */
function alvBotaoTrajeto(){
  if(!plan||plan.querySelector('#alvTrajeto'))return;var w=plan.querySelector('#wdet-plan')||plan.querySelector('details');if(!w)return;
  var p=alvPontos().filter(function(x){return x.st===state.from})[0];if(!p)return;
  w.insertAdjacentHTML('beforebegin','<button type="button" class="copy alv-traj" id="alvTrajeto" data-alvir="'+esc(p.k)+'">'+ALV_SINO+'Programar aviso de ônibus</button>');
}
aoFazer('trajeto montado',alvBotaoTrajeto);alvBotaoTrajeto();/* o trajeto já foi montado antes desta parte carregar */
/* ao abrir o app: confirma a lista no Worker (ele esquece o aparelho se a assinatura mudou e apaga o que já avisou) */
setTimeout(function(){if(alvTem())alvSincroniza(false).then(alvPinta)},6000);
document.addEventListener('visibilitychange',function(){if(!document.hidden&&ALV.uma.length&&pushPermissao()==='granted')alvSincroniza(false).then(alvPinta)});
