import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {AirportLife,OPTIONAL_NPC_PRAISE} from '../magic-english-airport-life.js';
import {createAirportHallMap} from '../magic-english-story.js';import {createInitialMagicEnglishState} from '../magic-english-storage.js';
test('active story contains no borrowed game dialogue, numeric-health dialogue or canned praise clip calls',()=>{
 for(const file of ['magic-english-stage1.js','magic-english-story.js','magic-english-stage2.js','index.html']){
 const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');assert(!/포켓몬|피카츄|내 체력|My health is going down|I only have one heart|Great! Excellent!|voiceClip: 'amy_praise_great_excellent'/.test(source),file);
 }
 assert.equal(Object.keys(OPTIONAL_NPC_PRAISE).length,5);assert(new Set(Object.values(OPTIONAL_NPC_PRAISE).flat().map(v=>v[0])).size>=8);
});
test('airport visitors stay near home, avoid obstacles and player, and pause during conversations',()=>{
 let seed=7;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const life=new AirportLife(random),map=createAirportHallMap(),state=createInitialMagicEnglishState();state.map='AirportHall';state.stage='discover_words';
 const objects=map.getObjects(state),player={x:10,y:13},follower={x:11,y:13};let moved=false;
 for(let now=0;now<500000;now+=5000){life.update(now,{paused:false,objects,collision:map.collision,player,follower});const actual=life.objects(objects);const positions=new Set();for(const o of actual){const home=objects.find(h=>h.id===o.id);if(life.positions.has(o.id)){moved=true;assert(Math.abs(o.x-home.x)<=2&&Math.abs(o.y-home.y)<=1);assert.equal(map.collision[o.y][o.x],'FLOOR');assert(!(o.x===player.x&&o.y===player.y));}assert(!positions.has(o.x+','+o.y));positions.add(o.x+','+o.y);}}
 assert(moved);const before=JSON.stringify([...life.positions]);life.update(1000000,{paused:true,objects,collision:map.collision,player,follower});assert.equal(JSON.stringify([...life.positions]),before);
 for(const id of ['npc_staff','npc_amy','npc_ringo','npc_hwalbin'])assert(!life.positions.has(id));
 const moving=life.objects(objects).find(o=>life.positions.has(o.id));const position=life.positions.get(moving.id);const halfway=life.sample(moving,position.movedAt+260);assert.equal(halfway.x,(position.fromX+position.x)/2);assert.equal(halfway.y,(position.fromY+position.y)/2);
});
test('all five optional NPCs walk near the child, including cafe staff and guard',()=>{
 const map=createAirportHallMap(),state=createInitialMagicEnglishState();state.stage='discover_words';
 const objects=map.getObjects(state);
 for(const id of ['npc_traveler','npc_pilot','npc_kid_traveler','npc_cafe','npc_guard']){
   const home=objects.find(o=>o.id===id),life=new AirportLife(()=>0);
   life.update(1000,{paused:false,objects,collision:map.collision,player:{x:home.x,y:home.y+1,facing:'right'}});
   const moved=life.objects(objects).find(o=>o.id===id);
   assert(moved.x!==home.x||moved.y!==home.y,id+' walks despite being next to the player');
 }
});
test('the NPC directly in front waits for interaction while other NPCs keep walking',()=>{
 const map=createAirportHallMap(),state=createInitialMagicEnglishState();state.stage='discover_words';
 const objects=map.getObjects(state),cafe=objects.find(o=>o.id==='npc_cafe'),life=new AirportLife(()=>0);
 life.update(1000,{paused:false,objects,collision:map.collision,player:{x:cafe.x,y:cafe.y+1,facing:'up'}});
 assert(!life.positions.has('npc_cafe'));assert(life.positions.has('npc_kid_traveler'));
});
