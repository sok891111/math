const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'parent-learning-browser-')),base='http://localhost:4197';
fs.cpSync(path.join(root,'.next'),path.join(dir,'.next'),{recursive:true});
for(const name of ['public','node_modules','package.json','next.config.js'])fs.symlinkSync(path.join(root,name),path.join(dir,name));
fs.writeFileSync(path.join(dir,'users.json'),JSON.stringify([{id:'Learn01',name:'배움테스트',createdAt:new Date().toISOString()},{id:'Learn02',name:'다른아이',createdAt:new Date().toISOString()}]));
const server=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','-p','4197'],{cwd:dir,env:{...process.env,SUPABASE_URL:'',SUPABASE_ANON_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',VERCEL:''},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
let browser;
async function waitFor(fn){for(let i=0;i<100;i++){if(await fn())return;await new Promise(r=>setTimeout(r,150));}throw Error('Timed out');}
const endpoint=base+'/api/user/Learn01/learning',headers={'x-admin-secret':'admin'};
const get=async(kind='math',id='Learn01')=>(await fetch(base+'/api/user/'+id+'/learning?kind='+kind,{headers})).json();
(async()=>{try{
 await waitFor(async()=>{try{return(await fetch(base)).ok;}catch{return false;}});
 for(const [userId,parentId,password]of [['Learn01','family-one','parent-first-123'],['Learn02','family-two','parent-other-123']]){const r=await fetch(base+'/api/admin/parents',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({userId,parentId,password})});assert.equal(r.status,200);}
 assert.equal((await fetch(endpoint)).status,401);
 assert.equal((await fetch(endpoint,{headers:{'x-admin-secret':'incorrect'}})).status,401);
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/Learn01/tralalerio');await page.locator('#loading').waitFor({state:'hidden'});await page.waitForFunction(()=>Boolean(window.BlockLearning));
 // Exercise production math UI, generator, answer validation, and tracking together.
 async function mathAttempt(result){
  await page.evaluate(async result=>{
   const [{Game},{requestMath,questionFor},{createMathPuzzleUI},maps,data]=await (window.__mathTestDeps??=Promise.all([import('/tralalerio/engine.js'),import('/tralalerio/math-challenge.js'),import('/tralalerio/math-puzzle-ui.js'),fetch('/tralalerio/assets/maps.json').then(r=>r.json()),fetch('/tralalerio/assets/battle-data.json').then(r=>r.json())]));
   const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter('mc_zombie',3);g.battle.s.animationPending=false;
   const c=requestMath(g,0,window.CreativeBattle,window.FactoPuzzles,()=>.4),q=questionFor(c,window.CreativeBattle,window.FactoPuzzles);
   c.input=result==='correct'?(q.solution||q.answer).slice():[0];c.hints=1;
   window.__learningMathUI=createMathPuzzleUI({getGame:()=>g,onSave(){},onSolved(){}});window.__learningMathUI.open();
  },result);
  if(result==='skipped')await page.locator('.math-dialog[open] .math-back').click();else await page.locator('.math-dialog[open] .math-submit').click();
  await page.waitForFunction(()=>!document.querySelector('.math-dialog[open]'));
 }
 await mathAttempt('correct');await mathAttempt('incorrect');await mathAttempt('skipped');
 await waitFor(async()=> (await get()).total===3);console.log('PASS actual math correct/wrong/skip');
 let math=await get();assert.equal(math.summary.math.correct,1);assert.equal(math.summary.math.incorrect,1);assert.equal(math.summary.math.skipped,1);assert(math.history.every(e=>e.question.operands?.length===2&&e.hints===1));
 // Offline attempts persist in the browser and replay exactly once after reconnect.
 await context.route('**/api/user/Learn01/learning',route=>route.abort());await mathAttempt('correct');assert(await page.evaluate(()=>window.BlockLearning.pendingCount())>0);
 await context.unroute('**/api/user/Learn01/learning');await page.evaluate(()=>window.BlockLearning.flush());await waitFor(async()=> (await get()).total===4);await page.evaluate(()=>window.BlockLearning.flush());assert.equal((await get()).total,4);
 console.log('PASS offline replay without duplicates');
 // Production recognizer, using mocked microphone results rather than paid STT.
 await page.goto(base+'/Learn01/magic-english');await page.waitForFunction(()=>Boolean(window.BlockLearning));
 await page.evaluate(async()=>{
  const {createSpeechRecognizer}=await import('/magic-english/magic-english-speech.js');
  window.__MOCK_SPEECH_RECOGNIZER__=({emitResult})=>queueMicrotask(()=>emitResult('I want an apple.',{passed:true,quality:'complete',recognizedText:'I want an apple.'}));
  const r=createSpeechRecognizer();await r.start({target:'apple',targetPhrase:'I want an apple.',attemptId:crypto.randomUUID()});
  await new Promise(resolve=>setTimeout(resolve,10));
  window.__MOCK_SPEECH_RECOGNIZER__=({emitResult})=>queueMicrotask(()=>emitResult('I want a bus.',{passed:false,quality:'unheard',recognizedText:'I want a bus.'}));
  await r.start({target:'apple',targetPhrase:'I want an apple.',attemptId:crypto.randomUUID()});
 });
 await waitFor(async()=> (await get('speech')).total===2);const speech=await get('speech');assert.equal(speech.summary.speech.complete,1);assert.equal(speech.summary.speech.retry,1);assert(speech.history.some(e=>e.transcript==='I want a bus.'));
 console.log('PASS speech recognizer attempts');
 // Exercise the Minecraft monster conversation UI with the same recognizer.
 await page.goto(base+'/magic-english/block-world?user=Learn01');await page.waitForFunction(()=>Boolean(window.BlockLearning));
 await page.evaluate(async()=>{
  const [{createMobConversationUI},{newMobLearning,enqueueMobConversation,mobScript,mobPractice}]=await Promise.all([import('/magic-english/block-world/mob-conversation-ui.js'),import('/magic-english/block-world/mob-conversations.js')]);
  let learning=newMobLearning();enqueueMobConversation(learning,'zombie','fixture-zombie');const target=mobScript(learning.queue[0].script).rows[0].target,phrase=mobPractice(target).text;
  window.__MOCK_SPEECH_RECOGNIZER__=({emitResult})=>queueMicrotask(()=>emitResult(phrase,{passed:true,quality:'complete',recognizedText:phrase}));
  const ui=createMobConversationUI({profile:'Learn01',getLearning:()=>learning,saveLearning:next=>{learning=next;return true;},onResume(){},onReturn(){}});ui.show();ui.root.hidden=false;ui.root.querySelector('#mob-talk-speak').click();
 });
 await waitFor(async()=> (await get('speech')).total===3);assert((await get('speech')).history.some(e=>e.game==='magic-english-world'&&e.phrase==='Good morning!'));
 console.log('PASS actual Minecraft monster Speak tagged by source');
 // A separate child has no leaked history.
 assert.equal((await get('math','Learn02')).total,0);
 // Actual usage heartbeat; hidden tab time is excluded.
 await page.waitForTimeout(16000);await waitFor(async()=> (await get()).summary.usage['magic-english-world']>=15);
 const hidden=await context.newPage();assert.equal((await hidden.goto(base+'/Learn01/parent')).status(),200);await hidden.bringToFront();const before=(await get()).summary.usage['magic-english-world'];await page.waitForTimeout(2500);assert.equal((await get()).summary.usage['magic-english-world'],before);
 // Parent authentication and full data → API → dashboard → history flow.
 await hidden.getByLabel('부모 로그인 ID').fill('family-one');await hidden.getByLabel('부모 비밀번호',{exact:true}).fill('parent-first-123');await hidden.getByRole('button',{name:'부모 페이지 열기',exact:true}).click();await hidden.getByRole('heading',{name:'배움테스트의 배움 기록'}).waitFor();
 assert(await hidden.getByText('전체 사용 시간',{exact:true}).isVisible());
 await hidden.getByRole('button',{name:'수학 전체 이력',exact:true}).click();await hidden.getByText('조건에 맞는 기록 4건 · 최신순',{exact:true}).waitFor();
 await hidden.getByText('문제와 답안 자세히 보기',{exact:true}).first().click();assert(await hidden.getByText('아이의 답',{exact:true}).first().isVisible());
 console.log('PASS parent login and math history');
 await hidden.getByRole('button',{name:'영어 전체 이력',exact:true}).click();await hidden.getByText('조건에 맞는 기록 3건 · 최신순',{exact:true}).waitFor();assert(await hidden.getByText('I want a bus.',{exact:true}).isVisible());
 await hidden.getByLabel('결과',{exact:true}).selectOption('complete');await hidden.getByText('조건에 맞는 기록 2건 · 최신순',{exact:true}).waitFor();
 await hidden.getByLabel('말한 장소',{exact:true}).selectOption('magic-english-world');await hidden.getByText('조건에 맞는 기록 1건 · 최신순',{exact:true}).waitFor();assert(await hidden.getByRole('heading',{name:'Good morning!',exact:true}).isVisible());
 await hidden.getByRole('button',{name:'마인크래프트 플레이',exact:true}).click();await hidden.getByText('마인크래프트 플레이 이력',{exact:true}).waitFor();assert(await hidden.getByText(/영어 Speak 1회/).isVisible());
 assert.equal((await context.request.get(base+'/api/user/Learn02/learning')).status(),401);
 await hidden.getByRole('button',{name:'전체 게임 금지',exact:true}).click();await hidden.getByRole('button',{name:'전체 게임 허용',exact:true}).waitFor();
 await page.waitForURL('**/Learn01/paused',{timeout:20000});assert(await page.getByRole('heading',{name:'지금은 게임을 쉬는 시간이에요'}).isVisible());
 for(const game of ['tralalerio','magic-english','platformer','island','creative','hanja']){const r=await fetch(base+'/Learn01/'+game,{redirect:'manual'});assert.equal(r.status,307,game);assert(r.headers.get('location').endsWith('/Learn01/paused'));}
 const raw=await context.request.get(base+'/tralalerio/index.html',{maxRedirects:0});assert.equal(raw.status(),307);
 assert.equal((await fetch(base+'/magic-english/block-world?user=Learn01',{redirect:'manual'})).status,307);
 assert.equal((await get()).summary.math.total,4);assert.equal((await fetch(base+'/api/magic-english/assess-pronunciation?word=apple&userId=Learn01',{method:'POST',body:Buffer.alloc(1200)})).status,403);
 console.log('PASS family-scoped auth, all game route blocks, Minecraft static bypass and open-game pause');
 await hidden.getByRole('button',{name:'전체 게임 허용',exact:true}).click();await hidden.getByRole('button',{name:'전체 게임 금지',exact:true}).waitFor();assert.equal((await fetch(base+'/Learn01/tralalerio',{redirect:'manual'})).status,200);
 const previous=await browser.newContext();assert.equal((await previous.request.post(base+'/api/user/Learn01/parent',{data:{action:'login',parentId:'family-one',password:'parent-first-123'}})).status(),200);
 await hidden.getByText('부모 비밀번호 변경',{exact:true}).click();await hidden.getByLabel('현재 비밀번호',{exact:true}).fill('parent-first-123');await hidden.getByLabel('새 비밀번호',{exact:true}).fill('parent-changed-456');await hidden.getByLabel('새 비밀번호 확인',{exact:true}).fill('parent-changed-456');await hidden.getByRole('button',{name:'비밀번호 변경',exact:true}).click();await hidden.getByText('부모 비밀번호를 변경했습니다. 다른 기기의 부모 로그인은 해제됩니다.',{exact:true}).waitFor();assert.equal((await previous.request.get(endpoint)).status(),401);await previous.close();
 await hidden.getByRole('button',{name:'대시보드',exact:true}).click();await hidden.getByText('전체 사용 시간',{exact:true}).waitFor();
 fs.mkdirSync(path.join(root,'test-artifacts'),{recursive:true});await hidden.screenshot({path:path.join(root,'test-artifacts/parent-dashboard-desktop.png'),fullPage:true});
 await hidden.setViewportSize({width:390,height:844});await hidden.reload();await hidden.getByText('전체 사용 시간',{exact:true}).waitFor();await hidden.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));assert(await hidden.getByRole('heading',{name:'배움테스트의 배움 기록'}).evaluate(el=>el.getBoundingClientRect().top<0));await hidden.screenshot({path:path.join(root,'test-artifacts/parent-dashboard-mobile-bottom.png')});await hidden.evaluate(()=>window.scrollTo(0,0));await hidden.screenshot({path:path.join(root,'test-artifacts/parent-dashboard-mobile.png'),fullPage:true});assert(await hidden.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS parent auth, actual math UI (correct/wrong/skip), real recognizer hook, offline deduplication, child isolation, usage, parent dashboard/history/filter and mobile layout.');
 }catch(error){console.error(logs);throw error;}finally{if(browser)await browser.close();server.kill();await new Promise(resolve=>server.once('exit',resolve));fs.rmSync(dir,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
