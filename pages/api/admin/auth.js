import { isValidSecret, getPrimarySecret } from '../../../lib/authHelper';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  const { password } = body || {};
  if (isValidSecret(password)) {
    return res.status(200).json({ ok: true, secret: password.trim() });
  }

  return res.status(401).json({
    error: '비밀번호가 일치하지 않습니다.'
  });
}
