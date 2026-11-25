# The word's other meanings show in the choice tasks before answering too (Nov 25, her request)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=500,body='x'))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  for st in [1,2]:
    pg.evaluate("""(st)=>{const c=DW.find(c=>wOtherMeanings({k:'c:'+c.id,e:c.e,h:c.h[0]}).length&&wHeSent({k:'c:'+c.id,e:c.e,h:c.h[0]}));AMS.w={};const k='c:'+c.id;
      AMS.w[k]={k,e:c.e,h:c.h[0],st,lr:5,due:Date.now()-1000,log:[],t:Date.now()};WS=null;go({screen:'amw'});wStart('rev')}""",st);pg.wait_for_timeout(2500)
    n=pg.locator('.am-card .others').count();t=pg.locator('[data-task]').get_attribute('data-task') if pg.locator('[data-task]').count() else None;print(st,t,n);assert n==1
  assert not e,e;print('OK')
