/* ======================= Prédios que faltavam na planta (cadastro da UFRJ) =======================
   A planta do mapa (mapa-campus*.svg/jpg) não tem alguns prédios, como o CENPES II, o IEN e o bloco central do CT.
   Eles vêm do cadastro de edificações da UFRJ no ArcGIS Online e são desenhados por cima da planta, na mesma cor
   dos outros prédios. Os dados são gerados por tools/edificacoes_ufrj.py (src/edificacoes.json). */
var EDIF=__EDIFICACOES__;
EDIF.rotulos.forEach(function(r){BLDN.push(r)});
function edifDraw(){
  var b=$('#baseimg');if(!b||$('#gEdif'))return;
  var g=document.createElementNS('http://www.w3.org/2000/svg','path');
  g.id='gEdif';g.setAttribute('aria-hidden','true');
  g.setAttribute('d',EDIF.predios.map(function(p){return p[1]}).join(''));
  b.appendChild(g);
}
aoFazer('mapa montado',edifDraw);
edifDraw();
