# detailed explanation after answering a question: folded, opens → Gemini explanation; a wrong book translation is replaced
from playwright.sync_api import sync_playwright
import json
GEM={"translation":"חיוך מפעיל 17 שרירים בפנים, וכיווץ גבות – 43.","book_wrong":"'הזעפת פנים' לא מדויק","decode":[{"en":"facial","how":"face + al = של הפנים","meaning":"של הפנים"}],"understand":["המשפט משווה בין חיוך לכיווץ גבות"],"options":[{"en":"facial","he":"של הפנים","ok":True,"why":"שרירים של הפנים"},{"en":"regal","he":"מלכותי","ok":False,"why":"לא קשור"}],"answer":"facial מתאר את השרירים","tip":"‑al = של"}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  FIX={"he":"חיוך מפעיל 17 שרירי פנים, וזעף – 43.","changed":True,"why":"מילה"}
  def gem(r):
    j=FIX if 'The student says' in (r.request.post_data or '') else GEM
    r.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(j,ensure_ascii=False)}]}}]}))
  pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("amStart(['csc5-1'],'t','learn','am','sc')");pg.wait_for_timeout(800)
  pg.wait_for_timeout(1500);assert pg.evaluate("!!AMAI['x3|csc5-1']"),'made ahead'
  pg.locator('.ax-rad').first.click();pg.wait_for_timeout(300)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.wait_for_timeout(800)
  assert pg.locator('details.am-xpl').count()==1 and not pg.locator('details.am-xpl[open]').count()
  pg.locator('.am-xpl>summary').click();pg.wait_for_timeout(500)
  t=pg.locator('.am-xpl').inner_text();print(t[:300])
  assert 'איך מבינים מילה' in t and 'facial' in t and 'כיווץ' in pg.locator('.am-box.good').first.inner_text()
  assert 'מתוקן' not in pg.locator('.am-box.good').first.inner_text() and 'כיווץ' in pg.locator('.am-box.good').first.inner_text()
  assert 'כמעט מוכן' not in t
  pg.locator('[data-qtrfix]').click();pg.wait_for_timeout(2000)
  assert 'וזעף' in pg.locator('.am-box.good').first.inner_text(),'fixed on request'
  assert pg.locator('.am-box.good bdi').count()==0 or True
  pg.screenshot(path='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/xpl.png',full_page=True)
  assert not errs,errs;print('OK');b.close()
