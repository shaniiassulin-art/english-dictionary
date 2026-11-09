from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  print(pg.evaluate("""(()=>{const c=DW.find(c=>c.s&&c.s.split(' ').length>5);const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:5,due:Date.now()-1000,log:[],t:Date.now()-5000,trc:{en:c.s,he:'x'}};wStart('rev');
    const w=AMS.w[k];WS.res={typed:'משהו',en:c.s,he:'x',pend:1};
    amApply(JSON.parse(JSON.stringify(AMS)));   /* a sync replaces AMS while Gemini is checking */
    wTrDone(w,true);return [AMS.w[k].st,Math.round((AMS.w[k].due-Date.now())/864e5),!!AMS.w[k].trc]})()"""))
  pg.wait_for_timeout(300);pg.evaluate("draw()");pg.wait_for_timeout(500)
  print(errs);b.close()
