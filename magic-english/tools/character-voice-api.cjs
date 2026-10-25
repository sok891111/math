const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
function createCharacterVoiceApi({getApiKey,fetchImpl=fetch,dataDir=process.env.BLOCK_REWARD_DATA_DIR||path.join(__dirname,'../.block-world-data')}){
 const inFlight=new Map();
 return async(req,res,url)=>{
 if(url.pathname!=='/api/magic-english/character-voice')return false;
 try{
 if(req.method!=='POST'){res.writeHead(405);res.end();return true;}
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>5000)throw Error('대사가 너무 깁니다.');}
 const {character,text}=JSON.parse(raw),{characterRequest}=await import('../character-voices.js');const cast=characterRequest(character,text);
 const key=crypto.createHash('sha256').update(JSON.stringify(cast)).digest('hex'),file=path.join(dataDir,'voices',key+'.mp3');
 let buffer;try{buffer=await fs.readFile(file);}catch(error){if(error.code!=='ENOENT')throw error;}
 if(!buffer){
 if(!inFlight.has(key))inFlight.set(key,(async()=>{
 const apiKey=getApiKey();if(!apiKey){const error=Error('음성 서비스 설정이 필요합니다.');error.status=503;throw error;}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{const response=await fetchImpl('https://api.elevenlabs.io/v1/text-to-speech/'+cast.voiceId+'?output_format=mp3_44100_128',{method:'POST',headers:{'xi-api-key':apiKey,'Content-Type':'application/json'},body:JSON.stringify({text:cast.text,model_id:cast.model_id,voice_settings:cast.voice_settings}),signal:controller.signal});
 if(!response.ok){const error=Error('배역 음성을 준비하지 못했어요.');error.status=502;throw error;}
 const audio=Buffer.from(await response.arrayBuffer());await fs.mkdir(path.dirname(file),{recursive:true,mode:0o700});const temporary=file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(temporary,audio,{mode:0o600});await fs.rename(temporary,file);}finally{await fs.rm(temporary,{force:true}).catch(()=>{});}return audio;
 }finally{clearTimeout(timer);}
 })());
 try{buffer=await inFlight.get(key);}finally{inFlight.delete(key);}
 }
 res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'private, max-age=86400'});res.end(buffer);
 }catch(error){res.writeHead(error.status||400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}return true;
 };
}
module.exports={createCharacterVoiceApi};
