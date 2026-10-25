import test from 'node:test';import assert from 'node:assert/strict';
import {createInventory,applyRewards,validateInventory,planInventoryEdit} from '../block-world/inventory.js';
import {tickHearts,spendHearts,rewardHearts} from '../block-world/hearts.js';
import {isNight,advanceTime} from '../block-world/day-night.js';
import {VoxelWorld} from '../block-world/world.js';import {AnimalWorld} from '../block-world/animals.js';
const reward=(id,quantity)=>({userId:'child',rewardId:id,blocks:[{blockId:5,quantity}]});
test('new and legacy inventories start without free hearts; rewards grant half as many hearts exactly once',()=>{
 let stock=createInventory();assert.equal(stock.hearts,0);stock=applyRewards(stock,[reward('speech',2)],'child').inventory;assert.equal(stock.hearts,1);assert.equal(stock.counts[5],2);
 stock=applyRewards(stock,[reward('speech',2)],'child').inventory;assert.equal(stock.hearts,1);
 stock=applyRewards(stock,[{...reward('clear',5),blocks:[{blockId:5,quantity:5},{blockId:2,quantity:5},{blockId:33,quantity:5}]}],'child').inventory;assert.equal(stock.hearts,8.5);
 const {hearts,heartElapsed,...legacy}=stock;assert.equal(createInventory(legacy).hearts,0);assert.equal(applyRewards(createInventory(legacy),[reward('speech',2)],'child').inventory.hearts,0);
});
test('20 seconds consumes one heart; fractional time persists and pausing does not charge',()=>{
 let stock={...createInventory(),hearts:3};stock=tickHearts(stock,19.9);assert.equal(stock.hearts,3);stock=createInventory(JSON.parse(JSON.stringify(stock)));stock=tickHearts(stock,.1);assert.equal(stock.hearts,2);assert.equal(tickHearts(stock,100,false),stock);stock=tickHearts(stock,500);assert.equal(stock.hearts,0);assert.equal(stock.heartElapsed,0);assert.equal(tickHearts(stock,30),stock);
});
test('damage shares the same heart pool; building and refunds do not create hearts',()=>{
 let stock=applyRewards(createInventory(),[reward('s',4)],'child').inventory;stock=planInventoryEdit(stock,10,0,5).inventory;assert.equal(stock.hearts,2);stock=spendHearts(stock,1);assert.equal(stock.hearts,1);stock=spendHearts(stock,2);assert.equal(stock.hearts,0);assert.throws(()=>validateInventory({...stock,hearts:-1}));assert.throws(()=>validateInventory({...stock,heartElapsed:20}));
});
test('day and night each last three minutes',()=>{assert(!isNight(0));assert(!isNight(advanceTime(0,179)));assert(isNight(advanceTime(0,180)));assert(isNight(advanceTime(0,359)));assert(!isNight(advanceTime(0,360)));});
test('zombies damage nearby players with a cooldown, but not during daytime',()=>{
 const world=new VoxelWorld('heart-zombie').generate(),p={...world.spawn};const mobs=new AnimalWorld(world,{version:1,hostilesInitialized:true,entities:[{id:'z',type:'zombie',x:p.x,y:p.y,z:p.z-1.2,yaw:0,hp:6,wait:0,respawn:0}]});mobs.update(.1,p,{night:true});assert.equal(mobs.events.filter(e=>e.type==='player-hit').length,1);mobs.update(.1,p,{night:true});assert.equal(mobs.events.length,1);mobs.update(2,p,{night:true});assert.equal(mobs.events.length,2);mobs.update(3,p,{night:false});assert.equal(mobs.events.length,2);
});
test('creeper bursts carry heart damage without editing blocks',()=>{
 const world=new VoxelWorld('heart-creeper').generate(),p={...world.spawn};const mobs=new AnimalWorld(world,{version:1,hostilesInitialized:true,entities:[{id:'c',type:'creeper',x:p.x,y:p.y,z:p.z-1.2,yaw:0,hp:4,wait:0,respawn:0}]});const before=[...world.edits];mobs.update(2,p,{night:true});assert.equal(mobs.events[0].damage,2);assert.equal(mobs.events[0].type,'creeper-puff');assert.deepEqual([...world.edits],before);
});

test('reward reduction preserves existing balances and applies exact halves to speech, fragments and clears',()=>{
 const saved={...createInventory(),hearts:12.5};const stock=createInventory(JSON.parse(JSON.stringify(saved)));assert.equal(stock.hearts,12.5);assert.equal(rewardHearts(reward('partial',1)),.5);assert.equal(rewardHearts(reward('complete',2)),1);assert.equal(rewardHearts(reward('clear',15)),7.5);const once=applyRewards(stock,[reward('new',1)],'child').inventory;assert.equal(once.hearts,13);assert.equal(once.counts[5],1);assert.equal(applyRewards(once,[reward('new',1)],'child').inventory.hearts,13);
});
