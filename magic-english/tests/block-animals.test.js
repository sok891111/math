import test from 'node:test';
import assert from 'node:assert/strict';
import {VoxelWorld,collides,validateSave,DEFAULT_BAR} from '../block-world/world.js';
import {AnimalWorld,ANIMALS} from '../block-world/animals.js';
const player=()=>({x:64.5,y:17.01,z:72.5,yaw:0,pitch:-.35});
function fixture(type='pig'){
 const world=new VoxelWorld('animal-test').generate(),saved={version:1,hostilesInitialized:true,entities:[{id:'test-animal',type,x:64.5,y:17.01,z:70.5,yaw:0,hp:ANIMALS[type].hp,respawn:0,wait:20}]};return {world,animals:new AnimalWorld(world,saved),p:player()};
}
test('default world is flat and spawns pigs, chickens, creepers and zombies on safe ground',()=>{
 const world=new VoxelWorld('default').generate();assert.equal(world.terrain,'flat');for(let x=0;x<128;x+=7)for(let z=0;z<128;z+=7)assert.equal(world.top(x,z),16);
 const animals=new AnimalWorld(world);assert.equal(animals.entities.length,12);for(const type of ['pig','chicken'])assert.equal(animals.entities.filter(a=>a.type===type).length,4);for(const a of animals.entities)assert(!collides(world,a,ANIMALS[a.type].height));
});
test('wandering animals remain in a pen and avoid placed blocks and water',()=>{
 const {world,animals,p}=fixture();for(let y=17;y<=19;y++)for(let n=61;n<=67;n++){world.set(n,y,67,3);world.set(n,y,73,3);world.set(61,y,n+6,3);world.set(67,y,n+6,3);}world.set(64,16,69,11);
 const a=animals.entities[0];a.wait=0;a.walk=3;for(let i=0;i<1200;i++){animals.update(.02,p);assert(!collides(world,a,ANIMALS[a.type].height));assert(a.x>61&&a.x<67&&a.z>67&&a.z<73);assert.notEqual(world.get(Math.floor(a.x),Math.floor(a.y),Math.floor(a.z)),11);}
});
test('stick targeting respects reach and solid walls',()=>{
 const {world,animals,p}=fixture();assert(animals.target(p));world.set(64,17,71,3);world.set(64,18,71,3);assert.equal(animals.target(p),null);assert.equal(animals.attack(p),null);assert.equal(animals.entities[0].hp,3);world.set(64,17,71,0);world.set(64,18,71,0);p.z=78;assert.equal(animals.target(p),null);
});
test('attacks damage and knock back animals without editing any world blocks',()=>{
 for(const type of ['pig','chicken']){const {world,animals,p}=fixture(type),before=[...world.edits],z=animals.entities[0].z;const hit=animals.attack(p);assert(hit);assert.equal(hit.hp,ANIMALS[type].hp-1);assert(animals.entities[0].z<z);assert.deepEqual([...world.edits],before);assert(animals.entities[0].flee>0);}
});
test('defeated animals retain their respawn timer across saves and respawn without duplicates',()=>{
 const {world,animals,p}=fixture();for(let i=0;i<3;i++)assert(animals.attack(p));assert.equal(animals.entities[0].hp,0);assert.equal(animals.entities[0].respawn,12);assert.equal(animals.target(p),null);const restored=new AnimalWorld(world,animals.snapshot());restored.update(10,p);assert.equal(restored.entities[0].hp,0);assert.equal(restored.entities[0].respawn,2);restored.update(2,p);assert.equal(restored.entities[0].hp,3);assert.equal(restored.entities.length,1);assert.equal(restored.entities[0].id,'test-animal');
});
test('animal and tool save fields validate while old files remain compatible',()=>{
 const {world,animals,p}=fixture(),old={format:1,name:'이전 세계',seed:world.seed,terrain:'meadow',edits:[],player:p,bar:[...DEFAULT_BAR]};assert(validateSave(old));const current={...old,tool:'stick',animals:animals.snapshot()};assert(validateSave(current));for(const change of [s=>s.tool='unknown',s=>s.animals.entities[0].type='unknown',s=>s.animals.entities[0].hp=999,s=>s.animals.entities[0].x=NaN,s=>s.animals.entities[0].respawn=-1,s=>s.animals.entities.push({...s.animals.entities[0]})]){const copy=structuredClone(current);change(copy);assert.throws(()=>validateSave(copy));}
});
