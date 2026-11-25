# שקט: nothing plays by itself, but a tapped speaker plays (every mode)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.add_init_script("localStorage.setItem('dictSnd','mute');window.LOGP=[];const op=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(!this.src.startsWith('data:'))LOGP.push('play:'+this.src);return op.call(this)};")
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  pg.evaluate("speak(RAW[0].e)");pg.wait_for_timeout(500);assert pg.evaluate("LOGP.length")==0,'auto silent'
  pg.evaluate("(()=>{const b=document.createElement('button');b.className='spk';b.id='tspk';b.onclick=()=>speak(RAW[0].e);document.body.appendChild(b)})()")
  pg.click('#tspk');pg.wait_for_timeout(800);l=pg.evaluate("LOGP");print(l);assert l,'tapped speaker plays'
  print('OK');b.close()
