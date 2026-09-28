const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4173/platformer/');
 await page.screenshot({path:path.join(__dirname,'../test-artifacts/platformer-welcome.png')});
 await page.locator('#start').click();const snap=()=>page.evaluate(()=>sunshine.snapshot());
 const start=await snap();await page.keyboard.down('ArrowRight');await page.waitForTimeout(300);await page.keyboard.up('ArrowRight');assert.ok((await snap()).player.x>start.player.x+20);
 await page.keyboard.down('Space');await page.waitForTimeout(220);assert.ok((await snap()).player.y<start.player.y-45);await page.keyboard.up('Space');await page.waitForTimeout(850);assert.equal((await snap()).player.grounded,true);
 await page.locator('#pause').click();const paused=await snap();await page.waitForTimeout(200);assert.equal((await snap()).player.x,paused.player.x);await page.locator('#resume').click();
 let checkedWrong=false,checkedRetreat=false;const encountered=new Set();
 const expected=[['zombie','creeper','slime'],['skeleton','spider','witch'],['enderman','magma','ghast']];
 for(let stage=0;stage<3;stage++){
  assert.deepEqual((await snap()).monsters.map(m=>m.kind),expected[stage]);
  assert.equal(await page.locator('.monster-card').count(),3);
  const deadline=Date.now()+55000;
  while((await snap()).mode!=='clear'){
   assert.ok(Date.now()<deadline,'Stage traversal timed out');let s=await snap();
   if(s.mode==='quiz'){
    await page.keyboard.up('ArrowRight');await page.keyboard.up('Space');
    const kind=await page.locator('#monster-portrait').getAttribute('data-kind');encountered.add(kind);
    const monster=(await snap()).monsters.find(m=>m.kind===kind);
    assert.ok((await page.locator('#quiz-title').textContent()).includes(monster.name));
    assert.equal(await page.locator('#monster-portrait').getAttribute('aria-label'),monster.name);
    if(!checkedRetreat){await page.locator('#retreat').click();assert.equal((await snap()).defeated,0);checkedRetreat=true;continue;}
    if(!checkedWrong){const frozen=(await snap()).player.x;await page.waitForTimeout(200);assert.equal((await snap()).player.x,frozen);await page.keyboard.type('99');await page.locator('#submit').click();assert.equal((await snap()).defeated,0);assert.equal(await page.locator('.move-block').count(),20);assert.equal(await page.locator('.move-block.blue').count(),Number(await page.locator('#b').textContent()));await page.screenshot({path:path.join(__dirname,'../test-artifacts/platformer-quiz.png')});checkedWrong=true;}
    const a=Number(await page.locator('#a').textContent()),b=Number(await page.locator('#b').textContent());
    await page.keyboard.type(String(a+b));const before=(await snap()).score;await page.locator('#submit').evaluate(b=>{b.click();b.click();});assert.equal((await snap()).score,before+100);await page.locator('#continue').click();
    assert.equal(await page.locator(`.monster-card[data-kind="${kind}"].purified`).count(),1);
   }else{
    await page.keyboard.down('ArrowRight');const x=s.player.x;
    if((x>935&&x<1200)||(x>2005&&x<2270))await page.keyboard.down('Space');else await page.keyboard.up('Space');
    await page.waitForTimeout(80);
   }
  }
  await page.keyboard.up('ArrowRight');await page.keyboard.up('Space');assert.equal((await snap()).defeated,3);
  if(stage<2)await page.locator('#next').click();
 }
 assert.equal(encountered.size,9,'All nine monster species must be encountered and solved');
 await page.screenshot({path:path.join(__dirname,'../test-artifacts/platformer-complete.png')});
 const saved=await page.locator('#best').textContent();await page.reload();assert.equal(await page.locator('#best').textContent(),saved);
 await page.locator('#start').click();await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');await page.screenshot({path:path.join(__dirname,'../test-artifacts/platformer-desktop.png')});
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://localhost:4173/platformer/');await mobile.locator('#start').tap();assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const cdp=await mobile.context().newCDPSession(mobile);
 const rp=await mobile.locator('[data-control="right"]').boundingBox(),jp=await mobile.locator('[data-control="jump"]').boundingBox();
 const r={x:rp.x+rp.width/2,y:rp.y+rp.height/2,id:1},j={x:jp.x+jp.width/2,y:jp.y+jp.height/2,id:2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[r]});await mobile.waitForTimeout(250);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[r,j]});await mobile.waitForTimeout(170);
 const moving=await mobile.evaluate(()=>sunshine.snapshot());assert.ok(moving.player.x>100);assert.ok(moving.player.y<320);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});

 await mobile.screenshot({path:path.join(__dirname,'../test-artifacts/platformer-mobile.png')});
 assert.deepEqual(errors,[]);await browser.close();console.log('Platformer: movement, jump, landing, pause, retreat, wrong answers, hints, duplicate reward, all 3 worlds, all 9 monster species and portraits, field guide, save and mobile controls passed.');
})().catch(e=>{console.error(e);process.exit(1);});
