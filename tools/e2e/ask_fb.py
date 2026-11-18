# ask Gemini a question about the feedback of the translation step; exam sentences show their question number
from playwright.sync_api import sync_playwright
import json,re
GEM={"word_ok":False,"ok":False,"feedback":"הערה על התרגום","answer":"זו התשובה לשאלה שלך"}
T=lambda pg:re.sub(r'\s+',' ',pg.locator('#app').inner_text())
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(GEM,ensure_ascii=False)}]}}]})))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  labs=pg.evaluate("sPoolX().filter(p=>p.src==='sc').slice(0,2).map(p=>p.lab).concat(sPoolX().filter(p=>p.src==='rs').slice(1,2).map(p=>p.lab))");print(labs)
  assert all('שאלה' in l for l in labs)
  pg.evaluate("""(()=>{AMS.w={};const ks=[];['important'].forEach(e=>{const c=DW.find(c=>c.e===e);const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:0,log:[],t:Date.now(),src:'dict:'+c.id};ks.push(k)});go({screen:'amw'});wStart('collect',ks)})()""")
  pg.wait_for_selector('#trIn',timeout=15000);pg.fill('#trIn','משהו');pg.click('#trChk');pg.wait_for_timeout(2500)
  print(T(pg)[200:520])
  pg.locator('.am-askd summary').click();pg.fill('.am-askd textarea','למה זה לא נכון?');pg.click('[data-askgo]');pg.wait_for_timeout(2500)
  t=T(pg);i=t.find('למה זה לא נכון');print(t[i-5:i+80]);assert 'זו התשובה לשאלה שלך' in t
  pg.screenshot(path='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/ask.png',full_page=True)
  assert not errs,errs;print('OK');b.close()
