const assert=require('node:assert/strict');
const model=require('../creative/battle-model.js');
function seeded(seed){let x=seed;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
for(let g=1;g<=5;g++)for(const type of ['pattern','mirror','path','logic'])for(let seed=1;seed<=120;seed++){
 const q=model.puzzle(type,g,seeded(seed));
 assert.ok(model.validate(q,type==='path'?q.solution:q.answer).ok,`${type}/${g}/${seed} has a valid solution`);
 if(type==='logic'){const solutions=model.permutations(q.cards).filter(p=>model.validate(q,p).ok);assert.equal(solutions.length,1,'logic clues must determine exactly one layout');assert.ok(!model.validate(q,Array(q.count).fill(q.cards[0])).ok);}
 if(type==='path'){assert.ok(q.gems.length>0);assert.ok(!model.validate(q,[q.start,q.goal]).ok,'cannot teleport');assert.ok(!model.validate(q,[q.start,...q.solution,q.goal]).ok,'cannot repeat cells');}
 if(type==='mirror'){const changed=q.answer.slice();changed[0]=1-changed[0];assert.ok(!model.validate(q,changed).ok);assert.ok(!model.validate(q,[]).ok);}
 if(type==='pattern'){const changed=q.answer.slice();changed[0]=(changed[0]+1)%3;assert.ok(!model.validate(q,changed).ok);assert.ok(!model.validate(q,q.answer.slice(1)).ok);}
}
const kinds=model.habitats.flatMap(h=>h.kinds);assert.equal(kinds.length,24);assert.equal(new Set(kinds).size,24);
for(let g=1;g<=5;g++){const base=model.captureRate(g),bonus=model.captureRate(g,{perfect:true,combo:3,companion:true});assert.ok(base<1&&bonus<1&&bonus>base);assert.equal(model.capture(g,{},()=>0),true);assert.equal(model.capture(g,{perfect:true,combo:3,companion:true},()=>.999),false);if(g>1)assert.ok(base<model.captureRate(g-1));}
console.log('PASS: 2,400 generated puzzles, unique logic solutions, valid paths and gems, wrong/incomplete answers, all 24 characters, graded capture odds and timing bonuses.');
