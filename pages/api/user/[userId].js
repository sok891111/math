import { getUser } from '../../../lib/stateManager';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  const user = await getUser(userId);

  if (!user) {
    return res.status(404).json({ error: '유저를 찾을 수 없습니다.' });
  }

  return res.status(200).json({
    id: user.id,
    name: user.name,
    createdAt: user.createdAt
  });
}
