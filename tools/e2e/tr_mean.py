# The "תרגום לעברית" under a review sentence uses the sentence's own translation (Gemini's / the book's), else Gemini with the word's meaning –
# never a plain machine translation that picks another sense (her screenshot: "an even parking space" → "חניה אחיד" instead of זוגי)
import json,re
from playwright.sync_api import sync_playwright
ASK=[]
def gem(route):
  b=route.request.post_data or '';ASK.append(b)
  body=json.dumps({'he':'אפשר להחנות את המכונית שלך בחניה זוגית?'})
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'candidates':[{'content':{'parts':[{'text':body}]}}]}))
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.route('**/translate.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps([[["האם אתה יכול לשים את המכונית שלך במקום חניה אחיד?","x"]]])))
  pg.route('**/api.mymemory.translated.net/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  S='Can you put your car in an even parking space?'
  # 1) the sentence's own translation (kept with the review sentence) is shown
  r1=pg.evaluate("""S=>{const c=DW.find(c=>c.e==='even'&&/זוגי/.test(c.h[0]));AMS.w={};const k='c:'+c.id;
    AMS.w[k]={k,e:c.e,h:c.h[0],st:2,lr:5,due:Date.now()-1000,log:[],t:Date.now(),rv:{st:2,en:S,he:'אפשר לשים את הרכב בחניה זוגית?'}};
    go({screen:'amw'});wStart('rev');return wTaskNow(AMS.w[k])}""",S)
  pg.wait_for_timeout(800);pg.locator('.am-opt[data-wmc="even"]').click();pg.wait_for_timeout(800)
  t1=pg.locator('.trans').first.inner_text();print('own translation:',t1);assert 'זוגית' in t1 and 'אחיד' not in t1
  # 2) no stored translation → Gemini with the meaning, not Google
  pg.evaluate("""S=>{TRC[S.toLowerCase()]={h:'האם אתה יכול לשים את המכונית שלך במקום חניה אחיד?',src:'Google'};const w=Object.values(AMS.w)[0];WS.res.he='';if(WS.cur)WS.cur.he='';delete w.rv;Object.keys(TRC).filter(k=>k.startsWith('m|')).forEach(k=>delete TRC[k]);draw()}""",S)
  pg.wait_for_timeout(1500);t2=pg.locator('.trans').first.inner_text();print('with meaning:',t2,len(ASK))
  assert 'זוגית' in t2 and 'אחיד' not in t2 and any('זוגי' in a for a in ASK)
  assert not e,e;print('OK')
