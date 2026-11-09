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
  before=pg.evaluate("WS.cur&&WS.cur.en")
  # a sync lands: the word comes back without its review sentence
  pg.evaluate("(()=>{const c=JSON.parse(JSON.stringify(AMS));Object.values(c.w).forEach(w=>delete w.rv);amApply(c)})()")
  right=pg.evaluate("AMS.w[WS.list[WS.i]].e")
  pg.locator(f'[data-wmc="{right}"]').click();pg.wait_for_timeout(500)
  shown=pg.evaluate("WS.res&&WS.res.en")
  print('same sentence:',before==shown, '|', before[:60] if before else None)
  print(errs);b.close()
