# review 1 = Hebrew sentence: the card's translated example, else Gemini (here unreachable → the English sentence task); never a book translation blanked directly
from playwright.sync_api import sync_playwright
import re
T=lambda pg:re.sub(r'\s+',' ',pg.locator('#app').inner_text())
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  info=pg.evaluate("""(()=>{let a=null,b=null;for(const c of DW){const w={k:'c:'+c.id,e:c.e,h:c.h[0],st:1};if(!a&&wHeSent(w))a=c;else if(!b&&c.e==='but'&&!wHeSent(w))b=c;if(a&&b)break}
    AMS.w={};[a,b].forEach((c,i)=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:1,due:Date.now()-1000-i,log:[],t:Date.now(),rvh:i?{he:'אף כוכב, _____ השמש',en:'No star, apart from the sun, is close enough to earth to appear as anything but a tiny point of light.',src:'sc'}:undefined}});amFixW();go({screen:'amw'});wStart('rev');return [a.e,a.h[0],b.e,b.h[0],!!AMS.w['c:'+b.id].rvh]})()""")
  print('words',info,'(last = old bad Hebrew sentence kept?)');pg.wait_for_timeout(1500)
  for n in range(2):
    for _ in range(30):
      if pg.locator('[data-wmc]').count():break
      pg.wait_for_timeout(1000)
    t=T(pg);print('Q%d:'%n,'hebrew' if pg.locator('[data-task=hecl]').count() else 'english',t[t.find('איזו'):][:110])
    pg.locator('[data-wmc]').first.click();pg.wait_for_timeout(400)
    pg.click('#wOn');pg.wait_for_timeout(900)
  pg.evaluate("WS.view=0;go({screen:'amwl'})");pg.wait_for_timeout(500)
  print('snap',pg.locator('.am-histsnap').count(),'opts',pg.locator('.am-histsnap .am-opt').count())
  print(errs);b.close()
