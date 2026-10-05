const {chromium}=require('playwright');const assert=require('node:assert/strict');
const Progress=require('../platformer/progress.js');
const values={};const storage={getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=v};let progress=Progress.create(storage);
for(let i=0;i<5;i++)progress.award('pig');assert.equal(progress.superJumpState().superCharges,0);progress.lose();assert.equal(progress.superJumpState().superWins,5);progress.award('rabbit');assert.equal(progress.superJumpState().superCharges,1);progress=Progress.create(storage);assert.equal(progress.useSuperJump(),true);assert.equal(progress.useSuperJump(),false);assert.equal(Progress.create(storage).superJumpState().superCharges,0);
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});try{
const page=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/game.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('// Read-only state',`window.featureFixture={
 encounter:()=>{const z=monsters.find(m=>!m.defeated)||monsters[0];Object.assign(z,{kind:'zombie',name:catalog.zombie.name});encounter(z);},
 timeout:()=>{battleDeadline=performance.now()-1;updateBattleTimer();},
 fresh:()=>{loadLevel(currentMap.id);begin();},
 jumpHeight:()=>{const y=player.y;superJump();let top=y;for(let i=0;i<180;i++){step(1/120);top=Math.min(top,player.y);}return y-top;}
};\n// Read-only state`)});});
await page.goto('http://localhost:4173/platformer/');
const population=await page.evaluate(()=>{const sizes=new Set(),kinds=new Set();for(const layout of SunshineMaps.layouts)for(let i=0;i<40;i++){const map=SunshineMaps.build(layout.id),list=MonsterArt.populate(map);sizes.add(list.length);for(const m of list){kinds.add(m.kind);const support=map.platforms[m.supportIndex];if(!support||m.x<support.x||(!MonsterArt.catalog[m.kind].flying&&m.x+MonsterArt.catalog[m.kind].w>support.x+support.w))throw Error('Unsafe spawn');}}return {sizes:[...sizes].sort(),kinds:[...kinds]};});
assert.deepEqual(population.sizes,[5,6,7,8]);for(const k of ['pig','rabbit','fox'])assert.ok(population.kinds.includes(k));
await page.locator('#start').tap();const snap=()=>page.evaluate(()=>sunshine.snapshot());
await page.evaluate(()=>featureFixture.encounter());
const total=await page.locator('.move-block.orange,.move-block.blue').count();
await page.locator('#left-blocks .orange').first().tap();assert.equal((await snap()).movedOrange,1);
await page.locator('#right-blocks .orange').first().tap();assert.equal((await snap()).movedOrange,0);
await page.locator('#right-blocks .blue').first().tap();assert.equal((await snap()).movedBlocks,1);
await page.locator('#left-blocks .blue').first().tap();assert.equal((await snap()).movedBlocks,0);assert.equal(await page.locator('.move-block.orange,.move-block.blue').count(),total);
// Two losses, then a win resets the loss streak. Six real submissions charge once.
for(let i=0;i<2;i++){await page.evaluate(()=>featureFixture.timeout());assert.equal((await snap()).consecutiveLosses,i+1);await page.locator('#continue').tap();await page.evaluate(()=>featureFixture.encounter());}
for(let i=0;i<6;i++){if(i)await page.evaluate(()=>{featureFixture.fresh();featureFixture.encounter();});const s=await snap(),q=s.monsters.find(m=>m.q)?.q;await page.keyboard.type(String(q[0]+q[1]));await page.locator('#submit').tap();assert.equal((await snap()).consecutiveLosses,0);await page.locator('#continue').tap();}
assert.equal((await snap()).progress.superCharges,1);await page.evaluate(()=>featureFixture.fresh());const height=await page.evaluate(()=>featureFixture.jumpHeight());assert.ok(height>250,'Super jump rises at least 250 world pixels');assert.equal((await snap()).progress.superCharges,0);
await page.evaluate(()=>featureFixture.fresh());const map=(await snap()).map.id;
for(let i=0;i<3;i++){await page.evaluate(()=>{featureFixture.encounter();featureFixture.timeout();});if(i<2)await page.locator('#continue').tap();}
assert.equal((await snap()).mode,'tnt');assert.match(await page.locator('#tnt-dialog p').textContent(),/3번 연속/);assert.equal(await page.locator('#quiz').isVisible(),false);await page.locator('#tnt-restart').tap();assert.equal((await snap()).mode,'play');assert.equal((await snap()).map.id,map);assert.equal((await snap()).consecutiveLosses,0);assert.deepEqual(errors,[]);
console.log('PASS: 18 species, safe random 5–8 spawns, bidirectional colored blocks, six-win saved charge, single high jump, loss reset and three-loss TNT restart.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
