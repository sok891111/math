const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try{
   const page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true,isMobile:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   // Fixtures stay in the test response; production exposes no mutable state.
   await page.route('**/game.js*',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('// Read-only state',`window.modalFixture={
     flag:()=>{player.x=WORLD-180;player.y=groundAt(player.x).y-player.h;step(1/120);},
     loot:()=>collectDrop({id:'test-'+Math.random(),kind:'zombie',tier:'gold',gems:3,points:200,x:player.x,y:player.y,badges:[]})
    };\n// Read-only state`)});
   });
   await page.goto('http://localhost:4173/platformer/');
   await page.locator('#start').tap();
   await page.evaluate(()=>document.body.classList.add('game-only'));
   const state=()=>page.evaluate(()=>sunshine.snapshot());
   const closed=async()=>assert.equal(await page.locator('dialog[open]').count(),0);
   await page.evaluate(()=>modalFixture.flag());
   await page.locator('#next').tap();
   assert.equal((await state()).stageNumber,2);assert.equal((await state()).mode,'play');await closed();
   await page.evaluate(()=>modalFixture.loot());
   // Complete treasure and any badge page with actual touchscreen taps.
   for(let i=0;i<3&&await page.locator('#loot-dialog').isVisible();i++)await page.locator('#loot-next').tap();
   await closed();assert.equal((await state()).mode,'play');
   await page.evaluate(()=>modalFixture.loot());await page.locator('#loot-close').tap();await closed();
   await page.locator('#pause').tap();await page.locator('#resume').tap();await closed();
   await page.locator('#open-badges').tap();await page.locator('.collectible-card').first().tap();
   await page.locator('#close-detail').tap();assert.equal(await page.locator('#badge-album').isVisible(),true);
   await page.locator('#close-badges').tap();await closed();assert.equal((await state()).mode,'play');
   await page.locator('#pause').tap();await page.keyboard.press('Escape');await closed();
   assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('game-only')),true);
   // Regression: a touch sequence with no browser-generated compatibility click.
   await page.evaluate(()=>modalFixture.flag());
   await page.locator('#next').evaluate(button=>{
    const r=button.getBoundingClientRect(),touch={identifier:9,target:button,clientX:r.x+r.width/2,clientY:r.y+r.height/2};
    for(const type of ['touchstart','touchend']){const e=new Event(type,{bubbles:true,cancelable:true});Object.defineProperties(e,{touches:{value:type==='touchstart'?[touch]:[]},changedTouches:{value:[touch]}});button.dispatchEvent(e);}
   });
   assert.equal((await state()).stageNumber,3);await closed();
   assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': fullscreen modal taps, reward dismissal, nested badges, pause, Escape, missing compatibility click');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
