const assert=require('node:assert/strict');const {create,pool}=require('../platformer/progress.js');
let data={};const storage={getItem:k=>data[k],setItem:(k,v)=>{data[k]=v;}};
let seed=29;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
let p=create(storage,rng);const qs=Array.from({length:45},()=>p.nextQuestion());assert.equal(new Set(qs.map(String)).size,45);assert.equal(pool.length,45);assert.ok(qs.every(([a,b])=>a>=1&&a<=9&&b>=1&&b<=9&&a+b>=10&&a+b<=18));assert.notDeepEqual(p.nextQuestion(),qs[44]);
let last=p.nextQuestion();p=create(storage,rng);assert.notDeepEqual(p.nextQuestion(),last,'Reload continues the deck');
for(const kind of Object.keys(p.snapshot().counts)){for(let i=1;i<=6;i++){const badges=p.award(kind);assert.equal(badges.length,[1,3,5].includes(i)?1:0);if(badges.length)assert.equal(badges[0].at,i);}}
assert.equal(p.snapshot().total,54);assert.equal(p.snapshot().badgeCount,27);assert.deepEqual(create(storage).snapshot(),p.snapshot());assert.equal(p.award('unknown').length,0);
const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};assert.equal(create(denied).award('slime').length,1);
const malformed=create({getItem:()=>'{',setItem:()=>{}});assert.equal(malformed.snapshot().total,0);assert.equal(malformed.nextQuestion().length,2);
console.log('PASS: 45-question shuffled deck, no boundary/reload repeat, 1/3/5 milestones for all nine species, persistence, invalid saves and unavailable storage.');
