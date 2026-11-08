/* ======================= Prédios que faltavam na planta (cadastro da UFRJ) =======================
   A planta do mapa (mapa-campus*.svg/jpg) não tem alguns prédios, como o CENPES II, o IEN e o bloco central do CT.
   Eles vêm do cadastro de edificações da UFRJ no ArcGIS Online e são desenhados por cima da planta, na mesma cor
   dos outros prédios. Onde a planta tem prédios borrados (CENPES e CEPEL), eles são cobertos com a cor do chão e redesenhados
   pelo cadastro. Os dados são gerados por tools/edificacoes_ufrj.py (src/edificacoes.json). */
var EDIF=__EDIFICACOES__;
/* nomes no zoom pelo centro de cada lote do cadastro (o do CENPES ficava no lote vizinho, do CEPEL) */
EDIF.rotulos.forEach(function(r){BLDN.push(r)});
function edifPath(id,d){
  var g=document.createElementNS('http://www.w3.org/2000/svg','path');
  g.id=id;g.setAttribute('aria-hidden','true');g.setAttribute('d',d);return g;
}
function edifDraw(){
  var b=$('#baseimg');if(!b||$('#gEdif'))return;
  if(EDIF.apagar)b.appendChild(edifPath('gEdifFundo',EDIF.apagar));
  b.appendChild(edifPath('gEdif',EDIF.predios.map(function(p){return p[1]}).join('')));
}
aoFazer('mapa montado',edifDraw);
edifDraw();
