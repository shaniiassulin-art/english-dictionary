# detailed explanation after answering a question: folded, opens → Gemini explanation; a wrong book translation is replaced
from playwright.sync_api import sync_playwright
import json
GEM={"translation":"חיוך מפעיל 17 שרירים בפנים, וכיווץ גבות – 43.","book_wrong":"'הזעפת פנים' לא מדויק","words":[{"en":"smile","he":"חיוך"},{"en":"uses","he":"משתמש"}],"understand":["המשפט משווה בין חיוך לכיווץ גבות"],"options":[{"en":"facial","he":"של הפנים","ok":True,"why":"שרירים של הפנים"},{"en":"regal","he":"מלכותי","ok":False,"why":"לא קשור"}],"answer":"facial מתאר את השרירים","tip":"‑al = של"}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(GEM,ensure_ascii=False)}]}}]})))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("amStart(['csc5-1'],'t','learn','am','sc')");pg.wait_for_timeout(800)
  pg.locator('.ax-rad').first.click();pg.wait_for_timeout(300)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.wait_for_timeout(800)
  assert pg.locator('details.am-xpl').count()==1 and not pg.locator('details.am-xpl[open]').count()
  pg.locator('[data-xplfix]').click();pg.wait_for_timeout(2500)
  t=pg.locator('.am-xpl').inner_text();print(t[:300])
  assert 'מילה אחר מילה' in t and 'facial' in t and 'כיווץ' in pg.locator('.am-box.good').first.inner_text()
  assert 'מתוקן' in pg.locator('.am-box.good').first.inner_text()
  pg.screenshot(path='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/xpl.png',full_page=True)
  assert not errs,errs;print('OK');b.close()
