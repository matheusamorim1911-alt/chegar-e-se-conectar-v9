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
    gradeNextHTML(now)+'<h3>Semana</h3>'+gradeWeekHTML()+(typeof igBotao==='function'?igBotao():'')+
    '<p class="muted small">'+(SH.on&&SH.uid?'Sua grade fica salva na sua conta e só você vê.':'Sua grade fica salva só neste aparelho.')+'</p>';
  if(!gWeek.dataset.ready){gWeek.innerHTML=gradeFormHTML();gWeek.dataset.ready='1'}
  if(focusSel){var el=gPane.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
}
