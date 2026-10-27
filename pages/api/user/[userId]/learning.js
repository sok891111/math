import {getUser} from '../../../../lib/stateManager';
import {parents,sessionToken} from '../../../../lib/parent/accounts.cjs';
import {isValidSecret} from '../../../../lib/authHelper';
import {createLearningRecords,validId} from '../../../../lib/learning/records.cjs';
const records=createLearningRecords();
export const config={api:{bodyParser:{sizeLimit:'768kb'}}};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const {userId}=req.query;
 if(!validId(userId))return res.status(400).json({error:'개인 코드가 올바르지 않습니다.'});
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).end();}

 if(req.method==='POST'&&req.headers.origin&&!['https://'+req.headers.host,'http://'+req.headers.host].includes(req.headers.origin))return res.status(403).json({error:'다른 사이트의 기록 요청은 허용하지 않습니다.'});
 try{
  if(req.method==='GET'&&!isValidSecret(req.headers['x-admin-secret'])&&!await parents.authorize(userId,sessionToken(req)))return res.status(401).json({error:'이 아이를 관리하는 부모 로그인이 필요합니다.'});
  const user=await getUser(userId);if(!user)return res.status(404).json({error:'아이를 찾을 수 없습니다.'});
  if(req.method==='POST')return res.json(await records.write(userId,req.body?.events));
  const result=await records.read(userId,req.query);return res.json({...result,child:{id:user.id,name:user.name}});
 }catch(error){console.error('[learning]',error.message);return res.status(error.status||503).json({error:error.status?error.message:'학습 기록 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'});}
}
