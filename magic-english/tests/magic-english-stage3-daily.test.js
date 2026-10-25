import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {STAGE3_DAILY_PROFILES,STAGE3_DAILY_TOPICS,STAGE3_DAILY_PRACTICE,DAILY_FAREWELL,createStage3Daily} from '../magic-english-stage3-daily.js';
import {createInitialMagicEnglishState,parseMagicEnglishState} from '../magic-english-storage.js';
import {assessLearningSpeech} from '../magic-english-learning.js';
import {dialogueCharacter} from '../character-voices.js';
import {STAGE3_AUDIO_MANIFEST} from '../assets/audio/stage3/manifest.js';
import {conversationPages} from '../magic-english-conversations.js';

test('every C daily profile has 3–5 spoken answers, including companions and Coco',()=>{
 assert(Object.keys(STAGE3_DAILY_PROFILES).length>=20);
 for(const [id,profile]of Object.entries(STAGE3_DAILY_PROFILES))for(const name of profile.topics){
  const rows=STAGE3_DAILY_TOPICS[name];assert(rows.length>=3&&rows.length<=5,id+' / '+name);
  for(const row of rows){const p=STAGE3_DAILY_PRACTICE[row.key];assert(p,row.key);assert(row.key.startsWith('s3_daily_'));assert(assessLearningSpeech(p.text,row.key).passed,row.key);assert(!assessLearningSpeech(p.required.at(-1),row.key).passed,row.key);}
 }
});
test('daily turns resume after close/reload, rotate only on completion, and ignore duplicate callbacks',()=>{
 let state=createInitialMagicEnglishState(),pages;
 const daily=createStage3Daily({getState:()=>state,say:(_speaker,p)=>pages=conversationPages(p),save:()=>{},update:()=>{}});
 daily.open('s3_yard_keeper');let speaks=pages.filter(p=>p.type==='speak');assert.equal(speaks.length,4);
 const stale=speaks[0].onPass;speaks[0].onPass();stale();assert.equal(state.learning.stage3Daily.active.s3_yard_keeper.next,1);
 state=parseMagicEnglishState(JSON.stringify(state)).state;
 daily.open('s3_yard_keeper');speaks=pages.filter(p=>p.type==='speak');assert.equal(speaks.length,3);assert.equal(speaks[0].conversationTurn,2);assert.equal(speaks[0].conversationTotal,4);for(const p of speaks)p.onPass();
 assert.equal(state.learning.stage3Daily.visits.s3_yard_keeper,1);assert.equal(state.learning.stage3Daily.active.s3_yard_keeper,undefined);
 speaks.at(-1).onPass();assert.equal(state.learning.stage3Daily.visits.s3_yard_keeper,1);
 daily.open('s3_yard_keeper');speaks=pages.filter(p=>p.type==='speak');assert.equal(speaks.length,3);assert.equal(speaks[0].targetKey,'s3_daily_sunny');stale();assert.equal(state.learning.stage3Daily.active.s3_yard_keeper.next,0);
 assert.equal(state.stage3,undefined);assert.equal(state.alphabetPieces.length,0);
});
test('all daily questions, guides and closing lines have recorded audio for their actual actor',()=>{
 function recorded(character,text){const asset=STAGE3_AUDIO_MANIFEST[JSON.stringify([character,text])];assert(asset,character+': '+text);assert(fs.statSync(new URL('../'+asset,import.meta.url)).size>1000,asset);}
 for(const profile of Object.values(STAGE3_DAILY_PROFILES)){const character=dialogueCharacter(profile.speaker);for(const topic of profile.topics)for(const row of STAGE3_DAILY_TOPICS[topic]){recorded(character,row.question);recorded('amy',STAGE3_DAILY_PRACTICE[row.key].text);}recorded(character,DAILY_FAREWELL);}
 assert.equal(dialogueCharacter('학교 관리인'),'staff');assert.equal(dialogueCharacter('스쿨버스 기사'),'staff');assert.equal(dialogueCharacter('릴리'),'kid');assert.equal(dialogueCharacter('토미'),'tommy');assert.equal(dialogueCharacter('링고'),'ringo');assert.equal(dialogueCharacter('선생님'),'teacher');
});
