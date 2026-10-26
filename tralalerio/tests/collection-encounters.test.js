import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
import {pickEncounter,createPokemon} from '../battle.js';import {Game} from '../engine.js';import {dexHabitats} from '../monster-dex.js';import {requestCapture,questionFor,submitMath} from '../math-challenge.js';
const require=createRequire(import.meta.url),apply=require('../tools/apply-collection-encounters.cjs'),model=require('../../creative/battle-model.js'),facto=require('../../creative/facto-puzzles.js');
const read=n=>JSON.parse(fs.readFileSync(new URL('../assets/'+n+'.json',import.meta.url))),data=read('battle-data'),dex=read('monster-dex'),maps=read('maps');
const expected=dex.entries.filter(e=>e.kind==='pokemon'&&e.national>=10&&e.national<=100).sort((a,b)=>a.national-b.national).map(e=>e.id);
test('all 91 species are equally selectable in every habitat/time, with local levels and original special weights',()=>{
 assert.equal(expected.length,91);
 for(const table of Object.values(data.encounters)){
  assert.deepEqual(table.collectionSpecies,expected);
  for(const hour of [7,12,22]){
   const seen=new Set();for(let i=0;i<91;i++){let calls=0;const mon=pickEncounter(table,hour,()=>calls++===0?0:(i+.5)/91);assert.equal(mon.species,expected[i]);assert.equal(mon.level,table[hour===7?'morning':hour===12?'day':'night'][0].level);seen.add(mon.species)}assert.equal(seen.size,91);
   let sum=0;const total=table.weights.reduce((a,b)=>a+b,0);for(let i=0;i<table.weights.length;i++){if(i>=7&&table.weights[i]){const roll=(sum+table.weights[i]/2)/total;assert.equal(pickEncounter(table,hour,()=>roll).species,table[hour===7?'morning':hour===12?'day':'night'][i].species);}sum+=table.weights[i];}
  }
 }
 assert.deepEqual(apply(structuredClone(data),dex),data);
});
test('all species have sprites, moves and safe low-level parties, can be caught and restored',()=>{
 for(const id of expected){
  for(const side of ['front','back'])assert.ok(fs.existsSync(new URL(`../assets/battle/${id}-${side}.png`,import.meta.url)));
  const mon=createPokemon(data,id,2,()=>.5);assert.ok(mon.moves.length);for(const m of data.species[id].learnset)assert.ok(data.moves[m.move],m.move);
  assert.equal(dexHabitats(id,data,maps).length,Object.keys(data.encounters).length);
  const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter(id,2);g.battle.s.animationPending=false;const c=requestCapture(g,model,facto,()=>.5);c.input=questionFor(c,model,facto).answer;assert.ok(submitMath(g,model,facto).ok);assert.equal(g.state.party.at(-1).species,id);assert.ok(new Game(maps,data).restore(g.serialize()));
 }
});
