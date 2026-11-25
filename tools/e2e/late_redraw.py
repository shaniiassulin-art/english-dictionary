# an explanation that arrives while she touches / scrolls the page doesn't replace the page under her finger; on the method page only the box changes
import json
from playwright.sync_api import sync_playwright
X={"translation":"תרגום","understand":["שלב"]*4,"options":[{"en":"a","he":"א","ok":True,"why":"סיבה"}]*4,"answer":"למה","tip":"טיפ"}
M={"steps":["צעד ארוך "*12]*6,"rule":"כלל"}
HELD=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.route('**/generativelanguage.googleapis.com/**',lambda r:HELD.append(r))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("amStart(['crs5-1'],'t','learn','am','rs')");pg.wait_for_timeout(800)
  a=pg.evaluate("AMD.q['crs5-1'].a");pg.locator('.ax-rad').nth(a-1).click();pg.wait_for_timeout(200)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.wait_for_timeout(300);pg.click('#amNext');pg.wait_for_timeout(800)
  assert 'מכינה' in pg.locator('#amMeth').inner_text()
  pg.evaluate("window.DC=0;new MutationObserver(()=>DC++).observe(document.getElementById('app'),{childList:true});window.TOP=document.querySelector('.ax-q, .am-q, h4');document.body.dispatchEvent(new TouchEvent('touchstart',{touches:[new Touch({identifier:1,target:document.body,clientX:100,clientY:400})],bubbles:true}))")
  def body(r):return json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(M if 'method' in (r.request.post_data or '').lower()[:400] or '"steps"' in (r.request.post_data or '') else X,ensure_ascii=False)}]}}]})
  for _ in range(15):
    while HELD:
      r=HELD.pop()
      try:r.fulfill(status=200,content_type='application/json',body=body(r))
      except Exception:pass
    pg.wait_for_timeout(100)
  pg.wait_for_timeout(1000)
  print('dbg',pg.evaluate('[DC,LTOUCH,LSCR]'));t=pg.locator('#amMeth').inner_text();assert 'מכינה' in t,'replaced while touching'
  pg.evaluate("document.body.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[new Touch({identifier:1,target:document.body,clientX:100,clientY:300})],bubbles:true}))");pg.wait_for_timeout(1500)
  t=pg.locator('#amMeth').inner_text();print(t[:200]);assert 'מכינה' not in t and 'צעד' in t
  print('app redraws',pg.evaluate("DC"),'same top',pg.evaluate("window.TOP&&window.TOP.isConnected"))
  assert pg.evaluate("DC")==0 and pg.evaluate("window.TOP&&window.TOP.isConnected")
  assert not errs,errs;print('OK');b.close()
