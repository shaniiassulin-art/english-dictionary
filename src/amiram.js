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
/* sync merge: per question / per word the newer entry wins; attempt lists are joined */
function amMerge(a,b){a=a||{};b=b||{};const o={a:{},w:{},n:(b.t||0)>(a.t||0)?b.n||a.n||8:a.n||b.n||8,nd:{},t:Math.max(a.t||0,b.t||0)};
  for(const s of [a.a||{},b.a||{}])for(const k in s){const x=s[k],y=o.a[k];
    if(!y){o.a[k]=JSON.parse(JSON.stringify(x));continue}
    const h=[...(y.h||[])];(x.h||[]).forEach(r=>{if(!h.some(z=>z[3]===r[3]))h.push(r)});h.sort((p,q)=>p[3]-q[3]);
    o.a[k]=(x.t||0)>(y.t||0)?{...x,h}:{...y,h}}
  for(const s of [a.w||{},b.w||{}])for(const k in s)if(!o.w[k]||(s[k].t||0)>(o.w[k].t||0))o.w[k]=s[k];
  for(const s of [a.nd||{},b.nd||{}])for(const k in s)o.nd[k]=Math.max(o.nd[k]||0,s[k]);
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
/* every English word in a text as a tappable span; connectors found by connFind (cs) are coloured instead */
function tapEn(t,cs){t=String(t);const ph=[];
  (cs||[]).forEach(c=>c.ws.slice().sort((a,b)=>b.length-a.length).forEach(w=>{t=t.replace(new RegExp('(^|[^A-Za-z\u0001])('+w.replace(/ /g,'\\s+')+')(?=[^A-Za-z]|$)','gi'),(m,a,b)=>{ph.push('<b class="cn cn-'+c.k+'">'+esc(b)+'</b>');return a+'\u0001'+(ph.length-1)+'\u0002'})}));
  return t.split(/(\u0001\d+\u0002|[A-Za-z][A-Za-z'\-]*[A-Za-z]|[A-Za-z])/).map((x,i)=>{if(!(i%2))return esc(x);
    const m=x.match(/^\u0001(\d+)\u0002$/);if(m)return ph[+m[1]];
    return STOP.has(x.toLowerCase())||x.length<3?esc(x):`<span class="tw" data-tw="${esc(x)}">${esc(x)}</span>`}).join('')}
/* ---------- connectors: detected in the sentence, with what they tell us ---------- */
const CONN=[
  ['ניגוד','contrast',['but','although','though','even though','however','yet','while','whereas','despite','in spite of','nevertheless','nonetheless','rather than','instead','unlike','on the other hand','contrary to','even if'],'שני חלקי המשפט הפוכים זה לזה – ההשלמה צריכה להיות ההפך מהחלק השני.'],
  ['סיבה','cause',['because','since','due to','owing to','thanks to','because of','as a result of','for this reason'],'חלק אחד הוא הסיבה לשני – ההשלמה צריכה להתאים להיגיון של סיבה ותוצאה.'],
  ['תוצאה','result',['therefore','thus','hence','consequently','as a result','so that','thereby','accordingly','leading to','in order to'],'החלק השני נובע מהראשון – ההשלמה היא תוצאה הגיונית שלו.'],
  ['הוספה','addition',['also','moreover','furthermore','in addition','as well as','besides','not only','along with'],'החלקים באותו כיוון – ההשלמה ממשיכה את הרעיון (דומה, לא הפוכה).'],
  ['דוגמה','example',['for example','such as','for instance','including'],'מה שבא אחרי הוא דוגמה למה שלפני – ההשלמה היא שם הקטגוריה שהדוגמאות שייכות אליה.'],
  ['זמן','time',['when','before','after','until','once','as soon as','during','by the time','since'],'סדר זמנים – שימי לב מה קרה קודם ומה אחר כך.'],
  ['תנאי','condition',['if','unless','provided that','as long as','only if'],'משהו קורה רק בתנאי מסוים.'],
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
const AMTN={sc:'השלמת משפטים',rs:'ניסוח מחדש',rc:'הבנת הנקרא'};
const AMTI={sc:'✏️',rs:'🔁',rc:'📖'};
const AMTARGET={sc:30,rs:60,rc:70};
/* why she got it wrong – chosen by her before the analysis */
const WHY=[['vocabQ','לא הכרתי מילה במשפט'],['vocabA','לא הכרתי מילים בתשובות'],['conn','פספסתי מילת קישור / את המבנה'],['similar','התבלבלתי בין מילים דומות'],['trap','בחרתי משהו שמופיע בטקסט אבל לא עונה על השאלה'],['extra','לא שמתי לב למידע נוסף / חסר / קיצוני'],['rushed','מיהרתי / לחץ זמן'],['guess','ניחשתי']];

/* ---------- attempts and the mistakes notebook ---------- */
const BOXD=[1,3,7];
function amAtt(id){return AMS.a[id]}
function amLast(id){const a=AMS.a[id];return a&&a.h&&a.h.length?a.h[a.h.length-1]:null}
function amRecord(id,choice,ms){const q=AMD.q[id],ok=choice===q.a,a=AMS.a[id]=AMS.a[id]||{h:[]};const now=amNow();
  const wasMist=amIsMist(id);a.h.push([choice,ok?1:0,Math.round(ms||0),now]);
  if(!ok){a.box=0;a.due=now+DAY;a.fixed=0}
  else if(wasMist){a.box=(a.box||0)+1;if(a.box>=BOXD.length){a.fixed=now;a.due=0}else a.due=now+BOXD[a.box]*DAY}
  a.t=now;amSave();return ok}
/* in the notebook: wrong at least once (here or in the book) and not fixed yet */
function amEverWrong(id){const q=AMD.q[id],a=AMS.a[id];return !!((a&&a.h.some(r=>!r[1]))||(q.my&&q.my!==q.a))}
function amIsMist(id){const a=AMS.a[id];if(!amEverWrong(id))return false;return !(a&&a.fixed)}
function amMistDue(id){const a=AMS.a[id];if(!amIsMist(id))return false;return !a||!a.due||a.due<=amNow()}
function amSetStat(s){let done=0,ok=0;s.ids.forEach(id=>{const l=amLast(id);if(l){done++;if(l[1])ok++}});return {done,ok,n:s.ids.length}}

/* ---------- word workshop ---------- */
const WSTEP=[0,1,3,7,14,30];        /* days until the next active review after stage 1..6 */
function wKey(e){return String(e).toLowerCase().trim()}
function wAdd(e,h,c,src){const k=wKey(e);if(!k)return;let w=AMS.w[k];
  if(!w){const d=dictFind(e);w=AMS.w[k]={e:d?d.e:e,h:h||(d?d.h.join(' · '):''),c:c||'',src:src||'',st:0,due:0,add:amNow(),ok:0,bad:0,t:amNow()}}
  else{if(h&&!w.h)w.h=h;if(c&&!w.c)w.c=c;w.t=amNow()}
  amSave();return w}
function wKnownDict(e){const d=dictFind(e);return d&&d.cards.every(isY)}
function wDue(){const now=amNow();return Object.values(AMS.w).filter(w=>w.st>=1&&w.st<6&&w.due<=now).sort((a,b)=>a.due-b.due)}
function wNewToday(){return AMS.nd[dayKey()]||0}
/* the queue of words to learn: words she added from questions first, then dictionary cards marked ✗, then unmarked ones (easier levels first) */
function wQueue(n){const out=[],seen=new Set(Object.keys(AMS.w).filter(k=>AMS.w[k].st>0));
  Object.values(AMS.w).filter(w=>w.st===0).sort((a,b)=>(a.add||0)-(b.add||0)).forEach(w=>{if(out.length<n){out.push(w);seen.add(wKey(w.e))}});
  for(const f of [isN,w=>!kst(w)]){if(out.length>=n)break;
    for(const w of DW){if(out.length>=n)break;const k=wKey(w.e);if(seen.has(k)||!f(w))continue;seen.add(k);
      const d=DIX[k];out.push({e:w.e,h:[...new Set(d.map(x=>x.h[0]))].join(' · '),c:w.s||'',src:'dict',st:0,fresh:1})}}
  return out}
function wQueueCount(){const k=new Set(Object.keys(AMS.w));let n=Object.values(AMS.w).filter(w=>w.st===0).length;
  const s=new Set();DW.forEach(w=>{const kk=wKey(w.e);if(!k.has(kk)&&!isY(w))s.add(kk)});return n+s.size}
function wMaster(w){w.st=6;w.due=0;const d=dictFind(w.e);if(d)d.cards.forEach(c=>{if(!isY(c))setKnow(c.id,'y')})}
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
  return (T?'PASSAGE:\n'+T.l.map((l,i)=>l).join('\n')+'\n\n':'')+'QUESTION ('+AMTN[q.t]+'): '+q.q+'\n'+q.o.map((o,i)=>'('+(i+1)+') '+o).join('\n')+'\nCORRECT ANSWER: ('+q.a+')'+
    (q.he?'\nHebrew translation (from the course book): '+q.he:'')+(q.oh&&q.oh.length?'\nBook notes per option: '+q.oh.map((o,i)=>'('+(i+1)+') '+o).join(' | '):'')+(q.ex?'\nBook explanation: '+q.ex:'')}
const AIHE='Write in simple, everyday Hebrew, using only regular Hebrew letters (English words may appear in Latin letters). Be short and concrete. Answer ONLY with JSON.';
function promptMethod(q){return `You are an expert Israeli psychometric-exam English teacher. Explain to a Hebrew-speaking student, step by step, how to solve this ${q.t==='sc'?'Sentence Completion':q.t==='rs'?'Restatement':'Reading Comprehension'} question using the course method.
${q.t==='sc'?'Method: 1) read the sentence and translate it in your head WITHOUT looking at the options, 2) find the clue (a connector like but/although/because, a word that the blank must agree with or contrast with), 3) predict the missing word in Hebrew, 4) only then look for an option with that meaning, 5) re-read the full sentence.':q.t==='rs'?'Method: 1) translate the original and find its structure: who/what, what is said, and the relation between the parts (connector: contrast / cause / result / addition / time / condition), 2) eliminate options: added information, changed relation (different connector family), exaggeration (always/never/all), contradiction, reversed cause and effect, missing essential information, 3) check the last option fully.':'Method: identify the question type (main idea / paragraph / detail / function of a detail / inference / vocabulary / refer to), locate the exact sentence in the passage (by line or keywords), read it fully, predict the answer, then eliminate distractors typical for that type.'}
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
JSON: {"ideas":[{"sound":"the sound-alike in Hebrew letters and which part of the English word it matches, e.g. 'אבנדון ← abandon'","scene":"the scene in Hebrew","link":"one short line: «${w.e}» נשמע כמו ... ← ..."},{...},{...}]} – exactly 3 different ideas. ${AIHE}`}
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
.am-orow{display:flex;flex-direction:column;gap:4px}
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
@media (max-width:420px){.am-units{grid-template-columns:repeat(4,1fr);gap:6px}.am-q{font-size:1.08rem;padding:12px}.am-opt{font-size:1rem;padding:10px 12px}.am-grid{gap:8px}.am-tile{padding:12px}}
`;document.head.appendChild(st)})();

/* ---------- shared UI pieces ---------- */
const amNav=(back,label)=>`<div class="nav"><button class="back" id="bk" data-go="${back}">${label}</button>${HOME}</div>`;
function amBindNav(){const b=$('bk');if(b)b.onclick=()=>{const g=b.dataset.go;if(g==='home')go({screen:'home'});else go({screen:g})}}
function amLoading(){app.innerHTML=`<div class="screen">${amNav('home','מסך ראשי')}<p class="am-load">⏳ טוען את שאלות האמירנט…</p></div>`;amBindNav();
  amLoad().then(()=>draw()).catch(()=>{app.innerHTML=`<div class="screen">${amNav('home','מסך ראשי')}<p class="am-load">לא הצלחתי לטעון את השאלות – בדקי את החיבור ונסי שוב.</p><button class="btn" id="amRe">לנסות שוב</button></div>`;amBindNav();$('amRe').onclick=()=>draw()})}
/* tap any English word → its meaning + add to the workshop */
let AMPOP=null;
function amPop(e,ctx,src){AMPOP={e,ctx,src,h:null};amPopDraw();amTrans(e).then(r=>{if(AMPOP&&AMPOP.e===e){AMPOP.h=r;amPopDraw()}})}
function amPopDraw(){let el=$('amPop');if(!AMPOP){if(el)el.remove();return}
  if(!el){el=document.createElement('div');el.id='amPop';el.className='am-pop';document.body.appendChild(el)}
  const k=wKey(AMPOP.e),inW=AMS.w[k],d=dictFind(AMPOP.e);
  el.innerHTML=`<div class="e"><button class="spk" data-amsay="${esc(d?d.e:AMPOP.e)}" aria-label="השמעה">${SPK}</button>${esc(AMPOP.e)}${d&&d.e.toLowerCase()!==AMPOP.e.toLowerCase()?` <small style="font-size:.8rem;color:var(--muted)">(${esc(d.e)})</small>`:''}</div>
    <div>${AMPOP.h?(AMPOP.h.h?esc(AMPOP.h.h)+` <small style="color:var(--muted)">· ${esc(AMPOP.h.src)}</small>`:'לא נמצא תרגום'):'⏳ מחפשת פירוש…'}${d&&d.cards.every(isY)?' · <b style="color:var(--ok)">✓ סימנת שאת יודעת</b>':''}</div>
    <div class="row"><button class="btn${inW?' secondary':''}" id="popAdd">${inW?'✓ בסדנת המילים':'➕ ללמוד את המילה'}</button><button class="btn secondary" id="popX">סגירה</button></div>`;
  el.querySelector('[data-amsay]').onclick=ev=>speak(ev.currentTarget.dataset.amsay);
  $('popX').onclick=()=>{AMPOP=null;amPopDraw()};
  $('popAdd').onclick=()=>{if(!inW){const cq=AQ&&AQ.cur&&AMD&&AMD.q[AQ.cur];wAdd(d?d.e:AMPOP.e,AMPOP.h&&AMPOP.h.src!=='המילון שלך'?AMPOP.h.h:'',AMPOP.ctx||(cq&&cq.x?amSentenceWith(cq,AMPOP.e):''),AMPOP.src||(AQ&&AQ.cur)||'');amPopDraw();const r=document.querySelector('.am-wordsbox');if(r)r.outerHTML=amWordsBox(AQ&&AQ.cur)}}}
document.addEventListener('click',e=>{const t=e.target.closest('[data-tw]');if(t){e.preventDefault();document.querySelectorAll('.tw.on').forEach(x=>x.classList.remove('on'));t.classList.add('on');
  const box=t.closest('[data-ctx]');amPop(t.dataset.tw,box?box.dataset.ctx:'',box?box.dataset.src:'');return}
  const s=e.target.closest('[data-amsay]');if(s&&!s.closest('#amPop')){speak(s.dataset.amsay)}});

/* ================= hub ================= */
function amPlan(){const due=wDue().length,newLeft=Math.max(0,(AMS.n||8)-wNewToday()),mist=Object.keys(AMD.q).filter(amMistDue).length;
  const next=amNextSet();return {due,newLeft,mist,next}}
function amNextSet(){/* the first unit (alternating types in book order) that is not finished */
  const order=[];for(let u=1;u<=20;u++)['sc','rs','rc'].forEach(t=>order.push(AMD.s.find(s=>s.t===t&&s.u===u)));
  return order.find(s=>s&&amSetStat(s).done<s.ids.length)||null}
function amHub(){if(!AMD)return amLoading();
  const P=amPlan(),allW=Object.values(AMS.w),learn=allW.filter(w=>w.st>=1&&w.st<6).length,mast=allW.filter(w=>w.st>=6).length;
  const tot=Object.keys(AMD.q).length,done=Object.keys(AMD.q).filter(id=>amLast(id)).length,ok=Object.keys(AMD.q).filter(id=>{const l=amLast(id);return l&&l[1]}).length;
  const mistAll=Object.keys(AMD.q).filter(amIsMist).length;
  const step=(n,on,t,s,act)=>`<button class="am-step${on?'':' done'}" data-act="${act}"><span class="n">${on?n:'✓'}</span><span class="tx"><b>${t}</b><small>${s}</small></span></button>`;
  app.innerHTML=`<div class="screen">
    ${amNav('home','מסך ראשי')}
    ${AQ&&AQ.ids&&AQ.i<AQ.ids.length&&!AQ.fin?`<button class="resume-card" id="amRes"><span class="grow"><span class="t">להמשיך מאיפה שעצרת</span><br><span class="d">${esc(AQ.name)} · שאלה ${AQ.i+1} מתוך ${AQ.ids.length}</span></span></button>`:''}
    <div class="am-hero"><h2>🎯 הכנה לאמירנט</h2><p>כל יום סבב קצר: קודם שליפה פעילה של מילים, אחר כך מילים חדשות עם אסוציאציה ומשפט משלך, ואז שאלות לפי השיטה.</p>
      <div class="am-plan">
        ${step(1,P.due>0,'חזרה פעילה',P.due?`${P.due} מילים מחכות – כותבים אותן מהזיכרון`:'אין מילים לחזרה עכשיו','rev')}
        ${step(2,P.newLeft>0,'מילים חדשות',P.newLeft?`עוד ${P.newLeft} מילים היום (מתוך ${AMS.n||8})`:'סיימת את המילים החדשות של היום','new')}
        ${step(3,P.mist>0,'טעויות לתיקון',P.mist?`${P.mist} שאלות שטעית בהן מחכות לניסיון חוזר`:'אין טעויות שמחכות היום','mist')}
        ${step(4,!!P.next,'תרגול שאלות',P.next?`${AMTI[P.next.t]} ${AMTN[P.next.t]} · יחידה ${P.next.u}`:'סיימת את כל היחידות!','next')}
      </div></div>
    <div class="am-grid">
      <button class="am-tile" data-go="amu" data-t="sc"><span class="i">✏️</span><b>השלמת משפטים</b><small>${amTypeLine('sc')}</small></button>
      <button class="am-tile" data-go="amu" data-t="rs"><span class="i">🔁</span><b>ניסוח מחדש</b><small>${amTypeLine('rs')}</small></button>
      <button class="am-tile" data-go="amu" data-t="rc"><span class="i">📖</span><b>הבנת הנקרא</b><small>${amTypeLine('rc')}</small></button>
      <button class="am-tile" data-go="amu" data-t="ex"><span class="i">⏱</span><b>סימולציה</b><small>8 השלמות + 4 ניסוחים + 2 קטעים · 20 דקות</small></button>
      <button class="am-tile" data-go="amx"><span class="i">📕</span><b>מחברת הטעויות</b><small>${mistAll?mistAll+' שאלות לתיקון':'עדיין אין טעויות'}</small></button>
      <button class="am-tile" data-go="amw"><span class="i">🧠</span><b>סדנת מילים</b><small>${learn} בלמידה · ${mast} נלמדו</small></button>
    </div>
    <button class="item" data-go="amm"><span class="num">📘</span><span class="grow"><span class="t">שיטות הפתרון</span><br><span class="d">איך פותרים כל סוג שאלה, מילות קישור, תחיליות, ואיך לזכור מילים</span></span></button>
    <p class="hint center">פתרת ${done} מתוך ${tot} שאלות · ${done?Math.round(ok/done*100)+'% הצלחה':'עוד לא התחלת'}</p>
  </div>`;
  amBindNav();const rs=$('amRes');if(rs)rs.onclick=amResume;
  app.querySelectorAll('[data-go]').forEach(b=>{if(b.id==='bk')return;b.onclick=()=>go({screen:b.dataset.go,amt:b.dataset.t||S.amt})});
  app.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{const a=b.dataset.act;
    if(a==='rev')wStart('rev');else if(a==='new')wStart('new');else if(a==='mist')amStartMist();else if(a==='next'&&P.next)amStart(P.next.ids,AMTN[P.next.t]+' · יחידה '+P.next.u,'learn','amu',P.next.t);})}
function amTypeLine(t){const ss=AMD.s.filter(s=>s.t===t);let d=0,n=0,ok=0;ss.forEach(s=>{const x=amSetStat(s);d+=x.done;n+=x.n;ok+=x.ok});return d?`${d}/${n} · ${Math.round(ok/d*100)}% נכון`:`${n} שאלות · 20 יחידות`}

/* ================= units of one type ================= */
function amUnits(){if(!AMD)return amLoading();const t=S.amt||'sc';
  if(t==='ex')return amExams();
  const ss=AMD.s.filter(s=>s.t===t);
  app.innerHTML=`<div class="screen">
    ${amNav('am','אמירנט')}
    <div><h2>${AMTI[t]} ${AMTN[t]}</h2><p class="sub">${amTypeLine(t)} · זמן מומלץ: ${t==='sc'?'חצי דקה לשאלה':t==='rs'?'דקה לשאלה':'6 דקות לקטע'}</p></div>
    <button class="btn secondary" data-m="${t}">📘 איך פותרים ${AMTN[t]}</button>
    <div class="am-units">${ss.map(s=>{const x=amSetStat(s),m=s.ids.filter(amIsMist).length;
      return `<button class="am-unit${x.done===x.n?' full':x.done?' part':''}${m?' mist':''}" data-s="${s.id}"><b>${s.u}</b><small>${m?m+' לתיקון':x.done?x.ok+'/'+x.n:x.n+' שאלות'}</small></button>`}).join('')}</div>
    <p class="hint">בכל שאלה: קודם חושבים לבד לפי השיטה, ורק אחר כך רואים את התשובות. מילה לא מוכרת? לוחצים עליה לפירוש ולהוספה לסדנת המילים.</p>
  </div>`;
  amBindNav();
  app.querySelector('[data-m]').onclick=()=>go({screen:'amm',amTab:t});
  app.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{const s=AMD.s.find(x=>x.id===b.dataset.s);amStart(s.ids,AMTN[t]+' · יחידה '+s.u,'learn','amu',t)})}
function amExams(){
  app.innerHTML=`<div class="screen">
    ${amNav('am','אמירנט')}
    <div><h2>⏱ סימולציה של פרק אנגלית</h2><p class="sub">22 שאלות ב־20 דקות, בלי עזרה בזמן הפתרון. בסוף: ציון, זמן לכל שאלה, וניתוח של כל טעות.</p></div>
    <div class="am-units">${Array.from({length:20},(_,i)=>{const u=i+1,ids=amExamIds(u),x={done:ids.filter(id=>amLast(id)).length,ok:ids.filter(id=>{const l=amLast(id);return l&&l[1]}).length};
      const r=AMS.ex&&AMS.ex[u];return `<button class="am-unit${r?' full':''}" data-u="${u}"><b>${u}</b><small>${r?r.ok+'/22':'22 שאלות'}</small></button>`}).join('')}</div>
    <p class="hint">כל סימולציה בנויה מהיחידה באותו מספר בשלושת הסוגים. מומלץ לעשות סימולציה רק אחרי שתרגלת את היחידות לפי השיטה, ולשמור כמה סימולציות לסוף.</p>
  </div>`;
  amBindNav();app.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{const u=+b.dataset.u;amStart(amExamIds(u),'סימולציה '+u,'exam','amu','ex',u)})}
function amExamIds(u){return ['sc','rs','rc'].flatMap(t=>AMD.s.find(s=>s.t===t&&s.u===u).ids)}

/* ================= a practice session ================= */
let AQ=null;
function amStart(ids,name,mode,from,t,u){AQ={ids:ids.slice(),i:0,name,mode,from,t,u,st:{},t0:amNow(),limit:mode==='exam'?20*60e3:0};
  /* go on from the first question not answered in this session */
  amSaveQ();go({screen:'amq'})}
function amResume(){if(AQ.paused){AQ.t0+=amNow()-AQ.paused;AQ.paused=0}aqSt().seen=amNow();amSaveQ();go({screen:'amq'})}
function amStartMist(){if(!AMD)return;const ids=Object.keys(AMD.q).filter(amMistDue);if(!ids.length)return;amStart(ids,'מחברת הטעויות · ניסיון חוזר','learn','amx','mist')}
function amSaveQ(){try{LS.set('dictAmQ',JSON.stringify(AQ))}catch(e){}}
try{AQ=JSON.parse(LS.get('dictAmQ')||'null')}catch(e){}
function aqSt(i){i=i??AQ.i;return AQ.st[i]=AQ.st[i]||{stage:'read',guess:'',sel:0,elim:{},done:false,ms:0,seen:amNow(),why:[],note:'',words:false,pass:true}}
let AMTICK=null;
function amQuiz(){if(!AMD)return amLoading();if(!AQ||!AQ.ids||!AQ.ids.length){go({screen:'am'});return}
  if(AQ.i>=AQ.ids.length)return amResult();
  const id=AQ.ids[AQ.i],q=AMD.q[id],st=aqSt(),exam=AQ.mode==='exam';AQ.cur=id;
  const T=q.x?AMD.x[q.x]:null;
  let h=`<div class="screen qz">
    <div class="nav"><button class="back" id="bk">${exam?'עצירה':'יציאה'}</button>${HOME}</div>
    <div class="am-bar"><span class="am-chip t">${AMTI[q.t]} ${AMTN[q.t]}</span><span>${esc(AQ.name)}</span><span>· ${AQ.i+1}/${AQ.ids.length}</span><span class="am-timer" id="amTm"></span></div>
    <div class="am-prog"><i style="width:${(AQ.i)/AQ.ids.length*100}%"></i></div>`;
  if(q.my&&!exam&&!st.done)h+=`<p class="hint" style="margin:0">📝 את השאלה הזו פתרת כבר בספר.</p>`;
  /* passage */
  if(T){let n=0,par=[],ps=[];T.l.forEach(l=>{if(!l){if(par.length)ps.push(par.join(' '));par=[];return}n++;par.push((n%5===0?`<sup class="lnm">${n}</sup>`:'')+tapEn(l))});if(par.length)ps.push(par.join(' '));
    const lines=ps.map(x=>`<p>${x}</p>`).join('');
    h+=`<details class="am-box" ${st.pass?'open':''} id="amPassD"><summary style="font-weight:800;cursor:pointer">📖 הקטע <bdi>(Text ${q.x.endsWith('-1')?'I':'II'})</bdi></summary><div class="am-pass" data-ctx="" data-src="${q.x}">${lines}</div>${T.gl&&T.gl.length?`<p class="hint" style="margin:6px 0 0">בספר רשמת פירוש ל־${T.gl.length} מילים בקטע הזה – מופיעות ב״מילים מהשאלה״ אחרי הבדיקה.</p>`:''}</details>`}
  /* question */
  const cs=q.t!=='rc'?connFind(q.q):[];
  let qh=tapEn(q.q,st.stage!=='read'||q.t==='rs'||exam?cs:[]);if(q.t==='sc')qh=qh.replace(/_{3,}/g,'<span class="blank">&nbsp;</span>');
  h+=`<div class="am-q" data-ctx="${esc(q.q)}" data-src="${id}">${q.t==='rc'?'<b>'+(AQ.i+1)+'.</b> ':''}${qh}</div>`;
  /* step 1 – think before the options (learning mode) */
  if(!exam&&st.stage==='read'){
    if(q.t==='sc')h+=`<div class="am-step-box"><h4>שלב 1 · עוד בלי התשובות</h4><p>תרגמי את המשפט בראש. מה הרמז? איזו מילה (בעברית) הייתה משלימה אותו?</p>
      <input class="am-in" id="amGuess" placeholder="הניחוש שלי בעברית (לא חובה)" value="${esc(st.guess)}">
      ${cs.length?`<button class="link small-link" id="amHint" style="align-self:flex-start">💡 רמז: יש כאן מילת קישור</button><div id="amHintBox" hidden>${cs.map(c=>`<p>«<bdi>${c.ws.join(', ')}</bdi>» – <b>${c.he}</b>: ${c.tip}</p>`).join('')}</div>`:''}</div>`;
    else if(q.t==='rs')h+=`<div class="am-step-box"><h4>שלב 1 · להבין את המבנה</h4><p>${cs.length?cs.map(c=>`«<bdi>${c.ws.join(', ')}</bdi>» = <b>${c.he}</b>`).join(' · ')+' – הקשר הזה חייב להישמר בתשובה הנכונה.':'אין כאן מילת קישור בולטת – שימי לב מי עושה מה, למי, ומתי.'}</p><p>תרגמי לעצמך: על מי מדובר ומה נאמר עליו? אחר כך – פוסלים תשובות.</p></div>`;
    else {const k=rcType(q.q);h+=`<div class="am-step-box"><h4>שלב 1 · סוג השאלה: ${RCT[k][0]}</h4><p>${RCT[k][1]}</p></div>`}
    h+=`<button class="btn" id="amShow">${q.t==='rs'?'לתשובות – ולפסול':'הצגת התשובות'}</button>`}
  else{
    /* options */
    h+=`<div class="am-opts">${q.o.map((o,j)=>{const k=j+1,cl=st.done?(k===q.a?' right':k===st.sel?' wrong':''):(k===st.sel?' sel':'')+(st.elim[k]?' elim':'');
      const he=st.done&&!exam&&q.oh&&q.oh[j]?`<span class="he">${esc(q.oh[j])}</span>`:'';
      const elim=!st.done&&!exam&&q.t!=='sc'?`<div class="am-elim">${(q.t==='rs'?[['add','מידע נוסף'],['rel','קשר אחר'],['ext','הקצנה'],['contra','סותר'],['miss','חסר']]:[['out','לא מהקטע'],['wrong','סותר את הקטע'],['nq','לא עונה לשאלה']]).map(([c,l])=>`<button data-el="${k}" data-r="${c}" aria-pressed="${st.elim[k]===c}">✗ ${l}</button>`).join('')}</div>`:'';
      return `<div class="am-orow"><button class="am-opt${cl}" data-k="${k}" ${st.done?'disabled':''}><span class="k">(${k})</span><span>${esc(o)}${he}</span></button>${elim}</div>`}).join('')}</div>`;
    if(!st.done)h+=`<button class="btn" id="amChk" ${st.sel?'':'disabled'}>${exam?(AQ.i+1<AQ.ids.length?'לשאלה הבאה':'סיום הסימולציה'):'בדיקה'}</button>${exam?`<div class="am-nav">${AQ.i?'<button class="btn secondary" id="amPrev">→ הקודמת</button>':''}<button class="btn secondary" id="amSkip">דילוג ←</button></div>`:''}`;
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
  if(AQ.u){const ok=AQ.ids.filter((id,i)=>AQ.st[i]&&AQ.st[i].ok).length;AMS.ex=AMS.ex||{};AMS.ex[AQ.u]={ok,t:amNow(),ms:amNow()-AQ.t0};amSave()}
  amSaveQ();draw()}

/* after checking: right/wrong, book translation and explanation, method, why-I-was-wrong, words */
function amFeedback(id,st){const q=AMD.q[id],ok=st.sel===q.a,exam=AQ.mode==='exam';
  let h=`<p class="am-fb ${ok?'ok':'bad'}">${ok?'נכון! ✓':'לא נכון – התשובה הנכונה: ('+q.a+')'}</p>`;
  if(q.my&&q.my!==q.a)h+=`<p class="hint center" style="margin:0">בספר סימנת (${q.my}).</p>`;
  if(q.t==='sc'&&q.he)h+=`<div class="am-box good"><h4>תרגום המשפט</h4><p>${esc(q.he)}</p></div>`;
  if(q.t==='rs'&&q.he)h+=`<div class="am-box"><h4>המשפט המקורי בעברית</h4><p>${esc(q.he)}</p><p class="hint" style="margin:0">ליד כל תשובה למעלה: התרגום שלה וההסבר מהספר למה היא נפסלת.</p></div>`;
  if(q.ex)h+=`<div class="am-box"><h4>📗 ההסבר מהספר</h4><div class="exl">${esc(q.ex)}</div></div>`;
  if(!ok)h+=amWhyBox(id,st);
  h+=amMethodBox(id);
  h+=amWordsBox(id);
  h+=`<div class="am-nav">${AQ.i?'<button class="btn secondary" id="amPrev2">→ הקודמת</button>':''}<button class="btn" id="amNext">${AQ.i+1<AQ.ids.length?'לשאלה הבאה ←':'סיום'}</button></div>`;
  return h}
function amWhyBox(id,st){const q=AMD.q[id],a=AMS.a[id]||{},key='why|'+id+'|'+st.sel,ai=AMAI[key],why=st.why&&st.why.length?st.why:(a.r||[]);
  let h=`<div class="am-box why" id="amWhy"><h4>🔍 למה טעיתי?</h4><p style="margin:0">סמני מה קרה (אפשר כמה):</p>
    <div class="am-why">${WHY.map(([k,l])=>`<button data-why="${k}" aria-pressed="${why.includes(k)}">${l}</button>`).join('')}</div>
    <textarea class="am-in" id="amNote" placeholder="מה חשבתי כשבחרתי בתשובה הזו? (לא חובה)">${esc(st.note||a.n||'')}</textarea>`;
  if(ai&&!ai.err)h+=`<div class="am-box" style="background:var(--bg)"><h4>${esc(ai.title||'הניתוח')}</h4>
      ${ai.why_wrong?`<p><b>למה (${st.sel}) לא נכונה:</b> ${bdiEsc(ai.why_wrong)}</p>`:''}${ai.why_right?`<p><b>למה (${q.a}) נכונה:</b> ${bdiEsc(ai.why_right)}</p>`:''}
      ${ai.method?`<p><b>🧭 מה היה מציל אותי:</b> ${bdiEsc(ai.method)}</p>`:''}${ai.rule?`<p><b>📌 כלל לזכור:</b> ${bdiEsc(ai.rule)}</p>`:''}
      ${(ai.words||[]).length?`<div class="am-words">${ai.words.map(w=>amWordRow(w.en,w.he,id)).join('')}</div>`:''}</div>`;
  else if(ai&&ai.err)h+=`<p class="hint">${esc(ai.err)}</p>`;
  h+=AIP[key]?`<p class="hint">⏳ מנתחת את הטעות…</p>`:`<button class="btn secondary" id="amWhyGo">${ai&&!ai.err?'🔄 ניתוח מחדש':'🧠 ניתוח הטעות'}</button>${aiNeedKey()}`;
  return h+'</div>'}
function amMethodBox(id){const q=AMD.q[id],key='m|'+id,ai=AMAI[key];
  let h=`<div class="am-box" id="amMeth"><h4>🧭 פתרון לפי השיטה</h4>`;
  if(ai&&!ai.err)h+=`<ol>${(ai.steps||[]).map(s=>`<li>${bdiEsc(s)}</li>`).join('')}</ol>${(ai.options||[]).length?`<p style="margin-top:6px"><b>התשובות:</b></p><ul>${ai.options.map((s,i)=>`<li>(${i+1}) ${bdiEsc(String(s).replace(/^\(?\d\)?\s*[-–:.]?\s*/,''))}</li>`).join('')}</ul>`:''}${ai.rule?`<p><b>📌 ${bdiEsc(ai.rule)}</b></p>`:''}`;
  else h+=(ai&&ai.err?`<p class="hint">${esc(ai.err)}</p>`:'')+(AIP[key]?`<p class="hint">⏳ מכינה הסבר צעד אחר צעד…</p>`:`<button class="btn secondary" id="amMethGo">הסבר צעד אחר צעד</button>${aiNeedKey()}`);
  return h+'</div>'}
function amWordRow(e,he,src){const k=wKey(e),inW=AMS.w[k],kn=!inW&&wKnownDict(e);
  return `<div class="am-wrow"><button class="spk" data-amsay="${esc(e)}" aria-label="השמעה" style="width:34px;height:34px">${SPK}</button><span class="e">${esc(e)}</span><span class="h">${esc(he||'')}${kn?' · <b style="color:var(--ok)">✓ יודעת</b>':''}</span><button class="${inW?'in':''}" data-wadd="${esc(e)}" data-wh="${esc(he||'')}" data-wsrc="${src}">${inW?'✓ בסדנה':'➕ ללמוד'}</button></div>`}
/* words of this question: her glosses from the book, the options (sentence completion), and words she added */
function amWordsBox(id){if(!id||!AMD)return '';const q=AMD.q[id],T=q.x?AMD.x[q.x]:null,rows=[],seen=new Set();
  const add=(e,h)=>{const k=wKey(e);if(!k||seen.has(k))return;seen.add(k);rows.push([e,h])};
  (q.gl||[]).forEach(([e,h])=>add(e,h));if(T&&T.gl)T.gl.forEach(([e,h])=>add(e,h));
  if(q.t==='sc')q.o.forEach((o,j)=>add(o,q.oh&&q.oh[j]));
  Object.values(AMS.w).filter(w=>w.src===id).forEach(w=>add(w.e,w.h));
  const notIn=rows.filter(([e])=>!AMS.w[wKey(e)]&&!wKnownDict(e)).length;
  return `<div class="am-box am-wordsbox"><h4>📚 מילים מהשאלה</h4>${rows.length?`<div class="am-words">${rows.map(([e,h])=>amWordRow(e,h,id)).join('')}</div>`:'<p class="hint" style="margin:0">לחצי על מילה באנגלית למעלה כדי לראות פירוש ולהוסיף אותה.</p>'}
    ${notIn>1?`<button class="btn secondary" id="amAddAll">➕ להוסיף את כל ${notIn} המילים שאני לא יודעת</button>`:''}
    <p class="hint" style="margin:0">${(q.gl&&q.gl.length)||(T&&T.gl&&T.gl.length)?'כולל המילים שרשמת להן פירוש בספר. ':''}כל מילה שתוסיפי תיכנס לסדנת המילים ללמידה פעילה.</p></div>`}
function amBindFeedback(id,st){const q=AMD.q[id];
  const nx=$('amNext');if(nx)nx.onclick=()=>{AQ.i++;if(AQ.i<AQ.ids.length)aqSt().seen=amNow();amSaveQ();draw();window.scrollTo(0,0)};
  const pv=$('amPrev2');if(pv)pv.onclick=()=>{AQ.i--;amSaveQ();draw();window.scrollTo(0,0)};
  app.querySelectorAll('[data-why]').forEach(b=>b.onclick=()=>{const k=b.dataset.why;st.why=st.why&&st.why.length?st.why:((AMS.a[id]||{}).r||[]).slice();
    st.why=st.why.includes(k)?st.why.filter(x=>x!==k):[...st.why,k];const a=AMS.a[id]=AMS.a[id]||{h:[]};a.r=st.why;a.t=amNow();amSave();amSaveQ();b.setAttribute('aria-pressed',st.why.includes(k))});
  const nt=$('amNote');if(nt)nt.oninput=()=>{st.note=nt.value;const a=AMS.a[id]=AMS.a[id]||{h:[]};a.n=nt.value;a.t=amNow();clearTimeout(nt._t);nt._t=setTimeout(amSave,600);amSaveQ()};
  const wg=$('amWhyGo');if(wg)wg.onclick=()=>{const key='why|'+id+'|'+st.sel;delete AMAI[key];const p=aiCached(key,promptWhy(q,st.sel,st.why||[],st.note||''),.3);amRedrawKeep();p.then(()=>{if(S.screen==='amq'&&AQ.cur===id)amRedrawKeep()})};
  const mg=$('amMethGo');if(mg)mg.onclick=()=>{const key='m|'+id;delete AMAI[key];const p=aiCached(key,promptMethod(q),.2);amRedrawKeep();p.then(()=>{if(S.screen==='amq'&&AQ.cur===id)amRedrawKeep()})};
  amBindWordBtns(id)}
function amBindWordBtns(id){app.querySelectorAll('[data-wadd]').forEach(b=>b.onclick=()=>{const e=b.dataset.wadd;if(AMS.w[wKey(e)])return;
    const q=id&&AMD.q[id];wAdd(e,b.dataset.wh,q?(q.t==='rc'?amSentenceWith(q,e):q.q.replace(/_{3,}/g,q.o[q.a-1])):'',b.dataset.wsrc||id);b.classList.add('in');b.textContent='✓ בסדנה'});
  const aa=$('amAddAll');if(aa)aa.onclick=()=>{app.querySelectorAll('[data-wadd]:not(.in)').forEach(b=>{if(!wKnownDict(b.dataset.wadd))b.click()});aa.remove()}}
/* the passage sentence that contains a word (context for the workshop) */
function amSentenceWith(q,e){const T=AMD.x[q.x];if(!T)return q.q;const txt=T.l.filter(Boolean).join(' ');const ss=txt.match(/[^.!?]+[.!?]+/g)||[txt];
  const r=new RegExp('\\b'+e.toLowerCase().slice(0,Math.max(3,e.length-2)).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');return (ss.find(s=>r.test(s))||q.q).trim()}

/* session results */
function amResult(){const exam=AQ.mode==='exam';clearInterval(AMTICK);
  if(exam&&!AQ.fin){AQ.fin=1;amFinishExam();return}
  const rows=AQ.ids.map((id,i)=>{const s=AQ.st[i]||{},q=AMD.q[id];return {id,i,q,s,ok:s.done&&s.sel===q.a,ans:s.done}});
  const ok=rows.filter(r=>r.ok).length,ans=rows.filter(r=>r.ans).length,tot=rows.reduce((a,r)=>a+(r.s.ms||0),0);
  const byT={};rows.forEach(r=>{const b=byT[r.q.t]=byT[r.q.t]||{n:0,ok:0,ms:0};b.n++;if(r.ok)b.ok++;b.ms+=r.s.ms||0});
  app.innerHTML=`<div class="screen">
    ${amNav(AQ.from||'am','חזרה')}
    <div><h2>${esc(AQ.name)} – סיכום</h2><p class="sub">${ans<rows.length?`ענית על ${ans} מתוך ${rows.length} · `:''}${exam?'זמן: '+Math.round((Math.min(amNow(),AQ.t0+AQ.limit)-AQ.t0)/6e4)+' דק׳':'זמן כולל: '+Math.round(tot/6e4)+' דק׳'}</p></div>
    <p class="am-big">${ok} / ${rows.length}</p>
    <div class="am-box">${Object.entries(byT).map(([t,b])=>`<p>${AMTI[t]} <b>${AMTN[t]}</b>: ${b.ok}/${b.n} · בממוצע ${Math.round(b.ms/b.n/1e3)} שנ׳ לשאלה (מומלץ ${AMTARGET[t]})</p>`).join('')}</div>
    ${rows.some(r=>r.ans&&!r.ok)?`<p class="lbl">לחצי על שאלה כדי לראות את ההסבר ולנתח את הטעות</p>`:''}
    <ul class="am-res">${rows.map(r=>`<li class="${r.ok?'ok':r.ans?'bad':''}"><button data-ri="${r.i}"><span class="s">${r.ok?'✓':r.ans?'✗':'—'}</span><span class="tx">${esc(r.q.q)}</span><small dir="rtl" style="font-family:var(--he)">${r.s.ms?Math.round(r.s.ms/1e3)+' שנ׳':''}</small></button></li>`).join('')}</ul>
    <button class="btn" id="amAgain">${AQ.from==='amx'?'חזרה למחברת הטעויות':'סיום'}</button>
  </div>`;
  amBindNav();$('amAgain').onclick=()=>go({screen:AQ.from||'am'});
  app.querySelectorAll('[data-ri]').forEach(b=>b.onclick=()=>{const i=+b.dataset.ri,s=aqSt(i);if(!s.done){s.done=!!s.sel;}AQ.mode='learn';AQ.i=i;amSaveQ();draw();window.scrollTo(0,0)})}

/* ================= mistakes notebook ================= */
function amMist(){if(!AMD)return amLoading();
  const all=Object.keys(AMD.q).filter(amEverWrong),act=all.filter(amIsMist),due=act.filter(amMistDue),fixed=all.filter(id=>!amIsMist(id));
  const cnt={};act.forEach(id=>((AMS.a[id]||{}).r||[]).forEach(r=>cnt[r]=(cnt[r]||0)+1));
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const row=id=>{const q=AMD.q[id],a=AMS.a[id],l=amLast(id);return `<li class="${amIsMist(id)?'bad':'ok'}"><button data-mq="${id}"><span class="s">${AMTI[q.t]}</span><span class="tx">${esc(q.q)}</span><small dir="rtl" style="font-family:var(--he)">${amIsMist(id)?(amMistDue(id)?'עכשיו':'בעוד '+Math.max(1,Math.ceil(((a&&a.due)-amNow())/DAY))+' ימים'):'✓ תוקן'}</small></button></li>`};
  app.innerHTML=`<div class="screen">
    ${amNav('am','אמירנט')}
    <div><h2>📕 מחברת הטעויות</h2><p class="sub">כל שאלה שטעית בה חוזרת אחרי יום, 3 ימים ושבוע – עד שהיא נפתרת נכון 3 פעמים ברצף.</p></div>
    ${due.length?`<button class="btn" id="amMGo">ניסיון חוזר עכשיו · ${due.length} שאלות</button>`:`<p class="hint center">אין שאלות שמחכות לניסיון חוזר היום${act.length?' – הבאות יחזרו בימים הקרובים':''}.</p>`}
    ${top.length?`<div class="am-box why"><h4>הטעויות הנפוצות שלך</h4>${top.map(([k,n])=>`<p>${(WHY.find(w=>w[0]===k)||[,k])[1]} – ${n} פעמים</p>`).join('')}<p class="hint" style="margin:0">${amAdvice(top[0][0])}</p></div>`:''}
    ${act.length?`<p class="lbl">לתיקון (${act.length})</p><ul class="am-res">${act.map(row).join('')}</ul>`:''}
    ${fixed.length?`<p class="lbl">תוקנו (${fixed.length})</p><ul class="am-res">${fixed.map(row).join('')}</ul>`:''}
    ${!all.length?'<p class="hint center">עוד אין טעויות. כל שאלה שתטעי בה (וגם אלה שטעית בהן בספר) תופיע כאן.</p>':''}
  </div>`;
  amBindNav();const g=$('amMGo');if(g)g.onclick=amStartMist;
  app.querySelectorAll('[data-mq]').forEach(b=>b.onclick=()=>amStart([b.dataset.mq],'מחברת הטעויות','learn','amx','mist'))}
function amAdvice(k){return {vocabQ:'הכי משתלם: להוסיף את המילים מהשאלות לסדנת המילים ולעבור עליהן כל יום.',vocabA:'נסי קודם לנחש בעברית את ההשלמה, ורק אז לחפש תשובה שמתאימה לה – כך מילים לא מוכרות בתשובות פחות מבלבלות.',conn:'סמני כל מילת קישור לפני שאת קוראת את התשובות, ושאלי: ניגוד? סיבה? הוספה?',similar:'מילים שנראות דומות (in-, -ible…): פרקי לתחילית ושלד. בסדנת המילים כדאי לבנות אסוציאציה לכל אחת בנפרד.',trap:'בשאלות פרט והסקה – לחזור למשפט בקטע ולבדוק שהתשובה עונה בדיוק על מה ששאלו.',extra:'בניסוח מחדש: לחפש בכל תשובה מידע שלא כתוב במקור, ומילים כמו always / only / all.',rushed:'בתרגול לפי השיטה הזמן פחות חשוב – קודם דיוק, אחר כך מהירות.',guess:'כשמנחשים – קודם לפסול מה שבטוח לא נכון.'}[k]||''}

/* ================= word workshop ================= */
let WS=null;   /* the running workshop session: {mode:'new'|'rev', list:[keys], i, step, ...} */
function amWords(){if(!AMD)return amLoading();
  const all=Object.values(AMS.w),due=wDue(),learn=all.filter(w=>w.st>=1&&w.st<6),mast=all.filter(w=>w.st>=6),wait=all.filter(w=>w.st===0);
  const newLeft=Math.max(0,(AMS.n||8)-wNewToday());
  const st=w=>`<span class="am-stage">${[1,2,3,4,5,6].map(i=>`<i class="${w.st>=i?'on':''}"></i>`).join('')}</span>`;
  app.innerHTML=`<div class="screen">
    ${amNav('am','אמירנט')}
    <div><h2>🧠 סדנת מילים</h2><p class="sub">לומדים מילה בשלושה צעדים: אסוציאציה ייחודית ← משפט משלך ← שליפה מהזיכרון. בחזרות כותבים את המילה בעצמך – בלי "ידעתי / לא ידעתי".</p></div>
    <button class="btn" id="wRev" ${due.length?'':'disabled'}>חזרה פעילה · ${due.length?due.length+' מילים':'אין עכשיו'}</button>
    <button class="btn secondary" id="wNew" ${newLeft?'':'disabled'}>➕ מילים חדשות להיום · ${newLeft?newLeft:'סיימת ✓'}</button>
    <div class="am-box"><h4>כמה מילים חדשות ביום?</h4><div class="seg">${[5,8,12,16].map(n=>`<button data-nd="${n}" aria-pressed="${(AMS.n||8)===n}">${n}</button>`).join('')}</div>
      <p class="hint" style="margin:0">ב־3 חודשים: 8 ביום ≈ 700 מילים שנלמדות לעומק. חזרה של כל מילה: אחרי יום, 3 ימים, שבוע, שבועיים וחודש.</p></div>
    <p class="hint">בתור ללמידה: ${wait.length?wait.length+' מילים שהוספת מהשאלות, ואחריהן ':''}המילים שסימנת ✗ ואלה שלא סימנת (${wQueueCount().toLocaleString()}). מילה שנלמדה עד הסוף מסומנת אוטומטית ✓ במילון.</p>
    ${learn.length?`<p class="lbl">בלמידה (${learn.length})</p><ul class="am-res">${learn.sort((a,b)=>a.due-b.due).map(w=>`<li><button data-wk="${esc(wKey(w.e))}"><span class="tx">${esc(w.e)}</span>${st(w)}<small dir="rtl" style="font-family:var(--he)">${w.due<=amNow()?'עכשיו':Math.ceil((w.due-amNow())/DAY)+' ימים'}</small></button></li>`).join('')}</ul>`:''}
    ${wait.length?`<p class="lbl">מחכות ללמידה (${wait.length})</p><ul class="am-res">${wait.map(w=>`<li><button data-wk="${esc(wKey(w.e))}"><span class="tx">${esc(w.e)}</span><small dir="rtl" style="font-family:var(--he)">${esc(w.h||'')}</small></button></li>`).join('')}</ul>`:''}
    ${mast.length?`<p class="lbl">נלמדו (${mast.length})</p><ul class="am-res">${mast.map(w=>`<li class="ok"><button data-wk="${esc(wKey(w.e))}"><span class="s">✓</span><span class="tx">${esc(w.e)}</span><small dir="rtl" style="font-family:var(--he)">${esc(w.h||'')}</small></button></li>`).join('')}</ul>`:''}
  </div>`;
  amBindNav();$('wRev').onclick=()=>wStart('rev');$('wNew').onclick=()=>wStart('new');
  app.querySelectorAll('[data-nd]').forEach(b=>b.onclick=()=>{AMS.n=+b.dataset.nd;amSave();draw()});
  app.querySelectorAll('[data-wk]').forEach(b=>b.onclick=()=>{const w=AMS.w[b.dataset.wk];if(!w)return;WS={mode:w.st===0?'new':'one',list:[wKey(w.e)],i:0,step:w.st===0?'meet':'recall',hint:0,from:'amw'};wSave();go({screen:'amwl'})})}
function wSave(){try{LS.set('dictAmWs',JSON.stringify(WS))}catch(e){}}
try{WS=JSON.parse(LS.get('dictAmWs')||'null')}catch(e){}
function wStart(mode){if(mode==='rev'){const d=wDue();if(!d.length)return;WS={mode,list:d.slice(0,30).map(w=>wKey(w.e)),i:0,step:'recall',hint:0,from:S.screen==='am'?'am':'amw',ok:0,bad:0}}
  else{const n=Math.max(0,(AMS.n||8)-wNewToday());if(!n)return;const q=wQueue(n);if(!q.length)return;
    q.forEach(w=>{if(w.fresh){const x=wAdd(w.e,w.h,w.c,w.src);}});WS={mode,list:q.map(w=>wKey(w.e)),i:0,step:'meet',hint:0,from:S.screen==='am'?'am':'amw',ok:0,bad:0}}
  wSave();go({screen:'amwl'})}
/* which active task a review of stage st gets */
function wTask(w){return ['he2en','he2en','cloze','en2he','write','he2en','he2en'][w.st]||'he2en'}
function amWordLearn(){if(!WS||!WS.list||WS.i>=WS.list.length)return wDone();
  const w=AMS.w[WS.list[WS.i]];if(!w){WS.i++;wSave();return draw()}
  const d=dictFind(w.e),x=d?EXTRA[d.cards[0].id]||{}:{},ex=d?d.cards[0].s:'';
  const ctx=w.c||ex||'';
  let h=`<div class="screen qz">
    <div class="nav"><button class="back" id="bk">יציאה</button>${HOME}</div>
    <div class="am-bar"><span class="am-chip t">🧠 ${WS.mode==='new'?'מילה חדשה':'חזרה פעילה'}</span><span>${WS.i+1}/${WS.list.length}</span>${w.st?`<span class="am-timer">${[1,2,3,4,5,6].map(i=>w.st>=i?'●':'○').join('')}</span>`:''}</div>
    <div class="am-prog"><i style="width:${WS.i/WS.list.length*100}%"></i></div>`;
  const step=WS.step;
  if(step==='meet'){
    h+=`<div class="am-card"><div class="w"><button class="spk" data-amsay="${esc(w.e)}">${SPK}</button><span>${esc(w.e)}</span></div><div class="m">${esc(w.h)}</div>
      ${ctx?`<div class="ctx" data-ctx="${esc(ctx)}">${tapEn(ctx)}</div>`:''}${x.use?`<div class="xbox"><h4>📌 דגשים</h4>${xuse(x.use)}</div>`:''}</div>
      <div class="am-step-box"><h4>צעד 1 מתוך 3 · אסוציאציה ייחודית</h4><p>תמונה מוזרה וחיה בראש = זיכרון חזק. בחרי אסוציאציה, או כתבי אחת משלך (הכי חזק – משהו אישי).</p>
      ${x.tip?`<button class="am-idea${w.as===x.tip?' on':''}" data-as="${esc(x.tip)}"><small>💡 מהמילון</small>${bdiEsc(x.tip)}</button>`:''}
      ${wIdeas(w)}
      <textarea class="am-in" id="wAs" placeholder="האסוציאציה שלי…">${esc(w.as&&w.as!==x.tip&&!(((AMAI['as|'+wKey(w.e)]||{}).ideas)||[]).some(i=>i.scene===w.as)?w.as:'')}</textarea></div>
      <button class="btn" id="wNext" ${w.as?'':'disabled'}>המשך ← משפט משלך</button>
      <button class="link" id="wKnow" style="align-self:center">את המילה הזו אני כבר יודעת ✓ – לדלג</button>`}
  else if(step==='write'||(step==='recall'&&wTask(w)==='write')){
    const ck=WS.chk;
    h+=`<div class="am-card"><div class="w"><button class="spk" data-amsay="${esc(w.e)}">${SPK}</button><span>${esc(w.e)}</span></div><div class="m">${esc(w.h)}</div>${w.as?`<div class="am-hint">💡 ${bdiEsc(w.as)}</div>`:''}</div>
      <div class="am-step-box"><h4>${step==='write'?'צעד 2 מתוך 3 · ':''}משפט משלך באנגלית</h4><p>כתבי משפט על החיים שלך שמשתמש ב־<b><bdi>${esc(w.e)}</bdi></b> במשמעות «${esc(w.h)}». משפט אישי נזכר הכי טוב.${w.my&&step!=='write'?' (משפט חדש, לא זה שכתבת קודם)':''}</p>
      <textarea class="am-in en" id="wMy" placeholder="My sentence with ${esc(w.e)}…" spellcheck="true">${esc(WS.draft||'')}</textarea>
      ${ck?(ck.err?`<p class="hint">${esc(ck.err)}</p>`:`<div class="am-box ${ck.ok?'good':'why'}"><h4>${ck.ok?'✓ משפט נכון!':'כמעט – כדאי לתקן:'}</h4>${(ck.fixes||[]).map(f=>`<p>• ${bdiEsc(f)}</p>`).join('')}${!ck.ok&&ck.corrected?`<p><b>מתוקן:</b> <bdi>${esc(ck.corrected)}</bdi></p>`:''}${ck.hebrew?`<p>${esc(ck.hebrew)}</p>`:''}${ck.tip?`<p>💡 ${bdiEsc(ck.tip)}</p>`:''}</div>`):''}
      ${WS.busy?'<p class="hint">⏳ בודקת את המשפט…</p>':''}</div>
      <div class="am-nav"><button class="btn secondary" id="wChk" ${WS.busy?'disabled':''}>🔍 בדיקה</button><button class="btn" id="wSaveS">${ck&&!ck.ok&&ck.corrected?'לשמור את המתוקן':'שמירה והמשך'}</button></div>
      ${aiNeedKey()}`}
  else{ /* recall tasks */
    const task=step==='first'?'he2en':wTask(w),hint=WS.hint||0,res=WS.res;
    if(task==='en2he')h+=`<div class="am-card"><p class="hint center" style="margin:0">מה הפירוש בעברית?</p><div class="w"><button class="spk" data-amsay="${esc(w.e)}">${SPK}</button><span>${esc(w.e)}</span></div>${ctx&&hint>0?`<div class="ctx">${esc(ctx)}</div>`:''}</div>`;
    else if(task==='cloze'){const s=blankOut(w.my||ctx,w.e)||blankOut(ctx,w.e);h+=`<div class="am-card"><p class="hint center" style="margin:0">איזו מילה חסרה? (${esc(w.h)})</p><div class="ctx" style="font-size:1.15rem;color:var(--ink)">${esc(s||'_____')}</div></div>`}
    else h+=`<div class="am-card"><p class="hint center" style="margin:0">איך אומרים באנגלית?</p><div class="m" style="font-size:1.5rem">${esc(w.h)}</div></div>`;
    /* hint ladder */
    const hs=[];if(hint>=1&&w.as)hs.push('💡 '+bdiEsc(w.as));if(hint>=2&&task!=='en2he')hs.push('האות הראשונה: <bdi dir="ltr" style="font-family:var(--en);font-size:1.2rem;letter-spacing:3px">'+esc(w.e[0]+w.e.slice(1).replace(/[A-Za-z]/g,'_ '))+'</bdi>');
    if(hint>=3&&task==='he2en'){const s=blankOut(w.my||ctx,w.e);if(s)hs.push('<bdi style="font-family:var(--en)">'+esc(s)+'</bdi>')}
    if(hs.length)h+=`<div class="am-hints">${hs.map(x=>`<div class="am-hint">${x}</div>`).join('')}</div>`;
    if(!res){h+=`<input class="am-in ${task==='en2he'?'':'en'}" id="wAns" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${task==='en2he'?'הפירוש בעברית':'כתבי את המילה באנגלית'}">
      <div class="am-nav"><button class="btn secondary" id="wHint" ${hint>=(task==='en2he'?2:3)?'disabled':''}>💡 רמז ${hint?'נוסף':''}</button><button class="btn" id="wGo">בדיקה</button></div>
      <button class="link" id="wGive" style="align-self:center">לא זוכרת – הראי לי</button>`}
    else{
      h+=`<p class="am-fb ${res.ok?'ok':'bad'}">${res.ok?(res.near?'כמעט מושלם ✓':'נכון! ✓'):res.self?'':'עוד לא – הנה התשובה:'}</p>
        <div class="am-card"><div class="w"><button class="spk" data-amsay="${esc(w.e)}">${SPK}</button><span>${esc(w.e)}</span></div><div class="m">${esc(w.h)}</div>${res.typed?`<p class="hint center" style="margin:0">כתבת: <bdi>${esc(res.typed)}</bdi></p>`:''}${w.as?`<div class="am-hint">💡 ${bdiEsc(w.as)}</div>`:''}${w.my?`<div class="ctx">✍️ ${esc(w.my)}</div>`:''}</div>`;
      if(res.self)h+=`<p class="center" style="margin:0">הפירוש שכתבת נכון?</p><div class="am-nav"><button class="btn" id="wSelfY">✓ כן, התכוונתי לזה</button><button class="btn secondary" id="wSelfN">✗ לא</button></div>`;
      else if(!res.ok&&!res.copied)h+=`<div class="am-step-box"><h4>כתבי את המילה פעם אחת כדי לחזק</h4><input class="am-in en" id="wCopy" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(w.e)}"></div>`;
      else h+=`<button class="btn" id="wOn">${WS.i+1<WS.list.length||WS.again?'המילה הבאה ←':'סיום'}</button>`}
  }
  h+='</div>';app.innerHTML=h;
  $('bk').onclick=()=>{wSave();go({screen:WS.from||'amw'})};
  wBind(w,x)}
function wIdeas(w){const k='as|'+wKey(w.e),ai=AMAI[k];let h='';
  if(ai&&ai.ideas)h+=ai.ideas.map(i=>`<button class="am-idea${w.as===i.scene?' on':''}" data-as="${esc(i.scene)}"><small>${esc(i.sound||'')}</small>${bdiEsc(i.scene)}${i.link?`<small>${bdiEsc(i.link)}</small>`:''}</button>`).join('');
  if(ai&&ai.err)h+=`<p class="hint">${esc(ai.err)}</p>`;
  h+=AIP[k]?'<p class="hint">⏳ ממציאה אסוציאציות…</p>':(GKEY()?`<button class="btn secondary" id="wGen">✨ ${ai&&ai.ideas?'עוד 3 אסוציאציות':'3 אסוציאציות ייחודיות'}</button>`:'');
  return h}
function wBind(w,x){
  app.querySelectorAll('[data-as]').forEach(b=>b.onclick=()=>{w.as=b.dataset.as;w.t=amNow();amSave();amRedrawKeep()});
  const ta=$('wAs');if(ta)ta.oninput=()=>{w.as=ta.value.trim();w.t=amNow();clearTimeout(ta._t);ta._t=setTimeout(amSave,500);$('wNext').disabled=!w.as;app.querySelectorAll('.am-idea.on').forEach(e=>e.classList.remove('on'))};
  const gn=$('wGen');if(gn)gn.onclick=()=>{const k='as|'+wKey(w.e),old=((AMAI[k]||{}).ideas||[]).map(i=>i.scene).concat(AMAI[k]&&AMAI[k].seen||[]).slice(-9);const seen=old;delete AMAI[k];
    const p=aiCached(k,promptAssoc(w,old),1);amRedrawKeep();p.then(r=>{if(r&&!r.err){r.seen=seen;amAiSave()}if(S.screen==='amwl')amRedrawKeep()})};
  const kw=$('wKnow');if(kw)kw.onclick=()=>{wMaster(w);w.t=amNow();const nq=wQueue(1)[0];
    if(nq){if(nq.fresh)wAdd(nq.e,nq.h,nq.c,nq.src);const k=wKey(nq.e);if(!WS.list.includes(k))WS.list.push(k)}
    amSave();WS.i++;WS.step='meet';wSave();draw();window.scrollTo(0,0)};
  const nx=$('wNext');if(nx)nx.onclick=()=>{if(!w.as)return;WS.step='write';WS.chk=null;WS.draft='';wSave();draw();window.scrollTo(0,0)};
  const my=$('wMy');if(my){my.oninput=()=>{WS.draft=my.value;WS.chk=null;wSave()};if(!WS.draft)setTimeout(()=>{try{my.focus({preventScroll:true})}catch(e){}},50)}
  const ck=$('wChk');if(ck)ck.onclick=async()=>{const t=(WS.draft||'').trim();if(!t)return;if(!GKEY()){WS.chk={err:'צריך מפתח ג׳מיני כדי לבדוק. אפשר לשמור גם בלי בדיקה.'};return draw()}
    WS.busy=true;draw();const r=await aiRun('','',null,{prompt:promptSent(w,t),temp:.2});WS.busy=false;WS.chk=r&&r.j?r.j:{err:aiWhyText(r&&r.why)};wSave();if(S.screen==='amwl')amRedrawKeep()};
  const sv=$('wSaveS');if(sv)sv.onclick=()=>{let t=(WS.draft||'').trim();const c=WS.chk;if(c&&!c.ok&&c.corrected)t=c.corrected;if(!t){my&&my.focus();return}
    w.my=t;w.t=amNow();WS.draft='';WS.chk=null;
    if(WS.step==='write'){WS.step='first';WS.hint=0;WS.res=null;amSave();wSave();draw();window.scrollTo(0,0)}
    else{wGrade(w,true,0);wNextWord()}};
  const ans=$('wAns');if(ans){setTimeout(()=>{try{ans.focus({preventScroll:true})}catch(e){}},50);ans.onkeydown=e=>{if(e.key==='Enter')$('wGo').click()}}
  const hb=$('wHint');if(hb)hb.onclick=()=>{WS.hint=(WS.hint||0)+1;wSave();amRedrawKeep()};
  const task=WS.step==='first'?'he2en':wTask(w);
  const gb=$('wGo');if(gb)gb.onclick=()=>{const v=(ans.value||'').trim();if(!v)return;
    if(task==='en2he'){if(heMatch(v,w.h))WS.res={ok:true,typed:v};else WS.res={self:true,typed:v};}
    else{const a=v.toLowerCase().replace(/[^a-z' \-]/g,''),e=w.e.toLowerCase(),dd=lev(a,e);const ok=a===e||dd<=(e.length>=6?1:0);WS.res={ok,near:ok&&a!==e,typed:v}}
    if(!WS.res.self)wAfter(w,WS.res.ok);wSave();draw()};
  const gv=$('wGive');if(gv)gv.onclick=()=>{WS.res={ok:false};wAfter(w,false);wSave();draw()};
  const sy=$('wSelfY');if(sy)sy.onclick=()=>{WS.res={ok:true,typed:WS.res.typed};wAfter(w,true);wSave();draw()};
  const sn=$('wSelfN');if(sn)sn.onclick=()=>{WS.res={ok:false,typed:WS.res.typed};wAfter(w,false);wSave();draw()};
  const cp=$('wCopy');if(cp){setTimeout(()=>{try{cp.focus({preventScroll:true})}catch(e){}},50);cp.oninput=()=>{if(cp.value.trim().toLowerCase()===w.e.toLowerCase()){WS.res.copied=true;wSave();draw()}}}
  const on=$('wOn');if(on)on.onclick=wNextWord}
function wNextWord(){WS.i++;WS.step=WS.mode==='new'?'meet':'recall';WS.hint=0;WS.res=null;WS.chk=null;WS.draft='';
  /* words missed in this session come once more at the end (practice only – they are due again tomorrow anyway) */
  if(WS.i>=WS.list.length&&WS.again&&WS.again.length){WS.re=(WS.re||[]).concat(WS.again);WS.list=WS.list.concat(WS.again);WS.again=[];WS.mode='rev';WS.step='recall'}
  wSave();draw();window.scrollTo(0,0)}
/* result of a recall: the stage goes up (a hint keeps it), a miss goes back and comes again at the end of this session */
function wAfter(w,ok){if(WS.step==='first'){/* the first recall right after learning */
    w.st=1;w.due=amNow()+DAY;w.t=amNow();AMS.nd[dayKey()]=(AMS.nd[dayKey()]||0)+(WS.counted&&WS.counted.includes(wKey(w.e))?0:1);WS.counted=(WS.counted||[]).concat(wKey(w.e));
    if(!ok){WS.again=(WS.again||[]).filter(k=>k!==wKey(w.e)).concat(wKey(w.e))}amSave();return}
  wGrade(w,ok,WS.hint||0)}
function wGrade(w,ok,hint){const k=wKey(w.e);
  if((WS.re||[]).includes(k)){w.due=amNow()+DAY;w.t=amNow();if(ok)WS.ok=(WS.ok||0)+1;amSave();return}
  if(ok){w.ok=(w.ok||0)+1;if(!hint){w.st=Math.min(6,w.st+1)}if(w.st>=6)wMaster(w);else w.due=amNow()+WSTEP[w.st-1]*DAY+(w.st===1?DAY:0)}
  else{w.bad=(w.bad||0)+1;w.st=Math.max(1,w.st-1);w.due=amNow()+DAY;if(!(WS.again||[]).includes(k))WS.again=(WS.again||[]).concat(k)}
  w.t=amNow();if(ok)WS.ok=(WS.ok||0)+1;else WS.bad=(WS.bad||0)+1;amSave()}
function wDone(){const n=WS?WS.list.length:0;
  app.innerHTML=`<div class="screen">${amNav(WS&&WS.from||'amw','חזרה')}
    <p class="am-big">🎉</p><h2 class="center">סיימת את הסבב!</h2>
    <p class="center sub">${n} מילים${WS&&WS.ok?` · ${WS.ok} נשלפו נכון`:''}. הן יחזרו בדיוק כשהזיכרון מתחיל לדעוך.</p>
    <button class="btn" id="wBack">חזרה</button></div>`;
  amBindNav();$('wBack').onclick=()=>{const f=WS&&WS.from||'amw';WS=null;wSave();go({screen:f})}}

/* ================= methods (from the course book) ================= */
const AMM={
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
function amMethods(){const tab=S.amTab||'gen';
  app.innerHTML=`<div class="screen am-m">
    ${amNav('am','אמירנט')}
    <div><h2>📘 שיטות הפתרון</h2><p class="sub">מתוך הספר שצירפת, בקצרה.</p></div>
    ${Object.entries(AMM).map(([k,[t,b]])=>`<details ${k===tab?'open':''}><summary>${t}</summary>${b}</details>`).join('')}
  </div>`;amBindNav()}
/* main screen: the entry to the section, with what is waiting today */
function amHomeCard(){const due=wDue().length,nl=Math.max(0,(AMS.n||8)-wNewToday());
  const d=[due?due+' מילים לחזרה':'',nl?nl+' מילים חדשות':'אין מילים חדשות היום ✓'].filter(Boolean).join(' · ');
  return `<button class="item am-home" id="amGo"><span class="num">🎯</span><span class="grow"><span class="t">הכנה לאמירנט</span><br><span class="d">${d} · תרגול שאלות לפי השיטה</span></span><span class="chev" aria-hidden="true"><svg class="ai" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></span></button>`}
