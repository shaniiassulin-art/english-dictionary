# a tapped English word that has no recording plays through the <audio> element (online voice), device speech only as fallback
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844})
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=500,body='x'))
  mp3=open('audio/w/'+__import__('os').listdir('audio/w')[0],'rb').read()
  pg.route('**/translate.google.com/translate_tts**',lambda r:r.fulfill(status=200,body=mp3,headers={'Content-Type':'audio/mpeg'}))
  pg.add_init_script("localStorage.setItem('dictSnd','off');window.LOGP=[];const op=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){LOGP.push('play:'+this.src);return op.call(this)};")
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  pg.evaluate("(()=>{window.speechSynthesis.speak=u=>LOGP.push('tts:'+(u&&u.text))})()")
  pg.evaluate("amPop('disrepair','','','Why are they allowed to reach such a state of disrepair?')");pg.wait_for_timeout(1500)
  l=pg.evaluate("LOGP");print(l)
  ok=any('translate_tts' in x and 'disrepair' in x for x in l) and not any(x.startswith('tts:disrepair') for x in l)
  pg.evaluate("LOGP.length=0");pg.locator('.am-pop .spk, .am-pop [data-amsay]').first.click();pg.wait_for_timeout(1000)
  l2=pg.evaluate("LOGP");print(l2);ok=ok and any('translate_tts' in x for x in l2)
  pg.unroute('**/translate.google.com/translate_tts**');pg.route('**/translate.google.com/translate_tts**',lambda r:r.fulfill(status=404,body='x'))
  # online voice fails → Gemini voice (an audio blob through the <audio> element)
  import base64,json as J
  pg.unroute('**/generativelanguage.googleapis.com/**');pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body=J.dumps({"candidates":[{"content":{"parts":[{"inlineData":{"mimeType":"audio/mpeg","data":base64.b64encode(mp3).decode()}}]}}]})))
  pg.evaluate("window.LOGP=[];amSay('A sentence without a recording here.')");pg.wait_for_timeout(3000)
  l4=pg.evaluate("LOGP");print(l4);ok=ok and any(x.startswith('play:blob:') for x in l4)
  # both fail → device voice
  pg.unroute('**/generativelanguage.googleapis.com/**');pg.route('**/generativelanguage.googleapis.com/**',lambda r:r.fulfill(status=500,body='x'))
  pg.evaluate("window.LOGP=[];amSay('foobarword')");pg.wait_for_timeout(4000)
  l3=pg.evaluate("LOGP");print(l3);ok=ok and any(x=='tts:foobarword' for x in l3)
  print('OK' if ok else 'FAIL');b.close()
