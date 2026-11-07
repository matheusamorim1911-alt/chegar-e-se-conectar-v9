/* ---------- avisar alguém: mensagem pronta com ônibus, horário e chegada ---------- */
var WS={tpl:'saindo',safe:true,open:false,edited:{}};
var WTPL=[['saindo','Estou saindo'],['cheguei','Cheguei'],['atraso','Ônibus atrasou']];
function warnText(c,tpl,safe){
  var from=STOPS[c.from].name,to=STOPS[c.to].name;
  if(tpl==='cheguei')return 'Cheguei bem em '+to+'.';
  if(tpl==='atraso')return 'O circular atrasou. Ainda estou em '+from+' (UFRJ, Fundão) e te aviso quando embarcar.';
  var t='Oi! Vou pegar a Linha '+c.lid+' da UFRJ ('+LINES[c.lid].name+') '+atTxt(c.dep)+' em '+from+', na Ilha do Fundão. Devo chegar em '+to+' '+(CFG.faixa?atTxt(c.arr):'por volta de '+fmt(c.arr))+'.';
  return t+(safe?' Se eu não der notícia até '+fmt(c.arr+15)+', me liga. Se eu não atender, avisa a segurança da UFRJ (DISEG): (21) 97380-2554.':' Te aviso quando chegar.');
}
function warnHTML(c,key,open){
  if(!c||!c.lid)return '';
  var txt=WS.edited[key]&&WS.edited[key].tpl===WS.tpl&&WS.edited[key].safe===WS.safe?WS.edited[key].txt:warnText(c,WS.tpl,WS.safe);
  var body='<div class="warn" data-wkey="'+key+'">'+
    '<div class="chips" role="group" aria-label="Tipo de mensagem">'+WTPL.map(function(t){return '<button class="chip" type="button" data-wt="'+t[0]+'" aria-pressed="'+(WS.tpl===t[0])+'">'+t[1]+'</button>'}).join('')+'</div>'+
    (WS.tpl==='saindo'?'<label class="wsafe"><input type="checkbox" id="wsafe-'+key+'" data-wsafe'+(WS.safe?' checked':'')+'> Pedir para me ligarem se eu não der notícia até '+fmt(c.arr+15)+'</label>':'')+
    '<label class="fld">Mensagem (pode editar)<textarea id="wtxt-'+key+'" class="wtxt" rows="5" maxlength="600">'+esc(txt)+'</textarea></label>'+
    '<div class="later"><button class="copy" type="button" data-wcopy="'+key+'">Copiar mensagem</button><a class="copy wa" href="https://wa.me/?text='+encodeURIComponent(txt)+'" target="_blank" rel="noopener" data-wa="'+key+'">Abrir no WhatsApp</a></div>'+
    '<p class="muted small">A página não envia nada sozinha: você escolhe para quem mandar no WhatsApp ou cola em outro app.</p></div>';
  return '<details class="det wdet" id="wdet-'+key+'"'+(WS.open?' open':'')+'><summary><span class="wdet-t"><b>Avisar alguém</b><small>Mensagem pronta com o ônibus e a hora de chegada</small></span></summary>'+body+'</details>';
}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-wt],[data-wcopy]');if(!t)return;
  if(t.dataset.wt){WS.tpl=t.dataset.wt;WS.open=true;var w=t.closest('[data-wkey]'),k=w&&w.dataset.wkey;renderAll();var b=document.querySelector('[data-wkey="'+k+'"] [data-wt="'+WS.tpl+'"]');if(b)b.focus({preventScroll:true});return}
  var ta=document.getElementById('wtxt-'+t.dataset.wcopy);if(!ta)return;
  var lab=t.textContent;
  function done(ok){t.textContent=ok?'Copiada':'Selecione e copie';setTimeout(function(){t.textContent=lab},1600)}
  try{navigator.clipboard.writeText(ta.value).then(function(){done(true)},function(){ta.focus();ta.select();done(false)})}catch(err){ta.focus();ta.select();done(false)}
});
document.addEventListener('change',function(e){
  if(e.target.hasAttribute&&e.target.hasAttribute('data-wsafe')){WS.safe=e.target.checked;WS.open=true;var id=e.target.id;renderAll();var el=document.getElementById(id);if(el)el.focus({preventScroll:true})}
});
document.addEventListener('input',function(e){
  if(!e.target.classList||!e.target.classList.contains('wtxt'))return;
  var w=e.target.closest('[data-wkey]'),k=w.dataset.wkey;
  WS.edited[k]={txt:e.target.value,tpl:WS.tpl,safe:WS.safe};
  var a=w.querySelector('[data-wa]');if(a)a.href='https://wa.me/?text='+encodeURIComponent(e.target.value);
});
document.addEventListener('toggle',function(e){if(e.target.id&&e.target.id.indexOf('wdet-')===0)WS.open=e.target.open},true);
/* ---------- calendário acadêmico (graduação 2026; datas iguais nos calendários do IE e da FND/UFRJ) ---------- */
var CAL={
  '2026.1':[
    {a:'2026-02-23',b:'2026-03-02',t:'Inscrição em disciplinas',d:'Pelo Portal do Aluno (SIGA): obrigatórias e eletivas.',k:'prazo'},
    {a:'2026-03-07',t:'Resultado da inscrição (1ª CRID)',d:'Confira e salve o comprovante. Algumas unidades liberam a partir de 05/03.',k:'info'},
    {a:'2026-03-09',t:'Início das aulas',d:'Primeiro dia do período 2026.1.',k:'marco'},
    {a:'2026-03-09',b:'2026-03-23',t:'Inclusão e exclusão de disciplinas',d:'Ajuste da inscrição pelo Portal do Aluno.',k:'prazo'},
    {a:'2026-03-28',t:'Resultado das alterações (2ª CRID)',d:'Algumas unidades liberam a partir de 26/03.',k:'info'},
    {a:'2026-03-30',b:'2026-04-07',t:'Trancamento de disciplinas',d:'Pelo Portal do Aluno.',k:'prazo'},
    {a:'2026-03-09',b:'2026-05-04',t:'Trancamento de matrícula',d:'Pedido feito na coordenação do seu curso.',k:'prazo'},
    {a:'2026-07-18',t:'Fim do período',d:'Último dia do período 2026.1.',k:'marco'}
  ],
  '2026.2':[
    {a:'2026-07-24',b:'2026-08-03',t:'Inscrição em disciplinas',d:'Pelo Portal do Aluno (SIGA): obrigatórias e eletivas.',k:'prazo'},
    {a:'2026-08-08',t:'Resultado da inscrição (1ª CRID)',d:'Confira e salve o comprovante. Algumas unidades liberam a partir de 06/08.',k:'info'},
    {a:'2026-08-10',t:'Início das aulas',d:'Primeiro dia do período 2026.2.',k:'marco'},
    {a:'2026-08-10',b:'2026-08-21',t:'Inclusão e exclusão de disciplinas',d:'Ajuste da inscrição pelo Portal do Aluno.',k:'prazo'},
    {a:'2026-08-29',t:'Resultado das alterações (2ª CRID)',d:'Algumas unidades liberam a partir de 27/08.',k:'info'},
    {a:'2026-08-31',b:'2026-09-10',t:'Trancamento de disciplinas',d:'Pelo Portal do Aluno.',k:'prazo'},
    {a:'2026-08-10',b:'2026-09-28',t:'Trancamento de matrícula',d:'Pedido feito na coordenação do seu curso.',k:'prazo'},
    {a:'2026-12-19',t:'Fim do período',d:'Último dia do período 2026.2.',k:'marco'}
  ]
};
var FERIADOS=[['2026-02-16','Carnaval (segunda)'],['2026-02-17','Carnaval (terça)'],['2026-04-03','Sexta-feira Santa'],['2026-04-21','Tiradentes'],['2026-04-23','São Jorge (feriado no estado do RJ)'],['2026-05-01','Dia do Trabalho'],['2026-06-04','Corpus Christi'],['2026-09-07','Independência'],['2026-10-12','Nossa Senhora Aparecida'],['2026-11-02','Finados'],['2026-11-15','Proclamação da República'],['2026-11-20','Consciência Negra'],['2026-12-25','Natal']];
var PER={'2026.1':['2026-03-09','2026-07-18'],'2026.2':['2026-08-10','2026-12-19']};
var cs={per:null};
function dParse(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function today0(){var d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function dDiff(a,b){return Math.round((a-b)/86400000)}
var MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'],SEM=['dom','seg','ter','qua','qui','sex','sáb'];
function dTxt(s){var d=dParse(s);return SEM[d.getDay()]+', '+d.getDate()+' '+MES[d.getMonth()]}
function curPer(){var t=today0(),r=null;Object.keys(PER).forEach(function(k){if(t>=dParse(PER[k][0])&&t<=dParse(PER[k][1]))r=k});if(r)return r;var nxt=Object.keys(PER).filter(function(k){return dParse(PER[k][0])>t})[0];return nxt||'2026.2'}
function evStatus(e){
  var t=today0(),a=dParse(e.a),b=dParse(e.b||e.a);
  if(t>b)return {c:'past',p:'<span class="pill bad">Encerrado</span>'};
  if(t>=a){var left=dDiff(b,t);return {c:'now',p:'<span class="pill good">'+(e.b?(left===0?'Último dia hoje':'Aberto · faltam '+left+' dia'+(left>1?'s':'')):'Hoje')+'</span>'}}
  var n=dDiff(a,t);return {c:'soon',p:'<span class="pill warn">'+(n===1?'Amanhã':'Em '+n+' dias')+'</span>'};
}
function calHTML(){
  var t=today0(),cur=curPer(),per=cs.per||cur,ev=CAL[per];
  var a=dParse(PER[cur][0]),b=dParse(PER[cur][1]),tot=dDiff(b,a),done=Math.max(0,Math.min(tot,dDiff(t,a))),pct=Math.round(done/tot*100);
  var inP=t>=a&&t<=b;
  var head='<div class="next lastbig"><p class="eyebrow">Hoje, '+dTxt(t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0'))+'</p>'+
    '<h3 class="plc-t">'+(inP?'Período '+cur+' em andamento':'Próximo período: '+cur)+'</h3>'+
    (inP?'<div class="progress" aria-label="'+pct+'% do período"><i style="width:'+pct+'%"></i></div><p class="small"><b>'+pct+'%</b> do período concluído · faltam <b>'+dDiff(b,t)+' dias</b> para o fim ('+dTxt(PER[cur][1])+').</p>':'<p class="small">As aulas começam em '+dTxt(PER[cur][0])+'.</p>')+'</div>';
  var all=[];Object.keys(CAL).forEach(function(k){CAL[k].forEach(function(e){all.push(e)})});
  var nexts=all.filter(function(e){return dParse(e.b||e.a)>=t}).sort(function(x,y){return dParse(x.a)-dParse(y.a)}).slice(0,4);
  var mm=mudancas(),fer=FERIADOS.filter(function(f){return !mm.some(function(m){return m.de===f[0]})}).map(function(f){return {d:f[0],t:f[1]}});
  mm.forEach(function(m){fer.push({d:m.d,t:m.t,k:m.k,de:m.de,txt:m.txt,src:m.src})});
  fer=fer.filter(function(f){return dParse(f.d)>=t}).sort(function(a,b){return a.d<b.d?-1:1}).slice(0,5);
  var nxt=nexts.length?'<h3>Próximos prazos</h3><div class="cal-list">'+nexts.map(evRow).join('')+'</div>':'<p class="note">Os prazos de 2027 ainda não estão no protótipo. Confira o calendário da Pró-Reitoria de Graduação quando for publicado.</p>';
  return {left:'<div><p class="eyebrow">Graduação UFRJ</p><h2>Calendário acadêmico</h2></div>'+head+nxt+
      '<h3>Próximos feriados</h3>'+(fer.length?'<div class="cal-list">'+fer.map(function(f){var n=dDiff(dParse(f.d),t);return '<div class="cal-ev fer'+(f.de||f.k?' moved':'')+'"><span class="cal-d mono">'+dTxt(f.d)+'</span><span class="grow"><b>'+esc(f.t)+'</b>'+(f.k?'<small>'+esc(MUD_K[f.k]||'')+(f.de?' · transferido de '+dTxt(f.de):'')+'</small>':'')+(f.src?'<small><a href="'+esc(f.src)+'" target="_blank" rel="noopener">Fonte</a></small>':'')+'</span>'+(f.de?'<span class="pill bad">Mudou</span>':'')+'<span class="pill warn">'+(n===0?'Hoje':n===1?'Amanhã':'Em '+n+' dias')+'</span></div>'}).join('')+'</div>':'<p class="muted small">Nenhum feriado até o fim de 2026.</p>')+
      '<p class="muted small">Feriados nacionais e do estado do RJ, mais mudanças de data e pontos facultativos registrados. Quando uma data muda, o aviso aparece no topo da página para todos.</p>'+mudFormHTML(),
    right:'<div><p class="eyebrow">Datas do período</p><h2>Período '+per+'</h2></div>'+
      '<div class="chips" role="group" aria-label="Período">'+Object.keys(CAL).map(function(k){return '<button class="chip" type="button" data-per="'+k+'" aria-pressed="'+(k===per)+'">'+k+'</button>'}).join('')+'</div>'+
      '<div class="cal-list">'+ev.slice().sort(function(x,y){return dParse(x.a)-dParse(y.a)||(x.b?1:0)-(y.b?1:0)}).map(evRow).join('')+'</div>'+
      '<p class="muted small">Datas iguais nos calendários de graduação 2026 publicados pelo Instituto de Economia e pela Faculdade Nacional de Direito. Algumas unidades têm prazos próprios: confirme com a coordenação do seu curso.</p>'};
}
function evRow(e){
  var s=evStatus(e);
  return '<div class="cal-ev '+s.c+' k-'+e.k+'"><span class="cal-d mono">'+dTxt(e.a)+(e.b?' → '+dTxt(e.b):'')+'</span><span class="grow"><b>'+e.t+'</b><small>'+e.d+'</small></span>'+s.p+'</div>';
}
var cPane,cL,cR;
function renderCal(focusSel){
  if(!cPane||cPane.hidden)return;
  var h=calHTML();cL.innerHTML=h.left;cR.innerHTML=h.right;
  if(focusSel){var el=cPane.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
}
buildMap();
initZoom();
/* ---------- aba "Lugares" (prédios e horários) ----------
   Horários: Sistema de Alimentação (ru.ufrj.br) e Conexão UFRJ (nov/2025) para os RUs; SiBI/UFRJ para bibliotecas;
   endereços das unidades (PR-4, 2022) para secretarias; Prefeitura Universitária para atendimento e segurança. */
var PL={
  ru_central:{name:'RU Central',cat:'comida',where:'Restaurante Universitário Edson Luís de Lima Souto, perto da EEFD',p:[426.4,330.7],wk:[[420,540],[660,855],[1050,1215]],we:[[720,840],[1050,1155]],note:'Café da manhã R$ 2,00 (seg. a sex.). Único RU aberto nos fins de semana e feriados.'},
  ru_ct1:{name:'RU 01 CT',cat:'comida',where:'Centro de Tecnologia',bld:'ct',p:[857.4,466.6],wk:[[420,540],[630,870],[1050,1215]],we:null,note:'Café da manhã R$ 2,00. Fins de semana: só no RU Central.'},
  ru_ct2:{name:'RU 02 CT',cat:'comida',where:'Área do Centro de Tecnologia',wk:[[420,540],[630,870],[1050,1215]],we:null,note:'Café da manhã R$ 2,00. Fins de semana: só no RU Central.'},
  ru_letras:{name:'RU Letras',cat:'comida',where:'Faculdade de Letras',p:[966.6,414.9],wk:[[420,540],[630,870],[1050,1215]],we:null,note:'Café da manhã R$ 2,00. Fins de semana: só no RU Central.'},
  b_ct:{s:'Biblioteca Central',name:'Biblioteca Central do CT',cat:'biblio',where:'CT, Bloco B, 2º andar',bld:'ct',b:'B',f:2,p:[857.4,466.6],wk:[[420,1140]]},
  b_im:{s:'Biblioteca do IM',name:'Biblioteca do IM (Leopoldo Nachbin)',cat:'biblio',where:'CT, Bloco C, sala 120',bld:'ct',b:'C',f:1,p:[857.4,466.6],wk:[[510,1230]]},
  b_iq:{s:'Biblioteca do IQ',name:'Biblioteca do IQ',cat:'biblio',where:'CT, Bloco A, sala 527',bld:'ct',b:'A',f:5,p:[857.4,466.6],wk:[[540,1230]]},
  b_if:{s:'Biblioteca do IF',name:'Biblioteca do IF (Plínio Sussekind Rocha)',cat:'biblio',where:'CT, Bloco A, 3º andar, sala 340',bld:'ct',b:'A',f:3,p:[857.4,466.6],wk:[[510,1230]]},
  b_eq:{s:'Biblioteca da EQ',name:'Biblioteca da Escola de Química',cat:'biblio',where:'CT, Bloco E, 2º andar, sala E210',bld:'ct',b:'E',f:2,p:[857.4,466.6],wk:[[540,1080]]},
  b_ima:{s:'Biblioteca do IMA',name:'Biblioteca do IMA',cat:'biblio',where:'CT, Bloco J, 2º andar',bld:'ct',b:'J',f:2,p:[960.3,473.3],wk:[[480,1020]]},
  b_raras:{s:'Obras Raras',name:'Obras Raras do CT',cat:'biblio',where:'CT, Ligação ABC, sala 106',bld:'ct',b:'ABC',f:1,p:[857.4,466.6],wk:[[540,990]]},
  b_ccmn:{s:'Biblioteca Central',name:'Biblioteca Central do CCMN',cat:'biblio',where:'CCMN, Bloco A',bld:'ccmn',b:'A',f:null,p:[793.6,481.4],wk:[[480,1230]]},
  b_nce:{s:'Biblioteca do NCE',name:'Biblioteca do NCE',cat:'biblio',where:'CCMN, Bloco C',bld:'ccmn',b:'C',f:null,p:[793.6,481.4],wk:[[540,1020]]},
  b_ppgg:{s:'Biblioteca PPGG',name:'Biblioteca de Geografia (PPGG)',cat:'biblio',where:'CCMN, Bloco I, sala 14',bld:'ccmn',b:'I',f:0,p:[793.6,481.4],wk:[[480,1110]]},
  b_xisto:{name:'Posto de Informação da Xistoquímica',cat:'biblio',where:'Polo de Xistoquímica',p:[1023.8,558.6],wk:[[450,930]]},
  a_im:{s:'Secretaria do IM',name:'Secretaria do Instituto de Matemática',cat:'atend',where:'CT, Bloco C, sala 103',bld:'ct',b:'C',f:1,p:[857.4,466.6],wk:[[540,1020]]},
  a_iq:{s:'Atendimento do IQ',name:'Atendimento do Instituto de Química',cat:'atend',where:'CT, Bloco A, 6º andar, sala 632',bld:'ct',b:'A',f:6,p:[857.4,466.6],wk:[[660,900]]},
  a_if:{s:'Secretaria do IF',name:'Secretaria do Instituto de Física',cat:'atend',where:'CT, Bloco A, 3º andar, sala 342-A',bld:'ct',b:'A',f:3,p:[857.4,466.6],wk:null,note:'Horário não informado.'},
  a_geo:{s:'Secretaria de Geografia',name:'Secretaria de Geografia (IGEO)',cat:'atend',where:'CCMN, Bloco G, sala 025',bld:'ccmn',b:'G',f:0,p:[793.6,481.4],wk:[[600,1020]]},
  a_ic:{s:'Secretaria do IC',name:'Secretaria do Instituto de Computação',cat:'atend',where:'Prédio do CCMN',bld:'ccmn',b:'?',f:null,p:[793.6,481.4],wk:[[540,720]]},
  a_pu:{name:'Prefeitura Universitária',cat:'atend',where:'Prédio da Prefeitura (nº 07 no mapa)',p:[415.7,455.3],wk:[[540,960]],note:'Atendimento presencial e telefone fixo (21) 3938-0346.'},
  hall_h:{s:'Hall (eventos)',name:'Hall do Bloco H',cat:'atend',where:'CT, Bloco H',bld:'ct',b:'H',f:1,p:[857.4,466.6],wk:null,note:'Espaço de eventos. Sem horário fixo.'},
  s_diseg:{name:'DISEG – Divisão de Segurança',cat:'seg',where:'Telefone (21) 97380-2554',wk:[[0,1440]],we:[[0,1440]],note:'Atendimento 24 horas.'},
  s_cco:{name:'Centro de Controle Operacional',cat:'seg',where:'WhatsApp (21) 99871-1621',wk:[[0,1440]],we:[[0,1440]],note:'Atendimento 24 horas.'}
};
Object.keys(LINES).forEach(function(id){
  var l=LINES[id],d=l.trips[0].deps;
  PL['bus'+id]={incl:1,name:'Linha '+id+' · '+l.name,cat:'onibus',where:'Primeira e última saída da origem',wk:[[d[0],d[d.length-1]+1]],we:l.weekdays?null:undefined,line:id,
    note:l.weekdays?'Só de segunda a sexta.':'Fins de semana: a Prefeitura não informa; confirme antes.'};
});
var BLD={
  ct:{name:'Centro de Tecnologia',short:'CT',addr:'Av. Athos da Silveira Ramos, 149',stop:'ctl',
    blocks:['A','B','C','E','H','J','ABC'],labels:{ABC:'Ligação ABC'},rows:[6,5,4,3,2,1],
    note:'Escola Politécnica: blocos A, C, D, F, G, H e I. Escola de Química: bloco E. O IMA fica no bloco J.'},
  ccmn:{name:'CCMN',short:'CCMN',addr:'Av. Athos da Silveira Ramos, 274',stop:'ccmn',
    blocks:['A','C','G','I','?'],labels:{'?':'Bloco não informado'},rows:[0,null],
    note:'Matemática, Física e Química são do CCMN, mas ficam no prédio do CT (veja a aba CT).'}
};
var pstate={bld:'ct',pl:'b_ct',cat:'todos',q:''};
function rangesOf(it,we){if(we){if(it.we===undefined)return 'unk';return it.we}return it.wk}
function rangesTxt(r,incl){if(r==='unk')return 'Não informado';if(!r)return 'Fechado';if(r.length===1&&r[0][0]===0&&r[0][1]>=1440)return '24 horas';return r.map(function(x){return hm(x[0])+'–'+hm(x[1]-(incl?1:0))}).join(' · ')}
function statusOf(it,now){
  if(it.fechadoTemp)return {c:'bad',t:'Fechado temporariamente'};
  var mh=mudHoje();if(mh&&(it.cat==='biblio'||it.cat==='atend'||it.cat==='comida'))return {c:'warn',t:(MUD_K[mh.k]||'Mudança')+' hoje · confirme'};
  var we=isWeekend()&&!state.manual,r=rangesOf(it,we);
  if(r==='unk')return {c:'warn',t:'Confirmar no fim de semana'};
  if(!r)return {c:'bad',t:it.wk===null&&!we?'Sem horário fixo':'Fechado hoje'};
  for(var i=0;i<r.length;i++){
    if(now>=r[i][0]&&now<r[i][1]){
      if(r[i][1]>=1440&&r[i][0]===0)return {c:'good',t:'Aberto 24h'};
      var left=r[i][1]-now;
      return left<=30?{c:'warn',t:(it.incl?'Última em ':'Fecha em ')+left+' min'}:{c:'good',t:(it.incl?'Até ':'Aberto até ')+hm(r[i][1]-(it.incl?1:0))};
    }
  }
  for(var j=0;j<r.length;j++)if(r[j][0]>now)return {c:'bad',t:'Fechado · abre '+hm(r[j][0])};
  return {c:'bad',t:'Fechado'};
}
function pill(s){return '<span class="pill '+s.c+'">'+s.t+'</span>'}
function placeCard(id,now,bare){
  var it=PL[id];if(!it)return '';
  var we=isWeekend()&&!state.manual,extra='';
  if(RUS.indexOf(id)>=0)extra+='<div class="fila-in"><p class="small"><b>Fila agora</b></p>'+filaRow(id,now)+'</div>';
  if(it.fechadoTemp)extra+='<div class="warnbox"><b>Fechado temporariamente</b>Informado pela gestão do app.</div>';
  extra+='<button type="button" class="linkbtn sugg" data-req="servico||'+esc(it.name)+'">Sugerir correção</button>';
  return '<div class="plcard"><div class="plc-h"><div><p class="eyebrow">'+({comida:'Alimentação',biblio:'Biblioteca',atend:'Atendimento',seg:'Segurança',onibus:'Ônibus',aula:'Sua aula'})[it.cat]+'</p><h3 class="plc-t">'+it.name+'</h3></div>'+pill(statusOf(it,now))+'</div>'+
    '<dl class="kv"><dt>Onde</dt><dd>'+it.where+'</dd><dt>Seg. a sex.</dt><dd class="mono">'+rangesTxt(it.wk,it.incl)+'</dd><dt>Fim de semana</dt><dd class="mono">'+rangesTxt(it.we===undefined?'unk':it.we)+'</dd></dl>'+
    (it.note?'<p class="muted small">'+it.note+'</p>':'')+
    (bare?'':'<div class="later">'+(it.p&&!it.bld?'<button class="copy" type="button" data-showmap="'+id+'">Ver no mapa</button>':'')+(it.line?'<button class="copy" type="button" data-showline="'+it.line+'">Ver itinerário</button>':'')+'</div>')+extra+'</div>';
}
function buildingHTML(now){
  var fila=CFG.reps?foldHTML('fdFila',pstate.filaBox,'Fila do RU agora',filaResumo(),pstate.filaBox?filaBody():''):'';
  var np=(GST.plantas.items||[]).length;
  return fila+foldHTML('fdBld',pstate.bldOpen,'Prédios por dentro','<span class="fsum muted">Blocos, andares e salas do CT e do CCMN'+(np?' · '+np+' planta'+(np>1?'s':'')+' oficial'+(np>1?'is':''):'')+'</span>',pstate.bldOpen?bldInner(now):'');
}
function hoursHTML(now){
  var we=isWeekend()&&!state.manual,nOpen=Object.keys(PL).filter(function(k){var it=PL[k];if(it.cat==='aula')return false;var st=statusOf(it,now);return !(st.c==='bad'||/Confirmar|Sem horário/.test(st.t))}).length;
  var body=pstate.hrsOpen?hoursListHTML(now):'';
  return foldHTML('fdHrs',pstate.hrsOpen,'Onde fica e quando abre','<span class="fsum muted">'+nOpen+' abertos agora · '+(we?'fim de semana':'dia útil')+', '+fmt(now)+'</span>',body);
}
/* ---------- planta do andar (ilustrativa: a posição sai do número da sala) ---------- */
function roomOf(it){var m=/sala\s+([A-Z]?)(\d{2,3})(-[A-Z])?/i.exec(it.where||'');if(!m)return null;var num=parseInt(m[2],10);return {label:(m[1]||'')+m[2]+(m[3]||''),n:num%100||1}}
function floorShort(f){return f===null?'Andar ?':f===0?'Térreo':f+'º andar'}
function planSVG(bk,blk,f,selId){
  var items=Object.keys(PL).filter(function(k){var x=PL[k];return x.bld===bk&&x.b===blk&&x.f===f});
  var rooms=[],areas=[];
  items.forEach(function(k){var r=roomOf(PL[k]);if(r)rooms.push({k:k,r:r});else areas.push(k)});
  var maxn=rooms.reduce(function(m,x){return Math.max(m,x.r.n)},0);
  var N=Math.max(20,maxn+(maxn%2?3:2));if(N%2)N++;
  var per=N/2,RW=46,X0=24,CORE=110,WC=96,TOP=40,DEP=96,COR=54;
  var W=X0+CORE+per*RW+WC+24,H=TOP+DEP+COR+DEP+24;
  var yC=TOP+DEP,yB=yC+COR,xR=X0+CORE,xW=xR+per*RW;
  var s='<svg class="plan" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Planta ilustrativa do '+(BLD[bk].labels[blk]||'Bloco '+blk)+', '+floorShort(f)+'">';
  // contorno e corredor
  s+='<rect class="pl-floor" x="'+X0+'" y="'+TOP+'" width="'+(W-X0-24)+'" height="'+(DEP*2+COR)+'" rx="6"/>';
  s+='<rect class="pl-cor" x="'+(X0+CORE)+'" y="'+yC+'" width="'+(per*RW+WC-10)+'" height="'+COR+'"/>';
  s+='<text class="pl-cap" x="'+(xR+per*RW/2)+'" y="'+(yC+COR/2)+'">corredor</text>';
  // núcleo: escada, elevador, hall
  s+='<rect class="pl-room core" x="'+X0+'" y="'+TOP+'" width="'+CORE+'" height="'+DEP+'"/>';
  for(var i=0;i<8;i++)s+='<line class="pl-step" x1="'+(X0+10)+'" y1="'+(TOP+12+i*10)+'" x2="'+(X0+CORE-10)+'" y2="'+(TOP+12+i*10)+'"/>';
  s+='<text class="pl-lb" x="'+(X0+CORE/2)+'" y="'+(TOP+DEP-12)+'">Escada</text>';
  s+='<rect class="pl-room core" x="'+X0+'" y="'+yB+'" width="'+CORE+'" height="'+DEP+'"/>';
  s+='<rect class="pl-lift" x="'+(X0+28)+'" y="'+(yB+18)+'" width="'+(CORE-56)+'" height="'+(DEP-46)+'" rx="3"/><path class="pl-x" d="M'+(X0+28)+','+(yB+18)+' l'+(CORE-56)+','+(DEP-46)+' M'+(X0+28+CORE-56)+','+(yB+18)+' l-'+(CORE-56)+','+(DEP-46)+'"/>';
  s+='<text class="pl-lb" x="'+(X0+CORE/2)+'" y="'+(yB+DEP-12)+'">Elevador</text>';
  s+='<rect class="pl-hall" x="'+(X0)+'" y="'+yC+'" width="'+CORE+'" height="'+COR+'"/>';
  s+='<text class="pl-cap" x="'+(X0+CORE/2)+'" y="'+(yC+COR/2)+'">'+(f===0||f===1?'Entrada':'Hall')+'</text>';
  if(f===0||f===1)s+='<path class="pl-door" d="M'+(X0-2)+','+(yC+COR/2)+' l-16,-9 v18z"/>';
  // banheiros
  s+='<rect class="pl-room wc" x="'+xW+'" y="'+TOP+'" width="'+(WC-10)+'" height="'+DEP+'"/><text class="pl-lb" x="'+(xW+(WC-10)/2)+'" y="'+(TOP+DEP/2)+'">WC Fem.</text>';
  s+='<rect class="pl-room wc" x="'+xW+'" y="'+yB+'" width="'+(WC-10)+'" height="'+DEP+'"/><text class="pl-lb" x="'+(xW+(WC-10)/2)+'" y="'+(yB+DEP/2)+'">WC Masc.</text>';
  // salas: ímpares em cima, pares embaixo
  var taken={};rooms.forEach(function(x){taken[x.r.n]=x});
  var areaSpan=areas.length?{from:Math.max(1,Math.floor(per/2)-2),len:5}:null;
  var callout=null;
  for(var n=1;n<=N;n++){
    var idx=Math.ceil(n/2)-1,top=n%2===1,x=xR+idx*RW,y=top?TOP:yB;
    if(areaSpan&&top&&idx>=areaSpan.from&&idx<areaSpan.from+areaSpan.len)continue;
    var t=taken[n],cls='pl-room'+(t?(t.k===selId?' sel':' hit'):'');
    s+='<rect class="'+cls+'" x="'+x+'" y="'+y+'" width="'+RW+'" height="'+DEP+'"/>';
    var lbl=t?t.r.label:((f===null?'':String(f===0?'0':f))+String(n).padStart(2,'0'));
    s+='<text class="pl-num'+(t?' on':'')+'" x="'+(x+RW/2)+'" y="'+(top?y+DEP-14:y+16)+'">'+lbl+'</text>';
    s+='<line class="pl-dooro" x1="'+(x+12)+'" y1="'+(top?yC:yB)+'" x2="'+(x+30)+'" y2="'+(top?yC:yB)+'"/>';
    if(t&&(t.k===selId||!callout))callout={x:x+RW/2,y:top?y+DEP/2-6:y+DEP/2+6,k:t.k,top:top};
  }
  if(areaSpan){
    var ax=xR+areaSpan.from*RW,aw=areaSpan.len*RW,sel=areas.indexOf(selId)>=0;
    s+='<rect class="pl-room '+(sel?'sel':'hit')+'" x="'+ax+'" y="'+TOP+'" width="'+aw+'" height="'+DEP+'"/>';
    s+='<text class="pl-num on" x="'+(ax+aw/2)+'" y="'+(TOP+DEP-14)+'">'+areas.map(function(k){return PL[k].s||PL[k].name}).join(' · ')+'</text>';
    s+='<line class="pl-dooro" x1="'+(ax+aw/2-14)+'" y1="'+yC+'" x2="'+(ax+aw/2+14)+'" y2="'+yC+'"/>';
    if(sel||!callout)callout={x:ax+aw/2,y:TOP+DEP/2-6,k:sel?selId:areas[0],top:true};
  }
  /* marca d'água: a planta é só um exemplo */
  var wcx=W/2,wcy=TOP+DEP+COR/2;
  s+='<g class="pl-wm" aria-hidden="true" transform="rotate(-12 '+wcx+' '+wcy+')">'+
    '<text class="big" x="'+wcx+'" y="'+(wcy-14)+'">MERAMENTE UM EXEMPLO</text>'+
    '<text class="sub" x="'+wcx+'" y="'+(wcy+30)+'">Planta ilustrativa · não é a planta oficial do prédio</text>'+
    '</g>';
  for(var wx=150,wi=0;wx<W-60;wx+=280,wi++){if(Math.abs(wx-wcx)<200)continue;s+='<text class="pl-wm rep" aria-hidden="true" x="'+wx+'" y="'+(wi%2?TOP+DEP/2+8:yB+DEP/2-8)+'" transform="rotate(-12 '+wx+' '+(wi%2?TOP+DEP/2+8:yB+DEP/2-8)+')">EXEMPLO</text>'}
  if(callout){
    s+='<g class="pl-pin" transform="translate('+callout.x+','+callout.y+')"><path d="M0,0 c-9,-10 -14,-16 -14,-23 a14,14 0 1 1 28,0 c0,7 -5,13 -14,23z"/><circle cy="-23" r="5"/></g>';
    var nm=PL[callout.k].s||PL[callout.k].name,tw=nm.length*7.2+20,tx=Math.min(W-tw/2-6,Math.max(tw/2+6,callout.x));
    s+='<g class="pl-tag"><rect x="'+(tx-tw/2)+'" y="6" width="'+tw+'" height="24" rx="12"/><text x="'+tx+'" y="18">'+nm+'</text></g>';
  }
  return s+'</svg>';
}
function planHTML(id){
  var bk=pstate.bld,B=BLD[bk];if(!B)return '';
  var it=PL[id]&&PL[id].bld===bk?PL[id]:null;
  var sub=it?esc(it.s||it.name)+(it.b&&it.b!=='?'?' · '+(B.labels[it.b]||'Bloco '+it.b):'')+(it.f!=null?' · '+floorShort(it.f):''):'Escolha o bloco e o andar';
  return '<details class="det plandet" id="planDet"'+(pstate.planOpen?' open':'')+' data-pid="'+esc(id||'')+'"><summary><span class="plandet-t">Planta interna <span class="pl-badge2">exemplo</span></span><span class="fsum muted">'+B.short+' · '+sub+'</span></summary>'+
    '<div class="plandet-b">'+(pstate.planOpen?planBodyHTML(id):'')+'</div></details>';
}
/* conteúdo da planta de exemplo (só montado quando a pessoa abre o bloco "Planta interna") */
function planBodyHTML(id){
  var bk=pstate.bld,B=BLD[bk],it=PL[id]&&PL[id].bld===bk?PL[id]:null;
  var blocks=bk==='ct'?['A','B','C','D','E','F','G','H','I','J','ABC']:['A','B','C','D','E','F','G','H','I'];
  var inB=function(b){return Object.keys(PL).filter(function(k){return PL[k].bld===bk&&PL[k].b===b})};
  var eb=pstate.eb;if(!eb||blocks.indexOf(eb)<0)eb=it&&blocks.indexOf(it.b)>=0?it.b:'A';pstate.eb=eb;
  var here=inB(eb),fl=bk==='ct'?[0,1,2,3,4,5,6]:[0,1,2,3];
  here.forEach(function(k){var f=PL[k].f;if(f!==null&&fl.indexOf(f)<0)fl.push(f)});
  fl.sort(function(a,b){return a-b});
  if(here.some(function(k){return PL[k].f===null}))fl.push(null);
  var ef=pstate.ef;
  if(ef===undefined||fl.indexOf(ef)<0){ef=it&&it.b===eb?it.f:(here.length?PL[here[0]].f:1);if(fl.indexOf(ef)<0)ef=1}
  pstate.ef=ef;
  var blkName=B.labels[eb]||'Bloco '+eb,onFloor=here.filter(function(k){return PL[k].f===ef}),selOn=it&&it.b===eb&&it.f===ef;
  var how;
  if(selOn){var r=roomOf(it);how=ef===null?'O andar não é informado; procure a recepção do '+blkName+'.':
    (ef<=1?'Fica no '+(ef===0?'térreo':'1º andar')+' do '+blkName+'.':'Do hall do '+blkName+', suba pela escada ou elevador até o '+ef+'º andar.')+(r?' Siga o corredor até a sala '+r.label+'.':'')}
  else if(onFloor.length)how='Toque num local deste andar para ver onde ele fica.';
  else how='Nenhum local cadastrado neste andar. A planta mostra a distribuição típica de salas do '+blkName+'.';
  var bchips=blocks.map(function(b){var n=inB(b).length;return '<button class="chip" type="button" data-eb="'+b+'" aria-pressed="'+(b===eb)+'">'+(b==='ABC'?'Ligação ABC':b)+(n?'<span class="cnt" aria-label="'+n+' locais"></span>':'')+'</button>'}).join('');
  var fchips=fl.map(function(f){var n=here.filter(function(k){return PL[k].f===f}).length;return '<button class="chip" type="button" data-ef="'+(f===null?'n':f)+'" aria-pressed="'+(f===ef)+'">'+floorShort(f)+(n?'<span class="cnt" aria-label="'+n+' locais"></span>':'')+'</button>'}).join('');
  return '<div class="planbox" id="planbox"><div class="plc-h"><div><p class="eyebrow">'+B.short+' · '+blkName+' · '+floorShort(ef)+'</p><h3 class="plc-t">'+(selOn?esc(it.name):'Escolha o bloco e o andar')+'</h3></div>'+(selOn?pill(statusOf(it,nowMin())):'')+'</div>'+
    (it&&it.b==='?'?'<p class="note">A UFRJ não informa em que bloco fica '+esc(it.name)+'. Escolha um bloco abaixo para explorar.</p>':'')+
    '<div class="pick"><span class="pick-l">Bloco</span><div class="chips" role="group" aria-label="Bloco">'+bchips+'</div></div>'+
    '<div class="pick"><span class="pick-l">Andar</span><div class="chips" role="group" aria-label="Andar">'+fchips+'</div></div>'+
    '<div class="planwrap">'+planSVG(bk,eb,ef,selOn?id:null)+'<span class="pl-badge">Planta de exemplo</span></div>'+
    '<p class="small">'+how+'</p>'+
    (onFloor.length?'<div class="chips lgfloor" role="group" aria-label="Locais neste andar">'+onFloor.map(function(k){return '<button class="chip" type="button" data-pl="'+k+'" aria-pressed="'+(k===id)+'"><i class="pin-dot '+statusOf(PL[k],nowMin()).c+'"></i>'+esc(PL[k].s||PL[k].name)+'</button>'}).join('')+'</div>':'')+
    '<div class="flegend"><span><i class="pl-key sel"></i>Local escolhido</span><span><i class="pl-key hit"></i>Outros locais deste andar</span><span><i class="pl-key core"></i>Escada e elevador</span><span><i class="cnt"></i>Bloco ou andar com locais cadastrados</span></div>'+
    '</div>';
}
var pPane=$('#pane-predios'),pB=$('#pBuild'),pH=$('#pHours');
function renderPredios(focusSel){
  if(pPane.hidden){renderWifiPane();return}
  var now=nowMin();
  pB.innerHTML=buildingHTML(now);pH.innerHTML=hoursHTML(now);
  var pw=pPane.querySelector('.planwrap'),pin=pw&&pw.querySelector('.pl-pin');
  if(pin){var a=pin.getBoundingClientRect(),b=pw.getBoundingClientRect();pw.scrollLeft+=a.left+a.width/2-(b.left+b.width/2)}
  if(focusSel){var el=pPane.querySelector(focusSel);if(el){el.focus({preventScroll:true});if(el.id==='hq'){var v=el.value;el.setSelectionRange(v.length,v.length)}}}
  /* o bloco e o andar escolhidos ficam visíveis quando os botões não cabem na largura */
  pPane.querySelectorAll('.planbox .pick .chips').forEach(function(el){var c=el.querySelector('[aria-pressed="true"]');if(c&&el.scrollWidth>el.clientWidth){var r1=el.getBoundingClientRect(),r2=c.getBoundingClientRect();el.scrollLeft+=r2.left+r2.width/2-(r1.left+r1.width/2)}});
  renderWifiPane();
}
/* abas do app: id, nome e descrição (a ordem e quais aparecem vêm de Ajustes) */
var TABS=[['trajeto','Trajetos','Linhas, horários e o próximo ônibus'],['predios','Lugares','Onde fica, quando abre e as plantas'],['grade','Grade','Suas aulas da semana'],['cal','Calendário','Prazos, feriados e mudanças de data']];
var TABID=TABS.map(function(t){return t[0]});
function setTab(t){
  if(t==='cfg'){openCfg();return}
  if(TABID.indexOf(t)<0||!tabOn(t))t=tabVis()[0];/* abas escondidas ou fora da ordem escolhida em Ajustes */
  if(['trajeto','predios','grade','cal'].indexOf(t)<0)t='trajeto';
  var pr=t==='predios';
  $('#pane-trajeto').hidden=t!=='trajeto';pPane.hidden=!pr;$('#pane-grade').hidden=t!=='grade';$('#pane-cal').hidden=t!=='cal';if(t==='cal')renderCal();
  if(t==='grade')renderGrade();
  document.querySelectorAll('[data-tab]').forEach(function(b){if(b.id==='tab-cfg')return;var on=b.dataset.tab===t;b.setAttribute('aria-selected',String(on));b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1});
  if(pr)renderPredios();
}
document.querySelectorAll('[data-tab]').forEach(function(b){
  b.addEventListener('click',function(){var t=b.dataset.tab;if(t==='cfg'){if($('#pane-cfg').hidden)openCfg();else closeCfg();return}setTab(t);try{history.replaceState(null,'','#'+t)}catch(e){location.hash=t}});
  b.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();var T=['trajeto','predios','grade','cal'],i=T.indexOf(b.dataset.tab);if(i<0)return;var o=T[(i+(e.key==='ArrowRight'?1:3))%4];setTab(o);try{history.replaceState(null,'','#'+o)}catch(err){}$('[data-tab="'+o+'"]').focus()}});
});
window.addEventListener('hashchange',function(){setTab(location.hash.slice(1))});
pPane.addEventListener('click',function(e){
  var t=e.target.closest('[data-eb],[data-ef],[data-pf],[data-bld],[data-pl],[data-cat],[data-showmap],[data-showline]');if(!t)return;
  if(t.dataset.eb){pstate.eb=t.dataset.eb;pstate.ef=undefined;renderPredios('[data-eb="'+t.dataset.eb+'"]');return}
  if(t.dataset.ef!==undefined){pstate.ef=t.dataset.ef==='n'?null:+t.dataset.ef;renderPredios('[data-ef="'+t.dataset.ef+'"]');return}
  if(t.dataset.pf!==undefined){pstate.pf=t.dataset.pf==='n'?null:+t.dataset.pf;renderPredios('[data-pf="'+t.dataset.pf+'"]');return}
  if(t.dataset.bld){pstate.bld=t.dataset.bld;pstate.pl=null;pstate.pf=undefined;pstate.eb=undefined;pstate.ef=undefined;renderPredios('[data-bld="'+t.dataset.bld+'"]');return}
  if(t.dataset.cat){pstate.cat=t.dataset.cat;renderPredios('[data-cat="'+t.dataset.cat+'"]');return}
  if(t.dataset.showmap){var it=PL[t.dataset.showmap];state.sel={kind:'place',id:t.dataset.showmap};renderAll();ensureVisible(it.p);document.querySelector('.mapcard').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});return}
  if(t.dataset.showline){setTab('trajeto');try{history.replaceState(null,'','#trajeto')}catch(err){}select('line',t.dataset.showline,true);return}
  if(t.dataset.pl){
    var k=t.dataset.pl;pstate.pl=k;pstate.pf=undefined;if(PL[k].bld&&PL[k].b!=='?'){pstate.eb=PL[k].b;pstate.ef=PL[k].f}else{pstate.eb=undefined;pstate.ef=undefined}
    if(PL[k].bld)pstate.bld=PL[k].bld;
    renderPredios(t.classList.contains('pin')?'[data-pl="'+k+'"].pin':null);
    if(t.classList.contains('hrow')){var c=pPane.querySelector('#planbox')||pPane.querySelector('.plcard');if(c){c.scrollIntoView({behavior:'auto',block:'nearest'});var f=c.querySelector('button');if(f)f.focus({preventScroll:true})}}
  }
});
pPane.addEventListener('input',function(e){if(e.target.id==='hq'){pstate.q=e.target.value;pH.innerHTML=hoursHTML(nowMin());var el=$('#hq');el.focus();el.setSelectionRange(el.value.length,el.value.length)}});
/* ---------- eventos: serviços, avisos e grade ---------- */
gPane=$('#pane-grade');gNext=$('#gNext');gWeek=$('#gWeek');
syncAulas();
var svcbar=$('#svcbar');
function renderSvcBar(){
  svcbar.hidden=!state.layers.svc;
  svcbar.innerHTML=SVC_G.map(function(g){return '<button class="chip" type="button" data-sg="'+g[0]+'" aria-pressed="'+(state.svcGrp===g[0])+'">'+g[1]+'</button>'}).join('');
}
$('#chSvc').addEventListener('click',function(){setLayer('svc',this);renderSvcBar();schedule()});
svcbar.addEventListener('click',function(e){var b=e.target.closest('[data-sg]');if(!b)return;state.svcGrp=b.dataset.sg;renderSvcBar();updateMap();schedule();var f=svcbar.querySelector('[data-sg="'+state.svcGrp+'"]');if(f)f.focus()});
function scrollToMap(){document.querySelector('.mapcard').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'})}
detail.addEventListener('click',function(e){
  var g=e.target.closest('[data-repgo]');
  if(g){var pl=placeOf(g.dataset.repgo);if(pl){if(pl.kind==='svc'&&!state.layers.svc){state.layers.svc=true;$('#chSvc').setAttribute('aria-pressed','true');renderSvcBar()}select(pl.kind,pl.id,false);ensureVisible(pl.p);scrollToMap()}return}
  var d=e.target.closest('[data-repdel]');
  if(d){removeReport(d.dataset.repdel);return}
});
detail.addEventListener('submit',function(e){
  if(e.target.id!=='repform')return;
  e.preventDefault();
  var k=$('#repk').value,pl=$('#repp').value,t=$('#rept').value.trim(),btn=e.target.querySelector('.sendrep');
  btn.disabled=true;btn.textContent='Publicando…';
  sendReport(k,pl,t).then(function(ok){
    if(ok){renderDetail();var det=$('#repdet');if(det)det.open=false}
    else{btn.disabled=false;btn.textContent='Publicar aviso'}
  });
});
gPane.addEventListener('change',function(e){
  if(e.target.id==='gfrom'){gs.from=e.target.value;renderGrade('#gfrom');return}
  if(e.target.id==='gbld'){
    var v=e.target.value,out=v==='outro';
    $('#gbwrap').hidden=out;$('#gfwrap').hidden=out;$('#gstopwrap').hidden=!out;
    if(!out)$('#gb').innerHTML=GBLK[v].map(function(b){return '<option>'+b+'</option>'}).join('');
  }
});
gPane.addEventListener('submit',function(e){
  if(e.target.id!=='gform')return;
  e.preventDefault();
  var nome=$('#gnome').value.trim(),bld=$('#gbld').value,dias=[].slice.call(gPane.querySelectorAll('.gdias input:checked')).map(function(i){return +i.value});
  var ini=$('#gini').value,fim=$('#gfim').value,err=$('#gerr');
  if(!nome){err.className='gerr';err.textContent='Escreva o nome da disciplina.';$('#gnome').focus();return}
  if(!dias.length){err.textContent='Marque pelo menos um dia.';gPane.querySelector('.gdias input').focus();return}
  if(!ini||!fim||toMin(fim)<=toMin(ini)){err.textContent='O fim da aula precisa ser depois do início.';$('#gfim').focus();return}
  err.textContent='';err.className='gerr';
  var a={id:'a'+Date.now().toString(36),nome:nome.slice(0,50),bld:bld,b:bld==='outro'?'':$('#gb').value,stop:bld==='outro'?$('#gstop').value:'',sala:$('#gsala').value.trim().slice(0,10),andar:bld==='outro'||$('#gf').value===''?null:+$('#gf').value,dias:dias,ini:ini,fim:fim};
  if(!GRADE)GRADE=[];
  GRADE.push(a);saveGrade();syncAulas();
  e.target.reset();$('#gini').value='08:00';$('#gfim').value='10:00';$('#gbwrap').hidden=false;$('#gfwrap').hidden=false;$('#gstopwrap').hidden=true;
  $('#gb').innerHTML=GBLK.ct.map(function(b){return '<option>'+b+'</option>'}).join('');
  err.textContent='Aula salva.';err.className='gerr ok';
  renderGrade();
});
gPane.addEventListener('click',function(e){
  var t=e.target.closest('[data-gdel],[data-gplan],[data-gmap]');if(!t)return;
  if(t.dataset.gdel){GRADE=(GRADE||[]).filter(function(a){return a.id!==t.dataset.gdel});saveGrade();syncAulas();renderGrade();return}
  var a=gradeList().filter(function(x){return x.id===(t.dataset.gplan||t.dataset.gmap)})[0];if(!a)return;
  if(t.dataset.gplan){pstate.bldOpen=true;pstate.bld=a.bld;pstate.pl='aula_'+a.id;pstate.pf=undefined;pstate.eb=a.b;pstate.ef=PL['aula_'+a.id]?PL['aula_'+a.id].f:undefined;setTab('predios');try{history.replaceState(null,'','#predios')}catch(err){}
    var pb=$('#planbox');if(pb)pb.scrollIntoView({behavior:'auto',block:'start'});return}
  if(t.dataset.gmap){select('stop',aulaStop(a),false);scrollToMap()}
});
renderSvcBar();
drawShared();
initShared();
/* ---------- mudanças de data (feriados transferidos, pontos facultativos, suspensões) ----------
   Base conhecida + mudanças publicadas no armazenamento compartilhado (coleção "cal"), que só o dono edita.
   A página não consegue consultar sites sozinha; uma mudança nova entra pelo formulário do dono ou pelo Claude. */
var MUD_BASE=[
  {id:'servidor-2026',d:'2026-10-30',de:'2026-10-28',t:'Dia do Servidor Público',k:'facultativo',
   txt:'Ponto facultativo transferido de quarta (28/10) para sexta (30/10) pelo Ministério da Gestão (MGI), para órgãos federais como a UFRJ. Atendimentos administrativos e bibliotecas podem não funcionar; confirme as aulas com o professor.',
   src:'https://agenciabrasil.ebc.com.br/geral/noticia/2026-10/dia-do-servidor-publico-ponto-facultativo-sera-na-sexta-feira'}
];
var MUD_DB=[];
var MUD_K={feriado:'Feriado',facultativo:'Ponto facultativo',suspensao:'Aulas suspensas'};
function mudancas(){
  var byId={};MUD_BASE.concat(MUD_DB).forEach(function(m){if(m&&m.d&&/^\d{4}-\d{2}-\d{2}$/.test(m.d))byId[m.id||m.d]=m});
  return Object.keys(byId).map(function(k){return byId[k]}).sort(function(a,b){return a.d<b.d?-1:1});
}
function isoToday(){var t=today0();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')}
function mudHoje(){if(state.manual)return null;var s=isoToday();return mudancas().filter(function(m){return m.d===s})[0]||null}
var MUDMIN={};try{MUDMIN=JSON.parse(localStorage.getItem('cse-mud-min'))||{}}catch(e){MUDMIN={}}
function saveMudMin(){try{localStorage.setItem('cse-mud-min',JSON.stringify(MUDMIN))}catch(e){}}
function bannerHTML(){
  var t=today0(),up=mudancas().filter(function(m){var n=dDiff(dParse(m.d),t);return n>=0&&n<=7||(m.de&&dDiff(dParse(m.de),t)===0)});
  if(!up.length)return '';
  return up.map(function(m){
    var id=esc(m.id||m.d),n=dDiff(dParse(m.d),t),quando=n===0?'Hoje':n===1?'Amanhã':dTxt(m.d).replace(/^./,function(c){return c.toUpperCase()});
    var deHoje=m.de&&dDiff(dParse(m.de),t)===0;
    if(MUDMIN[m.id||m.d])return '<button class="mudpill" type="button" data-mudopen="'+id+'" aria-label="Mostrar aviso: '+esc(m.t)+'"><span class="mud-k">'+esc(MUD_K[m.k]||'Mudança')+'</span>'+esc(m.t)+' · '+dTxt(m.d)+'<span aria-hidden="true" class="mud-chev">▾</span></button>';
    return '<div class="mud"><span class="mud-k">'+esc(MUD_K[m.k]||'Mudança')+'</span><span class="grow"><b>'+(deHoje?'Hoje é dia normal: o '+esc(m.t)+' foi para '+dTxt(m.d)+'.':quando+': '+esc(m.t)+(m.de?' (transferido de '+dTxt(m.de)+')':''))+'</b><small>'+esc(m.txt||'')+'</small></span><button class="copy" type="button" data-tab-go="cal">Ver no calendário</button><button class="mudmin" type="button" data-mudmin="'+id+'" aria-label="Minimizar aviso" title="Minimizar">–</button></div>';
  }).join('');
}
function drawBanner(){var b=$('#mudbar');if(b){var h=CFG.banner?bannerHTML():'';b.innerHTML=h;b.hidden=!h}}
document.addEventListener('click',function(e){
  var a=e.target.closest('[data-mudmin],[data-mudopen]');if(!a)return;
  var id=a.dataset.mudmin||a.dataset.mudopen;
  if(a.dataset.mudmin)MUDMIN[id]=1;else delete MUDMIN[id];
  saveMudMin();drawBanner();
  var f=document.querySelector(a.dataset.mudmin?'[data-mudopen="'+id+'"]':'[data-mudmin="'+id+'"]');if(f)f.focus({preventScroll:true});
});
/* formulário do dono */
var MUD_OWNER=false,mudBusy=false;
function mudFormHTML(){
  if(!MUD_OWNER)return '';
  return '<details class="det"><summary>Registrar mudança de data (só você vê)</summary><form class="repform" id="mudform">'+
    '<label class="fld">Nome<input type="text" id="mudt" maxlength="60" required placeholder="Ex.: Dia do Servidor Público"></label>'+
    '<div class="g2"><label class="fld">Tipo<select id="mudk"><option value="facultativo">Ponto facultativo</option><option value="feriado">Feriado</option><option value="suspensao">Aulas suspensas</option></select></label>'+
    '<label class="fld">Nova data<input type="date" id="mudd" required></label></div>'+
    '<label class="fld">Data original, se foi transferido (opcional)<input type="date" id="mudde"></label>'+
    '<label class="fld">Detalhe e fonte (opcional)<input type="text" id="mudx" maxlength="240" placeholder="Ex.: Portaria da Reitoria nº…"></label>'+
    '<p class="gerr" id="muderr" role="alert"></p><button class="copy sendrep" type="submit">Publicar para todos</button></form></details>'+
    (MUD_DB.length?'<div class="cal-list">'+MUD_DB.map(function(m){return '<div class="cal-ev"><span class="cal-d mono">'+dTxt(m.d)+'</span><span class="grow"><b>'+esc(m.t)+'</b></span><button class="copy" type="button" data-muddel="'+esc(m.id)+'">Remover</button></div>'}).join('')+'</div>':'');
}
