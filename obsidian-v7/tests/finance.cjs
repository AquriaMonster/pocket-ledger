const assert=require('node:assert/strict'), fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,p),'utf8');
const html=read('../app/index.html');
const src=html.split('<script>')[1].split('</script>')[0];
const ref=read('reference/engine.js');
// Only these four changes are permitted to the original financial engine: optional Shahr account, finite gap without it, preserved loan-history integrity, and removal of the Sx default while retaining all other IDs.
const expected=ref.replace("cats:categories.map((name,i)=>({id:'c'+i,name,active:true}))", "cats:categories.map((name,i)=>({id:'c'+i,name,active:true})).filter(c=>c.id!=='c1')").replace('gap:Math.max(0,debt-balance.a0)','gap:Math.max(0,debt-(balance.a0??0))').replace("check(account('a0')&&s.accounts.every(a=>money(a.opening)),'Invalid opening balances.');","check(s.accounts.every(a=>money(a.opening))&&(account('a0')||s.openingDebt===0),'Invalid opening balances or missing loan account.');").replace("  if(r.type==='received')check(r.account==='a0','Shahrdari deposits go to the Shahr account.');","  if(r.type==='received')check(r.account==='a0','Shahrdari deposits go to the Shahr account.');\n  if(r.type==='returned')check(account('a0'),'Loan history requires the original loan account.');");
assert.equal(src,expected);
for(const [,block] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(block);
for(const file of ['obsidian.js','sw.js'])new vm.Script(read('../app/'+file));
function load(code){const c={module:{exports:{}}};vm.runInNewContext(code,c);return c.module.exports}
const old=load(ref),app=load(src),m='1403-07';
function opening(){let s=app.fresh();s.start=m+'-01';[8450000,14200000,7200000].forEach((n,i)=>s.accounts[i].opening=n);s.openingDebt=5000000;return s}
const cases=[
 ['expense',50000,'a1',{cat:'c0'},[8450000,14150000,5000000,24800000]],
 ['income',100000,'a1',{},[8450000,14300000,5000000,24950000]],
 ['transfer',200000,'a1',{to:'a0'},[8650000,14000000,5000000,24850000]],
 ['fill',200000,'a1',{to:'a0'},[8650000,14000000,5000000,24850000]],
 ['received',200000,'a0',{},[8650000,14200000,5200000,24850000]],
 ['returned',150000,'a0',{},[8300000,14200000,4850000,24850000]]
];
function compare(s,month=m){const a=app.summary(app.validate(s),month);assert.equal(JSON.stringify(a),JSON.stringify(old.summary(old.validate(JSON.parse(JSON.stringify(s))),month)));return a}
let sequence=opening();
for(const [type,amount,account,extra,expected] of cases){
 const row={id:type,type,amount,account,date:m+'-12',note:'Example',...extra},s=opening();s.rows.push(row);
 const a=compare(s);assert.deepEqual([a.balance.a0,a.balance.a1,a.debt,a.net],expected);
 for(const key of ['expense','income','fill','received','returned'])assert.equal(a[key],key===type?amount:0);
 sequence.rows.push(row);compare(sequence);console.log('PASS '+type)
}
sequence.rows[0].amount=90000;compare(sequence);sequence.rows.splice(1,1);compare(sequence);
assert.equal(compare(sequence,'1403-06').expense,0);
assert.equal(app.amount('۱۲٫۳۴۵'),12345);assert.equal(app.amount('٤٠',1),40);
assert.equal(app.amount('99999999999999',1),99999999999999);
for(const v of ['100000000000000','1.001','-5','', '1e3'])assert.throws(()=>app.amount(v,1));
assert.equal(app.days('1403-12'),30);assert.equal(app.days('1402-12'),29);assert.equal(app.monthShift('1403-12',1),'1404-01');
function invalid(edit){const s=structuredClone(sequence);edit(s);for(const e of [old,app])assert.throws(()=>e.validate(s))}
invalid(s=>s.rows[0].date='1403-07-31');invalid(s=>s.rows.push(s.rows[0]));invalid(s=>s.accounts.push(s.accounts[0]));invalid(s=>s.cats.push(s.cats[0]));invalid(s=>s.rows.find(r=>r.type==='transfer').to='a1');invalid(s=>s.rows.find(r=>r.type==='returned').amount=6000000);
invalid(s=>{s.openingDebt=0;s.rows.find(r=>r.type==='returned').date=m+'-10'});invalid(s=>s.version=2);
sequence.cats.unshift({id:'newcat',name:'Example',active:true});sequence.accounts.push({id:'a3',name:'Example',active:true,opening:0});Object.assign(sequence.rows[0],{account:'a3',cat:'newcat'});assert.equal(compare(sequence).balance.a3,-90000);
sequence.audit.push({at:'2025-01-01T00:00:00Z',action:'Edited transaction',before:{amount:1000},after:{amount:2000}});assert.equal(JSON.stringify(old.validate(JSON.parse(JSON.stringify(app.validate(sequence))))),JSON.stringify(sequence));
console.log('PASS controlled engine diff, syntax, monthly snapshots, edit/delete math, custom accounts/categories, signed balances, JSON compatibility, audit, validation, amount and calendar boundaries');

const generic=app.fresh();generic.start=m+'-01';generic.accounts=generic.accounts.filter(a=>a.id!=='a0');assert.equal(app.summary(app.validate(generic),m).gap,0);assert.throws(()=>app.validate({...generic,openingDebt:1}));console.log('PASS optional Shahr account');
