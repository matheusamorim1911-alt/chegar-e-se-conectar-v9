/* ======================= gestão: serviços no mapa (posição, referência, esconder, novos) ======================= */
GKEYS.push('svcmapa');GST.svcmapa={};
ORIG.svc=SVC.map(function(s){return {id:s.id,t:s.t,p:s.p.slice(),near:s.near}});
/* cada ícone de RU no mapa pode ficar ligado a um RU da lista de Lugares: a fila informada aparece em cima dele */
var RU_LINK_DEF={ru1:'ru_letras',ru2:'ru_ct1'};
ORIG.plp={};RUS.forEach(function(k){ORIG.plp[k]=PL[k].p?PL[k].p.slice():null});
function ruLinkOf(id){var x=(GST.svcmapa||{})[id];if(x&&typeof x.ru==='string')return x.ru;return RU_LINK_DEF[id]||''}
gFilter.svt='todos';
function applySvcMapa(){
  var g=GST.svcmapa||{},out=[];
  ORIG.svc.forEach(function(o){var x=g[o.id]||{};if(x.removed)return;
    out.push({id:o.id,t:o.t,p:validP(x.p)?x.p.slice():o.p.slice(),near:x.near?cleanTxt(x.near,60):o.near,mod:!!(x.p||x.near)})});
  Object.keys(g).forEach(function(id){var x=g[id];if(!x||!x.novo||x.removed||!/^[\w-]{1,40}$/.test(id)||!SVC_T[x.t]||!validP(x.p))return;
    out.push({id:id,t:x.t,p:x.p.slice(),near:cleanTxt(x.near,60)||'novo ponto',novo:true})});
  SVC.length=0;Object.keys(SVCMAP).forEach(function(k){delete SVCMAP[k]});
  out.forEach(function(s){s.name=SVC_T[s.t].n;s.full=SVC_T[s.t].n+' · perto de '+s.near;SVC.push(s);SVCMAP[s.id]=s});
  RUS.forEach(function(k){var o=ORIG.plp[k];if(o)PL[k].p=o.slice();else delete PL[k].p});
  SVC.forEach(function(sv){if(sv.t!=='ru')return;var k=ruLinkOf(sv.id);if(k&&PL[k]&&RUS.indexOf(k)>=0){PL[k].p=sv.p.slice();sv.ru=k;sv.full=PL[k].name+' · perto de '+sv.near}});
  if(state.sel&&state.sel.kind==='svc'&&!SVCMAP[state.sel.id])state.sel=null;
}
aoFazer('dados da gestão aplicados',function(){applySvcMapa()});
if(!FBMODE&&ON_SITE&&GESTOR==='demo'){try{var _sv=JSON.parse(localStorage.getItem(GLS+'svcmapa'));if(_sv){GST.svcmapa=_sv;rebuildAll()}}catch(e){}}
function svcMapaHTML(){
  var g=GST.svcmapa||{},types=Object.keys(SVC_T);
  var hidden=ORIG.svc.filter(function(o){return g[o.id]&&g[o.id].removed});
  var l=SVC.filter(function(s){return gFilter.svt==='todos'||s.t===gFilter.svt}).sort(function(a,b){return SVC_T[a.t].n.localeCompare(SVC_T[b.t].n,'pt')||a.near.localeCompare(b.near,'pt')});
  var newOpen=gEdit==='sv:+';
  function form(id,s){
    var others=SVC.filter(function(o){return o.id!==id}).map(function(o){return o.p});
    return '<form class="gform" data-gform="svcmapa" data-id="'+esc(id)+'">'+
      (id==='+'?'<label class="gf">Tipo<select id="gSvNt">'+types.map(function(t){return '<option value="'+t+'">'+esc(SVC_T[t].n)+'</option>'}).join('')+'</select></label>':'')+
      (id==='+'||s.t==='ru'?'<label class="gf">Fila do RU mostrada neste ícone'+(id==='+'?' (só para Restaurante Universitário)':'')+'<select id="gSvRu"><option value="">Nenhuma</option>'+RUS.map(function(k){var cur=s?ruLinkOf(s.id):'';return '<option value="'+k+'"'+(cur===k?' selected':'')+'>'+esc(PL[k].name)+'</option>'}).join('')+'</select></label>':'')+
      '<label class="gf">Perto de (referência que aparece para o aluno)<input type="text" id="gSvNear" maxlength="60" value="'+esc(s?s.near:'')+'" placeholder="Ex.: CT, bloco A"></label>'+
      pickMapHTML(pickP||(s&&s.p),others)+
      (id!=='+'?tg('gSvOff',false,'Esconder do mapa','Some do mapa e da busca. Dá para trazer de volta depois.'):'')+
      '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar</button>'+
      (s&&!s.novo&&g[id]&&(g[id].p||g[id].near)?'<button type="button" class="copy" data-svreset="'+esc(id)+'">Voltar ao original</button>':'')+
      (s&&s.novo?'<button type="button" class="copy danger" data-svdel="'+esc(id)+'">Apagar</button>':'')+'</div></form>';
  }
  return '<h3 class="gh">Serviços no mapa</h3><p class="muted small">Bancos, farmácias, restaurantes, papelarias, táxi e outros ícones da camada Serviços. Toque em Mudar lugar e depois no ponto certo do mapa.</p>'+
    '<div class="g2"><label class="gf">Tipo<select id="gSvT"><option value="todos">Todos ('+SVC.length+')</option>'+types.map(function(t){var n=SVC.filter(function(s){return s.t===t}).length;return n?'<option value="'+t+'"'+(gFilter.svt===t?' selected':'')+'>'+esc(SVC_T[t].n)+' ('+n+')</option>':''}).join('')+'</select></label></div>'+
    '<div class="glist">'+l.map(function(s){var open=gEdit==='sv:'+s.id,T=SVC_T[s.t];
      return '<div class="gcard'+(open?' open':'')+'"><div class="grow2"><span class="svdot" style="background:'+T.c+'" aria-hidden="true">'+esc(T.g)+'</span><span class="grow"><b>'+esc(T.n)+'</b><small>'+(s.t==='ru'&&ruLinkOf(s.id)&&PL[ruLinkOf(s.id)]?esc(PL[ruLinkOf(s.id)].name)+' · ':'')+'Perto de '+esc(s.near)+(s.novo?' · adicionado pela gestão':s.mod?' · alterado':'')+'</small></span><button type="button" class="copy" data-gedit="sv:'+esc(s.id)+'">'+(open?'Fechar':'Mudar lugar')+'</button></div>'+(open?form(s.id,s):'')+'</div>'}).join('')+'</div>'+
    '<div class="gcard'+(newOpen?' open':'')+'"><div class="grow2"><span class="grow"><b>Adicionar serviço no mapa</b><small>Um banco, lanchonete ou ponto de táxi que ainda não aparece</small></span><button type="button" class="copy" data-gedit="sv:+">'+(newOpen?'Fechar':'Adicionar')+'</button></div>'+(newOpen?form('+',null):'')+'</div>'+
    (hidden.length?'<h4 class="gh4">Escondidos do mapa</h4><div class="glist">'+hidden.map(function(o){return '<div class="grow2"><span class="grow"><b>'+esc(SVC_T[o.t].n)+'</b><small>Perto de '+esc(o.near)+'</small></span><button type="button" class="copy" data-svshow="'+esc(o.id)+'">Mostrar de novo</button></div>'}).join('')+'</div>':'');
}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#gSvJump')){var t=$('#gSvSec');if(t)t.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});var s=$('#gSvT');if(s)setTimeout(function(){s.focus({preventScroll:true})},300)}});
document.addEventListener('change',function(e){if(e.target&&e.target.id==='gSvT'){gFilter.svt=e.target.value;gEdit=null;pickP=null;renderGest();var s=$('#gSvT');if(s)s.focus()}});
document.addEventListener('click',function(e){
  if(!e.target.closest||!e.target.closest('#gestM'))return;
  var r=e.target.closest('[data-svreset]'),d=e.target.closest('[data-svdel]'),sh=e.target.closest('[data-svshow]'),o;
  if(r){o=clone(GST.svcmapa);delete o[r.dataset.svreset];gEdit=null;pickP=null;saveG('svcmapa',o);return}
  if(d){o=clone(GST.svcmapa);delete o[d.dataset.svdel];gEdit=null;pickP=null;saveG('svcmapa',o);return}
  if(sh){o=clone(GST.svcmapa);var x=o[sh.dataset.svshow]||{};delete x.removed;if(Object.keys(x).length)o[sh.dataset.svshow]=x;else delete o[sh.dataset.svshow];saveG('svcmapa',o)}
});
document.addEventListener('submit',function(e){
  var f=e.target.closest&&e.target.closest('form[data-gform="svcmapa"]');if(!f)return;e.preventDefault();e.stopPropagation();
  var id=f.dataset.id,err=f.querySelector('#gErr'),near=cleanTxt((f.querySelector('#gSvNear')||{}).value,60),o=clone(GST.svcmapa);
  if(id==='+'){
    var t=(f.querySelector('#gSvNt')||{}).value;
    if(!SVC_T[t]){err.textContent='Escolha o tipo.';return}
    if(!validP(pickP)){err.textContent='Toque no mapa para marcar onde fica.';return}
    if(!near){err.textContent='Diga perto de onde fica, para o aluno se orientar.';return}
    o['s'+Date.now().toString(36)]={novo:true,t:t,p:pickP.slice(),near:near};
  }else{
    var s=SVCMAP[id];if(!s){err.textContent='Esse serviço não existe mais.';return}
    var orig=ORIG.svc.filter(function(x){return x.id===id})[0],x=o[id]||{},off=!!(f.querySelector('#gSvOff')||{}).checked;
    if(s.novo){x.p=validP(pickP)?pickP.slice():s.p;x.near=near||s.near;if(off){delete o[id]}else o[id]=x}
    else{
      var p=validP(pickP)?pickP.slice():s.p;
      if(p[0]!==orig.p[0]||p[1]!==orig.p[1])x.p=p;else delete x.p;
      if(near&&near!==orig.near)x.near=near;else delete x.near;
      if(off)x.removed=true;else delete x.removed;
      if(Object.keys(x).length)o[id]=x;else delete o[id];
    }
  }
  var ruSel=f.querySelector('#gSvRu');
  if(ruSel){var key=id==='+'?Object.keys(o).filter(function(k){return o[k]&&o[k].novo}).sort().pop():id,tp=o[key]&&o[key].t||(SVCMAP[key]&&SVCMAP[key].t);
    if(key&&o[key]!==undefined||key&&SVCMAP[key]){var y=o[key]||{},v=tp==='ru'?ruSel.value:'';
      if(!y.novo&&(v===(RU_LINK_DEF[key]||'')))delete y.ru;else y.ru=v;
      if(Object.keys(y).length)o[key]=y;else delete o[key];
      /* um RU só pode estar em um ícone: tira a ligação dos outros */
      if(v)SVC.forEach(function(sv){if(sv.id===key||sv.t!=='ru'||ruLinkOf(sv.id)!==v)return;var z=o[sv.id]||{};z.ru='';o[sv.id]=z});}}
  gEdit=null;pickP=null;saveG('svcmapa',o);
},true);
/* ======================= foto de perfil da conta (Google, Claude ou Gravatar do e-mail) ======================= */
function fotoAtual(){if(CFG.foto===false)return '';return ACC.photo||(PERFIL&&PERFIL.photo)||''}
function faceHTML(name){var f=fotoAtual(),ini=esc(String(name||'?').charAt(0).toUpperCase());
  return f?'<img class="lg-photo" src="'+esc(f)+'" alt="" referrerpolicy="no-referrer" data-ini="'+ini+'">':ini}
function paintFaces(){
  var n=PERFIL?PERFIL.name:'';
  var li=$('#lgInit');if(li&&PERFIL)li.innerHTML=faceHTML(n);
  var pf=document.querySelector('#cfgR .prof .lg-face');if(pf&&PERFIL)pf.innerHTML=faceHTML(n);
}
/* foto que não carrega: volta para a inicial */
document.addEventListener('error',function(e){var t=e.target;if(t&&t.classList&&t.classList.contains('lg-photo')){var p=t.parentNode;if(p)p.textContent=t.dataset.ini||'?'}},true);
function savePhoto(url){
  ACC.photo=url||ACC.photo;
  if(PERFIL&&url&&PERFIL.photo!==url){PERFIL.photo=url;savePerfil()}
  paintFaces();accPaint();
}
/* Gravatar: a foto ligada ao e-mail em gravatar.com (muitos serviços usam). Só busca se existir. */
function gravatar(email){
  if(!email||!window.crypto||!crypto.subtle||!window.TextEncoder)return Promise.resolve('');
  return crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(email).trim().toLowerCase())).then(function(h){
    var hex=Array.prototype.map.call(new Uint8Array(h),function(b){return ('0'+b.toString(16)).slice(-2)}).join('');
    var url='https://www.gravatar.com/avatar/'+hex+'?s=200&d=404';
    return new Promise(function(res){var im=new Image();im.referrerPolicy='no-referrer';im.onload=function(){res(url)};im.onerror=function(){res('')};im.src=url;setTimeout(function(){res('')},6000)});
  },function(){return ''});
}
aoFazer('ajustes montados',function(f){paintFaces();
  var p=document.querySelector('#cfgR .prof');if(!p||!PERFIL||document.getElementById('cfgFotoRow'))return;
  var src=ACC.photo||PERFIL.photo;
  var desc=src?(ACC.kind==='claude'?'Usa a foto da sua conta do Claude.':ACC.prov==='email'?'Usa a foto ligada ao seu e-mail no Gravatar.':'Usa a foto da sua conta Google.'):
    (ACC.kind==='google'&&ACC.prov==='email'?'Seu e-mail não tem foto no Gravatar. Cadastre uma em gravatar.com e ela aparece aqui.':'Entre com Google ou com e-mail em Conta para usar a foto da conta.');
  var row=document.createElement('div');row.id='cfgFotoRow';
  row.innerHTML=tg('cfgFoto',CFG.foto!==false&&!!src,'Foto da conta no perfil',desc);
  var anchor=document.getElementById('cfgBioRow')||p;anchor.insertAdjacentElement('afterend',row);
  var cb=row.querySelector('#cfgFoto');if(!src)cb.disabled=true;
  cb.addEventListener('change',function(){CFG.foto=cb.checked;saveCfg();paintFaces()});
});
aoFazer('usuário saiu',function(){ACC.photo='';paintFaces()});
/* ======================= planta interna: minimizada e só montada quando a pessoa abre ======================= */
pstate.planOpen=false;
document.addEventListener('toggle',function(e){
  var d=e.target;if(!d||d.id!=='planDet')return;
  pstate.planOpen=d.open;
  var b=d.querySelector('.plandet-b');
  if(d.open&&b&&!b.firstChild){var id=d.dataset.pid||null;b.innerHTML=planBodyHTML(id);
    var c=b.querySelector('.pick .chips [aria-pressed="true"]');if(c)c.focus({preventScroll:true});
    var w=b.querySelector('.planwrap'),sel=w&&w.querySelector('.pl-room.sel');if(w&&sel){var r1=w.getBoundingClientRect(),r2=sel.getBoundingClientRect();w.scrollLeft+=r2.left+r2.width/2-(r1.left+r1.width/2)}}
},true);
/* ======================= Ajustes › Desempenho ======================= */
var PERFS=[['auto','Automático','O app decide pelo aparelho: no computador usa o Completo; no celular e no tablet, o Intermediário.'],
  ['leve','Leve','Tira as transparências, o desfoque, as sombras e as animações (capa e movimento nas rotas). Bom para celulares mais simples ou com pouca bateria.'],
  ['intermediario','Intermediário','Vidro e efeitos no mapa, nos painéis e nos botões. Ajustes, glossário e gestão ficam sólidos, para pesar menos.'],
  ['completo','Completo','Tudo do Intermediário, mais vidro transparente e animações ao abrir Ajustes, glossário e gestão. Pode deixar aparelhos mais simples lentos.']];
function perfHTML(){
  var cur=PERFS.filter(function(x){return x[0]===perfMode()})[0]||PERFS[0];
  return '<div class="perfsec" id="perfsec"><div><p class="eyebrow">Ajustes</p><h2>Desempenho</h2></div>'+
    '<div class="perfopts" role="radiogroup" aria-label="Desempenho">'+PERFS.map(function(x){var on=x[0]===cur[0];return '<button type="button" class="chip" role="radio" aria-checked="'+on+'" aria-pressed="'+on+'" data-perf="'+x[0]+'">'+x[1]+'</button>'}).join('')+'</div>'+
    '<p class="muted small keep">'+cur[2]+(cur[0]==='auto'?' Neste aparelho: '+(perfEff()==='completo'?'Completo.':'Intermediário.'):'')+'</p></div>';
}
aoFazer('ajustes montados',function(f){var L=$('#cfgL');if(L&&!L.querySelector('#perfsec'))L.insertAdjacentHTML('beforeend',perfHTML());if(f&&/data-perf/.test(f)){var el=document.querySelector(f);if(el)el.focus({preventScroll:true})}});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-perf]');if(!b)return;
  CFG.perf=b.dataset.perf;saveCfg();applyPerf();updateMap();if(typeof placeCoverMap==='function'&&!cover.hidden)placeCoverMap();
  var sec=$('#perfsec');if(sec){var t=document.createElement('div');t.innerHTML=perfHTML();sec.replaceWith(t.firstChild)}
  var nb=document.querySelector('[data-perf="'+CFG.perf+'"]');if(nb)nb.focus({preventScroll:true});
  gToast(CFG.perf==='leve'?'Modo leve ligado.':CFG.perf==='completo'?'Modo completo ligado.':CFG.perf==='intermediario'?'Modo intermediário ligado.':'Desempenho automático.')});
