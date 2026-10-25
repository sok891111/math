import test from 'node:test';import assert from 'node:assert/strict';
import {conversationPages,CONVERSATION_FOLLOWUPS,CONVERSATION_TARGETS} from '../magic-english-conversations.js';
import {assessLearningSpeech,SPEECH_TARGETS} from '../magic-english-learning.js';
test('single-turn NPC and clue practice becomes 2–5 player Speak turns with reactions between answers',()=>{
 const lengths=new Set();for(const key of Object.keys(CONVERSATION_FOLLOWUPS)){let completed=0;const finish=()=>completed++;const pages=conversationPages([{type:'npc',speaker:'카페 직원',text:'Hello!'},{type:'speak',targetKey:key,targetPhrase:SPEECH_TARGETS[key],onPass:finish},{type:'npc',text:'See you!'}],'친구');const speaks=pages.filter(p=>p.type==='speak');lengths.add(speaks.length);assert(speaks.length>=2&&speaks.length<=5,key);assert.equal(completed,0);assert.equal(speaks[0].onPass,undefined);for(const p of speaks.slice(1,-1))assert.equal(p.onPass,undefined);assert.equal(speaks.at(-1).onPass,finish);speaks.at(-1).onPass();assert.equal(completed,1);for(let i=0;i<speaks.length;i++){assert.equal(speaks[i].conversationTurn,i+1);assert.equal(speaks[i].conversationTotal,speaks.length);}for(let i=1;i<speaks.length;i++)assert.equal(pages[pages.indexOf(speaks[i])-1].type,'npc');}
 assert.deepEqual([...lengths].sort(),[2,3,4,5]);
});
test('existing staff conversations and boss rounds preserve their success callbacks and sequence',()=>{
 const first=()=>{},last=()=>{};for(const count of [2,3,5]){const pages=Array.from({length:count},(_,i)=>({type:'speak',targetKey:'apple',onPass:i===0?first:last,bossBattle:{hp:count-i}}));const expanded=conversationPages(pages);assert.equal(expanded.length,count);assert.equal(expanded[0].onPass,first);assert.equal(expanded.at(-1).onPass,last);assert.equal(expanded[0].bossBattle.hp,count);}
 assert.deepEqual(conversationPages(['A story without speech.']),['A story without speech.']);
});
test('all follow-up answers share exact browser/server targets and require sentence structure',()=>{
 for(const [key,p]of Object.entries(CONVERSATION_TARGETS)){assert.equal(SPEECH_TARGETS[key],p.text);assert.equal(assessLearningSpeech(p.text,key).quality,'complete',key);assert(!assessLearningSpeech('',key).passed);assert(!assessLearningSpeech(p.required.at(-1),key).passed);assert(!assessLearningSpeech('unrelated words here',key).passed);assert(!assessLearningSpeech([...p.required].reverse().join(' '),key).passed);}
});

test('short social replies also require the complete phrase, not one recognized word',()=>{
 for(const key of ['i_am_okay','good_morning','i_am_gildong','yes_please','thank_you','help_please','where_bus','full']){assert(assessLearningSpeech(SPEECH_TARGETS[key],key).passed,key);assert(!assessLearningSpeech(SPEECH_TARGETS[key].split(' ').at(-1),key).passed,key);}
 assert(assessLearningSpeech("Let's go together.",'go_together').passed);
});
