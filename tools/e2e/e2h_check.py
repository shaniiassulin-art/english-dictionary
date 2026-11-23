# "הפירוש בעברית": Gemini checks the answer (no self-mark); another meaning of the word = try again; no stage dots, no duplicated word card
import json,re
from playwright.sync_api import sync_playwright
T=lambda pg:re.sub(r'\s+',' ',pg.locator('#app').inner_text())
V={'v':'wrong'}
def gem(route):
  body=json.dumps({'verdict':V['v'],'feedback':'בדיקה'})
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'candidates':[{'content':{'parts':[{'text':body}]}}]}))
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  info=pg.evaluate("""(()=>{const c=DW.find(c=>c.e==='post'&&/דואר/.test(c.h[0]));AMS.w={};const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:3,lr:5,due:Date.now()-1000,log:[],t:Date.now()};go({screen:'amw'});wStart('rev');return [c.h[0],wOtherMeanings(AMS.w[k]),wTaskNow(AMS.w[k])]})()""")
  print(info);pg.wait_for_timeout(1000)
  oth=info[1][0]
  ot=pg.locator('.am-card .others').inner_text();r0=('פירושים אחרים של המילה' in ot and oth in ot and info[0] not in ot.split(chr(10)));print('others shown:',r0,ot.replace(chr(10),' | '))
  assert r0
  assert pg.locator('#e2hSent').count()==1 and pg.locator('.e2h .word').count()==1;pg.click('#e2hSent');pg.wait_for_timeout(300);assert pg.locator('.e2h .sentence').count()==1 and pg.locator('.e2h .trans').count()==0;print('sentence before answering: True')
  pg.fill('#wAns',oth);pg.click('#wGo');pg.wait_for_timeout(500);t=T(pg)
  r1='פירוש נכון של' in t and '<b>' not in t and '<bdi>' not in t and pg.locator('#wAns').count()==1;print('other meaning → retry:',r1)
  V['v']='other';pg.fill('#wAns','משהו');pg.click('#wGo');pg.wait_for_timeout(1500);r2='פירוש נכון של' in T(pg) and pg.locator('#wAns').count()==1;print('gemini other → retry:',r2)
  V['v']='right';pg.fill('#wAns','מכתבים');pg.click('#wGo');pg.wait_for_timeout(1500);t=T(pg)
  st=pg.evaluate("Object.values(AMS.w)[0].st")
  r3='נכון' in t and 'הפירוש שכתבת נכון?' not in t and st==4 and pg.locator('.am-timer').count()==0 and pg.locator('.am-card>.w').count()==0 and pg.locator('.opt.right').count()==1 and pg.locator('.mine').count()==1 and pg.locator('.xfull').count()==1
  r3=r3 and pg.locator('.e2h .sentence').count()==1 and pg.locator('.e2h .others').count()==1 and 'ידעתי' not in t
  print('right:',r3,st,t[:300])
  assert r1 and r2 and r3 and not e,e;print('OK')
