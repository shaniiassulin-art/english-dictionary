# a review whose Hebrew sentence can't be made falls back to an English sentence to choose in (mc), not "הפירוש בעברית"
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=500,body='x'))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  t=pg.evaluate("""(()=>{AMS.w={};const c=DW.find(c=>c.id==='case#0');const k='c:'+c.id;const s=wHeSent({k,e:c.e,h:c.h[0]});AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:5,due:Date.now()-1000,log:[],t:Date.now(),used:['he:'+s]};
    HEERR[k]=1;WS=null;go({screen:'amw'});wStart('rev');return wTaskNow(AMS.w[k])})()""");print(t)
  assert t=='mc',t
  assert not errs,errs;print('OK');b.close()
