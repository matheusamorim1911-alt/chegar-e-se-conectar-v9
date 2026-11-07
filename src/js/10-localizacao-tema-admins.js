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
