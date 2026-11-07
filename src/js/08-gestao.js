/* ======================= gestão: dados que o gestor pode alterar ======================= */
var GST={linhas:{},pontos:{},wifi:{},servicos:{},plantas:{items:[]},bloqueados:{ids:[]},respostas:{},calib:{},admins:{list:{}},acesso:{}};
var GKEYS=['linhas','pontos','wifi','servicos','plantas','bloqueados','respostas','calib','admins','acesso'];
var GESTOR=false; /* true: editor no claude.ai · 'demo': fora do claude.ai (salva só neste aparelho) */
var GLS='cse-gestao-';
var ORIG={lines:{},stops:{},wifi:{},pl:{}};
Object.keys(LINES).forEach(function(id){ORIG.lines[id]={sum:LINES[id].sum,deps:LINES[id].trips.map(function(t){return t.deps.slice()})}});
Object.keys(STOPS).forEach(function(id){ORIG.stops[id]={name:STOPS[id].name,short:STOPS[id].short,p:STOPS[id].p.slice()}});
ORIG.seq={};Object.keys(LINES).forEach(function(id){ORIG.seq[id]=LINES[id].trips.map(function(t){return t.halves.map(function(h){return h.seq.slice()})})});
Object.keys(WIFI).forEach(function(id){ORIG.wifi[id]=JSON.parse(JSON.stringify(WIFI[id]))});
Object.keys(PL).forEach(function(k){ORIG.pl[k]={wk:PL[k].wk,we:PL[k].we,note:PL[k].note}});
function cleanTxt(s,n){return String(s==null?'':s).replace(/[<>]/g,'').trim().slice(0,n||120)}
function validP(p){return Array.isArray(p)&&p.length===2&&isFinite(p[0])&&isFinite(p[1])&&p[0]>=60&&p[0]<=1400&&p[1]>=-70&&p[1]<=700}
function hhmm(t){var m=/^\s*(\d{1,2})(?::|h)?(\d{2})?\s*$/.exec(t);if(!m)return NaN;var h=+m[1],mi=+(m[2]||0);if(h>24||mi>59)return NaN;return h*60+mi}
/* "05:00-19:00/10, 19:30-23:30/30, 23:50" → minutos */
function parseDeps(str){
  var out=[];String(str||'').split(/[,;\n]+/).forEach(function(tok){
    tok=tok.trim();if(!tok)return;
    var m=/^(.+?)\s*[-–a]\s*(.+?)\s*\/\s*(\d+)$/.exec(tok);
    if(m){var a=hhmm(m[1]),b=hhmm(m[2]),s=+m[3];if(isNaN(a)||isNaN(b)||s<1||b<a)throw new Error('Trecho inválido: '+tok);for(var t=a;t<=b;t+=s)out.push(t);return}
    var x=hhmm(tok);if(isNaN(x))throw new Error('Horário inválido: '+tok);out.push(x);
  });
  out=out.filter(function(v,i,a){return a.indexOf(v)===i}).sort(function(a,b){return a-b});
  if(out.length>400)throw new Error('Saídas demais (máximo 400).');
  return out;
}
function compressDeps(d){
  var parts=[],i=0;
  while(i<d.length){
    var j=i+1,s=d[i+1]-d[i];
    if(j<d.length){while(j+1<d.length&&d[j+1]-d[j]===s)j++}
    if(j<d.length&&j-i>=2){parts.push(fmt(d[i])+'-'+fmt(d[j])+'/'+s);i=j+1}
    else{parts.push(fmt(d[i]));i++}
  }
  return parts.join(', ');
}
/* "07:00-10:00, 11:00-14:00" | "24h" → [[420,600],[660,840]] */
function parseRanges(str){
  str=String(str||'').trim();if(!str)return null;
  if(/^24\s*h/i.test(str))return [[0,1440]];
  return str.split(/[,;·]+/).map(function(tok){
    var m=/^\s*(.+?)\s*[-–]\s*(.+?)\s*$/.exec(tok);if(!m)throw new Error('Use o formato 07:00-10:00');
    var a=hhmm(m[1]),b=hhmm(m[2]);if(isNaN(a)||isNaN(b)||b<=a)throw new Error('Intervalo inválido: '+tok.trim());return [a,b];
  });
}
function rangesStr(r){if(r===undefined)return '';if(!r)return 'fechado';if(r.length===1&&r[0][0]===0&&r[0][1]>=1440)return '24h';return r.map(function(x){return fmt(x[0])+'-'+fmt(Math.min(x[1],1439))}).join(', ')}
/* geometria das linhas depende da posição das paradas */
function applyG(){
  Object.keys(ORIG.pl).forEach(function(k){if(!PL[k])return;var o=ORIG.pl[k],g=(GST.servicos||{})[k]||{};
    try{PL[k].wk=g.wk!=null&&g.wk!==''?parseRanges(g.wk):o.wk}catch(e){PL[k].wk=o.wk}
    try{PL[k].we=g.we==='fechado'?null:(g.we!=null&&g.we!==''?parseRanges(g.we):o.we)}catch(e){PL[k].we=o.we}
    PL[k].note=g.note?cleanTxt(g.note,200):o.note;PL[k].fechadoTemp=!!g.fechado;
  });
  Object.keys(LINES).forEach(function(id){var o=ORIG.lines[id],g=(GST.linhas||{})[id]||{},l=LINES[id];
    l.sum=g.sum?cleanTxt(g.sum,200):o.sum;l.susp=!!g.susp;l.aviso=cleanTxt(g.aviso,200);
    l.trips.forEach(function(tr,i){var d=null;try{d=g.hor&&g.hor[i]?parseDeps(g.hor[i]):null}catch(e){}tr.deps=d&&d.length?d:o.deps[i].slice()});
    var d0=l.trips[0].deps;if(PL['bus'+id])PL['bus'+id].wk=[[d0[0],d0[d0.length-1]+1]];
  });
  Object.keys(STOPS).forEach(function(id){if(!ORIG.stops[id])delete STOPS[id]});
  Object.keys(LINES).forEach(function(lid){LINES[lid].trips.forEach(function(tr,ti){tr.halves.forEach(function(h,hi){if(ORIG.seq[lid]&&ORIG.seq[lid][ti])h.seq=ORIG.seq[lid][ti][hi].slice()})})});
  Object.keys(STOPS).forEach(function(id){var o=ORIG.stops[id],g=(GST.pontos||{})[id]||{},s=STOPS[id];
    s.name=g.name?cleanTxt(g.name,60):o.name;s.short=g.short?cleanTxt(g.short,24):o.short;s.p=validP(g.p)?g.p.slice():o.p.slice();s.off=!!g.off;s.aviso=cleanTxt(g.aviso,200);
  });
  /* pontos novos, criados pela gestão: entram no trajeto das linhas logo depois do ponto escolhido */
  var gpn=GST.pontos||{};
  Object.keys(gpn).forEach(function(id){var g=gpn[id];
    if(!g||!g.novo||ORIG.stops[id]||WP[id]||!/^n[a-z0-9]{3,20}$/.test(id)||!validP(g.p)||!cleanTxt(g.name,60))return;
    STOPS[id]={name:cleanTxt(g.name,60),short:cleanTxt(g.short,24)||undefined,p:g.p.slice(),off:!!g.off,aviso:cleanTxt(g.aviso,200),novo:true};
    var lin=g.lin&&typeof g.lin==='object'?g.lin:{};
    Object.keys(lin).forEach(function(lid){if(!LINES[lid]||!Array.isArray(lin[lid]))return;
      lin[lid].forEach(function(after,hi){if(!after||!ORIG.stops[after])return;
        LINES[lid].trips.forEach(function(tr){var h=tr.halves[hi];if(!h||h.seq.indexOf(id)>=0)return;var k=h.seq.indexOf(after);if(k>=0)h.seq.splice(k+1,0,id)})})});
  });
  Object.keys(WIFI).forEach(function(id){if(!ORIG.wifi[id])delete WIFI[id]});
  Object.keys(ORIG.wifi).forEach(function(id){WIFI[id]=JSON.parse(JSON.stringify(ORIG.wifi[id]))});
  var gw=GST.wifi||{};Object.keys(gw).forEach(function(id){var g=gw[id];if(!g||!/^[\w-]{1,40}$/.test(id))return;
    if(g.removed){delete WIFI[id];return}
    var base=WIFI[id]||{avg:3,votes:0,note:''};
    base.name=g.name?cleanTxt(g.name,60):base.name;base.note=g.note!=null?cleanTxt(g.note,160):base.note;
    if(validP(g.p))base.p=g.p.slice();base.ssid=cleanTxt(g.ssid,40);base.acesso=cleanTxt(g.acesso,60);base.novo=!ORIG.wifi[id];
    if(base.name&&validP(base.p))WIFI[id]=base;
  });
  geom();
  etapas('dados da gestão aplicados');
}
function rebuildAll(){
  applyG();
  if(state.sel&&state.sel.kind==='wifi'&&!WIFI[state.sel.id])state.sel=null;
  buildMap();updateMap();drawShared();applyView(true);renderPlan();refreshAll();
  if(!pPane.hidden)renderPredios();
  if(gestM&&!gestM.hidden)renderGest();
  etapas('tudo reconstruído');
}
function loadLocalG(){GKEYS.forEach(function(k){try{var v=JSON.parse(localStorage.getItem(GLS+k));if(v)GST[k]=v}catch(e){}})}
function saveG(key,val){
  GST[key]=val;rebuildAll();
  if(GESTOR===true&&SH.on){
    return SH.db.doc('gestao/'+key).set({v:val,ts:Date.now(),by:SH.uid||''}).then(function(){gToast('Salvo. Já vale para todos.');return true},function(){gToast('Não deu para salvar. Confira se você tem acesso de editor.',1);return false});
  }
  try{localStorage.setItem(GLS+key,JSON.stringify(val))}catch(e){gToast('Sem espaço para salvar neste aparelho.',1);return Promise.resolve(false)}
  gToast('Salvo neste aparelho (modo demonstração).');return Promise.resolve(true);
}
function blocked(uid){return !!(uid&&GST.bloqueados&&Array.isArray(GST.bloqueados.ids)&&GST.bloqueados.ids.indexOf(uid)>=0)}
function canPost(){if(!PERFIL)return false;if(!SH.on)return true;if(FBMODE&&SH.full&&GESTOR!==true)return false;return !SH.denied&&SH.write!==false&&!!SH.uid&&!blocked(SH.uid)}
/* ======================= fila do RU (os alunos informam) ======================= */
var RUS=['ru_central','ru_ct1','ru_ct2','ru_letras'].filter(function(k){return PL[k]});
var FILA_N=[['Sem fila','na hora','good','0'],['Pequena','até 5 min','good','5'],['Média','5 a 15 min','warn','15'],['Grande','15 a 30 min','bad','30'],['Enorme','mais de 30 min','bad','30+']];
var FILA_TTL=45*60000,FKEY='cse-fila-local';
SH.fila=[];
var filaLocal=[];try{filaLocal=JSON.parse(localStorage.getItem(FKEY))||[]}catch(e){}
var filaOpen=null,filaBusy=false,filaMsg='';
function flatFila(docs){
  var out=[];docs.forEach(function(d){var it=(d.data()||{}).items;if(!Array.isArray(it))return;it.slice(0,8).forEach(function(r){
    if(!r||!PL[r.ru]||RUS.indexOf(r.ru)<0)return;var n=Math.round(+r.n);if(!(n>=0&&n<=4))return;
    out.push({id:String(r.id||''),ru:String(r.ru),n:n,ts:+r.ts||0,mine:d.id===SH.uid,owner:d.id})})});
  return out.sort(function(a,b){return b.ts-a.ts});
}
function filaAll(){
  var now=Date.now(),l=SH.on?SH.fila:filaLocal.map(function(r){return {id:r.id,ru:r.ru,n:r.n,ts:r.ts,mine:true,owner:''}});
  return l.filter(function(r){return r.ts>now-FILA_TTL&&r.ts<now+5*60000&&!blocked(r.owner)});
}
function filaOf(ru){
  var l=filaAll().filter(function(r){return r.ru===ru});if(!l.length)return null;
  var now=Date.now(),sw=0,s=0;l.forEach(function(r){var w=Math.pow(.5,(now-r.ts)/(15*60000));sw+=w;s+=w*r.n});
  return {n:Math.max(0,Math.min(4,Math.round(s/sw))),count:l.length,last:Math.max.apply(null,l.map(function(r){return r.ts}))};
}
function filaPill(ru){
  var f=filaOf(ru);if(!f)return '<span class="pill">Sem informação</span>';
  var L=FILA_N[f.n];return '<span class="pill '+L[2]+'">'+(f.n?'Fila '+L[0].toLowerCase():'Sem fila')+' · '+L[1]+'</span>';
}
function filaRow(k,now){
  var it=PL[k],f=filaOf(k),st=statusOf(it,now),open=filaOpen===k,ok=canPost();
  return '<div class="fila-r'+(open?' open':'')+'"><div class="fila-top"><span class="grow"><b>'+esc(it.name)+'</b><small>'+(f?f.count+(f.count>1?' avisos':' aviso')+' · último '+agoTxt(f.last):esc(st.t))+'</small></span>'+filaPill(k)+(!ok&&semConta()&&SH.on?askBtn('fila','Informar','la-sm'):'')+
    (ok?'<button type="button" class="copy" data-filaopen="'+k+'" aria-expanded="'+open+'">'+(open?'Cancelar':'Informar')+'</button>':'')+'</div>'+
    (open?'<div class="fila-pick" role="group" aria-label="Tamanho da fila no '+esc(it.name)+'">'+FILA_N.map(function(L,i){return '<button type="button" class="fila-b '+L[2]+'" data-fila="'+k+'" data-n="'+i+'"><b>'+L[0]+'</b><small>'+L[1]+'</small></button>'}).join('')+'</div>':'')+
  '</div>';
}
function sendFila(ru,n){
  var now=Date.now(),it={id:'f'+now.toString(36),ru:ru,n:n,ts:now};
  if(!SH.on){
    filaLocal=filaLocal.filter(function(r){return r.ts>now-FILA_TTL&&!(r.ru===ru&&r.ts>now-5*60000)});filaLocal.unshift(it);filaLocal=filaLocal.slice(0,8);
    try{localStorage.setItem(FKEY,JSON.stringify(filaLocal))}catch(e){}
    return Promise.resolve(true);
  }
  if(filaBusy||!canPost())return Promise.resolve(false);
  if(!postGap('fila'))return Promise.resolve(false);
  filaBusy=true;
  var mineL=SH.fila.filter(function(r){return r.mine&&r.ts>now-FILA_TTL&&!(r.ru===ru&&r.ts>now-5*60000)}).map(function(r){return {id:r.id,ru:r.ru,n:r.n,ts:r.ts}});
  mineL.unshift(it);
  return SH.db.doc('fila/'+SH.uid).set(stamp({items:mineL.slice(0,8)})).then(function(){filaBusy=false;postDone('fila');return true},function(){filaBusy=false;postFail();return false});
}
/* ======================= solicitações de alteração (alunos → gestão) ======================= */
var REQ_T=[['onibus','Horário ou itinerário de ônibus'],['ponto','Ponto de ônibus (novo, mudou ou fechado)'],['wifi','Rede Wi-Fi (nome, senha, fora do ar, nova rede)'],['servico','Horário de serviço (RU, biblioteca, secretaria)'],['planta','Planta de prédio faltando ou desatualizada'],['outro','Outro assunto']];
var REQ_ST={nova:['Nova','warn'],analise:['Em análise','warn'],aprovada:['Aprovada','good'],feita:['Resolvida','good'],recusada:['Recusada','bad']};
var RKEY='cse-req-local';
SH.req=[];SH.myReq=[];SH.members=[];
var reqLocal=[];try{reqLocal=JSON.parse(localStorage.getItem(RKEY))||[]}catch(e){}
function reqTipo(t){for(var i=0;i<REQ_T.length;i++)if(REQ_T[i][0]===t)return REQ_T[i][1];return 'Outro assunto'}
function reqStatus(id){var r=(GST.respostas||{})[id];return r&&REQ_ST[r.st]?r:{st:'nova',nota:''}}
function myReqs(){return SH.on?SH.myReq:reqLocal}
function sendReq(t,alvo,txt){
  var now=Date.now(),it={id:'q'+now.toString(36),t:t,alvo:cleanTxt(alvo,80),txt:cleanTxt(txt,400),ts:now};
  if(!SH.on){reqLocal.unshift(it);reqLocal=reqLocal.slice(0,10);try{localStorage.setItem(RKEY,JSON.stringify(reqLocal))}catch(e){}return Promise.resolve(true)}
  if(!canPost())return Promise.resolve(false);
  var l=[it].concat(SH.myReq.map(function(r){return {id:r.id,t:r.t,alvo:r.alvo,txt:r.txt,ts:r.ts}})).slice(0,10);
  if(!postGap('req'))return Promise.resolve(false);
  return SH.db.doc('requests/'+SH.uid).set(stamp({items:l})).then(function(){postDone('req');return true},function(){return false});
}
function flatReq(docs){
  var out=[];docs.forEach(function(d){var it=(d.data()||{}).items;if(!Array.isArray(it))return;it.slice(0,10).forEach(function(r){if(!r||typeof r!=='object')return;
    out.push({id:String(r.id||''),t:String(r.t||'outro'),alvo:cleanTxt(r.alvo,80),txt:cleanTxt(r.txt,400),ts:+r.ts||0,owner:d.id})})});
  return out.sort(function(a,b){return b.ts-a.ts});
}
function myReqHTML(){
  var l=myReqs();
  return '<div><h2>Solicitações</h2></div><p class="muted small">Viu um horário errado, um ponto que mudou ou uma rede nova? Peça a correção para a gestão do app.</p>'+
    (l.length?'<div class="reqs">'+l.map(function(r){var s=reqStatus(r.id),S=REQ_ST[s.st];
      return '<div class="req"><div class="req-h"><b>'+esc(reqTipo(r.t))+'</b><span class="pill '+S[1]+'">'+S[0]+'</span></div>'+(r.alvo?'<small>'+esc(r.alvo)+'</small>':'')+'<p>'+esc(r.txt)+'</p>'+(s.nota?'<p class="req-resp"><b>Resposta da gestão:</b> '+esc(s.nota)+'</p>':'')+'<small class="muted">'+agoTxt(r.ts)+'</small></div>'}).join('')+'</div>':'<p class="muted small">Você ainda não enviou nenhuma.</p>')+
    '<button type="button" class="copy" data-req="outro||">Nova solicitação</button>';
}
var reqM=null,reqCtx=null;
function openReq(t,alvo){
  if(!PERFIL){openLogin();lgShow('new');gToast('Crie seu perfil para pedir correções.');return}
  reqCtx={t:t||'outro',alvo:alvo||''};
  if(!reqM){document.body.insertAdjacentHTML('beforeend','<div class="cfgmodal" id="reqM" role="dialog" aria-modal="true" aria-labelledby="reqTitle" hidden><div class="cfgsheet narrow"><div class="cfghead"><h2 id="reqTitle">Sugerir correção</h2><button type="button" class="cfgclose" id="reqClose" aria-label="Fechar">'+XSVG+'</button></div><div id="reqBody"></div></div></div>');
    reqM=$('#reqM');$('#reqClose').addEventListener('click',closeReq);reqM.addEventListener('click',function(e){if(e.target===reqM)closeReq()});
    reqM.addEventListener('submit',function(e){e.preventDefault();var t=$('#rqT').value,a=$('#rqA').value,x=$('#rqX').value.trim(),er=$('#rqErr'),b=reqM.querySelector('.rq-send');
      if(x.length<8){er.textContent='Conte um pouco mais (pelo menos 8 letras).';$('#rqX').focus();return}
      b.disabled=true;b.textContent='Enviando…';
      sendReq(t,a,x).then(function(ok){if(ok){$('#reqBody').innerHTML='<p class="big-ok">Pedido enviado.</p><p class="muted">A gestão vai analisar. Acompanhe a resposta em Ajustes, na parte de Solicitações.</p><button type="button" class="copy" id="rqDone">Fechar</button>';$('#rqDone').addEventListener('click',closeReq);$('#rqDone').focus();if(!cfgM.hidden)renderCfg()}
        else{b.disabled=false;b.textContent='Enviar';er.textContent=blocked(SH.uid)?'Sua conta não pode enviar pedidos no momento.':(FBMODE&&SH.full&&GESTOR!==true)?fullMsg('enviar pedidos'):(FBMODE?(SH.uid?'Não deu para enviar agora. Espere um minuto e tente de novo.':'Para enviar, entre com Google ou e-mail em Ajustes › Conta.'):'Não deu para enviar. Você precisa de acesso de colaborador.')}})});
  }
  $('#reqBody').innerHTML='<form class="gform" novalidate>'+
    '<label class="gf">Assunto<select id="rqT">'+REQ_T.map(function(x){return '<option value="'+x[0]+'"'+(x[0]===reqCtx.t?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select></label>'+
    '<label class="gf">Sobre o quê?<input type="text" id="rqA" maxlength="80" value="'+esc(reqCtx.alvo)+'" placeholder="Ex.: Linha 3, RU Central, Biblioteca do CT"></label>'+
    '<label class="gf">O que precisa mudar?<textarea id="rqX" maxlength="400" rows="4" placeholder="Ex.: o último ônibus da linha 3 está saindo 23h40, não meia-noite."></textarea></label>'+
    '<p class="err small" id="rqErr" role="alert"></p><button type="submit" class="copy rq-send">Enviar</button>'+
    '<p class="muted small">A gestão vê quem enviou. Os colegas não veem.</p></form>';
  reqM.hidden=false;document.documentElement.style.overflow='hidden';setTimeout(function(){$('#rqX').focus()},30);
}
function closeReq(){if(reqM){reqM.hidden=true;if(cfgM.hidden&&glM.hidden&&(!gestM||gestM.hidden))document.documentElement.style.overflow=''}}
var XSVG='<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
/* ---------- ganchos nas telas existentes ---------- */
aoFazer('ajustes montados',function(f){var R=$('#cfgR');if(R&&!R.querySelector('.reqsec')){R.insertAdjacentHTML('beforeend','<div class="reqsec">'+myReqHTML()+'</div>')}});
function lineNote(id){var l=LINES[id];return (l.susp?'<div class="warnbox"><b>Linha suspensa</b>A gestão suspendeu esta linha. Os horários abaixo não estão valendo.</div>':'')+(l.aviso?'<div class="warnbox"><b>Aviso da gestão</b>'+esc(l.aviso)+'</div>':'')}
function stopNote(id){var s=STOPS[id];return (s.off?'<div class="warnbox"><b>Ponto desativado</b>Os ônibus não estão parando aqui por enquanto.</div>':'')+(s.aviso?'<div class="warnbox"><b>Aviso da gestão</b>'+esc(s.aviso)+'</div>':'')}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-filaopen],[data-fila],[data-req]');if(!t)return;
  if(t.dataset.filaopen){filaOpen=filaOpen===t.dataset.filaopen?null:t.dataset.filaopen;filaMsg='';refreshAll();if(!pPane.hidden)renderPredios();var b=document.querySelector('[data-filaopen="'+t.dataset.filaopen+'"]');if(b)b.focus({preventScroll:true});return}
  if(t.dataset.fila){var ru=t.dataset.fila,n=+t.dataset.n;t.disabled=true;
    sendFila(ru,n).then(function(ok){filaOpen=null;filaMsg=ok?'Obrigado! Fila do '+PL[ru].name+' informada.':'Não deu para enviar agora.';refreshAll();drawShared();if(!pPane.hidden)renderPredios();setTimeout(function(){filaMsg='';},6000)});return}
  if(t.dataset.req!=null){var p=t.dataset.req.split('||');openReq(p[0],p[1]||'');}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&reqM&&!reqM.hidden){e.stopPropagation();closeReq()}},true);
/* ======================= tela do gestor ======================= */
var gestM=null,gTab='geral',gEdit=null,gFilter={req:'abertas',q:'',svc:''},gNames={},ASSETS=null;
var GTABS=[['geral','Visão geral'],['usuarios','Usuários'],['linhas','Linhas'],['pontos','Pontos'],['wifi','Redes Wi-Fi'],['servicos','Serviços e horários'],['solic','Solicitações'],['plantas','Plantas dos prédios'],['avisos','Avisos e filas']];
function gToast(msg,bad){var t=$('#gToast');if(!t){document.body.insertAdjacentHTML('beforeend','<div class="gtoast" id="gToast" role="status" aria-live="polite"></div>');t=$('#gToast')}t.textContent=msg;t.className='gtoast show'+(bad?' bad':'');clearTimeout(t._h);t._h=setTimeout(function(){t.className='gtoast'},3200)}
function ensureGest(){
  if(gestM)return;
  document.body.insertAdjacentHTML('beforeend','<div class="cfgmodal" id="gestM" role="dialog" aria-modal="true" aria-labelledby="gTitle" hidden><div class="cfgsheet gsheet"><div class="cfghead"><div><h2 id="gTitle">Gestão</h2><p class="muted small" id="gRole"></p></div><button type="button" class="cfgclose" id="gClose" aria-label="Fechar gestão">'+XSVG+'</button></div><div class="glay"><nav class="gnav" id="gNav" aria-label="Seções da gestão"></nav><div class="gbody" id="gBody"></div></div></div></div>');
  gestM=$('#gestM');
  $('#gClose').addEventListener('click',closeGest);
  gestM.addEventListener('click',function(e){if(e.target===gestM)closeGest()});
  gestM.addEventListener('click',onGestClick);gestM.addEventListener('change',onGestChange);gestM.addEventListener('submit',onGestSubmit);gestM.addEventListener('input',function(e){
    if(e.target.id==='gUq'){gFilter.q=e.target.value;var c=$('#gUlist');if(c)c.innerHTML=usersList()}
    if(e.target.id==='gSq'){gFilter.svc=e.target.value;var c2=$('#gSlist');if(c2)c2.innerHTML=svcList()}
  });
}
function openGest(tab){ensureGest();if(tab)gTab=tab;gEdit=null;renderGest();gestM.hidden=false;gestM.classList.remove('closing');perfEnter(gestM);document.documentElement.style.overflow='hidden';var b=$('#gestBtn');if(b)b.setAttribute('aria-pressed','true');setTimeout(function(){$('#gClose').focus({preventScroll:true})},30)}
function closeGest(){if(!gestM)return;
  var fim=function(){gestM.classList.remove('closing');gestM.hidden=true;if(cfgM.hidden&&glM.hidden)document.documentElement.style.overflow='';var b=$('#gestBtn');if(b){b.setAttribute('aria-pressed','false');b.focus({preventScroll:true})}};
  if(perfEff()==='completo'&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches){gestM.classList.add('closing');setTimeout(fim,240)}else fim()}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&gestM&&!gestM.hidden&&(!reqM||reqM.hidden)){e.stopPropagation();closeGest()}},true);
function setGestor(v){
  GESTOR=v;var b=$('#gestBtn');if(b)b.hidden=!v;
  if(v===true&&SH.on){
    SH.db.collection('members').onSnapshot(function(s){SH.members=s.docs.map(function(d){var x=d.data()||{};return {id:d.id,first:+x.first||0,last:+x.last||0,visits:+x.visits||0,nome:String(x.nome||'').slice(0,60),email:String(x.email||'').slice(0,120)}});if(gestM&&!gestM.hidden&&gTab!=='solic'&&!(gTab==='admins'&&document.activeElement&&document.activeElement.id==='admBusca'))renderGest()},function(){});
    SH.db.collection('requests').onSnapshot(function(s){SH.req=flatReq(s.docs);if(gestM&&!gestM.hidden)renderGest()},function(){});
  };
  etapas('gestor definido',v);
}
function names(ids){
  ids=ids.filter(function(id){return id&&!(id in gNames)});
  if(!ids.length||!SH.user)return;
  ids.forEach(function(id){gNames[id]=''});
  SH.user.profiles(ids).then(function(ps){Object.keys(ps).forEach(function(id){gNames[id]=ps[id].name||''});if(gestM&&!gestM.hidden)renderGest()});
}
function who(id){if(!id)return 'Este aparelho';if(id===SH.uid)return 'Você';if(FBMODE){var mm=SH.members.filter(function(x){return x.id===id})[0];if(mm&&mm.nome)return mm.nome}return gNames[id]||'Pessoa sem nome visível'}
function dmy(ts){if(!ts)return '—';var d=new Date(ts);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+' '+fmt(d.getHours()*60+d.getMinutes())}
function allReqs(){return SH.on?SH.req:reqLocal.map(function(r){return Object.assign({owner:''},r)})}
function renderGest(){
  if(!gestM)return;
  computePerms();
  if(gTab!=='admins'){var p=TAB_PERM[gTab];if(p&&!gcan(p))gTab='geral'}/* aba sem permissão volta para a visão geral */
  var role=GESTOR===true&&FBMODE?'Você é gestor porque seu e-mail está na coleção gestores do Firebase. Para incluir outro gestor, crie lá um documento com o e-mail dele.':GESTOR===true?'Você é gestor porque tem acesso de editor a esta página. Para incluir outro gestor, compartilhe com acesso de editor.':'Modo demonstração: aberto fora do claude.ai, as mudanças ficam só neste aparelho.';
  $('#gRole').textContent=role;
  var pend=allReqs().filter(function(r){var s=reqStatus(r.id).st;return s==='nova'||s==='analise'}).length;
  $('#gNav').innerHTML=GTABS.map(function(t){return '<button type="button" class="gtab" data-gtab="'+t[0]+'" aria-current="'+(gTab===t[0]?'page':'false')+'">'+t[1]+(t[0]==='solic'&&pend?'<span class="gcount">'+pend+'</span>':'')+'</button>'}).join('');
  var a=document.activeElement,keep=a&&$('#gBody').contains(a)&&a.id?a.id:null,val=keep&&a.value!==undefined?a.value:null;
  var f={geral:gGeral,usuarios:gUsers,linhas:gLinhas,pontos:gPontos,wifi:gWifiTab,servicos:gServicos,solic:gSolic,plantas:gPlantas,avisos:gAvisos}[gTab]||gGeral;
  $('#gBody').innerHTML=f();
  if(keep){var el=document.getElementById(keep);if(el){if(val!=null&&el.value!==undefined&&el.type!=='file')el.value=val;el.focus({preventScroll:true})}}
  var gb=$('#gBody');
  if(gTab==='gps'){var at=document.activeElement,aid=at&&at.id;gb.innerHTML=gGps();if(aid){var fe=document.getElementById(aid);if(fe)fe.focus({preventScroll:true})}}
  if(gTab==='admins')gb.innerHTML=gAdmins();
  gestM.querySelectorAll('[data-gtab]').forEach(function(b){var p=TAB_PERM[b.dataset.gtab];if(p&&!gcan(p))b.hidden=true});
  var r=$('#gRole');if(r&&!ME.principal&&ME.perms)r.textContent='Seus privilégios: '+permSummary(ME.perms,false)+'.';
  etapas('gestão montada');
}
function tile(n,l,tab,tone){return '<button type="button" class="gtile'+(tone?' '+tone:'')+'" data-gtab="'+tab+'"><b>'+n+'</b><span>'+l+'</span></button>'}
function gGeral(){
  var reqs=allReqs(),pend=reqs.filter(function(r){var s=reqStatus(r.id).st;return s==='nova'||s==='analise'});
  var susp=Object.keys(LINES).filter(function(k){return LINES[k].susp}).length,off=Object.keys(STOPS).filter(function(k){return STOPS[k].off}).length;
  var fechados=Object.keys(PL).filter(function(k){return PL[k].fechadoTemp}).length;
  return '<h3 class="gh">Agora</h3><div class="gtiles">'+
    tile(SH.on?SH.members.length:'—','Usuários',"usuarios")+
    tile(pend.length,'Solicitações abertas','solic',pend.length?'warn':'')+
    tile(liveReps().length,'Avisos ao vivo','avisos')+
    tile(filaAll().length,'Filas informadas (45 min)','avisos')+
    tile(susp,'Linhas suspensas','linhas',susp?'bad':'')+
    tile(off,'Pontos desativados','pontos',off?'bad':'')+
    tile(Object.keys(WIFI).length,'Redes Wi-Fi','wifi')+
    tile(fechados,'Serviços fechados','servicos',fechados?'bad':'')+
    tile((GST.plantas.items||[]).length,'Plantas enviadas','plantas')+
  '</div>'+
  '<h3 class="gh">Fila do RU</h3><div class="glist">'+RUS.map(function(k){var f=filaOf(k);return '<div class="grow2"><span class="grow"><b>'+esc(PL[k].name)+'</b><small>'+(f?f.count+' aviso(s) · último '+agoTxt(f.last):'Ninguém informou nos últimos 45 min')+'</small></span>'+filaPill(k)+'</div>'}).join('')+'</div>'+
  '<h3 class="gh">Últimas solicitações</h3>'+(reqs.length?'<div class="glist">'+reqs.slice(0,4).map(function(r){var s=reqStatus(r.id),S=REQ_ST[s.st];return '<button type="button" class="grow2 btnrow" data-gtab="solic"><span class="grow"><b>'+esc(reqTipo(r.t))+'</b><small>'+esc(r.alvo||'')+' · '+agoTxt(r.ts)+'</small></span><span class="pill '+S[1]+'">'+S[0]+'</span></button>'}).join('')+'</div>':'<p class="muted small">Nenhuma solicitação ainda.</p>')+
    demoCard()+errCard()+acessoCard();/* exemplos do modo apresentação, erros dos aparelhos e acesso */
}
/* ---------- usuários ---------- */
function userStats(id){
  var now=Date.now();
  return {av:SH.reps.filter(function(r){return r.owner===id&&r.ts>now-REP_TTL}).length,fi:SH.fila.filter(function(r){return r.owner===id&&r.ts>now-FILA_TTL}).length,rq:SH.req.filter(function(r){return r.owner===id}).length};
}
function usersList(){
  var q=glFold(gFilter.q.trim()),l=SH.members.slice().sort(function(a,b){return b.last-a.last});
  names(l.map(function(m){return m.id}));
  l=l.filter(function(m){return !q||glFold(who(m.id)).indexOf(q)>=0});
  if(!l.length)return '<p class="muted small">'+(q?'Ninguém com esse nome.':'Ninguém abriu o app desde que a gestão foi ligada.')+'</p>';
  return l.map(function(m){var st=userStats(m.id),b=blocked(m.id);
    return '<div class="grow2 urow'+(b?' isblk':'')+'"><span class="grow"><b>'+esc(who(m.id))+'</b>'+(b?' <span class="pill bad">Bloqueado</span>':'')+'<small>Primeira visita '+dmy(m.first)+' · última '+agoTxt(m.last)+' · '+m.visits+' visita(s)</small><small>'+st.av+' aviso(s) ao vivo · '+st.fi+' fila(s) · '+st.rq+' solicitação(ões)</small></span>'+
      (m.id===SH.uid?'':(FBMODE&&gcan('usuarios')?'<button type="button" class="copy" data-gfree="'+esc(m.id)+'">Liberar vaga</button>':'')+'<button type="button" class="copy'+(b?'':' danger')+'" data-gblock="'+esc(m.id)+'">'+(b?'Desbloquear':'Bloquear')+'</button>')+'</div>'}).join('');
}
function gUsers(){
  if(!SH.on)return '<h3 class="gh">Usuários</h3><p class="muted">A lista de usuários aparece quando o app está publicado no claude.ai: cada pessoa que abre o app entra aqui, com a data da primeira e da última visita e o que ela enviou.</p><div class="glist"><div class="grow2"><span class="grow"><b>Este aparelho</b><small>'+filaLocal.length+' fila(s) · '+reqLocal.length+' solicitação(ões)</small></span></div></div>';
  return '<h3 class="gh">Usuários ('+SH.members.length+')</h3>'+(FBMODE?gVagasCard():'')+
    '<p class="muted small">Bloquear esconde os avisos e as filas da pessoa e impede novos envios pelo app. '+(FBMODE?'Para tirar o acesso de vez, desative a pessoa em Authentication, no console do Firebase.':'Para tirar o acesso de vez, use o menu Compartilhar da página.')+'</p>'+
    '<label class="gf"><span class="sr">Buscar pessoa</span><input type="search" id="gUq" placeholder="Buscar pelo nome" value="'+esc(gFilter.q)+'"></label>'+
    '<div class="glist" id="gUlist">'+usersList()+'</div>';
}
/* cartão das vagas para participar (só no site com Firebase) */
function gVagasCard(){
  var n=VAGAS.ok?VAGAS.n:null,max=VAGAS.max,full=n!=null&&n>=max;
  var card='<div class="gcard vagas"><div class="grow2"><span class="grow"><b>Vagas para participar</b><small>'+(n==null?'Ainda não configurado. Abra esta tela com o privilégio Usuários para criar o contador.':n+' de '+max+' em uso'+(full?' · lotado: quem chegar agora só consulta':''))+'</small></span>'+(n==null?'':'<span class="pill '+(full?'bad':n>=max*.9?'warn':'good')+'">'+Math.max(0,max-n)+' livre(s)</span>')+'</div>'+
    (n==null?'':'<div class="vbar" aria-hidden="true"><i style="width:'+Math.min(100,Math.round(n/max*100))+'%"></i></div>')+
    (gcan('usuarios')?'<form class="gform vform" data-gform="vagas"><label class="gf">Limite de pessoas<input type="number" id="gVmax" min="1" max="2000" step="1" value="'+max+'"></label><button type="submit" class="copy">Salvar limite</button>'+(n==null?'':'<button type="button" class="copy" id="gVrecount">Recontar</button>')+'</form><p class="muted small">Gestores não ocupam vaga. Ao liberar a vaga de alguém, a pessoa continua vendo o app e volta a ocupar uma vaga se entrar de novo e ainda houver espaço.</p>':'')+'</div>';
  return card;
}
/* ---------- linhas ---------- */
function gLinhas(){
  return '<h3 class="gh">Linhas internas</h3><p class="muted small">Suspenda uma linha, deixe um aviso para os alunos ou troque os horários de saída. Formato dos horários: <span class="mono">05:00-19:00/10, 19:30-23:30/30</span> (início-fim/intervalo em minutos), separados por vírgula. Saída avulsa: só o horário.</p>'+
  '<div class="glist">'+Object.keys(LINES).map(function(id){var l=LINES[id],g=(GST.linhas||{})[id]||{},open=gEdit==='l:'+id;
    return '<div class="gcard'+(open?' open':'')+'"><div class="grow2">'+badge(id)+'<span class="grow"><b>'+esc(l.name)+'</b><small>'+(l.susp?'Suspensa':'Em operação')+(l.aviso?' · com aviso':'')+(g.hor?' · horários alterados':'')+'</small></span>'+(l.susp?'<span class="pill bad">Suspensa</span>':'')+'<button type="button" class="copy" data-gedit="l:'+id+'">'+(open?'Fechar':'Editar')+'</button></div>'+
      (open?'<form class="gform" data-gform="linha" data-id="'+id+'">'+
        tg('gLsusp',l.susp,'Linha suspensa','Some do planejador de trajeto e aparece riscada no mapa.')+
        '<label class="gf">Aviso para os alunos<input type="text" id="gLaviso" maxlength="200" value="'+esc(g.aviso||'')+'" placeholder="Ex.: desvio pela Av. Horácio Macedo até sexta"></label>'+
        '<label class="gf">Resumo do horário<input type="text" id="gLsum" maxlength="200" value="'+esc(l.sum)+'"></label>'+
        l.trips.map(function(tr,i){var src=(g.hor&&g.hor[i])||compressDeps(tr.deps);return '<label class="gf">Saídas · sentido '+esc(tr.halves[0].to)+' ('+tr.deps.length+' por dia)<textarea id="gLh'+i+'" rows="2" class="mono">'+esc(src)+'</textarea></label>'}).join('')+
        '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar</button>'+(GST.linhas[id]?'<button type="button" class="copy" data-greset="linhas:'+id+'">Voltar ao original</button>':'')+'</div></form>':'')+
    '</div>'}).join('')+'</div>';
}
/* ---------- pontos ---------- */
var pickP=null;
function pickMapHTML(p,others){
  var dots=(others||[]).map(function(o){return '<circle cx="'+o[0]+'" cy="'+o[1]+'" r="5" class="pk-o"/>'}).join('');
  return '<div class="pkwrap"><svg class="pkmap" id="pkMap" viewBox="109 -45 1233 701" role="img" aria-label="Toque no mapa para posicionar"><image href="'+MAPHD+'" x="109" y="-45" width="1233" height="701" preserveAspectRatio="none"/>'+dots+(p?'<g transform="translate('+p[0]+','+p[1]+')"><circle r="16" class="pk-h"/><circle r="7" class="pk-p"/></g>':'')+'</svg></div><p class="muted small">Toque no mapa para mudar a posição'+(p?' · x '+Math.round(p[0])+', y '+Math.round(p[1]):'')+'.</p>';
}
/* em que linhas o ponto novo entra: um seletor por linha e sentido */
function pontoLinhasHTML(id){
  var cur=(((GST.pontos||{})[id]||{}).lin)||{};
  return '<fieldset class="gf plins"><legend>Linhas que param aqui</legend><p class="muted small">Para cada sentido, escolha depois de qual ponto o ônibus passa por aqui. Deixe "Não para" onde a linha não passa.</p>'+
    Object.keys(LINES).map(function(lid){var L=LINES[lid];
      return '<div class="plin">'+badge(lid)+'<div class="plin-s">'+L.trips[0].halves.map(function(h,hi){
        var seen={},opts=(ORIG.seq[lid]?ORIG.seq[lid][0][hi]:[]).filter(function(x){if(!ORIG.stops[x]||seen[x])return false;seen[x]=1;return true});
        var sel=(cur[lid]||[])[hi]||'';
        return '<label class="gf">Sentido '+esc(h.to)+'<select id="gPl_'+lid+'_'+hi+'"><option value="">Não para</option>'+opts.map(function(x){return '<option value="'+x+'"'+(x===sel?' selected':'')+'>Depois de '+esc(ORIG.stops[x].name)+'</option>'}).join('')+'</select></label>'}).join('')+'</div></div>'}).join('')+'</fieldset>';
}
function gPontoNovoForm(id){
  var g=id==='+'?{}:(GST.pontos[id]||{}),sp=STOPS[id]||{};
  return '<form class="gform" data-gform="ponto" data-id="'+id+'">'+
    '<label class="gf">Nome<input type="text" id="gPn" maxlength="60" value="'+esc(g.name||'')+'" required placeholder="Ex.: Instituto de Biologia"></label>'+
    '<label class="gf">Nome curto no mapa<input type="text" id="gPs" maxlength="24" value="'+esc(g.short||'')+'" placeholder="Opcional"></label>'+
    (id==='+'?'':tg('gPoff',!!g.off,'Ponto desativado','Aparece apagado no mapa, com aviso para os alunos.')+'<label class="gf">Aviso<input type="text" id="gPav" maxlength="200" value="'+esc(g.aviso||'')+'"></label>')+
    pickMapHTML(pickP||(validP(g.p)?g.p:null),Object.keys(STOPS).filter(function(k){return k!==id}).map(function(k){return STOPS[k].p}))+
    pontoLinhasHTML(id)+
    '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">'+(id==='+'?'Criar ponto':'Salvar')+'</button>'+(id==='+'?'':'<button type="button" class="copy danger" data-greset="pontos:'+id+'">Remover ponto</button>')+'</div></form>';
}
function gPontos(){
  var ids=Object.keys(STOPS).sort(function(a,b){return STOPS[a].name.localeCompare(STOPS[b].name,'pt')}),newOpen=gEdit==='p:+';
  return '<h3 class="gh">Pontos de ônibus</h3><p class="muted small">Crie um ponto novo, renomeie, mude de lugar ou desative um ponto. Ao mover, o traçado das linhas passa pela nova posição.</p>'+
  '<div class="gcard'+(newOpen?' open':'')+'"><div class="grow2"><span class="grow"><b>Adicionar ponto de ônibus</b><small>Um ponto que ainda não aparece no mapa</small></span><button type="button" class="copy primary" data-gedit="p:+">'+(newOpen?'Cancelar':'Adicionar')+'</button></div>'+(newOpen?gPontoNovoForm('+'):'')+'</div>'+
  '<div class="glist">'+ids.map(function(id){var s=STOPS[id],open=gEdit==='p:'+id,ls=linesAt(id);
    if(s.novo)return '<div class="gcard'+(open?' open':'')+'"><div class="grow2"><span class="grow"><b>'+esc(s.name)+'</b><small>'+(ls.length?'Linhas '+ls.join(', '):'Nenhuma linha para aqui ainda')+' · criado pela gestão</small></span>'+(s.off?'<span class="pill bad">Desativado</span>':'')+'<button type="button" class="copy" data-gedit="p:'+id+'">'+(open?'Fechar':'Editar')+'</button></div>'+(open?gPontoNovoForm(id):'')+'</div>';
    return '<div class="gcard'+(open?' open':'')+'"><div class="grow2"><span class="grow"><b>'+esc(s.name)+'</b><small>Linhas '+ls.join(', ')+(GST.pontos[id]?' · alterado':'')+'</small></span>'+(s.off?'<span class="pill bad">Desativado</span>':'')+'<button type="button" class="copy" data-gedit="p:'+id+'">'+(open?'Fechar':'Editar')+'</button></div>'+
      (open?'<form class="gform" data-gform="ponto" data-id="'+id+'">'+
        '<label class="gf">Nome<input type="text" id="gPn" maxlength="60" value="'+esc(s.name)+'" required></label>'+
        '<label class="gf">Nome curto no mapa<input type="text" id="gPs" maxlength="24" value="'+esc(s.short||'')+'"></label>'+
        tg('gPoff',s.off,'Ponto desativado','Aparece apagado no mapa, com aviso para os alunos.')+
        '<label class="gf">Aviso<input type="text" id="gPav" maxlength="200" value="'+esc(s.aviso||'')+'" placeholder="Ex.: ponto provisório 50 m adiante"></label>'+
        pickMapHTML(pickP||s.p,Object.keys(STOPS).filter(function(k){return k!==id}).map(function(k){return STOPS[k].p}))+
        '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar</button>'+(GST.pontos[id]?'<button type="button" class="copy" data-greset="pontos:'+id+'">Voltar ao original</button>':'')+'</div></form>':'')+
    '</div>'}).join('')+'</div>';
}
/* ---------- wi-fi ---------- */
function gWifiTab(){
  var ids=Object.keys(WIFI),open=gEdit,newOpen=gEdit==='w:+';
  var removed=Object.keys(GST.wifi||{}).filter(function(k){return GST.wifi[k]&&GST.wifi[k].removed&&ORIG.wifi[k]});
  function form(id,w){return '<form class="gform" data-gform="wifi" data-id="'+id+'">'+
    '<label class="gf">Local<input type="text" id="gWn" maxlength="60" value="'+esc(w.name||'')+'" required placeholder="Ex.: Biblioteca do CCMN"></label>'+
    '<div class="g2"><label class="gf">Nome da rede (SSID)<input type="text" id="gWs" maxlength="40" value="'+esc(w.ssid||'')+'" placeholder="Ex.: UFRJ-Visitante"></label>'+
    '<label class="gf">Acesso<input type="text" id="gWa" maxlength="60" value="'+esc(w.acesso||'')+'" placeholder="Sem senha"></label></div>'+
    '<label class="gf">Dica<input type="text" id="gWd" maxlength="160" value="'+esc(w.note||'')+'" placeholder="Ex.: melhor sinal perto da janela"></label>'+
    pickMapHTML(pickP||w.p,Object.keys(WIFI).filter(function(k){return k!==id}).map(function(k){return WIFI[k].p}))+
    '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar</button>'+(id!=='+'?'<button type="button" class="copy danger" data-gwdel="'+id+'">Remover rede</button>':'')+(id!=='+'&&GST.wifi[id]&&ORIG.wifi[id]?'<button type="button" class="copy" data-greset="wifi:'+id+'">Voltar ao original</button>':'')+'</div></form>'}
  return '<h3 class="gh">Redes Wi-Fi</h3><p class="muted small">Cadastre redes novas, corrija nome e acesso ou tire do mapa uma rede que deixou de existir.</p>'+
    '<div class="gbtns"><button type="button" class="copy primary" data-gedit="w:+">'+(newOpen?'Cancelar':'Adicionar rede')+'</button></div>'+
    (newOpen?'<div class="gcard open">'+form('+',{})+'</div>':'')+
    '<div class="glist">'+ids.map(function(id){var w=WIFI[id],o=open==='w:'+id;
      return '<div class="gcard'+(o?' open':'')+'"><div class="grow2"><span class="grow"><b>'+esc(w.name)+'</b><small>'+esc(w.ssid||'Rede aberta')+' · nota '+br(avgOf(id))+' ('+votesOf(id)+')'+(w.novo?' · cadastrada pela gestão':'')+'</small></span><button type="button" class="copy" data-gedit="w:'+id+'">'+(o?'Fechar':'Editar')+'</button></div>'+(o?form(id,w):'')+'</div>'}).join('')+'</div>'+
    (removed.length?'<h3 class="gh">Removidas</h3><div class="glist">'+removed.map(function(id){return '<div class="grow2"><span class="grow"><b>'+esc(ORIG.wifi[id].name)+'</b></span><button type="button" class="copy" data-greset="wifi:'+id+'">Restaurar</button></div>'}).join('')+'</div>':'');
}
/* ---------- serviços ---------- */
var SVC_CAT={comida:'Alimentação',biblio:'Biblioteca',atend:'Atendimento',seg:'Segurança',onibus:'Ônibus'};
function svcList(){
  var q=glFold(gFilter.svc.trim());
  var ks=Object.keys(PL).filter(function(k){var it=PL[k];return ORIG.pl[k]&&it.cat!=='aula'&&!it.line&&(!q||glFold(it.name+' '+it.where).indexOf(q)>=0)});
  if(!ks.length)return '<p class="muted small">Nada encontrado.</p>';
  return ks.map(function(k){var it=PL[k],g=GST.servicos[k]||{},o=gEdit==='s:'+k;
    return '<div class="gcard'+(o?' open':'')+'"><div class="grow2"><span class="grow"><b>'+esc(it.name)+'</b><small>'+(SVC_CAT[it.cat]||'')+' · '+rangesTxt(it.wk,it.incl)+(GST.servicos[k]?' · alterado':'')+'</small></span>'+(it.fechadoTemp?'<span class="pill bad">Fechado</span>':'')+'<button type="button" class="copy" data-gedit="s:'+k+'">'+(o?'Fechar':'Editar')+'</button></div>'+
      (o?'<form class="gform" data-gform="servico" data-id="'+k+'">'+
        tg('gSfech',it.fechadoTemp,'Fechado temporariamente','Aparece como fechado em todo o app até você desligar.')+
        '<div class="g2"><label class="gf">Segunda a sexta<input type="text" id="gSwk" class="mono" value="'+esc(g.wk!=null?g.wk:rangesStr(ORIG.pl[k].wk))+'" placeholder="07:00-10:00, 11:00-14:00"></label>'+
        '<label class="gf">Fim de semana<input type="text" id="gSwe" class="mono" value="'+esc(g.we!=null?g.we:rangesStr(ORIG.pl[k].we))+'" placeholder="fechado, 24h ou 08:00-12:00"></label></div>'+
        '<label class="gf">Observação<input type="text" id="gSno" maxlength="200" value="'+esc(g.note||'')+'" placeholder="'+esc(ORIG.pl[k].note||'Ex.: cardápio vegetariano às quartas')+'"></label>'+
        '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar</button>'+(GST.servicos[k]?'<button type="button" class="copy" data-greset="servicos:'+k+'">Voltar ao original</button>':'')+'</div></form>':'')+'</div>'}).join('');
}
function gServicos(){
  return '<h3 class="gh">Serviços e horários</h3><p class="muted small">Restaurantes, bibliotecas, secretarias e segurança. Deixe o campo vazio para manter o horário original.</p><button type="button" class="copy" id="gSvJump">Mudar a localização dos serviços no mapa</button>'+
    '<label class="gf"><span class="sr">Buscar serviço</span><input type="search" id="gSq" placeholder="Buscar: RU, biblioteca, secretaria" value="'+esc(gFilter.svc)+'"></label><div class="glist" id="gSlist">'+svcList()+'</div><div id="gSvSec"></div>'+svcMapaHTML();
}
/* ---------- solicitações ---------- */
var REQ_GO={onibus:'linhas',ponto:'pontos',wifi:'wifi',servico:'servicos',planta:'plantas'};
function gSolic(){
  var all=allReqs();names(all.map(function(r){return r.owner}));
  var l=all.filter(function(r){var s=reqStatus(r.id).st;return gFilter.req==='todas'||(gFilter.req==='abertas'?(s==='nova'||s==='analise'):(s!=='nova'&&s!=='analise'))});
  var chips=[['abertas','Abertas'],['fechadas','Respondidas'],['todas','Todas']];
  return '<h3 class="gh">Solicitações de alteração</h3><p class="muted small">Pedidos que os alunos mandam pelo botão Sugerir correção. A resposta aparece para quem pediu.</p>'+
    '<div class="chips">'+chips.map(function(c){return '<button type="button" class="chip" data-greq="'+c[0]+'" aria-pressed="'+(gFilter.req===c[0])+'">'+c[1]+'</button>'}).join('')+'</div>'+
    (l.length?'<div class="glist">'+l.map(function(r){var s=reqStatus(r.id),S=REQ_ST[s.st];
      return '<form class="gcard open gform" data-gform="resp" data-id="'+esc(r.id)+'"><div class="req-h"><b>'+esc(reqTipo(r.t))+'</b><span class="pill '+S[1]+'">'+S[0]+'</span></div>'+(r.alvo?'<small><b>'+esc(r.alvo)+'</b></small>':'')+'<p>'+esc(r.txt)+'</p><small class="muted">'+esc(who(r.owner))+' · '+dmy(r.ts)+'</small>'+
        '<div class="g2"><label class="gf">Situação<select name="st">'+Object.keys(REQ_ST).map(function(k){return '<option value="'+k+'"'+(k===s.st?' selected':'')+'>'+REQ_ST[k][0]+'</option>'}).join('')+'</select></label>'+
        '<label class="gf">Resposta para o aluno<input type="text" name="nota" maxlength="240" value="'+esc(s.nota||'')+'" placeholder="Ex.: corrigido, obrigado!"></label></div>'+
        '<div class="gbtns"><button type="submit" class="copy primary">Responder</button>'+(REQ_GO[r.t]?'<button type="button" class="copy" data-gtab="'+REQ_GO[r.t]+'">Abrir '+esc(GTABS.filter(function(t){return t[0]===REQ_GO[r.t]})[0][1].toLowerCase())+'</button>':'')+'</div></form>'}).join('')+'</div>':'<p class="muted small">Nada por aqui.</p>');
}
/* ---------- plantas ---------- */
var PLANT_B=[['ct','Centro de Tecnologia (CT)'],['ccmn','CCMN'],['ccs','CCS'],['letras','Faculdade de Letras'],['reitoria','Reitoria · EBA · FAU'],['eefd','EEFD'],['hu','Hospital Universitário'],['ru','Restaurante Universitário Central']];
function plantName(p){for(var i=0;i<PLANT_B.length;i++)if(PLANT_B[i][0]===p.bld)return PLANT_B[i][1];return p.bname||p.bld}
var PIMG={},PIMGreq={};
function plantSrc(p){if(p.asset)return '/_blob/'+p.asset;if(p.data)return p.data;if(p.img==='fs'){if(PIMG[p.id])return PIMG[p.id];fetchPimg(p.id)}return ''}
function fetchPimg(id){if(PIMGreq[id]||!SH.db)return;PIMGreq[id]=1;SH.db.doc('plantas_img/'+id).get().then(function(d){if(d.exists&&/^data:(image\/|application\/pdf)/.test((d.data()||{}).data||'')){PIMG[id]=d.data().data;if(!pPane.hidden)renderPredios();if(gestM&&!gestM.hidden)renderGest()}},function(){PIMGreq[id]=0})}
function shrinkImg(file){return new Promise(function(res,rej){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){var s=Math.min(1,1600/Math.max(im.width||1600,im.height||1600)),c=document.createElement('canvas');c.width=Math.max(1,Math.round((im.width||1600)*s));c.height=Math.max(1,Math.round((im.height||1200)*s));var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);var q=.85,d=c.toDataURL('image/jpeg',q);while(d.length>900000&&q>.45){q-=.1;d=c.toDataURL('image/jpeg',q)}if(d.length>900000)rej(new Error('Imagem grande demais, mesmo comprimida.'));else res(d)};im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('Não deu para ler a imagem.'))};im.src=u})}
function gPlantas(){
  var items=(GST.plantas.items||[]).slice().sort(function(a,b){return b.ts-a.ts});
  var up=GESTOR===true?'':'<p class="muted small">No modo demonstração a imagem fica guardada só neste aparelho (até 1,5 MB).</p>';
  return '<h3 class="gh">Plantas dos prédios</h3><p class="muted small">Envie a planta de um andar (imagem ou PDF). Ela aparece na aba Lugares, no prédio escolhido.</p>'+
    '<form class="gcard open gform" data-gform="planta">'+
      '<div class="g2"><label class="gf">Prédio<select id="gPb">'+PLANT_B.map(function(b){return '<option value="'+b[0]+'">'+b[1]+'</option>'}).join('')+'<option value="outro">Outro prédio…</option></select></label>'+
      '<label class="gf" id="gPbnW" hidden>Nome do prédio<input type="text" id="gPbn" maxlength="60" placeholder="Ex.: Instituto de Biologia"></label></div>'+
      '<div class="g2"><label class="gf">Bloco<input type="text" id="gPbl" maxlength="20" placeholder="Ex.: A (opcional)"></label>'+
      '<label class="gf">Andar<input type="text" id="gPan" maxlength="20" placeholder="Ex.: Térreo, 2º andar" required></label></div>'+
      '<label class="gf">Arquivo<input type="file" id="gPf" accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf" required></label>'+
      '<p class="err small" id="gErr" role="alert"></p>'+up+'<div class="gbtns"><button type="submit" class="copy primary">Enviar planta</button></div></form>'+
    (items.length?'<div class="pgal">'+items.map(function(p){var pdf=p.tipo==='application/pdf';
      return '<figure class="pfig">'+(pdf?'<a class="pdfbox" href="'+esc(plantSrc(p))+'" target="_blank" rel="noopener">PDF</a>':'<a href="'+esc(plantSrc(p))+'" target="_blank" rel="noopener"><img src="'+esc(plantSrc(p))+'" alt="Planta: '+esc(plantName(p))+', '+esc(p.andar)+'" loading="lazy"></a>')+
        '<figcaption><b>'+esc(plantName(p))+'</b><small>'+(p.bloco?'Bloco '+esc(p.bloco)+' · ':'')+esc(p.andar)+' · '+dmy(p.ts)+'</small><button type="button" class="copy danger" data-gpdel="'+esc(p.id)+'">Remover</button></figcaption></figure>'}).join('')+'</div>':'<p class="muted small">Nenhuma planta enviada ainda.</p>');
}
/* ---------- avisos e filas (moderação) ---------- */
function gAvisos(){
  var reps=liveReps(),fl=filaAll();names(reps.map(function(r){return r.owner}).concat(fl.map(function(r){return r.owner})));
  return '<h3 class="gh">Avisos dos alunos ('+reps.length+')</h3>'+(reps.length?'<div class="glist">'+reps.map(function(r){var pl=placeOf(r.place);
      return '<div class="grow2"><span class="grow"><b>'+esc(repLabel(r.k))+'</b><small>'+esc(pl?pl.name:'')+(r.txt?' · “'+esc(r.txt)+'”':'')+'</small><small class="muted">'+esc(who(r.owner))+' · '+agoTxt(r.ts)+'</small></span><button type="button" class="copy danger" data-gmod="rep|'+esc(r.owner)+'|'+esc(r.id)+'">Remover</button>'+(r.owner&&r.owner!==SH.uid&&!blocked(r.owner)?'<button type="button" class="copy" data-gblock="'+esc(r.owner)+'">Bloquear autor</button>':'')+'</div>'}).join('')+'</div>':'<p class="muted small">Nenhum aviso ao vivo.</p>')+
    '<h3 class="gh">Filas informadas ('+fl.length+')</h3>'+(fl.length?'<div class="glist">'+fl.map(function(r){var L=FILA_N[r.n];
      return '<div class="grow2"><span class="grow"><b>'+esc(PL[r.ru].name)+'</b><small>'+L[0]+' · '+L[1]+'</small><small class="muted">'+esc(who(r.owner))+' · '+agoTxt(r.ts)+'</small></span><button type="button" class="copy danger" data-gmod="fila|'+esc(r.owner)+'|'+esc(r.id)+'">Remover</button></div>'}).join('')+'</div>':'<p class="muted small">Ninguém informou fila nos últimos 45 min.</p>');
}
/* ---------- ações ---------- */
function clone(o){return JSON.parse(JSON.stringify(o||{}))}
function onGestClick(e){
  var t=e.target.closest('[data-gtab],[data-gedit],[data-greset],[data-gblock],[data-gwdel],[data-gpdel],[data-gmod],[data-greq]');
  var pk=e.target.closest('#pkMap');
  if(pk&&!t){var ctm=pk.getScreenCTM();if(!ctm)return;var pt=pk.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;var q=pt.matrixTransform(ctm.inverse());pickP=[Math.round(q.x),Math.round(q.y)];
    var form=pk.closest('form'),vals={};form.querySelectorAll('input,textarea,select').forEach(function(i){vals[i.id]=i.type==='checkbox'?i.checked:i.value});
    renderGest();Object.keys(vals).forEach(function(id){var el=document.getElementById(id);if(el){if(el.type==='checkbox')el.checked=vals[id];else el.value=vals[id]}});var m=$('#pkMap');if(m)m.focus&&m.focus();return}
  if(!t)return;
  if(t.dataset.gtab){gTab=t.dataset.gtab;gEdit=null;pickP=null;renderGest();$('#gBody').scrollTop=0;gestM.querySelector('.gsheet').scrollTop=0;var b=gestM.querySelector('[data-gtab="'+gTab+'"].gtab');if(b)b.focus();return}
  if(t.dataset.gedit){gEdit=gEdit===t.dataset.gedit?null:t.dataset.gedit;pickP=null;renderGest();var f=gestM.querySelector('form[data-gform] input,form[data-gform] textarea');if(f&&gEdit)f.focus();return}
  if(t.dataset.greq){gFilter.req=t.dataset.greq;renderGest();return}
  if(t.dataset.greset){var p=t.dataset.greset.split(':'),o=clone(GST[p[0]]);delete o[p[1]];gEdit=null;pickP=null;saveG(p[0],o);return}
  if(t.dataset.gblock){var id=t.dataset.gblock,b2=clone(GST.bloqueados);b2.ids=Array.isArray(b2.ids)?b2.ids:[];
    if(b2.ids.indexOf(id)>=0)b2.ids=b2.ids.filter(function(x){return x!==id});else b2.ids.push(id);saveG('bloqueados',b2);return}
  if(t.dataset.gwdel){var wid=t.dataset.gwdel,w=clone(GST.wifi);if(ORIG.wifi[wid])w[wid]={removed:true};else delete w[wid];gEdit=null;pickP=null;saveG('wifi',w);return}
  if(t.dataset.gpdel){var pid=t.dataset.gpdel,pl=clone(GST.plantas),it=(pl.items||[]).filter(function(x){return x.id===pid})[0];
    pl.items=(pl.items||[]).filter(function(x){return x.id!==pid});
    saveG('plantas',pl).then(function(ok){if(ok&&it&&it.asset&&ASSETS)ASSETS.delete(it.asset).catch(function(){});if(ok&&it&&it.img==='fs'&&SH.db)SH.db.doc('plantas_img/'+it.id).delete().catch(function(){})});return}
  if(t.dataset.gmod){var m=t.dataset.gmod.split('|'),kind=m[0],owner=m[1],rid=m[2];
    if(!SH.on){if(kind==='fila'){filaLocal=filaLocal.filter(function(r){return r.id!==rid});try{localStorage.setItem(FKEY,JSON.stringify(filaLocal))}catch(err){}}refreshAll();drawShared();renderGest();return}
    var src=kind==='rep'?SH.reps:SH.fila,keep=src.filter(function(r){return r.owner===owner&&r.id!==rid}).map(function(r){return kind==='rep'?{id:r.id,k:r.k,place:r.place,txt:r.txt,ts:r.ts}:{id:r.id,ru:r.ru,n:r.n,ts:r.ts}});
    SH.db.doc((kind==='rep'?'reports/':'fila/')+owner).set({items:keep}).then(function(){gToast('Removido.')},function(){gToast('Não deu para remover.',1)});return}
}
function onGestChange(e){
  if(e.target.id==='gPb'){var w=$('#gPbnW');if(w)w.hidden=e.target.value!=='outro'}
}
function onGestSubmit(e){
  var f=e.target.closest('form[data-gform]');if(!f)return;e.preventDefault();
  var kind=f.dataset.gform,id=f.dataset.id,err=f.querySelector('#gErr')||{},v=function(x){var el=f.querySelector('#'+x);return el?el.value:''},c=function(x){var el=f.querySelector('#'+x);return !!(el&&el.checked)};
  try{
    if(kind==='linha'){
      var l=LINES[id],o=clone(GST.linhas),hor=[];
      l.trips.forEach(function(tr,i){var txt=v('gLh'+i).trim(),d=parseDeps(txt);if(!d.length)throw new Error('Informe pelo menos uma saída.');hor.push(compressDeps(d)===compressDeps(ORIG.lines[id].deps[i])?'':compressDeps(d))});
      var g={susp:c('gLsusp'),aviso:cleanTxt(v('gLaviso'),200),sum:cleanTxt(v('gLsum'),200)===ORIG.lines[id].sum?'':cleanTxt(v('gLsum'),200)};
      if(hor.some(function(h){return h}))g.hor=hor;
      if(!g.susp&&!g.aviso&&!g.sum&&!g.hor)delete o[id];else o[id]=g;
      gEdit=null;saveG('linhas',o);
    }else if(kind==='ponto'&&(id==='+'||(GST.pontos[id]&&GST.pontos[id].novo))){
      var nn=cleanTxt(v('gPn'),60);if(!nn)throw new Error('O ponto precisa de um nome.');
      var np=pickP||(GST.pontos[id]&&GST.pontos[id].p);if(!validP(np))throw new Error('Toque no mapa para marcar onde fica o ponto.');
      var lin={},any=false;Object.keys(LINES).forEach(function(lid){var a=LINES[lid].trips[0].halves.map(function(h,hi){return v('gPl_'+lid+'_'+hi)||''});if(a.some(function(x){return x})){lin[lid]=a;any=true}});
      var nid=id==='+'?'n'+Date.now().toString(36):id,opn=clone(GST.pontos);
      opn[nid]={novo:true,name:nn,short:cleanTxt(v('gPs'),24),p:np.map(function(x){return Math.round(x*10)/10}),off:c('gPoff'),aviso:cleanTxt(v('gPav'),200),lin:lin};
      gEdit=null;pickP=null;saveG('pontos',opn);if(!any)gToast('Ponto criado. Escolha as linhas que param nele para ele aparecer nos horários.');
    }else if(kind==='ponto'){
      var n=cleanTxt(v('gPn'),60);if(!n)throw new Error('O ponto precisa de um nome.');
      var op=clone(GST.pontos),s0=ORIG.stops[id],p=pickP||STOPS[id].p;
      var gp={name:n===s0.name?'':n,short:cleanTxt(v('gPs'),24)===(s0.short||'')?'':cleanTxt(v('gPs'),24),off:c('gPoff'),aviso:cleanTxt(v('gPav'),200)};
      if(p[0]!==s0.p[0]||p[1]!==s0.p[1])gp.p=p;
      if(!gp.name&&!gp.short&&!gp.off&&!gp.aviso&&!gp.p)delete op[id];else op[id]=gp;
      gEdit=null;pickP=null;saveG('pontos',op);
    }else if(kind==='wifi'){
      var wn=cleanTxt(v('gWn'),60);if(!wn)throw new Error('Diga onde fica a rede.');
      var wid=id==='+'?'g'+Date.now().toString(36):id,wp=pickP||(WIFI[wid]&&WIFI[wid].p);
      if(!validP(wp))throw new Error('Toque no mapa para marcar onde fica a rede.');
      var ow=clone(GST.wifi);ow[wid]={name:wn,ssid:cleanTxt(v('gWs'),40),acesso:cleanTxt(v('gWa'),60),note:cleanTxt(v('gWd'),160),p:wp};
      gEdit=null;pickP=null;saveG('wifi',ow);
    }else if(kind==='servico'){
      var wk=v('gSwk').trim(),we=v('gSwe').trim().toLowerCase();
      if(wk&&!/^fechado$/i.test(wk))parseRanges(wk);if(we&&we!=='fechado')parseRanges(we);
      var os=clone(GST.servicos),gs={fechado:c('gSfech'),note:cleanTxt(v('gSno'),200)};
      if(wk!==rangesStr(ORIG.pl[id].wk))gs.wk=/^fechado$/i.test(wk)?'':wk;
      if(we!==rangesStr(ORIG.pl[id].we))gs.we=we;
      if(!gs.fechado&&!gs.note&&gs.wk==null&&gs.we==null)delete os[id];else os[id]=gs;
      gEdit=null;saveG('servicos',os);
    }else if(kind==='resp'){
      var orr=clone(GST.respostas);orr[id]={st:f.elements.st.value,nota:cleanTxt(f.elements.nota.value,240),ts:Date.now()};saveG('respostas',orr);
    }else if(kind==='planta'){
      upPlanta(f,err);
    }
  }catch(ex){err.textContent=ex.message||'Confira os campos.'}
}
function upPlanta(f,err){
  var file=$('#gPf').files[0],bld=$('#gPb').value,bname=cleanTxt($('#gPbn').value,60),and=cleanTxt($('#gPan').value,20),bl=cleanTxt($('#gPbl').value,20);
  if(bld==='outro'&&!bname)throw new Error('Diga o nome do prédio.');
  if(!and)throw new Error('Diga o andar.');
  if(!file)throw new Error('Escolha o arquivo da planta.');
  var tipo=file.type||(/\.pdf$/i.test(file.name)?'application/pdf':'');
  if(!/^(image\/(png|jpeg|webp|svg\+xml)|application\/pdf)$/.test(tipo))throw new Error('Use imagem (PNG, JPG, WebP, SVG) ou PDF.');
  var btn=f.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Enviando…';
  var rec={id:'pl'+Date.now().toString(36),bld:bld==='outro'?'x-'+glFold(bname).replace(/[^a-z0-9]+/g,'-').slice(0,30):bld,bname:bld==='outro'?bname:'',bloco:bl,andar:and,tipo:tipo,ts:Date.now()};
  function done(){var o=clone(GST.plantas);o.items=(o.items||[]).concat([rec]).slice(-60);saveG('plantas',o)}
  function fail(m){btn.disabled=false;btn.textContent='Enviar planta';err.textContent=m}
  if(GESTOR===true&&FBMODE){
    var pdf=tipo==='application/pdf';
    (pdf?new Promise(function(res,rej){if(file.size>650*1024)return rej(new Error('PDF grande demais (máximo 650 KB). Envie como imagem.'));var rd=new FileReader();rd.onload=function(){res(rd.result)};rd.onerror=function(){rej(new Error('Não deu para ler o arquivo.'))};rd.readAsDataURL(file)}):shrinkImg(file))
    .then(function(d){rec.img='fs';if(!pdf)rec.tipo='image/jpeg';PIMG[rec.id]=d;return SH.db.doc('plantas_img/'+rec.id).set({data:d,ts:Date.now()}).then(done)})
    .catch(function(x){fail(x&&x.message?x.message:'Não deu para enviar agora.')});
  }else if(GESTOR===true){
    (ASSETS?Promise.resolve(ASSETS):window.claude.use('assets')).then(function(a){
      if(!a)return fail('Só quem tem acesso de editor pode enviar plantas.');ASSETS=a;
      return a.upload(file,{type:tipo}).then(function(r){rec.asset=r.id;done()},function(x){fail(x&&x.code==='too_large'?'Arquivo grande demais (máximo 20 MB).':x&&x.code==='unsupported_type'?'Tipo de arquivo não aceito.':'Não deu para enviar agora.')});
    });
  }else{
    if(file.size>1.5*1024*1024)return fail('No modo demonstração o limite é 1,5 MB.');
    var rd=new FileReader();rd.onload=function(){rec.data=rd.result;done()};rd.onerror=function(){fail('Não deu para ler o arquivo.')};rd.readAsDataURL(file);
  }
}
/* plantas na aba Lugares */
function plantasDe(bld){return (GST.plantas.items||[]).filter(function(p){return p.bld===bld})}
function plantasHTML(bld){
  var l=plantasDe(bld).sort(function(a,b){return (a.bloco+a.andar).localeCompare(b.bloco+b.andar,'pt',{numeric:true})});if(!l.length)return '';
  return '<div class="plantas"><h3>Plantas oficiais</h3><p class="muted small">Enviadas pela gestão do app. Toque para ampliar.</p><div class="pgal">'+l.map(function(p){var pdf=p.tipo==='application/pdf';
    return '<figure class="pfig">'+(pdf?'<a class="pdfbox" href="'+esc(plantSrc(p))+'" target="_blank" rel="noopener">PDF</a>':'<a href="'+esc(plantSrc(p))+'" target="_blank" rel="noopener"><img src="'+esc(plantSrc(p))+'" alt="Planta: '+(p.bloco?'bloco '+esc(p.bloco)+', ':'')+esc(p.andar)+'" loading="lazy"></a>')+'<figcaption><b>'+(p.bloco?'Bloco '+esc(p.bloco)+' · ':'')+esc(p.andar)+'</b></figcaption></figure>'}).join('')+'</div></div>';
}
