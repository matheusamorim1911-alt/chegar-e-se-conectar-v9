/* ======================= Favoritos: pontos e linhas por categoria =======================
   O aluno guarda pontos de ônibus (parada da UFRJ e/ou ponto da cidade) e linhas (internas e da cidade) em categorias
   (Casa, Trabalho, Estudos ou uma com o nome que quiser). Aparecem no topo de Trajetos, por categoria, com o próximo
   ônibus de cada um (horário das internas; ao vivo ou pelo horário nas da cidade), e os 3 primeiros na capa.
   Favoritar: estrela no painel do ponto ou da linha interna, ou "Adicionar" em Meus favoritos.
   Guardados nos ajustes (CFG.favs: {id, t:'p'|'i'|'c', ref, cat, ts}): no aparelho e na conta. Apagar deixa {id, x:1}
   para não voltar quando a conta junta as listas (favJunta, chamada em applyRemote). */
var FAV={max:12,cats:['Casa','Trabalho','Estudos'],filtro:'',form:null,sel:null};
function favLista(){return (Array.isArray(CFG.favs)?CFG.favs:[]).filter(function(f){return f&&!f.x&&f.ref&&favValido(f)})}
function favValido(f){if(f.t==='p')return !!alvPonto(f.ref);if(f.t==='i')return !!LINES[f.ref];if(f.t==='c')return !!favLinhaCidade(f.ref);return false}
function favLinhaCidade(n){return EXT.lines.filter(function(L){return L.n===n})[0]||null}
function favGuarda(){var L=(CFG.favs||[]).slice();if(L.length>40)L=L.filter(function(f){return !f.x}).concat(L.filter(function(f){return f.x}).slice(-10));CFG.favs=L;saveCfg()}
function favJunta(R){
  var M={},mudou=false;(CFG.favs||[]).forEach(function(f){if(f&&f.id)M[f.id]=f});
  R.forEach(function(f){if(!f||!f.id)return;var a=M[f.id];
    if(!a||(f.x&&!a.x)||(!a.x&&!f.x&&(f.ts||0)>(a.ts||0))){M[f.id]=f;mudou=true}});
  if(mudou){CFG.favs=Object.keys(M).map(function(k){return M[k]});setTimeout(favPinta,0)}
  return mudou;
}
function favDe(t,ref){return favLista().filter(function(f){return f.t===t&&f.ref===ref})[0]||null}
function favCats(){var C=FAV.cats.slice();favLista().forEach(function(f){if(C.indexOf(f.cat)<0)C.push(f.cat)});return C}
function favNome(f){
  if(f.t==='p'){var p=alvPonto(f.ref);return p?p.name:''}
  if(f.t==='i')return 'Linha '+f.ref+' · '+LINES[f.ref].name;
  var L=favLinhaCidade(f.ref);return L?L.n+' · '+L.d:'';
}
/* o próximo ônibus de cada favorito, em texto curto */
function favProxInternas(st,now){
  var R=[];Object.keys(LINES).forEach(function(lid){var L=LINES[lid];if(L.susp||!nightOK(lid))return;var best=null;
    L.trips.forEach(function(tr){for(var i=0;i<tr.passes.length;i++){if(tr.passes[i].stop!==st)continue;
      tr.deps.forEach(function(d){var m=d+tr.passes[i].off;if(m>=now-0.5&&(best==null||m<best))best=m});break}});
    if(best!=null)R.push({lid:lid,m:best})});
  return R.sort(function(a,b){return a.m-b.m});
}
function favEm(m,now){var a=Math.round(m-now);return a<=1?'agora':a<60?'em '+a+' min':'às '+fmt(m)}
function favProx(f,now){
  if(f.t==='p'){var p=alvPonto(f.ref),out=[];if(!p)return '';
    if(p.st){var I=favProxInternas(p.st,now)[0];if(I)out.push(badge(I.lid)+' '+favEm(I.m,now))}
    if(p.gr){var V=typeof chegandoEm==='function'?chegandoEm(p.gr)[0]:null;
      if(V)out.push(extBadge(segLinha(V.o.l))+' '+segQuando(V.t,V.m)+' <span class="lv-tag">ao vivo</span>');
      else{var bx=null;EXT.lines.forEach(function(L){if(!L.st.some(function(s){return s[0]===p.gr}))return;var n=extNext(L,p.gr,now,1)[0];if(n!=null&&(!bx||n<bx.m))bx={L:L,m:n}});
        if(bx)out.push(extBadge(bx.L)+' '+favEm(bx.m,now))}}
    return out.length?out.join(' · '):'<span class="muted">sem mais ônibus hoje</span>';
  }
  if(f.t==='i'){var L=LINES[f.ref];if(L.susp)return '<span class="muted">suspensa</span>';if(!nightOK(f.ref))return '<span class="muted">só em dias úteis</span>';
    var nx=null;L.trips.forEach(function(tr){tr.deps.forEach(function(d){if(d>=now-0.5&&(nx==null||d<nx))nx=d})});
    return nx!=null?'Próxima saída '+favEm(nx,now):'<span class="muted">sem mais saídas hoje</span>'}
  var C=favLinhaCidade(f.ref),vivos=liveCount(C.n),n2=extToday(C)?extNext(C,C.st[0][0],now,1)[0]:null;
  return (n2!=null?'Próxima saída '+favEm(n2,now):'<span class="muted">'+(extToday(C)?'sem mais saídas hoje':'não circula hoje')+'</span>')+(vivos?' · <span class="lv-tag">'+vivos+' ao vivo</span>':'');
}
function favItem(f,now){
  var ic=f.t==='p'?'<span class="fav-ic" aria-hidden="true">P</span>':f.t==='i'?badge(f.ref):extBadge(favLinhaCidade(f.ref));
  return '<li class="fav-it"><button type="button" class="fav-ir" data-favir="'+esc(f.id)+'">'+ic+'<span class="grow"><b>'+esc(f.t==='p'?favNome(f):f.t==='i'?LINES[f.ref].name:favLinhaCidade(f.ref).d)+'</b><small>'+favProx(f,now)+'</small></span></button>'+
    '<button type="button" class="alv-x" data-favdel="'+esc(f.id)+'" aria-label="Tirar dos favoritos">×</button></li>';
}
/* ---------- Meus favoritos (topo de Trajetos) ---------- */
function favFormHTML(){
  var F=FAV.form,P=alvPontos();
  var ops=F.t==='p'?P.map(function(p){return '<option value="'+esc(p.k)+'"'+(p.k===F.ref?' selected':'')+'>'+esc(p.name)+'</option>'}).join(''):
    F.t==='i'?Object.keys(LINES).map(function(l){return '<option value="'+esc(l)+'"'+(l===F.ref?' selected':'')+'>Linha '+esc(l)+' · '+esc(LINES[l].name)+'</option>'}).join(''):
    EXT.lines.slice().sort(function(a,b){return String(a.n).localeCompare(String(b.n),'pt-BR',{numeric:true})}).map(function(L){return '<option value="'+esc(L.n)+'"'+(L.n===F.ref?' selected':'')+'>'+esc(L.n)+' · '+esc(L.d)+'</option>'}).join('');
  return '<div class="fav-form" id="favForm"><div class="seg chips" role="group" aria-label="O que guardar">'+[['p','Ponto'],['i','Linha da UFRJ'],['c','Linha da cidade']].map(function(x){return '<button type="button" data-favt="'+x[0]+'" aria-pressed="'+(F.t===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>'+
    '<label class="fld">'+(F.t==='p'?'Ponto':'Linha')+'<select id="favRef">'+ops+'</select></label>'+favCatsHTML(F.cat)+
    '<div class="row gbtns"><button type="button" class="copy primary" id="favSalvar">Salvar favorito</button><button type="button" class="copy" id="favCancela">Cancelar</button></div></div>';
}
function favCatsHTML(cat){
  return '<p class="balvo-t"><b>Categoria</b></p><div class="seg chips fav-cats" role="group" aria-label="Categoria">'+favCats().map(function(c){return '<button type="button" data-favcat="'+esc(c)+'" aria-pressed="'+(c===cat)+'">'+esc(c)+'</button>'}).join('')+'</div>'+
    '<label class="fld fav-nova">Ou crie uma<input type="text" id="favCatNova" maxlength="20" placeholder="Ex.: Academia"></label>';
}
function favHTML(){
  var L=favLista(),now=nowMin(),C=favCats().filter(function(c){return L.some(function(f){return f.cat===c})});
  if(FAV.filtro&&C.indexOf(FAV.filtro)<0)FAV.filtro='';
  var h='<div class="fav-box" id="favBox"><div class="fav-topo"><h3>Meus favoritos</h3>'+(!FAV.form&&L.length<FAV.max?'<button type="button" class="linkbtn" id="favNovo">Adicionar</button>':'')+'</div>';
  if(!L.length&&!FAV.form)h+='<p class="muted small keep">Guarde pontos e linhas que você usa em Casa, Trabalho, Estudos ou numa categoria sua. Toque na estrela no painel de um ponto ou de uma linha, ou em Adicionar.</p>';
  if(C.length>1)h+='<div class="seg chips fav-filtro" role="group" aria-label="Categoria"><button type="button" data-favf="" aria-pressed="'+!FAV.filtro+'">Todos</button>'+C.map(function(c){return '<button type="button" data-favf="'+esc(c)+'" aria-pressed="'+(FAV.filtro===c)+'">'+esc(c)+'</button>'}).join('')+'</div>';
  C.filter(function(c){return !FAV.filtro||c===FAV.filtro}).forEach(function(c){
    h+='<p class="fav-cat">'+esc(c)+'</p><ul class="fav-lista">'+L.filter(function(f){return f.cat===c}).map(function(f){return favItem(f,now)}).join('')+'</ul>'});
  if(FAV.form)h+=favFormHTML();
  return h+'</div>';
}
function favPinta(){
  if(typeof plan==='undefined'||!plan)return;var b=$('#favBox'),foco=document.activeElement&&b&&b.contains(document.activeElement)&&document.activeElement.tagName==='INPUT';if(foco)return;
  var t=document.createElement('div');t.innerHTML=favHTML();if(b){b.replaceWith(t.firstChild);return}
  plan.insertAdjacentElement('afterbegin',t.firstChild);
}
aoFazer('trajeto montado',favPinta);favPinta();/* Trajetos já foi montado antes desta parte carregar */
setInterval(function(){if(!document.hidden)favPinta()},30000);
/* ---------- capa: os 3 primeiros ---------- */
function favCapaHTML(){
  var L=favLista().slice(0,3);if(!L.length)return '';var now=nowMin();
  return '<div class="cv-favs"><p class="cv-fav-t">Favoritos</p>'+L.map(function(f){return '<button type="button" class="cv-aviso cv-fav" data-favir="'+esc(f.id)+'"><span class="grow"><b>'+esc(favNome(f))+'</b><small>'+favProx(f,now).replace(/<[^>]+>/g,'')+'</small></span></button>'}).join('')+'</div>';
}
/* ---------- abrir um favorito ---------- */
function favAbre(id){
  var f=favLista().filter(function(x){return x.id===id})[0];if(!f)return;
  var vai=function(){
    if(f.t==='p'){var p=alvPonto(f.ref);if(!p)return;setTab('trajeto');if(p.st){if(!state.layers.bus)setLayer('bus',$('#chBus'));select('stop',p.st,true)}else select('ext',p.gr,true);return}
    if(f.t==='i'){setTab('trajeto');if(!state.layers.bus)setLayer('bus',$('#chBus'));select('line',f.ref,true);return}
    setTab('trajeto');EXTSEL.g=null;EXTSEL.ln=f.ref;try{localStorage.setItem('cse-fold-ext','1')}catch(e){}extRepaint();var d=$('#fdExt');if(d){d.open=true;d.scrollIntoView({block:'start',behavior:'smooth'})}};
  if(cover&&!cover.hidden&&typeof closeCover==='function')closeCover(vai);else vai();
}
/* ---------- estrela nos painéis ---------- */
function favEstrela(t,ref){var f=favDe(t,ref);
  return '<div class="fav-estrela" id="favEstrela">'+(f?'<button type="button" class="copy fav-on" data-favdel="'+esc(f.id)+'"><span aria-hidden="true">★</span> Nos favoritos · '+esc(f.cat)+'</button>':
    FAV.sel&&FAV.sel.t===t&&FAV.sel.ref===ref?'<div class="fav-escolhe">'+favCatsHTML('')+'<div class="row gbtns"><button type="button" class="copy" id="favEstCancela">Cancelar</button></div></div>':
    '<button type="button" class="copy" data-favstar="'+t+'|'+esc(ref)+'"><span aria-hidden="true">☆</span> Favoritar</button>')+'</div>';
}
function favDoPainel(){var s=state.sel;if(!s)return null;
  if(s.kind==='stop'){var p=alvPontos().filter(function(x){return x.st===s.id})[0];return p?{t:'p',ref:p.k}:null}
  if(s.kind==='ext'){var q=alvPontos().filter(function(x){return x.gr===s.id})[0];return q?{t:'p',ref:q.k}:null}
  if(s.kind==='line'&&LINES[s.id])return {t:'i',ref:s.id};return null}
aoFazer('detalhe montado',function(){var d=favDoPainel();if(!d||!detail||$('#favEstrela'))return;var h=detail.querySelector('h2');
  if(h)h.insertAdjacentHTML('afterend',favEstrela(d.t,d.ref));else detail.insertAdjacentHTML('afterbegin',favEstrela(d.t,d.ref))});
function favEstrelaPinta(){var e=$('#favEstrela'),d=favDoPainel();if(e&&d){var t=document.createElement('div');t.innerHTML=favEstrela(d.t,d.ref);e.replaceWith(t.firstChild)}}
function favAdiciona(t,ref,cat){
  if(favLista().length>=FAV.max){gToast('Você já tem '+FAV.max+' favoritos. Tire um para guardar outro.');return false}
  if(favDe(t,ref)){gToast('Já está nos favoritos.');return false}
  CFG.favs=(CFG.favs||[]).concat([{id:'f'+Date.now().toString(36)+Math.floor(Math.random()*1e3).toString(36),t:t,ref:ref,cat:cat,ts:Date.now()}]);
  favGuarda();favPinta();gToast('Guardado em '+cat+'.');return true;
}
function favCatEscolhida(){var n=$('#favCatNova');return n&&n.value.trim()?n.value.trim().slice(0,20):''}
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;var b;
  if((b=t.closest('[data-favir]'))){favAbre(b.dataset.favir);return}
  if((b=t.closest('[data-favdel]'))){var id=b.dataset.favdel;CFG.favs=(CFG.favs||[]).map(function(f){return f.id===id?{id:id,x:1,ts:Date.now()}:f});favGuarda();favPinta();favEstrelaPinta();gToast('Tirado dos favoritos.');return}
  if((b=t.closest('[data-favstar]'))){var p=b.dataset.favstar.split('|');FAV.sel={t:p[0],ref:p.slice(1).join('|')};favEstrelaPinta();return}
  if(t.closest('#favEstCancela')){FAV.sel=null;favEstrelaPinta();return}
  if((b=t.closest('[data-favcat]'))){var c=b.dataset.favcat;
    if(b.closest('#favEstrela')&&FAV.sel){if(favAdiciona(FAV.sel.t,FAV.sel.ref,c))FAV.sel=null;favEstrelaPinta();return}
    if(FAV.form){FAV.form.cat=c;favPinta()}return}
  if(t.closest('#favNovo')){FAV.form={t:'p',ref:'',cat:'Casa'};favPinta();return}
  if((b=t.closest('[data-favt]'))){FAV.form.t=b.dataset.favt;FAV.form.ref='';favPinta();return}
  if(t.closest('#favCancela')){FAV.form=null;favPinta();return}
  if(t.closest('#favSalvar')){var F=FAV.form,r=$('#favRef');if(!r||!r.value)return;var cat=favCatEscolhida()||F.cat||'Casa';if(favAdiciona(F.t,r.value,cat)){FAV.form=null;favPinta()}return}
  if((b=t.closest('[data-favf]'))){FAV.filtro=b.dataset.favf;favPinta();return}
});
document.addEventListener('change',function(e){if(e.target.id==='favRef'&&FAV.form)FAV.form.ref=e.target.value});
/* categoria nova digitada na estrela: Enter guarda */
document.addEventListener('keydown',function(e){if(e.key!=='Enter'||e.target.id!=='favCatNova')return;e.preventDefault();var c=favCatEscolhida();if(!c)return;
  if(e.target.closest('#favEstrela')&&FAV.sel){if(favAdiciona(FAV.sel.t,FAV.sel.ref,c))FAV.sel=null;favEstrelaPinta()}
  else if(FAV.form){FAV.form.cat=c;var r=$('#favRef');if(r&&r.value&&favAdiciona(FAV.form.t,r.value,c)){FAV.form=null;favPinta()}}});
