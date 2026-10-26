const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/magic-english/block-world/rewards?*',async route=>{const userId=new URL(route.request().url()).searchParams.get('userId');await route.fulfill({json:{version:1,userId,rewards:[{userId,rewardId:'speech:ipad-test',source:'magic-english',reason:'말하기:s4_open',blocks:[{blockId:5,quantity:2}]}]}});});
 await page.route('**/api/magic-english/rewards',route=>route.fulfill({json:{created:true}}));
 await page.goto('http://localhost:3000/magic-english/test/stage4');await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);
 await page.evaluate(async()=>{const user=localStorage.getItem('magic-english-stage4-test-profile');const {createInventory}=await import('/magic-english/block-world/inventory.js');const inventory=createInventory();inventory.hearts=4.5;localStorage.setItem('magic-english-block-world-v1:'+user,JSON.stringify({inventory,edits:[]}));scrollTo(0,0);});
 const bounds=await page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};return {screen:box('.screen-wrap'),dpad:box('.dpad'),buttons:box('.action-buttons'),height:innerHeight,width:innerWidth};});
 assert(Math.abs(bounds.screen.width/bounds.screen.height-10/9)<.02,'screen keeps native aspect ratio');assert(bounds.dpad.right<bounds.screen.x);assert(bounds.buttons.x>bounds.screen.right);for(const name of ['dpad','buttons','screen'])assert(bounds[name].bottom<=bounds.height,name+' visible');
 fs.mkdirSync('test-artifacts',{recursive:true});await page.screenshot({path:'test-artifacts/ipad-landscape-controls.png'});
 await page.locator('#touch-menu').tap();await page.locator('#open-hearts-menu').tap();await page.waitForFunction(()=>document.querySelector('.me-heart-balance')?.textContent==='5.5개');assert.match(await page.locator('.me-hearts-modal').innerText(),/받을 하트 1개/);await page.screenshot({path:'test-artifacts/ipad-heart-menu.png'});
 const raw=await page.evaluate(()=>localStorage.getItem('magic-english-block-world-v1:'+localStorage.getItem('magic-english-stage4-test-profile')));assert.equal(JSON.parse(raw).inventory.hearts,4.5);
 await page.route('**/api/magic-english/block-world/rewards?*',route=>route.abort());await page.locator('.me-hearts-modal').getByRole('button',{name:'다시 확인'}).tap();await page.waitForFunction(()=>document.querySelector('.me-heart-balance')?.textContent==='4.5개');assert.match(await page.locator('.me-hearts-modal').innerText(),/마지막으로 저장된 하트/);
 await page.locator('.me-hearts-modal button').getByText('닫기',{exact:true}).tap();
 for(const viewport of [{width:1180,height:820},{width:1366,height:1024}]){await page.setViewportSize(viewport);const fits=await page.evaluate(()=>{const screen=document.querySelector('.screen-wrap').getBoundingClientRect(),left=document.querySelector('.dpad').getBoundingClientRect(),right=document.querySelector('.action-buttons').getBoundingClientRect();return left.right<screen.left&&right.left>screen.right&&screen.bottom<=innerHeight&&Math.abs(screen.width/screen.height-10/9)<.02;});assert(fits,JSON.stringify(viewport));}
 await page.setViewportSize({width:768,height:1024});await page.evaluate(()=>scrollTo(0,0));assert(await page.locator('#touch-action').isVisible());
 const world=await context.newPage();world.on('pageerror',e=>errors.push(e.message));await world.addInitScript(()=>localStorage.setItem('magic-english-block-world-v1:stage4-test-11111111-1111-1111-1111-111111111111:settings',JSON.stringify({fov:55,controls:'easy'})));
 await world.goto('http://localhost:3000/magic-english/block-world?user=stage4-test-11111111-1111-1111-1111-111111111111&touch=1');await world.waitForFunction(()=>window.blockWorld);assert.equal(await world.evaluate(()=>window.blockWorld.getState().fov),75);
 const prevented=await world.evaluate(()=>{
  const events=[new WheelEvent('wheel',{ctrlKey:true,deltaY:-100,cancelable:true,bubbles:true}),new KeyboardEvent('keydown',{ctrlKey:true,code:'Equal',key:'+',cancelable:true,bubbles:true}),new Event('gesturestart',{cancelable:true,bubbles:true}),new Event('gesturechange',{cancelable:true,bubbles:true})];return events.map(e=>{document.dispatchEvent(e);return e.defaultPrevented;});
 });assert.deepEqual(prevented,[true,true,true,true]);assert.equal(await world.evaluate(()=>window.blockWorld.getState().fov),75);
 assert.deepEqual(errors,[]);console.log('PASS: iPad landscape controls, read-only saved + unclaimed heart balance, portrait fallback, zoom gestures/keys blocked, old narrow FOV corrected.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
