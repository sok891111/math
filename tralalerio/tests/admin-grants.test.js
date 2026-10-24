import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../engine.js';
import {createPokemon} from '../battle.js';
import {applyAdminGrants} from '../admin-grants.js';
import {validPC,pcAction} from '../pc.js';
const maps=JSON.parse(fs.readFileSync(new URL('../assets/maps.json',import.meta.url))),data=JSON.parse(fs.readFileSync(new URL('../assets/battle-data.json',import.meta.url)));
const grant={id:'test-recovery',species:'mew',level:50,quantity:10};
const game=()=>{const g=new Game(maps,data,{random:()=>.5});g.startAdventure();return g;};
test('grant preserves existing companions, delivers only to PC boxes, registers dex, survives restore without duplication',()=>{
 const g=game(),original=structuredClone(g.state.party),money=g.state.money;
 assert.equal(applyAdminGrants(g,[grant]),10);
 assert.deepEqual(g.state.party,original);assert.equal(g.state.money,money);
 assert.equal(g.state.party.length,1);assert.equal(g.state.storage.length,10);assert.ok(validPC(g.state));assert.ok(g.state.monsterDex.caught.includes('mew'));
 const restored=game();assert.ok(restored.restore(g.serialize()));assert.equal(applyAdminGrants(restored,[grant]),0);
 assert.equal(restored.state.storage.length,10);
});
test('full current box uses another box; full PC defers entire grant without a receipt',()=>{
 const g=game();g.state.party=Array.from({length:6},()=>createPokemon(data,'pikachu',5,()=>.5));
 g.state.storage=Array.from({length:20},()=>createPokemon(data,'mew',5,()=>.5));delete g.state.pc;
 assert.equal(applyAdminGrants(g,[{...grant,quantity:1}]),1);assert.equal(g.state.pc.assignments[20],1);assert.ok(validPC(g.state));
 g.state.storage=Array.from({length:280},()=>createPokemon(data,'mew',5,()=>.5));delete g.state.pc;
 assert.equal(applyAdminGrants(g,[{...grant,id:'full'}]),0);assert.ok(!g.state.adminGrantReceipts.includes('full'));
});
test('battle defers grants, invalid payloads do not add monsters',()=>{
 const g=game();g.startEncounter('rattata',2);assert.equal(applyAdminGrants(g,[grant]),0);assert.equal(g.state.adminGrantReceipts,undefined);
 const h=game();for(const bad of [{level:101},{quantity:0},{species:'invalid'},{quantity:1.5}])assert.equal(applyAdminGrants(h,[{...grant,...bad}]),0);
});

test('child withdraws granted monster through a Pokemon Center PC',()=>{
 const g=game();applyAdminGrants(g,[{...grant,quantity:1}]);
 const center=Object.entries(maps).find(([,m])=>m.collision.some(row=>row.includes('PC')));
 assert.ok(center);g.state.map=center[0];
 assert.equal(g.state.party.length,1);assert.equal(g.state.storage.length,1);
 const result=pcAction(g,'withdraw',0);assert.ok(result.ok,result.message);
 assert.equal(g.state.party.length,2);assert.equal(g.state.party[1].species,'mew');assert.equal(g.state.party[1].level,50);
 assert.equal(g.state.storage.length,0);assert.ok(validPC(g.state));
});
