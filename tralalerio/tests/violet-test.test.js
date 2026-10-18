import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {Game} from '../engine.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
const make=()=>{const g=new Game(maps,data,{random:()=>.5});g.startAdventure();return g;};
test('Violet test upgrades Pikachu to level 99 and one-hits high-level Ground and Minecraft enemies',()=>{
 for(const id of ['geodude','mc_wither','mc_irongolem']){const g=make(),money=g.state.money;assert.ok(g.configureVioletTest());g.startVioletTest();assert.equal(g.state.party[0].level,99);assert.equal(g.state.money,money);assert.ok(make().restore(g.serialize()));g.startEncounter(id,99);g.battle.s.animationPending=false;assert.ok(g.battle.action('move',0));assert.equal(g.battle.enemy.hp,0);assert.equal(g.battle.s.result,'won');}
});
test('ordinary level-99 Pikachu still respects Ground immunity',()=>{const g=make();g.configureVioletTest();delete g.state.flags.violetTestMode;g.startEncounter('geodude',99);g.battle.s.animationPending=false;const hp=g.battle.enemy.hp;g.battle.action('move',0);assert.equal(g.battle.enemy.hp,hp);});
