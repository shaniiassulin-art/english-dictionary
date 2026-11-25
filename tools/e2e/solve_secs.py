# the waiting line of the method page counts seconds
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=500,body='x'))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("amStart(['crs5-1'],'t','learn','am','rs')");pg.wait_for_timeout(800)
  a=pg.evaluate("AMD.q['crs5-1'].a");pg.locator('.ax-rad').nth(a-1).click();pg.wait_for_timeout(200)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.evaluate("['x4|crs5-1','m|crs5-1'].forEach(k=>{delete AMAI[k];AIP[k]=new Promise(()=>{})})");pg.wait_for_timeout(500);pg.click('#amNext');pg.wait_for_timeout(3500)
  t=pg.locator('#amMeth').inner_text();print(t);assert 'שנ׳' in t and int(pg.locator('[data-secs]').inner_text())>=2
  assert not errs,errs;print('OK');b.close()
