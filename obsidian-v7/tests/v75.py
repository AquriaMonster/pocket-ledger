"""Revision 7.5 end-to-end UI and model checks in isolated Chromium with synthetic data."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64, os
root=Path(__file__).resolve().parents[1]; app=root/'app'
html=(app/'index.html').read_text(); css=(app/'obsidian.css').read_text()
for name in ('Manrope','Fraunces'):
    css=css.replace('./fonts/'+name+'.ttf','data:font/ttf;base64,'+base64.b64encode((app/'fonts'/f'{name}.ttf').read_bytes()).decode())
html=html.replace('<link rel="stylesheet" href="./obsidian.css">','<style>'+css+'</style>')
for name in ('compat','motion-spring','entry','obsidian'):
    js=(app/f'{name}.js').read_text()
    if name=='obsidian':
        js=js.replace("sessionStorage.getItem('obsidian-review-private')",'null').replace("sessionStorage.setItem('obsidian-review-private',masked?'1':'0');",'')
    html=html.replace(f"<script src='./{name}.js'></script>",'<script>'+js+'</script>').replace(f'<script src="./{name}.js"></script>','<script>'+js+'</script>')
html=html[:html.index('<script>boot().catch')]+'''<script>
today=()=> '1405-09-07';month='1405-09';state=fresh();state.start='1405-08-01';state.accounts[1].opening=1000000;state.accounts[2].opening=100000;screenMotion='off';
save=async(next,action,before,after)=>{validate(next);validateExtras(next);next.audit.push({at:new Date().toISOString(),action,before,after});state=next;render()};render();</script></body></html>'''
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox']); p=browser.new_page(viewport={'width':390,'height':844}); errors=[];p.set_default_timeout(5000);p.on('pageerror',lambda e:errors.append(str(e)))
    p.set_content(html,wait_until='domcontentloaded');p.locator('.chart-plot').wait_for();p.evaluate('document.fonts.ready')
    assert p.locator('#nav button').count()==5 and p.locator('#nav [data-page=Budget]').count()==1
    assert p.locator('header [data-page=Settings]').count()==1
    assert p.evaluate('[55,81,80].map(n=>roundupAmount(n*1000,10000))')==[5000,9000,0]
    p.locator('[data-page=Overview]').click();p.locator('header [data-page=Settings]').click();p.locator('summary',has_text='Blu automatic savings').click();p.locator('#roundup-settings').click();p.locator('#dlg button.primary').click();p.wait_for_function('!!state.roundup?.enabled');assert p.evaluate('state.accounts.find(a=>a.id===state.roundup.to).opening')==0
    p.locator('#add').click();p.locator('[data-pick=account][data-value=a1]').click();p.locator('[aria-label=Amount]').fill('55');assert '5,000 toman' in p.locator('#round-preview').inner_text();p.locator('[data-action=save]').click();p.wait_for_function('!document.querySelector("#composer").open');assert p.evaluate('summary(state,month).expense')==55000;assert p.evaluate('summary(state,month).balance.a1')==940000;assert p.evaluate('summary(state,month).balance[state.roundup.to]')==5000;assert p.evaluate('summary(state,month).net')==1045000
    # Edit linked expense: recompute rather than double-count. Delete removes both.
    p.evaluate('entry(state.rows.find(r=>r.type==="expense"))');p.locator('[aria-label=Amount]').fill('81');p.locator('[data-action=save]').click();p.wait_for_function('!document.querySelector("#composer").open');assert p.evaluate('state.rows.length')==2;assert p.evaluate('summary(state,month).balance.a1')==910000;assert p.evaluate('summary(state,month).balance[state.roundup.to]')==9000
    p.evaluate('entry(state.rows.find(r=>r.type==="expense"))');p.locator('[data-action=delete]').click();p.locator('#dlg button.primary').click();p.wait_for_function('!document.querySelector("#dlg").open');assert p.evaluate('state.rows.length')==0
    # Budget setup, recurring installments, payment, no balance changes until recorded.
    p.locator('[data-page=Budget]').click();p.locator('#budget-add').click();p.locator('#dlg [name=name]').fill('Language class');p.locator('#dlg [name=amount]').fill('250000');p.locator('#dlg [name=repeat]').select_option('monthly');p.locator('#dlg [name=months]').fill('3');p.locator('#dlg button.primary').click();p.wait_for_function('state.plans?.length===1');assert p.evaluate('summary(state,month).net')==1100000
    assert p.evaluate("planStatus(state.plans[0],'1405-10',[]).remaining") == 250000
    assert not p.evaluate("planStatus(state.plans[0],'1405-12',[]).isDue")
    p.locator('[data-plan-pay]').click();assert p.locator('[aria-label=Amount]').input_value()=='250';p.locator('[data-pick=account][data-value=a1]').click();p.locator('[aria-label=Amount]').fill('100');p.locator('[data-action=save]').click();p.wait_for_function('!document.querySelector("#composer").open');assert p.evaluate('planStatus(state.plans[0],month,state.rows).remaining')==150000
    assert p.evaluate('summary(state,month).expense')==100000
    p.screenshot(path=str(root/'screenshots'/'budget-v75.png'))
    # New account color and removal; existing balance and last active account protected.
    p.locator('[data-page=Overview]').click();p.locator('header [data-page=Settings]').click();p.locator('summary',has_text='Accounts').click();p.locator('[data-key=accounts]:not([data-item])').click();p.locator('#dlg [name=name]').fill('Cash');p.locator('#dlg [name=color]').fill('#33cc88');p.locator('#dlg button.primary').click();p.wait_for_function("state.accounts.some(a=>a.name==='Cash')");key=p.evaluate("state.accounts.find(a=>a.name==='Cash').id")
    assert p.evaluate(f"bankColor('{key}')")=='#33cc88'
    assert p.locator('#prefs [name=theme]').count()==0
    assert 'Appearance' not in p.locator('#prefs').inner_text()
    assert p.locator('.build-version').inner_text()=='Obsidian · 7.7'
    p.evaluate("state.theme='light';render()")
    assert p.locator('html').get_attribute('data-theme')=='dark'
    p.locator('#prefs button.primary').click()
    assert p.evaluate("state.theme")=='dark'

    p.locator('[data-page=Overview]').click();assert p.locator(f'.card[data-bank="{key}"]').evaluate("e=>e.style.getPropertyValue('--tint')")=='#33cc88'
    # Wallet presentation stays separate from persisted account order and ledger calculations.
    assert p.evaluate("document.querySelector('.cards').lastElementChild.dataset.bank===state.roundup.to")
    assert p.evaluate("state.accounts.at(-1).name==='Cash'")
    assert p.evaluate("(()=>{const s=JSON.stringify(state),v=JSON.stringify(summary(state,month));render();return s===JSON.stringify(state)&&v===JSON.stringify(summary(state,month))})()")
    p.evaluate("state.roundup.enabled=false;state.accounts.find(a=>a.id===state.roundup.to).name='Renamed reserve';render()")
    assert p.evaluate("document.querySelector('.cards').lastElementChild.dataset.bank===state.roundup.to")
    p.evaluate("state.roundup.enabled=true;state.accounts.find(a=>a.id===state.roundup.to).name='Blu Savings';render()")
    p.evaluate("state.accounts.find(a=>a.id==='a0').opening=200000;state.openingDebt=500000;state.card='1234567812345678';state.rows.push({id:'loan-in',type:'received',account:'a0',amount:200000,date:today(),note:''},{id:'loan-out',type:'returned',account:'a2',amount:100000,date:today(),note:''},{id:'shahr-transfer',type:'transfer',account:'a1',to:'a0',amount:30000,date:today(),note:''},{id:'shahr-expense',type:'expense',account:'a0',cat:'c0',amount:20000,date:today(),note:''});state.audit.push({at:'2026-11-24',action:'Added transaction',before:null,after:state.rows.find(r=>r.id==='loan-out')});state.recent.account='a0';validate(state);render()")
    old_blu=p.evaluate('summary(state,month).balance.a1');old_kesh=p.evaluate('summary(state,month).balance.a2')
    p.locator('[data-page=Overview]').click();p.locator('header [data-page=Settings]').click();p.locator('summary',has_text='Accounts').click();p.locator('[data-remove-account=a0]').click();assert '4 linked transactions' in p.locator('#dlg').inner_text();assert p.locator('#removal-backup').is_visible();p.locator('#close').click();assert p.evaluate('state.openingDebt')==500000;p.locator('[data-remove-account=a0]').click();p.locator('#dlg button.primary').click();p.wait_for_function("!state.accounts.some(a=>a.id==='a0')");assert p.locator('#prefs [name=recipient]').count()==0
    p.locator('[data-page=Overview]').click();assert p.locator('.snapshot .debt').count()==0
    p.locator('[data-page=Insights]').click();assert 'Shahrdari' not in p.locator('#content').inner_text()
    p.locator('#add').click();assert p.locator('#composer [name=kind] option').all_text_contents()==['Expense','Income','Transfer'];p.locator('[data-action=close]').click()
    p.locator('[data-page=Overview]').click();p.locator('header [data-page=Settings]').click();p.locator('summary',has_text='Accounts').click();p.locator(f'[data-remove-account="{key}"]').click();p.locator('#dlg button.primary').click();p.wait_for_function(f"!state.accounts.some(a=>a.id==='{key}')")
    assert p.evaluate('state.openingDebt===0 && state.card==="" && !state.recent.account && !state.rows.some(r=>["received","returned","fill"].includes(r.type)||r.account==="a0"||r.to==="a0")')
    assert p.evaluate('summary(state,month).balance.a1')==old_blu+30000;assert p.evaluate('summary(state,month).balance.a2')==old_kesh+100000
    assert p.evaluate('!state.audit.some(e=>e.after?.id==="loan-out")')
    assert p.evaluate("(()=>{let s=clone(state);const dest=s.roundup.to;const before=summary(s,month).expense;removeAccount(s,dest);validate(s);validateExtras(s);return !s.roundup&&!s.accounts.some(a=>a.id===dest)&&s.rows.every(r=>r.to!==dest)&&summary(s,month).expense===before})()")
    assert p.evaluate("(()=>{let s=clone(state);removeAccount(s,'a1');validate(s);validateExtras(s);return !s.accounts.some(a=>a.id==='a1')&&!s.roundup&&!s.rows.some(r=>r.account==='a1'||r.to==='a1'||r.roundupParent)&&planStatus(s.plans[0],month,s.rows).remaining===250000})()")
    assert p.evaluate("(()=>{let s=clone(state);s.accounts=s.accounts.filter(a=>a.id==='a2');return !!accountRemovalInfo(s,'a2').reason})()")
    assert p.evaluate("fresh().cats.every(c=>c.name!=='Sx') && fresh().cats.find(c=>c.name==='Sobune').id==='c2'")
    assert p.evaluate("(()=>{let s=clone(state);s.cats.push({id:'c1',name:'Sx',active:true});s.rows.push({id:'old-sx',type:'expense',account:'a2',cat:'c1',amount:100,date:today(),note:''});normalizeDefaultCategories(s);validate(s);return !s.cats.find(c=>c.id==='c1').active&&s.rows.some(r=>r.id==='old-sx')})()")
    assert p.evaluate("(()=>{let s=clone(state);s.cats.push({id:'c1',name:'Sx',active:true});normalizeDefaultCategories(s);validate(s);return !s.cats.some(c=>c.id==='c1')})()")
    for width in (320,375,390,430,900):
        p.set_viewport_size({'width':width,'height':844});p.evaluate("screenMotion='off';goToPage('Overview');render()")
        def positions(): return p.evaluate("['header .brand','header .privacy'].map(sel=>{let r=document.querySelector(sel).getBoundingClientRect();return [r.x,r.y,r.width,r.height]})")
        base=positions();assert p.locator('header [data-page=Settings]').is_visible()
        for name in ('Transactions','Insights','Budget','Settings'):
            p.evaluate(f"goToPage('{name}')");assert not p.locator('header [data-page=Settings]').is_visible();current=positions();assert all(abs(a-b)<1 for x,y in zip(base,current) for a,b in zip(x,y)),(width,name,base,current)
            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
    p.set_viewport_size({'width':390,'height':844});p.evaluate("goToPage('Overview')");p.locator('header [data-page=Settings]').click();p.locator('summary',has_text='Accounts').click();p.locator('summary',has_text='Accounts').locator('..').screenshot(path=str(root/'screenshots'/'accounts-v76.png'))
    # Settings button visibly exits and enters, remains inert when away, and survives fast navigation.
    p.emulate_media(reduced_motion='reduce')
    p.evaluate("screenMotion='on';goToPage('Overview')")
    p.wait_for_function('!shortcutMotion')
    frames=p.evaluate("""async()=>{const b=settingsShortcut,positions=()=>['header .brand','header .privacy'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.x,r.y]});const base=positions();goToPage('Budget');const disabled=b.disabled&&b.getAttribute('aria-hidden')==='true';let out=[],t=performance.now();while(performance.now()-t<280){await new Promise(requestAnimationFrame);out.push({o:+getComputedStyle(b).opacity,hidden:b.hidden,pos:positions()})}const hidden=b.hidden;goToPage('Overview');let enter=[];t=performance.now();while(performance.now()-t<280){await new Promise(requestAnimationFrame);enter.push({o:+getComputedStyle(b).opacity,hidden:b.hidden,pos:positions()})}return {base,out,enter,disabled,hidden,final:!b.hidden&&!b.disabled}}""")
    assert frames['disabled'] and frames['hidden'] and frames['final'],frames
    assert any(.05<f['o']<.85 and not f['hidden'] for f in frames['out']),frames
    assert any(.05<f['o']<.85 and not f['hidden'] for f in frames['enter']),frames
    assert all(abs(a-b)<1 for f in frames['out']+frames['enter'] for x,y in zip(f['pos'],frames['base']) for a,b in zip(x,y)),frames
    p.evaluate("goToPage('Budget');goToPage('Overview');goToPage('Insights');goToPage('Overview')")
    p.wait_for_function('!shortcutMotion');assert p.locator('header .settings-shortcut').is_enabled() and p.locator('header .settings-shortcut').is_visible()
    p.evaluate("screenMotion='off';goToPage('Budget')");assert p.locator('header .settings-shortcut').is_hidden()
    p.evaluate("screenMotion='system';goToPage('Overview')");assert p.locator('header .settings-shortcut').is_visible() and p.evaluate('!shortcutMotion')
    p.emulate_media(reduced_motion='no-preference')
    # Motion when explicitly enabled, then disabled.
    p.evaluate("screenMotion='on';goToPage('Overview');resetScreenMotion()")
    samples=p.evaluate("""async()=>{document.querySelector('[data-chart-mode='+ (chartMode==='daily'?'cumulative':'daily') +']').click();let a=[],t=performance.now();while(performance.now()-t<440){await new Promise(requestAnimationFrame);a.push(+getComputedStyle(document.querySelector('.chart-plot')).opacity)}return a}""")
    assert min(samples)<.8 and samples[-1]==1,samples
    assert p.evaluate("(()=>{launchAnimation();return document.querySelector('#view').getAnimations().length>0})()")
    for width in (320,375,390,430,900):
        p.set_viewport_size({'width':width,'height':844});p.evaluate("screenMotion='off';goToPage('Budget');render()");assert p.evaluate('document.documentElement.scrollWidth<=innerWidth');p.evaluate("goToPage('Settings');render()");assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not errors,errors
    print('PASS: savings 55/81/80, atomic linked expense edit/delete, budget monthly/partial payments, custom account color, permanent account deletion and loan/transfer/savings cleanup, stable headers, default category migration, hidden Shahr features, chart/launch motion, five widths (isolated rendered harness).')
    browser.close()
