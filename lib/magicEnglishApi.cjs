const crypto=require('node:crypto');
const {createParentAccounts}=require('./parent/accounts.cjs');
const {createMagicStore}=require('./magicEnglishStore.cjs');
const json=(res,status,value)=>{res.setHeader('Cache-Control','no-store');res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
async function read(req,max){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>max){const e=Error('요청이 너무 큽니다.');e.status=413;throw e;}chunks.push(Buffer.from(chunk));}return Buffer.concat(chunks);}
function createMagicEnglishApi({store=createMagicStore(),fetchImpl=fetch,env=process.env}={}){
 const pendingVoices=new Map(),parents=createParentAccounts({store});
 async function checkAccess(userId){if(/^[A-Za-z0-9]{4,10}$/.test(userId)&&(await parents.access(userId)).blocked){const e=Error('부모님이 게임을 쉬도록 설정했습니다.');e.status=403;throw e;}}
 async function tts(character,text){const {characterRequest}=await import('../magic-english/character-voices.js');const cast=characterRequest(character,text),key='voice:'+crypto.createHash('sha256').update(JSON.stringify(cast)).digest('hex');const cached=await store.get(key);if(cached)return Buffer.from(cached.audio,'base64');
 if(!pendingVoices.has(key))pendingVoices.set(key,(async()=>{if(!env.ELEVENLABS_API_KEY){const e=Error('ELEVENLABS_API_KEY 환경변수를 설정해 주세요.');e.status=503;throw e;}const response=await fetchImpl('https://api.elevenlabs.io/v1/text-to-speech/'+cast.voiceId+'?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':env.ELEVENLABS_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({text:cast.text,model_id:cast.model_id,voice_settings:cast.voice_settings}),signal:AbortSignal.timeout(20000)});if(!response.ok){const e=Error('음성 준비에 실패했어요.');e.status=502;throw e;}const audio=Buffer.from(await response.arrayBuffer());await store.putOnce(key,{audio:audio.toString('base64')});return audio;})());try{return await pendingVoices.get(key);}finally{pendingVoices.delete(key);}}
 return async function handler(req,res){try{
 const url=new URL(req.url,'http://local'),action=url.pathname.replace(/^\/api\/magic-english\/?/,'');
 const validateUserId=id=>{if(typeof id!=='string'||!id.trim()||id.length>80||/[\u0000-\u001f\u007f]/.test(id))throw Error('사용자 코드가 올바르지 않습니다.');return id.trim();};
 if(action==='rewards'||action.startsWith('block-world/'))return json(res,410,{error:'마인크래프트 연동과 자원 보상 지급이 종료되었습니다.',retired:true});
 if(action==='assess-pronunciation'&&req.method==='GET')return json(res,200,{configured:Boolean(env.ELEVENLABS_API_KEY),provider:'elevenlabs-scribe-v2'});
 if((action==='character-voice'||action==='welcome-voice')&&req.method==='POST'){
 const body=JSON.parse((await read(req,5000)).toString()),text=action==='welcome-voice'?`Hello, ${/^[A-Za-z]{1,12}$/.test(body.name)?body.name:'Gildong'}! It is nice to meet you!`:body.text;
 const audio=await tts(action==='welcome-voice'?'amy':body.character,text);res.statusCode=200;res.setHeader('Content-Type','audio/mpeg');res.setHeader('Cache-Control','private, max-age=86400');return res.end(audio);
 }
 if(action==='assess-pronunciation'&&req.method==='POST'){
 const {SPEECH_TARGETS,assessLearningSpeech}=await import('../magic-english/magic-english-learning.js');const target=url.searchParams.get('word')||'full';if(!Object.hasOwn(SPEECH_TARGETS,target))throw Error('알 수 없는 말하기 표현입니다.');
 const userId=validateUserId(url.searchParams.get('userId')||'demo'),attemptId=url.searchParams.get('attemptId')||crypto.randomUUID();if(!/^[A-Za-z0-9-]{1,80}$/.test(attemptId))throw Error('대화 ID 오류');
 await checkAccess(userId);const audio=await read(req,350000);if(audio.length<1000||audio.toString('ascii',0,4)!=='RIFF')throw Error('유효한 WAV 오디오가 필요합니다.');if(!env.ELEVENLABS_API_KEY){const e=Error('ELEVENLABS_API_KEY 환경변수를 설정해 주세요.');e.status=503;throw e;}
 const form=new FormData();form.append('file',new Blob([audio],{type:'audio/wav'}),'word.wav');form.append('model_id','scribe_v2');form.append('language_code','eng');form.append('tag_audio_events','false');form.append('diarize','false');
 if(env.MAGIC_ENGLISH_STT_KEYTERMS!=='false')for(const term of ['Airplane','Apple','Ask','Bus','Bag','Big',...(target.startsWith('s4_')?['Door','Drink','Delicious','Dish','Daisy']:[]),...(target.startsWith('s3_')?['Class','Cat','Come','Coco','Gildong']:[])])form.append('keyterms',term);
 const response=await fetchImpl('https://api.elevenlabs.io/v1/speech-to-text',{method:'POST',headers:{'xi-api-key':env.ELEVENLABS_API_KEY},body:form,signal:AbortSignal.timeout(45000)});if(!response.ok){const e=Error('음성 인식 서비스가 응답하지 않았어요.');e.status=502;throw e;}const data=await response.json(),result=assessLearningSpeech(data.text||'',target);result.recognizedText=String(data.text||'');
 return json(res,200,result);
 }
 return json(res,404,{error:'지원하지 않는 API입니다.'});
 }catch(error){return json(res,error.status||400,{error:error.status>=500?'음성 서비스를 준비하지 못했어요. 서버 환경변수를 확인해 주세요.':error.message});}};
}
module.exports={createMagicEnglishApi};
