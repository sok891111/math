const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});try{
 const page=await browser.newPage({hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-05T00:00:00Z')});
 await page.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('// Read-only state',`window.lessonFixture={open(kind,q){if($('quiz').open)closeQuiz();loadLevel('meadow');begin();const z=monsters[0];Object.assign(z,{kind,name:catalog[kind].name});encounter(z);z.q=q;$('a').textContent=q[0];$('b').textContent=q[1];renderBlocks();$('quiz').scrollTop=0;}};\n// Read-only state`)});});
 await page.goto('http://localhost:4173/platformer/');await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
 for(const viewport of [{width:1024,height:900},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  for(const [kind,food] of [['pig','🍎'],['rabbit','🥕'],['chicken','🌽']]){
   await page.evaluate(k=>lessonFixture.open(k,[2,3]),kind);
   assert.equal(await page.locator('.multiply-block').count(),6);assert.equal(await page.locator('.multiply-block').first().textContent(),food);
   assert.match(await page.locator('#multiply-story').textContent(),/한 접시에 2개씩, 접시가 3개/);
   assert.ok(await page.locator('#block-instruction').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=20));
   assert.ok(await page.locator('#multiply-story').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=22));
   assert.ok(await page.locator('#quiz').evaluate(e=>e.scrollWidth<=e.clientWidth));
   assert.ok(await page.evaluate(()=>{
    const rect=id=>document.getElementById(id).getBoundingClientRect();
    return rect('quiz-title').bottom<=rect('block-instruction').top&&rect('keypad').bottom<=rect('submit').top;
   }),'Large teaching text and answer controls must not overlap');
   await page.locator('.multiply-group').nth(2).tap();assert.equal(await page.locator('.multiply-group[aria-pressed=true]').count(),0);
   await page.locator('#multiply-next').tap();assert.match(await page.locator('.multiply-step').textContent(),/첫 접시에 2개/);
   await page.locator('.multiply-group').first().tap();assert.equal(await page.locator('.multiply-group[aria-pressed=true]').count(),1);
   await page.locator('#multiply-next').tap();assert.match(await page.locator('.multiply-step').textContent(),/2개에 2개를 더하면 4개/);
   await page.locator('#multiply-next').tap();assert.match(await page.locator('.multiply-summary').textContent(),/2 × 3 = 6/);
   assert.equal(await page.locator('#multiply-next').isDisabled(),true);assert.equal(await page.locator('#answer').textContent(),'?');
   await page.locator('#reset-blocks').tap();assert.equal(await page.locator('.multiply-group[aria-pressed=true]').count(),0);assert.equal(await page.locator('#multiply-next').isDisabled(),false);
   await page.keyboard.type('5');await page.locator('#submit').click();assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.outcome),'pending');
   await page.locator('#multiply-next').tap();await page.locator('#multiply-next').tap();await page.locator('#multiply-next').tap();
   await page.keyboard.type('6');await page.locator('#submit').click();assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.outcome),'won');
  }
  await page.evaluate(()=>lessonFixture.open('rabbit',[5,9]));
  await page.clock.runFor(1000);const before=await page.evaluate(()=>sunshine.snapshot().battle.remainingMs);
  await page.keyboard.type('12');await page.locator('#multiply-easier').tap();
  assert.equal(await page.locator('#a').textContent(),'2');assert.equal(await page.locator('#b').textContent(),'3');assert.equal(await page.locator('#answer').textContent(),'?');
  assert.equal(await page.locator('#multiply-easier').isVisible(),false);assert.ok(await page.evaluate(ms=>sunshine.snapshot().battle.remainingMs<=ms,before));
  await page.locator('#multiply-next').tap();await page.locator('#multiply-next').tap();
  await page.locator('#quiz').evaluate(e=>e.scrollTop=0);await page.screenshot({path:`test-artifacts/multiply-lesson-${viewport.width}.png`});
 }
 await page.clock.fastForward(60001);assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.outcome),'lost');
 const total=await page.evaluate(()=>sunshine.snapshot().progress.total);await page.locator('#multiply-next').evaluate(e=>e.click());assert.equal(await page.evaluate(()=>sunshine.snapshot().progress.total),total);
 await page.evaluate(()=>lessonFixture.open('zombie',[8,7]));assert.equal(await page.locator('#multiply-lesson').isVisible(),false);assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.durationMs),15000);assert.equal(await page.locator('#quiz').evaluate(e=>e.classList.contains('multiply-quiz')),false);
 assert.deepEqual(errors,[]);console.log('PASS: large teaching text, three food models, sequential touch counting without duplicate/skipped groups, repeated addition, reset, easier practice without timer renewal, wrong/correct answers, 60s timeout and addition cleanup on three viewports.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
