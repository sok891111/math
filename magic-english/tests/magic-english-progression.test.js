import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import http from 'node:http';
import {assessLearningSpeech,REPEAT_DIALOGUES,SPEECH_TARGETS} from '../magic-english-learning.js';
import {createStage2Maps,ensureStage2,STAGE2_WORDS} from '../magic-english-stage2.js';
import {AirportLife} from '../magic-english-airport-life.js';
import {dialogueCharacter} from '../character-voices.js';
import {createInitialMagicEnglishState,parseMagicEnglishState} from '../magic-english-storage.js';
const require=createRequire(import.meta.url);const {createMagicRewards}=require('../tools/magic-english-rewards.cjs');
test('recognition distinguishes missing, meaningful words and complete sentences',()=>{
 assert.equal(assessLearningSpeech('', 'help_please').quantity,0);
 assert.equal(assessLearningSpeech('please','help_please').quantity,0);
 assert.equal(assessLearningSpeech('My friend! Help, please.','help_please').quantity,2);
 assert.equal(assessLearningSpeech('Apple','apple').quantity,0);
 assert.equal(assessLearningSpeech('am','i_am_gildong').passed,false);
 assert.equal(assessLearningSpeech('Where is the bus?','where_bus').quantity,2);
 for(const variants of Object.values(REPEAT_DIALOGUES))assert(new Set(variants.map(v=>v.join('|'))).size>=3);
});
test('Stage 2 maps preserve saves and all objects can be approached',()=>{
 const state=createInitialMagicEnglishState();ensureStage2(state);
 for(const map of Object.values(createStage2Maps())){
 state.map=map.id;assert(parseMagicEnglishState(JSON.stringify(state)).ok);
 const visited=new Set(['10,12']),queue=[[10,12]];
 while(queue.length){const [x,y]=queue.shift();for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=a+','+b;if(!visited.has(k)&&map.isPassable(state,a,b)){visited.add(k);queue.push([a,b]);}}}
 for(const object of map.getObjects(state))assert([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>visited.has((object.x+dx)+','+(object.y+dy))),object.id+' accessible');
 }
});
test('signed speech rewards, milestone prerequisites, idempotency, profile isolation and restart recovery',async t=>{
 const dataDir=await mkdtemp(path.join(os.tmpdir(),'magic-rewards-'));let rewards=createMagicRewards({dataDir});
 const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://local');if(await rewards.handle(req,res,url))return;await rewards.blockApi(req,res,url);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>server.close(r));await rm(dataDir,{recursive:true,force:true});});const base='http://127.0.0.1:'+server.address().port;
 const post=body=>fetch(base+'/api/magic-english/rewards',{method:'POST',body:JSON.stringify(body)});
 assert.equal((await post({userId:'child',type:'clear',stage:2})).status,400);
 for(const target of ['airplane','apple','ask','help_please','bus','bag','big','where_bus','my_bag','big_bus']){
 const result=rewards.assessment(assessLearningSpeech(SPEECH_TARGETS[target],target),'child',target.replaceAll('_','-'));
 const body={userId:'child',type:'speech',token:result.rewardToken};assert.equal((await post(body)).status,200);assert.equal((await (await post(body)).json()).created,false);
 assert.equal((await post({...body,userId:'other'})).status,400);
 }
 const pending=rewards.assessment(assessLearningSpeech('Thank you!','thank_you'),'child','pending');rewards=createMagicRewards({dataDir});assert.equal((await post({userId:'child',type:'speech',token:pending.rewardToken})).status,200);
 for(const stage of [1,2])for(const type of ['fragment','clear']){const body={userId:'child',stage,type};assert.equal((await post(body)).status,200);assert.equal((await (await post(body)).json()).created,false);}
 const ledger=await(await fetch(base+'/api/magic-english/block-world/rewards?userId=child')).json();assert.equal(ledger.rewards.length,15);
 assert.deepEqual(ledger.rewards.find(r=>r.rewardId==='stage2:clear:v2').blocks,[{blockId:2,quantity:5},{blockId:5,quantity:5},{blockId:33,quantity:5}]);
 assert.equal((await post({userId:'child',type:'speech',token:'forged'})).status,400);
});
test('Stage 2 words, villains (Misspell & Misunderstanding Trio) and roaming NPCs walk safely without blocking quests',()=>{
 assert.equal(STAGE2_WORDS.bus.phonetic,'[bʌs]');
 assert.equal(STAGE2_WORDS.bag.phonetic,'[bæɡ]');
 assert.equal(STAGE2_WORDS.big.phonetic,'[bɪɡ]');
 assert.equal(dialogueCharacter('노노 (오해 삼총사)','No, no!'),'misspell');
 assert.equal(dialogueCharacter('웅얼이 (오해 삼총사)','Hmm...'),'misspell');
 assert.equal(dialogueCharacter('따라쟁이 (오해 삼총사)','Gab! Gab!'),'kid');
 assert.equal(dialogueCharacter('버스 기사님','Hello!'),'staff');
 const state=createInitialMagicEnglishState();ensureStage2(state);
 const maps=createStage2Maps();
 const life=new AirportLife(()=>0.25);
 const busStopObjs=maps.BusStop.getObjects(state);
 life.update(3000,{paused:false,objects:busStopObjs,collision:maps.BusStop.collision,player:{x:10,y:12,facing:'up'},follower:{x:10,y:13}});
 const moved=life.objects(busStopObjs);
 assert(moved.some(o=>o.id==='s2_nono'&&(o.x!==12||o.y!==4)));
 assert(moved.some(o=>o.id==='s2_commuter'&&(o.x!==3||o.y!==7)));
});
