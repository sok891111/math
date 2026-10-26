import test from 'node:test';
import assert from 'node:assert/strict';
import {MOB_SCRIPTS,MOB_CAST,mobPractice,mobScript,newMobLearning,validateMobLearning,enqueueMobConversation,advanceMobConversation,learnedDailyTargets} from '../block-world/mob-conversations.js';
import {assessLearningSpeech} from '../magic-english-learning.js';
import {VoxelWorld,DEFAULT_BAR,validateSave} from '../block-world/world.js';
import {createInventory} from '../block-world/inventory.js';
test('all monster scripts keep 3–5 ordered Speak turns with familiar, assessable daily expressions',()=>{
 for(const s of MOB_SCRIPTS){assert(s.rows.length>=3&&s.rows.length<=5,s.id);assert(MOB_CAST[s.type]);assert(s.intro&&s.ending);for(const row of s.rows){const p=mobPractice(row.target);assert(p,row.target);assert(assessLearningSpeech(p.text,row.target).passed);assert(!assessLearningSpeech('',row.target).passed);assert(row.question.length<=350);}}
 for(const type of Object.keys(MOB_CAST))assert(MOB_SCRIPTS.filter(s=>s.type===type).length>=3);
});
test('dialogues use actual learned topics first and rotate without rerolling on reload',()=>{
 const learned=learnedDailyTargets({learning:{stage3Daily:{visits:{s3_librarian:1}},practicedTargets:{s4_daily_read:true}}});assert(learned.has('s3_daily_book'));assert(learned.has('s3_daily_read'));
 const state=newMobLearning();enqueueMobConversation(state,'zombie','kill-1',learned);assert.equal(state.queue[0].script,'zombie-book');const resumed=JSON.parse(JSON.stringify(state));validateMobLearning(resumed);assert.equal(resumed.queue[0].script,'zombie-book');
 const all=new Set(MOB_SCRIPTS.flatMap(s=>s.rows.map(r=>r.target))),rotation=newMobLearning();for(let i=0;i<3;i++)enqueueMobConversation(rotation,'pig','pig-'+i,all);assert.equal(new Set(rotation.queue.map(s=>s.script)).size,3);
});
test('a defeat starts exactly one checkpointed conversation; only the current successful turn advances it',()=>{
 const s=newMobLearning();assert(enqueueMobConversation(s,'creeper','death-1'));assert(!enqueueMobConversation(s,'creeper','death-1'));assert(!advanceMobConversation(s,'death-1',1));assert(!advanceMobConversation(s,'wrong-id',0));assert(advanceMobConversation(s,'death-1',0));assert(!advanceMobConversation(s,'death-1',0));assert.equal(s.queue[0].next,1);
 const restored=JSON.parse(JSON.stringify(s));validateMobLearning(restored);assert.equal(restored.queue[0].next,1);assert(advanceMobConversation(restored,'death-1',1));assert(advanceMobConversation(restored,'death-1',2));assert.equal(restored.queue.length,0);assert(!enqueueMobConversation(restored,'creeper','death-1'));assert(!advanceMobConversation(restored,'death-1',2));
});
test('multiple deaths queue safely; invalid progress cannot silently reset or bypass the dialogue',()=>{
 const s=newMobLearning();enqueueMobConversation(s,'pig','pig-1');enqueueMobConversation(s,'chicken','chicken-1');assert(!advanceMobConversation(s,'chicken-1',0));assert.throws(()=>validateMobLearning({...s,queue:[{...s.queue[0],next:999}]}));assert.throws(()=>validateMobLearning({...s,queue:[{...s.queue[0],script:'unknown'}]}));
});
test('legacy worlds stay valid and pending dialogue is part of the existing world save',()=>{
 const world=new VoxelWorld('mob-dialogue','flat').generate(),s=newMobLearning();enqueueMobConversation(s,'pig','pig-1');const save={format:1,seed:world.seed,name:'아이 월드',terrain:'flat',edits:[],player:{...world.spawn,yaw:0,pitch:0},bar:DEFAULT_BAR,inventory:createInventory()};assert(validateSave(save));assert(validateSave({...save,mobLearning:s}));assert.throws(()=>validateSave({...save,mobLearning:{...s,queue:[{id:'bad',script:'pig-hello',next:-1}]}}));
});
test('every monster question and familiar answer has fixed ElevenLabs audio for its actual actor',async()=>{
 const fs=await import('node:fs'),{MOB_AUDIO_MANIFEST:manifest}=await import('../assets/audio/mobs/manifest.js');
 const check=(actor,text)=>{const asset=manifest[JSON.stringify([actor,text])];assert(asset,actor+': '+text);assert(fs.statSync(new URL('../'+asset,import.meta.url)).size>1000);};
 for(const script of MOB_SCRIPTS){const actor=MOB_CAST[script.type].character;for(const row of script.rows){check(actor,row.question);check('amy',mobPractice(row.target).text);}check(actor,script.ending);}
});
