const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
for(const mobile of [false,true]){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('seonyul-block-island-v1',JSON.stringify({completed:3,badges:{'9+1':{count:1,friend:'fox'},'9+2':{count:1,friend:'fox'},'9+3':{count:1,friend:'fox'}}})));
 await page.goto('http://localhost:4173');await page.locator('#start').click();await page.locator('#go-quest').click();
 assert.equal(await page.locator('#original-a').innerText(),'9');assert.equal(await page.locator('#original-b').innerText(),'4');
 assert.equal(await page.locator('[data-origin=a]').count(),9);assert.equal(await page.locator('[data-origin=b]').count(),4);
 assert.equal(await page.locator('#regrouped-sum').isVisible(),false);
 await page.locator('#original-b').click();assert.equal(await page.locator('#puzzle').getAttribute('data-highlight-origin'),'b');
 await page.screenshot({path:path.join(__dirname,`../test-artifacts/math-before-${mobile?'mobile':'desktop'}.png`)});
 if(mobile)await page.locator('#right-frame .movable').first().tap();else await page.locator('#right-frame .movable').first().click();
 await page.waitForFunction(()=>!document.querySelector('.transfer-cube'));
 assert.equal(await page.locator('#current-a').innerText(),'10');assert.equal(await page.locator('#current-b').innerText(),'3');
 assert.equal(await page.locator('#split-original').innerText(),'처음 파란 4개');assert.equal(await page.locator('#split-moved').innerText(),'옮긴 1개');assert.equal(await page.locator('#split-left').innerText(),'남은 3개');
 assert.equal(await page.locator('#left-frame [data-origin=a]').count(),9);assert.equal(await page.locator('#left-frame [data-origin=b]').count(),1);assert.equal(await page.locator('#right-frame [data-origin=b]').count(),3);
 assert.equal(/\b13\b/.test(await page.locator('#puzzle').innerText()),false);
 const a=await page.locator('#left-frame').boundingBox(),b=await page.locator('#right-frame').boundingBox();assert.ok(a.x<b.x,'Written addends and block groups have the same order');
 if(mobile){const finish=await page.locator('#finish').boundingBox();assert.ok(finish.y+finish.height<=844,'Answer button must fit on the phone');}
 await page.screenshot({path:path.join(__dirname,`../test-artifacts/math-after-${mobile?'mobile':'desktop'}.png`)});
 await page.locator('#undo').click();assert.equal(await page.locator('#regrouped-sum').isVisible(),false);assert.equal(await page.locator('[data-origin=b]').count(),4);
 await page.locator('#right-frame .movable').first().click();await page.locator('#answer-input').fill('13');await page.locator('#finish').click();
 assert.match(await page.locator('#reward-math-story').innerText(),/9개와 4개를 합치면 13개/);
 assert.deepEqual(errors,[]);await page.close();
}
console.log('PASS: 9+4 ↔ 10+3, color provenance, 4=1+3, reversible regrouping, hidden total, numeric answer, and matching block order on desktop/mobile.');await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
