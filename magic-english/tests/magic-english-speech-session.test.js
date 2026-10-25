import test from 'node:test';import assert from 'node:assert/strict';
import {createSpeechRecognizer} from '../magic-english-speech.js';
import {advanceStage2,STAGE2_CHECKLIST} from '../magic-english-stage2.js';import {createInitialMagicEnglishState,parseMagicEnglishState} from '../magic-english-storage.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){const events=[],requests=[];let recorder,releaseMedia,tracksStopped=0,fetchReply;
 const stream={getTracks:()=>[{stop(){tracksStopped++;}}]};
 const deps={getUserMedia:async()=>stream,convertAudio:async()=>({wavBlob:new Blob([new Uint8Array(6400)]),rms:.02}),createRecorder:()=>recorder={state:'inactive',mimeType:'audio/mp4',start(){this.state='recording';},stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob([new Uint8Array(400)])});this.onstop?.();});}},fetch:async(url)=>{requests.push(url);if(fetchReply)return fetchReply();return {ok:true,json:async()=>({passed:true,quantity:1,target:new URL(url,'http://local').searchParams.get('word')})};}};
 const callbacks={target:'bus',attemptId:'unit-bus',onPreparing:()=>events.push('preparing'),onStart:()=>events.push('recording'),onProcessing:()=>events.push('processing'),onResult:(_t,_a,result)=>events.push(result.target),onError:e=>events.push(e.code),onEnd:()=>events.push('end')};
 return {deps,events,requests,callbacks,get recorder(){return recorder;},get tracksStopped(){return tracksStopped;},setPendingMedia(){deps.getUserMedia=()=>new Promise(resolve=>releaseMedia=()=>resolve(stream));},releaseMedia(){releaseMedia();},setFetch(fn){fetchReply=fn;}};
}
test('Speak → Complete sends one local recorder WAV, emits processing and applies every Stage 2 target',async()=>{
 for(const target of ['bus','bag','big','full','where_bus','big_bus','my_bag']){const f=fixture(),r=createSpeechRecognizer(f.deps);await r.start({...f.callbacks,target});assert.equal(r.getPhase(),'recording');r.stop();await tick();await tick();assert.deepEqual(f.events,['preparing','recording','processing',target,'end']);assert.equal(f.requests.length,1);assert.equal(r.getPhase(),'idle');assert.equal(f.tracksStopped,1);r.cancel();}
});
test('repeated taps during permission acquisition cannot open overlapping microphones',async()=>{
 const f=fixture();f.setPendingMedia();const r=createSpeechRecognizer(f.deps),first=r.start(f.callbacks);assert.equal(r.getPhase(),'requesting');assert.equal(await r.start(f.callbacks),false);f.releaseMedia();await first;r.stop();await tick();assert.equal(f.requests.length,1);
});
test('closing the dialogue discards delayed permission and old analysis callbacks',async()=>{
 const f=fixture();f.setPendingMedia();const r=createSpeechRecognizer(f.deps),first=r.start(f.callbacks);r.cancel();f.releaseMedia();assert.equal(await first,false);assert.equal(f.tracksStopped,1);assert.deepEqual(f.events,['preparing']);
 const next=fixture();let resolve;next.setFetch(()=>new Promise(r=>resolve=r));const second=createSpeechRecognizer(next.deps);await second.start(next.callbacks);second.stop();await tick();assert.equal(await second.start(next.callbacks),false);second.cancel();resolve({ok:true,json:async()=>({passed:true,target:'bus'})});await tick();assert(!next.events.includes('bus'));assert(!next.events.includes('end'));
});
test('HTTP failures and microphone errors always end busy state and allow a later attempt',async()=>{
 const f=fixture();f.setFetch(async()=>({ok:false,json:async()=>({error:'offline'})}));const r=createSpeechRecognizer(f.deps);await r.start(f.callbacks);r.stop();await tick();assert(f.events.includes('server-error'));assert.equal(r.getPhase(),'idle');await r.start(f.callbacks);f.recorder.onerror();assert.equal(r.getPhase(),'idle');r.cancel();
});
test('Stage 2 completion callbacks cover discovery, boarding, driver, signs, boss/B, completion and reload',()=>{
 const state=createInitialMagicEnglishState();state.map='BusStop';assert(!advanceStage2(state,'board'));assert(!advanceStage2(state,'recover'));assert(!advanceStage2(state,'complete'));
 for(const word of ['bus','bag','big'])assert(advanceStage2(state,'word',word));assert(advanceStage2(state,'board'));state.map='BusInterior';assert(advanceStage2(state,'driver'));assert(advanceStage2(state,'alight'));state.map='NextStop';
 for(const word of ['bus','bag','big'])assert(advanceStage2(state,'sign',word));assert(advanceStage2(state,'recover'));assert(advanceStage2(state,'recover'));assert.equal(state.alphabetPieces.filter(p=>p==='B').length,1);assert(advanceStage2(state,'complete'));const restored=parseMagicEnglishState(JSON.stringify(state));assert(restored.ok);for(const item of STAGE2_CHECKLIST)assert(item.isDone(restored.state),item.id);
});
