# one-time: words sent back to round 1 by the old rule return to the round they missed in
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  r=pg.evaluate("""(()=>{localStorage.removeItem('dictLrFix2');const t=Date.now();AMS.w={
    a:{k:'a',e:'a',st:1,lr:1,log:[[t,'first',1,0],[t,'r2',1,0],[t,'r2',0,0]]},
    b:{k:'b',e:'b',st:1,lr:1,log:[[t,'first',1,0],[t,'r2',0,0]]},
    c:{k:'c',e:'c',st:1,lr:1,dqm:1,log:[[t,'first',1,0]]},
    d:{k:'d',e:'d',st:1,lr:1,log:[[t,'first',0,0]]}};wLrBack();return ['a','b','c','d'].map(k=>AMS.w[k].lr)})()""")
  print(r);assert r==[4,3,2,1];assert not errs,errs;print('OK');b.close()
