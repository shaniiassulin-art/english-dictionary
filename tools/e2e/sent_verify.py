# Gemini sentences are checked by a second strict prompt (a rejected one is replaced); "⚠️ המשפט לא הגיוני" undoes a wrong answer and drops the sentence
from playwright.sync_api import sync_playwright
import json
A='We can put our travel bags in this case.';B='In that case, the trip will be postponed until Friday.'
def body(j):return json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(j,ensure_ascii=False)}]}}]})
N={'gen':0}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  def gem(r):
    d=r.request.post_data or ''
    if 'strict native-English editor' in d:j={"ok":('«'+A+'»') not in d,"why":"odd"}
    elif 'Write ONE English sentence' in d:N['gen']+=1;j={"en":A if N['gen']==1 else B,"he":"x במקרה y","w_he":"במקרה"}
    else:j={}
    r.fulfill(status=200,content_type='application/json',body=body(j))
  pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("""(()=>{AMS.w={};const c=DW.find(c=>c.id==='case#0');const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:2,lr:5,due:Date.now()-1000,log:[],t:Date.now(),used:[]};
    SPOOLX=[];WS=null;go({screen:'amw'});wStart('rev')})()""");pg.wait_for_timeout(4000)
  rv=pg.evaluate("(Object.values(AMS.w)[0].rv||{}).en");print('rv',rv,N)
  assert rv==B,'rejected sentence replaced'
  # answer wrong
  pg.locator('[data-wmc]').filter(has_not_text='case').first.click();pg.wait_for_timeout(800)
  assert pg.locator('#wBadS').count()==1
  st1=pg.evaluate("Object.values(AMS.w)[0].st");pg.click('#wBadS');pg.wait_for_timeout(800)
  w=pg.evaluate("Object.values(AMS.w)[0]");print(st1,w['st'],w.get('used'),pg.evaluate("WS&&WS.again"))
  assert st1==1 and w['st']==2 and w['used'].count(B)==1 and not any(x.startswith('he:') for x in w['used']) and (w.get('rv') or {}).get('en')!=B
  assert not errs,errs;print('OK');b.close()
