"""Revision 7.8 budget completion, formatting and deletion checks in isolated Chromium with synthetic data."""
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
    p.locator('[data-page=Budget]').click()
    def add_plan(name, value, monthly=False):
        p.locator('#budget-add').click()
        p.locator('#dlg [name=name]').fill(name)
        a=p.locator('#dlg [name=amount]');a.fill(value)
        if monthly:
            p.locator('#dlg [name=repeat]').select_option('monthly');p.locator('#dlg [name=months]').fill('2')
        p.locator('#dlg button.primary').click();p.wait_for_function('!document.querySelector("#dlg").open')
        return p.evaluate('(name)=>state.plans.find(x=>x.name===name).id',name)
    p.locator('#budget-add').click();p.locator('#dlg [name=name]').fill('Course')
    a=p.locator('#dlg [name=amount]');a.click();a.press_sequentially('2000000')
    assert a.input_value()=='2,000,000'
    a.fill('۲۰۰۰');assert a.input_value()=='2,000'
    a.fill('2,000,000');assert a.input_value()=='2,000,000'
    a.fill('2.5');p.locator('#dlg button.primary').click();assert 'whole-toman' in p.locator('#dlg .err').inner_text();assert p.locator('#dlg').is_visible()
    a.fill('200000');assert a.input_value()=='200,000';p.locator('#dlg button.primary').click();p.wait_for_function('!document.querySelector("#dlg").open')
    key=p.evaluate('state.plans[0].id');assert p.evaluate('state.plans[0].amount')==200000
    assert p.locator('.budget-tick, [data-plan-done]').count()==0
    p.locator(f'[data-plan-pay="{key}"]').click();p.locator('[data-pick=account][data-value=a1]').click();p.locator('[aria-label=Amount]').fill('50');p.locator('[data-action=save]').click();p.wait_for_function('!document.querySelector("#composer").open')
    assert p.evaluate('planStatus(state.plans[0],month,state.rows).remaining')==150000
    assert p.locator('.budget-completed').count()==0
    p.locator(f'[data-plan-pay="{key}"]').click();assert p.locator('[aria-label=Amount]').input_value()=='150';p.locator('[data-pick=account][data-value=a1]').click();p.locator('[data-action=save]').click();p.wait_for_function('!document.querySelector("#composer").open')
    assert p.locator('.budget-completed summary').inner_text()=='Completed (1)';assert not p.locator('.budget-completed').get_attribute('open');assert p.locator(f'[data-plan-pay="{key}"]').count()==0
    assert p.evaluate('summary(state,month).expense')==200000
    p.locator('.budget-completed summary').click();assert 'Paid' in p.locator('.budget-completed').inner_text()
    p.locator(f'[data-plan-delete="{key}"]').click();assert '2 recorded payments remain' in p.locator('#dlg').inner_text();p.locator('#close').click();p.wait_for_function('!document.querySelector("#dlg").open');assert p.evaluate('state.plans.length')==1
    p.locator(f'[data-plan-delete="{key}"]').click();p.locator('#dlg button.primary').click();p.wait_for_function('!document.querySelector("#dlg").open');assert p.evaluate('state.plans.length')==0;assert p.evaluate('summary(state,month).expense')==200000;assert p.evaluate('state.rows.length===2&&state.rows.every(r=>r.planId===undefined)');assert p.evaluate('summary(state,month).balance.a1')==800000
    k=add_plan('Monthly class','100000',True);p.locator(f'[data-plan-edit="{k}"]').click();p.locator('#dlg [name=manualComplete]').check();p.locator('#dlg button.primary').click();p.wait_for_function('!document.querySelector("#dlg").open');assert p.evaluate('summary(state,month).expense')==200000;assert p.evaluate("planStatus(state.plans[0],'1405-09',state.rows).done && !planStatus(state.plans[0],'1405-10',state.rows).done && !planStatus(state.plans[0],'1405-11',state.rows).isDue")
    p.locator('.budget-completed summary').click();p.locator(f'[data-plan-edit="{k}"]').click();p.locator('#dlg [name=manualComplete]').uncheck();p.locator('#dlg button.primary').click();p.wait_for_function('!document.querySelector("#dlg").open');assert p.locator(f'[data-plan-pay="{k}"]').is_visible()
    p.locator(f'[data-plan-pay="{k}"]').click();p.locator('[data-pick=account][data-value=a1]').click();p.locator('[data-action=save]').click();p.wait_for_function('!document.querySelector("#composer").open');assert p.evaluate("planStatus(state.plans[0],'1405-09',state.rows).done && planStatus(state.plans[0],'1405-10',state.rows).remaining===100000")
    # One-time manual completion is reversible, and does not change ledger totals.
    k2=add_plan('Headphones','500000');p.locator(f'[data-plan-edit="{k2}"]').click();p.locator('#dlg [name=manualComplete]').check();p.locator('#dlg button.primary').click();p.wait_for_function('!document.querySelector("#dlg").open');assert p.locator('.budget-completed summary').inner_text()=='Completed (2)';assert p.evaluate('summary(state,month).expense')==300000
    p.locator('.budget-completed summary').click();p.locator(f'[data-plan-edit="{k2}"]').click();p.locator('#dlg [name=manualComplete]').uncheck();p.locator('#dlg button.primary').click();p.wait_for_function('!document.querySelector("#dlg").open');assert p.locator(f'[data-plan-pay="{k2}"]').is_visible()
    # Archive and delete archived plan; prior schema without completion field still valid.
    p.locator(f'[data-plan-edit="{k2}"]').click();p.locator('#dlg [name=archived]').check();p.locator('#dlg button.primary').click();p.wait_for_function('!document.querySelector("#dlg").open');p.locator('summary',has_text='Archived plans').click();p.locator(f'[data-plan-delete="{k2}"]').click();p.locator('#dlg button.primary').click();p.wait_for_function('!document.querySelector("#dlg").open');assert p.evaluate('state.plans.length')==1
    assert p.evaluate('(()=>{let s=JSON.parse(JSON.stringify(state));delete s.plans[0].completedMonths;validate(s);validateExtras(s);return true})()')
    add_plan('New shoes','2000000');p.screenshot(path=str(root/'screenshots'/'budget-v78.png'),full_page=True)
    for width in (320,375,390,430,900):
        p.set_viewport_size({'width':width,'height':844});p.evaluate('render()');assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
    assert not errors,errors
    print('PASS: live grouping, Persian digits, invalid amount, partial/full payment, collapsed Completed, manual completion/reopen, recurring month reset, finite installments, delete/cancel/archive preserving expense balances, old plan schema, five widths.')
    browser.close()
