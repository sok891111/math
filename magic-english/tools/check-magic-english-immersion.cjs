const assert=require('node:assert/strict'),path=require('node:path');let pw;try{pw=require('playwright');}catch{pw=require(path.resolve(__dirname,'../../block-island/node_modules/playwright'));}
(async()=>{for(const [name,type]of [['Chrome',pw.chromium],['WebKit',pw.webkit]]){
 const browser=await type.launch({headless:true,...(name==='Chrome'?{channel:'chrome'}:{})});
 try{const page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/welcome-voice',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{Math.random=()=>.9;window.__MOCK_SPEECH_RECOGNIZER__=({emitResult})=>setTimeout(()=>emitResult(document.querySelector('.me-turn-phrase').textContent),20);});
 await page.goto((process.env.MAGIC_TEST_URL||'http://localhost:4188')+'/?user=immersion-check');await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);
 const texts=[];async function drain(){for(let i=0;i<30;i++){if(!await page.locator('#dialog').isVisible())return;texts.push(await page.locator('#dialog-text').textContent());if(await page.locator('#turn-speak-btn').isVisible()){await page.locator('#turn-speak-btn').click();await page.waitForTimeout(850);}else if(await page.locator('#dialog-next').isVisible())await page.locator('#dialog-next').click();else return;}}
 await drain();await page.evaluate(()=>{const s=window.__MAGIC_ENGLISH_STAGE1__.getState();Object.assign(s,{map:'AirportHall',stage:'discover_words',x:10,y:8});});
 const before=await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getAirportObjects());
 const roamingIds=['npc_traveler','npc_pilot','npc_kid_traveler','npc_cafe','npc_guard'],moved=new Set();
 for(let i=0;i<10;i++){await page.waitForTimeout(400);const after=await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getAirportObjects());for(const id of roamingIds){const a=after.find(o=>o.id===id),b=before.find(o=>o.id===id);if(a.x!==b.x||a.y!==b.y)moved.add(id);}}
 assert.deepEqual([...moved].sort(),roamingIds.sort(),'all five NPCs visibly change position');
 async function talkTraveler(){await page.evaluate(()=>{const a=window.__MAGIC_ENGLISH_STAGE1__,o=a.getAirportObjects().find(o=>o.id==='npc_traveler');Object.assign(a.getState(),{x:o.x,y:o.y+1,facing:'up'});a.act();});await drain();}
 texts.length=0;await talkTraveler();assert(texts.some(t=>t.includes('You made a new friend!')||t.includes('Nice to meet you, too!')));assert(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().learning.praised.npc_traveler));
 texts.length=0;await talkTraveler();assert(!texts.some(t=>t.includes('You made a new friend!')||t.includes('Nice to meet you, too!')));
 await page.reload();await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);assert(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().learning.praised.npc_traveler));
 texts.length=0;await page.evaluate(()=>{const a=window.__MAGIC_ENGLISH_STAGE1__,s=a.getState();s.discoveries={airplane:true,apple:true,ask:true};s.stage='battle_misspell';s.rewardReceipts['hwalbin-rescued']={id:'hwalbin-rescued'};a.startMisspellBossBattle();});await drain();assert(texts.some(t=>t.includes('내 마법이 풀렸어')));assert(!texts.some(t=>/포켓몬|피카츄|내 체력|Great! Excellent!/.test(t)));assert.deepEqual(errors,[]);
 console.log(name+': visitor movement, first-success-only praise, persisted praise marker, natural boss dialogue passed');
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1;});
