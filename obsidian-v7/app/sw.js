const cacheName='obsidian-review-v7-motion4:'+self.registration.scope;
const files=['index.html','compat.js','obsidian.js','entry.js','motion-spring.js','obsidian.css','manifest.webmanifest','icon192.png','icon512.png','fonts/Manrope.ttf','fonts/Fraunces.ttf'];
self.addEventListener('install',e=>e.waitUntil(caches.open(cacheName).then(c=>c.addAll(files))));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;
 e.respondWith(caches.open(cacheName).then(async c=>(await c.match(e.request.mode==='navigate'?'index.html':e.request))||fetch(e.request)));
});

// Retire only the previous review cache for this registration scope.
self.addEventListener('activate',e=>e.waitUntil(Promise.all(['obsidian-review-v6:','obsidian-review-v7:','obsidian-review-v7-motion1:','obsidian-review-v7-motion2:','obsidian-review-v7-motion3:'].map(name=>caches.delete(name+self.registration.scope)))));
