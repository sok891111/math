import {test} from 'node:test';import assert from 'node:assert/strict';
import {LEARNING_TYPES,learningQuestion,validateLearning} from '../learning-puzzles.js';import {seededRandom} from '../math-challenge.js';
test('16 learning families generate varied unique-answer questions at both difficulties',()=>{
 for(const type of LEARNING_TYPES)for(const grade of [1,2]){
  const signatures=new Set();
  for(let seed=0;seed<300;seed++){
   const q=learningQuestion(type,grade,seededRandom(seed));signatures.add(JSON.stringify(q));
   assert.deepEqual(learningQuestion(type,grade,seededRandom(seed)),q);
   assert.ok(validateLearning(q,q.answer).ok);assert.ok(!validateLearning(q,[]).ok);
   assert.ok(!validateLearning(q,q.answer.map(n=>n+1)).ok);
   assert.ok(q.answer.every(n=>Number.isInteger(n)&&n>=0&&n<=99),type);
   if(q.choices||q.shapeChoices){const choices=q.choices||q.shapeChoices;assert.equal(choices.filter(c=>validateLearning(q,[c.value]).ok).length,1);}
   if(q.operands){const [a,b]=q.operands;assert.ok(a<=99&&b<=99);assert.equal(q.operator,'+');assert.ok(a+b<=99);if(type.startsWith('add_carry')){assert.ok(a%10+b%10>=10);assert.ok(q.carry);assert.match(q.hints[1].text,/받아올린/);assert.doesNotMatch(q.hints.map(h=>h.text).join(' '),new RegExp('= '+q.answer[0]+'(?![0-9])')); }}
   assert.equal(q.hints.length,3);
  }
  assert.ok(signatures.size>8,type+' variation');
 }
});

test('addition-only random pool includes carry and non-carry examples, story and missing sums',()=>{
 assert.ok(!LEARNING_TYPES.some(t=>t.startsWith('subtract')));
 for(const type of ['add_single','add_two','calc_puzzle','add_story']){
  const carries=new Set(),variants=new Set();
  for(let seed=0;seed<500;seed++){const q=learningQuestion(type,2,seededRandom(seed));carries.add(!!q.carry);variants.add(q.variant);assert.ok(!JSON.stringify(q).includes('−'));}
  assert.deepEqual([...carries].sort(),[false,true],type);
  if(type==='calc_puzzle')assert.equal(variants.size,4);
 }
});
