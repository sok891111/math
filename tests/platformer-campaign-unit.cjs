const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../platformer/campaign.js'),Maps=require('../platformer/maps.js');
const values={},store={getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=v};
let seed=25,now=100000;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
let c=C.create(store,random,()=>now);
const finishSix=()=>{for(let i=1;i<=6;i++){assert.equal(c.snapshot().stage,i);assert.equal(c.finishStage(),true);assert.equal(c.finishStage(),false);assert.equal(c.continueAfterStage(),i===6?'test':'stage');}assert.equal(c.snapshot().awaitingTest,true);};
const solve=(correct)=>{const qs=c.snapshot().exam.questions;for(let i=0;i<15;i++)assert.equal(c.submitTest(i<correct?C.solution(qs[i]):99),true);};
assert.equal(c.startTest(),false);assert.equal(c.advanceLevel(),false);
c.updateRewards({score:777,collected:42,weapon:'sword'});finishSix();
c.startTest();assert.equal(c.snapshot().exam.questions.length,15);assert.equal(c.snapshot().test.remainingMs,C.TEST_MS);assert.equal(new Set(c.snapshot().exam.questions.map(q=>`${q.a}${q.operator}${q.b}`)).size,15);
now+=1234;c=C.create(store,random,()=>now);assert.equal(c.snapshot().test.remainingMs,C.TEST_MS-1234);assert.equal(c.restart(),false);assert.equal(c.continueAfterStage(),false);
solve(10);assert.equal(c.snapshot().test.passed,false);assert.equal(c.advanceLevel(),false);assert.equal(c.submitTest(12),false);
c.startTest(true);assert.equal(c.snapshot().test.previousCorrect,10);solve(11);assert.equal(c.snapshot().test.passed,true);assert.equal(c.advanceLevel(),true);assert.equal(c.advanceLevel(),false);
assert.equal(c.snapshot().level,2);assert.equal(c.snapshot().stage,1);assert.deepEqual(c.snapshot().rewards,{score:777,collected:42,weapon:'sword'});
finishSix();c.startTest();assert.equal(c.snapshot().exam.questions.filter(q=>q.operator==='×').length,5);
const qs=c.snapshot().exam.questions;for(let i=0;i<11;i++)c.submitTest(C.solution(qs[i]));now+=C.TEST_MS;
assert.equal(c.snapshot().test.reason,'time');assert.equal(c.snapshot().test.correct,11);assert.equal(c.snapshot().test.passed,false,'Incomplete test fails even with 11 correct');assert.equal(c.advanceLevel(),false);
c.startTest(true);now+=C.TEST_MS;assert.equal(c.submitTest(12),false,'Exact deadline rejects answers');assert.equal(c.snapshot().test.answered,0);
c.startTest(true);solve(15);assert.equal(c.advanceLevel(),true);finishSix();c.startTest();solve(11);assert.equal(c.advanceLevel(),true);assert.equal(c.snapshot().level,1);assert.equal(c.snapshot().cycle,2);assert.deepEqual(c.snapshot().rewards,{score:777,collected:42,weapon:'sword'});
const scope={window:{}};vm.runInNewContext(fs.readFileSync('platformer/monsters.js','utf8'),scope);const art=scope.window.MonsterArt;
for(const def of C.levels){
 for(const operator of ['+','×'])for(const q of C.pool(def.id,operator)){if(operator==='+')assert.ok(C.solution(q)>=def.sum[0]&&C.solution(q)<=def.sum[1]);else assert.ok(q.a<= (def.id===1?2:def.id===2?3:5)&&q.b<= (def.id===1?3:def.id===2?5:9));}
 for(const map of Maps.layouts)for(let i=0;i<20;i++){
  const spawns=art.populate(Maps.build(map.id),random,{allowedKinds:def.monsters,windUnlocked:i%2===0});
  assert.ok(spawns.length>=5&&spawns.length<=8);assert.ok(spawns.every(z=>def.monsters.includes(z.kind)||(i%2===0&&z.kind==='breeze')));
  if(def.id===3)assert.ok(spawns.some(z=>art.catalog[z.kind].elite));
 }
}
assert.equal(C.create({getItem(){throw Error('no storage');},setItem(){throw Error('no storage');}}).snapshot().level,1);
assert.equal(C.create({getItem:()=>JSON.stringify({level:20,stage:-1,cycle:NaN,exam:{}}),setItem(){}}).snapshot().level,1);
console.log('PASS: three curricula, 720 populations, six-stage gates, unique 15-question tests, 10/11 pass boundary, incomplete/deadline failure, retry and reload, exact-once advance, final-level wrap and preserved rewards.');
