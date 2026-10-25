import test from 'node:test';import assert from 'node:assert/strict';
import {prepareSpeechSamples} from '../magic-english-audio-input.js';import {assessLearningSpeech} from '../magic-english-learning.js';
test('a brief Bus or Big survives long silence that previously failed whole-recording volume checks',()=>{
 const input=new Float32Array(16000*7);for(let i=16000;i<16000+2400;i++)input[i]=Math.sin(i*.2)*.025;
 const oldRms=Math.sqrt(input.reduce((sum,x)=>sum+x*x,0)/input.length);assert(oldRms<.008);
 const prepared=prepareSpeechSamples(input,16000);assert(prepared.rms>.003);assert(prepared.samples.length<16000);assert(prepared.samples.length>2400);
 for(const [target,transcripts]of [['bus',['Here is the bus.','Here is the but.','Here is the 버스.']],['big',['It is a big bus.',"It's a big bus."]],['bag',['This is my bag.','This is my 배그.']]])for(const transcript of transcripts)assert(assessLearningSpeech(transcript,target).passed,target+': '+transcript);
});
test('silence remains unsuccessful; quiet noise does not create an English answer',()=>{
 const silent=prepareSpeechSamples(new Float32Array(16000),16000);assert.equal(silent.rms,0);assert(!assessLearningSpeech('','bus').passed);assert(!assessLearningSpeech('apple','big').passed);
});
