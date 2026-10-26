import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureStage3,advanceStage3,createStage3Maps,STAGE3_MAP_IDS,stage3Portal} from '../magic-english-stage3.js';
import {createInitialMagicEnglishState,parseMagicEnglishState} from '../magic-english-storage.js';
import {STAGE3_PRACTICE} from '../magic-english-stage3-learning.js';
import {STAGE3_DIALOGUES,STAGE3_NEIGHBOURS,createStage3Controller} from '../magic-english-stage3-controller.js';
import {assessLearningSpeech} from '../magic-english-learning.js';
import {conversationPages} from '../magic-english-conversations.js';
import {dialogueCharacter} from '../character-voices.js';
test('C targets reject isolated words and require Coco in the final call',()=>{
 for(const [key,p]of Object.entries(STAGE3_PRACTICE)){assert.equal(assessLearningSpeech(p.text,key).quality,'complete',key);assert(!assessLearningSpeech(p.required.at(-1),key).passed,key);assert(!assessLearningSpeech('',key).passed,key);}
 assert(!assessLearningSpeech('Come here!','s3_call_coco').passed);assert(assessLearningSpeech('Come here Cocoa','s3_call_coco').passed);assert(assessLearningSpeech("Let's try together.",'s3_together').passed);assert(assessLearningSpeech('Hello I am Gil-dong','s3_introduction').passed);assert.equal(assessLearningSpeech('I see cat','s3_cat').quality,'partial');
});
test('C transitions preserve old saves and require ordered boss rounds',()=>{
 const state=createInitialMagicEnglishState();assert(parseMagicEnglishState(JSON.stringify(state)).ok);const s=ensureStage3(state);assert(!advanceStage3(state,'round',0));assert(!advanceStage3(state,'complete'));
 advanceStage3(state,'word','cat');advanceStage3(state,'incident');advanceStage3(state,'word','come');advanceStage3(state,'tommy');for(const w of ['class','cat','come'])advanceStage3(state,'restore',w);assert(!advanceStage3(state,'round',1));
 for(let i=0;i<3;i++){assert(advanceStage3(state,'round',i));assert(!advanceStage3(state,'round',i));state.map='Classroom';assert(parseMagicEnglishState(JSON.stringify(state)).ok);}
 advanceStage3(state,'rescue');advanceStage3(state,'rescue');assert.deepEqual(state.alphabetPieces,['C']);advanceStage3(state,'complete');assert(s.completed);const bad=structuredClone(state);bad.stage3.boss.round=99;assert(!parseMagicEnglishState(JSON.stringify(bad)).ok);
});
test('every required map object is approachable before and after the incident',()=>{
 const maps=createStage3Maps(),state=createInitialMagicEnglishState(),s=ensureStage3(state);
 for(const variant of ['before','dark','recovered']){s.incidentSeen=variant!=='before';s.tommyReconciled=variant==='recovered';s.rescue.completed=variant==='recovered';for(const id of STAGE3_MAP_IDS){state.map=id;state.x=10;state.y=12;const map=maps[id];assert(parseMagicEnglishState(JSON.stringify(state)).ok,id);const seen=new Set(['10,12']),queue=[[10,12]];while(queue.length){const [x,y]=queue.shift();for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=a+','+b;if(!seen.has(k)&&map.isPassable(state,a,b)){seen.add(k);queue.push([a,b]);}}}assert(map.getObjects(state).filter(o=>o.kind==='npc'&&o.sprite!=='me_coco'&&o.sprite!=='me_shadow').length>=3,`${id} must have at least three NPCs`);for(const o of map.getObjects(state))assert([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has(`${o.x+dx},${o.y+dy}`)),`${variant} ${id} ${o.id}`);}}
 state.map='SchoolHall';assert.equal(stage3Portal(state,16,6).ready,false);s.words.class=true;assert(stage3Portal(state,16,6).ready);
});
test('C checkpoints resume remaining turns and keep the required path at 21 utterances',()=>{
 const state=createInitialMagicEnglishState();let pages;const c=createStage3Controller({getState:()=>state,say:(_speaker,p)=>{pages=conversationPages(p);},save:()=>{},update:()=>{},go:()=>{},queueReward:()=>{}});
 c.act({id:'s3_class'});let speaks=pages.filter(p=>p.type==='speak');assert.equal(speaks.length,3);speaks[0].onPass();c.act({id:'s3_class'});speaks=pages.filter(p=>p.type==='speak');assert.equal(speaks.length,2);speaks[0].onPass();speaks[1].onPass();assert(state.stage3.words.class);
 assert.equal(Object.values(STAGE3_DIALOGUES).reduce((n,rows)=>n+rows.length,0)+6,21);assert.equal(conversationPages([{type:'speak',noFollowup:true,targetKey:'s3_class'}]).length,1);
 assert.equal(dialogueCharacter('선생님'),'teacher');assert.equal(dialogueCharacter('토미'),'tommy');assert.equal(dialogueCharacter('사일런트 섀도'),'shadow');
});

test('every C guide has a fixed ElevenLabs recording and imported comic pages exist',async()=>{
 const fs=await import('node:fs');const {STAGE3_AUDIO_MANIFEST}=await import('../assets/audio/stage3/manifest.js');
 for(const p of Object.values(STAGE3_PRACTICE)){const asset=STAGE3_AUDIO_MANIFEST[JSON.stringify(['amy',p.text])];assert(asset,p.text);assert(fs.statSync(new URL('../'+asset,import.meta.url)).size>1000);}
 for(let page=1;page<=16;page++)assert(fs.existsSync(new URL(`../assets/stage3/page${String(page).padStart(2,'0')}.jpg`,import.meta.url)));
});

test('new school neighbours all have contextual dialogue and fixed character audio',async()=>{
 const {STAGE3_AUDIO_MANIFEST}=await import('../assets/audio/stage3/manifest.js');let pages;const state=createInitialMagicEnglishState();const c=createStage3Controller({getState:()=>state,say:(_speaker,p)=>pages=p,save:()=>{},update:()=>{},go:()=>{},queueReward:()=>{}});
 for(const [id,[speaker,,english]]of Object.entries(STAGE3_NEIGHBOURS)){c.act({id});assert.equal(pages[0].speaker,speaker);assert.equal(pages[0].voiceClip,english);assert(STAGE3_AUDIO_MANIFEST[JSON.stringify([dialogueCharacter(speaker),english])],id);}
});
test('new furniture is solid while all entry thresholds and the cat escape path remain open',async()=>{
 const {stage3Floor}=await import('../magic-english-stage3-layout.js');
 assert(!stage3Floor('SchoolYard',10,3));assert(stage3Floor('SchoolYard',10,5));
 assert(!stage3Floor('Classroom',9,4));assert(!stage3Floor('Classroom',4,6));
 assert(stage3Floor('SchoolHall',16,6));
 for(const [x,y]of [[17,6],[16,6],[16,7],[15,7],[14,7]])assert(stage3Floor('Classroom',x,y));
});

test('CLASS directory stays decorative and all C quests are attached to NPCs',()=>{
 const state=createInitialMagicEnglishState();state.map='SchoolHall';const map=createStage3Maps().SchoolHall;
 assert(!map.getObjects(state).some(o=>o.kind==='investigate'));
 for(const x of [9,10,11])assert.equal(map.isPassable(state,x,5),false);
 assert(map.isPassable(state,10,6));assert(map.isPassable(state,8,5));assert(map.isPassable(state,12,5));
 for(const m of Object.values(createStage3Maps()))assert(m.getObjects(state).every(o=>['npc','exit'].includes(o.kind)));
});

test('NPC-only C route resumes the first presentation, restores all words and grants C once',()=>{
 let state=createInitialMagicEnglishState(),pages,done,choices;const rewards=[];
 const c=createStage3Controller({getState:()=>state,say:(_title,p,d,ch)=>{pages=p;done=d;choices=ch;},save(){},update(){},go(){},queueReward:r=>rewards.push(r)});
 const pass=id=>{c.act({id});for(const p of pages)if(p.type==='speak')p.onPass();done?.();};
 pass('s3_amy');pass('s3_teacher');pass('s3_class_art');assert(state.stage3.words.cat);
 // Existing saves immediately before the old presentation target remain usable.
 state=parseMagicEnglishState(JSON.stringify(state)).state;
 c.act({id:'s3_teacher'});assert(!state.stage3.incidentSeen);assert(Array.isArray(pages));assert(pages.some(p=>p.speaker==='사일런트 섀도'));done();assert(state.stage3.incidentSeen);
 pass('s3_ringo');pass('s3_tommy');
 for(const [id,word]of [['s3_teacher','class'],['s3_class_art','cat'],['s3_ringo','come']]){c.act({id});assert(Array.isArray(choices));choices.find(([label])=>label==='C')[1]();for(const p of pages)if(p.type==='speak')p.onPass();assert(state.stage3.restored[word]);}
 pass('s3_shadow');assert(state.stage3.rescue.completed);assert.deepEqual(state.alphabetPieces,['C']);assert.equal(rewards.length,1);pass('s3_teacher');assert(state.stage3.completed);assert.equal(rewards.length,2);
});
