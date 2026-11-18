# the gap of a Hebrew sentence is moved to where the word stands in English (Gemini rewrites the order once, cached)
from playwright.sync_api import sync_playwright
import json,re
GEM={"he":"אני _____ הולכת לחדר כושר."}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(GEM,ensure_ascii=False)}]}}]})))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const c=DW.find(c=>c.e==='often');const w={k:'c:'+c.id,e:c.e,h:c.h[0]};return [c.s,wHeSent(w),heGapPos(wHeSent(w)),enWordPos(c.s,w)]})()""");print(r)
  pg.evaluate("""(()=>{const c=DW.find(c=>c.e==='often');const k='c:'+c.id;AMS.w={};AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:5,due:Date.now()-1,log:[],t:Date.now()};go({screen:'amw'});wStart('rev')})()""")
  pg.wait_for_timeout(2500);t=re.sub(r'\s+',' ',pg.locator('#app').inner_text());i=t.find('חסרה במשפט');print(t[i:i+60])
  assert 'אני ? הולכת' in t,'gap moved'
  # an ok order is left alone
  print(pg.evaluate("(()=>{const w={e:'house',h:'בית'};return heOrdered('יש לי _____ גדול.','I have a big house.',w,'x1')})()"))
  assert not errs,errs;print('OK');b.close()
