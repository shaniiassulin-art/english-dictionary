# a review word missed again in the redo comes back again (same day, other sentence) until it is answered right; similar sentences are rejected
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const c=DW.find(c=>c.id==='study#1');const k='c:'+c.id;AMS.w={};AMS.w[k]={k,e:c.e,h:c.h[0],st:2,lr:5,due:Date.now()-1,log:[],t:Date.now()};
    const w=AMS.w[k],o=[];
    o.push(sSim('My father reads in his study.','My father is working quietly in his study right now.',w));
    o.push(sSim('My father reads in his study.','She left her keys on the desk in the study.',w));
    wStart('rev');WS.res={ok:false,task:'mc'};wAfter(w,false);o.push(WS.again.join());
    WS.i=WS.list.length-1;WS.res=null;wNextWord();o.push(WS.re.join(),WS.list.length,WS.i);
    WS.res={ok:false,task:'mc'};wAfter(AMS.w[k],false);o.push((WS.again||[]).join());
    WS.res=null;wNextWord();o.push(WS.list.length,WS.i);
    WS.res={ok:true,task:'mc'};wAfter(AMS.w[k],true);o.push((WS.again||[]).length);
    return o})()""")
  print(r)
  assert r[0] is True and r[1] is False,'similarity'
  assert r[2]=='c:study#1' and r[6]=='c:study#1' and r[7]==3 and r[9]==0,'redo until right'
  assert not errs,errs;print('OK');b.close()
