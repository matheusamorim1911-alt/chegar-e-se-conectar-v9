/* Chega aí UFRJ · service worker (gerado no empacotamento, versão __VER__) */
var CACHE='cse-__VER__';
var PRE=__PRE__;
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(PRE.map(function(u){return c.add(new Request(u,{cache:'reload'})).catch(function(){})}))/* 'reload': não pega cópia velha do cache do navegador */}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('cse-')===0&&k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;/* Firebase, clima etc. vão direto para a rede */
  if(u.pathname.endsWith('version.json'))return;/* sempre da rede: é o que avisa de versão nova */
  if(r.mode==='navigate'){/* página: rede primeiro; sem internet, a cópia guardada */
    /* 'no-cache': o GitHub Pages manda guardar a página por 10 min; sem isso, "Atualizar" podia abrir a versão velha */
    e.respondWith(fetch(r.url,{cache:'no-cache',credentials:'same-origin'}).then(function(res){var c=res.clone();caches.open(CACHE).then(function(ca){ca.put('index.html',c)});return res}).catch(function(){return caches.match('index.html').then(function(m){return m||caches.match('./')})}));
    return;
  }
  e.respondWith(caches.match(r).then(function(m){/* arquivos: cópia guardada primeiro (têm a versão no nome) */
    return m||fetch(r).then(function(res){if(res.ok){var c=res.clone();caches.open(CACHE).then(function(ca){ca.put(r,c)})}return res});
  }));
});
/* Aviso de tiroteio (Web Push): o Worker manda o aviso sem conteúdo e aqui se busca onde e quando foi */
var GPS=__GPS__;
function tiroTempo(min){if(min<1)return 'agora há pouco';if(min<60)return 'há '+min+' min';var h=Math.floor(min/60),m=min%60;return 'há '+h+' h'+(m?' '+m+' min':'')}
/* alerta de ônibus: o Worker guarda o texto do aviso deste aparelho; se não houver, é aviso de tiroteio */
function avisoOnibus(){
  if(!GPS)return Promise.resolve(null);
  var pede=function(){return self.registration.pushManager.getSubscription().then(function(s){if(!s)return null;
    return fetch(GPS.replace(/\/$/,'')+'/push/aviso',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({endpoint:s.endpoint}),cache:'no-store'}).then(function(r){return r.json()}).then(function(j){return j&&j.titulo?j:null})})};
  /* o texto pode levar um instante para aparecer no servidor (o KV demora a chegar a todos os pontos): tenta mais duas vezes */
  var espera=function(ms){return function(j){return j||new Promise(function(ok){setTimeout(ok,ms)}).then(pede)}};
  return Promise.resolve().then(pede).then(espera(1500)).then(espera(2500)).catch(function(){return null});
}
self.addEventListener('push',function(e){
  var base={icon:'icon-192.png',tag:'tiroteio',renotify:true,data:{url:'./'}};
  e.waitUntil(avisoOnibus().then(function(a){
    if(a)return self.registration.showNotification(a.titulo,Object.assign({},base,{tag:a.tag||'onibus',body:a.corpo||''}));
    return (GPS?fetch(GPS.replace(/\/$/,'')+'/tiroteios',{cache:'no-store'}).then(function(r){return r.json()}):Promise.reject()).then(function(d){
    var agora=Date.now(),L=(d&&d.disponivel&&d.ocorrencias||[]).filter(function(o){return o.t&&agora-o.t<2*3600e3}),o=L[0];
    if(!o)return self.registration.showNotification('Chega aí UFRJ',Object.assign({},base,{tag:'vazio',renotify:false,silent:true,body:'Sem novidades agora.'}));
    var onde=(o.bairro||'')+(o.local&&o.local!==o.bairro?' ('+o.local+')':'');
    return self.registration.showNotification('Tiroteio perto do Fundão',Object.assign({},base,{
      body:'Tiroteio '+tiroTempo(Math.round((agora-o.t)/60000))+(onde?' em '+onde:'')+'.'+(L.length>1?' '+L.length+' registros nas últimas 2 h.':'')+' Evite a região se puder. Fonte: Fogo Cruzado.',timestamp:o.t}));
  }).catch(function(){return self.registration.showNotification('Aviso do Chega aí UFRJ',Object.assign({},base,{body:'Abra o app para ver os detalhes.'}))})}));
});
self.addEventListener('notificationclick',function(e){
  e.notification.close();var url=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    for(var i=0;i<cs.length;i++)if(cs[i].url.indexOf(self.registration.scope)===0&&'focus' in cs[i])return cs[i].focus();
    return self.clients.openWindow(url);
  }));
});
