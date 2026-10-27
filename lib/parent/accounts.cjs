const crypto=require('node:crypto'),{promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt);
const {createMagicStore}=require('../magicEnglishStore.cjs');
const {validId}=require('../learning/records.cjs');
const COOKIE='block_parent_session';
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const parentId=value=>typeof value==='string'&&/^[a-z0-9-]{4,40}$/.test(value)?value:null;
const normalizeId=value=>parentId(typeof value==='string'?value.trim().toLowerCase():'');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
function sessionToken(req){const raw=req.headers?.cookie||'';return raw.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
function setSessionCookie(req,res,token){const secure=req.headers?.['x-forwarded-proto']==='https'||Boolean(req.socket?.encrypted);res.setHeader('Set-Cookie',`${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token?43200:0}${secure?'; Secure':''}`);}
function createParentAccounts({store=createMagicStore(),now=()=>Date.now()}={}){
 async function passwordHash(password){if(typeof password!=='string'||password.length<8||password.length>128)throw fail('비밀번호는 8~128자로 설정해 주세요.');const salt=crypto.randomBytes(16).toString('hex');return {salt,hash:(await scrypt(password,salt,64)).toString('hex')};}
 async function matches(account,password){if(!account||typeof password!=='string'||password.length>128)return false;const computed=await scrypt(password,account.salt,64);return crypto.timingSafeEqual(computed,Buffer.from(account.hash,'hex'));}
 const account=id=>store.get('parent:account:'+id);
 const binding=child=>store.get('parent:child:'+child);
 async function provision(child,input){
  if(!validId(child))throw fail('아이 코드가 올바르지 않습니다.');const id=normalizeId(input.parentId);if(!id)throw fail('부모 ID는 영문 소문자·숫자·하이픈 4~40자로 입력해 주세요.');
  let existing=await account(id);
  if(!existing){const credentials=await passwordHash(input.password);const result=await store.putOnce('parent:account:'+id,{id,...credentials,version:crypto.randomUUID()});existing=result.value;if(!result.created&&input.password)throw fail('동시에 생성된 부모 계정이 있습니다. 다시 확인해 주세요.',409);}
  else if(input.password){const credentials=await passwordHash(input.password);existing={id,...credentials,version:crypto.randomUUID()};await store.set('parent:account:'+id,existing);}
  await store.set('parent:child:'+child,{parentId:id});return {parentId:id};
 }
 async function issue(id){const owner=await account(id),token=crypto.randomBytes(32).toString('base64url');await store.putOnce('parent:session:'+digest(token),{parentId:id,version:owner.version,expiresAt:now()+43200000});return token;}
 async function login(child,id,password){
  id=normalizeId(id);if(!validId(child)||!id)throw fail('부모 ID 또는 비밀번호를 확인해 주세요.',401);
  const failures=await store.list('parent:failure:'+id+':');if(failures.filter(f=>f.at>now()-900000).length>=10)throw fail('로그인 시도가 많습니다. 15분 후 다시 시도해 주세요.',429);
  const owner=await account(id),link=await binding(child);
  if(!await matches(owner,password)||link?.parentId!==id){await store.putOnce('parent:failure:'+id+':'+crypto.randomUUID(),{at:now()});throw fail('부모 ID 또는 비밀번호를 확인해 주세요.',401);}
  return issue(id);
 }
 async function authorize(child,token){
  if(!validId(child)||!/^[A-Za-z0-9_-]{43}$/.test(token||''))return null;
  const session=await store.get('parent:session:'+digest(token));if(!session||session.expiresAt<=now())return null;
  const [owner,link]=await Promise.all([account(session.parentId),binding(child)]);
  return owner&&owner.version===session.version&&link?.parentId===owner.id?{id:owner.id}:null;
 }
 async function logout(token){if(/^[A-Za-z0-9_-]{43}$/.test(token||''))await store.set('parent:session:'+digest(token),{expiresAt:0});}
 async function changePassword(child,token,currentPassword,newPassword){const owner=await authorize(child,token);if(!owner)throw fail('부모 로그인이 필요합니다.',401);const current=await account(owner.id);if(!await matches(current,currentPassword))throw fail('현재 비밀번호를 확인해 주세요.',401);await store.set('parent:account:'+owner.id,{id:owner.id,...await passwordHash(newPassword),version:crypto.randomUUID()});return issue(owner.id);}
 async function access(child){if(!validId(child))throw fail('아이 코드가 올바르지 않습니다.');const value=await store.get('parent:access:'+child);return {blocked:value?.blocked===true,updatedAt:value?.updatedAt||null};}
 async function setAccess(child,token,blocked){const owner=await authorize(child,token);if(!owner)throw fail('이 아이를 관리하는 부모 로그인이 필요합니다.',401);if(typeof blocked!=='boolean')throw fail('접근 설정이 올바르지 않습니다.');const value={blocked,updatedAt:new Date(now()).toISOString(),parentId:owner.id};await store.set('parent:access:'+child,value);return {blocked,updatedAt:value.updatedAt};}
 return {provision,login,authorize,logout,changePassword,binding,access,setAccess};
}
const parents=createParentAccounts();
module.exports={createParentAccounts,parents,sessionToken,setSessionCookie,COOKIE};
