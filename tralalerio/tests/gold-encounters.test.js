import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {Game,DIRECTIONS} from '../engine.js';import {pickEncounter} from '../battle.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json')),source=JSON.parse(fs.readFileSync('assets/encounter-source.json'));
const locations=['Route29','Route30','Route31','Route46','DarkCaveVioletEntrance','SproutTower2F','SproutTower3F','Route32','Route33','UnionCave1F','UnionCaveB1F','UnionCaveB2F','SlowpokeWellB1F','SlowpokeWellB2F'];
export function grassPair(g,id){g.enter(maps[id],0,0);for(const t of Object.keys(data.trainers))g.state.flags['trainer:'+t]=true;g.state.flags.eggDelivered=true;g.state.flags.labCall=true;const tile=data.encounters[id].terrain==='floor'?'FLOOR':'TALL_GRASS';for(let y=1;y<g.map.height-1;y++)for(let x=1;x<g.map.width-1;x++)for(const [dir,[dx,dy]]of Object.entries(DIRECTIONS)){if(g.passable(x,y)&&g.passable(x+dx,y+dy)&&g.map.collision[y][x]===tile&&g.map.collision[y+dy][x+dx]===tile)return{x,y,dir};}throw Error('No safe wild pair: '+id);}
test('all seven implemented Gold land habitats have original time slots and rates plus 60% Minecraft',()=>{
 assert.deepEqual(Object.keys(data.encounters).sort(),locations.slice().sort());assert.equal(data.encounters.SproutTower1F,undefined);
 for(const id of locations){const table=data.encounters[id],gold=source.tables[id];assert.deepEqual(table.rates,gold.rates);assert.equal(table.terrain,gold.terrain);assert.deepEqual(table.weights.slice(0,7).map(w=>w/19),source.originalWeights);
  for(const [period,hour]of [['morning',7],['day',12],['night',22]]){
   assert.deepEqual(table[period].slice(0,7),gold[period]);assert.equal(table[period].length,33);assert.equal(table[period].filter(x=>x.species.startsWith('mc_')).length,24);
   const sampled=Array.from({length:500},(_,i)=>pickEncounter(table,hour,()=>(i+.5)/500));assert.equal(sampled.filter(x=>x.species.startsWith('mc_')).length,300);
   assert.ok(table[period].every(x=>data.species[x.species]));
  }
 }
 assert.deepEqual(data.encounters.Route30.day.slice(0,4),[{level:2,species:'pidgey'},{level:3,species:'caterpie'},{level:4,species:'pidgey'},{level:4,species:'metapod'}]);
 assert.equal(data.encounters.Route30.night[0].species,'spinarak');assert.deepEqual(data.encounters.Route31.day[2],{level:3,species:'bellsprout'});
});
test('real movement triggers both Pokemon and Minecraft at every habitat and time',()=>{
 for(const id of locations)for(const hour of [7,12,22])for(const minecraft of [false,true]){
  const g=new Game(maps,data,{random:()=>.5,now:()=>({getHours:()=>hour})});g.startAdventure();const spot=grassPair(g,id);g.enter(maps[id],spot.x,spot.y);let n=0;g.rng=()=>++n===1?0:n===2?(minecraft?.7:.13):.5;
  assert.equal(g.move(spot.dir).type,'encounter',id);assert.equal(g.battle.enemy.species.startsWith('mc_'),minecraft,id);assert.equal(g.move(spot.dir).type,'battle-active');assert.ok(new Game(maps,data).restore(g.serialize()));
 }
});
test('Gold/Silver conditional tables select only Gold instead of silently dropping routes with 42 rows',()=>{
 const text='def_grass_wildmons ROUTE_30\ndb 10 percent, 10 percent, 10 percent\nIF DEF(_GOLD)\n'+Array(21).fill('db 3, CATERPIE').join('\n')+'\nELIF DEF(_SILVER)\n'+Array(21).fill('db 4, WEEDLE').join('\n')+'\nENDC\nend_grass_wildmons';
 const parsed=JSON.parse(execFileSync('python3',['-c',"import sys,json;sys.path.insert(0,'tools');from gold_wild import grass_table;print(json.dumps(grass_table(sys.stdin.read(),'ROUTE_30')))"],{input:text,encoding:'utf8'}));assert.equal(parsed.slots.length,21);assert.ok(parsed.slots.every(x=>x.species==='caterpie'));assert.deepEqual(parsed.rates,{morning:25,day:25,night:25});
});

test('grass grace protects exactly three eligible steps, and ordinary road tiles never roll wild encounters',()=>{
 const g=new Game(maps,data,{random:()=>.5});g.startAdventure();const spot=grassPair(g,'Route30');g.enter(maps.Route30,spot.x,spot.y);g.state.grassGrace=3;g.rng=()=>0;const opposite={up:'down',down:'up',left:'right',right:'left'};
 for(const dir of [spot.dir,opposite[spot.dir],spot.dir]){assert.equal(g.move(dir).type,'step');assert.equal(g.battle,null);}assert.equal(g.state.grassGrace,0);assert.equal(g.move(opposite[spot.dir]).type,'encounter');
 const road=new Game(maps,data,{random:()=>.5});road.startAdventure();grassPair(road,'Route31');let checked=false;
 for(let y=1;y<road.map.height-1&&!checked;y++)for(let x=1;x<road.map.width-1&&!checked;x++)for(const [dir,[dx,dy]]of Object.entries(DIRECTIONS))if(road.passable(x,y)&&road.passable(x+dx,y+dy)&&road.map.collision[y][x]==='FLOOR'&&road.map.collision[y+dy][x+dx]==='FLOOR'){road.enter(maps.Route31,x,y);road.rng=()=>{throw Error('road must not roll encounter')};assert.equal(road.move(dir).type,'step');assert.equal(road.battle,null);checked=true;break;}
 assert.ok(checked);
});
