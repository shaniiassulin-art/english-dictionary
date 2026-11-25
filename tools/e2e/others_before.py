# Choice tasks (hecl / mc) show no other meanings – only the open questions do (Nov 25, her request)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=500,body='x'))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  for st in [1,2]:
    pg.evaluate("""(st)=>{const c=DW.find(c=>wOtherMeanings({k:'c:'+c.id,e:c.e,h:c.h[0]}).length&&wHeSent({k:'c:'+c.id,e:c.e,h:c.h[0]}));AMS.w={};const k='c:'+c.id;
      AMS.w[k]={k,e:c.e,h:c.h[0],st,lr:5,due:Date.now()-1000,log:[],t:Date.now()};WS=null;go({screen:'amw'});wStart('rev')}""",st);pg.wait_for_timeout(2500)
    n=pg.locator('.am-card .others').count();t=pg.locator('[data-task]').get_attribute('data-task') if pg.locator('[data-task]').count() else None;print(st,t,n);assert n==0  # choice tasks show no other meanings (Nov 25: only open questions)
  # the translation step (learning round 1) shows none either; "הפירוש בעברית" keeps them
  pg.evaluate("""(()=>{const c=DW.find(c=>wOtherMeanings({k:'c:'+c.id,e:c.e,h:c.h[0]}).length);AMS.w={};const k='c:'+c.id;
    AMS.w[k]={k,e:c.e,h:c.h[0],st:0,lr:1,log:[],t:Date.now()};WS=null;go({screen:'amw'});wStart('new',[k])})()""");pg.wait_for_timeout(2500)
  print('tr',pg.locator('#trIn').count(),pg.locator('.am-card .others').count());assert pg.locator('.am-card .others').count()==0
  assert not e,e;print('OK')
