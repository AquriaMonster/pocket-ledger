const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../app'),scope='https://example.invalid/review/',handlers={},cached=new Map(),deleted=[];
const cache={async addAll(files){for(const file of files){cached.set(new URL(file,scope).href,fs.readFileSync(path.join(root,file))) }},async match(key){return cached.get(new URL(key.url||key,scope).href)}};
vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),{self:{registration:{scope},addEventListener:(key,fn)=>handlers[key]=fn},caches:{async open(name){assert.equal(name,'obsidian-review-v7.8:'+scope);return cache},async delete(name){deleted.push(name);return true}},fetch(){throw Error('Offline')}});
(async()=>{
let work;handlers.install({waitUntil:p=>work=p});await work;assert.equal(cached.size,11);handlers.activate({waitUntil:p=>work=p});await work;assert.deepEqual(deleted,['obsidian-review-v6:'+scope,'obsidian-review-v7:'+scope,'obsidian-review-v7-motion1:'+scope,'obsidian-review-v7-motion2:'+scope,'obsidian-review-v7-motion3:'+scope,'obsidian-review-v7-motion4:'+scope,'obsidian-review-v7.5:'+scope,'obsidian-review-v7.6:'+scope,'obsidian-review-v7.7:'+scope]);
for(const key of ['','index.html','obsidian.css','fonts/Manrope.ttf']){let answer;handlers.fetch({request:{url:scope+key,method:'GET',mode:key?'cors':'navigate'},respondWith:p=>answer=p});assert.ok((await answer).length)}
for(const url of ['https://example.invalid/production/','https://external.invalid/'])handlers.fetch({request:{url,method:'GET'},respondWith:()=>assert.fail('cross-scope interception')});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(!html.includes("indexedDB.open('pocket-ledger-v1'"));assert.ok(html.includes("indexedDB.open('pocket-ledger-obsidian-review-v1'"));
console.log('PASS: cache install, offline routing, eleven local assets, cache namespace, DB name and out-of-scope requests (simulated worker).');
})().catch(e=>{console.error(e);process.exitCode=1});
