# Time on words carried over from an earlier day isn't counted in today's half hour (Nov 25, her request); other learning time is
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=500,body='x'))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const T=dayKey(),P=jrPlan(T),x=P.b.find(b=>b.k==='new');const cs=DW.filter(c=>c.l===2&&!isY(c)).slice(0,2);
    const ks=cs.map(c=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:3,due:Date.now()+864e5,log:[],t:Date.now()};return k});
    x.ws=ks.slice();x.carry=[ks[0]];WS={jr:x.id,perWord:1,round:3,list:ks,i:0,mode:'r2',phase:'he',step:'recall',all:ks};S.screen='amwl';
    const a=jrCarryNow();WS.i=1;const b=jrCarryNow();return [a,b]})()""");print(r);assert r==[True,False]
  # extra time line: carried words (AMS.tx) + reviews beyond their planned minutes, on the hub and the day list
  t=pg.evaluate("""(()=>{const T=dayKey();AMS.tx={};AMS.tx[T]=4*6e4;const P=AMS.jp[T];const r=P.b.find(x=>x.k==='rev');r.used=(r.m+5)*6e4;WS=null;go({screen:'am'});return jrExtraTxt(T)})()""");print(t)
  assert t=='+4 דק׳ מילים מיום קודם · חזרות: 5 דק׳ מעבר לתוכנית';pg.wait_for_timeout(600);assert 'זמן נוסף היום' in pg.inner_text('#app')
  pg.evaluate("go({screen:'amgap'})");pg.wait_for_timeout(600);assert 'זמן נוסף: +4' in pg.inner_text('#app')
  m=pg.evaluate("(()=>{const a={tx:{x:1}},b={tx:{x:3}};return amMerge(a,b).tx.x})()");print('merge',m);assert m==3
  assert not e,e;print('OK')
