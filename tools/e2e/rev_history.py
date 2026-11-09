from playwright.sync_api import sync_playwright
import re
T=lambda pg:re.sub(r'\s+',' ',pg.locator('#app').inner_text())
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("""(()=>{AMS.w={};['important','however'].forEach(e=>{const c=DW.find(c=>c.e===e);const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:5,due:Date.now()-1000,log:[],t:Date.now()}});go({screen:'amw'});wStart('rev')})()""")
  pg.wait_for_timeout(1200)
  pg.locator('[data-wmc]').first.click();pg.wait_for_timeout(400)
  pg.click('#wOn');pg.wait_for_timeout(800)
  print('prev link:',pg.locator('#wPrev').count())
  pg.click('#wPrev');pg.wait_for_timeout(500);print('HIST:',T(pg)[:400])
  pg.screenshot(path='hist.png')
  pg.click('#hBack');pg.wait_for_timeout(500);print('BACK:',T(pg)[60:200])
  print(errs);b.close()
