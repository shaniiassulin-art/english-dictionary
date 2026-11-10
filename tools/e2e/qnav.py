from playwright.sync_api import sync_playwright
import re
T=lambda pg:re.sub(r'\s+',' ',pg.locator('#app').inner_text())
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("window.aiRun=async()=>({j:{hint:'רמז'}})")
  pg.evaluate("(()=>{const s=AMD.s.find(x=>x.t==='sc'&&!x.b&&!x.nt);go({screen:'amq'});amStartUnit(s,'השלמת משפטים · יחידה '+s.u,'amqh','sc')})()")
  pg.wait_for_timeout(1000)
  print('nav:',pg.locator('[data-qj]').count(),pg.locator('#aqUnit option').count())
  pg.locator('[data-qj="3"]').click();pg.wait_for_timeout(500);print('i',pg.evaluate('AQ.i'))
  # tap a word in option 1
  bb=pg.evaluate("(()=>{const el=document.querySelector('.am-opt[data-k] .ax-ot span');const r=document.createRange();r.setStart(el.firstChild,0);r.setEnd(el.firstChild,2);const q=r.getBoundingClientRect();return [q.x+3,q.y+q.height/2,el.textContent]})()")
  pg.mouse.click(bb[0],bb[1]);pg.wait_for_timeout(600)
  print('pop:',bb[2],'|',re.sub(r'\s+',' ',pg.locator('#amPop').inner_text())[:200],'| sel',pg.evaluate('aqSt().sel'))
  pg.screenshot(path='qnav.png')
  pg.click('#popX')
  pg.select_option('#aqUnit',index=2);pg.wait_for_timeout(600);print('unit',pg.evaluate('AQ.unit'),T(pg)[:120])
  print(errs);b.close()
