# An old copy on another device (word still waiting for review 1) must not erase review 1 done elsewhere.
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();e=[];pg.on('pageerror',lambda x:e.append(str(x)))
  pg.route('**/firestore.googleapis.com/**',lambda r:r.abort())
  pg.goto('http://localhost:8765/');pg.wait_for_timeout(1500)
  r=pg.evaluate("""()=>{const n=amNow(),H=36e5;
    const old={e:'abandon',k:'c:abandon',h:'לנטוש',st:1,lr:5,r1w:1,due:n+5*H,t:n-30*H,rv:{st:1,en:'x'},log:[[n-31*H,'mc',1,0]]};
    const done={...old,r1w:undefined,st:2,due:n+20*H,t:n-3*H,rv:undefined,used:['he:x'],log:[...old.log,[n-3*H,'hecl',1,0]]};
    AMS.w={'c:abandon':JSON.parse(JSON.stringify(old))};wR1Release();   // stale device loads and releases
    const m=amMerge(AMS,{w:{'c:abandon':done},t:n});const m2=amMerge({w:{'c:abandon':done},t:n},AMS);
    return [m.w['c:abandon'].st,m2.w['c:abandon'].st,AMS.w['c:abandon'].t===old.t]}""")
  print(r,e);assert r==[2,2,True] and not e
