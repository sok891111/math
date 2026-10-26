import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialMagicEnglishState,validMagicEnglishState} from '../magic-english-storage.js';
import {ensureStage4,advanceStage4,createStage4Maps,stage4Floor,validStage4} from '../magic-english-stage4.js';
import {STAGE4_PRACTICE,STAGE4_TRAINS} from '../magic-english-stage4-learning.js';
import {STAGE4_DAILY_PROFILES,STAGE4_DAILY_TOPICS,createStage4Daily} from '../magic-english-stage4-daily.js';
import {createStage4Controller,STAGE4_DIALOGUES} from '../magic-english-stage4-controller.js';
import {sentenceAssessment} from '../magic-english-practice.js';
const initial=()=>createInitialMagicEnglishState();
test('D requires polite sentences in the correct word order',()=>{
 for(const [key,p]of Object.entries(STAGE4_PRACTICE)){assert(sentenceAssessment(p.text,key).passed,key);assert(!sentenceAssessment(p.text.split(' ').reverse().join(' '),key).passed,key);}
 assert(!sentenceAssessment('Open door','s4_open').passed);assert(!sentenceAssessment('I would like water','s4_boss_water').passed);
 assert.equal(Object.values(STAGE4_DIALOGUES).reduce((n,rows)=>n+rows.length,0)+6,21);
});
test('all four D maps have three friendly NPCs and every target has a reachable approach',()=>{
 const state=initial();
 for(const [id,map]of Object.entries(createStage4Maps())){
  const objects=map.getObjects(state),seen=new Set(['10,12']),todo=[[10,12]];
  while(todo.length){const [x,y]=todo.shift();for(const [dx,dy]of [[0,1],[1,0],[0,-1],[-1,0]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&map.isPassable(state,nx,ny)){seen.add(k);todo.push([nx,ny]);}}}
  assert(objects.filter(o=>o.kind==='npc'&&o.id!=='s4_misspell').length>=3,id);
  for(const o of objects)assert([[0,1],[1,0],[0,-1],[-1,0]].some(([dx,dy])=>seen.has((o.x+dx)+','+(o.y+dy))),id+':'+o.id);
 }
 assert(!stage4Floor('CafeteriaHall',7,5));
});
test('boss only advances sequentially after all trains, restores D once and resumes midfight',()=>{
 const state=initial(),s=ensureStage4(state);
 assert(!advanceStage4(state,'round',0));for(const key of Object.keys(s.words))advanceStage4(state,'word',key);advanceStage4(state,'incident');for(const key of Object.keys(s.trains))advanceStage4(state,'train',key);
 assert(!advanceStage4(state,'round',1));assert(advanceStage4(state,'round',0));const restored=JSON.parse(JSON.stringify(state));assert(validMagicEnglishState(restored));assert.equal(restored.stage4.boss.round,1);
 assert(advanceStage4(restored,'round',1));assert(advanceStage4(restored,'round',2));assert(!advanceStage4(restored,'round',2));assert.deepEqual(restored.alphabetPieces,['D']);assert(restored.stage4.fragmentD);assert(!restored.stage4.completed);advanceStage4(restored,'complete');assert(restored.stage4.completed);
 assert(!validStage4({...restored.stage4,trainSelections:{water:[1,1]}}));assert(validMagicEnglishState(initial()));
});
test('every D daily profile has 3–5 turns, checkpoints resume and C conversation memory is independent',()=>{
 const state=initial();let pages;const daily=createStage4Daily({getState:()=>state,say:(_,p)=>pages=p,save(){},update(){}});
 for(const [id,profile]of Object.entries(STAGE4_DAILY_PROFILES)){
  for(const topic of profile.topics)assert(STAGE4_DAILY_TOPICS[topic].length>=3&&STAGE4_DAILY_TOPICS[topic].length<=5);
  daily.open(id);const turns=pages.filter(p=>p.type==='speak');assert(turns.length>=3&&turns.length<=5);turns[0].onPass();daily.open(id);assert.equal(pages.filter(p=>p.type==='speak').length,turns.length-1);for(const p of pages)if(p.type==='speak'){assert(sentenceAssessment(p.targetPhrase,p.targetKey).passed);p.onPass();}assert.equal(state.learning.stage4Daily.visits[id],1);
 }
 assert.equal(state.learning.stage3Daily,undefined);
});
test('controller grants the D fragment exactly once after the third successful boss utterance',()=>{
 const state=initial(),s=ensureStage4(state),grants=[];let pages;for(const k of Object.keys(s.words))s.words[k]=true;s.doorOpened=s.incidentSeen=true;for(const k of Object.keys(s.trains))s.trains[k]=true;
 const c=createStage4Controller({getState:()=>state,say:(_,p)=>pages=p,save(){},update(){},go(){},queueReward:r=>grants.push(r)});
 c.act({id:'s4_boss'});const turns=pages.filter(p=>p.type==='speak');turns[0].onPass();turns[1].onPass();assert.equal(grants.length,0);turns[2].onPass();turns[2].onPass();assert.equal(grants.length,1);assert.equal(grants[0].id,'stage4:fragment:v2');assert.equal(pages.at(-1).letter,'D');assert.deepEqual(state.alphabetPieces,['D']);
 c.act({id:'s4_meal'});for(const p of pages)if(p.type==='speak')p.onPass();assert(s.completed);assert.equal(grants[1].id,'stage4:clear:v2');c.act({id:'s4_meal'});for(const p of pages)if(p.type==='speak')p.onPass();assert.equal(grants.length,2);
});

test('D guides and every daily actor have fixed ElevenLabs files, plus sixteen original comic pages',async()=>{
 const fs=await import('node:fs'),{STAGE4_AUDIO_MANIFEST:audio}=await import('../assets/audio/stage4/manifest.js'),{DAILY_FAREWELL}=await import('../magic-english-stage3-daily.js'),{dialogueCharacter}=await import('../character-voices.js');
 const check=(actor,text)=>{const asset=audio[JSON.stringify([actor,text])];assert(asset,actor+': '+text);assert(fs.statSync(new URL('../'+asset,import.meta.url)).size>1000);};
 for(const p of Object.values(STAGE4_PRACTICE))check('amy',p.text);
 for(const profile of Object.values(STAGE4_DAILY_PROFILES)){for(const topic of profile.topics)for(const row of STAGE4_DAILY_TOPICS[topic])check(dialogueCharacter(profile.speaker),row.question);check(dialogueCharacter(profile.speaker),DAILY_FAREWELL);}
 for(let i=1;i<=16;i++)assert(fs.statSync(new URL(`../assets/stage4/page${String(i).padStart(2,'0')}.jpg`,import.meta.url)).size>1000);
});
