# words page of a question: each meaning has ✓ יודעת / ✗ לא יודעת – ✓ marks only that card and takes it out of the learning; ✗ on a learned meaning sends it back to learning
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  for h in ['firestore.googleapis.com','generativelanguage.googleapis.com','translate.googleapis.com']:pg.route('**/'+h+'/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  # a question with a multi-meaning dictionary word
  qid=pg.evaluate("""Object.keys(AMD.q).find(id=>/^csc/.test(id)&&amQWords(id).some(d=>d.cards.length>1))""");print(qid)
  d=pg.evaluate(f"(()=>{{const d=amQWords('{qid}').find(d=>d.cards.length>1);return [d.e,d.cards.map(c=>c.id)]}})()");print(d)
  ids=d[1]
  # second meaning is learned (in reviews)
  pg.evaluate(f"(()=>{{const c=W['{ids[1]}'];wAdd(c.e,c.h[0],'','dict:'+c.id,'c:'+c.id);const w=AMS.w['c:'+c.id];w.st=3;w.lr=5;w.due=Date.now()}})()")
  pg.evaluate(f"amStart(['{qid}'],'t','learn','am','sc')");pg.wait_for_timeout(800)
  a=pg.evaluate(f"AMD.q['{qid}'].a");pg.locator('.ax-rad').nth(a-1).click();pg.wait_for_timeout(200)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.wait_for_timeout(300)
  for _ in range(4):
    if pg.locator('.am-wordsbox').count():break
    pg.click('#amNext');pg.wait_for_timeout(500)
  assert pg.locator(f'[data-kmy="{ids[0]}"]').count()==1 and pg.locator(f'[data-kmn="{ids[1]}"]').count()==1
  pg.click(f'[data-kmy="{ids[0]}"]');pg.wait_for_timeout(300)
  r=pg.evaluate(f"[isY(W['{ids[0]}']),isY(W['{ids[1]}']),wQueue(5000).some(x=>(x.k||'')==='c:{ids[0]}'||(x.w&&x.w.k==='c:{ids[0]}'))]");print(r)
  assert r[0] and not r[1] and not r[2]
  pg.click(f'[data-kmn="{ids[1]}"]');pg.wait_for_timeout(300)
  r=pg.evaluate(f"(()=>{{const w=AMS.w['c:{ids[1]}'];return [isN(W['{ids[1]}']),w.st,wDue().some(x=>wK(x)==='c:{ids[1]}'),wNewOk(w)]}})()");print(r)
  assert r[0] and r[1]==0 and not r[2] and r[3]
  assert pg.locator(f'[data-kmn="{ids[1]}"][aria-pressed="true"]').count()==1
  pg.locator('.am-wordsbox').scroll_into_view_if_needed();pg.wait_for_timeout(2800);pg.screenshot(path='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/km.png')
  assert not errs,errs;print('OK');b.close()
