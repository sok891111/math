const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../scripts/learning-client.js'),'utf8');
function fixture({storage={},game='tralalerio'}={}){
 let ms=0,id=0,online=true,fail=false;const intervals=[],listeners={},documentListeners={},sent=[];
 const localStorage=new Proxy(storage,{get(target,key){if(key==='getItem')return k=>target[k]??null;if(key==='setItem')return(k,v)=>target[k]=v;if(key==='removeItem')return k=>delete target[k];return target[key];}});
 const document={visibilityState:'visible',addEventListener:(n,fn)=>documentListeners[n]=fn};
 const window={__BLOCK_USER__:{id:'Kid001'},addEventListener:(n,fn)=>listeners[n]=fn};
 class Clock extends Date{static now(){return Date.parse('2026-10-27T01:00:00Z')+ms;}constructor(...args){super(...(args.length?args:[Clock.now()]));}}
 const ctx={window,document,location:{pathname:'/Kid001/'+game},localStorage,performance:{now:()=>ms},Date:Clock,crypto:{randomUUID:()=>`uuid-${String(++id).padStart(12,'0')}`},navigator:{get onLine(){return online;}},AbortSignal:{timeout(){}},setInterval:fn=>intervals.push(fn),fetch:async(_url,options)=>{if(fail)throw Error('offline');const events=JSON.parse(options.body).events;sent.push(...events);return {ok:true,json:async()=>({acknowledged:events.map(e=>e.id)})};}};
 vm.runInNewContext(source,ctx);
 return {window,document,storage,sent,setOnline(value){online=value;},setFail(value){fail=value;},async tick(n){for(let i=0;i<n;i++){ms+=1000;if(game!=='parent')intervals[0]();await new Promise(r=>setImmediate(r));}},async hidden(){document.visibilityState='hidden';documentListeners.visibilitychange();await new Promise(r=>setImmediate(r));},async visible(){document.visibilityState='visible';documentListeners.visibilitychange();await new Promise(r=>setImmediate(r));},interact(){listeners.pointerdown();}};
}
test('usage excludes hidden and idle time and separates English building',async()=>{
 const f=fixture({game:'magic-english/block-world'});await f.tick(15);assert.equal(f.sent[0].game,'magic-english-world');assert.equal(f.sent[0].seconds,15);
 await f.hidden();const before=f.sent.length;await f.tick(20);assert.equal(f.sent.length,before);
 await f.visible();await f.tick(130);const counted=f.sent.reduce((n,e)=>n+(e.seconds||0),0);assert(counted<=135);const after=f.sent.length;await f.tick(30);assert.equal(f.sent.length,after);
 f.interact();await f.tick(16);assert(f.sent.length>after);
});
test('offline attempts remain durable and acknowledged IDs alone are removed on retry',async()=>{
 const f=fixture();f.setOnline(false);f.window.BlockLearning.record({kind:'speech',result:'retry',phrase:'Hello',transcript:'Hi'});assert.equal(f.window.BlockLearning.pendingCount(),1);assert.equal(f.sent.length,0);
 f.setOnline(true);f.setFail(true);await f.window.BlockLearning.flush();assert.equal(f.window.BlockLearning.pendingCount(),1);
 f.setFail(false);await f.window.BlockLearning.flush();assert.equal(f.window.BlockLearning.pendingCount(),0);assert.equal(f.sent[0].transcript,'Hi');
});
test('an active lease prevents a second visible tab from counting the same time',async()=>{
 const storage={},a=fixture({storage});await a.tick(1);storage['block-learning-active-v1:Kid001']=JSON.stringify({session:'another-active-tab',at:Date.parse('2026-10-27T01:00:00Z')+10000});await a.tick(14);assert.equal(a.sent.filter(e=>e.kind==='usage').length,0);
});

test('parent page resends pending game records without counting parent viewing time',async()=>{
 const f=fixture({game:'parent'});f.setOnline(false);f.window.BlockLearning.record({kind:'math',result:'correct'});await f.tick(20);assert.equal(f.sent.length,0);f.setOnline(true);await f.window.BlockLearning.flush();assert.equal(f.sent.length,1);assert.equal(f.sent[0].kind,'math');
});
test('one damaged local queue entry does not block valid attempts',async()=>{
 const f=fixture();f.storage['block-learning-pending-v1:Kid001:broken']='{broken';f.setOnline(false);f.window.BlockLearning.record({kind:'speech',result:'retry'});assert.equal(f.window.BlockLearning.pendingCount(),1);f.setOnline(true);await f.window.BlockLearning.flush();assert.equal(f.sent.length,1);
});
