from playwright.sync_api import sync_playwright
import re
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  for st in [2,5,4]:
    pg.evaluate(f"""(()=>{{const c=DW.find(c=>c.e==='however')||DW.find(c=>c.e==='important');const k='c:'+c.id;AMS.w={{}};AMS.w[k]={{k,e:c.e,h:c.h[0],st:{st},due:Date.now()-1000,log:[],t:Date.now()}};go({{screen:'amw'}});wStart('rev')}})()""")
    pg.wait_for_timeout(900)
    print(st,pg.evaluate('S.screen'),re.sub(r'\s+',' ',pg.locator('#app').inner_text())[150:560])
    o=pg.locator('[data-wmc]').first
    if o.count():
      o.click();pg.wait_for_timeout(500);print(' after:',re.sub(r'\s+',' ',pg.locator('#app').inner_text())[150:600])
      print(' used:',pg.evaluate("Object.values(AMS.w)[0].used"), 'st', pg.evaluate("Object.values(AMS.w)[0].st"))
    pg.screenshot(path=f'rv{st}.png')
  print(errs);b.close()
