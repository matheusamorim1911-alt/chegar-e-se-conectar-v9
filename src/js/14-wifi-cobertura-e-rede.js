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
