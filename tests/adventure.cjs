const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const artifacts=path.join(__dirname,'../test-artifacts');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
// Legacy saves must keep the three bridges and gain their earned badges.
await context.addInitScript(()=>{if(!localStorage.getItem('seonyul-block-island-v1'))localStorage.setItem('seonyul-block-island-v1',JSON.stringify({completed:3}));});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER:',e.stack);});
await page.goto('http://localhost:4173');await page.locator('#start').click();
const snap=()=>page.evaluate(()=>blockIsland.snapshot());
assert.equal((await snap()).badgeTotal,3);
const questions=await page.evaluate(()=>blockIsland.questions());assert.equal(questions.length,45);assert.equal(new Set(questions.map(q=>q.key)).size,45);
assert.ok(questions.every(q=>q.a>=1&&q.a<=9&&q.b>=1&&q.b<=9&&q.a+q.b>=10&&q.a+q.b<=18));
assert.ok(questions.some(q=>q.a===1&&q.b===9));assert.ok(questions.some(q=>q.a===9&&q.b===9));
// Tap characters directly on the world, not only their shortcut buttons.
const target=await page.evaluate(()=>blockIsland.targets().find(t=>t.key==='fox'));
await page.locator('#world').click({position:{x:target.x,y:target.y}});await page.locator('#friend-dialog').waitFor({state:'visible'});
assert.match(await page.locator('#friend-title').innerText(),/여우/);
await page.locator('#friend-avatar').click();assert.equal((await snap()).bonds.fox,1);await page.locator('#dance-friend').click();assert.match(await page.locator('#friend-speech').innerText(),/춤/);
await page.screenshot({path:path.join(artifacts,'friend.png')});await page.locator('#friend-play').click();
assert.equal((await snap()).kind,'practice');assert.equal((await snap()).total,10);
const solve=async()=>{while((await snap()).left<10)await page.locator('#right-frame .movable').first().click();const s=await snap();assert.equal(s.left+s.right,s.total);assert.equal(await page.locator('#answer-input').inputValue(),'');await page.locator('#answer-input').fill(String(s.total));await page.locator('#finish').click();await page.locator('#reward').waitFor({state:'visible'});return s;};
// Wrong answers do not award badges or produce a reward.
while((await snap()).left<10)await page.locator('#right-frame .movable').first().click();
await page.locator('#answer-input').fill('99');await page.locator('#finish').click();assert.equal((await snap()).badgeTotal,3);assert.equal(await page.locator('#reward').isVisible(),false);
await page.locator('#answer-input').fill('10');await page.locator('#finish').evaluate(b=>{b.click();b.click();});
assert.equal((await snap()).badgeTotal,4);assert.equal((await snap()).uniqueBadges,4);
assert.equal((await snap()).supplies.fox,1);assert.equal(await page.locator('#reward-confetti i').count(),28);
await page.screenshot({path:path.join(artifacts,'badge-reward.png')});
await page.locator('#reward-album').click();assert.equal(await page.locator('.badge-tile.earned').count(),4);assert.equal(await page.locator('.badge-tile').count(),45);await page.locator('#close-album').click();assert.equal(await page.locator('#reward').isVisible(),true);assert.equal((await snap()).badgeTotal,4);
// A new attempt at the same problem gives exactly one additional badge.
await page.locator('#replay').click();await solve();assert.equal((await snap()).badgeTotal,5);assert.equal((await snap()).uniqueBadges,4);
await page.locator('#reward-world').click();
for(const key of ['bear','rabbit']){await page.locator(`[data-friend="${key}"]`).click();await page.locator('#pet-friend').click();await page.locator('#friend-play').click();assert.equal((await snap()).friendKey,key);assert.ok((await snap()).badges[(await snap()).questionKey]===undefined);await solve();assert.equal((await snap()).supplies[key],1);if(key==='rabbit')await page.screenshot({path:path.join(artifacts,'rabbit-reward.png')});await page.locator('#reward-world').click();}
// Find all four physical treasures. Reopening an already found chest is idempotent.
for(const id of ['leaf','apple','gem','flower']){const t=await page.evaluate(id=>blockIsland.targets().find(t=>t.kind==='treasure'&&t.key===id),id);await page.locator('#world').click({position:{x:t.x,y:t.y}});await page.locator('#discovery').waitFor({state:'visible'});await page.locator('#close-discovery').click();}
assert.equal((await snap()).treasures.length,4);assert.equal((await snap()).badgeTotal,7);
await page.screenshot({path:path.join(artifacts,'adventure-world.png')});
await page.locator('#go-quest').click();
const seen=new Set(Object.keys((await snap()).badges));
while(seen.size<45){const before=await snap();assert.equal(seen.has(before.questionKey),false,'Unsolved problems must precede repeats');await solve();seen.add(before.questionKey);assert.equal((await snap()).uniqueBadges,seen.size);if(seen.size%10===0)console.log(`Verified ${seen.size}/45 distinct problems`);if(seen.size<45)await page.locator('#continue').click();}
assert.equal((await snap()).uniqueBadges,45);assert.equal((await snap()).badgeTotal,46);assert.match(await page.locator('#reward-milestone').innerText(),/마스터/);
await page.locator('#reward-album').click();assert.equal(await page.locator('.badge-tile.earned').count(),45);assert.equal(await page.locator('.milestone-item.earned').count(),4);await page.screenshot({path:path.join(artifacts,'badge-album.png')});
await page.locator('#close-album').click();await page.locator('#continue').click();assert.equal(await page.locator('#puzzle').isVisible(),true);
await page.reload();await page.locator('#start').click();assert.equal((await snap()).badgeTotal,46);assert.equal((await snap()).treasures.length,4);assert.equal((await snap()).completed,3);
// Mobile reward medal, count and continue action must all be visible together.
const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));
await mobile.addInitScript(()=>localStorage.setItem('seonyul-block-island-v1',JSON.stringify({completed:3})));await mobile.goto('http://localhost:4173');await mobile.locator('#start').tap();await mobile.locator('[data-friend="rabbit"]').tap();await mobile.locator('#pet-friend').tap();await mobile.locator('#friend-play').tap();
while(await mobile.evaluate(()=>blockIsland.snapshot().left<10))await mobile.locator('#right-frame .movable').first().tap();
for(const digit of String(await mobile.evaluate(()=>blockIsland.snapshot().total)))await mobile.locator(`[data-digit="${digit}"]`).tap();await mobile.locator('#finish').tap();
for(const selector of ['.medal-face','#reward-total','#continue']){const r=await mobile.locator(selector).boundingBox();assert.ok(r&&r.y>=0&&r.y+r.height<=844,`${selector} must be visible on the phone`);}
await mobile.screenshot({path:path.join(artifacts,'mobile-badge.png')});await mobile.locator('#reward-album').tap();assert.equal(await mobile.locator('.badge-tile').count(),45);await mobile.locator('#close-album').tap();await mobile.locator('#reward-world').tap();await mobile.screenshot({path:path.join(artifacts,'mobile-adventure.png')});
assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
assert.deepEqual(errors,[]);console.log('PASS: all 45 problems, legacy migration, no early/duplicate rewards, replay rewards, milestones, album, all friends, direct world touch, treasures, themed activities, persistence and mobile reward visibility.');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
