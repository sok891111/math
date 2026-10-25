import test from 'node:test';
import assert from 'node:assert/strict';
import {worldEntry,adventureURL,blocksEmpty,shouldShowEmptyNotice,createTravel} from '../world-travel.js';

test('world entry immediately resumes the saved world or creates flat terrain; unreadable saves are protected',()=>{
 const saved={name:'아이의 집',inventory:{counts:{33:4}}};
 assert.deepEqual(worldEntry(null,false),{action:'create',terrain:'flat'});
 const resumed=worldEntry(saved,false);assert.equal(resumed.action,'resume');assert.equal(resumed.save,saved);
 assert.deepEqual(worldEntry(saved,true),{action:'blocked'});
});
test('the return destination preserves the profile and accepts only adventure paths on the same origin',()=>{
 const origin='http://localhost:8000';
 assert.equal(adventureURL('/?user=child',origin),'/?user=child');
 assert.equal(adventureURL('/child/tralalerio/?chapter=2',origin),'/child/tralalerio/?chapter=2');
 for(const value of ['https://elsewhere.test/','javascript:alert(1)','/magic-english/block-world?user=child'])assert.equal(adventureURL(value,origin,'child'),'/magic-english?user=child');
});
test('return guidance stays visible at zero and clears when any block type is received or refunded',()=>{
 assert(blocksEmpty({counts:{}}));assert(blocksEmpty({counts:{5:0,2:0,33:0}}));
 assert(!blocksEmpty({counts:{5:0,33:1}}));assert(!blocksEmpty({counts:{6:1}}));
 const inventory={counts:{5:1}};inventory.counts[5]--;assert(blocksEmpty(inventory));inventory.counts[5]++;assert(!blocksEmpty(inventory));
});
test('travel saves first, waits for the departure animation and ignores repeated taps',async()=>{
 const events=[];let finish;
 const travel=createTravel({save:()=>{events.push('save');return true;},animate:label=>{events.push(label);return new Promise(resolve=>finish=resolve);},navigate:url=>events.push(url)});
 const pending=travel('/block-world/','depart');assert.deepEqual(events,['save','depart']);
 assert.equal(await travel('/block-world/','duplicate'),false);assert.deepEqual(events,['save','depart']);
 finish();assert.equal(await pending,true);assert.deepEqual(events,['save','depart','/block-world/']);
});
test('failed saves prevent both navigation and animation so existing progress is not lost',async()=>{
 let touched=false;const travel=createTravel({save:()=>false,animate:()=>{touched=true;},navigate:()=>{touched=true;}});
 assert.equal(await travel('/','return'),false);assert.equal(touched,false);
});

test('the large empty-stock notice waits for initial rewards and opens once until new stock is collected',()=>{
 const state={started:true,active:true,empty:true,acknowledged:false,ready:true,open:false};
 assert(shouldShowEmptyNotice(state));
 for(const change of [{ready:false},{open:true},{active:false},{acknowledged:true},{empty:false},{started:false}])assert(!shouldShowEmptyNotice({...state,...change}));
 assert(shouldShowEmptyNotice({...state,acknowledged:false}));
});
