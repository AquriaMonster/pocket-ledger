const navPaths=['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v9l6 4', 'M4 6h16M4 12h10M4 18h13', 'M5 19V11M12 19V5M19 19v-6', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2M18 12h2M12 4v2M12 18v2'];
function navGlyph(i){return svg("0 0 24 24",'<path d="'+navPaths[i]+'"/>')}
const colors=['#E47781','#79AEF0','#69CA9F'];
const bankColor=id=>colors[['a0','a1','a2'].indexOf(id)]||'#D0B1CA';
const svg=(view,body)=>'<svg aria-hidden="true" viewBox="'+view+'">'+body+'</svg>';
const repeat=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
function engraving(id) {
  if(id==='a0')return repeat(6,i=>`<circle cx="290" cy="40" r="${30+i*22}" opacity="${.35-i*.04}"/>`);
  if(id==='a1')return repeat(14,i=>`<path d="M-20 ${30+i*12} Q 150 ${-10+i*16} 360 ${60+i*9}" opacity="${.12+i%4*.06}"/>`);
  return repeat(9,i=>`<path d="M${200+i*16} 220 C ${220+i*10} 140,${170+i*18} 80,${260+i*8} -10" opacity="${.4-i*.03}"/>`);
}
function installExample(){
 const b=document.createElement('button');b.textContent='Try fictional balances';$('view').querySelector('.setup').append(b);
 b.onclick=async()=>{b.disabled=true;try{await setOpening({start:today().slice(0,7)+'-01',a0:'8450000',a1:'14200000',a2:'7200000',debt:'5000000'})}catch(e){toast(e.message);b.disabled=false}};
}
const jalaliMonths=['Farvardin','Ordibehesht','Khordad','Tir','Mordad','Shahrivar','Mehr','Aban','Azar','Dey','Bahman','Esfand'];
function installMonthRail(change){
 const rail=document.querySelector('.month-rail');if(!rail)return;
 const first=state.start.slice(0,7),last=today().slice(0,7);
 if(month<first||month>last)month=last;
 const keys=[];for(let key=last;key>=first;key=monthShift(key,-1))keys.push(key);
 rail.innerHTML=keys.map(key=>'<button type="button" data-month="'+key+'" aria-pressed="'+(key===month)+'">'+jalaliMonths[+key.slice(5)-1]+' '+key.slice(0,4)+'</button>').join('');
 rail.onclick=e=>{const b=e.target.closest('[data-month]');if(b)change(b.dataset.month)};
 const active=rail.querySelector('[aria-pressed=true]');if(active)rail.scrollLeft=active.offsetLeft-(rail.clientWidth-active.offsetWidth)/2;
 rail.onwheel=e=>{if(Math.abs(e.deltaX)<Math.abs(e.deltaY)&&rail.scrollWidth>rail.clientWidth&&e.shiftKey){e.preventDefault();rail.scrollLeft+=e.deltaY}};
}
function updateDateDial(){
 const dial=document.querySelector('.hero .ring');if(!dial)return;
 const date=today(),name=jalaliMonths[+date.slice(5,7)-1];
 dial.querySelector('.date-day').textContent=date.slice(-2);
 dial.querySelector('.date-month').textContent=name.toUpperCase();
 dial.setAttribute('role','img');dial.setAttribute('aria-label','Today: '+date.slice(-2)+' '+name+' '+date.slice(0,4)+' (Jalali)'+(masked?'':'; ring shows account balance allocation'));
}
// Update the date without rebuilding a view or disturbing an open entry.
setInterval(updateDateDial,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateDateDial()});
function decorateOverview(){
 const v=summary(state,month),el=$('content'),hero=el.querySelector('.hero');
 const orbits=repeat(5,i=>{const r=60+i*30;return `<ellipse cx="200" cy="200" rx="${r}" ry="${r*.82}" transform="rotate(${-18+i*7} 200 200)" opacity="${.12+i*.03}" stroke-dasharray="1 5"/>`});
 hero.insertAdjacentHTML('afterbegin','<div class="orbit">'+svg('0 0 400 400',orbits)+'</div>');
 installDepth(hero);
 hero.querySelector('small').textContent='Net position · toman';
 for(const value of hero.querySelectorAll('.snapshot b'))value.textContent=value.textContent.replace(/ toman$/,'');
 const amountLine=hero.querySelector('strong').parentElement;amountLine.lastChild.nodeType===Node.TEXT_NODE && amountLine.lastChild.remove();
 const ring=document.createElement('div');ring.className='ring';
 let offset=0;
 const slices=masked||Object.entries(v.balance).some(([,n])=>n<0)||v.total<=0?'':Object.entries(v.balance).map(([id,n])=>{const start=offset;offset+=100*n/v.total;return n?`<circle cx="50" cy="50" r="39" pathLength="100" stroke="${bankColor(id)}" stroke-width="2" stroke-dasharray="${Math.max(0,offset-start-1)} 100" stroke-dashoffset="${-start}" transform="rotate(-90 50 50)"/>`:''}).join('');
 ring.innerHTML=svg('0 0 100 100','<circle cx="50" cy="50" r="47" class="ring-track"/><circle cx="50" cy="50" r="37" class="ring-dotted"/>'+slices.replaceAll('r="39"','r="43"')+'<text class="date-day" x="50" y="54" text-anchor="middle"></text><text class="date-month" x="50" y="68" text-anchor="middle"></text>');hero.prepend(ring);updateDateDial();
 const cards=el.querySelector('.cards');cards.insertAdjacentHTML('beforebegin','<h2 class="eyebrow">Wallet</h2>');
 for(const card of cards.children){card.style.setProperty('--tint',bankColor(card.dataset.bank));card.insertAdjacentHTML('afterbegin',svg('0 0 340 210',engraving(card.dataset.bank)))}
 const chart=cards.nextElementSibling;
 cards.tabIndex=0;cards.setAttribute('role','region');cards.setAttribute('aria-label','Wallet accounts');
 const walletTitle=cards.previousElementSibling,counter=document.createElement('span');
 counter.className='wallet-count';walletTitle.append(counter);
 const indicators=document.createElement('div');indicators.className='wallet-dots';indicators.setAttribute('aria-hidden','true');cards.after(indicators);
 const updateWallet=()=>{
   const list=[...cards.children];if(!list.length){counter.textContent='';indicators.replaceChildren();return}
   const x=cards.getBoundingClientRect().left,max=cards.scrollWidth-cards.clientWidth;
   const nearest=list.reduce((best,c)=>Math.abs(c.getBoundingClientRect().left-x)<Math.abs(best.getBoundingClientRect().left-x)?c:best,list[0]);
   const pos=max>1&&cards.scrollLeft>=max-2?list.length-1:list.indexOf(nearest);
   counter.textContent=(pos+1)+' / '+list.length;
   indicators.innerHTML=list.map((c,i)=>'<i class="'+(i===pos?'on':'')+'" style="background:'+bankColor(c.dataset.bank)+'"></i>').join('');
 };
 cards.onscroll=updateWallet;updateWallet();
 cards.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const list=[...cards.children],step=list[1]?list[1].offsetLeft-list[0].offsetLeft:cards.clientWidth;const max=cards.scrollWidth-cards.clientWidth;cards.scrollTo({left:e.key==='Home'?0:e.key==='End'?max:cards.scrollLeft+(e.key==='ArrowRight'?step:-step),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};
 let drag=null;
 cards.onpointerdown=e=>{if(e.pointerType!=='mouse'||e.button!==0||cards.scrollWidth<=cards.clientWidth)return;drag={x:e.clientX,left:cards.scrollLeft,id:e.pointerId,moved:false}};
 cards.onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x;if(!drag.moved&&Math.abs(dx)<5)return;if(!drag.moved){drag.moved=true;cards.classList.add('wallet-dragging');cards.setPointerCapture(e.pointerId)}cards.scrollLeft=drag.left-dx};
 const endDrag=e=>{if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=null;cards.classList.remove('wallet-dragging');if(moved){const list=[...cards.children],x=cards.getBoundingClientRect().left,max=cards.scrollWidth-cards.clientWidth;const target=list.reduce((best,c)=>Math.abs(c.getBoundingClientRect().left-x)<Math.abs(best.getBoundingClientRect().left-x)?c:best,list[0]);if(target){cards.scrollTo({left:cards.scrollLeft>=max-2?max:cards.scrollLeft+target.getBoundingClientRect().left-x,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}}};
 cards.onpointerup=cards.onpointercancel=cards.onlostpointercapture=endDrag;
 cards.onpointerleave=e=>{if(drag&&!drag.moved)endDrag(e)};

 if(masked){
   chart.innerHTML=privatePanel();
 }else drawChart(chart);
 const heading=document.querySelector('#view > .line');
 if(page==='Overview'){heading.querySelector('h1').classList.add('sr-only');chart.before(heading)}
 
}
// Insights uses only recorded expenses, including zero-spend days within the ledger's coverage.
function insightData(key,rows,opening,now=today()){
 const series=chartSeries(key,rows,now),first=key===opening.slice(0,7)?+opening.slice(-2):1;
 const covered=series.daily.slice(first-1),total=covered.reduce((a,b)=>a+b,0);
 const ranked=covered.map((amount,i)=>({day:first+i,amount})).filter(d=>d.amount>0).sort((a,b)=>b.amount-a.amount||a.day-b.day);
 const priorKey=monthShift(key,-1),prior=priorKey>=opening.slice(0,7)?chartSeries(priorKey,rows,now):null;
 let comparison=null;
 if(prior){
   const priorFirst=priorKey===opening.slice(0,7)?+opening.slice(-2):1;
   const from=Math.max(first,priorFirst),to=Math.min(series.limit,prior.limit);
   if(from<=to){const sum=a=>a.slice(from-1,to).reduce((n,v)=>n+v,0);comparison={key:priorKey,from,to,current:sum(series.daily),previous:sum(prior.daily)}}
 }
 return {first,limit:series.limit,total,covered:covered.length,average:covered.length?Math.round(total/covered.length):0,ranked,comparison};
}
function renderInsights(){
 const el=$('content');
 if(masked){el.innerHTML=privatePanel();return}
 const v=summary(state,month),d=insightData(month,state.rows,state.start),c=d.comparison;
 const section=(title,content)=>'<section class="box insight-section"><h2 class="eyebrow">'+title+'</h2>'+content+'</section>';
 const monthName=key=>jalaliMonths[+key.slice(5)-1]+' '+key.slice(0,4);
 const short=key=>jalaliMonths[+key.slice(5)-1];
 const amountText=n=>'<b>'+money(n)+'</b>';
 const comparison=c?(()=>{
   const delta=c.current-c.previous,max=Math.max(c.current,c.previous,1);
   const bar=(label,n)=>'<div class="line insight-label"><span>'+label+'</span>'+amountText(n)+'</div><div class="insight-bar"><i style="width:'+n/max*100+'%"></i></div>';
   const text=delta===0?'No change':money(Math.abs(delta))+(delta>0?' more':' less')+(c.previous?' · '+Math.abs(delta/c.previous*100).toFixed(1)+'%':'');
   return '<p class="insight-caption">Matching recorded days '+c.from+'–'+c.to+' of each month</p>'+bar(monthName(month),c.current)+bar(monthName(c.key),c.previous)+'<p class="insight-change">'+text+'</p>';
 })():'<p class="insight-caption">No comparable days in the previous month yet.</p>';
 const rankedCategories=Object.entries(v.by).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
 const categories=rankedCategories.map(([key,n])=>'<div class="line insight-label"><span>'+esc(categoryName(key))+'</span>'+amountText(n)+'</div><div class="insight-bar"><i style="width:'+n/v.expense*100+'%"></i></div>').join('')||'<p class="insight-caption">No expenses recorded this month.</p>';
 const top=rankedCategories[0],share=top&&v.expense?top[1]/v.expense*100:0;
 const categoryIntro=top?'<div class="category-intro"><div><small class="eyebrow">Top category</small><p><b>'+esc(categoryName(top[0]))+'</b> took '+Math.round(share)+'% of spending in '+short(month)+'.</p></div><div class="insight-ring" role="img" aria-label="'+Math.round(share)+' percent of spending">'+svg('0 0 100 100','<circle cx="50" cy="50" r="43" class="ring-track"/><circle cx="50" cy="50" r="36" class="ring-dotted"/><circle cx="50" cy="50" r="43" pathLength="100" stroke-dasharray="'+share+' 100" transform="rotate(-90 50 50)" class="insight-ring-arc"/><text x="50" y="58" text-anchor="middle" class="insight-ring-number">'+Math.round(share)+'%</text>')+'</div></div>':'';
 const allocation=Object.entries(v.balance),validAllocation=v.total>0&&allocation.every(([,n])=>n>=0);
 const allocationBar=validAllocation?'<div class="allocation-bar" aria-hidden="true">'+allocation.filter(([,n])=>n>0).map(([key,n])=>'<i style="flex:'+n+';background:'+bankColor(key)+'"></i>').join('')+'</div>':'';
 const allocationRows=allocation.map(([key,n])=>'<div class="line allocation-row"><span><i style="background:'+bankColor(key)+'"></i>'+esc(accountName(key))+'</span><b>'+ (validAllocation?Math.round(n/v.total*100)+'%':money(n))+'</b></div>').join('');
 const peaks=d.ranked.slice(0,3).map(item=>'<div class="entry"><span>'+item.day+' '+short(month)+'</span>'+amountText(item.amount)+'</div>').join('')||'<p class="insight-caption">No spending days yet.</p>';
 el.innerHTML='<div class="insights-page">'+section('By category',categoryIntro+categories)+section('Daily average','<strong class="insight-hero">'+figure(d.average)+'</strong> <small>toman / day</small><p class="insight-caption">'+d.covered+' recorded calendar days, including days without spending</p>'+metric('Personal income',v.income))+section('Month comparison',comparison)+section('Account allocation',allocationBar+allocationRows)+section('Highest spending days',peaks)+section('Shahrdari',metric('Still to return',v.debt)+metric('Amount to replenish '+esc(accountName('a0')),v.gap)+metric('Received this month',v.received)+metric('Returned this month',v.returned))+'</div>';
}
// Derive elapsed-day cumulative spending from ledger rows, never project future spending.
function chartSeries(key,rows,now=today()){
 const count=days(key),current=key===now.slice(0,7);
 const limit=key>now.slice(0,7)?0:current?Math.min(count,+now.slice(-2)):count;
 const daily=Array(limit).fill(0);
 for(const row of rows){const d=+row.date.slice(-2);if(row.type==='expense'&&row.date.slice(0,7)===key&&d>=1&&d<=limit)daily[d-1]+=row.amount}
 let total=0;const running=daily.map(n=>total+=n);
 return {count,current,limit,daily,running,total};
}
let chartMode='cumulative';
try{if(localStorage.getItem('obsidian-review-chart-mode')==='daily')chartMode='daily'}catch{}
function drawChart(el){
 const {count,current,limit,daily,running,total}=chartSeries(month,rowsMonth());
 const isDaily=chartMode==='daily',values=isDaily?daily:running;
 const title=isDaily?'Daily spending':'Cumulative spending';
 const modes='<div class="chart-heading"><h2 class="eyebrow">Spending</h2><div class="chart-modes" role="group" aria-label="Spending chart mode">'+['daily','cumulative'].map(mode=>'<button type="button" data-chart-mode="'+mode+'" aria-pressed="'+(chartMode===mode)+'">'+(mode==='daily'?'Daily':'Cumulative')+'</button>').join('')+'</div></div>';
 function wireModes(){el.querySelectorAll('[data-chart-mode]').forEach(b=>b.onclick=()=>{chartMode=b.dataset.chartMode;try{localStorage.setItem('obsidian-review-chart-mode',chartMode)}catch{}drawChart(el);el.querySelector('[data-chart-mode='+chartMode+']')?.focus({preventScroll:true})})}
 el.className='box spending';
 if(!limit){el.innerHTML=modes+'<p class="chart-hint">No elapsed days in this month.</p>';wireModes();return}
 const left=12,right=328,top=24,bottom=130;
 const x=day=>left+(day-1)/(count-1)*(right-left);
 const y=value=>bottom-value/Math.max(1,...values)*(bottom-top);
 const points=values.map((v,i)=>[x(i+1),y(v)]),endX=x(limit);
 const path=points.map(([px,py],i)=>i?(isDaily?'L'+px.toFixed(2)+' '+py.toFixed(2):'H'+px.toFixed(2)+' V'+py.toFixed(2)):'M'+px.toFixed(2)+' '+py.toFixed(2)).join(' ');
 const labels=[1,7,14,21,count].map(day=>`<text x="${x(day)}" y="153" text-anchor="${day===1?'start':day===count?'end':'middle'}" class="chart-axis${day>limit?' future':''}">${day}</text>`).join('');
 const future=limit<count?`<rect x="${endX}" y="${top}" width="${right-endX}" height="${bottom-top}" class="chart-future"/>`:'';
 const grid=[top,top+(bottom-top)/2,bottom].map(py=>`<path d="M${left} ${py}H${right}" class="chart-grid"/>`).join('');
 const marker=current?`<path d="M${endX} ${top}V${bottom}" class="chart-today"/>`:'';
 const area=total&&limit>1?`<path d="${path} L${endX} ${bottom} L${left} ${bottom} Z" fill="url(#spendwash)"/>`:'';
 const curve=`<path d="${path}" class="chart-curve"/>`;
 el.innerHTML=modes+'<div class="chart-reading"><output></output><span class="chart-day"></span></div><div class="chart-plot" tabindex="0" role="slider" aria-label="Inspect '+title.toLowerCase()+' by Jalali day" aria-valuemin="1" aria-valuemax="'+limit+'">'+svg('0 0 340 162','<defs><linearGradient id="spendwash" x1="0" x2="0" y1="0" y2="1"><stop stop-color="var(--primary)" stop-opacity=".18"/><stop offset="1" stop-color="var(--primary)" stop-opacity="0"/></linearGradient></defs>'+future+grid+area+curve+marker+'<line class="chart-cursor" y1="'+top+'" y2="'+bottom+'"/><circle class="chart-dot" r="3.8"/>'+labels)+'</div><p class="chart-hint">'+(total?'Drag across the chart to explore':'No expenses recorded'+(current?' so far':' this month'))+(current?' · Through today':'')+'</p>';
 const control=el.querySelector('.chart-plot'),plot=control.querySelector('svg'),dot=plot.querySelector('.chart-dot'),cursor=plot.querySelector('.chart-cursor');
 let selected=limit,active=null;
 function show(day){selected=Math.max(1,Math.min(limit,Math.round(day)));const [px,py]=points[selected-1];el.querySelector('output').textContent=money(values[selected-1]);el.querySelector('.chart-day').textContent=current&&selected===limit?'Today · day '+selected:'Day '+selected;control.setAttribute('aria-valuenow',selected);control.setAttribute('aria-valuetext','Day '+selected+', '+money(values[selected-1]));dot.setAttribute('cx',px);dot.setAttribute('cy',py);cursor.setAttribute('x1',px);cursor.setAttribute('x2',px)}
 function pick(e){const r=plot.getBoundingClientRect();if(r.width)show(1+((e.clientX-r.left)/r.width*340-left)/(right-left)*(count-1))}
 control.onpointerdown=e=>{if(e.button!==0)return;active=e.pointerId;control.setPointerCapture(e.pointerId);pick(e)};
 control.onpointermove=e=>{if(active===e.pointerId)pick(e)};
 control.onpointerup=control.onpointercancel=control.onlostpointercapture=e=>{if(active===e.pointerId)active=null};
 control.onkeydown=e=>{const keys={ArrowLeft:selected-1,ArrowDown:selected-1,ArrowRight:selected+1,ArrowUp:selected+1,Home:1,End:limit,PageDown:selected-7,PageUp:selected+7};if(!Object.hasOwn(keys,e.key))return;e.preventDefault();show(keys[e.key])};
 show(limit);wireModes();
}

const privacy=document.createElement('button');privacy.textContent='Privacy';privacy.className='privacy';document.querySelector('header').append(privacy);

let masked=sessionStorage.getItem('obsidian-review-private')==='1';
function updatePrivacy(){
 privacy.setAttribute('aria-pressed',String(masked));
 privacy.innerHTML=svg('0 0 24 24','<path d="'+(masked?'M3 3l18 18M10.6 6.1A9 9 0 0 1 21 12a12 12 0 0 1-2.4 3M6.3 6.3A12 12 0 0 0 3 12s3.5 6 9 6a8 8 0 0 0 4-1':'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z')+'"/>');
 privacy.setAttribute('aria-label',masked?'Reveal balances':'Hide balances');
}
privacy.onclick=()=>{masked=!masked;sessionStorage.setItem('obsidian-review-private',masked?'1':'0');updatePrivacy();render();selectionFeedback(privacy);animateIn($('content')||$('view'),12)};
function revealNotice(){toast('Reveal balances to edit or export your ledger.')}
updatePrivacy();
function privatePanel(){return '<p class="private-panel">Financial details hidden</p>'}
// UI-only preference; never modifies or exports financial records.
const motionKey='pocket-ledger-screen-motion';
let screenMotion='system';
try{const v=localStorage.getItem(motionKey);if(['system','on','off'].includes(v))screenMotion=v}catch{}
function resetScreenMotion(){const view=$('view');view.removeAttribute('data-screen-motion');view.removeAttribute('data-motion-force')}
function animateScreen(direction){
 const view=$('view');resetScreenMotion();
 if(!motionEnabled())return;
 if(screenMotion==='on')view.setAttribute('data-motion-force','');
 view.style.setProperty('--screen-offset',direction*24+'px');
 // Flush the reset before reapplying the animation, including rapid tab changes.
 void view.offsetWidth;
 view.setAttribute('data-screen-motion','enter');
}
function installMotionPreference(){
 const form=$('prefs');if(!form)return;
 const wrapper=document.createElement('label');wrapper.textContent='Screen transitions';
 const select=document.createElement('select');select.setAttribute('aria-label','Screen transitions');
 for(const [value,label] of [['system','Follow device (Reduce Motion)'],['on','On · smooth slide and fade'],['off','Off']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option)}
 select.value=screenMotion;select.onchange=()=>{screenMotion=select.value;try{localStorage.setItem(motionKey,screenMotion)}catch{}resetScreenMotion()};
 wrapper.append(select);form.parentNode.insertBefore(wrapper,form.nextSibling);
}
function renderNavigation(){
 const nav=$('nav');
 if(!nav.querySelector('#add')){
   const pages=['Overview','Transactions','Insights','Settings'];
   const tabs=pages.map((name,i)=>'<button type="button" data-page="'+name+'">'+navGlyph(i)+(i===1?'Activity':name)+'</button>');
   tabs.splice(2,0,'<button type="button" id="add" aria-label="Add transaction">'+svg('0 0 24 24','<path d="M12 5v14M5 12h14"/>')+'</button>');
   nav.innerHTML=tabs.join('');
   nav.onclick=e=>{
     const button=e.target.closest('button');
     if(!button||!nav.contains(button))return;
     if(button.id==='add'){entry();return}
     if(page===button.dataset.page)return;
     const direction=pages.indexOf(button.dataset.page)>pages.indexOf(page)?1:-1;
     page=button.dataset.page;render();window.scrollTo(0,0);
     animateScreen(direction);
   };
 }
 for(const tab of nav.querySelectorAll('[data-page]')){
   const active=tab.dataset.page===page;tab.classList.toggle('selected',active);
   if(active)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');
 }
}
function installDepth(hero){
 let frame=0,x=0,y=0,held=false;
 function aim(tx,ty){
   cancelAnimationFrame(frame);
   const springX=motionSpring({from:x,to:tx,stiffness:120,damping:18});
   const springY=motionSpring({from:y,to:ty,stiffness:120,damping:18});
   const start=performance.now();
   function move(now){
     if(!hero.isConnected)return;
     const a=springX(now-start),b=springY(now-start);x=a.current;y=b.current;
     hero.style.setProperty('--px',x+'px');hero.style.setProperty('--py',y+'px');
     if(!a.done||!b.done)frame=requestAnimationFrame(move);
   }
   frame=requestAnimationFrame(move);
 }
 hero.onpointerdown=e=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){held=true;hero.setPointerCapture(e.pointerId)}};
 hero.onpointermove=e=>{if(held){const r=hero.getBoundingClientRect();aim(((e.clientX-r.left)/r.width-.5)*22,((e.clientY-r.top)/r.height-.5)*18)}};
 hero.onpointerup=hero.onpointercancel=()=>{if(held){held=false;aim(0,0)}};
}
