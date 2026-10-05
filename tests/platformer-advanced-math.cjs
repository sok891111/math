const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const Progress=require('../platformer/progress.js');
let seed=23;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const progress=Progress.create({getItem:()=>null,setItem(){}},random);
for(const [wins,maxA,maxB] of [[0,2,3],[5,3,5],[12,5,9]]){
 const p=Progress.create({getItem:()=>JSON.stringify({counts:{pig:wins}}),setItem(){}},random);
 for(let i=0;i<200;i++){const [a,b]=p.nextQuestion('rabbit');assert.ok(a>=2&&a<=maxA&&b>=1&&b<=maxB);}
}
for(let i=0;i<12;i++)progress.award('pig');
for(const kind of ['enderdragon','warden','pig','chicken','rabbit']){
 const seen=new Set();for(let i=0;i<1500;i++){const [a,b]=progress.nextQuestion(kind);if(['warden','enderdragon'].includes(kind)){assert.ok(a>=10&&b>=10&&a+b>=20&&a+b<=40);seen.add(a+b);}else{assert.ok(a>=2&&a<=5&&b>=1&&b<=9);seen.add(a);}}
 assert.equal(seen.size,kind==='warden'||kind==='enderdragon'?21:4);
}
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});try{
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('// Read-only state',`window.advancedFixture={open(kind,q){if($('quiz').open)closeQuiz();loadLevel();mode='play';const m=catalog[kind],z=monsters[0];Object.assign(z,{kind,name:m.name,w:m.w,h:m.h});encounter(z);z.q=q;$('a').textContent=q[0];$('b').textContent=q[1];renderBlocks();},flight(){loadLevel();mode='play';const z=monsters[0];Object.assign(z,{flying:true,flightPhase:0,x:600,min:550,max:700});player.x=70;const points=[];for(let i=0;i<180;i++){step(1/120);points.push(z.y);}return {range:Math.max(...points)-Math.min(...points),gap:z.baseY-z.y-z.h};}};\n// Read-only state`)});});
await page.clock.install();
await page.goto('http://localhost:4173/platformer/');await page.locator('#start').click();
await page.evaluate(()=>advancedFixture.open('pig',[2,3]));
const stageBefore=await page.evaluate(()=>sunshine.snapshot().stageRemainingMs);
await page.clock.fastForward(59000);
assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.outcome),'pending');
assert.equal(await page.evaluate(()=>sunshine.snapshot().stageRemainingMs),stageBefore);
await page.clock.fastForward(1001);
assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.outcome),'lost');
await page.locator('#continue').click();
assert.ok(await page.evaluate(before=>sunshine.snapshot().stageRemainingMs>before-1000,stageBefore));
for(const viewport of [{width:1024,height:768},{width:390,height:844},{width:844,height:390}]){
 await page.setViewportSize(viewport);
 for(const [kind,q] of [['enderdragon',[19,21]],['warden',[10,10]],['pig',[5,9]],['chicken',[2,1]],['rabbit',[3,7]]]){
 await page.evaluate(({kind,q})=>advancedFixture.open(kind,q),{kind,q});
 const multiply=['pig','chicken','rabbit'].includes(kind);assert.equal(await page.locator('#operator').textContent(),multiply?'×':'+');
 if(multiply){assert.equal(await page.locator('.multiply-block').count(),q[0]*q[1]);assert.equal(await page.locator('.multiply-group').count(),q[1]);await page.locator('.multiply-group').first().click();assert.equal(await page.locator('.multiply-group').first().getAttribute('aria-pressed'),'true');assert.ok((await page.locator('#block-explanation').textContent()).includes(`= ${q[0]} · 1/${q[1]}`));
 for(let i=1;i<q[1];i++)await page.locator('.multiply-group').nth(i).click();
 assert.ok((await page.locator('#block-explanation').textContent()).includes(`= ${q[0]*q[1]} ·`));
 assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.durationMs),60000);}
 else{assert.equal(await page.locator('.move-block.orange').count(),q[0]);assert.equal(await page.locator('.move-block.blue').count(),q[1]);await page.locator('#right-blocks .blue').first().click();assert.equal(await page.locator('.move-block.orange,.move-block.blue').count(),q[0]+q[1]);await page.locator('#reset-blocks').click();}
 await page.keyboard.type('99');await page.locator('#submit').click();assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.outcome),'pending');
 await page.keyboard.type(String(multiply?q[0]*q[1]:q[0]+q[1]));await page.locator('#submit').click();assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.outcome),'won');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
}
await page.evaluate(()=>{document.querySelector('#quiz').close();});const flight=await page.evaluate(()=>advancedFixture.flight());assert.ok(flight.range>30&&flight.gap>=25);
await page.setViewportSize({width:1024,height:900});await page.evaluate(()=>advancedFixture.open('enderdragon',[19,21]));await page.screenshot({path:'test-artifacts/advanced-addition.png'});
await page.evaluate(()=>advancedFixture.open('pig',[5,9]));await page.screenshot({path:'test-artifacts/advanced-multiplication.png'});
assert.deepEqual(errors,[]);console.log('PASS: hard sums 20–40, tables 2–5, block conservation, grouped multiplication, wrong/correct answers, rewards, flight and three viewport sizes.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
