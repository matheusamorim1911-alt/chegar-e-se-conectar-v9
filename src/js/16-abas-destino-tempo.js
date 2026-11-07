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
