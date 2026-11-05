(function(){
'use strict';
var FBMODE=!!(window.CSE_FIREBASE&&window.CSE_FIREBASE.apiKey&&window.CSE_FIREBASE.projectId)&&!(window.claude&&typeof window.claude.use==='function');
var LITE=(function(){try{return window.matchMedia('(pointer:coarse), (max-width:820px)').matches||(navigator.hardwareConcurrency||8)<=4||!!(navigator.connection&&navigator.connection.saveData)}catch(e){return false}})();
document.documentElement.classList.toggle('lite',LITE);
var CFG={cover:'folha',banner:true,reps:true,coverToday:true,login:true,flow:true,bg:'brilho',font:'aparelho',fsize:'m',tema:'sistema',bussola:false,foto:true,perf:'auto',perfV:0,bldn:true,simples:true,simplesV:0,tabs:null,tabsOff:null,bussolaAlvo:'destino',autoDest:true,clima:true,chuva:true,faixa:10,faixaV:0};
try{var _c=JSON.parse(localStorage.getItem('cse-cfg'));if(_c)CFG=Object.assign(CFG,_c)}catch(e){}
/* desempenho: automático, leve (sem transparência nem efeitos), intermediário (o antigo "completo") e completo
   (intermediário + vidro e animações em Ajustes, glossário e gestão). Automático: computador = completo; o resto = intermediário. */
var LITE_AUTO=LITE;
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
  if(e==='leve')r.classList.remove('refract');
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
    '<div><p class="small muted" id="eduprog">'+n+' de '+EDU.length+' passos feitos</p><div class="progress" aria-hidden="true"><i style="width:'+(n/EDU.length*100)+'%"></i></div></div>'+
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
function savePrefs(){try{localStorage.setItem(PKEY,JSON.stringify({from:state.from,to:state.to}))}catch(e){}}
/* a rede pode ter sido removida pela gestão enquanto a tela ainda mostra o ponto: nunca quebre por isso */
function avgOf(id){var w=WIFI[id];if(!w)return 0;var m=mine[id];return m?(w.avg*w.votes+m)/(w.votes+1):w.avg}
function votesOf(id){var w=WIFI[id];if(!w)return 0;return w.votes+(mine[id]?1:0)}
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
var MAPSUF=(function(){try{var t=(JSON.parse(localStorage.getItem('cse-cfg')||'{}')||{}).tema||'sistema';if(t==='claro')return '-claro';if(t==='escuro'||t==='horario')return '';return window.matchMedia('(prefers-color-scheme: light)').matches?'-claro':''}catch(e){return ''}})();
var MAPIMG='mapa-bordas'+MAPSUF+'.jpg';
/* mapa base: planta cadastral da Cidade Universitária (ETU/UFRJ), vetorizada; JPG para a visão geral, SVG nítido no zoom */
var MAPHD=window.MAPHD_URL='mapa-campus'+MAPSUF+'.jpg',MAPVEC='mapa-campus'+MAPSUF+'.svg',MAPMINI='mapa-mini'+MAPSUF+'.jpg',MAPBLUR='mapa-blur'+MAPSUF+'.jpg',MAPVEC0='mapa-campus.svg';
/* nomes recriados como texto: [texto, x, y, classe, nível de zoom, rotação] */
var MAPLABELS=[
  ['Baía de Guanabara',720,232,'ml-w',1,0],
  ['Parque do Catalão',560,98,'ml-a',2,0],['Ilha do Bom Jesus',1046,58,'ml-a',2,0],['Vila Residencial',1258,376,'ml-a',2,0],
  ['Av. Horácio Macedo',560,412,'ml-s',2,0],['Av. Horácio Macedo',938,412,'ml-s',2,0],['Av. Pedro Calmon',997,470,'ml-s',2,-90],
  ['Av. Carlos Chagas Filho',418,250,'ml-s',2,-90],['Rua César Pernetta',314,262,'ml-s',2,-90],['Largo Wanda de Oliveira',405,155,'ml-s',2,0],
  ['Rua Paulo Emídio Barbosa',1150,316,'ml-s',2,0],['Rua Pascoal Lemme',1061,282,'ml-s',3,-90],['Rua Moniz de Aragão',900,508,'ml-s',2,0],
  ['Pç. Giulio Massarani',803,399,'ml-s',2,0],['Linha Vermelha',560,556,'ml-s',2,17],['Rua Octávio Cantanhede',500,52,'ml-s',3,-26],
  ['Alojamento',402,120,'ml-b',2,0],['Bio-Rio',372,176,'ml-b',3,0],['Usina Verde',331,236,'ml-b',3,0],['CCS',381,300,'ml-b',2,0],
  ['IPPMG',283,347,'ml-b',3,0],['HU',352,374,'ml-b',2,0],['EEFD',464,282,'ml-b',2,0],['RU',452,364,'ml-b',3,0],
  ['Prefeitura',438,462,'ml-b',2,0],['CEPEL',587,452,'ml-b',2,0],['CENPES',691,470,'ml-b',2,0],['Cenpes II',678,372,'ml-b',3,0],
  ['IF',752,446,'ml-b',3,0],['CCMN',787,488,'ml-b',2,0],['CT',855,470,'ml-b',2,0],['IMA',958,450,'ml-b',3,0],
  ['Letras',962,396,'ml-b',2,0],['Reitoria',1045,392,'ml-b',2,0],['Xistoquímica',1011,552,'ml-b',3,0],['IEN',1028,474,'ml-b',3,0],
  ['CETEM',1024,276,'ml-b',2,0],['COPPEAD',1030,236,'ml-b',2,0],['Parque Tecnológico',1200,262,'ml-b',2,0],
  ['Incubadora',1112,345,'ml-b',3,0],['Gráfica',1165,345,'ml-b',3,0]
];
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
  $('#mapbase').innerHTML='<g id="world0" transform="rotate('+ROT+')"><g id="baseimg"'+(window.__opac?' style="opacity:'+window.__opac+'"':'')+'><image href="'+MAPIMG+'" x="-270" y="-340" width="2034" height="1300" preserveAspectRatio="none" decoding="async"/><image id="imgHD" href="'+MAPHD+'" x="109" y="-45" width="1233" height="701" preserveAspectRatio="none" decoding="async"/><image id="imgVec"'+(vecOn?' href="'+MAPVEC+'"':'')+' x="109" y="-45" width="1233" height="701" preserveAspectRatio="none"/></g></g>';
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
}

/* ---------- zoom e arrasto ---------- */
function box(){var r=svg.getBoundingClientRect();return {l:r.left,t:r.top,w:Math.max(1,r.width),h:Math.max(1,r.height)}}
function clampView(){
  var b=box(),minW=b.w/7;
  view.w=Math.max(minW,Math.min(fitW,view.w));view.h=view.w*b.h/b.w;
  var cx=view.x+view.w/2,cy=view.y+view.h/2;
  var B=bounds();cx=Math.max(B.x,Math.min(B.x+B.w,cx));cy=Math.max(B.y,Math.min(B.y+B.h,cy));
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
  if(gLab){clearTimeout(lblT);if(Date.now()-lastGesture<160)lblT=setTimeout(drawLabels,170);else drawLabels()}
}
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
  svg.addEventListener('wheel',function(e){e.preventDefault();lastGesture=Date.now();zoomAt(toMap(e.clientX,e.clientY),Math.exp(-e.deltaY*(e.deltaMode===1?0.05:0.0016)))},{passive:false});
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
var BLDN=[["Hospital Universitário",325.7,364,1],["IPPMG (Pediatria)",279.9,370,2],["CCS",352.6,290.8,1],["Instituto de Microbiologia",324.9,274,3],["Escola de Educação Infantil",272.9,345.2,3],["Usina Verde",362.3,235.3,3],["Polo Bio-Rio",377.5,192.6,2],["RU Central",424.4,330.8,1],["EEFD",428.2,302.6,1],["Ginásio",450.8,293.6,3],["Gastronomia",459.3,327.3,3],["Prefeitura · DISEG",417.4,449.2,1],["Horto Universitário",435,461.4,3],["CENPES (Petrobras)",606.9,480.1,2],["Instituto de Física",750.6,447,2],["Instituto de Química",749.5,396,2],["Instituto de Matemática",753.5,467.9,2],["CCMN",765,501.4,1],["CT 2",936.5,558.2,2],["Macromoléculas",938.2,457,3],["LNDC",961.4,460,3],["Polo de Xistoquímica",1000.4,553.4,2],["Faculdade de Letras",940,379.9,1],["CCJE",908.2,386.2,2],["Reitoria (CLA)",1013.5,367.7,1],["COPPEAD",1027.5,226,1],["Incubadora",1119.3,336.2,2],["Gráfica",1142.3,337.2,3],["Almoxarifado",1172.3,335.9,3],["Frota Oficial",1168.1,355.1,3],["CPST · EBA",1148.4,362,3],["DIPRO",423.9,83.6,2],["UFRJ-Mar",469.3,45.6,3],["Escola Tenente Antônio João",1020.9,213.3,3]];
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
  drawLabels();
}

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
    '<h3>Telefones da segurança</h3><div class="calls">'+CALLS.map(function(c){
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
    (m?'<p class="muted small">Sua nota: '+m+'. '+(SH.on&&SH.uid&&!SH.denied?'Entra na média de todos.':'Salva só neste aparelho.')+'</p>':'')+(SH.on&&(SH.denied||SH.write===false)?'<p class="muted small">'+(FBMODE?'Para sua nota contar na média, entre com Google ou e-mail em Ajustes › Conta.':'Para sua nota contar na média, o dono da página precisa te dar acesso de colaborador.')+'</p>':'')+'</div>'+
    '<button class="item tint" type="button" style="--c:var(--good)" data-kind="guide" data-id="eduroam"><span class="lb" style="--c:var(--good)">Wi-Fi</span><span class="grow">Prefira o eduroam<small>Rede segura com o login da UFRJ. Veja como conectar.</small></span></button>'+
    (ss.length?'<h3>Paradas por perto</h3><div class="list">'+ss.map(stopItem).join('')+'</div>':'');
}
function renderDetail(focusSel){
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
}
function renderAll(){renderPlan();renderDetail();updateMap()}
function select(kind,id,scroll){
  state.sel={kind:kind,id:id};
  renderAll();
  if(kind==='svc'&&SVCMAP[id])ensureVisible(SVCMAP[id].p);else if(kind==='stop'&&STOPS[id])ensureVisible(STOPS[id].p);else if(kind==='wifi'&&WIFI[id])ensureVisible(WIFI[id].p);else if(kind==='guard'&&GUARDS[id])ensureVisible(GUARDS[id].p);else if(kind==='night'&&STOPS[state.nightFrom])ensureVisible(STOPS[state.nightFrom].p);
  if(scroll&&window.matchMedia('(max-width:859px)').matches){
    detail.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
  }
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
  state.layers[key]=!state.layers[key];if(key==='wifi'){try{localStorage.setItem('cse-lay-wifi',state.layers.wifi?'1':'0')}catch(e){}if(!state.layers.wifi)wifiPopClose()}
  btn.setAttribute('aria-pressed',String(state.layers[key]));
  if(state.sel&&(((state.sel.kind==='stop'||state.sel.kind==='line')&&!state.layers.bus)||(state.sel.kind==='wifi'&&!state.layers.wifi)||(state.sel.kind==='svc'&&!state.layers.svc)))state.sel=null;
  renderAll();
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
avgOf=function(id){
  var w=WIFI[id];
  if(SH.on){var v=SH.votes[id];if(v&&v.n)return v.s/v.n;return w?w.avg:0}
  if(!w)return 0;
  var m=mine[id];return m?(w.avg*w.votes+m)/(w.votes+1):w.avg;
};
votesOf=function(id){
  var w=WIFI[id];
  if(SH.on){var v=SH.votes[id];return v&&v.n?v.n:(w?w.votes:0)}
  if(!w)return 0;
  return w.votes+(mine[id]?1:0);
};
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
function gradeList(){return GRADE&&GRADE.length?GRADE:GEX}
function usingExample(){return !(GRADE&&GRADE.length)}
function saveGrade(){
  try{localStorage.setItem(GKEY,JSON.stringify(GRADE||[]))}catch(e){}
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
var WK=null;
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
var CATS=[['todos','Todos'],['aberto','Abertos agora'],['comida','Alimentação'],['biblio','Bibliotecas'],['atend','Atendimento'],['seg','Segurança'],['onibus','Ônibus']];
var pstate={bld:'ct',pl:'b_ct',cat:'todos',q:''};
function hm(m){m=Math.round(m);if(m>=1440)m=1439;var h=Math.floor(m/60),x=m%60;return h+'h'+(x?String(x).padStart(2,'0'):'')}
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
  var we=isWeekend()&&!state.manual;
  return '<div class="plcard"><div class="plc-h"><div><p class="eyebrow">'+({comida:'Alimentação',biblio:'Biblioteca',atend:'Atendimento',seg:'Segurança',onibus:'Ônibus',aula:'Sua aula'})[it.cat]+'</p><h3 class="plc-t">'+it.name+'</h3></div>'+pill(statusOf(it,now))+'</div>'+
    '<dl class="kv"><dt>Onde</dt><dd>'+it.where+'</dd><dt>Seg. a sex.</dt><dd class="mono">'+rangesTxt(it.wk,it.incl)+'</dd><dt>Fim de semana</dt><dd class="mono">'+rangesTxt(it.we===undefined?'unk':it.we)+'</dd></dl>'+
    (it.note?'<p class="muted small">'+it.note+'</p>':'')+
    (bare?'':'<div class="later">'+(it.p&&!it.bld?'<button class="copy" type="button" data-showmap="'+id+'">Ver no mapa</button>':'')+(it.line?'<button class="copy" type="button" data-showline="'+it.line+'">Ver itinerário</button>':'')+'</div>')+'</div>';
}
function floorName(f){return f===null?'Andar não informado':f===0?'Térreo · salas 0xx':f+'º andar'}
function buildingHTML(now){
  var B=BLD[pstate.bld],items=Object.keys(PL).filter(function(k){return PL[k].bld===pstate.bld&&PL[k].b});
  var rows=B.rows.slice();items.forEach(function(k){var f=PL[k].f;if(f!==null&&rows.indexOf(f)<0)rows.push(f)});rows=rows.filter(function(f){return f!==null}).sort(function(a,b){return b-a});
  if(items.some(function(k){return PL[k].f===null}))rows.push(null);
  var blocks=B.blocks.slice();items.forEach(function(k){if(blocks.indexOf(PL[k].b)<0)blocks.push(PL[k].b)});
  blocks.sort(function(a,b){var o=function(x){return x==='?'?99:x==='ABC'?50:x.charCodeAt(0)};return o(a)-o(b)});
  B={name:B.name,short:B.short,addr:B.addr,labels:B.labels,note:B.note,blocks:blocks};
  var cols=B.blocks.length;
  var g='<div class="fgrid" style="--cols:'+cols+'" role="grid" aria-label="Esquema por blocos e andares do '+B.short+'">';
  g+='<div class="fh"></div>'+B.blocks.map(function(b){return '<div class="fh blk">'+(B.labels[b]||'Bloco '+b)+'</div>'}).join('');
  rows.forEach(function(f){
    g+='<div class="fl">'+floorName(f)+'</div>';
    B.blocks.forEach(function(b){
      var here=items.filter(function(k){return PL[k].b===b&&PL[k].f===f});
      g+='<div class="cell'+(here.length?' has':'')+'">'+here.map(function(k){
        var s=PL[k].cat==='aula'?{c:'aula'}:statusOf(PL[k],now);
        return '<button type="button" class="pin '+s.c+(pstate.pl===k?' on':'')+'" data-pl="'+k+'" title="'+PL[k].name+'"><i></i><span>'+(PL[k].s||PL[k].name)+'</span></button>';
      }).join('')+'</div>';
    });
  });
  g+='</div>';
  var sel=PL[pstate.pl]?pstate.pl:items[0];pstate.pl=sel;
  return '<div><p class="eyebrow">Mapa interno · esquema por blocos e andares</p><h2>Prédios por dentro</h2></div>'+
    '<div class="chips" role="group" aria-label="Escolha o prédio">'+Object.keys(BLD).map(function(k){return '<button class="chip" type="button" data-bld="'+k+'" aria-pressed="'+(k===pstate.bld)+'">'+BLD[k].short+'</button>'}).join('')+'</div>'+
    '<p class="small"><b>'+B.name+'</b> · <span class="mono muted">'+B.addr+'</span></p>'+
    '<div class="fwrap">'+g+'</div>'+
    '<div class="flegend"><span><i class="pin-dot good"></i>Aberto</span><span><i class="pin-dot warn"></i>Fecha logo / sem horário</span><span><i class="pin-dot bad"></i>Fechado</span></div>'+
    placeCard(sel,now)+planHTML(sel)+
    '<p class="muted small">'+B.note+' Esquema montado com as localizações oficiais (bloco, andar e sala); não é a planta arquitetônica. Quando a fonte só dá a sala, o andar sai do número (sala 527 → 5º andar).</p>';
}
function hoursHTML(now){
  var q=pstate.q.trim().toLowerCase();
  var list=Object.keys(PL).filter(function(k){
    var it=PL[k];if(it.cat==='aula')return false;
    if(pstate.cat==='aberto'){var s=statusOf(it,now);if(s.c==='bad'||/Confirmar|Sem horário/.test(s.t))return false}
    else if(pstate.cat!=='todos'&&it.cat!==pstate.cat)return false;
    if(q&&(it.name+' '+it.where).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  var ordem={comida:0,biblio:1,atend:2,seg:3,onibus:4};
  list.sort(function(a,b){return ordem[PL[a].cat]-ordem[PL[b].cat]});
  return '<div><p class="eyebrow">Hoje, '+(isWeekend()&&!state.manual?'fim de semana':'dia útil')+' · '+fmt(now)+'</p><h2>Horários de funcionamento</h2></div>'+
    '<div class="chips" role="group" aria-label="Filtrar">'+CATS.map(function(c){return '<button class="chip" type="button" data-cat="'+c[0]+'" aria-pressed="'+(pstate.cat===c[0])+'">'+c[1]+'</button>'}).join('')+'</div>'+
    '<label class="fld">Buscar local<input type="search" id="hq" placeholder="Ex.: biblioteca, RU, Bloco A" value="'+pstate.q.replace(/"/g,'&quot;')+'"></label>'+
    '<div class="hlist">'+(list.length?list.map(function(k){
      var it=PL[k],s=statusOf(it,now),we=isWeekend()&&!state.manual;
      return '<button class="hrow" type="button" data-pl="'+k+'"><span class="grow"><b>'+it.name+'</b><small>'+it.where+'</small></span><span class="htime mono">'+(it.wk===null?'Sem horário':rangesTxt(rangesOf(it,we),it.incl))+'</span>'+pill(s)+(RUS.indexOf(k)>=0&&filaOf(k)?filaPill(k):'')+'</button>';
    }).join(''):'<p class="muted">Nenhum local encontrado com esse filtro.</p>')+'</div>'+
    '<p class="muted small">Horários de dias úteis informados pela UFRJ; nas férias e nos feriados podem mudar.</p>';
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
  if(pPane.hidden)return;
  var now=nowMin();
  pB.innerHTML=buildingHTML(now);pH.innerHTML=hoursHTML(now);
  var pw=pPane.querySelector('.planwrap'),pin=pw&&pw.querySelector('.pl-pin');
  if(pin){var a=pin.getBoundingClientRect(),b=pw.getBoundingClientRect();pw.scrollLeft+=a.left+a.width/2-(b.left+b.width/2)}
  if(focusSel){var el=pPane.querySelector(focusSel);if(el){el.focus({preventScroll:true});if(el.id==='hq'){var v=el.value;el.setSelectionRange(v.length,v.length)}}}
}
function setTab(t){
  if(t==='cfg'){openCfg();return}
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
function movedFrom(iso){return mudancas().filter(function(m){return m.de===iso})[0]||null}
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
function saveCfg(){try{localStorage.setItem('cse-cfg',JSON.stringify(CFG))}catch(e){}}
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
  if(focusSel){var el=document.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
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
}
function rebuildAll(){
  applyG();
  if(state.sel&&state.sel.kind==='wifi'&&!WIFI[state.sel.id])state.sel=null;
  buildMap();updateMap();drawShared();applyView(true);renderPlan();refreshAll();
  if(!pPane.hidden)renderPredios();
  if(gestM&&!gestM.hidden)renderGest();
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
  return '<div class="fila-r'+(open?' open':'')+'"><div class="fila-top"><span class="grow"><b>'+esc(it.name)+'</b><small>'+(f?f.count+(f.count>1?' avisos':' aviso')+' · último '+agoTxt(f.last):esc(st.t))+'</small></span>'+filaPill(k)+
    (ok?'<button type="button" class="copy" data-filaopen="'+k+'" aria-expanded="'+open+'">'+(open?'Cancelar':'Informar')+'</button>':'')+'</div>'+
    (open?'<div class="fila-pick" role="group" aria-label="Tamanho da fila no '+esc(it.name)+'">'+FILA_N.map(function(L,i){return '<button type="button" class="fila-b '+L[2]+'" data-fila="'+k+'" data-n="'+i+'"><b>'+L[0]+'</b><small>'+L[1]+'</small></button>'}).join('')+'</div>':'')+
  '</div>';
}
function filaHTML(){
  var now=nowMin(),why='';
  if(SH.on&&blocked(SH.uid))why='Sua conta não pode informar filas no momento (decisão da gestão).';
  else if(SH.on&&FBMODE&&SH.full&&GESTOR!==true)why=fullMsg('informar a fila');
  else if(SH.on&&(SH.denied||SH.write===false))why=FBMODE?'Você pode ver as filas. Para informar, entre com Google ou e-mail em Ajustes › Conta.':'Você pode ver as filas. Para informar, o dono da página precisa te dar acesso de colaborador.';
  return '<div class="filabox" id="filabox"><div class="plc-h"><div><p class="eyebrow">Ao vivo · últimos 45 min</p><h3 class="plc-t">Fila do RU agora</h3></div>'+(SH.on?'<span class="pill good">Compartilhado</span>':'<span class="pill warn">Só neste aparelho</span>')+'</div>'+
    '<div class="fila-l">'+RUS.map(function(k){return filaRow(k,now)}).join('')+'</div>'+
    (filaMsg?'<p class="small fila-ok" role="status">'+esc(filaMsg)+'</p>':'')+
    '<p class="muted small">'+(why||'Está na fila? Toque em Informar e escolha o tamanho. Seu nome não aparece, e os avisos mais recentes pesam mais.')+'</p></div>';
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
var _renderCfg=renderCfg;
renderCfg=function(f){_renderCfg(f);var R=$('#cfgR');if(R&&!R.querySelector('.reqsec')){R.insertAdjacentHTML('beforeend','<div class="reqsec">'+myReqHTML()+'</div>')}};
var _placeCard=placeCard;
placeCard=function(id,now,bare){
  var s=_placeCard(id,now,bare);if(!s)return s;
  var extra='';
  if(RUS.indexOf(id)>=0)extra+='<div class="fila-in"><p class="small"><b>Fila agora</b></p>'+filaRow(id,now)+'</div>';
  if(PL[id]&&PL[id].fechadoTemp)extra+='<div class="warnbox"><b>Fechado temporariamente</b>Informado pela gestão do app.</div>';
  extra+='<button type="button" class="linkbtn sugg" data-req="servico||'+esc(PL[id].name)+'">Sugerir correção</button>';
  return s.slice(0,-6)+extra+'</div>';
};
var _renderDetail=renderDetail;
renderDetail=function(f){
  _renderDetail(f);var s=state.sel;if(!s)return;var t=null,a='';
  if(s.kind==='stop'&&STOPS[s.id]){t='ponto';a='Ponto '+STOPS[s.id].name}
  else if(s.kind==='line'&&LINES[s.id]){t='onibus';a='Linha '+s.id+' · '+LINES[s.id].name}
  else if(s.kind==='wifi'&&WIFI[s.id]){t='wifi';a='Wi-Fi '+WIFI[s.id].name}
  if(t)detail.insertAdjacentHTML('beforeend','<button type="button" class="linkbtn sugg" data-req="'+t+'||'+esc(a)+'">Sugerir correção</button>');
};
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
  }
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
  var role=GESTOR===true&&FBMODE?'Você é gestor porque seu e-mail está na coleção gestores do Firebase. Para incluir outro gestor, crie lá um documento com o e-mail dele.':GESTOR===true?'Você é gestor porque tem acesso de editor a esta página. Para incluir outro gestor, compartilhe com acesso de editor.':'Modo demonstração: aberto fora do claude.ai, as mudanças ficam só neste aparelho.';
  $('#gRole').textContent=role;
  var pend=allReqs().filter(function(r){var s=reqStatus(r.id).st;return s==='nova'||s==='analise'}).length;
  $('#gNav').innerHTML=GTABS.map(function(t){return '<button type="button" class="gtab" data-gtab="'+t[0]+'" aria-current="'+(gTab===t[0]?'page':'false')+'">'+t[1]+(t[0]==='solic'&&pend?'<span class="gcount">'+pend+'</span>':'')+'</button>'}).join('');
  var a=document.activeElement,keep=a&&$('#gBody').contains(a)&&a.id?a.id:null,val=keep&&a.value!==undefined?a.value:null;
  var f={geral:gGeral,usuarios:gUsers,linhas:gLinhas,pontos:gPontos,wifi:gWifiTab,servicos:gServicos,solic:gSolic,plantas:gPlantas,avisos:gAvisos}[gTab]||gGeral;
  $('#gBody').innerHTML=f();
  if(keep){var el=document.getElementById(keep);if(el){if(val!=null&&el.value!==undefined&&el.type!=='file')el.value=val;el.focus({preventScroll:true})}}
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
  '<h3 class="gh">Últimas solicitações</h3>'+(reqs.length?'<div class="glist">'+reqs.slice(0,4).map(function(r){var s=reqStatus(r.id),S=REQ_ST[s.st];return '<button type="button" class="grow2 btnrow" data-gtab="solic"><span class="grow"><b>'+esc(reqTipo(r.t))+'</b><small>'+esc(r.alvo||'')+' · '+agoTxt(r.ts)+'</small></span><span class="pill '+S[1]+'">'+S[0]+'</span></button>'}).join('')+'</div>':'<p class="muted small">Nenhuma solicitação ainda.</p>');
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
      (m.id===SH.uid?'':'<button type="button" class="copy'+(b?'':' danger')+'" data-gblock="'+esc(m.id)+'">'+(b?'Desbloquear':'Bloquear')+'</button>')+'</div>'}).join('');
}
function gUsers(){
  if(!SH.on)return '<h3 class="gh">Usuários</h3><p class="muted">A lista de usuários aparece quando o app está publicado no claude.ai: cada pessoa que abre o app entra aqui, com a data da primeira e da última visita e o que ela enviou.</p><div class="glist"><div class="grow2"><span class="grow"><b>Este aparelho</b><small>'+filaLocal.length+' fila(s) · '+reqLocal.length+' solicitação(ões)</small></span></div></div>';
  return '<h3 class="gh">Usuários ('+SH.members.length+')</h3>'+
    '<p class="muted small">Bloquear esconde os avisos e as filas da pessoa e impede novos envios pelo app. '+(FBMODE?'Para tirar o acesso de vez, desative a pessoa em Authentication, no console do Firebase.':'Para tirar o acesso de vez, use o menu Compartilhar da página.')+'</p>'+
    '<label class="gf"><span class="sr">Buscar pessoa</span><input type="search" id="gUq" placeholder="Buscar pelo nome" value="'+esc(gFilter.q)+'"></label>'+
    '<div class="glist" id="gUlist">'+usersList()+'</div>';
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
  return '<h3 class="gh">Serviços e horários</h3><p class="muted small">Restaurantes, bibliotecas, secretarias e segurança. Deixe o campo vazio para manter o horário original.</p>'+
    '<label class="gf"><span class="sr">Buscar serviço</span><input type="search" id="gSq" placeholder="Buscar: RU, biblioteca, secretaria" value="'+esc(gFilter.svc)+'"></label><div class="glist" id="gSlist">'+svcList()+'</div>';
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
hoursHTML=function(now){
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
  return '<div><p class="eyebrow">'+(we?'Fim de semana':'Dia útil')+' · '+fmt(now)+'</p><h2>Onde fica e quando abre</h2></div>'+
    '<label class="fld"><span class="sr">Buscar local</span><input type="search" id="hq" placeholder="Buscar local, sala ou bloco" value="'+esc(pstate.q)+'"></label>'+
    '<div class="chips lgchips" role="group" aria-label="Filtrar">'+LCAT.map(function(c){return '<button class="chip" type="button" data-cat="'+c[0]+'" aria-pressed="'+(pstate.cat===c[0])+'">'+c[1]+(c[0]==='aberto'?' <span class="cnum">'+nOpen+'</span>':'')+'</button>'}).join('')+'</div>'+
    (nSoon?'<p class="small lgsoon"><i class="pin-dot warn"></i>'+nSoon+(nSoon>1?' locais fecham':' local fecha')+' em até 30 min</p>':'')+
    '<div class="lglist">'+(out||'<p class="muted">Nada encontrado. Tente outra palavra.</p>')+'</div>'+
    '<p class="muted small keep">Horários de dias úteis informados pela UFRJ; em férias e feriados podem mudar. Os horários dos ônibus estão na aba Trajetos.</p>';
};
function saveFolds(){try{localStorage.setItem('cse-folds',JSON.stringify({f:!!pstate.filaBox,b:!!pstate.bldOpen}))}catch(e){}}
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
  else if(SH.on&&(SH.denied||SH.write===false))why=FBMODE?'Você pode ver as filas. Para informar, entre com Google ou e-mail em Ajustes › Conta.':'Você pode ver as filas. Para informar, o dono da página precisa te dar acesso de colaborador.';
  if(!PERFIL)return '<div class="filabox flat" id="filabox"><div class="fila-l">'+RUS.map(function(k){return filaRow(k,now)}).join('')+'</div>'+needProfileHTML('informar a fila')+'</div>';
  return '<div class="filabox flat" id="filabox"><div class="fila-l">'+RUS.map(function(k){return filaRow(k,now)}).join('')+'</div>'+
    (filaMsg?'<p class="small fila-ok" role="status">'+esc(filaMsg)+'</p>':'')+
    '<p class="muted small keep">'+(why||'Está na fila? Toque em Informar e escolha o tamanho. Seu nome não aparece, e os avisos mais recentes pesam mais.')+'</p></div>';
}
function foldHTML(id,open,title,sub,body){
  return '<details class="fold" id="'+id+'"'+(open?' open':'')+'><summary><span class="fold-t"><b>'+title+'</b>'+sub+'</span><span class="fold-c" aria-hidden="true"></span></summary><div class="fold-b">'+body+'</div></details>';
}
buildingHTML=function(now){
  var fila=CFG.reps?foldHTML('fdFila',pstate.filaBox,'Fila do RU agora',filaResumo(),pstate.filaBox?filaBody():''):'';
  var np=(GST.plantas.items||[]).length;
  return fila+foldHTML('fdBld',pstate.bldOpen,'Prédios por dentro','<span class="fsum muted">Blocos, andares e salas do CT e do CCMN'+(np?' · '+np+' planta'+(np>1?'s':'')+' oficial'+(np>1?'is':''):'')+'</span>',pstate.bldOpen?bldInner(now):'');
};
function bldInner(now){
  var extra=[];(GST.plantas.items||[]).forEach(function(p){if(!BLD[p.bld]&&extra.indexOf(p.bld)<0)extra.push(p.bld)});
  if(!BLD[pstate.bld]&&extra.indexOf(pstate.bld)<0)pstate.bld='ct';
  var chips='<div class="chips" role="group" aria-label="Escolha o prédio">'+Object.keys(BLD).concat(extra).map(function(k){var nm=BLD[k]?BLD[k].short:plantName(plantasDe(k)[0]);return '<button class="chip" type="button" data-bld="'+esc(k)+'" aria-pressed="'+(k===pstate.bld)+'">'+esc(nm)+'</button>'}).join('')+'</div>';
  var head=chips;
  if(!BLD[pstate.bld])return head+'<p class="small"><b>'+esc(plantName(plantasDe(pstate.bld)[0]))+'</b></p>'+plantasHTML(pstate.bld);
  var B=BLD[pstate.bld],sel=PL[pstate.pl]&&PL[pstate.pl].bld===pstate.bld&&PL[pstate.pl].b?pstate.pl:null;
  return head+'<p class="small"><b>'+B.name+'</b> · <span class="muted">'+B.addr+'</span></p>'+plantasHTML(pstate.bld)+planHTML(sel)+
    '<details class="det lgabout"><summary>Sobre este esquema</summary><p class="muted small keep">'+B.note+' Planta ilustrativa: a UFRJ não publica as plantas dos prédios. Bloco, andar e número da sala são oficiais; a posição exata da sala no corredor é aproximada. Quando a fonte só dá a sala, o andar sai do número (sala 527 → 5º andar).</p></details>';
};
pPane.addEventListener('toggle',function(e){var d=e.target;if(!d||!d.classList||!d.classList.contains('fold'))return;
  var was=d.id==='fdFila'?pstate.filaBox:pstate.bldOpen;if(was===d.open)return;
  if(d.id==='fdFila')pstate.filaBox=d.open;else if(d.id==='fdBld')pstate.bldOpen=d.open;else return;
  saveFolds();if(d.open){var b=d.querySelector('.fold-b');if(b&&!b.firstChild){renderPredios();var n=document.getElementById(d.id);if(n){var s=n.querySelector('summary');if(s)s.focus({preventScroll:true})}}}},true);
var _renderPredios=renderPredios;
renderPredios=function(f){_renderPredios(f);if(pPane.hidden)return;pPane.querySelectorAll('.planbox .pick .chips').forEach(function(el){var c=el.querySelector('[aria-pressed="true"]');if(c&&el.scrollWidth>el.clientWidth){var r1=el.getBoundingClientRect(),r2=c.getBoundingClientRect();el.scrollLeft+=r2.left+r2.width/2-(r1.left+r1.width/2)}})};
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
}
function accQueue(){if(!ACC.kind||ACC.mute)return;clearTimeout(ACC.t);ACC.state='salvando';accPaint();ACC.t=setTimeout(accPush,900)}
function accPush(){
  if(!ACC.kind)return;
  var s=accSettings(),p;
  if(ACC.kind==='claude')p=SH.db.doc('data/users/'+ACC.uid+'/ajustes').set({cfg:s.cfg,rota:s.rota,ts:Date.now()});
  else p=ACC.fb.db.collection('usuarios').doc(ACC.uid).set({cfg:s.cfg,rota:s.rota,grade:GRADE||[],nome:ACC.name||'',ts:Date.now()},{merge:true});
  return p.then(function(){ACC.last=Date.now();ACC.state='ok';accPaint()},function(){ACC.state='erro';accPaint()});
}
var _saveCfgA=saveCfg;saveCfg=function(){_saveCfgA();if(!ACC.mute)accQueue()};
var _savePrefsA=savePrefs;savePrefs=function(){_savePrefsA();if(!ACC.mute)accQueue()};
var _saveGradeA=saveGrade;saveGrade=function(){_saveGradeA();if(ACC.kind==='google'&&!ACC.mute)accQueue()};
/* claude.ai */
function accClaude(user,uid){
  if(!uid||!SH.db)return;
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
}
function fbUserOff(){
  SH.uid=null;SH.write=false;SH.myReq=[];if(fbReqUnsub){fbReqUnsub();fbReqUnsub=null}
  MUD_OWNER=false;if(GESTOR===true){if(gestM&&!gestM.hidden)closeGest();GESTOR=false;var b=$('#gestBtn');if(b)b.hidden=true}
  refreshAll();if(cPane&&!cPane.hidden)renderCal();
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
  return h+'</div>';
}
function accPaint(){var s=$('#accsec');if(s&&!cfgM.hidden){var tmp=document.createElement('div');tmp.innerHTML=accHTML();s.replaceWith(tmp.firstChild)}}
var _renderCfgA=renderCfg;
renderCfg=function(f){_renderCfgA(f);var R=$('#cfgR');if(R&&!R.querySelector('#accsec'))R.insertAdjacentHTML('afterbegin',accHTML())};
document.querySelectorAll('#login .lg-goo').forEach(function(b){b.hidden=!FB_ON});
/* login com e-mail e senha (Firebase) */
var MAIL={mode:'in',busy:false};
var _lgShowM=lgShow;
lgShow=function(which){
  var m=$('#lgMail');if(m)m.hidden=which!=='mail';
  if(which!=='mail'){_lgShowM(which);return}
  $('#lgSaved').hidden=true;$('#lgNew').hidden=true;mailMode(MAIL.mode);
  setTimeout(function(){var f=MAIL.mode==='up'?$('#lgMailNome'):$('#lgMailEmail');if(f)f.focus({preventScroll:true})},50);
};
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
var _renderCfgF=renderCfg;
renderCfg=function(f){_renderCfgF(f);var L=$('#cfgL');if(L&&!L.querySelector('#fontdet')){L.insertAdjacentHTML('beforeend',fontFoldHTML());if(fontOpen)FONTS.forEach(loadFont);if(f&&/data-f(ont|size)/.test(f)){var el=L.querySelector(f);if(el)el.focus({preventScroll:true})}}};
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
var GEO0={lat0:-22.855,lng0:-43.228,a:0.141984,b:0.216726,tx:788.18,ty:335.84,n:0,err:150};
var GEO=Object.assign({},GEO0);
var GPS_REF=['est','hu','eefd','res','pu','cenpes1','ccmn','ctl','reit','cetem','coppead','parque','graf'];
function geoK(){return {kx:111320*Math.cos(GEO.lat0*Math.PI/180),ky:110574}}
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
  if(!LOC.p)return;
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
}
function drawLoc(){
  var w=$('#world');if(!w)return;var g=$('#gLoc');
  if(!LOC.on||!LOC.p){if(g)g.remove();return}
  if(!g){g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='gLoc';g.setAttribute('pointer-events','none');w.appendChild(g)}
  var p=LOC.p,r=Math.max(4,Math.min(400,LOC.acc/mPerUnit()));
  g.innerHTML='<circle class="locacc" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+r.toFixed(1)+'"/><g class="locmk" transform="translate('+p[0].toFixed(1)+','+p[1].toFixed(1)+') scale('+MS.toFixed(3)+')"><circle class="locpulse" r="13"/><circle class="locdot" r="9"/></g>';
}
var _buildMapL=buildMap;buildMap=function(){_buildMapL();drawLoc()};
var _applyViewL=applyView;applyView=function(f){_applyViewL(f);var m=document.querySelector('#gLoc .locmk');if(m&&LOC.p)m.setAttribute('transform','translate('+LOC.p[0].toFixed(1)+','+LOC.p[1].toFixed(1)+') scale('+MS.toFixed(3)+')')};
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
    var bb=$('#zloc');if(bb)bb.classList.remove('busy');var f=LOC.first;LOC.first=false;locUpdate(f);
  },locErr,{enableHighAccuracy:true,maximumAge:15000,timeout:25000});
}
function locStop(){if(LOC.watch!=null&&navigator.geolocation)navigator.geolocation.clearWatch(LOC.watch);LOC.watch=null;LOC.on=false;LOC.p=null;LOC.near=null;var b=$('#zloc');if(b){b.setAttribute('aria-pressed','false');b.classList.remove('busy')}drawLoc();if(!state.sel)renderDetail()}
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
var _renderGestL=renderGest;
renderGest=function(){if(gTab==='gps'&&gestM){var keep=gTab;_renderGestL();var a=document.activeElement,id=a&&a.id;$('#gBody').innerHTML=gGps();if(id){var el=document.getElementById(id);if(el)el.focus({preventScroll:true})}}else _renderGestL()};
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
var _applyGL=applyG;applyG=function(){_applyGL();fitGeo()};
fitGeo();


/* ---------- legenda: cores das linhas ---------- */
function lgShort(n){var m=/^Estação\s*×\s*(.+)$/.exec(n);return m?m[1]:n}
function drawLegendLines(){
  var el=$('#lgLines');if(!el)return;
  el.innerHTML=Object.keys(LINES).map(function(id){var l=LINES[id];
    return '<button type="button" class="lg-line'+(l.susp?' susp':'')+'" data-legline="'+id+'" title="Linha '+id+' · '+esc(l.name)+(l.susp?' (suspensa)':'')+'"><i style="background:var(--m'+id+')"></i><b>'+id+'</b><span>'+esc(lgShort(l.name))+(l.susp?' · suspensa':'')+'</span></button>'}).join('');
}
document.addEventListener('click',function(e){var b=e.target.closest('[data-legline]');if(!b)return;select('line',b.dataset.legline,true)});
var _rebuildAllLg=rebuildAll;rebuildAll=function(){_rebuildAllLg();drawLegendLines()};
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
var _renderCfgT=renderCfg;
renderCfg=function(f){_renderCfgT(f);var L=$('#cfgL'),bg=L&&L.querySelector('#bgdet');if(L&&!L.querySelector('#temadet')){if(bg)bg.insertAdjacentHTML('beforebegin',temaFoldHTML());else L.insertAdjacentHTML('beforeend',temaFoldHTML());if(f&&/data-tema/.test(f)){var el=L.querySelector(f);if(el)el.focus({preventScroll:true})}}};
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
var _renderGestA=renderGest;
renderGest=function(){
  if(!gestM)return;computePerms();
  if(gTab==='admins'){_renderGestA();$('#gBody').innerHTML=gAdmins()}else{var p=TAB_PERM[gTab];if(p&&!gcan(p))gTab='geral';_renderGestA()}
  gestM.querySelectorAll('[data-gtab]').forEach(function(b){var p=TAB_PERM[b.dataset.gtab];if(p&&!gcan(p))b.hidden=true});
  var r=$('#gRole');if(r&&!ME.principal&&ME.perms)r.textContent='Seus privilégios: '+permSummary(ME.perms,false)+'.';
};
var _setGestorA=setGestor;
setGestor=function(v){_setGestorA(v);computePerms()};
var _applyGA=applyG;applyG=function(){_applyGA();if(GESTOR)computePerms()};

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
var _renderPlanS=renderPlan;
renderPlan=function(f){
  var a=document.activeElement,wasQ=a&&a.classList&&a.classList.contains('scb-in')?a.id:null;
  _renderPlanS(f&&/^#(from|to)Q$/.test(f)?f.slice(0,-1):f);
  enhanceStopSelect($('#from'));enhanceStopSelect($('#to'));
  var fid=f==='#from'||f==='#fromQ'?'fromQ':f==='#to'||f==='#toQ'?'toQ':wasQ;
  if(fid){var el=document.getElementById(fid);if(el){SCB.quiet=true;el.focus({preventScroll:true});setTimeout(function(){SCB.quiet=false},0)}}
};
renderPlan();

/* ======================= rosa dos ventos: bússola que aponta para o destino ======================= */
var CMP={on:false,h:null,hRaw:null,lastTxt:'',got:false,raf:0,timer:0};
function angN(){return Math.atan2(-GEO.b,GEO.a)*180/Math.PI}/* norte real no mapa, em graus a partir do topo */
function norm180(a){a=((a+180)%360+360)%360-180;return a}
function cardinal(b){var n=['norte','nordeste','leste','sudeste','sul','sudoeste','oeste','noroeste'];return n[Math.round(((b%360)+360)%360/45)%8]}
function cmpGeom(){
  var to=STOPS[state.to];if(!to)return null;
  var fromLoc=typeof LOC!=='undefined'&&LOC.on&&LOC.p&&!LOC.out,S=fromLoc?LOC.p:(STOPS[state.from]&&STOPS[state.from].p);if(!S)return null;
  var vx=to.p[0]-S[0],vy=to.p[1]-S[1],m=Math.hypot(vx,vy)*mPerUnit(),angV=Math.atan2(vx,-vy)*180/Math.PI,bear=((angV-angN())%360+360)%360;
  return {to:to,fromLoc:fromLoc,m:m,angV:angV,bear:bear};
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
    rc.innerHTML='<b>'+esc(txt)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+(hasH?'':'<small class="cmp-hint">'+(CMP.got?'':'Sem bússola neste aparelho: a seta segue o mapa.')+'</small>');
    if(full!==CMP.lastTxt){CMP.lastTxt=full}}
}
function cmpSchedule(){if(CMP.raf)return;CMP.raf=requestAnimationFrame(function(){CMP.raf=0;drawRose()})}
function onOri(e){
  var h=null;
  if(typeof e.webkitCompassHeading==='number'&&!isNaN(e.webkitCompassHeading))h=e.webkitCompassHeading;
  else if(e.absolute===true&&typeof e.alpha==='number')h=360-e.alpha;
  if(h==null)return;
  var so=(screen.orientation&&typeof screen.orientation.angle==='number')?screen.orientation.angle:(window.orientation||0);h=((h+so)%360+360)%360;
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
var _locUpdateC=locUpdate;locUpdate=function(f){_locUpdateC(f);if(CMP.on)cmpSchedule()};
var _renderPlanC=renderPlan;renderPlan=function(f){_renderPlanC(f);if(CMP.on)cmpSchedule()};
var _locStopC=locStop;locStop=function(){_locStopC();if(CMP.on)cmpSchedule()};


/* ---------- filtros do topo: encurta os nomes se não couberem numa linha ---------- */
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
var APP_VERSION='20261104-2241';
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
function postDone(k){try{localStorage.setItem('cse-post-'+k,String(Date.now()))}catch(e){}}
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
var _setGestorV=setGestor;
setGestor=function(v){_setGestorV(v);if(v===true&&FBMODE&&SH.db&&!VAGAS.watch){VAGAS.watch=true;watchVagas()}};
var _fbUserOffV=fbUserOff;
fbUserOff=function(){_fbUserOffV();SH.full=false;SH.member=false};

/* gestão › Usuários: vagas e liberar vaga */
var _gUsersV=gUsers;
gUsers=function(){
  var h=_gUsersV();if(!FBMODE||!SH.on)return h;
  var n=VAGAS.ok?VAGAS.n:null,max=VAGAS.max,full=n!=null&&n>=max;
  var card='<div class="gcard vagas"><div class="grow2"><span class="grow"><b>Vagas para participar</b><small>'+(n==null?'Ainda não configurado. Abra esta tela com o privilégio Usuários para criar o contador.':n+' de '+max+' em uso'+(full?' · lotado: quem chegar agora só consulta':''))+'</small></span>'+(n==null?'':'<span class="pill '+(full?'bad':n>=max*.9?'warn':'good')+'">'+Math.max(0,max-n)+' livre(s)</span>')+'</div>'+
    (n==null?'':'<div class="vbar" aria-hidden="true"><i style="width:'+Math.min(100,Math.round(n/max*100))+'%"></i></div>')+
    (gcan('usuarios')?'<form class="gform vform" data-gform="vagas"><label class="gf">Limite de pessoas<input type="number" id="gVmax" min="1" max="2000" step="1" value="'+max+'"></label><button type="submit" class="copy">Salvar limite</button>'+(n==null?'':'<button type="button" class="copy" id="gVrecount">Recontar</button>')+'</form><p class="muted small">Gestores não ocupam vaga. Ao liberar a vaga de alguém, a pessoa continua vendo o app e volta a ocupar uma vaga se entrar de novo e ainda houver espaço.</p>':'')+'</div>';
  h=h.replace(/(<h3 class="gh">Usuários \(\d+\)<\/h3>)/,'$1'+card);
  return h;
};
var _usersListV=usersList;
usersList=function(){
  var h=_usersListV();if(!FBMODE||!SH.on||!gcan('usuarios'))return h;
  return h.replace(/<button type="button" class="copy( danger)?" data-gblock="([^"]+)">/g,function(all,d,id){return '<button type="button" class="copy" data-gfree="'+id+'">Liberar vaga</button>'+all});
};
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
var _fbSharedE=fbShared;
fbShared=function(fb){_fbSharedE(fb);ERR.queue.splice(0).forEach(function(o){SH.db.collection('erros').add(o).catch(function(){})})};
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
  var src=typeof _covSamplesR==='function'?_covSamplesR():[],cells={},t=Math.floor(Date.now()/600000)*600000,r=covRand(4242),out=[];
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
var _gGeralV=gGeral;
gGeral=function(){return _gGeralV()+demoCard()+errCard()};
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
document.addEventListener('click',function(e){if(e.target.closest('#newverGo'))location.reload()});
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
var _applyGS=applyG;applyG=function(){_applyGS();applySvcMapa()};
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
var _gServicosS=gServicos;
gServicos=function(){var h=_gServicosS();
  h=h.replace('</p>','</p><button type="button" class="copy" id="gSvJump">Mudar a localização dos serviços no mapa</button>');
  return h+'<div id="gSvSec"></div>'+svcMapaHTML()};
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
var _accGoogleF=accGoogle;
accGoogle=function(u){
  _accGoogleF(u);
  if(ACC.photo){savePhoto(ACC.photo);return}
  gravatar(u.email).then(function(url){if(url&&ACC.uid===u.uid)savePhoto(url)});
};
var _accClaudeF=accClaude;
accClaude=function(user,uid){_accClaudeF(user,uid);if(user&&user.me)user.me().then(function(me){if(me&&me.avatarUrl)savePhoto(me.avatarUrl)},function(){})};
var _lgShowF=lgShow;lgShow=function(w){_lgShowF(w);if(w==='saved')paintFaces()};
var _renderCfgFoto=renderCfg;
renderCfg=function(f){_renderCfgFoto(f);paintFaces();
  var p=document.querySelector('#cfgR .prof');if(!p||!PERFIL||document.getElementById('cfgFotoRow'))return;
  var src=ACC.photo||PERFIL.photo;
  var desc=src?(ACC.kind==='claude'?'Usa a foto da sua conta do Claude.':ACC.prov==='email'?'Usa a foto ligada ao seu e-mail no Gravatar.':'Usa a foto da sua conta Google.'):
    (ACC.kind==='google'&&ACC.prov==='email'?'Seu e-mail não tem foto no Gravatar. Cadastre uma em gravatar.com e ela aparece aqui.':'Entre com Google ou com e-mail em Conta para usar a foto da conta.');
  var row=document.createElement('div');row.id='cfgFotoRow';
  row.innerHTML=tg('cfgFoto',CFG.foto!==false&&!!src,'Foto da conta no perfil',desc);
  var anchor=document.getElementById('cfgBioRow')||p;anchor.insertAdjacentElement('afterend',row);
  var cb=row.querySelector('#cfgFoto');if(!src)cb.disabled=true;
  cb.addEventListener('change',function(){CFG.foto=cb.checked;saveCfg();paintFaces()});
};
var _savePerfilF=savePerfil;savePerfil=function(){_savePerfilF();setTimeout(paintFaces,0)};
var _fbUserOffF=fbUserOff;fbUserOff=function(){_fbUserOffF();ACC.photo='';paintFaces()};

/* ======================= planta interna: minimizada e só montada quando a pessoa abre ======================= */
pstate.planOpen=false;
var _planHTMLLazy=planHTML;
planHTML=function(id){
  var bk=pstate.bld,B=BLD[bk];if(!B)return '';
  var it=PL[id]&&PL[id].bld===bk?PL[id]:null;
  var sub=it?esc(it.s||it.name)+(it.b&&it.b!=='?'?' · '+(B.labels[it.b]||'Bloco '+it.b):'')+(it.f!=null?' · '+floorShort(it.f):''):'Escolha o bloco e o andar';
  return '<details class="det plandet" id="planDet"'+(pstate.planOpen?' open':'')+' data-pid="'+esc(id||'')+'"><summary><span class="plandet-t">Planta interna <span class="pl-badge2">exemplo</span></span><span class="fsum muted">'+B.short+' · '+sub+'</span></summary>'+
    '<div class="plandet-b">'+(pstate.planOpen?_planHTMLLazy(id):'')+'</div></details>';
};
document.addEventListener('toggle',function(e){
  var d=e.target;if(!d||d.id!=='planDet')return;
  pstate.planOpen=d.open;
  var b=d.querySelector('.plandet-b');
  if(d.open&&b&&!b.firstChild){var id=d.dataset.pid||null;b.innerHTML=_planHTMLLazy(id);
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
var _renderCfgPerf=renderCfg;
renderCfg=function(f){_renderCfgPerf(f);var L=$('#cfgL');if(L&&!L.querySelector('#perfsec'))L.insertAdjacentHTML('beforeend',perfHTML());if(f&&/data-perf/.test(f)){var el=document.querySelector(f);if(el)el.focus({preventScroll:true})}};
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
function covSamples(){
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
function covCardHTML(){
  var c=COV.pick&&COV.idx&&COV.idx[COV.pick];
  var head='<div class="cov-h1"><b>Cobertura do Wi-Fi da UFRJ</b><button type="button" class="cov-x" id="covX" aria-label="Fechar cobertura">×</button></div><span class="pill warn cov-tag">Prévia · dados de exemplo</span>';
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
  drawCov();covPaintCard();wifiChip()}
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
var _buildMapCov=buildMap;
buildMap=function(){_buildMapCov.apply(this,arguments);var gl=$('#gLines');if(gl&&!$('#gCov')){var g=document.createElementNS('http://www.w3.org/2000/svg','g');g.id='gCov';gl.parentNode.insertBefore(g,gl)}drawCov()};
var _applyViewCov=applyView;
applyView=function(f){_applyViewCov(f);if(!COV.on)return;var ppu=box().w/view.w,lv=ppu<(box().w<680?1.2:1.6)?2:1;if(lv!==COV.lvl){COV.pick=null;drawCov();covPaintCard()}};
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
var _covSamplesR=covSamples;
covSamples=function(){if(FBMODE&&COV.real&&COV.real.length&&!COV.demo)return COV.real;return _covSamplesR()};
var _covCardR=covCardHTML;
covCardHTML=function(){
  var h=_covCardR(),real=FBMODE&&COV.real&&COV.real.length&&!COV.demo;
  if(real)h=h.replace('<span class="pill warn cov-tag">Prévia · dados de exemplo</span>','<span class="pill good cov-tag">'+COV.real.length+' medições dos alunos · 30 dias</span>');
  else if(FBMODE&&COV.real&&!COV.real.length)h=h.replace('Prévia · dados de exemplo','Exemplo · ainda sem medições reais');
  if(FBMODE)h+='<p class="small cov-help">'+(CFG.covShare?'Você está ajudando a mapear. <button type="button" class="linkbtn" id="covNow">Medir agora</button>':'<button type="button" class="linkbtn" id="covJoin">Ajudar a mapear o Wi-Fi</button>')+'</p>';
  return h;
};
var _covSetR=covSet;
covSet=function(on){_covSetR(on);if(on&&FBMODE&&COV.real==null)covLoadReal()};
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
var _renderCfgNet=renderCfg;
renderCfg=function(f){_renderCfgNet(f);var R=$('#cfgR');if(!R||R.querySelector('#netsec'))return;var tg2=R.querySelectorAll('.tgls')[0];
  var box=document.createElement('div');box.innerHTML=netSecHTML();if(tg2&&tg2.nextSibling)R.insertBefore(box.firstChild,tg2.nextSibling);else R.appendChild(box.firstChild);
  var cb=$('#cfgCovShare');if(cb){if(!(FBMODE&&ON_SITE))cb.disabled=true;cb.addEventListener('change',function(){
    if(cb.checked&&FBMODE&&!SH.uid){cb.checked=false;gToast('Entre com Google ou e-mail para ajudar a mapear.',1);return}
    CFG.covShare=cb.checked;saveCfg();if(cb.checked){gToast('Obrigado! O app vai medir a rede enquanto estiver aberto no campus.');COVCOL.last=0;covLoop()}else clearTimeout(NET.timer);renderCfgKeep()})}};
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
var _renderGestNet=renderGest;
renderGest=function(){_renderGestNet();if(gTab==='rede'&&$('#gBody')){$('#gBody').innerHTML=gRede();var o=$('#gNetRes');if(o&&NET.last)o.insertAdjacentHTML('beforeend',eduMarkHTML(NET.last))}};
document.addEventListener('submit',function(e){var f=e.target.closest&&e.target.closest('form[data-gform="redes"]');if(!f)return;e.preventDefault();e.stopPropagation();
  var u=$('#gRu').value.trim(),ed=$('#gRe').value.trim(),bad=[u,ed].join(' ').split(/[\s,;]+/).filter(function(x){return x&&!/^\d+\.\d+\.\d+\.\d+(\/\d+)?$/.test(x)});
  if(bad.length){$('#gErr').textContent='Formato inválido: '+bad[0]+'. Use como 146.164.0.0/16.';return}
  saveG('redes',Object.assign(clone(GST.redes||{}),{ufrj:cidrList(u).join(' '),eduroam:cidrList(ed).join(' ')}));
},true);
document.addEventListener('click',function(e){if(!(e.target.closest&&e.target.closest('#gNetOld'))||!GNET.docs)return;
  var lim=Date.now()-30*864e5,old=GNET.docs.filter(function(d){return (+(d.data()||{}).t||0)<lim});if(!old.length){gToast('Nenhuma medição antiga.');return}
  var b=SH.db.batch();old.slice(0,450).forEach(function(d){b.delete(SH.db.doc('medicoes/'+d.id))});
  b.commit().then(function(){gToast(old.length+' medição(ões) apagadas.');GNET.n=null;renderGest()},function(){gToast('Não deu para apagar. Você precisa do privilégio Redes Wi-Fi.',1)})});
var _fbUserOnNet=fbUserOn;fbUserOn=function(u){_fbUserOnNet(u);setTimeout(covLoop,3000)};

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
var _applyViewVec=applyView;
applyView=function(f){_applyViewVec(f);var e=$('#imgVec');if(!e||!vecOn)return;
  if(perfEff()==='leve'){e.style.display='none';return}
  e.style.display='none';clearTimeout(vecHideT);vecHideT=setTimeout(function(){var v=$('#imgVec');if(v&&perfEff()!=='leve')v.style.display=''},260)};
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
if(location.hash==='#siglas')setTimeout(function(){if(cover.hidden&&login.hidden)openGloss()},0);
setTab(location.hash.slice(1));
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
function savePerfil(){try{if(PERFIL)localStorage.setItem('cse-perfil',JSON.stringify(PERFIL));else localStorage.removeItem('cse-perfil')}catch(e){}document.documentElement.classList.toggle('noprof',!PERFIL)}
document.documentElement.classList.toggle('noprof',!PERFIL);
var login=$('#login');
function lgShow(which){
  $('#lgSaved').hidden=which!=='saved';$('#lgNew').hidden=which!=='new';
  if(which==='saved'){$('#lgInit').textContent=PERFIL.name.charAt(0).toUpperCase();$('#lgName').textContent=PERFIL.name;
    lgBioState();$('#lgPinForm').hidden=true;$('#lgUsePin').hidden=!PERFIL.pin;$('#lgPin').value='';$('#lgPinErr').textContent='';
    setTimeout(function(){$('#lgBio').focus({preventScroll:true})},50)}
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
  if(!$('#pane-cfg').hidden)renderCfg();
}
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
  return navigator.credentials.create({publicKey:{challenge:ch,rp:{name:'Chegar e se conectar'},user:{id:uid,name:name,displayName:name},
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
var _renderCfgB=renderCfg;
renderCfg=function(f){_renderCfgB(f);var p=document.querySelector('#cfgR .prof');if(!p||!PERFIL||document.getElementById('cfgBioRow'))return;
  p.insertAdjacentHTML('afterend','<div class="biorow" id="cfgBioRow"><span class="grow"><b>Biometria</b><small>'+(PERFIL.bio?'Ativada neste aparelho. O rosto ou a digital nunca saem do celular.':'Desativada. Entre com o rosto ou a digital do aparelho.')+'</small></span>'+
    (PERFIL.bio?'<button type="button" class="copy" id="cfgBioOff">Desativar</button>':'<button type="button" class="copy" id="cfgBioOnBtn" hidden>Ativar</button>')+'</div>');
  if(!PERFIL.bio)bioCheck().then(function(v){var b=$('#cfgBioOnBtn');if(b)b.hidden=!v;if(!v){var s=document.querySelector('#cfgBioRow small');if(s)s.textContent='Este aparelho ou navegador não oferece biometria para sites.'}});
};
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
var _closeLoginB=closeLogin;
closeLogin=function(){_closeLoginB();setTimeout(function(){refreshAll();if(!pPane.hidden)renderPredios()},0)};
var _openReqB=openReq;
openReq=function(t,a){if(!PERFIL){openLogin();lgShow('new');gToast('Crie seu perfil para pedir correções.');return}_openReqB(t,a)};

refreshAll();
if(CFG.login)openLogin();
if(!cover.hidden&&login.hidden)requestAnimationFrame(function(){cvEnter()});
if('MutationObserver' in window)new MutationObserver(function(){if(login.hidden&&!cover.hidden&&cover.classList.contains('pre'))cvEnter()}).observe(login,{attributes:true,attributeFilter:['hidden']});
setTimeout(function(){if(login.hidden&&!cover.hidden&&cover.classList.contains('pre'))cvEnter()},1500);

$('#rosebox').innerHTML='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,NORTH+ROT)+'</svg>';
var opac=$('#opac'),opacv=$('#opacv');
function setOpac(v){v=Math.max(15,Math.min(100,+v||80));opac.value=v;opacv.textContent=v+'%';var im=$('#baseimg');window.__opac=v/100;if(im)im.style.opacity=v/100}
var savedOp=80;try{savedOp=+localStorage.getItem('cse-ufrj-opac')||80}catch(e){}
setOpac(savedOp);
opac.addEventListener('input',function(){setOpac(opac.value);try{localStorage.setItem('cse-ufrj-opac',opac.value)}catch(e){}});
renderAll();

/* Liquid Glass: brilho segue o ponteiro; refração só em navegadores Chromium */
try{if(LITE===false&&navigator.userAgentData&&navigator.userAgentData.brands&&navigator.userAgentData.brands.some(function(b){return /Chromium/.test(b.brand)}))document.documentElement.classList.add('refract')}catch(e){}
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
var TABS=[['trajeto','Trajetos','Linhas, horários e o próximo ônibus'],['predios','Lugares','Onde fica, quando abre e as plantas'],['grade','Grade','Suas aulas da semana'],['cal','Calendário','Prazos, feriados e mudanças de data']];
var TABID=TABS.map(function(t){return t[0]});
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
function tabName(t){for(var i=0;i<TABS.length;i++)if(TABS[i][0]===t)return TABS[i][1];return t}
function applyTabs(){
  var bar=document.querySelector('.tabs');if(!bar)return;
  tabOrder().forEach(function(t){var b=$('#tab-'+t);if(b)bar.appendChild(b)});        /* reordena */
  TABID.forEach(function(t){var b=$('#tab-'+t);if(b)b.hidden=!tabOn(t);
    var cv=CV_OF[t]&&document.querySelector('.cv-row [data-cv="'+CV_OF[t]+'"]');if(cv)cv.hidden=!tabOn(t)});
  var cur=document.querySelector('.tabs [data-tab][aria-selected="true"]');
  if(cur&&cur.hidden)setTab(tabVis()[0]);
}
var _setTabV=setTab;
setTab=function(t){
  if(t!=='cfg'&&(TABID.indexOf(t)<0||!tabOn(t)))t=tabVis()[0];
  _setTabV(t);
};
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
cmpGeom=function(){
  var ori=CFG.bussolaAlvo==='origem',alvo=STOPS[ori?state.from:state.to];if(!alvo)return null;
  var hasLoc=typeof LOC!=='undefined'&&LOC.on&&LOC.p&&!LOC.out;
  var S=hasLoc?LOC.p:(STOPS[ori?state.to:state.from]&&STOPS[ori?state.to:state.from].p);
  if(!S)return null;
  var vx=alvo.p[0]-S[0],vy=alvo.p[1]-S[1],m=Math.hypot(vx,vy)*mPerUnit();
  var angV=Math.atan2(vx,-vy)*180/Math.PI,bear=((angV-angN())%360+360)%360;
  return {to:alvo,fromLoc:hasLoc,m:m,angV:angV,bear:bear,origem:ori};
};

/* ---------- 4. ponto escolhido no mapa vira o destino ---------- */
CFG.autoDest=CFG.autoDest!==false;
function stopNear(p){var n=nearestOf(STOPS,p,function(s){return s.off});return n&&n.id}
function pointStop(kind,id){
  if(kind==='stop')return STOPS[id]?id:null;
  var o=kind==='wifi'?WIFI[id]:kind==='svc'?SVCMAP[id]:kind==='place'?PL[id]:null;
  return o&&o.p?stopNear(o.p):null;
}
var _selectV=select;
select=function(kind,id,scroll){
  if(CFG.autoDest&&['stop','wifi','svc','place'].indexOf(kind)>=0){
    var to=pointStop(kind,id);
    if(to&&to!==state.to){
      var from=(typeof LOC!=='undefined'&&LOC.on&&LOC.near&&LOC.near.id!==to)?LOC.near.id:state.from;
      if(from===to)from=state.to!==to?state.to:(to==='est'?'ctl':'est');
      state.to=to;state.from=from;savePrefs();
    }
  }
  _selectV(kind,id,scroll);
};

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
var _renderCfgV10=renderCfg;
renderCfg=function(f){
  _renderCfgV10(f);
  var Rr=$('#cfgR');if(!Rr)return;
  if(!Rr.querySelector('#cfgSimples')){
    var first=Rr.querySelector('.tgls');                      /* a escolha da bússola fica junto do mapa */
    if(first)first.insertAdjacentHTML('afterend',bussolaAlvoHTML());
    Rr.insertAdjacentHTML('beforeend',v10CfgHTML()+tabsCfgHTML());
  }
};
document.addEventListener('click',function(e){
  var f=e.target.closest&&e.target.closest('[data-faixa]');if(!f)return;
  CFG.faixa=+f.dataset.faixa||0;saveCfg();renderAll();renderCfgKeep();gToast(CFG.faixa?'Horários em faixas de '+CFG.faixa+' min.':'Horários exatos.');
});
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-balvo]');if(!b)return;
  CFG.bussolaAlvo=b.dataset.balvo;saveCfg();if(typeof cmpSchedule==='function'&&CMP.on)cmpSchedule();renderCfgKeep();
});
document.addEventListener('change',function(e){
  var id=e.target.id,map={cfgSimples:'simples',cfgAutoDest:'autoDest',cfgClima:'clima',cfgChuva:'chuva'};
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
var _fbSharedV11=fbShared;
fbShared=function(fb){
  _fbSharedV11(fb);
  fb.db.doc('meta/acesso').onSnapshot(function(s){
    ACESSO.login=!!(s.exists&&(s.data()||{}).login===true);
    try{localStorage.setItem('cse-acesso',ACESSO.login?'1':'0')}catch(e){}
    gateUpdate();if(gestM&&!gestM.hidden&&gTab==='geral')renderGest();
  },function(){gateUpdate()});
  fb.auth.onAuthStateChanged(function(u){AUTH_USER=!!u;AUTH_READY=true;gateUpdate()});
};
if(FBMODE&&!FB_ON)AUTH_READY=true;
var _rebuildV11=rebuildAll;rebuildAll=function(){_rebuildV11.apply(this,arguments);gateUpdate()};

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
var _gGeralV11=gGeral;gGeral=function(){return _gGeralV11()+acessoCard()};
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
  MAPIMG='mapa-bordas'+suf+'.jpg';MAPHD=window.MAPHD_URL='mapa-campus'+suf+'.jpg';MAPVEC='mapa-campus'+suf+'.svg';MAPMINI='mapa-mini'+suf+'.jpg';MAPBLUR='mapa-blur'+suf+'.jpg';
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
    '<button class="item tint" type="button" style="--c:var(--good)" data-wedu><span class="lb" style="--c:var(--good)">Wi-Fi</span><span class="grow">Tutorial do eduroam<small>Wi-Fi global das universidades, com o login da UFRJ</small></span></button>';
}
function renderWifiPane(){var el=$('#pWifi');if(el&&!pPane.hidden)el.innerHTML=pWifiHTML()}
/* "Onde fica e quando abre" vira uma seção recolhível, fechada por padrão */
pstate.hrsOpen=(function(){try{return localStorage.getItem('cse-fold-hrs')==='1'}catch(e){return false}})();
var _hoursInnerV15=hoursHTML;
hoursHTML=function(now){
  var we=isWeekend()&&!state.manual,nOpen=Object.keys(PL).filter(function(k){var it=PL[k];if(it.cat==='aula')return false;var st=statusOf(it,now);return !(st.c==='bad'||/Confirmar|Sem horário/.test(st.t))}).length;
  var body=pstate.hrsOpen?_hoursInnerV15(now).replace(/^<div><p class="eyebrow">[^<]*<\/p><h2>Onde fica e quando abre<\/h2><\/div>/,''):'';
  return foldHTML('fdHrs',pstate.hrsOpen,'Onde fica e quando abre','<span class="fsum muted">'+nOpen+' abertos agora · '+(we?'fim de semana':'dia útil')+', '+fmt(now)+'</span>',body);
};
pPane.addEventListener('toggle',function(e){var d=e.target;if(!d||d.id!=='fdHrs'||pstate.hrsOpen===d.open)return;
  pstate.hrsOpen=d.open;try{localStorage.setItem('cse-fold-hrs',d.open?'1':'0')}catch(x){}
  if(d.open){var b=d.querySelector('.fold-b');if(b&&!b.firstChild){pH.innerHTML=hoursHTML(nowMin());var s2=$('#fdHrs summary');if(s2)s2.focus({preventScroll:true})}}},true);
var _renderPrediosV13=renderPredios;
renderPredios=function(f){_renderPrediosV13(f);renderWifiPane()};

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
var _updateMapV13=updateMap;
updateMap=function(){var r=_updateMapV13.apply(this,arguments);nightBadge();return r};
var _selectV13=select;
select=function(kind,id,scroll){
  _selectV13(kind,id,scroll);
  if(kind!=='wifi')wifiPopClose();
  if(kind==='night'){nightBadge();setTimeout(function(){var d=$('#detail');if(!d)return;var r=d.getBoundingClientRect();
    if(r.top>window.innerHeight*.55||r.bottom<80)d.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'})},80)}
};
wifiChip();


})();
