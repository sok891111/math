// Real C UI with mock speech/audio/reward transport; never calls paid services or real profiles.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.MAGIC_TEST_URL||'http://localhost:3000';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:850}}),errors=[],claims=[];
  page.on('pageerror',e=>errors.push(e.message));
  const silent=Buffer.alloc(1644);silent.write('RIFF');silent.writeUInt32LE(1636,4);silent.write('WAVEfmt ',8);silent.writeUInt32LE(16,16);silent.writeUInt16LE(1,20);silent.writeUInt16LE(1,22);silent.writeUInt32LE(16000,24);silent.writeUInt32LE(32000,28);silent.writeUInt16LE(2,32);silent.writeUInt16LE(16,34);silent.write('data',36);silent.writeUInt32LE(1600,40);
  await page.route('**/*.mp3*',r=>r.fulfill({status:200,contentType:'audio/wav',body:silent}));
  await page.route('**/api/magic-english/character-voice',()=>{throw Error('All C voices should be pre-recorded');});
  await page.route('**/api/magic-english/rewards',r=>{claims.push(r.request().postDataJSON());return r.fulfill({status:410,body:'{}'});});
  await page.addInitScript(()=>{
   const original=setTimeout;window.setTimeout=(fn,ms,...args)=>original(fn,ms===750?15:ms,...args);
   window.__MOCK_SPEECH_RECOGNIZER__=({emitResult})=>setTimeout(()=>{const text=document.querySelector('.me-turn-phrase').textContent.replace(/[“”]/g,'').trim(),count=Number(sessionStorage.getItem('daily-test-speeches')||0)+1;sessionStorage.setItem('daily-test-speeches',String(count));emitResult(text,{passed:true,quality:'complete',recognizedText:text,message:'문장 전체를 말했어요!'});},5);
  });
  await page.goto(base+'/magic-english/test/stage3');await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);
  await page.evaluate(()=>{const s=window.__MAGIC_ENGLISH_STAGE1__.getState();s.words={};const p=s.stage3;p.words={class:true,cat:true,come:true};p.incidentSeen=true;p.tommyReconciled=true;p.restored={class:true,cat:true,come:true};p.boss={round:3,completed:true};p.rescue={phase:'complete',completed:true};p.fragmentC=true;p.introductionCompleted=true;p.completed=true;p.conversations={class:3,teacher:2,cat:3,come:2,tommy:3,introduction:2};s.alphabetPieces=['A','B','C'];document.querySelector('#save-button').click();});
  const count=()=>page.evaluate(()=>Number(sessionStorage.getItem('daily-test-speeches')||0));
  async function drain(until){for(let i=0;i<220;i++){
   if(until&&await until())return;
   if(!await page.locator('#dialog').isVisible())return;
   if(await page.locator('#turn-speak-btn').isVisible()){if(await page.locator('#turn-speak-btn').isEnabled())await page.locator('#turn-speak-btn').click();}
   else if(await page.locator('#dialog-next').isVisible()&&await page.locator('#dialog-next').isEnabled())await page.locator('#dialog-next').click();
   await page.waitForTimeout(30);
  }throw Error('Daily dialogue did not finish');}
  async function act(id,map){await page.evaluate(async({id,map})=>{const app=window.__MAGIC_ENGLISH_STAGE1__,s=app.getState();if(map)s.map=map;const {stage3Floor}=await import('/magic-english/magic-english-stage3-layout.js');const o=id==='s3_hwalbin'?app.getFollowerState():app.getMapObjects().find(o=>o.id===id);if(!o)throw Error('Missing '+id);const at=[[0,1,'up'],[-1,0,'right'],[1,0,'left'],[0,-1,'down']].find(([dx,dy])=>stage3Floor(s.map,o.x+dx,o.y+dy)&&!app.getMapObjects().some(a=>a.kind==='npc'&&a.x===o.x+dx&&a.y===o.y+dy));if(!at)throw Error('No approach '+id);Object.assign(s,{x:o.x+at[0],y:o.y+at[1],facing:at[2]});app.act();},{id,map});}
  // The CLASS directory remains scenery; class lessons now belong to Amy.
  await page.evaluate(()=>Object.assign(window.__MAGIC_ENGLISH_STAGE1__.getState(),{map:'SchoolHall',x:10,y:8,facing:'up'}));
  for(let i=0;i<3;i++){await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.move('up'));await page.waitForTimeout(280);}
  assert.equal(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().y),6);
  assert(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getMapObjects().every(o=>o.kind!=='investigate')));
  const groups={SchoolYard:['s3_yard_keeper','s3_bus_driver','s3_yard_student','s3_amy'],SchoolHall:['s3_librarian','s3_hall_teacher','s3_hall_nurse','s3_hall_student'],Classroom:['s3_class_lily','s3_class_art','s3_class_helper','s3_class_student','s3_teacher','s3_tommy','s3_ringo','s3_coco_rescued'],CocoRoom:['s3_room_amy','s3_room_monitor','s3_room_caretaker']};
  let expected=0;
  for(const [map,ids]of Object.entries(groups))for(const id of ids){const before=await count();await act(id,map);assert((await page.locator('#speaker').textContent()).length);await drain();const spoken=await count()-before;assert(spoken>=3&&spoken<=5,id+' spoke '+spoken+' turns');expected+=spoken;}
  // Refresh after the first turn of a new daily session. The same topic resumes at turn 2.
  await act('s3_bus_driver','SchoolYard');const before=await count();await drain(async()=>await count()===before+1);await page.reload();await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);await act('s3_bus_driver');await drain(async()=>await page.locator('.me-conversation-progress').isVisible());assert.match(await page.locator('.me-conversation-progress').textContent(),/2 \/ 4/);await drain();expected+=4;
  // The companion uses the same 3–5 turn daily flow in C.
  const beforeFriend=await count();await act('s3_hwalbin');await drain();const friendTurns=await count()-beforeFriend;assert(friendTurns>=3&&friendTurns<=5);expected+=friendTurns;
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().learning.pending.length===0);
  assert.deepEqual(claims,[],'daily practice never sends resource rewards');
  assert.equal(await count(),expected);assert.deepEqual(errors,[]);
  console.log('PASS: all 20 C daily NPC/companion conversations have 3–5 turns; no resource rewards, partial-session reload resumes, and the decorative CLASS stand stops walking without starting a quest.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
