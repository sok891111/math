import {webkit,chromium,devices} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
import {Game} from '../engine.js';import {requestMath,questionFor} from '../math-challenge.js';import {solveMath} from './math-test-helper.mjs';
const require=createRequire(import.meta.url),model=require('../../creative/battle-model.js'),facto=require('../../creative/facto-puzzles.js');
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
for(const engine of [webkit,chromium]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{channel:'chrome'}:{})});
 try{
  const context=await browser.newContext({...devices['iPad (gen 7)'],reducedMotion:'reduce'}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:3000/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});
  const initial=await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')));
  await p.locator('[data-move="down"]').tap();await p.locator('#save-button').tap();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')).y),initial.y+1);
  await p.locator('#menu-button').tap();assert.ok(await p.locator('#menu').isVisible());await p.locator('#close-menu').tap();
  assert.equal(await p.locator('#location').evaluate(el=>{
   const event=new Event('touchstart',{bubbles:true,cancelable:true});
   Object.defineProperty(event,'touches',{value:[{clientX:30,clientY:30}]});
   const canceled=!el.dispatchEvent(event);el.dispatchEvent(new Event('touchcancel',{bubbles:true}));return canceled;
  }),true);
  const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter('mc_enderknight',3);g.battle.s.animationPending=false;
  const rolls=[0,.01,.75];requestMath(g,0,model,facto,()=>rolls.shift());assert.equal(g.battle.s.mathChallenge.grade,2);
  await p.evaluate(seed=>localStorage.setItem('tralalerio-save-v1',seed),g.serialize());await p.reload();await p.locator('.math-dialog[open]').waitFor();
  assert.equal(await p.locator('.math-grade').innerText(),'2단계');
  assert.ok(await p.locator('.math-dialog').evaluate(dialog=>{
   dialog.style.maxHeight='240px';dialog.scrollTop=0;const target=dialog.querySelector('.math-title');
   for(const [type,y] of [['touchstart',300],['touchmove',180]]){
    const event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:[{clientX:50,clientY:y}]});target.dispatchEvent(event);
   }
   target.dispatchEvent(new Event('touchcancel',{bubbles:true}));const scrolled=dialog.scrollTop>0;dialog.style.maxHeight='';dialog.scrollTop=0;return scrolled;
  }));await p.locator('.math-hint').tap();
  await p.reload();await p.locator('.math-dialog[open]').waitFor();assert.equal(await p.locator('.math-grade').innerText(),'2단계');
  const c=await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')).battle.mathChallenge),q=questionFor(c,model,facto);
  await p.locator(`.rune-tool[data-value="${q.answer[0]}"]`).tap();
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')).battle.mathChallenge.input[0]),q.answer[0]);
  await solveMath(p);await p.waitForFunction(()=>!document.querySelector('.math-dialog').open);
  assert.equal(await p.evaluate(()=>getSelection().toString()),'');assert.deepEqual(errors,[]);
  console.log('PASS: '+engine.name()+' iPad touch guard, movement, single taps, grade 2 puzzle and saved hints.');
 }finally{await browser.close()}
}
