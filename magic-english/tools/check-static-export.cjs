const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),target=path.resolve(process.argv[2]||path.join(root,'../../temp/tralalerio-static'));
 const {Game}=await import(pathToFileURL(path.join(root,'engine.js'))),math=await import(pathToFileURL(path.join(root,'math-challenge.js')));
 const model=require('../../creative/battle-model.js'),facto=require('../../creative/facto-puzzles.js');
 const original=JSON.parse(fs.readFileSync(path.join(root,'assets/maps.json'))),data=JSON.parse(fs.readFileSync(path.join(root,'assets/battle-data.json'))),ids=['ElmsLab','NewBarkTown','Route29'];
 const maps=Object.fromEntries(ids.map(id=>[id,structuredClone(original[id])]));for(const m of Object.values(maps))m.connections=m.connections.filter(c=>ids.includes(c.map));
 const fresh=()=>{const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.state.flags.staticWelcome=true;return g;};
 // Engine movement uses exactly the exported map set, with no phantom exits.
 const g=fresh();for(let i=0;i<5;i++)g.move('down');assert.equal(g.state.map,'NewBarkTown');
 g.enter(maps.Route29,0,8);assert.equal(g.move('left').type,'boundary');assert.equal(g.state.map,'Route29');
 assert.equal(new Game(maps,data).restore(JSON.stringify({...JSON.parse(g.serialize()),map:'VioletCity'})),false);
 for(const [name,driver,options]of [['Chrome',chromium,{channel:'chrome'}],['Safari/WebKit',webkit,{}]]){
  const browser=await driver.launch({headless:true,...options});try{
   // WebKit rejects file navigation with offline:true; block every HTTP request instead.
   const context=await browser.newContext({viewport:{width:900,height:1100},reducedMotion:'reduce'}),http=[],errors=[];
   await context.addInitScript(()=>Math.random=()=>0);
   await context.route(/^https?:/,r=>{http.push(r.request().url());return r.abort();});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto(pathToFileURL(path.join(target,'index.html')).href);await page.locator('#loading').waitFor({state:'hidden'});
   assert.equal(await page.locator('#location').textContent(),'공박사 연구소');
   assert.deepEqual(await page.evaluate(async()=>Object.keys(await (await fetch('assets/maps.json')).json())),ids);
   for(let i=0;i<3;i++)await page.locator('#dialog-next').click();
   for(let i=0;i<5;i++){await page.keyboard.press('ArrowDown');await page.waitForTimeout(330);}
   assert.equal(await page.locator('#location').textContent(),'연두마을');
   await page.locator('#save-button').click();await page.reload();await page.locator('#loading').waitFor({state:'hidden'});assert.equal(await page.locator('#location').textContent(),'연두마을');
   await page.locator('#menu-button').click();await page.locator('#map-menu').click();await page.waitForFunction(()=>document.querySelector('#town-map select')?.options.length===2);assert.match(await page.locator('#town-map').innerText(),/29번 도로/);await page.locator('#town-map').getByRole('button',{name:'닫기',exact:true}).click();
   await page.locator('#dex-menu').click();await page.waitForFunction(()=>document.querySelector('#monster-dex').textContent.includes('전체 283종'));await page.keyboard.press('Escape');await page.locator('#close-menu').click();
   async function restore(game){await page.evaluate(raw=>localStorage.setItem('tralalerio-static-route29-v1',raw),game.serialize());await page.reload();await page.locator('#loading').waitFor({state:'hidden'});}
   const lab=fresh();lab.enter(maps.ElmsLab,5,3);lab.state.facing='up';lab.state.party[0].hp=1;await restore(lab);await page.keyboard.press('z');await page.waitForFunction(()=>document.querySelector('#dialog-text').textContent.includes('모두 회복'));assert.ok(await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('tralalerio-static-route29-v1'));return s.flags.staticProfessor&&s.party[0].hp===s.party[0].stats.hp;}));
   // Real input crossing the remaining town -> Route29 connection.
   const town=fresh();town.enter(maps.NewBarkTown,0,8);await restore(town);await page.keyboard.press('ArrowLeft');await page.waitForTimeout(350);assert.equal(await page.locator('#location').textContent(),'29번 도로');
   // Force only the random encounter draw; movement, battle, question and answer UI stay real.
   const grass=fresh();let spot;for(let y=0;y<maps.Route29.height&&!spot;y++)for(let x=1;x<maps.Route29.width;x++)if(maps.Route29.collision[y][x]==='TALL_GRASS'&&grass.maps.Route29.collision[y][x-1]==='FLOOR'){spot={x,y};break;}
   grass.enter(maps.Route29,spot.x-1,spot.y);grass.state.grassGrace=0;await restore(grass);await page.evaluate(()=>Math.random=()=>0);await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>!document.querySelector('#battle-screen').hidden);await page.waitForTimeout(1300);assert.ok(await page.locator('.enemy-mon').evaluate(im=>im.complete&&im.naturalWidth>0));
   const capture=fresh();capture.enter(maps.Route29,spot.x,spot.y);capture.startEncounter('pidgey',3);capture.battle.s.animationPending=false;const challenge=math.requestCapture(capture,model,facto,()=>.4);challenge.type='story_compare';challenge.grade=3;const q=math.questionFor(challenge,model,facto);challenge.input=math.emptyInput(q);await restore(capture);await page.locator('.math-dialog').waitFor({state:'visible'});
   const answer=(q.solution||q.answer)[0];await page.locator('.math-tools button').filter({hasText:new RegExp('^'+answer+'$')}).click();await page.locator('.math-submit').click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('tralalerio-static-route29-v1')).party.some(p=>p.species==='pidgey'));
   await page.waitForFunction(()=>document.querySelector('#battle-screen[aria-busy="false"] .battle-bottom button:not(:disabled)'),{timeout:30000});await page.locator('#battle-screen').getByRole('button',{name:'다음 ▼',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#monster-dex')?.open,{timeout:10000});assert.match(await page.locator('#monster-dex').innerText(),/구구/);await page.getByRole('button',{name:'확인하고 계속하기'}).click();
   await page.waitForTimeout(100);await page.reload();await page.locator('#loading').waitFor({state:'hidden'});assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-static-route29-v1')).party.some(p=>p.species==='pidgey')));
   assert.deepEqual(http,[]);assert.deepEqual(errors,[]);console.log(name+': file:// boot, real lab/town/route movement, blocked exits, save/reload, map/dex, wild encounter, math capture and first-catch introduction PASS (zero HTTP requests)');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
