const CACHE="seattle-novel-v3";
const CORE=["./","./index.html","./styles.css","./app.js","./chapters.json","./manifest.webmanifest",
 ...Array.from({length:11},(_,i)=>"./chapters/"+String(i+1).padStart(2,"0")+".txt")];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(async cache=>{await Promise.allSettled(CORE.map(u=>cache.add(u)));}).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("seattle-novel-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET"||new URL(req.url).origin!==self.location.origin)return;
 const url=new URL(req.url);if(!url.pathname.includes("/novel/"))return;
 event.respondWith(fetch(req).then(response=>{
   if(response.ok)caches.open(CACHE).then(cache=>cache.put(req,response.clone())).catch(()=>{});
   return response;
 }).catch(()=>caches.match(req).then(cached=>cached||new Response("Offline",{status:503}))));
});