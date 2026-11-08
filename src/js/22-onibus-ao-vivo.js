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
  if(prev&&prev.i===sn.i&&prev.s!=null){var ds=sn.s-prev.s;if(Math.abs(ds)/MPU>5)return ds>0?1:-1}
  if(o.vel>2){var comp=((angN()+o.dir)%360+360)%360,d=Math.abs(((sn.ang-comp)%360+540)%360-180);return d>90?-1:1}
  return prev&&prev.sign||1;
}
function lvPred(S,now){
  var O=S.obs;if(!O||O.i==null)return null;
  var dt=Math.max(0,Math.min(60,(now-O.t)/1000)),s=O.s+O.sign*lvDist(O,dt)*MPU;
  return Math.max(0,Math.min(lvLen(O.i),s));
}
function lvFrame(){
  LV2.raf=0;var now=Date.now(),red=matchMedia('(prefers-reduced-motion:reduce)').matches||perfEff()==='leve',any=false;
  Object.keys(LV2.st).forEach(function(v){var S=LV2.st[v];if(!S.el||!S.el.isConnected)return;
    var O=S.obs,x=null,y=null,ang=null,ps=lvPred(S,now),si=null,ss=null,mv=O&&O.i!=null&&lvV(O)>0.3;
    var k=S.blend?Math.min(1,(now-S.blend.t0)/1500):1;if(S.blend&&k>=1)S.blend=null;
    if(ps!=null){si=O.i;ss=ps;
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
  var PF=LV_PERF,perf='<p class="small keep"><b>Perfil dos trechos</b> (dias úteis): '+(PF?Object.keys(PF.periodos).map(function(k){var R=PF.periodos[k];return {manha:'manhã',tarde:'tarde',noite:'noite'}[k]+' '+f(R.erro_antes_m)+' → '+f(R.erro_depois_m)}).join(', ')+' nos dias de teste. '+(Object.keys(PF.periodos).length<3?'Outros períodos, fins de semana':'Fins de semana')+' e feriados usam a previsão de sempre.':'ainda sem ganho comprovado (gere com tools/perfil_trechos.py).')+'</p>';
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
    }else if(!prev||prev.t!==o.t){
      S.blend={x:S.x,y:S.y,i:S.i,s:S.s,t0:Date.now()};
    }
    var tt=S.el.querySelector('title');if(tt)tt.textContent=tit;S.el.setAttribute('aria-label',tit);
    S.obs=obs;S.age=idade;S.el.dataset.id=liveNearStop([obs.x,obs.y]);
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
var REDUT=__REDUTORES__,LV_EV_IGNORA=10;
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
function lvPeriodo(t){var h=new Date(t).getHours();return h>=5&&h<12?'manha':h>=12&&h<18?'tarde':'noite'}
function lvPerfil(O){
  var P=LV_PERF;if(!P||O.i==null||!lvDiaUtil(O.t))return null;
  var per=lvPeriodo(O.t),R=P.periodos[per],tr=lvmTracado(O.i);if(!R||tr==null)return null;
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
