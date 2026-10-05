import fs from 'fs';
import path from 'path';
import { getUser } from '../../lib/stateManager';
export default function UserCreativePage() { return null; }
export async function getServerSideProps({ params, res }) {
  if (!/^[A-Za-z0-9]{4,10}$/.test(params.userId)) return { notFound: true };
  const user = await getUser(params.userId);
  if (!user) return { notFound: true };
  const context = JSON.stringify({ id: user.id, name: user.name }).replace(/</g, '\\u003c');
  let html = fs.readFileSync(path.join(process.cwd(), 'public/creative/index.html'), 'utf8');
  html = html.replace('</head>', `<script>window.__BLOCK_USER__=${context};</script></head>`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(html);
  return { props: {} };
}
