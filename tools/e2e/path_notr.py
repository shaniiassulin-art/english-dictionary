# the translation reviews (4, 6) are off: 4 reviews; stored words of the full path are mapped once (w.pv) and the mapping can be reversed
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  for h in ['firestore.googleapis.com','generativelanguage.googleapis.com']:pg.route('**/'+h+'/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(1500)
  r=pg.evaluate("""(()=>{const out={WNR,WMAST,WPATH:WPATH.slice(1),tr:WPATH.includes('tr')};const cs=DW.slice(0,8);cs.forEach((c,i)=>{wAdd(c.e,c.h[0],'','dict:'+c.id,'c:'+c.id);const w=AMS.w['c:'+c.id];w.st=i;w.lr=5;w.due=Date.now()-1000;delete w.pv;w.t0=w.t});
    amFixW();out.st=cs.map(c=>AMS.w['c:'+c.id].st);out.pv=cs.map(c=>AMS.w['c:'+c.id].pv);out.t=cs.every(c=>AMS.w['c:'+c.id].t===AMS.w['c:'+c.id].t0);
    amFixW();out.st2=cs.map(c=>AMS.w['c:'+c.id].st);out.tasks=wDue(0).map(w=>wTask(w));amSave();return out})()""")
  print(r)
  assert r['WNR']==4 and r['WMAST']==5 and not r['tr'] and r['WPATH']==['hecl','mc','en2he','mc']
  assert r['st']==[0,1,2,3,4,4,5,5] and r['st2']==r['st'] and all(v==2 for v in r['pv']) and r['t']
  assert 'tr' not in r['tasks']
  pg.evaluate("go({screen:'ampath'})");pg.wait_for_timeout(800);t=pg.locator('#app').inner_text();assert 'חזרה 5' not in t and 'חזרה 4' in t,t[:400]
  assert not errs,errs;print('OK');b.close()
