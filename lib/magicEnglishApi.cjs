const crypto=require('node:crypto');
const {createMagicStore}=require('./magicEnglishStore.cjs');
const json=(res,status,value)=>{res.setHeader('Cache-Control','no-store');res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
async function read(req,max){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>max){const e=Error('요청이 너무 큽니다.');e.status=413;throw e;}chunks.push(Buffer.from(chunk));}return Buffer.concat(chunks);}
const userPrefix=user=>'reward:'+crypto.createHash('sha256').update(user).digest('hex')+':';
function createMagicEnglishApi({store=createMagicStore(),fetchImpl=fetch,env=process.env}={}){
 const pendingVoices=new Map();
 const secret=()=>{const value=env.MAGIC_ENGLISH_SIGNING_SECRET||env.ELEVENLABS_API_KEY;if(!value){const e=Error('ELEVENLABS_API_KEY 환경변수를 설정해 주세요.');e.status=503;throw e;}return value;};
 const sign=claim=>{const text=Buffer.from(JSON.stringify(claim)).toString('base64url');return text+'.'+crypto.createHmac('sha256',secret()).update(text).digest('base64url');};
 function verify(token){const [text,mac]=String(token||'').split('.'),expected=crypto.createHmac('sha256',secret()).update(text||'').digest('base64url');if(!mac||mac.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(expected)))throw Error('음성 확인 기록이 올바르지 않습니다.');return JSON.parse(Buffer.from(text,'base64url'));}
 async function register(reward){const {normalizeReward,rewardSignature,MAX_REWARDS}=await import('../magic-english/block-world/inventory.js');reward=normalizeReward(reward);const key=userPrefix(reward.userId)+reward.rewardId;const existing=await store.get(key);if(existing){if(rewardSignature(existing)!==rewardSignature(reward)){const e=Error('같은 보상 ID의 내용이 다릅니다.');e.status=409;throw e;}return {created:false,reward:existing,delivery:'pending-client-sync'};}if((await store.list(userPrefix(reward.userId))).length>=MAX_REWARDS){const e=Error('보상 원장 한도에 도달했습니다.');e.status=409;throw e;}const result=await store.putOnce(key,{...reward,createdAt:new Date().toISOString()});if(!result.created&&rewardSignature(result.value)!==rewardSignature(reward)){const e=Error('같은 보상 ID의 내용이 다릅니다.');e.status=409;throw e;}return {created:result.created,reward:result.value,delivery:'pending-client-sync'};}
 async function tts(character,text){const {characterRequest}=await import('../magic-english/character-voices.js');const cast=characterRequest(character,text),key='voice:'+crypto.createHash('sha256').update(JSON.stringify(cast)).digest('hex');const cached=await store.get(key);if(cached)return Buffer.from(cached.audio,'base64');
 if(!pendingVoices.has(key))pendingVoices.set(key,(async()=>{if(!env.ELEVENLABS_API_KEY){const e=Error('ELEVENLABS_API_KEY 환경변수를 설정해 주세요.');e.status=503;throw e;}const response=await fetchImpl('https://api.elevenlabs.io/v1/text-to-speech/'+cast.voiceId+'?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':env.ELEVENLABS_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({text:cast.text,model_id:cast.model_id,voice_settings:cast.voice_settings}),signal:AbortSignal.timeout(20000)});if(!response.ok){const e=Error('음성 준비에 실패했어요.');e.status=502;throw e;}const audio=Buffer.from(await response.arrayBuffer());await store.putOnce(key,{audio:audio.toString('base64')});return audio;})());try{return await pendingVoices.get(key);}finally{pendingVoices.delete(key);}}
 return async function handler(req,res){try{
 const url=new URL(req.url,'http://local'),action=url.pathname.replace(/^\/api\/magic-english\/?/,'');
 const {validateUserId}=await import('../magic-english/block-world/inventory.js');
 if(action==='assess-pronunciation'&&req.method==='GET')return json(res,200,{configured:Boolean(env.ELEVENLABS_API_KEY),provider:'elevenlabs-scribe-v2'});
 if((action==='character-voice'||action==='welcome-voice')&&req.method==='POST'){
 const body=JSON.parse((await read(req,5000)).toString()),text=action==='welcome-voice'?`Hello, ${/^[A-Za-z]{1,12}$/.test(body.name)?body.name:'Gildong'}! It is nice to meet you!`:body.text;
 const audio=await tts(action==='welcome-voice'?'amy':body.character,text);res.statusCode=200;res.setHeader('Content-Type','audio/mpeg');res.setHeader('Cache-Control','private, max-age=86400');return res.end(audio);
 }
 if(action==='assess-pronunciation'&&req.method==='POST'){
 const {SPEECH_TARGETS,assessLearningSpeech}=await import('../magic-english/magic-english-learning.js');const target=url.searchParams.get('word')||'full';if(!Object.hasOwn(SPEECH_TARGETS,target))throw Error('알 수 없는 말하기 표현입니다.');
 const userId=validateUserId(url.searchParams.get('userId')||'demo'),attemptId=url.searchParams.get('attemptId')||crypto.randomUUID();if(!/^[A-Za-z0-9-]{1,80}$/.test(attemptId))throw Error('대화 ID 오류');
 const audio=await read(req,350000);if(audio.length<1000||audio.toString('ascii',0,4)!=='RIFF')throw Error('유효한 WAV 오디오가 필요합니다.');if(!env.ELEVENLABS_API_KEY){const e=Error('ELEVENLABS_API_KEY 환경변수를 설정해 주세요.');e.status=503;throw e;}
 const form=new FormData();form.append('file',new Blob([audio],{type:'audio/wav'}),'word.wav');form.append('model_id','scribe_v2');form.append('language_code','eng');form.append('tag_audio_events','false');form.append('diarize','false');
 if(env.MAGIC_ENGLISH_STT_KEYTERMS!=='false')for(const term of ['Airplane','Apple','Ask','Bus','Bag','Big'])form.append('keyterms',term);
 const response=await fetchImpl('https://api.elevenlabs.io/v1/speech-to-text',{method:'POST',headers:{'xi-api-key':env.ELEVENLABS_API_KEY},body:form,signal:AbortSignal.timeout(45000)});if(!response.ok){const e=Error('음성 인식 서비스가 응답하지 않았어요.');e.status=502;throw e;}const data=await response.json(),result=assessLearningSpeech(data.text||'',target);result.recognizedText=String(data.text||'');
 if(result.passed){
 const {speechBlocks,speechWeapon,SPEECH_REWARD_VERSION}=await import('../magic-english/block-world/speech-rewards.js');
 const roll=label=>crypto.createHmac('sha256',secret()).update(label+':'+userId+':'+attemptId).digest().readUInt32BE(0);
 const blockRoll=roll('block'),weaponDropRoll=roll('weapon-drop')%100,weaponRoll=roll('weapon-tier')%100;
 result.rewardToken=sign({userId,attemptId,target,quantity:result.quantity,rewardVersion:SPEECH_REWARD_VERSION,blockRoll,quality:result.quality,weaponDropRoll,weaponRoll});
 result.blocks=speechBlocks(result.quantity,blockRoll);const {BLOCKS}=await import('../magic-english/block-world/block-data.js');result.blockName=BLOCKS[result.blocks[0].blockId].name;
 const item=speechWeapon(result.quality,weaponDropRoll,weaponRoll);if(item){const {WEAPONS}=await import('../magic-english/block-world/weapons.js');result.weaponReward=item;result.weaponName=WEAPONS[item.itemId].name;}
 }return json(res,200,result);
 }
 if(action==='rewards'&&req.method==='POST'){
 const body=JSON.parse((await read(req,16000)).toString()),userId=validateUserId(body.userId);let rewardId,blocks,reason,items;
 if(body.type==='speech'){const claim=verify(body.token);if(claim.userId!==userId)throw Error('사용자가 일치하지 않습니다.');rewardId='speech:'+claim.attemptId;blocks=[{blockId:5,quantity:claim.quantity}];reason='말하기:'+claim.target;
 if([2,3].includes(claim.rewardVersion)){const {speechBlocks,speechWeapon}=await import('../magic-english/block-world/speech-rewards.js');blocks=speechBlocks(claim.quantity,claim.blockRoll,claim.rewardVersion);const item=speechWeapon(claim.quality,claim.weaponDropRoll,claim.weaponRoll);if(item)items=[item];}
 else if(claim.quality==='complete'&&Number.isInteger(claim.weaponRoll)){const {weaponReward}=await import('../magic-english/block-world/weapons.js');items=[weaponReward('complete',claim.weaponRoll)];}}
 else{const stage=Number(body.stage);if(![1,2].includes(stage)||!['fragment','clear'].includes(body.type))throw Error('알 수 없는 보상입니다.');const rewards=await store.list(userPrefix(userId)),targets=new Set(rewards.filter(r=>r.reason.startsWith('말하기:')).map(r=>r.reason.slice(4)));const needed=stage===1?['airplane','apple','ask','help_please']:['bus','bag','big','where_bus','my_bag','big_bus'];if(!needed.every(t=>targets.has(t)))throw Error('필요한 말하기를 먼저 완료해 주세요.');rewardId=`stage${stage}:${body.type}:v2`;const promised=await store.get(userPrefix(userId)+rewardId);if(promised)return json(res,200,{created:false,reward:promised,delivery:'pending-client-sync'});blocks=body.type==='fragment'?[{blockId:3,quantity:1}]:[{blockId:5,quantity:5},{blockId:2,quantity:5},{blockId:3,quantity:5}];reason=`Stage ${stage} ${body.type==='fragment'?'알파벳 조각':'완료'}`;}
 return json(res,200,await register({userId,rewardId,blocks,...(items?{items}:{}),source:'magic-english',reason}));
 }
 if(action==='block-world/rewards'&&req.method==='GET'){const userId=validateUserId(url.searchParams.get('userId'));return json(res,200,{version:1,userId,rewards:await store.list(userPrefix(userId))});}
 if(action==='block-world/catalog'&&req.method==='GET'){const {BLOCKS}=await import('../magic-english/block-world/block-data.js');const {MAX_BALANCE,MAX_REWARDS}=await import('../magic-english/block-world/inventory.js');return json(res,200,{version:1,starter:{},maxBalance:MAX_BALANCE,maxRewards:MAX_REWARDS,blocks:BLOCKS.flatMap((b,id)=>b&&!b.unbreakable?[{blockId:id,name:b.name,english:b.en}]:[])});}
 if(action==='block-world/rewards'&&req.method==='POST'){if(!env.BLOCK_REWARD_API_KEY||req.headers.authorization!=='Bearer '+env.BLOCK_REWARD_API_KEY){const e=Error('서버 지급 인증이 필요합니다.');e.status=401;throw e;}return json(res,200,await register(JSON.parse((await read(req,32768)).toString())));}
 return json(res,404,{error:'지원하지 않는 API입니다.'});
 }catch(error){return json(res,error.status||400,{error:error.status>=500?'음성 또는 보상 서비스를 준비하지 못했어요. 서버 환경변수를 확인해 주세요.':error.message});}};
}
module.exports={createMagicEnglishApi};
