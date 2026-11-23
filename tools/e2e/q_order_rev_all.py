# 1) a review session holds every word due today (was capped at 30 – the rest appeared after she finished)
# 2) the three question steps come in a different order every day (her request); an untouched plan is reordered, a started one is kept
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  n=pg.evaluate("""(()=>{AMS.w={};DW.slice(0,45).forEach((c,i)=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:2+(i%3),lr:5,due:Date.now()-1000-i,log:[],t:Date.now()}});
    go({screen:'amw'});wStart('rev');return [WS.list.length,wDue().length]})()""")
  print('review session',n);assert n==[45,45]
  ords=pg.evaluate("""(()=>{const out=[];let k=dayKey();for(let i=0;i<6;i++){out.push(jrQB(k,false,()=>0).filter(x=>!isNT(x.qt)).map(x=>x.qt).join(','));k=kAdd(k,1)}return out})()""")
  print('orders',ords);assert len(set(ords))==6 and all(ords[i].split(',')[0]!=ords[i+1].split(',')[0] for i in range(5))
  r=pg.evaluate("""(()=>{const k=dayKey();AMS.jp={};AMS.js=k;const P=jrPlan(k);const q=()=>P.b.filter(x=>x.k==='q'&&!isNT(x.qt)).map(x=>x.qt).join(',');
    const want=jrQOrd(k).join(',');const qq=P.b.filter(x=>x.k==='q'&&!isNT(x.qt));const pos=qq.map(x=>P.b.indexOf(x));const rev=[...qq].reverse();pos.forEach((p,i)=>P.b[p]=rev[i]);const scr=q();
    jrNorm(k,P);const fixed=q();const f=P.b.filter(x=>x.k==='q'&&!isNT(x.qt));const pos2=f.map(x=>P.b.indexOf(x));[...f].reverse().forEach((x,i)=>P.b[pos2[i]]=x);P.b.filter(x=>x.k==='q'&&!isNT(x.qt))[0].d=1;const kept=q();jrNorm(k,P);
    return [want,scr,fixed,kept,q()]})()""")
  print('reorder',r);c=r[0].split(',')[0];assert r[2]==r[0] and r[4].split(',')==[c]+[t for t in r[3].split(',') if t!=c]  # core type first (30-minute day), the bonus keep their order
  assert not e,e;print('OK')
