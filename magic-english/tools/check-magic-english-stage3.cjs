// C-only browser scenario. Speech is mocked; no paid STT/TTS or real profile writes.
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
   window.__MOCK_SPEECH_RECOGNIZER__=({emitResult})=>setTimeout(()=>{sessionStorage.setItem('c-test-utterances',String(Number(sessionStorage.getItem('c-test-utterances')||0)+1));emitResult(document.querySelector('.me-turn-phrase').textContent);},20);
  });
  await page.goto(base+'/magic-english/test/stage3');await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);
  async function state(){return page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState());}
  async function drain(stop){for(let i=0;i<120;i++){
   if(stop&&await stop())return;
   if(!await page.locator('#dialog').isVisible())return;
   if(await page.locator('#turn-speak-btn').isVisible()){await page.locator('#turn-speak-btn').click();await page.waitForTimeout(820);}
   else if(await page.locator('#dialog-next').isVisible()){await page.locator('#dialog-next').click();await page.waitForTimeout(100);}
   else return;
  }throw Error('C dialog did not finish');}
  async function act(id){await page.evaluate(async id=>{const app=window.__MAGIC_ENGLISH_STAGE1__,s=app.getState(),o=app.getMapObjects().find(o=>o.id===id);if(!o)throw Error('Missing object '+id);const {stage3Floor}=await import('/magic-english/magic-english-stage3-layout.js');const at=[[0,1,'up'],[-1,0,'right'],[1,0,'left'],[0,-1,'down']].find(([dx,dy])=>stage3Floor(s.map,o.x+dx,o.y+dy)&&!app.getMapObjects().some(a=>a.kind==='npc'&&a.x===o.x+dx&&a.y===o.y+dy));if(!at)throw Error('No accessible approach '+id);Object.assign(s,{x:o.x+at[0],y:o.y+at[1],facing:at[2]});app.act();},id);}
  assert.equal((await state()).map,'SchoolYard');assert((await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getMapObjects().filter(o=>o.kind==='npc').length))>=3);await act('s3_hall');assert.equal((await state()).map,'SchoolHall');
  await act('s3_class');await drain();await act('s3_classroom');assert.equal((await state()).map,'Classroom');
  await act('s3_teacher');await drain();await act('s3_cat');await drain();assert((await state()).stage3.words.cat);
  await act('s3_incident');await drain();assert((await state()).stage3.incidentSeen);
  fs.mkdirSync('test-artifacts',{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-artifacts/magic-stage3-dark.png'});
  await act('s3_ringo');await drain();await act('s3_tommy');await drain();assert((await state()).stage3.tommyReconciled);
  for(const word of ['class','cat','come']){await act('s3_restore_'+word);await page.locator('#choices').getByRole('button',{name:'C',exact:true}).click();await drain();assert((await state()).stage3.restored[word]);}
  await act('s3_boss');await drain(async()=> (await state()).stage3.boss.round===1);
  await page.reload();await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);assert.equal((await state()).stage3.boss.round,1);
  await act('s3_boss');await drain();assert((await state()).stage3.rescue.completed);assert((await state()).alphabetPieces.includes('C'));
  await act('s3_teacher');await drain();assert((await state()).stage3.completed);
  assert.equal(await page.evaluate(()=>Number(sessionStorage.getItem('c-test-utterances'))),21);
  await act('s3_back');await act('s3_lunch');await drain();assert((await state()).stage3.dHookSeen);
  await page.reload();await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);assert((await state()).stage3.completed);
  assert.equal(await page.evaluate(()=>localStorage.getItem('magic-english-save-v1:guest')),'original-A-B-record');
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-artifacts/magic-stage3-mobile.png'});assert.equal(await page.locator('#central-state-status').count(),0);
  await page.evaluate(()=>{const app=window.__MAGIC_ENGLISH_STAGE1__,s=app.getState();s.map='NextStop';s.x=10;s.y=3;s.facing='up';app.move('up');});await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().map==='SchoolYard');assert((await state()).stage3.completed);
  assert.deepEqual(errors,[]);console.log('PASS: C arrival → 21 utterances → Tommy → three restorations → boss reload/resume → Coco/C → introduction → D; original A/B save preserved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
