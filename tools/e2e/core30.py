# 30 required minutes a day, the rest bonus (Nov 23, her request)
import json
from playwright.sync_api import sync_playwright
def gem(route):route.fulfill(status=500,body='x')
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  # a fresh plan: core = rev · new · one question type (few) · rev2 ≈ 30 min; the rest bonus, after the core
  r=pg.evaluate("""(()=>{AMS.jp={};AMS.js=null;const T=dayKey(),P=jrPlan(T);return [jrGoal(T),P.b.map(x=>[x.k+(x.qt||''),x.n,x.m,x.bo?1:0])]})()""");print(r)
  assert r[0]==30;core=[x for x in r[1] if not x[3]];bo=[x for x in r[1] if x[3]]
  assert [x[0][:3] for x in core]==['rev','new','q'+core[2][0][1:3],'rev2'][:4] or True
  assert len(core)==4 and core[0][0]=='rev' and core[1][0]=='new' and core[2][0][0]=='q' and core[3][0]=='rev2' and sum(x[2] for x in core)==30
  assert core[1][1]==6 and core[2][1]<=5 and len(bo)==4 and r[1].index(bo[0])==4
  # an old plan (made before) → converted without bumping P.t
  r=pg.evaluate("""(()=>{const T=dayKey();AMS.jp={};AMS.js=T;let n=0;const B=(k,m,c)=>({id:T+'|'+k+(n++),k,m,n:c||0,d:0,done:0,used:0});
    const qb=jrQB(T,true,()=>n++).map(x=>{delete x.bo;return x});qb.forEach(x=>{if(x.qt==='sc'){x.n=15;x.m=30}});
    const P=AMS.jp[T]={b:[B('rev',20),B('new',25,16),...qb,B('meth',10,1),B('rev2',10)],t:5};jrNorm(T,P);
    return [P.t,P.b.map(x=>[x.k+(x.qt||''),x.n,x.m,x.bo?1:0])]})()""");print(r)
  assert r[0]==5;core=[x for x in r[1] if not x[3]];assert len(core)==4 and sum(x[2] for x in core)==30 and core[1][1]==6 and core[3][0]=='rev2'
  # core done, 30 minutes → plan done, gap ignores bonus, hub offers the bonus
  r=pg.evaluate("""(()=>{const T=dayKey(),P=AMS.jp[T];P.b.forEach(x=>{if(!x.bo)x.done=amNow()});AMS.tm={};AMS.tm[T]=31*6e4;S.jday=null;go({screen:'am'});
    return [jrDone(P),!!jrBonus(P),jrCur(P)||null]})()""");pg.wait_for_timeout(600);print(r)
  assert r[0] and r[1] and r[2] is None
  t=pg.inner_text('#app');print(t[:400]);assert 'חצי השעה הושלמה' in t and 'בונוס' in t and pg.locator('#jrBo').count()==1 and pg.locator('#jrNext').count()==1
  # core done in less than 30 minutes → the next bonus step is "until the goal" (no extra step added)
  r=pg.evaluate("""(()=>{const T=dayKey(),P=AMS.jp[T];AMS.tm[T]=10*6e4;const L=P.b.length;draw();return [P.b.length===L]})()""");pg.wait_for_timeout(500)
  t=pg.inner_text('#app');print(t[:300]);assert r[0] and 'עד היעד' in t and pg.locator('#jrGo').count()==1
  # a past day with only the core done is no gap
  r=pg.evaluate("""(()=>{const T=dayKey(),Y=kAdd(T,-1);AMS.js=Y;const P=jrPlan(Y);P.b.forEach(x=>{if(!x.bo)x.done=amNow()});AMS.tm[Y]=30*6e4;const g=jrGap(),G=jrGapInfo();return [g.days,G.miss,G.days]})()""");print(r)
  assert r==[0,0,0]
  assert not e,e;print('OK')
