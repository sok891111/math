import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Game} from '../engine.js';import {createPokemon} from '../battle.js';
import {ESCAPE_TEXT} from '../capture-rules.js';
import {captureTimeline} from '../capture-animation.js';
import {CAPTURE_FRAMES,WOBBLE_PROBABILITIES,CAPTURE_SOURCE} from '../capture-source.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
function game(){const g=new Game(maps,data,{random:()=>.5});g.chooseStarter('리아코');return g}
function throwBall(caught=false,full=false){const g=game();if(full)while(g.state.party.length<6)g.state.party.push(createPokemon(data,'pidgey',2,()=>.5));g.startEncounter('mc_enderdragon',3);g.battle.enemy.hp=1;g.battle.enemy.moves=[{id:'TACKLE',pp:35}];g.battle.action('ball',0,{captureAnswer:caught});return g}
test('capture assets and timings come from the pinned original Gold routines',()=>{
 assert.equal(CAPTURE_SOURCE.commit,'c90f31dadef17f033a8f1bdada701b26cef18241');assert.equal(WOBBLE_PROBABILITIES.length,24);assert.deepEqual(WOBBLE_PROBABILITIES.find(([limit])=>limit===100),[100,201]);assert.equal(CAPTURE_FRAMES.check,48);assert.equal(CAPTURE_FRAMES.bounce,128);
 const manifest=JSON.parse(fs.readFileSync('assets/animations/frames.json'));assert.equal(manifest.ballWobble.sourceFrameset,'PokeBall5');assert.deepEqual(manifest.ballWobble.timeline.map(f=>f.frames),[7,7,7,7,7]);assert.equal(manifest.ballPoof.sourceFrameset,'BallPoof');
});
test('unsolved capture escapes without wobble before the enemy counterattack',()=>{
 const g=throwBall(false),s=g.battle.s,e=s.animationEvents[0];assert.equal(e.caught,false);assert.equal(e.shakes,0);assert.equal(e.mathCapture,true);assert.equal(e.threshold,undefined);assert.ok(s.logs.includes(ESCAPE_TEXT[0]));assert.equal(s.animationEvents[1].actor,'enemy');assert.equal(g.state.balls,4);assert.equal(g.state.party.length,1);assert.equal(s.turn,1);const h=game();assert.ok(h.restore(g.serialize()));
});
test('successful capture always wobbles three times and consumes exactly one ball with no retaliation',()=>{
 for(const full of [false,true]){const g=throwBall(true,full),s=g.battle.s,e=s.animationEvents[0];assert.equal(s.result,'caught');assert.equal(e.shakes,3);assert.equal(s.animationEvents.length,1);assert.equal(g.state.balls,4);assert.equal((full?g.state.storage:g.state.party).at(-1).species,'mc_enderdragon');const h=game();assert.ok(h.restore(g.serialize()));assert.equal(h.state.balls,4);assert.equal(h.state.party.length,g.state.party.length);assert.equal(h.state.storage.length,g.state.storage.length);}
});
test('original bounce/wait/wobble order is represented before caught or escape result',()=>{
 for(const caught of [false,true])for(let shakes=0;shakes<=3;shakes++){
  const t=captureTimeline({caught,shakes});assert.deepEqual(t.phases.slice(0,7).map(p=>p.name),['throw','open','poof','absorb','close','bounce','settle']);assert.equal(t.phases.filter(p=>p.name==='shake').length,shakes);assert.equal(t.phases.at(-1).name,caught?'caught':'escape');
 }
});
test('malformed capture events are rejected without changing an existing save',()=>{
 const g=throwBall(true),raw=g.serialize();for(const change of [e=>e.shakes=4,e=>e.shakes=-1,e=>e.caught='yes',e=>e.threshold=256,e=>e.shakes=1]){const bad=JSON.parse(raw);change(bad.battle.animationEvents[0]);assert.equal(g.restore(JSON.stringify(bad)),false);assert.equal(g.serialize(),raw);}
});

test('legacy 0–3-shake capture animations still restore without recalculating chance',()=>{
 for(let shakes=0;shakes<=3;shakes++){const g=throwBall(false),raw=JSON.parse(g.serialize()),event=raw.battle.animationEvents[0];delete event.mathCapture;event.threshold=73;event.shakes=shakes;assert.ok(g.restore(JSON.stringify(raw)));assert.equal(g.battle.s.animationEvents[0].shakes,shakes);}
});
