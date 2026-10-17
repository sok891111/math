import {createPokemon,damage} from '../battle.js';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
import {Game} from '../engine.js';import {MATH_REWARDS,isMathReward,mathRewardIndex} from '../math-rewards.js';import {requestMath,questionFor,submitMath,skipMath} from '../math-challenge.js';
const require=createRequire(import.meta.url),model=require('../../creative/battle-model.js'),facto=require('../../creative/facto-puzzles.js');
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
function game(){const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter('mc_enderknight',3);g.battle.s.animationPending=false;return g;}
test('eight reward lines credit solving, follow the successful critical, persist and do not alter combat randomness',()=>{
 const seen=new Set(),rngCounts=new Set();
 for(let seed=0;seed<MATH_REWARDS.length;seed++){
  const g=game(),rolls=[0,0,seed/4294967296];let draws=0;g.rng=()=>{draws++;return .5};
  const c=requestMath(g,0,model,facto,()=>rolls.shift());c.input=questionFor(c,model,facto).answer;assert.ok(submitMath(g,model,facto).ok);
  const index=g.battle.s.logs.findIndex(isMathReward),text=g.battle.s.logs[index];assert.ok(index<g.battle.s.logs.indexOf('급소에 맞았다!'));assert.ok(index<g.battle.s.logs.findIndex(t=>t.includes('현재 체력이')));assert.ok(index>g.battle.s.animationEvents.find(e=>e.actor==='player').logIndex);assert.match(text,/(수학|정답|문제)/);assert.match(text,/강력한 공격에 성공했다/);
  assert.ok(g.battle.s.animationEvents.some(e=>e.actor==='player'&&e.critical&&e.before.enemy.hp>e.after.enemy.hp));
  const h=game();assert.ok(h.restore(g.serialize()));assert.equal(h.battle.s.logs[index],text);seen.add(text);rngCounts.add(draws);
 }
 assert.equal(seen.size,8);assert.equal(rngCounts.size,1);
 for(let i=0;i<8;i++)assert.notEqual(mathRewardIndex(i,i),i);
 assert.ok(isMathReward('강력한 공격에 성공했다!'));
});
test('normal attacks and failed math do not receive the solved-math reward',()=>{
 const normal=game();normal.battle.action('move',0);assert.ok(!normal.battle.s.logs.some(isMathReward));
 const wrong=game();requestMath(wrong,0,model,facto,()=>0);skipMath(wrong);assert.ok(!wrong.battle.s.logs.some(isMathReward));
});

test('resisted critical keeps its damage calculation but omits the discouraging effectiveness line',()=>{
 for(const critical of [false,true]){
  const g=game();g.state.party[0].moves=[{id:'EMBER',pp:25}];g.battle.s.enemy=createPokemon(data,'cyndaquil',5,()=>.5);g.battle.s.enemy.moves=[{id:'TACKLE',pp:35}];
  g.battle.action('move',0,{forceCritical:critical,mathRewardSeed:1});
  const event=g.battle.s.animationEvents.find(e=>e.actor==='player');assert.equal(event.critical,critical);
  const lines=g.battle.s.logs.slice(event.logIndex,event.endIndex);assert.equal(lines.includes('효과가 별로인 듯하다…'),!critical);
  assert.equal(lines.includes('급소에 맞았다!'),critical);assert.ok(event.after.enemy.hp<event.before.enemy.hp);assert.equal(event.before.enemy.hp-event.after.enemy.hp,Math.min(event.before.enemy.hp,damage(data,event.before.player,event.before.enemy,data.moves.EMBER,{critical,random:()=>.5})));
 }
});
