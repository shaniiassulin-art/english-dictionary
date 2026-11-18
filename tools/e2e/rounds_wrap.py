# rounds 3/4 go on after a round-2 quiz with ✓ marks; a miss stays in its round and comes again at the end of it (Nov 18: no going back to round 1)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("window.aiRun=async()=>({why:'quota'})")
  r=pg.evaluate("""(()=>{AMS.w={};const ks=[];['important','however','significant'].forEach(e=>{const c=DW.find(c=>c.e===e);const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:2,due:Date.now()-1,log:[],t:Date.now(),src:'dict:'+c.id};ks.push(k);setKnow(c.id,'y')});
    const out=[];out.push(wDue().length);
    WS={perWord:1,round:2,list:ks,all:ks,i:0,phase:'dq',mode:'r2',step:'recall'};
    ks.forEach(k=>{AMS.w[k].lr=3});wRoundNext(2);out.push(WS&&WS.round,WS&&WS.list.length);
    const w=AMS.w[ks[0]];WS.res={};wAfter(w,false);out.push(AMS.w[ks[0]].lr,WS.list.length);
    WS.i=1;WS.res={};wAfter(AMS.w[ks[1]],true);WS.i=2;WS.res={};wAfter(AMS.w[ks[2]],true);
    WS.i=WS.list.length;wRoundNext(3);out.push(WS&&WS.round,WS&&WS.list.join());
    return [out,ks[0]]})()""")
  print(r);o=r[0]
  assert o[0]==0,'learning words not in reviews'
  assert o[1]==3 and o[2]==3,'round 3 starts after round 2 with ✓ marks'
  assert o[3]==3 and o[4]==4,'miss stays in round 3 and is appended'
  assert o[5]==3 and o[6]==r[1],'round 3 repeats with the missed word before round 4'
  assert not errs,errs;print('OK');b.close()
