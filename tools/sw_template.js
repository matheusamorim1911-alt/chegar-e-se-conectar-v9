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
