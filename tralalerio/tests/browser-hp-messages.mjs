import {chromium,webkit,devices} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Game} from '../engine.js';import {hpLossMessage,isHpLossMessage} from '../hp-messages.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{channel:'chrome'}:{})});
 try{
  const p=await browser.newPage({...devices['iPad (gen 7)'],viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const g=new Game(maps,data,{random:()=>.5});g.chooseStarter('리아코');g.startEncounter('pidgey',3);g.battle.enemy.moves=[{id:'TACKLE',pp:35}];g.battle.s.animationPending=false;
  const expected=new Game(maps,data,{random:()=>.5});assert.ok(expected.restore(g.serialize()));expected.battle.action('move',0);
  const messages=expected.battle.s.animationEvents.map(e=>{const target=e.actor==='player'?'enemy':'player';return hpLossMessage(data.species[e.before[target].species].name,e.before[target].hp,e.after[target].hp)});
  await p.addInitScript(seed=>{Math.random=()=>.5;if(!sessionStorage.getItem('hp-seed')){localStorage.setItem('tralalerio-save-v1',seed);sessionStorage.setItem('hp-seed','1')}window.ended=[];document.addEventListener('battle-animation-end',e=>window.ended.push(e.detail.actor))},g.serialize());
  await p.goto('http://localhost:3000/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});
  while(await p.getByRole('button',{name:'다음 ▼',exact:true}).isVisible())await p.getByRole('button',{name:'다음 ▼',exact:true}).click();
  await p.getByRole('button',{name:/^싸운다/}).click();await p.getByRole('button',{name:/^할퀴기/}).click();
  await p.waitForFunction(text=>document.querySelector('.battle-message')?.textContent===text,messages[0]);
  assert.ok(await p.evaluate(()=>window.ended.includes('player')));assert.ok(isHpLossMessage(await p.locator('.battle-message').innerText()));
  assert.ok(await p.locator('.battle-message').evaluate(el=>el.scrollHeight<=el.clientHeight));
  await p.waitForLoadState('networkidle');await p.reload();await p.locator('#loading').waitFor({state:'hidden'});
  await p.waitForFunction(text=>document.querySelector('.battle-message')?.textContent===text,messages[0]);
  await p.waitForFunction(text=>document.querySelector('.battle-message')?.textContent===text,messages[1]);assert.ok(await p.evaluate(()=>window.ended.includes('enemy')));
  await p.waitForFunction(()=>document.querySelector('#battle-screen').getAttribute('aria-busy')==='false');
  const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')));assert.equal(saved.battle.turn,1);assert.deepEqual(saved.party[0],expected.state.party[0]);assert.deepEqual(saved.battle.enemy,expected.battle.enemy);assert.deepEqual(saved.battle.logs.filter(isHpLossMessage),messages);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  console.log('PASS: '+engine.name()+' exact HP subtraction after each impact, non-tens damage, iPad readable text, reload with unchanged HP/PP and one turn.');
 }finally{await browser.close()}
}
