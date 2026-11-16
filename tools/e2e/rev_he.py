# review 1 = Hebrew sentence (card example → exam sentence with book translation → Gemini → English fallback), and the history page shows the answered page
from playwright.sync_api import sync_playwright
import re
T=lambda pg:re.sub(r'\s+',' ',pg.locator('#app').inner_text())
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  info=pg.evaluate("""(()=>{const out={};let a=null,b=null;for(const c of DW){const w={k:'c:'+c.id,e:c.e,h:c.h[0],st:1};if(!a&&wHeSent(w))a=c;else if(!b&&!wHeSent(w)&&wHePool(w))b=c;if(a&&b)break}
    AMS.w={};[a,b].forEach((c,i)=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:1,due:Date.now()-1000-i,log:[],t:Date.now()}});go({screen:'amw'});wStart('rev');return [a.e,a.h[0],b.e,b.h[0]]})()""")
  print('words',info);pg.wait_for_timeout(1500)
  for n in range(2):
    t=T(pg);print('Q%d:'%n,'hebrew' if pg.locator('[data-task=hecl]').count() else 'NOT hebrew',t[t.find('איזו'):][:120])
    pg.locator('[data-wmc]').first.click();pg.wait_for_timeout(400)
    if n==0:pg.screenshot(path='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/rh_ans.png')
    pg.click('#wOn');pg.wait_for_timeout(900)
  pg.evaluate("go({screen:'amw'})");pg.wait_for_timeout(300)
  # a fresh round with history: start again from words due
  print('hist entries',pg.evaluate("(WS&&WS.hist||[]).length"), 'snaps',pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('dictWsHistH')||'{}')).length"))
  pg.evaluate("WS.view=0;go({screen:'amwl'})");pg.wait_for_timeout(500)
  print('HIST:',T(pg)[:300]);print('snap',pg.locator('.am-histsnap').count(),'opts',pg.locator('.am-histsnap .am-opt').count(),'hebrew',pg.locator('.am-histsnap [data-task=hecl] .am-fill').count())
  pg.screenshot(path='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/rh_hist.png')
  print(errs);b.close()
