import {getUser} from '../../../lib/stateManager';
import {isValidSecret} from '../../../lib/authHelper';
import {parents} from '../../../lib/parent/accounts.cjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(!isValidSecret(req.headers['x-admin-secret']))return res.status(401).end();
 if(!['GET','POST'].includes(req.method))return res.status(405).end();
 if(req.method==='POST'&&req.headers.origin&&!['http://'+req.headers.host,'https://'+req.headers.host].includes(req.headers.origin))return res.status(403).end();
 try{const child=req.method==='GET'?req.query.userId:req.body?.userId;if(typeof child!=='string'||!await getUser(child))return res.status(404).json({error:'아이를 찾을 수 없습니다.'});
  if(req.method==='GET')return res.json({parentId:(await parents.binding(child))?.parentId||''});
  return res.json(await parents.provision(child,req.body));
 }catch(e){return res.status(e.status||503).json({error:e.status?e.message:'부모 계정을 저장하지 못했습니다.'});}
}
