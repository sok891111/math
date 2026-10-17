import {chromium,webkit,devices} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {Game} from '../engine.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{channel:'chrome'}:{})});
 try{
  const p=await browser.newPage({...devices['iPad (gen 7)'],reducedMotion:'no-preference'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const g=new Game(maps,data,{random:()=>.99});g.startAdventure();Object.assign(g.state.flags,{mysteryEgg:true,pokedex:true});g.enter(maps.MrPokemonsHouse,2,6);
  await p.addInitScript(seed=>{Math.random=()=>.99;if(!sessionStorage.getItem('phone-seed')){localStorage.setItem('tralalerio-save-v1',seed);sessionStorage.setItem('phone-seed','1')}window.phases=[];document.addEventListener('phone-call-phase',e=>window.phases.push(e.detail.phase))},g.serialize());
  const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')));
  await p.goto('http://localhost:3000/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});assert.equal(await p.locator('#phone-caller').isVisible(),false);
  await p.keyboard.press('ArrowDown');await p.locator('#phone-caller').waitFor({state:'visible'});assert.equal((await state()).map,'Route30');assert.equal((await state()).phoneCall.phase,'ring');assert.equal(await p.locator('#dialog').isVisible(),false);
  const position=await state();await p.keyboard.press('Escape');await p.keyboard.press('ArrowDown');await p.locator('#save-button').click();assert.deepEqual([(await state()).x,(await state()).y],[position.x,position.y]);assert.equal(await p.locator('#menu').isVisible(),false);
  await p.reload();await p.locator('#loading').waitFor({state:'hidden'});await p.locator('#dialog').waitFor({state:'visible'});assert.match(await p.locator('#dialog-text').innerText(),/큰일/);assert.equal((await state()).phoneCall.phase,'talk');
  assert.equal(await p.locator('#phone-caller span').isVisible(),true);await p.locator('#dialog-next').click();const text=await p.locator('#dialog-text').innerText();assert.equal((await state()).phoneCall.page,1);
  await p.reload();await p.locator('#dialog').waitFor({state:'visible'});assert.equal(await p.locator('#dialog-text').innerText(),text);await p.locator('#dialog-next').click();await p.screenshot({path:'../test-artifacts/tralalerio/phone-'+engine.name()+'.png',fullPage:true});await p.locator('#dialog-next').click();assert.equal((await state()).phoneCall.phase,'hangup');
  await p.reload();await p.waitForFunction(()=>!JSON.parse(localStorage.getItem('tralalerio-save-v1')).phoneCall);assert.equal((await state()).flags.labCall,true);assert.equal((await state()).items.MYSTERY_EGG,1);assert.equal(await p.locator('#phone-caller').isVisible(),false);
  await p.reload();await p.locator('#loading').waitFor({state:'hidden'});assert.equal(await p.locator('#dialog').isVisible(),false);assert.equal(await p.locator('#phone-caller').isVisible(),false);assert.deepEqual(errors,[]);
  console.log('PASS: '+engine.name()+' house exit → two-ring caller → Elm call → hangup, movement lock, ring/talk/hangup reload and single completion.');
 }finally{await browser.close()}
}
