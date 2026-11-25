# a marked word can get another explanation (kept under the first); her eliminations show after answering (option rows + method page)
from playwright.sync_api import sync_playwright
import json
N=[0]
def body(j):return json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(j,ensure_ascii=False)}]}}]})
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  def gem(r):
    d=r.request.post_data or ''
    if 'did not understand the explanations' in d:N[0]+=1;j={"how":"הסבר-אחר-%d"%N[0],"meaning":"פירוש"}
    elif 'marked words she did not know' in d:j={"words":[{"en":"WORD","how":"הסבר-ראשון","meaning":"פ"}]}
    elif 'using the course method' in d:j={"steps":["צעד"],"rule":"כלל"}
    else:j={"translation":"ת","understand":["ה"],"options":[{"en":"a","he":"א","ok":True,"why":"ס"},{"en":"b","he":"ב","ok":False,"why":"ס2"},{"en":"c","he":"ג","ok":False,"why":"ס3"},{"en":"d","he":"ד","ok":False,"why":"ס4"}],"answer":"ל","tip":"ט"}
    r.fulfill(status=200,content_type='application/json',body=body(j))
  pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("amStart(['crs5-1'],'t','learn','am','rs')");pg.wait_for_timeout(1500)
  w=pg.evaluate("(()=>{const q=AMD.q['crs5-1'];const w=(q.q.match(/[a-z]{5,}/g)||[])[0];const st=aqSt();st.unk=[w];return w})()")
  pg.evaluate("(()=>{const q=AMD.q['crs5-1'];const bad=[1,2,3,4].find(k=>k!==q.a);aqSt().elim={[bad]:'add',[q.a]:'ext'};amRedrawKeep()})()");pg.wait_for_timeout(300)
  # answer with a third option
  a=pg.evaluate("(()=>{const q=AMD.q['crs5-1'];const bad=[1,2,3,4].find(k=>k!==q.a);return [1,2,3,4].find(k=>k!==q.a&&k!==bad)})()");pg.locator('.ax-rad').nth(a-1).click();pg.wait_for_timeout(200)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.wait_for_timeout(1500)
  pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body=body({"words":[{"en":w,"how":"הסבר-ראשון","meaning":"פ"}]})) if 'marked words she did not know' in (r.request.post_data or '') else gem(r))
  pg.evaluate("Object.keys(AMAI).filter(k=>k.startsWith('xu3|')).forEach(k=>delete AMAI[k]);amRedrawKeep()");pg.wait_for_timeout(1500)
  t=pg.locator('.ax-opts').inner_text();print(t[:300])
  assert 'פסלת: מידע נוסף' in t and 'אבל זו התשובה הנכונה' in t
  pg.locator('[data-unkalt]').first.click();pg.wait_for_timeout(1500)
  pg.locator('[data-unkalt]').first.click();pg.wait_for_timeout(1500)
  u=pg.locator('.am-unkbox').inner_text();print(u)
  assert 'הסבר-ראשון' in u and 'הסבר-אחר-1' in u and 'הסבר-אחר-2' in u
  for _ in range(3):
    if pg.locator('#amMeth').count():break
    if pg.locator('.am-why button').count() and not pg.locator('#amNext').count():break
    pg.click('#amNext');pg.wait_for_timeout(600)
  m=pg.locator('#amMeth').inner_text();assert 'פסלת' in m,m
  assert not errs,errs;print('OK');b.close()
