import {chromium,webkit,devices} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
import {Game} from '../engine.js';import {LEARNING_TYPES} from '../learning-puzzles.js';import {MATH_TYPES,requestMath,questionFor} from '../math-challenge.js';import {solveMath} from './math-test-helper.mjs';
const require=createRequire(import.meta.url),model=require('../creative/battle-model.js'),facto=require('../creative/facto-puzzles.js');
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{channel:'chrome'}:{})});
 try{
  const p=await browser.newPage({...devices['iPad (gen 7)'],reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));const reload=async()=>{await p.waitForLoadState('networkidle');await p.reload()};
  const boundary=new Game(maps,data);boundary.startAdventure();Object.assign(boundary.state,{map:'CherrygrovePokecenter1F',x:1,y:7});
  await p.addInitScript(()=>{Math.random=()=>.99});await p.goto('http://localhost:3000/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});
  await p.evaluate(seed=>localStorage.setItem('tralalerio-save-v1',seed),boundary.serialize());await reload();await p.locator('#loading').waitFor({state:'hidden'});
  await p.keyboard.press('ArrowLeft');assert.equal(await p.locator('#dialog').isVisible(),false);await p.locator('#save-button').tap();
  assert.deepEqual(await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('tralalerio-save-v1'));return[s.x,s.y]}),[1,7]);
  for(const type of LEARNING_TYPES){
   const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter('mc_enderknight',3);g.battle.s.animationPending=false;
   const rolls=[0,(MATH_TYPES.indexOf(type)+.1)/MATH_TYPES.length,.72];requestMath(g,0,model,facto,()=>rolls.shift());
   await p.evaluate(seed=>localStorage.setItem('tralalerio-save-v1',seed),g.serialize());await reload();await p.locator('.math-dialog[open]').waitFor();
   assert.equal(await p.locator('.math-dialog').getAttribute('data-type'),type);await p.locator('.math-hint').tap();
   const challenge=g.battle.s.mathChallenge,question=questionFor(challenge,model,facto);
   if(question.paint)await p.locator('.shape-preview.editable button').first().tap();
   else {await p.getByRole('button',{name:`답 조각 ${question.answer[0]}`,exact:true}).tap();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')).battle.mathChallenge.input[0]),question.answer[0]);}
   await solveMath(p,{submit:false});await reload();await p.locator('.math-dialog[open]').waitFor();
   assert.equal(await p.locator('.math-dialog').getAttribute('data-grade'),String(challenge.grade));
   assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')).battle.mathChallenge.hints),1);
   await p.locator('.math-submit').tap();await p.waitForFunction(()=>!document.querySelector('.math-dialog').open);
   assert.ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')).battle.animationEvents.some(e=>e.actor==='player'&&e.critical)),type);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),type);
  }
  assert.deepEqual(errors,[]);console.log('PASS: '+engine.name()+' silent boundary; all '+LEARNING_TYPES.length+' learning families, level 3+, hints, placed answers reload, critical attack and iPad layout.');
 }finally{await browser.close()}
}
