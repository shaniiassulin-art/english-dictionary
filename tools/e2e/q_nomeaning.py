# no word meanings in any practice question before answering (hint only), big "לא ידעתי את המילה" button; after answering the meaning shows
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=1);e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort());pg.route('**/translate.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("""(()=>{const id=Object.keys(AMD.q).find(i=>/^c/.test(i)&&AMD.q[i].t==='sc');amStart([id],'t','learn','am','sc')})()""");pg.wait_for_timeout(1200)
  if pg.locator('#amMf').count():pg.click('#amMf');pg.wait_for_timeout(500)
  r1=pg.evaluate("(()=>{amPop('important','','',''); return [AMPOP.mode, !!document.getElementById('popUnk'), document.getElementById('popUnk').getBoundingClientRect().height]})()")
  pg.screenshot(path='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/qpop.png')
  pg.evaluate("document.getElementById('popX')&&document.getElementById('popX').click()");pg.wait_for_timeout(400)
  pg.locator('.ax-rad').first.click();pg.wait_for_timeout(300)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.wait_for_timeout(800)
  print(pg.evaluate('[AQ.i,JSON.stringify(AQ.st)]'));r2=pg.evaluate("(()=>{amPop('important','','',''); return AMPOP.mode})()")
  print(r1,r2,e);assert r1[0]=='hint' and r1[1] and r1[2]>=50 and r2=='' and not e;print('OK')
