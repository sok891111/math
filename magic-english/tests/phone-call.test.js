import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {Game} from '../engine.js';import {beginLabCall,finishLabCall,LAB_CALL_PAGES} from '../phone-call.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
test('egg return phone locks movement and saves each phase; completion occurs once after hanging up',()=>{
 const g=new Game(maps,data);g.startAdventure();g.state.flags.mysteryEgg=true;g.initializeParty();g.enter(maps.MrPokemonsHouse,2,6);assert.equal(beginLabCall(g.state),false);g.move('down');assert.equal(g.state.map,'Route30');assert.equal(beginLabCall(g.state),true);assert.equal(beginLabCall(g.state),false);
 for(const phase of ['ring','talk','hangup']){g.state.phoneCall.phase=phase;g.state.phoneCall.page=1;const h=new Game(maps,data);assert.ok(h.restore(g.serialize()));assert.equal(h.move('down').type,'phone-call-active');assert.equal(h.state.phoneCall.phase,phase);}
 const raw=g.serialize();for(const change of [c=>c.phase='bad',c=>c.page=LAB_CALL_PAGES.length,c=>c.version=0]){const bad=JSON.parse(raw);change(bad.phoneCall);assert.equal(g.restore(JSON.stringify(bad)),false);assert.equal(g.serialize(),raw);}
 finishLabCall(g.state);assert.equal(g.state.flags.labCall,true);assert.equal(beginLabCall(g.state),false);assert.equal(g.state.items.MYSTERY_EGG,1);assert.ok(g.restore(g.serialize()));
});
