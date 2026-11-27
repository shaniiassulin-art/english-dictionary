# the hub says how long the due reviews take and how many minutes are beyond the plan
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  for h in ['firestore.googleapis.com','generativelanguage.googleapis.com']:pg.route('**/'+h+'/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2000)
  pg.evaluate("""(()=>{const cs=DW.slice(0,42);cs.forEach((c,i)=>{wAdd(c.e,c.h[0],'','dict:'+c.id,'c:'+c.id);const w=AMS.w['c:'+c.id];w.st=1+(i%6);w.lr=5;w.due=Date.now()-1000});amSave();go({screen:'am'})})()""")
  pg.wait_for_timeout(1200)
  t=pg.locator('.jh').inner_text();print(t[:260]);pg.screenshot(path='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/rov.png')
  e=pg.evaluate("revEst(wDue(0))");print('est',e)
  assert 'מעבר ל־30' in t and pg.locator('.jh-st .ov').count()==1
  assert not errs,errs;print('OK');b.close()
