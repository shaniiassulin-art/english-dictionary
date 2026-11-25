# a failed explanation shows the reason + retry once (no silent endless retry); an answer longer than the old 1400-token limit is allowed (max sent)
from playwright.sync_api import sync_playwright
import json
N={'n':0,'max':[]}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  def gem(r):
    N['n']+=1;d=json.loads(r.request.post_data or '{}');N['max'].append(d.get('generationConfig',{}).get('maxOutputTokens'))
    r.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":'{"translation":"cut off'}]}}]}))
  pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("amStart(['crs5-1'],'t','learn','am','rs')");pg.wait_for_timeout(800)
  a=pg.evaluate("AMD.q['crs5-1'].a");pg.locator('.ax-rad').nth(a-1).click();pg.wait_for_timeout(200)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.wait_for_timeout(500);pg.click('#amNext');pg.wait_for_timeout(30000)
  n1=N['n'];pg.wait_for_timeout(28000);n2=N['n']
  t=pg.locator('#amMeth').inner_text();print(t,n1,n2,set(N['max']))
  assert 'לנסות שוב' in t and n2==n1 and 3000 in N['max'],(n1,n2)
  assert not errs,errs;print('OK');b.close()
