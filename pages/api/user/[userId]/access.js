import {getUser} from '../../../../lib/stateManager';
import {parents} from '../../../../lib/parent/accounts.cjs';
import {validId} from '../../../../lib/learning/records.cjs';
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');if(req.method!=='GET')return res.status(405).end();const {userId}=req.query;if(!validId(userId))return res.status(400).end();try{if(!await getUser(userId))return res.status(404).end();return res.json(await parents.access(userId));}catch{return res.status(503).json({error:'접근 설정을 확인하지 못했습니다.'});}}
