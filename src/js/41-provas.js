/* ======================= Minhas provas (aba Calendário) =======================
   O aluno anota as datas das provas e entregas: disciplina, o que é (P1, trabalho…), data, horário e local (opcionais).
   Aparecem no Calendário, logo abaixo do andamento do período, com a contagem regressiva; as que já passaram ficam
   recolhidas. Guardadas nos ajustes (CFG.provas): no aparelho e, com conta, em qualquer aparelho. Apagar deixa uma
   marca ({id, x:1}) para a prova não voltar quando a conta junta as listas de dois aparelhos (prvJunta). */
var PRV={form:false,edit:'',msg:'',max:60};
function prvLista(){return (Array.isArray(CFG.provas)?CFG.provas:[]).filter(function(p){return p&&!p.x&&p.d})}
function prvGuarda(){
  var L=(CFG.provas||[]).slice(),hoje=isoToday();
  /* limite: sai primeiro o que já passou há mais tempo e as marcas de apagado */
  if(L.length>PRV.max)L=L.sort(function(a,b){return (a.x?0:1)-(b.x?0:1)||(a.d<b.d?-1:1)}).slice(L.length-PRV.max);
  CFG.provas=L;saveCfg();
}
/* junta a lista vinda da conta com a deste aparelho; devolve true se mudou algo aqui */
function prvJunta(R){
  var M={},mudou=false;(CFG.provas||[]).forEach(function(p){if(p&&p.id)M[p.id]=p});
  R.forEach(function(p){if(!p||!p.id)return;var a=M[p.id];
    if(!a){M[p.id]=p;mudou=true}else if(p.x&&!a.x){M[p.id]=p;mudou=true}else if(!a.x&&!p.x&&(p.t||0)>(a.t||0)){M[p.id]=p;mudou=true}});
  if(mudou){CFG.provas=Object.keys(M).map(function(k){return M[k]});if(typeof prvPinta==='function')setTimeout(prvPinta,0)}
  return mudou;
}
function prvQuando(p){
  var t=today0(),n=dDiff(dParse(p.d),t);
  if(n<0)return {c:'past',p:'<span class="pill bad">Já foi</span>'};
  if(n===0)return {c:'now',p:'<span class="pill good">Hoje'+(p.h?' às '+p.h:'')+'</span>'};
  return {c:'soon',p:'<span class="pill warn">'+(n===1?'Amanhã':'Em '+n+' dias')+'</span>'};
}
function prvLinha(p){
  var q=prvQuando(p);
  return '<div class="cal-ev prv-ev '+q.c+'"><span class="cal-d mono">'+dTxt(p.d)+(p.h?' · '+p.h:'')+'</span><span class="grow"><b>'+esc(p.n)+(p.o?' · '+esc(p.o):'')+'</b>'+(p.l?'<span class="prv-l">'+esc(p.l)+'</span>':'')+'</span>'+q.p+
    '<span class="prv-acoes"><button type="button" class="linkbtn" data-prved="'+esc(p.id)+'">Editar</button><button type="button" class="alv-x" data-prvdel="'+esc(p.id)+'" aria-label="Apagar esta prova">×</button></span></div>';
}
function prvFormHTML(){
  var p=PRV.edit?prvLista().filter(function(x){return x.id===PRV.edit})[0]||{}:{};
  var nomes=[];(typeof GRADE!=='undefined'&&GRADE||[]).forEach(function(a){if(a&&a.nome&&nomes.indexOf(a.nome)<0)nomes.push(a.nome)});
  return '<form class="gform prv-form" id="prvForm" novalidate>'+
    '<label class="fld">Disciplina<input type="text" id="prvN" maxlength="50" required list="prvNomes" value="'+esc(p.n||'')+'" placeholder="Ex.: Cálculo I"></label>'+
    (nomes.length?'<datalist id="prvNomes">'+nomes.map(function(n){return '<option value="'+esc(n)+'">'}).join('')+'</datalist>':'')+
    '<label class="fld">O que é (opcional)<input type="text" id="prvO" maxlength="30" value="'+esc(p.o||'')+'" placeholder="Ex.: P1, trabalho, segunda chamada"></label>'+
    '<div class="g2"><label class="fld">Data<input type="date" id="prvD" required value="'+esc(p.d||'')+'"></label><label class="fld">Horário (opcional)<input type="time" id="prvH" value="'+esc(p.h||'')+'"></label></div>'+
    '<label class="fld">Local (opcional)<input type="text" id="prvL" maxlength="40" value="'+esc(p.l||'')+'" placeholder="Ex.: CT, bloco A, sala 210"></label>'+
    '<p class="gerr" id="prvErr" role="alert"></p>'+
    '<div class="row gbtns"><button type="submit" class="copy primary">'+(PRV.edit?'Salvar alterações':'Salvar prova')+'</button><button type="button" class="copy" id="prvCancela">Cancelar</button></div></form>';
}
function prvHTML(){
  var L=prvLista().sort(function(a,b){return a.d<b.d?-1:a.d>b.d?1:(a.h||'')<(b.h||'')?-1:1}),hoje=isoToday();
  var vem=L.filter(function(p){return p.d>=hoje}),foi=L.filter(function(p){return p.d<hoje}).reverse();
  var h='<div class="prv" id="prvBox"><h3>Minhas provas</h3>';
  if(vem.length)h+='<div class="cal-list">'+vem.map(prvLinha).join('')+'</div>';
  else if(!PRV.form)h+='<p class="muted small keep">Anote aqui as datas das suas provas e entregas. Elas ficam salvas'+(typeof contaOk==='function'&&contaOk()?' na sua conta.':' neste aparelho (e na sua conta, se você entrar).')+'</p>';
  if(PRV.form)h+=prvFormHTML();
  else h+='<div class="row gbtns"><button type="button" class="copy" id="prvNova">Adicionar prova</button></div>';
  if(foi.length)h+='<details class="prv-foi"><summary>Provas que já passaram ('+foi.length+')</summary><div class="cal-list">'+foi.map(prvLinha).join('')+'</div></details>';
  if(PRV.msg)h+='<p class="muted small keep" role="status">'+esc(PRV.msg)+'</p>';
  return h+'</div>';
}
function prvPinta(){
  if(typeof cL==='undefined'||!cL)return;var b=$('#prvBox'),aberto=b&&b.querySelector('.prv-foi[open]');
  var tmp=document.createElement('div');tmp.innerHTML=prvHTML();var n=tmp.firstChild;if(aberto){var d=n.querySelector('.prv-foi');if(d)d.open=true}
  if(b){b.replaceWith(n);return}
  var ref=cL.querySelector('.next.lastbig');if(ref)ref.insertAdjacentElement('afterend',n);else cL.appendChild(n);
}
function prvSalva(){
  var n=$('#prvN').value.trim(),o=$('#prvO').value.trim(),d=$('#prvD').value,h=$('#prvH').value,l=$('#prvL').value.trim(),err=$('#prvErr');
  if(!n){err.textContent='Escreva o nome da disciplina.';$('#prvN').focus();return}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){err.textContent='Escolha a data.';$('#prvD').focus();return}
  var p={id:PRV.edit||'p'+Date.now().toString(36)+Math.floor(Math.random()*1e3).toString(36),n:n.slice(0,50),o:o.slice(0,30),d:d,h:/^\d{2}:\d{2}$/.test(h)?h:'',l:l.slice(0,40),t:Date.now()};
  var L=(CFG.provas||[]).filter(function(x){return x.id!==p.id});L.push(p);CFG.provas=L;
  var foi=d<isoToday();PRV.form=false;PRV.edit='';PRV.msg=foi?'Prova salva. A data já passou: ela está em "Provas que já passaram".':'';
  prvGuarda();prvPinta();gToast('Prova salva.');
}
document.addEventListener('click',function(e){var t=e.target;if(!t.closest||!t.closest('#prvBox'))return;var b;
  if(t.closest('#prvNova')){PRV.form=true;PRV.edit='';PRV.msg='';prvPinta();var i=$('#prvN');if(i)i.focus();return}
  if(t.closest('#prvCancela')){PRV.form=false;PRV.edit='';prvPinta();return}
  if((b=t.closest('[data-prved]'))){PRV.form=true;PRV.edit=b.dataset.prved;PRV.msg='';prvPinta();var j=$('#prvN');if(j)j.focus();return}
  if((b=t.closest('[data-prvdel]'))){var id=b.dataset.prvdel;CFG.provas=(CFG.provas||[]).map(function(p){return p.id===id?{id:id,x:1,t:Date.now()}:p});
    if(PRV.edit===id){PRV.form=false;PRV.edit=''}PRV.msg='';prvGuarda();prvPinta();gToast('Prova apagada.');return}
});
document.addEventListener('submit',function(e){if(e.target.id!=='prvForm')return;e.preventDefault();prvSalva()});
prvPinta();/* o Calendário pode já estar aberto antes desta parte carregar */
