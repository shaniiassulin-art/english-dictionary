# words of a question: dictionary words say "במילון" (+ learn soon); other words can be added to the dictionary ("מילים שהוספתי") and queued first
from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps({"he":"זעף"},ensure_ascii=False)}]}}]})))
  pg.route('**/translate.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("amStart(['csc5-1'],'t','learn','am','sc')");pg.wait_for_timeout(800)
  pg.locator('.ax-rad').first.click();pg.wait_for_timeout(300)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.wait_for_timeout(500);pg.click('#amNext');pg.wait_for_timeout(2500)
  t=pg.locator('.am-wordsbox').inner_text();print(t[:400])
  assert 'במילון' in t and 'לא במילון' in t and 'frown' in t
  pg.locator('[data-uwsoon="frown"]').click();pg.wait_for_timeout(800)
  r=pg.evaluate("[!!W['u|frown'],byLv(UL).length,!!dictFind('frown'),wQueue(3).map(w=>w.e)]");print(r)
  assert r[0] and r[1]==1 and r[2] and r[3][0]=='frown'
  pg.reload();pg.wait_for_timeout(2000)
  assert pg.evaluate("!!W['u|frown']"),'kept after reload'
  pg.evaluate("go({screen:'home'})");pg.wait_for_timeout(800);assert pg.locator('#uwGo').count()==1
  pg.click('#uwGo');pg.wait_for_timeout(800);print(pg.locator('.dpage').first.inner_text()[:120])
  assert not errs,errs;print('OK');b.close()
