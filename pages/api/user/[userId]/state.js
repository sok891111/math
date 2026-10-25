import { getUser } from '../../../../lib/stateManager';
import { createCentralState } from '../../../../lib/central-state/store.cjs';
const state = createCentralState();
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const {userId} = req.query;
  if (typeof userId !== 'string' || !/^[A-Za-z0-9]{4,10}$/.test(userId)) return res.status(400).json({error: '잘못된 개인 코드입니다.'});
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();
  if (req.method === 'POST' && req.headers.origin && req.headers.origin !== `https://${req.headers.host}` && req.headers.origin !== `http://${req.headers.host}`) return res.status(403).end();
  try {
    if (!await getUser(userId)) return res.status(404).json({error: '사용자를 찾을 수 없습니다.'});
    if (req.method === 'GET') return res.json({games: await state.read(userId)});
    return res.json(await state.write(userId, req.body));
  } catch (error) {
    console.error('[central-state]', error.message);
    return res.status(error.status || 503).json({error: error.status ? error.message : '서버에 저장하지 못했어요. 기기의 기록은 보관됩니다.'});
  }
}
