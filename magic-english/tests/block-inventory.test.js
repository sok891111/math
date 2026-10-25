import test from 'node:test';
import assert from 'node:assert/strict';
import {createInventory,STARTER_COUNTS,planInventoryEdit,reverseInventoryEdit,applyRewards,normalizeReward,validateInventory,MAX_BALANCE} from '../block-world/inventory.js';
import {VoxelWorld,validateSave,DEFAULT_BAR} from '../block-world/world.js';
import {stickSwingPose} from '../block-world/stick-swing.js';
const seeded=()=>({...createInventory(),counts:{'1':5,'6':5}});
const grant=(id='stage1',quantity=10,userId='child')=>({userId,rewardId:id,blocks:[{blockId:1,quantity}],source:'magic-english',reason:'stage 1'});
test('new inventory starts with zero blocks',()=>{
 const inventory=createInventory();assert.deepEqual(inventory.counts,STARTER_COUNTS);assert.equal(Object.values(inventory.counts).reduce((a,b)=>a+b,0),0);assert.equal(inventory.counts[10],undefined);
});
test('placement consumes stock, cannot go negative, and does not mutate failed transactions',()=>{
 let inventory=seeded();for(let i=0;i<5;i++)inventory=planInventoryEdit(inventory,20000+i,0,1).inventory;assert.equal(inventory.counts[1],0);const before=structuredClone(inventory);assert.throws(()=>planInventoryEdit(inventory,21000,0,1));assert.deepEqual(inventory,before);
});
test('only player-placed blocks refund stock; terrain mining cannot farm rewards',()=>{
 let inventory=seeded();const natural=planInventoryEdit(inventory,10000,1,0);assert.equal(natural.inventory.counts[1],5);const placed=planInventoryEdit(inventory,20000,0,6);inventory=placed.inventory;assert.equal(inventory.counts[6],4);const removed=planInventoryEdit(inventory,20000,6,0);assert.equal(removed.inventory.counts[6],5);assert.equal(removed.inventory.placed[20000],undefined);assert.equal(reverseInventoryEdit(removed.inventory,removed.resource).counts[6],4);
});
test('undo reverses resource deltas without erasing newly delivered rewards',()=>{
 const placed=planInventoryEdit(seeded(),20000,0,1);const rewarded=applyRewards(placed.inventory,[grant()],'child').inventory;const undone=reverseInventoryEdit(rewarded,placed.resource);assert.equal(undone.counts[1],15);assert.equal(Object.keys(undone.receipts).length,1);assert.equal(undone.placed[20000],undefined);
});
test('reward retry is idempotent, conflicting content fails, and user IDs are isolated',()=>{
 const first=applyRewards(createInventory(),[grant()],'child');assert.equal(first.applied,1);assert.equal(first.inventory.counts[1],10);const duplicate=applyRewards(first.inventory,[grant()],'child');assert.equal(duplicate.applied,0);assert.deepEqual(duplicate.inventory,first.inventory);assert.throws(()=>applyRewards(first.inventory,[grant('stage1',11)],'child'));assert.throws(()=>applyRewards(first.inventory,[grant('stage1',10,'other')],'child'));const other=applyRewards(first.inventory,[grant('stage1',10,'other')],'other');assert.equal(other.applied,1);
});
test('reward validation normalizes duplicates and rejects invalid or overflowing batches atomically',()=>{
 const normalized=normalizeReward({...grant(),blocks:[{blockId:6,quantity:1},{blockId:1,quantity:2},{blockId:6,quantity:3}]});assert.deepEqual(normalized.blocks,[{blockId:1,quantity:2},{blockId:6,quantity:4}]);for(const blocks of [[{blockId:32,quantity:1}],[{blockId:1,quantity:0}],[{blockId:1,quantity:1.5}],[{blockId:1,quantity:10001}]])assert.throws(()=>normalizeReward({...grant(),blocks}));const inventory=createInventory();inventory.counts[1]=MAX_BALANCE;assert.throws(()=>applyRewards(inventory,[grant()],'child'));assert.equal(Object.keys(inventory.receipts).length,0);assert.throws(()=>applyRewards(inventory,[grant('ok'),{...grant('bad'),blocks:[]}],'child'));
});
test('finite inventory and provenance survive world saves; legacy builds are preserved',()=>{
 const world=new VoxelWorld('legacy').generate();world.set(64,17,70,6);const legacy=createInventory(null,[...world.edits]);assert.equal(legacy.counts[6],undefined);assert.equal(legacy.placed[world.index(64,17,70)],6);const restored=createInventory(legacy);assert.deepEqual(restored,legacy);const value={format:1,name:'world',terrain:'flat',seed:'legacy',edits:[...world.edits],player:{...world.spawn,yaw:0,pitch:-.5},bar:DEFAULT_BAR,inventory:restored};assert(validateSave(value));value.inventory.placed[123]=1;assert.throws(()=>validateSave(value));assert.throws(()=>validateInventory({version:1,counts:{'1':-1},placed:{},receipts:{}}));
});
test('stick has a broad lateral sweep and returns exactly to its rest pose',()=>{
 const rest=stickSwingPose(0),strike=stickSwingPose(.52),finish=stickSwingPose(1);assert(strike.position[0]<-.35);assert(rest.position[0]-strike.position[0]>.8);assert(Math.abs(strike.rotation[2]-stickSwingPose(.16).rotation[2])>2);assert.deepEqual(rest,finish);
});
