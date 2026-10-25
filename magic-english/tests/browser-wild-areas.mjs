import {chromium,webkit,devices} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {Game,DIRECTIONS} from '../engine.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json')),keys={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
function seed(id){const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.enter(maps[id],0,0);for(const t of Object.keys(data.trainers))g.state.flags['trainer:'+t]=true;g.state.flags.eggDelivered=true;g.state.flags.labCall=true;const tile=data.encounters[id].terrain==='floor'?'FLOOR':'TALL_GRASS';for(let y=1;y<g.map.height-1;y++)for(let x=1;x<g.map.width-1;x++)for(const [direction,[dx,dy]]of Object.entries(DIRECTIONS)){if(g.passable(x,y)&&g.passable(x+dx,y+dy)&&g.map.collision[y][x]===tile&&g.map.collision[y+dy][x+dx]===tile){g.enter(maps[id],x,y);return {raw:g.serialize(),direction};}}throw Error(id);}
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{channel:'chrome'}:{})});
 try{
  const p=await browser.newPage({...devices['iPad (gen 7)'],reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{Date.prototype.getHours=()=>12;Math.random=()=>window.forceWild?(++window.wildDraws===1?0:window.wildDraws===2?window.wildSlot:.5):.5;});
  await p.goto('http://localhost:3000/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});
  for(const id of Object.keys(data.encounters))for(const mc of [false,true]){
   const fixture=seed(id);await p.evaluate(raw=>localStorage.setItem('tralalerio-save-v1',raw),fixture.raw);await p.reload();await p.locator('#loading').waitFor({state:'hidden'});
   await p.evaluate(mc=>{window.forceWild=true;window.wildDraws=0;window.wildSlot=mc?.7:.13;},mc);await p.keyboard.press(keys[fixture.direction]);await p.locator('#battle-screen').waitFor({state:'visible'});
   const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')));assert.equal(s.map,id);assert.equal(s.battle.enemy.species.startsWith('mc_'),mc,id);assert.equal(s.battle.turn,0);assert.ok(data.encounters[id].day.some(x=>x.species===s.battle.enemy.species&&x.level===s.battle.enemy.level));assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  assert.deepEqual(errors,[]);console.log('PASS: '+engine.name()+' actual grass/floor steps encounter original Pokemon and Minecraft in all seven Gold habitats.');
 }finally{await browser.close()}
}
