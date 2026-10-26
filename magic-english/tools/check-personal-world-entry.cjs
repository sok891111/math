const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.MAGIC_TEST_URL||'http://localhost:3000';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext(),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 const user='stage3-test-33333333-3333-3333-3333-333333333333';
 await context.route('**/api/magic-english/block-world/rewards?*',route=>{const id=new URL(route.request().url()).searchParams.get('userId');requests.push(id);return route.fulfill({json:{version:1,userId:id,rewards:[]}});});
 await context.route('**/api/magic-english/rewards',route=>route.fulfill({json:{created:true}}));
 await page.addInitScript(user=>localStorage.setItem('magic-english-stage3-test-profile',user),user);
 await page.goto(base+'/magic-english/test/stage3');await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);
 const original=await page.evaluate(async user=>{
  const {VoxelWorld,DEFAULT_BAR}=await import('/magic-english/block-world/world.js');const {createInventory}=await import('/magic-english/block-world/inventory.js');
  const world=new VoxelWorld('my-personal-house','flat').generate(),stock=createInventory();stock.hearts=6.5;stock.counts[5]=4;
  world.set(Math.floor(world.spawn.x)+3,Math.floor(world.spawn.y)+1,Math.floor(world.spawn.z),5);
  const value={format:1,name:'아이의 기존 집',seed:world.seed,terrain:'flat',edits:[...world.edits],player:{...world.spawn,yaw:0,pitch:-.48,flying:false},bar:[...DEFAULT_BAR],inventory:stock,time:.27,updatedAt:Date.now()};
  localStorage.setItem('magic-english-block-world-v1:'+user,JSON.stringify(value));localStorage.setItem('magic-english-block-world-v1:demo',JSON.stringify({...value,name:'공용 테스트 세계',inventory:{...stock,hearts:150}}));return value;
 },user);
 await page.locator('#mode-link-block').click();await page.waitForURL('**/magic-english/block-world?**');assert.equal(new URL(page.url()).searchParams.get('user'),user);await page.waitForFunction(()=>window.blockWorld?.getState().name==='아이의 기존 집').catch(async error=>{console.error({url:page.url(),errors,diagnostic:await page.evaluate(()=>({error:document.querySelector('#error-message')?.textContent,welcome:document.querySelector('#welcome .intro-copy')?.textContent,world:window.blockWorld?.getState()?.name}))});throw error;});
 let s=await page.evaluate(()=>window.blockWorld.getState());assert.equal(s.inventory.hearts,6.5);assert.deepEqual(s.edits,original.edits);assert.equal(s.key,'magic-english-block-world-v1:'+user);assert.equal(await page.locator('#create-button,#new-world-button,#create-form').count(),0);assert(!await page.locator('#welcome').isVisible());
 await page.locator('#pause-button').click();assert.equal(await page.getByRole('button',{name:/새 (세계|월드)/}).count(),0);
 await page.reload();await page.waitForFunction(()=>window.blockWorld?.getState().name==='아이의 기존 집');s=await page.evaluate(()=>window.blockWorld.getState());assert.equal(s.inventory.hearts,6.5);assert.deepEqual(s.edits,original.edits);
 // A first visit creates only this child's own empty-stock world, without a chooser.
 const fresh='stage3-test-44444444-4444-4444-4444-444444444444';await page.goto(base+'/magic-english/block-world?user='+fresh);await page.waitForFunction(()=>window.blockWorld?.getState().key.endsWith('44444444-4444-4444-4444-444444444444'));s=await page.evaluate(()=>window.blockWorld.getState());assert.equal(s.inventory.hearts,0);assert.deepEqual(s.inventory.counts,{});assert(!await page.locator('#welcome').isVisible());
 // Standalone visits also use a private browser ID, never demo's 150 hearts.
 await page.goto(base+'/magic-english/block-world');await page.waitForFunction(()=>window.blockWorld?.getState().key.includes('magic-guest-'));s=await page.evaluate(()=>window.blockWorld.getState());assert.equal(s.inventory.hearts,0);assert(!requests.includes('demo'));assert.deepEqual(errors,[]);
 console.log('PASS: real adventure link enters the same profile/world, keeps house and hearts after reload, no new-world buttons, new/anonymous worlds receive no demo stock.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
