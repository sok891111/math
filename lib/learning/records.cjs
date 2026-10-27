const {createMagicStore}=require('../magicEnglishStore.cjs');
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9]{4,10}$/.test(id);
const day=date=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));
const bad=message=>Object.assign(Error(message),{status:400});
const text=(value,max=1000)=>typeof value==='string'?value.slice(0,max):'';
const bounded=(v,max)=>Number.isFinite(v)?Math.max(0,Math.min(max,v)):0;
function normalizeEvent(raw,now=Date.now()){
 if(!raw||typeof raw!=='object'||!/^[-A-Za-z0-9]{8,100}$/.test(raw.id||''))throw bad('기록 ID가 올바르지 않습니다.');
 if(!['math','speech','usage'].includes(raw.kind))throw bad('지원하지 않는 학습 기록입니다.');
 const timestamp=Date.parse(raw.at);if(!Number.isFinite(timestamp)||timestamp>now+300000||timestamp<Date.UTC(2026,0,1))throw bad('기록 시간이 올바르지 않습니다.');
 const event={id:raw.id,kind:raw.kind,at:new Date(timestamp).toISOString(),...(/^[-A-Za-z0-9]{8,100}$/.test(raw.sessionId||'')?{sessionId:raw.sessionId}:{})};
 if(raw.kind==='usage'){
  if(!['tralalerio','magic-english','magic-english-world'].includes(raw.game)||!Number.isInteger(raw.seconds)||raw.seconds<1||raw.seconds>30)throw bad('사용 시간 기록이 올바르지 않습니다.');
  return {...event,game:raw.game,seconds:raw.seconds};
 }
 if(raw.kind==='math'){
  if(!['correct','incorrect','skipped'].includes(raw.result))throw bad('수학 결과가 올바르지 않습니다.');
  if(!raw.question||typeof raw.question!=='object'||Array.isArray(raw.question)||JSON.stringify(raw.question).length>20000)throw bad('문제 정보가 올바르지 않습니다.');
  if(!Array.isArray(raw.answer)||raw.answer.length>100||!raw.answer.every(n=>n===null||Number.isInteger(n)&&Math.abs(n)<=100000))throw bad('답안이 올바르지 않습니다.');
  return {...event,game:'tralalerio',result:raw.result,type:text(raw.type,80),label:text(raw.label,100),grade:bounded(raw.grade,5),context:text(raw.context,60),question:JSON.parse(JSON.stringify(raw.question)),answer:raw.answer,hints:Math.floor(bounded(raw.hints,3)),durationSeconds:Math.round(bounded(raw.durationSeconds,7200))};
 }
 if(!['complete','partial','retry','unheard','error'].includes(raw.result))throw bad('말하기 결과가 올바르지 않습니다.');
 return {...event,game:raw.game==='magic-english-world'?'magic-english-world':'magic-english',result:raw.result,target:text(raw.target,100),phrase:text(raw.phrase),transcript:text(raw.transcript,2000),errorCode:text(raw.errorCode,80),durationSeconds:Math.round(bounded(raw.durationSeconds,120))};
}
function summarize(events,from='',to='',now=Date.now()){
 const filtered=events.filter(e=>{const d=day(e.at);return (!from||d>=from)&&(!to||d<=to);});
 const summary={usage:{tralalerio:0,'magic-english':0,'magic-english-world':0},math:{total:0,correct:0,incorrect:0,skipped:0,hinted:0,seconds:0},speech:{total:0,complete:0,partial:0,retry:0,unheard:0,error:0,unique:0},mathTypes:[],speechTargets:[],days:[],firstRecordedAt:events.length?events.reduce((a,e)=>e.at<a?e.at:a,events[0].at):null};
 const types=new Map(),targets=new Map(),days=new Map();
 const end=to||day(now);for(let n=6;n>=0;n--){const d=day(Date.parse(end+'T12:00:00+09:00')-n*86400000);if(!from||d>=from)days.set(d,{date:d,math:0,english:0,world:0});}
 for(const e of filtered){
  if(e.kind==='usage'){summary.usage[e.game]+=e.seconds;const d=day(e.at);if(!days.has(d))days.set(d,{date:d,math:0,english:0,world:0});days.get(d)[e.game==='tralalerio'?'math':e.game==='magic-english'?'english':'world']+=e.seconds;}
  else if(e.kind==='math'){const s=summary.math;s.total++;s[e.result]++;s.hinted+=e.hints>0?1:0;s.seconds+=e.durationSeconds;const key=e.type+':'+e.grade;if(!types.has(key))types.set(key,{type:e.type,label:e.label,grade:e.grade,total:0,correct:0});const t=types.get(key);t.total++;if(e.result==='correct')t.correct++;}
  else {const s=summary.speech;s.total++;s[e.result]++;if(!targets.has(e.target))targets.set(e.target,{target:e.target,phrase:e.phrase,total:0,passed:0});const t=targets.get(e.target);t.total++;if(['complete','partial'].includes(e.result))t.passed++;}
 }
 summary.mathTypes=[...types.values()].sort((a,b)=>b.total-a.total);summary.speechTargets=[...targets.values()].sort((a,b)=>b.total-a.total);summary.speech.unique=summary.speechTargets.filter(t=>t.passed>0).length;summary.days=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date));return summary;
}
function createLearningRecords({store=createMagicStore()}={}){
 const prefix=id=>'learning:'+id+':event:';
 async function write(id,rawEvents){if(!validId(id))throw bad('개인 코드가 올바르지 않습니다.');if(!Array.isArray(rawEvents)||rawEvents.length<1||rawEvents.length>30)throw bad('기록은 한 번에 1~30개까지 저장합니다.');const events=rawEvents.map(e=>normalizeEvent(e));for(const e of events){const result=await store.putOnce(prefix(id)+e.id,e);if(JSON.stringify(result.value)!==JSON.stringify(e))throw Object.assign(Error('동일 기록 ID의 내용이 다릅니다.'),{status:409});}return {ok:true,acknowledged:events.map(e=>e.id)};}
 async function read(id,options={}){
  if(!validId(id))throw bad('개인 코드가 올바르지 않습니다.');
  for(const value of [options.from,options.to])if(value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))throw bad('날짜가 올바르지 않습니다.');
  if(options.from&&options.to&&options.from>options.to)throw bad('시작일이 종료일보다 늦습니다.');
  if(options.kind&&!['math','speech','usage'].includes(options.kind))throw bad('조회할 학습 종류가 올바르지 않습니다.');
  const events=await store.list(prefix(id)),summary=summarize(events,options.from,options.to);
  const query=text(options.search,150).toLowerCase(),kind=options.kind||'math',result=options.result||'';
  let source=events;
  if(kind==='usage'){
   const sessions=new Map();let legacy=null;
   for(const event of events.filter(e=>e.kind==='usage'&&e.game==='magic-english-world').sort((a,b)=>a.at.localeCompare(b.at))){
    let key=event.sessionId;
    if(!key){if(!legacy||Date.parse(event.at)-Date.parse(legacy.at)>120000)legacy={id:'legacy-'+event.id,at:event.at};key=legacy.id;legacy.at=event.at;}
    if(!sessions.has(key))sessions.set(key,{id:key,kind:'usage',game:event.game,at:event.at,startedAt:new Date(Date.parse(event.at)-event.seconds*1000).toISOString(),seconds:0,speechCount:0});
    const session=sessions.get(key);session.seconds+=event.seconds;session.at=event.at;
   }
   for(const event of events.filter(e=>e.kind==='speech'&&e.game==='magic-english-world'))if(sessions.has(event.sessionId))sessions.get(event.sessionId).speechCount++;
   source=[...sessions.values()];
  }
  const history=source.filter(e=>e.kind===kind&&(kind!=='usage'||e.game==='magic-english-world')&&(!options.game||e.game===options.game)&&(!options.from||day(e.at)>=options.from)&&(!options.to||day(e.at)<=options.to)&&(!result||e.result===result)&&(!query||JSON.stringify(e).toLowerCase().includes(query))).sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id));
  const page=Math.max(1,Math.floor(Number(options.page)||1)),pageSize=20;
  return {summary,history:history.slice((page-1)*pageSize,page*pageSize),total:history.length,page,pageSize,generatedAt:new Date().toISOString()};
 }
 return {write,read};
}
module.exports={createLearningRecords,normalizeEvent,summarize,validId,day};
