# A Gemini sentence must use the word in the card's meaning (her screenshot: system = שיטה, but "heating system" = מערכת)
import json
from playwright.sync_api import sync_playwright
N=[0]
def gem(route):
  N[0]+=1
  j={'w_he':'מערכת','en':'Our new heating system keeps the house warm.','he':'מערכת החימום החדשה שלנו שומרת על הבית חם.'} if N[0]==1 else {'w_he':'שיטה','en':'My sister has a clever system for remembering names.','he':'לאחותי יש שיטה חכמה לזכור שמות.'}
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'candidates':[{'content':{'parts':[{'text':json.dumps(j)}]}}]}))
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const c=DW.find(c=>c.e==='system'&&c.h[0]==='שיטה');const w={k:'c:'+c.id,e:'system',h:'שיטה'};
    return [senseOk(w,'מערכת החימום החדשה שלנו שומרת על הבית חם.','מערכת'),senseOk(w,'לאחותי יש שיטה חכמה לזכור שמות.','שיטה'),senseOk(w,'יש לה שיטות טובות.'),senseOk(w,'משהו אחר לגמרי.')]})()""")
  print(r);assert r==[False,True,True,True]
  # a stored wrong-sense sentence is dropped on load
  d=pg.evaluate("""(()=>{const c=DW.find(c=>c.e==='system'&&c.h[0]==='שיטה');const k='c:'+c.id;AMS.w={};AMS.w[k]={k,e:'system',h:'שיטה',st:1,lr:1,t:1,trc:{en:'Our new heating system keeps the house warm.',he:'מערכת החימום החדשה שלנו שומרת על הבית חם.',src:'ai'}};amFixW();return !AMS.w[k].trc})()""")
  print('dropped',d);assert d
  assert not e,e;print('OK')
