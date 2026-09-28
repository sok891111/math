const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const artifacts=path.join(__dirname,'../test-artifacts');
fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER:',e.stack);});
await page.goto('http://127.0.0.1:4173');await page.locator('#start').click();
await page.screenshot({path:path.join(artifacts,'desktop.png')});
assert.equal(await page.evaluate(()=>window.blockIsland.findPath(11,11)),null);
await page.locator('#go-quest').click();await page.locator('#puzzle').waitFor({state:'visible'});
let snap=()=>page.evaluate(()=>window.blockIsland.snapshot());
const assertHiddenTotal=async(p,total)=>{
 assert.equal(new RegExp(`\\b${total}\\b`).test(await p.locator('#puzzle').innerText()),false,'Total must stay hidden before a correct submission');
};
await assertHiddenTotal(page,15);
assert.equal(await page.locator('#answer-panel').isVisible(),false);
await page.locator('#hint').click();
assert.equal(await page.locator('#demo-hand').isVisible(),true);
await page.screenshot({path:path.join(artifacts,'guided-build.png')});
assert.equal((await snap()).left,7);assert.equal((await snap()).right,8);
assert.equal(await page.locator('#finish').isDisabled(),true);
await page.locator('#right-frame .movable').first().click();assert.equal((await snap()).left,8);
await page.locator('#left-frame .movable').click();assert.equal((await snap()).left,7);
// Actual pointer drag from the cart into the bridge.
const from=await page.locator('#right-frame .movable').first().boundingBox();const to=await page.locator('#left-frame .cell:not(.cube)').first().boundingBox();
await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:8});await page.mouse.up();assert.equal((await snap()).left,8);
// Drop outside both groups leaves quantities unchanged.
const f=await page.locator('#right-frame .movable').first().boundingBox();await page.mouse.move(f.x+10,f.y+10);await page.mouse.down();await page.mouse.move(10,10,{steps:8});await page.mouse.up();assert.equal((await snap()).left,8);
await page.locator('#right-frame .movable').first().click();await page.locator('#right-frame .movable').first().click();
assert.deepEqual([(await snap()).left,(await snap()).right,(await snap()).total],[10,5,15]);
await assertHiddenTotal(page,15);
assert.equal(await page.locator('#answer-panel').isVisible(),true);
assert.equal(await page.locator('#finish').isDisabled(),true);
assert.equal(await page.evaluate(()=>window.blockIsland.findPath(11,11)),null);
await page.screenshot({path:path.join(artifacts,'puzzle.png')});
// Empty, wrong and non-numeric input must never unlock a bridge.
await page.locator('#answer-input').fill('xx');assert.equal(await page.locator('#answer-input').inputValue(),'');
await page.locator('[data-digit="1"]').click();await page.locator('[data-digit="4"]').click();
await page.locator('#finish').click();assert.equal((await snap()).completed,0);
assert.equal(await page.locator('#puzzle').isVisible(),true);
assert.equal(await page.locator('#answer-input').getAttribute('aria-invalid'),'true');
await assertHiddenTotal(page,15);
// The next keypad digit replaces a rejected attempt; erase supports correction.
await page.locator('[data-digit="1"]').click();assert.equal(await page.locator('#answer-input').inputValue(),'1');
await page.locator('[data-digit="6"]').click();await page.locator('#erase-answer').click();
assert.equal(await page.locator('#answer-input').inputValue(),'1');
await page.locator('#undo').click();assert.equal(await page.locator('#answer-panel').isVisible(),false);
assert.equal(await page.locator('#finish').isDisabled(),true);await page.locator('#right-frame .movable').first().click();
assert.equal(await page.locator('#answer-input').inputValue(),'');
await page.locator('[data-digit="1"]').click();await page.locator('[data-digit="5"]').click();
await page.locator('#finish').click();assert.equal((await snap()).completed,1);assert.ok(await page.evaluate(()=>window.blockIsland.findPath(11,11)));await page.locator('#continue').click();await page.locator('#friend-dialog').waitFor({state:'visible'});await page.locator('#close-friend').click();
await page.waitForFunction(()=>window.blockIsland.snapshot().player.x===11);
for(const n of [1,2]){await page.locator('#go-quest').click();await page.locator('#puzzle').waitFor({state:'visible'});while((await snap()).left<10)await page.locator('#right-frame .movable').first().click();const s=await snap();assert.equal(s.left+s.right,s.total);await assertHiddenTotal(page,s.total);await page.locator('#answer-input').fill(String(s.total));await page.locator('#answer-input').press('Enter');assert.equal((await snap()).completed,n+1);await page.locator('#continue').click();await page.locator('#friend-dialog').waitFor({state:'visible'});await page.locator('#close-friend').click();if(n===1)await page.waitForFunction(()=>window.blockIsland.snapshot().player.y===5);}
await page.locator('#free-build').click();await page.locator('#sandbox').waitFor({state:'visible'});for(let i=0;i<13;i++)await page.locator('#garden button').nth(i).click();assert.equal((await snap()).gardenCount,13);assert.match(await page.locator('#garden-bundles').innerText(),/10개 묶음 1개 \+ 낱개 3개 = 13개/);await page.locator('#close-sandbox').click();await page.reload();await page.locator('#start').click();assert.equal((await snap()).completed,3);assert.equal((await snap()).gardenCount,13);
await page.locator('#free-build').click();await page.locator('#garden button').nth(0).click();assert.equal((await snap()).gardenCount,12);await page.locator('#clear-garden').click();assert.equal((await snap()).gardenCount,0);
const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:4173');await mobile.locator('#start').click();await mobile.screenshot({path:path.join(artifacts,'mobile.png')});await mobile.locator('#go-quest').click();await mobile.locator('#puzzle').waitFor({state:'visible'});for(let i=0;i<3;i++){await mobile.locator('#right-frame .movable').first().tap();assert.equal(await mobile.evaluate(()=>window.blockIsland.snapshot().moved),i+1);}assert.equal(await mobile.locator('#finish').isEnabled(),false);
await assertHiddenTotal(mobile,15);await mobile.screenshot({path:path.join(artifacts,'mobile-puzzle.png')});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.locator('[data-digit="1"]').tap();await mobile.locator('[data-digit="4"]').tap();
await mobile.locator('#finish').tap();assert.equal(await mobile.evaluate(()=>window.blockIsland.snapshot().completed),0);
await mobile.locator('[data-digit="1"]').tap();await mobile.locator('[data-digit="5"]').tap();
await mobile.locator('#finish').tap();await mobile.locator('#continue').tap();
assert.deepEqual(errors,[]);console.log('PASS: visual guide, hidden answers, keypad/keyboard entry, empty/invalid/wrong answer gating, correction, undo resets answer, locked bridges, block gestures, three missions, garden, persistence, mobile touch; zero JS errors.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
