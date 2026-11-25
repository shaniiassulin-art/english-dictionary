# one "how to solve" page: the method page holds the detailed explanation + the method steps, no folded explanation on the result page, each part once
from playwright.sync_api import sync_playwright
import json
X={"translation":"תרגום-מלא","book_wrong":"","understand":["קריאה-1"],"options":[{"en":"a","he":"א","ok":True,"why":"סיבה-א"},{"en":"b","he":"ב","ok":False,"why":"סיבה-ב"}],"answer":"למה-כך","tip":"טיפ-1"}
M={"steps":["צעד-שיטה-1","צעד-שיטה-2"],"options":["אפשרות-שיטה"],"rule":"כלל-1"}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  def gem(r):
    j=M if 'using the course method' in (r.request.post_data or '') else X
    r.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(j,ensure_ascii=False)}]}}]}))
  pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  for qid,t in [('csc5-1','sc'),('crs5-1','rs')]:
    pg.evaluate(f"amStart(['{qid}'],'t','learn','am','{t}')");pg.wait_for_timeout(3000)
    assert pg.evaluate(f"!!AMAI['m|{qid}']"),'method made ahead'
    pg.locator('.ax-rad').first.click();pg.wait_for_timeout(300)
    if pg.locator('#amChk').count():pg.click('#amChk')
    pg.wait_for_timeout(600)
    assert pg.locator('details.am-xpl').count()==0
    for _ in range(3):
      if pg.locator('#amMeth').count():break
      pg.click('#amNext');pg.wait_for_timeout(600)
    t=pg.locator('#amMeth').inner_text();print(t[:400])
    for w in ['תרגום-מלא','קריאה-1','צעד-שיטה-1','סיבה-א','למה-כך','כלל-1','טיפ-1']:assert w in t,w
    assert 'אפשרות-שיטה' not in t,'options once'
    assert pg.locator('#amMeth').count()==1 and pg.locator('[data-askgo],.ask').count()>=0
  assert not errs,errs;print('OK');b.close()
