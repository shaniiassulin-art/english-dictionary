import asyncio,sys,json
sys.path.insert(0,''+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/')
from drv import *
from playwright.async_api import async_playwright
port,tag=sys.argv[1],sys.argv[2]
OUT=''+__import__('os').environ.get('DUMPS','/tmp/dumps/')+''
async def main():
  errs=[];log=[]
  async with async_playwright() as p:
    b,pg=await new_page(p,errs)
    await pg.goto(f'http://localhost:{port}/index.html');await pg.evaluate("localStorage.clear();sessionStorage.clear()");await pg.reload();await pg.wait_for_timeout(700)
    await pg.evaluate("try{DW.slice(0,700).forEach((w,i)=>KNOW[w.id]=[i%3?'y':'n',Date.now()-864e5]);saveKnow()}catch(e){}")
    await pg.evaluate("go({screen:'am'})");await pg.wait_for_timeout(1200)
    # words: through the journey if there is one, else the workshop
    if await pg.evaluate("typeof jrPlan==='function'"):
      for _ in range(3):
        if not await tap(pg,'#jrGo'):break
        await tap(pg,'#jbGo');await pg.wait_for_timeout(300)
        s=await pg.evaluate("S.screen")
        if s=='amwl':log.append(f'ws {await ws_drive(pg,log=log)}')
        elif s=='amq':log.append(f'q {await q_drive(pg,60,log=log)}');break
    else:
      await pg.evaluate("try{wStart('new')}catch(e){}");await pg.wait_for_timeout(300)
      if await pg.evaluate("S.screen")=='amwl':log.append(f'ws {await ws_drive(pg,log=log)}')
    # some questions of each type
    for t in ['sc','rs','rc']:
      await pg.evaluate(f"(()=>{{const s=AMD.s.find(s=>s.t==='{t}'&&s.u===2&&!s.b);try{{amStart(s.ids,'x','learn','am','{t}')}}catch(e){{amStart(s.ids,'x','learn')}}}})()");await pg.wait_for_timeout(300)
      log.append(f'{t} {await q_drive(pg,40,log=log)}')
      await pg.evaluate("go({screen:'am'})");await pg.wait_for_timeout(200)
    # words added from questions, a review round
    await pg.evaluate("try{Object.values(AMS.w).forEach(w=>{if(w.st>=1)w.due=0});amSave()}catch(e){}")
    await pg.evaluate("try{wStart('rev')}catch(e){}");await pg.wait_for_timeout(300)
    if await pg.evaluate("S.screen")=='amwl':log.append(f'rev {await ws_drive(pg,log=log)}')
    # leave a session open in the middle (questions + words)
    await pg.evaluate("(()=>{const s=AMD.s.find(s=>s.t==='sc'&&s.u===3&&!s.b);try{amStart(s.ids,'x','learn','am','sc')}catch(e){amStart(s.ids,'x','learn')}})()");await pg.wait_for_timeout(300)
    await q_drive(pg,3)
    await pg.evaluate("try{wStart('new')}catch(e){}");await pg.wait_for_timeout(300);await ws_drive(pg,3)
    await pg.wait_for_timeout(16000)  # one tick of the study timer
    d=await pg.evaluate("JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))")
    open(OUT+tag+'.json','w').write(d)
    print(tag,'|',' '.join(log),'| keys',len(json.loads(d)),'| w',await pg.evaluate("Object.keys(AMS.w).length"),'| errors',errs[:3])
    await b.close()
asyncio.run(main())
