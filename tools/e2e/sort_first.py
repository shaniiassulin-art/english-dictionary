# New words: first a sorting pass in the dictionary quiz (her request) – ✓ ידעתי leaves the learning (and is ✓ in the dictionary), only ✗ words go into the rounds;
# other meanings show in every learning / review step; links have no underline (her request), highlighted words keep theirs
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
    x.n=2;x.ws=cs.map(c=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:0,t:amNow()};return k});x.theme='';amSave();return {xid:x.id,ids:cs.map(c=>c.id)}})()""")
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
  assert oth==0  # no other meanings in the translation step (Nov 25)
  # underline styles: highlighted words have none; the question body keeps it
  dec=pg.evaluate("""(()=>{const m=document.createElement('mark');document.body.appendChild(m);const f=document.createElement('span');f.className='am-fill';document.body.appendChild(f);
    return [getComputedStyle(m).textDecorationLine,getComputedStyle(f).textDecorationLine]})()""");print('decor',dec);assert dec==['underline','underline']
  lk=pg.evaluate("[...document.querySelectorAll('.small-link,.hint .link,.jh-l,#wPrev,[data-path]')].map(e=>getComputedStyle(e).textDecorationLine)");print('links',lk);assert all(x=='none' for x in lk)
  # top-up (Nov 25): she knew 2 of 4 with n=4 → 2 more words are added to sort; after sorting them the page offers learning with 4 words
  r=pg.evaluate("""(()=>{const T=dayKey(),P=AMS.jp[T];const x={id:T+'|new9',k:'new',m:12,n:4,d:0,done:0,used:0};P.b.push(x);WS=null;
    const cs=DW.filter(c=>c.l===4&&!isY(c)&&!isN(c)).slice(0,4);x.ws=cs.map(c=>{const k='c:'+c.id;AMS.w[k]={k,e:c.e,h:c.h[0],st:0,t:amNow()};return k});amSave();return {xid:x.id,ids:cs.map(c=>c.id)}})()""")
  pg.evaluate("xid=>go({screen:'amnw',jb:xid})",r['xid']);pg.wait_for_timeout(800);pg.click('#jsGo');pg.wait_for_timeout(800)
  def sortall(yes):
    for i in range(12):
      if pg.evaluate("S.screen")!='quiz':break
      cid=pg.evaluate("Q.list[Q.i].id");pg.click('#'+('markY' if cid in yes else 'markN'));pg.wait_for_timeout(450)
      if pg.evaluate("S.screen")=='quiz' and pg.locator('#qnext').count():pg.click('#qnext');pg.wait_for_timeout(500)
  sortall(r['ids'][:2])
  st=pg.evaluate("(()=>{const x=jrBlock(S.jb);return [S.screen,x.ws.length,jsToSort(x).length,jsFresh(x).length,x.srn]})()");print('after first sort',st)
  assert st[0]=='amnw' and st[1]==6 and st[2]==2 and st[3]==4 and pg.locator('#jsGo').count()==1
  h=pg.locator('.jh-hero h2').inner_text();print(h);assert '2 מילים למיון' in h
  pg.click('#jsGo');pg.wait_for_timeout(800);print('2nd quiz',pg.evaluate("[Q.key,Q.list.length]"));assert pg.evaluate("Q.list.length")==2
  sortall([])
  st=pg.evaluate("(()=>{const x=jrBlock(S.jb);return [S.screen,jsToSort(x).length,jnPend(x).length]})()");print('after second sort',st)
  assert st==['amnw',0,4] and pg.locator('#nwGo').count()==1
  h=pg.locator('.jh-hero').inner_text();print(h);assert '4 מילים ללמידה' in h and '2 ידעת במיון' in h
  assert not e,e;print('OK')
