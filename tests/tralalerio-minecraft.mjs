import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {Game,DIRECTIONS} from '../tralalerio/engine.js';
import {createPokemon,damage,pickEncounter,validPokemon} from '../tralalerio/battle.js';
const data=JSON.parse(readFileSync(new URL('../tralalerio/assets/battle-data.json',import.meta.url)));
const maps=JSON.parse(readFileSync(new URL('../tralalerio/assets/maps.json',import.meta.url)));
const ids=Object.keys(data.species).filter(id=>id.startsWith('mc_'));
assert.equal(ids.length,24);
const table=data.encounters.Route29;
assert.equal(table.rateByte,25);
for(const hour of [5,12,22]){
 const picks=Array.from({length:500},(_,i)=>pickEncounter(table,hour,()=> (i+.5)/500));
 assert.equal(picks.filter(p=>p.species.startsWith('mc_')).length,300);
 for(const id of ids)assert.ok(picks.some(p=>p.species===id));
 assert.ok(picks.every(p=>[...data.challengePolicy.rareSpecies,'mew','koraidon'].includes(p.species)?p.level>=10:p.level>=2&&p.level<=4));
}
function game(){const g=new Game(maps,data,{random:()=>0});g.chooseStarter('치코리타');return g}
for(const id of ids){
 const g=game();assert.ok(g.startEncounter(id,3));
 for(const side of ['front','back'])assert.ok(existsSync(new URL(`../tralalerio/assets/battle/${id}-${side}.png`,import.meta.url)));
 const wild=g.battle.enemy;
 assert.ok(validPokemon(data,wild));
 const defender=createPokemon(data,'chikorita',5,()=>0);
 const hit=damage(data,wild,defender,data.moves.TACKLE,{roll:255});
 assert.equal(wild.level,data.challengePolicy.rareSpecies.includes(id)?10:3);assert.ok(hit>=2&&hit<=(data.challengePolicy.rareSpecies.includes(id)?20:6),`${id} damage ${hit}`);
 const balls=g.state.balls;
 g.battle.action('ball',0,{captureAnswer:true});assert.equal(g.battle.s.result,'caught');assert.equal(g.state.balls,balls-1);
 assert.equal(g.state.party[1].species,id);assert.ok(g.finishBattle());
 const restored=game();assert.ok(restored.restore(g.serialize()));assert.equal(restored.state.party[1].species,id);
 restored.state.party.reverse();assert.ok(restored.startEncounter('pidgey',3));assert.equal(restored.battle.player.species,id);
 assert.ok(restored.battle.action('move',0));
 restored.healParty();assert.equal(restored.state.party[0].hp,restored.state.party[0].stats.hp);
}
const full=game();while(full.state.party.length<6)full.state.party.push(createPokemon(data,'pidgey',3,()=>0));full.startEncounter(ids[0],3);full.battle.action('ball',0,{captureAnswer:true});assert.equal(full.state.storage[0].species,ids[0]);
// Force an encounter through actual grass movement, using a Minecraft-weight roll.
const grass=game();grass.state.map='Route29';let spot;
for(let y=1;y<grass.map.height&&!spot;y++)for(let x=1;x<grass.map.width&&!spot;x++)for(const [dir,[dx,dy]] of Object.entries(DIRECTIONS)){grass.state.x=x;grass.state.y=y;if(grass.passable(x,y)&&grass.passable(x+dx,y+dy)&&grass.map.collision[y+dy]?.[x+dx]==='TALL_GRASS'){spot={x,y,dir};break}}
assert.ok(spot);Object.assign(grass.state,{x:spot.x,y:spot.y});let call=0;grass.rng=()=>call++===0?0:.405;assert.equal(grass.move(spot.dir).type,'encounter');assert.ok(grass.battle.enemy.species.startsWith('mc_'));
console.log('PASS: 60/40 every period, all 24 species, grass encounter, balanced damage, capture, party combat, healing, storage, save/restore.');
