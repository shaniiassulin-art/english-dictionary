# shared drivers, tolerant to every version of the app
import json
async def tap(pg,sel):
  l=pg.locator(sel)
  try:
    if await l.count() and await l.first.is_visible() and await l.first.is_enabled():
      await l.first.click(timeout=3000);await pg.wait_for_timeout(150);return True
  except Exception:pass
  return False
async def ws_drive(pg,limit=160,wrong=4,log=None):
  n=0
  while n<limit and await pg.evaluate("S.screen")=='amwl':
    n+=1
    if await tap(pg,'#wBack'):break
    if await pg.locator('#wNext').count():
      if not await tap(pg,'[data-as]'):
        if await pg.locator('#wAs').count():await pg.fill('#wAs','תמונה מצחיקה');await pg.wait_for_timeout(100)
      if await tap(pg,'#wNext'):continue
    if await pg.locator('#wMy').count():
      await pg.fill('#wMy','I like this word.');await pg.wait_for_timeout(80)
      if await tap(pg,'#wSaveS'):continue
    if await tap(pg,'#wOn'):continue
    if await tap(pg,'#wSelfY'):continue
    if await pg.locator('#wCopy').count():
      e=await pg.evaluate("(()=>{const w=AMS.w[WS.list[WS.i]];return w&&w.e})()");await pg.fill('#wCopy',e or 'x');await pg.wait_for_timeout(150);continue
    if await pg.locator('#wAns').count():
      a=await pg.evaluate("(()=>{const w=AMS.w[WS.list[WS.i]];let t='';try{t=(typeof wTaskNow==='function'?wTaskNow(w):wTask(w))}catch(e){}return t==='en2he'?w.h:w.e})()")
      if n%wrong==0:a='zzz'
      await pg.fill('#wAns',a or 'x');await tap(pg,'#wGo');continue
    if await pg.locator('[data-wmc]').count():
      e=await pg.evaluate("(()=>{const w=AMS.w[WS.list[WS.i]];return w&&w.e})()")
      if n%wrong==0 or not await tap(pg,f'[data-wmc="{e}"]'):await tap(pg,'[data-wmc]')
      continue
    if await tap(pg,'#wGo'):continue
    if log is not None:log.append('ws stuck: '+(await pg.evaluate("document.querySelector('.screen')&&document.querySelector('.screen').innerText.slice(0,200)")))
    break
  return n
async def q_drive(pg,limit=300,log=None):
  n=0;k=0
  while n<limit and await pg.evaluate("S.screen")=='amq':
    n+=1
    if await pg.locator('#amAgain').count():
      if await tap(pg,'#amJrNext'):continue
      await tap(pg,'#amAgain');break
    if await tap(pg,'#amShow'):continue
    if await pg.locator('#amNext').count():
      if n%4==0:await tap(pg,'[data-why]')
      if n%6==0:await tap(pg,'#amAddAll') or await tap(pg,'[data-dbadd]') or await tap(pg,'[data-add]')
      if n%5==0 and await pg.locator('#amLesson').count():await pg.fill('#amLesson','לקח');await tap(pg,'#amLsSave')
      await tap(pg,'#amNext');continue
    if await pg.locator('.am-opt[data-k]').count():
      a=await pg.evaluate("AMD.q[AQ.cur||AQ.ids[AQ.i]].a");k+=1
      kk=a if (isinstance(a,int) and k%3) else 1
      await tap(pg,f'.am-opt[data-k="{kk}"]');await tap(pg,'#amChk');continue
    if await pg.locator('#amTyped').count():await pg.fill('#amTyped','x');await tap(pg,'#amChk');continue
    if log is not None:log.append('q stuck: '+(await pg.evaluate("document.querySelector('.screen')&&document.querySelector('.screen').innerText.slice(0,200)")))
    break
  return n
async def new_page(p,errs):
  b=await p.chromium.launch();ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True);pg=await ctx.new_page()
  pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
  await pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());await pg.route('**/fonts.g*/**',lambda r:r.abort())
  GEM={"ideas":[{"sound":"צליל","scene":"תמונה","link":"קשר"}],"method_tip":"טיפ","analysis":"ניתוח","steps":["1","2"],"ok":True,"fixes":[],"corrected":""}
  async def gem(route):await route.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(GEM,ensure_ascii=False)}]}}]}))
  await pg.route('**/generativelanguage.googleapis.com/**',gem)
  await pg.route('**/audio/**',lambda r:r.abort());await pg.route('**/cdn.jsdelivr.net/**',lambda r:r.abort());await pg.route('**/raw.githubusercontent.com/**',lambda r:r.abort())
  return b,pg
