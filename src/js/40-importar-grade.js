/* ======================= Importar a grade horária (PDF) =======================
   Na aba Grade: "Importar do PDF" lê o PDF "Minha grade horária" (portal da UFRJ) neste aparelho, mostra o que achou
   (disciplina, dias e horário) para o aluno conferir, escolher prédio, bloco e sala, e põe na grade.
   - O PDF não sai do aparelho; só as aulas escolhidas entram na grade. Nome do aluno, matrícula e professores não são guardados.
   - O leitor de PDF (pdf.js 3.11.174, cdnjs) é baixado só na primeira vez que o aluno escolhe um arquivo.
   - igLer(itens) é a parte que entende a tabela: recebe os pedaços de texto com posição ({s, x, y}) e devolve as aulas.
     As colunas vêm da linha de títulos (Turma, Código, Nome da Turma, C.H. semanal, Créditos, Dia, Horário, Professor(a));
     uma linha com código abre uma disciplina e as linhas seguintes só com dia e horário são outros dias dela. */
var IG={url:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/',busy:false,msg:'',folha:null,res:null,lib:null};
var IG_DIA={segunda:1,terca:2,quarta:3,quinta:4,sexta:5,sabado:6,domingo:0};
function igSemAcento(t){return String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim()}
function igPad(n){return (n<10?'0':'')+n}
/* junta os pedaços de texto em linhas (mesma altura, com folga de 3,5 pt) e ordena da esquerda para a direita */
/* junta os pedaços de texto em linhas (mesma altura, com folga de 3,5 pt), da esquerda para a direita; pedaços colados
   (o PDF às vezes corta palavras) viram um só */
function igLinhas(itens){
  var I=itens.filter(function(i){return i&&String(i.s).trim()}).sort(function(a,b){return a.y-b.y||a.x-b.x}),L=[];
  I.forEach(function(i){var l=L[L.length-1];if(l&&Math.abs(i.y-l.y)<=3.5)l.t.push(i);else L.push({y:i.y,t:[i]})});
  L.forEach(function(l){l.t.sort(function(a,b){return a.x-b.x});var R=[];
    l.t.forEach(function(t){var u=R[R.length-1],s=String(t.s);
      if(u&&u.w&&Math.abs(t.x-(u.x+u.w))<1.2&&!/\s$/.test(u.s)&&!/^\s/.test(s)){u.s+=s;u.w=t.w?t.x+t.w-u.x:0}
      else R.push({s:s,x:t.x,w:t.w||0})});
    R.forEach(function(r){r.s=r.s.replace(/\s+/g,' ').trim()});l.t=R.filter(function(r){return r.s})});
  return L.filter(function(l){return l.t.length});
}
function igJunta(T){return T.map(function(t){return t.s}).join(' ').replace(/\s+/g,' ').trim()}
/* o texto que está logo abaixo de um título (Centro, Unidade, Curso) */
function igAbaixo(L,rotulo){
  for(var i=0;i<L.length;i++){var r=L[i].t.filter(function(t){return igSemAcento(t.s)===igSemAcento(rotulo)})[0];if(!r)continue;
    for(var j=i+1;j<L.length&&j<=i+2;j++){var v=L[j].t.filter(function(t){return t.x>=r.x-8});if(v.length&&Math.abs(v[0].x-r.x)<=8)return igJunta(v)}}
  return '';
}
function igLer(itens){
  var L=igLinhas(itens),R={ok:false,motivo:'',periodo:'',centro:'',unidade:'',curso:'',aulas:[],semHorario:[]};
  var todo=igSemAcento(L.map(function(l){return igJunta(l.t)}).join(' '));
  if(todo.indexOf('minha grade horaria')<0){R.motivo='nao-e-grade';return R}
  var mp=/para\s+(\d{4}\/\d)/.exec(todo);R.periodo=mp?mp[1]:'';
  R.centro=igAbaixo(L,'Centro');R.unidade=igAbaixo(L,'Unidade');R.curso=igAbaixo(L,'Curso');
  /* a linha de títulos da tabela */
  var h=-1;for(var i=0;i<L.length;i++){var tx=igSemAcento(igJunta(L[i].t));if(/turma/.test(tx)&&/codigo/.test(tx)&&/horario/.test(tx)){h=i;break}}
  if(h<0){R.motivo='sem-tabela';return R}
  var C={};L[h].t.forEach(function(t){var s=igSemAcento(t.s);
    if(s==='turma'&&C.turma==null)C.turma=t.x;else if(s==='codigo')C.cod=t.x;else if(s==='nome'||s==='nome da turma')C.nome=C.nome==null?t.x:C.nome;
    else if(/^c\.?h\./.test(s))C.ch=t.x;else if(s==='creditos')C.cred=t.x;else if(s==='dia')C.dia=t.x;else if(s==='horario')C.hor=t.x;else if(/^professor/.test(s))C.prof=t.x});
  if(C.cod==null||C.dia==null||C.hor==null||C.nome==null){R.motivo='sem-tabela';return R}
  var cols=Object.keys(C).map(function(k){return {k:k,x:C[k]}}).sort(function(a,b){return a.x-b.x});
  var colDe=function(x){var c=null;cols.forEach(function(q){if(q.x<=x+5)c=q.k});return c||cols[0].k};
  var cur=null,D=[];
  for(i=h+1;i<L.length;i++){
    var cel={};L[i].t.forEach(function(t){var k=colDe(t.x);cel[k]=(cel[k]?cel[k]+' ':'')+String(t.s).trim()});
    if(/^total/.test(igSemAcento(L[i].t.map(function(t){return t.s}).join(' ')))){break}
    var cod=(cel.cod||'').replace(/\s+/g,'');
    if(/^[A-Z0-9]{4,10}$/.test(cod)){
      cur={turma:cel.turma||'',cod:cod,nome:(cel.nome||'').replace(/\s+/g,' ').trim(),ch:cel.ch||'',cred:cel.cred||'',prof:cel.prof||'',h:[]};D.push(cur);
    }else if(cur&&!cel.dia&&!cel.hor){/* continuação de nome comprido */
      if(cel.nome)cur.nome=(cur.nome+' '+cel.nome).replace(/\s+/g,' ').trim();continue}
    if(!cur)continue;
    var dia=IG_DIA[igSemAcento(cel.dia||'')],m=/(\d{1,2}):(\d{2})\s*as\s*(\d{1,2}):(\d{2})/.exec(igSemAcento(cel.hor||''));
    if(dia!=null&&m)cur.h.push({dia:dia,ini:igPad(+m[1])+':'+m[2],fim:igPad(+m[3])+':'+m[4]});
  }
  D.forEach(function(d){
    if(!d.h.length){R.semHorario.push(d.nome);return}
    var G={};d.h.forEach(function(x){var k=x.ini+'|'+x.fim;(G[k]=G[k]||{ini:x.ini,fim:x.fim,dias:[]}).dias.push(x.dia)});
    Object.keys(G).forEach(function(k){var g=G[k];g.dias=g.dias.filter(function(v,j,A){return A.indexOf(v)===j}).sort(function(a,b){return a-b});
      R.aulas.push({turma:d.turma,cod:d.cod,nome:d.nome.slice(0,50),dias:g.dias,ini:g.ini,fim:g.fim})})
  });
  if(!R.aulas.length){R.motivo='sem-aulas';return R}
  R.ok=true;return R;
}
/* prédio e bloco sugeridos pelo centro e pela unidade do aluno (dá para trocar antes de importar) */
function igSugestao(R){
  var t=igSemAcento(R.centro+' '+R.unidade);
  if(/instituto de (computacao|matematica)/.test(t))return {bld:'ccmn',b:'C'};
  if(/matematicas e da natureza/.test(t))return {bld:'ccmn',b:GBLK.ccmn[0]};
  if(/tecnologia|politecnica|escola de quimica/.test(t))return {bld:'ct',b:GBLK.ct[0]};
  return {bld:'outro',b:''};
}
/* ---------- leitor de PDF ---------- */
function igCarrega(){
  if(IG.lib)return Promise.resolve(IG.lib);
  return new Promise(function(ok,nao){
    if(window.pdfjsLib)return ok(window.pdfjsLib);
    var s=document.createElement('script');s.src=IG.url+'pdf.min.js';s.onload=function(){window.pdfjsLib?ok(window.pdfjsLib):nao(new Error('leitor'))};s.onerror=function(){nao(new Error('leitor'))};document.head.appendChild(s);
  }).then(function(lib){
    /* o worker vem de outro endereço: baixa e usa por um blob (um Worker precisa ser do mesmo site) */
    return fetch(IG.url+'pdf.worker.min.js').then(function(r){if(!r.ok)throw new Error('leitor');return r.blob()}).then(function(b){lib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(b);IG.lib=lib;return lib});
  });
}
function igTexto(buf){
  return igCarrega().then(function(lib){return lib.getDocument({data:buf}).promise}).then(function(doc){
    var P=[];for(var n=1;n<=Math.min(doc.numPages,5);n++)P.push(doc.getPage(n).then(function(pg){return pg.getTextContent().then(function(c){return {pg:pg.pageNumber,c:c,vp:pg.getViewport({scale:1})}})}));
    return Promise.all(P)}).then(function(R){var itens=[],U=IG.lib.Util;
      /* posição na página como ela aparece (o PDF do portal vem em pé, girado 90°): a matriz da vista resolve o giro */
      R.forEach(function(p){p.c.items.forEach(function(it){if(!it.str||!it.transform)return;var m=U.transform(p.vp.transform,it.transform);
        itens.push({s:it.str,x:m[4],y:m[5]+p.pg*10000,w:it.width||0})})});return itens});
}
function igAbrePdf(arq){
  if(IG.busy||!arq)return;
  if(arq.size>5*1024*1024){IG.msg='Esse arquivo é grande demais para ser a grade horária.';igPinta();return}
  IG.busy=true;IG.msg='';igPinta();
  arq.arrayBuffer().then(igTexto).then(function(itens){
    if(!itens.length)throw new Error('sem-texto');var R=igLer(itens);if(!R.ok)throw new Error(R.motivo);return R})
  .then(function(R){IG.res=R;igFolha(R)})
  .catch(function(e){var m=String(e&&e.message||e);
    IG.msg=m==='leitor'?'Não consegui carregar o leitor de PDF. Confira a conexão e tente de novo.':m==='sem-texto'?'Esse PDF não tem texto para ler (parece uma imagem). Baixe de novo o PDF no portal.':m==='nao-e-grade'||m==='sem-tabela'?'Não parece a "Minha grade horária" da UFRJ. Baixe o PDF no portal e tente de novo.':m==='sem-aulas'?'Não achei disciplinas com dia e horário nesse PDF.':'Não deu para ler esse PDF. Tente de novo.'})
  .then(function(){IG.busy=false;igPinta()});
}
/* ---------- tela ---------- */
function igBotao(){
  if(!IG||semConta())return '';
  return '<div class="ig-box" id="igBox"><button type="button" class="copy ig-btn" id="igAbrir"'+(IG.busy?' disabled':'')+'>'+(IG.busy?'Lendo o PDF…':'Importar do PDF')+'</button>'+
    '<p class="muted small keep">Use o PDF "Minha grade horária" do portal da UFRJ. Ele é lido aqui no aparelho.</p>'+(IG.msg?'<p class="alv-aviso ig-msg" role="status">'+esc(IG.msg)+'</p>':'')+'</div>';
}
function igPinta(){var b=$('#igBox');if(b)b.outerHTML=igBotao()}
function igDiasTxt(a){return a.dias.map(function(d){return DIAS[d]}).join(', ')}
function igFolhaHTML(R){
  var sug=igSugestao(R);
  var lista=R.aulas.map(function(a,i){
    var ops=['ct','ccmn','outro'].map(function(b){return '<option value="'+b+'"'+(b===sug.bld?' selected':'')+'>'+(b==='ct'?'CT':b==='ccmn'?'CCMN':'Outro')+'</option>'}).join('');
    var bl=(sug.bld==='ct'?GBLK.ct:GBLK.ccmn).map(function(b){return '<option'+(b===sug.b?' selected':'')+'>'+b+'</option>'}).join('');
    return '<li class="ig-it"><label class="ig-ck"><input type="checkbox" data-igi="'+i+'" checked><span class="grow"><b>'+esc(a.nome)+'</b><small>'+esc(igDiasTxt(a))+' · '+a.ini+'–'+a.fim+' · '+esc(a.cod)+'</small></span></label>'+
      '<div class="ig-loc"><select data-igb="'+i+'" aria-label="Prédio">'+ops+'</select><select data-igbl="'+i+'" aria-label="Bloco"'+(sug.bld==='outro'?' hidden':'')+'>'+bl+'</select><input type="text" data-igs="'+i+'" maxlength="10" placeholder="Sala" aria-label="Sala"></div></li>'}).join('');
  return '<div class="inst-topo"><div><h2 id="igT">Importar grade horária</h2><p class="inst-sub">'+(R.periodo?esc(R.periodo)+' · ':'')+R.aulas.length+' aulas encontradas</p></div></div>'+
    '<p class="inst-dica">Confira e escolha onde cada aula acontece. O PDF não sai do seu aparelho.</p>'+
    '<ul class="ig-lista">'+lista+'</ul>'+
    (R.semHorario.length?'<p class="muted small keep">Sem dia e horário (não entram na grade): '+esc(R.semHorario.join(', '))+'.</p>':'')+
    '<p class="ig-err" id="igErr" role="alert"></p>'+
    '<div class="inst-acoes inst-fim"><button type="button" class="linkbtn" id="igCancela">Cancelar</button><button type="button" class="copy primary" id="igOk">Importar</button></div>';
}
function igFolha(R){
  igFecha();
  document.body.insertAdjacentHTML('beforeend','<div class="inst-fundo" id="igFundo"></div><div class="inst-folha ig-folha" id="igFolha" role="dialog" aria-modal="true" aria-labelledby="igT">'+igFolhaHTML(R)+'</div>');
  IG.folha=true;requestAnimationFrame(function(){var f=$('#igFolha');if(f){f.classList.add('on');$('#igFundo').classList.add('on')}});
}
function igFecha(){var f=$('#igFolha'),g=$('#igFundo');if(f)f.remove();if(g)g.remove();IG.folha=null}
function igImporta(){
  var R=IG.res;if(!R)return;var novas=[],dup=0,F=$('#igFolha');
  R.aulas.forEach(function(a,i){
    var ck=F.querySelector('[data-igi="'+i+'"]');if(!ck||!ck.checked)return;
    if((GRADE||[]).some(function(x){return x.cod&&x.cod===a.cod&&x.ini===a.ini&&String(x.dias)===String(a.dias)})){dup++;return}
    var bld=F.querySelector('[data-igb="'+i+'"]').value,bl=F.querySelector('[data-igbl="'+i+'"]').value,sala=F.querySelector('[data-igs="'+i+'"]').value.trim().slice(0,10);
    novas.push({id:'a'+Date.now().toString(36)+i,nome:a.nome,bld:bld,b:bld==='outro'?'':bl,stop:'',sala:sala,andar:null,dias:a.dias,ini:a.ini,fim:a.fim,cod:a.cod,turma:a.turma});
  });
  var err=$('#igErr');
  if(!novas.length){err.textContent=dup?'Essas aulas já estão na sua grade.':'Marque pelo menos uma aula.';return}
  if((GRADE||[]).length+novas.length>40){err.textContent='A grade guarda até 40 aulas. Desmarque algumas.';return}
  if(!GRADE)GRADE=[];GRADE=GRADE.concat(novas);saveGrade();syncAulas();
  igFecha();IG.res=null;renderGrade();
  gToast(novas.length+(novas.length>1?' aulas importadas.':' aula importada.')+(dup?' '+dup+' já estava'+(dup>1?'m':'')+' na grade.':''));
}
var igArq=document.createElement('input');igArq.type='file';igArq.accept='application/pdf,.pdf';igArq.hidden=true;igArq.id='igArq';document.body.appendChild(igArq);
igArq.addEventListener('change',function(){var a=igArq.files&&igArq.files[0];igArq.value='';if(a)igAbrePdf(a)});
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;
  if(t.closest('#igAbrir')){igArq.click();return}
  if(t.closest('#igCancela')||t.closest('#igFundo')){igFecha();return}
  if(t.closest('#igOk')){igImporta();return}
});
document.addEventListener('change',function(e){var t=e.target;if(!t.dataset||t.dataset.igb==null)return;
  var i=t.dataset.igb,bl=document.querySelector('[data-igbl="'+i+'"]');if(!bl)return;
  if(t.value==='outro'){bl.hidden=true;return}
  bl.hidden=false;bl.innerHTML=GBLK[t.value].map(function(b){return '<option>'+b+'</option>'}).join('');
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&IG.folha)igFecha()});
renderGrade();/* a grade já foi desenhada uma vez antes desta parte carregar: ganha o botão */
