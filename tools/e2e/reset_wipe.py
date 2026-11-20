# a device with empty storage (iPhone cleared it / home-screen app) must not wipe the answered questions of the account
import json
from playwright.sync_api import sync_playwright
DOC={'d':None,'ut':0}
def fs(route):
  r=route.request;u=r.url
  if r.method=='GET':
    if DOC['d'] is None:return route.fulfill(status=404,body='{}')
    return route.fulfill(status=200,content_type='application/json',body=json.dumps({'fields':{'data':{'stringValue':DOC['d']}},'updateTime':str(DOC['ut'])}))
  if 'currentDocument.updateTime=' in u and u.split('currentDocument.updateTime=')[1].split('&')[0]!=str(DOC['ut']):return route.fulfill(status=412,body='{}')
  DOC['d']=json.loads(r.post_data)['fields']['data']['stringValue'];DOC['ut']+=1
  route.fulfill(status=200,content_type='application/json',body=json.dumps({'updateTime':str(DOC['ut'])}))
with sync_playwright() as p:
  b=p.chromium.launch();errs=[]
  A=b.new_context();A.route('**/firestore.googleapis.com/**',fs);A.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pa=A.new_page();pa.on('pageerror',lambda e:errs.append(str(e)));pa.goto('http://localhost:8765/');pa.wait_for_timeout(1500)
  am=pa.evaluate("""(()=>{const now=Date.now();return {a:{'c1-1':{h:[['b',true,5000,now-3*864e5]],t:now-3*864e5},'c1-2':{h:[['a',false,5000,now-864e5]],t:now-864e5}},w:{},n:8,nd:{},ar:Date.parse('2026-10-30T14:00:00+02:00'),t:now}})()""")
  DOC['d']=json.dumps({'am':am,'know':{},'days':{},'sess':{}});DOC['ut']=1
  B=b.new_context();B.route('**/firestore.googleapis.com/**',fs);B.route('**/generativelanguage.googleapis.com/**',lambda r:r.abort())
  pb=B.new_page();pb.on('pageerror',lambda e:errs.append(str(e)));pb.goto('http://localhost:8765/');pb.wait_for_timeout(6000)
  acc=sorted(json.loads(DOC['d'])['am'].get('a',{}).keys());loc=pb.evaluate("Object.keys(AMS.a).sort()")
  print('account:',acc,'device B:',loc,errs);assert acc==['c1-1','c1-2'] and loc==acc and not errs;print('OK')
