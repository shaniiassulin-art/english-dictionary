# when Gemini has no quota, the method page shows the book translation, the method steps and the options instead of only an error; one method link
import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=429,content_type='application/json',body=json.dumps({"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}})))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("amStart(['csc9-2'],'t','learn','am','sc')");pg.wait_for_timeout(800)
  a=pg.evaluate("AMD.q['csc9-2'].a");pg.locator('.ax-rad').nth(a-1).click();pg.wait_for_timeout(200)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.wait_for_timeout(300);pg.click('#amNext');pg.wait_for_timeout(12000)
  t=pg.locator('#amMeth').inner_text();print(t)
  assert 'בינתיים' in t and 'התשובות' in t and '✓' in t and 'לנסות שוב' in t
  assert pg.locator('.am-mlink, .am-ml').count()==1, pg.locator('.am-mlink, .am-ml').count()
  assert not errs,errs;print('OK');b.close()
