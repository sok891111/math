import {rollForQuestionType} from './math-selection-fixture.mjs';
import {levelForType,SUBTRACTION_TYPES} from '../math-levels.js';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
import {Game} from '../engine.js';import {createPokemon} from '../battle.js';import {MATH_TYPES,mathTypesForBattle,requestCapture,questionFor,submitMath,skipMath,validMathChallenge} from '../math-challenge.js';import {legendaryCaptureBlocked} from '../capture-rules.js';import {captureReward} from '../math-rewards.js';
const require=createRequire(import.meta.url),model=require('../../creative/battle-model.js'),facto=require('../../creative/facto-puzzles.js');
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
function game(species='mc_enderdragon'){const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter(species,3);g.battle.enemy.moves=[{id:'TACKLE',pp:35}];g.battle.enemy.hp=1;g.battle.s.animationPending=false;return g;}
test('eligible capture asks math and solving guarantees every species without a capture roll',()=>{
 for(const species of Object.keys(data.species))for(const low of [false,true]){
  const g=game(species);g.battle.enemy.hp=g.battle.enemy.stats.hp;if(low||legendaryCaptureBlocked(g.battle.enemy,data))g.battle.enemy.hp=1;const c=requestCapture(g,model,facto,()=>.999999);assert.equal(c.kind,'capture');assert.equal(g.state.balls,5);assert.equal(g.battle.s.turn,0);assert.equal(g.battle.action('ball'),false);assert.equal(g.battle.s.mathChallenge,c);
  const q=questionFor(c,model,facto);c.input=q.solution||q.answer;g.rng=()=>{throw Error('capture must not roll random chance')};assert.ok(submitMath(g,model,facto).resolved);assert.equal(g.battle.s.result,'caught');assert.equal(g.state.party.at(-1).species,species);assert.equal(g.state.balls,4);assert.equal(g.battle.s.turn,1);assert.ok(g.battle.s.logs.includes(captureReward(data.species[species].name)));assert.equal(g.battle.s.animationEvents.length,1);assert.equal(submitMath(g,model,facto).ok,false);
 }
});
test('all ordinary types and both current difficulties work for capture, with wrong answers or skipping costing one ball and an enemy turn',()=>{
 const pool=mathTypesForBattle(game('mc_zombie'));for(const type of pool)for(const grade of [3,4]){
  const g=game('mc_zombie'),rolls=[rollForQuestionType(g,pool,type),grade===3?.2:.9],c=requestCapture(g,model,facto,()=>rolls.shift());assert.equal(c.type,type);assert.equal(c.grade,SUBTRACTION_TYPES.includes(type)?(grade===3?1:2):levelForType(type,grade));const q=questionFor(c,model,facto);c.input=q.solution||q.answer;assert.ok(submitMath(g,model,facto).ok);assert.equal(g.battle.s.result,'caught');
 }
 for(const skip of [false,true]){const g=game(),hp=g.battle.player.hp,pp=g.battle.player.moves[0].pp,c=requestCapture(g,model,facto,()=>0);c.input=[];assert.ok((skip?skipMath(g):submitMath(g,model,facto)).resolved);assert.equal(g.battle.s.result,null);assert.equal(g.state.party.length,1);assert.equal(g.state.balls,4);assert.equal(g.battle.s.turn,1);assert.ok(g.battle.player.hp<hp);assert.equal(g.battle.player.moves[0].pp,pp);assert.deepEqual(g.battle.s.animationEvents.map(e=>e.kind),['capture',undefined]);assert.equal(g.battle.s.mathChallenge,undefined);}
});
test('capture question, partial answer and hints resume without reroll; tampered targets fail and full parties store one caught monster',()=>{
 const g=game(),c=requestCapture(g,model,facto,()=>0);c.hints=2;c.input[0]=1;const h=game();assert.ok(h.restore(g.serialize()));assert.deepEqual(h.battle.s.mathChallenge,c);assert.equal(requestCapture(h,model,facto,()=>{throw Error('must not reroll')}),h.battle.s.mathChallenge);
 const raw=g.serialize();for(const change of [c=>c.kind='bad',c=>c.targetSpecies='pidgey',c=>c.moveIndex=0,c=>c.playerSpecies='pidgey']){const s=JSON.parse(raw);change(s.battle.mathChallenge);assert.equal(h.restore(JSON.stringify(s)),false);}assert.ok(validMathChallenge(c,g.state,data));
 while(g.state.party.length<6)g.state.party.push(createPokemon(data,'pidgey',2,()=>.5));c.input=questionFor(c,model,facto).answer;submitMath(g,model,facto);assert.equal(g.state.party.length,6);assert.equal(g.state.storage.length,1);assert.equal(g.state.storage[0].species,'mc_enderdragon');assert.ok(h.restore(g.serialize()));assert.equal(h.state.storage.length,1);
 const none=game();none.state.balls=0;assert.equal(requestCapture(none,model,facto),null);const trainer=game();trainer.state.battle.trainer='CherrygroveRival';assert.equal(requestCapture(trainer,model,facto),null);
});
