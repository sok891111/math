const test=require('node:test'),assert=require('node:assert/strict'),{Readable}=require('node:stream'),fs=require('node:fs'),path=require('node:path');
const {createMagicEnglishApi}=require('../lib/magicEnglishApi.cjs');
const {createMagicStore}=require('../lib/magicEnglishStore.cjs');
function fixture(){const values=new Map();const store={get:async key=>values.get(key)||null,list:async prefix=>[...values].filter(([key])=>key.startsWith(prefix)).map(([,v])=>v),putOnce:async(key,value)=>{if(values.has(key))return {created:false,value:values.get(key)};values.set(key,value);return {created:true,value};}};let transcript='bus',calls=[];const api=createMagicEnglishApi({store,env:{ELEVENLABS_API_KEY:'unit-only-key',MAGIC_ENGLISH_SIGNING_SECRET:'unit-signing'},fetchImpl:async(url,options)=>{calls.push({url,options});return url.includes('speech-to-text')?{ok:true,json:async()=>({text:transcript})}:{ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};}});
 async function request(action,body,method='POST',handler=api){const req=Readable.from(body==null?[]:[Buffer.isBuffer(body)?body:Buffer.from(JSON.stringify(body))]);req.method=method;req.url='/api/magic-english/'+action;req.headers={};const res={statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},end(value){this.body=value;}};await handler(req,res);return {status:res.statusCode,body:res.headers['Content-Type']==='application/json'?JSON.parse(res.body):res.body};}
 return {request,calls,values,store,setTranscript:value=>transcript=value};}
const wav=()=>{const result=Buffer.alloc(6400);result.write('RIFF');return result;};
test('A–D and daily speech still assess learning without issuing any resources or reward tokens',async()=>{
 const f=fixture();for(const [target,text]of [['bus','Here is the bus.'],['s3_class','This is my class.'],['s3_daily_book','I like this book.'],['s4_boss_water','I would like water, please.']]){f.setTranscript(text);const answer=await f.request('assess-pronunciation?word='+target+'&userId=child001&attemptId=learning-'+target.replaceAll('_','-'),wav());assert.equal(answer.status,200);assert(answer.body.passed);assert.equal(answer.body.quality,'complete');for(const key of ['rewardToken','blocks','blockName','weaponReward','weaponName','quantity'])assert.equal(answer.body[key],undefined,key);}
 f.setTranscript('cat');const failed=await f.request('assess-pronunciation?word=s3_cat&userId=child001&attemptId=short',wav());assert.equal(failed.body.passed,false);assert.equal(failed.body.rewardToken,undefined);assert(![...f.values.keys()].some(k=>k.startsWith('reward:')));
});
test('all retired Minecraft reward endpoints reject old clients and preserve the historical ledger',async()=>{
 const f=fixture();const old={userId:'child001',rewardId:'speech:old',blocks:[{blockId:5,quantity:2}]};f.values.set('reward:historical',old);
 for(const [action,method]of [['rewards','POST'],['block-world/rewards','POST'],['block-world/rewards?userId=child001','GET'],['block-world/catalog','GET']]){const result=await f.request(action,{userId:'child001',stage:1,type:'clear',token:'old-token'},method);assert.equal(result.status,410);assert.equal(result.body.retired,true);}
 assert.deepEqual([...f.values],[['reward:historical',old]]);
});
test('new voice lines retain their ElevenLabs cast and durable cache across handler instances',async()=>{
 const f=fixture();const first=await f.request('character-voice',{character:'ringo',text:'Beep! A new clue!'});assert.equal(first.status,200);assert.equal((await f.request('character-voice',{character:'ringo',text:'Beep! A new clue!'})).status,200);assert.equal(f.calls.length,1);const cold=createMagicEnglishApi({store:f.store,env:{ELEVENLABS_API_KEY:'unit-only-key'},fetchImpl:async()=>{throw Error('cache miss');}});assert.equal((await f.request('character-voice',{character:'ringo',text:'Beep! A new clue!'},'POST',cold)).status,200);const payload=JSON.parse(f.calls[0].options.body);assert.equal(payload.voice_settings.stability,.9);
 const configured=await f.request('assess-pronunciation',null,'GET');assert.equal(configured.body.configured,true);assert(!JSON.stringify(configured.body).includes('unit-only-key'));
});
test('production storage refuses filesystem-only fallback when Supabase is missing',async()=>{
 const previous={SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_ANON_KEY:process.env.SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY};for(const key of Object.keys(previous))delete process.env[key];
 try{await assert.rejects(createMagicStore({vercel:true}).get('missing'),/Supabase/);}finally{for(const [key,value]of Object.entries(previous))if(value!==undefined)process.env[key]=value;}
});
test('English-only deployment keeps archived Minecraft source but publishes no playable world or resource menu',()=>{
 const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
 assert(fs.existsSync(path.join(root,'magic-english/block-world/app.js')));assert(fs.existsSync(path.join(root,'magic-english/block-world/index.html')));
 for(const file of ['block-world/index.html','block-world/app.js','magic-english-heart-summary.js','magic-english-block-world.js'])assert(!fs.existsSync(path.join(root,'public/magic-english',file)),file);
 assert(read('public/magic-english/index.html').includes('<base href="/magic-english/">'));
 assert(!/open-hearts-menu|mode-link-block|open-block-world/.test(read('public/magic-english/index.html')));
 assert(!/queueReward|flushRewards|rewardToken|blockWorldUI/.test(read('public/magic-english/magic-english-stage1.js')));
});
test('learning milestones and the A badge preserve saved construction, coins and historical receipts',async()=>{
 const {createInitialMagicEnglishState,parseMagicEnglishState,recordLearningMilestone,grantSpeakRewardOnce,grantStage1ClearReward}=await import('../magic-english/magic-english-storage.js');const s=createInitialMagicEnglishState();s.blockWorld.coins=128;s.blockWorld.unlockedBlocks=['dirt'];s.rewardReceipts.old={id:'old',coins:100};s.learning={pending:[{id:'old',type:'speech',token:'legacy'}],lastWeapon:'legacy-sword'};const old=structuredClone(s.blockWorld),receipt=structuredClone(s.rewardReceipts.old);
 recordLearningMilestone(s,'hello','대화 완료');grantSpeakRewardOnce(s,'legacy-call',20,'인사 완료');grantStage1ClearReward(s);grantStage1ClearReward(s);assert.deepEqual(s.blockWorld,old);assert.deepEqual(s.rewardReceipts.old,receipt);assert.deepEqual(s.alphabetPieces,['A']);assert.equal(s.stage,'stage1_complete');assert(parseMagicEnglishState(JSON.stringify(s)).ok);assert.equal(s.learning.pending.length,1);
});
