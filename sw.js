/* Chega aí UFRJ · service worker (gerado no empacotamento, versão 20261107-1807) */
var CACHE='cse-20261107-1807';
var PRE=["./", "index.html", "style.css?v=20261107-1807", "app.js?v=20261107-1807", "config.js?v=20261107-1807", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon-32.png", "mapa-blur-claro.jpg", "mapa-blur.jpg", "mapa-bordas-claro.jpg", "mapa-bordas.jpg", "mapa-campus-claro.jpg", "mapa-campus-claro.svg", "mapa-campus.jpg", "mapa-campus.svg", "mapa-mini-claro.jpg", "mapa-mini.jpg"];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(PRE.map(function(u){return c.add(u).catch(function(){})}))}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('cse-')===0&&k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  var r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;/* Firebase, clima etc. vão direto para a rede */
  if(u.pathname.endsWith('version.json'))return;/* sempre da rede: é o que avisa de versão nova */
  if(r.mode==='navigate'){/* página: rede primeiro; sem internet, a cópia guardada */
    e.respondWith(fetch(r).then(function(res){var c=res.clone();caches.open(CACHE).then(function(ca){ca.put('index.html',c)});return res}).catch(function(){return caches.match('index.html').then(function(m){return m||caches.match('./')})}));
    return;
  }
  e.respondWith(caches.match(r).then(function(m){/* arquivos: cópia guardada primeiro (têm a versão no nome) */
    return m||fetch(r).then(function(res){if(res.ok){var c=res.clone();caches.open(CACHE).then(function(ca){ca.put(r,c)})}return res});
  }));
});
