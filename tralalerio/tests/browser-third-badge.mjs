import {chromium,webkit,devices} from 'playwright';import fs from 'node:fs';import assert from 'node:assert/strict';
import {Game} from '../engine.js';import {createPokemon} from '../battle.js';import {routeTo} from './world-path.js';import {solveMath} from './math-test-helper.mjs';import {WHITNEY} from '../third-badge.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json')),base=process.env.THIRD_TEST_URL||'http://localhost:3000';
fs.mkdirSync('../test-artifacts/tralalerio',{recursive:true});
for(const driver of [chromium,webkit]){
 const browser=await driver.launch({headless:true,...(driver===chromium?{channel:'chrome'}:{})});
 try{
  const page=await browser.newPage({...devices['iPad (gen 7)'],reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let g=new Game(maps,data,{random:()=>.99});g.startAdventure();Object.assign(g.state.flags,{eggDelivered:true,violet:true,zephyr:true,eggGift:true,azalea:true,kurtHelp:true,slowpokeWell:true,hive:true,azaleaRival:true,labCall:true});
  for(const id of Object.keys(data.trainers))if(id!==WHITNEY)g.state.flags['trainer:'+id]=true;
  g.state.party=[createPokemon(data,'pikachu',99,()=>.5)];g.state.party[0].moves=[{id:'TACKLE',pp:35}];g.enter(maps.IlexForestAzaleaGate,6,4);
  await page.addInitScript(raw=>{Math.random=()=>.5;if(!sessionStorage.getItem('third-seed')){localStorage.setItem('tralalerio-save-v1',raw);sessionStorage.setItem('third-seed','1');}},g.serialize());
  await page.goto(base+'/tralalerio');await page.locator('#loading').waitFor({state:'hidden'});
  const state=()=>page.evaluate(()=>localStorage.getItem('tralalerio-save-v1'));
  async function mirror(){assert.ok(g.restore(await state()));}
  async function closeDialogue(){for(let i=0;i<20&&await page.locator('#dialog').isVisible();i++)await page.keyboard.press('z');}
  async function walk(predicate){for(const d of routeTo(g,predicate)){const before={map:g.state.map,x:g.state.x,y:g.state.y};g.move(d);await page.keyboard.press({up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[d]);if(before.map!==g.state.map||Math.abs(before.x-g.state.x)+Math.abs(before.y-g.state.y)>1)await page.waitForTimeout(400);}
   await closeDialogue();await page.locator('#save-button').click();const saved=JSON.parse(await state());assert.deepEqual([saved.map,saved.x,saved.y],[g.state.map,g.state.x,g.state.y]);await mirror();}
  async function talk(){await page.keyboard.press('z');await closeDialogue();await mirror();}
  await walk(h=>h.state.map==='IlexForest');
  await walk(h=>h.target()?.script==='FarfetchdPosition1');await talk();assert.equal(g.state.flags.farfetchdPosition,10);
  assert.ok(g.state.flags.herdedFarfetchd);await page.reload();await page.locator('#loading').waitFor({state:'hidden'});await mirror();
  await walk(h=>h.target()?.script==='IlexForestCharcoalMasterScript');await talk();assert.equal(g.state.items.HM01,1);
  await walk(h=>h.target()?.cutTree);await talk();assert.ok(g.state.flags.ilexCut);
  for(const id of ['Route34IlexForestGate','Route34','GoldenrodCity','GoldenrodGym'])await walk(h=>h.state.map===id);
  await walk(h=>h.target()?.trainer===WHITNEY);await page.locator('#screen').screenshot({path:`../test-artifacts/tralalerio/third-gym-${driver.name()}.png`});await talk();
  await page.locator('#battle-screen').waitFor({state:'visible'});await page.locator('#encounter-transition').waitFor({state:'hidden'});
  let solved=0;
  for(let turn=0;turn<8;turn++){
   for(let i=0;i<60;i++){await page.waitForFunction(()=>document.querySelector('#battle-screen').getAttribute('aria-busy')!=='true');const next=page.getByRole('button',{name:'다음 ▼',exact:true});if(!await next.isVisible())break;await next.click();}
   const saved=JSON.parse(await state());if(saved.battle.result==='won')break;
   await page.getByRole('button',{name:/^싸운다/}).click();await page.getByRole('button',{name:/^몸통박치기/}).click();
   await page.locator('.math-dialog[open]').waitFor();assert.equal(await page.locator('.math-dialog').getAttribute('data-grade'),'5');await solveMath(page);solved++;
  }
  assert.equal(JSON.parse(await state()).battle.result,'won');assert.equal(solved,2);
  await page.getByRole('button',{name:'모험으로 돌아가기',exact:true}).click();await closeDialogue();await mirror();assert.ok(!g.state.flags.plain);
  await walk(h=>h.state.map==='GoldenrodGym'&&h.state.x===8&&h.state.y===5);assert.ok(g.state.flags.whitneyCalmed);
  await walk(h=>h.target()?.trainer===WHITNEY);await talk();assert.ok(g.state.flags.plain);assert.equal(g.state.items.TM45,1);
  await walk(h=>h.state.map==='GoldenrodFlowerShop'&&h.target()?.script==='FlowerShopTeacherScript');await talk();assert.equal(g.state.items.SQUIRTBOTTLE,1);
  await page.reload();await page.locator('#loading').waitFor({state:'hidden'});await mirror();assert.ok(g.state.flags.plain);assert.equal(g.state.items.TM45,1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  console.log('PASS '+driver.name()+': real keyboard forest puzzle + reload, HM01/Cut, Route34, Goldenrod, Whitney two level5 finishers, tears event, badge/TM45, flower gift and save restoration');
 }finally{await browser.close();}
}
