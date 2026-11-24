'use strict';
const categories = 'Khoraki Sx Sobune Digital Qaza Fun Travel Gift Beauty Internet Other VPN Mental Health Fitness Education'.split(' ');
const types = {expense:'Expense',income:'Income',transfer:'Transfer',fill:'Shahrdari Fill',received:'Shahrdari Received',returned:'Shahrdari Return'};
function check(ok,message){if(!ok) throw Error(message)}
function digits(s){return String(s).trim().replace(/[۰-۹]/g,c=>c.charCodeAt(0)-1776).replace(/[٠-٩]/g,c=>c.charCodeAt(0)-1632).replace('٫','.')}
function amount(s,unit=1000){
 const value=digits(s);
 check(/^\d+(\.\d{1,3})?$/.test(value),'Enter a positive number or zero, without separators.');
 const [whole,fraction='']=value.split('.');
 const mills=BigInt(whole)*1000n+BigInt(fraction.padEnd(3,'0'));
 const scaled=mills*BigInt(unit);
 check(scaled%1000n===0n && scaled/1000n<=99999999999999n,'Enter a whole-toman amount within the supported range.');
 return Number(scaled/1000n);
}
function fresh(){return {version:1,start:'',accounts:['Shahr','Blu','Keshavarzi'].map((name,i)=>({id:'a'+i,name,opening:0,active:true})),cats:categories.map((name,i)=>({id:'c'+i,name,active:true})),openingDebt:0,rows:[],audit:[],unit:1000,theme:'dark',recipient:'Repayment recipient',card:'',recent:{}}}
const fmt=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'});
function persian(date){let p=Object.fromEntries(fmt.formatToParts(date).map(x=>[x.type,x.value]));return [p.year,p.month,p.day].map((n,i)=>i?String(n).padStart(2,'0'):n).join('-')}
function today(){const d=new Date();return persian(new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())))}
const monthDays=new Map();
function days(month){
 if(monthDays.has(month))return monthDays.get(month);
 const [y,m]=month.split('-').map(Number);
 check(y>=1300&&y<=1550&&m>=1&&m<=12,'Use a Jalali year from 1300 to 1550 and month 01–12.');
 let result=0;
 for(let i=-8;i<42;i++){const key=persian(new Date(Date.UTC(y+621,m+1,21+i)));if(key.startsWith(month+'-'))result=Math.max(result,Number(key.slice(-2)))}
 monthDays.set(month,result);return result;
}
function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&+s.slice(-2)>0&&+s.slice(-2)<=days(s.slice(0,7))}
function monthShift(key,n){let [y,m]=key.split('-').map(Number);let t=y*12+m-1+n;return Math.floor(t/12)+'-'+String(t%12+1).padStart(2,'0')}
function summary(s,month){
 const balance=Object.fromEntries(s.accounts.map(a=>[a.id,a.opening]));
 let debt=s.openingDebt,income=0,expense=0,fill=0,received=0,returned=0;const by={};
 for(const r of s.rows){
  const period=r.date.slice(0,7);if(period>month)continue;
  const n=r.amount;const current=period===month;
  balance[r.account]+=(['income','received'].includes(r.type)?n:-n);
  if(['transfer','fill'].includes(r.type))balance[r.to]+=n;
  if(r.type==='received'){debt+=n;if(current)received+=n}
  if(r.type==='returned'){debt-=n;if(current)returned+=n}
  if(current && r.type==='expense'){expense+=n;by[r.cat]=(by[r.cat]||0)+n}
  if(current && r.type==='income')income+=n;
  if(current && r.type==='fill')fill+=n;
 }
 const total=Object.values(balance).reduce((a,b)=>a+b,0);
 return {balance,debt,total,net:total-debt,gap:Math.max(0,debt-balance.a0),expense,income,fill,received,returned,by};
}
function validate(s){
 check(s&&s.version===1&&validDate(s.start)&&s.start<=today(),'Opening date must be valid and no later than today.');
 const money=n=>Number.isSafeInteger(n)&&n>=0&&n<=99999999999999;
 check(money(s.openingDebt)&&[1,1000].includes(s.unit),'Invalid opening debt or input unit.');
 check(['light','dark','system'].includes(s.theme)&&typeof s.recipient==='string'&&typeof s.card==='string'&&/^(\d{16})?$/.test(s.card)&&s.recent&&typeof s.recent==='object','Invalid preferences.');
 for(const collection of [s.accounts,s.cats]){
  check(Array.isArray(collection)&&collection.length,'Account or category list missing.');
  const ids=new Set(),names=new Set();
  for(const item of collection){check(typeof item.id==='string'&&/^[a-z0-9-]+$/i.test(item.id)&&!ids.has(item.id)&&typeof item.name==='string'&&item.name.trim()&&!names.has(item.name.trim().toLowerCase())&&typeof item.active==='boolean','Duplicate or invalid account/category.');ids.add(item.id);names.add(item.name.trim().toLowerCase())}
 }
 const account=id=>s.accounts.some(a=>a.id===id);
 check(account('a0')&&s.accounts.every(a=>money(a.opening)),'Invalid opening balances.');
 check(Array.isArray(s.rows)&&Array.isArray(s.audit)&&s.audit.every(e=>e&&typeof e.at==='string'&&typeof e.action==='string'),'Invalid records or audit history.');
 const ids=new Set(),daily=new Map();let bound=s.openingDebt+s.accounts.reduce((v,a)=>v+a.opening,0);
 for(const r of s.rows){
  check(r&&typeof r.id==='string'&&/^[a-z0-9-]+$/i.test(r.id)&&!ids.has(r.id),'Duplicate or invalid transaction ID.');ids.add(r.id);
  check(Object.hasOwn(types,r.type)&&money(r.amount)&&r.amount>0&&validDate(r.date)&&r.date>=s.start&&account(r.account)&&typeof r.note==='string','Check transaction amount, date, type and account.');
  if(r.type==='expense')check(s.cats.some(c=>c.id===r.cat),'Select a known expense category.');
  if(['fill','transfer'].includes(r.type))check(account(r.to)&&r.account!==r.to,'Choose two different accounts.');
  if(r.type==='received')check(r.account==='a0','Shahrdari deposits go to the Shahr account.');
  if(r.type==='fill')check(r.to==='a0','A fill must replenish the Shahr account.');
  if(['received','returned'].includes(r.type))daily.set(r.date,(daily.get(r.date)||0)+(r.type==='received'?r.amount:-r.amount));
  bound+=2*r.amount;
 }
 check(Number.isSafeInteger(bound),'Ledger exceeds the supported whole-toman range.');
 let debt=s.openingDebt;for(const date of [...daily.keys()].sort()){debt+=daily.get(date);check(debt>=0,'Repayment exceeds the outstanding debt on '+date+'.')}
 return s;
}
if(typeof module!=='undefined')module.exports={fresh,summary,validate,amount,monthShift,days};

