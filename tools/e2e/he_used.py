# A Hebrew sentence answered RIGHT is used up too: when the word goes back to review 1 (or comes from learning round 3) it gets another sentence (her request)
import json
from playwright.sync_api import sync_playwright
def gem(route):
  b=route.request.post_data or ''
  body=json.dumps({'he':'הילדה [[גדלה]] מהר מאוד השנה.','en':'The girl grew very fast this year.','fits':True})
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'candidates':[{'content':{'parts':[{'text':body}]}}]}))
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  s0=pg.evaluate("""(()=>{const c=DW.find(c=>c.e==='grow')||DW.find(c=>wHeSent({k:'c:'+c.id,e:c.e,h:c.h[0]}));AMS.w={};const k='c:'+c.id;
    AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:5,due:Date.now()-1000,log:[],t:Date.now()};go({screen:'amw'});wStart('rev');return wHeSent(AMS.w[k])})()""")
  pg.wait_for_timeout(1200);he1=pg.locator('[data-task=hecl]').inner_text();print('first:',he1)
  right=pg.evaluate("Object.values(AMS.w)[0].e");pg.locator(f'[data-wmc="{right}"]').first.click();pg.wait_for_timeout(500)
  used=pg.evaluate("Object.values(AMS.w)[0].used||[]");print('used',used);assert ('he:'+s0) in used
  # the word drops back to review 1 → another Hebrew sentence
  pg.evaluate("(()=>{const w=Object.values(AMS.w)[0];w.st=1;w.due=Date.now()-1000;WS=null;go({screen:'amw'});wStart('rev')})()");pg.wait_for_timeout(2500)
  he2=pg.locator('[data-task=hecl]').inner_text();print('again:',he2);assert he2.strip()!=he1.strip()
  assert not e,e;print('OK')
