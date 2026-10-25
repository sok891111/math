import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {Readable} from 'node:stream';import {mkdtemp,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {CHARACTER_VOICES,dialogueCharacter,clipCharacter,characterRequest} from '../character-voices.js';
import {speakEnglishPhrase,cancelActiveVoice} from '../magic-english-speech.js';
const {createCharacterVoiceApi}=createRequire(import.meta.url)('../tools/character-voice-api.cjs');

test('first, repeat and guide dialogue keep explicit characters, including mixed-speaker pages',()=>{
 for(const [speaker,role]of [['에이미 (Amy)','amy'],['링고','ringo'],['악당 미스터 미스스펠','misspell'],['친절한 미국 여행객','traveler'],['카페 점원 (Cafe Staff)','cafe'],['기장님','pilot'],['입국 심사관','guard'],['미국 꼬마 친구','kid'],['버스 기사님','staff']])assert.equal(dialogueCharacter(speaker),role);
 assert.equal(dialogueCharacter('에이미 & 링고','에이미: “같이 찾아보자!”'),'amy');assert.equal(dialogueCharacter('에이미 & 링고','링고: “분석 완료!”'),'ringo');
 assert.equal(clipCharacter({id:'ringo_intro_a',voice:'Fena'}),'ringo');assert.equal(clipCharacter({id:'misspell_exit_tixe',voice:'Bill'}),'misspell');
 assert.equal(CHARACTER_VOICES.ringo.effect,'robot');assert.equal(CHARACTER_VOICES.misspell.effect,'villain');assert.equal(CHARACTER_VOICES.amy.voice,'Fena');
 assert.equal(characterRequest('amy','You’re welcome!').text,"You're welcome!");assert.throws(()=>characterRequest('custom','Hello'));assert.throws(()=>characterRequest('amy','안녕'));
});
test('new repeated lines use the pinned ElevenLabs actor and cache the same audio instead of resynthesizing',async t=>{
 const dataDir=await mkdtemp(path.join(os.tmpdir(),'character-voice-'));t.after(()=>rm(dataDir,{recursive:true,force:true}));const calls=[];
 const api=createCharacterVoiceApi({dataDir,getApiKey:()=> 'unit-test-placeholder',fetchImpl:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};}});
 async function request(character,text){let status,body;const req=Readable.from([Buffer.from(JSON.stringify({character,text}))]);req.method='POST';await api(req,{writeHead:code=>status=code,end:value=>body=value},new URL('http://local/api/magic-english/character-voice'));return {status,body};}
 assert.equal((await request('misspell','My spell is broken!')).status,200);assert.equal((await request('misspell','My spell is broken!')).status,200);assert.equal(calls.length,1);assert(calls[0].url.includes(CHARACTER_VOICES.misspell.voiceId));
 await request('amy','How are you today?');assert(calls[1].url.includes(CHARACTER_VOICES.amy.voiceId));await request('ringo','How are you today?');assert.equal(calls[2].body.voice_settings.stability,.9);
 assert.equal((await request('invented','Hello')).status,400);
});
test('first clips, repeated dialogue and listen buttons never invoke the device speech synthesizer',async t=>{
 const previous={window:globalThis.window,fetch:globalThis.fetch};t.after(()=>{cancelActiveVoice();globalThis.window=previous.window;globalThis.fetch=previous.fetch;});
 let deviceCalls=0,oscillators=0;const requests=[];
 const node=()=>({connect(){},disconnect(){},start(){},stop(){},gain:{value:0},frequency:{value:0},Q:{value:0},playbackRate:{value:1}});
 class Context{state='running';destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}createBufferSource(){return node();}createBiquadFilter(){return node();}createGain(){return node();}createOscillator(){oscillators++;return node();}}
 globalThis.window={AudioContext:Context,speechSynthesis:{cancel(){},speak(){deviceCalls++;}}};globalThis.fetch=async(url,options)=>{requests.push({url,body:options?.body&&JSON.parse(options.body)});return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};};
 await speakEnglishPhrase('amy_hello_gildong');await speakEnglishPhrase('Want to travel together?',{character:'amy'});await speakEnglishPhrase('ringo_intro_a');await speakEnglishPhrase('My spell is broken!',{character:'misspell'});
 assert.equal(deviceCalls,0);assert.equal(oscillators,1);assert(requests.some(r=>r.body?.character==='amy'));assert(requests.some(r=>r.body?.character==='misspell'));
 globalThis.fetch=async()=>({ok:false});assert.equal(await speakEnglishPhrase('New line',{character:'ringo'}),false);assert.equal(deviceCalls,0,'service failure must not silently change the actor');
});
