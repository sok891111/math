// D-only browser scenario. Speech is mocked; no paid STT/TTS or real profile writes.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const base=process.env.MAGIC_TEST_URL||'http://localhost:3000';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const context=await browser.newContext({viewport:{width:1100,height:850},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const silent=Buffer.alloc(1644);silent.write('RIFF');silent.writeUInt32LE(1636,4);silent.write('WAVEfmt ',8);silent.writeUInt32LE(16,16);silent.writeUInt16LE(1,20);silent.writeUInt16LE(1,22);silent.writeUInt32LE(16000,24);silent.writeUInt32LE(32000,28);silent.writeUInt16LE(2,32);silent.writeUInt16LE(16,34);silent.write('data',36);silent.writeUInt32LE(1600,40);
  await page.route('**/*.mp3*',r=>r.fulfill({status:200,contentType:'audio/wav',body:silent}));
  await page.route('**/api/magic-english/character-voice',r=>r.fulfill({status:200,contentType:'audio/wav',body:silent}));
  await page.route('**/api/magic-english/rewards',r=>r.fulfill({status:200,contentType:'application/json',body:'{"created":true}'}));
  await page.addInitScript(()=>{
   if(localStorage.getItem('magic-english-save-v1:guest')===null)localStorage.setItem('magic-english-save-v1:guest','original-A-B-record');
   window.__MOCK_SPEECH_RECOGNIZER__=({emitResult})=>setTimeout(()=>{sessionStorage.setItem('d-test-utterances',String(Number(sessionStorage.getItem('d-test-utterances')||0)+1));emitResult(document.querySelector('.me-turn-phrase').textContent);},20);
  });
  await page.goto(base+'/magic-english/test/stage4');await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);
  async function state(){return page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState());}
  async function drain(stop){for(let i=0;i<120;i++){
   if(stop&&await stop())return;
   if(!await page.locator('#dialog').isVisible())return;
   if(await page.locator('#turn-speak-btn').isVisible()){await page.locator('#turn-speak-btn').click();await page.waitForTimeout(820);}
   else if(await page.locator('#dialog-next').isVisible()){await page.locator('#dialog-next').click();await page.waitForTimeout(100);}
   else return;
  }throw Error('C dialog did not finish');}
  async function act(id){await page.evaluate(async id=>{const app=window.__MAGIC_ENGLISH_STAGE1__,s=app.getState(),o=app.getMapObjects().find(o=>o.id===id);if(!o)throw Error('Missing object '+id);const {stage4Floor}=await import('/magic-english/magic-english-stage4.js');const at=[[0,1,'up'],[-1,0,'right'],[1,0,'left'],[0,-1,'down']].find(([dx,dy])=>stage4Floor(s.map,o.x+dx,o.y+dy)&&!app.getMapObjects().some(a=>a.kind==='npc'&&a.x===o.x+dx&&a.y===o.y+dy));if(!at)throw Error('No accessible approach '+id);Object.assign(s,{x:o.x+at[0],y:o.y+at[1],facing:at[2]});app.act();},id);}
  assert.equal((await state()).map,'CafeteriaEntrance');
  await act('s4_door');await drain();assert((await state()).stage4.doorOpened);await act('s4_door');assert.equal((await state()).map,'CafeteriaHall');
  for(const word of ['drink','dish','delicious']){await act('s4_word_'+word);await drain();}
  await act('s4_counter');await act('s4_daisy');await drain();assert((await state()).stage4.incidentSeen);
  await act('s4_counter_back');await act('s4_workshop');
  fs.mkdirSync('test-artifacts',{recursive:true});await page.screenshot({path:'test-artifacts/magic-stage4-trains.png'});
  const trains={water:['I','would','like','water','please'],order:['May','I','have','a','drink','please'],dish:['I','would','like','a','dish','please']};
  await act('s4_train_water');await page.locator('#choices').getByRole('button',{name:'please',exact:true}).click();await page.locator('#choices').getByRole('button',{name:'↶ 한 낱말 되돌리기',exact:true}).click();
  await page.locator('#choices').getByRole('button',{name:'I',exact:true}).click();await page.reload();await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);assert.deepEqual((await state()).stage4.trainSelections.water,[0]);
  for(const [key,words]of Object.entries(trains)){await act('s4_train_'+key);for(const word of words.slice(key==='water'?1:0))await page.locator('#choices').getByRole('button',{name:word,exact:true}).click();await drain();assert((await state()).stage4.trains[key]);}
  await act('s4_workshop_back');await act('s4_counter');await act('s4_boss');await drain(async()=> (await state()).stage4.boss.round===1);
  await page.reload();await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);assert.equal((await state()).stage4.boss.round,1);await act('s4_boss');await drain();assert((await state()).stage4.boss.completed);assert.equal((await state()).alphabetPieces.filter(x=>x==='D').length,1);
  await page.screenshot({path:'test-artifacts/magic-stage4-victory.png'});
  await act('s4_counter_back');await act('s4_meal');await drain();assert((await state()).stage4.completed);assert.equal(await page.evaluate(()=>Number(sessionStorage.getItem('d-test-utterances'))),21);
  await act('s4_exit');await drain();assert((await state()).stage4.eHookSeen);
  await page.reload();await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);assert((await state()).stage4.completed);assert.equal((await state()).alphabetPieces.filter(x=>x==='D').length,1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('magic-english-save-v1:guest')),'original-A-B-record');
  await act('s4_tommy');await drain();assert.equal((await state()).learning.stage4Daily.visits.s4_tommy,1);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-artifacts/magic-stage4-mobile.png'});
  assert.deepEqual(errors,[]);console.log('PASS: D 21 utterances, train undo/reload, boss checkpoint, one D badge, meal, E teaser, daily conversation, mobile, existing saves preserved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
