import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,rm,readdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
const {createBlockServer}=createRequire(import.meta.url)('../tools/serve-block-world.cjs');
const key='unit-test-reward-key';
async function fixture(t,apiKey=key){const dataDir=await mkdtemp(path.join(tmpdir(),'block-rewards-')),server=createBlockServer({dataDir,apiKey});server.listen(0,'127.0.0.1');await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;t.after(async()=>{await new Promise(resolve=>server.close(resolve));await rm(dataDir,{recursive:true,force:true});});return {dataDir,server,base,post:(reward,token=key)=>fetch(base+'/api/magic-english/block-world/rewards',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(reward)})};}
const reward=(id='stage1',userId='child')=>({userId,rewardId:id,blocks:[{blockId:1,quantity:10},{blockId:6,quantity:3}],source:'magic-english',reason:'A 조각 획득'});
test('API publishes catalog and requires server authentication for writes',async t=>{
 const f=await fixture(t);const catalog=await (await fetch(f.base+'/api/magic-english/block-world/catalog')).json();assert.equal(catalog.blocks.length,32);assert.deepEqual(catalog.starter,{});assert.equal((await f.post(reward(),'wrong')).status,401);assert.equal((await fetch(f.base+'/api/magic-english/block-world/rewards?userId=child')).status,200);assert.equal((await fetch(f.base+'/.block-world-data/anything.json')).status,403);
});
test('missing write key fails closed while offline game and empty reward reads still work',async t=>{
 const f=await fixture(t,'');assert.equal((await f.post(reward())).status,503);assert.equal((await fetch(f.base+'/block-world/')).status,200);assert.deepEqual((await (await fetch(f.base+'/api/magic-english/block-world/rewards?userId=child')).json()).rewards,[]);
});
test('concurrent retries persist one grant; conflicting IDs and users are handled independently',async t=>{
 const f=await fixture(t);const responses=await Promise.all(Array.from({length:12},()=>f.post(reward())));assert.equal(responses.filter(r=>r.status===201).length,1);assert.equal(responses.filter(r=>r.status===200).length,11);const read=await (await fetch(f.base+'/api/magic-english/block-world/rewards?userId=child')).json();assert.equal(read.rewards.length,1);assert.equal((await f.post({...reward(),blocks:[{blockId:1,quantity:99}]})).status,409);assert.equal((await f.post(reward('stage1','other'))).status,201);assert.equal((await readdir(f.dataDir)).filter(name=>name.endsWith('.json')).length,2);
 const restarted=createBlockServer({dataDir:f.dataDir,apiKey:key});restarted.listen(0,'127.0.0.1');await once(restarted,'listening');try{const records=await (await fetch('http://127.0.0.1:'+restarted.address().port+'/api/magic-english/block-world/rewards?userId=child')).json();assert.equal(records.rewards.length,1);}finally{await new Promise(resolve=>restarted.close(resolve));}
});
test('invalid payloads never enter the ledger and oversized JSON is rejected',async t=>{
 const f=await fixture(t);for(const value of [{...reward(),blocks:[{blockId:32,quantity:1}]},{...reward(),blocks:[{blockId:1,quantity:-1}]},{...reward(),rewardId:'../bad'},{...reward(),userId:''}])assert.equal((await f.post(value)).status,400);const large=await fetch(f.base+'/api/magic-english/block-world/rewards',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({...reward(),reason:'a'.repeat(40000)})});assert.equal(large.status,413);assert.deepEqual(await readdir(f.dataDir),[]);assert.equal((await fetch(f.base+'/api/magic-english/block-world/rewards')).status,400);
});
test('unreadable ledgers fail rather than silently replacing existing reward history',async t=>{
 const f=await fixture(t);assert.equal((await f.post(reward())).status,201);const [name]=await readdir(f.dataDir);await writeFile(path.join(f.dataDir,name),'broken');assert.equal((await f.post(reward('stage2'))).status,500);assert.equal((await fetch(f.base+'/api/magic-english/block-world/rewards?userId=child')).status,500);
});
