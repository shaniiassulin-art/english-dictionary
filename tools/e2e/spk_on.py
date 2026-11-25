# a tapped speaker is marked (.spk-on) while it plays and the mark goes away after
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("(()=>{const b=document.createElement('button');b.className='spk';b.id='tspk';b.onclick=()=>speak(RAW[0].e);document.body.appendChild(b)})()")
  pg.click('#tspk');pg.wait_for_timeout(300);on=pg.evaluate("document.getElementById('tspk').classList.contains('spk-on')")
  pg.wait_for_timeout(5000);off=not pg.evaluate("document.getElementById('tspk').classList.contains('spk-on')")
  print(on,off);assert on and off and not errs,errs;print('OK');b.close()
