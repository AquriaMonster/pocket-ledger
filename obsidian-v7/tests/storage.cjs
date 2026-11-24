const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../app/index.html'),'utf8');
const [,engine,interfaceCode]=html.split('<script>');
const section=(a,b)=>interfaceCode.slice(interfaceCode.indexOf(a),interfaceCode.indexOf(b));
let record;
const db={transaction(_name,mode){
 const tx={objectStore(){return {get(){const req={};queueMicrotask(()=>{req.result=structuredClone(record);req.onsuccess();if(mode==='readwrite'&&!tx.aborted)tx.oncomplete()});return req},put(value){record=structuredClone(value)}}},abort(){tx.aborted=true;tx.onabort()}};return tx;
}};
function tab(){
 const ctx=vm.createContext({db,structuredClone,render(){},toast(){},module:{exports:{}}});
 vm.runInContext(engine.split('</script>')[0]+
 ';let state=fresh(),revision=0;'+section('function read()', 'function formData(')+
 'state.start="1403-07-01";',ctx);return code=>vm.runInContext(code,ctx)
}
(async()=>{
 const a=tab(),b=tab();await a('save(structuredClone(state),"Opened",null,null)');
 await assert.rejects(b('save(structuredClone(state),"Conflict",null,null)'),/Another tab/);assert.equal(record.revision,1);
 await b('(async()=>{const r=await read();revision=r.revision;state=validate(r.state)})()');
 await b('save(structuredClone(state),"Updated",null,null)');assert.equal(record.revision,2);assert.deepEqual(record.state.audit.map(e=>e.action),['Opened','Updated']);
 const ctx=vm.createContext({state:{rows:[{id:'x',type:'expense',amount:12,note:'=SUM(9)"',account:'a1'}]},types:{expense:'Expense'},accountName:()=>'',categoryName:()=>'',download:(n,b)=>ctx.csv=b,$:()=>ctx.button,button:{}});
 const csv=interfaceCode.split('\n').find(l=>l.includes("const cell=x=>"));vm.runInContext(csv+';button.onclick()',ctx);assert.ok(ctx.csv.includes('"\'=SUM(9)"""'));console.log('PASS revision conflict, read/save roundtrip, audit and CSV escaping; IDB transaction events simulated.');
})().catch(e=>{console.error(e);process.exitCode=1});
