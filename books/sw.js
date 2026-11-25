const CACHE = 'paper-books-shell-v9';
const FILES = ['./','./index.html','./styles.css','./app.js?v=9','./manifest.webmanifest'];
self.addEventListener('install', e => {e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate', e => {e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('paper-books-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch', e => {
 const url=new URL(e.request.url),scope=new URL('./',self.location.href);
 if(e.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 const fresh=e.request.mode==='navigate'||/\.(?:html|js|json|txt)$/.test(url.pathname);
 e.respondWith(fetch(e.request,fresh?{cache:'no-store'}:undefined).then(async r=>{
   if(r.ok&&FILES.some(f=>new URL(f,self.location.href).href===url.href)){
     const cache=await caches.open(CACHE);await cache.put(e.request,r.clone());
   }
   return r;
 }).catch(async()=>await caches.match(e.request)||Response.error()));
});
