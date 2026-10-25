import test from 'node:test';import assert from 'node:assert/strict';
import {mobDrops,collectLoot} from '../block-world/loot.js';import {createInventory} from '../block-world/inventory.js';
import {VoxelWorld} from '../block-world/world.js';import {AnimalWorld} from '../block-world/animals.js';
test('adult pigs drop 1–3 porkchops; chickens drop raw chicken and 0–2 feathers',()=>{for(const r of [0,.4,.99]){assert.deepEqual(mobDrops('pig',()=>r),[{itemId:'raw_porkchop',quantity:1+Math.floor(r*3)}]);assert.equal(mobDrops('chicken',()=>r)[0].itemId,'raw_chicken');}});
test('creeper powder is 0–2; zombie rare roll is 2.5% with three equally likely items',()=>{
 assert.deepEqual(mobDrops('creeper',()=>0),[]);assert.deepEqual(mobDrops('creeper',()=>.99),[{itemId:'gunpowder',quantity:2}]);
 for(const [r,id]of [[0,'iron_ingot'],[.4,'carrot'],[.99,'potato']]){const rolls=[.99,.0249,r];assert.deepEqual(mobDrops('zombie',()=>rolls.shift()),[{itemId:'rotten_flesh',quantity:2},{itemId:id,quantity:1}]);}
 const rolls=[0,.025];assert.deepEqual(mobDrops('zombie',()=>rolls.shift()),[]);
});
test('all current mobs award loot only once on defeat and preserve it in inventory without restoring hearts',()=>{
 for(const type of ['pig','chicken','zombie','creeper']){const world=new VoxelWorld('loot-'+type).generate(),p={...world.spawn,yaw:0,pitch:-.4};const mobs=new AnimalWorld(world,{version:1,hostilesInitialized:true,entities:[{id:'mob',type,x:p.x,y:p.y,z:p.z-2,yaw:0,hp:1,wait:1,respawn:0}]});const hit=mobs.attack(p,6);assert(hit.defeated);assert(Array.isArray(hit.drops));const stock=collectLoot(createInventory(),hit.drops);assert.deepEqual(createInventory(stock).loot,stock.loot);assert.equal(stock.hearts,0);assert.equal(mobs.attack(p,6),null);}
});
