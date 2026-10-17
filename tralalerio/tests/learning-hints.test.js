import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
import {learningHints,additionExplanation,puzzleHintSteps} from '../learning-hints.js';import {LEARNING_TYPES,learningQuestion} from '../learning-puzzles.js';import {MATH_TYPES,seededRandom,requestMath,upgradeChallenge,questionFor} from '../math-challenge.js';import {Game} from '../engine.js';
const require=createRequire(import.meta.url),model=require('../../creative/battle-model.js'),facto=require('../../creative/facto-puzzles.js');
test('74+18 story hints explain its actual operands and carrying, without invisible blocks',()=>{
 const h=learningHints({type:'add_story',story:true,operands:[74,18],models:[],answer:[92]}).map(x=>x.text).join(' ');
 assert.match(h,/74개/);assert.match(h,/18개/);assert.match(h,/4 \+ 8/);assert.match(h,/7 \+ 1/);assert.doesNotMatch(h,/92|=|그래서|남아/);assert.doesNotMatch(h,/막대|작은 점/);
});
test('missing operands do not reveal themselves through models, rules calculate both steps, erroneous results are corrected',()=>{
 const seen=new Set();for(let seed=0;seed<600;seed++){
  const q=learningQuestion('calc_puzzle',1,seededRandom(seed)),[a,b]=q.operands,h=q.hints.map(x=>x.text).join(' ');seen.add(q.variant);
  if(q.variant==='missing'){assert.deepEqual(q.models,[]);assert.equal(q.answer[0],b);assert.ok(h.includes(`${a}에서 시작해서 ${a+b}까지`));assert.ok(!h.includes('= '+b));}
  if(q.variant==='rule'){assert.ok(!h.includes('= '+(a+2*b)));assert.ok(h.includes(additionExplanation(a+b,b)));}
  if(q.variant==='error'){assert.ok(h.includes(`${a}와 ${b}를 다시 더해`));assert.ok(!h.includes('= '+(a+b)));}
 }assert.equal(seen.size,4);
});
test('all active new families have three question-specific hints; story chains explain sequential carrying',()=>{
 for(const type of LEARNING_TYPES)for(const grade of [1,2])for(let seed=0;seed<80;seed++){
  const q=learningQuestion(type,grade,seededRandom(seed));assert.equal(q.hints.length,3);assert.ok(q.hints.every(h=>h.text&&h.title));
  if(q.storyModel){const m=q.storyModel;assert.ok(!q.hints.map(h=>h.text).join(' ').includes(`${m.answer}${m.unit}`));if(m.terms.length===3){const [a,b,c]=m.terms;assert.ok(q.hints[2].text.includes(`마지막 ${c}`));}}
  if(q.type==='table_count'){assert.ok(!q.hints[2].text.includes(`= ${q.answer[0]}`));}
 }
});
test('analogy always changes color and shape, includes tempting one-attribute distractors, and place-value is retired',()=>{
 assert.equal(MATH_TYPES.length,28);assert.ok(!MATH_TYPES.includes('place_value'));assert.ok(!MATH_TYPES.includes('classify'));
 for(let seed=0;seed<200;seed++){
  const q=questionFor({type:'analogy',seed,grade:2},model,facto);assert.equal(q.choices.length,5);assert.equal(new Set(q.choices.map(c=>c.value)).size,5);
  for(const [a,b]of [...q.pairs,[q.source,q.answer[0]]]){assert.notEqual(Math.floor(a/3),Math.floor(b/3));assert.notEqual(a%3,b%3);}
  assert.equal(q.hints.length,3);
 }
});
test('legacy pending easy/retired questions upgrade without spending turn, PP or balls; upgraded input persists',()=>{
 const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
 for(const type of ['place_value','classify','analogy']){
  const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter('pidgey',3);g.battle.s.animationPending=false;requestMath(g,0,model,facto,()=>0);
  Object.assign(g.battle.s.mathChallenge,{type,grade:1,input:[36],hints:3,attempts:2});delete g.battle.s.mathChallenge.analogyVersion;
  const h=new Game(maps,data);assert.ok(h.restore(g.serialize()));const before=[h.state.balls,h.battle.s.turn,h.battle.player.moves[0].pp];assert.equal(upgradeChallenge(h,model,facto),true);
  const c=h.battle.s.mathChallenge;assert.equal(c.type,type==='place_value'?'add_carry_single':'analogy');if(type!=='place_value')assert.equal(c.grade,2);assert.equal(c.hints,0);assert.deepEqual(c.input,[null]);assert.equal(upgradeChallenge(h,model,facto),false);assert.deepEqual([h.state.balls,h.battle.s.turn,h.battle.player.moves[0].pp],before);assert.ok(g.restore(h.serialize()));
 }
});

test('all legacy hint paths guide without reading an answer, solution, or solved arrangement',()=>{
 for(const type of MATH_TYPES.filter(t=>!LEARNING_TYPES.includes(t)&&t!=='analogy'))for(const grade of [1,2]){
  const q=questionFor({type,grade,seed:42},model,facto);for(const key of ['answer','solution'])Object.defineProperty(q,key,{get(){throw Error('hint accessed '+type+' '+key)}});
  const hints=puzzleHintSteps(q);assert.equal(hints.length,3);assert.ok(hints.every(h=>h.title&&h.text));assert.ok(!hints.some(h=>/가능한 길 한 가지|순서로 놓으면|조각을 빈칸에 놓아요|빠져 있어요/.test(h.text)));
 }
});
