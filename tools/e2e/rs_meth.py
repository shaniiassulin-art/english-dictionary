# Restatement (her request): answer → investigation (if wrong) → 🧭 solving by the method → words; other types unchanged
import json
from playwright.sync_api import sync_playwright
def gem(route):
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'candidates':[{'content':{'parts':[{'text':json.dumps({'steps':['צעד א','צעד ב'],'options':['x','y','z','w'],'rule':'כלל'})}]}}]}))
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  def run(t,wrong):
    pg.evaluate("""([t,wrong])=>{const ids=Object.keys(AMD.q).filter(i=>/^c/.test(i)&&AMD.q[i].t===t);const id=ids[0],q=AMD.q[id];
      AQ={ids:[id,ids[1]],i:0,st:{},name:'t',t};const sel=wrong?(q.a%4)+1:q.a;const st=aqSt();st.sel=sel;st.done=true;st.ok=!wrong;go({screen:'amq'})}""",[t,wrong]);pg.wait_for_timeout(700)
    seq=[]
    for _ in range(5):
      fb=pg.evaluate("aqSt().fb||'res'");seq.append(fb)
      nx=pg.locator('#amNext');
      if not nx.count() or not nx.get_attribute('data-fb'):break
      nx.click();pg.wait_for_timeout(500)
    path=pg.locator('.am-path').inner_text().replace('\n',' | ')
    back=[]
    for _ in range(3):
      if not pg.locator('#amBackRes').count():break
      pg.click('#amBackRes');pg.wait_for_timeout(400);back.append(pg.evaluate("aqSt().fb||'res'"))
    return seq,path,back
  r1=run('rs',True);print('rs wrong',r1);assert r1[0]==['res','why','meth','words'] and r1[2]==['meth','why','res']
  r2=run('rs',False);print('rs right',r2);assert r2[0]==['res','meth','words'] and r2[2]==['meth','res']
  r3=run('sc',True);print('sc wrong',r3);assert r3[0]==['res','why','words']
  assert not e,e;print('OK')
