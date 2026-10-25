import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../engine.js';
import {createPokemon,damage,validPokemon,experienceAt} from '../battle.js';
import {MINECRAFT_MOVES} from '../minecraft-moves.js';
import {profileFor} from '../battle-animation.js';
const data=JSON.parse(fs.readFileSync('assets/battle-data.json')),maps=JSON.parse(fs.readFileSync('assets/maps.json'));
function game(){const g=new Game(maps,data,{random:()=>.5});g.chooseStarter('치코리타');return g}
function legacy(kind='enderknight',pp=14){const p=createPokemon(data,'mc_'+kind,3,()=>.5);delete p.minecraftMovesVersion;p.moves=[{id:'TACKLE',pp},{id:'GROWL',pp:40}];return p}
test('all 31 species start with their own animated signature attack and can use it after capture',()=>{
 assert.equal(Object.keys(MINECRAFT_MOVES).length,31);
 for(const [kind,s] of Object.entries(MINECRAFT_MOVES)){
  const g=game(),p=createPokemon(data,'mc_'+kind,3,()=>.5);assert.equal(p.moves[0].id,s.id);assert.equal(profileFor(s.id),'mc-'+s.profile);
  g.state.party=[p];g.startEncounter('hoothoot',5);g.battle.rng=()=>.5;
  const before=p.moves[0].pp;assert.ok(g.battle.action('move',0));assert.equal(p.moves[0].pp,before-1);
  assert.ok(g.battle.s.animationEvents.some(e=>e.actor==='player'&&e.move===s.id));assert.ok(validPokemon(data,p));
  assert.ok(g.battle.s.logs.some(l=>l.includes(s.name)));assert.ok(game().restore(g.serialize()));
 }
});
test('wild signature damage stays within the existing early-game attack envelope',()=>{
 for(const s of Object.values(MINECRAFT_MOVES))for(const starter of ['chikorita','cyndaquil','totodile'])for(const level of [2,3,4]){
  const a=createPokemon(data,'mc_'+s.kind,level,()=>.5),d=createPokemon(data,starter,5,()=>.5);
  const hit=damage(data,a,d,data.moves[s.id],{roll:255});assert.ok(hit>=1&&hit<=10,`${s.id} vs ${starter} level ${level}: ${hit}`);
 }
});
test('poison splash and fire attacks apply real secondary statuses without self-destructing the creeper',()=>{
 for(const [kind,status] of [['witch','poison'],['magma','burn'],['ghast','burn']]){
  const g=game();g.state.party=[createPokemon(data,'mc_'+kind,3,()=>.5)];g.startEncounter('sentret',4);const b=g.battle;b.rng=()=>0;b.use('player',0);assert.equal(g.battle.enemy.status,status);
 }
 const web=game();web.state.party=[createPokemon(data,'mc_spider',3,()=>.5)];web.startEncounter('sentret',4);const wb=web.battle;wb.rng=()=>0;wb.use('player',0);assert.equal(wb.s.enemyStages.speed,-1);
 const g=game();g.state.party=[createPokemon(data,'mc_creeper',3,()=>.5)];g.startEncounter('sentret',4);const hp=g.battle.player.hp;g.battle.use('player',0);assert.equal(g.battle.player.hp,hp);
});
test('legacy party and storage gain signature moves once, preserving PP depletion and other state',()=>{
 const g=game();g.state.party.push(legacy());g.state.storage.push(legacy('enderdragon',0));const raw=g.serialize();
 const h=game();assert.ok(h.restore(raw));const p=h.state.party[1];assert.equal(p.moves[0].id,'MC_ENDERKNIGHT');assert.equal(p.moves[0].pp,10);assert.equal(h.state.storage[0].moves[0].pp,0);assert.equal(p.hp,g.state.party[1].hp);
 const saved=h.serialize();assert.ok(h.restore(saved));assert.equal(h.serialize(),saved);
 // A move deliberately forgotten after upgrading is not reinserted on reload.
 p.moves[0]={id:'TACKLE',pp:4};const j=game();h.state.party[1]=p;assert.ok(j.restore(h.serialize()));assert.equal(j.state.party[1].moves[0].id,'TACKLE');
});
test('legacy battle resumes without rewriting snapshots or spending a turn, then upgrades at battle end',()=>{
 const g=game();g.state.party=[legacy()];g.startEncounter('pidgey',3);g.battle.action('move',0);const original=g.serialize(),h=game();assert.ok(h.restore(original));assert.equal(h.serialize(),original);
 h.battle.s.result='fled';h.battle.s.learn=[];assert.ok(h.finishBattle());assert.equal(h.state.party[0].moves[0].id,'MC_ENDERKNIGHT');assert.equal(h.state.party[0].moves[0].pp,Math.floor(13/35*25));
});
test('signature companions still gain EXP and learn their level 7 elemental move',()=>{
 const g=game(),p=createPokemon(data,'mc_ghast',6,()=>.5);p.exp=experienceAt(7,'MEDIUM_FAST')-1;g.state.party=[p];g.startEncounter('sentret',2);g.battle.enemy.hp=1;g.battle.action('move',0);assert.equal(p.level,7);assert.ok(p.moves.some(m=>m.id==='EMBER'));assert.ok(p.moves.some(m=>m.id==='MC_GHAST'));
});
