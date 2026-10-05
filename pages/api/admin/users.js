import { getUsers, saveUsers } from '../../../lib/stateManager';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'block-admin-2024';

function generateUserId(existingIds) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let id;
  do {
    id = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (existingIds.includes(id));
  return id;
}

function checkAuth(req) {
  const secret = req.headers['x-admin-secret'];
  return secret === ADMIN_SECRET;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: '인증되지 않은 요청입니다.' });
  }

  if (req.method === 'GET') {
    const users = await getUsers();
    return res.status(200).json({ users });
  }

  if (req.method === 'POST') {
    const { name } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '아이 이름을 입력해주세요.' });
    }

    const users = await getUsers();
    const id = generateUserId(users.map(u => u.id));

    const newUser = {
      id,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveUsers(users);

    return res.status(200).json({ user: newUser });
  }

  if (req.method === 'DELETE') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const userId = body?.userId || req.query?.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId가 필요합니다.' });
    }

    let users = await getUsers();
    const beforeCount = users.length;
    users = users.filter(u => u.id !== userId);

    if (users.length === beforeCount) {
      return res.status(404).json({ error: '해당 유저를 찾을 수 없습니다.' });
    }

    await saveUsers(users);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
