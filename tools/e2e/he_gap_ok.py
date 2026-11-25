# A Hebrew sentence whose meaning still shows outside the gap is rejected (Nov 25, her screenshot: "הלקוח הצעיר יטיל ספק ___ הסופי" for question = להטיל ספק)
import json
from playwright.sync_api import sync_playwright
N=[0]
def gem(route):
  N[0]+=1
  he='הלקוח הצעיר יטיל ספק [[במחיר]] הסופי.' if N[0]==1 else 'הלקוח הצעיר [[יטיל ספק]] במחיר הסופי.'
  body=json.dumps({'he':he,'en':'The young customer will question the final price.','fits':True,'w_he':'להטיל ספק'})
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'candidates':[{'content':{'parts':[{'text':body}]}}]}))
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const w={e:'question',h:'להטיל ספק'};return [heGapOk(w,'הלקוח הצעיר יטיל ספק _____ הסופי.'),heGapOk(w,'הלקוח הצעיר _____ במחיר הסופי.')]})()""");print(r);assert r==[False,True]
  # a stored bad sentence is dropped, Gemini's first (bad) answer is rejected, the second is used
  pg.evaluate("""(()=>{const c=DW.find(c=>c.e==='question'&&/ספק/.test(c.h[0]));AMS.w={};const k='c:'+c.id;
    AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:5,due:Date.now()-1000,log:[[1,'hecl',1,0]],t:Date.now(),rvh:{he:'הלקוח הצעיר יטיל ספק _____ הסופי.',en:'x',src:'ai',g:1}};WS=null;go({screen:'amw'});wStart('rev')})()""");pg.wait_for_timeout(3500)
  t=pg.locator('[data-task=hecl]').inner_text();print(t,N[0]);assert 'יטיל ספק' not in t and 'במחיר' in t
  assert not e,e;print('OK')
