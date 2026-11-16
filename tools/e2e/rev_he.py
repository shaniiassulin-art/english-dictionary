# review 1 = Hebrew sentence: every dictionary card has one offline (the card's translation, blanked automatically or by its trm marks); no skip, no English fallback
from playwright.sync_api import sync_playwright
import re
T=lambda pg:re.sub(r'\s+',' ',pg.locator('#app').inner_text())
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  info=pg.evaluate("""(()=>{let a=null,b=null;for(const c of DW){const w={k:'c:'+c.id,e:c.e,h:c.h[0],st:1};if(!a&&wHeSent(w)&&c.e!=='but')a=c;else if(!b&&c.e==='but'&&(EXTRA[c.id]||{}).trm)b=c;if(a&&b)break}
    AMS.w={};[a,b].forEach((c,i)=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:1,due:Date.now()-1000-i,log:[],t:Date.now(),rvh:i?{he:'אף כוכב, _____ השמש',en:'No star, apart from the sun, is close enough to earth to appear as anything but a tiny point of light.',src:'sc'}:undefined}});amFixW();go({screen:'amw'});wStart('rev');return [a.e,a.h[0],b.e,b.h[0],!!AMS.w['c:'+b.id].rvh]})()""")
  print('words',info,'(last = old bad Hebrew sentence kept?)');pg.wait_for_timeout(1500)
  for n in range(2):
    for _ in range(40):
      if pg.locator('[data-wmc],#heRetry').count():break
      pg.wait_for_timeout(1000)
    t=T(pg);print('Q%d:'%n,'hebrew' if pg.locator('[data-task=hecl]').count() else ('RETRY PAGE' if pg.locator('#heRetry').count() else 'english'),t[:160])
    if pg.locator('#heRetry').count():pg.click('#heSkip');pg.wait_for_timeout(900);continue
    pg.locator('[data-wmc]').first.click();pg.wait_for_timeout(400)
    pg.click('#wOn');pg.wait_for_timeout(900)
  pg.evaluate("WS.view=0;go({screen:'amwl'})");pg.wait_for_timeout(500)
  print('snap',pg.locator('.am-histsnap').count(),'opts',pg.locator('.am-histsnap .am-opt').count())
  cov=pg.evaluate("(()=>{const miss=[];let n=0;for(const c of W?Object.values(W):[]){if(!c||!c.s||!c.e||isPrivId(c.id))continue;n++;const w={k:'c:'+c.id,e:c.e,h:c.h[0]};if(!wHeSent(w))miss.push(c.id)}return [n,miss.slice(0,20),miss.length]})()")
  print('coverage',cov)
  print('multi',pg.evaluate("heGapHtml('היא מדברת _____ אנגלית _____ צרפתית.','both... and…',1)"))
  print(errs);b.close()
