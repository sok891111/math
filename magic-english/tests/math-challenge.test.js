import {isMathReward} from '../math-rewards.js';
import {createPokemon,damage} from '../battle.js';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {Game} from '../engine.js';
import {MATH_TYPES,mathGrade,questionFor,emptyInput,requestMath,submitMath,skipMath,seededRandom,validateQuestion} from '../math-challenge.js';
const require=createRequire(import.meta.url),model=require('../creative/battle-model.js'),facto=require('../creative/facto-puzzles.js');
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
function game(){const g=new Game(maps,data,{random:()=>.5});g.chooseStarter('리아코');g.startEncounter('mc_zombie',3);g.battle.s.animationPending=false;return g}
test('all 27 generated problem types share a seeded random pool and valid grade 1 and 2 solutions',()=>{
 assert.equal(MATH_TYPES.length,27);
 for(const type of MATH_TYPES)for(const grade of [1,2])for(let seed=0;seed<100;seed++){const c={type,seed,grade},q=questionFor(c,model,facto),answer=q.solution||q.answer;assert.equal(validateQuestion(q,answer,model,facto).ok,true,type+' '+seed);assert.deepEqual(questionFor(c,model,facto),q);assert.ok(Array.isArray(emptyInput(q)))}
 for(const map of Object.keys(maps))assert.equal(mathGrade(map,80),3,map);
});
test('50% boundary gives immediate attack or a critical challenge',()=>{
 for(const roll of [0,.499999,.5,.999999]){const g=game();const seq=[roll,.2,.4];const c=requestMath(g,0,model,facto,()=>seq.shift());assert.equal(!!c,roll<.5);assert.equal(g.battle.s.turn,roll<.5?0:1)}
});
test('all correct answers force critical once; wrong answers and skip give only enemy a turn',()=>{
 for(const type of MATH_TYPES){const g=game(),pp=g.battle.player.moves[0].pp;const seq=[0,(MATH_TYPES.indexOf(type)+.1)/MATH_TYPES.length,.4];const c=requestMath(g,0,model,facto,()=>seq.shift());assert.equal(c.type,type);assert.equal(g.battle.action('move',0),false);const q=questionFor(c,model,facto);c.input=q.solution||q.answer;assert.equal(submitMath(g,model,facto).ok,true);assert.equal(g.battle.s.turn,1);assert.equal(g.battle.player.moves[0].pp,pp-1);assert.ok(g.battle.s.animationEvents.some(e=>e.actor==='player'&&e.critical));assert.ok(g.battle.s.logs.findIndex(isMathReward)>g.battle.s.animationEvents.find(e=>e.actor==='player').logIndex);assert.equal(submitMath(g,model,facto).ok,false)}
 for(const skip of [false,true]){const g=game(),pp=g.battle.player.moves[0].pp,enemy=g.battle.enemy.hp;const c=requestMath(g,0,model,facto,()=>0);c.input=[];const r=skip?skipMath(g):submitMath(g,model,facto);assert.equal(r.resolved,true);assert.equal(g.battle.s.turn,1);assert.equal(g.battle.player.moves[0].pp,pp);assert.equal(g.battle.enemy.hp,enemy);assert.ok(g.battle.s.animationEvents.every(e=>e.kind==='math-fail'||e.actor==='enemy'));assert.equal(g.battle.s.mathChallenge,undefined);assert.equal(g.battle.s.animationEvents[0].kind,'math-fail');const restored=game();assert.ok(restored.restore(g.serialize()));assert.equal(restored.battle.s.turn,1)}
});
test('partial puzzle, seed and hints survive reload; selecting another move keeps the same question',()=>{
 const g=game(),c=requestMath(g,0,model,facto,seededRandom(42));c.hints=2;c.attempts=1;const q=questionFor(c,model,facto);c.input=emptyInput(q);const raw=g.serialize(),h=game();assert.ok(h.restore(raw));assert.deepEqual(h.battle.s.mathChallenge,c);assert.deepEqual(questionFor(h.battle.s.mathChallenge,model,facto),q);
 const same=requestMath(h,1,model,facto);assert.equal(same.seed,c.seed);assert.equal(same.type,c.type);assert.equal(same.moveIndex,1);assert.equal(h.battle.s.turn,0);
});
test('bag or switch cancels the pending problem while corrupted saves are rejected',()=>{
 const g=game();requestMath(g,0,model,facto,seededRandom(1));const raw=g.serialize();for(const mutate of [c=>c.type='bad',c=>c.grade=0,c=>c.seed=-1,c=>c.moveIndex=99,c=>c.input=['bad'],c=>c.hints=10]){const bad=JSON.parse(raw);mutate(bad.battle.mathChallenge);assert.equal(g.restore(JSON.stringify(bad)),false);assert.equal(g.serialize(),raw)}
 g.state.potions=1;g.battle.player.hp--;g.battle.action('potion');assert.equal(g.battle.s.mathChallenge,undefined);
});

test('support moves bypass puzzles and a solved critical does not leak into later attacks',()=>{
 const support=game();assert.equal(requestMath(support,1,model,facto,()=>{throw Error('support must not roll')}),null);assert.equal(support.battle.s.turn,1);
 const g=game(),c=requestMath(g,0,model,facto,()=>0),q=questionFor(c,model,facto);c.input=q.solution||q.answer;submitMath(g,model,facto);assert.ok(g.battle.s.animationEvents.filter(e=>e.actor==='enemy').every(e=>!e.critical));g.battle.s.animationPending=false;if(!g.battle.s.result){g.battle.action('move',0);assert.ok(g.battle.s.animationEvents.every(e=>!e.critical))}
});

test('solved attacks always hit and apply actual Gen II critical damage even with worst accuracy and an RNG that never rolls critical',()=>{
 const g=game();g.rng=()=>.999999;g.state.party[0]=createPokemon(data,'pikachu',20,()=>.5);g.state.party[0].moves=[{id:'THUNDERSHOCK',pp:30}];g.battle.s.enemy=createPokemon(data,'mc_slime',30,()=>.5);g.battle.s.playerStages.accuracy=-6;g.battle.s.enemyStages.evasion=6;
 const p=structuredClone(g.battle.player),e=structuredClone(g.battle.enemy),move=data.moves.THUNDERSHOCK,normal=damage(data,p,e,move,{random:g.rng}),critical=damage(data,p,e,move,{critical:true,random:g.rng});assert.ok(critical>normal);
 const c=requestMath(g,0,model,facto,()=>0),q=questionFor(c,model,facto);c.input=q.solution||q.answer;assert.equal(submitMath(g,model,facto).ok,true);const event=g.battle.s.animationEvents.find(e=>e.actor==='player');assert.equal(event.critical,true);assert.equal(event.failed,false);assert.equal(event.before.enemy.hp-event.after.enemy.hp,critical);assert.equal(g.battle.player.moves[0].pp,29);
 g.battle.s.animationPending=false;const hp=g.battle.enemy.hp;g.battle.action('move',0);assert.equal(g.battle.enemy.hp,hp,'the next unsolved attack obeys normal accuracy');
});

test('random pool is 80% middle and 20% hard, persisting either without reroll',()=>{
 for(const [seedRoll,grade] of [[0,3],[.799999,3],[.8,4],[.999999,4]]){
  const g=game(),rolls=[0,.1,seedRoll],c=requestMath(g,0,model,facto,()=>rolls.shift());
  assert.equal(c.grade,grade);const raw=g.serialize(),h=game();assert.ok(h.restore(raw));
  const restored=requestMath(h,0,model,facto,()=>{throw Error('must not reroll')});
  assert.equal(restored.grade,grade);assert.deepEqual(questionFor(restored,model,facto),questionFor(c,model,facto));
 }
});

test('developer lab grade 3 has valid solutions and production-compatible input sizes for every active type',()=>{
 for(const type of MATH_TYPES)for(let seed=0;seed<100;seed++){
  const q=questionFor({type,seed,grade:3},model,facto);assert.equal(validateQuestion(q,q.solution||q.answer,model,facto).ok,true,type);assert.ok(emptyInput(q).length<=36,type);
 }
});
