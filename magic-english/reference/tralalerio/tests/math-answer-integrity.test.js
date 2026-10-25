import {test} from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {MATH_TYPES,questionFor,validateQuestion,seededRandom} from '../math-challenge.js';import {TYPE_LEVELS,SUBTRACTION_TYPES} from '../math-levels.js';
const require=createRequire(import.meta.url),model=require('../../creative/battle-model.js'),facto=require('../../creative/facto-puzzles.js');
test('seeded questions across all active levels match their choices and independently computed arithmetic, pictures and clues',()=>{
 let count=0;
 for(const type of MATH_TYPES)for(const grade of TYPE_LEVELS[type].filter(n=>n>=3||SUBTRACTION_TYPES.includes(type)))for(let seed=0;seed<1000;seed++){
  const q=questionFor({type,grade,seed},model,facto),context=`${type}/${grade}/${seed}`;count++;
  assert.ok(validateQuestion(q,q.answer,model,facto).ok,context);assert.deepEqual(questionFor({type,grade,seed},model,facto),q,context+' reproducible');
  if(q.choices)for(const answer of q.answer)assert.ok(q.choices.some(c=>c.value===answer),context+' available choice');
  let expected;
  if(q.operands){const [a,b]=q.operands;expected=q.missingSubtrahend?b:q.variant==='missing'?b:q.variant==='rule'?a+b*2:q.operator==='-'?a-b:q.operator==='×'?a*b:a+b;}
  if(q.storyModel)expected=q.storyModel.terms.reduce((a,b)=>a+b,0);
  if(q.analysis?.terms)expected=q.analysis.terms[0]-q.analysis.terms[1]-q.analysis.terms[2];
  if(q.type==='table_story')expected=q.analysis.rows.reduce((sum,i)=>sum+q.table[i][0]-q.table[i][1],0)-q.analysis.gift;
  if(q.type==='table_count')expected=q.tableAxis===0?q.table[q.tableIndex][0]+q.table[q.tableIndex][1]:q.table[0][q.tableIndex]+q.table[1][q.tableIndex];
  if(q.type==='balance'){if(q.balanceClues){const [a,b]=q.balanceClues;if(b)expected=(a.right.weight*b.left.star-b.right.weight*a.left.star)/(a.left.gem*b.left.star-b.left.gem*a.left.star);else expected=(a.right.weight-a.left.weight)/(a.left.gem-a.right.gem);}else expected=(q.total-q.extra)/q.count;}
  if(q.type==='growing_picture'){const rows=q.examples[0].diagram.rows,growth=q.examples[1].diagram.cols-q.examples[0].diagram.cols;expected=rows+2*(Number.parseInt(q.targetLabel)-1)*growth;}
  if(q.type==='number_machine'){const [a,b]=q.examples.map(e=>e.diagram),slope=(b.output-a.output)/(b.input-a.input);expected=q.targetDiagram.input*slope+a.output-a.input*slope;}
  if(q.type==='number_riddle'){const nums=q.prompt.match(/\d+/g).map(Number),high=nums[0],low=nums[2],parity=q.prompt.includes('짝수')?0:1;const candidates=Array.from({length:high-low-1},(_,i)=>i+low+1).filter(n=>n%2===parity);assert.equal(candidates.length,1);expected=candidates[0];}
  if(q.type==='number_card_count'){const [low,high]=q.prompt.match(/\d+/g).map(Number),parity=q.prompt.includes('짝수')?0:1;expected=q.numberCards.filter(n=>n>low&&n<high&&n%2===parity).length;}
  if(expected!==undefined)assert.equal(q.answer[0],expected,context+' independently calculated');
  if(q.type==='rotate'){const picture=facto.rotate(q.source,q.turns);for(let i=0;i<q.options.length;i++)assert.equal(validateQuestion(q,[i],model,facto).ok,JSON.stringify(q.options[i])===JSON.stringify(picture),context+' picture');}
 }
 assert.equal(count,MATH_TYPES.reduce((sum,type)=>sum+TYPE_LEVELS[type].filter(n=>n>=3||SUBTRACTION_TYPES.includes(type)).length,0)*1000);
});
test('all valid Latin completions and visually identical rotation choices are accepted',()=>{
 const q={type:'latin',n:3,grid:[1,2,3,2,3,1,3,1,2],holes:[0,1,2,3,4,5,6,7,8],answer:[1,2,3,2,3,1,3,1,2]};assert.ok(validateQuestion(q,[2,3,1,3,1,2,1,2,3],model,facto).ok);assert.equal(validateQuestion(q,Array(9).fill(1),model,facto).ok,false);
 const rotate={type:'rotate',source:[1,1,1,1,1,1,1,1,1],turns:1,options:Array(4).fill(Array(9).fill(1)),answer:[1]};for(let i=0;i<4;i++)assert.ok(validateQuestion(rotate,[i],model,facto).ok);
});
test('every live question type submits its selected correct answer after a saved attack/capture reload',async()=>{
 const fs=await import('node:fs'),{Game}=await import('../engine.js'),{createPokemon}=await import('../battle.js'),{requestCapture,requestMath,submitMath,mathTypesForBattle}=await import('../math-challenge.js');
 const maps=JSON.parse(fs.readFileSync(new URL('../assets/maps.json',import.meta.url))),data=JSON.parse(fs.readFileSync(new URL('../assets/battle-data.json',import.meta.url)));
 for(const boss of [false,true])for(const type of MATH_TYPES)for(const capture of [false,true]){
  const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.state.party[0]=createPokemon(data,'pikachu',50,()=>.5);g.startEncounter(boss?'mew':'mc_zombie',3);g.battle.s.animationPending=false;const pool=mathTypesForBattle(g);if(!pool.includes(type))continue;
  const rolls=capture?[(pool.indexOf(type)+.1)/pool.length,.4]:[0,(pool.indexOf(type)+.1)/pool.length,.4];const c=capture?requestCapture(g,model,facto,()=>rolls.shift()):requestMath(g,0,model,facto,()=>rolls.shift());assert.equal(c.type,type);c.input=questionFor(c,model,facto).answer.slice();
  const h=new Game(maps,data,{random:()=>.5});assert.ok(h.restore(g.serialize()),type+' restore');const result=submitMath(h,model,facto);assert.ok(result.ok,type+(capture?' capture':' attack'));assert.ok(result.resolved);if(capture)assert.equal(h.battle.s.result,'caught');else assert.ok(h.battle.s.animationEvents.some(e=>e.actor==='player'&&e.critical));assert.equal(h.battle.s.mathChallenge,undefined);
 }
});
