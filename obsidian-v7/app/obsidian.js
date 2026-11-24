const navPaths=['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v9l6 4', 'M4 6h16M4 12h10M4 18h13', 'M5 19V11M12 19V5M19 19v-6', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2M18 12h2M12 4v2M12 18v2'];
function navGlyph(i){return svg("0 0 24 24",'<path d="'+navPaths[i]+'"/>')}
const colors=['#E47781','#79AEF0','#69CA9F'];
const bankColor=id=>{const custom=state.accounts.find(a=>a.id===id)?.color;return /^#[0-9a-f]{6}$/i.test(custom||'')?custom:colors[['a0','a1','a2'].indexOf(id)]||'#D0B1CA'};
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
 const cards=el.querySelector('.cards');
 // Keep the configured savings destination last without changing the stored account order.
 for(const card of [...cards.children]){const a=state.accounts.find(a=>a.id===card.dataset.bank);if(a&&(a.id===state.roundup?.to||a.name.trim().toLowerCase()==='blu savings'))cards.append(card)}
 cards.insertAdjacentHTML('beforebegin','<h2 class="eyebrow">Wallet</h2>');
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
 const allocation=Object.entries(v.balance).filter(([key,n])=>n!==0||state.accounts.some(a=>a.id===key&&a.active)),validAllocation=v.total>0&&allocation.every(([,n])=>n>=0);
 const allocationBar=validAllocation?'<div class="allocation-bar" aria-hidden="true">'+allocation.filter(([,n])=>n>0).map(([key,n])=>'<i style="flex:'+n+';background:'+bankColor(key)+'"></i>').join('')+'</div>':'';
 const allocationRows=allocation.map(([key,n])=>'<div class="line allocation-row"><span><i style="background:'+bankColor(key)+'"></i>'+esc(accountName(key))+'</span><b>'+ (validAllocation?Math.round(n/v.total*100)+'%':money(n))+'</b></div>').join('');
 const peaks=d.ranked.slice(0,3).map(item=>'<div class="entry"><span>'+item.day+' '+short(month)+'</span>'+amountText(item.amount)+'</div>').join('')||'<p class="insight-caption">No spending days yet.</p>';
 el.innerHTML='<div class="insights-page">'+section('By category',categoryIntro+categories)+section('Daily average','<strong class="insight-hero">'+figure(d.average)+'</strong> <small>toman / day</small><p class="insight-caption">'+d.covered+' recorded calendar days, including days without spending</p>'+metric('Personal income',v.income))+section('Month comparison',comparison)+section('Account allocation',allocationBar+allocationRows)+section('Highest spending days',peaks)+(loanVisible(v)?section('Shahrdari',metric('Still to return',v.debt)+metric('Amount to replenish '+accountName('a0'),v.gap)+metric('Received this month',v.received)+metric('Returned this month',v.returned)):'')+'</div>';
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
 function wireModes(){el.querySelectorAll('[data-chart-mode]').forEach(b=>b.onclick=()=>{if(chartMode===b.dataset.chartMode)return;chartMode=b.dataset.chartMode;try{localStorage.setItem('obsidian-review-chart-mode',chartMode)}catch{}drawChart(el);animateChartMode(el);el.querySelector('[data-chart-mode='+chartMode+']')?.focus({preventScroll:true})})}
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
   const pages=['Overview','Transactions','Insights','Budget'];
   const tabs=pages.map((name,i)=>'<button type="button" data-page="'+name+'">'+(name==='Budget'?svg('0 0 24 24','<path d="M5 7h14v14H5zM8 3v7M16 3v7M5 12h14M9 16h6"/>'):navGlyph(i))+(i===1?'Activity':name)+'</button>');
   tabs.splice(2,0,'<button type="button" id="add" aria-label="Add transaction">'+svg('0 0 24 24','<path d="M12 5v14M5 12h14"/>')+'</button>');
   nav.innerHTML=tabs.join('');
   nav.onclick=e=>{
     const button=e.target.closest('button');
     if(!button||!nav.contains(button))return;
     if(button.id==='add'){entry();return}
     if(page===button.dataset.page)return;
     goToPage(button.dataset.page);
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

// 7.5: optional extensions. Same v1 storage key; the engine permits a missing Shahr account.
function updateAccountColors(){
 let style=$('account-colors');if(!style){style=document.createElement('style');style.id='account-colors';document.head.append(style)}
 style.textContent=state.accounts.filter(a=>/^[a-z0-9-]+$/i.test(a.id)).map(a=>`[data-bank="${a.id}"]{--accent:${bankColor(a.id)}}.cards .card[data-bank="${a.id}"]{background-image:radial-gradient(ellipse at 100% 0%,${bankColor(a.id)}4b,transparent 60%),var(--sheen)}`).join('\n');
}
function colorField(a){return '<label class="account-color-field">Account color<input type="color" name="color" value="'+bankColor(a?.id)+'"></label>'}
function goToPage(name){if(page===name)return;const pages=['Overview','Transactions','Insights','Budget','Settings'];const direction=pages.indexOf(name)>pages.indexOf(page)?1:-1;page=name;render();window.scrollTo(0,0);animateScreen(direction)}
const settingsShortcut=document.createElement('button');settingsShortcut.type='button';settingsShortcut.className='settings-shortcut';settingsShortcut.dataset.page='Settings';settingsShortcut.setAttribute('aria-label','Settings');settingsShortcut.innerHTML=svg('0 0 24 24','<path d="M10 2h4l.6 3.1 2.1 1.2 3-1 2 3.5-2.4 2.1v2.2l2.4 2.1-2 3.5-3-1-2.1 1.2-.6 3.1h-4l-.6-3.1-2.1-1.2-3 1-2-3.5 2.4-2.1v-2.2L2.3 8.8l2-3.5 3 1 2.1-1.2L10 2z"/><circle cx="12" cy="12" r="3"/>');settingsShortcut.onclick=()=>goToPage('Settings');document.querySelector('header').append(settingsShortcut);
// Reserve the header grid slot throughout the exit; make the departing button inert.
let shortcutTarget=null,shortcutMotion=null;
function updateSettingsShortcut(show){
 const b=settingsShortcut, enabled=motionEnabled()&&typeof b.animate==='function';
 if(shortcutTarget===show&&(!shortcutMotion||enabled))return;
 const first=shortcutTarget===null;
 const previous=b.hidden?{opacity:0,transform:'scale(.86)'}:{opacity:getComputedStyle(b).opacity,transform:getComputedStyle(b).transform};
 shortcutTarget=show;
 if(shortcutMotion){shortcutMotion.cancel();shortcutMotion=null}
 if(!show&&document.activeElement===b)b.blur();
 b.disabled=!show;b.setAttribute('aria-hidden',String(!show));
 if(first||!enabled){b.hidden=!show;return}
 b.hidden=false;
 const animation=b.animate([previous,{opacity:show?1:0,transform:show?'scale(1)':'scale(.86)'}],{duration:220,easing:'cubic-bezier(.2,.65,.3,1)',fill:'both'});
 shortcutMotion=animation;
 animation.onfinish=()=>{if(shortcutMotion!==animation)return;b.hidden=!shortcutTarget;shortcutMotion=null;animation.cancel()};
}
function launchAnimation(){if(!motionEnabled())return;const view=$('view');animateIn(view,20);animateIn(document.querySelector('header'),-12);if($('nav').children.length)$('nav').animate([{opacity:.25,transform:'translate(-50%,20px)'},{opacity:1,transform:'translate(-50%,0)'}],{duration:420,easing:'cubic-bezier(.19,1,.28,1)'})}
function animateChartMode(el){if(!motionEnabled())return;const plot=el.querySelector('.chart-plot'),read=el.querySelector('.chart-reading');if(plot)plot.animate([{opacity:.25,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:360,easing:'cubic-bezier(.19,1,.28,1)'});if(read)selectionFeedback(read);selectionFeedback(el.querySelector('[aria-pressed=true]'))}
function validMoney(n){return Number.isSafeInteger(n)&&n>0&&n<=99999999999999}
function validateExtras(s){
 for(const a of s.accounts)check(a.color===undefined||/^#[0-9a-f]{6}$/i.test(a.color),'Invalid account color.');
 const account=i=>s.accounts.some(a=>a.id===i);
 if(s.roundup!==undefined){const r=s.roundup;check(r&&typeof r.enabled==='boolean'&&account(r.source)&&account(r.to)&&r.source!==r.to&&validMoney(r.step),'Invalid savings settings.');if(r.enabled)check(s.accounts.some(a=>a.id===r.source&&a.active)&&s.accounts.some(a=>a.id===r.to&&a.active),'Disable round-ups before deactivating either account.');}
 const plans=s.plans??[];check(Array.isArray(plans),'Invalid budget plans.');const ids=new Set();for(const p of plans){check(p&&typeof p.id==='string'&&/^[a-z0-9-]+$/i.test(p.id)&&!ids.has(p.id)&&typeof p.name==='string'&&p.name.trim()&&p.name.length<=100&&validMoney(p.amount)&&validDate(p.due)&&['once','monthly'].includes(p.repeat)&&Number.isInteger(p.months)&&p.months>=0&&p.months<=600&&typeof p.archived==='boolean'&&s.cats.some(c=>c.id===p.cat),'Invalid budget item.');ids.add(p.id)}
 const parents=new Set();for(const r of s.rows){if(r.planId!==undefined)check(r.type==='expense'&&ids.has(r.planId),'Invalid budget payment link.');if(r.roundupParent!==undefined){const parent=s.rows.find(x=>x.id===r.roundupParent);check(parent&&parent.type==='expense'&&r.type==='transfer'&&r.account===parent.account&&r.date===parent.date&&validMoney(r.roundupStep)&&r.amount===roundupAmount(parent.amount,r.roundupStep)&&!parents.has(parent.id),'Invalid linked savings transfer.');parents.add(parent.id)}}
 return s;
}
function roundupAmount(n,step){return (step-n%step)%step}
function roundupRule(draft,old){
 if(draft.type!=='expense')return null;
 const existing=old&&state.rows.find(r=>r.roundupParent===old.id);
 if(existing&&draft.account===existing.account)return {source:existing.account,to:existing.to,step:existing.roundupStep};
 const cfg=state.roundup;if(cfg?.enabled&&draft.account===cfg.source)return cfg;return null;
}
function roundupSelected(draft,old){return draft.roundup??!old}
function roundupPreview(draft,old){const rule=roundupRule(draft,old);if(!rule||!roundupSelected(draft,old))return 'No automatic transfer';try{const n=roundupAmount(amount(draft.raw,state.unit),rule.step);return n?money(n)+' to '+accountName(rule.to):'No extra transfer needed'}catch{return 'Rounds up to the next '+money(rule.step)}}
function roundupEditor(draft,old){const rule=roundupRule(draft,old);if(!rule)return '';return '<div class="roundup-row"><label><span><input type="checkbox" name="roundup" '+(roundupSelected(draft,old)?'checked':'')+'> Blu savings round-up</span></label><small id="round-preview">'+esc(roundupPreview(draft,old))+'</small></div>'}
function applyRoundup(next,row,draft,old){
 const existing=old&&state.rows.find(r=>r.roundupParent===old.id);next.rows=next.rows.filter(r=>r.roundupParent!==row.id);
 const rule=roundupRule(draft,old);if(!rule||!roundupSelected(draft,old))return;
 const n=roundupAmount(row.amount,rule.step);if(!n)return;
 next.rows.push({id:existing?.id||id(),type:'transfer',account:row.account,to:rule.to,amount:n,date:row.date,note:'Automatic Blu savings',roundupParent:row.id,roundupStep:rule.step});
}
function editLedgerRow(idValue){const row=state.rows.find(r=>r.id===idValue);if(!row)return;entry(row.roundupParent?state.rows.find(r=>r.id===row.roundupParent):row)}
function roundupSettingsHtml(){if(!state.accounts.some(a=>a.id==='a1'&&a.active))return '';const r=state.roundup;return '<details><summary>Blu automatic savings</summary><p class="muted">Track the bank’s round-up transfers separately from spending. Only applies to new expenses, never to your past entries.</p><p>'+ (r?.enabled?'Enabled · '+esc(accountName(r.to))+' · '+money(r.step)+' increment':'Not enabled')+'</p><button id="roundup-settings">Configure savings</button></details>'}
function wireRoundupSettings(){const b=$('roundup-settings');if(!b)return;b.onclick=()=>{const r=state.roundup,choices=[{id:'new',name:'Create Blu Savings'},...state.accounts.filter(a=>a.id!=='a1'&&(a.active||a.id===r?.to))];modal('Blu automatic savings','<p class="muted">For example, spending 55,000 toman moves 5,000 toman to savings with a 10,000 toman increment. Match the increment to your bank. You can turn this off for individual expenses.</p><label><span><input type="checkbox" name="enabled" '+(!r||r.enabled?'checked':'')+'> Enable Blu round-ups</span></label>'+select('Savings account','to',choices,r?.to||'new')+field('Round-up increment · full toman','step',r?.step||10000,'required inputmode="numeric"')+'<p class="muted">A new savings account starts at zero. Reconcile existing savings separately: if already included in Blu’s balance, record a transfer to savings; otherwise correct opening balances or record a documented adjustment. Do not count the same money twice.</p>',async f=>{const s=clone(state);let to=f.to;if(to==='new'){if(!f.enabled&&!r)return;const existing=s.accounts.find(a=>a.name.toLowerCase()==='blu savings');if(existing){to=existing.id;existing.active=true}else{to=id();s.accounts.push({id:to,name:'Blu Savings',opening:0,active:true,color:'#8AAEC7'})}}s.roundup={enabled:!!f.enabled,source:'a1',to,step:amount(f.step,1)};await save(s,'Updated savings settings',r||null,s.roundup)})}}
// Plans are commitments only. Actual expenses are entered in the regular ledger.
function monthDistance(a,b){const [y,m]=a.split('-').map(Number),[yy,mm]=b.split('-').map(Number);return (yy-y)*12+mm-m}
function planStatus(p,key,rows){const dueMonth=p.due.slice(0,7),delta=monthDistance(dueMonth,key);const monthly=p.repeat==='monthly';const due=monthly?delta>=0&&(!p.months||delta<p.months):delta>=0;const dueDate=monthly&&due?key+'-'+String(Math.min(+p.due.slice(-2),days(key))).padStart(2,'0'):p.due;const paid=rows.filter(r=>r.type==='expense'&&r.planId===p.id&&(monthly?r.date.slice(0,7)===key:r.date.slice(0,7)<=key)).reduce((n,r)=>n+r.amount,0);return {isDue:due,dueDate,paid,remaining:Math.max(0,p.amount-paid),future:delta<0};}
function planEditor(old){const cats=state.cats.filter(c=>c.active||c.id===old?.cat);modal(old?'Edit budget item':'New budget item',field('What are you planning?','name',old?.name,'required maxlength="100" placeholder="Class, purchase, installment…"')+field('Planned amount · full toman','amount',old?.amount,'required inputmode="numeric"')+select('Category','cat',cats,old?.cat||state.recent.cat)+select('Frequency','repeat',[{id:'once',name:'One time'},{id:'monthly',name:'Every Shamsi month'}],old?.repeat||'once')+field('First due date · Jalali YYYY-MM-DD','due',old?.due||today(),'required')+field('Number of monthly payments · 0 = ongoing','months',old?.months||0,'required inputmode="numeric"')+(old?'<label><span><input type="checkbox" name="archived" '+(old.archived?'checked':'')+'> Archive this plan</span></label>':'')+'<p class="muted">Plans do not change your bank balances. Record actual payments from Budget when you spend.</p>',async f=>{const s=clone(state);s.plans??=[];const plan={id:old?.id||id(),name:f.name.trim(),amount:amount(f.amount,1),cat:f.cat,repeat:f.repeat,due:digits(f.due),months:f.repeat==='monthly'?Number(digits(f.months)):0,archived:!!f.archived};if(old)s.plans[s.plans.findIndex(p=>p.id===old.id)]=plan;else s.plans.push(plan);await save(s,'Updated budget item',old||null,plan)})}
function renderBudget(){const plans=(state.plans||[]).filter(p=>!p.archived),all=plans.map(p=>({...p,...planStatus(p,month,state.rows)}));const active=all.filter(p=>p.isDue&&(p.repeat==='monthly'||p.due.startsWith(month)||p.remaining>0||state.rows.some(r=>r.planId===p.id&&r.date.startsWith(month)))).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));const future=all.filter(p=>p.future).sort((a,b)=>a.due.localeCompare(b.due));const remaining=active.reduce((n,p)=>n+p.remaining,0),paid=active.reduce((n,p)=>n+Math.min(p.amount,p.paid),0),planned=active.reduce((n,p)=>n+p.amount,0);const current=month===today().slice(0,7);
 const card=p=>'<article class="budget-item"><div class="line"><div><b>'+esc(p.name)+'</b><small>'+esc(categoryName(p.cat))+' · '+(p.repeat==='monthly'?'Monthly'+(p.months?' · '+p.months+' payments':''):'One time')+'</small></div><strong>'+money(p.amount)+'</strong></div><small>Due '+esc(p.dueDate)+'</small>'+(p.future?'':'<div class="budget-progress"><i style="width:'+Math.min(100,p.paid/p.amount*100)+'%"></i></div><div class="line budget-status"><span>'+ (p.remaining?money(p.remaining)+' remaining':'Paid')+'</span><span>'+money(p.paid)+' paid</span></div>')+'<div class="budget-actions"><button data-plan-edit="'+esc(p.id)+'">Edit</button>'+(current&&p.isDue&&p.remaining?'<button class="primary" data-plan-pay="'+esc(p.id)+'">Record payment</button>':'')+'</div></article>';
 $('content').innerHTML='<section class="box budget-hero"><div class="line"><h2 class="eyebrow">Planned spending</h2><button class="budget-add" id="budget-add">＋ Add plan</button></div><strong>'+money(remaining)+'</strong><small>Still to pay · selected month</small><div class="budget-progress"><i style="width:'+(planned?paid/planned*100:0)+'%"></i></div><div class="line budget-status"><span>'+money(planned)+' planned</span><span>'+money(paid)+' covered</span></div></section><section class="box budget-list"><h2 class="eyebrow">This month &amp; overdue one-time items</h2>'+(active.map(card).join('')||'<p class="muted">No planned payments for this month. Add a class, purchase or recurring bill.</p>')+'</section>'+(future.length?'<section class="box budget-list"><h2 class="eyebrow">Upcoming</h2>'+future.map(card).join('')+'</section>':'')+((state.plans||[]).some(p=>p.archived)?'<details><summary>Archived plans</summary>'+state.plans.filter(p=>p.archived).map(p=>'<div class="entry"><span>'+esc(p.name)+'</span><button data-plan-edit="'+esc(p.id)+'">Edit</button></div>').join('')+'</details>':'')+'<p class="muted budget-foot">Monthly plans track each month separately. Recording a payment creates a normal expense; plans themselves never change balances.</p>';
 $('budget-add').onclick=()=>planEditor();$('content').querySelectorAll('[data-plan-edit]').forEach(b=>b.onclick=()=>planEditor(state.plans.find(p=>p.id===b.dataset.planEdit)));$('content').querySelectorAll('[data-plan-pay]').forEach(b=>b.onclick=()=>entry(null,active.find(p=>p.id===b.dataset.planPay)));enhanceSettings();
}

// Remove an account and its linked ledger records in one atomic, validated save.
function loanEnabled(){return state.accounts.some(a=>a.id==='a0'&&a.active)||summary(state,'9999-12').debt>0}
function loanVisible(v){return loanEnabled()||v.debt>0||v.received>0||v.returned>0||v.fill>0}
function normalizeDefaultCategories(s){
 const sx=s.cats.find(c=>c.id==='c1'&&c.name==='Sx');
 if(!sx)return s;
 // Do not break references in older backups or renumber other categories.
 if(s.rows.some(r=>r.cat===sx.id)||(s.plans||[]).some(p=>p.cat===sx.id)||s.cats.length===1)sx.active=false;
 else s.cats=s.cats.filter(c=>c.id!==sx.id);
 if(s.recent.cat===sx.id)delete s.recent.cat;
 return s;
}
function accountRemovalInfo(s,key){
 const a=s.accounts.find(x=>x.id===key);check(a,'Account not found.');
 const loan=key==='a0';
 const removed=new Set(s.rows.filter(r=>r.account===key||r.to===key||(loan&&['received','returned','fill'].includes(r.type))).map(r=>r.id));
 // A deleted parent expense cannot leave its generated transfer behind.
 for(const r of s.rows)if(r.roundupParent&&removed.has(r.roundupParent))removed.add(r.id);
 const reason=!s.accounts.some(x=>x.id!==key&&x.active)?'Keep at least one active account. Add or restore another account first.':'';
 return {a,loan,removed,reason};
}
function removeAccount(s,key){
 const {loan,removed,reason}=accountRemovalInfo(s,key);check(!reason,reason);
 const disableSavings=s.roundup&&(s.roundup.source===key||s.roundup.to===key);
 const linked=new Set([key,...removed]);
 // Remove audit events that reference the deleted account/records, including loan-only records.
 // Preserve unrelated events; never add the deleted account or its data back to the audit.
 function refers(v){if(typeof v==='string')return linked.has(v);if(!v||typeof v!=='object')return false;if(loan&&['received','returned','fill'].includes(v.type))return true;return Object.entries(v).some(([k,x])=>linked.has(k)||refers(x))}
 s.audit=s.audit.filter(e=>!refers(e.before)&&!refers(e.after)&&!(loan&&/Shahrdari/i.test(e.action)));
 s.rows=s.rows.filter(r=>!removed.has(r.id));s.accounts=s.accounts.filter(a=>a.id!==key);
 if(disableSavings)delete s.roundup;
 if(s.recent.account===key)delete s.recent.account;
 if(loan){s.openingDebt=0;s.recipient='Repayment recipient';s.card='';}
 return s;
}
function wireAccountRemoval(){
 const reopen=()=>{const details=[...$('content').querySelectorAll('details')].find(d=>d.firstElementChild?.textContent==='Accounts');if(details)details.open=true;};
 $('content').querySelectorAll('[data-remove-account]').forEach(b=>b.onclick=()=>{
  const key=b.dataset.removeAccount,{a,loan,removed,reason}=accountRemovalInfo(state,key);
  if(reason){modal('Cannot remove '+a.name,'<p>'+esc(reason)+'</p>',async()=>{},'OK');return}
  const next=removeAccount(clone(state),key);validate(next);validateExtras(next);
  const before=summary(state,'9999-12'),after=summary(next,'9999-12');
  const affected=next.accounts.filter(x=>before.balance[x.id]!==after.balance[x.id]);
  const changes=affected.length?'<p>Other account balances will be recalculated:</p><ul class="removal-impact">'+affected.map(x=>'<li>'+esc(x.name)+': '+money(before.balance[x.id])+' → '+money(after.balance[x.id])+'</li>').join('')+'</ul>':'';
  modal('Permanently remove '+a.name+'?', '<p>This deletes the account, its opening balance, and '+removed.size+' linked transaction'+(removed.size===1?'':'s')+' (including both sides of transfers). Related audit entries are removed too.</p>'+ (loan?'<p>All Shahrdari loan records, debt and repayment details will also be removed. This does not settle any real-world loan.</p>':'')+(state.roundup&&(state.roundup.source===key||state.roundup.to===key)?'<p>Automatic savings will also be turned off.</p>':'')+changes+'<p class="muted">Budget payments from this account will no longer count as paid. This cannot be undone without a backup.</p><button type="button" id="removal-backup">Download backup first</button>',async()=>{const current=removeAccount(clone(state),key);await save(current,'Permanently removed account',null,{removedTransactions:removed.size});reopen()},'Delete account');
  $('removal-backup').onclick=backup;$('dlg').querySelector('button.primary').classList.add('danger-confirm');
 });
 $('content').querySelectorAll('[data-restore-account]').forEach(b=>b.onclick=async()=>{try{const next=clone(state);const a=next.accounts.find(x=>x.id===b.dataset.restoreAccount);a.active=true;await save(next,'Restored account',null,a);reopen()}catch(e){toast(e.message)}});
}
