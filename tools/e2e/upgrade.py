import asyncio,sys,json,glob,os
sys.path.insert(0,''+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/')
from drv import *
from playwright.async_api import async_playwright
DUMPS=''+__import__('os').environ.get('DUMPS','/tmp/dumps/')+''
tags=sys.argv[1:]
async def check(pg,label,bad):
  t=await pg.evaluate("document.body.innerText.includes('משהו השתבש')")
  if t:bad.append(label+': '+(await pg.evaluate("localStorage.getItem('dictLastErr')"))[:300])
async def run(p,tag):
  errs=[];bad=[];log=[]
  b,pg=await new_page(p,errs)
  await pg.goto('http://localhost:8765/index.html');await pg.wait_for_timeout(300)
  d=json.load(open(DUMPS+tag+'.json'))
  await pg.evaluate("d=>{localStorage.clear();sessionStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}",d)
  await pg.reload();await pg.wait_for_timeout(1200)
  # sync merge of the old data with itself + an empty remote
  await pg.evaluate("try{const s=JSON.parse(snapshot());applyRemote(mergeData(s,{}),Date.now())}catch(e){window.__mergeErr=String(e)}")
  me=await pg.evaluate("window.__mergeErr||''")
  if me:bad.append('merge: '+me)
  screens=['start','home','am','amqh','amw','amm','amp','amwm','amls']
  for sc in screens:
    await pg.evaluate(f"go({{screen:'{sc}'}})");await pg.wait_for_timeout(150);await check(pg,sc,bad)
  for t in ['sc','rs','rc','ex']:
    await pg.evaluate(f"go({{screen:'amu',amt:'{t}'}})");await pg.wait_for_timeout(120);await check(pg,'amu '+t,bad)
  for k in await pg.evaluate("Object.keys(AMM)"):
    await pg.evaluate(f"go({{screen:'ammt',amtk:'{k}'}})");await pg.wait_for_timeout(60);await check(pg,'ammt '+k,bad)
  keys=await pg.evaluate("Object.keys(AMS.w)")
  for k in keys:
    await pg.evaluate(f"go({{screen:'amwd',wk:{json.dumps(k)}}})");await pg.wait_for_timeout(40);await check(pg,'amwd '+k,bad)
  for f in ['due','learn','hard','done','wait']:
    await pg.evaluate(f"go({{screen:'amwm',wf:'{f}'}})");await pg.wait_for_timeout(60);await check(pg,'amwm '+f,bad)
  # an open session left by the old version
  await pg.evaluate("go({screen:'amq'})");await pg.wait_for_timeout(300);await check(pg,'resume amq',bad)
  if await pg.evaluate("S.screen")=='amq':log.append(f'resumeq {await q_drive(pg,30,log=log)}')
  await pg.evaluate("go({screen:'amwl'})");await pg.wait_for_timeout(300);await check(pg,'resume amwl',bad)
  if await pg.evaluate("S.screen")=='amwl':log.append(f'resumews {await ws_drive(pg,60,log=log)}')
  # the journey, step after step
  await pg.evaluate("go({screen:'am'})");await pg.wait_for_timeout(400)
  steps=[]
  for i in range(6):
    await check(pg,'hub',bad)
    if not await pg.locator('#jrGo').count():steps.append('no ▶');break
    cur=await pg.evaluate("(()=>{const k=jrCurKey(),x=k&&jrCur(AMS.jp[k]);return x?x.k+':'+x.d+'/'+x.n:'-'})()")
    await tap(pg,'#jrGo');await pg.wait_for_timeout(300)
    if await pg.evaluate("S.screen")=='amjb':
      await check(pg,'amjb',bad);await tap(pg,'#jbGo');await pg.wait_for_timeout(400)
    s=await pg.evaluate("S.screen");await check(pg,'after start '+cur,bad)
    if s=='amwl':r=await ws_drive(pg,log=log)
    elif s=='amq':r=await q_drive(pg,80,log=log)
    else:r=s
    steps.append(f'{cur}->{s}({r})')
    if await pg.evaluate("S.screen")!='am':await pg.evaluate("go({screen:'am'})");await pg.wait_for_timeout(300)
    if s=='amjb':bad.append('start did nothing on '+cur);break
  await pg.evaluate("go({screen:'amp'})");await pg.wait_for_timeout(200);await check(pg,'amp end',bad)
  print(f'== {tag}: words {len(keys)} | journey: '+' '.join(steps))
  if log:print('   log:',' ; '.join(log)[:600])
  print('   BAD:',bad[:6],'\n   ERRORS:',errs[:4])
  await b.close()
async def main():
  async with async_playwright() as p:
    for t in tags:await run(p,t)
asyncio.run(main())
