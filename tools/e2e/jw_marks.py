# round-2 quiz marks don't touch the dictionary; finishing round 4 marks the card ✓
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const c=DW.find(c=>c.e==='important');setKnow(c.id,null);const k='c:'+c.id;AMS.w={};AMS.w[k]={k,e:c.e,h:c.h[0],st:1,lr:2,due:Date.now(),log:[[Date.now()-1000,'tr',1,0]],t:Date.now(),src:'dict:'+c.id};
    WS={perWord:1,round:2,list:[k],all:[k],i:0,phase:'dq',mode:'r2',step:'recall',t2:Date.now()};wSave();
    startQuiz([c],'t','amwl',wDqKey());qMark('y');const a=kst(c)||'';
    const w=AMS.w[k];w.lr=4;WS={perWord:1,round:4,list:[k],all:[k],i:0,phase:'mc',mode:'r2',step:'recall'};WS.res={};wAfter(w,true);
    return [a,kst(c),AMS.w[k].lr]})()""")
  print(r);assert r==['', 'y', 5],r;assert not errs,errs;print('OK');b.close()
