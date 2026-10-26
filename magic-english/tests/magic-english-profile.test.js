import test from 'node:test';
import assert from 'node:assert/strict';
import {magicEnglishProfile,GUEST_PROFILE_KEY} from '../magic-english-profile.js';
test('personal codes always retain their identity and anonymous browsers never use demo rewards',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const a=magicEnglishProfile(null,storage,()=> '11111111-1111-1111-1111-111111111111');
 assert.equal(a,'magic-guest-11111111-1111-1111-1111-111111111111');assert.equal(magicEnglishProfile(null,storage),a);
 assert.equal(magicEnglishProfile('child001',storage),'child001');assert.equal(values.get(GUEST_PROFILE_KEY),a);
 values.set(GUEST_PROFILE_KEY,'demo');assert.notEqual(magicEnglishProfile(null,storage,()=> '22222222-2222-2222-2222-222222222222'),'demo');
});
