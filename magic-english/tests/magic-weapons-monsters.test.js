import test from 'node:test';import assert from 'node:assert/strict';
import {WEAPONS,weaponReward,validEquipment} from '../block-world/weapons.js';
import {createInventory,applyRewards,validateInventory,rewardSignature,normalizeReward} from '../block-world/inventory.js';
import {VoxelWorld,validateSave,DEFAULT_BAR} from '../block-world/world.js';import {AnimalWorld,ANIMALS} from '../block-world/animals.js';
import {AnimalRenderer} from '../block-world/animal-renderer.js';import * as THREE from '../block-world/vendor/three.module.js';
import {dialogueAction,nextChoiceIndex} from '../dialogue-controls.js';
test('only complete sentences grant one sword and all four tiers have the documented distribution',()=>{
 assert.equal(weaponReward('partial',0),null);assert.equal(weaponReward('unheard',99),null);const counts={};for(let roll=0;roll<100;roll++){const r=weaponReward('complete',roll);assert.equal(r.quantity,1);counts[r.itemId]=(counts[r.itemId]||0)+1;}assert.deepEqual(counts,{wood_sword:45,stone_sword:30,iron_sword:20,diamond_sword:5});
});
test('sword rewards persist atomically with blocks, cannot duplicate and preserve legacy receipts',()=>{
 const old={userId:'child',rewardId:'old',blocks:[{blockId:5,quantity:1}],source:'magic-english',reason:'hello'};
 assert.equal(rewardSignature(normalizeReward(old)),JSON.stringify({blocks:old.blocks,source:old.source,reason:old.reason}));
 const grant={...old,rewardId:'complete',blocks:[{blockId:5,quantity:2}],items:[{itemId:'iron_sword',quantity:1}]};const first=applyRewards(createInventory(),[old,grant],'child');assert.equal(first.inventory.weapons.iron_sword,1);assert.equal(first.inventory.counts[5],3);assert.equal(applyRewards(first.inventory,[grant],'child').applied,0);assert.throws(()=>applyRewards(first.inventory,[{...grant,items:[{itemId:'diamond_sword',quantity:1}]}],'child'));assert(validateInventory(createInventory(first.inventory)));assert(validEquipment('iron_sword',first.inventory));assert(!validEquipment('diamond_sword',first.inventory));
 const world=new VoxelWorld('save-weapon').generate();assert(validateSave({format:1,name:'home',terrain:'flat',seed:world.seed,edits:[],player:{...world.spawn,yaw:0,pitch:0},bar:DEFAULT_BAR,inventory:first.inventory,tool:'iron_sword'}));
});
test('new and legacy worlds spawn both monsters once, preserving old animals and buildings',()=>{
 const world=new VoxelWorld('monsters').generate(),animals=new AnimalWorld(world);assert.equal(animals.entities.filter(a=>a.type==='pig').length,4);assert.equal(animals.entities.filter(a=>a.type==='chicken').length,4);assert.equal(animals.entities.filter(a=>a.type==='creeper').length,2);assert.equal(animals.entities.filter(a=>a.type==='zombie').length,2);
 const legacy={version:1,entities:animals.snapshot().entities.filter(a=>!ANIMALS[a.type].hostile)};const migrated=new AnimalWorld(world,legacy);assert.equal(migrated.entities.length,12);assert.equal(new AnimalWorld(world,migrated.snapshot()).entities.length,12);
});
test('swords deal real tiered damage, zombies approach and creepers puff without changing the world',()=>{
 const world=new VoxelWorld('combat').generate(),animals=new AnimalWorld(world),player={...world.spawn,yaw:0,pitch:0};animals.entities=animals.entities.filter(a=>a.type==='zombie').slice(0,1);const zombie=animals.entities[0];Object.assign(zombie,{x:player.x,y:player.y,z:player.z-2,wait:0});assert.equal(animals.attack(player,WEAPONS.wood_sword.damage).hp,4);Object.assign(zombie,{x:player.x,z:player.z-2});assert(animals.attack(player,WEAPONS.iron_sword.damage).defeated);
 const fresh=new AnimalWorld(world);const z=fresh.entities.find(a=>a.type==='zombie');Object.assign(z,{x:player.x,y:player.y,z:player.z-6,wait:0});const before=z.z;fresh.update(.05,player);assert(z.z>before);
 const creeper=fresh.entities.find(a=>a.type==='creeper');Object.assign(creeper,{x:player.x,y:player.y,z:player.z-1.8,wait:0});const edits=[...world.edits];for(let i=0;i<40;i++)fresh.update(.05,player);assert.equal(creeper.hp,0);assert(fresh.events.some(e=>e.type==='creeper-puff'));assert.deepEqual([...world.edits],edits);
});
test('both block monster models build as distinct meshes without a browser renderer',()=>{
 const renderer=new AnimalRenderer(new THREE.Scene());const a=renderer.create({id:'c',type:'creeper',hp:4}),b=renderer.create({id:'z',type:'zombie',hp:6});assert.equal(a.legs.length,4);assert.equal(b.legs.length,2);assert(a.group.children.length>10);assert(b.group.children.length>5);renderer.clear();
});
test('A advances locked cutscenes, operates Speak without skipping assessment, and confirms choices',()=>{
 assert.equal(dialogueAction({dialog:{type:'npc'},locked:true}),'advance');assert.equal(dialogueAction({dialog:{type:'badge_reveal'},locked:true}),'advance');assert.equal(dialogueAction({dialog:{type:'speak'},locked:true}),'speak');assert.equal(dialogueAction({dialog:{type:'speak'},pending:true}),'wait');assert.equal(dialogueAction({dialog:{type:'speak'},settled:true}),'advance');assert.equal(dialogueAction({dialog:{type:'npc'},choices:true}),'choose');assert.equal(nextChoiceIndex(-1,'right',3),0);assert.equal(nextChoiceIndex(0,'left',3),2);
});

test('an old tab receipt can receive its missing sword once without granting blocks again',()=>{
 const base={userId:'child',rewardId:'live-update',source:'magic-english',reason:'speech',blocks:[{blockId:5,quantity:2}]};const old=applyRewards(createInventory(),[base],'child').inventory;const reward={...base,items:[{itemId:'stone_sword',quantity:1}]};const upgraded=applyRewards(old,[reward],'child');assert.equal(upgraded.inventory.counts[5],2);assert.equal(upgraded.inventory.weapons.stone_sword,1);assert.equal(applyRewards(upgraded.inventory,[reward],'child').applied,0);
});
