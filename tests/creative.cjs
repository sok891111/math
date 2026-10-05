const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const {levels,expected,validate}=require('../creative/puzzles');
const base=process.env.CREATIVE_TEST_URL||'http://localhost:4190';
const snap=p=>p.evaluate(()=>creativeGame.snapshot());
async function dragTo(page,id,target){const from=await page.locator(`[data-block="${id}"]`).boundingBox();await page.mouse.move(from.x+from.width/2,from.y+from.height/2);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:12});await page.mouse.up();}
async function dragSlot(page,id,i,canvas=false){
 if(canvas){await page.locator('#scene').scrollIntoViewIfNeeded();const box=await page.locator('#scene').boundingBox(),s=await snap(page);const size=await page.locator('#scene').evaluate(c=>({w:c.width,h:c.height}));await dragTo(page,id,{x:box.x+(195+(i+.5)*610/levels[s.index].length-s.camera)*box.width/size.w,y:box.y+239*box.height/size.h});}
 else{const box=await page.locator(`[data-position="${i}"]`).boundingBox();await dragTo(page,id,{x:box.x+box.width/2,y:box.y+box.height/2});}
}
async function moveUntil(page,predicate){await page.locator('#scene').focus();await page.keyboard.down('ArrowRight');try{await page.waitForFunction(predicate,null,{timeout:12000});}finally{await page.keyboard.up('ArrowRight');}}
(async()=>{
 for(const l of levels){assert.equal(validate(l,{}).solved,false);const good=Object.fromEntries(l.holes.map(i=>[i,expected(l,i)]));assert.equal(validate(l,good).solved,true);assert.equal(validate(l,{...good,[l.holes[0]]:'invalid'}).solved,false);}
 const executablePath=process.env.CHROMIUM_PATH||(fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined);
 const browser=await chromium.launch({headless:true,executablePath});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1400},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await page.goto(base+'/creative')).status(),200);
  const scene=await page.locator('#scene').boundingBox();await page.mouse.click(scene.x+900*scene.width/1000,scene.y+195*scene.height/360);
  assert.equal((await snap(page)).mode,'friend');assert.ok((await page.locator('#friend-message').innerText()).length>10);const firstMessage=await page.locator('#friend-message').innerText();
  const waiting=(await snap(page)).player.x;await page.keyboard.press('ArrowRight');assert.equal((await snap(page)).player.x,waiting);
  await page.locator('#close-friend').click();assert.equal((await snap(page)).mode,'play');assert.equal((await snap(page)).gems,0);await page.locator('#scene').focus();
  await page.mouse.click(scene.x+900*scene.width/1000,scene.y+195*scene.height/360);assert.notEqual(await page.locator('#friend-message').innerText(),firstMessage);await page.locator('#close-friend').click();
  await page.locator('[data-block="sun"]').click();await page.locator('[data-position="5"]').click();await page.mouse.click(scene.x+610*scene.width/1000,scene.y+239*scene.height/360);assert.deepEqual((await snap(page)).placements,{});
  const initial=(await snap(page)).player.x;await page.keyboard.down('ArrowLeft');await page.waitForTimeout(200);await page.keyboard.up('ArrowLeft');assert.ok((await snap(page)).player.x<initial);
  await page.keyboard.press('Space');assert.equal((await snap(page)).player.y,165);
  await moveUntil(page,()=>creativeGame.snapshot().mode==='fall');await page.waitForFunction(()=>creativeGame.snapshot().mode==='fall-guide');assert.equal((await snap(page)).player.x,130);await page.locator('#repair-bridge').click();assert.equal((await snap(page)).falls,1);assert.equal((await snap(page)).completed.length,0);assert.equal(await page.locator('#reward').isVisible(),false);
  // Invalid drops do not place anything; canceled pointer does not leave a ghost.
  await dragTo(page,'sun',{x:10,y:10});assert.deepEqual((await snap(page)).placements,{});
  const source=await page.locator('[data-block="leaf"]').boundingBox();await page.mouse.move(source.x+20,source.y+20);await page.mouse.down();await page.locator('[data-block="leaf"]').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();assert.equal(await page.locator('.drag-ghost').count(),0);
  await dragSlot(page,'sun',7);await dragSlot(page,'leaf',5,true);assert.equal((await snap(page)).placements[5],'leaf');await moveUntil(page,()=>creativeGame.snapshot().mode==='fall');await page.waitForFunction(()=>creativeGame.snapshot().mode==='fall-guide');assert.equal((await snap(page)).player.x,130);await page.locator('#repair-bridge').click();assert.equal((await snap(page)).falls,2);assert.equal(await page.locator('#story').innerText(),'잘못된 블럭을 놓아서 크리퍼가 빠졌어요. 다시 규칙을 찾아서 다리를 완성해주세요.');assert.deepEqual((await snap(page)).placements,{});assert.equal((await snap(page)).guideSlot,5);await page.locator('#undo').click();assert.deepEqual((await snap(page)).placements,{});await page.reload();assert.deepEqual((await snap(page)).placements,{});assert.equal((await snap(page)).player.x,130);
  await page.locator('#hint').click();await dragSlot(page,'sun',5,true);await page.reload();assert.equal((await snap(page)).placements[5],'sun');assert.equal((await snap(page)).falls,2);
  await dragSlot(page,'sun',7);await page.locator('#undo').click();assert.equal((await snap(page)).placements[7],undefined);
  fs.mkdirSync('test-artifacts',{recursive:true});await page.screenshot({path:'test-artifacts/creative-playable-desktop.png',fullPage:true});
  for(let n=0;n<levels.length;n++){
   const l=levels[n];for(const i of l.holes)await dragSlot(page,expected(l,i),i);
   assert.equal((await snap(page)).completed.length,n); // Building alone gives no reward.
   await moveUntil(page,()=>creativeGame.snapshot().mode==='reward');await page.locator('#reward').waitFor({state:'visible'});
   const s=await snap(page);assert.equal(s.completed.length,n+1);assert.equal(s.gems,n===5?80:(n+1)*10);
   if(n===0){await page.screenshot({path:'test-artifacts/creative-reward.png',fullPage:true});await page.reload();assert.equal((await snap(page)).gems,10);assert.equal(await page.locator('#reward').isVisible(),true);await page.locator('#reward-album').click();assert.equal(await page.locator('.badge-card.earned').count(),1);await page.locator('#close-album').click();assert.equal((await snap(page)).mode,'reward');}
   await page.locator('#reward-next').click();
  }
  assert.equal((await snap(page)).mode,'warden');assert.equal((await snap(page)).completed.length,6);await page.reload();assert.equal((await snap(page)).mode,'warden');assert.equal((await snap(page)).gems,80);assert.equal(await page.locator('#replay').count(),0);
  // Mobile pointer events exercise the same capture-based drag path as real touch.
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await mobile.goto(base+'/creative');
  assert.equal(await mobile.locator('#talk-friend').count(),0);
  const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));
  await mobile.locator('#scene').scrollIntoViewIfNeeded();
  const control=await mobile.locator('[data-move="1"]').boundingBox();
  const cdp=await mobile.context().newCDPSession(mobile);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:control.x+20,y:control.y+20}]});
  await mobile.waitForFunction(()=>creativeGame.snapshot().mode==='fall-guide',null,{timeout:10000});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal((await snap(mobile)).player.x,130);await mobile.locator('#repair-bridge').tap();
  const move=await mobile.locator('[data-move="1"]').boundingBox();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:move.x+20,y:move.y+20}]});await mobile.waitForTimeout(1900);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const palette=await mobile.locator('[data-block="sun"]').boundingBox(),view=await mobile.locator('#scene').boundingBox(),ms=await snap(mobile);
  const start={x:palette.x+palette.width/2,y:palette.y+palette.height/2};
  const end={x:view.x+(195+5.5*610/8-ms.camera)*view.width/480,y:view.y+239*view.height/360};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/8,y:start.y+(end.y-start.y)*i/8}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal((await snap(mobile)).placements[5],'sun');assert.deepEqual(mobileErrors,[]);
  // A tap must never fill or replace a bridge block.
  await mobile.getByRole('button',{name:'해 블록 선택',exact:true}).tap();await mobile.locator('[data-position="7"]').tap();assert.equal((await snap(mobile)).placements[7],undefined);
  const m=await mobile.locator('[data-move="1"]').boundingBox();await mobile.mouse.move(m.x+20,m.y+20);await mobile.mouse.down();await mobile.waitForTimeout(250);await mobile.mouse.up();assert.ok((await snap(mobile)).player.x>ms.player.x);const stopped=(await snap(mobile)).player.x;await mobile.waitForTimeout(200);assert.equal((await snap(mobile)).player.x,stopped);
  await mobile.locator('#pause').tap();assert.equal((await snap(mobile)).mode,'pause');await mobile.locator('#resume').tap();assert.equal((await snap(mobile)).mode,'play');assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mobile.screenshot({path:'test-artifacts/creative-playable-mobile.png',fullPage:true});
  const context=await browser.newContext();const a=await context.newPage();await a.addInitScript(()=>window.__BLOCK_USER__={id:'testA',name:'하나'});await a.goto(base+'/creative');await a.evaluate(()=>localStorage.setItem('block-creative-bridge-v1:testA',JSON.stringify({index:3,completed:[0,1,2]})));await a.reload();assert.equal((await snap(a)).index,3);
  const b=await context.newPage();await b.addInitScript(()=>window.__BLOCK_USER__={id:'testB',name:'둘'});await b.goto(base+'/creative');assert.equal((await snap(b)).index,0);assert.equal((await snap(b)).gems,0);
  const blocked=await browser.newPage();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}}));await blocked.goto(base+'/creative');assert.match(await blocked.locator('#storage-note').innerText(),/저장할 수 없어요/);
  assert.deepEqual(errors,[]);console.log('PASS: drag/drop, cancel, invalid drop, left/right, gaps, wrong blocks, recovery, no jump, 6 completions, reward persistence/dedup, one-time bridge completion, album, mobile, pause, user isolation.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
