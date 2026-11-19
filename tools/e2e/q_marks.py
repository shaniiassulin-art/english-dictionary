# Nov 18 evening: sound modes, restatement hint-only before answering, marked unknown words explained, wrong answers back after QBACK days, resume
from playwright.sync_api import sync_playwright
import json
U={"words":[{"en":"muscles","how":"רמז: מספרים של חלקי גוף","meaning":"שרירים"}]}
X={"translation":"t","decode":[],"understand":["u"],"options":[{"en":"facial","he":"של הפנים","ok":True,"why":"w","words":[{"en":"facial","hint":"face + al"}]}],"answer":"a","tip":"t"}
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/translate.googleapis.com/**',lambda r:r.abort())
  def gem(r):
    j=U if 'marked words' in (r.request.post_data or '') else X
    r.fulfill(status=200,content_type='application/json',body=json.dumps({"candidates":[{"content":{"parts":[{"text":json.dumps(j,ensure_ascii=False)}]}}]}))
  pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  assert pg.evaluate("SNDM")=='auto','default auto'
  # restatement: tap a word → hint only
  rs=pg.evaluate("AMD.s.find(x=>x.t==='rs'&&!x.b&&!x.nt).ids[0]")
  pg.evaluate(f"amStart(['{rs}'],'t','learn','am','rs')");pg.wait_for_timeout(800)
  pg.evaluate("amPop('people','','','')");pg.wait_for_timeout(300)
  assert pg.evaluate("AMPOP.mode")=='hint','rs hint only'
  pg.evaluate("AMPOP=null;amPopDraw()")
  # sc: mark a word unknown, answer, explanation for it
  pg.evaluate("amStart(['csc5-1'],'t','learn','am','sc')");pg.wait_for_timeout(800)
  pg.evaluate("amPop('muscles','','','')");pg.wait_for_timeout(300);pg.click('#popUnk');pg.wait_for_timeout(200)
  assert pg.evaluate("AQ.st[0].unk")==['muscles'];assert pg.locator('.ax-q .tw.unk').count()>=1
  pg.evaluate("AMPOP=null;amPopDraw()")
  pg.locator('.ax-rad').nth(1).click();pg.wait_for_timeout(300)
  if pg.locator('#amChk').count():pg.click('#amChk')
  pg.wait_for_timeout(2000)
  t=pg.locator('.am-unkbox').inner_text();print(t);assert 'שרירים' in t
  # wrong answer comes back only after QBACK days
  r=pg.evaluate("[amLast('csc5-1')[1], amDayIds(15,'sc').includes('csc5-1')]");print(r);assert r==[0,False] or r==[False,False]
  pg.evaluate("const h=AMS.a['csc5-1'].h;h[h.length-1][3]=Date.now()-22*864e5");assert pg.evaluate("amDayIds(15,'sc')[0]")=='csc5-1'
  # sound mode cycle
  pg.evaluate("sndNext()");assert pg.evaluate("[SNDM,AUTO]")==['off',False]
  pg.evaluate("sndNext()");assert pg.evaluate("[SNDM,MUTED()]")==['mute',True]
  assert pg.evaluate("localStorage.getItem('dictSnd')")=='mute'
  assert not errs,errs;print('OK');b.close()
# sound sheet: the button opens the three modes; a hint popup still plays the word
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1200);pg.evaluate("localStorage.clear()");pg.reload();pg.wait_for_timeout(1200);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("amStart(['csc5-1'],'t','learn','am','sc')");pg.wait_for_timeout(800)
  pg.click('#autoBtn');pg.wait_for_timeout(300);assert pg.locator('[data-snd]').count()==3
  pg.click('[data-snd="mute"]');pg.wait_for_timeout(300)
  assert pg.evaluate("[SNDM,localStorage.getItem('dictSnd')]")==['mute','mute'] and 'שקט' in pg.locator('#autoBtn').inner_text()
  pg.click('#autoBtn');pg.click('[data-snd="off"]');pg.wait_for_timeout(300)
  pg.evaluate("window.__said=[];const o=amSay;amSay=t=>{__said.push(t)};amPop('regal','','','','hint')");assert pg.evaluate("__said")==['regal'],'hint popup plays the word'
  assert not errs,errs;print('OK2');b.close()
