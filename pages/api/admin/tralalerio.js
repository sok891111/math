import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { isValidSecret } from '../../../lib/authHelper';
import { getUser } from '../../../lib/stateManager';
import { getGrants, saveGrant } from '../../../lib/tralalerioGrants';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isValidSecret(req.headers['x-admin-secret'])) return res.status(401).json({ error: '관리자 로그인이 필요합니다.' });
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();
  try {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tralalerio/assets/battle-data.json'), 'utf8'));
    const userId = req.method === 'GET' ? req.query.userId : req.body?.userId;
    if (typeof userId !== 'string' || !/^[A-Za-z0-9]{4,10}$/.test(userId)) return res.status(400).json({ error: '아이를 선택해 주세요.' });
    if (!await getUser(userId)) return res.status(404).json({ error: '아이를 찾을 수 없습니다.' });
    if (req.method === 'GET') return res.json({ species: Object.entries(data.species).map(([id,s]) => ({ id, name:s.name })), grants: await getGrants(userId) });
    const { species, level, quantity } = req.body;
    if (!Object.hasOwn(data.species, species) || !Number.isInteger(level) || level < 1 || level > 100 || !Number.isInteger(quantity) || quantity < 1 || quantity > 30) return res.status(400).json({ error: '몬스터, 레벨(1~100), 마릿수(1~30)를 확인해 주세요.' });
    const grant = { id: randomUUID(), species, name: data.species[species].name, level, quantity, createdAt: new Date().toISOString() };
    await saveGrant(userId, grant);
    return res.json({ grant });
  } catch (e) { console.error('Monster grant failed:', e.message); return res.status(503).json({ error: '지급 내역 저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' }); }
}
