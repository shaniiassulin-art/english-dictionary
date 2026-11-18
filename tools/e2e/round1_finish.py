# a miss in round 1 comes again at the end of round 1 (total grows at once); round 2 starts only when round 1 is all right
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{AMS.w={};const ks=[];['important','however'].forEach(e=>{const c=DW.find(c=>c.e===e);const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:1,log:[],t:Date.now(),src:'dict:'+c.id};ks.push(k)});
    const o=[];WS={perWord:1,round:1,list:ks.slice(),all:ks,i:0,mode:'new',step:'tr',res:{}};
    wTrDone(AMS.w[ks[0]],false);o.push(WS.list.length,AMS.w[ks[0]].lr,wRoundCounts(ks).join());
    WS.res=null;wNextWord();o.push(WS.list[WS.i]);WS.res={};wTrDone(AMS.w[ks[1]],true);
    WS.res=null;wNextWord();o.push(WS.round,WS.list[WS.i]);
    WS.res={};wTrDone(AMS.w[ks[0]],true);WS.res=null;wNextWord();o.push(WS.round,WS.phase);return [o,ks]})()""")
  print(r);o,ks=r
  assert o[0]==3 and o[1]==1,'requeued in round 1, total grows'
  assert o[4]==1 and o[5]==ks[0],'round 1 again with the missed word'
  assert o[6]==2,'round 2 only after round 1 is all right'
  assert not errs,errs;print('OK');b.close()
