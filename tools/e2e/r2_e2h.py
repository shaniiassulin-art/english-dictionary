# Learning round 2 = "הפירוש בעברית" typed + Gemini check (Nov 25, her request – no ידעתי / לא ידעתי, no dictionary quiz)
import json
from playwright.sync_api import sync_playwright
V=['right']
def gem(route):
  b=route.request.post_data or ''
  body=json.dumps({'verdict':V[0],'feedback':'הערה'})
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'candidates':[{'content':{'parts':[{'text':body}]}}]}))
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  ks=pg.evaluate("""(()=>{AMS.w={};const cs=DW.filter(c=>c.l===2&&!isY(c)).slice(0,2);const ks=cs.map(c=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:2,due:Date.now()+864e5,log:[],t:Date.now()};return k});
    WS=null;go({screen:'amw'});wRound(2,ks,{from:'amw'});return ks})()""");pg.wait_for_timeout(1200)
  st=pg.evaluate("[S.screen,WS.round,WS.phase,wTaskNow(AMS.w[WS.list[WS.i]]),!!document.querySelector('#markY'),!!document.querySelector('#markN')]");print(st)
  assert st[:4]==['amwl',2,'e2h','en2he'] and not st[4] and not st[5]
  t=pg.inner_text('#app');assert 'סבב 2 – הפירוש בעברית' in t and 'ידעתי' not in t,t[:400]
  pg.fill('#wAns','משהו');pg.click('#wGo');pg.wait_for_timeout(1500)
  r=pg.evaluate("[AMS.w[%r].lr, (WS.res||{}).ok]"%ks[0]);print('after right',r);assert r[0]==3
  # wrong on the second word: stays in round 2
  V[0]='wrong';pg.click('#wOn');pg.wait_for_timeout(1000)
  pg.fill('#wAns','לא');pg.click('#wGo');pg.wait_for_timeout(1500)
  r=pg.evaluate("[AMS.w[%r].lr,WS.list.length]"%ks[1]);print('after wrong',r);assert r==[2,3]
  # an old session at the dictionary-quiz phase continues as the typed round
  pg.evaluate("(()=>{WS.phase='dq';WS.i=0;draw()})()");pg.wait_for_timeout(600);assert pg.evaluate("WS.phase")=='e2h'
  assert not e,e;print('OK')
