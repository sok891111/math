const test=require('node:test'),assert=require('node:assert/strict'),{Readable}=require('node:stream'),fs=require('node:fs'),path=require('node:path');
const {createMagicEnglishApi}=require('../lib/magicEnglishApi.cjs');
const {createMagicStore}=require('../lib/magicEnglishStore.cjs');
function fixture(){const values=new Map();const store={get:async key=>values.get(key)||null,list:async prefix=>[...values].filter(([key])=>key.startsWith(prefix)).map(([,v])=>v),putOnce:async(key,value)=>{if(values.has(key))return {created:false,value:values.get(key)};values.set(key,value);return {created:true,value};}};let transcript='bus',calls=[];const api=createMagicEnglishApi({store,env:{ELEVENLABS_API_KEY:'unit-only-key',MAGIC_ENGLISH_SIGNING_SECRET:'unit-signing'},fetchImpl:async(url,options)=>{calls.push({url,options});return url.includes('speech-to-text')?{ok:true,json:async()=>({text:transcript})}:{ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};}});
 async function request(action,body,method='POST',handler=api){const req=Readable.from(body==null?[]:[Buffer.isBuffer(body)?body:Buffer.from(JSON.stringify(body))]);req.method=method;req.url='/api/magic-english/'+action;req.headers={};const res={statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},end(value){this.body=value;}};await handler(req,res);return {status:res.statusCode,body:res.headers['Content-Type']==='application/json'?JSON.parse(res.body):res.body};}
 return {request,calls,values,store,setTranscript:value=>transcript=value};}
const wav=()=>{const result=Buffer.alloc(6400);result.write('RIFF');return result;};
test('Vercel API keeps Bus and Big assessment, claims, duplicate rewards and profiles connected',async()=>{
 const f=fixture();for(const [target,text]of [['bus','Here is the bus.'],['big','It is a big bus.'],['bus','Here is the buzz.']]){f.setTranscript(text);const result=await f.request('assess-pronunciation?word='+target+'&userId=child001&attemptId='+target+'-'+text.toLowerCase().replace(/[^a-z]/g,''),wav());assert.equal(result.status,200);assert(result.body.passed);const grant={userId:'child001',type:'speech',token:result.body.rewardToken};assert((await f.request('rewards',grant)).body.created);assert.equal((await f.request('rewards',grant)).body.created,false);assert.equal((await f.request('rewards',{...grant,userId:'other001'})).status,400);}
 const rewards=await f.request('block-world/rewards?userId=child001',null,'GET');assert.equal(rewards.body.rewards.length,3);assert.equal(rewards.body.rewards[0].blocks[0].quantity,2);assert.notEqual(rewards.body.rewards[0].blocks[0].blockId,32);assert.equal((await f.request('block-world/rewards?userId=other001',null,'GET')).body.rewards.length,0);
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

test('complete sentence rewards contain a server-selected sword, while partial answers and retries cannot forge extra weapons',async()=>{
 const f=fixture();let winning='';for(let i=0;i<1000;i++){const id='perfect-'+i;if(require('node:crypto').createHmac('sha256','unit-signing').update('weapon-drop:child001:'+id).digest().readUInt32BE(0)%100<20){winning=id;break;}}assert(winning);f.setTranscript('Thank you!');const perfect=await f.request('assess-pronunciation?word=thank_you&userId=child001&attemptId='+winning,wav());assert.equal(perfect.body.quality,'complete');assert(perfect.body.weaponName);
 const claim={userId:'child001',type:'speech',token:perfect.body.rewardToken,items:[{itemId:'diamond_sword',quantity:100}]};const first=await f.request('rewards',claim);assert.deepEqual(first.body.reward.items,[perfect.body.weaponReward]);assert.deepEqual(first.body.reward.blocks,perfect.body.blocks);assert.equal((await f.request('rewards',claim)).body.created,false);
 f.setTranscript('I see airplane');const partial=await f.request('assess-pronunciation?word=airplane&userId=child001&attemptId=partial-greeting',wav());assert.equal(partial.body.quality,'partial');assert.equal(partial.body.weaponName,undefined);const gift=await f.request('rewards',{...claim,token:partial.body.rewardToken});assert.equal(gift.body.reward.items,undefined);
});

test('follow-up conversation targets are accepted and assessed by the production speech API',async()=>{
 const f=fixture();f.setTranscript('Please help me carry my bag.');const answer=await f.request('assess-pronunciation?word=carry_bag&userId=child001&attemptId=follow-up',wav());assert.equal(answer.status,200);assert.equal(answer.body.quality,'complete');assert(answer.body.rewardToken);
 f.setTranscript('bag');const rejected=await f.request('assess-pronunciation?word=carry_bag&userId=child001&attemptId=follow-up-word',wav());assert.equal(rejected.body.passed,false);assert.equal(rejected.body.quantity,0);
});

test('most complete answers grant random blocks without a weapon and retries preserve the exact reward',async()=>{
 const f=fixture();f.setTranscript('Thank you!');let losing='';for(let i=0;i<1000;i++){const id='no-sword-'+i;if(require('node:crypto').createHmac('sha256','unit-signing').update('weapon-drop:child001:'+id).digest().readUInt32BE(0)%100>=20){losing=id;break;}}
 const action='assess-pronunciation?word=thank_you&userId=child001&attemptId='+losing;const a=await f.request(action,wav()),b=await f.request(action,wav());assert.equal(a.body.quality,'complete');assert.equal(a.body.weaponReward,undefined);assert.deepEqual(a.body.blocks,b.body.blocks);
 const claim={userId:'child001',type:'speech',token:a.body.rewardToken,blocks:[{blockId:33,quantity:999}],items:[{itemId:'diamond_sword',quantity:99}]};const gift=await f.request('rewards',claim);assert.equal(gift.body.reward.items,undefined);assert.deepEqual(gift.body.reward.blocks,a.body.blocks);assert.equal((await f.request('rewards',claim)).body.created,false);
});
test('new milestone rewards stay within the five basics and already-promised iron rewards remain unchanged',async()=>{
 const f=fixture();const prefix='reward:'+require('node:crypto').createHash('sha256').update('child001').digest('hex')+':';for(const target of ['airplane','apple','ask','help_please'])f.values.set(prefix+'setup-'+target,{userId:'child001',rewardId:'setup-'+target,reason:'말하기:'+target,blocks:[{blockId:5,quantity:1}]});
 const fragment=await f.request('rewards',{userId:'child001',type:'fragment',stage:1});assert.deepEqual(fragment.body.reward.blocks,[{blockId:3,quantity:1}]);const clear=await f.request('rewards',{userId:'child001',type:'clear',stage:1});assert(clear.body.reward.blocks.every(b=>[1,2,3,5,6].includes(b.blockId)));
 const legacy={...fragment.body.reward,blocks:[{blockId:33,quantity:1}]};f.values.set(prefix+'stage1:fragment:v2',legacy);const retry=await f.request('rewards',{userId:'child001',type:'fragment',stage:1});assert.equal(retry.body.created,false);assert.deepEqual(retry.body.reward.blocks,[{blockId:33,quantity:1}]);
});

test('Stage 3 verifies C speech claims, Coco rescue prerequisites and introduction before one-time clear rewards',async()=>{
 const f=fixture(),userId='stage3-child';
 assert.equal((await f.request('rewards',{userId,stage:3,type:'fragment'})).status,400);
 const {STAGE3_REQUIRED,STAGE3_PRACTICE}=await import('../magic-english/magic-english-stage3-learning.js');
 for(const key of STAGE3_REQUIRED){f.setTranscript(STAGE3_PRACTICE[key].text);const answer=await f.request('assess-pronunciation?word='+key+'&userId='+userId+'&attemptId=test-'+key.replaceAll('_','-'),wav());assert.equal(answer.status,200);assert(answer.body.passed);assert.equal((await f.request('rewards',{userId,type:'speech',token:answer.body.rewardToken})).status,200);}
 f.setTranscript('Come here!');assert.equal((await f.request('assess-pronunciation?word=s3_call_coco&userId='+userId+'&attemptId=missing-coco',wav())).body.passed,false);
 const fragment=await f.request('rewards',{userId,stage:3,type:'fragment'});assert.equal(fragment.status,200);assert.deepEqual(fragment.body.reward.blocks,[{blockId:3,quantity:1}]);assert.equal((await f.request('rewards',{userId,stage:3,type:'clear'})).status,400);
 for(const key of ['s3_introduction','s3_meet']){f.setTranscript(STAGE3_PRACTICE[key].text);const answer=await f.request('assess-pronunciation?word='+key+'&userId='+userId+'&attemptId=test-'+key.replaceAll('_','-'),wav());await f.request('rewards',{userId,type:'speech',token:answer.body.rewardToken});}
 const clear=await f.request('rewards',{userId,stage:3,type:'clear'});assert.equal(clear.status,200);assert.equal(clear.body.reward.blocks.reduce((n,b)=>n+b.quantity,0),15);assert.equal((await f.request('rewards',{userId,stage:3,type:'clear'})).body.created,false);
});

test('C daily conversations use Stage 1 signed speech rewards, hearts, weapon chance and duplicate protection',async()=>{
 const f=fixture(),userId='daily-child';
 const {STAGE3_DAILY_TOPICS,STAGE3_DAILY_PRACTICE}=await import('../magic-english/magic-english-stage3-daily.js');
 const rewards=[];let firstClaim;
 for(const [i,row]of STAGE3_DAILY_TOPICS.art.entries()){
  const target=row.key,p=STAGE3_DAILY_PRACTICE[target];let attemptId;
  for(let n=0;n<1000;n++){const id='daily-'+i+'-'+n;if(require('node:crypto').createHmac('sha256','unit-signing').update('weapon-drop:'+userId+':'+id).digest().readUInt32BE(0)%100<20){attemptId=id;break;}}
  f.setTranscript(p.text);const speech=await f.request('assess-pronunciation?word='+target+'&userId='+userId+'&attemptId='+attemptId,wav());assert.equal(speech.status,200);assert.equal(speech.body.quantity,2);assert(speech.body.rewardToken);assert(speech.body.weaponReward);
  const claim={userId,type:'speech',token:speech.body.rewardToken};firstClaim??=claim;const saved=await f.request('rewards',claim);assert.equal(saved.body.created,true);assert(saved.body.reward.blocks.every(b=>[1,2,3,5,6].includes(b.blockId)));rewards.push(saved.body.reward);
 }
 assert.equal((await f.request('rewards',firstClaim)).body.created,false);
 const {createInventory,applyRewards}=await import('../magic-english/block-world/inventory.js');const received=applyRewards(createInventory(),rewards,userId);assert.equal(received.applied,5);assert.equal(received.inventory.hearts,5);assert.equal(Object.values(received.inventory.counts).reduce((a,b)=>a+b,0),10);assert.equal(applyRewards(received.inventory,rewards,userId).applied,0);
 assert.equal((await f.request('rewards',{userId,type:'fragment',stage:3})).status,400,'daily conversations cannot unlock the story reward');
 f.setTranscript('Coco is cute cat');const partial=await f.request('assess-pronunciation?word=s3_daily_cute&userId='+userId+'&attemptId=daily-partial',wav());assert.equal(partial.body.quantity,1);assert.equal(partial.body.weaponReward,undefined);const partialReward=await f.request('rewards',{userId,type:'speech',token:partial.body.rewardToken});assert.equal(applyRewards(received.inventory,[partialReward.body.reward],userId).inventory.hearts,5.5);
 f.setTranscript('paper');const failed=await f.request('assess-pronunciation?word=s3_daily_paper&userId='+userId+'&attemptId=daily-word',wav());assert.equal(failed.body.passed,false);assert.equal(failed.body.rewardToken,undefined);
});

test('D signed boss utterances unlock one fragment; meal is required for clear; other targets cannot bypass the boss',async()=>{
 const {STAGE4_REQUIRED,STAGE4_CLEAR_REQUIRED,STAGE4_PRACTICE}=await import('../magic-english/magic-english-stage4-learning.js'),f=fixture();
 const grant=type=>f.request('rewards',{userId:'dchild01',type,stage:4});
 assert.equal((await grant('fragment')).status,400);
 for(const target of STAGE4_REQUIRED){
  if(target==='s4_boss_thanks')assert.equal((await grant('fragment')).status,400);
  f.setTranscript(STAGE4_PRACTICE[target].text);const result=await f.request('assess-pronunciation?word='+target+'&userId=dchild01&attemptId=d-'+target.replaceAll('_','-'),wav());assert.equal(result.status,200);assert(result.body.passed);assert.equal((await f.request('rewards',{userId:'dchild01',type:'speech',token:result.body.rewardToken})).status,200);
 }
 const fragment=await grant('fragment');assert(fragment.body.created);assert.equal((await grant('fragment')).body.created,false);assert.equal((await grant('clear')).status,400);
 for(const target of STAGE4_CLEAR_REQUIRED){f.setTranscript(STAGE4_PRACTICE[target].text);const r=await f.request('assess-pronunciation?word='+target+'&userId=dchild01&attemptId=d-'+target.replaceAll('_','-'),wav());await f.request('rewards',{userId:'dchild01',type:'speech',token:r.body.rewardToken});}
 assert((await grant('clear')).body.created);assert.equal((await grant('clear')).body.created,false);
 const {rewardHearts}=await import('../magic-english/block-world/hearts.js');assert.equal(rewardHearts(fragment.body.reward),.5);
});
