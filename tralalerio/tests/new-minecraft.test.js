import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {Game} from '../engine.js';
const data=JSON.parse(fs.readFileSync('assets/battle-data.json')),maps=JSON.parse(fs.readFileSync('assets/maps.json')),dex=JSON.parse(fs.readFileSync('assets/monster-dex.json'));
test('new companions occur in every habitat, have both sprites, capture and restore',()=>{
 for(const kind of ['blaze','irongolem','snowgolem','wolf']){
  const id='mc_'+kind;assert.ok(dex.entries.some(e=>e.id===id&&e.description.length>10));
  for(const side of ['front','back'])assert.ok(fs.statSync(`assets/battle/${id}-${side}.png`).size>100);
  for(const table of Object.values(data.encounters))for(const period of ['morning','day','night'])assert.equal(table[period].filter(mon=>mon.species===id).length,1);
  const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter(id,3);g.battle.s.animationPending=false;assert.ok(g.battle.action('ball',0,{captureAnswer:true}));assert.equal(g.battle.s.result,'caught');assert.ok(new Game(maps,data).restore(g.serialize()));
 }
});
test('new monster builder runs before encounter weights and dex in the full pipeline',()=>{
 const text=fs.readFileSync('tools/rebuild-assets.cjs','utf8');assert.ok(text.indexOf("'add-minecraft.cjs'")<text.indexOf("'apply-challenge-policy.cjs'"));
});
