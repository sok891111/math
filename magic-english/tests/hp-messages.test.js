import {messageVisual} from '../battle-presentation.js';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {hpLossMessage,isHpLossMessage} from '../hp-messages.js';import {Game} from '../engine.js';
const maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
function game(){const g=new Game(maps,data,{random:()=>.5});g.chooseStarter('리아코');g.startEncounter('mc_enderknight',3);g.battle.enemy.moves=[{id:'TACKLE',pp:35}];g.battle.s.animationPending=false;return g;}
test('HP explanations use exact units and real remaining HP',()=>{
 assert.equal(hpLossMessage('피카츄',100,40),'피카츄의 체력: 100 - 60 = 40. 현재 체력이 40 남았다!');
 assert.equal(hpLossMessage('좀비',37,24),'좀비의 체력: 37 - 13 = 24. 현재 체력이 24 남았다!');
 assert.ok(isHpLossMessage(hpLossMessage('엔더기사',1,0)));
});
test('each attack explains actual HP loss for either side in turn order and survives reload',()=>{
 const g=game();g.battle.action('move',0);const s=g.battle.s,lines=s.logs.filter(isHpLossMessage);assert.equal(lines.length,2);
 for(const event of s.animationEvents){const target=event.actor==='player'?'enemy':'player',before=event.before[target],after=event.after[target],message=hpLossMessage(data.species[before.species].name,before.hp,after.hp);assert.ok(s.logs.includes(message));assert.ok(s.logs.indexOf(message)>event.logIndex);}
 assert.equal(s.turn,1);assert.equal(g.battle.player.moves[0].pp,34);const h=game();assert.ok(h.restore(g.serialize()));assert.deepEqual(h.battle.s.logs,s.logs);
});
test('KO overkill uses only remaining HP, multi-hit attacks add actual losses, and support or missed moves have no false subtraction',()=>{
 const ko=game();ko.battle.enemy.hp=1;ko.battle.action('move',0);assert.deepEqual(ko.battle.s.logs.filter(isHpLossMessage),[hpLossMessage(data.species[ko.battle.enemy.species].name,1,0)]);assert.equal(ko.battle.s.result,'won');
 const multi=game(),id=Object.keys(data.moves).find(id=>data.moves[id].effect==='MULTI_HIT');assert.ok(id);multi.battle.player.moves[0]={id,pp:data.moves[id].pp};multi.battle.action('move',0);const e=multi.battle.s.animationEvents[0];assert.ok(multi.battle.s.logs.includes(hpLossMessage(data.species[e.before.enemy.species].name,e.before.enemy.hp,e.after.enemy.hp)));
 const support=game();support.battle.action('move',1);assert.equal(support.battle.s.logs.filter(isHpLossMessage).length,1);
 const miss=game();miss.rng=()=>.999999;miss.battle.player.moves[0]={id:'TACKLE',pp:35};miss.battle.action('move',0);assert.ok(miss.battle.s.animationEvents[0].failed);assert.ok(!miss.battle.s.logs.includes(hpLossMessage(data.species[miss.battle.enemy.species].name,miss.battle.enemy.hp,miss.battle.enemy.hp)));
});

test('saved HP messages use their attack snapshot even when poison or later actions change final HP',()=>{
 const g=game();g.battle.player.status='poison';g.battle.action('move',0);const s=g.battle.s;
 const index=s.logs.findIndex(t=>t.startsWith('리아코의 체력:')),event=s.animationEvents.find(e=>e.actor==='enemy');assert.ok(index>=0);assert.ok(g.battle.player.hp<event.after.player.hp);
 const shown=messageVisual(s,index);assert.equal(shown.player.hp,event.after.player.hp);assert.ok(s.logs[index].includes('현재 체력이 '+shown.player.hp+' 남았다!'));assert.ok(s.logs[index].startsWith('리아코의 체력: '+event.before.player.hp+' - '));
 const raw=g.serialize(),h=game();assert.ok(h.restore(raw));assert.deepEqual(messageVisual(h.battle.s,index),shown);assert.equal(h.serialize(),raw);
});
