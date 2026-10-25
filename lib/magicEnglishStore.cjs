const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {createClient}=require('@supabase/supabase-js');
function createMagicStore({client,prefix='magic-english:',dir=path.join(process.cwd(),'.magic-english-data'),vercel=Boolean(process.env.VERCEL)}={}){
 client??=process.env.SUPABASE_URL&&(process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_ANON_KEY)?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_ANON_KEY):null;
 function localFile(key){if(vercel&&!client){const e=Error('Supabase 저장소를 설정해 주세요.');e.status=503;throw e;}return path.join(dir,crypto.createHash('sha256').update(key).digest('hex')+'.json');}
 async function get(key){if(client){const {data,error}=await client.from('kv_store').select('value').eq('key',prefix+key).maybeSingle();if(error)throw error;return data?.value??null;}try{return JSON.parse(await fs.readFile(localFile(key),'utf8')).value;}catch(error){if(error.code==='ENOENT')return null;throw error;}}
 async function list(keyPrefix){if(client){let rows=[],offset=0;for(;;){const {data,error}=await client.from('kv_store').select('value').like('key',prefix+keyPrefix+'%').range(offset,offset+999);if(error)throw error;rows.push(...(data||[]).map(r=>r.value));if(!data||data.length<1000)return rows;offset+=1000;}}localFile(keyPrefix);let names;try{names=await fs.readdir(dir);}catch(error){if(error.code==='ENOENT')return [];throw error;}const rows=await Promise.all(names.filter(n=>n.endsWith('.json')).map(async name=>JSON.parse(await fs.readFile(path.join(dir,name),'utf8'))));return rows.filter(r=>r.key.startsWith(keyPrefix)).map(r=>r.value);}
 async function putOnce(key,value){if(client){const {error}=await client.from('kv_store').insert({key:prefix+key,value});if(error){if(error.code==='23505')return {created:false,value:await get(key)};throw error;}return {created:true,value};}const file=localFile(key);await fs.mkdir(dir,{recursive:true,mode:0o700});const temporary=file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(temporary,JSON.stringify({key,value}),{mode:0o600});try{await fs.link(temporary,file);return {created:true,value};}catch(error){if(error.code==='EEXIST')return {created:false,value:await get(key)};throw error;}}finally{await fs.rm(temporary,{force:true});}}
 async function latest(keyPrefix){
  if(client){const {data,error}=await client.from('kv_store').select('value').like('key',prefix+keyPrefix+'%').order('key',{ascending:false}).limit(1);if(error)throw error;return data?.[0]?.value??null;}
  const rows=await list(keyPrefix);return rows.sort((a,b)=>b.savedAt.localeCompare(a.savedAt)||b.operationId.localeCompare(a.operationId))[0]??null;
 }
 return {get,list,putOnce,latest};
}
module.exports={createMagicStore};
