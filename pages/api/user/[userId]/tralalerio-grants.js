import { getUser } from '../../../../lib/stateManager';
import { getGrants } from '../../../../lib/tralalerioGrants';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).end();
  const { userId } = req.query;
  if (typeof userId !== 'string' || !/^[A-Za-z0-9]{4,10}$/.test(userId)) return res.status(400).end();
  try {
    if (!await getUser(userId)) return res.status(404).end();
    return res.json({ grants: await getGrants(userId) });
  } catch { return res.status(503).json({ error: '지급 내역을 불러오지 못했습니다.' }); }
}
