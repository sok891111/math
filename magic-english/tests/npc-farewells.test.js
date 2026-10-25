import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {FAREWELLS,NPC_FAREWELL_LABELS,farewellRole,chooseFarewell} from '../magic-english-farewells.js';
import {dialogueCharacter} from '../character-voices.js';
test('all NPCs have several contextual English farewells with Korean support',()=>{
 for(const id of Object.keys(NPC_FAREWELL_LABELS)){const pool=FAREWELLS[farewellRole(id)];assert(pool?.length>=4,id);assert.equal(new Set(pool.map(p=>p[0])).size,pool.length);for(const [english,korean]of pool){assert(/^[A-Za-z]/.test(english));assert(/[가-힣]/.test(korean));assert(!english.includes('Thanks for stopping by'));}}
 assert.equal(farewellRole('npc_cafe'),'cafe');assert.equal(farewellRole('s2_student'),'kid');assert.equal(farewellRole('s2_nono'),'trickster');assert.equal(farewellRole('s2_commuter'),'commuter');
});
test('random selection varies and avoids the last personal and global ending, including after save restoration',()=>{
 const all=new Set();for(const roll of [0,.3,.6,.99])all.add(chooseFarewell('npc_cafe',{},()=>roll)[0]);assert.equal(all.size,4);
 const pool=FAREWELLS.cafe,history=JSON.parse(JSON.stringify({npc_cafe:pool[0][0],last:pool[1][0]}));for(const roll of [0,.5,.999]){const [text]=chooseFarewell('npc_cafe',history,()=>roll);assert.notEqual(text,history.npc_cafe);assert.notEqual(text,history.last);}
 assert(chooseFarewell('unknown',{},()=>1)[0]);
});
test('ending stays a fixed page with matching voice text and pinned NPC cast',()=>{
 const source=fs.readFileSync(new URL('../magic-english-stage1.js',import.meta.url),'utf8');assert(source.includes('voiceClip:farewell'));assert(source.includes('learning.farewells[target.id]=farewell'));assert(!source.includes('Thanks for stopping by!'));
 assert.equal(dialogueCharacter(NPC_FAREWELL_LABELS.npc_ringo),'ringo');assert.equal(dialogueCharacter(NPC_FAREWELL_LABELS.s2_nono),'misspell');assert.equal(dialogueCharacter(NPC_FAREWELL_LABELS.npc_cafe),'cafe');
});
