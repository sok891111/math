import fs from 'fs';
import path from 'path';
export default function CreativePage() { return null; }
export async function getServerSideProps({ res }) {
  const html = fs.readFileSync(path.join(process.cwd(), 'public/creative/index.html'), 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(html);
  return { props: {} };
}
