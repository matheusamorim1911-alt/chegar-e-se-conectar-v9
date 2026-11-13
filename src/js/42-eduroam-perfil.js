/* ======================= eduroam: o perfil da UFRJ dentro do app =======================
   O que o geteduroam faz (lê o perfil da instituição no CAT e configura a rede), trazido para onde um site alcança:
   - iPhone, iPad e Mac: "Baixar o perfil da UFRJ" instala a rede direto pelo Safari (eduroam-ufrj.mobileconfig, cópia
     do perfil oficial, assinado pelo CAT);
   - outros aparelhos: "Configurar à mão" com os valores do perfil (método, fase 2, servidor);
   - confere o formato do usuário antes (e-mail completo), como o geteduroam;
   - Gestão › Saúde avisa quando os certificados do perfil vencem (hoje, os dois já venceram: a UFRJ precisa atualizar
     o perfil no CAT). Dados em src/eduroam_ufrj.json, gerados por tools/eduroam_ufrj.py. */
var EDU_PERFIL=__EDUROAM__;
var EDUP={usuario:'',msg:''};
function eduPerfilVencido(){var h=isoToday();return (EDU_PERFIL.cas||[]).filter(function(c){return c.ate<h})}
function eduDataBr(s){var p=String(s).split('-');return p[2]+'/'+p[1]+'/'+p[0]}
function eduUsuarioMsg(u){
  u=String(u||'').trim();if(!u)return '';
  if(/^\d[\d.\-]{9,}$/.test(u))return {c:'warn',t:'O usuário é o e-mail cadastrado no eduroam, não o CPF.'};
  if(/\s/.test(u))return {c:'warn',t:'Tire os espaços do usuário.'};
  if(!/^[^@]+@[^@]+\.[a-z]{2,}$/i.test(u))return {c:'warn',t:'Use o e-mail completo, com @ e o domínio (ex.: nome@gmail.com).'};
  return {c:'good',t:'Formato certo. A senha é a da Intranet UFRJ.'};
}
function eduPerfilHTML(pl){
  var P=EDU_PERFIL,h='',apple=pl==='ios'||pl==='mac';
  if(apple&&typeof ON_SITE!=='undefined'&&ON_SITE)h+='<div class="edup-apple"><p class="small keep"><b>Ou sem instalar app:</b> '+(pl==='ios'?'abra no Safari, toque em Permitir e depois em Ajustes › Perfil baixado › Instalar.':'abra o arquivo e instale em Ajustes do Sistema › Privacidade e Segurança › Perfis.')+' Usuário: o e-mail do passo 1. Senha: a da Intranet.</p>'+
    '<a class="copy" href="eduroam-ufrj.mobileconfig" download="eduroam-UFRJ.mobileconfig" data-eduperfil>Baixar o perfil da UFRJ</a></div>';
  var m=eduUsuarioMsg(EDUP.usuario);
  h+='<label class="fld edup-u">Confira seu usuário<input type="email" id="eduUsuario" autocomplete="off" spellcheck="false" placeholder="nome@exemplo.com" value="'+esc(EDUP.usuario)+'"></label>'+
    '<p class="small keep edup-m '+(m?m.c:'')+'" id="eduUsuarioMsg" role="status">'+(m?esc(m.t):'Não guardamos o que você digita aqui.')+'</p>';
  var dl=[['Rede',P.rede],['Segurança',P.seguranca],['Método EAP',P.metodo],['Fase 2',P.fase2],['Domínio do servidor',(P.servidor||[]).join(', ')],['Identidade','O e-mail cadastrado'],['Identidade anônima',P.anonima||'Deixe em branco']];
  var dica={android:'No Android: Configurações › Wi-Fi › eduroam. Em "Certificado CA", escolha "Usar certificados do sistema" e preencha o domínio.',
    win:'No Windows: Adicionar rede manualmente › WPA2-Enterprise › Microsoft: EAP protegido (PEAP) › EAP-MSCHAP v2.',
    linux:'No Linux (NetworkManager): Segurança "WPA e WPA2 Enterprise", autenticação "EAP protegido (PEAP)", autenticação interna MSCHAPv2 e o domínio acima.'}[pl]||'';
  h+='<details class="det edup-man"><summary>Configurar à mão</summary><dl class="cred">'+dl.map(function(x){return '<dt>'+esc(x[0])+'</dt><dd class="mono">'+esc(x[1])+'</dd>'}).join('')+'</dl>'+
    (dica?'<p class="small keep">'+esc(dica)+'</p>':'')+
    (eduPerfilVencido().length?'<p class="small keep edup-aviso">O certificado que a UFRJ publica para o eduroam está vencido. Se o aparelho não conectar com a verificação ligada, use o app geteduroam. Não desligue a verificação: alguém pode imitar a rede e capturar sua senha.</p>':'')+
    '<p class="muted small keep">Valores do perfil oficial da UFRJ no CAT do eduroam (lido em '+eduDataBr(P.lido)+').</p></details>';
  return '<div class="edup">'+h+'</div>';
}
document.addEventListener('input',function(e){if(e.target.id!=='eduUsuario')return;EDUP.usuario=e.target.value;var m=eduUsuarioMsg(EDUP.usuario),el=$('#eduUsuarioMsg');
  if(el){el.className='small keep edup-m '+(m?m.c:'');el.textContent=m?m.t:'Não guardamos o que você digita aqui.'}});
/* Gestão › Saúde: validade dos certificados do perfil */
if(typeof SAUDE_CHECKS!=='undefined')SAUDE_CHECKS.push(['eduroam','Perfil do eduroam da UFRJ (CAT)','dados embutidos no app',function(){
  var V=eduPerfilVencido(),C=EDU_PERFIL.cas||[];
  if(!C.length)return Promise.resolve({estado:'aviso',det:'Sem certificados no perfil.'});
  if(V.length)return Promise.resolve({estado:'aviso',det:'Certificados vencidos no perfil que a UFRJ publica no CAT: '+V.map(function(c){return c.nome+' ('+eduDataBr(c.ate)+')'}).join(', ')+'. Peça à TIC/UFRJ para atualizar o perfil; depois baixe o .mobileconfig de novo e rode tools/eduroam_ufrj.py.'});
  var prox=C.map(function(c){return c.ate}).sort()[0],dias=Math.floor((Date.parse(prox)-Date.now())/864e5);
  return Promise.resolve({estado:dias<60?'aviso':'ok',det:'Certificados válidos até '+eduDataBr(prox)+'.'})}]);
