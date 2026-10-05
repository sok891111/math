import { getUser, getUserBadges, saveUserBadges } from '../../../../lib/stateManager';

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!/^[A-Za-z0-9]{4,10}$/.test(userId)) {
    return res.status(400).json({ error: '유효하지 않은 유저 ID입니다.' });
  }

  const user = await getUser(userId);
  if (!user) {
    return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
  }

  if (req.method === 'GET') {
    const badges = await getUserBadges(userId);
    return res.status(200).json({ badges: badges || null });
  }

  if (req.method === 'POST') {
    const { badges } = req.body;
    if (!badges || typeof badges !== 'object') {
      return res.status(400).json({ error: '뱃지 데이터가 올바르지 않습니다.' });
    }
    await saveUserBadges(userId, badges);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
