import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const client = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY) : null;
const keyFor = userId => `tralalerio_grants_${userId}`;
export async function getGrants(userId) {
  if (client) {
    const { data, error } = await client.from('kv_store').select('key,value').like('key', `${keyFor(userId)}:%`);
    if (error) throw new Error('지급 내역을 읽지 못했습니다.');
    return (data || []).map(row => row.value).sort((a,b) => a.createdAt.localeCompare(b.createdAt));
  }
  if (process.env.VERCEL) throw new Error('지급 내역 저장소가 설정되지 않았습니다.');
  const dir = path.join(process.cwd(), '.tralalerio-grants', userId);
  let files;
  try { files = await fs.readdir(dir); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  return Promise.all(files.filter(f => f.endsWith('.json')).sort().map(async f => JSON.parse(await fs.readFile(path.join(dir,f), 'utf8'))));
}
export async function saveGrant(userId, grant) {
  if (client) {
    const { error } = await client.from('kv_store').insert({ key: `${keyFor(userId)}:${grant.id}`, value: grant });
    if (error) throw new Error('지급 내역을 저장하지 못했습니다.');
    return;
  }
  if (process.env.VERCEL) throw new Error('지급 내역 저장소가 설정되지 않았습니다.');
  const dir = path.join(process.cwd(), '.tralalerio-grants', userId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${grant.id}.json`), JSON.stringify(grant), { flag: 'wx' });
}
