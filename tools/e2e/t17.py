import asyncio,json
from playwright.async_api import async_playwright
OUT='/tmp/claude-0/-home-claude/57ff57e9-f98a-5dad-a91a-88f510546bae/scratchpad/am/'
GEM={"ideas":[{"sound":"צליל","scene":"תמונה מצחיקה","link":"קשר"}],"method_tip":"טיפ","analysis":"ניתוח","steps":["צעד 1","צעד 2"],"ok":True,"fixes":[],"corrected":"","word_present":True,"word_used_correctly":True,"mistakes":[],"translation":"תרגום","summary":"סיכום","lesson":"לקח"}
async def gem(route):
  await route.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(GEM,ensure_ascii=False)}]}}]}))
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True);pg=await ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append((await_s(pg),str(e))))
    await pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());await pg.route('**/fonts.g*/**',lambda r:r.abort());await pg.route('**/generativelanguage.googleapis.com/**',gem)
    await pg.route('**/translate.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body='[[["שלום","hello"]]]'))
    await pg.goto('http://localhost:8765/index.html');await pg.evaluate("localStorage.clear();sessionStorage.clear()");await pg.reload();await pg.wait_for_timeout(600)
    E=lambda js:pg.evaluate(js)
    async def go(js,t=300):await E(js);await pg.wait_for_timeout(t)
    log=[]
    # ---------- dictionary ----------
    await go("go({screen:'home'})");await go("go({screen:'level',l:1})");await go("go({screen:'group',l:1,g:0})")
    await pg.click('[data-start]');await pg.wait_for_timeout(400);log.append('quiz:'+await E("S.screen"))
    async def tap(sel):
      l=pg.locator(sel)
      if await l.count() and await l.first.is_enabled():await l.first.click();await pg.wait_for_timeout(200);return True
      return False
    for i in range(6):
      if await pg.locator('#inp0').count():await pg.fill('#inp0','x')
      await tap('#show');await tap('.opt');await tap('#check')
      if not await tap('#markY' if i%2 else '#markN'):await tap('#qnext') or await tap('#nxt')
    log.append('marked:'+str(await E("Object.keys(KNOW).length")))
    await pg.click('#exit');await pg.wait_for_timeout(300)
    await go("go({screen:'words',filter:'all',wl:'group'})");await go("go({screen:'days'})")
    await go("go({screen:'group',l:1,g:0})");btn=pg.locator('#fc');
    if await btn.count():await btn.click();await pg.wait_for_timeout(300);log.append('cards:'+await E("S.screen"))
    await go("go({screen:'level',l:PL})");await go("go({screen:'sent'})",500);await go("go({screen:'tr'})");await pg.fill('#trQ','hello');await pg.wait_for_timeout(1200)
    await go("go({screen:'group',l:3,g:1})");await pg.click('#favBtn');await go("go({screen:'home'})");log.append('fav:'+str(await pg.locator('#favGo').count()))
    await pg.fill('#srch','house');await pg.wait_for_timeout(500);log.append('search:'+str(await pg.locator('#srchRes li').count()))
    # ---------- amiram: journey ----------
    await go("DW.slice(0,300).forEach((w,i)=>KNOW[w.id]=[i%4?'y':'n',Date.now()]);saveKnow();go({screen:'start'})")
    await pg.click('#stAm');await pg.wait_for_timeout(900)
    log.append('plan:'+await E("JSON.stringify(jrPlan().b.map(x=>x.k+(x.skip?'(skip)':x.done?'(done)':'')))"))
    await pg.click('#jrGo');await pg.wait_for_timeout(300);log.append('block:'+await E("S.jb"));await (pg.click('#jbGo') if await pg.locator('#jbGo').count() else pg.wait_for_timeout(10));await pg.wait_for_timeout(500)
    log.append('new page:'+await E("S.screen"));await pg.click('#nwGo');await pg.wait_for_timeout(300)
    # workshop driver
    async def ws_drive(limit=200,wrong_every=4):
      n=0
      while n<limit and await E("S.screen") in ('amwl','quiz') and await E("S.screen!=='quiz'||/^JW/.test(Q.key)"):
        n+=1
        if await pg.evaluate("S.screen")=='quiz':
          if await pg.locator('#inp0').count():await pg.fill('#inp0','x')
          for _s in ['#show','.opt','#check']:
            _l=pg.locator(_s)
            if await _l.count() and await _l.first.is_enabled():await _l.first.click();await pg.wait_for_timeout(100)
          _l=pg.locator('#markY')
          if await _l.count():await _l.click();await pg.wait_for_timeout(250)
          continue
        if await pg.locator('#dqGo').count():await pg.click('#dqGo');await pg.wait_for_timeout(400);continue
        if await pg.locator('#trY').count():await pg.click('#trY');await pg.wait_for_timeout(200);continue
        if await pg.locator('#trIn').count():await pg.fill('#trIn','תרגום');await pg.click('#trChk');await pg.wait_for_timeout(500);continue
        if await pg.locator('#trSkip').count():await pg.click('#trSkip');await pg.wait_for_timeout(200);continue
        if not await pg.locator('#wOn,#wNext,#wAns,[data-wmc],#wCopy,#wSelfY,#wBack,#wSaveS').count():await pg.wait_for_timeout(400)
        if await pg.locator('#wBack').count():await pg.click('#wBack');await pg.wait_for_timeout(300);break
        if await pg.locator('#wNext').count():
          if await pg.locator('[data-as]').count():await pg.locator('[data-as]').first.click()
          else:pass
          await pg.wait_for_timeout(120);await pg.click('#wNext');await pg.wait_for_timeout(200);continue
        if await pg.locator('#wOn').count():await pg.click('#wOn');await pg.wait_for_timeout(200);continue
        if await pg.locator('#wSelfY').count():await pg.click('#wSelfY');await pg.wait_for_timeout(200);continue
        if await pg.locator('#wCopy').count():
          e=await E("AMS.w[WS.list[WS.i]].e");await pg.fill('#wCopy',e);await pg.wait_for_timeout(200);continue
        if await pg.locator('#wAns').count():
          a=await E("(()=>{const w=AMS.w[WS.list[WS.i]];return wTaskNow(w)==='en2he'?w.h:w.e})()")
          if n%wrong_every==0:a='zzz'
          await pg.fill('#wAns',a);await pg.click('#wGo');await pg.wait_for_timeout(200);continue
        if await pg.locator('[data-wmc]').count():
          e=await E("AMS.w[WS.list[WS.i]].e")
          loc=pg.locator(f'[data-wmc="{e}"]')
          if n%wrong_every==0 or not await loc.count():loc=pg.locator('[data-wmc]').first
          await loc.click();await pg.wait_for_timeout(200);continue
        if await pg.locator('#wSaveS').count():await pg.fill('#wMy','I like it.');await pg.click('#wSaveS');await pg.wait_for_timeout(200);continue
        await pg.screenshot(path=OUT+'stuck.png',full_page=True);log.append('STUCK amwl');break
      return n
    n=await ws_drive();log.append(f'new words steps {n}, now {await E("S.screen")}; block new: '+await E("JSON.stringify(jrPlan().b[1])"))
    # questions block
    await pg.click('#jrGo');await pg.wait_for_timeout(300);await (pg.click('#jbGo') if await pg.locator('#jbGo').count() else pg.wait_for_timeout(10));await pg.wait_for_timeout(500);log.append('q start:'+await E("S.screen+' '+AQ.jr"))
    async def q_drive(limit=400):
      n=0;ans=0
      while n<limit and await E("S.screen")=='amq':
        n+=1
        if await pg.locator('#amMGo').count():await pg.click('#amMGo');await pg.wait_for_timeout(200);continue
        if await pg.locator('#amAgain').count():
          if await pg.locator('#amJrNext').count():await pg.click('#amJrNext');await pg.wait_for_timeout(400);continue
          await pg.click('#amAgain');await pg.wait_for_timeout(300);break
        if await pg.locator('#amNext').count():
          if await pg.locator('#amMethGo').count() and n%5==0:await pg.click('#amMethGo');await pg.wait_for_timeout(300)
          if await pg.locator('[data-why]').count() and n%3==0:await pg.locator('[data-why]').first.click()
          if await pg.locator('#amAddAll').count() and n%7==0:await pg.click('#amAddAll')
          await pg.click('#amNext');await pg.wait_for_timeout(200);continue
        if await pg.locator('.am-opt[data-k]').count():
          a=await E("AMD.q[AQ.cur].a");k=a if ans%3 else (a%4)+1;ans+=1
          await pg.click(f'.am-opt[data-k="{k}"] .ax-rad');await pg.click('#amChk');await pg.wait_for_timeout(250);continue
        await pg.screenshot(path=OUT+'stuckq.png',full_page=True);log.append('STUCK amq');break
      return n,ans
    r=await q_drive();log.append(f'q steps {r}; screen {await E("S.screen")}; plan '+await E("JSON.stringify(jrPlan().b.map(x=>x.k+':'+x.d+'/'+x.n+(x.done?'✓':'')))"))
    # make words due -> rev2
    await go("Object.values(AMS.w).forEach(w=>{if(w.st>=1)w.due=0});amSave();go({screen:'am'})",500)
    log.append('cur after due:'+await E("(jrCur(AMS.jp[jrCurKey()])||{}).k"))
    await pg.click('#jrGo');await pg.wait_for_timeout(300);await (pg.click('#jbGo') if await pg.locator('#jbGo').count() else pg.wait_for_timeout(10));await pg.wait_for_timeout(500)
    if await E("S.screen")=='amwl':n=await ws_drive();log.append(f'rev steps {n}')
    log.append('plan2:'+await E("JSON.stringify(jrPlan().b.map(x=>x.k+(x.skip?'(skip)':x.done?'✓':'')))")+' screen '+await E("S.screen"))
    # finish remaining blocks (meth)
    for _ in range(4):
      if not await pg.locator('#jrGo').count():break
      await pg.click('#jrGo');await pg.wait_for_timeout(300)
      if await pg.locator('#jbGo').count():await (pg.click('#jbGo') if await pg.locator('#jbGo').count() else pg.wait_for_timeout(10));await pg.wait_for_timeout(500)
      if await E("S.screen")=='amnw':await tap('#nwGo') or await tap('#nwDone');await pg.wait_for_timeout(300)
      if await E("S.screen")=='amq':await q_drive(60)
      if await E("S.screen")=='amwl':await ws_drive()
    log.append('hub after plan: extra='+str(await E("jrPlan().b.some(x=>x.x)"))+' next='+str(await pg.locator('#jrNext').count()))
    await go("Object.values(AMS.w).forEach(w=>{if(w.st>=1)w.due=Date.now()+2*DAY});AMS.tm[dayKey()]=200*6e4;AMS.jp[dayKey()].b.forEach(x=>x.done=x.done||Date.now());go({screen:'am'})",400)
    log.append('tomorrow btn='+str(await pg.locator('#jrNext').count()))
    await pg.click('#jrNext');await pg.wait_for_timeout(400);log.append('ahead cur:'+await E("jrCurKey()"))
    # simulation
    await go("amStart(amExamIds(1,true),'sim','exam','am','ex',1,true)",400)
    for i in range(22):
      if await pg.locator('.am-opt[data-k]').count():await pg.locator('.am-opt[data-k] .ax-rad').first.click();await pg.click('#amChk');await pg.wait_for_timeout(120)
    log.append('sim:'+await E("S.screen+' '+JSON.stringify(AMS.ex)"))
    await pg.screenshot(path=OUT+'simres.png',full_page=True)
    # every screen
    for sc in ['start','home','am','amqh','amw','amm','amp','amwm','amls']:
      await go(f"go({{screen:'{sc}'}})",250)
    for t in ['sc','rs','rc','ex']:await go(f"go({{screen:'amu',amt:'{t}'}})",250)
    await go("go({screen:'ammt',amtk:Object.keys(AMM)[2]})",250)
    wk=await E("Object.keys(AMS.w)[0]");await go(f"go({{screen:'amwd',wk:{json.dumps(wk)}}})",300);await pg.screenshot(path=OUT+'wd.png',full_page=True)
    await go("go({screen:'amp'})");await pg.screenshot(path=OUT+'amp.png',full_page=True)
    # swipe back from a question unit list
    await go("go({screen:'amu',amt:'sc'})")
    await E("""(()=>{const mk=(type,x)=>{const t=new Touch({identifier:1,target:document.body,clientX:x,clientY:300});document.body.dispatchEvent(new TouchEvent(type,{touches:type==='touchend'?[]:[t],changedTouches:[t],bubbles:true}))};mk('touchstart',320);mk('touchmove',220);mk('touchend',200)})()""");await pg.wait_for_timeout(300)
    log.append('swipe →'+await E("S.screen"))
    # explanations: count folded boxes on hub, none open
    await go("go({screen:'am'})");log.append('expl on hub: '+str(await pg.locator('details.am-exb').count())+' open '+str(await pg.locator('details.am-exb[open]').count()))
    await go("go({screen:'amjb',jb:jrPlan().b[2].id})");log.append('daily help on step page: '+str(await E("[...document.querySelectorAll('.am-pghelp summary')].map(s=>s.textContent).join('|')")))
    print('\n'.join(log));print('ERRORS',errs[:10]);await b.close()
def await_s(pg):return ''
asyncio.run(main())
