const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('// Read-only state',`window.climbFixture={
 timer(kind,elapsed){if($('quiz').open)closeQuiz();loadLevel();mode='play';const z=monsters[0];Object.assign(z,{kind,name:catalog[kind].name});encounter(z);battleDeadline=performance.now()+battleDurationMs-elapsed;updateBattleTimer();return {duration:battleDurationMs,outcome:battleOutcome,bar:$('battle-timer').style.getPropertyValue('--time-left')};},
 solve(){answer=String(isMultiply()?active.q[0]*active.q[1]:active.q[0]+active.q[1]);submit();return progress.snapshot().stats.fast;},
 routes(){if($('quiz').open)closeQuiz();const results=[];for(const map of SunshineMaps.layouts){loadLevel(map.id);mode='play';monsters.forEach(z=>z.defeated=true);coins=[];
 for(const route of currentMap.climbingRoutes){resetInputs();const first=route.steps[0],floor=groundAt(first[0]-45);Object.assign(player,{x:first[0]-45,y:floor.y-player.h,vx:0,vy:0,grounded:true});let previous=null;
 for(const target of route.steps){
 const direction=previous&&target[0]<previous[0]?-1:1;
 if(previous){const launch=direction===1?previous[0]+previous[2]-player.w-5:previous[0]+5;for(let i=0;i<240&&Math.abs(player.x-launch)>3;i++){keys.delete('left');keys.delete('right');keys.add(player.x<launch?'right':'left');step(1/120);}keys.clear();player.vx=0;}
 const goal=direction===1?target[0]+12:target[0]+target[2]-player.w-12;keys.add('jump');jumpBuffer=.15;let landed=false;
 for(let i=0;i<180;i++){keys.delete('left');keys.delete('right');if(Math.abs(player.x-goal)>3)keys.add(player.x<goal?'right':'left');step(1/120);if(i>10&&player.grounded){landed=Math.abs(player.y+player.h-target[1])<1;break;}}
 results.push({map:map.id,route:route.name,target,landed,x:player.x,y:player.y});keys.clear();player.vx=0;if(!landed)break;previous=target;
 }
 }
 }return results;}
};\n// Read-only state`)});});
await page.goto('http://localhost:4173/platformer/');
for(const kind of ['enderdragon','warden']){let s=await page.evaluate(k=>climbFixture.timer(k,16000),kind);assert.equal(s.duration,30000);assert.equal(s.outcome,'pending');assert.ok(parseFloat(s.bar)>40&&parseFloat(s.bar)<50);const fast=await page.evaluate(()=>sunshine.snapshot().progress.stats.fast);assert.equal(await page.evaluate(()=>climbFixture.solve()),fast,'16-second boss win is not a fast-answer reward');s=await page.evaluate(k=>climbFixture.timer(k,30001),kind);assert.equal(s.outcome,'lost');assert.match(await page.locator('#feedback').textContent(),/30초/);}
for(const kind of ['zombie']){const s=await page.evaluate(k=>climbFixture.timer(k,15001),kind);assert.equal(s.duration,15000);assert.equal(s.outcome,'lost');}
for(const kind of ['pig','chicken','rabbit']){let s=await page.evaluate(k=>climbFixture.timer(k,59000),kind);assert.equal(s.duration,60000);assert.equal(s.outcome,'pending');s=await page.evaluate(k=>climbFixture.timer(k,60001),kind);assert.equal(s.outcome,'lost');assert.match(await page.locator('#feedback').textContent(),/60초/);}
const results=await page.evaluate(()=>climbFixture.routes());console.log(results.filter(r=>!r.landed));assert.equal(results.length,60);assert.ok(results.every(r=>r.landed),'Every tier must be reachable with normal jumps');assert.deepEqual(errors,[]);console.log('PASS: 30s boss / 15s normal deadlines, timer bar, timeout copy, fast reward accounting, and 60 platform landings across 12 maps.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
