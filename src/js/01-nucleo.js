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
var CFG={cover:'folha',idioma:'pt',idiomaOk:false,banner:true,reps:true,coverToday:true,login:true,flow:true,bg:'brilho',font:'aparelho',fsize:'m',tema:'escuro',temaV:0,bussola:false,foto:true,perf:'auto',perfV:0,bldn:true,simples:true,simplesV:0,tabs:null,tabsOff:null,bussolaAlvo:'destino',autoDest:true,clima:true,chuva:true,faixa:10,faixaV:0,telaCheia:null,alChuva:true,alFila:false};
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
