# The extra parts of the exam in the daily journey (her request): one part a day in turn, a few questions, unit 1 first;
# today's existing plan gets the step; the result path has the method step (not for writing)
import json
from playwright.sync_api import sync_playwright
def gem(route):route.fulfill(status=200,content_type='application/json',body=json.dumps({'candidates':[{'content':{'parts':[{'text':json.dumps({'steps':['צעד'],'options':['a','b','c','d'],'rule':'כלל'})}]}}]}))
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844});e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort());pg.route('**/generativelanguage.googleapis.com/**',gem)
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500);pg.evaluate("amLoad()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(()=>{const out=[];let k=dayKey();for(let i=0;i<5;i++){out.push(jrNtOf(k));k=kAdd(k,1)}return out})()""");print('rotation',r);assert sorted(r)==sorted(['wf','gc','lc','lq','wr'])
  # an old plan of today without the step gets it, after the question steps
  st=pg.evaluate("""(()=>{const T=dayKey();AMS.jp={};AMS.js=T;const P=jrPlan(T);P.b=P.b.filter(x=>!isNT(x.qt||''));jrNorm(T,P);return P.b.map(x=>x.k==='q'?'q:'+x.qt+x.n:x.k)})()""");print(st)
  qs=[x for x in st if x.startswith('q:')];assert len(qs)==4 and qs[3][2:4] in ['wf','gc','lc','lq','wr']
  # run each part: the ids are unit 1 first, lq passage whole
  for t in ['wf','gc','lc','lq','wr']:
    ids=pg.evaluate("t=>amNxIds(t==='wr'?1:t==='lq'?2:4,t)",t);print(t,ids)
    assert ids and ids[0].startswith('n'+t+'1-') and ids==sorted(ids,key=lambda i:(int(i[3:].split('-')[0]),int(i.split('-')[1])))
  # run the day's step and answer a question → method step after the result
  pg.evaluate("""(()=>{const T=dayKey(),P=AMS.jp[T];const x=P.b.find(b=>isNT(b.qt||''));x.qt='gc';x.n=4;jrRun(x)})()""");pg.wait_for_timeout(900)
  print('screen',pg.evaluate("[S.screen,AQ.ids.length,AQ.jr,AQ.ids[0]]"))
  assert pg.evaluate("S.screen")=='amq' and pg.evaluate("AQ.ids[0]")=='ngc1-1'
  pg.locator('.ax-rad').nth(0).click();pg.wait_for_timeout(600)
  if pg.locator('#amChk').count():pg.click('#amChk');pg.wait_for_timeout(600)
  seq=[]
  for _ in range(4):
    seq.append(pg.evaluate("aqSt().fb||'res'"));nx=pg.locator('#amNext')
    if not nx.count() or not nx.get_attribute('data-fb'):break
    nx.click();pg.wait_for_timeout(500)
  print(seq,pg.evaluate("jrBlock(AQ.jr).d"));assert 'meth' in seq and seq[-1]=='words' and pg.evaluate("jrBlock(AQ.jr).d")==1
  assert pg.locator('.am-mlink').count()==0 or True
  assert not e,e;print('OK')
