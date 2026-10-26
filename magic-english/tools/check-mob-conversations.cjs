const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});try{
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[],dynamic=[];
 page.on('pageerror',e=>errors.push(e.message));
 const silent=Buffer.alloc(1644);silent.write('RIFF');silent.writeUInt32LE(1636,4);silent.write('WAVEfmt ',8);silent.writeUInt32LE(16,16);silent.writeUInt16LE(1,20);silent.writeUInt16LE(1,22);silent.writeUInt32LE(16000,24);silent.writeUInt32LE(32000,28);silent.writeUInt16LE(2,32);silent.writeUInt16LE(16,34);silent.write('data',36);silent.writeUInt32LE(1600,40);
 await page.route('**/*.mp3*',r=>r.fulfill({status:200,contentType:'audio/wav',body:silent}));
 await page.route('**/api/magic-english/character-voice',r=>{dynamic.push(r.request().postDataJSON());return r.fulfill({status:200,contentType:'audio/wav',body:silent});});
 await page.route('**/api/magic-english/block-world/rewards?*',r=>r.fulfill({json:{version:1,userId:new URL(r.request().url()).searchParams.get('userId'),rewards:[]}}));
 await page.addInitScript(()=>{window.__MOCK_SPEECH_RECOGNIZER__=({emitResult,emitError})=>setTimeout(()=>{if(sessionStorage.getItem('mob-error')){sessionStorage.removeItem('mob-error');emitError('not-allowed','마이크 권한을 확인해 주세요.');return;}if(sessionStorage.getItem('mob-wrong')){sessionStorage.removeItem('mob-wrong');emitResult('banana');return;}emitResult(document.querySelector('#mob-talk-phrase').textContent);},25);});
 await page.goto('http://localhost:3000/magic-english/test/stage4');await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);
 async function seed(type,index,puff=false){const profile='stage4-test-55555555-5555-5555-5555-'+String(index).padStart(12,'0');await page.evaluate(async({type,profile,puff})=>{
  const {VoxelWorld,DEFAULT_BAR}=await import('/magic-english/block-world/world.js'),{createInventory}=await import('/magic-english/block-world/inventory.js'),{MOB_SCRIPTS,newMobLearning}=await import('/magic-english/block-world/mob-conversations.js');
  const world=new VoxelWorld('mob-ui-'+type,'flat').generate(),p={...world.spawn,yaw:0,pitch:-.4,flying:false},stock=createInventory(),learning=newMobLearning();stock.hearts=10;stock.counts[5]=5;if(type==='creeper'||type==='chicken')learning.counts[type]=1;
  const animals={version:1,hostilesInitialized:true,entities:[{id:'mob-'+type,type,x:p.x,y:p.y,z:p.z-(puff?1.2:2),yaw:0,hp:puff?4:1,respawn:0,wait:10,...(puff?{fuse:1.7}:{})}]};
  localStorage.setItem('magic-english-block-world-v1:'+profile,JSON.stringify({format:1,name:'대화 테스트 '+type,terrain:'flat',seed:world.seed,edits:[],player:p,bar:DEFAULT_BAR,inventory:stock,animals,mobLearning:learning,tool:'stick',time:.72,updatedAt:Date.now()}));
  localStorage.setItem('magic-english-save-v1:'+profile,JSON.stringify({learning:{practicedTargets:Object.fromEntries(MOB_SCRIPTS.flatMap(s=>s.rows.map(r=>[r.target,true])))}}));
 },{type,profile,puff});await page.goto('http://localhost:3000/magic-english/block-world?user='+profile+'&touch=1');await page.waitForFunction(()=>window.blockWorld);return profile;}
 const state=()=>page.evaluate(()=>window.blockWorld.getState());
 for(const [index,type]of ['zombie','creeper','pig','chicken'].entries()){
  await seed(type,index+1);await page.waitForFunction(type=>window.blockWorld.getState().animalTarget?.type===type,type);await page.locator('#easy-place').tap();await page.waitForSelector('#mob-conversation-panel:not([hidden])');
  let current=await state();assert.equal(current.mode,'mob-conversation-panel');assert.equal(current.active,false);assert.equal(current.mobLearning.queue.length,1);const expected={zombie:4,creeper:5,pig:3,chicken:5}[type];assert.match(await page.locator('#mob-talk-progress').innerText(),new RegExp('1 / '+expected));
  if(type==='zombie'){
   const frozen=await state();await page.keyboard.press('ArrowUp');await page.keyboard.press('Escape');await page.evaluate(()=>{document.querySelector('#pause-button').click();document.querySelector('#easy-place').click();});await page.waitForTimeout(1200);const after=await state();assert.equal(after.mode,'mob-conversation-panel');assert.deepEqual(after.player,frozen.player);assert.equal(after.inventory.heartElapsed,frozen.inventory.heartElapsed);assert.equal(after.inventory.hearts,frozen.inventory.hearts);assert.deepEqual(after.animals,frozen.animals);
   await page.evaluate(()=>sessionStorage.setItem('mob-wrong','yes'));await page.locator('#mob-talk-speak').tap();await page.waitForFunction(()=>document.querySelector('#mob-talk-status').textContent.includes('조금 다르게'));assert.equal((await state()).mobLearning.queue[0].next,0);
   await page.evaluate(()=>sessionStorage.setItem('mob-error','yes'));await page.locator('#mob-talk-speak').tap();await page.waitForFunction(()=>document.querySelector('#mob-talk-status').textContent.includes('마이크 권한'));assert.equal((await state()).mobLearning.queue[0].next,0);
  }
  if(type==='creeper'){fs.mkdirSync('test-artifacts',{recursive:true});await page.screenshot({path:'test-artifacts/creeper-english-conversation.png'});}
  for(let turn=0;turn<expected;turn++){
   await page.locator('#mob-talk-speak').tap();await page.waitForFunction(()=>!document.querySelector('#mob-talk-next').hidden);
   if(type==='zombie'&&turn===0){await page.reload();await page.waitForFunction(()=>window.blockWorld?.getState().mode==='mob-conversation-panel');assert.equal((await state()).mobLearning.queue[0].next,1);assert.match(await page.locator('#mob-talk-progress').innerText(),/2 \/ 4/);continue;}
   await page.locator('#mob-talk-next').tap();
  }
  assert.equal((await state()).mobLearning.queue.length,0);await page.getByRole('button',{name:'🧱 게임 계속하기',exact:true}).tap();await page.waitForFunction(()=>window.blockWorld.getState().active);assert.equal((await state()).mode,'playing');
 }
 await seed('creeper',9,true);await page.waitForSelector('#mob-conversation-panel:not([hidden])');assert.equal((await state()).inventory.hearts,8);assert.equal((await state()).active,false);assert.equal((await state()).mobLearning.queue.length,1);
 assert.deepEqual(errors,[]);assert.deepEqual(dynamic,[]);console.log('PASS: four actual defeats trigger species-specific 3–5 Speak turns; no escape/movement/hearts/damage during dialogue; wrong answers and mic failure retry, reload resumes turn 2, completion unlocks play; creeper puff also pauses; all voices static.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
