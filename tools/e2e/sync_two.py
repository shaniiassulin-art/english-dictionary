# Two devices on one (mock) account: nothing done on one device may be lost because of the other.
# A = the device she works on, B = a device with an old copy that is opened later (or at the same time).
import json,time,sys
from playwright.sync_api import sync_playwright
DOC={'d':None,'ut':0}
def fs(route):
  r=route.request;u=r.url
  if r.method=='GET':
    if DOC['d'] is None:return route.fulfill(status=404,body='{}')
    return route.fulfill(status=200,content_type='application/json',body=json.dumps({'fields':{'data':{'stringValue':DOC['d']},'updated':{'integerValue':'1'}},'updateTime':str(DOC['ut'])}))
  if r.method=='PATCH':
    if 'currentDocument.updateTime=' in u and u.split('currentDocument.updateTime=')[1].split('&')[0]!=str(DOC['ut']):return route.fulfill(status=412,body='{}')
    if 'currentDocument.exists=false' in u and DOC['d'] is not None:return route.fulfill(status=412,body='{}')
    DOC['d']=json.loads(r.post_data)['fields']['data']['stringValue'];DOC['ut']+=1
    return route.fulfill(status=200,content_type='application/json',body=json.dumps({'updateTime':str(DOC['ut'])}))
  route.fulfill(status=200,body='{}')
SEED="""(()=>{const now=amNow(),D=864e5;localStorage.clear();AMS={a:{},w:{},n:8,nd:{},js:dayKey(),jp:{},tm:{}};
  const cs=DW.filter(c=>c.l===3).slice(0,6);cs.forEach((c,i)=>{const k='c:'+c.id;AMS.w[k]={e:c.e,h:[c.h[0]],k,st:1,lr:5,r1w:1,due:now+D,t:now-D,rv:{st:1,en:'old sentence '+i},log:[[now-D,'mc',1,0]]}});
  const P=jrPlan(dayKey());P.t=now-D;AMS.jp[dayKey()]=P;AMS.t=now-D;LS.set('dictAm',JSON.stringify(AMS));
  localStorage.setItem('dictKnow','{}');localStorage.setItem('dictSess','{}');localStorage.setItem('dictDays','{}');
  return Object.keys(AMS.w)})()"""
def page(ctx,errs):
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)));return pg
with sync_playwright() as p:
  b=p.chromium.launch();errs=[]
  A=b.new_context();B=b.new_context()
  for c in (A,B):
    c.route('**/firestore.googleapis.com/**',fs);c.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort());c.route('**/translate.googleapis.com/**',lambda r:r.abort())
  # both devices start from the same saved state; the account has it too
  pa=page(A,errs);pa.goto('http://localhost:8765/');pa.wait_for_timeout(1500);pa.evaluate("amLoad()");pa.wait_for_timeout(2000)
  keys=pa.evaluate(SEED);seed=pa.evaluate("localStorage.getItem('dictAm')")
  DOC['d']=json.dumps({'am':json.loads(seed),'know':{},'days':{},'sess':{}});DOC['ut']=1
  pb=page(B,errs);pb.goto('http://localhost:8765/');pb.wait_for_timeout(800)
  pb.evaluate("s=>{localStorage.clear();localStorage.setItem('dictAm',s);localStorage.setItem('dictLrFix1','1');localStorage.setItem('dictLrFix2','1')}",seed)
  pb.close()  # B is now an old copy, closed
  pa.reload();pa.wait_for_timeout(2500)
  # A: review 1 of every word (real grading), questions counted on the plan, dictionary marks, a quiz session
  r=pa.evaluate("""(ks)=>{const now=amNow();const out=[];for(const k of ks){const w=AMS.w[k];if(!w)continue;WS={mode:'rev',list:[k],i:0,again:[],res:{task:'hecl'}};wAfter(w,true);out.push(AMS.w[k].st)}
    const P=AMS.jp[dayKey()],q=P.b.find(x=>x.k==='q');for(let i=0;i<5;i++)jrCount(q.id);q.used=6e5;
    const c=DW[10];KNOW[c.id]=[1,Date.now()];saveKnow();logDay(c.id);
    SESS['G3-1']={i:7,t:Date.now(),ids:[1,2,3]};saveSess();amSave();dirty();return {st:out,q:q.id}}""",keys)
  print('A after reviews',r)
  pa.wait_for_timeout(3500)
  rem=json.loads(DOC['d'])
  print('account after A:',[rem['am']['w'][k]['st'] for k in keys])
  # B opens the old copy, does something of its own (marks another card) and syncs
  pb=page(B,errs);pb.goto('http://localhost:8765/');pb.wait_for_timeout(4000)
  pb.evaluate("()=>{const c=DW[20];KNOW[c.id]=[0,Date.now()];saveKnow();go({screen:'am'})}");pb.wait_for_timeout(4000)
  rem=json.loads(DOC['d']);am=rem['am']
  P=am['jp'][pb.evaluate('dayKey()')];q=[x for x in P['b'] if x['id']==r['q']][0]
  res={'stages':[am['w'][k]['st'] for k in keys],'same_sentence':[('rv' in am['w'][k]) for k in keys],
       'q_done':q.get('d'),'q_used':q.get('used'),'know':sorted(rem['know'].keys()),'sess':'G3-1' in rem['sess'],
       'B_stages':pb.evaluate("ks=>ks.map(k=>AMS.w[k]&&AMS.w[k].st)",keys)}
  # A comes back: everything from both devices is there
  pa.reload();pa.wait_for_timeout(4000)
  res['A_know']=pa.evaluate("()=>[DW[10].id,DW[20].id].map(i=>KNOW[i]&&KNOW[i][0])")
  print(res);print('errors',errs)
  ok=res['stages']==r['st'] and all(s==2 for s in res['stages']) and not any(res['same_sentence']) and res['q_done']==5 and res['q_used']>=6e5 and all(k in res['know'] for k in res['know'][:0]) and len(res['know'])>=2 and res['sess'] and res['B_stages']==r['st'] and res['A_know']==[1,0]
  assert ok and not errs,'FAIL'
  # both devices open at the same time, each answering different words and questions
  pb.reload();pb.wait_for_timeout(3000)
  pa.evaluate("ks=>{ks.slice(0,3).forEach(k=>{const w=AMS.w[k];w.due=amNow()-1;WS={mode:'rev',list:[k],i:0,again:[],res:{task:'mc'}};wAfter(w,true)});amRecord&&0;dirty()}",keys)
  pb.evaluate("ks=>{ks.slice(3).forEach(k=>{const w=AMS.w[k];w.due=amNow()-1;WS={mode:'rev',list:[k],i:0,again:[],res:{task:'mc'}};wAfter(w,true)});dirty()}",keys)
  pa.wait_for_timeout(4000);pb.wait_for_timeout(1000);pa.evaluate("syncNow(true)");pb.evaluate("syncNow(true)");pa.wait_for_timeout(3000)
  am=json.loads(DOC['d'])['am'];both=[am['w'][k]['st'] for k in keys]
  devs=[x.evaluate("ks=>ks.map(k=>AMS.w[k].st)",keys) for x in (pa,pb)]
  print('same time:',both,devs);assert both==[3]*6 and devs==[[3]*6]*2,'FAIL same time'
  # a plan touched by an old copy (newer time, fewer answers) keeps the answers
  m=pa.evaluate("""()=>{const k=dayKey(),P=AMS.jp[k],old=JSON.parse(JSON.stringify(P));old.t=amNow()+5;old.b.forEach(x=>{x.d=0;x.used=0;if(x.k==='rev')x.skip=1,x.done=amNow()});
    const m=amMerge({jp:{[k]:P}},{jp:{[k]:old}}).jp[k];return m.b.filter(x=>x.k==='q').map(x=>[x.d,x.used])}""")
  print('plan merge:',m);assert m[0][0]==5 and m[0][1]>=6e5,'FAIL plan'
  # a quiz open on both devices: A goes on, B (still on the quiz screen, older place) is refreshed – the newer place wins everywhere
  pa.evaluate("()=>{S.l=3;S.g=0;startQuiz(DW.filter(c=>c.l===3).slice(0,20),'t','home','GQS')}");pa.wait_for_timeout(2500)
  pb.evaluate("()=>{loadQ('GQS')||0}");pb.reload();pb.wait_for_timeout(2500);pb.evaluate("()=>{resumeQuiz('GQS')}");pb.wait_for_timeout(500)
  pa.evaluate("()=>{Q.i=9;saveQ()}");pa.wait_for_timeout(3000)
  pb.reload();pb.wait_for_timeout(4000)
  qi=[json.loads(DOC['d'])['sess']['GQS']['i'],pb.evaluate("Q&&Q.i"),pb.evaluate("S.screen")]
  print('quiz place:',qi);assert qi[0]==9 and qi[1]==9,'FAIL quiz'
  print('errors',errs);assert not errs;print('OK')
