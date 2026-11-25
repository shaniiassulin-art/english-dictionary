# The card's Hebrew sentence = its example sentence in Hebrew: once the English example was shown (translation round),
# review 1 / round 3 get a new Gemini sentence, and the answered page keeps the sentence she answered (Nov 25, her report)
import json
from playwright.sync_api import sync_playwright
FAIL=[False]
def gem(route):
  if FAIL[0]:return route.fulfill(status=500,body='x')
  body=json.dumps({'he':'הילדה [[גדלה]] מהר מאוד השנה.','en':'The girl grew very fast this year.','fits':True,'w_he':'גדלה'})
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'candidates':[{'content':{'parts':[{'text':body}]}}]}))
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  def start(seen):
    return pg.evaluate("""(seen)=>{const c=DW.find(c=>c.e==='grow');AMS.w={};const k='c:'+c.id;
      AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:5,due:Date.now()-1000,log:[],t:Date.now(),trs:seen?[{en:c.s,t:1}]:[]};Object.keys(HEERR).forEach(x=>delete HEERR[x]);Object.keys(HEP).forEach(x=>delete HEP[x]);WS=null;go({screen:'amw'});wStart('rev');return wHeSent(AMS.w[k])}""",seen)
  s0=start(False);pg.wait_for_timeout(1500);t=pg.locator('[data-task=hecl]').inner_text();print('unseen:',t);assert 'גדלה' not in t
  s0=start(True);pg.wait_for_timeout(2500);t=pg.locator('[data-task=hecl]').inner_text();print('seen:',t);assert 'הילדה' in t
  right=pg.evaluate("Object.values(AMS.w)[0].e");pg.locator(f'[data-wmc="{right}"]').first.click();pg.wait_for_timeout(800)
  t2=pg.locator('[data-task=hecl]').inner_text();print('answered:',t2);assert 'הילדה' in t2
  FAIL[0]=True;pg.evaluate("delete Object.values(AMS.w)[0].rvh");start(True);pg.wait_for_timeout(4000)
  t3=pg.inner_text('#app');print('gemini down:',t3[:300]);assert pg.locator('[data-task=hecl]').count()==1  # falls back to the card's sentence
  assert not e,e;print('OK')
