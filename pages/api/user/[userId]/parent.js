import {getUser} from '../../../../lib/stateManager';
import {parents,sessionToken,setSessionCookie} from '../../../../lib/parent/accounts.cjs';
import {validId} from '../../../../lib/learning/records.cjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');const {userId}=req.query;
 if(!validId(userId))return res.status(400).json({error:'아이 코드가 올바르지 않습니다.'});
 if(!['GET','POST'].includes(req.method))return res.status(405).end();
 if(req.method==='POST'&&req.headers.origin&&!['http://'+req.headers.host,'https://'+req.headers.host].includes(req.headers.origin))return res.status(403).end();
 try{
  if(!await getUser(userId))return res.status(404).end();const token=sessionToken(req);
  if(req.method==='GET'){const owner=await parents.authorize(userId,token);return res.json({configured:Boolean(await parents.binding(userId)),authenticated:Boolean(owner),...(owner?{parentId:owner.id,access:await parents.access(userId)}:{})});}
  const body=req.body||{};
  if(body.action==='login'){const issued=await parents.login(userId,body.parentId,body.password);setSessionCookie(req,res,issued);return res.json({ok:true});}
  if(body.action==='logout'){await parents.logout(token);setSessionCookie(req,res,'');return res.json({ok:true});}
  if(body.action==='password'){const issued=await parents.changePassword(userId,token,body.currentPassword,body.newPassword);setSessionCookie(req,res,issued);return res.json({ok:true});}
  if(body.action==='access')return res.json({access:await parents.setAccess(userId,token,body.blocked)});
  return res.status(400).json({error:'지원하지 않는 요청입니다.'});
 }catch(e){return res.status(e.status||503).json({error:e.status?e.message:'부모 설정 서버에 연결하지 못했습니다.'});}
}
