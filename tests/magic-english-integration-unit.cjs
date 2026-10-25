const test=require('node:test'),assert=require('node:assert/strict'),{Readable}=require('node:stream'),fs=require('node:fs'),path=require('node:path');
const {createMagicEnglishApi}=require('../lib/magicEnglishApi.cjs');
const {createMagicStore}=require('../lib/magicEnglishStore.cjs');
function fixture(){const values=new Map();const store={get:async key=>values.get(key)||null,list:async prefix=>[...values].filter(([key])=>key.startsWith(prefix)).map(([,v])=>v),putOnce:async(key,value)=>{if(values.has(key))return {created:false,value:values.get(key)};values.set(key,value);return {created:true,value};}};let transcript='bus',calls=[];const api=createMagicEnglishApi({store,env:{ELEVENLABS_API_KEY:'unit-only-key'},fetchImpl:async(url,options)=>{calls.push({url,options});return url.includes('speech-to-text')?{ok:true,json:async()=>({text:transcript})}:{ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};}});
 async function request(action,body,method='POST',handler=api){const req=Readable.from(body==null?[]:[Buffer.isBuffer(body)?body:Buffer.from(JSON.stringify(body))]);req.method=method;req.url='/api/magic-english/'+action;req.headers={};const res={statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},end(value){this.body=value;}};await handler(req,res);return {status:res.statusCode,body:res.headers['Content-Type']==='application/json'?JSON.parse(res.body):res.body};}
 return {request,calls,values,store,setTranscript:value=>transcript=value};}
const wav=()=>{const result=Buffer.alloc(6400);result.write('RIFF');return result;};
test('Vercel API keeps Bus and Big assessment, claims, duplicate rewards and profiles connected',async()=>{
 const f=fixture();for(const [target,text]of [['bus','bus'],['big','big'],['bus','buzz']]){f.setTranscript(text);const result=await f.request('assess-pronunciation?word='+target+'&userId=child001&attemptId='+target+'-'+text,wav());assert.equal(result.status,200);assert(result.body.passed);const grant={userId:'child001',type:'speech',token:result.body.rewardToken};assert((await f.request('rewards',grant)).body.created);assert.equal((await f.request('rewards',grant)).body.created,false);assert.equal((await f.request('rewards',{...grant,userId:'other001'})).status,400);}
 const rewards=await f.request('block-world/rewards?userId=child001',null,'GET');assert.equal(rewards.body.rewards.length,3);assert.deepEqual(rewards.body.rewards[0].blocks,[{blockId:5,quantity:1}]);assert.equal((await f.request('block-world/rewards?userId=other001',null,'GET')).body.rewards.length,0);
 assert(f.calls[0].options.body.getAll('keyterms').includes('Bus'));assert.equal((await f.request('rewards',{type:'clear',stage:2,userId:'child001'})).status,400);
});
test('new voice lines retain their ElevenLabs cast and durable cache across handler instances',async()=>{
 const f=fixture();const first=await f.request('character-voice',{character:'ringo',text:'Beep! A new clue!'});assert.equal(first.status,200);assert.equal((await f.request('character-voice',{character:'ringo',text:'Beep! A new clue!'})).status,200);assert.equal(f.calls.length,1);const cold=createMagicEnglishApi({store:f.store,env:{ELEVENLABS_API_KEY:'unit-only-key'},fetchImpl:async()=>{throw Error('cache miss');}});assert.equal((await f.request('character-voice',{character:'ringo',text:'Beep! A new clue!'},'POST',cold)).status,200);const payload=JSON.parse(f.calls[0].options.body);assert.equal(payload.voice_settings.stability,.9);
 const configured=await f.request('assess-pronunciation',null,'GET');assert.equal(configured.body.configured,true);assert(!JSON.stringify(configured.body).includes('unit-only-key'));
});
test('production storage refuses filesystem-only fallback when Supabase is missing',async()=>{
 const previous={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_ANON_KEY:process.env.SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY};for(const key of Object.keys(previous))delete process.env[key];
 try{await assert.rejects(createMagicStore({vercel:true}).get('missing'),/Supabase/);}finally{for(const [key,value]of Object.entries(previous))if(value!==undefined)process.env[key]=value;}
});
test('deployment contains the gate, route tracing, nested renderer and latest story assets, without private tools',()=>{
 const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
 assert(read('pages/[userId]/index.js').includes("id: 'magic-english'"));assert(read('next.config.js').includes("'/[userId]/magic-english'"));
 for(const file of ['block-world/vendor/three.module.js','magic-english-stage2.js','character-audio-manifest.js','assets/stage2/page05.jpg'])assert(fs.existsSync(path.join(root,'public/magic-english',file)),file);
 for(const file of ['server.cjs','.block-world-data','tools/character-voice-api.cjs','.env.local'])assert(!fs.existsSync(path.join(root,'public/magic-english',file)),file);
 assert(read('public/magic-english/index.html').includes('<base href="/magic-english/">'));
 assert(read('public/magic-english/block-world/reward-client.js').includes('/api/magic-english/block-world/rewards'));
});
