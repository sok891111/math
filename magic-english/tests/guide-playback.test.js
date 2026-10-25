import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {playCharacterVoice,cancelActiveVoice,voicePlaybackRate} from '../magic-english-speech.js';
test('clean guide slows down while preserving pitch, and a new voice cancels the old one',async t=>{
 const previous={window:globalThis.window,fetch:globalThis.fetch};const players=[];let dsp=0;t.after(()=>{cancelActiveVoice();Object.assign(globalThis,previous);});
 class Audio{constructor(){players.push(this);}play(){return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){}}
 globalThis.window={Audio,speechSynthesis:{cancel(){}},AudioContext:class{constructor(){dsp++;}}};globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});
 assert(await playCharacterVoice('Slow guide test.','amy',{playbackRate:.85}));assert.equal(players[0].playbackRate,.85);assert.equal(players[0].preservesPitch,true);assert.equal(players[0].webkitPreservesPitch,true);assert.equal(players[0].volume,.8);assert.equal(dsp,0);
 assert(await playCharacterVoice('Next guide test.','amy'));assert(players[0].paused);assert.equal(players[1].playbackRate,1);cancelActiveVoice();assert(players[1].paused);
});
test('blocked native autoplay falls back to the existing context without using a device voice',async t=>{
 const previous={window:globalThis.window,fetch:globalThis.fetch};let starts=0,compressors=0,device=0;t.after(()=>{cancelActiveVoice();Object.assign(globalThis,previous);});
 const node=()=>({connect(){},disconnect(){},start(){starts++;},stop(){},gain:{value:0},playbackRate:{value:1}});
 class Context{state='running';destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}createBufferSource(){return node();}createGain(){return node();}createDynamicsCompressor(){compressors++;throw Error('clean voice must bypass compression');}}
 class Audio{play(){return Promise.reject(Error('Autoplay blocked'));}pause(){}removeAttribute(){}}
 globalThis.window={Audio,AudioContext:Context,speechSynthesis:{cancel(){},speak(){device++;}}};globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});
 assert(await playCharacterVoice('Autoplay fallback guide.','amy',{playbackRate:.85}));assert.equal(starts,1);assert.equal(compressors,0);assert.equal(device,0);
});
test('desk guides use 85 percent playback for both auto and replay; help guide matches the visible answer',()=>{
 const source=fs.readFileSync(new URL('../magic-english-stage1.js',import.meta.url),'utf8');assert(source.includes('guidePlaybackRate:.85'));assert.equal(source.match(/playbackRate:rawStep.guidePlaybackRate\|\|1/g).length,2);assert(source.includes("guideClip: 'My friend. Help, please!'"));assert(!source.includes("guideClip: 'gildong_my_friend_help'"));assert.equal(voicePlaybackRate({playbackRate:.1}),.7);assert.equal(voicePlaybackRate({playbackRate:NaN}),1);
});
