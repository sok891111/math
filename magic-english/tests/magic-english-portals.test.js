import test from 'node:test';import assert from 'node:assert/strict';
import {walkingPortal} from '../magic-english-portals.js';import {createInitialMagicEnglishState} from '../magic-english-storage.js';import {advanceStage2,createStage2Maps} from '../magic-english-stage2.js';
test('airport door and every Stage 2 entrance are activated by walking coordinates',()=>{
 const state=createInitialMagicEnglishState();state.map='AirportHall';assert.equal(walkingPortal(state,10,1).ready,false);state.rewardReceipts['stage-1-first-clear']={};assert(walkingPortal(state,10,1).ready);
 state.map='BusStop';assert(walkingPortal(state,3,13).ready);assert(!walkingPortal(state,10,2).ready);for(const word of ['bus','bag','big'])advanceStage2(state,'word',word);assert(walkingPortal(state,10,2).ready);
 state.map='BusInterior';assert(!walkingPortal(state,10,12).ready);advanceStage2(state,'driver');assert(walkingPortal(state,10,12).ready);
 state.map='NextStop';assert.equal(walkingPortal(state,3,13).id,'s2_back');assert(walkingPortal(state,3,13).ready);assert(!walkingPortal(state,10,2).ready);for(const word of ['bus','bag','big'])advanceStage2(state,'sign',word);advanceStage2(state,'recover');assert(walkingPortal(state,10,2).ready);
});
test('investigation targets are not entrances and return positions do not immediately warp again',()=>{
 const state=createInitialMagicEnglishState(),maps=createStage2Maps();state.map='BusStop';assert.equal(walkingPortal(state,15,3),null);assert.equal(walkingPortal(state,4,3),null);
 for(const [map,x,y]of [['BusStop',3,12],['BusInterior',10,11],['NextStop',10,11]]){state.map=map;assert(maps[map].isPassable(state,x,y));assert.equal(walkingPortal(state,x,y),null);}
});
test('older Stage 2 saves with driver success keep boarding and return-trip progress',async()=>{
 const {ensureStage2}=await import('../magic-english-stage2.js');const state=createInitialMagicEnglishState();state.map='NextStop';state.stage2={words:{bus:true,bag:true,big:true},driver:true,boarded:false};const progress=ensureStage2(state);assert(progress.boarded);assert(progress.alighted);assert(walkingPortal(state,3,13).ready);
});
