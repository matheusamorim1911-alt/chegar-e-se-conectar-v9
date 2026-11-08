/* ======================= Início: a aba pedida no endereço =======================
   Fica por último, depois que todas as partes carregaram: abrir uma aba desenha a tela inteira dela
   (Lugares, por exemplo, usa o Wi-Fi e o eduroam, definidos em partes posteriores). Abrir antes disso
   fazia o app parar no meio da carga quando o endereço terminava em #predios. */
if(location.hash==='#siglas')setTimeout(function(){if(cover.hidden&&login.hidden)openGloss()},0);
setTab(location.hash.slice(1));
