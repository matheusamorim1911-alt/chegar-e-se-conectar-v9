(function(){
  var S=window.__fbstore=window.__fbstore||{};var CL={},DL={},cb=null,cbs=[],user=null;
  function snapDoc(path){var id=path.split('/').pop();return {id:id,exists:Object.prototype.hasOwnProperty.call(S,path),data:function(){return S[path]?JSON.parse(JSON.stringify(S[path])):undefined}}}
  function colOf(path){return path.split('/').slice(0,-1).join('/')}
  function qs(col){var docs=Object.keys(S).filter(function(k){return colOf(k)===col}).map(snapDoc);return {docs:docs}}
  function notify(path){var c=colOf(path);(CL[c]||[]).forEach(function(f){setTimeout(function(){f(qs(c))},0)});(DL[path]||[]).forEach(function(f){setTimeout(function(){f(snapDoc(path))},0)})}
  function doc(path){return {get:function(){return Promise.resolve(snapDoc(path))},set:function(d,o){d=resolve(path,d);S[path]=o&&o.merge?Object.assign({},S[path]||{},d):JSON.parse(JSON.stringify(d));notify(path);return Promise.resolve()},
    delete:function(){delete S[path];notify(path);return Promise.resolve()},onSnapshot:function(f){(DL[path]=DL[path]||[]).push(f);setTimeout(function(){f(snapDoc(path))},0);return function(){DL[path]=DL[path].filter(function(x){return x!==f})}}}}
  function resolve(path,d){var cur=S[path]||{},o={};Object.keys(d).forEach(function(k){var v=d[k];if(v&&v.__inc!=null)o[k]=(+cur[k]||0)+v.__inc;else if(v&&v.__ts)o[k]=Date.now();else o[k]=v});return o}
  function col(c){return {doc:function(id){return doc(c+'/'+id)},get:function(){return Promise.resolve(qs(c))},where:function(){return this},limit:function(){return this},add:function(d){var id='a'+Math.random().toString(36).slice(2,8);return doc(c+'/'+id).set(d)},onSnapshot:function(f){(CL[c]=CL[c]||[]).push(f);setTimeout(function(){f(qs(c))},0);return function(){}}}}
  function batch(){var ops=[];return {set:function(r,d){ops.push(['set',r,d])},update:function(r,d){ops.push(['update',r,d])},delete:function(r){ops.push(['delete',r])},commit:function(){
    if(window.__batchFail)return Promise.reject({code:'permission-denied'});ops.forEach(function(o){if(o[0]==='delete')o[1].delete();else if(o[0]==='update')o[1].set(o[2],{merge:true});else o[1].set(o[2])});return Promise.resolve()}}}
  var fs={collection:col,doc:doc,batch:batch};
  var auth={onAuthStateChanged:function(f){cbs.push(f);cb=function(u){cbs.forEach(function(g){g(u)})};setTimeout(function(){f(user)},0)},getRedirectResult:function(){return Promise.resolve(null)},
    signInWithPopup:function(){user=window.__nextUser;auth.currentUser=user;setTimeout(function(){cb&&cb(user)},0);return Promise.resolve({user:user})},
    signInWithRedirect:function(){return Promise.resolve()},signOut:function(){user=null;auth.currentUser=null;setTimeout(function(){cb&&cb(null)},0);return Promise.resolve()},
    currentUser:null,
    signInWithEmailAndPassword:function(m,p){var a=ACCS[m];if(!a||a.pass!==p)return Promise.reject({code:'auth/invalid-credential'});return login(a.u)},
    createUserWithEmailAndPassword:function(m,p){if(ACCS[m])return Promise.reject({code:'auth/email-already-in-use'});if(p.length<6)return Promise.reject({code:'auth/weak-password'});
      var u=mkUser({uid:'u_'+m.split('@')[0],email:m,displayName:null,photoURL:'',emailVerified:false,providerData:[{providerId:'password'}]});ACCS[m]={pass:p,u:u};return login(u)},
    sendPasswordResetEmail:function(m){window.__resetSent=m;return Promise.resolve()}};
  var ACCS=window.__accs=window.__accs||{};
  function mkUser(u){u.updateProfile=function(o){Object.assign(u,o);return Promise.resolve()};u.sendEmailVerification=function(){window.__verifySent=(window.__verifySent||0)+1;return Promise.resolve()};
    u.reload=function(){if(window.__verifyNow)u.emailVerified=true;return Promise.resolve()};u.getIdToken=function(){return Promise.resolve('t')};return u}
  function login(u){user=u;auth.currentUser=u;setTimeout(function(){cb&&cb(user)},0);return Promise.resolve({user:u})}
  window.firebase={apps:[],initializeApp:function(){this.apps.push(1)},auth:Object.assign(function(){return auth},{GoogleAuthProvider:function(){this.setCustomParameters=function(){}}}),firestore:Object.assign(function(){return fs},{FieldValue:{serverTimestamp:function(){return {__ts:1}},increment:function(n){return {__inc:n}}}})};
})();
