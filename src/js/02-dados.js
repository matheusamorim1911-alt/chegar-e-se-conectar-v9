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
    sum:'A cada 40 min. Saídas da Estação das 7h05 às 19h05; da COPPEAD das 7h25 às 18h45. A volta segue até a Estação (a página da Prefeitura Universitária cita a volta só até a Faculdade de Letras).',
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
    '<details class="det"><summary>Sem o app (conexão manual)</summary><p class="small muted">Escolha a rede eduroam e digite o e-mail completo e a senha. Os valores certos (PEAP, MSCHAPv2 e o domínio eduroam.ufrj.br) estão em Lugares › Wi-Fi › Configurar eduroam › Configurar à mão. Se o celular pedir para confiar num certificado, só aceite se for de eduroam.ufrj.br.</p></details>'+
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
