"""Test our private Chromium page using real pointer input and its DevTools endpoint."""
from websockets.sync.client import connect
import urllib.request,time,json,base64,os
from pathlib import Path
out=Path(__file__).resolve().parents[1]/'screenshots'
out.mkdir(exist_ok=True)
for _ in range(150):
 try:
  pages=json.load(urllib.request.urlopen('http://127.0.0.1:19285/json/list',timeout=1))
  page=next(p for p in pages if p.get('url','').startswith('http://127.0.0.1:'+os.environ['QA_PORT']))
  break
 except (OSError,StopIteration):time.sleep(.15)
else:raise RuntimeError('Review renderer unavailable')
ws=connect(page['webSocketDebuggerUrl'],max_size=10000000)
seq=0
errors=[]
def cmd(method,**kw):
 global seq
 seq+=1;ws.send(json.dumps(dict(id=seq,method=method,params=kw)))
 while True:
  result=json.loads(ws.recv(timeout=8))
  if result.get('method')=='Runtime.exceptionThrown':errors.append(result['params']['exceptionDetails'])
  if result.get('id')==seq:
   if 'error' in result:raise RuntimeError(result['error'])
   return result['result']
def js(code):
 r=cmd('Runtime.evaluate',expression=code,returnByValue=True,awaitPromise=True)
 if 'exceptionDetails' in r:raise RuntimeError(r['exceptionDetails'].get('exception'))
 return r.get('result',{}).get('value')
def wait(code):
 for _ in range(100):
  if js(code):return
  time.sleep(.06)
 raise RuntimeError(f'Condition failed {code} | '+str(js('document.body.innerText'))[:1200]+str(errors)[:400])
def click(selector,touch=False):
 sel=json.dumps(selector)
 geo=js(f"""(()=>{{const e=document.querySelector({sel});if(!e)throw Error({sel});e.scrollIntoView({{block:e.closest('#nav,#composer')?'nearest':'center',inline:'nearest'}});const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,h=document.elementFromPoint(x,y);return {{x,y,hit:e.contains(h)||e.closest('button')?.contains(h),target:h?.outerHTML?.slice(0,160)}}}})()""")
 assert geo['hit'],(selector,geo)
 if touch:
  cmd('Input.dispatchTouchEvent',type='touchStart',touchPoints=[{'x':geo['x'],'y':geo['y']}]);cmd('Input.dispatchTouchEvent',type='touchEnd',touchPoints=[]);return
 for event in ['mousePressed','mouseReleased']:cmd('Input.dispatchMouseEvent',type=event,x=geo['x'],y=geo['y'],button='left',clickCount=1)
def audit(screen):
 if not os.environ.get('AXE_JS'):return
 code=Path(os.environ['AXE_JS']).read_text()
 js(code)
 report=js("""axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}).then(r=>({violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({selector:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(x=>x.id)}))""")
 (out.parent/'tests'/('accessibility-'+screen+'.json')).write_text(json.dumps(report,indent=2))
 print('axe',screen,[v['id'] for v in report['violations']],flush=True)
def shot(name):
 time.sleep(.6)
 (out/(name+'.png')).write_bytes(base64.b64decode(cmd('Page.captureScreenshot',format='png')['data']))
cmd('Runtime.enable');cmd('Page.enable')
print('Engine',js('navigator.userAgent'),flush=True)
wait("document.querySelector('.setup > button:last-child')?.textContent==='Try fictional balances'")
click('.setup > button:last-child');wait("!!document.querySelector('.hero')")
for w in [320,390,375,430]:
 cmd('Emulation.setDeviceMetricsOverride',width=w,height=844 if w>320 else 640,deviceScaleFactor=1,mobile=True)
 for tab in ['Transactions','Insights','Settings','Overview']:
  click(f'[data-page="{tab}"] svg')
  wait(f'document.querySelector("[aria-current=page]").dataset.page==="{tab}"')
  assert js('document.documentElement.scrollWidth<=innerWidth'),w
 if w==390:audit('overview')
 if w in [320,390]:
  wait("document.querySelector('#toast').textContent===''");shot(f'overview-{w}')
 assert js("Math.abs((document.querySelector('#add').getBoundingClientRect().left+document.querySelector('#add').offsetWidth/2)-innerWidth/2)<3"),w
 click('#add svg');wait("document.querySelector('#composer').open");time.sleep(.6)
 assert js("document.querySelector('#composer').scrollWidth<=document.querySelector('#composer').clientWidth")
 if w==390:audit('entry')
 if w in [320,390]:
  click('#composer input[aria-label=Amount]');cmd('Input.insertText',text='50');shot(f'entry-{w}')
 click('#composer [data-action=close]')
print('PASS four widths, 16 icon taps, all Add hit targets',flush=True)
for typ,amt in [('expense','50'),('income','100'),('transfer','200'),('received','200'),('returned','150')]:
 click('#add');time.sleep(.55);js(f"(()=>{{{{const el=document.querySelector('[name=kind]');el.value={json.dumps(typ)};el.dispatchEvent(new Event('change'))}}}})()")
 if typ!='received':click('[data-pick="account"][data-value="a1"]')
 if typ=='transfer':click('[data-pick="to"][data-value="a0"]')
 click('#composer input[aria-label=Amount]');cmd('Input.insertText',text=amt)
 click('[data-action=save]');wait("!document.querySelector('#composer').open")
 assert js('state.rows[state.rows.length-1].type')==typ
print('PASS five entry types through native amount input, direct save',flush=True)
cmd('Emulation.setTouchEmulationEnabled',enabled=True)
for tab in ['Transactions','Insights','Settings','Overview']:
 click(f'[data-page="{tab}"] svg',touch=True);wait(f'document.querySelector("[aria-current=page]").dataset.page==="{tab}"')
click('#add svg',touch=True);wait("document.querySelector('#composer').open");time.sleep(.5);click('[data-action=close]',touch=True)
wait("!document.querySelector('#composer').open")
cmd('Emulation.setTouchEmulationEnabled',enabled=False)
print('PASS four navigation icons and Add via touch events',flush=True)
click('.privacy');assert not js("!!document.querySelector('.spending svg,.ring [pathLength],.report .bar')")
click('[data-page="Insights"] svg');assert not js("!!document.querySelector('.spending svg,.report .bar,input[type=range]')")
click('.privacy');click('[data-page="Overview"] svg');cmd('Page.reload');wait('typeof state!=="undefined" && state.rows.length===5')
print('PASS privacy, IndexedDB reload',flush=True)

# Edit and delete through the same sheet, keeping an auditable trail.
click('[data-page="Transactions"] svg')
click('[data-edit]');time.sleep(.5);click('#composer input[aria-label=Amount]');cmd('Input.dispatchKeyEvent',type='keyDown',key='End',code='End');cmd('Input.dispatchKeyEvent',type='keyUp',key='End',code='End');cmd('Input.insertText',text='0')
click('[data-action=save]')
wait("state.audit[state.audit.length-1].action==='Edited transaction'")
click('[data-edit]');time.sleep(.5);click('[data-action=delete]');wait("document.querySelector('#dlg').open")
click('#modal button.primary');wait("state.rows.length===4 && state.audit[state.audit.length-1].action==='Deleted transaction'")
print('PASS edit and delete with stored audit records',flush=True)
# Exercise backup and restore with fictional bytes; bypass OS picker in this test.
click('[data-page="Settings"]')
js("window.normalDownload=download;download=(name,body)=>{window.testBackup=body};")
click('#backup');assert js("JSON.parse(testBackup).rows.length===4");js("download=normalDownload")
js("""window.normalPick=HTMLInputElement.prototype.click;HTMLInputElement.prototype.click=function(){
 if(this.type!=='file')return normalPick.call(this);
 HTMLInputElement.prototype.click=normalPick;const files=new DataTransfer();files.items.add(new File([testBackup],'fictional.json',{type:'application/json'}));this.files=files.files;this.dispatchEvent(new Event('change'));
}""")
click('#restore');wait("document.querySelector('#dlg').open");click('#modal button.primary')
wait("state.audit[state.audit.length-1].action==='Restored backup'")
assert js("JSON.stringify(state.rows)===JSON.stringify(JSON.parse(testBackup).rows)")
print('PASS original-schema backup/restore via synthetic file selection',flush=True)
cmd('Emulation.setEmulatedMedia',features=[{'name':'prefers-reduced-motion','value':'reduce'}])
js("window.testAnimationCount=0;const oldAnimate=Element.prototype.animate;Element.prototype.animate=function(...args){window.testAnimationCount++;return oldAnimate.apply(this,args)}")
click('#add');assert js("matchMedia('(prefers-reduced-motion: reduce)').matches && window.testAnimationCount===0")
click('[data-action=close]')
js('navigator.serviceWorker.ready.then(()=>true)');cmd('Page.reload');wait('!!navigator.serviceWorker.controller && typeof state!=="undefined" && state.rows.length===4')
cmd('Network.enable')
cmd('Network.emulateNetworkConditions',offline=True,latency=0,downloadThroughput=0,uploadThroughput=0)
cmd('Page.reload');wait("typeof state!=='undefined' && state.rows.length===4 && !!document.querySelector('.hero')")
print('PASS reduced motion and offline reload with persisted records',flush=True)
assert not errors,[e['exception'].get('description') for e in errors]

