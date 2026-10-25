import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {Game} from '../engine.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
const g=new Game(maps,data,{random:()=>.99});g.chooseStarter('리아코');let spot;
for(let y=0;y<maps.Route29.height&&!spot;y++)for(let x=0;x<maps.Route29.width&&!spot;x++){
 g.state.map='Route29';g.state.x=x;g.state.y=y;if(!g.passable(x,y))continue;
 for(const [dir,dx,dy]of [['down',0,1],['left',-1,0],['right',1,0]]){
  const tile=g.map.collision[y+dy]?.[x+dx];if(!tile?.startsWith('HOP_')||!tile.includes(dir.toUpperCase()))continue;
  const before={...g.state};const result=g.move(dir);if(result.type==='step'){spot={x,y,dir,endX:g.state.x,endY:g.state.y};g.state=before;break}
 }
}
assert.ok(spot);const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(seed=>{localStorage.setItem('tralalerio-save-v1',seed);Math.random=()=>.99;window.__jump=[];const original=CanvasRenderingContext2D.prototype.ellipse;CanvasRenderingContext2D.prototype.ellipse=function(x,y,rx,ry,...args){if(this.canvas.id==='screen')window.__jump.push({x,y,rx,time:performance.now()});return original.call(this,x,y,rx,ry,...args)}},g.serialize());
 await p.goto('http://localhost:3000/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});const key={down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[spot.dir];
 await p.keyboard.press(key);await p.waitForTimeout(100);await p.keyboard.press(key);await p.locator('#save-button').click();let saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')));assert.equal(saved.x,spot.endX);assert.equal(saved.y,spot.endY);assert.equal(saved.steps,g.state.steps+1,'airborne input must not start another move');
 await p.locator('.screen-wrap').screenshot({path:'../test-artifacts/tralalerio/ledge-jump.png'});await p.waitForTimeout(350);const frames=await p.evaluate(()=>window.__jump);assert.ok(frames.length>4);assert.ok(frames.some(f=>f.rx<4.3),'shadow shrinks as the player rises');assert.ok(frames.at(-1).rx>4.5,'player lands back over full shadow');assert.deepEqual(errors,[]);
 console.log('PASS: actual ledge step draws a jump arc and ground shadow, lands at destination, blocks repeated input while airborne.');
}finally{await browser.close()}
