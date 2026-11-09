(function(){
'use strict';
/* ---------- etapas: pontos de extensão ----------
   Funções centrais (montar o mapa, mostrar detalhes, Ajustes, gestão…) rodam, no fim, as etapas que cada parte
   do app registra com aoFazer(), na ordem em que as partes são carregadas. Nenhuma parte substitui função de outra.
   etapas(nome, ...)  roda as etapas registradas;   filtro(nome, valor, ...)  passa um valor (ex.: HTML) por elas. */
var ETAPAS={};
function aoFazer(nome,f){(ETAPAS[nome]=ETAPAS[nome]||[]).push(f)}
function etapas(nome){var a=[].slice.call(arguments,1);(ETAPAS[nome]||[]).forEach(function(f){f.apply(null,a)})}
var FBMODE=!!(window.CSE_FIREBASE&&window.CSE_FIREBASE.apiKey&&window.CSE_FIREBASE.projectId)&&!(window.claude&&typeof window.claude.use==='function');
var LITE=(function(){try{return window.matchMedia('(pointer:coarse), (max-width:820px)').matches||(navigator.hardwareConcurrency||8)<=4||!!(navigator.connection&&navigator.connection.saveData)}catch(e){return false}})();
document.documentElement.classList.toggle('lite',LITE);
var CFG={cover:'folha',banner:true,reps:true,coverToday:true,login:true,flow:true,bg:'brilho',font:'aparelho',fsize:'m',tema:'escuro',temaV:0,bussola:false,foto:true,perf:'auto',perfV:0,bldn:true,simples:true,simplesV:0,tabs:null,tabsOff:null,bussolaAlvo:'destino',autoDest:true,clima:true,chuva:true,faixa:10,faixaV:0,telaCheia:null,alOn:false,alMin:10,alChuva:true,alFila:false};
try{var _c=JSON.parse(localStorage.getItem('cse-cfg'));if(_c)CFG=Object.assign(CFG,_c)}catch(e){}
/* v22: tema escuro é o padrão; quem estava em "Do aparelho" passa para escuro uma vez (claro ou pelo horário escolhidos ficam) */
if(CFG.temaV!==1){if(!CFG.tema||CFG.tema==='sistema')CFG.tema='escuro';CFG.temaV=1;try{localStorage.setItem('cse-cfg',JSON.stringify(CFG))}catch(e){}}
/* desempenho: automático, leve (sem transparência nem efeitos), intermediário (o antigo "completo") e completo
   (intermediário + vidro e animações em Ajustes, glossário e gestão). Automático: computador = completo; o resto = intermediário. */
function perfEnter(m){if(!m||perfEff()!=='completo')return;m.classList.add('ent');clearTimeout(m._ent);m._ent=setTimeout(function(){m.classList.remove('ent')},1100)}
var DESKTOP=(function(){try{return window.matchMedia('(pointer:fine) and (hover:hover) and (min-width:821px)').matches&&!(navigator.connection&&navigator.connection.saveData)}catch(e){return false}})();
var SAVEDATA=!!(navigator.connection&&navigator.connection.saveData);
function perfMode(){
  var m=CFG.perf||'auto';
  /* quem escolheu "completo" antes dos 4 modos tinha o que hoje é o intermediário */
  if(CFG.perfV!==2){if(m==='completo')m=CFG.perf='intermediario';CFG.perfV=2}
  if(m!=='leve'&&m!=='intermediario'&&m!=='completo')m='auto';
  return m;
}
function perfEff(){var m=perfMode();return m==='auto'?(DESKTOP?'completo':'intermediario'):m}
function applyPerf(){
  var m=perfMode(),e=perfEff(),r=document.documentElement;
  LITE=e==='leve'?true:(m==='auto'&&SAVEDATA&&!DESKTOP)?true:false;
  r.classList.toggle('lite',LITE);r.classList.toggle('lowgfx',e==='leve');
  r.classList.toggle('perf-c',e==='completo');r.classList.toggle('perf-i',e==='intermediario');
  /* intermediário e leve: tudo opaco (sem vidro, desfoque nem brilho); o leve também tira o movimento do mapa */
  r.classList.toggle('solido',e!=='completo');
  if(e!=='completo')r.classList.remove('refract');
}
applyPerf();
var $=function(s,r){return (r||document).querySelector(s)};
function fmt(m){m=Math.round(m);m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function toMin(s){var p=s.split(':');return (+p[0])*60+(+p[1])}
function br(n){return n.toFixed(1).replace('.',',')}
function range(a,b,s){var o=[];for(var t=a;t<=b;t+=s)o.push(t);return o}
/* ---------- paradas (coordenadas do mapa esquemático) ---------- */
var STOPS={
  est:{name:'Estação de Integração UFRJ (BRT)',short:'Estação BRT',p:[262.3,331.7]},
  hu:{name:'Hospital Universitário / CCS bloco A',short:'HU / CCS',p:[318.5,334.3]},
  ccsbb:{name:'CCS (Banco do Brasil)',p:[360.4,332.5]},
  pu:{name:'Prefeitura Universitária',p:[436.6,430.3]},
  cepel:{name:'Cepel',p:[587.6,424.9]},
  cepe:{name:'CEPE (Clube dos Empregados da Petrobras)',short:'CEPE',p:[726.7,425]},
  cenpes2:{name:'Cenpes II',p:[654.6,424.1]},
  cenpes1:{name:'Cenpes I',p:[694.6,423.4]},
  ifn:{name:'Instituto de Física (novo)',p:[756.8,426.7]},
  ccmn:{name:'CCMN / CT',short:'CCMN',p:[797.9,475]},
  ctl:{name:'CT / Faculdade de Letras',short:'CT · Letras',p:[929.8,424.3]},
  xisto:{name:'Xistoquímica',p:[984.6,536.1]},
  reit:{name:'Reitoria (Prédio Jorge Machado Moreira)',short:'Reitoria',p:[982.5,367]},
  cetem:{name:'CETEM',p:[1042.9,281.4]},
  cpst:{name:'CPST / DFO',p:[1005.6,322]},
  incub:{name:'Incubadora',p:[1120.7,323.1]},
  graf:{name:'Gráfica',p:[1160.8,323.4]},
  coppead:{name:'COPPEAD',p:[1039.2,242.5]},
  parque:{name:'Parque Tecnológico',p:[1159.3,288.4]},
  eefd:{name:'EEFD',p:[401.1,301.7]},
  dipro:{name:'DIPRO',p:[398.6,218.8]},
  res:{name:'Residência Estudantil',short:'Residência',p:[377.3,118.6]},
  biorio:{name:'Antiga Bio-Rio',p:[395.5,193.9]}
};
var WP={ath:[800.9,428.8],j1:[401.4,330.7],j2:[397.8,412],j3:[416.6,429.2],dg:[489.5,426.1],dg2:[417.4,355.1],wn:[392.3,117.9],pc:[981,426.2],pe:[980.6,323.1],wL:[1044.5,320.4],wI1:[1104.6,320.8],wI2:[1103.3,290.8],fr1:[841.5,453.3],fr2:[869.1,456.6],fr3:[883.3,441.5]};
/* rotatórias: Pç. Giulio Massarani (oval) e Av. Pedro Calmon; circulação no sentido anti-horário */
var ROUND={gm:{c:[800.9,428.8],rx:34,ry:14},pc:{c:[981,426.2],rx:11,ry:11}};
function arcPts(tok){var a=tok.slice(1).split(':'),Q=ROUND[a[0]],a0=+a[1],a1=+a[2],o=[];for(var t=a0;t>=a1-0.01;t-=15){var r=t*Math.PI/180;o.push([+(Q.c[0]+Q.rx*Math.cos(r)).toFixed(1),+(Q.c[1]+Q.ry*Math.sin(r)).toFixed(1)])}return o}
function P(id){id=id.replace('~','');return STOPS[id]?STOPS[id].p:WP[id]}
function isStop(id){return !!STOPS[id]}
/* ---------- linhas internas (Prefeitura Universitária) ---------- */
var LINES={
  '1':{name:'Estação × Gráfica',color:'--l1',
    sum:'A cada 10 min das 5h às 19h; a cada 30 min das 19h à meia-noite.',
    trips:[{deps:range(300,1140,10).concat(range(1170,1410,30)),halves:[
      {to:'Gráfica',seq:['est','hu','j1','j2','j3','pu','cepel','cenpes1','ath','ccmn','ath','ctl','pc','xisto','pc','reit','pe','cpst','incub','graf']},
      {to:'Estação',seq:['graf','wL','coppead','cetem','wL','pe','reit','pc','ctl','ath','ccmn','ath','cenpes2','dg','dg2','j1','eefd','dipro','wn','res','wn','biorio','j1','ccsbb','hu','est']}]}]},
  '2':{name:'Estação × COPPEAD',color:'--l2',
    sum:'A cada 40 min. Saídas da Estação das 7h05 às 19h05; da COPPEAD das 7h25 às 18h45. A volta segue até a Estação (a página da Prefeitura cita a volta só até a Faculdade de Letras).',
    trips:[
      {deps:range(425,1145,40),halves:[{to:'COPPEAD',seq:['est','hu','j1','j2','j3','pu','cepel','cenpes1','ctl','pc','reit','pe','wL','cetem','coppead']}]},
      {deps:range(445,1125,40),halves:[{to:'Estação',seq:['coppead','cetem','wL','pe','~reit','pc','ctl','cenpes2','dg','dg2','j1','eefd','biorio','j1','ccsbb','hu','est']}]}]},
  '3':{name:'Estação × Residência Estudantil',color:'--l3',
    sum:'A cada 10 min, das 5h à meia-noite.',
    trips:[{deps:range(300,1430,10),halves:[
      {to:'Residência',seq:['est','hu','j1','j2','j3','pu','dg','dg2','j1','eefd','dipro','wn','res']},
      {to:'Estação',seq:['res','wn','biorio','j1','ccsbb','hu','est']}]}]},
  '4':{name:'Estação × Parque Tecnológico / COPPEAD',color:'--l4',
    sum:'A cada 15 min de dia e 20 min à noite, até 20h30. Depois disso, use a Linha 1 para chegar à frente do Parque.',
    trips:[{deps:[370,390,410].concat(range(430,1120,15),[1130],range(1150,1230,20)),halves:[
      {to:'Parque Tecnológico',seq:['est','hu','j1','j2','j3','pu','cepel','cenpes1','ath','ccmn','ath','ctl','pc','reit','pe','cpst','incub','wI1','wI2','parque']},
      {to:'Estação',seq:['parque','wI2','wI1','wL','coppead','cetem','wL','pe','reit','pc','ctl','ath','ccmn','ath','cenpes2','dg','dg2','j1','eefd','biorio','j1','ccsbb','hu','est']}]}]},
  '5':{name:'Estação × CT / CCMN (expressa)',color:'--l5',approx:true,
    sum:'Expressa, só nos picos: 7h–9h, 11h–13h e 17h–19h30. O intervalo varia; o protótipo estima 15 min.',
    trips:[{deps:range(420,540,15).concat(range(660,780,15),range(1020,1170,15)),halves:[
      {to:'CT / CCMN',seq:['est','hu','j1','j2','j3','pu','cepel','cenpes1','ath','ccmn']},
      {to:'Estação',seq:['ccmn','ath','cenpes2','dg','dg2','j1','eefd','biorio','j1','ccsbb','hu','est']}]}]},
  '6':{name:'Residência Estudantil × Reitoria',color:'--l6',weekdays:true,
    sum:'De segunda a sexta, a cada 60 min, das 7h às 22h.',
    trips:[{deps:range(420,1320,60),halves:[
      {to:'Reitoria',seq:['res','wn','biorio','j1','ccsbb','j1','j2','j3','pu','cepel','cepe','ifn','ctl','pc','reit']},
      {to:'Residência',seq:['pe','wL','cetem','wL','pe','reit','pc','ctl','cenpes2','dg','dg2','j1','eefd','dipro','wn','res']}]}]}
};
/* tempo: ~75 unidades do mapa por minuto + 30 s por parada (estimativa) */
var SPEED=75,DWELL=0.5;
function geom(){Object.keys(LINES).forEach(function(id){
  LINES[id].trips.forEach(function(tr){
    var pts=[],passes=[],cum=0,nst=0,prev=null;
    tr.halves.forEach(function(h,hi){
      h.seq.forEach(function(sid,k){
        if(hi>0&&k===0&&prev&&sid===tr.halves[hi-1].seq[tr.halves[hi-1].seq.length-1])return;
        (sid.charAt(0)==='@'?arcPts(sid):[P(sid)]).forEach(function(p){
          if(prev){cum+=Math.hypot(p[0]-prev[0],p[1]-prev[1])}
          prev=p;pts.push(p);
        });
        if(isStop(sid)){
          if(passes.length&&passes[passes.length-1].stop===sid){passes[passes.length-1].half=hi;return}
          passes.push({stop:sid,off:cum/SPEED+nst*DWELL,half:hi});nst++;
        }
      });
    });
    tr.pts=pts;tr.passes=passes;
  });
});}
geom();
function linesAt(sid){return Object.keys(LINES).filter(function(id){return LINES[id].trips.some(function(t){return t.passes.some(function(p){return p.stop===sid})})})}
function isWeekend(){var d=new Date().getDay();return d===0||d===6}
/* próximas passagens numa parada, por sentido */
function passesAt(lid,sid,now,count){
  var out=[],l=LINES[lid];
  l.trips.forEach(function(tr){
    tr.passes.forEach(function(ps,i){
      if(ps.stop!==sid)return;
      var last=i===tr.passes.length-1;
      var to=tr.halves[ps.half].to,key=last?'fim':to;
      var g=out.filter(function(o){return o.key===key})[0];
      if(!g){g={key:key,to:to,last:last,times:[],first:Infinity};out.push(g)}
      tr.deps.forEach(function(d){var t=d+ps.off;if(t<g.first)g.first=t;if(t>=now)g.times.push(t)});
    });
  });
  out.forEach(function(g){g.times.sort(function(a,b){return a-b});g.times=g.times.slice(0,count)});
  return out;
}
/* opções diretas de A para B */
function options(from,to,now){
  var best={};
  Object.keys(LINES).forEach(function(lid){
    if(LINES[lid].susp)return;
    if(LINES[lid].weekdays&&isWeekend()&&!state.manual)return;
    LINES[lid].trips.forEach(function(tr){
      for(var i=0;i<tr.passes.length;i++){
        if(tr.passes[i].stop!==from)continue;
        for(var j=i+1;j<tr.passes.length;j++){
          if(tr.passes[j].stop!==to)continue;
          tr.deps.forEach(function(d){
            var dep=d+tr.passes[i].off,arr=d+tr.passes[j].off;
            if(dep<now)return;
            if(!best[lid]||arr<best[lid].arr)best[lid]={lid:lid,dep:dep,arr:arr,to:tr.halves[tr.passes[i].half].to};
          });
          break;
        }
      }
    });
  });
  return Object.keys(best).map(function(k){return best[k]}).sort(function(a,b){return a.arr-b.arr});
}
function served(from,to){
  return Object.keys(LINES).some(function(lid){return LINES[lid].trips.some(function(tr){
    var i=tr.passes.findIndex(function(p){return p.stop===from});
    return i>=0&&tr.passes.slice(i+1).some(function(p){return p.stop===to});
  })});
}
/* ---------- guia de prédios (horários: SiBI/UFRJ e endereços das unidades, PR-4) ---------- */
var PLACES={
  ccmn:{name:'CCMN',full:'Centro de Ciências Matemáticas e da Natureza',addr:'Av. Athos da Silveira Ramos, 274 · Cidade Universitária',
    intro:'Reúne Matemática, Física, Química, Geociências, Computação e o Observatório do Valongo. Parte dos institutos fica no prédio vizinho do CT.',
    groups:[
      {title:'No prédio do CCMN',items:[
        {n:'Biblioteca Central do CCMN',w:'Bloco A',h:[480,1230]},
        {n:'Biblioteca do NCE',w:'Bloco C',h:[540,1020]},
        {n:'Biblioteca de Geografia (PPGG)',w:'Bloco I, sala 14',h:[480,1110]},
        {n:'Secretaria de Geografia (IGEO)',w:'Bloco G, sala 025',h:[600,1020]},
        {n:'Instituto de Computação',w:'Atendimento da secretaria',h:[540,720]},
        {n:'Geologia (IGEO)',w:'Atendimento por e-mail',h:null}]},
      {title:'Institutos do CCMN no prédio do CT (nº 149)',items:[
        {n:'Instituto de Matemática',w:'Bloco C, sala 103',h:[540,1020]},
        {n:'Biblioteca do IM (Leopoldo Nachbin)',w:'Bloco C, sala 120',h:[510,1230]},
        {n:'Instituto de Física',w:'Bloco A, 3º andar, sala 342-A',h:null},
        {n:'Biblioteca do IF (Plínio Sussekind Rocha)',w:'Bloco A, 3º andar, sala 340',h:[510,1230]},
        {n:'Instituto de Química',w:'Bloco A, 6º andar, sala 632',h:[660,900]},
        {n:'Biblioteca do IQ',w:'Bloco A, sala 527',h:[540,1230]}]}
    ],
    tips:['Do CCMN ao CT dá para ir a pé em poucos minutos.','Biblioteca do CT: Bloco B, 2º andar, das 7h às 19h.','Para voltar à Estação BRT, as linhas 1, 4 e 5 passam na parada CCMN / CT.']}
};
function hrs(h){function f(m){var x=Math.floor(m/60),y=m%60;return x+'h'+(y?String(y).padStart(2,'0'):'')}return f(h[0])+' às '+f(h[1])}
function openPill(h,now){
  if(!h)return '<span class="pill warn">Sem horário</span>';
  if(isWeekend()&&!state.manual)return '<span class="pill bad">Fechado</span>';
  if(now>=h[0]&&now<h[1])return now>=h[1]-30?'<span class="pill warn">Fecha em '+(h[1]-now)+' min</span>':'<span class="pill good">Aberto</span>';
  return '<span class="pill bad">Fechado</span>';
}
function placeHTML(id,now){
  var p=PLACES[id];
  return '<section class="place"><div><p class="eyebrow">Guia do prédio · seg. a sex.</p><h2>'+p.name+'</h2><p class="muted">'+p.full+'</p></div>'+
    '<p class="small mono muted">'+p.addr+'</p><p>'+p.intro+'</p>'+
    p.groups.map(function(g){
      return '<h3>'+g.title+'</h3><ul class="hours">'+g.items.map(function(it){
        return '<li><span class="grow"><b>'+it.n+'</b><small>'+it.w+'</small></span><span class="hr"><span class="mono">'+(it.h?hrs(it.h):'—')+'</span>'+openPill(it.h,now)+'</span></li>';
      }).join('')+'</ul>';
    }).join('')+
    '<ul class="tips">'+p.tips.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul></section>';
}
/* ---------- Wi-Fi aberto (exemplos) ---------- */
var WIFI={
  est:{name:'Estação de Integração (BRT)',p:[263.9,347.9],avg:2.4,votes:12,note:'Oscila nos horários de pico.'},
  ccs:{name:'CCS, área de convivência',p:[359.7,287.7],avg:3.6,votes:19,note:'Melhor perto das cantinas.'},
  ru:{name:'Restaurante Universitário',p:[430.6,334.5],avg:3.1,votes:27,note:'Costuma cair no horário do almoço.'},
  bib:{name:'Biblioteca do CT',p:[874.5,490],avg:4.5,votes:34,note:'Sinal bom nas mesas do fundo.'},
  letras:{name:'Faculdade de Letras',p:[938.9,365.3],avg:3.8,votes:16,note:'Bom no pátio e nas salas de estudo.'},
  reit:{name:'Reitoria / EBA / FAU',p:[1012.8,373.8],avg:3.3,votes:10,note:'Fraco nos andares altos.'},
  parque:{name:'Parque Tecnológico',p:[1168.2,263],avg:4.1,votes:9,note:'Funciona melhor nos saguões.'}
};
/* ---------- tutorial eduroam (TIC/UFRJ e RNP) ---------- */
var EDU=[
  {t:'Cadastre o e-mail do eduroam na Intranet UFRJ',b:['Entre com seu CPF e a senha da Intranet e informe um e-mail. Confirme pela mensagem que chega nele.','<a href="https://intranet.ufrj.br/atualizar-email-eduroam" target="_blank" rel="noopener">intranet.ufrj.br/atualizar-email-eduroam</a>','A RNP leva até 24 horas para ativar o cadastro. Faça isso antes da primeira semana de aula.']},
  {t:'Apague configurações antigas do eduroam',b:['No celular: Configurações › Wi-Fi › toque e segure “eduroam” › Esquecer rede. Use os dados móveis para o próximo passo.']},
  {t:'Instale o app geteduroam',b:['É o assistente oficial recomendado pela RNP. Ele configura a segurança da rede sozinho.','<a href="https://play.google.com/store/apps/details?id=app.eduroam.geteduroam" target="_blank" rel="noopener">Android (Google Play)</a> · <a href="https://apps.apple.com/no/app/geteduroam/id1504076137" target="_blank" rel="noopener">iPhone (App Store)</a>']},
  {t:'Escolha a UFRJ e entre com seus dados',b:['Na tela inicial, busque “UFRJ” (Universidade Federal do Rio de Janeiro). Usuário: o e-mail cadastrado no passo 1. Senha: a sua senha da Intranet UFRJ.','Toque em “Connect to network” e depois em “Permitir”.']},
  {t:'Pronto: conecta sozinho, aqui e no mundo',b:['O aparelho entra no eduroam automaticamente em qualquer instituição participante, no Brasil e em outros países. Não desinstale o app; ele guarda o perfil da rede.','Se trocar a senha da Intranet, atualize a senha salva no eduroam.']}
];
var DKEY='cse-ufrj-edu-v1',eduDone={};
try{eduDone=JSON.parse(localStorage.getItem(DKEY))||{}}catch(e){eduDone={}}
function eduHTML(){
  var n=EDU.filter(function(s,i){return eduDone[i]}).length;
  return '<button class="back" type="button" data-go="home">← Voltar</button>'+
    '<div><p class="eyebrow">Tutorial · Wi-Fi global das universidades</p><h2>Como entrar no eduroam</h2></div>'+
    '<p>O eduroam é a rede Wi-Fi gratuita da comunidade acadêmica. Com o login da UFRJ, você se conecta no Fundão e em milhares de universidades e centros de pesquisa pelo mundo, sem pedir senha a ninguém.</p>'+
    '<div class="cmp"><div><b>eduroam</b>Gratuita, com login. Conexão criptografada; serve para banco e senhas.</div><div><b>Wi-Fi aberto</b>Gratuito, sem login. Sem criptografia; use só para coisas simples.</div></div>'+
    '<dl class="cred"><dt>Rede</dt><dd class="mono">eduroam</dd><dt>Usuário</dt><dd>E-mail cadastrado no eduroam</dd><dt>Senha</dt><dd>Senha da Intranet UFRJ</dd></dl>'+
    '<h3>Configurar agora</h3>'+eduCfgHTML(true)+'<h3>Passo a passo</h3>'+'<div><p class="small muted" id="eduprog">'+n+' de '+EDU.length+' passos feitos</p><div class="progress" aria-hidden="true"><i style="width:'+(n/EDU.length*100)+'%"></i></div></div>'+
    '<ol class="steps">'+EDU.map(function(s,i){
      return '<li class="'+(eduDone[i]?'done':'')+'"><input type="checkbox" id="edu'+i+'" data-edu="'+i+'"'+(eduDone[i]?' checked':'')+' aria-label="Marcar passo '+(i+1)+' como feito"><label class="st-t" for="edu'+i+'">'+(i+1)+'. '+s.t+'</label><div class="st-b">'+s.b.map(function(x){return '<span>'+x+'</span>'}).join('')+'</div></li>';
    }).join('')+'</ol>'+
    '<details class="det"><summary>Sem o app (conexão manual)</summary><p class="small muted">Use só dentro da UFRJ, onde a rede é genuína. Escolha a rede eduroam, digite o e-mail completo e a senha, e toque em “Confiar” no certificado.</p></details>'+
    '<details class="det"><summary>Onde tem eduroam?</summary><p class="small muted">Veja os locais no <a href="https://monitor.eduroam.org/map_service_loc.php" target="_blank" rel="noopener">mapa do eduroam</a> ou no app eduroam Companion. Problemas com a senha: <a href="https://servicos.tic.ufrj.br/" target="_blank" rel="noopener">Central de Serviços da TIC/UFRJ</a>.</p></details>';
}
var KEY='cse-ufrj-ratings-v1',PKEY='cse-ufrj-prefs-v1';
var mine={},prefs={};
try{mine=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){mine={}}
try{prefs=JSON.parse(localStorage.getItem(PKEY))||{}}catch(e){prefs={}}
function saveMine(){try{localStorage.setItem(KEY,JSON.stringify(mine))}catch(e){}}
function savePrefs(){try{localStorage.setItem(PKEY,JSON.stringify({from:state.from,to:state.to}))}catch(e){}if(!ACC.mute)accQueue()}
/* a rede pode ter sido removida pela gestão enquanto a tela ainda mostra o ponto: nunca quebre por isso */
function avgOf(id){
  var w=WIFI[id];
  if(SH.on){var v=SH.votes[id];if(v&&v.n)return v.s/v.n;return w?w.avg:0}
  if(!w)return 0;
  var m=mine[id];return m?(w.avg*w.votes+m)/(w.votes+1):w.avg;
}
function votesOf(id){
  var w=WIFI[id];
  if(SH.on){var v=SH.votes[id];return v&&v.n?v.n:(w?w.votes:0)}
  if(!w)return 0;
  return w.votes+(mine[id]?1:0);
}
function info(avg){var b=avg>=4.3?4:avg>=3.5?3:avg>=2.5?2:1;return {bars:b,label:['','Fraco','Regular','Bom','Muito bom'][b],tone:b>=3?'good':b===2?'warn':'bad'}}
function d2(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1])}
function wifiNearStop(sid){return Object.keys(WIFI).filter(function(w){return d2(WIFI[w].p,STOPS[sid].p)<=95}).sort(function(a,b){return avgOf(b)-avgOf(a)})}
function stopsNearWifi(wid){if(!WIFI[wid])return [];return Object.keys(STOPS).filter(function(s){return d2(WIFI[wid].p,STOPS[s].p)<=95})}
/* ---------- estado ---------- */
var SORTED=Object.keys(STOPS).sort(function(a,b){if(a==='est')return -1;if(b==='est')return 1;return STOPS[a].name.localeCompare(STOPS[b].name,'pt')});
var state={layers:{bus:true,wifi:(function(){try{return localStorage.getItem('cse-lay-wifi')==='1'}catch(e){return false}})()},sel:null,
  from:STOPS[prefs.from]?prefs.from:'est',to:STOPS[prefs.to]?prefs.to:'ctl',manual:false,clk:''};
if(state.from===state.to)state.to=state.from==='ctl'?'est':'ctl';
function realNow(){var d=new Date();return d.getHours()*60+d.getMinutes()}
function nowMin(){return (state.manual&&state.clk)?toMin(state.clk):realNow()}
/* ---------- mapa ---------- */
/* rosa dos ventos: neste mapa o norte fica ~50° à esquerda do "para cima" (HU → Reitoria aponta para sudeste) */
var NORTH=-56.4;
function rose(cx,cy,r,deg){
  var s='<g class="rose" aria-hidden="true" transform="translate('+cx+','+cy+')"><circle class="rose-disc" r="'+(r+14)+'"/><circle class="rose-ring" r="'+(r-14)+'"/>';
  s+='<g transform="rotate('+deg+')">';
  [45,135,225,315].forEach(function(a){s+='<path class="rose-q" transform="rotate('+a+')" d="M0,'+(-r*0.62)+' L7,0 L0,7 L-7,0Z"/>'});
  [90,180,270].forEach(function(a){s+='<path class="rose-p" transform="rotate('+a+')" d="M0,'+(-r)+' L10,0 L0,10 L-10,0Z"/>'});
  s+='<path class="rose-n" d="M0,'+(-r)+' L10,0 L0,10 L-10,0Z"/><circle r="3.5" class="rose-n"/></g>';
  [['N',0],['L',90],['S',180],['O',270]].forEach(function(c){
    var a=(c[1]+deg)*Math.PI/180,d=r+30;
    s+='<text class="rose-lb'+(c[0]==='N'?'':' dim')+'" x="'+(Math.sin(a)*d).toFixed(1)+'" y="'+(-Math.cos(a)*d).toFixed(1)+'">'+c[0]+'</text>';
  });
  return s+'</g>';
}
/* ---------- mapa vetorial (traçado a partir do mapa da Prefeitura Universitária) ---------- */
/* tema claro usa as versões claras do mapa; decide já na carga, para não baixar as duas */
var MAPSUF=(function(){try{var t=CFG.tema||'escuro';if(t==='claro')return '-claro';if(t==='escuro'||t==='horario')return '';return window.matchMedia('(prefers-color-scheme: light)').matches?'-claro':''}catch(e){return ''}})();
/* endereço de cada imagem da planta. No site, tools/build_site.py troca a pasta e põe em MAPA_V uma marca do conteúdo
   de cada imagem: quando a imagem muda, o endereço muda e o aparelho baixa de novo (em vez de mostrar a cópia guardada) */
var MAPA_DIR='',MAPA_V={"mapa-blur-claro.jpg":"a623be208f","mapa-blur.jpg":"eeab4c20a0","mapa-bordas-claro.jpg":"86153d48d7","mapa-bordas.jpg":"c88b82a8e7","mapa-campus-claro.jpg":"b307cf89c4","mapa-campus-claro.svg":"28ebea3feb","mapa-campus.jpg":"b4dc398960","mapa-campus.svg":"1e27187281","mapa-mini-claro.jpg":"f820802175","mapa-mini.jpg":"4d66caafdd"};
function mapaUrl(nome){return MAPA_DIR+nome+(MAPA_V[nome]?'?v='+MAPA_V[nome]:'')}
var MAPIMG=mapaUrl('mapa-bordas'+MAPSUF+'.jpg');
/* mapa base: planta cadastral da Cidade Universitária (ETU/UFRJ), vetorizada; JPG para a visão geral, SVG nítido no zoom */
var MAPHD=window.MAPHD_URL=mapaUrl('mapa-campus'+MAPSUF+'.jpg'),MAPVEC=mapaUrl('mapa-campus'+MAPSUF+'.svg'),MAPMINI=mapaUrl('mapa-mini'+MAPSUF+'.jpg'),MAPBLUR=mapaUrl('mapa-blur'+MAPSUF+'.jpg'),MAPVEC0=mapaUrl('mapa-campus.svg');
/* nomes recriados como texto: [texto, x, y, classe, nível de zoom, rotação] */
/* guaritas (posições do mapa da Prefeitura; o nº 33 da legenda é "Guaritas / DISEG") */
var GUARDS={
  g1:{name:'Guarita 1',short:'G1',where:'Acesso pela Linha Vermelha, sentido Ilha do Governador e Baixada.',p:[256.4,378.8]},
  g2:{name:'Guarita 2',short:'G2',where:'Acesso pela Av. Brasil.',p:[391.1,444.5]},
  g3:{name:'Guarita 3',short:'G3',where:'Acesso pela Linha Amarela e pela Linha Vermelha, sentido Centro.',p:[816.9,564.2]}
};
var svg=$('#map'),gLines,gStops,gWifi,gGuard,gLab;
/* rotação desativada (o mapa base tem nomes na horizontal); ROT fica 0 */
var ROT=0;
function U(p){return ROT?[-p[1],p[0]]:p}
function bounds(){return ROT?{x:-(BASE.y+BASE.h),y:BASE.x,w:BASE.h,h:BASE.w}:BASE}
/* área onde dá para arrastar o mapa: a planta e o que as partes acrescentarem (as ruas ao redor, com os ônibus da cidade) */
var LIMITES_EXTRA=[];
function limitesMapa(){var B=bounds();LIMITES_EXTRA.forEach(function(f){var E=f();if(!E)return;var x0=Math.min(B.x,E.x),y0=Math.min(B.y,E.y);B={x:x0,y:y0,w:Math.max(B.x+B.w,E.x+E.w)-x0,h:Math.max(B.y+B.h,E.y+E.h)-y0}});return B}
function wantRot(){return 0}
function orient(){
  var r=wantRot();if(r===ROT)return false;
  ROT=r;var w=$('#world');if(w)w.setAttribute('transform','rotate('+ROT+')');var w0=$('#world0');if(w0)w0.setAttribute('transform','rotate('+ROT+')');
  var rb=$('#rosebox');if(rb)rb.innerHTML='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,NORTH+ROT)+'</svg>';
  return true;
}
var BASE={x:109,y:-45,w:1233,h:701},view={x:109,y:-45,w:1233,h:701},fitW=1233,REF=0.83,MS=1,suppressClick=false;
function mbars(n){var s='',hs=[6,10,14,18];for(var i=0;i<4;i++)s+='<rect class="wb'+(i<n?'':' off')+'" x="'+(-11.5+i*6.2)+'" y="'+(9-hs[i])+'" width="4.4" height="'+hs[i]+'" rx="1.2"/>';return s}
function f1(p){return (+p[0].toFixed(1))+','+(+p[1].toFixed(1))}
/* polilinha com cantos arredondados (curvas suaves nas esquinas e rotatórias) */
function roundPath(pts,r){
  var q=[];pts.forEach(function(p){var l=q[q.length-1];if(!l||Math.abs(l[0]-p[0])>0.01||Math.abs(l[1]-p[1])>0.01)q.push(p)});
  if(q.length<2)return '';
  var d='M'+f1(q[0]);
  for(var i=1;i<q.length-1;i++){
    var a=q[i-1],b=q[i],c=q[i+1],l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]),rr=Math.min(r,l1/2,l2/2);
    var p1=[b[0]-(b[0]-a[0])/l1*rr,b[1]-(b[1]-a[1])/l1*rr],p2=[b[0]+(c[0]-b[0])/l2*rr,b[1]+(c[1]-b[1])/l2*rr];
    d+=' L'+f1(p1)+' Q'+f1(b)+' '+f1(p2);
  }
  return d+' L'+f1(q[q.length-1]);
}
function mk(kind,id,p,label,inner){
  return '<g class="mk '+kind+'" data-kind="'+kind+'" data-id="'+id+'" data-x="'+p[0]+'" data-y="'+p[1]+'" tabindex="0" role="button" aria-label="'+label+'" transform="translate('+p[0]+','+p[1]+')">'+inner+'</g>';
}
function buildMap(){
  etapas('mapa vai montar');
  $('#mapbase').innerHTML='<g id="world0" transform="rotate('+ROT+')"><g id="baseimg"><image href="'+MAPIMG+'" x="-270" y="-340" width="2034" height="1300" preserveAspectRatio="none" decoding="async"/><image id="imgHD" href="'+MAPHD+'" x="109" y="-45" width="1233" height="701" preserveAspectRatio="none" decoding="async"/><image id="imgVec"'+(vecOn?' href="'+MAPVEC+'"':'')+' x="109" y="-45" width="1233" height="701" preserveAspectRatio="none"/></g></g>';
  var s='<rect class="v-hit" x="-3000" y="-3000" width="8000" height="8000"/>';
  s+='<g id="world" transform="rotate('+ROT+')">';
  s+='<g id="gLines">';
  Object.keys(LINES).forEach(function(id){
    LINES[id].trips.forEach(function(tr){
      s+='<path class="ln'+(LINES[id].susp?' susp':'')+'" data-line="'+id+'" style="stroke:var(--m'+id+')" d="'+roundPath(tr.pts,0)+'"/>';
    });
  });
  /* onda que corre no sentido do ônibus: cauda na cor da linha, cabeça clara (os trechos seguem a ordem das paradas) */
  s+='</g><g id="gFlow" aria-hidden="true">';var kf='';
  Object.keys(LINES).forEach(function(id){
    /* ida e volta encadeadas (a volta sai de onde a ida termina) viram um circuito só, como nas outras linhas;
       trechos soltos são animados um de cada vez, nunca duas pontas ao mesmo tempo */
    if(LINES[id].susp||!LINES[id].trips.length)return;
    var c='var(--m'+id+')',tps=LINES[id].trips.map(function(tr){return tr.pts});
    var chain=tps.every(function(q,n){if(!n)return true;var e=tps[n-1][tps[n-1].length-1];return e[0]===q[0][0]&&e[1]===q[0][1]});
    if(chain&&tps.length>1){var all=[];tps.forEach(function(q){q.forEach(function(pt,k){if(k||!all.length)all.push(pt)})});tps=[all]}
    var parts=tps.map(function(pts){var L=0;
      for(var k=1;k<pts.length;k++)L+=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]);
      return {d:roundPath(pts,0),du:Math.max(2.4,Math.min(5,L/320))}});
    var T=parts.reduce(function(a,q){return a+q.du},0),t0=0,inner='';
    parts.forEach(function(q,n){
      var cls=parts.length>1?' t'+n:'';
      if(parts.length>1){var a=t0/T*100,w=q.du/T*100,f=function(x){return Math.max(0,Math.min(100,x)).toFixed(3)+'%'},nm='rd'+id.replace(/\W/g,'_')+'_'+n;
        kf+='@keyframes '+nm+'{0%{stroke-dashoffset:1}'+f(a)+'{stroke-dashoffset:1}'+f(a+w*.48)+'{stroke-dashoffset:0}'+f(a+w*.58)+'{stroke-dashoffset:0}'+f(a+w)+'{stroke-dashoffset:-1}100%{stroke-dashoffset:-1}}'+
          '#gFlow:not(.off) .fl.on[data-line="'+id+'"] .fw.t'+n+'{animation-name:'+nm+'}';}
      inner+='<path class="fw gl'+cls+'" pathLength="1" d="'+q.d+'" style="stroke:'+c+'"/><path class="fw dr'+cls+'" pathLength="1" d="'+q.d+'" style="stroke:'+c+'"/>';
      t0+=q.du;
    });
    var du=T.toFixed(2);
    s+='<g class="fl" data-line="'+id+'" data-dur="'+du+'" style="--dur:'+du+'s">'+inner+'</g>';
  });
  var kfEl=document.getElementById('flowKF');if(!kfEl){kfEl=document.createElement('style');kfEl.id='flowKF';document.head.appendChild(kfEl)}kfEl.textContent=kf;
  s+='</g><g id="gStops">';
  Object.keys(STOPS).forEach(function(id){
    var st=STOPS[id],ls=linesAt(id),hub=ls.length>2,r=id==='est'?15:(hub?12:9);
    s+=mk('stop'+(hub?' hub':'')+(st.off?' stoff':''),id,st.p,'Parada '+st.name+(st.off?' (desativada)':'')+', linhas '+ls.join(', '),'<circle class="hit" r="'+(r+10)+'"/><circle class="dot" r="'+r+'"/>').replace(/data-kind="stop[^"]*"/,'data-kind="stop"');
  });
  s+='</g><g id="gGuard">';
  Object.keys(GUARDS).forEach(function(id){
    var g=GUARDS[id];
    s+=mk('guard',id,g.p,g.name+', segurança','<circle class="hit" r="22"/><rect x="-11" y="-11" width="22" height="22" rx="4" transform="rotate(45)"/><text y="0.5">'+g.short+'</text>');
  });
  s+='</g><g id="gSvc" class="off">'+SVC.map(svcMarker).join('')+'</g><g id="gWifi">';
  Object.keys(WIFI).forEach(function(id){
    s+=mk('wifi',id,WIFI[id].p,'Wi-Fi aberto: '+WIFI[id].name,'<circle class="hit" r="26"/><rect class="wbox" x="-17" y="-17" width="34" height="34" rx="8"/><g class="wbars">'+mbars(info(avgOf(id)).bars)+'</g>');
  });
  s+='</g><g id="gRep"></g><g id="gLab" pointer-events="none"></g></g>';
  svg.innerHTML=s;
  gLines=$('#gLines');gStops=$('#gStops');gWifi=$('#gWifi');gGuard=$('#gGuard');gLab=$('#gLab');gSvc=$('#gSvc');gRep=$('#gRep');
  etapas('mapa montado');
}
/* ---------- zoom e arrasto ---------- */
/* a caixa do mapa na tela fica guardada: ler getBoundingClientRect a cada quadro obrigava o navegador a refazer o
   layout depois de mover os ônibus (no celular, mais de 1 s a cada 8 s de arrasto). Renova ao rolar, redimensionar
   e no começo de cada toque. */
var BOX=null;
function box(){if(!BOX){var r=svg.getBoundingClientRect();BOX={l:r.left,t:r.top,w:Math.max(1,r.width),h:Math.max(1,r.height)}}return BOX}
function boxRenova(){BOX=null}
addEventListener('scroll',boxRenova,{passive:true,capture:true});addEventListener('resize',boxRenova);
if(window.ResizeObserver)new ResizeObserver(boxRenova).observe(svg);
function clampView(){
  var b=box(),minW=b.w/7;
  view.w=Math.max(minW,Math.min(fitW,view.w));view.h=view.w*b.h/b.w;
  var cx=view.x+view.w/2,cy=view.y+view.h/2;
  var B=limitesMapa();cx=Math.max(B.x,Math.min(B.x+B.w,cx));cy=Math.max(B.y,Math.min(B.y+B.h,cy));
  view.x=cx-view.w/2;view.y=cy-view.h/2;
}
var raf=0;
var lastMS=-1,lastMk=-1,lblT=0,lastGesture=0,mapBase=null;
var vecOn=false,vecLoading=false;
function loadVec(){
  if(vecOn||vecLoading||perfEff()==='leve')return;vecLoading=true;
  var im=new Image();im.onload=function(){vecOn=true;var e=$('#imgVec');if(e)e.setAttribute('href',MAPVEC)};im.onerror=function(){vecLoading=false};im.src=MAPVEC;
}
function applyView(force){
  clampView();
  var vb=view.x.toFixed(2)+' '+view.y.toFixed(2)+' '+view.w.toFixed(2)+' '+view.h.toFixed(2);
  svg.setAttribute('viewBox',vb);if(!mapBase)mapBase=$('#mapbase');if(mapBase)mapBase.setAttribute('viewBox',vb);
  var bw=box().w,ppu=bw/view.w;MS=REF/ppu*(bw<680?0.8:1);
  if(!vecOn&&ppu*(window.devicePixelRatio||1)>1.7)loadVec();
  svg.classList.toggle('z2',ppu>1.25);svg.classList.toggle('z3',ppu>2.1);
  var mks=svg.querySelectorAll('.mk');
  if(force===true||MS!==lastMS||mks.length!==lastMk){
    svg.style.setProperty('--fw',(5/ppu).toFixed(2));
    var sc=' scale('+MS.toFixed(3)+')',rr=ROT?' rotate('+(-ROT)+')':'';
    for(var i=0;i<mks.length;i++){var el=mks[i];el.setAttribute('transform','translate('+el.dataset.x+','+el.dataset.y+')'+rr+sc)}
    lastMS=MS;lastMk=mks.length;
  }
  var z=$('#zoomlvl');if(z)z.textContent=Math.round(fitW/view.w*100)+'%';
  if(gLab){clearTimeout(lblT);if(Date.now()-lastGesture<160)lblT=setTimeout(drawLabels,170);else drawLabels()};etapas('vista aplicada',force);}
function schedule(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;applyView()})}
function fitView(){
  var b=box(),ar=b.h/b.w,B=bounds();
  if(ar>=B.h/B.w){view.w=B.w;view.h=view.w*ar}else{view.h=B.h;view.w=view.h/ar}
  fitW=view.w;view.x=B.x+B.w/2-view.w/2;view.y=B.y+B.h/2-view.h/2;
}
function toMap(cx,cy){var b=box();return [view.x+(cx-b.l)/b.w*view.w,view.y+(cy-b.t)/b.h*view.h]}
function zoomAt(m,f){var nw=Math.max(box().w/7,Math.min(fitW,view.w/f)),k=nw/view.w;view.x=m[0]-(m[0]-view.x)*k;view.y=m[1]-(m[1]-view.y)*k;view.w=nw;view.h=nw*box().h/box().w;schedule()}
function centerMap(){return [view.x+view.w/2,view.y+view.h/2]}
/* zoom pelos botões: aproxima do item escolhido; sem escolha, do eixo central do campus (o centro da tela inteira cai na baía) */
function focusPoint(){
  var s=state.sel,o=null;
  if(s&&s.kind==='stop')o=STOPS[s.id];else if(s&&s.kind==='wifi')o=WIFI[s.id];else if(s&&s.kind==='guard')o=GUARDS[s.id];
  else if(s&&s.kind==='night')o=STOPS[state.nightFrom];else if(s&&s.kind==='place')o=PL[s.id];else if(s&&s.kind==='svc')o=SVCMAP[s.id];else if(!s)o=STOPS[state.to];
  var c=centerMap();
  if(o){var q=U(o.p);if(q[0]>view.x&&q[0]<view.x+view.w&&q[1]>view.y&&q[1]<view.y+view.h)return q}
  return Math.abs(view.w-fitW)<1?U([724,405]):c;
}
function ensureVisible(p){
  p=U(p);var mx=view.w*0.12,my=view.h*0.12;
  if(p[0]<view.x+mx||p[0]>view.x+view.w-mx||p[1]<view.y+my||p[1]>view.y+view.h-my){view.x=p[0]-view.w/2;view.y=p[1]-view.h/2;schedule()}
}
function initZoom(){
  orient();fitView();
  if(!ROT&&box().w<680){var c=[665,382];view.w=Math.min(fitW,700,860*box().w/box().h);view.h=view.w*box().h/box().w;view.x=c[0]-view.w/2;view.y=Math.max(BASE.y-60,Math.min(c[1]-view.h/2,BASE.y+BASE.h+40-view.h))}
  applyView();
  var pts={},start=null,moved=0;
  svg.addEventListener('wheel',function(e){e.preventDefault();if(Date.now()-lastGesture>300)boxRenova();lastGesture=Date.now();zoomAt(toMap(e.clientX,e.clientY),Math.exp(-e.deltaY*(e.deltaMode===1?0.05:0.0016)))},{passive:false});
  svg.addEventListener('pointerdown',boxRenova,true);
  svg.addEventListener('pointerdown',function(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    pts[e.pointerId]={x:e.clientX,y:e.clientY};moved=0;
    if(Object.keys(pts).length===1)start={x:e.clientX,y:e.clientY};
  });
  svg.addEventListener('pointermove',function(e){
    var p=pts[e.pointerId];if(!p)return;
    var ids=Object.keys(pts),b=box();lastGesture=Date.now();
    if(ids.length===1){
      var dx=e.clientX-p.x,dy=e.clientY-p.y;
      moved+=Math.abs(dx)+Math.abs(dy);
      if(moved>6){
        if(!svg.classList.contains('dragging')){svg.classList.add('dragging');try{svg.setPointerCapture(e.pointerId)}catch(err){}}
        view.x-=dx*view.w/b.w;view.y-=dy*view.h/b.h;schedule();
      }
      p.x=e.clientX;p.y=e.clientY;
    }else if(ids.length===2){
      var o=pts[ids[0]===String(e.pointerId)?ids[1]:ids[0]];
      var d0=Math.hypot(p.x-o.x,p.y-o.y),d1=Math.hypot(e.clientX-o.x,e.clientY-o.y);
      var m0=[(p.x+o.x)/2,(p.y+o.y)/2],m1=[(e.clientX+o.x)/2,(e.clientY+o.y)/2];
      if(d0>0){zoomAt(toMap(m1[0],m1[1]),d1/d0)}
      view.x-=(m1[0]-m0[0])*view.w/b.w;view.y-=(m1[1]-m0[1])*view.h/b.h;
      moved+=99;p.x=e.clientX;p.y=e.clientY;schedule();
    }
  });
  function up(e){
    if(!pts[e.pointerId])return;
    delete pts[e.pointerId];
    if(moved>6)suppressClick=true;
    if(!Object.keys(pts).length){svg.classList.remove('dragging');lastGesture=0;clearTimeout(lblT);if(gLab)drawLabels();setTimeout(function(){suppressClick=false},0)}
  }
  svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);svg.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')up(e)});
  svg.addEventListener('dblclick',function(e){e.preventDefault();zoomAt(toMap(e.clientX,e.clientY),1.8)});
  $('#zin').addEventListener('click',function(){var f=focusPoint();zoomAt(f,1.6);view.x+=(f[0]-(view.x+view.w/2))*0.5;view.y+=(f[1]-(view.y+view.h/2))*0.5;schedule()});
  $('#zout').addEventListener('click',function(){zoomAt(centerMap(),1/1.6)});
  $('#zfit').addEventListener('click',function(){fitView();applyView()});
  svg.addEventListener('keydown',function(e){
    if(e.target!==svg)return;
    if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(centerMap(),1.4)}
    else if(e.key==='-'){e.preventDefault();zoomAt(centerMap(),1/1.4)}
  });
  var lastW=box().w;
  if(window.ResizeObserver)new ResizeObserver(function(){if(orient()){lastW=box().w;fitView();applyView();return}var w=box().w;if(Math.abs(w-lastW)<1&&Math.abs(view.h-view.w*box().h/w)<0.5)return;var keep=fitW/view.w,c=centerMap();lastW=w;fitView();view.w=fitW/keep;view.h=view.w*box().h/box().w;view.x=c[0]-view.w/2;view.y=c[1]-view.h/2;applyView()}).observe(svg);
}
var planBest=null;
function activeLines(){
  if(!state.sel)return planBest?[planBest.lid]:null;
  if(state.sel.kind==='line')return [state.sel.id];
  if(state.sel.kind==='stop')return linesAt(state.sel.id);
  if(state.sel.kind==='night')return linesAt(state.nightFrom);
  return null;
}
/* rótulo sempre de pé, acima do ponto na tela, sem sair pelas bordas */
function label(p,txt,off){
  var half=(txt.length*6.5+8)*MS,u=U(p);if(u[0]<view.x||u[0]>view.x+view.w||u[1]<view.y||u[1]>view.y+view.h)return '';
  var dx=Math.min(view.x+view.w-half,Math.max(view.x+half,u[0]))-u[0];
  return '<g transform="translate('+p[0]+','+p[1]+')'+(ROT?' rotate('+(-ROT)+')':'')+'"><text class="sl halo" x="'+dx.toFixed(1)+'" y="'+(-off*MS).toFixed(1)+'" text-anchor="middle" style="font-size:'+(21*MS).toFixed(2)+'px;stroke-width:'+(6*MS).toFixed(2)+'px">'+txt+'</text></g>';
}
/* nomes dos pontos ao dar zoom (a partir de ~150% no computador); evita sobreposição */
function lblBox(p,txt,off,fs){var u=U(p),w=txt.length*fs*0.56*MS,hh=fs*1.2*MS;return {x:u[0]-w/2,y:u[1]-off*MS-hh*0.8,w:w,h:hh}}
function hits(a,b){return a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h}
function pointLabels(skip,taken){
  var ppu=box().w/view.w;if(ppu<(box().w<680?0.8:1.2))return '';
  var fs=14,list=[];
  if(state.layers.bus)Object.keys(STOPS).forEach(function(id){var st=STOPS[id],hub=linesAt(id).length>2;list.push({p:st.p,t:st.short||st.name,full:st.name,r:id==='est'?15:(hub?12:9),pr:hub?1:2})});
  Object.keys(GUARDS).forEach(function(id){var g=GUARDS[id];list.push({p:g.p,t:g.name,full:g.name,r:15,pr:3})});
  if(state.layers.wifi)Object.keys(WIFI).forEach(function(id){var w=WIFI[id];list.push({p:w.p,t:w.name,full:w.name,r:17,pr:4})});
  SVC.forEach(function(sv){if(svcVisible(sv))list.push({p:sv.p,t:sv.name,full:sv.full,r:12,pr:5})});
  list.sort(function(a,b){return a.pr-b.pr});
  var s='',marks=list.map(function(it){var u=U(it.p),r=it.r*MS;return {x:u[0]-r,y:u[1]-r,w:2*r,h:2*r}});
  list.forEach(function(it){
    if(skip[it.full])return;
    var u=U(it.p);
    if(u[0]<view.x||u[0]>view.x+view.w||u[1]<view.y||u[1]>view.y+view.h)return;
    var w=it.t.length*fs*0.56*MS,hh=fs*1.15*MS,gap=(it.r+5)*MS;
    var cands=[{dx:0,dy:gap+hh*0.85,a:'middle',bx:u[0]-w/2,by:u[1]+gap},{dx:0,dy:-gap-hh*0.2,a:'middle',bx:u[0]-w/2,by:u[1]-gap-hh},{dx:gap,dy:hh*0.35,a:'start',bx:u[0]+gap,by:u[1]-hh/2},{dx:-gap,dy:hh*0.35,a:'end',bx:u[0]-gap-w,by:u[1]-hh/2}];
    for(var i=0;i<cands.length;i++){
      var c=cands[i],bb={x:c.bx,y:c.by,w:w,h:hh};
      if(bb.x<view.x||bb.x+bb.w>view.x+view.w)continue;
      if(taken.some(function(t){return hits(t,bb)})||marks.some(function(m){return hits(m,bb)}))continue;
      taken.push(bb);
      s+='<g transform="translate('+it.p[0]+','+it.p[1]+')'+(ROT?' rotate('+(-ROT)+')':'')+'"><text class="pt-lbl halo" x="'+c.dx.toFixed(1)+'" y="'+c.dy.toFixed(1)+'" text-anchor="'+c.a+'" style="font-size:'+(fs*MS).toFixed(2)+'px;stroke-width:'+(4.5*MS).toFixed(2)+'px">'+it.t+'</text></g>';
      break;
    }
  });
  return s;
}
function drawLabels(){
  var s='',sel=state.sel,o=null;
  if(sel&&sel.kind==='stop')o=STOPS[sel.id];
  else if(sel&&sel.kind==='wifi')o=WIFI[sel.id];
  else if(sel&&sel.kind==='guard')o=GUARDS[sel.id];
  else if(sel&&sel.kind==='night')o=STOPS[state.nightFrom];
  else if(sel&&sel.kind==='place')o=PL[sel.id];
  else if(sel&&sel.kind==='svc')o={p:SVCMAP[sel.id].p,name:SVCMAP[sel.id].name};
  var skip={},taken=[];
  if(o){s+=label(o.p,o.name,34);skip[o.name]=1;taken.push(lblBox(o.p,o.name,34,21))}
  else if(!sel&&state.layers.bus)[state.from,state.to].forEach(function(id){var st=STOPS[id],n=st.short||st.name;s+=label(st.p,n,30);skip[st.name]=1;taken.push(lblBox(st.p,n,30,21))});
  s+=pointLabels(skip,taken);
  if(CFG.bldn!==false)s=bldLabels(taken)+s;
  gLab.innerHTML=s;
}
/* ======================= nomes dos prédios no zoom (da planta da ETU/UFRJ) ======================= */
var BLDN=[["Hospital Universitário",325.7,364,1],["IPPMG (Pediatria)",279.9,370,2],["CCS",352.6,290.8,1],["Instituto de Microbiologia",324.9,274,3],["Escola de Educação Infantil",272.9,345.2,3],["Usina Verde",362.3,235.3,3],["Polo Bio-Rio",377.5,192.6,2],["RU Central",424.4,330.8,1],["EEFD",428.2,302.6,1],["Ginásio",450.8,293.6,3],["Gastronomia",459.3,327.3,3],["Prefeitura · DISEG",417.4,449.2,1],["Horto Universitário",435,461.4,3],["Instituto de Física",750.6,447,2],["Instituto de Química",749.5,396,2],["Instituto de Matemática",753.5,467.9,2],["CCMN",765,501.4,1],["CT 2",936.5,558.2,2],["Macromoléculas",938.2,457,3],["LNDC",961.4,460,3],["Polo de Xistoquímica",1000.4,553.4,2],["Faculdade de Letras",940,379.9,1],["CCJE",908.2,386.2,2],["Reitoria (CLA)",1013.5,367.7,1],["COPPEAD",1027.5,226,1],["Incubadora",1119.3,336.2,2],["Gráfica",1142.3,337.2,3],["Almoxarifado",1172.3,335.9,3],["Frota Oficial",1168.1,355.1,3],["CPST · EBA",1148.4,362,3],["DIPRO",423.9,83.6,2],["UFRJ-Mar",469.3,45.6,3],["Escola Tenente Antônio João",1020.9,213.3,3]];
function bldLabels(taken){
  var ppu=box().w/view.w,mob=box().w<680;
  if(ppu<(mob?1.5:2.2))return '';
  var lvl=ppu>=(mob?3:4)?3:ppu>=(mob?2:2.6)?2:1,fs=15,s='';
  var dup={};if(state.layers.wifi)Object.keys(WIFI).forEach(function(k){dup[WIFI[k].name]=1});Object.keys(STOPS).forEach(function(k){dup[STOPS[k].short||STOPS[k].name]=1});
  BLDN.forEach(function(b){
    if(b[3]>lvl||dup[b[0]])return;var p=[b[1],b[2]],u=U(p);
    if(u[0]<view.x||u[0]>view.x+view.w||u[1]<view.y||u[1]>view.y+view.h)return;
    var w=b[0].length*fs*0.55*MS,hh=fs*1.2*MS,bb={x:u[0]-w/2,y:u[1]-hh/2,w:w,h:hh};
    if(taken.some(function(t){return hits(t,bb)}))return;taken.push(bb);
    s+='<g transform="translate('+p[0]+','+p[1]+')'+(ROT?' rotate('+(-ROT)+')':'')+'"><text class="bld-lbl halo" y="'+(hh*0.33).toFixed(1)+'" text-anchor="middle" style="font-size:'+(fs*MS).toFixed(2)+'px;stroke-width:'+(4*MS).toFixed(2)+'px">'+esc(b[0])+'</text></g>';
  });
  return s;
}
/* ---------- várias linhas no ponto: uma de cada vez ---------- */
var seq={key:'',lines:null,i:0,cur:null,t:0};
function flowSeq(lines){
  var gF=$('#gFlow');if(!gF)return;
  var key=lines?lines.join(','):'';
  if(key===seq.key)return;
  seq.key=key;seq.lines=lines;seq.i=0;seq.cur=null;
  gF.classList.toggle('seq',!!lines);svg.classList.toggle('seqing',!!lines);
  gF.querySelectorAll('.fl').forEach(function(el){el.style.setProperty('--dur',el.dataset.dur+'s')});
  if(lines)seqShow();
}
function seqShow(){
  var gF=$('#gFlow');if(!gF||!seq.lines)return;
  var id=seq.lines[seq.i%seq.lines.length],mx=0;seq.cur=id;seq.t=Date.now();
  var gs=gF.querySelectorAll('.fl');
  gs.forEach(function(el){if(el.dataset.line===id)mx=Math.max(mx,+el.dataset.dur)});
  gs.forEach(function(el){var on=el.dataset.line===id;if(on)el.style.setProperty('--dur',mx+'s');el.classList.toggle('on',on)});
  svg.dataset.seqline=id;
}
document.addEventListener('animationiteration',function(e){
  if(!seq.lines||!e.target.classList||!e.target.classList.contains('dr'))return;
  var fl=e.target.closest&&e.target.closest('#gFlow .fl');if(!fl||fl.dataset.line!==seq.cur)return;
  if(Date.now()-seq.t<400)return;
  seq.i++;seqShow();
},true);
function updateMap(){
  gLines.classList.toggle('off',!state.layers.bus);
  gStops.classList.toggle('off',!state.layers.bus);
  gWifi.classList.toggle('off',!state.layers.wifi);
  if(gSvc){gSvc.classList.toggle('off',!state.layers.svc);gSvc.querySelectorAll('.mk').forEach(function(el){el.classList.toggle('off',!svcVisible(SVCMAP[el.dataset.id]))})}
  svg.classList.toggle('night-on',!!state.sel&&(state.sel.kind==='night'||state.sel.kind==='guard'));
  var act=activeLines();
  Array.prototype.slice.call(svg.querySelectorAll('.ln')).forEach(function(el){
    var on=!act||act.indexOf(el.dataset.line)>=0;
    el.classList.toggle('dim',!on);
    if(on&&act)gLines.appendChild(el);
  });
  var gF=$('#gFlow');
  svg.classList.toggle('flowing',!!(state.layers.bus&&CFG.flow&&perfEff()!=='leve'&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches));
  if(gF){gF.classList.toggle('off',!state.layers.bus||!CFG.flow||perfEff()==='leve');gF.classList.toggle('all',!act);
    /* várias linhas (parada, ou nenhuma linha específica: serviço, Wi-Fi, guarita): uma de cada vez */
    var seqL=act&&act.length>1?act:(!act?Object.keys(LINES).filter(function(l){return !LINES[l].susp}):null);
    svg.classList.toggle('seqall',!act);
    if(seqL&&seqL.length>1)flowSeq(seqL);
    else{flowSeq(null);gF.querySelectorAll('.fl').forEach(function(el){el.classList.toggle('on',!act||act.indexOf(el.dataset.line)>=0)})}}
  var sel=state.sel;
  svg.querySelectorAll('.mk').forEach(function(el){
    var k=el.dataset.kind,id=el.dataset.id;
    el.classList.toggle('sel',!!sel&&((k===sel.kind&&id===sel.id)||(sel.kind==='night'&&k==='stop'&&id===state.nightFrom)));
    el.classList.toggle('end',!sel&&k==='stop'&&(id===state.from||id===state.to));
  });
  svg.querySelectorAll('.mk.wifi').forEach(function(el){var b=$('.wbars',el);if(!b||!WIFI[el.dataset.id])return;b.innerHTML=mbars(info(avgOf(el.dataset.id)).bars)});
  drawLabels();etapas('mapa atualizado');}
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
  var opts=SORTED.map(function(k){return '<option value="'+k+'"'+(k===from?' selected':'')+'>'+STOPS[k].name+'</option>'}).join('');
  var top='';
  if(from==='est'){
    top='<div class="next"><p><b>Você já está na Estação BRT.</b></p><p class="muted small">Daqui saem o BRT e os ônibus para fora da ilha.</p></div>';
  }else{
    var L=lastTo(from,'est');
    if(!L.length)top='<div class="next"><p><b>Nenhuma linha vai direto daqui para a Estação BRT.</b></p><p class="muted small">Veja abaixo os últimos horários de cada linha nesta parada.</p></div>';
    else{
      var b=L[0],d=Math.round(b.dep)-now;
      top='<div class="next lastbig"><p class="eyebrow">Último ônibus daqui para a Estação BRT</p>'+
        '<div class="nx-top">'+badge(b.lid)+'<span>Linha '+b.lid+' · '+LINES[b.lid].name+'</span></div>'+
        '<div class="nx-big"><span class="nx-min">'+tilde(b.lid)+bt(b.dep)+'</span>'+lastPill(b.dep,now)+'</div>'+faixaGraf(b.dep,now,b.lid)+
        '<p class="muted small">'+(d>=0?(CFG.faixa?'Passa '+relB(b.dep,now).pre+' '+relB(b.dep,now).val:'Faltam '+(d>=60?Math.floor(d/60)+' h '+(d%60)+' min':d+' min'))+'. ':'Este horário já passou hoje. ')+'Chega na Estação '+(CFG.faixa?atTxt(b.arr):'por volta de '+fmt(b.arr))+'.</p>'+
        (L.length>1?'<div class="later"><span class="lab">Outras</span>'+L.slice(1).map(function(c){return badge(c.lid)+' <span class="mono">'+tilde(c.lid)+bt(c.dep)+'</span>'}).join(' ')+'</div>':'')+'</div>';
    }
  }
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
    (from!=='est'?(function(){var o=options(from,'est',now)[0]||lastTo(from,'est')[0];return o?warnHTML({from:from,to:'est',lid:o.lid,dep:o.dep,arr:o.arr},'night',true):''})():'')+
    '<h3>Último horário de cada linha aqui</h3><div>'+rows+'</div>'+
    nightShareHTML()+'<h3>Telefones da segurança</h3><div class="calls">'+CALLS.map(function(c){
      return '<div class="callrow"><span class="grow"><b>'+c.n+'</b><small>'+c.d+'</small></span><a class="num" href="tel:'+c.raw+'">'+c.num+'</a><button class="copy" type="button" data-copy="'+c.num+'">Copiar</button></div>';
    }).join('')+'</div>'+
    '<p class="muted small">Salve esses números no celular antes de precisar. Se a ligação não abrir pelo botão, copie o número.</p>'+
    '<h3>Guaritas</h3><div class="list">'+Object.keys(GUARDS).map(function(id){
      var g=GUARDS[id];
      return '<button class="item tint" type="button" style="--c:var(--warn)" data-kind="guard" data-id="'+id+'"><span class="lb" style="--c:var(--mc-guard);color:#0A0E13">'+g.short+'</span><span class="grow">'+g.name+'<small>'+g.where+'</small></span></button>';
    }).join('')+'</div>'+
    '<h3>Dicas da Prefeitura</h3><ul class="tips">'+NTIPS.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul>';
}
function guardHTML(id){
  var g=GUARDS[id];
  var near=Object.keys(STOPS).filter(function(s){return Math.hypot(STOPS[s].p[0]-g.p[0],STOPS[s].p[1]-g.p[1])<=130});
  return '<button class="back" type="button" data-kind="night" data-id="x">← Volta à noite</button>'+
    '<div><p class="eyebrow">Segurança · guarita</p><h2>'+g.name+'</h2></div><p>'+g.where+'</p>'+
    '<p class="note">No mapa da Prefeitura, as guaritas aparecem com o nº 33, junto da Divisão de Segurança (DISEG). Em caso de problema, procure a guarita mais próxima ou ligue para a DISEG.</p>'+
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
var weekendNote='<p class="note">Hoje é fim de semana. A página da Prefeitura só informa horários de dias úteis; confirme antes de sair.</p>';
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
  if(state.sel&&state.sel.kind==='ext'){detail.innerHTML=extStopHTML(state.sel.id,nowMin());etapas('detalhe montado');return}/* ponto da prefeitura */
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
  /* ponto da prefeitura: liga a camada de ônibus da cidade e vai para Trajetos */
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
/* ======================= utilidades ======================= */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function agoTxt(ts){var m=Math.max(0,Math.round((Date.now()-ts)/60000));return m<1?'agora':m<60?'há '+m+' min':'há '+Math.floor(m/60)+' h '+(m%60?m%60+' min':'')}
/* ======================= 3. camada de serviços ======================= */
/* posições tiradas do mapa de serviços da Prefeitura (2022) e alinhadas ao mapa base por ajuste local com 34 pontos de referência (prédios, rotatórias, guaritas) */
var SVC_T={
  banco:{n:'Banco',c:'#2E9E4F',g:'$',grp:'dinheiro'},
  farmacia:{n:'Farmácia',c:'#D43C3C',g:'+',grp:'saude'},
  lab:{n:'Lab. de análises clínicas',c:'#9B2335',g:'◆',grp:'saude'},
  ru:{n:'Restaurante Universitário',c:'#E8572B',g:'RU',grp:'comida'},
  rest:{n:'Restaurante / lanchonete',c:'#F08A24',g:'⑂',grp:'comida'},
  papel:{n:'Papelaria',c:'#E0457B',g:'✎',grp:'compras'},
  banca:{n:'Banca de jornal',c:'#3E8ED0',g:'≡',grp:'compras'},
  correio:{n:'Correios',c:'#5B5FC7',g:'✉',grp:'compras'},
  chave:{n:'Chaveiro',c:'#7B3FB5',g:'⚷',grp:'compras'},
  bici:{n:'Bicicletário',c:'#D9A400',g:'⚲',grp:'transp'},
  taxi:{n:'Ponto de táxi',c:'#D9A400',g:'T',grp:'transp'},
  heli:{n:'Heliponto',c:'#3A3F46',g:'H',grp:'transp'}
};
var SVC_G=[['todos','Todos'],['comida','Comer'],['dinheiro','Banco'],['saude','Saúde'],['compras','Papelaria e correio'],['transp','Táxi e bicicleta']];
var SVC=[{"id": "bici1", "t": "bici", "p": [383.8,110.9], "near": "Alojamento"}, {"id": "banco1", "t": "banco", "p": [399.1,149.4], "near": "Bio-Rio"}, {"id": "rest1", "t": "rest", "p": [463.7,213.7], "near": "EEFD"}, {"id": "farmacia1", "t": "farmacia", "p": [312.6,249.3], "near": "Estação BRT"}, {"id": "lab1", "t": "lab", "p": [331.2,244.6], "near": "CCS"}, {"id": "rest2", "t": "rest", "p": [351.2,239.4], "near": "CCS"}, {"id": "papel1", "t": "papel", "p": [373.7,233.8], "near": "CCS"}, {"id": "correio1", "t": "correio", "p": [396.3,230.8], "near": "CCS"}, {"id": "lab2", "t": "lab", "p": [443.5,291.2], "near": "EEFD"}, {"id": "banca1", "t": "banca", "p": [441.4,341.3], "near": "EEFD"}, {"id": "bici2", "t": "bici", "p": [290.3,328.5], "near": "Estação BRT"}, {"id": "banco2", "t": "banco", "p": [316.5,317.6], "near": "Estação BRT"}, {"id": "correio2", "t": "correio", "p": [332.6,317], "near": "Estação BRT"}, {"id": "banca2", "t": "banca", "p": [350.7,317.7], "near": "CCS"}, {"id": "farmacia2", "t": "farmacia", "p": [370,317.1], "near": "CCS"}, {"id": "banco3", "t": "banco", "p": [361.8,360.1], "near": "HU"}, {"id": "rest3", "t": "rest", "p": [380.5,372.8], "near": "HU"}, {"id": "taxi1", "t": "taxi", "p": [368.9,382.2], "near": "HU"}, {"id": "taxi2", "t": "taxi", "p": [382.4,399.3], "near": "HU"}, {"id": "rest4", "t": "rest", "p": [401.3,413.6], "near": "HU"}, {"id": "bici3", "t": "bici", "p": [434,479.1], "near": "Prefeitura"}, {"id": "taxi3", "t": "taxi", "p": [607.1,425.9], "near": "CEPEL"}, {"id": "taxi4", "t": "taxi", "p": [676.3,488.5], "near": "CENPES"}, {"id": "rest5", "t": "rest", "p": [668.9,524.8], "near": "CENPES"}, {"id": "lab3", "t": "lab", "p": [686,525], "near": "CENPES"}, {"id": "banco4", "t": "banco", "p": [748.1,450.4], "near": "IF"}, {"id": "rest6", "t": "rest", "p": [1131.6,279.6], "near": "Incubadora"}, {"id": "rest7", "t": "rest", "p": [1028.4,340], "near": "Reitoria"}, {"id": "banca3", "t": "banca", "p": [1029.2,365.3], "near": "Reitoria"}, {"id": "papel2", "t": "papel", "p": [1041.8,349.5], "near": "Reitoria"}, {"id": "rest8", "t": "rest", "p": [1072,348.3], "near": "Reitoria"}, {"id": "rest9", "t": "rest", "p": [1093.7,346.3], "near": "Incubadora"}, {"id": "bici4", "t": "bici", "p": [1025,409], "near": "Reitoria"}, {"id": "banco5", "t": "banco", "p": [936.5,434], "near": "Faculdade de Letras"}, {"id": "rest10", "t": "rest", "p": [950.6,434.7], "near": "Faculdade de Letras"}, {"id": "taxi5", "t": "taxi", "p": [964.9,434.9], "near": "Faculdade de Letras"}, {"id": "ru1", "t": "ru", "p": [977.8,426.7], "near": "Faculdade de Letras"}, {"id": "bici5", "t": "bici", "p": [976.1,446.4], "near": "Faculdade de Letras"}, {"id": "papel3", "t": "papel", "p": [1042,423.9], "near": "Reitoria"}, {"id": "rest11", "t": "rest", "p": [1058.9,421.1], "near": "Reitoria"}, {"id": "banca4", "t": "banca", "p": [1045.2,436.3], "near": "Reitoria"}, {"id": "bici6", "t": "bici", "p": [817,459.1], "near": "CT"}, {"id": "banco6", "t": "banco", "p": [840.3,460.5], "near": "CT"}, {"id": "correio3", "t": "correio", "p": [859.9,462.7], "near": "CT"}, {"id": "rest12", "t": "rest", "p": [881.6,465.2], "near": "CT"}, {"id": "chave1", "t": "chave", "p": [903.6,467.5], "near": "CT"}, {"id": "ru2", "t": "ru", "p": [854.6,527.6], "near": "CT"}, {"id": "papel4", "t": "papel", "p": [874.2,529.3], "near": "CT"}, {"id": "banca5", "t": "banca", "p": [893.9,530.9], "near": "CT"}, {"id": "chave2", "t": "chave", "p": [913.7,532.2], "near": "CT"}, {"id": "rest13", "t": "rest", "p": [951.6,515.4], "near": "IMA"}, {"id": "banco7", "t": "banco", "p": [962.8,515.6], "near": "IMA"}, {"id": "taxi6", "t": "taxi", "p": [977.4,481.1], "near": "IMA"}, {"id": "rest14", "t": "rest", "p": [847.5,548.3], "near": "CT"}, {"id": "rest15", "t": "rest", "p": [891.3,549.5], "near": "CT"}, {"id": "rest16", "t": "rest", "p": [957.4,563.1], "near": "Xistoquímica"}, {"id": "rest17", "t": "rest", "p": [806.4,563.5], "near": "CCMN"}, {"id": "heli1", "t": "heli", "p": [1271.1,280.9], "near": "Parque Tecnológico"}];
var SVCMAP={};SVC.forEach(function(s){s.name=SVC_T[s.t].n;s.full=SVC_T[s.t].n+' · perto de '+s.near;SVCMAP[s.id]=s});
state.layers.svc=false;state.svcGrp='todos';
function svcMarker(s){
  var T=SVC_T[s.t],g=T.g,fs=g.length>1?10:13,fg=(s.t==='bici'||s.t==='taxi')?'#1B1500':'#fff';
  return mk('svc',s.id,s.p,T.n+' perto de '+s.near,'<circle class="hit" r="18"/><rect x="-11" y="-11" width="22" height="22" rx="6" fill="'+T.c+'" stroke="#0A0E13" stroke-width="2"/><text class="svc-g" y="0.5" fill="'+fg+'" style="font-size:'+fs+'px">'+g+'</text>');
}
function svcVisible(s){return state.layers.svc&&(state.svcGrp==='todos'||SVC_T[s.t].grp===state.svcGrp)}
function svcHTML(id){
  var s=SVCMAP[id],T=SVC_T[s.t];
  var near=Object.keys(STOPS).map(function(k){return {k:k,d:Math.hypot(STOPS[k].p[0]-s.p[0],STOPS[k].p[1]-s.p[1])}}).sort(function(a,b){return a.d-b.d}).slice(0,2).map(function(x){return x.k});
  return '<button class="back" type="button" data-go="home">← Voltar</button>'+
    '<div><p class="eyebrow">Serviço</p><h2>'+T.n+'</h2></div><p>Perto de <b>'+esc(s.near)+'</b>.</p>'+
    (s.t==='ru'?'<p class="small">Horários dos RUs na aba <b>Lugares</b>.</p>':'')+
    '<p class="note">Posição tirada do mapa de serviços da Prefeitura Universitária (2022). O serviço pode ter mudado de lugar ou fechado; confirme no local.</p>'+
    repBlock('svc:'+id)+
    '<h3>Paradas mais próximas</h3><div class="list">'+near.map(stopItem).join('')+'</div>';
}
/* ======================= 2. avaliações e avisos compartilhados ======================= */
var SH={on:false,db:null,uid:null,write:null,denied:false,votes:{},reps:[],busyV:false,pendV:false};
var REP_K=[['fila','Fila grande'],['onibus','Ônibus atrasado ou lotado'],['wifi','Wi-Fi fora do ar'],['fechado','Local fechado'],['elevador','Elevador ou escada com problema'],['limpeza','Banheiro sem condições'],['seguranca','Situação suspeita'],['outro','Outro']];
var REP_TTL=4*60*60*1000;
function repLabel(k){for(var i=0;i<REP_K.length;i++)if(REP_K[i][0]===k)return REP_K[i][1];return 'Aviso'}
function placeOf(key){
  var a=String(key||'').split(':'),t=a[0],id=a[1];
  if(t==='stop'&&STOPS[id])return {name:STOPS[id].name,p:STOPS[id].p,kind:'stop',id:id};
  if(t==='wifi'&&WIFI[id])return {name:WIFI[id].name,p:WIFI[id].p,kind:'wifi',id:id};
  if(t==='pl'&&PL[id]&&PL[id].p)return {name:PL[id].name,p:PL[id].p,kind:'place',id:id};
  if(t==='svc'&&SVCMAP[id])return {name:SVCMAP[id].full,p:SVCMAP[id].p,kind:'svc',id:id};
  return null;
}
function liveReps(){var now=Date.now();return SH.reps.filter(function(r){return r.ts>now-REP_TTL&&r.ts<now+5*60000&&placeOf(r.place)&&!(typeof GST!=='undefined'&&GST&&blocked(r.owner))})}
function aggVotes(docs){
  var v={};SH.voteDocs={};docs.forEach(function(d){SH.voteDocs[d.id]=1});
  docs.forEach(function(d){var r=(d.data()||{}).r;if(!r||typeof r!=='object')return;Object.keys(r).forEach(function(w){var n=+r[w];if(!WIFI[w]||!(n>=1&&n<=5))return;if(!v[w])v[w]={s:0,n:0};v[w].s+=n;v[w].n++})});
  return v;
}
function flatReps(docs){
  var out=[];
  docs.forEach(function(d){var it=(d.data()||{}).items;if(!Array.isArray(it))return;it.slice(0,10).forEach(function(r){if(!r||typeof r!=='object')return;
    out.push({id:String(r.id||''),k:String(r.k||'outro'),place:String(r.place||''),txt:String(r.txt||'').slice(0,90),ts:+r.ts||0,mine:d.id===SH.uid,owner:d.id})})});
  return out.sort(function(a,b){return b.ts-a.ts});
}
function isExample(id){return !(SH.on&&SH.votes[id]&&SH.votes[id].n)}
function writeVotes(){
  if(!SH.on||!SH.uid||SH.denied)return;
  if(FBMODE&&SH.full&&GESTOR!==true)return;
  if(SH.busyV){SH.pendV=true;return}
  SH.busyV=true;
  SH.db.doc('votes/'+SH.uid).set({r:Object.assign({},mine),ts:Date.now()}).then(function(){SH.busyV=false;if(SH.pendV){SH.pendV=false;writeVotes()}},function(){SH.busyV=false;SH.pendV=false;SH.denied=true;refreshAll()});
}
var repBusy=false;
function sendReport(k,place,txt){
  if(!SH.on||!SH.uid||SH.denied||repBusy)return Promise.resolve(false);
  repBusy=true;
  var now=Date.now(),mineL=SH.reps.filter(function(r){return r.mine&&r.ts>now-REP_TTL}).map(function(r){return {id:r.id,k:r.k,place:r.place,txt:r.txt,ts:r.ts}});
  mineL.unshift({id:'r'+now.toString(36),k:k,place:place,txt:String(txt||'').slice(0,90),ts:now});
  if(!postGap('rep')){repBusy=false;return Promise.resolve(false)}
  return SH.db.doc('reports/'+SH.uid).set(stamp({items:mineL.slice(0,5)})).then(function(){repBusy=false;postDone('rep');return true},function(){repBusy=false;postFail();return false});
}
function removeReport(id){
  if(!SH.on||!SH.uid||repBusy)return;
  repBusy=true;
  var now=Date.now(),keep=SH.reps.filter(function(r){return r.mine&&r.id!==id&&r.ts>now-REP_TTL}).map(function(r){return {id:r.id,k:r.k,place:r.place,txt:r.txt,ts:r.ts}});
  SH.db.doc('reports/'+SH.uid).set(stamp({items:keep})).then(function(){repBusy=false},function(){repBusy=false;gToast('Não deu para remover agora. Tente de novo.',1)});
}
function repItem(r){
  var pl=placeOf(r.place);
  return '<div class="rep"><span class="rep-k">'+esc(repLabel(r.k))+'</span><span class="grow"><button type="button" class="linkbtn rep-pl" data-repgo="'+esc(r.place)+'">'+esc(pl?pl.name:'')+'</button>'+(r.txt?'<small>“'+esc(r.txt)+'”</small>':'')+'</span><span class="muted small">'+agoTxt(r.ts)+'</span>'+(r.mine?'<button type="button" class="copy" data-repdel="'+esc(r.id)+'">Apagar</button>':'')+'</div>';
}
function repBlock(key){
  var l=liveReps().filter(function(r){return r.place===key});
  if(!l.length)return '';
  return '<h3>Avisos dos alunos aqui</h3><div class="reps">'+l.map(repItem).join('')+'</div>';
}
function repFormHTML(defPlace){
  if(typeof PERFIL==='undefined'||!PERFIL)return typeof needProfileHTML==='function'?needProfileHTML('enviar avisos'):'';
  if(SH.on&&typeof GST!=='undefined'&&GST&&blocked(SH.uid))return '<p class="muted small">Sua conta não pode enviar avisos no momento (decisão da gestão).</p>';
  if(!SH.on)return '<p class="muted small">Os avisos aparecem quando a página está aberta no claude.ai com sua conta.</p>';
  if(FBMODE&&SH.full&&GESTOR!==true)return '<p class="muted small">'+fullMsg('enviar avisos')+'</p>';
  if(FBMODE&&!SH.denied&&SH.write===false&&!SH.uid)return '<p class="small keep la-cta">Você pode ler os avisos. Para enviar, entre com sua conta. '+askBtn('avisos','Entrar para enviar')+'</p>';
  if(SH.denied||SH.write===false)return '<p class="muted small">'+(FBMODE?'Você pode ler os avisos. Para enviar, entre com Google ou e-mail em Ajustes › Conta.':'Você pode ler os avisos. Para enviar, o dono da página precisa te dar acesso de colaborador.')+'</p>';
  var places=[];
  Object.keys(STOPS).forEach(function(k){places.push(['stop:'+k,'Parada · '+STOPS[k].name])});
  Object.keys(PL).forEach(function(k){if(PL[k].p&&PL[k].cat!=='aula')places.push(['pl:'+k,PL[k].name])});
  Object.keys(WIFI).forEach(function(k){places.push(['wifi:'+k,'Wi-Fi · '+WIFI[k].name])});
  return '<details class="det" id="repdet"><summary>Enviar um aviso</summary><form class="repform" id="repform">'+
    '<label class="fld">O que está acontecendo?<select id="repk">'+REP_K.map(function(k){return '<option value="'+k[0]+'">'+k[1]+'</option>'}).join('')+'</select></label>'+
    '<label class="fld">Onde?<select id="repp">'+places.map(function(p){return '<option value="'+esc(p[0])+'"'+(p[0]===defPlace?' selected':'')+'>'+esc(p[1])+'</option>'}).join('')+'</select></label>'+
    '<label class="fld">Detalhe (opcional)<input type="text" id="rept" maxlength="90" placeholder="Ex.: fila até a porta"></label>'+
    '<button class="copy sendrep" type="submit">Publicar aviso</button>'+
    '<p class="muted small keep">O aviso some sozinho em 4 horas. Seu nome não aparece para os colegas. Em emergência, ligue para a DISEG: (21) 97380-2554.</p></form></details>';
}
function repsHTML(){
  var l=liveReps();
  return '<div class="repbox"><div class="plc-h"><div><p class="eyebrow">Ao vivo · últimas 4 horas</p><h3 class="plc-t">Avisos dos alunos</h3></div>'+(SH.on?'<span class="pill good">Compartilhado</span>':'<span class="pill warn">Offline</span>')+'</div>'+
    (l.length?'<div class="reps">'+l.slice(0,6).map(repItem).join('')+'</div>':'<p class="muted small">Nenhum aviso agora. Viu fila grande no RU, ônibus lotado ou Wi-Fi fora do ar? Avise os colegas.</p>')+
    repFormHTML('')+'</div>';
}
var gSvc,gRep;
function drawShared(){
  if(!gRep)return;
  var seen={},s='';
  liveReps().forEach(function(r){if(seen[r.place])return;seen[r.place]=1;var pl=placeOf(r.place);
    s+=mk('rep',r.place,[pl.p[0]+12,pl.p[1]-14],'Aviso: '+repLabel(r.k)+' em '+pl.name,'<circle class="hit" r="14"/><circle r="9" class="rep-dot"/><text class="rep-x" y="0.5">!</text>')});
  if(typeof RUS!=='undefined'&&RUS){var used={};RUS.forEach(function(k){var f=filaOf(k),pp=PL[k].p;if(!f||!pp)return;var key=pp.join(','),off=used[key]=(used[key]||0)+1;
    var L=FILA_N[f.n],x=pp[0]+(off-1)*50-(off>1?0:0),y=pp[1]-26;
    s+=mk('place fila f'+f.n,k,[x,y],'Fila no '+PL[k].name+': '+L[0]+', '+L[1],'<rect class="hit" x="-30" y="-16" width="60" height="32" rx="16"/><rect class="fila-pl" x="-24" y="-12" width="48" height="24" rx="12"/><text class="fila-tx" y="0.5">'+(f.n?L[3]+'′':'livre')+'</text>').replace(/data-kind="[^"]*"/,'data-kind="place"')})}
  gRep.innerHTML=CFG.reps?s:'';
  svg.querySelectorAll('.mk.wifi').forEach(function(el){var b=$('.wbars',el);if(!b||!WIFI[el.dataset.id])return;b.innerHTML=mbars(info(avgOf(el.dataset.id)).bars)});
  schedule();
}
function refreshAll(){
  var a=document.activeElement;
  if(!detail.contains(a)||!(a&&(a.tagName==='INPUT'||a.tagName==='SELECT')))renderDetail();
  drawShared();
  if(!pPane.hidden&&!pPane.contains(a))renderPredios();
}
function initShared(){
  if(!window.claude||typeof window.claude.use!=='function')return;
  Promise.all([window.claude.use('db'),window.claude.use('user')]).then(function(r){
    var db=r[0],user=r[1];if(!db)return;
    SH.db=db;SH.user=user;
    return (user?user.id():Promise.resolve(null)).then(function(uid){
      SH.uid=uid;SH.on=true;if(uid&&typeof accClaude==='function')accClaude(user,uid);
      if(user)user.can('data.write').then(function(c){if(c===false){SH.write=false;refreshAll()}});
      db.collection('votes').onSnapshot(function(s){SH.votes=aggVotes(s.docs);refreshAll()},function(){});
      db.collection('cal').onSnapshot(function(s){MUD_DB=s.docs.map(function(d){var x=d.data()||{};return {id:d.id,d:String(x.d||''),de:x.de?String(x.de):'',t:String(x.t||'').slice(0,60),k:String(x.k||'facultativo'),txt:String(x.txt||'').slice(0,240),src:/^https:\/\//.test(x.src||'')?String(x.src):''}});drawBanner();refreshAll();if(cPane&&!cPane.hidden&&!cPane.contains(document.activeElement))renderCal()},function(){});
      if(user)user.isOwner().then(function(o){ME.owner=o;if(GESTOR)computePerms();if(gestM&&!gestM.hidden)renderGest()});
      if(user)user.canEdit().then(function(o){MUD_OWNER=o;if(o&&cPane&&!cPane.hidden)renderCal();if(o)setGestor(true)});
      db.collection('fila').onSnapshot(function(s){SH.fila=flatFila(s.docs);refreshAll();drawShared();if(gestM&&!gestM.hidden)renderGest()},function(){});
      db.collection('gestao').onSnapshot(function(s){var seen={};s.docs.forEach(function(d){if(GKEYS.indexOf(d.id)<0)return;var v=(d.data()||{}).v;if(v&&typeof v==='object'){GST[d.id]=v;seen[d.id]=1}});
        GKEYS.forEach(function(k){if(!seen[k])GST[k]=k==='plantas'?{items:[]}:k==='bloqueados'?{ids:[]}:{}});if(!Array.isArray(GST.plantas.items))GST.plantas.items=[];GST.plantas.items=GST.plantas.items.filter(function(x){return x&&typeof x==='object'});if(!Array.isArray(GST.bloqueados.ids))GST.bloqueados.ids=[];
        rebuildAll();if(!cfgM.hidden)renderCfg()},function(){});
      db.collection('reports').onSnapshot(function(s){SH.reps=flatReps(s.docs);refreshAll();if(gestM&&!gestM.hidden)renderGest()},function(){});
      if(uid){
        db.doc('votes/'+uid).get().then(function(d){if(d.exists){var rr=(d.data()||{}).r||{};Object.keys(rr).forEach(function(k){if(WIFI[k]&&rr[k]>=1&&rr[k]<=5)mine[k]=+rr[k]});saveMine()}else if(Object.keys(mine).length){writeVotes()}refreshAll()},function(){});
        loadGrade();trackMember(uid);
        db.doc('requests/'+uid).onSnapshot(function(d){var it=d.exists?((d.data()||{}).items||[]):[];SH.myReq=flatReq([{id:uid,data:function(){return {items:it}}}]);if(!cfgM.hidden)renderCfg()},function(){});
      }else SH.write=false;
      refreshAll();
    });
  }).catch(function(){});
}
/* ======================= 1. minha grade ======================= */
var DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
var GBLK={ct:['A','B','C','D','E','F','G','H','I','J'],ccmn:['A','B','C','D','E','F','G','H','I']};
var GEX=[
  {id:'ex1',nome:'Cálculo I',bld:'ct',b:'H',sala:'210',dias:[1,3,5],ini:'08:00',fim:'10:00',ex:1},
  {id:'ex2',nome:'Física I',bld:'ct',b:'A',sala:'312',dias:[2,4],ini:'10:00',fim:'12:00',ex:1},
  {id:'ex3',nome:'Programação',bld:'ccmn',b:'C',sala:'105',dias:[2,4],ini:'13:00',fim:'15:00',ex:1}
];
var GKEY='cse-ufrj-grade-v1',GRADE=null,gBusy=false,gPend=false;
try{GRADE=JSON.parse(localStorage.getItem(GKEY))}catch(e){GRADE=null}
if(!Array.isArray(GRADE))GRADE=null;
var gs={from:'est',form:false};
function gradeList(){if(semConta())return [];/* grade só para quem entrou com uma conta */return GRADE&&GRADE.length?GRADE:GEX}
function usingExample(){return !(GRADE&&GRADE.length)}
function saveGrade(){
  try{localStorage.setItem(GKEY,JSON.stringify(GRADE||[]))}catch(e){}
  if(ACC.kind==='google'&&!ACC.mute)accQueue();
  if(SH.on&&SH.uid){
    if(gBusy){gPend=true;return}
    gBusy=true;
    SH.db.doc('data/users/'+SH.uid+'/grade').set({items:GRADE||[],ts:Date.now()}).then(function(){gBusy=false;if(gPend){gPend=false;saveGrade()}},function(){gBusy=false;gPend=false});
  }
}
function loadGrade(){
  if(!SH.on||!SH.uid)return;
  SH.db.doc('data/users/'+SH.uid+'/grade').get().then(function(d){
    if(d.exists){var it=(d.data()||{}).items;if(Array.isArray(it)){GRADE=it.filter(function(x){return x&&x.nome}).slice(0,40);try{localStorage.setItem(GKEY,JSON.stringify(GRADE))}catch(e){}syncAulas();renderGrade()}}
    else if(GRADE&&GRADE.length)saveGrade();
  },function(){});
}
function salaFloor(sala){var m=/(\d{1,3})/.exec(String(sala||''));if(!m)return null;var n=parseInt(m[1],10);return m[1].length>=3||n>=100?Math.floor(n/100):0}
function aulaStop(a){return a.bld==='ct'?'ctl':a.bld==='ccmn'?'ccmn':(STOPS[a.stop]?a.stop:'ctl')}
function aulaFloor(a){return a.andar!==undefined&&a.andar!==null&&a.andar!==''?+a.andar:salaFloor(a.sala)}
function aulaWhere(a){var hasA=a.andar!==undefined&&a.andar!==null&&a.andar!=='';return (a.bld==='ct'?'CT':a.bld==='ccmn'?'CCMN':(STOPS[a.stop]?STOPS[a.stop].name:''))+(a.b&&a.bld!=='outro'?', Bloco '+a.b:'')+(hasA?', '+(+a.andar===0?'térreo':a.andar+'º andar'):'')+(a.sala?', sala '+a.sala:'')}
function syncAulas(){
  Object.keys(PL).forEach(function(k){if(PL[k].cat==='aula')delete PL[k]});
  gradeList().forEach(function(a){
    if(a.bld!=='ct'&&a.bld!=='ccmn')return;
    PL['aula_'+a.id]={s:a.nome,name:a.nome+' (aula)',cat:'aula',where:aulaWhere(a),bld:a.bld,b:a.b,f:aulaFloor(a),wk:null,note:'Sua aula: '+a.dias.map(function(d){return DIAS[d]}).join(', ')+', '+a.ini+'–'+a.fim+'.'};
  });
}
function todayDow(){return new Date().getDay()}
function nextClass(now){
  var dow=todayDow(),best=null;
  gradeList().forEach(function(a){
    var ini=toMin(a.ini),fim=toMin(a.fim);
    (a.dias||[]).forEach(function(d){
      var dd=(d-dow+7)%7,start=dd*1440+ini,end=dd*1440+fim;
      if(dd===0&&end<=now)start+=7*1440;
      var rel=start-now;
      if(!best||rel<best.rel)best={a:a,rel:rel,dd:dd===0&&end<=now?7:dd,ini:ini,fim:fim,going:dd===0&&now>=ini&&now<fim};
    });
  });
  return best;
}
function arriveBy(from,to,T,after){
  var best=null;
  Object.keys(LINES).forEach(function(lid){
    if(LINES[lid].susp)return;
    LINES[lid].trips.forEach(function(tr){
      for(var i=0;i<tr.passes.length;i++){
        if(tr.passes[i].stop!==from)continue;
        for(var j=i+1;j<tr.passes.length;j++){
          if(tr.passes[j].stop!==to)continue;
          tr.deps.forEach(function(d){var dep=d+tr.passes[i].off,arr=d+tr.passes[j].off;if(dep>=after&&arr<=T-5&&(!best||dep>best.dep))best={lid:lid,dep:dep,arr:arr}});
          break;
        }
      }
    });
  });
  return best;
}
function whenTxt(n){
  if(n.going)return 'agora, até '+fmt(n.fim);
  if(n.dd===0)return 'hoje às '+fmt(n.ini);
  if(n.dd===1)return 'amanhã às '+fmt(n.ini);
  return DIAS[(todayDow()+n.dd)%7].toLowerCase()+(n.dd===7?' que vem':'')+' às '+fmt(n.ini);
}
function inTxt(m){if(m<=0)return '';if(m<60)return 'em '+m+' min';var h=Math.floor(m/60);return h<24?'em '+h+' h '+(m%60?m%60+' min':''):'em '+Math.floor(h/24)+' dia'+(h>=48?'s':'')}
function gradeNextHTML(now){
  var n=nextClass(now);
  if(!n)return '<p class="muted">Cadastre uma aula para ver aqui a próxima e como chegar.</p>';
  var a=n.a,to=aulaStop(a),from=gs.from;
  var opts=SORTED.map(function(k){return '<option value="'+k+'"'+(k===from?' selected':'')+'>'+STOPS[k].name+'</option>'}).join('');
  var how='';
  if(from===to)how='<p class="small">Você já está na parada da aula.</p>';
  else{
    var r=arriveBy(from,to,n.ini,n.dd===0&&!n.going?now:0);
    if(n.going||(n.dd===0&&!r)){var o=options(from,to,now);r=null;
      how=o.length?'<p class="small"><b>Vá agora:</b> '+badge(o[0].lid)+' passa '+(CFG.faixa?atT(o[0].dep):'às <span class="mono">'+tilde(o[0].lid)+fmt(o[0].dep)+'</span>')+' e chega '+atT(o[0].arr).replace(/<\/span>$/,'')+'</span>.</p>':'<p class="small">Nenhum circular direto agora entre esses pontos.</p>';}
    else if(r)how='<p class="small">'+badge(r.lid)+' <b>Linha '+r.lid+'</b> às <span class="mono">'+tilde(r.lid)+bt(r.dep)+'</span> em '+STOPS[from].name+', chega às <span class="mono">'+fmt(r.arr)+'</span>, antes do início.</p>';
    else how='<p class="small">Nenhum circular direto chega a tempo. Tente sair da Estação BRT.</p>';
  }
  var plan=(a.bld==='ct'||a.bld==='ccmn')?'<button class="copy" type="button" data-gplan="'+esc(a.id)+'">Ver planta da sala</button>':'';
  return '<div class="next lastbig"><p class="eyebrow">Próxima aula</p><h3 class="plc-t">'+esc(a.nome)+'</h3>'+
    '<div class="nx-big"><span class="nx-min" style="font-size:28px">'+whenTxt(n)+'</span>'+(n.going?'<span class="pill good">Em andamento</span>':'<span class="muted">'+inTxt(n.rel)+'</span>')+'</div>'+
    '<p class="muted small">'+esc(aulaWhere(a))+'</p>'+
    '<label class="fld">Vou sair de<select id="gfrom">'+opts+'</select></label>'+how+
    '<div class="later">'+plan+'<button class="copy" type="button" data-gmap="'+esc(a.id)+'">Ver parada no mapa</button></div></div>';
}
function gradeWeekHTML(){
  var list=gradeList(),out='';
  [1,2,3,4,5,6].forEach(function(d){
    var day=list.filter(function(a){return (a.dias||[]).indexOf(d)>=0}).sort(function(x,y){return toMin(x.ini)-toMin(y.ini)});
    if(!day.length)return;
    out+='<div class="gday"><p class="eyebrow">'+['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][d]+'</p>'+day.map(function(a){
      return '<div class="gclass'+(d===todayDow()?' today':'')+'"><span class="mono gtime">'+a.ini+'–'+a.fim+'</span><span class="grow"><b>'+esc(a.nome)+'</b><small>'+esc(aulaWhere(a))+'</small></span>'+(a.ex?'':'<button class="copy" type="button" data-gdel="'+esc(a.id)+'" aria-label="Remover '+esc(a.nome)+'">Remover</button>')+'</div>';
    }).join('')+'</div>';
  });
  return out||'<p class="muted">Nenhuma aula cadastrada.</p>';
}
function gradeFormHTML(){
  var stops=SORTED.map(function(k){return '<option value="'+k+'">'+STOPS[k].name+'</option>'}).join('');
  return '<form class="gform" id="gform"><div><p class="eyebrow">Adicionar aula</p></div>'+
    '<label class="fld">Disciplina<input type="text" id="gnome" maxlength="50" required placeholder="Ex.: Cálculo I"></label>'+
    '<div class="g2"><label class="fld">Prédio<select id="gbld"><option value="ct">CT</option><option value="ccmn">CCMN</option><option value="outro">Outro (escolher parada)</option></select></label>'+
    '<label class="fld" id="gbwrap">Bloco<select id="gb">'+GBLK.ct.map(function(b){return '<option>'+b+'</option>'}).join('')+'</select></label>'+
    '<label class="fld" id="gstopwrap" hidden>Parada mais perto<select id="gstop">'+stops+'</select></label></div>'+
    '<div class="g2"><label class="fld" id="gfwrap">Andar<select id="gf"><option value="">Pelo número da sala</option><option value="0">Térreo</option>'+[1,2,3,4,5,6,7,8].map(function(n){return '<option value="'+n+'">'+n+'º andar</option>'}).join('')+'</select></label>'+
    '<label class="fld">Sala<input type="text" id="gsala" maxlength="10" placeholder="Ex.: 210"></label></div>'+
    '<fieldset class="gdias"><legend>Dias</legend>'+[1,2,3,4,5,6].map(function(d){return '<label class="gd"><input type="checkbox" value="'+d+'"><span>'+DIAS[d]+'</span></label>'}).join('')+'</fieldset>'+
    '<div class="g2"><label class="fld">Início<input type="time" id="gini" value="08:00" required></label><label class="fld">Fim<input type="time" id="gfim" value="10:00" required></label></div>'+
    '<p class="gerr" id="gerr" role="alert"></p>'+
    '<button class="copy sendrep" type="submit">Salvar aula</button></form>';
}
var gPane,gNext,gWeek;
function renderGrade(focusSel){
  if(!gPane||gPane.hidden)return;
  if(semConta()){/* sem conta: só o convite para entrar */
    gWeek.hidden=true;gPane.classList.add('la-gl');
    gNext.innerHTML='<div><p class="eyebrow keep">Sua semana</p><h2>Minha grade</h2></div>'+
      '<div class="la-lock la-glock"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'+
      '<p class="keep"><b>Faça login para salvar sua grade.</b></p><p class="small keep la-p">Com uma conta, suas aulas ficam guardadas, aparecem no mapa e vão com você para qualquer aparelho.</p>'+askBtn('grade','Entrar')+'</div>';
    return;
  }
  if(gWeek.hidden)gWeek.hidden=false;gPane.classList.remove('la-gl');
  var now=nowMin();
  gNext.innerHTML='<div><p class="eyebrow">'+(usingExample()?'Exemplo':'Sua semana')+'</p><h2>Minha grade</h2></div>'+
    (usingExample()?'<p class="note">Esta é uma grade de exemplo. Salve sua primeira aula e ela some.</p>':'')+
    gradeNextHTML(now)+'<h3>Semana</h3>'+gradeWeekHTML()+
    '<p class="muted small">'+(SH.on&&SH.uid?'Sua grade fica salva na sua conta e só você vê.':'Sua grade fica salva só neste aparelho.')+'</p>';
  if(!gWeek.dataset.ready){gWeek.innerHTML=gradeFormHTML();gWeek.dataset.ready='1'}
  if(focusSel){var el=gPane.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
}
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
    '<div class="later"><button class="copy" type="button" data-wcopy="'+key+'">Copiar mensagem</button><a class="copy wa" href="https://wa.me/?text='+encodeURIComponent(txt)+'" target="_blank" rel="noopener" data-wa="'+key+'"><svg class="lk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8z"/></svg>Abrir no WhatsApp</a></div>'+
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
  if(RUS.indexOf(id)>=0)extra+='<div class="fila-in"><p class="small"><b>Fila agora</b></p>'+filaRow(id,now)+'</div><div class="row bdj-row">'+bandejaLinkHTML()+'</div>';
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
/* ---------- ajustes (salvos neste aparelho) ---------- */
function saveCfg(){
  /* o que a pessoa mudou deixa de seguir o padrão definido pela gestão */
  if(PAD_SNAP)PAD_KEYS.forEach(function(k){if(CFG[k]!==PAD_SNAP[k])CFG.mine[k]=1});
  saveCfgSemMarcar();
}
/* grava os ajustes sem marcar nada como escolha da pessoa (usado ao aplicar os padrões da gestão) */
function saveCfgSemMarcar(){
  try{localStorage.setItem('cse-cfg',JSON.stringify(CFG))}catch(e){}
  if(!ACC.mute)accQueue();
}
var COVERS=[['folha','Folha inferior','O mapa nítido com uma folha de vidro embaixo.'],['cartao','Cartão central','Cartão de vidro no meio, sobre o mapa desfocado.'],['titulo','Título gigante','Nome grande e barra de ícones.'],['none','Sem capa','Abre direto no mapa.']];
function applyCoverStyle(){var c=$('#cover');if(c){c.dataset.style=CFG.cover==='none'?'folha':CFG.cover;if(!c.hidden&&typeof placeCoverMap==='function')placeCoverMap()}}
function cvMini(k){
  if(k==='none')return '<span class="cm cm-none"><span class="cm-map"></span><span class="cm-chip"></span><span class="cm-chip s"></span></span>';
  return '<span class="cm cm-'+k+'"><span class="cm-map"></span><span class="cm-glass"><i></i><i></i><i class="b"></i></span></span>';
}
function tg(id,on,label,desc){return '<label class="tgl" for="'+id+'"><span class="grow"><b>'+label+'</b><small>'+desc+'</small></span><input type="checkbox" role="switch" id="'+id+'"'+(on?' checked':'')+'><span class="sw2" aria-hidden="true"></span></label>'}
var BGS=[['brilho','Brilho','#FF9F5A','#79AEFF','#4CD38D'],['aurora','Aurora','#4CD38D','#A895FF','#4FD1DE'],['sol','Pôr do sol','#FF7A59','#F27BBE','#FFC15A'],['oceano','Oceano','#3D8BFF','#4FD1DE','#2B5BD7'],['mapa','Mapa do campus','',''],['liso','Liso','','','']];
function applyBg(){
  document.documentElement.style.setProperty('--bgmap-sw','url('+MAPMINI+')');
  var r=document.documentElement;r.dataset.bg=CFG.bg||'brilho';
  if(CFG.bg==='mapa')r.style.setProperty('--bgmap','url('+MAPBLUR+')');
}
function bgSwatch(b){
  if(b[0]==='mapa')return '<span class="bgsw bgsw-mapa"></span>';
  if(b[0]==='liso')return '<span class="bgsw bgsw-liso"></span>';
  return '<span class="bgsw" style="background:radial-gradient(70% 70% at 15% 15%,'+b[2]+'aa,transparent 70%),radial-gradient(70% 70% at 90% 30%,'+b[3]+'99,transparent 70%),radial-gradient(80% 70% at 50% 110%,'+b[4]+'88,transparent 70%),var(--surface)"></span>';
}
function renderCfg(focusSel){
  var L=$('#cfgL'),Rr=$('#cfgR');if(!L)return;
  var cur=COVERS.filter(function(c){return c[0]===CFG.cover})[0]||COVERS[0];
  var wasOpen=!!(document.getElementById('cvdet')&&document.getElementById('cvdet').open),bgOpen=!!(document.getElementById('bgdet')&&document.getElementById('bgdet').open);
  var curBg=BGS.filter(function(b){return b[0]===(CFG.bg||'brilho')})[0]||BGS[0];
  L.innerHTML='<div><p class="eyebrow">Ajustes</p><h2>Aparência</h2></div>'+
    '<details class="cvdet" id="bgdet"'+(bgOpen?' open':'')+'><summary><span class="cvsum">'+bgSwatch(curBg)+'</span><span class="grow"><b>Plano de fundo</b><small>'+curBg[1]+'</small></span><span class="chev" aria-hidden="true">▾</span></summary>'+
    '<div class="bgopts" role="radiogroup" aria-label="Plano de fundo">'+BGS.map(function(b){var on=(CFG.bg||'brilho')===b[0];
      return '<button type="button" class="bgopt" role="radio" aria-checked="'+on+'" data-bg="'+b[0]+'">'+bgSwatch(b)+'<span>'+b[1]+'</span></button>'}).join('')+'</div></details>'+
    '<details class="cvdet" id="cvdet"'+(wasOpen?' open':'')+'><summary><span class="cvsum">'+cvMini(cur[0])+'</span><span class="grow"><b>Capa</b><small>'+cur[1]+'</small></span><span class="chev" aria-hidden="true">▾</span></summary>'+
    '<div class="cvopts" role="radiogroup" aria-label="Estilo da capa">'+COVERS.map(function(c){var on=CFG.cover===c[0];
      return '<button type="button" class="cvopt" role="radio" aria-checked="'+on+'" data-cover="'+c[0]+'">'+cvMini(c[0])+'<span class="cvo-t"><b>'+c[1]+'</b><small>'+c[2]+'</small></span></button>'}).join('')+'</div>'+
    '<button class="copy" type="button" id="cfgPreview"'+(CFG.cover==='none'?' disabled':'')+'>Ver a capa agora</button></details>';
  Rr.innerHTML='<div><p class="eyebrow">Ajustes</p><h2>Mapa</h2></div>'+
    '<div class="tgls">'+tg('cfgFlow',CFG.flow,'Movimento nas rotas','A linha se desenha do início ao fim, no sentido do ônibus. Desligue para a linha ficar parada.')+
    tg('cfgCompass',!!CFG.bussola,'Bússola na rosa dos ventos','A rosa gira com o celular e uma seta laranja aponta para o destino ou a partida do Seu trajeto, com a distância. Usa a localização e o sensor de direção. Também liga tocando na rosa.')+tg('cfgBldn',CFG.bldn!==false,'Nomes dos prédios no zoom','Ao aproximar o mapa, aparecem os nomes dos prédios e institutos, tirados da planta da UFRJ.')+'</div>'+
    '<div class="cfgtime"><label for="clk">Simular horário</label><div class="cfgtimerow"><input type="time" id="clk" value="'+esc(state.manual&&state.clk?state.clk:fmt(realNow()))+'"><button class="linkbtn" id="nowBtn" type="button"'+(state.manual?'':' hidden')+'>Agora</button></div></div>'+
    '<p class="muted small keep">Para ver como ficam as linhas e os avisos em outro horário, inclusive de noite. Deixe vazio ou toque em Agora para voltar à hora real do aparelho.</p>'+
    '<div><p class="eyebrow">Ajustes</p><h2>Avisos e notificações</h2></div>'+
    '<div class="tgls">'+
    tg('cfgBanner',CFG.banner,'Mudanças de data acima do mapa','Feriados transferidos, pontos facultativos e aulas suspensas.')+
    tg('cfgReps',CFG.reps,'Avisos dos alunos','Fila, ônibus atrasado e Wi-Fi fora do ar, no mapa e no painel.')+
    tg('cfgCoverToday',CFG.coverToday,'Aviso do dia na capa','A etiqueta amarela com o que muda hoje ou amanhã.')+
    '</div>'+
    '<div><p class="eyebrow">Ajustes</p><h2>Perfil</h2></div>'+
    (PERFIL?'<div class="prof"><span class="lg-face" aria-hidden="true">'+esc(PERFIL.name.charAt(0).toUpperCase())+'</span><span class="grow"><b>'+esc(PERFIL.name)+'</b><small>'+(PERFIL.bio?'Com biometria':PERFIL.pin?'Com código de 4 dígitos':'Sem código')+'</small></span><button class="copy" type="button" id="cfgLogout">Sair</button></div><div class="profact"><button class="linkbtn" type="button" id="cfgForget">Esquecer este perfil neste aparelho</button></div>':'<p class="muted small keep">Nenhum perfil salvo neste aparelho.</p>')+
    '<div class="tgls">'+tg('cfgLogin',CFG.login,'Tela de entrada ao abrir','Mostra o perfil salvo e o Face ID antes da capa.')+'</div>'+
    '<p class="muted small keep">Os ajustes ficam salvos neste aparelho.</p>';
  if(focusSel){var el=document.querySelector(focusSel);if(el)el.focus({preventScroll:true})};
  etapas('ajustes montados',focusSel);
}
document.addEventListener('click',function(e){var b=e.target.closest('[data-bg]');if(!b||!b.classList.contains('bgopt'))return;CFG.bg=b.dataset.bg;saveCfg();applyBg();renderCfg('.bgopt[data-bg="'+CFG.bg+'"]');var d=document.getElementById('bgdet');if(d)d.open=true});
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-cover]');
  if(b){CFG.cover=b.dataset.cover;saveCfg();applyCoverStyle();renderCfg('[data-cover="'+CFG.cover+'"]');var dt=document.getElementById('cvdet');if(dt)dt.open=true;return}
  if(e.target.closest('#cfgPreview')){cfgM.hidden=true;$('#tab-cfg').setAttribute('aria-pressed','false');openCover()}
});
document.addEventListener('change',function(e){
  var id=e.target.id,map={cfgBanner:'banner',cfgReps:'reps',cfgCoverToday:'coverToday',cfgLogin:'login',cfgFlow:'flow',cfgBldn:'bldn'};
  if(!map[id])return;CFG[map[id]]=e.target.checked;saveCfg();updateMap();if(id==='cfgBldn'&&gLab)drawLabels();drawBanner();drawShared();renderDetail();coverToday();
});
cPane=$('#pane-cal');cL=$('#cL');cR=$('#cR');
document.addEventListener('click',function(e){var g=e.target.closest('[data-tab-go]');if(!g)return;setTab(g.dataset.tabGo);try{history.replaceState(null,'','#'+g.dataset.tabGo)}catch(err){}var c=$('#pane-cal');if(c)c.scrollIntoView({behavior:'auto',block:'start'})});
cPane.addEventListener('submit',function(e){
  if(e.target.id!=='mudform')return;e.preventDefault();
  var t=$('#mudt').value.trim(),d=$('#mudd').value,de=$('#mudde').value,err=$('#muderr');
  if(!t||!d){err.className='gerr';err.textContent='Preencha o nome e a nova data.';return}
  if(!SH.on||mudBusy){err.className='gerr';err.textContent='O armazenamento compartilhado não está disponível agora.';return}
  mudBusy=true;var x=$('#mudx').value.trim();
  SH.db.doc('cal/m'+Date.now().toString(36)).set({t:t,d:d,de:de,k:$('#mudk').value,txt:x}).then(function(){mudBusy=false;err.className='gerr ok';err.textContent='Publicado. Todos já veem o aviso.'},function(){mudBusy=false;err.className='gerr';err.textContent='Não deu para publicar. Só o dono da página pode registrar mudanças.'});
});
cPane.addEventListener('click',function(e){var x=e.target.closest('[data-muddel]');if(x&&SH.on){SH.db.doc('cal/'+x.dataset.muddel).delete().catch(function(){});return}
  var b=e.target.closest('[data-per]');if(!b)return;cs.per=b.dataset.per;renderCal('[data-per="'+cs.per+'"]')});
/* ---------- ajustes em tela cheia ---------- */
var cfgM=$('#pane-cfg'),cfgPrevFocus=null;
function openCfg(){
  cfgPrevFocus=document.activeElement;renderCfg();cfgM.hidden=false;cfgM.classList.remove('closing');perfEnter(cfgM);
  document.documentElement.style.overflow='hidden';$('#tab-cfg').setAttribute('aria-pressed','true');
  cfgM.querySelector('.cfgsheet').scrollTop=0;setTimeout(function(){$('#cfgClose').focus({preventScroll:true})},30);
}
function closeCfg(){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;cfgM.classList.add('closing');
  setTimeout(function(){cfgM.hidden=true;if(cover.hidden&&login.hidden)document.documentElement.style.overflow='';$('#tab-cfg').setAttribute('aria-pressed','false');var g=$('#tab-cfg');if(g)g.focus({preventScroll:true})},rm?0:220);
}
$('#cfgClose').addEventListener('click',closeCfg);
cfgM.addEventListener('click',function(e){if(e.target===cfgM)closeCfg()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!cfgM.hidden&&cover.hidden&&login.hidden)closeCfg()});
/* ---------- glossário de siglas ---------- */
var GL_CATS=[['todas','Todas'],['lugar','Prédios e unidades'],['serv','Órgãos e serviços'],['acad','Vida acadêmica'],['net','Internet e sistemas']];
/* [sigla, nome por extenso, explicação, categoria, atalho] atalho: 's:<parada>' mapa · 'b:<prédio>' Lugares · 'c:<categoria>' Lugares */
var GLOSS=[
 ['UFRJ','Universidade Federal do Rio de Janeiro','A Cidade Universitária, na Ilha do Fundão, é o maior campus da UFRJ.','lugar',''],
 ['CT','Centro de Tecnologia','Engenharias (Escola Politécnica), Escola de Química e parte do Instituto de Química. Tem dois RUs.','lugar','b:ct'],
 ['CCMN','Centro de Ciências Matemáticas e da Natureza','Matemática, Física, Química, Geociências e Computação. Fica ao lado do CT.','lugar','b:ccmn'],
 ['CCS','Centro de Ciências da Saúde','O prédio grande ao lado do HU, com os cursos da saúde e da biologia.','lugar','s:ccsbb'],
 ['HU','Hospital Universitário Clementino Fraga Filho','Hospital da UFRJ, colado no CCS. Tem ponto das linhas internas na porta.','lugar','s:hu'],
 ['IPPMG','Instituto de Puericultura e Pediatria Martagão Gesteira','Hospital pediátrico da UFRJ, perto do HU.','lugar',''],
 ['EEFD','Escola de Educação Física e Desportos','Educação Física e Dança, com quadras, piscina e pista.','lugar','s:eefd'],
 ['IF','Instituto de Física','Parte fica no CCMN e parte no prédio novo da Av. Athos da Silveira Ramos.','lugar','s:ifn'],
 ['IM','Instituto de Matemática','Fica no CCMN, bloco C. A biblioteca é a Leopoldo Nachbin.','lugar','b:ccmn'],
 ['IQ','Instituto de Química','Aulas e biblioteca no CT, bloco A.','lugar','b:ct'],
 ['IC','Instituto de Computação','Fica no CCMN, com secretaria e laboratórios.','lugar','b:ccmn'],
 ['IGEO','Instituto de Geociências','Geografia, Geologia e Meteorologia, no CCMN.','lugar','b:ccmn'],
 ['PPGG','Programa de Pós-Graduação em Geografia','Dá nome à biblioteca de Geografia, no CCMN, bloco I.','lugar','b:ccmn'],
 ['NCE','Núcleo de Computação Eletrônica','Hoje se chama Instituto Tércio Pacitti, mas todo mundo ainda diz NCE. Fica no CCMN, bloco C.','lugar','b:ccmn'],
 ['EQ','Escola de Química','Fica no CT. A biblioteca atende Química e Engenharia Química.','lugar','b:ct'],
 ['EBA','Escola de Belas Artes','Fica no prédio da Reitoria (Jorge Machado Moreira).','lugar','s:reit'],
 ['FAU','Faculdade de Arquitetura e Urbanismo','Divide o prédio da Reitoria com a EBA.','lugar','s:reit'],
 ['IMA','Instituto de Macromoléculas Professora Eloisa Mano','Pesquisa em polímeros, entre o CT e a Reitoria.','lugar',''],
 ['COPPEAD','Instituto de Pós-Graduação e Pesquisa em Administração','Fim da linha 2 das linhas internas.','lugar','s:coppead'],
 ['RU','Restaurante Universitário','O “bandejão”. Há o RU Central, dois no CT e um em Letras.','lugar','c:comida'],
 ['IE','Instituto de Economia','Fica no campus da Praia Vermelha. Aqui aparece como fonte do calendário.','lugar',''],
 ['FND','Faculdade Nacional de Direito','Fica no centro do Rio. Aqui aparece como fonte do calendário.','lugar',''],
 ['CETEM','Centro de Tecnologia Mineral','Instituto federal de pesquisa (não é da UFRJ) com ponto das linhas internas.','lugar','s:cetem'],
 ['CEPEL','Centro de Pesquisas de Energia Elétrica','Centro de pesquisa da Eletrobras na ilha.','lugar','s:cepel'],
 ['CENPES','Centro de Pesquisas Leopoldo Américo Miguez de Mello','Centro de pesquisa da Petrobras. Há dois pontos: Cenpes I e II.','lugar','s:cenpes1'],
 ['CEPE','Clube dos Empregados da Petrobras','Clube na Av. Horácio Macedo, com ponto das linhas internas.','lugar','s:cepe'],
 ['IEN','Instituto de Engenharia Nuclear','Instituto da CNEN (não é da UFRJ), perto da Xistoquímica.','lugar',''],
 ['DISEG','Divisão de Segurança','Segurança e vigilância do campus. Cuida das guaritas e das câmeras.','serv','c:seg'],
 ['CCO','Centro de Controle Operacional','Central da Prefeitura que acompanha o trânsito e as câmeras da ilha.','serv','c:seg'],
 ['DFO','Divisão da Frota Oficial','Setor da Prefeitura Universitária que cuida dos veículos. Dá nome ao ponto CPST / DFO.','serv','s:cpst'],
 ['DIPRO','Divisão de Produção','Setor da Prefeitura Universitária. Dá nome a um ponto das linhas internas.','serv','s:dipro'],
 ['CPST','Coordenação de Políticas de Saúde do Trabalhador','Saúde dos servidores da UFRJ, ligada à PR-4.','serv','s:cpst'],
 ['PR-4','Pró-Reitoria de Pessoal','Cuida dos servidores. Publica a lista de endereços das unidades.','serv',''],
 ['SiBI','Sistema de Bibliotecas e Informação','Rede das bibliotecas da UFRJ. Os horários das bibliotecas vêm de lá.','serv','c:biblio'],
 ['TIC','Superintendência de Tecnologia da Informação e Comunicação','A TI da UFRJ. Cuida da Intranet e do eduroam.','serv',''],
 ['BRT','Bus Rapid Transit','Ônibus expresso em corredor exclusivo. A Estação de Integração liga o BRT às linhas internas.','serv','s:est'],
 ['MGI','Ministério da Gestão e da Inovação em Serviços Públicos','Define pontos facultativos e trocas de feriado para órgãos federais, como a UFRJ.','serv',''],
 ['SIGA','Sistema Integrado de Gestão Acadêmica','O Portal do Aluno: inscrição em disciplinas, notas e boletim.','acad',''],
 ['CRID','Confirmação de Registro de Inscrição em Disciplinas','O comprovante de que você ficou inscrito. Salve uma cópia a cada período.','acad',''],
 ['CR','Coeficiente de Rendimento','A média ponderada das suas notas no período.','acad',''],
 ['CRA','Coeficiente de Rendimento Acumulado','A média de todo o curso até agora. Pesa em bolsas e estágios.','acad',''],
 ['CA','Centro Acadêmico','Representação dos alunos de um curso. Bom lugar para tirar dúvidas de calouro.','acad',''],
 ['DCE','Diretório Central dos Estudantes Mário Prata','Representação de todos os alunos da UFRJ.','acad',''],
 ['eduroam','education roaming','Wi-Fi das universidades. Com o login da UFRJ, conecta aqui e em instituições do mundo todo.','net',''],
 ['RNP','Rede Nacional de Ensino e Pesquisa','Rede que liga as universidades brasileiras e opera o eduroam no país.','net',''],
 ['CPF','Cadastro de Pessoas Físicas','Seu login na Intranet UFRJ, junto com a senha.','net','']
];
var gl={cat:'todas',q:''},glM=$('#glossM'),glPrev=null;
function glFold(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
function glEsc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function glGo(a){
  if(!a)return '';
  var k=a.slice(0,1),v=a.slice(2);
  if(k==='s'&&STOPS[v])return '<button type="button" class="chip gl-go" data-glgo="'+a+'">Ver no mapa</button>';
  if(k==='b'||k==='c')return '<button type="button" class="chip gl-go" data-glgo="'+a+'">Ver em Lugares</button>';
  return '';
}
function renderGloss(){
  var q=glFold(gl.q.trim());
  var list=GLOSS.filter(function(g){
    if(gl.cat!=='todas'&&g[3]!==gl.cat)return false;
    if(!q)return true;
    return glFold(g[0]).indexOf(q)>=0||glFold(g[1]).indexOf(q)>=0||glFold(g[2]).indexOf(q)>=0;
  }).sort(function(a,b){
    if(q){var ea=glFold(a[0])===q?0:glFold(a[0]).indexOf(q)===0?1:2,eb=glFold(b[0])===q?0:glFold(b[0]).indexOf(q)===0?1:2;if(ea!==eb)return ea-eb}
    return a[0].localeCompare(b[0],'pt',{sensitivity:'base'});
  });
  $('#glCats').innerHTML=GL_CATS.map(function(c){return '<button type="button" class="chip" data-glcat="'+c[0]+'" aria-pressed="'+(gl.cat===c[0])+'">'+c[1]+'</button>'}).join('');
  $('#glSub').textContent=GLOSS.length+' siglas usadas no app e no dia a dia da UFRJ';
  $('#glList').innerHTML=list.length?list.map(function(g){
    return '<article class="gl-item"><h3 class="gl-s" lang="pt-BR">'+glEsc(g[0])+'</h3><p class="gl-n">'+glEsc(g[1])+'</p><p class="gl-d muted">'+glEsc(g[2])+'</p>'+glGo(g[4])+'</article>';
  }).join(''):'<p class="gl-empty muted">Nenhuma sigla encontrada para “'+glEsc(gl.q.trim())+'”.</p>';
}
function openGloss(q){
  glPrev=document.activeElement;if(typeof q==='string'){gl.q=q;gl.cat='todas'}
  if(!cfgM.hidden)cfgM.hidden=true,$('#tab-cfg').setAttribute('aria-pressed','false');
  renderGloss();$('#glQ').value=gl.q;glM.hidden=false;glM.classList.remove('closing');perfEnter(glM);
  document.documentElement.style.overflow='hidden';$('#glossBtn').setAttribute('aria-pressed','true');
  glM.querySelector('.cfgsheet').scrollTop=0;
  setTimeout(function(){var f=window.matchMedia('(pointer:fine)').matches?$('#glQ'):$('#glClose');f.focus({preventScroll:true})},30);
}
function closeGloss(after){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;glM.classList.add('closing');
  setTimeout(function(){glM.hidden=true;document.documentElement.style.overflow='';$('#glossBtn').setAttribute('aria-pressed','false');
    if(after)after();else{var g=$('#glossBtn');if(g)g.focus({preventScroll:true})}},rm?0:220);
}
$('#glossBtn').addEventListener('click',function(){if(glM.hidden)openGloss();else closeGloss()});
$('#glClose').addEventListener('click',function(){closeGloss()});
glM.addEventListener('click',function(e){
  if(e.target===glM){closeGloss();return}
  var c=e.target.closest('[data-glcat]');if(c){gl.cat=c.dataset.glcat;renderGloss();var f=glM.querySelector('[data-glcat="'+gl.cat+'"]');if(f)f.focus();return}
  var g=e.target.closest('[data-glgo]');if(!g)return;
  var a=g.dataset.glgo,k=a.slice(0,1),v=a.slice(2);
  closeGloss(function(){
    if(k==='s'){setTab('trajeto');try{history.replaceState(null,'','#trajeto')}catch(err){}select('stop',v,false);scrollToMap()}
    else{if(k==='b'){pstate.bld=v;pstate.pl=null;pstate.pf=undefined;pstate.bldOpen=true}else{pstate.cat=v;pstate.q='';pstate.hrsOpen=true}
      setTab('predios');try{history.replaceState(null,'','#predios')}catch(err){}
      var el=k==='b'?$('#planbox'):$('#pHours');if(el)el.scrollIntoView({behavior:'auto',block:'start'})}
  });
});
$('#glQ').addEventListener('input',function(e){gl.q=e.target.value;renderGloss()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!glM.hidden){e.stopPropagation();closeGloss()}},true);
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
/* ======================= Lugares: lista enxuta + planta ======================= */
var LCAT=[['todos','Todos'],['aberto','Abertos agora'],['comida','Alimentação'],['biblio','Bibliotecas'],['atend','Atendimento'],['seg','Segurança']];
var LORD={comida:0,biblio:1,atend:2,seg:3},LNAME={comida:'Alimentação',biblio:'Bibliotecas',atend:'Atendimento',seg:'Segurança'},LMAX=4;
pstate.more=pstate.more||{};
function lugRank(it,now){var s=statusOf(it,now);if(it.wk===null&&!it.fechadoTemp)return 4;return s.c==='good'?0:s.c==='warn'?1:2}
function lugHrs(it,we){return it.wk===null?'Sem horário fixo':rangesTxt(rangesOf(it,we),it.incl)}
function lugDetail(k,now){
  var it=PL[k],goPlan=it.bld&&BLD[it.bld]&&it.b;
  return '<div class="lgd" id="lgd-'+k+'"><dl class="kv"><dt>Onde</dt><dd>'+esc(it.where)+'</dd><dt>Seg. a sex.</dt><dd class="mono">'+rangesTxt(it.wk,it.incl)+'</dd><dt>Fim de semana</dt><dd class="mono">'+rangesTxt(it.we===undefined?'unk':it.we)+'</dd></dl>'+
    (it.fechadoTemp?'<div class="warnbox"><b>Fechado temporariamente</b>Informado pela gestão do app.</div>':'')+
    (it.note?'<p class="small muted keep">'+esc(it.note)+'</p>':'')+
    (RUS.indexOf(k)>=0?'<div class="fila-in lgfila"><p class="small"><b>Fila agora</b></p>'+filaRow(k,now)+'</div>':'')+
    '<div class="later">'+(goPlan?'<button class="copy" type="button" data-goplan="'+k+'">Ver na planta</button>':'')+(it.p&&!it.bld?'<button class="copy" type="button" data-showmap="'+k+'">Ver no mapa</button>':'')+
    '<button type="button" class="linkbtn sugg" data-req="servico||'+esc(it.name)+'">Sugerir correção</button></div></div>';
}
function lugRow(k,now,we){
  var it=PL[k],open=pstate.pl===k&&pstate.open;
  return '<div class="lgi'+(open?' open':'')+'"><button class="lgrow" type="button" data-lgo="'+k+'" aria-expanded="'+open+'"><span class="grow"><b>'+esc(it.name)+'</b><small>'+esc(it.s&&it.bld?it.where:it.where)+'</small></span><span class="lgr"><span class="mono lgh2">'+lugHrs(it,we)+'</span>'+pill(statusOf(it,now))+(RUS.indexOf(k)>=0&&filaOf(k)?filaPill(k):'')+'</span></button>'+(open?lugDetail(k,now):'')+'</div>';
}
/* lista de lugares com horário, busca e filtros (fica dentro da dobra "Onde fica e quando abre") */
function hoursListHTML(now){
  if(!LCAT.some(function(c){return c[0]===pstate.cat}))pstate.cat='todos';
  var q=glFold(pstate.q.trim()),we=isWeekend()&&!state.manual;
  var all=Object.keys(PL).filter(function(k){var it=PL[k];return LORD[it.cat]!==undefined&&!it.line});
  var nOpen=all.filter(function(k){return statusOf(PL[k],now).c==='good'}).length,nSoon=all.filter(function(k){return /Fecha em|Última em/.test(statusOf(PL[k],now).t)}).length;
  var list=all.filter(function(k){var it=PL[k],s=statusOf(it,now);
    if(pstate.cat==='aberto'){if(s.c==='bad'||it.wk===null||/Confirmar/.test(s.t))return false}
    else if(pstate.cat!=='todos'&&it.cat!==pstate.cat)return false;
    return !q||glFold(it.name+' '+(it.s||'')+' '+it.where).indexOf(q)>=0});
  list.sort(function(a,b){return LORD[PL[a].cat]-LORD[PL[b].cat]||lugRank(PL[a],now)-lugRank(PL[b],now)||PL[a].name.localeCompare(PL[b].name,'pt')});
  var groups={};list.forEach(function(k){(groups[PL[k].cat]=groups[PL[k].cat]||[]).push(k)});
  var cut=!q&&pstate.cat==='todos',out='';
  Object.keys(LORD).forEach(function(c){var g=groups[c];if(!g)return;
    var show=cut&&!pstate.more[c]&&g.length>LMAX+1?g.slice(0,LMAX):g;
    if(pstate.pl&&g.indexOf(pstate.pl)>=0&&show.indexOf(pstate.pl)<0)show=show.concat([pstate.pl]);
    out+='<div class="lgg"><h3 class="lgt">'+LNAME[c]+' <span class="muted">'+g.length+'</span></h3>'+show.map(function(k){return lugRow(k,now,we)}).join('')+
      (show.length<g.length?'<button type="button" class="linkbtn lgmore" data-lgmore="'+c+'">Ver mais '+(g.length-show.length)+'</button>':'')+'</div>'});
  return '<label class="fld"><span class="sr">Buscar local</span><input type="search" id="hq" placeholder="Buscar local, sala ou bloco" value="'+esc(pstate.q)+'"></label>'+
    '<div class="chips lgchips" role="group" aria-label="Filtrar">'+LCAT.map(function(c){return '<button class="chip" type="button" data-cat="'+c[0]+'" aria-pressed="'+(pstate.cat===c[0])+'">'+c[1]+(c[0]==='aberto'?' <span class="cnum">'+nOpen+'</span>':'')+'</button>'}).join('')+'</div>'+
    (nSoon?'<p class="small lgsoon"><i class="pin-dot warn"></i>'+nSoon+(nSoon>1?' locais fecham':' local fecha')+' em até 30 min</p>':'')+
    '<div class="lglist">'+(out||'<p class="muted">Nada encontrado. Tente outra palavra.</p>')+'</div>'+
    '<p class="muted small keep">Horários de dias úteis informados pela UFRJ; em férias e feriados podem mudar. Os horários dos ônibus estão na aba Trajetos.</p>';
}function saveFolds(){try{localStorage.setItem('cse-folds',JSON.stringify({f:!!pstate.filaBox,b:!!pstate.bldOpen}))}catch(e){}}
(function(){try{var o=JSON.parse(localStorage.getItem('cse-folds'))||{};pstate.filaBox=!!o.f;pstate.bldOpen=!!o.b}catch(e){}})();
function filaResumo(){
  var known=RUS.map(function(k){return [k,filaOf(k)]}).filter(function(x){return x[1]});
  if(!known.length)return '<span class="fsum muted">Ninguém informou nos últimos 45 min</span>';
  known.sort(function(a,b){return b[1].n-a[1].n});
  return '<span class="fsum">'+known.slice(0,2).map(function(x){var L=FILA_N[x[1].n];return '<span class="fdot '+L[2]+'"></span>'+esc(PL[x[0]].name)+': '+(x[1].n?L[0].toLowerCase():'sem fila')}).join(' · ')+(known.length>2?' · +'+(known.length-2):'')+'</span>';
}
function filaBody(){
  var now=nowMin(),why='';
  if(SH.on&&blocked(SH.uid))why='Sua conta não pode informar filas no momento (decisão da gestão).';
  else if(SH.on&&FBMODE&&SH.full&&GESTOR!==true)why=fullMsg('informar a fila');
  else if(SH.on&&(SH.denied||SH.write===false))why=FBMODE?'Você pode ver as filas. Para informar, toque em Informar e entre com sua conta.':'Você pode ver as filas. Para informar, o dono da página precisa te dar acesso de colaborador.';
  if(!PERFIL)return '<div class="filabox flat" id="filabox"><div class="fila-l">'+RUS.map(function(k){return filaRow(k,now)}).join('')+'</div><div class="row bdj-row">'+bandejaLinkHTML()+'</div>'+needProfileHTML('informar a fila')+'</div>';
  return '<div class="filabox flat" id="filabox"><div class="fila-l">'+RUS.map(function(k){return filaRow(k,now)}).join('')+'</div><div class="row bdj-row">'+bandejaLinkHTML()+'</div>'+
    (filaMsg?'<p class="small fila-ok" role="status">'+esc(filaMsg)+'</p>':'')+
    '<p class="muted small keep">'+(why||'Está na fila? Toque em Informar e escolha o tamanho. Seu nome não aparece, e os avisos mais recentes pesam mais.')+'</p></div>';
}
function foldHTML(id,open,title,sub,body){
  return '<details class="fold" id="'+id+'"'+(open?' open':'')+'><summary><span class="fold-t"><b>'+title+'</b>'+sub+'</span><span class="fold-c" aria-hidden="true"></span></summary><div class="fold-b">'+body+'</div></details>';
}
function bldInner(now){
  var extra=[];(GST.plantas.items||[]).forEach(function(p){if(!BLD[p.bld]&&extra.indexOf(p.bld)<0)extra.push(p.bld)});
  if(!BLD[pstate.bld]&&extra.indexOf(pstate.bld)<0)pstate.bld='ct';
  var chips='<div class="chips" role="group" aria-label="Escolha o prédio">'+Object.keys(BLD).concat(extra).map(function(k){var nm=BLD[k]?BLD[k].short:plantName(plantasDe(k)[0]);return '<button class="chip" type="button" data-bld="'+esc(k)+'" aria-pressed="'+(k===pstate.bld)+'">'+esc(nm)+'</button>'}).join('')+'</div>';
  var head=chips;
  if(!BLD[pstate.bld])return head+'<p class="small"><b>'+esc(plantName(plantasDe(pstate.bld)[0]))+'</b></p>'+plantasHTML(pstate.bld);
  var B=BLD[pstate.bld],sel=PL[pstate.pl]&&PL[pstate.pl].bld===pstate.bld&&PL[pstate.pl].b?pstate.pl:null;
  if(pstate.bld==='ct'){
    if(!CTP)return head+'<p class="muted small">Carregando a planta do CT…</p>';/* a parte da planta (21) ainda não carregou */
    /* no CT, a planta real substitui o esquema de exemplo; uma sala escolhida em outro lugar (glossário, grade) abre no bloco e andar dela */
    var P=PL[pstate.pl];if(pstate.pl!==CTP.lastPl){CTP.lastPl=pstate.pl;if(P&&P.bld==='ct'){if(P.b)CTP.bl=P.b;if(P.f!=null)CTP.pav=P.f<=0?'subsolo':'pav'+P.f;CTP.f={biblio:'estudo',aula:'aula',wc:'wc',lab:'lab'}[P.cat]||'';CTP.vb=null;CTP.sel=null}}
    if(CTP.d&&CTP.bl&&!CTP.d.salas.some(function(s){return s[0]===CTP.bl})){var alt=CTP.d.salas.filter(function(s){return s[0].indexOf(CTP.bl)>=0})[0];CTP.bl=alt?alt[0]:''}
    return head+'<p class="small"><b>'+B.name+'</b> · <span class="muted">'+B.addr+'</span></p>'+plantasHTML('ct')+ctpHTML();
  }
  return head+'<p class="small"><b>'+B.name+'</b> · <span class="muted">'+B.addr+'</span></p>'+plantasHTML(pstate.bld)+planHTML(sel)+
    '<details class="det lgabout"><summary>Sobre este esquema</summary><p class="muted small keep">'+B.note+' Planta ilustrativa: a UFRJ não publica as plantas dos prédios. Bloco, andar e número da sala são oficiais; a posição exata da sala no corredor é aproximada. Quando a fonte só dá a sala, o andar sai do número (sala 527 → 5º andar).</p></details>';
};
pPane.addEventListener('toggle',function(e){var d=e.target;if(!d||!d.classList||!d.classList.contains('fold'))return;
  var was=d.id==='fdFila'?pstate.filaBox:pstate.bldOpen;if(was===d.open)return;
  if(d.id==='fdFila')pstate.filaBox=d.open;else if(d.id==='fdBld')pstate.bldOpen=d.open;else return;
  saveFolds();if(d.open){var b=d.querySelector('.fold-b');if(b&&!b.firstChild){renderPredios();var n=document.getElementById(d.id);if(n){var s=n.querySelector('summary');if(s)s.focus({preventScroll:true})}}}},true);
pPane.addEventListener('click',function(e){
  var t=e.target.closest('[data-lgo],[data-goplan],[data-lgmore]');if(!t)return;
  if(t.dataset.lgmore){pstate.more[t.dataset.lgmore]=true;renderPredios();return}
  var k=t.dataset.lgo||t.dataset.goplan,it=PL[k];if(!it)return;
  if(t.dataset.lgo){var was=pstate.pl===k&&pstate.open;pstate.open=!was;pstate.pl=k}
  if(it.bld&&BLD[it.bld]&&it.b){pstate.bld=it.bld;pstate.pf=undefined;if(it.b!=='?'){pstate.eb=it.b;pstate.ef=it.f}}
  renderPredios(t.dataset.lgo?'[data-lgo="'+k+'"]':null);
  if(t.dataset.goplan){if(!pstate.bldOpen||!pstate.planOpen){pstate.bldOpen=true;pstate.planOpen=true;saveFolds();renderPredios()}var pb=$('#planbox');if(pb){pb.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});var f=pb.querySelector('.chip[aria-pressed="true"]');if(f)f.focus({preventScroll:true})}}
});
/* membros: registra a visita (uma escrita a cada 30 min no máximo) */
function trackMember(uid){
  if(!uid||!SH.db)return;
  if(FBMODE&&typeof memberFlow==='function'){memberFlow(uid);return}
  var k='cse-seen-'+uid,last=0;try{last=+localStorage.getItem(k)||0}catch(e){}
  if(Date.now()-last<30*60000)return;
  SH.db.doc('members/'+uid).get().then(function(d){var x=d.exists?(d.data()||{}):{},now=Date.now();
    var o={first:+x.first||now,last:now,visits:(+x.visits||0)+1};if(FBMODE&&ACC.name)o.nome=String(ACC.name).slice(0,60);
    return SH.db.doc('members/'+uid).set(o);
  }).then(function(){try{localStorage.setItem(k,String(Date.now()))}catch(e){}},function(){});
}
if((!window.claude||typeof window.claude.use!=='function')&&!FBMODE){loadLocalG();if(Object.keys(GST.linhas).length||Object.keys(GST.pontos).length||Object.keys(GST.wifi).length||Object.keys(GST.servicos).length||(GST.plantas.items||[]).length)rebuildAll();setGestor('demo')}
$('#gestBtn').addEventListener('click',function(){if(gestM&&!gestM.hidden)closeGest();else openGest()});
/* ======================= conta: claude.ai ou Google (Firebase) + ajustes na nuvem ======================= */
/* No claude.ai a conta do Claude identifica a pessoa (ajustes em data/users/<id>/ajustes, privado).
   Fora dele (GitHub Pages), com js/config.js preenchido, entra com Google via Firebase Auth e guarda em Firestore usuarios/<uid>. */
var FB_CFG=window.CSE_FIREBASE||null;
var FB_ON=!!(FB_CFG&&FB_CFG.apiKey&&FB_CFG.projectId)&&!(window.claude&&typeof window.claude.use==='function');
var ACC={kind:null,uid:null,name:'',email:'',photo:'',fb:null,mute:false,t:0,last:0,state:'',busy:false};
function accSettings(){return {cfg:Object.assign({},CFG),rota:{from:state.from,to:state.to}}}
function applyRemote(d){
  if(!d||typeof d!=='object')return;
  var ch=false;
  if(d.cfg&&typeof d.cfg==='object')Object.keys(CFG).forEach(function(k){if(k in d.cfg&&typeof d.cfg[k]===typeof CFG[k]&&CFG[k]!==d.cfg[k]){CFG[k]=d.cfg[k];ch=true}});
  ACC.mute=true;
  if(ch){saveCfg();applyBg();applyFont();applyTheme();applyCoverStyle();updateMap();drawBanner();drawShared();renderDetail();coverToday()}
  if(d.rota&&STOPS[d.rota.from]&&STOPS[d.rota.to]&&d.rota.from!==d.rota.to&&(d.rota.from!==state.from||d.rota.to!==state.to)){state.from=d.rota.from;state.to=d.rota.to;savePrefs();renderPlan();updateMap()}
  if(ACC.kind==='google'&&Array.isArray(d.grade)&&d.grade.length){GRADE=d.grade.filter(function(x){return x&&x.nome}).slice(0,40);saveGrade();syncAulas();renderGrade()}
  ACC.mute=false;
  if(!cfgM.hidden)renderCfg();
  applyExtra(d);
}
function accQueue(){if(!ACC.kind||ACC.mute)return;clearTimeout(ACC.t);ACC.state='salvando';accPaint();ACC.t=setTimeout(accPush,900)}
function accPush(){
  if(!ACC.kind)return;
  var s=accSettings(),p;
  if(ACC.kind==='claude')p=SH.db.doc('data/users/'+ACC.uid+'/ajustes').set({cfg:s.cfg,rota:s.rota,ts:Date.now()});
  else p=ACC.fb.db.collection('usuarios').doc(ACC.uid).set({cfg:s.cfg,rota:s.rota,grade:GRADE||[],nome:ACC.name||'',ts:Date.now()},{merge:true});
  /* contato para a volta à noite e contagem de contribuições vão junto */
  try{if(ACC.kind==='google'&&ACC.fb)ACC.fb.db.collection('usuarios').doc(ACC.uid).set({contato:CONT,contrib:CONTRIB},{merge:true}).catch(function(){});
    else if(ACC.kind==='claude'&&SH.db)SH.db.doc('data/users/'+ACC.uid+'/extra').set({contato:CONT,contrib:CONTRIB,ts:Date.now()}).catch(function(){})}catch(e){}
  return p.then(function(){ACC.last=Date.now();ACC.state='ok';accPaint()},function(){ACC.state='erro';accPaint()});
}
/* claude.ai */
function accClaude(user,uid){
  if(user&&user.me)user.me().then(function(me){if(me&&me.avatarUrl)savePhoto(me.avatarUrl)},function(){});/* foto da conta do Claude */
  if(!uid||!SH.db)return;
  /* contato da volta à noite e contribuições guardadas na conta */
  try{SH.db.doc('data/users/'+uid+'/extra').get().then(function(d){if(d.exists){applyExtra(d.data());if(!cfgM.hidden)renderCfgKeep()}},function(){})}catch(e){}
  ACC.kind='claude';ACC.uid=uid;ACC.state='carregando';
  (user?user.me():Promise.resolve({})).then(function(me){ACC.name=me&&me.name||'';ACC.photo=me&&me.avatarUrl||'';accPaint()});
  SH.db.doc('data/users/'+uid+'/ajustes').get().then(function(d){
    if(d.exists){applyRemote(d.data()||{});ACC.last=+(d.data()||{}).ts||Date.now();ACC.state='ok'}else accPush();
    accPaint();
  },function(){ACC.state='erro';accPaint()});
}
/* Google via Firebase (só fora do claude.ai, com js/config.js preenchido) */
var FBV='10.12.2';
function loadJS(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=function(){rej(new Error('Não deu para carregar '+src))};document.head.appendChild(s)})}
function fbInit(){
  if(ACC.fb)return Promise.resolve(ACC.fb);
  var base='https://www.gstatic.com/firebasejs/'+FBV+'/';
  return loadJS(base+'firebase-app-compat.js').then(function(){return Promise.all([loadJS(base+'firebase-auth-compat.js'),loadJS(base+'firebase-firestore-compat.js')])}).then(function(){
    if(!firebase.apps.length)firebase.initializeApp(FB_CFG);
    ACC.fb={auth:firebase.auth(),db:firebase.firestore()};return ACC.fb;
  });
}
function fbMsg(e,kind){var c=e&&e.code||'',mail=kind==='mail';
  if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return '';
  if(c==='auth/unauthorized-domain')return 'Este endereço ainda não está autorizado no Firebase (Authentication › Configurações › Domínios autorizados).';
  if(c==='auth/operation-not-allowed')return mail?'Ative o login com e-mail e senha no Firebase (Authentication › Método de login › E-mail/senha).':'Ative o login com Google no Firebase (Authentication › Método de login).';
  if(c==='auth/network-request-failed')return 'Sem conexão. Tente de novo.';
  if(c==='auth/invalid-email'||c==='auth/missing-email')return 'Esse e-mail não parece válido. Confira se digitou certo.';
  if(c==='auth/user-not-found'||c==='auth/wrong-password'||c==='auth/invalid-credential'||c==='auth/invalid-login-credentials')return 'E-mail ou senha não conferem. Confira os dois ou toque em "Esqueci a senha".';
  if(c==='auth/missing-password')return 'Digite a senha.';
  if(c==='auth/email-already-in-use')return 'Já existe uma conta com esse e-mail. Toque em "Já tenho conta" para entrar.';
  if(c==='auth/weak-password')return 'A senha precisa ter pelo menos 6 caracteres.';
  if(c==='auth/too-many-requests')return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if(c==='auth/user-disabled')return 'Esta conta foi desativada pelo gestor do app.';
  if(c==='auth/account-exists-with-different-credential')return 'Esse e-mail já entra por outro método. Tente "Entrar com Google".';
  return mail?'Não deu para entrar com e-mail agora.':'Não deu para entrar com Google agora.'}
function googleIn(){
  fbInit().then(function(fb){
    var pr=new firebase.auth.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
    return fb.auth.signInWithPopup(pr).catch(function(e){if(e&&(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'))return fb.auth.signInWithRedirect(pr);throw e});
  }).then(function(){if(!login.hidden)closeLogin()}).catch(function(e){var m=fbMsg(e);if(m)gToast(m,1)});
}
function googleOut(){if(!ACC.fb)return;var w=ACC.prov==='email'?'da sua conta':'da conta Google';ACC.fb.auth.signOut().then(function(){if(PERFIL&&PERFIL.google){PERFIL=null;savePerfil()}gToast('Você saiu '+w+'. Os ajustes continuam neste aparelho.')})}
function accGoogle(u){
  var pv=(u.providerData||[]).map(function(x){return x&&x.providerId});
  ACC.prov=pv.indexOf('google.com')>=0?'google':'email';ACC.verified=!!u.emailVerified;
  ACC.kind='google';ACC.uid=u.uid;ACC.name=u.displayName||(ACC.prov==='email'?String(u.email||'').split('@')[0]:'');ACC.email=u.email||'';ACC.photo=u.photoURL||'';ACC.state='carregando';accPaint();
  if(!PERFIL&&ACC.name){PERFIL={name:ACC.name.split(' ')[0].slice(0,24),pin:null,google:true};savePerfil();if(!login.hidden)lgShow('saved')}
  ACC.fb.db.collection('usuarios').doc(u.uid).get().then(function(d){
    if(d.exists){applyRemote(d.data()||{});ACC.last=+(d.data()||{}).ts||Date.now();ACC.state='ok';gToast(ACC.prov==='email'?'Ajustes carregados da sua conta.':'Ajustes carregados da sua conta Google.')}else accPush();
    accPaint();
  },function(){ACC.state='erro';accPaint()});
  /* foto: a da conta Google ou, para e-mail e senha, a do Gravatar */
  if(ACC.photo)savePhoto(ACC.photo);else gravatar(u.email).then(function(url){if(url&&ACC.uid===u.uid)savePhoto(url)});
  gradeAuthSync();
}
/* Firebase também como banco compartilhado: fila, avisos, notas, pedidos, calendário e gestão */
function fbShared(fb){
  var db=fb.db;SH.db=db;SH.on=true;SH.write=false;
  db.collection('votes').onSnapshot(function(s){SH.votes=aggVotes(s.docs);refreshAll()},function(){});
  db.collection('cal').onSnapshot(function(s){MUD_DB=s.docs.map(function(d){var x=d.data()||{};return {id:d.id,d:String(x.d||''),de:x.de?String(x.de):'',t:String(x.t||'').slice(0,60),k:String(x.k||'facultativo'),txt:String(x.txt||'').slice(0,240),src:/^https:\/\//.test(x.src||'')?String(x.src):''}});drawBanner();refreshAll();if(cPane&&!cPane.hidden&&!cPane.contains(document.activeElement))renderCal()},function(){});
  db.collection('fila').onSnapshot(function(s){SH.fila=flatFila(s.docs);refreshAll();drawShared();if(gestM&&!gestM.hidden)renderGest()},function(){});
  db.collection('reports').onSnapshot(function(s){SH.reps=flatReps(s.docs);refreshAll();if(gestM&&!gestM.hidden)renderGest()},function(){});
  db.collection('gestao').onSnapshot(function(s){var seen={};s.docs.forEach(function(d){if(GKEYS.indexOf(d.id)<0)return;var v=(d.data()||{}).v;if(v&&typeof v==='object'){GST[d.id]=v;seen[d.id]=1}});
    GKEYS.forEach(function(k){if(!seen[k])GST[k]=k==='plantas'?{items:[]}:k==='bloqueados'?{ids:[]}:{}});if(!Array.isArray(GST.plantas.items))GST.plantas.items=[];GST.plantas.items=GST.plantas.items.filter(function(x){return x&&typeof x==='object'});if(!Array.isArray(GST.bloqueados.ids))GST.bloqueados.ids=[];
    rebuildAll();if(!cfgM.hidden)renderCfg()},function(){});
  refreshAll();
  etapas('Firebase conectado',fb);
}
var fbReqUnsub=null;
function fbUserOn(u){
  var db=SH.db,uid=u.uid;SH.uid=uid;SH.write=true;SH.denied=false;
  db.doc('votes/'+uid).get().then(function(d){if(d.exists){var rr=(d.data()||{}).r||{};Object.keys(rr).forEach(function(k){if(WIFI[k]&&rr[k]>=1&&rr[k]<=5)mine[k]=+rr[k]});saveMine()}else if(Object.keys(mine).length){writeVotes()}refreshAll()},function(){});
  loadGrade();setTimeout(function(){trackMember(uid)},400);
  if(fbReqUnsub)fbReqUnsub();
  fbReqUnsub=db.doc('requests/'+uid).onSnapshot(function(d){var it=d.exists?((d.data()||{}).items||[]):[];SH.myReq=flatReq([{id:uid,data:function(){return {items:it}}}]);if(!cfgM.hidden)renderCfg()},function(){});
  if(u.email)db.doc('gestores/'+String(u.email).toLowerCase()).get().then(function(d){if(d.exists){var gx=d.data()||{};ME.principal=gx.super===true||!('perms' in gx);ME.perms=ME.principal?null:(gx.perms||{});MUD_OWNER=true;setGestor(true);if(cPane&&!cPane.hidden)renderCal();gToast('Você entrou como gestor.')}},function(){});
  refreshAll();
setTimeout(covLoop,3000);}
function fbUserOff(){
  SH.uid=null;SH.write=false;SH.myReq=[];if(fbReqUnsub){fbReqUnsub();fbReqUnsub=null}
  MUD_OWNER=false;if(GESTOR===true){if(gestM&&!gestM.hidden)closeGest();GESTOR=false;var b=$('#gestBtn');if(b)b.hidden=true}
  refreshAll();if(cPane&&!cPane.hidden)renderCal();
  etapas('usuário saiu');
}
if(FB_ON){
  fbInit().then(function(fb){
    fbShared(fb);
    fb.auth.getRedirectResult().catch(function(e){var m=fbMsg(e);if(m)gToast(m,1)});
    fb.auth.onAuthStateChanged(function(u){if(u){accGoogle(u);fbUserOn(u)}else{if(ACC.kind==='google'){ACC.kind=null;ACC.uid=null;ACC.state='';accPaint()}fbUserOff()}});
  }).catch(function(){FB_ON=false;accPaint()});
}
/* interface: Ajustes › Conta e botão no login */
function accHTML(){
  var st=ACC.state==='salvando'?'<span class="pill warn">Salvando…</span>':ACC.state==='erro'?'<span class="pill bad">Não salvou</span>':ACC.state==='carregando'?'<span class="pill">Carregando…</span>':'<span class="pill good">Sincronizado</span>';
  var av=function(){return ACC.photo?'<img class="acc-av" src="'+esc(ACC.photo)+'" alt="" referrerpolicy="no-referrer">':'<span class="acc-av">'+esc((ACC.name||'?').charAt(0).toUpperCase())+'</span>'};
  var h='<div class="accsec" id="accsec"><h2>Conta</h2>';
  if(ACC.kind==='claude')h+='<div class="acc">'+av()+'<span class="grow"><b>'+esc(ACC.name||'Você')+'</b><small>Conta do claude.ai'+(ACC.last?' · salvo '+agoTxt(ACC.last):'')+'</small></span>'+st+'</div><p class="muted small keep">Seus ajustes e o trajeto favorito ficam guardados na sua conta, só para você, e aparecem em qualquer aparelho. A grade também.</p><p class="muted small keep">Para sair da conta do Claude, use o menu do próprio claude.ai. O botão Sair do perfil fecha só o app.</p>';
  else if(ACC.kind==='google'){var em=ACC.prov==='email';
    h+='<div class="acc">'+av()+'<span class="grow"><b>'+esc(ACC.name||(em?'Sua conta':'Conta Google'))+'</b><small>'+esc(ACC.email)+(em?' · e-mail e senha':'')+(ACC.last?' · salvo '+agoTxt(ACC.last):'')+'</small></span>'+st+'</div>'+
      (em&&!ACC.verified?'<div class="accmail"><p class="small"><span class="pill warn">E-mail não confirmado</span> Abra o link que enviamos para '+esc(ACC.email)+'. Olhe também a caixa de spam.</p><div class="row"><button type="button" class="copy" id="accVerify">Reenviar e-mail</button><button type="button" class="copy" id="accVerified">Já confirmei</button></div></div>':'')+
      '<p class="muted small keep">Seus ajustes, o trajeto favorito e a grade ficam na sua conta e aparecem em qualquer aparelho em que você entrar.</p><div class="accmail"><div class="row">'+(em?'<button type="button" class="copy" id="accReset">Trocar a senha</button>':'')+'<button type="button" class="copy" id="accOut">Sair da conta</button></div></div>'}
  else if(FB_ON)h+='<p class="small">Entre com a conta Google ou com e-mail e senha para levar seus ajustes, o trajeto favorito e a grade para qualquer aparelho.</p><div class="accmail"><div class="row"><button type="button" class="copy primary" data-goo>Entrar com Google</button><button type="button" class="copy primary" data-mail>Entrar com e-mail</button></div></div><p class="muted small keep">Sem entrar, tudo fica salvo só neste aparelho.</p>';
  else h+='<p class="small">Seus ajustes ficam salvos só neste aparelho.</p><p class="muted small keep">Para entrar com Google, publique o app com o arquivo js/config.js preenchido (passo a passo no README do projeto). No claude.ai, a sua conta do Claude já guarda tudo.</p>';
  /* com conta: contribuições e dados; sem conta: o que se ganha entrando */
  if(contaOk())h+=contribHTML()+dadosHTML();
  else if(FB_ON)h+='<p class="small keep la-p"><b>Com uma conta você também tem:</b></p>'+laBenHTML();
  return h+'</div>';
}
function accPaint(){var s=$('#accsec');if(s&&!cfgM.hidden){var tmp=document.createElement('div');tmp.innerHTML=accHTML();s.replaceWith(tmp.firstChild)}}
aoFazer('ajustes montados',function(f){var R=$('#cfgR');if(R&&!R.querySelector('#accsec'))R.insertAdjacentHTML('afterbegin',accHTML())});
document.querySelectorAll('#login .lg-goo').forEach(function(b){b.hidden=!FB_ON});
/* login com e-mail e senha (Firebase) */
var MAIL={mode:'in',busy:false};
function mailMode(m){
  MAIL.mode=m;var up=m==='up';
  $('#lgMailIn').setAttribute('aria-pressed',String(!up));$('#lgMailUp').setAttribute('aria-pressed',String(up));
  $('#lgMailT').textContent=up?'Criar conta com e-mail':'Entrar com e-mail';
  $('#lgMailNome').hidden=!up;$('#lgMailNomeL').hidden=!up;
  $('#lgMailPass').setAttribute('autocomplete',up?'new-password':'current-password');
  $('#lgMailGo').textContent=up?'Criar conta e entrar':'Entrar';
  $('#lgMailForgotW').hidden=up;$('#lgMailErr').textContent='';$('#lgMailOk').textContent='';
}
function openMail(mode){if(mode)MAIL.mode=mode;if(login.hidden)openLogin();lgShow('mail')}
function mailBusy(on,label){MAIL.busy=on;var g=$('#lgMailGo');g.disabled=on;g.textContent=on?label:(MAIL.mode==='up'?'Criar conta e entrar':'Entrar')}
function mailFb(){return fbInit().then(function(fb){try{fb.auth.languageCode='pt-BR'}catch(_){}return fb})}
$('#lgMailIn').addEventListener('click',function(){mailMode('in')});
$('#lgMailUp').addEventListener('click',function(){mailMode('up')});
$('#lgMailShow').addEventListener('change',function(){$('#lgMailPass').type=this.checked?'text':'password'});
$('#lgMailBack').addEventListener('click',function(){lgShow(PERFIL?'saved':'new')});
$('#lgMail').addEventListener('submit',function(e){
  e.preventDefault();if(MAIL.busy)return;
  var up=MAIL.mode==='up',nome=$('#lgMailNome').value.trim().slice(0,40),mail=$('#lgMailEmail').value.trim().toLowerCase(),pass=$('#lgMailPass').value,er=$('#lgMailErr');
  er.textContent='';$('#lgMailOk').textContent='';
  if(up&&!nome){er.textContent='Escreva como você quer ser chamado.';$('#lgMailNome').focus();return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){er.textContent='Digite um e-mail válido, como nome@exemplo.com.';$('#lgMailEmail').focus();return}
  if(pass.length<6){er.textContent='A senha precisa ter pelo menos 6 caracteres.';$('#lgMailPass').focus();return}
  mailBusy(true,up?'Criando a conta…':'Entrando…');
  mailFb().then(function(fb){
    if(!up)return fb.auth.signInWithEmailAndPassword(mail,pass).then(function(){mailBusy(false);$('#lgMailPass').value='';if(!login.hidden)closeLogin()});
    return fb.auth.createUserWithEmailAndPassword(mail,pass).then(function(cred){
      var u=cred.user;
      return u.updateProfile({displayName:nome}).catch(function(){}).then(function(){
        ACC.name=nome;if(!PERFIL||PERFIL.google){PERFIL={name:nome.split(' ')[0].slice(0,24),pin:null,google:true};savePerfil()}
        accPaint();
        return u.sendEmailVerification().then(function(){return true},function(){return false});
      }).then(function(sent){
        mailBusy(false);$('#lgMailPass').value='';if(!login.hidden)closeLogin();
        gToast(sent?'Conta criada. Enviamos um link para '+mail+' confirmar o e-mail.':'Conta criada. Não deu para enviar o e-mail de confirmação agora; tente em Ajustes › Conta.');
      });
    });
  }).catch(function(err){mailBusy(false);er.textContent=fbMsg(err,'mail')||'Não deu para entrar com e-mail agora.'});
});
function mailReset(mail,out){
  return mailFb().then(function(fb){return fb.auth.sendPasswordResetEmail(mail)}).then(function(){out(true,'Se houver uma conta com '+mail+', enviamos um link para criar uma senha nova. Olhe também a caixa de spam.')},
    function(err){var c=err&&err.code||'';if(c==='auth/user-not-found')out(true,'Se houver uma conta com '+mail+', enviamos um link para criar uma senha nova. Olhe também a caixa de spam.');else out(false,fbMsg(err,'mail'))});
}
$('#lgMailForgot').addEventListener('click',function(){
  var mail=$('#lgMailEmail').value.trim().toLowerCase(),er=$('#lgMailErr'),ok=$('#lgMailOk');er.textContent='';ok.textContent='';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){er.textContent='Digite seu e-mail acima e toque de novo em "Esqueci a senha".';$('#lgMailEmail').focus();return}
  mailReset(mail,function(good,msg){if(good)ok.textContent=msg;else er.textContent=msg});
});
document.querySelectorAll('#login [data-mail]').forEach(function(b){b.hidden=!FB_ON});
document.addEventListener('click',function(e){
  if(e.target.closest('[data-mail]')){e.preventDefault();openMail('in');return}
  if(e.target.closest('#accVerify')){var u=ACC.fb&&ACC.fb.auth.currentUser;if(!u)return;
    u.sendEmailVerification().then(function(){gToast('Enviamos outro link para '+u.email+'.')},function(err){gToast(err&&err.code==='auth/too-many-requests'?'Já enviamos há pouco. Espere alguns minutos.':'Não deu para enviar agora.',1)});return}
  if(e.target.closest('#accVerified')){var v=ACC.fb&&ACC.fb.auth.currentUser;if(!v)return;
    v.reload().then(function(){var w=ACC.fb.auth.currentUser;ACC.verified=!!(w&&w.emailVerified);
      if(ACC.verified){w.getIdToken(true).catch(function(){}).then(function(){fbUserOn(w)});gToast('E-mail confirmado.')}else gToast('Ainda não aparece como confirmado. Abra o link do e-mail e tente de novo.',1);
      accPaint()},function(){gToast('Não deu para conferir agora.',1)});return}
  if(e.target.closest('#accReset')&&ACC.email){mailReset(ACC.email,function(good,msg){gToast(good?'Enviamos um link para '+ACC.email+' trocar a senha.':msg,!good)})}
});
document.addEventListener('click',function(e){
  if(e.target.closest('[data-goo]')){e.preventDefault();googleIn();return}
  if(e.target.closest('#accOut')){googleOut()}
});
setInterval(function(){if(ACC.kind&&ACC.state==='ok')accPaint()},60000);
/* ======================= fonte: família e tamanho ======================= */
var FONTS=[
  ['aparelho','Do aparelho','A fonte do seu celular ou computador. Carrega na hora.',null,null],
  ['inter','Inter','Neutra e moderna, muito usada em apps.','Inter:wght@400;500;600;700;800',"'Inter',system-ui,sans-serif"],
  ['atkinson','Atkinson Hyperlegible','Feita para quem tem baixa visão: letras bem diferentes entre si.','Atkinson+Hyperlegible:wght@400;700',"'Atkinson Hyperlegible',system-ui,sans-serif"],
  ['lexend','Lexend','Espaçada, pensada para leitura mais fluida.','Lexend:wght@400;500;600;700;800',"'Lexend',system-ui,sans-serif"],
  ['nunito','Nunito','Arredondada e amigável.','Nunito:wght@400;600;700;800',"'Nunito',system-ui,sans-serif"],
  ['plex','IBM Plex Sans','Técnica, com cara de engenharia.','IBM+Plex+Sans:wght@400;500;600;700',"'IBM Plex Sans',system-ui,sans-serif"],
  ['literata','Literata','Serifada, para quem prefere cara de livro.','Literata:wght@400;600;700;800',"'Literata',Georgia,serif"]
];
var FSIZES=[['p','Pequeno',.92],['m','Normal',1],['g','Grande',1.12],['gg','Muito grande',1.25]];
var fontOpen=false;
function fontDef(k){return FONTS.filter(function(f){return f[0]===k})[0]||FONTS[0]}
function loadFont(f){if(!f||!f[3])return;var id='gf-'+f[0];if(document.getElementById(id))return;var l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family='+f[3]+'&display=swap';document.head.appendChild(l)}
function applyFont(){
  var f=fontDef(CFG.font),r=document.documentElement;loadFont(f);
  if(f[4])r.style.setProperty('--f-body',f[4]);else r.style.removeProperty('--f-body');
  r.dataset.fs=FSIZES.some(function(s){return s[0]===CFG.fsize})?CFG.fsize:'m';
  if(typeof schedule==='function')setTimeout(function(){applyView(true)},60);
}
function fontFoldHTML(){
  var f=fontDef(CFG.font),sz=FSIZES.filter(function(s){return s[0]===CFG.fsize})[0]||FSIZES[1],fam=function(x){return x[4]?x[4]:"-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif"};
  return '<details class="cvdet" id="fontdet"'+(fontOpen?' open':'')+'><summary><span class="cvsum"><span class="fsw" style="font-family:'+fam(f)+'">Aa</span></span><span class="grow"><b>Fonte</b><small>'+esc(f[1])+' · texto '+sz[1].toLowerCase()+'</small></span><span class="chev" aria-hidden="true">▾</span></summary>'+
    '<div class="fontopts" role="radiogroup" aria-label="Fonte">'+FONTS.map(function(x){var on=x[0]===f[0];
      return '<button type="button" class="fontopt" role="radio" aria-checked="'+on+'" data-font="'+x[0]+'"><b style="font-family:'+fam(x)+'">'+esc(x[1])+'</b><span class="fprev" style="font-family:'+fam(x)+'">Próximo ônibus em 5 min · Bloco H, sala 210</span><small>'+esc(x[2])+'</small></button>'}).join('')+'</div>'+
    '<p class="small fslab"><b>Tamanho do texto</b></p><div class="chips fsizes" role="radiogroup" aria-label="Tamanho do texto">'+FSIZES.map(function(s){return '<button type="button" class="chip" role="radio" aria-checked="'+(s[0]===sz[0])+'" aria-pressed="'+(s[0]===sz[0])+'" data-fsize="'+s[0]+'"><span style="font-size:'+Math.round(14*s[2])+'px">A</span> '+s[1]+'</button>'}).join('')+'</div>'+
    '<p class="muted small keep">As fontes vêm do Google Fonts e baixam na primeira vez que você escolhe. O tamanho vale para os painéis; o mapa tem o zoom próprio.</p></details>';
}
aoFazer('ajustes montados',function(f){var L=$('#cfgL');if(L&&!L.querySelector('#fontdet')){L.insertAdjacentHTML('beforeend',fontFoldHTML());if(fontOpen)FONTS.forEach(loadFont);if(f&&/data-f(ont|size)/.test(f)){var el=L.querySelector(f);if(el)el.focus({preventScroll:true})}}});
document.addEventListener('toggle',function(e){if(e.target&&e.target.id==='fontdet'){fontOpen=e.target.open;if(fontOpen)FONTS.forEach(loadFont)}},true);
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-font],[data-fsize]');if(!t||!t.closest('#fontdet'))return;
  if(t.dataset.font){CFG.font=t.dataset.font;saveCfg();applyFont();renderCfg('[data-font="'+t.dataset.font+'"]')}
  else{CFG.fsize=t.dataset.fsize;saveCfg();applyFont();renderCfg('[data-fsize="'+t.dataset.fsize+'"]')}
});
applyFont();
/* ======================= localização do aparelho ======================= */
/* O mapa é uma imagem: a posição do GPS vira x,y por uma transformação de semelhança
   (escala, rotação, espelho e deslocamento) ajustada em pontos de referência.
   Calibração inicial: coordenadas aproximadas de CT, HU, Polo de Biotecnologia, Parque Tecnológico e CETEM (margem ~150 m).
   A gestão refina em "GPS e mapa" com coordenadas copiadas do Google Maps. */
/* v34: calibração refeita encaixando os traçados oficiais das linhas da prefeitura (GTFS/SMTR) nas ruas da planta: erro médio ~13 m (antes ~90 m) */
var GEO0={lat0:-22.855,lng0:-43.228,a:0.142691,b:0.216408,tx:768.63,ty:348.65,n:0,err:15};
var GEO=Object.assign({},GEO0);
var GPS_REF=['est','hu','eefd','res','pu','cenpes1','ccmn','ctl','reit','cetem','coppead','parque','graf'];
function ll2map(lat,lng,G){G=G||GEO;var kx=111320*Math.cos(G.lat0*Math.PI/180),e=(lng-G.lng0)*kx,n=(lat-G.lat0)*110574;return [G.a*e-G.b*n+G.tx,-G.b*e-G.a*n+G.ty]}
function mPerUnit(){return 1/Math.hypot(GEO.a,GEO.b)}
function parseLL(s){var m=String(s||'').match(/(-?\d{1,2}[.,]\d+)\s*[,;\s]\s*(-?\d{1,3}[.,]\d+)/);if(!m)return null;var la=+m[1].replace(',','.'),lo=+m[2].replace(',','.');if(la>0)la=-la;if(lo>0)lo=-lo;if(la<-23.1||la>-22.6||lo<-43.5||lo>-43.0)return null;return [la,lo]}
function solve4(M,v){/* eliminação de Gauss 4x4 */var n=4,A=M.map(function(r,i){return r.concat([v[i]])});
  for(var c=0;c<n;c++){var p=c;for(var r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;var t=A[c];A[c]=A[p];A[p]=t;if(Math.abs(A[c][c])<1e-12)return null;
    for(var r2=0;r2<n;r2++){if(r2===c)continue;var f=A[r2][c]/A[c][c];for(var k=c;k<=n;k++)A[r2][k]-=f*A[c][k]}}
  return A.map(function(r,i){return r[n]/r[i]})}
function fitGeoFrom(pts){
  var ids=Object.keys(pts||{}).filter(function(id){return STOPS[id]&&parseLL(pts[id])});
  if(ids.length<2)return null;
  var lat0=-22.855,lng0=-43.228,kx=111320*Math.cos(lat0*Math.PI/180),N=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],v=[0,0,0,0];
  function add(row,val){for(var i=0;i<4;i++){v[i]+=row[i]*val;for(var j=0;j<4;j++)N[i][j]+=row[i]*row[j]}}
  ids.forEach(function(id){var ll=parseLL(pts[id]),e=(ll[1]-lng0)*kx,n=(ll[0]-lat0)*110574,p=STOPS[id].p;add([e,-n,1,0],p[0]);add([-n,-e,0,1],p[1])});
  var s=solve4(N,v);if(!s)return null;
  var G={lat0:lat0,lng0:lng0,a:s[0],b:s[1],tx:s[2],ty:s[3],n:ids.length},mpu=1/Math.hypot(G.a,G.b),se=0;
  G.res={};ids.forEach(function(id){var ll=parseLL(pts[id]),q=ll2map(ll[0],ll[1],G),p=STOPS[id].p,d=Math.hypot(q[0]-p[0],q[1]-p[1])*mpu;G.res[id]=d;se+=d*d});
  G.err=Math.sqrt(se/ids.length);if(mpu<1||mpu>12)return null;return G;
}
function fitGeo(){var G=fitGeoFrom(GST.calib&&GST.calib.pts);GEO=G||Object.assign({},GEO0);if(LOC.ll){LOC.p=ll2map(LOC.ll[0],LOC.ll[1]);locUpdate(false)}}
var LOC={on:false,watch:null,p:null,ll:null,acc:0,ts:0,first:true,near:null,wifi:null,out:false};
function nearestOf(obj,p,skip){var best=null;Object.keys(obj).forEach(function(id){if(skip&&skip(obj[id],id))return;var q=obj[id].p;if(!q)return;var d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(!best||d<best.d)best={id:id,d:d}});if(best){best.m=best.d*mPerUnit();best.min=Math.max(1,Math.ceil(best.m*1.25/80))}return best}
function locUpdate(first){
  if(!LOC.p){if(CMP.on)cmpSchedule();return}
  var B=BASE,mg=60;LOC.out=LOC.p[0]<B.x-mg||LOC.p[0]>B.x+B.w+mg||LOC.p[1]<B.y-mg||LOC.p[1]>B.y+B.h+mg;
  LOC.near=LOC.out?null:nearestOf(STOPS,LOC.p,function(s){return s.off});
  LOC.wifi=LOC.out?null:nearestOf(WIFI,LOC.p);
  drawLoc();
  if(first){
    if(LOC.out)gToast('Você parece estar fora da Cidade Universitária.');
    else{ensureVisible(LOC.p);if(LOC.near&&LOC.near.id!==state.to&&state.from!==LOC.near.id){state.from=LOC.near.id;savePrefs();renderPlan();updateMap()}
      gToast('Ponto mais perto: '+(STOPS[LOC.near.id].short||STOPS[LOC.near.id].name)+' · '+LOC.near.min+' min a pé')}
  }
  if(!state.sel&&!detail.contains(document.activeElement))renderDetail();
  if(CMP.on)cmpSchedule();
}
function drawLoc(){
  var w=$('#world');if(!w)return;var g=$('#gLoc');
  if(!LOC.on||!LOC.p){if(g)g.remove();return}
  if(!g){g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='gLoc';g.setAttribute('pointer-events','none');w.appendChild(g)}
  var p=LOC.p,r=Math.max(4,Math.min(400,LOC.acc/mPerUnit()));
  g.innerHTML='<circle class="locacc" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+r.toFixed(1)+'"/><g class="locmk" transform="translate('+p[0].toFixed(1)+','+p[1].toFixed(1)+') scale('+MS.toFixed(3)+')"><circle class="locpulse" r="13"/><circle class="locdot" r="9"/></g>';
}
aoFazer('mapa montado',drawLoc);
aoFazer('vista aplicada',function(){var m=document.querySelector('#gLoc .locmk');if(m&&LOC.p)m.setAttribute('transform','translate('+LOC.p[0].toFixed(1)+','+LOC.p[1].toFixed(1)+') scale('+MS.toFixed(3)+')')});
function locErr(e){
  if(LOC.on&&LOC.p&&e&&e.code!==1){if(!LOC.warned){LOC.warned=1;gToast('O sinal do GPS oscilou. Mostrando a última posição conhecida.')}return}
  var inClaude=!!(window.claude&&typeof window.claude.use==='function');
  var m=e&&e.code===1?(inClaude?'O claude.ai não liberou a localização para esta página. No site do GitHub funciona.':'A localização foi bloqueada. Libere o acesso à localização para este site nas configurações do navegador.'):e&&e.code===3?'O GPS demorou para responder. Tente de novo perto de uma janela ou ao ar livre.':'Não deu para saber onde você está agora.';
  gToast(m,1);locStop();
}
function locStart(){
  if(!('geolocation' in navigator)){gToast('Este navegador não informa a localização.',1);return}
  LOC.on=true;LOC.first=true;var b=$('#zloc');if(b){b.setAttribute('aria-pressed','true');b.classList.add('busy')}
  LOC.watch=navigator.geolocation.watchPosition(function(pos){
    var c=pos.coords;LOC.ll=[c.latitude,c.longitude];LOC.acc=c.accuracy||50;LOC.ts=Date.now();LOC.p=ll2map(c.latitude,c.longitude);
    try{gpsFix(c,pos.timestamp||Date.now())}catch(e){}
    var bb=$('#zloc');if(bb)bb.classList.remove('busy');var f=LOC.first;LOC.first=false;locUpdate(f);
  },locErr,{enableHighAccuracy:true,maximumAge:3000,timeout:25000});
}
function locStop(){if(LOC.watch!=null&&navigator.geolocation)navigator.geolocation.clearWatch(LOC.watch);LOC.watch=null;LOC.on=false;LOC.p=null;LOC.near=null;var b=$('#zloc');if(b){b.setAttribute('aria-pressed','false');b.classList.remove('busy')}drawLoc();if(!state.sel)renderDetail();if(CMP.on)cmpSchedule()}
function locCardHTML(){
  if(!LOC.on)return '';
  if(!LOC.p)return '<div class="loccard"><p class="small"><span class="locping"></span> Procurando onde você está…</p></div>';
  var acc='Precisão do GPS: ± '+Math.round(LOC.acc)+' m'+(GEO.n>=3?'':' · mapa calibrado de forma aproximada');
  if(LOC.out)return '<div class="loccard"><p class="lc-t"><b>Você está fora da Cidade Universitária</b></p><p class="small">Para chegar, pegue o BRT Transcarioca até a Estação Fundão (UFRJ) e troque para as linhas internas. Veja também "Como chegar à Ilha do Fundão" no fim desta lista.</p><button type="button" class="copy" data-locstop>Parar de usar a localização</button></div>';
  var s=STOPS[LOC.near.id],w=LOC.wifi&&WIFI[LOC.wifi.id];
  return '<div class="loccard"><p class="eyebrow">Perto de você</p>'+
    '<div class="lc-row"><span class="lc-ic bus" aria-hidden="true"></span><span class="grow"><b>'+esc(s.name)+'</b><small>Ponto mais perto · '+LOC.near.min+' min a pé (≈ '+Math.round(LOC.near.m/10)*10+' m)</small></span></div>'+
    '<div class="later"><button type="button" class="copy" data-kind="stop" data-id="'+LOC.near.id+'">Próximos ônibus</button><button type="button" class="copy" data-locfrom="'+LOC.near.id+'"'+(state.from===LOC.near.id?' disabled':'')+'>'+(state.from===LOC.near.id?'Já é a sua origem':'Sair daqui')+'</button></div>'+
    (w?'<div class="lc-row"><span class="lc-ic wifi" aria-hidden="true"></span><span class="grow"><b>'+esc(w.name)+'</b><small>Wi-Fi aberto mais perto · '+LOC.wifi.min+' min a pé</small></span><button type="button" class="linkbtn" data-kind="wifi" data-id="'+LOC.wifi.id+'">Ver</button></div>':'')+
    '<p class="muted small keep">'+acc+'. Sua localização fica só no aparelho.</p></div>';
}
document.addEventListener('click',function(e){
  if(e.target.closest('#zloc')){if(LOC.on)locStop();else locStart();return}
  if(e.target.closest('[data-locstop]')){locStop();return}
  var f=e.target.closest('[data-locfrom]');if(f){var id=f.dataset.locfrom;if(state.to===id)state.to=id==='est'?'ctl':'est';state.from=id;savePrefs();renderPlan();updateMap();renderDetail();gToast('Origem do trajeto: '+(STOPS[id].short||STOPS[id].name))}
});
/* gestão › GPS e mapa */
function gGps(){
  var pts=(GST.calib&&GST.calib.pts)||{},G=fitGeoFrom(pts);
  var st=G?'Calibrado com '+G.n+' ponto'+(G.n>1?'s':'')+' · erro médio de ≈ '+Math.round(G.err)+' m'+(G.n<3?'. Use pelo menos 3 pontos espalhados.':''):'Calibração inicial aproximada (margem de uns 150 m). Cadastre pontos abaixo para deixar preciso.';
  return '<h3 class="gh">GPS e mapa</h3><p class="muted small">Para o "você está aqui" cair no lugar certo, informe as coordenadas reais de alguns pontos de ônibus. No Google Maps, clique com o botão direito exatamente em cima do ponto e clique nos números que aparecem no topo do menu: eles são copiados. Cole aqui. Três pontos bem espalhados já bastam; cinco deixam bem preciso. Se estiver no campus, use "Minha posição" parado no ponto.</p>'+
    '<p class="small gpsst"><b>'+st+'</b></p>'+
    '<form class="gcard open gform" data-gform="calib"><div class="gpslist">'+GPS_REF.filter(function(id){return STOPS[id]}).map(function(id){var r=G&&G.res&&G.res[id];
      return '<div class="gpsrow"><label class="gf" for="gG_'+id+'">'+esc(STOPS[id].name)+(r!=null?' <span class="pill '+(r<25?'good':r<60?'warn':'bad')+'">'+Math.round(r)+' m</span>':'')+'</label><div class="gpsin"><input type="text" id="gG_'+id+'" inputmode="decimal" placeholder="-22.85960, -43.23030" value="'+esc(pts[id]||'')+'"><button type="button" class="copy" data-ggps="'+id+'">Minha posição</button></div></div>'}).join('')+'</div>'+
    '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar calibração</button>'+(Object.keys(pts).length?'<button type="button" class="copy" data-gcalclr>Voltar à calibração inicial</button>':'')+'</div></form>';
}
GTABS.splice(GTABS.length-1,0,['gps','GPS e mapa']);
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-ggps],[data-gcalclr]');if(!t||!t.closest('#gestM'))return;
  if(t.dataset.ggps!=null){var id=t.dataset.ggps,inp=$('#gG_'+id);if(!navigator.geolocation){gToast('Este navegador não informa a localização.',1);return}
    t.disabled=true;t.textContent='Lendo…';navigator.geolocation.getCurrentPosition(function(p){inp.value=p.coords.latitude.toFixed(6)+', '+p.coords.longitude.toFixed(6);t.disabled=false;t.textContent='Minha posição';gToast('Precisão desta leitura: ± '+Math.round(p.coords.accuracy)+' m')},function(err){t.disabled=false;t.textContent='Minha posição';locErr(err)},{enableHighAccuracy:true,timeout:25000,maximumAge:0});return}
  if(t.dataset.gcalclr!=null)saveG('calib',{});
});
document.addEventListener('submit',function(e){
  var f=e.target.closest('form[data-gform="calib"]');if(!f)return;e.preventDefault();e.stopPropagation();
  var pts={},bad=[];GPS_REF.forEach(function(id){var el=$('#gG_'+id);if(!el)return;var v=el.value.trim();if(!v)return;var ll=parseLL(v);if(!ll)bad.push(STOPS[id].name);else pts[id]=ll[0].toFixed(6)+', '+ll[1].toFixed(6)});
  var er=$('#gErr');if(bad.length){er.textContent='Coordenada inválida em: '+bad.join(', ')+'. Use o formato -22.85960, -43.23030.';return}
  if(Object.keys(pts).length&&!fitGeoFrom(pts)){er.textContent='Com esses pontos a conta não fecha. Confira se cada coordenada é do ponto certo.';return}
  saveG('calib',{pts:pts});
},true);
aoFazer('dados da gestão aplicados',function(){fitGeo()});
fitGeo();
/* ---------- legenda: cores das linhas ---------- */
function lgShort(n){var m=/^Estação\s*×\s*(.+)$/.exec(n);return m?m[1]:n}
function drawLegendLines(){
  var el=$('#lgLines');if(!el)return;
  el.innerHTML=Object.keys(LINES).map(function(id){var l=LINES[id];
    return '<button type="button" class="lg-line'+(l.susp?' susp':'')+'" data-legline="'+id+'" title="Linha '+id+' · '+esc(l.name)+(l.susp?' (suspensa)':'')+'"><i style="background:var(--m'+id+')"></i><b>'+id+'</b><span>'+esc(lgShort(l.name))+(l.susp?' · suspensa':'')+'</span></button>'}).join('');
}
document.addEventListener('click',function(e){var b=e.target.closest('[data-legline]');if(!b)return;select('line',b.dataset.legline,true)});
aoFazer('tudo reconstruído',function(){drawLegendLines()});
drawLegendLines();
/* ======================= tema: aparelho, horário (nascer/pôr do sol), claro, escuro ======================= */
var TEMAS=[['sistema','Do aparelho','Segue o modo claro ou escuro do seu celular ou computador.'],['horario','Pelo horário','Claro de dia e escuro à noite, pelo nascer e pôr do sol na Ilha do Fundão.'],['claro','Sempre claro','Fica claro o tempo todo.'],['escuro','Sempre escuro','Fica escuro o tempo todo.']];
var temaOpen=false,temaAgora='';
/* nascer e pôr do sol (fórmula da NOAA), em minutos no fuso do aparelho */
function sunTimes(d){
  var lat=-22.86,lng=-43.23,rad=Math.PI/180,start=Date.UTC(d.getFullYear(),0,0),n=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-start)/864e5),g=2*Math.PI/365*(n-1);
  var eqt=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
  var decl=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
  var ha=Math.acos(Math.cos(90.833*rad)/(Math.cos(lat*rad)*Math.cos(decl))-Math.tan(lat*rad)*Math.tan(decl))/rad,off=-d.getTimezoneOffset();
  return {rise:Math.round(720-4*(lng+ha)-eqt+off),set:Math.round(720-4*(lng-ha)-eqt+off)};
}
function temaEscuroAgora(){var s=sunTimes(new Date()),t=nowMin();return t<s.rise||t>=s.set}
function applyTheme(){
  var r=document.documentElement,t=CFG.tema||'sistema',v=null;
  if(t==='claro')v='light';else if(t==='escuro')v='dark';else if(t==='horario')v=temaEscuroAgora()?'dark':'light';
  var cur=r.getAttribute('data-theme');
  if(v){if(cur!==v)r.setAttribute('data-theme',v)}else if(cur)r.removeAttribute('data-theme');
  var mt=document.querySelector('meta[name="theme-color"]');if(!mt){mt=document.createElement('meta');mt.name='theme-color';document.head.appendChild(mt)}
  var dark=v?v==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;mt.content=dark?'#0B1117':'#E9EDF1';
  if(typeof mapThemeSync==='function')mapThemeSync(!dark);
  var now=t+':'+(v||'');if(now!==temaAgora){temaAgora=now;var c=$('#temadet');if(c&&!cfgM.hidden){var sm=c.querySelector('.tema-sum');if(sm)sm.textContent=temaResumo()}}
}
function temaResumo(){
  var t=CFG.tema||'sistema',d=TEMAS.filter(function(x){return x[0]===t})[0]||TEMAS[0];
  if(t!=='horario')return d[1];
  var s=sunTimes(new Date()),esc=temaEscuroAgora();
  return 'Pelo horário · agora '+(esc?'escuro, clareia às '+hm(s.rise):'claro, escurece às '+hm(s.set));
}
function temaFoldHTML(){
  var t=CFG.tema||'sistema',s=sunTimes(new Date()),dark=document.documentElement.getAttribute('data-theme')==='dark'||(!document.documentElement.getAttribute('data-theme')&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  return '<details class="cvdet" id="temadet"'+(temaOpen?' open':'')+'><summary><span class="cvsum"><span class="tsw'+(dark?' dk':'')+'" aria-hidden="true"><i></i></span></span><span class="grow"><b>Tema</b><small class="tema-sum">'+esc(temaResumo())+'</small></span><span class="chev" aria-hidden="true">▾</span></summary>'+
    '<div class="temaopts" role="radiogroup" aria-label="Tema">'+TEMAS.map(function(x){var on=x[0]===t;
      return '<button type="button" class="temaopt" role="radio" aria-checked="'+on+'" data-tema="'+x[0]+'"><span class="tic t-'+x[0]+'" aria-hidden="true"></span><span class="grow"><b>'+x[1]+'</b><small>'+x[2]+(x[0]==='horario'?' Hoje: claro das '+hm(s.rise)+' às '+hm(s.set)+'.':'')+'</small></span></button>'}).join('')+'</div>'+
    '<p class="muted small keep">O mapa fica sempre escuro, nos dois temas. No modo Pelo horário, mudar o Simular horário aqui em Ajustes também muda o tema, para você testar.</p></details>';
}
aoFazer('ajustes montados',function(f){var L=$('#cfgL'),bg=L&&L.querySelector('#bgdet');if(L&&!L.querySelector('#temadet')){if(bg)bg.insertAdjacentHTML('beforebegin',temaFoldHTML());else L.insertAdjacentHTML('beforeend',temaFoldHTML());if(f&&/data-tema/.test(f)){var el=L.querySelector(f);if(el)el.focus({preventScroll:true})}}});
document.addEventListener('toggle',function(e){if(e.target&&e.target.id==='temadet')temaOpen=e.target.open},true);
document.addEventListener('click',function(e){var b=e.target.closest('[data-tema]');if(!b||!b.closest('#temadet'))return;CFG.tema=b.dataset.tema;saveCfg();applyTheme();renderCfg('[data-tema="'+CFG.tema+'"]')});
document.addEventListener('input',function(e){if(e.target&&e.target.id==='clk')setTimeout(applyTheme,0)});
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#nowBtn'))setTimeout(applyTheme,0)});
try{window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme)}catch(e){}
setInterval(applyTheme,30000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)applyTheme()});
applyTheme();
/* ======================= administradores e privilégios ======================= */
var GPERMS=[['linhas','Linhas','suspender, avisos e horários'],['pontos','Pontos','nome, posição e desativar'],['wifi','Redes Wi-Fi','cadastrar e remover'],['servicos','Serviços e horários','RU, bibliotecas e secretarias'],['solicitacoes','Solicitações','responder os pedidos dos alunos'],['plantas','Plantas dos prédios','enviar e remover'],['avisos','Avisos e filas','moderar o que os alunos enviam'],['usuarios','Usuários','ver a lista e bloquear'],['gps','GPS e mapa','calibrar a localização'],['calendario','Calendário','publicar mudanças de data'],['admins','Administradores','adicionar outros e mudar privilégios']];
var TAB_PERM={usuarios:'usuarios',linhas:'linhas',pontos:'pontos',wifi:'wifi',servicos:'servicos',solic:'solicitacoes',plantas:'plantas',avisos:'avisos',gps:'gps',admins:'admins'};
var ME={owner:false,principal:false,perms:null},FB_ADMINS=null,admEdit=null;
function gcan(p){return ME.principal||!ME.perms||!!ME.perms[p]}
function computePerms(){
  if(GESTOR==='demo'){ME.principal=true;ME.perms=null}
  else if(!FBMODE){var l=(GST.admins&&GST.admins.list)||{},me=SH.uid&&l[SH.uid];
    if(ME.owner){ME.principal=true;ME.perms=null}else{ME.principal=false;ME.perms=me?(me.perms||{}):null}}
  MUD_OWNER=GESTOR===true&&gcan('calendario');
  if(typeof cPane!=='undefined'&&cPane&&!cPane.hidden)renderCal();
}
function permSummary(perms,principal){
  if(principal)return 'Acesso total';
  var on=GPERMS.filter(function(g){return perms&&perms[g[0]]});
  if(!on.length)return 'Só a visão geral';
  if(on.length===GPERMS.length)return 'Todas as áreas';
  return on.map(function(g){return g[1]}).join(' · ');
}
function permBoxes(prefix,perms){
  return '<div class="permgrid" role="group" aria-label="Privilégios">'+GPERMS.map(function(g){var id=prefix+g[0];
    return '<label class="permopt" for="'+id+'"><input type="checkbox" id="'+id+'" data-perm="'+g[0]+'"'+(perms&&perms[g[0]]?' checked':'')+'><span><b>'+g[1]+'</b><small>'+g[2]+'</small></span></label>'}).join('')+'</div>';
}
function readPerms(form){var o={};form.querySelectorAll('input[data-perm]').forEach(function(i){o[i.dataset.perm]=i.checked});return o}
function admList(){
  if(FBMODE){if(FB_ADMINS===null){FB_ADMINS=[];loadFbAdmins()}
    return FB_ADMINS.map(function(a){return {key:a.id,nome:a.nome||'',sub:a.id,perms:a.perms||null,principal:a.principal}})}
  var l=(GST.admins&&GST.admins.list)||{};
  var out=Object.keys(l).map(function(k){var x=l[k]||{};return {key:k,nome:x.nome||(GESTOR===true?who(k):k),sub:GESTOR===true?'':k,perms:x.perms||{},principal:false}});
  if(GESTOR===true)out.unshift({key:'__dono',nome:'Dono da página',sub:'quem criou o app no claude.ai',perms:null,principal:true,fixed:true});
  return out;
}
function loadFbAdmins(){
  SH.db.collection('gestores').get().then(function(s){FB_ADMINS=s.docs.map(function(d){var x=d.data()||{};return {id:d.id,nome:x.nome||'',perms:x.perms||null,principal:x.super===true||!('perms' in x)}});if(gestM&&!gestM.hidden&&gTab==='admins')renderGest()},
    function(){FB_ADMINS=[];gToast('Não deu para ler a lista de administradores. Confira as regras do Firestore.',1)});
}
function gAdmins(){
  var L=admList(),canEditAdm=gcan('admins');
  if(GESTOR===true&&!FBMODE)names(L.filter(function(a){return !a.fixed}).map(function(a){return a.key}));
  var note=FBMODE?'Cada administrador entra no app com o e-mail cadastrado aqui, pela conta Google ou com e-mail e senha (nesse caso, depois de confirmar o e-mail). As permissões valem também no servidor (regras do Firestore). O administrador principal, criado no console do Firebase, não pode ser alterado por aqui.'
    :GESTOR===true?'No claude.ai, só quem tem acesso de editor consegue salvar (menu Compartilhar › Editor). Aqui você define o que cada editor vê e pode mudar na gestão. Editores que não estão na lista têm acesso total.'
    :'Modo demonstração: a lista fica só neste aparelho.';
  var rows=L.map(function(a){var open=admEdit===a.key;
    return '<div class="gcard'+(open?' open':'')+'"><div class="grow2"><span class="adm-av" aria-hidden="true">'+esc((a.nome||a.key).charAt(0).toUpperCase())+'</span><span class="grow"><b>'+esc(a.nome||a.key)+'</b>'+(a.sub?'<small>'+esc(a.sub)+'</small>':'')+'<small>'+esc(permSummary(a.perms,a.principal))+'</small></span>'+
      (a.principal?'<span class="pill good">Principal</span>':(canEditAdm?'<button type="button" class="copy" data-admedit="'+esc(a.key)+'">'+(open?'Fechar':'Privilégios')+'</button>':''))+'</div>'+
      (open&&!a.principal?'<form class="gform" data-gform="admin" data-key="'+esc(a.key)+'">'+permBoxes('ap_',a.perms)+'<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar privilégios</button><button type="button" class="copy danger" data-admdel="'+esc(a.key)+'">Remover administrador</button></div></form>':'')+'</div>'}).join('');
  var add='';
  if(canEditAdm){
    var pick;
    if(GESTOR===true&&!FBMODE){var listed=(GST.admins&&GST.admins.list)||{};var cands=SH.members.filter(function(m){return m.id!==SH.uid&&!listed[m.id]});names(cands.map(function(m){return m.id}));
      pick=cands.length?'<label class="gf">Pessoa<select id="admWho">'+cands.map(function(m){return '<option value="'+esc(m.id)+'">'+esc(who(m.id))+'</option>'}).join('')+'</select></label><p class="muted small">Aparecem aqui as pessoas que já abriram o app.</p>':'<p class="muted small">Ninguém novo abriu o app ainda. Compartilhe a página como Editor e peça para a pessoa abrir uma vez.</p>';
    }else pick=admBuscaHTML()+'<div class="g2"><label class="gf">E-mail<input type="text" id="admMail" inputmode="email" autocomplete="off" placeholder="nome@gmail.com"></label><label class="gf">Nome<input type="text" id="admNome" maxlength="60" placeholder="Como aparece na lista"></label></div>';
    add='<form class="gcard open gform" data-gform="adminadd"><h4 class="gh4">Adicionar administrador</h4>'+pick+'<p class="small"><b>O que essa pessoa pode fazer</b></p>'+permBoxes('an_',{linhas:true,pontos:true,wifi:true,servicos:true,solicitacoes:true,plantas:true,avisos:true,gps:true,calendario:true})+
      '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Adicionar</button></div></form>';
  }
  return '<h3 class="gh">Administradores</h3><p class="muted small">'+note+'</p><div class="glist">'+(rows||'<p class="muted small">Nenhum administrador além de você.</p>')+'</div>'+(canEditAdm?add:'<p class="muted small">Você não tem permissão para mudar administradores.</p>');
}
/* busca entre quem já se cadastrou no app (precisa do privilégio Usuários para ler a lista) */
function admCands(q){
  var adm={};(FBMODE?(FB_ADMINS||[]).map(function(a){return a.id}):Object.keys((GST.admins&&GST.admins.list)||{})).forEach(function(k){adm[String(k).toLowerCase()]=1});
  q=fold(String(q||'').trim());
  return (SH.members||[]).filter(function(m){return m.id!==SH.uid&&!(m.email&&adm[m.email])&&(!q||fold(m.nome+' '+m.email).indexOf(q)>=0)})
    .sort(function(a,b){return (b.last||0)-(a.last||0)}).slice(0,8);
}
function admResHTML(q){
  if(!(SH.members||[]).length)return '<p class="muted small">'+(gcan('usuarios')?'Ninguém se cadastrou ainda.':'Para buscar na lista de usuários você precisa também do privilégio Usuários. Sem ele, digite o e-mail abaixo.')+'</p>';
  var l=admCands(q);if(!l.length)return '<p class="muted small">Ninguém encontrado com esse nome ou e-mail.</p>';
  return l.map(function(m){var ok=!!m.email;
    return '<button type="button" class="admpick" data-admpick="'+esc(m.email)+'" data-nome="'+esc(m.nome)+'"'+(ok?'':' disabled')+'><span class="adm-av" aria-hidden="true">'+esc((m.nome||m.email||'?').charAt(0).toUpperCase())+'</span><span class="grow"><b>'+esc(m.nome||'Sem nome')+'</b><small>'+(ok?esc(m.email):'E-mail aparece quando a pessoa abrir o app de novo')+'</small></span></button>'}).join('');
}
function admBuscaHTML(){
  return '<label class="gf">Buscar entre os usuários cadastrados<input type="search" id="admBusca" autocomplete="off" placeholder="Nome ou e-mail"></label><div class="admres" id="admRes">'+admResHTML('')+'</div><p class="muted small">Toque numa pessoa para preencher o e-mail e o nome. Se ela não estiver na lista, digite o e-mail.</p>';
}
function fold(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
document.addEventListener('input',function(e){if(!e.target||e.target.id!=='admBusca')return;var r=$('#admRes');if(r)r.innerHTML=admResHTML(e.target.value)});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-admpick]');if(!b||b.disabled)return;
  var m=$('#admMail'),n=$('#admNome');if(m)m.value=b.dataset.admpick;if(n)n.value=b.dataset.nome||'';
  document.querySelectorAll('.admpick.on').forEach(function(x){x.classList.remove('on')});b.classList.add('on');if(m)m.focus()});
GTABS.splice(GTABS.length,0,['admins','Administradores']);
function saveAdminLocal(list){return saveG('admins',{list:list})}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-admedit],[data-admdel]');if(!t||!t.closest('#gestM'))return;
  if(t.dataset.admedit){admEdit=admEdit===t.dataset.admedit?null:t.dataset.admedit;renderGest();return}
  var key=t.dataset.admdel;
  if(FBMODE){SH.db.doc('gestores/'+key).delete().then(function(){gToast('Administrador removido.');admEdit=null;FB_ADMINS=null;renderGest()},function(){gToast('Não deu para remover. Você precisa do privilégio Administradores.',1)})}
  else{var l=Object.assign({},(GST.admins&&GST.admins.list)||{});delete l[key];admEdit=null;saveAdminLocal(l)}
});
document.addEventListener('submit',function(e){
  var f=e.target.closest('form[data-gform="admin"],form[data-gform="adminadd"]');if(!f)return;e.preventDefault();e.stopPropagation();
  var err=f.querySelector('#gErr'),perms=readPerms(f);
  if(f.dataset.gform==='admin'){var key=f.dataset.key;
    if(FBMODE){var cur=(FB_ADMINS||[]).filter(function(a){return a.id===key})[0]||{};
      SH.db.doc('gestores/'+key).set({nome:cur.nome||'',perms:perms,por:ACC.email||'',ts:Date.now()}).then(function(){gToast('Privilégios salvos.');admEdit=null;FB_ADMINS=null;renderGest()},function(){err.textContent='Não deu para salvar. Confira as regras do Firestore.'})}
    else{var l=Object.assign({},(GST.admins&&GST.admins.list)||{});l[key]=Object.assign({},l[key]||{},{perms:perms});admEdit=null;saveAdminLocal(l)}
    return}
  if(FBMODE||GESTOR==='demo'){
    var mail=String((f.querySelector('#admMail')||{}).value||'').trim().toLowerCase(),nome=cleanTxt((f.querySelector('#admNome')||{}).value,60);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){err.textContent='Digite um e-mail válido.';return}
    if(FBMODE){if((FB_ADMINS||[]).some(function(a){return a.id===mail})){err.textContent='Esse e-mail já é administrador.';return}
      SH.db.doc('gestores/'+mail).set({nome:nome,perms:perms,por:ACC.email||'',ts:Date.now()}).then(function(){gToast('Administrador adicionado. Ele entra com esse e-mail, pelo Google ou com e-mail e senha.');FB_ADMINS=null;renderGest()},function(){err.textContent='Não deu para adicionar. Você precisa do privilégio Administradores e das regras novas do Firestore.'})}
    else{var l2=Object.assign({},(GST.admins&&GST.admins.list)||{});l2[mail]={nome:nome,perms:perms};saveAdminLocal(l2)}
    return}
  var sel=f.querySelector('#admWho');if(!sel){err.textContent='Escolha uma pessoa.';return}
  var l3=Object.assign({},(GST.admins&&GST.admins.list)||{});l3[sel.value]={perms:perms};saveAdminLocal(l3);
},true);
/* aplica os privilégios na tela da gestão */
aoFazer('gestor definido',function(v){computePerms()});
aoFazer('dados da gestão aplicados',function(){if(GESTOR)computePerms()});
/* ======================= Seu trajeto: buscar o ponto ======================= */
function place2stop(k){var it=PL[k];if(!it)return null;if(it.bld&&BLD[it.bld]&&BLD[it.bld].stop&&STOPS[BLD[it.bld].stop])return BLD[it.bld].stop;
  if(it.p){var n=nearestOf(STOPS,it.p,function(s){return s.off});return n&&n.id}return null}
function stopIndex(){
  var E=[];
  Object.keys(STOPS).forEach(function(id){var s=STOPS[id];E.push({id:id,t:s.name,sub:'Linhas '+linesAt(id).join(', ')+(s.off?' · ponto desativado':''),k:glFold(s.name+' '+(s.short||'')),stop:1})});
  Object.keys(BLD).forEach(function(b){var B=BLD[b];if(STOPS[B.stop])E.push({id:B.stop,t:B.name,sub:'Prédio · ponto '+(STOPS[B.stop].short||STOPS[B.stop].name),k:glFold(B.name+' '+B.short)})});
  Object.keys(PL).forEach(function(k){var it=PL[k];if(it.cat==='aula'||it.line)return;var sid=place2stop(k);if(!sid)return;
    E.push({id:sid,t:it.name,sub:'Ponto mais perto: '+(STOPS[sid].short||STOPS[sid].name),k:glFold(it.name+' '+(it.s||'')+' '+it.where)})});
  if(typeof GLOSS!=='undefined')GLOSS.forEach(function(g){if(g[4]&&g[4].slice(0,2)==='s:'&&STOPS[g[4].slice(2)])E.push({id:g[4].slice(2),t:g[0]+' · '+g[1],sub:'Ponto '+(STOPS[g[4].slice(2)].short||STOPS[g[4].slice(2)].name),k:glFold(g[0]+' '+g[1])})});
  return E;
}
function stopSearch(q){
  q=glFold(q.trim());var E=stopIndex(),seen={},out=[];
  if(!q){if(typeof LOC!=='undefined'&&LOC.near&&STOPS[LOC.near.id])out.push({id:LOC.near.id,t:STOPS[LOC.near.id].name,sub:'Perto de você · '+LOC.near.min+' min a pé',near:1});
    SORTED.forEach(function(id){out.push({id:id,t:STOPS[id].name,sub:'Linhas '+linesAt(id).join(', ')})});return out}
  var words=q.split(/\s+/);
  E.forEach(function(e){var ok=words.every(function(w){return e.k.indexOf(w)>=0});if(!ok)return;
    var sc=(e.k.indexOf(q)===0?0:e.k.indexOf(' '+q)>=0?1:2)+(e.stop?0:0.5);var key=e.id+'|'+e.t;if(seen[key])return;seen[key]=1;out.push(Object.assign({sc:sc},e))});
  out.sort(function(a,b){return a.sc-b.sc||a.t.localeCompare(b.t,'pt')});
  return out.slice(0,14);
}
function hl(t,q){q=q.trim();if(!q)return esc(t);var f=glFold(t),i=f.indexOf(glFold(q));if(i<0)return esc(t);return esc(t.slice(0,i))+'<mark>'+esc(t.slice(i,i+q.length))+'</mark>'+esc(t.slice(i+q.length))}
var SCB={quiet:false};
function enhanceStopSelect(sel){
  if(!sel||sel.dataset.scb)return;sel.dataset.scb='1';
  var which=sel.id,lid='scb-'+which,wrap=document.createElement('div');wrap.className='scb';
  wrap.innerHTML='<input type="text" class="scb-in" id="'+which+'Q" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="'+lid+'" autocomplete="off" spellcheck="false" placeholder="Busque ponto, prédio ou sigla"><span class="scb-ic" aria-hidden="true"></span><ul class="scb-list" id="'+lid+'" role="listbox" hidden></ul>';
  sel.parentNode.insertBefore(wrap,sel);sel.classList.add('scb-sel');sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');
  var inp=wrap.querySelector('input'),ul=wrap.querySelector('ul'),items=[],act=-1;
  function label(){var s=STOPS[sel.value];return s?s.name:''}
  inp.value=label();
  function draw(){
    var q=inp.value===label()?'':inp.value;items=stopSearch(q);act=items.length?0:-1;
    ul.innerHTML=items.length?items.map(function(it,i){return '<li role="option" id="'+lid+'-'+i+'" data-i="'+i+'" aria-selected="'+(i===act)+'"'+(it.id===sel.value?' class="cur"':'')+'><b>'+(it.near?'<span class="scb-near" aria-hidden="true"></span>':'')+hl(it.t,q)+'</b><small>'+esc(it.sub)+'</small></li>'}).join(''):'<li class="scb-none" role="option" aria-disabled="true">Nenhum ponto encontrado. Tente o nome do prédio ou uma sigla.</li>';
    ul.hidden=false;inp.setAttribute('aria-expanded','true');setAct(act);
  }
  function setAct(i){act=i;ul.querySelectorAll('li[data-i]').forEach(function(li){var on=+li.dataset.i===i;li.setAttribute('aria-selected',on);if(on)li.scrollIntoView({block:'nearest'})});inp.setAttribute('aria-activedescendant',i>=0?lid+'-'+i:'')}
  function close(restore){ul.hidden=true;inp.setAttribute('aria-expanded','false');inp.removeAttribute('aria-activedescendant');if(restore)inp.value=label()}
  function choose(i){var it=items[i];if(!it)return;close(false);inp.value=STOPS[it.id].name;if(sel.value!==it.id){sel.value=it.id;SCB.quiet=true;sel.dispatchEvent(new Event('change',{bubbles:true}))}}
  inp.addEventListener('focus',function(){if(SCB.quiet){SCB.quiet=false;return}inp.select();draw()});
  inp.addEventListener('click',function(){if(ul.hidden)draw()});
  inp.addEventListener('input',draw);
  inp.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();if(ul.hidden)draw();else setAct(Math.min(items.length-1,act+1))}
    else if(e.key==='ArrowUp'){e.preventDefault();setAct(Math.max(0,act-1))}
    else if(e.key==='Enter'){if(!ul.hidden&&act>=0){e.preventDefault();choose(act)}}
    else if(e.key==='Escape'){if(!ul.hidden){e.preventDefault();e.stopPropagation();close(true)}}
    else if(e.key==='Tab')close(true);
  });
  inp.addEventListener('blur',function(){setTimeout(function(){if(document.activeElement!==inp)close(true)},120)});
  ul.addEventListener('mousedown',function(e){e.preventDefault()});
  ul.addEventListener('click',function(e){var li=e.target.closest('li[data-i]');if(li)choose(+li.dataset.i)});
}
renderPlan();
/* ======================= rosa dos ventos: bússola que aponta para o destino ======================= */
var CMP={on:false,h:null,hRaw:null,lastTxt:'',got:false,raf:0,timer:0};
function angN(){return Math.atan2(-GEO.b,GEO.a)*180/Math.PI}/* norte real no mapa, em graus a partir do topo */
function norm180(a){a=((a+180)%360+360)%360-180;return a}
function cardinal(b){var n=['norte','nordeste','leste','sudeste','sul','sudoeste','oeste','noroeste'];return n[Math.round(((b%360)+360)%360/45)%8]}
function cmpGeom(){
  var ori=CFG.bussolaAlvo==='origem',alvo=STOPS[ori?state.from:state.to];if(!alvo)return null;
  var hasLoc=typeof LOC!=='undefined'&&LOC.on&&LOC.p&&!LOC.out;
  var S=hasLoc?LOC.p:(STOPS[ori?state.to:state.from]&&STOPS[ori?state.to:state.from].p);
  if(!S)return null;
  var vx=alvo.p[0]-S[0],vy=alvo.p[1]-S[1],m=Math.hypot(vx,vy)*mPerUnit();
  var angV=Math.atan2(vx,-vy)*180/Math.PI,bear=((angV-angN())%360+360)%360;
  return {to:alvo,fromLoc:hasLoc,m:m,angV:angV,bear:bear,origem:ori};
}
function distTxt(m){return m<1000?(Math.round(m/10)*10)+' m':(m/1000).toFixed(1).replace('.',',')+' km'}
function drawRose(){
  var rb=$('#rosebox');if(!rb)return;
  if(!CMP.on){rb.innerHTML='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,NORTH+ROT)+'</svg>';var rc=$('#rosecard');if(rc)rc.hidden=true;return}
  var g=cmpGeom(),hasH=CMP.h!=null,roseDeg=hasH?-CMP.h:angN(),needle=null,txt='',sub='';
  if(!g){txt='Escolha o destino em Seu trajeto';}
  else if(g.m<25){txt='Você chegou: '+(g.to.short||g.to.name);needle=null}
  else{
    needle=hasH?g.bear-CMP.h:g.angV;
    var rel=norm180(g.bear-(hasH?CMP.h:0));
    var dir=hasH?(Math.abs(rel)<=25?'à sua frente':Math.abs(rel)>=155?'atrás de você':rel>0?(rel<70?'à frente, à direita':'à sua direita'):(rel>-70?'à frente, à esquerda':'à sua esquerda')):'a '+cardinal(g.bear);
    txt=(g.to.short||g.to.name);sub=distTxt(g.m)+' · '+dir+(g.fromLoc?'':' (a partir do ponto de origem)');
  }
  var s='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,roseDeg);
  if(needle!=null)s+='<g class="cmp-needle" transform="rotate('+needle.toFixed(1)+')"><path d="M0,-60 L11,-38 L0,-44 L-11,-38Z"/><line x1="0" y1="-14" x2="0" y2="-40"/></g>';
  rb.innerHTML=s+'</svg>';
  var rc=$('#rosecard');if(rc){rc.hidden=false;var full=txt+(sub?' · '+sub:'');
    rc.innerHTML='<b>'+esc(txt)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+(hasH?(CMP.acc!=null&&(CMP.acc<0||CMP.acc>25)?'<small class="cmp-cal">Bússola imprecisa: mova o celular desenhando um 8 no ar.</small>':''):'<small class="cmp-hint">'+(CMP.got?'':'Sem bússola neste aparelho: a seta segue o mapa.')+'</small>');
    if(full!==CMP.lastTxt){CMP.lastTxt=full}}
  /* GPS: precisão e como a bússola está se ajustando */
  drawRoseGps();
}
function drawRoseGps(){
  var rc=$('#rosecard');if(!CMP.on||!rc||rc.hidden)return;
  var g=cmpGeom(),bits=[];
  if(g&&g.fromLoc){bits.push('GPS ± '+Math.round(LOC.acc)+' m');if(LOC.acc>40&&g.m>25)bits.push('posição imprecisa: vá para um lugar aberto')}
  else if(typeof LOC!=='undefined'&&LOC.on&&!LOC.p)bits.push('procurando o GPS…');
  if(CMP.gpsH&&!CMP.got)bits.push('direção pelo seu movimento');
  else if(CMP.offN>=5&&CMP.h!=null)bits.push('bússola ajustada pelo GPS');
  else if(CMP.got&&LOC.on)bits.push('ande uns passos olhando para a tela para ajustar');
  if(bits.length)rc.insertAdjacentHTML('beforeend','<small class="cmp-gps">'+esc(bits.join(' · '))+'</small>');
  if(g&&g.fromLoc&&g.m>25&&g.m<=LOC.acc){var b=rc.querySelector('b');if(b)b.textContent=(g.to.short||g.to.name)+': você está bem perto'}
}
function cmpSchedule(){if(CMP.raf)return;CMP.raf=requestAnimationFrame(function(){CMP.raf=0;drawRose()})}
/* v24: bússola corrigida.
   1) o sensor dá o norte MAGNÉTICO; no Fundão ele fica ~23,5° a oeste do norte verdadeiro (declinação, modelo WMM).
   2) no Android o "alpha" só vale com o celular deitado; com o celular em pé ou inclinado, calculamos a direção
      para onde a pessoa está olhando (parte de cima da tela + traseira do aparelho), já levando em conta a rotação da tela. */
var DECL=-23.5;
function scrAng(){return (screen.orientation&&typeof screen.orientation.angle==='number')?screen.orientation.angle:(+window.orientation||0)}
function headingFromEuler(al,be,ga,so){
  var r=Math.PI/180,ca=Math.cos(al*r),sa=Math.sin(al*r),cb=Math.cos(be*r),sb=Math.sin(be*r),cg=Math.cos(ga*r),sg=Math.sin(ga*r);
  var yE=-sa*cb,yN=ca*cb,xE=ca*cg-sa*sg*sb,xN=sa*cg+ca*sg*sb,zE=ca*sg+sa*sb*cg,zN=sa*sg-ca*sb*cg;
  var t=so*r,uE=Math.cos(t)*yE+Math.sin(t)*xE,uN=Math.cos(t)*yN+Math.sin(t)*xN;/* "para cima" na tela */
  var fE=uE-zE,fN=uN-zN;/* + traseira do aparelho (para onde a câmera aponta) */
  if(Math.hypot(fE,fN)<1e-3)return null;
  return (Math.atan2(fE,fN)*180/Math.PI+360)%360;
}
function onOri(e){
  var h=null,so=scrAng();
  if(typeof e.webkitCompassHeading==='number'&&!isNaN(e.webkitCompassHeading)&&e.webkitCompassHeading>=0){
    h=e.webkitCompassHeading+so;CMP.acc=typeof e.webkitCompassAccuracy==='number'?e.webkitCompassAccuracy:null;CMP.src='ios';
  }else if(e.absolute===true&&typeof e.alpha==='number'){
    if(typeof e.beta==='number'&&typeof e.gamma==='number')h=headingFromEuler(e.alpha,e.beta,e.gamma,so);
    if(h==null)h=360-e.alpha+so;
    CMP.src='abs';
  }
  if(h==null||(CMP.src==='ios'&&e.type==='deviceorientationabsolute'))return;
  h=((h+DECL)%360+360)%360;CMP.hRaw=h;CMP.tRaw=Date.now();
  if(CMP.offN>=5)h=((h+CMP.off)%360+360)%360;/* v25: ajuste fino aprendido com o GPS */
  if(CMP.h==null)CMP.h=h;else{var d=norm180(h-CMP.h);CMP.h=((CMP.h+d*0.25)%360+360)%360}/* suaviza a agulha */
  CMP.got=true;cmpSchedule();
}
function cmpListen(){window.addEventListener('deviceorientationabsolute',onOri,true);window.addEventListener('deviceorientation',onOri,true)}
function cmpStart(){
  CMP.on=true;CMP.h=null;CMP.got=false;var rb=$('#rosebox');rb.setAttribute('aria-pressed','true');rb.classList.add('on');
  var DOE=window.DeviceOrientationEvent;
  if(DOE)cmpListen();
  if(DOE&&typeof DOE.requestPermission==='function'){DOE.requestPermission().then(function(st){if(st!=='granted'&&!CMP.got)gToast('Sem permissão de orientação: a seta segue o mapa.')}).catch(function(){})}
  if(typeof LOC!=='undefined'&&!LOC.on&&'geolocation' in navigator)locStart();
  var g=cmpGeom();gToast(g?'A seta laranja aponta para '+(g.to.short||g.to.name)+'.':'Escolha o destino em Seu trajeto.');
  drawRose();
}
function cmpStop(){CMP.on=false;window.removeEventListener('deviceorientationabsolute',onOri,true);window.removeEventListener('deviceorientation',onOri,true);var rb=$('#rosebox');rb.setAttribute('aria-pressed','false');rb.classList.remove('on');drawRose()}
(function(){var rb=$('#rosebox');if(!rb)return;rb.removeAttribute('aria-hidden');rb.setAttribute('role','button');rb.tabIndex=0;rb.setAttribute('aria-pressed','false');rb.setAttribute('aria-label','Bússola: apontar para o ponto de destino');rb.title='Apontar para o destino';
  rb.insertAdjacentHTML('afterend','<div class="rosecard glass" id="rosecard" role="status" aria-live="polite" hidden></div>');
  rb.addEventListener('click',function(){if(CMP.on){cmpStop();CFG.bussola=false}else{cmpStart();CFG.bussola=true}saveCfg();if(!cfgM.hidden){var t=$('#cfgCompass');if(t)t.checked=CFG.bussola}});
  rb.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();rb.click()}});
})();
document.addEventListener('change',function(e){if(e.target&&e.target.id==='cfgCompass'){CFG.bussola=e.target.checked;saveCfg();if(CFG.bussola&&!CMP.on)cmpStart();else if(!CFG.bussola&&CMP.on)cmpStop()}});
if(CFG.bussola)setTimeout(function(){if(!CMP.on)cmpStart()},800);
aoFazer('trajeto montado',function(){if(CMP.on)cmpSchedule()});/* ---------- filtros do topo: encurta os nomes se não couberem numa linha ---------- */
(function(){var bar=document.querySelector('.bar'),ch=bar&&bar.querySelector('.chips');if(!ch)return;
  function fit(){bar.classList.remove('short');if(getComputedStyle(ch).display!=='grid')return;
    var over=[].some.call(ch.children,function(c){var l=c.lastElementChild,r=c.getBoundingClientRect();return c.scrollWidth>c.clientWidth||(l&&l.getBoundingClientRect().right>r.right-9)})||ch.scrollWidth>ch.clientWidth;
    if(over)bar.classList.add('short')}
  var t;function later(){clearTimeout(t);t=setTimeout(fit,80)}
  window.addEventListener('resize',later);window.addEventListener('orientationchange',later);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
  new MutationObserver(later).observe(document.documentElement,{attributes:true,attributeFilter:['data-font','style','class']});
  fit();
})();
/* ======================= versão de apresentação: robustez ======================= */
/* Número da versão: o empacotamento para o GitHub troca 'dev' pela data e hora do pacote. */
var APP_VERSION='20261109-1606';
var ON_SITE=!(window.claude&&typeof window.claude.use==='function');
/* ---------- limite de envios: carimbo do servidor + intervalo no aparelho ---------- */
var POST_GAP={rep:30,fila:30,req:60};
function stamp(o){try{if(FBMODE&&window.firebase&&firebase.firestore&&firebase.firestore.FieldValue)o.at=firebase.firestore.FieldValue.serverTimestamp()}catch(e){}return o}
function postLast(k){try{return +localStorage.getItem('cse-post-'+k)||0}catch(e){return 0}}
function postGap(k){
  if(!FBMODE||GESTOR===true)return true;
  var wait=Math.ceil((postLast(k)+POST_GAP[k]*1000-Date.now())/1000);
  if(wait>0){gToast('Espere '+wait+' s para enviar de novo. O limite evita envios repetidos.',1);return false}
  return true;
}
function postDone(k){try{localStorage.setItem('cse-post-'+k,String(Date.now()))}catch(e){};var m={fila:'fila',rep:'avisos',req:'pedidos'}[k];if(m){CONTRIB[m]++;saveContrib();if(contaOk())accQueue()}}
function postFail(){
  if(FBMODE){gToast(SH.full&&GESTOR!==true?fullMsg('enviar'):'Não deu para enviar agora. Espere alguns segundos e tente de novo.',1);return}
  SH.denied=true;refreshAll();
}
/* ---------- limite de pessoas que participam (vagas) ---------- */
var VAGAS={n:null,max:80,ok:false};SH.full=false;SH.member=false;
function fullMsg(acao){return 'As '+VAGAS.max+' vagas para participar já foram preenchidas. Você continua vendo tudo, mas não consegue '+acao+'.'}
function vagasRef(){return SH.db.doc('meta/vagas')}
function memberData(old){var now=Date.now(),o={first:+(old&&old.first)||now,last:now,visits:(+(old&&old.visits)||0)+1};if(ACC.name)o.nome=String(ACC.name).slice(0,60);if(ACC.email)o.email=String(ACC.email).toLowerCase().slice(0,120);return o}
function isGestorEmail(email){
  if(!email)return Promise.resolve(false);
  return SH.db.doc('gestores/'+String(email).toLowerCase()).get().then(function(d){return !!d.exists},function(){return false});
}
function memberFlow(uid){
  var db=SH.db,u=ACC.fb&&ACC.fb.auth.currentUser,email=u&&u.email;
  var k='cse-seen-'+uid,last=0;try{last=+localStorage.getItem(k)||0}catch(e){}
  Promise.all([db.doc('members/'+uid).get(),vagasRef().get().catch(function(){return {exists:false}}),isGestorEmail(u&&u.emailVerified!==false?email:null)]).then(function(r){
    var m=r[0],v=r[1],gest=r[2];
    if(v.exists){var vd=v.data()||{};VAGAS.n=+vd.n||0;VAGAS.max=+vd.max||80;VAGAS.ok=true}
    if(gest&&!v.exists)initVagas();
    if(m.exists){SH.member=true;SH.full=false;
      if(Date.now()-last<30*60000)return;
      return db.doc('members/'+uid).set(memberData(m.data()||{})).then(function(){try{localStorage.setItem(k,String(Date.now()))}catch(e){}});}
    if(gest||!v.exists){/* gestor não ocupa vaga; antes da gestão configurar as vagas, entra sem contar */
      return db.doc('members/'+uid).set(memberData(null)).then(function(){SH.member=true;SH.full=false;try{localStorage.setItem(k,String(Date.now()))}catch(e){}refreshAll()});}
    if(VAGAS.n>=VAGAS.max){SH.full=true;refreshAll();gToast(fullMsg('enviar avisos, filas ou notas'),1);return}
    var b=db.batch();b.set(db.doc('members/'+uid),memberData(null));b.update(vagasRef(),{n:firebase.firestore.FieldValue.increment(1)});
    return b.commit().then(function(){SH.member=true;SH.full=false;VAGAS.n++;try{localStorage.setItem(k,String(Date.now()))}catch(e){}refreshAll()},
      function(){/* alguém pegou a última vaga ao mesmo tempo */SH.full=true;refreshAll();gToast(fullMsg('enviar avisos, filas ou notas'),1)});
  }).catch(function(){});
}
function initVagas(){
  SH.db.collection('members').get().then(function(s){return s.docs.length},function(){return 0}).then(function(n){
    return vagasRef().set({n:n,max:80}).then(function(){VAGAS.n=n;VAGAS.max=80;VAGAS.ok=true;if(gestM&&!gestM.hidden)renderGest()});
  }).catch(function(){});
}
function watchVagas(){vagasRef().onSnapshot(function(d){if(!d.exists)return;var x=d.data()||{};VAGAS.n=+x.n||0;VAGAS.max=+x.max||80;VAGAS.ok=true;if(gestM&&!gestM.hidden&&(gTab==='usuarios'||gTab==='geral'))renderGest()},function(){})}
aoFazer('gestor definido',function(v){if(v===true&&FBMODE&&SH.db&&!VAGAS.watch){VAGAS.watch=true;watchVagas()}});
aoFazer('usuário saiu',function(){SH.full=false;SH.member=false});
/* gestão › Usuários: vagas e liberar vaga */
document.addEventListener('submit',function(e){
  var f=e.target.closest('form[data-gform="vagas"]');if(!f)return;e.preventDefault();e.stopPropagation();
  var mx=Math.round(+$('#gVmax').value);if(!(mx>=1&&mx<=2000)){gToast('Use um número entre 1 e 2000.',1);return}
  vagasRef().set({n:VAGAS.n||0,max:mx}).then(function(){gToast('Limite salvo: '+mx+' pessoas.')},function(){gToast('Não deu para salvar. Você precisa do privilégio Usuários e das regras novas do Firestore.',1)});
},true);
document.addEventListener('click',function(e){
  var fr=e.target.closest('[data-gfree]');
  if(fr&&FBMODE){var id=fr.dataset.gfree,b=SH.db.batch();b.delete(SH.db.doc('members/'+id));b.update(vagasRef(),{n:firebase.firestore.FieldValue.increment(-1)});
    b.commit().then(function(){gToast('Vaga liberada.')},function(){gToast('Não deu para liberar a vaga.',1)});return}
  if(e.target.closest('#gVrecount')){SH.db.collection('members').get().then(function(s){return vagasRef().set({n:s.docs.length,max:VAGAS.max})}).then(function(){gToast('Contador refeito.')},function(){gToast('Não deu para recontar.',1)})}
});
/* ---------- registro de erros dos aparelhos (só no site com Firebase) ---------- */
var ERR={n:0,seen:{},queue:[]};
function errUA(){var u=navigator.userAgent||'';return u.slice(0,200)}
function errLog(msg,src,line){
  if(!FBMODE)return;
  msg=String(msg||'erro').slice(0,300);var key=msg+'|'+line;if(ERR.seen[key]||ERR.n>=5)return;ERR.seen[key]=1;ERR.n++;
  var o={msg:msg,src:String(src||'').replace(location.origin,'').slice(0,200),linha:+line||0,ua:errUA(),ver:APP_VERSION,pag:(location.pathname||'').slice(0,100),ts:Date.now(),uid:SH.uid||''};
  if(SH.db)SH.db.collection('erros').add(o).catch(function(){});else ERR.queue.push(o);
}
window.addEventListener('error',function(e){if(e&&e.message)errLog(e.message,e.filename,e.lineno)});
window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;if(r&&r.code&&/^(auth|permission|firestore)\//.test(String(r.code)))return;
  /* falhas conhecidas do IndexedDB do Safari, dentro do login do Firebase: o login segue funcionando, então não viram erro */
  if(/Indexed ?Database|IndexedDB|IDBDatabase|in-progress transaction|Connection to Indexed Database server lost/i.test(String(r&&(r.message||r)||''))){try{e.preventDefault()}catch(x){}return}errLog('Promessa rejeitada: '+(r&&(r.message||r.code)||r),'',0)});
aoFazer('Firebase conectado',function(fb){ERR.queue.splice(0).forEach(function(o){SH.db.collection('erros').add(o).catch(function(){})})});
var ERRL=null;
function loadErrs(){SH.db.collection('erros').get().then(function(s){ERRL=s.docs.map(function(d){var x=d.data()||{};return {id:d.id,msg:String(x.msg||''),src:String(x.src||''),linha:+x.linha||0,ua:String(x.ua||''),ver:String(x.ver||''),ts:+x.ts||0}}).sort(function(a,b){return b.ts-a.ts});if(gestM&&!gestM.hidden&&gTab==='geral')renderGest()},function(){ERRL=[];})}
function uaShort(u){var os=/iPhone|iPad/.test(u)?'iPhone/iPad':/Android/.test(u)?'Android':/Windows/.test(u)?'Windows':/Mac OS/.test(u)?'Mac':'outro';
  var br=/Instagram/.test(u)?'Instagram':/FBAN|FBAV/.test(u)?'Facebook':/WhatsApp/.test(u)?'WhatsApp':/SamsungBrowser/.test(u)?'Samsung Internet':/EdgA?\//.test(u)?'Edge':/CriOS|Chrome\//.test(u)?'Chrome':/FxiOS|Firefox/.test(u)?'Firefox':/Safari/.test(u)?'Safari':'navegador interno';return os+' · '+br}
function errCard(){
  if(!FBMODE||!SH.on||!gcan('usuarios'))return '';
  if(ERRL===null){ERRL=[];loadErrs()}
  var l=ERRL.slice(0,20);
  return '<h3 class="gh">Erros nos aparelhos</h3><p class="muted small">Falhas que aconteceram no celular de quem usa o app, com o aparelho e a versão. Útil no dia da apresentação para saber o que corrigir.</p>'+
    (l.length?'<div class="glist">'+l.map(function(x){return '<div class="grow2"><span class="grow"><b>'+esc(x.msg)+'</b><small>'+esc(uaShort(x.ua))+' · versão '+esc(x.ver)+' · '+agoTxt(x.ts)+(x.src?' · '+esc(x.src)+(x.linha?':'+x.linha:''):'')+'</small></span></div>'}).join('')+'</div><div class="gbtns"><button type="button" class="copy" id="gErrReload">Atualizar</button><button type="button" class="copy danger" id="gErrClear">Apagar todos</button></div>'
      :'<p class="muted small">Nenhum erro registrado.</p><div class="gbtns"><button type="button" class="copy" id="gErrReload">Atualizar</button></div>');
}
document.addEventListener('click',function(e){
  if(e.target.closest('#gErrReload')){loadErrs();return}
  if(e.target.closest('#gErrClear')){var b=SH.db.batch();(ERRL||[]).forEach(function(x){b.delete(SH.db.doc('erros/'+x.id))});b.commit().then(function(){ERRL=[];renderGest();gToast('Erros apagados.')},function(){gToast('Não deu para apagar.',1)})}
});
/* ---------- modo apresentação: exemplos de fila e avisos ---------- */
var DEMO_ID='exemplo-apresentacao';
/* malha de cobertura de exemplo: parte da mesma simulação da prévia, agrupada em hexágonos de 30 m; quase toda com eduroam */
function demoMesh(){
  var src=covSamplesExemplo(),cells={},t=Math.floor(Date.now()/600000)*600000,r=covRand(4242),out=[];
  src.forEach(function(s){var c=cellOf(s.p),o=cells[c.k]||(cells[c.k]={c:c,n:0,ok:0,mb:0});o.n++;if(s.ok){o.ok++;o.mb+=s.mb}});
  Object.keys(cells).forEach(function(k){var o=cells[k],ok=o.ok/o.n>=.5,mb=ok?Math.min(999,Math.round(o.mb/Math.max(1,o.ok)*10)/10):0,reps=o.n>=8?3:o.n>=4?2:1;
    for(var i=0;i<reps;i++)out.push({cell:k,x:o.c.x,y:o.c.y,ok:ok,edu:ok?r()<.85:null,mb:mb,ms:ok?Math.round(30+r()*150):0,tipo:'wifi',acc:20,t:t,ver:'exemplo'})});
  return out.slice(0,1200);
}
function demoWriteMed(list){
  if(typeof SH.db.batch!=='function')return Promise.all(list.map(function(x){return SH.db.collection('medicoes').add(x)}));
  var ps=[],tag=Date.now().toString(36);for(var i=0;i<list.length;i+=400){var b=SH.db.batch();list.slice(i,i+400).forEach(function(x,j){b.set(SH.db.doc('medicoes/exemplo-'+tag+'-'+(i+j)),x)});ps.push(b.commit())}
  return Promise.all(ps);
}
function demoHasVotes(){return !!(SH.voteDocs&&SH.voteDocs[DEMO_ID])}
function demoClearMed(){if(!FBMODE||!SH.db)return Promise.resolve();return SH.db.collection('medicoes').where('ver','==','exemplo').get().then(function(q){if(!q.docs.length)return;var ps=[];for(var i=0;i<q.docs.length;i+=400){var b=SH.db.batch();q.docs.slice(i,i+400).forEach(function(x){b.delete(x.ref)});ps.push(b.commit())}return Promise.all(ps)})}
function demoCard(){
  if(!SH.on||!gcan('avisos'))return '';
  var has=SH.fila.some(function(r){return r.owner===DEMO_ID})||SH.reps.some(function(r){return r.owner===DEMO_ID})||demoHasVotes();
  return '<h3 class="gh">Modo apresentação</h3><div class="gcard"><p class="small">Preenche com exemplos tudo o que os alunos informam: fila dos RUs, um aviso de cada tipo, notas para todas as redes Wi-Fi, a malha do mapa de cobertura (com eduroam) e pedidos de correção. Filas somem em 45 min e avisos em 4 h; o resto sai com o botão Limpar.</p>'+
    '<p class="muted small">Dica: no campo Horário, escolha 22:00 para mostrar a Volta à noite a qualquer hora.</p><div class="gbtns"><button type="button" class="copy primary" id="gDemoOn">'+(has?'Renovar exemplos':'Preencher exemplos')+'</button>'+(has?'<button type="button" class="copy danger" id="gDemoOff">Limpar exemplos</button>':'')+'</div></div>';
}
function demoItems(){
  var now=Date.now(),m=60000,f=[],r=[];
  var lv=[3,1,2,0,2,1];
  RUS.forEach(function(k,i){f.push({id:'fx'+i,ru:k,n:lv[i%lv.length],ts:now-(3+i*4)*m})});
  var st=Object.keys(STOPS),wf=Object.keys(WIFI),pl=Object.keys(PL).filter(function(k){return PL[k].p&&PL[k].cat!=='aula'});
  var pick=function(a,i){return a.length?a[i%a.length]:null};
  var ex={onibus:['stop:'+(STOPS.ctl?'ctl':pick(st,1)),'Linha 1 passou lotada'],wifi:['wifi:'+pick(wf,0),'Rede caiu depois das 10h'],
    fila:['pl:'+(PL.ru_central?'ru_central':pick(pl,0)),'Fila até a porta'],fechado:['pl:'+pick(pl,3),'Fechado sem aviso hoje'],
    elevador:['pl:'+pick(pl,5),'Elevador parado no bloco A'],limpeza:['pl:'+pick(pl,7),'Banheiro do 2º andar sem papel'],
    seguranca:['stop:'+pick(st,6),'Pouca luz no ponto à noite'],outro:['stop:'+pick(st,9),'Obra na calçada perto do ponto']};
  REP_K.forEach(function(k,i){var e=ex[k[0]];if(!e||/null$/.test(e[0]))return;r.push({id:'rx'+i,k:k[0],place:e[0],txt:e[1],ts:now-(5+i*7)*m})});
  /* uma nota para cada rede Wi-Fi, de 1 a 5, variando */
  var v={},nt=[4,2,5,3,1,4,3,5,2,4];wf.forEach(function(id,i){v[id]=nt[i%nt.length]});
  /* pedidos de correção, um de cada tipo */
  var q=REQ_T.slice(0,6).map(function(t,i){var al={onibus:'Linha 2',ponto:STOPS[pick(st,4)]?STOPS[pick(st,4)].name:'Ponto',wifi:WIFI[pick(wf,1)]?WIFI[pick(wf,1)].name:'Wi-Fi',servico:'RU Central',planta:'CT, bloco H',outro:'App'}[t[0]]||'';
    var tx={onibus:'O horário das 18h mudou para 18h10.',ponto:'O ponto mudou para o outro lado da rua.',wifi:'A senha da rede mudou.',servico:'O RU abre às 10h30 nas sextas.',planta:'Falta a planta do 3º andar.',outro:'Seria bom ter o horário do bandejão no fim de semana.'}[t[0]]||'';
    return {id:'qx'+i,t:t[0],alvo:al,txt:tx,ts:now-(20+i*30)*m}});
  /* medições do mapa de cobertura em volta dos pontos de Wi-Fi */
  var md=demoMesh();
  return {f:f,r:r,v:v,q:q,md:md};
}
document.addEventListener('click',function(e){
  if(e.target.closest('#gDemoOn')){var d=demoItems(),falhou=[];
    var job=function(nome,p){return Promise.resolve(p).then(function(){return true},function(){falhou.push(nome);return false})};
    var tasks=[job('fila',SH.db.doc('fila/'+DEMO_ID).set({items:d.f})),job('avisos',SH.db.doc('reports/'+DEMO_ID).set({items:d.r})),
      job('notas de Wi-Fi',SH.db.doc('votes/'+DEMO_ID).set({r:d.v,ts:Date.now()})),job('pedidos de correção',SH.db.doc('requests/'+DEMO_ID).set({items:d.q}))];
    if(FBMODE)tasks.push(job('malha de cobertura',demoClearMed().then(function(){return demoWriteMed(d.md)})));
    else{try{localStorage.setItem('cse-demo-med',JSON.stringify(d.md))}catch(x){}}
    Promise.all(tasks).then(function(){if(!falhou.length)gToast('Exemplos publicados. Todos que abrirem o app vão ver.');
      else gToast('Exemplos publicados, menos: '+falhou.join(', ')+'. Confira os privilégios e publique as regras novas do Firestore.',1);if(typeof COV!=='undefined'){COV.real=null;if(COV.on&&FBMODE)covLoadReal()}if(FBMODE&&SH.db&&gcan('solicitacoes'))SH.db.collection('requests').get().then(function(x){SH.req=flatReq(x.docs);if(gestM&&!gestM.hidden)renderGest()},function(){})});return}
  if(e.target.closest('#gDemoOff')){var ps=[SH.db.doc('fila/'+DEMO_ID).delete(),SH.db.doc('reports/'+DEMO_ID).delete(),SH.db.doc('votes/'+DEMO_ID).delete(),SH.db.doc('requests/'+DEMO_ID).delete()].map(function(x){return Promise.resolve(x).catch(function(){})});
    if(FBMODE)ps.push(demoClearMed().catch(function(){}));try{localStorage.removeItem('cse-demo-med')}catch(x){}
    Promise.all(ps).then(function(){gToast('Exemplos removidos.');if(typeof COV!=='undefined'){COV.real=null;if(COV.on&&FBMODE)covLoadReal()}})}
});
/* os exemplos não contam como usuário bloqueado nem aparecem como pessoa */
/* ---------- navegador interno (WhatsApp, Instagram, Facebook…) ---------- */
var INAPP=(function(){var u=navigator.userAgent||'';
  if(/FBAN|FBAV|FB_IAB|Instagram|Line\/|LinkedInApp|Snapchat|musical_ly|TikTok|BytedanceWebview|WhatsApp|GSA\//i.test(u))return true;
  if(/Android/.test(u)&&/; wv\)/.test(u))return true;
  if(/iPhone|iPad|iPod/.test(u)&&!/Safari\//.test(u)&&!navigator.standalone)return true;
  return false})();
/* qual app abriu o link e onde fica o menu dele, para o passo a passo */
var IA=(function(){var u=navigator.userAgent||'',android=/Android/.test(u),n='';
  if(/Instagram/i.test(u))n='Instagram';else if(/FBAN|FBAV|FB_IAB|FBIOS/.test(u))n='Facebook';else if(/WhatsApp/i.test(u))n='WhatsApp';
  else if(/musical_ly|TikTok|BytedanceWebview/i.test(u))n='TikTok';else if(/LinkedInApp/i.test(u))n='LinkedIn';else if(/Snapchat/i.test(u))n='Snapchat';
  else if(/Line\//.test(u))n='LINE';else if(/GSA\//.test(u))n='app do Google';
  var br=android?'Chrome':'Safari',menu=android&&n!=='Instagram'&&n!=='TikTok'?'⋮':'⋯';
  var opt=n==='Instagram'||n==='Facebook'?'Abrir no navegador externo':n==='WhatsApp'?'Abrir no '+br:'Abrir no navegador';
  return {android:android,app:n,br:br,menu:menu,opt:opt}})();
function iaURL(){return location.href.split('#')[0]}
function iaIntent(){var url=iaURL();return 'intent://'+url.replace(/^https?:\/\//,'')+'#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url='+encodeURIComponent(url)+';end'}
function inappHTML(){
  return '<div class="inapp" id="inapp" role="region" aria-label="Aviso sobre o navegador"><p><b>Você está no navegador '+(IA.app?'do '+esc(IA.app):'de outro aplicativo')+'.</b> Para entrar com Google e usar localização, bússola e biometria, abra no '+IA.br+'.</p>'+
    '<div class="inapp-b">'+(IA.android?'<a class="copy primary" href="'+esc(iaIntent())+'">Abrir no Chrome</a>':'<button type="button" class="copy primary" id="inappHow">Como abrir no Safari</button>')+
    '<button type="button" class="copy" id="inappCopy">Copiar link</button><button type="button" class="copy" id="inappX" aria-label="Fechar aviso">Agora não</button></div></div>';
}
/* tela cheia que aparece antes do login e da capa */
function iaGateHTML(){
  var who=IA.app?'do '+esc(IA.app):'deste aplicativo';
  return '<div class="iagate" id="iagate" role="dialog" aria-modal="true" aria-labelledby="iagT">'+
    '<span class="iag-arrow" aria-hidden="true">Menu '+IA.menu+' aqui ↑</span>'+
    '<div class="iagate-card">'+
      '<p class="eyebrow">Você abriu pelo '+(IA.app?esc(IA.app):'link de outro app')+'</p>'+
      '<h2 id="iagT">Abra no '+IA.br+' para usar o app inteiro</h2>'+
      '<p>No navegador '+who+', o Google não deixa entrar e o celular bloqueia localização, bússola e biometria.</p>'+
      (IA.android?'<a class="copy primary iag-go" id="iagGo" href="'+esc(iaIntent())+'">Abrir no Chrome</a><p class="muted small iag-or">Se não abrir, faça assim:</p>':'')+
      '<ol class="iag-steps"><li>Toque em <b>'+IA.menu+'</b> no canto de cima da tela.</li><li>Escolha <b>'+esc(IA.opt)+'</b> (o nome muda um pouco de app para app).</li></ol>'+
      '<div class="inapp-b"><button type="button" class="copy" id="inappCopy">Copiar link</button><span class="small muted">e cole no '+IA.br+'</span></div>'+
      '<button type="button" class="linkbtn iag-stay" id="iagStay">Continuar aqui mesmo</button>'+
      '<p class="muted small">Aqui dá para consultar o mapa e entrar com e-mail e senha.</p>'+
    '</div></div>';
}
function iaGate(){if($('#iagate'))return;document.body.insertAdjacentHTML('beforeend',iaGateHTML());setTimeout(function(){var b=$('#iagGo')||$('#iagStay');if(b)b.focus({preventScroll:true})},60)}
if(ON_SITE&&INAPP){
  var _skipIA=false;try{_skipIA=sessionStorage.getItem('cse-inapp-x')==='1'}catch(e){}
  if(!_skipIA)iaGate();
  else{var app0=document.querySelector('.app');if(app0)app0.insertAdjacentHTML('afterbegin',inappHTML())}
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('#iagate')){var st=$('#iagStay');if(st)st.click()}});
  document.addEventListener('click',function(e){
    if(e.target.closest('#iagStay')){var g=$('#iagate');if(g)g.remove();try{sessionStorage.setItem('cse-inapp-x','1')}catch(_){}
      if(!$('#inapp')){var a=document.querySelector('.app');if(a)a.insertAdjacentHTML('afterbegin',inappHTML())}return}
    if(e.target.closest('#inappHow')){iaGate();return}
    if(e.target.closest('#inappX')){var b=$('#inapp');if(b)b.remove();try{sessionStorage.setItem('cse-inapp-x','1')}catch(_){}return}
    if(e.target.closest('#inappCopy')){var url=location.href.split('#')[0];
      var done=function(){gToast('Link copiado. Cole no '+(/Android/.test(navigator.userAgent)?'Chrome':'Safari')+'.')};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(done,function(){prompt('Copie o link:',url)});else prompt('Copie o link:',url)}
  });
  /* o Google recusa login nesses navegadores: explica em vez de abrir uma tela de erro */
  document.addEventListener('click',function(e){
    var g=e.target.closest('[data-goo]');if(!g)return;e.preventDefault();e.stopImmediatePropagation();
    gToast('O Google não deixa entrar por aqui. Abra no '+IA.br+' ou use "Entrar com e-mail".',1);
    iaGate();
  },true);
}
/* ---------- aviso de versão nova (site) ---------- */
function verCheck(){
  if(!ON_SITE||APP_VERSION==='dev'||!window.fetch)return;
  fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){
    if(!j||!j.v||j.v===APP_VERSION||$('#newver'))return;
    document.body.insertAdjacentHTML('beforeend','<div class="newver" id="newver" role="status"><span>Saiu uma versão nova do app.</span><button type="button" class="copy primary" id="newverGo">Atualizar</button></div>');
  }).catch(function(){});
}
/* "Atualizar": pede ao service worker a versão nova antes de recarregar (senão podia voltar a versão guardada) */
document.addEventListener('click',function(e){if(!e.target.closest('#newverGo'))return;var b=e.target.closest('#newverGo');b.disabled=true;b.textContent='Atualizando…';
  var rec=function(){location.reload()};try{if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration){navigator.serviceWorker.getRegistration().then(function(g){return g&&g.update()}).then(rec,rec);setTimeout(rec,4000);return}}catch(x){}rec()});
if(ON_SITE&&APP_VERSION!=='dev'){setTimeout(verCheck,4000);setInterval(verCheck,5*60000);document.addEventListener('visibilitychange',function(){if(!document.hidden)verCheck()})}
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
/* ======================= cobertura do Wi-Fi da UFRJ (prévia com dados de exemplo) ======================= */
/* Hexágonos de ~30 m (≈60 m de longe) coloridos pela qualidade medida, transparência pela quantidade de
   medições; prédios da planta coloridos pelo que foi medido dentro deles. Nesta prévia as medições são inventadas. */
var COV={on:false,per:'semana',lvl:0,samples:null,bld:null,bldLoading:false,pick:null};
var COV_U=30/3.86; /* 30 m em unidades do mapa */
var COV_C=['#8FA9C4','#3F86E0','#2FB6FF'];
var COV_N=['Fraco','Bom','Rápido'];
function covRand(seed){var s=seed>>>0;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
/* amostras de exemplo (prévia do mapa de cobertura) */
function covSamplesExemplo(){
  if(COV.samples)return COV.samples;
  var r=covRand(20261030),out=[],now=Date.now(),day=864e5;
  function g(){var u=r()||1e-9,v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
  function hot(p,n,sig,base){for(var i=0;i<n;i++){var x=p[0]+g()*sig,y=p[1]+g()*sig,d=Math.hypot(x-p[0],y-p[1]);
    var q=Math.max(0,base-d/sig*6+g()*4),ok=r()<Math.min(.98,.45+q/25);
    out.push({p:[x,y],ok:ok,mb:ok?Math.max(.4,q):0,t:now-(r()<.6?r()*7:r()*30)*day})}}
  Object.keys(WIFI).forEach(function(k){hot(WIFI[k].p,70,9,26)});
  (typeof BLDN!=='undefined'?BLDN:[]).forEach(function(b){hot([b[1],b[2]],b[3]===1?40:22,7,b[3]===1?16:10)});
  Object.keys(STOPS).forEach(function(k){hot(STOPS[k].p,10,6,6)});
  COV.samples=out;return out;
}
function covFilter(){var lim=COV.per==='semana'?7:30,since=Date.now()-lim*864e5;return covSamples().filter(function(s){return s.t>=since})}
function covLevel(c){if(!c.n)return -1;var ok=c.ok/c.n,mb=c.okn?c.mb/c.okn:0;if(ok<.5||mb<3)return 0;if(mb<15)return 1;return 2}
function covAgg(list){var c={n:0,ok:0,okn:0,mb:0,last:0};list.forEach(function(s){c.n++;if(s.ok){c.ok++;c.okn++;c.mb+=s.mb}if(s.t>c.last)c.last=s.t});return c}
/* prédios: contornos lidos do mapa vetorial */
function covLoadBld(){
  if(COV.bld||COV.bldLoading||typeof MAPVEC==='undefined')return;COV.bldLoading=true;
  fetch(MAPVEC0).then(function(r){return r.text()}).then(function(t){
    var m=t.match(/<path fill="#4d5967"[^>]*\sd="([^"]+)"/);if(!m){COV.bld=[];return}
    COV.bld=m[1].split('M').filter(function(x){return x.trim()}).map(function(seg){
      var n=seg.replace(/Z/g,'').trim().split(/[\s,]+/).map(Number),pts=[];for(var i=0;i+1<n.length;i+=2)pts.push([n[i],n[i+1]]);
      var xs=pts.map(function(p){return p[0]}),ys=pts.map(function(p){return p[1]});
      return {d:'M'+seg.trim(),pts:pts,x0:Math.min.apply(null,xs),x1:Math.max.apply(null,xs),y0:Math.min.apply(null,ys),y1:Math.max.apply(null,ys)};
    }).filter(function(b){return b.pts.length>2&&(b.x1-b.x0)*(b.y1-b.y0)>4});
    COV.bldLoading=false;drawCov();
  },function(){COV.bldLoading=false;COV.bld=[]});
}
function inPoly(p,pts){var c=false;for(var i=0,j=pts.length-1;i<pts.length;j=i++){var a=pts[i],b=pts[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function hexPath(cx,cy,r){var s='';for(var i=0;i<6;i++){var a=Math.PI/180*(60*i+30);s+=(i?'L':'M')+(cx+r*Math.cos(a)).toFixed(1)+' '+(cy+r*Math.sin(a)).toFixed(1)}return s+'Z'}
function drawCov(){
  var g=$('#gCov');if(!g)return;
  if(!COV.on){g.innerHTML='';return}
  var ppu=box().w/view.w,far=ppu<(box().w<680?1.2:1.6);COV.lvl=far?2:1;
  var R=(far?2:1)*COV_U/Math.sqrt(3),W=Math.sqrt(3)*R,Hh=1.5*R;
  var list=covFilter(),cells={},blds=COV.bld||[],inB={},bIx={};
  list.forEach(function(s){
    if(!far)for(var i=0;i<blds.length;i++){var b=blds[i];if(s.p[0]>=b.x0&&s.p[0]<=b.x1&&s.p[1]>=b.y0&&s.p[1]<=b.y1&&inPoly(s.p,b.pts)){(inB[i]=inB[i]||[]).push(s);return}}
    var row=Math.round(s.p[1]/Hh),col=Math.round((s.p[0]-(row&1?W/2:0))/W),k=row+':'+col;(cells[k]=cells[k]||[]).push(s);
  });
  var h='';
  Object.keys(cells).forEach(function(k){var a=k.split(':'),row=+a[0],col=+a[1],cx=col*W+(row&1?W/2:0),cy=row*Hh,c=covAgg(cells[k]),lv=covLevel(c);
    if(lv<0)return;var op=Math.min(.85,.32+c.n*.06);
    h+='<path class="cov-h" data-cov="h:'+k+'" d="'+hexPath(cx,cy,R*.96)+'" style="fill:'+COV_C[lv]+';fill-opacity:'+op.toFixed(2)+'"/>';
    bIx['h:'+k]=c});
  Object.keys(inB).forEach(function(i){var c=covAgg(inB[i]),lv=covLevel(c);if(lv<0)return;var op=Math.min(.9,.35+c.n*.06);
    h+='<path class="cov-b" data-cov="b:'+i+'" d="'+blds[i].d+'Z" style="fill:'+COV_C[lv]+';fill-opacity:'+op.toFixed(2)+'"/>';bIx['b:'+i]=c});
  COV.idx=bIx;g.innerHTML=h;
}
function covTagHTML(){
  if(FBMODE&&COV.real&&COV.real.length&&!COV.demo)return '<span class="pill good cov-tag">'+COV.real.length+' medições dos alunos · 30 dias</span>';
  return '<span class="pill warn cov-tag">'+(FBMODE&&COV.real&&!COV.real.length?'Exemplo · ainda sem medições reais':'Prévia · dados de exemplo')+'</span>';
}
function covCardHTML(){
  var h=covCardBody();
  if(FBMODE)h+='<p class="small cov-help">'+(CFG.covShare?'Você está ajudando a mapear. <button type="button" class="linkbtn" id="covNow">Medir agora</button>':'<button type="button" class="linkbtn" id="covJoin">Ajudar a mapear o Wi-Fi</button>')+'</p>';
  return h;
}
/* corpo do cartão de cobertura */
function covCardBody(){
  var c=COV.pick&&COV.idx&&COV.idx[COV.pick];
  var head='<div class="cov-h1"><b>Cobertura do Wi-Fi da UFRJ</b><button type="button" class="cov-x" id="covX" aria-label="Fechar cobertura">×</button></div>'+covTagHTML();
  if(c){var lv=covLevel(c),ok=c.ok,n=c.n,mb=c.okn?(c.mb/c.okn):0,ago=Math.round((Date.now()-c.last)/36e5);
    return head+'<p class="cov-sum"><span class="cov-sw" style="background:'+COV_C[lv]+'"></span><b>'+COV_N[lv]+'</b> · '+(COV.pick.charAt(0)==='b'?'dentro do prédio':'nesta área de ~'+(COV.lvl===2?60:30)+' m')+'</p>'+
      '<p class="small">A rede da UFRJ funcionou em <b>'+ok+' de '+n+'</b> medições · média <b>'+mb.toFixed(0)+' Mb/s</b> · última há '+(ago<1?'menos de 1 h':ago<48?ago+' h':Math.round(ago/24)+' dias')+'</p>'+
      '<button type="button" class="linkbtn" id="covBack">Ver legenda</button>'}
  return head+'<div class="cov-leg"><span><i class="cov-sw empty"></i>Sem dados</span>'+COV_N.map(function(n,i){return '<span><i class="cov-sw" style="background:'+COV_C[i]+'"></i>'+n+'</span>'}).join('')+'</div>'+
    '<p class="muted small">Mais forte = mais medições. Toque num hexágono ou prédio para ver os números. Aproxime para ver áreas de 30 m e os prédios.</p>'+
    '<div class="seg cov-per" role="group" aria-label="Período">'+[['semana','Última semana'],['mes','Último mês']].map(function(p){return '<button type="button" data-covper="'+p[0]+'" aria-pressed="'+(COV.per===p[0])+'">'+p[1]+'</button>'}).join('')+'</div>';
}
function covPaintCard(){var c=$('#covCard');if(!c)return;c.hidden=!COV.on;if(COV.on)c.innerHTML=covCardHTML()}
function covSet(on){COV.on=on;COV.pick=null;
  if(on){covLoadBld();if(!state.layers.wifi){var w=$('#chWifi');if(w)setLayer('wifi',w)}wifiChip();}
  drawCov();covPaintCard();wifiChip();if(on&&FBMODE&&COV.real==null)covLoadReal();}
(function(){
  var mw=document.querySelector('.mapwrap');if(!mw)return;
  mw.insertAdjacentHTML('beforeend','<div class="covcard glass" id="covCard" hidden></div>');
  document.addEventListener('click',function(e){
    if(e.target.closest('#covBtn')){covSet(!COV.on);return}
    if(e.target.closest('#covX')){covSet(false);return}
    if(e.target.closest('#covBack')){COV.pick=null;covPaintCard();return}
    var p=e.target.closest('[data-covper]');if(p){COV.per=p.dataset.covper;COV.pick=null;drawCov();covPaintCard()}
  });
  svg.addEventListener('click',function(e){var h=e.target.closest&&e.target.closest('[data-cov]');if(!h||e.target.closest('.mk'))return;
    if(suppressClick)return;e.stopImmediatePropagation();suppressClick=false;COV.pick=h.dataset.cov;covPaintCard()},true);
})();
aoFazer('mapa montado',function(){var gl=$('#gLines');if(gl&&!$('#gCov')){var g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='gCov';gl.parentNode.insertBefore(g,gl)}drawCov()});
aoFazer('vista aplicada',function(){if(!COV.on)return;var ppu=box().w/view.w,lv=ppu<(box().w<680?1.2:1.6)?2:1;if(lv!==COV.lvl){COV.pick=null;drawCov();covPaintCard()}});
if($('#gLines')&&!$('#gCov')){var _g0=document.createElementNS('http://www.w3.org/2000/svg','g');_g0.id='gCov';$('#gLines').parentNode.insertBefore(_g0,$('#gLines'))}
/* ======================= rede da UFRJ: diagnóstico, coleta de medições e cobertura real ======================= */
/* O navegador não informa o nome da rede Wi-Fi. A pista é o endereço de internet: na rede da UFRJ ele cai
   na faixa da universidade (146.164.0.0/16). A gestão pode cadastrar faixas extras e a faixa do eduroam. */
GKEYS.push('redes');GST.redes={};
var NET={last:null,busy:false,timer:0,ask:null,asked:false};
function ip2n(ip){var p=String(ip).split('.');if(p.length!==4)return null;var n=0;for(var i=0;i<4;i++){var v=+p[i];if(!(v>=0&&v<=255))return null;n=n*256+v}return n}
function inCidr(ip,c){var a=String(c).trim().split('/'),base=ip2n(a[0]),bits=a.length>1?+a[1]:32,n=ip2n(ip);if(base==null||n==null||!(bits>=0&&bits<=32))return false;return Math.floor(n/Math.pow(2,32-bits))===Math.floor(base/Math.pow(2,32-bits))}
function cidrList(t){return String(t||'').split(/[\s,;]+/).filter(function(x){return /^\d+\.\d+\.\d+\.\d+(\/\d+)?$/.test(x)})}
function ufrjRanges(){return ['146.164.0.0/16'].concat(cidrList((GST.redes||{}).ufrj))}
function eduRanges(){return cidrList((GST.redes||{}).eduroam)}
/* endereços já confirmados: pela gestão (vale para todos) e por este aparelho */
function eduKnown(ip){
  if(!ip)return null;var g=(GST.redes||{}).eduIps||{};if(g[ip]===true||g[ip]===false)return g[ip];
  try{var l=JSON.parse(localStorage.getItem('cse-edu-ips')||'{}');if(l[ip]===true||l[ip]===false)return l[ip]}catch(e){}
  return null;
}
function eduRememberLocal(ip,v){if(!ip)return;try{var l=JSON.parse(localStorage.getItem('cse-edu-ips')||'{}');l[ip]=v;var k=Object.keys(l);if(k.length>40)delete l[k[0]];localStorage.setItem('cse-edu-ips',JSON.stringify(l))}catch(e){}}
function eduSaveG(ip,v){
  if(!ip||!gcan('wifi'))return Promise.resolve(false);
  var R=clone(GST.redes||{});R.eduIps=Object.assign({},R.eduIps||{});R.eduIps[ip]=v;
  var ks=Object.keys(R.eduIps);if(ks.length>200)delete R.eduIps[ks[0]];
  return saveG('redes',R);
}
function eduMarkHTML(r){
  if(!r||!r.ip||r.ip.indexOf(':')>=0||r.ufrj!==true||!gcan('wifi'))return '';
  var k=eduKnown(r.ip);
  return '<div class="edumark"><p class="small">'+(k===true?'Este endereço já está salvo como <b>eduroam</b>.':k===false?'Este endereço já está salvo como <b>outra rede da UFRJ</b>.':'Salve este endereço para o app não perguntar mais aos alunos nesta rede.')+'</p>'+
    '<div class="gbtns"><button type="button" class="copy'+(k===true?'':' primary')+'" data-edusave="1" data-ip="'+esc(r.ip)+'">É o eduroam</button><button type="button" class="copy" data-edusave="0" data-ip="'+esc(r.ip)+'">É outra rede da UFRJ</button></div></div>';
}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-edusave]');if(!b)return;
  var ip=b.dataset.ip,v=b.dataset.edusave==='1';eduRememberLocal(ip,v);
  eduSaveG(ip,v).then(function(ok){if(ok)gToast(v?'Endereço salvo como eduroam.':'Endereço salvo como outra rede da UFRJ.');if(NET.last&&NET.last.ip===ip){NET.last.edu=v;var o=$('#gNetRes');if(o)o.innerHTML=netHTML(NET.last,true)+eduMarkHTML(NET.last)}});
});
function connType(){try{var c=navigator.connection;return c&&c.type?c.type:''}catch(e){return ''}}
function withTimeout(p,ms){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej(new Error('tempo'))},ms)})])}
function getIP(){
  return withTimeout(fetch('https://api.ipify.org?format=json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){return j.ip}),6000)
    .catch(function(){return withTimeout(fetch('https://www.cloudflare.com/cdn-cgi/trace',{cache:'no-store'}).then(function(r){return r.text()}).then(function(t){var m=t.match(/ip=([^\n]+)/);return m?m[1].trim():null}),6000)});
}
function speedTest(){
  var u=MAPIMG+(MAPIMG.indexOf('?')<0?'?':'&')+'t='+Date.now(),t0=performance.now(),t1=0;
  return withTimeout(fetch(u,{cache:'no-store'}).then(function(r){t1=performance.now();return r.arrayBuffer()}).then(function(b){
    var t2=performance.now(),ms=Math.round(t1-t0),sec=Math.max(.05,(t2-t0)/1000);return {ms:ms,mb:+(b.byteLength*8/sec/1e6).toFixed(1),kb:Math.round(b.byteLength/1024)}}),15000);
}
function netCheck(){
  if(NET.busy&&NET.p)return NET.p;NET.busy=true;
  var tipo=connType(),res={t:Date.now(),tipo:tipo,ip:null,ufrj:null,edu:null,ms:null,mb:null,erro:''};
  NET.p=getIP().then(function(ip){res.ip=ip||null;
    if(ip&&ip.indexOf(':')>=0){res.ufrj=null;res.erro='Endereço IPv6: ainda não dá para saber se é da UFRJ.'}
    else if(ip){res.ufrj=ufrjRanges().some(function(c){return inCidr(ip,c)});var e=eduRanges(),kn=eduKnown(ip);res.edu=!res.ufrj?null:kn!==null?kn:e.length?e.some(function(c){return inCidr(ip,c)}):null}
  },function(){res.erro=ON_SITE?'Não deu para consultar o endereço de internet. Pode ser falta de conexão ou um bloqueador.':'No claude.ai o app não pode consultar serviços externos. Teste pelo site do GitHub.'})
  .then(function(){return speedTest().then(function(s){res.ms=s.ms;res.mb=s.mb},function(){})})
  .then(function(){NET.busy=false;NET.p=null;NET.last=res;return res},function(){NET.busy=false;NET.p=null;NET.last=res;return res});
  return NET.p;
}
function netLabel(r){
  if(!r)return 'Ainda não testado';
  if(r.tipo==='cellular')return 'Dados móveis';
  if(r.ufrj===true)return r.edu===true?'eduroam (UFRJ)':r.edu===false?'Rede da UFRJ (não é a faixa do eduroam)':'Rede da UFRJ';
  if(r.ufrj===false)return r.tipo==='wifi'?'Wi-Fi fora da UFRJ':'Fora da rede da UFRJ';
  return 'Não identificado';
}
function netHTML(r,full){
  if(!r)return '<p class="muted small">Toque em Testar para ver em que rede o aparelho está.</p>';
  var tp={wifi:'Wi-Fi',cellular:'Dados móveis',ethernet:'Cabo',none:'Sem conexão'}[r.tipo]||'Não informado pelo navegador';
  var good=r.ufrj===true;
  return '<div class="netbox"><div class="net-h"><span class="pill '+(good?'good':r.ufrj===false?'warn':'')+'">'+esc(netLabel(r))+'</span></div>'+
    '<dl class="netdl"><dt>Tipo de conexão</dt><dd>'+tp+'</dd>'+
    (full?'<dt>Endereço de internet</dt><dd class="mono">'+esc(r.ip||'—')+'</dd>':'')+
    '<dt>Resposta</dt><dd>'+(r.ms!=null?r.ms+' ms':'—')+'</dd><dt>Velocidade</dt><dd>'+(r.mb!=null?r.mb+' Mb/s':'—')+'</dd></dl>'+
    (r.erro?'<p class="muted small">'+esc(r.erro)+'</p>':'')+'</div>';
}
/* ---------- coleta (só no site, com Firebase, para quem ligou a opção) ---------- */
CFG.covShare=CFG.covShare===true;
var COVCOL={sent:0,last:0,msg:''};
function covCanCollect(){return FBMODE&&ON_SITE&&CFG.covShare&&SH.db&&SH.uid&&!SH.full&&!!navigator.geolocation}
function cellOf(p){var R=COV_U/Math.sqrt(3),W=Math.sqrt(3)*R,Hh=1.5*R,row=Math.round(p[1]/Hh),col=Math.round((p[0]-(row&1?W/2:0))/W);return {k:row+':'+col,x:+(col*W+(row&1?W/2:0)).toFixed(1),y:+(row*Hh).toFixed(1)}}
function covMeasure(manual){
  if(!covCanCollect())return Promise.resolve(false);
  return new Promise(function(res){navigator.geolocation.getCurrentPosition(function(pos){res(pos)},function(){res(null)},{enableHighAccuracy:true,maximumAge:60000,timeout:15000})}).then(function(pos){
    if(!pos){COVCOL.msg='Sem localização: a medição não foi feita.';return false}
    if(pos.coords.accuracy>80){COVCOL.msg='Localização imprecisa (±'+Math.round(pos.coords.accuracy)+' m): medição pulada.';return false}
    var p=ll2map(pos.coords.latitude,pos.coords.longitude);
    if(p[0]<BASE.x||p[0]>BASE.x+BASE.w||p[1]<BASE.y||p[1]>BASE.y+BASE.h){COVCOL.msg='Fora do campus: nada foi enviado.';return false}
    return netCheck().then(function(r){
      if(!r){COVCOL.msg='Não deu para medir a rede agora.';return false}
      if(r.tipo==='cellular'){COVCOL.msg='Você está nos dados móveis: nada foi enviado.';return false}
      if(r.ufrj===null){COVCOL.msg='Não deu para identificar a rede: nada foi enviado.';return false}
      var edu=r.edu;if(edu===null&&r.ufrj&&NET.ask!==null)edu=NET.ask;
      var c=cellOf(p),now=Date.now();
      var doc={cell:c.k,x:c.x,y:c.y,ok:!!r.ufrj,edu:edu===true?true:edu===false?false:null,mb:r.ufrj?Math.min(999,r.mb||0):0,ms:Math.min(60000,r.ms||0),
        tipo:String(r.tipo||'').slice(0,12),acc:Math.round(pos.coords.accuracy),t:Math.floor(now/600000)*600000,ver:String(APP_VERSION).slice(0,20)};
      return SH.db.collection('medicoes').add(doc).then(function(){COVCOL.sent++;COVCOL.last=now;COVCOL.msg='Medição enviada: '+netLabel(r)+(r.mb!=null?', '+r.mb+' Mb/s':'')+'.';
        if(r.ufrj&&r.edu===null&&!NET.asked)covAskEdu();
        COV.real=null;if(COV.on)covLoadReal();return true},function(){COVCOL.msg='Não deu para enviar a medição. Confira se você tem vaga para participar.';return false});
    });
  }).then(function(ok){var s=$('#covStat');if(s)s.textContent=COVCOL.msg;if(manual)gToast(COVCOL.msg,!ok);return ok});
}
function covAskEdu(){
  if($('#eduAsk'))return;
  document.body.insertAdjacentHTML('beforeend','<div class="newver eduask" id="eduAsk" role="dialog" aria-label="Confirmar a rede"><span>Você está conectado ao <b>eduroam</b>?</span><button type="button" class="copy primary" data-edu="1">Sim</button><button type="button" class="copy" data-edu="0">Não</button><button type="button" class="copy" data-edu="">Não sei</button></div>');
}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-edu]');if(!b)return;NET.asked=true;NET.ask=b.dataset.edu==='1'?true:b.dataset.edu==='0'?false:null;
  var ipx=NET.last&&NET.last.ip;if(ipx&&NET.ask!==null){eduRememberLocal(ipx,NET.ask);if(GESTOR===true&&gcan('wifi'))eduSaveG(ipx,NET.ask);NET.last.edu=NET.ask}var a=$('#eduAsk');if(a)a.remove();gToast('Obrigado! Isso melhora o mapa de cobertura.')});
function covLoop(){
  clearTimeout(NET.timer);if(!covCanCollect())return;
  if(!document.hidden&&Date.now()-COVCOL.last>5*60000)covMeasure(false);
  NET.timer=setTimeout(covLoop,60000);
}
document.addEventListener('visibilitychange',function(){if(!document.hidden)covLoop()});
/* ---------- leitura das medições reais para o mapa ---------- */
function covLoadReal(){
  if(!FBMODE||!SH.db||COV.loadingReal)return;COV.loadingReal=true;
  var since=Date.now()-30*864e5,q=SH.db.collection('medicoes');
  (q.where?q.where('t','>=',since).limit(5000):q).get().then(function(s){
    COV.real=s.docs.map(function(d){var x=d.data()||{};return {p:[+x.x,+x.y],ok:!!x.ok,mb:+x.mb||0,t:+x.t||0,edu:x.edu}}).filter(function(m){return isFinite(m.p[0])&&isFinite(m.p[1])&&m.t>=since});
    COV.loadingReal=false;COV.samples=null;drawCov();covPaintCard();
  },function(){COV.loadingReal=false;COV.real=[]});
}
/* medições reais dos alunos, quando há; senão, o exemplo */
function covSamples(){if(FBMODE&&COV.real&&COV.real.length&&!COV.demo)return COV.real;return covSamplesExemplo()}
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('#covNow')){covMeasure(true);return}
  if(e.target.closest&&e.target.closest('#covJoin')){$('#tab-cfg').click();setTimeout(function(){var el=$('#netsec');if(el)el.scrollIntoView({block:'center'})},250)}
});
/* ---------- Ajustes › Rede e cobertura ---------- */
function netSecHTML(){
  var can=FBMODE&&ON_SITE;
  return '<div class="netsec" id="netsec"><div><p class="eyebrow">Ajustes</p><h2>Rede e Wi-Fi</h2></div>'+
    '<div class="tgls">'+tg('cfgCovShare',CFG.covShare&&can,'Ajudar a mapear o Wi-Fi','Com o app aberto no campus, a cada 5 minutos o app mede a rede da UFRJ e a velocidade e envia junto com a área aproximada (30 m). Não envia quem você é, seu endereço de internet nem sua posição exata. Usa cerca de 100 KB por medição.')+'</div>'+
    (can?'':'<p class="muted small">A coleta funciona no site do app (GitHub), com login. No claude.ai o navegador bloqueia a localização e a consulta da rede.</p>')+
    (CFG.covShare&&can?'<p class="small" id="covStat">'+esc(COVCOL.msg||'Esperando a próxima medição.')+(COVCOL.sent?' · '+COVCOL.sent+' enviada(s) nesta visita':'')+'</p>':'')+
    '<div class="gbtns"><button type="button" class="copy" id="netTest">Testar minha conexão</button></div><div id="netRes">'+netHTML(NET.last,false)+'</div></div>';
}
aoFazer('ajustes montados',function(f){var R=$('#cfgR');if(!R||R.querySelector('#netsec'))return;var tg2=R.querySelectorAll('.tgls')[0];
  var box=document.createElement('div');box.innerHTML=netSecHTML();if(tg2&&tg2.nextSibling)R.insertBefore(box.firstChild,tg2.nextSibling);else R.appendChild(box.firstChild);
  var cb=$('#cfgCovShare');if(cb){if(!(FBMODE&&ON_SITE))cb.disabled=true;cb.addEventListener('change',function(){
    if(cb.checked&&FBMODE&&!SH.uid){cb.checked=false;gToast('Entre com Google ou e-mail para ajudar a mapear.',1);return}
    CFG.covShare=cb.checked;saveCfg();if(cb.checked){gToast('Obrigado! O app vai medir a rede enquanto estiver aberto no campus.');COVCOL.last=0;covLoop()}else clearTimeout(NET.timer);renderCfgKeep()})}});
function renderCfgKeep(){var y=$('#pane-cfg .cfgsheet');var t=y?y.scrollTop:0;renderCfg();if(y)y.scrollTop=t}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#netTest,#gNetTest');if(!b)return;
  var full=b.id==='gNetTest',out=full?$('#gNetRes'):$('#netRes');b.disabled=true;b.textContent='Testando…';
  netCheck().then(function(r){b.disabled=false;b.textContent=full?'Medir de novo':'Testar de novo';if(out)out.innerHTML=netHTML(r,full)+(full?eduMarkHTML(r):'')})});
/* ---------- Gestão › Rede ---------- */
GTABS.push(['rede','Rede e Wi-Fi']);TAB_PERM.rede='wifi';
var GNET={n:null};
function gRede(){
  var R=GST.redes||{},n=GNET.n;
  if(FBMODE&&SH.db&&n===null){GNET.n=-1;SH.db.collection('medicoes').get().then(function(s){GNET.n=s.docs.length;GNET.docs=s.docs;if(gTab==='rede')renderGest()},function(){GNET.n=0})}
  return '<h3 class="gh">Diagnóstico da rede</h3><p class="muted small">Mostra o endereço de internet e o tipo de conexão deste aparelho. Use no campus, conectado ao eduroam e a outras redes da UFRJ, e anote os endereços para descobrir a faixa de cada rede.</p>'+
    '<div class="gbtns"><button type="button" class="copy primary" id="gNetTest">Medir agora</button></div><div id="gNetRes">'+netHTML(NET.last,true)+'</div>'+
    '<h3 class="gh">Faixas de endereço</h3><form class="gform" data-gform="redes">'+
    '<label class="gf">Faixas extras da UFRJ<input type="text" id="gRu" class="mono" value="'+esc(R.ufrj||'')+'" placeholder="Ex.: 200.20.10.0/24"></label><p class="muted small">A faixa 146.164.0.0/16 já vale sempre.</p>'+
    '<label class="gf">Faixa do eduroam<input type="text" id="gRe" class="mono" value="'+esc(R.eduroam||'')+'" placeholder="Ex.: 146.164.200.0/22"></label><p class="muted small">Com a faixa preenchida, o app diferencia o eduroam das outras redes da UFRJ. Sem ela, mostra "Rede da UFRJ" e pergunta ao aluno.</p>'+
    '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar faixas</button></div></form>'+eduListHTML()+
    '<h3 class="gh">Medições dos alunos</h3>'+(FBMODE?'<p class="small">'+(n===null||n<0?'Carregando…':n+' medição(ões) guardadas.')+'</p><div class="gbtns"><button type="button" class="copy danger" id="gNetOld">Apagar medições com mais de 30 dias</button></div>':'<p class="muted small">As medições ficam no Firebase, no site do app. Aqui no claude.ai o mapa usa dados de exemplo.</p>');
}
function eduListHTML(){
  var m=(GST.redes||{}).eduIps||{},k=Object.keys(m);
  return '<h3 class="gh">Endereços confirmados</h3>'+(k.length?'<div class="glist">'+k.map(function(ip){return '<div class="gcard"><div class="grow2"><span class="grow"><b class="mono">'+esc(ip)+'</b><small>'+(m[ip]?'eduroam':'Outra rede da UFRJ')+'</small></span><button type="button" class="copy" data-edudel="'+esc(ip)+'">Remover</button></div></div>'}).join('')+'</div>'
    :'<p class="muted small">Nenhum ainda. Meça a rede acima, no campus, e toque em "É o eduroam" ou "É outra rede da UFRJ". O app deixa de perguntar aos alunos nesses endereços.</p>');
}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-edudel]');if(!b)return;var R=clone(GST.redes||{});R.eduIps=Object.assign({},R.eduIps||{});delete R.eduIps[b.dataset.edudel];saveG('redes',R)});
aoFazer('gestão montada',function(){if(gTab==='rede'&&$('#gBody')){$('#gBody').innerHTML=gRede();var o=$('#gNetRes');if(o&&NET.last)o.insertAdjacentHTML('beforeend',eduMarkHTML(NET.last))}});
document.addEventListener('submit',function(e){var f=e.target.closest&&e.target.closest('form[data-gform="redes"]');if(!f)return;e.preventDefault();e.stopPropagation();
  var u=$('#gRu').value.trim(),ed=$('#gRe').value.trim(),bad=[u,ed].join(' ').split(/[\s,;]+/).filter(function(x){return x&&!/^\d+\.\d+\.\d+\.\d+(\/\d+)?$/.test(x)});
  if(bad.length){$('#gErr').textContent='Formato inválido: '+bad[0]+'. Use como 146.164.0.0/16.';return}
  saveG('redes',Object.assign(clone(GST.redes||{}),{ufrj:cidrList(u).join(' '),eduroam:cidrList(ed).join(' ')}));
},true);
document.addEventListener('click',function(e){if(!(e.target.closest&&e.target.closest('#gNetOld'))||!GNET.docs)return;
  var lim=Date.now()-30*864e5,old=GNET.docs.filter(function(d){return (+(d.data()||{}).t||0)<lim});if(!old.length){gToast('Nenhuma medição antiga.');return}
  var b=SH.db.batch();old.slice(0,450).forEach(function(d){b.delete(SH.db.doc('medicoes/'+d.id))});
  b.commit().then(function(){gToast(old.length+' medição(ões) apagadas.');GNET.n=null;renderGest()},function(){gToast('Não deu para apagar. Você precisa do privilégio Redes Wi-Fi.',1)})});
/* ======================= Wi-Fi num botão só: pontos e cobertura no mesmo menu ======================= */
function wifiChip(){var c=$('#chWifi');if(!c)return;var on=!!(state.layers.wifi||COV.on);c.setAttribute('aria-pressed',String(on));c.setAttribute('aria-expanded',String(!!$('#wifiMenu')&&!$('#wifiMenu').hidden))}
(function(){
  var c=$('#chWifi');if(!c)return;
  c.setAttribute('aria-haspopup','true');c.setAttribute('aria-controls','wifiMenu');
  c.insertAdjacentHTML('beforeend','<svg class="chev2" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>');
  document.body.insertAdjacentHTML('beforeend','<div class="wifimenu" id="wifiMenu" role="menu" aria-label="Camadas de Wi-Fi" hidden></div>');
  var m=$('#wifiMenu');
  function paint(){
    m.innerHTML='<p class="wm-t">Wi-Fi no mapa</p>'+
      '<label class="wm-i" role="menuitemcheckbox" aria-checked="'+!!state.layers.wifi+'"><span class="cov-sw" style="background:var(--wifi)"></span><span class="grow"><b>Pontos de Wi-Fi</b><small>Redes abertas e eduroam, com as notas dos alunos</small></span><input type="checkbox" id="wmPts"'+(state.layers.wifi?' checked':'')+'></label>'+
      '<label class="wm-i" role="menuitemcheckbox" aria-checked="'+!!COV.on+'"><span class="cov-sw" style="background:'+COV_C[2]+'"></span><span class="grow"><b>Cobertura medida</b><small>Onde a rede da UFRJ funciona e com que velocidade</small></span><input type="checkbox" id="wmCov"'+(COV.on?' checked':'')+'></label>';
  }
  function place(){var r=c.getBoundingClientRect(),w=Math.min(300,innerWidth-24),x=Math.max(12,Math.min(r.left,innerWidth-w-12));m.style.width=w+'px';m.style.left=x+'px';m.style.top=(r.bottom+8)+'px'}
  function open(o){if(o){paint();place();m.hidden=false;var f=m.querySelector('input');if(f)f.focus({preventScroll:true})}else m.hidden=true;wifiChip()}
  c.addEventListener('click',function(e){e.stopImmediatePropagation();e.preventDefault();open(m.hidden)},true);
  m.addEventListener('change',function(e){
    if(e.target.id==='wmPts')setLayer('wifi',c);
    if(e.target.id==='wmCov')covSet(e.target.checked);
    paint();wifiChip();
  });
  document.addEventListener('click',function(e){if(!m.hidden&&!m.contains(e.target)&&!c.contains(e.target))open(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!m.hidden){open(false);c.focus()}});
  window.addEventListener('resize',function(){if(!m.hidden)place()});
  window.addEventListener('scroll',function(){if(!m.hidden)place()},{passive:true});
  wifiChip();
})();
/* mapa vetorial: some durante o arrasto e o zoom (redesenhar 700 KB de traços a cada quadro trava) e volta quando a mão para */
var vecHideT=0;
aoFazer('vista aplicada',function(){var e=$('#imgVec');if(!e||!vecOn)return;
  if(perfEff()==='leve'){e.style.display='none';return}
  e.style.display='none';clearTimeout(vecHideT);vecHideT=setTimeout(function(){var v=$('#imgVec');if(v&&perfEff()!=='leve')v.style.display=''},260)});
/* ---------- desempenho: pausa a animação das rotas quando ninguém está vendo ---------- */
(function(){
  var mw=document.querySelector('.mapwrap'),vis=true;
  function sync(){
    var ov=['#cover','#login','#pane-cfg','#glossM','#gestM','#reqM'].some(function(s){var e=$(s);return e&&!e.hidden});
    svg.classList.toggle('paused',!vis||ov||document.hidden);
  }
  if(mw&&'IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;sync()},{rootMargin:'80px'}).observe(mw);
  document.addEventListener('visibilitychange',sync);
  if('MutationObserver' in window){var mo=new MutationObserver(sync);['#cover','#login','#pane-cfg','#glossM'].forEach(function(s){var e=$(s);if(e)mo.observe(e,{attributes:true,attributeFilter:['hidden']})})}
  sync();
  /* HD em telas de alta densidade: baixa depois que a página assentou */
  var idle=window.requestIdleCallback||function(f){return setTimeout(f,1500)};
  if(!LITE)idle(function(){applyView()},{timeout:3000});
})();
drawBanner();
/* ---------- modo enxuto: menos texto na tela (detalhes ficam em 'Sobre' e na legenda) ---------- */
document.documentElement.dataset.density='compact';
$('#legBtn').addEventListener('click',function(){var l=$('#legend'),o=!l.classList.contains('open');l.classList.toggle('open',o);this.setAttribute('aria-expanded',String(o))});
/* ---------- capa translúcida ---------- */
var cover=$('#cover');
function coverToday(){
  var el=$('#cvToday'),t=today0(),m=mudancas().filter(function(x){var n=dDiff(dParse(x.d),t);return n>=0&&n<=7})[0];
  if(m&&CFG.coverToday){var n=dDiff(dParse(m.d),t);el.textContent=(n===0?'Hoje':n===1?'Amanhã':dTxt(m.d))+': '+(MUD_K[m.k]||'Mudança').toLowerCase()+' · '+m.t;el.hidden=false}else el.hidden=true;
}
function placeCoverMap(){
  var m=$('#cvMap'),pin=$('#cvPin');if(!m||!window.MAPHD_URL)return;
  var W=m.clientWidth,H=m.clientHeight,sh=document.querySelector('.cv-sheet'),sheetH=sh?sh.offsetHeight:0,wide=W>=700;
  var st=cover.dataset.style||'folha';
  var visH=st!=='folha'?H:(wide?H-sheetH-28:H-sheetH+30);
  // mapa nítido (campus) sobre o mapa estendido (bordas prolongadas), que garante tela cheia
  var s=wide?Math.max(1.2*W/1233,H/1300*1.02):Math.max(H/1300*1.02,visH/701*1.35,W/1233*2.4);
  var tx=814,ty=412,ox=W/2-tx*s,oy=visH*0.45-ty*s;
  var ex=-270,ey=-340,ew=2034*s,eh=1300*s;
  ox=Math.min(-ex*s,Math.max(W-(ex+2034)*s,ox));oy=Math.min(-ey*s,Math.max(H-(ey+1300)*s,oy));
  m.style.backgroundImage='url('+window.MAPHD_URL+'),url('+MAPIMG+')';
  m.style.backgroundSize=(1233*s)+'px '+(701*s)+'px,'+ew+'px '+eh+'px';
  m.style.backgroundPosition=(ox+109*s)+'px '+(oy+(-45)*s)+'px,'+(ox+ex*s)+'px '+(oy+ey*s)+'px';
  pin.style.left=(ox+tx*s)+'px';pin.style.top=(oy+ty*s)+'px';
}
window.addEventListener('resize',function(){if(!cover.hidden)placeCoverMap()});
function cvEnter(){cover.classList.remove('enter','pre');void cover.offsetWidth;cover.classList.add('enter')}
function openCover(){coverToday();cover.hidden=false;cover.classList.remove('closing');placeCoverMap();cvEnter();document.documentElement.style.overflow='hidden';var b=cover.querySelector('.cv-btn.main');if(b)b.focus({preventScroll:true})}
function closeCover(then){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  cover.classList.add('closing');
  setTimeout(function(){cover.hidden=true;cover.classList.remove('enter');cover.classList.add('pre');document.documentElement.style.overflow='';if(then)then()},rm?0:420);
}
cover.addEventListener('click',function(e){
  var b=e.target.closest('[data-cv]');
  if(!b&&e.target.closest('a,button,input,select,textarea,summary,label,[role="button"]'))return;
  var a=b?b.dataset.cv:'mapa';
  closeCover(function(){
    if(a==='trajeto'){setTab('trajeto');try{history.replaceState(null,'','#trajeto')}catch(err){}var s=$('#to');if(s){s.scrollIntoView({block:'center'});s.focus()}}
    else if(a==='grade'||a==='cal'){setTab(a);try{history.replaceState(null,'','#'+a)}catch(err){}var pn=$('#pane-'+a);if(pn)pn.scrollIntoView({block:'start'})}
    else if(a==='noite'){openNight()}
    else{var mc=document.querySelector('.mapcard');if(mc)mc.scrollIntoView({block:'start'})}
    if(a!=='trajeto'&&a!=='noite'){var t=$('#tab-'+(a==='mapa'?'trajeto':a));if(a==='mapa'){var z=$('#zin');if(z)z.focus({preventScroll:true})}else if(t)t.focus({preventScroll:true})}
  });
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!cover.hidden&&login.hidden)closeCover()});
$('#showCover').addEventListener('click',openCover);$('#coverBtn').addEventListener('click',openCover);
applyCoverStyle();applyBg();
if(CFG.cover==='none'){cover.hidden=true}else{coverToday();placeCoverMap();document.documentElement.style.overflow='hidden';}
/* ---------- login: perfil salvo (protótipo; guardado só neste aparelho) ---------- */
var PERFIL=null;try{PERFIL=JSON.parse(localStorage.getItem('cse-perfil'))}catch(e){}
if(PERFIL&&!PERFIL.name)PERFIL=null;
function pinHash(s){var x=5381;for(var i=0;i<s.length;i++)x=((x<<5)+x+s.charCodeAt(i))|0;return 'h'+(x>>>0).toString(36)}
function savePerfil(){try{if(PERFIL)localStorage.setItem('cse-perfil',JSON.stringify(PERFIL));else localStorage.removeItem('cse-perfil')}catch(e){}document.documentElement.classList.toggle('noprof',!PERFIL);setTimeout(paintFaces,0)}
document.documentElement.classList.toggle('noprof',!PERFIL);
var login=$('#login');
function lgShow(which){
  var m=$('#lgMail');if(m)m.hidden=which!=='mail';
  if(which==='mail'){/* entrar com e-mail e senha */
    $('#lgSaved').hidden=true;$('#lgNew').hidden=true;mailMode(MAIL.mode);
    setTimeout(function(){var f=MAIL.mode==='up'?$('#lgMailNome'):$('#lgMailEmail');if(f)f.focus({preventScroll:true})},50);
    return;
  }
  $('#lgSaved').hidden=which!=='saved';$('#lgNew').hidden=which!=='new';
  if(which==='saved'){$('#lgInit').textContent=PERFIL.name.charAt(0).toUpperCase();$('#lgName').textContent=PERFIL.name;
    lgBioState();$('#lgPinForm').hidden=true;$('#lgUsePin').hidden=!PERFIL.pin;$('#lgPin').value='';$('#lgPinErr').textContent='';
    setTimeout(function(){$('#lgBio').focus({preventScroll:true})},50);paintFaces()}
  else{$('#lgNewErr').textContent='';bioCheck().then(function(v){$('#lgNewBioW').hidden=!v});setTimeout(function(){$('#lgNewName').focus({preventScroll:true})},50)}
}
function openLogin(){
  var bg=login.querySelector('.lg-bg');if(bg&&window.MAPHD_URL)bg.style.backgroundImage='url('+window.MAPHD_URL+')';
  login.hidden=false;login.classList.remove('closing');document.documentElement.style.overflow='hidden';
  lgShow(PERFIL?'saved':'new');
}
function closeLogin(){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;login.classList.add('closing');if(!cover.hidden)setTimeout(cvEnter,rm?0:120);
  setTimeout(function(){login.hidden=true;if(cover.hidden)document.documentElement.style.overflow='';else{var b=cover.querySelector('.cv-btn.main');if(b)b.focus({preventScroll:true})}},rm?0:300);
  if(!$('#pane-cfg').hidden)renderCfg();setTimeout(function(){refreshAll();if(!pPane.hidden)renderPredios()},0);}
$('#lgBio').addEventListener('click',function(){bioLogin()});
$('#lgUsePin').addEventListener('click',function(){this.hidden=true;$('#lgPinForm').hidden=false;$('#lgPin').focus()});
$('#lgPinForm').addEventListener('submit',function(e){e.preventDefault();
  if(pinHash($('#lgPin').value)===PERFIL.pin)closeLogin();else{$('#lgPinErr').textContent='Código errado. Tente de novo.';$('#lgPin').value='';$('#lgPin').focus()}});
$('#lgSwitch').addEventListener('click',function(){PERFIL=null;savePerfil();lgShow('new')});
$('#lgNew').addEventListener('submit',function(e){e.preventDefault();
  var n=$('#lgNewName').value.trim(),pn=$('#lgNewPin').value.trim(),er=$('#lgNewErr');
  if(!n){er.textContent='Escreva um nome.';$('#lgNewName').focus();return}
  if(pn&&!/^\d{4}$/.test(pn)){er.textContent='O código precisa ter 4 números.';$('#lgNewPin').focus();return}
  PERFIL={name:n.slice(0,24),pin:pn?pinHash(pn):null};savePerfil();
  var wantBio=!$('#lgNewBioW').hidden&&$('#lgNewBio').checked,go=$('#lgNewGo');
  if(!wantBio){lgShow('saved');$('#lgHint').textContent='Perfil criado. Toque para entrar.';return}
  go.disabled=true;go.textContent='Confirme no aparelho…';er.textContent='';
  bioCreate(PERFIL.name).then(function(bio){PERFIL.bio=bio;savePerfil();go.disabled=false;go.textContent='Criar perfil e entrar';lgShow('saved');$('#lgHint').textContent='Perfil criado com biometria. Toque para entrar.'},
    function(err){go.disabled=false;go.textContent='Criar perfil e entrar';lgShow('saved');$('#lgHint').textContent='Perfil criado sem biometria. '+bioErrMsg(err)});
});
$('#lgSkip').addEventListener('click',closeLogin);
/* sair: fecha a sessão (e a conta Google ou de e-mail, no site) e volta para a tela de entrada; o perfil continua salvo */
function logoutAll(){
  var go=function(){if(!cfgM.hidden)renderCfg();openLogin();gToast('Você saiu. Para voltar, entre de novo.')};
  if(FBMODE&&ACC.kind==='google'&&ACC.fb){var keep=PERFIL&&!PERFIL.google?PERFIL:null;if(keep)delete keep.photo;
    ACC.fb.auth.signOut().then(function(){if(PERFIL&&PERFIL.google){PERFIL=keep;savePerfil()}go()},function(){gToast('Não deu para sair da conta agora.',1)});return}
  go();
}
document.addEventListener('click',function(e){
  if(e.target.closest('#cfgLogout')){logoutAll();return}
  if(e.target.closest('#cfgForget')){var fb=FBMODE&&ACC.kind==='google'&&ACC.fb;PERFIL=null;savePerfil();
    (fb?ACC.fb.auth.signOut():Promise.resolve()).then(function(){renderCfg();openLogin();gToast('Perfil apagado deste aparelho.')})}
});
/* ======================= biometria de verdade (WebAuthn) ======================= */
/* Usa o autenticador do próprio aparelho (Face ID, Touch ID, digital, Windows Hello).
   A biometria nunca sai do aparelho: o app só guarda o id da credencial e a chave pública,
   e confere a assinatura de cada entrada com WebCrypto. */
var BIO={avail:null,busy:false};
function b64u(buf){var b=new Uint8Array(buf),s='';for(var i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function ub64u(s){s=String(s).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var bin=atob(s),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
function derToRaw(der){/* assinatura ECDSA em DER -> r||s com 32 bytes cada */
  var o=2;if(der[1]&0x80)o=2+(der[1]&0x7f);
  function int(){if(der[o]!==2)throw new Error('der');var l=der[o+1],v=der.slice(o+2,o+2+l);o+=2+l;while(v.length>32&&v[0]===0)v=v.slice(1);var p=new Uint8Array(32);p.set(v,32-v.length);return p}
  var r=int(),s=int(),out=new Uint8Array(64);out.set(r,0);out.set(s,32);return out}
function bioCheck(){
  if(BIO.avail!==null)return Promise.resolve(BIO.avail);
  if(!window.PublicKeyCredential||!window.isSecureContext||!navigator.credentials||!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)return Promise.resolve(BIO.avail=false);
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(function(v){return BIO.avail=!!v},function(){return BIO.avail=false});
}
function bioErrMsg(e){
  var inClaude=!!(window.claude&&typeof window.claude.use==='function'),n=e&&e.name||'';
  if(n==='NotAllowedError')return inClaude?'A biometria foi cancelada ou não está liberada dentro do claude.ai. No site do GitHub ela funciona.':'Biometria cancelada ou não reconhecida.';
  if(n==='SecurityError')return 'A biometria só funciona em endereço seguro (https).';
  if(n==='InvalidStateError')return 'Este aparelho já tem uma biometria cadastrada para este app.';
  if(n==='NotSupportedError')return 'Este aparelho não oferece biometria para sites.';
  return 'Não deu para usar a biometria agora.';
}
function bioCreate(name){
  var ch=crypto.getRandomValues(new Uint8Array(32)),uid=crypto.getRandomValues(new Uint8Array(16));
  return navigator.credentials.create({publicKey:{challenge:ch,rp:{name:'Chega aí UFRJ'},user:{id:uid,name:name,displayName:name},
    pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
    authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged',requireResidentKey:false},
    timeout:60000,attestation:'none'}}).then(function(c){
      var r=c.response,pk=null,alg=-7;
      try{pk=r.getPublicKey?r.getPublicKey():null;alg=r.getPublicKeyAlgorithm?r.getPublicKeyAlgorithm():-7}catch(e){}
      return {id:b64u(c.rawId),pk:pk?b64u(pk):null,alg:alg,ts:Date.now()};
    });
}
function bioVerify(bio){
  var ch=crypto.getRandomValues(new Uint8Array(32));
  return navigator.credentials.get({publicKey:{challenge:ch,allowCredentials:[{type:'public-key',id:ub64u(bio.id),transports:['internal','hybrid']}],userVerification:'required',timeout:60000}}).then(function(a){
    var r=a.response,cd=JSON.parse(new TextDecoder().decode(r.clientDataJSON)),ad=new Uint8Array(r.authenticatorData);
    if(cd.type!=='webauthn.get'||cd.challenge!==b64u(ch)||cd.origin!==location.origin)throw new Error('desafio');
    if(!(ad[32]&0x04))throw new Error('sem verificação do usuário');
    if(!bio.pk)return true;
    var rsa=bio.alg===-257;
    return crypto.subtle.digest('SHA-256',r.clientDataJSON).then(function(h){
      var data=new Uint8Array(ad.length+32);data.set(ad,0);data.set(new Uint8Array(h),ad.length);
      return crypto.subtle.importKey('spki',ub64u(bio.pk),rsa?{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}:{name:'ECDSA',namedCurve:'P-256'},false,['verify']).then(function(k){
        var sig=new Uint8Array(r.signature);if(!rsa)sig=derToRaw(sig);
        return crypto.subtle.verify(rsa?{name:'RSASSA-PKCS1-v1_5'}:{name:'ECDSA',hash:'SHA-256'},k,sig,data)});
    }).then(function(ok){if(!ok)throw new Error('assinatura');return true});
  });
}
/* tela de entrada */
function lgBioState(){
  var b=$('#lgBio'),hint=$('#lgHint'),act=$('#lgBioOn');if(!b||!PERFIL)return;
  b.className='lg-bio'+(PERFIL.bio?'':' nobio');
  b.setAttribute('aria-label',PERFIL.bio?'Entrar com a biometria do aparelho':'Entrar');
  hint.textContent=PERFIL.bio?'Toque para entrar com a biometria do aparelho':'Toque para entrar';
  if(act)bioCheck().then(function(v){act.hidden=!(v&&!PERFIL.bio)});
}
function bioLogin(){
  var b=$('#lgBio');if(BIO.busy||b.classList.contains('ok'))return;
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function ok(){b.classList.remove('scan','fail');b.classList.add('ok');$('#lgHint').textContent='Pronto, '+PERFIL.name+'!';setTimeout(closeLogin,rm?200:550)}
  if(!PERFIL.bio){ok();return}
  BIO.busy=true;b.classList.remove('fail');b.classList.add('scan','wait');$('#lgHint').textContent='Confirme no aparelho…';
  bioVerify(PERFIL.bio).then(function(){BIO.busy=false;b.classList.remove('wait');ok()},function(e){
    BIO.busy=false;b.classList.remove('scan','wait');b.classList.add('fail');
    $('#lgHint').textContent=(e&&e.name?bioErrMsg(e):'Não reconheci.')+(PERFIL.pin?' Você também pode usar o código.':'');
    if(PERFIL.pin)$('#lgUsePin').hidden=false;
  });
}
function bioEnable(btn,done){
  if(!PERFIL)return;btn.disabled=true;var t=btn.textContent;btn.textContent='Confirme no aparelho…';
  bioCreate(PERFIL.name).then(function(bio){PERFIL.bio=bio;savePerfil();btn.disabled=false;btn.textContent=t;gToast('Biometria ativada neste aparelho.');if(done)done(true)},
    function(e){btn.disabled=false;btn.textContent=t;gToast(bioErrMsg(e),1);if(done)done(false)});
}
/* perfil em Ajustes: estado da biometria */
aoFazer('ajustes montados',function(f){var p=document.querySelector('#cfgR .prof');if(!p||!PERFIL||document.getElementById('cfgBioRow'))return;
  p.insertAdjacentHTML('afterend','<div class="biorow" id="cfgBioRow"><span class="grow"><b>Biometria</b><small>'+(PERFIL.bio?'Ativada neste aparelho. O rosto ou a digital nunca saem do celular.':'Desativada. Entre com o rosto ou a digital do aparelho.')+'</small></span>'+
    (PERFIL.bio?'<button type="button" class="copy" id="cfgBioOff">Desativar</button>':'<button type="button" class="copy" id="cfgBioOnBtn" hidden>Ativar</button>')+'</div>');
  if(!PERFIL.bio)bioCheck().then(function(v){var b=$('#cfgBioOnBtn');if(b)b.hidden=!v;if(!v){var s=document.querySelector('#cfgBioRow small');if(s)s.textContent='Este aparelho ou navegador não oferece biometria para sites.'}});
});
document.addEventListener('click',function(e){
  if(e.target.closest('#cfgBioOff')){delete PERFIL.bio;savePerfil();renderCfg();gToast('Biometria desativada neste aparelho.');return}
  var on=e.target.closest('#cfgBioOnBtn');if(on){bioEnable(on,function(){renderCfg()});return}
  var la=e.target.closest('#lgBioOn');if(la){bioEnable(la,function(ok){if(ok)lgBioState()})}
});
/* ======================= só quem tem perfil informa ======================= */
function needProfileHTML(acao){
  return '<div class="needprof"><p class="small"><b>Crie seu perfil para '+acao+'.</b> <span class="aux">Sem perfil, o app só mostra as informações.</span></p><button type="button" class="copy" data-needprof>Criar perfil</button></div>';
}
document.addEventListener('click',function(e){if(e.target.closest('[data-needprof]')){e.preventDefault();openLogin();if(!PERFIL)lgShow('new')}});
refreshAll();
if(CFG.login)openLogin();
if(!cover.hidden&&login.hidden)requestAnimationFrame(function(){cvEnter()});
if('MutationObserver' in window)new MutationObserver(function(){if(login.hidden&&!cover.hidden&&cover.classList.contains('pre'))cvEnter()}).observe(login,{attributes:true,attributeFilter:['hidden']});
setTimeout(function(){if(login.hidden&&!cover.hidden&&cover.classList.contains('pre'))cvEnter()},1500);
$('#rosebox').innerHTML='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,NORTH+ROT)+'</svg>';
/* o mapa base fica sempre sólido (o controle de transparência saiu; no lugar dele fica "Buscar ônibus") */
renderAll();
/* Liquid Glass: brilho segue o ponteiro; refração só em navegadores Chromium */
try{if(LITE===false&&perfEff()==='completo'&&navigator.userAgentData&&navigator.userAgentData.brands&&navigator.userAgentData.brands.some(function(b){return /Chromium/.test(b.brand)}))document.documentElement.classList.add('refract')}catch(e){}
document.addEventListener('pointermove',function(e){
  var el=e.target.closest&&e.target.closest('.chip,.item,.swap,.scale button,.copy,.seg button,.zoomctl button,.cv-btn');
  if(!el)return;var r=el.getBoundingClientRect();
  el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px');
},{passive:true});
/* no toque também: o brilho nasce onde o dedo encosta */
document.addEventListener('pointerdown',function(e){var el=e.target.closest&&e.target.closest('.cv-btn');if(!el)return;var r=el.getBoundingClientRect();
  el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px');
  el.classList.remove('tap');void el.offsetWidth;el.classList.add('tap');setTimeout(function(){el.classList.remove('tap')},650)},{passive:true});
/* ======================= v10: modo simplificado, abas, bússola, destino pelo mapa e tempo ======================= */
/* ---------- 1. modo simplificado: esconde as linhas de apoio ---------- */
CFG.simples=CFG.simples===true;
function applySimples(){document.documentElement.classList.toggle('simples',!!CFG.simples)}
applySimples();
/* ---------- 2. ordem e visibilidade das abas ---------- */
var CV_OF={trajeto:'trajeto',grade:'grade',cal:'cal'};
function tabOrder(){
  var o=Array.isArray(CFG.tabs)?CFG.tabs.filter(function(t){return TABID.indexOf(t)>=0}):[];
  TABID.forEach(function(t){if(o.indexOf(t)<0)o.push(t)});
  return o;
}
function tabOff(){var f=Array.isArray(CFG.tabsOff)?CFG.tabsOff.filter(function(t){return TABID.indexOf(t)>=0}):[];
  return f.length>=TABID.length?f.slice(0,TABID.length-1):f}            /* nunca esconde todas */
function tabOn(t){return tabOff().indexOf(t)<0}
function tabVis(){return tabOrder().filter(tabOn)}
function applyTabs(){
  var bar=document.querySelector('.tabs');if(!bar)return;
  tabOrder().forEach(function(t){var b=$('#tab-'+t);if(b)bar.appendChild(b)});        /* reordena */
  TABID.forEach(function(t){var b=$('#tab-'+t);if(b)b.hidden=!tabOn(t);
    var cv=CV_OF[t]&&document.querySelector('.cv-row [data-cv="'+CV_OF[t]+'"]');if(cv)cv.hidden=!tabOn(t)});
  var cur=document.querySelector('.tabs [data-tab][aria-selected="true"]');
  if(cur&&cur.hidden)setTab(tabVis()[0]);
}
function tabsCfgHTML(){
  var o=tabOrder(),vis=tabVis().length;
  return '<div><p class="eyebrow">Ajustes</p><h2>Abas do app</h2></div>'+
    '<p class="muted small keep">Use as setas para mudar a ordem. Desligue as que você não usa; pelo menos uma fica.</p>'+
    '<div class="tbord">'+o.map(function(t,i){var on=tabOn(t),nm=TABS[TABID.indexOf(t)];
      return '<div class="tbrow'+(on?'':' off')+'"><span class="grow"><b>'+esc(nm[1])+'</b><small>'+esc(nm[2])+'</small></span>'+
        '<span class="tbbtns"><button type="button" class="copy tbmv" data-tbup="'+t+'"'+(i===0?' disabled':'')+' aria-label="Subir '+esc(nm[1])+'">↑</button>'+
        '<button type="button" class="copy tbmv" data-tbdn="'+t+'"'+(i===o.length-1?' disabled':'')+' aria-label="Descer '+esc(nm[1])+'">↓</button>'+
        '<label class="tbsw"><input type="checkbox" role="switch" data-tbon="'+t+'"'+(on?' checked':'')+(on&&vis<=1?' disabled':'')+'><span class="sw2" aria-hidden="true"></span><span class="tbsw-t">'+(on?'Mostrar':'Escondida')+'</span></label></span></div>'}).join('')+'</div>';
}
function saveTabs(order,off){CFG.tabs=order;CFG.tabsOff=off;saveCfg();applyTabs();renderCfgKeep()}
document.addEventListener('click',function(e){
  var u=e.target.closest('[data-tbup]'),d=e.target.closest('[data-tbdn]');if(!u&&!d)return;
  var t=(u||d).dataset[u?'tbup':'tbdn'],o=tabOrder(),i=o.indexOf(t),j=i+(u?-1:1);
  if(i<0||j<0||j>=o.length)return;
  o.splice(j,0,o.splice(i,1)[0]);saveTabs(o,tabOff());
});
document.addEventListener('change',function(e){
  var c=e.target&&e.target.dataset&&e.target.dataset.tbon;if(!c)return;
  var off=tabOff().filter(function(x){return x!==c});
  if(!e.target.checked)off.push(c);
  if(off.length>=TABID.length)return;
  saveTabs(tabOrder(),off);
});
/* ---------- 3. bússola: apontar para o destino ou para o ponto de partida ---------- */
CFG.bussolaAlvo=CFG.bussolaAlvo==='origem'?'origem':'destino';
/* ---------- 4. ponto escolhido no mapa vira o destino ---------- */
CFG.autoDest=CFG.autoDest!==false;
function stopNear(p){var n=nearestOf(STOPS,p,function(s){return s.off});return n&&n.id}
function pointStop(kind,id){
  if(kind==='stop')return STOPS[id]?id:null;
  var o=kind==='wifi'?WIFI[id]:kind==='svc'?SVCMAP[id]:kind==='place'?PL[id]:null;
  return o&&o.p?stopNear(o.p):null;
}
/* ---------- 5. previsão do tempo da Ilha do Fundão (Open-Meteo, sem cadastro) ---------- */
CFG.clima=CFG.clima!==false;CFG.chuva=CFG.chuva!==false;
var CLIMA={d:null,busy:false,err:false,t:0};
var CLIMA_URL='https://api.open-meteo.com/v1/forecast?latitude=-22.86&longitude=-43.23&timezone=America%2FSao_Paulo&forecast_days=1&current=temperature_2m,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=precipitation_probability';
var WMO={0:['Céu limpo','sol'],1:['Poucas nuvens','sol'],2:['Parcialmente nublado','nuvem'],3:['Nublado','nuvem'],45:['Névoa','nuvem'],48:['Névoa gelada','nuvem'],
  51:['Garoa fraca','chuva'],53:['Garoa','chuva'],55:['Garoa forte','chuva'],61:['Chuva fraca','chuva'],63:['Chuva','chuva'],65:['Chuva forte','chuva'],
  66:['Chuva gelada','chuva'],67:['Chuva gelada forte','chuva'],80:['Pancadas de chuva','chuva'],81:['Pancadas de chuva','chuva'],82:['Pancadas fortes','chuva'],
  95:['Tempestade','tempestade'],96:['Tempestade com granizo','tempestade'],99:['Tempestade com granizo','tempestade']};
function wmo(c){return WMO[c]||['Tempo indefinido','nuvem']}
function climaCache(){try{var c=JSON.parse(localStorage.getItem('cse-clima'));if(c&&Date.now()-c.t<18e5)return c}catch(e){}return null}
function climaLoad(force){
  if(CLIMA.busy||!CFG.clima||!window.fetch)return;
  var c=!force&&climaCache();
  if(c){CLIMA.d=c.d;CLIMA.t=c.t;drawClima();return}
  CLIMA.busy=true;
  var to=setTimeout(function(){CLIMA.busy=false},9000);
  fetch(CLIMA_URL,{cache:'no-store'}).then(function(r){return r.ok?r.json():Promise.reject(0)}).then(function(j){
    clearTimeout(to);CLIMA.busy=false;CLIMA.err=false;
    var dl=j.daily||{},hr=j.hourly||{},cu=j.current||{};
    CLIMA.d={now:cu.temperature_2m,code:(cu.weather_code!=null?cu.weather_code:(dl.weather_code||[])[0]),
      max:(dl.temperature_2m_max||[])[0],min:(dl.temperature_2m_min||[])[0],
      pmax:(dl.precipitation_probability_max||[])[0],hs:hr.time||[],hp:hr.precipitation_probability||[]};
    CLIMA.t=Date.now();
    try{localStorage.setItem('cse-clima',JSON.stringify({t:CLIMA.t,d:CLIMA.d}))}catch(e){}
    drawClima();
  },function(){clearTimeout(to);CLIMA.busy=false;CLIMA.err=true;drawClima()});
}
/* próxima hora com chance alta de chuva, daqui até o fim do dia */
function climaChuva(){
  var d=CLIMA.d;if(!d||!d.hs||!d.hs.length)return null;
  var agora=nowMin(),best=null;
  for(var i=0;i<d.hs.length;i++){
    var hh=+String(d.hs[i]).slice(11,13),p=+d.hp[i];
    if(!(p>=0)||hh*60<agora-30||hh*60>agora+6*60)continue;
    if(p>=60&&(!best||p>best.p))best={h:hh,p:p};
  }
  return best;
}
var CL_NUV='<path d="M10 25a6 6 0 0 1 .7-11.95A8 8 0 0 1 26 12.5 5.5 5.5 0 0 1 25.5 25Z"';
var CL_SVG={
  sol:'<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="7" fill="#FFC15A"/><g stroke="#FFC15A" stroke-width="2.4" stroke-linecap="round"><path d="M18 4v4M18 28v4M4 18h4M28 18h4M8.1 8.1l2.8 2.8M25.1 25.1l2.8 2.8M8.1 27.9l2.8-2.8M25.1 10.9l2.8-2.8"/></g></svg>',
  nuvem:'<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="13" cy="13" r="5" fill="#FFC15A" opacity=".85"/>'+CL_NUV+' transform="translate(1 1)" fill="#DDE5EE"/></svg>',
  chuva:'<svg viewBox="0 0 36 36" aria-hidden="true">'+CL_NUV+' transform="translate(1 -3)" fill="#B7C4D3"/><g stroke="#4FA8FF" stroke-width="2.6" stroke-linecap="round"><path d="M12 25l-2 5M19 25l-2 5M26 25l-2 5"/></g></svg>',
  tempestade:'<svg viewBox="0 0 36 36" aria-hidden="true">'+CL_NUV+' transform="translate(1 -4)" fill="#8D99AB"/><path d="M19.5 20l-5 8h4l-1.5 6 7-9h-4.2l2-5z" fill="#FFC15A"/></svg>'
};
function clIc(k){return '<span class="cl-ic" aria-hidden="true">'+(CL_SVG[k]||CL_SVG.nuvem)+'</span>'}
/* barras de chance de chuva das próximas 12 horas; destaca as que passam de 60% */
function climaBarras(){
  var d=CLIMA.d;if(!d||!d.hs||!d.hs.length)return '';
  var h0=Math.floor(nowMin()/60),o='',n=0;
  for(var i=0;i<d.hs.length&&n<12;i++){
    var hh=+String(d.hs[i]).slice(11,13),p=+d.hp[i];
    if(hh<h0||!(p>=0))continue;
    o+='<i class="'+(p>=60?'hi':'')+'" style="height:'+Math.max(3,Math.round(p*.34))+'px" title="'+String(hh).padStart(2,'0')+'h · '+Math.round(p)+'%"></i>';n++;
  }
  return n>=3?'<span class="cl-bars-t" aria-hidden="true"><span class="cl-bars">'+o+'</span><small>chuva nas próximas horas</small></span>':'';
}
function climaHTML(){
  if(!CFG.clima)return '';
  var d=CLIMA.d;
  if(!d){return CLIMA.err?'<div class="climabox cl-nuvem">'+clIc('nuvem')+'<span class="cl-main"><span class="cl-desc"><b>Previsão indisponível</b><small>Não deu para falar com o serviço de previsão agora.</small></span></span><button type="button" class="linkbtn" id="climaTry">Tentar de novo</button></div>':''}
  var w=wmo(d.code),ch=CFG.chuva?climaChuva():null,t=function(v){return v==null?'—':Math.round(v)+'°'};
  return '<div class="climabox cl-'+w[1]+(ch?' chuva':'')+'">'+
    clIc(w[1])+
    '<span class="cl-main">'+(d.now!=null?'<span class="cl-temp">'+t(d.now)+'</span>':'')+
    '<span class="cl-desc"><b>'+esc(w[0])+'</b>'+
    '<small>Hoje '+t(d.max)+' / '+t(d.min)+(d.pmax!=null?' · '+Math.round(d.pmax)+'% de chance de chuva':'')+'</small></span></span>'+
    climaBarras()+
    (ch?'<span class="cl-alerta"><b>Leve guarda-chuva</b><small>'+ch.p+'% de chuva por volta das '+String(ch.h).padStart(2,'0')+'h</small></span>':'')+
    '</div>';
}
function drawClima(){
  var b=$('#climabar');
  if(!b){var m=$('#mudbar');if(!m)return;m.insertAdjacentHTML('afterend','<div class="climabar" id="climabar" role="status" hidden></div>');b=$('#climabar')}
  var h=climaHTML();b.innerHTML=h;b.hidden=!h;
}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#climaTry')){CLIMA.err=false;climaLoad(true)}});
if(CFG.clima)setTimeout(function(){climaLoad(false)},600);
setInterval(function(){if(CFG.clima&&!document.hidden&&Date.now()-CLIMA.t>18e5)climaLoad(false)},3e5);
document.addEventListener('visibilitychange',function(){if(!document.hidden&&CFG.clima&&Date.now()-CLIMA.t>18e5)climaLoad(false)});
/* ---------- ajustes: as novas opções ---------- */
function v10CfgHTML(){
  return '<div><p class="eyebrow">Ajustes</p><h2>Tela e navegação</h2></div>'+
    '<div class="tgls">'+
    tg('cfgSimples',CFG.simples,'Modo simplificado','Esconde os textos que explicam cada função e as dicas. A legenda do mapa continua.')+'<div class="faixa-w"><p class="balvo-t"><b>Horário dos ônibus</b></p><div class="seg cl-alvo" role="group" aria-label="Como mostrar o horário dos ônibus">'+[[0,'Exato'],[5,'Faixa de 5 min'],[10,'Faixa de 10 min']].map(function(o){return '<button type="button" data-faixa="'+o[0]+'" aria-pressed="'+((+CFG.faixa||0)===o[0])+'">'+o[1]+'</button>'}).join('')+'</div><p class="muted small">Na faixa, o app mostra um intervalo (ex.: entre 07:35 e 07:45) em vez da hora exata, já que o ônibus pode adiantar ou atrasar.</p></div>'+
    tg('cfgAutoDest',CFG.autoDest,'Ponto do mapa vira destino','Ao tocar num ponto do mapa, ele entra como destino em Seu trajeto e a origem passa a ser a parada mais perto de você.')+
    fsCfgHTML()+
    '</div>'+
    '<div><p class="eyebrow">Ajustes</p><h2>Previsão do tempo</h2></div>'+
    '<div class="tgls">'+
    tg('cfgClima',CFG.clima,'Mostrar a previsão do dia','Temperatura de agora, máxima e mínima da Ilha do Fundão, acima do mapa.')+
    tg('cfgChuva',CFG.chuva,'Avisar quando houver chuva','Mostra “leve guarda-chuva” quando a chance passa de 60% nas próximas 6 horas.')+
    '</div>'+
    '<p class="muted small keep">Previsão do Open-Meteo, atualizada a cada 30 minutos.</p>';
}
function bussolaAlvoHTML(){
  return '<p class="balvo-t"><b>A bússola aponta para</b></p>'+
    '<div class="seg cl-alvo" role="group" aria-label="Para onde a bússola aponta">'+
    [['destino','Destino'],['origem','Partida']].map(function(o){
      return '<button type="button" data-balvo="'+o[0]+'" aria-pressed="'+(CFG.bussolaAlvo===o[0])+'">'+o[1]+'</button>'}).join('')+
    '</div><p class="muted small keep">A agulha laranja aponta para o destino ou para o ponto de partida do Seu trajeto.</p>';
}
aoFazer('ajustes montados',function(f){
  var Rr=$('#cfgR');if(!Rr)return;
  if(!Rr.querySelector('#cfgSimples')){
    var first=Rr.querySelector('.tgls');                      /* a escolha da bússola fica junto do mapa */
    if(first)first.insertAdjacentHTML('afterend',bussolaAlvoHTML());
    Rr.insertAdjacentHTML('beforeend',v10CfgHTML()+tabsCfgHTML());
  }
});
document.addEventListener('click',function(e){
  var f=e.target.closest&&e.target.closest('[data-faixa]');if(!f)return;
  CFG.faixa=+f.dataset.faixa||0;saveCfg();renderAll();renderCfgKeep();gToast(CFG.faixa?'Horários em faixas de '+CFG.faixa+' min.':'Horários exatos.');
});
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-balvo]');if(!b)return;
  CFG.bussolaAlvo=b.dataset.balvo;saveCfg();if(typeof cmpSchedule==='function'&&CMP.on)cmpSchedule();renderCfgKeep();
});
document.addEventListener('change',function(e){
  var id=e.target.id,map={cfgSimples:'simples',cfgAutoDest:'autoDest',cfgClima:'clima',cfgChuva:'chuva',cfgTelaCheia:'telaCheia'};
  if(!map[id])return;
  CFG[map[id]]=e.target.checked;saveCfg();
  if(id==='cfgSimples')applySimples();
  if(id==='cfgClima'){if(CFG.clima)climaLoad(false);else drawClima()}
  if(id==='cfgChuva')drawClima();
});
applyTabs();
/* ======================= v11: exigir login para consultar (a gestão liga e desliga) ======================= */
var ACESSO={login:false};
var AUTH_READY=!FBMODE;   /* no site, só decide depois que o Firebase diz se há conta entrada */
try{if(FBMODE&&localStorage.getItem('cse-acesso')==='1')ACESSO.login=true}catch(e){}
function acessoOn(){return FBMODE?ACESSO.login:!!(GST.acesso&&GST.acesso.login===true)}
var AUTH_USER=false,GATE_ON=false;
function autenticado(){return AUTH_USER||ACC.kind==='claude'||GESTOR===true||GESTOR==='demo'}
function gateHTML(){
  return '<div class="acgate" id="acGate" role="dialog" aria-modal="true" aria-labelledby="acGateT" hidden>'+
    '<div class="acgate-card"><span class="acgate-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg></span>'+
    '<h2 id="acGateT">Entre para consultar</h2>'+
    '<p class="muted">A gestão pediu que o mapa, os trajetos e as fotos só apareçam para quem entrou com uma conta.</p>'+
    (FB_ON?'<div class="acgate-b"><button type="button" class="lg-btn pri" data-goo>Entrar com Google</button><button type="button" class="lg-btn sec" data-mail>Entrar com e-mail</button></div>'
          :'<p class="muted small keep">Abra o app pelo site publicado ou pelo claude.ai para entrar com sua conta.</p>')+
    '</div></div>';
}
function gateUpdate(){
  var on=acessoOn(),need=on&&AUTH_READY&&!autenticado(),r=document.documentElement;
  r.classList.toggle('gated',need);r.classList.toggle('prot',on);
  var g=$('#acGate');
  if(need&&!g){document.body.insertAdjacentHTML('beforeend',gateHTML());g=$('#acGate')}
  if(g)g.hidden=!need;
  if(need)r.style.overflow='hidden';
  else if(GATE_ON&&cover.hidden&&login.hidden&&cfgM.hidden&&glM.hidden&&(!gestM||gestM.hidden))r.style.overflow='';
  GATE_ON=need;
}
/* o Firebase avisa quando há conta entrada (ou nenhuma) e quando a gestão muda a regra */
aoFazer('Firebase conectado',function(fb){
  fb.db.doc('meta/acesso').onSnapshot(function(s){
    ACESSO.login=!!(s.exists&&(s.data()||{}).login===true);
    try{localStorage.setItem('cse-acesso',ACESSO.login?'1':'0')}catch(e){}
    gateUpdate();if(gestM&&!gestM.hidden&&gTab==='geral')renderGest();
  },function(){gateUpdate()});
  fb.auth.onAuthStateChanged(function(u){AUTH_USER=!!u;AUTH_READY=true;gateUpdate()});
});
if(FBMODE&&!FB_ON)AUTH_READY=true;
aoFazer('tudo reconstruído',function(){gateUpdate()});
/* com a regra ligada: sem clique direito nem arrastar em imagens, mapa e fotos (só desanima; print de tela continua possível) */
document.addEventListener('contextmenu',function(e){if(!acessoOn())return;var t=e.target;if(t&&t.closest&&t.closest('img,svg,canvas,.mapwrap,.planwrap,.cvdet,.cv-map,.lg-bg'))e.preventDefault()});
document.addEventListener('dragstart',function(e){if(acessoOn()&&e.target&&e.target.tagName==='IMG')e.preventDefault()});
/* gestão › Visão geral: o interruptor (só quem tem o privilégio de administradores) */
function acessoCard(){
  if(!gcan('admins'))return '';
  return '<h3 class="gh">Acesso ao app</h3><div class="tgls">'+
    tg('gAcessoLogin',acessoOn(),'Exigir login para consultar','Quem não entrou com Google ou e-mail não vê o mapa, os trajetos nem as fotos. Também bloqueia clique direito e arrastar nas imagens.')+
    '</div><p class="muted small keep">'+(FBMODE?'Vale para todos os aparelhos. Os dados do Firebase só ficam protegidos de verdade depois de publicar as regras novas (arquivo firestore.rules).':'Modo demonstração: vale só para este aparelho.')+'</p>';
}
document.addEventListener('change',function(e){
  if(!e.target||e.target.id!=='gAcessoLogin')return;
  var v=e.target.checked,box=e.target;
  var volta=function(err){box.checked=!v;
    var neg=err&&(err.code==='permission-denied'||/permission/i.test(String(err.message||'')));
    gToast(neg?'O Firebase recusou. Publique o firestore.rules novo (ele libera meta/acesso) e confira se seu e-mail está em gestores, sem o campo perms.':'Não deu para salvar agora. Confira a conexão e tente de novo.',1)};
  if(FBMODE){
    if(!SH.db){volta();return}
    SH.db.doc('meta/acesso').set({login:v,ts:Date.now(),by:SH.uid||''}).then(function(){gToast(v?'Login obrigatório ligado.':'Login obrigatório desligado.')},volta);
  }else{
    saveG('acesso',{login:v}).then(function(){gateUpdate()});
  }
});
gateUpdate();
/* ======================= v12: mapa claro no tema claro ======================= */
function mapThemeSync(light){
  var suf=light?'-claro':'';if(suf===MAPSUF)return;MAPSUF=suf;
  var oldVec=MAPVEC;
  MAPIMG=mapaUrl('mapa-bordas'+suf+'.jpg');MAPHD=window.MAPHD_URL=mapaUrl('mapa-campus'+suf+'.jpg');MAPVEC=mapaUrl('mapa-campus'+suf+'.svg');MAPMINI=mapaUrl('mapa-mini'+suf+'.jpg');MAPBLUR=mapaUrl('mapa-blur'+suf+'.jpg');
  var im=document.querySelector('#baseimg image');if(im)im.setAttribute('href',MAPIMG);
  var hd=$('#imgHD');if(hd)hd.setAttribute('href',MAPHD);
  var vc=$('#imgVec');if(vc&&vc.getAttribute('href')===oldVec)vc.setAttribute('href',MAPVEC);
  var pk=document.querySelector('#pkMap image');if(pk)pk.setAttribute('href',MAPHD);
  var r=document.documentElement;r.style.setProperty('--bgmap-sw','url('+MAPMINI+')');if(CFG.bg==='mapa')r.style.setProperty('--bgmap','url('+MAPBLUR+')');
  r.classList.toggle('mapclaro',!!light);
}
document.documentElement.classList.toggle('mapclaro',MAPSUF==='-claro');
/* v14: horário em faixa de 10 min passa a ser o padrão */
if(CFG.faixaV!==1){CFG.faixa=10;CFG.faixaV=1;try{saveCfg()}catch(e){}}
/* v14: modo simplificado ligado por padrão */
if(CFG.simplesV!==1){CFG.simples=true;CFG.simplesV=1;try{saveCfg()}catch(e){}applySimples()}
renderAll();
/* ======================= v13: Wi-Fi em Lugares, balão no mapa e Volta à noite visível ======================= */
var WSEL=null;
function wScale(id){var m=mine[id],h='';for(var i=1;i<=5;i++)h+='<button type="button" data-wrate="'+i+'" data-wid="'+id+'" aria-pressed="'+(m===i)+'" aria-label="Nota '+i+' de 5">'+i+'</button>';
  return '<div class="scale wscale" role="group" aria-label="Nota do sinal">'+h+'</div><div class="ends"><span>Fraco</span><span>Forte</span></div>'}
function pWifiHTML(){
  var ids=Object.keys(WIFI).sort(function(a,b){return avgOf(b)-avgOf(a)});
  return '<div><p class="eyebrow">Lugares</p><h2>Wi-Fi</h2></div>'+
    '<p class="muted small">Redes abertas do campus, com a nota dos alunos. Toque numa rede para dar sua nota ou ver no mapa.</p>'+
    '<div class="list wlist">'+ids.map(function(id){var w=WIFI[id],a=avgOf(id),q=info(a),open=WSEL===id;
      return '<div class="wrow'+(open?' open':'')+'" id="wrow-'+id+'"><button class="item tint wsel" type="button" data-wsel="'+id+'" aria-expanded="'+open+'" style="--c:var(--good)">'+barsSvg(q.bars,24,20)+
        '<span class="grow">'+esc(w.name)+'<small>'+esc(w.ssid||'Rede aberta')+' · '+q.label+'</small></span><span class="mono wnota">'+br(a)+'</span></button>'+
        (open?'<div class="wbody"><dl class="kv"><dt>Rede</dt><dd>'+esc(w.ssid||'Nome a confirmar no local')+'</dd><dt>Acesso</dt><dd>'+esc(w.acesso||'Sem senha')+'</dd><dt>Dica</dt><dd>'+esc(w.note||'—')+'</dd><dt>Nota</dt><dd>'+br(a)+' de 5 · '+votesOf(id)+' avaliações</dd></dl>'+
          (PERFIL?'<p><b>Como está o sinal aqui agora?</b></p>'+wScale(id):needProfileHTML('dar nota ao sinal'))+
          '<div class="gbtns"><button type="button" class="copy" data-wmap="'+id+'">Ver no mapa</button></div></div>':'')+'</div>'}).join('')+'</div>'+
    '<div class="educard"><div class="educard-t"><span class="lb" style="--c:var(--good)">edu</span><span class="grow"><b>eduroam</b><small class="keep">Wi-Fi seguro das universidades, com o login da UFRJ</small></span></div>'+
    (EDUC.open?eduCfgHTML(false):'<div class="row"><button type="button" class="copy primary" data-educfg>Configurar eduroam</button><button type="button" class="linkbtn" data-wedu>Ver tutorial</button></div>')+'</div>';
}
function renderWifiPane(){var el=$('#pWifi');if(el&&!pPane.hidden)el.innerHTML=pWifiHTML()}
/* "Onde fica e quando abre" vira uma seção recolhível, fechada por padrão */
pstate.hrsOpen=(function(){try{return localStorage.getItem('cse-fold-hrs')==='1'}catch(e){return false}})();
pPane.addEventListener('toggle',function(e){var d=e.target;if(!d||d.id!=='fdHrs'||pstate.hrsOpen===d.open)return;
  pstate.hrsOpen=d.open;try{localStorage.setItem('cse-fold-hrs',d.open?'1':'0')}catch(x){}
  if(d.open){var b=d.querySelector('.fold-b');if(b&&!b.firstChild){pH.innerHTML=hoursHTML(nowMin());var s2=$('#fdHrs summary');if(s2)s2.focus({preventScroll:true})}}},true);
/* balão no mapa ao tocar num ícone de Wi-Fi */
function wifiPopClose(){var p=$('#wPop');if(p)p.remove()}
function wifiPopHTML(id){
  var w=WIFI[id],a=avgOf(id),q=info(a);
  return '<button type="button" class="wpop-x" data-wpopx aria-label="Fechar">×</button>'+
    '<div class="wpop-h">'+barsSvg(q.bars,26,22)+'<span><b>'+esc(w.name)+'</b><small>'+br(a)+' de 5 · '+votesOf(id)+' avaliações · '+q.label+'</small></span></div>'+
    (PERFIL?'<p class="wpop-q">Como está o sinal agora?</p>'+wScale(id)+(mine[id]?'<p class="wpop-ok">Sua nota: '+mine[id]+'</p>':'')
      :'<button type="button" class="copy" data-needprof>Criar perfil para dar nota</button>')+
    '<button type="button" class="linkbtn" data-wmore="'+id+'">Mais sobre esta rede</button>';
}
function wifiPop(id){
  if(!WIFI[id])return;var mw=document.querySelector('.mapwrap');if(!mw)return;
  var mk=svg.querySelector('.mk.wifi[data-id="'+id+'"]');if(!mk){wifiPopClose();return}
  var p=$('#wPop');if(!p){mw.insertAdjacentHTML('beforeend','<div class="wpop" id="wPop" role="dialog" aria-label="Rede Wi-Fi"></div>');p=$('#wPop')}
  p.dataset.id=id;p.innerHTML=wifiPopHTML(id);
  var r=mk.getBoundingClientRect(),R=mw.getBoundingClientRect(),pw=p.offsetWidth,ph=p.offsetHeight;
  var x=r.left+r.width/2-R.left,y=r.top-R.top;
  x=Math.max(pw/2+8,Math.min(R.width-pw/2-8,x));
  var below=y-ph-14<8;p.classList.toggle('below',below);
  p.style.left=x+'px';p.style.top=(below?r.bottom-R.top+14:y-14)+'px';
  var f=p.querySelector('[data-wrate],[data-needprof]');if(f)f.focus({preventScroll:true});
}
svg.addEventListener('click',function(e){
  if(suppressClick)return;
  var g=e.target.closest&&e.target.closest('.mk.wifi');
  if(g)setTimeout(function(){wifiPop(g.dataset.id)},0);else wifiPopClose();
},true);
svg.addEventListener('pointerdown',function(e){if(!(e.target.closest&&e.target.closest('.mk.wifi')))wifiPopClose()},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')wifiPopClose()});
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-wrate],[data-wsel],[data-wmap],[data-wmore],[data-wedu],[data-wpopx],[data-nightoff]');if(!t)return;
  if(t.dataset.wpopx!==undefined){wifiPopClose();return}
  if(t.dataset.nightoff!==undefined){state.sel=null;renderAll();return}
  if(t.dataset.wedu!==undefined){setTab('trajeto');select('guide','eduroam',true);return}
  if(t.dataset.wsel){WSEL=WSEL===t.dataset.wsel?null:t.dataset.wsel;renderWifiPane();var b=$('#pWifi [data-wsel="'+t.dataset.wsel+'"]');if(b)b.focus({preventScroll:true});return}
  if(t.dataset.wrate){
    var id=t.dataset.wid,n=+t.dataset.wrate;if(!PERFIL||!WIFI[id])return;
    mine[id]=n;saveMine();writeVotes();drawShared();updateMap();
    if(state.sel&&state.sel.kind==='wifi'&&state.sel.id===id)renderDetail();
    renderWifiPane();if($('#wPop'))wifiPop(id);
    gToast('Obrigado! Sua nota para '+WIFI[id].name+': '+n+'.');return}
  if(t.dataset.wmap){var wid=t.dataset.wmap;
    if(!state.layers.wifi){var c=$('#chWifi');if(c)setLayer('wifi',c)}
    select('wifi',wid,false);scrollToMap();setTimeout(function(){wifiPop(wid)},450);return}
  if(t.dataset.wmore){var wm=t.dataset.wmore;wifiPopClose();WSEL=wm;setTab('predios');try{history.replaceState(null,'','#predios')}catch(x){}
    setTimeout(function(){var r=$('#wrow-'+wm);if(r)r.scrollIntoView({behavior:'smooth',block:'center'})},60)}
});
/* Volta à noite: a lua aparece no mapa, o mapa escurece e o painel vem para a tela */
function nightBadge(){
  var on=!!state.sel&&(state.sel.kind==='night'||state.sel.kind==='guard'),mw=document.querySelector('.mapwrap');if(!mw)return;
  mw.classList.toggle('noite',on);var b=$('#nightBadge');
  if(on&&!b)mw.insertAdjacentHTML('beforeend','<div class="nightbadge" id="nightBadge" role="status">'+MOON+'<span>Volta à noite</span><button type="button" data-nightoff>Sair</button></div>');
  else if(!on&&b)b.remove();
}
aoFazer('mapa atualizado',nightBadge);
wifiChip();
/* ======================= v16: tela cheia no primeiro toque ======================= */
var FSE=document.documentElement;
function fsOk(){return !!(FSE.requestFullscreen||FSE.webkitRequestFullscreen)}
function fsOn(){return !!(document.fullscreenElement||document.webkitFullscreenElement)}
function fsWanted(){return typeof CFG.telaCheia==='boolean'?CFG.telaCheia:window.matchMedia('(pointer:coarse)').matches}
function fsEnter(){
  if(!fsOk()||fsOn())return;
  try{var r=(FSE.requestFullscreen||FSE.webkitRequestFullscreen).call(FSE,{navigationUI:'hide'});if(r&&r.catch)r.catch(function(){})}catch(e){}
}
function fsExit(){try{var f=document.exitFullscreen||document.webkitExitFullscreen;if(f){var r=f.call(document);if(r&&r.catch)r.catch(function(){})}}catch(e){}}
function fsCfgHTML(){
  if(!fsOk())return '<div class="faixa-w"><p class="balvo-t"><b>Tela cheia</b></p><p class="muted small">Este navegador não deixa o site abrir em tela cheia. No iPhone, use Compartilhar › Adicionar à Tela de Início: o app abre sem a barra de endereço.</p></div>';
  return tg('cfgTelaCheia',fsWanted(),'Abrir em tela cheia','No primeiro toque em cada visita, o app esconde a barra de endereço. O navegador exige esse toque; não dá para ser antes. Sai com o gesto de voltar ou Esc.')+
    '<div class="faixa-w"><button type="button" class="fs-btn" id="fsNow">'+(fsOn()?'Sair da tela cheia':'Entrar em tela cheia agora')+'</button></div>';
}
var fsTried=false;
function fsFirstTap(){
  if(fsTried)return;fsTried=true;
  document.removeEventListener('click',fsFirstTap,true);document.removeEventListener('touchend',fsFirstTap,true);
  if(fsWanted())fsEnter();
}
document.addEventListener('click',fsFirstTap,true);
document.addEventListener('touchend',fsFirstTap,true);
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('#fsNow');if(!b)return;
  fsTried=true;if(fsOn())fsExit();else fsEnter();
});
function fsLabel(){var b=document.getElementById('fsNow');if(b)b.textContent=fsOn()?'Sair da tela cheia':'Entrar em tela cheia agora'}
document.addEventListener('fullscreenchange',fsLabel);document.addEventListener('webkitfullscreenchange',fsLabel);
/* ======================= v18: motivos para entrar com uma conta ======================= */
function contaOk(){return ACC.kind==='google'||ACC.kind==='claude'}
function semConta(){return FB_ON&&!contaOk()}
function askBtn(why,label,cls){return '<button type="button" class="copy primary la-ask'+(cls?' '+cls:'')+'" data-ask="'+why+'">'+label+'</button>'}
var LA_WHY={
  fila:['Entre para informar a fila','Para evitar relatos falsos, só quem tem conta informa a fila. Seu nome não aparece para ninguém.'],
  wifi:['Entre para sua nota contar','Sem conta, a nota fica só neste aparelho. Com conta, ela entra na média que todo mundo vê.'],
  avisos:['Entre para enviar avisos','Com conta, seus avisos aparecem para todos no mapa. Seu nome não aparece.'],
  alertas:['Entre para receber alertas','Alertas do seu ônibus, de chuva e da fila do RU ficam ligados à sua conta.'],
  noite:['Entre para avisar alguém','Com conta, você manda para alguém de confiança de onde saiu, qual ônibus pegou e quando deve chegar.'],
  lembrete:['Leve o app com você','Com uma conta, nada do que você configurou se perde ao trocar de celular.']};
var LA_BEN=[['sync','Ajustes, trajeto favorito e grade em qualquer aparelho'],['bell','Alertas do seu ônibus, de chuva e da fila do RU'],['moon','Volta à noite: avise alguém de confiança'],['users','Informe fila, Wi-Fi e avisos para todo mundo']];
var LA_IC={sync:'<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'};
function laBenHTML(){return '<ul class="la-ben">'+LA_BEN.map(function(b){return '<li><svg viewBox="0 0 24 24" aria-hidden="true">'+LA_IC[b[0]]+'</svg><span>'+b[1]+'</span></li>'}).join('')+'</ul>'}
function loginAsk(why){
  var w=LA_WHY[why]||LA_WHY.lembrete,el=$('#laSheet');
  if(!el){document.body.insertAdjacentHTML('beforeend','<div class="la-wrap" id="laSheet" role="dialog" aria-modal="true" aria-labelledby="laT" hidden><div class="la-box"></div></div>');el=$('#laSheet')}
  el.querySelector('.la-box').innerHTML='<p class="eyebrow keep">Conta</p><h2 id="laT">'+w[0]+'</h2><p class="la-p">'+w[1]+'</p>'+laBenHTML()+
    (FB_ON?'<div class="la-btns"><button type="button" class="lg-btn pri" data-goo data-laclose>Entrar com Google</button><button type="button" class="copy la-mail" data-mail data-laclose>Entrar com e-mail</button></div>':'<p class="la-p">Abra o app pelo site publicado para entrar com uma conta.</p>')+
    '<button type="button" class="la-no" data-laclose>Agora não</button><p class="la-priv">Usamos seu nome e e-mail só para guardar seus dados. Veja tudo em Ajustes › Conta › Seus dados.</p>';
  el.hidden=false;LA_PREV=document.activeElement;setTimeout(function(){var b=el.querySelector('[data-goo],.la-no');if(b)b.focus({preventScroll:true})},30);
}
var LA_PREV=null;
function loginAskClose(){var el=$('#laSheet');if(el&&!el.hidden){el.hidden=true;if(LA_PREV&&LA_PREV.focus)try{LA_PREV.focus({preventScroll:true})}catch(e){}}}
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('[data-ask]');if(a){e.preventDefault();loginAsk(a.dataset.ask);return}
  var c=e.target.closest&&e.target.closest('[data-laclose]');if(c){setTimeout(loginAskClose,0)}
  var s=$('#laSheet');if(s&&!s.hidden&&e.target===s)loginAskClose();
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')loginAskClose()});
/* fila: o botão Informar aparece também para quem não entrou e leva ao pedido de conta */
/* contribuições: contagem guardada na conta */
var CONTRIB={fila:0,avisos:0,pedidos:0};try{var _c=JSON.parse(localStorage.getItem('cse-contrib'));if(_c&&typeof _c==='object')Object.keys(CONTRIB).forEach(function(k){CONTRIB[k]=+_c[k]||0})}catch(e){}
function saveContrib(){try{localStorage.setItem('cse-contrib',JSON.stringify(CONTRIB))}catch(e){}}
function contribTotal(){return CONTRIB.fila+CONTRIB.avisos+CONTRIB.pedidos+Object.keys(mine||{}).length}
function seloOf(n){return n>=20?['Guia do Fundão','good']:n>=5?['Colaborador frequente','good']:n>=1?['Colaborador','']:['Ainda sem contribuições','']}
function contribHTML(){
  var n=contribTotal(),s=seloOf(n),nx=n<1?1:n<5?5:n<20?20:0;
  return '<div class="la-contrib"><div class="la-ch"><b>Suas contribuições</b><span class="pill '+s[1]+'">'+s[0]+'</span></div>'+
    '<div class="la-nums"><span><b>'+CONTRIB.fila+'</b>filas</span><span><b>'+Object.keys(mine||{}).length+'</b>notas de Wi-Fi</span><span><b>'+CONTRIB.avisos+'</b>avisos</span><span><b>'+CONTRIB.pedidos+'</b>pedidos</span></div>'+
    '<p class="small keep la-p">'+(n?'Obrigado! Cada aviso ajuda quem está chegando agora.':'Informe a fila do RU ou dê nota a uma rede Wi-Fi para começar.')+(nx?' Faltam '+(nx-n)+' para o selo “'+seloOf(nx)[0]+'”.':'')+'</p></div>';
}
/* contato de confiança (Volta à noite) */
var CONT={nome:'',tel:''};try{var _ct=JSON.parse(localStorage.getItem('cse-contato'));if(_ct&&typeof _ct==='object'){CONT.nome=String(_ct.nome||'').slice(0,40);CONT.tel=String(_ct.tel||'').slice(0,20)}}catch(e){}
function saveCont(){try{localStorage.setItem('cse-contato',JSON.stringify(CONT))}catch(e){}if(contaOk())accQueue()}
function telDig(t){var d=String(t||'').replace(/\D/g,'');if(d.length===10||d.length===11)d='55'+d;return d.length>=12?d:''}
function nightMsg(kind,from,now){
  var hi=CONT.nome?'Oi, '+CONT.nome+'! ':'';
  if(kind==='cheguei')return hi+'Cheguei bem na Estação BRT. (Chega aí UFRJ)';
  if(from==='est')return hi+'Estou na Estação BRT do Fundão saindo agora. Te aviso quando chegar. (Chega aí UFRJ)';
  var o=options(from,'est',now)[0]||lastTo(from,'est')[0];
  return hi+'Estou saindo de '+STOPS[from].name+' agora'+(o?'. Vou pegar a Linha '+o.lid+' ('+LINES[o.lid].name+') por volta de '+hm(Math.round(o.dep))+' e devo chegar na Estação BRT perto de '+hm(Math.round(o.arr)):'')+'. Te aviso quando chegar. (Chega aí UFRJ)';
}
function hm(m){m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function nightSend(kind){
  var txt=nightMsg(kind,state.nightFrom||state.to,nowMin()),d=telDig(CONT.tel);
  if(d){window.open('https://wa.me/'+d+'?text='+encodeURIComponent(txt),'_blank','noopener');return}
  if(navigator.share){navigator.share({text:txt}).catch(function(){});return}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){gToast('Mensagem copiada. Cole no app de mensagens.')},function(){gToast(txt)});else gToast(txt);
}
function nightShareHTML(){
  var h='<h3>Avise alguém de confiança</h3>';
  if(!contaOk())return h+'<div class="la-lock"><p class="small keep">Mande para alguém de onde você está saindo, qual ônibus vai pegar e quando deve chegar. Depois, avise que chegou bem.</p>'+(FB_ON?askBtn('noite','Entrar para usar'):'')+'</div>';
  return h+'<div class="la-night"><p class="small keep">'+(CONT.nome||CONT.tel?'Enviar para <b>'+esc(CONT.nome||'seu contato')+'</b>'+(telDig(CONT.tel)?' pelo WhatsApp':'')+'.':'Escolha o app na hora de enviar, ou cadastre um contato.')+' <button type="button" class="linkbtn" data-ctedit>'+(CONT.nome||CONT.tel?'Trocar':'Cadastrar contato')+'</button></p>'+
    '<div class="row"><button type="button" class="copy primary" data-nsend="saindo">Avisar que estou saindo</button><button type="button" class="copy" data-nsend="cheguei">Avisar que cheguei</button></div></div>';
}
document.addEventListener('click',function(e){
  var s=e.target.closest&&e.target.closest('[data-nsend]');if(s){if(contaOk())nightSend(s.dataset.nsend);else loginAsk('noite');return}
  if(e.target.closest&&e.target.closest('[data-ctedit]')){openCfg();setTimeout(function(){var f=$('#ctNome');if(f){f.scrollIntoView({block:'center'});f.focus({preventScroll:true})}},120)}
});
/* alertas (só com conta): funcionam com o app aberto, mesmo em outra aba */
function alertasHTML(){
  var h='<div class="accsec la-al" id="alsec"><h2>Alertas</h2>';
  if(!contaOk())return h+'<div class="la-lock"><p class="small keep">Receba um aviso quando o ônibus do seu trajeto estiver chegando, quando for chover e quando a fila do RU estiver curta.</p>'+(FB_ON?askBtn('alertas','Entrar para ativar'):'<p class="muted small keep">Disponível ao entrar com uma conta.</p>')+'</div></div>';
  var perm=('Notification' in window)?Notification.permission:'na';
  h+='<div class="tgls">'+tg('cfgAlOn',CFG.alOn,'Meu ônibus está chegando','Do seu trajeto favorito: '+esc(STOPS[state.from].name)+' → '+esc(STOPS[state.to].name)+'.')+
    (CFG.alOn?'<div class="faixa-w"><p class="balvo-t"><b>Avisar com antecedência de</b></p><div class="seg cl-alvo" role="group" aria-label="Antecedência do alerta">'+[5,10,15].map(function(m){return '<button type="button" data-almin="'+m+'" aria-pressed="'+(+CFG.alMin===m)+'">'+m+' min</button>'}).join('')+'</div></div>':'')+
    tg('cfgAlChuva',CFG.alChuva,'Chuva chegando','Quando a chance de chuva passar de 60% na próxima hora.')+
    tg('cfgAlFila',CFG.alFila,'Fila do RU curta','Entre 11h e 14h, quando alguém informar fila pequena ou sem fila.')+'</div>'+
    (perm==='default'?'<div class="accmail"><div class="row"><button type="button" class="copy primary" id="alPerm">Permitir notificações do aparelho</button></div></div>':'')+
    '<p class="muted small keep">Os alertas aparecem enquanto o app estiver aberto, mesmo em outra aba'+(perm==='granted'?', também como notificação':'')+'. Com o app fechado, ainda não.</p>';
  h+='<h3 class="la-h3">Contato de confiança</h3><p class="muted small keep">Usado em Volta à noite. Com telefone, a mensagem abre no WhatsApp.</p>'+
    '<div class="la-ct"><label class="fld">Nome<input id="ctNome" type="text" maxlength="40" autocomplete="off" value="'+esc(CONT.nome)+'" placeholder="Ex.: Mãe"></label><label class="fld">Celular (opcional)<input id="ctTel" type="tel" inputmode="tel" maxlength="20" autocomplete="off" value="'+esc(CONT.tel)+'" placeholder="(21) 9…"></label></div>';
  return h+'</div>';
}
document.addEventListener('input',function(e){if(e.target.id==='ctNome'){CONT.nome=e.target.value.slice(0,40);saveCont()}else if(e.target.id==='ctTel'){CONT.tel=e.target.value.slice(0,20);saveCont()}});
document.addEventListener('change',function(e){
  var m={cfgAlOn:'alOn',cfgAlChuva:'alChuva',cfgAlFila:'alFila'}[e.target.id];if(!m)return;
  CFG[m]=e.target.checked;saveCfg();if(m==='alChuva'&&CFG.alChuva&&!CLIMA.d)climaLoad(false);
  if(e.target.checked&&('Notification' in window)&&Notification.permission==='default')try{Notification.requestPermission().then(renderCfgKeep)}catch(x){}
  renderCfgKeep();alCheck();
});
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-almin]');if(b){CFG.alMin=+b.dataset.almin;saveCfg();renderCfgKeep();return}
  if(e.target.closest&&e.target.closest('#alPerm')){try{Notification.requestPermission().then(renderCfgKeep)}catch(x){}}
});
var ALF={};try{ALF=JSON.parse(sessionStorage.getItem('cse-alf'))||{}}catch(e){ALF={}}
function alFire(key,title,body){
  if(ALF[key])return false;ALF[key]=Date.now();try{sessionStorage.setItem('cse-alf',JSON.stringify(ALF))}catch(e){}
  gToast(title+' · '+body);try{if(navigator.vibrate)navigator.vibrate([120,60,120])}catch(e){}
  if(document.hidden&&('Notification' in window)&&Notification.permission==='granted')try{new Notification(title,{body:body,tag:key})}catch(e){}
  return true;
}
function alCheck(){
  if(!contaOk())return;
  var now=nowMin(),day=new Date().toISOString().slice(0,10);
  if(CFG.alOn&&STOPS[state.from]&&STOPS[state.to]&&state.from!==state.to){
    var o=(options(state.from,state.to,now)||[])[0];
    if(o){var d=Math.round(o.dep)-now;if(d>=0&&d<=(+CFG.alMin||10))alFire('bus:'+day+':'+o.lid+':'+Math.round(o.dep),'Linha '+o.lid+' passa em '+(d?'~'+d+' min':'instantes'),'Em '+STOPS[state.from].name+', sentido '+STOPS[state.to].name+'.')}
  }
  if(CFG.alChuva){var c=climaChuva();if(c&&c.h*60-now<=60&&c.h*60-now>=-30)alFire('chuva:'+day+':'+c.h,'Chuva chegando',c.p+'% de chance por volta das '+String(c.h).padStart(2,'0')+'h. Leve guarda-chuva.')}
  if(CFG.alFila&&now>=660&&now<=840)RUS.forEach(function(k){var f=filaOf(k);if(f&&f.n<=1)alFire('fila:'+day+':'+k,PL[k].name+': '+(f.n?'fila pequena':'sem fila'),'Informado '+agoTxt(f.last)+'.')});
}
setInterval(alCheck,30000);setTimeout(alCheck,4000);
/* Ajustes › Conta: contribuições, benefícios e seus dados */
function dadosHTML(){
  var g=ACC.kind==='google';
  return '<details class="la-dados"><summary>Seus dados e privacidade</summary><div class="la-dd">'+
    '<p class="small keep"><b>O que fica guardado na sua conta:</b></p><ul class="small">'+
    (g?'<li>Nome, e-mail e o link da foto (vindos do Google ou do seu cadastro).</li><li>Data da primeira e da última visita e quantas vezes entrou (para controlar as vagas).</li>':'<li>Seu nome e foto, vindos da conta do claude.ai.</li>')+
    '<li>Ajustes, trajeto favorito'+(g?', grade de aulas':'')+', contato de confiança e a contagem de contribuições.</li>'+
    '<li>Filas, avisos, notas de Wi-Fi e pedidos que você enviou. Os outros veem esses dados sem o seu nome; a gestão consegue ligar cada um à sua conta para combater abuso.</li></ul>'+
    '<p class="small keep"><b>O que não guardamos:</b> sua localização exata. O mapeamento do Wi-Fi é opcional e envia só a área aproximada (30 m), sem dizer quem você é.</p>'+
    '<p class="small keep">Nada disso é vendido ou repassado. O uso é só o funcionamento do app (LGPD, art. 7º).</p>'+
    (g?'<div class="row"><button type="button" class="copy" id="laExport">Baixar meus dados</button><button type="button" class="copy la-del" id="laDelete">Apagar meus dados e a conta</button></div>':'')+'</div></details>';
}
aoFazer('ajustes montados',function(f){var a=$('#accsec');if(a&&!$('#alsec'))a.insertAdjacentHTML('afterend',alertasHTML())});
function myDocs(){var u=SH.uid||ACC.uid;return ['usuarios/'+u,'votes/'+u,'fila/'+u,'reports/'+u,'requests/'+u]}
function laExport(){
  var db=ACC.fb&&ACC.fb.db;if(!db)return;
  Promise.all(myDocs().map(function(p){return db.doc(p).get().then(function(d){return [p.split('/')[0],d.exists?d.data():null]},function(){return [p.split('/')[0],'sem acesso']})})).then(function(r){
    var o={app:'Chega aí UFRJ',geradoEm:new Date().toISOString(),conta:{uid:ACC.uid,nome:ACC.name,email:ACC.email,foto:ACC.photo},nesteAparelho:{ajustes:CFG,contato:CONT,contribuicoes:CONTRIB}};
    r.forEach(function(x){o[x[0]]=x[1]});
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}));a.download='meus-dados-chega-ai-ufrj.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000);
    gToast('Arquivo com seus dados baixado.');
  });
}
var LA_DEL=0;
function laDelete(b){
  if(Date.now()-LA_DEL>6000){LA_DEL=Date.now();b.textContent='Toque de novo para apagar tudo';b.classList.add('arm');setTimeout(function(){if(b.isConnected){b.textContent='Apagar meus dados e a conta';b.classList.remove('arm')}},6000);return}
  LA_DEL=0;var fb=ACC.fb,u=fb&&fb.auth.currentUser;if(!u)return;b.disabled=true;b.textContent='Apagando…';
  Promise.all(myDocs().map(function(p){return fb.db.doc(p).delete().catch(function(){})})).then(function(){
    CONTRIB={fila:0,avisos:0,pedidos:0};saveContrib();CONT={nome:'',tel:''};try{localStorage.removeItem('cse-contato')}catch(e){}
    return u.delete().then(function(){gToast('Seus dados e a sua conta foram apagados.')},function(e){
      if(e&&e.code==='auth/requires-recent-login'){gToast('Seus dados foram apagados. Para apagar também a conta, saia, entre de novo e repita.',1)}else gToast('Seus dados foram apagados, mas a conta não. Tente de novo mais tarde.',1);
      b.disabled=false;b.textContent='Apagar meus dados e a conta'});
  });
}
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('#laExport'))laExport();
  var d=e.target.closest&&e.target.closest('#laDelete');if(d)laDelete(d);
});
/* conta guarda contato e contribuições junto com os ajustes */
function applyExtra(d){
  if(!d||typeof d!=='object')return;
  if(d.contato&&typeof d.contato==='object'&&!CONT.nome&&!CONT.tel){CONT.nome=String(d.contato.nome||'').slice(0,40);CONT.tel=String(d.contato.tel||'').slice(0,20);try{localStorage.setItem('cse-contato',JSON.stringify(CONT))}catch(e){}}
  if(d.contrib&&typeof d.contrib==='object'){Object.keys(CONTRIB).forEach(function(k){CONTRIB[k]=Math.max(CONTRIB[k],+d.contrib[k]||0)});saveContrib()}
}
/* lembrete leve: a partir da 3ª visita (em dias diferentes), sem conta; "Agora não" some por 5 dias */
var VIS={n:0,d:''};try{VIS=JSON.parse(localStorage.getItem('cse-visitas'))||VIS}catch(e){}
(function(){var d=new Date().toISOString().slice(0,10);if(VIS.d!==d){VIS.n=(+VIS.n||0)+1;VIS.d=d;try{localStorage.setItem('cse-visitas',JSON.stringify(VIS))}catch(e){}}})();
function nudgeShow(){
  if(!semConta()||(+VIS.n||0)<3||(typeof AUTH_READY!=='undefined'&&!AUTH_READY))return;
  var until=0;try{until=+localStorage.getItem('cse-nudge-ate')||0}catch(e){}if(Date.now()<until)return;
  if(!login.hidden||!cover.hidden||!cfgM.hidden||$('#laNudge')||document.documentElement.classList.contains('gated'))return;
  document.body.insertAdjacentHTML('beforeend','<div class="la-nudge" id="laNudge" role="region" aria-label="Sugestão de conta"><span class="la-ni"><svg viewBox="0 0 24 24" aria-hidden="true">'+LA_IC.sync+'</svg></span><p><b>Salve sua grade e receba alertas</b><small>Entre com uma conta. Leva 10 segundos.</small></p><button type="button" class="copy primary" data-ask="lembrete" data-nudgex>Entrar</button><button type="button" class="la-x" data-nudgeno aria-label="Agora não">Agora não</button></div>');
}
document.addEventListener('click',function(e){
  var n=e.target.closest&&e.target.closest('[data-nudgeno],[data-nudgex]');if(!n)return;
  if(n.hasAttribute('data-nudgeno'))try{localStorage.setItem('cse-nudge-ate',String(Date.now()+5*864e5))}catch(x){}
  var el=$('#laNudge');if(el)el.remove();
});
setTimeout(nudgeShow,8000);setInterval(function(){if(!$('#laNudge'))nudgeShow();else if(!semConta())$('#laNudge').remove()},20000);
/* ======================= v19: grade só para quem entrou com uma conta ======================= */
LA_WHY.grade=['Faça login para salvar sua grade','Sua grade fica guardada na sua conta, só você vê, e aparece em qualquer aparelho em que você entrar.'];
function gradeAuthSync(){try{syncAulas();if(typeof updateMap==='function')updateMap();renderGrade()}catch(e){}}
aoFazer('usuário saiu',function(){gradeAuthSync()});
gradeAuthSync();
/* ======================= v20: botão "Configurar eduroam" (leva ao geteduroam certo para o aparelho) ======================= */
function eduPlat(){var u=navigator.userAgent||'';
  if(/android/i.test(u))return 'android';
  if(/iphone|ipad|ipod/i.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return 'ios';
  if(/windows/i.test(u))return 'win';if(/mac os/i.test(u))return 'mac';if(/linux|cros/i.test(u))return 'linux';return 'outro'}
var EDU_APP={
  android:['Android','https://play.google.com/store/apps/details?id=app.eduroam.geteduroam','Instalar o geteduroam','Google Play'],
  ios:['iPhone e iPad','https://apps.apple.com/app/geteduroam/id1504076137','Instalar o geteduroam','App Store'],
  win:['Windows','https://www.geteduroam.app/','Baixar o geteduroam','para Windows'],
  mac:['Mac','https://www.geteduroam.app/','Baixar o geteduroam','para Mac'],
  linux:['Linux','https://www.geteduroam.app/','Baixar o geteduroam','para Linux'],
  outro:['Outro aparelho','https://www.geteduroam.app/','Baixar o geteduroam','site oficial']};
var EDUC={open:false,plat:null,msg:'',tone:'',busy:false};
function eduMark(i,v){eduDone[i]=v;try{localStorage.setItem(DKEY,JSON.stringify(eduDone))}catch(e){}}
function eduCfgHTML(inTut){
  var pl=EDUC.plat||eduPlat(),a=EDU_APP[pl],c1=!!eduDone[0],c2=!!eduDone[2];
  var outros=['android','ios','win','mac'].filter(function(k){return k!==pl}).map(function(k){return '<button type="button" class="linkbtn" data-eduplat="'+k+'">'+EDU_APP[k][0]+'</button>'}).join(' · ');
  return '<div class="educfg" id="educfg">'+
    (inTut?'':'<div class="educfg-h"><b>Configurar eduroam</b><button type="button" class="la-x" data-educlose aria-label="Fechar">Fechar</button></div>')+
    '<ol class="educfg-s">'+
    '<li class="'+(c1?'done':'')+'"><span class="n">1</span><div><b class="keep">Cadastre seu e-mail no eduroam</b><p class="small keep">Na Intranet UFRJ, com CPF e senha. A ativação leva até 24 h.</p><div class="row"><a class="copy" href="https://intranet.ufrj.br/atualizar-email-eduroam" target="_blank" rel="noopener">Abrir a Intranet</a>'+(c1?'<span class="pill good">Feito</span>':'<button type="button" class="copy" data-edustep="0">Já cadastrei</button>')+'</div></div></li>'+
    '<li class="'+(c2?'done':'')+'"><span class="n">2</span><div><b class="keep">Instale o app oficial do eduroam</b><p class="small keep">'+(EDUC.plat?'Para':'Detectamos')+': <b>'+a[0]+'</b>. O geteduroam configura a rede e o certificado sozinho.</p><a class="educfg-app" href="'+a[1]+'" target="_blank" rel="noopener" data-eduapp><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg><span>'+a[2]+'<small>'+a[3]+'</small></span></a><p class="small keep">Outro aparelho? '+outros+'</p></div></li>'+
    '<li><span class="n">3</span><div><b class="keep">No app, escolha a UFRJ</b><p class="small keep">Busque “UFRJ”. Usuário: o e-mail do passo 1. Senha: a da Intranet. Depois toque em Conectar e Permitir.</p></div></li>'+
    '</ol>'+
    '<div class="row"><button type="button" class="copy primary" data-educheck'+(EDUC.busy?' disabled':'')+'>'+(EDUC.busy?'Verificando…':'Verificar minha conexão')+'</button>'+(inTut?'':'<button type="button" class="linkbtn" data-wedu>Tutorial completo</button>')+'</div>'+
    (EDUC.msg?'<p class="small keep educfg-r '+EDUC.tone+'" role="status">'+esc(EDUC.msg)+'</p>':'')+'</div>';
}
function eduCfgPaint(){var el=$('#educfg');if(!el)return;var t=document.createElement('div');t.innerHTML=eduCfgHTML(!!el.closest('#detail'));el.replaceWith(t.firstChild)}
function eduCheck(){
  if(EDUC.busy)return;EDUC.busy=true;EDUC.msg='';eduCfgPaint();
  netCheck().then(function(r){
    EDUC.busy=false;
    if(!r){EDUC.msg='Não deu para verificar agora.';EDUC.tone='warn'}
    else if(r.edu===true){EDUC.msg='Você está na eduroam. Tudo certo!';EDUC.tone='good';eduMark(4,true)}
    else if(r.ufrj&&r.edu===false){EDUC.msg='Você está numa rede da UFRJ, mas não na eduroam. Escolha “eduroam” na lista de Wi-Fi.';EDUC.tone='warn'}
    else if(r.ufrj){EDUC.msg='Você está numa rede da UFRJ. Confira se o nome do Wi-Fi é “eduroam”.';EDUC.tone='good'}
    else if(r.ufrj===false){EDUC.msg=(r.tipo==='cellular'?'Você está nos dados móveis. ':'Você não está numa rede da UFRJ agora. ')+'Ligue o Wi-Fi perto de um prédio e tente de novo.';EDUC.tone='warn'}
    else{EDUC.msg=r.erro||'Não deu para verificar agora.';EDUC.tone='warn'}
    eduCfgPaint();
  });
}
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-educfg],[data-educlose],[data-eduplat],[data-edustep],[data-educheck],[data-eduapp]');if(!t)return;
  if(t.hasAttribute('data-eduapp')){eduMark(2,true);setTimeout(eduCfgPaint,300);return}
  e.preventDefault();
  if(t.hasAttribute('data-educfg')){EDUC.open=!EDUC.open;renderWifiPane();if(EDUC.open)setTimeout(function(){var c=$('#educfg');if(c)c.scrollIntoView({block:'nearest',behavior:'smooth'})},50);return}
  if(t.hasAttribute('data-educlose')){EDUC.open=false;renderWifiPane();return}
  if(t.dataset.eduplat){EDUC.plat=t.dataset.eduplat;eduCfgPaint();return}
  if(t.dataset.edustep){eduMark(+t.dataset.edustep,true);eduCfgPaint();return}
  if(t.hasAttribute('data-educheck'))eduCheck();
},true);
/* v21: setas na capa: voltar para o login e avançar para o app */
$('#cvToLogin').addEventListener('click',function(e){e.stopPropagation();openLogin()});
/* ======================= v23: a gestão define as configurações padrão ======================= */
GKEYS.push('padrao');GST.padrao=GST.padrao||{};if(!SH.on||!FBMODE){try{var _gp=JSON.parse(localStorage.getItem(GLS+'padrao'));if(_gp)GST.padrao=_gp}catch(e){}}
GTABS.splice(1,0,['padrao','Padrões do app']);TAB_PERM.padrao='admins';
var PAD_DEF={tema:'escuro',simples:true,faixa:10,perf:'auto',cover:'folha',fsize:'m',clima:true,telaCheia:null};
var PAD_OPTS={
  tema:['Tema',TEMAS.map(function(t){return [t[0],t[1]]})],
  simples:['Modo simplificado',[[true,'Ligado'],[false,'Desligado']]],
  faixa:['Horário do ônibus',[[0,'Exato'],[5,'Faixa de 5 min'],[10,'Faixa de 10 min']]],
  perf:['Desempenho',PERFS.map(function(p){return [p[0],p[1]]})],
  cover:['Capa ao abrir',COVERS.map(function(c){return [c[0],c[1]]}).concat([['none','Sem capa']])],
  fsize:['Tamanho do texto',FSIZES.map(function(f){return [f[0],f[1]]})],
  clima:['Previsão do tempo',[[true,'Mostrar'],[false,'Esconder']]],
  telaCheia:['Tela cheia no primeiro toque',[[null,'Automático (só no celular)'],[true,'Sempre'],[false,'Nunca']]]};
var PAD_KEYS=Object.keys(PAD_OPTS);
function padOk(k,v){return PAD_OPTS[k]&&PAD_OPTS[k][1].some(function(o){return o[0]===v})}
/* o que o próprio usuário escolheu não é sobrescrito pelo padrão */
if(!CFG.mine||typeof CFG.mine!=='object')CFG.mine={};
if(CFG.padV!==1){PAD_KEYS.forEach(function(k){if(k in CFG&&CFG[k]!==PAD_DEF[k]&&!(k==='tema'&&CFG.tema==='escuro'))CFG.mine[k]=1});CFG.padV=1;try{localStorage.setItem('cse-cfg',JSON.stringify(CFG))}catch(e){}}
var PAD_SNAP=null;
['click','change','input','keydown'].forEach(function(ev){document.addEventListener(ev,function(e){
  if(!e.isTrusted)return;if(e.target&&e.target.closest&&e.target.closest('#gestM'))return;
  var s={};PAD_KEYS.forEach(function(k){s[k]=CFG[k]});PAD_SNAP=s;setTimeout(function(){PAD_SNAP=null},1500)},true)});
function padApply(){
  var P=GST.padrao||{},v=P.v||{},ch=false;
  if(P.forcar&&P.forcar!==CFG.padForc){PAD_KEYS.forEach(function(k){if(k in v)delete CFG.mine[k]});CFG.padForc=P.forcar;ch=true}
  PAD_KEYS.forEach(function(k){if(!(k in v)||CFG.mine[k]||!padOk(k,v[k]))return;if(CFG[k]!==v[k]){CFG[k]=v[k];ch=true}});
  if(!ch)return;
  saveCfgSemMarcar();
  try{applyTheme()}catch(e){}try{applySimples()}catch(e){}try{applyPerf()}catch(e){}try{applyCoverStyle()}catch(e){}try{applyFont()}catch(e){}
  try{renderAll()}catch(e){}try{if(CFG.clima&&!CLIMA.d)climaLoad(false)}catch(e){}
  try{if(cfgM&&!cfgM.hidden)renderCfgKeep()}catch(e){}
}
aoFazer('dados da gestão aplicados',function(){padApply()});
padApply();
function gPadrao(){
  var v=(GST.padrao||{}).v||{};
  return '<h3 class="gh">Configurações padrão</h3><p class="muted small keep">Valem para quem ainda não mudou a opção em Ajustes. Quem já escolheu mantém a própria escolha, a menos que você aplique para todos.</p>'+
    '<form class="gform" data-gform="padrao">'+PAD_KEYS.map(function(k){var o=PAD_OPTS[k];
      return '<label class="gf">'+o[0]+'<select id="gPad_'+k+'"><option value="">Padrão do app ('+esc((o[1].filter(function(x){return x[0]===PAD_DEF[k]})[0]||['',''])[1])+')</option>'+
        o[1].map(function(x,i){return '<option value="'+i+'"'+((k in v)&&v[k]===x[0]?' selected':'')+'>'+esc(x[1])+'</option>'}).join('')+'</select></label>'}).join('')+
    '<label class="wsafe"><input type="checkbox" id="gPadForce"> Aplicar também a quem já mudou essas opções</label>'+
    '<div class="gbtns"><button type="submit" class="copy primary">Salvar padrões</button></div></form>'+
    ((GST.padrao||{}).forcar?'<p class="muted small keep">Última aplicação para todos: '+new Date((GST.padrao||{}).forcar).toLocaleString('pt-BR')+'.</p>':'');
}
aoFazer('gestão montada',function(){if(gTab==='padrao'&&$('#gBody')&&gcan('admins'))$('#gBody').innerHTML=gPadrao()});
document.addEventListener('submit',function(e){var f=e.target.closest&&e.target.closest('form[data-gform="padrao"]');if(!f)return;e.preventDefault();e.stopPropagation();
  var v={};PAD_KEYS.forEach(function(k){var s=$('#gPad_'+k);if(s&&s.value!=='')v[k]=PAD_OPTS[k][1][+s.value][0]});
  var o={v:v};var old=GST.padrao||{};if($('#gPadForce').checked)o.forcar=Date.now();else if(old.forcar)o.forcar=old.forcar;
  saveG('padrao',o);renderGest();
},true);
/* ======================= v25: a bússola usa o GPS ======================= */
/* 1) ponto de partida: a sua posição do GPS (já era); agora mostra a precisão e avisa quando ela é ruim.
   2) andando, o GPS dá o rumo real do movimento (sem interferência magnética). Com ele o app:
      - aprende a diferença entre a bússola deste celular e o rumo real e corrige a seta (fica salvo no aparelho);
      - usa o próprio rumo do GPS quando o aparelho não tem bússola. */
CMP.off=0;CMP.offN=0;
try{var _co=JSON.parse(localStorage.getItem('cse-cmp-off'));if(_co&&typeof _co.o==='number'&&Date.now()-(+_co.t||0)<30*864e5){CMP.off=_co.o;CMP.offN=Math.min(+_co.n||0,20)}}catch(e){}
var GPSC={prev:null,course:null,ct:0,speed:null};
function llDist(a,b){var k=Math.cos(a[0]*Math.PI/180),dx=(b[1]-a[1])*111320*k,dy=(b[0]-a[0])*110574;return {m:Math.hypot(dx,dy),brg:(Math.atan2(dx,dy)*180/Math.PI+360)%360}}
function gpsFix(c,t){
  var ll=[c.latitude,c.longitude],acc=c.accuracy||50,sp=typeof c.speed==='number'&&!isNaN(c.speed)?c.speed:null,crs=null;
  if(typeof c.heading==='number'&&!isNaN(c.heading)&&sp!=null&&sp>=0.7)crs=c.heading;
  if(GPSC.prev){var d=llDist(GPSC.prev.ll,ll),dt=(t-GPSC.prev.t)/1000;
    if(crs==null&&d.m>=Math.max(8,1.5*acc)&&dt>0){crs=d.brg;if(sp==null)sp=d.m/dt}
    if(d.m>=Math.max(8,1.5*acc)||t-GPSC.prev.t>20000)GPSC.prev={ll:ll,t:t}}
  else GPSC.prev={ll:ll,t:t};
  GPSC.speed=sp;
  if(crs==null||acc>25)return;
  GPSC.course=crs;GPSC.ct=t;
  /* aprende só andando a pé (0,7 a 2,5 m/s), com a bússola lendo agora e o celular apontado mais ou menos para a frente */
  if(sp!=null&&sp>=0.7&&sp<=2.5&&CMP.hRaw!=null&&t-CMP.tRaw<3000){
    var smp=norm180(crs-CMP.hRaw);
    if(Math.abs(norm180(smp-CMP.off))<45||CMP.offN<3){CMP.off=norm180(CMP.off+(CMP.offN<3?0.5:0.12)*norm180(smp-CMP.off));CMP.offN++;
      try{localStorage.setItem('cse-cmp-off',JSON.stringify({o:CMP.off,n:CMP.offN,t:t}))}catch(e){}}
  }
  /* sem bússola no aparelho: a direção do movimento vira a direção do celular */
  if(CMP.on&&(!CMP.got||Date.now()-(CMP.tRaw||0)>5000)&&sp!=null&&sp>=0.7){CMP.h=crs;CMP.gpsH=true;cmpSchedule()}
}
/* texto do cartão da bússola: precisão do GPS e se a seta já foi ajustada */
/* ======================= v26: feedback dos usuários + app instalável (PWA) ======================= */
var FBK_TIPOS=[['erro','Algo errado'],['ideia','Sugestão'],['elogio','Elogio'],['outro','Outro']];
var FBK_LOCAL='cse-feedback-local';
function fbkSave(o){
  o.ts=Date.now();o.ver=APP_VERSION;o.tela=(location.hash||'#mapa').slice(0,30);o.disp=/android/i.test(navigator.userAgent)?'android':/iphone|ipad/i.test(navigator.userAgent)?'ios':'outro';
  if(SH.uid)o.uid=SH.uid;
  try{var last=+localStorage.getItem('cse-fbk-ult')||0;if(Date.now()-last<60000&&o.txt)return Promise.reject({code:'rate'})}catch(e){}
  var done=function(){try{localStorage.setItem('cse-fbk-ult',String(Date.now()))}catch(e){}};
  if(FB_ON)return fbInit().then(function(fb){return fb.db.collection('feedback').add(o)}).then(done);
  try{var a=JSON.parse(localStorage.getItem(FBK_LOCAL)||'[]');a.unshift(o);localStorage.setItem(FBK_LOCAL,JSON.stringify(a.slice(0,200)))}catch(e){}
  done();return Promise.resolve();
}
function fbkOpen(nota){
  var el=$('#fbkSheet');
  if(!el){document.body.insertAdjacentHTML('beforeend','<div class="la-wrap" id="fbkSheet" role="dialog" aria-modal="true" aria-labelledby="fbkT" hidden><div class="la-box"></div></div>');el=$('#fbkSheet')}
  el.querySelector('.la-box').innerHTML='<p class="eyebrow keep">Feedback</p><h2 id="fbkT">Conte para a gente</h2><p class="la-p">Achou um erro, tem uma ideia ou quer elogiar? A equipe lê tudo.</p>'+
    '<div class="seg chips" role="radiogroup" aria-label="Tipo">'+FBK_TIPOS.map(function(t,i){return '<button type="button" data-fbkt="'+t[0]+'" aria-pressed="'+(i===0)+'">'+t[1]+'</button>'}).join('')+'</div>'+
    '<label class="fld">Sua mensagem<textarea id="fbkTxt" rows="5" maxlength="1000" placeholder="Ex.: o horário da Linha 2 no CT estava errado hoje às 18h"></textarea></label>'+
    (ACC.email?'<label class="wsafe"><input type="checkbox" id="fbkMail"> Pode me responder em '+esc(ACC.email)+'</label>':'')+
    '<div class="la-btns"><button type="button" class="lg-btn pri" id="fbkSend">Enviar</button></div><button type="button" class="la-no" data-fbkclose>Cancelar</button>'+
    '<p class="la-priv">Enviamos junto só a tela em que você estava, a versão do app e o tipo de aparelho.</p>';
  el.dataset.nota=nota||'';el.hidden=false;setTimeout(function(){var t=$('#fbkTxt');if(t)t.focus()},40);
}
function fbkClose(){var el=$('#fbkSheet');if(el)el.hidden=true}
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-fbk],[data-fbkt],#fbkSend,[data-fbkclose],[data-fbnota],[data-fbqno]');if(!t){var s=$('#fbkSheet');if(s&&!s.hidden&&e.target===s)fbkClose();return}
  if(t.hasAttribute('data-fbk')){fbkOpen();return}
  if(t.dataset.fbkt){t.parentNode.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',b===t)});return}
  if(t.hasAttribute('data-fbkclose')){fbkClose();return}
  if(t.id==='fbkSend'){
    var txt=($('#fbkTxt').value||'').trim();if(txt.length<3){gToast('Escreva sua mensagem.');return}
    var tp=($('#fbkSheet [data-fbkt][aria-pressed="true"]')||{dataset:{fbkt:'outro'}}).dataset.fbkt,o={tipo:tp,txt:txt.slice(0,1000)};
    var n=+$('#fbkSheet').dataset.nota;if(n)o.nota=n;var m=$('#fbkMail');if(m&&m.checked)o.email=ACC.email;
    t.disabled=true;t.textContent='Enviando…';
    fbkSave(o).then(function(){fbkClose();gToast('Obrigado! Sua mensagem chegou à equipe.')},function(err){t.disabled=false;t.textContent='Enviar';gToast(err&&err.code==='rate'?'Espere um minuto para enviar outra mensagem.':'Não deu para enviar agora. Tente de novo.',1)});
    return}
  if(t.dataset.fbnota){var nv=+t.dataset.fbnota;try{localStorage.setItem('cse-fbq-ate',String(Date.now()+14*864e5))}catch(x){}
    var q=$('#fbQ');fbkSave({tipo:'nota',nota:nv}).catch(function(){});
    if(q)q.innerHTML='<p><b>Obrigado!</b><small>'+(nv<=3?'O que podemos melhorar?':'Quer contar mais alguma coisa?')+'</small></p><button type="button" class="copy primary" data-fbk>Contar</button><button type="button" class="la-x" data-fbqno>Fechar</button>';
    return}
  if(t.hasAttribute('data-fbqno')){try{localStorage.setItem('cse-fbq-ate',String(Date.now()+14*864e5))}catch(x){}var q2=$('#fbQ');if(q2)q2.remove()}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')fbkClose()});
/* pergunta curta a partir da 4ª visita (dias diferentes), no máximo a cada 14 dias */
function fbqShow(){
  if((+VIS.n||0)<4||$('#fbQ')||$('#laNudge'))return;var ate=0;try{ate=+localStorage.getItem('cse-fbq-ate')||0}catch(e){}if(Date.now()<ate)return;
  if(!login.hidden||!cover.hidden||!cfgM.hidden)return;
  document.body.insertAdjacentHTML('beforeend','<div class="la-nudge fbq" id="fbQ" role="region" aria-label="Pergunta rápida"><p><b>O app te ajudou hoje?</b><small>De 1 (nada) a 5 (muito)</small></p><div class="fbq-n">'+[1,2,3,4,5].map(function(n){return '<button type="button" data-fbnota="'+n+'" aria-label="Nota '+n+'">'+n+'</button>'}).join('')+'</div><button type="button" class="la-x" data-fbqno aria-label="Agora não">✕</button></div>');
}
setTimeout(fbqShow,45000);
/* Ajustes: seção "Fale com a gente" e "Instalar o app" */
var PWA={evt:null};
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();PWA.evt=e;if(cfgM&&!cfgM.hidden)renderCfgKeep()});
window.addEventListener('appinstalled',function(){PWA.evt=null;gToast('App instalado! Abra pelo ícone na tela inicial.');if(cfgM&&!cfgM.hidden)renderCfgKeep()});
function pwaStandalone(){return (window.matchMedia&&matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches)||navigator.standalone===true}
function pwaHTML(){
  if(!ON_SITE)return '';
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),h='<div class="accsec" id="pwasec"><h2>Instalar o app</h2>';
  if(pwaStandalone())return h+'<p class="small keep"><span class="pill good">Instalado</span> Você está usando o app instalado.</p></div>';
  if(PWA.evt)return h+'<p class="small keep">Ícone na tela inicial, tela cheia e funciona mesmo sem internet.</p><div class="row"><button type="button" class="copy primary" id="pwaGo">Instalar o app</button></div></div>';
  if(ios)return h+'<p class="small keep">No Safari, toque em <b>Compartilhar</b> (o quadrado com a seta) e depois em <b>Adicionar à Tela de Início</b>. O app abre em tela cheia e funciona sem internet.</p></div>';
  return h+'<p class="small keep">No menu do navegador, escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p></div>';
}
function fbkCfgHTML(){return '<div class="accsec" id="fbksec"><h2>Fale com a gente</h2><p class="small keep">Achou um erro ou tem uma ideia? Sua mensagem vai direto para a equipe.</p><div class="row"><button type="button" class="copy primary" data-fbk>Algo errado? Conte aqui</button></div></div>'}
aoFazer('ajustes montados',function(f){var a=$('#alsec')||$('#accsec');if(a&&!$('#fbksec'))a.insertAdjacentHTML('afterend',fbkCfgHTML()+pwaHTML())});
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#pwaGo')&&PWA.evt){PWA.evt.prompt();PWA.evt.userChoice.then(function(){PWA.evt=null;renderCfgKeep()},function(){})}});
/* service worker: só no site publicado (https) */
if(ON_SITE&&'serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')&&APP_VERSION!=='dev'){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
}
/* Gestão › Feedback */
GTABS.push(['feedback','Feedback']);TAB_PERM.feedback='avisos';
var FBKG={list:null,busy:false};
function fbkLoad(){
  if(FBKG.busy)return;FBKG.busy=true;
  var p=FB_ON?fbInit().then(function(fb){return fb.db.collection('feedback').limit(500).get()}).then(function(s){return s.docs.map(function(d){var o=d.data();o.id=d.id;return o}).sort(function(x,y){return (y.ts||0)-(x.ts||0)})}):Promise.resolve((function(){try{return JSON.parse(localStorage.getItem(FBK_LOCAL)||'[]').map(function(o,i){o.id='l'+i;return o})}catch(e){return []}})());
  p.then(function(l){FBKG.list=l;FBKG.busy=false;if(gTab==='feedback')renderGest()},function(){FBKG.list=[];FBKG.err=true;FBKG.busy=false;if(gTab==='feedback')renderGest()});
}
function gFeedback(){
  if(!FBKG.list){fbkLoad();return '<h3 class="gh">Feedback</h3><p class="muted small keep">Carregando…</p>'}
  var L=FBKG.list,notas=L.filter(function(o){return o.nota}),med=notas.length?(notas.reduce(function(s,o){return s+o.nota},0)/notas.length).toFixed(1).replace('.',','):'—';
  var cnt={};L.forEach(function(o){cnt[o.tipo]=(cnt[o.tipo]||0)+1});
  var nomes={erro:'Algo errado',ideia:'Sugestão',elogio:'Elogio',outro:'Outro',nota:'Só nota'};
  return '<h3 class="gh">Feedback</h3>'+(FBKG.err?'<p class="small keep">Sem acesso ao feedback. Publique as regras do Firestore (firestore.rules) no console do Firebase.</p>':'')+
    '<div class="la-nums fbk-sum"><span><b>'+L.length+'</b>respostas</span><span><b>'+med+'</b>nota média ('+notas.length+')</span><span><b>'+(cnt.erro||0)+'</b>erros</span><span><b>'+(cnt.ideia||0)+'</b>sugestões</span></div>'+
    '<div class="row"><button type="button" class="copy" id="fbkReload">Atualizar</button></div>'+
    '<ul class="fbk-list">'+L.filter(function(o){return o.txt}).map(function(o){return '<li><div class="fbk-h"><span class="pill">'+(nomes[o.tipo]||esc(o.tipo))+'</span>'+(o.nota?'<span class="pill">nota '+o.nota+'</span>':'')+'<small>'+new Date(o.ts).toLocaleString('pt-BR')+' · '+esc(o.tela||'')+' · '+esc(o.disp||'')+' · v'+esc(o.ver||'')+'</small></div><p>'+esc(o.txt)+'</p>'+(o.email?'<p class="small"><a href="mailto:'+esc(o.email)+'">Responder: '+esc(o.email)+'</a></p>':'')+'<button type="button" class="linkbtn" data-fbkdel="'+esc(o.id)+'">Apagar</button></li>'}).join('')+'</ul>'+
    (L.some(function(o){return o.txt})?'':'<p class="muted small keep">Nenhuma mensagem ainda.</p>');
}
aoFazer('gestão montada',function(){if(gTab==='feedback'&&$('#gBody')&&gcan('avisos'))$('#gBody').innerHTML=gFeedback()});
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('#fbkReload')){FBKG.list=null;renderGest();return}
  var d=e.target.closest&&e.target.closest('[data-fbkdel]');if(!d)return;var id=d.dataset.fbkdel;
  var p=FB_ON?fbInit().then(function(fb){return fb.db.collection('feedback').doc(id).delete()}):Promise.resolve((function(){try{var a=JSON.parse(localStorage.getItem(FBK_LOCAL)||'[]');a.splice(+id.slice(1),1);localStorage.setItem(FBK_LOCAL,JSON.stringify(a))}catch(x){}})());
  p.then(function(){FBKG.list=null;renderGest();gToast('Mensagem apagada.')},function(){gToast('Não deu para apagar.',1)});
});
/* ======================= v27: ônibus da cidade (GTFS da SMTR) que saem do Fundão ======================= */
var EXT={"fonte":"SMTR / Prefeitura do Rio (GTFS, CC BY 4.0)","ate":"20261231","stops":{"terminal":["Terminal Fundão (Aroldo Melodia)",-22.839378,-43.23959],"ccshospitalunive":["CCS - Hospital Universitário",-22.842503,-43.23629],"edsonabdallasaad":["Edson Abdalla Saad",-22.845853,-43.237793],"prefeituraufrj":["Prefeitura - UFRJ",-22.846725,-43.237614],"cenpes":["CENPES",-22.850584,-43.234749],"ctletras":["CT - Letras",-22.86029,-43.2277],"cepecenpes":["CEPE - CENPES",-22.855355,-43.235928],"helio":["Fundão · Rua Hélio de Almeida",-22.865332,-43.221536],"cetem":["CETEM",-22.860132,-43.221473],"belasartesreitor":["Belas Artes - Reitoria",-22.861717,-43.224511],"ccseefd":["CCS - EEFD",-22.843147,-43.233445],"polodebiotecnolo":["Polo de Biotecnologia",-22.841551,-43.231612],"ctccmn":["CT - CCMN",-22.85817,-43.231466],"ccmngeografia":["CCMN - Geografia",-22.857952,-43.233802],"cenpesgeografia":["CENPES - Geografia",-22.855826,-43.233003]},"lines":[{"n":"321","nm":"Bancários - Castelo","d":"Castelo","g":"centro","c":"#EA0A2A","brt":false,"st":[["terminal",0],["ccshospitalunive",2],["edsonabdallasaad",3],["prefeituraufrj",3],["cenpes",5],["ctletras",9]],"t":{"U":[284,299,314,335,344,353,362,371,380,403,410,417,424,431,438,445,452,459,469,479,489,503,515,522,538,552,564,574,590,603,615,627,639,651,663,675,687,699,711,723,735,745,760,772,784,796,800,815,830,845,860,873,881,889,898,910,922,940,947,959,971,983,995,1007,1019,1031,1043,1053,1063,1073,1083,1093,1103,1115,1127,1139,1151,1163,1175,1187,1191,1206,1231,1254,1294,1319,1354],"S":[330,350,370,390,410,430,450,470,490,510,530,550,577,607,634,654,674,694,724,754,784,814,844,874,904,934,964,994,1024,1054,1084,1114,1144,1174,1204,1231,1290,1320,1350]}},{"n":"321","nm":"Bancários - Castelo","d":"Bancários","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[395,425,455,485,515,545,575,605,635,665,695,725,754,774,794,814,834,854,875,905,935,965,995,1015,1035,1054,1069,1084,1099,1117,1137,1157,1175,1205,1235,1265,1293,1353,1413],"U":[348,363,378,400,415,430,440,455,465,475,485,495,505,515,525,535,541,547,553,561,569,580,600,615,630,645,660,675,690,708,718,728,738,748,759,768,777,789,801,813,825,837,849,861,873,885,897,912,927,942,952,960,968,976,986,996,1006,1016,1026,1036,1046,1060,1072,1084,1096,1108,1120,1132,1144,1156,1168,1180,1192,1197,1207,1217,1227,1237,1247,1257,1267,1273,1296,1326,1356,1381,1416]}},{"n":"323","nm":"Bananal - Castelo","d":"Castelo","g":"centro","c":"#EA0A2A","brt":false,"st":[["terminal",0],["ccshospitalunive",2],["edsonabdallasaad",3],["prefeituraufrj",3],["cenpes",5],["ctletras",9]],"t":{"U":[206,267,287,307,337,347,357,367,377,387,405,413,421,429,437,445,453,469,479,489,499,509,519,525,537,549,561,573,583,598,613,628,642,654,666,678,690,702,712,722,732,742,752,763,775,787,799,811,821,836,851,866,880,900,920,940,955,970,985,1000,1015,1030,1045,1060,1075,1090,1105,1117,1139,1161,1183,1205,1227,1249,1266,1290,1350],"S":[395,455,515,575,635,695,755,815,875,935,995]}},{"n":"323","nm":"Bananal - Castelo","d":"Bananal","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[264,329,349,369,395,407,419,431,443,455,467,479,491,503,515,527,539,551,563,576,591,606,621,636,651,666,681,696,711,726,741,759,771,783,795,807,817,832,847,862,877,892,907,922,937,952,967,982,1005,1017,1029,1041,1053,1065,1080,1095,1110,1125,1140,1155,1170,1178,1198,1218,1232,1262,1292,1322,1349,1409],"S":[456,516,576,636,696,756,816,876,936,996,1056]}},{"n":"324","nm":"Ribeira - Candelária","d":"Ribeira","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[333,363,396,411,426,441,456,471,486,501,516,531,546,561,574,594,614,634,654,674,698,713,728,743,755,775,795,817,832,847,862,877,889,901,913,925,936,951,966,981,997,1009,1021,1033,1045,1056,1071,1086,1101,1116,1136,1156,1176,1196,1216,1236,1266,1296,1326,1356,1386],"U":[335,347,359,371,383,402,410,418,426,434,442,450,458,466,474,482,490,498,506,514,522,530,538,546,554,562,567,577,597,617,637,657,677,698,713,728,743,759,779,799,819,839,859,880,895,910,925,940,948,956,964,972,980,988,1007,1014,1021,1028,1035,1042,1049,1056,1066,1076,1086,1096,1106,1116,1126,1136,1146,1156,1166,1176,1179,1191,1203,1215,1227,1235,1255,1275,1295,1315,1335,1352,1382],"D":[332,362,392,422,452,482,512,542,572,602,632,662,692,722,752,782,812,842,872,902,932,952,972,992,1012,1032,1052,1072,1092,1112,1132,1152,1177,1207,1237,1267,1297,1357]}},{"n":"325","nm":"Ribeira - Castelo","d":"Castelo","g":"centro","c":"#EA0A2A","brt":false,"st":[["terminal",0],["ccshospitalunive",1],["edsonabdallasaad",3],["prefeituraufrj",3],["cenpes",4],["ctletras",8]],"t":{"U":[268,334,354,374,394,414,434,454,474,494,523,553,583,613,643,673,703,733,763,793,823,853,883,913,943,973,998,1018,1038,1058,1088,1113,1173,1233,1293,1353]}},{"n":"325","nm":"Ribeira - Castelo","d":"Ribeira","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[331,395,425,455,485,515,545,575,605,635,665,695,725,755,785,815,845,875,905,938,958,978,1004,1034,1064,1094,1124,1154,1184,1214,1244,1274,1290,1350,1410]}},{"n":"326","nm":"Bancários - Candelária","d":"Bancários","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[207,267,336,366,395,415,435,455,475,495,515,535,555,574,604,634,664,697,717,737,757,777,797,817,837,857,879,894,909,924,936,956,976,996,1016,1036,1057,1087,1117,1147,1177,1197,1217,1237,1267,1294,1354,1414,1474],"D":[208,268,335,365,397,417,437,454,484,514,544,574,604,634,664,694,724,754,784,814,844,874,904,934,964,994,1024,1056,1076,1096,1116,1136,1156,1178,1208,1237,1297,1357,1413,1533],"U":[206,272,302,336,356,376,400,413,426,439,452,465,478,491,504,517,530,543,555,578,608,638,668,699,719,739,759,779,799,819,839,859,880,892,904,916,928,940,952,964,976,988,1000,1012,1024,1036,1048,1060,1072,1084,1096,1108,1124,1139,1154,1169,1179,1199,1219,1234,1264,1294,1324,1354,1384,1411,1471,1531]}},{"n":"327","nm":"Ribeira - Castelo","d":"Castelo","g":"centro","c":"#EA0A2A","brt":false,"st":[["terminal",0],["ccshospitalunive",2],["edsonabdallasaad",3],["prefeituraufrj",3],["cenpes",5],["ctletras",8]],"t":{"U":[201,241,294,328,363,398,433,482,522,561,608,668,728,788,848,906,936,967,1013,1073,1131,1176,1221,1262,1312,1362]}},{"n":"327","nm":"Ribeira - Castelo","d":"Ribeira","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[243,297,360,397,437,482,527,572,617,662,707,756,816,876,936,1004,1044,1084,1121,1166,1211,1256,1291,1331,1368,1413]}},{"n":"328","nm":"Bananal - Candelária","d":"Bananal","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[332,347,362,377,393,405,417,429,441,453,465,477,489,501,513,525,537,549,574,594,614,635,650,665,680,695,710,725,740,755,770,785,800,815,835,855,877,892,907,922,937,952,967,982,997,1009,1021,1033,1045,1057,1069,1081,1093,1105,1117,1137,1157,1177,1197,1217,1237,1257,1277,1296,1326,1354,1374,1394],"D":[330,393,423,453,473,493,513,533,553,573,593,613,633,653,673,693,713,733,752,782,812,832,852,875,905,932,952,972,992,1012,1032,1052,1072,1092,1112,1132,1152,1172,1192,1212,1237,1267,1297,1327,1357,1387],"U":[334,346,358,370,382,399,409,419,429,439,449,459,469,479,489,499,509,519,529,539,549,559,569,577,597,617,637,652,667,682,700,712,724,736,748,760,775,790,805,818,838,858,881,893,905,917,929,941,953,965,977,989,1001,1013,1025,1037,1049,1068,1078,1088,1098,1108,1118,1123,1135,1147,1159,1171,1178,1193,1208,1223,1234,1254,1274,1294,1314,1334,1354,1374,1394]}},{"n":"329","nm":"Bancários - Candelária","d":"Candelária","g":"centro","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[199,262,282,302,329,337,345,353,361,369,377,396,404,412,420,428,436,444,456,468,480,492,504,514,529,544,559,571,591,611,631,651,671,689,704,719,734,750,770,790,810,830,850,870,890,910,929,944,959,974,989,1004,1019,1034,1049,1064,1079,1094,1108,1130,1152,1174,1196,1218,1240,1257,1283,1343,1403],"D":[261,325,355,383,403,423,444,474,504,534,564,594,624,654,684,714,744,774,804,834,864,894,925,985,1015,1045,1075,1105,1135,1164,1224,1284,1344,1404],"S":[262,292,324,339,354,369,384,399,414,429,450,470,490,510,530,550,567,597,627,647,667,687,717,748,768,788,807,837,867,897,927,957,987,1017,1047,1077,1107,1137,1165,1225,1285,1345]}},{"n":"329","nm":"Bancários - Candelária","d":"Bancários","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[205,265,332,352,372,396,409,422,435,448,461,474,487,500,513,526,539,551,573,603,633,663,694,714,734,756,771,786,801,815,835,855,875,895,915,937,952,967,982,1002,1014,1026,1038,1050,1062,1074,1086,1098,1110,1119,1134,1149,1164,1175,1195,1215,1232,1262,1292,1322,1348,1408,1468],"S":[265,330,360,390,420,450,470,490,510,540,570,600,630,660,692,712,732,752,772,792,812,827,842,857,873,893,913,933,953,973,993,1013,1033,1053,1073,1093,1113,1133,1153,1171,1201,1232,1291,1321,1351,1381,1407,1467],"D":[329,359,389,419,449,479,509,539,569,599,629,659,689,719,749,779,809,839,869,889,909,930,960,990,1020,1053,1073,1093,1116,1146,1176,1206,1231,1293,1323,1353]}},{"n":"42","nm":"Galeão - Madureira","d":"Manacéia-Madureira","g":"norte","c":"#FF9900","brt":true,"st":[["terminal",0]],"t":{"U":[0,20,40,60,80,100,120,140,160,180,200,220,240,250,260,270,280,290,300,306,312,318,324,330,336,342,348,354,360,366,372,378,384,390,396,402,408,414,420,426,432,438,444,450,456,462,468,474,480,486,492,498,504,510,516,522,528,534,540,546,552,558,564,570,576,582,588,594,600,606,612,618,624,630,636,642,648,654,660,666,672,678,684,690,696,702,708,714,720,726,732,738,744,750,756,762,768,774,780,786,792,798,804,810,816,822,828,834,840,846,852,858,864,870,876,882,888,894,900,906,912,918,924,930,936,942,948,954,960,966,972,978,984,990,996,1002,1008,1014,1020,1026,1032,1038,1044,1050,1056,1062,1068,1074,1080,1086,1092,1098,1104,1110,1116,1122,1128,1134,1140,1146,1152,1158,1164,1170,1176,1182,1188,1194,1200,1206,1212,1218,1224,1230,1236,1242,1248,1254,1260,1266,1272,1278,1284,1290,1296,1302,1308,1314,1320,1328,1336,1344,1352,1360,1368,1376,1384,1392,1400,1408,1416,1424,1432,1440],"D":[0,20,40,60,80,100,120,140,160,180,200,220,240,255,270,285,300,310,320,330,340,350,360,370,380,390,400,410,420,430,440,450,460,470,480,490,500,510,520,530,540,550,560,570,580,590,600,610,620,630,640,650,660,670,680,690,700,710,720,730,740,750,760,770,780,790,800,810,820,830,840,850,860,870,880,890,900,910,920,930,940,950,960,970,980,990,1000,1010,1020,1030,1040,1050,1060,1070,1080,1090,1100,1110,1120,1130,1140,1150,1160,1170,1180,1190,1200,1208,1216,1224,1232,1240,1248,1256,1264,1272,1280,1288,1296,1304,1312,1320,1330,1340,1350,1360,1370,1380,1390,1400,1410,1420,1430],"S":[0,20,40,60,80,100,120,140,160,180,200,220,240,255,270,285,300,310,320,330,340,350,360,370,380,390,400,410,420,430,440,450,460,470,480,490,500,510,520,530,540,550,560,570,580,590,600,610,620,630,640,650,660,670,680,690,700,710,720,730,740,750,760,770,780,790,800,810,820,830,840,850,860,870,880,890,900,910,920,930,940,950,960,970,980,990,1000,1010,1020,1030,1040,1050,1060,1070,1080,1090,1100,1110,1120,1130,1140,1150,1160,1170,1180,1190,1200,1208,1216,1224,1232,1240,1248,1256,1264,1272,1280,1288,1296,1304,1312,1320,1330,1340,1350,1360,1370,1380,1390,1400,1410,1420,1430]}},{"n":"43","nm":"Terminal Fundão - Santa Efigênia","d":"Santa Efigênia","g":"oeste","c":"#FF9900","brt":true,"st":[["terminal",0]],"t":{"U":[300,310,320,330,340,350,360,370,380,390,400,410,420,430,440,450,460,470,480,490,500,510,520,530,540,960,970,980,990,1000,1010,1020,1030,1040,1050,1060,1070,1080,1090,1100,1110,1120,1130,1140,1150,1160,1170,1180,1190,1200]}},{"n":"485","nm":"Fundão - General Osório","d":"General Osório","g":"sul","c":"#EA0A2A","brt":false,"st":[["helio",0],["cetem",2],["belasartesreitor",4],["ctletras",5],["cenpes",8],["ccseefd",11],["polodebiotecnolo",14],["ccshospitalunive",16],["edsonabdallasaad",19],["prefeituraufrj",19],["ctccmn",23]],"t":{"U":[420,480,540,600,630,660,680,700,720,735,750,765,780,800,820,840,860,880,900,915,930,945,960,975,990,1005,1020,1040,1060,1080,1110,1140,1170,1200,1260],"S":[450,510,570,630,690,750,810]}},{"n":"616","nm":"Del Castilho - Fundão","d":"Metrô Del Castilho","g":"norte","c":"#EA0A2A","brt":false,"st":[["terminal",0],["ccshospitalunive",1],["edsonabdallasaad",3],["prefeituraufrj",3],["cenpes",4],["cepecenpes",6]],"t":{"U":[325,345,365,395,405,425,445,465,475,495,515,535,545,566,588,610,633,657,681,705,727,747,767,787,807,827,847,867,877,901,925,949,961,985,1009,1029,1039,1059,1079,1101,1128,1155,1185,1225,1265],"S":[360,420,480,540,600,660,720,780,840,900,960,1020,1080,1140,1200,1260],"D":[840,900,960,1020,1080,1140,1200]}},{"n":"634","nm":"Bananal - Saens Peña","d":"Bananal","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"D":[352,377,402,427,452,477,502,527,552,577,602,627,652,677,702,727,752,777,802,827,852,877,902,927,952,977,1002,1027,1052,1077,1102,1127,1152,1177,1202,1227,1252,1277,1302,1327,1361,1391,1421,1451,1471,1491,1514,1541,1591,1641,1691,1741],"S":[358,377,395,414,432,451,469,488,506,525,543,562,580,599,617,636,654,673,691,710,728,747,765,784,802,821,839,858,876,895,913,932,950,969,987,1006,1024,1043,1061,1080,1098,1117,1135,1154,1172,1191,1209,1228,1246,1265,1283,1302,1320,1339,1363,1393,1423,1453,1478,1494,1504,1514,1550,1600,1650,1700,1750],"U":[358,374,389,405,420,436,451,467,482,498,513,529,556,576,596,616,636,656,676,696,716,736,756,776,796,816,836,856,876,892,907,923,938,954,969,985,1000,1016,1031,1047,1062,1078,1093,1109,1124,1140,1155,1171,1186,1202,1217,1233,1248,1264,1279,1295,1310,1326,1341,1357,1360,1380,1400,1420,1440,1460,1480,1492,1502,1512,1549,1599,1649,1699,1749]}},{"n":"634","nm":"Bananal - Saens Peña","d":"Saens Peña","g":"tijuca","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"D":[267,292,317,342,367,392,417,442,467,492,517,542,567,592,617,642,667,692,717,742,767,792,817,842,867,892,917,942,967,992,1017,1042,1067,1092,1117,1142,1167,1192,1227,1257,1287,1317,1341,1361,1379,1411,1461,1511,1561,1611,1661],"U":[276,291,307,322,338,353,369,384,400,415,431,446,462,477,493,508,545,565,585,605,625,645,665,685,705,725,745,765,785,805,825,845,865,885,905,925,945,965,985,1005,1028,1044,1059,1074,1090,1106,1121,1136,1152,1168,1183,1198,1218,1238,1258,1278,1298,1318,1338,1358,1378,1397,1421,1471,1521,1571,1621,1671],"S":[276,294,313,331,350,368,387,405,424,442,461,479,498,516,535,553,572,590,609,627,646,664,683,701,720,738,757,775,794,812,831,849,868,886,905,923,942,960,979,997,1016,1034,1053,1071,1090,1108,1127,1145,1164,1182,1211,1241,1271,1301,1331,1355,1375,1395,1423,1473,1523,1573,1623,1673]}},{"n":"635","nm":"Bananal - Saens Peña","d":"Bananal","g":"ilha","c":"#EA0A2A","brt":false,"st":[["ccmngeografia",0],["cenpesgeografia",1],["ctccmn",2],["ctletras",5],["belasartesreitor",6],["cetem",7],["cenpes",12],["ccseefd",15],["polodebiotecnolo",17],["ccshospitalunive",19],["terminal",21]],"t":{"U":[450,510,570,630,690,931,1051]}},{"n":"635","nm":"Bananal - Saens Peña","d":"Saens Peña","g":"tijuca","c":"#EA0A2A","brt":false,"st":[["terminal",0],["ccshospitalunive",1],["edsonabdallasaad",3],["ccseefd",5],["polodebiotecnolo",7],["prefeituraufrj",10],["cenpes",11],["ctccmn",14],["ctletras",16],["belasartesreitor",18],["cetem",19]],"t":{"U":[398,458,518,578,638,698,937]}},{"n":"663","nm":"Méier - Fundão","d":"Méier","g":"norte","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[480,540]}},{"n":"696","nm":"Méier - Praia do Dendê","d":"Praia do Dendê","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"D":[334,397,427,457,487,517,547,577,607,637,667,697,727,757,787,817,847,877,907,937,967,1000,1062,1092,1122,1152,1185,1245,1305],"S":[276,338,368,399,419,439,459,479,499,519,539,559,579,599,619,639,659,679,706,721,736,751,764,784,804,824,844,864,884,904,924,944,964,984,1004,1024,1044,1064,1084,1104,1122,1152,1182,1212,1242,1272,1302,1332],"U":[279,309,344,356,368,380,392,410,417,424,431,438,445,452,459,472,482,492,502,512,522,529,541,553,565,577,587,602,617,632,647,662,677,692,710,720,730,740,750,760,766,778,790,802,814,826,838,850,862,874,888,898,908,918,928,938,948,958,968,978,988,998,1016,1024,1032,1040,1048,1056,1064,1076,1088,1100,1112,1124,1129,1144,1159,1174,1189,1204,1219,1234,1239,1259,1279,1298,1328]}},{"n":"696","nm":"Méier - Praia do Dendê","d":"Méier","g":"norte","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[340,355,370,385,400,415,430,445,460,475,490,505,520,535,550,565,587,607,627,650,665,680,695,710,722,734,746,758,768,788,808,830,844,860,874,888,908,928,948,968,988,1007,1037,1069,1089,1109,1129,1149,1169,1185,1215,1245,1275,1305,1335,1365],"U":[349,355,361,367,373,379,385,391,397,403,409,415,421,427,433,439,445,451,457,463,481,489,497,505,513,521,529,541,553,565,577,589,594,609,624,639,650,662,674,686,698,711,719,727,735,743,751,759,776,786,796,806,816,826,833,845,857,869,881,892,902,912,922,932,942,954,962,970,978,986,994,1002,1021,1029,1037,1045,1053,1061,1069,1079,1089,1099,1109,1119,1129,1132,1152,1172,1192,1212,1232,1252,1272,1292,1302,1362],"D":[340,370,400,430,460,490,523,543,563,586,616,646,676,706,736,766,796,826,856,886,916,946,1006,1036,1066,1096,1126,1156,1186,1246,1306,1366]}},{"n":"90","nm":"Terminal Fundão - Terminal Gentileza","d":"Terminal Gentileza","g":"centro","c":"#8a1812","brt":true,"st":[["terminal",0]],"t":{"U":[246,253,260,267,274,281,288,295,302,309,316,323,330,337,344,351,358,365,372,379,386,393,400,407,414,421,428,435,442,449,456,463,470,477,484,491,498,505,512,519,526,533,540,550,560,570,580,590,600,610,620,630,640,650,660,670,680,690,700,710,720,730,740,750,760,770,780,790,800,810,820,830,840,850,860,870,880,890,900,907,914,921,928,935,942,949,956,963,970,977,984,991,998,1005,1012,1019,1026,1033,1040,1047,1054,1061,1068,1075,1082,1089,1096,1103,1110,1117,1124,1131,1138,1145,1152,1159,1166,1173,1180,1187,1194,1201,1208,1215,1222,1229,1236,1243,1250,1257,1264,1274,1284,1294,1304,1314,1324,1334,1344,1354,1364,1374,1384,1394,1404,1414,1424,1434,1444],"D":[245,255,265,275,285,295,305,315,325,335,345,355,365,375,385,395,405,415,425,435,445,455,465,475,485,495,505,515,525,535,545,555,565,575,585,595,605,615,625,635,645,655,665,675,685,695,705,715,725,735,745,755,765,775,785,795,805,815,825,835,845,855,865,875,885,895,905,915,925,935,945,955,965,975,985,995,1005,1015,1025,1035,1045,1055,1065,1075,1085,1095,1105,1115,1125,1135,1145,1155,1165,1175,1185,1195,1205,1215,1225,1235,1245,1255,1265,1275,1285,1295,1305,1315,1325,1335,1345,1355,1365,1375,1385,1395,1405,1415,1425,1435,1445],"S":[246,256,266,276,286,296,306,316,326,336,346,356,366,376,386,396,406,416,426,436,446,456,466,476,486,496,506,516,526,536,546,556,566,576,586,596,606,616,626,636,646,656,666,676,686,696,706,716,726,736,746,756,766,776,786,796,806,816,826,836,846,856,866,876,886,896,906,916,926,936,946,956,966,976,986,996,1006,1016,1026,1036,1046,1056,1066,1076,1086,1096,1106,1116,1126,1136,1146,1156,1166,1176,1186,1196,1206,1216,1226,1236,1246,1256,1266,1276,1286,1296,1306,1316,1326,1336,1346,1356,1366,1376,1386,1396,1406,1416,1426,1436,1446]}},{"n":"901","nm":"Bonsucesso - Bananal","d":"Bananal","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[310,362,418,473,535,601,656,703,756,814,874,934,992,1050,1105,1171,1230,1292,1344,1394],"U":[355,415,475,535,595,655,716,796,876,956,1036,1116,1196,1266,1333,1393],"D":[311,372,439,506,559,629,691,755,814,878,923,986,1052,1110,1179,1236,1292,1352]}},{"n":"910","nm":"Bananal - Irajá","d":"Bananal","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[264,324,384,449,479,514,574,634,694,755,785,815,845,872,932,992,1054,1084,1113,1173,1233,1293,1353],"U":[209,267,297,327,357,402,417,432,447,465,495,525,555,583,640,670,700,730,758,816,846,876,906,936,966,996,1026,1056,1086,1116,1146,1176,1206,1231,1291,1351,1411],"D":[325,385,445,505,565,625,685,745,805,865,925,985,1045,1105,1165,1225,1285,1345]}},{"n":"910","nm":"Bananal - Irajá","d":"Irajá","g":"norte","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[205,265,332,362,392,422,452,482,512,542,572,602,642,702,767,797,827,857,887,917,947,977,1007,1037,1068,1088,1108,1124,1184,1244,1304,1364],"S":[207,267,327,387,447,507,567,627,687,747,807,879,909,938,998,1058,1118,1178,1238,1298],"D":[268,328,388,448,508,568,628,688,748,808,868,928,988,1048,1108,1168,1228,1288]}},{"n":"913","nm":"Del Castilho - Fundão","d":"Metrô Del Castilho","g":"norte","c":"#EA0A2A","brt":false,"st":[["terminal",0],["ccshospitalunive",1],["edsonabdallasaad",3],["prefeituraufrj",3],["cenpes",4],["cepecenpes",6]],"t":{"U":[300,360,390,420,450,480,540,600,660,720,750,780,840,900,930,960,990,1020,1050,1080,1140,1200,1260,1320],"D":[360,420,480,540,600,660,720,780,840],"S":[370,430,490,550,610,670,730,790,850,910,970,1030,1090,1150,1210,1270]}},{"n":"915","nm":"Bonsucesso - Aeroporto Internacional do RJ","d":"Aeroporto Internacional","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[252,312,372,432,492,552,612,672,732,792,852,912,972,1032,1092,1152,1212,1272],"D":[312,372,432,492,552,612,672,732,792,852,912,972,1032,1092,1152,1212,1272,1332],"S":[250,310,370,430,490,550,610,670,730,790,850,910,970,1030,1090,1150,1210,1270,1330]}},{"n":"922","nm":"Tubiacanga - Terminal Fundão","d":"Tubiacanga","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[360,420,480,540,600,660,720,780,840,900,960],"D":[420,480,540,600,660,720,780,840,900,960],"U":[360,420,480,540,600,660,720,780,840,900,960,1020,1080,1140,1200,1260,1320]}},{"n":"975","nm":"Madureira - Terminal Fundão","d":"Madureira","g":"norte","c":"#1DA527","brt":false,"st":[["terminal",0]],"t":{"U":[240,270,300,330,360,390,420,450,487,502,517,532,547,562,577,592,607,622,637,652,667,682,697,712,727,742,757,772,787,802,817,832,870,900,930,960,990,1027,1042,1057,1072,1087,1102,1117,1132,1147,1162,1177,1192,1210,1230,1250,1270,1290]}},{"n":"979","nm":"Terminal Madureira - Terminal Fundão","d":"Terminal Madureira","g":"norte","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[270,300,325,350,375,400,425,450,475,500,525,550,575,600,625,650,675,700,725,750,775,800,825,850,875,900,925,950,975,1000,1025,1050,1075,1100,1125,1150,1175,1200,1225,1250,1275,1300,1325,1350],"D":[330,375,420,465,510,540,570,600,630,660,690,720,750,780,810,840,870,900,930,960,990,1020,1050,1080,1110,1140,1170,1200,1230,1275,1320],"S":[270,300,330,360,390,420,450,480,510,540,570,600,630,660,690,720,750,780,810,840,870,900,930,960,990,1020,1050,1080,1110,1140,1170,1200,1230,1260,1290,1320,1350]}},{"n":"SN324","nm":"Ribeira - Candelária","d":"Ribeira","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[1418,1478,1538,1598,1658,1713,1743],"U":[1422,1447,1482,1517,1554,1579,1615,1658,1735,1750],"D":[1415,1475,1535,1595,1655,1715]}},{"n":"SN328","nm":"Bananal - Candelária","d":"Bananal","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[1418,1476,1506,1536,1566,1593,1653,1713,1743],"D":[1415,1477,1507,1536,1596,1656,1716],"U":[1412,1442,1472,1502,1526,1586,1646,1713,1743]}},{"n":"SN696","nm":"Méier - Praia do Dendê","d":"Praia do Dendê","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"S":[1358,1418,1478,1538,1598,1658],"U":[1355,1415,1475,1535,1595,1655],"D":[1355,1415,1475,1535,1595,1655]}},{"n":"SN696","nm":"Méier - Praia do Dendê","d":"Méier","g":"norte","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"D":[1419,1479,1539,1599,1659,1719],"S":[1424,1484,1544,1604,1664,1721,1751],"U":[1424,1484,1544,1604,1664,1724,1739,1754,1769]}},{"n":"SP324","nm":"Ribeira - Terminal Fundão","d":"Ribeira","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[300,360,420,480,540,600,660,720,780,840,900,960,1020,1050,1080,1110,1140,1200,1260,1320]}},{"n":"SP328","nm":"Bananal - Terminal Fundão","d":"Bananal","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[240,300,360,380,400,420,450,480,510,540,570,600,660,720,780,840,870,900,930,960,980,1000,1020,1032,1044,1056,1068,1080,1100,1120,1140,1170,1200,1260,1320,1440]}},{"n":"SP329","nm":"Bancários - Terminal Fundão","d":"Bancários","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[300,360,420,480,540,600,660,720,780,840,900,960,1020,1080,1140,1200,1260,1320,1380]}},{"n":"SP635","nm":"Terminal Fundão - Saens Peña","d":"Saens Peña","g":"tijuca","c":"#EA0A2A","brt":false,"st":[["terminal",0],["ccshospitalunive",1],["edsonabdallasaad",3],["ccseefd",5],["polodebiotecnolo",8],["prefeituraufrj",10],["cenpes",11],["ctccmn",14],["ctletras",17],["belasartesreitor",18],["cetem",19]],"t":{"U":[420,480,540,600,660,720,780,840,900,960,1020,1080]}},{"n":"SPB326","nm":"Bancários - Terminal Fundão","d":"Bancários","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[300,360,420,480,540,600,660,720,780,840,900,960,1020,1080,1110,1140,1170,1200,1260,1320]}},{"n":"SR328","nm":"Bananal - Candelária","d":"Bananal","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[1006,1036,1096]}},{"n":"SV922","nm":"Tubiacanga - Fundão","d":"Tubiacanga","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[300,360,420,480,540,600,660,720,780,840,900,960,1020,1080,1140,1200,1260,1320,1380],"D":[240,300,360,420,480,540,600,660,720,780,840,900,960,1020,1080,1140,1200,1260,1320,1380,1440],"S":[300,360,420,480,540,600,660,720,780,840,900,960,1020,1080,1140,1200,1260,1320,1380]}},{"n":"SVB901","nm":"Bonsucesso - Bananal","d":"Bananal","g":"ilha","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[381,441,501,561,621,681,741,801,861,921,981,1041,1101,1161,1221]}},{"n":"SVB901","nm":"Bonsucesso - Bananal","d":"Bonsucesso","g":"norte","c":"#EA0A2A","brt":false,"st":[["terminal",0]],"t":{"U":[394,454,514,574,634,694,754,814,874,934,994,1054,1114,1174,1234]}}],"sh":{"979":[0,48,49],"SP329":[1,68],"321":[2,8],"634":[3,6],"SP485":[4],"975":[5,53],"910":[7,28],"323":[8,62],"696":[9,69],"SP328":[10,1],"328":[11,12,40],"663":[13,64],"43":[14,37],"90":[15,16,60],"325":[2,8],"SR328":[17,18,19],"SN696":[20,67],"913":[21,22,23],"915":[24,25],"922":[26,27],"42":[29,33,34],"SN328":[30,31,32,38],"327":[35,55],"635":[36,45],"616":[39,23,51],"SV922":[26,54,32],"SP635":[41,63],"901":[42,59],"SPB326":[43,1],"324":[11,44,50],"485":[4,66],"326":[11,44,50],"SP324":[1,46],"SVB901":[47,65],"486":[11,52],"329":[56,11,44],"SN324":[11,57,58,61]},"shp":[[-3952,-3949,-39,38,17,23,18,5,39,-44,74,-64,5,-11,1,-31,-65,-76,-7,-15,3,-17,62,-54,8,-18,2,-20,-6,-15,-12,-10,-17,-3,-33,13,-79,62,-62,108,-51,61,-52,37,-41,17,-64,11,-146,-18,-214,-75,-27,-34,-9,-23,-11,-130,-38,-230,-12,-122,-17,-41,-35,-50,-52,-41,-27,-13,-50,-16,-337,-44,-422,-5,-216,-11,-477,-10,7,-83,-15,-168,8,-2,65,-330,-83,-21,-195,-85,-21,-15,-34,-48,-563,195,-7,25,13,53,-14,74,-17,6,-8,-8,-4,-31,38,-346,44,-94,7,-89,16,-83,-20,-40,-18,-10,-31,-3,-101,22,-1,39,-18,23,-334,140,-141,117,-130,78,-96,105,-41,28,-41,12,-120,-5,-17,-5,-84,-51,-13,-11,67,-62,82,-114,83,-223,69,-120,53,-67,71,-56,17,-23,35,-86,16,-70,4,-98,-5,-99,-46,-160,-25,-73,-42,-73,-59,-78,-40,-67,-37,-87],[-3926,-3958,-61,52,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,17,-9,29,-9,50,-1,349,33,28,24,5,20,-24,98,-2,36,7,59,19,45,88,111,67,60,44,29,138,67,141,87,284,232,28,37],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-22,-10,-28,8,-12,10,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,56,69,-1,18,-127,115,21,44,-19,55,-386,279,-20,-7,-33,-42,-90,-140,-20,-22,-19,-15,-31,-10,-36,0,-36,9,-880,641,-92,55,-107,26,-29,21,-21,19,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-180,-288,-38,-40,-83,-126,-25,-28,-12,-30,-94,-151,-25,-33,-27,-12,-29,5,-71,38,-64,22,-301,43,-75,5,-379,-18,-92,9,-119,30,-107,48,-198,134,-160,151,-128,105],[-8430,-4884,940,-354,431,-156,210,-72,133,-38,16,15,196,677,-323,53,-120,29,-130,57,-63,34,-24,-7,-10,-13,-4,-15,4,-22,9,-11,10,1,21,25,75,140,3,20,-3,17,-12,11,-43,0,-38,-9,-9,-12,1,-26,23,-13,113,35,34,-14,14,-28,13,-85,33,-42,120,-29,240,-39,180,-15,1075,29,133,8,70,12,93,40,64,41,84,73,128,144,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,46,-18,26,-2,373,34,28,24,5,20,-24,98,-2,36,7,59,19,45,54,73,101,98,44,29,138,67,141,87,64,49,220,183,84,120],[-8375,-2852,181,-164,138,-94,105,-60,61,-24,109,-30,134,-8,315,19,88,-4,248,-37,258,-26,80,-15,182,-62,63,-31,38,-7,18,3,24,14,168,156,36,16,19,1,21,-5,66,-43,89,-39,234,-178,29,5,127,204,49,86,-1,13,-43,38,-92,55,-107,26,-23,-8,-12,-11,-105,-173,-27,-39,-13,-2,-6,18,138,220,-2,35,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-18,14,-11,23,2,25,12,20,22,12,24,-2,279,448,10,48,-5,38,12,11,14,-8,3,-9,-17,-82,-277,-461,7,-13,2,-29,8,-11,340,-248,51,-25,97,-23,26,-15,24,-21,62,-97,29,-31,716,-516,29,-13,61,-6,316,69,54,30,38,49,335,535,7,-4,5,-7,-352,-568,7,-33,277,-199,25,2,82,-60,0,-17,-10,-5,-380,273,-20,-7,-33,-42,-90,-140,-20,-22,-19,-15,-31,-10,-36,0,-36,9,-880,641,-92,55,-107,26,-29,21,-21,19,-30,53,-37,47,-53,49,-315,225,-14,4,-34,-9,-20,9,-18,30,2,25,-326,243,104,169],[-3954,-3949,-37,38,17,23,18,5,39,-44,74,-64,5,-11,1,-31,-65,-76,-7,-15,3,-17,62,-54,8,-18,2,-20,-6,-15,-12,-10,-17,-3,-33,13,-79,62,-62,108,-51,61,-52,37,-41,17,-64,11,-146,-18,-214,-75,-27,-34,-9,-23,-11,-130,-38,-230,-6,-90,46,-133,104,17,11,-8,91,-252,544,-501,56,-66,137,-227,666,-1240],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,57,75,-8,22,-120,103,-2,7,17,23,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-15,3,-17,62,-54,8,-18,2,-20,-6,-15,-12,-10,-17,-3,-18,5,-73,49,-29,32,-54,97,-35,45,-50,42,-59,28,-64,11,-43,-2,-128,-22,-92,-31,-97,-38,-32,-44,-15,-143,-26,-146,-26,-213,-32,-63,-18,-21,-52,-41,-27,-13,-50,-16,-337,-44,-1116,-24,8,-85,-15,-168,8,-2,65,-330,-83,-21,-195,-85,-21,-15,-34,-48,-539,185,-600,230,-22,1,-73,-14,-31,5,-104,46,-256,97,-32,18,-44,58,-71,24],[-4216,-6996,-5,40,-35,60,-24,25,-45,16,-100,13,-1029,813,-7,14,229,281,93,167,110,-88,251,251,50,15,192,29,-15,151,150,179,-204,185,-63,45,-53,28,-66,19,-56,6,-72,-14,-197,-19,-33,-17,-6,-19,7,-19,27,-9,12,7,8,16,5,56,11,28,26,24,58,26,55,43,199,221,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,46,-18,26,-2,373,34,28,24,5,20,-24,98,1,77,14,46,29,53,68,75,67,60,44,29,138,67,141,87,64,49,224,187,80,116],[-8375,-2852,181,-164,138,-94,105,-60,119,-42,51,-12,94,-8,355,19,88,-4,248,-37,258,-26,149,-35,109,-46,73,-53,114,-162,64,-68,41,-32,94,-51,134,-35,312,-59,131,-42,550,-220,50,-14,40,-6,67,1,96,26,145,85,143,51,51,37,82,-14,81,-2,59,-18,62,-39,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,6,-28,-8,-18,-60,-69,-7,-15,3,-17,76,-66,46,-18,26,-2,373,34,16,9,12,15,5,34,-24,84,1,77,23,63,54,73,101,98,44,29,138,67,141,87,64,49,220,183,84,120],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,56,69,-1,18,-126,113,-2,7,26,28,9,0,39,-44,77,-67,5,-36,-67,-79,-7,-15,3,-17,62,-54,10,-32,-6,-21,-12,-10,-17,-3,-18,5,-73,49,-29,32,-54,97,-35,45,-68,53,-62,23,-86,3,-103,-16,-198,-66,-27,-20,-25,-46,-11,-130,-38,-230,-6,-90,-14,-55,-26,-47,-36,-38,-61,-37,-50,-16,-337,-44,-1158,-26,-119,6,-324,50,-39,-1,-22,-9,-58,-52,-33,-57,-24,-13,-134,-21,-39,-36,-19,-47,-20,-143,7,-121,37,-340,44,-94,7,-89,16,-83,-20,-40,-18,-10,-31,-3,-101,22,-1,39,-18,23,-334,140,-141,117,-130,78,-96,105,-41,28,-41,12,-120,-5,-17,-5,-99,-65,-111,86],[-2535,-3293,-330,-271,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,38,-132,14,-32,24,-32,100,-73,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,57,71,1,27,-5,11,-61,51],[-8498,-2605,20,-27,18,-52,-9,-58,-31,-93],[-8404,-3597,266,-245,491,-335,359,-286,161,-120,81,-51,74,-37,70,-25,332,-59,144,-15,1111,29,133,8,88,19,75,33,64,41,84,73,128,144,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,46,-18,26,-2,373,34,28,24,5,20,-24,98,-2,36,7,59,19,45,54,73,101,98,44,29,138,67,141,87,64,49,220,183,84,120],[-3937,-3964,-54,53,17,23,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-15,3,-17,62,-54,8,-18,2,-20,-6,-15,-12,-10,-17,-3,-33,13,-79,62,-62,108,-51,61,-52,37,-41,17,-64,11,-146,-18,-214,-75,-27,-34,-9,-23,-11,-130,-38,-230,-6,-90,-14,-55,-26,-47,-36,-38,-61,-37,-50,-16,-337,-44,-1158,-27,-119,7,-324,50,-39,-1,-33,-17,-47,-44,-33,-57,-24,-13,-121,-17,-22,-9,-30,-31,-19,-47,-18,-117,-3,-65,45,-422,44,-94,7,-89,16,-83,-20,-40,-33,-15,-117,24,-1,39,-18,23,-334,140,-141,117,-130,78,-96,105,-41,28,-41,12,-120,-5,-17,-5,-99,-65,-111,86],[-3948,-3980,-58,41,-44,-60,-37,33,-83,45,-36,8,-82,3,-40,10,-104,54,-39,0,-47,-34,-73,-75,-36,-44,-21,-37,-39,-307,-26,-82,-56,-49,-179,-195,-141,-178,-23,-11,-28,-2,-192,36,-18,-7,-7,-10,-82,-164,-60,-194,0,-41,47,-210,-16,-26,-291,-256,19,-48,13,-73,12,-10,56,-18,32,-17,151,-114,59,-86,64,-63,255,-198,77,-51,181,-142,49,-45,215,-162,154,-131,68,-69,19,-31],[-8498,-2655,12,-54,-5,-64],[-8354,-3659,95,-92,153,-131,511,-352,411,-323,104,-78,35,-19,99,-44,109,-29,393,-59,852,24,27,-9,156,2,27,-18,14,-43,-74,-166,-10,-32,9,-37,-3,-8,-14,-7,-8,4,-5,14,29,84,73,151,24,7,220,-41,38,14,49,53,131,173,177,189,16,28,37,117,22,205,10,48,36,59,116,117,31,16,28,-1,121,-57,108,-8,68,-21,82,-59,30,-39,111,-79,9,3,31,36,-84,71],[-2535,-3293,-330,-271,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,52,-164,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-17,11,-30,7,-358,-34,-90,-26,-39,1,-33,13,-79,62,-62,108,-35,45,-68,53,-62,23,-43,5,-146,-18,-198,-66,-27,-20,-16,-23,-9,-23,-11,-130,-38,-230,-12,-122,-17,-41,-35,-50,-52,-41,-77,-29,-337,-44,-1189,-18,-89,5,-185,27,-229,46,-107,42,-78,42,-356,269,-261,206,-421,293,-68,55],[-8494,-2654,14,-86,-14,-66],[-8317,-3690,141,-135,71,-56,444,-300,548,-427,102,-58,65,-26,155,-37,222,-35,156,-16,623,16,52,14,423,9,133,8,88,19,75,33,64,41,84,73,128,144,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,46,-18,26,-2,373,34,28,24,5,20,-24,98,-2,36,7,59,19,45,88,111,67,60,44,29,138,67,141,87,284,232,28,37],[-2535,-3293,-330,-271,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,52,-164,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,56,69,-1,18,-126,113,-2,7,26,28,9,0,39,-44,77,-67,5,-36,-67,-79,-7,-15,3,-17,62,-54,10,-32,-6,-21,-12,-10,-17,-3,-18,5,-73,49,-29,32,-54,97,-35,45,-68,53,-62,23,-86,3,-103,-16,-198,-66,-27,-20,-25,-46,-11,-130,-38,-230,-6,-90,-11,-46,-29,-56,-36,-38,-61,-37,-50,-16,-337,-44,-1058,-26,-219,6,-324,50,-39,-1,-22,-9,-58,-52,-33,-57,-24,-13,-134,-21,-39,-36,-19,-47,-20,-143,7,-121,37,-340,44,-94,7,-89,16,-83,-20,-40,-18,-10,-31,-3,-101,22,-1,39,-18,23,-334,140,-141,117,-130,78,-96,105,-41,28,-41,12,-120,-5,-17,-5,-99,-65,-111,86],[-7445,-6977,85,176,21,37,50,64,41,78,33,82,44,158,3,252,12,191,-11,61,0,52,-15,130,-2,124,-35,311,-6,145,49,320,42,115,234,423,71,101,77,77,58,41,72,40,201,71,80,35,59,41,24,31,137,220,63,106,6,19,1,48,-19,45,-93,78,-12,19,1,41,26,32,27,8,32,-5,66,-43,89,-39,234,-178,29,5,176,290,-1,13,-7,8,-93,67,-35,18,-107,26,-23,-8,-12,-11,-127,-206,-8,-8,-14,3,-2,15,138,220,-2,35,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-25,25,-4,25,7,23,29,21,24,-2,279,448,9,31,-4,55,4,6,8,5,9,-4,8,-13,-17,-82,-277,-461,7,-13,2,-29,8,-11,340,-248,51,-25,97,-23,26,-15,24,-21,62,-97,29,-31,716,-516,29,-13,61,-6,316,69,54,30,38,49,335,535,7,-4,5,-7,-352,-568,1,-20,12,-18,268,-192,8,3,32,48,15,5,39,-40,33,-24,11,-24,-17,-75,3,-23,53,-68,65,-56,12,-39,-11,-9,-18,10,-68,57],[-3937,-3964,-53,48,21,44,-12,41,-13,20,-380,273,-20,-7,-33,-42,-90,-140,-20,-22,-19,-15,-31,-10,-36,0,-36,9,-567,414,-19,-12,-177,-283,-20,-10,-439,322,-31,9,-18,-4,-120,-172,-210,-338,-27,-33,-49,-31,-62,-27,-11,-14,-34,-11,-19,1,-149,-51,-88,-51,-50,-37,-75,-75,-46,-64,-64,-109,-214,-393,-14,-45,-14,-81,3,-37,-9,-64,-13,-34,-18,-117,-3,-65,45,-422,44,-94,7,-89,16,-83,-6,-200,-15,-104,-8,-151,-29,-176,-108,-220],[-8045,-6911,4,16,12,-4,23,-83,12,-16],[-6875,-5473,-273,91,-4,14,9,7,294,-105,237,-73,15,6,8,17,70,241,88,-31,134,20,21,-112,53,-1,302,39,35,19,74,70,48,20,94,18,103,5,32,11,34,-6,18,-18,53,1,37,8,66,37,40,41,33,48,106,218,155,86,4,20,-5,6,-26,6,-92,-8,-33,-19,-6,-19,7,-19,27,-9,12,7,8,16,5,56,11,28,26,24,58,26,55,43,199,221,29,58,31,104,28,227,14,29,63,92,32,31,31,15,52,7,136,-51,115,-8,59,-18,62,-39,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,6,-28,-8,-18,-60,-69,-7,-15,3,-17,76,-66,46,-18,50,-1,349,33,10,5,18,19,5,20,-24,98,1,77,23,63,54,73,101,98,44,29,138,67,103,62,156,120,59,62,36,66,70,74,89,110],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-40,120,-22,26,-21,13,-23,4,-58,-4,-319,-35,-84,-20,-31,1,-59,28,-33,25,-49,66,-32,63,-29,39,-32,34,-25,17,-56,26,-35,8,-115,1,-34,-13,-44,-7,-181,-63,-20,-12,-22,-29,-9,-23,-11,-130,-38,-230,-12,-122,-28,-60,-29,-37,-27,-23,-43,-25,-58,-17,-210,-19,-154,-22,-367,-7,-46,-439,116,7,34,9,19,-6,18,-18,25,-1,65,10,31,14,43,-97,53,-99,57,-86,-27,-50,-63,-82,-237,-293,-178,150,-117,113,-142,47,-86,56,-172,131,-59,26,-21,-1,-48,-16,-195,-85,-21,-15,-34,-48,-266,94],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,56,69,0,34,-91,80],[-3953,-3935,-34,29,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,17,-9,29,-9,50,-1,349,33,28,24,5,20,-24,98,-2,36,7,59,39,81,68,75,67,60,44,29,138,67,141,87,288,236,29,40],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,56,69,-1,18,-126,113,-2,7,26,28,9,0,39,-44,77,-67,5,-36,-67,-79,-7,-15,3,-17,62,-54,8,-18,2,-20,-6,-15,-12,-10,-17,-3,-18,5,-73,49,-29,32,-54,97,-35,45,-68,53,-62,23,-43,5,-43,-2,-128,-22,-173,-60,-27,-20,-16,-23,-9,-23,-11,-130,-38,-230,-12,-122,-34,-70,-36,-38,-34,-24,-77,-29,-337,-44,-397,-7,-47,-437,116,7,34,9,19,-6,18,-18,25,-1,65,10,31,14,43,-97,53,-99,57,-86,36,-40,214,-175,207,-263,164,-101,-6,-67,275,-90,-24,-59,376,-314,7,-19,-235,-214,-15,-33,3,-101],[-3948,-3980,-58,41,-44,-60,-37,33,-84,46,-44,8,-73,2,-40,10,-104,54,-39,0,-47,-34,-90,-95,-40,-61,-39,-307,-26,-82,-56,-49,-179,-195,-141,-178,-23,-11,-28,-2,-192,36,-18,-7,-7,-10,-82,-164,-60,-194,0,-41,47,-210,-16,-24,-291,-258,19,-48,13,-73,12,-10,56,-18,32,-17,151,-114,59,-86,64,-63,255,-198,77,-51,181,-142,49,-45,215,-162,154,-131,75,-79],[-8498,-2605,20,-27,18,-52,-20,-106,-18,-46],[-8404,-3597,266,-245,491,-335,359,-286,161,-120,81,-51,74,-37,70,-25,332,-59,144,-15,1111,29,133,8,70,12,124,58,88,68,138,147,19,25,29,58,31,104,28,227,14,29,63,92,32,31,31,15,52,7,136,-51,115,-8,59,-18,62,-39,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,6,-28,-8,-18,-60,-69,-7,-15,3,-17,76,-66,46,-18,50,-1,349,33,10,5,18,19,5,20,-24,98,1,77,23,63,54,73,101,98,44,29,138,67,103,62,156,120,59,62,36,66,70,74,89,110],[-2523,-3188,-62,-86,-25,-25,0,-14,17,-8,31,35],[-4347,-6969,-75,79,-102,88,-267,205,-67,45,-54,57,-109,85,-160,113,-172,136,-64,63,-59,86,-151,114,-32,17,-73,23,-11,9,-16,117,280,249,11,23,1,23,-44,193,-1,47,68,219,66,139,15,18,16,1,220,-41,38,14,21,21,120,157,228,255,41,127,31,251,44,66,107,110,26,14,39,0,104,-54,40,-10,82,-3,35,-7,106,-62,36,-44,109,-82,34,28,16,21,0,10,-128,108,-15,-3,-37,-55,21,-27,171,-138,52,-7,32,6,59,30,189,145,117,112,158,166,41,25,78,20,41,17,160,103,81,57,338,283],[-2543,-3232,-307,-258,-81,-57,-160,-103,-124,-35,-29,-18,-158,-166,-111,-105,-78,-64,-173,-119,-41,-11,-48,5,-65,45,48,59,0,10,-78,69],[-8375,-2852,181,-164,138,-94,105,-60,119,-42,77,-15,108,-5,315,19,88,-4,248,-37,258,-26,149,-35,109,-46,73,-53,114,-162,64,-68,68,-50,64,-33,76,-24,373,-70,131,-42,550,-220,50,-14,40,-6,67,1,96,26,145,85,143,51,51,37,82,-14,81,-2,59,-18,62,-39,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,6,-28,-8,-18,-60,-69,-7,-15,3,-17,76,-66,46,-18,26,-2,373,34,16,9,12,15,5,34,-24,84,1,77,23,63,54,73,101,98,44,29,138,67,141,87,64,49,220,183,84,120],[-8375,-2852,181,-164,190,-127,114,-51,109,-30,94,-8,355,19,88,-4,248,-37,258,-26,80,-15,182,-62,63,-31,38,-7,18,3,24,14,168,156,36,16,19,1,21,-5,66,-43,89,-39,234,-178,29,5,127,204,49,86,-1,13,-43,38,-92,55,-107,26,-23,-8,-12,-11,-127,-206,-8,-8,-12,1,-4,17,138,220,-2,35,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-18,14,-11,23,2,25,12,20,22,12,24,-2,279,448,10,48,-5,38,12,11,14,-8,3,-9,-17,-82,-277,-461,7,-13,2,-29,8,-11,340,-248,51,-25,97,-23,26,-15,24,-21,62,-97,29,-31,716,-516,29,-13,61,-6,316,69,54,30,38,49,335,535,7,-4,5,-7,-352,-568,1,-20,6,-13,274,-197,8,3,32,48,15,5,39,-40,33,-24,11,-24,-17,-75,3,-23,53,-68,65,-56,12,-39,-11,-9,-9,4,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,17,-9,29,-9,50,-1,349,33,16,9,12,15,5,34,-24,84,-2,36,7,59,19,45,88,111,67,60,44,29,138,67,141,87,284,232,28,37],[-4347,-6969,-75,79,-144,123,-274,203,-42,32,-30,37,-335,248,-106,86,-64,63,-59,86,-151,114,-32,17,-56,18,-12,10,-13,73,-19,48,280,249,11,23,-1,29,-42,187,-1,47,68,219,73,151,24,7,220,-41,38,14,21,21,120,157,228,255,41,127,31,251,44,66,86,90,47,34,39,0,104,-54,40,-10,82,-3,35,-7,106,-62,36,-44,109,-82,34,28,16,21,0,10,-78,69],[-2535,-3293,-330,-271,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,52,-164,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-17,11,-30,7,-358,-34,-90,-26,-39,1,-33,13,-79,62,-62,108,-35,45,-68,53,-62,23,-43,5,-146,-18,-198,-66,-27,-20,-16,-23,-9,-23,-11,-130,-38,-230,-12,-122,-17,-41,-35,-50,-52,-41,-77,-29,-337,-44,-1158,-27,-119,7,-324,50,-119,29,-130,59,-49,32,-556,427,-79,56,-26,7,-99,67,-17,27,-152,101,-140,105,-260,237],[-3937,-3964,-53,48,21,44,-12,41,-13,20,-380,273,-20,-7,-33,-42,-90,-140,-20,-22,-19,-15,-31,-10,-36,0,-36,9,-567,414,-19,-12,-180,-287,-17,-6,-439,322,-31,9,-18,-4,-120,-172,-210,-338,-27,-33,-49,-31,-62,-27,-11,-14,-34,-11,-19,1,-149,-51,-88,-51,-50,-37,-75,-75,-46,-64,-64,-109,-214,-393,-14,-45,-14,-81,2,-50,-8,-51,-13,-34,-18,-117,-3,-65,45,-422,44,-94,7,-89,16,-83,-6,-200,-15,-104,-8,-151,-29,-176,-108,-220],[-2545,-3303,-320,-261,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,52,-164,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-17,11,-30,7,-358,-34,-90,-26,-39,1,-33,13,-79,62,-62,108,-35,45,-68,53,-62,23,-43,5,-146,-18,-198,-66,-27,-20,-16,-23,-9,-23,-11,-130,-38,-230,-12,-122,-17,-41,-35,-50,-52,-41,-77,-29,-337,-44,-1158,-26,-119,6,-324,50,-119,29,-130,59,-49,32,-556,427,-79,56,-26,7,-99,67,-17,27,-152,101,-140,105,-260,237],[-8375,-2852,181,-164,190,-127,114,-51,109,-30,94,-8,355,19,88,-4,248,-37,258,-26,80,-15,182,-62,63,-31,38,-7,18,3,24,14,168,156,36,16,19,1,21,-5,66,-43,89,-39,234,-178,29,5,127,204,49,86,-1,13,-43,38,-92,55,-107,26,-23,-8,-12,-11,-127,-206,-8,-8,-12,1,-4,17,138,220,-2,35,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-18,14,-11,23,2,25,12,20,22,12,24,-2,279,448,10,48,-5,38,12,11,14,-8,3,-9,-17,-82,-277,-461,7,-13,2,-29,8,-11,340,-248,51,-25,97,-23,26,-15,24,-21,62,-97,29,-31,716,-516,29,-13,61,-6,316,69,54,30,38,49,335,535,7,-4,5,-7,-352,-568,1,-20,6,-13,274,-197,8,3,32,48,15,5,39,-40,33,-24,11,-24,-17,-75,3,-23,53,-68,65,-56,12,-39,-11,-9,-18,10,-85,72],[-6875,-5473,-273,91,-147,58,-2,19,78,237,53,309,32,78,75,140,3,29,-15,19,-43,0,-38,-9,-9,-12,1,-26,23,-13,113,35,34,-14,14,-28,13,-85,33,-42,120,-29,240,-39,180,-15,1075,29,133,8,70,12,93,40,64,41,84,73,128,144,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,46,-18,26,-2,373,34,28,24,5,20,-24,98,-2,36,7,59,19,45,54,73,101,98,44,29,138,67,141,87,64,49,220,183,84,120],[-2535,-3293,-330,-271,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,52,-164,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,59,73,-1,25,-5,11,-61,51],[-8404,-3598,213,-201,65,-52,591,-413,247,-199,161,-120,81,-51,74,-37,70,-25,332,-59,144,-15,1111,29,133,8,88,19,75,33,64,41,84,73,128,144,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,46,-18,26,-2,373,34,28,24,5,20,-24,98,-2,36,7,59,19,45,54,73,101,98,44,29,138,67,141,87,64,49,220,183,84,120],[-2535,-3293,-330,-271,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,52,-164,37,-44,87,-61,11,-20,0,-34,-22,-27,-22,-10,-28,8,-12,10,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,56,69,-1,18,-126,113,-2,7,22,39,-19,55,-386,279,-20,-7,-69,-94,-54,-88,-39,-37,-41,-11,-62,10,-94,72,-9,16,-5,35,8,23,25,25,272,60,33,15,31,25,363,574,12,-11,-494,-796,-39,-37,-27,-9,-40,-1,-36,9,-880,641,-92,55,-107,26,-23,-8,-12,-11,-127,-206,-8,-8,-12,1,-4,17,138,220,-2,35,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-18,14,-11,23,2,25,12,20,22,12,24,-2,279,448,10,48,-5,38,12,11,14,-8,3,-9,-17,-82,-277,-461,10,-27,-6,-29,-20,-19,-34,-2,-180,-288,-38,-40,-83,-126,-25,-28,-12,-30,-94,-151,-25,-33,-27,-12,-29,5,-71,38,-64,22,-301,43,-75,5,-379,-18,-92,9,-119,30,-107,48,-198,134,-160,151,-128,105],[-2535,-3293,-330,-271,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,52,-164,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,58,72,0,26,-5,11,-61,51],[-2545,-3303,-320,-261,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,52,-164,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,57,75,-8,22,-120,103,-2,7,17,23,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-15,3,-17,62,-54,8,-18,2,-20,-6,-15,-12,-10,-17,-3,-18,5,-73,49,-29,32,-54,97,-35,45,-68,53,-62,23,-43,5,-43,-2,-128,-22,-173,-60,-27,-20,-16,-23,-9,-23,-11,-130,-38,-230,-12,-122,-34,-70,-36,-38,-34,-24,-58,-22,-40,-8,-272,-28,-75,-13,-1085,-26,8,-85,-15,-168,8,-2,65,-330,-83,-21,-195,-85,-21,-15,-34,-48,-266,94],[-8075,-6980,42,96,109,164,13,29,77,258,19,124,-5,82,-12,47,-36,89,-17,23,-74,61,-50,62,-69,120,-73,204,-37,59,-68,88,-167,131],[-8421,-5332,16,-13,93,-9,53,-21,95,20,88,1,41,-12,41,-28,96,-105,130,-78,141,-117,334,-140,43,-13,54,10,17,19,8,37,-11,85,-2,124,-36,318,-15,32,-14,4,-9,-7,-18,-53,5,-27,12,-13,328,-120,215,-66,16,15,196,677,-323,53,-120,29,-77,32,-116,59,-24,-7,-10,-13,-4,-15,4,-22,9,-11,10,1,21,25,75,140,3,20,-3,17,-12,11,-43,0,-38,-9,-9,-12,1,-26,23,-13,113,35,34,-14,14,-28,13,-85,33,-42,120,-29,240,-39,180,-15,1075,29,133,8,70,12,93,40,64,41,84,73,128,144,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,-1,18,-91,82],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-17,11,-30,7,-358,-34,-90,-26,-39,1,-33,13,-79,62,-62,108,-35,45,-68,53,-62,23,-43,5,-146,-18,-198,-66,-27,-20,-16,-23,-9,-23,-11,-130,-38,-230,-12,-122,-17,-41,-35,-50,-52,-41,-77,-29,-337,-44,-1158,-26,-119,6,-324,50,-119,29,-130,59,-49,32,-556,427,-79,56,-26,7,-99,67,-17,27,-227,155,-65,51,-260,237],[-7445,-6977,85,176,21,37,50,64,41,78,33,82,44,158,3,252,12,191,-11,61,0,52,-15,130,-2,124,-35,311,-6,145,49,320,42,115,234,423,71,101,77,77,58,41,72,40,201,71,80,35,59,41,24,31,137,220,63,106,6,19,1,48,-19,45,-93,78,-12,19,1,41,26,32,27,8,32,-5,66,-43,89,-39,234,-178,29,5,176,290,-1,13,-7,8,-93,67,-35,18,-107,26,-23,-8,-12,-11,-105,-173,-27,-39,-13,-2,-6,18,138,220,-2,35,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-25,25,-4,25,7,23,29,21,24,-2,279,448,9,31,-4,55,4,6,8,5,9,-4,8,-13,-17,-82,-277,-461,7,-13,2,-29,8,-11,340,-248,51,-25,97,-23,26,-15,24,-21,62,-97,29,-31,716,-516,29,-13,61,-6,316,69,54,30,38,49,335,535,7,-4,5,-7,-352,-568,1,-20,6,-13,274,-197,8,3,32,48,15,5,39,-40,33,-24,11,-24,-17,-75,3,-23,53,-68,65,-56,12,-39,-11,-9,-18,10,-68,57],[-8404,-3598,266,-244,386,-268,55,-18,71,-46,221,-168,117,-121,59,-23,68,-3,87,14,39,17,81,103,92,154,33,44,77,77,58,41,72,40,248,89,92,58,161,251,63,106,6,19,1,48,-11,32,-19,27,-54,42,-39,20,-35,7,-40,-16,-81,-71,-19,-34,-4,-19,4,-27,56,-109,64,-68,68,-50,95,-45,418,-82,131,-42,491,-197,109,-37,40,-6,67,1,96,26,145,85,143,51,51,37,82,-14,81,-2,59,-18,62,-39,77,-78,70,-57,26,-7,56,69,-1,18,-126,113,-2,7,22,39,-19,55,-372,272,-14,7,-20,-7,-69,-94,-54,-88,-39,-37,-41,-11,-62,10,-880,641,-92,55,-107,26,-29,21,-21,19,-30,53,-37,47,-53,49,-315,225,-14,4,-34,-9,-20,9,-18,30,2,25,-326,243,104,169],[-3077,-6995,-44,70,-174,335,-510,948,-64,100,-72,87,-541,499,-124,109,-63,44,-78,37,-96,19,-72,-14,-197,-19,-33,-17,-6,-19,3,-13,17,-14,14,-1,12,7,8,16,5,56,11,28,26,24,58,26,55,43,133,142,66,79,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,-1,18,-91,82],[-3953,-3935,-34,29,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,17,-9,29,-9,50,-1,349,33,10,5,18,19,5,20,-24,98,1,77,23,63,54,73,101,98,44,29,138,67,103,62,156,120,59,62,36,66,70,74,89,110],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-22,-10,-28,8,-12,10,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,56,69,-1,18,-126,113,-2,7,22,39,-19,55,-386,279,-20,-7,-33,-42,-90,-140,-20,-22,-19,-15,-31,-10,-36,0,-36,9,-880,641,-92,55,-107,26,-29,21,-21,19,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-180,-288,-32,-37,-85,-132,-22,-22,-128,-216,-28,-16,-42,4,-96,50,-58,16,-278,41,-75,5,-379,-18,-125,15,-86,24,-107,48,-198,134,-160,151,-128,105],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,56,69,-1,18,-126,113,-2,7,26,28,9,0,39,-44,77,-67,5,-36,-67,-79,-7,-15,3,-17,62,-54,8,-18,2,-20,-6,-15,-12,-10,-17,-3,-18,5,-73,49,-29,32,-54,97,-35,45,-50,42,-59,28,-64,11,-146,-18,-198,-66,-27,-20,-25,-46,-11,-130,-38,-230,-6,-90,-14,-55,-26,-47,-36,-38,-34,-24,-77,-29,-337,-44,-1158,-27,-119,7,-324,50,-119,29,-130,59,-49,32,-556,427,-79,56,-26,7,-99,67,-17,27,-227,155,-65,51,-260,237],[-8404,-3598,266,-244,603,-422,247,-199,161,-120,81,-51,74,-37,70,-25,332,-59,144,-15,1111,29,133,8,70,12,124,58,88,68,138,147,19,25,29,58,31,104,28,227,14,29,63,92,32,31,31,15,52,7,136,-51,115,-8,59,-18,62,-39,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,6,-28,-8,-18,-60,-69,-7,-15,3,-17,76,-66,46,-18,50,-1,349,33,10,5,18,19,5,20,-24,98,1,77,14,46,29,52,3,-3,65,79,67,60,44,29,138,67,103,62,156,120,59,62,36,66,70,74,89,110],[-2523,-3188,-62,-86,-25,-25,0,-14,6,-7,18,3,17,19,63,93],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-17,11,-30,7,-358,-34,-90,-26,-39,1,-33,13,-79,62,-62,108,-35,45,-68,53,-62,23,-43,5,-146,-18,-198,-66,-27,-20,-16,-23,-9,-23,-11,-130,-38,-230,-12,-122,-34,-70,-36,-38,-34,-24,-77,-29,-337,-44,-397,-7,-47,-437,103,5,47,11,19,-6,18,-18,25,-1,65,10,31,14,43,-97,53,-99,57,-86,-27,-50,-63,-82,-237,-293,-178,150,-117,113,-142,47,-86,56,-137,-96,-15,-29,-13,-10,-370,121,-281,100],[-3959,-3997,-58,48,-33,-50,-37,33,-53,32,-49,19,-99,5,-40,10,-104,54,-39,0,-23,-12,-110,-112,-44,-66,-41,-319,-17,-60,-12,-17,-51,-42,-140,-147,-180,-226,-38,-14,-205,37,-18,-7,-90,-180,-6,-62,-15,-7,-11,11,1,13,19,28,83,193,-1,25,-12,23,-26,18,-158,0,-27,-11,-822,-20,-413,55,-117,30,-140,64,-80,55,-555,426,-421,293,-68,55,-261,241],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-73,-111,-10,-40,4,-35,52,-150,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-40,120,-22,26,-21,13,-23,4,-58,-4,-319,-35,-84,-20,-31,1,-59,28,-33,25,-49,66,-32,63,-29,39,-32,34,-25,17,-56,26,-35,8,-115,1,-34,-13,-44,-7,-181,-63,-20,-12,-22,-29,-9,-23,-11,-130,-38,-230,-12,-122,-34,-70,-36,-38,-61,-37,-50,-16,-337,-44,-1158,-26,-119,6,-324,50,-119,29,-130,59,-49,32,-556,427,-79,56,-26,7,-99,67,-17,27,-227,155,-65,51,-260,237],[-2546,-3302,-319,-262,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,52,-164,37,-44,87,-61,11,-20,0,-34,-22,-27,-22,-10,-28,8,-12,10,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,56,69,-1,18,-127,115,21,44,-19,55,-386,279,-20,-7,-33,-42,-90,-140,-20,-22,-19,-15,-31,-10,-36,0,-36,9,-880,641,-92,55,-107,26,-29,21,-21,19,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-180,-288,-32,-37,-85,-132,-22,-22,-128,-216,-28,-16,-42,4,-96,50,-58,16,-278,41,-75,5,-379,-18,-125,15,-86,24,-107,48,-198,134,-160,151,-128,105],[-3954,-3949,-35,31,-2,7,22,39,-12,41,-13,20,-380,273,-20,-7,-33,-42,-90,-140,-39,-37,-31,-10,-36,0,-36,9,-94,72,-15,37,9,37,25,25,272,60,33,15,31,25,363,574,12,-11,-494,-796,-39,-37,-27,-9,-40,-1,-36,9,-880,641,-92,55,-107,26,-23,-8,-12,-11,-127,-206,-8,-8,-12,1,-4,17,138,220,-2,35,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-18,14,-11,23,2,25,12,20,22,12,24,-2,279,448,10,48,-5,38,12,11,14,-8,3,-9,-17,-82,-277,-461,10,-27,-6,-29,-20,-19,-34,-2,-180,-288,-38,-40,-83,-126,-25,-28,-12,-30,-94,-151,-25,-33,-27,-12,-29,5,-71,38,-64,22,-301,43,-75,5,-379,-18,-92,9,-119,30,-107,48,-198,134,-160,151,-128,105],[-8421,-5332,16,-13,93,-9,53,-21,95,20,88,1,41,-12,41,-28,96,-105,130,-78,141,-117,334,-140,43,-13,31,4,52,17,-15,130,-2,124,-36,318,-5,138,49,320,10,37,32,78,75,140,3,20,-3,17,-12,11,-43,0,-38,-9,-9,-12,1,-26,23,-13,113,35,34,-14,14,-28,13,-85,33,-42,120,-29,240,-39,180,-15,1075,29,133,8,70,12,93,40,64,41,55,45,149,160,32,56,36,118,28,227,14,29,63,92,43,43,3,19,-18,28,-73,29,-135,105,-468,338,-19,-12,-180,-287,-21,-4,-221,160,-4,29,127,204,49,86,-1,13,-43,38,-92,55,-107,26,-23,-8,-12,-11,-105,-173,-27,-39,-13,-2,-6,18,138,220,-2,35,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-25,25,-4,25,7,23,29,21,24,-2,279,448,10,48,-5,38,12,11,14,-8,3,-9,-17,-82,-277,-461,7,-13,2,-29,8,-11,340,-248,51,-25,97,-23,26,-15,24,-21,62,-97,29,-31,716,-516,29,-13,61,-6,316,69,54,30,38,49,335,535,7,-4,5,-7,-352,-568,1,-20,6,-13,274,-197,8,3,32,48,15,5,39,-40,33,-24,11,-24,-17,-75,3,-23,53,-68,65,-56,12,-39,-11,-9,-18,10,-68,57],[-6875,-5473,-273,91,-4,14,9,7,294,-105,133,-38,12,8,201,687,-324,50,-119,29,-130,59,-49,32,-16,3,-23,-5,-14,-20,4,-35,9,-9,10,2,21,22,75,140,3,20,-3,17,-12,11,-43,0,-38,-9,-9,-12,1,-26,23,-13,113,35,34,-14,14,-28,13,-85,33,-42,120,-29,240,-39,180,-15,1075,29,133,8,70,12,93,40,64,41,84,73,128,144,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,46,-18,26,-2,373,34,28,24,5,20,-24,98,-2,36,7,59,19,45,88,111,67,60,44,29,138,67,141,87,284,232,28,37],[-6529,-2158,99,167,127,-69,238,-171,12,1,83,138,10,48,-5,38,12,11,14,-8,3,-9,-17,-82,-277,-461,7,-13,2,-29,8,-11,340,-248,51,-25,97,-23,26,-15,24,-21,62,-97,29,-31,701,-507,44,-22,61,-6,264,56,70,20,36,23,38,49,335,535,7,-4,5,-7,-352,-568,7,-33,277,-199,25,2,82,-60,0,-17,-10,-5,-380,273,-20,-7,-33,-42,-90,-140,-20,-22,-19,-15,-31,-10,-36,0,-36,9,-880,641,-92,55,-107,26,-23,-8,-12,-11,-132,-212,-13,-2,-6,18,134,209,5,25,-3,21,-30,53,-37,47,-53,49,-315,225,-14,4,-21,-9,-22,2,-180,-288,-32,-37,-85,-132,-22,-22,-128,-216,-28,-16,-42,4,-96,50,-58,16,-278,41,-75,5,-379,-18,-125,15,-86,24,-107,48,-198,134,-160,151,-128,105],[-8421,-5332,16,-13,93,-9,53,-21,95,20,88,1,41,-12,41,-28,96,-105,130,-78,141,-117,334,-140,43,-13,54,10,17,19,8,37,-11,85,-2,124,-36,318,-5,138,49,320,10,37,32,78,75,140,3,20,-3,17,-12,11,-43,0,-38,-9,-9,-12,1,-26,23,-13,113,35,34,-14,14,-28,13,-85,33,-42,120,-29,240,-39,180,-15,1075,29,133,8,70,12,93,40,64,41,84,73,128,144,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,46,-18,26,-2,373,34,28,24,5,20,-24,98,-2,36,7,59,19,45,88,111,67,60,44,29,138,67,141,87,284,232,28,37],[-2535,-3293,-330,-271,-299,-194,-61,-48,-60,-71,-71,-111,-7,-22,-1,-39,52,-164,37,-44,87,-61,11,-20,0,-34,-22,-27,-14,-8,-16,-1,-32,17,-13,24,-39,118,-22,29,-28,15,-19,3,-401,-38,-41,17,-94,84,0,21,57,71,1,27,-5,11,-61,51],[-8421,-5332,16,-13,93,-9,53,-21,95,20,88,1,41,-12,41,-28,96,-105,130,-78,141,-117,334,-140,43,-13,54,10,29,11,-15,130,-2,124,-36,318,-5,138,49,320,10,37,32,78,75,140,3,20,-3,17,-12,11,-43,0,-38,-9,-9,-12,1,-26,23,-13,113,35,34,-14,14,-28,13,-85,33,-42,120,-29,240,-39,180,-15,1075,29,133,8,70,12,93,40,64,41,84,73,128,144,29,58,31,104,28,227,14,29,63,92,32,31,45,19,38,3,136,-51,115,-8,41,-11,80,-46,77,-78,70,-57,26,-7,56,69,2,22,-2,12,-14,16,-111,93,13,18,18,5,39,-44,77,-67,5,-36,-67,-79,-7,-24,3,-8,76,-66,46,-18,26,-2,373,34,28,24,5,20,-24,98,-2,36,7,59,19,45,54,73,101,98,44,29,138,67,141,87,64,49,220,183,84,120]],"shs":{"0":[[-22.83956,-43.23952],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86276,-43.25348],[-22.86357,-43.25425],[-22.86492,-43.25483],[-22.86996,-43.25439],[-22.87354,-43.2582],[-22.87652,-43.25689],[-22.87862,-43.2553],[-22.8803,-43.2538],[-22.88264,-43.25405],[-22.88238,-43.25482],[-22.88047,-43.25858],[-22.87811,-43.26217],[-22.87806,-43.26402],[-22.8786,-43.26605]],"1":[[-22.83954,-43.23937],[-22.83335,-43.23877],[-22.82569,-43.23281]],"2":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83937,-43.23969],[-22.84258,-43.23625],[-22.84585,-43.23779],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85309,-43.23304],[-22.86024,-43.22779],[-22.86055,-43.22757],[-22.86102,-43.22723]],"3":[[-22.88428,-43.24878],[-22.88261,-43.2494],[-22.87976,-43.25044],[-22.8785,-43.25088],[-22.87532,-43.25213],[-22.86929,-43.25432],[-22.86683,-43.2541],[-22.86621,-43.25198],[-22.86532,-43.24895],[-22.87026,-43.24704],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"4":[[-22.85795,-43.2338],[-22.85583,-43.233],[-22.85817,-43.23147],[-22.86024,-43.22779],[-22.86055,-43.22757],[-22.862,-43.22453],[-22.86013,-43.22147],[-22.85984,-43.22167],[-22.86157,-43.2245],[-22.86067,-43.22704],[-22.85283,-43.23272],[-22.84315,-43.23345],[-22.84155,-43.23161],[-22.84274,-43.23351],[-22.84179,-43.23662],[-22.84258,-43.23625],[-22.84585,-43.23779],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85309,-43.23304],[-22.86533,-43.22154]],"5":[[-22.83956,-43.23952],[-22.84303,-43.25054],[-22.83988,-43.25343],[-22.83677,-43.25775],[-22.83447,-43.26202],[-22.83359,-43.2637]],"6":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83937,-43.23969],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86276,-43.25348],[-22.86357,-43.25425],[-22.86492,-43.25483],[-22.86996,-43.25439],[-22.87483,-43.25259],[-22.88382,-43.24923]],"7":[[-22.84239,-43.26936],[-22.84488,-43.26798],[-22.84766,-43.26579],[-22.85032,-43.26367],[-22.85455,-43.26],[-22.85265,-43.25765],[-22.85112,-43.2558],[-22.84909,-43.25523],[-22.84812,-43.25427],[-22.84591,-43.25362],[-22.84554,-43.2524],[-22.84486,-43.25124],[-22.84783,-43.24762],[-22.84983,-43.24768],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"8":[[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"9":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83937,-43.23969],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86471,-43.24819],[-22.87053,-43.24899],[-22.87354,-43.2582],[-22.87652,-43.25689],[-22.87862,-43.2553],[-22.8803,-43.2538],[-22.88264,-43.25405]],"10":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83954,-43.23937]],"11":[[-22.88464,-43.2265]],"12":[[-22.88401,-43.23593],[-22.88067,-43.23881],[-22.87753,-43.24099],[-22.87532,-43.2426],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"13":[[-22.83956,-43.23952],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86471,-43.24819],[-22.87053,-43.24899],[-22.87354,-43.2582],[-22.87652,-43.25689],[-22.87862,-43.2553],[-22.8803,-43.2538],[-22.88264,-43.25405]],"14":[[-22.83946,-43.23977],[-22.85488,-43.25293]],"16":[[-22.88344,-43.23682],[-22.87444,-43.2436],[-22.86513,-43.24778],[-22.85989,-43.24777],[-22.84705,-43.24373],[-22.83954,-43.23989]],"17":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85647,-43.24803]],"19":[[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"20":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83937,-43.23969],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86471,-43.24819],[-22.87053,-43.24899],[-22.87354,-43.2582],[-22.87652,-43.25689],[-22.87862,-43.2553],[-22.8803,-43.2538],[-22.88264,-43.25405]],"21":[[-22.8717,-43.25853],[-22.86874,-43.24191],[-22.86472,-43.23933],[-22.85795,-43.2338],[-22.85583,-43.233],[-22.85817,-43.23147],[-22.86024,-43.22779],[-22.86055,-43.22757],[-22.862,-43.22453],[-22.86013,-43.22147],[-22.85984,-43.22167],[-22.86157,-43.2245],[-22.86067,-43.22704],[-22.85283,-43.23272],[-22.84315,-43.23345],[-22.84155,-43.23161],[-22.84274,-43.23351],[-22.84179,-43.23662],[-22.83956,-43.23952]],"22":[[-22.83956,-43.23952],[-22.84258,-43.23625],[-22.84585,-43.23779],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85535,-43.23593],[-22.86434,-43.23956],[-22.86777,-43.2413],[-22.87178,-43.24924],[-22.87099,-43.25922]],"23":[[-22.87967,-43.27037]],"24":[[-22.86876,-43.25478],[-22.86996,-43.25439],[-22.86929,-43.25432],[-22.86552,-43.25368],[-22.86318,-43.25283],[-22.86276,-43.25348],[-22.86165,-43.25384],[-22.86021,-43.2537],[-22.85765,-43.25244],[-22.85639,-43.25223],[-22.85221,-43.25031],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877]],"25":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85638,-43.24966],[-22.85639,-43.25223],[-22.8531,-43.25309],[-22.85233,-43.25457],[-22.85257,-43.25591],[-22.85565,-43.25911],[-22.8568,-43.25818],[-22.85934,-43.25635],[-22.86203,-43.25459],[-22.86357,-43.25425],[-22.86492,-43.25483],[-22.86876,-43.25478]],"26":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83954,-43.23937]],"27":[[-22.83954,-43.23937],[-22.83335,-43.23877],[-22.82569,-43.23281]],"28":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83937,-43.23969],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85638,-43.24966],[-22.85639,-43.25223],[-22.8531,-43.25309],[-22.85233,-43.25457],[-22.85112,-43.2558],[-22.84875,-43.25813],[-22.84617,-43.26052],[-22.84488,-43.26174],[-22.84394,-43.26208],[-22.84303,-43.26319],[-22.84187,-43.26414],[-22.83968,-43.26596],[-22.8407,-43.26735],[-22.84201,-43.26934]],"29":[[-22.83946,-43.23977],[-22.84696,-43.24373],[-22.85471,-43.25364],[-22.85739,-43.25807],[-22.8485,-43.26544]],"30":[[-22.88464,-43.2265]],"31":[[-22.88401,-43.23593],[-22.88067,-43.23881],[-22.87753,-43.24099],[-22.87532,-43.2426],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"32":[[-22.82569,-43.23281]],"33":[[-22.84856,-43.26549],[-22.8548,-43.25366],[-22.83946,-43.23977],[-22.85749,-43.25809],[-22.84705,-43.24373]],"34":[[-22.83946,-43.23977]],"35":[[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"36":[[-22.85795,-43.2338],[-22.85583,-43.233],[-22.85817,-43.23147],[-22.86024,-43.22779],[-22.86055,-43.22757],[-22.86102,-43.22723],[-22.862,-43.22453],[-22.86013,-43.22147],[-22.85984,-43.22167],[-22.86157,-43.2245],[-22.86067,-43.22704],[-22.85283,-43.23272],[-22.84315,-43.23345],[-22.84155,-43.23161],[-22.84274,-43.23351],[-22.84179,-43.23662],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"37":[[-22.855,-43.25287],[-22.83946,-43.23977]],"38":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86471,-43.24819],[-22.87026,-43.24704],[-22.87796,-43.24145],[-22.88461,-43.2362]],"39":[[-22.83956,-43.23952],[-22.84258,-43.23625],[-22.84585,-43.23779],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85535,-43.23593],[-22.86434,-43.23956],[-22.86777,-43.2413],[-22.87178,-43.24924],[-22.87099,-43.25922]],"40":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86471,-43.24819],[-22.87026,-43.24704],[-22.87796,-43.24145],[-22.88461,-43.2362]],"41":[[-22.85795,-43.2338],[-22.85583,-43.233],[-22.85817,-43.23147],[-22.86024,-43.22779],[-22.86055,-43.22757],[-22.86102,-43.22723],[-22.862,-43.22453],[-22.86013,-43.22147],[-22.85984,-43.22167],[-22.86157,-43.2245],[-22.86067,-43.22704],[-22.85283,-43.23272],[-22.84315,-43.23345],[-22.84155,-43.23161],[-22.84274,-43.23351],[-22.84179,-43.23662],[-22.83956,-43.23952]],"42":[[-22.86876,-43.25478],[-22.86996,-43.25439],[-22.87251,-43.25155],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"43":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83954,-43.23937]],"44":[[-22.88401,-43.23593],[-22.88067,-43.23881],[-22.87753,-43.24099],[-22.87532,-43.2426],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"45":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83937,-43.23969],[-22.84258,-43.23625],[-22.84585,-43.23779],[-22.84315,-43.23345],[-22.84155,-43.23161],[-22.84274,-43.23351],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85309,-43.23304],[-22.85817,-43.23147],[-22.86024,-43.22779],[-22.86055,-43.22757],[-22.86102,-43.22723],[-22.862,-43.22453],[-22.86013,-43.22147],[-22.85984,-43.22167],[-22.86157,-43.2245]],"46":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83954,-43.23937]],"47":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83937,-43.23969],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86276,-43.25348],[-22.86357,-43.25425],[-22.86492,-43.25483],[-22.86876,-43.25478]],"48":[[-22.87886,-43.26586],[-22.87833,-43.26397],[-22.87834,-43.26182],[-22.88019,-43.25939],[-22.88258,-43.25485],[-22.8834,-43.25341],[-22.87999,-43.25377],[-22.87843,-43.25517]],"49":[[-22.88258,-43.25485],[-22.8834,-43.25341],[-22.87999,-43.25377],[-22.87843,-43.25517],[-22.87632,-43.25678],[-22.87339,-43.25804],[-22.86929,-43.25432],[-22.86683,-43.2541],[-22.86621,-43.25198],[-22.86532,-43.24895],[-22.87026,-43.24704],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83956,-43.23952]],"50":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86471,-43.24819],[-22.87026,-43.24704],[-22.87796,-43.24145],[-22.88461,-43.2362]],"51":[[-22.8717,-43.25853],[-22.86874,-43.24191],[-22.86472,-43.23933],[-22.85795,-43.2338],[-22.85583,-43.233],[-22.85817,-43.23147],[-22.86024,-43.22779],[-22.86055,-43.22757],[-22.862,-43.22453],[-22.86013,-43.22147],[-22.85984,-43.22167],[-22.86157,-43.2245],[-22.86067,-43.22704],[-22.85283,-43.23272],[-22.84315,-43.23345],[-22.84155,-43.23161],[-22.84274,-43.23351],[-22.84179,-43.23662],[-22.83956,-43.23952]],"52":[[-22.88401,-43.23593],[-22.88067,-43.23881],[-22.87753,-43.24099],[-22.87486,-43.24275],[-22.86874,-43.24191],[-22.86472,-43.23933],[-22.83937,-43.23969],[-22.84258,-43.23625],[-22.84585,-43.23779],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85309,-43.23304],[-22.86024,-43.22779],[-22.86055,-43.22757],[-22.86102,-43.22723],[-22.86533,-43.22154]],"53":[[-22.83301,-43.26594],[-22.83544,-43.2614],[-22.83712,-43.25831],[-22.8406,-43.25355],[-22.84348,-43.25089],[-22.84783,-43.24762],[-22.84983,-43.24768],[-22.84818,-43.24491],[-22.83956,-43.23952]],"54":[[-22.83954,-43.23937],[-22.83335,-43.23877],[-22.82569,-43.23281]],"55":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83937,-43.23969],[-22.84258,-43.23625],[-22.84585,-43.23779],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85309,-43.23304],[-22.86024,-43.22779],[-22.86055,-43.22757]],"56":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83937,-43.23969],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86471,-43.24819],[-22.87026,-43.24704],[-22.87796,-43.24145],[-22.88461,-43.2362]],"57":[[-22.88401,-43.23593],[-22.88067,-43.23881],[-22.87753,-43.24099],[-22.87532,-43.2426],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"58":[[-22.82569,-43.23281]],"59":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85638,-43.24966],[-22.85639,-43.25223],[-22.8531,-43.25309],[-22.85233,-43.25457],[-22.85257,-43.25591],[-22.85565,-43.25911],[-22.8568,-43.25818],[-22.85934,-43.25635],[-22.86108,-43.25596],[-22.86286,-43.25677],[-22.86582,-43.25576],[-22.86876,-43.25478]],"60":[[-22.83954,-43.23989],[-22.84696,-43.24373],[-22.86153,-43.24787],[-22.86672,-43.24761],[-22.87581,-43.24262],[-22.88465,-43.2357]],"61":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.84705,-43.24599],[-22.853,-43.24792],[-22.85489,-43.24796],[-22.85594,-43.24803],[-22.85647,-43.24803],[-22.86074,-43.24814],[-22.86471,-43.24819],[-22.87026,-43.24704],[-22.87796,-43.24145],[-22.88461,-43.2362]],"62":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83937,-43.23969],[-22.84258,-43.23625],[-22.84585,-43.23779],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85309,-43.23304],[-22.86024,-43.22779],[-22.86055,-43.22757]],"63":[[-22.83956,-43.23952],[-22.84258,-43.23625],[-22.84585,-43.23779],[-22.84315,-43.23345],[-22.84155,-43.23161],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85309,-43.23304],[-22.85817,-43.23147],[-22.86024,-43.22779],[-22.86055,-43.22757],[-22.86102,-43.22723],[-22.862,-43.22453],[-22.86013,-43.22147],[-22.85984,-43.22167],[-22.86157,-43.2245]],"64":[[-22.8834,-43.25341],[-22.87999,-43.25377],[-22.87843,-43.25517],[-22.87632,-43.25678],[-22.87339,-43.25804],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85535,-43.23593],[-22.85583,-43.233],[-22.85817,-43.23147],[-22.86024,-43.22779],[-22.86055,-43.22757],[-22.862,-43.22453],[-22.86013,-43.22147],[-22.85984,-43.22167],[-22.86157,-43.2245],[-22.86067,-43.22704],[-22.85283,-43.23272],[-22.84315,-43.23345],[-22.84155,-43.23161],[-22.84274,-43.23351],[-22.84179,-43.23662],[-22.83956,-43.23952]],"65":[[-22.86876,-43.25478],[-22.86996,-43.25439],[-22.86929,-43.25432],[-22.86683,-43.2541],[-22.86621,-43.25198],[-22.86532,-43.24895],[-22.87026,-43.24704],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"66":[[-22.86533,-43.22154],[-22.86013,-43.22147],[-22.85984,-43.22167],[-22.86157,-43.2245],[-22.86067,-43.22704],[-22.85283,-43.23272],[-22.84315,-43.23345],[-22.84155,-43.23161],[-22.84274,-43.23351],[-22.84179,-43.23662],[-22.84258,-43.23625],[-22.84585,-43.23779],[-22.84672,-43.23761],[-22.85033,-43.23498],[-22.85309,-43.23304],[-22.85817,-43.23147],[-22.86024,-43.22779],[-22.86055,-43.22757]],"67":[[-22.8834,-43.25341],[-22.87999,-43.25377],[-22.87843,-43.25517],[-22.87632,-43.25678],[-22.87339,-43.25804],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]],"68":[[-22.8253,-43.23298],[-22.83232,-43.23825],[-22.83256,-43.24257],[-22.83954,-43.23937]],"69":[[-22.8834,-43.25341],[-22.87999,-43.25377],[-22.87843,-43.25517],[-22.87632,-43.25678],[-22.87339,-43.25804],[-22.86454,-43.24764],[-22.86092,-43.2475],[-22.85692,-43.24747],[-22.85376,-43.24734],[-22.85167,-43.24723],[-22.84818,-43.24491],[-22.83933,-43.23955],[-22.83335,-43.23877],[-22.82569,-43.23281]]}};
var EXT_G=[['centro','Centro'],['sul','Zona Sul'],['tijuca','Tijuca'],['norte','Zona Norte'],['ilha','Ilha do Governador'],['oeste','Zona Oeste']];
var EXTS={};Object.keys(EXT.stops).forEach(function(k){var s=EXT.stops[k],p=ll2map(s[1],s[2]);EXTS[k]={name:s[0],p:[p[0],p[1]]}});
var EXTSEL={g:null,ln:null};
/* ônibus ao vivo: o estado vem antes de tudo, porque o bloco "Ônibus da cidade" aberto já mostra as contagens ao vivo
   na carga (extNoTrajeto, mais abaixo). Ele ficava depois: com o bloco aberto, a carga parava com erro e o resto do
   app (ônibus ao vivo, planta do CT, seguir ônibus…) nem chegava a rodar. */
var LIVE={url:(window.CSE_GPS_URL||'').replace(/\/$/,''),bus:[],t:0,err:false,timer:null};
state.layers.ext=(function(){try{return localStorage.getItem('cse-lay-ext')==='1'}catch(e){return false}})();
function extSvc(d){var w=d.getDay();return w===0?'D':w===6?'S':'U'}
/* próximas saídas de uma linha numa parada (minutos do dia; inclui viagens da madrugada do dia anterior) */
function extNext(L,stop,now,n){
  var off=0,has=false;L.st.forEach(function(s){if(s[0]===stop){off=s[1];has=true}});if(!has&&stop)return [];
  var d=new Date(),hoje=L.t[extSvc(d)]||[],ont=L.t[extSvc(new Date(d.getTime()-864e5))]||[],r=[];
  ont.forEach(function(t){var x=t+off-1440;if(x>=now-1)r.push(x)});hoje.forEach(function(t){var x=t+off;if(x>=now-1)r.push(x)});
  r.sort(function(a,b){return a-b});return r.slice(0,n||3);
}
function extToday(L){return (L.t[extSvc(new Date())]||[]).length}
function extBadge(L){return '<span class="xb'+(L.brt?' brt':'')+'" style="--xc:'+(L.c||'#5B6B7A')+'">'+(L.brt?'BRT ':'')+esc(L.n)+'</span>'}
function extWhen(L,stop,now){
  var nx=extNext(L,stop,now,2),vivo=liveTag(L.n);
  if(!extToday(L))return '<span class="muted">não circula hoje</span>'+vivo;
  if(!nx.length)return '<span class="muted">sem mais saídas hoje</span>'+vivo;
  var a=Math.round(nx[0]-now);
  return '<b>'+(a<=1?'agora':a<60?'em '+a+' min':bt(nx[0]))+'</b>'+(nx[1]!=null?' · depois '+bt(nx[1]):'')+vivo;
}
function extStopsOf(L){return L.st.map(function(s){return EXTS[s[0]]?EXTS[s[0]].name:s[0]})}
/* painel "Ônibus da cidade" em Trajetos */
function extPanelHTML(now){
  var g=EXTSEL.g,all=EXT.lines.filter(function(L){return !g||L.g===g}),ls=all.filter(function(L){return extToday(L)}),fora=all.length-ls.length;
  ls.sort(function(a,b){var x=extNext(a,a.st[0][0],now,1)[0],y=extNext(b,b.st[0][0],now,1)[0];return (x==null?1e9:x)-(y==null?1e9:y)});
  var chips='<div class="seg chips xg" role="group" aria-label="Destino"><button type="button" data-xg="" aria-pressed="'+!g+'">Todos</button>'+EXT_G.map(function(G){return '<button type="button" data-xg="'+G[0]+'" aria-pressed="'+(g===G[0])+'">'+G[1]+'</button>'}).join('')+'</div>';
  var list='<ul class="xl-list">'+ls.map(function(L){
    var k=L.n+'|'+L.d,open=EXTSEL.ln===k,first=L.st[0][0];
    return '<li><button type="button" class="xl-row" data-xln="'+esc(k)+'" aria-expanded="'+open+'">'+extBadge(L)+'<span class="grow"><b>'+esc(L.d)+'</b><small>'+extWhen(L,first,now)+' · '+esc(EXTS[first]?EXTS[first].name:'')+'</small></span></button>'+
      (open?'<div class="xl-more"><p class="small keep">'+esc(L.nm)+'. Passa por: '+extStopsOf(L).map(function(n,i){return '<button type="button" class="linkbtn" data-kind="ext" data-id="'+L.st[i][0]+'">'+esc(n)+'</button>'}).join(', ')+'.</p><p class="small keep">Hoje: '+extToday(L)+' saídas'+(extToday(L)?', da primeira às '+fmt((L.t[extSvc(new Date())]||[0])[0])+' à última às '+fmt((L.t[extSvc(new Date())]||[0]).slice(-1)[0]):'')+'.</p></div>':'')+'</li>'}).join('')+'</ul>';
  return liveStatusHTML()+chips+list+(fora?'<p class="muted small keep">'+fora+' linha'+(fora>1?'s':'')+' deste destino não circula'+(fora>1?'m':'')+' hoje.</p>':'')+'<p class="muted small keep xsrc">Horários programados pela prefeitura ('+esc(EXT.fonte)+'). O trânsito pode atrasar o ônibus.'+
    (REDUT&&REDUT.ajuste?' A posição ao vivo considera os semáforos mapeados pela UFRJ e pelo OpenStreetMap (© colaboradores do OpenStreetMap).':'')+'</p>';
}
function extFoldHTML(now){
  var open=(function(){try{return localStorage.getItem('cse-fold-ext')==='1'}catch(e){return false}})();
  var nx=EXT.lines.map(function(L){return {L:L,t:extNext(L,L.st[0][0],now,1)[0]}}).filter(function(x){return x.t!=null}).sort(function(a,b){return a.t-b.t})[0];
  var sub=nx?'Próximo: '+esc(nx.L.n)+' para '+esc(nx.L.d)+' '+(nx.t-now<=1?'agora':'em '+Math.round(nx.t-now)+' min'):'Linhas municipais e BRT que saem do Fundão';
  return '<div id="extbox">'+foldHTML('fdExt',open,'Ônibus da cidade','<small>'+sub+'</small>',open?extPanelHTML(now):'')+'</div>';
}
function extNoTrajeto(){if(plan&&!$('#extbox'))plan.insertAdjacentHTML('beforeend',extFoldHTML(nowMin()))}
aoFazer('trajeto montado',extNoTrajeto);
extNoTrajeto();/* Trajetos já foi montado uma vez antes desta parte carregar: sem isto, o bloco só aparecia na remontagem seguinte */
function extRepaint(){var b=$('#extbox');if(b){var t=document.createElement('div');t.innerHTML=extFoldHTML(nowMin());b.replaceWith(t.firstChild)}}
document.addEventListener('toggle',function(e){if(e.target&&e.target.id==='fdExt'){try{localStorage.setItem('cse-fold-ext',e.target.open?'1':'0')}catch(x){}if(e.target.open&&!e.target.querySelector('.xl-list'))extRepaint()}},true);
document.addEventListener('click',function(e){
  var g=e.target.closest&&e.target.closest('[data-xg]');if(g){EXTSEL.g=g.dataset.xg||null;EXTSEL.ln=null;extRepaint();return}
  var r=e.target.closest&&e.target.closest('[data-xln]');if(r){EXTSEL.ln=EXTSEL.ln===r.dataset.xln?null:r.dataset.xln;extRepaint();var n=$('[data-xln="'+r.dataset.xln.replace(/"/g,'')+'"]');if(n)n.focus({preventScroll:true})}
});
setInterval(function(){var b=$('#fdExt');if(b&&b.open&&!(document.activeElement&&b.contains(document.activeElement)))extRepaint()},60000);
/* parada externa no mapa: o painel ao lado lista as próximas saídas */
function extStopHTML(id,now){
  var S=EXTS[id];if(!S)return linesHTML();
  var ls=EXT.lines.filter(function(L){return L.st.some(function(s){return s[0]===id})});
  ls.sort(function(a,b){var x=extNext(a,id,now,1)[0],y=extNext(b,id,now,1)[0];return (x==null?1e9:x)-(y==null?1e9:y)});
  return '<p class="eyebrow">Ônibus da cidade</p><h2>'+esc(S.name)+'</h2>'+(S.alt&&S.alt.length?'<p class="muted small keep">Parada da UFRJ e ponto da prefeitura “'+esc(S.alt.join('”, “'))+'”.</p>':'')+liveStatusHTML()+'<p class="muted small keep">'+ls.length+' linha'+(ls.length>1?'s':'')+(ls.length>1?' saem':' sai')+' daqui. Horários programados pela prefeitura.</p>'+
    (function(){var row=function(L){return '<li><div class="xl-row">'+extBadge(L)+'<span class="grow"><b>'+esc(L.d)+'</b><small>'+extWhen(L,id,now)+'</small></span></div></li>'},on=ls.filter(extToday),off=ls.filter(function(L){return !extToday(L)});return '<ul class="xl-list">'+on.map(row).join('')+'</ul>'+(off.length?'<details class="xoff"><summary>'+off.length+' linha'+(off.length>1?'s':'')+' não circula'+(off.length>1?'m':'')+' hoje</summary><ul class="xl-list">'+off.map(row).join('')+'</ul></details>':'')})()+
    '<p class="muted small keep xsrc">Fonte: '+esc(EXT.fonte)+'.</p>';
}
function extDraw(){
  var old=$('#gExt');if(old)old.remove();
  var s='<g id="gExt"'+(state.layers.ext?'':' class="off"')+'>';
  Object.keys(EXTS).forEach(function(id){var S=EXTS[id];
    s+=mk('ext',id,S.p,'Ônibus da cidade: '+S.name,'<circle class="hit" cy="-20" r="20"/><path class="xpin" d="M0 0C-4 -7 -14 -12 -14 -23A14 14 0 1 1 14 -23C14 -12 4 -7 0 0Z"/><circle class="xin" cy="-23" r="10"/><g class="xbus" transform="translate(0 -23)"><rect x="-5.6" y="-6.4" width="11.2" height="10.6" rx="2.6"/><rect class="xw" x="-4.2" y="-4.6" width="8.4" height="4" rx="0.8"/><circle class="xw" cx="-2.9" cy="1.8" r="1"/><circle class="xw" cx="2.9" cy="1.8" r="1"/><rect x="-4.6" y="4" width="2.4" height="2.4" rx=".6"/><rect x="2.2" y="4" width="2.4" height="2.4" rx=".6"/><rect x="-6.8" y="-4.2" width="1" height="3" rx=".5"/><rect x="5.8" y="-4.2" width="1" height="3" rx=".5"/></g>')});
  s+='</g>';var lab=$('#gLab');if(lab)lab.insertAdjacentHTML('beforebegin',s);
}
aoFazer('mapa montado',extDraw);
extDraw();
aoFazer('mapa atualizado',function(){var g=$('#gExt');if(g)g.classList.toggle('off',!state.layers.ext)});
(function(){var w=$('#chSvc');if(!w)return;
  w.insertAdjacentHTML('afterend','<button class="chip" id="chExt" type="button" aria-pressed="'+!!state.layers.ext+'"><span class="sw sw-ext"></span><span>Cidade<span class="xl"> (ônibus)</span></span></button>');
  $('#chExt').addEventListener('click',function(){setLayer('ext',this)});
})();
updateMap();
/* ======================= v28: ônibus da cidade ao vivo (via Worker do Cloudflare) ======================= */
function liveWanted(){return !!LIVE.url&&!document.hidden&&(state.layers.ext||(state.sel&&state.sel.kind==='ext')||!!($('#fdExt')&&$('#fdExt').open))}
function liveFetch(){
  if(!liveWanted())return;
  /* v38: no máximo um pedido a cada 5 s, mesmo quando várias partes do app pedem ao mesmo tempo ao abrir */
  var agora=Date.now();if(LIVE.ult&&agora-LIVE.ult<5000)return;LIVE.ult=agora;
  fetch(LIVE.url,{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
    var novos=(d.onibus||[]).filter(function(o){return Date.now()-o.t<6*60e3});
    /* a prefeitura falhou e o Worker não tinha cópia: mantém os ônibus que já estavam no mapa (até 6 min) */
    if(d.falhou&&!novos.length)novos=LIVE.bus.filter(function(o){return Date.now()-o.t<6*60e3});
    LIVE.bus=novos;LIVE.t=Date.now();LIVE.err=!!d.falhou;LIVE.falhas=d.falhou?(LIVE.falhas||0)+1:0;liveDraw();liveRefreshText();
    if(d.falhou)setTimeout(liveFetch,5200);
  },function(){LIVE.err=true;LIVE.falhas=(LIVE.falhas||0)+1;liveRefreshText();setTimeout(liveFetch,5200)});
}
function liveLoop(){clearInterval(LIVE.timer);if(!LIVE.url)return;liveFetch();LIVE.timer=setInterval(function(){liveFetch()},10000)}
document.addEventListener('visibilitychange',function(){if(!document.hidden)liveFetch()});
function liveCount(n){return LIVE.bus.filter(function(o){return o.l===n}).length}
function liveColor(n){var L=EXT.lines.filter(function(x){return x.n===n})[0];return (L&&L.c)||'#5B6B7A'}
function liveNearStop(p){var best=null,bd=1e18;Object.keys(EXTS).forEach(function(k){var q=EXTS[k].p,d=(q[0]-p[0])*(q[0]-p[0])+(q[1]-p[1])*(q[1]-p[1]);if(d<bd){bd=d;best=k}});return best}
function liveDraw(){
  var antes={};Object.keys(LV2.st).forEach(function(v){antes[v]=LV2.st[v].obs});
  liveDrawCore();
  var mudou=false;
  LIVE.bus.forEach(function(o){var S=LV2.st[o.v];if(!S||!S.obs)return;var O=S.obs,P=antes[o.v];
    if(P&&P.t===O.t){O.signOk=P.signOk;O.ve=P.ve;return}
    O.signOk=o.vel>2||!!(P&&P.i===O.i&&Math.abs(O.s-P.s)/MPU>5)||!!(P&&P.signOk);
    if(P){lvmMede(o,P,O);mudou=true}
    O.ve=null;lvV(O);
  });
  if(mudou){lvmSalva();lvmEnvia(false)}
  if(LV2.raf)cancelAnimationFrame(LV2.raf);LV2.raf=0;lvFrame();
}
function liveAgo(){var s=Math.round((Date.now()-LIVE.t)/1000);return s<60?'há '+s+' s':'há '+Math.round(s/60)+' min'}
function liveStatusHTML(){
  if(!LIVE.url)return '';
  if(LIVE.err&&!LIVE.t)return '<p class="lv-st muted small keep">Ao vivo indisponível agora; mostrando os horários programados.</p>';
  if(!LIVE.t)return '<p class="lv-st muted small keep"><span class="lv-ping"></span> Buscando ônibus ao vivo…</p>';
  var extra='',d=liveDelay(),n=lvmTotal();
  if(LIVE.bus.length&&d!=null)extra=' · posições com ~'+d+' s de atraso, ajustadas pela velocidade'+(n>=20?' e por '+n.toLocaleString('pt-BR')+' trajetos já medidos':'');
  return '<p class="lv-st small keep"><span class="lv-ping on"></span> <b>Ao vivo:</b> '+LIVE.bus.length+' ônibus na região do Fundão · atualizado '+liveAgo()+(LIVE.err?' (última tentativa falhou)':'')+extra+'</p>';
}
function liveTag(n){var c=liveCount(n);return c?' <span class="lv-tag">'+c+' ao vivo</span>':''}
function liveRefreshText(){
  if(state.sel&&state.sel.kind==='ext'&&!(document.activeElement&&detail.contains(document.activeElement)))renderDetail();
  var b=$('#fdExt');if(b&&b.open&&!(document.activeElement&&b.contains(document.activeElement)))extRepaint();
}
aoFazer('mapa atualizado',function(){if(LIVE.url&&liveWanted()&&!LIVE.timer)liveLoop()});
aoFazer('mapa montado',liveDraw);
document.addEventListener('toggle',function(e){if(e.target&&e.target.id==='fdExt'&&e.target.open)setTimeout(liveFetch,0)},true);
if(LIVE.url)liveLoop();
/* ======================= v29: paradas da prefeitura alinhadas às da UFRJ, um botão "Ônibus" e ônibus ao vivo sobre as ruas ======================= */
var MPU=Math.hypot(GEO.a,GEO.b);/* unidades do mapa por metro */
/* 1) ponto da prefeitura a até 100 m de uma parada interna (ou 170 m com nome parecido) vira a mesma parada */
(function(){
  var tok=function(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').split(/[^a-z0-9]+/).filter(function(w){return w.length>=4&&['fundao','ufrj','predio','faculdade'].indexOf(w)<0})};
  var G={},map={};
  Object.keys(EXTS).forEach(function(k){
    var P=EXTS[k].p,ta=tok(EXTS[k].name),best=null,bd=1e9,bs=null,bsd=1e9;
    Object.keys(STOPS).forEach(function(s){var q=STOPS[s].p,d=Math.hypot(q[0]-P[0],q[1]-P[1])/MPU,tb=tok(STOPS[s].name),sim=ta.some(function(w){return tb.some(function(v){return v.indexOf(w)===0||w.indexOf(v)===0})});
      if(d<bd){bd=d;best=s}if(sim&&d<bsd){bsd=d;bs=s}});
    /* nome parecido até 250 m vence; senão, a parada mais perto até 100 m. O Terminal Fundão é o mesmo complexo da Estação BRT. */
    var alvo=(k==='terminal'&&STOPS.est&&Math.hypot(STOPS.est.p[0]-P[0],STOPS.est.p[1]-P[1])/MPU<300)?'est':(bs&&bsd<=250)?bs:(best&&bd<=100)?best:null;
    var gid=alvo?'a_'+alvo:k;best=alvo||best;
    map[k]=gid;
    if(!G[gid])G[gid]=gid.indexOf('a_')===0?{name:STOPS[best].name,p:STOPS[best].p.slice(),alt:[],stop:best}:{name:EXTS[k].name,p:EXTS[k].p,alt:[]};
    if(G[gid].stop)G[gid].alt.push(EXTS[k].name);
  });
  Object.keys(EXTS).forEach(function(k){delete EXTS[k]});Object.keys(G).forEach(function(g){EXTS[g]=G[g]});
  EXT.lines.forEach(function(L){var seen={},st=[];L.st.forEach(function(s){var g=map[s[0]];if(!(g in seen)){seen[g]=1;st.push([g,s[1]])}});L.st=st});
})();
extDraw();
/* na parada interna, também os ônibus da cidade que param ali */
aoFazer('detalhe montado',function(){
  var s=state.sel;if(s&&s.kind==='stop'&&EXTS['a_'+s.id]){
    var id='a_'+s.id,now=nowMin(),ls=EXT.lines.filter(function(L){return extToday(L)&&L.st.some(function(x){return x[0]===id})});
    ls.sort(function(a,b){var x=extNext(a,id,now,1)[0],y=extNext(b,id,now,1)[0];return (x==null?1e9:x)-(y==null?1e9:y)});
    if(ls.length)detail.insertAdjacentHTML('beforeend','<div class="xhere"><h3>Ônibus da cidade nesta parada</h3><ul class="xl-list">'+ls.slice(0,6).map(function(L){return '<li><div class="xl-row">'+extBadge(L)+'<span class="grow"><b>'+esc(L.d)+'</b><small>'+extWhen(L,id,now)+'</small></span></div></li>'}).join('')+'</ul>'+(ls.length>6?'<p class="small keep"><button type="button" class="linkbtn" data-kind="ext" data-id="'+id+'">Ver as '+ls.length+' linhas</button></p>':'')+'</div>');
  }
});/* 2) um botão "Ônibus" com duas opções, como o do Wi-Fi */
function busChip(){var c=$('#chBus');if(!c)return;c.setAttribute('aria-pressed',String(!!(state.layers.bus||state.layers.ext)));c.setAttribute('aria-expanded',String(!!$('#busMenu')&&!$('#busMenu').hidden))}
(function(){
  var old=$('#chExt');if(old)old.remove();
  var c=$('#chBus');if(!c)return;
  c.innerHTML='<span class="sw sw-bus"></span><span>Ônibus</span><svg class="chev2" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>';
  c.setAttribute('aria-haspopup','true');c.setAttribute('aria-controls','busMenu');
  document.body.insertAdjacentHTML('beforeend','<div class="wifimenu" id="busMenu" role="menu" aria-label="Ônibus no mapa" hidden></div>');
  var m=$('#busMenu');
  function paint(){
    m.innerHTML='<p class="wm-t">Ônibus no mapa</p>'+
      '<label class="wm-i" role="menuitemcheckbox" aria-checked="'+!!state.layers.bus+'"><span class="sw sw-bus" style="opacity:1"></span><span class="grow"><b>Linhas internas</b><small>Ônibus gratuitos da UFRJ, paradas e trajetos</small></span><input type="checkbox" id="bmInt"'+(state.layers.bus?' checked':'')+'></label>'+
      '<label class="wm-i" role="menuitemcheckbox" aria-checked="'+!!state.layers.ext+'"><span class="sw sw-ext" style="opacity:1"></span><span class="grow"><b>Ônibus da cidade</b><small>Linhas municipais e BRT'+(LIVE.url?', com posição ao vivo':'')+'</small></span><input type="checkbox" id="bmExt"'+(state.layers.ext?' checked':'')+'></label>';
  }
  function place(){var r=c.getBoundingClientRect(),w=Math.min(300,innerWidth-24),x=Math.max(12,Math.min(r.left,innerWidth-w-12));m.style.width=w+'px';m.style.left=x+'px';m.style.top=(r.bottom+8)+'px'}
  function open(o){if(o){paint();place();m.hidden=false;var f=m.querySelector('input');if(f)f.focus({preventScroll:true})}else m.hidden=true;busChip()}
  c.addEventListener('click',function(e){e.stopImmediatePropagation();e.preventDefault();open(m.hidden)},true);
  m.addEventListener('change',function(e){if(e.target.id==='bmInt')setLayer('bus',c);if(e.target.id==='bmExt')setLayer('ext',c);paint();busChip()});
  document.addEventListener('click',function(e){if(!m.hidden&&!m.contains(e.target)&&!c.contains(e.target))open(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!m.hidden){open(false);c.focus()}});
  window.addEventListener('resize',function(){if(!m.hidden)place()});
  window.addEventListener('scroll',function(){if(!m.hidden)place()},{passive:true});
  busChip();
})();
/* 3) ônibus ao vivo presos ao traçado da linha e deslizando pela rua entre as atualizações */
var SHP=(EXT.shp||[]).map(function(d){var a=-2280000,o=-4320000,P=[],cum=[0];for(var i=0;i<d.length;i+=2){a+=d[i];o+=d[i+1];var p=ll2map(a/1e5,o/1e5);if(P.length){var q=P[P.length-1];cum.push(cum[cum.length-1]+Math.hypot(p[0]-q[0],p[1]-q[1]))}P.push(p)}return {P:P,c:cum}});
function snapBus(n,p){
  var best=null;
  /* dentro do campus: as ruas desenhadas no mapa vencem, se estiverem a até 45 m */
  SHP_INT.forEach(function(i){var r=projOn(i,p);if(r&&(!best||r.d<best.d))best=r});
  if(best&&best.d<=45*MPU)return best;
  var b2=null;((EXT.sh||{})[n]||[]).forEach(function(i){var r=SHP_EXT[i]!=null?projOn(SHP_EXT[i],p):null;if(r&&(!b2||r.d<b2.d))b2=r});
  if(b2&&b2.d<=120*MPU)return b2;
  return best&&best.d<=80*MPU?best:null;
}
function shpAt(i,s){var S=SHP[i],c=S.c,P=S.P;s=Math.max(0,Math.min(c[c.length-1],s));var j=1;while(j<c.length-1&&c[j]<s)j++;var a=P[j-1],b=P[j],L=(c[j]-c[j-1])||1e-9,t=(s-c[j-1])/L;return {x:a[0]+t*(b[0]-a[0]),y:a[1]+t*(b[1]-a[1]),ang:Math.atan2(b[0]-a[0],-(b[1]-a[1]))*180/Math.PI}}
function setMkPos(el,x,y){el.dataset.x=x.toFixed(1);el.dataset.y=y.toFixed(1);el.setAttribute('transform','translate('+el.dataset.x+','+el.dataset.y+')'+(ROT?' rotate('+(-ROT)+')':'')+' scale('+(+MS||1).toFixed(3)+')')}
/* atualização mais rápida: a cada 20 s (a prefeitura recebe uma posição a cada ~25 s) */
if(LIVE.url)liveLoop();
/* ======================= v30: planta real do CT (EPLAN CT / UFRJ, 2018) em "Prédios por dentro" ======================= */
var CTP={d:null,loading:false,err:false,pav:'pav1',bl:'',f:'',q:'',sel:null,vb:null,lastPl:'b_ct'};
var CTP_G={aula:['Salas de aula','#F2C94C'],lab:['Laboratórios','#56CCF2'],info:['Lab. de informática','#2DD4BF'],estudo:['Biblioteca e estudo','#A3E635'],wc:['Sanitários e vestiários','#F2994A'],vert:['Escadas e elevadores','#EB5757'],comer:['Copas e refeitório','#F472B6'],evento:['Auditórios e cultura','#C084FC'],gab:['Gabinetes','#7C8CE0'],adm:['Administração','#B794F4'],circ:['Corredores','#94A3B8'],apoio:['Apoio e depósitos','#64748B'],ext:['Pátios','#475569']};
var CTP_F=[['wc','Sanitários'],['vert','Escadas e elevadores'],['aula','Salas de aula'],['lab','Laboratórios'],['estudo','Estudo'],['comer','Copas']];
var CTP_PAV={subsolo:'Subsolo',pav1:'1º',pav2:'2º',pav3:'3º',pav4:'4º',pav5:'5º',pav6:'6º',pav7:'7º',pav8:'8º'};
function ctpLoad(){
  if(CTP.d||CTP.loading)return;CTP.loading=true;
  fetch('ct-plantas.json').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){
    d.salas.forEach(function(s,i){s.i=i;s.P=s[5].map(function(r){var x=0,y=0,o=[];for(var k=0;k<r.length;k+=2){x+=r[k];y+=r[k+1];o.push([x/10,y/10])}return o});
      var xs=[],ys=[];s.P.forEach(function(r){r.forEach(function(p){xs.push(p[0]);ys.push(p[1])})});s.bb=[Math.min.apply(0,xs),Math.min.apply(0,ys),Math.max.apply(0,xs),Math.max.apply(0,ys)];s.c=[(s.bb[0]+s.bb[2])/2,(s.bb[1]+s.bb[3])/2]});
    CTP.d=d;CTP.loading=false;ctpPaint();
  },function(){CTP.loading=false;CTP.err=true;ctpPaint()});
}
function ctpRooms(){return CTP.d.salas.filter(function(s){return s[1]===CTP.pav&&(!CTP.bl||s[0]===CTP.bl)})}
function ctpPavs(){var o={};CTP.d.salas.forEach(function(s){if(!CTP.bl||s[0]===CTP.bl)o[s[1]]=(o[s[1]]||0)+1});return Object.keys(CTP_PAV).filter(function(k){return o[k]})}
/* celular em pé: quando o que aparece é mais largo que alto (o CT inteiro, um bloco deitado), a planta gira 90° para
   ocupar a tela; com o CT inteiro, o Bloco A fica em cima. O giro é decidido a cada enquadramento (CTP.rot). */
function ctpPortrait(){return !!window.matchMedia&&matchMedia('(max-width:680px) and (orientation:portrait)').matches}
function ctpRot(){return !!CTP.rot}
function ctpFit(rs){var a=[1e9,1e9,-1e9,-1e9];if(!rs.length)a=CTP.d.bbox.slice();else rs.forEach(function(s){a[0]=Math.min(a[0],s.bb[0]);a[1]=Math.min(a[1],s.bb[1]);a[2]=Math.max(a[2],s.bb[2]);a[3]=Math.max(a[3],s.bb[3])});
  CTP.rot=ctpPortrait()&&(a[2]-a[0])>(a[3]-a[1])*1.1;if(CTP.rot)a=[-a[3],a[0],-a[1],a[2]];
  var m=Math.max(6,(a[2]-a[0])*.04);return [a[0]-m,a[1]-m,a[2]+m,a[3]+m]}
function ctpVB(v){return [v[0],v[1],v[2]-v[0],v[3]-v[1]].map(function(x){return x.toFixed(1)}).join(' ')}
function ctpLabel(s){return s[4]||s[3]}
function ctpWhere(s){return 'Bloco '+s[0]+' · '+(s[1]==='subsolo'?'subsolo':CTP_PAV[s[1]]+' andar')}
function ctpSVG(){
  var rs=ctpRooms(),vb=CTP.vb||ctpFit(rs),w=vb[2]-vb[0],h=vb[3]-vb[1],sw=(w/700).toFixed(2),rot=ctpRot(),fw=Math.max(w,rot?h:0);
  var p='';rs.forEach(function(s){var g=CTP_G[s[2]]||CTP_G.apoio,dim=CTP.f&&s[2]!==CTP.f,sel=CTP.sel===s.i;
    p+='<path data-ctr="'+s.i+'" class="ctr'+(sel?' sel':'')+(dim?' dim':'')+'" d="'+s.P.map(function(r){return 'M'+r.map(function(q){return q[0].toFixed(1)+' '+q[1].toFixed(1)}).join('L')+'Z'}).join('')+'" style="fill:'+g[1]+'"><title>'+esc(ctpLabel(s)+' · '+ctpWhere(s))+'</title></path>'});
  var lb='';if(!CTP.bl){var seen={};rs.forEach(function(s){(seen[s[0]]=seen[s[0]]||[]).push(s.c)});Object.keys(seen).forEach(function(b){var c=seen[b],x=0,y=0;c.forEach(function(q){x+=q[0];y+=q[1]});var tx=(x/c.length).toFixed(1),ty=(y/c.length).toFixed(1);lb+='<text class="ctb" x="'+tx+'" y="'+ty+'"'+(rot?' transform="rotate(-90 '+tx+' '+ty+')"':'')+' style="font-size:'+(fw/38).toFixed(1)+'px">'+esc(b.length>2?b.slice(0,3):b)+'</text>'})}
  var pin='';if(CTP.sel!=null){var S=CTP.d.salas[CTP.sel];if(S[1]===CTP.pav)pin='<circle class="ctpin" cx="'+S.c[0].toFixed(1)+'" cy="'+S.c[1].toFixed(1)+'" r="'+(fw/60).toFixed(1)+'"/>'}
  return '<svg class="ctsvg'+(rot?' rot':'')+'" id="ctsvg" viewBox="'+ctpVB(vb)+'" style="--ctsw:'+sw+';aspect-ratio:'+w.toFixed(0)+' / '+Math.max(h,w*.45).toFixed(0)+'" role="img" aria-label="Planta do CT, '+esc(CTP_PAV[CTP.pav]||'')+' andar'+(rot?', girada: o Bloco A fica em cima':'')+'">'+(rot?'<g transform="rotate(90)">':'')+p+lb+pin+(rot?'</g>':'')+'</svg>';
}
function ctpSearch(q){
  q=q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();if(q.length<2)return [];
  var syn={banheiro:'sanitario',wc:'sanitario',elevador:'elevador',escada:'escada',biblioteca:'biblioteca',copa:'copa',auditorio:'auditorio'};var qq=syn[q]||q;
  var nrm=function(t){return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')};
  var bl=CTP.d.blocos.filter(function(b){return nrm(b[3]).indexOf(qq)>=0||nrm('bloco '+b[0])===qq}).map(function(b){return {bloco:b}});
  var rs=CTP.d.salas.filter(function(s){return nrm(s[4]).indexOf(qq)>=0||nrm(s[3]).indexOf(qq)>=0});
  rs.sort(function(a,b){return (a[4]?0:1)-(b[4]?0:1)||a[0].localeCompare(b[0])||a[1].localeCompare(b[1])});
  return bl.concat(rs.slice(0,40).map(function(s){return {s:s}})).concat(rs.length>40?[{mais:rs.length-40}]:[]);
}
function ctpInner(){
  if(CTP.err)return '<p class="small keep">Não deu para carregar a planta agora. Tente de novo mais tarde.</p>';
  if(!CTP.d){ctpLoad();return '<p class="muted small keep">Carregando a planta do CT…</p>'}
  var pavs=ctpPavs();if(pavs.indexOf(CTP.pav)<0)CTP.pav=pavs.indexOf('pav1')>=0?'pav1':pavs[0];
  var bls=['A','B','C','D','E','F','G','H','I','J','K','ABC','Auditório'].filter(function(b){return CTP.d.salas.some(function(s){return s[0]===b})});
  var h='<label class="fld ctq">Buscar no CT<input id="ctpq" type="search" autocomplete="off" value="'+esc(CTP.q)+'" placeholder="Banheiro, biblioteca, Escola de Química, LABEST…"></label>';
  if(CTP.q.length>=2){var R=ctpSearch(CTP.q);h+='<ul class="ctres">'+(R.length?R.map(function(r){
      if(r.bloco)return '<li><button type="button" data-ctbl="'+esc(r.bloco[0])+'"><b>Bloco '+esc(r.bloco[0])+'</b><small>'+esc(r.bloco[3])+'</small></button></li>';
      if(r.mais)return '<li class="muted small">e mais '+r.mais+'… refine a busca</li>';
      return '<li><button type="button" data-cts="'+r.s.i+'"><b>'+esc(ctpLabel(r.s))+'</b><small>'+esc((r.s[4]?r.s[3]+' · ':'')+ctpWhere(r.s))+'</small></button></li>'}).join(''):'<li class="muted small">Nada encontrado.</li>')+'</ul>'}
  h+='<div class="seg chips ctseg" role="group" aria-label="Bloco"><button type="button" data-ctbl="" aria-pressed="'+!CTP.bl+'">Todos</button>'+bls.map(function(b){return '<button type="button" data-ctbl="'+esc(b)+'" aria-pressed="'+(CTP.bl===b)+'">'+esc(b==='Auditório'?'Aud.':b)+'</button>'}).join('')+'</div>';
  h+='<div class="seg chips ctseg" role="group" aria-label="Andar">'+pavs.map(function(k){return '<button type="button" data-ctpav="'+k+'" aria-pressed="'+(CTP.pav===k)+'">'+CTP_PAV[k]+'</button>'}).join('')+'</div>';
  h+='<div class="ctf">'+CTP_F.map(function(f){return '<button type="button" class="chip" data-ctf="'+f[0]+'" aria-pressed="'+(CTP.f===f[0])+'"><span class="sw" style="background:'+CTP_G[f[0]][1]+';opacity:1"></span>'+f[1]+'</button>'}).join('')+'</div>';
  var cnt=CTP.f?ctpRooms().filter(function(s){return s[2]===CTP.f}).length:0;
  h+='<div class="ctwrap">'+ctpSVG()+'<div class="ctz"><button type="button" data-ctz="1" aria-label="Aproximar">+</button><button type="button" data-ctz="-1" aria-label="Afastar">−</button><button type="button" data-ctz="0" aria-label="Ver tudo">⤢</button></div></div>';
  if(CTP.sel!=null){var S=CTP.d.salas[CTP.sel],B=CTP.d.blocos.filter(function(b){return b[0]===S[0]})[0];h+='<p class="ctinfo keep"><b>'+esc(ctpLabel(S))+'</b> · '+esc((S[4]?S[3]+' · ':'')+ctpWhere(S))+(B&&B[3]?'<small>Bloco '+esc(S[0])+': '+esc(B[3])+'</small>':'')+'</p>'}
  else if(CTP.f)h+='<p class="ctinfo keep">'+cnt+' '+CTP_G[CTP.f][0].toLowerCase()+' neste andar'+(CTP.bl?' do bloco '+esc(CTP.bl):'')+'.</p>';
  else h+='<p class="muted small keep">Toque numa sala para ver o que é. Use os filtros para achar sanitários, escadas e salas de aula.'+(ctpRot()&&!CTP.bl?' Com o celular em pé, a planta fica de lado: o Bloco A fica em cima.':'')+'</p>';
  h+='<p class="muted small keep">Fonte: '+esc(CTP.d.fonte)+'. Os espaços não têm número de sala, e alguns usos podem ter mudado desde 2018.</p>';
  return h;
}
function ctpHTML(){return '<div class="ctp" id="ctp"><div class="ctp-h"><b>Planta real do CT</b><small>Todos os blocos e andares, sala por sala</small></div><div id="ctpb">'+ctpInner()+'</div></div>'}
function ctpPaint(foc){var b=$('#ctpb');if(!b)return;b.innerHTML=ctpInner();if(foc){var e=$(foc);if(e){e.focus({preventScroll:true});if(e.id==='ctpq'){var v=e.value;e.setSelectionRange(v.length,v.length)}}}}
document.addEventListener('input',function(e){if(e.target.id==='ctpq'){CTP.q=e.target.value;ctpPaint('#ctpq')}});
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('[data-ctbl],[data-ctpav],[data-ctf],[data-cts],[data-ctz],[data-ctr]');if(!t||!CTP.d)return;
  if(t.dataset.ctbl!=null){CTP.bl=t.dataset.ctbl;CTP.vb=null;if(t.closest('.ctres'))CTP.q='';}
  else if(t.dataset.ctpav){CTP.pav=t.dataset.ctpav;CTP.vb=null}
  else if(t.dataset.ctf){CTP.f=CTP.f===t.dataset.ctf?'':t.dataset.ctf;CTP.sel=null}
  else if(t.dataset.cts){var S=CTP.d.salas[+t.dataset.cts];CTP.sel=S.i;CTP.pav=S[1];CTP.bl=S[0];CTP.q='';CTP.f='';var r=ctpRooms();CTP.vb=null;CTP.vb=ctpFit(r);setTimeout(function(){var w=$('#ctsvg');if(w)w.scrollIntoView({block:'center',behavior:'smooth'})},50)}
  else if(t.dataset.ctz!=null){var z=+t.dataset.ctz,vb=CTP.vb||ctpFit(ctpRooms());if(!z)CTP.vb=null;else{var cx=(vb[0]+vb[2])/2,cy=(vb[1]+vb[3])/2,k=z>0?.6:1/.6,hw=(vb[2]-vb[0])*k/2,hh=(vb[3]-vb[1])*k/2;CTP.vb=[cx-hw,cy-hh,cx+hw,cy+hh]}}
  else if(t.dataset.ctr){CTP.sel=CTP.sel===+t.dataset.ctr?null:+t.dataset.ctr}
  ctpPaint();
});
/* girou o celular: refaz a planta no novo sentido */
if(window.matchMedia){var ctpMQ=matchMedia('(max-width:680px) and (orientation:portrait)'),ctpMQf=function(){CTP.vb=null;if(CTP.d)ctpPaint()};if(ctpMQ.addEventListener)ctpMQ.addEventListener('change',ctpMQf);else if(ctpMQ.addListener)ctpMQ.addListener(ctpMQf)}
/* arrastar a planta */
(function(){var drag=null;
  document.addEventListener('pointerdown',function(e){var s=e.target.closest&&e.target.closest('#ctsvg');if(!s||!CTP.d)return;var vb=CTP.vb||ctpFit(ctpRooms()),r=s.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,vb:vb,k:Math.max((vb[2]-vb[0])/r.width,(vb[3]-vb[1])/r.height),moved:false}});
  document.addEventListener('pointermove',function(e){if(!drag)return;var dx=(e.clientX-drag.x)*drag.k,dy=(e.clientY-drag.y)*drag.k;if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>6)drag.moved=true;if(!drag.moved)return;CTP.vb=[drag.vb[0]-dx,drag.vb[1]-dy,drag.vb[2]-dx,drag.vb[3]-dy];var s=$('#ctsvg');if(s)s.setAttribute('viewBox',ctpVB(CTP.vb))});
  document.addEventListener('pointerup',function(e){if(drag&&drag.moved){var stop=function(ev){ev.stopPropagation();ev.preventDefault();document.removeEventListener('click',stop,true)};document.addEventListener('click',stop,true);setTimeout(function(){document.removeEventListener('click',stop,true)},50)}drag=null});
})();
/* "Prédios por dentro" já aberto na carga foi montado antes desta parte: monta de novo, agora com a planta */
if(pstate.bldOpen&&pstate.bld==='ct'&&document.querySelector('#fdBld[open]'))renderPredios();
/* ======================= v31: ônibus da cidade sobre as ruas do mapa ======================= */
/* ruas:  os traçados das linhas internas (desenhados sobre a planta) + os da prefeitura recalibrados */
SHP=[];var SHP_INT=[];
function shpAdd(P){var cum=[0];for(var j=1;j<P.length;j++)cum.push(cum[j-1]+Math.hypot(P[j][0]-P[j-1][0],P[j][1]-P[j-1][1]));SHP.push({P:P,c:cum});return SHP.length-1}
Object.keys(LINES).forEach(function(l){(LINES[l].trips||[]).forEach(function(t){if(t.pts&&t.pts.length>1)SHP_INT.push(shpAdd(t.pts.map(function(p){return [p[0],p[1]]})))})});
var SHP_EXT={};(EXT.shp||[]).forEach(function(d,i){var a=-2280000,o=-4320000,P=[];for(var k=0;k<d.length;k+=2){a+=d[k];o+=d[k+1];P.push(ll2map(a/1e5,o/1e5))}SHP_EXT[i]=shpAdd(P)});
function projOn(i,p){var S=SHP[i],best=null;for(var j=1;j<S.P.length;j++){var a=S.P[j-1],b=S.P[j],dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy||1e-9,t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2)),x=a[0]+t*dx,y=a[1]+t*dy,d=Math.hypot(p[0]-x,p[1]-y);if(!best||d<best.d)best={d:d,x:x,y:y,i:i,s:S.c[j-1]+t*Math.sqrt(L2),ang:Math.atan2(dx,-dy)*180/Math.PI}}return best}
/* ======================= v32: ônibus ao vivo com posição prevista (velocidade + traçado), atraso visível e busca a cada 15 s ======================= */
var LV2={st:{},raf:0,last:0};
function lvLen(i){var c=SHP[i].c;return c[c.length-1]}
function lvSign(o,sn,prev){
  /* parado (velocidade quase zero): o GPS oscila uns metros; mantém o sentido de antes */
  if(prev&&prev.i===sn.i&&prev.sign&&!(o.vel>2))return prev.sign;
  if(prev&&prev.i===sn.i&&prev.s!=null){var ds=sn.s-prev.s;if(Math.abs(ds)/MPU>5)return ds>0?1:-1}
  if(o.vel>2){var comp=((angN()+o.dir)%360+360)%360,d=Math.abs(((sn.ang-comp)%360+540)%360-180);return d>90?-1:1}
  return prev&&prev.sign||1;
}
/* Sem dar ré na tela (teste com 4 dias de GPS, 282 mil atualizações: 27% delas faziam o ônibus voltar, em média 95 m):
   - só adianta o ônibus até LV_PRED_MAX s depois da última posição (depois disso a previsão quase sempre passa do ponto);
   - se a posição nova fica até LV_SEGURA_M atrás do que aparece, o marcador espera parado até a previsão alcançá-lo
     (até 30 s); correções maiores viram um salto rápido, nunca um deslize para trás.
   Resultado no teste: ré em 2,3% das atualizações (só as grandes, agora em salto); erro do que aparece 42,4 → 43,9 m. */
var LV_PRED_MAX=30,LV_SEGURA_M=150;
function lvPred(S,now){
  var O=S.obs;if(!O||O.i==null)return null;
  var dt=Math.max(0,Math.min(LV_PRED_MAX,(now-O.t)/1000)),s=O.s+O.sign*lvDist(O,dt)*MPU;
  return Math.max(0,Math.min(lvLen(O.i),s));
}
function lvFrame(){
  LV2.raf=0;
  /* durante o arrasto ou a pinça, os ônibus esperam (o mapa inteiro já se move); voltam a andar logo depois */
  if(Date.now()-lastGesture<200&&!document.hidden){LV2.raf=requestAnimationFrame(function(){setTimeout(lvFrame,120)});return}var now=Date.now(),red=matchMedia('(prefers-reduced-motion:reduce)').matches||perfEff()==='leve',any=false;
  Object.keys(LV2.st).forEach(function(v){var S=LV2.st[v];if(!S.el||!S.el.isConnected)return;
    var O=S.obs,x=null,y=null,ang=null,ps=lvPred(S,now),si=null,ss=null,mv=O&&O.i!=null&&lvV(O)>0.3;
    var k=S.blend?Math.min(1,(now-S.blend.t0)/1500):1;if(S.blend&&k>=1)S.blend=null;
    if(S.hold&&(ps==null||S.hold.i!==O.i||(ps-S.hold.s)*O.sign>=0||now-S.hold.ini>30e3)){var ex=S.hold;S.hold=null;if(ps!=null&&ex.i===O.i&&(ps-ex.s)*O.sign<0)lvSalto(S)}
    if(ps!=null){si=O.i;ss=S.hold?S.hold.s:ps;if(S.hold)any=true;
      if(S.blend){any=true;var e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
        /* mesmo traçado e perto: desliza pela rota; senão, em linha reta */
        if(S.blend.i===si&&S.blend.s!=null&&Math.abs(S.blend.s-ps)<700*MPU)ss=S.blend.s+(ps-S.blend.s)*e;
        else{var q=shpAt(si,ps);x=S.blend.x+(q.x-S.blend.x)*e;y=S.blend.y+(q.y-S.blend.y)*e}}
      var p=shpAt(si,ss);if(x==null){x=p.x;y=p.y}
      ang=mv||O.v>0.5?(O.sign>0?p.ang:p.ang+180):null;if(mv)any=true;
    }else{x=O.x;y=O.y;ang=O.ang;if(S.blend){any=true;x=S.blend.x+(x-S.blend.x)*k;y=S.blend.y+(y-S.blend.y)*k}}
    setMkPos(S.el,x,y);S.x=x;S.y=y;S.i=si;S.s=ss;
    var ar=S.el.querySelector('.lv-dir');if(ar){ar.style.display=ang==null?'none':'';if(ang!=null)ar.setAttribute('transform','rotate('+(ang+(ROT||0)).toFixed(0)+')')}
  });
  if(any&&!red&&!document.hidden)LV2.raf=requestAnimationFrame(function(){setTimeout(lvFrame,90)});
}
/* chegou uma posição nova: decide como o marcador vai até a previsão nova */
function lvCorrige(S,A){
  var O=S.obs,now=Date.now(),ps=lvPred(S,now),h=S.hold;S.blend=null;S.hold=null;
  if(S.x==null)return;
  if(ps!=null&&S.i===O.i&&S.s!=null){
    var g=(ps-S.s)*O.sign/MPU;
    if(g<-10){/* a previsão tinha passado do ponto: espera parado (ônibus andando, até 150 m) ou salta, sem andar de ré */
      if(-g<LV_SEGURA_M&&O.v>0){S.hold={i:O.i,s:S.s,ini:h&&h.i===O.i?h.ini:now};return}
      lvSalto(S);return}
  }
  /* outro traçado (ou sem traçado): se o caminho até a posição nova vai contra o sentido em que o ônibus andava, salta */
  if(A&&A.i!=null&&S.i!=null&&S.s!=null){var q=ps!=null?shpAt(O.i,ps):{x:O.x,y:O.y},a=shpAt(S.i,S.s).ang*Math.PI/180,sg=A.sign||1,
      dx=q.x-S.x,dy=q.y-S.y;if((dx*Math.sin(a)-dy*Math.cos(a))*sg<-10*MPU){lvSalto(S);return}}
  S.blend={x:S.x,y:S.y,i:S.i,s:S.s,t0:now};
}
function lvSalto(S){S.blend=null;if(S.el&&S.el.animate&&!matchMedia('(prefers-reduced-motion:reduce)').matches)try{S.el.animate([{opacity:.1},{opacity:1}],{duration:380,easing:'ease-out'})}catch(e){}}
aoFazer('mapa vai montar',function(){LV2.st={}});/* os marcadores ao vivo são recriados */
document.addEventListener('visibilitychange',function(){if(!document.hidden&&!LV2.raf)lvFrame()});
/* atraso das posições no aviso "ao vivo" */
function liveDelay(){var a=LIVE.bus.map(function(o){return (LIVE.t-o.t)/1000}).sort(function(x,y){return x-y});return a.length?Math.round(a[Math.floor(a.length/2)]):null}
/* busca a cada 15 s (o Worker guarda por 15 s) */
if(LIVE.url)liveLoop();
/* ======================= v33: mapa da cidade (Esri Canvas, dados OpenStreetMap) ao redor da planta, com a camada "Ônibus da cidade" ======================= */
function map2ll(X,Y){var G=GEO,kx=111320*Math.cos(G.lat0*Math.PI/180),x=X-G.tx,y=Y-G.ty,D=-(G.a*G.a+G.b*G.b),e=(-G.a*x+G.b*y)/D,n=(G.b*x+G.a*y)/D;return [G.lat0+n/110574,G.lng0+e/kx]}
/* ======================= v35: aprendizado da previsão dos ônibus ao vivo =======================
   A cada posição nova de um ônibus, compara onde o app previu que ele estaria com onde ele realmente estava.
   O desvio é guardado (no aparelho e, em lotes, no Firestore: coleção "desvios") e vira um modelo por trecho de rua,
   sentido, faixa de velocidade e horário (pico ou fora), que corrige a velocidade usada na previsão.
   A gestão (aba "Previsão dos ônibus") consolida as amostras de todos os aparelhos e publica o modelo em gestao/previsao. */
var LVM={loc:{},pub:{},pubN:0,fila:[],hist:[],up:0,K:6};
var LVM_CEL=150;/* metros por célula de rua */
(function(){try{LVM.loc=JSON.parse(localStorage.getItem('cse-lv-modelo')||'{}')||{};LVM.fila=JSON.parse(localStorage.getItem('cse-lv-fila')||'[]')||[];LVM.hist=JSON.parse(localStorage.getItem('cse-lv-hist')||'[]')||[]}catch(e){}})();
function lvmSalva(){try{
  var ks=Object.keys(LVM.loc);if(ks.length>3000){ks.sort(function(a,b){return LVM.loc[a][0]-LVM.loc[b][0]});ks.slice(0,ks.length-2500).forEach(function(k){delete LVM.loc[k]})}
  localStorage.setItem('cse-lv-m2',JSON.stringify(LVM.loc));localStorage.setItem('cse-lv-fila',JSON.stringify(LVM.fila.slice(-600)));localStorage.setItem('cse-lv-hist',JSON.stringify(LVM.hist.slice(-600)));
}catch(e){}}
function lvmVb(v){var k=v*3.6;return k<2?0:k<15?1:k<35?2:3}/* faixa de velocidade informada */
function lvmPer(t){var d=new Date(t),h=d.getHours()+d.getMinutes()/60,w=d.getDay();return (w>0&&w<6&&((h>=6&&h<9.5)||(h>=16&&h<20)))?'p':'f'}
function lvmDir(O){if(O.i==null)return 0;var a=shpAt(O.i,O.s).ang+(O.sign<0?180:0);return Math.round((((a%360)+360)%360)/45)%8}
function lvmCel(O){var c=LVM_CEL*MPU;return Math.floor(O.x/c)+','+Math.floor(O.y/c)}
/* número do traçado da prefeitura (posição em EXT.shp) a partir do índice interno */
var LVM_TR=null;function lvmTracado(i){if(!LVM_TR){LVM_TR={};Object.keys(SHP_EXT).forEach(function(k){LVM_TR[SHP_EXT[k]]=k})}return i!=null&&LVM_TR[i]!=null?LVM_TR[i]:null}
/* velocidade efetiva (m/s) ao longo do traçado: a informada, corrigida pelo que se aprendeu naquele trecho */
function lvmVel(O){
  if(lvmVb(O.v)===0)return 0;/* parado fica parado: nas medições, 3 de cada 4 continuavam no mesmo lugar */
  /* histórico de GPS da prefeitura, quando existe para o trecho; senão, o que os aparelhos mediram */
  var H=LV_HIST;if(H&&H.f){var k=lvHistKey(O);if(k&&H.f[k]!=null)return O.v*H.f[k]}
  return O.v*lvfEscolhe(lvmSt2,lvfChaves(lvmCel(O),lvmDir(O),lvmVb(O.v),lvmPer(O.t)));
}
function lvV(O){if(O.ve==null)O.ve=lvmVel(O);return O.ve}
function lvmTotal(){var n=0;[LVM.pub,LVM.loc].forEach(function(M){Object.keys(M).forEach(function(k){if(k.indexOf('g|')===0)n+=M[k][0]})});return n}
/* previsão usa a velocidade aprendida */
/* mede o desvio quando chega uma posição nova */
function lvmMede(o,P,O){
  if(!P||!O||P.i==null||O.i==null||P.i!==O.i||!(O.t>P.t))return;
  var dt=(O.t-P.t)/1000;if(dt<5||dt>120)return;
  var real=(O.s-P.s)*P.sign/MPU;
  if(Math.abs(real)>25*dt+60)return;
  var h=Math.min(dt,60),dRaw=P.v*h,dMod=(typeof lvDist==='function'?lvDist(P,h):lvV(P)*h),dReal=real*(h/dt);
  /* traçado e posição ao longo dele (de 5 em 5 m): permitem achar onde o ônibus perde tempo (semáforo, lombada) */
  var tr=lvmTracado(P.i),pos=tr==null?'':Math.round(P.s/MPU/5)*5;
  var amostra=[Math.round(P.t/1000),o.l,lvmCel(P),lvmDir(P),lvmVb(P.v),lvmPer(P.t),Math.round(dt),Math.round(P.v*36),Math.round(real),Math.round(dRaw),Math.round(dMod),tr==null?'':tr,pos,P.sign>0?1:-1].join('|');
  LVM.fila.push(amostra);LVM.hist.push(amostra);
  /* aprende só com ônibus em movimento, intervalos normais e sem salto para trás (erro de encaixe, não movimento) */
  if(dt<=75&&real>=-50&&lvmVb(P.v)>0)lvfSoma(LVM.loc,lvfChaves(lvmCel(P),lvmDir(P),lvmVb(P.v),lvmPer(P.t)),dReal,dRaw);
  LVM.ult={erroRaw:Math.abs(dReal-dRaw),erroMod:Math.abs(dReal-dMod)};
}
/* correção: com o painel "Ônibus da cidade" aberto, cada resposta redesenhava o painel, o painel reaberto disparava outra busca
   e o app ficava buscando sem parar (dezenas de vezes por minuto). Agora há no máximo uma busca a cada 5 s. */
/* envio em lotes (anônimo: só linha, trecho, horário e desvio; nada de quem usa o app) */
function lvmEnvia(forca){
  if(!FB_ON||LV_HIST||!LVM.fila.length||LVM.envB)return;/* com o histórico da prefeitura, os aparelhos não precisam medir */
  var agora=Date.now();if(!forca&&(LVM.fila.length<40||agora-LVM.up<180000))return;if(forca&&LVM.fila.length<5)return;
  var lote=LVM.fila.slice(0,150);LVM.envB=true;
  fbInit().then(function(fb){return fb.db.collection('desvios').add({a:lote,n:lote.length,ts:agora,ver:String(APP_VERSION).slice(0,20)})}).then(function(){
    LVM.fila.splice(0,lote.length);LVM.up=Date.now();LVM.envB=false;lvmSalva();
  },function(){LVM.up=Date.now();LVM.envB=false});
}
window.addEventListener('pagehide',function(){lvmEnvia(true)});
document.addEventListener('visibilitychange',function(){if(document.hidden)lvmEnvia(true)});
/* modelo publicado pela gestão (consolidado de todos os aparelhos) */
function lvmCarrega(){
  if(!FB_ON)return;
  fbInit().then(function(fb){return fb.db.collection('gestao').doc('previsao').get()}).then(function(d){
    var o=d&&d.exists?d.data():null;if(!o||!o.b2)return;
    LVM.pub={};Object.keys(o.b2).forEach(function(k){var v=o.b2[k];if(Array.isArray(v)&&v.length===LVF.length+1)LVM.pub[k]=v});LVM.pubN=o.n||0;LVM.pubAt=o.at||0;
    var vis=0;try{vis=+localStorage.getItem('cse-lv-pubat2')||0}catch(e){}
    if(LVM.pubAt>vis){LVM.loc=lvgModelo2(LVM.fila.map(lvmParse).filter(Boolean));try{localStorage.setItem('cse-lv-pubat2',String(LVM.pubAt))}catch(e){}lvmSalva()}
    Object.keys(LV2.st).forEach(function(v){var O=LV2.st[v].obs;if(O)O.ve=null});
  },function(){});
}
if(LIVE.url)setTimeout(function(){lvmCarrega()},2500);
/* aviso "ao vivo" conta quanto a previsão já aprendeu */
/* ---------- Gestão › Previsão dos ônibus ---------- */
GTABS.push(['previsao','Previsão dos ônibus']);TAB_PERM.previsao='linhas';
var LVG={am:null,busy:false,err:false,docs:0};
function lvmParse(s){var a=String(s).split('|');if(a.length<11)return null;return {t:+a[0],l:a[1],cel:a[2],d:+a[3],vb:+a[4],per:a[5],dt:+a[6],v:+a[7]/36,real:+a[8],raw:+a[9],mod:+a[10],tr:a[11]||'',pos:a[12]||'',sg:a[13]||''}}
function lvgCarrega(){
  if(LVG.busy)return;LVG.busy=true;LVG.err=false;
  var p=FB_ON?fbInit().then(function(fb){return fb.db.collection('desvios').limit(3000).get()}).then(function(s){LVG.docs=s.docs.length;LVG.ids=s.docs.map(function(d){return [d.id,(d.data()||{}).ts||0]});var r=[];s.docs.forEach(function(d){(d.data().a||[]).forEach(function(x){r.push(x)})});return r.concat(LVM.fila)})
    :Promise.resolve(LVM.hist.slice());
  p.then(function(l){LVG.am=l.map(lvmParse).filter(Boolean);LVG.busy=false;if(gTab==='previsao')renderGest()},function(){LVG.am=LVM.hist.map(lvmParse).filter(Boolean);LVG.err=true;LVG.busy=false;if(gTab==='previsao')renderGest()});
}
function lvgMae(A,f){if(!A.length)return null;return A.reduce(function(s,a){return s+Math.abs(f(a))},0)/A.length}
function lvgCSV(){
  var A=LVG.am||[],l=['hora,linha,celula,direcao_0a7,faixa_vel,periodo,intervalo_s,vel_informada_kmh,andou_real_m,previsto_simples_m,previsto_aprendido_m,tracado,posicao_m,sentido'];
  A.forEach(function(a){l.push([new Date(a.t*1000).toISOString(),a.l,'"'+a.cel+'"',a.d,a.vb,a.per,a.dt,Math.round(a.v*3.6),a.real,a.raw,a.mod,a.tr,a.pos,a.sg].join(','))});
  var el=document.createElement('a');el.href=URL.createObjectURL(new Blob([l.join('\n')],{type:'text/csv'}));el.download='desvios-previsao-onibus.csv';document.body.appendChild(el);el.click();setTimeout(function(){URL.revokeObjectURL(el.href);el.remove()},1000);
}
function gPrevisao(){
  if(!LVG.am){lvgCarrega();return '<h3 class="gh">Previsão dos ônibus</h3><p class="muted small keep">Carregando as medições…</p>'}
  var A=LVG.am,f=function(x){return x==null?'—':Math.round(x)+' m'},h=function(a){return Math.min(a.dt,60)/a.dt};
  var saltos=A.filter(function(a){return a.real<-50}).length,cur=A.filter(function(a){return a.dt<=75&&a.real>=-50});
  var maeRaw=lvgMae(cur,function(a){return a.real*h(a)-a.raw}),maeMod=lvgMae(cur,function(a){return a.real*h(a)-a.mod}),sim=lvgSimula(A);
  var faixas=['parado','até 15 km/h','15 a 35 km/h','acima de 35 km/h'],linhas={};A.forEach(function(a){linhas[a.l]=1});
  var porVb=faixas.map(function(nm,i){var B=cur.filter(function(a){return a.vb===i});return '<tr><td>'+nm+'</td><td>'+B.length+'</td><td>'+f(lvgMae(B,function(a){return a.real*h(a)-a.raw}))+'</td><td>'+f(lvgMae(B,function(a){return a.real*h(a)-a.mod}))+'</td></tr>'}).join('');
  var hist=LV_HIST?'<p class="small keep"><b>Previsão ajustada pelo histórico de GPS da prefeitura</b> ('+esc(LV_HIST.de||'')+' a '+esc(LV_HIST.ate||'')+', '+(LV_HIST.pares||0).toLocaleString('pt-BR')+' pares de posições): erro médio nos dias de teste de '+f(LV_HIST.aval.so_velocidade)+' para '+f(Math.min.apply(null,Object.keys(LV_HIST.aval).map(function(k){return LV_HIST.aval[k]})))+'. Com isso, os aparelhos param de enviar medições.</p>':'';
  var RA=REDUT&&REDUT.ajuste,red='<p class="small keep"><b>Semáforos e lombadas</b>: '+(REDUT.s||[]).length+' semáforos e '+(REDUT.l||[]).length+' lombadas mapeados (UFRJ e OpenStreetMap). '+
    (RA?'Com o GPS da prefeitura ('+(RA.pares||0).toLocaleString('pt-BR')+' pares de posições), perder '+RA.semaforo_s+' s em cada semáforo'+(RA.lombada_s?' e '+RA.lombada_s+' s em cada lombada':'')+' baixou o erro médio nos dias de teste de '+f(RA.erro_antes_m)+' para '+f(RA.erro_depois_m)+'.':'Ainda sem ganho comprovado com o GPS da prefeitura: a previsão não os considera.')+'</p>';
  var PF=LV_PERF,perf='<p class="small keep"><b>Perfil dos trechos</b> (dias úteis): '+(PF?Object.keys(PF.periodos).map(function(k){var R=PF.periodos[k];return ({manha:'manhã',tarde:'tarde',noite:'noite'}[k]||k.replace(/^0?(\d+)-0?(\d+)$/,'$1h–$2h'))+' '+f(R.erro_antes_m)+' → '+f(R.erro_depois_m)}).join(', ')+' nos dias de teste. Os outros horários, os fins de semana e os feriados usam a previsão de sempre.':'ainda sem ganho comprovado (gere com tools/perfil_trechos.py).')+'</p>';
  var pub=LVM.pubAt?'Modelo publicado em '+new Date(LVM.pubAt).toLocaleString('pt-BR')+' com '+(LVM.pubN||0).toLocaleString('pt-BR')+' medições.':'Nenhum modelo publicado ainda: cada aparelho usa só o que aprendeu sozinho.';
  var simTxt=sim?'Se publicar agora, o erro médio estimado passa de '+f(sim.raw)+' (só a velocidade) para '+f(sim.mod)+(sim.mod<sim.raw*0.98?'. Vale publicar.':sim.mod>sim.raw*1.02?'. Ainda não vale publicar.':': quase igual. Os dados ainda não mostram ganho; o app continua usando a velocidade informada onde não há ganho comprovado.'):'';
  return '<h3 class="gh">Previsão dos ônibus</h3>'+
    '<p class="small keep">Cada vez que chega a posição nova de um ônibus, o app compara onde previu que ele estaria com onde ele estava de fato. O ajuste de velocidade só é usado num trecho depois de '+LVF_MIN+' medições ali e se reduzir o erro em pelo menos '+Math.round((1-LVF_GANHO)*100)+'%; fora isso, vale a velocidade informada pelo ônibus.</p>'+
    (LVG.err?'<p class="small keep">Sem acesso às medições do Firestore. Publique as regras novas (firestore.rules) no console do Firebase. Mostrando só as deste aparelho.</p>':'')+
    (!FB_ON?'<p class="muted small keep">Sem Firebase aqui: mostrando só as medições deste aparelho.</p>':'')+
    '<div class="la-nums fbk-sum"><span><b>'+A.length.toLocaleString('pt-BR')+'</b>medições</span><span><b>'+Object.keys(linhas).length+'</b>linhas</span><span><b>'+f(maeRaw)+'</b>erro médio só com a velocidade</span><span><b>'+f(maeMod)+'</b>erro médio do que o app mostrou</span></div>'+
    '<p class="small keep"><b>'+simTxt+'</b></p>'+
    (saltos?'<p class="muted small keep">'+saltos+' medições ('+Math.round(saltos/A.length*100)+'%) foram descartadas: o ônibus pareceu voltar mais de 50 m, sinal de que foi encaixado no trecho errado do traçado.</p>':'')+
    '<table class="lvg-t"><thead><tr><th>Velocidade informada</th><th>Medições</th><th>Erro só com a velocidade</th><th>Erro do que o app mostrou</th></tr></thead><tbody>'+porVb+'</tbody></table>'+
    '<p class="muted small keep">Erro medido quando chega a posição nova (até 60 s de previsão). Medições feitas antes desta versão usaram o ajuste antigo.</p>'+
    hist+red+perf+'<p class="small keep">'+pub+'</p>'+
    '<div class="row gbtns">'+(FB_ON?'<button type="button" class="copy primary" id="lvgPub2"'+(A.length?'':' disabled')+'>Recalcular e publicar o modelo</button>':'')+
    '<button type="button" class="copy" id="lvgCsv"'+(A.length?'':' disabled')+'>Baixar medições (CSV)</button><button type="button" class="copy" id="lvgRe">Atualizar</button>'+
    (FB_ON&&LVG.docs?'<button type="button" class="linkbtn" id="lvgOld">Apagar medições com mais de 90 dias</button>':'')+'</div>';
}
aoFazer('gestão montada',function(){if(gTab==='previsao'&&$('#gBody')&&gcan('linhas'))$('#gBody').innerHTML=gPrevisao()});
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('#lvgCsv,#lvgRe,#lvgOld');if(!t)return;
  if(t.id==='lvgRe'){LVG.am=null;renderGest();return}
  if(t.id==='lvgCsv'){lvgCSV();return}
  if(t.id==='lvgOld'){
    var lim=Date.now()-90*864e5,ids=(LVG.ids||[]).filter(function(x){return x[1]<lim}).map(function(x){return x[0]});
    if(!ids.length){gToast('Nenhuma medição com mais de 90 dias.');return}
    fbInit().then(function(fb){return Promise.all(ids.map(function(id){return fb.db.collection('desvios').doc(id).delete()}))}).then(function(){gToast(ids.length+' lotes antigos apagados.');LVG.am=null;renderGest()},function(){gToast('Não deu para apagar.',1)});
  }
});
/* ======================= v36: previsão dos ônibus mais honesta =======================
   As medições reais (07/11) mostraram que o aprendizado da v35 piorava a previsão: média de velocidade puxada por poucos
   casos extremos, ônibus parados "andando" sozinhos e saltos para trás (o ônibus encaixado no trecho errado do traçado).
   Agora: (1) encaixe no traçado respeita o sentido em que o ônibus anda e a posição anterior; (2) parado fica parado;
   (3) o modelo escolhe o fator de velocidade que minimiza o erro em metros e só é usado onde já provou ser melhor
   que a velocidade informada (pelo menos 30 medições e 8% de ganho); (4) saltos para trás não entram no aprendizado. */
var LVF=[0.5,0.6,0.7,0.8,0.9,1,1.1,1.25],LVF1=5,LVF_MIN=100,LVF_GANHO=0.9;
LVM.loc=(function(){try{return JSON.parse(localStorage.getItem('cse-lv-m2')||'{}')||{}}catch(e){return {}}})();LVM.pub={};
try{localStorage.removeItem('cse-lv-modelo')}catch(e){}
function lvfChaves(cel,dir,vb,per){return ['c|'+cel+'|'+dir+'|'+vb,'g|'+vb+'|'+per]}
function lvfSoma(M,ks,real,raw){ks.forEach(function(k){var s=M[k]||(M[k]=[0].concat(LVF.map(function(){return 0})));s[0]++;for(var i=0;i<LVF.length;i++)s[i+1]=Math.round((s[i+1]+Math.abs(real-LVF[i]*raw))*10)/10})}
function lvfEscolhe(get,ks){/* do mais específico ao geral; só usa um fator que já se provou melhor que 1,0 */
  for(var j=0;j<ks.length;j++){var s=get(ks[j]);if(!s||s[0]<LVF_MIN)continue;
    var b=LVF1;for(var i=0;i<LVF.length;i++)if(s[i+1]<s[b+1])b=i;
    if(b!==LVF1&&s[b+1]<=s[LVF1+1]*LVF_GANHO)return LVF[b];if(j===0)return 1}
  return 1;
}
function lvmSt2(k){var a=LVM.pub[k],b=LVM.loc[k];if(!a&&!b)return null;if(!a)return b;if(!b)return a;return a.map(function(x,i){return x+b[i]})}
/* paradas da prefeitura sem parada da UFRJ ao lado ficam na posição oficial do GTFS */
Object.keys(EXTS).forEach(function(g){var G=EXTS[g];if(G.stop)return;var k=Object.keys(EXT.stops).filter(function(k){return EXT.stops[k][0]===G.name})[0];if(k){var s=EXT.stops[k];G.p=ll2map(s[1],s[2])}});
extDraw();
/* encaixe no traçado da própria linha, considerando o sentido em que o ônibus anda e onde ele estava antes */
function snapBusX(n,p,o,P,dt){
  var ids=((EXT.sh||{})[n]||[]).map(function(i){return SHP_EXT[i]}).filter(function(i){return i!=null&&SHP[i]}),best=null,M=MPU,comp=o&&o.vel>2?((angN()+o.dir)%360+360)%360:null;
  ids.forEach(function(i){var S=SHP[i];
    for(var j=1;j<S.P.length;j++){var a=S.P[j-1],b=S.P[j],dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy||1e-9,t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2)),x=a[0]+t*dx,y=a[1]+t*dy,d=Math.hypot(p[0]-x,p[1]-y);
      if(d>120*M)continue;
      var s=S.c[j-1]+t*Math.sqrt(L2),ang=Math.atan2(dx,-dy)*180/Math.PI,pen=0;
      if(comp!=null&&Math.abs(((ang-comp)%360+540)%360-180)>100)pen+=40*M;/* o traçado vai no sentido contrário ao do ônibus */
      if(P&&P.i!=null&&dt>0){if(P.i!==i)pen+=20*M;else{var ds=(s-P.s)*(P.sign||1)/M;if(ds<-40||ds>25*dt+80)pen+=60*M}}
      var c=d+pen;if(!best||c<best.c)best={c:c,d:d,x:x,y:y,i:i,s:s,ang:ang}}});
  return best||snapBus(n,p);/* sem traçado da linha por perto: ruas do campus */
}
function liveDrawCore(){
  var g=$('#gExt');if(!g)return;var G=$('#gLive');if(!G){g.insertAdjacentHTML('beforeend','<g id="gLive"></g>');G=$('#gLive')}
  var seen={},now=Date.now();
  LIVE.bus.forEach(function(o){
    var raw=ll2map(o.la,o.lo),S=LV2.st[o.v],prev=S&&S.obs,dt=prev?(o.t-prev.t)/1000:0;
    var sn=(prev&&prev.t===o.t)?(prev.i!=null?{i:prev.i,s:prev.s,x:prev.x,y:prev.y,ang:0}:null):snapBusX(o.l,raw,o,prev,dt);
    seen[o.v]=1;
    var obs={la:o.la,lo:o.lo,hd:o.vel>2?o.dir:null,t:o.t,v:Math.min(70,Math.max(0,o.vel||0))/3.6,x:sn?sn.x:raw[0],y:sn?sn.y:raw[1],ang:o.vel>2?((angN()+o.dir)%360+360)%360:null};
    if(sn){obs.i=sn.i;obs.s=sn.s;obs.sign=(prev&&prev.t===o.t)?prev.sign:lvSign(o,sn,prev)}else obs.i=null;
    if(obs.v<0.6)obs.v=0;
    var idade=Math.round((now-o.t)/1000),tit='Ônibus '+o.l+' · posição de '+idade+' s atrás'+(obs.v>0?', '+Math.round(o.vel)+' km/h':', parado');
    if(!S||!S.el||!S.el.isConnected){
      G.insertAdjacentHTML('beforeend',mk('ext',liveNearStop([obs.x,obs.y]),[obs.x,obs.y],tit,'<title>'+esc(tit)+'</title><circle class="hit" r="16"/><path class="lv-dir" d="M0 -18l5.5 6.5h-11z"/><circle class="lv-dot" r="11" style="fill:'+liveColor(o.l)+'"/><text class="lv-t" y="3.5">'+esc(o.l.replace(/^S[A-Z]*/,'').slice(0,3))+'</text>').replace('class="mk ext"','class="mk ext xlive" data-v="'+esc(o.v)+'"'));
      S=LV2.st[o.v]={el:G.lastElementChild};
    }else if(!prev||prev.t!==o.t){S.novo=true}
    var tt=S.el.querySelector('title');if(tt)tt.textContent=tit;S.el.setAttribute('aria-label',tit);
    S.obs=obs;S.age=idade;S.el.dataset.id=liveNearStop([obs.x,obs.y]);
    if(S.novo){S.novo=false;lvCorrige(S,prev)}
  });
  Object.keys(LV2.st).forEach(function(v){if(!seen[v]){if(LV2.st[v].el)LV2.st[v].el.remove();delete LV2.st[v]}});
}
function lvgModelo2(A){var M={};A.forEach(function(a){if(a.dt>75||a.real<-50||a.vb===0)return;var h=Math.min(a.dt,60);lvfSoma(M,lvfChaves(a.cel,a.d,a.vb,a.per),a.real*h/a.dt,a.v*h)});return M}
/* simulação honesta: refaz as medições em ordem, aprendendo só com o passado, e mede o erro que o modelo novo teria */
function lvgSimula(A){
  var M={},B=A.slice().sort(function(x,y){return x.t-y.t}),e0=0,e1=0,n=0;
  B.forEach(function(a){if(a.dt>75||a.real<-50)return;var h=Math.min(a.dt,60),real=a.real*h/a.dt,raw=a.v*h;
    var f=a.vb===0?0:lvfEscolhe(function(k){return M[k]},lvfChaves(a.cel,a.d,a.vb,a.per));
    e0+=Math.abs(real-raw);e1+=Math.abs(real-f*raw);n++;
    if(a.vb>0)lvfSoma(M,lvfChaves(a.cel,a.d,a.vb,a.per),real,raw)});
  return n?{n:n,raw:e0/n,mod:e1/n}:null;
}
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('#lvgPub2');if(!t)return;
  var A=LVG.am||[],b=lvgModelo2(A),n=A.filter(function(a){return a.dt<=75&&a.real>=-50&&a.vb>0}).length,o={b2:b,n:n,at:Date.now()};
  if(JSON.stringify(o).length>900000){gToast('Modelo grande demais para um documento. Apague medições antigas.',1);return}
  t.disabled=true;
  fbInit().then(function(fb){return fb.db.collection('gestao').doc('previsao').set(o)}).then(function(){LVM.pub=b;LVM.pubN=n;LVM.pubAt=o.at;LVM.loc={};try{localStorage.setItem('cse-lv-pubat2',String(o.at))}catch(x){}lvmSalva();Object.keys(LV2.st).forEach(function(v){var O=LV2.st[v].obs;if(O)O.ve=null});gToast('Modelo publicado: todos os aparelhos passam a usar.');renderGest()},function(){t.disabled=false;gToast('Não deu para publicar. Confira as regras do Firestore.',1)});
});
/* ======================= v37: ônibus da cidade param nos pontos e deslizam pela rota =======================
   Testado com 70 min de GPS real da cidade inteira (18 mil pares de posições, todas as linhas) contra os traçados e
   pontos oficiais do GTFS:
   - prever que o ônibus para ~12 s no próximo ponto do caminho reduziu o erro médio de 84 m para 77 m (mediana 63 → 57 m);
   - usar a velocidade programada do GTFS ou o traçado informado pela API (shape_id, errado em ~1 a cada 4 posições)
     não ajudou; o que resolve o "andar para trás" é procurar em todos os traçados da linha pelo sentido do movimento.
   Quando chega a posição nova, o ônibus desliza pela própria rota até ela, sem cortar quarteirão. */
var LV_PONTO_S=12,LV_PONTO_IGNORA=25,LV_HIST=null;
/* histórico de GPS da prefeitura já processado (tools/historico_gps.py): se existir, ajusta paradas e velocidades
   e a coleta pelos aparelhos deixa de ser necessária */
function lvHistKey(O){if(O.la==null)return null;var d=new Date(O.t),h=d.getHours()+d.getMinutes()/60,w=d.getDay(),per=(w===0||w===6)?'w':((h>=6&&h<9.5)||(h>=16&&h<20))?'p':'f';
  return Math.floor(O.la/0.0015)+','+Math.floor(O.lo/0.0015)+'|'+(O.hd==null?0:Math.floor((((O.hd%360)+360)%360+22.5)/45)%8)+'|'+lvmVb(O.v)+'|'+per}
if(LIVE.url&&window.fetch)fetch('historico-previsao.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).then(function(o){
  if(!o||!o.aval)return;LV_HIST=o;Object.keys(LV2.st).forEach(function(v){var O=LV2.st[v].obs;if(O)O.ve=null});
},function(){});
(function(){/* posição de cada ponto de parada ao longo do traçado */
  var shs=EXT.shs||{};
  Object.keys(SHP_EXT).forEach(function(k){var i=SHP_EXT[k],S=SHP[i],L=shs[k];if(!S||!L)return;var out=[];
    L.forEach(function(q){var p=ll2map(q[0],q[1]),best=null;
      for(var j=1;j<S.P.length;j++){var a=S.P[j-1],b=S.P[j],dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy||1e-9,t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2)),d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
        if(!best||d<best.d)best={d:d,s:S.c[j-1]+t*Math.sqrt(L2)}}
      if(best&&best.d<=25*MPU)out.push([best.s,q[0].toFixed(5)+','+q[1].toFixed(5)])});
    out.sort(function(a,b){return a[0]-b[0]});S.st=out.map(function(x){return x[0]});S.stK=out.map(function(x){return x[1]})});
})();
/* semáforos e lombadas (UFRJ e OpenStreetMap, gerados por tools/redutores.py): posição ao longo de cada traçado.
   Só mudam a previsão se o ajuste foi comprovado com o GPS da prefeitura (REDUT.ajuste); senão ficam guardados. */
var REDUT={"fonte":"UFRJ (Mobilidade e Transporte, ArcGIS Online) e OpenStreetMap (© colaboradores do OpenStreetMap, ODbL)","s":[[-22.843312,-43.233795],[-22.843016,-43.234006],[-22.83971,-43.23737],[-22.839494,-43.237478],[-22.839587,-43.238778],[-22.838373,-43.240239],[-22.839426,-43.241228],[-22.839233,-43.241093],[-22.839217,-43.241411],[-22.838955,-43.241416],[-22.838282,-43.24225],[-22.840523,-43.240023],[-22.845255,-43.238797],[-22.844767,-43.238531],[-22.850078,-43.235156],[-22.849867,-43.234899],[-22.853421,-43.23273],[-22.853245,-43.232449],[-22.860963,-43.227263],[-22.860813,-43.226967],[-22.864523,-43.228994],[-22.864526,-43.229263],[-22.880771,-43.258243],[-22.868195,-43.254908],[-22.845426,-43.268012],[-22.84729,-43.267359],[-22.854046,-43.261359],[-22.869588,-43.268194],[-22.872481,-43.268546],[-22.872217,-43.268399],[-22.874008,-43.26648],[-22.847461,-43.265724],[-22.856692,-43.252321],[-22.865156,-43.25262],[-22.86589,-43.255155],[-22.865575,-43.254079],[-22.865235,-43.252912],[-22.866997,-43.254887],[-22.866303,-43.252525],[-22.85453,-43.260284],[-22.858012,-43.256904],[-22.851294,-43.264098],[-22.84216,-43.269766],[-22.845703,-43.267918],[-22.871133,-43.258098],[-22.871793,-43.258309],[-22.878804,-43.250881],[-22.880844,-43.253526],[-22.882925,-43.254121],[-22.854742,-43.26052],[-22.844203,-43.268878],[-22.861844,-43.224425],[-22.855095,-43.252504],[-22.872477,-43.268162],[-22.866487,-43.255836],[-22.866076,-43.255974],[-22.838455,-43.241933],[-22.833278,-43.239435],[-22.833344,-43.239689],[-22.832763,-43.238653],[-22.832979,-43.238867],[-22.873209,-43.267221],[-22.873249,-43.267614],[-22.874106,-43.266165],[-22.87422,-43.266642],[-22.874344,-43.266166],[-22.872709,-43.258534],[-22.873037,-43.262581],[-22.87326,-43.252927],[-22.873785,-43.257966],[-22.874031,-43.257863],[-22.883249,-43.254092],[-22.883937,-43.253662],[-22.859646,-43.267572],[-22.876805,-43.256516],[-22.878175,-43.255453],[-22.882944,-43.254406],[-22.884165,-43.253348],[-22.884613,-43.264571],[-22.884526,-43.26402],[-22.884857,-43.264595],[-22.884981,-43.265299],[-22.867285,-43.251866],[-22.867524,-43.251932],[-22.854556,-43.254601],[-22.850955,-43.263588],[-22.846859,-43.243126],[-22.880122,-43.268246],[-22.878554,-43.26577],[-22.878171,-43.264324],[-22.878439,-43.261457],[-22.879832,-43.259763],[-22.880392,-43.258928],[-22.883921,-43.248983],[-22.86698,-43.255337],[-22.880637,-43.250825],[-22.880471,-43.250279],[-22.854599,-43.254008],[-22.849539,-43.265973],[-22.84872,-43.266844],[-22.880666,-43.258936],[-22.861736,-43.267849],[-22.854752,-43.254193],[-22.854813,-43.254775],[-22.857326,-43.25714],[-22.856866,-43.267023]],"l":[[-22.850025,-43.235143],[-22.849905,-43.234964],[-22.846297,-43.237837],[-22.847287,-43.238576],[-22.843097,-43.233957],[-22.843265,-43.233798],[-22.860896,-43.226972],[-22.8609,-43.227236],[-22.863344,-43.230032],[-22.863081,-43.230232],[-22.866626,-43.218363],[-22.864184,-43.228122],[-22.863971,-43.228213],[-22.864682,-43.219677],[-22.864457,-43.220242],[-22.851317,-43.261],[-22.85153,-43.260691],[-22.831885,-43.242717],[-22.829917,-43.247193],[-22.830227,-43.246728],[-22.877039,-43.269797],[-22.839875,-43.238168],[-22.863135,-43.238984],[-22.862769,-43.238734],[-22.853067,-43.264697],[-22.852552,-43.265146],[-22.852289,-43.26517],[-22.851882,-43.264781],[-22.851562,-43.26444],[-22.862958,-43.238872],[-22.862692,-43.239003],[-22.863482,-43.239171],[-22.859679,-43.267804],[-22.837021,-43.267161],[-22.837044,-43.266643],[-22.8368,-43.265093],[-22.836416,-43.263363],[-22.839459,-43.266145],[-22.839881,-43.265255],[-22.839045,-43.264265],[-22.843005,-43.262414],[-22.842513,-43.268512],[-22.844757,-43.266222],[-22.845621,-43.266347],[-22.85015,-43.261207],[-22.850435,-43.261171],[-22.853116,-43.260851],[-22.854423,-43.262712],[-22.853379,-43.263264],[-22.854468,-43.254332],[-22.854762,-43.252739],[-22.854614,-43.253682],[-22.854573,-43.253864],[-22.854428,-43.25455],[-22.85023,-43.254399],[-22.847689,-43.25157],[-22.847802,-43.251063],[-22.846547,-43.249558],[-22.846841,-43.248346],[-22.848305,-43.248106],[-22.845308,-43.254552],[-22.845325,-43.254232],[-22.845477,-43.255021],[-22.851239,-43.264013],[-22.884738,-43.219124],[-22.884274,-43.219833],[-22.883985,-43.220549],[-22.882339,-43.223826],[-22.831653,-43.242893],[-22.841937,-43.238868],[-22.843822,-43.238211],[-22.847123,-43.238017],[-22.857797,-43.230733],[-22.858263,-43.231051],[-22.856044,-43.246127],[-22.855943,-43.245239],[-22.855842,-43.24428],[-22.855745,-43.243288],[-22.855467,-43.242235],[-22.855186,-43.242311],[-22.855435,-43.243473],[-22.859601,-43.241187],[-22.861177,-43.238999],[-22.860955,-43.239375],[-22.861078,-43.239299],[-22.861525,-43.238728],[-22.864097,-43.243352],[-22.863781,-43.243186],[-22.864706,-43.243647],[-22.864864,-43.244068],[-22.864747,-43.240631],[-22.864374,-43.240052],[-22.864704,-43.238776],[-22.865211,-43.238983],[-22.866082,-43.239361],[-22.866622,-43.239605],[-22.866195,-43.238527],[-22.866554,-43.238548],[-22.867596,-43.239063],[-22.866981,-43.237346],[-22.867394,-43.236725],[-22.867507,-43.236274],[-22.867577,-43.235366],[-22.86858,-43.236844],[-22.868627,-43.237353],[-22.868806,-43.237702],[-22.868278,-43.239682],[-22.868834,-43.239769],[-22.868662,-43.24098],[-22.869836,-43.240758],[-22.870183,-43.240353],[-22.870938,-43.239469],[-22.869805,-43.237771],[-22.870761,-43.237944],[-22.869022,-43.242103],[-22.869256,-43.241674],[-22.869386,-43.241563],[-22.86977,-43.24122],[-22.870539,-43.240382],[-22.871513,-43.239321],[-22.871614,-43.239136],[-22.871909,-43.239563],[-22.872312,-43.240154],[-22.87308,-43.241284],[-22.873559,-43.24166],[-22.872407,-43.242584],[-22.874586,-43.240859],[-22.875227,-43.240342],[-22.875663,-43.240116],[-22.875689,-43.239652],[-22.876019,-43.240234],[-22.875094,-43.239138],[-22.874772,-43.238577],[-22.876344,-43.24082],[-22.876373,-43.2412],[-22.876009,-43.239136],[-22.876531,-43.238781],[-22.877166,-43.238332],[-22.877258,-43.237938],[-22.876554,-43.237425],[-22.877821,-43.238357],[-22.877668,-43.238243],[-22.878514,-43.238857],[-22.879121,-43.239278],[-22.875543,-43.242272],[-22.875068,-43.242629],[-22.874592,-43.243027],[-22.871256,-43.242569],[-22.87107,-43.241543],[-22.870646,-43.240929],[-22.870182,-43.242196],[-22.870527,-43.243138],[-22.869709,-43.243073],[-22.869366,-43.242428],[-22.868766,-43.257852],[-22.868723,-43.2569],[-22.869466,-43.257985],[-22.869439,-43.257533],[-22.869412,-43.257085],[-22.869383,-43.256609],[-22.869313,-43.255422],[-22.869839,-43.255933],[-22.870431,-43.255898],[-22.870069,-43.256317],[-22.870162,-43.257916],[-22.869496,-43.265448],[-22.869805,-43.265685],[-22.875128,-43.259674],[-22.875872,-43.259369],[-22.876569,-43.259799],[-22.877001,-43.259104],[-22.877288,-43.2598],[-22.876811,-43.260916],[-22.87815,-43.266995],[-22.877116,-43.267611],[-22.876306,-43.268095],[-22.875557,-43.268804],[-22.875422,-43.268206],[-22.875617,-43.269457],[-22.877528,-43.269517],[-22.869865,-43.264918],[-22.841513,-43.264223],[-22.8464,-43.26421],[-22.839319,-43.260205],[-22.868903,-43.255978],[-22.863701,-43.23814],[-22.869031,-43.248648],[-22.851394,-43.260849],[-22.841365,-43.238464],[-22.880907,-43.259815],[-22.877896,-43.244562],[-22.876019,-43.259309],[-22.851888,-43.260705],[-22.851261,-43.261233],[-22.840948,-43.237601],[-22.866155,-43.21703],[-22.866985,-43.216466],[-22.866446,-43.215844],[-22.865505,-43.217481],[-22.865013,-43.217526],[-22.864862,-43.217924],[-22.864317,-43.218826],[-22.863926,-43.219083],[-22.864698,-43.215046],[-22.855426,-43.250086],[-22.855297,-43.249236]],"ajuste":null},LV_EV_IGNORA=10;
(function(){
  var A=REDUT.ajuste;if(!A)return;
  var evs=[];(REDUT.s||[]).forEach(function(q){evs.push([q,A.semaforo_s,20])});(REDUT.l||[]).forEach(function(q){evs.push([q,A.lombada_s,15])});
  Object.keys(SHP_EXT).forEach(function(k){var S=SHP[SHP_EXT[k]];if(!S)return;var out=[];
    evs.forEach(function(e){if(!(e[1]>0))return;var p=ll2map(e[0][0],e[0][1]),best=null;
      for(var j=1;j<S.P.length;j++){var a=S.P[j-1],b=S.P[j],dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy||1e-9,t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L2)),d=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
        if(!best||d<best.d)best={d:d,s:S.c[j-1]+t*Math.sqrt(L2)}}
      if(best&&best.d<=e[2]*MPU)out.push([best.s,e[1]])});
    out.sort(function(a,b){return a[0]-b[0]});S.ev=out});
})();
/* perfil dos trechos (tools/perfil_trechos.py, arquivo perfil-onibus.json): em dia útil, a velocidade com que os ônibus
   costumam seguir de cada trecho de 60 m, por período (manhã, tarde, noite). Só existem os períodos com ganho comprovado
   nos testes; fins de semana e feriados usam a previsão de sempre. */
var LV_PERF=null;
if(LIVE.url&&window.fetch)fetch('perfil-onibus.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).then(function(o){if(o&&o.p&&o.periodos)LV_PERF=o},function(){});
function lvDiaUtil(t){var d=new Date(t),w=d.getDay(),k=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
  return w>0&&w<6&&!FERIADOS.some(function(f){return f[0]===k})}
/* faixa de horário do perfil: as do arquivo (ex.: [[7,9,"07-09"],…]); sem elas, manhã, tarde e noite */
function lvPeriodo(t){var h=new Date(t).getHours(),F=LV_PERF&&LV_PERF.faixas;
  if(F){for(var i=0;i<F.length;i++){var a=F[i][0],b=F[i][1];if(a<b?(h>=a&&h<b):(h>=a||h<b))return F[i][2]}return null}
  return h>=5&&h<12?'manha':h>=12&&h<18?'tarde':'noite'}
function lvPerfil(O){
  var P=LV_PERF;if(!P||O.i==null||!lvDiaUtil(O.t))return null;
  var per=lvPeriodo(O.t),R=per&&P.periodos[per],tr=lvmTracado(O.i);if(!R||tr==null)return null;
  var L=P.p[tr+'|'+(O.sign>0?1:-1)+'|'+per];if(!L)return null;
  var v=L[1][Math.floor(O.s/MPU/(P.trecho_m||60))-L[0]];
  return v!=null&&v>=0?{v:v/10,w:R.w}:null;
}
/* metros andados em dt segundos: na velocidade (corrigida pelo aprendizado), parando ~12 s no próximo ponto do caminho
   e, com o ajuste comprovado, perdendo alguns segundos em cada semáforo e lombada pelo caminho; onde há perfil do
   trecho, mistura com o que os outros ônibus costumam fazer dali */
function lvDist(O,dt){
  var d0=lvDist0(O,dt),pf=d0>0?lvPerfil(O):null;
  return pf?pf.w*d0+(1-pf.w)*pf.v*dt:d0;
}
function lvDist0(O,dt){
  var v=lvV(O);if(!(v>0)||!(dt>0))return 0;var d=v*dt,S=SHP[O.i],st=S&&S.st;if(!st||!st.length)return d;
  var sk=LV_PONTO_IGNORA*MPU,n=null,j;
  if(O.sign>0){for(j=0;j<st.length;j++)if(st[j]>O.s+sk){n=(st[j]-O.s)/MPU;break}}
  else{for(j=st.length-1;j>=0;j--)if(st[j]<O.s-sk){n=(O.s-st[j])/MPU;break}}
  var H=LV_HIST,dw=LV_PONTO_S;if(H&&n!=null){if(H.D!=null)dw=H.D;var pk=S.stK&&S.stK[j];if(H.pd&&pk&&H.pd[pk]!=null)dw=H.pd[pk]}
  if(!S.ev||!S.ev.length){if(n==null||n>d)return d;return n+Math.max(0,dt-n/v-dw)*v}
  /* com semáforos e lombadas: percorre os eventos pela ordem, gastando o tempo (mesma conta de tools/redutores.py) */
  var ev=[];if(n!=null)ev.push([n,dw]);
  var ei=LV_EV_IGNORA*MPU;S.ev.forEach(function(e){var x=(e[0]-O.s)*O.sign;if(x>ei)ev.push([x/MPU,e[1]])});
  ev.sort(function(a,b){return a[0]-b[0]});
  var andou=0,tempo=dt;
  for(var k=0;k<ev.length;k++){var falta=ev[k][0]-andou;if(falta>v*tempo)break;tempo-=falta/v;andou=ev[k][0];if(ev[k][1]>=tempo)return andou;tempo-=ev[k][1]}
  return andou+v*tempo;
}
/* ======================= v38: ônibus mais frescos e sem o mapa da cidade por baixo =======================
   Cada segundo de atraso da posição soma ~2,5 a 3 m de erro na previsão. O Worker passou a guardar a resposta por 5 s
   (antes 15 s) e o app pergunta a cada 10 s (antes 15 s): a posição chega, em média, uns 10 s mais nova.
   O mapa de ruas da cidade (Esri/OpenStreetMap) por baixo da planta foi retirado a pedido. */
if(LIVE.timer)liveLoop();
/* ======================= Tiroteios perto das saídas do Fundão (Fogo Cruzado) =======================
   Opcional e desligado por padrão (Ajustes › Segurança no caminho). Os dados vêm do Instituto Fogo Cruzado
   (conteúdo de uso livre), pelo Worker do projeto, que consulta a API com a conta do projeto a cada 5 min.
   O app só mostra registros das últimas horas perto das saídas da ilha, sempre com fonte e horário.
   Não é alerta oficial: quando não há dados, diz que não há dados, nunca que "está tudo calmo". */
var TIRO={url:LIVE.url?LIVE.url+'/tiroteios':'',d:null,t:0,err:false,timer:null};
function tiroOn(){return CFG.tiroteios===true&&!!TIRO.url}
function tiroBusca(){
  if(!tiroOn()||document.hidden)return;
  fetch(TIRO.url,{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){TIRO.d=d;TIRO.t=Date.now();TIRO.err=false;tiroRepaint()},
    function(){TIRO.err=true;tiroRepaint()});
}
function tiroLoop(){clearInterval(TIRO.timer);TIRO.timer=null;if(!tiroOn())return;tiroBusca();TIRO.timer=setInterval(tiroBusca,300000)}
document.addEventListener('visibilitychange',function(){if(!document.hidden&&tiroOn()&&Date.now()-TIRO.t>240000)tiroBusca()});
function tiroHa(t){var m=Math.max(0,Math.round((Date.now()-t)/60000));return m<1?'agora há pouco':m<60?'há '+m+' min':'há '+Math.floor(m/60)+' h'+(m%60?' '+(m%60)+' min':'')}
function tiroResumo(){
  var d=TIRO.d;
  if(!d)return TIRO.err?'Sem dados do Fogo Cruzado agora':'Buscando registros…';
  if(!d.disponivel)return 'Sem dados do Fogo Cruzado agora';
  var n=(d.ocorrencias||[]).length;
  return n?n+' registro'+(n>1?'s':'')+' nas últimas '+(d.janelaH||6)+' h · último '+tiroHa(d.ocorrencias[0].t):'Nenhum registro nas últimas '+(d.janelaH||6)+' h';
}
function tiroBodyHTML(){
  var d=TIRO.d,at=d&&d.atualizado?Date.parse(d.atualizado):NaN;
  /* a base do Fogo Cruzado é atualizada de tempos em tempos (não em tempo real): mostra quando foi a última vez */
  var base=at>0?' Base atualizada '+(new Date(at).toDateString()===new Date().toDateString()?'hoje às ':'em '+new Date(at).toLocaleDateString('pt-BR')+' às ')+new Date(at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'.':'';
  var fonte='<p class="muted small keep tiro-src">Fonte: Instituto Fogo Cruzado, que reúne e confere relatos de tiroteios.'+base+' Os registros podem demorar a aparecer e não são alerta oficial. Em emergência, ligue 190.</p>';
  if(!d||!d.disponivel)return '<p class="small keep">'+(d&&d.motivo==='sem-conta'?'O serviço ainda não foi ativado pela equipe do app.':'Não deu para consultar o Fogo Cruzado agora. Isso não quer dizer que esteja tudo calmo.')+'</p>'+fonte;
  var L=d.ocorrencias||[];
  if(!L.length)return '<p class="small keep">Nenhum tiroteio registrado pelo Fogo Cruzado perto das saídas do Fundão nas últimas '+(d.janelaH||6)+' horas.</p>'+fonte;
  return '<ul class="tiro-list">'+L.slice(0,6).map(function(o){
    return '<li><span class="tiro-ha">'+tiroHa(o.t)+'</span><span class="grow"><b>'+esc(o.bairro||'Local não informado')+'</b><small>'+esc(o.local||'')+'</small>'+
      '<small>'+(o.policia?'Com ação policial':'Sem ação policial informada')+(o.vitimas?' · '+o.vitimas+' vítima'+(o.vitimas>1?'s':''):'')+'</small></span></li>'}).join('')+'</ul>'+
    (L.length>6?'<p class="muted small keep">E mais '+(L.length-6)+' registro'+(L.length-6>1?'s':'')+'.</p>':'')+fonte;
}
function tiroFoldHTML(){
  var open=(function(){try{return localStorage.getItem('cse-fold-tiro')==='1'}catch(e){return false}})();
  return '<div id="tirobox">'+foldHTML('fdTiro',open,'Tiroteios perto das saídas','<small>'+esc(tiroResumo())+'</small>',open?tiroBodyHTML():'')+'</div>';
}
function tiroRepaint(){
  var b=$('#tirobox');if(!tiroOn()){if(b)b.remove();return}
  var t=document.createElement('div');t.innerHTML=tiroFoldHTML();
  if(b)b.replaceWith(t.firstChild);else if(plan){var x=$('#extbox');if(x)x.insertAdjacentElement('beforebegin',t.firstChild);else plan.appendChild(t.firstChild)}
}
aoFazer('trajeto montado',function(){if(tiroOn()&&!$('#tirobox'))tiroRepaint()});
document.addEventListener('toggle',function(e){if(e.target.id!=='fdTiro')return;try{localStorage.setItem('cse-fold-tiro',e.target.open?'1':'0')}catch(x){}
  var b=e.target.querySelector('.fold-b');if(b&&e.target.open&&!b.firstChild)b.innerHTML=tiroBodyHTML()},true);
/* Ajustes › Segurança no caminho */
function tiroCfgHTML(){
  return '<div class="accsec" id="tirosec"><h2>Segurança no caminho</h2><div class="tgls">'+
    tg('cfgTiro',CFG.tiroteios===true,'Tiroteios perto das saídas do Fundão','Mostra em Trajetos os registros do Instituto Fogo Cruzado das últimas 6 horas na Linha Vermelha, Av. Brasil, Maré, Bonsucesso, Penha e ponte para a Ilha do Governador.')+'</div>'+
    (TIRO.url?'':'<p class="muted small keep">Disponível no site do app.</p>')+
    '<p class="muted small keep">Os registros dependem de verificação e podem atrasar. Não é alerta oficial. A Defesa Civil manda alertas por SMS: envie seu CEP para 40199.</p></div>';
}
aoFazer('ajustes montados',function(){var a=$('#alsec')||$('#accsec');if(a&&!$('#tirosec'))a.insertAdjacentHTML('afterend',tiroCfgHTML())});
document.addEventListener('change',function(e){if(e.target.id!=='cfgTiro')return;
  CFG.tiroteios=e.target.checked;saveCfg();tiroLoop();tiroRepaint();if(CFG.tiroteios&&!TIRO.url)gToast('Disponível no site do app.',1)});
tiroLoop();
/* ======================= Atalho para o BandejApp (app oficial do RU) =======================
   O BandejApp (DevMob UFRJ / extensão Promove) mostra o cardápio dos RUs. Aqui só há um link para ele:
   nada de usar o serviço de dados deles sem combinar. */
var BANDEJAPP_URL='https://devmobufrj.github.io/BandejApp/';
function bandejaLinkHTML(){return '<a class="copy bdj-link" href="'+BANDEJAPP_URL+'" target="_blank" rel="noopener">'+
  '<svg class="lk-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 21V3c-2 1.5-3 4-3 7v3h3"/></svg>Ver o cardápio no BandejApp</a>'}
/* ======================= Gestão › Saúde e estatísticas =======================
   Confere, a pedido, se cada serviço de que o app depende está respondendo (e em quanto tempo),
   e mostra números de uso. Só lê: não apaga nem altera nada. */
GTABS.push(['saude','Saúde e estatísticas']);
var SAUDE={res:{},quando:0,busy:false,est:null,estBusy:false};
var SAUDE_TEMPO=8000,SAUDE_LENTO=3000;
function sdTempo(p){return Promise.race([p,new Promise(function(_,rej){setTimeout(function(){rej(new Error('sem resposta em 8 s'))},SAUDE_TEMPO)})])}
function sdJson(url){return fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}
function sdIdade(ms){var s=Math.round(ms/1000);return s<90?s+' s':s<5400?Math.round(s/60)+' min':Math.round(s/3600)+' h'}
/* cada verificação devolve {estado:'ok'|'aviso'|'falha', det:'texto'} (ou lança erro = falha) */
var SAUDE_CHECKS=[
  ['site','Site (GitHub Pages)','version.json e a versão deste aparelho',function(){
    if(!ON_SITE)return Promise.resolve({estado:'aviso',det:'Fora do site publicado (aqui não há version.json).'});
    return sdJson('version.json').then(function(v){return v.v===APP_VERSION?{estado:'ok',det:'Versão '+v.v+', a mesma deste aparelho.'}:{estado:'aviso',det:'Publicada: '+v.v+'. Este aparelho: '+APP_VERSION+'. Recarregue para atualizar.'}})}],
  ['worker','Ônibus ao vivo (Worker da Cloudflare)','posições dos ônibus da cidade',function(){
    if(!LIVE.url)return Promise.resolve({estado:'aviso',det:'Endereço do Worker não configurado (config.js).'});
    /* junto, o /saude do Worker: registro das tentativas com a prefeitura e falhas do dia (seção abaixo) */
    SAUDE.sdP=sdJson(LIVE.url+'/saude').then(function(d){SAUDE.sd=d;return d},function(){SAUDE.sd=null;return null});
    return fetch(LIVE.url,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('O Worker respondeu HTTP '+r.status+(r.status>=500?' (erro na Cloudflare)':'')+'.');var ant=r.headers.get('x-cache')==='antiga';return r.json().then(function(d){d.antiga=ant;return d})},
      function(){throw new Error('O Worker não respondeu. Quase sempre é o limite de processamento da Cloudflare (o Worker cai antes de responder); veja as causas em "Falhas de hoje", abaixo.')})
      .then(function(d){var n=(d.onibus||[]).length;SAUDE.gps=d;
        if(d.falhou)return {estado:'falha',det:'O Worker está no ar, mas a prefeitura não respondeu e não havia cópia guardada.'};
        if(d.antiga)return {estado:'aviso',det:'A prefeitura não respondeu agora; o Worker entregou a cópia guardada ('+n+' ônibus, de até 3 min atrás).'};
        return {estado:'ok',det:n+' ônibus na região do Fundão agora.'}})}],
  ['prefeitura','GPS da prefeitura (dados.mobilidade.rio)','pelo Worker: idade da posição mais nova',function(){
    if(!LIVE.url)return Promise.resolve({estado:'aviso',det:'Depende do Worker.'});
    var w=SAUDE.res.worker;
    /* com o Worker caído, não dá para saber da prefeitura: diz isso, com o que o registro do Worker já mostrou */
    if(!SAUDE.gps&&w&&w.estado==='falha')return Promise.resolve(SAUDE.sdP).then(function(){var R=sdRegistro(),ult=R.falhas[0];
      return {estado:'aviso',det:'Não dá para conferir agora: o Worker não respondeu.'+(R.n?' Nas últimas '+R.n+' tentativas do Worker, '+(R.n-R.ok)+(R.n-R.ok===1?' falhou':' falharam')+(ult?' (a última às '+sdHora(ult.t)+': '+sdMotivo(ult)+')':'')+'.':'')}});
    var d=SAUDE.gps;var p=d?Promise.resolve(d):sdJson(LIVE.url);
    return Promise.all([p,SAUDE.sdP||null]).then(function(a){var d=a[0],R=sdRegistro(),ult=R.falhas[0],extra=R.n?' Nas últimas '+R.n+' tentativas do Worker, '+(R.n-R.ok)+(R.n-R.ok===1?' falhou':' falharam')+(ult?' (a última às '+sdHora(ult.t)+': '+sdMotivo(ult)+')':'')+'.':'';
      var L=d.onibus||[];if(!L.length){var h=new Date().getHours();return {estado:h>=5&&h<23?'aviso':'ok',det:'Nenhum ônibus na região'+(h>=5&&h<23?' em horário de serviço: a prefeitura pode estar sem dados.':' (madrugada).')+extra}}
      var novo=Math.max.apply(null,L.map(function(o){return o.t||0})),idade=(d.t||Date.now())-novo;
      var est=idade<120000?'ok':idade<600000?'aviso':'falha';if(est==='ok'&&R.n>=10&&(R.n-R.ok)/R.n>0.2)est='aviso';
      return {estado:est,det:'Posição mais nova de '+sdIdade(idade)+' atrás.'+extra}})}],
  ['tiroteios','Tiroteios (Fogo Cruzado)','pelo Worker, com a conta do projeto',function(){
    if(!LIVE.url)return Promise.resolve({estado:'aviso',det:'Depende do Worker.'});
    return sdJson(LIVE.url+'/tiroteios').then(function(d){
      if(!d.disponivel)return {estado:d.motivo==='sem-conta'?'aviso':'falha',det:d.motivo==='sem-conta'?'Conta do projeto não configurada no Worker.':'O Worker não conseguiu consultar a API.'};
      var at=Date.parse(d.atualizado||''),idade=at>0?Date.now()-at:null;
      return {estado:idade!=null&&idade>24*3600e3?'aviso':'ok',det:(d.ocorrencias||[]).length+' registro(s) nas últimas '+(d.janelaH||6)+' h'+(idade!=null?' · base atualizada há '+sdIdade(idade):'')+'.'}})}],
  ['cota','Cota do Worker (Cloudflare)','pedidos de hoje no plano grátis',function(){
    if(!LIVE.url)return Promise.resolve({estado:'aviso',det:'Depende do Worker.'});
    return (SAUDE.sdP||sdJson(LIVE.url+'/saude')).then(function(d){if(!d)throw new Error('O Worker não respondeu em /saude.');
      if(!d.cloudflareConfigurado)return {estado:'info',det:'Para ver o uso, configure CF_CONTA e CF_TOKEN no Worker (worker/README.md).'};
      if(!d.cloudflare)return {estado:'aviso',det:'Não deu para ler o uso: '+(d.cloudflareErro||'erro')+'.'};
      var c=d.cloudflare,pct=c.pedidos/c.limite*100,zera=new Date(Date.parse(c.desde)+864e5);
      return {estado:pct<70?'ok':pct<90?'aviso':'falha',det:c.pedidos.toLocaleString('pt-BR')+' de '+c.limite.toLocaleString('pt-BR')+' pedidos hoje ('+pct.toFixed(pct<10?1:0).replace('.',',')+'%)'+(c.erros?', '+c.erros+' com erro':'')+'. Zera às '+zera.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'.'}})}],
  ['firebase','Banco de dados e login (Firebase)','leitura de um documento pequeno',function(){
    if(!FB_ON)return Promise.resolve({estado:'aviso',det:'Firebase não configurado aqui.'});
    return fbInit().then(function(fb){return fb.db.doc('meta/vagas').get()}).then(function(d){return {estado:'ok',det:'Respondendo'+(SH.uid?', com a sua conta conectada':'')+'.'}})}],
  ['fbuso','Cota do Firebase','leituras e gravações do dia',function(){
    return Promise.resolve({estado:'info',det:'O Firebase não informa o uso ao app. Veja no console: Firestore › Uso (plano grátis: 50 mil leituras e 20 mil gravações por dia).',link:'https://console.firebase.google.com/project/'+((window.CSE_FIREBASE||{}).projectId||'_')+'/firestore/usage'})}],
  ['clima','Previsão do tempo (Open-Meteo)','temperatura agora na Ilha do Fundão',function(){
    return sdJson('https://api.open-meteo.com/v1/forecast?latitude=-22.86&longitude=-43.23&current=temperature_2m&timezone=America%2FSao_Paulo').then(function(d){var t=d.current&&d.current.temperature_2m;return {estado:'ok',det:t!=null?String(t).replace('.',',')+' °C agora.':'Respondendo.'}})}],
  ['rede','Diagnóstico de rede (ipify)','descobre se o aparelho está na rede da UFRJ',function(){
    return sdJson('https://api.ipify.org?format=json').then(function(j){return {estado:'ok',det:'Respondendo.'}})}],
  ['gtfs','Horários da prefeitura (GTFS)','dados embutidos no app',function(){
    var a=String(EXT.ate||''),fim=a.length===8?Date.parse(a.slice(0,4)+'-'+a.slice(4,6)+'-'+a.slice(6,8)+'T23:59:59-03:00'):NaN;
    if(!(fim>0))return Promise.resolve({estado:'aviso',det:'Validade não informada.'});
    var dias=Math.floor((fim-Date.now())/864e5),dt=new Date(fim).toLocaleDateString('pt-BR');
    return Promise.resolve({estado:dias<0?'falha':dias<45?'aviso':'ok',det:dias<0?'Venceu em '+dt+': gere de novo com tools/gtfs_fundao.py.':'Válido até '+dt+(dias<45?' (faltam '+dias+' dias: baixe o GTFS novo).':'.')})}],
  ['ct','Planta do CT (ct-plantas.json)','arquivo do site',function(){
    return fetch('ct-plantas.json',{method:'HEAD',cache:'no-store'}).then(function(r){return r.ok?{estado:'ok',det:'Disponível.'}:{estado:'falha',det:'HTTP '+r.status+'.'}})}]
];
function saudeVerifica(){
  if(SAUDE.busy)return;SAUDE.busy=true;SAUDE.gps=null;SAUDE.res={};SAUDE.sd=null;SAUDE.sdP=null;
  /* o Worker antes da prefeitura, que reaproveita a resposta */
  var ordem=SAUDE_CHECKS.slice();
  (function proxima(i){
    if(i>=ordem.length){SAUDE.busy=false;SAUDE.quando=Date.now();if(gTab==='saude')renderGest();return}
    var c=ordem[i],t0=performance.now();
    sdTempo(Promise.resolve().then(c[3])).then(function(r){r.ms=Math.round(performance.now()-t0);if(r.estado==='ok'&&r.ms>SAUDE_LENTO){r.estado='aviso';r.det+=' Lento.'}return r},
      function(e){var m=String(e&&e.message||e);if(/Load failed|Failed to fetch|NetworkError|network/i.test(m))m='Sem resposta. Pode ser queda ou limite de processamento da Cloudflare: veja os registros do Worker no painel (Observability).';return {estado:'falha',det:m,ms:Math.round(performance.now()-t0)}})
      .then(function(r){SAUDE.res[c[0]]=r;if(gTab==='saude')renderGest();proxima(i+1)});
  })(0);
}
/* números de uso: lidos do que a gestão já carrega e de duas consultas pequenas */
function saudeEstatisticas(){
  if(SAUDE.estBusy)return;SAUDE.estBusy=true;var E=SAUDE.est={};
  var fim=function(){SAUDE.estBusy=false;if(gTab==='saude')renderGest()};
  if(!FB_ON||!SH.on){fim();return}
  var ps=[];
  ps.push(fbInit().then(function(fb){return fb.db.collection('feedback').limit(500).get()}).then(function(s){var L=s.docs.map(function(d){return d.data()||{}}),n=L.filter(function(o){return o.nota});
    E.fbk={n:L.length,sem:L.filter(function(o){return (o.ts||0)>Date.now()-7*864e5}).length,med:n.length?n.reduce(function(a,o){return a+o.nota},0)/n.length:null}},function(){E.fbk=null}));
  if(gcan('usuarios'))ps.push(SH.db.collection('erros').get().then(function(s){var L=s.docs.map(function(d){return d.data()||{}}),agora=Date.now();
    E.err={n:L.length,dia:L.filter(function(o){return (o.ts||0)>agora-864e5}).length,sem:L.filter(function(o){return (o.ts||0)>agora-7*864e5}).length}},function(){E.err=null}));
  Promise.all(ps).then(fim,fim);
}
/* ---------- falhas dos ônibus ao vivo: registro do Worker (tentativas com a prefeitura) e análise da Cloudflare ---------- */
var SD_STATUS={success:'deram certo',exceededResources:'passaram do limite de processamento da Cloudflare (10 ms de CPU por pedido no plano grátis): o Worker cai antes de responder',
  exceededCpu:'passaram do limite de processamento da Cloudflare',exceededMemory:'passaram do limite de memória da Cloudflare',scriptThrewException:'deram erro no código do Worker',
  internalError:'deram erro interno da Cloudflare',clientDisconnected:'o aparelho desistiu antes da resposta (rede ruim ou app fechado); não é falha do Worker',
  responseStreamDisconnected:'tiveram a resposta cortada no meio',canceled:'foram cancelados',unknown:'falharam sem motivo informado'};
var SD_NAO_FALHA={success:1,clientDisconnected:1};
function sdHora(t){return new Date(t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function sdMotivo(e){var F=(e.fontes||[]).filter(function(f){return !f.ok});if(!F.length)return e.r==='ok'?'deu certo':'sem detalhe';
  return F.map(function(f){return (f.f==='sppo'?'ônibus':f.f==='brt'?'BRT':f.f)+': '+(f.motivo||'falhou')}).join('; ')}
function sdRegistro(){var L=((SAUDE.sd||{}).registro||[]).slice().reverse();
  return {n:L.length,ok:L.filter(function(e){return e.r==='ok'}).length,falhas:L.filter(function(e){return e.r!=='ok'}),todas:L}}
function sdVivoHTML(){
  if(!LIVE.url)return '';
  var d=SAUDE.sd,h='<h3 class="gh sd-sec">Ônibus ao vivo: falhas de hoje</h3>';
  if(!d)return h+'<p class="muted small keep">'+(SAUDE.busy?'Consultando o Worker…':'O Worker não respondeu em /saude: sem detalhes agora.')+'</p>';
  /* 1) pedidos dos aparelhos ao Worker (análise da Cloudflare) */
  var c=d.cloudflare,det=d.cloudflareDetalhe;
  if(!d.cloudflareConfigurado)h+='<p class="muted small keep">Para ver quantos pedidos falharam e por quê, configure CF_CONTA e CF_TOKEN no Worker (worker/README.md).</p>';
  else if(det&&det.porStatus){
    var tot=0,fal=0;Object.keys(det.porStatus).forEach(function(k){var n=det.porStatus[k];tot+=n;if(!SD_NAO_FALHA[k])fal+=n});
    var pct=tot?fal/tot*100:0;
    h+='<p class="sd-res"><b>'+fal.toLocaleString('pt-BR')+' de '+tot.toLocaleString('pt-BR')+' pedidos ao Worker falharam hoje ('+pct.toFixed(pct<10?1:0).replace('.',',')+'%).</b></p>';
    var ks=Object.keys(det.porStatus).filter(function(k){return k!=='success'}).sort(function(a,b){return det.porStatus[b]-det.porStatus[a]});
    if(ks.length)h+='<ul class="sd-causas">'+ks.map(function(k){return '<li><b>'+det.porStatus[k].toLocaleString('pt-BR')+'</b> '+esc(SD_STATUS[k]||('terminaram como "'+k+'"'))+'.</li>'}).join('')+'</ul>';
    if(det.cpuP99Ms!=null)h+='<p class="muted small keep">Processamento por pedido: mediana de '+String(det.cpuMedianoMs).replace('.',',')+' ms; nos 1% mais pesados, '+String(det.cpuP99Ms).replace('.',',')+' ms (o limite é 10 ms).'+(det.cpuP99Ms>10?' Os mais pesados são as buscas na prefeitura.':'')+'</p>';
    var H=(det.porHora||[]).filter(function(x){return x.pedidos});
    if(H.length){var mx=Math.max.apply(null,H.map(function(x){return x.pedidos}));
      h+='<div class="sd-horas" role="list" aria-label="Pedidos e falhas por hora">'+H.map(function(x){var hr=new Date(x.h).getHours(),w=x.pedidos/mx*100,wf=x.falhas/mx*100;
        return '<div class="sd-hora" role="listitem"><span class="sd-h">'+hr+'h</span><span class="sd-barra"><i style="width:'+w.toFixed(1)+'%"></i><i class="f" style="width:'+wf.toFixed(1)+'%"></i></span><span class="sd-hn">'+x.falhas+' de '+x.pedidos+'</span></div>'}).join('')+'</div>'+
        '<p class="muted small keep">Barra clara: pedidos. Barra vermelha: os que falharam.</p>';}
  }else if(det&&det.erro)h+='<p class="muted small keep">A Cloudflare não deu o detalhe por motivo: '+esc(det.erro)+'.</p>';
  else if(c&&c.erros)h+='<p class="sd-res"><b>'+c.erros+' de '+c.pedidos+' pedidos ao Worker falharam hoje.</b></p><p class="muted small keep">Publique o Worker de novo para ver o motivo de cada falha.</p>';
  /* 2) tentativas do Worker com a prefeitura */
  var R=sdRegistro();
  if(!d.registro)h+='<p class="muted small keep">Publique o Worker de novo (worker/gps-fundao.js) para ver as tentativas com a prefeitura.</p>';
  else if(!R.n)h+='<p class="muted small keep">Ainda não há tentativas registradas neste data center da Cloudflare.</p>';
  else{
    var ms=R.todas.map(function(e){var f=(e.fontes||[]).filter(function(f){return f.f==='sppo'})[0];return f&&f.ok?f.ms:null}).filter(function(x){return x!=null}).sort(function(a,b){return a-b}),med=ms.length?ms[Math.floor(ms.length/2)]:null;
    var cont={reserva:0,falhou:0,parcial:0};R.falhas.forEach(function(e){cont[e.r]=(cont[e.r]||0)+1});
    h+='<p class="sd-res"><b>Prefeitura: '+(R.n-R.ok)+' de '+R.n+' tentativas '+(R.n-R.ok===1?'falhou':'falharam')+'</b> (desde '+sdHora(R.todas[R.todas.length-1].t)+(d.dataCenter?', data center '+esc(d.dataCenter):'')+').</p>'+
      '<p class="muted small keep">'+(cont.reserva?cont.reserva+' vez(es) o app recebeu a cópia guardada; ':'')+(cont.falhou?cont.falhou+' vez(es) não havia cópia e o app ficou sem dados; ':'')+(cont.parcial?cont.parcial+' vez(es) só uma das fontes respondeu; ':'')+
      (med!=null?'a prefeitura costuma responder em '+(med/1000).toFixed(1).replace('.',',')+' s.':'')+'</p>';
    if(R.falhas.length)h+='<ul class="sd-causas">'+R.falhas.slice(0,8).map(function(e){return '<li><b>'+sdHora(e.t)+'</b> '+esc(sdMotivo(e))+(e.r==='reserva'?' (usou a cópia guardada)':e.r==='falhou'?' (sem dados)':'')+'.</li>'}).join('')+'</ul>';
  }
  return h;
}
function sdPill(e){if(e==='info')return '<span class="pill">Ver</span>';return '<span class="pill '+(e==='ok'?'good':e==='aviso'?'warn':'bad')+'">'+(e==='ok'?'Funcionando':e==='aviso'?'Atenção':'Fora do ar')+'</span>'}
function gSaude(){
  if(!SAUDE.quando&&!SAUDE.busy)setTimeout(saudeVerifica,0);
  if(!SAUDE.est&&!SAUDE.estBusy)setTimeout(saudeEstatisticas,0);
  var lista=SAUDE_CHECKS.map(function(c){var r=SAUDE.res[c[0]];
    return '<div class="grow2"><span class="grow"><b>'+esc(c[1])+'</b><small>'+esc(r?r.det:c[2])+(r&&r.link?' <a href="'+esc(r.link)+'" target="_blank" rel="noopener">Abrir o console</a>':'')+'</small></span>'+(r?(r.ms>=1&&r.estado!=='info'?'<span class="sd-ms">'+r.ms+' ms</span>':'')+sdPill(r.estado):'<span class="pill">'+(SAUDE.busy?'Verificando…':'—')+'</span>')+'</div>'}).join('');
  var nOk=0,nAv=0,nF=0;Object.keys(SAUDE.res).forEach(function(k){var e=SAUDE.res[k].estado;if(e==='ok')nOk++;else if(e==='aviso')nAv++;else if(e==='falha')nF++});
  /* uso */
  var agora=Date.now(),M=SH.on?SH.members:[],dia=864e5;
  var hoje=M.filter(function(m){return m.last>agora-dia}).length,sem=M.filter(function(m){return m.last>agora-7*dia}).length,novos=M.filter(function(m){return m.first>agora-7*dia}).length,vis=M.reduce(function(a,m){return a+(m.visits||0)},0);
  var filas7=(SH.on?SH.fila:[]).filter(function(r){return r.ts>agora-7*dia}).length,avisos7=(SH.on?SH.reps:[]).filter(function(r){return r.ts>agora-7*dia}).length;
  var reqs=allReqs(),abertas=reqs.filter(function(r){var s=reqStatus(r.id).st;return s==='nova'||s==='analise'}).length;
  var E=SAUDE.est||{},f=E.fbk,er=E.err,num=function(v){return v==null?'—':Number(v).toLocaleString('pt-BR')};
  var tiles=function(L){return '<div class="la-nums fbk-sum">'+L.map(function(x){return '<span><b>'+x[0]+'</b>'+x[1]+'</span>'}).join('')+'</div>'};
  return '<h3 class="gh">Saúde e estatísticas</h3>'+
    '<p class="muted small keep">Confere agora, a partir deste aparelho, se cada serviço de que o app depende está respondendo. '+(SAUDE.quando?'Última verificação '+agoTxt(SAUDE.quando)+'.':'')+'</p>'+
    (SAUDE.quando?tiles([[nOk,'funcionando'],[nAv,'com atenção'],[nF,'fora do ar']]):'')+
    (SAUDE.quando&&nF?'<div class="sd-fora" role="status"><b>Fora do ar agora</b><ul>'+SAUDE_CHECKS.filter(function(c){var r=SAUDE.res[c[0]];return r&&r.estado==='falha'}).map(function(c){return '<li><b>'+esc(c[1])+':</b> '+esc(SAUDE.res[c[0]].det)+'</li>'}).join('')+'</ul></div>':'')+
    '<div class="glist sd-list">'+lista+'</div>'+
    '<div class="row gbtns"><button type="button" class="copy primary" id="sdCheck"'+(SAUDE.busy?' disabled':'')+'>'+(SAUDE.busy?'Verificando…':'Verificar agora')+'</button></div>'+
    sdVivoHTML()+
    '<h3 class="gh sd-sec">Uso</h3>'+
    (SH.on?tiles([[num(M.length),'pessoas no total'],[num(hoje),'usaram nas últimas 24 h'],[num(sem),'usaram nos últimos 7 dias'],[num(novos),'novas nos últimos 7 dias'],[num(vis),'visitas somadas']])
      :'<p class="muted small keep">Os números de uso aparecem no site com o Firebase.</p>')+
    '<h3 class="gh sd-sec">Participação (últimos 7 dias)</h3>'+
    tiles([[num(filas7),'filas do RU informadas'],[num(avisos7),'avisos'],[num(abertas),'solicitações abertas'],[f?num(f.sem):'—','feedbacks'],[f&&f.med!=null?f.med.toFixed(1).replace('.',','):'—','nota média do app'+(f?' ('+f.n+' no total)':'')]])+
    '<h3 class="gh sd-sec">Ônibus e erros</h3>'+
    tiles([[num(LIVE.bus.length),'ônibus da cidade no mapa agora'],[num((LVM.hist||[]).length),'medições da previsão neste aparelho'],[er?num(er.dia):'—','erros nos aparelhos (24 h)'],[er?num(er.sem):'—','erros (7 dias)']])+
    (er===undefined&&!gcan('usuarios')?'<p class="muted small keep">Os erros aparecem para quem tem o privilégio Usuários.</p>':'')+
    '<div class="row gbtns"><button type="button" class="copy" id="sdStats">Atualizar números</button></div>';
}
aoFazer('gestão montada',function(){if(gTab==='saude'&&$('#gBody'))$('#gBody').innerHTML=gSaude()});
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('#sdCheck')){saudeVerifica();renderGest();return}
  if(e.target.closest&&e.target.closest('#sdStats')){SAUDE.est=null;saudeEstatisticas();renderGest()}
});
/* ======================= Prédios que faltavam na planta (cadastro da UFRJ) =======================
   A planta do mapa (mapa-campus*.svg/jpg) não tem alguns prédios, como o CENPES II, o IEN e o bloco central do CT.
   Eles vêm do cadastro de edificações da UFRJ no ArcGIS Online e são desenhados por cima da planta, na mesma cor
   dos outros prédios. Onde a planta tem prédios borrados (CENPES e CEPEL), eles são cobertos com a cor do chão e redesenhados
   pelo cadastro. Os dados são gerados por tools/edificacoes_ufrj.py (src/edificacoes.json). */
var EDIF={"fonte":"UFRJ, cadastro de edificações da Cidade Universitária (ArcGIS Online)","item":"7c0652800dcc498e8b9d2754aa962f8c","predios":[["","M1046.7 120.9 1046.8 133.1 1038 133.2 1037.9 121Z"],["Centro de Pesquisa em Medicina Regenerativa","M374.7 150.1 384.4 150 384.4 151.6 386.3 151.4 386.4 155.8 375.3 155.9Z"],["","M432.4 490.5 432.2 488.9 434.5 488.6 434.4 487.8 435.2 487.7 435.5 490Z"],["CT 2","M927 571.1 919 571.1 919 570.1 927 570.1Z"],["Instituto de Macromoléculas (anexo)","M972.6 582 969.5 585.2 961.3 577.1 964.3 574.3Z"],["CCS","M295 287.4 295 280.1 298.5 280.2 298.4 283.5 300.4 283.5 299.5 280.1 302.2 280.1 301.3 283.3 304.2 283.4 304.3 281.9 303.2 281.8 303.2 280.3 306.4 280.2 306.4 281.8 305.2 281.9 305.2 283.3 308.3 283.3 307.6 280.4 309.4 280.3 309 283.4 311.4 283.3 310.4 280.2 313 280.3 312.3 283.4 315.3 283.3 315.4 282 314 281.9 314 280.3 317.3 280.2 317.4 281.7 316.1 281.8 316.1 283.4 318.1 283.4 318.2 287.6Z"],["CENPES II (Petrobras)","M660.4 387.7 663.4 384.7 667.4 383.3 671.6 383.6 674.1 384.8 676.3 386.6 678.3 390.3 678.6 394.5 677.1 398.5 674.1 401.4 670.1 402.9 667.3 402.9 663.4 401.5 660.4 398.5 659.2 395.9 658.9 391.7Z"],["CENPES II (Petrobras)","M641.7 406.1 639.3 404.1 638.5 402 638.9 400.2 640.2 399.3 642.9 399.5 646.3 401.4 647.6 403.6 647.6 405.5 646.2 406.6Z"],["CENPES II (Petrobras)","M601 358.8 658 392.2 650.9 404.5 593.8 371.1Z"],["Anexo da COPPE (bloco M)","M943.2 488.5 943.2 481.1 955.2 481.1 955.2 488.5Z"],["Manutenção da COPPE (bloco N)","M944.1 495.6 944.1 494 947.4 494 947.5 495.5Z"],["Instituto Virtual de Mudanças Globais","M969.9 497.4 971.9 497.3 972 499.9 969.9 500Z"],["CENPES (Petrobras)","M678.6 468.3 678.6 462.4 696.4 462.3 696.3 468.2Z"],["CENPES (Petrobras)","M662.5 451.7 660 446.7 665.9 444.5 674.2 444.8 679.8 447.7 676.1 452.2 673.7 450.6 669.5 449.7Z"],["CENPES (Petrobras)","M635.8 506.4 635.5 493.3 643.3 493.1 643.7 506.1Z"],["CENPES (Petrobras)","M635.5 493.3 634.7 439.3 654.3 439.2 654.1 444.3 640.4 444.4 640.7 493.2Z"],["CENPES (Petrobras)","M697.9 476.7 698 476.8 697.9 476.7Z M698 476.7 697.8 450.5 696.9 450.3 697.1 447.8 698.2 447.9 698.2 446.7 695.6 446.9 695.4 438.5 703.3 438.3 703.4 476.7Z"],["CENPES (Petrobras)","M695.4 491.8 695.2 477.8 703.3 477.8 703.5 491.7Z"],["CENPES (Petrobras)","M695.6 503.4 695.4 492.7 702.8 492.6 703 503.2Z"],["CENPES II (Petrobras)","M600.6 388.8 606.5 378.6 610.7 381 604.9 391.2Z"],["CENPES II (Petrobras)","M605.6 392.1 611.3 381.5 615.1 383.6 609.5 394.2Z"],["CENPES II (Petrobras)","M612.1 395.2 617.5 385.2 621.7 387.4 616.3 397.5Z"],["CENPES II (Petrobras)","M616.9 398.4 622.4 388.1 626.5 390.3 621 400.6Z"],["CENPES II (Petrobras)","M589.2 394.8 600 374.9 604.1 377.1 593.2 397Z"],["CENPES II (Petrobras)","M585 392.5 596 372.5 599.5 374.4 588.5 394.4Z"],["CENPES II (Petrobras)","M602.3 359.6 603.6 357.4 607.6 359.8 606.2 362Z"],["CENPES II (Petrobras)","M612.7 365.7 615.3 361.4 620 364.2 617.4 368.5Z"],["CENPES II (Petrobras)","M618.4 369 621.3 364.3 625.5 366.8 622.6 371.6Z"],["CENPES II (Petrobras)","M623.9 372.3 629.6 362.7 634.1 365.3 628.4 374.9Z"],["CENPES II (Petrobras)","M629.4 375.5 634.9 366.3 639.4 368.9 633.9 378.1Z"],["CENPES II (Petrobras)","M622.9 402 622.8 401.9 622.9 402Z M622.9 402 628.6 391.5 633 394 627.1 404.6Z"],["CENPES II (Petrobras)","M629.2 402.8 633.6 394.6 637.6 396.7 633.2 405Z"],["CENPES II (Petrobras)","M635.7 379.2 643.9 364.7 648.4 367.2 640.2 381.7Z"],["CENPES II (Petrobras)","M640.8 382.2 648.9 368.2 652.7 370.3 644.6 384.4Z"],["CENPES II (Petrobras)","M646.7 385.6 654.8 371.7 659.1 374.2 650.9 388.1Z"],["CENPES II (Petrobras)","M651.8 388.6 660.2 374.4 664.2 376.8 655.8 390.9Z"],["CENPES II (Petrobras)","M595.1 368.8 593.8 371.1 595.6 372.1 584.3 392.1 580.2 389.6 593.2 367.8Z"],["CENPES II (Petrobras)","M578.9 363.5 585.3 351.6 588.1 353.2 588.7 352 591.2 353.5 591.8 352.5 594.6 354.3 595 353.5 597.6 355 598.2 353.9 601.2 355.7 596.8 363.4 594 361.9 591 367.1 588.3 365.7 587.2 367.4 582 364.2 581.5 365.1Z"],["CENPES II (Petrobras)","M554.9 390.7 563.9 374.6 576.1 381.3 567.1 397.5Z"],["CENPES II (Petrobras)","M552.2 391.3 567.6 399.7 573.5 388.9 576 390.4 575.5 391.3 576.9 392.1 567.6 408.6 566.2 407.6 565.7 408.5 563.5 407 566.3 402.4 565.9 402.1 564.6 404 562.3 402.8 563.6 400.9 562 400.1 559.1 404.7 557.9 403.9 559.9 399 557.3 397.1 556.9 398.1 554.6 397 555.1 396.2 550.8 393.7Z"],["CENPES II (Petrobras)","M579.4 349.9 580.3 348.2 584.4 350.4 583.5 352.1Z"],["CENPES II (Petrobras)","M564.4 365.4 574.2 348.1 579.1 350.8 569.2 368.1Z"],["CENPES II (Petrobras)","M557.4 364.3 557.4 364.3 557.4 364.3Z M557.4 364.3 563.2 353.8 559.1 351.3 562.1 345.2 566.6 347.7 567.4 346.5 572.3 349.2 563.4 365.1 561 363.6 559.7 365.6Z"],["CENPES II (Petrobras)","M552.9 367.9 546.7 367.8 546.4 354.4 560.6 354.4Z"],["CENPES II (Petrobras)","M513.9 403.3 514.1 399 532.9 399.7 532.7 404.1Z"],["CENPES II (Petrobras)","M533.7 411.9 533.7 408.2 536.4 408.2 536.3 411.9Z"],["CENPES II (Petrobras)","M528.5 407.3 528.5 405 534.7 405 534.7 407.4Z"],["CENPES II (Petrobras)","M534.7 407.4 534.8 404.3 537 404.4 536.9 407.5Z"],["CENPES II (Petrobras)","M536.3 409.4 536.4 407 538.3 407 538.2 409.4Z"],["CENPES II (Petrobras)","M523.6 390.5 524.6 389.4 526.2 390.8 525.2 391.9Z"],["CENPES II (Petrobras)","M682 382.3 682 376.9 702.8 376.5 702.9 383.7 684.5 384.1 684.5 382.2Z"],["CENPES II (Petrobras)","M694.8 376.7 694.7 375.1 695.9 375 696 368 698.9 368 698.9 375 702.7 375.1 702.8 376.5Z"],["Parque Tecnológico","M1140.1 252.4 1140.3 248.3 1141 245.8 1141.6 245.9 1141.9 241.9 1158 242.3 1157.8 249 1156.1 248.9 1156.1 252.8Z"],["LabOceano","M1177.8 243.4 1178.1 223.2 1190.5 223.4 1190.1 243.6Z"],["LabOceano","M1171.9 235.9 1172.1 229.4 1178 229.6 1177.8 236.1Z"],["LabOceano","M1165.7 242.5 1165.7 239.9 1167 239.9 1166.9 242.5Z"],["Núcleo de Estruturas Oceânicas","M1167.9 230.6 1168 227.6 1171.2 227.7 1171.1 230.8Z"],["Parque Tecnológico","M1202.1 246.2 1203.2 224.8 1216.8 225.7 1216 238.5 1221.2 239 1220.7 247.3Z"],["CEPEL","M595.1 476.8 595 452.3 610.7 452.2 610.7 476.8Z"],["CEPEL","M577.3 476.8 577.3 468.2 585.9 468.2 585.9 476.7Z"],["CEPEL","M578 467 578 462.7 582.6 462.7 582.5 467Z"],["CEPEL","M583.3 466.8 583.4 462.5 587.8 462.7 587.7 466.9Z"],["CEPEL","M572.3 472.2 572.3 470 577.3 469.9 577.3 472.1Z"],["CEPEL","M568.6 467.2 568.5 465 575.8 464.9 575.9 467.1Z"],["CEPEL","M578.2 495.9 578.2 487.9 581.5 487.8 581.5 490.6 582.3 490.6 582.2 487.9 585.6 487.9 585.4 495.4 582.3 495.7 582.3 493 581.5 493 581.5 495.9Z"],["CEPEL","M579.9 508.2 588.9 508.1 588.9 510 587.7 509.9 587.7 511 580.8 511.1 580.8 510 579.8 510Z"],["CEPEL","M581 507.4 581 504.6 587.5 504.7 587.5 507.4Z"],["CEPEL","M578.4 497.7 587.4 497.3 587.5 500.8 584.4 500.7 584.4 504 578.4 504.3Z"],["Embratel","M1056 303.4 1057.5 291.9 1070 293.5 1068.5 304.9Z"],["Embratel","M1074.6 287.4 1076.1 277.6 1079.6 278.2 1078.1 287.9Z"],["CENPES (Petrobras)","M684.6 514.7 684.7 511.3 687.4 511.3 687.4 514.7Z"],["CENPES (Petrobras)","M683.9 510.2 685.4 510.2 685.4 511.3 683.9 511.3Z"],["CENPES (Petrobras)","M688 515.4 687.9 511 686.4 510.8 686.4 510.1 693.3 510.1 693.2 515.2Z"],["CENPES (Petrobras)","M660.7 510.2 666.9 510.2 667 516.3 661.5 516.4 661.6 512.8 660.8 512.7Z"],["CENPES (Petrobras)","M654 513.7 653.8 510.5 657.9 510.3 658.1 513.5Z"],["CENPES (Petrobras)","M650.3 516.4 650.3 513.8 654 513.7 654 516.4Z"],["CENPES (Petrobras)","M646.6 514.4 646.4 510.3 649.2 510.2 649.4 514.3Z"],["CENPES (Petrobras)","M649.2 510.9 649.2 510 653.9 510.1 653.8 511Z"],["CENPES (Petrobras)","M635.8 494.2 635.8 505.2 633.3 505.3 633.2 518.8 636 518.8 636.2 521.4 631.2 521.2 631.3 494.2Z"],["Horto","M440.8 473.3 441 471.2 444.3 471.7 444.2 473.5Z"],["Anexo da COPPE (bloco M)","M943.6 491.3 943.6 489.5 946.3 489.4 946.3 491.2Z"],["IEN (Instituto de Engenharia Nuclear)","M1059.4 461.5 1060.3 454.2 1064.8 454.8 1063.9 462Z"],["IEN (Instituto de Engenharia Nuclear)","M1053 473 1052.9 469.1 1056.2 469 1056.3 472.9Z"],["IEN (Instituto de Engenharia Nuclear)","M1057.9 455.2 1058.1 453.8 1059.2 453.9 1059 455.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1054.3 455.7 1054.5 454.3 1055.4 454.5 1055.2 455.8Z"],["IEN (Instituto de Engenharia Nuclear)","M1036.4 492.2 1037.6 488.2 1040.3 488.2 1039.9 492.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1073.1 441 1073 437.7 1074.7 437.7 1074.8 440.9Z"],["","M1221.1 342.5 1221 346.4 1219.8 346.2 1218.7 359.2 1213 358.8 1213.1 357.5 1209.7 357.3 1210 353.3 1210.9 353.4 1211.5 341.9Z"],["Parque Tecnológico","M1275 269.5 1268 269.4 1268.1 261.8 1286.4 262.1 1286.3 269.7Z"],["Parque Tecnológico","M1273.5 278.4 1275 278.4 1274.9 283.3 1287.6 283.4 1287.6 291.8 1267.8 291.8 1268.4 278.4Z"],["Estação Meteorológica","M709.9 552.8 709.8 550.5 714.2 550.3 714.3 552.7Z"],["Estação Meteorológica","M711.8 549.9 711.7 544.7 714.3 544.6 714.4 549.8Z"],["Estação Meteorológica","M719.4 541.3 719.4 544.8 711.7 544.7 711.5 534.8 714.7 534.7 714.8 541.4Z"],["Estação Meteorológica","M718.2 541.3 718.2 536.5 719.5 536.5 719.5 541.3Z"],["CENPES (Petrobras)","M703.6 520.7 703.6 517.9 708 518 708 520.8Z"],["CENPES (Petrobras)","M694.7 520.9 694.8 514.7 697.3 514.7 697.1 521Z"],["","M696.1 548.1 696.1 543.4 700 543.6 699.8 549.1Z"],["","M688.2 543.8 689.1 541.4 695.6 544 695 545.7Z"],["","M672 540.3 668.5 537.9 668.4 534.4 670.7 534.5 670.7 530.1 677.5 529.9 678.2 539.7 688.2 538.9 688.1 541.1 689.1 541.4 687.5 545.1 684.3 545 684 543.8 682.3 544 682.5 542.9Z"],["CENPES (Petrobras)","M704.9 497.7 704.9 495.9 707.7 496 707.7 497.8Z"],["CENPES (Petrobras)","M705.2 503.2 707.7 503.2 707.7 508.6 705.2 508.6Z"],["CENPES (Petrobras)","M707.5 463.6 707.4 472.1 704.7 472 704.8 463.6Z"],["CEPEL","M592.4 457.6 592.5 454.9 595 454.9 595 457.6Z"],["CEPEL","M592.3 465.6 595 465.6 595 467.5 592.3 467.6Z"],["CEPEL","M592.9 502.9 590.8 502.1 591.2 498.6 594.3 499.7Z"],["CENPES (Petrobras)","M651.7 451.1 649.3 448.7 653.4 444.6 655.8 447Z"],["CENPES (Petrobras)","M647.1 467.6 642.1 467.7 642 461.9 647.1 461.8Z"],["CENPES (Petrobras)","M683.1 447.5 685.8 444.7 689.9 448.8 687.2 451.6Z"],["IEN (Instituto de Engenharia Nuclear)","M1081.6 441.1 1086 441.1 1085.8 453 1081.4 452.9Z"],["DIPRO","M426.1 100.4 426.2 101.1 425.3 101.2 425.3 100.4Z"],["","M649.6 23.3 649.3 24.3 648.7 24.1 649.1 23.1Z"],["IEN (Instituto de Engenharia Nuclear)","M1051.1 445.9 1051.2 446.7 1048.3 446.8 1048.2 445.9Z"],["IEN (Instituto de Engenharia Nuclear)","M1056.7 435.3 1056.4 436.8 1054.6 436.9 1054.5 435Z"],["IEN (Instituto de Engenharia Nuclear)","M1059.4 441.8 1062 441.5 1061.9 443.4 1059.4 443.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1060.4 446.4 1060.4 447.5 1057.3 447.6 1057.3 446.5Z"],["IEN (Instituto de Engenharia Nuclear)","M1035.1 442.3 1035.1 445.4 1033.7 445.5 1033.7 446.7 1027.5 446.7 1027.4 438.8 1035.1 438.7Z"],["IEN (Instituto de Engenharia Nuclear)","M1035.1 438.7 1035.1 443.8 1033.6 443.8 1033.6 445 1032.1 445 1032.1 438.7Z"],["IEN (Instituto de Engenharia Nuclear)","M1035.1 442.3 1035.1 443.8 1032.1 443.8 1032.2 442.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1052.2 497.8 1052.3 499.1 1050.7 499.1 1050.7 497.9Z"],["Anexo da COPPE (bloco M)","M959.1 489.5 959.1 490.6 957.6 490.6 957.6 489.6Z"],["IEN (Instituto de Engenharia Nuclear)","M1079.1 441 1079 447.9 1076.9 447.9 1077 441Z"],["IEN (Instituto de Engenharia Nuclear)","M1079.1 441 1081.6 441.1 1081.5 452.9 1078.9 452.8Z"],["IEN (Instituto de Engenharia Nuclear)","M1087.6 441.1 1087.7 447.4 1085.7 447.4 1085.7 441.1Z"],["IEN (Instituto de Engenharia Nuclear)","M1087.6 443 1087.6 441.1 1088.8 441 1088.8 443Z"],["IEN (Instituto de Engenharia Nuclear)","M1087.8 449.2 1087.8 452.9 1085.8 453 1085.7 449.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1072.9 445.1 1072.6 446.1 1069.7 445.5 1070 444.4Z"],["IEN (Instituto de Engenharia Nuclear)","M1071.3 436.2 1071.4 438.8 1069.4 438.9 1069.4 436.2Z"],["Subestação da Light","M178.2 377.8 178.4 380.2 174.9 380.5 174.7 378.1Z"],["Centro de Tecnologia (CT)","M828.2 487.6 828.2 495.7 820.9 495.7 820.5 443.7 827.8 443.7Z"],["IEN (Instituto de Engenharia Nuclear)","M1026.5 489.6 1033.1 489.7 1033.2 491.1 1026.5 491.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1044.6 493.4 1040.3 493.4 1040.3 487.5 1038.5 487.5 1038.4 485.6 1044.4 485.5Z"],["IEN (Instituto de Engenharia Nuclear)","M1039.4 481.5 1041.5 481.4 1041.5 483.2 1043.6 483.1 1043.7 485.5 1039.3 485.6Z"],["IEN (Instituto de Engenharia Nuclear)","M1043.2 481.5 1043.2 482.5 1041.6 482.5 1041.5 481.5Z"],["Polo de Xistoquímica","M1010 535.1 1010.1 538.2 1001.7 538.3 1001.6 535.2Z"],["IEN (Instituto de Engenharia Nuclear)","M1039.4 479.2 1046.2 479 1046.3 489.7 1044.5 489.7 1044.6 493.4 1040.3 493.4 1040.3 487.5 1038.5 487.5 1038.4 485.6 1039.3 485.6 1039.5 484.4Z"],["IEN (Instituto de Engenharia Nuclear)","M1023.5 489.3 1026.4 488.9 1026.5 490.4 1023.5 490.4Z"],["IEN (Instituto de Engenharia Nuclear)","M1025 484.5 1025.2 485.8 1023.6 486.1 1023.3 484.7Z"],["","M1272.7 327 1272.7 324.8 1269.6 325.5 1269.7 323.6 1274.4 323.6 1274.4 327.1Z"],["","M1268.7 323.6 1268.8 325.5 1267.5 325.5 1267.5 323.6Z"],["","M1279.9 324.1 1279.9 326.8 1277.6 326.5 1277.5 324.1Z"],["","M1280.9 323.6 1280.9 325.1 1279.9 325.2 1279.9 323.6Z"],["","M1288.9 325 1288.8 326.2 1286.9 326 1287 324.9Z"],["","M1290.7 322.6 1290.8 323.5 1289.8 323.5 1289.7 322.6Z"],["","M1246 332.7 1245.9 334 1242.6 334 1242.6 332.7Z"],["","M1242.1 331 1242.1 332.7 1239.5 332.7 1239.6 331Z"],["","M1241.1 331 1241.1 332.7 1239.5 332.7 1239.6 331Z"],["","M1242.6 332.7 1242.6 334 1239.1 334 1239.1 332.7Z"],["","M1242.6 332.7 1242.6 334 1241 334 1241.1 332.7Z"],["","M1239.1 335.5 1239.1 334 1242.2 334 1242.1 335.5Z"],["","M1068.8 99.8 1070.5 100.6 1069.6 102.4 1067 101.1 1067.8 99.4Z"],["","M1058.5 98.2 1063 99.5 1062.3 101.7 1057.8 100.7Z"],["","M1057 97.9 1056.5 100.3 1052.6 99.3 1053.3 96.9Z"],["","M1053.1 97.5 1052.9 98.3 1052 98 1052.3 96.9Z"],["","M1070.3 98.6 1070.7 99.1 1069.9 99.7Z"],["","M1104 61.3 1108.8 62.2 1109.1 60.7 1111.4 61.1 1110.2 65.4 1103.4 64.2Z"],["","M1109.1 40.6 1110 40.5 1109.9 39.6 1111.8 39.5 1112 43.5 1109.9 43.6Z"],["","M1100.9 44.3 1101.9 44.2 1102 43 1110.9 42.8 1111 46.2 1100.9 46.3Z"],["","M1128.4 32.4 1127.9 32.3 1127.7 33.6 1128.4 33.6 1127.9 35.8 1124.6 35.8 1124.4 31.9 1125.5 31.8 1125.6 30.6 1128.4 30.4Z"],["","M1131.2 31 1129.4 31.6 1129.4 31Z"],["","M1136.8 29.1 1137.3 30.2 1135.5 30.9 1135 29.3Z"],["","M1139 28.5 1139.6 30.3 1138.3 31.2 1137.6 28.9Z"],["","M1143.1 30.6 1143.7 32.5 1142.7 32.8 1142.2 31Z"],["","M1137.8 31.9 1141.5 30.4 1142.7 33.7 1138.7 35Z"],["","M1158 4.8 1159 8 1154.3 9.4 1153.4 5.5 1154.4 5.1 1154.7 5.8Z"],["","M1133.3 28 1133.3 29.7 1132.3 29.7 1132.2 28Z"],["","M1034.7 202.8 1034.6 203.6 1032 202.9 1032.2 202.2Z"],["CETEM","M1030.8 248 1030.8 248.7 1029 248.7 1029 248Z"],["CETEM","M1038.8 256 1038.8 261.8 1033.9 261.9 1033.8 256.1Z"],["CETEM","M1038.8 265.6 1038.8 268 1033.6 267.9 1033.5 265.6Z"],["CETEM","M1023 257.2 1023.1 262 1016.5 262.1 1016.3 254.3 1023 254.2Z"],["CETEM","M1019.3 283.3 1019.4 295 1007.7 295.1 1007.6 283.4Z"],["CETEM","M1004 293.6 1004 297.3 1000.3 297.4 1000.2 293.7Z"],["CETEM","M1016.3 254.3 1016.5 262.1 1019 262.1 1019.1 269.8 1027.6 268.9 1027.7 278.1 1015.3 278.3 1015.4 283.3 1011.5 283.4 1011.5 278.3 999.2 278.4 999.2 269.2 1008.4 269.1 1008.4 262.8 1002.8 262.8 1002.8 253.7 1016.3 253.5Z"],["CETEM","M1023.1 269 1023.1 269.8 1019.1 269.8 1019 262.1 1023.1 262Z"],["CETEM","M1031.4 257.2 1031.4 262.6 1023.1 262.6 1023 257.2Z"],["CETEM","M1028.8 266.2 1030.5 266.2 1030.6 268 1028.9 268.1Z"],["CETEM","M1033.2 269 1033.1 271.5 1027.6 271.6 1027.6 268.9Z"],["Parque Tecnológico","M1205.3 316.4 1206 316.4 1206.2 319.4 1203.9 319.3 1204.1 316.2Z"],["Faculdade de Letras","M953 367.9 957.2 367 957.4 367.6 957.4 367 959.5 367 959.5 367.5 961.9 367 961.9 367.5 966.6 366.9 967.3 367.6 967.4 379.2 966.9 379.2 967.4 379.5 967.5 386.3 967 386.3 967.6 393.4 966.8 394.2 964.8 394.2 964.9 393.7 960 394.2 960 393.7 957.7 394.2 957.6 393.7 955.4 394.3 954.7 393.1 953.4 393.2Z M957.7 379.2 959.4 378.9 959.1 375 957.6 375Z M962.5 381.5 964.3 381.5 964.3 379.7 962.5 379.7Z M962.4 384.5 962.4 386.3 964.4 386.3 964.4 384.5Z"],["Faculdade de Letras","M930.6 355.9 952.8 355.2 952.9 363.1 931.8 363.3 931.9 367.4 952.9 367.2 953.1 375 931.9 375.2 932 379.2 953.1 379.1 953.3 387 930.8 387Z M936 384.2 949 384 948.9 382.1 936.1 382.3Z M936 372.3 949 372.1 948.9 370.3 936 370.4Z M936 360.4 948.9 360.2 948.8 358.3 935.9 358.5Z"],["Faculdade de Letras","M954.9 367.8 955.1 393.5 953.4 393.2 953 367.9Z"],["Faculdade de Letras","M930.1 386.5 924.4 386.9 924.4 385.7 929.6 385.6Z"],["Faculdade de Letras","M930 374.5 924.3 375 924.3 373.7 928.2 373.6 928.3 374.5Z"],["CETEM","M1016.3 253.5 1016.6 278.2 1011.5 278.3 1011.5 253.6Z"],["","M1301.8 328.2 1301.6 334.8 1299 334.7 1299.3 328.2Z"],["CETEM","M1026.8 253.3 1026.8 257.2 1023 257.2 1023 254.2 1016.3 254.3 1016.3 253.5Z"],["IEN (Instituto de Engenharia Nuclear)","M1026.5 489.6 1033.1 489.7 1033.2 491.1 1026.5 491.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1024.1 481.1 1024.6 484.1 1023.2 484.4 1022.6 481.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1044.6 493.4 1040.3 493.4 1040.3 487.5 1038.5 487.5 1038.4 485.6 1044.4 485.5Z"],["IEN (Instituto de Engenharia Nuclear)","M1039.4 481.5 1041.5 481.4 1041.5 483.2 1043.6 483.1 1043.7 485.5 1039.3 485.6Z"],["IEN (Instituto de Engenharia Nuclear)","M1043.2 481.5 1043.2 482.5 1041.6 482.5 1041.5 481.5Z"],["Centro de Tecnologia (CT)","M928.9 503.7 928.9 509.1 847.4 509.6 847.3 504.3Z"],["Anexo da COPPE (bloco M)","M949.6 475.9 949.6 481.1 943.7 481.1 943.7 475.9Z"],["Centro de Tecnologia (CT)","M904.9 494.3 922.1 494.1 922.1 489 925.9 489 925.8 503.7 850.8 504.2 850.7 495Z"],["Centro de Tecnologia (CT)","M925.8 510.7 925.9 514.2 851.2 514.7 851.2 509.6 925.8 509.1Z"],["IEN (Instituto de Engenharia Nuclear)","M1044.6 493.4 1044.5 490.3 1045.8 490.3 1045.8 493.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1048.9 472.1 1049.1 476.6 1046.4 476.6 1046.3 472.2Z"],["IEN (Instituto de Engenharia Nuclear)","M1058.6 488.9 1058.7 493.6 1056.6 493.6 1056.5 488.9Z"],["IEN (Instituto de Engenharia Nuclear)","M1061.1 484.1 1061.1 486.2 1056.4 486.3 1056.3 484.2Z"],["IEN (Instituto de Engenharia Nuclear)","M1060.9 475.9 1061 479.1 1055.7 479.2 1055.6 476Z"],["IEN (Instituto de Engenharia Nuclear)","M1058.6 468.8 1058.7 472.7 1057.3 472.8 1057.1 468.8Z"],["IEN (Instituto de Engenharia Nuclear)","M1055.7 460.2 1054 460 1054.3 456.3 1056 456.5Z"],["IEN (Instituto de Engenharia Nuclear)","M1057 462 1056.9 464.1 1055.8 464 1055.9 461.9Z"],["IEN (Instituto de Engenharia Nuclear)","M1055.6 461.9 1055.4 463.9 1053.8 463.7 1054 460 1055.8 460.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1057 460.4 1056.8 462 1055.6 461.9 1055.8 460.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1057.6 452.4 1057.3 456.7 1055.7 456.5 1056 452.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1047.5 452.9 1047.4 458.9 1043.5 458.1 1043.5 456.6 1042.5 456.6 1042.5 451.3 1046.4 451.4Z"],["IEN (Instituto de Engenharia Nuclear)","M1027.6 453.5 1032.7 453.4 1032.8 458.6 1033.6 458.6 1033.6 460.8 1032.8 460.8 1032.9 468 1027.7 468 1027.1 454.6 1027.6 454.6Z"],["IEN (Instituto de Engenharia Nuclear)","M1029.7 458.8 1030.7 458.7 1030.7 457.7 1032.8 457.6 1032.8 458.6 1033.6 458.6 1032.8 462.8 1030.7 462.8Z"],["IEN (Instituto de Engenharia Nuclear)","M1041 449.9 1040.9 462.1 1036.6 462.1 1036.7 459.6 1033.6 459.6 1033.5 457.4 1036.6 457.5 1036.3 449.8Z"],["IEN (Instituto de Engenharia Nuclear)","M1035.5 456.8 1035.5 457.4 1033.5 457.4 1033.2 456.8 1033.1 450.8 1035.3 450.8Z"],["IEN (Instituto de Engenharia Nuclear)","M1036.3 454.6 1036.1 456.8 1035.5 456.8 1035.4 454.6Z"],["IEN (Instituto de Engenharia Nuclear)","M1022.5 463.6 1018.5 464.1 1018.4 457.8 1021.7 457.8Z"],["IEN (Instituto de Engenharia Nuclear)","M1027.6 463 1027.6 463.6 1022.5 463.6 1022.4 462.2 1027.6 462.3Z"],["IEN (Instituto de Engenharia Nuclear)","M1023.6 465 1023.7 468.2 1021.9 468.3 1021.8 464.9Z"],["IEN (Instituto de Engenharia Nuclear)","M1046.9 439 1047 445.3 1041.6 445.4 1041.6 439.1Z"],["IEN (Instituto de Engenharia Nuclear)","M1056.8 441.7 1056.8 445.6 1046.9 445.5 1046.9 441 1051 441 1050.9 441.8Z"],["IEN (Instituto de Engenharia Nuclear)","M1043.3 463 1045.9 463 1045.9 465.2 1042.8 465.2 1042.7 464.6 1041.7 464.6 1043.3 464.1Z"],["IEN (Instituto de Engenharia Nuclear)","M1043.3 463 1043.3 464.1 1033.7 464.1 1033.6 460.8 1034.9 460.8 1034.9 462.6Z"],["IEN (Instituto de Engenharia Nuclear)","M1045.9 465.2 1045.9 466.2 1045 466.2 1045 465.2Z"],["IEN (Instituto de Engenharia Nuclear)","M1057.2 470.3 1057.3 472.8 1056.4 472.8 1056.4 470.3Z"],["CENPES (Petrobras)","M645.2 518.3 642.9 518.6 642.8 516.7 645.2 516.7Z"],["CENPES (Petrobras)","M675.4 455.8 683.1 447.5 687.2 451.6 678.3 460.6 674.2 456.5Z"],["CENPES (Petrobras)","M666.4 516.3 666.5 520.6 645.4 520.8 645.4 516.5 658.3 516.4 658.4 515.4 657.6 515.4 657.5 513.5 658.6 513.5 658.6 512.8 660.8 513.4 660.9 515.4 660 515.4 660 516.4Z"],["CENPES (Petrobras)","M642.8 510.3 642.9 520.7 636.1 520.8 636 510.4Z"],["CEPEL","M578.2 503 578.2 504.1 577.6 504.1 577.6 503Z"],["CENPES (Petrobras)","M666 481.6 666 482.6 658.6 479.3 659.3 478.6 661.8 479.7 662.9 478.7 663.3 480.4Z"],["CENPES (Petrobras)","M659.1 493 659.3 505.9 656.6 506 656.5 493Z"],["CENPES (Petrobras)","M644.5 485.9 660.1 469.5 664.3 473.6 647.5 490.7 643.3 486.6Z"],["CENPES (Petrobras)","M646.6 513.1 646.6 514.4 645.7 514.4 645.6 513.1Z"],["CENPES (Petrobras)","M648.3 462 659.6 461.7 659.7 467.5 647.1 467.6 647.1 461.8Z"],["CENPES (Petrobras)","M674.7 492.8 674.8 505.8 646.3 506.1 646.2 493.1Z"],["CENPES (Petrobras)","M684.1 454.7 686.9 462.4 685.9 462.4 684.9 459.6 683.4 459.7 684.2 458.2 683.3 455.6Z"],["CENPES (Petrobras)","M662.6 458.2 660.7 460.1 651.7 451.2 655.8 447 664.8 455.9Z"],["CENPES (Petrobras)","M666.3 474.6 671.8 474.7 671.9 492 666.1 491.9Z"],["CENPES (Petrobras)","M677.8 469.9 694.8 486.7 690.7 490.9 673.6 474.1Z"],["CENPES (Petrobras)","M661.8 459.7 663 457.8 667.7 455.7 672 456 674.7 457.3 677.5 460.5 678.6 464.1 678.3 467.6 676.6 470.8 673.6 473.4 670.8 474.3 666.6 474 663.7 472.6 661.1 469.7 659.9 466 660.1 462.6Z"],["CENPES (Petrobras)","M672.3 466.7 670.4 468.3 667.4 468 665.8 466.1 666.2 463.1 668.3 461.6 671.3 462.1 672.7 464.2Z"],["CENPES (Petrobras)","M666.5 520.6 666.4 516.3 679.4 516.3 679.4 515.2 678.5 515.2 678.5 513.3 679.6 513.3 679.6 512.7 681.8 513.3 681.8 515.2 680.9 515.2 680.9 516.2 693.9 516.1 694 520.3Z"],["CENPES (Petrobras)","M692.8 492.7 692.8 503.1 679.9 503.2 679.8 492.8Z"],["CENPES (Petrobras)","M707.2 509.3 707.2 512.5 705.6 512.5 705.6 509.4Z"],["CENPES (Petrobras)","M670.9 440.1 669.4 440.8 668.8 439 670.3 438.5Z"],["Parque Tecnológico","M1275 269.5 1275 278.4 1273.5 278.4 1273.6 269.5Z"],["Parque Tecnológico","M1275 277 1276.6 277 1276.5 278.3 1287.5 278.5 1287.6 276.9 1290.7 277 1290.6 284.3 1287.7 284.4 1287.6 283.4 1274.9 283.3Z"],["Parque Tecnológico","M1146.6 272 1147.8 272.9 1147.5 272.1 1147.9 271.5 1148.5 271.8 1151.8 266.6 1155.8 266.7 1154.9 268.1 1156 268.7 1155.2 270 1154.2 269.4 1151.9 272.7 1152.2 276.1 1146.5 276.7Z"],["Centro de Tecnologia (CT)","M857.2 465.7 857.6 494.7 850.7 495 850.5 465.8Z"],["Centro de Tecnologia (CT)","M871 465.6 871.3 494.6 864.2 494.7 863.9 465.6Z"],["Centro de Tecnologia (CT)","M884.5 465.4 884.8 494.5 877.8 494.6 877.4 465.5Z"],["Centro de Tecnologia (CT)","M898.2 465.3 898.4 494.4 891.3 494.4 891.1 465.4Z"],["Centro de Tecnologia (CT)","M911.8 465.1 912 494.2 904.9 494.3 904.7 465.2Z"],["Centro de Tecnologia (CT)","M839.3 479.5 835.8 479.6 835.8 485 850.7 484.8 850.7 489.5 828.2 489.5 828.2 485.1 831.6 485.1 831.5 479.6 828.1 479.7 828 475.2 839.1 475.2Z"],["Centro de Tecnologia (CT)","M845.6 484.9 839.3 484.9 839.1 466 845.5 465.8Z"],["Parque Tecnológico","M1241.5 265.5 1242.7 263.8 1251 267.7 1249.6 269.4Z"],["CENIMP","M330.4 173 330.3 174.5 328 174.5 328 173 326.1 173 326 167.7 328 167.7 328 166.3 330.3 166.3 330.3 167.7 331.6 167.7 330.9 170.9 331.6 170.9 331.6 172.9Z"]],"apagar":"M708.7 442.8 708.5 443.5 707.9 443.7 707.9 446.8 708.2 447.2 708.9 446.2 709 443Z M708.1 438.2 707.9 442.1 708.2 442.5 708.9 441.6 709 439.9 708.8 439Z M595.3 503.7 595.3 506.5 597.1 507 597.6 506.5 597.6 503.7Z M680.2 498.5 681.4 508.3 681.9 508.8 687.4 508.8 688 511.5 690.1 512.1 690.1 498.5 686.3 498.5 685.8 498Z M601.8 492.3 601.8 496.1 603.2 496.1 603.6 495 604.6 495 604.1 493.4Z M582.7 492.3 584.1 500.5 583.6 503.2 584.1 506.5 583.6 508.6 581.3 509.7 581.3 511.9 583.6 512.5 584.1 509.7 585.9 509.2 586.4 511.4 585.9 513 584.1 514.6 584.6 516.8 587.3 516.8 588.7 515.2 592.9 515.7 593.9 514.6 593.9 513 592.5 510.8 592.5 509.7 590.1 509.2 589.2 507.6 589.2 506.5 590.1 505.4 592 505.4 591.5 502.1 589.2 502.1 588.7 501.6 588.7 500.5 589.7 499.9 589.2 492.8 588.7 492.3Z M613.4 491.8 611.1 492.3 611.1 495.6 611.6 496.1 613.4 496.1Z M577.6 481.9 576.6 483 577.1 490.7 579.4 491.2 580.8 490.7 580.4 484.1 579.4 481.9Z M579.9 466.1 579.9 468.9 580.8 469.4 580.4 471.6 580.8 480.3 581.3 480.9 588.3 480.3 588.7 477.6 589.7 477 589.2 466.7 588.7 466.1Z M585 477 586.4 476.5 586.9 478.7 585.5 479.2Z M575.7 459.1 576.2 462.3 579 462.3 579 459.1Z M595.3 454.2 594.3 457.4 592 457.4 591.5 461.2 593.9 461.2 595.3 462.9 596.7 480.9 610.6 480.9 611.1 478.7 610.6 478.1 610.6 473.2 610.2 472.7 610.2 467.2 611.1 466.1 611.1 465.1 609.7 463.4 609.2 455.8 608.8 455.2 600.8 455.8 599 453.6Z M595.7 457.4 597.1 456.9 597.6 458.5 596.2 459.1Z M651.1 450.8 647.8 454.1 647.8 455.1 651.1 457.9 651.1 460 650 460.6 649.5 463.3 647.8 465.4 644 465.4 644 471.4 644.5 472 648.4 472 650.5 474.1 652.2 480.1 642.3 490.4 642.3 491.5 645 493.1 646.1 494.7 647.2 494.7 650 492.6 651.1 490.4 653.3 488.8 656 485 658.8 484.4 662.6 486 662.6 484.4 659.4 483.9 658.8 482.3 662.1 478.5 663.8 478.5 664.9 481.2 664.9 485 663.8 485.5 663.8 486.6 665.4 488.8 665.4 492.6 666.5 496.9 662.1 498 660.5 497.4 653.3 497.4 652.8 498 646.1 497.4 646.1 502.9 646.7 503.4 647.2 510.4 675.9 511 675.3 498.5 672.5 497.4 671.5 488.2 674.2 486 676.4 486 677.5 485 678.6 485 686.9 492 688.5 494.2 690.1 494.7 690.1 487.1 683.5 481.7 683 479.5 680.8 479.5 676.4 475.2 677 473.6 681.9 473.6 682.5 474.1 682.5 478.5 683.5 478.5 684.6 475.2 686.3 473.6 690.1 473.6 690.1 468.2 688 467.1 685.2 467.1 683 464.9 681.9 458.9 684.1 457.3 684.1 456.2 680.2 453 680.2 451.9 679.1 451.9 677 454.6 675.9 454.6 674.8 450.8 673.6 450.8 670.4 448.6 665.4 448.6 664.9 448.1 660.5 448.1 657.1 449.2 656 450.3 656 453 655.5 453.5 654.4 453.5 652.2 450.8Z M647.8 505.6 649.5 505 650 506.7 648.4 507.2Z M670.9 479.5 672.5 479 676.4 482.8 676.4 483.9 673.6 484.4 673.1 485.5 672 485.5 670.9 484.4Z M650.5 472.5 651.1 472 657.1 472 657.7 474.1 656 475.2 655.5 476.8 653.3 476.8 652.8 474.7 651.1 474.1Z M686.3 469.8 688 469.2 688.5 470.9 686.9 471.4Z M680.2 469.8 681.9 469.2 682.5 470.9 680.8 471.4Z M664.9 466 667.6 466 670.4 468.2 670.4 472 669.2 473 666 473 663.8 471.4 663.2 467.6Z M675.9 464.9 679.1 461.7 680.8 461.7 681.4 464.4 683 465.4 683 466.5 682.5 467.1 676.4 467.1Z M651.1 460.6 653.3 460 656.6 463.8 656.6 464.9 656 465.4 651.1 465.4 650.5 464.9Z M666.5 455.1 668.7 454.6 670.9 455.1 672 456.2 674.8 455.1 675.3 456.8 673.6 457.3 671.5 460.6 669.8 460.6 669.2 457.9 667 457.3Z M658.2 456.2 660.5 455.1 664.3 454.6 665.4 458.9 664.3 460 661.5 460 658.2 457.3Z M630.2 442.1 629.1 443.2 629.1 444.3 629.6 444.8 631.3 467.1 631.9 467.6 631.9 472.5 632.4 473 632.4 477.9 633 478.5 633 483.9 633.5 484.4 634 494.2 634.6 494.7 634 497.4 633 497.4 632.4 495.8 631.3 495.8 631.9 501.2 630.8 501.8 633 523.5 634.6 523.5 635.1 521.3 636.2 521.3 637.4 522.4 637.4 523.5 648.4 523.5 648.9 522.4 653.9 522.4 654.4 523.5 656.6 523.5 657.1 522.4 659.4 522.4 659.9 523.5 690.1 523.5 690.1 515.9 686.3 515.9 686.9 517.5 686.9 521.3 686.3 521.8 684.6 521.3 683.5 518 681.4 518.6 681.4 520.7 680.2 521.8 674.8 521.8 674.2 521.3 670.9 521.8 668.7 520.7 668.1 518.6 666 518.6 664.9 515.9 663.8 515.9 662.1 518 659.4 518 658.8 515.9 656.6 515.3 655 515.9 655 518.6 655.5 519.1 655 520.7 648.9 520.2 648.4 521.3 646.7 521.3 646.1 519.7 647.8 519.1 647.8 515.3 646.7 515.3 646.1 518 644.5 517.5 644 515.3 637.4 515.3 636.8 515.9 636.8 518.6 636.2 519.1 634 518.6 633.5 515.9 633.5 511 634 510.4 644.5 510.4 644 504.5 643.4 503.9 643.4 499.1 642.9 498 641.2 498 639.5 496.3 639.5 491.5 639 490.9 639 486 637.9 480.6 635.1 448.1 635.7 447.6 648.9 447.6 648.9 444.8 647.8 442.1Z M632.4 506.7 634 506.1 634.6 507.7 633 508.3Z M637.4 499.1 639 498.5 639.5 500.1 637.9 500.7Z M606.9 442.2 606.4 444.9 606.9 445.4 609.2 445.4 609.2 442.7Z","rotulos":[["CENPES II (Petrobras)",608.1,384.4,2],["Centro de Tecnologia",870.8,477.9,2],["IEN (Engenharia Nuclear)",1035.4,470.5,2],["LabOceano",1180.2,232.8,3],["Estação Meteorológica",715.0,541.0,3],["Embratel",1067.4,292.0,3],["CENPES (Petrobras)",669.4,477.9,2],["CEPEL",594.0,474.4,2]]};
/* nomes no zoom pelo centro de cada lote do cadastro (o do CENPES ficava no lote vizinho, do CEPEL) */
EDIF.rotulos.forEach(function(r){BLDN.push(r)});
function edifPath(id,d){
  var g=document.createElementNS('http://www.w3.org/2000/svg','path');
  g.id=id;g.setAttribute('aria-hidden','true');g.setAttribute('d',d);return g;
}
function edifDraw(){
  var b=$('#baseimg');if(!b||$('#gEdif'))return;
  if(EDIF.apagar)b.appendChild(edifPath('gEdifFundo',EDIF.apagar));
  b.appendChild(edifPath('gEdif',EDIF.predios.map(function(p){return p[1]}).join('')));
}
aoFazer('mapa montado',edifDraw);
edifDraw();
/* ======================= Atalho para o Jaé (passagem dos ônibus, BRT e VLT da prefeitura) =======================
   O Jaé não tem serviço aberto para outros apps (saldo, recarga, QR Code) nem um link público que abra o app direto
   (como o wa.me do WhatsApp). Por isso o atalho leva à página do app oficial na loja do aparelho: lá aparece "Abrir"
   se o app já estiver instalado e "Instalar"/"Obter" se não estiver. No computador, mostra as duas lojas. */
var JAE_IOS='https://apps.apple.com/br/app/id6449981829';
var JAE_PLAY='https://play.google.com/store/apps/details?id=br.com.billingpay.app.pf';
function jaeAparelho(){
  var ua=navigator.userAgent;
  if(/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return 'ios';
  return /Android/.test(ua)?'android':'';
}
var JAE_IC='<svg class="lk-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M7 14.5h4"/></svg>';
function jaeLink(url,txt){return '<a class="copy jae-link" href="'+url+'" target="_blank" rel="noopener">'+JAE_IC+txt+'</a>'}
function jaeHTML(){
  var a=jaeAparelho();
  var botoes=a==='ios'?jaeLink(JAE_IOS,'Abrir ou baixar o Jaé'):a==='android'?jaeLink(JAE_PLAY,'Abrir ou baixar o Jaé'):
    jaeLink(JAE_PLAY,'Jaé no Google Play')+jaeLink(JAE_IOS,'Jaé na App Store');
  return '<div class="jae-box"><p class="small keep">Nos ônibus, BRT e VLT da prefeitura, a passagem é paga com o <b>Jaé</b>: cartão ou QR Code no app.</p>'+
    '<div class="jae-bt">'+botoes+'</div>'+(a?'<p class="muted small keep">Se o app já estiver instalado, a loja mostra o botão Abrir.</p>':'')+'</div>';
}
/* em Trajetos, logo depois de "Ônibus da cidade" (fora do bloco, que é redesenhado a cada minuto) */
function jaeTrajeto(){
  if(!plan||$('#jaebox'))return;
  var d=document.createElement('div');d.id='jaebox';d.innerHTML=jaeHTML();
  var x=$('#extbox');if(x)x.insertAdjacentElement('afterend',d);else plan.appendChild(d);
}
aoFazer('trajeto montado',jaeTrajeto);
jaeTrajeto();/* Trajetos já foi montado uma vez antes desta parte carregar */
/* no detalhe de um ponto da prefeitura */
aoFazer('detalhe montado',function(){
  if(state.sel&&state.sel.kind==='ext'&&detail&&!detail.querySelector('.jae-box'))detail.insertAdjacentHTML('beforeend',jaeHTML());
});
/* ======================= Seguir um ônibus da cidade, como num radar de voos =======================
   "Buscar ônibus" no mapa procura, entre os ônibus ao vivo, pela linha, pelo destino ou pelo número do carro.
   Tocar num ônibus da lista (ou direto no mapa) passa a segui-lo: o mapa acompanha o ônibus, desenha o caminho feito
   desde que começou a seguir e mostra o próximo ponto com o tempo estimado (perfil dos trechos quando há; senão,
   a velocidade informada e ~12 s em cada ponto). Arrastar o mapa pausa o acompanhamento; "Voltar ao ônibus" retoma.
   Só há posições na região do Fundão (o Worker filtra a área): fora dela, o card avisa que não há posição.
   O ônibus seguido fica guardado no aparelho por 30 min, para continuar depois de recarregar a página. */
var SEG={v:null,l:null,auto:true,rastro:[],timer:0,anim:0,ultT:0,salvo:0,preso:0};
var SEG_IC='<svg class="seg-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>';
function segNorm(s){return String(s||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Z0-9]/g,'')}
function segLinha(n){return EXT.lines.filter(function(L){return L.n===n})[0]||{n:n||'?',c:liveColor(n),st:[]}}
function segOnibus(v){return LIVE.bus.filter(function(o){return o.v===v})[0]||null}
function segIdade(s){return s<60?s+' s':Math.round(s/60)+' min'}
function segM(m){return m<1000?Math.max(10,Math.round(m/10)*10)+' m':(m/1000).toFixed(1).replace('.',',')+' km'}
function segQuando(t,m){return (t<20||m<120)?'chegando':t<60?'menos de 1 min':'~'+Math.round(t/60)+' min'}
/* a planta só cobre a Cidade Universitária; com as ruas ao redor (29-ruas-cidade.js), o mapa vai até onde há ônibus ao vivo */
function segNoMapa(S){if(!S||S.x==null)return false;var q=U([S.x,S.y]),B=limitesMapa(),m=40;return q[0]>=B.x-m&&q[0]<=B.x+B.w+m&&q[1]>=B.y-m&&q[1]<=B.y+B.h+m}
function segLonge(S){var c=U([724,405]),q=U([S.x,S.y]);return Math.hypot(q[0]-c[0],q[1]-c[1])/MPU}
function segSalva(){try{if(SEG.v)localStorage.setItem('cse-seguir',JSON.stringify({v:SEG.v,l:SEG.l,t:Date.now()}));else localStorage.removeItem('cse-seguir')}catch(e){}SEG.salvo=Date.now()}

/* botão, busca e card dentro do mapa */
(function(){
  var mw=document.querySelector('.mapwrap');if(!mw||!LIVE.url)return;
  mw.insertAdjacentHTML('beforeend','<button type="button" class="segbtn glass" id="segBtn" aria-expanded="false" aria-controls="segBusca">'+SEG_IC+'<span>Buscar ônibus</span></button>'+
    '<div class="segbusca glass" id="segBusca" role="dialog" aria-label="Buscar ônibus ao vivo" hidden></div>'+
    '<div class="segcard glass" id="segCard" role="region" aria-label="Ônibus seguido" hidden></div>'+
    '<button type="button" class="segseta" id="segSeta" aria-label="Ir até o ônibus seguido" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 16-7-4-7 4z"/></svg></button>');
  mw.addEventListener('click',function(e){
    var t=e.target;
    if(t.closest('#segBtn')){segBuscaAbre($('#segBusca').hidden);return}
    if(t.closest('#segFecha')){segBuscaAbre(false);$('#segBtn').focus();return}
    var r=t.closest('[data-segv]');if(r){segSeguir(r.dataset.segv);return}
    if(t.closest('#segX')){segPara();return}
    if(t.closest('#segVolta')||t.closest('#segSeta')){SEG.auto=true;segCard();var S=LV2.st[SEG.v];if(S&&S.x!=null)segPan(U([S.x,S.y]));return}
    var p=t.closest('[data-segpt]');if(p){select('ext',p.dataset.segpt,true);return}
  });
  mw.addEventListener('input',function(e){if(e.target.id==='segQ')segLista()});
  mw.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&!$('#segBusca').hidden){segBuscaAbre(false);$('#segBtn').focus()}
    if(e.key==='Enter'&&e.target.id==='segQ'){var r=$('#segLista [data-segv]');if(r){e.preventDefault();segSeguir(r.dataset.segv)}}
  });
  /* tocar num ônibus ao vivo no mapa passa a segui-lo (o card tem os horários do próximo ponto) */
  svg.addEventListener('click',function(e){if(suppressClick)return;var g=e.target.closest&&e.target.closest('.xlive');if(!g||!g.dataset.v)return;e.stopImmediatePropagation();segSeguir(g.dataset.v)},true);
  /* arrastar o mapa pausa o acompanhamento */
  svg.addEventListener('pointermove',function(){if(SEG.v&&SEG.auto&&svg.classList.contains('dragging')){SEG.auto=false;cancelAnimationFrame(SEG.anim);SEG.anim=0;segCard()}});
  svg.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var g=e.target.closest&&e.target.closest('.xlive');if(!g||!g.dataset.v)return;e.preventDefault();e.stopImmediatePropagation();segSeguir(g.dataset.v)},true);
})();

function segBuscaAbre(on){
  var p=$('#segBusca'),b=$('#segBtn');if(!p)return;
  if(on){
    if(!state.layers.ext)setLayer('ext',$('#chBus'));
    p.innerHTML='<div class="seg-bh"><label class="sr" for="segQ">Linha, destino ou número do carro</label><input id="segQ" type="search" placeholder="Linha, destino ou carro" autocomplete="off" enterkeyhint="search"><button type="button" class="seg-x" id="segFecha" aria-label="Fechar a busca">×</button></div>'+
      '<div id="segLista" class="seg-lista"></div><p class="seg-nota">Só aparecem os ônibus da cidade na região do Fundão.</p>';
    p.hidden=false;segLista();$('#segQ').focus({preventScroll:true});
  }else p.hidden=true;
  b.setAttribute('aria-expanded',String(!!on));segTimer();
}
function segLista(){
  var box=$('#segLista'),q=$('#segQ');if(!box)return;SEG.ultT=LIVE.t;
  if(!LIVE.t){box.innerHTML='<p class="seg-msg">'+(LIVE.err?'Ao vivo indisponível agora.':'Buscando ônibus ao vivo…')+'</p>';return}
  var Q=segNorm(q&&q.value),A=LIVE.bus.slice(),agora=Date.now();
  if(Q)A=A.filter(function(o){var L=segLinha(o.l);return segNorm(o.l).indexOf(Q)>=0||segNorm(o.v).indexOf(Q)>=0||segNorm(L.nm||L.d).indexOf(Q)>=0});
  A.sort(function(a,b){return a.l.localeCompare(b.l,'pt',{numeric:true})||a.v.localeCompare(b.v)});
  if(!A.length){box.innerHTML='<p class="seg-msg">'+(Q?'Nenhum ônibus com “'+esc(q.value.trim())+'” ao vivo agora.':'Nenhum ônibus ao vivo na região agora.')+'</p>';return}
  var top=box.scrollTop;
  box.innerHTML='<p class="seg-msg">'+A.length+' ônibus ao vivo'+(Q?' com “'+esc(q.value.trim())+'”':'')+'</p><ul>'+A.slice(0,40).map(function(o){var L=segLinha(o.l);
    return '<li><button type="button" class="seg-row'+(o.v===SEG.v?' on':'')+'" data-segv="'+esc(o.v)+'">'+extBadge(L)+'<span class="grow"><b>'+esc(L.nm||('Linha '+o.l))+'</b><small>Carro '+esc(o.v)+' · '+(o.vel>2?Math.round(o.vel)+' km/h':'parado')+' · há '+segIdade(Math.max(0,Math.round((agora-o.t)/1000)))+(LV2.st[o.v]&&!segNoMapa(LV2.st[o.v])?' · fora do mapa':'')+'</small></span></button></li>'}).join('')+'</ul>'+
    (A.length>40?'<p class="seg-msg">Digite a linha para ver os outros.</p>':'');
  box.scrollTop=top;
}

function segSeguir(v,semZoom){
  if(!v)return;
  if(!state.layers.ext)setLayer('ext',$('#chBus'));
  var o=segOnibus(v);if(v!==SEG.v)SEG.rastro=[];
  SEG.v=v;SEG.l=o?o.l:SEG.l;SEG.auto=true;segSalva();
  var p=$('#segBusca');if(p&&!p.hidden)segBuscaAbre(false);
  if(!semZoom){var b=box(),z=fitW/2.6;if(view.w>z){var c=centerMap();view.w=z;view.h=z*b.h/b.w;view.x=c[0]-z/2;view.y=c[1]-z/2*b.h/b.w}}
  var S=LV2.st[v];if(S&&S.x!=null)segPan(U([S.x,S.y]),true);else schedule();
  segTimer();segTick();
}
function segPara(){
  SEG.v=null;SEG.l=null;SEG.rastro=[];segSalva();cancelAnimationFrame(SEG.anim);SEG.anim=0;
  var g=$('#gSeg');if(g)g.remove();var sa=$('#segSeta');if(sa)sa.hidden=true;var G=$('#gLive');if(G)G.classList.remove('seg-modo');
  Array.prototype.forEach.call(document.querySelectorAll('#gLive .seg-on'),function(e){e.classList.remove('seg-on')});
  segCard();segTimer();
}
function segTimer(){
  var p=$('#segBusca'),on=!!SEG.v||!!(p&&!p.hidden);
  if(on&&!SEG.timer)SEG.timer=setInterval(segTick,500);
  if(!on&&SEG.timer){clearInterval(SEG.timer);SEG.timer=0}
}
function segTick(){
  if(document.hidden)return;
  var p=$('#segBusca');if(p&&!p.hidden&&LIVE.t!==SEG.ultT)segLista();
  if(!SEG.v)return;
  if(!state.layers.ext){segPara();return}
  segMarca();segRastro();segCamera();segCard();segSetaPos();
  if(Date.now()-SEG.salvo>30e3&&segOnibus(SEG.v))segSalva();
}
/* o ônibus seguido em destaque e por cima dos outros */
function segMarca(){
  var G=$('#gLive'),S=LV2.st[SEG.v];if(!G)return;G.classList.add('seg-modo');
  Array.prototype.forEach.call(G.querySelectorAll('.seg-on'),function(e){if(!S||e!==S.el)e.classList.remove('seg-on')});
  if(S&&S.el&&S.el.isConnected){S.el.classList.add('seg-on');if(S.el!==G.lastElementChild)G.appendChild(S.el)}
}
/* caminho feito desde que começou a seguir */
function segRastro(){
  var g=$('#gExt');if(!g)return;var S=LV2.st[SEG.v],R=SEG.rastro,el=$('#gSeg');
  if(S&&S.x!=null){var u=R[R.length-1];if(!u||Math.hypot(S.x-u[0],S.y-u[1])>1.5){R.push([+S.x.toFixed(1),+S.y.toFixed(1)]);if(R.length>1200)R.shift()}}
  if(!el){g.insertAdjacentHTML('afterbegin','<g id="gSeg" pointer-events="none"><path class="seg-rastro" vector-effect="non-scaling-stroke"/></g>');el=$('#gSeg')}
  el.style.setProperty('--sc',liveColor(SEG.l));
  el.firstChild.setAttribute('d',R.length>1?'M'+R.join('L'):'');
}
/* o mapa acompanha: quando o ônibus se afasta do centro, desliza até ele */
function segCamera(){
  if(!SEG.auto)return;
  if(svg.classList.contains('dragging')){SEG.auto=false;return}
  var S=LV2.st[SEG.v];if(!S||S.x==null||SEG.anim||Date.now()-SEG.preso<5000)return;
  var p=U([S.x,S.y]),cx=view.x+view.w/2,cy=view.y+view.h/2,m=Math.min(view.w,view.h)*0.14;
  if(Math.abs(p[0]-cx)>m||Math.abs(p[1]-cy)>m)segPan(p);
}
function segPan(p,ja){
  cancelAnimationFrame(SEG.anim);SEG.anim=0;
  var x0=view.x,y0=view.y,x1=p[0]-view.w/2,y1=p[1]-view.h/2,t0=performance.now(),D=(ja||matchMedia('(prefers-reduced-motion:reduce)').matches)?0:700;
  (function f(){
    if(svg.classList.contains('dragging')){SEG.anim=0;SEG.auto=false;segCard();return}
    var k=D?Math.min(1,(performance.now()-t0)/D):1,e=1-Math.pow(1-k,3);
    view.x=x0+(x1-x0)*e;view.y=y0+(y1-y0)*e;
    if(k<1){lastGesture=Date.now();applyView();SEG.anim=requestAnimationFrame(f)}
    else{SEG.anim=0;lastGesture=0;applyView();/* na borda do mapa não dá para centralizar: espera um pouco antes de tentar de novo */
      if(Math.hypot(view.x+view.w/2-p[0],view.y+view.h/2-p[1])>Math.min(view.w,view.h)*0.14)SEG.preso=Date.now()}
  })();
}
/* seta na borda do mapa quando o ônibus seguido está fora da tela */
function segSetaPos(){
  var a=$('#segSeta'),mw=document.querySelector('.mapwrap'),S=LV2.st[SEG.v];if(!a||!mw)return;
  var el=S&&S.el&&S.el.isConnected&&S.el.querySelector('.lv-dot');if(!el){a.hidden=true;return}
  var r=el.getBoundingClientRect(),m=mw.getBoundingClientRect(),x=r.left+r.width/2-m.left,y=r.top+r.height/2-m.top,M=26;
  if(x>=0&&x<=m.width&&y>=0&&y<=m.height){a.hidden=true;return}
  var cx=m.width/2,cy=m.height/2,dx=x-cx,dy=y-cy,k=Math.min((cx-M)/Math.abs(dx||1e-9),(cy-M)/Math.abs(dy||1e-9));
  a.style.left=(cx+dx*k)+'px';a.style.top=(cy+dy*k)+'px';a.style.setProperty('--rot',(Math.atan2(dx,-dy)*180/Math.PI).toFixed(0)+'deg');a.style.setProperty('--sc',liveColor(SEG.l));a.hidden=false;
}
/* próximo ponto à frente no traçado: os pontos com nome no Fundão; fora dele, o próximo ponto do GTFS */
function segProximo(S){
  var O=S.obs;if(!O||O.i==null||S.s==null||!SHP[O.i])return null;
  var sg=O.sign>0?1:-1,L=segLinha(SEG.l),best=null;
  (L.st||[]).forEach(function(x){var G=EXTS[x[0]];if(!G)return;var r=projOn(O.i,G.p);if(!r||r.d>60*MPU)return;
    var m=(r.s-S.s)*sg/MPU;if(m>20&&m<8000&&(!best||m<best.m))best={m:m,g:x[0],nome:G.name}});
  var st=SHP[O.i].st||[];
  if(!best)for(var j=0;j<st.length;j++){var m=(st[j]-S.s)*sg/MPU;if(m>20&&(!best||m<best.m))best={m:m,g:null,nome:null}}
  if(best)best.t=segTempo(O,S.s,best.m);
  return best;
}
/* tempo até lá: trecho a trecho, a velocidade do perfil (dias úteis); onde não há perfil, a informada e ~12 s por ponto */
function segTempo(O,s0,m){
  var P=LV_PERF,agora=Date.now(),v0=lvV(O),vf=v0>2?v0:5,tr=lvmTracado(O.i),A=null,sg=O.sign>0?1:-1;
  if(P&&tr!=null&&lvDiaUtil(agora)){var per=lvPeriodo(agora);if(per&&P.periodos[per])A=P.p[tr+'|'+sg+'|'+per]||null}
  var T=0,pos=s0/MPU,falta=m,semPerfil=0,tm=(P&&P.trecho_m)||60;
  while(falta>0){var d=Math.min(20,falta),v=A?A[1][Math.floor(pos/tm)-A[0]]:null,vv;
    if(v!=null&&v>=0)vv=v/10;else{vv=vf;semPerfil+=d}
    T+=d/Math.max(1.5,vv);pos+=sg*d;falta-=d}
  if(semPerfil>m/2){var st=SHP[O.i].st||[],n=0;st.forEach(function(x){var k=(x-s0)*sg/MPU;if(k>LV_PONTO_IGNORA&&k<m-20)n++});T+=n*LV_PONTO_S}
  return T;
}
function segCard(){
  var c=$('#segCard'),mw=document.querySelector('.mapwrap');if(!c)return;
  if(!SEG.v){c.hidden=true;c.innerHTML='';if(mw)mw.classList.remove('seguindo');return}
  if(mw)mw.classList.add('seguindo');c.hidden=false;
  var o=segOnibus(SEG.v),L=segLinha(SEG.l||(o&&o.l)),S=LV2.st[SEG.v],h;
  if(!c.firstChild){
    c.innerHTML='<div class="seg-top"><span id="segBadge"></span><span class="grow"><b id="segNome"></b><small id="segCarro"></small></span><button type="button" class="seg-x" id="segX" aria-label="Parar de seguir">×</button></div><div id="segInfo"></div>'+
      '<button type="button" class="seg-volta" id="segVolta" hidden>Voltar ao ônibus</button>';
  }
  var bd=extBadge(L);if($('#segBadge').innerHTML!==bd)$('#segBadge').innerHTML=bd;
  $('#segNome').textContent=L.nm||('Linha '+L.n);$('#segCarro').textContent='Carro '+SEG.v+(SEG.auto?' · seguindo':' · seguir pausado');
  if(!LIVE.t)h='<p>Buscando a posição…</p>';
  else if(!o||!S)h='<p>Sem posição deste ônibus agora. Ele pode ter saído da região do Fundão ou parado de enviar sinal.</p>';
  else{
    h=(segNoMapa(S)?'':'<p><b>Fora da área do mapa</b>, a '+segM(segLonge(S))+' do centro da Cidade Universitária. A seta na borda mostra para onde.</p>')+'<p>'+(o.vel>2?Math.round(o.vel)+' km/h':'Parado')+' · posição de '+segIdade(Math.max(0,Math.round((Date.now()-o.t)/1000)))+' atrás, ajustada pela velocidade</p>';
    var nx=segProximo(S);
    if(nx)h+='<p><b>Próximo ponto'+(nx.nome?': '+esc(nx.nome):'')+'</b> · '+segM(nx.m)+' · '+segQuando(nx.t,nx.m)+'</p>'+(nx.g?'<button type="button" class="linkbtn seg-pt" data-segpt="'+esc(nx.g)+'">Horários deste ponto</button>':'');
    else if(S.i==null)h+='<p class="seg-nota">Fora do traçado da linha: sem estimativa de chegada.</p>';
  }
  var inf=$('#segInfo');if(inf.innerHTML!==h)inf.innerHTML=h;
  $('#segVolta').hidden=SEG.auto;
}
/* continua seguindo depois de recarregar (até 30 min) */
(function(){try{var s=JSON.parse(localStorage.getItem('cse-seguir')||'null');
  if(s&&s.v&&Date.now()-s.t<30*60e3&&LIVE.url){SEG.l=s.l;setTimeout(function(){segSeguir(s.v)},0)}else if(s)localStorage.removeItem('cse-seguir')}catch(e){}})();
/* ======================= Esboço das ruas ao redor da ilha, só com "Ônibus da cidade" ligado =======================
   Os ônibus da cidade fora da ilha (Maré, Bonsucesso, Penha, Ilha do Governador…) apareciam soltos no escuro, porque
   a planta só cobre a Cidade Universitária. Com a camada ligada, o mapa desenha por baixo deles um esboço das vias
   (OpenStreetMap, gerado por tools/ruas_cidade.py em ruas-cidade.json) e deixa arrastar até a área do ao vivo.
   Dentro da ilha nada muda: lá vale a planta. Sem a camada, o arquivo nem é baixado. */
var RUAS={d:null,carregando:false,svg:'',box:null};
/* área do ao vivo (a mesma do Worker em worker/gps-fundao.js) */
var RUAS_AREA=[-22.885,-43.27,-22.825,-43.195];
function ruasCarrega(){
  if(RUAS.d||RUAS.carregando||!window.fetch)return;RUAS.carregando=true;
  fetch('ruas-cidade.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).then(function(o){
    RUAS.carregando=false;if(o&&o.c){RUAS.d=o;RUAS.svg='';ruasDesenha()}
  },function(){RUAS.carregando=false});
}
function ruasMonta(){
  var C=RUAS.d.c,h='',f=function(v){return v.toFixed(1)};
  ['m','c','b','a'].forEach(function(k){var d='';(C[k]||[]).forEach(function(L){var la=0,lo=0;
      for(var i=0;i<L.length;i+=2){la+=L[i];lo+=L[i+1];var p=ll2map(la/1e5,lo/1e5);d+=(i?'L':'M')+f(p[0])+' '+f(p[1])}});
    if(d)h+='<path class="rua '+k+'" vector-effect="non-scaling-stroke" d="'+d+'"/>'});
  (RUAS.d.n||[]).forEach(function(n){var a=ll2map(n[1]/1e5,n[2]/1e5),b=ll2map(n[3]/1e5,n[4]/1e5),ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI+(ROT||0);
    ang=((ang%360)+540)%360-180;if(ang>90)ang-=180;if(ang<-90)ang+=180;ang-=(ROT||0);
    h+='<text class="rua-n" x="'+f(a[0])+'" y="'+f(a[1])+'" transform="rotate('+ang.toFixed(0)+' '+f(a[0])+' '+f(a[1])+')">'+esc(n[0])+'</text>'});
  return h;
}
function ruasCaixa(){
  var A=RUAS_AREA,P=[[A[0],A[1]],[A[0],A[3]],[A[2],A[1]],[A[2],A[3]]].map(function(q){return U(ll2map(q[0],q[1]))}),
      xs=P.map(function(p){return p[0]}),ys=P.map(function(p){return p[1]}),x0=Math.min.apply(0,xs),y0=Math.min.apply(0,ys);
  return {x:x0,y:y0,w:Math.max.apply(0,xs)-x0,h:Math.max.apply(0,ys)-y0};
}
function ruasDesenha(){
  var W=$('#world'),g=$('#gRuas'),on=!!state.layers.ext,at=$('#ruasFonte');
  if(at)at.hidden=!(on&&RUAS.d);
  if(!on){if(g)g.classList.add('off');return}
  ruasCarrega();if(!RUAS.d||!W)return;
  if(!g){if(!RUAS.svg)RUAS.svg=ruasMonta();W.insertAdjacentHTML('afterbegin','<g id="gRuas" pointer-events="none" aria-hidden="true">'+RUAS.svg+'</g>');g=$('#gRuas')}
  g.classList.remove('off');
}
/* com a camada ligada, dá para arrastar o mapa até a área do ao vivo */
LIMITES_EXTRA.push(function(){if(!state.layers.ext||!RUAS.d)return null;if(!RUAS.box)RUAS.box=ruasCaixa();return RUAS.box});
aoFazer('mapa vai montar',function(){RUAS.svg='';RUAS.box=null});/* a calibração do mapa pode ter mudado */
aoFazer('mapa montado',ruasDesenha);
aoFazer('mapa atualizado',ruasDesenha);
(function(){var mw=document.querySelector('.mapwrap');if(mw)mw.insertAdjacentHTML('beforeend','<p class="ruas-fonte" id="ruasFonte" hidden><span class="rf-l">Ruas ao redor: </span>© <span class="rf-l">colaboradores do </span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></p>')})();
ruasDesenha();
/* ======================= Início: a aba pedida no endereço =======================
   Fica por último, depois que todas as partes carregaram: abrir uma aba desenha a tela inteira dela
   (Lugares, por exemplo, usa o Wi-Fi e o eduroam, definidos em partes posteriores). Abrir antes disso
   fazia o app parar no meio da carga quando o endereço terminava em #predios. */
if(location.hash==='#siglas')setTimeout(function(){if(cover.hidden&&login.hidden)openGloss()},0);
setTab(location.hash.slice(1));
})();
