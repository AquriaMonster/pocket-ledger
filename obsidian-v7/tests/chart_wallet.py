"""Isolated Chromium UI checks; no real IndexedDB or service worker in this harness."""
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
today=()=> '1405-09-07';month='1405-09';state=fresh();state.start='1405-08-01';[8450000,14200000,7200000].forEach((n,i)=>state.accounts[i].opening=n);state.openingDebt=5000000;
state.rows=[{id:'e1',type:'expense',amount:500000,account:'a1',cat:'c0',date:'1405-09-01',note:'Sample 1'},{id:'e2',type:'expense',amount:200000,account:'a1',cat:'c0',date:'1405-09-03',note:'Sample 2'},{id:'e3',type:'expense',amount:100000,account:'a1',cat:'c0',date:'1405-08-12',note:'Prior'}];render();</script></body></html>'''
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
    p=browser.new_page(viewport={'width':390,'height':844});errors=[];p.set_default_timeout(5000);p.on('pageerror',lambda e:errors.append(str(e)))
    p.set_content(html,wait_until='domcontentloaded',timeout=8000);p.locator('.chart-plot').wait_for(timeout=5000);p.evaluate('document.fonts.ready')
    assert p.evaluate("chartSeries('1405-09',state.rows).daily")==[500000,0,200000,0,0,0,0]
    assert p.evaluate("chartSeries('1405-09',state.rows).running")==[500000,500000,700000,700000,700000,700000,700000]
    assert p.evaluate("chartSeries('1405-10',state.rows).limit")==0
    assert p.evaluate("chartSeries('1405-08',state.rows).limit")==30
    assert p.evaluate("chartSeries('1405-09',[{type:'expense',amount:999,date:'1405-09-08'}]).total")==0
    assert p.evaluate("chartSeries('1405-09',[],'1405-09-01').limit")==1
    assert p.evaluate("chartSeries('1405-12',[],'1406-01-01').limit") in (29,30)
    for width in (320,375,390,430,900):
        p.set_viewport_size({'width':width,'height':844});p.evaluate('render()')
        chart=p.locator('.chart-plot');assert chart.get_attribute('aria-valuemax')=='7'
        assert p.locator('.spending input[type=range]').count()==0
        assert p.locator('.spending output').inner_text()=='700,000 toman'
        chart.press('Home');assert chart.get_attribute('aria-valuenow')=='1';assert p.locator('.spending output').inner_text()=='500,000 toman'
        chart.press('ArrowRight');assert chart.get_attribute('aria-valuenow')=='2'
        chart.press('End');chart.press('ArrowRight');assert chart.get_attribute('aria-valuenow')=='7'
        chart.scroll_into_view_if_needed();r=chart.bounding_box();p.mouse.click(r['x']+r['width']-2,r['y']+40);assert chart.get_attribute('aria-valuenow')=='7'
        assert p.evaluate("getComputedStyle(document.querySelector('.cards')).scrollbarWidth")== 'none'
        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
        p.locator('.cards').press('End');p.wait_for_function("document.querySelector('.wallet-count').textContent==='3 / 3'")
        p.locator('.cards').press('Home');p.wait_for_function("document.querySelector('.wallet-count').textContent==='1 / 3'")
        if width==390:
            p.evaluate("document.activeElement.blur();document.querySelector('.cards').scrollTo({left:0,behavior:'auto'});window.scrollTo(0,0)");p.wait_for_function("document.querySelector('.cards').scrollLeft<1");p.screenshot(path=str(root/'screenshots'/'overview-v7.png'))
            p.locator('.spending').scroll_into_view_if_needed();p.locator('.spending').screenshot(path=str(root/'screenshots'/'chart-v4-cumulative.png'))
            p.locator('.cards').scroll_into_view_if_needed();p.locator('.cards').screenshot(path=str(root/'screenshots'/'wallet-v4.png'))
            r=p.locator('.cards').bounding_box();p.mouse.move(r['x']+r['width']*.8,r['y']+60);p.mouse.down();p.mouse.move(r['x']+15,r['y']+60,steps=12);p.mouse.up();p.wait_for_function('document.querySelector(".cards").scrollLeft>50')
    p.locator('[data-chart-mode=daily]').click();chart=p.locator('.chart-plot');assert chart.get_attribute('aria-valuemax')=='7'
    chart.press('Home');assert p.locator('.spending output').inner_text()=='500,000 toman';chart.press('ArrowRight');assert p.locator('.spending output').inner_text()=='0 toman';chart.press('ArrowRight');assert p.locator('.spending output').inner_text()=='200,000 toman'
    p.set_viewport_size({'width':390,'height':844});p.locator('.spending').screenshot(path=str(root/'screenshots'/'chart-v4-daily.png'))
    p.locator('[data-month="1405-08"]').click();assert p.evaluate('month')=='1405-08';assert p.locator('[data-chart-mode=daily]').get_attribute('aria-pressed')=='true';assert p.locator('.chart-plot').get_attribute('aria-valuemax')=='30'
    p.locator('[data-chart-mode=cumulative]').click();p.locator('[data-month="1405-09"]').click();p.locator('#add').click();inp=p.locator('#composer input[aria-label="Amount"]');assert inp.get_attribute('inputmode')=='decimal';assert p.locator('#composer .keypad').count()==0;inp.fill('50.125');assert '50,125 toman' in p.locator('#entry-unit').inner_text();assert p.locator('[data-action=save]').is_enabled();assert p.locator('[name=note]').is_visible();assert not p.locator('[data-action=review]').count();assert p.locator('#composer input[aria-label="Amount"]').input_value()=='50.125';p.locator('#composer').screenshot(path=str(root/'screenshots'/'entry-v7.png'));p.locator('#composer [data-action=close]').click();p.evaluate('state.unit=1');p.locator('#add').click();assert p.locator('#composer input[aria-label="Amount"]').get_attribute('inputmode')=='numeric';p.locator('#composer [data-action=close]').click();p.evaluate('state.unit=1000')
    for width in (320,375,390,430,900):
        p.set_viewport_size({'width':width,'height':844});p.locator('#add').click()
        select=p.locator('#composer select[name=kind]');assert select.locator('option').count()==5
        assert select.locator('option').all_text_contents()==['Expense','Income','Transfer','Shahrdari Received','Shahrdari Return']
        inp=p.locator('#composer input[aria-label=Amount]');inp.fill('50.125')
        cat=p.locator('#composer select[name=cat]');assert cat.locator('option').count()==p.evaluate('state.cats.filter(c=>c.active).length')
        last=cat.locator('option').last.get_attribute('value');cat.select_option(last)
        p.locator('[data-pick=account][data-value=a1]').click();assert cat.input_value()==last
        p.locator('[name=note]').fill('Draft note');assert cat.input_value()==last;assert inp.input_value()=='50.125'
        for typ in ('income','transfer','received','returned','expense'):
            select.select_option(typ);assert select.input_value()==typ;assert inp.input_value()=='50.125'
        assert cat.input_value()==last;assert p.locator('[name=note]').input_value()=='Draft note'
        assert p.locator('#composer').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
        if width==390:p.locator('#composer').screenshot(path=str(root/'screenshots'/'entry-v7.png'))
        p.locator('[data-action=close]').click()
        p.locator('[data-page=Insights]').click();assert p.locator('.chart-plot').count()==0;assert p.locator('.insight-section').count()==6
        assert p.locator('.insight-ring-number').text_content()=='100%';assert p.locator('.allocation-row').count()==3
        assert '100,000' in p.locator('.insight-hero').inner_text()
        assert 'Matching recorded days 1–7' in p.locator('.insights-page').inner_text()
        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
        if width==390:
            p.wait_for_function("document.querySelector('#view').getAnimations().length===0");p.screenshot(path=str(root/'screenshots'/'insights-v7.png'));p.locator('.insights-page').screenshot(path=str(root/'screenshots'/'insights-v7-full.png'),style='#nav{visibility:hidden}')
        p.locator('.privacy').click();assert p.locator('.insight-section').count()==0;assert 'Financial details hidden' in p.locator('#content').inner_text();p.locator('.privacy').click()
        p.locator('[data-page=Overview]').click();assert p.locator('.report').count()==0
    assert p.evaluate("insightData('1405-09',state.rows,'1405-09-03').covered")==5
    assert p.evaluate("insightData('1405-09',state.rows,'1405-09-03').average")==40000
    assert p.evaluate("insightData('1405-09',state.rows,'1405-08-05').comparison.from")==5
    p.evaluate("state.rows.push({id:'legacy',type:'fill',account:'a1',to:'a0',amount:1000,date:'1405-09-05',note:''})")
    p.set_viewport_size({'width':390,'height':844});p.emulate_media(reduced_motion='reduce');p.locator('[data-page=Transactions]').click();p.locator('select[name=type]').select_option('transfer');assert p.locator('[data-edit=legacy]').count()==1
    p.locator('[data-edit=legacy]').click();assert p.locator('#composer select[name=kind]').input_value()=='transfer';assert p.locator('[data-action=save]').is_enabled();p.locator('[data-action=close]').click()
    assert p.evaluate("candidateRow({id:'new',type:'transfer',account:'a1',to:'a0',raw:'1',date:'1405-09-07',note:''}).row.type")=='transfer'
    assert p.evaluate("candidateRow({type:'transfer',account:'a1',to:'a0',raw:'1',date:'1405-09-05',note:''},state.rows.find(r=>r.id==='legacy')).row.type")=='fill'
    p.locator('[data-page=Overview]').click()
    print('PASS: five user-facing types, native category dropdown, retained draft, dedicated insights, privacy, legacy fills, five widths')
    p.evaluate("month='1405-08';render()");assert p.locator('.chart-plot').get_attribute('aria-valuemax')=='30'
    p.locator('.chart-plot').press('End');assert p.locator('.spending output').inner_text()=='100,000 toman'
    p.evaluate("state.rows=[];month='1405-09';render()");assert 'No expenses recorded' in p.locator('.chart-hint').inner_text()
    assert p.locator('.date-day').text_content()=='07';assert p.locator('.date-month').text_content()=='AZAR'
    p.evaluate("today=()=> '1405-09-08';updateDateDial()")
    assert p.locator('.date-day').text_content()=='08'
    p.locator('.privacy').click();assert not p.locator('.chart-plot').count();assert not p.locator('.ring [pathLength]').count();assert p.locator('.date-day').text_content()=='08';p.locator('.privacy').click()
    p.evaluate("(()=>{window.saveCalls=0;save=async(next,action,before,after)=>{saveCalls++;validate(next);await new Promise(r=>setTimeout(r,80));next.audit.push({at:new Date().toISOString(),action,before,after});state=next;render()}})()")
    p.locator('#add').click();p.locator('[aria-label=Amount]').fill('0');p.locator('[name=note]').fill('Visible note');p.locator('[data-action=save]').click();assert p.locator('#composer .err').is_visible();assert p.evaluate('saveCalls')==0
    p.locator('[aria-label=Amount]').fill('50');p.evaluate("(()=>{const b=document.querySelector('[data-action=save]');b.click();b.click()})()")
    p.wait_for_function('!document.querySelector("#composer").open');assert p.evaluate('saveCalls')==1;assert p.evaluate('state.rows[0].note')=='Visible note';assert p.evaluate('state.rows[0].amount')==50000
    p.locator('#add').click();p.locator('[aria-label=Amount]').fill('1');p.evaluate("(()=>{save=async()=>{throw Error('Simulated storage failure')}})()");p.locator('[data-action=save]').click();assert p.locator('#composer .err').inner_text()=='Simulated storage failure';assert p.locator('[aria-label=Amount]').input_value()=='1';assert p.locator('[data-action=save]').is_enabled();p.locator('[data-action=close]').click()
    p.emulate_media(reduced_motion='no-preference');p.evaluate("document.querySelector('[data-page=Insights]').click()");assert p.evaluate("document.querySelector('#view').getAnimations().length")>0;p.emulate_media(reduced_motion='reduce');p.evaluate("document.querySelector('[data-page=Overview]').click()");assert p.evaluate("document.querySelector('#view').getAnimations().length")==0
    # Observe actual computed opacity/translation over successive animation frames.
    p.emulate_media(reduced_motion='no-preference')
    samples=p.evaluate("""async()=>{document.querySelector('[data-page=Insights]').click();const v=document.querySelector('#view');let a=[];let t=performance.now();while(performance.now()-t<520){await new Promise(requestAnimationFrame);let s=getComputedStyle(v);a.push([performance.now()-t,+s.opacity,s.transform])}return a}""")
    assert any(x[1]<.75 and x[2] not in ('none','matrix(1, 0, 0, 1, 0, 0)') for x in samples),samples
    assert samples[-1][1]==1,samples
    assert p.evaluate("document.querySelector('#view').getAnimations().length") == 0
    p.locator('[data-page=Overview]').click();p.locator('[data-page=Settings]').click();p.locator('select[aria-label="Screen transitions"]').select_option('on')
    p.emulate_media(reduced_motion='reduce');p.evaluate("document.querySelector('[data-page=Overview]').click()")
    assert p.evaluate("document.querySelector('#view').getAnimations().length")>0
    # Force motion on while the OS requests reduced motion: sheet, picker feedback and exit.
    samples=p.evaluate("""async()=>{document.querySelector('.privacy').click();let a=[];let t=performance.now();while(performance.now()-t<460){await new Promise(requestAnimationFrame);a.push(+getComputedStyle(document.querySelector('#content')).opacity)}return a}""")
    assert min(samples)<.8 and samples[-1]==1 and p.evaluate('masked'),samples
    p.locator('.privacy').click()
    p.wait_for_timeout(450)
    p.wait_for_function("document.querySelector('#view').getAnimations().length===0")
    samples=p.evaluate("""async()=>{document.querySelector('#add').click();const d=document.querySelector('#composer');let a=[];let t=performance.now();while(performance.now()-t<480){await new Promise(requestAnimationFrame);let s=getComputedStyle(d);a.push([+s.opacity,s.transform])}return a}""")
    assert any(x[0]<.8 and x[1] not in ('none','matrix(1, 0, 0, 1, 0, 0)') for x in samples),samples
    assert samples[-1][0]==1,samples
    p.locator('[aria-label=Amount]').fill('51');p.locator('[name=note]').fill('Keep this')
    samples=p.evaluate("""async()=>{document.querySelector('#composer .picker-trigger[aria-label=Category]').click();const l=document.querySelector('#composer .category-select .picker-list');let a=[];let t=performance.now();while(performance.now()-t<340){await new Promise(requestAnimationFrame);a.push(+getComputedStyle(l).opacity)}return a}""")
    assert min(samples)<.8 and samples[-1]==1,samples
    p.locator('#composer .category-select .picker-option').last.click();assert p.locator('[name=cat]').input_value()==p.locator('[name=cat] option').last.get_attribute('value')
    assert p.locator('[aria-label=Amount]').input_value()=='51' and p.locator('[name=note]').input_value()=='Keep this'
    p.locator('#composer .picker-trigger[aria-label="Transaction type"]').click();p.get_by_role('option',name='Transfer',exact=True).click();assert p.locator('[name=kind]').input_value()=='transfer';assert p.locator('[aria-label=Amount]').input_value()=='51'
    p.locator('#composer .picker-trigger[aria-label="Transaction type"]').click();p.keyboard.press('Escape');p.wait_for_function("document.querySelector('#composer .picker-list').hidden");assert p.locator('#composer').evaluate('(e)=>e.open')
    samples=p.evaluate("""async()=>{document.querySelector('[data-action=close]').click();const d=document.querySelector('#composer');let a=[];while(d.open){await new Promise(requestAnimationFrame);a.push([+getComputedStyle(d).opacity,getComputedStyle(d).transform])}return a}""")
    assert any(0<x[0]<.9 and x[1] not in ('none','matrix(1, 0, 0, 1, 0, 0)') for x in samples),samples
    p.evaluate("modal('Test modal','<p>Sample</p>',async()=>{})")
    assert p.locator('#dlg').evaluate('(e)=>e.getAnimations().length')>0
    p.locator('#close').click();p.wait_for_function('!document.querySelector("#dlg").open')
    p.locator('[data-page=Overview]').click();p.locator('[data-page=Settings]').click();p.wait_for_timeout(460)
    assert p.locator('.creation-credit').inner_text()=='Created by Aria and Buddy'
    assert p.locator('summary',has_text='Correction history').count()==0
    assert p.evaluate('Array.isArray(state.audit) && state.audit.length>0')
    assert p.locator('#backup').count()==1

    samples=p.evaluate("""async()=>{const s=[...document.querySelectorAll('summary')].find(e=>e.textContent==='Expense categories');s.click();const body=s.nextElementSibling;let a=[];let t=performance.now();while(performance.now()-t<330){await new Promise(requestAnimationFrame);a.push(+getComputedStyle(body).opacity)}return a}""")
    assert min(samples)<.8 and samples[-1]==1,samples
    p.locator('summary',has_text='Expense categories').click();p.wait_for_function("![...document.querySelectorAll('summary')].find(e=>e.textContent==='Expense categories').parentElement.open")
    p.locator('select[aria-label="Screen transitions"]').select_option('off')
    p.emulate_media(reduced_motion='no-preference');p.evaluate("document.querySelector('[data-page=Overview]').click()")
    assert p.evaluate("document.querySelector('#view').getAnimations().length")==0
    p.evaluate("document.querySelector('#add').click()")
    assert p.locator('#composer').evaluate('(e)=>e.getAnimations().length')==0
    p.evaluate("document.querySelector('[data-action=close]').click()")
    assert not p.locator('#composer').evaluate('(e)=>e.open')
    print('PASS: actual page and sheet frames, picker feedback, modal animation and motion preference override/off mode')
    print('PASS: date dial, direct save, invalid input, double submission guard, save error draft, transitions and reduced motion')
    assert not errors,errors
    print('PASS: daily/cumulative, date bounds, month chips, native amount input/direct save, chart pointer/keyboard, wallet drag, privacy, 5 viewport widths (isolated rendered harness).')
    browser.close()
