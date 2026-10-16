import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Game} from '../engine.js';import {createPokemon} from '../battle.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
fs.mkdirSync('../test-artifacts/tralalerio',{recursive:true});
async function setup({shakes=3,caught=true,reduced=false,mobile=false,failAssets=false}={}){
 const g=new Game(maps,data,{random:()=>.5});g.chooseStarter('리아코');g.startEncounter('mc_enderdragon',3);
 const p=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1200},reducedMotion:reduced?'reduce':'no-preference'});p.on('pageerror',e=>errors.push(e.message));
 if(failAssets)await p.route('**/assets/animations/frames.json?*',r=>r.abort());
 await p.addInitScript(({seed,queue})=>{if(!sessionStorage.getItem('capture-seeded')){localStorage.setItem('tralalerio-save-v1',seed);sessionStorage.setItem('capture-seeded','1')}Math.random=()=>queue.length?queue.shift():.5;window.__capture=[];for(const type of ['start','phase','end'])document.addEventListener('capture-animation-'+type,e=>window.__capture.push({type,...e.detail}));document.addEventListener('battle-animation-start',e=>window.__capture.push({type:'counter',...e.detail}));},{seed:g.serialize(),queue:[0,caught?0:.999,...Array(shakes).fill(0),.999]});
 await p.goto('http://localhost:3000/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});
 while(await p.getByRole('button',{name:'다음 ▼',exact:true}).isVisible())await p.getByRole('button',{name:'다음 ▼',exact:true}).click();
 await p.getByRole('button',{name:/^가방/}).click();await p.getByRole('button',{name:/^몬스터볼/}).click();return p;
}
const state=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')));
const done=p=>p.waitForFunction(()=>document.querySelector('#battle-screen').getAttribute('aria-busy')==='false');
try{
 const success=await setup();await success.waitForFunction(()=>document.querySelector('.battle-scene')?.dataset.capturePhase==='bounce');assert.equal(await success.locator('.enemy-mon').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 assert.ok(await success.locator('.capture-fx').evaluate(c=>c.getContext('2d').getImageData(0,0,160,96).data.some((v,i)=>i%4===3&&v>0)));
 await success.locator('.screen-wrap').screenshot({path:'../test-artifacts/tralalerio/capture-bounce.png'});
 await success.keyboard.press('z');await success.keyboard.press('ArrowDown');assert.equal((await state(success)).balls,4);assert.equal((await state(success)).battle.turn,1);
 await done(success);let events=await success.evaluate(()=>window.__capture);assert.equal(events.filter(e=>e.phase==='shake').length,3);assert.ok(events.some(e=>e.phase==='caught'));assert.ok(!events.some(e=>e.type==='counter'));assert.equal(await success.locator('.enemy-mon').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 await success.locator('.screen-wrap').screenshot({path:'../test-artifacts/tralalerio/capture-success.png'});
 await success.reload();await success.locator('#loading').waitFor({state:'hidden'});assert.equal((await state(success)).party.length,2);assert.equal((await state(success)).balls,4);assert.equal(await success.locator('.enemy-mon').evaluate(e=>getComputedStyle(e).visibility),'hidden');await success.close();
 for(const shakes of [0,1,2,3]){
  const p=await setup({caught:false,shakes,reduced:shakes===1||shakes===2,mobile:shakes===2});await done(p);events=await p.evaluate(()=>window.__capture);const s=await state(p);assert.equal(s.party.length,1);assert.equal(s.balls,4);assert.equal(s.battle.animationEvents[0].shakes,shakes);assert.ok(events.some(e=>e.phase==='escape'));assert.equal(events.findIndex(e=>e.type==='end')<events.findIndex(e=>e.type==='counter'),true);assert.notEqual(await p.locator('.enemy-mon').evaluate(e=>getComputedStyle(e).visibility),'hidden');if(shakes===3)await p.locator('.screen-wrap').screenshot({path:'../test-artifacts/tralalerio/capture-escape.png'});await p.close();
 }
 const resume=await setup();await resume.waitForFunction(()=>document.querySelector('.battle-scene')?.dataset.capturePhase==='bounce');const before=await state(resume);await resume.reload();await resume.locator('#loading').waitFor({state:'hidden'});await done(resume);const after=await state(resume);assert.equal(after.party.length,before.party.length);assert.equal(after.balls,before.balls);assert.equal(after.battle.turn,before.battle.turn);assert.equal(after.party[0].hp,before.party[0].hp);await resume.close();
 const fallback=await setup({reduced:true,failAssets:true});await done(fallback);assert.equal((await state(fallback)).battle.result,'caught');await fallback.close();
 assert.deepEqual(errors,[]);console.log('PASS: throw/absorb/bounce/3 shakes/caught, 0–3-shake escape before retaliation, Minecraft capture, busy inputs, reduced/mobile/fallback, reload mid-capture without duplicate balls or party.');
}finally{await browser.close()}
