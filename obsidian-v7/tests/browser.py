from pathlib import Path
from playwright.sync_api import sync_playwright
import http.server, threading, os
os.chdir(Path(__file__).resolve().parents[1])
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),http.server.SimpleHTTPRequestHandler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/app/'
with sync_playwright() as pw:
 engine=os.getenv('ENGINE','chromium'); opts={}
 if engine=='chromium' and os.getenv('CHROMIUM'):opts['executable_path']=os.environ['CHROMIUM']
 b=getattr(pw,engine).launch(**opts)
 ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True)
 p=ctx.new_page(); errors=[];requests=[]
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:requests.append(r.url))
 p.goto(url);p.get_by_text('Try fictional balances').click();p.locator('.hero').wait_for()
 for w in [320,375,390,430,900]:
  p.set_viewport_size({'width':w,'height':844})
  for page in ['Overview','Activity','Insights','Settings']:
   p.locator('nav').get_by_text(page).click()
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,page)
   if page=='Overview':p.screenshot(path=f'screenshots/overview-{w}.png')
 p.set_viewport_size({'width':390,'height':844});p.locator('#add').click()
 p.locator('#composer input[aria-label=Amount]').fill('50')
 p.locator('[data-pick=account][data-value=a1]').click();p.screenshot(path='screenshots/entry.png')
 p.locator('[data-action=save]').click();p.wait_for_function('state.rows.length===1')
 assert p.evaluate("summary(state,month).net")==24800000
 p.reload();p.wait_for_function('state.rows.length===1')
 p.get_by_role('button',name='Hide balances').click();assert '24,800,000' not in p.locator('main').inner_text()
 p.get_by_role('button',name='Reveal balances').click()
 p.evaluate('navigator.serviceWorker.ready');p.reload();p.wait_for_function('!!navigator.serviceWorker.controller')
 ctx.set_offline(True);p.reload();p.locator('.hero').wait_for()
 assert p.evaluate('summary(state,month).balance.a1')==14150000
 assert not errors,errors
 assert all(u.startswith(url) for u in requests),requests
 print('PASS: 20 page/width checks; native amount input expense; reload, privacy, offline, external request and page error checks')
 b.close()
