import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {musicForState,synthesizeChannel} from '../game-audio.js';
const manifest=JSON.parse(fs.readFileSync('assets/audio/manifest.json')),maps=JSON.parse(fs.readFileSync('assets/maps.json')),data=JSON.parse(fs.readFileSync('assets/battle-data.json'));
test('all 46 maps have original score assignments and channels have valid notes and loop points',()=>{
 assert.deepEqual(Object.keys(manifest.maps).sort(),Object.keys(maps).sort());assert.equal(Object.keys(manifest.tracks).length,30);
 for(const [id,t] of Object.entries(manifest.tracks)){const score=JSON.parse(fs.readFileSync('assets/audio/'+t.file));assert.equal(score.id,id);assert.ok(score.channels.length>=2);for(const ch of score.channels){assert.ok(ch.events.length>0);assert.ok(ch.duration>0&&ch.duration<300);assert.ok(ch.loopStart===null||ch.loopStart>=0&&ch.loopStart<ch.duration);for(const e of ch.events){assert.ok(e[0]>=0&&e[1]>0);if(ch.channel!==4)assert.ok(e[2]>0&&e[2]<22050);}}}
 assert.equal(manifest.maps.VioletCity,'Music_VioletCity');assert.equal(manifest.maps.Route32,manifest.maps.Route30);assert.equal(manifest.maps.VioletPokecenter1F,'Music_PokemonCenter');
});
test('field, night wild, trainers, rival, rocket, gym and victory choose distinct original themes',()=>{
 const state={map:'VioletCity'},choose=hour=>musicForState(state,data,manifest,hour);
 assert.equal(choose(12),'Music_VioletCity');state.battle={};assert.equal(choose(12),'Music_JohtoWildBattle');assert.equal(choose(22),'Music_JohtoWildBattleNight');
 for(const [id,theme] of [['CherrygroveRival','Music_RivalBattle'],['SlowpokeWellB1F:TrainerGruntM1','Music_RocketBattle'],['VioletGym:TrainerBirdKeeperRod','Music_JohtoTrainerBattle']]){if(!data.trainers[id])continue;state.battle={trainer:id};assert.equal(choose(12),theme);}
 delete state.battle;state.trainerEncounter={id:Object.values(data.trainers).find(t=>t.group==='POKEMANIAC').id};assert.equal(choose(12),'Music_LookPokemaniac');delete state.trainerEncounter;
 const leader=Object.values(data.trainers).find(t=>t.badge);state.battle={trainer:leader.id};assert.equal(choose(12),'Music_JohtoGymBattle');state.battle.result='won';state.battle.animationPending=true;assert.equal(choose(12),'Music_JohtoGymBattle');state.battle.animationPending=false;assert.equal(choose(12),'Music_GymLeaderVictory');
 delete state.battle;state.trainerEncounter={id:'CherrygroveRival'};assert.equal(choose(12),'Music_LookRival');
});
test('pulse, wave and noise synthesis produce finite non-silent stereo audio',()=>{
 const context={createBuffer(channels,length){const values=Array.from({length:channels},()=>new Float32Array(length));return {getChannelData:n=>values[n]};}};
 for(const file of ['Music_VioletCity','Music_JohtoWildBattle']){const score=JSON.parse(fs.readFileSync('assets/audio/'+file+'.json'));for(const channel of score.channels){const short={...channel,duration:2,events:channel.events.filter(e=>e[0]<2)};if(!short.events.length)continue;const buffer=synthesizeChannel(context,short,score.waves,8000),values=buffer.getChannelData(0);assert.ok(values.every(Number.isFinite));assert.ok(values.some(v=>Math.abs(v)>.001));}}
});

test('Azalea removes only its percussion while other towns retain the drum channel',()=>{const read=id=>JSON.parse(fs.readFileSync('assets/audio/'+id+'.json'));assert.deepEqual(read('Music_AzaleaTown').channels.map(c=>c.channel),[1,2,3]);assert.ok(read('Music_VioletCity').channels.some(c=>c.channel===4));});
