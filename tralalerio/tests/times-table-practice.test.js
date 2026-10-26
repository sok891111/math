import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {Game} from '../engine.js';
import {requestMath,requestCapture,requestEscape,questionFor,submitMath,upgradeChallenge,validMathChallenge} from '../math-challenge.js';
const require=createRequire(import.meta.url),model=require('../../creative/battle-model.js'),facto=require('../../creative/facto-puzzles.js');
const maps=JSON.parse(fs.readFileSync(new URL('../assets/maps.json',import.meta.url))),data=JSON.parse(fs.readFileSync(new URL('../assets/battle-data.json',import.meta.url)));
function game(species='pidgey'){const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter(species,3);g.battle.enemy.hp=1;g.battle.s.animationPending=false;return g;}
test('every move including support, capture and escape uses practice even against bosses',()=>{
 for(const species of ['pidgey','mew','mc_enderdragon'])for(const kind of ['attack','support','capture','escape'])for(const roll of [0,.25,.75,.9999]){
  const g=game(species);if(kind==='support')g.battle.player.moves[0]={id:'GROWL',pp:40};
  const c=kind==='capture'?requestCapture(g,model,facto,()=>roll):kind==='escape'?requestEscape(g,model,facto,()=>roll):requestMath(g,0,model,facto,()=>roll);
  assert.equal(c.type,'times_table');assert.equal(c.practice,'times-table-2-9');assert.ok(validMathChallenge(c,g.state,data));
  const q=questionFor(c,model,facto);assert.ok(q.operands[0]>=2&&q.operands[0]<=9);assert.ok(q.operands[1]>=1&&q.operands[1]<=9);c.input=q.answer;assert.ok(submitMath(g,model,facto).resolved);
 }
});
test('all eight tables and nine multipliers appear and saved questions resume',()=>{
 const tables=new Set(),multipliers=new Set();for(let seed=0;seed<3000;seed++){const q=questionFor({type:'times_table',grade:3,practice:'times-table-2-9',seed},model,facto);tables.add(q.operands[0]);multipliers.add(q.operands[1]);assert.equal(q.answer[0],q.operands[0]*q.operands[1]);assert.ok(q.choices.some(c=>c.value===q.answer[0]));}
 assert.equal(tables.size,8);assert.equal(multipliers.size,9);
 const g=game(),c=requestMath(g,0,model,facto,()=>.9);c.input=questionFor(c,model,facto).answer;const h=game();assert.ok(h.restore(g.serialize()));assert.deepEqual(h.battle.s.mathChallenge,c);assert.equal(upgradeChallenge(h,model,facto),false);
});
test('pending old questions migrate without spending resources or changing scheduling history',()=>{
 const g=game(),c=requestCapture(g,model,facto);delete c.practice;c.type='logic';c.grade=5;
 const before={turn:g.battle.s.turn,balls:g.state.balls,schedule:structuredClone(g.state.mathSchedule)};
 assert.ok(upgradeChallenge(g,model,facto));assert.equal(c.type,'times_table');assert.equal(g.battle.s.turn,before.turn);assert.equal(g.state.balls,before.balls);assert.deepEqual(g.state.mathSchedule,before.schedule);
});
