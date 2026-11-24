// Use Motion One's spring solver for sheet travel and for short view changes.
function motionEnabled(){return screenMotion==='on'||(screenMotion==='system'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)}
function animateIn(el,distance,axis='Y'){
 if(!el.animate||!motionEnabled())return;
 return el.animate([{transform:'translate'+axis+'('+distance+'px)',opacity:.4},{transform:'translate'+axis+'(0px)',opacity:1}],{duration:420,easing:'cubic-bezier(.19,1,.28,1)'});
}
function openSurface(d){
 if(!d.open)d.showModal();
 d.dataset.surfaceMotion=motionEnabled()?'enter':'none';
 animateIn(d,Math.min(d.clientHeight,480));
}
function closeSurface(d){
 if(!d.open||d.hasAttribute('data-closing'))return Promise.resolve();
 if(!motionEnabled()||!d.animate){d.close();return Promise.resolve()}
 const style=getComputedStyle(d),from=style.transform,opacity=style.opacity;
 d.getAnimations().forEach(a=>a.cancel());d.style.transform='';
 d.dataset.closing='';d.dataset.surfaceMotion='exit';
 const a=d.animate([{transform:from,opacity},{transform:'translateY('+Math.min(d.clientHeight,480)+'px)',opacity:.2}],{duration:240,easing:'ease-in',fill:'forwards'});
 return new Promise(resolve=>{const finish=()=>{d.close();d.removeAttribute('data-closing');d.removeAttribute('data-surface-motion');a.oncancel=null;a.cancel();resolve()};a.onfinish=finish;a.oncancel=finish});
}
function selectionFeedback(el){if(motionEnabled()&&el?.animate)el.animate([{opacity:.55,transform:'scale(.97)'},{opacity:1,transform:'none'}],{duration:230,easing:'ease-out'})}
// Preserve the native select as the form's value source; present an accessible,
// compact in-flow picker when JS is available. No platform popup to animate.
let activeLedgerPicker=null;
document.addEventListener('pointerdown',e=>{if(activeLedgerPicker&&!activeLedgerPicker.root.contains(e.target))activeLedgerPicker.close(false)},true);
function enhancePickers(root){
 for(const select of root.querySelectorAll('select:not([data-ledger-picker])')){
  if(select.multiple||select.size>1)continue;
  const label=select.closest('label'),name=select.getAttribute('aria-label')||label?.textContent.replace(select.textContent,'').trim()||select.name;
  if(label){const field=document.createElement('div');field.className=label.className+' picker-field';while(label.firstChild)field.append(label.firstChild);label.replaceWith(field)}
  const wrap=document.createElement('div');wrap.className='ledger-picker';select.before(wrap);wrap.append(select);
  const trigger=document.createElement('button');trigger.type='button';trigger.className='picker-trigger';trigger.setAttribute('aria-label',name);trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  const value=document.createElement('span');value.className='picker-value';trigger.append(value);const arrow=document.createElement('span');arrow.className='picker-chevron';arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';trigger.append(arrow);
  const list=document.createElement('div');list.className='picker-list';list.hidden=true;list.setAttribute('role','listbox');list.setAttribute('aria-label',name);list.id='picker-'+Math.random().toString(36).slice(2);trigger.setAttribute('aria-controls',list.id);
  wrap.append(trigger,list);select.dataset.ledgerPicker='';select.setAttribute('aria-hidden','true');select.tabIndex=-1;
  let animation=null,opened=false;
  const buttons=[...select.options].map((option,i)=>{const b=document.createElement('button');b.type='button';b.className='picker-option';b.setAttribute('role','option');b.disabled=option.disabled;b.tabIndex=-1;b.textContent=option.textContent;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();select.selectedIndex=i;sync();close(true);select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));});list.append(b);return b});
  function sync(){value.textContent=select.selectedOptions[0]?.textContent||'Choose';trigger.disabled=select.disabled;buttons.forEach((b,i)=>b.setAttribute('aria-selected',String(i===select.selectedIndex)))}
  function stop(){if(animation){animation.cancel();animation=null}}
  function close(focus){if(!opened)return;opened=false;trigger.setAttribute('aria-expanded','false');if(activeLedgerPicker?.root===wrap)activeLedgerPicker=null;stop();if(focus&&trigger.isConnected)trigger.focus({preventScroll:true});list.inert=true;
   if(motionEnabled()&&list.animate){const a=list.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-8px)'}],{duration:180,easing:'ease-in'});animation=a;a.onfinish=()=>{if(!opened)list.hidden=true;animation=null}}else list.hidden=true;
  }
  function open(){if(opened)return;if(activeLedgerPicker)activeLedgerPicker.close(false);stop();opened=true;list.hidden=false;list.inert=false;trigger.setAttribute('aria-expanded','true');activeLedgerPicker={root:wrap,close};sync();
   if(motionEnabled()&&list.animate)animation=list.animate([{opacity:.1,transform:'translateY(-12px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:300,easing:'cubic-bezier(.2,.7,.25,1)'});
   const b=buttons[select.selectedIndex]||buttons.find(x=>!x.disabled);b?.focus({preventScroll:true});if(b)list.scrollTop=Math.max(0,b.offsetTop-list.offsetTop-list.clientHeight/2);list.scrollIntoView({block:'nearest'});
  }
  trigger.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();opened?close(true):open()});
  wrap.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){e.preventDefault();e.stopPropagation();close(true);return}if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(!opened){open();return}const options=buttons.filter(b=>!b.disabled),i=options.indexOf(document.activeElement);const n=e.key==='Home'?0:e.key==='End'?options.length-1:Math.max(0,Math.min(options.length-1,i+(e.key==='ArrowDown'?1:-1)));options[n]?.focus({preventScroll:true});options[n]?.scrollIntoView({block:'nearest'})});
  wrap.addEventListener('focusout',e=>{if(opened&&e.relatedTarget&&!wrap.contains(e.relatedTarget))close(false)});
  select.addEventListener('change',()=>{sync();selectionFeedback(trigger)});sync();
 }
}
// Animate settings accordion bodies without changing their native open state semantics.
function enhanceSettings(){
 for(const d of $('content').querySelectorAll('details')){
  const summary=d.firstElementChild;if(!summary||summary.tagName!=='SUMMARY')continue;
  const body=document.createElement('div');body.className='settings-detail-body';while(summary.nextSibling)body.append(summary.nextSibling);d.append(body);
  let closing=null;
  summary.addEventListener('click',e=>{if(!motionEnabled()||!body.animate)return;e.preventDefault();if(closing){closing.cancel();closing=null;return}if(!d.open){d.open=true;body.animate([{opacity:.1,transform:'translateY(-9px)'},{opacity:1,transform:'none'}],{duration:290,easing:'ease-out'});return}const a=body.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-8px)'}],{duration:180,easing:'ease-in'});closing=a;a.onfinish=()=>{d.open=false;closing=null}});
 }
 $('content').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.closest('.ledger-picker'))selectionFeedback(b)});
}

function candidateRow(draft,old){
 const {account,cat,to}=draft;
 // Retain the legacy accounting tag when editing a qualifying historical fill. New entries are ordinary transfers.
 const type=old?.type==='fill'&&draft.type==='transfer'&&to==='a0'&&account!=='a0'?'fill':draft.type;
 const row={id:old?.id||draft.id,type,account,amount:amount(draft.raw,state.unit),date:digits(draft.date),note:draft.note.trim()};
 if(type==='expense')row.cat=cat;
 if(type==='transfer'||type==='fill')row.to=to;
 check(row.date<=today(),'Use today or an earlier date.');
 const next=clone(state);
 if(type==='expense'&&draft.planId)row.planId=draft.planId;
 if(old)next.rows[next.rows.findIndex(r=>r.id===old.id)]=row;
 else next.rows.push(row);
 applyRoundup(next,row,draft,old);
 next.recent={account,cat:row.cat||next.recent.cat};
 validate(next);
 return {row,next};
}
function entry(old,planned){
 if(masked){revealNotice();return}
 const dialog=$('composer'),trigger=document.activeElement;
 const draft=old?{...old,type:old.type==='fill'?'transfer':old.type,raw:String(old.amount/state.unit)}:{id:id(),raw:'',type:'expense',date:today(),note:'',account:state.recent.account,cat:state.recent.cat};
 if(planned){draft.planId=planned.id;draft.raw=String(planned.remaining/state.unit);draft.note=planned.name;draft.cat=planned.cat||draft.cat}
 draft.roundup=old?state.rows.some(r=>r.roundupParent===old.id):undefined;
 const accounts=state.accounts.filter(a=>a.active||[old?.account,old?.to].includes(a.id));
 const cats=state.cats.filter(c=>c.active||c.id===old?.cat||c.id===planned?.cat);
 let busy=false;
 const close=()=>!busy?closeSurface(dialog):Promise.resolve();
 dialog.onclose=()=>{if(dialog.open)return;dialog.textContent='';(trigger?.isConnected?trigger:$('add'))?.focus()};
 dialog.oncancel=e=>{e.preventDefault();close()};
 let startY=null;
 dialog.onpointerdown=e=>{
   if(!e.target.closest('.grab,.composer-head')||e.target.closest('button')||busy||dialog.hasAttribute('data-closing'))return;
   dialog.getAnimations().forEach(a=>a.cancel());startY=e.clientY;dialog.setPointerCapture(e.pointerId);
 };
 dialog.onpointermove=e=>{
   if(startY===null)return;
   dialog.style.transform='translateY('+Math.max(0,e.clientY-startY)+'px)';
 };
 dialog.onpointerup=dialog.onpointercancel=e=>{
   if(startY===null)return;
   const distance=e.clientY-startY;startY=null;dialog.style.transform='';
   if(e.type==='pointerup'&&distance>100){close();return}
   if(distance>0)animateIn(dialog,distance);
 };
 const labels={expense:'Expense',income:'Income'};if(accounts.length>=2)labels.transfer='Transfer';if(state.accounts.some(a=>a.id==='a0'&&a.active)||old?.type==='received')labels.received='Shahrdari Received';if(loanEnabled()||old?.type==='returned')labels.returned='Shahrdari Return';
 const paired=()=>draft.type==='transfer'||draft.type==='fill';
 function sources(){if(draft.type==='received')return accounts.filter(a=>a.id==='a0');return accounts.filter(a=>draft.type!=='fill'||a.id!=='a0')}
 function destinations(){return draft.type==='fill'?state.accounts.filter(a=>a.id==='a0'):accounts.filter(a=>a.id!==draft.account)}
 function selectValid(key,list){if(!list.some(o=>o.id===draft[key]))draft[key]=list[0]?.id||''}
 function header(title){return '<div class="grab" aria-hidden="true"></div><div class="composer-head"><h2 id="entry-title" tabindex="-1">'+title+'</h2><button type="button" data-action="close">Close</button></div>'}
 function chips(key,list,legend,balances){
   return '<fieldset class="pick banks"><legend>'+legend+'</legend><div>'+list.map(item=>
     '<button type="button" data-pick="'+key+'" data-value="'+esc(item.id)+'" aria-pressed="'+(draft[key]===item.id)+'" style="--bank:'+bankColor(item.id)+'"><i></i>'+esc(item.name)+'<small>'+figure(balances[item.id])+'</small></button>').join('')+'</div></fieldset>';
 }
 function editor(focusKey,focusValue){
   selectValid('account',sources());selectValid('cat',cats);if(paired())selectValid('to',destinations());
   const balances=summary(state,validDateSafe(draft.date)?digits(draft.date).slice(0,7):month).balance;
   const modes=Object.keys(labels).map(k=>({id:k,name:labels[k]}));
   const scrollTop=dialog.querySelector('.editor-scroll')?.scrollTop||0;
   dialog.innerHTML=header(old?'Edit entry':'New entry')+'<div class="editor-scroll">'+
     '<label class="entry-type"><span>Transaction type</span><select name="kind" aria-label="Transaction type">'+options(modes,draft.type)+'</select></label>'+
     '<label class="amount-display"><span class="amount-label">Amount · '+(state.unit===1000?'thousand toman':'toman')+'</span><input aria-label="Amount" inputmode="'+(state.unit===1000?'decimal':'numeric')+'" autocomplete="off" enterkeyhint="done" placeholder="0" value="'+esc(draft.raw)+'"><small id="entry-unit" aria-live="polite"></small></label>'+
     (draft.type==='expense'?('<label class="entry-type category-select"><span>Category</span><select name="cat" aria-label="Category">'+options(cats,draft.cat)+'</select></label>'):'')+
     chips('account',sources(),paired()?'From':'Account',balances)+(paired()?chips('to',destinations(),'To',balances):'')+
     roundupEditor(draft,old)+
     (draft.type==='expense'&&draft.planId?'<p class="budget-link">Budget item · '+esc(state.plans?.find(p=>p.id===draft.planId)?.name||'')+'</p>':'')+
     (draft.type==='returned'?'<p class="repay">Repayment to '+esc(state.recipient)+'</p>':'')+
     '<div class="entry-meta">'+field('Note · optional','note',draft.note,'maxlength="180" placeholder="Add a note"')+field('Jalali date','date',draft.date)+'</div>'+
     (old?'<button class="delete-entry" data-action="delete">Delete entry</button>':'')+
     '</div><div class="composer-footer"><p class="err" role="alert"></p><button class="commit" data-action="save">Save transaction</button></div>';
   dialog.querySelector('.editor-scroll').scrollTop=scrollTop;
   const typeSelect=dialog.querySelector('[name=kind]');
   typeSelect.onchange=()=>{draft.type=typeSelect.value;editor();dialog.querySelector('[name=kind]').closest('.ledger-picker').querySelector('.picker-trigger').focus({preventScroll:true});selectionFeedback(dialog.querySelector('[name=kind]').closest('.ledger-picker').querySelector('.picker-trigger'));for(const el of dialog.querySelectorAll('.pick,.category-select,.repay'))selectionFeedback(el)};
   const categorySelect=dialog.querySelector('[name=cat]');
   if(categorySelect)categorySelect.onchange=()=>{draft.cat=categorySelect.value;selectionFeedback(categorySelect)};
   function refresh(){
     const unit=state.unit===1000?'thousand toman':'toman';let full='';
     try{if(draft.raw&&state.unit===1000)full=' · '+money(amount(draft.raw,state.unit))}catch{}
     dialog.querySelector('#entry-unit').textContent=state.unit===1000?(full?full.slice(3):'100 = 100,000 toman'):'Full toman';
     const roundPreview=dialog.querySelector('#round-preview');if(roundPreview)roundPreview.textContent=roundupPreview(draft,old);
     dialog.querySelector('[data-action=save]').disabled=!draft.raw;
   }
   const roundCheck=dialog.querySelector('[name=roundup]');if(roundCheck)roundCheck.onchange=()=>{draft.roundup=roundCheck.checked;refresh()};
   const input=dialog.querySelector('[aria-label=Amount]');
   input.setSelectionRange(input.value.length,input.value.length);
   input.oninput=()=>{draft.raw=input.value;refresh()};
   input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();input.blur()}};
   for(const name of ['note','date'])dialog.querySelector('[name='+name+']').oninput=e=>draft[name]=e.target.value;
   dialog.onclick=async e=>{
     const b=e.target.closest('button');if(!b||busy||dialog.hasAttribute('data-closing'))return;
     if(b.dataset.pick){draft[b.dataset.pick]=b.dataset.value;editor(b.dataset.pick,b.dataset.value);return}
     if(b.dataset.action==='close')close();
     if(b.dataset.action==='save'){
       busy=true;b.disabled=true;dialog.querySelector('.err').textContent='';
       try{const {next,row}=candidateRow(draft,old);await save(next,old?'Edited transaction':'Added transaction',old||null,row);month=row.date.slice(0,7);render();await closeSurface(dialog)}
       catch(err){dialog.querySelector('.err').textContent=err.message;b.disabled=false}
       finally{busy=false}
     }
     if(b.dataset.action==='delete'){
       await close();modal('Delete this transaction?', '<p>'+esc(displayType(old.type))+' · '+money(old.amount)+' · '+esc(old.date)+'</p>',async()=>{const next=clone(state);next.rows=next.rows.filter(r=>r.id!==old.id&&r.roundupParent!==old.id);await save(next,'Deleted transaction',old,null)},'Delete');
     }
   };
   enhancePickers(dialog);refresh();
   if(focusKey){const selected=[...dialog.querySelectorAll('[data-pick]')].find(b=>b.dataset.pick===focusKey&&b.dataset.value===focusValue);selected?.focus({preventScroll:true});selected?.scrollIntoView({block:'nearest',inline:'nearest'});selectionFeedback(selected)}
 }
 editor();openSurface(dialog);dialog.scrollTop=0;dialog.querySelector('h2').focus();
}
function validDateSafe(date){try{return validDate(digits(date))}catch{return false}}
