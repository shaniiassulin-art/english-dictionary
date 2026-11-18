# the day's questions: unanswered only, mixed types / units, easy → hard, level shown, arrows left-to-right
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':844})
  ctx.route('**/firestore.googleapis.com/**',lambda r:r.abort());ctx.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1500)
  pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const M=amLvMap(),c={};Object.values(M).forEach(x=>c[x.lv]=(c[x.lv]||0)+1);
    const ids=amDayIds(20);const t={},u=new Set();ids.forEach(id=>{const q=AMD.q[id];t[q.t]=(t[q.t]||0)+1;u.add(amSrcOf(id).split(' · ')[0])});
    return {lv:c,n:ids.length,types:t,units:u.size,lvs:ids.map(amLv),sc:ids.map(id=>M[id].sc)}})()""")
  print(r)
  assert r['n']==20 and len(r['types'])==3 and r['units']>=6
  # answer some, they never come back
  pg.evaluate("go({screen:'am'});const k=jrCurKey(),P=AMS.jp[k];const x=P.b.find(x=>x.k==='q');for(const y of P.b){if(y===x)break;y.done=1;y.skip=1}amSave();jrRun(x)");pg.wait_for_timeout(1500)
  print(pg.evaluate("S.screen"),pg.locator('.am-qlv').inner_text())
  first=pg.evaluate("AQ.ids.slice()")
  for i in range(3):
    pg.locator('.ax-rad').first.click();pg.wait_for_timeout(300)
    if pg.locator('#amChk').count():pg.click('#amChk');pg.wait_for_timeout(300)
    pg.evaluate("AQ.i++;amSaveQ();draw()");pg.wait_for_timeout(300)
  ans=pg.evaluate("AQ.ids.filter(id=>amLast(id))");print('answered',ans)
  pg.evaluate("AQ=null;LS.set('dictAmQ','null');const k=jrCurKey(),x=AMS.jp[k].b.find(x=>x.k==='q');x.qs=null;amSave();JRGO=null");
  again=pg.evaluate("amDayIds(20)");assert not set(ans)&set(again),'answered came back'
  pg.screenshot(path='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/dayq.png')
  print('errors',errs);assert not errs;print('OK')
