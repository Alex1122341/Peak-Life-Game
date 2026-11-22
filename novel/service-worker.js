const CACHE="seattle-novel-v500";
const CORE=["./","./index.html","./styles.css","./app.js","./chapters.json","./manifest.webmanifest", ...Array.from({length:5},(_,i)=>"./chapters/"+String(i+1).padStart(2,"0")+".txt")];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    await Promise.allSettled(CORE.map(path=>cache.add(path)));
  }).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("seattle-novel-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
  const path=new URL(request.url).pathname;
  if(!path.includes("/novel/"))return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok){
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}));
    }
    return response;
  }).catch(()=>caches.match(request).then(hit=>hit||new Response("Offline",{status:503}))));
});