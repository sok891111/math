import {chromium,webkit,devices} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {Game} from '../engine.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
const seed=new Game(maps,data,{random:()=>.99});seed.startAdventure();seed.state.map='CherrygroveCity';let origin;
for(let y=1;y<seed.map.height&&!origin;y++)for(let x=1;x<seed.map.width-9&&!origin;x++)if(Array.from({length:10},(_,i)=>seed.passable(x+i,y)&&/^(FLOOR|00)/.test(seed.map.collision[y][x+i])&&!seed.map.warps.some(w=>w.x===x+i&&w.y===y)).every(Boolean))origin={x,y};
assert.ok(origin);Object.assign(seed.state,origin,{facing:'right'});
for(const engine of [chromium,webkit]){const browser=await engine.launch({headless:true,...(engine===chromium?{channel:'chrome'}:{})});try{
 const context=await browser.newContext({...devices['iPad (gen 7)']}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:3000/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});
 const reset=async()=>{await p.evaluate(s=>localStorage.setItem('tralalerio-save-v1',s),seed.serialize());await p.reload();await p.locator('#loading').waitFor({state:'hidden'});await p.locator('#screen').focus();};
 const position=async()=>{await p.locator('#save-button').click();return p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')).x);};
 await reset();const button=p.locator('[data-move="right"]'),box=await button.boundingBox();assert.ok(box.width>=60&&box.height>=60);await p.keyboard.down('ArrowRight');await p.waitForTimeout(240);await p.keyboard.down('ArrowRight');await p.keyboard.up('ArrowRight');assert.equal(await position(),origin.x+1);await p.waitForTimeout(400);assert.equal(await position(),origin.x+1);
 await reset();await p.keyboard.down('ArrowRight');await p.waitForTimeout(650);await p.keyboard.up('ArrowRight');assert.equal(await position(),origin.x+2);
 await reset();const b=await button.boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.waitForTimeout(650);await p.mouse.up();assert.equal(await position(),origin.x+2);await p.waitForTimeout(400);assert.equal(await position(),origin.x+2);
 await reset();await button.tap();assert.equal(await position(),origin.x+1);await p.screenshot({path:`../test-artifacts/tralalerio/controls-${engine.name()}.png`,fullPage:true});
 for(const width of [320,390,768,1024]){await p.setViewportSize({width,height:1100});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const target=await button.boundingBox();assert.ok(target.width>=42&&target.height>=42);}
 assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': large iPad direction buttons, single-tile short press, ignored OS repeats, 450ms hold delay and slower continuous movement for keyboard/pointer, release stops movement, real touch tap, 320–1024px no overflow.');
 }finally{await browser.close();}}
