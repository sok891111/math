import test from 'node:test';import assert from 'node:assert/strict';
import {advanceTime,isNight,daylight,CYCLE_SECONDS} from '../block-world/day-night.js';
import {chickenDrops,collectLoot} from '../block-world/loot.js';import {createInventory} from '../block-world/inventory.js';
import {VoxelWorld} from '../block-world/world.js';import {AnimalWorld,ANIMALS} from '../block-world/animals.js';
import {SENTENCE_PRACTICE,practiceStep} from '../magic-english-practice.js';import {assessLearningSpeech,REPEAT_DIALOGUES,SPEECH_TARGETS} from '../magic-english-learning.js';import {STAGE1_WORDS} from '../magic-english-story.js';import {STAGE2_WORDS} from '../magic-english-stage2.js';
test('daytime becomes night and dawn, fixed time pauses, and the night remains visible',()=>{
 assert(!isNight(.27));assert(isNight(advanceTime(.49,4)));assert(!isNight(advanceTime(.99,5)));assert(Math.abs(advanceTime(.27,50,false)-.27)<1e-9);assert(Math.abs(advanceTime(.27,CYCLE_SECONDS)-.27)<1e-9);for(let t=0;t<1;t+=.02)assert(daylight(t)>=.19);
});
test('hostile mobs only appear and can be targeted at night, including after restoring a world',()=>{
 const world=new VoxelWorld('night').generate(),mobs=new AnimalWorld(world),p={...world.spawn,yaw:0,pitch:0};mobs.entities=mobs.entities.filter(a=>a.type==='creeper').slice(0,1);Object.assign(mobs.entities[0],{x:p.x,y:p.y,z:p.z-2});mobs.update(0,p,{night:false});assert(mobs.entities[0].hidden);assert.equal(mobs.target(p),null);mobs.update(0,p,{night:true});assert(!mobs.entities[0].hidden);assert(mobs.target(p));mobs.update(.1,p,{night:false});assert.equal(mobs.entities[0].fuse,0);const restored=new AnimalWorld(world,mobs.snapshot());restored.setNight(false);assert(restored.entities.every(a=>!ANIMALS[a.type].hostile||a.hidden));
});
test('chickens drop one raw chicken and zero to two feathers; collection survives inventory cloning',()=>{
 for(const roll of [0,.4,.99]){const drops=chickenDrops(()=>roll);assert.deepEqual(drops[0],{itemId:'raw_chicken',quantity:1});assert.equal(drops[1]?.quantity||0,Math.floor(roll*3));}
 const world=new VoxelWorld('loot').generate(),p={...world.spawn,yaw:0,pitch:-.35};const mobs=new AnimalWorld(world,{version:1,hostilesInitialized:true,entities:[{id:'chicken-loot',type:'chicken',x:p.x,y:p.y,z:p.z-2,yaw:0,hp:2,wait:2,respawn:0}]});const hit=mobs.attack(p,2);assert(hit.defeated);assert.equal(hit.drops[0].itemId,'raw_chicken');const stock=collectLoot(createInventory(),hit.drops);assert.equal(createInventory(stock).loot.raw_chicken,1);assert.equal(mobs.attack(p,2),null);assert.equal(Object.values(stock.counts).length,0);
});
test('A/B clues, repeated conversations and boss turns all share short everyday sentences',()=>{
 for(const [key,p]of Object.entries(SENTENCE_PRACTICE)){assert.equal(SPEECH_TARGETS[key],p.text);assert(p.text.split(' ').length>=3);const onPass=()=>{};const boss=practiceStep({type:'speak',targetKey:key,targetPhrase:key,bossBattle:{hp:1,maxHp:2},onPass});assert.equal(boss.targetPhrase,p.text);assert.equal(boss.guideClip,p.text);assert.equal(boss.onPass,onPass);assert.equal(boss.bossBattle.hp,1);assert(!assessLearningSpeech(key.replaceAll('_',' '),key).passed);assert.equal(assessLearningSpeech(p.text,key).quality,'complete');}
 for(const [key,word]of Object.entries({...STAGE1_WORDS,...STAGE2_WORDS}))assert.equal(word.sentence,SENTENCE_PRACTICE[key].text);
 for(const variants of Object.values(REPEAT_DIALOGUES))for(const [,phrase,key]of variants)if(SENTENCE_PRACTICE[key])assert.equal(phrase,SENTENCE_PRACTICE[key].text);
});
test('partial sentence effort earns one block; a lone word or scrambled words cannot clear a sentence quest',()=>{
 assert.equal(assessLearningSpeech('I see airplane','airplane').quantity,1);assert.equal(assessLearningSpeech('I want apple','apple').quality,'partial');assert.equal(assessLearningSpeech("It's a big bus!",'big').quantity,2);assert(!assessLearningSpeech('Bus','bus').passed);assert(!assessLearningSpeech('bus the is here','bus').passed);assert(!assessLearningSpeech('I see an apple','airplane').passed);
});

test('all upgraded sentence guides are prerecorded for Amy and Ringo',async()=>{
 const {CHARACTER_AUDIO_MANIFEST:clips}=await import('../character-audio-manifest.js');const fs=await import('node:fs/promises');
 for(const character of ['amy','ringo'])for(const phrase of new Set(Object.values(SENTENCE_PRACTICE).map(p=>p.text))){const path=clips[JSON.stringify([character,phrase])];assert(path,character+' '+phrase);assert((await fs.stat(new URL('../'+path,import.meta.url))).size>0);}
});
