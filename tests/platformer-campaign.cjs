const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});try{
 const page=await browser.newPage({viewport:{width:1024,height:900},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-05T00:00:00Z')});
 await page.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('// Read-only state',`window.campaignFixture={
 clear(){if(mode==='intro')startAdventure();if(mode!=='play')throw Error('Not playing');monsters.forEach(z=>z.defeated=true);player.x=WORLD-180;player.y=groundAt(player.x).y-player.h;step(1/120);},
 rewards(){progress.award('zombie',{elapsedMs:1000,perfect:true});progress.claim({id:'campaign-keepsake',kind:'zombie',gems:8});SunshineWeapons.equip(weapon,'sword');score=777;collected=42;hud();},
 encounter(){const z=monsters[0];encounter(z);}
};\n// Read-only state`)});});
 await page.goto('http://localhost:4173/platformer/');await page.clock.pauseAt(new Date('2026-10-05T00:00:01Z'));
 const snap=()=>page.evaluate(()=>sunshine.snapshot());
 await page.evaluate(()=>campaignFixture.rewards());const original=(await snap()).progress;
 async function stages(){for(let i=1;i<=6;i++){assert.equal((await snap()).campaign.stage,i);await page.evaluate(()=>campaignFixture.clear());assert.equal((await snap()).mode,'clear');await page.locator('#next').tap();}assert.equal((await snap()).mode,'exam');assert.equal((await snap()).campaign.awaitingTest,true);}
 async function answerTest(correct=15){
  const qs=(await snap()).campaign.exam.questions;
  for(let i=0;i<15;i++){await page.keyboard.type(String(i<correct?(qs[i].operator==='×'?qs[i].a*qs[i].b:qs[i].a+qs[i].b):99));await page.locator('#exam-submit').tap();if(i<14){assert.equal((await snap()).campaign.exam.answers.length,i+1);await page.locator('#exam-submit').evaluate(e=>e.click());assert.equal((await snap()).campaign.exam.answers.length,i+1);await page.locator('#exam-next').tap();}}
 }
 await stages();assert.equal(await page.locator('#exam-timer b').textContent(),'10:00');await page.screenshot({path:'test-artifacts/campaign-test.png'});
 await page.clock.runFor(1234);const deadline=(await snap()).campaign.exam.deadline;await page.reload();assert.equal((await snap()).campaign.exam.deadline,deadline);await page.locator('#start').tap();assert.equal((await snap()).mode,'exam');assert.equal((await snap()).campaign.exam.deadline,deadline);
 await answerTest(10);assert.equal((await snap()).campaign.test.passed,false);assert.equal(await page.locator('#exam-blast').isVisible(),true);assert.equal(await page.locator('#blast-pieces i').count(),42);
 await page.clock.runFor(700);await page.screenshot({path:'test-artifacts/campaign-tnt-blast.png'});await page.clock.runFor(1200);
 assert.equal(await page.locator('#exam-result').isVisible(),true);assert.match(await page.locator('#exam-result-copy').textContent(),/1개 더/);assert.equal((await snap()).campaign.level,1);
 await page.locator('#exam-warmup summary').tap();const warm=(await page.locator('#warmup-question').textContent()).match(/(\d+) ([+×]) (\d+)/);const warmAnswer=warm[2]==='×'?Number(warm[1])*Number(warm[3]):Number(warm[1])+Number(warm[3]);await page.locator('#warmup-answer').click();await page.locator('#warmup-answer').pressSequentially(String(warmAnswer));await page.locator('#warmup-check').tap();assert.match(await page.locator('#warmup-feedback').textContent(),/한 문제 해결/);
 await page.screenshot({path:'test-artifacts/campaign-retry.png'});await page.locator('#exam-action').tap();assert.equal((await snap()).campaign.test.remainingMs,600000);
 await answerTest(11);assert.equal((await snap()).campaign.test.passed,true);assert.match(await page.locator('#exam-result-copy').textContent(),/73.3%/);await page.locator('#exam-action').tap();assert.equal((await snap()).difficultyLevel,2);
 await page.locator('#exam-action').evaluate(e=>e.click());assert.equal((await snap()).difficultyLevel,2,'Repeated advance must not skip levels');
 await page.evaluate(()=>campaignFixture.encounter());assert.ok((await snap()).monsters.find(z=>z.q)?.q);assert.equal((await snap()).battle.durationMs,(await page.locator('#operator').textContent())==='×'?60000:30000);await page.locator('#retreat').tap();
 await stages();assert.equal((await snap()).campaign.exam.questions.filter(q=>q.operator==='×').length,5);await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-artifacts/campaign-test-mobile.png'});assert.ok(await page.locator('#level-test').evaluate(e=>e.scrollWidth<=e.clientWidth));
 await page.clock.fastForward(600001);assert.equal((await snap()).campaign.test.reason,'time');assert.equal((await snap()).difficultyLevel,2);await page.clock.runFor(1900);assert.equal(await page.locator('#exam-result').isVisible(),true);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#exam-action').tap();await page.clock.fastForward(600001);assert.equal(await page.locator('#level-test').evaluate(e=>getComputedStyle(e).animationName),'none');await page.clock.runFor(1900);await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:844,height:390});await page.locator('#exam-action').tap();assert.ok(await page.locator('#level-test').evaluate(e=>e.scrollWidth<=e.clientWidth));await answerTest();await page.locator('#exam-action').tap();assert.equal((await snap()).difficultyLevel,3);
 await stages();await answerTest();await page.locator('#exam-action').tap();let s=await snap();assert.equal(s.difficultyLevel,1);assert.equal(s.campaign.stage,1);assert.equal(s.campaign.cycle,2);assert.ok(s.score>=4377);assert.equal(s.collected,42);assert.equal(s.weapon.kind,'sword');assert.deepEqual(s.progress,original);
 await page.reload();s=await snap();assert.equal(s.difficultyLevel,1);assert.equal(s.campaign.cycle,2);assert.equal(s.weapon.kind,'sword');assert.ok(s.score>=4377);assert.deepEqual(s.progress,original);
 assert.deepEqual(errors,[]);console.log('PASS: actual flag gates, reload deadline, 10/11 threshold, duplicate-answer/advance protection, TNT animation, worked-example retry, timeout, reduced motion, three viewports, all levels and persistent rewards after wrap.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
