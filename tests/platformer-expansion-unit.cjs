const assert=require('node:assert/strict');
const maps=require('../platformer/maps.js'),progress=require('../platformer/progress.js');
const memory=()=>{const values={};return {getItem:k=>values[k]||null,setItem:(k,v)=>{values[k]=v;}};};
let seed=41;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const store=memory();let pick=maps.createPicker(store,random);let last;
for(let round=0;round<4;round++){const batch=[];for(let i=0;i<maps.layouts.length;i++){if(i===3)pick=maps.createPicker(store,random);const m=pick();assert.notEqual(m.id,last);last=m.id;batch.push(m.id);for(const x of m.spawns){const g=m.platforms.find(p=>p.ground&&x>=p.x&&x<p.x+p.w);assert.ok(g&&x-g.x>=45&&g.x+g.w-x>=100,'Patrol must stay on safe ground');}const floors=m.platforms.filter(p=>p.ground);for(let j=1;j<floors.length;j++){assert.ok(floors[j].x-(floors[j-1].x+floors[j-1].w)<=90);assert.ok(Math.abs(floors[j].y-floors[j-1].y)<=48);}assert.ok(floors.some(p=>m.length-190>=p.x&&m.length-190<p.x+p.w));}assert.equal(new Set(batch).size,maps.layouts.length);}
assert.equal(new Set(maps.layouts.map(m=>JSON.stringify(m.ground))).size,maps.layouts.length);
const saved=memory();saved.setItem('seonyul-sunshine-progress-v1',JSON.stringify({counts:{zombie:5,slime:3},bag:[[8,7],[9,3]],last:[7,6]}));let p=progress.create(saved,random);
assert.equal(p.snapshot().total,8);for(const id of ['zombie-1','zombie-3','zombie-5','slime-1','slime-3'])assert.ok(p.collection().find(b=>b.id===id).earned);assert.equal(p.snapshot().newCount,0);
const qs=Array.from({length:47},()=>p.nextQuestion());assert.equal(new Set(qs.slice(2).map(String)).size,45);assert.ok(qs.every(([a,b])=>a>=1&&a<=9&&b>=1&&b<=9&&a+b>=10));assert.notDeepEqual(p.nextQuestion(),qs.at(-1));
const before=p.snapshot();p.lose();assert.equal(p.snapshot().total,before.total);assert.equal(p.snapshot().stats.chests,0);assert.equal(p.snapshot().stats.gems,0);
const won=p.award('creeper',{elapsedMs:3000,perfect:true,tenFrame:true,mapId:'river'});assert.ok(won.some(b=>b.id==='creeper-1'));assert.ok(won.some(b=>b.id==='speed-1'));assert.equal(p.snapshot().stats.gems,0,'Win must not credit uncollected loot');
const drop={id:'unique-drop',kind:'creeper',gems:6};assert.ok(p.claim(drop));assert.equal(p.snapshot().stats.gems,6);assert.equal(p.claim(drop),null);p=progress.create(saved,random);assert.equal(p.claim(drop),null,'Claim must remain idempotent after reload');assert.equal(p.snapshot().relics.creeper,1);assert.equal(p.snapshot().stats.gems,6);
assert.equal(p.equip('ghast-20'),false);assert.equal(p.equip('creeper-1'),true);assert.equal(progress.create(saved).snapshot().equipped,'creeper-1');
for(const kind of Object.keys(progress.names))for(let i=0;i<20;i++){p.award(kind,{elapsedMs:2000,perfect:true,tenFrame:true,mapId:maps.layouts[i%6].id});p.claim({id:kind+'-'+i,kind,gems:6});}
for(let i=0;i<5;i++)p.clear(3,3);assert.equal(p.snapshot().badgeCount,progress.badges.length);assert.equal(p.snapshot().badgeTotal,progress.badges.length);assert.equal(p.collection().filter(b=>b.earned).length,progress.badges.length);
p.lose();assert.equal(p.snapshot().stats.streak,0);const unlocked=p.award('zombie');assert.equal(unlocked.length,0,'Earned badges must not be awarded again');assert.deepEqual(progress.create(saved).snapshot(),p.snapshot());
const denied={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.ok(progress.create(denied).award('slime').length);assert.ok(maps.createPicker(denied)().id);
console.log('PASS: map deck persistence, safe terrain/patrol bounds, old-save migration, shuffled questions, all badge conditions, exact-once loot, equip/persistence, no loss reward.');
