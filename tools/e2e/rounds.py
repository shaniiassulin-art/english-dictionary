from playwright.sync_api import sync_playwright
import re
T=lambda pg:re.sub(r'\s+',' ',pg.locator('#app').inner_text())
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("window.aiRun=async()=>({why:'quota'});window.amTrans=async()=>({h:'תרגום'})")
  pg.evaluate("""(()=>{AMS.w={};const ks=[];['important','however','significant','despite'].forEach(e=>{const c=DW.find(c=>c.e===e);const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:0,log:[],t:Date.now(),src:'dict:'+c.id};ks.push(k)});go({screen:'amw'});wStart('collect',ks)})()""")
  pg.wait_for_timeout(1500)
  print('R1:',T(pg)[:330]);pg.screenshot(path='r1.png')
  # translate word 1, skip check via later
  for n in range(2):
    pg.wait_for_selector('#trIn',timeout=8000) if True else 0
    print('it',n,pg.evaluate('[WS.i,WS.round,WS.step,!!WS.res]'),T(pg)[200:420])
    pg.fill('#trIn','משהו');pg.evaluate("WS.draft='משהו'");pg.click('#trChk');pg.wait_for_timeout(600)
    if pg.locator('#trLater').count():pg.click('#trLater');pg.wait_for_timeout(400)
    print(' after chk',T(pg)[200:500]);
    if pg.locator('#wOn').count():pg.click('#wOn');pg.wait_for_timeout(600)
  print('counts:',pg.evaluate("wRoundCounts()"),'lr:',pg.evaluate("Object.values(AMS.w).map(w=>lrOf(w))"))
  # switch to round 2 with the 2 done words
  pg.locator('[data-round="2"]').first.click();pg.wait_for_timeout(800)
  print('R2 page:',T(pg)[:260])
  pg.click('#dqSkip');pg.wait_for_timeout(800)
  print('after skip:',pg.evaluate("[WS&&WS.round,WS&&WS.list.length,wRoundCounts()]"),T(pg)[:200])
  pg.screenshot(path='r3.png')
  # free practice track
  pg.evaluate("FP={stage:'mc',ids:[DW.find(c=>c.e==='important').id],i:0,st:{}};go({screen:'amfpl'})");pg.wait_for_timeout(800)
  print('FP:',T(pg)[:260])
  print(errs);b.close()
