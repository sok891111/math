const {test}=require('node:test'),assert=require('node:assert/strict');
const {createParentAccounts}=require('../lib/parent/accounts.cjs');
function fixture(){const rows=new Map();let now=Date.now();const store={get:async k=>rows.get(k)||null,set:async(k,v)=>{rows.set(k,v);return v;},putOnce:async(k,v)=>{if(rows.has(k))return {created:false,value:rows.get(k)};rows.set(k,v);return {created:true,value:v};},list:async p=>[...rows].filter(([k])=>k.startsWith(p)).map(([,v])=>v)};return {parents:createParentAccounts({store,now:()=>now}),rows,advance:ms=>now+=ms};}
test('parents share one account across siblings, but can never authorize another family',async()=>{
 const {parents,rows}=fixture();await parents.provision('Child1',{parentId:'family-one',password:'secret-one-123'});await parents.provision('Child2',{parentId:'family-one'});await parents.provision('Child3',{parentId:'family-two',password:'secret-two-123'});
 const token=await parents.login('Child1','FAMILY-ONE','secret-one-123');assert((await parents.authorize('Child1',token)).id==='family-one');assert(await parents.authorize('Child2',token));assert.equal(await parents.authorize('Child3',token),null);
 assert(!JSON.stringify([...rows]).includes('secret-one-123'));assert(!JSON.stringify([...rows]).includes(token));
 await assert.rejects(parents.login('Child3','family-one','secret-one-123'),e=>e.status===401);
 await assert.rejects(parents.setAccess('Child3',token,true),e=>e.status===401);
});
test('block/unblock is scoped per child and survives independent reads',async()=>{
 const {parents}=fixture();await parents.provision('Child1',{parentId:'family-one',password:'secret-one-123'});await parents.provision('Child2',{parentId:'family-one'});const token=await parents.login('Child1','family-one','secret-one-123');
 assert.equal((await parents.access('Child1')).blocked,false);await parents.setAccess('Child1',token,true);assert.equal((await parents.access('Child1')).blocked,true);assert.equal((await parents.access('Child2')).blocked,false);await parents.setAccess('Child1',token,false);assert.equal((await parents.access('Child1')).blocked,false);
 await assert.rejects(parents.setAccess('Child1',token,'false'));
});
test('changing or resetting a password revokes previous sessions; logout and expiry revoke access',async()=>{
 const {parents,advance}=fixture();await parents.provision('Child1',{parentId:'family-one',password:'secret-one-123'});const a=await parents.login('Child1','family-one','secret-one-123'),b=await parents.login('Child1','family-one','secret-one-123');
 await assert.rejects(parents.changePassword('Child1',a,'wrong','replacement-123'));assert(await parents.authorize('Child1',a));
 const updated=await parents.changePassword('Child1',a,'secret-one-123','replacement-123');assert.equal(await parents.authorize('Child1',a),null);assert.equal(await parents.authorize('Child1',b),null);assert(await parents.authorize('Child1',updated));
 await parents.logout(updated);assert.equal(await parents.authorize('Child1',updated),null);
 const c=await parents.login('Child1','family-one','replacement-123');await parents.provision('Child1',{parentId:'family-one',password:'admin-reset-123'});assert.equal(await parents.authorize('Child1',c),null);
 const d=await parents.login('Child1','family-one','admin-reset-123');advance(43200001);assert.equal(await parents.authorize('Child1',d),null);
});
test('password policy, cookie-independent authorization and persistent failed-login throttling',async()=>{
 const {parents,advance}=fixture();await assert.rejects(parents.provision('Child1',{parentId:'family-one',password:'short'}));await parents.provision('Child1',{parentId:'family-one',password:'secret-one-123'});
 for(let i=0;i<10;i++)await assert.rejects(parents.login('Child1','family-one','wrong'),e=>e.status===401);
 await assert.rejects(parents.login('Child1','family-one','secret-one-123'),e=>e.status===429);advance(900001);assert(await parents.login('Child1','family-one','secret-one-123'));
});
test('deployed admin access accepts configured secrets only, never legacy defaults',async()=>{
 const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../lib/authHelper.js'),'utf8');const helper=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const previous={VERCEL:process.env.VERCEL,ADMIN_SECRET:process.env.ADMIN_SECRET,ADMIN_PASSWORD:process.env.ADMIN_PASSWORD};
 try{process.env.VERCEL='1';process.env.ADMIN_SECRET='configured-only';delete process.env.ADMIN_PASSWORD;assert(helper.isValidSecret('configured-only'));for(const weak of ['admin','block-admin-2024','sun-admin-2024'])assert.equal(helper.isValidSecret(weak),false);delete process.env.ADMIN_SECRET;assert.equal(helper.isValidSecret('admin'),false);}finally{for(const [key,value]of Object.entries(previous))if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
