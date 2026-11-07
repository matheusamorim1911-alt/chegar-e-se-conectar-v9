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
function ctpFit(rs){if(!rs.length)return CTP.d.bbox.slice();var a=[1e9,1e9,-1e9,-1e9];rs.forEach(function(s){a[0]=Math.min(a[0],s.bb[0]);a[1]=Math.min(a[1],s.bb[1]);a[2]=Math.max(a[2],s.bb[2]);a[3]=Math.max(a[3],s.bb[3])});var m=Math.max(6,(a[2]-a[0])*.04);return [a[0]-m,a[1]-m,a[2]+m,a[3]+m]}
function ctpVB(v){return [v[0],v[1],v[2]-v[0],v[3]-v[1]].map(function(x){return x.toFixed(1)}).join(' ')}
function ctpLabel(s){return s[4]||s[3]}
function ctpWhere(s){return 'Bloco '+s[0]+' · '+(s[1]==='subsolo'?'subsolo':CTP_PAV[s[1]]+' andar')}
function ctpSVG(){
  var rs=ctpRooms(),vb=CTP.vb||ctpFit(rs),w=vb[2]-vb[0],h=vb[3]-vb[1],sw=(w/700).toFixed(2);
  var p='';rs.forEach(function(s){var g=CTP_G[s[2]]||CTP_G.apoio,dim=CTP.f&&s[2]!==CTP.f,sel=CTP.sel===s.i;
    p+='<path data-ctr="'+s.i+'" class="ctr'+(sel?' sel':'')+(dim?' dim':'')+'" d="'+s.P.map(function(r){return 'M'+r.map(function(q){return q[0].toFixed(1)+' '+q[1].toFixed(1)}).join('L')+'Z'}).join('')+'" style="fill:'+g[1]+'"><title>'+esc(ctpLabel(s)+' · '+ctpWhere(s))+'</title></path>'});
  var lb='';if(!CTP.bl){var seen={};rs.forEach(function(s){(seen[s[0]]=seen[s[0]]||[]).push(s.c)});Object.keys(seen).forEach(function(b){var c=seen[b],x=0,y=0;c.forEach(function(q){x+=q[0];y+=q[1]});lb+='<text class="ctb" x="'+(x/c.length).toFixed(1)+'" y="'+(y/c.length).toFixed(1)+'" style="font-size:'+(w/38).toFixed(1)+'px">'+esc(b.length>2?b.slice(0,3):b)+'</text>'})}
  var pin='';if(CTP.sel!=null){var S=CTP.d.salas[CTP.sel];if(S[1]===CTP.pav)pin='<circle class="ctpin" cx="'+S.c[0].toFixed(1)+'" cy="'+S.c[1].toFixed(1)+'" r="'+(w/60).toFixed(1)+'"/>'}
  return '<svg class="ctsvg" id="ctsvg" viewBox="'+ctpVB(vb)+'" style="--ctsw:'+sw+';aspect-ratio:'+w.toFixed(0)+' / '+Math.max(h,w*.45).toFixed(0)+'" role="img" aria-label="Planta do CT, '+esc(CTP_PAV[CTP.pav]||'')+' andar">'+p+lb+pin+'</svg>';
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
  h+='<div class="seg ctseg" role="group" aria-label="Bloco"><button type="button" data-ctbl="" aria-pressed="'+!CTP.bl+'">Todos</button>'+bls.map(function(b){return '<button type="button" data-ctbl="'+esc(b)+'" aria-pressed="'+(CTP.bl===b)+'">'+esc(b==='Auditório'?'Aud.':b)+'</button>'}).join('')+'</div>';
  h+='<div class="seg ctseg" role="group" aria-label="Andar">'+pavs.map(function(k){return '<button type="button" data-ctpav="'+k+'" aria-pressed="'+(CTP.pav===k)+'">'+CTP_PAV[k]+'</button>'}).join('')+'</div>';
  h+='<div class="ctf">'+CTP_F.map(function(f){return '<button type="button" class="chip" data-ctf="'+f[0]+'" aria-pressed="'+(CTP.f===f[0])+'"><span class="sw" style="background:'+CTP_G[f[0]][1]+';opacity:1"></span>'+f[1]+'</button>'}).join('')+'</div>';
  var cnt=CTP.f?ctpRooms().filter(function(s){return s[2]===CTP.f}).length:0;
  h+='<div class="ctwrap">'+ctpSVG()+'<div class="ctz"><button type="button" data-ctz="1" aria-label="Aproximar">+</button><button type="button" data-ctz="-1" aria-label="Afastar">−</button><button type="button" data-ctz="0" aria-label="Ver tudo">⤢</button></div></div>';
  if(CTP.sel!=null){var S=CTP.d.salas[CTP.sel],B=CTP.d.blocos.filter(function(b){return b[0]===S[0]})[0];h+='<p class="ctinfo keep"><b>'+esc(ctpLabel(S))+'</b> · '+esc((S[4]?S[3]+' · ':'')+ctpWhere(S))+(B&&B[3]?'<small>Bloco '+esc(S[0])+': '+esc(B[3])+'</small>':'')+'</p>'}
  else if(CTP.f)h+='<p class="ctinfo keep">'+cnt+' '+CTP_G[CTP.f][0].toLowerCase()+' neste andar'+(CTP.bl?' do bloco '+esc(CTP.bl):'')+'.</p>';
  else h+='<p class="muted small keep">Toque numa sala para ver o que é. Use os filtros para achar sanitários, escadas e salas de aula.</p>';
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
  else if(t.dataset.cts){var S=CTP.d.salas[+t.dataset.cts];CTP.sel=S.i;CTP.pav=S[1];CTP.bl=S[0];CTP.q='';CTP.f='';var r=ctpRooms();CTP.vb=ctpFit(r);setTimeout(function(){var w=$('#ctsvg');if(w)w.scrollIntoView({block:'center',behavior:'smooth'})},50)}
  else if(t.dataset.ctz!=null){var z=+t.dataset.ctz,vb=CTP.vb||ctpFit(ctpRooms());if(!z)CTP.vb=null;else{var cx=(vb[0]+vb[2])/2,cy=(vb[1]+vb[3])/2,k=z>0?.6:1/.6,hw=(vb[2]-vb[0])*k/2,hh=(vb[3]-vb[1])*k/2;CTP.vb=[cx-hw,cy-hh,cx+hw,cy+hh]}}
  else if(t.dataset.ctr){CTP.sel=CTP.sel===+t.dataset.ctr?null:+t.dataset.ctr}
  ctpPaint();
});
/* arrastar a planta */
(function(){var drag=null;
  document.addEventListener('pointerdown',function(e){var s=e.target.closest&&e.target.closest('#ctsvg');if(!s||!CTP.d)return;var vb=CTP.vb||ctpFit(ctpRooms()),r=s.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,vb:vb,k:Math.max((vb[2]-vb[0])/r.width,(vb[3]-vb[1])/r.height),moved:false}});
  document.addEventListener('pointermove',function(e){if(!drag)return;var dx=(e.clientX-drag.x)*drag.k,dy=(e.clientY-drag.y)*drag.k;if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>6)drag.moved=true;if(!drag.moved)return;CTP.vb=[drag.vb[0]-dx,drag.vb[1]-dy,drag.vb[2]-dx,drag.vb[3]-dy];var s=$('#ctsvg');if(s)s.setAttribute('viewBox',ctpVB(CTP.vb))});
  document.addEventListener('pointerup',function(e){if(drag&&drag.moved){var stop=function(ev){ev.stopPropagation();ev.preventDefault();document.removeEventListener('click',stop,true)};document.addEventListener('click',stop,true);setTimeout(function(){document.removeEventListener('click',stop,true)},50)}drag=null});
})();
