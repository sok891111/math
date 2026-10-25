import test from 'node:test';
import assert from 'node:assert/strict';
import {VoxelWorld,BLOCKS,SIZE,HEIGHT,DEFAULT_BAR,raycast,collides,movePlayer,intersectsPlayer,validateSave} from '../block-world/world.js';
import {EasyControls,EditHistory,groundPlayer,easyTarget} from '../block-world/easy-controls.js';

test('seeded terrain is reproducible and includes bedrock, a safe spawn and water',()=>{
 const a=new VoxelWorld('regression','meadow').generate(),b=new VoxelWorld('regression','meadow').generate();assert.deepEqual(a.data,b.data);assert.equal(a.data.length,SIZE*SIZE*HEIGHT);assert.equal(a.get(64,0,64),32);assert.equal(collides(a,a.spawn),false);assert(a.data.includes(11));assert(a.data.includes(5));assert.equal(a.edits.size,0);
 const c=new VoxelWorld('different','meadow').generate();assert.notDeepEqual(a.data,c.data);
});
test('edits include removals and rebuild the neighboring chunk at seams',()=>{
 const a=new VoxelWorld('flat','flat').generate();a.dirty.clear();a.set(15,16,15,0);assert(a.dirty.has('0,0'));assert(a.dirty.has('1,0'));assert(a.dirty.has('0,1'));const b=new VoxelWorld('flat','flat').generate();b.applyEdits([...a.edits]);assert.equal(b.get(15,16,15),0);assert.deepEqual(b.data,a.data);assert.equal(a.set(-1,4,5,1),false);assert.equal(a.set(1,4,5,999),false);
});
test('voxel raycast returns the correct face, skips liquid and respects reach',()=>{
 const a=new VoxelWorld();a.set(4,3,4,3);a.set(4,3,6,11);const hit=raycast(a,{x:4.5,y:3.5,z:8},{x:0,y:0,z:-1});assert.equal(hit.z,4);assert.equal(hit.id,3);assert.deepEqual(hit.normal,{x:0,y:0,z:1});assert.equal(raycast(a,{x:4.5,y:3.5,z:12},{x:0,y:0,z:-1},6),null);
});
test('fast movement does not tunnel through a one-block wall',()=>{
 const a=new VoxelWorld('flat','flat').generate();for(let y=17;y<22;y++)for(let z=3;z<8;z++)a.set(8,y,z,3);const p={x:4.5,y:17.01,z:5.5};movePlayer(a,p,{x:10,y:0,z:0});assert(p.x<7.71);assert.equal(collides(a,p),false);
});
test('floor, ceiling, player placement and crouching edge protection',()=>{
 const a=new VoxelWorld('flat','flat').generate();const p={x:5.5,y:17.01,z:5.5};assert(movePlayer(a,p,{x:0,y:-3,z:0}).grounded);assert.equal(intersectsPlayer(5,17,5,p),true);assert.equal(intersectsPlayer(8,17,5,p),false);a.set(5,19,5,3);assert(movePlayer(a,p,{x:0,y:4,z:0}).ceiling);
 const platform=new VoxelWorld();platform.set(5,5,5,3);const q={x:5.5,y:6.01,z:5.5};movePlayer(platform,q,{x:4,y:0,z:0},1.5,true);assert(q.x<6.31);
});
const save=()=>({format:1,name:'테스트 세계',seed:'flat',terrain:'flat',edits:[[12345,0]],player:{x:5.5,y:17.01,z:5.5,yaw:0,pitch:0},bar:[...DEFAULT_BAR]});
test('import validates block IDs, bounds, finite coordinates and inventory',()=>{
 assert.equal(validateSave(save()).name,'테스트 세계');for(const change of [s=>s.edits=[[99999999,1]],s=>s.edits=[[1,999]],s=>s.edits=[[1,1],[1,2]],s=>s.player.x=NaN,s=>s.player.y=HEIGHT,s=>s.player.pitch=8,s=>s.bar[0]=32,s=>s.format=2]){const s=save();change(s);assert.throws(()=>validateSave(s));}
 assert.equal(BLOCKS[11].liquid,true);
});

function easyFixture(){const world=new VoxelWorld('easy','flat').generate(),player={...world.spawn,yaw:0,pitch:-.55,flying:false};groundPlayer(world,player);return {world,player};}
function advance(controller,world,player,seconds){for(let t=0;t<seconds-.00001;t+=.01)controller.update(world,player,.01);}
test('a short sideways tap moves a small distance and never turns the view',()=>{
 const {world,player}=easyFixture(),controls=new EasyControls(),start={...player};controls.press(world,player,'left');controls.release('left');advance(controls,world,player,.5);assert(player.x<start.x-.03);assert(player.x>start.x-.4);assert.equal(player.z,start.z);assert.equal(player.yaw,start.yaw);assert.equal(player.pitch,start.pitch);const stopped=player.x;advance(controls,world,player,1);assert(Math.abs(player.x-stopped)<.002);
});
test('held movement is continuous, diagonal speed is normalized, and release stops promptly',()=>{
 const a=easyFixture(),b=easyFixture(),one=new EasyControls(),two=new EasyControls();one.press(a.world,a.player,'up');two.press(b.world,b.player,'up',true,'up');two.press(b.world,b.player,'right',true,'right');const origin={...a.player};advance(one,a.world,a.player,.6);advance(two,b.world,b.player,.6);const straight=Math.hypot(a.player.x-origin.x,a.player.z-origin.z),diagonal=Math.hypot(b.player.x-origin.x,b.player.z-origin.z);assert(straight>.8&&straight<1.3);assert(Math.abs(straight-diagonal)<.02);one.release('up');advance(one,a.world,a.player,.2);const stop={...a.player};advance(one,a.world,a.player,.5);assert(Math.hypot(a.player.x-stop.x,a.player.z-stop.z)<.004);
});
test('movement follows arbitrary manual yaw and never writes yaw or pitch',()=>{
 const {world,player}=easyFixture(),controls=new EasyControls();player.yaw=Math.PI/4;player.pitch=.32;const start={...player};controls.press(world,player,'up');advance(controls,world,player,.5);assert(player.x<start.x-.4&&player.z<start.z-.4);assert.equal(player.yaw,start.yaw);assert.equal(player.pitch,start.pitch);
});
test('continuous walking climbs one block and refuses two-high walls or low ceilings',()=>{
 for(const kind of ['step','wall','ceiling']){const {world,player}=easyFixture(),controls=new EasyControls();world.set(64,17,71,6);if(kind==='wall')world.set(64,18,71,6);if(kind==='ceiling')world.set(64,19,72,3);controls.press(world,player,'up');advance(controls,world,player,.65);if(kind==='step'){assert.equal(player.y,18.01);assert(player.z<72);}else{assert.equal(player.y,17.01);assert(player.z>72.29);}assert(!collides(world,player));}
});
test('continuous walking protects deep drops and water, and can step down once',()=>{
 for(const kind of ['down','cliff','water']){const {world,player}=easyFixture(),controls=new EasyControls();world.set(64,16,71,0);if(kind==='cliff')world.set(64,15,71,0);if(kind==='water')world.set(64,16,71,11);controls.press(world,player,'up');advance(controls,world,player,.5);if(kind==='down')assert.equal(player.y,16.01);else{assert.equal(player.y,17.01);assert(player.z>71.7);}assert.equal(player.flying,false);}
});
test('cancelling one finger keeps the other direction active; reset stops all motion',()=>{
 const {world,player}=easyFixture(),controls=new EasyControls();controls.press(world,player,'up',true,'finger1');controls.press(world,player,'right',true,'finger2');controls.release('finger2',true);const start={...player};advance(controls,world,player,.3);assert.equal(player.x,start.x);assert(player.z<start.z);controls.reset();const stop={...player};advance(controls,world,player,.5);assert.deepEqual(player,stop);
});
test('jump works while walking, lands on the ground and cannot become flight',()=>{
 const {world,player}=easyFixture(),controls=new EasyControls(),start={...player};controls.press(world,player,'right');assert(controls.jump(world,player));advance(controls,world,player,.12);assert(player.y>start.y+.4);assert(player.x>start.x);assert.equal(controls.jump(world,player),false);controls.release('right');advance(controls,world,player,1);assert.equal(player.y,start.y);assert.equal(player.flying,false);assert.equal(player.yaw,start.yaw);assert.equal(player.pitch,start.pitch);assert.equal(controls.airborne,false);assert(controls.jump(world,player));
});
test('jump hits a low ceiling and safely returns from water',()=>{
 const {world,player}=easyFixture(),controls=new EasyControls();world.set(64,19,72,3);assert(controls.jump(world,player));let peak=player.y;for(let i=0;i<100;i++){controls.update(world,player,.01);peak=Math.max(peak,player.y);assert(!collides(world,player));}assert(peak<17.21);assert.equal(player.y,17.01);
 const pond=easyFixture(),swim=new EasyControls();for(let x=65;x<=69;x++)for(let z=70;z<=74;z++)pond.world.set(x,16,z,11);const safe={...pond.player};swim.press(pond.world,pond.player,'right');assert(swim.jump(pond.world,pond.player));advance(swim,pond.world,pond.player,1.1);assert.equal(pond.player.x,safe.x);assert.equal(pond.player.y,safe.y);assert.equal(pond.player.flying,false);
});
test('building targets the manual view ray, including side faces and water',()=>{
 const {world,player}=easyFixture();const ground=easyTarget(world,player);assert(ground.canPlace);assert.equal(ground.hit.normal.y,1);const cell=ground.place;world.set(cell.x,cell.y,cell.z,6);const placed=easyTarget(world,player);assert.equal(placed.hit.id,6);assert(placed.canBreak);player.pitch=1.2;assert.equal(easyTarget(world,player).hit,null);player.pitch=-.55;world.set(cell.x,cell.y,cell.z,11);assert.equal(easyTarget(world,player).hit.id,11);
});
test('easy targeting respects intervening walls and protects the block underfoot',()=>{
 const {world,player}=easyFixture();world.set(64,17,71,3);world.set(64,18,71,3);assert.equal(easyTarget(world,player).hit.z,71);player.pitch=-1.55;assert.equal(easyTarget(world,player).canBreak,false);
});
test('undo restores the actual previous block and protects the player',()=>{
 const {world,player}=easyFixture(),history=new EditHistory();history.record(64,17,70,0,6);world.set(64,17,70,6);assert(history.undo(world,player));assert.equal(world.get(64,17,70),0);assert.equal(history.undo(world,player),false);history.record(64,16,72,0,1);assert.equal(history.undo(world,player),false);assert.equal(world.get(64,16,72),1);
});
test('save restoration preserves fractional position and manual view while removing flight',()=>{
 const {world,player}=easyFixture();world.set(64,18,70,9);const edits=[...world.edits];Object.assign(player,{x:64.72,z:72.29,yaw:.37,pitch:-.42,y:45,flying:true});assert(groundPlayer(world,player));assert.equal(player.flying,false);assert.equal(player.y,17.01);assert.equal(player.x,64.72);assert.equal(player.z,72.29);assert.equal(player.yaw,.37);assert.equal(player.pitch,-.42);assert.deepEqual([...world.edits],edits);assert(!collides(world,player));
});
