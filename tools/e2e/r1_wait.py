# review 1 comes when every word of the day's learning finished its 4 rounds; an unfinished day → next morning
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':844})
  ctx.route('**/firestore.googleapis.com/**',lambda r:r.abort());ctx.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const now=amNow();AMS.w={};const mk=(e,lr)=>{const k=wKey(e);AMS.w[k]={e,h:['x'],k,st:1,lr,due:now-1000,t:now,log:[]};return AMS.w[k]};
    const a=mk('alpha',4),b=mk('beta',3);
    WS={mode:'r2',perWord:1,round:4,list:[a.k],i:0,again:[]};wAfter(a,true);
    const one={due:wDue(0).map(w=>w.e),aDue:a.due-now,r1w:a.r1w};
    b.lr=4;WS={mode:'r2',perWord:1,round:4,list:[b.k],i:0,again:[]};wAfter(b,true);
    return {one,two:wDue(0).map(w=>w.e).sort(),flags:[a.r1w,b.r1w]}})()""")
  print(r)
  assert r['one']['due']==[] and r['one']['aDue']>0 and r['one']['r1w']==1,'waits while another word is in learning'
  assert r['two']==['alpha','beta'] and r['flags']==[None,None],'all due once the day is done'
  print('errors',errs);assert not errs
  print('OK')
