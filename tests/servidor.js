// Servidor estático mínimo para os testes (serve a raiz do repositório em http://localhost:PORT).
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const TIPOS={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
module.exports=function(port,raiz){const ROOT_=raiz?path.resolve(raiz):ROOT;return new Promise(ok=>{const s=http.createServer((req,res)=>{let u=decodeURIComponent(req.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(ROOT_,u);if(!f.startsWith(ROOT_)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end()}res.writeHead(200,{'content-type':TIPOS[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)}).listen(port,()=>ok(s))})};
