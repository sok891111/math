import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Game} from '../engine.js';import {createPokemon,catchThreshold} from '../battle.js';
import {captureWobbles,ESCAPE_TEXT} from '../capture-rules.js';
import {captureTimeline} from '../capture-animation.js';
import {CAPTURE_FRAMES,WOBBLE_PROBABILITIES,CAPTURE_SOURCE} from '../capture-source.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
function game(){const g=new Game(maps,data,{random:()=>.5});g.chooseStarter('리아코');return g}
function throwBall(shakes,caught=false,full=false){const g=game();if(full)while(g.state.party.length<6)g.state.party.push(createPokemon(data,'pidgey',2,()=>.5));g.startEncounter('mc_enderdragon',3);const b=g.battle;const random=[0,caught?0:.999,...Array(shakes).fill(0),.999];b.rng=()=>random.length?random.shift():.5;b.action('ball');return g}
test('capture assets and timings come from the pinned original Gold routines',()=>{
 assert.equal(CAPTURE_SOURCE.commit,'c90f31dadef17f033a8f1bdada701b26cef18241');assert.equal(WOBBLE_PROBABILITIES.length,24);assert.deepEqual(WOBBLE_PROBABILITIES.find(([limit])=>limit===100),[100,201]);assert.equal(CAPTURE_FRAMES.check,48);assert.equal(CAPTURE_FRAMES.bounce,128);
 const manifest=JSON.parse(fs.readFileSync('assets/animations/frames.json'));assert.equal(manifest.ballWobble.sourceFrameset,'PokeBall5');assert.deepEqual(manifest.ballWobble.timeline.map(f=>f.frames),[7,7,7,7,7]);assert.equal(manifest.ballPoof.sourceFrameset,'BallPoof');
});
test('failed captures preserve 0,1,2,3 wobbles, matching result text, before the enemy counterattack',()=>{
 for(let shakes=0;shakes<=3;shakes++){
  const g=throwBall(shakes),s=g.battle.s,e=s.animationEvents[0];assert.equal(e.kind,'capture');assert.equal(e.caught,false);assert.equal(e.shakes,shakes);assert.ok(s.logs.includes(ESCAPE_TEXT[shakes]));assert.equal(s.animationEvents[1].actor,'enemy');assert.equal(s.animationEvents[1].kind,undefined);assert.equal(g.state.balls,4);assert.equal(g.state.party.length,1);assert.equal(s.turn,1);assert.ok(s.animationPending);
  const restored=game();assert.ok(restored.restore(g.serialize()));assert.deepEqual(restored.battle.s.animationEvents,s.animationEvents);
 }
});
test('successful capture always wobbles three times and consumes exactly one ball with no retaliation',()=>{
 assert.equal(captureWobbles(true,1,()=>{throw Error('Success must not reroll shakes')}),3);
 for(const full of [false,true]){const g=throwBall(0,true,full),s=g.battle.s,e=s.animationEvents[0];assert.equal(s.result,'caught');assert.equal(e.shakes,3);assert.equal(s.animationEvents.length,1);assert.equal(g.state.balls,4);assert.equal((full?g.state.storage:g.state.party).at(-1).species,'mc_enderdragon');const h=game();assert.ok(h.restore(g.serialize()));assert.equal(h.state.balls,4);assert.equal(h.state.party.length,g.state.party.length);assert.equal(h.state.storage.length,g.state.storage.length);}
});
test('original bounce/wait/wobble order is represented before caught or escape result',()=>{
 for(const caught of [false,true])for(let shakes=0;shakes<=3;shakes++){
  const t=captureTimeline({caught,shakes});assert.deepEqual(t.phases.slice(0,7).map(p=>p.name),['throw','open','poof','absorb','close','bounce','settle']);assert.equal(t.phases.filter(p=>p.name==='shake').length,shakes);assert.equal(t.phases.at(-1).name,caught?'caught':'escape');
 }
});
test('malformed capture events are rejected without changing an existing save',()=>{
 const g=throwBall(3,true),raw=g.serialize();for(const change of [e=>e.shakes=4,e=>e.shakes=-1,e=>e.caught='yes',e=>e.threshold=256,e=>e.shakes=1]){const bad=JSON.parse(raw);change(bad.battle.animationEvents[0]);assert.equal(g.restore(JSON.stringify(bad)),false);assert.equal(g.serialize(),raw);}
});

test('Gold HP byte scaling and sleep/freeze bonus match original integer arithmetic',()=>{
 const p=createPokemon(data,'onix',50,()=>.5);p.stats.hp=100;p.hp=100;
 assert.equal(catchThreshold(data,p),15);p.hp=50;assert.equal(catchThreshold(data,p),30);
 p.hp=1;assert.equal(catchThreshold(data,p),44);
 for(const status of ['burn','poison','paralysis']){p.status=status;assert.equal(catchThreshold(data,p),44);}
 for(const status of ['sleep','freeze']){p.status=status;assert.equal(catchThreshold(data,p),54);}
 p.status=null;p.stats.hp=300;p.hp=150;assert.equal(catchThreshold(data,p),30);
});
test('all 256 random bytes give the exact original catch odds, never guaranteed at full HP',()=>{
 for(const species of Object.keys(data.species)){
  const p=createPokemon(data,species,4,()=>.5),full=catchThreshold(data,p);
  assert.ok(full<255,species);p.hp=1;assert.ok(catchThreshold(data,p)>full,species);
  let catches=0;
  for(let roll=0;roll<256;roll++){
   const g=game();g.startEncounter(species,4);const b=g.battle;
   let calls=0;b.rng=()=>++calls===1?0:roll/256;b.action('ball');
   if(b.s.result==='caught')catches++;
   else {assert.equal(b.s.animationEvents[0].caught,false);assert.equal(g.state.party.length,1);assert.equal(b.s.animationEvents[1].actor,'enemy');}
  }
  assert.equal(catches,full+1,species);
 }
});
test('same throw fails at full HP and succeeds after weakening the wild monster',()=>{
 for(const hp of ['full','weak']){
  const g=game();g.startEncounter('mc_enderdragon',4);const b=g.battle;
  if(hp==='weak')b.enemy.hp=1;
  b.rng=()=>.5;b.action('ball');assert.equal(b.s.result==='caught',hp==='weak');
  assert.equal(g.state.balls,4);
 }
});
