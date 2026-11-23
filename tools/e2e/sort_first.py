# New words: first a sorting pass in the dictionary quiz (her request) – ✓ ידעתי leaves the learning (and is ✓ in the dictionary), only ✗ words go into the rounds;
# other meanings show in every learning / review step; no underline on highlighted words outside the question body
import json
from playwright.sync_api import sync_playwright
def gem(route):
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'candidates':[{'content':{'parts':[{'text':json.dumps({'en':'I sent the letter by post yesterday.','he':'שלחתי את המכתב בדואר אתמול.'})}]}}]}))
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const T=dayKey(),P=jrPlan(T),x=P.b.find(b=>b.k==='new');const post=DW.find(c=>c.e==='post'&&/דואר/.test(c.h[0]));
    const cs=[post,...DW.filter(c=>c.l===3&&!isY(c)&&!isN(c)&&c.e!=='post').slice(0,3)];
    x.ws=cs.map(c=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:0,t:amNow()};return k});x.theme='';amSave();return {xid:x.id,ids:cs.map(c=>c.id)}})()""")
  pg.evaluate("xid=>go({screen:'amnw',jb:xid})",r['xid']);pg.wait_for_timeout(800)
  assert pg.locator('#jsGo').count()==1 and pg.locator('#nwGo').count()==0,'sorting first'
  pg.click('#jsGo');pg.wait_for_timeout(800);print('quiz',pg.evaluate("[S.screen,Q&&Q.key,Q&&Q.list.length]"))
  # mark: first two cards ✓, the rest ✗
  for i in range(4):
    cid=pg.evaluate("Q.list[Q.i].id");want='markY' if cid in r['ids'][1:3] else 'markN'
    pg.click('#'+want);pg.wait_for_timeout(500)
    if pg.evaluate("S.screen")=='quiz' and pg.locator('#qnext').count():pg.click('#qnext');pg.wait_for_timeout(600)
  st=pg.evaluate("[S.screen,(()=>{const x=jrBlock(S.jb);return [!!x.sorted,jsFresh(x).length,jnPend(x).length]})()]");print('after sort',st)
  known=pg.evaluate("ids=>ids.map(i=>!!isY(W[i]))",r['ids']);print('known',known)
  assert st[0]=='amnw' and st[1][0] and st[1][2]==2 and known[1:3]==[True,True]
  assert pg.locator('#nwGo').count()==1;pg.click('#nwGo');pg.wait_for_timeout(2500)
  # round 1 = translation: other meanings shown under the sentence
  oth=pg.locator('.am-card .others').count();tx=pg.locator('#app').inner_text();print('round1 others',oth,'word',pg.evaluate("AMS.w[WS.list[WS.i]].e"))
  assert pg.evaluate("WS.list.length")==2
  if pg.evaluate("AMS.w[WS.list[WS.i]].e")=='post':assert oth==1 and 'פירושים אחרים של המילה' in tx
  # underline styles: highlighted words have none; the question body keeps it
  dec=pg.evaluate("""(()=>{const m=document.createElement('mark');document.body.appendChild(m);const f=document.createElement('span');f.className='am-fill';document.body.appendChild(f);
    return [getComputedStyle(m).textDecorationLine,getComputedStyle(f).textDecorationLine]})()""");print('decor',dec);assert dec==['none','none']
  assert not e,e;print('OK')
