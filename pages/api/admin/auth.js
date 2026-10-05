const ADMIN_SECRET = process.env.ADMIN_SECRET || 'block-admin-2024';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (password === ADMIN_SECRET) {
    return res.status(200).json({ ok: true, secret: ADMIN_SECRET });
  }

  return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
}
