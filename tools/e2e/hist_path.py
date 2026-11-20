# after a right review answer the path line says which review was done and where the word went; the 🛤 link works on "the word you already did"
from playwright.sync_api import sync_playwright
import re
T=lambda pg:re.sub(r'\s+',' ',pg.locator('#app').inner_text())
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("""(()=>{AMS.w={};['important','however'].forEach(e=>{const c=DW.find(c=>c.e===e);const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:2,lr:5,due:Date.now()-1000,log:[],t:Date.now()}});go({screen:'amw'});wStart('rev')})()""")
  pg.wait_for_timeout(1500)
  w=pg.evaluate("AMS.w[WS.list[WS.i]].e")
  opts=pg.locator('[data-wmc]');n=opts.count()
  for i in range(n):
    if opts.nth(i).get_attribute('data-wmc')==w:opts.nth(i).click();break
  pg.wait_for_timeout(600);t=T(pg);m=re.search(r'✓ חזרה 2 הושלמה – המילה עברה לחזרה 3',t);print('line:',bool(m))
  pg.click('#wOn');pg.wait_for_timeout(2000);pg.click('#wPrev');pg.wait_for_timeout(600)
  pg.locator('.am-histsnap [data-path]').first.click();pg.wait_for_timeout(600);s1=pg.evaluate("S.screen")
  pg.click('#bk') if pg.locator('#bk').count() else None;pg.wait_for_timeout(600);s2=pg.evaluate("[S.screen,WS.view]")
  print(s1,s2,errs);assert m and s1=='ampath' and s2[0]=='amwl' and s2[1] is not None and not errs;print('OK')
