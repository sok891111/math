const assert=require('node:assert/strict');
const world=require('../creative/overworld.js');
for(const region of Object.keys(world.regions)){
 const map=world.makeMap(region),state={map,...map.spawn,grace:6,steps:0,wildSteps:0};
 assert.ok(world.walkable(map,state.x,state.y));assert.ok(!world.walkable(map,0,0));assert.ok(!world.walkable(map,19,2));
 const path=world.pathfind(map,map.spawn,{x:14,y:11});assert.ok(path.length>0,'wild area reachable from town');let encounters=0;
 for(const p of path){const r=world.step(state,p.x-state.x,p.y-state.y,()=>0);if(r.encounter){encounters++;assert.equal(r.grade,1);assert.equal(map.tiles[state.y][state.x],'G');}}
 assert.ok(encounters>0);const old={x:state.x,y:state.y};assert.equal(world.step(state,2,0).moved,false);assert.deepEqual({x:state.x,y:state.y},old);
 const noRandom={map,x:12,y:11,grace:0,wildSteps:0};let last;for(let i=0;i<14;i++)last=world.step(noRandom,i%2? -1:1,0,()=>.999);assert.ok(last.encounter,'bounded bad luck');assert.equal(last.grade,3);
 const safe={map,x:3,y:12,grace:0,wildSteps:0};assert.ok(!world.step(safe,1,0,()=>0).encounter,'town never spawns monsters');
}
assert.equal(world.rollEncounter(()=>0),1);assert.equal(world.rollEncounter(()=>.549),1);assert.equal(world.rollEncounter(()=>.55),2);assert.equal(world.rollEncounter(()=>.849),2);assert.equal(world.rollEncounter(()=>.85),3);assert.equal(world.rollEncounter(()=>.999),3);
console.log('PASS: four regional maps, reachable wild grass, collision, safe towns, walking-only encounters, anti-bad-luck encounters and 1–3-star random distribution.');
