# the journey: one question step per type, no simulation; old untouched plans are converted
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':844})
  ctx.route('**/firestore.googleapis.com/**',lambda r:r.abort());ctx.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const out={};for(const k of ['2026-11-16','2026-11-17']){const P=jrPlan(k);out[k]=P.b.map(x=>x.k+(x.qt?':'+x.qt+x.n:''))}
    // an old plan with two generic blocks + simulation
    AMS.jp['2026-11-23']={b:[{id:'2026-11-23|rev0',k:'rev',m:20,n:0,d:0},{id:'2026-11-23|q2',k:'q',m:45,n:22,d:0},{id:'2026-11-23|q3',k:'q',m:45,n:22,d:0},{id:'2026-11-23|sim4',k:'sim',m:25,n:22,d:0},{id:'2026-11-23|rev25',k:'rev2',m:10,n:0,d:0}],t:1};
    out.old=jrPlan('2026-11-23').b.map(x=>x.k+(x.qt?':'+x.qt:''));
    // a started old plan (today): 3 sc + 1 rs answered today, a session open
    const T=dayKey(),now=amNow();AMS.a['csc2-1']={h:[[1,1,1,now]]};AMS.a['csc3-1']={h:[[1,0,1,now]]};AMS.a['csc4-1']={h:[[1,1,1,now]]};AMS.a['crs2-1']={h:[[1,1,1,now]]};AMS.a['csc9-1']={h:[[1,1,1,now-3*864e5]]};
    AMS.jp[T]={b:[{id:T+'|rev0',k:'rev',m:20,n:0,d:0,done:1},{id:T+'|q2',k:'q',m:45,n:22,d:4,used:1},{id:T+'|q3',k:'q',m:45,n:22,d:0},{id:T+'|sim4',k:'sim',m:25,n:22,d:0},{id:T+'|rev25',k:'rev2',m:10,n:0,d:0}],t:1};
    AQ={ids:['csc2-1'],i:0,jr:T+'|q2',st:{}};
    out.started=jrPlan(T).b.map(x=>x.k+(x.qt?':'+x.qt+':'+x.d:''));out.aq=AQ;
    const ids={};for(const t of ['sc','rs','rc'])ids[t]=[...new Set(amDayIds(t==='rc'?25:10,t).map(id=>AMD.q[id].t))];return out})()""")
  print(r)
  assert r['2026-11-16']==['rev','new','q:sc15','q:rs10','q:rc25','meth','rev2'],r
  assert r['2026-11-17']==['rev','new','q:sc6','q:rs4','q:rc10','meth','rev2']
  assert r['old']==['rev','q:sc','q:rs','q:rc','rev2']
  assert r['started'][1:4]==['q:sc:3','q:rs:1','q:rc:0'] and r['aq'] is None,r
  pg.evaluate("go({screen:'am'});const k=jrCurKey(),P=AMS.jp[k];for(const y of P.b){if(y.k==='q'&&y.qt==='rs')break;y.done=1;y.skip=1}amSave();draw()");pg.wait_for_timeout(800)
  pg.screenshot(path='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/qtypes.png')
  pg.evaluate("const k=jrCurKey(),x=AMS.jp[k].b.find(x=>x.qt==='rs');jrRun(x)");pg.wait_for_timeout(1200)
  t=pg.evaluate("[S.screen,AQ.name,[...new Set(AQ.ids.map(id=>AMD.q[id].t))]]");print(t);assert t[2]==['rs']
  print('errors',errs);assert not errs;print('OK')
