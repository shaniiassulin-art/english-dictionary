# unfinished learning (left in the middle) never shows up in the reviews and continues in a later day's new-words step
from playwright.sync_api import sync_playwright
import re
DAY=86400000
with sync_playwright() as p:
  b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':844})
  ctx.add_init_script("(()=>{const n=Date.now.bind(Date);Date.now=()=>n()+(+localStorage.getItem('__off')||0)})()")
  ctx.route('**/firestore.googleapis.com/**',lambda r:r.abort());ctx.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear();localStorage.setItem('__off',String(-3*%d))"%DAY);pg.reload();pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  # day 1: start today's new words, translate 3 words (round 1), then leave
  pg.evaluate("go({screen:'am'});const k=jrCurKey(),P=AMS.jp[k];const x=P.b.find(x=>x.k==='new');for(const y of P.b){if(y===x)break;y.done=1}amSave();jrRun(x)");pg.wait_for_timeout(1500)
  print('day1 screen',pg.evaluate("S.screen"));(pg.click('#jsSkip'),pg.wait_for_timeout(500)) if pg.locator('#jsSkip').count() else None;pg.click('#nwGo');pg.wait_for_timeout(1200)
  for i in range(3):
    pg.wait_for_selector('#trIn',timeout=10000);pg.fill('#trIn','משהו');pg.click('#trChk');pg.wait_for_timeout(1500)
    if pg.locator('#trLater').count():pg.click('#trLater');pg.wait_for_timeout(400)
    if pg.locator('#trY').count():pg.click('#trY');pg.wait_for_timeout(300)
    pg.click('#wOn');pg.wait_for_timeout(800)
  started=pg.evaluate("Object.keys(AMS.w).filter(k=>AMS.w[k].st>=1)")
  print('started',started,pg.evaluate("Object.values(AMS.w).filter(w=>w.st>=1).map(w=>[w.e,w.lr])"))
  assert len(started)==3
  pg.evaluate("wSave();go({screen:'am'})")
  # an old review session that holds these words (made by an older version / another device)
  pg.evaluate("WS={mode:'rev',list:%s,i:0,step:'recall',hint:0,from:'am',ok:0,bad:0};wSave()"%started)
  # day 3
  pg.evaluate("localStorage.setItem('__off','0')");pg.reload();pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const ks=%s;const due=wDue(0).map(wK),due30=wDue(18e5).map(wK);
    const k=jrCurKey(),P=AMS.jp[k],x=P.b.find(x=>x.k==='new');const ws=jnBatch(x);
    return {day:k,inDue:ks.filter(k=>due.includes(k)||due30.includes(k)),inBatch:ks.filter(k=>ws.includes(k)),pend:jnPend(x).filter(k=>ks.includes(k)).length,counts:wRoundCounts(ws)}})()"""%started)
  print(r)
  assert not r['inDue'],'learning words in reviews'
  assert len(r['inBatch'])==3 and r['pend']==3,'carried into today'
  # the old review session skips them
  pg.evaluate("go({screen:'amwl'});draw()");pg.wait_for_timeout(800)
  shown=pg.evaluate("WS&&WS.list&&WS.list[WS.i]||null");print('old rev session shows',shown,pg.evaluate("S.screen"))
  assert shown not in started
  # today's new step is relit when it was done while learning is unfinished
  r2=pg.evaluate("(()=>{const k=jrCurKey(),P=AMS.jp[k],x=P.b.find(x=>x.k==='new');x.done=1;jrCurKey();return x.done})()")
  assert not r2,'new step relit';
  # merge keeps the newer round
  r3=pg.evaluate("(()=>{const a={w:{k:{k:'k',e:'x',st:1,lr:3,t:200}}},b={w:{k:{k:'k',e:'x',st:1,t:100}}};return amMerge(b,a).w.k.lr})()")
  assert r3==3
  assert not errs,errs;print('OK');b.close()
