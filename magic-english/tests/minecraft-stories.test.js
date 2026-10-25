import {test} from 'node:test';import assert from 'node:assert/strict';
import {STORY_TYPES,minecraftStory,minecraftCombineText} from '../minecraft-stories.js';
import {MATH_TYPES,questionFor,seededRandom,requestMath} from '../math-challenge.js';
import {Game} from '../engine.js';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),model=require('../creative/battle-model.js'),facto=require('../creative/facto-puzzles.js');
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
test('six Minecraft story structures ask for the correct sum rather than double-counting the reference',()=>{
 for(const type of STORY_TYPES)for(const grade of [1,2]){
  const actors=new Set(),items=new Set(),prompts=new Set(),carry=new Set();
  for(let seed=0;seed<300;seed++){
   const q=minecraftStory(type,grade,seededRandom(Math.imul(seed,2654435761)>>>0)),m=q.storyModel;
   assert.equal(q.answer[0],m.terms.reduce((a,b)=>a+b,0));assert.ok(q.answer[0]<=99);
   assert.equal(q.choices.filter(c=>c.value===q.answer[0]).length,1);assert.equal(q.choices.length,4);
   assert.equal(q.operator,'+');assert.equal(q.equation,null);assert.deepEqual(q.models,[]);assert.equal(q.hints.length,3);
   assert.ok(q.prompt.includes(m.actors[0]));assert.ok(!q.prompt.includes('−'));assert.ok(q.prompt.includes('몇'));
   if(type==='story_compare'){assert.match(q.prompt,/보다/);assert.ok(q.prompt.split('\n').at(-1).includes(m.actors[1]));assert.notEqual(q.answer[0],2*m.terms[0]+m.terms[1]);}
   if(type==='story_chain')assert.ok(q.prompt.split('\n').at(-1).includes(m.actors[2]));
   actors.add(m.actors[0]);items.add(m.item);prompts.add(q.prompt);carry.add(m.terms.reduce((s,n)=>s+n%10,0)>=10);
  }
  assert.ok(actors.size>8);assert.ok(items.size>4);assert.ok(prompts.size>200);assert.equal(carry.size,2);
 }
});
test('all story families use the unchanged challenge flow and restore text, hints and answer',()=>{
 for(const type of STORY_TYPES){
  const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter('mc_zombie',3);g.battle.s.animationPending=false;
  const rolls=[0,(MATH_TYPES.indexOf(type)+.1)/MATH_TYPES.length,.7],c=requestMath(g,0,model,facto,()=>rolls.shift());
  assert.equal(c.type,type);const q=questionFor(c,model,facto);c.input=q.answer.slice();c.hints=2;
  const h=new Game(maps,data);assert.ok(h.restore(g.serialize()));assert.deepEqual(questionFor(h.battle.s.mathChallenge,model,facto),q);assert.equal(h.battle.s.mathChallenge.hints,2);
  assert.equal(requestMath(h,0,model,facto,()=>{throw Error('must not reroll')}),h.battle.s.mathChallenge);
 }
 const q=minecraftCombineText(60,7);assert.match(q,/60/);assert.match(q,/7/);
});

test('the user example is a comparison sum of 60 and 7, not both characters combined',()=>{
 const rolls=[0,0,0,50/60,6/20,0],q=minecraftStory('story_compare',2,()=>rolls.length?rolls.shift():.5);
 assert.deepEqual(q.storyModel.terms,[60,7]);assert.deepEqual(q.answer,[67]);assert.match(q.prompt,/알렉스의/);assert.ok(q.choices.some(c=>c.value===67));
});
