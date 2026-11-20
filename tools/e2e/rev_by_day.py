# reviews come by day: everything due today (until tomorrow 05:00) is due now, so finishing the reviews leaves none for later today
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const now=amNow(),nm=wNextMorning(),cs=DW.filter(c=>c.l===2).slice(0,4);AMS.w={};
    const mk=(c,due,r1w)=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:2,lr:5,due,log:[],t:now,...(r1w?{r1w:1}:{})};return k};
    const a=mk(cs[0],now-1000),b=mk(cs[1],Math.min(nm-60e3,now+60e3)),c=mk(cs[2],nm+36e5),d=mk(cs[3],nm,1);
    const due=wDue().map(w=>w.k);return {due,a,b,c,d,when:[wWhen(nm+36e5),wWhen(nm+DAY+36e5)]}})()""")
  print(r,e)
  assert r['a'] in r['due'] and r['b'] in r['due'] and r['c'] not in r['due'] and r['d'] not in r['due'] and r['when']==['מחר','בעוד יומיים'] and not e
  print('OK')
