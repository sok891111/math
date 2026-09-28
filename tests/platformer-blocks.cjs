const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});const errors=[];
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('seonyul-sunshine-progress-v1',JSON.stringify({bag:[[8,7]]})));await page.goto('http://localhost:4173/platformer/');await page.locator('#fullscreen').click();await page.waitForTimeout(250);
assert.equal(await page.evaluate(()=>document.body.classList.contains('game-only')),true);
assert.equal(await page.locator('.field-guide').isVisible(),false);assert.equal(await page.locator('#fullscreen-game').getAttribute('aria-label'),'전체화면 나가기');
await page.locator('#start').click();await page.keyboard.down('ArrowRight');await page.waitForTimeout(2600);await page.keyboard.up('ArrowRight');await page.locator('#quiz').waitFor();
assert.equal(await page.locator('#block-workspace').isVisible(),true);assert.equal(await page.locator('#hint-toggle').count(),0);
const counts=async()=>({orange:await page.locator('.move-block.orange').count(),blue:await page.locator('.move-block.blue').count(),left:await page.locator('#left-blocks .blue').count(),right:await page.locator('#right-blocks .blue').count()});
assert.deepEqual(await counts(),{orange:8,blue:7,left:0,right:7});await page.locator('#right-blocks .blue').first().click();assert.deepEqual(await counts(),{orange:8,blue:7,left:1,right:6});
async function drag(from,to){const a=await page.locator(from).first().boundingBox(),b=await page.locator(to).first().boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:10});await page.mouse.up();}
await drag('#right-blocks .blue','#left-blocks .empty');assert.deepEqual(await counts(),{orange:8,blue:7,left:2,right:5});
await page.waitForTimeout(410);await page.locator('#right-blocks .blue').first().click();assert.equal((await counts()).left,2);
await drag('#left-blocks .blue','#right-blocks .empty');assert.deepEqual(await counts(),{orange:8,blue:7,left:1,right:6});
await page.waitForTimeout(410);await drag('#right-blocks .blue','#quiz-title');assert.equal((await counts()).left,1);
await page.locator('#reset-blocks').click();assert.equal((await counts()).left,0);
await page.keyboard.type('99');await page.locator('#submit').click();assert.equal(await page.evaluate(()=>sunshine.snapshot().defeated),0);
await page.screenshot({path:path.join(__dirname,'../test-artifacts/platformer-movable-blocks.png')});
await page.keyboard.type('15');await page.locator('#submit').click();assert.equal(await page.locator('.move-block.blue:disabled').count(),7);await page.locator('#continue').click();
await page.screenshot({path:path.join(__dirname,'../test-artifacts/platformer-fullscreen.png')});
await page.locator('#pause').click();assert.equal(await page.locator('#pause-dialog').isVisible(),true);await page.locator('#resume').click();
if(await page.evaluate(()=>!!document.fullscreenElement)){await page.evaluate(()=>document.exitFullscreen());await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.body.classList.contains('game-only')),false);}else await page.locator('#fullscreen-game').click();
// Browsers that reject native fullscreen still provide a full-window game layout.
const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.addInitScript(()=>{localStorage.setItem('seonyul-sunshine-progress-v1',JSON.stringify({bag:[[8,7]]}));Element.prototype.requestFullscreen=()=>Promise.reject(new Error('unsupported'));});await mobile.goto('http://localhost:4173/platformer/');await mobile.locator('#fullscreen').tap();await mobile.locator('#start').tap();await mobile.keyboard.down('ArrowRight');await mobile.waitForTimeout(2600);await mobile.keyboard.up('ArrowRight');await mobile.locator('#quiz').waitFor();
await mobile.locator('#right-blocks .blue').first().tap();assert.equal(await mobile.locator('#left-blocks .blue').count(),1);
const cdp=await mobile.context().newCDPSession(mobile),a=await mobile.locator('#right-blocks .blue').first().boundingBox(),b=await mobile.locator('#left-blocks .empty').first().boundingBox();
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2,id:1}]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+a.width/2+(b.x+b.width/2-a.x-a.width/2)*i/6,y:a.y+a.height/2+(b.y+b.height/2-a.y-a.height/2)*i/6,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await mobile.locator('#left-blocks .blue').count(),2);
assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const submit=await mobile.locator('#submit').boundingBox();assert.ok(submit.y+submit.height<=844,'Submit stays visible on phone');await mobile.screenshot({path:path.join(__dirname,'../test-artifacts/platformer-mobile-blocks.png')});
await mobile.setViewportSize({width:844,height:390});await mobile.waitForTimeout(200);const landSubmit=await mobile.locator('#submit').boundingBox();assert.ok(landSubmit.y+landSubmit.height<=390,'Submit stays visible in landscape');await mobile.screenshot({path:path.join(__dirname,'../test-artifacts/platformer-landscape-blocks.png')});
await mobile.locator('#retreat').tap();await mobile.locator('#fullscreen-game').tap();assert.equal(await mobile.evaluate(()=>document.body.classList.contains('game-only')),false);
assert.deepEqual(errors,[]);await browser.close();console.log('PASS: block counts, tap, mouse/touch drag, undo, invalid drop, ten-slot limit, wrong/correct answer, native fullscreen and fallback, dialogs, exit, phone/landscape layouts.');
})().catch(e=>{console.error(e);process.exit(1);});
