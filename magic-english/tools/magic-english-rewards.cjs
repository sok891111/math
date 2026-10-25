const crypto=require('node:crypto'),path=require('node:path');
const {Readable}=require('node:stream');
const fs=require('node:fs');
const {createRewardApi}=require('./block-reward-api.cjs');
function createMagicRewards(options={}){
 const dataDir=options.dataDir||process.env.BLOCK_REWARD_DATA_DIR||path.join(__dirname,'../.block-world-data');
 fs.mkdirSync(dataDir,{recursive:true,mode:0o700});const keyFile=path.join(dataDir,'.speech-signing-key');
 if(!options.secret&&!fs.existsSync(keyFile)) {try{fs.writeFileSync(keyFile,crypto.randomBytes(32).toString('hex'),{mode:0o600,flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;}}
 const secret=options.secret||fs.readFileSync(keyFile,'utf8');
 const api=createRewardApi({dataDir:options.dataDir||process.env.BLOCK_REWARD_DATA_DIR||path.join(__dirname,'../.block-world-data'),apiKey:secret});
 const sign=value=>{const text=Buffer.from(JSON.stringify(value)).toString('base64url');return text+'.'+crypto.createHmac('sha256',secret).update(text).digest('base64url');};
 function verify(token){const [text,mac]=String(token).split('.'),expected=crypto.createHmac('sha256',secret).update(text||'').digest('base64url');if(!mac||mac.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(expected)))throw Error('음성 확인 기록이 올바르지 않습니다.');return JSON.parse(Buffer.from(text,'base64url'));}
 function assessment(result,userId,attemptId){if(!result.passed)return result;return {...result,rewardToken:sign({userId,attemptId,target:result.target,quantity:result.quantity})};}
 async function dispatch(method,value){let status;let output;const req=Readable.from(method==='POST'?[Buffer.from(JSON.stringify(value))]:[]);req.method=method;req.headers={'content-type':'application/json',authorization:'Bearer '+secret};const res={setHeader(){},writeHead(code){status=code;},end(body){output=JSON.parse(body);}};await api(req,res,new URL('http://local/api/magic-english/block-world/rewards'+(method==='GET'?'?userId='+encodeURIComponent(value):'')));if(status>=400)throw Error(output.message||output.error);return output;}
 async function handle(req,res,url){
 if(url.pathname!=='/api/magic-english/rewards')return false;
 try{
 if(req.method!=='POST')throw Error('POST 요청이 필요합니다.');let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16000)throw Error('요청이 너무 큽니다.');}const body=JSON.parse(raw),userId=body.userId;
 const {validateUserId}=await import('../block-world/inventory.js');validateUserId(userId);
 let rewardId,blocks,reason;
 if(body.type==='speech'){
 const claim=verify(body.token);if(claim.userId!==userId)throw Error('사용자가 일치하지 않습니다.');if(!/^[a-zA-Z0-9-]{1,80}$/.test(claim.attemptId))throw Error('대화 ID 오류');
 rewardId='speech:'+claim.attemptId;blocks=[{blockId:5,quantity:claim.quantity}];reason='말하기:'+claim.target;
 }else{
 const stage=Number(body.stage);if(![1,2].includes(stage)||!['fragment','clear'].includes(body.type))throw Error('알 수 없는 보상입니다.');
 const {rewards}=await dispatch('GET',userId);const targets=new Set(rewards.filter(r=>r.reason.startsWith('말하기:')).map(r=>r.reason.slice(4)));
 const needed=stage===1?['airplane','apple','ask','help_please']:['bus','bag','big','where_bus','my_bag','big_bus'];
 if(!needed.every(t=>targets.has(t)))throw Error('아직 필요한 말하기를 완료하지 않았어요.');
 rewardId=`stage${stage}:${body.type}:v2`;blocks=body.type==='fragment'?[{blockId:33,quantity:1}]:[{blockId:5,quantity:5},{blockId:2,quantity:5},{blockId:33,quantity:5}];reason=`Stage ${stage} ${body.type==='fragment'?'알파벳 조각':'완료'}`;
 }
 const result=await dispatch('POST',{userId,rewardId,blocks,source:'magic-english',reason});res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(result));
 }catch(error){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}return true;
 }
 return {handle,assessment,blockApi:createRewardApi({dataDir,apiKey:process.env.BLOCK_REWARD_API_KEY||''})};
}
module.exports={createMagicRewards};
