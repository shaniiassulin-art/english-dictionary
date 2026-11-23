# A wrong review answer moves the word ONE review back (her request, Nov 23 – was two), never below review 1; next review tomorrow
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2000)
  r=pg.evaluate("""(()=>{const out=[];for(const st of [5,4,2,1]){const c=DW[st];AMS.w={};const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st,lr:5,due:Date.now()-1000,log:[],t:Date.now()};
    WS={mode:'rev',list:[k],i:0,step:'recall',hint:0,ok:0,bad:0,res:{task:'mc'}};wGrade(AMS.w[k],false,0);out.push([st,AMS.w[k].st,AMS.w[k].due>Date.now()+20*3600e3])}return out})()""")
  print(r);assert [x[1] for x in r]==[4,3,1,1] and all(x[2] for x in r)
  assert not e,e;print('OK')
