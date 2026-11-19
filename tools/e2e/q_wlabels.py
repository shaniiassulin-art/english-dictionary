# labels of dictionary words in a question: waiting / learning now / learned / known, and the add button
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort());pg.route('**/translate.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const L=e=>amDbLabel(dictFind(e));const c=dictFind('muscle').cards[0],f=dictFind('facial').cards[0],t=dictFind('tender').cards[0];
    const out=[L('muscle')];wAdd(c.e,c.h[0],'','dict:'+c.id,'c:'+c.id);out.push(L('muscle'));
    wAdd(f.e,f.h[0],'','dict:'+f.id,'c:'+f.id);const w=AMS.w['c:'+f.id];w.st=1;w.lr=2;out.push(L('facial'));w.lr=5;out.push(L('facial'));w.st=WMAST;out.push(L('facial'));
    setKnow(t.id,'y');dictFind('tender').cards.forEach(c=>setKnow(c.id,'y'));out.push(L('tender'));return out})()""")
  print(r);assert r==['','⏳ ממתינה ללמידה','📖 בלמידה עכשיו','✓ למדת · בחזרות','✓ למדת','✓ יודעת'],r
  assert not errs,errs;print('OK');b.close()
