/* ================= 🎯 אמירנט: exam practice + active word learning =================
   Data (src/amiram.json → amiram.json next to the page, fetched when the section opens):
   q[id] = {t:'sc'|'rs'|'rc', q, o[4], a (1-4), he (Hebrew translation), oh[4] (Hebrew of each option, with the book's notes),
            ex (book explanation, rc), x (passage id, rc), my (her circled answer in the book), gl [[en,he]] (her glosses in the book)}
   x[id] = {l:[lines, '' = new paragraph], gl}; s = [{id,t,u,ids}] units in book order.
   State AMS (localStorage dictAm, synced as field "am"):
     a[qid] = {h:[[choice,ok,ms,time]], r:[reason codes], n:'her note', box, due, t}   – attempts and the mistakes notebook
     w[key] = {e,h,c (context),src,st (stage 0-6),due,as (association),my (her sentence),ok,bad,t}   – the word workshop
     n = new words per day, nd = {day: count}
   Gemini answers (method explanations, mistake analysis, associations) are cached on the device only (dictAmAi). */
const AMSRC=['amiram.json','https://cdn.jsdelivr.net/gh/shaniiassulin-art/english-dictionary@main/amiram.json','https://raw.githubusercontent.com/shaniiassulin-art/english-dictionary/main/amiram.json'];
let AMD=null,AMDP=null;
function amLoad(){if(AMD)return Promise.resolve(AMD);if(AMDP)return AMDP;
  AMDP=(async()=>{for(const u of AMSRC){try{const r=await fetch(u+(u==='amiram.json'?'?v='+AMV:''));if(r.ok){AMD=await r.json();return AMD}}catch(e){}}AMDP=null;throw 0})();return AMDP}
const AMV='1';
let AMS={a:{},w:{},n:8,nd:{},t:0};try{Object.assign(AMS,JSON.parse(LS.get('dictAm')||'{}'))}catch(e){}
function amSave(){AMS.t=Date.now();LS.set('dictAm',JSON.stringify(AMS));dirty()}
let AMAI={};try{AMAI=JSON.parse(LS.get('dictAmAi')||'{}')}catch(e){}
const amAiSave=()=>LS.set('dictAmAi',JSON.stringify(AMAI));
/* once (Oct 30, her request): all solved questions and simulations start again from zero; mistakes are handled on the spot, no retry list */
if(!LS.get('dictAmReset1')){AMS.ar=Date.now();AMS.a={};AMS.ex={};LS.set('dictAmReset1','1');try{LS.set('dictAmQ','null')}catch(e){}LS.set('dictAm',JSON.stringify(AMS));setTimeout(()=>{try{dirty()}catch(e){}},0)}
/* sync merge: per question / per word the newer entry wins; attempt lists are joined */
function amMerge(a,b){a=a||{};b=b||{};const o={a:{},w:{},n:(b.t||0)>(a.t||0)?b.n||a.n||8:a.n||b.n||8,nd:{},t:Math.max(a.t||0,b.t||0),ar:Math.max(a.ar||0,b.ar||0)};
  for(const s of [a.a||{},b.a||{}])for(const k in s){const x=s[k],y=o.a[k];
    if(!y){o.a[k]=JSON.parse(JSON.stringify(x));continue}
    const h=[...(y.h||[])];(x.h||[]).forEach(r=>{if(!h.some(z=>z[3]===r[3]))h.push(r)});h.sort((p,q)=>p[3]-q[3]);
    o.a[k]=(x.t||0)>(y.t||0)?{...x,h}:{...y,h}}
  for(const s of [a.w||{},b.w||{}])for(const k in s)if(!o.w[k]||(s[k].t||0)>(o.w[k].t||0))o.w[k]=s[k];
  for(const s of [a.nd||{},b.nd||{}])for(const k in s)o.nd[k]=Math.max(o.nd[k]||0,s[k]);
  /* attempts and simulations from before the reset are dropped */
  if(o.ar){for(const k in o.a){const x=o.a[k];x.h=(x.h||[]).filter(r=>r[3]>o.ar);if(!x.h.length&&(x.t||0)<=o.ar)delete o.a[k]}}
  for(const f of ['ls','hc','rd','ex']){o[f]={};for(const s of [a[f]||{},b[f]||{}])for(const k in s){const v=s[k],w=o[f][k],tv=Array.isArray(v)?v[1]:v&&v.t||v,tw=Array.isArray(w)?w[1]:w&&w.t||w;if(w===undefined||(tv||0)>(tw||0))o[f][k]=v}}
  if(o.ar)for(const k in o.ex)if((o.ex[k].t||0)<=o.ar)delete o.ex[k];
  return o}
function amApply(m){AMS=Object.assign({a:{},w:{},n:8,nd:{}},m||{});LS.set('dictAm',JSON.stringify(AMS))}
const DAY=864e5;
const amNow=()=>Date.now();

/* ---------- words: dictionary lookup ---------- */
const DIX={};DW.forEach(w=>{const k=w.e.toLowerCase();(DIX[k]=DIX[k]||[]).push(w)});
function dictFind(e){let k=String(e||'').toLowerCase().replace(/[^a-z' \-]/g,'').trim();if(!k)return null;
  const cand=[k];if(k.endsWith('ies'))cand.push(k.slice(0,-3)+'y');if(k.endsWith('es'))cand.push(k.slice(0,-2));if(k.endsWith('s'))cand.push(k.slice(0,-1));
  if(k.endsWith('ied'))cand.push(k.slice(0,-3)+'y');if(k.endsWith('ed')){cand.push(k.slice(0,-2),k.slice(0,-1));if(/(.)\1ed$/.test(k))cand.push(k.slice(0,-3))}
  if(k.endsWith('ing')){cand.push(k.slice(0,-3),k.slice(0,-3)+'e');if(/(.)\1ing$/.test(k))cand.push(k.slice(0,-4))}
  if(k.endsWith('ly'))cand.push(k.slice(0,-2),k.slice(0,-2)+'e',k.slice(0,-3)+'y',k.slice(0,-3)+'le');
  for(const c of cand)if(DIX[c])return {e:DIX[c][0].e,cards:DIX[c],h:[...new Set(DIX[c].map(w=>w.h[0]))]};return null}
const TRC={};
async function amTrans(e){const k=e.toLowerCase();if(TRC[k])return TRC[k];const d=dictFind(e);if(d)return TRC[k]={h:d.h.join(' · '),src:'המילון שלך'};
  for(const f of [trGoogle,trMemory,trGemini]){try{const r=await f(e,'en','he');const alt=(r.alts||[]).map(p=>p.w.slice(0,3).join(', ')).join(' · ');return TRC[k]={h:r.main+(alt?' ('+alt+')':''),src:r.src}}catch(x){}}
  return {h:'',src:''}}
const STOP=new Set('a an the of to in on at by for and or but is are was were be been being it its this that these those he she they we you i his her their our your with as from not no so if than then there here have has had do does did can could will would shall should may might must also very more most much many such only just into about over under after before while when which who whom whose what where why how all any some each both other one two three'.split(' '));
/* 🔊 any English text: the recording if there is one, the Gemini English voice if chosen, else the phone's voice */
const DSENT=new Set(RAW.flatMap(r=>Array.isArray(r.s)?r.s:[r.s]).filter(Boolean));
function amSay(t){t=String(t||'').replace(/_{2,}/g,' blank ').trim();if(!t)return;unlockAudio();
  if(WORDSET.has(t)||DSENT.has(t)){speak(t);return}
  if(enGem&&GKEY()){stopAudio();try{speechSynthesis.cancel()}catch(e){}gemSay(t,.95,enGem,true).then(ok=>{if(!ok)ttsEn(t,.9)});return}
  stopAudio();ttsEn(t,.9)}
const SAYB=(t,cls)=>`<button class="spk am-say${cls?' '+cls:''}" data-amsay="${esc(t)}" aria-label="השמעה">${SPK}</button>`;
/* every English word in a text as a tappable span; connectors found by connFind (cs) are coloured instead */
function tapEn(t,cs){t=String(t);const ph=[];
  (cs||[]).forEach(c=>c.ws.slice().sort((a,b)=>b.length-a.length).forEach(w=>{t=t.replace(new RegExp('(^|[^A-Za-z\u0001])('+w.replace(/ /g,'\\s+')+')(?=[^A-Za-z]|$)','gi'),(m,a,b)=>{ph.push('<b class="cn cn-'+c.k+'">'+esc(b)+'</b>');return a+'\u0001'+(ph.length-1)+'\u0002'})}));
  return t.split(/(\u0001\d+\u0002|[A-Za-z][A-Za-z'\-]*[A-Za-z]|[A-Za-z])/).map((x,i)=>{if(!(i%2))return esc(x);
    const m=x.match(/^\u0001(\d+)\u0002$/);if(m)return ph[+m[1]];
    if(STOP.has(x.toLowerCase())||x.length<3)return esc(x);const db=TAPDB&&dictFind(x);return `<span class="tw${db?' db':''}" data-tw="${esc(x)}">${esc(x)}</span>`}).join('')}
let TAPDB=false;
/* ---------- connectors: detected in the sentence, with what they tell us ---------- */
const CONN=[
  ['ניגוד','contrast',['but','although','though','even though','however','yet','while','whereas','despite','in spite of','nevertheless','nonetheless','rather than','instead','unlike','on the other hand','contrary to','even if'],'שני חלקי המשפט הפוכים זה לזה – ההשלמה צריכה להיות ההפך מהחלק השני.'],
  ['סיבה','cause',['because','since','due to','owing to','thanks to','because of','as a result of','for this reason'],'חלק אחד הוא הסיבה לשני – ההשלמה צריכה להתאים להיגיון של סיבה ותוצאה.'],
  ['תוצאה','result',['therefore','thus','hence','consequently','as a result','so that','thereby','accordingly','leading to','in order to'],'החלק השני נובע מהראשון – ההשלמה היא תוצאה הגיונית שלו.'],
  ['הוספה','addition',['also','moreover','furthermore','in addition','as well as','besides','not only','along with'],'החלקים באותו כיוון – ההשלמה ממשיכה את הרעיון (דומה, לא הפוכה).'],
  ['דוגמה','example',['for example','such as','for instance','including'],'מה שבא אחרי הוא דוגמה למה שלפני – ההשלמה היא שם הקטגוריה שהדוגמאות שייכות אליה.'],
  ['זמן','time',['when','before','after','until','once','as soon as','during','by the time','since'],'סדר זמנים – שימי לב מה קרה קודם ומה אחר כך.'],
  ['תנאי','condition',['if','unless','provided that','as long as','only if','either','neither'],'משהו קורה רק בתנאי מסוים.'],
  ['השוואה','compare',['similarly','likewise','just as','than','compared to','the same as'],'משווים בין שני דברים – בדקי מי גדול/קטן/דומה למי.'],
  ['שלילה / הגבלה','neg',['not','never','no longer','rarely','hardly','seldom','without'],'מילה שהופכת או מגבילה את המשמעות – קל לפספס אותה, והיא משנה הכול.']];
function connFind(t){const s=' '+String(t).toLowerCase().replace(/[^a-z' ]/g,' ').replace(/\s+/g,' ')+' ',out=[];
  CONN.forEach(([he,k,ws,tip])=>{const hit=ws.filter(w=>s.includes(' '+w+' '));if(hit.length)out.push({he,k,ws:hit,tip})});return out}

/* ---------- reading comprehension question types (from the course book) ---------- */
const RCT={
  refer:['refer to','נאתר את המילה, נחזור אחורה לתחילת המשפט ונקרא אותו עד הסוף. התשובה נמצאת תמיד <b>לפני</b> המילה (לפעמים במשפט הקודם). מסיח נפוץ: מילה אחרת מאותו משפט/פסקה.'],
  vocab:['אוצר מילים','קוראים את <b>כל המשפט</b> שבו המילה (לא רק את השורה), מבינים את המשמעות בהקשר – ורק אז עוברים לתשובות. זהירות: לעיתים המילה מופיעה במשמעות הפחות נפוצה שלה.'],
  func:['תפקיד פרט','שואלים <b>למה</b> הפרט מופיע, לא מה הוא אומר. קוראים את המשפט בעיון, חושבים מה התפקיד (דוגמה? ניגוד? חיזוק?) ורק אז לתשובות. מסיח נפוץ: תשובה שמצטטת את תוכן הפרט.'],
  infer:['הסקה','התשובה לא כתובה במפורש – לוקחים את המשפט הרלוונטי צעד אחד קטן קדימה. מסיחים נפוצים: תשובה שמצטטת את הקטע, ותשובה שמרחיקה לכת מדי.'],
  para:['פסקה','קוראים את המשפט הראשון של הפסקה ומרפרפים על השאר (דוגמאות, פרטים). מסיח נפוץ: פרט שמופיע בפסקה אבל אינו הרעיון המרכזי שלה.'],
  main:['רעיון מרכזי','משאירים לסוף. קוראים את הפסקה הראשונה ואת המשפט הראשון של כל פסקה. מסיחים: תשובה רחבה מדי, ותשובה צרה מדי (רק פסקה אחת).'],
  detail:['פרט','התשובה כתובה בקטע במפורש. מאתרים את המשפט לפי מילות מפתח מהשאלה וקוראים רק אותו. מסיחים: מידע ממקום אחר בקטע, ומשפט כמעט זהה עם שינוי קטן (not, always…).']};
function rcType(q){const s=q.toLowerCase();
  if(/refers? to/.test(s))return 'refer';
  if(/(word|phrase|expression)[^.]*(replaced|closest|means|meaning|restated)|closest in meaning|could best be replaced|means the same|best be restated|"[^"]+" \(line \d+\) (is|could|can)/.test(s))return 'vocab';
  if(/is used (to|in order)|in order to|mentions?[^.]*(to|because|in order)|in quotation|quotation marks|the author (uses|mentions|cites|refers)|serves to|purpose of mentioning|example of/.test(s))return 'func';
  if(/inferred|understood|implies|implied|suggests?|probably|most likely|conclude/.test(s))return 'infer';
  if(/(first|second|third|fourth|fifth|last|final|next|previous|this) paragraph/.test(s)&&/main|mainly|purpose|discuss|describe|deals/.test(s))return 'para';
  if(/main (purpose|idea|topic|subject)|good title|mainly (about|concerned|discusses)|the text|the passage|best title/.test(s))return 'main';
  return 'detail'}
const AMTN={sc:'השלמת משפטים',rs:'ניסוח מחדש',rc:'הבנת הנקרא',yb:'יסודות'};
const AMTI={sc:'✏️',rs:'🔁',rc:'📖',yb:'🧱'};
const AMTARGET={sc:30,rs:60,rc:70,yb:20};
/* right answer? (basics fill-ins have a typed answer) */
const amNorm=t=>String(t||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z' ]/g,' ').replace(/\s+/g,' ').trim();
function amIsOk(q,c){return typeof q.a==='string'?amNorm(c)===amNorm(q.a):c===q.a}
const amCourse=s=>!s.b&&s.t!=='yb';
/* why she got it wrong – chosen by her before the analysis */
const WHY=[['vocabQ','לא הכרתי מילה במשפט'],['vocabA','לא הכרתי מילים בתשובות'],['conn','פספסתי מילת קישור / את המבנה'],['similar','התבלבלתי בין מילים דומות'],['trap','בחרתי משהו שמופיע בטקסט אבל לא עונה על השאלה'],['extra','לא שמתי לב למידע נוסף / חסר / קיצוני'],['rushed','מיהרתי / לחץ זמן'],['guess','ניחשתי']];

/* ---------- attempts and the mistakes notebook ---------- */
const BOXD=[1,3,7];
function amAtt(id){return AMS.a[id]}
function amLast(id){const a=AMS.a[id];return a&&a.h&&a.h.length?a.h[a.h.length-1]:null}
function amRecord(id,choice,ms){const q=AMD.q[id],ok=amIsOk(q,choice),a=AMS.a[id]=AMS.a[id]||{h:[]};const now=amNow();
  const wasMist=amIsMist(id);a.h.push([choice,ok?1:0,Math.round(ms||0),now]);
  if(!ok){a.box=0;a.due=now+DAY;a.fixed=0}
  else if(wasMist){a.box=(a.box||0)+1;if(a.box>=BOXD.length){a.fixed=now;a.due=0}else a.due=now+BOXD[a.box]*DAY}
  a.t=now;amSave();return ok}
/* in the notebook: wrong at least once (here or in the book) and not fixed yet */
function amEverWrong(id){const a=AMS.a[id];return !!(a&&a.h.some(r=>!r[1]))}
function amIsMist(id){if(!AMD.q[id])return false;const a=AMS.a[id];if(!amEverWrong(id))return false;return !(a&&a.fixed)}
function amMistDue(id){const a=AMS.a[id];if(!amIsMist(id))return false;return !a||!a.due||a.due<=amNow()}
function amSetStat(s){let done=0,ok=0;s.ids.forEach(id=>{const l=amLast(id);if(l){done++;if(l[1])ok++}});return {done,ok,n:s.ids.length}}

/* ---------- word workshop ---------- */
/* stages 1..6 = the next review after 20 minutes (same day), 1, 3, 7, 14 and 30 days; stage 7 = learned */
const WINT=[0,20*60e3,DAY,3*DAY,7*DAY,14*DAY,30*DAY],WMAST=7;
const WTASKN={he2en:'עברית ← אנגלית',cloze:'השלמה במשפט',mc:'בחירה במשפט',hecl:'משפט בעברית',cloze2:'משפט חדש',en2he:'אנגלית ← עברית',write:'משפט חדש',first:'שליפה ראשונה',r2:'סיבוב שני',learn:'למידה',known:'ידעתי מראש'};
function amToast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}
function wLog(w,task,res,hint){(w.log=w.log||[]).push([amNow(),task,res,hint||0]);if(w.log.length>40)w.log.shift()}
function wKey(e){return String(e).toLowerCase().trim()}
const wK=w=>w.k||wK(w);
function wAdd(e,h,c,src,key){const k=key||wKey(e);if(!k)return;let w=AMS.w[k];if(!w&&S.screen==='amq'&&AQ){AQ.added=(AQ.added||[]).filter(x=>x!==k).concat(k);amSaveQ()}
  if(!w){const d=dictFind(e);w=AMS.w[k]={k,e:d?d.e:e,h:h||(d?d.h[0]:''),c:c||'',src:src||'',st:0,due:0,add:amNow(),ok:0,bad:0,t:amNow()}}
  else{if(h&&!w.h)w.h=h;if(c&&!w.c)w.c=c;w.t=amNow()}
  amSave();return w}
function wKnownDict(e){const d=dictFind(e);return d&&d.cards.every(isY)}
function wDue(){const now=amNow();return Object.values(AMS.w).filter(w=>w.st>=1&&w.st<WMAST&&w.due<=now).sort((a,b)=>a.due-b.due)}
function wNewToday(){return AMS.nd[dayKey()]||0}
/* the queue of words to learn: words she added from questions first, then dictionary cards marked ✗, then unmarked ones (easier levels first) */
function wQueue(n){const out=[],seen=new Set(Object.keys(AMS.w).filter(k=>AMS.w[k].st>0));
  Object.values(AMS.w).filter(w=>w.st===0).sort((a,b)=>(a.add||0)-(b.add||0)).forEach(w=>{if(out.length<n){out.push(w);seen.add(wK(w))}});
  for(const f of [isN,w=>!kst(w)]){if(out.length>=n)break;
    for(const w of DW){if(out.length>=n)break;const k='c:'+w.id;if(seen.has(k)||AMS.w[k]||AMS.w[wKey(w.e)]||!f(w))continue;seen.add(k);
      /* one card = one meaning: each meaning of a word is learned on its own */
      out.push({k,e:w.e,h:w.h[0],c:w.s||'',src:'dict:'+w.id,st:0,fresh:1})}}
  return out}
function wQueueCount(){const k=new Set(Object.keys(AMS.w));let n=Object.values(AMS.w).filter(w=>w.st===0).length;
  return n+DW.filter(w=>!isY(w)&&!k.has('c:'+w.id)&&!k.has(wKey(w.e))).length}
function wMaster(w){w.st=WMAST;w.due=0;
  if(w.src&&w.src.startsWith('dict:')){const c=W[w.src.slice(5)];if(c&&!isY(c))setKnow(c.id,'y');return}
  const d=dictFind(w.e);if(d)d.cards.forEach(c=>{if(!isY(c))setKnow(c.id,'y')})}
/* the dictionary card behind a workshop word (for its tip, notes, sentence and translation) */
function wCard(w){if(w.src&&w.src.startsWith('dict:'))return W[w.src.slice(5)]||null;const d=dictFind(w.e);if(!d)return null;return d.cards.find(c=>heMatch(c.h[0],w.h||''))||d.cards[0]}
/* 🧭 tips from the methods, for words where they really apply */
function wMethodTips(w){const out=[],e=String(w.e||'').toLowerCase().trim(),P=AMD&&AMD.px,L=AMD&&AMD.lists;if(!e)return out;
  for(const [he,k,ws,tip] of CONN)if(ws.includes(e)){out.push(['🔗','מילת קישור – '+he,tip+' בהשלמת משפטים ובניסוח מחדש מילה כזו היא בדרך כלל הרמז לתשובה.']);break}
  if(L&&L.conf){const it=L.conf.find(x=>x.e.toLowerCase()===e);if(it){const sib=L.conf.filter(x=>x.g===it.g&&x!==it);if(sib.length)out.push(['⚠️','מילים שקל לבלבל איתה',sib.map(x=>`<bdi>${esc(x.e)}</bdi> = ${esc(x.h)}`).join(' · ')+'. לתת לכל אחת אסוציאציה משלה.'])}}
  const pv=L&&(L.pv||[]).find(x=>x.e.toLowerCase()===e);
  if(pv||/^[a-z]+ (up|out|off|down|in|on|over|away|back|into|through|after|for|with|about|across|along|around|apart|forward)$/.test(e))out.push(['🧩','פועל מורכב','פועל + מילת יחס = יחידת משמעות אחת, ולפעמים שונה לגמרי מהחלקים. לא לתרגם מילה־מילה – לזכור את הצירוף כמילה אחת.']);
  else if(L&&(L.id||[]).some(x=>x.e.toLowerCase()===e))out.push(['💬','ביטוי','המשמעות של כל הצירוף יחד שונה מהמילים לחוד – לזכור אותו כיחידה אחת.']);
  if(P&&!e.includes(' ')){const PX=wPxMap();
    const base=b=>{for(const c of [b,b+'e',b.replace(/i$/,'y'),/(.)\1$/.test(b)?b.slice(0,-1):''])if(c&&c.length>=3&&DIX[c])return {e:c,h:[...new Set(DIX[c].map(x=>x.h[0]))].slice(0,2).join(' / ')};return null};
    let pre=null;for(const [t,h] of PX.pre){if(e.startsWith(t)&&e.length-t.length>=3){const b=base(e.slice(t.length));if(b&&b.e!==e){pre=`<bdi>${t}-</bdi> = ${esc(h)} &nbsp;+&nbsp; <bdi>${b.e}</bdi> = ${esc(b.h)}`;break}}}
    if(!pre)for(const E of P.pre)if(E.ex.some(([x])=>x.toLowerCase()===e)){pre=`מתחילה ב־<bdi>${esc(E.p)}-</bdi> = ${esc(wPxH(E.h))}`;break}
    if(pre)out.push(['🧬','פירוק המילה (תחילית)',pre+'. כך אפשר לנחש גם מילים שלא ראית.']);
    let suf=null;for(const [t,h] of PX.suf){if(e.endsWith(t)&&e.length-t.length>=3){const b=base(e.slice(0,-t.length));if(b&&b.e!==e){suf=`<bdi>${b.e}</bdi> = ${esc(b.h)} &nbsp;+&nbsp; <bdi>-${t}</bdi> = ${esc(h)}`;break}}}
    if(suf)out.push(['🧬','פירוק המילה (סופית)',suf+'.'])}
  const ai=AMAI['as|'+wK(w)];if(ai&&ai.method_tip)out.push(['🧭','טיפ מהשיטה',bdiEsc(ai.method_tip)]);
  return out}
/* prefixes / suffixes from the PDF (+ a few very common ones it lacks), longest first, meanings of a repeated one joined */
const wPxH=h=>String(h).replace(/\(.*$|\).*$/,'').replace(/\s+/g,' ').trim().replace(/[,;]$/,'');
let WPX=null;function wPxMap(){if(WPX)return WPX;const P=AMD.px,m={pre:{},suf:{}};
  const add=(k,t,h)=>{h=wPxH(h);if(!h)return;const o=m[k][t]=m[k][t]||[];if(!o.includes(h))o.push(h)};
  ['pre','suf'].forEach(k=>P[k].forEach(E=>E.p.toLowerCase().split(/[^a-z]+/).filter(t=>t.length>=2).forEach(t=>add(k,t,E.h))));
  add('pre','un','לא, ההיפך');add('suf','ful','מלא ב־');add('suf','ment','הופך פועל לשם עצם');add('suf','ness','הופך תואר לשם עצם');add('suf','ly','באופן…');
  const L=k=>Object.entries(m[k]).map(([t,h])=>[t,h.slice(0,2).join(' / ')]).sort((a,b)=>b[0].length-a[0].length);return WPX={pre:L('pre'),suf:L('suf')}}
function wMethodBox(w){const T=wMethodTips(w);return T.length?`<div class="am-box am-mtip"><h4>🧭 טיפ מהשיטה</h4>${T.map(([i,t,d])=>`<div class="am-rec"><span>${i}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div>`:''}
/* Hebrew answer check: does what she typed match one of the meanings? */
const heNorm=t=>String(t).replace(/[\u0591-\u05C7]/g,'').replace(/[^\u05D0-\u05EA ]/g,' ').replace(/\s+/g,' ').trim();
function heMatch(typed,h){const a=heNorm(typed);if(a.length<2)return false;const ms=String(h).split(/[·;,/()]| או /).map(heNorm).filter(x=>x.length>1);
  const strip=x=>x.replace(/^(ו|ה|ל|ב|מ|ש)(?=..)/,'');
  return ms.some(m=>{if(m===a||m.includes(a)&&a.length>=3||a.includes(m)&&m.length>=3)return true;
    const at=a.split(' ').map(strip),mt=m.split(' ').map(strip);return at.some(x=>x.length>=3&&mt.some(y=>y.length>=3&&(x===y||x.startsWith(y)||y.startsWith(x))))})}
function lev(a,b){a=a.toLowerCase();b=b.toLowerCase();const d=[...Array(b.length+1).keys()];
  for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]}
function blankOut(s,e){if(!s)return '';const st=e.toLowerCase().slice(0,Math.max(3,e.length-2)).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const r=new RegExp('\\b'+st+'[a-z]*','i');return r.test(s)?s.replace(r,m=>'_'.repeat(Math.max(4,m.length))):''}

/* ---------- Gemini helpers ---------- */
function aiNeedKey(){return GKEY()?'':'<p class="hint">כדי לקבל הסבר חכם צריך להפעיל את הבדיקה החכמה (מפתח ג׳מיני) בעמוד המשפטים.</p>'}
function aiWhyText(why){return {quota:'נגמרה המכסה החינמית של ג׳מיני להיום – אפשר לנסות שוב מחר.',busy:'ג׳מיני עמוס כרגע – נסי שוב עוד רגע.',timeout:'ג׳מיני לא ענה בזמן – נסי שוב.',key:'מפתח ג׳מיני לא תקין.',mixed:'התשובה הגיעה משובשת – נסי שוב.'}[why]||('לא הצלחתי לקבל תשובה ('+(why||'שגיאה')+').')}
const AIP={};
async function aiCached(key,prompt,temp){if(AMAI[key]&&!AMAI[key].err)return AMAI[key];if(AIP[key])return AIP[key];
  AIP[key]=(async()=>{const r=await aiRun('','',null,{prompt,temp:temp??.3});delete AIP[key];
    if(r&&r.j){AMAI[key]={...r.j,mdl:r.mdl,t:amNow()};amAiSave();return AMAI[key]}return {err:aiWhyText(r&&r.why)}})();return AIP[key]}
function qText(q){const T=q.x&&AMD.x[q.x];
  return (T?'PASSAGE:\n'+T.l.map((l,i)=>l).join('\n')+'\n\n':'')+'QUESTION ('+AMTN[q.t]+'): '+q.q+'\n'+q.o.map((o,i)=>'('+(i+1)+') '+o).join('\n')+'\nCORRECT ANSWER: '+(typeof q.a==='string'?q.a:'('+q.a+')')+
    (q.he?'\nHebrew translation (from the course book): '+q.he:'')+(q.oh&&q.oh.length?'\nBook notes per option: '+q.oh.map((o,i)=>'('+(i+1)+') '+o).join(' | '):'')+(q.ex?'\nBook explanation: '+q.ex:'')}
const AIHE='Write in simple, everyday Hebrew, using only regular Hebrew letters (English words may appear in Latin letters). Be short and concrete. Answer ONLY with JSON.';
function promptMethod(q){return `You are an expert Israeli psychometric-exam English teacher. Explain to a Hebrew-speaking student, step by step, how to solve this ${q.t==='yb'?'basic English':q.t==='sc'?'Sentence Completion':q.t==='rs'?'Restatement':'Reading Comprehension'} question using the course method.
${q.t==='yb'?'This is a basic English exercise ('+(q.ch||'')+'). Explain which grammar or vocabulary point it tests and why the correct answer fits.':q.t==='sc'?'Method: 1) read the sentence and translate it in your head WITHOUT looking at the options, 2) find the clue (a connector like but/although/because, a word that the blank must agree with or contrast with), 3) predict the missing word in Hebrew, 4) only then look for an option with that meaning, 5) re-read the full sentence.':q.t==='rs'?'Method: 1) translate the original and find its structure: who/what, what is said, and the relation between the parts (connector: contrast / cause / result / addition / time / condition), 2) eliminate options: added information, changed relation (different connector family), exaggeration (always/never/all), contradiction, reversed cause and effect, missing essential information, 3) check the last option fully.':'Method: identify the question type (main idea / paragraph / detail / function of a detail / inference / vocabulary / refer to), locate the exact sentence in the passage (by line or keywords), read it fully, predict the answer, then eliminate distractors typical for that type.'}
${qText(q)}
JSON: {"steps":["3-5 short steps in Hebrew, each naming exactly what to notice in THIS question (quote the clue English words)"],"options":["one short Hebrew line per option (4 lines, in order): what it means and why it is right or wrong"],"rule":"one short general rule in Hebrew to remember for similar questions"}
${AIHE}`}
function promptWhy(q,choice,why,note){return `You are an expert, warm Israeli psychometric-exam English teacher. A Hebrew-speaking student answered this question wrong. Diagnose WHY, specifically, and teach her how not to fall into it again.
${qText(q)}
STUDENT CHOSE: (${choice}) ${q.o[choice-1]}
Her own reasons: ${why.map(k=>(WHY.find(w=>w[0]===k)||[,k])[1]).join('; ')||'(none given)'}${note?'\nHer note: '+note:''}
JSON: {"title":"a 3-6 word Hebrew name for the type of mistake (e.g. 'פספוס מילת ניגוד', 'מסיח שמצטט את הקטע')","why_wrong":"2-3 Hebrew sentences: what exactly makes her choice wrong (quote the English words)","why_right":"1-2 Hebrew sentences: why the correct answer is right","method":"which step of the solving method would have prevented this, and how to apply it to this exact question","rule":"one short rule to remember","words":[{"en":"a key English word from the question or options that she probably did not know","he":"its Hebrew meaning here"}]}
Give at most 5 words. ${AIHE}`}
function promptAssoc(w,old){return `Create memory associations (mnemonics) for a Hebrew-speaking student who does not know English, for the English word "${w.e}" meaning "${w.h}" (Hebrew).
Use the keyword method: take a Hebrew word, name, loanword common in spoken Hebrew, or famous brand that SOUNDS like the English word or its first syllables, and build a vivid, specific, slightly absurd or emotional mini-scene (1-2 sentences, present tense, talking to her as "את") in which that sound-alike is directly connected to the meaning. It must be unique and surprising, easy to picture, and the meaning must be impossible to miss. No other English words.
${old&&old.length?'Do NOT repeat these earlier ideas: '+old.join(' | '):''}
Also, ONLY if it truly applies to this word, add "method_tip": one short Hebrew line based on English word structure or the psychometric course methods – e.g. a known prefix/suffix/root that explains the meaning, a family word she may know, a connector type (contrast/cause…), a common confusion with a similar-looking word, or a typical exam context. Otherwise "".
JSON: {"method_tip":"","ideas":[{"sound":"the sound-alike in Hebrew letters and which part of the English word it matches, e.g. 'אבנדון ← abandon'","scene":"the scene in Hebrew","link":"one short line: «${w.e}» נשמע כמו ... ← ..."},{...},{...}]} – exactly 3 different ideas. ${AIHE}`}
function promptSent(w,t){return `A Hebrew-speaking English learner wrote a sentence to practise the word "${w.e}" (meaning: ${w.h}).
Sentence: «${t}»
Check grammar and spelling, and whether "${w.e}" (any grammatical form counts) is used correctly in that meaning, in a natural context.
JSON: {"ok":true if the sentence is correct and uses the word correctly,"word_ok":true or false,"fixes":["each needed change as one short Hebrew line: 'X ← Y – why'"],"corrected":"the corrected sentence (or the same)","hebrew":"Hebrew translation of the corrected sentence","tip":"if word_ok is false: one Hebrew line on how the word is really used + a short correct example; else empty"}
${AIHE}`}

/* ---------- styles ---------- */
(function(){const st=document.createElement('style');st.textContent=`
.am-hero{background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 60%,#000));color:var(--accent-ink);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:10px}
.am-hero h2{margin:0;font-size:1.3rem}.am-hero p{margin:0;opacity:.92;font-size:.95rem;line-height:1.5}
.am-plan{display:flex;flex-direction:column;gap:8px}
.am-step{display:flex;align-items:center;gap:12px;background:color-mix(in srgb,var(--accent-ink) 14%,transparent);border:0;border-radius:12px;padding:10px 12px;color:inherit;text-align:right;cursor:pointer;font:inherit;width:100%}
.am-step .n{flex:none;width:30px;height:30px;border-radius:50%;background:var(--accent-ink);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:800}
.am-step .tx{flex:1}.am-step b{display:block}.am-step small{opacity:.85}
.am-step.done{opacity:.6}.am-step.done .n{background:transparent;color:var(--accent-ink);border:2px solid var(--accent-ink)}
.am-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.am-tile{background:var(--surface);border:1.5px solid var(--line);border-radius:14px;padding:14px;text-align:right;cursor:pointer;display:flex;flex-direction:column;gap:4px;font:inherit;color:var(--ink);min-height:96px}
.am-tile .i{font-size:1.4rem}.am-tile b{font-size:1.02rem}.am-tile small{color:var(--muted);font-size:.85rem;line-height:1.35}
.am-units{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.am-unit{border:1.5px solid var(--line);background:var(--bg);border-radius:12px;min-height:58px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:inherit;color:var(--ink)}
.am-unit b{font-size:1.05rem}.am-unit small{font-size:.75rem;color:var(--muted)}
.am-unit.full{background:var(--ok-soft);border-color:var(--ok)}.am-unit.part{border-color:var(--accent)}.am-unit.mist small{color:var(--bad);font-weight:700}
.am-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:.9rem;color:var(--muted)}
.am-chip{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:3px 10px;font-size:.82rem;font-weight:700;background:var(--surface);color:var(--ink)}
.am-chip.t{background:var(--accent-soft);color:var(--accent)}.am-chip.bad{background:var(--bad-soft);color:var(--bad)}.am-chip.ok{background:var(--ok-soft);color:var(--ok)}
.am-timer{margin-inline-start:auto;font-variant-numeric:tabular-nums;font-weight:700}.am-timer.over{color:var(--bad)}
.am-q{font-family:var(--en);direction:ltr;text-align:left;font-size:1.18rem;line-height:1.6;background:var(--surface);border-radius:14px;padding:14px 16px}
.am-q .blank{display:inline-block;min-width:3.2em;border-bottom:2px solid var(--accent)}
.tw{cursor:pointer;border-radius:4px}.tw:hover,.tw.on{background:var(--accent-soft)}
.cn{border-radius:4px;padding:0 2px;font-weight:700}.cn-contrast{background:#f6d7c4;color:#7a3511}.cn-cause,.cn-result{background:#d8e9d2;color:#2f5a23}.cn-addition,.cn-example{background:#d6e4f5;color:#204a7c}.cn-time,.cn-condition,.cn-compare{background:#eadcf3;color:#5a2d78}.cn-neg{background:#f6e7a6;color:#6a5100}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .cn{filter:brightness(.85) saturate(1.2)}}
.am-step-box{border:1.5px dashed var(--accent);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;background:var(--accent-soft)}
.am-step-box h4{margin:0;color:var(--accent);font-size:.98rem}
.am-step-box p{margin:0;line-height:1.55}
.am-in{width:100%;border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;font:inherit;font-size:1.02rem;background:var(--bg);color:var(--ink)}
.am-in:focus{border-color:var(--accent);outline:none}.am-in.en{font-family:var(--en);direction:ltr;text-align:left}
textarea.am-in{resize:vertical;min-height:70px}
.am-opts{display:flex;flex-direction:column;gap:10px}
.am-opt{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;direction:ltr;border:2px solid var(--line);background:var(--bg);border-radius:14px;padding:12px 14px;font-family:var(--en);font-size:1.06rem;line-height:1.45;cursor:pointer;color:var(--ink)}
.am-opt .k{flex:none;font-weight:700;color:var(--muted)}
.am-opt.sel{border-color:var(--accent);background:var(--accent-soft)}
.am-opt.right{border-color:var(--ok);background:var(--ok-soft);border-width:3px}
.am-opt.wrong{border-color:var(--bad);background:var(--bad-soft)}
.am-opt.elim{opacity:.45;text-decoration:line-through}
.am-opt .he{display:block;direction:rtl;text-align:right;font-family:var(--he);font-size:.95rem;color:var(--muted);margin-top:4px;line-height:1.5}
.am-opt.right .he{color:var(--ok)}
.am-orow{display:flex;flex-direction:column;gap:4px}.am-oline{display:flex;gap:6px;align-items:center}.am-oline .am-opt{flex:1;min-width:0}
.spk.sm{width:34px;height:34px}.spk.sm svg{width:16px;height:16px}.spk.inl{width:28px;height:28px;vertical-align:middle;margin-inline-end:6px;float:left}.spk.inl svg{width:14px;height:14px}
.am-qw{position:relative}.am-qw .am-q{padding-right:52px}.spk.corner{position:absolute;right:8px;bottom:8px;width:36px;height:36px}.spk.corner svg{width:17px;height:17px}
.am-intro{background:var(--accent-soft);border-radius:14px;padding:10px 14px;line-height:1.55;font-size:.95rem;margin:0}.am-intro b{color:var(--accent)}
.am-elim{display:flex;gap:5px;direction:rtl;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.am-elim::-webkit-scrollbar{display:none}
.am-elim button{flex:none;border:1px solid var(--line);background:var(--bg);border-radius:999px;padding:2px 8px;font:inherit;font-size:.74rem;cursor:pointer;color:var(--muted);white-space:nowrap}
.am-elim button[aria-pressed="true"]{background:var(--bad-soft);color:var(--bad);border-color:var(--bad)}
.am-fb{font-size:1.25rem;font-weight:800;text-align:center}.am-fb.ok{color:var(--ok)}.am-fb.bad{color:var(--bad)}
.am-box{border:1.5px solid var(--line);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;background:var(--bg)}
.am-box h4{margin:0;font-size:1rem}.am-box p{margin:0;line-height:1.6}
.am-box ol,.am-box ul{margin:0;padding-inline-start:20px;display:flex;flex-direction:column;gap:5px;line-height:1.55}
.am-box.why{border-color:var(--bad);background:var(--bad-soft)}.am-box.why h4{color:var(--bad)}
.am-box.good{border-color:var(--ok);background:var(--ok-soft)}.am-box.good h4{color:var(--ok)}
.am-box .exl{white-space:pre-line;line-height:1.65}
.am-why{display:flex;flex-wrap:wrap;gap:6px}
.am-why button{border:1.5px solid var(--line);background:var(--bg);border-radius:999px;padding:6px 12px;font:inherit;font-size:.9rem;cursor:pointer;color:var(--ink)}
.am-why button[aria-pressed="true"]{background:var(--bad);border-color:var(--bad);color:#fff}
.am-words{display:flex;flex-direction:column;gap:6px}
.am-wrow{display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding:6px 0}
.am-wrow .e{font-family:var(--en);font-weight:700;direction:ltr}.am-wrow .h{flex:1;color:var(--muted);font-size:.93rem}
.am-wrow button{flex:none;border:1.5px solid var(--accent);background:var(--bg);color:var(--accent);border-radius:999px;padding:4px 10px;font:inherit;font-size:.85rem;cursor:pointer;font-weight:700}
.am-wrow button.in{border-color:var(--ok);color:var(--ok);background:var(--ok-soft)}
.am-pass{font-family:var(--en);direction:ltr;text-align:left;line-height:1.7;font-size:1.02rem;background:var(--surface);border-radius:14px;padding:12px 14px;max-height:46vh;overflow:auto;-webkit-overflow-scrolling:touch}.am-pass p{margin:0 0 .7em}.am-pass p:last-child{margin:0}.am-pass .lnm{font-family:var(--he);font-size:.68rem;color:var(--accent);font-weight:800;background:var(--accent-soft);border-radius:6px;padding:0 4px;margin-inline-end:3px;vertical-align:.35em}
.am-pass .ln{display:flex;gap:8px}.am-pass .ln i{flex:none;width:30px;text-align:right;color:var(--muted);font-style:normal;font-size:.78rem;padding-top:.3em}
.am-pass .pg{height:.7em}
.am-pass.big{max-height:none}
.am-nav{display:flex;gap:10px}.am-nav .btn{flex:1}
.am-pop{position:fixed;inset-inline:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:60;background:var(--bg);border:1.5px solid var(--accent);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:12px 14px;display:flex;flex-direction:column;gap:8px;max-width:560px;margin:0 auto}
.am-pop .e{font-family:var(--en);font-size:1.3rem;font-weight:700;direction:ltr;display:flex;align-items:center;gap:8px}
.am-pop .row{display:flex;gap:8px}.am-pop .row .btn{min-height:44px;font-size:1rem}
.am-card{background:var(--surface);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:12px;align-items:stretch}
.am-card .w{font-family:var(--en);font-size:2rem;font-weight:700;direction:ltr;text-align:center;display:flex;justify-content:center;align-items:center;gap:10px}
.am-card .m{font-size:1.25rem;text-align:center;font-weight:700}
.am-card .ctx{font-family:var(--en);direction:ltr;text-align:left;color:var(--muted);line-height:1.5}
.am-hints{display:flex;flex-direction:column;gap:6px}
.am-hint{border-inline-start:4px solid var(--accent);background:var(--bg);border-radius:10px;padding:8px 12px;line-height:1.55}
.am-idea{border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--bg);display:flex;flex-direction:column;gap:6px;cursor:pointer;text-align:right;font:inherit;color:var(--ink)}
.am-idea.on{border-color:var(--ok);background:var(--ok-soft)}
.am-idea small{color:var(--muted)}
.am-prog{height:8px;border-radius:99px;background:var(--surface);overflow:hidden}.am-prog i{display:block;height:100%;background:var(--accent);border-radius:99px}
.am-stage{display:flex;gap:4px;justify-content:center}.am-stage i{width:18px;height:6px;border-radius:9px;background:var(--line)}.am-stage i.on{background:var(--ok)}
.am-m h3{margin:.2em 0}.am-m details{border:1.5px solid var(--line);border-radius:14px;padding:10px 14px;background:var(--bg)}
.am-m summary{font-weight:800;cursor:pointer;font-size:1.05rem}.am-m details[open] summary{margin-bottom:8px}
.am-m p,.am-m li{line-height:1.65}.am-m ol,.am-m ul{padding-inline-start:20px;margin:.3em 0}
.am-m table{border-collapse:collapse;width:100%;font-size:.92rem}.am-m td,.am-m th{border:1px solid var(--line);padding:6px;vertical-align:top}.am-m td.en{font-family:var(--en);direction:ltr;text-align:left}
.am-res{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.am-res li button{width:100%;display:flex;gap:10px;align-items:center;border:1.5px solid var(--line);background:var(--bg);border-radius:12px;padding:10px 12px;text-align:left;direction:ltr;font-family:var(--en);cursor:pointer;color:var(--ink)}
.am-res li button .s{flex:none;font-family:var(--he);font-weight:800}.am-res li button .tx{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.am-res li.ok .s{color:var(--ok)}.am-res li.bad .s{color:var(--bad)}
.am-big{font-size:2.2rem;font-weight:800;text-align:center}
.am-load{padding:40px 0;text-align:center;color:var(--muted)}
.st-screen{min-height:calc(100dvh - 60px)}.st-screen h1{font-size:1.6rem}
.st-app{width:100%;border:0;border-radius:22px;padding:26px 22px;min-height:170px;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:6px;text-align:right;cursor:pointer;font:inherit;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.12)}
.st-app:active{transform:scale(.985)}.st-i{font-size:2.4rem;line-height:1}.st-t{font-size:1.5rem;font-weight:800}.st-d{font-size:.95rem;opacity:.92;line-height:1.4}
.st-dict{background:linear-gradient(135deg,#24548a,#163659)}.st-am{background:linear-gradient(135deg,#a4482f,#6d2b1b)}
/* ---- modern look (אמירנט + chooser) ---- */
:root{--cq:#3563e9;--cw:#7c4dff;--cm:#e5484d;--cs:#12a594;--cp:#e8890c;--card:#fff;--sh:0 1px 2px rgba(16,24,40,.06),0 6px 18px rgba(16,24,40,.07)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--card:#1c2026;--sh:0 1px 2px rgba(0,0,0,.4)}}
:root[data-theme="dark"]{--card:#1c2026;--sh:0 1px 2px rgba(0,0,0,.4)}
.st-screen .st-app{border-radius:28px;min-height:190px;position:relative;overflow:hidden;box-shadow:0 12px 30px rgba(30,40,80,.18)}
.st-screen .st-app::after{content:"";position:absolute;inset-inline-start:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.12)}
.st-dict{background:linear-gradient(140deg,#3563e9,#1e3a8a)!important}.st-am{background:linear-gradient(140deg,#7c4dff,#c2410c)!important}
.am-info{font-family:Georgia,serif;font-style:italic;font-weight:800;font-size:1.15rem;color:var(--accent)}
.am-scr{gap:14px}
.am-scr .nav{margin-bottom:2px}
.am-hero2{border-radius:28px;padding:18px;color:#fff;background:radial-gradient(120% 140% at 100% 0%,#7c4dff 0%,#3563e9 55%,#1e3a8a 100%);box-shadow:0 14px 34px rgba(53,99,233,.28);display:flex;flex-direction:column;gap:14px}
.hr-top{display:flex;gap:14px;align-items:center}.hr-top h2{margin:2px 0;font-size:1.25rem;color:#fff}.hr-k{margin:0;font-size:.8rem;opacity:.85;font-weight:700;letter-spacing:.02em}.hr-d{margin:0;opacity:.9;font-size:.92rem}
.am-ring{width:76px;height:76px;flex:none}.am-ring .bg{fill:none;stroke:rgba(255,255,255,.22);stroke-width:8}.am-ring .fg{fill:none;stroke:#fff;stroke-width:8;stroke-linecap:round;transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset .6s}.am-ring text{fill:#fff;font-weight:800;font-size:17px;font-family:var(--he)}
.am-go{border:0;border-radius:18px;min-height:56px;font:inherit;font-weight:800;font-size:1.12rem;background:#fff;color:#2a3fb0;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)}
.hr-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.hr-s{border:0;border-radius:14px;padding:8px 4px;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:.74rem;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer}.hr-s span{font-size:1.15rem}.hr-s.done{opacity:.6}
.am-gates{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.am-gate{position:relative;border:0;border-radius:24px;padding:16px;min-height:128px;text-align:right;display:flex;flex-direction:column;gap:4px;cursor:pointer;font:inherit;color:var(--ink);background:var(--card);box-shadow:var(--sh)}
.am-gate b{font-size:1.1rem;margin-top:6px}.am-gate small{color:var(--muted);font-size:.85rem}
.gi{width:46px;height:46px;border-radius:15px;display:inline-flex;align-items:center;justify-content:center;font-size:1.4rem;flex:none;background:var(--surface)}
.g-q .gi,.gi.g-q{background:color-mix(in srgb,var(--cq) 16%,transparent)}.g-w .gi,.gi.g-w{background:color-mix(in srgb,var(--cw) 16%,transparent)}.g-m .gi,.gi.g-m{background:color-mix(in srgb,var(--cm) 16%,transparent)}.g-s .gi,.gi.g-s{background:color-mix(in srgb,var(--cs) 16%,transparent)}.g-p .gi,.gi.g-p{background:color-mix(in srgb,var(--cp) 18%,transparent);font-family:Georgia,serif;font-style:italic;font-weight:800;color:var(--cp)}
.gb{position:absolute;top:12px;left:12px;min-width:26px;height:26px;padding:0 8px;border-radius:999px;background:var(--cm);color:#fff;font-size:.8rem;font-weight:800;display:inline-flex;align-items:center;justify-content:center}
.g-w .gb{background:var(--cw)}.g-q .gb{background:var(--cq)}
.am-row2{display:flex;gap:8px;flex-wrap:wrap}.am-pill{flex:1;border:0;border-radius:999px;min-height:46px;padding:0 14px;background:var(--card);box-shadow:var(--sh);font:inherit;font-weight:700;color:var(--ink);cursor:pointer;white-space:nowrap}.am-pill.sm{flex:none;min-height:34px;font-size:.85rem;padding:0 12px}
.am-resume{display:flex;align-items:center;gap:12px;border:0;border-radius:20px;padding:12px 16px;background:var(--card);box-shadow:var(--sh);font:inherit;color:var(--ink);text-align:right;cursor:pointer}.am-resume>span:first-child{font-size:1.3rem}.am-resume b{display:block}.am-resume small{color:var(--muted)}
.am-title{display:flex;gap:12px;align-items:center}.am-title h2{margin:0;font-size:1.35rem}.am-title p{margin:2px 0 0;color:var(--muted);font-size:.92rem;line-height:1.45}
.am-card2{position:relative;width:100%;display:flex;align-items:center;gap:12px;border:0;border-radius:20px;padding:14px;background:var(--card);box-shadow:var(--sh);font:inherit;color:var(--ink);text-align:right;cursor:pointer}
.am-card2 .grow{display:flex;flex-direction:column;gap:3px;min-width:0}.am-card2 b{font-size:1.05rem}.am-card2 small{color:var(--muted);font-size:.86rem;line-height:1.4}
.am-card2 .gb{position:static;margin-inline-start:auto}.am-card2:disabled{opacity:.55;cursor:default}
.am-card2:active,.am-gate:active,.am-pill:active,.am-go:active{transform:scale(.985)}
.am-mini{display:block;height:6px;border-radius:9px;background:var(--surface);overflow:hidden;margin:3px 0}.am-mini i{display:block;height:100%;background:var(--cq);border-radius:9px}
.am-scr .am-box{border:0;background:var(--card);box-shadow:var(--sh);border-radius:20px;padding:14px 16px}
.am-scr .am-box.why{background:color-mix(in srgb,var(--cm) 9%,var(--card))}.am-scr .am-box.good{background:color-mix(in srgb,var(--cs) 10%,var(--card))}
.am-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.am-tabs::-webkit-scrollbar{display:none}
.am-tabs button{flex:none;border:0;border-radius:999px;padding:8px 14px;background:var(--card);box-shadow:var(--sh);font:inherit;font-weight:700;color:var(--muted);cursor:pointer}.am-tabs button small{opacity:.75}
.am-tabs button[aria-pressed="true"]{background:var(--cw);color:#fff}
.am-wl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.am-wl button{width:100%;display:grid;grid-template-columns:1fr auto;grid-template-areas:"e m" "h h";gap:2px 8px;border:0;border-radius:16px;padding:10px 14px;background:var(--card);box-shadow:var(--sh);font:inherit;color:var(--ink);text-align:right;cursor:pointer}
.am-wl .e{grid-area:e;font-family:var(--en);font-weight:700;font-size:1.08rem;text-align:left}.am-wl .h{grid-area:h;color:var(--muted);font-size:.9rem}.am-wl .m{grid-area:m;font-size:.8rem;color:var(--muted);white-space:nowrap}
.am-dots{letter-spacing:1px;color:var(--cw)}
.am-empty{text-align:center;color:var(--muted);padding:26px 10px;margin:0}
.am-wordhead{background:linear-gradient(150deg,color-mix(in srgb,var(--cw) 18%,var(--card)),var(--card));border-radius:24px;padding:18px;box-shadow:var(--sh);display:flex;flex-direction:column;gap:10px}
.am-wordhead .w{display:flex;justify-content:center;align-items:center;gap:10px;font-family:var(--en);font-size:2rem;font-weight:700}.am-wordhead .m{text-align:center;font-size:1.2rem;font-weight:700}
.am-track{display:flex;justify-content:space-between;gap:2px}.am-track span{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:.66rem;color:var(--muted)}.am-track i{width:100%;height:6px;border-radius:9px;background:var(--line)}.am-track .done i{background:var(--cs)}.am-track .on i{background:var(--cw)}.am-track .on{color:var(--cw);font-weight:800}
.am-rec{display:flex;gap:10px;align-items:flex-start;padding:6px 0}.am-rec>span{font-size:1.3rem}.am-rec b{display:block}.am-rec p{margin:2px 0 0;color:var(--muted);line-height:1.5}
.am-log{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}.am-log li{display:flex;align-items:center;gap:8px;font-size:.92rem}.am-log li>span{width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;flex:none;color:#fff}.am-log li.ok>span{background:var(--cs)}.am-log li.bad>span{background:var(--cm)}.am-log li.mid>span{background:var(--cp)}.am-log small{color:var(--muted);margin-inline-start:auto}
.am-cta{position:sticky;bottom:0;z-index:5;display:flex;gap:10px;padding:10px 0 calc(6px + env(safe-area-inset-bottom,0px));background:linear-gradient(to top,var(--bg) 70%,transparent)}.am-cta .btn{flex:1;width:auto;min-width:0;min-height:54px;border-radius:16px}.am-cta .btn.secondary{flex:0 1 auto;min-width:64px;max-width:40%;padding-inline:14px}
.am-verdict{display:flex;align-items:center;gap:10px;border-radius:18px;padding:12px 16px;font-size:1.1rem}.am-verdict>span{width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:900;flex:none}.am-verdict small{margin-inline-start:auto;font-size:.82rem;opacity:.85}
.am-verdict.ok{background:color-mix(in srgb,var(--cs) 14%,transparent);color:var(--ok)}.am-verdict.ok>span{background:var(--cs)}.am-verdict.bad{background:color-mix(in srgb,var(--cm) 12%,transparent);color:var(--bad)}.am-verdict.bad>span{background:var(--cm)}
.am-vs{display:grid;grid-template-columns:1fr 1fr;gap:8px}.am-vs div{border-radius:16px;padding:10px 12px;font-family:var(--en);display:flex;flex-direction:column;gap:2px}.am-vs small{font-family:var(--he);font-weight:800;font-size:.75rem}.am-vs .bad{background:color-mix(in srgb,var(--cm) 12%,transparent)}.am-vs .ok{background:color-mix(in srgb,var(--cs) 14%,transparent)}
.am-steps3{display:flex;gap:6px}.am-steps3 span{flex:1;text-align:center;padding:6px;border-radius:999px;background:var(--surface);font-size:.82rem;font-weight:700;color:var(--muted)}.am-steps3 span:empty{display:none}.am-steps3 .on{background:var(--cq);color:#fff}.am-steps3 .done{background:color-mix(in srgb,var(--cs) 18%,transparent);color:var(--ok)}
.am-tag{display:inline-block;margin:0;padding:3px 10px;border-radius:999px;background:var(--cm);color:#fff;font-weight:800;font-size:.85rem}
.am-lesson{border-top:1px solid var(--line);padding:8px 0;display:flex;flex-direction:column;gap:6px}.am-lesson:first-of-type{border-top:0}.am-lesson p{margin:0;line-height:1.55}
.am-stat{display:grid;grid-template-columns:1fr 70px auto;align-items:center;gap:4px 8px;padding:6px 0}.am-stat small{grid-column:1/-1;color:var(--muted)}
.am-bars{display:flex;gap:6px;align-items:flex-end;justify-content:space-between}.am-bars>div{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}.am-bars span{width:100%;max-width:30px;border-radius:8px 8px 3px 3px;background:var(--cw)}.am-bars span.ok{background:var(--cs)}.am-bars b{font-size:.85rem}.am-bars small{font-size:.66rem;color:var(--muted);text-align:center}
.he-opt{direction:rtl;text-align:right;font-family:var(--he)}
.am-help ul,.am-help ol{padding-inline-start:20px}.am-help li{margin:4px 0}
.am-scr .am-step-box{border:0;background:color-mix(in srgb,var(--cq) 9%,var(--card));box-shadow:var(--sh);border-radius:20px}
.am-scr .am-q{border-radius:20px}
body:has(.am-cta) .totop{bottom:calc(84px + env(safe-area-inset-bottom,0px))}
.am-ex{display:flex;flex-direction:column;gap:3px;margin-top:6px;padding-top:6px;border-top:1px dashed var(--line);font-size:.82rem;line-height:1.45;color:var(--ink);font-weight:500}
.am-ex .to{color:var(--accent);font-weight:700}.am-ex .fx{display:flex;flex-direction:column;color:var(--muted)}
.am-gate .am-ex{font-size:.78rem}
.am-exb{margin:0;padding:8px 12px;border-radius:14px;background:color-mix(in srgb,var(--cp) 11%,var(--card));font-size:.86rem;line-height:1.5;color:var(--ink)}
.am-exbox{display:flex;flex-direction:column;gap:5px;padding:12px 14px;border-radius:18px;background:color-mix(in srgb,var(--cp) 11%,var(--card));font-size:.88rem;line-height:1.5}
.am-extog{font-size:1.05rem}.am-extog.on{background:color-mix(in srgb,var(--cp) 25%,var(--surface))}
.am-pghelp{display:flex;flex-direction:column;gap:8px}.am-pghelp summary{font-weight:800;cursor:pointer;color:var(--cp)}.am-pghelp details[open] summary{margin-bottom:6px}
.am-hrow{display:flex;justify-content:space-between;gap:8px;width:100%;border:0;border-top:1px solid var(--line);background:none;padding:9px 0;font:inherit;color:var(--ink);cursor:pointer;text-align:right}.am-hrow small{color:var(--muted)}
.tw.db{text-decoration:underline dotted color-mix(in srgb,var(--cw) 70%,transparent);text-underline-offset:4px;text-decoration-thickness:2px}
.am-gap{display:inline-block;min-width:3.5em;border-bottom:3px solid var(--cw);color:var(--cw);font-weight:800;text-align:center}
.am-path{display:flex;gap:4px}.am-path span{flex:1;text-align:center;padding:6px 2px;border-radius:999px;background:var(--surface);font-size:.78rem;font-weight:700;color:var(--muted)}.am-path .on{background:var(--cw);color:#fff}.am-path .done{background:color-mix(in srgb,var(--cs) 18%,transparent);color:var(--ok)}
.am-next{display:flex;flex-wrap:wrap;gap:4px}.am-next span{padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--cw) 14%,var(--card));font-size:.8rem;font-weight:700}
.am-topic{background:var(--card);box-shadow:var(--sh);border-radius:20px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.am-topic .tt{display:flex;align-items:center;gap:10px}.am-topic .tt b{font-size:1.08rem}.am-topic .tt small{margin-inline-start:auto;color:var(--ok);font-weight:700}
.am-topic .tb{display:flex;gap:8px}.am-topic .am-pill{background:var(--surface);box-shadow:none;font-size:.92rem}
.st-x{font-size:.84rem;opacity:.92;line-height:1.45;margin-top:4px;max-width:92%}
.am-card2[aria-disabled="true"]{opacity:.6}
.st-screen .home-head .home-btn{flex:none}


@media (max-width:420px){.am-units{grid-template-columns:repeat(4,1fr);gap:6px}.am-q{font-size:1.08rem;padding:12px}.am-opt{font-size:1rem;padding:10px 12px}.am-grid{gap:8px}.am-tile{padding:12px}}
`;document.head.appendChild(st)})();

/* ---------- shared UI pieces ---------- */
const AMHK={start:'overview',home:'dict',am:'daily',amqh:'questions',amu:'questions',amq:'flow',amx:'mistakes',amls:'lessons',amw:'words',amwl:'learn',amwm:'mywords',amwd:'mywords',amh:'context',amrd:'reader',aml:'basics',amm:'methods',ammt:'methods',amp:'progress'};
const INFOB=k=>`<button class="home-btn am-info" data-help="${k||AMHK[S.screen]||''}" aria-label="מידע והסברים">i</button>`;
let AMEX=LS.get('dictAmEx')!=='0';
/* what a button does, where it leads, and what is inside */
const EX=(does,to,fx)=>AMEX?`<span class="am-ex"><span>${does}</span>${fx&&fx.length?`<span class="fx">${fx.map(f=>`<span>• ${f}</span>`).join('')}</span>`:''}</span>`:'';
const EXB=(t)=>AMEX?`<p class="am-exb">💬 ${t}</p>`:'';
const EXTOG=()=>`<button class="home-btn am-extog${AMEX?' on':''}" data-extog="1" aria-label="${AMEX?'הסתרת ההסברים':'הצגת הסברים ליד כל כפתור'}">💬</button>`;
const amNav=(back,label)=>`<div class="nav"><button class="back" id="bk" data-go="${back}">${label}</button>${HOME}${EXTOG()}${INFOB()}</div>`;
document.addEventListener('click',e=>{const t=e.target.closest('[data-extog]');if(!t)return;e.preventDefault();AMEX=!AMEX;LS.set('dictAmEx',AMEX?'1':'0');
  const y=window.scrollY;draw();window.scrollTo(0,y);const d=document.createElement('div');d.className='toast';d.textContent=AMEX?'💬 ההסברים מוצגים ליד כל כפתור':'ההסברים הוסתרו · 💬 כדי להחזיר';document.body.appendChild(d);setTimeout(()=>d.remove(),2200)});
document.addEventListener('click',e=>{const h=e.target.closest('[data-help]');if(!h)return;e.preventDefault();
  if(S.screen==='amq'&&AQ)amSaveQ();if(S.screen==='amwl')wSave();go({screen:'amhelp',hk:h.dataset.help,hfrom:S.screen==='amhelp'?S.hfrom:S.screen})});
function amBindNav(){const b=$('bk');if(b)b.onclick=()=>go({screen:b.dataset.go})}
/* the house inside the אמירנט section: back to its own main screen (from there, to the app chooser) */
function amGoHome(){if(S.screen==='amq'&&AQ){if(AQ.mode==='exam'&&AQ.i<AQ.ids.length)AQ.paused=amNow();amSaveQ();clearInterval(AMTICK)}if(S.screen==='amwl')wSave();go({screen:S.screen==='am'?'start':'am'})}
function amLoading(){app.innerHTML=`<div class="screen">${amNav('start','בחירת אפליקציה')}<p class="am-load">⏳ טוען את שאלות האמירנט…</p></div>`;amBindNav();
  amLoad().then(()=>draw()).catch(()=>{app.innerHTML=`<div class="screen">${amNav('start','בחירת אפליקציה')}<p class="am-load">לא הצלחתי לטעון את השאלות – בדקי את החיבור ונסי שוב.</p><button class="btn" id="amRe">לנסות שוב</button></div>`;amBindNav();$('amRe').onclick=()=>draw()})}
/* tap any English word → its meaning + add to the workshop */
let AMPOP=null;
function amPop(e,ctx,src){AMPOP={e,ctx,src,h:null};amPopDraw();amTrans(e).then(r=>{if(AMPOP&&AMPOP.e===e){AMPOP.h=r;amPopDraw()}})}
function amPopDraw(){let el=$('amPop');if(!AMPOP){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='amPop';el.className='am-pop';document.body.appendChild(el)}
  const k=wKey(AMPOP.e),inW=AMS.w[k],d=dictFind(AMPOP.e);
  el.innerHTML=`<div class="e"><button class="spk" data-amsay="${esc(d?d.e:AMPOP.e)}" aria-label="השמעה">${SPK}</button>${esc(AMPOP.e)}${d&&d.e.toLowerCase()!==AMPOP.e.toLowerCase()?` <small style="font-size:.8rem;color:var(--muted)">(${esc(d.e)})</small>`:''}</div>
    <div>${AMPOP.h?(AMPOP.h.h?esc(AMPOP.h.h)+` <small style="color:var(--muted)">· ${esc(AMPOP.h.src)}</small>`:'לא נמצא תרגום'):'⏳ מחפשת פירוש…'}${d&&d.cards.every(isY)?' · <b style="color:var(--ok)">✓ סימנת שאת יודעת</b>':''}</div>
    <div class="row"><button class="btn${inW?' secondary':''}" id="popAdd">${inW?'✓ בסדנת המילים':'➕ ללמוד את המילה'}</button><button class="btn secondary" id="popX">סגירה</button></div>`;
    $('popX').onclick=()=>{AMPOP=null;amPopDraw()};
  $('popAdd').onclick=()=>{if(!inW){const cq=AQ&&AQ.cur&&AMD&&AMD.q[AQ.cur];wAdd(d?d.e:AMPOP.e,AMPOP.h&&AMPOP.h.src!=='המילון שלך'?AMPOP.h.h:'',AMPOP.ctx||(cq&&cq.x?amSentenceWith(cq,AMPOP.e):''),AMPOP.src||(AQ&&AQ.cur)||'');amPopDraw();const r=document.querySelector('.am-wordsbox');if(r)r.outerHTML=amWordsBox(AQ&&AQ.cur)}}}
document.addEventListener('click',e=>{const t=e.target.closest('[data-tw]');if(t){e.preventDefault();document.querySelectorAll('.tw.on').forEach(x=>x.classList.remove('on'));t.classList.add('on');
  const box=t.closest('[data-ctx]');amPop(t.dataset.tw,box?box.dataset.ctx:'',box?box.dataset.src:'');return}
  const s=e.target.closest('[data-amsay]');if(s){e.preventDefault();amSay(s.dataset.amsay)}});

/* ================= hub ================= */
function amPlan(){const due=wDue().length,newLeft=Math.max(0,(AMS.n||8)-wNewToday()),mist=Object.keys(AMD.q).filter(amMistDue).length;
  const next=amNextSet();return {due,newLeft,mist,next}}
function amNextSet(){/* the first unit (alternating types in book order) that is not finished */
  const order=[];for(let u=1;u<=20;u++)['sc','rs','rc'].forEach(t=>order.push(AMD.s.find(s=>amCourse(s)&&s.t===t&&s.u===u)));
  return order.find(s=>s&&amSetStat(s).done<s.ids.length)||null}
function amSteps(){const P=amPlan();return [
  {k:'rev',i:'🔁',t:'חזרה פעילה',on:P.due>0,d:P.due?P.due+' מילים מחכות':'אין עכשיו'},
  {k:'new',i:'🌱',t:'מילים חדשות',on:P.newLeft>0,d:P.newLeft?'עוד '+P.newLeft+' היום':'סיימת להיום'},
  {k:'next',i:'✏️',t:'תרגול שאלות',on:!!P.next&&!amDidQToday(),d:P.next?AMTN[P.next.t]+' · יח׳ '+P.next.u:'הכול נפתר'}]}
/* practised questions today (the questions step counts as done after 8 questions today) */
function amDidQToday(){const k=dayKey();let n=0;for(const id in AMS.a){const h=AMS.a[id].h||[];for(const r of h)if(dayKey(r[3])===k)n++}return n>=8}
function amRunStep(k){const P=amPlan();if(k==='rev')wStart('rev');else if(k==='new')wStart('new');else if(k==='mist')amStartMist();else if(k==='next'&&P.next)amStart(P.next.ids,AMTN[P.next.t]+' · יחידה '+P.next.u,'learn','am',P.next.t)}
function amRing(done,n){const r=30,c=2*Math.PI*r,f=n?done/n:0;return `<svg class="am-ring" viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="${r}" class="bg"/><circle cx="38" cy="38" r="${r}" class="fg" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-f)}"/><text x="38" y="44" text-anchor="middle">${done}/${n}</text></svg>`}
function amHub(){if(!AMD)return amLoading();
  const st=amSteps(),done=st.filter(x=>!x.on).length,next=st.find(x=>x.on);
  const allW=Object.values(AMS.w),mistAll=Object.keys(AMD.q).filter(amIsMist).length,due=wDue().length;
  const gate=(cls,i,t,d,go,badge,ex)=>`<button class="am-gate ${cls}" data-go="${go}"><span class="gi">${i}</span><b>${t}</b><small>${d}</small>${ex||''}${badge?`<span class="gb">${badge}</span>`:''}</button>`;
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('start','בחירת אפליקציה')}
    ${AQ&&AQ.ids&&AQ.i<AQ.ids.length&&!AQ.fin?`<button class="am-resume" id="amRes"><span>⏸</span><span class="grow"><b>להמשיך מאיפה שעצרת</b><small>${esc(AQ.name)} · שאלה ${AQ.i+1}/${AQ.ids.length}</small></span></button>`:''}
    <section class="am-hero2">
      <div class="hr-top">${amRing(done,st.length)}<div><p class="hr-k">הסבב של היום</p><h2>${next?'הצעד הבא: '+next.t:'סיימת את הסבב 🎉'}</h2><p class="hr-d">${next?next.d:'אפשר לתרגל עוד – או לנוח'}</p></div></div>
      ${next?`<button class="am-go" id="amNextStep">▶ להמשיך${AMEX?` <small style="font-weight:600;font-size:.82rem">(${next.t})</small>`:''}</button>`:''}
      <div class="hr-steps">${st.map((x,j)=>`<button class="hr-s${x.on?'':' done'}" data-step="${x.k}"><span>${x.on?x.i:'✓'}</span>${x.t}</button>`).join('')}</div>
    </section>

    <div class="am-gates">
      ${gate('g-q','✏️','שאלות','תרגול לפי השיטה','amqh','',EX('כל שאלות המבחן מהספרים, שאלה אחרי שאלה לפי השיטה.','בחירת סוג: השלמת משפטים, ניסוח מחדש, הבנת הנקרא, סימולציה, יסודות'))}
      ${gate('g-w','🧠','מילים','ללמוד ולזכור',  'amw',due?due+' לחזרה':'',EX('כל הלמידה של המילים: חזרות, מילים חדשות וניהול המילים שלך.','חזרה פעילה, מילים חדשות, המילים שלי, ניחוש מהקשר, מקראה'))}
      ${gate('g-p','📊','ההתקדמות שלי','מה כבר עשית','amp','',EX('אחוזי הצלחה, זמנים, מילים לפי שלב וחזרות לשבוע הקרוב.'))}
      ${gate('g-s','🧭','שיטות','איך פותרים','amm','',EX('השיטות מהספרים – איך פותרים כל סוג שאלה.','רשימת נושאים, כל נושא בעמוד משלו'))}
    </div>
    <div class="am-row2"><button class="am-pill" data-help="all">📖 כל ההסברים</button></div>
    ${EXB('📖 <b>כל ההסברים</b> – כל הפונקציות ותהליך הלמידה בעמוד אחד. · למעלה: <b>i</b> = הסבר על המסך הזה, <b>💬</b> = הצגה / הסתרה של ההסברים האלה.')}
  </div>`;
  amBindNav();const rs=$('amRes');if(rs)rs.onclick=amResume;
  const ns=$('amNextStep');if(ns)ns.onclick=()=>amRunStep(next.k);
  app.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>amRunStep(b.dataset.step));
  app.querySelectorAll('[data-go]').forEach(b=>{if(b.id==='bk')return;b.onclick=()=>go({screen:b.dataset.go})})}
/* the practice hub: the question types, simulation and basics */
function amQHub(){if(!AMD)return amLoading();
  const XQ={sc:EX('משפט באנגלית עם מילה חסרה ו־4 מילים לבחירה. קודם מנחשים לבד בעברית, ורק אז רואים תשובות.','רשת של יחידות – בוחרים יחידה ומתחילים'),
    rs:EX('משפט אחד ו־4 משפטים שמנסים לומר אותו דבר. פוסלים תשובות עם סיבה (מידע נוסף, הקצנה…).','רשת של יחידות'),
    rc:EX('קטע קריאה ו־5 שאלות עליו. לכל שאלה מופיע סוג השאלה והטכניקה לפתור אותה.','רשת של יחידות'),
    yb:EX('תרגילים קצרים מהספר "יסודות אנגלית" ורשימות מילים לכל נושא.','רשימת נושאים: תרגיל + רשימת מילים לכל נושא')};
  const row=(t,cls,i,title,d)=>{const ss=AMD.s.filter(s=>s.t===t);let dn=0,n=0,ok=0;ss.forEach(x=>{const y=amSetStat(x);dn+=y.done;n+=y.n;ok+=y.ok});
    return `<button class="am-card2 ${cls}" data-t="${t}"><span class="gi">${i}</span><span class="grow"><b>${title}</b><small>${d}</small><span class="am-mini"><i style="width:${n?dn/n*100:0}%"></i></span><small>${dn}/${n} נפתרו${dn?' · '+Math.round(ok/dn*100)+'% נכון':''}</small>${XQ[t]||''}</span></button>`};
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('am','אמירנט')}
    <div class="am-title"><span class="gi g-q">✏️</span><div><h2>תרגול שאלות</h2><p>בחרי סוג – כל שאלה עוברת לפי השיטה, צעד אחר צעד.</p></div></div>
    ${row('sc','g-q','✏️','השלמת משפטים','משפט עם מילה חסרה')}
    ${row('rs','g-q','🔁','ניסוח מחדש','איזה משפט אומר אותו דבר')}
    ${row('rc','g-q','📖','הבנת הנקרא','קטע ו־5 שאלות')}
    <button class="am-card2 g-p" data-t="ex"><span class="gi">⏱</span><span class="grow"><b>סימולציה</b><small>פרק שלם: 22 שאלות ב־20 דקות, בלי עזרה</small>${EX('כמו המבחן האמיתי: שעון שרץ, בלי רמזים ובלי הסברים עד הסוף. בסוף – ציון, זמן לכל סוג, וכל טעות פתוחה לחקירה.','בחירת פרק: 4 פרקים אמיתיים + 20 מהקורס')}</span></button>
    <button class="am-card2 g-m" data-go2="amls"><span class="gi">📝</span><span class="grow"><b>הלקחים שלי</b><small>${Object.keys(AMS.ls||{}).length||'עוד אין'} כללים שלמדת מטעויות</small>${EX('כל לקח ששמרת בחקירת טעות, מקובץ לפי סוג הטעות. טוב לקרוא לפני סימולציה.')}</span></button>
  </div>`;
  amBindNav();app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>go({screen:'amu',amt:b.dataset.t}));app.querySelectorAll('[data-go2]').forEach(b=>b.onclick=()=>go({screen:b.dataset.go2}))}
function amTypeLine(t){const ss=AMD.s.filter(s=>s.t===t);let d=0,n=0,ok=0;ss.forEach(s=>{const x=amSetStat(s);d+=x.done;n+=x.n;ok+=x.ok});return d?`${d}/${n} · ${Math.round(ok/d*100)}% נכון`:`${n} שאלות`}

/* ================= units of one type ================= */
const AMHOW={sc:'משפט באנגלית עם מילה חסרה, ו־4 מילים לבחירה. השיטה: קודם מבינים את המשפט ומנחשים בעברית – ורק אז מסתכלים על התשובות.',
  rs:'משפט אחד, ו־4 משפטים שמנסים לומר אותו דבר במילים אחרות. השיטה: מבינים את המבנה ומילות הקישור, ופוסלים תשובות (מידע נוסף, קשר אחר, הקצנה).',
  rc:'קטע קריאה ו־5 שאלות עליו. השיטה: מזהים את סוג השאלה, מאתרים את המשפט הרלוונטי בקטע וקוראים רק אותו לעומק.',
  yb:'תרגילים קצרים מהספר "יסודות אנגלית", עם התשובות מהספר. ליד כל נושא יש גם רשימת מילים להוספה לסדנה.'};
function amUnits(){if(!AMD)return amLoading();const t=S.amt||'sc';
  if(t==='ex')return amExams();
  if(t==='yb')return amBasics();
  const ss=AMD.s.filter(s=>s.t===t&&!s.b),bs=AMD.s.filter(s=>s.t===t&&s.b);
  const ub=s=>{const x=amSetStat(s),m=s.ids.filter(amIsMist).length;return `<button class="am-unit${x.done===x.n?' full':x.done?' part':''}${m?' mist':''}" data-s="${s.id}"><b>${s.u}</b><small>${m?m+' לתיקון':x.done?x.ok+'/'+x.n+' נכון':x.n+' שאלות'}</small></button>`};
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('amqh','תרגול שאלות')}
    <div class="am-title"><span class="gi g-q">${AMTI[t]}</span><div><h2>${AMTN[t]}</h2><p>${amTypeLine(t)} · במבחן: ${t==='sc'?'חצי דקה לשאלה':t==='rs'?'דקה לשאלה':'6 דקות לקטע'}</p></div></div>
    <p class="am-intro"><b>מה זה?</b> ${AMHOW[t]}</p>
    <button class="am-card2 g-s" data-m="${t}"><span class="gi">🧭</span><span class="grow"><b>השיטה לסוג הזה</b><small>לקרוא לפני שמתחילים</small>${EX('ההסבר המלא מהספר: איך פותרים את סוג השאלה הזה צעד אחר צעד.','עמוד השיטה')}</span></button>
    <div class="am-box"><h4>הקורס – 20 יחידות</h4>${EXB('כל ריבוע = יחידה. לחיצה מתחילה את השאלות שלה (8 / 4 / 10). <b>כחול</b> = התחלת, <b>ירוק</b> = סיימת (המספר = כמה נכון), <b>אדום</b> = יש שאלות לתיקון.')}<div class="am-units">${ss.map(ub).join('')}</div></div>
    ${bs.length?`<div class="am-box"><h4>ספר "חזרות וניהול זמנים" – 4 פרקים</h4>${EXB('שאלות מפרקים אמיתיים של המבחן, מאותו סוג.')}<div class="am-units">${bs.map(ub).join('')}</div></div>`:''}
    ${EXB('בתוך שאלה: לחיצה על מילה באנגלית = פירוש והוספה ללמידה · 🔊 = השמעה · מילים צבועות = מילות קישור.')}
  </div>`;
  amBindNav();
  app.querySelector('[data-m]').onclick=()=>go({screen:'ammt',amTab:t});
  app.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{const s=AMD.s.find(x=>x.id===b.dataset.s);amStart(s.ids,AMTN[t]+(s.b?' · ניהול זמנים פרק ':' · יחידה ')+s.u,'learn','amu',t)})}
function amExams(){const cell=(u,b)=>{const r=AMS.ex&&AMS.ex[(b?'b':'')+u];return `<button class="am-unit${r?' full':''}" data-u="${u}" data-b="${b?1:''}"><b>${u}</b><small>${r?r.ok+'/22':'22 שאלות'}</small></button>`};
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('amqh','תרגול שאלות')}
    <div class="am-title"><span class="gi g-p">⏱</span><div><h2>סימולציה</h2><p>22 שאלות ב־20 דקות, כמו במבחן</p></div></div>
    <p class="am-intro"><b>מה קורה בסימולציה?</b> שעון של 20 דקות רץ למעלה. אין שלב "חושבים לפני", אין רמזים ואין הסברים בזמן הפתרון – בוחרים ועוברים (אפשר לדלג ולחזור). בסוף: ציון, זמן ממוצע לכל סוג שאלה מול היעד, ולחיצה על כל שאלה פותחת את ההסבר וחקירת הטעות.</p>
    <div class="am-box"><h4>פרקים אמיתיים מהספר "חזרות וניהול זמנים"</h4>${EXB('הכי קרוב למבחן האמיתי. ירוק = עשית (המספר = הציון).')}<div class="am-units">${[1,2,3,4].map(u=>cell(u,1)).join('')}</div></div>
    <div class="am-box"><h4>מהקורס</h4>${EXB('סימולציה n = יחידה n של השלמת משפטים + ניסוח מחדש + הבנת הנקרא.')}<div class="am-units">${Array.from({length:20},(_,i)=>cell(i+1,0)).join('')}</div></div>
    ${EXB('מתי? אחרי שתרגלת יחידות לפי השיטה. כדאי לשמור כמה סימולציות לשבועות האחרונים לפני המבחן.')}
  </div>`;
  amBindNav();app.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{const u=+b.dataset.u,bb=!!b.dataset.b;amStart(amExamIds(u,bb),(bb?'סימולציה · ניהול זמנים פרק ':'סימולציה ')+u,'exam','amu','ex',u,bb)})}
const LNAME={wh:'מילות שאלה',pro:'כינויי גוף',conf:'מילים מבלבלות',pv:'פעלים מורכבים',id:'ביטויים',conj:'מילות קישור'};
function amBasics(){const ss=AMD.s.filter(s=>s.t==='yb');
  const TI={wh:'❓',pro:'👤',conf:'🔀',pv:'🧩',id:'💬',conj:'🔗'};
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('amqh','תרגול שאלות')}
    <div class="am-title"><span class="gi g-s">🧱</span><div><h2>יסודות</h2><p>מהספר "יסודות אנגלית" – 6 נושאים</p></div></div>
    <p class="am-intro"><b>מה יש כאן?</b> לכל נושא שני כפתורים: <b>✏️ תרגיל</b> – שאלות מהספר עם התשובות של הספר (בחירה או כתיבה). <b>📋 רשימה</b> – כל המילים של הנושא עם תרגום והשמעה, ואפשר להוסיף אותן ללמידה.</p>
    ${ss.map(s=>{const x=amSetStat(s),k=s.id.slice(1),L=(AMD.lists||{})[k]||[];
      return `<div class="am-topic"><div class="tt"><span class="gi g-s">${TI[k]||'🧱'}</span><b>${esc(s.u)}</b>${x.done?`<small>${x.ok}/${x.n} נכון</small>`:''}</div>
        <div class="tb"><button class="am-pill" data-s="${s.id}">✏️ תרגיל · ${x.n} שאלות</button>${L.length>3?`<button class="am-pill" data-l="${k}">📋 רשימה · ${L.length}</button>`:''}</div></div>`}).join('')}
  </div>`;
  amBindNav();
  app.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{const s=AMD.s.find(x=>x.id===b.dataset.s);amStart(s.ids,'יסודות · '+s.u,'learn','amu','yb')});
  app.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>go({screen:'aml',aml:b.dataset.l}))}
function amList(){if(!AMD)return amLoading();const k=S.aml,L=(AMD.lists||{})[k]||[];
  const notIn=L.filter(x=>!AMS.w[wKey(x.e)]&&!wKnownDict(x.e)).length;let g=null;
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('amu','יסודות')}
    <div class="am-title"><span class="gi g-s">📋</span><div><h2>${esc(LNAME[k]||'')}</h2><p>${L.length} פריטים מהספר</p></div></div>
    ${EXB('🔊 = לשמוע את המילה · <b>➕ ללמוד</b> = המילה נכנסת ל"מילים חדשות" ותילמד שם לעומק (אסוציאציה, משפט, שליפה) · <b>✓ יודעת</b> = כבר סימנת אותה במילון.')}
    ${k==='conf'?'<p class="am-intro"><b>טיפ:</b> המילים מסודרות בקבוצות של מילים שנראות או נשמעות דומה. בסדנה – תני לכל אחת אסוציאציה משלה.</p>':''}
    ${notIn?`<button class="am-card2 g-w" id="lAll"><span class="gi">➕</span><span class="grow"><b>להוסיף את כל ${notIn} המילים ללמידה</b>${EX('כולן ייכנסו לתור של "מילים חדשות" (לפני מילים אחרות), ותלמדי כמה בכל יום.','')}</span></button>`:''}
    <div class="am-box"><div class="am-words">${L.map(x=>{const sep=k==='conf'&&x.g!==g;g=x.g;return (sep?'<div style="height:6px;border-top:2px solid var(--line)"></div>':'')+amWordRow(x.e,x.h,'list:'+k)+(x.s?`<p class="hint" dir="ltr" style="margin:-2px 0 4px;text-align:left;font-family:var(--en)">${SAYB(x.s,'sm inl')}${esc(x.s)}</p>`:'')}).join('')}</div></div>
  </div>`;
  amBindNav();
  app.querySelectorAll('[data-wadd]').forEach(b=>b.onclick=()=>{const e=b.dataset.wadd,x=L.find(y=>y.e===e);if(AMS.w[wKey(e)])return;wAdd(e,x&&x.h,x&&x.s,'list:'+k);b.classList.add('in');b.textContent='✓ בסדנה'});
  const la=$('lAll');if(la)la.onclick=()=>{L.forEach(x=>{if(!AMS.w[wKey(x.e)]&&!wKnownDict(x.e))wAdd(x.e,x.h,x.s,'list:'+k)});draw()}}

/* ================= 🧩 context guessing: Hebrew sentence with a gap ================= */
let HC=null;
function hcNext(){const ids=Object.keys(AMD.q).filter(id=>AMD.q[id].hc),seen=AMS.hc||{};
  const fresh=ids.filter(id=>!seen[id]),pool=fresh.length?fresh:ids;const id=pool[Math.floor(Math.random()*pool.length)];HC={id,ans:'',res:null};}
function amHc(){if(!AMD)return amLoading();if(!HC||!AMD.q[HC.id])hcNext();const q=AMD.q[HC.id],r=HC.res,ws=q.o[q.a-1],d=dictFind(ws),x=d?EXTRA[d.cards[0].id]||{}:{};
  const n=Object.keys(AMS.hc||{}).length,tot=Object.values(AMD.q).filter(z=>z.hc).length,good=Object.values(AMS.hc||{}).filter(v=>v[0]).length;
  const full=q.q.replace(/_{3,}/g,ws);const asK='as|'+wKey(ws),ai=AMAI[asK];
  app.innerHTML=`<div class="screen">
    ${amNav('amw','מילים')}
    <div><h2>🧩 ניחוש מהקשר</h2><p class="sub">${n}/${tot} משפטים · ${good} פגיעות</p></div>
    ${!r?`<p class="am-intro"><b>מה עושים?</b> קראי את המשפט בעברית ותחשבי איזו מילה הכי מתאימה במקום החסר. זה בדיוק השלב הראשון בשיטה של השלמת משפטים – לנחש מההקשר לפני שרואים תשובות.</p>`:''}
    <div class="am-card"><div class="m" style="font-weight:600;line-height:1.7">${esc(q.hc).replace('_____','<span style="display:inline-block;min-width:4em;border-bottom:3px solid var(--accent)">'+(r?'<b style="color:var(--ok)">'+esc(q.hw)+'</b>':'&nbsp;')+'</span>')}</div></div>
    ${!r?`<input class="am-in" id="hcIn" placeholder="המילה שלדעתי מתאימה" autocomplete="off" value="${esc(HC.ans)}"><button class="btn" id="hcGo">בדיקה</button>${EXB('כותבים מילה אחת בעברית שמתאימה לדעתך למקום הריק ← <b>בדיקה</b>. אם המילה שונה מזו שבספר, תשאלי את עצמך אם גם היא מתאימה. "לא יודעת" מראה את התשובה.')}<button class="link" id="hcSkip" style="align-self:center">לא יודעת – להראות</button>`:`
    ${r.self?`<p class="center" style="margin:0">כתבת «${esc(HC.ans)}». המילה בספר: <b>${esc(q.hw)}</b>. גם התשובה שלך מתאימה להקשר?</p><div class="am-nav"><button class="btn" id="hcY">✓ כן, מתאימה</button><button class="btn secondary" id="hcN">✗ לא ממש</button></div>`:`<p class="am-fb ${r.ok?'ok':'bad'}">${r.ok?'קלעת להקשר! ✓':HC.ans?'המילה בספר: '+esc(q.hw):'המילה החסרה: '+esc(q.hw)}</p>`}
    <div class="am-box good"><h4>באנגלית</h4><p dir="ltr" style="text-align:left;font-family:var(--en);font-size:1.08rem">${SAYB(full,'sm inl')}${esc(full).replace(esc(ws),'<b>'+esc(ws)+'</b>')}</p>
      <div class="am-words">${amWordRow(ws,q.oh[q.a-1],HC.id)}</div></div>
    <div class="am-box"><h4>💡 אסוציאציה למילה ${esc(ws)}</h4>
      ${x.tip?`<p>${bdiEsc(x.tip)}</p>`:''}
      ${ai&&ai.ideas?ai.ideas.slice(0,2).map(i=>`<p>• ${bdiEsc(i.scene)} <small class="hint">${bdiEsc(i.link||'')}</small></p>`).join(''):''}
      ${ai&&ai.err?`<p class="hint">${esc(ai.err)}</p>`:''}
      ${AIP[asK]?'<p class="hint">⏳ ממציאה אסוציאציה…</p>':!(ai&&ai.ideas)&&GKEY()?`<button class="btn secondary" id="hcAs">✨ אסוציאציה שתעזור לזכור</button>`:''}
      ${!x.tip&&!GKEY()?aiNeedKey():''}</div>
    <button class="btn" id="hcNext">המשפט הבא ←</button>
    <button class="link" id="hcQ" style="align-self:center">לפתור את השאלה המלאה באנגלית</button>`}
  </div>`;
  amBindNav();
  const inp=$('hcIn');if(inp){setTimeout(()=>{try{inp.focus({preventScroll:true})}catch(e){}},50);inp.oninput=()=>HC.ans=inp.value;inp.onkeydown=e=>{if(e.key==='Enter')$('hcGo').click()}}
  const fin=ok=>{AMS.hc=AMS.hc||{};AMS.hc[HC.id]=[ok?1:0,amNow()];amSave()};
  const g=$('hcGo');if(g)g.onclick=()=>{const v=(HC.ans||'').trim();if(!v)return;const ok=heMatch(v,q.hw)||heMatch(v,q.oh[q.a-1]);HC.res=ok?{ok:true}:{self:true};if(ok)fin(true);draw()};
  const sk=$('hcSkip');if(sk)sk.onclick=()=>{HC.ans='';HC.res={ok:false};fin(false);draw()};
  const y=$('hcY');if(y)y.onclick=()=>{HC.res={ok:true};fin(true);draw()};
  const nn=$('hcN');if(nn)nn.onclick=()=>{HC.res={ok:false};fin(false);draw()};
  const as=$('hcAs');if(as)as.onclick=()=>{const p=aiCached(asK,promptAssoc({e:ws,h:q.oh[q.a-1]},[]),1);amRedrawKeep();p.then(()=>{if(S.screen==='amh')amRedrawKeep()})};
  const nx=$('hcNext');if(nx)nx.onclick=()=>{hcNext();draw();window.scrollTo(0,0)};
  const qq=$('hcQ');if(qq)qq.onclick=()=>amStart([HC.id],'ניחוש מהקשר · השאלה המלאה','learn','amh','sc');
  amBindWordBtns(HC.id)}

/* ================= 📗 reader ================= */
function amReader(){if(!AMD)return amLoading();const R=AMD.rd||[],read=AMS.rd||{};
  if(S.amrd){const T=R.find(x=>x.n===S.amrd);if(T)return amReadText(T)}
  app.innerHTML=`<div class="screen">
    ${amNav('amw','מילים')}
    <div><h2>📗 מקראה</h2><p class="sub">${R.length} קטעים קצרים מהספר "יסודות אנגלית" · קראת ${Object.keys(read).length}</p></div>
    <p class="am-intro"><b>מה זה?</b> קריאה רגועה בלי שאלות: קוראים, שומעים (🔊), לוחצים על מילה לא מוכרת לפירוש, ובסוף מציצים בתרגום. ככה אוצר המילים גדל מתוך הקשר.</p>
    <div class="am-units">${R.map(x=>`<button class="am-unit${read[x.n]?' full':''}" data-n="${x.n}"><b>${x.n}</b><small>${read[x.n]?'✓ נקרא':'קטע'}</small></button>`).join('')}</div>
  </div>`;
  amBindNav();app.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{S.amrd=+b.dataset.n;persist();draw();window.scrollTo(0,0)})}
function amReadText(T){const read=AMS.rd||{};
  app.innerHTML=`<div class="screen">
    <div class="nav"><button class="back" id="bk">כל הקטעים</button>${HOME}${EXTOG()}${INFOB()}</div>
    <div><h2>📗 קטע ${T.n}</h2><p class="sub">🔊 ליד כל פסקה · לחיצה על מילה = פירוש והוספה לסדנה</p></div>
    <div class="am-pass big" data-ctx="" data-src="rd${T.n}">${T.en.map(p=>`<p>${SAYB(p,'sm inl')}${tapEn(p)}</p>`).join('')}</div>
    <details class="am-box"><summary style="font-weight:800;cursor:pointer">התרגום לעברית</summary>${T.he.map(p=>`<p>${esc(p)}</p>`).join('')}</details>
    ${EXB('🔊 ליד כל פסקה = הקראה · לחיצה על מילה = פירוש + ➕ ללמידה · "התרגום לעברית" נפתח בלחיצה · הכפתור למטה מסמן שקראת ועובר לקטע הבא.')}
    <button class="btn" id="rdDone">${read[T.n]?'✓ קראתי · לקטע הבא':'סיימתי לקרוא ✓ · לקטע הבא'}</button>
  </div>`;
  $('bk').onclick=()=>{S.amrd=0;persist();draw()};
  $('rdDone').onclick=()=>{AMS.rd=AMS.rd||{};AMS.rd[T.n]=amNow();amSave();const R=AMD.rd,i=R.findIndex(x=>x.n===T.n);S.amrd=R[i+1]?R[i+1].n:0;persist();draw();window.scrollTo(0,0)}}

/* ================= a practice session ================= */
let AQ=null;
function amStart(ids,name,mode,from,t,u,b){AQ={ids:ids.slice(),i:0,name,mode,from,t,u,b,st:{},t0:amNow(),limit:mode==='exam'?20*60e3:0};
  /* go on from the first question not answered in this session */
  amSaveQ();go({screen:'amq'})}
function amResume(){if(AQ.paused){AQ.t0+=amNow()-AQ.paused;AQ.paused=0}aqSt().seen=amNow();amSaveQ();go({screen:'amq'})}
function amStartMist(){if(!AMD)return;const ids=Object.keys(AMD.q).filter(amMistDue);if(!ids.length)return;amStart(ids,'מחברת הטעויות · ניסיון חוזר','learn','amx','mist')}
function amSaveQ(){try{LS.set('dictAmQ',JSON.stringify(AQ))}catch(e){}}
try{AQ=JSON.parse(LS.get('dictAmQ')||'null')}catch(e){}
function aqSt(i){i=i??AQ.i;return AQ.st[i]=AQ.st[i]||{stage:'read',guess:'',sel:0,elim:{},done:false,ms:0,seen:amNow(),why:[],note:'',words:false,pass:true}}
let AMTICK=null;
function amQuiz(){TAPDB=false;if(!AMD)return amLoading();if(!AQ||!AQ.ids||!AQ.ids.length){go({screen:'am'});return}
  if(AQ.i>=AQ.ids.length)return amResult();
  const id=AQ.ids[AQ.i],q=AMD.q[id],st=aqSt(),exam=AQ.mode==='exam';AQ.cur=id;
  const T=q.x?AMD.x[q.x]:null;
  let h=`<div class="screen qz am-scr">
    <div class="nav"><button class="back" id="bk">${exam?'עצירה':'יציאה'}</button>${HOME}${EXTOG()}${INFOB()}</div>
    <div class="am-bar"><span class="am-chip t">${AMTI[q.t]} ${AMTN[q.t]}</span><span>${esc(AQ.name)}</span><span>· ${AQ.i+1}/${AQ.ids.length}</span><span class="am-timer" id="amTm"></span></div>
    <div class="am-prog"><i style="width:${(AQ.i)/AQ.ids.length*100}%"></i></div>`;
  /* passage */
  if(T&&!(st.done&&['why','words'].includes(st.fb))){let n=0,par=[],ps=[];T.l.forEach(l=>{if(!l){if(par.length)ps.push(par.join(' '));par=[];return}n++;par.push((n%5===0?`<sup class="lnm">${n}</sup>`:'')+tapEn(l))});if(par.length)ps.push(par.join(' '));
    const lines=ps.map((x,j)=>`<p>${SAYB(amParas(T)[j],'sm inl')}${x}</p>`).join('');
    h+=`<details class="am-box" ${st.pass?'open':''} id="amPassD"><summary style="font-weight:800;cursor:pointer">📖 הקטע <bdi>(Text ${q.x.endsWith('-1')?'I':'II'})</bdi></summary><div class="am-pass" data-ctx="" data-src="${q.x}">${lines}</div>${T.gl&&T.gl.length?`<p class="hint" style="margin:6px 0 0">בספר רשמת פירוש ל־${T.gl.length} מילים בקטע הזה – מופיעות ב״מילים מהשאלה״ אחרי הבדיקה.</p>`:''}</details>`}
  /* question */
  const cs=q.t!=='rc'?connFind(q.q):[];
  TAPDB=!exam;let qh=tapEn(q.q,st.stage!=='read'||q.t==='rs'||exam?cs:[]);TAPDB=false;if(q.t==='sc')qh=qh.replace(/_{3,}/g,'<span class="blank">&nbsp;</span>');
  h+=`<div class="am-qw">${q.ins&&!exam?`<p class="hint" style="margin:0 0 4px;direction:ltr;text-align:left">${esc(q.ins)} <small style="font-family:var(--he)">${q.ins.startsWith('Fill')?'(כתבי את התשובה)':'(בחרי את התשובה הנכונה)'}</small></p>`:''}<div class="am-q" data-ctx="${esc(q.q)}" data-src="${id}">${q.t==='rc'?'<b>'+(AQ.i+1)+'.</b> ':''}${qh}</div>${SAYB(q.q,'corner')}</div>`;
  /* step 1 – think before the options (learning mode) */
  if(q.t==='yb'&&st.stage==='read')st.stage='opts';
  if(!exam&&st.stage==='read'){
    if(q.t==='sc')h+=`<div class="am-step-box"><h4>שלב 1 · עוד בלי התשובות</h4><p>תרגמי את המשפט בראש. מה הרמז? איזו מילה (בעברית) הייתה משלימה אותו?</p>
      <input class="am-in" id="amGuess" placeholder="הניחוש שלי בעברית (לא חובה)" value="${esc(st.guess)}">
      ${cs.length?`<button class="link small-link" id="amHint" style="align-self:flex-start">💡 רמז: יש כאן מילת קישור</button><div id="amHintBox" hidden>${cs.map(c=>`<p>«<bdi>${c.ws.join(', ')}</bdi>» – <b>${c.he}</b>: ${c.tip}</p>`).join('')}</div>`:''}</div>`;
    else if(q.t==='rs')h+=`<div class="am-step-box"><h4>שלב 1 · להבין את המבנה</h4><p>${cs.length?cs.map(c=>`«<bdi>${c.ws.join(', ')}</bdi>» = <b>${c.he}</b>`).join(' · ')+' – הקשר הזה חייב להישמר בתשובה הנכונה.':'אין כאן מילת קישור בולטת – שימי לב מי עושה מה, למי, ומתי.'}</p><p>תרגמי לעצמך: על מי מדובר ומה נאמר עליו? אחר כך – פוסלים תשובות.</p></div>`;
    else {const k=rcType(q.q);h+=`<div class="am-step-box"><h4>שלב 1 · סוג השאלה: ${RCT[k][0]}</h4><p>${RCT[k][1]}</p></div>`}
    h+=`<button class="btn" id="amShow">${q.t==='rs'?'לתשובות – ולפסול':'הצגת התשובות'}</button>${EXB('הכפתור מציג את 4 התשובות. זה השלב החשוב בשיטה: קודם לחשוב לבד, ורק אז להסתכל. 🔊 ליד המשפט = השמעה · לחיצה על מילה = פירוש.')}`}
  else if(st.done&&!exam&&['why','meth','words'].includes(st.fb))h+=amFbPage(id,st);
  else{
    /* options */
    if(!st.done&&!exam)h+=EXB(q.t==='sc'||q.t==='yb'?'לוחצים על תשובה (היא נצבעת) ואז <b>בדיקה</b>. 🔊 ליד כל תשובה משמיע אותה.':'הכפתורים הקטנים ✗ מתחת לכל תשובה = לפסול אותה עם סיבה (מידע נוסף, קשר אחר, הקצנה, סותר, חסר) – לא חובה, אבל זה בדיוק מה שהשיטה מלמדת. אחר כך לוחצים על התשובה שנשארה ← <b>בדיקה</b>.');
    if(!q.o.length){h+=st.done?`<div class="am-box ${st.ok?'good':'why'}"><p>כתבת: <bdi dir="ltr">${esc(st.sel||'')}</bdi></p><p>התשובה: <b><bdi dir="ltr">${esc(q.a)}</bdi></b> ${SAYB(q.a,'sm inl')}</p></div>`:`<input class="am-in en" id="amTyped" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="התשובה באנגלית" value="${esc(typeof st.sel==='string'?st.sel:'')}">`}
    else h+=`<div class="am-opts">${q.o.map((o,j)=>{const k=j+1,cl=st.done?(k===q.a?' right':k===st.sel?' wrong':''):(k===st.sel?' sel':'')+(st.elim[k]?' elim':'');
      const he=st.done&&!exam&&q.oh&&q.oh[j]?`<span class="he">${esc(q.oh[j])}</span>`:'';
      const elim=!st.done&&!exam&&q.t!=='sc'?`<div class="am-elim">${(q.t==='rs'?[['add','מידע נוסף'],['rel','קשר אחר'],['ext','הקצנה'],['contra','סותר'],['miss','חסר']]:[['out','לא מהקטע'],['wrong','סותר את הקטע'],['nq','לא עונה לשאלה']]).map(([c,l])=>`<button data-el="${k}" data-r="${c}" aria-pressed="${st.elim[k]===c}">✗ ${l}</button>`).join('')}</div>`:'';
      return `<div class="am-orow"><div class="am-oline"><button class="am-opt${cl}" data-k="${k}" ${st.done?'disabled':''}><span class="k">(${k})</span><span>${esc(o)}${he}</span></button>${SAYB(o,'sm')}</div>${elim}</div>`}).join('')}</div>`;
    if(!st.done)h+=`<div class="am-cta"><button class="btn" id="amChk" ${st.sel?'':'disabled'}>${exam?(AQ.i+1<AQ.ids.length?'לשאלה הבאה':'סיום הסימולציה'):'בדיקה'}</button></div>${exam?`<div class="am-nav">${AQ.i?'<button class="btn secondary" id="amPrev">→ הקודמת</button>':''}<button class="btn secondary" id="amSkip">דילוג ←</button></div>`:''}`;
    else h+=amFeedback(id,st);
  }
  h+=`</div>`;app.innerHTML=h;
  /* binding */
  $('bk').onclick=()=>{if(exam)AQ.paused=amNow();amSaveQ();clearInterval(AMTICK);go({screen:AQ.from||'am'})};
  const g=$('amGuess');if(g)g.oninput=()=>{st.guess=g.value;amSaveQ()};
  const hb=$('amHint');if(hb)hb.onclick=()=>{$('amHintBox').hidden=false;hb.remove()};
  const sh=$('amShow');if(sh)sh.onclick=()=>{st.stage='opts';amSaveQ();draw()};
  const pd=$('amPassD');if(pd)pd.ontoggle=()=>{st.pass=pd.open;amSaveQ()};
  app.querySelectorAll('.am-opt[data-k]').forEach(b=>b.onclick=()=>{if(st.done)return;const k=+b.dataset.k;st.sel=k;if(st.elim[k])delete st.elim[k];amSaveQ();amRedrawKeep()});
  app.querySelectorAll('[data-el]').forEach(b=>b.onclick=()=>{const k=+b.dataset.el,r=b.dataset.r;st.elim[k]=st.elim[k]===r?undefined:r;if(!st.elim[k])delete st.elim[k];else if(st.sel===k)st.sel=0;amSaveQ();amRedrawKeep()});
  const ty=$('amTyped');if(ty){ty.oninput=()=>{st.sel=ty.value.trim();amSaveQ();const c=$('amChk');if(c)c.disabled=!st.sel};ty.onkeydown=e=>{if(e.key==='Enter')$('amChk')&&$('amChk').click()}}
  const ck=$('amChk');if(ck)ck.onclick=()=>{if(!st.sel)return;const ms=amNow()-st.seen;
    if(exam){st.ms=(st.ms||0)+ms;st.ans=st.sel;AQ.i++;amSaveQ();draw();window.scrollTo(0,0);return}
    st.done=true;st.ms=ms;st.ok=amRecord(id,st.sel,ms);amSaveQ();draw();
    setTimeout(()=>{const f=document.querySelector('.am-fb');if(f)f.scrollIntoView({behavior:'smooth',block:'start'})},60)};
  const sk=$('amSkip');if(sk)sk.onclick=()=>{st.ms=(st.ms||0)+amNow()-st.seen;AQ.i++;amSaveQ();draw();window.scrollTo(0,0)};
  const pv=$('amPrev');if(pv)pv.onclick=()=>{st.ms=(st.ms||0)+amNow()-st.seen;AQ.i--;aqSt().seen=amNow();amSaveQ();draw();window.scrollTo(0,0)};
  amBindFeedback(id,st);
  /* timer */
  clearInterval(AMTICK);const tm=()=>{const el=$('amTm');if(!el){clearInterval(AMTICK);return}
    if(exam){const left=AQ.limit-(amNow()-AQ.t0);if(left<=0){clearInterval(AMTICK);amFinishExam();return}const m=Math.floor(left/6e4),s=Math.floor(left%6e4/1e3);el.textContent='⏱ '+m+':'+String(s).padStart(2,'0');el.classList.toggle('over',left<120e3)}
    else if(!st.done){const s=Math.floor((amNow()-st.seen)/1e3),tg=AMTARGET[q.t];el.textContent='⏱ '+s+' שנ׳';el.classList.toggle('over',s>tg)}
    else{el.textContent='⏱ '+Math.round(st.ms/1e3)+' שנ׳';el.classList.toggle('over',st.ms/1e3>AMTARGET[q.t])}};
  tm();AMTICK=setInterval(tm,1000);
  fitWords(app)}
function amRedrawKeep(){const y=window.scrollY;draw();window.scrollTo(0,y)}
function amFinishExam(){AQ.i=AQ.ids.length;AQ.ids.forEach((id,i)=>{const s=AQ.st[i];if(s&&s.ans&&!s.rec){s.rec=1;s.sel=s.ans;s.done=true;s.ok=amRecord(id,s.ans,s.ms)}});
  if(AQ.u){const ok=AQ.ids.filter((id,i)=>AQ.st[i]&&AQ.st[i].ok).length;AMS.ex=AMS.ex||{};AMS.ex[(AQ.b?'b':'')+AQ.u]={ok,t:amNow(),ms:amNow()-AQ.t0};amSave()}
  amSaveQ();draw()}

/* after checking: right/wrong, book translation and explanation, method, why-I-was-wrong, words */
function amQWords(id){const q=AMD.q[id],rows=[],seen=new Set();
  const txt=[q.q.replace(/_{3,}/g,' '),...(q.o||[]),typeof q.a==='string'?q.a:''].join(' ');
  for(const m of txt.match(/[A-Za-z][A-Za-z'\-]*[A-Za-z]/g)||[]){const lw=m.toLowerCase();if(STOP.has(lw)||lw.length<3)continue;const d=dictFind(lw);if(!d||seen.has(d.e.toLowerCase()))continue;seen.add(d.e.toLowerCase());rows.push(d)}
  return rows}
function amDbStatus(d){if(d.cards.every(isY))return 'y';if(d.cards.some(c=>AMS.w['c:'+c.id])||AMS.w[wKey(d.e)])return 'w';return ''}
function amQPath(st,ok){const P=[['res','✓ תשובה'],...(ok?[]:[['why','🔍 חקירה']]),['meth','🧭 שיטה'],['words','📚 מילים']];const cur=st.fb||'res',ci=P.findIndex(x=>x[0]===cur);
  return `<div class="am-path">${P.map(([k,t],i)=>`<span class="${i<ci?'done':i===ci?'on':''}">${t}</span>`).join('')}</div>`}
function amFeedback(id,st){const q=AMD.q[id],ok=amIsOk(q,st.sel);
  let h=amQPath(st,ok)+`<div class="am-verdict ${ok?'ok':'bad'}"><span>${ok?'✓':'✗'}</span><b>${ok?'נכון!':typeof q.a==='string'?'לא נכון':'לא נכון – התשובה הנכונה: ('+q.a+')'}</b></div>`;
  if(q.t==='sc'&&q.he)h+=`<div class="am-box good"><h4>תרגום המשפט</h4><p>${esc(q.he)}</p></div>`;
  if(q.t==='rs'&&q.he)h+=`<div class="am-box"><h4>המשפט המקורי בעברית</h4><p>${esc(q.he)}</p><p class="hint" style="margin:0">ליד כל תשובה למעלה: התרגום שלה וההסבר מהספר.</p></div>`;
  h+=EXB(!ok?'הטעות מטופלת עכשיו, לא מחכה לאחר כך: הכפתור למטה ממשיך ל<b>חקירת הטעות</b>, אחריה <b>איך פותרים לפי השיטה</b>, ואז <b>המילים מהשאלה</b>.':'הכפתור למטה ממשיך ל<b>איך פותרים לפי השיטה</b> – גם כשצדקת, כדי לוודא שזה לא היה מזל – ואז <b>המילים מהשאלה</b>.');
  h+=`<div class="am-cta">${AQ.i?'<button class="btn secondary" id="amPrev2" aria-label="השאלה הקודמת">→</button>':''}<button class="btn" id="amNext" data-fb="${!ok?'why':'meth'}">${!ok?'🔍 לחקור את הטעות':'🧭 איך פותרים לפי השיטה'} ←</button></div>`;
  return h}
function amNextLbl(){return AQ.i+1<AQ.ids.length?'לשאלה הבאה':'סיום'}
function amFbPage(id,st){const q=AMD.q[id],ok=amIsOk(q,st.sel);
  const mine=typeof q.a==='string'?st.sel:q.o[st.sel-1],right=typeof q.a==='string'?q.a:q.o[q.a-1];
  let h=amQPath(st,ok);
  if(st.fb==='why'){
    h+=`<div class="am-vs"><div class="bad"><small>בחרת</small><bdi dir="ltr">${esc(mine||'')}</bdi></div><div class="ok"><small>הנכונה</small><bdi dir="ltr">${esc(right||'')}</bdi></div></div>`;
    h+=EXB('3 צעדים: <b>1</b> סמני מה קרה, <b>2</b> לחצי "לנתח" לקבל הסבר אישי, <b>3</b> שמרי לקח במשפט אחד (נשמר ב"הלקחים שלי").');
    h+=amWhyBox(id,st);
    h+=`<div class="am-cta"><button class="btn secondary" id="amBackRes">→</button><button class="btn" id="amNext" data-fb="meth">🧭 איך פותרים לפי השיטה ←</button></div>`}
  else if(st.fb==='meth'){
    if(q.t!=='rc'&&q.t!=='yb'){const cs=connFind(q.q);if(cs.length)h+=`<div class="am-box"><h4>🔗 מילות הקישור במשפט</h4>${cs.map(c=>`<p>«<bdi>${c.ws.join(', ')}</bdi>» – <b>${c.he}</b>: ${c.tip}</p>`).join('')}</div>`}
    if(q.t==='rc'){const k=rcType(q.q);h+=`<div class="am-box"><h4>📖 סוג השאלה: ${RCT[k][0]}</h4><p>${RCT[k][1]}</p></div>`}
    if(q.ex)h+=`<div class="am-box"><h4>📗 ההסבר מהספר</h4><div class="exl">${esc(q.ex)}</div></div>`;
    h+=amMethodBox(id);
    h+=`<div class="am-cta"><button class="btn secondary" id="amBackRes">→</button><button class="btn" id="amNext" data-fb="words">📚 המילים מהשאלה ←</button></div>`}
  else{h+=EXB('המילים מהשאלה שנמצאות במאגר המילים. <b>➕ ללמידה</b> – המילה נכנסת לתור הלמידה (בסוף התרגול אפשר ללמוד את כל מה שאספת). "✓ יודעת" – כבר סימנת אותה במילון. "🧠 בלמידה" – כבר במסלול.');h+=amWordsBox(id);
    h+=`<div class="am-cta"><button class="btn secondary" id="amBackRes">→</button><button class="btn" id="amNext" data-fb="">${amNextLbl()} ←</button></div>`}
  return h}
function amWhyBox(id,st){const q=AMD.q[id],a=AMS.a[id]||{},key='why|'+id+'|'+st.sel,ai=AMAI[key],why=st.why&&st.why.length?st.why:(a.r||[]);
  const lsK=id+'|'+st.sel,ls=(AMS.ls||{})[lsK];
  let h=`<div class="am-box why" id="amWhy"><h4>1 · מה קרה לך כאן?</h4><p class="hint" style="margin:0">סמני (אפשר כמה) – זה מה שיבנה את "הטעויות הנפוצות שלך".</p>
    <div class="am-why">${WHY.map(([k,l])=>`<button data-why="${k}" aria-pressed="${why.includes(k)}">${l}</button>`).join('')}</div>
    <textarea class="am-in" id="amNote" placeholder="מה חשבתי כשבחרתי בתשובה הזו? (לא חובה)">${esc(st.note||a.n||'')}</textarea></div>
    <div class="am-box" id="amAna"><h4>2 · הניתוח</h4>`;
  if(ai&&!ai.err)h+=`<p class="am-tag">${esc(ai.title||'')}</p>
      ${ai.why_wrong?`<p><b>למה בחירתך לא נכונה:</b> ${bdiEsc(ai.why_wrong)}</p>`:''}${ai.why_right?`<p><b>למה הנכונה נכונה:</b> ${bdiEsc(ai.why_right)}</p>`:''}
      ${ai.method?`<p><b>🧭 מה היה מציל אותי:</b> ${bdiEsc(ai.method)}</p>`:''}`;
  else if(ai&&ai.err)h+=`<p class="hint">${esc(ai.err)}</p>`;
  else if(!AIP[key])h+=`<p class="hint" style="margin:0">ג׳מיני ינתח את הטעות לפי מה שסימנת: למה התשובה שלך לא נכונה, ואיזה שלב בשיטה היה מונע אותה.</p>`;
  h+=AIP[key]?`<p class="hint">⏳ מנתחת את הטעות…</p>`:`<button class="btn secondary" id="amWhyGo">${ai&&!ai.err?'🔄 ניתוח מחדש':'🧠 לנתח את הטעות'}</button>${aiNeedKey()}`;
  h+=`</div><div class="am-box good"><h4>3 · הלקח שלי</h4><p class="hint" style="margin:0">משפט אחד שתזכרי בפעם הבאה. נשמר ב"הלקחים שלי".</p>
    <textarea class="am-in" id="amLesson" placeholder="לדוגמה: אם יש although – ההשלמה הפוכה לחלק השני">${esc(ls?ls.r:(ai&&ai.rule)||'')}</textarea>
    <button class="btn ${ls?'secondary':''}" id="amLsSave">${ls?'✓ נשמר · לעדכן':'📝 לשמור את הלקח'}</button></div>`;
  return h}
function amMethodBox(id){const q=AMD.q[id],key='m|'+id,ai=AMAI[key];
  if(!ai&&!AIP[key]&&GKEY()&&S.screen==='amq'){const p=aiCached(key,promptMethod(q),.2);p.then(()=>{if(S.screen==='amq'&&AQ.cur===id)amRedrawKeep()})}
  let h=`<div class="am-box" id="amMeth"><h4>🧭 פתרון לפי השיטה</h4>`;
  if(ai&&!ai.err)h+=`<ol>${(ai.steps||[]).map(s=>`<li>${bdiEsc(s)}</li>`).join('')}</ol>${(ai.options||[]).length?`<p style="margin-top:6px"><b>התשובות:</b></p><ul>${ai.options.map((s,i)=>`<li>(${i+1}) ${bdiEsc(String(s).replace(/^\(?\d\)?\s*[-–:.]?\s*/,''))}</li>`).join('')}</ul>`:''}${ai.rule?`<p><b>📌 ${bdiEsc(ai.rule)}</b></p>`:''}`;
  else h+=(ai&&ai.err?`<p class="hint">${esc(ai.err)}</p>`:'')+(AIP[key]?`<p class="hint">⏳ מכינה הסבר צעד אחר צעד…</p>`:`<button class="btn secondary" id="amMethGo">הסבר צעד אחר צעד</button>${aiNeedKey()}`);
  return h+'</div>'}
function amWordRow(e,he,src){const k=wKey(e),inW=AMS.w[k],kn=!inW&&wKnownDict(e);
  return `<div class="am-wrow"><button class="spk" data-amsay="${esc(e)}" aria-label="השמעה" style="width:34px;height:34px">${SPK}</button><span class="e">${esc(e)}</span><span class="h">${esc(he||'')}${kn?' · <b style="color:var(--ok)">✓ יודעת</b>':''}</span><button class="${inW?'in':''}" data-wadd="${esc(e)}" data-wh="${esc(he||'')}" data-wsrc="${src}">${inW?'✓ בסדנה':'➕ ללמוד'}</button></div>`}
/* words of this question: her glosses from the book, the options (sentence completion), and words she added */
function amWordsBox(id){if(!id||!AMD)return '';const R=amQWords(id),add=R.filter(d=>!amDbStatus(d)).length;
  return `<div class="am-box am-wordsbox"><h4>📚 מילים מהשאלה שנמצאות במאגר (${R.length})</h4>${R.length?`<div class="am-words">${R.map(d=>{const st=amDbStatus(d);return `<div class="am-wrow"><button class="spk" data-amsay="${esc(d.e)}" aria-label="השמעה" style="width:34px;height:34px">${SPK}</button><span class="e">${esc(d.e)}</span><span class="h">${d.cards.length>1?d.cards.length+' פירושים':''}</span><button class="${st?'in':''}" data-dbadd="${esc(d.e)}">${st==='y'?'✓ יודעת':st==='w'?'🧠 בלמידה':'➕ ללמידה'}</button></div>`}).join('')}</div>`:'<p class="hint" style="margin:0">אין בשאלה מילים מהמאגר שעוד לא סימנת.</p>'}
    ${add>1?`<button class="btn secondary" id="amAddAll">➕ להוסיף ללמידה את כל ${add} המילים</button>`:''}</div>`}
function amBindFeedback(id,st){const q=AMD.q[id];
  const nx=$('amNext');if(nx)nx.onclick=()=>{const f=nx.dataset.fb;if(f){st.fb=f;amSaveQ();draw();window.scrollTo(0,0);
      if(f==='why'&&GKEY()&&!AMAI['why|'+id+'|'+st.sel]){}return}
    st.fb='';AQ.i++;if(AQ.i<AQ.ids.length)aqSt().seen=amNow();amSaveQ();draw();window.scrollTo(0,0)};
  const br=$('amBackRes');if(br)br.onclick=()=>{const ok=amIsOk(q,st.sel);st.fb=st.fb==='words'?'meth':st.fb==='meth'?(ok?'':'why'):'';amSaveQ();draw();window.scrollTo(0,0)};
  const lsb=$('amLsSave');if(lsb)lsb.onclick=()=>{const v=($('amLesson').value||'').trim();if(!v)return;AMS.ls=AMS.ls||{};AMS.ls[id+'|'+st.sel]={id,r:v,w:(st.why||[]).slice(),t:amNow()};amSave();amRedrawKeep()};
  const pv=$('amPrev2');if(pv)pv.onclick=()=>{AQ.i--;amSaveQ();draw();window.scrollTo(0,0)};
  app.querySelectorAll('[data-why]').forEach(b=>b.onclick=()=>{const k=b.dataset.why;st.why=st.why&&st.why.length?st.why:((AMS.a[id]||{}).r||[]).slice();
    st.why=st.why.includes(k)?st.why.filter(x=>x!==k):[...st.why,k];const a=AMS.a[id]=AMS.a[id]||{h:[]};a.r=st.why;a.t=amNow();amSave();amSaveQ();b.setAttribute('aria-pressed',st.why.includes(k))});
  const nt=$('amNote');if(nt)nt.oninput=()=>{st.note=nt.value;const a=AMS.a[id]=AMS.a[id]||{h:[]};a.n=nt.value;a.t=amNow();clearTimeout(nt._t);nt._t=setTimeout(amSave,600);amSaveQ()};
  const wg=$('amWhyGo');if(wg)wg.onclick=()=>{const key='why|'+id+'|'+st.sel;delete AMAI[key];const p=aiCached(key,promptWhy(q,st.sel,st.why||[],st.note||''),.3);amRedrawKeep();p.then(()=>{if(S.screen==='amq'&&AQ.cur===id)amRedrawKeep()})};
  const mg=$('amMethGo');if(mg)mg.onclick=()=>{const key='m|'+id;delete AMAI[key];const p=aiCached(key,promptMethod(q),.2);amRedrawKeep();p.then(()=>{if(S.screen==='amq'&&AQ.cur===id)amRedrawKeep()})};
  amBindWordBtns(id)}
function amBindWordBtns(id){const q=id&&AMD.q[id];
  const addD=e=>{const d=dictFind(e);if(!d)return;const ctx=q?(q.t==='rc'?amSentenceWith(q,e):q.t==='sc'?q.q.replace(/_{3,}/g,q.o[q.a-1]):q.q):'';
    /* every meaning she does not know yet joins the queue; the sentence from the question is kept as the place she met it */
    d.cards.filter(c=>!isY(c)&&!AMS.w['c:'+c.id]).forEach(c=>wAdd(c.e,c.h[0],ctx,'dict:'+c.id,'c:'+c.id))};
  app.querySelectorAll('[data-dbadd]').forEach(b=>b.onclick=()=>{if(b.classList.contains('in'))return;addD(b.dataset.dbadd);b.classList.add('in');b.textContent='🧠 בלמידה'});
  app.querySelectorAll('[data-wadd]').forEach(b=>b.onclick=()=>{const e=b.dataset.wadd;if(AMS.w[wKey(e)])return;wAdd(e,b.dataset.wh,'',b.dataset.wsrc||id);b.classList.add('in');b.textContent='✓ בסדנה'});
  const aa=$('amAddAll');if(aa)aa.onclick=()=>{app.querySelectorAll('[data-dbadd]:not(.in)').forEach(b=>b.click());aa.remove()}}
function amParas(T){if(T._p)return T._p;const out=[];let par=[];T.l.forEach(l=>{if(!l){if(par.length)out.push(par.join(' '));par=[];return}par.push(l)});if(par.length)out.push(par.join(' '));return T._p=out}
function amSentenceWith(q,e){const T=AMD.x[q.x];if(!T)return q.q;const txt=T.l.filter(Boolean).join(' ');const ss=txt.match(/[^.!?]+[.!?]+/g)||[txt];
  const r=new RegExp('\\b'+e.toLowerCase().slice(0,Math.max(3,e.length-2)).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');return (ss.find(s=>r.test(s))||q.q).trim()}

/* session results */
function amResult(){const exam=AQ.mode==='exam';clearInterval(AMTICK);
  if(exam&&!AQ.fin){AQ.fin=1;amFinishExam();return}
  const rows=AQ.ids.map((id,i)=>{const s=AQ.st[i]||{},q=AMD.q[id];return {id,i,q,s,ok:s.done&&amIsOk(q,s.sel),ans:s.done}});
  const ok=rows.filter(r=>r.ok).length,ans=rows.filter(r=>r.ans).length,tot=rows.reduce((a,r)=>a+(r.s.ms||0),0);
  const byT={};rows.forEach(r=>{const b=byT[r.q.t]=byT[r.q.t]||{n:0,ok:0,ms:0};b.n++;if(r.ok)b.ok++;b.ms+=r.s.ms||0});
  app.innerHTML=`<div class="screen">
    ${amNav(AQ.from||'am','חזרה')}
    <div><h2>${esc(AQ.name)} – סיכום</h2><p class="sub">${ans<rows.length?`ענית על ${ans} מתוך ${rows.length} · `:''}${exam?'זמן: '+Math.round((Math.min(amNow(),AQ.t0+AQ.limit)-AQ.t0)/6e4)+' דק׳':'זמן כולל: '+Math.round(tot/6e4)+' דק׳'}</p></div>
    <p class="am-big">${ok} / ${rows.length}</p>
    <div class="am-box">${Object.entries(byT).map(([t,b])=>`<p>${AMTI[t]} <b>${AMTN[t]}</b>: ${b.ok}/${b.n} · בממוצע ${Math.round(b.ms/b.n/1e3)} שנ׳ לשאלה (מומלץ ${AMTARGET[t]})</p>`).join('')}</div>
    ${rows.some(r=>r.ans&&!r.ok)?`<p class="lbl">לחצי על שאלה כדי לראות את ההסבר ולנתח את הטעות</p>`:''}
    <ul class="am-res">${rows.map(r=>`<li class="${r.ok?'ok':r.ans?'bad':''}"><button data-ri="${r.i}"><span class="s">${r.ok?'✓':r.ans?'✗':'—'}</span><span class="tx">${esc(r.q.q)}</span><small dir="rtl" style="font-family:var(--he)">${r.s.ms?Math.round(r.s.ms/1e3)+' שנ׳':''}</small></button></li>`).join('')}</ul>
    ${(()=>{const L=(AQ.added||[]).filter(k=>AMS.w[k]&&AMS.w[k].st===0);return L.length?`<div class="am-box good"><h4>📚 אספת ${L.length} מילים חדשות בתרגול</h4><p style="margin:0">הכי טוב ללמוד אותן עכשיו, כשההקשר עוד טרי: אסוציאציה, משפט שלך ושליפה – ואז סיבוב שני מהיר. הן יחזרו אלייך אחרי 20 דקות, מחר, ועוד.</p><button class="btn" id="amLearnAdded">🌱 ללמוד אותן עכשיו</button></div>`:''})()}
    <button class="btn ${(AQ.added||[]).some(k=>AMS.w[k]&&AMS.w[k].st===0)?'secondary':''}" id="amAgain">${AQ.from==='amx'?'חזרה למחברת הטעויות':'סיום'}</button>
  </div>`;
  amBindNav();$('amAgain').onclick=()=>go({screen:AQ.from||'am'});const la=$('amLearnAdded');if(la)la.onclick=()=>wStart('collect',AQ.added);
  app.querySelectorAll('[data-ri]').forEach(b=>b.onclick=()=>{const i=+b.dataset.ri,s=aqSt(i);if(!s.done){s.done=!!s.sel;}AQ.mode='learn';AQ.i=i;amSaveQ();draw();window.scrollTo(0,0)})}

/* ================= mistakes notebook ================= */
function amMist(){if(!AMD)return amLoading();
  const all=Object.keys(AMD.q).filter(amEverWrong),act=all.filter(amIsMist),due=act.filter(amMistDue),fixed=all.filter(id=>!amIsMist(id));
  const cnt={};act.forEach(id=>((AMS.a[id]||{}).r||[]).forEach(r=>cnt[r]=(cnt[r]||0)+1));
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3),nls=Object.keys(AMS.ls||{}).length;
  const row=id=>{const q=AMD.q[id],a=AMS.a[id];return `<li class="${amIsMist(id)?'bad':'ok'}"><button data-mq="${id}"><span class="s">${AMTI[q.t]}</span><span class="tx">${esc(q.q)}</span><small dir="rtl" style="font-family:var(--he)">${amIsMist(id)?(amMistDue(id)?'עכשיו':wWhen(a&&a.due)):'✓ תוקן'}</small></button></li>`};
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('am','אמירנט')}
    <div class="am-title"><span class="gi g-m">🩹</span><div><h2>טעויות ולקחים</h2><p>שאלה שטעית בה חוזרת אחרי יום, 3 ימים ושבוע – עד 3 הצלחות.</p></div></div>
    <button class="am-card2 g-m" id="amMGo" ${due.length?'':'disabled'}><span class="gi">🔁</span><span class="grow"><b>ניסיון חוזר</b><small>${due.length?due.length+' שאלות מחכות היום':'אין שאלות שמחכות היום'}</small>${EX('פותרים שוב שאלות שטעית בהן. שאלה חוזרת אחרי יום, 3 ימים ושבוע – אחרי 3 הצלחות היא עוברת ל"תוקנו".','סבב שאלות, כמו תרגול רגיל')}</span>${due.length?`<span class="gb">${due.length}</span>`:''}</button>
    <button class="am-card2 g-m" id="amLs"><span class="gi">📝</span><span class="grow"><b>הלקחים שלי</b><small>${nls?nls+' כללים שלמדת מטעויות':'כל לקח שתשמרי בחקירת טעות יופיע כאן'}</small>${EX('כל המשפטים ששמרת בשלב "הלקח שלי" אחרי טעות, מקובצים לפי סוג הטעות. טוב לקרוא לפני סימולציה.','רשימת הלקחים')}</span></button>
    ${top.length?`<div class="am-box why"><h4>הטעויות הנפוצות שלך</h4>${top.map(([k,n])=>`<p>${(WHY.find(w=>w[0]===k)||[,k])[1]} – ${n}</p>`).join('')}<p class="hint" style="margin:0">💡 ${amAdvice(top[0][0])}</p></div>`:''}
    ${act.length?`<p class="lbl">לתיקון (${act.length})</p>${EXB('לחיצה על שאלה פותחת רק אותה. בצד: מתי היא תחזור לניסיון חוזר.')}<ul class="am-res">${act.map(row).join('')}</ul>`:''}
    ${fixed.length?`<details class="am-box"><summary style="font-weight:800;cursor:pointer">תוקנו (${fixed.length})</summary><ul class="am-res">${fixed.map(row).join('')}</ul></details>`:''}
    ${!all.length?'<p class="am-empty">עוד אין טעויות. כל שאלה שתטעי בה תחכה כאן.</p>':''}
  </div>`;
  amBindNav();$('amMGo').onclick=amStartMist;$('amLs').onclick=()=>go({screen:'amls'});
  app.querySelectorAll('[data-mq]').forEach(b=>b.onclick=()=>amStart([b.dataset.mq],'מחברת הטעויות','learn','amx','mist'))}
/* lessons she saved while investigating mistakes, grouped by what went wrong */
function amLessons(){if(!AMD)return amLoading();const LS0=Object.entries(AMS.ls||{}).sort((a,b)=>b[1].t-a[1].t);
  const grp={};LS0.forEach(([k,l])=>{const g=(l.w&&l.w[0])||'other';(grp[g]=grp[g]||[]).push([k,l])});
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('amqh','תרגול שאלות')}
    <div class="am-title"><span class="gi g-m">📝</span><div><h2>הלקחים שלי</h2><p>קראי אותם לפני סימולציה – זה התקציר האישי שלך.</p></div></div>
    ${EXB('<b>לשאלה</b> = פותח את השאלה שממנה נולד הלקח, לפתור שוב. <b>מחיקה</b> = מוחק את הלקח.')}
    ${LS0.length?Object.entries(grp).map(([g,arr])=>`<div class="am-box"><h4>${g==='other'?'כללי':(WHY.find(w=>w[0]===g)||[,g])[1]}</h4>${arr.map(([k,l])=>`<div class="am-lesson"><p>📌 ${bdiEsc(l.r)}</p><div class="am-row2"><button class="am-pill sm" data-lq="${l.id}">לשאלה</button><button class="am-pill sm" data-ldel="${esc(k)}">מחיקה</button></div></div>`).join('')}</div>`).join(''):'<p class="am-empty">עוד אין לקחים. אחרי טעות, בעמוד "חקירת הטעות", שמרי משפט אחד שתזכרי.</p>'}
  </div>`;
  amBindNav();
  app.querySelectorAll('[data-lq]').forEach(b=>b.onclick=()=>amStart([b.dataset.lq],'לקח · השאלה','learn','amls','mist'));
  app.querySelectorAll('[data-ldel]').forEach(b=>b.onclick=()=>{delete AMS.ls[b.dataset.ldel];amSave();draw()})}
/* ---------- progress ---------- */
function amProgress(){if(!AMD)return amLoading();
  const types=['sc','rs','rc','yb'].map(t=>{let n=0,ok=0,ms=0,c=0;Object.entries(AMS.a).forEach(([id,a])=>{const q=AMD.q[id];if(!q||q.t!==t)return;(a.h||[]).forEach(r=>{n++;if(r[1])ok++;if(r[2]){ms+=r[2];c++}})});return {t,n,ok,ms:c?ms/c:0}});
  const W=Object.values(AMS.w),st=[0,1,2,3,4,5,6,7].map(i=>W.filter(w=>w.st===i).length),now=amNow();
  const fc=[0,1,2,3,4,5,6].map(d=>W.filter(w=>w.st>=1&&w.st<WMAST&&w.due<now+(d+1)*DAY&&(d?w.due>=now+d*DAY:true)).length);
  const cnt={};Object.values(AMS.a).forEach(a=>(a.r||[]).forEach(r=>cnt[r]=(cnt[r]||0)+1));const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const days=new Set();Object.values(AMS.a).forEach(a=>(a.h||[]).forEach(r=>days.add(dayKey(r[3]))));W.forEach(w=>(w.log||[]).forEach(r=>days.add(dayKey(r[0]))));
  let streak=0;for(let d=0;d<400;d++){if(days.has(dayKey(now-d*DAY)))streak++;else if(d)break}
  const mx=Math.max(1,...fc),stN=['מחכות','20 דק׳','יום','3 ימים','שבוע','שבועיים','חודש','נלמדו'];
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('am','אמירנט')}
    <div class="am-title"><span class="gi g-p">📊</span><div><h2>ההתקדמות שלי</h2><p>${streak?`🔥 ${streak} ימים ברצף`:'עוד לא תרגלת היום'} · ${days.size} ימי תרגול</p></div></div>
    ${EXB('העמוד הזה רק מציג – אין בו כפתורים. הוא מתעדכן לבד מכל מה שאת עושה.')}
    <div class="am-box"><h4>שאלות</h4>${EXB('הפס = אחוז התשובות הנכונות. הזמן = ממוצע לשאלה מול היעד במבחן.')}${types.filter(x=>x.n).map(x=>`<div class="am-stat"><span>${AMTI[x.t]} ${AMTN[x.t]}</span><span class="am-mini"><i style="width:${x.ok/x.n*100}%"></i></span><b>${Math.round(x.ok/x.n*100)}%</b><small>${x.n} ניסיונות · ${Math.round(x.ms/1e3)} שנ׳ (יעד ${AMTARGET[x.t]})</small></div>`).join('')||'<p class="hint" style="margin:0">עוד לא פתרת שאלות.</p>'}</div>
    <div class="am-box"><h4>מילים לפי שלב</h4><div class="am-bars">${st.map((n,i)=>`<div><span style="height:${Math.max(4,n/Math.max(1,...st)*80)}px" class="${i===7?'ok':''}"></span><b>${n}</b><small>${stN[i]}</small></div>`).join('')}</div></div>
    <div class="am-box"><h4>חזרות בשבוע הקרוב</h4>${EXB('כמה מילים יחכו לחזרה פעילה בכל יום. מעט היום = אפשר ללמוד יותר מילים חדשות.')}<div class="am-bars">${fc.map((n,d)=>`<div><span style="height:${Math.max(4,n/mx*80)}px"></span><b>${n}</b><small>${d?['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'][new Date(now+d*DAY).getDay()]:'היום'}</small></div>`).join('')}</div></div>
    ${top.length?`<div class="am-box why"><h4>למה אני טועה</h4>${top.map(([k,n])=>`<p>${(WHY.find(w=>w[0]===k)||[,k])[1]} – ${n}</p>`).join('')}<p class="hint" style="margin:0">💡 ${amAdvice(top[0][0])}</p></div>`:''}
    ${AMS.ex&&Object.keys(AMS.ex).length?`<div class="am-box"><h4>סימולציות</h4>${Object.entries(AMS.ex).map(([k,r])=>`<p>${k[0]==='b'?'ניהול זמנים פרק '+k.slice(1):'סימולציה '+k}: <b>${r.ok}/22</b> · ${Math.round(r.ms/6e4)} דק׳</p>`).join('')}</div>`:''}
  </div>`;amBindNav()}
/* ---------- 🧬 word parts drill (prefixes / suffixes) ---------- */
let WP=null;
function wpNext(){const P=AMD.px||{pre:[],suf:[]},all=[];['pre','suf'].forEach(k=>P[k].forEach((e,i)=>e.ex.forEach(([en,he])=>{if(en.length>3&&he)all.push({k,i,en,he})})));
  const seen=AMS.wp||{},fresh=all.filter(x=>!seen[x.en]),pool=fresh.length?fresh:all,it=pool[Math.floor(Math.random()*pool.length)];
  const other=shuffle(all.filter(x=>x.he!==it.he)).slice(0,3).map(x=>x.he);WP={it,opts:shuffle([it.he,...other]),sel:null,hint:false}}
function amParts(){if(!AMD)return amLoading();if(!WP)wpNext();const it=WP.it,E=AMD.px[it.k][it.i],done=WP.sel!=null,n=Object.keys(AMS.wp||{}).length,ok=Object.values(AMS.wp||{}).filter(v=>v[0]).length;
  const mark=it.k==='pre'?it.en.replace(new RegExp('^('+E.p.split(/[\/ (]/)[0].replace(/[^a-z]/gi,'')+')','i'),'<u>$1</u>'):it.en.replace(new RegExp('('+E.p.replace(/[^a-z]/gi,'')+')$','i'),'<u>$1</u>');
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('amw','מילים')}
    <div class="am-title"><span class="gi g-s">🧬</span><div><h2>פירוק מילים</h2><p>${n?`${ok}/${n} נכון · `:''}מה פירוש המילה? רמז: ה${it.k==='pre'?'תחילית':'סופית'} המסומנת.</p></div></div>
    <div class="am-card"><div class="w" dir="ltr">${SAYB(it.en)}<span>${mark}</span></div>
      ${WP.hint||done?`<p class="center" style="margin:0"><b dir="ltr">${esc(E.p)}</b> = ${esc(E.h)}</p>`:`<button class="link" id="wpHint" style="align-self:center">💡 מה אומרת ה${it.k==='pre'?'תחילית':'סופית'}?</button>`}</div>
    ${!done?EXB('לחצי על הפירוש הנכון. 💡 מראה מה פירוש התחילית – נסי קודם בלי.'):''}
    <div class="am-opts">${WP.opts.map((o,j)=>`<button class="am-opt he-opt${done?(o===it.he?' right':o===WP.sel?' wrong':''):''}" data-wp="${j}" ${done?'disabled':''}>${esc(o)}</button>`).join('')}</div>
    ${done?`<div class="am-box"><h4>עוד מילים עם ${esc(E.p)}</h4><div class="am-words">${E.ex.map(([en,he])=>amWordRow(en,he,'parts')).join('')}</div></div><div class="am-cta"><button class="btn" id="wpNext">המילה הבאה ←</button></div>`:''}
  </div>`;
  amBindNav();const h=$('wpHint');if(h)h.onclick=()=>{WP.hint=true;draw()};
  app.querySelectorAll('[data-wp]').forEach(b=>b.onclick=()=>{WP.sel=WP.opts[+b.dataset.wp];AMS.wp=AMS.wp||{};AMS.wp[it.en]=[WP.sel===it.he?1:0,amNow()];amSave();draw()});
  const nx=$('wpNext');if(nx)nx.onclick=()=>{wpNext();draw();window.scrollTo(0,0)};
  app.querySelectorAll('[data-wadd]').forEach(b=>b.onclick=()=>{const e=b.dataset.wadd;if(AMS.w[wKey(e)])return;wAdd(e,b.dataset.wh,'','parts');b.classList.add('in');b.textContent='✓ בסדנה'})}
function amAdvice(k){return {vocabQ:'הכי משתלם: להוסיף את המילים מהשאלות לסדנת המילים ולעבור עליהן כל יום.',vocabA:'נסי קודם לנחש בעברית את ההשלמה, ורק אז לחפש תשובה שמתאימה לה – כך מילים לא מוכרות בתשובות פחות מבלבלות.',conn:'סמני כל מילת קישור לפני שאת קוראת את התשובות, ושאלי: ניגוד? סיבה? הוספה?',similar:'מילים שנראות דומות (in-, -ible…): פרקי לתחילית ושלד. בסדנת המילים כדאי לבנות אסוציאציה לכל אחת בנפרד.',trap:'בשאלות פרט והסקה – לחזור למשפט בקטע ולבדוק שהתשובה עונה בדיוק על מה ששאלו.',extra:'בניסוח מחדש: לחפש בכל תשובה מידע שלא כתוב במקור, ומילים כמו always / only / all.',rushed:'בתרגול לפי השיטה הזמן פחות חשוב – קודם דיוק, אחר כך מהירות.',guess:'כשמנחשים – קודם לפסול מה שבטוח לא נכון.'}[k]||''}

/* ================= word workshop ================= */
let WS=null;   /* the running workshop session: {mode:'new'|'rev', list:[keys], i, step, ...} */
function amWords(){if(!AMD)return amLoading();
  const all=Object.values(AMS.w),due=wDue().length,learn=all.filter(w=>w.st>=1&&w.st<WMAST).length,mast=all.filter(w=>w.st>=WMAST).length,wait=all.filter(w=>w.st===0).length,hard=all.filter(wHard).length;
  const newLeft=Math.max(0,(AMS.n||8)-wNewToday());
  const card=(id,cls,i,t,d,b,dis,ex)=>`<button class="am-card2 ${cls}" id="${id}" ${dis?'aria-disabled="true"':''}><span class="gi">${i}</span><span class="grow"><b>${t}</b><small>${d}</small>${ex||''}</span>${b?`<span class="gb">${b}</span>`:''}</button>`;
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('am','אמירנט')}
    <div class="am-title"><span class="gi g-w">🧠</span><div><h2>מילים</h2><p>לומדים לעומק ושולפים מהזיכרון – בלי "ידעתי / לא ידעתי".</p></div></div>
    ${card('wRev','g-w','🔁','חזרה פעילה',due?'כותבים מהזיכרון את המילים שהגיע זמנן':'אין מילים שמחכות עכשיו',due||'',!due,EX('מילים שכבר למדת ממשיכות לשלב הבא במסלול שלהן – כל פעם תרגיל אחר (משפט בעברית, כתיבה, משפט חדש, פירוש).'))}
    ${card('wNew','g-w','🌱','מילים חדשות להיום',newLeft?'הכרות ← שליפה ← בחירה במשפט':'סיימת את המילים של היום ✓',newLeft||'',!newLeft,EX('מילים חדשות מתחילות את המסלול: הכרות עם אסוציאציה, שליפה, ובסוף הסבב בחירה במשפט. קודם מילים שהוספת מהשאלות, אחר כך מילים שסימנת ✗.'))}
    ${card('wMine','g-w','📒','המילים שלי',`${learn} בלמידה · ${mast} נלמדו${hard?' · '+hard+' קשות':''}${wait?' · '+wait+' מחכות':''}`,'','',EX('כל המילים שאת לומדת, מסוננות: לחזרה, בלמידה, קשות, נלמדו, מחכות. לחיצה על מילה מראה מתי החזרה הבאה, יומן של כל הצלחה וטעות, והמלצה איך ללמוד אותה.','רשימת המילים שלך ← עמוד לכל מילה'))}
  </div>`;
  amBindNav();$('wRev').onclick=()=>{if(due)wStart('rev');else amToast('אין עכשיו מילים לחזרה – הן יופיעו כשיגיע זמנן')};$('wNew').onclick=()=>{if(newLeft)wStart('new');else amToast('סיימת את המילים החדשות של היום. אפשר להגדיל את הכמות ב"המילים שלי".')};$('wMine').onclick=()=>go({screen:'amwm'});
}
/* ---------- the words she studies: management, history and advice ---------- */
const wAcc=w=>{const L=(w.log||[]).filter(r=>['he2en','cloze','cloze2','mc','hecl','en2he','write','first'].includes(r[1]));if(!L.length)return null;return L.reduce((a,r)=>a+r[2],0)/L.length};
const wHard=w=>w.st>0&&w.st<WMAST&&((w.bad||0)>=3||((w.bad||0)>=2&&(wAcc(w)??1)<.6));
const wWhen=t=>{const d=t-amNow();if(d<=0)return 'עכשיו';if(d<36e5)return 'בעוד '+Math.max(1,Math.round(d/6e4))+' דק׳';if(d<DAY)return 'בעוד '+Math.round(d/36e5)+' שע׳';return 'בעוד '+Math.round(d/DAY)+' ימים'};
const wDate=t=>{const d=new Date(t);return d.getDate()+'.'+(d.getMonth()+1)+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
function amMyWords(){if(!AMD)return amLoading();const f=S.wf||'due',all=Object.values(AMS.w);
  const F={due:['לחזרה',w=>w.st>=1&&w.st<WMAST&&w.due<=amNow()],learn:['בלמידה',w=>w.st>=1&&w.st<WMAST],hard:['קשות',wHard],done:['נלמדו',w=>w.st>=WMAST],wait:['מחכות',w=>w.st===0]};
  const L=all.filter(F[f][1]).sort((a,b)=>f==='learn'||f==='due'?a.due-b.due:(b.t||0)-(a.t||0));
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('amw','מילים')}
    <div class="am-title"><span class="gi g-w">📒</span><div><h2>המילים שלי</h2><p>${all.length} מילים · לחצי על מילה לראות את היומן וההמלצה שלה</p></div></div>
    <div class="am-tabs">${Object.entries(F).map(([k,[t,fn]])=>`<button data-wf="${k}" aria-pressed="${k===f}">${t} <small>${all.filter(fn).length}</small></button>`).join('')}</div>
    ${EXB({due:'<b>לחזרה</b> – מילים שהגיע זמן החזרה שלהן. אפשר לחזור עליהן מ"חזרה פעילה".',learn:'<b>בלמידה</b> – כל המילים בתהליך, לפי מתי החזרה הבאה. הנקודות ●◉○ = השלב (6 חזרות עד שנלמדה).',hard:'<b>קשות</b> – מילים שטעית בהן כמה פעמים. כדאי לפתוח כל אחת ולעשות את מה שההמלצה אומרת.',done:'<b>נלמדו</b> – עברו את כל 6 החזרות 🏆 וסומנו ✓ במילון.',wait:'<b>מחכות</b> – מילים שהוספת ועוד לא התחלת. הן ייכנסו ל"מילים חדשות" לפי הסדר.'}[f]+' לחיצה על מילה = העמוד שלה (יומן, המלצה, תרגול).')}
    ${L.length?`<ul class="am-wl">${L.map(w=>{const a=wAcc(w);return `<li><button data-wk="${esc(wK(w))}"><span class="e" dir="ltr">${esc(w.e)}</span><span class="h">${esc(w.h||'')}</span><span class="m">${w.st>=WMAST?'✓ נלמדה':w.st?`<span class="am-dots">${wStageDots(w)}</span> ${wWhen(w.due)}`:'מחכה'}${a!=null?` · ${Math.round(a*100)}%`:''}</span></button></li>`}).join('')}</ul>`:`<p class="am-empty">${{due:'אין מילים לחזרה עכשיו 🎉',learn:'עוד אין מילים בלמידה – התחילי ב"מילים חדשות".',hard:'אין מילים קשות כרגע 💪',done:'עוד אין מילים שנלמדו עד הסוף.',wait:'אין מילים שמחכות. מילים שתוסיפי מהשאלות יופיעו כאן.'}[f]}</p>`}
    <div class="am-box"><h4>כמה מילים חדשות ביום?</h4>${EXB('קובע כמה מילים ייכנסו כל יום ל"מילים חדשות". יותר מילים = יותר חזרות בימים הבאים.')}<div class="seg">${[5,8,12,16].map(n=>`<button data-nd="${n}" aria-pressed="${(AMS.n||8)===n}">${n}</button>`).join('')}</div><p class="hint" style="margin:0">8 ביום ≈ 700 מילים לעומק ב־3 חודשים.</p></div>
  </div>`;
  amBindNav();
  app.querySelectorAll('[data-wf]').forEach(b=>b.onclick=()=>{S.wf=b.dataset.wf;persist();draw()});
  app.querySelectorAll('[data-nd]').forEach(b=>b.onclick=()=>{AMS.n=+b.dataset.nd;amSave();draw()});
  app.querySelectorAll('[data-wk]').forEach(b=>b.onclick=()=>go({screen:'amwd',wk:b.dataset.wk}))}
/* advice for one word, from its history */
function wRec(w){const L=w.log||[],a=wAcc(w),bad=w.bad||0,hints=L.filter(r=>r[3]).length,out=[];
  const by=t=>{const x=L.filter(r=>r[1]===t);return x.length?x.reduce((s,r)=>s+r[2],0)/x.length:null};
  if(w.st===0)return [['🌱','עוד לא התחלת','לחצי "ללמוד עכשיו": אסוציאציה, משפט משלך ושליפה. 3 דקות.']];
  if(w.st>=WMAST)return [['🏆','המילה נלמדה','עברה את כל החזרות. אם תפגשי אותה בשאלה ותתלבטי – החזירי אותה ללמידה.']];
  if(wHard(w)){out.push(['🧩','המילה קשה לך',`טעית בה ${bad} פעמים. הזיכרון לא "נאחז" – צריך עוגן חזק יותר.`]);
    out.push(['✨','אסוציאציה חדשה',w.as?'האסוציאציה הנוכחית לא עובדת. בקשי חדשה, מוזרה ומצחיקה יותר – ודמייני אותה 5 שניות.':'אין לה אסוציאציה עדיין – זה הדבר הראשון לעשות.']);
    out.push(['✍️','משפט אישי','למילה קשה כדאי לכתוב משפט קצר על משהו שקרה לך ("✍️ לכתוב משפט" למטה).'])}
  const he2en=by('he2en'),en2he=by('en2he');
  if(he2en!=null&&en2he!=null&&en2he-he2en>=.4)out.push(['↔️','מזהה אבל לא שולפת','כשאת רואה את המילה – את מבינה, אבל קשה לך להוציא אותה מהראש. תרגלי עברית ← אנגלית: "תרגול עכשיו".']);
  if(he2en!=null&&en2he!=null&&he2en-en2he>=.4)out.push(['↔️','שולפת אבל לא מבינה בהקשר','קראי את המשפטים לדוגמה בקול (🔊) ונסי לתרגם אותם.']);
  if(hints>=2)out.push(['💡','נשענת על רמזים',`השתמשת ברמז ${hints} פעמים. בפעם הבאה חכי 5 שניות ונסי לבד לפני שמבקשת רמז.`]);
  if(!out.length)out.push(['✅',a!=null&&a>=.8?'הולך מצוין':'בדרך הנכונה',`החזרה הבאה ${wWhen(w.due)}. אין צורך לעשות יותר – החזרה בזמן היא מה שמקבע.`]);
  return out}
function amWordPage(){if(!AMD)return amLoading();const w=AMS.w[S.wk];if(!w){go({screen:'amwm'});return}
  const cd=wCard(w),x=cd?EXTRA[cd.xid||cd.id]||{}:{},a=wAcc(w),L=(w.log||[]).slice().reverse();
  const steps=['20 דק׳','יום','3 ימים','שבוע','שבועיים','חודש'];
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('amwm','המילים שלי')}
    <div class="am-wordhead"><div class="w" dir="ltr">${SAYB(w.e)}<span>${esc(w.e)}</span></div><div class="m">${esc(w.h||'')}</div>
      <div class="am-track">${steps.map((t,i)=>`<span class="${w.st>i+1?'done':w.st===i+1?'on':''}"><i></i>${t}</span>`).join('')}<span class="${w.st>=WMAST?'on done':''}"><i></i>🏆</span></div>
      <p class="hint center" style="margin:0">${w.st>=WMAST?'נלמדה ✓':w.st?'החזרה הבאה '+wWhen(w.due):'עוד לא התחלת ללמוד'} · ✓ ${w.ok||0} · ✗ ${w.bad||0}${a!=null?' · '+Math.round(a*100)+'% הצלחה':''}</p></div>
    <div class="am-box"><h4>🎯 ההמלצה שלי בשבילך</h4>${wRec(w).map(([i,t,dd])=>`<div class="am-rec"><span>${i}</span><div><b>${t}</b><p>${dd}</p></div></div>`).join('')}</div>
    <div class="am-cta" style="position:static"><button class="btn" id="wdGo">${w.st===0?'🌱 ללמוד עכשיו':'🧠 תרגול עכשיו'}</button></div>
    ${EXB(w.st===0?'מתחיל את הלמידה של המילה: אסוציאציה, משפט שלך ושליפה.':'שליפה אחת עכשיו מהזיכרון, מחוץ לתור. הצלחה בלי רמז מקדמת את המילה שלב.')}
    ${wMethodBox(w)}
    <div class="am-box"><h4>💡 האסוציאציה שלי</h4>${w.as?`<p>${bdiEsc(w.as)}</p>`:'<p class="hint" style="margin:0">אין עדיין.</p>'}${x.tip&&x.tip!==w.as?`<p class="hint">מהמילון: ${bdiEsc(x.tip)}</p>`:''}<button class="btn secondary" id="wdAs">✨ להחליף אסוציאציה</button>${EXB('פותח את מסך האסוציאציות: לבחור אחרת מהמילון, לבקש 3 חדשות מג׳מיני, או לכתוב לבד.')}</div>
    <div class="am-box"><h4>✍️ משפט משלי (לא חובה)</h4>${(w.mys||(w.my?[w.my]:[])).map(t=>`<p dir="ltr" style="text-align:left;font-family:var(--en)">${SAYB(t,'sm inl')}${esc(t)}</p>`).join('')}<button class="btn secondary" id="wdSent">${(w.mys||[]).length||w.my?'➕ עוד משפט':'✍️ לכתוב משפט עם המילה'}</button>${EXB('לא חובה. משפט אישי עוזר במיוחד למילים קשות. ג׳מיני בודק אותו, והוא ישמש בתרגילי ההשלמה.')}</div>
    ${w.c?`<div class="am-box"><h4>📍 איפה פגשתי אותה</h4><p dir="ltr" style="text-align:left;font-family:var(--en)">${SAYB(w.c,'sm inl')}${esc(w.c)}</p></div>`:''}
    <div class="am-box"><h4>🗓 היומן של המילה</h4>${L.length?`<ul class="am-log">${L.map(r=>`<li class="${r[2]>=1?'ok':r[2]>0?'mid':'bad'}"><span>${r[2]>=1?'✓':r[2]>0?'≈':'✗'}</span><b>${WTASKN[r[1]]||r[1]}</b><small>${r[3]?'עם רמז · ':''}${wDate(r[0])}</small></li>`).join('')}</ul>`:'<p class="hint" style="margin:0">עוד אין תרגולים.</p>'}</div>
    <div class="am-row2"><button class="am-pill" id="wdReset">↺ ללמוד מחדש מההתחלה</button>${w.st<WMAST?`<button class="am-pill" id="wdKnow">✓ אני יודעת אותה</button>`:''}</div>
    ${EXB('↺ <b>ללמוד מחדש</b> – המילה חוזרת ל"מחכות" ותילמד שוב מההתחלה (היומן נשמר). · ✓ <b>אני יודעת אותה</b> – מסמנת שנלמדה (🏆) ומסמנת ✓ במילון.')}
  </div>`;
  amBindNav();
  $('wdGo').onclick=()=>{const k=wK(w);WS={mode:w.st===0?'new':'one',list:[k],i:0,step:w.st===0?'meet':'recall',hint:0,from:'amwd',ok:0,bad:0};wSave();go({screen:'amwl'})};
  $('wdAs').onclick=()=>{const k=wK(w);WS={mode:'new',list:[k],i:0,step:'meet',hint:0,from:'amwd',assocOnly:1};wSave();go({screen:'amwl'})};
  $('wdSent').onclick=()=>{WS={mode:'one',list:[wK(w)],i:0,step:'write',hint:0,from:'amwd',sentOnly:1,draft:''};wSave();go({screen:'amwl'})};
  $('wdReset').onclick=()=>{w.st=0;w.due=0;w.t=amNow();amSave();draw()};
  const kn=$('wdKnow');if(kn)kn.onclick=()=>{wLog(w,'known',1,0);wMaster(w);w.t=amNow();amSave();draw()}}
function wSave(){try{LS.set('dictAmWs',JSON.stringify(WS))}catch(e){}}
try{WS=JSON.parse(LS.get('dictAmWs')||'null')}catch(e){}
function wStart(mode,keys){
  if(mode==='collect'){const L=(keys||[]).filter(k=>AMS.w[k]&&AMS.w[k].st===0);if(!L.length)return;WS={mode:'new',list:L,i:0,step:'meet',hint:0,from:S.screen,ok:0,bad:0};wSave();go({screen:'amwl'});return}
  if(mode==='rev'){const d=wDue();if(!d.length)return;WS={mode,list:d.slice(0,30).map(w=>wK(w)),i:0,step:'recall',hint:0,from:S.screen==='am'?'am':'amw',ok:0,bad:0}}
  else{const n=Math.max(0,(AMS.n||8)-wNewToday());if(!n)return;const q=wQueue(n);if(!q.length)return;
    q.forEach(w=>{if(w.fresh){const x=wAdd(w.e,w.h,w.c,w.src,w.k);}});WS={mode,list:q.map(w=>wK(w)),i:0,step:'meet',hint:0,from:S.screen==='am'?'am':'amw',ok:0,bad:0}}
  wSave();go({screen:'amwl'})}
/* which active task a review of stage st gets */
/* the fixed path of a word. Learning: 1 הכרות → 2 שליפה (he→en) → 3 בחירה במשפט (end of the round).
   Reviews by stage: 1 (20 min) Hebrew sentence – choose the English word · 2 (1 day) write it in English · 3 (3 days) another English sentence – write it ·
   4 (7 days) the meaning in Hebrew · 5 (14 days) another English sentence – choose from 4 · 6 (30 days) write it in English → learned */
const WPATH=[null,'hecl','he2en','cloze2','en2he','mc','he2en'];
const WPATHN=['','משפט בעברית – בחירה','כתיבה באנגלית','משפט חדש – כתיבה','הפירוש בעברית','משפט חדש – בחירה','כתיבה באנגלית'];
function wTask(w){let t=WPATH[w.st]||'he2en';
  if(t==='hecl'&&!wHeSent(w))t='mc';
  if(t==='mc'&&!(wOther(w)||wCtx(w)))t='he2en';
  if(t==='cloze2'&&!wOther(w))t=wCtx(w)?'cloze':'he2en';
  return t}
const wCtx=w=>{const c=wCard(w);return [w.my,w.c,c&&c.s].find(x=>x&&blankOut(x,w.e))||''};
const wTaskNow=w=>WS&&WS.step==='first'?'he2en':WS&&WS.mode==='r2'?(wCtx(w)||wOther(w)?'mc':'he2en'):wTask(w);
/* the Hebrew translation of the word's example sentence, with the meaning taken out */
function heBlank(tr,h){if(!tr||!h)return '';const vs=String(h).replace(/\(.*?\)/g,'').split(/[,;/·]/).map(x=>x.trim().replace(/[-־]$/,'')).filter(x=>x.length>1).sort((a,b)=>b.length-a.length);
  const E=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  for(const v of vs){for(const pat of [E(v),v.length>3?E(v.slice(0,-1))+'[א-ת]{0,3}':null]){if(!pat)continue;
    const m=new RegExp('(^|[^א-ת])([ובכלהמש]{0,2})('+pat+')(?![א-ת])').exec(tr);if(m){const at=m.index+m[1].length+m[2].length;return tr.slice(0,at)+'_____'+tr.slice(at+m[3].length)}}}return ''}
function wHeSent(w){const c=wCard(w);if(!c||!c.s)return '';const tr=(EXTRA[c.xid||c.id]||{}).tr;return heBlank(tr,w.h)}
/* another English sentence with the word: from the exam questions, passages and books (not the one she learned with) */
let SPOOL=null;
function sPool(){if(SPOOL||!AMD)return SPOOL;const out=[],add=t=>{t=String(t||'').replace(/\s+/g,' ').trim();if(t.length>20&&t.length<230)out.push(t)};
  Object.values(AMD.q).forEach(q=>{if(q.t==='sc')add(q.q.replace(/_{3,}/g,q.o[q.a-1]));else if(q.t==='rs'){add(q.q);q.o.forEach(add)}});
  Object.values(AMD.x).forEach(T=>(T.l.filter(Boolean).join(' ').match(/[^.!?]+[.!?]+/g)||[]).forEach(add));
  (AMD.rd||[]).forEach(T=>T.en.forEach(p=>(p.match(/[^.!?]+[.!?]+/g)||[]).forEach(add)));
  Object.values(AMD.lists||{}).forEach(L=>L.forEach(x=>add(x.s)));return SPOOL=[...new Set(out)]}
const WOC={};
function wOther(w){const k=wK(w);if(k in WOC)return WOC[k];const P=sPool();if(!P)return '';const own=[w.my,w.c,(wCard(w)||{}).s].filter(Boolean);
  const c=P.filter(t=>!own.includes(t)&&blankOut(t,w.e)&&new RegExp('\\b'+w.e.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(s|es|ed|d|ing|ly)?\\b','i').test(t)).sort((a,b)=>a.length-b.length).slice(0,6);
  return WOC[k]=c.length?c[Math.floor(Math.random()*c.length)]:''}
/* 4 options: the word + 3 others, first from the same round, then her other words, then the dictionary */
function wOpts(w){WS.opts=WS.opts||{};const k=wK(w);if(WS.opts[k])return WS.opts[k];const me=w.e.toLowerCase(),pick=[],seen=new Set([me]);
  const tryAdd=e=>{const x=String(e||'').toLowerCase();if(pick.length<3&&x&&!seen.has(x)&&!x.includes(me)&&!me.includes(x)){seen.add(x);pick.push(e)}};
  shuffle(WS.list.map(x=>AMS.w[x]&&AMS.w[x].e)).forEach(tryAdd);shuffle(Object.values(AMS.w).map(x=>x.e)).forEach(tryAdd);
  const c=wCard(w),lv=c?c.l:3;shuffle(DW.filter(x=>Math.abs(x.l-lv)<=1).slice(0,400)).forEach(x=>tryAdd(x.e));
  return WS.opts[k]=shuffle([w.e,...pick])}
function amWordLearn(){if(!WS||!WS.list||WS.i>=WS.list.length)return wDone();
  const w=AMS.w[WS.list[WS.i]];if(!w){WS.i++;wSave();return draw()}
  const card=wCard(w),x=card?EXTRA[card.xid||card.id]||{}:{},ex=card?card.s:'';
  const ctx=w.c||ex||'';
  let h=`<div class="screen qz am-scr">
    <div class="nav"><button class="back" id="bk">יציאה</button>${HOME}${EXTOG()}${INFOB()}</div>
    <div class="am-bar"><span class="am-chip t">${WS.mode==='new'?'🌱 מילה חדשה':WS.mode==='r2'?'🔁 שלב 3 – בחירה במשפט':(WS.re||[]).includes(WS.list[WS.i])?'↩️ עוד פעם, כדי לחזק':'🧠 חזרה פעילה'}</span><span>${WS.i+1}/${WS.list.length}</span>${w.st?`<span class="am-timer">${wStageDots(w)}</span>`:''}</div>
    <div class="am-prog"><i style="width:${WS.i/WS.list.length*100}%"></i></div>`;
  const step=WS.step;
  if(step==='meet'){
    const others=card&&card.others&&card.others.length;
    h+=WS.assocOnly?'':`<div class="am-path"><span class="on">1 · הכרות</span><span>2 · שליפה</span><span>3 · בחירה במשפט</span></div>`;
    h+=`<div class="am-card"><div class="w"><button class="spk" data-amsay="${esc(w.e)}">${SPK}</button><span>${esc(w.e)}</span></div><div class="m">${esc(w.h)}</div>
      ${others?`<p class="hint center" style="margin:0">לומדים עכשיו רק את הפירוש הזה. ${others===1?'לפירוש השני':'ל־'+others+' הפירושים האחרים'} של המילה יש כרטיס נפרד.</p>`:''}
      ${ctx?`<div class="ctx" data-ctx="${esc(ctx)}">${SAYB(ctx,'sm inl')}${tapEn(ctx)}</div>${x.tr&&ctx===ex?`<p class="hint" style="margin:0">${esc(x.tr)}</p>`:''}`:''}</div>
      <div class="am-step-box"><h4>💡 בחרי אסוציאציה</h4><p>תמונה מוזרה וחיה בראש = זיכרון חזק. בחרי אחת, או כתבי משלך. דמייני אותה 5 שניות.</p>
      ${x.tip?`<button class="am-idea${w.as===x.tip?' on':''}" data-as="${esc(x.tip)}"><small>💡 מהמילון</small>${bdiEsc(x.tip)}</button>`:''}
      ${wIdeas(w)}
      <textarea class="am-in" id="wAs" placeholder="האסוציאציה שלי…">${esc(w.as&&w.as!==x.tip&&!(((AMAI['as|'+wK(w)]||{}).ideas)||[]).some(i=>i.scene===w.as)?w.as:'')}</textarea></div>
      ${wMethodBox(w)}
      ${x.use?`<details class="am-box"><summary style="font-weight:800;cursor:pointer">📌 דגשים על המילה (לא חובה)</summary>${xuse(x.use)}</details>`:''}
      <div class="am-cta"><button class="btn" id="wNext" ${w.as?'':'disabled'}>${WS.assocOnly?'שמירה ✓':'המשך ← לשלוף מהזיכרון'}</button></div>
      ${WS.assocOnly?'':'<button class="link" id="wKnow" style="align-self:center">את המילה הזו אני כבר יודעת ✓ – לדלג</button>'}
      ${WS.assocOnly?'':EXB('אחרי שבוחרים אסוציאציה: <b>שלב 2</b> – רואים את הפירוש בעברית וכותבים את המילה באנגלית. <b>שלב 3</b> – בסוף הסבב, אחרי כל המילים החדשות, עוד שליפה קצרה של כולן (השלמה במשפט).')}`}
  else if(step==='write'||(step==='recall'&&wTask(w)==='write')){
    const ck=WS.chk;
    h+=`<div class="am-card"><div class="w"><button class="spk" data-amsay="${esc(w.e)}">${SPK}</button><span>${esc(w.e)}</span></div><div class="m">${esc(w.h)}</div>${w.as?`<div class="am-hint">💡 ${bdiEsc(w.as)}</div>`:''}</div>
      <div class="am-step-box"><h4>✍️ משפט משלך באנגלית (לא חובה)</h4><p>כתבי משפט על החיים שלך שמשתמש ב־<b><bdi>${esc(w.e)}</bdi></b> במשמעות «${esc(w.h)}». משפט אישי נזכר הכי טוב.${w.my&&step!=='write'?' (משפט חדש, לא זה שכתבת קודם)':''}</p>
      <textarea class="am-in en" id="wMy" placeholder="My sentence with ${esc(w.e)}…" spellcheck="true">${esc(WS.draft||'')}</textarea>
      ${ck?(ck.err?`<p class="hint">${esc(ck.err)}</p>`:`<div class="am-box ${ck.ok?'good':'why'}"><h4>${ck.ok?'✓ משפט נכון!':'כמעט – כדאי לתקן:'}</h4>${(ck.fixes||[]).map(f=>`<p>• ${bdiEsc(f)}</p>`).join('')}${!ck.ok&&ck.corrected?`<p><b>מתוקן:</b> <bdi>${esc(ck.corrected)}</bdi></p>`:''}${ck.hebrew?`<p>${esc(ck.hebrew)}</p>`:''}${ck.tip?`<p>💡 ${bdiEsc(ck.tip)}</p>`:''}</div>`):''}
      ${WS.busy?'<p class="hint">⏳ בודקת את המשפט…</p>':''}</div>
      <div class="am-nav"><button class="btn secondary" id="wChk" ${WS.busy?'disabled':''}>🔍 בדיקה</button><button class="btn" id="wSaveS">${ck&&!ck.ok&&ck.corrected?'לשמור את המתוקן':'שמירה והמשך'}</button></div>
      ${aiNeedKey()}`}
  else{ /* recall tasks */
    const task=wTaskNow(w),hint=WS.hint||0,res=WS.res;
    if(step==='first')h+=`<div class="am-path"><span class="done">1 · הכרות ✓</span><span class="on">2 · שליפה</span><span>3 · בחירה במשפט</span></div>`;
    if(WS.mode==='r2')h+=`<div class="am-path"><span class="done">1 · הכרות ✓</span><span class="done">2 · שליפה ✓</span><span class="on">3 · בחירה במשפט</span></div>`;
    if(WS.mode!=='new'&&WS.mode!=='r2'&&w.st>=1&&!(WS.re||[]).includes(WS.list[WS.i]))h+=`<div class="am-path">${[1,2,3,4,5,6].map(i=>`<span class="${w.st>i?'done':w.st===i?'on':''}">${i}</span>`).join('')}</div><p class="hint center" style="margin:0">חזרה ${w.st} מתוך 6 · ${{hecl:'משפט בעברית – בחירה',mc:'משפט באנגלית – בחירה',cloze2:'משפט חדש – כתיבה',cloze:'השלמה במשפט – כתיבה',en2he:'הפירוש בעברית',he2en:'כתיבה באנגלית'}[task]}</p>`;
    const mcS=task==='mc'?blankOut(WS.mode==='r2'?(wCtx(w)||wOther(w)):(wOther(w)||wCtx(w)),w.e):'',heS=task==='hecl'?wHeSent(w):'';
    if(task==='mc'||task==='hecl'){
      h+=`<div class="am-card"><p class="hint center" style="margin:0">${task==='hecl'?'איזו מילה באנגלית חסרה במשפט?':'איזו מילה משלימה את המשפט?'}</p>
        <div class="${task==='hecl'?'m':'ctx'}" style="font-size:1.15rem;color:var(--ink);line-height:1.6;${task==='hecl'?'font-weight:600':''}">${esc(task==='hecl'?heS:mcS).replace(/_{4,}/,'<span class="am-gap">&nbsp;?&nbsp;</span>')}</div></div>`;
      const O=wOpts(w);
      h+=`<div class="am-opts">${O.map(o=>`<button class="am-opt${res?(o===w.e?' right':o===res.typed?' wrong':''):''}" data-wmc="${esc(o)}" ${res?'disabled':''}><span>${esc(o)}</span></button>`).join('')}</div>`;
      if(!res)h+=`<button class="link" id="wGive" style="align-self:center">לא יודעת – הראי לי</button>${EXB('לחצי על המילה שמתאימה למשפט. האפשרויות הן מילים אחרות שאת לומדת – כדי שתלמדי להבחין ביניהן.')}`}
    else if(task==='cloze2'){const s2=blankOut(wOther(w),w.e);h+=`<div class="am-card"><p class="hint center" style="margin:0">משפט חדש – איזו מילה חסרה? (${esc(w.h)})</p><div class="ctx" style="font-size:1.15rem;color:var(--ink)">${esc(s2)}</div></div>`}
    else if(task==='en2he')h+=`<div class="am-card"><p class="hint center" style="margin:0">מה הפירוש בעברית?</p><div class="w"><button class="spk" data-amsay="${esc(w.e)}">${SPK}</button><span>${esc(w.e)}</span></div>${ctx&&hint>0?`<div class="ctx">${esc(ctx)}</div>`:''}</div>`;
    else if(task==='cloze'){const s=blankOut(wCtx(w),w.e);h+=`<div class="am-card"><p class="hint center" style="margin:0">איזו מילה חסרה? (${esc(w.h)})</p><div class="ctx" style="font-size:1.15rem;color:var(--ink)">${esc(s||'_____')}</div></div>`}
    else h+=`<div class="am-card"><p class="hint center" style="margin:0">איך אומרים באנגלית?</p><div class="m" style="font-size:1.5rem">${esc(w.h)}</div></div>`;
    /* hint ladder */
    const hs=[];if(hint>=1&&w.as)hs.push('💡 '+bdiEsc(w.as));if(hint>=2&&task!=='en2he')hs.push('האות הראשונה: <bdi dir="ltr" style="font-family:var(--en);font-size:1.2rem;letter-spacing:3px">'+esc(w.e[0]+w.e.slice(1).replace(/[A-Za-z]/g,'_ '))+'</bdi>');
    if(hint>=3&&task==='he2en'){const s=blankOut(w.my||ctx,w.e);if(s)hs.push('<bdi style="font-family:var(--en)">'+esc(s)+'</bdi>')}
    if(hs.length)h+=`<div class="am-hints">${hs.map(x=>`<div class="am-hint">${x}</div>`).join('')}</div>`;
    if(!res&&task!=='mc'&&task!=='hecl'){h+=`<input class="am-in ${task==='en2he'?'':'en'}" id="wAns" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${task==='en2he'?'הפירוש בעברית':'כתבי את המילה באנגלית'}">
      <div class="am-nav"><button class="btn secondary" id="wHint" ${hint>=(task==='en2he'?2:3)?'disabled':''}>💡 רמז ${hint?'נוסף':''}</button><button class="btn" id="wGo">בדיקה</button></div>
      <button class="link" id="wGive" style="align-self:center">לא זוכרת – הראי לי</button>${EXB('<b>בדיקה</b> – בודק מה כתבת (טעות הקלדה קטנה נחשבת). <b>💡 רמז</b> – כל לחיצה נותנת רמז נוסף: האסוציאציה, האות הראשונה, המשפט שלך עם חור. רמז לא מקדם שלב. <b>לא זוכרת</b> – מראה את התשובה, ואז כותבים אותה פעם אחת.')}`}
    else if(res){
      if(task==='hecl'||task==='mc'){const c=wCard(w),full=task==='hecl'?(c&&c.s):(WS.mode==='r2'?(wCtx(w)||wOther(w)):(wOther(w)||wCtx(w)));if(full)h+=`<div class="am-box"><p dir="ltr" style="margin:0;text-align:left;font-family:var(--en)">${SAYB(full,'sm inl')}${esc(full)}</p></div>`}
      h+=`<p class="am-fb ${res.ok?'ok':'bad'}">${res.ok?(res.near?'כמעט מושלם ✓':'נכון! ✓'):res.self?'':'עוד לא – הנה התשובה:'}</p>
        <div class="am-card"><div class="w"><button class="spk" data-amsay="${esc(w.e)}">${SPK}</button><span>${esc(w.e)}</span></div><div class="m">${esc(w.h)}</div>${res.typed?`<p class="hint center" style="margin:0">כתבת: <bdi>${esc(res.typed)}</bdi></p>`:''}${w.as?`<div class="am-hint">💡 ${bdiEsc(w.as)}</div>`:''}${w.my?`<div class="ctx">${SAYB(w.my,'sm inl')}✍️ ${esc(w.my)}</div>`:''}</div>`;
      if(!res.ok)h+=wMethodBox(w);
      if(res.self)h+=`<p class="center" style="margin:0">הפירוש שכתבת נכון?</p><div class="am-nav"><button class="btn" id="wSelfY">✓ כן, התכוונתי לזה</button><button class="btn secondary" id="wSelfN">✗ לא</button></div>`;
      else if(!res.ok&&!res.copied)h+=`<div class="am-step-box"><h4>כתבי את המילה פעם אחת כדי לחזק</h4><input class="am-in en" id="wCopy" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(w.e)}"></div>`;
      else{if(step==='first')h+=`<div class="am-box good"><h4>מה יקרה עכשיו עם המילה?</h4><p>✓ היא נכנסה ללמידה. המסלול שלה:</p><div class="am-next"><span>בסוף הסבב · בחירה במשפט</span><span>20 דק׳ · משפט בעברית</span><span>מחר · כתיבה</span><span>3 ימים · משפט חדש</span><span>שבוע · הפירוש בעברית</span><span>שבועיים · בחירה במשפט חדש</span><span>חודש · כתיבה</span><span>🏆 נלמדה</span></div><p class="hint" style="margin:0">טעות מחזירה אותה קצת אחורה, כדי שתחזור מוקדם יותר.</p></div>`;
        h+=`<div class="am-cta"><button class="btn" id="wOn">${WS.i+1<WS.list.length||WS.again||WS.mode==='new'?'המילה הבאה ←':'סיום'}</button></div>`}}
  }
  h+='</div>';app.innerHTML=h;
  $('bk').onclick=()=>{wSave();go({screen:WS.from||'amw'})};
  wBind(w,x)}
function wStageDots(w){return [1,2,3,4,5,6].map(i=>w.st>i?'●':w.st===i?'◉':'○').join('')}
function wIdeas(w){const k='as|'+wK(w),ai=AMAI[k];let h='';
  if(ai&&ai.ideas)h+=ai.ideas.map(i=>`<button class="am-idea${w.as===i.scene?' on':''}" data-as="${esc(i.scene)}"><small>${esc(i.sound||'')}</small>${bdiEsc(i.scene)}${i.link?`<small>${bdiEsc(i.link)}</small>`:''}</button>`).join('');
  if(ai&&ai.err)h+=`<p class="hint">${esc(ai.err)}</p>`;
  h+=AIP[k]?'<p class="hint">⏳ ממציאה אסוציאציות…</p>':(GKEY()?`<button class="btn secondary" id="wGen">✨ ${ai&&ai.ideas?'עוד 3 אסוציאציות':'3 אסוציאציות ייחודיות'}</button>`:'');
  return h}
function wBind(w,x){
  app.querySelectorAll('[data-as]').forEach(b=>b.onclick=()=>{w.as=b.dataset.as;w.t=amNow();amSave();amRedrawKeep()});
  const ta=$('wAs');if(ta)ta.oninput=()=>{w.as=ta.value.trim();w.t=amNow();clearTimeout(ta._t);ta._t=setTimeout(amSave,500);$('wNext').disabled=!w.as;app.querySelectorAll('.am-idea.on').forEach(e=>e.classList.remove('on'))};
  const gn=$('wGen');if(gn)gn.onclick=()=>{const k='as|'+wK(w),old=((AMAI[k]||{}).ideas||[]).map(i=>i.scene).concat(AMAI[k]&&AMAI[k].seen||[]).slice(-9);const seen=old;delete AMAI[k];
    const p=aiCached(k,promptAssoc(w,old),1);amRedrawKeep();p.then(r=>{if(r&&!r.err){r.seen=seen;amAiSave()}if(S.screen==='amwl')amRedrawKeep()})};
  const kw=$('wKnow');if(kw)kw.onclick=()=>{wLog(w,'known',1,0);wMaster(w);w.t=amNow();const nq=wQueue(1)[0];
    if(nq){if(nq.fresh)wAdd(nq.e,nq.h,nq.c,nq.src,nq.k);const k=wK(nq);if(!WS.list.includes(k))WS.list.push(k)}
    amSave();WS.i++;WS.step='meet';wSave();draw();window.scrollTo(0,0)};
  const nx=$('wNext');if(nx)nx.onclick=()=>{if(!w.as)return;if(WS.assocOnly){w.t=amNow();amSave();WS=null;wSave();go({screen:'amwd'});return}if(!w.log||!w.log.length){wLog(w,'learn',1,0);amSave()}WS.step='first';WS.hint=0;WS.res=null;wSave();draw();window.scrollTo(0,0)};
  const my=$('wMy');if(my){my.oninput=()=>{WS.draft=my.value;WS.chk=null;wSave()};if(!WS.draft)setTimeout(()=>{try{my.focus({preventScroll:true})}catch(e){}},50)}
  const ck=$('wChk');if(ck)ck.onclick=async()=>{const t=(WS.draft||'').trim();if(!t)return;if(!GKEY()){WS.chk={err:'צריך מפתח ג׳מיני כדי לבדוק. אפשר לשמור גם בלי בדיקה.'};return draw()}
    WS.busy=true;draw();const r=await aiRun('','',null,{prompt:promptSent(w,t),temp:.2});WS.busy=false;WS.chk=r&&r.j?r.j:{err:aiWhyText(r&&r.why)};wSave();if(S.screen==='amwl')amRedrawKeep()};
  const sv=$('wSaveS');if(sv)sv.onclick=()=>{let t=(WS.draft||'').trim();const c=WS.chk;if(c&&!c.ok&&c.corrected)t=c.corrected;if(!t){my&&my.focus();return}
    w.my=t;w.mys=(w.mys||[]).filter(x=>x!==t).concat(t).slice(-6);w.t=amNow();WS.draft='';WS.chk=null;
    if(WS.sentOnly){amSave();WS=null;wSave();go({screen:'amwd'});return}
    if(WS.step==='write'){WS.step='first';WS.hint=0;WS.res=null;amSave();wSave();draw();window.scrollTo(0,0)}
    else{wGrade(w,true,0);wNextWord()}};
  const ans=$('wAns');if(ans){setTimeout(()=>{try{ans.focus({preventScroll:true})}catch(e){}},50);ans.onkeydown=e=>{if(e.key==='Enter')$('wGo').click()}}
  const hb=$('wHint');if(hb)hb.onclick=()=>{WS.hint=(WS.hint||0)+1;wSave();amRedrawKeep()};
  const task=wTaskNow(w);
  const gb=$('wGo');if(gb)gb.onclick=()=>{const v=(ans.value||'').trim();if(!v)return;
    if(task==='en2he'){if(heMatch(v,w.h))WS.res={ok:true,typed:v};else WS.res={self:true,typed:v};}
    else{const a=v.toLowerCase().replace(/[^a-z' \-]/g,''),e=w.e.toLowerCase(),dd=lev(a,e);const ok=a===e||dd<=(e.length>=6?1:0);WS.res={ok,near:ok&&a!==e,typed:v}}
    if(!WS.res.self)wAfter(w,WS.res.ok);wSave();draw()};
  const gv=$('wGive');if(gv)gv.onclick=()=>{WS.res={ok:false};wAfter(w,false);wSave();draw()};
  app.querySelectorAll('[data-wmc]').forEach(b=>b.onclick=()=>{if(WS.res)return;const v=b.dataset.wmc,ok=v===w.e;WS.res={ok,typed:v};wAfter(w,ok);wSave();draw()});
  const sy=$('wSelfY');if(sy)sy.onclick=()=>{WS.res={ok:true,typed:WS.res.typed};wAfter(w,true);wSave();draw()};
  const sn=$('wSelfN');if(sn)sn.onclick=()=>{WS.res={ok:false,typed:WS.res.typed};wAfter(w,false);wSave();draw()};
  const cp=$('wCopy');if(cp){setTimeout(()=>{try{cp.focus({preventScroll:true})}catch(e){}},50);cp.oninput=()=>{if(cp.value.trim().toLowerCase()===w.e.toLowerCase()){WS.res.copied=true;wSave();draw()}}}
  const on=$('wOn');if(on)on.onclick=wNextWord}
function wNextWord(){WS.i++;WS.step=WS.mode==='new'?'meet':'recall';WS.hint=0;WS.res=null;WS.chk=null;WS.draft='';
  /* after all the new words: a second quick round of all of them (short-term memory), then the missed ones */
  if(WS.i>=WS.list.length&&WS.mode==='new'&&(WS.counted||[]).length){WS.list=WS.list.concat(shuffle(WS.counted));WS.mode='r2';WS.step='recall';WS.r2at=WS.i}
  else if(WS.i>=WS.list.length&&WS.mode==='r2'){WS.mode='rev'}
  /* words missed in this session come once more at the end (practice only – they are due again tomorrow anyway) */
  if(WS.i>=WS.list.length&&WS.again&&WS.again.length){WS.re=(WS.re||[]).concat(WS.again);WS.list=WS.list.concat(WS.again);WS.again=[];WS.mode='rev';WS.step='recall'}
  if(WS.i>=WS.list.length&&WS.mode==='r2')WS.mode='rev';
  wSave();draw();window.scrollTo(0,0)}
/* result of a recall: the stage goes up (a hint keeps it), a miss goes back and comes again at the end of this session */
function wAfter(w,ok){
  if(WS.mode==='r2'){/* second round of the new words, same session: practice only */wLog(w,'r2',ok?1:0,WS.hint||0);w.t=amNow();if(!ok&&!(WS.again||[]).includes(wK(w)))WS.again=(WS.again||[]).concat(wK(w));if(ok)WS.ok=(WS.ok||0)+1;amSave();return}
  if(WS.step==='first'){/* the first recall right after learning */
    wLog(w,'first',ok?(WS.hint?.5:1):0,WS.hint||0);if(ok)w.ok=(w.ok||0)+1;else w.bad=(w.bad||0)+1;w.st=1;w.due=amNow()+WINT[1];w.t=amNow();AMS.nd[dayKey()]=(AMS.nd[dayKey()]||0)+(WS.counted&&WS.counted.includes(wK(w))?0:1);WS.counted=(WS.counted||[]).concat(wK(w));
    if(!ok){WS.again=(WS.again||[]).filter(k=>k!==wK(w)).concat(wK(w))}amSave();return}
  wGrade(w,ok,WS.hint||0)}
function wGrade(w,ok,hint){const k=wK(w),task=wTask(w);
  if((WS.re||[]).includes(k)){wLog(w,'re',ok?1:0,hint);w.t=amNow();if(ok)WS.ok=(WS.ok||0)+1;amSave();return}
  wLog(w,task,ok?(hint?.5:1):0,hint);
  /* right without a hint: one stage up; with a hint: same stage again; wrong: two stages back and again in 20 minutes */
  if(ok){w.ok=(w.ok||0)+1;if(!hint)w.st=Math.min(WMAST,w.st+1);if(w.st>=WMAST)wMaster(w);else w.due=amNow()+WINT[w.st]}
  else{w.bad=(w.bad||0)+1;w.st=Math.max(1,w.st-2);w.due=amNow()+WINT[1];if(!(WS.again||[]).includes(k))WS.again=(WS.again||[]).concat(k)}
  w.t=amNow();if(ok)WS.ok=(WS.ok||0)+1;else WS.bad=(WS.bad||0)+1;amSave()}
function wDone(){const n=WS?WS.list.length:0;
  app.innerHTML=`<div class="screen">${amNav(WS&&WS.from||'amw','חזרה')}
    <p class="am-big">🎉</p><h2 class="center">סיימת את הסבב!</h2>
    <p class="center sub">${n} מילים${WS&&WS.ok?` · ${WS.ok} נשלפו נכון`:''}.</p>
    <div class="am-box"><h4>מה עכשיו?</h4><p>המילים יחזרו אלייך ב"חזרה פעילה" – הראשונה בעוד 20 דקות, ואז מחר, בעוד 3 ימים, שבוע, שבועיים וחודש. אין צורך לחזור עליהן לפני כן.</p><p class="hint" style="margin:0">את כל המילים, מתי כל אחת חוזרת והיומן שלה – ב"מילים ← המילים שלי".</p></div>
    <button class="btn" id="wBack">חזרה</button></div>`;
  amBindNav();$('wBack').onclick=()=>{const f=WS&&WS.from||'amw';WS=null;wSave();go({screen:f})}}

/* ================= methods (from the course book) ================= */
const AMM={
 score:['מה המבחן בודק ולמה זה חשוב',`<p>הציון באנגלית הוא בין 50 ל־150, ומשקלו 20% מהציון הפסיכומטרי. הוא גם קובע את רמת האנגלית באוניברסיטה:</p>
  <table><tr><th>ציון</th><th>משמעות (בדרך כלל)</th></tr><tr><td>מתחת ל־85</td><td>לא מאפשר קבלה לרוב המוסדות</td></tr><tr><td>85–100</td><td>כ־3 קורסי אנגלית בתואר</td></tr><tr><td>101–119</td><td>כ־2 קורסים</td></tr><tr><td>120–133</td><td>קורס אחד</td></tr><tr><td>134 ומעלה</td><td>פטור</td></tr></table>
  <p>כל פרק אנגלית: 22 שאלות ב־20 דקות. השאלות בהשלמת משפטים ובניסוח מחדש מסודרות מהקלה לקשה; בהבנת הנקרא – לפי סדר הקטע.</p>`],
 gen:['עקרונות לכל הפרק',`<p>הפרק: 22 שאלות ב־20 דקות – 8 השלמת משפטים (≈4 דק׳), 4 ניסוח מחדש (≈4 דק׳), 2 קטעי קריאה עם 5 שאלות כל אחד (≈12 דק׳). פחות מדקה לשאלה.</p>
  <ol><li><b>עיקר וטפל</b> – לא כל הטקסט חשוב. בהבנת הנקרא קוראים לעומק רק את המשפטים שעליהם שואלים.</li>
  <li><b>היגיון במקום ידע</b> – גם בלי להכיר מילה אפשר לפסול תשובות שלא מתאימות להיגיון (Doctors… physicians).</li>
  <li><b>מבנה ולוגיקה</b> – מילות קישור (but, although, because…) מגלות את הקשר בין חלקי המשפט; התשובה הנכונה חייבת לשמר אותו.</li>
  <li><b>לעצור לפני התשובות</b> – קוראים, מעבדים, ובהשלמת משפטים אף מוצאים תשובה בעצמנו – ורק אז מסתכלים על ארבע האפשרויות.</li></ol>`],
 sc:['השלמת משפטים',`<ol><li>קוראים את המשפט ומתרגמים בראש לעברית – <b>בלי להסתכל על התשובות</b>.</li><li>מוצאים את הרמז: מילת קישור, או מילה שההשלמה צריכה להתאים לה / להיות הפוכה לה.</li><li>חושבים על השלמה בעברית.</li><li>רק עכשיו עוברים על התשובות ומחפשים מילה במשמעות דומה.</li><li>קוראים את המשפט השלם עם התשובה כדי לוודא שהוא הגיוני.</li></ol>
  <p><b>דגשים:</b> השאלות לא בודקות ידע כללי – בכל שאלה יש רמז. אין קשר של משמעות בין 4 התשובות (לא נרדפות ולא הפכים), ויש רק תשובה אחת שמתאימה בכלל. כל התשובות מאותו חלק דיבר. השאלות מסודרות מהקלה לקשה.</p>
  <p><b>מילים לא מוכרות:</b> מפרקים לתחילית + שלד (+ סופית). את התחיליות – לדעת, את הסופיות – להכיר.</p>`],
 rs:['ניסוח מחדש',`<ol><li>קוראים את המשפט, מתרגמים ומבינים את המבנה: על מי מדובר, מה נאמר עליו, ומה הקשר בין החלקים.</li><li>מסמנים את מילות הקישור ומפרידים חלקים בלוכסן.</li><li>עוברים על התשובות ו<b>פוסלים</b>.</li><li>גם כשמוצאים תשובה שנראית נכונה – ממשיכים לפסול את השאר (אם יש זמן).</li><li>אם פסלת 3 – קוראים גם את הרביעית עד הסוף כדי לוודא.</li></ol>
  <p><b>איך פוסלים:</b></p><ul><li><b>מידע נוסף</b> – משהו שלא כתוב במקור (כולל "סלט מילים": אותן מילים אבל מי עושה מה התחלף).</li><li><b>מבנה / קשר אחר</b> – המקור בניגוד והתשובה בסיבה? נפסלת. גם סימני פיסוק יוצרים קשר.</li><li><b>הקצנה / נחרצות</b> – "ברוב המקרים" שהפך ל"תמיד", may שהפך ל־will.</li><li><b>סתירה</b>, ו<b>היפוך סיבה ותוצאה</b>.</li><li><b>מידע חסר</b> – נפסלת רק אם יש תשובה מלאה יותר.</li></ul>
  <p><b>איך מנסחים מחדש (ככה נראית התשובה הנכונה):</b> שינוי סדר מילים, מילים נרדפות, החלפת מילים באותה משמעות, שינוי מבנה (פעיל ↔ סביל).</p>
  <p><b>ארגז כלים:</b> "בלוק נשאר בלוק" – שמות, מילים קשות במכוון ורשימות לא חייבים להבין; מחליפים באות (A) וממשיכים. אפשר גם להבין מילה דרך התשובות.</p>`],
 rc:['הבנת הנקרא',`<p>2 קטעים, 5 שאלות כל אחד, כ־6 דקות לקטע. השאלות לפי סדר הקטע. הקטע הראשון קל יותר. הפסקה האחרונה אינה סיכום.</p>
  <p><b>תמיד:</b> שאלה כללית – משאירים לסוף. שאלה ספציפית (מילה/שורה/פסקה) – פותרים מיד. משפט = מנקודה עד נקודה, לא שורה.</p>
  <table><tr><th>סוג</th><th>איך מזהים</th><th>איך פותרים / מסיחים</th></tr>
  ${Object.entries({main:'main purpose of the text / a good title',para:'the second paragraph mainly…',detail:'according to… / EXCEPT',func:'mentions X in order to / is used to',infer:'it can be inferred / understood',vocab:'"X" (line 5) could be replaced by',refer:'"it" (line 3) refers to'}).map(([k,e])=>`<tr><td><b>${RCT[k][0]}</b></td><td class="en">${e}</td><td>${RCT[k][1]}</td></tr>`).join('')}</table>`],
 conn:['מילות קישור',`<table><tr><th>קשר</th><th>מילים</th><th>מה זה אומר</th></tr>${CONN.map(([he,k,ws,tip])=>`<tr><td><b class="cn cn-${k}">${he}</b></td><td class="en">${ws.join(', ')}</td><td>${tip}</td></tr>`).join('')}</table>`],
 pre:['תחיליות וסופיות',`<table><tr><th>תחילית</th><th>משמעות</th><th>דוגמה</th></tr>${[['un-, in-, im-, il-, ir-, dis-, non-','לא / ההפך','unhappy, impossible, illegal, irregular, dislike'],['mis-','בטעות / לא נכון','misunderstand'],['re-','שוב / בחזרה','rebuild, return'],['pre-','לפני','predict, prehistoric'],['post-','אחרי','postwar'],['over- / under-','יותר מדי / פחות מדי','overweight, underpaid'],['inter-','בין','international'],['trans-','מעבר','transport'],['sub-','מתחת','submarine'],['super-','מעל / על','supervise'],['co-, con-, com-','ביחד','cooperate, combine'],['anti-','נגד','antibiotic'],['auto-','עצמי','automatic'],['multi-, poly-','הרבה','multinational'],['mono-, uni-','אחד','monotone, uniform'],['bi-','שניים','bicycle'],['semi-','חצי','semicircle'],['ex-','החוצה / לשעבר','export, ex-wife'],['de-','הורדה / הסרה','decrease'],['mal-','רע','malfunction']].map(r=>`<tr><td class="en"><b>${r[0]}</b></td><td>${r[1]}</td><td class="en">${r[2]}</td></tr>`).join('')}</table>
  <table style="margin-top:10px"><tr><th>סופית</th><th>מה היא עושה</th><th>דוגמה</th></tr>${[['-less','בלי','useless, tasteless'],['-ful','מלא ב־','careful'],['-able, -ible','אפשר ל־','readable, visible'],['-ly','תואר הפועל (באופן…)','quickly'],['-tion, -ment, -ness, -ity','שם עצם','decision, development, kindness, ability'],['-er, -or, -ist','מי שעושה','teacher, actor, artist'],['-ize, -ify, -en','פועל (לעשות ל…)','modernize, simplify, widen'],['-ous, -al, -ive','שם תואר','dangerous, natural, active']].map(r=>`<tr><td class="en"><b>${r[0]}</b></td><td>${r[1]}</td><td class="en">${r[2]}</td></tr>`).join('')}</table>`],
 mem:['איך זוכרים מילים באמת',`<p>הסתכלות חוזרת על מילה לא בונה זיכרון. מה שבונה – <b>שליפה פעילה</b>: להוציא את המילה מהראש בעצמך, עם מאמץ.</p>
  <ol><li><b>אסוציאציה צלילית (keyword):</b> מילה עברית שנשמעת כמו האנגלית + תמונה מוזרה, מצחיקה או רגשית שמחברת אותה לפירוש. ככל שהתמונה ספציפית ומשוגעת יותר – היא נשארת. כדאי לדמיין אותה 5 שניות.</li>
  <li><b>משפט על החיים שלך:</b> מילה שמשתמשים בה במשפט אישי נקשרת לזיכרונות קיימים.</li>
  <li><b>מעברית לאנגלית:</b> לכתוב את המילה כשרואים רק את הפירוש – הכי קשה, ולכן הכי מחזק.</li>
  <li><b>השלמה במשפט שלך:</b> המשפט שכתבת עם חור במקום המילה.</li>
  <li><b>רמזים בהדרגה:</b> קודם האסוציאציה, אחר כך האות הראשונה – רק אם תקועה. מאמץ קטן = זיכרון חזק.</li>
  <li><b>מרווחים גדלים:</b> יום ← 3 ימים ← שבוע ← שבועיים ← חודש. טעות מחזירה את המילה אחורה.</li>
  <li><b>מעט בכל יום:</b> 8 מילים לעומק ביום עדיפות על 100 בהעפת עין. 15–20 דקות, בלי לדלג ימים.</li>
  <li><b>מילים מהשאלות:</b> המילים שנתקלת בהן בשאלות האמירנט הן בדיוק מה שהמבחן בודק – להוסיף אותן מיד.</li></ol>`]};
const AMMI={score:'🎓',gen:'🧭',sc:'✏️',rs:'🔁',rc:'📖',conn:'🔗',pre:'🧬',basics:'🧱',mem:'🧠'};
function amMethods(){
  app.innerHTML=`<div class="screen am-scr">
    ${amNav('am','אמירנט')}
    <div class="am-title"><span class="gi g-s">🧭</span><div><h2>שיטות</h2><p>מהספרים שצירפת – כל נושא בעמוד משלו.</p></div></div>
    ${Object.entries(AMM).map(([k,[t]])=>`<button class="am-card2 g-s" data-tab="${k}"><span class="gi">${AMMI[k]||'📘'}</span><span class="grow"><b>${t}</b>${EX(AMMD[k]||'','')}</span></button>`).join('')}
  </div>`;amBindNav();app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>go({screen:'ammt',amTab:b.dataset.tab}))}
const AMMD={score:'מבנה המבחן וכמה הציון באנגלית חשוב (פטור, קורסים).',gen:'4 העקרונות שתקפים לכל שאלות האנגלית.',sc:'השיטה להשלמת משפטים: לחשוב לפני התשובות.',rs:'השיטה לניסוח מחדש: מבנה, מילות קישור, ואיך פוסלים.',rc:'7 סוגי שאלות בהבנת הנקרא – איך מזהים ואיך פותרים כל אחד.',conn:'טבלת מילות הקישור לפי סוג הקשר (ניגוד, סיבה…).',pre:'מה אומרות התחיליות והסופיות + הטבלה המלאה מהקובץ.',basics:'פעלים מורכבים, ביטויים ומילים מבלבלות.',mem:'למה הסתכלות לא מספיקה, ומה כן עובד לזיכרון.'};
function amMethod(){const k=S.amTab||'gen',M=AMM[k];if(!M)return go({screen:'amm'});
  if(k==='pre'&&!AMD)return amLoading();
  const keys=Object.keys(AMM),i=keys.indexOf(k),nx=keys[i+1];
  app.innerHTML=`<div class="screen am-scr am-m">
    ${amNav('amm','שיטות')}
    <div class="am-title"><span class="gi g-s">${AMMI[k]||'📘'}</span><div><h2>${M[0]}</h2></div></div>
    <div class="am-box">${M[1]}${k==='pre'?amPxTables():''}</div>
    ${nx?`<button class="am-card2 g-s" data-tab="${nx}"><span class="gi">${AMMI[nx]||'📘'}</span><span class="grow"><small>הנושא הבא</small><b>${AMM[nx][0]}</b></span></button>`:''}
  </div>`;amBindNav();app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{go({screen:'ammt',amTab:b.dataset.tab})})}
function amPxTables(){const P=AMD.px||{pre:[],suf:[]};const tb=(L,t)=>`<h4 style="margin-top:12px">${t} (${L.length})</h4><table><tr><th>${t==='תחיליות'?'תחילית':'סופית'}</th><th>פירוש</th><th>דוגמה</th></tr>${L.map(e=>`<tr><td class="en"><b>${esc(e.p)}</b></td><td>${esc(e.h)}</td><td>${e.ex.map(([en,he])=>`<span dir="ltr" style="font-family:var(--en)">${esc(en)}</span> – ${esc(he)}`).join('<br>')}</td></tr>`).join('')}</table>`;
  return `<p class="hint">מהקובץ "תחיליות וסופיות באנגלית". במילים שבנויות מתחילית או סופית מוכרת, הפירוק מופיע כ"טיפ מהשיטה" ליד האסוציאציה.</p>`+tb(P.pre,'תחיליות')+tb(P.suf,'סופיות')}

/* ================= ⓘ help: one topic per page ================= */
const AMHELP={
 overview:['🧭','מה יש באפליקציה','כללי',`<p>יש כאן שתי אפליקציות. בוחרים ביניהן בעמוד הפתיחה:</p>
  <ul><li><b>📚 מילון אנגלית</b> – כל המילים לפי רמות, בחנים, כרטיסיות, מצב רכב ומשפטים לשיעור הפרטי.</li>
  <li><b>🎯 הכנה לאמירנט</b> – שאלות מהמבחן לפי השיטה, חקירת טעויות, ולמידת מילים פעילה עם חזרות בזמן הנכון.</li></ul>
  <p>בכל מסך יש כפתור <b>i</b> למעלה – הוא פותח את ההסבר של המסך שאת נמצאת בו.</p>
  <p>הכול נשמר אוטומטית ומסתנכרן בין המכשירים שלך.</p>`],
 daily:['🎯','הסבב היומי','אמירנט',`<p>במסך הבית יש טבעת עם 3 צעדים קבועים לכל יום. <b>▶ להמשיך</b> לוקח אותך תמיד לצעד הבא:</p>
  <ol><li><b>🔁 חזרה פעילה</b> – מילים שהגיע זמנן ממשיכות במסלול שלהן.</li><li><b>🌱 מילים חדשות</b> – כמה מילים ביום (את קובעת), כל אחת נכנסת למסלול.</li><li><b>✏️ תרגול שאלות</b> – היחידה הבאה, שאלה אחרי שאלה במסלול של שאלה (נחשב בוצע אחרי 8 שאלות ביום).</li></ol>
  <p>15–30 דקות ביום מספיקות. עדיף כל יום קצת.</p>`],
 questions:['✏️','תרגול שאלות','אמירנט',`<p>שלושה סוגים כמו במבחן: <b>השלמת משפטים</b>, <b>ניסוח מחדש</b>, <b>הבנת הנקרא</b> – 20 יחידות מהקורס + 4 פרקים מהספר "חזרות וניהול זמנים".</p>
  <p>ריבוע ירוק = יחידה שסיימת (המספר = כמה נכון). <b>⏱ סימולציה</b> – 22 שאלות ב־20 דקות, בלי עזרה, כמו במבחן; בסוף אפשר לפתוח כל שאלה ולעבור עליה את המסלול. <b>📝 הלקחים שלי</b> – כל מה ששמרת מחקירת טעויות.</p>`],
 flow:['🪜','המסלול של שאלה','אמירנט',`<ol><li><b>חושבים לפני התשובות</b> – בהשלמת משפטים מנחשים בעברית מה חסר; בניסוח מחדש מזהים מילות קישור; בהבנת הנקרא מופיע סוג השאלה והטכניקה.</li>
  <li><b>בוחרים</b> – בניסוח מחדש ובהבנת הנקרא אפשר לפסול תשובות עם סיבה (✗ מידע נוסף, הקצנה…).</li>
  <li><b>✓ תשובה</b> – נכון / לא נכון, ותרגום מהספר.</li>
  <li><b>🔍 חקירת הטעות</b> – רק אם טעית, ומיד: מה קרה, ניתוח אישי, ולקח במשפט אחד. אין "תיקון טעויות" לאחר כך – הכול נסגר כאן.</li>
  <li><b>🧭 איך פותרים לפי השיטה</b> – תמיד, גם כשצדקת: מילות הקישור / סוג השאלה, ההסבר מהספר, והסבר צעד אחר צעד.</li>
  <li><b>📚 מילים מהשאלה</b> – המילים מהשאלה שנמצאות במאגר (בלי תרגום). ➕ מכניס אותן לתור הלמידה; בסוף התרגול אפשר ללמוד אותן מיד.</li></ol>
  <p>מילים עם קו מנוקד בשאלה = מילים מהמאגר. לחיצה על מילה = פירוש. 🔊 = השמעה. מילים צבועות = מילות קישור.</p>`],
 lessons:['📝','הלקחים שלי','אמירנט',`<p>בכל חקירת טעות אפשר לשמור משפט אחד – <b>הלקח</b>. כאן כל הלקחים מקובצים לפי סוג הטעות.</p><p>טיפ: לקרוא אותם לפני כל סימולציה.</p>`],
 words:['🧠','מילים','אמירנט',`<p>כאן אין סקשנים נפרדים – כל מילה עוברת <b>מסלול קבוע</b> (ראי "המסלול של מילה"). יש רק 3 כפתורים:</p>
  <ul><li><b>🔁 חזרה פעילה</b> – המילים שהגיע זמנן ממשיכות לשלב הבא במסלול.</li><li><b>🌱 מילים חדשות</b> – מילים חדשות מתחילות את המסלול. קודם מילים שהוספת מהשאלות, אחר כך מילים שסימנת ✗ במילון, ואז מילים שלא סימנת.</li><li><b>📒 המילים שלי</b> – איפה כל מילה במסלול, היומן שלה וההמלצה.</li></ul>`],
 learn:['🌱','איך לומדים מילה חדשה','אמירנט',`<p>3 שלבים, כ־2 דקות למילה:</p>
  <ol><li><b>הכרות</b> – המילה, <b>פירוש אחד</b>, משפט לדוגמה (🔊), ו<b>אסוציאציה</b>: מהמילון, מג׳מיני (✨) או משלך. לפעמים גם 🧭 טיפ מהשיטה (תחילית, מילת קישור, מילה שקל לבלבל).</li>
  <li><b>שליפה</b> – רואים את הפירוש בעברית וכותבים את המילה באנגלית.</li>
  <li><b>בחירה במשפט</b> – בסוף הסבב, אחרי כל המילים החדשות: משפט עם מקום ריק, ובוחרים מבין 4 מילים (המילים מהסבב).</li></ol>
  <p><b>מילה עם כמה פירושים</b> – כל פירוש נלמד בנפרד. <b>רמזים</b> כשנתקעים: האסוציאציה ← האות הראשונה ← משפט עם חור.</p>`],
 journey:['🛤','המסלול של מילה','אמירנט',`<p><b>למידה (באותו יום):</b> 1 הכרות ← 2 שליפה (כתיבה באנגלית) ← 3 בחירה במשפט מתוך 4.</p>
  <p><b>חזרות – כל פעם תרגיל אחר, במרווחים שגדלים:</b></p>
  <ol><li><b>אחרי 20 דקות</b> – משפט <b>בעברית</b> עם מקום ריק: בוחרים את המילה באנגלית מתוך 4.</li>
  <li><b>אחרי יום</b> – רואים את הפירוש וכותבים את המילה באנגלית.</li>
  <li><b>אחרי 3 ימים</b> – <b>משפט חדש באנגלית</b> (מהשאלות, הקטעים או הספרים) – כותבים את המילה החסרה.</li>
  <li><b>אחרי שבוע</b> – רואים את המילה וכותבים מה הפירוש בעברית.</li>
  <li><b>אחרי שבועיים</b> – משפט חדש באנגלית, בוחרים מתוך 4.</li>
  <li><b>אחרי חודש</b> – כתיבה באנגלית. הצלחה = 🏆 נלמדה, וסימון ✓ במילון.</li></ol>
  <p>הצלחה בלי רמז = שלב קדימה · עם רמז = אותו שלב שוב · טעות = שני שלבים אחורה ושוב בעוד 20 דקות (וגם בסוף הסבב). האפשרויות בבחירה הן מילים אחרות שאת לומדת – כך לומדים להבחין ביניהן.</p>`],
 mywords:['📒','המילים שלי','אמירנט',`<p>כל המילים שלך, עם לשוניות: <b>לחזרה</b> (הגיע זמנן), <b>בלמידה</b>, <b>קשות</b>, <b>נלמדו</b>, <b>מחכות</b>. הנקודות ●◉○ = באיזה שלב המילה (6 שלבים).</p>
  <p>לחיצה על מילה פותחת את העמוד שלה: מסלול החזרות ומתי הבאה, <b>היומן</b> (כל תרגול: מתי, איזה תרגיל, הצלחה / טעות / עם רמז), אחוז הצלחה, <b>המלצה אישית</b>, האסוציאציה (אפשר להחליף), משפט משלך (לא חובה), איפה פגשת אותה, ו"תרגול עכשיו".</p>
  <p>למטה בעמוד הרשימה: כמה מילים חדשות ביום.</p>`],
 basics:['🧱','יסודות','אמירנט',`<p>תרגילים מהספר "יסודות אנגלית" עם התשובות מהספר, ורשימות מילים (מילים מבלבלות, פעלים מורכבים, ביטויים…) שאפשר להוסיף ללמידה בלחיצה.</p>`],
 methods:['🧭','שיטות','אמירנט',`<p>השיטות מהספרים שלך, כל נושא בעמוד משלו: מבנה המבחן, עקרונות, איך פותרים כל סוג, מילות קישור, תחיליות וסופיות, וטכניקות זיכרון.</p>`],
 progress:['📊','ההתקדמות שלי','אמירנט',`<p>אחוז הצלחה וזמן ממוצע לכל סוג שאלה (מול היעד), מילים לפי שלב, כמה חזרות מחכות בכל יום בשבוע הקרוב, למה את טועה בדרך כלל, ותוצאות הסימולציות.</p>`],
 dict:['📚','מילון אנגלית','המילון',`<ul><li><b>רמות וקבוצות</b> – 10 רמות, קבוצות של 50 מילים. סימון ✓ / ✗ לכל מילה.</li>
  <li><b>בוחן</b> – כותבים פירוש ובוחרים; קריאה או שמיעה. בוחן לפי סימון (✗ / לא סומנו / ✓).</li>
  <li><b>כרטיסיות</b> – מעבר מהיר על מילים.</li><li><b>🚗 מצב רכב</b> – הקראה ברצף להאזנה בנסיעה, סימון בכפתורי ההגה.</li>
  <li><b>מצב רץ</b> – כל מילה מוקראת כשעוברים אליה.</li><li><b>✍️ מילים לשיעור פרטי</b> – הרשימות השבועיות, וכתיבת משפטים עם בדיקה חכמה.</li>
  <li><b>היעד היומי</b> – 240 סימונים ביום.</li></ul>`]};
const PAGEHELP={start:[],home:['dict'],am:['daily'],amqh:['questions','flow'],amu:['flow'],amls:['lessons'],amw:['words','journey','learn'],amwm:['mywords'],amwd:['mywords'],amm:['methods'],ammt:['methods'],amp:['progress']};
function amPageHelp(){if(S.screen==='amu')return S.amt==='ex'?['questions']:['flow'];return PAGEHELP[S.screen]||[]}
/* after drawing: the page's explanation boxes right under its title (💬 hides them) */
function amInjectHelp(){if(!AMEX)return;const ks=amPageHelp().filter(k=>AMHELP[k]);if(!ks.length)return;
  const at=app.querySelector('.am-title')||app.querySelector('.am-hero2')||app.querySelector('.home-head')||app.querySelector('.nav');if(!at)return;
  const box=document.createElement('div');box.className='am-pghelp';
  box.innerHTML=ks.map((k,j)=>{const [i,t,,b]=AMHELP[k];return `<details class="am-box am-help"${j===0&&!amHelpSeen(k)?' open':''} data-hseen="${k}"><summary>💬 ${i} ${t}</summary>${b}</details>`}).join('');
  at.after(box);box.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{if(!d.open)amHelpMark(d.dataset.hseen)}))}
/* an explanation she closed stays closed next time */
function amHelpSeen(k){try{return (JSON.parse(LS.get('dictHelpSeen')||'{}'))[k]}catch(e){return false}}
function amHelpMark(k){try{const o=JSON.parse(LS.get('dictHelpSeen')||'{}');o[k]=1;LS.set('dictHelpSeen',JSON.stringify(o))}catch(e){}}
function amHelp(){const k=S.hk,H=AMHELP[k];
  const back=()=>go({screen:S.hfrom&&S.hfrom!=='amhelp'?S.hfrom:'start'});
  if(k==='all'){app.innerHTML=`<div class="screen am-scr am-m"><div class="nav"><button class="back" id="bk">חזרה</button>${HOME}</div>
      <div class="am-title"><span class="gi g-p">📖</span><div><h2>כל ההסברים</h2><p>הסברים כלליים. ההסבר של כל מסך מופיע בראש המסך עצמו.</p></div></div>
      ${(()=>{const used=new Set(Object.values(PAGEHELP).flat().concat('basics','flow'));const gen=Object.keys(AMHELP).filter(k=>!used.has(k));
                return gen.map(k=>{const [i,t,,b]=AMHELP[k];return `<div class="am-box am-help"><h4>${i} ${t}</h4>${b}</div>`}).join('')})()}</div>`;
    app.querySelectorAll('[data-hk]').forEach(b=>b.onclick=()=>{S.hk=b.dataset.hk;persist();draw();window.scrollTo(0,0)});
    $('bk').onclick=back;return}
  if(!H){const grp={};Object.entries(AMHELP).forEach(([kk,[i,t,g]])=>(grp[g]=grp[g]||[]).push([kk,i,t]));
    app.innerHTML=`<div class="screen am-scr"><div class="nav"><button class="back" id="bk">חזרה</button>${HOME}</div>
      <div class="am-title"><span class="gi g-p">i</span><div><h2>מדריך</h2><p>כל נושא בעמוד משלו – או הכול ברצף.</p></div></div>
      <button class="am-card2 g-p" data-hk="all"><span class="gi">📖</span><span class="grow"><b>כל ההסברים בעמוד אחד</b><small>כל הפונקציות ותהליך הלמידה, לקרוא ברצף</small></span></button>
      ${Object.entries(grp).map(([g,arr])=>`<p class="lbl">${g}</p>${arr.map(([kk,i,t])=>`<button class="am-card2 g-p" data-hk="${kk}"><span class="gi">${i}</span><span class="grow"><b>${t}</b></span></button>`).join('')}`).join('')}</div>`;
    $('bk').onclick=back;app.querySelectorAll('[data-hk]').forEach(b=>b.onclick=()=>{S.hk=b.dataset.hk;persist();draw();window.scrollTo(0,0)});return}
  app.innerHTML=`<div class="screen am-scr am-m"><div class="nav"><button class="back" id="bk">חזרה</button>${HOME}</div>
    <div class="am-title"><span class="gi g-p">${H[0]}</span><div><h2>${H[1]}</h2><p>${H[2]}</p></div></div>
    <div class="am-box am-help">${H[3]}</div>
    <button class="am-card2 g-p" id="hAll"><span class="gi">☰</span><span class="grow"><b>רשימת כל הנושאים</b></span></button>
    <button class="am-card2 g-p" data-hk="all"><span class="gi">📖</span><span class="grow"><b>כל ההסברים בעמוד אחד</b></span></button></div>`;
  app.querySelectorAll('[data-hk]').forEach(b=>b.onclick=()=>{S.hk=b.dataset.hk;persist();draw();window.scrollTo(0,0)});
  $('bk').onclick=back;$('hAll').onclick=()=>{S.hk='';persist();draw();window.scrollTo(0,0)}}

/* opening screen: choose the dictionary or the אמירנט app */
function startScreen(){const k=DW.filter(known).length,td=dayCount(dayKey()),due=wDue().length,nl=Math.max(0,(AMS.n||8)-wNewToday()),mi=AMD?Object.keys(AMD.q).filter(amMistDue).length:0;
  app.innerHTML=`<div class="screen st-screen">
    <div class="home-head"><div><h1>מה לומדים היום? 👋</h1><p id="syncState" class="sync-state ${SYNC.state}">${syncLabel()}</p></div>${RELOADBTN}${EXTOG()}${INFOB('overview')}</div>
    <button class="st-app st-dict" id="stDict"><span class="st-i">📚</span><span class="st-t">מילון אנגלית</span><span class="st-d">${DW.length.toLocaleString()} פירושים · יודעת ${k.toLocaleString()} · היום ${td}/${GOAL}</span>${AMEX?'<span class="st-x">כל 4,000+ המילים לפי רמות: בחנים, כרטיסיות, מצב רכב, סימון ✓/✗, ומילים לשיעור הפרטי עם כתיבת משפטים.</span>':''}</button>
    <button class="st-app st-am" id="stAm"><span class="st-i">🎯</span><span class="st-t">הכנה לאמירנט</span><span class="st-d">${[due?due+' מילים לחזרה':'',nl?nl+' מילים חדשות':'',mi?mi+' טעויות לתיקון':''].filter(Boolean).join(' · ')||'תרגול שאלות לפי השיטה'}</span>${AMEX?'<span class="st-x">הכנה למבחן: שאלות מהספרים לפי השיטה, חקירת כל טעות, ולמידת מילים פעילה עם חזרות בזמן הנכון.</span>':''}</button>
    ${EXB('<b>i</b> למעלה = מדריך מלא לשתי האפליקציות. <b>💬</b> = הצגה / הסתרה של ההסברים הקטנים ליד כל כפתור (כמו זה).')}
  </div>`;
  $('stDict').onclick=()=>go({screen:'home'});$('stAm').onclick=()=>go({screen:'am'})}
function amHomeCard(){const due=wDue().length,nl=Math.max(0,(AMS.n||8)-wNewToday());
  const d=[due?due+' מילים לחזרה':'',nl?nl+' מילים חדשות':'אין מילים חדשות היום ✓'].filter(Boolean).join(' · ');
  return `<button class="item am-home" id="amGo"><span class="num">🎯</span><span class="grow"><span class="t">הכנה לאמירנט</span><br><span class="d">${d} · תרגול שאלות לפי השיטה</span></span><span class="chev" aria-hidden="true"><svg class="ai" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></span></button>`}
