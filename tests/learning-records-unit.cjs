const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {createLearningRecords,normalizeEvent,summarize,day}=require('../lib/learning/records.cjs');
const {createMagicStore}=require('../lib/magicEnglishStore.cjs');
const at='2026-10-26T15:01:00.000Z';
const math=(id,result='correct')=>({id,kind:'math',at,result,type:'times_table',label:'구구단',grade:3,context:'attack',question:{type:'times_table',equation:'3 × 4 = ?',answer:[12]},answer:[12],hints:1,durationSeconds:8});
test('append-only history survives duplicate uploads and isolates children, with conflict detection',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'learning-records-'));
 try{const records=createLearningRecords({store:createMagicStore({client:false,vercel:false,dir})});
 const e=math('attempt-0001');await Promise.all([records.write('Kid001',[e]),records.write('Kid001',[e])]);
 assert.equal((await records.read('Kid001')).total,1);assert.equal((await records.read('Kid002')).total,0);
 await assert.rejects(records.write('Kid001',[{...e,answer:[13]}]),e=>e.status===409);
 assert.deepEqual((await records.read('Kid001')).history[0].answer,[12]);
 // Every item is validated before any part of a batch is persisted.
 await assert.rejects(records.write('Kid001',[math('attempt-0002'),{...e,id:'bad'}]));assert.equal((await records.read('Kid001')).total,1);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('summary distinguishes wrong answers, skips, recognition failures and building time; dates use Korea',()=>{
 const events=[math('attempt-0001'),math('attempt-0002','incorrect'),math('attempt-0003','skipped'),...['complete','partial','retry','unheard','error'].map((result,i)=>({id:'speech-000'+i,kind:'speech',at,target:'apple',phrase:'I want an apple.',result,transcript:'apple',durationSeconds:3})),...['tralalerio','magic-english','magic-english-world'].map((game,i)=>({id:'usage-000'+i,kind:'usage',game,at,seconds:15}))].map(e=>normalizeEvent(e));
 const s=summarize(events,'2026-10-27','2026-10-27');assert.equal(day(at),'2026-10-27');assert.equal(s.math.total,3);assert.equal(s.math.correct,1);assert.equal(s.math.incorrect,1);assert.equal(s.math.skipped,1);assert.equal(s.speech.unique,1);assert.equal(s.speech.total,5);assert.equal(s.speech.error,1);assert.equal(s.usage['magic-english-world'],15);assert.equal(s.days.length,1);assert.equal(s.days[0].english,15);
 assert.equal(summarize(events,'2026-10-26','2026-10-26').math.total,0);
});
test('all attempts remain accessible with pagination, date/result/search filters and stable ordering',async()=>{
 const values=new Map(),store={putOnce:async(k,v)=>{const existing=values.get(k);if(!existing)values.set(k,v);return {value:existing||v};},list:async p=>[...values].filter(([k])=>k.startsWith(p)).map(([,v])=>v)};
 const records=createLearningRecords({store}),events=Array.from({length:25},(_,i)=>math('attempt-'+String(i).padStart(4,'0'),i%2?'incorrect':'correct'));
 await records.write('Kid001',events);const first=await records.read('Kid001');assert.equal(first.total,25);assert.equal(first.history.length,20);assert.equal((await records.read('Kid001',{page:'2'})).history.length,5);
 const filtered=await records.read('Kid001',{result:'incorrect',search:'3 × 4',from:'2026-10-27',to:'2026-10-27'});assert.equal(filtered.total,12);assert.equal(filtered.summary.math.total,25);
 await assert.rejects(records.read('Kid001',{from:'2026-02-30'}));await assert.rejects(records.read('Kid001',{from:'2026-10-28',to:'2026-10-27'}));
});
test('ingestion bounds payloads and excludes unsupported games and raw audio',()=>{
 assert.throws(()=>normalizeEvent({id:'usage-0001',at,kind:'usage',game:'tralalerio',seconds:999}));
 assert.throws(()=>normalizeEvent({...math('attempt-0001'),question:{text:'x'.repeat(22000)}}));
 const e=normalizeEvent({id:'speech-0001',kind:'speech',at,result:'complete',phrase:'Hello!',transcript:'Hello!',target:'hello',audio:'secret-audio'});assert.equal(e.audio,undefined);
});
test('Minecraft Speak retains its source and play history groups heartbeats into visits',async()=>{
 const values=new Map(),store={putOnce:async(k,v)=>{if(!values.has(k))values.set(k,v);return {value:values.get(k)};},list:async p=>[...values].filter(([k])=>k.startsWith(p)).map(([,v])=>v)};
 const records=createLearningRecords({store}),sessionId='session-world-123';
 await records.write('Kid001',[{id:'world-usage-0001',kind:'usage',game:'magic-english-world',at,seconds:15,sessionId},{id:'world-usage-0002',kind:'usage',game:'magic-english-world',at:'2026-10-26T15:01:15.000Z',seconds:15,sessionId},{id:'world-speech-0001',kind:'speech',game:'magic-english-world',at,result:'complete',target:'apple',phrase:'I want an apple.',transcript:'I want an apple.',sessionId}]);
 const play=await records.read('Kid001',{kind:'usage'});assert.equal(play.total,1);assert.equal(play.history[0].seconds,30);assert.equal(play.history[0].speechCount,1);const speech=await records.read('Kid001',{kind:'speech',game:'magic-english-world'});assert.equal(speech.total,1);assert.equal(speech.history[0].game,'magic-english-world');
});
