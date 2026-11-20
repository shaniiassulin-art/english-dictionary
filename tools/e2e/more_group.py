# another group of new words after finishing; learned words ✓ in the dictionary; questions outside the journey count for today's step; no free word practice
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const T=dayKey(),P=jrPlan(T),x=P.b.find(b=>b.k==='new');const cs=DW.filter(c=>c.l===4&&!isY(c)&&!isN(c)).slice(0,3);
    x.ws=cs.map(c=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:5,due:wNextMorning(),log:[[amNow(),'mc',1,0]],t:amNow()};return k});x.d=x.n;amSave();
    const before=cs.map(c=>!!isY(c));const n=wLearnedSync();const after=cs.map(c=>!!isY(c));
    const q=P.b.find(b=>b.k==='q'&&b.qt==='sc');const d0=q.d;const id=Object.keys(AMD.q).find(i=>/^c/.test(i)&&AMD.q[i].t==='sc'&&!amLast(i));AQ=null;amRecord(id,AMD.q[id].a,3000);
    return {xid:x.id,before,after,n,d0,d1:q.d,blocks:P.b.length}})()""")
  print(r)
  pg.evaluate("xid=>go({screen:'amnw',jb:xid})",r['xid']);pg.wait_for_timeout(800)
  more=pg.locator('#nwMore').count();pg.click('#nwMore');pg.wait_for_timeout(2500)
  s=pg.evaluate("[S.screen,S.jb,AMS.jp[dayKey()].b.length,AMS.jp[dayKey()].b.filter(b=>b.k==='new').map(b=>[b.id,!!b.done,(b.ws||[]).length])]");print(more,s)
  pg.evaluate("go({screen:'am'})");pg.wait_for_timeout(500);pg.click('#fpOpen');pg.wait_for_timeout(400);free=pg.locator('[data-sgo=amw]').count()
  pg.evaluate("go({screen:'amw'})");pg.wait_for_timeout(500);wf=pg.locator('#wFree').count()
  print('free words:',free,wf,e)
  assert r['after']==[True]*3 and r['d1']==r['d0']+1 and more==1 and s[0]=='amnw' and len(s[3])==2 and s[3][0][1] and s[3][1][2]>0 and free==0 and wf==0 and not e
  print('OK')
