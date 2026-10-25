const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const contract=import('../block-world/inventory.js'),catalog=import('../block-world/block-data.js');
function reply(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));}
async function body(req){let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size<=32768)chunks.push(chunk);}if(size>32768){const error=Error('요청 본문은 32KB 이하여야 합니다.');error.status=413;throw error;}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('JSON 요청 본문이 필요합니다.');}}
function createRewardApi({dataDir,apiKey=process.env.BLOCK_REWARD_API_KEY||''}){
 const locks=new Map();
 async function locked(file,operation){const prior=locks.get(file)||Promise.resolve();const result=prior.catch(()=>{}).then(operation);locks.set(file,result);try{return await result;}finally{if(locks.get(file)===result)locks.delete(file);}}
 async function read(file){try{const value=JSON.parse(await fs.readFile(file,'utf8'));if(value.version!==1||!Array.isArray(value.rewards))throw Error('저장된 보상 파일이 올바르지 않습니다.');return value;}catch(error){if(error.code==='ENOENT')return {version:1,rewards:[]};error.status=500;throw error;}}
 return async function rewardApi(req,res,url){
  if(!url.pathname.startsWith('/api/magic-english/block-world/'))return false;
  try{
   if(url.pathname==='/api/magic-english/block-world/catalog'&&req.method==='GET'){const {BLOCKS}=await catalog;const {STARTER_COUNTS,MAX_BALANCE,MAX_REWARDS}=await contract;reply(res,200,{version:1,starter:STARTER_COUNTS,maxBalance:MAX_BALANCE,maxRewards:MAX_REWARDS,blocks:BLOCKS.flatMap((block,id)=>block&&!block.unbreakable?[{blockId:id,name:block.name,english:block.en}]:[])});return true;}
   if(url.pathname!=='/api/magic-english/block-world/rewards'){reply(res,404,{error:'NOT_FOUND',message:'지원하지 않는 API입니다.'});return true;}
   if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');reply(res,405,{error:'METHOD_NOT_ALLOWED'});return true;}
   const {normalizeReward,rewardSignature,validateUserId,MAX_REWARDS}=await contract;
   let reward,userId;if(req.method==='POST'){
    if(!apiKey){reply(res,503,{error:'API_KEY_NOT_CONFIGURED',message:'서버에 BLOCK_REWARD_API_KEY를 설정하세요.'});return true;}
    const authorization=req.headers.authorization||'',expected='Bearer '+apiKey,provided=Buffer.from(authorization),wanted=Buffer.from(expected);if(provided.length!==wanted.length||!crypto.timingSafeEqual(provided,wanted)){reply(res,401,{error:'UNAUTHORIZED'});return true;}
    if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json')){reply(res,415,{error:'JSON_REQUIRED'});return true;}
    reward=normalizeReward(await body(req));userId=reward.userId;
   }else userId=validateUserId(url.searchParams.get('userId'));
   const file=path.join(dataDir,crypto.createHash('sha256').update(userId).digest('hex')+'.json');
   if(req.method==='GET'){const value=await read(file);reply(res,200,{version:1,userId,rewards:value.rewards});return true;}
   const result=await locked(file,async()=>{
    const value=await read(file),existing=value.rewards.find(item=>item.rewardId===reward.rewardId);
    if(existing){if(rewardSignature(normalizeReward(existing))!==rewardSignature(reward)){const error=Error('같은 rewardId의 내용이 다릅니다.');error.status=409;throw error;}return {created:false,reward:existing};}
    if(value.rewards.length>=MAX_REWARDS){const error=Error('사용자별 보상 한도에 도달했습니다.');error.status=409;throw error;}
    const record={...reward,createdAt:new Date().toISOString()};value.rewards.push(record);await fs.mkdir(dataDir,{recursive:true,mode:0o700});const temporary=file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(temporary,JSON.stringify(value),{mode:0o600});await fs.rename(temporary,file);}finally{await fs.rm(temporary,{force:true}).catch(()=>{});}return {created:true,reward:record};
   });reply(res,result.created?201:200,{...result,delivery:'pending-client-sync'});return true;
  }catch(error){const status=error.status||400;reply(res,status,{error:status===409?'REWARD_CONFLICT':status>=500?'STORAGE_ERROR':'INVALID_REQUEST',message:status>=500?'보상 저장소를 읽거나 쓸 수 없습니다.':error.message});return true;}
 };
}
module.exports={createRewardApi};
