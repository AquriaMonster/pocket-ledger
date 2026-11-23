const cacheName='pocket-ledger-shell-v5';
const files=['./index.html','./manifest.webmanifest','./icon192.png','./icon512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(c=>c.addAll(files))));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==location.origin)return;event.respondWith(caches.open(cacheName).then(async c=>{if(event.request.mode==='navigate')return await c.match('./index.html');return await c.match(event.request)||fetch(event.request)}))});

self.addEventListener('activate',e=>e.waitUntil(Promise.all(['pocket-ledger-shell-v1','pocket-ledger-shell-v2','pocket-ledger-shell-v3','pocket-ledger-shell-v4'].map(k=>caches.delete(k))).then(()=>self.clients.claim())));
