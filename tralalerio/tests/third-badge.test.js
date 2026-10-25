import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Game} from '../engine.js';import {createPokemon,pokemonGender,pickEncounter} from '../battle.js';import {storyInteraction,storyEntry,chapterGoal} from '../chapter.js';import {WHITNEY} from '../third-badge.js';import {routeTo,follow} from './world-path.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
function game(){const g=new Game(maps,data,{random:()=>.99});g.startAdventure();Object.assign(g.state.flags,{eggDelivered:true,violet:true,zephyr:true,eggGift:true,azalea:true,kurtHelp:true,slowpokeWell:true,hive:true,azaleaRival:true});for(const id of Object.keys(data.trainers))if(id!==WHITNEY)g.state.flags['trainer:'+id]=true;return g;}
function walk(g,predicate){follow(g,routeTo(g,predicate));assert.ok(predicate(g));}
function talk(g,script){const o=g.objects().find(o=>o.script===script);assert.ok(o,script);return storyInteraction(g,o);}
test('walk original maps: Azalea gate, one-talk Farfetchd return, Cut, Route34, Goldenrod and gym',()=>{
 const g=game();g.enter(maps.IlexForestAzaleaGate,6,4);walk(g,h=>h.state.map==='IlexForest');assert.equal(g.objects().filter(o=>/^FarfetchdPosition/.test(o.script)).length,1);assert.equal(g.passable(8,25),false);
 walk(g,h=>h.target()?.script==='FarfetchdPosition1');talk(g,'FarfetchdPosition1');assert.equal(g.state.flags.farfetchdPosition,10);const h=game();assert.ok(h.restore(g.serialize()));assert.equal(h.state.flags.farfetchdPosition,10);
 assert.ok(g.state.flags.herdedFarfetchd);walk(g,h=>h.target()?.script==='IlexForestCharcoalMasterScript');storyInteraction(g,g.target());assert.equal(g.state.items.HM01,1);walk(g,h=>!!h.target()?.cutTree);storyInteraction(g,g.target());assert.equal(g.passable(8,25),true);
 for(const id of ['Route34IlexForestGate','Route34','GoldenrodCity','GoldenrodGym'])walk(g,h=>h.state.map===id);assert.ok(g.state.flags.goldenrod);walk(g,h=>h.target()?.trainer===WHITNEY);assert.ok(game().restore(g.serialize()));
});
test('Whitney original team, tears, delayed badge, once-only TM45/reward and flower gift',()=>{
 const g=game();g.enter(maps.GoldenrodGym,8,4);assert.ok(g.startTrainer(WHITNEY));assert.deepEqual(g.battle.s.enemyParty.map(p=>[p.species,p.level]),[['clefairy',18],['miltank',20]]);const money=g.state.money;g.battle.s.result='won';g.battle.s.learn=[];assert.ok(g.finishBattle());assert.equal(g.state.money,money+2000);assert.equal(g.state.flags.plain,undefined);assert.equal(g.state.items?.TM45,undefined);assert.ok(talk(g,'GoldenrodGymWhitneyScript'));
 g.state.x=8;g.state.y=5;assert.ok(storyEntry(g));assert.equal(storyEntry(g),null);assert.ok(game().restore(g.serialize()));talk(g,'GoldenrodGymWhitneyScript');talk(g,'GoldenrodGymWhitneyScript');assert.ok(g.state.flags.plain);assert.equal(g.state.items.TM45,1);assert.equal(g.state.money,money+2000);
 g.enter(maps.GoldenrodFlowerShop,2,4);talk(g,'FlowerShopTeacherScript');talk(g,'FlowerShopTeacherScript');assert.equal(g.state.items.SQUIRTBOTTLE,1);Object.assign(g.state.flags,{herdedFarfetchd:true,cutGift:true,ilexCut:true,goldenrod:true});assert.match(chapterGoal(g.state),/완료/);
});
test('new center PC/healing/checkpoint, bicycle, gate TM, original radio quiz persist once',()=>{
 const g=game();g.enter(maps.GoldenrodPokecenter1F,9,2);g.state.facing='up';assert.ok(g.target().pc);g.state.party[0].hp=1;assert.ok(g.beginHealing());assert.ok(game().restore(g.serialize()));g.finishHealing();g.startEncounter('rattata',3);g.battle.s.result='lost';g.finishBattle();assert.equal(g.state.map,'GoldenrodPokecenter1F');
 g.enter(maps.GoldenrodBikeShop,2,4);talk(g,'GoldenrodBikeShopClerkScript');talk(g,'GoldenrodBikeShopClerkScript');assert.equal(g.state.items.BICYCLE,1);g.enter(maps.Route34IlexForestGate,2,4);talk(g,'Route34IlexForestGateTeacherScript');talk(g,'Route34IlexForestGateTeacherScript');assert.equal(g.state.items.TM12,1);
 g.enter(maps.RadioTower1F,3,4);let q=talk(g,'RadioTower1FRadioCardWomanScript');for(const answer of ['예','예','아니요','예','아니요'])q=q.choices.find(([label])=>label===answer)[1]();assert.ok(g.state.flags.radioCard);assert.ok(game().restore(g.serialize()));
});
test('new wild tables retain Gold time slots, Pokemon60/Minecraft40, sprites and blocked premature forest',()=>{
 for(const id of ['IlexForest','Route34']){const table=data.encounters[id];for(const hour of [7,12,22]){const slots=Array.from({length:5000},(_,i)=>pickEncounter(table,hour,()=>(i+.5)/5000));assert.equal(slots.filter(p=>p.species.startsWith('mc_')).length,2000);}for(const p of table.day)for(const side of ['front','back'])assert.ok(fs.existsSync(`assets/battle/${p.species}-${side}.png`));}
 const g=game();g.state.flags.azaleaRival=false;g.enter(maps.IlexForestAzaleaGate,1,4);assert.equal(g.move('left').type,'story-blocked');
});
function battle(){const g=game();g.state.party=[createPokemon(data,'pikachu',100,()=>.5)];g.startTrainer(WHITNEY);const b=g.battle;b.s.enemyIndex=1;b.s.enemy=b.s.enemyParty[1];b.s.animationPending=false;g.rng=()=>.5;return g;}
test('Milk Drink heals half without sleep; Rollout doubles, locks, saves, ends on fifth hit or miss',()=>{
 const g=battle(),b=g.battle;b.enemy.hp=1;const total=b.enemy.stats.hp;b.performUse('enemy',3);assert.equal(b.enemy.hp,1+Math.floor(total/2));assert.equal(b.enemy.status,null);const hits=[];for(let i=0;i<3;i++){b.player.hp=b.player.stats.hp;const hp=b.player.hp;b.performUse('enemy',0);hits.push(hp-b.player.hp);}assert.ok(hits[1]>hits[0]&&hits[2]>hits[1]);assert.equal(b.enemy.moves[0].pp,19);assert.equal(b.enemyMove(),0);assert.ok(game().restore(g.serialize()));for(let i=0;i<2;i++){b.player.hp=b.player.stats.hp;b.performUse('enemy',0);}assert.equal(b.s.enemyFields.rollout,0);b.rng=()=>.99;b.performUse('enemy',0);assert.equal(b.s.enemyFields.rollout,0);
});
test('Attract respects original Attack DV genders; switching clears it',()=>{
 const g=battle(),b=g.battle;assert.equal(pokemonGender(data,b.enemy),'female');assert.equal(pokemonGender(data,b.player),'male');b.performUse('enemy',1);assert.equal(b.s.playerFields.attracted,true);b.rng=()=>0;assert.equal(b.canMove(b.player,b.s.playerFields,b.s.playerStages),false);g.state.party.push(createPokemon(data,'pikachu',20,()=>.5));b.action('switch',1);assert.equal(b.s.playerFields.attracted,undefined);
});
test('Clefairy Encore locks the used move; Mimic is temporary and survives battle save',()=>{
 const g=game();g.state.party[0]=createPokemon(data,'pikachu',40,()=>.5);g.startTrainer(WHITNEY);const b=g.battle;b.s.animationPending=false;b.s.playerFields.lastMove='THUNDERSHOCK';b.player.moves=[{id:'THUNDERSHOCK',pp:30},{id:'TACKLE',pp:35}];
 b.performUse('enemy',2);assert.equal(b.s.playerFields.encoreMove,'THUNDERSHOCK');assert.equal(b.lockedMoveIndex('player'),0);
 b.performUse('enemy',1);assert.equal(b.enemy.moves[1].id,'THUNDERSHOCK');assert.ok(game().restore(g.serialize()));
 const h=game();h.state.party[0].moves=[{id:'MIMIC',pp:10},{id:'TACKLE',pp:35}];h.startEncounter('miltank',20);const c=h.battle;c.s.enemyFields.lastMove='STOMP';c.performUse('player',0);assert.equal(c.player.moves[0].id,'STOMP');assert.ok(game().restore(h.serialize()));c.s.result='fled';c.s.learn=[];h.finishBattle();assert.equal(h.state.party[0].moves[0].id,'MIMIC');assert.equal(h.state.party[0].moves[0].pp,9);
});
test('previous second-badge save keeps every companion, PC assignment and grant receipt when continuing',()=>{
 const g=game();g.state.storage.push(createPokemon(data,'mc_gaddoongi',15,()=>.5));g.state.adminGrantReceipts=['old-grant'];const raw=g.serialize(),previous=JSON.parse(raw),h=new Game(maps,data);assert.ok(h.restore(raw));assert.deepEqual(h.state.party,previous.party);assert.deepEqual(h.state.storage,previous.storage);assert.deepEqual(h.state.pc,previous.pc);assert.deepEqual(h.state.adminGrantReceipts,['old-grant']);assert.equal(h.state.flags.cutGift,undefined);
});
