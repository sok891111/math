import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {Game} from '../engine.js';import {pickEncounter} from '../battle.js';
const read=n=>JSON.parse(fs.readFileSync(new URL('../assets/'+n+'.json',import.meta.url))),maps=read('maps'),data=read('battle-data');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:3000/tralalerio');await page.locator('#loading').waitFor({state:'hidden'});
 for(const index of [0,15,55,90]){
  let n=0;const mon=pickEncounter(data.encounters.Route29,12,()=>n++===0?0:(index+.5)/91);const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter(mon.species,mon.level);g.battle.s.animationPending=false;
  await page.evaluate(raw=>localStorage.setItem('tralalerio-save-v1',raw),g.serialize());await page.reload();await page.locator('#loading').waitFor({state:'hidden'});await page.locator('#battle-screen').waitFor({state:'visible'});
  for(const side of ['front','back'])assert.ok(await page.evaluate(async url=>{const im=new Image();im.src=url;await im.decode();return im.naturalWidth>0},`/tralalerio/assets/battle/${mon.species}-${side}.png`));
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')).battle.enemy.species),mon.species);
 }
 assert.deepEqual(errors,[]);console.log('PASS early-route collection species rendered with valid front/back sprites and saved battles');
}finally{await browser.close()}
