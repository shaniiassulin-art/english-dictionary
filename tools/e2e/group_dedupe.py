from playwright.sync_api import sync_playwright
import re
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  print(pg.evaluate("jnGroup(wQueue(80),13).map(w=>w.e+'='+w.h+'['+wPos(w.e,w.h)+']').join(' | ')"))
  # AI path with a fake Gemini
  print(pg.evaluate("""(async()=>{window.aiRun=async()=>({j:{ids:[0,3,5,7],theme:'רגשות'}});const x={id:'t|new0',k:'new',n:4,d:0};await jnGroupAI(x);return [x.theme,x.ws]})()"""))
  # dedupe
  print(pg.evaluate("""(()=>{const c=DW.find(c=>c.e==='however');AMS.w={};AMS.w['however']={k:'however',e:'however',h:c.h[0],st:4,due:1,log:[[1,'mc',1,0]],t:5};AMS.w['c:'+c.id]={k:'c:'+c.id,e:'however',h:c.h[0],st:2,due:2,log:[],t:9,src:'dict:'+c.id};amFixW();return JSON.stringify(Object.values(AMS.w).map(w=>[w.k,w.st,w.log.length]))})()"""))
  # mc after answer: same sentence filled
  pg.evaluate("""(()=>{const c=DW.find(c=>c.e==='important');const k='c:'+c.id;AMS.w={};AMS.w[k]={k,e:c.e,h:c.h[0],st:5,due:Date.now()-1000,log:[],t:Date.now()};go({screen:'amw'});wStart('rev')})()""")
  pg.wait_for_timeout(1200)
  o=pg.locator('[data-wmc]').first;o.click();pg.wait_for_timeout(500)
  print(re.sub(r'\s+',' ',pg.locator('#app').inner_text())[100:700])
  pg.screenshot(path='mcafter.png')
  print(errs);b.close()
