// Isolated speech mock: never calls paid STT/TTS services or touches real child saves.
const assert=require('node:assert/strict');
const path=require('node:path');
let playwright;try{playwright=require('playwright');}catch{playwright=require(path.resolve(__dirname,'../../block-island/node_modules/playwright'));}
const {chromium,webkit}=playwright;
const base=process.env.MAGIC_TEST_URL||'http://localhost:4188';
(async()=>{for(const [name,type]of [['Chrome',chromium],['WebKit',webkit]]){
 const browser=await type.launch({headless:true,...(name==='Chrome'?{channel:'chrome'}:{})});
 try{
 const page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/welcome-voice',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>{window.__MOCK_SPEECH_RECOGNIZER__=({emitResult,emitError})=>setTimeout(()=>{if(window.failSpeech)emitError('no-speech','');else emitResult(document.querySelector('.me-turn-phrase').textContent);},30);});
 await page.goto(base+'/?user=stage2-browser');await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);
 async function drain(){for(let i=0;i<30;i++){
 if(!await page.locator('#dialog').isVisible())return;
 if(await page.locator('#turn-speak-btn').isVisible()){await page.locator('#turn-speak-btn').click();await page.waitForTimeout(850);}
 else if(await page.locator('#dialog-next').isVisible())await page.locator('#dialog-next').click();
 else return;
 }throw Error('dialog did not finish');}
 async function act(x,y,facing='up'){await page.evaluate(({x,y,facing})=>{const app=window.__MAGIC_ENGLISH_STAGE1__;Object.assign(app.getState(),{x,y,facing});app.act();},{x,y,facing});}
 await drain();await page.evaluate(()=>{const s=window.__MAGIC_ENGLISH_STAGE1__.getState();s.map='AirportHall';s.stage='stage1_complete';s.alphabetPieces=['A'];s.rewardReceipts['stage-1-first-clear']={id:'stage-1-first-clear'};});
 await act(10,2);await drain();assert.equal(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().map),'BusStop');
 await act(4,4);await drain();await act(10,6);await drain();await act(15,4);await drain();
 await act(10,3);await drain();assert.equal(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().map),'BusInterior');
 await act(10,4);await drain();assert(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().stage2.driver));
 await act(10,11,'down');await drain();assert.equal(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().map),'NextStop');
 for(const [word,x]of [['BUS',4],['BAG',9],['BIG',14]]){await act(x,5);for(const letter of word)await page.locator('#choices button').filter({hasText:new RegExp('^'+letter+'$')}).click();await drain();}
 await act(16,10);await drain();assert(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().stage2.fragmentB));
 await act(10,3);await drain();assert(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().stage2.completed));
 await page.reload();await page.waitForFunction(()=>window.__MAGIC_ENGLISH_STAGE1__);assert(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().stage2.completed));
 // Five failed conversations end naturally and the next NPC asks about the microphone.
 await page.evaluate(()=>window.failSpeech=true);
 for(let i=0;i<5;i++){await act(5,9);await drain();}
 assert.equal(await page.evaluate(()=>window.__MAGIC_ENGLISH_STAGE1__.getState().learning.failures),5);
 await act(5,9);assert((await page.locator('#dialog-text').textContent()).includes('너의 목소리가 안 들려'));
 await page.locator('#choices button').first().click();await page.evaluate(()=>window.failSpeech=false);
 await act(5,9);const question=await page.locator('#dialog-text').textContent();await drain();await act(5,9);assert.notEqual(await page.locator('#dialog-text').textContent(),question);await drain();
 assert.deepEqual(errors,[]);console.log(name+': Stage 2 discovery → driver → signs → bag/B → completion → reload; failure streak and varied dialogue passed');
 }finally{await browser.close();}
}})().catch(error=>{console.error(error);process.exitCode=1;});
