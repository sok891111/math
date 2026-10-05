const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {chromium}=require('playwright');
const P=require('../platformer/progress.js'),Maps=require('../platformer/maps.js');
let seed=67;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const data={},storage={getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=v};
const progress=P.create(storage,random),scope={window:{}};
vm.runInNewContext(fs.readFileSync('platformer/monsters.js','utf8'),scope);
const Art=scope.window.MonsterArt;
for(const kind of P.eliteKinds){
 const sums=new Set();let last;
 for(let i=0;i<3000;i++){const q=progress.nextQuestion(kind);assert.ok(q.every(n=>n>=10&&n<=40));assert.ok(q[0]+q[1]>=30&&q[0]+q[1]<=50);assert.notDeepEqual(q,last);last=q;sums.add(q[0]+q[1]);}
 assert.equal(sums.size,21);assert.equal(Art.catalog[kind].math,'hard');assert.ok(P.treasures[kind]);
 assert.ok(progress.award(kind).some(b=>b.id===kind+'-1'));
 assert.ok(progress.claim({id:kind,kind,gems:4}));assert.equal(progress.claim({id:kind,kind,gems:4}),null);
}
assert.deepEqual(P.create(storage).snapshot(),progress.snapshot());
for(const layout of Maps.layouts)for(let i=0;i<50;i++){
 const m=Maps.build(layout.id),spawns=Art.populate(m,random,{windUnlocked:true});
 assert.ok(spawns.length>=5&&spawns.length<=8);assert.ok(spawns.some(z=>P.eliteKinds.includes(z.kind)));
 assert.equal(spawns.filter(z=>z.kind==='breeze').length,1);assert.equal(new Set(spawns.map(z=>z.kind)).size,spawns.length);
 for(const z of spawns.filter(z=>!Art.catalog[z.kind].flying)){const p=m.platforms[z.supportIndex];assert.ok(z.x>=p.x&&z.x+Art.catalog[z.kind].w<=p.x+p.w);}
}
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('// Read-only state',`window.eliteFixture={
 open(kind,q){if($('quiz').open)closeQuiz();loadLevel('meadow');begin();const z=monsters[0];Object.assign(z,{kind,name:catalog[kind].name});encounter(z);if(q){z.q=q;$('a').textContent=q[0];$('b').textContent=q[1];renderBlocks();}},
 gather(){closeQuiz();collectDrop(drops[0]);},
 stack(){for(let i=0;i<40;i++)moveBlock('left','orange');return {capacity:trayCapacity(),count:document.querySelectorAll('#right-blocks .move-block.orange,#right-blocks .move-block.blue').length};}
};\n// Read-only state`)});});
 await page.goto('http://localhost:4173/platformer/');
 for(const viewport of [{width:1024,height:900},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  for(const kind of P.eliteKinds){
   await page.evaluate(k=>eliteFixture.open(k,[40,10]),kind);
   const s=await page.evaluate(()=>sunshine.snapshot());assert.equal(s.battle.durationMs,30000);assert.equal(await page.locator('#operator').textContent(),'+');
   assert.equal(await page.locator('.move-block.orange,.move-block.blue').count(),50);
   assert.deepEqual(await page.evaluate(()=>eliteFixture.stack()),{capacity:50,count:50});
   assert.equal(await page.locator('#right-blocks .ten-block-group').count(),5);
   await page.locator('#reset-blocks').click();
   const opaque=await page.locator('#monster-portrait').evaluate(c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).filter((v,i)=>i%4===3&&v).length);assert.ok(opaque>300,kind+' portrait drawn');
   await page.keyboard.type('49');await page.locator('#submit').click();assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.outcome),'pending');
   await page.keyboard.type('50');await page.locator('#submit').click();assert.equal(await page.evaluate(()=>sunshine.snapshot().battle.outcome),'won');
   const won=await page.evaluate(()=>sunshine.snapshot());assert.ok(won.collection.find(b=>b.id===kind+'-1').earned);assert.equal(won.drops.length,1);assert.equal(won.drops[0].kind,kind);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
 }
 await page.setViewportSize({width:1024,height:900});await page.evaluate(()=>eliteFixture.open('wither',[27,23]));await page.screenshot({path:'test-artifacts/elite-wither-addition.png'});
 await page.keyboard.type('50');await page.locator('#submit').click();await page.evaluate(()=>eliteFixture.gather());assert.ok(await page.evaluate(()=>sunshine.snapshot().progress.relics.wither>0));
 await page.reload();assert.ok(await page.evaluate(()=>sunshine.snapshot().progress.counts.wither>=4));assert.ok(await page.evaluate(()=>sunshine.snapshot().progress.relics.wither>0));
 assert.deepEqual(errors,[]);console.log('PASS: five elite mobs, sums 30–50 including boundaries, 600 stage populations, 30-second quizzes, 50-block movement, portraits, wrong/correct answers, badges and treasure persistence across three viewports.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
