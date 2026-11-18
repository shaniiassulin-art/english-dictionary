# "⚠️ יש טעות בתרגום" asks Gemini for a corrected translation and shows it
from playwright.sync_api import sync_playwright
import json,re
GEM={"he":"בבקשה תשווי את הנעליים האדומות שלך לנעליים הכחולות שלי.","changed":True,"why":"צורת הפועל"}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(GEM,ensure_ascii=False)}]}}]})))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  en='Please compare your red shoes with my blue shoes.'
  pg.evaluate("""(en=>{const c=DW.find(c=>c.e==='compare');const k='c:'+c.id;AMS.w={};AMS.w[k]={k,e:c.e,h:c.h[0],st:2,lr:5,due:Date.now()-1,log:[],t:Date.now(),rv:{st:2,en,he:'בבקשה תשוות את הנעליים האדומות שלך עם הנעליים הכחולות שלי.',src:'ai',lab:''}};TRC[en.toLowerCase()]={h:AMS.w[k].rv.he,src:'ai'};go({screen:'amw'});wStart('rev')})""",en)
  pg.wait_for_timeout(1500);pg.locator('[data-wmc="compare"]').click();pg.wait_for_timeout(800)
  pg.locator('[data-trfix]').click();pg.wait_for_timeout(2000)
  t=pg.locator('.trans').first.inner_text();print(t)
  assert 'תשווי' in t,'fixed translation shown'
  assert not errs,errs;print('OK');b.close()
