// Confere se duas partes do app usam o mesmo nome de variável no escopo principal (uma apaga a outra).
// Foi assim que o glossário parou de abrir: um módulo novo declarou "var gl" e apagou o estado do glossário.
const fs=require('fs'),path=require('path'),acorn=require('acorn');
// junta as partes de src/ no arquivo único (o mesmo que vai para o site) e analisa o código
const os=require('os'),tmp=path.join(os.tmpdir(),'app-completo-teste.html');
require('child_process').execFileSync('python3',[path.join(__dirname,'..','tools','montar.py'),tmp]);
const s=fs.readFileSync(tmp,'utf8');
const js=[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).sort((a,b)=>b.length-a.length)[0];
const ast=acorn.parse(js,{ecmaVersion:2020,locations:true});
const body=ast.body.find(n=>n.type==='ExpressionStatement'&&n.expression.type==='CallExpression').expression.callee.body.body;
const decl={},PODE=new Set(['_c']);/* nomes temporários que podem repetir */
function scan(nodes){for(const n of nodes){
  if(n.type==='VariableDeclaration')n.declarations.forEach(d=>{if(d.id.type==='Identifier')(decl[d.id.name]=decl[d.id.name]||[]).push(['var',n.loc.start.line])});
  if(n.type==='FunctionDeclaration'){(decl[n.id.name]=decl[n.id.name]||[]).push(['function',n.loc.start.line]);continue}
  for(const k of ['consequent','alternate','body','block','finalizer']){const b=n[k];if(!b)continue;if(Array.isArray(b))scan(b);else if(b.type==='BlockStatement')scan(b.body);else if(b.type==='VariableDeclaration')scan([b])}
  if(n.type==='ForStatement'&&n.init&&n.init.type==='VariableDeclaration')scan([n.init]);
  if(n.type==='TryStatement'&&n.handler)scan(n.handler.body.body);
}}
scan(body);
const dup=Object.entries(decl).filter(([k,v])=>v.length>1&&!PODE.has(k)&&!v.every(x=>x[0]==='function'));
console.log((dup.length?'FALHA':'ok   ')+'  nomes do escopo principal sem repetição'+(dup.length?' '+JSON.stringify(dup):''));
process.exit(dup.length?1:0);
